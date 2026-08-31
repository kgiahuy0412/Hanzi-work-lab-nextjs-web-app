from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path
from statistics import mean
from typing import Any

from pypinyin import Style, lazy_pinyin


SCHEMA_VERSION = "1.0.0"
BUNDLE_ID = "hsk6-standard-course-volume2-vi-v1"
PAGE_COUNT = 257
CJK_RE = re.compile(r"[\u3400-\u9fff]")
VOCAB_RE = re.compile(r"^[*＊]?\s*(\d{1,3})\s*[.．、]\s*(.*)$")
HANZI_HEAD_RE = re.compile(r"^([\u3400-\u9fff]+(?:[·—－-][\u3400-\u9fff]+)*)")


THEMES = [
    {"number": 6, "titleZh": "趣味世界", "titleVi": "Thế giới thú vị", "lessons": [21, 22, 23, 24]},
    {"number": 7, "titleZh": "经典阅读", "titleVi": "Đọc các tác phẩm kinh điển", "lessons": [25, 26, 27, 28]},
    {"number": 8, "titleZh": "人体探秘", "titleVi": "Khám phá bí mật cơ thể người", "lessons": [29, 30, 31, 32]},
    {"number": 9, "titleZh": "古今博览", "titleVi": "Tinh thông kim cổ", "lessons": [33, 34, 35, 36]},
    {"number": 10, "titleZh": "热点追踪", "titleVi": "Theo dấu các chủ đề nóng hổi", "lessons": [37, 38, 39, 40]},
]


LESSONS = [
    (21, 14, "未来商店", "Cửa hàng tương lai"),
    (22, 23, "2050年的汽车什么样？", "Xe hơi năm 2050 sẽ như thế nào?"),
    (23, 33, "大数据时代", "Thời đại dữ liệu lớn"),
    (24, 42, "体育明星们的离奇遭遇", "Cảnh ngộ ly kỳ của các ngôi sao thể thao"),
    (25, 52, "草船借箭", "Thuyền cỏ mượn tên"),
    (26, 62, "奇异的灯光", "Ánh sáng kỳ lạ"),
    (27, 71, "完璧归赵", "Trả ngọc nguyên vẹn cho nước Triệu"),
    (28, 81, "高山流水遇知音", "Cao sơn lưu thủy gặp tri âm"),
    (29, 92, "“笑”的备忘录", "Bản ghi nhớ việc cười"),
    (30, 103, "你睡好了吗？", "Bạn ngủ ngon không?"),
    (31, 112, "运动的学问", "Kiến thức tập thể dục"),
    (32, 122, "有时，不妨悲伤", "Đôi lúc cũng nên buồn"),
    (33, 134, "怀念慢生活", "Nhớ lúc sống chậm"),
    (34, 143, "为文物而生的人", "Một người dành cả cuộc đời cho các di vật văn hóa"),
    (35, 154, "走近木版年画", "Đến với tranh Tết mộc bản"),
    (36, 165, "中国古代书院", "Trường học Trung Quốc thời xưa"),
    (37, 176, "警察的故事", "Chuyện của cảnh sát"),
    (38, 187, "慧眼捕捉商机", "Tuệ nhãn nắm bắt thời cơ"),
    (39, 198, "互联网时代的生活", "Cuộc sống trong thời đại Internet"),
    (40, 208, "人类超能力会改变世界纪录吗？", "Siêu năng lực của con người có làm thay đổi kỷ lục thế giới?"),
]


