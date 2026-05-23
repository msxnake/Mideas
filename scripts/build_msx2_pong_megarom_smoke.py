#!/usr/bin/env python3
"""Build and smoke-test the MSX2 SCREEN 4 Pong Konami MegaROM."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from pathlib import Path

from build_msx2screen_layers_smoke import repo_root_from_script, run_command


def parse_args() -> argparse.Namespace:
    root = repo_root_from_script()
    out = root / "test" / "msx2-screen4" / "out"
    parser = argparse.ArgumentParser(description="Build and test Pong as an MSX2 SCREEN 4 Konami MegaROM")
    parser.add_argument("--project-root", default=str(root), help="Mideas repository root")
    parser.add_argument("--json", default=str(root / "json" / "pong_2_players_msx2.json"), help="Pong SCREEN 4 project JSON")
    parser.add_argument("--asm-output", default=str(out / "pong_2_players_msx2_megarom.asm"), help="Output ASM path")
    parser.add_argument("--rom-output", default=str(out / "pong_2_players_msx2_megarom.rom"), help="Output ROM path")
    parser.add_argument("--sym-output", default=str(out / "pong_2_players_msx2_megarom.sym"), help="Output symbols path")
    parser.add_argument("--probe-output", default=str(out / "pong_2_players_msx2_megarom_probe.log"), help="Output OpenMSX probe log")
    parser.add_argument("--screenshot-output", default=str(out / "pong_2_players_msx2_megarom.png"), help="Output OpenMSX screenshot path")
    parser.add_argument("--openmsx", help="Explicit openmsx executable path")
    parser.add_argument("--machine", default="C-BIOS_MSX2", help="OpenMSX machine id")
    parser.add_argument("--skip-openmsx", action="store_true", help="Build and static-check only")
    return parser.parse_args()


def resolve_openmsx(explicit: str | None) -> str:
    if explicit:
        candidate = Path(explicit).expanduser().resolve()
        if candidate.exists():
            return str(candidate)
        raise FileNotFoundError(f"OpenMSX executable not found: {candidate}")
    for candidate in (
        Path(r"C:\Program Files\openMSX\openmsx.exe"),
        Path(r"C:\Program Files (x86)\openMSX\openmsx.exe"),
    ):
        if candidate.exists():
            return str(candidate)
    path_hit = shutil.which("openmsx")
    if path_hit:
        return path_hit
    raise FileNotFoundError("OpenMSX executable not found")


def validate_asm(path: Path) -> None:
    asm = path.read_text(encoding="utf-8", errors="replace")
    required = [
        "Mideas MSX2 SCREEN 4 tile backend",
        "; ROM Mode: megarom",
        "; Mapper Target: konami",
        "MSX2 MegaROM Path: Konami 8K fixed-bank0 compatibility",
        "update_control_2_players_ball:",
        "control_2_players_ball_angle_from_left_paddle:",
        "control_2_players_ball_angle_from_right_paddle:",
        "control_2_players_ball_store_angle:",
        "control_2_players_ball_collect_item:",
        "MSX2_SCREEN4_DATA_BANK_ROM_START:",
        "org #8000",
    ]
    missing = [needle for needle in required if needle not in asm]
    if missing:
        raise RuntimeError("Pong ASM is missing expected MegaROM/gameplay signals: " + ", ".join(missing))


def validate_rom(path: Path) -> None:
    data = path.read_bytes()
    if len(data) <= 32768 or len(data) % 8192 != 0:
        raise RuntimeError(f"Pong MegaROM size must be >32KB and 8KB-aligned, got {len(data)}")
    if data[:2] != b"AB":
        raise RuntimeError(f"Pong MegaROM header must start with AB, got {data[:2]!r}")


SYM_RE = re.compile(r"^([A-Za-z_][A-Za-z0-9_]*):\s+equ\s+([0-9A-Fa-f]+)H\b")


def parse_symbols(path: Path) -> dict[str, int]:
    symbols: dict[str, int] = {}
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        match = SYM_RE.match(line.strip())
        if match:
            symbols[match.group(1)] = int(match.group(2), 16)
    return symbols


def require_symbol(symbols: dict[str, int], name: str) -> int:
    if name not in symbols:
        raise RuntimeError(f"Pong symbol file is missing required label: {name}")
    return symbols[name]


def get_shoot_item_cell(project_json: Path) -> tuple[int, int]:
    project = json.loads(project_json.read_text(encoding="utf-8"))
    for asset in project.get("assets", []):
        data = asset.get("data") or {}
        entities = (((data.get("layers") or {}).get("entities")) or [])
        for entity in entities:
            if entity.get("id") == "entity_pong_shoot_item":
                position = entity.get("position") or {}
                return int(position.get("x", 10)), int(position.get("y", 5))
    raise RuntimeError("Pong project is missing entity_pong_shoot_item")


def validate_project_structure(project_json: Path) -> None:
    project = json.loads(project_json.read_text(encoding="utf-8"))
    assets = project.get("assets") or []
    by_type: dict[str, list[dict[str, object]]] = {}
    for asset in assets:
        by_type.setdefault(str(asset.get("type")), []).append(asset)

    required_types = ["msx2screen", "worldmap", "gameflow", "statemachine"]
    missing_types = [asset_type for asset_type in required_types if not by_type.get(asset_type)]
    if missing_types:
        raise RuntimeError("Pong project is missing required Mideas asset types: " + ", ".join(missing_types))

    screen_ids = {str(asset.get("id")) for asset in by_type["msx2screen"]}
    world = by_type["worldmap"][0].get("data") or {}
    world_nodes = world.get("nodes") if isinstance(world, dict) else []
    if not isinstance(world_nodes, list) or not any(node.get("screenAssetId") in screen_ids for node in world_nodes if isinstance(node, dict)):
        raise RuntimeError("Pong WorldMap must contain a node linked to the playable MSX2 screen")

    world_id = str(by_type["worldmap"][0].get("id"))
    game_flow = by_type["gameflow"][0].get("data") or {}
    flow_nodes = game_flow.get("nodes") if isinstance(game_flow, dict) else []
    if not isinstance(flow_nodes, list) or not any(
        node.get("type") == "WorldLink" and node.get("worldAssetId") == world_id
        for node in flow_nodes
        if isinstance(node, dict)
    ):
        raise RuntimeError("Pong GameFlow must enter the Pong WorldMap through a WorldLink node")

    state_machine = by_type["statemachine"][0].get("data") or {}
    states = state_machine.get("states") if isinstance(state_machine, dict) else []
    transitions = state_machine.get("transitions") if isinstance(state_machine, dict) else []
    if not isinstance(states, list) or len(states) < 3 or not isinstance(transitions, list) or len(transitions) < 4:
        raise RuntimeError("Pong StateMachine must describe play, item-hit, and paddle-hit rules")


def build_probe_tcl(
    probe_output: Path,
    screenshot_output: Path,
    symbols: dict[str, int],
    shoot_item_cell: tuple[int, int],
) -> str:
    log_path = probe_output.as_posix()
    shot_path = screenshot_output.as_posix()
    enemy_x = require_symbol(symbols, "msx2_enemy_runtime_x")
    enemy_y = require_symbol(symbols, "msx2_enemy_runtime_y")
    enemy_dx = require_symbol(symbols, "msx2_enemy_runtime_dx")
    enemy_dy = require_symbol(symbols, "msx2_enemy_runtime_dy")
    player_x = require_symbol(symbols, "msx2_player_sprite_x")
    player_y = require_symbol(symbols, "msx2_player_sprite_y")
    effect_base = require_symbol(symbols, "msx2_effects_runtime_buffers")
    collectible_count = require_symbol(symbols, "msx2_collectible_count")
    item_x, item_y = shoot_item_cell
    item_effect_addr = effect_base + (item_y * 16) + item_x
    return f"""
