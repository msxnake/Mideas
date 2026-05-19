#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import shutil
import struct
import subprocess
import sys
import zlib
from pathlib import Path


def repo_root_from_script() -> Path:
    return Path(__file__).resolve().parents[1]


def run_command(
    cmd: list[str],
    cwd: Path,
    timeout: float | None = None,
    allow_failure: bool = False,
) -> subprocess.CompletedProcess:
    display_cmd = [
        "<inline script>" if index > 0 and cmd[index - 1] == "-e" else str(part)
        for index, part in enumerate(cmd)
    ]
    print("Running:", " ".join(display_cmd), flush=True)
    completed = subprocess.run(cmd, cwd=str(cwd), capture_output=True, timeout=timeout)

    def decode(raw: bytes) -> str:
        if not raw:
            return ""
        try:
            return raw.decode("utf-8")
        except UnicodeDecodeError:
            return raw.decode("cp1252", errors="replace")

    stdout = decode(completed.stdout)
    stderr = decode(completed.stderr)
    if stdout.strip():
      sys.stdout.buffer.write((stdout.strip() + "\n").encode(sys.stdout.encoding or "utf-8", errors="replace"))
      sys.stdout.flush()
    if stderr.strip():
      sys.stderr.buffer.write((stderr.strip() + "\n").encode(sys.stderr.encoding or "utf-8", errors="replace"))
      sys.stderr.flush()
    if completed.returncode != 0 and not allow_failure:
        raise RuntimeError(f"Command failed ({completed.returncode}): {' '.join(str(part) for part in cmd)}")
    return completed


def compile_generator(project_root: Path, ts_build_dir: Path, strict_tsc: bool) -> Path:
    generator_ts = project_root / "utils" / "msxGenerator" / "index.ts"
    if not generator_ts.exists():
        raise FileNotFoundError(f"Missing generator source: {generator_ts}")

    ts_build_dir.mkdir(parents=True, exist_ok=True)
    npx_exec = shutil.which("npx.cmd") or shutil.which("npx") or "npx"
    tsc_cmd = [
        npx_exec,
        "tsc",
        "--pretty",
        "false",
        "--module",
        "commonjs",
        "--target",
        "ES2020",
        "--outDir",
        str(ts_build_dir),
        "--moduleResolution",
        "node",
        "--skipLibCheck",
        "--noEmitOnError",
        "false",
        str(generator_ts.relative_to(project_root)),
    ]
    completed = run_command(tsc_cmd, cwd=project_root, timeout=180, allow_failure=True)
    if strict_tsc and completed.returncode != 0:
        raise RuntimeError("TypeScript compilation failed in strict mode.")

    compiled_index = ts_build_dir / "utils" / "msxGenerator" / "index.js"
    if not compiled_index.exists():
        raise RuntimeError(f"TypeScript compilation did not produce {compiled_index}")
    (ts_build_dir / "package.json").write_text('{"type":"commonjs"}', encoding="utf-8")
    return compiled_index


