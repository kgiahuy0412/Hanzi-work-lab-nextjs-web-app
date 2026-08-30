from __future__ import annotations

import json
import re
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker


ROOT = Path(__file__).resolve().parents[1]
BUNDLE = ROOT / "content" / "hsk1-textbook-json"


def main() -> None:
    json_files = sorted(BUNDLE.rglob("*.json"))
    parsed = {path: json.loads(path.read_text(encoding="utf-8")) for path in json_files}
    schema = parsed[BUNDLE / "schemas" / "lesson.schema.json"]
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    schema_errors: list[str] = []
    for lesson_path in sorted((BUNDLE / "lessons").glob("*.json")):
        for error in validator.iter_errors(parsed[lesson_path]):
            location = "/".join(str(part) for part in error.absolute_path)
            schema_errors.append(f"{lesson_path.name}:{location}: {error.message}")
    if schema_errors:
        raise SystemExit("\n".join(schema_errors))

    manifest = parsed[BUNDLE / "manifest.json"]
    missing_manifest_files = [
        item["path"] for item in manifest["files"] if not (BUNDLE / item["path"]).exists()
    ]
    if missing_manifest_files:
        raise SystemExit(f"Missing manifest files: {missing_manifest_files}")

    curriculum = parsed[BUNDLE / "curriculum.json"]
    expected = curriculum["counts"]
    actual = {
        "lessons": len(list((BUNDLE / "lessons").glob("*.json"))),
        "indexedVocabularyItems": len(parsed[BUNDLE / "shared" / "lexemes.json"]["items"]),
        "dialogues": len(parsed[BUNDLE / "shared" / "dialogues.json"]["items"]),
        "grammarPoints": len(parsed[BUNDLE / "shared" / "grammar-points.json"]["items"]),
        "pronunciationTopicGroups": len(parsed[BUNDLE / "shared" / "pronunciation-topics.json"]["items"]),
        "characters": len(parsed[BUNDLE / "shared" / "characters.json"]["items"]),
        "cultureNotes": len(parsed[BUNDLE / "shared" / "culture-notes.json"]["items"]),
        "derivedAssessmentItems": len(parsed[BUNDLE / "shared" / "assessment-items.json"]["items"]),
        "referencedAudioTracks": len(parsed[BUNDLE / "shared" / "media-assets.json"]["items"]),
    }
    if actual != expected:
        raise SystemExit(f"Count mismatch: expected={expected}; actual={actual}")

    cjk = re.compile(r"[\u3400-\u9fff]")
    lexemes = parsed[BUNDLE / "shared" / "lexemes.json"]["items"]
    dialogues = parsed[BUNDLE / "shared" / "dialogues.json"]["items"]
    empty_lexeme_fields = [
        item["id"]
        for item in lexemes
        if not item["simplified"]
        or not item["pinyin"]
        or not item["senses"][0]["meaningVi"]
        or cjk.search(item["pinyin"])
    ]
    if empty_lexeme_fields:
        raise SystemExit(f"Invalid lexeme fields: {empty_lexeme_fields}")
    invalid_dialogue_turns = [
        turn["id"]
        for dialogue in dialogues
        for turn in dialogue["turns"]
        if not turn["hanzi"]
        or not turn["pinyin"]
        or not turn["translationVi"]
        or cjk.search(turn["pinyin"])
    ]
    if invalid_dialogue_turns:
        raise SystemExit(f"Invalid dialogue turns: {invalid_dialogue_turns}")
    assessments = parsed[BUNDLE / "shared" / "assessment-items.json"]["items"]
    duplicate_option_items = [
        item["id"]
        for item in assessments
        if len({option["text"] for option in item["options"]}) != len(item["options"])
    ]
    if duplicate_option_items:
        raise SystemExit(f"Duplicate assessment options: {duplicate_option_items}")
    lesson_five = parsed[BUNDLE / "lessons" / "lesson-05.json"]
    lesson_five_grammar = next(
        section for section in lesson_five["sections"] if section["type"] == "grammar"
    )
    if lesson_five_grammar["sourceAvailability"] != "reconstructed-from-toc":
        raise SystemExit("Lesson 5 grammar provenance marker is missing")

    print(
        json.dumps(
            {
                "jsonFiles": len(json_files),
                "schemaValidatedLessons": actual["lessons"],
                "schemaErrors": 0,
                "missingManifestFiles": 0,
                "emptyLexemeFields": 0,
                "invalidDialogueTurns": 0,
                "duplicateAssessmentOptionSets": 0,
                "counts": actual,
                "crossReferenceValidation": manifest["validation"],
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
