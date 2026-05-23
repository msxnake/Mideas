import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
DOWNLOADS = Path(r"C:\Users\salam\Downloads")
SCREENSHOTS = ROOT / "screenshots"
PROJECT_NAME = "Gold Runner - Lode Runner Style Clone"
PROJECT_ID = "gold_runner_loderunner_clone"
JSON_NAME = "gold_runner_loderunner_clone_mideas.json"
REPORT_NAME = "gold_runner_loderunner_clone_validation.md"
PNG_NAME = "gold_runner_loderunner_clone_preview.png"


MSX = {
    "transparent": "#000000",
    "black": "#000000",
    "dark_blue": "#1D2B53",
    "blue": "#5D76CB",
    "red": "#D4524D",
    "light_red": "#FF7978",
    "brown": "#8F563B",
    "tan": "#C2B280",
    "yellow": "#E6D16E",
    "green": "#3CB371",
    "cyan": "#5BC0EB",
    "white": "#FFFFFF",
    "gray": "#8A8A8A",
}


def tile_pixels(kind):
    bg = MSX["black"]
    if kind == "empty":
        return [[bg for _ in range(8)] for _ in range(8)]
    if kind == "brick":
        a, b, c = MSX["red"], MSX["light_red"], MSX["brown"]
        return [
            [c, c, c, c, c, c, c, c],
            [a, a, a, b, c, a, a, a],
            [a, a, b, a, c, a, b, a],
            [c, c, c, c, c, c, c, c],
            [a, b, a, a, c, a, a, b],
            [a, a, a, b, c, b, a, a],
            [c, c, c, c, c, c, c, c],
            [a, a, b, a, c, a, a, a],
        ]
    if kind == "concrete":
        g, w = MSX["gray"], MSX["white"]
        return [
            [g, g, g, g, g, g, g, g],
            [g, w, g, g, g, w, g, g],
            [g, g, g, w, g, g, g, w],
            [w, g, g, g, w, g, g, g],
            [g, g, w, g, g, g, w, g],
            [g, w, g, g, g, w, g, g],
            [g, g, g, w, g, g, g, w],
            [g, g, g, g, g, g, g, g],
        ]
    if kind == "ladder":
        r, n = MSX["yellow"], bg
        return [
            [r, n, n, n, n, n, n, r],
            [r, n, n, n, n, n, n, r],
            [r, r, r, r, r, r, r, r],
            [r, n, n, n, n, n, n, r],
            [r, n, n, n, n, n, n, r],
            [r, r, r, r, r, r, r, r],
            [r, n, n, n, n, n, n, r],
            [r, n, n, n, n, n, n, r],
        ]
    if kind == "rope":
        y, n = MSX["tan"], bg
        return [
            [n, n, n, n, n, n, n, n],
            [y, y, y, y, y, y, y, y],
            [n, y, n, y, n, y, n, y],
            [n, n, n, n, n, n, n, n],
            [n, n, n, n, n, n, n, n],
            [n, n, n, n, n, n, n, n],
            [n, n, n, n, n, n, n, n],
            [n, n, n, n, n, n, n, n],
        ]
    if kind == "gold":
        y, w, n = MSX["yellow"], MSX["white"], bg
        return [
            [n, n, n, y, y, n, n, n],
            [n, n, y, w, w, y, n, n],
            [n, y, w, y, y, w, y, n],
            [n, y, y, y, y, y, y, n],
            [n, n, y, y, y, y, n, n],
            [n, n, n, y, y, n, n, n],
            [n, n, n, n, n, n, n, n],
            [n, n, n, n, n, n, n, n],
        ]
    if kind == "exit":
        g, w, n = MSX["green"], MSX["white"], bg
        return [
            [n, n, w, w, w, w, n, n],
            [n, w, g, g, g, g, w, n],
            [w, g, n, n, n, n, g, w],
            [w, g, n, w, w, n, g, w],
            [w, g, n, n, n, n, g, w],
            [n, w, g, g, g, g, w, n],
            [n, n, w, w, w, w, n, n],
            [n, n, n, n, n, n, n, n],
        ]
    if kind == "trap":
        a, b, n = MSX["brown"], MSX["tan"], bg
        return [
            [n, n, n, n, n, n, n, n],
            [a, b, a, b, a, b, a, b],
            [b, a, b, a, b, a, b, a],
            [n, a, n, b, n, a, n, b],
            [n, n, n, n, n, n, n, n],
            [n, n, n, n, n, n, n, n],
            [n, n, n, n, n, n, n, n],
            [n, n, n, n, n, n, n, n],
        ]
    raise ValueError(kind)