def validate_fixture_json(project_json: Path) -> None:
    project = json.loads(project_json.read_text(encoding="utf-8"))
    if project.get("screenMode") != "SCREEN 5 (Graphics III)":
        raise RuntimeError("Fixture is not a SCREEN 5 project")
    if project.get("targetGraphicsBackend") != "msx2-screen5-tile16":
        raise RuntimeError("Fixture is not using the MSX2 16x16 tile backend alias")

    screen_assets = [asset for asset in project.get("assets", []) if asset.get("type") == "msx2screen"]
    screen_asset = screen_assets[0] if screen_assets else None
    sprite_asset = next((asset for asset in project.get("assets", []) if asset.get("type") == "msx2sprite"), None)
    world_asset = next((asset for asset in project.get("assets", []) if asset.get("type") == "worldmap"), None)
    gameflow_asset = next((asset for asset in project.get("assets", []) if asset.get("type") == "gameflow"), None)
    if not screen_asset:
        raise RuntimeError("Fixture does not contain an msx2screen asset")
    if len(screen_assets) < 2:
        raise RuntimeError("Fixture must contain at least two msx2screen assets for WorldMap transition smoke")
    if not sprite_asset:
        raise RuntimeError("Fixture does not contain an msx2sprite asset")
    if not world_asset:
        raise RuntimeError("Fixture does not contain a worldmap asset")
    if not gameflow_asset:
        raise RuntimeError("Fixture does not contain a gameflow asset")

    screen = screen_asset.get("data", {})
    layers = screen.get("layers", {})
    for layer_name in ("collision", "effects"):
        layer = layers.get(layer_name)
        if not isinstance(layer, list) or len(layer) != 14:
            raise RuntimeError(f"{layer_name} layer must have 14 rows")
        if any(not isinstance(row, list) or len(row) != 16 for row in layer):
            raise RuntimeError(f"{layer_name} layer must be 16 columns wide")
        if not any(any(int(cell or 0) for cell in row) for row in layer):
            raise RuntimeError(f"{layer_name} layer must contain at least one non-zero cell")

    effect_codes = {
        int(cell or 0)
        for asset in screen_assets
        for row in asset.get("data", {}).get("layers", {}).get("effects", [])
        for cell in row
    }
    required_effect_codes = {1, 2, 3}
    if not required_effect_codes.issubset(effect_codes):
        raise RuntimeError(
            "Fixture effect layer must include hazard=1, exit=2, and collectible=3 codes; "
            f"found {sorted(effect_codes)}"
        )

    entities = layers.get("entities")
    if not isinstance(entities, list) or not any(entity.get("kind") == "player" for entity in entities):
        raise RuntimeError("Fixture must contain a player entity in msx2screen.layers.entities")

    world = world_asset.get("data", {})
    start_node_id = world.get("startScreenNodeId")
    start_node = next((node for node in world.get("nodes", []) if node.get("id") == start_node_id), None)
    if not start_node or start_node.get("screenAssetId") != screen_asset.get("id"):
        raise RuntimeError("WorldMap must start on the fixture msx2screen")
    if not any(connection.get("fromDirection") in ("west", "east") for connection in world.get("connections", [])):
        raise RuntimeError("WorldMap must contain a horizontal connection for transition smoke")

    gameflow = gameflow_asset.get("data", {})
    world_links = [node for node in gameflow.get("nodes", []) if node.get("type") == "WorldLink"]
    if not any(node.get("worldAssetId") == world_asset.get("id") for node in world_links):
        raise RuntimeError("GameFlow must contain a WorldLink to the fixture WorldMap")


def validate_summary_codegen(project_root: Path, project_json: Path, compiled_index: Path) -> None:
    node_script = r'''
const fs = require("fs");
const generator = require(process.argv[1]);
const jsonPath = process.argv[2];
const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const assets = Array.isArray(raw.assets) ? raw.assets : [];
const byType = (type) => assets.filter((asset) => asset && asset.type === type);
const gameFlowAsset = byType("gameflow")[0];

if (!gameFlowAsset || !gameFlowAsset.data) {
  throw new Error("Fixture JSON does not contain a gameflow asset");
}

const summary = {
  projectInfo: {
    name: raw.name || "msx2screen_layers_summary_smoke",
    targetMSX: raw.targetMSX || "MSX2",
  },
  screenMode: raw.screenMode,
  currentScreenMode: raw.currentScreenMode,
  targetGraphicsBackend: raw.targetGraphicsBackend,
  assets: {
    sprites: byType("sprite"),
    msx2Sprites: byType("msx2sprite"),
    msx2Bitmaps: byType("msx2bitmap"),
    msx2Screens: byType("msx2screen"),
    tiles: byType("tile"),
    tileBanks: byType("tilebank"),
    screens: byType("screenmap"),
    entities: byType("entity"),
    components: byType("componentdefinition"),
    templates: byType("entitytemplate"),
    fonts: byType("font"),
    stateMachines: byType("statemachine"),
    worldmaps: byType("worldmap"),
    bosses: byType("boss"),
    globalVariables: byType("globalvariable"),
    tracks: byType("music").map((asset) => asset.data || asset),
    menus: byType("menu"),
  },
  execution: {
    mainGameFlow: gameFlowAsset.data,
  },
};

const files = generator.generateModularASMFromSummary(summary, {
  generateUnified: true,
  romMode: "simple32k",
  targetFormat: "konami",
});
const asm = files["unitedFiles.asm"] || "";
const required = [
  "Mideas MSX2 SCREEN 5 bitmap backend",
  "MSX2_LAYERS_EXIT_SCREEN_TILE_",
  "msx2_try_world_edge_transition_left",
  "call load_MSX2_LAYERS_EXIT_SCREEN_bitmap",
  "msx2_current_collision_ptr",
  "apply_hardware_sprite_gravity",
  "msx2_player_dead_flag",
  "msx2_exit_reached_flag",
  "msx2_collectible_count",
  "msx2_exit_blocked_flag",
  "msx2_lives",
  "msx2_game_over_flag",
  "draw_msx2_lives_hud",
  "msx2_required_collectibles",
  "msx2_respawn_current_screen",
  "msx2_screen_spawn_x",
];
const missing = required.filter((needle) => !asm.includes(needle));
if (missing.length > 0) {
  throw new Error("Summary codegen is missing expected MSX2 signals: " + missing.join(", "));
}
console.log(`Summary codegen check passed: chars=${asm.length}, files=${Object.keys(files).length}`);
'''
    run_command(["node", "-e", node_script, str(compiled_index), str(project_json)], cwd=project_root, timeout=120)


