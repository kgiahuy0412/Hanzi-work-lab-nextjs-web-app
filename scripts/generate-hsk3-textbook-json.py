from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

from pypinyin import Style, lazy_pinyin


SCHEMA_VERSION = "1.0.0"
BUNDLE_ID = "hsk3-standard-course-textbook-vi-v1"
CJK_RE = re.compile(r"[\u3400-\u9fff]")
CJK_RUN_RE = re.compile(r"[\u3400-\u9fff（）()]+")
TRACK_RE = re.compile(r"(?<!\d)(\d{2})\s*[-._]?\s*([1-4])(?!\d)")
VOCAB_ANCHOR_RE = re.compile(r"^\s*(\d{1,2})\s*[.．、]\s*(.*[\u3400-\u9fff].*)$")
NOISE_PREFIXES = ("Scanned by ", "www.nhantriviet.com", "/GiaoTrinhChuanHSK")


LESSONS = [
    (1, 17, "周末你有什么打算？", "Anh dự định làm gì vào cuối tuần vậy?"),
    (2, 27, "他什么时候回来？", "Khi nào anh ấy quay về?"),
    (3, 36, "桌子上放着很多饮料。", "Trên bàn có rất nhiều thức uống."),
    (4, 45, "她总是笑着跟客人说话。", "Cô ấy luôn cười khi nói chuyện với khách hàng."),
    (5, 53, "我最近越来越胖了。", "Dạo này em ngày càng béo ra."),
    (6, 62, "怎么突然找不到了？", "Sao bỗng dưng lại không tìm thấy?"),
    (7, 71, "我跟她都认识五年了。", "Tôi và cô ấy quen nhau được năm năm rồi."),
    (8, 80, "你去哪儿我就去哪儿。", "Em đi đâu thì anh đi đến đó."),
    (9, 88, "她的汉语说得跟中国人一样好。", "Cô ấy nói tiếng Trung Quốc hay như người Trung Quốc vậy."),
    (10, 97, "数学比历史难多了。", "Môn Toán khó hơn môn Lịch sử nhiều."),
    (11, 106, "别忘了把空调关了。", "Đừng quên tắt máy điều hòa không khí nhé."),
    (12, 114, "把重要的东西放在我这儿吧。", "Hãy để những đồ quan trọng ở chỗ tôi đi."),
    (13, 123, "我是走回来的。", "Anh đi bộ về."),
    (14, 132, "你把水果拿过来。", "Cậu hãy mang trái cây đến đây."),
    (15, 141, "其他都没什么问题。", "Những câu khác đều không có vấn đề gì."),
    (16, 151, "我现在累得下了班就想睡觉。", "Bây giờ tôi mệt đến nỗi chỉ muốn đi ngủ sau khi hết giờ làm việc."),
    (17, 159, "谁都有办法看好你的“病”。", "Ai cũng có cách chữa khỏi “bệnh” của em."),
    (18, 167, "我相信他们会同意的。", "Tôi tin họ sẽ đồng ý."),
    (19, 175, "你没看出来吗？", "Anh không nhìn ra được à?"),
    (20, 184, "我被他影响了。", "Mình chịu ảnh hưởng từ anh ấy."),
]

CULTURES = [
    (1, 61, "中国有什么传统运动", "Các môn thể thao truyền thống của Trung Quốc"),
    (2, 105, "中国人结婚时穿什么", "Trang phục trong ngày cưới của người Trung Quốc"),
    (3, 150, "中国人过生日吃什么", "Món ăn của người Trung Quốc trong dịp sinh nhật"),
    (4, 193, "中国人什么礼物不能送", "Những đồ vật không được dùng làm quà tặng ở Trung Quốc"),
]

SECTION_KEYWORDS = {
    "text": ("课文",),
    "pinyin-transcript": ("拼音课文",),
    "grammar": ("注释",),
    "practice": ("练习", "练一练"),
    "hanzi": ("汉字",),
    "application": ("运用",),
    "idiom": ("俗语",),
}


# Vocabulary items that are clearly legible in the table of contents but whose
# numbered anchor was missed by OCR on the lesson page. Lesson 18 is included in
# full because printed pages 168-169 are absent from the supplied PDF. Its heads
# remain visible in the TOC and its glossary rows remain visible in the appendix.
TOC_LEXEME_RECOVERIES: dict[tuple[int, int], dict[str, Any]] = {
    (2, 7): {"hanzi": "太太"},
    (2, 8): {"hanzi": "秘书", "isBeyondHsk3Marked": True},
    (6, 1): {"hanzi": "眼镜", "isBeyondHsk3Marked": True},
    (6, 14): {"hanzi": "睡着", "isBeyondHsk3Marked": True},
    (8, 9): {"hanzi": "可乐"},
    (9, 6): {"hanzi": "一定"},
    (10, 12): {"hanzi": "中介", "isBeyondHsk3Marked": True},
    (13, 7): {"hanzi": "过去"},
    (13, 12): {"hanzi": "生活", "isBeyondHsk3Marked": True},
    (14, 9): {"hanzi": "盘子"},
    (15, 17): {"hanzi": "举行", "isBeyondHsk3Marked": True},
    (15, 20): {"hanzi": "各"},
    (16, 16): {"hanzi": "词语", "isBeyondHsk3Marked": True},
    (17, 14): {"hanzi": "情况", "isBeyondHsk3Marked": True},
    (18, 1): {"hanzi": "向", "appendixPdfPage": 199},
    (18, 2): {"hanzi": "万", "appendixPdfPage": 199},
    (18, 3): {"hanzi": "只", "pinyin": "zhī", "appendixPdfPage": 201},
    (18, 4): {"hanzi": "嘴", "appendixPdfPage": 201},
    (18, 5): {"hanzi": "动物", "appendixPdfPage": 194},
    (18, 6): {"hanzi": "段", "appendixPdfPage": 194},
    (18, 7): {
        "hanzi": "不但……而且……",
        "pinyin": "bù dàn……ér qiě……",
        "tocSearch": "不但",
        "appendixSearch": "不但",
        "appendixPdfPage": 193,
    },
    (18, 8): {"hanzi": "有名", "appendixPdfPage": 200},
    (18, 9): {"hanzi": "同意", "appendixPdfPage": 199},
    (18, 10): {"hanzi": "相信", "appendixPdfPage": 199},
    (18, 11): {"hanzi": "关于", "appendixPdfPage": 195},
    (18, 12): {"hanzi": "机会", "appendixPdfPage": 195},
    (18, 13): {"hanzi": "国家", "appendixPdfPage": 195},
    (18, 14): {"hanzi": "种", "appendixPdfPage": 201},
    (18, 15): {"hanzi": "特点", "isBeyondHsk3Marked": True, "appendixPdfPage": 203},
    (18, 16): {"hanzi": "奇怪", "appendixPdfPage": 198},
    (18, 17): {"hanzi": "地", "pinyin": "de", "appendixPdfPage": 194},
    (20, 13): {"hanzi": "真正", "isBeyondHsk3Marked": True},
}

