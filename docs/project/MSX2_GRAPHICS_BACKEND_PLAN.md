# MSX2 Graphics Backend Plan

## Decision

MSX2 graphics must use a separate backend path. The existing generator is a SCREEN 2 tilebank runtime and should remain stable for MSX1 projects.

The selector lives at the top of `generateModularASM`:

- `screen2-tilebank`: existing SCREEN 2 pipeline.
- `msx2-screen4-pattern`: isolated MSX2 SCREEN 4 pattern/tile pipeline.

Do not add SCREEN 4 branches inside the existing SCREEN 2 `headerGenerator`, `screensGenerator`, `patternsGenerator`, or `colorsGenerator`.

## Current Slice

The first MSX2 slice supports:

- SCREEN 4 as the primary MSX2 game mode.
- 256x192 pattern/tile background.
- 16 palette slots selected from the MSX2 512-color RGB333 master palette.
- Tile map rasterization into SCREEN 4 pattern, color, and name data.
- Simple ROM and Konami MegaROM output with BIOS `CHGMOD`, palette load, VRAM data upload, and game loop.
- First hardware sprite MVP:
  - Uses the first `msx2sprite` asset as one visible 16x16 MSX2 hardware sprite.
  - Emits pattern/color/SAT data in the resident ROM or the Konami cold data bank depending on ROM mode.
  - Writes sprite VRAM tables with V9938 extended addressing for `#7400/#7600/#7800`.
- Minimal GameFlow over existing nodes:
  `Start -> Text(backgroundScreenAssetId) -> Transition(cls) -> Text(...) -> End`.
- Smoke fixtures and generated outputs for this path live under
  `test/msx2-screen4`, including the Galaxian MegaROM fixture and the native
  layer/conveyor regression fixtures.

Out of scope for this slice:

- Full SCREEN 2 GameFlow runtime parity.
- Multi-sprite allocation, animation, movement, and entity-driven sprite updates.
- HUD/font/menu systems.
- Full MegaROM resource packing parity. Native SCREEN4 projects do have an
  initial Konami MegaROM compatibility path, but ASCII8/ASCII16 and generic
  banked resource-table loading remain separate roadmap work.
- SCREEN 6, SCREEN 7, SCREEN 8.
- Legacy SCREEN 5 bitmap ROMs. They may remain as archived experiments, but
  they are not part of the active MSX2 MegaROM pipeline.

## Implementation Phases

1. SCREEN 4 backend skeleton
   - Route export from `CodeExportModal` using `currentScreenMode`.
   - Preserve the existing SCREEN 2 path as default.
   - Emit a standalone `unitedFiles.asm` for SCREEN 4.

2. SCREEN 4 visual data
   - Resolve palette assets or tile palettes.
   - Convert RGB333 master palette indexes into VDP palette bytes.
   - Rasterize background screen maps into pattern, color, and name-table data.
   - Compile the generated ASM with Glass.

3. Runtime features
   - Add basic screen transitions and clear/fill helpers.
   - Add key-wait and single-screen GameFlow smoke.
   - Expand the SCREEN 4-specific hardware sprite loader beyond the first-sprite smoke path.
   - Add collision/effects maps as RAM data, not as name-table data.

4. Engine integration
   - Expand GameFlow screen loading beyond the single 32KB-ROM limit.
   - Add entities/components that do not assume SCREEN 2 name-table writes.
   - Add HUD/text strategy for SCREEN 4.

5. Later modes
   - SCREEN 6: 512x212, 4 colors.
   - SCREEN 7: 512x212, 16 colors.
   - SCREEN 8: 256x212, 256-color direct-color mode.

## Constraints

- SCREEN 2 tilebanks and three-bank pattern/color table logic stay in the MSX1 backend.
- MSX2 SCREEN 4 screens own their own VRAM layout and data encoders.
- Shared code should be extracted only after both paths are working.
- Any new MSX2 feature must compile with Glass before being considered complete.

## MegaROM Budget Policy

Native MSX2 SCREEN 4 work must follow the MSX2 MegaROM stability roadmap in
`docs/msx-megarom-roadmap.md`. The important rule is that MSX2 features should
not grow the generator until Glass is the first tool to report an 8 KB bank
overflow.

Before emitting ASM, the MSX2 backend should know:

- which code is fixed resident core,
- which data belongs to a world package,
- which assets stay in ROM raw,
- which assets use ZX0,
- which assets stream or stage into VRAM,
- which runtime state really needs RAM,
- and how full each 8 KB Konami bank is.

Gameplay variations should normally add data to a world package or optional far
code bank. They should not silently enlarge the resident core unless the
behavior has been promoted into a reusable MSX2 component.
