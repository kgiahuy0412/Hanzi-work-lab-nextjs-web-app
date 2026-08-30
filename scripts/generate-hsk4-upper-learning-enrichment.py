from __future__ import annotations

import argparse
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any


TRANSLATE_ENDPOINT = "https://translate.googleapis.com/translate_a/single"
CJK_RE = re.compile(r"[\u3400-\u9fff]")
NUMBERED_EXAMPLE_RE = re.compile(r"^\s*[（(]\d+[）)]")
CHINESE_CONTENT_RE = re.compile(r"[\u3400-\u9fffA-Z：:，。！？；、“”‘’《》（）()0-9%+\-/……]+")
TRACK_RE = re.compile(r"\b\d{2}-[1-5]\b")
SPEAKER_RE = re.compile(r"([\u3400-\u9fff]{1,5})[：:]")
PROPER_NAME_ROW_RE = re.compile(r"^(?:\d+[.．、]?)?[\u3400-\u9fff]{1,5}\s*[A-Z]")

GRAMMAR_SPECS: dict[int, list[tuple[str, int, int]]] = {
    1: [("不仅……也/还/而且……", 13, 0), ("从来", 13, 18), ("刚", 14, 11), ("即使……也……", 17, 16), ("（在）……上", 18, 7)],
    2: [("正好", 25, 1), ("差不多", 25, 24), ("尽管", 27, 26), ("却", 30, 3), ("而", 30, 17)],
    3: [("挺", 37, 1), ("本来", 37, 12), ("另外", 38, 11), ("首先……其次……", 42, 19), ("不管", 43, 7)],
    4: [("以为", 51, 0), ("原来", 51, 13), ("并", 53, 14), ("按照", 56, 3), ("甚至", 56, 14)],
    5: [("肯定", 63, 2), ("再说", 64, 3), ("实际", 64, 23), ("对……来说", 67, 21), ("尤其", 68, 3)],
    6: [("竟然", 77, 2), ("倍", 77, 17), ("值得", 78, 10), ("其中", 81, 16), ("（在）……下", 82, 3)],
    7: [("估计", 89, 1), ("来不及", 90, 26), ("离合词重叠", 91, 9), ("要是", 93, 19), ("既……又/也/还……", 94, 3)],
    8: [("使", 101, 0), ("只要", 101, 13), ("可不是", 102, 8), ("因此", 104, 18), ("往往", 105, 1)],
    9: [("难道", 113, 0), ("通过", 114, 3), ("可是", 116, 3), ("结果", 118, 21), ("上", 119, 10)],
    10: [("不过", 127, 1), ("确实", 129, 9), ("在……看来", 129, 31), ("由于", 132, 3), ("比如", 132, 25)],
}

