#!/usr/bin/env python3
import argparse
import json
import re
import subprocess
import sys
import time
from pathlib import Path

try:
    from PIL import Image
except Exception as exc:  # pragma: no cover - exercised by local environment only
    raise SystemExit(
        "Pillow is required for PNG conversion. Install it in this Python environment. "
        f"Original error: {exc}"
    )


SCREEN5_WIDTH = 256
DEFAULT_HEIGHT = 192
SCREEN5_VRAM_HEIGHT = 212
CHUNK_LINES = 32
MSX2_LEVELS = [0x00, 0x24, 0x49, 0x6D, 0x92, 0xB6, 0xDB, 0xFF]
MSX_SCREEN5_PALETTE = [
    "#000000",
    "#000000",
    "#3EB847",
    "#74D07D",
    "#2F2FC1",
    "#5858FC",
    "#B63125",
    "#68D2DA",
    "#FC584A",
    "#FF8E81",
    "#C0BF3B",
    "#E7E474",
    "#309337",
    "#B640C8",
    "#999999",
    "#FFFFFF",
]


def repo_root_from_script() -> Path:
    return Path(__file__).resolve().parents[1]


def sanitize_name(value: str) -> str:
    name = re.sub(r"[^A-Za-z0-9_]+", "_", value.strip()).strip("_").lower()
    return name or "screen5_presentation"


def run_command(cmd: list[str], cwd: Path, timeout: float | None = None) -> subprocess.CompletedProcess:
    print("Running:", " ".join(str(part) for part in cmd))
    completed = subprocess.run(cmd, cwd=str(cwd), capture_output=True, timeout=timeout)
    stdout = completed.stdout.decode("utf-8", errors="replace")
    stderr = completed.stderr.decode("utf-8", errors="replace")
    if stdout.strip():
        print(stdout.strip())
    if stderr.strip():
        print(stderr.strip(), file=sys.stderr)
    if completed.returncode != 0:
        raise RuntimeError(f"Command failed ({completed.returncode}): {' '.join(str(part) for part in cmd)}")
    return completed


def snap_channel(value: int) -> int:
    return min(range(8), key=lambda index: abs(MSX2_LEVELS[index] - value))


def snap_rgb(rgb: tuple[int, int, int]) -> tuple[tuple[int, int, int], int]:
    r_idx = snap_channel(rgb[0])
    g_idx = snap_channel(rgb[1])
    b_idx = snap_channel(rgb[2])
    snapped = (MSX2_LEVELS[r_idx], MSX2_LEVELS[g_idx], MSX2_LEVELS[b_idx])
    return snapped, (r_idx << 6) | (g_idx << 3) | b_idx


def hex_rgb(rgb: tuple[int, int, int]) -> str:
    return f"#{rgb[0]:02X}{rgb[1]:02X}{rgb[2]:02X}"


def parse_hex_rgb(hex_color: str) -> tuple[int, int, int]:
    normalized = hex_color.strip().lstrip("#")
    if len(normalized) != 6:
        return (0, 0, 0)
    return (
        int(normalized[0:2], 16),
        int(normalized[2:4], 16),
        int(normalized[4:6], 16),
    )


def distance2(left: tuple[int, int, int], right: tuple[int, int, int]) -> int:
    return sum((left[index] - right[index]) ** 2 for index in range(3))


