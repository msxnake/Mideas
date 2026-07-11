#!/usr/bin/env python3
"""Generate a Castlevania-inspired MSX2 Screen 5 bitmap scene."""

import shutil
import subprocess
import sys
from pathlib import Path

WIDTH = 256
HEIGHT = 192

# Custom palette for castlevania scene (R, G, B values 0-7 each)
CASTLEVANIA_PALETTE = [
    (0, 0, 0),  # 0: black
    (0, 0, 2),  # 1: very dark blue (mortar)
    (1, 1, 5),  # 2: dark blue (brick body)
    (2, 3, 7),  # 3: medium blue (brick highlight)
    (0, 0, 1),  # 4: near black (deep bg)
    (2, 5, 7),  # 5: light blue (window glass)
    (5, 3, 0),  # 6: brown (wood/ladders)
    (4, 6, 7),  # 7: bright blue (highlights)
    (7, 1, 0),  # 8: red
    (7, 4, 0),  # 9: orange
    (7, 6, 1),  # 10: yellow (candle)
    (5, 5, 5),  # 11: medium gray
    (1, 4, 1),  # 12: dark green
    (5, 1, 4),  # 13: purple
    (2, 2, 2),  # 14: dark gray
    (6, 6, 6),  # 15: light gray
]

C_BLACK = 0; C_MORTAR = 1; C_BRICK = 2; C_BRICK_HI = 3
C_DEEP = 4; C_WINDOW = 5; C_WOOD = 6; C_BRIGHT = 7
C_RED = 8; C_ORANGE = 9; C_YELLOW = 10; C_GRAY = 11
C_GREEN = 12; C_PURPLE = 13; C_DKGRAY = 14; C_LTGRAY = 15
C_BLUE = 4


def new_screen():
    return [[0] * WIDTH for _ in range(HEIGHT)]


def rect(scr, x0, y0, w, h, c):
    for y in range(max(0, y0), min(y0 + h, HEIGHT)):
        row = scr[y]
        for x in range(max(0, x0), min(x0 + w, WIDTH)):
            row[x] = c


def hline(scr, x0, x1, y, c):
    if 0 <= y < HEIGHT:
        row = scr[y]
        for x in range(max(0, x0), min(x1 + 1, WIDTH)):
            row[x] = c


def vline(scr, x, y0, y1, c):
    if 0 <= x < WIDTH:
        for y in range(max(0, y0), min(y1 + 1, HEIGHT)):
            scr[y][x] = c


