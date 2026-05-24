#!/usr/bin/env python3
import argparse
import json
import subprocess
import sys
from pathlib import Path

try:
    from PIL import Image
except Exception:
    Image = None


def repo_root_from_script() -> Path:
    return Path(__file__).resolve().parents[1]


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


def assert_contains(path: Path, needle: str, description: str) -> None:
    text = path.read_text(encoding="utf-8", errors="replace")
    if needle not in text:
        raise RuntimeError(f"Generated ASM is missing {description}: {needle}")


def assert_not_contains(path: Path, needle: str, description: str) -> None:
    text = path.read_text(encoding="utf-8", errors="replace")
    if needle in text:
        raise RuntimeError(f"Generated ASM must not contain {description}: {needle}")


def assert_screen5_mode_contract(path: Path) -> None:
    text = path.read_text(encoding="utf-8", errors="replace")
    normalized = "\n".join(line.strip().lower() for line in text.splitlines())
    if "ld a, 5\ncall chgmod" not in normalized:
        raise RuntimeError("Generated ASM does not switch to SCREEN 5 with CHGMOD")
    if "ld a, 4\ncall chgmod" in normalized:
        raise RuntimeError("Generated ASM must not switch to SCREEN 4 with CHGMOD")
    assert_not_contains(path, "call INIGRP", "SCREEN 4 BIOS initialization fallback")
    assert_not_contains(path, "screen4_", "SCREEN 4 labels in SCREEN 5 presentation smoke")


def assert_screen5_generated_labels(path: Path) -> None:
    text = path.read_text(encoding="utf-8", errors="replace")
    required_labels = [
        "SCREEN5_PRESENTATION_BITMAP_SIZE EQU 27136",
        "screen5_presentation_palette_data:",
        "SCREEN5_PRESENTATION_BITMAP_CHUNK_0:",
    ]
    for label in required_labels:
        if label not in text:
            raise RuntimeError(f"Generated ASM is missing SCREEN5 label: {label}")


def assert_screen5_zx0_contract(path: Path) -> None:
    if not path.exists():
        raise RuntimeError(f"ZX0-preprocessed ASM was not emitted: {path}")
    text = path.read_text(encoding="utf-8", errors="replace")
    required = [
        "Backend: msx2-screen5-presentation",
        "SCREEN5_PRESENTATION_COMPRESSION: ZX0",
        "SCREEN5_PRESENTATION_CHUNK_LINES: 32",
        "SCREEN5_PRESENTATION_BITMAP_CHUNK_0:",
        "ZX0 compressed tile_pattern",
        "Decompress ZX0 SCREEN 5 presentation chunk into RAM buffer",
        "ld de, SCREEN5_PRESENTATION_ZX0_BUFFER",
        "call dzx0_standard",
        "ld hl, SCREEN5_PRESENTATION_ZX0_BUFFER",
    ]
    for needle in required:
        if needle not in text:
            raise RuntimeError(f"ZX0-preprocessed ASM is missing SCREEN 5 presentation contract text: {needle}")


def assert_fixture_contract(path: Path) -> None:
    data = json.loads(path.read_text(encoding="utf-8"))
    assets = [asset for asset in data.get("assets", []) if asset.get("type") == "msx2presentation"]
    if len(assets) != 1:
        raise RuntimeError(f"Expected exactly one msx2presentation asset in {path}, found {len(assets)}")

    asset_data = assets[0].get("data") or {}
    if data.get("targetGraphicsBackend") != "msx2-screen5-presentation":
        raise RuntimeError("Fixture does not select msx2-screen5-presentation backend")
    if data.get("screenMode") != "SCREEN 5 (Graphics III)":
        raise RuntimeError("Fixture does not select SCREEN 5 (Graphics III)")
    if asset_data.get("backgroundSlot") not in (None, 0):
        raise RuntimeError("SCREEN 5 presentation background slot must be 0")
    if asset_data.get("backgroundHex") not in (None, "#000000"):
        raise RuntimeError("SCREEN 5 presentation background color must be #000000")
    palette = asset_data.get("palette") or []
    if len(palette) != 16:
        raise RuntimeError(f"SCREEN 5 presentation palette must have 16 slots, found {len(palette)}")
    if palette[0].get("slotIndex") != 0 or palette[0].get("hex") != "#000000":
        raise RuntimeError("SCREEN 5 presentation palette slot 0 must be black")

    width = asset_data.get("width")
    height = asset_data.get("height")
    packed = asset_data.get("packedBitmap")
    if width != 256 or height not in (192, 212):
        raise RuntimeError(f"Unexpected SCREEN 5 presentation geometry: {width}x{height}")
    if not isinstance(packed, list) or len(packed) != (width * height) // 2:
        raise RuntimeError("SCREEN 5 presentation packedBitmap does not match visible image size")


