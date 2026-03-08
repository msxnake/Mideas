#!/usr/bin/env python3
import argparse
import subprocess
import sys
from pathlib import Path


PAGE0_SIZE = 0x4000
BODY_MAX_SIZE = 0x8000
LINEAR48K_SIZE = 0xC000


def resolve_glass(project_root: Path, explicit: str | None) -> Path:
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


def run_compile(glass: Path, source: Path, body_output: Path, cwd: Path) -> None:
    cmd = ["java", "-jar", str(glass), str(source), str(body_output)]
    print("Running:", " ".join(cmd))
    result = subprocess.run(cmd, cwd=str(cwd), capture_output=True, text=True)
    if result.stdout.strip():
        print(result.stdout.strip())
    if result.stderr.strip():
        print(result.stderr.strip(), file=sys.stderr)
    if result.returncode != 0:
        raise RuntimeError(f"Glass compile failed with code {result.returncode}")


def build_linear48k_rom(
    body_rom: Path,
    pt3_path: Path,
    output_rom: Path,
    track_address: int,
) -> tuple[int, int]:
    body = body_rom.read_bytes()
    pt3 = pt3_path.read_bytes()

    if len(body) > BODY_MAX_SIZE:
        raise RuntimeError(
            f"Body ROM too large for 48KB linear cart: {len(body)} bytes > {BODY_MAX_SIZE}"
        )
    if track_address < 0 or track_address >= PAGE0_SIZE:
        raise RuntimeError(f"Track address out of page-0 range: 0x{track_address:04X}")
    if track_address + len(pt3) > PAGE0_SIZE:
        raise RuntimeError(
            f"PT3 data does not fit in page 0: start=0x{track_address:04X}, size={len(pt3)}"
        )

    image = bytearray([0xFF] * LINEAR48K_SIZE)
    image[track_address : track_address + len(pt3)] = pt3
    image[PAGE0_SIZE : PAGE0_SIZE + len(body)] = body
    output_rom.write_bytes(image)
    return len(body), len(pt3)


def parse_track_address(value: str) -> int:
    text = value.strip()
    if text.lower().startswith("0x"):
        return int(text, 16)
    if text.startswith("#"):
        return int(text[1:], 16)
    return int(text, 10)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Compile an ASM body ROM and pack a PT3 module into a linear 48KB cartridge image."
    )
    parser.add_argument("--source", required=True, help="Input ASM file")
    parser.add_argument("--pt3", required=True, help="Stripped PT3/.99 file to inject into page 0")
    parser.add_argument("--output", required=True, help="Output 48KB ROM")
    parser.add_argument("--project-root", default=".", help="Repository root")
    parser.add_argument("--body-output", help="Optional compiled body ROM output path")
    parser.add_argument("--glass", help="Explicit path to glass.jar")
    parser.add_argument(
        "--track-address",
        default="#0100",
        help="ROM page-0 address where the PT3 module will be placed (default: #0100)",
    )
    args = parser.parse_args()

    project_root = Path(args.project_root).expanduser().resolve()
    source = Path(args.source).expanduser().resolve()
    pt3 = Path(args.pt3).expanduser().resolve()
    output = Path(args.output).expanduser().resolve()
    body_output = (
        Path(args.body_output).expanduser().resolve()
        if args.body_output
        else output.with_name(output.stem + "_body.rom")
    )
    track_address = parse_track_address(args.track_address)

    if not source.exists():
        print(f"Source file not found: {source}", file=sys.stderr)
        return 2
    if not pt3.exists():
        print(f"PT3 file not found: {pt3}", file=sys.stderr)
        return 2

    output.parent.mkdir(parents=True, exist_ok=True)
    body_output.parent.mkdir(parents=True, exist_ok=True)

    try:
        glass = resolve_glass(project_root, args.glass)
        run_compile(glass, source, body_output, project_root)
        body_size, pt3_size = build_linear48k_rom(body_output, pt3, output, track_address)
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        return 1

    print("Done.")
    print(f"Source: {source}")
    print(f"PT3: {pt3} ({pt3_size} bytes)")
    print(f"Body ROM: {body_output} ({body_size} bytes)")
    print(f"Linear 48KB ROM: {output} ({LINEAR48K_SIZE} bytes)")
    print(f"Track address: 0x{track_address:04X}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
