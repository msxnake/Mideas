import subprocess
import sys
import tempfile
import importlib.util
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
BUILDER = REPO_ROOT / "scripts" / "build_mideas_unified_rom.py"
FIXTURE = REPO_ROOT / "json" / "galaxian_msx2_mideas.json"


def load_builder_module():
    sys.dont_write_bytecode = True
    spec = importlib.util.spec_from_file_location("build_mideas_unified_rom", BUILDER)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot import {BUILDER}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_msx2_screen4_galaxian_konami_megarom_fixed_bank0_compat_compiles() -> None:
    with tempfile.TemporaryDirectory(prefix="mideas_msx2_megarom_") as temp_dir:
        out_dir = Path(temp_dir)
        asm_path = out_dir / "galaxian_msx2_screen4_megarom.asm"
        rom_path = out_dir / "galaxian_msx2_screen4_megarom.rom"
        sym_path = out_dir / "galaxian_msx2_screen4_megarom.sym"

        result = subprocess.run(
            [
                sys.executable,
                str(BUILDER),
                "--json",
                str(FIXTURE),
                "--project-root",
                str(REPO_ROOT),
                "--asm-output",
                str(asm_path),
                "--rom-output",
                str(rom_path),
                "--sym-output",
                str(sym_path),
                "--rom-mode",
                "megarom",
                "--target-format",
                "konami",
                "--skip-zx0-preprocess",
            ],
            cwd=str(REPO_ROOT),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=180,
        )

        assert result.returncode == 0, result.stdout + result.stderr
        assert rom_path.exists(), "ROM was not generated"
        assert rom_path.stat().st_size > 0
        assert rom_path.stat().st_size % 8192 == 0
        assert rom_path.stat().st_size > 32768

        asm_text = asm_path.read_text(encoding="utf-8", errors="replace")
        assert "Mideas MSX2 SCREEN 4 tile backend" in asm_text
        assert "Screen mode: SCREEN 4 (Graphics II)" in asm_text
        assert "; ROM Mode: megarom" in asm_text
        assert "; Mapper Target: konami" in asm_text
        assert "; Auto MegaROM: No" in asm_text
        assert "MSX2 MegaROM Path: Konami 8K fixed-bank0 compatibility" in asm_text
        assert "init_konami8k_fixed_bank0_banks:" in asm_text
        assert "mapper_set_bank_p1:" in asm_text
        assert "mapper_set_bank_p2:" in asm_text
        assert "mapper_set_bank_p3:" in asm_text
        assert "MSX2_SCREEN4_DATA_BANK_ROM_START:" in asm_text
        assert "call msx2_screen4_data_bank_enter" in asm_text
        assert "Konami8K validation: SCREEN 4 fixed-bank0 compatibility path" in result.stdout
        assert "mapperWrites=scattered:0" in result.stdout


def test_msx2_screen4_konami_rejects_scattered_mapper_writes() -> None:
    builder = load_builder_module()
    with tempfile.TemporaryDirectory(prefix="mideas_msx2_mapper_guard_") as temp_dir:
        out_dir = Path(temp_dir)
        rom_path = out_dir / "bad.rom"
        asm_path = out_dir / "bad.asm"
        rom_path.write_bytes(b"AB" + bytes((65536 - 2)))
        asm_path.write_text(
            """
; Mideas MSX2 SCREEN 4 tile backend
; ROM Mode: megarom
; Mapper Target: konami
; MSX2 MegaROM Path: Konami 8K fixed-bank0 compatibility
init_konami8k_fixed_bank0_banks:
    ld a, 1
    call mapper_set_bank_p1
    ld a, 2
    call mapper_set_bank_p2
    ld a, 3
    call mapper_set_bank_p3
    ret
mapper_set_bank_p1:
    ld (#6000), a
    ret
mapper_set_bank_p2:
    ld (#8000), a
    ret
mapper_set_bank_p3:
    ld (#A000), a
    ret
bad_runtime_write:
    ld (#6000), a
    ret
MSX2_SCREEN4_DATA_BANK_ROM_START:
""",
            encoding="utf-8",
        )

        try:
            builder.validate_msx2_screen4_konami_fixed_bank0_megarom(rom_path, asm_path)
        except RuntimeError as error:
            assert "mapper register writes must stay inside" in str(error)
        else:
            raise AssertionError("scattered mapper write was not rejected")


if __name__ == "__main__":
    test_msx2_screen4_galaxian_konami_megarom_fixed_bank0_compat_compiles()
    test_msx2_screen4_konami_rejects_scattered_mapper_writes()
