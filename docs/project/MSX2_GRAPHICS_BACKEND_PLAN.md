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

## Vampire Killer-Inspired MSX2 Direction

The Vampire Killer OpenMSX research in
`research/vampire_killer_openmsx/report.md` gives a concrete target style for
Mideas MSX2. The useful lesson is not to copy game code, but to copy the
architecture:

- author with tiles/cells in Mideas;
- export/load as SCREEN 4 bitmap resources;
- use V9938 commands to compose the visible page;
- keep hardware sprites for moving actors.

This should be treated as an MSX2 backend direction only. It must not change
the SCREEN 2 tilebank backend. Screen Editor implementation planning lives in
`docs/project/MSX2_SCREEN_EDITOR_VAMPIRE_KILLER_PLAN.md`.

### SCREEN 4 composer target

The current backend emits SCREEN 4 pattern/color/name resources. The next
composer layer should allow a Vampire Killer-style full-room load:

1. clear the visible page;
2. stage a bitmap block/font/icon atlas in VRAM;
3. copy repeated `8x8` background cells into the visible page;
4. copy selected `16x16` props, doors, and icons;
5. redraw HUD static sections;
6. reinitialize the hardware sprite SAT.

OpenMSX traces showed background composition dominated by `8x8` copies with
some `16x16` copies and no direct `32x32` screen-copy primitive. Mideas can
still analyze `blocks2x2`/`blocks4x4` at export time, but the runtime primitive
should remain `8x8`/`16x16` V9938 copies.

### SCREEN 4 HUD target

The MSX2 HUD path should be procedural:

- text: 8x8 glyph copies from an offscreen font atlas;
- icons: 16x16 copies from an offscreen icon atlas;
- energy bars: V9938 fill and line commands, not static tile art;
- variable updates: redraw only the changed numeric glyphs or bar fill region.

This maps directly onto existing Mideas HUD element types such as
`EnergyBar`, `BossEnergyBar`, `NumericField`, `Score`, `Lives`, and
`ItemDisplay`. The first useful implementation target is an MSX2 HUD renderer
that emits:

- `msx2_vdp_copy_rect`;
- `msx2_vdp_fill_rect`;
- `msx2_vdp_line_h`;
- `msx2_vdp_line_v`;
- `msx2_draw_glyph_8x8`;
- `msx2_draw_icon_16x16`;
- `msx2_draw_energy_bar`.

### Hardware sprite target

MSX2 actors should stay separate from bitmap room/HUD composition. The current
hardware sprite path already handles V9938 sprite patterns, colors, SAT data,
animation, and mirroring. The next useful expansion is actor composition:

- 16x16 single sprite;
- 16x32 actor from two vertically stacked sprites;
- optional two-plane overlay for richer color;
- per-frame SAT/color-table updates driven by entity/player state.

Vampire Killer's player uses four hardware sprites for a normal frame: two
vertical 16x16 cells times two overlaid color planes. That is a good reference
shape for a future `msx2sprite` composition option.

### First practical milestone

The best small milestone is the procedural SCREEN 4 HUD renderer. It is
isolated, visible in OpenMSX screenshots, and uses data Mideas already stores.
It should compile with Glass and include an OpenMSX smoke with:

- score or stage text from a glyph atlas;
- one 16x16 icon;
- one player energy bar;
- one boss/enemy energy bar;
- a runtime variable update that changes a bar width.

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
