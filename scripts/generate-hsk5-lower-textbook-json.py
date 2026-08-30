from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import defaultdict
from datetime import date
from pathlib import Path
from typing import Any, Iterable

from pypinyin import Style, lazy_pinyin


SCHEMA_VERSION = "1.0.0"
BUNDLE_ID = "hsk5-standard-course-lower-textbook-vi-v1"
SOURCE_TITLE = "Giáo Trình Chuẩn HSK 5 (tập 2)"
CJK_RE = re.compile(r"[\u3400-\u9fff]")
CJK_RUN_RE = re.compile(r"[\u3400-\u9fff·—（）()《》、，。！？；：“”‘’]+")
LESSON_NUMBER_RE = re.compile(r"^(?:19|2[0-9]|3[0-6])$")
TRACK_RE = re.compile(r"(?<!\d)(1[9]|2[0-9]|3[0-6])\s*[-._—]?\s*([12])(?!\d)")
NOISE_TOKENS = (
    "www.nhantriviet.com",
    "GiaoTrinhChuanHSK",
    "Hoc Tieng Trung tai nha",
    "Scanned by",
)


UNITS = [
    (7, 14, "交流文化", "Giao lưu văn hóa", (19, 20, 21)),
    (8, 40, "体会教育", "Hiểu về giáo dục", (22, 23, 24)),
    (9, 64, "感受人生", "Cảm nhận về đời người", (25, 26, 27)),
    (10, 88, "关注经济", "Quan tâm kinh tế", (28, 29, 30)),
    (11, 114, "观察社会", "Quan sát xã hội", (31, 32, 33)),
    (12, 140, "亲近自然", "Gần với thiên nhiên", (34, 35, 36)),
]

LESSONS = [
    (19, 15, 22, "家乡的萝卜饼", "Bánh củ cải quê nhà"),
    (20, 23, 30, "小人书摊", "Quầy truyện tranh"),
    (21, 31, 39, "汉字叔叔：一个美国人的汉字情缘", 'Tình yêu chữ Hán của "ông chú người Mỹ"'),
    (22, 41, 47, "阅读与思考", "Đọc và suy nghĩ"),
    (23, 48, 55, "放手", "Buông tay"),
    (24, 56, 63, "支教行动", "Hoạt động dạy học tình nguyện"),
    (25, 65, 71, "给自己加满水", "Bơm nước vào tàu"),
    (26, 72, 79, "你属于哪一种“忙”？", 'Bạn thuộc nhóm người "bận rộn" nào?'),
    (27, 80, 87, "下棋", "Đánh cờ"),
    (28, 89, 96, "最受欢迎的毕业生", "Người tốt nghiệp được hoan nghênh nhất"),
    (29, 97, 104, "培养对手", "Đào tạo đối thủ"),
    (30, 105, 113, "竞争让市场更高效", "Cạnh tranh khiến thị trường phát triển."),
    (31, 115, 122, "登门槛效应", 'Hiệu ứng "thò chân vào cửa"'),
    (32, 123, 130, "身边的环保", "Bảo vệ môi trường quanh ta"),
    (33, 131, 139, "以堵治堵——缓解交通有妙招", '"Dùng tắc trị tắc" - tuyệt chiêu giảm tải giao thông'),
    (34, 141, 148, "鸟儿的护肤术", "Cách loài chim bảo vệ da"),
    (35, 149, 156, "植物会出汗。", "Thực vật cũng đổ mồ hôi."),
    (36, 157, 164, "老舍与养花", "Lão Xá và hoa"),
]

SECTION_SPECS = [
    ("warmup", "热身", ("热身",)),
    ("text", "课文", ("课文",)),
    ("annotation", "注释", ("注释", "词语例释", "词语搭配", "词语辨析")),
    ("practice", "练习", ("练习",)),
    ("extension", "扩展", ("扩展",)),
    ("application", "运用", ("运用",)),
]

SECTION_FILE_NAMES = {
    "warmup": "warmup-blocks.json",
    "annotation": "annotation-blocks.json",
    "practice": "practice-blocks.json",
    "extension": "extension-blocks.json",
    "application": "application-blocks.json",
}

MAIN_GLOSS_OVERRIDES = {
    # RapidOCR omitted these three low-contrast italic glosses. Each value was
    # restored through direct visual comparison with the rendered source row.
    "家务": "việc nhà",
    "无数": "vô số",
    "物理": "vật lý",
}


def dump_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def zh_pinyin(text: str) -> str:
    hanzi_only = "".join(character for character in text if CJK_RE.fullmatch(character))
    return " ".join(lazy_pinyin(hanzi_only, style=Style.TONE, neutral_tone_with_five=False))


def box_metrics(box: list[list[float]]) -> tuple[float, float, float, float]:
    xs = [point[0] for point in box]
    ys = [point[1] for point in box]
    return min(xs), min(ys), max(xs), max(ys)


def compact(text: str) -> str:
    return re.sub(r"\s+", "", text or "")


def is_noise(text: str, left: float, top: float, image_height: float = 1637) -> bool:
    value = text.strip()
    if not value:
        return True
    if any(token.lower() in value.lower() for token in NOISE_TOKENS):
        return True
    if top > image_height * 0.92 and re.fullmatch(r"[-—]?\s*\d{1,3}\s*[-—]?", value):
        return True
    if left < 90 and any(token.lower() in value.lower() for token in ("nhantriviet", "giaotrinh")):
        return True
    return False


