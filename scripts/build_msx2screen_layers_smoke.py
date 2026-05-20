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


RESPAWN_PLAYER_Y_VALUES = (0x8E, 0x8F, 0x90)
ENEMY_RESPAWN_PLAYER_X_VALUES = (0x5F, 0x60)


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
    screen_asset = next((asset for asset in screen_assets if asset.get("id") == "screen_msx2_layers_smoke"), None)
    sprite_asset = next((asset for asset in project.get("assets", []) if asset.get("type") == "msx2sprite"), None)
    world_asset = next((asset for asset in project.get("assets", []) if asset.get("type") == "worldmap"), None)
    gameflow_asset = next((asset for asset in project.get("assets", []) if asset.get("type") == "gameflow"), None)
    if not screen_asset:
        raise RuntimeError("Fixture does not contain an msx2screen asset")
    if len(screen_assets) < 2:
        raise RuntimeError("Fixture must contain at least two msx2screen assets for WorldMap transition smoke")
    if screen_assets[0].get("id") == screen_asset.get("id"):
        raise RuntimeError("Fixture must keep the WorldMap start screen out of the first asset slot")
    if not sprite_asset:
        raise RuntimeError("Fixture does not contain an msx2sprite asset")
    if not world_asset:
        raise RuntimeError("Fixture does not contain a worldmap asset")
    if not gameflow_asset:
        raise RuntimeError("Fixture does not contain a gameflow asset")

    screen = screen_asset.get("data", {})
    for asset in screen_assets:
        runtime = asset.get("data", {}).get("runtime", {})
        if int(runtime.get("requiredCollectibles", -1)) != 2:
            raise RuntimeError("Fixture MSX2 screens must require two collectibles before exits unlock")
        initial_air = int(runtime.get("initialAir", -1))
        if initial_air < 1 or initial_air > 255:
            raise RuntimeError("Fixture MSX2 screens must define an initialAir byte between 1 and 255")
    layers = screen.get("layers", {})
    for layer_name in ("collision", "effects", "behavior"):
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
    collectible_cells = [
        cell
        for asset in screen_assets
        for row in asset.get("data", {}).get("layers", {}).get("effects", [])
        for cell in row
        if int(cell or 0) == 3
    ]
    if len(collectible_cells) < 2:
        raise RuntimeError("Fixture must contain at least two collectible=3 effect cells")
    behavior_codes = {
        int(cell or 0)
        for asset in screen_assets
        for row in asset.get("data", {}).get("layers", {}).get("behavior", [])
        for cell in row
    }
    required_behavior_codes = {1, 2}
    if not required_behavior_codes.issubset(behavior_codes):
        raise RuntimeError(
            "Fixture behavior layer must include ladder=1 and conveyor-right=2 cells; "
            f"found {sorted(behavior_codes)}"
        )

    entities = layers.get("entities")
    if not isinstance(entities, list) or not any(entity.get("kind") == "player" for entity in entities):
        raise RuntimeError("Fixture must contain a player entity in msx2screen.layers.entities")
    enemy_entities = [entity for entity in entities if entity.get("kind") in ("enemy", "hazard")]
    if len(enemy_entities) < 2:
        raise RuntimeError("Fixture must contain at least two enemy/hazard entities in msx2screen.layers.entities")

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
  "msx2_current_behavior_ptr",
  "MSX2_LAYERS_SMOKE_SCREEN_BEHAVIOR",
  "apply_hardware_sprite_gravity",
  "msx2_player_dead_flag",
  "msx2_exit_reached_flag",
  "msx2_collectible_count",
  "msx2_effects_runtime_buffers",
  "msx2_runtime_ram_end",
  "msx2_runtime_ram_limit",
  "init_msx2_effect_buffers",
  "clear_msx2_collectible_visual",
  "screen5_blank_tile",
  "msx2_exit_blocked_flag",
  "msx2_lives",
  "msx2_game_over_flag",
  "msx2_game_over_restart_lock",
  "msx2_level_complete_flag",
  "msx2_level_continue_lock",
  "draw_msx2_lives_hud",
  "draw_msx2_collectible_hud",
  "draw_msx2_air_hud",
  "update_msx2_air_timer",
  "msx2_air_value",
  "msx2_air_frame_counter",
  "msx2_behavior_at_pixel",
  "msx2_ladder_at_player_center",
  "msx2_behavior_below_player_center",
  "apply_msx2_conveyor",
  "move_msx2_ladder_up",
  "draw_msx2_game_over_banner",
  "draw_msx2_level_complete_banner",
  "msx2_game_over_idle",
  "msx2_level_complete_idle",
  "msx2_continue_after_level_complete",
  "msx2_restart_game",
  "write_hardware_sprite_attrs",
  "msx2_required_collectibles",
  "msx2_required_collectibles EQU 2",
  "msx2_screen_required_collectibles",
  "msx2_compare_collectibles_required",
  "msx2_screen_initial_air",
  "msx2_load_current_screen_air",
  "msx2_reset_screen_transition_flags",
  "msx2_respawn_current_screen",
  "msx2_screen_spawn_x",
  "msx2_screen_enemy_count",
  "msx2_screen_enemy_min_x",
  "msx2_screen_enemy_min_y",
  "msx2_enemy_runtime_x",
  "msx2_enemy_runtime_dy",
  "msx2_hw_enemy_sprite_pattern",
  "msx2_hw_enemy_sprite_colors_0",
  "update_msx2_enemy_positions",
  "update_msx2_enemy_state",
  ".enemy_no_slot_1:",
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
        "msx2_current_behavior_ptr",
        "MSX2_LAYERS_SMOKE_SCREEN_BEHAVIOR",
        "msx2_collision_at_pixel",
        "msx2_effect_at_pixel",
        "msx2_behavior_at_pixel",
        "msx2_behavior_below_player_center",
        "msx2_player_dead_flag",
        "msx2_exit_reached_flag",
        "msx2_collectible_count",
        "msx2_effects_runtime_buffers",
        "msx2_runtime_ram_end",
        "msx2_runtime_ram_limit",
        "init_msx2_effect_buffers",
        "apply_MSX2_LAYERS_SMOKE_SCREEN_collected_visuals",
        "clear_msx2_collectible_visual",
        "screen5_blank_tile",
        "msx2_exit_blocked_flag",
        "msx2_lives",
        "msx2_game_over_flag",
        "msx2_game_over_restart_lock",
        "msx2_level_complete_flag",
        "msx2_level_continue_lock",
        "msx2_enemy_hit_flag",
        "msx2_enemy_damage_cooldown",
        "draw_msx2_lives_hud",
        "draw_msx2_collectible_hud",
        "draw_msx2_air_hud",
        "update_msx2_air_timer",
        "msx2_air_value",
        "msx2_air_frame_counter",
        "msx2_ladder_at_player_center",
        "apply_msx2_conveyor",
        "move_msx2_ladder_up",
        "draw_msx2_game_over_banner",
        "draw_msx2_level_complete_banner",
        "msx2_game_over_idle",
        "msx2_level_complete_idle",
        "msx2_continue_after_level_complete",
        "msx2_restart_game",
        "write_hardware_sprite_attrs",
        "msx2_required_collectibles",
        "msx2_required_collectibles EQU 2",
        "msx2_screen_required_collectibles",
        "msx2_compare_collectibles_required",
        "msx2_screen_initial_air",
        "msx2_load_current_screen_air",
        "msx2_reset_screen_transition_flags",
        "msx2_respawn_current_screen",
        "msx2_screen_spawn_x",
        "msx2_screen_enemy_count",
        "msx2_screen_enemy_min_x",
        "msx2_screen_enemy_max_x",
        "msx2_screen_enemy_min_y",
        "msx2_screen_enemy_max_y",
        "msx2_screen_enemy_dx",
        "msx2_screen_enemy_dy",
        "msx2_enemy_runtime_x",
        "msx2_enemy_runtime_dy",
        "msx2_hw_enemy_sprite_pattern",
        "msx2_hw_enemy_sprite_colors_0",
        "update_msx2_enemy_positions",
        "update_msx2_enemy_state",
        ".enemy_no_slot_1:",
        "msx2_apply_damage_respawn",
        "update_hardware_sprite_vertical",
        "apply_hardware_sprite_gravity",
        "msx2_player_jump_frames",
        "msx2_player_on_ground",
        ".right_blocked:",
        ".left_blocked:",
        "call update_msx2_effect_state",
        "call update_msx2_enemy_state",
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


