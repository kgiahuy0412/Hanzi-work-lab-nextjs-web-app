from __future__ import annotations

import argparse
import math
from pathlib import Path

from PIL import Image


CANVAS = 640
FRAME_COUNT = 24
FRAME_MS = 55


def fit_subject(image: Image.Image, max_size: int = 590) -> Image.Image:
    rgba = image.convert("RGBA")
    bbox = rgba.getchannel("A").getbbox()
    if bbox is None:
        raise ValueError("Input image has no visible pixels")
    subject = rgba.crop(bbox)
    scale = min(max_size / subject.width, max_size / subject.height)
    size = (max(1, round(subject.width * scale)), max(1, round(subject.height * scale)))
    return subject.resize(size, Image.Resampling.LANCZOS)


def composite_frame(subject: Image.Image, angle: float, scale: float, dx: int, dy: int) -> Image.Image:
    size = (max(1, round(subject.width * scale)), max(1, round(subject.height * scale)))
    transformed = subject.resize(size, Image.Resampling.LANCZOS)
    transformed = transformed.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
    frame = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    x = (CANVAS - transformed.width) // 2 + dx
    y = (CANVAS - transformed.height) // 2 + dy
    frame.alpha_composite(transformed, (x, y))
    return frame


def gif_frame(frame: Image.Image) -> Image.Image:
    alpha = frame.getchannel("A")
    palette = frame.convert("RGB").quantize(colors=255, method=Image.Quantize.MEDIANCUT)
    transparent = alpha.point(lambda value: 255 if value <= 16 else 0)
    palette.paste(255, mask=transparent)
    palette.info["transparency"] = 255
    palette.info["disposal"] = 2
    return palette


def motion(kind: str, index: int) -> tuple[float, float, int, int]:
    phase = (2 * math.pi * index) / FRAME_COUNT
    if kind == "hello":
        return 2.2 * math.sin(phase), 1.0 + 0.012 * math.sin(phase * 2), round(4 * math.sin(phase)), round(-5 * abs(math.sin(phase)))
    if kind == "study":
        return 0.7 * math.sin(phase), 1.0 + 0.018 * math.sin(phase), 0, round(-4 * math.sin(phase))
    if kind == "success":
        jump = abs(math.sin(phase))
        return 1.2 * math.sin(phase), 1.0 + 0.035 * jump, round(3 * math.sin(phase * 2)), round(-22 * jump)
    raise ValueError(f"Unknown animation kind: {kind}")


def build(source: Path, destination: Path, kind: str) -> None:
    subject = fit_subject(Image.open(source))
    frames = []
    for index in range(FRAME_COUNT):
        angle, scale, dx, dy = motion(kind, index)
        frames.append(gif_frame(composite_frame(subject, angle, scale, dx, dy)))
    destination.parent.mkdir(parents=True, exist_ok=True)
    frames[0].save(
        destination,
        save_all=True,
        append_images=frames[1:],
        duration=FRAME_MS,
        loop=0,
        optimize=False,
        transparency=255,
        disposal=2,
    )


def validate(path: Path) -> None:
    with Image.open(path) as image:
        frame_count = getattr(image, "n_frames", 1)
        if image.size != (CANVAS, CANVAS):
            raise ValueError(f"Unexpected GIF size for {path}: {image.size}")
        if frame_count != FRAME_COUNT:
            raise ValueError(f"Unexpected GIF frame count for {path}: {frame_count}")
        if image.info.get("loop") != 0:
            raise ValueError(f"GIF is not configured to loop forever: {path}")
        print(
            f"{path} | {image.width}x{image.height} | frames={frame_count} | "
            f"duration={image.info.get('duration')}ms | transparency={image.info.get('transparency')}"
        )


def main() -> None:
    parser = argparse.ArgumentParser(description="Build transparent looping penguin mascot GIFs.")
    parser.add_argument("asset_dir", type=Path)
    args = parser.parse_args()

    jobs = (
        ("penguin-hello.png", "penguin-hello.gif", "hello"),
        ("penguin-study.png", "penguin-study.gif", "study"),
        ("penguin-success.png", "penguin-success.gif", "success"),
    )
    for source_name, destination_name, kind in jobs:
        destination = args.asset_dir / destination_name
        build(args.asset_dir / source_name, destination, kind)
        validate(destination)


if __name__ == "__main__":
    main()