def sprite_frame(kind):
    n = MSX["transparent"]
    if kind == "runner":
        y, b, w = MSX["yellow"], MSX["blue"], MSX["white"]
        return [
            [n,n,n,n,n,y,y,y,y,y,n,n,n,n,n,n],
            [n,n,n,n,y,y,y,y,y,y,y,n,n,n,n,n],
            [n,n,n,n,y,n,w,y,y,w,n,y,n,n,n,n],
            [n,n,n,n,y,y,y,y,y,y,y,y,n,n,n,n],
            [n,n,n,n,n,y,y,y,y,y,y,n,n,n,n,n],
            [n,n,n,b,b,b,b,b,b,b,b,b,n,n,n,n],
            [n,n,b,b,b,w,b,b,b,b,w,b,b,n,n,n],
            [n,b,n,b,b,b,b,b,b,b,b,b,n,b,n,n],
            [n,n,n,b,b,b,b,b,b,b,b,b,n,n,n,n],
            [n,n,n,n,b,b,b,b,b,b,b,n,n,n,n,n],
            [n,n,n,n,b,b,n,n,n,n,b,b,n,n,n,n],
            [n,n,n,b,b,n,n,n,n,n,n,b,b,n,n,n],
            [n,n,b,b,n,n,n,n,n,n,n,n,b,b,n,n],
            [n,b,b,n,n,n,n,n,n,n,n,n,n,b,b,n],
            [n,n,n,n,n,n,n,n,n,n,n,n,n,n,n,n],
            [n,n,n,n,n,n,n,n,n,n,n,n,n,n,n,n],
        ]
    if kind == "guard":
        r, g, w = MSX["light_red"], MSX["gray"], MSX["white"]
        return [
            [n,n,n,n,r,r,r,r,r,r,n,n,n,n,n,n],
            [n,n,n,r,r,r,r,r,r,r,r,n,n,n,n,n],
            [n,n,n,r,w,n,r,r,r,n,w,r,n,n,n,n],
            [n,n,n,r,r,r,r,r,r,r,r,r,n,n,n,n],
            [n,n,n,n,r,r,r,r,r,r,r,n,n,n,n,n],
            [n,n,g,g,g,g,g,g,g,g,g,g,n,n,n,n],
            [n,g,g,r,g,g,g,g,g,g,r,g,g,n,n,n],
            [g,n,g,g,g,g,g,g,g,g,g,g,n,g,n,n],
            [n,n,g,g,g,g,g,g,g,g,g,g,n,n,n,n],
            [n,n,n,g,g,g,g,g,g,g,g,n,n,n,n,n],
            [n,n,n,g,g,n,n,n,n,n,g,g,n,n,n,n],
            [n,n,g,g,n,n,n,n,n,n,n,g,g,n,n,n],
            [n,g,g,n,n,n,n,n,n,n,n,n,g,g,n,n],
            [g,g,n,n,n,n,n,n,n,n,n,n,n,g,g,n],
            [n,n,n,n,n,n,n,n,n,n,n,n,n,n,n,n],
            [n,n,n,n,n,n,n,n,n,n,n,n,n,n,n,n],
        ]
    raise ValueError(kind)


def make_tile(tile_id, name, kind, logical):
    data = tile_pixels(kind)
    return {
        "id": tile_id,
        "name": name,
        "type": "tile",
        "data": {
            "id": tile_id,
            "name": name,
            "width": 8,
            "height": 8,
            "data": data,
            "lineAttributes": [{"fg": row_color(row), "bg": MSX["black"]} for row in data],
            "logicalProperties": logical,
            "tags": ["gold-runner", "loderunner-style", kind],
            "generationTrace": {
                "source": "scripted-msx-pixel-pattern",
                "script": "scripts/create_gold_runner_loderunner_clone.py",
                "date": "2026-05-22",
            },
        },
    }


def row_color(row):
    for color in row:
        if color != MSX["black"]:
            return color
    return MSX["white"]