def resize_to_screen5(source: Image.Image, height: int, fit_mode: str) -> Image.Image:
    source = source.convert("RGBA")
    src_w, src_h = source.size

    if fit_mode == "stretch":
        return source.resize((SCREEN5_WIDTH, height), Image.Resampling.LANCZOS).convert("RGB")

    if fit_mode == "contain":
        scale = min(SCREEN5_WIDTH / src_w, height / src_h)
    else:
        scale = max(SCREEN5_WIDTH / src_w, height / src_h)

    resized = source.resize(
        (max(1, round(src_w * scale)), max(1, round(src_h * scale))),
        Image.Resampling.LANCZOS,
    )

    if fit_mode == "contain":
        canvas = Image.new("RGBA", (SCREEN5_WIDTH, height), (0, 0, 0, 255))
        canvas.alpha_composite(resized, ((SCREEN5_WIDTH - resized.width) // 2, (height - resized.height) // 2))
        return canvas.convert("RGB")

    left = max(0, (resized.width - SCREEN5_WIDTH) // 2)
    top = max(0, (resized.height - height) // 2)
    return resized.crop((left, top, left + SCREEN5_WIDTH, top + height)).convert("RGB")


def build_palette(image: Image.Image) -> list[tuple[tuple[int, int, int], int]]:
    quantized = image.quantize(colors=15, method=Image.Quantize.MEDIANCUT)
    raw_palette = quantized.getpalette()[:45]
    raw_colors = [tuple(raw_palette[index:index + 3]) for index in range(0, len(raw_palette), 3)]

    snapped_colors: list[tuple[tuple[int, int, int], int]] = []
    for color in sorted(raw_colors, key=lambda rgb: rgb[0] + rgb[1] + rgb[2]):
        snapped, master_index = snap_rgb(color)  # type: ignore[arg-type]
        if snapped == (0, 0, 0):
            continue
        if all(existing[0] != snapped for existing in snapped_colors):
            snapped_colors.append((snapped, master_index))

    fallback_colors = [
        (0xFF, 0xFF, 0xFF),
        (0xDB, 0xDB, 0xDB),
        (0xDB, 0x92, 0x92),
        (0x92, 0xB6, 0xDB),
        (0x49, 0x92, 0xDB),
        (0xB6, 0x24, 0x49),
        (0x24, 0x49, 0x92),
    ]
    for color in fallback_colors:
        if len(snapped_colors) >= 15:
            break
        snapped, master_index = snap_rgb(color)
        if all(existing[0] != snapped for existing in snapped_colors):
            snapped_colors.append((snapped, master_index))

    palette = [((0, 0, 0), 0)] + snapped_colors[:15]
    while len(palette) < 16:
        palette.append(((0, 0, 0), 0))
    return palette


def build_default_palette() -> list[tuple[tuple[int, int, int], int]]:
    palette: list[tuple[tuple[int, int, int], int]] = []
    for index, color in enumerate(MSX_SCREEN5_PALETTE):
        snapped, master_index = snap_rgb(parse_hex_rgb(color))
        if index == 0:
            palette.append(((0, 0, 0), 0))
        else:
            palette.append((snapped, master_index))
    return palette


def quantize_and_pack(image: Image.Image, palette: list[tuple[tuple[int, int, int], int]]) -> tuple[list[list[int]], bytes]:
    pixels: list[list[int]] = []
    packed = bytearray()

    for y in range(image.height):
        row: list[int] = []
        for x in range(SCREEN5_WIDTH):
            rgb = image.getpixel((x, y))
            if rgb[0] < 10 and rgb[1] < 10 and rgb[2] < 10:
                slot = 0
            else:
                slot = min(range(16), key=lambda index: distance2(rgb, palette[index][0]))
            row.append(slot)
        pixels.append(row)
        for x in range(0, SCREEN5_WIDTH, 2):
            packed.append(((row[x] & 0x0F) << 4) | (row[x + 1] & 0x0F))

    return pixels, bytes(packed)


def write_preview(path: Path, pixels: list[list[int]], palette: list[tuple[tuple[int, int, int], int]]) -> None:
    preview = Image.new("RGB", (SCREEN5_WIDTH, len(pixels)))
    for y, row in enumerate(pixels):
        for x, slot in enumerate(row):
            preview.putpixel((x, y), palette[slot][0])
    preview.save(path)


def create_project(args: argparse.Namespace, project_root: Path) -> dict[str, Path]:
    source_png = Path(args.source_png).resolve()
    if not source_png.exists():
        raise FileNotFoundError(source_png)

    out_dir = Path(args.out_dir).resolve() if args.out_dir else project_root / "test" / "msx2-screen5-presentation" / "from_png"
    out_dir.mkdir(parents=True, exist_ok=True)

    project_name = sanitize_name(args.project_name or f"{source_png.stem}_screen5_png_test")
    output_prefix = sanitize_name(args.output_prefix or project_name)
    asset_name = args.asset_name or source_png.stem.replace("_", " ").title()

    source = Image.open(source_png)
    source_w, source_h = source.size
    screen_image = resize_to_screen5(source, args.height, args.fit_mode)
    palette = build_default_palette() if args.palette_mode == "default" else build_palette(screen_image)
    pixels, packed = quantize_and_pack(screen_image, palette)

    project_path = out_dir / f"{output_prefix}_project.json"
    bitmap_path = out_dir / f"{output_prefix}_bitmap.bin"
    preview_path = out_dir / f"{output_prefix}_preview.png"
    asm_path = out_dir / f"{output_prefix}.asm"
    zx0_asm_path = out_dir / f"{output_prefix}_compressed.asm"
    rom_path = out_dir / f"{output_prefix}.rom"
    sym_path = out_dir / f"{output_prefix}.sym"
    screenshot_path = out_dir / f"{output_prefix}_openmsx.png"

    bitmap_path.write_bytes(packed)
    write_preview(preview_path, pixels, palette)

    palette_json = [
        {"slotIndex": index, "masterIndex": master_index, "hex": hex_rgb(rgb)}
        for index, (rgb, master_index) in enumerate(palette)
    ]
    packed_list = list(packed)
    asset_id = f"asset_{project_name}"
    now_ms = args.timestamp_ms if args.timestamp_ms is not None else int(time.time() * 1000)

    asset_data = {
        "enabled": True,
        "name": asset_name,
        "target": "MSX2",
        "screenMode": "SCREEN 5",
        "sourceFileName": source_png.name,
        "sourceImageWidth": source_w,
        "sourceImageHeight": source_h,
        "width": SCREEN5_WIDTH,
        "height": args.height,
        "fitMode": args.fit_mode,
        "paletteMode": args.palette_mode,
        "backgroundSlot": 0,
        "backgroundHex": "#000000",
        "palette": palette_json,
        "packedBitmap": packed_list,
        "compression": {"codec": "ZX0", "enabled": True, "chunkLines": CHUNK_LINES},
        "runtime": {
            "showAtBoot": True,
            "clearSpritesBeforeShow": True,
            "waitForKey": True,
            "waitForFrames": 0,
            "vramPage": 0,
            "romDataGroup": "auto",
        },
        "visibleImageBytes": len(packed),
        "vramBitmapBytes": SCREEN5_WIDTH * SCREEN5_VRAM_HEIGHT // 2,
        "updatedAt": now_ms,
        "lastImportError": None,
        "data": {
            "packedPixels": packed_list,
            "packedBitmap": packed_list,
        },
    }

    project = {
        "name": project_name,
        "screenMode": "SCREEN 5 (Graphics III)",
        "currentScreenMode": "SCREEN 5 (Graphics III)",
        "targetGraphicsBackend": "msx2-screen5-presentation",
        "assets": [
            {
                "id": asset_id,
                "name": asset_name,
                "type": "msx2presentation",
                "data": asset_data,
            }
        ],
        "selectedAssetId": asset_id,
        "currentEditor": "msx2presentation",
        "createdAt": now_ms,
    }
    project_path.write_text(json.dumps(project, indent=2), encoding="utf-8")

    print(f"Project JSON: {project_path}")
    print(f"Bitmap: {bitmap_path} ({len(packed)} bytes)")
    print(f"Preview: {preview_path}")

    return {
        "project": project_path,
        "bitmap": bitmap_path,
        "preview": preview_path,
        "asm": asm_path,
        "zx0_asm": zx0_asm_path,
        "rom": rom_path,
        "sym": sym_path,
        "screenshot": screenshot_path,
    }


def build_rom(paths: dict[str, Path], args: argparse.Namespace, project_root: Path) -> subprocess.CompletedProcess:
    return run_command([
        sys.executable,
        "scripts/build_mideas_unified_rom.py",
        "--json", str(paths["project"]),
        "--project-root", str(project_root),
        "--project-name", sanitize_name(args.project_name or Path(args.source_png).stem + "_screen5_png_test"),
        "--asm-output", str(paths["asm"]),
        "--rom-output", str(paths["rom"]),
        "--sym-output", str(paths["sym"]),
        "--rom-mode", args.rom_mode,
        "--target-format", args.target_format,
        "--execution-mode", args.execution_mode,
    ], cwd=project_root, timeout=180)


def capture_openmsx(paths: dict[str, Path], args: argparse.Namespace, project_root: Path) -> None:
    if not paths["rom"].exists():
        raise FileNotFoundError(f"ROM does not exist for capture: {paths['rom']}")
    command = [
        "powershell",
        "-ExecutionPolicy", "Bypass",
        "-File", "scripts\\capture_openmsx_screenshot.ps1",
        "-Rom", str(paths["rom"]),
        "-ProjectRoot", str(project_root),
        "-Output", str(paths["screenshot"]),
        "-WaitMs", str(args.wait_ms),
        "-Machine", args.machine,
    ]
    if args.rom_type:
        command.extend(["-RomType", args.rom_type])
    run_command(command, cwd=project_root, timeout=120)
    assert_openmsx_capture(paths["screenshot"])
    print(f"Screenshot: {paths['screenshot']}")


def assert_openmsx_capture(path: Path) -> None:
    if not path.exists():
        raise FileNotFoundError(f"OpenMSX screenshot was not created: {path}")
    image = Image.open(path).convert("RGB")
    if image.width < 256 or image.height < 192:
        raise RuntimeError(f"OpenMSX screenshot is unexpectedly small: {image.width}x{image.height}")

    sample = list(image.getdata())
    unique_colors = len(set(sample))
    non_black = sum(1 for rgb in sample if rgb != (0, 0, 0))
    if unique_colors <= 8:
        raise RuntimeError(f"OpenMSX screenshot has too little color variety: {unique_colors} unique colors")
    if non_black <= 1000:
        raise RuntimeError(f"OpenMSX screenshot looks blank: {non_black} non-black pixels")


def main() -> int:
    parser = argparse.ArgumentParser(description="Create an MSX2 SCREEN 5 presentation project from a PNG.")
    parser.add_argument("--source-png", required=True, help="Source PNG image")
    parser.add_argument("--project-root", default=".", help="Mideas repository root")
    parser.add_argument("--out-dir", default=None, help="Output directory")
    parser.add_argument("--project-name", default=None, help="Project/output base name")
    parser.add_argument("--output-prefix", default=None, help="Output file prefix; defaults to project name")
    parser.add_argument("--asset-name", default=None, help="Display name for the created asset")
    parser.add_argument("--timestamp-ms", type=int, default=None, help="Deterministic timestamp for generated JSON")
    parser.add_argument("--height", type=int, choices=[192, 212], default=DEFAULT_HEIGHT, help="Visible SCREEN 5 height")
    parser.add_argument("--fit-mode", choices=["cover", "contain", "stretch"], default="cover", help="Resize behavior")
    parser.add_argument("--palette-mode", choices=["auto", "default"], default="auto", help="auto adapts 15 colors from the PNG; default uses the standard SCREEN 5 palette with black slot 0")
    parser.add_argument("--build-rom", action="store_true", help="Compile the generated project to ROM")
    parser.add_argument("--capture-openmsx", action="store_true", help="Capture OpenMSX screenshot after compiling")
    parser.add_argument("--machine", default="C-BIOS_MSX2", help="OpenMSX machine")
    parser.add_argument("--rom-type", default=None, help="Optional OpenMSX ROM type for capture; defaults to konami for Konami MegaROM")
    parser.add_argument("--wait-ms", type=int, default=6000, help="OpenMSX capture wait in milliseconds")
    parser.add_argument("--rom-mode", default="simple32k", help="ROM mode passed to build_mideas_unified_rom.py")
    parser.add_argument("--target-format", default="konami", help="Target format passed to build_mideas_unified_rom.py")
    parser.add_argument("--execution-mode", default="gameLoopHalt", help="Execution mode passed to build_mideas_unified_rom.py")
    args = parser.parse_args()
    if args.rom_type is None and args.rom_mode == "megarom" and args.target_format == "konami":
        args.rom_type = "konami"

    project_root = Path(args.project_root).resolve()
    if not (project_root / "package.json").exists():
        project_root = repo_root_from_script()

    if args.capture_openmsx:
        args.build_rom = True

    paths = create_project(args, project_root)
    build_result = None
    if args.build_rom:
        build_result = build_rom(paths, args, project_root)
        if "ZX0: applied=True" not in build_result.stdout.decode("utf-8", errors="replace"):
            raise RuntimeError("ZX0 preprocessing was not applied to the generated SCREEN 5 presentation ROM")
        size = paths["rom"].stat().st_size
        if size % 8192 != 0:
            raise RuntimeError(f"ROM size is not a multiple of 8KB: {size}")
        print(f"ROM: {paths['rom']} ({size} bytes)")

    if args.capture_openmsx:
        capture_openmsx(paths, args, project_root)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
