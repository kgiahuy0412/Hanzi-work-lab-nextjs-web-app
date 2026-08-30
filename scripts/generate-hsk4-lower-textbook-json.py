from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

from pypinyin import Style, lazy_pinyin


SCHEMA_VERSION = "1.0.0"
BUNDLE_ID = "hsk4-standard-course-lower-textbook-vi-v1"
CJK_RE = re.compile(r"[\u3400-\u9fff]")
CJK_RUN_RE = re.compile(r"[\u3400-\u9fff（）()]+")
NUMBERED_PROPER_NAME_RE = re.compile(r"(?:^|\s)\d+[.．、]\s*([\u3400-\u9fff]{2,})")
TRACK_RE = re.compile(r"(?<!\d)(1[1-9]|20)\s*[-._]?\s*([1-5])(?!\d)")
VOCAB_ANCHOR_RE = re.compile(r"^\s*\*?\s*(\d{1,2})\s*[.．、]\s*(.*[\u3400-\u9fff].*)$")
NOISE_PREFIXES = ("Scanned by ", "www.nhantriviet.com", "/GiaoTrinhChuanHSK")


LESSONS = [
    (11, 10, 22, "读书好，读好书，好读书", "Đọc sách có rất nhiều lợi ích, đọc sách hay, thích đọc sách"),
    (12, 23, 35, "用心发现世界", "Khám phá thế giới bằng trái tim"),
    (13, 36, 49, "喝着茶看京剧", "Uống trà trong lúc xem Kinh kịch"),
    (14, 50, 63, "保护地球母亲", "Bảo vệ Mẹ Trái đất"),
    (15, 64, 79, "教育孩子的艺术", "Nghệ thuật giáo dục con cái"),
    (16, 80, 93, "生活可以更美好", "Cuộc sống có thể tốt đẹp hơn"),
    (17, 94, 107, "人与自然", "Con người và thiên nhiên"),
    (18, 108, 121, "科技与世界", "Khoa học công nghệ và thế giới"),
    (19, 122, 134, "生活的味道", "Mùi vị của cuộc sống"),
    (20, 135, 148, "路上的风景", "Quang cảnh dọc đường"),
]

CULTURE_TOPICS = {
    11: ("中国古典文学名著——《西游记》", "Tây du ký - kiệt tác văn học cổ điển của Trung Quốc"),
    12: ("孔子“因材施教”", "Phương pháp “dạy theo năng khiếu” của Khổng Tử"),
    13: ("中国的筷子文化", "Văn hóa đũa của Trung Quốc"),
    14: ("“天人合一”——中国人的“人与自然观”", "“Thiên nhân hợp nhất” - quan điểm của người Trung Quốc về con người và thiên nhiên"),
    15: ("孟母三迁的故事", "Câu chuyện Mạnh mẫu ba lần dọn nhà"),
    16: ("只要功夫深，铁杵磨成针", "Có công mài sắt có ngày nên kim"),
    17: ("中国国宝大熊猫", "Gấu trúc - báu vật quốc gia của Trung Quốc"),
    18: ("微博与微信", "Weibo và WeChat"),
    19: ("舌尖上的中国——饺子", "Bánh chẻo - thức ăn truyền thống của Trung Quốc"),
    20: ("中国的少数民族", "Các dân tộc thiểu số ở Trung Quốc"),
}

COMPARISONS = {
    11: ("无论", "不管"),
    12: ("对于", "关于"),
    13: ("大概", "也许"),
    14: ("于是", "因此"),
    15: ("千万", "一定"),
    16: ("恐怕", "怕"),
    17: ("越", "越"),
    18: ("接着", "然后"),
    19: ("出来", "起来"),
    20: ("究竟", "到底"),
}

SAME_CHARACTER_GROUPS = {
    11: {"character": "同", "words": ["同意", "共同", "相同", "同时"]},
    12: {"character": "用", "words": ["信用卡", "作用", "使用"]},
    13: {"character": "量", "words": ["商量", "数量", "质量"]},
    14: {"character": "度", "words": ["速度", "温度", "态度"]},
    15: {"character": "护", "words": ["护照", "保护", "护士"]},
    16: {"character": "重", "words": ["严重", "重点", "重视", "尊重"]},
    17: {"character": "然", "words": ["既然", "竟然", "仍然", "突然"]},
    18: {"character": "点", "words": ["地点", "特点", "优点", "缺点", "重点"]},
    19: {"character": "发", "words": ["沙发", "发生", "发展", "理发"]},
    20: {"character": "格", "words": ["性格", "价格", "表格", "合格", "严格"]},
}

SECTION_KEYWORDS = {
    "pinyin-transcript": ("拼音课文",),
    "annotation": ("注释",),
    "practice": ("练习", "练一练"),
    "comparison": ("比一比",),
    "extension": ("扩展",),
    "application": ("运用",),
    "culture": ("文化",),
}


def dump_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def pinyin(text: str) -> str:
    return " ".join(lazy_pinyin(text, style=Style.TONE, neutral_tone_with_five=False))


def bbox_metrics(box: list[list[float]]) -> tuple[float, float, float, float]:
    xs = [point[0] for point in box]
    ys = [point[1] for point in box]
    return min(xs), min(ys), max(xs), max(ys)