CURRICULUM_FEATURES: dict[int, dict[str, Any]] = {
    21: {"integratedNotes": ["以免", "嫌"], "wordDistinction": "不免—未免", "discourseRhetoric": "篇章（1）：省略", "extension": "词汇：名词"},
    22: {"integratedNotes": ["动不动", "甲乙丙丁……"], "wordDistinction": "担保—保证", "discourseRhetoric": "篇章（2）：词汇衔接", "extension": "词汇：（1）反义词；（2）词语搭配"},
    23: {"integratedNotes": ["加以", "大大、远远"], "wordDistinction": "万分—十分", "discourseRhetoric": "修辞（1）：仿词", "extension": "词汇：近义词"},
    24: {"integratedNotes": ["紧缩句", "特意"], "wordDistinction": "特意—故意", "discourseRhetoric": "修辞（2）：比拟", "extension": "词汇：词语搭配"},
    25: {"integratedNotes": ["即将", "能A就A"], "wordDistinction": "大致—大体", "discourseRhetoric": "篇章（3）：替代", "extension": "词汇：词语的语素义"},
    26: {"integratedNotes": ["别说", "来来回回"], "wordDistinction": "挨—受", "discourseRhetoric": "修辞（3）：比喻", "extension": "词汇：（1）名词；（2）文学方面的词语"},
    27: {"integratedNotes": ["左……右……", "不成"], "wordDistinction": "一贯—一直", "discourseRhetoric": "修辞（4）：引用", "extension": "词汇：（1）反义词；（2）学业方面的词语"},
    28: {"integratedNotes": ["与“个”相关的格式", "向来"], "wordDistinction": "气势—气魄", "discourseRhetoric": "修辞（5）：婉曲", "extension": "词汇：（1）词语的语素义；（2）动物生活方面的词语"},
    29: {"integratedNotes": ["预先", "……也好，……也罢"], "wordDistinction": "诸—各", "discourseRhetoric": "修辞（6）：设问", "extension": "词汇：（1）近义词；（2）政治方面的词语"},
    30: {"integratedNotes": ["不时", "多多少少"], "wordDistinction": "容忍—忍受", "discourseRhetoric": "篇章（4）：连接", "extension": "词汇：名词"},
    31: {"integratedNotes": ["逐", "归根到底"], "wordDistinction": "胡乱—随便", "discourseRhetoric": "修辞（7）：大词小用", "extension": "词汇：词语的语素义"},
    32: {"integratedNotes": ["哪怕", "反之"], "wordDistinction": "许可—允许", "discourseRhetoric": "修辞（8）：排比", "extension": "词汇：词语搭配"},
    33: {"integratedNotes": ["A的A，B的B", "一时"], "wordDistinction": "现场—当场", "discourseRhetoric": "修辞（9）：借代", "extension": "词汇：词语的语素义"},
    34: {"integratedNotes": ["尚且", "当"], "wordDistinction": "温和—温柔", "discourseRhetoric": "篇章（5）：过渡", "extension": "词汇：表示人物身份的词语"},
    35: {"integratedNotes": ["终究", "愈……愈……"], "wordDistinction": "连年—连续", "discourseRhetoric": "篇章（6）：重复关键词，推进主题", "extension": "词汇：词语的语素义"},
    36: {"integratedNotes": ["一经", "本着+名词"], "wordDistinction": "截止—终止", "discourseRhetoric": "篇章（7）：论点+例证", "extension": "词汇：（1）词语搭配；（2）词语的语素义"},
    37: {"integratedNotes": ["为……起见", "暂且"], "wordDistinction": "恐惧—恐怖", "discourseRhetoric": "篇章（8）：照应", "extension": "词汇：词语的语素义"},
    38: {"integratedNotes": ["屡次", "依据"], "wordDistinction": "就近—附近", "discourseRhetoric": "修辞（10）：反复", "extension": "词汇：（1）医学方面的词语；（2）金融方面的词语"},
    39: {"integratedNotes": ["任意", "尚未"], "wordDistinction": "乐趣—兴趣", "discourseRhetoric": "修辞（11）：夸张", "extension": "词汇：（1）法律方面的词语；（2）政治方面的词语"},
    40: {"integratedNotes": ["（把）……放在眼里", "不无"], "wordDistinction": "顽强—坚强", "discourseRhetoric": "篇章（9）：先总说，再分说", "extension": "词汇：（1）军事方面的词语；（2）政治方面的词语"},
}


# Visual recoveries are used only when a numbered vocabulary row is missing
# from OCR. Each entry is transcribed directly from the cited source page.
VOCAB_RECOVERIES: dict[tuple[int, int], dict[str, Any]] = {
    (30, 6): {
        "hanzi": "当前",
        "partOfSpeechRaw": "dt.",
        "meaningViRaw": "hiện nay, trước mắt",
        "sourcePage": 104,
        "isBeyondHsk6Marked": False,
    },
}


VOCAB_MEANING_RECOVERIES: dict[tuple[int, int], str] = {
    (26, 24): "thiên đường",
    (27, 13): "vinh dự",
    (27, 44): "dõng dạc (nói)",
    (31, 50): "vitamin",
    (32, 9): "tấm gương, gương tốt",
    (32, 52): "lắng đọng, kết tủa",
    (34, 10): "biếu, tặng",
    (35, 15): "pháo",
    (35, 23): "yêu thích",
    (37, 1): "trang điểm",
    (37, 22): "cục cảnh sát",
    (40, 10): "tuyển thủ",
}


def dump_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def pinyin(text: str) -> str:
    result = " ".join(lazy_pinyin(text, style=Style.TONE, neutral_tone_with_five=False))
    result = re.sub(r"\s+([，。！？；：、,.!?;:）】”’])", r"\1", result)
    result = re.sub(r"([（【“‘])\s+", r"\1", result)
    return result.strip()


def bbox_metrics(box: list[list[float]]) -> tuple[float, float, float, float]:
    xs = [point[0] for point in box]
    ys = [point[1] for point in box]
    return min(xs), min(ys), max(xs), max(ys)


def normalize_lines(payload: dict[str, Any]) -> list[dict[str, Any]]:
    result = []
    for order, item in enumerate(payload.get("lines", [])):
        left, top, right, bottom = bbox_metrics(item["box"])
        result.append(
            {
                "text": item["text"].strip(),
                "confidence": round(float(item["confidence"]), 6),
                "box": item["box"],
                "left": left,
                "top": top,
                "right": right,
                "bottom": bottom,
                "order": order,
            }
        )
    return sorted(result, key=lambda line: (line["top"], line["left"]))


