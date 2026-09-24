"""Export the two SCREEN 5 boss bitmap frames as transparent 48x48 PNGs."""

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent
sprite = json.loads((ROOT / "alien_rival_48.msx2sprite.json").read_text(encoding="utf-8"))["entries"][0]["sprite"]

for frame in sprite["frames"]:
    image = Image.new("RGBA", (48, 48), (0, 0, 0, 0))
    for y, row in enumerate(frame["data"]):
        for x, color in enumerate(row):
            if color.startswith("#"):
                image.putpixel((x, y), tuple(bytes.fromhex(color[1:])) + (255,))
    destination = ROOT / f"alien_rival_{frame['id']}_48x48.png"
    image.save(destination)
    print(destination)