def fragment_left(fragment: dict[str, Any]) -> float:
    return min(point[0] for point in fragment["box"])


def basic_noise(text: str, top: float, left: float) -> bool:
    value = text.strip()
    if not value:
        return True
    if any(value.startswith(prefix) for prefix in NOISE_PREFIXES):
        return True
    if top > 1490 and re.fullmatch(r"\d{1,3}", value):
        return True
    if left < 90 and top > 1000 and any(token in value for token in ("GiaoTrinh", "nhantriviet", "ChuanHSK")):
        return True
    return False


def printed_page_number(lines: list[dict[str, Any]]) -> int | None:
    candidates = []
    for line in lines:
        left, top, _, _ = bbox_metrics(line["box"])
        value = line["text"].strip()
        if top > 1450 and re.fullmatch(r"\d{1,3}", value):
            number = int(value)
            if 1 <= number <= 200:
                candidates.append((top, left, number))
    return max(candidates)[2] if candidates else None


def build_rows(lines: list[dict[str, Any]]) -> list[dict[str, Any]]:
    fragments = []
    for line in lines:
        left, top, right, bottom = bbox_metrics(line["box"])
        fragments.append(
            {
                "text": line["text"].strip(),
                "confidence": line["confidence"],
                "box": line["box"],
                "left": left,
                "top": top,
                "right": right,
                "bottom": bottom,
                "centerY": (top + bottom) / 2,
                "isNoiseFragment": basic_noise(line["text"], top, left),
            }
        )
    fragments.sort(key=lambda value: (value["centerY"], value["left"]))
    rows: list[dict[str, Any]] = []
    for fragment in fragments:
        same_class = rows and fragment["isNoiseFragment"] == rows[-1]["fragments"][0]["isNoiseFragment"]
        if rows and same_class and abs(fragment["centerY"] - rows[-1]["centerY"]) <= 8:
            rows[-1]["fragments"].append(fragment)
            centers = [item["centerY"] for item in rows[-1]["fragments"]]
            rows[-1]["centerY"] = sum(centers) / len(centers)
        else:
            rows.append({"centerY": fragment["centerY"], "fragments": [fragment]})
    normalized = []
    for index, row in enumerate(rows):
        row["fragments"].sort(key=lambda value: value["left"])
        left = min(fragment["left"] for fragment in row["fragments"])
        top = min(fragment["top"] for fragment in row["fragments"])
        text = " ".join(fragment["text"] for fragment in row["fragments"] if fragment["text"])
        normalized.append(
            {
                "rowIndex": index,
                "top": round(top, 1),
                "left": round(left, 1),
                "text": text,
                "minConfidence": round(min(fragment["confidence"] for fragment in row["fragments"]), 4),
                "isNoise": basic_noise(text, top, left),
                "fragments": [
                    {"text": fragment["text"], "confidence": fragment["confidence"], "box": fragment["box"]}
                    for fragment in row["fragments"]
                ],
            }
        )
    return normalized


def load_pages(ocr_dir: Path) -> dict[int, dict[str, Any]]:
    pages = {}
    for path in sorted(ocr_dir.glob("page-*.json")):
        raw = json.loads(path.read_text(encoding="utf-8"))
        number = int(raw["page"])
        pages[number] = {
            "id": f"hsk4l-tb-source-page-{number:03d}",
            "pdfPage": number,
            "printedPage": printed_page_number(raw["lines"]),
            "ocr": {
                "engine": "RapidOCR/ONNX Runtime",
                "elapsedSeconds": raw["elapsedSeconds"],
                "status": "machine-transcribed-needs-review",
            },
            "rows": build_rows(raw["lines"]),
        }
    return pages


def page_text(page: dict[str, Any]) -> str:
    return "".join(row["text"] for row in page["rows"] if not row["isNoise"]).replace(" ", "")


def meaningful_row_indexes(page: dict[str, Any]) -> list[int]:
    return [row["rowIndex"] for row in page["rows"] if not row["isNoise"]]


def contains_any(page: dict[str, Any], terms: tuple[str, ...]) -> bool:
    text = page_text(page)
    return any(term in text for term in terms)


def find_comparison_page(lesson: dict[str, Any], pages: dict[int, dict[str, Any]]) -> int:
    left, right = COMPARISONS[lesson["number"]]
    candidates = []
    fallback = []
    for number in range(lesson["start"], lesson["end"] + 1):
        text = page_text(pages[number])
        terms_present = left in text and right in text if left != right else text.count(left) >= 2
        if not terms_present:
            continue
        fallback.append(number)
        if any(marker in text for marker in ("相同点", "不同点", "比一比")):
            candidates.append(number)
    if candidates:
        return max(candidates)
    if fallback:
        return max(fallback)
    return lesson["start"]


