from __future__ import annotations

import argparse
import json
from pathlib import Path

from jsonschema import Draft202012Validator


EXPECTED_VOCAB_COUNTS = [15, 18, 17, 16, 13, 15, 12, 17, 13, 15, 19, 14, 15, 17, 21, 16, 16, 17, 14, 14]


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def require(condition: bool, message: str, errors: list[str]) -> None:
    if not condition:
        errors.append(message)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("bundle", type=Path, nargs="?", default=Path("content/hsk3-textbook-json"))
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
    validator = Draft202012Validator(schema)
    lesson_files = sorted((root / "lessons").glob("lesson-*.json"))
    require(len(lesson_files) == 20, f"Expected 20 lesson files, found {len(lesson_files)}", errors)
    lessons = []
    for path in lesson_files:
        lesson = load(path)
        lessons.append(lesson)
        for issue in validator.iter_errors(lesson):
            errors.append(f"Schema {path.name} at {'/'.join(map(str, issue.path))}: {issue.message}")

    pages = load(root / "shared" / "source-pages.json")["pages"]
    lexemes = load(root / "shared" / "lexemes.json")["lexemes"]
    scenes = load(root / "shared" / "text-scenes.json")["scenes"]
    media = load(root / "shared" / "media-assets.json")["assets"]
    proper_names = load(root / "shared" / "proper-names.json")["properNames"]
    cultures = load(root / "shared" / "culture-notes.json")["cultureNotes"]
    block_names = ["warmup", "pinyin-transcript", "grammar", "practice", "hanzi", "application", "idiom"]
    blocks = {}
    for name in block_names:
        blocks[name] = load(root / "shared" / f"{name}-blocks.json")["blocks"]

    require(len(pages) == 204, f"Expected 204 OCR pages (3-206), found {len(pages)}", errors)
    require(len(scenes) == 80, f"Expected 80 text scenes, found {len(scenes)}", errors)
    require(len(media) == 80, f"Expected 80 audio placeholders, found {len(media)}", errors)
    require(len(cultures) == 4, f"Expected 4 culture notes, found {len(cultures)}", errors)
    require(len(lexemes) == sum(EXPECTED_VOCAB_COUNTS), f"Expected 314 lexeme records, found {len(lexemes)}", errors)
    require(len(blocks["warmup"]) == 20, f"Expected 20 warmup blocks, found {len(blocks['warmup'])}", errors)

    page_by_id = {page["id"]: page for page in pages}
    lesson_by_id = {lesson["id"]: lesson for lesson in lessons}
    scene_by_id = {scene["id"]: scene for scene in scenes}
    lexeme_by_id = {entry["id"]: entry for entry in lexemes}
    media_by_id = {asset["id"]: asset for asset in media}
    block_by_id = {block["id"]: block for values in blocks.values() for block in values}
    require(len(page_by_id) == len(pages), "Duplicate page IDs", errors)
    require(len(scene_by_id) == len(scenes), "Duplicate scene IDs", errors)
    require(len(lexeme_by_id) == len(lexemes), "Duplicate lexeme IDs", errors)
    require(len(media_by_id) == len(media), "Duplicate media IDs", errors)
    require(len(block_by_id) == sum(len(values) for values in blocks.values()), "Duplicate content-block IDs", errors)

    def validate_rows(entity_id: str, page_ref: str | None, indexes: list[int]) -> None:
        if page_ref is None:
            return
        page = page_by_id.get(page_ref)
        require(page is not None, f"{entity_id} unresolved page ref {page_ref}", errors)
        if page is not None:
            valid = {row["rowIndex"] for row in page["rows"]}
            for index in indexes:
                require(index in valid, f"{entity_id} invalid row index {index}", errors)

    previous_end = None
    for lesson in lessons:
        start, end = lesson["source"]["pdfPages"]
        require(start <= end, f"{lesson['id']} invalid PDF page range", errors)
        if previous_end is not None:
            require(start > previous_end, f"{lesson['id']} overlaps previous lesson", errors)
        previous_end = end
        for ref in lesson["source"]["sourcePageRefs"]:
            require(ref in page_by_id, f"{lesson['id']} unresolved source page ref {ref}", errors)
        refs_by_type = {section["type"]: section.get("contentRefs", []) for section in lesson["sections"]}
        require(len(refs_by_type.get("texts", [])) == 4, f"{lesson['id']} should reference 4 scenes", errors)
        for ref in refs_by_type.get("texts", []):
            require(ref in scene_by_id, f"{lesson['id']} unresolved scene ref {ref}", errors)
        lesson_lexemes = refs_by_type.get("vocabulary", [])
        has_source_gap = bool(lesson["source"].get("missingPrintedPages"))
        expected_vocab = EXPECTED_VOCAB_COUNTS[lesson["lessonNumber"] - 1]
        require(
            len(lesson_lexemes) == expected_vocab,
            f"{lesson['id']} expected {expected_vocab} lexeme refs, found {len(lesson_lexemes)}",
            errors,
        )
        if lesson["lessonNumber"] == 18:
            require(has_source_gap, "Lesson 18 must declare its missing printed pages", errors)
            require(lesson["source"].get("missingPrintedPages") == [168, 169], "Lesson 18 source gap must be printed pages 168-169", errors)
        else:
            require(not has_source_gap, f"{lesson['id']} must not declare an OCR-footer miss as a missing source page", errors)
        for ref in lesson_lexemes:
            require(ref in lexeme_by_id, f"{lesson['id']} unresolved lexeme ref {ref}", errors)
        for section_type in ("warmup", "pinyin-transcript", "grammar", "practice", "hanzi", "application", "idiom"):
            for ref in refs_by_type.get(section_type, []):
                require(ref in block_by_id, f"{lesson['id']} unresolved block ref {ref}", errors)

    for scene in scenes:
        require(scene["lessonRef"] in lesson_by_id, f"{scene['id']} unresolved lesson ref", errors)
        require(scene["audioRef"] in media_by_id, f"{scene['id']} unresolved media ref", errors)
        validate_rows(scene["id"], scene["sourcePageRef"], scene["sourceRowIndexes"])

    scene_stubs_list = [scene for scene in scenes if not scene["lines"]]
    require(len(scene_stubs_list) == 4, f"Expected exactly four scene stubs, found {len(scene_stubs_list)}", errors)
    require(
        all(scene["lessonRef"] == "hsk3-tb-lesson-18" for scene in scene_stubs_list),
        "Only lesson 18 may contain scene stubs",
        errors,
    )
    require(
        all(scene["transcriptionStatus"] == "source-pages-missing-cannot-transcribe" for scene in scene_stubs_list),
        "Lesson-18 scene stubs must be labelled as missing-source-page gaps",
        errors,
    )

    for entry in lexemes:
        require(entry["lessonRef"] in lesson_by_id, f"{entry['id']} unresolved lesson ref", errors)
        validate_rows(entry["id"], entry["sourcePageRef"], entry["sourceRowIndexes"])
        if entry.get("appendixSourcePageRef"):
            validate_rows(entry["id"] + " appendix", entry["appendixSourcePageRef"], entry.get("appendixSourceRowIndexes", []))
        if entry["hanzi"]:
            require(bool(entry["pinyin"]), f"{entry['id']} missing derived pinyin", errors)

    lexeme_stubs_list = [entry for entry in lexemes if entry["hanzi"] is None]
    toc_lexemes = [entry for entry in lexemes if "table-of-contents" in entry.get("sourceEvidence", "")]
    lesson18_lexemes = [entry for entry in lexemes if entry["lessonRef"] == "hsk3-tb-lesson-18"]
    require(not lexeme_stubs_list, f"Expected no unresolved lexeme heads, found {len(lexeme_stubs_list)}", errors)
    require(len(toc_lexemes) == 32, f"Expected 32 TOC-derived/recovered lexemes, found {len(toc_lexemes)}", errors)
    require(len(lesson18_lexemes) == 17, f"Expected 17 lesson-18 lexemes, found {len(lesson18_lexemes)}", errors)
    require(
        all(entry.get("meaningStatus") == "available-in-vocabulary-appendix-ocr-needs-editorial-review" for entry in lesson18_lexemes),
        "Every lesson-18 lexeme must link to glossary evidence from the vocabulary appendix",
        errors,
    )
    require(
        all(entry["sourcePageRef"] == "hsk3-tb-source-page-014" and entry["sourceRowIndexes"] for entry in lesson18_lexemes),
        "Every lesson-18 lexeme must point to visible TOC evidence on PDF page 14",
        errors,
    )
    require(
        all(entry.get("appendixSourcePageRef") and entry.get("appendixSourceRowIndexes") and entry.get("appendixTextOcrRaw") for entry in lesson18_lexemes),
        "Every lesson-18 lexeme must point to a concrete vocabulary-appendix row",
        errors,
    )
    pinyin_by_hanzi = {entry["hanzi"]: entry["pinyin"] for entry in lesson18_lexemes}
    require(pinyin_by_hanzi.get("只") == "zhī", "Lesson-18 只 must use the measure-word reading zhī", errors)
    require(pinyin_by_hanzi.get("地") == "de", "Lesson-18 地 must use the structural-particle reading de", errors)

    for name in proper_names:
        require(name["lessonRef"] in lesson_by_id, f"{name['id']} unresolved lesson ref", errors)
        validate_rows(name["id"], name["sourcePageRef"], name["sourceRowIndexes"])

    for values in blocks.values():
        for block in values:
            require(block["lessonRef"] in lesson_by_id, f"{block['id']} unresolved lesson ref", errors)
            validate_rows(block["id"], block["sourcePageRef"], block["sourceRowIndexes"])

    for culture in cultures:
        validate_rows(culture["id"], culture["sourcePageRef"], culture["sourceRowIndexes"])

    files = [root / entry["path"] for entry in manifest["files"]]
    for path in files:
        require(path.exists(), f"Manifest references missing file {path}", errors)
    counts = manifest["counts"]
    require(counts["lessons"] == len(lessons), "Manifest lesson count mismatch", errors)
    require(counts["textScenes"] == len(scenes), "Manifest scene count mismatch", errors)
    require(counts["lexemes"] == len(lexemes), "Manifest lexeme count mismatch", errors)
    require(counts["mediaPlaceholders"] == len(media), "Manifest media count mismatch", errors)
    require(
        source_analysis.get("sourceGaps")
        == [
            {
                "lessonRef": "hsk3-tb-lesson-18",
                "missingPrintedPages": [168, 169],
                "impact": "All four lesson-18 texts cannot be reconstructed. Vocabulary heads and glossary rows are retained from the table of contents and vocabulary appendix.",
            }
        ],
        "Source analysis must contain exactly the verified lesson-18 page gap",
        errors,
    )

    lexeme_stubs = len(lexeme_stubs_list)
    scene_stubs = len(scene_stubs_list)
    low_confidence = sum(1 for page in pages for row in page["rows"] if not row["isNoise"] and row["minConfidence"] < 0.75)
    print(f"JSON files: {len(json_files)}")
    print(f"Lessons: {len(lessons)}")
    print(f"Text scenes: {len(scenes)} ({scene_stubs} need manual scene transcription)")
    print(f"Lexeme records: {len(lexemes)} ({lexeme_stubs} OCR anchor stubs)")
    print(f"Proper names: {len(proper_names)}")
    print(f"Culture notes: {len(cultures)}")
    print(f"Media placeholders: {len(media)}")
    print(f"Content blocks: {sum(len(values) for values in blocks.values())}")
    print(f"OCR source pages: {len(pages)}")
    print(f"Non-noise OCR rows below 0.75 confidence: {low_confidence}")
    if errors:
        print("VALIDATION FAILED")
        for error in errors:
            print(f"- {error}")
        raise SystemExit(1)
    print("VALIDATION PASSED")


if __name__ == "__main__":
    main()