EXPECTED_VOCAB_COUNTS = {
    1: 15,
    2: 18,
    3: 17,
    4: 16,
    5: 13,
    6: 15,
    7: 12,
    8: 17,
    9: 13,
    10: 15,
    11: 19,
    12: 14,
    13: 15,
    14: 17,
    15: 21,
    16: 16,
    17: 16,
    18: 17,
    19: 14,
    20: 14,
}

TOC_PAGE_BY_LESSON = {
    **{number: 8 for number in range(1, 6)},
    **{number: 10 for number in range(6, 11)},
    **{number: 12 for number in range(11, 16)},
    **{number: 14 for number in range(16, 21)},
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


def basic_noise(text: str, top: float, left: float) -> bool:
    value = text.strip()
    if not value:
        return True
    if any(value.startswith(prefix) for prefix in NOISE_PREFIXES):
        return True
    if top > 1490 and re.fullmatch(r"\d{1,3}", value):
        return True
    if left < 70 and top > 1000 and any(token in value for token in ("GiaoTrinh", "nhantriviet", "HSK")):
        return True
    return False


def printed_page_number(lines: list[dict[str, Any]]) -> int | None:
    candidates = []
    for line in lines:
        left, top, _, _ = bbox_metrics(line["box"])
        value = line["text"].strip()
        if top > 1450 and re.fullmatch(r"\d{1,3}", value):
            number = int(value)
            if 1 <= number <= 250:
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
        page_number = int(raw["page"])
        pages[page_number] = {
            "id": f"hsk3-tb-source-page-{page_number:03d}",
            "pdfPage": page_number,
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


def fragment_left(fragment: dict[str, Any]) -> float:
    return min(point[0] for point in fragment["box"])


def find_physical_for_printed(pages: dict[int, dict[str, Any]], printed: int) -> int | None:
    exact = [number for number, page in pages.items() if page["printedPage"] == printed]
    return min(exact) if exact else None


def find_title_page(pages: dict[int, dict[str, Any]], title: str, printed: int) -> int:
    normalized = re.sub(r"[。？“”\s]", "", title)
    candidates = []
    for number, page in pages.items():
        if number < 17:
            continue
        text = re.sub(r"[。？“”\s]", "", page_text(page))
        if normalized in text:
            candidates.append(number)
    exact = find_physical_for_printed(pages, printed)
    if exact in candidates:
        return exact
    if candidates:
        return min(candidates, key=lambda number: abs((pages[number]["printedPage"] or number) - printed))
    if exact is not None:
        return exact
    return printed


def resolve_layout(pages: dict[int, dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    cultures = []
    for number, printed, title_zh, title_vi in CULTURES:
        physical = find_title_page(pages, title_zh, printed)
        cultures.append({"number": number, "printed": printed, "pdfPage": physical, "titleZh": title_zh, "titleVi": title_vi})
    culture_by_after_lesson = {5: cultures[0]["pdfPage"], 10: cultures[1]["pdfPage"], 15: cultures[2]["pdfPage"], 20: cultures[3]["pdfPage"]}

    starts = []
    for number, printed, title_zh, title_vi in LESSONS:
        starts.append(
            {
                "number": number,
                "printedStart": printed,
                "pdfStart": find_title_page(pages, title_zh, printed),
                "titleZh": title_zh,
                "titleVi": title_vi,
            }
        )
    for index, lesson in enumerate(starts):
        if lesson["number"] in culture_by_after_lesson:
            end = culture_by_after_lesson[lesson["number"]] - 1
        else:
            end = starts[index + 1]["pdfStart"] - 1
        lesson["pdfEnd"] = end
        end_page = pages.get(end)
        lesson["printedEnd"] = end_page["printedPage"] if end_page and end_page["printedPage"] else lesson["printedStart"] + (end - lesson["pdfStart"])
    return starts, cultures


def detect_missing_printed_pages(lesson: dict[str, Any], pages: dict[int, dict[str, Any]]) -> list[int]:
    physical_span = lesson["pdfEnd"] - lesson["pdfStart"] + 1
    printed_span = lesson["printedEnd"] - lesson["printedStart"] + 1
    missing_count = max(0, printed_span - physical_span)
    if missing_count == 0:
        return []

    anchors = []
    for pdf_page in range(lesson["pdfStart"], lesson["pdfEnd"] + 1):
        printed_page = pages[pdf_page]["printedPage"]
        if printed_page is not None:
            anchors.append((pdf_page, printed_page))
    inferred_missing = []
    for (previous_pdf, previous_printed), (current_pdf, current_printed) in zip(anchors, anchors[1:]):
        excess = (current_printed - previous_printed) - (current_pdf - previous_pdf)
        if excess > 0:
            inferred_missing.extend(range(current_printed - excess, current_printed))
    return sorted(dict.fromkeys(inferred_missing))[:missing_count]


def contains_any(page: dict[str, Any], terms: tuple[str, ...]) -> bool:
    text = page_text(page)
    return any(term in text for term in terms)


def track_headers(page: dict[str, Any], lesson_number: int) -> list[dict[str, Any]]:
    headers = []
    for row in page["rows"]:
        if row["isNoise"]:
            continue
        code = None
        for fragment in row["fragments"]:
            match = TRACK_RE.search(fragment["text"])
            if match and int(match.group(1)) == lesson_number:
                code = f"{int(match.group(1)):02d}-{int(match.group(2))}"
                scene = int(match.group(2))
                break
        if code:
            chinese = "".join(
                fragment["text"]
                for fragment in row["fragments"]
                if fragment_left(fragment) < 760 and CJK_RE.search(fragment["text"])
            )
            chinese = re.sub(r"^\s*[1-4]\s*", "", chinese).strip()
            latin = " ".join(
                fragment["text"]
                for fragment in row["fragments"]
                if fragment_left(fragment) < 760 and not CJK_RE.search(fragment["text"]) and not TRACK_RE.search(fragment["text"])
            ).strip()
            headers.append(
                {
                    "scene": scene,
                    "trackCode": code,
                    "rowIndex": row["rowIndex"],
                    "top": row["top"],
                    "titleZh": chinese,
                    "titleViOcrRaw": latin or None,
                    "detectionSource": "track-code-ocr",
                }
            )
    detected = {header["scene"] for header in headers}
    pinyin_tops = [row["top"] for row in page["rows"] if "拼音课文" in row["text"]]
    pinyin_top = min(pinyin_tops) if pinyin_tops else 10_000
    for row in page["rows"]:
        if row["isNoise"] or row["top"] >= pinyin_top:
            continue
        scene = None
        for fragment in row["fragments"]:
            left = fragment_left(fragment)
            value = fragment["text"].strip()
            match = re.match(r"^([1-4])\s*([\u3400-\u9fff].*)$", value)
            if 150 <= left < 500 and match:
                scene = int(match.group(1))
                break
        if scene is None or scene in detected:
            continue
        chinese = "".join(
            fragment["text"]
            for fragment in row["fragments"]
            if fragment_left(fragment) < 760 and CJK_RE.search(fragment["text"])
        )
        chinese = re.sub(r"^\s*[1-4]\s*", "", chinese).strip()
        latin = " ".join(
            fragment["text"]
            for fragment in row["fragments"]
            if fragment_left(fragment) < 760 and not CJK_RE.search(fragment["text"]) and not TRACK_RE.search(fragment["text"])
        ).strip()
        headers.append(
            {
                "scene": scene,
                "trackCode": f"{lesson_number:02d}-{scene}",
                "rowIndex": row["rowIndex"],
                "top": row["top"],
                "titleZh": chinese,
                "titleViOcrRaw": latin or None,
                "detectionSource": "layout-inferred-from-scene-heading",
            }
        )
        detected.add(scene)
    existing_tops = [header["top"] for header in headers]
    inferred_candidates = []
    for row in page["rows"]:
        if row["isNoise"] or row["top"] >= pinyin_top or any(abs(row["top"] - top) < 18 for top in existing_tops):
            continue
        if "：" in row["text"] or "专有名词" in row["text"] or not CJK_RE.search(row["text"]):
            continue
        if not re.search(r"[A-Za-z]", row["text"]):
            continue
        if not (140 <= row["left"] < 500):
            continue
        nearby_vocab = any(
            row["top"] < later["top"] <= row["top"] + 100 and "生词" in later["text"]
            for later in page["rows"]
        )
        if nearby_vocab:
            inferred_candidates.append(row)
    for row in inferred_candidates:
        before = sorted((header["scene"], header["top"]) for header in headers if header["top"] < row["top"])
        after = sorted((header["scene"], header["top"]) for header in headers if header["top"] > row["top"])
        if before and after and after[0][0] - before[-1][0] == 2:
            scene = before[-1][0] + 1
        elif before and before[-1][0] < 4:
            scene = before[-1][0] + 1
        elif after and after[0][0] > 1:
            scene = after[0][0] - 1
        else:
            continue
        if scene in detected:
            continue
        chinese = "".join(
            fragment["text"]
            for fragment in row["fragments"]
            if fragment_left(fragment) < 760 and CJK_RE.search(fragment["text"])
        ).strip()
        latin = " ".join(
            fragment["text"]
            for fragment in row["fragments"]
            if fragment_left(fragment) < 760 and not CJK_RE.search(fragment["text"])
        ).strip()
        headers.append(
            {
                "scene": scene,
                "trackCode": f"{lesson_number:02d}-{scene}",
                "rowIndex": row["rowIndex"],
                "top": row["top"],
                "titleZh": chinese,
                "titleViOcrRaw": latin or None,
                "detectionSource": "layout-inferred-from-vocabulary-column",
            }
        )
        detected.add(scene)
    return sorted(headers, key=lambda header: header["top"])


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
        if any(term in row["text"] for term in ("拼音课文", "专有名词", "注释", "练习", "汉字", "运用", "俗语")):
            break
        segments = []
        for fragment in row["fragments"]:
            left = fragment_left(fragment)
            value = fragment["text"].strip()
            if 175 <= left < 665 and CJK_RE.search(value):
                segments.append(value)
        if segments:
            selected_rows.append(row["rowIndex"])
            raw_segments.append("".join(segments))

    lines = []
    for segment in raw_segments:
        if "：" in segment or ":" in segment:
            parts = re.split(r"[：:]", segment, maxsplit=1)
            lines.append({"speaker": parts[0].strip() or None, "textZh": parts[1].strip()})
        elif lines:
            lines[-1]["textZh"] += segment
        else:
            lines.append({"speaker": None, "textZh": segment})
    return {
        "id": f"{lesson_id}-scene-{header['scene']}",
        "lessonRef": lesson_id,
        "sceneNumber": header["scene"],
        "title": {"zh": header["titleZh"], "pinyin": pinyin(header["titleZh"]) if header["titleZh"] else None, "viOcrRaw": header["titleViOcrRaw"]},
        "trackCode": header["trackCode"],
        "trackDetectionSource": header["detectionSource"],
        "sourcePageRef": page["id"],
        "sourceRowIndexes": selected_rows,
        "lines": lines,
        "transcriptionStatus": "ocr-needs-editorial-review" if lines else "track-detected-content-needs-manual-transcription",
    }


def find_toc_vocabulary_evidence(page: dict[str, Any], search: str) -> tuple[list[int], str | None]:
    for row in page["rows"]:
        if row["isNoise"]:
            continue
        vocabulary_fragments = [
            fragment["text"].strip()
            for fragment in row["fragments"]
            if 540 <= fragment_left(fragment) < 765 and fragment["text"].strip()
        ]
        vocabulary_text = " ".join(vocabulary_fragments)
        if search in vocabulary_text:
            return [row["rowIndex"]], vocabulary_text
    return [], None


def find_appendix_vocabulary_evidence(
    page: dict[str, Any], search: str, lesson_number: int
) -> tuple[list[int], str | None]:
    lesson_marker = re.compile(rf"(?:^|\s){lesson_number}(?:\s|$)")
    for row in page["rows"]:
        if row["isNoise"] or not lesson_marker.search(row["text"]):
            continue
        cjk_fragments = [
            fragment["text"].strip().lstrip("*")
            for fragment in sorted(row["fragments"], key=fragment_left)
            if CJK_RE.search(fragment["text"])
        ]
        if cjk_fragments and search in cjk_fragments[0]:
            return [row["rowIndex"]], row["text"]
    return [], None


def extract_lexemes_for_lesson(lesson: dict[str, Any], pages: dict[int, dict[str, Any]]) -> list[dict[str, Any]]:
    found: dict[int, dict[str, Any]] = {}
    for page_number in range(lesson["pdfStart"], lesson["pdfEnd"] + 1):
        page = pages[page_number]
        if "生词" not in page_text(page):
            continue
        anchors = []
        for row in page["rows"]:
            for fragment in row["fragments"]:
                if fragment_left(fragment) < 650:
                    continue
                match = VOCAB_ANCHOR_RE.match(fragment["text"])
                if match:
                    number = int(match.group(1))
                    if 1 <= number <= 40:
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
                right_fragments = [fragment for fragment in row["fragments"] if fragment_left(fragment) >= 650]
                if not right_fragments:
                    continue
                if any(TRACK_RE.search(fragment["text"]) for fragment in right_fragments):
                    break
                row_indexes.append(current)
                raw_tokens.extend(fragment["text"].strip() for fragment in right_fragments if fragment["text"].strip())
            hanzi_match = CJK_RUN_RE.match(head.strip().lstrip("*"))
            if not hanzi_match:
                continue
            hanzi_source = hanzi_match.group(0)
            hanzi = hanzi_source.replace("（", "").replace("）", "").replace("(", "").replace(")", "")
            raw = " ".join(raw_tokens)
            pos_match = re.search(r"\b(dt|dgt|tt|pho|trg|tro|gioi|lien|so|luong)\.?", raw, flags=re.IGNORECASE)
            candidate = {
                "id": f"hsk3-tb-l{lesson['number']:02d}-v{number:02d}",
                "lessonRef": f"hsk3-tb-lesson-{lesson['number']:02d}",
                "sourceNumber": number,
                "hanzi": hanzi,
                "hanziSource": hanzi_source,
                "pinyin": pinyin(hanzi),
                "partOfSpeechOcrRaw": pos_match.group(0) if pos_match else None,
                "sourceTextOcrRaw": raw,
                "isBeyondHsk3Marked": anchor_raw.startswith("*") or "*" in anchor_raw[:3],
                "sourcePageRef": page["id"],
                "sourceRowIndexes": row_indexes,
                "sourceEvidence": "lesson-page-ocr",
                "meaningStatus": "embedded-in-source-text-ocr-raw-needs-parsing",
                "transcriptionStatus": "ocr-needs-editorial-review",
            }
            existing = found.get(number)
            if existing is None or len(candidate["sourceTextOcrRaw"]) > len(existing["sourceTextOcrRaw"]):
                found[number] = candidate
    expected = EXPECTED_VOCAB_COUNTS[lesson["number"]]
    unexpected = sorted(number for number in found if number > expected)
    if unexpected:
        raise ValueError(f"Lesson {lesson['number']} has unexpected vocabulary numbers above {expected}: {unexpected}")
    toc_page = pages[TOC_PAGE_BY_LESSON[lesson["number"]]]
    result = []
    for number in range(1, expected + 1):
        if number in found:
            result.append(found[number])
        elif (lesson["number"], number) in TOC_LEXEME_RECOVERIES:
            recovery = TOC_LEXEME_RECOVERIES[(lesson["number"], number)]
            hanzi = recovery["hanzi"]
            is_beyond = recovery.get("isBeyondHsk3Marked", False)
            row_indexes, toc_raw = find_toc_vocabulary_evidence(toc_page, recovery.get("tocSearch", hanzi))
            source_gap = lesson["number"] == 18
            appendix_page = pages.get(recovery.get("appendixPdfPage"))
            appendix_row_indexes: list[int] = []
            appendix_raw = None
            if appendix_page is not None:
                appendix_row_indexes, appendix_raw = find_appendix_vocabulary_evidence(
                    appendix_page,
                    recovery.get("appendixSearch", hanzi.replace("……", "")),
                    lesson["number"],
                )
            result.append(
                {
                    "id": f"hsk3-tb-l{lesson['number']:02d}-v{number:02d}",
                    "lessonRef": f"hsk3-tb-lesson-{lesson['number']:02d}",
                    "sourceNumber": number,
                    "hanzi": hanzi,
                    "hanziSource": f"*{hanzi}" if is_beyond else hanzi,
                    "pinyin": recovery.get("pinyin", pinyin(hanzi)),
                    "partOfSpeechOcrRaw": None,
                    "sourceTextOcrRaw": toc_raw,
                    "isBeyondHsk3Marked": is_beyond,
                    "sourcePageRef": toc_page["id"],
                    "sourceRowIndexes": row_indexes,
                    "sourceEvidence": "table-of-contents-and-vocabulary-appendix"
                    if source_gap
                    else "table-of-contents-plus-lesson-page-context",
                    "appendixSourcePageRef": appendix_page["id"] if appendix_page else None,
                    "appendixSourceRowIndexes": appendix_row_indexes,
                    "appendixTextOcrRaw": appendix_raw,
                    "meaningStatus": "available-in-vocabulary-appendix-ocr-needs-editorial-review"
                    if appendix_raw
                    else "unparsed-source-text-requires-page-review",
                    "transcriptionStatus": "toc-and-appendix-derived-source-pages-missing"
                    if source_gap
                    else "toc-recovered-ocr-anchor-missed-needs-editorial-review",
                }
            )
        else:
            result.append(
                {
                    "id": f"hsk3-tb-l{lesson['number']:02d}-v{number:02d}",
                    "lessonRef": f"hsk3-tb-lesson-{lesson['number']:02d}",
                    "sourceNumber": number,
                    "hanzi": None,
                    "hanziSource": None,
                    "pinyin": None,
                    "partOfSpeechOcrRaw": None,
                    "sourceTextOcrRaw": None,
                    "isBeyondHsk3Marked": None,
                    "sourcePageRef": None,
                    "sourceRowIndexes": [],
                    "sourceEvidence": "none",
                    "meaningStatus": "unknown",
                    "transcriptionStatus": "ocr-anchor-missed-manual-review-required",
                }
            )
    return result


def extract_proper_names(lesson: dict[str, Any], pages: dict[int, dict[str, Any]]) -> list[dict[str, Any]]:
    names = []
    serial = 0
    for page_number in range(lesson["pdfStart"], lesson["pdfEnd"] + 1):
        page = pages[page_number]
        rows = page["rows"]
        starts = [row["rowIndex"] for row in rows if "专有名词" in row["text"]]
        for start in starts:
            for row in rows[start + 1 :]:
                if row["top"] > 1530 or TRACK_RE.search(row["text"]):
                    break
                text = row["text"].strip()
                match = re.match(r"^\s*\d+[.．、]\s*([\u3400-\u9fff]+)", text)
                if match:
                    serial += 1
                    hanzi = match.group(1)
                    names.append(
                        {
                            "id": f"hsk3-tb-l{lesson['number']:02d}-proper-{serial:02d}",
                            "lessonRef": f"hsk3-tb-lesson-{lesson['number']:02d}",
                            "hanzi": hanzi,
                            "pinyin": pinyin(hanzi),
                            "sourceTextOcrRaw": text,
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
        headings = []
        for row in page["rows"]:
            if row["isNoise"] or not CJK_RE.search(row["text"]):
                continue
            if any(keyword in row["text"] for keyword in SECTION_KEYWORDS.get(kind, ())):
                headings.append(row["text"])
        blocks.append(
            {
                "id": f"hsk3-tb-l{lesson['number']:02d}-{kind}-{index:02d}",
                "lessonRef": f"hsk3-tb-lesson-{lesson['number']:02d}",
                "kind": kind,
                "sourcePageRef": page["id"],
                "sourceRowIndexes": meaningful_row_indexes(page),
                "detectedHeadingsOcrRaw": headings,
                "transcriptionStatus": "page-block-ocr-needs-editorial-review",
            }
        )
    return blocks


def assign_page_roles(pages: dict[int, dict[str, Any]], lessons: list[dict[str, Any]], cultures: list[dict[str, Any]]) -> None:
    for page in pages.values():
        page["role"] = "other"
    for page_number in range(3, 17):
        if page_number in pages:
            pages[page_number]["role"] = "front-matter"
    for lesson in lessons:
        for page_number in range(lesson["pdfStart"], lesson["pdfEnd"] + 1):
            pages[page_number]["role"] = "lesson-content"
            pages[page_number]["lessonNumber"] = lesson["number"]
    for culture in cultures:
        pages[culture["pdfPage"]]["role"] = "culture"
        pages[culture["pdfPage"]]["cultureNumber"] = culture["number"]
    appendix_start = find_physical_for_printed(pages, 194)
    if appendix_start:
        for page_number in range(appendix_start, max(pages) + 1):
            pages[page_number]["role"] = "vocabulary-appendix"


def build_schema() -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://himi.local/schemas/hsk3-textbook-lesson.schema.json",
        "title": "HSK 3 textbook lesson",
        "type": "object",
        "additionalProperties": False,
        "required": ["schemaVersion", "id", "lessonNumber", "status", "title", "source", "sections", "editorial"],
        "properties": {
            "$schema": {"type": "string"},
            "schemaVersion": {"const": SCHEMA_VERSION},
            "id": {"type": "string", "pattern": "^hsk3-tb-lesson-[0-9]{2}$"},
            "lessonNumber": {"type": "integer", "minimum": 1, "maximum": 20},
            "status": {"enum": ["draft", "review", "published"]},
            "title": {"type": "object", "required": ["zh", "pinyin", "vi"]},
            "source": {"type": "object", "required": ["pdfPages", "printedPages", "sourcePageRefs"]},
            "sections": {"type": "array", "minItems": 8},
            "editorial": {"type": "object"},
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--ocr-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, default=Path("content/hsk3-textbook-json"))
    args = parser.parse_args()

    pages = load_pages(args.ocr_dir)
    missing = [page for page in range(3, 207) if page not in pages]
    if missing:
        raise SystemExit(f"Missing OCR pages: {missing}")
    lessons, cultures = resolve_layout(pages)
    assign_page_roles(pages, lessons, cultures)

    output = args.output_dir
    all_lexemes = []
    all_scenes = []
    all_media = []
    all_proper_names = []
    blocks_by_kind: dict[str, list[dict[str, Any]]] = {
        "warmup": [],
        "pinyin-transcript": [],
        "grammar": [],
        "practice": [],
        "hanzi": [],
        "application": [],
        "idiom": [],
    }
    lesson_documents = []

    for lesson in lessons:
        lesson_id = f"hsk3-tb-lesson-{lesson['number']:02d}"
        lesson_pages = list(range(lesson["pdfStart"], lesson["pdfEnd"] + 1))
        missing_printed_pages = detect_missing_printed_pages(lesson, pages)
        detected_by_kind = {
            kind: [number for number in lesson_pages if contains_any(pages[number], keywords)]
            for kind, keywords in SECTION_KEYWORDS.items()
        }
        warmup_blocks = make_blocks("warmup", lesson, [lesson["pdfStart"]], pages)
        blocks_by_kind["warmup"].extend(warmup_blocks)
        section_block_refs = {"warmup": [block["id"] for block in warmup_blocks]}
        for kind in ("pinyin-transcript", "grammar", "practice", "hanzi", "application", "idiom"):
            built = make_blocks(kind, lesson, detected_by_kind[kind], pages)
            blocks_by_kind[kind].extend(built)
            section_block_refs[kind] = [block["id"] for block in built]

        detected_scenes: dict[int, dict[str, Any]] = {}
        text_page_refs = []
        for page_number in lesson_pages:
            page = pages[page_number]
            has_text_context = any(
                fragment["text"].strip() == "课文" or "拼音课文" in fragment["text"]
                for row in page["rows"]
                for fragment in row["fragments"]
            )
            headers = track_headers(page, lesson["number"]) if has_text_context else []
            if headers:
                text_page_refs.append(page["id"])
            for index, header in enumerate(headers):
                next_top = headers[index + 1]["top"] if index + 1 < len(headers) else None
                detected_scenes[header["scene"]] = extract_scene(page, header, next_top, lesson_id)
        fallback_page = text_page_refs[0] if text_page_refs else pages[min(lesson["pdfStart"] + 1, lesson["pdfEnd"])]["id"]
        scene_refs = []
        for scene_number in range(1, 5):
            track_code = f"{lesson['number']:02d}-{scene_number}"
            media_id = f"hsk3-tb-audio-l{lesson['number']:02d}-scene-{scene_number}"
            all_media.append(
                {
                    "id": media_id,
                    "kind": "audio",
                    "sourceTrackCode": track_code,
                    "availability": "not-in-supplied-pdf",
                    "requiredBy": f"{lesson_id}-scene-{scene_number}",
                }
            )
            scene = detected_scenes.get(scene_number)
            if scene is None:
                scene = {
                    "id": f"{lesson_id}-scene-{scene_number}",
                    "lessonRef": lesson_id,
                    "sceneNumber": scene_number,
                    "title": {"zh": None, "pinyin": None, "viOcrRaw": None},
                    "trackCode": track_code,
                    "trackDetectionSource": "source-pages-missing" if missing_printed_pages else "not-detected",
                    "sourcePageRef": pages[lesson["pdfStart"]]["id"] if missing_printed_pages else fallback_page,
                    "sourceRowIndexes": [],
                    "lines": [],
                    "transcriptionStatus": "source-pages-missing-cannot-transcribe"
                    if missing_printed_pages
                    else "ocr-track-anchor-missed-manual-review-required",
                }
            scene["audioRef"] = media_id
            all_scenes.append(scene)
            scene_refs.append(scene["id"])

        lexemes = extract_lexemes_for_lesson(lesson, pages)
        all_lexemes.extend(lexemes)
        all_proper_names.extend(extract_proper_names(lesson, pages))

        sections = [
            {"type": "warmup", "contentRefs": section_block_refs["warmup"]},
            {"type": "texts", "contentRefs": scene_refs, "sourcePageRefs": sorted(set(text_page_refs))},
            {"type": "vocabulary", "contentRefs": [entry["id"] for entry in lexemes]},
            {"type": "pinyin-transcript", "contentRefs": section_block_refs["pinyin-transcript"]},
            {"type": "grammar", "contentRefs": section_block_refs["grammar"]},
            {"type": "practice", "contentRefs": section_block_refs["practice"]},
            {"type": "hanzi", "contentRefs": section_block_refs["hanzi"]},
            {"type": "application", "contentRefs": section_block_refs["application"]},
            {"type": "idiom", "contentRefs": section_block_refs["idiom"]},
        ]
        document = {
            "$schema": "../schemas/textbook-lesson.schema.json",
            "schemaVersion": SCHEMA_VERSION,
            "id": lesson_id,
            "lessonNumber": lesson["number"],
            "status": "review",
            "title": {"zh": lesson["titleZh"], "pinyin": pinyin(lesson["titleZh"]), "vi": lesson["titleVi"]},
            "source": {
                "pdfPages": [lesson["pdfStart"], lesson["pdfEnd"]],
                "printedPages": [lesson["printedStart"], lesson["printedEnd"]],
                "missingPrintedPages": missing_printed_pages,
                "sourcePageRefs": [pages[number]["id"] for number in lesson_pages],
            },
            "sections": sections,
            "editorial": {
                "publicationReady": False,
                "answerStatus": "not-provided-in-source-pdf",
                "sourceGapStatus": "missing-pages-in-supplied-pdf" if missing_printed_pages else "complete-page-range",
                "requiredActions": [
                    "Đối chiếu OCR tiếng Trung, tiếng Việt và tên riêng với PDF.",
                    "Bổ sung audio theo mã track.",
                    "Rà soát quyền sử dụng hình minh họa.",
                ],
            },
        }
        lesson_documents.append(document)
        dump_json(output / "lessons" / f"lesson-{lesson['number']:02d}.json", document)

    culture_documents = []
    for culture in cultures:
        page = pages[culture["pdfPage"]]
        culture_documents.append(
            {
                "id": f"hsk3-tb-culture-{culture['number']:02d}",
                "number": culture["number"],
                "title": {"zh": culture["titleZh"], "pinyin": pinyin(culture["titleZh"]), "vi": culture["titleVi"]},
                "sourcePageRef": page["id"],
                "printedPage": culture["printed"],
                "sourceRowIndexes": meaningful_row_indexes(page),
                "visualAssetStatus": "embedded-in-pdf-not-extracted",
                "transcriptionStatus": "page-block-ocr-needs-editorial-review",
            }
        )

    dump_json(output / "shared" / "lexemes.json", {"schemaVersion": SCHEMA_VERSION, "lexemes": all_lexemes})
    dump_json(output / "shared" / "text-scenes.json", {"schemaVersion": SCHEMA_VERSION, "scenes": all_scenes})
    dump_json(output / "shared" / "media-assets.json", {"schemaVersion": SCHEMA_VERSION, "assets": all_media})
    dump_json(output / "shared" / "proper-names.json", {"schemaVersion": SCHEMA_VERSION, "properNames": all_proper_names})
    dump_json(output / "shared" / "culture-notes.json", {"schemaVersion": SCHEMA_VERSION, "cultureNotes": culture_documents})
    for kind, blocks in blocks_by_kind.items():
        dump_json(output / "shared" / f"{kind}-blocks.json", {"schemaVersion": SCHEMA_VERSION, "blocks": blocks})
    dump_json(output / "shared" / "source-pages.json", {"schemaVersion": SCHEMA_VERSION, "pages": [pages[number] for number in sorted(pages)]})
    dump_json(output / "schemas" / "textbook-lesson.schema.json", build_schema())

    appendix_start = find_physical_for_printed(pages, 194)
    appendix_pages = list(range(appendix_start, max(pages) + 1)) if appendix_start else []
    dump_json(
        output / "appendices" / "vocabulary-summary.json",
        {
            "schemaVersion": SCHEMA_VERSION,
            "id": "hsk3-tb-vocabulary-appendix",
            "sourcePrintedPages": [194, 207],
            "sourcePageRefs": [pages[number]["id"] for number in appendix_pages],
            "sections": ["词语总表", "旧字新词", "补充"],
            "transcriptionStatus": "raw-page-ocr-available-in-source-pages",
        },
    )

    curriculum = {
        "schemaVersion": SCHEMA_VERSION,
        "id": "hsk3-standard-course-textbook",
        "title": "Giáo trình chuẩn HSK 3",
        "lessonCount": 20,
        "lessons": [
            {
                "lessonNumber": lesson["number"],
                "lessonRef": f"lessons/lesson-{lesson['number']:02d}.json",
                "titleZh": lesson["titleZh"],
                "titleVi": lesson["titleVi"],
                "pdfPages": [lesson["pdfStart"], lesson["pdfEnd"]],
                "printedPages": [lesson["printedStart"], lesson["printedEnd"]],
            }
            for lesson in lessons
        ],
        "cultureRefs": [note["id"] for note in culture_documents],
        "appendixRef": "appendices/vocabulary-summary.json",
    }
    dump_json(output / "curriculum.json", curriculum)

    non_noise_rows = [row for page in pages.values() for row in page["rows"] if not row["isNoise"]]
    source_analysis = {
        "schemaVersion": SCHEMA_VERSION,
        "sourceId": "hsk3-standard-course-textbook-vi-scan",
        "fileName": "HSK 3 Sách giáo khoa.pdf",
        "documentType": "scanned-textbook",
        "pageCount": 207,
        "textLayer": False,
        "language": ["zh-CN", "vi-VN", "Hanyu Pinyin"],
        "contentMap": {
            "frontMatter": [3, 16],
            "lessons": [lessons[0]["pdfStart"], lessons[-1]["pdfEnd"]],
            "culturePrintedPages": [61, 105, 150, 193],
            "vocabularyAppendixPrintedPages": [194, 207],
        },
        "method": {
            "renderDpi": 140,
            "ocrEngine": "RapidOCR/ONNX Runtime",
            "visualReview": "Table of contents, representative lesson sections, culture/idiom pages and vocabulary appendices were visually reviewed.",
        },
        "coverage": {
            "lessons": 20,
            "textScenes": len(all_scenes),
            "lexemeRecords": len(all_lexemes),
            "properNameRecords": len(all_proper_names),
            "cultureNotes": len(culture_documents),
            "audioPlaceholders": len(all_media),
            "ocrSourcePages": len(pages),
        },
        "qualityMetrics": {
            "nonNoiseOcrRows": len(non_noise_rows),
            "nonNoiseRowsBelow075Confidence": sum(row["minConfidence"] < 0.75 for row in non_noise_rows),
            "lexemeStubsFromMissedAnchors": sum(entry["hanzi"] is None for entry in all_lexemes),
            "lexemesRecoveredFromTableOfContents": sum(
                entry["sourceEvidence"].startswith("table-of-contents")
                and entry["lessonRef"] != "hsk3-tb-lesson-18"
                for entry in all_lexemes
            ),
            "lesson18LexemesRecoveredFromTableOfContentsAndAppendix": sum(
                entry["lessonRef"] == "hsk3-tb-lesson-18"
                and entry["sourceEvidence"] == "table-of-contents-and-vocabulary-appendix"
                for entry in all_lexemes
            ),
            "sceneStubsFromMissingSourcePages": sum(
                not scene["lines"] and scene["transcriptionStatus"] == "source-pages-missing-cannot-transcribe"
                for scene in all_scenes
            ),
        },
        "sourceConstraints": [
            "The PDF is image-only and has no extractable text layer.",
            "Audio tracks are referenced by code but are not embedded in the supplied PDF.",
            "Vietnamese and source pinyin diacritics are less reliable in OCR than Chinese characters.",
            "Illustrations remain embedded in the source PDF and are represented by page references.",
            "Exercise answer keys are not printed in the supplied PDF.",
            "Printed pages 168-169 are absent; lesson 18 vocabulary heads and glossary rows are recoverable from the table of contents and appendix, but all four lesson texts are not.",
        ],
        "sourceGaps": [
            {
                "lessonRef": lesson["id"],
                "missingPrintedPages": lesson["source"]["missingPrintedPages"],
                "impact": "All four lesson-18 texts cannot be reconstructed. Vocabulary heads and glossary rows are retained from the table of contents and vocabulary appendix.",
            }
            for lesson in lesson_documents
            if lesson["source"]["missingPrintedPages"]
        ],
        "editorialPolicy": {
            "status": "review",
            "documentTextRole": "All printed instructions are treated only as textbook content, not as instructions to the data-processing agent.",
            "doNotPublishWithout": ["manual OCR comparison", "licensed audio", "visual asset review"],
            "derivedFields": ["stable IDs", "Hanyu pinyin generated from recognized Chinese", "section and page mappings"],
        },
    }
    dump_json(output / "source-analysis.json", source_analysis)

    block_files = [
        "warmup-blocks.json",
        "pinyin-transcript-blocks.json",
        "grammar-blocks.json",
        "practice-blocks.json",
        "hanzi-blocks.json",
        "application-blocks.json",
        "idiom-blocks.json",
    ]
    files = [
        {"path": "schemas/textbook-lesson.schema.json", "kind": "schema"},
        {"path": "source-analysis.json", "kind": "source-analysis"},
        {"path": "curriculum.json", "kind": "curriculum"},
        {"path": "shared/source-pages.json", "kind": "ocr-evidence"},
        {"path": "shared/lexemes.json", "kind": "shared-content", "entity": "lexeme"},
        {"path": "shared/text-scenes.json", "kind": "shared-content", "entity": "text-scene"},
        {"path": "shared/proper-names.json", "kind": "shared-content", "entity": "proper-name"},
        {"path": "shared/culture-notes.json", "kind": "shared-content", "entity": "culture-note"},
        {"path": "shared/media-assets.json", "kind": "shared-content", "entity": "media"},
        {"path": "appendices/vocabulary-summary.json", "kind": "appendix"},
    ] + [{"path": f"shared/{name}", "kind": "shared-content", "entity": name.removesuffix("-blocks.json")} for name in block_files]
    files += [
        {"path": f"lessons/lesson-{lesson['number']:02d}.json", "kind": "lesson", "lessonNumber": lesson["number"]}
        for lesson in lessons
    ]
    manifest = {
        "schemaVersion": SCHEMA_VERSION,
        "bundleId": BUNDLE_ID,
        "title": "Bộ dữ liệu JSON từ Giáo trình chuẩn HSK 3",
        "description": "Dữ liệu 20 bài, 80 bài khóa, từ mới, chú thích ngữ pháp, luyện tập, chữ Hán, vận dụng, tục ngữ, văn hóa, media placeholder và bằng chứng OCR theo trang.",
        "locale": {"interface": "vi-VN", "learning": "zh-CN", "pinyinSystem": "hanyu-pinyin-diacritic"},
        "status": "review",
        "sourceRef": "source-analysis.json",
        "curriculumRef": "curriculum.json",
        "files": files,
        "counts": {
            "lessons": len(lesson_documents),
            "textScenes": len(all_scenes),
            "lexemes": len(all_lexemes),
            "properNames": len(all_proper_names),
            "cultureNotes": len(culture_documents),
            "mediaPlaceholders": len(all_media),
            "ocrSourcePages": len(pages),
            "contentBlocks": sum(len(blocks) for blocks in blocks_by_kind.values()),
        },
    }
    dump_json(output / "manifest.json", manifest)


if __name__ == "__main__":
    main()
