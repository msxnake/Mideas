#!/usr/bin/env python3
"""Build a minimal MSX2 SCREEN 4 Bitmap Room smoke ROM.

This verifies the authoring workflow where atlas pixels and composition commands
are exported as a V9938 bitmap-room runtime (VRAM page + command engine).
"""

import argparse
import copy
import json
import re
import subprocess
import sys
from pathlib import Path


def repo_root_from_script() -> Path:
    return Path(__file__).resolve().parents[1]


def run_command(cmd: list[str], cwd: Path, timeout: float | None = None) -> subprocess.CompletedProcess:
    print("Running:", " ".join(str(part) for part in cmd))
    completed = subprocess.run(cmd, cwd=str(cwd), capture_output=True, timeout=timeout)
    stdout = completed.stdout.decode("utf-8", errors="replace")
    stderr = completed.stderr.decode("utf-8", errors="replace")
    if stdout.strip():
        sys.stdout.buffer.write((stdout.strip() + "\n").encode(sys.stdout.encoding or "utf-8", errors="replace"))
        sys.stdout.flush()
    if stderr.strip():
        sys.stderr.buffer.write((stderr.strip() + "\n").encode(sys.stderr.encoding or "utf-8", errors="replace"))
        sys.stderr.flush()
    if completed.returncode != 0:
        raise RuntimeError(f"Command failed ({completed.returncode}): {' '.join(str(part) for part in cmd)}")
    return completed


def parse_args() -> argparse.Namespace:
    root = repo_root_from_script()
    out = root / "test" / "msx2-screen4" / "out"
    parser = argparse.ArgumentParser(description="Build an MSX2 SCREEN 4 Bitmap Room smoke project")
    parser.add_argument("--project-root", default=str(root), help="Mideas repository root")
    parser.add_argument("--json-output", default=str(out / "msx2_bitmap_room_smoke.json"), help="Output project JSON path")
    parser.add_argument("--asm-output", default=str(out / "msx2_bitmap_room_smoke.asm"), help="Output ASM path")
    parser.add_argument("--rom-output", default=str(out / "msx2_bitmap_room_smoke.rom"), help="Output ROM path")
    parser.add_argument("--screenshot-output", default=str(out / "msx2_bitmap_room_smoke_pattern.png"), help="Output OpenMSX screenshot path")
    parser.add_argument("--skip-openmsx", action="store_true", help="Compile only")
    parser.add_argument(
        "--include-all-bitmap-skills",
        action="store_true",
        help="Enable every SCREEN 5 bitmap-room player skill covered by the smoke compile.",
    )
    parser.add_argument(
        "--include-linked-hud-bar",
        action="store_true",
        help="Link a msx2hud asset with a playerEnergy bar (dynamic HMMV) to room A.",
    )
    parser.add_argument("--boot-wait-ms", type=int, default=8000, help="Wait before screenshot")
    return parser.parse_args()


def default_palette() -> list[dict[str, object]]:
    return [
        {"slotIndex": 0, "masterIndex": -1, "hex": "rgba(0,0,0,0)"},
        {"slotIndex": 1, "masterIndex": 0, "hex": "#000000"},
        {"slotIndex": 2, "masterIndex": 113, "hex": "#24DB24"},
        {"slotIndex": 3, "masterIndex": 251, "hex": "#6DFF6D"},
        {"slotIndex": 4, "masterIndex": 79, "hex": "#2424FF"},
        {"slotIndex": 5, "masterIndex": 159, "hex": "#496DFF"},
        {"slotIndex": 6, "masterIndex": 329, "hex": "#B62424"},
        {"slotIndex": 7, "masterIndex": 183, "hex": "#49DBFF"},
        {"slotIndex": 8, "masterIndex": 457, "hex": "#FF2424"},
        {"slotIndex": 9, "masterIndex": 475, "hex": "#FF6D6D"},
        {"slotIndex": 10, "masterIndex": 433, "hex": "#DBDB24"},
        {"slotIndex": 11, "masterIndex": 436, "hex": "#DBDB92"},
        {"slotIndex": 12, "masterIndex": 97, "hex": "#249224"},
        {"slotIndex": 13, "masterIndex": 405, "hex": "#DB49B6"},
        {"slotIndex": 14, "masterIndex": 365, "hex": "#B6B6B6"},
        {"slotIndex": 15, "masterIndex": 511, "hex": "#FFFFFF"},
    ]


BRICK_VARIANTS = [
    ("brick_red", 8),
    ("brick_orange", 9),
    ("brick_yellow", 10),
    ("brick_green", 12),
    ("brick_cyan", 7),
    ("brick_blue", 5),
    ("brick_magenta", 13),
    ("brick_white", 15),
]

SMOKE_HUD_FONT_PATTERNS = {
    " ": [0, 0, 0, 0, 0, 0, 0, 0],
    "0": [0x3C, 0x66, 0x6E, 0x76, 0x66, 0x66, 0x3C, 0],
    "1": [0x18, 0x38, 0x18, 0x18, 0x18, 0x18, 0x7E, 0],
    "2": [0x3C, 0x66, 0x06, 0x1C, 0x30, 0x60, 0x7E, 0],
    "3": [0x3C, 0x66, 0x06, 0x1C, 0x06, 0x66, 0x3C, 0],
    "4": [0x0C, 0x1C, 0x3C, 0x6C, 0x7E, 0x0C, 0x0C, 0],
    "5": [0x7E, 0x60, 0x7C, 0x06, 0x06, 0x66, 0x3C, 0],
    "6": [0x1C, 0x30, 0x60, 0x7C, 0x66, 0x66, 0x3C, 0],
    "7": [0x7E, 0x06, 0x0C, 0x18, 0x30, 0x30, 0x30, 0],
    "8": [0x3C, 0x66, 0x66, 0x3C, 0x66, 0x66, 0x3C, 0],
    "9": [0x3C, 0x66, 0x66, 0x3E, 0x06, 0x0C, 0x38, 0],
    "A": [0x18, 0x3C, 0x66, 0x66, 0x7E, 0x66, 0x66, 0],
    "E": [0x7E, 0x60, 0x60, 0x7C, 0x60, 0x60, 0x7E, 0],
    "G": [0x3C, 0x66, 0x60, 0x6E, 0x66, 0x66, 0x3C, 0],
    "I": [0x7E, 0x18, 0x18, 0x18, 0x18, 0x18, 0x7E, 0],
    "L": [0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x7E, 0],
    "M": [0x63, 0x77, 0x7F, 0x6B, 0x63, 0x63, 0x63, 0],
    "S": [0x3C, 0x66, 0x60, 0x3C, 0x06, 0x66, 0x3C, 0],
    "T": [0x7E, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0],
}


def build_atlas_pixels(width: int = 128, height: int = 16) -> list[list[int]]:
    pixels = [[0 for _x in range(width)] for _y in range(height)]

    mortar = 1
    for variant_index, (_brick_id, color) in enumerate(BRICK_VARIANTS):
        x0 = variant_index * 16
        for y in range(16):
            for x in range(16):
                split = 8 if y < 8 else 0
                is_mortar = y in (0, 8, 15) or x in (0, 15) or x == split
                pixels[y][x0 + x] = mortar if is_mortar else color

    return pixels


def build_brick_entries() -> list[dict[str, object]]:
    return [
        {"id": brick_id, "name": brick_id.replace("_", " ").title(), "sx": index * 16, "sy": 0, "w": 16, "h": 16}
        for index, (brick_id, _color) in enumerate(BRICK_VARIANTS)
    ]