def make_sprite(sprite_id, name, kind):
    return {
        "id": sprite_id,
        "name": name,
        "type": "sprite",
        "data": {
            "id": sprite_id,
            "name": name,
            "size": {"width": 16, "height": 16},
            "spritePalette": [MSX["transparent"], MSX["white"], MSX["yellow"], MSX["blue"]],
            "backgroundColor": MSX["transparent"],
            "frames": [{"id": f"{sprite_id}_idle_0", "data": sprite_frame(kind), "duration": 10}],
            "animations": [{"id": "idle", "name": "idle", "frameIds": [f"{sprite_id}_idle_0"], "loop": True}],
            "generationTrace": {
                "source": "scripted-msx-sprite",
                "script": "scripts/create_gold_runner_loderunner_clone.py",
                "date": "2026-05-22",
                "purpose": name,
            },
        },
    }


def logical(map_id, solid=False, breakable=False, interaction="none", target=""):
    family = 1 if solid else 0
    instance = 1 if breakable else 0
    return {
        "mapId": map_id,
        "familyId": family,
        "instanceId": instance,
        "isSolid": solid,
        "isBreakable": breakable,
        "isMovable": False,
        "causesDamage": False,
        "isInteractiveSwitch": False,
        "isInteractable": interaction != "none",
        "interactionType": interaction,
        "interactionValue": 1,
        "interactionTarget": target,
    }


def comp_def(comp_id, name, description, props):
    return {
        "id": comp_id,
        "name": name,
        "type": "componentdefinition",
        "data": {"id": comp_id, "name": name, "description": description, "properties": props},
    }


def entity_template(tpl_id, name, icon, is_player, components, description):
    return {
        "id": tpl_id,
        "name": name,
        "type": "entitytemplate",
        "data": {
            "id": tpl_id,
            "name": name,
            "icon": icon,
            "isPlayer": is_player,
            "components": components,
            "description": description,
        },
    }


def component(definition_id, defaults):
    return {"definitionId": definition_id, "defaultValues": defaults}


def build_level():
    bg = []
    solid = []
    layout_rows = [
        "################################",
        "#..........H...............E...#",
        "#..G.......H....G..............#",
        "#......BBBBBBBBBBBBBB..........#",
        "#..........H...................#",
        "#..........H.......RRRRRRR.....#",
        "#.....G....H.............H.....#",
        "#..BBBBBBBBBBBBB.........H.....#",
        "#..................G.....H.....#",
        "#.....RRRRRRR........BBBBBBBB..#",
        "#.....H....................H...#",
        "#.....H....G...............H...#",
        "#..BBBBBBBBBBB.....BBBBBBBBB...#",
        "#..................H...........#",
        "#...........RRRRRRRH....G......#",
        "#..G...............H...........#",
        "#......BBBBBBBBBBBBBBBB........#",
        "#.................T............#",
        "#....H.........................#",
        "#....H....G...............H....#",
        "#BBBBBBBBBBBB....BBBBBBBBBHBBBB#",
        "#.................H............#",
        "#P................H.......G....#",
        "################################",
    ]
    tile_for = {
        "#": "tile_concrete",
        "B": "tile_brick",
        "H": "tile_ladder",
        "R": "tile_rope",
        "G": "tile_gold",
        "E": "tile_exit",
        "T": "tile_trap",
    }
    for y, row in enumerate(layout_rows):
        for x, ch in enumerate(row):
            tile_id = tile_for.get(ch)
            if not tile_id:
                continue
            bg.append({"x": x, "y": y, "tileId": tile_id})
            if tile_id in {"tile_concrete", "tile_brick"}:
                solid.append({"x": x, "y": y, "tileId": tile_id})
    return bg, solid


def make_tilebank(tile_ids):
    assigned = {tile_id: {"charCode": 32 + i} for i, tile_id in enumerate(tile_ids)}
    banks = []
    for i in range(3):
        banks.append({
            "id": f"bank_{i}",
            "name": f"Bank {i} - Gameplay",
            "enabled": True,
            "vramPatternStart": i * 2048,
            "vramColorStart": 8192 + i * 2048,
            "screenZone": {"x": 0, "y": i * 8, "width": 32, "height": 8},
            "charsetRangeStart": 0,
            "charsetRangeEnd": 255,
            "defaultFgColorIndex": 15,
            "defaultBgColorIndex": 1,
            "isLocked": False,
            "assignedTiles": assigned,
        })
    return {"id": "tilebank_gold_runner", "name": "Gold Runner TileBank", "banks": banks}


