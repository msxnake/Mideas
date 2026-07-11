#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime
from pathlib import Path


VALID_KEYS = {"UP", "DOWN", "LEFT", "RIGHT", "SPACE", "SPC", "M"}
KEY_ALIASES = {"SPC": "SPACE"}
MSX_KEY_MATRIX = {
    "SPACE": ("8", "0x01"),
    "LEFT": ("8", "0x10"),
    "UP": ("8", "0x20"),
    "DOWN": ("8", "0x40"),
    "RIGHT": ("8", "0x80"),
    "M": ("2", "0x01"),
}
DEFAULT_MACHINE = "C-BIOS_MSX2"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Launch OpenMSX, replay a deterministic input sequence, and capture a screenshot."
    )
    parser.add_argument("--rom", required=True, help="Path to the ROM file")
    parser.add_argument(
        "--sequence",
        required=True,
        help='Input sequence, e.g. "DOWN,DOWN,SPACE,WAIT:700,RIGHT:1200"',
    )
    parser.add_argument("--project-root", default=".", help="Project root for relative ROM resolution")
    parser.add_argument("--output", help="Optional explicit PNG output path")
    parser.add_argument("--openmsx", help="Path to openmsx executable")
    parser.add_argument("--machine", default=DEFAULT_MACHINE, help="Optional OpenMSX machine id")
    parser.add_argument("--romtype", help="Optional OpenMSX ROM type, e.g. konami")
    parser.add_argument("--boot-wait-ms", type=int, default=4000, help="Wait before first input")
    parser.add_argument("--hold-ms", type=int, default=120, help="Tap duration for simple key presses")
    parser.add_argument("--gap-ms", type=int, default=100, help="Gap after each key release")
    parser.add_argument(
        "--capture-wait-ms",
        type=int,
        default=300,
        help="Extra wait after the sequence before taking the screenshot",
    )
    parser.add_argument(
        "--close-timeout-ms",
        type=int,
        default=12000,
        help="Extra timeout budget for process shutdown",
    )
    parser.add_argument(
        "--load-via-script",
        action="store_true",
        help="Load the ROM via carta inside the TCL script instead of passing -cart",
    )
    parser.add_argument("--probe-output", help="Optional text file where OpenMSX writes memory probe values")
    parser.add_argument(
        "--probe",
        action="append",
        default=[],
        help="Memory probe as label:address, for example collectible:0xC00E. May be repeated.",
    )
    parser.add_argument(
        "--poke",
        action="append",
        default=[],
        help="Memory poke as address:value applied after boot wait and before input, for example 0xC00E:0x01. May be repeated.",
    )
    parser.add_argument("--dry-run", action="store_true", help="Print the resolved command and TCL script")
    return parser.parse_args()


def resolve_openmsx(explicit: str | None) -> str:
    if explicit:
        path = Path(explicit).expanduser().resolve()
        if path.exists():
            return str(path)
        raise FileNotFoundError(f"OpenMSX executable not found: {path}")

    env_path = os.getenv("OPENMSX_PATH")
    if env_path:
        candidate = Path(env_path).expanduser().resolve()
        if candidate.exists():
            return str(candidate)

    for candidate in (
        Path(r"C:\Program Files\openMSX\openmsx.exe"),
        Path(r"C:\Program Files (x86)\openMSX\openmsx.exe"),
    ):
        if candidate.exists():
            return str(candidate.resolve())

    path_hit = shutil.which("openmsx")
    if path_hit:
        return path_hit

    raise FileNotFoundError("OpenMSX executable not found")


def resolve_existing_path(raw_path: str, project_root: Path) -> Path:
    raw = Path(raw_path).expanduser()
    candidates = [raw] if raw.is_absolute() else [project_root / raw, Path.cwd() / raw]
    for candidate in candidates:
        resolved = candidate.resolve()
        if resolved.exists():
            return resolved
    raise FileNotFoundError(f"File not found: {raw_path}")


