from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import defaultdict
from datetime import date
from pathlib import Path
from typing import Any, Iterable


SCHEMA_VERSION = "1.0.0"
BUNDLE_ID = "hsk5-standard-course-workbook-1-zh-v1"
SOURCE_TITLE = "HSK 5 Sách bài tập 1"
CJK_RE = re.compile(r"[\u3400-\u9fff]")
QUESTION_RE = re.compile(r"^\s*(\d{1,2})\s*[.．、]\s*(.*)$")
NAMED_QUESTION_RE = re.compile(r"^\s*第\s*(\d{1,2})\s*题\s*[:：]?\s*(.*)$")
OPTION_RE = re.compile(r"^\s*([A-DＡ-Ｄ])\s*[.．、:]?\s*(.*)$")
OCR_D_OPTION_RE = re.compile(r"^\s*[I1]D\s*[.．、:]?\s*(.*)$")
MULTI_OPTION_RE = re.compile(
    r"([A-DＡ-Ｄ])\s*[.．、:]?\s*(.*?)(?=(?:[A-DＡ-Ｄ])\s*[.．、:]?|$)",
)
PART_RE = re.compile(r"第\s*([一二三四五六])\s*部分")
TRACK_RE = re.compile(r"(?<!\d)(0?[1-9]|1[0-8])\s*[-—]\s*([12])(?!\d)")
NOISE_TOKENS = (
    "Scanned by Tiếng Trung Thầy Quốc Tư",
    "QT Education",
    "nhantriviet.com",
    "GiaoTrinhChuanHSK",
    "学而优",
)


UNITS = [
    (1, 7, "了解生活", (1, 2, 3)),
    (2, 29, "谈古说今", (4, 5, 6)),
    (3, 51, "倾听故事", (7, 8, 9)),
    (4, 73, "走近科学", (10, 11, 12)),
    (5, 95, "放眼世界", (13, 14, 15)),
    (6, 117, "修身养性", (16, 17, 18)),
]

LESSONS = [
    (1, 8, 14, "爱的细节"),
    (2, 15, 21, "留串钥匙给父母"),
    (3, 22, 28, "人生有选择，一切可改变"),
    (4, 30, 36, "子路背米"),
    (5, 37, 43, "济南的泉水"),
    (6, 44, 50, "除夕的由来"),
    (7, 52, 58, "成语故事两则"),
    (8, 59, 65, "“朝三暮四”的古今义"),
    (9, 66, 72, "别样鲁迅"),
    (10, 74, 80, "争论的奇迹"),
    (11, 81, 87, "闹钟的危害"),
    (12, 88, 94, "海外用户玩儿微信"),
    (13, 96, 102, "锯掉生活的“筐底”"),
    (14, 103, 109, "北京的四合院"),
    (15, 110, 116, "纸上谈兵"),
    (16, 118, 124, "体重与节食"),
    (17, 125, 131, "在最美好的时刻离开"),
    (18, 132, 138, "抽象艺术美不美"),
]

