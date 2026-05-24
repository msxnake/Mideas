# MSX2 SCREEN 5 Presentation PNG Import

Use this flow to convert a PNG into a boot presentation screen for the `msx2-screen5-presentation` backend.

## Command

Install the Python image dependency first when needed:

```powershell
pip install -r requirements.txt
```

```powershell
npm run create:msx2-screen5-presentation -- `
  --source-png generated_assets/presentacion_naves_galaxian_rtype.png `
  --out-dir test/msx2-screen5-presentation/from_png `
  --project-name presentacion_naves_galaxian_rtype_screen5_png_test `
  --output-prefix presentacion_naves_galaxian_rtype_screen5 `
  --asset-name "Presentation Naves Galaxian R-Type PNG Test" `
  --palette-mode auto `
  --with-msx2-gameflow `
  --build-rom `
  --capture-openmsx
```

For deterministic CI-style regeneration without OpenMSX:

```powershell
npm run smoke:msx2-screen5-presentation-png
```

## Outputs

The importer writes:

- `*_project.json`: Mideas project with one `msx2presentation` asset. With `--with-msx2-gameflow`, it also includes a `Main MSX2` flow wired as `Start -> Screen5Presentation -> Transition(fade_to_black) -> End`.
- `*_bitmap.bin`: packed SCREEN 5 4bpp bitmap, two pixels per byte.
- `*_preview.png`: quantized 256x192 preview.
- `*.asm`, `*_compressed.asm`, `*.rom`, `*.sym`: generated build artifacts when `--build-rom` is used.
- `*_openmsx.png`: OpenMSX screenshot when `--capture-openmsx` is used.

## Contracts

- `screenMode`: `SCREEN 5 (Graphics III)`.
- `targetGraphicsBackend`: `msx2-screen5-presentation`.
- Slot 0 is black: `#000000`.
- `--palette-mode auto` adapts 15 visible colors from the PNG and keeps slot 0 black. This is the default and usually gives the best presentation image.
- `--palette-mode default` uses the standard SCREEN 5 palette snapped to RGB333, also with slot 0 black. Use it when you need closer parity with editor/default palette behavior.
- ZX0 compression is enabled with 32-line chunks.
- `--with-msx2-gameflow` makes the generated project open in the MSX2 GameFlow editor and validates through `MSX2_GAMEFLOW_*` ASM markers in smoke tests. The current SCREEN 5 backend supports the linear intro path `Start -> Screen5Presentation -> optional terminal Transition -> End`; broader GameFlow branching remains outside this backend.
- ROM output must be 8KB aligned.
- Default visible height is 192 lines. The generator still uploads a full 256x212 SCREEN 5 VRAM bitmap and pads the remaining lines with black.
- The Python importer uses Pillow for PNG decoding/resizing/quantization. Fixture/smoke regeneration is deterministic only when `--timestamp-ms` is fixed and the `requirements.txt` Pillow version is used.
- OpenMSX capture validation rejects missing, tiny, blank, or very low-color screenshots.
