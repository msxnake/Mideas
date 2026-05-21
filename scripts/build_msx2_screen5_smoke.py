#!/usr/bin/env python3
import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


SCREEN5_MODE = "SCREEN 5 (Graphics III)"
BACKEND = "msx2-screen5-bitmap"
ROM_BLOCK_SIZE = 8192


def repo_root_from_script() -> Path:
    return Path(__file__).resolve().parents[1]


def run_command(cmd: list[str], cwd: Path, allow_failure: bool = False, timeout: float | None = None) -> subprocess.CompletedProcess:
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
    if completed.returncode != 0 and not allow_failure:
        raise RuntimeError(f"Command failed ({completed.returncode}): {' '.join(str(part) for part in cmd)}")
    return completed


def ensure_minimal_screen_layers(project_path: Path) -> None:
    project = json.loads(project_path.read_text(encoding="utf-8"))
    changed = False
    assets = project.get("assets", [])
    screen_asset = next((asset for asset in assets if asset.get("type") == "screenmap"), None)
    if not screen_asset:
        raise RuntimeError(f"No screenmap asset found in {project_path}")

    screen = screen_asset.setdefault("data", {})
    width = int(screen.get("width", 32))
    height = int(screen.get("height", 27))
    layers = screen.setdefault("layers", {})

    if width != 32 or height != 27:
        raise RuntimeError(f"Expected 32x27 SCREEN 5 smoke screen, got {width}x{height}")

    blue = "tile_screen5_blue_grid"
    red = "tile_screen5_red_marker"
    expected_background = [
        [
            {
                "tileId": red if (x in (4, 5, 26, 27) or y in (3, 4, 22, 23) or (10 <= x <= 21 and 11 <= y <= 15)) else blue,
                "subTileX": 0,
                "subTileY": 0,
            }
            for x in range(width)
        ]
        for y in range(height)
    ]
    expected_empty = [[{"tileId": None, "subTileX": 0, "subTileY": 0} for _ in range(width)] for _ in range(height)]

    if layers.get("background") != expected_background:
        layers["background"] = expected_background
        changed = True
    for layer_name in ("collision", "effects"):
        if layers.get(layer_name) != expected_empty:
            layers[layer_name] = expected_empty
            changed = True
    if layers.get("entities") != []:
        layers["entities"] = []
        changed = True

    if changed:
        project_path.write_text(json.dumps(project, indent=2) + "\n", encoding="utf-8")
        print(f"Normalized 32x27 screen layers in {project_path}")


