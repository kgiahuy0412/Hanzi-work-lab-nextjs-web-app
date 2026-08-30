from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator


def load(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def require(condition: bool, message: str, errors: list[str]) -> None:
    if not condition:
        errors.append(message)


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate the generated HSK 5 lower textbook JSON bundle.")
    parser.add_argument("bundle_dir", type=Path)
    args = parser.parse_args()
    root = args.bundle_dir.resolve()
    errors: list[str] = []

    manifest = load(root / "manifest.json")
    curriculum = load(root / "curriculum.json")
    vocabulary = load(root / "vocabulary.json")
    compiled = load(root / "hsk5-lower-textbook.json")
    pages = load(root / "source-pages.json")["sourcePages"]
    texts = load(root / "texts.json")["texts"]
    schema = load(root / "schemas" / "textbook-lesson.schema.json")
    proper_names = load(root / "appendices" / "proper-names-summary.json")["items"]
    beyond_level = load(root / "appendices" / "beyond-level-vocabulary.json")["items"]

    require(manifest["status"] == "review", "manifest.status must be review", errors)
    require(len(pages) == 189, f"expected 189 source pages, got {len(pages)}", errors)
    require([page["pdfPage"] for page in pages] == list(range(1, 190)), "source page numbers are not consecutive", errors)
    require(len(curriculum["units"]) == 6, f"expected 6 units, got {len(curriculum['units'])}", errors)
    require(len(curriculum["lessons"]) == 18, f"expected 18 lessons, got {len(curriculum['lessons'])}", errors)
    require([lesson["number"] for lesson in curriculum["lessons"]] == list(range(19, 37)), "lesson numbers are not 19..36", errors)
    require(len(texts) == 18, f"expected 18 article records, got {len(texts)}", errors)
    require(len(vocabulary["vocabulary"]) == 502, f"expected 502 main vocabulary records, got {len(vocabulary['vocabulary'])}", errors)
    require(len(proper_names) == 27, f"expected 27 proper-name records, got {len(proper_names)}", errors)
    require(len(beyond_level) == 161, f"expected 161 beyond-level records, got {len(beyond_level)}", errors)
    require(len(vocabulary["allVocabulary"]) == 663, f"expected 663 combined vocabulary records, got {len(vocabulary['allVocabulary'])}", errors)
    require(sum(not item.get("meaningViOcrRaw") for item in vocabulary["vocabulary"]) <= 3, "too many main vocabulary rows have no OCR gloss", errors)
    require(all(item.get("meaningVi") for item in vocabulary["vocabulary"]), "main vocabulary contains an empty usable Vietnamese meaning", errors)
    require(
        {item["hanzi"] for item in vocabulary["vocabulary"] if item.get("meaningViStatus") == "manually-verified-against-source"}
        == {"家务", "无数", "物理"},
        "manually verified main gloss set is incorrect",
        errors,
    )
    require(sum(item.get("lessonNumber") is None for item in proper_names) == 0, "proper-name rows have missing lesson numbers", errors)
    require(sum(item.get("lessonNumber") is None for item in beyond_level) <= 1, "too many beyond-level rows have missing lesson numbers", errors)

    page_ids = {page["id"] for page in pages}
    lexeme_ids = {item["id"] for item in vocabulary["vocabulary"]}
    text_ids = {item["id"] for item in texts}
    lesson_ids = {lesson["id"] for lesson in curriculum["lessons"]}
    require(len(lexeme_ids) == len(vocabulary["vocabulary"]), "duplicate lexeme IDs", errors)
    require(len(text_ids) == len(texts), "duplicate text IDs", errors)

    validator = Draft202012Validator(schema)
    expected_ranges = {
        19: (15, 22), 20: (23, 30), 21: (31, 39),
        22: (41, 47), 23: (48, 55), 24: (56, 63),
        25: (65, 71), 26: (72, 79), 27: (80, 87),
        28: (89, 96), 29: (97, 104), 30: (105, 113),
        31: (115, 122), 32: (123, 130), 33: (131, 139),
        34: (141, 148), 35: (149, 156), 36: (157, 164),
    }
    for lesson in curriculum["lessons"]:
        lesson_path = root / "lessons" / f"lesson-{lesson['number']:02d}.json"
        require(lesson_path.exists(), f"missing {lesson_path.name}", errors)
        if not lesson_path.exists():
            continue
        payload = load(lesson_path)
        for validation_error in validator.iter_errors(payload):
            errors.append(f"{lesson_path.name}: {validation_error.message}")
        start = payload["sourcePdfPages"]["start"]
        end = payload["sourcePdfPages"]["end"]
        require((start, end) == expected_ranges[payload["number"]], f"lesson {payload['number']} has unexpected page range {(start, end)}", errors)
        require(end >= start, f"lesson {payload['number']} has invalid page range", errors)
        require(set(payload["textIds"]) <= text_ids, f"lesson {payload['number']} has dangling text reference", errors)
        require(set(payload["lexemeIds"]) <= lexeme_ids, f"lesson {payload['number']} has dangling lexeme reference", errors)
        require(payload["vocabularyCount"] >= 10, f"lesson {payload['number']} has only {payload['vocabularyCount']} vocabulary items", errors)
        require(
            {marker["sectionType"] for marker in payload["sectionMarkers"]}
            == {"warmup", "text", "annotation", "practice", "extension", "application"},
            f"lesson {payload['number']} does not contain all six expected section markers",
            errors,
        )
        require(payload["allVocabularyCount"] == payload["vocabularyCount"] + payload["beyondLevelVocabularyCount"], f"lesson {payload['number']} combined vocabulary count mismatch", errors)
        article = next((item for item in texts if item["lessonNumber"] == payload["number"]), None)
        require(article is not None, f"lesson {payload['number']} has no article", errors)
        if article:
            require(len(article["bodyZhOcr"]) >= 100, f"lesson {payload['number']} article OCR is too short", errors)
            require(all(ref["sourcePageId"] in page_ids for ref in article["sourceEvidence"]), f"lesson {payload['number']} article has dangling page reference", errors)

    require([unit["sourceDividerPdfPage"] for unit in curriculum["units"]] == [14, 40, 64, 88, 114, 140], "unit divider pages are incorrect", errors)
    for item in vocabulary["vocabulary"]:
        require(19 <= item["lessonNumber"] <= 36, f"lexeme {item['id']} has invalid lesson", errors)
        require(item["source"]["sourcePageId"] in page_ids, f"lexeme {item['id']} has dangling source page", errors)
        require(bool(item["hanzi"]), f"lexeme {item['id']} has empty hanzi", errors)
        require(bool(item["pinyin"]), f"lexeme {item['id']} has empty pinyin", errors)

    require(compiled["vocabulary"] == vocabulary["vocabulary"], "compiled vocabulary differs from vocabulary.json", errors)
    require(len(compiled["allVocabulary"]) == 663, "compiled allVocabulary is incomplete", errors)
    require(len(compiled["sourcePages"]) == 189, "compiled sourcePages differs from source-pages.json", errors)
    require(set(compiled["vocabularyByLesson"]) == {str(number) for number in range(19, 37)}, "compiled vocabularyByLesson is incomplete", errors)
    require(manifest["counts"]["vocabulary"] == len(vocabulary["vocabulary"]), "manifest vocabulary count mismatch", errors)

    missing_artifacts = [item for item in manifest["artifacts"] if not (root / item).exists()]
    require(not missing_artifacts, f"manifest points to missing artifacts: {missing_artifacts}", errors)

    if errors:
        print(f"FAILED ({len(errors)} error(s))")
        for error in errors:
            print(f"- {error}")
        raise SystemExit(1)

    print(
        "VALID "
        f"pages={len(pages)} units={len(curriculum['units'])} lessons={len(curriculum['lessons'])} "
        f"texts={len(texts)} vocabulary={len(vocabulary['vocabulary'])} "
        f"properNames={len(proper_names)} beyondLevel={len(beyond_level)}"
    )


if __name__ == "__main__":
    main()