def validate_asm(asm_output: Path) -> None:
    asm = asm_output.read_text(encoding="utf-8", errors="replace")
    required = [
        "Mideas MSX2 SCREEN 5 bitmap backend",
        "MSX2_LAYERS_SMOKE_SCREEN_COLLISION",
        "MSX2_LAYERS_SMOKE_SCREEN_EFFECTS",
        "MSX2_LAYERS_EXIT_SCREEN_TILE_",
        "MSX2 minimal GameFlow",
        "call load_MSX2_LAYERS_SMOKE_SCREEN_bitmap",
        "msx2_try_world_edge_transition_left",
        "call load_MSX2_LAYERS_EXIT_SCREEN_bitmap",
        "msx2_current_collision_ptr",
        "msx2_current_effects_ptr",
        "msx2_collision_at_pixel",
        "msx2_effect_at_pixel",
        "msx2_player_dead_flag",
        "msx2_exit_reached_flag",
        "msx2_collectible_count",
        "msx2_exit_blocked_flag",
        "msx2_lives",
        "msx2_game_over_flag",
        "draw_msx2_lives_hud",
        "msx2_required_collectibles",
        "msx2_respawn_current_screen",
        "msx2_screen_spawn_x",
        "update_hardware_sprite_vertical",
        "apply_hardware_sprite_gravity",
        "msx2_player_jump_frames",
        "msx2_player_on_ground",
        ".right_blocked:",
        ".left_blocked:",
        "call update_msx2_effect_state",
    ]
    missing = [needle for needle in required if needle not in asm]
    if missing:
        raise RuntimeError("Generated ASM is missing expected MSX2 layer signals: " + ", ".join(missing))


def validate_rom(rom_output: Path) -> None:
    if not rom_output.exists():
        raise RuntimeError(f"ROM was not created: {rom_output}")
    size = rom_output.stat().st_size
    if size == 0 or size % 8192 != 0:
        raise RuntimeError(f"ROM size must be a non-zero multiple of 8KB, got {size}")