def track_headers(page: dict[str, Any], lesson_number: int) -> list[dict[str, Any]]:
    headers = []
    for row in page["rows"]:
        if row["isNoise"]:
            continue
        scene = None
        track_code = None
        for fragment in row["fragments"]:
            match = TRACK_RE.search(fragment["text"])
            if match and int(match.group(1)) == lesson_number:
                scene = int(match.group(2))
                track_code = f"{lesson_number:02d}-{scene}"
                break
        if scene is None:
            continue
        chinese = "".join(
            fragment["text"]
            for fragment in row["fragments"]
            if fragment_left(fragment) < 700 and CJK_RE.search(fragment["text"])
        )
        chinese = TRACK_RE.sub("", chinese)
        chinese = re.sub(r"^课文\s*[1-5]?\s*", "", chinese)
        chinese = re.sub(r"^\s*[1-5]\s*", "", chinese).strip()
        headers.append(
            {
                "scene": scene,
                "trackCode": track_code,
                "rowIndex": row["rowIndex"],
                "top": row["top"],
                "titleZh": chinese or None,
                "detectionSource": "printed-track-code",
            }
        )
    by_scene = {}
    for header in headers:
        by_scene.setdefault(header["scene"], header)
    for row in page["rows"]:
        if row["isNoise"]:
            continue
        nearby_vocab = any(
            row["top"] < later["top"] <= row["top"] + 100 and "生词" in later["text"]
            for later in page["rows"]
        )
        if not nearby_vocab:
            continue
        for fragment in row["fragments"]:
            if not (100 <= fragment_left(fragment) < 650):
                continue
            match = re.match(r"^(?:课文)?\s*([1-5])\s*([\u3400-\u9fff].*)$", fragment["text"].strip())
            if not match:
                continue
            scene = int(match.group(1))
            if scene in by_scene:
                break
            by_scene[scene] = {
                "scene": scene,
                "trackCode": f"{lesson_number:02d}-{scene}",
                "rowIndex": row["rowIndex"],
                "top": row["top"],
                "titleZh": match.group(2).strip(),
                "detectionSource": "layout-inferred-from-heading-and-vocabulary-column",
            }
            break
    return sorted(by_scene.values(), key=lambda value: value["top"])


def extract_scene(page: dict[str, Any], header: dict[str, Any], next_top: float | None, lesson_id: str) -> dict[str, Any]:
    selected_rows = []
    raw_segments = []
    for row in page["rows"]:
        if row["rowIndex"] <= header["rowIndex"] or row["isNoise"]:
            continue
        if next_top is not None and row["top"] >= next_top - 8:
            break
        if row["top"] > 1535:
            break
        if any(term in row["text"] for term in ("拼音课文", "专有名词", "注释", "练习", "比一比", "扩展", "运用", "文化")):
            break
        segments = []
        for fragment in row["fragments"]:
            left = fragment_left(fragment)
            value = fragment["text"].strip()
            if 170 <= left < 690 and CJK_RE.search(value):
                segments.append(value)
        if segments:
            selected_rows.append(row["rowIndex"])
            raw_segments.append("".join(segments))
    lines = []
    for segment in raw_segments:
        if "：" in segment or ":" in segment:
            parts = re.split(r"[：:]", segment, maxsplit=1)
            lines.append({"speaker": parts[0].strip() or None, "textZh": parts[1].strip()})
        elif lines and lines[-1]["speaker"] is not None:
            lines[-1]["textZh"] += segment
        elif lines:
            lines[-1]["textZh"] += segment
        else:
            lines.append({"speaker": None, "textZh": segment})
    title_zh = header["titleZh"]
    return {
        "id": f"{lesson_id}-text-{header['scene']}",
        "lessonRef": lesson_id,
        "textNumber": header["scene"],
        "textType": "dialogue" if header["scene"] <= 3 else "short-passage",
        "title": {"zh": title_zh, "pinyin": pinyin(title_zh) if title_zh else None},
        "trackCode": header["trackCode"],
        "trackDetectionSource": header["detectionSource"],
        "sourcePageRef": page["id"],
        "sourceRowIndexes": selected_rows,
        "lines": lines,
        "transcriptionStatus": "ocr-needs-editorial-review" if lines else "track-detected-content-needs-manual-transcription",
    }