def build_player_sprite_frame(frame_index: int) -> list[list[str]]:
    transparent = "rgba(0,0,0,0)"
    primary = "#FFFFFF"
    accent = "#FF2424" if frame_index == 0 else "#24DB24"
    pixels = [[transparent for _x in range(16)] for _y in range(16)]
    for y in range(2, 15):
        for x in range(4, 11):
            pixels[y][x] = primary
    # Asymmetric arm/nose: this makes mirrored pattern generation observable.
    for y in range(5, 9):
        for x in range(10, 15):
            pixels[y][x] = accent
    # Different leg pose per frame: this makes animation data observable.
    leg_x = 5 if frame_index == 0 else 8
    for y in range(12, 16):
        pixels[y][leg_x] = accent
    return pixels


def build_player_sprite_asset() -> dict[str, object]:
    return {
        "id": "smoke_player_sprite",
        "name": "Smoke Player Sprite",
        "type": "msx2sprite",
        "data": {
            "id": "smoke_player_sprite",
            "name": "Smoke Player Sprite",
            "target": "MSX2",
            "vdpMode": "SCREEN5",
            "size": {"width": 16, "height": 16},
            "palette": default_palette(),
            "backgroundColor": "rgba(0,0,0,0)",
            "frames": [
                {"id": "frame_0", "data": build_player_sprite_frame(0)},
                {"id": "frame_1", "data": build_player_sprite_frame(1)},
            ],
            "currentFrameIndex": 0,
            "animationSpeedMs": 120,
            "loops": True,
            "facingDirection": "right",
            "hardware": {"x": 48, "y": 80, "color": 15, "patternIndex": 0},
        },
    }


def build_player_asset() -> dict[str, object]:
    return {
        "id": "smoke_player",
        "name": "Smoke Player",
        "type": "msx2player",
        "data": {
            "id": "smoke_player",
            "name": "Smoke Player",
            "target": "MSX2",
            "render": {
                "spriteAssetId": "smoke_player_sprite",
            },
            "defaultFacing": "right",
            "movement": {
                "mode": "platform",
                "jumpPower": 6,
            },
            "inputMapping": {
                "jump": "spc",
                "attack": "n",
            },
            "activeSkills": ["air_dash", "glide", "wall_jump", "power_stomp"],
            "skillParameters": {
                "air_dash": {
                    "airDashSpeed": 6,
                    "airDashDuration": 6,
                    "airDashCooldown": 20,
                    "requireKeyRelease": True,
                    "invulnerable": True,
                },
                "glide": {
                    "glideSpeed": 1,
                    "glideBoostCost": 5,
                },
                "wall_jump": {
                    "wallJumpHorizontal": 4,
                    "wallJumpVertical": 6,
                    "wallSlideSpeed": 1,
                    "requireKeyRelease": True,
                },
                "power_stomp": {
                    "stompSpeed": 12,
                    "stompCooldown": 20,
                    "screenShake": True,
                },
            },
        },
    }


def build_castle_commands() -> list[dict[str, object]]:
    commands: list[dict[str, object]] = []

    def rect(id_: str, x: int, y: int, w: int, h: int, color: int) -> None:
        commands.append({"id": id_, "op": "fill", "x": x, "y": y, "w": w, "h": h, "color": color})

    def brick_area(id_: str, x: int, y: int, w: int, h: int, color: int, highlight: int, shadow: int) -> None:
        rect(f"{id_}_base", x, y, w, h, color)
        for yy in range(y, y + h, 8):
            row_h = min(8, y + h - yy)
            rect(f"{id_}_hi_{yy}", x, yy, w, 2, highlight)
            if row_h >= 7:
                rect(f"{id_}_sh_{yy}", x, yy + 6, w, 2, shadow)
            rect(f"{id_}_mortar_h_{yy}", x, yy, w, 1, 1)
        for xx in range(x + 16, x + w, 16):
            rect(f"{id_}_mortar_v_{xx}", xx, y, 1, h, 1)

    def platform(id_: str, x: int, y: int, w: int) -> None:
        rect(f"{id_}_shadow", x, y + 5, w, 3, 4)
        rect(f"{id_}_top", x, y, w, 3, 15)

    def ladder(id_: str, x: int, y: int, h: int) -> None:
        rect(f"{id_}_left", x, y, 2, h, 6)
        rect(f"{id_}_right", x + 8, y, 2, h, 6)
        for yy in range(y + 4, y + h, 8):
            rect(f"{id_}_rung_{yy}", x, yy, 10, 2, 10)

    def window(id_: str, x: int, y: int) -> None:
        rect(f"{id_}_outline", x, y + 6, 15, 28, 7)
        rect(f"{id_}_void", x + 2, y + 8, 11, 24, 1)
        rect(f"{id_}_cap1", x + 3, y + 3, 9, 4, 7)
        rect(f"{id_}_cap2", x + 5, y, 5, 3, 7)
        rect(f"{id_}_bars", x + 7, y + 7, 1, 25, 5)

    def barrel(id_: str, x: int, y: int) -> None:
        rect(f"{id_}_body", x, y, 12, 17, 6)
        rect(f"{id_}_dark", x + 2, y + 2, 8, 13, 1)
        rect(f"{id_}_slat1", x + 4, y + 2, 2, 13, 9)
        rect(f"{id_}_slat2", x + 8, y + 2, 2, 13, 9)
        rect(f"{id_}_band1", x + 1, y + 5, 10, 1, 15)
        rect(f"{id_}_band2", x + 1, y + 11, 10, 1, 15)

    def torch(id_: str, x: int, y: int) -> None:
        rect(f"{id_}_pole", x + 4, y + 8, 2, 25, 10)
        rect(f"{id_}_base", x, y + 31, 10, 2, 15)
        rect(f"{id_}_flame1", x + 2, y + 2, 6, 6, 10)
        rect(f"{id_}_flame2", x + 4, y, 3, 10, 8)
        rect(f"{id_}_wick", x + 4, y + 6, 2, 5, 15)

    # Dark brick hall.
    brick_area("back_wall", 0, 0, 256, 192, 4, 7, 5)
    brick_area("left_tower", 0, 80, 64, 112, 7, 15, 5)
    brick_area("left_column", 0, 0, 17, 82, 7, 15, 5)
    brick_area("floor", 64, 154, 118, 38, 7, 15, 5)
    brick_area("right_lower", 176, 160, 64, 32, 4, 7, 5)
    brick_area("right_wall", 220, 78, 36, 82, 7, 15, 5)
    brick_area("mid_block", 144, 58, 32, 32, 7, 15, 5)
    brick_area("top_trim", 144, 0, 112, 8, 7, 15, 5)

    platform("left_platform", 16, 77, 64)
    platform("left_mid_platform", 50, 104, 32)
    platform("center_floor", 84, 146, 96)
    platform("mid_platform", 144, 54, 32)
    platform("right_platform", 176, 48, 80)

    ladder("left_ladder", 17, 0, 80)
    ladder("right_ladder", 232, 74, 86)

    window("window_a", 66, 22)
    window("window_b", 114, 22)
    barrel("barrel_left", 50, 92)
    barrel("barrel_top", 210, 51)
    barrel("barrel_bottom", 178, 162)
    torch("torch_left", 112, 122)
    torch("torch_right", 178, 122)
    rect("small_bat_left", 43, 66, 9, 5, 1)
    rect("small_bat_right", 199, 88, 9, 5, 14)
    rect("barrel_blue", 232, 166, 12, 24, 5)
    rect("curtain_red", 248, 166, 8, 26, 8)
    return commands


