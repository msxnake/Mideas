#!/usr/bin/env python3
"""Build and test a minimal MSX2 SCREEN 4 vertical-scroll demo.

The ROM demonstrates the conservative MSX2 scroll path: a two-screen virtual
tile field streams through SCREEN 4 while V9938 register R#23 provides the
fine vertical offset. It intentionally does not claim horizontal hardware
scroll support for standard MSX2.
"""

import argparse
import shutil
import sys
from pathlib import Path

from build_msx2screen_layers_smoke import (
    read_png_rgb,
    read_probe_values,
    repo_root_from_script,
    run_command,
)


ROM_BLOCK_SIZE = 8192
SCROLL_FINE_RAM = 0xC100
SCROLL_FRAME_RAM = 0xC101
SCROLL_TOP_ROW_RAM = 0xC102
VIRTUAL_ROWS = 48
VISIBLE_ROWS = 24
SCREEN4_COLUMNS = 32


def parse_args() -> argparse.Namespace:
    root = repo_root_from_script()
    out = root / "test" / "msx2-screen4" / "out"
    parser = argparse.ArgumentParser(description="Build and test an MSX2 SCREEN 4 two-screen R#23 vertical-scroll demo")
    parser.add_argument("--project-root", default=str(root), help="Mideas repository root")
    parser.add_argument("--asm-output", default=str(out / "msx2screen4-scroll-demo.asm"), help="Output ASM path")
    parser.add_argument("--rom-output", default=str(out / "msx2screen4-scroll-demo.rom"), help="Output ROM path")
    parser.add_argument("--sym-output", default=str(out / "msx2screen4-scroll-demo.sym"), help="Output Glass symbols path")
    parser.add_argument("--screenshot-output", default=str(out / "msx2screen4-scroll-demo.png"), help="Output OpenMSX screenshot path")
    parser.add_argument("--probe-output", default=str(out / "msx2screen4-scroll-demo-probe.txt"), help="Output OpenMSX probe path")
    parser.add_argument("--glass", help="Explicit path to glass.jar")
    parser.add_argument("--openmsx", help="Explicit openmsx executable path")
    parser.add_argument("--machine", default="C-BIOS_MSX2", help="OpenMSX machine id")
    parser.add_argument("--skip-openmsx", action="store_true", help="Build and static-check only")
    parser.add_argument("--boot-wait-ms", type=int, default=6000, help="Wait before input replay")
    parser.add_argument("--capture-wait-ms", type=int, default=1800, help="Wait before screenshot after boot")
    return parser.parse_args()


def byte_lines(label: str, values: list[int], comment: str = "") -> str:
    lines = [f"{label}:"]
    if comment:
        lines.append(f"    ; {comment}")
    for index in range(0, len(values), 16):
        chunk = ",".join(f"#{value & 0xFF:02X}" for value in values[index:index + 16])
        lines.append(f"    DB {chunk}")
    return "\n".join(lines)


def set_char(patterns: list[int], colors: list[int], char_code: int, pattern: list[int], color: int) -> None:
    start = char_code * 8
    patterns[start:start + 8] = pattern[:8]
    colors[start:start + 8] = [color & 0xFF] * 8


def alloc_mask_char(
    patterns: list[int],
    colors: list[int],
    next_char: int,
    mask: list[list[int]],
    color: int,
) -> tuple[int, int]:
    pattern_bytes: list[int] = []
    for row in mask:
        value = 0
        for bit in row[:8]:
            value = ((value << 1) | (1 if bit else 0)) & 0xFF
        pattern_bytes.append(value)
    set_char(patterns, colors, next_char, pattern_bytes, color)
    return next_char, next_char + 1


