from __future__ import annotations

import argparse
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any


TRANSLATE_ENDPOINT = "https://translate.googleapis.com/translate_a/single"
CJK_RE = re.compile(r"[\u3400-\u9fff]")
NUMBERED_EXAMPLE_RE = re.compile(r"^\s*[（(]\d+[）)]")
CHINESE_CONTENT_RE = re.compile(r"[\u3400-\u9fff“”‘’《》：；，。！？、（）()0-9+\-/]+")


def load(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def dump(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def clean_space(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def chinese_content(value: str) -> str:
    return "".join(CHINESE_CONTENT_RE.findall(value)).strip()


def scene_title_zh(value: str | None) -> str:
    title = chinese_content(value or "")
    return re.sub(r"^课文", "", title).strip()


def response_text(payload: list[Any], field_index: int) -> str:
    chunks = []
    for item in payload[0] if payload and isinstance(payload[0], list) else []:
        if isinstance(item, list) and len(item) > field_index and isinstance(item[field_index], str):
            chunks.append(item[field_index])
    return "".join(chunks)


def translate_batch(texts: list[str]) -> list[dict[str, str]]:
    if not texts:
        return []
    query = urllib.parse.urlencode(
        {
            "client": "gtx",
            "sl": "zh-CN",
            "tl": "vi",
            "dt": ["t", "rm"],
            "q": "\n".join(texts),
        },
        doseq=True,
    )
    request = urllib.request.Request(
        f"{TRANSLATE_ENDPOINT}?{query}",
        headers={"User-Agent": "HanziWork content enrichment/1.0"},
    )
    with urllib.request.urlopen(request, timeout=45) as response:
        payload = json.loads(response.read().decode("utf-8"))

    translations = response_text(payload, 0).splitlines()
    pinyin = response_text(payload, 3).splitlines()
    if len(translations) != len(texts) or len(pinyin) != len(texts):
        if len(texts) == 1:
            return [{"translationVi": clean_space(response_text(payload, 0)), "pinyin": clean_space(response_text(payload, 3))}]
        results = []
        for text in texts:
            results.extend(translate_batch([text]))
            time.sleep(0.12)
        return results

    return [
        {"translationVi": clean_space(translation), "pinyin": clean_space(romanization).lower()}
        for translation, romanization in zip(translations, pinyin, strict=True)
    ]


def translate_with_retries(texts: list[str]) -> list[dict[str, str]]:
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            return translate_batch(texts)
        except Exception as exc:  # pragma: no cover - network failure path
            last_error = exc
            time.sleep(1.0 + attempt)
    raise RuntimeError(f"Không thể tạo bản dịch cho {len(texts)} chuỗi") from last_error


def grammar_source(block: dict[str, Any], page_by_id: dict[str, dict[str, Any]], lesson_number: int) -> dict[str, Any]:
    page = page_by_id[block["sourcePageRef"]]
    rows = [
        row
        for row in page["rows"]
        if row["rowIndex"] in block["sourceRowIndexes"] and not row["isNoise"]
    ]
    heading = next((row for row in rows if "注释" in row["text"]), None)
    heading_text = (block.get("detectedHeadingsOcrRaw") or [""])[0]
    title_candidate = re.sub(r"^.*?注释\s*", "", heading_text)
    title_candidate = re.split(r"[A-Za-z]", title_candidate, maxsplit=1)[0]
    title_zh = clean_space(title_candidate).strip(" .…·")
    if not CJK_RE.search(title_zh):
        title_zh = f"第{lesson_number}课语法重点"

    start_index = heading["rowIndex"] if heading else -1
    explanation_rows: list[str] = []
    examples: list[str] = []
    for row in rows:
        if row["rowIndex"] <= start_index:
            continue
        text = row["text"].strip()
        if "练一练" in text or text.startswith("练习"):
            break
        if not CJK_RE.search(text) or any(token in text for token in ("标准教程", "Giao trinh", "HSK")):
            continue
        chinese = chinese_content(text)
        if NUMBERED_EXAMPLE_RE.match(text):
            examples.append(chinese)
        elif len(explanation_rows) < 4:
            explanation_rows.append(chinese)

    explanation_zh = "".join(explanation_rows) or title_zh
    return {
        "titleZh": title_zh,
        "explanationZh": explanation_zh,
        "examplesZh": examples[:3],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Tạo dữ liệu học HSK3 đã bổ sung nghĩa, pinyin và bản dịch.")
    parser.add_argument(
        "--bundle",
        type=Path,
        default=Path("content/hsk3-textbook-json"),
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("content/hsk3-textbook-json/shared/learning-enrichment.json"),
    )
    args = parser.parse_args()

    root = args.bundle
    lessons = [load(root / "lessons" / f"lesson-{number:02d}.json") for number in range(1, 21)]
    lexemes = load(root / "shared" / "lexemes.json")["lexemes"]
    scenes = load(root / "shared" / "text-scenes.json")["scenes"]
    grammar_blocks = load(root / "shared" / "grammar-blocks.json")["blocks"]
    pages = load(root / "shared" / "source-pages.json")["pages"]
    page_by_id = {page["id"]: page for page in pages}

    lexeme_meanings: dict[str, str] = {}
    scene_titles: dict[str, dict[str, str]] = {}
    scene_lines: dict[str, list[dict[str, str]]] = {}
    grammar: dict[str, dict[str, Any]] = {}

    for lesson in lessons:
        lesson_id = lesson["id"]
        lesson_lexemes = [item for item in lexemes if item["lessonRef"] == lesson_id]
        lesson_scenes = [item for item in scenes if item["lessonRef"] == lesson_id]
        lesson_grammar = [item for item in grammar_blocks if item["lessonRef"] == lesson_id]

        requests: list[tuple[str, str, str]] = []
        for item in lesson_lexemes:
            requests.append(("lexeme", item["id"], item["hanzi"]))
        for scene in lesson_scenes:
            title_zh = scene_title_zh(scene.get("title", {}).get("zh"))
            if title_zh:
                requests.append(("scene-title", scene["id"], title_zh))
            for index, line in enumerate(scene.get("lines", [])):
                requests.append(("scene-line", f"{scene['id']}:{index}", line["textZh"]))

        grammar_sources = {
            block["id"]: grammar_source(block, page_by_id, lesson["lessonNumber"])
            for block in lesson_grammar
        }
        for block_id, source in grammar_sources.items():
            requests.append(("grammar-title", block_id, source["titleZh"]))
            requests.append(("grammar-explanation", block_id, source["explanationZh"]))
            for index, example in enumerate(source["examplesZh"]):
                requests.append(("grammar-example", f"{block_id}:{index}", example))

        translated = translate_with_retries([request[2] for request in requests])
        response_by_key = {
            (kind, key): response
            for (kind, key, _), response in zip(requests, translated, strict=True)
        }

        for item in lesson_lexemes:
            lexeme_meanings[item["id"]] = response_by_key[("lexeme", item["id"])]["translationVi"]
        for scene in lesson_scenes:
            title_zh = scene_title_zh(scene.get("title", {}).get("zh"))
            if title_zh:
                scene_titles[scene["id"]] = response_by_key[("scene-title", scene["id"])]
            scene_lines[scene["id"]] = [
                response_by_key[("scene-line", f"{scene['id']}:{index}")]
                for index, _line in enumerate(scene.get("lines", []))
            ]
        for block in lesson_grammar:
            block_id = block["id"]
            source = grammar_sources[block_id]
            title = response_by_key[("grammar-title", block_id)]
            explanation = response_by_key[("grammar-explanation", block_id)]
            grammar[block_id] = {
                "titleZh": source["titleZh"],
                "titleVi": title["translationVi"],
                "formula": source["titleZh"],
                "explanationVi": explanation["translationVi"],
                "examples": [
                    {
                        "hanzi": hanzi,
                        **response_by_key[("grammar-example", f"{block_id}:{index}")],
                    }
                    for index, hanzi in enumerate(source["examplesZh"])
                ],
            }

        print(f"Processed lesson {lesson['lessonNumber']:02d}: {len(requests)} strings")
        time.sleep(0.2)

    dump(
        args.output,
        {
            "schemaVersion": "1.0.0",
            "status": "machine-translated-needs-language-review",
            "lexemeMeanings": lexeme_meanings,
            "sceneTitles": scene_titles,
            "sceneLines": scene_lines,
            "grammarBlocks": grammar,
        },
    )
    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()
