"""Build exact 16x16 seamless laser tiles from the generated visual reference.

The source image is treated as a visual reference. Cropping is fixed and the
final tiles are quantized to the existing Area51 SCREEN 5 palette. Horizontal
tiles have identical left/right edge columns; vertical tiles have identical
top/bottom edge rows so repeated segments do not create seams.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image


PALETTE = {
    1: (0, 0, 0),
    2: (0, 36, 73),
    3: (0, 73, 109),
    4: (36, 109, 146),
    6: (36, 36, 36),
    7: (73, 73, 73),
    8: (109, 109, 109),
    10: (255, 36, 0),
    12: (255, 109, 73),
    14: (36, 146, 219),
    15: (255, 255, 255),
}


def palette_index(rgb: tuple[int, int, int]) -> int:
    r, g, b = rgb
    # The generated reference uses a noisy magenta background; make it the
    # opaque black room backdrop used by the existing Area51 bitmap tiles.
    if r > 150 and b > 120 and g < 100 and abs(r - b) < 100:
        return 1
    return min(
        PALETTE,
        key=lambda slot: sum((rgb[i] - PALETTE[slot][i]) ** 2 for i in range(3)),
    )


def build_tile(source: Image.Image, box: tuple[int, int, int, int], axis: str) -> tuple[Image.Image, list[int]]:
    crop = source.crop(box).resize((16, 16), Image.Resampling.NEAREST).convert("RGB")
    pixels = [palette_index(pixel) for pixel in crop.getdata()]
    # Reuse the existing Area51 warning colors for the laser itself: the
    # generated reference's cyan rim becomes slot A and its white core slot C.
    # Keeping the shoulders/background in the room palette preserves contrast
    # without introducing any SCREEN 5 palette entries.
    pixels = [10 if index == 14 else 12 if index == 15 else index for index in pixels]

    if axis == "horizontal":
        for y in range(16):
            pixels[y * 16 + 15] = pixels[y * 16]
    else:
        for x in range(16):
            pixels[15 * 16 + x] = pixels[x]

    out = Image.new("RGB", (16, 16))
    out.putdata([PALETTE[index] for index in pixels])
    return out, pixels


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    source = Image.open(args.input).convert("RGB")

    # Keep a square context around each beam so the final 16x16 tile retains
    # empty space outside the beam. The selected regions are well inside the
    # generated beam bodies, away from their decorative end caps.
    horizontal, h_pixels = build_tile(source, (200, 200, 700, 700), "horizontal")
    vertical, v_pixels = build_tile(source, (1040, 190, 1590, 740), "vertical")

    horizontal.save(args.output_dir / "laser-horizontal-16x16.png")
    vertical.save(args.output_dir / "laser-vertical-16x16.png")
    horizontal.resize((128, 128), Image.Resampling.NEAREST).save(
        args.output_dir / "laser-horizontal-16x16-zoom.png"
    )
    vertical.resize((128, 128), Image.Resampling.NEAREST).save(
        args.output_dir / "laser-vertical-16x16-zoom.png"
    )

    manifest = {
        "horizontal": {"size": horizontal.size, "pixelData": h_pixels},
        "vertical": {"size": vertical.size, "pixelData": v_pixels},
    }
    (args.output_dir / "laser-pixels.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest))


if __name__ == "__main__":
    main()