def build_project():
    tiles = [
        make_tile("tile_empty", "Empty", "empty", logical(0)),
        make_tile("tile_brick", "Diggable Brick", "brick", logical(17, True, True)),
        make_tile("tile_concrete", "Concrete Wall", "concrete", logical(16, True)),
        make_tile("tile_ladder", "Ladder", "ladder", logical(7, False, False, "ladder", "Climb")),
        make_tile("tile_rope", "Hand Rope", "rope", logical(8, False, False, "none", "Traverse")),
        make_tile("tile_gold", "Gold Nugget", "gold", logical(2, False, False, "collect_item", "Gold")),
        make_tile("tile_exit", "Exit Ladder", "exit", logical(3, False, False, "lever_toggle", "ExitOpen")),
        make_tile("tile_trap", "False Brick Trap", "trap", logical(18, False, True)),
    ]
    sprites = [
        make_sprite("sprite_runner", "Runner Player Sprite", "runner"),
        make_sprite("sprite_guard", "Guard Sprite", "guard"),
    ]
    component_defs = [
        comp_def("comp_ladder_climb", "Ladder Climb", "Allows climbing passable ladder tiles using up/down input.", [
            {"name": "climbSpeed", "type": "byte", "defaultValue": "1", "description": "Pixels per frame while climbing."},
            {"name": "ladderTileIds", "type": "string", "defaultValue": "tile_ladder,tile_exit", "description": "Tiles treated as ladders."},
        ]),
        comp_def("comp_rope_traverse", "Rope Traverse", "Allows horizontal traversal while hanging from rope tiles.", [
            {"name": "ropeTileIds", "type": "string", "defaultValue": "tile_rope", "description": "Tiles treated as ropes."},
            {"name": "hangSpeed", "type": "byte", "defaultValue": "1", "description": "Pixels per frame while hanging."},
        ]),
        comp_def("comp_dig_brick", "Dig Brick", "Breaks a diggable brick to the lower-left or lower-right, then respawns it.", [
            {"name": "digLeftKey", "type": "string", "defaultValue": "CTRL", "description": "Input for digging left."},
            {"name": "digRightKey", "type": "string", "defaultValue": "SPC", "description": "Input for digging right."},
            {"name": "respawnFrames", "type": "word", "defaultValue": "240", "description": "Frames before a dug brick returns."},
            {"name": "diggableTileIds", "type": "string", "defaultValue": "tile_brick,tile_trap", "description": "Tiles that can be removed by digging."},
        ]),
        comp_def("comp_gold_goal", "Gold Goal", "Tracks gold collection and opens the exit when the target is reached.", [
            {"name": "targetVariable", "type": "string", "defaultValue": "Gold", "description": "Global variable incremented by collecting gold."},
            {"name": "targetCount", "type": "byte", "defaultValue": "8", "description": "Gold pieces required to complete the level."},
            {"name": "exitVariable", "type": "string", "defaultValue": "ExitOpen", "description": "Boolean global set when enough gold is collected."},
        ]),
        comp_def("comp_guard_ai", "Guard AI", "Simple patrol/chase guard for Lode Runner style pressure.", [
            {"name": "mode", "type": "string", "defaultValue": "patrol_then_chase", "description": "Guard behavior mode."},
            {"name": "speed", "type": "byte", "defaultValue": "1", "description": "Pixels per frame."},
            {"name": "chaseRange", "type": "word", "defaultValue": "96", "description": "Range in pixels for detecting player."},
        ]),
    ]
    runner_tpl = entity_template("tpl_gold_runner_player", "Gold Runner Player", "P", True, [
        component("comp_pos", {"x": 16, "y": 176}),
        component("comp_render", {"spriteAssetId": "sprite_runner", "isVisible": True, "layer": 1}),
        component("comp_physics", {"velocityX": 0, "velocityY": 0, "friction": 32, "mass": 1}),
        component("comp_collision", {"hitboxWidth": 12, "hitboxHeight": 15, "offsetX": 2, "offsetY": 1, "collisionLayer": 1, "collidesWith": 14}),
        component("comp_wall_collision", {"hitboxWidth": 12, "hitboxHeight": 15, "offsetX": 2, "offsetY": 1, "tileSize": 8, "stopOnCollision": True}),
        component("comp_player_input", {"controllerId": 0, "inputEnabled": True}),
        component("comp_cursors", {"isEnabled": True, "speed": 2, "allowUp": True, "allowDown": True, "allowLeft": True, "allowRight": True}),
        component("comp_ladder_climb", {"climbSpeed": 1, "ladderTileIds": "tile_ladder,tile_exit"}),
        component("comp_rope_traverse", {"ropeTileIds": "tile_rope", "hangSpeed": 1}),
        component("comp_dig_brick", {"digLeftKey": "CTRL", "digRightKey": "SPC", "respawnFrames": 240, "diggableTileIds": "tile_brick,tile_trap"}),
        component("comp_tile_collector", {"collectionRadius": 8, "collectibleTileIds": "tile_gold", "replacementTileId": "tile_empty", "targetVariable": "Gold", "incrementAmount": 1, "isEnabled": True}),
        component("comp_gold_goal", {"targetVariable": "Gold", "targetCount": 8, "exitVariable": "ExitOpen"}),
        component("comp_statemachine", {"stateMachineAssetId": "statemachine_gold_runner_rules", "currentStateId": "Idle", "isEnabled": True}),
    ], "Playable runner. Collects all gold, digs bricks, climbs ladders and uses ropes.")
    guard_tpl = entity_template("tpl_gold_runner_guard", "Gold Runner Guard", "G", False, [
        component("comp_pos", {"x": 160, "y": 64}),
        component("comp_render", {"spriteAssetId": "sprite_guard", "isVisible": True, "layer": 1}),
        component("comp_physics", {"velocityX": 0, "velocityY": 0, "friction": 0, "mass": 1}),
        component("comp_collision", {"hitboxWidth": 12, "hitboxHeight": 15, "offsetX": 2, "offsetY": 1, "collisionLayer": 2, "collidesWith": 1}),
        component("comp_wall_collision", {"hitboxWidth": 12, "hitboxHeight": 15, "offsetX": 2, "offsetY": 1, "tileSize": 8, "stopOnCollision": True}),
        component("comp_guard_ai", {"mode": "patrol_then_chase", "speed": 1, "chaseRange": 96}),
    ], "Patrol guard that pressures the player across platforms.")
    bg, solid = build_level()
    entities = [
        {"id": "ent_player_start", "entityTemplateId": "tpl_gold_runner_player", "name": "Player Start", "position": {"x": 1, "y": 22}, "componentOverrides": {"comp_pos": {"x": 16, "y": 176}}},
        {"id": "ent_guard_mid", "entityTemplateId": "tpl_gold_runner_guard", "name": "Guard Mid", "position": {"x": 20, "y": 8}, "componentOverrides": {"comp_pos": {"x": 160, "y": 64}}},
        {"id": "ent_guard_low", "entityTemplateId": "tpl_gold_runner_guard", "name": "Guard Low", "position": {"x": 24, "y": 19}, "componentOverrides": {"comp_pos": {"x": 192, "y": 152}}},
    ]
    screen = {
        "id": "screen_gold_runner_level_1",
        "name": "Level 1 - Gold Runner",
        "type": "screenmap",
        "data": {
            "id": "screen_gold_runner_level_1",
            "name": "Level 1 - Gold Runner",
            "width": 32,
            "height": 24,
            "screenKind": "playable",
            "screenEngine": "player",
            "layers": {"background": {"tiles": bg}, "collision": {"tiles": solid}, "effects": {"tiles": []}, "entities": entities},
            "tileBankAssetId": "tilebank_gold_runner",
            "activeAreaX": 0,
            "activeAreaY": 0,
            "activeAreaWidth": 32,
            "activeAreaHeight": 24,
            "backgroundColor": 1,
            "borderColor": 1,
            "behaviorConfig": {"source": "backgroundChars"},
            "hudConfiguration": {
                "enabled": True,
                "elements": [
                    {"id": "hud_gold", "type": "text", "x": 1, "y": 0, "text": "GOLD"},
                    {"id": "hud_lives", "type": "text", "x": 12, "y": 0, "text": "LIVES"},
                ],
            },
        },
    }
    world = {
        "id": "world_gold_runner",
        "name": "Gold Runner World",
        "type": "worldmap",
        "data": {
            "id": "world_gold_runner",
            "name": "Gold Runner World",
            "nodes": [{"id": "wmnode_gold_runner_start", "screenAssetId": "screen_gold_runner_level_1", "name": "Level 1", "position": {"x": 260, "y": 100}}],
            "connections": [],
            "panOffset": {"x": 0, "y": 0},
            "zoomLevel": 1,
            "gridSize": 20,
            "startScreenNodeId": "wmnode_gold_runner_start",
        },
    }
    gameflow = {
        "id": "gameflow_gold_runner_main",
        "name": "Main",
        "type": "gameflow",
        "data": {
            "id": "gameflow_gold_runner_main",
            "name": "Main",
            "nodes": [
                {"id": "gf_start", "type": "Start", "position": {"x": 40, "y": 120}, "initializeGlobals": {"enabled": True, "globalVariablesAssetId": "globals_gold_runner", "variables": [{"variableName": "Gold", "value": 0}, {"variableName": "Lives", "value": 3}, {"variableName": "ExitOpen", "value": False}]}},
                {"id": "gf_cls", "type": "Transition", "position": {"x": 240, "y": 120}, "effect": "cls", "duration": 150},
                {"id": "gf_world", "type": "WorldLink", "position": {"x": 460, "y": 120}, "worldAssetId": "world_gold_runner"},
                {"id": "gf_win", "type": "End", "position": {"x": 700, "y": 80}, "endType": "Victory", "message": "All gold collected. Escape complete."},
            ],
            "connections": [
                {"id": "gf_conn_start_cls", "from": {"nodeId": "gf_start"}, "to": {"nodeId": "gf_cls"}},
                {"id": "gf_conn_cls_world", "from": {"nodeId": "gf_cls"}, "to": {"nodeId": "gf_world"}},
            ],
            "startNodeId": "gf_start",
            "panOffset": {"x": 0, "y": 0},
            "zoomLevel": 1,
        },
    }
    sm = {
        "id": "statemachine_gold_runner_rules",
        "name": "Gold Runner Rules",
        "type": "statemachine",
        "data": {
            "id": "statemachine_gold_runner_rules",
            "name": "Gold Runner Rules",
            "initialStateId": "state_idle",
            "states": [
                {"id": "state_idle", "name": "Idle", "position": {"x": 40, "y": 120}},
                {"id": "state_walk", "name": "Walking", "position": {"x": 220, "y": 80}},
                {"id": "state_climb", "name": "Climbing", "position": {"x": 220, "y": 180}},
                {"id": "state_dig", "name": "Interacting", "position": {"x": 420, "y": 80}},
                {"id": "state_take", "name": "Take", "position": {"x": 420, "y": 180}},
            ],
            "events": [],
            "transitions": [
                {"id": "tr_idle_walk", "fromStateId": "state_idle", "toStateId": "state_walk", "conditions": {"type": "OR", "conditions": [{"type": "KEY_PRESSED", "params": {"key": "left"}}, {"type": "KEY_PRESSED", "params": {"key": "right"}}]}},
                {"id": "tr_idle_climb", "fromStateId": "state_idle", "toStateId": "state_climb", "conditions": {"type": "AND", "conditions": [{"type": "KEY_PRESSED", "params": {"key": "up"}}, {"type": "VARIABLE_COMPARE", "params": {"variableName": "OnLadder", "operator": "==", "compareValue": 1}}]}},
                {"id": "tr_walk_dig", "fromStateId": "state_walk", "toStateId": "state_dig", "conditions": {"type": "OR", "conditions": [{"type": "KEY_PRESSED", "params": {"key": "space"}}, {"type": "KEY_PRESSED", "params": {"key": "ctrl"}}]}, "actions": [{"type": "BREAK_TILE", "params": {"direction": "down-left", "replacementTileId": "tile_empty"}}, {"type": "WAIT", "params": {"frames": 20}}]},
                {"id": "tr_any_take", "fromStateId": "state_walk", "toStateId": "state_take", "conditions": {"type": "HAS_COLLISION", "params": {"collisionType": "item"}}, "actions": [{"type": "INCREMENT_VARIABLE", "params": {"variableName": "Gold", "amount": 1}}]},
                {"id": "tr_take_idle", "fromStateId": "state_take", "toStateId": "state_idle", "conditions": {"type": "TIME_OUT", "params": {"frames": 1}}},
                {"id": "tr_dig_idle", "fromStateId": "state_dig", "toStateId": "state_idle", "conditions": {"type": "TIME_OUT", "params": {"frames": 20}}},
            ],
        },
    }
    globals_asset = {
        "id": "globals_gold_runner",
        "name": "Gold Runner Globals",
        "type": "globalvariables",
        "data": {
            "customVariables": [
                {"id": "var_gold", "name": "Gold", "type": "byte", "initialValue": 0, "description": "Collected gold count."},
                {"id": "var_lives", "name": "Lives", "type": "byte", "initialValue": 3, "description": "Player lives."},
                {"id": "var_exit", "name": "ExitOpen", "type": "boolean", "initialValue": False, "description": "Exit ladder available after all gold is collected."},
                {"id": "var_on_ladder", "name": "OnLadder", "type": "boolean", "initialValue": False, "description": "Runtime helper set when player overlaps ladder."},
            ]
        },
    }
    tilebank = make_tilebank([asset["id"] for asset in tiles])
    assets = tiles + sprites + component_defs + [runner_tpl, guard_tpl, screen, world, gameflow, sm, globals_asset, {"id": "tilebank_gold_runner", "name": "Gold Runner TileBank", "type": "tilebank", "data": tilebank}]
    return {
        "projectName": PROJECT_NAME,
        "projectVersion": "0.1.0",
        "projectDescription": "Single-screen Lode Runner style Mideas clone: collect gold, climb ladders, use ropes, dig bricks and avoid guards.",
        "currentScreenMode": "SCREEN 2 (Graphics I)",
        "selectedAssetId": "gameflow_gold_runner_main",
        "currentEditor": "GameFlow",
        "assets": assets,
        "tileBanks": [tilebank],
        "gameContract": {
            "playerEntityTemplateId": "tpl_gold_runner_player",
            "initialScreenAssetId": "screen_gold_runner_level_1",
            "worldAssetId": "world_gold_runner",
            "gameFlowAssetId": "gameflow_gold_runner_main",
            "stateMachineAssetId": "statemachine_gold_runner_rules",
            "acceptance": ["collect_all_gold", "avoid_guards", "dig_bricks", "escape_by_exit_ladder"],
        },
    }