def extract_lexemes_for_lesson(lesson: dict[str, Any], pages: dict[int, dict[str, Any]]) -> list[dict[str, Any]]:
    found: dict[int, dict[str, Any]] = {}
    for page_number in range(lesson["start"], lesson["end"] + 1):
        page = pages[page_number]
        if "生词" not in page_text(page):
            continue
        anchors = []
        for row in page["rows"]:
            for fragment in row["fragments"]:
                if fragment_left(fragment) < 640:
                    continue
                match = VOCAB_ANCHOR_RE.match(fragment["text"])
                if match:
                    number = int(match.group(1))
                    if 1 <= number <= 50:
                        anchors.append((number, row["rowIndex"], match.group(2), fragment["text"].strip()))
                        break
        anchors.sort(key=lambda value: value[1])
        for index, (number, row_index, head, anchor_raw) in enumerate(anchors):
            end = anchors[index + 1][1] if index + 1 < len(anchors) else len(page["rows"])
            row_indexes = []
            raw_tokens = []
            for current in range(row_index, end):
                row = page["rows"][current]
                if row["isNoise"]:
                    continue
                right = [fragment for fragment in row["fragments"] if fragment_left(fragment) >= 640]
                if not right:
                    continue
                if any(TRACK_RE.search(fragment["text"]) for fragment in right):
                    break
                if any(term in row["text"] for term in ("专有名词", "拼音课文", "注释", "练习")):
                    break
                row_indexes.append(current)
                raw_tokens.extend(fragment["text"].strip() for fragment in right if fragment["text"].strip())
            hanzi_match = CJK_RUN_RE.match(head.strip().lstrip("*"))
            if not hanzi_match:
                continue
            hanzi_source = hanzi_match.group(0)
            hanzi = hanzi_source.replace("（", "").replace("）", "").replace("(", "").replace(")", "")
            raw = " ".join(raw_tokens)
            candidate = {
                "id": f"hsk4l-tb-l{lesson['number']:02d}-v{number:02d}",
                "lessonRef": f"hsk4l-tb-lesson-{lesson['number']:02d}",
                "sourceNumber": number,
                "hanzi": hanzi,
                "hanziSource": hanzi_source,
                "pinyin": pinyin(hanzi),
                "sourceTextOcrRaw": raw,
                "isBeyondHsk4Marked": anchor_raw.startswith("*") or "*" in anchor_raw[:3],
                "sourcePageRef": page["id"],
                "sourceRowIndexes": row_indexes,
                "sourceEvidence": "lesson-page-ocr",
                "transcriptionStatus": "ocr-needs-editorial-review",
            }
            existing = found.get(number)
            if existing is None or len(candidate["sourceTextOcrRaw"]) > len(existing["sourceTextOcrRaw"]):
                found[number] = candidate
    if not found:
        return []
    result = []
    for number in range(1, max(found) + 1):
        if number in found:
            result.append(found[number])
        else:
            result.append(
                {
                    "id": f"hsk4l-tb-l{lesson['number']:02d}-v{number:02d}",
                    "lessonRef": f"hsk4l-tb-lesson-{lesson['number']:02d}",
                    "sourceNumber": number,
                    "hanzi": None,
                    "hanziSource": None,
                    "pinyin": None,
                    "sourceTextOcrRaw": None,
                    "isBeyondHsk4Marked": None,
                    "sourcePageRef": None,
                    "sourceRowIndexes": [],
                    "sourceEvidence": "none",
                    "transcriptionStatus": "ocr-anchor-missed-manual-review-required",
                }
            )
    return result


def extract_proper_names(lesson: dict[str, Any], pages: dict[int, dict[str, Any]]) -> list[dict[str, Any]]:
    names = []
    serial = 0
    seen: set[tuple[int, str]] = set()
    for page_number in range(lesson["start"], lesson["end"] + 1):
        page = pages[page_number]
        rows = page["rows"]
        starts = [row["rowIndex"] for row in rows if "专有名词" in row["text"]]
        for start in starts:
            for row in rows[start + 1 :]:
                if row["top"] > 1530 or TRACK_RE.search(row["text"]) or "拼音课文" in row["text"]:
                    break
                # Numbered entries can share one OCR row and may begin left of the
                # nominal right column (for example, entries 2 and 3 on PDF page 136).
                candidates = NUMBERED_PROPER_NAME_RE.findall(row["text"])
                if not candidates:
                    # Single-entry lists in lessons 11 and 13 lost their number during
                    # OCR, so fall back to CJK runs in the proper-name column only.
                    candidates = [
                        match.group(0)
                        for fragment in row["fragments"]
                        if fragment_left(fragment) >= 640
                        for match in [re.search(r"[\u3400-\u9fff]{2,}", fragment["text"].lstrip("*"))]
                        if match
                    ]
                for hanzi in candidates:
                    key = (page_number, hanzi)
                    if key in seen:
                        continue
                    seen.add(key)
                    serial += 1
                    names.append(
                        {
                            "id": f"hsk4l-tb-l{lesson['number']:02d}-proper-{serial:02d}",
                            "lessonRef": f"hsk4l-tb-lesson-{lesson['number']:02d}",
                            "hanzi": hanzi,
                            "pinyin": pinyin(hanzi),
                            "sourceTextOcrRaw": row["text"],
                            "sourcePageRef": page["id"],
                            "sourceRowIndexes": [row["rowIndex"]],
                            "transcriptionStatus": "ocr-needs-editorial-review",
                        }
                    )
    return names


def make_blocks(kind: str, lesson: dict[str, Any], page_numbers: list[int], pages: dict[int, dict[str, Any]]) -> list[dict[str, Any]]:
    blocks = []
    for index, page_number in enumerate(page_numbers, start=1):
        page = pages[page_number]
        headings = [
            row["text"]
            for row in page["rows"]
            if not row["isNoise"] and CJK_RE.search(row["text"])
            and any(keyword in row["text"] for keyword in SECTION_KEYWORDS.get(kind, ()))
        ]
        blocks.append(
            {
                "id": f"hsk4l-tb-l{lesson['number']:02d}-{kind}-{index:02d}",
                "lessonRef": f"hsk4l-tb-lesson-{lesson['number']:02d}",
                "kind": kind,
                "sourcePageRef": page["id"],
                "sourceRowIndexes": meaningful_row_indexes(page),
                "detectedHeadingsOcrRaw": headings,
                "transcriptionStatus": "page-block-ocr-needs-editorial-review",
            }
        )
    return blocks


