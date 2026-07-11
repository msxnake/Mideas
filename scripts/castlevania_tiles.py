#!/usr/bin/env python3
"""MSX2 Screen 5 - 16x16 Multicolor Tile System.

Generates a Castlevania-style scene using a reusable 16x16 tile system.
Each tile type is defined once, then composed via a tilemap grid.

Tile grid: 16 columns x 12 rows = 256x192 pixels
Tile format: 16x16 pixels, 4bpp packed (Screen 5)
"""

import shutil
import subprocess
import sys
from pathlib import Path

# --- Constants ---
TILE_W = 16
TILE_H = 16
GRID_COLS = 16  # 16 * 16 = 256
GRID_ROWS = 12  # 12 * 16 = 192
SCREEN_W = 256
SCREEN_H = 192
NUM_TILES_X = 16
NUM_TILES_Y = 12

# --- MSX2 Palette (R, G, B values 0-7) ---
# Custom castlevania palette
PAL = [
    (0, 0, 0),  # 0: black
    (0, 0, 2),  # 1: mortar (very dark blue)
    (1, 1, 5),  # 2: dark brick blue
    (2, 3, 7),  # 3: medium brick blue
    (0, 0, 1),  # 4: deep bg (near black)
    (2, 5, 7),  # 5: window/light blue
    (5, 3, 0),  # 6: brown (wood)
    (4, 6, 7),  # 7: bright highlight
    (7, 1, 0),  # 8: red
    (7, 4, 0),  # 9: orange
    (7, 6, 1),  # 10: yellow
    (5, 5, 5),  # 11: gray
    (1, 4, 1),  # 12: green
    (5, 1, 4),  # 13: purple
    (2, 2, 2),  # 14: dark gray
    (6, 6, 6),  # 15: light gray
]

# Shortcuts
BLK = 0; MRT = 1; BRK = 2; BRH = 3; DEP = 4; WIN = 5
WOD = 6; BRI = 7; RED = 8; ORG = 9; YLW = 10; GRY = 11
GRN = 12; PUR = 13; DGR = 14; LGR = 15


def new_tile():
    """Create empty 16x16 tile (all zeros)."""
    return [[0] * TILE_W for _ in range(TILE_H)]


def tp(t, x, y, c):
    """Set pixel in tile if in bounds."""
    if 0 <= x < TILE_W and 0 <= y < TILE_H:
        t[y][x] = c


def tr(t, x0, y0, w, h, c):
    """Fill rectangle in tile."""
    for y in range(y0, min(y0 + h, TILE_H)):
        for x in range(x0, min(x0 + w, TILE_W)):
            t[y][x] = c


# ============================================================
# TILE DEFINITIONS - Each returns a 16x16 pixel array
# ============================================================

def tile_brick_dark():
    """Dark blue brick (stagger A)."""
    t = new_tile()
    # Horizontal mortar at y=0, y=8
    # Vertical mortar at x=0, x=8
    for y in range(16):
        for x in range(16):
            if y == 0 or y == 8 or x == 0 or x == 8:
                t[y][x] = MRT
            else:
                t[y][x] = BRK
    # Highlight top edge
    for x in range(1, 8): t[1][x] = BRH
    for x in range(9, 16): t[1][x] = BRH
    for x in range(1, 8): t[9][x] = BRH
    for x in range(9, 16): t[9][x] = BRH
    return t


def tile_brick_dark_b():
    """Dark blue brick (stagger B, offset 8px)."""
    t = new_tile()
    for y in range(16):
        for x in range(16):
            if y == 0 or y == 8 or x == 4 or x == 12:
                t[y][x] = MRT
            else:
                t[y][x] = BRK
    for x in range(1, 4): t[1][x] = BRH
    for x in range(5, 12): t[1][x] = BRH
    for x in range(13, 16): t[1][x] = BRH
    for x in range(1, 4): t[9][x] = BRH
    for x in range(5, 12): t[9][x] = BRH
    for x in range(13, 16): t[9][x] = BRH
    return t