PART_LABELS = {"一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6}
OPTION_OVERRIDES = {
    # Two low-contrast option labels were omitted by OCR and restored through
    # direct visual comparison with PDF pages 76 and 98.
    (10, "reading", 18, "C"): "冲",
    (13, "reading", 17, "C"): "蹲",
}


def dump_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def compact(text: str) -> str:
    return re.sub(r"\s+", "", text or "")


def box_metrics(box: list[list[float]]) -> tuple[float, float, float, float]:
    xs = [point[0] for point in box]
    ys = [point[1] for point in box]
    return min(xs), min(ys), max(xs), max(ys)


def is_noise(text: str, left: float, top: float, image_height: float = 1571) -> bool:
    value = text.strip()
    if not value:
        return True
    if any(token.lower() in value.lower() for token in NOISE_TOKENS):
        return True
    if value.lower().startswith("scanned by"):
        return True
    if top > image_height * 0.92 and re.fullmatch(r"[-—]?\s*\d{1,3}\s*[-—]?", value):
        return True
    if (left < 85 or left > 1020) and any(token.lower() in value.lower() for token in ("nhantriviet", "giaotrinh")):
        return True
    return False


def build_rows(lines: list[dict[str, Any]], image_height: float = 1571) -> list[dict[str, Any]]:
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
        height = max(1.0, fragment["bottom"] - fragment["top"])
        threshold = max(7.0, min(13.0, height * 0.30))
        if groups and abs(fragment["centerY"] - groups[-1]["centerY"]) <= threshold:
            groups[-1]["items"].append(fragment)
            groups[-1]["centerY"] = sum(item["centerY"] for item in groups[-1]["items"]) / len(groups[-1]["items"])
        else:
            groups.append({"centerY": fragment["centerY"], "items": [fragment]})

    rows = []
    for row_index, group in enumerate(groups):
        items = sorted(group["items"], key=lambda item: item["left"])
        visible_items = [item for item in items if not item["isNoise"]]
        text_items = visible_items or items
        text = " ".join(item["text"] for item in text_items if item["text"])
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


def printed_page_number(rows: list[dict[str, Any]], pdf_page: int) -> int | None:
    candidates: list[tuple[float, int]] = []
    for row in rows:
        value = row["text"].strip(" -—")
        if row["top"] > 1420 and re.fullmatch(r"\d{1,3}", value):
            number = int(value)
            if 1 <= number <= 160:
                candidates.append((row["top"], number))
    if candidates:
        return max(candidates)[1]
    return pdf_page if 3 <= pdf_page <= 141 else None


def page_role(pdf_page: int) -> tuple[str, int | None, str | None]:
    if pdf_page in {unit[1] for unit in UNITS}:
        return "unit-divider", None, None
    for lesson_number, start, end, _ in LESSONS:
        if start <= pdf_page <= end:
            offset = pdf_page - start
            section_type = "listening" if offset <= 1 else "reading" if offset <= 5 else "writing"
            return "lesson-content", lesson_number, section_type
    if pdf_page <= 6:
        return "front-matter", None, None
    if pdf_page <= 140:
        return "hsk5-exam-appendix", None, None
    if pdf_page == 141:
        return "publication-metadata", None, None
    return "marketing", None, None


def load_pages(ocr_dir: Path) -> dict[int, dict[str, Any]]:
    paths = sorted(ocr_dir.glob("page-*.json"))
    found = {int(path.stem.split("-")[-1]) for path in paths}
    missing = sorted(set(range(1, 145)) - found)
    if missing:
        raise SystemExit(f"OCR is incomplete; missing {len(missing)} page(s): {missing[:25]}")
    pages: dict[int, dict[str, Any]] = {}
    for path in paths:
        raw = json.loads(path.read_text(encoding="utf-8"))
        number = int(raw["page"])
        rows = build_rows(raw["lines"])
        role, lesson_number, section_type = page_role(number)
        pages[number] = {
            "id": f"hsk5w1-source-page-{number:03d}",
            "pdfPage": number,
            "printedPage": printed_page_number(rows, number),
            "role": role,
            "lessonNumber": lesson_number,
            "sectionType": section_type,
            "imageFileName": raw.get("image"),
            "ocr": {
                "engine": "RapidOCR / ONNX Runtime",
                "wallSeconds": raw.get("wallSeconds"),
                "status": "machine-transcribed-needs-editorial-review",
            },
            "rows": rows,
        }
    return pages


def lesson_section_ranges(lesson: dict[str, Any]) -> dict[str, tuple[int, int]]:
    start = lesson["sourcePdfPages"]["start"]
    return {
        "listening": (start, start + 1),
        "reading": (start + 2, start + 5),
        "writing": (start + 6, start + 6),
    }


def iter_rows(pages: dict[int, dict[str, Any]], start: int, end: int) -> Iterable[tuple[int, dict[str, Any]]]:
    for page_number in range(start, end + 1):
        for row in pages[page_number]["rows"]:
            if not row["isNoise"]:
                yield page_number, row


def detect_part(row: dict[str, Any]) -> int | None:
    match = PART_RE.search(compact(row["text"]))
    return PART_LABELS.get(match.group(1)) if match else None


def extract_options(rows: list[dict[str, Any]]) -> list[dict[str, str]]:
    options: list[dict[str, str]] = []
    seen: set[str] = set()
    for row in rows:
        for fragment in row["fragments"]:
            raw_value = fragment["text"].strip()
            value = raw_value
            question_match = QUESTION_RE.match(value)
            if question_match:
                value = question_match.group(2).strip()
            d_match = OCR_D_OPTION_RE.match(value)
            if d_match:
                value = "D" + d_match.group(1)
            elif not re.match(r"^\s*[A-DＡ-Ｄ]", value):
                continue
            for match in MULTI_OPTION_RE.finditer(value):
                label = match.group(1).upper().translate(str.maketrans("ＡＢＣＤ", "ABCD"))
                option_text = match.group(2).strip()
                key = f"{label}:{option_text}"
                if key not in seen:
                    seen.add(key)
                    options.append({"label": label, "textOcr": option_text, "rawOcr": raw_value})
    return options


def listening_logical_rows(
    pages: dict[int, dict[str, Any]], start: int, end: int
) -> list[tuple[int, dict[str, Any], int | None]]:
    """Split the two-column listening layouts into independent reading order."""
    logical: list[tuple[int, dict[str, Any], int | None]] = []
    for page_number in range(start, end + 1):
        source_rows = [row for row in pages[page_number]["rows"] if not row["isNoise"]]
        page_part = next((detect_part(row) for row in source_rows if detect_part(row) is not None), None)
        for column in (0, 1):
            virtual_rows: list[dict[str, Any]] = []
            for row in source_rows:
                fragments = [
                    fragment
                    for fragment in row["fragments"]
                    if (fragment["left"] < 555) == (column == 0)
                ]
                if not fragments:
                    continue
                virtual_rows.append(
                    {
                        **row,
                        "text": " ".join(fragment["text"] for fragment in fragments),
                        "left": min(fragment["left"] for fragment in fragments),
                        "right": max(fragment["right"] for fragment in fragments),
                        "fragments": fragments,
                        "_column": column,
                    }
                )
            virtual_rows.sort(key=lambda row: (row["top"], row["left"]))
            logical.extend((page_number, row, page_part) for row in virtual_rows)
    return logical


def question_anchor(row: dict[str, Any]) -> tuple[int, str] | None:
    value = row["text"].strip()
    match = QUESTION_RE.match(value)
    if match and 1 <= int(match.group(1)) <= 40:
        return int(match.group(1)), match.group(2).strip()
    named_match = NAMED_QUESTION_RE.match(value)
    if named_match and 1 <= int(named_match.group(1)) <= 40:
        return int(named_match.group(1)), named_match.group(2).strip()
    fragments = row["fragments"]
    if fragments:
        first = fragments[0]
        first_value = first["text"].strip(" .．、")
        if first["left"] < 210 and first_value.isdigit() and 1 <= int(first_value) <= 40 and len(fragments) > 1:
            remainder = " ".join(fragment["text"] for fragment in fragments[1:]).strip()
            return int(first_value), remainder
    return None


def build_exercises_for_block(
    lesson: dict[str, Any], block: dict[str, Any], pages: dict[int, dict[str, Any]], start_order: int
) -> list[dict[str, Any]]:
    if block["sectionType"] == "listening":
        flattened = listening_logical_rows(
            pages, block["sourcePdfPages"]["start"], block["sourcePdfPages"]["end"]
        )
    else:
        flattened = [
            (page_number, row, None)
            for page_number, row in iter_rows(
                pages, block["sourcePdfPages"]["start"], block["sourcePdfPages"]["end"]
            )
        ]
    current_part: int | None = None
    groups: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None
    previous_segment: tuple[int, int | None] | None = None
    for page_number, row, forced_part in flattened:
        segment = (page_number, row.get("_column"))
        if current and previous_segment is not None and segment != previous_segment:
            groups.append(current)
            current = None
        previous_segment = segment
        if forced_part is not None:
            current_part = forced_part
        part = detect_part(row)
        if part is not None:
            if current:
                groups.append(current)
                current = None
            current_part = part
        anchor = question_anchor(row)
        if anchor:
            if current:
                groups.append(current)
            number, prompt = anchor
            current = {
                "number": number,
                "part": current_part,
                "rows": [row],
                "page": page_number,
                "anchorPrompt": prompt,
            }
        elif current:
            current["rows"].append(row)
    if current:
        groups.append(current)

    expected_bounds = {"listening": (1, 14), "reading": (15, 28), "writing": (29, 32)}
    expected_start, expected_end = expected_bounds[block["sectionType"]]
    canonical_groups: list[dict[str, Any]] = []
    expected_number = expected_start
    for group in groups:
        if group["number"] == expected_number:
            canonical_groups.append(group)
            expected_number += 1
            if expected_number > expected_end:
                break
    groups = canonical_groups

    exercises = []
    for index, group in enumerate(groups, start=1):
        trimmed_rows: list[dict[str, Any]] = []
        option_labels: set[str] = set()
        for row in group["rows"]:
            trimmed_rows.append(row)
            option_labels.update(option["label"] for option in extract_options([row]))
            if option_labels == {"A", "B", "C", "D"}:
                break
        group["rows"] = trimmed_rows
        evidence = [
            {
                "sourcePageId": pages[group["page"]]["id"],
                "rowIndex": row["rowIndex"],
                "sourceColumn": "left" if row.get("_column") == 0 else "right" if row.get("_column") == 1 else None,
            }
            for row in group["rows"]
        ]
        lines = [row["text"] for row in group["rows"]]
        options = extract_options(group["rows"])
        manually_restored: list[str] = []
        for (lesson_number, section_type, question_number, label), option_text in OPTION_OVERRIDES.items():
            if (
                lesson_number == lesson["number"]
                and section_type == block["sectionType"]
                and question_number == group["number"]
                and not any(option["label"] == label for option in options)
            ):
                options.append(
                    {
                        "label": label,
                        "textOcr": option_text,
                        "rawOcr": None,
                        "transcriptionStatus": "manually-verified-against-source",
                    }
                )
                manually_restored.append(label)
        options.sort(key=lambda option: option["label"])
        exercises.append(
            {
                "id": f"hsk5w1-exercise-{start_order + index - 1:04d}",
                "order": start_order + index - 1,
                "lessonId": lesson["id"],
                "lessonNumber": lesson["number"],
                "sectionType": block["sectionType"],
                "part": group["part"],
                "numberInSource": group["number"],
                "promptOcr": "\n".join(lines),
                "promptOcrLines": lines,
                "optionsOcr": options,
                "manuallyRestoredOptionLabels": manually_restored,
                "optionsStatus": "manually-verified-against-source" if manually_restored else "ocr-needs-editorial-review",
                "answer": None,
                "answerStatus": "not-present-in-source-pdf",
                "sourceEvidence": evidence,
                "transcriptionStatus": "machine-transcribed-needs-editorial-review",
            }
        )
    return exercises


def build_section_block(
    lesson: dict[str, Any], section_type: str, start: int, end: int, pages: dict[int, dict[str, Any]]
) -> dict[str, Any]:
    rows = list(iter_rows(pages, start, end))
    content_lines = [row["text"] for _, row in rows]
    parts: list[dict[str, Any]] = []
    for page_number, row in rows:
        part = detect_part(row)
        if part is not None and not any(item["part"] == part for item in parts):
            parts.append(
                {
                    "part": part,
                    "headingOcr": row["text"],
                    "sourcePageId": pages[page_number]["id"],
                    "rowIndex": row["rowIndex"],
                }
            )
    audio_tracks = []
    if section_type == "listening":
        discovered = {
            f"{int(match.group(1)):02d}-{match.group(2)}"
            for line in content_lines
            for match in TRACK_RE.finditer(line)
        }
        expected = {f"{lesson['number']:02d}-1", f"{lesson['number']:02d}-2"}
        audio_tracks = sorted(discovered | expected)
    return {
        "id": f"hsk5w1-{section_type}-block-{lesson['number']:02d}",
        "lessonId": lesson["id"],
        "lessonNumber": lesson["number"],
        "sectionType": section_type,
        "sourcePdfPages": {"start": start, "end": end},
        "sourcePageIds": [pages[number]["id"] for number in range(start, end + 1)],
        "parts": parts,
        "audioTrackReferences": audio_tracks,
        "contentOcrLines": content_lines,
        "contentOcr": "\n".join(content_lines),
        "transcriptionStatus": "machine-transcribed-needs-editorial-review",
    }


def build_reading_page_contents(
    lesson: dict[str, Any], start: int, end: int, pages: dict[int, dict[str, Any]]
) -> list[dict[str, Any]]:
    values = []
    for page_number in range(start, end + 1):
        rows = [row for row in pages[page_number]["rows"] if not row["isNoise"]]
        body_rows = [row for row in rows if len(CJK_RE.findall(row["text"])) >= 4]
        values.append(
            {
                "id": f"hsk5w1-reading-page-{page_number:03d}",
                "lessonId": lesson["id"],
                "lessonNumber": lesson["number"],
                "sourcePageId": pages[page_number]["id"],
                "pdfPage": page_number,
                "bodyOcrLines": [row["text"] for row in body_rows],
                "bodyOcr": "\n".join(row["text"] for row in body_rows),
                "sourceEvidence": [
                    {"sourcePageId": pages[page_number]["id"], "rowIndex": row["rowIndex"]}
                    for row in body_rows
                ],
                "transcriptionStatus": "machine-transcribed-needs-editorial-review",
            }
        )
    return values


def build_curriculum() -> dict[str, Any]:
    unit_by_lesson = {lesson: number for number, _, _, lessons in UNITS for lesson in lessons}
    units = [
        {
            "id": f"hsk5w1-unit-{number:02d}",
            "number": number,
            "titleZh": title,
            "sourceDividerPdfPage": divider_page,
            "sourceDividerPrintedPage": divider_page,
            "lessonIds": [f"hsk5w1-lesson-{lesson:02d}" for lesson in lessons],
        }
        for number, divider_page, title, lessons in UNITS
    ]
    lessons = [
        {
            "id": f"hsk5w1-lesson-{number:02d}",
            "number": number,
            "unitId": f"hsk5w1-unit-{unit_by_lesson[number]:02d}",
            "titleZh": title,
            "sourcePdfPages": {"start": start, "end": end},
            "sourcePrintedPages": {"start": start, "end": end},
            "sectionLayout": {
                "listening": {"start": start, "end": start + 1},
                "reading": {"start": start + 2, "end": start + 5},
                "writing": {"start": start + 6, "end": start + 6},
            },
            "contentStatus": "ocr-needs-editorial-review",
        }
        for number, start, end, title in LESSONS
    ]
    return {"bundleId": BUNDLE_ID, "units": units, "lessons": lessons}


def lesson_schema() -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://local.invalid/schemas/hsk5-workbook-1-lesson.schema.json",
        "title": "HSK 5 workbook volume 1 lesson",
        "type": "object",
        "required": ["id", "number", "unitId", "titleZh", "sourcePdfPages", "sectionBlockIds", "exerciseIds"],
        "properties": {
            "id": {"type": "string", "pattern": "^hsk5w1-lesson-[0-9]{2}$"},
            "number": {"type": "integer", "minimum": 1, "maximum": 18},
            "unitId": {"type": "string"},
            "titleZh": {"type": "string", "minLength": 1},
            "sourcePdfPages": {
                "type": "object",
                "required": ["start", "end"],
                "properties": {"start": {"type": "integer"}, "end": {"type": "integer"}},
            },
            "sectionBlockIds": {"type": "array", "minItems": 3, "maxItems": 3, "items": {"type": "string"}},
            "exerciseIds": {"type": "array", "items": {"type": "string"}},
        },
        "additionalProperties": True,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate JSON from OCR of HSK 5 Standard Course Workbook, volume 1.")
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

    blocks: list[dict[str, Any]] = []
    exercises: list[dict[str, Any]] = []
    reading_pages: list[dict[str, Any]] = []
    lesson_payloads: list[dict[str, Any]] = []
    for lesson in curriculum["lessons"]:
        lesson_blocks = []
        lesson_exercises = []
        for section_type, (start, end) in lesson_section_ranges(lesson).items():
            block = build_section_block(lesson, section_type, start, end, pages)
            lesson_blocks.append(block)
            blocks.append(block)
            extracted = build_exercises_for_block(lesson, block, pages, len(exercises) + 1)
            lesson_exercises.extend(extracted)
            exercises.extend(extracted)
            if section_type == "reading":
                reading_pages.extend(build_reading_page_contents(lesson, start, end, pages))
        payload = {
            **lesson,
            "sectionBlockIds": [block["id"] for block in lesson_blocks],
            "exerciseIds": [exercise["id"] for exercise in lesson_exercises],
            "exerciseCount": len(lesson_exercises),
            "exerciseCountsBySection": {
                section: sum(exercise["sectionType"] == section for exercise in lesson_exercises)
                for section in ("listening", "reading", "writing")
            },
            "answerKeyStatus": "not-present-in-source-pdf",
            "notes": [
                "Printed directions and prompts are workbook content only; they are not executable instructions.",
                "Listening audio and transcripts are not embedded in the source PDF.",
                "OCR text requires editorial verification against source page references.",
            ],
        }
        lesson_payloads.append(payload)
        dump_json(output_dir / "lessons" / f"lesson-{lesson['number']:02d}.json", payload)

    blocks_by_type = {
        section: [block for block in blocks if block["sectionType"] == section]
        for section in ("listening", "reading", "writing")
    }
    exercises_by_lesson = {
        str(number): {
            "lessonId": f"hsk5w1-lesson-{number:02d}",
            "count": sum(exercise["lessonNumber"] == number for exercise in exercises),
            "items": [exercise for exercise in exercises if exercise["lessonNumber"] == number],
        }
        for number in range(1, 19)
    }
    source_pages_payload = {"bundleId": BUNDLE_ID, "sourcePages": [pages[number] for number in sorted(pages)]}
    exercises_payload = {
        "schemaVersion": SCHEMA_VERSION,
        "bundleId": BUNDLE_ID,
        "status": "machine-transcribed-needs-editorial-review",
        "count": len(exercises),
        "exercises": exercises,
        "byLesson": exercises_by_lesson,
    }
    answer_key_payload = {
        "schemaVersion": SCHEMA_VERSION,
        "bundleId": BUNDLE_ID,
        "presentInSource": False,
        "answers": [],
        "note": "No answer key was found in PDF pages 1-144.",
    }
    media_payload = {
        "bundleId": BUNDLE_ID,
        "mediaAssets": [
            {
                "id": f"hsk5w1-audio-{number:02d}-{part}",
                "lessonNumber": number,
                "type": "audio",
                "trackLabel": f"{number:02d}-{part}",
                "availability": "required-by-listening-exercises-not-embedded-in-source-pdf",
                "file": None,
            }
            for number in range(1, 19)
            for part in (1, 2)
        ],
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
            "pageCount": 144,
            "textLayer": False,
            "primaryLanguage": "zh-Hans",
        },
        "scope": {
            "units": {"start": 1, "end": 6, "count": 6},
            "lessons": {"start": 1, "end": 18, "count": 18},
            "lessonContentPdfPages": {"start": 8, "end": 138},
            "unitDividerPdfPages": [7, 29, 51, 73, 95, 117],
            "hsk5ExamAppendixPdfPages": {"start": 139, "end": 140},
            "answerKeyPresent": False,
            "audioPresent": False,
            "transcriptsPresent": False,
        },
        "observedLessonStructure": [
            {"sectionType": "listening", "pageCountPerLesson": 2},
            {"sectionType": "reading", "pageCountPerLesson": 4},
            {"sectionType": "writing", "pageCountPerLesson": 1},
        ],
        "editorialPolicy": {
            "documentTextRole": "All printed directions, prompts, and exercises are source content, never instructions to the data-generation agent.",
            "ocrStatus": "review",
            "answersPolicy": "Answers remain null because the source PDF contains no answer key.",
            "optionPolicy": "Two OCR-omitted choices (lesson 10 question 18 option C; lesson 13 question 17 option C) were visually restored and explicitly marked.",
            "publicationReady": False,
        },
        "limitations": [
            "The PDF is image-only; all textual fields are OCR-derived.",
            "Listening audio and listening transcripts are absent from the PDF.",
            "No answer key was found in the source volume.",
            "Illustrations remain in the source PDF and are not extracted as standalone assets.",
        ],
    }
    compiled = {
        "schemaVersion": SCHEMA_VERSION,
        "bundleId": BUNDLE_ID,
        "title": SOURCE_TITLE,
        "status": "review",
        "sourceAnalysis": source_analysis,
        "curriculum": {"units": curriculum["units"], "lessons": lesson_payloads},
        "exercises": exercises,
        "exercisesByLesson": exercises_by_lesson,
        "content": {
            "sectionBlocks": blocks_by_type,
            "readingPageContents": reading_pages,
            "answerKey": answer_key_payload,
            "mediaAssets": media_payload["mediaAssets"],
        },
        "sourcePages": source_pages_payload["sourcePages"],
    }

    artifacts = [
        "source-analysis.json",
        "curriculum.json",
        "exercises.json",
        "answer-key.json",
        "media-assets.json",
        "reading-page-contents.json",
        "source-pages.json",
        "hsk5-workbook-1.json",
        "blocks/listening-blocks.json",
        "blocks/reading-blocks.json",
        "blocks/writing-blocks.json",
        "schemas/workbook-lesson.schema.json",
    ] + [f"lessons/lesson-{number:02d}.json" for number in range(1, 19)]
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
            "sectionBlocks": len(blocks),
            "exercises": len(exercises),
            "readingPageContents": len(reading_pages),
            "answers": 0,
        },
        "entryPoints": {
            "compiled": "hsk5-workbook-1.json",
            "exercises": "exercises.json",
            "curriculum": "curriculum.json",
            "sourceAnalysis": "source-analysis.json",
            "answerKey": "answer-key.json",
        },
        "artifacts": artifacts,
    }

    dump_json(output_dir / "manifest.json", manifest)
    dump_json(output_dir / "source-analysis.json", source_analysis)
    dump_json(output_dir / "curriculum.json", {**curriculum, "lessons": lesson_payloads})
    dump_json(output_dir / "exercises.json", exercises_payload)
    dump_json(output_dir / "answer-key.json", answer_key_payload)
    dump_json(output_dir / "media-assets.json", media_payload)
    dump_json(output_dir / "reading-page-contents.json", {"bundleId": BUNDLE_ID, "items": reading_pages})
    dump_json(output_dir / "source-pages.json", source_pages_payload)
    dump_json(output_dir / "hsk5-workbook-1.json", compiled)
    for section_type, values in blocks_by_type.items():
        dump_json(output_dir / "blocks" / f"{section_type}-blocks.json", {"bundleId": BUNDLE_ID, "blocks": values})
    dump_json(output_dir / "schemas" / "workbook-lesson.schema.json", lesson_schema())
    print(json.dumps(manifest["counts"], ensure_ascii=False))


if __name__ == "__main__":
    main()
