# MSX2 SCREEN 5 Minimal Smoke Flow

This smoke fixture exercises only the `msx2-screen5-bitmap` backend. It does not route through the SCREEN 2 tilebank generator.

## Fixture

- JSON: `test/msx2-screen5/minimal-screen5-project.json`
- Screen mode: `SCREEN 5 (Graphics III)`
- Backend: `msx2-screen5-bitmap`
- Palette: 16 MSX2 V9938 RGB333 slots using the default MSX2 palette
- Tiles: two 8x8 tiles
- Screen map: 32x27 cells, matching the 256x212 SCREEN 5 bitmap area

The fixture stores empty layer arrays initially; the smoke script normalizes them to deterministic 32x27 background/collision/effects arrays before generation.

## Reproducible Command

```powershell
python scripts/build_msx2_screen5_smoke.py
```

Default outputs:

- ASM: `test/msx2-screen5/out/minimal-screen5.asm`
- ROM: `test/msx2-screen5/out/minimal-screen5.rom`
- symbols: `test/msx2-screen5/out/minimal-screen5.sym`
- screenshot: `test/msx2-screen5/out/minimal-screen5.png`

Compile without launching OpenMSX:

```powershell
python scripts/build_msx2_screen5_smoke.py --skip-openmsx
```

Use a specific OpenMSX binary or machine:

```powershell
python scripts/build_msx2_screen5_smoke.py --openmsx "C:\Program Files\openMSX\openmsx.exe" --machine C-BIOS_MSX2
```

## Isolation Checks

The helper calls `generateModularASM` with:

```text
screenMode = SCREEN 5 (Graphics III)
targetGraphicsBackend = msx2-screen5-bitmap
```

It also checks that the generated file contains the MSX2 SCREEN 5 backend marker and that the returned `patterns.asm` and `colors.asm` files are the backend isolation stubs saying SCREEN 2 tables are intentionally not used.
