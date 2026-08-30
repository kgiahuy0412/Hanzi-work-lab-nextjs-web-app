from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

from pypinyin import Style, lazy_pinyin


SCHEMA_VERSION = "1.0.0"
BUNDLE_ID = "hsk2-standard-course-workbook-vi-v1"
CJK_RE = re.compile(r"[\u3400-\u9fff]")
NUMBER_RE = re.compile(r"(?<!\d)(\d{1,2})\s*[.．、]")
NOISE_PREFIXES = (
    "Scanned by ",
    "www.nhantriviet.com",
    "/GiaoTrinhChuanHSK",
)


LESSONS = [
    (1, 7, 16, "九月去北京旅游最好。", "Nếu đi Bắc Kinh để du lịch thì tốt nhất là đi vào tháng chín."),
    (2, 17, 26, "我每天六点起床。", "Hằng ngày tôi thức dậy lúc 6 giờ."),
    (3, 27, 36, "左边那个红色的是我的。", "Ly màu đỏ ở bên trái là của tôi."),
    (4, 37, 46, "这个工作是他帮我介绍的。", "Ông ấy đã giới thiệu giúp tôi công việc này."),
    (5, 47, 56, "就买这件吧。", "Mua chiếc áo này đi."),
    (6, 57, 66, "你怎么不吃了？", "Sao anh không ăn nữa?"),
    (7, 67, 75, "你家离公司远吗？", "Nhà chị có ở xa công ty không?"),
    (8, 76, 84, "让我想想再告诉你。", "Để mình suy nghĩ rồi sẽ nói cho bạn biết."),
    (9, 85, 93, "题太多，我没做完。", "Câu hỏi quá nhiều nên mình không làm hết."),
    (10, 94, 102, "别找了，手机在桌子上呢。", "Đừng tìm nữa, điện thoại di động ở trên bàn kìa."),
    (11, 103, 111, "他比我大三岁。", "Anh ấy lớn hơn mình ba tuổi."),
    (12, 112, 120, "你穿得太少了。", "Anh mặc ít quần áo quá."),
    (13, 121, 129, "门开着呢。", "Cửa đang mở."),
    (14, 130, 138, "你看过这个电影吗？", "Cậu đã từng xem phim đó chưa?"),
    (15, 139, 148, "新年就要到了。", "Năm mới sắp đến rồi."),
]

CORE_GROUPS = [
    ("listening", 1, "listen-judge-image", 1, 5, "听句子，判断对错", "Nghe câu và xác định hình ảnh mô tả đúng hay sai.", True, True),
    ("listening", 2, "listen-match-image", 6, 10, "听对话，选择与对话内容一致的图片", "Nghe các mẫu đối thoại và chọn hình phù hợp.", True, True),
    ("listening", 3, "listen-multiple-choice", 11, 15, "听对话，选择正确答案", "Nghe các mẫu đối thoại và chọn câu trả lời đúng.", True, False),
    ("reading", 1, "read-match-image", 16, 20, "看图片，选择与句子内容一致的图片", "Chọn hình phù hợp với nội dung câu.", False, True),
    ("reading", 2, "fill-word-bank", 21, 25, "选择合适的词语填空", "Điền từ ngữ thích hợp vào chỗ trống.", False, False),
    ("reading", 3, "semantic-true-false", 26, 30, "判断下列句子的意思是否正确", "Xác định câu diễn giải bên dưới đúng hay sai.", False, False),
    ("reading", 4, "match-question-answer", 31, 35, "选择合适的问答", "Chọn câu hỏi hoặc câu trả lời phù hợp.", False, False),
]