def load_ocr(ocr_dir: Path) -> dict[int, list[dict[str, Any]]]:
    pages: dict[int, list[dict[str, Any]]] = {}
    missing = []
    for page in range(1, PAGE_COUNT + 1):
        path = ocr_dir / f"page-{page:03d}.json"
        if not path.exists():
            missing.append(page)
            continue
        payload = json.loads(path.read_text(encoding="utf-8"))
        pages[page] = normalize_lines(payload)
    if missing:
        raise FileNotFoundError(f"Missing OCR pages ({len(missing)}): {missing[:20]}")
    return pages


def page_ref(page: int) -> str:
    return f"hsk6-v2-source-page-{page:03d}"


def lesson_ref(number: int) -> str:
    return f"hsk6-v2-lesson-{number:02d}"


def is_noise(line: dict[str, Any]) -> bool:
    text = line["text"].strip()
    if not text:
        return True
    if text.startswith("Scanned by") or "nhantriviet.com" in text.lower():
        return True
    if line["top"] > 1370 and re.fullmatch(r"\d{1,3}", text):
        return True
    if text in {"HSK", "标准教程6（下）", "标准教程6(下)"}:
        return True
    return False


def raw_text(lines: list[dict[str, Any]], *, clean: bool = False) -> str:
    selected = [line["text"] for line in lines if not clean or not is_noise(line)]
    return "\n".join(value for value in selected if value).strip()


def lesson_range(index: int) -> tuple[int, int]:
    start = LESSONS[index][1]
    end = LESSONS[index + 1][1] - 1 if index + 1 < len(LESSONS) else 218
    return start, end


def theme_for_lesson(number: int) -> dict[str, Any]:
    return next(theme for theme in THEMES if number in theme["lessons"])


def classification_for_page(page: int) -> dict[str, Any]:
    if page <= 2:
        return {"kind": "cover"}
    if 3 <= page <= 7:
        return {"kind": "front-matter"}
    if 8 <= page <= 11:
        return {"kind": "table-of-contents"}
    if 12 <= page <= 13:
        return {"kind": "front-matter"}
    for index, lesson in enumerate(LESSONS):
        start, end = lesson_range(index)
        if start <= page <= end:
            return {"kind": "lesson", "lessonNumber": lesson[0]}
    return {"kind": "appendix", "appendix": "词语总表"}


def flatten_lesson_entries(
    page_lines: dict[int, list[dict[str, Any]]], start: int, end: int
) -> list[dict[str, Any]]:
    result = []
    for page in range(start, end + 1):
        for line in page_lines[page]:
            result.append({**line, "page": page})
    return result


def find_first(entries: list[dict[str, Any]], predicate: Any, start_index: int = 0) -> int | None:
    for index in range(start_index, len(entries)):
        if predicate(entries[index]):
            return index
    return None


def merge_article_lines(entries: list[dict[str, Any]]) -> list[dict[str, Any]]:
    merged: list[dict[str, Any]] = []
    for entry in entries:
        if merged and entry["page"] == merged[-1]["page"] and abs(entry["top"] - merged[-1]["top"]) <= 7:
            if entry["left"] > merged[-1]["left"]:
                merged[-1]["text"] += entry["text"]
                merged[-1]["right"] = max(merged[-1]["right"], entry["right"])
                merged[-1]["confidenceValues"].append(entry["confidence"])
                continue
        merged.append(
            {
                "page": entry["page"],
                "left": entry["left"],
                "top": entry["top"],
                "right": entry["right"],
                "text": entry["text"],
                "confidenceValues": [entry["confidence"]],
            }
        )
    return merged


