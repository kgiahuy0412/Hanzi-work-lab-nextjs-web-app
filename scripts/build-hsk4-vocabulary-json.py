from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any


CJK_RE = re.compile(r"[\u3400-\u9fff]+")
LESSON_AT_END_RE = re.compile(r"\s+(1[1-9]|20)\s*$")
PART_OF_SPEECH_RE = re.compile(
    r"(?i)(?<![a-z])"
    r"(dgt|dt|tt|t|pho|ph6|gioi|lien|trq|luong|lugng|sl|dtnn|ct|tto|hto)"
    r"\s*[.,](?=\s)"
)


def load(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def appendix_rows(pages: list[dict[str, Any]]) -> dict[tuple[str, int], dict[str, Any]]:
    result: dict[tuple[str, int], dict[str, Any]] = {}
    for page in pages:
        if not 149 <= page["pdfPage"] <= 158:
            continue
        for row in page["rows"]:
            if row["isNoise"]:
                continue
            text = row["text"].strip()
            hanzi_match = CJK_RE.search(text)
            lesson_match = LESSON_AT_END_RE.search(text)
            if not hanzi_match or not lesson_match:
                continue
            result[(hanzi_match.group(), int(lesson_match.group(1)))] = {
                "text": text,
                "sourcePageRef": page["id"],
                "sourceRowIndex": row["rowIndex"],
            }
    return result


def split_ocr_gloss(raw: str | None, hanzi: str) -> tuple[str | None, str | None]:
    if not raw:
        return None, None
    core = raw.strip()
    if hanzi in core:
        core = core.split(hanzi, 1)[1]
    core = LESSON_AT_END_RE.sub("", core).strip()
    match = PART_OF_SPEECH_RE.search(core)
    if not match:
        return None, None
    part_of_speech = match.group(1)
    meaning = core[match.end() :].strip(" ,.;:-") or None
    return part_of_speech, meaning


def main() -> None:
    parser = argparse.ArgumentParser(description="Build a discoverable HSK 4 vocabulary JSON file.")
    parser.add_argument(
        "bundle",
        type=Path,
        nargs="?",
        default=Path("content/hsk4-lower-textbook-json"),
    )
    args = parser.parse_args()

    root = args.bundle
    lexemes = load(root / "shared" / "lexemes.json")["lexemes"]
    pages = load(root / "shared" / "source-pages.json")["pages"]
    curriculum = load(root / "curriculum.json")
    appendix_by_word = appendix_rows(pages)

    vocabulary = []
    for lexeme in lexemes:
        lesson_number = int(lexeme["lessonRef"].rsplit("-", 1)[1])
        appendix = appendix_by_word.get((lexeme["hanzi"], lesson_number))
        raw_gloss = appendix["text"] if appendix else lexeme.get("sourceTextOcrRaw")
        part_of_speech, meaning = split_ocr_gloss(raw_gloss, lexeme["hanzi"])
        vocabulary.append(
            {
                "id": lexeme["id"],
                "lessonNumber": lesson_number,
                "number": lexeme["sourceNumber"],
                "hanzi": lexeme["hanzi"],
                "pinyin": lexeme["pinyin"],
                "partOfSpeechOcrRaw": part_of_speech,
                "meaningViOcrRaw": meaning,
                "sourceGlossOcrRaw": raw_gloss,
                "isBeyondHsk4Marked": lexeme["isBeyondHsk4Marked"],
                "source": {
                    "lessonPageRef": lexeme["sourcePageRef"],
                    "lessonRowIndexes": lexeme["sourceRowIndexes"],
                    "appendixPageRef": appendix["sourcePageRef"] if appendix else None,
                    "appendixRowIndex": appendix["sourceRowIndex"] if appendix else None,
                },
                "status": "ocr-needs-editorial-review",
            }
        )

    lesson_title_by_number = {
        lesson["lessonNumber"]: {"zh": lesson["titleZh"], "vi": lesson["titleVi"]}
        for lesson in curriculum["lessons"]
    }
    payload = {
        "schemaVersion": "1.0.0",
        "id": "hsk4-standard-course-lower-volume-vocabulary",
        "title": "Từ vựng Giáo trình chuẩn HSK 4 - Tập 2",
        "status": "review",
        "count": len(vocabulary),
        "vocabulary": vocabulary,
        "byLesson": [
            {
                "lessonNumber": lesson_number,
                "title": lesson_title_by_number[lesson_number],
                "count": sum(item["lessonNumber"] == lesson_number for item in vocabulary),
                "itemRefs": [
                    item["id"] for item in vocabulary if item["lessonNumber"] == lesson_number
                ],
            }
            for lesson_number in range(11, 21)
        ],
        "editorial": {
            "note": "Hán tự và pinyin đã được chuẩn hóa; từ loại và nghĩa tiếng Việt vẫn là OCR thô từ bản scan.",
            "publicationReady": False,
        },
    }
    output = root / "vocabulary.json"
    output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Built {output} with {len(vocabulary)} entries")


if __name__ == "__main__":
    main()