def compile_generator(project_root: Path, ts_build_dir: Path, strict_tsc: bool) -> Path:
    generator_ts = project_root / "utils" / "msxGenerator" / "index.ts"
    if not generator_ts.exists():
        raise FileNotFoundError(f"Missing generator source: {generator_ts}")

    ts_build_dir.mkdir(parents=True, exist_ok=True)
    npx_exec = shutil.which("npx.cmd") or shutil.which("npx") or "npx"
    cmd = [
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
    result = run_command(cmd, cwd=project_root, allow_failure=True)
    if strict_tsc and result.returncode != 0:
        raise RuntimeError("TypeScript compilation failed in strict mode.")

    compiled_index = ts_build_dir / "utils" / "msxGenerator" / "index.js"
    if not compiled_index.exists():
        raise RuntimeError(f"TypeScript compilation did not produce {compiled_index}")
    (ts_build_dir / "package.json").write_text('{"type":"commonjs"}', encoding="utf-8")
    return compiled_index


def generate_asm(project_root: Path, compiled_index: Path, project_json: Path, asm_output: Path) -> None:
    asm_output.parent.mkdir(parents=True, exist_ok=True)
    node_script = r'''
const fs = require("fs");
const generator = require(process.argv[2]);
const jsonPath = process.argv[3];
const asmPath = process.argv[4];
const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const name = raw.name || "msx2_screen5_minimal";
const assets = Array.isArray(raw.assets) ? raw.assets : [];
const screenMode = raw.screenMode || "SCREEN 4 (Graphics II)";
const targetGraphicsBackend = raw.targetGraphicsBackend || "msx2-screen4-pattern";

if (screenMode !== "SCREEN 4 (Graphics II)" && screenMode !== "SCREEN 5 (Graphics III)") {
  throw new Error(`Expected an MSX2 SCREEN 4/legacy SCREEN 5 project, got ${screenMode}`);
}
if (targetGraphicsBackend !== "msx2-screen4-pattern" && targetGraphicsBackend !== "msx2-screen5-bitmap" && targetGraphicsBackend !== "msx2-screen5-tile16") {
  throw new Error(`Expected MSX2 SCREEN 4 backend or legacy MSX2 backend alias, got ${targetGraphicsBackend}`);
}

const files = generator.generateModularASM(name, assets, {
  generateUnified: true,
  romMode: "simple32k",
  targetFormat: "konami",
  executionMode: "gameLoopHalt",
  screenMode,
  targetGraphicsBackend,
});

const asm = files["unitedFiles.asm"] || files["main.asm"];
if (!asm) {
  throw new Error("Generator did not return unitedFiles.asm or main.asm");
}
if (!asm.includes("Mideas MSX2 SCREEN 4 tile backend")) {
  throw new Error("Generated ASM does not look like the MSX2 SCREEN 4 backend output");
}
if (!asm.includes("MSX2 minimal GameFlow")) {
  throw new Error("Generated ASM does not include the MSX2 minimal GameFlow marker");
}
if (!asm.includes("call clear_screen4_names")) {
  throw new Error("Generated ASM does not include the MSX2 cls transition");
}
if (!asm.includes("call wait_key")) {
  throw new Error("Generated ASM does not include the MSX2 Text wait");
}
if ((files["patterns.asm"] || "").includes("intentionally not used") === false) {
  throw new Error("MSX2 backend did not return the SCREEN 2 patterns.asm isolation marker");
}
if ((files["colors.asm"] || "").includes("intentionally not used") === false) {
  throw new Error("MSX2 backend did not return the SCREEN 2 colors.asm isolation marker");
}

const tmpAsmPath = `${asmPath}.tmp`;
fs.writeFileSync(tmpAsmPath, asm, "utf8");
fs.renameSync(tmpAsmPath, asmPath);
console.log(`ASM generated: ${asmPath}`);
console.log(`Project: ${name}`);
console.log(`Assets: ${assets.length}`);
console.log(`Backend: ${targetGraphicsBackend}`);
console.log(`Screen mode: ${screenMode}`);
console.log(`ASM chars: ${asm.length}`);
'''
    with tempfile.NamedTemporaryFile("w", suffix=".cjs", delete=False, encoding="utf-8") as handle:
        handle.write(node_script)
        script_path = Path(handle.name)
    try:
        run_command(["node", str(script_path), str(compiled_index), str(project_json), str(asm_output)], cwd=project_root)
    finally:
        script_path.unlink(missing_ok=True)


def resolve_glass(project_root: Path, explicit: str | None) -> Path:
    if explicit:
        glass = Path(explicit).expanduser().resolve()
    else:
        glass = project_root / "server" / "glass.jar"
    if not glass.exists():
        raise FileNotFoundError(f"glass.jar not found: {glass}")
    return glass


def compile_rom(project_root: Path, glass: Path, asm_output: Path, rom_output: Path, sym_output: Path | None) -> None:
    rom_output.parent.mkdir(parents=True, exist_ok=True)
    rom_output.unlink(missing_ok=True)
    if sym_output:
        sym_output.unlink(missing_ok=True)
    cmd = ["java", "-jar", str(glass), str(asm_output), str(rom_output)]
    if sym_output:
        sym_output.parent.mkdir(parents=True, exist_ok=True)
        cmd.append(str(sym_output))
    run_command(cmd, cwd=project_root)
    size = rom_output.stat().st_size
    padding = (-size) % ROM_BLOCK_SIZE
    if padding:
        with rom_output.open("ab") as handle:
            handle.write(b"\xFF" * padding)
        size = rom_output.stat().st_size
        print(f"Padded ROM with {padding} bytes to {size} bytes")
    if size % ROM_BLOCK_SIZE != 0:
        raise RuntimeError(f"ROM size is not a multiple of 8KB: {size}")
    print(f"ROM ready: {rom_output} ({size} bytes)")


def resolve_openmsx(explicit: str | None) -> str:
    candidates = []
    if explicit:
        candidates.append(Path(explicit).expanduser())
    env_path = shutil.which("openmsx.exe") or shutil.which("openmsx")
    if env_path:
        candidates.append(Path(env_path))
    candidates.extend([
        Path(r"C:\Program Files\openMSX\openmsx.exe"),
        Path(r"C:\Program Files (x86)\openMSX\openmsx.exe"),
        Path(r"C:\openMSX\openmsx.exe"),
    ])
    for candidate in candidates:
        if candidate.exists():
            return str(candidate.resolve())
    raise FileNotFoundError("OpenMSX executable not found. Use --openmsx.")


def capture_openmsx(project_root: Path, openmsx: str, rom_output: Path, screenshot_output: Path, machine: str, wait_ms: int, timeout: float) -> None:
    screenshot_output.parent.mkdir(parents=True, exist_ok=True)
    if screenshot_output.exists():
        screenshot_output.unlink()
    if os.name == "nt":
        subprocess.run(
            ["powershell", "-NoProfile", "-Command", "Get-Process openmsx -ErrorAction SilentlyContinue | Stop-Process -Force"],
            cwd=str(project_root),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )

    tcl = f'''
proc do_capture {{}} {{
    set out [file normalize {{{str(screenshot_output)}}}]
    if {{[catch {{screenshot $out}} err]}} {{
        puts "SCREENSHOT_ERROR $err"
    }} else {{
        puts "SCREENSHOT_OK $out"
    }}
    after time 0.5 {{ exit }}
}}
after time {wait_ms / 1000:.3f} do_capture
'''
    with tempfile.NamedTemporaryFile("w", suffix=".tcl", delete=False, encoding="utf-8") as handle:
        handle.write(tcl)
        tcl_path = Path(handle.name)
    try:
        cmd = [openmsx, "-machine", machine, "-cart", str(rom_output), "-script", str(tcl_path)]
        print("Running:", " ".join(str(part) for part in cmd))
        process = subprocess.Popen(cmd, cwd=str(project_root), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        try:
            exit_code = process.wait(timeout=timeout)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=5)
            if screenshot_output.exists():
                print(f"OpenMSX timed out after {timeout} seconds after producing the screenshot; process was killed")
                exit_code = None
            else:
                raise RuntimeError(f"OpenMSX timed out after {timeout} seconds")
        if exit_code not in (0, None):
            print(f"OpenMSX exited with code {exit_code}; checking screenshot output")
    finally:
        tcl_path.unlink(missing_ok=True)

    if not screenshot_output.exists():
        raise RuntimeError(f"OpenMSX did not produce screenshot: {screenshot_output}")
    print(f"Screenshot ready: {screenshot_output}")


def parse_args() -> argparse.Namespace:
    project_root = repo_root_from_script()
    default_out = project_root / "test" / "msx2-screen5" / "out"
    parser = argparse.ArgumentParser(description="Build and optionally capture the minimal Mideas MSX2 SCREEN 5 smoke ROM.")
    parser.add_argument("--project-root", default=str(project_root), help="Mideas repository root")
    parser.add_argument("--json", default=str(project_root / "test" / "msx2-screen5" / "minimal-screen5-project.json"), help="Mideas JSON fixture")
    parser.add_argument("--asm-output", default=str(default_out / "minimal-screen5.asm"), help="Output ASM path")
    parser.add_argument("--rom-output", default=str(default_out / "minimal-screen5.rom"), help="Output ROM path")
    parser.add_argument("--sym-output", default=str(default_out / "minimal-screen5.sym"), help="Output Glass symbols path")
    parser.add_argument("--screenshot-output", default=str(default_out / "minimal-screen5.png"), help="Output OpenMSX screenshot path")
    parser.add_argument("--ts-build-dir", default=str(project_root / "server" / "temp" / "tsbuild_msx2_screen5_smoke"), help="Temporary TypeScript build directory")
    parser.add_argument("--glass", help="Explicit path to glass.jar")
    parser.add_argument("--openmsx", help="Explicit path to openmsx.exe")
    parser.add_argument("--machine", default="C-BIOS_MSX2", help="OpenMSX machine id")
    parser.add_argument("--wait-ms", type=int, default=6000, help="Delay before screenshot")
    parser.add_argument("--openmsx-timeout", type=float, default=25.0, help="OpenMSX process timeout in seconds")
    parser.add_argument("--strict-tsc", action="store_true", help="Fail when TypeScript reports diagnostics")
    parser.add_argument("--skip-openmsx", action="store_true", help="Build ASM/ROM only")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    project_root = Path(args.project_root).expanduser().resolve()
    project_json = Path(args.json).expanduser().resolve()
    asm_output = Path(args.asm_output).expanduser().resolve()
    rom_output = Path(args.rom_output).expanduser().resolve()
    sym_output = Path(args.sym_output).expanduser().resolve() if args.sym_output else None
    screenshot_output = Path(args.screenshot_output).expanduser().resolve()
    ts_build_dir = Path(args.ts_build_dir).expanduser().resolve()

    ensure_minimal_screen_layers(project_json)
    compiled_index = compile_generator(project_root, ts_build_dir, args.strict_tsc)
    generate_asm(project_root, compiled_index, project_json, asm_output)
    compile_rom(project_root, resolve_glass(project_root, args.glass), asm_output, rom_output, sym_output)

    if args.skip_openmsx:
        print("OpenMSX capture skipped by --skip-openmsx")
        print(f"To capture later: python scripts/build_msx2_screen5_smoke.py --json {project_json} --rom-output {rom_output} --screenshot-output {screenshot_output}")
        return

    openmsx = resolve_openmsx(args.openmsx)
    capture_openmsx(project_root, openmsx, rom_output, screenshot_output, args.machine, args.wait_ms, args.openmsx_timeout)


if __name__ == "__main__":
    main()