set log_path "{log_path}"
set f [open $log_path "w"]
proc logline {{msg}} {{ global f; puts $f $msg; flush $f; puts $msg }}
proc mem8 {{addr}} {{ return [debug read memory $addr] }}
proc poke8 {{addr val}} {{ debug write memory $addr $val }}
proc sample_angle {{tag ball_y}} {{
    poke8 {player_x} 16
    poke8 {player_y} 80
    poke8 {enemy_x + 1} 31
    poke8 {enemy_y + 1} $ball_y
    poke8 {enemy_dx + 1} 254
    poke8 {enemy_dy + 1} 0
    after time 0.04 [list log_angle $tag]
}}
proc sample_right_paddle_hit {{}} {{
    poke8 {enemy_x} 224
    poke8 {enemy_y} 80
    poke8 {enemy_x + 1} 214
    poke8 {enemy_y + 1} 80
    poke8 {enemy_dx + 1} 2
    poke8 {enemy_dy + 1} 0
    after time 0.04 {{ log_angle "right_paddle" }}
}}
proc log_angle {{tag}} {{
    set dx [mem8 {enemy_dx + 1}]
    set dy [mem8 {enemy_dy + 1}]
    logline [format "angle_%s dx=%02X dy=%02X" $tag $dx $dy]
}}
debug set_bp 0x4010 {{}} {{ logline [format "BP_4010 pc=%04X" [reg PC]]; debug cont }}
after time 6.5 {{ screenshot "{shot_path}"; logline "SHOTOK start" }}
after time 7.0 {{ sample_angle "top" 72 }}
after time 7.4 {{ sample_angle "upper" 76 }}
after time 7.8 {{ sample_angle "center_up" 81 }}
after time 8.2 {{ sample_angle "center_down" 86 }}
after time 8.6 {{ sample_angle "lower" 91 }}
after time 9.0 {{ sample_right_paddle_hit }}
after time 9.4 {{
    logline [format "item_before=%02X count=%02X" [mem8 {item_effect_addr}] [mem8 {collectible_count}]]
    poke8 {enemy_x + 1} {item_x * 16 - 8}
    poke8 {enemy_y + 1} {item_y * 16 - 8}
    poke8 {enemy_dx + 1} 2
    poke8 {enemy_dy + 1} 2
}}
after time 9.9 {{
    logline [format "item_after=%02X count=%02X" [mem8 {item_effect_addr}] [mem8 {collectible_count}]]
}}
after time 10.4 {{ close $f; exit }}
"""


def validate_probe(path: Path) -> None:
    text = path.read_text(encoding="utf-8", errors="replace")
    required_lines = [
        "BP_4010 pc=4010",
        "angle_top dx=02 dy=FD",
        "angle_upper dx=02 dy=FE",
        "angle_center_up dx=02 dy=FF",
        "angle_center_down dx=02 dy=01",
        "angle_lower dx=02 dy=03",
        "angle_right_paddle dx=FE dy=FF",
        "item_before=03 count=00",
        "item_after=00 count=01",
    ]
    missing = [line for line in required_lines if line not in text]
    if missing:
        raise RuntimeError("Pong OpenMSX probe failed expected checks: " + ", ".join(missing))


def main() -> None:
    args = parse_args()
    project_root = Path(args.project_root).expanduser().resolve()
    project_json = Path(args.json).expanduser().resolve()
    asm_output = Path(args.asm_output).expanduser().resolve()
    rom_output = Path(args.rom_output).expanduser().resolve()
    sym_output = Path(args.sym_output).expanduser().resolve()
    probe_output = Path(args.probe_output).expanduser().resolve()
    screenshot_output = Path(args.screenshot_output).expanduser().resolve()

    asm_output.parent.mkdir(parents=True, exist_ok=True)
    if project_json == project_root / "json" / "pong_2_players_msx2.json":
        run_command(["node", "scripts/create_msx2_pong_2_players.mjs"], cwd=project_root, timeout=30)
    validate_project_structure(project_json)
    run_command([
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
        "--sym-output",
        str(sym_output),
        "--rom-mode",
        "megarom",
        "--target-format",
        "konami",
        "--skip-zx0-preprocess",
    ], cwd=project_root, timeout=180)

    validate_asm(asm_output)
    validate_rom(rom_output)

    if not args.skip_openmsx:
        probe_output.parent.mkdir(parents=True, exist_ok=True)
        tcl_path = probe_output.with_suffix(".tcl")
        tcl_path.write_text(
            build_probe_tcl(probe_output, screenshot_output, parse_symbols(sym_output), get_shoot_item_cell(project_json)),
            encoding="ascii",
        )
        run_command([
            resolve_openmsx(args.openmsx),
            "-machine",
            args.machine,
            "-cart",
            str(rom_output),
            "-romtype",
            "konami",
            "-script",
            str(tcl_path),
        ], cwd=project_root, timeout=120)
        validate_probe(probe_output)

    print(f"Pong MSX2 SCREEN 4 Konami MegaROM smoke passed: {rom_output}")


if __name__ == "__main__":
    main()