def assign_page_roles(pages: dict[int, dict[str, Any]]) -> None:
    for number, page in pages.items():
        if number <= 9:
            page["role"] = "front-matter"
        elif number <= 148:
            page["role"] = "lesson-content"
            for lesson_number, start, end, _, _ in LESSONS:
                if start <= number <= end:
                    page["lessonNumber"] = lesson_number
                    break
        elif number <= 158:
            page["role"] = "vocabulary-appendix"
        elif number == 159:
            page["role"] = "proper-name-appendix"
        elif number == 160:
            page["role"] = "beyond-level-vocabulary-appendix"
        elif number <= 163:
            page["role"] = "related-word-appendix"
        else:
            page["role"] = "answer-key"


def build_schema() -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://himi.local/schemas/hsk4-lower-textbook-lesson.schema.json",
        "title": "HSK 4 lower-volume textbook lesson",
        "type": "object",
        "additionalProperties": False,
        "required": ["schemaVersion", "id", "lessonNumber", "status", "title", "source", "sections", "editorial"],
        "properties": {
            "$schema": {"type": "string"},
            "schemaVersion": {"const": SCHEMA_VERSION},
            "id": {"type": "string", "pattern": "^hsk4l-tb-lesson-(1[1-9]|20)$"},
            "lessonNumber": {"type": "integer", "minimum": 11, "maximum": 20},
            "status": {"enum": ["draft", "review", "published"]},
            "title": {"type": "object", "required": ["zh", "pinyin", "vi"]},
            "source": {"type": "object", "required": ["pdfPages", "printedPages", "sourcePageRefs"]},
            "sections": {"type": "array", "minItems": 10},
            "editorial": {"type": "object"},
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--ocr-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, default=Path("content/hsk4-lower-textbook-json"))
    args = parser.parse_args()

    pages = load_pages(args.ocr_dir)
    missing_ocr = [number for number in range(1, 175) if number not in pages]
    if missing_ocr:
        raise SystemExit(f"Missing OCR pages: {missing_ocr}")
    assign_page_roles(pages)
    output = args.output_dir

    lessons = [
        {"number": number, "start": start, "end": end, "titleZh": title_zh, "titleVi": title_vi}
        for number, start, end, title_zh, title_vi in LESSONS
    ]
    all_lexemes = []
    all_texts = []
    all_media = []
    all_proper_names = []
    all_cultures = []
    blocks_by_kind: dict[str, list[dict[str, Any]]] = {
        "warmup": [],
        "pinyin-transcript": [],
        "annotation": [],
        "practice": [],
        "comparison": [],
        "extension": [],
        "application": [],
        "culture": [],
    }
    lesson_documents = []

    for lesson in lessons:
        lesson_id = f"hsk4l-tb-lesson-{lesson['number']:02d}"
        lesson_pages = list(range(lesson["start"], lesson["end"] + 1))
        warmup = make_blocks("warmup", lesson, [lesson["start"]], pages)
        blocks_by_kind["warmup"].extend(warmup)
        section_refs: dict[str, list[str]] = {"warmup": [block["id"] for block in warmup]}
        comparison_page = find_comparison_page(lesson, pages)
        culture_page = lesson["end"]
        for kind in ("pinyin-transcript", "annotation", "practice", "comparison", "extension", "application", "culture"):
            if kind == "comparison":
                page_numbers = [comparison_page]
            elif kind == "culture":
                page_numbers = [culture_page]
            else:
                page_numbers = [number for number in lesson_pages if contains_any(pages[number], SECTION_KEYWORDS[kind])]
            built = make_blocks(kind, lesson, page_numbers, pages)
            blocks_by_kind[kind].extend(built)
            section_refs[kind] = [block["id"] for block in built]

        detected_texts: dict[int, dict[str, Any]] = {}
        text_page_refs = []
        for page_number in lesson_pages:
            headers = track_headers(pages[page_number], lesson["number"])
            if headers:
                text_page_refs.append(pages[page_number]["id"])
            for index, header in enumerate(headers):
                next_top = headers[index + 1]["top"] if index + 1 < len(headers) else None
                detected_texts[header["scene"]] = extract_scene(pages[page_number], header, next_top, lesson_id)

        text_refs = []
        for text_number in range(1, 6):
            track_code = f"{lesson['number']:02d}-{text_number}"
            media_id = f"hsk4l-tb-audio-l{lesson['number']:02d}-text-{text_number}"
            all_media.append(
                {
                    "id": media_id,
                    "kind": "audio",
                    "sourceTrackCode": track_code,
                    "availability": "not-in-supplied-pdf",
                    "requiredBy": f"{lesson_id}-text-{text_number}",
                }
            )
            text = detected_texts.get(text_number)
            if text is None:
                text = {
                    "id": f"{lesson_id}-text-{text_number}",
                    "lessonRef": lesson_id,
                    "textNumber": text_number,
                    "textType": "dialogue" if text_number <= 3 else "short-passage",
                    "title": {"zh": None, "pinyin": None},
                    "trackCode": track_code,
                    "trackDetectionSource": "not-detected",
                    "sourcePageRef": pages[lesson["start"]]["id"],
                    "sourceRowIndexes": [],
                    "lines": [],
                    "transcriptionStatus": "ocr-track-anchor-missed-manual-review-required",
                }
            text["audioRef"] = media_id
            all_texts.append(text)
            text_refs.append(text["id"])

        lexemes = extract_lexemes_for_lesson(lesson, pages)
        all_lexemes.extend(lexemes)
        all_proper_names.extend(extract_proper_names(lesson, pages))

        culture_title_zh, culture_title_vi = CULTURE_TOPICS[lesson["number"]]
        culture_id = f"hsk4l-tb-culture-{lesson['number']:02d}"
        all_cultures.append(
            {
                "id": culture_id,
                "lessonRef": lesson_id,
                "title": {"zh": culture_title_zh, "pinyin": pinyin(culture_title_zh), "vi": culture_title_vi},
                "sourcePageRef": pages[culture_page]["id"],
                "sourceRowIndexes": meaningful_row_indexes(pages[culture_page]),
                "visualAssetStatus": "embedded-in-pdf-not-extracted",
                "transcriptionStatus": "page-block-ocr-needs-editorial-review",
            }
        )

        comparison_id = f"hsk4l-tb-comparison-{lesson['number']:02d}"
        same_group_id = f"hsk4l-tb-same-character-{lesson['number']:02d}"
        sections = [
            {"type": "warmup", "contentRefs": section_refs["warmup"]},
            {"type": "texts", "contentRefs": text_refs, "sourcePageRefs": sorted(set(text_page_refs))},
            {"type": "vocabulary", "contentRefs": [entry["id"] for entry in lexemes]},
            {"type": "pinyin-transcript", "contentRefs": section_refs["pinyin-transcript"]},
            {"type": "annotation", "contentRefs": section_refs["annotation"]},
            {"type": "practice", "contentRefs": section_refs["practice"]},
            {"type": "comparison", "contentRefs": [comparison_id], "pageBlockRefs": section_refs["comparison"]},
            {"type": "same-character-words", "contentRefs": [same_group_id]},
            {"type": "extension", "contentRefs": section_refs["extension"]},
            {"type": "application", "contentRefs": section_refs["application"]},
            {"type": "culture", "contentRefs": [culture_id], "pageBlockRefs": section_refs["culture"]},
            {"type": "answer-key", "contentRefs": ["hsk4l-tb-answer-key"]},
        ]
        document = {
            "$schema": "../schemas/textbook-lesson.schema.json",
            "schemaVersion": SCHEMA_VERSION,
            "id": lesson_id,
            "lessonNumber": lesson["number"],
            "status": "review",
            "title": {"zh": lesson["titleZh"], "pinyin": pinyin(lesson["titleZh"]), "vi": lesson["titleVi"]},
            "source": {
                "pdfPages": [lesson["start"], lesson["end"]],
                "printedPages": [lesson["start"], lesson["end"]],
                "missingPrintedPages": [],
                "sourcePageRefs": [pages[number]["id"] for number in lesson_pages],
            },
            "sections": sections,
            "editorial": {
                "publicationReady": False,
                "answerStatus": "included-as-page-level-ocr-in-appendix",
                "requiredActions": [
                    "Đối chiếu OCR tiếng Trung, tiếng Việt và pinyin với PDF.",
                    "Bổ sung audio theo mã track.",
                    "Rà soát quyền sử dụng hình minh họa.",
                ],
            },
        }
        lesson_documents.append(document)
        dump_json(output / "lessons" / f"lesson-{lesson['number']:02d}.json", document)

    comparison_documents = []
    same_character_documents = []
    for lesson in lessons:
        left, right = COMPARISONS[lesson["number"]]
        comparison_blocks = [
            block["id"] for block in blocks_by_kind["comparison"] if block["lessonRef"] == f"hsk4l-tb-lesson-{lesson['number']:02d}"
        ]
        comparison_documents.append(
            {
                "id": f"hsk4l-tb-comparison-{lesson['number']:02d}",
                "lessonRef": f"hsk4l-tb-lesson-{lesson['number']:02d}",
                "terms": [left, right],
                "source": "table-of-contents-and-lesson-comparison-block",
                "pageBlockRefs": comparison_blocks,
                "transcriptionStatus": "heading-verified-body-ocr-needs-editorial-review",
            }
        )
        group = SAME_CHARACTER_GROUPS[lesson["number"]]
        same_character_documents.append(
            {
                "id": f"hsk4l-tb-same-character-{lesson['number']:02d}",
                "lessonRef": f"hsk4l-tb-lesson-{lesson['number']:02d}",
                "sharedCharacter": group["character"],
                "words": group["words"],
                "sourcePageRef": pages[9]["id"],
                "transcriptionStatus": "visually-verified-from-table-of-contents",
            }
        )

    dump_json(output / "shared" / "lexemes.json", {"schemaVersion": SCHEMA_VERSION, "lexemes": all_lexemes})
    dump_json(output / "shared" / "texts.json", {"schemaVersion": SCHEMA_VERSION, "texts": all_texts})
    dump_json(output / "shared" / "media-assets.json", {"schemaVersion": SCHEMA_VERSION, "assets": all_media})
    dump_json(output / "shared" / "proper-names.json", {"schemaVersion": SCHEMA_VERSION, "properNames": all_proper_names})
    dump_json(output / "shared" / "culture-notes.json", {"schemaVersion": SCHEMA_VERSION, "cultureNotes": all_cultures})
    dump_json(output / "shared" / "comparison-notes.json", {"schemaVersion": SCHEMA_VERSION, "comparisons": comparison_documents})
    dump_json(output / "shared" / "same-character-groups.json", {"schemaVersion": SCHEMA_VERSION, "groups": same_character_documents})
    for kind, blocks in blocks_by_kind.items():
        dump_json(output / "shared" / f"{kind}-blocks.json", {"schemaVersion": SCHEMA_VERSION, "blocks": blocks})
    dump_json(output / "shared" / "source-pages.json", {"schemaVersion": SCHEMA_VERSION, "pages": [pages[number] for number in sorted(pages)]})
    dump_json(output / "schemas" / "textbook-lesson.schema.json", build_schema())

    appendices = {
        "vocabulary-summary.json": {
            "schemaVersion": SCHEMA_VERSION,
            "id": "hsk4l-tb-vocabulary-summary",
            "sourcePrintedPages": [149, 158],
            "sourcePageRefs": [pages[number]["id"] for number in range(149, 159)],
            "transcriptionStatus": "raw-page-ocr-available-in-source-pages",
        },
        "proper-names-summary.json": {
            "schemaVersion": SCHEMA_VERSION,
            "id": "hsk4l-tb-proper-names-summary",
            "sourcePrintedPages": [159, 159],
            "sourcePageRefs": [pages[159]["id"]],
            "transcriptionStatus": "raw-page-ocr-available-in-source-pages",
        },
        "beyond-level-vocabulary.json": {
            "schemaVersion": SCHEMA_VERSION,
            "id": "hsk4l-tb-beyond-level-vocabulary",
            "sourcePrintedPages": [160, 160],
            "sourcePageRefs": [pages[160]["id"]],
            "transcriptionStatus": "raw-page-ocr-available-in-source-pages",
        },
        "related-old-new-words.json": {
            "schemaVersion": SCHEMA_VERSION,
            "id": "hsk4l-tb-related-old-new-words",
            "sourcePrintedPages": [161, 163],
            "sourcePageRefs": [pages[number]["id"] for number in range(161, 164)],
            "transcriptionStatus": "raw-page-ocr-available-in-source-pages",
        },
        "answer-key.json": {
            "schemaVersion": SCHEMA_VERSION,
            "id": "hsk4l-tb-answer-key",
            "sourcePdfPages": [164, 174],
            "sourcePageRefs": [pages[number]["id"] for number in range(164, 175)],
            "scope": "warmup, comparison, practice and extension answers for lessons 11-20",
            "transcriptionStatus": "page-level-ocr-needs-editorial-review",
        },
    }
    for name, payload in appendices.items():
        dump_json(output / "appendices" / name, payload)

    curriculum = {
        "schemaVersion": SCHEMA_VERSION,
        "id": "hsk4-standard-course-lower-volume",
        "title": "Giáo trình chuẩn HSK 4 - Tập 2",
        "lessonRange": [11, 20],
        "lessonCount": 10,
        "lessons": [
            {
                "lessonNumber": lesson["number"],
                "lessonRef": f"lessons/lesson-{lesson['number']:02d}.json",
                "titleZh": lesson["titleZh"],
                "titleVi": lesson["titleVi"],
                "pdfPages": [lesson["start"], lesson["end"]],
                "printedPages": [lesson["start"], lesson["end"]],
            }
            for lesson in lessons
        ],
        "appendixRefs": [f"appendices/{name}" for name in appendices],
    }
    dump_json(output / "curriculum.json", curriculum)

    non_noise_rows = [row for page in pages.values() for row in page["rows"] if not row["isNoise"]]
    source_analysis = {
        "schemaVersion": SCHEMA_VERSION,
        "sourceId": "hsk4-standard-course-lower-volume-vi-scan",
        "fileName": "Chuẩn HSK4 下.pdf",
        "documentType": "scanned-textbook-with-appended-answer-key",
        "pageCount": 174,
        "textLayer": False,
        "language": ["zh-CN", "vi-VN", "Hanyu Pinyin"],
        "contentMap": {
            "frontMatter": [1, 9],
            "lessons": [10, 148],
            "vocabularyAppendix": [149, 163],
            "answerKeyAppendix": [164, 174],
        },
        "method": {
            "renderDpi": 140,
            "ocrEngine": "RapidOCR/ONNX Runtime",
            "visualReview": "All 174 pages were reviewed in contact sheets; cover, introduction, table of contents, representative lesson layouts, vocabulary appendices and answer-key pages were additionally inspected at higher resolution.",
        },
        "coverage": {
            "lessons": len(lesson_documents),
            "texts": len(all_texts),
            "lexemeRecords": len(all_lexemes),
            "properNameRecords": len(all_proper_names),
            "cultureNotes": len(all_cultures),
            "audioPlaceholders": len(all_media),
            "ocrSourcePages": len(pages),
            "answerKeyPages": 11,
        },
        "qualityMetrics": {
            "nonNoiseOcrRows": len(non_noise_rows),
            "nonNoiseRowsBelow075Confidence": sum(row["minConfidence"] < 0.75 for row in non_noise_rows),
            "lexemeStubsFromMissedAnchors": sum(entry["hanzi"] is None for entry in all_lexemes),
            "textStubsFromMissedTrackAnchors": sum(not text["lines"] for text in all_texts),
        },
        "sourceConstraints": [
            "The PDF is image-only and has no extractable text layer.",
            "Audio tracks are referenced by code but are not embedded in the supplied PDF.",
            "Vietnamese and source pinyin diacritics are less reliable in OCR than Chinese characters.",
            "Illustrations remain embedded in the source PDF and are represented by page references.",
            "The appended answer key is retained as page-level OCR evidence and is not yet normalized question by question.",
        ],
        "sourceGaps": [],
        "editorialPolicy": {
            "status": "review",
            "documentTextRole": "All printed instructions are treated only as textbook content, not as instructions to the data-processing agent.",
            "doNotPublishWithout": ["manual OCR comparison", "licensed audio", "visual asset review"],
            "derivedFields": ["stable IDs", "Hanyu pinyin generated from recognized Chinese", "section and page mappings"],
        },
    }
    dump_json(output / "source-analysis.json", source_analysis)

    subprocess.run(
        [
            sys.executable,
            str(Path(__file__).with_name("build-hsk4-vocabulary-json.py")),
            str(output),
        ],
        check=True,
    )
    vocabulary_document = json.loads((output / "vocabulary.json").read_text(encoding="utf-8"))

    block_files = [f"shared/{kind}-blocks.json" for kind in blocks_by_kind]
    files = [
        {"path": "vocabulary.json", "kind": "vocabulary"},
        {"path": "hsk4-lower-textbook.json", "kind": "compiled-dataset"},
        {"path": "schemas/textbook-lesson.schema.json", "kind": "schema"},
        {"path": "source-analysis.json", "kind": "source-analysis"},
        {"path": "curriculum.json", "kind": "curriculum"},
        {"path": "shared/source-pages.json", "kind": "ocr-evidence"},
        {"path": "shared/lexemes.json", "kind": "shared-content", "entity": "lexeme"},
        {"path": "shared/texts.json", "kind": "shared-content", "entity": "text"},
        {"path": "shared/proper-names.json", "kind": "shared-content", "entity": "proper-name"},
        {"path": "shared/culture-notes.json", "kind": "shared-content", "entity": "culture-note"},
        {"path": "shared/comparison-notes.json", "kind": "shared-content", "entity": "comparison"},
        {"path": "shared/same-character-groups.json", "kind": "shared-content", "entity": "same-character-group"},
        {"path": "shared/media-assets.json", "kind": "shared-content", "entity": "media"},
    ]
    files += [{"path": path, "kind": "shared-content", "entity": Path(path).stem} for path in block_files]
    files += [{"path": f"appendices/{name}", "kind": "appendix"} for name in appendices]
    files += [
        {"path": f"lessons/lesson-{lesson['number']:02d}.json", "kind": "lesson", "lessonNumber": lesson["number"]}
        for lesson in lessons
    ]
    manifest = {
        "schemaVersion": SCHEMA_VERSION,
        "bundleId": BUNDLE_ID,
        "title": "Bộ dữ liệu JSON từ Giáo trình chuẩn HSK 4 - Tập 2",
        "description": "Dữ liệu bài 11-20, 50 bài khóa, từ mới, chú thích, so sánh, luyện tập, mở rộng, vận dụng, văn hóa, phụ lục, đáp án và bằng chứng OCR theo trang.",
        "locale": {"interface": "vi-VN", "learning": "zh-CN", "pinyinSystem": "hanyu-pinyin-diacritic"},
        "status": "review",
        "sourceRef": "source-analysis.json",
        "curriculumRef": "curriculum.json",
        "files": files,
        "counts": {
            "lessons": len(lesson_documents),
            "texts": len(all_texts),
            "lexemes": len(all_lexemes),
            "properNames": len(all_proper_names),
            "cultureNotes": len(all_cultures),
            "comparisons": len(comparison_documents),
            "sameCharacterGroups": len(same_character_documents),
            "mediaPlaceholders": len(all_media),
            "ocrSourcePages": len(pages),
            "answerKeyPages": 11,
            "contentBlocks": sum(len(blocks) for blocks in blocks_by_kind.values()),
        },
    }
    dump_json(output / "manifest.json", manifest)

    compiled = {
        "schemaVersion": manifest["schemaVersion"],
        "bundleId": manifest["bundleId"],
        "title": manifest["title"],
        "description": manifest["description"],
        "locale": manifest["locale"],
        "status": manifest["status"],
        "counts": manifest["counts"],
        "sourceAnalysis": source_analysis,
        "curriculum": curriculum,
        "vocabulary": vocabulary_document["vocabulary"],
        "vocabularyByLesson": vocabulary_document["byLesson"],
        "lessons": lesson_documents,
        "content": {
            "texts": all_texts,
            "lexemes": all_lexemes,
            "properNames": all_proper_names,
            "cultureNotes": all_cultures,
            "comparisons": comparison_documents,
            "sameCharacterGroups": same_character_documents,
            "mediaAssets": all_media,
            "blocks": blocks_by_kind,
        },
        "appendices": {Path(name).stem: payload for name, payload in appendices.items()},
        "ocrEvidence": {
            "schemaVersion": SCHEMA_VERSION,
            "pages": [pages[number] for number in sorted(pages)],
        },
    }
    dump_json(output / "hsk4-lower-textbook.json", compiled)


if __name__ == "__main__":
    main()