VISUALLY_VERIFIED_CORRECTIONS = {
    (19, 11): ["A能", "B不能", "C不知道"],
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


def is_noise(text: str, top: float, left: float) -> bool:
    stripped = text.strip()
    if not stripped:
        return True
    if any(stripped.startswith(prefix) for prefix in NOISE_PREFIXES):
        return True
    if top > 1490 and re.fullmatch(r"\d{1,3}", stripped):
        return True
    if left > 1030 and top < 240:
        return True
    return False


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
                "isNoiseFragment": is_noise(line["text"], top, left),
            }
        )
    fragments.sort(key=lambda value: (value["centerY"], value["left"]))
    rows: list[dict[str, Any]] = []
    for fragment in fragments:
        same_noise_class = rows and fragment["isNoiseFragment"] == rows[-1]["fragments"][0]["isNoiseFragment"]
        if rows and same_noise_class and abs(fragment["centerY"] - rows[-1]["centerY"]) <= 8:
            rows[-1]["fragments"].append(fragment)
            centers = [item["centerY"] for item in rows[-1]["fragments"]]
            rows[-1]["centerY"] = sum(centers) / len(centers)
        else:
            rows.append({"centerY": fragment["centerY"], "fragments": [fragment]})

    normalized = []
    for index, row in enumerate(rows):
        row["fragments"].sort(key=lambda value: value["left"])
        source_fragments = []
        for fragment in row["fragments"]:
            source_fragments.append(
                {
                    "text": fragment["text"],
                    "confidence": fragment["confidence"],
                    "box": fragment["box"],
                }
            )
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
                "isNoise": is_noise(text, top, left),
                "fragments": source_fragments,
            }
        )
    return normalized


def load_pages(ocr_dir: Path) -> dict[int, dict[str, Any]]:
    pages: dict[int, dict[str, Any]] = {}
    for path in sorted(ocr_dir.glob("page-*.json")):
        raw = json.loads(path.read_text(encoding="utf-8"))
        page = int(raw["page"])
        pages[page] = {
            "id": f"hsk2-wb-source-page-{page:03d}",
            "pdfPage": page,
            "printedPage": page,
            "ocr": {
                "engine": "RapidOCR/ONNX Runtime",
                "elapsedSeconds": raw["elapsedSeconds"],
                "status": "machine-transcribed-needs-review",
            },
            "rows": build_rows(raw["lines"]),
        }
    return pages


def meaningful_rows(page: dict[str, Any]) -> list[dict[str, Any]]:
    return [row for row in page["rows"] if not row["isNoise"]]


def row_numbers(row: dict[str, Any]) -> list[int]:
    values = []
    for fragment in row["fragments"]:
        match = NUMBER_RE.search(fragment["text"])
        if match:
            values.append(int(match.group(1)))
    return values


def anchor_map(page: dict[str, Any], expected: range) -> dict[int, int]:
    expected_set = set(expected)
    anchors: dict[int, int] = {}
    for row in meaningful_rows(page):
        if row["top"] < 80 or row["top"] > 1535:
            continue
        for number in row_numbers(row):
            if number in expected_set and number not in anchors:
                anchors[number] = row["rowIndex"]
    return anchors


def source_row_refs(page: int, row_indexes: list[int]) -> list[dict[str, Any]]:
    if not row_indexes:
        return []
    return [{"pageRef": f"hsk2-wb-source-page-{page:03d}", "rowIndexes": row_indexes}]


