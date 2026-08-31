from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import cv2
from rapidocr_onnxruntime import RapidOCR


def dump_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="OCR rendered PDF pages with RapidOCR.")
    parser.add_argument("--image-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--pattern", default="page-*.png")
    parser.add_argument("--include-pages", default="")
    parser.add_argument("--max-height", type=int, default=0)
    parser.add_argument("--shard-index", type=int, default=0)
    parser.add_argument("--shard-count", type=int, default=1)
    args = parser.parse_args()

    if args.shard_count < 1 or not 0 <= args.shard_index < args.shard_count:
        raise ValueError("Invalid shard settings")

    included_pages = {
        int(value)
        for value in args.include_pages.split(",")
        if value.strip()
    }
    paths = sorted(args.image_dir.glob(args.pattern))
    if included_pages:
        paths = [path for path in paths if int(path.stem.rsplit("-", 1)[-1]) in included_pages]
    selected = [path for index, path in enumerate(paths) if index % args.shard_count == args.shard_index]
    engine = RapidOCR()
    processed = 0

    for path in selected:
        output = args.output_dir / f"{path.stem}.json"
        if output.exists():
            continue
        started = time.perf_counter()
        image = cv2.imread(str(path))
        if image is None:
            raise ValueError(f"Unable to read image: {path}")
        original_height, original_width = image.shape[:2]
        ocr_scale = 1.0
        if args.max_height and image.shape[0] > args.max_height:
            ocr_scale = args.max_height / image.shape[0]
            image = cv2.resize(image, None, fx=ocr_scale, fy=ocr_scale, interpolation=cv2.INTER_AREA)
        result, elapsed = engine(image)
        lines = []
        for box, text, confidence in result or []:
            lines.append(
                {
                    # Store boxes in the coordinate system of the rendered source
                    # image so OCR shards can safely use different resize limits.
                    "box": [[float(x) / ocr_scale, float(y) / ocr_scale] for x, y in box],
                    "text": text,
                    "confidence": float(confidence),
                }
            )
        dump_json(
            output,
            {
                "page": int(path.stem.rsplit("-", 1)[-1]),
                "image": path.name,
                "imageWidth": original_width,
                "imageHeight": original_height,
                "ocrWidth": image.shape[1],
                "ocrHeight": image.shape[0],
                "ocrScale": round(ocr_scale, 8),
                "elapsedSeconds": elapsed,
                "wallSeconds": round(time.perf_counter() - started, 3),
                "lines": lines,
            },
        )
        processed += 1
        print(f"shard={args.shard_index} page={path.stem} lines={len(lines)}", flush=True)

    print(f"shard={args.shard_index} complete processed={processed}", flush=True)


if __name__ == "__main__":
    main()