def read_png_rgb(path: Path) -> tuple[int, int, list[list[tuple[int, int, int]]]]:
    data = path.read_bytes()
    if not data.startswith(b"\x89PNG\r\n\x1a\n"):
        raise RuntimeError(f"Not a PNG file: {path}")

    pos = 8
    width = height = bit_depth = color_type = None
    idat = bytearray()
    while pos < len(data):
        length = struct.unpack(">I", data[pos:pos + 4])[0]
        chunk_type = data[pos + 4:pos + 8]
        chunk_data = data[pos + 8:pos + 8 + length]
        pos += 12 + length
        if chunk_type == b"IHDR":
            width, height, bit_depth, color_type, _compression, _filter, interlace = struct.unpack(">IIBBBBB", chunk_data)
            if bit_depth != 8 or color_type not in (2, 6) or interlace != 0:
                raise RuntimeError(f"Unsupported PNG format in {path}: bit_depth={bit_depth}, color_type={color_type}, interlace={interlace}")
        elif chunk_type == b"IDAT":
            idat.extend(chunk_data)
        elif chunk_type == b"IEND":
            break

    if width is None or height is None or color_type is None:
        raise RuntimeError(f"PNG missing IHDR: {path}")

    channels = 4 if color_type == 6 else 3
    stride = width * channels
    raw = zlib.decompress(bytes(idat))
    rows: list[list[tuple[int, int, int]]] = []
    previous = bytearray(stride)
    offset = 0
    for _y in range(height):
        filter_type = raw[offset]
        offset += 1
        scanline = bytearray(raw[offset:offset + stride])
        offset += stride

        for i in range(stride):
            left = scanline[i - channels] if i >= channels else 0
            up = previous[i]
            up_left = previous[i - channels] if i >= channels else 0
            if filter_type == 1:
                scanline[i] = (scanline[i] + left) & 0xFF
            elif filter_type == 2:
                scanline[i] = (scanline[i] + up) & 0xFF
            elif filter_type == 3:
                scanline[i] = (scanline[i] + ((left + up) // 2)) & 0xFF
            elif filter_type == 4:
                p = left + up - up_left
                pa = abs(p - left)
                pb = abs(p - up)
                pc = abs(p - up_left)
                predictor = left if pa <= pb and pa <= pc else up if pb <= pc else up_left
                scanline[i] = (scanline[i] + predictor) & 0xFF
            elif filter_type != 0:
                raise RuntimeError(f"Unsupported PNG filter type {filter_type} in {path}")

        rows.append([
            (scanline[x * channels], scanline[x * channels + 1], scanline[x * channels + 2])
            for x in range(width)
        ])
        previous = scanline
    return width, height, rows


def locate_green_player_bounds(path: Path) -> tuple[int, int, int, int]:
    width, height, rows = read_png_rgb(path)
    green_player_pixels: list[tuple[int, int]] = []

    for y, row in enumerate(rows):
        for x, (r, g, b) in enumerate(row):
            if width * 0.20 < x < width * 0.65 and height * 0.20 < y < height * 0.90 and g > 120 and r < 120 and b < 120:
                green_player_pixels.append((x, y))

    if len(green_player_pixels) < 5:
        raise RuntimeError(f"Could not find the green player sprite in screenshot: {path}")

    return (
        min(x for x, _y in green_player_pixels),
        min(y for _x, y in green_player_pixels),
        max(x for x, _y in green_player_pixels),
        max(y for _x, y in green_player_pixels),
    )


def validate_blocked_screenshot(path: Path) -> None:
    player_min_x, player_min_y, player_max_x, player_max_y = locate_green_player_bounds(path)
    print(
        "Screenshot player check passed: "
        f"x={player_min_x}-{player_max_x}, y={player_min_y}-{player_max_y}"
    )


def validate_right_blocked_probe(path: Path) -> None:
    values = read_probe_values(path)
    player_x = values.get("player_x")
    screen = values.get("screen")
    if player_x is None or screen is None:
        raise RuntimeError(f"OpenMSX right-blocked probe is missing player_x or screen: {path}")
    if screen != 0:
        raise RuntimeError(f"OpenMSX right-blocked probe changed rooms unexpectedly: screen={screen:02X}")
    if player_x > 0x70:
        raise RuntimeError(f"OpenMSX right-blocked probe passed collision wall: player_x={player_x:02X}")
    print(f"Right collision probe check passed: player_x={player_x:02X}, screen={screen:02X}")


def validate_collectible_clear_probe(path: Path) -> None:
    values = read_probe_values(path)
    expected = {
        "collectible": 1,
        "collectible_cell": 0,
        "screen": 0,
    }
    missing = [key for key in expected if key not in values]
    if missing:
        raise RuntimeError(f"OpenMSX collectible-clear probe is missing values: {', '.join(missing)}")
    failed = [f"{key}={values[key]:02X}" for key, expected_value in expected.items() if values[key] != expected_value]
    if failed:
        raise RuntimeError("OpenMSX collectible-clear probe failed: " + ", ".join(failed))
    print(
        "Collectible clear probe check passed: "
        f"collectible={values['collectible']:02X}, cell={values['collectible_cell']:02X}, screen={values['screen']:02X}"
    )


def validate_hazard_respawn_probe(path: Path) -> None:
    values = read_probe_values(path)
    expected = {
        "hazard": 1,
        "lives": 2,
        "gameover": 0,
        "screen": 0,
        "player_x": 0x60,
    }
    missing = [key for key in expected if key not in values]
    if "player_y" not in values:
        missing.append("player_y")
    if missing:
        raise RuntimeError(f"OpenMSX hazard-respawn probe is missing values: {', '.join(missing)}")
    failed = [f"{key}={values[key]:02X}" for key, expected_value in expected.items() if values[key] != expected_value]
    if values["player_y"] not in (0x8F, 0x90):
        failed.append(f"player_y={values['player_y']:02X}")
    if failed:
        raise RuntimeError("OpenMSX hazard-respawn probe failed: " + ", ".join(failed))
    print(
        "Hazard respawn probe check passed: "
        f"hazard={values['hazard']:02X}, lives={values['lives']:02X}, gameover={values['gameover']:02X}, "
        f"player={values['player_x']:02X},{values['player_y']:02X}, screen={values['screen']:02X}"
    )


def validate_lives_gameover_probe(path: Path) -> None:
    values = read_probe_values(path)
    expected = {
        "hazard": 1,
        "lives": 0,
        "gameover": 1,
        "screen": 0,
        "player_x": 0x60,
    }
    missing = [key for key in expected if key not in values]
    if "player_y" not in values:
        missing.append("player_y")
    if missing:
        raise RuntimeError(f"OpenMSX lives/gameover probe is missing values: {', '.join(missing)}")
    failed = [f"{key}={values[key]:02X}" for key, expected_value in expected.items() if values[key] != expected_value]
    if values["player_y"] not in (0x8F, 0x90):
        failed.append(f"player_y={values['player_y']:02X}")
    if failed:
        raise RuntimeError("OpenMSX lives/gameover probe failed: " + ", ".join(failed))
    print(
        "Lives/gameover probe check passed: "
        f"hazard={values['hazard']:02X}, lives={values['lives']:02X}, gameover={values['gameover']:02X}, "
        f"player={values['player_x']:02X},{values['player_y']:02X}, screen={values['screen']:02X}"
    )


def validate_jump_screenshot(grounded_path: Path, jump_path: Path) -> None:
    _ground_min_x, ground_min_y, _ground_max_x, ground_max_y = locate_green_player_bounds(grounded_path)
    _jump_min_x, jump_min_y, _jump_max_x, jump_max_y = locate_green_player_bounds(jump_path)
    if jump_max_y >= ground_min_y:
        raise RuntimeError(
            "Player does not appear to be airborne in jump screenshot: "
            f"ground_y={ground_min_y}-{ground_max_y}, jump_y={jump_min_y}-{jump_max_y}"
        )
    print(
        "Jump pixel check passed: "
        f"ground_y={ground_min_y}-{ground_max_y}, jump_y={jump_min_y}-{jump_max_y}"
    )


def validate_world_transition_screenshot(path: Path) -> None:
    width, height, rows = read_png_rgb(path)
    cyan_exit_marker_pixels: list[tuple[int, int]] = []

    for y, row in enumerate(rows):
        for x, (r, g, b) in enumerate(row):
            if x > width * 0.62 and height * 0.55 < y < height * 0.72 and r < 100 and g > 150 and b > 150:
                cyan_exit_marker_pixels.append((x, y))

    if len(cyan_exit_marker_pixels) < 20:
        raise RuntimeError(f"Could not find the right-side marker from the transitioned WorldMap screen: {path}")
    print(f"World transition pixel check passed: marker_pixels={len(cyan_exit_marker_pixels)}")


def read_probe_values(path: Path) -> dict[str, int]:
    if not path.exists():
        raise RuntimeError(f"OpenMSX gameplay probe was not created: {path}")
    values: dict[str, int] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if "=" not in line:
            continue
        key, raw_value = line.split("=", 1)
        values[key.strip()] = int(raw_value.strip(), 16)
    return values


def validate_gameplay_probe(path: Path, expected: dict[str, int], label: str) -> None:
    values = read_probe_values(path)
    missing = [key for key in expected if key not in values]
    if missing:
        raise RuntimeError(f"OpenMSX {label} gameplay probe is missing values: {', '.join(missing)}")
    failed = [f"{key}={values[key]:02X}" for key, expected_value in expected.items() if values[key] != expected_value]
    if failed:
        raise RuntimeError(f"OpenMSX {label} gameplay probe failed: " + ", ".join(failed))
    print(
        f"Gameplay probe check passed ({label}): "
        + ", ".join(f"{key}={values[key]:02X}" for key in expected)
    )


def capture_openmsx(
    args: argparse.Namespace,
    project_root: Path,
    rom_output: Path,
    screenshot_output: Path,
    sequence: str,
    capture_wait_ms: int,
    probe_output: Path | None = None,
) -> None:
    capture_cmd = [
        sys.executable,
        "scripts/capture_openmsx_action.py",
        "--rom",
        str(rom_output),
        "--sequence",
        sequence,
        "--project-root",
        str(project_root),
        "--output",
        str(screenshot_output),
        "--machine",
        args.machine,
        "--boot-wait-ms",
        str(args.boot_wait_ms),
        "--capture-wait-ms",
        str(capture_wait_ms),
    ]
    if probe_output:
        capture_cmd.extend([
            "--probe-output",
            str(probe_output),
            "--probe",
            "collectible:0xC00E",
            "--probe",
            "hazard:0xC00C",
            "--probe",
            "exit:0xC00D",
            "--probe",
            "blocked:0xC010",
            "--probe",
            "lives:0xC011",
            "--probe",
            "gameover:0xC012",
            "--probe",
            "screen:0xC00B",
            "--probe",
            "player_x:0xC000",
            "--probe",
            "player_y:0xC001",
            "--probe",
            "collectible_cell:0xC0B7",
        ])
    if args.openmsx:
        capture_cmd.extend(["--openmsx", args.openmsx])
    run_command(capture_cmd, cwd=project_root, timeout=120)
    if not screenshot_output.exists():
        raise RuntimeError(f"OpenMSX screenshot was not created: {screenshot_output}")


def parse_args() -> argparse.Namespace:
    root = repo_root_from_script()
    out = root / "test" / "msx2-screen5" / "out"
    parser = argparse.ArgumentParser(description="Build and optionally capture the native msx2screen layer smoke ROM.")
    parser.add_argument("--project-root", default=str(root), help="Mideas repository root")
    parser.add_argument("--json", default=str(root / "test" / "msx2-screen5" / "msx2screen-layers-project.json"), help="Fixture JSON path")
    parser.add_argument("--asm-output", default=str(out / "msx2screen-layers.asm"), help="Output ASM path")
    parser.add_argument("--rom-output", default=str(out / "msx2screen-layers.rom"), help="Output ROM path")
    parser.add_argument("--sym-output", default=str(out / "msx2screen-layers.sym"), help="Output symbols path")
    parser.add_argument("--screenshot-output", default=str(out / "msx2screen-layers-right-blocked.png"), help="Output OpenMSX screenshot path")
    parser.add_argument("--right-probe-output", default=str(out / "msx2screen-layers-right-blocked-probe.txt"), help="Output OpenMSX right collision RAM probe path")
    parser.add_argument("--collect-screenshot-output", default=str(out / "msx2screen-layers-collect.png"), help="Output OpenMSX collectible screenshot path")
    parser.add_argument("--collect-probe-output", default=str(out / "msx2screen-layers-collect-probe.txt"), help="Output OpenMSX collectible RAM probe path")
    parser.add_argument("--hazard-screenshot-output", default=str(out / "msx2screen-layers-hazard-respawn.png"), help="Output OpenMSX hazard respawn screenshot path")
    parser.add_argument("--hazard-probe-output", default=str(out / "msx2screen-layers-hazard-respawn-probe.txt"), help="Output OpenMSX hazard respawn RAM probe path")
    parser.add_argument("--lives-screenshot-output", default=str(out / "msx2screen-layers-lives-gameover.png"), help="Output OpenMSX lives/gameover screenshot path")
    parser.add_argument("--lives-probe-output", default=str(out / "msx2screen-layers-lives-gameover-probe.txt"), help="Output OpenMSX lives/gameover RAM probe path")
    parser.add_argument("--grounded-screenshot-output", default=str(out / "msx2screen-layers-grounded.png"), help="Output OpenMSX grounded baseline screenshot path")
    parser.add_argument("--jump-screenshot-output", default=str(out / "msx2screen-layers-jump-mid.png"), help="Output OpenMSX jump screenshot path")
    parser.add_argument("--transition-screenshot-output", default=str(out / "msx2screen-layers-world-left.png"), help="Output OpenMSX WorldMap transition screenshot path")
    parser.add_argument("--locked-transition-screenshot-output", default=str(out / "msx2screen-layers-world-left-locked.png"), help="Output OpenMSX locked-exit WorldMap transition screenshot path")
    parser.add_argument("--gameplay-probe-output", default=str(out / "msx2screen-layers-gameplay-probe.txt"), help="Output OpenMSX gameplay RAM probe path")
    parser.add_argument("--locked-gameplay-probe-output", default=str(out / "msx2screen-layers-gameplay-locked-probe.txt"), help="Output OpenMSX locked-exit gameplay RAM probe path")
    parser.add_argument("--openmsx", help="Explicit openmsx executable path")
    parser.add_argument("--machine", default="C-BIOS_MSX2", help="OpenMSX machine id")
    parser.add_argument("--sequence", default="WAIT:500,RIGHT:1000", help="Input sequence for capture")
    parser.add_argument("--collect-sequence", default="RIGHT:700", help="Input sequence for the collectible clear probe")
    parser.add_argument("--hazard-sequence", default="RIGHT:700,SPACE:350", help="Input sequence for the hazard respawn probe")
    parser.add_argument("--lives-sequence", default="RIGHT:700,SPACE:350,WAIT:250,RIGHT:700,SPACE:350,WAIT:250,RIGHT:700,SPACE:350", help="Input sequence for the lives/gameover probe")
    parser.add_argument("--grounded-sequence", default="WAIT:500", help="Input sequence for the grounded baseline capture")
    parser.add_argument("--jump-sequence", default="SPACE:250", help="Input sequence for the jump capture")
    parser.add_argument("--transition-sequence", default="RIGHT:700,LEFT:5200", help="Input sequence for the collected WorldMap transition capture")
    parser.add_argument("--locked-transition-sequence", default="LEFT:4200", help="Input sequence for the WorldMap transition capture without collecting first")
    parser.add_argument("--boot-wait-ms", type=int, default=6000, help="Wait before input replay")
    parser.add_argument("--capture-wait-ms", type=int, default=500, help="Wait before screenshot after input")
    parser.add_argument("--jump-capture-wait-ms", type=int, default=0, help="Wait before screenshot after jump input")
    parser.add_argument("--transition-capture-wait-ms", type=int, default=700, help="Wait before screenshot after transition input")
    parser.add_argument("--summary-ts-build-dir", default=str(root / "server" / "temp" / "tsbuild_msx2screen_layers_summary"), help="Temporary TypeScript build directory for summary-route validation")
    parser.add_argument("--strict-tsc", action="store_true", help="Fail when TypeScript reports diagnostics during summary-route validation")
    parser.add_argument("--skip-openmsx", action="store_true", help="Build and static-check only")
    parser.add_argument("--skip-image-check", action="store_true", help="Do not inspect screenshot pixels after OpenMSX capture")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    project_root = Path(args.project_root).expanduser().resolve()
    project_json = Path(args.json).expanduser().resolve()
    asm_output = Path(args.asm_output).expanduser().resolve()
    rom_output = Path(args.rom_output).expanduser().resolve()
    sym_output = Path(args.sym_output).expanduser().resolve() if args.sym_output else None
    screenshot_output = Path(args.screenshot_output).expanduser().resolve()
    right_probe_output = Path(args.right_probe_output).expanduser().resolve()
    collect_screenshot_output = Path(args.collect_screenshot_output).expanduser().resolve()
    collect_probe_output = Path(args.collect_probe_output).expanduser().resolve()
    hazard_screenshot_output = Path(args.hazard_screenshot_output).expanduser().resolve()
    hazard_probe_output = Path(args.hazard_probe_output).expanduser().resolve()
    lives_screenshot_output = Path(args.lives_screenshot_output).expanduser().resolve()
    lives_probe_output = Path(args.lives_probe_output).expanduser().resolve()
    grounded_screenshot_output = Path(args.grounded_screenshot_output).expanduser().resolve()
    jump_screenshot_output = Path(args.jump_screenshot_output).expanduser().resolve()
    transition_screenshot_output = Path(args.transition_screenshot_output).expanduser().resolve()
    locked_transition_screenshot_output = Path(args.locked_transition_screenshot_output).expanduser().resolve()
    gameplay_probe_output = Path(args.gameplay_probe_output).expanduser().resolve()
    locked_gameplay_probe_output = Path(args.locked_gameplay_probe_output).expanduser().resolve()
    summary_ts_build_dir = Path(args.summary_ts_build_dir).expanduser().resolve()

    run_command(["node", "scripts/create_msx2_screen5_layers_fixture.mjs"], cwd=project_root)
    validate_fixture_json(project_json)
    compiled_index = compile_generator(project_root, summary_ts_build_dir, args.strict_tsc)
    validate_summary_codegen(project_root, project_json, compiled_index)

    build_cmd = [
        sys.executable,
        "scripts/build_mideas_unified_rom.py",
        "--json",
        str(project_json),
        "--project-root",
        str(project_root),
        "--asm-output",
        str(asm_output),
        "--rom-output",
        str(rom_output),
    ]
    if sym_output:
        build_cmd.extend(["--sym-output", str(sym_output)])
    run_command(build_cmd, cwd=project_root, timeout=180)

    validate_asm(asm_output)
    validate_rom(rom_output)

    if args.skip_openmsx:
        print("OpenMSX capture skipped by --skip-openmsx")
        print(f"ROM ready: {rom_output} ({rom_output.stat().st_size} bytes)")
        return

    capture_openmsx(args, project_root, rom_output, screenshot_output, args.sequence, args.capture_wait_ms, right_probe_output)
    capture_openmsx(args, project_root, rom_output, collect_screenshot_output, args.collect_sequence, args.capture_wait_ms, collect_probe_output)
    capture_openmsx(args, project_root, rom_output, hazard_screenshot_output, args.hazard_sequence, args.capture_wait_ms, hazard_probe_output)
    capture_openmsx(args, project_root, rom_output, lives_screenshot_output, args.lives_sequence, args.capture_wait_ms, lives_probe_output)
    capture_openmsx(args, project_root, rom_output, grounded_screenshot_output, args.grounded_sequence, args.capture_wait_ms)
    capture_openmsx(args, project_root, rom_output, jump_screenshot_output, args.jump_sequence, args.jump_capture_wait_ms)
    capture_openmsx(
        args,
        project_root,
        rom_output,
        locked_transition_screenshot_output,
        args.locked_transition_sequence,
        args.transition_capture_wait_ms,
        locked_gameplay_probe_output,
    )
    capture_openmsx(
        args,
        project_root,
        rom_output,
        transition_screenshot_output,
        args.transition_sequence,
        args.transition_capture_wait_ms,
        gameplay_probe_output,
    )
    if not args.skip_image_check:
        validate_blocked_screenshot(screenshot_output)
        validate_right_blocked_probe(right_probe_output)
        validate_collectible_clear_probe(collect_probe_output)
        validate_hazard_respawn_probe(hazard_probe_output)
        validate_lives_gameover_probe(lives_probe_output)
        validate_jump_screenshot(grounded_screenshot_output, jump_screenshot_output)
        validate_world_transition_screenshot(locked_transition_screenshot_output)
        validate_world_transition_screenshot(transition_screenshot_output)
        validate_gameplay_probe(
            locked_gameplay_probe_output,
            {"collectible": 0, "hazard": 0, "exit": 0, "blocked": 1},
            "locked exit",
        )
        validate_gameplay_probe(
            gameplay_probe_output,
            {"collectible": 1, "hazard": 0, "exit": 1, "blocked": 0},
            "open exit",
        )
    print(f"OpenMSX screenshot ready: {screenshot_output}")
    print(f"OpenMSX right collision probe ready: {right_probe_output}")
    print(f"OpenMSX collectible screenshot ready: {collect_screenshot_output}")
    print(f"OpenMSX collectible probe ready: {collect_probe_output}")
    print(f"OpenMSX hazard respawn screenshot ready: {hazard_screenshot_output}")
    print(f"OpenMSX hazard respawn probe ready: {hazard_probe_output}")
    print(f"OpenMSX lives/gameover screenshot ready: {lives_screenshot_output}")
    print(f"OpenMSX lives/gameover probe ready: {lives_probe_output}")
    print(f"OpenMSX grounded screenshot ready: {grounded_screenshot_output}")
    print(f"OpenMSX jump screenshot ready: {jump_screenshot_output}")
    print(f"OpenMSX locked WorldMap transition screenshot ready: {locked_transition_screenshot_output}")
    print(f"OpenMSX WorldMap transition screenshot ready: {transition_screenshot_output}")
    print(f"OpenMSX locked gameplay probe ready: {locked_gameplay_probe_output}")
    print(f"OpenMSX gameplay probe ready: {gameplay_probe_output}")


if __name__ == "__main__":
    main()
