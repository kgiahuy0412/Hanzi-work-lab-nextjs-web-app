from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator


def load(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def require(condition: bool, message: str, errors: list[str]) -> None:
    if not condition:
        errors.append(message)


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate the HSK 5 workbook volume 1 JSON bundle.")
    parser.add_argument("bundle_dir", type=Path)
    args = parser.parse_args()
    root = args.bundle_dir.resolve()
    errors: list[str] = []

    manifest = load(root / "manifest.json")
    curriculum = load(root / "curriculum.json")
    exercises_payload = load(root / "exercises.json")
    exercises = exercises_payload["exercises"]
    answer_key = load(root / "answer-key.json")
    pages = load(root / "source-pages.json")["sourcePages"]
    compiled = load(root / "hsk5-workbook-1.json")
    schema = load(root / "schemas" / "workbook-lesson.schema.json")

    require(manifest["status"] == "review", "manifest.status must be review", errors)
    require(len(pages) == 144, f"expected 144 source pages, got {len(pages)}", errors)
    require([page["pdfPage"] for page in pages] == list(range(1, 145)), "source pages are not consecutive", errors)
    require(len(curriculum["units"]) == 6, f"expected 6 units, got {len(curriculum['units'])}", errors)
    require(len(curriculum["lessons"]) == 18, f"expected 18 lessons, got {len(curriculum['lessons'])}", errors)
    require([lesson["number"] for lesson in curriculum["lessons"]] == list(range(1, 19)), "lesson numbers are not 1..18", errors)
    require([unit["sourceDividerPdfPage"] for unit in curriculum["units"]] == [7, 29, 51, 73, 95, 117], "unit divider pages are incorrect", errors)
    require(answer_key["presentInSource"] is False and answer_key["answers"] == [], "answer-key.json must explicitly represent an absent key", errors)
    require(len(exercises) == 576, f"expected 576 exercises, got {len(exercises)}", errors)
    require(all(exercise["answer"] is None for exercise in exercises), "an exercise answer was invented despite absent source key", errors)
    require(
        all(len(exercise["optionsOcr"]) == 4 for exercise in exercises if exercise["sectionType"] in {"listening", "reading"}),
        "a listening or reading exercise does not have exactly four options",
        errors,
    )
    restored_options = {
        (exercise["lessonNumber"], exercise["sectionType"], exercise["numberInSource"], label)
        for exercise in exercises
        for label in exercise.get("manuallyRestoredOptionLabels", [])
    }
    require(
        restored_options == {(10, "reading", 18, "C"), (13, "reading", 17, "C")},
        f"unexpected manually restored option set: {sorted(restored_options)}",
        errors,
    )

    expected_ranges = {number: (start, end) for number, start, end, _ in [
        (1, 8, 14, ""), (2, 15, 21, ""), (3, 22, 28, ""),
        (4, 30, 36, ""), (5, 37, 43, ""), (6, 44, 50, ""),
        (7, 52, 58, ""), (8, 59, 65, ""), (9, 66, 72, ""),
        (10, 74, 80, ""), (11, 81, 87, ""), (12, 88, 94, ""),
        (13, 96, 102, ""), (14, 103, 109, ""), (15, 110, 116, ""),
        (16, 118, 124, ""), (17, 125, 131, ""), (18, 132, 138, ""),
    ]}
    page_ids = {page["id"] for page in pages}
    exercise_ids = {exercise["id"] for exercise in exercises}
    require(len(exercise_ids) == len(exercises), "duplicate exercise IDs", errors)
    validator = Draft202012Validator(schema)
    for lesson in curriculum["lessons"]:
        lesson_path = root / "lessons" / f"lesson-{lesson['number']:02d}.json"
        require(lesson_path.exists(), f"missing {lesson_path.name}", errors)
        if not lesson_path.exists():
            continue
        payload = load(lesson_path)
        for validation_error in validator.iter_errors(payload):
            errors.append(f"{lesson_path.name}: {validation_error.message}")
        start = payload["sourcePdfPages"]["start"]
        end = payload["sourcePdfPages"]["end"]
        require((start, end) == expected_ranges[payload["number"]], f"lesson {payload['number']} has unexpected page range {(start, end)}", errors)
        require(len(payload["sectionBlockIds"]) == 3, f"lesson {payload['number']} must have exactly three section blocks", errors)
        require(set(payload["exerciseIds"]) <= exercise_ids, f"lesson {payload['number']} has dangling exercise references", errors)
        require(payload["exerciseCount"] == len(payload["exerciseIds"]), f"lesson {payload['number']} exercise count mismatch", errors)
        lesson_exercises = [exercise for exercise in exercises if exercise["lessonNumber"] == payload["number"]]
        require(len(lesson_exercises) == 32, f"lesson {payload['number']} should have 32 exercises, got {len(lesson_exercises)}", errors)
        require([exercise["numberInSource"] for exercise in lesson_exercises] == list(range(1, 33)), f"lesson {payload['number']} question numbers are not 1..32", errors)
        require(payload["exerciseCountsBySection"] == {"listening": 14, "reading": 14, "writing": 4}, f"lesson {payload['number']} section counts are incorrect", errors)

    for exercise in exercises:
        require(1 <= exercise["lessonNumber"] <= 18, f"exercise {exercise['id']} has invalid lesson", errors)
        require(exercise["sectionType"] in {"listening", "reading", "writing"}, f"exercise {exercise['id']} has invalid section", errors)
        require(bool(exercise["promptOcr"]), f"exercise {exercise['id']} has empty prompt", errors)
        require(all(ref["sourcePageId"] in page_ids for ref in exercise["sourceEvidence"]), f"exercise {exercise['id']} has dangling page references", errors)

    for section_type in ("listening", "reading", "writing"):
        blocks = load(root / "blocks" / f"{section_type}-blocks.json")["blocks"]
        require(len(blocks) == 18, f"expected 18 {section_type} blocks, got {len(blocks)}", errors)
        require(all(block["contentOcr"] for block in blocks), f"a {section_type} block is empty", errors)
        require(all(set(block["sourcePageIds"]) <= page_ids for block in blocks), f"a {section_type} block has dangling page refs", errors)
        if section_type == "listening":
            for block in blocks:
                expected_tracks = {f"{block['lessonNumber']:02d}-1", f"{block['lessonNumber']:02d}-2"}
                require(expected_tracks <= set(block["audioTrackReferences"]), f"lesson {block['lessonNumber']} listening track refs are incomplete", errors)

    require(len(compiled["sourcePages"]) == 144, "compiled sourcePages is incomplete", errors)
    require(compiled["exercises"] == exercises, "compiled exercises differ from exercises.json", errors)
    require(compiled["content"]["answerKey"]["presentInSource"] is False, "compiled answer key status is incorrect", errors)
    require(manifest["counts"]["exercises"] == len(exercises), "manifest exercise count mismatch", errors)
    missing_artifacts = [artifact for artifact in manifest["artifacts"] if not (root / artifact).exists()]
    require(not missing_artifacts, f"manifest points to missing artifacts: {missing_artifacts}", errors)

    if errors:
        print(f"FAILED ({len(errors)} error(s))")
        for error in errors:
            print(f"- {error}")
        raise SystemExit(1)

    counts = manifest["counts"]
    print(
        "VALID "
        f"pages={counts['sourcePages']} units={counts['units']} lessons={counts['lessons']} "
        f"blocks={counts['sectionBlocks']} exercises={counts['exercises']} answers={counts['answers']}"
    )


if __name__ == "__main__":
    main()
