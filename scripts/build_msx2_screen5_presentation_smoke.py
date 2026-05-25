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


def write_terminal_transition_fixture(source: Path, destination: Path, effect: str, duration_frames: int) -> Path:
    data = json.loads(source.read_text(encoding="utf-8"))
    flows = [asset for asset in data.get("assets", []) if asset.get("type") == "msx2gameflow"]
    if not flows:
        raise RuntimeError(f"Cannot inject terminal Transition because fixture has no MSX2 GameFlow asset: {source}")

    flow_asset = next((asset for asset in flows if asset.get("name") == "Main MSX2"), flows[0])
    flow_data = flow_asset.get("data") or {}
    nodes = flow_data.get("nodes") or []
    connections = flow_data.get("connections") or []
    screen5_node = next((node for node in nodes if node.get("type") == "Screen5Presentation"), None)
    end_node = next((node for node in nodes if node.get("type") == "End"), None)
    if screen5_node is None or end_node is None:
        raise RuntimeError("Cannot inject terminal Transition without Screen5Presentation and End nodes")

    screen5_id = screen5_node.get("id")
    end_id = end_node.get("id")
    transition_id = f"{screen5_id}_terminal_transition"
    transition_node = next((node for node in nodes if node.get("id") == transition_id), None)
    if transition_node is None:
        transition_node = {
            "id": transition_id,
            "type": "Transition",
            "position": {"x": (screen5_node.get("position") or {}).get("x", 300) + 230, "y": (screen5_node.get("position") or {}).get("y", 110)},
        }
        nodes.append(transition_node)
    transition_node["effect"] = effect
    transition_node["durationFrames"] = max(0, min(255, int(duration_frames)))
    screen5_node["waitForKey"] = False
    screen5_node["waitFrames"] = 5

    flow_data["connections"] = [
        connection for connection in connections
        if (connection.get("from") or {}).get("nodeId") not in (screen5_id, transition_id)
    ]
    flow_data["connections"].extend([
        {"id": f"{screen5_id}_to_terminal_transition", "from": {"nodeId": screen5_id}, "to": {"nodeId": transition_id}},
        {"id": f"{transition_id}_to_end", "from": {"nodeId": transition_id}, "to": {"nodeId": end_id}},
    ])
    destination.write_text(json.dumps(data, indent=2), encoding="utf-8")
    return destination


def write_invalid_strict_shape_fixture(source: Path, destination: Path) -> Path:
    data = json.loads(source.read_text(encoding="utf-8"))
    presentation_asset = next((asset for asset in data.get("assets", []) if asset.get("type") == "msx2presentation"), None)
    if presentation_asset is None:
        raise RuntimeError(f"Cannot create invalid MSX2 GameFlow fixture without an msx2presentation asset: {source}")

    flow_id = "msx2_strict_shape_rejection_flow"
    start_id = f"{flow_id}_start"
    transition_id = f"{flow_id}_transition_before_screen5"
    screen5_id = f"{flow_id}_screen5"
    end_id = f"{flow_id}_end"
    assets = [asset for asset in data.get("assets", []) if asset.get("type") != "msx2gameflow"]
    assets.append({
        "id": flow_id,
        "name": "Invalid Strict Shape MSX2",
        "type": "msx2gameflow",
        "data": {
            "id": flow_id,
            "name": "Invalid Strict Shape MSX2",
            "target": "MSX2",
            "nodes": [
                {"id": start_id, "type": "Start", "position": {"x": 70, "y": 110}},
                {"id": transition_id, "type": "Transition", "position": {"x": 300, "y": 110}, "effect": "fade_to_black", "durationFrames": 30},
                {
                    "id": screen5_id,
                    "type": "Screen5Presentation",
                    "position": {"x": 530, "y": 110},
                    "presentationAssetId": presentation_asset.get("id"),
                    "waitForKey": True,
                    "waitFrames": 0,
                },
                {"id": end_id, "type": "End", "position": {"x": 760, "y": 110}},
            ],
            "connections": [
                {"id": f"{flow_id}_conn_start_transition", "from": {"nodeId": start_id}, "to": {"nodeId": transition_id}},
                {"id": f"{flow_id}_conn_transition_screen5", "from": {"nodeId": transition_id}, "to": {"nodeId": screen5_id}},
                {"id": f"{flow_id}_conn_screen5_end", "from": {"nodeId": screen5_id}, "to": {"nodeId": end_id}},
            ],
            "startNodeId": start_id,
            "panOffset": {"x": 0, "y": 0},
            "zoomLevel": 1,
        },
    })
    data["assets"] = assets
    data["selectedAssetId"] = flow_id
    data["currentEditor"] = "Msx2GameFlow"
    destination.write_text(json.dumps(data, indent=2), encoding="utf-8")
    return destination