def get_msx2_gameflow_contract(path: Path) -> dict[str, str] | None:
    data = json.loads(path.read_text(encoding="utf-8"))
    presentations = {asset.get("id") for asset in data.get("assets", []) if asset.get("type") == "msx2presentation"}
    flows = [asset for asset in data.get("assets", []) if asset.get("type") == "msx2gameflow"]
    if not flows:
        return None

    flow = next((asset for asset in flows if asset.get("name") == "Main MSX2"), flows[0])
    flow_data = flow.get("data") or {}
    nodes = flow_data.get("nodes") or []
    connections = flow_data.get("connections") or []
    start_node_id = flow_data.get("startNodeId") or next((node.get("id") for node in nodes if node.get("type") == "Start"), None)
    node_by_id = {node.get("id"): node for node in nodes}
    current_id = start_node_id
    visited: set[str] = set()
    screen5_node = None
    while current_id and current_id not in visited:
        visited.add(current_id)
        current = node_by_id.get(current_id)
        if current and current.get("type") == "Screen5Presentation":
            screen5_node = current
            break
        next_connection = next((connection for connection in connections if (connection.get("from") or {}).get("nodeId") == current_id), None)
        current_id = (next_connection.get("to") or {}).get("nodeId") if next_connection else None

    if screen5_node is None:
        screen5_node = next((node for node in nodes if node.get("type") == "Screen5Presentation"), None)
    if screen5_node is None:
        raise RuntimeError(f"MSX2 GameFlow fixture has no Screen5Presentation node: {path}")

    presentation_asset_id = screen5_node.get("presentationAssetId")
    if presentation_asset_id not in presentations:
        raise RuntimeError(
            f"MSX2 GameFlow Screen5Presentation node references missing presentation asset: {presentation_asset_id}"
        )

    return {
        "flow_name": flow.get("name") or "Main MSX2",
        "start_node_id": start_node_id or "none",
        "screen5_node_id": screen5_node.get("id") or "none",
        "presentation_asset_id": presentation_asset_id,
    }


def assert_msx2_gameflow_asm_contract(path: Path, contract: dict[str, str] | None) -> None:
    text = path.read_text(encoding="utf-8", errors="replace")
    if contract is None:
        if "MSX2_GAMEFLOW_PRESENT: yes" in text:
            raise RuntimeError("Generated ASM reports an MSX2 GameFlow even though the fixture has none")
        return

    required = [
        "; MSX2_GAMEFLOW_PRESENT: yes",
        f"; MSX2_GAMEFLOW_ASSET: {contract['flow_name']}",
        f"; MSX2_GAMEFLOW_START_NODE: {contract['start_node_id']}",
        f"; MSX2_GAMEFLOW_SCREEN5_NODE: {contract['screen5_node_id']}",
        f"; MSX2_GAMEFLOW_PRESENTATION_ASSET_ID: {contract['presentation_asset_id']}",
    ]
    for needle in required:
        if needle not in text:
            raise RuntimeError(f"Generated ASM is missing MSX2 GameFlow contract marker: {needle}")


def assert_openmsx_capture(path: Path) -> None:
    if not path.exists():
        raise RuntimeError(f"OpenMSX screenshot was not created: {path}")
    if Image is None:
        if path.stat().st_size <= 10_000:
            raise RuntimeError(f"OpenMSX screenshot is unexpectedly small: {path.stat().st_size} bytes")
        return

    image = Image.open(path).convert("RGB")
    if image.width < 256 or image.height < 192:
        raise RuntimeError(f"OpenMSX screenshot has unexpected dimensions: {image.width}x{image.height}")
    pixels = list(image.getdata())
    unique_colors = len(set(pixels))
    non_black = sum(1 for pixel in pixels if pixel != (0, 0, 0))
    if unique_colors <= 8:
        raise RuntimeError(f"OpenMSX screenshot has too little color variety: {unique_colors}")
    if non_black <= 1000:
        raise RuntimeError(f"OpenMSX screenshot looks blank: {non_black} non-black pixels")