def build_project() -> dict[str, object]:
    atlas_pixels = build_atlas_pixels()
    commands = build_castle_commands()
    commands.append({
        "id": "stale_tile_copy_must_be_ignored",
        "op": "copy",
        "atlasEntryId": "brick_red",
        "dx": 0,
        "dy": 0,
        "w": 16,
        "h": 16,
    })
    tile_grid = [[0 for _x in range(16)] for _y in range(12)]
    tile_grid[0][0] = 4  # brick_green: proves tileGrid overrides stale copy commands.
    room_data = {
        "id": "bitmap_room_smoke",
        "name": "Bitmap Room Smoke",
        "target": "MSX2",
        "vdpMode": "SCREEN5_BITMAP_ROOM",
        "width": 256,
        "height": 192,
        "palette": default_palette(),
        "backgroundColor": 1,
        "atlas": {
            "width": 128,
            "height": 16,
            "offscreenBaseY": 320,
            "pixels": atlas_pixels,
            "entries": build_brick_entries(),
        },
        "composition": {
            "source": "authored",
            "commands": commands,
        },
        "tileGrid": tile_grid,
        "collision": [[0 for _x in range(16)] for _y in range(12)],
        "effects": [[0 for _x in range(16)] for _y in range(12)],
        "behavior": [[0 for _x in range(16)] for _y in range(12)],
        "entities": [],
        "playerEntries": [{"id": "spawn0", "x": 48, "y": 80, "facing": "right", "playerId": "smoke_player"}],
        "runtime": {
            "screenKind": "playable",
            "screenEngine": "player",
            "movementMode": "platform",
            "movementModel": "platform",
            "activeAreaX": 0,
            "activeAreaY": 1,
            "activeAreaWidth": 16,
            "activeAreaHeight": 12,
            "showHud": True,
            "statusHud": True,
            "hudStyle": "statusBars",
            "hudFontAssetId": "smoke_hud_font",
            "initialAir": 180,
            "playerEnergyMax": 16,
            "playerEnergyInitial": 12,
            "hudWidgets": [
                {"id": "hud_stage", "name": "Stage", "kind": "text", "binding": "custom", "x": 8, "y": 4, "width": 56, "height": 8, "primaryColor": 15, "text": "STAGE 1"},
                {"id": "hud_life", "name": "Life", "kind": "bar", "binding": "playerEnergy", "x": 72, "y": 5, "width": 56, "height": 6, "maxValue": 16, "initialValue": 12, "primaryColor": 10, "borderColor": 15, "emptyColor": 4},
                {"id": "hud_item", "name": "Item", "kind": "icon", "binding": "collectibles", "x": 144, "y": 4, "width": 8, "height": 8, "atlasEntryId": "brick_white"},
                {"id": "hud_time", "name": "Time", "kind": "counter", "binding": "air", "variableName": "time", "x": 208, "y": 4, "width": 24, "height": 8, "initialValue": 180, "primaryColor": 11},
            ],
        },
        "notes": "Smoke for SCREEN 4 V9938 bitmap-room export.",
    }
    room_data_b = copy.deepcopy(room_data)
    room_data_b["id"] = "bitmap_room_smoke_b"
    room_data_b["name"] = "Bitmap Room Smoke B"
    room_data_b["backgroundColor"] = 4
    room_data_b["tileGrid"] = [[0 for _x in range(16)] for _y in range(12)]
    room_data_b["tileGrid"][0][0] = 8
    room_data_b["tileGrid"][0][15] = 2
    room_data_b["playerEntries"] = [{"id": "spawn1", "x": 16, "y": 80, "facing": "right", "playerId": "smoke_player"}]
    worldmap_asset = {
        "id": "bitmap_room_world",
        "name": "Bitmap Room World",
        "type": "worldmap",
        "data": {
            "id": "bitmap_room_world",
            "name": "Bitmap Room World",
            "nodes": [
                {"id": "wmnode_bitmap_a", "screenAssetId": "bitmap_room_smoke", "name": "Room A", "position": {"x": 0, "y": 0}},
                {"id": "wmnode_bitmap_b", "screenAssetId": "bitmap_room_smoke_b", "name": "Room B", "position": {"x": 220, "y": 0}},
            ],
            "connections": [
                {
                    "id": "wmconn_bitmap_a_b",
                    "fromNodeId": "wmnode_bitmap_a",
                    "toNodeId": "wmnode_bitmap_b",
                    "fromDirection": "east",
                    "toDirection": "west",
                }
            ],
            "startScreenNodeId": "wmnode_bitmap_a",
        },
    }
    return {
        "name": "msx2_bitmap_room_smoke",
        "currentScreenMode": "SCREEN 4 (Graphics II)",
        "screenMode": "SCREEN 4 (Graphics II)",
        "targetGraphicsBackend": "msx2-screen4-bitmap-room",
        "assets": [
            {
                "id": "bitmap_room_smoke",
                "name": "Bitmap Room Smoke",
                "type": "msx2bitmaproom",
                "data": room_data,
            },
            {
                "id": "bitmap_room_smoke_b",
                "name": "Bitmap Room Smoke B",
                "type": "msx2bitmaproom",
                "data": room_data_b,
            },
            worldmap_asset,
            {
                "id": "smoke_hud_font",
                "name": "Smoke HUD Font",
                "type": "msx2hudfont",
                "data": {
                    "target": "MSX2",
                    "vdpMode": "SCREEN4",
                    "baseChar": 192,
                    "characters": " 0123456789AEGILMST",
                    "patterns": SMOKE_HUD_FONT_PATTERNS,
                    "colorByte": 0xF1,
                    "notes": "Smoke font used by SCREEN 5 bitmap-room HUD widgets.",
                },
            },
            build_player_sprite_asset(),
            build_player_asset(),
        ],
    }


def enable_all_bitmap_skills(project: dict[str, object]) -> None:
    """Mutate the smoke project so the ASM exporter emits every bitmap skill block."""
    player_asset = next((asset for asset in project["assets"] if asset.get("type") == "msx2player"), None)
    if not player_asset:
        raise RuntimeError("Smoke project has no msx2player asset")
    player = player_asset["data"]
    active_skills = list(player.get("activeSkills", []))
    for skill_id in [
        "air_dash",
        "glide",
        "wall_jump",
        "power_stomp",
        "shoot",
        "teleport_a_b",
        "slash",
        "grab",
        "high_jump",
        "wall_break",
        "spin_attack",
        "carry_and_throw",
    ]:
        if skill_id not in active_skills:
            active_skills.append(skill_id)
    player["activeSkills"] = active_skills
    skill_parameters = dict(player.get("skillParameters", {}))
    skill_parameters.update({
        "shoot": {
            "shotSpeed": 4,
            "fireCooldown": 12,
            "maxBullets": 2,
            "requireKeyRelease": True,
        },
        "teleport_a_b": {
            "teleportCooldown": 20,
            "teleportDelay": 5,
            "savePointA": True,
            "maxDistance": 8,
            "requireKeyRelease": True,
        },
        "slash": {
            "slashDuration": 10,
            "slashCooldown": 20,
            "slashDamage": 1,
            "requireKeyRelease": True,
        },
        "grab": {
            "slideSpeed": 1,
        },
        "high_jump": {
            "highJumpPower": 1536,
            "holdFrames": 8,
        },
        "wall_break": {
            "breakCooldown": 20,
            "requireKeyRelease": True,
        },
        "spin_attack": {
            "spinDuration": 20,
            "spinDamage": 1,
            "spinCooldown": 30,
            "requireKeyRelease": True,
        },
        "carry_and_throw": {
            "throwSpeed": 12,
            "throwVertical": 8,
            "throwGravity": 1,
            "throwCooldown": 30,
            "pickupRadius": 20,
            "objectCollision": True,
            "enemyCollision": True,
        },
    })
    player["skillParameters"] = skill_parameters
    for asset in project["assets"]:
        if asset.get("type") != "msx2bitmaproom":
            continue
        asset["data"]["entities"] = [
            {
                "kind": "carryable",
                "position": {"x": 4, "y": 9},
                "components": {
                    "msx2_carryable": {"enabled": True},
                    "msx2_hardware_sprite": {"msx2SpriteAssetId": "smoke_player_sprite"},
                },
            },
            {
                "kind": "enemy",
                "position": {"x": 9, "y": 9},
                "components": {
                    "msx2_hardware_sprite": {"msx2SpriteAssetId": "smoke_player_sprite"},
                },
            },
        ]


