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
    parser.add_argument("bundle", type=Path, nargs="?", default=Path("content/hsk4-lower-textbook-json"))
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
    source_analysis = load(root / "source-analysis.json")
    schema = load(root / "schemas" / "textbook-lesson.schema.json")
    schema_validator = Draft202012Validator(schema)
    lesson_files = sorted((root / "lessons").glob("lesson-*.json"))
    require(len(lesson_files) == 10, f"Expected 10 lesson files, found {len(lesson_files)}", errors)
    lessons = []
    for path in lesson_files:
        lesson = load(path)
        lessons.append(lesson)
        for issue in schema_validator.iter_errors(lesson):
            errors.append(f"Schema {path.name} at {'/'.join(map(str, issue.path))}: {issue.message}")

    pages = load(root / "shared" / "source-pages.json")["pages"]
    lexemes = load(root / "shared" / "lexemes.json")["lexemes"]
    vocabulary = load(root / "vocabulary.json")["vocabulary"]
    texts = load(root / "shared" / "texts.json")["texts"]
    media = load(root / "shared" / "media-assets.json")["assets"]
    proper_names = load(root / "shared" / "proper-names.json")["properNames"]
    cultures = load(root / "shared" / "culture-notes.json")["cultureNotes"]
    comparisons = load(root / "shared" / "comparison-notes.json")["comparisons"]
    same_groups = load(root / "shared" / "same-character-groups.json")["groups"]
    block_names = ["warmup", "pinyin-transcript", "annotation", "practice", "comparison", "extension", "application", "culture"]
    blocks = {name: load(root / "shared" / f"{name}-blocks.json")["blocks"] for name in block_names}

    require(len(pages) == 174, f"Expected 174 OCR pages, found {len(pages)}", errors)
    require(len(texts) == 50, f"Expected 50 lesson texts, found {len(texts)}", errors)
    require(len(media) == 50, f"Expected 50 audio placeholders, found {len(media)}", errors)
    require(len(cultures) == 10, f"Expected 10 culture notes, found {len(cultures)}", errors)
    require(len(comparisons) == 10, f"Expected 10 comparison notes, found {len(comparisons)}", errors)
    require(len(same_groups) == 10, f"Expected 10 same-character groups, found {len(same_groups)}", errors)
    require(len(blocks["warmup"]) == 10, f"Expected 10 warmup blocks, found {len(blocks['warmup'])}", errors)
    require(len(blocks["pinyin-transcript"]) == 20, f"Expected 20 pinyin transcript page blocks, found {len(blocks['pinyin-transcript'])}", errors)
    require(len(blocks["annotation"]) == 20, f"Expected 20 annotation page blocks, found {len(blocks['annotation'])}", errors)
    for kind in ("comparison", "extension", "application", "culture"):
        require(len(blocks[kind]) == 10, f"Expected 10 {kind} blocks, found {len(blocks[kind])}", errors)
    require(250 <= len(lexemes) <= 360, f"Expected roughly 300 lexemes, found {len(lexemes)}", errors)
    require(len(vocabulary) == len(lexemes), "Vocabulary and lexeme counts must match", errors)
    require([item["id"] for item in vocabulary] == [item["id"] for item in lexemes], "Vocabulary IDs must match lexeme IDs", errors)

    page_by_id = {page["id"]: page for page in pages}
    lesson_by_id = {lesson["id"]: lesson for lesson in lessons}
    text_by_id = {text["id"]: text for text in texts}
    lexeme_by_id = {entry["id"]: entry for entry in lexemes}
    media_by_id = {asset["id"]: asset for asset in media}
    culture_by_id = {entry["id"]: entry for entry in cultures}
    comparison_by_id = {entry["id"]: entry for entry in comparisons}
    same_group_by_id = {entry["id"]: entry for entry in same_groups}
    block_by_id = {block["id"]: block for values in blocks.values() for block in values}

    require(len(page_by_id) == len(pages), "Duplicate source-page IDs", errors)
    require(len(text_by_id) == len(texts), "Duplicate text IDs", errors)
    require(len(lexeme_by_id) == len(lexemes), "Duplicate lexeme IDs", errors)
    require(len(media_by_id) == len(media), "Duplicate media IDs", errors)
    require(len(block_by_id) == sum(len(values) for values in blocks.values()), "Duplicate block IDs", errors)

    def validate_rows(entity_id: str, page_ref: str | None, indexes: list[int]) -> None:
        if page_ref is None:
            return
        page = page_by_id.get(page_ref)
        require(page is not None, f"{entity_id} unresolved source page {page_ref}", errors)
        if page is not None:
            valid = {row["rowIndex"] for row in page["rows"]}
            for index in indexes:
                require(index in valid, f"{entity_id} invalid row index {index}", errors)

    expected_numbers = list(range(11, 21))
    require([lesson["lessonNumber"] for lesson in lessons] == expected_numbers, "Lesson numbers must be 11-20", errors)
    previous_end = None
    for lesson in lessons:
        start, end = lesson["source"]["pdfPages"]
        require(start <= end, f"{lesson['id']} invalid page range", errors)
        if previous_end is not None:
            require(start == previous_end + 1, f"{lesson['id']} must follow the previous lesson without overlap", errors)
        previous_end = end
        require(not lesson["source"].get("missingPrintedPages"), f"{lesson['id']} should not declare missing pages", errors)
        for ref in lesson["source"]["sourcePageRefs"]:
            require(ref in page_by_id, f"{lesson['id']} unresolved source page ref {ref}", errors)
        sections = {section["type"]: section for section in lesson["sections"]}
        text_refs = sections.get("texts", {}).get("contentRefs", [])
        require(len(text_refs) == 5, f"{lesson['id']} must reference 5 texts", errors)
        for ref in text_refs:
            require(ref in text_by_id, f"{lesson['id']} unresolved text ref {ref}", errors)
        vocab_refs = sections.get("vocabulary", {}).get("contentRefs", [])
        require(len(vocab_refs) >= 20, f"{lesson['id']} has too few vocabulary refs ({len(vocab_refs)})", errors)
        for ref in vocab_refs:
            require(ref in lexeme_by_id, f"{lesson['id']} unresolved lexeme ref {ref}", errors)
        for section in lesson["sections"]:
            if section["type"] in ("warmup", "pinyin-transcript", "annotation", "practice", "extension", "application"):
                for ref in section.get("contentRefs", []):
                    require(ref in block_by_id, f"{lesson['id']} unresolved block ref {ref}", errors)
            if section["type"] == "comparison":
                for ref in section.get("contentRefs", []):
                    require(ref in comparison_by_id, f"{lesson['id']} unresolved comparison ref {ref}", errors)
            if section["type"] == "same-character-words":
                for ref in section.get("contentRefs", []):
                    require(ref in same_group_by_id, f"{lesson['id']} unresolved same-character ref {ref}", errors)
            if section["type"] == "culture":
                for ref in section.get("contentRefs", []):
                    require(ref in culture_by_id, f"{lesson['id']} unresolved culture ref {ref}", errors)
        for kind in ("comparison", "extension", "application", "culture"):
            lesson_blocks = [block for block in blocks[kind] if block["lessonRef"] == lesson["id"]]
            require(len(lesson_blocks) == 1, f"{lesson['id']} must have exactly one {kind} block", errors)

    for text in texts:
        require(text["lessonRef"] in lesson_by_id, f"{text['id']} unresolved lesson ref", errors)
        require(text["audioRef"] in media_by_id, f"{text['id']} unresolved media ref", errors)
        validate_rows(text["id"], text["sourcePageRef"], text["sourceRowIndexes"])

    for entry in lexemes:
        require(entry["lessonRef"] in lesson_by_id, f"{entry['id']} unresolved lesson ref", errors)
        validate_rows(entry["id"], entry["sourcePageRef"], entry["sourceRowIndexes"])
        if entry["hanzi"]:
            require(bool(entry["pinyin"]), f"{entry['id']} missing pinyin", errors)

    for name in proper_names:
        require(name["lessonRef"] in lesson_by_id, f"{name['id']} unresolved lesson ref", errors)
        require(bool(name["hanzi"]), f"{name['id']} missing Hanzi", errors)
        require(any("\u3400" <= char <= "\u9fff" for char in name["hanzi"]), f"{name['id']} has no CJK character", errors)
        validate_rows(name["id"], name["sourcePageRef"], name["sourceRowIndexes"])
    require(len(proper_names) == 10, "Expected 10 inline proper-name records", errors)
    for culture in cultures:
        require(culture["lessonRef"] in lesson_by_id, f"{culture['id']} unresolved lesson ref", errors)
        validate_rows(culture["id"], culture["sourcePageRef"], culture["sourceRowIndexes"])
    for values in blocks.values():
        for block in values:
            require(block["lessonRef"] in lesson_by_id, f"{block['id']} unresolved lesson ref", errors)
            validate_rows(block["id"], block["sourcePageRef"], block["sourceRowIndexes"])

    answer_key = load(root / "appendices" / "answer-key.json")
    require(len(answer_key["sourcePageRefs"]) == 11, "Answer key must reference 11 pages", errors)
    require(answer_key["sourcePageRefs"] == [f"hsk4l-tb-source-page-{number:03d}" for number in range(164, 175)], "Answer-key page refs must be PDF pages 164-174", errors)
    require(source_analysis.get("sourceGaps") == [], "Source analysis must not invent missing pages", errors)

    compiled = load(root / "hsk4-lower-textbook.json")
    require(compiled["bundleId"] == manifest["bundleId"], "Compiled bundle ID mismatch", errors)
    require(len(compiled["lessons"]) == len(lessons), "Compiled lesson count mismatch", errors)
    require(len(compiled["content"]["texts"]) == len(texts), "Compiled text count mismatch", errors)
    require(len(compiled["content"]["lexemes"]) == len(lexemes), "Compiled lexeme count mismatch", errors)
    require(len(compiled["vocabulary"]) == len(vocabulary), "Compiled vocabulary count mismatch", errors)
    require(len(compiled["ocrEvidence"]["pages"]) == len(pages), "Compiled OCR page count mismatch", errors)

    for entry in manifest["files"]:
        require((root / entry["path"]).exists(), f"Manifest references missing file {entry['path']}", errors)
    counts = manifest["counts"]
    require(counts["lessons"] == len(lessons), "Manifest lesson count mismatch", errors)
    require(counts["texts"] == len(texts), "Manifest text count mismatch", errors)
    require(counts["lexemes"] == len(lexemes), "Manifest lexeme count mismatch", errors)
    require(counts["properNames"] == len(proper_names), "Manifest proper-name count mismatch", errors)
    require(counts["mediaPlaceholders"] == len(media), "Manifest media count mismatch", errors)
    require(counts["answerKeyPages"] == 11, "Manifest answer-key count mismatch", errors)

    lexeme_stubs = sum(entry["hanzi"] is None for entry in lexemes)
    text_stubs = sum(not text["lines"] for text in texts)
    low_confidence = sum(1 for page in pages for row in page["rows"] if not row["isNoise"] and row["minConfidence"] < 0.75)
    print(f"JSON files: {len(json_files)}")
    print(f"Lessons: {len(lessons)}")
    print(f"Texts: {len(texts)} ({text_stubs} OCR text stubs)")
    print(f"Lexeme records: {len(lexemes)} ({lexeme_stubs} OCR anchor stubs)")
    print(f"Proper names: {len(proper_names)}")
    print(f"Culture notes: {len(cultures)}")
    print(f"Media placeholders: {len(media)}")
    print(f"Content blocks: {sum(len(values) for values in blocks.values())}")
    print(f"OCR source pages: {len(pages)}")
    print(f"Answer-key pages: {len(answer_key['sourcePageRefs'])}")
    print(f"Non-noise OCR rows below 0.75 confidence: {low_confidence}")
    if errors:
        print("VALIDATION FAILED")
        for error in errors:
            print(f"- {error}")
        raise SystemExit(1)
    print("VALIDATION PASSED")


if __name__ == "__main__":
    main()
