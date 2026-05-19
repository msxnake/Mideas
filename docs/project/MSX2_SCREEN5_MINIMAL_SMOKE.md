# MSX2 SCREEN 5 Minimal Smoke Flow

This smoke fixture exercises only the `msx2-screen5-bitmap` backend. It does not route through the SCREEN 2 tilebank generator.

## Fixture

- JSON: `test/msx2-screen5/minimal-screen5-project.json`
- Screen mode: `SCREEN 5 (Graphics III)`
- Backend: `msx2-screen5-bitmap`
- Palette: 16 MSX2 V9938 RGB333 slots using the default MSX2 palette
- Tiles: two 8x8 tiles
- Screen map: 32x27 cells, matching the 256x212 SCREEN 5 bitmap area
- GameFlow: `Start -> Text(background screen) -> Transition(cls) -> Text(background screen) -> End`

The fixture stores a deterministic 32x27 background. The smoke script normalizes the background/collision/effects arrays before generation.

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

Capture after advancing the minimal GameFlow with SPACE:

```powershell
python scripts\capture_openmsx_action.py `
  --rom test\msx2-screen5\out\minimal-screen5.rom `
  --sequence "SPACE,WAIT:500" `
  --project-root . `
  --output test\msx2-screen5\out\minimal-screen5-after-space.png `
  --openmsx "C:\Program Files\openMSX\openmsx.exe" `
  --machine C-BIOS_MSX2 `
  --boot-wait-ms 6000 `
  --capture-wait-ms 1000
```

## Isolation Checks

The helper calls `generateModularASM` with:

```text
screenMode = SCREEN 5 (Graphics III)
targetGraphicsBackend = msx2-screen5-bitmap
```

It also checks that the generated file contains the MSX2 SCREEN 5 backend marker and that the returned `patterns.asm` and `colors.asm` files are the backend isolation stubs saying SCREEN 2 tables are intentionally not used.

It also checks the first MSX2 GameFlow slice:

- `Text` nodes emit `wait_key`
- `Transition(cls)` emits `clear_screen5_bitmap`
- GameFlow code is emitted inline in `unitedFiles.asm`, not through the SCREEN 2 `gameFlowGenerator.ts`
- `scripts/capture_openmsx_action.py` can send SPACE through OpenMSX key matrix row 8 mask `0x01` and capture the post-input state.

## Current Scope Limit

The smoke remains a simple 32KB ROM. A single SCREEN 5 bitmap already takes 27136 bytes, so multiple full-screen bitmaps need compression or a mapper-backed resource path before they can be supported safely.