def validate_editor_contract(project_root: Path) -> None:
    contract_script = project_root / "scripts" / "check_msx2_entity_editor_contract.mjs"
    if not contract_script.exists():
        raise RuntimeError(f"Missing MSX2 editor contract script: {contract_script}")
    run_command(["node", str(contract_script.relative_to(project_root))], cwd=project_root, timeout=30)


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


def count_yellow_pixels(path: Path) -> int:
    width, height, rows = read_png_rgb(path)
    yellow_pixels = 0
    for y, row in enumerate(rows):
        if not (height * 0.20 < y < height * 0.90):
            continue
        for x, (r, g, b) in enumerate(row):
            if width * 0.05 < x < width * 0.95 and r > 170 and g > 160 and b < min(r, g) - 20:
                yellow_pixels += 1
    return yellow_pixels


def count_hud_yellow_pixels(path: Path) -> int:
    width, height, rows = read_png_rgb(path)
    yellow_pixels = 0
    for y, row in enumerate(rows):
        if y > height * 0.16:
            continue
        for x, (r, g, b) in enumerate(row):
            if width * 0.05 < x < width * 0.45 and r > 170 and g > 160 and b < min(r, g) - 20:
                yellow_pixels += 1
    return yellow_pixels


def count_air_hud_green_pixels(path: Path) -> int:
    width, height, rows = read_png_rgb(path)
    green_pixels = 0
    for y, row in enumerate(rows):
        if y > height * 0.13:
            continue
        for x, (r, g, b) in enumerate(row):
            if width * 0.55 < x < width * 0.92 and g > 120 and r < 120 and b < 120:
                green_pixels += 1
    return green_pixels


def validate_collectible_hud_progress(empty_path: Path, one_path: Path, both_path: Path) -> None:
    empty_pixels = count_hud_yellow_pixels(empty_path)
    one_pixels = count_hud_yellow_pixels(one_path)
    both_pixels = count_hud_yellow_pixels(both_path)
    if empty_pixels > 5:
        raise RuntimeError(f"Collectible HUD should start empty: {empty_path}; yellow_pixels={empty_pixels}")
    if one_pixels < 20:
        raise RuntimeError(f"Collectible HUD did not show the first collected item: {one_path}; yellow_pixels={one_pixels}")
    if both_pixels < one_pixels + 20:
        raise RuntimeError(
            f"Collectible HUD did not advance after the second collected item: {both_path}; "
            f"empty={empty_pixels}, one={one_pixels}, both={both_pixels}"
        )
    print(f"Collectible HUD progress check passed: empty={empty_pixels}, one={one_pixels}, both={both_pixels}")


def validate_air_probe(path: Path) -> None:
    values = read_probe_values(path)
    required = ["air", "air_frame", "gameover"]
    missing = [key for key in required if key not in values]
    if missing:
        raise RuntimeError(f"OpenMSX air probe is missing values: {', '.join(missing)}")
    air = values["air"]
    air_frame = values["air_frame"]
    gameover = values["gameover"]
    if not (0 < air < 0xFD):
        raise RuntimeError(f"OpenMSX air probe did not advance enough: air={air:02X}")
    if air_frame >= 48:
        raise RuntimeError(f"OpenMSX air frame divider is outside its expected range: air_frame={air_frame:02X}")
    if gameover != 0:
        raise RuntimeError(f"OpenMSX air probe reached unexpected game over: gameover={gameover:02X}")
    print(f"Air probe check passed: air={air:02X}, air_frame={air_frame:02X}, gameover={gameover:02X}")


def validate_air_hud_progress(initial_path: Path, later_path: Path) -> None:
    initial_pixels = count_air_hud_green_pixels(initial_path)
    later_pixels = count_air_hud_green_pixels(later_path)
    if initial_pixels < 300:
        raise RuntimeError(f"Could not find the initial green air HUD: {initial_path}; green_pixels={initial_pixels}")
    if later_pixels >= initial_pixels - 40:
        raise RuntimeError(
            f"Air HUD did not visibly decrease: initial={initial_pixels}, later={later_pixels}, "
            f"initial_path={initial_path}, later_path={later_path}"
        )
    if later_pixels < 100:
        raise RuntimeError(f"Air HUD decreased too far for this smoke route: {later_path}; green_pixels={later_pixels}")
    print(f"Air HUD progress check passed: initial={initial_pixels}, later={later_pixels}")


def validate_ladder_probe(path: Path) -> None:
    values = read_probe_values(path)
    required = ["player_x", "player_y", "screen", "gameover"]
    missing = [key for key in required if key not in values]
    if missing:
        raise RuntimeError(f"OpenMSX ladder probe is missing values: {', '.join(missing)}")
    if values["screen"] != 0 or values["gameover"] != 0:
        raise RuntimeError(
            f"OpenMSX ladder probe left the expected playable state: "
            f"screen={values['screen']:02X}, gameover={values['gameover']:02X}"
        )
    if values["player_y"] >= 0x8A:
        raise RuntimeError(f"OpenMSX ladder probe did not climb upward enough: player_y={values['player_y']:02X}")
    print(
        "Ladder behavior probe check passed: "
        f"player={values['player_x']:02X},{values['player_y']:02X}, screen={values['screen']:02X}"
    )