def extract_item(page: dict[str, Any], page_number: int, question: int, expected: range, exercise_type: str) -> dict[str, Any]:
    anchors = anchor_map(page, expected)
    start = anchors.get(question)
    ordered = sorted((number, index) for number, index in anchors.items())
    if start is None:
        indexes: list[int] = []
    else:
        next_indexes = [index for number, index in ordered if number > question and index > start]
        end = min(next_indexes) if next_indexes else len(page["rows"])
        indexes = [
            index
            for index in range(start, end)
            if not page["rows"][index]["isNoise"] and page["rows"][index]["top"] < 1545
        ]

    chinese_segments: list[str] = []
    for index in indexes:
        for fragment in page["rows"][index]["fragments"]:
            value = fragment["text"].strip()
            if CJK_RE.search(value):
                value = re.sub(rf"^\s*{question}\s*[.．、]\s*", "", value)
                if value and value not in chinese_segments:
                    chinese_segments.append(value)

    correction = VISUALLY_VERIFIED_CORRECTIONS.get((page_number, question))
    if correction:
        chinese_segments = correction

    options = []
    if exercise_type == "listen-multiple-choice" and start is not None:
        row = page["rows"][start]
        buckets: dict[str, list[str]] = {"A": [], "B": [], "C": []}
        for fragment in row["fragments"]:
            value = re.sub(rf"^\s*{question}\s*[.．、]\s*", "", fragment["text"].strip())
            if not CJK_RE.search(value):
                continue
            label_match = re.match(r"^([ABC])\s*(.*)$", value)
            if label_match:
                label, value = label_match.groups()
            else:
                left = min(point[0] for point in fragment["box"])
                label = "A" if left < 450 else "B" if left < 760 else "C"
            value = value.strip()
            if value:
                buckets[label].append(value)
        options = [
            {"id": label.lower(), "label": label, "textZh": "".join(values), "pinyin": pinyin("".join(values))}
            for label, values in buckets.items()
            if values
        ]
        if len(options) < 3 and len(chinese_segments) == 3:
            options = []
            for label, segment in zip(("A", "B", "C"), chinese_segments):
                value = re.sub(r"^[ABC]\s*", "", segment).strip()
                options.append({"id": label.lower(), "label": label, "textZh": value, "pinyin": pinyin(value)})

    printed = bool(chinese_segments)
    if exercise_type.startswith("listen-"):
        prompt_status = "audio-only-not-supplied"
    elif printed:
        prompt_status = "printed-and-ocr-transcribed"
    else:
        prompt_status = "visual-only-or-ocr-missed"

    return {
        "questionNumber": question,
        "sourcePageRef": f"hsk2-wb-source-page-{page_number:03d}",
        "promptStatus": prompt_status,
        "content": {
            "printedChineseSegments": chinese_segments,
            "derivedPinyin": [pinyin(segment) for segment in chinese_segments],
            "options": options,
            "transcriptionSource": "visual-review-correction" if correction else "ocr",
        },
        "sourceRowRefs": source_row_refs(page_number, indexes),
        "answer": {"status": "not-provided-in-source-pdf", "correctResponse": None},
        "editorial": {
            "transcriptionStatus": "visually-verified-correction" if correction else "ocr-needs-editorial-review" if printed else "source-content-unavailable-without-audio-or-image",
            "confidencePolicy": "Use sourceRows and the PDF page for human verification before publishing.",
        },
    }


def find_option_bank(page: dict[str, Any], expected: range) -> dict[str, Any]:
    anchors = anchor_map(page, expected)
    first = min(anchors.values()) if anchors else len(page["rows"])
    candidates = []
    if expected.start in {31, 51}:
        sequential = []
        for row in page["rows"][:first]:
            if row["isNoise"] or row["top"] < 350:
                continue
            if "例如" in row["text"]:
                break
            values = [fragment["text"].strip() for fragment in row["fragments"] if CJK_RE.search(fragment["text"])]
            if values:
                text = "".join(values)
                text = re.sub(r"^[A-F]\s*", "", text).strip()
                if text:
                    sequential.append(text)
        if len(sequential) >= 6:
            candidates = [
                {"id": label.lower(), "label": label, "textZh": text, "pinyin": pinyin(text)}
                for label, text in zip("ABCDEF", sequential[:6])
            ]
    for row in page["rows"][:first]:
        if row["isNoise"] or row["top"] < 350:
            continue
        for fragment in row["fragments"]:
            value = fragment["text"].strip()
            match = re.match(r"^([A-F])\s*(.*[\u3400-\u9fff].*)$", value)
            if match:
                label, text = match.groups()
                if not any(item["label"] == label for item in candidates):
                    candidates.append({"id": label.lower(), "label": label, "textZh": text.strip(), "pinyin": pinyin(text.strip())})
    unique = {item["label"]: item for item in candidates}
    return {
        "status": "ocr-transcribed-needs-review" if len(unique) == 6 else "partial-ocr-review-required",
        "options": [unique[label] for label in sorted(unique)],
    }