def render_smoke_room_data(room: dict[str, object]) -> list[list[int]]:
    width = int(room["width"])
    height = int(room["height"])
    background_color = int(room.get("backgroundColor", 0)) & 0x0F
    pixels = [[background_color for _x in range(width)] for _y in range(height)]
    for command in room["composition"]["commands"]:
        op = command["op"]
        if op == "fill":
            color = int(command.get("color", 0)) & 0x0F
            x0 = int(command.get("x", 0))
            y0 = int(command.get("y", 0))
            w = int(command.get("w", 0))
            h = int(command.get("h", 0))
            for y in range(max(0, y0), min(height, y0 + h)):
                for x in range(max(0, x0), min(width, x0 + w)):
                    pixels[y][x] = color
        elif op == "lineH":
            color = int(command.get("color", 0)) & 0x0F
            y = int(command.get("y", 0))
            if 0 <= y < height:
                x0 = int(command.get("x", 0))
                length = int(command.get("length", 0))
                for x in range(max(0, x0), min(width, x0 + length)):
                    pixels[y][x] = color
        elif op == "lineV":
            color = int(command.get("color", 0)) & 0x0F
            x = int(command.get("x", 0))
            if 0 <= x < width:
                y0 = int(command.get("y", 0))
                length = int(command.get("length", 0))
                for y in range(max(0, y0), min(height, y0 + length)):
                    pixels[y][x] = color
    return pixels


def render_smoke_bitmap_room(project: dict[str, object]) -> list[list[int]]:
    room = project["assets"][0]["data"]
    framebuffer = room.get("visibleFramebuffer")
    if isinstance(framebuffer, dict) and isinstance(framebuffer.get("pixels"), list):
        return framebuffer["pixels"]
    width = int(room["width"])
    height = int(room["height"])
    background_color = int(room.get("backgroundColor", 0)) & 0x0F
    pixels = [[background_color for _x in range(width)] for _y in range(height)]
    atlas = room["atlas"]
    atlas_pixels = atlas["pixels"]
    entries = {entry["id"]: entry for entry in atlas["entries"]}
    entry_list = atlas["entries"]
    has_tile_grid = isinstance(room.get("tileGrid"), list)

    for command in room["composition"]["commands"]:
        op = command["op"]
        if has_tile_grid and op == "copy":
            continue
        if op == "fill":
            color = int(command.get("color", 0))
            x0 = int(command.get("x", 0))
            y0 = int(command.get("y", 0))
            w = int(command.get("w", 0))
            h = int(command.get("h", 0))
            for y in range(max(0, y0), min(height, y0 + h)):
                for x in range(max(0, x0), min(width, x0 + w)):
                    pixels[y][x] = color
        elif op == "lineH":
            color = int(command.get("color", 0))
            y = int(command.get("y", 0))
            if 0 <= y < height:
                x0 = int(command.get("x", 0))
                length = int(command.get("length", 0))
                for x in range(max(0, x0), min(width, x0 + length)):
                    pixels[y][x] = color
        elif op == "copy":
            entry = entries[command["atlasEntryId"]]
            sx = int(entry["sx"])
            sy = int(entry["sy"])
            w = int(command.get("w", entry["w"]))
            h = int(command.get("h", entry["h"]))
            dx = int(command.get("dx", 0))
            dy = int(command.get("dy", 0))
            for y in range(h):
                ty = dy + y
                ay = sy + y
                if not (0 <= ty < height and 0 <= ay < len(atlas_pixels)):
                    continue
                for x in range(w):
                    tx = dx + x
                    ax = sx + x
                    if 0 <= tx < width and 0 <= ax < len(atlas_pixels[ay]):
                        pixels[ty][tx] = int(atlas_pixels[ay][ax])
        else:
            raise RuntimeError(f"Unsupported smoke composition command: {op}")

    if has_tile_grid:
        for cy, row in enumerate(room["tileGrid"]):
            for cx, value in enumerate(row):
                entry_index = int(value) - 1
                if entry_index < 0 or entry_index >= len(entry_list):
                    continue
                entry = entry_list[entry_index]
                sx = int(entry["sx"])
                sy = int(entry["sy"])
                w = int(entry["w"])
                h = int(entry["h"])
                dx = cx * 16
                dy = cy * 16
                for y in range(h):
                    ty = dy + y
                    ay = sy + y
                    if not (0 <= ty < height and 0 <= ay < len(atlas_pixels)):
                        continue
                    for x in range(w):
                        tx = dx + x
                        ax = sx + x
                        if 0 <= tx < width and 0 <= ax < len(atlas_pixels[ay]):
                            pixels[ty][tx] = int(atlas_pixels[ay][ax])

    return pixels


def validate_bitmap_palette_indices(pixels: list[list[int]]) -> None:
    for y, row in enumerate(pixels):
        for x, color in enumerate(row):
            if not 0 <= int(color) <= 15:
                raise RuntimeError(f"Bitmap Room smoke fixture has invalid palette index at y={y}, x={x}: {color}")


def extract_db_bytes(asm_text: str, label: str) -> list[int]:
    match = re.search(rf"^{re.escape(label)}:\s*$", asm_text, flags=re.MULTILINE)
    if not match:
        raise RuntimeError(f"Generated ASM is missing label: {label}")
    bytes_out: list[int] = []
    for line in asm_text[match.end():].splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if not stripped.upper().startswith("DB "):
            break
        for token in stripped[3:].split(","):
            value = token.strip()
            if value.startswith("#"):
                bytes_out.append(int(value[1:], 16))
            else:
                bytes_out.append(int(value, 10))
    return bytes_out