def validate_collectible_visual(visible_path: Path, cleared_path: Path) -> None:
    visible_pixels = count_yellow_pixels(visible_path)
    cleared_pixels = count_yellow_pixels(cleared_path)
    if visible_pixels < 80:
        raise RuntimeError(f"Could not find visible yellow collectible before collection: {visible_path}; yellow_pixels={visible_pixels}")
    cleared_delta = visible_pixels - cleared_pixels
    if cleared_pixels >= visible_pixels or cleared_delta < 80:
        raise RuntimeError(
            f"Collectible visual was not cleared after collection: {cleared_path}; "
            f"before={visible_pixels}, after={cleared_pixels}"
        )
    print(
        "Collectible visual clear check passed: "
        f"before_yellow={visible_pixels}, after_yellow={cleared_pixels}, cleared_delta={cleared_delta}"
    )


def validate_collect_both_probe(path: Path) -> None:
    values = read_probe_values(path)
    expected = {
        "collectible": 2,
        "hazard": 1,
        "exit": 0,
        "blocked": 0,
        "lives": 2,
        "screen": 0,
        "collectible_cell": 0,
        "collectible_cell_left": 0,
    }
    missing = [key for key in expected if key not in values]
    if missing:
        raise RuntimeError(f"OpenMSX collect-both probe is missing values: {', '.join(missing)}")
    failed = [f"{key}={values[key]:02X}" for key, expected_value in expected.items() if values[key] != expected_value]
    if failed:
        raise RuntimeError("OpenMSX collect-both probe failed: " + ", ".join(failed))
    print(
        "Collect-both probe check passed: "
        f"collectible={values['collectible']:02X}, right_cell={values['collectible_cell']:02X}, "
        f"left_cell={values['collectible_cell_left']:02X}, screen={values['screen']:02X}"
    )


def validate_collect_both_visual(cleared_path: Path) -> None:
    remaining_pixels = count_yellow_pixels(cleared_path)
    if remaining_pixels > 5:
        raise RuntimeError(
            f"Both collectible visuals were not cleared after collection: {cleared_path}; "
            f"remaining_yellow={remaining_pixels}"
        )
    print(f"Collect-both visual clear check passed: remaining_yellow={remaining_pixels}")


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
    if values["player_y"] not in RESPAWN_PLAYER_Y_VALUES:
        failed.append(f"player_y={values['player_y']:02X}")
    if failed:
        raise RuntimeError("OpenMSX hazard-respawn probe failed: " + ", ".join(failed))
    print(
        "Hazard respawn probe check passed: "
        f"hazard={values['hazard']:02X}, lives={values['lives']:02X}, gameover={values['gameover']:02X}, "
        f"player={values['player_x']:02X},{values['player_y']:02X}, screen={values['screen']:02X}"
    )


def validate_enemy_respawn_probe(path: Path) -> None:
    values = read_probe_values(path)
    expected = {
        "enemy": 1,
        "hazard": 1,
        "lives": 2,
        "gameover": 0,
        "screen": 0,
    }
    missing = [key for key in expected if key not in values]
    if "player_y" not in values:
        missing.append("player_y")
    if missing:
        raise RuntimeError(f"OpenMSX enemy-respawn probe is missing values: {', '.join(missing)}")
    failed = [f"{key}={values[key]:02X}" for key, expected_value in expected.items() if values[key] != expected_value]
    if values["player_x"] not in ENEMY_RESPAWN_PLAYER_X_VALUES:
        failed.append(f"player_x={values['player_x']:02X}")
    if values["player_y"] not in RESPAWN_PLAYER_Y_VALUES:
        failed.append(f"player_y={values['player_y']:02X}")
    if failed:
        raise RuntimeError("OpenMSX enemy-respawn probe failed: " + ", ".join(failed))
    print(
        "Enemy entity respawn probe check passed: "
        f"enemy={values['enemy']:02X}, lives={values['lives']:02X}, gameover={values['gameover']:02X}, "
        f"player={values['player_x']:02X},{values['player_y']:02X}, screen={values['screen']:02X}"
    )


def validate_enemy_motion_probe(first_path: Path, second_path: Path) -> None:
    first = read_probe_values(first_path)
    second = read_probe_values(second_path)
    missing = [key for key in ("enemy0_x", "enemy0_dx", "enemy2_y", "enemy2_dy") if key not in first or key not in second]
    if missing:
        raise RuntimeError(f"OpenMSX enemy motion probe is missing values: {', '.join(sorted(set(missing)))}")
    first_x = first["enemy0_x"]
    second_x = second["enemy0_x"]
    first_y = first["enemy2_y"]
    second_y = second["enemy2_y"]
    if first_x == second_x:
        raise RuntimeError(f"OpenMSX enemy motion probe did not move: enemy0_x={first_x:02X}")
    if first_y == second_y:
        raise RuntimeError(f"OpenMSX vertical enemy motion probe did not move: enemy2_y={first_y:02X}")
    if not (0x20 <= first_x <= 0x60 and 0x20 <= second_x <= 0x60):
        raise RuntimeError(f"OpenMSX enemy motion probe left patrol bounds: first={first_x:02X}, second={second_x:02X}")
    if not (0x30 <= first_y <= 0x70 and 0x30 <= second_y <= 0x70):
        raise RuntimeError(f"OpenMSX vertical enemy motion probe left patrol bounds: first={first_y:02X}, second={second_y:02X}")
    if first["enemy0_dx"] not in (0x01, 0xFF) or second["enemy0_dx"] not in (0x01, 0xFF):
        raise RuntimeError(
            "OpenMSX enemy motion probe has invalid direction: "
            f"first_dx={first['enemy0_dx']:02X}, second_dx={second['enemy0_dx']:02X}"
        )
    if first["enemy2_dy"] not in (0x01, 0xFF) or second["enemy2_dy"] not in (0x01, 0xFF):
        raise RuntimeError(
            "OpenMSX vertical enemy motion probe has invalid direction: "
            f"first_dy={first['enemy2_dy']:02X}, second_dy={second['enemy2_dy']:02X}"
        )
    print(
        "Enemy motion probe check passed: "
        f"first_x={first_x:02X}, second_x={second_x:02X}, "
        f"first_dx={first['enemy0_dx']:02X}, second_dx={second['enemy0_dx']:02X}, "
        f"first_y={first_y:02X}, second_y={second_y:02X}, "
        f"first_dy={first['enemy2_dy']:02X}, second_dy={second['enemy2_dy']:02X}"
    )