def build_lesson(
    lesson_number: int,
    start_page: int,
    end_page: int,
    title_zh: str,
    title_vi: str,
    pages: dict[int, dict[str, Any]],
    groups: list[dict[str, Any]],
    items: list[dict[str, Any]],
    media: list[dict[str, Any]],
) -> dict[str, Any]:
    lesson_id = f"hsk2-wb-lesson-{lesson_number:02d}"
    listening_audio_id = f"hsk2-wb-audio-l{lesson_number:02d}-listening"
    pronunciation_audio_id = f"hsk2-wb-audio-l{lesson_number:02d}-pronunciation"
    media.extend(
        [
            {
                "id": listening_audio_id,
                "kind": "audio",
                "sourceTrackCode": f"{lesson_number:02d}-1",
                "availability": "not-in-supplied-pdf",
                "requiredBy": f"{lesson_id}-listening",
            },
            {
                "id": pronunciation_audio_id,
                "kind": "audio",
                "sourceTrackCode": f"{lesson_number:02d}-2",
                "availability": "not-in-supplied-pdf",
                "requiredBy": f"{lesson_id}-pronunciation",
            },
        ]
    )

    section_group_refs: dict[str, list[str]] = {"listening": [], "reading": [], "pronunciation": [], "hanzi": []}
    for offset, (section, part, exercise_type, q_start, q_end, instruction_zh, instruction_vi, needs_audio, needs_visual) in enumerate(CORE_GROUPS):
        page_number = start_page + offset
        group_id = f"{lesson_id}-{section}-part-{part}"
        item_refs = []
        for question in range(q_start, q_end + 1):
            item_id = f"{lesson_id}-q{question:02d}"
            payload = extract_item(pages[page_number], page_number, question, range(q_start, q_end + 1), exercise_type)
            payload.update(
                {
                    "id": item_id,
                    "lessonRef": lesson_id,
                    "groupRef": group_id,
                    "section": section,
                    "exerciseType": exercise_type,
                    "requiresAudio": needs_audio,
                    "requiresVisual": needs_visual,
                }
            )
            items.append(payload)
            item_refs.append(item_id)
        group = {
            "id": group_id,
            "lessonRef": lesson_id,
            "section": section,
            "part": part,
            "exerciseType": exercise_type,
            "questionRange": [q_start, q_end],
            "sourcePageRefs": [pages[page_number]["id"]],
            "instruction": {"zh": instruction_zh, "vi": instruction_vi, "viStatus": "normalized-from-source"},
            "itemRefs": item_refs,
            "requiresAudio": needs_audio,
            "audioRef": listening_audio_id if needs_audio else None,
            "requiresVisual": needs_visual,
            "visualAssetStatus": "embedded-in-pdf-not-extracted" if needs_visual else "not-required",
            "optionBank": find_option_bank(pages[page_number], range(q_start, q_end + 1)) if exercise_type in {"fill-word-bank", "match-question-answer"} else None,
            "answerStatus": "not-provided-in-source-pdf",
        }
        groups.append(group)
        section_group_refs[section].append(group_id)

    pronunciation_page = start_page + 7
    pronunciation_group_id = f"{lesson_id}-pronunciation"
    groups.append(
        {
            "id": pronunciation_group_id,
            "lessonRef": lesson_id,
            "section": "pronunciation",
            "exerciseType": "pronunciation-practice",
            "sourcePageRefs": [pages[pronunciation_page]["id"]],
            "sourceRowIndexes": [row["rowIndex"] for row in meaningful_rows(pages[pronunciation_page])],
            "audioRef": pronunciation_audio_id,
            "requiresAudio": True,
            "transcriptionStatus": "ocr-needs-editorial-review",
        }
    )
    section_group_refs["pronunciation"].append(pronunciation_group_id)

    hanzi_pages = list(range(start_page + 8, end_page + 1))
    hanzi_group_id = f"{lesson_id}-hanzi"
    groups.append(
        {
            "id": hanzi_group_id,
            "lessonRef": lesson_id,
            "section": "hanzi",
            "exerciseType": "radical-and-stroke-practice",
            "sourcePageRefs": [pages[number]["id"] for number in hanzi_pages],
            "sourceRowsByPage": [
                {
                    "pageRef": pages[number]["id"],
                    "rowIndexes": [row["rowIndex"] for row in meaningful_rows(pages[number])],
                }
                for number in hanzi_pages
            ],
            "visualAssetStatus": "stroke-order-diagrams-embedded-in-pdf-not-extracted",
            "transcriptionStatus": "ocr-needs-editorial-review",
        }
    )
    section_group_refs["hanzi"].append(hanzi_group_id)

    return {
        "$schema": "../schemas/workbook-lesson.schema.json",
        "schemaVersion": SCHEMA_VERSION,
        "id": lesson_id,
        "lessonNumber": lesson_number,
        "status": "review",
        "title": {"zh": title_zh, "pinyin": pinyin(title_zh), "vi": title_vi},
        "source": {
            "pdfPages": [start_page, end_page],
            "printedPages": [start_page, end_page],
            "sourcePageRefs": [pages[number]["id"] for number in range(start_page, end_page + 1)],
        },
        "sections": [
            {"id": f"{lesson_id}-listening", "type": "listening", "exerciseGroupRefs": section_group_refs["listening"]},
            {"id": f"{lesson_id}-reading", "type": "reading", "exerciseGroupRefs": section_group_refs["reading"]},
            {"id": f"{lesson_id}-pronunciation-section", "type": "pronunciation", "exerciseGroupRefs": section_group_refs["pronunciation"]},
            {"id": f"{lesson_id}-hanzi-section", "type": "hanzi", "exerciseGroupRefs": section_group_refs["hanzi"]},
        ],
        "answerStatus": "not-provided-in-source-pdf",
        "editorial": {
            "publicationReady": False,
            "requiredActions": [
                "Đối chiếu các dòng OCR với trang PDF.",
                "Bổ sung tệp audio theo mã track.",
                "Bổ sung đáp án từ nguồn được cấp phép.",
                "Trích xuất hoặc thay thế hình minh họa bằng asset có quyền sử dụng.",
            ],
        },
    }