def build_default_output_path(rom_path: Path) -> Path:
    screenshots_dir = Path.home() / "Documents" / "openMSX" / "screenshots"
    screenshots_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return screenshots_dir / f"{rom_path.stem}_{stamp}.png"


def normalize_key(key: str) -> str:
    upper = key.strip().upper()
    upper = KEY_ALIASES.get(upper, upper)
    if upper not in VALID_KEYS:
        raise ValueError(f"Unsupported key token: {key}")
    return upper


def parse_sequence(sequence: str, default_hold_ms: int) -> list[tuple[str, str, int]]:
    actions: list[tuple[str, str, int]] = []
    tokens = [token.strip() for token in sequence.split(",") if token.strip()]
    if not tokens:
        raise ValueError("Sequence is empty")

    for token in tokens:
        upper = token.upper()
        if upper.startswith("WAIT:"):
            wait_ms = int(token.split(":", 1)[1])
            if wait_ms < 0:
                raise ValueError(f"WAIT must be >= 0: {token}")
            actions.append(("wait", "", wait_ms))
            continue

        if "*" in token:
            key_part, count_part = token.split("*", 1)
            key = normalize_key(key_part)
            count = int(count_part)
            if count <= 0:
                raise ValueError(f"Repeat count must be > 0: {token}")
            for _ in range(count):
                actions.append(("key", key, default_hold_ms))
            continue

        if ":" in token:
            key_part, duration_part = token.split(":", 1)
            key = normalize_key(key_part)
            duration_ms = int(duration_part)
            if duration_ms < 0:
                raise ValueError(f"Hold duration must be >= 0: {token}")
            actions.append(("key", key, duration_ms))
            continue

        actions.append(("key", normalize_key(token), default_hold_ms))

    return actions


def parse_probes(raw_probes: list[str]) -> list[tuple[str, int]]:
    probes: list[tuple[str, int]] = []
    for raw_probe in raw_probes:
        if ":" not in raw_probe:
            raise ValueError(f"Probe must use label:address format: {raw_probe}")
        label, raw_addr = raw_probe.split(":", 1)
        label = label.strip()
        if not label or any(ch.isspace() for ch in label):
            raise ValueError(f"Probe label must be non-empty and contain no whitespace: {raw_probe}")
        try:
            address = int(raw_addr.strip(), 0)
        except ValueError as exc:
            raise ValueError(f"Invalid probe address in {raw_probe}") from exc
        if address < 0 or address > 0xFFFF:
            raise ValueError(f"Probe address out of range in {raw_probe}")
        probes.append((label, address))
    return probes


def parse_pokes(raw_pokes: list[str]) -> list[tuple[int, int]]:
    pokes: list[tuple[int, int]] = []
    for raw_poke in raw_pokes:
        if ":" not in raw_poke:
            raise ValueError(f"Poke must use address:value format: {raw_poke}")
        raw_addr, raw_value = raw_poke.split(":", 1)
        try:
            address = int(raw_addr.strip(), 0)
            value = int(raw_value.strip(), 0)
        except ValueError as exc:
            raise ValueError(f"Invalid poke in {raw_poke}") from exc
        if address < 0 or address > 0xFFFF:
            raise ValueError(f"Poke address out of range in {raw_poke}")
        if value < 0 or value > 0xFF:
            raise ValueError(f"Poke value out of byte range in {raw_poke}")
        pokes.append((address, value))
    return pokes


def auto_close_timeout_ms(
    actions: list[tuple[str, str, int]],
    boot_wait_ms: int,
    gap_ms: int,
    capture_wait_ms: int,
    extra_ms: int,
) -> int:
    total_ms = boot_wait_ms + capture_wait_ms + 800
    for action_type, _key, value in actions:
        if action_type == "wait":
            total_ms += value
        else:
            total_ms += value + gap_ms
    return total_ms + extra_ms