def validate_enemy_sprite_screenshot(path: Path) -> None:
    width, height, rows = read_png_rgb(path)
    magenta_pixels = 0

    for y, row in enumerate(rows):
        if not (height * 0.10 < y < height * 0.85):
            continue
        for x, (r, g, b) in enumerate(row):
            if width * 0.05 < x < width * 0.95 and r > 130 and b > 110 and g < 120:
                magenta_pixels += 1

    if magenta_pixels < 80:
        raise RuntimeError(
            f"Could not find visible magenta enemy hardware sprites in screenshot: {path}; "
            f"magenta_pixels={magenta_pixels}"
        )
    print(f"Enemy sprite pixel check passed: magenta_pixels={magenta_pixels}")


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
    if values["player_y"] not in RESPAWN_PLAYER_Y_VALUES:
        failed.append(f"player_y={values['player_y']:02X}")
    if failed:
        raise RuntimeError("OpenMSX lives/gameover probe failed: " + ", ".join(failed))
    print(
        "Lives/gameover probe check passed: "
        f"hazard={values['hazard']:02X}, lives={values['lives']:02X}, gameover={values['gameover']:02X}, "
        f"player={values['player_x']:02X},{values['player_y']:02X}, screen={values['screen']:02X}"
    )


def count_red_banner_pixels(path: Path) -> int:
    width, height, rows = read_png_rgb(path)
    red_banner_pixels: list[tuple[int, int]] = []

    for y, row in enumerate(rows):
        if not (height * 0.07 < y < height * 0.22):
            continue
        for x, (r, g, b) in enumerate(row):
            if width * 0.18 < x < width * 0.82 and r > 150 and g < 90 and b < 90:
                red_banner_pixels.append((x, y))
    return len(red_banner_pixels)


def validate_gameover_screenshot(path: Path) -> None:
    red_pixels = count_red_banner_pixels(path)
    if red_pixels < 80:
        raise RuntimeError(
            f"Could not find the red game-over banner in screenshot: {path}; "
            f"red_pixels={red_pixels}"
        )
    print(f"Game-over banner pixel check passed: red_pixels={red_pixels}")


def validate_restart_probe(path: Path) -> None:
    values = read_probe_values(path)
    expected = {
        "collectible": 0,
        "hazard": 0,
        "exit": 0,
        "blocked": 0,
        "lives": 3,
        "gameover": 0,
        "restart_lock": 0,
        "level": 0,
        "level_lock": 0,
        "screen": 0,
        "player_x": 0x60,
        "collectible_cell": 3,
    }
    missing = [key for key in expected if key not in values]
    if "player_y" not in values:
        missing.append("player_y")
    if missing:
        raise RuntimeError(f"OpenMSX restart probe is missing values: {', '.join(missing)}")
    failed = [f"{key}={values[key]:02X}" for key, expected_value in expected.items() if values[key] != expected_value]
    if values["player_y"] not in RESPAWN_PLAYER_Y_VALUES:
        failed.append(f"player_y={values['player_y']:02X}")
    if failed:
        raise RuntimeError("OpenMSX restart probe failed: " + ", ".join(failed))
    print(
        "Restart probe check passed: "
        f"lives={values['lives']:02X}, gameover={values['gameover']:02X}, "
        f"collectible={values['collectible']:02X}, cell={values['collectible_cell']:02X}, "
        f"player={values['player_x']:02X},{values['player_y']:02X}, screen={values['screen']:02X}"
    )


def validate_restart_screenshot(path: Path) -> None:
    red_pixels = count_red_banner_pixels(path)
    if red_pixels >= 80:
        raise RuntimeError(f"Game-over banner is still visible after restart: {path}; red_pixels={red_pixels}")
    print(f"Restart screenshot check passed: red_banner_pixels={red_pixels}")


def validate_level_complete_screenshot(path: Path) -> None:
    width, height, rows = read_png_rgb(path)
    yellow_banner_pixels = 0

    for y, row in enumerate(rows):
        if not (height * 0.13 < y < height * 0.28):
            continue
        for x, (r, g, b) in enumerate(row):
            if width * 0.18 < x < width * 0.82 and r > 140 and g > 140 and b < 120:
                yellow_banner_pixels += 1

    if yellow_banner_pixels < 80:
        raise RuntimeError(
            f"Could not find the yellow level-complete banner in screenshot: {path}; "
            f"yellow_pixels={yellow_banner_pixels}"
        )
    print(f"Level-complete banner pixel check passed: yellow_pixels={yellow_banner_pixels}")


def validate_level_continue_probe(path: Path) -> None:
    values = read_probe_values(path)
    expected = {
        "collectible": 0,
        "hazard": 0,
        "exit": 0,
        "blocked": 0,
        "lives": 2,
        "gameover": 0,
        "restart_lock": 0,
        "level": 0,
        "level_lock": 0,
        "screen": 0,
        "player_x": 0x60,
        "collectible_cell": 3,
    }
    missing = [key for key in expected if key not in values]
    if "player_y" not in values:
        missing.append("player_y")
    if missing:
        raise RuntimeError(f"OpenMSX level-continue probe is missing values: {', '.join(missing)}")
    failed = [f"{key}={values[key]:02X}" for key, expected_value in expected.items() if values[key] != expected_value]
    if values["player_y"] not in RESPAWN_PLAYER_Y_VALUES:
        failed.append(f"player_y={values['player_y']:02X}")
    if failed:
        raise RuntimeError("OpenMSX level-continue probe failed: " + ", ".join(failed))
    print(
        "Level-continue probe check passed: "
        f"level={values['level']:02X}, exit={values['exit']:02X}, lives={values['lives']:02X}, "
        f"cell={values['collectible_cell']:02X}, player={values['player_x']:02X},{values['player_y']:02X}, screen={values['screen']:02X}"
    )


def validate_level_continue_screenshot(path: Path) -> None:
    width, height, rows = read_png_rgb(path)
    yellow_banner_pixels = 0
    for y, row in enumerate(rows):
        if not (height * 0.13 < y < height * 0.28):
            continue
        for x, (r, g, b) in enumerate(row):
            if width * 0.18 < x < width * 0.82 and r > 140 and g > 140 and b < 120:
                yellow_banner_pixels += 1
    if yellow_banner_pixels >= 80:
        raise RuntimeError(f"Level-complete banner is still visible after continue: {path}; yellow_pixels={yellow_banner_pixels}")
    print(f"Level-continue screenshot check passed: yellow_banner_pixels={yellow_banner_pixels}")


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


def validate_world_return_collectible_probe(path: Path) -> None:
    values = read_probe_values(path)
    expected = {
        "collectible": 1,
        "collectible_cell": 3,
        "collectible_cell_left": 0,
        "screen": 0,
    }
    missing = [key for key in expected if key not in values]
    if missing:
        raise RuntimeError(f"OpenMSX WorldMap return probe is missing values: {', '.join(missing)}")
    failed = [f"{key}={values[key]:02X}" for key, expected_value in expected.items() if values[key] != expected_value]
    if failed:
        raise RuntimeError("OpenMSX WorldMap return collectible persistence probe failed: " + ", ".join(failed))
    print(
        "WorldMap return collectible persistence probe passed: "
        f"collectible={values['collectible']:02X}, right_cell={values['collectible_cell']:02X}, "
        f"left_cell={values['collectible_cell_left']:02X}, screen={values['screen']:02X}"
    )


