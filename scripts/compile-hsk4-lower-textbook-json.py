from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


BLOCK_NAMES = (
    "warmup",
    "pinyin-transcript",
    "annotation",
    "practice",
    "comparison",
    "extension",
    "application",
    "culture",
)

APPENDIX_NAMES = (
    "vocabulary-summary",
    "proper-names-summary",
    "beyond-level-vocabulary",
    "related-old-new-words",
    "answer-key",
)


def load(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Compile the normalized HSK 4 lower-volume JSON bundle into one portable file."
    )
    parser.add_argument(
        "bundle",
        type=Path,
        nargs="?",
        default=Path("content/hsk4-lower-textbook-json"),
    )
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    root = args.bundle
    output = args.output or root / "hsk4-lower-textbook.json"
    manifest = load(root / "manifest.json")
    vocabulary = load(root / "vocabulary.json")

    lessons = [
        load(root / "lessons" / f"lesson-{number:02d}.json")
        for number in range(11, 21)
    ]
    blocks = {
        name: load(root / "shared" / f"{name}-blocks.json")["blocks"]
        for name in BLOCK_NAMES
    }
    appendices = {
        name: load(root / "appendices" / f"{name}.json")
        for name in APPENDIX_NAMES
    }

    payload = {
        "schemaVersion": manifest["schemaVersion"],
        "bundleId": manifest["bundleId"],
        "title": manifest["title"],
        "description": manifest["description"],
        "locale": manifest["locale"],
        "status": manifest["status"],
        "counts": manifest["counts"],
        "sourceAnalysis": load(root / "source-analysis.json"),
        "curriculum": load(root / "curriculum.json"),
        "vocabulary": vocabulary["vocabulary"],
        "vocabularyByLesson": vocabulary["byLesson"],
        "lessons": lessons,
        "content": {
            "texts": load(root / "shared" / "texts.json")["texts"],
            "lexemes": load(root / "shared" / "lexemes.json")["lexemes"],
            "properNames": load(root / "shared" / "proper-names.json")["properNames"],
            "cultureNotes": load(root / "shared" / "culture-notes.json")["cultureNotes"],
            "comparisons": load(root / "shared" / "comparison-notes.json")["comparisons"],
            "sameCharacterGroups": load(root / "shared" / "same-character-groups.json")["groups"],
            "mediaAssets": load(root / "shared" / "media-assets.json")["assets"],
            "blocks": blocks,
        },
        "appendices": appendices,
        "ocrEvidence": load(root / "shared" / "source-pages.json"),
    }

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Compiled {output} ({output.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