def build_tcl(
    rom_path: Path,
    output_path: Path,
    probe_output_path: Path | None,
    probes: list[tuple[str, int]],
    pokes: list[tuple[int, int]],
    actions: list[tuple[str, str, int]],
    boot_wait_ms: int,
    gap_ms: int,
    capture_wait_ms: int,
    load_via_script: bool,
) -> str:
    def openmsx_seconds(ms: int) -> str:
        return f"{ms / 1000:.3f}"

    def keymatrix_command(command: str, key: str) -> str:
        row, mask = MSX_KEY_MATRIX[key]
        return f"{command} {row} {mask}"

    lines: list[str] = []
    if load_via_script:
        unix_rom = rom_path.as_posix()
        lines.extend(
            [
                f'set rom_path "{unix_rom}"',
                "puts \"ACTION: Loading ROM $rom_path\"",
                "if {[catch {carta $rom_path} err]} {",
                "    puts \"ACTION ERROR: failed to load ROM: $err\"",
                "    exit 1",
                "}",
                "",
            ]
        )

    current_ms = boot_wait_ms
    if pokes:
        lines.append(f"after time {openmsx_seconds(current_ms)} {{")
        for address, value in pokes:
            lines.append(f"    debug write memory 0x{address:04X} 0x{value:02X}")
        lines.append("}")

    for action_type, key, value in actions:
        if action_type == "wait":
            current_ms += value
            continue
        lines.append(f"after time {openmsx_seconds(current_ms)} {{ {keymatrix_command('keymatrixdown', key)} }}")
        current_ms += value
        lines.append(f"after time {openmsx_seconds(current_ms)} {{ {keymatrix_command('keymatrixup', key)} }}")
        current_ms += gap_ms

    current_ms += capture_wait_ms
    output_tcl = output_path.as_posix()
    probe_lines: list[str] = []
    if probe_output_path and probes:
        probe_tcl = probe_output_path.as_posix()
        probe_lines.extend(
            [
                f"    set probe_path \"{probe_tcl}\"",
                "    set pf [open $probe_path \"w\"]",
            ]
        )
        for label, address in probes:
            probe_lines.append(f"    puts $pf [format \"{label}=%02X\" [debug read memory 0x{address:04X}]]")
        probe_lines.append("    close $pf")
    lines.extend(
        [
            f"after time {openmsx_seconds(current_ms)} {{",
            *probe_lines,
            f"    set out_path \"{output_tcl}\"",
            "    if {[catch {screenshot $out_path} err]} {",
            "        puts \"ACTION ERROR: screenshot failed: $err\"",
            "        exit 1",
            "    }",
            "    puts \"ACTION: Screenshot saved to $out_path\"",
            "    after time 0.150 { exit }",
            "}",
            "",
        ]
    )
    return "\n".join(lines)


def create_temp_tcl(content: str) -> Path:
    fd, path = tempfile.mkstemp(prefix="capture_openmsx_action_", suffix=".tcl", text=True)
    os.close(fd)
    tcl_path = Path(path)
    tcl_path.write_text(content, encoding="utf-8")
    return tcl_path


def build_command(
    openmsx_exe: str,
    rom_path: Path,
    tcl_path: Path,
    machine: str | None,
    romtype: str | None,
    load_via_script: bool,
) -> list[str]:
    cmd = [openmsx_exe]
    if machine:
        cmd.extend(["-machine", machine])
    if not load_via_script:
        cmd.extend(["-cart", str(rom_path)])
        if romtype:
            cmd.extend(["-romtype", romtype])
    cmd.extend(["-script", str(tcl_path)])
    return cmd