def validate_world_return_collectible_visual(initial_path: Path, return_path: Path, cleared_path: Path) -> None:
    initial_pixels = count_yellow_pixels(initial_path)
    return_pixels = count_yellow_pixels(return_path)
    cleared_pixels = count_yellow_pixels(cleared_path)
    if initial_pixels < 80:
        raise RuntimeError(f"Initial room does not show collectible pixels: {initial_path}; yellow_pixels={initial_pixels}")
    if cleared_pixels != 0:
        raise RuntimeError(f"Collect-both screenshot should have no gameplay collectible pixels: {cleared_path}; yellow_pixels={cleared_pixels}")
    if return_pixels <= cleared_pixels + 40:
        raise RuntimeError(
            f"WorldMap return did not redraw the remaining collectible: {return_path}; "
            f"return_yellow={return_pixels}, cleared_yellow={cleared_pixels}"
        )
    if return_pixels >= initial_pixels:
        raise RuntimeError(
            f"WorldMap return appears to redraw all collectibles instead of preserving the cleared one: {return_path}; "
            f"initial_yellow={initial_pixels}, return_yellow={return_pixels}"
        )
    print(
        "WorldMap return collectible visual check passed: "
        f"initial_yellow={initial_pixels}, return_yellow={return_pixels}, cleared_yellow={cleared_pixels}"
    )


def validate_world_transition_air_probe(path: Path, label: str) -> None:
    values = read_probe_values(path)
    required = ["screen", "air", "air_frame"]
    missing = [key for key in required if key not in values]
    if missing:
        raise RuntimeError(f"OpenMSX {label} WorldMap air probe is missing values: {', '.join(missing)}")
    if values["screen"] != 1:
        raise RuntimeError(f"OpenMSX {label} WorldMap air probe did not reach the exit room: screen={values['screen']:02X}")
    if not (0 < values["air"] <= 0xC0):
        raise RuntimeError(
            f"OpenMSX {label} WorldMap air probe did not load the target screen initial air: "
            f"air={values['air']:02X}"
        )
    if values["air_frame"] >= 48:
        raise RuntimeError(
            f"OpenMSX {label} WorldMap air frame divider is outside its expected range: "
            f"air_frame={values['air_frame']:02X}"
        )
    print(
        f"WorldMap target air probe check passed ({label}): "
        f"screen={values['screen']:02X}, air={values['air']:02X}, air_frame={values['air_frame']:02X}"
    )


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


def read_symbol_addresses(path: Path) -> dict[str, int]:
    if not path.exists():
        raise RuntimeError(f"Symbol file was not created: {path}")
    symbols: dict[str, int] = {}
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        if ": equ " not in line:
            continue
        name, raw_value = line.split(": equ ", 1)
        value = raw_value.strip().upper()
        if value.endswith("H"):
            value = value[:-1]
        try:
            symbols[name.strip()] = int(value, 16)
        except ValueError:
            continue
    return symbols


def symbol_address(symbols: dict[str, int], name: str, offset: int = 0) -> int:
    if name not in symbols:
        raise RuntimeError(f"Symbol file is missing required symbol: {name}")
    return symbols[name] + offset