def write_invalid_terminal_transition_fixture(source: Path, destination: Path) -> Path:
    data = json.loads(source.read_text(encoding="utf-8"))
    presentation_asset = next((asset for asset in data.get("assets", []) if asset.get("type") == "msx2presentation"), None)
    if presentation_asset is None:
        raise RuntimeError(f"Cannot create invalid terminal Transition fixture without an msx2presentation asset: {source}")

    flow_id = "msx2_terminal_transition_rejection_flow"
    start_id = f"{flow_id}_start"
    screen5_id = f"{flow_id}_screen5"
    transition_id = f"{flow_id}_transition_without_end"
    assets = [asset for asset in data.get("assets", []) if asset.get("type") != "msx2gameflow"]
    assets.append({
        "id": flow_id,
        "name": "Invalid Terminal Transition MSX2",
        "type": "msx2gameflow",
        "data": {
            "id": flow_id,
            "name": "Invalid Terminal Transition MSX2",
            "target": "MSX2",
            "nodes": [
                {"id": start_id, "type": "Start", "position": {"x": 70, "y": 110}},
                {
                    "id": screen5_id,
                    "type": "Screen5Presentation",
                    "position": {"x": 300, "y": 110},
                    "presentationAssetId": presentation_asset.get("id"),
                    "waitForKey": True,
                    "waitFrames": 0,
                },
                {"id": transition_id, "type": "Transition", "position": {"x": 530, "y": 110}, "effect": "fade_to_black", "durationFrames": 30},
            ],
            "connections": [
                {"id": f"{flow_id}_conn_start_screen5", "from": {"nodeId": start_id}, "to": {"nodeId": screen5_id}},
                {"id": f"{flow_id}_conn_screen5_transition", "from": {"nodeId": screen5_id}, "to": {"nodeId": transition_id}},
                {"id": f"{flow_id}_conn_transition_start", "from": {"nodeId": transition_id}, "to": {"nodeId": start_id}},
            ],
            "startNodeId": start_id,
            "panOffset": {"x": 0, "y": 0},
            "zoomLevel": 1,
        },
    })
    data["assets"] = assets
    data["selectedAssetId"] = flow_id
    data["currentEditor"] = "Msx2GameFlow"
    destination.write_text(json.dumps(data, indent=2), encoding="utf-8")
    return destination


def assert_build_rejects_fixture(
    fixture: Path,
    out_dir: Path,
    args: argparse.Namespace,
    project_root: Path,
    suffix: str,
    expected_error: str,
) -> None:
    asm_output = out_dir / f"{Path(args.project_name).stem}_{suffix}.asm"
    rom_output = out_dir / f"{Path(args.project_name).stem}_{suffix}.rom"
    sym_output = out_dir / f"{Path(args.project_name).stem}_{suffix}.sym"
    cmd = [
        sys.executable,
        "scripts/build_mideas_unified_rom.py",
        "--json", str(fixture),
        "--project-root", str(project_root),
        "--project-name", f"{args.project_name}_{suffix}",
        "--asm-output", str(asm_output),
        "--rom-output", str(rom_output),
        "--sym-output", str(sym_output),
        "--rom-mode", "simple32k",
        "--target-format", "konami",
        "--execution-mode", "gameLoopHalt",
    ]
    print("Running expected-failure strict shape check:", " ".join(str(part) for part in cmd))
    completed = subprocess.run(cmd, cwd=str(project_root), capture_output=True, timeout=180)
    output = "\n".join([
        completed.stdout.decode("utf-8", errors="replace"),
        completed.stderr.decode("utf-8", errors="replace"),
    ])
    if completed.returncode == 0:
        raise RuntimeError(f"Invalid MSX2 GameFlow fixture compiled successfully; expected rejection: {fixture}")
    if expected_error not in output:
        raise RuntimeError(f"Invalid MSX2 GameFlow rejection did not include expected error: {expected_error}")