def validate_generated_asm_tables(asm_text: str, project: dict[str, object]) -> None:
    has_linked_hud = any(
        asset.get("type") == "msx2bitmaproom"
        and ((asset.get("data") or {}).get("runtime") or {}).get("hudAssetId")
        for asset in project.get("assets", [])
    )
    for marker in (
        "Bitmap room HUD height: 20 px",
        "Bitmap room HUD widgets: 4",
        "Bitmap room game area: 256x192 at visual Y=20",
        "World rooms: 2; start room index: 0",
        "Shared tileset bytes: 2048 at VRAM #10000",
        "FUNCTION: init_plain32k_page2_slot",
        "Mirror the cartridge primary slot from page 1 (#4000-#7FFF) into page 2",
        "add a, 20",
        "player_anim_counter EQU #C004",
        "player_vy           EQU #C006",
        "player_facing       EQU #C008",
        "player_moving       EQU #C00A",
        "FUNCTION: bitmap_update_player_sprite_animation",
        "ld a, (player_moving)",
        "px/frame initial jump velocity (Player Config jumpPower)",
        "bit 0, c     ; jump key SPC",
        "bitmap_room_collision_map EQU",
        "bitmap_displayed_page             EQU #C0D0",
        "bitmap_composition_state          EQU #C0D1",
        "FUNCTION: start_room_transition",
        "FUNCTION: step_room_composition",
        "FUNCTION: commit_room_flip",
        "bitmap_air_dash_timer     EQU #C0DA",
        "FUNCTION: bitmap_try_start_air_dash",
        "FUNCTION: bitmap_step_air_dash_movement",
        "PURPOSE: Reads the configured air_dash input (N) via PPI.",
        "or 4\n    out (PPI_C), a\n    in a, (PPI_B)\n    cpl\n    and #08",
        "bitmap_glide_stamina EQU #C0DE",
        "FUNCTION: bitmap_apply_glide_clamp",
        "bitmap_wall_slide_side       EQU #C0E0",
        "FUNCTION: bitmap_wall_jump_frame_gate",
        "bitmap_stomp_active     EQU #C0E4",
        "bitmap_shake_timer       EQU #C0E6",
        "FUNCTION: bitmap_try_start_stomp",
        "FUNCTION: bitmap_screen_shake_update",
        "bitmap_room_collision_0:",
        "current_screen_index EQU",
    ):
        if has_linked_hud and marker.startswith("Bitmap room HUD widgets:"):
            continue
        if marker not in asm_text:
            raise RuntimeError(f"Generated ASM is missing bitmap-room HUD marker: {marker}")

    if "add a, 16\n.store_player_pattern:" not in asm_text:
        raise RuntimeError("Generated ASM is missing mirrored sprite pattern offset for 2 animation frames x 2 hardware layers")
    if "ld (player_pat), a" not in asm_text:
        raise RuntimeError("Generated ASM does not update player_pat from animation/facing state")
    if "add a, 4\n    out (#98), a" not in asm_text:
        raise RuntimeError("Generated ASM does not write SAT pattern offset for the second player hardware layer")

    palette_length = len(extract_db_bytes(asm_text, "screen5_bitmap_palette_data"))
    if palette_length != 32:
        raise RuntimeError(f"screen5_bitmap_palette_data has {palette_length} bytes; expected 32")

    sprite_pattern_length = len(extract_db_bytes(asm_text, "bitmap_room_sprite_patterns"))
    if sprite_pattern_length != 256:
        raise RuntimeError(
            f"bitmap_room_sprite_patterns has {sprite_pattern_length} bytes; expected 256 "
            "(2 frames x 2 layers + mirrored copies, 32 bytes each)"
        )

    sprite_color_length = len(extract_db_bytes(asm_text, "bitmap_room_sprite_colors"))
    if sprite_color_length != 64:
        raise RuntimeError(
            f"bitmap_room_sprite_colors has {sprite_color_length} bytes; expected 64 "
            "(2 frames x 2 hardware layers, 16 line colors each)"
        )

    hud_chunks = re.findall(r"^bitmap_room_hud_seed_p[01]_rle_chunk_\d+:\s*$", asm_text, flags=re.MULTILINE)
    if not hud_chunks:
        raise RuntimeError("Generated ASM is missing bitmap_room_hud_seed_p0/p1_rle_chunk_* data")
    hud_decoded_length = 0
    for chunk_label in (chunk.split(":", 1)[0] for chunk in hud_chunks):
        chunk_bytes = extract_db_bytes(asm_text, chunk_label)
        if len(chunk_bytes) % 2 != 0:
            raise RuntimeError(f"{chunk_label} has odd RLE byte length: {len(chunk_bytes)}")
        for index in range(0, len(chunk_bytes), 2):
            hud_decoded_length += chunk_bytes[index]
    expected_hud_length = 2 * 256 * 20 // 2
    if hud_decoded_length != expected_hud_length:
        raise RuntimeError(
            f"bitmap room HUD seed RLE decodes to {hud_decoded_length} bytes; expected {expected_hud_length}"
        )

    # Shared world tileset (atlas) uploaded once to offscreen VRAM.
    room = next(
        (asset["data"] for asset in project["assets"]  # type: ignore[index]
         if asset.get("type") == "msx2bitmaproom"),
        None,
    )
    atlas = room["atlas"] if room else {"width": 128, "height": 16}
    # Each atlas row is packed to the full 256px VRAM stride (128 bytes), so the
    # tileset occupies 128 bytes * atlas height in offscreen VRAM.
    expected_tileset_length = 128 * int(atlas["height"])
    tileset_chunks = re.findall(r"^bitmap_room_tileset_rle_chunk_\d+:\s*$", asm_text, flags=re.MULTILINE)
    if not tileset_chunks:
        raise RuntimeError("Generated ASM is missing bitmap_room_tileset_rle_chunk_* data")
    tileset_decoded_length = 0
    for chunk_label in (chunk.split(":", 1)[0] for chunk in tileset_chunks):
        chunk_bytes = extract_db_bytes(asm_text, chunk_label)
        if len(chunk_bytes) % 2 != 0:
            raise RuntimeError(f"{chunk_label} has odd RLE byte length: {len(chunk_bytes)}")
        for index in range(0, len(chunk_bytes), 2):
            tileset_decoded_length += chunk_bytes[index]
    if tileset_decoded_length != expected_tileset_length:
        raise RuntimeError(
            f"bitmap room tileset RLE decodes to {tileset_decoded_length} bytes; expected {expected_tileset_length}"
        )

    # Room 0 render program: a list of 15-byte V9938 command blocks. The 192-byte
    # tile map is authoritative, so the only tile copy must be tileGrid[0][0] (the
    # stale composition copy at the same cell must be ignored).
    render_bytes = extract_db_bytes(asm_text, "bitmap_room_render_0_p0")
    if not render_bytes or len(render_bytes) % 15 != 0:
        raise RuntimeError(f"bitmap_room_render_0_p0 has {len(render_bytes)} bytes; expected a non-zero multiple of 15")
    blocks = [render_bytes[i:i + 15] for i in range(0, len(render_bytes), 15)]
    copy_blocks = [b for b in blocks if b[14] == 0xD0]  # HMMM (high-speed VRAM->VRAM copy)
    if len(copy_blocks) != 1:
        raise RuntimeError(
            f"bitmap_room_render_0_p0 has {len(copy_blocks)} tile-copy blocks; expected exactly 1 (sparse tileGrid)"
        )
    copy = copy_blocks[0]
    dest_x = copy[4] | (copy[5] << 8)
    dest_y = copy[6] | (copy[7] << 8)
    src_y = copy[2] | (copy[3] << 8)
    if dest_x != 0 or dest_y != 20:
        raise RuntimeError(
            f"tile (0,0) copy lands at DX={dest_x},DY={dest_y}; expected DX=0,DY=20 (HUD-offset game band)"
        )
    if src_y < 512:
        raise RuntimeError(
            f"tile copy source Y={src_y} is not in the page-2 offscreen tileset (expected >= 512)"
        )

    render_page1_bytes = extract_db_bytes(asm_text, "bitmap_room_render_0_p1")
    if not render_page1_bytes or len(render_page1_bytes) % 15 != 0:
        raise RuntimeError(
            f"bitmap_room_render_0_p1 has {len(render_page1_bytes)} bytes; expected a non-zero multiple of 15"
        )
    page1_blocks = [render_page1_bytes[i:i + 15] for i in range(0, len(render_page1_bytes), 15)]
    page1_copy_blocks = [b for b in page1_blocks if b[14] == 0xD0]
    if len(page1_copy_blocks) != 1:
        raise RuntimeError(
            f"bitmap_room_render_0_p1 has {len(page1_copy_blocks)} tile-copy blocks; expected exactly 1"
        )
    page1_copy = page1_copy_blocks[0]
    page1_dest_y = page1_copy[6] | (page1_copy[7] << 8)
    if page1_dest_y != 276:
        raise RuntimeError(
            f"page 1 tile copy lands at DY={page1_dest_y}; expected DY=276 (page1 base 256 + HUD 20)"
        )