def validate_runtime_ram_layout(symbols: dict[str, int]) -> None:
    required = [
        "msx2_effects_runtime_buffers",
        "msx2_effects_runtime_scratch",
        "msx2_enemy_runtime_x",
        "msx2_runtime_ram_end",
        "msx2_runtime_ram_limit",
    ]
    missing = [name for name in required if name not in symbols]
    if missing:
        raise RuntimeError(f"Symbol file is missing MSX2 runtime RAM layout symbols: {', '.join(missing)}")
    if symbols["msx2_effects_runtime_buffers"] >= symbols["msx2_effects_runtime_scratch"]:
        raise RuntimeError(
            "MSX2 runtime RAM layout is invalid: effect buffers do not precede scratch "
            f"({symbols['msx2_effects_runtime_buffers']:04X} >= {symbols['msx2_effects_runtime_scratch']:04X})"
        )
    if symbols["msx2_effects_runtime_scratch"] >= symbols["msx2_enemy_runtime_x"]:
        raise RuntimeError(
            "MSX2 runtime RAM layout is invalid: effect scratch does not precede enemy runtime "
            f"({symbols['msx2_effects_runtime_scratch']:04X} >= {symbols['msx2_enemy_runtime_x']:04X})"
        )
    if symbols["msx2_runtime_ram_end"] > symbols["msx2_runtime_ram_limit"]:
        raise RuntimeError(
            "MSX2 runtime RAM layout exceeds the safe limit: "
            f"end={symbols['msx2_runtime_ram_end']:04X}, limit={symbols['msx2_runtime_ram_limit']:04X}"
        )
    print(
        "MSX2 runtime RAM layout check passed: "
        f"effects={symbols['msx2_effects_runtime_buffers']:04X}, "
        f"scratch={symbols['msx2_effects_runtime_scratch']:04X}, "
        f"enemy={symbols['msx2_enemy_runtime_x']:04X}, "
        f"end={symbols['msx2_runtime_ram_end']:04X}, "
        f"limit={symbols['msx2_runtime_ram_limit']:04X}"
    )


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
    symbols: dict[str, int] | None = None,
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
        if symbols is None:
            raise RuntimeError("RAM probes require symbol addresses")
        probes = [
            ("collectible", symbol_address(symbols, "msx2_collectible_count")),
            ("hazard", symbol_address(symbols, "msx2_player_dead_flag")),
            ("exit", symbol_address(symbols, "msx2_exit_reached_flag")),
            ("blocked", symbol_address(symbols, "msx2_exit_blocked_flag")),
            ("lives", symbol_address(symbols, "msx2_lives")),
            ("gameover", symbol_address(symbols, "msx2_game_over_flag")),
            ("restart_lock", symbol_address(symbols, "msx2_game_over_restart_lock")),
            ("level", symbol_address(symbols, "msx2_level_complete_flag")),
            ("level_lock", symbol_address(symbols, "msx2_level_continue_lock")),
            ("enemy", symbol_address(symbols, "msx2_enemy_hit_flag")),
            ("enemy0_x", symbol_address(symbols, "msx2_enemy_runtime_x")),
            ("enemy1_x", symbol_address(symbols, "msx2_enemy_runtime_x", 1)),
            ("enemy2_y", symbol_address(symbols, "msx2_enemy_runtime_y", 2)),
            ("enemy0_dx", symbol_address(symbols, "msx2_enemy_runtime_dx")),
            ("enemy2_dy", symbol_address(symbols, "msx2_enemy_runtime_dy", 2)),
            ("air", symbol_address(symbols, "msx2_air_value")),
            ("air_frame", symbol_address(symbols, "msx2_air_frame_counter")),
            ("screen", symbol_address(symbols, "msx2_current_screen_index")),
            ("player_x", symbol_address(symbols, "msx2_player_sprite_x")),
            ("player_y", symbol_address(symbols, "msx2_player_sprite_y")),
            ("collectible_cell", symbol_address(symbols, "msx2_effects_runtime_buffers", 0x97)),
            ("collectible_cell_left", symbol_address(symbols, "msx2_effects_runtime_buffers", 0x95)),
        ]
        capture_cmd.extend([
            "--probe-output",
            str(probe_output),
        ])
        for label, address in probes:
            capture_cmd.extend(["--probe", f"{label}:0x{address:04X}"])
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
    parser.add_argument("--collect-both-screenshot-output", default=str(out / "msx2screen-layers-collect-both.png"), help="Output OpenMSX collect-both screenshot path")
    parser.add_argument("--collect-both-probe-output", default=str(out / "msx2screen-layers-collect-both-probe.txt"), help="Output OpenMSX collect-both RAM probe path")
    parser.add_argument("--hazard-screenshot-output", default=str(out / "msx2screen-layers-hazard-respawn.png"), help="Output OpenMSX hazard respawn screenshot path")
    parser.add_argument("--hazard-probe-output", default=str(out / "msx2screen-layers-hazard-respawn-probe.txt"), help="Output OpenMSX hazard respawn RAM probe path")
    parser.add_argument("--enemy-screenshot-output", default=str(out / "msx2screen-layers-enemy-respawn.png"), help="Output OpenMSX enemy entity respawn screenshot path")
    parser.add_argument("--enemy-probe-output", default=str(out / "msx2screen-layers-enemy-respawn-probe.txt"), help="Output OpenMSX enemy entity respawn RAM probe path")
    parser.add_argument("--enemy-motion-a-screenshot-output", default=str(out / "msx2screen-layers-enemy-motion-a.png"), help="Output OpenMSX first enemy motion screenshot path")
    parser.add_argument("--enemy-motion-a-probe-output", default=str(out / "msx2screen-layers-enemy-motion-a-probe.txt"), help="Output OpenMSX first enemy motion RAM probe path")
    parser.add_argument("--enemy-motion-b-screenshot-output", default=str(out / "msx2screen-layers-enemy-motion-b.png"), help="Output OpenMSX second enemy motion screenshot path")
    parser.add_argument("--enemy-motion-b-probe-output", default=str(out / "msx2screen-layers-enemy-motion-b-probe.txt"), help="Output OpenMSX second enemy motion RAM probe path")
    parser.add_argument("--lives-screenshot-output", default=str(out / "msx2screen-layers-lives-gameover.png"), help="Output OpenMSX lives/gameover screenshot path")
    parser.add_argument("--lives-probe-output", default=str(out / "msx2screen-layers-lives-gameover-probe.txt"), help="Output OpenMSX lives/gameover RAM probe path")
    parser.add_argument("--restart-screenshot-output", default=str(out / "msx2screen-layers-restart.png"), help="Output OpenMSX game restart screenshot path")
    parser.add_argument("--restart-probe-output", default=str(out / "msx2screen-layers-restart-probe.txt"), help="Output OpenMSX game restart RAM probe path")
    parser.add_argument("--grounded-screenshot-output", default=str(out / "msx2screen-layers-grounded.png"), help="Output OpenMSX grounded baseline screenshot path")
    parser.add_argument("--jump-screenshot-output", default=str(out / "msx2screen-layers-jump-mid.png"), help="Output OpenMSX jump screenshot path")
    parser.add_argument("--transition-screenshot-output", default=str(out / "msx2screen-layers-world-left.png"), help="Output OpenMSX WorldMap transition screenshot path")
    parser.add_argument("--locked-transition-screenshot-output", default=str(out / "msx2screen-layers-world-left-locked.png"), help="Output OpenMSX locked-exit WorldMap transition screenshot path")
    parser.add_argument("--return-screenshot-output", default=str(out / "msx2screen-layers-world-return.png"), help="Output OpenMSX WorldMap return screenshot path")
    parser.add_argument("--level-continue-screenshot-output", default=str(out / "msx2screen-layers-level-continue.png"), help="Output OpenMSX level continue screenshot path")
    parser.add_argument("--air-screenshot-output", default=str(out / "msx2screen-layers-air.png"), help="Output OpenMSX air/time HUD screenshot path")
    parser.add_argument("--ladder-screenshot-output", default=str(out / "msx2screen-layers-ladder.png"), help="Output OpenMSX ladder behavior screenshot path")
    parser.add_argument("--gameplay-probe-output", default=str(out / "msx2screen-layers-gameplay-probe.txt"), help="Output OpenMSX gameplay RAM probe path")
    parser.add_argument("--locked-gameplay-probe-output", default=str(out / "msx2screen-layers-gameplay-locked-probe.txt"), help="Output OpenMSX locked-exit gameplay RAM probe path")
    parser.add_argument("--return-probe-output", default=str(out / "msx2screen-layers-world-return-probe.txt"), help="Output OpenMSX WorldMap return RAM probe path")
    parser.add_argument("--level-continue-probe-output", default=str(out / "msx2screen-layers-level-continue-probe.txt"), help="Output OpenMSX level continue RAM probe path")
    parser.add_argument("--air-probe-output", default=str(out / "msx2screen-layers-air-probe.txt"), help="Output OpenMSX air/time RAM probe path")
    parser.add_argument("--ladder-probe-output", default=str(out / "msx2screen-layers-ladder-probe.txt"), help="Output OpenMSX ladder behavior RAM probe path")
    parser.add_argument("--openmsx", help="Explicit openmsx executable path")
    parser.add_argument("--machine", default="C-BIOS_MSX2", help="OpenMSX machine id")
    parser.add_argument("--sequence", default="WAIT:500,RIGHT:1000", help="Input sequence for capture")
    parser.add_argument("--collect-sequence", default="RIGHT:700", help="Input sequence for the collectible clear probe")
    parser.add_argument("--collect-both-sequence", default="RIGHT:700,LEFT:900", help="Input sequence for collecting both required collectibles before exiting")
    parser.add_argument("--hazard-sequence", default="RIGHT:700,SPACE:350", help="Input sequence for the hazard respawn probe")
    parser.add_argument("--enemy-sequence", default="LEFT:185", help="Input sequence for the enemy entity respawn probe")
    parser.add_argument("--enemy-motion-a-sequence", default="WAIT:100", help="Input sequence for the first enemy motion probe")
    parser.add_argument("--enemy-motion-b-sequence", default="WAIT:650", help="Input sequence for the second enemy motion probe")
    parser.add_argument("--lives-sequence", default="RIGHT:700,SPACE:350,WAIT:250,RIGHT:700,SPACE:350,WAIT:250,RIGHT:700,SPACE:350", help="Input sequence for the lives/gameover probe")
    parser.add_argument("--restart-sequence", default="RIGHT:700,SPACE:350,WAIT:700,RIGHT:700,SPACE:350,WAIT:700,RIGHT:700,SPACE:350,WAIT:700,SPACE:180,WAIT:700", help="Input sequence for the restart probe after game over")
    parser.add_argument("--grounded-sequence", default="WAIT:500", help="Input sequence for the grounded baseline capture")
    parser.add_argument("--jump-sequence", default="SPACE:250", help="Input sequence for the jump capture")
    parser.add_argument("--transition-sequence", default="RIGHT:700,LEFT:5200", help="Input sequence for the collected WorldMap transition capture")
    parser.add_argument("--locked-transition-sequence", default="LEFT:4200", help="Input sequence for the WorldMap transition capture without collecting first")
    parser.add_argument("--return-sequence", default="LEFT:4200,RIGHT:5200", help="Input sequence for returning to the first room after a WorldMap transition")
    parser.add_argument("--level-continue-sequence", default="RIGHT:700,LEFT:5200,WAIT:700,SPACE:180,WAIT:700", help="Input sequence for continuing after level complete")
    parser.add_argument("--air-sequence", default="WAIT:15000", help="Input sequence for the air/time HUD drain probe")
    parser.add_argument("--ladder-sequence", default="UP:700", help="Input sequence for the MSX2 behavior-layer ladder probe")
    parser.add_argument("--boot-wait-ms", type=int, default=6000, help="Wait before input replay")
    parser.add_argument("--capture-wait-ms", type=int, default=500, help="Wait before screenshot after input")
    parser.add_argument("--jump-capture-wait-ms", type=int, default=0, help="Wait before screenshot after jump input")
    parser.add_argument("--ladder-capture-wait-ms", type=int, default=0, help="Wait before screenshot after ladder input")
    parser.add_argument("--transition-capture-wait-ms", type=int, default=700, help="Wait before screenshot after transition input")
    parser.add_argument("--summary-ts-build-dir", default=str(root / "server" / "temp" / "tsbuild_msx2screen_layers_summary"), help="Temporary TypeScript build directory for summary-route validation")
    parser.add_argument("--strict-tsc", action="store_true", help="Fail when TypeScript reports diagnostics during summary-route validation")
    parser.add_argument("--skip-editor-contract", action="store_true", help="Do not run the MSX2 editor authoring contract check")
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
    collect_both_screenshot_output = Path(args.collect_both_screenshot_output).expanduser().resolve()
    collect_both_probe_output = Path(args.collect_both_probe_output).expanduser().resolve()
    hazard_screenshot_output = Path(args.hazard_screenshot_output).expanduser().resolve()
    hazard_probe_output = Path(args.hazard_probe_output).expanduser().resolve()
    enemy_screenshot_output = Path(args.enemy_screenshot_output).expanduser().resolve()
    enemy_probe_output = Path(args.enemy_probe_output).expanduser().resolve()
    enemy_motion_a_screenshot_output = Path(args.enemy_motion_a_screenshot_output).expanduser().resolve()
    enemy_motion_a_probe_output = Path(args.enemy_motion_a_probe_output).expanduser().resolve()
    enemy_motion_b_screenshot_output = Path(args.enemy_motion_b_screenshot_output).expanduser().resolve()
    enemy_motion_b_probe_output = Path(args.enemy_motion_b_probe_output).expanduser().resolve()
    lives_screenshot_output = Path(args.lives_screenshot_output).expanduser().resolve()
    lives_probe_output = Path(args.lives_probe_output).expanduser().resolve()
    restart_screenshot_output = Path(args.restart_screenshot_output).expanduser().resolve()
    restart_probe_output = Path(args.restart_probe_output).expanduser().resolve()
    grounded_screenshot_output = Path(args.grounded_screenshot_output).expanduser().resolve()
    jump_screenshot_output = Path(args.jump_screenshot_output).expanduser().resolve()
    transition_screenshot_output = Path(args.transition_screenshot_output).expanduser().resolve()
    locked_transition_screenshot_output = Path(args.locked_transition_screenshot_output).expanduser().resolve()
    return_screenshot_output = Path(args.return_screenshot_output).expanduser().resolve()
    level_continue_screenshot_output = Path(args.level_continue_screenshot_output).expanduser().resolve()
    air_screenshot_output = Path(args.air_screenshot_output).expanduser().resolve()
    ladder_screenshot_output = Path(args.ladder_screenshot_output).expanduser().resolve()
    gameplay_probe_output = Path(args.gameplay_probe_output).expanduser().resolve()
    locked_gameplay_probe_output = Path(args.locked_gameplay_probe_output).expanduser().resolve()
    return_probe_output = Path(args.return_probe_output).expanduser().resolve()
    level_continue_probe_output = Path(args.level_continue_probe_output).expanduser().resolve()
    air_probe_output = Path(args.air_probe_output).expanduser().resolve()
    ladder_probe_output = Path(args.ladder_probe_output).expanduser().resolve()
    summary_ts_build_dir = Path(args.summary_ts_build_dir).expanduser().resolve()

    if not args.skip_editor_contract:
        validate_editor_contract(project_root)

    fixture_result = run_command(["node", "scripts/create_msx2_screen5_layers_fixture.mjs"], cwd=project_root, allow_failure=True)
    if fixture_result.returncode != 0:
        if not project_json.exists():
            raise RuntimeError(f"Fixture generation failed and no existing fixture is available: {project_json}")
        print(
            "Fixture generation failed; reusing existing fixture JSON. "
            "This can happen on Windows when the committed fixture is temporarily locked.",
            flush=True,
        )
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
    symbols = read_symbol_addresses(sym_output)
    validate_runtime_ram_layout(symbols)

    if args.skip_openmsx:
        print("OpenMSX capture skipped by --skip-openmsx")
        print(f"ROM ready: {rom_output} ({rom_output.stat().st_size} bytes)")
        return

    capture_openmsx(args, project_root, rom_output, screenshot_output, args.sequence, args.capture_wait_ms, right_probe_output, symbols)
    capture_openmsx(args, project_root, rom_output, collect_screenshot_output, args.collect_sequence, args.capture_wait_ms, collect_probe_output, symbols)
    capture_openmsx(args, project_root, rom_output, collect_both_screenshot_output, args.collect_both_sequence, args.capture_wait_ms, collect_both_probe_output, symbols)
    capture_openmsx(args, project_root, rom_output, hazard_screenshot_output, args.hazard_sequence, args.capture_wait_ms, hazard_probe_output, symbols)
    capture_openmsx(args, project_root, rom_output, enemy_screenshot_output, args.enemy_sequence, args.capture_wait_ms, enemy_probe_output, symbols)
    capture_openmsx(args, project_root, rom_output, enemy_motion_a_screenshot_output, args.enemy_motion_a_sequence, args.capture_wait_ms, enemy_motion_a_probe_output, symbols)
    capture_openmsx(args, project_root, rom_output, enemy_motion_b_screenshot_output, args.enemy_motion_b_sequence, args.capture_wait_ms, enemy_motion_b_probe_output, symbols)
    capture_openmsx(args, project_root, rom_output, lives_screenshot_output, args.lives_sequence, args.capture_wait_ms, lives_probe_output, symbols)
    capture_openmsx(args, project_root, rom_output, restart_screenshot_output, args.restart_sequence, args.capture_wait_ms, restart_probe_output, symbols)
    capture_openmsx(args, project_root, rom_output, grounded_screenshot_output, args.grounded_sequence, args.capture_wait_ms)
    capture_openmsx(args, project_root, rom_output, air_screenshot_output, args.air_sequence, args.capture_wait_ms, air_probe_output, symbols)
    capture_openmsx(args, project_root, rom_output, ladder_screenshot_output, args.ladder_sequence, args.ladder_capture_wait_ms, ladder_probe_output, symbols)
    capture_openmsx(args, project_root, rom_output, jump_screenshot_output, args.jump_sequence, args.jump_capture_wait_ms)
    capture_openmsx(
        args,
        project_root,
        rom_output,
        locked_transition_screenshot_output,
        args.locked_transition_sequence,
        args.transition_capture_wait_ms,
        locked_gameplay_probe_output,
        symbols,
    )
    capture_openmsx(
        args,
        project_root,
        rom_output,
        transition_screenshot_output,
        args.transition_sequence,
        args.transition_capture_wait_ms,
        gameplay_probe_output,
        symbols,
    )
    capture_openmsx(
        args,
        project_root,
        rom_output,
        return_screenshot_output,
        args.return_sequence,
        args.transition_capture_wait_ms,
        return_probe_output,
        symbols,
    )
    capture_openmsx(
        args,
        project_root,
        rom_output,
        level_continue_screenshot_output,
        args.level_continue_sequence,
        args.transition_capture_wait_ms,
        level_continue_probe_output,
        symbols,
    )
    if not args.skip_image_check:
        validate_blocked_screenshot(screenshot_output)
        validate_right_blocked_probe(right_probe_output)
        validate_collectible_clear_probe(collect_probe_output)
        validate_collectible_visual(grounded_screenshot_output, collect_screenshot_output)
        validate_collect_both_probe(collect_both_probe_output)
        validate_collect_both_visual(collect_both_screenshot_output)
        validate_collectible_hud_progress(grounded_screenshot_output, collect_screenshot_output, collect_both_screenshot_output)
        validate_air_probe(air_probe_output)
        validate_air_hud_progress(grounded_screenshot_output, air_screenshot_output)
        validate_ladder_probe(ladder_probe_output)
        validate_hazard_respawn_probe(hazard_probe_output)
        validate_enemy_respawn_probe(enemy_probe_output)
        validate_enemy_motion_probe(enemy_motion_a_probe_output, enemy_motion_b_probe_output)
        validate_enemy_sprite_screenshot(enemy_motion_b_screenshot_output)
        validate_lives_gameover_probe(lives_probe_output)
        validate_gameover_screenshot(lives_screenshot_output)
        validate_restart_probe(restart_probe_output)
        validate_restart_screenshot(restart_screenshot_output)
        validate_jump_screenshot(grounded_screenshot_output, jump_screenshot_output)
        validate_world_transition_screenshot(locked_transition_screenshot_output)
        validate_world_transition_screenshot(transition_screenshot_output)
        validate_world_transition_air_probe(locked_gameplay_probe_output, "locked")
        validate_world_transition_air_probe(gameplay_probe_output, "open")
        validate_world_return_collectible_probe(return_probe_output)
        validate_world_return_collectible_visual(grounded_screenshot_output, return_screenshot_output, collect_both_screenshot_output)
        validate_level_complete_screenshot(transition_screenshot_output)
        validate_level_continue_probe(level_continue_probe_output)
        validate_level_continue_screenshot(level_continue_screenshot_output)
        validate_gameplay_probe(
            locked_gameplay_probe_output,
            {"collectible": 1, "hazard": 0, "exit": 0, "blocked": 1, "level": 0, "level_lock": 0, "enemy": 0, "lives": 2, "screen": 1},
            "locked exit after one collectible",
        )
        validate_gameplay_probe(
            gameplay_probe_output,
            {"collectible": 2, "hazard": 0, "exit": 1, "blocked": 0, "level": 1, "enemy": 0, "lives": 2, "screen": 1},
            "open exit after both collectibles",
        )
    print(f"OpenMSX screenshot ready: {screenshot_output}")
    print(f"OpenMSX right collision probe ready: {right_probe_output}")
    print(f"OpenMSX collectible screenshot ready: {collect_screenshot_output}")
    print(f"OpenMSX collectible probe ready: {collect_probe_output}")
    print(f"OpenMSX collect-both screenshot ready: {collect_both_screenshot_output}")
    print(f"OpenMSX collect-both probe ready: {collect_both_probe_output}")
    print(f"OpenMSX hazard respawn screenshot ready: {hazard_screenshot_output}")
    print(f"OpenMSX hazard respawn probe ready: {hazard_probe_output}")
    print(f"OpenMSX enemy respawn screenshot ready: {enemy_screenshot_output}")
    print(f"OpenMSX enemy respawn probe ready: {enemy_probe_output}")
    print(f"OpenMSX enemy motion first screenshot ready: {enemy_motion_a_screenshot_output}")
    print(f"OpenMSX enemy motion first probe ready: {enemy_motion_a_probe_output}")
    print(f"OpenMSX enemy motion second screenshot ready: {enemy_motion_b_screenshot_output}")
    print(f"OpenMSX enemy motion second probe ready: {enemy_motion_b_probe_output}")
    print(f"OpenMSX lives/gameover screenshot ready: {lives_screenshot_output}")
    print(f"OpenMSX lives/gameover probe ready: {lives_probe_output}")
    print(f"OpenMSX restart screenshot ready: {restart_screenshot_output}")
    print(f"OpenMSX restart probe ready: {restart_probe_output}")
    print(f"OpenMSX grounded screenshot ready: {grounded_screenshot_output}")
    print(f"OpenMSX air/time screenshot ready: {air_screenshot_output}")
    print(f"OpenMSX air/time probe ready: {air_probe_output}")
    print(f"OpenMSX ladder behavior screenshot ready: {ladder_screenshot_output}")
    print(f"OpenMSX ladder behavior probe ready: {ladder_probe_output}")
    print(f"OpenMSX jump screenshot ready: {jump_screenshot_output}")
    print(f"OpenMSX locked WorldMap transition screenshot ready: {locked_transition_screenshot_output}")
    print(f"OpenMSX WorldMap transition screenshot ready: {transition_screenshot_output}")
    print(f"OpenMSX WorldMap return screenshot ready: {return_screenshot_output}")
    print(f"OpenMSX level continue screenshot ready: {level_continue_screenshot_output}")
    print(f"OpenMSX locked gameplay probe ready: {locked_gameplay_probe_output}")
    print(f"OpenMSX gameplay probe ready: {gameplay_probe_output}")
    print(f"OpenMSX WorldMap return probe ready: {return_probe_output}")
    print(f"OpenMSX level continue probe ready: {level_continue_probe_output}")


if __name__ == "__main__":
    main()