def tile_brick_deep():
    """Deep/dark background brick (stagger A)."""
    t = new_tile()
    for y in range(16):
        for x in range(16):
            if y == 0 or y == 8 or x == 0 or x == 8:
                t[y][x] = DEP
            else:
                t[y][x] = BRK
    for x in range(1, 8): t[1][x] = DEP
    for x in range(9, 16): t[1][x] = DEP
    return t


def tile_brick_deep_b():
    """Deep/dark background brick (stagger B)."""
    t = new_tile()
    for y in range(16):
        for x in range(16):
            if y == 0 or y == 8 or x == 4 or x == 12:
                t[y][x] = DEP
            else:
                t[y][x] = BRK
    for x in range(1, 4): t[1][x] = DEP
    for x in range(5, 12): t[1][x] = DEP
    for x in range(13, 16): t[1][x] = DEP
    return t


def tile_platform():
    """Stone platform block."""
    t = new_tile()
    tr(t, 0, 0, 16, 4, LGR)       # top surface
    for x in range(16): t[0][x] = BRI  # bright top edge
    for x in range(16): t[1][x] = GRY  # gray line
    tr(t, 0, 4, 16, 12, GRY)      # body
    # Vertical mortar lines
    for bx in range(0, 16, 8):
        for y in range(4, 16):
            if bx < 16:
                t[y][bx] = DGR
    # Horizontal mortar
    for x in range(16):
        t[10][x] = DGR
    return t


def tile_ladder_top():
    """Ladder top segment."""
    t = new_tile()
    tr(t, 2, 0, 3, 16, WOD)   # left rail
    tr(t, 11, 0, 3, 16, WOD)  # right rail
    # Rungs
    for ry in [4, 8, 12]:
        tr(t, 2, ry, 12, 2, YLW)
        tr(t, 2, ry, 12, 1, WOD)
    return t


def tile_ladder_mid():
    """Ladder middle segment (same as top for continuity)."""
    return tile_ladder_top()


def tile_window_frame():
    """Window frame tile (arched top)."""
    t = new_tile()
    tr(t, 0, 0, 16, 16, BRI)  # full bright frame
    tr(t, 2, 2, 12, 13, DEP)   # dark interior
    # Arch at top
    tr(t, 4, 0, 8, 2, DEP)
    tr(t, 6, 0, 4, 1, DEP)
    # Vertical center bar
    for y in range(2, 15):
        t[y][7] = BRI
        t[y][8] = BRI
    return t


def tile_window_bars():
    """Window bars tile (middle section)."""
    t = new_tile()
    tr(t, 0, 0, 16, 16, BRI)  # frame
    tr(t, 2, 0, 12, 16, DEP)  # dark interior
    # Center vertical bar
    for y in range(16):
        t[y][7] = BRI
        t[y][8] = BRI
    # Horizontal bars
    for y in [4, 8, 12]:
        tr(t, 2, y, 12, 1, BRI)
    return t


def tile_candelabra():
    """Candelabra (pole + base, spans 1 tile)."""
    t = new_tile()
    tr(t, 7, 0, 2, 16, GRY)     # pole
    tr(t, 5, 14, 6, 2, GRY)     # base
    # Left arm
    tr(t, 2, 2, 5, 1, GRY)
    tr(t, 2, 0, 2, 2, YLW)      # left candle
    tp(t, 2, -2 if False else 0, ORG)  # left flame (clamped)
    # Right arm
    tr(t, 9, 2, 5, 1, GRY)
    tr(t, 12, 0, 2, 2, YLW)     # right candle
    return t


def tile_candelabra_flames():
    """Candelabra flame top tile."""
    t = new_tile()
    tr(t, 7, 6, 2, 10, GRY)     # pole continuing down
    # Left flame
    tr(t, 2, 4, 3, 8, ORG)
    tr(t, 2, 2, 3, 2, RED)
    tr(t, 3, 0, 1, 2, YLW)      # flame tip
    # Right flame
    tr(t, 11, 4, 3, 8, ORG)
    tr(t, 11, 2, 3, 2, RED)
    tr(t, 12, 0, 1, 2, YLW)
    return t