OCR_FIXES = {
    "美慕": "羡慕",
    "竞然": "竟然",
    "干静": "王静",
    "-起": "一起",
    "—起": "一起",
    "1起": "一起",
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


def fix_ocr(value: str) -> str:
    result = value
    for source, target in OCR_FIXES.items():
        result = result.replace(source, target)
    result = result.replace("生词", "")
    result = re.sub(r"专有名词.*$", "", result)
    result = re.sub(r"8开玩笑$", "", result)
    return result.replace("..", "。")


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
        {"client": "gtx", "sl": "zh-CN", "tl": "vi", "dt": ["t", "rm"], "q": "\n".join(texts)},
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
            results.extend(translate_with_retries([text]))
            time.sleep(0.25)
        return results
    return [
        {"translationVi": clean_space(translation), "pinyin": clean_space(romanization).lower()}
        for translation, romanization in zip(translations, pinyin, strict=True)
    ]


def local_translate_batch(texts: list[str]) -> list[dict[str, str]]:
    try:
        from argostranslate import translate as argos_translate
        from pypinyin import Style, lazy_pinyin
    except ImportError as exc:  # pragma: no cover - setup fallback
        raise RuntimeError(
            "Google Translate đang giới hạn tần suất. Cài argostranslate và pypinyin để dùng bản dịch cục bộ."
        ) from exc

    results: list[dict[str, str]] = []
    for value in texts:
        english = argos_translate.translate(value, "zh", "en")
        vietnamese = argos_translate.translate(english, "en", "vi")
        romanization = " ".join(lazy_pinyin(value, style=Style.TONE, errors=lambda chars: list(chars)))
        romanization = re.sub(r"\s+([，。！？；：、,.!?;:%）)])", r"\1", romanization)
        romanization = re.sub(r"([（(])\s+", r"\1", romanization)
        results.append({
            "translationVi": clean_space(vietnamese),
            "pinyin": clean_space(romanization).lower(),
        })
    return results


def translate_with_retries(texts: list[str]) -> list[dict[str, str]]:
    last_error: Exception | None = None
    for attempt in range(7):
        try:
            return translate_batch(texts)
        except urllib.error.HTTPError as exc:
            last_error = exc
            if exc.code == 429:
                return local_translate_batch(texts)
            if exc.code != 429:
                time.sleep(1.5 + attempt)
                continue
            retry_after = int(exc.headers.get("Retry-After", "0") or 0)
            time.sleep(max(retry_after, min(30, 3 * (attempt + 1))))
        except Exception as exc:  # pragma: no cover - network failure path
            last_error = exc
            time.sleep(1.5 + attempt)
    raise RuntimeError(f"Không thể tạo bản dịch cho {len(texts)} chuỗi") from last_error


def translate_in_chunks(texts: list[str]) -> list[dict[str, str]]:
    result: list[dict[str, str]] = []
    chunk: list[str] = []
    chunk_size = 0
    for value in texts:
        encoded_size = len(urllib.parse.quote(value))
        if chunk and (len(chunk) >= 12 or chunk_size + encoded_size > 2200):
            result.extend(translate_with_retries(chunk))
            chunk = []
            chunk_size = 0
            time.sleep(0.35)
        chunk.append(value)
        chunk_size += encoded_size
    if chunk:
        result.extend(translate_with_retries(chunk))
    return result


def fragment_left(fragment: dict[str, Any]) -> float:
    return min(point[0] for point in fragment.get("box", [])) if fragment.get("box") else 9999


def row_left_text(row: dict[str, Any]) -> str:
    if PROPER_NAME_ROW_RE.match(row.get("text", "").strip()):
        return ""
    parts = [
        fragment["text"]
        for fragment in row.get("fragments", [])
        if fragment_left(fragment) < 660 and CJK_RE.search(fragment.get("text", ""))
    ]
    return fix_ocr(chinese_content("".join(parts)))


def reconstruct_text(text: dict[str, Any], page_by_id: dict[str, dict[str, Any]]) -> list[dict[str, str]]:
    page = page_by_id[text["sourcePageRef"]]
    rows = page["rows"]
    start = next((i for i, row in enumerate(rows) if text["trackCode"] in row["text"]), None)
    if start is None:
        source_indexes = set(text.get("sourceRowIndexes", []))
        selected = [row for row in rows if row.get("rowIndex") in source_indexes]
        if not selected:
            raise RuntimeError(f"Không tìm thấy tiêu đề track {text['trackCode']} cho {text['id']}")
    else:
        selected = []
        for row in rows[start + 1:]:
            if TRACK_RE.search(row["text"]):
                break
            if any(marker in row["text"] for marker in ("拼音课文", "注释", "根据课文内容", "练习1")):
                break
            selected.append(row)

    if text["textType"] == "short-passage":
        paragraph = "".join(filter(None, (row_left_text(row) for row in selected)))
        return [{"speaker": "Bài khóa", "hanzi": paragraph}]

    turns: list[dict[str, str]] = []
    for row in selected:
        value = row_left_text(row)
        if not value:
            continue
        speaker_match = SPEAKER_RE.search(value)
        if speaker_match:
            speaker = speaker_match.group(1)
            content = value[speaker_match.end():]
            turns.append({"speaker": speaker, "hanzi": content})
        elif turns:
            turns[-1]["hanzi"] += value

    return [turn for turn in turns if turn["hanzi"]]


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
        chinese = fix_ocr(chinese_content(text))
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


def valid_cached_text(cached: Any, reconstructed: list[dict[str, str]]) -> bool:
    return (
        isinstance(cached, list)
        and len(cached) == len(reconstructed)
        and all(
            item.get("hanzi") == source["hanzi"]
            and item.get("pinyin", "").strip()
            and item.get("translationVi", "").strip()
            for item, source in zip(cached, reconstructed, strict=True)
        )
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Tạo dữ liệu học HSK4 thượng quyển đã làm sạch OCR và bổ sung bản dịch.")
    parser.add_argument("--bundle", type=Path, default=Path("content/hsk4-upper-textbook-json"))
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("content/hsk4-upper-textbook-json/shared/learning-enrichment.json"),
    )
    args = parser.parse_args()

    root = args.bundle
    lessons = [load(root / "lessons" / f"lesson-{number:02d}.json") for number in range(1, 11)]
    lexemes = load(root / "shared" / "lexemes.json")["lexemes"]
    texts = load(root / "shared" / "texts.json")["texts"]
    pages = load(root / "shared" / "source-pages.json")["pages"]
    page_by_id = {page["id"]: page for page in pages}
    page_by_number = {page["pdfPage"]: page for page in pages}

    existing = load(args.output) if args.output.exists() else {}
    lexeme_meanings: dict[str, str] = dict(existing.get("lexemeMeanings", {}))
    text_titles: dict[str, dict[str, str]] = dict(existing.get("textTitles", {}))
    text_content: dict[str, list[dict[str, str]]] = dict(existing.get("textContent", {}))
    grammar_points: dict[str, dict[str, Any]] = dict(existing.get("grammarPoints", {}))

    for lesson in lessons:
        lesson_number = lesson["lessonNumber"]
        lesson_id = lesson["id"]
        lesson_lexemes = [item for item in lexemes if item["lessonRef"] == lesson_id]
        lesson_texts = [item for item in texts if item["lessonRef"] == lesson_id]
        reconstructed = {item["id"]: reconstruct_text(item, page_by_id) for item in lesson_texts}
        grammar_sources = [
            grammar_source(title, page, row, page_by_number)
            for title, page, row in GRAMMAR_SPECS[lesson_number]
        ]

        requests: list[tuple[str, str, str]] = []
        for item in lesson_lexemes:
            if not lexeme_meanings.get(item["id"], "").strip():
                requests.append(("lexeme", item["id"], item["hanzi"]))
        for item in lesson_texts:
            title_zh = item.get("title", {}).get("zh")
            if title_zh and not text_titles.get(item["id"], {}).get("translationVi", "").strip():
                requests.append(("text-title", item["id"], title_zh))
            if not valid_cached_text(text_content.get(item["id"]), reconstructed[item["id"]]):
                for index, line in enumerate(reconstructed[item["id"]]):
                    requests.append(("text-line", f"{item['id']}:{index}", line["hanzi"]))
        for index, source in enumerate(grammar_sources, start=1):
            point_id = f"hsk4u-tb-l{lesson_number:02d}-grammar-{index:02d}"
            cached = grammar_points.get(point_id, {})
            cache_valid = (
                cached.get("titleZh") == source["titleZh"]
                and cached.get("explanationVi", "").strip()
                and len(cached.get("examples", [])) == len(source["examplesZh"])
                and all(example.get("pinyin") and example.get("translationVi") for example in cached.get("examples", []))
            )
            if not cache_valid:
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
            response = response_by_key.get(("lexeme", item["id"]))
            if response:
                lexeme_meanings[item["id"]] = response["translationVi"]
        for item in lesson_texts:
            title_response = response_by_key.get(("text-title", item["id"]))
            if title_response:
                text_titles[item["id"]] = title_response
            if not valid_cached_text(text_content.get(item["id"]), reconstructed[item["id"]]):
                text_content[item["id"]] = [
                    {
                        **line,
                        **response_by_key[("text-line", f"{item['id']}:{index}")],
                    }
                    for index, line in enumerate(reconstructed[item["id"]])
                ]
        for index, source in enumerate(grammar_sources, start=1):
            point_id = f"hsk4u-tb-l{lesson_number:02d}-grammar-{index:02d}"
            if ("grammar-title", point_id) not in response_by_key:
                continue
            grammar_points[point_id] = {
                "lessonRef": lesson_id,
                "titleZh": source["titleZh"],
                "titleVi": response_by_key[("grammar-title", point_id)]["translationVi"],
                "formula": source["titleZh"],
                "explanationVi": response_by_key[("grammar-explanation", point_id)]["translationVi"],
                "examples": [
                    {
                        "hanzi": hanzi,
                        **response_by_key[("grammar-example", f"{point_id}:{example_index}")],
                    }
                    for example_index, hanzi in enumerate(source["examplesZh"])
                ],
            }

        payload = {
            "schemaVersion": "1.0.0",
            "status": "machine-translated-needs-language-review",
            "lexemeMeanings": lexeme_meanings,
            "textTitles": text_titles,
            "textContent": text_content,
            "grammarPoints": grammar_points,
        }
        dump(args.output, payload)
        print(f"Processed lesson {lesson_number:02d}: {len(requests)} new strings", flush=True)
        time.sleep(0.5)

    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()
