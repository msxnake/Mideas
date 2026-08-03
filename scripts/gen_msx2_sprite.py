"""Demo: generate a valid MSX2 SCREEN 5 sprite (Msx2Sprite) for Mideas.

- Defines a NEW 16-colour SCREEN 5 palette (RGB 3-bit, V9938) sized for an
  anime-girl chibi.
- Paints a 16x16 frame using that palette.
- Emits a `.msx2sprite.json` file in Mideas' sprite-library import shape,
  and a scaled PNG preview.

Colour encoding matches constants.ts:
  LEVELS = [0x00,0x24,0x49,0x6D,0x92,0xB6,0xDB,0xFF]  (3-bit channel -> byte)
  masterIndex = (rLevel<<6) | (gLevel<<3) | bLevel   (0..511)
"""
import json, os, time
from PIL import Image

BASE = r"C:\Users\salam\Documents\Programacion\Mideas"
LEVELS = [0x00, 0x24, 0x49, 0x6D, 0x92, 0xB6, 0xDB, 0xFF]
TRANSPARENT = "rgba(0,0,0,0)"

def hexof(r, g, b):
    return f"#{LEVELS[r]:02X}{LEVELS[g]:02X}{LEVELS[b]:02X}"

def master(r, g, b):
    return (r << 6) | (g << 3) | b

# slotIndex -> (rLevel, gLevel, bLevel) or None for transparent slot 0
PAL = {
    0:  None,           # transparent
    1:  (1, 1, 1),      # outline / near-black
    2:  (2, 1, 1),      # hair dark brown
    3:  (4, 2, 1),      # hair mid brown
    4:  (7, 6, 5),      # skin base
    5:  (6, 4, 3),      # skin shadow
    6:  (5, 3, 7),      # violet eye
    7:  (2, 1, 3),      # pupil (dark violet)
    8:  (7, 7, 7),      # white
    9:  (7, 7, 6),      # sweater cream
    10: (6, 5, 7),      # cardigan lavender
    11: (4, 3, 6),      # cardigan shadow
    12: (7, 4, 5),      # pink
    13: (7, 5, 5),      # cheek blush
    14: (6, 2, 3),      # lips
    15: (5, 3, 2),      # hair shine
}

def build_palette():
    slots = []
    for i in range(16):
        rgb = PAL[i]
        if rgb is None:
            slots.append({"slotIndex": 0, "masterIndex": -1, "hex": TRANSPARENT})
        else:
            r, g, b = rgb
            slots.append({"slotIndex": i, "masterIndex": master(r, g, b), "hex": hexof(r, g, b)})
    return slots

# char -> slot index
CH = {'.':0, 'o':1, 'H':2, 'h':3, 'K':4, 'k':5, 'E':6, 'P':7, 'W':8,
      'C':9, 'L':10, 'l':11, 'M':12, 'B':13, 'p':14, 's':15}

ROWS = [
    "....HHHHHHHH....",  # 0  hair crown
    "...HHhhhhhhHH...",  # 1
    "..HHhhshhshhHH..",  # 2  centre part / shine
    "..HHhKKKKKKhHH..",  # 3  forehead
    ".HHhKKKKKKKKhHH.",  # 4
    ".HHhKEEKKEEKhHH.",  # 5  eyes (violet)
    ".HHhKPWKKWPKhHH.",  # 6  pupils + highlight
    ".HHhKKKKKKKKhHH.",  # 7
    ".HHhKBKKKKBKhHH.",  # 8  blush
    ".HHhKKppppKKhHH.",  # 9  smile (lips)
    ".HHhKKKppKKKhHH.",  # 10
    "..HHhKKKKKKhHH..",  # 11 chin
    "..HHhkKKKKkhHH..",  # 12 jaw shadow
    "..HHCCLLLLCCHH..",  # 13 sweater + cardigan
    ".HHCCLlLLlLCCHH.",  # 14
    ".HHCCLLCCLLCCHH.",  # 15
]
assert all(len(r) == 16 for r in ROWS), [len(r) for r in ROWS]

palette = build_palette()
slot_hex = {i: palette[i]["hex"] for i in range(16)}

# PixelData: MSXColorValue[][] (rows of hex strings; transparent literal for slot 0)
data = []
for row in ROWS:
    out = []
    for ch in row:
        slot = CH[ch]
        out.append(TRANSPARENT if slot == 0 else slot_hex[slot])
    data.append(out)

sprite = {
    "id": f"anime_girl_s5_{int(time.time()*1000)}",
    "name": "Anime Girl S5",
    "target": "MSX2",
    "vdpMode": "SCREEN5",
    "size": {"width": 16, "height": 16},
    "palette": palette,
    "backgroundColor": TRANSPARENT,
    "frames": [{"id": "frame_0", "data": data}],
    "currentFrameIndex": 0,
    "animationSpeedMs": 200,
    "loops": True,
    "facingDirection": "neutral",
    "hardware": {"x": 0, "y": 0, "color": 15, "patternIndex": 0, "useOrColor": False},
}

entry = {
    "id": f"anime_girl_s5_{int(time.time())}",
    "name": "Anime Girl S5",
    "savedAt": int(time.time() * 1000),
    "sprite": sprite,
}
lib_file = {"version": 1, "entries": [entry]}

json_path = os.path.join(BASE, "anime_girl.msx2sprite.json")
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(lib_file, f, indent=2)

# ---- preview PNG (upscaled, over a pastel backdrop) ----
def to_rgb(hexstr):
    return (int(hexstr[1:3], 16), int(hexstr[3:5], 16), int(hexstr[5:7], 16))

BG = (232, 220, 240)  # pastel lavender backdrop for the transparent pixels
img = Image.new("RGB", (16, 16), BG)
px = img.load()
for y, row in enumerate(data):
    for x, cell in enumerate(row):
        if cell != TRANSPARENT:
            px[x, y] = to_rgb(cell)
scale = 24
big = img.resize((16*scale, 16*scale), Image.NEAREST)
preview = os.path.join(BASE, "anime_girl_sprite_preview.png")
big.save(preview)

# report
used = sorted({CH[c] for r in ROWS for c in r})
print("JSON:", os.path.basename(json_path))
print("PREVIEW:", os.path.basename(preview))
print("palette slots used:", used)
print("palette:")
for i in range(16):
    print(f"  {i:2d} {palette[i]['hex']:>13}  master={palette[i]['masterIndex']}")