def stamp_pixel_sprite(
    rows: list[list[int]],
    patterns: list[int],
    colors: list[int],
    next_char: int,
    left: int,
    top: int,
    width: int,
    height: int,
    color: int,
    predicate,
) -> int:
    for tile_y in range((height + 7) // 8):
        for tile_x in range((width + 7) // 8):
            mask = [[0 for _ in range(8)] for _ in range(8)]
            has_pixels = False
            for py in range(8):
                for px in range(8):
                    world_x = tile_x * 8 + px
                    world_y = tile_y * 8 + py
                    if world_x >= width or world_y >= height:
                        continue
                    if predicate(world_x, world_y):
                        mask[py][px] = 1
                        has_pixels = True
            if not has_pixels:
                continue
            char_code, next_char = alloc_mask_char(patterns, colors, next_char, mask, color)
            cell_x = left + tile_x
            cell_y = top + tile_y
            if 0 <= cell_x < SCREEN4_COLUMNS and 0 <= cell_y < VIRTUAL_ROWS:
                rows[cell_y][cell_x] = char_code
    return next_char


def build_virtual_map(patterns: list[int], colors: list[int], next_char: int) -> tuple[list[list[int]], int]:
    rows: list[list[int]] = []
    for y in range(VIRTUAL_ROWS):
        row: list[int] = []
        for x in range(SCREEN4_COLUMNS):
            value = (x * 19 + y * 31 + x * y * 5) % 137
            if value in (1, 2, 3, 5):
                row.append(2)
            elif value in (17, 23):
                row.append(3)
            elif value in (41, 89):
                row.append(4)
            else:
                row.append(0)
        rows.append(row)

    def ringed_planet(px: int, py: int) -> bool:
        cx = 23
        cy = 18
        dx = px - cx
        dy = py - cy
        ring = abs((dy * 3) - (dx // 2)) <= 4 and 5 <= abs(dx) <= 22
        body = dx * dx + dy * dy <= 11 * 11
        return ring or body

    def ring_shadow(px: int, py: int) -> bool:
        cx = 23
        cy = 18
        dx = px - cx
        dy = py - cy
        return dx * dx + dy * dy <= 11 * 11 and (dx < -2 or dy > 5)

    def blue_planet(px: int, py: int) -> bool:
        cx = 20
        cy = 20
        dx = px - cx
        dy = py - cy
        return dx * dx + dy * dy <= 14 * 14

    def blue_clouds(px: int, py: int) -> bool:
        cx = 20
        cy = 20
        dx = px - cx
        dy = py - cy
        inside = dx * dx + dy * dy <= 14 * 14
        bands = abs(py - 14 - (px // 8)) <= 1 or abs(py - 23 + (px // 10)) <= 1
        return inside and bands

    next_char = stamp_pixel_sprite(rows, patterns, colors, next_char, 19, 5, 40, 32, 0x61, ringed_planet)
    next_char = stamp_pixel_sprite(rows, patterns, colors, next_char, 19, 5, 40, 32, 0x81, ring_shadow)
    next_char = stamp_pixel_sprite(rows, patterns, colors, next_char, 5, 28, 40, 40, 0x41, blue_planet)
    next_char = stamp_pixel_sprite(rows, patterns, colors, next_char, 5, 28, 40, 40, 0xB1, blue_clouds)
    return rows, next_char


def build_screen4_data() -> tuple[list[int], list[int], list[list[int]]]:
    patterns: list[int] = []
    colors: list[int] = []
    for char_code in range(256):
        patterns.extend([0x00] * 8)
        colors.extend([0x00] * 8)

    set_char(patterns, colors, 2, [0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00], 0xF0)
    set_char(patterns, colors, 3, [0x00, 0x10, 0x38, 0x10, 0x00, 0x00, 0x00, 0x00], 0xF0)
    set_char(patterns, colors, 4, [0x00, 0x44, 0x28, 0x10, 0x28, 0x44, 0x00, 0x00], 0xE0)
    rows, _next_char = build_virtual_map(patterns, colors, 20)
    return patterns, colors, rows


def format_virtual_rows(rows: list[list[int]]) -> str:
    blocks: list[str] = []
    for index, row in enumerate(rows):
        label = f"virtual_star_row_{index:02d}"
        blocks.append(byte_lines(label, row))
    pointer_table = ["virtual_star_row_ptrs:"]
    for index in range(len(rows)):
        pointer_table.append(f"    DW virtual_star_row_{index:02d}")
    return "\n".join(pointer_table + [""] + blocks)


def build_asm() -> str:
    patterns, colors, rows = build_screen4_data()
    return f"""; ==================================================================
; Mideas MSX2 SCREEN 4 vertical scroll demo
; Demonstrates a two-screen SCREEN 4 starfield with reverse vertical scroll.
; Fine movement uses V9938 R#23; tile rows stream through the name table.
; The virtual 48-row map loops forever: row 0 wraps back to row 47.
; Horizontal hardware scroll is intentionally not part of this standard MSX2 demo.
; ==================================================================

CHGMOD  EQU #005F
DISSCR  EQU #0041
ENASCR  EQU #0044
FILVRM  EQU #0056
WRTVDP  EQU #0047
LDIRVM  EQU #005C
CHGCLR  EQU #0062
HKEY    EQU #F3DB
CLIKSW  EQU #F3DC
BAKCLR  EQU #F3E9
BDRCLR  EQU #F3EA

VDP_PALETTE_PORT EQU #9A
SCREEN4_PATTERN_VRAM EQU #0000
SCREEN4_NAME_VRAM    EQU #1800
SCREEN4_COLOR_VRAM   EQU #2000
SCREEN4_PATTERN_SIZE EQU #1800
SCREEN4_NAME_SIZE    EQU #0300
SCREEN4_COLOR_SIZE   EQU #1800
MSX2_SCROLL_FINE     EQU #{SCROLL_FINE_RAM:04X}
MSX2_SCROLL_FRAME    EQU #{SCROLL_FRAME_RAM:04X}
MSX2_SCROLL_TOP_ROW  EQU #{SCROLL_TOP_ROW_RAM:04X}

    org #4000

    db "AB"
    dw init_rom
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0

init_rom:
    di
    im 1
    ld sp, #F380

    ld a, #C9
    ld (HKEY), a
    xor a
    ld (CLIKSW), a
    ld (BAKCLR), a
    ld (BDRCLR), a
    ld (MSX2_SCROLL_FINE), a
    ld (MSX2_SCROLL_FRAME), a
    ld (MSX2_SCROLL_TOP_ROW), a
    call CHGCLR

    call DISSCR
    ld a, 4
    call CHGMOD
    ld bc, #0007
    call WRTVDP
    call load_screen4_palette
    call load_screen4_demo
    call redraw_virtual_starfield

    ; R#23 is the V9938 vertical scroll start line. Start at zero.
    xor a
    ld b, a
    ld c, 23
    call WRTVDP

    call ENASCR
    ei

main_loop:
    halt
    call update_vertical_scroll_r23
    jr main_loop

update_vertical_scroll_r23:
    ld a, (MSX2_SCROLL_FRAME)
    inc a
    ld (MSX2_SCROLL_FRAME), a

    ld a, (MSX2_SCROLL_FINE)
    or a
    jr nz, .decrement_fine
    ld a, 7
    jr .store_fine_wrap
.decrement_fine:
    dec a
.store_fine:
    ld (MSX2_SCROLL_FINE), a
    ld b, a
    ld c, 23
    call WRTVDP
    ld a, (MSX2_SCROLL_FINE)
    cp 7
    ret nz
.store_fine_wrap:
    ld (MSX2_SCROLL_FINE), a
    ld b, a
    ld c, 23
    call WRTVDP
    ld a, (MSX2_SCROLL_TOP_ROW)
    or a
    jr nz, .decrement_top_row
    ld a, 47
    jr .store_top_row
.decrement_top_row:
    dec a
.store_top_row:
    ld (MSX2_SCROLL_TOP_ROW), a
    call redraw_virtual_starfield
    ret

redraw_virtual_starfield:
    ld c, 0
.row_loop:
    ld a, (MSX2_SCROLL_TOP_ROW)
    add a, c
    cp 48
    jr c, .row_in_range
    sub 48
.row_in_range:
    ld b, c
    push bc
    call copy_virtual_row_to_physical
    pop bc
    inc c
    ld a, c
    cp 24
    jr nz, .row_loop
    ret

copy_virtual_row_to_physical:
    ; Input: A = virtual row 0..47, B = physical SCREEN 4 name row 0..23.
    push bc
    call get_virtual_row_ptr
    pop bc
    push hl
    ld a, b
    call get_name_row_addr
    call set_vram_write_hl
    pop hl
    ld b, 32
.copy_loop:
    ld a, (hl)
    out (#98), a
    inc hl
    djnz .copy_loop
    ret

get_virtual_row_ptr:
    ld h, 0
    ld l, a
    add hl, hl
    ld de, virtual_star_row_ptrs
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ex de, hl
    ret

get_name_row_addr:
    ld h, 0
    ld l, a
    add hl, hl
    ld de, screen4_name_row_ptrs
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ex de, hl
    ret

set_vram_write_hl:
    di
    in a, (#99)
    ld a, l
    out (#99), a
    nop
    ld a, h
    or #40
    out (#99), a
    ei
    ret

load_screen4_demo:
    xor a
    ld hl, SCREEN4_PATTERN_VRAM
    ld bc, SCREEN4_PATTERN_SIZE
    call FILVRM
    xor a
    ld hl, SCREEN4_NAME_VRAM
    ld bc, SCREEN4_NAME_SIZE
    call FILVRM
    xor a
    ld hl, SCREEN4_COLOR_VRAM
    ld bc, SCREEN4_COLOR_SIZE
    call FILVRM

    ld hl, screen4_demo_patterns
    ld de, SCREEN4_PATTERN_VRAM
    ld bc, SCREEN4_PATTERN_SIZE
    call LDIRVM

    ld hl, screen4_demo_colors
    ld de, SCREEN4_COLOR_VRAM
    ld bc, SCREEN4_COLOR_SIZE
    call LDIRVM

    ret

load_screen4_palette:
    ; R#16 selects palette register 0; port #9A receives 2 bytes per slot.
    ld bc, #0010
    call WRTVDP
    ld hl, screen4_palette_data
    ld b, 32
.palette_loop:
    ld a, (hl)
    out (VDP_PALETTE_PORT), a
    inc hl
    djnz .palette_loop
    ret

{byte_lines("screen4_demo_patterns", patterns * 3, "Three SCREEN 4 pattern banks, 256 chars per bank.")}

{byte_lines("screen4_demo_colors", colors * 3, "Three SCREEN 4 color banks, matching the pattern banks.")}

screen4_palette_data:
    ; RGB333 palette bytes: byte1=(R<<4)|B, byte2=G. Deliberately few colors.
    DB #00,#00,#00,#00,#11,#03,#33,#06,#13,#02,#35,#04,#71,#03,#73,#04
    DB #51,#01,#23,#05,#15,#01,#77,#06,#77,#05,#77,#07,#75,#06,#77,#07

screen4_name_row_ptrs:
    DW #1800,#1820,#1840,#1860,#1880,#18A0,#18C0,#18E0
    DW #1900,#1920,#1940,#1960,#1980,#19A0,#19C0,#19E0
    DW #1A00,#1A20,#1A40,#1A60,#1A80,#1AA0,#1AC0,#1AE0

{format_virtual_rows(rows)}
"""


def resolve_glass(project_root: Path, explicit: str | None) -> Path:
    candidates = [Path(explicit).expanduser()] if explicit else []
    candidates.extend([project_root / "server" / "glass.jar", project_root / "test" / "glass.jar"])
    for candidate in candidates:
        if candidate.exists():
            return candidate.resolve()
    raise FileNotFoundError("glass.jar not found in server/ or test/. Use --glass.")


def resolve_openmsx(explicit: str | None) -> str:
    candidates = [Path(explicit).expanduser()] if explicit else []
    found = shutil.which("openmsx.exe") or shutil.which("openmsx")
    if found:
        candidates.append(Path(found))
    candidates.extend([
        Path(r"C:\Program Files\openMSX\openmsx.exe"),
        Path(r"C:\Program Files (x86)\openMSX\openmsx.exe"),
        Path(r"C:\openMSX\openmsx.exe"),
    ])
    for candidate in candidates:
        if candidate.exists():
            return str(candidate.resolve())
    raise FileNotFoundError("openMSX executable not found. Use --openmsx or --skip-openmsx.")


def write_asm(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(build_asm(), encoding="utf-8")


def compile_rom(project_root: Path, glass: Path, asm_output: Path, rom_output: Path, sym_output: Path) -> None:
    rom_output.parent.mkdir(parents=True, exist_ok=True)
    rom_output.unlink(missing_ok=True)
    sym_output.unlink(missing_ok=True)
    run_command(["java", "-jar", str(glass), str(asm_output), str(rom_output), str(sym_output)], cwd=project_root)
    size = rom_output.stat().st_size
    padding = (-size) % ROM_BLOCK_SIZE
    if padding:
        with rom_output.open("ab") as handle:
            handle.write(b"\xFF" * padding)
        size += padding
    if size < 8192 or size % ROM_BLOCK_SIZE != 0:
        raise RuntimeError(f"Expected an 8KB-aligned demo ROM, got {size} bytes")
    if rom_output.read_bytes()[:2] != b"AB":
        raise RuntimeError("Demo ROM does not start with the MSX cartridge header")
    print(f"ROM ready: {rom_output} ({size} bytes)")


def validate_asm(path: Path) -> None:
    asm = path.read_text(encoding="utf-8", errors="replace")
    required = [
        "Mideas MSX2 SCREEN 4 vertical scroll demo",
        "ld a, 4",
        "call CHGMOD",
        "ld c, 23",
        "call WRTVDP",
        "MSX2_SCROLL_FINE",
        "MSX2_SCROLL_TOP_ROW",
        "redraw_virtual_starfield",
        "screen4_demo_patterns",
        "screen4_demo_colors",
        "virtual_star_row_ptrs",
        "virtual_star_row_47",
    ]
    missing = [needle for needle in required if needle not in asm]
    if missing:
        raise RuntimeError("Scroll demo ASM is missing expected signals: " + ", ".join(missing))


def validate_probe(path: Path) -> None:
    values = read_probe_values(path)
    for key in ("scroll_fine", "scroll_frame", "scroll_top_row"):
        if key not in values:
            raise RuntimeError(f"OpenMSX scroll probe is missing {key}")
    if values["scroll_frame"] == 0 or values["scroll_top_row"] == 0:
        raise RuntimeError(
            f"Scroll probe did not advance: scroll_fine={values['scroll_fine']:02X}, "
            f"scroll_frame={values['scroll_frame']:02X}, scroll_top_row={values['scroll_top_row']:02X}"
        )
    print(
        f"Scroll probe check passed: scroll_fine={values['scroll_fine']:02X}, "
        f"scroll_frame={values['scroll_frame']:02X}, scroll_top_row={values['scroll_top_row']:02X}"
    )


def validate_screenshot(path: Path) -> None:
    width, height, pixels = read_png_rgb(path)
    if width < 256 or height < 192:
        raise RuntimeError(f"Screenshot has unexpected dimensions: {width}x{height}")
    black_pixels = 0
    non_black = 0
    bright_stars = 0
    planet_pixels = 0
    for row in pixels:
        for r, g, b in row:
            if (r, g, b) == (0, 0, 0):
                black_pixels += 1
            else:
                non_black += 1
            if r > 180 and g > 180 and b > 160:
                bright_stars += 1
            if (b > 80 and r < 120) or (r > 140 and b > 80):
                planet_pixels += 1
    total = width * height
    if black_pixels < total * 0.70 or non_black < 250 or bright_stars < 20 or planet_pixels < 100:
        raise RuntimeError(
            "Scroll screenshot does not look like a black SCREEN 4 starfield with planets: "
            f"black={black_pixels}, non_black={non_black}, bright_stars={bright_stars}, planet_pixels={planet_pixels}"
        )
    print(
        "Scroll visual check passed: "
        f"black={black_pixels}, non_black={non_black}, bright_stars={bright_stars}, planet_pixels={planet_pixels}"
    )


def capture_openmsx(args: argparse.Namespace, project_root: Path, rom_output: Path, screenshot_output: Path, probe_output: Path) -> None:
    openmsx = resolve_openmsx(args.openmsx)
    command = [
        sys.executable,
        "scripts/capture_openmsx_action.py",
        "--project-root",
        str(project_root),
        "--rom",
        str(rom_output),
        "--machine",
        args.machine,
        "--sequence",
        "WAIT:1",
        "--boot-wait-ms",
        str(args.boot_wait_ms),
        "--capture-wait-ms",
        str(args.capture_wait_ms),
        "--output",
        str(screenshot_output),
        "--probe-output",
        str(probe_output),
        "--probe",
        f"scroll_fine:0x{SCROLL_FINE_RAM:04X}",
        "--probe",
        f"scroll_frame:0x{SCROLL_FRAME_RAM:04X}",
        "--probe",
        f"scroll_top_row:0x{SCROLL_TOP_ROW_RAM:04X}",
        "--openmsx",
        openmsx,
    ]
    run_command(command, cwd=project_root, timeout=120)


def main() -> None:
    args = parse_args()
    project_root = Path(args.project_root).expanduser().resolve()
    asm_output = Path(args.asm_output).expanduser().resolve()
    rom_output = Path(args.rom_output).expanduser().resolve()
    sym_output = Path(args.sym_output).expanduser().resolve()
    screenshot_output = Path(args.screenshot_output).expanduser().resolve()
    probe_output = Path(args.probe_output).expanduser().resolve()

    write_asm(asm_output)
    validate_asm(asm_output)
    compile_rom(project_root, resolve_glass(project_root, args.glass), asm_output, rom_output, sym_output)

    if args.skip_openmsx:
        print("OpenMSX capture skipped by --skip-openmsx")
        return

    capture_openmsx(args, project_root, rom_output, screenshot_output, probe_output)
    validate_probe(probe_output)
    validate_screenshot(screenshot_output)
    print(f"OpenMSX scroll screenshot ready: {screenshot_output}")
    print(f"OpenMSX scroll probe ready: {probe_output}")


if __name__ == "__main__":
    main()