def find_item_page(pages: dict[int, dict[str, Any]], question: int, start: int, end: int) -> int | None:
    for page_number in range(start, end + 1):
        if question in anchor_map(pages[page_number], range(1, 61)):
            return page_number
    return None


def default_mock_page(question: int) -> int:
    if question <= 5:
        return 151
    if question <= 10:
        return 152
    if question <= 15:
        return 153
    if question <= 20:
        return 154
    if question <= 30:
        return 155
    if question <= 35:
        return 156
    if question <= 40:
        return 157
    if question <= 45:
        return 158
    if question <= 49:
        return 159
    if question == 50:
        return 160
    if question <= 55:
        return 161
    return 162


def build_mock_exam(pages: dict[int, dict[str, Any]], media: list[dict[str, Any]]) -> dict[str, Any]:
    mock_audio_id = "hsk2-wb-audio-mock-listening"
    media.append(
        {
            "id": mock_audio_id,
            "kind": "audio",
            "sourceTrackCode": "mock-exam-listening",
            "availability": "not-in-supplied-pdf",
            "requiredBy": "hsk2-wb-mock-exam-01",
        }
    )
    definitions = [
        ("listening", 1, "listen-judge-image", 1, 10, True, True),
        ("listening", 2, "listen-match-image", 11, 20, True, True),
        ("listening", 3, "listen-multiple-choice", 21, 30, True, False),
        ("listening", 4, "listen-multiple-choice", 31, 35, True, False),
        ("reading", 1, "read-match-image", 36, 40, False, True),
        ("reading", 2, "fill-word-bank", 41, 45, False, False),
        ("reading", 3, "semantic-true-false", 46, 50, False, False),
        ("reading", 4, "match-question-answer", 51, 60, False, False),
    ]
    groups = []
    items = []
    for section, part, exercise_type, q_start, q_end, needs_audio, needs_visual in definitions:
        page_numbers = sorted({default_mock_page(question) for question in range(q_start, q_end + 1)})
        group_id = f"hsk2-wb-mock-{section}-part-{part}"
        item_refs = []
        for question in range(q_start, q_end + 1):
            page_number = find_item_page(pages, question, 149, 162) or default_mock_page(question)
            payload = {
                "id": f"hsk2-wb-mock-q{question:02d}",
                "questionNumber": question,
                "groupRef": group_id,
                "exerciseType": exercise_type,
                "requiresAudio": needs_audio,
                "requiresVisual": needs_visual,
                "answer": {"status": "not-provided-in-source-pdf", "correctResponse": None},
            }
            payload.update(extract_item(pages[page_number], page_number, question, range(q_start, q_end + 1), exercise_type))
            items.append(payload)
            item_refs.append(payload["id"])
        groups.append(
            {
                "id": group_id,
                "section": section,
                "part": part,
                "exerciseType": exercise_type,
                "questionRange": [q_start, q_end],
                "sourcePageRefs": [pages[number]["id"] for number in page_numbers],
                "itemRefs": item_refs,
                "requiresAudio": needs_audio,
                "audioRef": mock_audio_id if needs_audio else None,
                "requiresVisual": needs_visual,
                "visualAssetStatus": "embedded-in-pdf-not-extracted" if needs_visual else "not-required",
                "optionBank": find_option_bank(pages[page_numbers[0]], range(q_start, q_end + 1)) if exercise_type in {"fill-word-bank", "match-question-answer"} else None,
                "answerStatus": "not-provided-in-source-pdf",
            }
        )
    return {
        "schemaVersion": SCHEMA_VERSION,
        "id": "hsk2-wb-mock-exam-01",
        "title": "Đề thi mô phỏng HSK cấp độ 2",
        "source": {"pdfPages": [149, 162], "sourcePageRefs": [pages[number]["id"] for number in range(149, 163)]},
        "structure": {"questionCount": 60, "listeningQuestions": 35, "readingQuestions": 25},
        "groups": groups,
        "items": items,
        "answerStatus": "not-provided-in-source-pdf",
        "editorialStatus": "ocr-needs-editorial-review",
    }


