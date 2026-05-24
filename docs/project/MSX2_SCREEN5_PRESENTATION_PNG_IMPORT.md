# MSX2 SCREEN 5 Presentation PNG Import

Use this flow to convert a PNG into a boot presentation screen for the `msx2-screen5-presentation` backend.

## Command

```powershell
npm run create:msx2-screen5-presentation -- `
  --source-png generated_assets/presentacion_naves_galaxian_rtype.png `
  --out-dir test/msx2-screen5-presentation/from_png `
  --project-name presentacion_naves_galaxian_rtype_screen5_png_test `
  --output-prefix presentacion_naves_galaxian_rtype_screen5 `
  --asset-name "Presentation Naves Galaxian R-Type PNG Test" `
  --build-rom `
  --capture-openmsx
```

For deterministic CI-style regeneration without OpenMSX:

```powershell
npm run smoke:msx2-screen5-presentation-png
```

## Outputs

The importer writes:

- `*_project.json`: Mideas project with one `msx2presentation` asset.
- `*_bitmap.bin`: packed SCREEN 5 4bpp bitmap, two pixels per byte.
- `*_preview.png`: quantized 256x192 preview.
- `*.asm`, `*_compressed.asm`, `*.rom`, `*.sym`: generated build artifacts when `--build-rom` is used.
- `*_openmsx.png`: OpenMSX screenshot when `--capture-openmsx` is used.

## Contracts

- `screenMode`: `SCREEN 5 (Graphics III)`.
- `targetGraphicsBackend`: `msx2-screen5-presentation`.
- Slot 0 is black: `#000000`.
- ZX0 compression is enabled with 32-line chunks.
- ROM output must be 8KB aligned.
