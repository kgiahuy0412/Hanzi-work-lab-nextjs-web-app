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
    parser = argparse.ArgumentParser(description="Validate the generated HSK 6 textbook volume 1 JSON bundle.")
    parser.add_argument("bundle_dir", type=Path)
    args = parser.parse_args()
    root = args.bundle_dir.resolve()
    errors: list[str] = []

    json_files = sorted(root.rglob("*.json"))
    for json_path in json_files:
        try:
            load(json_path)
        except (UnicodeDecodeError, json.JSONDecodeError) as error:
            errors.append(f"invalid UTF-8 JSON {json_path.relative_to(root)}: {error}")

    manifest = load(root / "manifest.json")
    curriculum = load(root / "curriculum.json")
    vocabulary = load(root / "vocabulary.json")
    compiled = load(root / "hsk6-textbook-1.json")
    pages = load(root / "source-pages.json")["sourcePages"]
    texts = load(root / "texts.json")["texts"]
    schema = load(root / "schemas" / "textbook-lesson.schema.json")
    supplemental = load(root / "appendices" / "supplemental-vocabulary.json")["items"]
    block_payloads = [
        load(root / name)["blocks"]
        for name in ("warmup-blocks.json", "annotation-blocks.json", "practice-blocks.json", "extension-blocks.json", "application-blocks.json")
    ]
    blocks = [block for payload in block_payloads for block in payload]

    require(manifest["status"] == "review", "manifest.status must be review", errors)
    require(len(pages) == 247, f"expected 247 source pages, got {len(pages)}", errors)
    require([page["pdfPage"] for page in pages] == list(range(1, 248)), "source page numbers are not consecutive", errors)
    require(len(curriculum["units"]) == 5, f"expected 5 units, got {len(curriculum['units'])}", errors)
    require(len(curriculum["lessons"]) == 20, f"expected 20 lessons, got {len(curriculum['lessons'])}", errors)
    require([lesson["number"] for lesson in curriculum["lessons"]] == list(range(1, 21)), "lesson numbers are not 1..20", errors)
    require(len(texts) == 20, f"expected 20 article records, got {len(texts)}", errors)
    require(len(vocabulary["vocabulary"]) == 894, f"expected 894 main vocabulary records, got {len(vocabulary['vocabulary'])}", errors)
    require(len(supplemental) == 18, f"expected 18 supplemental vocabulary records, got {len(supplemental)}", errors)
    require(
        {item["hanzi"] for item in supplemental}
        == {"白噪音", "大脑", "翻天覆地", "即时", "酒窝", "就餐", "哭鼻子", "老公", "沏", "任", "丝瓜", "梯田", "头脑", "厌倦", "野生", "移植", "月饼", "知音"},
        "supplemental vocabulary headword set differs from the visually verified source page",
        errors,
    )
    require(len(vocabulary["allVocabulary"]) == len(vocabulary["vocabulary"]) + len(supplemental), "combined vocabulary count mismatch", errors)
    require(len({item["hanzi"] for item in vocabulary["vocabulary"]}) == len(vocabulary["vocabulary"]), "duplicate main vocabulary headword", errors)
    require(sum(not item.get("meaningViOcrRaw") for item in vocabulary["vocabulary"]) <= max(3, len(vocabulary["vocabulary"]) // 100), "too many main vocabulary rows have no OCR gloss", errors)
    require(all(item.get("meaningVi") for item in vocabulary["vocabulary"]), "main vocabulary contains an empty usable Vietnamese meaning", errors)
    require(
        {item["hanzi"] for item in vocabulary["vocabulary"] if item.get("meaningViStatus") == "manually-verified-against-source"}
        == set(),
        "manually verified main gloss set is incorrect",
        errors,
    )
    require(
        {item["hanzi"] for item in vocabulary["vocabulary"] if item.get("hanziStatus") == "manually-verified-against-source"}
        == {"悲惨", "甭", "憋", "诧异", "嘲笑", "端", "而已", "捡", "迷惑", "趴", "撇", "清洁", "瘸", "嚷", "耍", "汹涌", "异常", "遭遇"},
        "visually repaired main vocabulary set is incorrect",
        errors,
    )
    require(sum(item.get("lessonNumber") is None for item in supplemental) == 0, "supplemental rows have missing lesson numbers", errors)

    page_ids = {page["id"] for page in pages}
    lexeme_ids = {item["id"] for item in vocabulary["vocabulary"]}
    text_ids = {item["id"] for item in texts}
    lesson_ids = {lesson["id"] for lesson in curriculum["lessons"]}
    block_ids = {block["id"] for block in blocks}
    require(len(lexeme_ids) == len(vocabulary["vocabulary"]), "duplicate lexeme IDs", errors)
    require(len(text_ids) == len(texts), "duplicate text IDs", errors)

    validator = Draft202012Validator(schema)
    expected_ranges = {
        1: (14, 23), 2: (24, 32), 3: (33, 43), 4: (44, 52),
        5: (54, 64), 6: (65, 73), 7: (74, 84), 8: (85, 94),
        9: (96, 106), 10: (107, 115), 11: (116, 125), 12: (126, 134),
        13: (136, 146), 14: (147, 155), 15: (156, 166), 16: (167, 176),
        17: (178, 187), 18: (188, 196), 19: (197, 206), 20: (207, 215),
    }
    expected_vocabulary_counts = {
        1: 32, 2: 43, 3: 43, 4: 45, 5: 43, 6: 45, 7: 45, 8: 37, 9: 47, 10: 50,
        11: 43, 12: 43, 13: 51, 14: 49, 15: 46, 16: 44, 17: 44, 18: 47, 19: 46, 20: 51,
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
        require(set(payload["blockIds"]) <= block_ids, f"lesson {payload['number']} has dangling block reference", errors)
        require(payload["vocabularyCount"] == expected_vocabulary_counts[payload["number"]], f"lesson {payload['number']} vocabulary count mismatch", errors)
        require(
            {marker["sectionType"] for marker in payload["sectionMarkers"]}
            == {"warmup", "text", "annotation", "practice", "extension", "application"},
            f"lesson {payload['number']} does not contain all six expected section markers",
            errors,
        )
        require(payload["allVocabularyCount"] == payload["vocabularyCount"] + payload["supplementalVocabularyCount"], f"lesson {payload['number']} combined vocabulary count mismatch", errors)
        article = next((item for item in texts if item["lessonNumber"] == payload["number"]), None)
        require(article is not None, f"lesson {payload['number']} has no article", errors)
        if article:
            require(len(article["bodyZhOcr"]) >= 100, f"lesson {payload['number']} article OCR is too short", errors)
            require(all(ref["sourcePageId"] in page_ids for ref in article["sourceEvidence"]), f"lesson {payload['number']} article has dangling page reference", errors)
        require(all(start <= marker["pdfPage"] <= end for marker in payload["sectionMarkers"]), f"lesson {payload['number']} has a section marker outside its page range", errors)

    require([unit["sourceDividerPdfPage"] for unit in curriculum["units"]] == [13, 53, 95, 135, 177], "unit divider pages are incorrect", errors)
    for item in vocabulary["vocabulary"]:
        require(1 <= item["lessonNumber"] <= 20, f"lexeme {item['id']} has invalid lesson", errors)
        require(item["source"]["sourcePageId"] in page_ids, f"lexeme {item['id']} has dangling source page", errors)
        require(bool(item["hanzi"]), f"lexeme {item['id']} has empty hanzi", errors)
        require(bool(item["pinyin"]), f"lexeme {item['id']} has empty pinyin", errors)
    for item in supplemental:
        require(1 <= item["lessonNumber"] <= 20, f"supplemental item {item['id']} has invalid lesson", errors)
        require(item["source"]["sourcePageId"] in page_ids, f"supplemental item {item['id']} has dangling source page", errors)
    for block in blocks:
        require(all(ref["sourcePageId"] in page_ids for ref in block["sourceEvidence"]), f"block {block['id']} has dangling page reference", errors)

    require(compiled["vocabulary"] == vocabulary["vocabulary"], "compiled vocabulary differs from vocabulary.json", errors)
    require(compiled["sourcePages"] == pages, "compiled sourcePages differs from source-pages.json", errors)
    require(len(compiled["allVocabulary"]) == len(vocabulary["allVocabulary"]), "compiled allVocabulary is incomplete", errors)
    require(len(compiled["sourcePages"]) == 247, "compiled sourcePages differs from source-pages.json", errors)
    require(set(compiled["vocabularyByLesson"]) == {str(number) for number in range(1, 21)}, "compiled vocabularyByLesson is incomplete", errors)
    require(manifest["counts"]["vocabulary"] == len(vocabulary["vocabulary"]), "manifest vocabulary count mismatch", errors)
    require(manifest["counts"]["contentBlocks"] == len(blocks), "manifest block count mismatch", errors)

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
        f"supplemental={len(supplemental)}"
    )


if __name__ == "__main__":
    main()