def lesson_for_page(page: int) -> int | None:
    for number, start, end, _, _ in LESSONS:
        if start <= page <= end:
            return number
    return None


def assign_page_roles(pages: dict[int, dict[str, Any]]) -> None:
    for number, page in pages.items():
        lesson = lesson_for_page(number)
        if lesson:
            page["role"] = "lesson-content"
            page["lessonNumber"] = lesson
        elif 149 <= number <= 162:
            page["role"] = "mock-exam"
        elif 163 <= number <= 168:
            page["role"] = "exam-guide"
        elif number == 5:
            page["role"] = "table-of-contents"
        elif number in {3, 4}:
            page["role"] = "front-matter"
        else:
            page["role"] = "other"


def build_schema() -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://himi.local/schemas/hsk2-workbook-lesson.schema.json",
        "title": "HSK 2 workbook lesson",
        "type": "object",
        "additionalProperties": False,
        "required": ["schemaVersion", "id", "lessonNumber", "status", "title", "source", "sections", "answerStatus", "editorial"],
        "properties": {
            "$schema": {"type": "string"},
            "schemaVersion": {"const": SCHEMA_VERSION},
            "id": {"type": "string", "pattern": "^hsk2-wb-lesson-[0-9]{2}$"},
            "lessonNumber": {"type": "integer", "minimum": 1, "maximum": 15},
            "status": {"enum": ["draft", "review", "published"]},
            "title": {
                "type": "object",
                "required": ["zh", "pinyin", "vi"],
                "properties": {"zh": {"type": "string"}, "pinyin": {"type": "string"}, "vi": {"type": "string"}},
                "additionalProperties": False,
            },
            "source": {"type": "object", "required": ["pdfPages", "printedPages", "sourcePageRefs"]},
            "sections": {
                "type": "array",
                "minItems": 4,
                "maxItems": 4,
                "items": {
                    "type": "object",
                    "required": ["id", "type", "exerciseGroupRefs"],
                    "properties": {
                        "id": {"type": "string"},
                        "type": {"enum": ["listening", "reading", "pronunciation", "hanzi"]},
                        "exerciseGroupRefs": {"type": "array", "minItems": 1, "items": {"type": "string"}},
                    },
                    "additionalProperties": False,
                },
            },
            "answerStatus": {"const": "not-provided-in-source-pdf"},
            "editorial": {"type": "object"},
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--ocr-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, default=Path("content/hsk2-workbook-json"))
    args = parser.parse_args()

    pages = load_pages(args.ocr_dir)
    missing = [page for page in range(3, 169) if page not in pages]
    if missing:
        raise SystemExit(f"Missing OCR pages: {missing}")
    assign_page_roles(pages)

    output = args.output_dir
    groups: list[dict[str, Any]] = []
    items: list[dict[str, Any]] = []
    media: list[dict[str, Any]] = []
    lesson_documents = []
    for lesson in LESSONS:
        document = build_lesson(*lesson, pages, groups, items, media)
        lesson_documents.append(document)
        dump_json(output / "lessons" / f"lesson-{lesson[0]:02d}.json", document)

    mock_exam = build_mock_exam(pages, media)
    dump_json(output / "mock-exam.json", mock_exam)
    dump_json(
        output / "exam-guide.json",
        {
            "schemaVersion": SCHEMA_VERSION,
            "id": "hsk2-exam-guide",
            "source": {"pdfPages": [163, 168], "sourcePageRefs": [pages[number]["id"] for number in range(163, 169)]},
            "normalizedStructure": {
                "level": "HSK 2",
                "totalQuestions": 60,
                "listening": {"questions": 35, "minutesApprox": 25, "parts": [10, 10, 10, 5]},
                "reading": {"questions": 25, "minutes": 20, "parts": [5, 5, 5, 10]},
                "answerSheetMinutes": 5,
                "totalMinutesApprox": 55,
            },
            "transcriptionStatus": "normalized-from-pages-163-168",
        },
    )
    dump_json(output / "shared" / "exercise-groups.json", {"schemaVersion": SCHEMA_VERSION, "groups": groups})
    dump_json(output / "shared" / "exercise-items.json", {"schemaVersion": SCHEMA_VERSION, "items": items})
    dump_json(output / "shared" / "media-assets.json", {"schemaVersion": SCHEMA_VERSION, "assets": media})
    dump_json(output / "shared" / "source-pages.json", {"schemaVersion": SCHEMA_VERSION, "pages": [pages[number] for number in sorted(pages)]})
    dump_json(output / "schemas" / "workbook-lesson.schema.json", build_schema())

    curriculum = {
        "schemaVersion": SCHEMA_VERSION,
        "id": "hsk2-standard-course-workbook",
        "title": "Giáo trình chuẩn HSK 2 — Sách bài tập",
        "lessonCount": 15,
        "lessons": [
            {
                "lessonNumber": number,
                "lessonRef": f"lessons/lesson-{number:02d}.json",
                "titleZh": zh,
                "titleVi": vi,
                "pdfPages": [start, end],
            }
            for number, start, end, zh, vi in LESSONS
        ],
        "supplements": [
            {"ref": "mock-exam.json", "pdfPages": [149, 162]},
            {"ref": "exam-guide.json", "pdfPages": [163, 168]},
        ],
    }
    dump_json(output / "curriculum.json", curriculum)

    non_noise_rows = [row for page in pages.values() for row in page["rows"] if not row["isNoise"]]
    source_analysis = {
        "schemaVersion": SCHEMA_VERSION,
        "sourceId": "hsk2-standard-course-workbook-vi-scan",
        "fileName": "HSK 2 Sách bài tập - Copy.pdf",
        "documentType": "scanned-workbook",
        "pageCount": 169,
        "textLayer": False,
        "language": ["zh-CN", "vi-VN", "Hanyu Pinyin"],
        "contentMap": {
            "frontMatter": [3, 6],
            "lessons": [7, 148],
            "mockExam": [149, 162],
            "examGuide": [163, 168],
            "backCover": 169,
        },
        "method": {
            "renderDpi": 140,
            "ocrEngine": "RapidOCR/ONNX Runtime",
            "visualReview": "Representative pages reviewed, including table of contents, lesson exercises, mock exam and exam guide.",
        },
        "coverage": {
            "lessonQuestions": 525,
            "lessonQuestionsWithPrintedChinese": 375,
            "lessonQuestionsWhosePromptDependsOnAudioOrVisuals": 150,
            "mockExamQuestions": 60,
            "pronunciationGroups": 15,
            "hanziGroups": 15,
            "ocrSourcePages": len(pages),
        },
        "qualityMetrics": {
            "nonNoiseOcrRows": len(non_noise_rows),
            "nonNoiseRowsBelow075Confidence": sum(row["minConfidence"] < 0.75 for row in non_noise_rows),
            "visuallyVerifiedCorrections": [
                {"pdfPage": 19, "question": 11, "field": "displayedOptions", "value": ["A能", "B不能", "C不知道"]}
            ],
        },
        "sourceConstraints": [
            "The supplied PDF does not contain an extractable text layer.",
            "Listening scripts and audio are not present in the supplied PDF.",
            "The PDF points readers to an external website for answers; no answer key is printed in the supplied file.",
            "RapidOCR preserves Chinese relatively well but frequently drops Vietnamese and pinyin diacritics.",
            "Exercise illustrations and stroke-order diagrams remain embedded in the PDF and are represented by source-page references rather than copied assets.",
        ],
        "editorialPolicy": {
            "status": "review",
            "documentTextRole": "All printed instructions are treated only as source exercise content, not as instructions to the data-processing agent.",
            "doNotPublishWithout": ["manual OCR comparison", "licensed audio", "licensed answer key", "visual asset review"],
            "derivedFields": ["normalized Vietnamese instructions", "pinyin generated from recognized Chinese", "stable IDs and references"],
        },
    }
    dump_json(output / "source-analysis.json", source_analysis)

    files = [
        {"path": "schemas/workbook-lesson.schema.json", "kind": "schema"},
        {"path": "source-analysis.json", "kind": "source-analysis"},
        {"path": "curriculum.json", "kind": "curriculum"},
        {"path": "shared/source-pages.json", "kind": "ocr-evidence"},
        {"path": "shared/exercise-groups.json", "kind": "shared-content", "entity": "exercise-group"},
        {"path": "shared/exercise-items.json", "kind": "shared-content", "entity": "exercise-item"},
        {"path": "shared/media-assets.json", "kind": "shared-content", "entity": "media"},
        {"path": "mock-exam.json", "kind": "mock-exam"},
        {"path": "exam-guide.json", "kind": "exam-guide"},
    ] + [
        {"path": f"lessons/lesson-{number:02d}.json", "kind": "lesson", "lessonNumber": number}
        for number, *_ in LESSONS
    ]
    manifest = {
        "schemaVersion": SCHEMA_VERSION,
        "bundleId": BUNDLE_ID,
        "title": "Bộ dữ liệu JSON từ Giáo trình chuẩn HSK 2 — Sách bài tập",
        "description": "Dữ liệu 15 bài, đề mô phỏng, hướng dẫn thi, nhóm bài tập, câu hỏi, media placeholder và bằng chứng OCR theo trang.",
        "locale": {"interface": "vi-VN", "learning": "zh-CN", "pinyinSystem": "hanyu-pinyin-diacritic"},
        "status": "review",
        "sourceRef": "source-analysis.json",
        "curriculumRef": "curriculum.json",
        "files": files,
        "counts": {
            "lessons": len(lesson_documents),
            "lessonExerciseGroups": len(groups),
            "lessonQuestions": len(items),
            "mockExamQuestions": len(mock_exam["items"]),
            "mediaPlaceholders": len(media),
            "ocrSourcePages": len(pages),
        },
    }
    dump_json(output / "manifest.json", manifest)


if __name__ == "__main__":
    main()
