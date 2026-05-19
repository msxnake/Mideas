# MSX2 Graphics Backend Plan

## Decision

MSX2 graphics must use a separate backend path. The existing generator is a SCREEN 2 tilebank runtime and should remain stable for MSX1 projects.

The selector lives at the top of `generateModularASM`:

- `screen2-tilebank`: existing SCREEN 2 pipeline.
- `msx2-screen5-bitmap`: isolated MSX2 SCREEN 5 bitmap pipeline.

Do not add SCREEN 5 branches inside the existing SCREEN 2 `headerGenerator`, `screensGenerator`, `patternsGenerator`, or `colorsGenerator`.

## Current Slice

The first MSX2 slice supports:

- SCREEN 5 only.
- 256x212 bitmap background.
- 16 palette slots selected from the MSX2 512-color RGB333 master palette.
- Tile map rasterization into SCREEN 5 bytes, 2 pixels per byte.
- Simple ROM output with BIOS `CHGMOD`, palette load, bitmap load, and HALT loop.
- Minimal GameFlow over existing nodes:
  `Start -> Text(backgroundScreenAssetId) -> Transition(cls) -> Text(...) -> End`.

Out of scope for this slice:

- Full SCREEN 2 GameFlow runtime parity.
- Entities/components.
- Sprites.
- HUD/font/menu systems.
- MegaROM resource packing.
- SCREEN 6, SCREEN 7, SCREEN 8.

## Implementation Phases

1. SCREEN 5 backend skeleton
   - Route export from `CodeExportModal` using `currentScreenMode`.
   - Preserve the existing SCREEN 2 path as default.
   - Emit a standalone `unitedFiles.asm` for SCREEN 5.

2. SCREEN 5 visual data
   - Resolve palette assets or tile palettes.
   - Convert RGB333 master palette indexes into VDP palette bytes.
   - Rasterize background screen maps into bitmap data.
   - Compile the generated ASM with Glass.

3. Runtime features
   - Add basic screen transitions and clear/fill helpers.
   - Add key-wait and single-screen GameFlow smoke.
   - Reintroduce hardware sprites through a SCREEN 5-specific sprite loader.
   - Add collision/effects maps as RAM data, not as name-table data.

4. Engine integration
   - Expand GameFlow screen loading beyond the single 32KB-ROM bitmap limit.
   - Add entities/components that do not assume SCREEN 2 name-table writes.
   - Add HUD/text strategy for bitmap modes.

5. Later modes
   - SCREEN 6: 512x212, 4 colors.
   - SCREEN 7: 512x212, 16 colors.
   - SCREEN 8: 256x212, 256-color direct-color mode.

## Constraints

- SCREEN 2 tilebanks and three-bank pattern/color table logic stay in the MSX1 backend.
- MSX2 bitmap screens own their own VRAM layout and data encoders.
- Shared code should be extracted only after both paths are working.
- Any new MSX2 feature must compile with Glass before being considered complete.
