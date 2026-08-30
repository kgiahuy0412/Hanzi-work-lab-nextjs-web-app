from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path

from jsonschema import Draft202012Validator


EXPECTED_VOCAB_COUNTS = [12, 14, 14, 13, 14, 13, 13, 10, 11, 9, 11, 9, 11, 7, 8]
EXPECTED_LESSON_RANGES = [
    (15, 22), (23, 30), (31, 38), (39, 46), (47, 53),
    (55, 62), (63, 70), (71, 78), (79, 86), (87, 93),
    (95, 102), (103, 110), (111, 118), (119, 126), (127, 133),
]


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def require(condition: bool, message: str, errors: list[str]) -> None:
    if not condition:
        errors.append(message)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("bundle", type=Path, nargs="?", default=Path("content/hsk2-textbook-json"))
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
    combined = load(root / "hsk2-textbook.json")
    schema = load(root / "schemas" / "textbook-lesson.schema.json")
    validator = Draft202012Validator(schema)

    lessons = [load(path) for path in sorted((root / "lessons").glob("lesson-*.json"))]
    pages = load(root / "shared" / "source-pages.json")["pages"]
    lexemes = load(root / "shared" / "lexemes.json")["lexemes"]
    scenes = load(root / "shared" / "text-scenes.json")["scenes"]
    grammar_points = load(root / "shared" / "grammar-points.json")["grammarPoints"]
    pronunciation_topics = load(root / "shared" / "pronunciation-topics.json")["pronunciationTopics"]
    media = load(root / "shared" / "media-assets.json")["assets"]
    proper_names = load(root / "shared" / "proper-names.json")["properNames"]
    cultures = load(root / "shared" / "culture-notes.json")["cultureNotes"]

    block_kinds = ["warmup", "pinyin-transcript", "grammar", "practice", "pronunciation", "hanzi", "application"]
    blocks = {
        kind: load(root / "shared" / f"{kind}-blocks.json")["blocks"]
        for kind in block_kinds
    }

    require(len(lessons) == 15, f"Expected 15 lessons, found {len(lessons)}", errors)
    require(len(pages) == 145, f"Expected 145 mapped source pages, found {len(pages)}", errors)
    require(len(lexemes) == 169, f"Expected 169 numbered vocabulary records, found {len(lexemes)}", errors)
    require(len(scenes) == 60, f"Expected 60 dialogue scenes, found {len(scenes)}", errors)
    require(len(grammar_points) == 44, f"Expected 44 grammar points, found {len(grammar_points)}", errors)
    require(len(pronunciation_topics) == 15, f"Expected 15 pronunciation topics, found {len(pronunciation_topics)}", errors)
    require(len(media) == 60, f"Expected 60 media placeholders, found {len(media)}", errors)
    require(len(cultures) == 3, f"Expected 3 culture notes, found {len(cultures)}", errors)
    require(len(proper_names) >= 2, f"Expected at least 2 proper names, found {len(proper_names)}", errors)
    require(len(combined["lessons"]) == 15, "Combined export lesson count mismatch", errors)
    require(len(combined["textScenes"]) == 60, "Combined export scene count mismatch", errors)
    require(len(combined["lexemes"]) == 169, "Combined export vocabulary count mismatch", errors)
    require(len(combined["grammarPoints"]) == 44, "Combined export grammar count mismatch", errors)

    page_by_id = {item["id"]: item for item in pages}
    lesson_by_id = {item["id"]: item for item in lessons}
    lexeme_by_id = {item["id"]: item for item in lexemes}
    scene_by_id = {item["id"]: item for item in scenes}
    grammar_by_id = {item["id"]: item for item in grammar_points}
    pronunciation_by_id = {item["id"]: item for item in pronunciation_topics}
    media_by_id = {item["id"]: item for item in media}
    block_by_id = {item["id"]: item for values in blocks.values() for item in values}

    for name, values, index in (
        ("page", pages, page_by_id),
        ("lesson", lessons, lesson_by_id),
        ("lexeme", lexemes, lexeme_by_id),
        ("scene", scenes, scene_by_id),
        ("grammar", grammar_points, grammar_by_id),
        ("pronunciation", pronunciation_topics, pronunciation_by_id),
        ("media", media, media_by_id),
    ):
        require(len(values) == len(index), f"Duplicate {name} IDs", errors)

    require([page["pdfPage"] for page in pages] == list(range(1, 146)), "Source pages must cover PDF pages 1-145 in order", errors)
    ocr_pages = [page for page in pages if page["ocr"]["status"] == "machine-transcribed-needs-review"]
    require(len(ocr_pages) == source_analysis["coverage"]["ocrSourcePages"], "OCR page count mismatch", errors)

    for lesson, expected_range, expected_vocab_count in zip(lessons, EXPECTED_LESSON_RANGES, EXPECTED_VOCAB_COUNTS):
        for issue in validator.iter_errors(lesson):
            errors.append(f"Schema {lesson['id']} at {'/'.join(map(str, issue.path))}: {issue.message}")
        require(tuple(lesson["source"]["pdfPages"]) == expected_range, f"{lesson['id']} has incorrect source range", errors)
        require(not lesson["source"].get("missingPrintedPages"), f"{lesson['id']} must not declare missing pages", errors)
        for ref in lesson["source"]["sourcePageRefs"]:
            require(ref in page_by_id, f"{lesson['id']} has unresolved page ref {ref}", errors)

        sections = {section["type"]: section for section in lesson["sections"]}
        dialogue_refs = sections["texts"]["contentRefs"]
        vocab_refs = sections["vocabulary"]["contentRefs"]
        require(len(dialogue_refs) == 4, f"{lesson['id']} must reference four scenes", errors)
        require(len(vocab_refs) == expected_vocab_count, f"{lesson['id']} vocabulary count mismatch", errors)
        for ref in dialogue_refs:
            require(ref in scene_by_id, f"{lesson['id']} unresolved scene ref {ref}", errors)
        for ref in vocab_refs:
            require(ref in lexeme_by_id, f"{lesson['id']} unresolved lexeme ref {ref}", errors)
        for ref in sections["grammar"]["contentRefs"]:
            require(ref in grammar_by_id, f"{lesson['id']} unresolved grammar ref {ref}", errors)
        for ref in sections["pronunciation"]["contentRefs"]:
            require(ref in pronunciation_by_id, f"{lesson['id']} unresolved pronunciation ref {ref}", errors)
        for section in sections.values():
            for ref in section.get("sourceBlockRefs", []):
                require(ref in block_by_id, f"{lesson['id']} unresolved source block ref {ref}", errors)

    vocab_counts = Counter(int(item["lessonRef"][-2:]) for item in lexemes)
    require([vocab_counts[number] for number in range(1, 16)] == EXPECTED_VOCAB_COUNTS, "Per-lesson vocabulary counts mismatch", errors)
    for item in lexemes:
        require(item["lessonRef"] in lesson_by_id, f"{item['id']} unresolved lesson ref", errors)
        require(bool(item.get("hanzi")), f"{item['id']} missing hanzi", errors)
        require(bool(item.get("pinyin")), f"{item['id']} missing pinyin", errors)
        require(bool(item.get("meaningVi")), f"{item['id']} missing Vietnamese meaning", errors)
        require(item.get("sourcePageRef") in page_by_id, f"{item['id']} unresolved source page", errors)

    scenes_by_lesson = Counter(item["lessonRef"] for item in scenes)
    for lesson_id in lesson_by_id:
        require(scenes_by_lesson[lesson_id] == 4, f"{lesson_id} must contain four scene records", errors)
    for scene in scenes:
        require(scene["lessonRef"] in lesson_by_id, f"{scene['id']} unresolved lesson ref", errors)
        require(scene["sourcePageRef"] in page_by_id, f"{scene['id']} unresolved source page", errors)
        require(scene["audioRef"] in media_by_id, f"{scene['id']} unresolved media ref", errors)
        require(bool(scene["title"].get("zh")), f"{scene['id']} missing Chinese scene title", errors)
        require(bool(scene["title"].get("pinyin")), f"{scene['id']} missing scene-title pinyin", errors)
        require(bool(scene["lines"]), f"{scene['id']} has no recognized or recovered dialogue lines", errors)
        for line in scene["lines"]:
            require(bool(line.get("textZh")), f"{scene['id']} has an empty Chinese line", errors)
            require(bool(line.get("pinyin")), f"{scene['id']} line missing pinyin", errors)

    for item in grammar_points + pronunciation_topics + proper_names + cultures:
        require(item["sourcePageRef"] in page_by_id, f"{item['id']} unresolved source page", errors)

    for values in blocks.values():
        for block in values:
            require(block["lessonRef"] in lesson_by_id, f"{block['id']} unresolved lesson ref", errors)
            require(block["sourcePageRef"] in page_by_id, f"{block['id']} unresolved source page", errors)

    for entry in manifest["files"]:
        require((root / entry["path"]).exists(), f"Manifest references missing file {entry['path']}", errors)
    counts = manifest["counts"]
    require(counts["lessons"] == len(lessons), "Manifest lesson count mismatch", errors)
    require(counts["textScenes"] == len(scenes), "Manifest scene count mismatch", errors)
    require(counts["lexemes"] == len(lexemes), "Manifest lexeme count mismatch", errors)
    require(counts["grammarPoints"] == len(grammar_points), "Manifest grammar count mismatch", errors)
    require(counts["pronunciationTopics"] == len(pronunciation_topics), "Manifest pronunciation count mismatch", errors)
    require(counts["ocrSourcePages"] == len(ocr_pages), "Manifest OCR page count mismatch", errors)
    require(counts["mappedSourcePages"] == len(pages), "Manifest mapped page count mismatch", errors)

    print(f"JSON files: {len(json_files)}")
    print(f"Lessons: {len(lessons)}")
    print(f"Dialogue scenes: {len(scenes)}")
    print(f"Numbered vocabulary records: {len(lexemes)}")
    print(f"Grammar points: {len(grammar_points)}")
    print(f"Pronunciation topics: {len(pronunciation_topics)}")
    print(f"OCR pages: {len(ocr_pages)} / mapped pages: {len(pages)}")
    if errors:
        print("VALIDATION FAILED")
        for error in errors:
            print(f"- {error}")
        raise SystemExit(1)
    print("VALIDATION PASSED")


if __name__ == "__main__":
    main()