def draw_bricks(scr, x0, y0, w, h, brick_c, mortar_c, hi_c=None):
    bh, bw = 8, 16
    for row, yy in enumerate(range(y0, y0 + h, bh)):
        off = (bw // 2) if (row % 2) else 0
        for xx in range(x0 - off, x0 + w + bw, bw):
            for dy in range(bh):
                ny = yy + dy
                if ny >= y0 + h or ny < y0:
                    break
                for dx in range(bw):
                    nx = xx + dx
                    if nx < x0 or nx >= x0 + w:
                        continue
                    scr[ny][nx] = mortar_c if dy == 0 or dx == 0 else brick_c
            if hi_c:
                for dx in range(1, bw):
                    nx = xx + dx
                    ny = yy + 1
                    if x0 <= nx < x0 + w and y0 <= ny < y0 + h:
                        scr[ny][nx] = hi_c


def draw_window(scr, cx, yt):
    rect(scr, cx - 7, yt + 6, 15, 26, C_BRIGHT)
    rect(scr, cx - 5, yt + 4, 11, 2, C_BRIGHT)
    rect(scr, cx - 3, yt + 2, 7, 2, C_BRIGHT)
    rect(scr, cx - 1, yt, 3, 2, C_BRIGHT)
    rect(scr, cx - 5, yt + 7, 11, 23, C_DEEP)
    vline(scr, cx, yt + 5, yt + 29, C_BRIGHT)
    for i in range(4):
        hline(scr, cx - 5, cx + 5, yt + 10 + i * 5, C_BRIGHT)


def draw_ladder(scr, x, yt, h):
    rect(scr, x, yt, 2, h, C_WOOD)
    rect(scr, x + 8, yt, 2, h, C_WOOD)
    for ry in range(yt + 4, yt + h, 6):
        hline(scr, x, x + 10, ry, C_YELLOW)
        hline(scr, x, x + 10, ry + 1, C_WOOD)


def draw_platform(scr, x, y, w):
    rect(scr, x, y, w, 6, C_LTGRAY)
    hline(scr, x, x + w - 1, y, C_BRIGHT)
    hline(scr, x, x + w - 1, y + 1, C_GRAY)
    rect(scr, x + 2, y + 6, w - 4, 2, C_DKGRAY)
    for bx in range(x, x + w, 8):
        vline(scr, bx, y + 2, y + 5, C_DKGRAY)


def draw_candelabra(scr, x, yb):
    rect(scr, x, yb - 30, 2, 30, C_GRAY)
    rect(scr, x - 10, yb - 30, 22, 2, C_GRAY)
    rect(scr, x - 9, yb - 38, 4, 8, C_YELLOW)
    rect(scr, x - 8, yb - 40, 2, 2, C_YELLOW)
    rect(scr, x - 8, yb - 44, 2, 4, C_ORANGE)
    if yb - 45 >= 0:
        scr[yb - 45][x - 8] = C_RED
        scr[yb - 45][x - 7] = C_RED
    rect(scr, x + 6, yb - 38, 4, 8, C_YELLOW)
    rect(scr, x + 7, yb - 40, 2, 2, C_YELLOW)
    rect(scr, x + 7, yb - 44, 2, 4, C_ORANGE)
    if yb - 45 >= 0:
        scr[yb - 45][x + 7] = C_RED
        scr[yb - 45][x + 8] = C_RED


def draw_bookshelf(scr, x, yt):
    rect(scr, x, yt, 18, 24, C_WOOD)
    rect(scr, x + 1, yt + 1, 16, 7, C_DEEP)
    rect(scr, x + 1, yt + 10, 16, 7, C_DEEP)
    rect(scr, x + 1, yt + 18, 16, 5, C_DEEP)
    books = [C_RED, C_BLUE, C_GREEN, C_RED, C_PURPLE, C_BLUE, C_RED, C_ORANGE]
    for i, bc in enumerate(books[:8]):
        bx = x + 2 + i * 2
        for dy in [2, 3, 4, 5, 11, 12, 13, 19, 20]:
            ny = yt + dy
            if 0 <= ny < HEIGHT and 0 <= bx < WIDTH:
                scr[ny][bx] = bc


def draw_bat(scr, x, y):
    bat = ["#.##.#", "######", ".#..#."]
    for dy, row in enumerate(bat):
        for dx, ch in enumerate(row):
            if ch == "#":
                ny, nx = y + dy, x + dx
                if 0 <= ny < HEIGHT and 0 <= nx < WIDTH:
                    scr[ny][nx] = C_PURPLE


def draw_player(scr, x, y):
    rect(scr, x + 1, y, 6, 2, C_WOOD)
    rect(scr, x + 2, y - 1, 4, 1, C_WOOD)
    rect(scr, x + 2, y + 2, 4, 3, C_GRAY)
    scr[y + 2][x + 3] = C_BLACK
    scr[y + 2][x + 5] = C_BLACK
    rect(scr, x + 1, y + 5, 6, 5, C_BRIGHT)
    rect(scr, x + 2, y + 6, 4, 3, C_GRAY)
    hline(scr, x + 1, x + 6, y + 10, C_WOOD)
    rect(scr, x - 1, y + 6, 2, 3, C_GRAY)
    rect(scr, x + 7, y + 6, 2, 3, C_GRAY)
    rect(scr, x + 8, y + 5, 12, 1, C_WOOD)
    rect(scr, x + 20, y + 4, 1, 2, C_GRAY)
    rect(scr, x + 2, y + 11, 2, 4, C_BLUE)
    rect(scr, x + 5, y + 11, 2, 4, C_BLUE)
    rect(scr, x + 1, y + 15, 3, 1, C_WOOD)
    rect(scr, x + 5, y + 15, 3, 1, C_WOOD)


def draw_torch(scr, x, y):
    rect(scr, x, y + 10, 4, 3, C_GRAY)
    rect(scr, x + 1, y + 6, 2, 4, C_WOOD)
    rect(scr, x, y + 2, 4, 4, C_ORANGE)
    rect(scr, x + 1, y, 2, 2, C_RED)
    if y - 1 >= 0:
        scr[y - 1][x + 1] = C_YELLOW
        scr[y - 1][x + 2] = C_YELLOW


def generate_scene():
    scr = new_screen()
    draw_bricks(scr, 0, 0, WIDTH, HEIGHT, C_BRICK, C_MORTAR, C_BRICK_HI)
    for y in range(0, 50):
        for x in range(0, WIDTH):
            if scr[y][x] == C_BRICK:
                scr[y][x] = C_DEEP
    draw_window(scr, 80, 10)
    draw_window(scr, 170, 10)
    draw_ladder(scr, 4, 0, 130)
    draw_ladder(scr, 240, 35, 130)
    draw_platform(scr, 48, 170, 165)
    draw_platform(scr, 18, 120, 55)
    draw_platform(scr, 178, 100, 65)
    draw_platform(scr, 118, 130, 44)
    draw_platform(scr, 158, 40, 82)
    draw_candelabra(scr, 100, 170)
    draw_candelabra(scr, 180, 170)
    draw_bookshelf(scr, 24, 144)
    draw_bookshelf(scr, 210, 76)
    draw_torch(scr, 55, 128)
    draw_torch(scr, 230, 108)
    draw_player(scr, 128, 148)
    draw_bat(scr, 198, 84)
    rect(scr, 0, 178, 256, 14, C_DKGRAY)
    draw_bricks(scr, 0, 178, 256, 14, C_BRICK, C_DKGRAY)
    rect(scr, 220, 38, 36, 64, C_GRAY)
    draw_bricks(scr, 220, 38, 36, 64, C_LTGRAY, C_DKGRAY, C_BRIGHT)
    rect(scr, 138, 58, 42, 32, C_DEEP)
    draw_bricks(scr, 138, 58, 42, 32, C_BRICK, C_MORTAR, C_BRICK_HI)
    rect(scr, 248, 158, 8, 34, C_RED)
    rect(scr, 250, 156, 4, 2, C_ORANGE)
    return scr


def pack_screen5(pixels):
    data = bytearray()
    for y in range(HEIGHT):
        row = pixels[y]
        for x in range(0, WIDTH, 2):
            data.append(((row[x] & 0x0F) << 4) | (row[x + 1] & 0x0F))
    return data


def palette_to_vdp(pal):
    out = bytearray()
    for r, g, b in pal:
        out.append(((r & 7) << 4) | (b & 7))
        out.append(g & 7)
    return out


def generate_asm(bitmap, palette, asm_path):
    L = []
    a = L.append

    a("; Castlevania Scene - MSX2 Screen 5 Bitmap")
    a("; Auto-generated by castlevania_scene.py")
    a("")
    a("LDIRVM  EQU #005C")
    a("WRTVDP  EQU #0047")
    a("CHGMOD  EQU #005F")
    a("ENASCR  EQU #0044")
    a("DISSCR  EQU #0041")
    a("RSLREG  EQU #0138")
    a("ENASLT  EQU #0024")
    a("CHGET   EQU #009F")
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
    a("    ; Map page2 (#8000) to cart slot (needed for bitmap data)")
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
    a("    ; Set Screen 5 mode")
    a("    call DISSCR")
    a("    ld a, 5")
    a("    call CHGMOD")
    a("")
    a("    ; Border = black")
    a("    ld bc, #0007")
    a("    call WRTVDP")
    a("")
    a("    ; Load palette")
    a("    call load_palette")
    a("")
    a("    ; Upload bitmap to VRAM #0000")
    a("    ld hl, bitmap_data")
    a("    ld de, #0000")
    a("    ld bc, 24576")
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
    a("    ; Select palette register 0: write 0 to R#16")
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

    # Palette
    names = ["black", "dk_blue_mortar", "dk_blue", "md_blue", "near_black",
             "lt_blue", "brown", "bright_blue", "red", "orange",
             "yellow", "gray", "dk_green", "purple", "dk_gray", "lt_gray"]
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


def main():
    root = Path(__file__).resolve().parents[1]
    out_dir = root / "test" / "castlevania"
    out_dir.mkdir(parents=True, exist_ok=True)

    asm_path = out_dir / "castlevania.asm"
    rom_path = out_dir / "castlevania.rom"

    print("1. Generating scene pixels...")
    pixels = generate_scene()

    print("2. Packing Screen 5 (4bpp)...")
    bitmap = pack_screen5(pixels)
    print(f"   {len(bitmap)} bytes ({len(bitmap)/1024:.1f} KB)")

    print("3. VDP palette encoding...")
    palette = palette_to_vdp(CASTLEVANIA_PALETTE)

    print("4. Generating ASM...")
    generate_asm(bitmap, palette, asm_path)
    print(f"   {asm_path}")

    glass = root / "server" / "glass.jar"
    if not glass.exists():
        print(f"ERROR: glass.jar not found: {glass}")
        sys.exit(1)

    print("5. Compiling with glass.jar...")
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
        print(f"   ROM ready at: {rom_path}")
        print("   openMSX not found - launch manually")
        return

    print(f"6. Launching openMSX...")
    subprocess.Popen([openmsx, "-machine", "C-BIOS_MSX2", "-cart", str(rom_path)])


if __name__ == "__main__":
    main()