def build_rows(lines: list[dict[str, Any]], image_height: float = 1637) -> list[dict[str, Any]]:
    fragments: list[dict[str, Any]] = []
    for line in lines:
        left, top, right, bottom = box_metrics(line["box"])
        fragments.append(
            {
                "text": line["text"].strip(),
                "confidence": round(float(line["confidence"]), 6),
                "box": line["box"],
                "left": round(left, 1),
                "top": round(top, 1),
                "right": round(right, 1),
                "bottom": round(bottom, 1),
                "centerY": (top + bottom) / 2,
                "isNoise": is_noise(line["text"], left, top, image_height),
            }
        )
    fragments.sort(key=lambda item: (item["centerY"], item["left"]))
    groups: list[dict[str, Any]] = []
    for fragment in fragments:
        threshold = max(8.0, min(14.0, (fragment["bottom"] - fragment["top"]) * 0.28))
        if groups and abs(fragment["centerY"] - groups[-1]["centerY"]) <= threshold:
            groups[-1]["items"].append(fragment)
            groups[-1]["centerY"] = sum(item["centerY"] for item in groups[-1]["items"]) / len(groups[-1]["items"])
        else:
            groups.append({"centerY": fragment["centerY"], "items": [fragment]})

    rows = []
    for row_index, group in enumerate(groups):
        items = sorted(group["items"], key=lambda item: item["left"])
        text = " ".join(item["text"] for item in items if item["text"])
        rows.append(
            {
                "rowIndex": row_index,
                "top": min(item["top"] for item in items),
                "bottom": max(item["bottom"] for item in items),
                "left": min(item["left"] for item in items),
                "right": max(item["right"] for item in items),
                "text": text,
                "minConfidence": min(item["confidence"] for item in items),
                "meanConfidence": round(sum(item["confidence"] for item in items) / len(items), 6),
                "isNoise": all(item["isNoise"] for item in items),
                "fragments": [
                    {
                        "text": item["text"],
                        "confidence": item["confidence"],
                        "box": item["box"],
                        "left": item["left"],
                        "top": item["top"],
                        "right": item["right"],
                        "bottom": item["bottom"],
                    }
                    for item in items
                ],
            }
        )
    return rows


def find_printed_page(rows: list[dict[str, Any]], pdf_page: int) -> int | None:
    candidates: list[tuple[float, int]] = []
    for row in rows:
        value = row["text"].strip(" -—")
        if row["top"] > 1450 and re.fullmatch(r"\d{1,3}", value):
            number = int(value)
            if 1 <= number <= 220:
                candidates.append((row["top"], number))
    if candidates:
        return max(candidates)[1]
    if 15 <= pdf_page <= 188:
        return pdf_page - 1
    return None


def page_role(pdf_page: int) -> tuple[str, int | None]:
    if pdf_page in {unit[1] for unit in UNITS}:
        return "unit-divider", None
    for number, start, end, _, _ in LESSONS:
        if start <= pdf_page <= end:
            return "lesson-content", number
    if pdf_page <= 13:
        return "front-matter", None
    if pdf_page <= 180:
        return "vocabulary-summary", None
    if pdf_page <= 182:
        return "proper-names-summary", None
    if pdf_page <= 188:
        return "beyond-level-vocabulary-summary", None
    return "publication-metadata", None


def load_pages(ocr_dir: Path) -> dict[int, dict[str, Any]]:
    paths = sorted(ocr_dir.glob("page-*.json"))
    found = {int(path.stem.split("-")[-1]) for path in paths}
    missing = sorted(set(range(1, 190)) - found)
    if missing:
        raise SystemExit(f"OCR is incomplete; missing {len(missing)} page(s): {missing[:25]}")
    pages: dict[int, dict[str, Any]] = {}
    for path in paths:
        raw = json.loads(path.read_text(encoding="utf-8"))
        number = int(raw["page"])
        rows = build_rows(raw["lines"])
        role, lesson_number = page_role(number)
        pages[number] = {
            "id": f"hsk5l-source-page-{number:03d}",
            "pdfPage": number,
            "printedPage": find_printed_page(rows, number),
            "role": role,
            "lessonNumber": lesson_number,
            "imageFileName": raw.get("image"),
            "ocr": {
                "engine": "RapidOCR / ONNX Runtime",
                "wallSeconds": raw.get("wallSeconds"),
                "status": "machine-transcribed-needs-editorial-review",
            },
            "rows": rows,
        }
    return pages


def iter_lesson_rows(lesson: dict[str, Any], pages: dict[int, dict[str, Any]]) -> Iterable[tuple[int, dict[str, Any]]]:
    for page_number in range(lesson["sourcePdfPages"]["start"], lesson["sourcePdfPages"]["end"] + 1):
        for row in pages[page_number]["rows"]:
            if not row["isNoise"]:
                yield page_number, row


def row_has_term(row: dict[str, Any], terms: tuple[str, ...]) -> bool:
    value = compact(row["text"])
    return any(compact(term) in value for term in terms)


def find_section_markers(lesson: dict[str, Any], pages: dict[int, dict[str, Any]]) -> list[dict[str, Any]]:
    markers: list[dict[str, Any]] = []
    seen: set[str] = set()
    rows = list(iter_lesson_rows(lesson, pages))
    for section_type, label, terms in SECTION_SPECS:
        candidates: list[tuple[int, dict[str, Any]]] = []
        for page_number, row in rows:
            if row_has_term(row, terms):
                candidates.append((page_number, row))
        if not candidates:
            continue
        if section_type == "annotation":
            page_number, row = candidates[0]
        elif section_type in {"practice", "extension", "application"}:
            page_number, row = candidates[-1] if section_type == "application" else candidates[0]
        else:
            page_number, row = candidates[0]
        if section_type in seen:
            continue
        seen.add(section_type)
        markers.append(
            {
                "sectionType": section_type,
                "labelZh": label,
                "pdfPage": page_number,
                "rowIndex": row["rowIndex"],
                "matchedTextOcr": row["text"],
            }
        )
    markers.sort(key=lambda item: (item["pdfPage"], item["rowIndex"]))
    return markers