def tile_torch():
    """Wall torch with flame."""
    t = new_tile()
    tr(t, 6, 8, 4, 8, GRY)     # bracket
    tr(t, 7, 4, 2, 4, WOD)     # pole
    tr(t, 5, 2, 6, 3, ORG)     # flame body
    tr(t, 6, 1, 4, 2, RED)     # flame core
    tr(t, 7, 0, 2, 1, YLW)     # flame tip
    return t


def tile_bookshelf():
    """Bookshelf with colored books."""
    t = new_tile()
    tr(t, 0, 0, 16, 16, WOD)    # wooden frame
    # Shelf 1
    tr(t, 1, 1, 14, 6, DEP)
    books1 = [RED, BLU, GRN, RED, PUR, BLU, RED, ORG]
    for i, bc in enumerate(books1[:7]):
        bx = 1 + i * 2
        for dy in range(1, 7):
            tp(t, bx, dy, bc)
    # Shelf 2
    tr(t, 1, 9, 14, 6, DEP)
    books2 = [GRN, RED, PUR, BLU, RED, ORG, GRN, RED]
    for i, bc in enumerate(books2[:7]):
        bx = 1 + i * 2
        for dy in range(9, 15):
            tp(t, bx, dy, bc)

    return t


BLU = 4  # alias for blue


def tile_player_body():
    """Player character body tile."""
    t = new_tile()
    # Head (top area)
    tr(t, 4, 0, 6, 3, WOD)    # hair
    tr(t, 5, 3, 4, 3, GRY)    # face
    tp(t, 5, 3, BLK)           # eye
    tp(t, 7, 3, BLK)
    # Body armor
    tr(t, 3, 6, 8, 5, BRI)
    tr(t, 4, 7, 6, 3, GRY)
    tr(t, 3, 11, 8, 1, WOD)   # belt
    # Arms
    tr(t, 1, 7, 2, 3, GRY)
    tr(t, 11, 7, 2, 3, GRY)
    # Whip arm extending right
    tr(t, 13, 6, 3, 1, WOD)
    return t


def tile_player_legs():
    """Player character legs tile."""
    t = new_tile()
    tr(t, 4, 0, 3, 6, BLU)   # left leg
    tr(t, 8, 0, 3, 6, BLU)   # right leg
    tr(t, 3, 6, 4, 2, WOD)   # left boot
    tr(t, 8, 6, 4, 2, WOD)   # right boot
    # Whip continuation
    tr(t, 0, 0, 2, 1, WOD)
    return t