def extract_article(
    number: int,
    title_zh: str,
    start: int,
    end: int,
    page_lines: dict[int, list[dict[str, Any]]],
) -> dict[str, Any]:
    entries = flatten_lesson_entries(page_lines, start, end)
    marker = find_first(entries, lambda line: "课文" in line["text"] and line["left"] < 350)
    if marker is None:
        marker = find_first(entries, lambda line: re.search(rf"(?<!\d){number}\s*[-–]\s*1(?!\d)", line["text"]) is not None)
    if marker is None:
        marker = 0
    stop = find_first(
        entries,
        lambda line: any(token in line["text"] for token in ("综合注释", "词语辨析", "篇章修辞"))
        or re.sub(r"\s+", "", line["text"]) == "练习",
        marker + 1,
    )
    if stop is None:
        stop = len(entries)
    marker_page = entries[marker]["page"]
    marker_top = entries[marker]["top"]
    candidates = []
    excluded = ("课文", "生词", "热身", "Bài học", "Phần", "khởi động")
    for entry in entries[marker + 1 : stop]:
        text = entry["text"].strip()
        if entry["left"] < 140 or entry["left"] >= 570:
            continue
        if entry["page"] == marker_page and entry["top"] <= marker_top:
            continue
        if is_noise(entry) or not CJK_RE.search(text):
            continue
        if any(token in text for token in excluded):
            continue
        if text == title_zh or re.fullmatch(r"\d{1,3}", text):
            continue
        candidates.append(entry)
    lines = merge_article_lines(candidates)
    dialogue_mode = any(
        re.match(r"^[\u3400-\u9fff]{1,8}\s*[：:]", line["text"]) is not None
        for line in lines[:30]
    )
    paragraphs: list[dict[str, Any]] = []
    for line in lines:
        text = line["text"].strip()
        if dialogue_mode:
            starts_paragraph = not paragraphs or re.match(r"^[\u3400-\u9fff]{1,8}\s*[：:]", text) is not None
        else:
            starts_paragraph = not paragraphs or line["left"] >= 225
        if starts_paragraph:
            paragraphs.append(
                {
                    "textZh": text,
                    "sourcePageRefs": [page_ref(line["page"])],
                    "confidenceValues": list(line["confidenceValues"]),
                }
            )
        else:
            paragraphs[-1]["textZh"] += text
            if page_ref(line["page"]) not in paragraphs[-1]["sourcePageRefs"]:
                paragraphs[-1]["sourcePageRefs"].append(page_ref(line["page"]))
            paragraphs[-1]["confidenceValues"].extend(line["confidenceValues"])
    article_pages = []
    finalized = []
    for paragraph in paragraphs:
        if len(re.findall(r"[\u3400-\u9fff]", paragraph["textZh"])) < 3:
            continue
        for ref in paragraph["sourcePageRefs"]:
            if ref not in article_pages:
                article_pages.append(ref)
        finalized.append(
            {
                "textZh": paragraph["textZh"],
                "pinyinGenerated": pinyin(paragraph["textZh"]),
                "sourcePageRefs": paragraph["sourcePageRefs"],
                "ocrConfidenceMean": round(mean(paragraph["confidenceValues"]), 6),
            }
        )
    char_count_printed = None
    for entry in entries[: min(stop, marker + 25)]:
        match = re.search(r"[（(]\s*(\d{2,4})\s*字\s*[）)]", entry["text"])
        if match:
            char_count_printed = int(match.group(1))
            break
    text_zh = "\n\n".join(paragraph["textZh"] for paragraph in finalized)
    return {
        "id": f"hsk6-v2-l{number:02d}-article",
        "lessonRef": lesson_ref(number),
        "titleZh": title_zh,
        "titlePinyin": pinyin(title_zh),
        "printedCharacterCount": char_count_printed,
        "textZh": text_zh,
        "paragraphs": finalized,
        "translationVi": None,
        "translationStatus": "not-present-in-source",
        "sourcePageRefs": article_pages,
        "extractionStatus": "ocr-review-required",
    }


def parse_pinyin_fragment(fragments: list[dict[str, Any]]) -> str | None:
    accented = "āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü"
    pattern = re.compile(rf"[A-Za-z{accented}{accented.upper()}']{{2,}}(?:[- ][A-Za-z{accented}{accented.upper()}']+){{0,5}}")
    for fragment in fragments:
        if not 660 <= fragment["left"] < 805:
            continue
        match = pattern.search(fragment["text"])
        if match:
            return match.group(0).strip()
    return None