def source_rows_between(
    lesson: dict[str, Any],
    pages: dict[int, dict[str, Any]],
    start: tuple[int, int],
    end: tuple[int, int] | None,
) -> tuple[list[dict[str, Any]], list[str]]:
    evidence: list[dict[str, Any]] = []
    text_rows: list[str] = []
    for page_number, row in iter_lesson_rows(lesson, pages):
        position = (page_number, row["rowIndex"])
        if position < start:
            continue
        if end is not None and position >= end:
            break
        evidence.append({"sourcePageId": pages[page_number]["id"], "rowIndex": row["rowIndex"]})
        text_rows.append(row["text"])
    return evidence, text_rows


def extract_article(
    lesson: dict[str, Any], pages: dict[int, dict[str, Any]], markers: list[dict[str, Any]]
) -> dict[str, Any]:
    text_marker = next((item for item in markers if item["sectionType"] == "text"), None)
    annotation_marker = next((item for item in markers if item["sectionType"] == "annotation"), None)
    start_page = lesson["sourcePdfPages"]["start"]
    start_row = 0
    if text_marker:
        start_page, start_row = text_marker["pdfPage"], text_marker["rowIndex"] + 1
    else:
        track = re.compile(rf"(?<!\d){lesson['number']}\s*[-._—]?\s*1(?!\d)")
        for page_number, row in iter_lesson_rows(lesson, pages):
            if track.search(compact(row["text"])):
                start_page, start_row = page_number, row["rowIndex"] + 1
                break
    end = None
    if annotation_marker:
        end = (annotation_marker["pdfPage"], annotation_marker["rowIndex"])

    evidence: list[dict[str, Any]] = []
    body_rows: list[str] = []
    for page_number, row in iter_lesson_rows(lesson, pages):
        position = (page_number, row["rowIndex"])
        if position < (start_page, start_row):
            continue
        if end is not None and position >= end:
            break
        # The article sits in the main/left column (ending around x=640 at
        # 140 DPI); the numbered vocabulary rail begins around x=650.
        relevant_fragments = [
            fragment
            for fragment in row["fragments"]
            if fragment["left"] < 645 and CJK_RE.search(fragment["text"])
            and not any(token in compact(fragment["text"]) for token in ("生词", "词语", "热身"))
        ]
        if not relevant_fragments:
            continue
        line = " ".join(fragment["text"] for fragment in relevant_fragments)
        body_rows.append(line)
        evidence.append({"sourcePageId": pages[page_number]["id"], "rowIndex": row["rowIndex"]})

    return {
        "id": f"hsk5l-text-{lesson['number']:02d}-01",
        "lessonId": lesson["id"],
        "lessonNumber": lesson["number"],
        "type": "article",
        "titleZh": lesson["titleZh"],
        "titleVi": lesson["titleVi"],
        "audioTrack": f"{lesson['number']}-1",
        "bodyZhOcrLines": body_rows,
        "bodyZhOcr": "\n".join(body_rows),
        "sourceEvidence": evidence,
        "transcriptionStatus": "machine-transcribed-needs-editorial-review",
    }