def main() -> int:
    parser = argparse.ArgumentParser(description="Build and optionally capture the MSX2 SCREEN 5 presentation smoke ROM.")
    parser.add_argument("--project-root", default=".", help="Mideas repository root")
    parser.add_argument("--fixture", default=None, help="Mideas JSON fixture to compile")
    parser.add_argument("--out-dir", default=None, help="Output directory for ASM/ROM/SYM/screenshot")
    parser.add_argument("--project-name", default="msx2_screen5_presentation_smoke", help="Project name for generated ASM labels")
    parser.add_argument("--screenshot-output", default=None, help="Exact OpenMSX screenshot path")
    parser.add_argument("--skip-openmsx", action="store_true", help="Compile only; do not launch OpenMSX")
    parser.add_argument("--machine", default="C-BIOS_MSX2", help="OpenMSX machine")
    parser.add_argument("--wait-ms", type=int, default=6000, help="OpenMSX capture wait in milliseconds")
    args = parser.parse_args()

    project_root = Path(args.project_root).resolve()
    if not (project_root / "package.json").exists():
        project_root = repo_root_from_script()

    fixture = Path(args.fixture).resolve() if args.fixture else project_root / "test" / "msx2-screen5-presentation" / "presentation_screen5_project.json"
    out_dir = Path(args.out_dir).resolve() if args.out_dir else project_root / "test" / "msx2-screen5-presentation" / "out"
    out_dir.mkdir(parents=True, exist_ok=True)
    output_stem = Path(args.project_name).stem
    asm_output = out_dir / f"{output_stem}.asm"
    zx0_asm_output = out_dir / f"{output_stem}_compressed.asm"
    rom_output = out_dir / f"{output_stem}.rom"
    sym_output = out_dir / f"{output_stem}.sym"
    screenshot_output = Path(args.screenshot_output).resolve() if args.screenshot_output else out_dir / f"{output_stem}.png"

    assert_fixture_contract(fixture)
    msx2_gameflow_contract = get_msx2_gameflow_contract(fixture)

    build_result = run_command([
        sys.executable,
        "scripts/build_mideas_unified_rom.py",
        "--json", str(fixture),
        "--project-root", str(project_root),
        "--project-name", args.project_name,
        "--asm-output", str(asm_output),
        "--rom-output", str(rom_output),
        "--sym-output", str(sym_output),
        "--rom-mode", "simple32k",
        "--target-format", "konami",
        "--execution-mode", "gameLoopHalt",
    ], cwd=project_root, timeout=180)

    assert_contains(asm_output, "Backend: msx2-screen5-presentation", "SCREEN 5 presentation backend marker")
    assert_contains(asm_output, "ld a, 5", "SCREEN 5 mode switch")
    assert_contains(asm_output, "screen5_presentation_palette_data", "SCREEN 5 palette data")
    assert_contains(asm_output, "SCREEN5_PRESENTATION_BITMAP_CHUNK_0", "SCREEN 5 bitmap chunk data")
    assert_contains(asm_output, "SCREEN5_PRESENTATION_BITMAP_SIZE EQU 27136", "full 256x212 bitmap upload")
    assert_contains(asm_output, "call map_page2_to_cart_primary", "page-2 cart mapping for bitmap data crossing #8000")
    assert_msx2_gameflow_asm_contract(asm_output, msx2_gameflow_contract)
    assert_screen5_mode_contract(asm_output)
    assert_screen5_generated_labels(asm_output)
    assert_screen5_zx0_contract(zx0_asm_output)
    build_stdout = build_result.stdout.decode("utf-8", errors="replace")
    if "ZX0: applied=True" not in build_stdout:
        raise RuntimeError("build_mideas_unified_rom.py did not report applied ZX0 preprocessing for SCREEN 5 presentation")

    size = rom_output.stat().st_size
    if size % 8192 != 0:
        raise RuntimeError(f"ROM size is not a multiple of 8KB: {size}")
    print(f"ROM ready: {rom_output} ({size} bytes)")

    if not args.skip_openmsx:
        run_command([
            "powershell",
            "-ExecutionPolicy", "Bypass",
            "-File", "scripts\\capture_openmsx_screenshot.ps1",
            "-Rom", str(rom_output),
            "-ProjectRoot", str(project_root),
            "-Output", str(screenshot_output),
            "-WaitMs", str(args.wait_ms),
            "-Machine", args.machine,
        ], cwd=project_root, timeout=120)
        assert_openmsx_capture(screenshot_output)
        print(f"Screenshot: {screenshot_output}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