def extract_vocabulary(
    number: int,
    start: int,
    end: int,
    page_lines: dict[int, list[dict[str, Any]]],
) -> list[dict[str, Any]]:
    notes_location: tuple[int, float] | None = None
    for page in range(start, end + 1):
        for line in page_lines[page]:
            if any(token in line["text"] for token in ("综合注释", "词语辨析", "篇章修辞")):
                notes_location = (page, line["top"])
                break
        if notes_location:
            break
    found: dict[int, dict[str, Any]] = {}
    for page in range(start, end + 1):
        if notes_location and page > notes_location[0]:
            break
        lines = page_lines[page]
        anchors = []
        for line in lines:
            if line["left"] < 560:
                continue
            if notes_location and page == notes_location[0] and line["top"] >= notes_location[1]:
                continue
            match = VOCAB_RE.match(line["text"])
            if not match:
                continue
            head_match = HANZI_HEAD_RE.match(match.group(2).strip())
            if not head_match:
                continue
            anchors.append((line, int(match.group(1)), head_match.group(1)))
        anchors.sort(key=lambda item: item[0]["top"])
        for index, (anchor, source_number, hanzi) in enumerate(anchors):
            next_top = anchors[index + 1][0]["top"] if index + 1 < len(anchors) else 1370
            fragments = []
            for candidate in lines:
                if candidate is anchor:
                    continue
                if candidate["top"] < anchor["top"] - 5 or candidate["top"] >= next_top - 3:
                    continue
                if candidate["left"] < anchor["left"] + 55:
                    continue
                if is_noise(candidate):
                    continue
                fragments.append(candidate)
            fragments.sort(key=lambda item: (item["top"], item["left"]))
            part_of_speech_fragments = [
                item["text"]
                for item in fragments
                if 775 <= item["left"] < 835 and len(item["text"].strip()) <= 16
            ]
            meaning_fragments = [item["text"] for item in fragments if item["left"] >= 820]
            meaning_raw = " ".join(meaning_fragments).strip() or " ".join(item["text"] for item in fragments).strip()
            item = {
                "id": f"hsk6-v2-l{number:02d}-v{source_number:03d}",
                "lessonRef": lesson_ref(number),
                "sourceNumber": source_number,
                "hanzi": hanzi,
                "pinyin": pinyin(hanzi),
                "pinyinOcr": parse_pinyin_fragment(fragments),
                "partOfSpeechRaw": " ".join(part_of_speech_fragments).strip() or None,
                "meaningViRaw": meaning_raw or None,
                "isBeyondHsk6Marked": anchor["text"].lstrip().startswith(("*", "＊")),
                "sourcePageRef": page_ref(page),
                "sourceBox": anchor["box"],
                "ocrConfidence": anchor["confidence"],
                "ocrFragments": [fragment["text"] for fragment in fragments],
                "status": "review",
            }
            current = found.get(source_number)
            if current is None or item["ocrConfidence"] > current["ocrConfidence"]:
                found[source_number] = item
    for (lesson_number, source_number), recovery in VOCAB_RECOVERIES.items():
        if lesson_number != number or source_number in found:
            continue
        hanzi = recovery["hanzi"]
        found[source_number] = {
            "id": f"hsk6-v2-l{number:02d}-v{source_number:03d}",
            "lessonRef": lesson_ref(number),
            "sourceNumber": source_number,
            "hanzi": hanzi,
            "pinyin": pinyin(hanzi),
            "pinyinOcr": None,
            "partOfSpeechRaw": recovery.get("partOfSpeechRaw"),
            "meaningViRaw": recovery.get("meaningViRaw"),
            "isBeyondHsk6Marked": recovery.get("isBeyondHsk6Marked", False),
            "sourcePageRef": page_ref(recovery["sourcePage"]),
            "sourceBox": None,
            "ocrConfidence": None,
            "ocrFragments": [],
            "status": "manual-visual-recovery",
        }
    for (lesson_number, source_number), recovered_meaning in VOCAB_MEANING_RECOVERIES.items():
        if lesson_number != number or source_number not in found:
            continue
        if not found[source_number].get("meaningViRaw"):
            found[source_number]["meaningViRaw"] = recovered_meaning
            found[source_number]["meaningRecoverySource"] = "printed-vocabulary-index"
    return [found[key] for key in sorted(found)]


def marker_type(text: str) -> str | None:
    value = re.sub(r"\s+", "", text)
    latin_value = value.lower().replace("à", "a").replace("ậ", "a").replace("ệ", "e")
    if "热身" in value:
        return "warmup"
    if value.startswith("课文"):
        return "text"
    if "综合注释" in value:
        return "integrated-notes"
    if "词语辨析" in value:
        return "word-distinction"
    if "篇章修辞" in value or value in {"修辞", "篇章"}:
        return "discourse-rhetoric"
    if value == "练习" or "baitap" in latin_value or "luyentap" in latin_value:
        return "practice"
    if value == "扩展" or value.startswith("扩展"):
        return "extension"
    return None


def extract_section_blocks(
    number: int,
    start: int,
    end: int,
    page_lines: dict[int, list[dict[str, Any]]],
) -> list[dict[str, Any]]:
    entries = flatten_lesson_entries(page_lines, start, end)
    marker_indexes: dict[str, int] = {}
    for index, entry in enumerate(entries):
        kind = marker_type(entry["text"])
        if kind and kind not in marker_indexes:
            marker_indexes[kind] = index
    order = ["warmup", "text", "integrated-notes", "word-distinction", "discourse-rhetoric", "practice", "extension"]
    existing = [(kind, marker_indexes[kind]) for kind in order if kind in marker_indexes]
    existing.sort(key=lambda item: item[1])
    blocks = []
    for pos, (kind, marker_index) in enumerate(existing):
        if kind == "text":
            continue
        next_index = existing[pos + 1][1] if pos + 1 < len(existing) else len(entries)
        selected = [entry for entry in entries[marker_index:next_index] if not is_noise(entry)]
        source_refs = []
        for entry in selected:
            ref = page_ref(entry["page"])
            if ref not in source_refs:
                source_refs.append(ref)
        confidences = [entry["confidence"] for entry in selected]
        blocks.append(
            {
                "id": f"hsk6-v2-l{number:02d}-{kind}",
                "lessonRef": lesson_ref(number),
                "type": kind,
                "textRaw": "\n".join(entry["text"] for entry in selected).strip(),
                "sourcePageRefs": source_refs,
                "ocrConfidenceMean": round(mean(confidences), 6) if confidences else None,
                "status": "review",
            }
        )
    return blocks


