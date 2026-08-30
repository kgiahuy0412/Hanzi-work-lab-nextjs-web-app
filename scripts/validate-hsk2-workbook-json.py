from __future__ import annotations

import argparse
import json
from pathlib import Path

from jsonschema import Draft202012Validator


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def require(condition: bool, message: str, errors: list[str]) -> None:
    if not condition:
        errors.append(message)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("bundle", type=Path, nargs="?", default=Path("content/hsk2-workbook-json"))
    args = parser.parse_args()
    root = args.bundle
    errors: list[str] = []

    json_files = sorted(root.rglob("*.json"))
    require(bool(json_files), "No JSON files found", errors)
    for path in json_files:
        try:
            load(path)
        except Exception as exc:
            errors.append(f"Invalid JSON {path}: {exc}")

    manifest = load(root / "manifest.json")
    schema = load(root / "schemas" / "workbook-lesson.schema.json")
    validator = Draft202012Validator(schema)
    lesson_files = sorted((root / "lessons").glob("lesson-*.json"))
    require(len(lesson_files) == 15, f"Expected 15 lesson files, found {len(lesson_files)}", errors)
    lessons = []
    for path in lesson_files:
        lesson = load(path)
        lessons.append(lesson)
        for issue in validator.iter_errors(lesson):
            errors.append(f"Schema {path.name} at {'/'.join(map(str, issue.path))}: {issue.message}")

    groups = load(root / "shared" / "exercise-groups.json")["groups"]
    items = load(root / "shared" / "exercise-items.json")["items"]
    media = load(root / "shared" / "media-assets.json")["assets"]
    source_pages = load(root / "shared" / "source-pages.json")["pages"]
    mock = load(root / "mock-exam.json")

    require(len(groups) == 135, f"Expected 135 lesson groups, found {len(groups)}", errors)
    require(len(items) == 525, f"Expected 525 lesson questions, found {len(items)}", errors)
    require(len(media) == 31, f"Expected 31 media placeholders, found {len(media)}", errors)
    require(len(source_pages) == 166, f"Expected 166 OCR pages (3-168), found {len(source_pages)}", errors)
    require(len(mock["groups"]) == 8, f"Expected 8 mock groups, found {len(mock['groups'])}", errors)
    require(len(mock["items"]) == 60, f"Expected 60 mock items, found {len(mock['items'])}", errors)

    group_by_id = {group["id"]: group for group in groups}
    item_by_id = {item["id"]: item for item in items}
    media_by_id = {asset["id"]: asset for asset in media}
    page_by_id = {page["id"]: page for page in source_pages}
    require(len(group_by_id) == len(groups), "Duplicate exercise group IDs", errors)
    require(len(item_by_id) == len(items), "Duplicate lesson item IDs", errors)
    require(len(media_by_id) == len(media), "Duplicate media IDs", errors)
    require(len(page_by_id) == len(source_pages), "Duplicate source page IDs", errors)

    for lesson in lessons:
        refs = [ref for section in lesson["sections"] for ref in section["exerciseGroupRefs"]]
        for ref in refs:
            require(ref in group_by_id, f"{lesson['id']} unresolved group ref {ref}", errors)
        require(len(refs) == 9, f"{lesson['id']} should reference 9 groups, found {len(refs)}", errors)
        lesson_items = [item for item in items if item["lessonRef"] == lesson["id"]]
        require(len(lesson_items) == 35, f"{lesson['id']} should have 35 items, found {len(lesson_items)}", errors)
        require(sorted(item["questionNumber"] for item in lesson_items) == list(range(1, 36)), f"{lesson['id']} question coverage is not 1-35", errors)

    for group in groups:
        for ref in group.get("itemRefs", []):
            require(ref in item_by_id, f"{group['id']} unresolved item ref {ref}", errors)
        for ref in group.get("sourcePageRefs", []):
            require(ref in page_by_id, f"{group['id']} unresolved page ref {ref}", errors)
        audio_ref = group.get("audioRef")
        if audio_ref:
            require(audio_ref in media_by_id, f"{group['id']} unresolved audio ref {audio_ref}", errors)

    for item in items:
        require(item["groupRef"] in group_by_id, f"{item['id']} unresolved group ref", errors)
        require(item["sourcePageRef"] in page_by_id, f"{item['id']} unresolved source page ref", errors)
        require(item["answer"]["status"] == "not-provided-in-source-pdf", f"{item['id']} answer status changed unexpectedly", errors)
        require(item["answer"]["correctResponse"] is None, f"{item['id']} has an unsupported answer", errors)
        for row_ref in item["sourceRowRefs"]:
            page = page_by_id.get(row_ref["pageRef"])
            require(page is not None, f"{item['id']} unresolved row page ref {row_ref['pageRef']}", errors)
            if page is not None:
                valid_indexes = {row["rowIndex"] for row in page["rows"]}
                for index in row_ref["rowIndexes"]:
                    require(index in valid_indexes, f"{item['id']} invalid row index {index}", errors)
        if item["exerciseType"] == "listen-multiple-choice":
            require(len(item["content"]["options"]) == 3, f"{item['id']} should have 3 printed options", errors)

    bank_groups = [group for group in groups if group.get("optionBank")]
    require(len(bank_groups) == 30, f"Expected 30 lesson option banks, found {len(bank_groups)}", errors)
    for group in bank_groups:
        require(len(group["optionBank"]["options"]) == 6, f"{group['id']} should have 6 bank options", errors)

    for item in mock["items"]:
        require(item["answer"]["status"] == "not-provided-in-source-pdf", f"{item['id']} answer status changed unexpectedly", errors)
        require(item["answer"]["correctResponse"] is None, f"{item['id']} has an unsupported answer", errors)
        require(item.get("sourcePageRef") in page_by_id, f"{item['id']} unresolved source page ref", errors)
        if item["exerciseType"] == "listen-multiple-choice":
            require(len(item["content"]["options"]) == 3, f"{item['id']} should have 3 printed options", errors)

    for group in mock["groups"]:
        audio_ref = group.get("audioRef")
        if audio_ref:
            require(audio_ref in media_by_id, f"{group['id']} unresolved audio ref {audio_ref}", errors)
        if group.get("optionBank"):
            require(len(group["optionBank"]["options"]) == 6, f"{group['id']} should have 6 bank options", errors)

    manifest_counts = manifest["counts"]
    require(manifest_counts["lessons"] == len(lessons), "Manifest lesson count mismatch", errors)
    require(manifest_counts["lessonExerciseGroups"] == len(groups), "Manifest group count mismatch", errors)
    require(manifest_counts["lessonQuestions"] == len(items), "Manifest item count mismatch", errors)
    require(manifest_counts["mockExamQuestions"] == len(mock["items"]), "Manifest mock count mismatch", errors)

    referenced_files = [root / entry["path"] for entry in manifest["files"]]
    for path in referenced_files:
        require(path.exists(), f"Manifest references missing file {path}", errors)

    low_confidence = sum(
        1
        for page in source_pages
        for row in page["rows"]
        if not row["isNoise"] and row["minConfidence"] < 0.75
    )
    transcribed_items = sum(bool(item["content"]["printedChineseSegments"]) for item in items)
    mock_page_referenced = sum(item.get("sourcePageRef") is not None for item in mock["items"])

    print(f"JSON files: {len(json_files)}")
    print(f"Lessons: {len(lessons)}")
    print(f"Lesson groups: {len(groups)}")
    print(f"Lesson questions: {len(items)}")
    print(f"Questions with printed Chinese OCR: {transcribed_items}")
    print(f"Mock questions: {len(mock['items'])} ({mock_page_referenced} source-page refs assigned)")
    print(f"Media placeholders: {len(media)}")
    print(f"OCR source pages: {len(source_pages)}")
    print(f"Non-noise OCR rows below 0.75 confidence: {low_confidence}")
    if errors:
        print("VALIDATION FAILED")
        for error in errors:
            print(f"- {error}")
        raise SystemExit(1)
    print("VALIDATION PASSED")


if __name__ == "__main__":
    main()