def tile_bat():
    """Bat enemy sprite."""
    t = new_tile()
    # Wings spread
    bat_pattern = [
        [0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0],
        [0,1,1,0,1,0,0,0,0,1,0,1,1,0,0,0],
        [1,1,1,1,1,1,0,0,1,1,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
        [0,0,1,0,0,1,1,1,1,0,0,1,0,0,0,0],
        [0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0],
    ]
    for y, row in enumerate(bat_pattern):
        for x, v in enumerate(row):
            if v:
                tp(t, x, y + 2, PUR)
    return t


def tile_curtain():
    """Red curtain."""
    t = new_tile()
    tr(t, 0, 0, 16, 16, RED)
    # Folds
    for x in range(0, 16, 4):
        for y in range(16):
            t[y][x] = ORG
            if x + 1 < 16:
                t[y][x + 1] = RED
    # Top valance
    tr(t, 0, 0, 16, 3, ORG)
    return t


def tile_stone_block():
    """Stone block (for right structure)."""
    t = new_tile()
    tr(t, 0, 0, 16, 16, GRY)
    # Brick pattern
    for y in [0, 8]:
        for x in range(16):
            t[y][x] = DGR
    for x in [0, 8]:
        for y in range(16):
            t[y][x] = DGR
    # Highlight
    for x in range(1, 8): t[1][x] = LGR
    for x in range(9, 16): t[1][x] = LGR
    for x in range(1, 8): t[9][x] = LGR
    for x in range(9, 16): t[9][x] = LGR
    return t


def tile_ground():
    """Ground tile (dark bricks at bottom)."""
    t = new_tile()
    for y in range(16):
        for x in range(16):
            if y == 0 or y == 8 or x == 0 or x == 8:
                t[y][x] = DGR
            else:
                t[y][x] = BRK
    return t


# ============================================================
# TILE SYSTEM
# ============================================================

# Tile type IDs
TILES = {
    'brick_a':      tile_brick_dark,
    'brick_b':      tile_brick_dark_b,
    'deep_a':       tile_brick_deep,
    'deep_b':       tile_brick_deep_b,
    'platform':     tile_platform,
    'ladder':       tile_ladder_top,
    'window_frame': tile_window_frame,
    'window_bars':  tile_window_bars,
    'candelabra_f': tile_candelabra_flames,
    'candelabra_b': tile_candelabra,
    'torch':        tile_torch,
    'bookshelf':    tile_bookshelf,
    'player_top':   tile_player_body,
    'player_bot':   tile_player_legs,
    'bat':          tile_bat,
    'curtain':      tile_curtain,
    'stone':        tile_stone_block,
    'ground':       tile_ground,
    '_':            lambda: new_tile(),   # empty tile
}

# Assign numeric IDs
TILE_IDS = {}
for i, name in enumerate(TILES.keys()):
    TILE_IDS[name] = i


def render_all_tiles():
    """Render all tile types, return dict of {id: 16x16 pixel array}."""
    rendered = {}
    for name, func in TILES.items():
        tid = TILE_IDS[name]
        rendered[tid] = func()
    return rendered


# ============================================================
# TILEMAP - Composes the Castlevania scene
# ============================================================

def build_tilemap():
    """Return 12x16 grid of tile IDs composing the scene."""
    B = TILE_IDS

    # Row 0 (top): deep bricks + windows
    row0 = [
        B['deep_a'], B['deep_b'], B['deep_a'], B['deep_b'],
        B['deep_a'], B['deep_b'], B['deep_a'], B['deep_b'],
        B['deep_a'], B['deep_b'], B['deep_a'], B['deep_b'],
        B['deep_a'], B['deep_b'], B['deep_a'], B['deep_b'],
    ]
    # Place windows at columns 5 and 11 (2 tiles wide, 3 tall)
    row0[5] = B['window_frame']
    row0[6] = B['window_frame']
    row0[11] = B['window_frame']
    row0[12] = B['window_frame']

    # Row 1: deep bricks + window middle
    row1 = list(row0)  # copy
    row1[4] = B['deep_a']; row1[5] = B['window_bars']; row1[6] = B['window_bars']; row1[7] = B['deep_b']
    row1[10] = B['deep_b']; row1[11] = B['window_bars']; row1[12] = B['window_bars']; row1[13] = B['deep_a']

    # Row 2: deep bricks + window bottom + stone right
    row2 = [
        B['deep_a'], B['deep_b'], B['deep_a'], B['deep_b'],
        B['deep_a'], B['window_bars'], B['window_bars'], B['deep_b'],
        B['deep_a'], B['deep_b'], B['window_bars'], B['window_bars'],
        B['deep_a'], B['stone'], B['stone'], B['stone'],
    ]

    # Row 3: ladder left + platform upper right
    row3 = [
        B['ladder'], B['brick_a'], B['brick_b'], B['brick_a'],
        B['brick_b'], B['brick_a'], B['brick_b'], B['brick_a'],
        B['brick_b'], B['brick_a'], B['brick_b'], B['brick_a'],
        B['platform'], B['platform'], B['platform'], B['platform'],
    ]

    # Row 4: ladder + bat + bookshelf
    row4 = [
        B['ladder'], B['brick_a'], B['brick_b'], B['brick_a'],
        B['brick_b'], B['brick_a'], B['brick_b'], B['brick_a'],
        B['brick_b'], B['brick_a'], B['brick_b'], B['bat'],
        B['brick_a'], B['bookshelf'], B['brick_b'], B['brick_a'],
    ]

    # Row 5: mid platforms
    row5 = [
        B['ladder'], B['platform'], B['platform'], B['platform'],
        B['brick_a'], B['brick_b'], B['brick_a'], B['brick_b'],
        B['brick_a'], B['brick_b'], B['platform'], B['platform'],
        B['platform'], B['brick_b'], B['brick_a'], B['brick_b'],
    ]

    # Row 6: candelabra area
    row6 = [
        B['brick_a'], B['brick_b'], B['brick_a'], B['brick_b'],
        B['brick_a'], B['candelabra_f'], B['candelabra_b'], B['brick_b'],
        B['brick_a'], B['brick_b'], B['brick_a'], B['candelabra_f'],
        B['candelabra_b'], B['brick_b'], B['brick_a'], B['brick_b'],
    ]

    # Row 7: player area
    row7 = [
        B['brick_a'], B['brick_b'], B['brick_a'], B['torch'],
        B['brick_b'], B['brick_a'], B['brick_b'], B['player_top'],
        B['brick_a'], B['brick_b'], B['brick_a'], B['brick_b'],
        B['torch'], B['brick_b'], B['brick_a'], B['brick_b'],
    ]

    # Row 8: player legs + bookshelf
    row8 = [
        B['brick_a'], B['bookshelf'], B['brick_a'], B['brick_b'],
        B['brick_a'], B['brick_b'], B['brick_a'], B['player_bot'],
        B['brick_b'], B['brick_a'], B['brick_b'], B['brick_a'],
        B['brick_b'], B['bookshelf'], B['brick_a'], B['curtain'],
    ]

    # Row 9: main platform
    row9 = [
        B['brick_a'], B['brick_b'], B['platform'], B['platform'],
        B['platform'], B['platform'], B['platform'], B['platform'],
        B['platform'], B['platform'], B['platform'], B['platform'],
        B['platform'], B['platform'], B['brick_b'], B['brick_a'],
    ]

    # Row 10: underground
    row10 = [
        B['ground'], B['ground'], B['ground'], B['ground'],
        B['ground'], B['ground'], B['ground'], B['ground'],
        B['ground'], B['ground'], B['ground'], B['ground'],
        B['ground'], B['ground'], B['ground'], B['ground'],
    ]

    # Row 11: underground
    row11 = list(row10)

    return [row0, row1, row2, row3, row4, row5, row6, row7, row8, row9, row10, row11]


# ============================================================
# RENDERING
# ============================================================

def render_full_screen(tiles, tilemap):
    """Compose full 256x192 screen from tile grid."""
    screen = [[0] * SCREEN_W for _ in range(SCREEN_H)]
    for gy in range(GRID_ROWS):
        for gx in range(GRID_COLS):
            tid = tilemap[gy][gx]
            tile = tiles[tid]
            for ty in range(TILE_H):
                for tx in range(TILE_W):
                    sx = gx * TILE_W + tx
                    sy = gy * TILE_H + ty
                    screen[sy][sx] = tile[ty][tx]
    return screen


def pack_screen5(pixels):
    """Pack to Screen 5 4bpp format."""
    data = bytearray()
    for y in range(SCREEN_H):
        row = pixels[y]
        for x in range(0, SCREEN_W, 2):
            data.append(((row[x] & 0x0F) << 4) | (row[x + 1] & 0x0F))
    return data


def pack_tileset(tiles):
    """Pack tileset into raw bytes (each tile = 128 bytes in Screen 5 format)."""
    data = bytearray()
    for tid in sorted(tiles.keys()):
        tile = tiles[tid]
        # Pack 16x16 tile: 16 rows, each row = 8 bytes (16 pixels / 2)
        for y in range(TILE_H):
            row = tile[y]
            for x in range(0, TILE_W, 2):
                data.append(((row[x] & 0x0F) << 4) | (row[x + 1] & 0x0F))
    return data


def palette_to_vdp(pal):
    """Convert RGB palette to VDP format."""
    out = bytearray()
    for r, g, b in pal:
        out.append(((r & 7) << 4) | (b & 7))
        out.append(g & 7)
    return out


# ============================================================
# ASM GENERATION
# ============================================================

def generate_asm(bitmap, tilemap_flat, palette, num_tiles, asm_path):
    """Generate ASM with tile system metadata + bitmap."""
    L = []
    a = L.append

    a("; ============================================")
    a("; Castlevania Scene - MSX2 Screen 5")
    a("; 16x16 Multicolor Tile System")
    a("; ============================================")
    a("")
    a("; BIOS")
    a("LDIRVM  EQU #005C")
    a("WRTVDP  EQU #0047")
    a("CHGMOD  EQU #005F")
    a("ENASCR  EQU #0044")
    a("DISSCR  EQU #0041")
    a("RSLREG  EQU #0138")
    a("ENASLT  EQU #0024")
    a("CHGET   EQU #009F")
    a("")
    a(f"NUM_TILE_TYPES EQU {num_tiles}")
    a("GRID_COLS EQU 16")
    a("GRID_ROWS EQU 12")
    a("TILE_SIZE EQU 128  ; 16x16 @ 4bpp = 128 bytes")
    a("BITMAP_SIZE EQU 24576")
    a("")
    a("    org #4000")
    a("")
    a("    db \"AB\"")
    a("    dw init_rom")
    a("    dw 0, 0, 0, 0, 0, 0")
    a("")
    a("init_rom:")
    a("    di")
    a("")
    a("    ; Map page2 to cart slot")
    a("    call RSLREG")
    a("    rrca")
    a("    rrca")
    a("    and #03")
    a("    ld c, a")
    a("    ld b, 0")
    a("    ld hl, #FCC1")
    a("    add hl, bc")
    a("    ld a, (hl)")
    a("    and #80")
    a("    jr z, .slot_ok")
    a("    or c")
    a("    ld c, a")
    a("    inc hl")
    a("    inc hl")
    a("    inc hl")
    a("    inc hl")
    a("    ld a, (hl)")
    a("    and #0C")
    a(".slot_ok:")
    a("    or c")
    a("    ld h, #80")
    a("    call ENASLT")
    a("")
    a("    ; Screen 5 mode")
    a("    call DISSCR")
    a("    ld a, 5")
    a("    call CHGMOD")
    a("    ld bc, #0007")
    a("    call WRTVDP")
    a("")
    a("    ; Load palette")
    a("    call load_palette")
    a("")
    a("    ; Upload bitmap to VRAM #0000")
    a("    ld hl, bitmap_data")
    a("    ld de, #0000")
    a("    ld bc, BITMAP_SIZE")
    a("    call LDIRVM")
    a("")
    a("    call ENASCR")
    a("    ei")
    a("")
    a("main_loop:")
    a("    halt")
    a("    jr main_loop")
    a("")
    a("load_palette:")
    a("    ld bc, #0010")
    a("    call WRTVDP")
    a("    ld hl, palette_data")
    a("    ld b, 32")
    a(".pal_loop:")
    a("    ld a, (hl)")
    a("    out (#9A), a")
    a("    inc hl")
    a("    djnz .pal_loop")
    a("    ret")
    a("")

    # Tile metadata comment
    a("; === TILE METADATA ===")
    a(f"; Total tile types: {num_tiles}")
    a("; Tile IDs:")
    for name, tid in sorted(TILE_IDS.items(), key=lambda x: x[1]):
        a(f";   {tid:2d} = {name}")
    a("; Tilemap (row-major, 16x12):")
    for gy in range(GRID_ROWS):
        row_ids = [tilemap_flat[gy * GRID_COLS + gx] for gx in range(GRID_COLS)]
        a(f";   row{gy}: {row_ids}")
    a("")

    # Palette
    names = ["black", "mortar", "dk_brick", "md_brick", "deep", "window",
             "brown", "bright", "red", "orange", "yellow", "gray",
             "green", "purple", "dk_gray", "lt_gray"]
    a("palette_data:")
    for i in range(0, len(palette), 2):
        ci = i // 2
        a(f"    db #{palette[i]:02X},#{palette[i+1]:02X}  ; {names[ci]}")
    a("")

    # Bitmap
    a("bitmap_data:")
    for i in range(0, len(bitmap), 16):
        chunk = bitmap[i:i + 16]
        hexs = ",".join(f"#{b:02X}" for b in chunk)
        a(f"    db {hexs}")

    a("")
    a("    end")

    asm_path.write_text("\n".join(L), encoding="ascii")


# ============================================================
# MAIN
# ============================================================

def main():
    root = Path(__file__).resolve().parents[1]
    out_dir = root / "test" / "castlevania"
    out_dir.mkdir(parents=True, exist_ok=True)

    asm_path = out_dir / "castlevania_tiles.asm"
    rom_path = out_dir / "castlevania_tiles.rom"

    print("=== 16x16 Multicolor Tile System ===")
    print()

    print("1. Rendering tileset...")
    tiles = render_all_tiles()
    print(f"   {len(tiles)} tile types rendered")
    for tid, tile in sorted(tiles.items()):
        name = [k for k, v in TILE_IDS.items() if v == tid][0]
        print(f"     [{tid:2d}] {name:15s} 16x16")

    print()
    print("2. Building tilemap...")
    tilemap = build_tilemap()
    # Flatten
    flat = []
    for row in tilemap:
        flat.extend(row)
    print(f"   Grid: {GRID_COLS}x{GRID_ROWS} = {len(flat)} cells")
    # Show tilemap
    for gy in range(GRID_ROWS):
        row_names = []
        for gx in range(GRID_COLS):
            tid = tilemap[gy][gx]
            name = [k for k, v in TILE_IDS.items() if v == tid][0]
            row_names.append(name[:4].upper())
        print(f"   row{gy:2d}: {' '.join(f'{n:>4}' for n in row_names)}")

    print()
    print("3. Composing full screen...")
    screen = render_full_screen(tiles, tilemap)
    print(f"   {SCREEN_W}x{SCREEN_H} pixels generated")

    print()
    print("4. Packing Screen 5 (4bpp)...")
    bitmap = pack_screen5(screen)
    print(f"   Bitmap: {len(bitmap)} bytes ({len(bitmap)/1024:.1f} KB)")

    palette = palette_to_vdp(PAL)
    print(f"   Palette: {len(palette)} bytes ({len(palette)//2} colors)")

    print()
    print("5. Generating ASM...")
    generate_asm(bitmap, flat, palette, len(tiles), asm_path)
    print(f"   {asm_path}")

    glass = root / "server" / "glass.jar"
    if not glass.exists():
        print(f"ERROR: glass.jar not found: {glass}")
        sys.exit(1)

    print()
    print("6. Compiling with glass.jar...")
    r = subprocess.run(
        ["java", "-jar", str(glass), str(asm_path), str(rom_path)],
        capture_output=True, text=True, cwd=str(root)
    )
    if r.stdout.strip():
        print(f"   {r.stdout.strip()}")
    if r.stderr.strip():
        print(f"   STDERR: {r.stderr.strip()}")
    if r.returncode != 0:
        print(f"ERROR: compilation failed (rc={r.returncode})")
        sys.exit(1)

    sz = rom_path.stat().st_size
    if sz < 32768:
        with open(rom_path, "ab") as f:
            f.write(b"\xFF" * (32768 - sz))
        print(f"   Padded to 32KB ({32768} bytes)")
    else:
        print(f"   ROM: {sz} bytes")

    openmsx = shutil.which("openmsx") or shutil.which("openmsx.exe")
    if not openmsx:
        for c in [r"C:\Program Files\openMSX\openmsx.exe",
                   r"C:\Program Files (x86)\openMSX\openmsx.exe",
                   r"C:\openMSX\openmsx.exe"]:
            if Path(c).exists():
                openmsx = c
                break

    if not openmsx:
        print(f"   ROM: {rom_path}")
        print("   openMSX not found")
        return

    print()
    print("7. Launching openMSX...")
    subprocess.Popen([openmsx, "-machine", "C-BIOS_MSX2", "-cart", str(rom_path)])
    print("   Done!")


if __name__ == "__main__":
    main()