def build_blocks(
    lesson: dict[str, Any], pages: dict[int, dict[str, Any]], markers: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    blocks = []
    for marker_index, marker in enumerate(markers):
        if marker["sectionType"] == "text":
            continue
        next_marker = markers[marker_index + 1] if marker_index + 1 < len(markers) else None
        start = (marker["pdfPage"], marker["rowIndex"])
        end = (next_marker["pdfPage"], next_marker["rowIndex"]) if next_marker else None
        evidence, text_rows = source_rows_between(lesson, pages, start, end)
        blocks.append(
            {
                "id": f"hsk5l-{marker['sectionType']}-{lesson['number']:02d}-01",
                "lessonId": lesson["id"],
                "lessonNumber": lesson["number"],
                "type": marker["sectionType"],
                "labelZh": marker["labelZh"],
                "contentOcrLines": text_rows,
                "contentOcr": "\n".join(text_rows),
                "sourceEvidence": evidence,
                "transcriptionStatus": "machine-transcribed-needs-editorial-review",
            }
        )
    return blocks


def clean_hanzi_candidate(text: str) -> str | None:
    pieces = CJK_RUN_RE.findall(text)
    # Parentheses may be part of the printed headword (for example 八成（儿）),
    # so only strip surrounding title/quote and sentence punctuation.
    candidates = [piece.strip("《》、，。！？；：“”‘’") for piece in pieces]
    candidates = [piece for piece in candidates if CJK_RE.search(piece)]
    if not candidates:
        return None
    value = max(candidates, key=len)
    if value in {"词语", "拼音", "词性", "释义", "课", "生词", "越级词"}:
        return None
    return value


def normalize_pos(text: str | None) -> str | None:
    if not text:
        return None
    value = compact(text).strip(".。")
    replacements = {"名": "名词", "动": "动词", "形": "形容词", "副": "副词", "量": "量词", "连": "连词", "介": "介词"}
    return replacements.get(value, value)


def table_rows(pages: dict[int, dict[str, Any]], start: int, end: int) -> Iterable[tuple[int, dict[str, Any]]]:
    for page_number in range(start, end + 1):
        for row in pages[page_number]["rows"]:
            if not row["isNoise"]:
                yield page_number, row


def find_lesson_fragment(row: dict[str, Any]) -> tuple[int | None, dict[str, Any] | None]:
    for fragment in sorted(row["fragments"], key=lambda item: item["left"], reverse=True):
        value = compact(fragment["text"]).strip(".。")
        match = re.fullmatch(r"(19|2[0-9]|3[0-6])(?:六级)?", value)
        if fragment["left"] > 860 and match:
            return int(match.group(1)), fragment
    match = re.search(r"(?:^|\s)(19|2[0-9]|3[0-6])(?:\s*六级)?\s*$", row["text"])
    if match and row["right"] > 900:
        return int(match.group(1)), None
    return None, None


def parse_main_vocabulary(pages: dict[int, dict[str, Any]]) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for page_number, row in table_rows(pages, 165, 180):
        lesson_number, lesson_fragment = find_lesson_fragment(row)
        if lesson_number is None:
            continue
        eligible = [fragment for fragment in row["fragments"] if lesson_fragment is None or fragment is not lesson_fragment]
        hanzi_fragments = [fragment for fragment in eligible if fragment["left"] < 380 and CJK_RE.search(fragment["text"])]
        if not hanzi_fragments:
            continue
        hanzi = clean_hanzi_candidate("".join(fragment["text"] for fragment in hanzi_fragments))
        if not hanzi or len(hanzi) > 18:
            continue
        pinyin_raw = " ".join(fragment["text"] for fragment in eligible if 220 <= fragment["left"] < 440).strip()
        pos_raw = " ".join(fragment["text"] for fragment in eligible if 440 <= fragment["left"] < 545).strip()
        meaning_raw = " ".join(fragment["text"] for fragment in eligible if 545 <= fragment["left"] < 980).strip()
        record = {
            "id": f"hsk5l-lexeme-{len(records) + 1:04d}",
            "order": len(records) + 1,
            "category": "main",
            "lessonNumber": lesson_number,
            "hanzi": hanzi,
            "pinyin": zh_pinyin(hanzi),
            "pinyinOcrRaw": pinyin_raw or None,
            "partOfSpeech": normalize_pos(pos_raw),
            "partOfSpeechOcrRaw": pos_raw or None,
            "meaningViOcrRaw": meaning_raw,
            "source": {
                "sourcePageId": pages[page_number]["id"],
                "pdfPage": page_number,
                "printedPage": pages[page_number]["printedPage"],
                "rowIndex": row["rowIndex"],
                "rowTop": row["top"],
                "rowTextOcrRaw": row["text"],
            },
            "transcriptionStatus": "machine-transcribed-needs-editorial-review",
            "_meaningParts": [(row["top"], meaning_raw)] if meaning_raw else [],
        }
        records.append(record)

    # Assign wrapped gloss lines to the closest anchored table row. Some glosses
    # begin above the Hanzi baseline and others continue below it.
    anchors_by_page: defaultdict[int, list[dict[str, Any]]] = defaultdict(list)
    for record in records:
        anchors_by_page[record["source"]["pdfPage"]].append(record)
    for page_number, row in table_rows(pages, 165, 180):
        lesson_number, _ = find_lesson_fragment(row)
        if lesson_number is not None:
            continue
        continuation = " ".join(
            fragment["text"]
            for fragment in row["fragments"]
            if 545 <= fragment["left"] < 980 and not CJK_RE.search(fragment["text"])
        ).strip()
        if not continuation or re.fullmatch(r"[A-Z0-9]", continuation):
            continue
        candidates = anchors_by_page[page_number]
        if not candidates:
            continue
        nearest = min(candidates, key=lambda item: abs(row["top"] - item["source"]["rowTop"]))
        if abs(row["top"] - nearest["source"]["rowTop"]) <= 28:
            nearest["_meaningParts"].append((row["top"], continuation))

    for record in records:
        record["meaningViOcrRaw"] = " ".join(text for _, text in sorted(record.pop("_meaningParts")) if text).strip()
        override = MAIN_GLOSS_OVERRIDES.get(record["hanzi"])
        record["meaningVi"] = override or record["meaningViOcrRaw"]
        record["meaningViStatus"] = "manually-verified-against-source" if override else "ocr-needs-editorial-review"
    lesson_orders: defaultdict[int, int] = defaultdict(int)
    for record in records:
        lesson_orders[record["lessonNumber"]] += 1
        record["lessonOrder"] = lesson_orders[record["lessonNumber"]]
    return records


def parse_generic_appendix(
    pages: dict[int, dict[str, Any]], start: int, end: int, prefix: str
) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for page_number, row in table_rows(pages, start, end):
        fragments = row["fragments"]
        left_cjk = [fragment for fragment in fragments if fragment["left"] < 430 and CJK_RE.search(fragment["text"])]
        if not left_cjk:
            continue
        hanzi = clean_hanzi_candidate("".join(fragment["text"] for fragment in left_cjk))
        if not hanzi or len(hanzi) > 24:
            continue
        if any(header in hanzi for header in ("词语拼音", "专有名词", "越级词汇")):
            continue
        lesson_number, _ = find_lesson_fragment(row)
        right_text = " ".join(fragment["text"] for fragment in fragments if fragment["left"] >= 420).strip()
        records.append(
            {
                "id": f"hsk5l-{prefix}-{len(records) + 1:03d}",
                "order": len(records) + 1,
                "category": "proper-name" if prefix == "proper-name" else prefix,
                "hanzi": hanzi,
                "pinyin": zh_pinyin(hanzi),
                "pinyinOcrRaw": " ".join(fragment["text"] for fragment in fragments if 230 <= fragment["left"] < 500).strip() or None,
                "lessonNumber": lesson_number,
                "meaningViOcrRaw": " ".join(fragment["text"] for fragment in fragments if 500 <= fragment["left"] < 960).strip(),
                "metadataOcrRaw": right_text,
                "source": {
                    "sourcePageId": pages[page_number]["id"],
                    "pdfPage": page_number,
                    "printedPage": pages[page_number]["printedPage"],
                    "rowIndex": row["rowIndex"],
                    "rowTop": row["top"],
                    "rowTextOcrRaw": row["text"],
                },
                "transcriptionStatus": "machine-transcribed-needs-editorial-review",
                "_meaningParts": [
                    (row["top"], " ".join(fragment["text"] for fragment in fragments if 500 <= fragment["left"] < 960).strip())
                ],
                "_pinyinParts": [
                    (row["top"], " ".join(fragment["text"] for fragment in fragments if 230 <= fragment["left"] < 500).strip())
                ],
            }
        )

    anchors_by_page: defaultdict[int, list[dict[str, Any]]] = defaultdict(list)
    for record in records:
        anchors_by_page[record["source"]["pdfPage"]].append(record)
    for page_number, row in table_rows(pages, start, end):
        if any(CJK_RE.search(fragment["text"]) and fragment["left"] < 430 for fragment in row["fragments"]):
            continue
        meaning_continuation = " ".join(
            fragment["text"]
            for fragment in row["fragments"]
            if 500 <= fragment["left"] < 960 and not CJK_RE.search(fragment["text"])
        ).strip()
        pinyin_continuation = " ".join(
            fragment["text"]
            for fragment in row["fragments"]
            if 230 <= fragment["left"] < 500 and not CJK_RE.search(fragment["text"])
        ).strip()
        continuation_lesson, _ = find_lesson_fragment(row)
        if not meaning_continuation and not pinyin_continuation and continuation_lesson is None:
            continue
        candidates = anchors_by_page[page_number]
        if not candidates:
            continue
        nearest = min(candidates, key=lambda item: abs(row["top"] - item["source"]["rowTop"]))
        if abs(row["top"] - nearest["source"]["rowTop"]) <= 30:
            if meaning_continuation and not re.fullmatch(r"[A-Z0-9]", meaning_continuation):
                nearest["_meaningParts"].append((row["top"], meaning_continuation))
            if pinyin_continuation and not re.fullmatch(r"[A-Z0-9]", pinyin_continuation):
                nearest["_pinyinParts"].append((row["top"], pinyin_continuation))
            if nearest["lessonNumber"] is None and continuation_lesson is not None:
                nearest["lessonNumber"] = continuation_lesson
    for record in records:
        record["meaningViOcrRaw"] = " ".join(text for _, text in sorted(record.pop("_meaningParts")) if text).strip()
        record["meaningVi"] = record["meaningViOcrRaw"]
        record["meaningViStatus"] = "ocr-needs-editorial-review"
        record["pinyinOcrRaw"] = " ".join(text for _, text in sorted(record.pop("_pinyinParts")) if text).strip() or None
        record["metadataOcrRaw"] = " ".join(part for part in (record["pinyinOcrRaw"], record["meaningViOcrRaw"]) if part)
    if prefix == "proper-name":
        merged: list[dict[str, Any]] = []
        index = 0
        while index < len(records):
            record = records[index]
            if index + 1 < len(records) and record["hanzi"] == "卖火柴的" and records[index + 1]["hanzi"] == "小女孩儿":
                continuation = records[index + 1]
                record["hanzi"] = "《卖火柴的小女孩儿》"
                record["pinyin"] = zh_pinyin(record["hanzi"])
                record["pinyinOcrRaw"] = " ".join(
                    part for part in (record["pinyinOcrRaw"], continuation["pinyinOcrRaw"]) if part
                )
                record["lessonNumber"] = record["lessonNumber"] or continuation["lessonNumber"] or 22
                record["additionalSource"] = continuation["source"]
                index += 2
            else:
                index += 1
            merged.append(record)
        records = merged
        for order, record in enumerate(records, start=1):
            record["id"] = f"hsk5l-proper-name-{order:03d}"
            record["order"] = order
    return records


def parse_beyond_level_vocabulary(pages: dict[int, dict[str, Any]]) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for page_number, row in table_rows(pages, 183, 188):
        fragments = row["fragments"]
        left_cjk = [fragment for fragment in fragments if fragment["left"] < 230 and CJK_RE.search(fragment["text"])]
        if not left_cjk:
            continue
        hanzi = clean_hanzi_candidate("".join(fragment["text"] for fragment in left_cjk))
        if not hanzi or len(hanzi) > 24 or hanzi in {"超纲词", "词语"}:
            continue
        lesson_number, _ = find_lesson_fragment(row)
        pinyin_raw = " ".join(fragment["text"] for fragment in fragments if 230 <= fragment["left"] < 430).strip()
        pos_raw = " ".join(fragment["text"] for fragment in fragments if 430 <= fragment["left"] < 550).strip()
        meaning_raw = " ".join(fragment["text"] for fragment in fragments if 530 <= fragment["left"] < 860).strip()
        level_raw = " ".join(fragment["text"] for fragment in fragments if fragment["left"] >= 970).strip()
        records.append(
            {
                "id": f"hsk5l-beyond-level-{len(records) + 1:03d}",
                "order": len(records) + 1,
                "category": "beyond-level",
                "hanzi": hanzi,
                "pinyin": zh_pinyin(hanzi),
                "pinyinOcrRaw": pinyin_raw or None,
                "partOfSpeech": normalize_pos(pos_raw),
                "partOfSpeechOcrRaw": pos_raw or None,
                "meaningViOcrRaw": meaning_raw,
                "lessonNumber": lesson_number,
                "levelOcrRaw": level_raw or None,
                "source": {
                    "sourcePageId": pages[page_number]["id"],
                    "pdfPage": page_number,
                    "printedPage": pages[page_number]["printedPage"],
                    "rowIndex": row["rowIndex"],
                    "rowTop": row["top"],
                    "rowTextOcrRaw": row["text"],
                },
                "transcriptionStatus": "machine-transcribed-needs-editorial-review",
                "_meaningParts": [(row["top"], meaning_raw)] if meaning_raw else [],
            }
        )

    anchors_by_page: defaultdict[int, list[dict[str, Any]]] = defaultdict(list)
    for record in records:
        anchors_by_page[record["source"]["pdfPage"]].append(record)
    for page_number, row in table_rows(pages, 183, 188):
        if any(CJK_RE.search(fragment["text"]) and fragment["left"] < 230 for fragment in row["fragments"]):
            continue
        continuation = " ".join(
            fragment["text"]
            for fragment in row["fragments"]
            if 530 <= fragment["left"] < 860 and not CJK_RE.search(fragment["text"])
        ).strip()
        if not continuation or re.fullmatch(r"[A-Z0-9]", continuation):
            continue
        candidates = anchors_by_page[page_number]
        if not candidates:
            continue
        nearest = min(candidates, key=lambda item: abs(row["top"] - item["source"]["rowTop"]))
        if abs(row["top"] - nearest["source"]["rowTop"]) <= 30:
            nearest["_meaningParts"].append((row["top"], continuation))
    for record in records:
        record["meaningViOcrRaw"] = " ".join(text for _, text in sorted(record.pop("_meaningParts")) if text).strip()
        record["meaningVi"] = record["meaningViOcrRaw"]
        record["meaningViStatus"] = "ocr-needs-editorial-review"
    return records


def build_curriculum() -> dict[str, Any]:
    unit_by_lesson = {lesson: number for number, _, _, _, lessons in UNITS for lesson in lessons}
    lesson_records = []
    for number, start, end, title_zh, title_vi in LESSONS:
        unit_number = unit_by_lesson[number]
        lesson_records.append(
            {
                "id": f"hsk5l-lesson-{number:02d}",
                "number": number,
                "unitId": f"hsk5l-unit-{unit_number:02d}",
                "titleZh": title_zh,
                "titleVi": title_vi,
                "sourcePdfPages": {"start": start, "end": end},
                "sourcePrintedPages": {"start": start - 1, "end": end - 1},
                "audioTracks": [f"{number}-1", f"{number}-2"],
                "contentStatus": "ocr-needs-editorial-review",
            }
        )
    units = [
        {
            "id": f"hsk5l-unit-{number:02d}",
            "number": number,
            "titleZh": title_zh,
            "titleVi": title_vi,
            "sourceDividerPdfPage": divider_page,
            "sourceDividerPrintedPage": divider_page - 1,
            "lessonIds": [f"hsk5l-lesson-{lesson:02d}" for lesson in lessons],
        }
        for number, divider_page, title_zh, title_vi, lessons in UNITS
    ]
    return {"bundleId": BUNDLE_ID, "units": units, "lessons": lesson_records}


def schema_payload() -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://local.invalid/schemas/hsk5-lower-textbook-lesson.schema.json",
        "title": "HSK 5 lower textbook lesson",
        "type": "object",
        "required": ["id", "number", "unitId", "titleZh", "titleVi", "sourcePdfPages", "textIds", "lexemeIds"],
        "properties": {
            "id": {"type": "string", "pattern": "^hsk5l-lesson-[0-9]{2}$"},
            "number": {"type": "integer", "minimum": 19, "maximum": 36},
            "unitId": {"type": "string"},
            "titleZh": {"type": "string", "minLength": 1},
            "titleVi": {"type": "string", "minLength": 1},
            "sourcePdfPages": {
                "type": "object",
                "required": ["start", "end"],
                "properties": {"start": {"type": "integer"}, "end": {"type": "integer"}},
            },
            "textIds": {"type": "array", "minItems": 1, "items": {"type": "string"}},
            "lexemeIds": {"type": "array", "items": {"type": "string"}},
        },
        "additionalProperties": True,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate a review-ready JSON bundle from OCR of HSK 5 Standard Course, volume 2.")
    parser.add_argument("--ocr-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--source-pdf", type=Path, required=True)
    args = parser.parse_args()

    pages = load_pages(args.ocr_dir.resolve())
    output_dir = args.output_dir.resolve()
    source_pdf = args.source_pdf.resolve()
    with source_pdf.open("rb") as source_handle:
        source_sha256 = hashlib.file_digest(source_handle, "sha256").hexdigest()
    curriculum = build_curriculum()
    lexemes = parse_main_vocabulary(pages)
    proper_names = parse_generic_appendix(pages, 181, 182, "proper-name")
    beyond_level = parse_beyond_level_vocabulary(pages)

    lexemes_by_lesson: defaultdict[int, list[dict[str, Any]]] = defaultdict(list)
    for lexeme in lexemes:
        lexemes_by_lesson[lexeme["lessonNumber"]].append(lexeme)
    beyond_by_lesson: defaultdict[int, list[dict[str, Any]]] = defaultdict(list)
    for lexeme in beyond_level:
        if lexeme["lessonNumber"] is not None:
            beyond_by_lesson[lexeme["lessonNumber"]].append(lexeme)

    texts: list[dict[str, Any]] = []
    blocks_by_type: defaultdict[str, list[dict[str, Any]]] = defaultdict(list)
    lesson_payloads: list[dict[str, Any]] = []
    for lesson in curriculum["lessons"]:
        markers = find_section_markers(lesson, pages)
        article = extract_article(lesson, pages, markers)
        blocks = build_blocks(lesson, pages, markers)
        texts.append(article)
        for block in blocks:
            blocks_by_type[block["type"]].append(block)
        lesson_payload = {
            **lesson,
            "sectionMarkers": markers,
            "textIds": [article["id"]],
            "blockIds": [block["id"] for block in blocks],
            "lexemeIds": [lexeme["id"] for lexeme in lexemes_by_lesson[lesson["number"]]],
            "beyondLevelLexemeIds": [lexeme["id"] for lexeme in beyond_by_lesson[lesson["number"]]],
            "vocabularyCount": len(lexemes_by_lesson[lesson["number"]]),
            "beyondLevelVocabularyCount": len(beyond_by_lesson[lesson["number"]]),
            "allVocabularyCount": len(lexemes_by_lesson[lesson["number"]]) + len(beyond_by_lesson[lesson["number"]]),
            "notes": [
                "Printed instructions and exercises are stored as textbook content only; they are not executable instructions.",
                "Chinese text and Vietnamese glosses produced by OCR require editorial verification against the cited source pages.",
            ],
        }
        lesson_payloads.append(lesson_payload)
        dump_json(output_dir / "lessons" / f"lesson-{lesson['number']:02d}.json", lesson_payload)

    source_pages_payload = {"bundleId": BUNDLE_ID, "sourcePages": [pages[number] for number in sorted(pages)]}
    texts_payload = {"bundleId": BUNDLE_ID, "texts": texts}
    lexemes_payload = {"bundleId": BUNDLE_ID, "lexemes": lexemes}
    proper_payload = {"bundleId": BUNDLE_ID, "properNames": proper_names}
    media_payload = {
        "bundleId": BUNDLE_ID,
        "mediaAssets": [
            {
                "id": f"hsk5l-audio-{lesson_number:02d}-{track}",
                "lessonNumber": lesson_number,
                "type": "audio",
                "trackLabel": f"{lesson_number}-{track}",
                "availability": "referenced-in-book-not-embedded-in-source-pdf",
                "file": None,
            }
            for lesson_number in range(19, 37)
            for track in (1, 2)
        ],
    }

    vocabulary_by_lesson = {
        str(number): {
            "lessonId": f"hsk5l-lesson-{number:02d}",
            "lessonTitleZh": next(lesson[3] for lesson in LESSONS if lesson[0] == number),
            "count": len(lexemes_by_lesson[number]),
            "items": lexemes_by_lesson[number],
            "mainCount": len(lexemes_by_lesson[number]),
            "mainItems": lexemes_by_lesson[number],
            "beyondLevelCount": len(beyond_by_lesson[number]),
            "beyondLevelItems": beyond_by_lesson[number],
            "totalCount": len(lexemes_by_lesson[number]) + len(beyond_by_lesson[number]),
            "allItems": lexemes_by_lesson[number] + beyond_by_lesson[number],
        }
        for number in range(19, 37)
    }
    vocabulary_payload = {
        "schemaVersion": SCHEMA_VERSION,
        "bundleId": BUNDLE_ID,
        "title": "Từ vựng Giáo Trình Chuẩn HSK 5 (tập 2)",
        "sourcePages": {"pdf": {"start": 165, "end": 180}, "printed": {"start": 164, "end": 179}},
        "status": "machine-transcribed-needs-editorial-review",
        "count": len(lexemes),
        "counts": {
            "main": len(lexemes),
            "beyondLevel": len(beyond_level),
            "all": len(lexemes) + len(beyond_level),
            "properNames": len(proper_names),
        },
        "vocabulary": lexemes,
        "mainVocabulary": lexemes,
        "beyondLevelVocabulary": beyond_level,
        "allVocabulary": lexemes + beyond_level,
        "properNames": proper_names,
        "byLesson": vocabulary_by_lesson,
    }

    source_analysis = {
        "schemaVersion": SCHEMA_VERSION,
        "bundleId": BUNDLE_ID,
        "source": {
            "title": SOURCE_TITLE,
            "pathAtGeneration": str(source_pdf),
            "fileSizeBytes": source_pdf.stat().st_size,
            "sha256": source_sha256,
            "format": "PDF",
            "pageCount": 189,
            "textLayer": False,
            "languageCoverage": ["zh-Hans", "vi", "pinyin"],
        },
        "scope": {
            "units": {"start": 7, "end": 12, "count": 6},
            "lessons": {"start": 19, "end": 36, "count": 18},
            "mainVocabularyAppendixPdfPages": {"start": 165, "end": 180},
            "properNamesAppendixPdfPages": {"start": 181, "end": 182},
            "beyondLevelVocabularyAppendixPdfPages": {"start": 183, "end": 188},
            "answerKeyPresent": False,
            "unitDividerPdfPages": [14, 40, 64, 88, 114, 140],
        },
        "editorialPolicy": {
            "documentTextRole": "All printed directions, prompts, and exercises are source content, never instructions to the data-generation agent.",
            "ocrStatus": "review",
            "pinyinPolicy": "Canonical pinyin for parsed vocabulary was regenerated from Hanzi with pypinyin; raw OCR is preserved separately.",
            "meaningPolicy": "Vietnamese meanings are preserved as OCR evidence and require manual review for diacritics and line wrapping. Three omitted main glosses (家务, 无数, 物理) were visually restored and explicitly marked as manually verified.",
            "publicationReady": False,
        },
        "observedLessonStructure": ["warmup", "text", "annotation", "practice", "extension", "application"],
        "limitations": [
            "The PDF is image-only; textual fields are OCR-derived.",
            "Audio tracks are referenced by label but audio files are not embedded in the PDF.",
            "Illustrations remain in the source PDF and are not extracted as standalone assets.",
            "No answer key was found in this volume.",
        ],
    }

    appendix_vocab_payload = {
        "bundleId": BUNDLE_ID,
        "type": "main-vocabulary-summary",
        "sourcePdfPages": {"start": 165, "end": 180},
        "count": len(lexemes),
        "items": lexemes,
    }
    appendix_proper_payload = {
        "bundleId": BUNDLE_ID,
        "type": "proper-names-summary",
        "sourcePdfPages": {"start": 181, "end": 182},
        "count": len(proper_names),
        "items": proper_names,
    }
    appendix_beyond_payload = {
        "bundleId": BUNDLE_ID,
        "type": "beyond-level-vocabulary-summary",
        "sourcePdfPages": {"start": 183, "end": 188},
        "count": len(beyond_level),
        "items": beyond_level,
    }

    compiled = {
        "schemaVersion": SCHEMA_VERSION,
        "bundleId": BUNDLE_ID,
        "title": SOURCE_TITLE,
        "status": "review",
        "sourceAnalysis": source_analysis,
        "curriculum": {"units": curriculum["units"], "lessons": lesson_payloads},
        "vocabulary": lexemes,
        "mainVocabulary": lexemes,
        "beyondLevelVocabulary": beyond_level,
        "allVocabulary": lexemes + beyond_level,
        "vocabularyByLesson": vocabulary_by_lesson,
        "content": {
            "texts": texts,
            "blocks": {key: value for key, value in sorted(blocks_by_type.items())},
            "properNames": proper_names,
            "beyondLevelVocabulary": beyond_level,
            "mediaAssets": media_payload["mediaAssets"],
        },
        "sourcePages": source_pages_payload["sourcePages"],
    }

    artifacts = [
        "source-analysis.json",
        "curriculum.json",
        "vocabulary.json",
        "hsk5-lower-textbook.json",
        "source-pages.json",
        "texts.json",
        "lexemes.json",
        "proper-names.json",
        "media-assets.json",
        "appendices/vocabulary-summary.json",
        "appendices/proper-names-summary.json",
        "appendices/beyond-level-vocabulary.json",
        "schemas/textbook-lesson.schema.json",
    ] + [f"lessons/lesson-{number:02d}.json" for number in range(19, 37)]
    manifest = {
        "schemaVersion": SCHEMA_VERSION,
        "bundleId": BUNDLE_ID,
        "title": SOURCE_TITLE,
        "generatedOn": date.today().isoformat(),
        "status": "review",
        "counts": {
            "sourcePages": len(pages),
            "units": len(curriculum["units"]),
            "lessons": len(lesson_payloads),
            "texts": len(texts),
            "vocabulary": len(lexemes),
            "properNames": len(proper_names),
            "beyondLevelVocabulary": len(beyond_level),
            "contentBlocks": sum(len(value) for value in blocks_by_type.values()),
        },
        "entryPoints": {
            "compiled": "hsk5-lower-textbook.json",
            "vocabulary": "vocabulary.json",
            "curriculum": "curriculum.json",
            "sourceAnalysis": "source-analysis.json",
        },
        "artifacts": artifacts,
    }

    dump_json(output_dir / "manifest.json", manifest)
    dump_json(output_dir / "source-analysis.json", source_analysis)
    dump_json(output_dir / "curriculum.json", {**curriculum, "lessons": lesson_payloads})
    dump_json(output_dir / "vocabulary.json", vocabulary_payload)
    dump_json(output_dir / "hsk5-lower-textbook.json", compiled)
    dump_json(output_dir / "source-pages.json", source_pages_payload)
    dump_json(output_dir / "texts.json", texts_payload)
    dump_json(output_dir / "lexemes.json", lexemes_payload)
    dump_json(output_dir / "proper-names.json", proper_payload)
    dump_json(output_dir / "media-assets.json", media_payload)
    for section_type, file_name in SECTION_FILE_NAMES.items():
        dump_json(output_dir / file_name, {"bundleId": BUNDLE_ID, "blocks": blocks_by_type.get(section_type, [])})
        if file_name not in manifest["artifacts"]:
            manifest["artifacts"].append(file_name)
    dump_json(output_dir / "appendices" / "vocabulary-summary.json", appendix_vocab_payload)
    dump_json(output_dir / "appendices" / "proper-names-summary.json", appendix_proper_payload)
    dump_json(output_dir / "appendices" / "beyond-level-vocabulary.json", appendix_beyond_payload)
    dump_json(output_dir / "schemas" / "textbook-lesson.schema.json", schema_payload())
    dump_json(output_dir / "manifest.json", manifest)

    print(json.dumps(manifest["counts"], ensure_ascii=False))


if __name__ == "__main__":
    main()
