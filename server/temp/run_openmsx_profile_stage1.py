#!/usr/bin/env python3
from __future__ import annotations

import subprocess
import tempfile
from pathlib import Path


OPENMSX = Path(r"C:\Program Files\openMSX\openmsx.exe")
ROM = Path(r"C:\Users\salam\Documents\Programacion\Mideas\server\temp\patoantic165_profile_stage1.rom")
PROJECT_ROOT = Path(r"C:\Users\salam\Documents\Programacion\Mideas")

COUNTERS = {
    "update_all_entities": 0xC01E,
    "execute_all_state_machines": 0xC020,
    "SM_Update": 0xC022,
    "update_collision_component": 0xC024,
    "update_wallcollision_component": 0xC026,
    "update_deadly_tiles_component": 0xC028,
    "check_tile_interaction": 0xC02A,
    "update_animation_component": 0xC02C,
    "update_sprite_component": 0xC02E,
    "task_update_music": 0xC030,
    "deadly_behavior_reads": 0xC032,
}


def build_tcl(label: str, logfile: Path, move: bool) -> str:
    lines = [
        f'set logfh [open "{logfile.as_posix()}" "w"]',
        'proc log_line {fh text} { puts $fh $text ; flush $fh }',
        'proc read16 {addr} {',
        '    set lo [debug read "memory" $addr]',
        '    set hi [debug read "memory" [expr {$addr + 1}]]',
        '    return [expr {$lo + 256 * $hi}]',
        '}',
        'proc dump_profile {fh label} {',
        '    log_line $fh [format "PROFILE %s" $label]',
    ]
    for name, addr in COUNTERS.items():
        lines.append(f'    log_line $fh [format "{name}=%d" [read16 0x{addr:04X}]]')
    lines += [
        '}',
        'log_line $logfh "SCRIPT_START"',
    ]
    if move:
        lines += [
            'after time 2500 { keymatrixdown RIGHT }',
            'after time 5500 { keymatrixup RIGHT }',
            f'after time 7000 {{ dump_profile $logfh "{label}" ; set ::done 1 }}',
        ]
    else:
        lines += [
            f'after time 8000 {{ dump_profile $logfh "{label}" ; set ::done 1 }}',
        ]
    lines += [
        'vwait ::done',
        'close $logfh',
        'after time 200 { exit }',
        '',
    ]
    return "\n".join(lines)


def run_case(label: str, move: bool) -> Path:
    logfile = PROJECT_ROOT / "server" / "temp" / f"openmsx_profile_stage1_{label}.log"
    if logfile.exists():
        logfile.unlink()

    script = build_tcl(label, logfile, move)
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".tcl", delete=False, encoding="utf-8-sig", prefix="openmsx_profile_stage1_"
    ) as tf:
        tf.write(script)
        tcl_path = Path(tf.name)

    cmd = [
        str(OPENMSX),
        "-machine",
        "C-BIOS_MSX1_EU",
        "-cart",
        str(ROM),
        "-script",
        str(tcl_path),
    ]
    try:
        process = subprocess.Popen(cmd, cwd=str(PROJECT_ROOT))
        process.wait(timeout=25)
    finally:
        try:
            tcl_path.unlink(missing_ok=True)
        except OSError:
            pass
    return logfile


def main() -> int:
    idle = run_case("idle", move=False)
    move = run_case("move", move=True)
    print(idle)
    print(move)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