def build_language_points(number: int) -> list[dict[str, Any]]:
    features = CURRICULUM_FEATURES[number]
    points = []
    sequence = 1
    for title in features["integratedNotes"]:
        points.append(
            {
                "id": f"hsk6-v2-l{number:02d}-lp-{sequence:02d}",
                "lessonRef": lesson_ref(number),
                "category": "integrated-note",
                "titleZh": title,
                "pinyinGenerated": pinyin(title),
                "source": "printed-table-of-contents",
            }
        )
        sequence += 1
    for category, title in (
        ("word-distinction", features["wordDistinction"]),
        ("discourse-rhetoric", features["discourseRhetoric"]),
        ("extension", features["extension"]),
    ):
        points.append(
            {
                "id": f"hsk6-v2-l{number:02d}-lp-{sequence:02d}",
                "lessonRef": lesson_ref(number),
                "category": category,
                "titleZh": title,
                "pinyinGenerated": pinyin(title),
                "source": "printed-table-of-contents",
            }
        )
        sequence += 1
    return points


def build_schema() -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "hsk6-volume2-textbook-lesson.schema.json",
        "title": "HSK 6 Standard Course Volume 2 lesson",
        "type": "object",
        "required": ["schemaVersion", "id", "lessonNumber", "title", "source", "sections", "editorial"],
        "properties": {
            "schemaVersion": {"type": "string"},
            "id": {"type": "string"},
            "lessonNumber": {"type": "integer", "minimum": 21, "maximum": 40},
            "status": {"enum": ["review", "ready"]},
            "title": {
                "type": "object",
                "required": ["zh", "pinyin", "vi"],
                "properties": {"zh": {"type": "string"}, "pinyin": {"type": "string"}, "vi": {"type": "string"}},
            },
            "themeRef": {"type": "string"},
            "source": {"type": "object"},
            "sections": {"type": "array", "items": {"type": "object"}},
            "editorial": {"type": "object"},
        },
    }


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        while chunk := stream.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate structured JSON from HSK 6 Standard Course Volume 2 OCR.")
    parser.add_argument("--ocr-dir", type=Path, required=True)
    parser.add_argument("--source-pdf", type=Path, required=True)
    parser.add_argument("--original-source-path", default="")
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()

    page_lines = load_ocr(args.ocr_dir)
    output_dir = args.output_dir
    schema = build_schema()

    source_pages = []
    for page in range(1, PAGE_COUNT + 1):
        lines = page_lines[page]
        source_pages.append(
            {
                "id": page_ref(page),
                "pdfPage": page,
                "printedPage": page if page >= 3 else None,
                "classification": classification_for_page(page),
                "ocrStatus": "complete",
                "ocrConfidenceMean": round(mean([line["confidence"] for line in lines]), 6) if lines else None,
                "rawText": raw_text(lines),
                "lines": [
                    {"text": line["text"], "confidence": line["confidence"], "box": line["box"]}
                    for line in lines
                ],
            }
        )

    articles = []
    lexemes = []
    language_points = []
    section_blocks = []
    media_assets = []
    lesson_documents = []
    lesson_quality = []

    for index, (number, start, title_zh, title_vi) in enumerate(LESSONS):
        _, end = lesson_range(index)
        article = extract_article(number, title_zh, start, end, page_lines)
        lesson_lexemes = extract_vocabulary(number, start, end, page_lines)
        lesson_points = build_language_points(number)
        lesson_blocks = extract_section_blocks(number, start, end, page_lines)
        articles.append(article)
        lexemes.extend(lesson_lexemes)
        language_points.extend(lesson_points)
        section_blocks.extend(lesson_blocks)
        detected_numbers = [item["sourceNumber"] for item in lesson_lexemes]
        expected_span = list(range(1, max(detected_numbers) + 1)) if detected_numbers else []
        missing_numbers = sorted(set(expected_span) - set(detected_numbers))
        article_cjk_count = len(re.findall(r"[\u3400-\u9fff]", article["textZh"]))
        quality_warnings = []
        if missing_numbers:
            quality_warnings.append(f"Thiếu số thứ tự từ mới: {missing_numbers}")
        if article["printedCharacterCount"] and abs(article_cjk_count - article["printedCharacterCount"]) > 120:
            quality_warnings.append("Chênh lệch lớn giữa số chữ OCR và số chữ in trong sách.")
        lesson_quality.append(
            {
                "lessonNumber": number,
                "articleCharactersOcr": article_cjk_count,
                "articleCharactersPrinted": article["printedCharacterCount"],
                "articleParagraphs": len(article["paragraphs"]),
                "vocabularyDetected": len(lesson_lexemes),
                "vocabularyNumberRange": [min(detected_numbers), max(detected_numbers)] if detected_numbers else None,
                "missingVocabularyNumbers": missing_numbers,
                "vocabularyWithoutVietnameseMeaning": sum(not item["meaningViRaw"] for item in lesson_lexemes),
                "sectionTypesDetected": [item["type"] for item in lesson_blocks],
                "warnings": quality_warnings,
            }
        )
        for suffix, kind in ((1, "article-audio"), (2, "vocabulary-audio")):
            media_assets.append(
                {
                    "id": f"hsk6-v2-track-{number:02d}-{suffix}",
                    "lessonRef": lesson_ref(number),
                    "trackCode": f"{number:02d}-{suffix}",
                    "kind": kind,
                    "availability": "placeholder-only",
                    "note": "Audio được nhắc trong sách nhưng không được nhúng trong PDF nguồn.",
                }
            )
        theme = theme_for_lesson(number)
        block_refs_by_type: dict[str, list[str]] = {}
        for block in lesson_blocks:
            block_refs_by_type.setdefault(block["type"], []).append(block["id"])
        sections = [
            {"type": "warmup", "contentRefs": block_refs_by_type.get("warmup", [])},
            {"type": "article", "contentRefs": [article["id"]]},
            {"type": "vocabulary", "contentRefs": [item["id"] for item in lesson_lexemes]},
            {"type": "integrated-notes", "contentRefs": block_refs_by_type.get("integrated-notes", []), "languagePointRefs": [item["id"] for item in lesson_points if item["category"] == "integrated-note"]},
            {"type": "word-distinction", "contentRefs": block_refs_by_type.get("word-distinction", []), "languagePointRefs": [item["id"] for item in lesson_points if item["category"] == "word-distinction"]},
            {"type": "discourse-rhetoric", "contentRefs": block_refs_by_type.get("discourse-rhetoric", []), "languagePointRefs": [item["id"] for item in lesson_points if item["category"] == "discourse-rhetoric"]},
            {"type": "practice", "contentRefs": block_refs_by_type.get("practice", [])},
            {"type": "extension", "contentRefs": block_refs_by_type.get("extension", []), "languagePointRefs": [item["id"] for item in lesson_points if item["category"] == "extension"]},
        ]
        lesson_document = {
            "$schema": "../schemas/textbook-lesson.schema.json",
            "schemaVersion": SCHEMA_VERSION,
            "id": lesson_ref(number),
            "lessonNumber": number,
            "status": "review",
            "title": {"zh": title_zh, "pinyin": pinyin(title_zh), "vi": title_vi},
            "themeRef": f"hsk6-v2-theme-{theme['number']:02d}",
            "source": {
                "pdfPages": [start, end],
                "printedPages": [start, end],
                "sourcePageRefs": [page_ref(page) for page in range(start, end + 1)],
            },
            "sections": sections,
            "editorial": {
                "publicationReady": False,
                "articleOcrStatus": "review",
                "vocabularyOcrStatus": "review",
                "answerStatus": "not-structured",
                "requiredActions": [
                    "Đối chiếu OCR bài khóa và nghĩa tiếng Việt với PDF.",
                    "Rà lại số thứ tự từ mới bị OCR bỏ sót.",
                    "Bổ sung các file MP3 theo mã track nếu có quyền sử dụng.",
                ],
            },
        }
        lesson_documents.append(lesson_document)

    theme_documents = [
        {
            "id": f"hsk6-v2-theme-{theme['number']:02d}",
            "themeNumber": theme["number"],
            "titleZh": theme["titleZh"],
            "titleVi": theme["titleVi"],
            "lessonRefs": [lesson_ref(number) for number in theme["lessons"]],
        }
        for theme in THEMES
    ]

    appendix = {
        "id": "hsk6-v2-appendix-vocabulary-index",
        "titleZh": "词语总表",
        "titleVi": "Bảng tổng hợp từ vựng",
        "sourcePdfPages": [219, 257],
        "sourcePageRefs": [page_ref(page) for page in range(219, 258)],
        "rawText": "\n\n".join(raw_text(page_lines[page], clean=True) for page in range(219, 258)),
        "status": "ocr-raw-review",
    }

    source_analysis = {
        "schemaVersion": SCHEMA_VERSION,
        "source": {
            "fileName": args.source_pdf.name,
            "originalPath": args.original_source_path or None,
            "workingCopyPath": str(args.source_pdf.resolve()),
            "sha256": sha256(args.source_pdf),
            "pageCount": PAGE_COUNT,
            "pageSize": "approximately 572.6 x 807.9 pt",
            "textLayer": False,
            "scanDevice": "RICOH Aficio MP 9002",
        },
        "analysis": {
            "book": "Giáo trình chuẩn HSK 6 - Tập 2",
            "lessonNumbers": [21, 40],
            "lessonCount": 20,
            "themeNumbers": [6, 10],
            "themeCount": 5,
            "lessonPages": [14, 218],
            "vocabularyAppendixPages": [219, 257],
            "printedPageMatchesPdfPage": True,
        },
        "method": {
            "renderer": "Poppler pdftoppm at 130 DPI",
            "ocr": "RapidOCR ONNX Runtime",
            "pinyin": "generated with pypinyin from OCR/canonical Chinese text",
            "titlesAndCurriculum": "manually transcribed from printed table of contents, pages 8-11",
        },
        "limitations": [
            "PDF là ảnh scan nên toàn bộ bài khóa và nghĩa tiếng Việt cần được biên tập viên rà lại.",
            "Pinyin tạo tự động có thể sai với từ đa âm.",
            "Nghĩa tiếng Việt giữ dạng OCR thô và có thể có lỗi dấu hoặc xuống dòng.",
            "Audio chỉ được tạo placeholder vì file MP3 không nằm trong PDF.",
        ],
    }

    curriculum = {
        "schemaVersion": SCHEMA_VERSION,
        "themes": theme_documents,
        "lessons": [
            {
                "lessonRef": lesson_ref(number),
                "number": number,
                "titleZh": title_zh,
                "titleVi": title_vi,
                "startPage": start,
                "endPage": lesson_range(index)[1],
                **CURRICULUM_FEATURES[number],
            }
            for index, (number, start, title_zh, title_vi) in enumerate(LESSONS)
        ],
    }

    counts = {
        "themes": len(theme_documents),
        "lessons": len(lesson_documents),
        "articles": len(articles),
        "articleParagraphs": sum(len(item["paragraphs"]) for item in articles),
        "lexemes": len(lexemes),
        "languagePoints": len(language_points),
        "sectionBlocks": len(section_blocks),
        "mediaPlaceholders": len(media_assets),
        "ocrSourcePages": len(source_pages),
        "appendixPages": 39,
    }

    quality_report = {
        "schemaVersion": SCHEMA_VERSION,
        "status": "review",
        "summary": {
            "lessonsChecked": len(lesson_quality),
            "lessonsWithVocabularyNumberGaps": sum(bool(item["missingVocabularyNumbers"]) for item in lesson_quality),
            "lessonsWithWarnings": sum(bool(item["warnings"]) for item in lesson_quality),
            "lexemesWithoutVietnameseMeaning": sum(not item["meaningViRaw"] for item in lexemes),
        },
        "lessons": lesson_quality,
    }

    files = [
        {"path": "schemas/textbook-lesson.schema.json", "kind": "schema"},
        {"path": "source-analysis.json", "kind": "source-analysis"},
        {"path": "curriculum.json", "kind": "curriculum"},
        {"path": "quality-report.json", "kind": "quality-report"},
        {"path": "hsk6-volume2-textbook.json", "kind": "combined-export"},
        {"path": "shared/source-pages.json", "kind": "ocr-evidence"},
        {"path": "shared/articles.json", "kind": "shared-content", "entity": "article"},
        {"path": "shared/lexemes.json", "kind": "shared-content", "entity": "lexeme"},
        {"path": "shared/language-points.json", "kind": "shared-content", "entity": "language-point"},
        {"path": "shared/section-blocks.json", "kind": "shared-content", "entity": "section-block"},
        {"path": "shared/media-assets.json", "kind": "shared-content", "entity": "media"},
        {"path": "appendices/vocabulary-index.json", "kind": "appendix"},
    ]
    files.extend(
        {"path": f"lessons/lesson-{lesson['lessonNumber']:02d}.json", "kind": "lesson", "lessonNumber": lesson["lessonNumber"]}
        for lesson in lesson_documents
    )
    manifest = {
        "schemaVersion": SCHEMA_VERSION,
        "bundleId": BUNDLE_ID,
        "title": "Bộ dữ liệu JSON từ Giáo trình chuẩn HSK 6 - Tập 2",
        "description": "Dữ liệu 20 bài (21-40), bài khóa, từ mới, các điểm chú thích/ngôn ngữ, bài tập, mở rộng, media placeholder và bằng chứng OCR theo trang.",
        "locale": {"interface": "vi-VN", "learning": "zh-CN", "pinyinSystem": "hanyu-pinyin-diacritic"},
        "status": "review",
        "sourceRef": "source-analysis.json",
        "curriculumRef": "curriculum.json",
        "files": files,
        "counts": counts,
    }

    combined = {
        "schemaVersion": SCHEMA_VERSION,
        "manifest": manifest,
        "sourceAnalysis": source_analysis,
        "curriculum": curriculum,
        "qualityReport": quality_report,
        "lessons": lesson_documents,
        "articles": articles,
        "lexemes": lexemes,
        "languagePoints": language_points,
        "sectionBlocks": section_blocks,
        "mediaAssets": media_assets,
        "appendices": [appendix],
        "sourcePages": source_pages,
    }

    dump_json(output_dir / "schemas" / "textbook-lesson.schema.json", schema)
    dump_json(output_dir / "manifest.json", manifest)
    dump_json(output_dir / "source-analysis.json", source_analysis)
    dump_json(output_dir / "curriculum.json", curriculum)
    dump_json(output_dir / "quality-report.json", quality_report)
    dump_json(output_dir / "shared" / "source-pages.json", source_pages)
    dump_json(output_dir / "shared" / "articles.json", articles)
    dump_json(output_dir / "shared" / "lexemes.json", lexemes)
    dump_json(output_dir / "shared" / "language-points.json", language_points)
    dump_json(output_dir / "shared" / "section-blocks.json", section_blocks)
    dump_json(output_dir / "shared" / "media-assets.json", media_assets)
    dump_json(output_dir / "appendices" / "vocabulary-index.json", appendix)
    for lesson in lesson_documents:
        dump_json(output_dir / "lessons" / f"lesson-{lesson['lessonNumber']:02d}.json", lesson)
    dump_json(output_dir / "hsk6-volume2-textbook.json", combined)
    print(json.dumps(counts, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
