from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


def load(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate the HSK 6 Volume 2 textbook JSON bundle.")
    parser.add_argument("bundle_dir", type=Path)
    args = parser.parse_args()
    root = args.bundle_dir
    errors: list[str] = []
    warnings: list[str] = []

    json_paths = sorted(root.rglob("*.json"))
    for path in json_paths:
        try:
            load(path)
        except Exception as exc:
            errors.append(f"Invalid JSON {path.relative_to(root)}: {exc}")

    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        raise SystemExit(1)

    manifest = load(root / "manifest.json")
    lessons = [load(path) for path in sorted((root / "lessons").glob("lesson-*.json"))]
    articles = load(root / "shared" / "articles.json")
    lexemes = load(root / "shared" / "lexemes.json")
    points = load(root / "shared" / "language-points.json")
    blocks = load(root / "shared" / "section-blocks.json")
    media = load(root / "shared" / "media-assets.json")
    pages = load(root / "shared" / "source-pages.json")
    combined = load(root / "hsk6-volume2-textbook.json")

    expected_numbers = list(range(21, 41))
    lesson_numbers = [item["lessonNumber"] for item in lessons]
    if lesson_numbers != expected_numbers:
        errors.append(f"Lesson numbers mismatch: {lesson_numbers}")
    if len(pages) != 257:
        errors.append(f"Expected 257 OCR source pages, got {len(pages)}")
    if [page["pdfPage"] for page in pages] != list(range(1, 258)):
        errors.append("Source pages are not complete and ordered 1-257")
    if len(articles) != 20:
        errors.append(f"Expected 20 articles, got {len(articles)}")
    if len(points) != 100:
        errors.append(f"Expected 100 language points, got {len(points)}")
    if len(media) != 40:
        errors.append(f"Expected 40 media placeholders, got {len(media)}")

    lesson_ids = {item["id"] for item in lessons}
    source_page_ids = {item["id"] for item in pages}
    entity_sets = {
        "article": {item["id"] for item in articles},
        "vocabulary": {item["id"] for item in lexemes},
        "integrated-notes": {item["id"] for item in blocks if item["type"] == "integrated-notes"},
        "word-distinction": {item["id"] for item in blocks if item["type"] == "word-distinction"},
        "discourse-rhetoric": {item["id"] for item in blocks if item["type"] == "discourse-rhetoric"},
        "practice": {item["id"] for item in blocks if item["type"] == "practice"},
        "extension": {item["id"] for item in blocks if item["type"] == "extension"},
        "warmup": {item["id"] for item in blocks if item["type"] == "warmup"},
    }

    for lesson in lessons:
        if not lesson["title"]["zh"] or not lesson["title"]["vi"]:
            errors.append(f"Missing title in lesson {lesson['lessonNumber']}")
        if lesson["source"]["sourcePageRefs"]:
            missing_refs = set(lesson["source"]["sourcePageRefs"]) - source_page_ids
            if missing_refs:
                errors.append(f"Lesson {lesson['lessonNumber']} has missing source refs: {sorted(missing_refs)}")
        for section in lesson["sections"]:
            target_ids = entity_sets.get(section["type"], set())
            missing_content = set(section.get("contentRefs", [])) - target_ids
            if missing_content:
                errors.append(
                    f"Lesson {lesson['lessonNumber']} section {section['type']} has missing refs: {sorted(missing_content)}"
                )

    ids = [item["id"] for item in articles + lexemes + points + blocks + media]
    duplicate_ids = sorted(item for item, count in Counter(ids).items() if count > 1)
    if duplicate_ids:
        errors.append(f"Duplicate entity IDs: {duplicate_ids[:20]}")

    lexemes_by_lesson: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for item in lexemes:
        if item["lessonRef"] not in lesson_ids:
            errors.append(f"Lexeme {item['id']} has unknown lessonRef")
        if not item["hanzi"] or not item["pinyin"]:
            errors.append(f"Lexeme {item['id']} is missing hanzi or pinyin")
        if item["sourcePageRef"] not in source_page_ids:
            errors.append(f"Lexeme {item['id']} has unknown source page")
        lexemes_by_lesson[item["lessonRef"]].append(item)

    for lesson_id in sorted(lesson_ids):
        values = lexemes_by_lesson[lesson_id]
        numbers = [item["sourceNumber"] for item in values]
        if len(numbers) != len(set(numbers)):
            errors.append(f"Duplicate vocabulary source numbers in {lesson_id}")
        if len(values) < 20:
            warnings.append(f"Only {len(values)} vocabulary entries detected in {lesson_id}")

    for article in articles:
        if article["lessonRef"] not in lesson_ids:
            errors.append(f"Article {article['id']} has unknown lessonRef")
        cjk_count = sum("\u3400" <= char <= "\u9fff" for char in article["textZh"])
        if cjk_count < 250:
            warnings.append(f"Article {article['id']} has only {cjk_count} Chinese characters")
        for ref in article["sourcePageRefs"]:
            if ref not in source_page_ids:
                errors.append(f"Article {article['id']} has unknown source page {ref}")

    counts = manifest["counts"]
    actual_counts = {
        "themes": len(combined["curriculum"]["themes"]),
        "lessons": len(lessons),
        "articles": len(articles),
        "articleParagraphs": sum(len(item["paragraphs"]) for item in articles),
        "lexemes": len(lexemes),
        "languagePoints": len(points),
        "sectionBlocks": len(blocks),
        "mediaPlaceholders": len(media),
        "ocrSourcePages": len(pages),
        "appendixPages": 39,
    }
    if counts != actual_counts:
        errors.append(f"Manifest counts mismatch. expected={counts}, actual={actual_counts}")

    if len(combined["lessons"]) != len(lessons) or len(combined["lexemes"]) != len(lexemes):
        errors.append("Combined export does not match split files")

    print(f"JSON files: {len(json_paths)}")
    print(f"Lessons: {len(lessons)}")
    print(f"Articles: {len(articles)}")
    print(f"Article paragraphs: {actual_counts['articleParagraphs']}")
    print(f"Vocabulary records: {len(lexemes)}")
    print(f"Language points: {len(points)}")
    print(f"Section blocks: {len(blocks)}")
    print(f"OCR pages: {len(pages)}")
    for warning in warnings:
        print(f"WARNING: {warning}")
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        raise SystemExit(1)
    print("VALIDATION PASSED")


if __name__ == "__main__":
    main()