def assert_strict_shape_rejection(source: Path, out_dir: Path, args: argparse.Namespace, project_root: Path) -> None:
    invalid_fixture = write_invalid_strict_shape_fixture(
        source,
        out_dir / f"{Path(args.project_name).stem}_invalid_strict_shape_fixture.json",
    )
    assert_build_rejects_fixture(
        invalid_fixture,
        out_dir,
        args,
        project_root,
        "invalid_strict_shape",
        "MSX2 GameFlow must reach Screen5Presentation from Start through optional Waypoint nodes",
    )
    invalid_terminal_fixture = write_invalid_terminal_transition_fixture(
        source,
        out_dir / f"{Path(args.project_name).stem}_invalid_terminal_transition_fixture.json",
    )
    assert_build_rejects_fixture(
        invalid_terminal_fixture,
        out_dir,
        args,
        project_root,
        "invalid_terminal_transition",
        "MSX2 GameFlow Transition node",
    )
    print("Strict shape rejection OK")


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

    def next_node_after_optional_waypoints(node_id: str | None) -> dict | None:
        connection = next((item for item in connections if (item.get("from") or {}).get("nodeId") == node_id), None)
        next_node_id = (connection.get("to") or {}).get("nodeId") if connection else None
        next_node = node_by_id.get(next_node_id) if next_node_id else None
        visited: set[str] = set()
        while next_node and next_node.get("type") == "Waypoint" and next_node.get("id") not in visited:
            visited.add(next_node.get("id"))
            connection = next((item for item in connections if (item.get("from") or {}).get("nodeId") == next_node.get("id")), None)
            next_node_id = (connection.get("to") or {}).get("nodeId") if connection else None
            next_node = node_by_id.get(next_node_id) if next_node_id else None
        return next_node

    screen5_node = next_node_after_optional_waypoints(start_node_id)
    if screen5_node is None:
        raise RuntimeError(f"MSX2 GameFlow fixture has no Screen5Presentation node: {path}")
    if screen5_node.get("type") != "Screen5Presentation":
        raise RuntimeError(
            f"MSX2 GameFlow fixture must reach Screen5Presentation from Start through optional Waypoint nodes for SCREEN 5 backend: {path}"
        )

    next_node = next_node_after_optional_waypoints(screen5_node.get("id"))
    if next_node is None:
        raise RuntimeError(f"MSX2 GameFlow Screen5Presentation node must continue to End, Restart, or terminal Transition: {path}")
    pre_text_transition_node = None
    transition_node = None
    terminal_action = "loop"
    if next_node.get("type") == "Transition":
        node_after_transition = next_node_after_optional_waypoints(next_node.get("id"))
        if node_after_transition and node_after_transition.get("type") == "Text":
            pre_text_transition_node = next_node
            next_node = node_after_transition
        elif node_after_transition is not None and node_after_transition.get("type") not in {"End", "Restart"}:
            raise RuntimeError(f"MSX2 GameFlow Transition node cannot continue to {node_after_transition.get('type')} in SCREEN 5 backend; use Text, End, or Restart: {path}")
        else:
            terminal_action = "restart" if node_after_transition and node_after_transition.get("type") == "Restart" else "loop"
            transition_node = next_node
    if next_node.get("type") == "Text":
        after_text_node = next_node_after_optional_waypoints(next_node.get("id"))
        if after_text_node and after_text_node.get("type") == "Transition":
            node_after_transition = next_node_after_optional_waypoints(after_text_node.get("id"))
            if node_after_transition is not None and node_after_transition.get("type") not in {"End", "Restart"}:
                raise RuntimeError(f"MSX2 GameFlow Transition node cannot continue to {node_after_transition.get('type')} in SCREEN 5 backend; use Text, End, or Restart: {path}")
            terminal_action = "restart" if node_after_transition and node_after_transition.get("type") == "Restart" else "loop"
            transition_node = after_text_node
        elif after_text_node and after_text_node.get("type") == "Restart":
            terminal_action = "restart"
        elif after_text_node is not None and after_text_node.get("type") != "End":
            raise RuntimeError(f"MSX2 GameFlow Text node cannot continue to {after_text_node.get('type')} in SCREEN 5 backend: {path}")
    elif transition_node is not None:
        pass
    elif next_node.get("type") == "Transition":
        node_after_transition = next_node_after_optional_waypoints(next_node.get("id"))
        if node_after_transition is not None and node_after_transition.get("type") not in {"End", "Restart"}:
            raise RuntimeError(f"MSX2 GameFlow Transition node cannot continue to {node_after_transition.get('type')} in SCREEN 5 backend; use Text, End, or Restart: {path}")
        terminal_action = "restart" if node_after_transition and node_after_transition.get("type") == "Restart" else "loop"
        transition_node = next_node
    elif next_node.get("type") == "Restart":
        terminal_action = "restart"
    elif next_node.get("type") != "End":
        raise RuntimeError(
            f"MSX2 GameFlow Screen5Presentation node cannot continue to {next_node.get('type')} in SCREEN 5 backend: {path}"
        )

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
        "wait_for_key": screen5_node.get("waitForKey"),
        "wait_frames": screen5_node.get("waitFrames"),
        "pre_text_transition_id": pre_text_transition_node.get("id") if pre_text_transition_node else "none",
        "transition_id": transition_node.get("id") if transition_node else "none",
        "terminal_action": terminal_action,
        "transition_effect": transition_node.get("effect") if transition_node else "none",
        "transition_duration_frames": transition_node.get("durationFrames") if transition_node else 0,
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
        "; MSX2_GAMEFLOW_INITIAL_GLOBALS:",
        "; MSX2_GAMEFLOW_AFTER_PRESENTATION_GLOBALS:",
        "; MSX2_GAMEFLOW_AFTER_PRE_TEXT_TRANSITION_GLOBALS:",
        "; MSX2_GAMEFLOW_AFTER_TRANSITION_GLOBALS:",
        f"; MSX2_GAMEFLOW_PRE_TEXT_TRANSITION: {contract['pre_text_transition_id']}",
        f"; MSX2_GAMEFLOW_NEXT_TRANSITION: {contract['transition_id']}",
        f"; MSX2_GAMEFLOW_TERMINAL_ACTION: {contract['terminal_action']}",
        f"; MSX2_GAMEFLOW_TRANSITION_EFFECT: {contract['transition_effect']}",
        f"; MSX2_GAMEFLOW_TRANSITION_DURATION_FRAMES: {contract['transition_duration_frames']}",
    ]
    for needle in required:
        if needle not in text:
            raise RuntimeError(f"Generated ASM is missing MSX2 GameFlow contract marker: {needle}")

    if contract.get("wait_for_key") is False:
        wait_frames = int(contract.get("wait_frames") or 0)
        expected = f"    ld b, #{wait_frames:02X}"
        for needle in [expected, ".frame_wait:", "    halt", "    djnz .frame_wait"]:
            if needle not in text:
                raise RuntimeError(f"Generated ASM is missing MSX2 GameFlow wait-frame override code: {needle}")
        if "    call CHGET" in text:
            raise RuntimeError("Generated ASM still waits for CHGET even though the GameFlow node disabled waitForKey")

    if contract.get("transition_id") != "none":
        required_transition_code = [
            "jp msx2_gameflow_run_transition",
            "msx2_gameflow_run_transition:",
        ]
        if contract.get("terminal_action") == "restart":
            required_transition_code.append("jp init_rom")
        else:
            required_transition_code.extend([".gameflow_end_loop:", "jp .gameflow_end_loop"])
        if contract.get("transition_effect") == "fade_to_black":
            required_transition_code.extend(["call load_screen5_black_palette", "screen5_black_palette_data"])
        if contract.get("transition_effect") == "cls":
            required_transition_code.extend(["call DISSCR", "call clear_screen5_visible_vram", "call FILVRM"])
        duration_frames = int(contract.get("transition_duration_frames") or 0)
        if duration_frames > 0:
            required_transition_code.extend([f"ld b, #{duration_frames:02X}", ".transition_wait:", "djnz .transition_wait"])
        for needle in required_transition_code:
            if needle not in text:
                raise RuntimeError(f"Generated ASM is missing MSX2 GameFlow terminal transition code: {needle}")


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
    parser.add_argument("--inject-terminal-transition", action="store_true", help="Inject Screen5Presentation -> Transition -> End into a temp fixture before compiling")
    parser.add_argument("--transition-effect", choices=["fade_to_black", "cls"], default="fade_to_black", help="Effect used with --inject-terminal-transition")
    parser.add_argument("--transition-duration-frames", type=int, default=29, help="Duration used with --inject-terminal-transition")
    parser.add_argument("--assert-strict-shape-rejection", action="store_true", help="Also verify that Transition -> unsupported node is rejected")
    args = parser.parse_args()

    project_root = Path(args.project_root).resolve()
    if not (project_root / "package.json").exists():
        project_root = repo_root_from_script()

    fixture = Path(args.fixture).resolve() if args.fixture else project_root / "test" / "msx2-screen5-presentation" / "presentation_screen5_project.json"
    out_dir = Path(args.out_dir).resolve() if args.out_dir else project_root / "test" / "msx2-screen5-presentation" / "out"
    out_dir.mkdir(parents=True, exist_ok=True)
    output_stem = Path(args.project_name).stem
    if args.inject_terminal_transition:
        fixture = write_terminal_transition_fixture(
            fixture,
            out_dir / f"{output_stem}_terminal_transition_fixture.json",
            args.transition_effect,
            args.transition_duration_frames,
        )
    if args.assert_strict_shape_rejection:
        assert_strict_shape_rejection(fixture, out_dir, args, project_root)
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