def draw_preview(project, out_path):
    screen = next(a for a in project["assets"] if a["id"] == "screen_gold_runner_level_1")["data"]
    tiles = {a["id"]: a["data"]["data"] for a in project["assets"] if a["type"] == "tile"}
    sprites = {a["id"]: a["data"]["frames"][0]["data"] for a in project["assets"] if a["type"] == "sprite"}
    scale = 2
    img = Image.new("RGB", (32 * 8 * scale, 24 * 8 * scale), MSX["dark_blue"])
    draw = ImageDraw.Draw(img)
    for placed in screen["layers"]["background"]["tiles"]:
        px, py = placed["x"] * 8 * scale, placed["y"] * 8 * scale
        for y, row in enumerate(tiles[placed["tileId"]]):
            for x, color in enumerate(row):
                if color != MSX["black"]:
                    draw.rectangle([px + x * scale, py + y * scale, px + (x + 1) * scale - 1, py + (y + 1) * scale - 1], fill=color)
    for ent in screen["layers"]["entities"]:
        sprite_id = "sprite_runner" if ent["entityTemplateId"] == "tpl_gold_runner_player" else "sprite_guard"
        sx, sy = ent["position"]["x"] * 8 * scale, ent["position"]["y"] * 8 * scale - 8 * scale
        for y, row in enumerate(sprites[sprite_id]):
            for x, color in enumerate(row):
                if color != MSX["transparent"]:
                    draw.rectangle([sx + x * scale, sy + y * scale, sx + (x + 1) * scale - 1, sy + (y + 1) * scale - 1], fill=color)
    draw.rectangle([0, 0, img.width - 1, 15], fill=MSX["black"])
    try:
        font = ImageFont.truetype("consola.ttf", 12)
    except Exception:
        font = ImageFont.load_default()
    draw.text((8, 2), "GOLD RUNNER   GOLD 0/8   LIVES 3", fill=MSX["white"], font=font)
    img.save(out_path)