def terminate_process_tree(proc: subprocess.Popen[str]) -> None:
    if os.name == "nt":
        subprocess.run(
            ["taskkill", "/PID", str(proc.pid), "/T", "/F"],
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return
    proc.terminate()
    try:
        proc.wait(timeout=2)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.wait(timeout=2)


def emit_process_output(stdout: str, stderr: str) -> None:
    if stdout:
        print(stdout, end="" if stdout.endswith("\n") else "\n")
    if stderr:
        print(stderr, file=sys.stderr, end="" if stderr.endswith("\n") else "\n")


def main() -> int:
    args = parse_args()
    project_root = Path(args.project_root).expanduser().resolve()

    if any(
        value < 0
        for value in (args.boot_wait_ms, args.hold_ms, args.gap_ms, args.capture_wait_ms, args.close_timeout_ms)
    ):
        print("Timing values must be >= 0", file=sys.stderr)
        return 2

    try:
        openmsx_exe = resolve_openmsx(args.openmsx)
        rom_path = resolve_existing_path(args.rom, project_root)
        output_path = Path(args.output).expanduser().resolve() if args.output else build_default_output_path(rom_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        actions = parse_sequence(args.sequence, args.hold_ms)
        probes = parse_probes(args.probe)
        pokes = parse_pokes(args.poke)
        probe_output_path = Path(args.probe_output).expanduser().resolve() if args.probe_output else None
        if probes and not probe_output_path:
            raise ValueError("--probe-output is required when --probe is used")
        if probe_output_path:
            probe_output_path.parent.mkdir(parents=True, exist_ok=True)
        tcl_content = build_tcl(
            rom_path=rom_path,
            output_path=output_path,
            probe_output_path=probe_output_path,
            probes=probes,
            pokes=pokes,
            actions=actions,
            boot_wait_ms=args.boot_wait_ms,
            gap_ms=args.gap_ms,
            capture_wait_ms=args.capture_wait_ms,
            load_via_script=args.load_via_script,
        )
    except (FileNotFoundError, ValueError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 2

    tcl_path = create_temp_tcl(tcl_content)
    cmd = build_command(
        openmsx_exe=openmsx_exe,
        rom_path=rom_path,
        tcl_path=tcl_path,
        machine=args.machine,
        romtype=args.romtype,
        load_via_script=args.load_via_script,
    )

    print("Running:")
    print(" ".join(f'"{part}"' if " " in part else part for part in cmd))
    print(f"ROM: {rom_path}")
    print(f"Output: {output_path}")
    if args.probe_output:
        print(f"Probe output: {Path(args.probe_output).expanduser().resolve()}")
    print(f"Sequence: {args.sequence}")

    if args.dry_run:
        print("\nTCL:")
        print(tcl_content, end="")
        try:
            tcl_path.unlink(missing_ok=True)
        except OSError:
            pass
        return 0

    timeout_s = auto_close_timeout_ms(
        actions=actions,
        boot_wait_ms=args.boot_wait_ms,
        gap_ms=args.gap_ms,
        capture_wait_ms=args.capture_wait_ms,
        extra_ms=args.close_timeout_ms,
    ) / 1000.0

    try:
        proc = subprocess.Popen(
            cmd,
            cwd=str(project_root),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        try:
            stdout, stderr = proc.communicate(timeout=timeout_s)
        except subprocess.TimeoutExpired:
            terminate_process_tree(proc)
            stdout, stderr = proc.communicate(timeout=2)
            emit_process_output(stdout, stderr)
            print(f"Error: forced OpenMSX shutdown after {timeout_s:.1f}s", file=sys.stderr)
            return 5

        emit_process_output(stdout, stderr)

        if proc.returncode not in (0, None):
            return int(proc.returncode)

        if not output_path.exists():
            print(f"Error: screenshot not found after OpenMSX exit: {output_path}", file=sys.stderr)
            print(
                "Hint: retry with --machine and a larger --boot-wait-ms, or use --dry-run to inspect the TCL flow.",
                file=sys.stderr,
            )
            return 3

        print("Done.")
        return 0
    finally:
        try:
            tcl_path.unlink(missing_ok=True)
        except OSError:
            pass


if __name__ == "__main__":
    raise SystemExit(main())
