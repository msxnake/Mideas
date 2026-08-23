"""Build a deterministic 16x16 Area51 key tile from the generated source image."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


PALETTE = [
    (0, 0, 0, 0),
    (0, 0, 0),
    (0, 36, 73),
    (0, 73, 109),
    (36, 109, 146),
    (73, 109, 146),
    (36, 36, 36),
    (73, 73, 73),
    (109, 109, 109),
    (146, 146, 146),
    (255, 36, 0),
    (219, 219, 109),
    (255, 109, 73),
    (182, 219, 0),
    (36, 146, 219),
    (255, 255, 255),
]


def is_magenta_background(rgb: tuple[int, int, int]) -> bool:
    red, green, blue = rgb
    # ImageGen's solid magenta can have a small amount of JPEG/edge noise.
    return red > 160 and blue > 150 and green < 100 and abs(red - blue) < 115


def subject_crop(image: Image.Image) -> Image.Image:
    rgb = image.convert("RGB")
    foreground = [
        (x, y)
        for y in range(rgb.height)
        for x in range(rgb.width)
        if not is_magenta_background(rgb.getpixel((x, y)))
    ]
    if not foreground:
        raise ValueError("The source image contains no detectable foreground")

    min_x = min(x for x, _ in foreground)
    min_y = min(y for _, y in foreground)
    max_x = max(x for x, _ in foreground)
    max_y = max(y for _, y in foreground)
    content_size = max(max_x - min_x + 1, max_y - min_y + 1)
    padding = max(12, round(content_size * 0.04))
    size = min(max(rgb.width, rgb.height), content_size + (padding * 2))
    center_x = (min_x + max_x) / 2
    center_y = (min_y + max_y) / 2
    left = round(center_x - size / 2)
    top = round(center_y - size / 2)
    left = max(0, min(left, rgb.width - size))
    top = max(0, min(top, rgb.height - size))
    return rgb.crop((left, top, left + size, top + size))


def nearest_palette_slot(rgb: tuple[int, int, int]) -> int:
    # Slot 0 is transparency, so only compare visible Area51 colors.
    candidates = PALETTE[1:]
    distances = [
        sum((component - target) ** 2 for component, target in zip(rgb, color))
        for color in candidates
    ]
    return distances.index(min(distances)) + 1


def handcrafted_pixel_data() -> list[int]:
    """A compact, readable key silhouette tuned for a 16x16 HUD/tile grid."""
    tile = [[0 for _ in range(16)] for _ in range(16)]

    def paint(points: list[tuple[int, int]], slot: int) -> None:
        for x, y in points:
            tile[y][x] = slot

    # Circular bow: black outer contour, gold body, and a transparent hole.
    paint([(3, 2), (4, 2), (5, 2), (6, 2),
           (2, 3), (7, 3), (1, 4), (8, 4), (1, 5), (8, 5),
           (1, 6), (8, 6), (2, 7), (7, 7), (3, 8), (4, 8),
           (5, 8), (6, 8)], 1)
    paint([(3, 3), (4, 3), (5, 3), (6, 3), (2, 4), (7, 4),
           (2, 5), (7, 5), (2, 6), (7, 6), (3, 7), (4, 7),
           (5, 7), (6, 7)], 11)
    paint([(3, 3), (4, 3), (3, 4), (2, 4), (2, 5), (2, 6)], 15)
    paint([(5, 7), (6, 7), (7, 6), (7, 5)], 13)

    # Horizontal shaft, with a bright face and two unmistakable teeth.
    paint([(8, 5), (9, 5), (10, 5), (11, 5), (12, 5), (13, 5), (14, 5),
           (8, 6), (14, 6), (8, 7), (14, 7),
           (8, 8), (9, 8), (10, 8), (11, 8), (12, 8), (13, 8), (14, 8),
           (9, 9), (11, 9), (12, 9), (14, 9),
           (9, 10), (10, 10), (11, 10), (12, 10), (13, 10), (14, 10)], 1)
    paint([(9, 6), (10, 6), (11, 6), (12, 6), (13, 6),
           (9, 7), (10, 7), (11, 7), (12, 7), (13, 7)], 11)
    paint([(9, 6), (10, 6), (11, 6), (9, 7)], 15)
    paint([(12, 7), (13, 7), (12, 9), (13, 9)], 13)
    paint([(10, 9), (13, 9)], 11)
    return [slot for row in tile for slot in row]


def save_pixel_data(pixel_data: list[int], output: Path, zoom_output: Path) -> None:
    result = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    for y in range(16):
        for x in range(16):
            result.putpixel((x, y), PALETTE[pixel_data[y * 16 + x]])
    output.parent.mkdir(parents=True, exist_ok=True)
    result.save(output)
    preview = Image.new("RGBA", (16, 16), PALETTE[2])
    preview.alpha_composite(result)
    preview.resize((256, 256), Image.Resampling.NEAREST).save(zoom_output)


def build_tile(source: Path, output: Path, zoom_output: Path) -> list[int]:
    cropped = subject_crop(Image.open(source))
    rgba = cropped.convert("RGBA")
    for y in range(rgba.height):
        for x in range(rgba.width):
            red, green, blue, _ = rgba.getpixel((x, y))
            if is_magenta_background((red, green, blue)):
                rgba.putpixel((x, y), (0, 0, 0, 0))

    tile = rgba.resize((16, 16), Image.Resampling.NEAREST)
    pixel_data: list[int] = []
    result = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    for y in range(16):
        for x in range(16):
            red, green, blue, alpha = tile.getpixel((x, y))
            slot = 0 if alpha < 128 else nearest_palette_slot((red, green, blue))
            pixel_data.append(slot)
            result.putpixel((x, y), PALETTE[slot])

    save_pixel_data(pixel_data, output, zoom_output)
    return pixel_data


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--zoom-output", type=Path, required=True)
    parser.add_argument("--mode", choices=("handcrafted", "generated"), default="handcrafted")
    args = parser.parse_args()

    if args.mode == "generated":
        pixel_data = build_tile(args.input, args.output, args.zoom_output)
    else:
        if not args.input.exists():
            raise FileNotFoundError(args.input)
        pixel_data = handcrafted_pixel_data()
        save_pixel_data(pixel_data, args.output, args.zoom_output)
    visible = sum(slot != 0 for slot in pixel_data)
    slots = sorted(set(pixel_data))
    print(f"size=16x16 visible_pixels={visible} palette_slots={slots}")
    print("pixelData=" + ",".join(map(str, pixel_data)))


if __name__ == "__main__":
    main()