def validate(project):
    assets = {a["id"]: a for a in project["assets"]}
    required = [
        "tpl_gold_runner_player",
        "screen_gold_runner_level_1",
        "world_gold_runner",
        "gameflow_gold_runner_main",
        "statemachine_gold_runner_rules",
        "globals_gold_runner",
        "tilebank_gold_runner",
    ]
    missing = [item for item in required if item not in assets]
    screen = assets["screen_gold_runner_level_1"]["data"]
    checks = {
        "required_assets_present": not missing,
        "player_entity_instance_present": any(e["entityTemplateId"] == "tpl_gold_runner_player" for e in screen["layers"]["entities"]),
        "guards_present": sum(1 for e in screen["layers"]["entities"] if e["entityTemplateId"] == "tpl_gold_runner_guard") >= 2,
        "gold_tiles_present": sum(1 for t in screen["layers"]["background"]["tiles"] if t["tileId"] == "tile_gold") >= 8,
        "world_starts_at_screen": assets["world_gold_runner"]["data"]["startScreenNodeId"] == "wmnode_gold_runner_start",
        "gameflow_links_world": any(n.get("worldAssetId") == "world_gold_runner" for n in assets["gameflow_gold_runner_main"]["data"]["nodes"]),
        "state_machine_has_transitions": len(assets["statemachine_gold_runner_rules"]["data"]["transitions"]) >= 5,
        "custom_loderunner_components_present": all(cid in assets for cid in ["comp_ladder_climb", "comp_rope_traverse", "comp_dig_brick", "comp_gold_goal", "comp_guard_ai"]),
    }
    return checks, missing