def validate_all_bitmap_skill_markers(asm_text: str) -> None:
    for marker in (
        "bitmap_try_start_air_dash",
        "bitmap_apply_glide_clamp",
        "bitmap_wall_jump_frame_gate",
        "bitmap_wall_jump_detect_any_contact",
        "bitmap_power_stomp_frame_gate",
        "bitmap_shoot_pressed",
        "bitmap_try_teleport_ab",
        "bitmap_try_slash",
        "bitmap_grab_detect",
        "bitmap_highjump_arm",
        "bitmap_try_wall_break",
        "bitmap_try_spin_attack",
        "update_bitmap_carry_and_throw",
        "bitmap_update_carry_sat",
        "bitmap_carry_check_enemy_collision",
    ):
        if marker not in asm_text:
            raise RuntimeError(f"All-bitmap-skills smoke is missing ASM marker: {marker}")


def inject_linked_hud_bar(project: dict[str, object]) -> None:
    """Append a standalone msx2hud asset (a playerEnergy bar + a score counter) and
    link it from room A via runtime.hudAssetId. Exercises the dynamic linked-HUD
    path in msx2Screen5BitmapRoomGenerator: the bar is a dynamic HMMV widget bound
    to the real player_health byte; the counter is a tile-based dynamic widget."""
    hud_asset = {
        "id": "smoke_hud_linked",
        "name": "Smoke Linked HUD",
        "type": "msx2hud",
        "data": {
            "target": "MSX2",
            "width": 256,
            "height": 20,
            "paletteAssetId": None,
            "icons": [],
            "notes": "Linked HUD smoke: bar bound to playerEnergy + score counter.",
            "layers": [
                {
                    "id": "hud_layer_bar",
                    "name": "Energy Bar",
                    "kind": "widget",
                    "visible": True,
                    "locked": False,
                    "element": {
                        "id": "el_energy_bar",
                        "kind": "bar",
                        "x": 72,
                        "y": 6,
                        "width": 80,
                        "height": 8,
                        "binding": "playerEnergy",
                        "maxValue": 16,
                        "initialValue": 12,
                        "format": {"base": "dec", "zeroPad": False},
                        "colors": {"primary": 10, "empty": 4, "border": 15},
                        "align": {"h": "left", "v": "top"},
                        "visible": True,
                        "blink": "off",
                    },
                },
                {
                    "id": "hud_layer_counter",
                    "name": "Score",
                    "kind": "widget",
                    "visible": True,
                    "locked": False,
                    "element": {
                        "id": "el_score",
                        "kind": "counter",
                        "x": 8,
                        "y": 4,
                        "width": 48,
                        "height": 8,
                        "binding": "score",
                        "initialValue": 7,
                        "format": {"digits": 3, "base": "dec", "zeroPad": True},
                        "colors": {"text": 11},
                        "align": {"h": "left", "v": "top"},
                        "visible": True,
                        "blink": "off",
                    },
                },
                {
                    "id": "hud_layer_hearts",
                    "name": "Hearts",
                    "kind": "widget",
                    "visible": True,
                    "locked": False,
                    "element": {
                        "id": "el_player_hearts",
                        "kind": "iconRow",
                        "x": 160,
                        "y": 2,
                        "width": 96,
                        "height": 16,
                        "binding": "playerEnergy",
                        "maxValue": 16,
                        "initialValue": 12,
                        "format": {"base": "dec", "zeroPad": False},
                        "colors": {"primary": 8, "empty": 0, "border": 15},
                        "align": {"h": "left", "v": "top"},
                        "visible": True,
                        "blink": "off",
                    },
                },
                {
                    "id": "hud_layer_wide",
                    "name": "Score Wide",
                    "kind": "widget",
                    "visible": True,
                    "locked": False,
                    "element": {
                        "id": "el_score_wide",
                        "kind": "counter",
                        "x": 120,
                        "y": 4,
                        "width": 56,
                        "height": 8,
                        "binding": "custom",
                        "variableName": "scoreWide",
                        "initialValue": 12345,
                        "format": {"digits": 5, "base": "dec", "zeroPad": True},
                        "colors": {"text": 10},
                        "align": {"h": "left", "v": "top"},
                        "visible": True,
                        "blink": "off",
                    },
                },
                {
                    "id": "hud_layer_air",
                    "name": "Time",
                    "kind": "widget",
                    "visible": True,
                    "locked": False,
                    "element": {
                        "id": "el_time",
                        "kind": "counter",
                        "x": 184,
                        "y": 4,
                        "width": 40,
                        "height": 8,
                        "binding": "air",
                        "initialValue": 180,
                        "format": {"digits": 3, "base": "dec", "zeroPad": True},
                        "colors": {"text": 15},
                        "align": {"h": "left", "v": "top"},
                        "visible": True,
                        "blink": "off",
                    },
                },
            ],
        },
    }
    project["assets"].append(hud_asset)
    for asset in project["assets"]:
        if asset.get("type") == "msx2bitmaproom" and asset.get("id") == "bitmap_room_smoke":
            asset["data"].setdefault("runtime", {})["hudAssetId"] = "smoke_hud_linked"


