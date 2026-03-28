#!/usr/bin/env python3
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Generate unifiedFiles.asm from a Mideas JSON project, compile with glass.jar, "
            "and pad ROM size to a multiple of 8KB."
        )
    )
    parser.add_argument("--json", required=True, help="Path to Mideas project JSON")
    parser.add_argument("--project-root", default=".", help="Mideas repository root")
    parser.add_argument("--project-name", help="Override project name")
    parser.add_argument("--asm-output", help="Output .asm path (default: server/temp/<name>.asm)")
    parser.add_argument("--rom-output", help="Output .rom path (default: server/temp/<name>.rom)")
    parser.add_argument("--sym-output", help="Optional Glass symbols output path")
    parser.add_argument("--glass", help="Explicit path to glass.jar")
    parser.add_argument(
        "--ts-build-dir",
        help="Directory for temporary compiled generator JS (default: server/temp/tsbuild_skill)",
    )
    parser.add_argument(
        "--skip-ts-build",
        action="store_true",
        help="Skip TypeScript compilation and reuse existing generated JS",
    )
    parser.add_argument(
        "--strict-tsc",
        action="store_true",
        help="Fail if tsc returns non-zero",
    )
    parser.add_argument(
        "--rom-mode",
        choices=["auto", "simple32k", "plain48k", "megarom"],
        default="simple32k",
        help="ROM mode passed to utils/msxGenerator (default: simple32k; plain48k is experimental)",
    )
    parser.add_argument(
        "--target-format",
        choices=["konami", "ascii8", "ascii16"],
        default="konami",
        help="Mapper target passed to utils/msxGenerator (default: konami)",
    )
    parser.add_argument(
        "--execution-mode",
        choices=["gameLoopHalt", "interruptTaskManager"],
        default="interruptTaskManager",
        help="Engine execution mode passed to utils/msxGenerator (default: interruptTaskManager)",
    )
    parser.add_argument(
        "--auto-megarom",
        action="store_true",
        help="Enable autoMegaROM in generator config",
    )
    parser.add_argument(
        "--run-openmsx",
        action="store_true",
        help="Launch OpenMSX with generated ROM",
    )
    parser.add_argument("--openmsx-path", help="Explicit openmsx executable path")
    parser.add_argument(
        "--post-asm-opt",
        action="store_true",
        help="Run scripts/post_asm_optimize.py after generating ASM and before Glass compilation",
    )
    parser.add_argument(
        "--post-asm-check-only",
        action="store_true",
        help="Run the post-ASM optimizer in analysis mode only; compile the original ASM",
    )
    parser.add_argument(
        "--post-asm-rules",
        help="Optional comma-separated rule ids for post_asm_optimize.py",
    )
    parser.add_argument(
        "--post-asm-output",
        help="Explicit optimized ASM output path (default: <asm>.optimized.asm)",
    )
    return parser.parse_args()


def run_command(cmd: list[str], cwd: Path, allow_failure: bool = False) -> subprocess.CompletedProcess:
    print("Running:", " ".join(str(c) for c in cmd))
    completed = subprocess.run(
        cmd,
        cwd=str(cwd),
        capture_output=True,
    )

    def decode_stream(raw: bytes) -> str:
        if not raw:
            return ""
        try:
            return raw.decode("utf-8")
        except UnicodeDecodeError:
            return raw.decode("cp1252", errors="replace")

    stdout_text = decode_stream(completed.stdout)
    stderr_text = decode_stream(completed.stderr)

    def safe_write(text: str, is_err: bool = False) -> None:
        stream = sys.stderr if is_err else sys.stdout
        encoding = stream.encoding or "utf-8"
        stream.buffer.write((text + "\n").encode(encoding, errors="replace"))
        stream.flush()

    if stdout_text.strip():
        safe_write(stdout_text.strip())
    if stderr_text.strip():
        safe_write(stderr_text.strip(), is_err=True)

    if completed.returncode != 0 and not allow_failure:
        raise RuntimeError(f"Command failed ({completed.returncode}): {' '.join(cmd)}")
    return completed


def resolve_existing(path_str: str, base: Path) -> Path:
    raw = Path(path_str).expanduser()
    candidates = [raw] if raw.is_absolute() else [base / raw, Path.cwd() / raw]
    for candidate in candidates:
        resolved = candidate.resolve()
        if resolved.exists():
            return resolved
    raise FileNotFoundError(f"File not found: {path_str}")


