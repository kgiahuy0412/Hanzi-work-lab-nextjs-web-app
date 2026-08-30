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
CHINESE_CONTENT_RE = re.compile(r"[\u3400-\u9fff“”‘’《》：；，。！？、（）()0-9+\-/……]+")

# The scan exposes the five language notes as page-level OCR blocks instead of
# normalized grammar records. Keeping the page and row anchors here makes the
# transformation deterministic and auditable against the source bundle.
GRAMMAR_SPECS: dict[int, list[tuple[str, int, int]]] = {
    11: [("连", 13, 1), ("否则", 14, 3), ("无论", 14, 17), ("然而", 18, 3), ("同时", 18, 19)],
    12: [("并且", 27, 3), ("再……也……", 27, 24), ("对于", 28, 9), ("名量词重叠", 31, 19), ("相反", 32, 3)],
    13: [("大概", 40, 3), ("偶尔", 42, 3), ("由", 42, 20), ("进行", 45, 1), ("随着", 45, 23)],
    14: [("够", 53, 0), ("以", 54, 6), ("既然", 55, 4), ("于是", 57, 23), ("什么的", 59, 10)],
    15: [("想起来", 68, 3), ("弄", 68, 20), ("千万", 69, 7), ("来", 74, 3), ("左右", 74, 18)],
    16: [("可", 84, 3), ("恐怕", 84, 15), ("到底", 86, 17), ("拿……来说", 89, 2), ("敢", 89, 21)],
    17: [("倒", 97, 0), ("干", 98, 6), ("趟", 98, 31), ("为了……而……", 102, 19), ("仍然", 103, 7)],
    18: [("是否", 112, 3), ("受不了", 112, 20), ("接着", 113, 5), ("除此以外", 116, 20), ("把……叫作……", 117, 10)],
    19: [("疑问代词活用表示任指", 125, 1), ("上", 126, 3), ("出来", 126, 19), ("总的来说", 130, 3), ("在于", 130, 18)],
    20: [("动词+着+动词+着", 139, 1), ("一……就……", 139, 20), ("究竟", 140, 10), ("起来", 143, 19), ("动词+起", 144, 8)],
}