def main() -> int:
    args = parse_args()
    project_root = Path(args.project_root).resolve()
    json_output = Path(args.json_output).resolve()
    asm_output = Path(args.asm_output).resolve()
    rom_output = Path(args.rom_output).resolve()
    screenshot_output = Path(args.screenshot_output).resolve()

    project = build_project()
    if args.include_all_bitmap_skills:
        enable_all_bitmap_skills(project)
    if args.include_linked_hud_bar:
        inject_linked_hud_bar(project)
    validate_bitmap_palette_indices(render_smoke_bitmap_room(project))

    json_output.parent.mkdir(parents=True, exist_ok=True)
    json_output.write_text(json.dumps(project, indent=2) + "\n", encoding="utf-8")
    print(f"Project JSON written: {json_output}")

    run_command([
        sys.executable,
        str(project_root / "scripts" / "build_mideas_unified_rom.py"),
        "--json",
        str(json_output),
        "--project-root",
        str(project_root),
        "--asm-output",
        str(asm_output),
        "--rom-output",
        str(rom_output),
        "--allow-tsc-errors",
    ], cwd=project_root, timeout=180)

    asm_text = asm_output.read_text(encoding="utf-8")
    for marker in (
        "init_screen5_bitmap_vdp",
        "upload_tileset_atlas",
        "bitmap_room_tileset_data",
        "load_room",
        "replay_room_commands",
        "bitmap_room_render_ptr_table_p0",
        "bitmap_room_render_ptr_table_p1",
        "Mideas MSX2 SCREEN 4 bitmap room backend (V9938 command engine)",
    ):
        if marker not in asm_text:
            raise RuntimeError(f"Generated ASM is missing marker: {marker}")
    validate_generated_asm_tables(asm_text, project)
    if args.include_all_bitmap_skills:
        validate_all_bitmap_skill_markers(asm_text)
    if args.include_linked_hud_bar:
        for marker in (
            "Dynamic bar meter for linked HUD element",
            "Generalized icon-row",
            "fillW = clamp(value,0,5) * 80 / 5",
            "redraws 5",
            "bitmap_restore_hud_separator",
            "A 256x1 color-15 separator is restored on BOTH page 0 and page 1",
            "hud_linked_launch_cmd",
            "update_hud_linked_0",   # air counter = back-most layer after back-to-front ordering
            "update_hud_linked_1",   # wide 16-bit counter
            "update_hud_linked_2",   # iconRow playerEnergy, still maxHealth slots
            "update_hud_linked_3",   # narrow 8-bit counter
            "update_hud_linked_4",   # bar = front-most layer, drawn last before separator
            "hud_word_to_dec5",      # 16-bit decimal conversion routine
            "hud_dec5_buffer EQU",   # shared 5-byte dec buffer
            "update_air_timer",      # G3: air/time countdown routine
            "air_timer EQU",         # room countdown byte (read by air-bound counters)
        ):
            if marker not in asm_text:
                raise RuntimeError(f"Linked HUD bar marker missing in ASM: {marker}")
        expected_order = [
            "call update_hud_linked_0",
            "call update_hud_linked_1",
            "call update_hud_linked_2",
            "call update_hud_linked_3",
            "call update_hud_linked_4",
        ]
        cursor = -1
        for marker in expected_order:
            pos = asm_text.find(marker, cursor + 1)
            if pos < 0:
                raise RuntimeError(f"Linked HUD runtime draw order missing marker after {cursor}: {marker}")
            cursor = pos
        if "Force linked HUD dynamic widgets to redraw on the newly displayed page" in asm_text:
            raise RuntimeError("Linked HUD must not invalidate/redraw on room page flip; widgets are mirrored to both pages on value changes.")
        for forbidden in (
            "\nupdate_hud_hearts:",
            "\nupload_hud_hearts:",
            "\nhud_hearts_drawn EQU",
            "bitmap_room_hud_heart_rle_chunk",
        ):
            if forbidden in asm_text:
                raise RuntimeError(f"Linked HUD asset must disable the automatic hearts HUD, but ASM still contains: {forbidden}")

    if not args.skip_openmsx:
        probe_output = screenshot_output.with_suffix(".probe.txt")
        run_command([
            sys.executable,
            str(project_root / "scripts" / "capture_openmsx_action.py"),
            "--rom",
            str(rom_output),
            "--project-root",
            str(project_root),
            "--sequence",
            "RIGHT:5000",
            "--output",
            str(screenshot_output),
            "--boot-wait-ms",
            str(args.boot_wait_ms),
            "--capture-wait-ms",
            "9000",
            "--probe-output",
            str(probe_output),
            "--probe",
            "screen:0xC00B",
            "--probe",
            "displayed:0xC0D0",
            "--probe",
            "composing:0xC0D1",
            "--probe",
            "blocks_lo:0xC0D6",
            "--probe",
            "blocks_hi:0xC0D7",
            "--probe",
            "player_x:0xC001",
        ], cwd=project_root, timeout=90)
        if not screenshot_output.exists() or screenshot_output.stat().st_size == 0:
            raise RuntimeError(f"OpenMSX screenshot was not produced: {screenshot_output}")
        if not probe_output.exists():
            raise RuntimeError(f"OpenMSX probe output was not produced: {probe_output}")
        probe_values: dict[str, int] = {}
        for line in probe_output.read_text(encoding="utf-8").splitlines():
            if "=" not in line:
                continue
            label, value = line.split("=", 1)
            probe_values[label.strip()] = int(value.strip(), 16)
        if probe_values.get("screen") != 1:
            raise RuntimeError(f"OpenMSX transition did not reach room 1: {probe_values}")
        if probe_values.get("displayed") != 1:
            raise RuntimeError(f"OpenMSX transition did not flip to display page 1: {probe_values}")
        if probe_values.get("composing") != 0:
            raise RuntimeError(f"OpenMSX transition composition did not finish cleanly: {probe_values}")
        print(f"Screenshot ready: {screenshot_output}")

        air_dash_output = screenshot_output.with_name(f"{screenshot_output.stem}_air_dash{screenshot_output.suffix}")
        air_dash_probe_output = air_dash_output.with_suffix(".probe.txt")
        run_command([
            sys.executable,
            str(project_root / "scripts" / "capture_openmsx_action.py"),
            "--rom",
            str(rom_output),
            "--project-root",
            str(project_root),
            "--sequence",
            "WAIT:700",
            "--output",
            str(air_dash_output),
            "--boot-wait-ms",
            str(args.boot_wait_ms),
            "--capture-wait-ms",
            "800",
            "--probe-output",
            str(air_dash_probe_output),
            "--probe",
            "screen:0xC00B",
            "--probe",
            "air_timer:0xC0DA",
            "--probe",
            "air_cooldown:0xC0DB",
            "--probe",
            "player_x:0xC001",
            "--probe",
            "player_y:0xC000",
            "--poke",
            "0xC0DA:0x06",
            "--poke",
            "0xC0DD:0x01",
        ], cwd=project_root, timeout=90)
        if not air_dash_output.exists() or air_dash_output.stat().st_size == 0:
            raise RuntimeError(f"OpenMSX air_dash screenshot was not produced: {air_dash_output}")
        if not air_dash_probe_output.exists():
            raise RuntimeError(f"OpenMSX air_dash probe output was not produced: {air_dash_probe_output}")
        air_dash_probe_values: dict[str, int] = {}
        for line in air_dash_probe_output.read_text(encoding="utf-8").splitlines():
            if "=" not in line:
                continue
            label, value = line.split("=", 1)
            air_dash_probe_values[label.strip()] = int(value.strip(), 16)
        if air_dash_probe_values.get("screen") != 0:
            raise RuntimeError(f"OpenMSX air_dash smoke unexpectedly changed room: {air_dash_probe_values}")
        if air_dash_probe_values.get("player_x", 0) < 70:
            raise RuntimeError(f"OpenMSX air_dash did not move the player far enough: {air_dash_probe_values}")
        if air_dash_probe_values.get("air_timer") != 0:
            raise RuntimeError(f"OpenMSX air_dash timer did not drain: {air_dash_probe_values}")
        print(f"Air dash screenshot ready: {air_dash_output}")

        glide_output = screenshot_output.with_name(f"{screenshot_output.stem}_glide{screenshot_output.suffix}")
        glide_probe_output = glide_output.with_suffix(".probe.txt")
        run_command([
            sys.executable,
            str(project_root / "scripts" / "capture_openmsx_action.py"),
            "--rom",
            str(rom_output),
            "--project-root",
            str(project_root),
            "--sequence",
            "SPACE:700",
            "--output",
            str(glide_output),
            "--boot-wait-ms",
            str(args.boot_wait_ms),
            "--capture-wait-ms",
            "150",
            "--probe-output",
            str(glide_probe_output),
            "--probe",
            "screen:0xC00B",
            "--probe",
            "player_y:0xC000",
            "--probe",
            "player_vy:0xC006",
            "--probe",
            "glide_stamina:0xC0DE",
            "--probe",
            "glide_active:0xC0DF",
            "--poke",
            "0xC000:0x64",
            "--poke",
            "0xC006:0x08",
            "--poke",
            "0xC007:0x00",
            "--poke",
            "0xC009:0x00",
        ], cwd=project_root, timeout=90)
        if not glide_output.exists() or glide_output.stat().st_size == 0:
            raise RuntimeError(f"OpenMSX glide screenshot was not produced: {glide_output}")
        if not glide_probe_output.exists():
            raise RuntimeError(f"OpenMSX glide probe output was not produced: {glide_probe_output}")
        glide_probe_values: dict[str, int] = {}
        for line in glide_probe_output.read_text(encoding="utf-8").splitlines():
            if "=" not in line:
                continue
            label, value = line.split("=", 1)
            glide_probe_values[label.strip()] = int(value.strip(), 16)
        if glide_probe_values.get("screen") != 0:
            raise RuntimeError(f"OpenMSX glide smoke unexpectedly changed room: {glide_probe_values}")
        if glide_probe_values.get("player_y", 0) >= 170:
            raise RuntimeError(f"OpenMSX glide did not slow the fall enough: {glide_probe_values}")
        if glide_probe_values.get("player_vy", 0xFF) > 2:
            raise RuntimeError(f"OpenMSX glide did not clamp fall velocity: {glide_probe_values}")
        if glide_probe_values.get("glide_stamina", 0x64) >= 0x64:
            raise RuntimeError(f"OpenMSX glide did not consume stamina while SPACE was held: {glide_probe_values}")
        print(f"Glide screenshot ready: {glide_output}")

        wall_jump_output = screenshot_output.with_name(f"{screenshot_output.stem}_wall_jump{screenshot_output.suffix}")
        wall_jump_probe_output = wall_jump_output.with_suffix(".probe.txt")
        run_command([
            sys.executable,
            str(project_root / "scripts" / "capture_openmsx_action.py"),
            "--rom",
            str(rom_output),
            "--project-root",
            str(project_root),
            "--sequence",
            "SPACE:300",
            "--output",
            str(wall_jump_output),
            "--boot-wait-ms",
            str(args.boot_wait_ms),
            "--capture-wait-ms",
            "500",
            "--probe-output",
            str(wall_jump_probe_output),
            "--probe",
            "screen:0xC00B",
            "--probe",
            "player_x:0xC001",
            "--probe",
            "player_y:0xC000",
            "--probe",
            "player_vy:0xC006",
            "--probe",
            "wall_side:0xC0E0",
            "--probe",
            "wall_lock_timer:0xC0E1",
            "--probe",
            "wall_lock_vx:0xC0E2",
            "--probe",
            "wall_key_lock:0xC0E3",
            "--poke",
            "0xC000:0x64",
            "--poke",
            "0xC001:0x2E",
            "--poke",
            "0xC006:0x04",
            "--poke",
            "0xC007:0x00",
            "--poke",
            "0xC0E0:0x00",
            "--poke",
            "0xC0E1:0x01",
            "--poke",
            "0xC0E2:0xFC",
            "--poke",
            "0xC0E3:0x00",
            "--poke",
            "0xC073:0x01",
        ], cwd=project_root, timeout=90)
        if not wall_jump_output.exists() or wall_jump_output.stat().st_size == 0:
            raise RuntimeError(f"OpenMSX wall_jump screenshot was not produced: {wall_jump_output}")
        if not wall_jump_probe_output.exists():
            raise RuntimeError(f"OpenMSX wall_jump probe output was not produced: {wall_jump_probe_output}")
        wall_jump_probe_values: dict[str, int] = {}
        for line in wall_jump_probe_output.read_text(encoding="utf-8").splitlines():
            if "=" not in line:
                continue
            label, value = line.split("=", 1)
            wall_jump_probe_values[label.strip()] = int(value.strip(), 16)
        if wall_jump_probe_values.get("screen") != 0:
            raise RuntimeError(f"OpenMSX wall_jump smoke unexpectedly changed room: {wall_jump_probe_values}")
        if wall_jump_probe_values.get("player_x", 0) <= 70:
            raise RuntimeError(f"OpenMSX wall_jump did not kick the player horizontally: {wall_jump_probe_values}")
        if wall_jump_probe_values.get("wall_lock_vx") != 4:
            raise RuntimeError(f"OpenMSX wall_jump did not latch rightward lock velocity: {wall_jump_probe_values}")
        print(f"Wall jump screenshot ready: {wall_jump_output}")

        power_stomp_output = screenshot_output.with_name(f"{screenshot_output.stem}_power_stomp{screenshot_output.suffix}")
        power_stomp_probe_output = power_stomp_output.with_suffix(".probe.txt")
        run_command([
            sys.executable,
            str(project_root / "scripts" / "capture_openmsx_action.py"),
            "--rom",
            str(rom_output),
            "--project-root",
            str(project_root),
            "--sequence",
            "WAIT:80",
            "--output",
            str(power_stomp_output),
            "--boot-wait-ms",
            str(args.boot_wait_ms),
            "--capture-wait-ms",
            "0",
            "--probe-output",
            str(power_stomp_probe_output),
            "--probe",
            "screen:0xC00B",
            "--probe",
            "player_y:0xC000",
            "--probe",
            "player_vy:0xC006",
            "--probe",
            "player_flags:0xC007",
            "--probe",
            "stomp_active:0xC0E4",
            "--probe",
            "stomp_cooldown:0xC0E5",
            "--probe",
            "shake_timer:0xC0E6",
            "--poke",
            "0xC000:0xB4",
            "--poke",
            "0xC001:0x40",
            "--poke",
            "0xC006:0x00",
            "--poke",
            "0xC007:0x00",
            "--poke",
            "0xC0E4:0x01",
            "--poke",
            "0xC0E5:0x00",
            "--poke",
            "0xC0E6:0x00",
        ], cwd=project_root, timeout=90)
        if not power_stomp_output.exists() or power_stomp_output.stat().st_size == 0:
            raise RuntimeError(f"OpenMSX power_stomp screenshot was not produced: {power_stomp_output}")
        if not power_stomp_probe_output.exists():
            raise RuntimeError(f"OpenMSX power_stomp probe output was not produced: {power_stomp_probe_output}")
        power_stomp_probe_values: dict[str, int] = {}
        for line in power_stomp_probe_output.read_text(encoding="utf-8").splitlines():
            if "=" not in line:
                continue
            label, value = line.split("=", 1)
            power_stomp_probe_values[label.strip()] = int(value.strip(), 16)
        if power_stomp_probe_values.get("screen") != 0:
            raise RuntimeError(f"OpenMSX power_stomp smoke unexpectedly changed room: {power_stomp_probe_values}")
        if power_stomp_probe_values.get("stomp_active") != 0:
            raise RuntimeError(f"OpenMSX power_stomp did not clear on landing: {power_stomp_probe_values}")
        if (power_stomp_probe_values.get("player_flags", 0) & 0x01) == 0:
            raise RuntimeError(f"OpenMSX power_stomp did not land/ground the player: {power_stomp_probe_values}")
        print(f"Power stomp screenshot ready: {power_stomp_output}")

    print(f"Smoke ROM ready: {rom_output} ({rom_output.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