def write_report(project_path, screenshot_path, checks, missing, out_path):
    lines = [
        "# Gold Runner - validation report",
        "",
        "Date: 2026-05-22",
        "",
        "## Deliverables",
        f"- Project JSON: `{project_path}`",
        f"- Preview screenshot: `{screenshot_path}`",
        "",
        "## Contract status",
    ]
    for name, ok in checks.items():
        lines.append(f"- {'PASS' if ok else 'FAIL'}: {name}")
    if missing:
        lines.append(f"- Missing: {', '.join(missing)}")
    lines.extend([
        "",
        "## Implemented loop",
        "- Player starts at lower-left.",
        "- Objective is to collect 8 gold tiles.",
        "- Ladders and ropes define vertical and hanging traversal paths.",
        "- Diggable bricks and trap bricks are marked with logical properties and a Dig Brick component.",
        "- Two guard entities are placed as patrol/chase pressure.",
        "- Exit ladder tile and ExitOpen global are wired for level completion.",
        "",
        "## Components created for this game",
        "- Ladder Climb",
        "- Rope Traverse",
        "- Dig Brick",
        "- Gold Goal",
        "- Guard AI",
        "",
        "## Known limitation",
        "This delivery creates the Mideas project contract, assets, state machine, world and visual proof. It does not patch the Mideas ASM/runtime systems to make the new custom components executable in ROM yet.",
        "",
    ])
    out_path.write_text("\n".join(lines), encoding="utf-8")


def main():
    SCREENSHOTS.mkdir(parents=True, exist_ok=True)
    DOWNLOADS.mkdir(parents=True, exist_ok=True)
    project = build_project()
    checks, missing = validate(project)

    repo_project = ROOT / "json" / JSON_NAME
    downloads_project = DOWNLOADS / JSON_NAME
    screenshot = SCREENSHOTS / PNG_NAME
    report = DOWNLOADS / REPORT_NAME

    for path in [repo_project, downloads_project]:
        path.write_text(json.dumps(project, indent=2), encoding="utf-8")
    draw_preview(project, screenshot)
    write_report(downloads_project, screenshot, checks, missing, report)

    print(json.dumps({
        "project": str(downloads_project),
        "repoProject": str(repo_project),
        "screenshot": str(screenshot),
        "report": str(report),
        "checks": checks,
        "missing": missing,
    }, indent=2))

    if missing or not all(checks.values()):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