def load(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def dump(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def clean_space(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def chinese_content(value: str) -> str:
    return "".join(CHINESE_CONTENT_RE.findall(value)).strip()


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
            return [{
                "translationVi": clean_space(response_text(payload, 0)),
                "pinyin": clean_space(response_text(payload, 3)).lower(),
            }]
        results = []
        for text in texts:
            results.extend(translate_batch([text]))
            time.sleep(0.08)
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


def translate_in_chunks(texts: list[str]) -> list[dict[str, str]]:
    result: list[dict[str, str]] = []
    chunk: list[str] = []
    chunk_size = 0
    for text in texts:
        encoded_size = len(urllib.parse.quote(text))
        if chunk and (len(chunk) >= 20 or chunk_size + encoded_size > 2500):
            result.extend(translate_with_retries(chunk))
            chunk = []
            chunk_size = 0
            time.sleep(0.1)
        chunk.append(text)
        chunk_size += encoded_size
    if chunk:
        result.extend(translate_with_retries(chunk))
    return result


def is_chinese_row(text: str) -> bool:
    cjk_count = len(CJK_RE.findall(text))
    latin_count = len(re.findall(r"[A-Za-zÀ-ỹ]", text))
    return cjk_count >= 2 and latin_count <= max(2, cjk_count // 2)


def grammar_source(
    title_zh: str,
    pdf_page: int,
    heading_row_index: int,
    page_by_number: dict[int, dict[str, Any]],
) -> dict[str, Any]:
    page = page_by_number[pdf_page]
    rows = [row for row in page["rows"] if not row["isNoise"] and row["rowIndex"] > heading_row_index]
    if not any(NUMBERED_EXAMPLE_RE.match(row["text"].strip()) for row in rows):
        next_page = page_by_number.get(pdf_page + 1)
        if next_page:
            rows.extend(row for row in next_page["rows"] if not row["isNoise"])
    explanation_rows: list[str] = []
    examples: list[str] = []
    current_example = ""

    for row in rows:
        text = row["text"].strip()
        if "练一练" in text or text.startswith("练习") or text.startswith("根据课文"):
            break
        if not is_chinese_row(text):
            continue
        chinese = chinese_content(text)
        if not chinese:
            continue
        if NUMBERED_EXAMPLE_RE.match(text):
            if current_example:
                examples.append(current_example)
            current_example = chinese
        elif current_example:
            current_example += chinese
        elif len(explanation_rows) < 6:
            explanation_rows.append(chinese)

    if current_example:
        examples.append(current_example)
    return {
        "titleZh": title_zh,
        "explanationZh": "".join(explanation_rows) or title_zh,
        "examplesZh": examples[:3],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Tạo dữ liệu học HSK4 hạ quyển đã bổ sung nghĩa, pinyin và bản dịch.")
    parser.add_argument("--bundle", type=Path, default=Path("content/hsk4-lower-textbook-json"))
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("content/hsk4-lower-textbook-json/shared/learning-enrichment.json"),
    )
    args = parser.parse_args()

    root = args.bundle
    lessons = [load(root / "lessons" / f"lesson-{number:02d}.json") for number in range(11, 21)]
    lexemes = load(root / "shared" / "lexemes.json")["lexemes"]
    texts = load(root / "shared" / "texts.json")["texts"]
    pages = load(root / "shared" / "source-pages.json")["pages"]
    page_by_number = {page["pdfPage"]: page for page in pages}

    lexeme_meanings: dict[str, str] = {}
    text_titles: dict[str, dict[str, str]] = {}
    text_lines: dict[str, list[dict[str, str]]] = {}
    grammar_points: dict[str, dict[str, Any]] = {}

    for lesson in lessons:
        lesson_number = lesson["lessonNumber"]
        lesson_id = lesson["id"]
        lesson_lexemes = [item for item in lexemes if item["lessonRef"] == lesson_id]
        lesson_texts = [item for item in texts if item["lessonRef"] == lesson_id]
        grammar_sources = [
            grammar_source(title, page, row, page_by_number)
            for title, page, row in GRAMMAR_SPECS[lesson_number]
        ]

        requests: list[tuple[str, str, str]] = []
        for item in lesson_lexemes:
            requests.append(("lexeme", item["id"], item["hanzi"]))
        for text in lesson_texts:
            title_zh = text.get("title", {}).get("zh")
            if title_zh:
                requests.append(("text-title", text["id"], title_zh))
            for index, line in enumerate(text.get("lines", [])):
                requests.append(("text-line", f"{text['id']}:{index}", line["textZh"]))
        for index, source in enumerate(grammar_sources, start=1):
            point_id = f"hsk4l-tb-l{lesson_number:02d}-grammar-{index:02d}"
            requests.append(("grammar-title", point_id, source["titleZh"]))
            requests.append(("grammar-explanation", point_id, source["explanationZh"]))
            for example_index, example in enumerate(source["examplesZh"]):
                requests.append(("grammar-example", f"{point_id}:{example_index}", example))

        translated = translate_in_chunks([request[2] for request in requests])
        response_by_key = {
            (kind, key): response
            for (kind, key, _), response in zip(requests, translated, strict=True)
        }

        for item in lesson_lexemes:
            lexeme_meanings[item["id"]] = response_by_key[("lexeme", item["id"])]["translationVi"]
        for text in lesson_texts:
            title_zh = text.get("title", {}).get("zh")
            if title_zh:
                text_titles[text["id"]] = response_by_key[("text-title", text["id"])]
            text_lines[text["id"]] = [
                response_by_key[("text-line", f"{text['id']}:{index}")]
                for index, _line in enumerate(text.get("lines", []))
            ]
        for index, source in enumerate(grammar_sources, start=1):
            point_id = f"hsk4l-tb-l{lesson_number:02d}-grammar-{index:02d}"
            title = response_by_key[("grammar-title", point_id)]
            explanation = response_by_key[("grammar-explanation", point_id)]
            grammar_points[point_id] = {
                "lessonRef": lesson_id,
                "titleZh": source["titleZh"],
                "titleVi": title["translationVi"],
                "formula": source["titleZh"],
                "explanationVi": explanation["translationVi"],
                "examples": [
                    {
                        "hanzi": hanzi,
                        **response_by_key[("grammar-example", f"{point_id}:{example_index}")],
                    }
                    for example_index, hanzi in enumerate(source["examplesZh"])
                ],
            }

        print(f"Processed lesson {lesson_number}: {len(requests)} strings")
        time.sleep(0.15)

    dump(
        args.output,
        {
            "schemaVersion": "1.0.0",
            "status": "machine-translated-needs-language-review",
            "lexemeMeanings": lexeme_meanings,
            "textTitles": text_titles,
            "textLines": text_lines,
            "grammarPoints": grammar_points,
        },
    )
    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()
