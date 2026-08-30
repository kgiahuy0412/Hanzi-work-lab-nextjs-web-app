from __future__ import annotations

import argparse
import difflib
import json
import re
from pathlib import Path
from typing import Any


CJK_RE = re.compile(r"[\u3400-\u9fff]")
CHINESE_CONTENT_RE = re.compile(r"[\u3400-\u9fffA-Z：:，。！？；、“”‘’《》（）()0-9%+\-/……]+")
EXPLANATION_MARKERS = ("表示", "用在", "用于", "说明", "形式", "结构", "一般", "可以", "不能", "常用")


def load(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def dump(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def clean_space(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def chinese_content(value: str) -> str:
    return re.sub(r"^[A-Z](?=[\u3400-\u9fff])", "", "".join(CHINESE_CONTENT_RE.findall(value)).strip())


def normalized_chinese(value: str) -> str:
    return "".join(CJK_RE.findall(value))


def title_tokens(title: str) -> list[str]:
    quoted = [normalized_chinese(value) for value in re.findall(r"“([^”]+)”", title)]
    tokens = [value for value in quoted if value]
    if "：" in title:
        tokens.extend(
            value
            for value in re.findall(r"[\u3400-\u9fff]+", title.split("：", 1)[1])
            if value
        )
    compact = normalized_chinese(title)
    if compact:
        tokens.append(compact)
    return list(dict.fromkeys(tokens))


def heading_score(title: str, row_text: str) -> float:
    title_compact = normalized_chinese(title)
    row_compact = normalized_chinese(row_text)
    if not row_compact or len(row_compact) > 48:
        return -1
    ratio = difflib.SequenceMatcher(None, title_compact, row_compact).ratio()
    token_score = sum(len(token) * 2 for token in title_tokens(title) if token in row_compact)
    exact_bonus = 20 if title_compact and title_compact in row_compact else 0
    type_bonus = 0
    for marker in ("动词", "副词", "代词", "量词", "介词", "补语", "问句", "字句", "关联词"):
        if marker in title_compact and marker in row_compact:
            type_bonus += 3
    return ratio * 10 + token_score + exact_bonus + type_bonus


def grammar_segments(
    points: list[dict[str, Any]],
    page_by_id: dict[str, dict[str, Any]],
) -> dict[str, list[dict[str, Any]]]:
    result: dict[str, list[dict[str, Any]]] = {}
    by_page: dict[str, list[dict[str, Any]]] = {}
    for point in points:
        by_page.setdefault(point["sourcePageRef"], []).append(point)

    for page_ref, page_points in by_page.items():
        rows = [row for row in page_by_id[page_ref]["rows"] if not row.get("isNoise")]
        ordered_points = sorted(page_points, key=lambda item: item["sourceNumber"])
        cursor = 0
        headings: list[int] = []
        for point in ordered_points:
            candidates = [
                (index, heading_score(point["titleZh"], row["text"]))
                for index, row in enumerate(rows)
                if index >= cursor
            ]
            heading_index, score = max(candidates, key=lambda item: item[1], default=(cursor, -1))
            if score < 3:
                heading_index = cursor
            headings.append(heading_index)
            cursor = min(len(rows), heading_index + 1)

        for index, point in enumerate(ordered_points):
            start = headings[index] + 1
            end = headings[index + 1] if index + 1 < len(headings) else len(rows)
            result[point["id"]] = rows[start:end]
    return result


def explanation_zh(point: dict[str, Any], rows: list[dict[str, Any]]) -> str:
    candidates: list[str] = []
    for row in rows:
        text = row["text"].strip()
        if not CJK_RE.search(text) or any(marker in text for marker in ("练一练", "GiaoTrinh", "标准教程")):
            continue
        chinese = chinese_content(text)
        if len(normalized_chinese(chinese)) < 4:
            continue
        if any(marker in chinese for marker in EXPLANATION_MARKERS) or chinese.endswith(("。", "：")):
            candidates.append(chinese)
        if candidates:
            break
    return "".join(candidates) or point["titleZh"]


def useful_explanation(point: dict[str, Any], explanation: str) -> bool:
    title_compact = normalized_chinese(point["titleZh"])
    explanation_compact = normalized_chinese(explanation)
    focus = [token for token in title_tokens(point["titleZh"]) if len(token) <= 8]
    return (
        len(explanation_compact) >= len(title_compact) + 4
        and (not focus or any(token in explanation_compact for token in focus))
    )


class LocalTranslator:
    def __init__(self) -> None:
        try:
            from argostranslate import translate as argos_translate
        except ImportError as exc:  # pragma: no cover - setup path
            raise RuntimeError(
                "Cần cài argostranslate và mô hình zh→en, en→vi để tạo enrichment HSK2."
            ) from exc
        self.argos_translate = argos_translate

    def vietnamese(self, value: str) -> str:
        english = self.argos_translate.translate(value, "zh", "en")
        return clean_space(self.argos_translate.translate(english, "en", "vi"))


def grammar_examples(
    point: dict[str, Any],
    lesson_scenes: list[dict[str, Any]],
    translated_lines: dict[str, list[dict[str, str]]],
) -> list[dict[str, str]]:
    tokens = [token for token in title_tokens(point["titleZh"]) if len(token) <= 8]
    candidates: list[dict[str, str]] = []
    fallbacks: list[dict[str, str]] = []
    for scene in lesson_scenes:
        for index, line in enumerate(scene["lines"]):
            translated = translated_lines[scene["id"]][index]
            example = {
                "hanzi": line["textZh"],
                "pinyin": line["pinyin"],
                "translationVi": translated["translationVi"],
            }
            fallbacks.append(example)
            if any(token in normalized_chinese(line["textZh"]) for token in tokens):
                candidates.append(example)
    selected = candidates or fallbacks
    unique: list[dict[str, str]] = []
    for item in selected:
        if any(existing["hanzi"] == item["hanzi"] for existing in unique):
            continue
        unique.append(item)
        if len(unique) == 3:
            break
    return unique


def main() -> None:
    parser = argparse.ArgumentParser(description="Tạo bản dịch và dữ liệu ngữ pháp học HSK2 từ giáo trình.")
    parser.add_argument("--bundle", type=Path, default=Path("content/hsk2-textbook-json"))
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("content/hsk2-textbook-json/shared/learning-enrichment.json"),
    )
    parser.add_argument("--validate", action="store_true")
    args = parser.parse_args()

    root = args.bundle
    lessons = [load(root / "lessons" / f"lesson-{number:02d}.json") for number in range(1, 16)]
    scenes = load(root / "shared" / "text-scenes.json")["scenes"]
    points = load(root / "shared" / "grammar-points.json")["grammarPoints"]
    pages = load(root / "shared" / "source-pages.json")["pages"]
    page_by_id = {page["id"]: page for page in pages}
    segments = grammar_segments(points, page_by_id)

    if args.validate:
        for point in points:
            explanation = explanation_zh(point, segments[point["id"]])
            print(f"{point['id']} | {point['titleZh']} | {explanation}")
        return

    existing = load(args.output) if args.output.exists() else {}
    if existing.get("schemaVersion") != "1.1.0":
        existing = {}
    scene_lines: dict[str, list[dict[str, str]]] = dict(existing.get("sceneLines", {}))
    grammar_points: dict[str, dict[str, Any]] = dict(existing.get("grammarPoints", {}))
    translator = LocalTranslator()

    for lesson in lessons:
        lesson_id = lesson["id"]
        lesson_scenes = [scene for scene in scenes if scene["lessonRef"] == lesson_id]
        lesson_points = [point for point in points if point["lessonRef"] == lesson_id]

        for scene in lesson_scenes:
            cached = scene_lines.get(scene["id"], [])
            cache_valid = (
                len(cached) == len(scene["lines"])
                and all(item.get("translationVi", "").strip() for item in cached)
            )
            if cache_valid:
                continue
            scene_lines[scene["id"]] = [
                {
                    "pinyin": line["pinyin"],
                    "translationVi": translator.vietnamese(line["textZh"]),
                }
                for line in scene["lines"]
            ]

        for point in lesson_points:
            cached = grammar_points.get(point["id"], {})
            if cached.get("explanationVi", "").strip() and cached.get("examples"):
                continue
            source_explanation = explanation_zh(point, segments[point["id"]])
            explanation_vi = (
                translator.vietnamese(source_explanation)
                if useful_explanation(point, source_explanation)
                else f"{point['titleVi']}. Quan sát cách dùng cấu trúc này trong các câu mẫu của bài học."
            )
            grammar_points[point["id"]] = {
                "lessonRef": lesson_id,
                "titleZh": point["titleZh"],
                "titleVi": point["titleVi"],
                "formula": point["titleZh"],
                "explanationVi": explanation_vi,
                "examples": grammar_examples(point, lesson_scenes, scene_lines),
            }

        payload = {
            "schemaVersion": "1.1.0",
            "status": "machine-translated-needs-language-review",
            "sceneLines": scene_lines,
            "grammarPoints": grammar_points,
        }
        dump(args.output, payload)
        print(
            f"Processed lesson {lesson['lessonNumber']:02d}: "
            f"{len(lesson_scenes)} scenes, {len(lesson_points)} grammar points",
            flush=True,
        )

    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()