def resolve_glass(explicit: str | None, project_root: Path) -> Path:
    if explicit:
        glass = Path(explicit).expanduser().resolve()
        if not glass.exists():
            raise FileNotFoundError(f"glass.jar not found: {glass}")
        return glass

    candidates = [
        project_root / "server" / "glass.jar",
        project_root / "test" / "glass.jar",
        project_root / "server" / "glass-0.6.jar",
        project_root / "server" / "glass2.jar",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate.resolve()
    raise FileNotFoundError("glass.jar not found in server/ or test/. Use --glass.")


def resolve_openmsx(explicit: str | None) -> str:
    if explicit:
        candidate = Path(explicit).expanduser().resolve()
        if candidate.exists():
            return str(candidate)
        raise FileNotFoundError(f"OpenMSX not found: {candidate}")

    env_path = os.getenv("OPENMSX_PATH")
    if env_path:
        env_candidate = Path(env_path).expanduser().resolve()
        if env_candidate.exists():
            return str(env_candidate)

    default_candidates = [
        Path(r"C:\Program Files\openMSX\openmsx.exe"),
        Path(r"C:\Program Files (x86)\openMSX\openmsx.exe"),
    ]
    for candidate in default_candidates:
        if candidate.exists():
            return str(candidate.resolve())

    which = shutil.which("openmsx")
    if which:
        return which

    raise FileNotFoundError("OpenMSX executable not found. Use --openmsx-path.")


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def pad_rom_to_8kb(rom_path: Path) -> tuple[int, int]:
    rom_data = rom_path.read_bytes()
    original_size = len(rom_data)
    if original_size == 0:
        raise RuntimeError(f"Generated ROM is empty: {rom_path}")

    kb8 = 8192
    padded_size = ((original_size + kb8 - 1) // kb8) * kb8
    if padded_size != original_size:
        rom_data += bytes([0xFF]) * (padded_size - original_size)
        rom_path.write_bytes(rom_data)
    return original_size, padded_size


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
    result = run_command(tsc_cmd, cwd=project_root, allow_failure=True)
    compiled_index = ts_build_dir / "utils" / "msxGenerator" / "index.js"

    if strict_tsc and result.returncode != 0:
        raise RuntimeError("TypeScript compilation failed in strict mode.")
    if not compiled_index.exists():
        raise RuntimeError("TypeScript compilation did not produce utils/msxGenerator/index.js")

    (ts_build_dir / "package.json").write_text('{"type":"commonjs"}', encoding="utf-8")
    return compiled_index


def generate_asm_from_json(
    compiled_index: Path,
    json_path: Path,
    asm_output: Path,
    project_name_override: str | None,
    project_root: Path,
    rom_mode: str,
    target_format: str,
    execution_mode: str,
    auto_megarom: bool,
) -> tuple[str, int]:
    with json_path.open("r", encoding="utf-8") as fh:
        project = json.load(fh)

    project_name = project_name_override or project.get("name") or json_path.stem

    node_script = """
const fs = require("fs");
const generator = require(process.argv[2]);
const jsonPath = process.argv[3];
const asmPath = process.argv[4];
const forcedName = process.argv[5];
const romMode = process.argv[6];
const targetFormat = process.argv[7];
const executionMode = process.argv[8];
const autoMegaROM = process.argv[9] === "true";
const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const name = forcedName || raw.name || "mideas_project";
const assets = Array.isArray(raw.assets) ? [...raw.assets] : [];
const knownAssetIds = new Set(assets.map(a => a && a.id).filter(Boolean));

if (Array.isArray(raw.componentDefinitions)) {
  for (const comp of raw.componentDefinitions) {
    if (!comp || !comp.id || knownAssetIds.has(comp.id)) continue;
    assets.push({
      id: comp.id,
      name: comp.name || comp.id,
      type: "componentdefinition",
      data: comp,
    });
    knownAssetIds.add(comp.id);
  }
}

if (Array.isArray(raw.entityTemplates)) {
  for (const tpl of raw.entityTemplates) {
    if (!tpl || !tpl.id || knownAssetIds.has(tpl.id)) continue;
    assets.push({
      id: tpl.id,
      name: tpl.name || tpl.id,
      type: "entitytemplate",
      data: tpl,
    });
    knownAssetIds.add(tpl.id);
  }
}

if (raw.presentationScreen && raw.presentationScreen.data && Array.isArray(raw.presentationScreen.data.nameTable) && raw.presentationScreen.data.nameTable.length === 768) {
  assets.push({
    id: "system_presentation_screen",
    name: raw.presentationScreen.name || "Presentation Screen",
    type: "presentationscreen",
    data: raw.presentationScreen,
  });
}

const files = generator.generateModularASM(name, assets, {
  generateUnified: true,
  romMode,
  targetFormat,
  executionMode,
  autoMegaROM,
});
const asm = files["unitedFiles.asm"] || files["main.asm"];
if (!asm) {
  throw new Error("Generator did not return unitedFiles.asm or main.asm");
}
fs.writeFileSync(asmPath, asm, "utf8");
console.log(`ASM generated: ${asmPath}`);
console.log(`Project: ${name}`);
console.log(`Assets: ${assets.length}`);
console.log(`ASM chars: ${asm.length}`);
console.log(`ROM config: mode=${romMode}, mapper=${targetFormat}, engine=${executionMode}, autoMegaROM=${autoMegaROM}`);
"""

    with tempfile.NamedTemporaryFile(
        mode="w",
        suffix=".cjs",
        delete=False,
        encoding="utf-8",
    ) as tmp_file:
        tmp_file.write(node_script)
        tmp_script_path = Path(tmp_file.name)

    try:
        run_command(
            [
                "node",
                str(tmp_script_path),
                str(compiled_index),
                str(json_path),
                str(asm_output),
                project_name,
                rom_mode,
                target_format,
                execution_mode,
                "true" if auto_megarom else "false",
            ],
            cwd=project_root,
        )
    finally:
        try:
            tmp_script_path.unlink(missing_ok=True)
        except Exception:
            pass

    asm_chars = len(asm_output.read_text(encoding="utf-8", errors="ignore"))
    return project_name, asm_chars


def compile_with_glass(
    glass_jar: Path,
    asm_output: Path,
    rom_output: Path,
    sym_output: Path | None,
    project_root: Path,
) -> None:
    cmd = ["java", "-jar", str(glass_jar), str(asm_output), str(rom_output)]
    if sym_output:
        cmd.append(str(sym_output))
    run_command(cmd, cwd=project_root)


def ensure_sprite_copy_helper(asm_output: Path) -> None:
    asm_code = asm_output.read_text(encoding="utf-8", errors="ignore")
    if "COPY_SPRITE_SRC_TO_VRAM" not in asm_code:
        return
    if re.search(r"^\s*COPY_SPRITE_SRC_TO_VRAM:\s*$", asm_code, re.MULTILINE):
        return

    helper = """
; ==================================================================
; COPY_SPRITE_SRC_TO_VRAM stub (CLI builder fallback)
; Input: HL=source (ROM), DE=VRAM destination, BC=byte count
; ==================================================================
COPY_SPRITE_SRC_TO_VRAM:
    jp FAST_LDIRVM
"""

    if re.search(r"^\s*end\b.*$", asm_code, re.IGNORECASE | re.MULTILINE):
        asm_code = re.sub(
            r"^\s*end\b.*$",
            f"{helper}\n\nend",
            asm_code,
            count=1,
            flags=re.IGNORECASE | re.MULTILINE,
        )
    else:
        asm_code = f"{asm_code.rstrip()}\n\n{helper}\n"

    asm_output.write_text(asm_code, encoding="utf-8")
    print("Injected COPY_SPRITE_SRC_TO_VRAM fallback stub into ASM output.")


def maybe_run_post_asm_optimizer(
    project_root: Path,
    asm_output: Path,
    glass_jar: Path,
    enabled: bool,
    check_only: bool,
    rules: str | None,
    explicit_output: str | None,
) -> Path:
    if not enabled and not check_only:
        return asm_output

    optimizer = project_root / "scripts" / "post_asm_optimize.py"
    if not optimizer.exists():
        raise FileNotFoundError(f"Post-ASM optimizer not found: {optimizer}")

    output_path = (
        Path(explicit_output).expanduser().resolve()
        if explicit_output
        else asm_output.with_suffix(".optimized.asm")
    )
    cmd = [
        sys.executable,
        str(optimizer),
        "--input",
        str(asm_output),
    ]
    if rules:
        cmd.extend(["--rules", rules])
    if enabled and not check_only:
        cmd.extend(["--apply", "--output", str(output_path)])
        cmd.extend(["--validate-glass", str(glass_jar)])

    run_command(cmd, cwd=project_root)
    if enabled and not check_only:
        return output_path
    return asm_output


def launch_openmsx(
    openmsx_exec: str,
    rom_output: Path,
    project_root: Path,
    rom_mode: str | None = None,
    target_format: str | None = None,
) -> None:
    cmd = [openmsx_exec, "-cart", str(rom_output)]
    if rom_mode == "plain48k":
        cmd.extend(["-romtype", "Plain"])
    elif rom_mode == "megarom":
        mapper_to_romtype = {
            "konami": "konami",
            "ascii8": "ascii8",
            "ascii16": "ascii16",
        }
        romtype = mapper_to_romtype.get((target_format or "").lower())
        if romtype:
            cmd.extend(["-romtype", romtype])
    print("Running:", " ".join(cmd))
    if os.name == "nt":
        creationflags = 0x00000008 | 0x00000200
        proc = subprocess.Popen(cmd, cwd=str(project_root), creationflags=creationflags, close_fds=True)
    else:
        proc = subprocess.Popen(cmd, cwd=str(project_root), close_fds=True)
    print(f"OpenMSX launched (pid={proc.pid}).")


def main() -> int:
    args = parse_args()
    project_root = Path(args.project_root).expanduser().resolve()
    json_path = resolve_existing(args.json, project_root)

    with json_path.open("r", encoding="utf-8") as fh:
        inferred_name = json.load(fh).get("name") or json_path.stem

    asm_output = (
        Path(args.asm_output).expanduser().resolve()
        if args.asm_output
        else (project_root / "server" / "temp" / f"{inferred_name}_unified.asm").resolve()
    )
    rom_output = (
        Path(args.rom_output).expanduser().resolve()
        if args.rom_output
        else (project_root / "server" / "temp" / f"{inferred_name}_unified.rom").resolve()
    )
    sym_output = Path(args.sym_output).expanduser().resolve() if args.sym_output else None

    ensure_parent(asm_output)
    ensure_parent(rom_output)
    if sym_output:
        ensure_parent(sym_output)

    ts_build_dir = (
        Path(args.ts_build_dir).expanduser().resolve()
        if args.ts_build_dir
        else (project_root / "server" / "temp" / "tsbuild_skill").resolve()
    )
    compiled_index = ts_build_dir / "utils" / "msxGenerator" / "index.js"

    if args.skip_ts_build:
        if not compiled_index.exists():
            print(
                "Missing compiled generator. Disable --skip-ts-build or provide --ts-build-dir with compiled files.",
                file=sys.stderr,
            )
            return 2
    else:
        compiled_index = compile_generator(project_root, ts_build_dir, args.strict_tsc)

    try:
        glass_jar = resolve_glass(args.glass, project_root)
    except FileNotFoundError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    project_name, asm_chars = generate_asm_from_json(
        compiled_index=compiled_index,
        json_path=json_path,
        asm_output=asm_output,
        project_name_override=args.project_name,
        project_root=project_root,
        rom_mode=args.rom_mode,
        target_format=args.target_format,
        execution_mode=args.execution_mode,
        auto_megarom=args.auto_megarom,
    )

    asm_to_compile = maybe_run_post_asm_optimizer(
        project_root=project_root,
        asm_output=asm_output,
        glass_jar=glass_jar,
        enabled=args.post_asm_opt,
        check_only=args.post_asm_check_only,
        rules=args.post_asm_rules,
        explicit_output=args.post_asm_output,
    )
    ensure_sprite_copy_helper(asm_to_compile)

    compile_with_glass(
        glass_jar=glass_jar,
        asm_output=asm_to_compile,
        rom_output=rom_output,
        sym_output=sym_output,
        project_root=project_root,
    )

    original_size, padded_size = pad_rom_to_8kb(rom_output)

    print("")
    print("Done.")
    print(f"Project: {project_name}")
    print(f"JSON: {json_path}")
    print(f"ASM: {asm_output} ({asm_chars} chars)")
    if asm_to_compile != asm_output:
        print(f"Optimized ASM: {asm_to_compile}")
    print(f"ROM: {rom_output} (original={original_size} bytes, padded={padded_size} bytes)")
    print(f"Glass: {glass_jar}")
    print(
        "Generator config: "
        f"mode={args.rom_mode}, mapper={args.target_format}, engine={args.execution_mode}, autoMegaROM={args.auto_megarom}"
    )
    if args.post_asm_opt or args.post_asm_check_only:
        print(
            "Post-ASM: "
            f"enabled={args.post_asm_opt}, check_only={args.post_asm_check_only}, rules={args.post_asm_rules or 'all'}"
        )

    if args.run_openmsx:
        try:
            openmsx_exec = resolve_openmsx(args.openmsx_path)
        except FileNotFoundError as exc:
            print(str(exc), file=sys.stderr)
            return 2
        launch_openmsx(openmsx_exec, rom_output, project_root, args.rom_mode, args.target_format)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
