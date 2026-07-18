# MSX2 Graphics Backend Plan

## Decision

MSX2 graphics must use a separate backend path. The existing generator is a SCREEN 2 tilebank runtime and should remain stable for MSX1 projects.

The selector lives at the top of `generateModularASM`:

- `screen2-tilebank`: existing SCREEN 2 pipeline.
- `msx2-screen4-pattern`: isolated MSX2 SCREEN 4 pattern/tile pipeline.

Do not add SCREEN 4 branches inside the existing SCREEN 2 `headerGenerator`, `screensGenerator`, `patternsGenerator`, or `colorsGenerator`.

## Dual-mode MSX2 — per-project decision (2026-06-16)

Decision: an MSX2 project picks **one** graphics mode for the whole ROM. One ROM =
one mode. No CHGMOD mid-game. Per-world and per-screen mode switching are
explicitly **out of scope** (deferred) for simplicity and runtime stability.

Two MSX2 game modes (plus the presentation backend):

| Mode (UI) | Backend id | Real VDP mode | Best for | Trade-off |
|-----------|-----------|---------------|----------|-----------|
| **Tile (SCREEN 4)** | `msx2-screen4-pattern` | GRAPHIC 3 (tile: pattern/color/name) | Puzzle, board, fixed-screen, grid games (King's Valley 2 style) | Cheap name-table updates; **2-color-per-8px-cell clash**; no command engine |
| **Bitmap room (SCREEN 5)** | `msx2-screen4-bitmap-room` | **SCREEN 5 / GRAPHIC 4** (`CHGMOD 5`, 4bpp) | Action, platformers, rich art (Pampas, Vampire Killer, Maze of Galious) | **16 colors free per pixel, no clash**; needs command-engine block composition at room load |
| Presentation | `msx2-screen5-presentation` | SCREEN 5 | Title/cutscene still images | Not a gameplay mode |

Naming note: `msx2-screen4-bitmap-room` is now only a legacy internal route id; at runtime it does
`CHGMOD 5`, so its **actual hardware mode is SCREEN 5**. The UI label for this mode
should read "SCREEN 5 (bitmap room)" to match reality and avoid the historical
SCREEN-4-vs-SCREEN-5 confusion (see `MSX2_BITMAP_MULTICOLOR_STUDY.md`).

### Current state (verified 2026-06-16)

The dual routing already exists at the engine level in
`resolveGraphicsBackend(config, assets)` (`utils/msxGenerator/index.ts`). Selection
priority today:

1. `config.targetGraphicsBackend` explicit (legacy `msx2-screen5-*` → deprecated →
   routed to `msx2-screen4-pattern`).
2. The `msx2gameflow` asset `purpose`: `screen4-runtime` → pattern,
   `screen4-bitmap-runtime` → bitmap-room, `screen5-presentation` → presentation.
3. Auto-detection by asset presence (presentation / bitmap-room assets).
4. Fallback by `screenMode` → `msx2-screen4-pattern`.

So mode selection is effectively **per-project already** (driven by the project's
single Main MSX2 gameflow / assets), which is why per-project is the chosen
granularity: it matches the engine and needs no mid-game mode switching.

### What remains (future work, NOT done here)

This section records the decision only. Implementation is deferred:

- Expose an **explicit per-project selector** ("Tile SCREEN 4" vs "Bitmap room
  SCREEN 5") in the MSX2 project setup UI, persisted in `msx2ProjectProfile`,
  instead of relying on implicit asset/gameflow detection.
- Map that selector to `targetGraphicsBackend` (and/or the gameflow `purpose`) so
  export is deterministic regardless of which assets exist.
- Default for new MSX2 projects (proposal: Tile SCREEN 4, the cheaper/simpler mode;
  decide on creation).
- Ensure the authoring surface follows the chosen mode (tile editor + name-table
  screens for SCREEN 4; bitmap-room composer + atlas/command list for SCREEN 5).
- Rename the bitmap-room mode's user-facing label to "SCREEN 5 (bitmap room)".

### Update (2026-06-17) — no-mixing enforced

The "one ROM = one mode" rule is now enforced in two layers, so tile SCREEN 4 screens
(`msx2screen`) and bitmap SCREEN 5 rooms (`msx2bitmaproom`) can no longer coexist in a game:

- **Authoring guard** (`utils/msx2ProjectProfiles.ts`): asset-type lists are split by mode —
  `MSX2_TILE_SCREEN_ASSET_TYPES` (platform/maze/shooter profiles, includes `msx2screen`, excludes
  `msx2bitmaproom`) and `MSX2_BITMAP_ROOM_ASSET_TYPES` (`bitmapPlatform`, the reverse). The New
  Asset menu only offers the screen type of the chosen mode. `allowedAssetTypes` is now
  baseline-authoritative in `normalizeMsx2ProjectProfile` (no `mergeUnique`) so legacy mixed
  projects are corrected on load. This reverses the earlier contract that *required* platform/maze
  to allow bitmap rooms.
- **Export guard** (`detectMsx2ScreenModeConflict` / `getMsx2ScreenModeConflictMessage`, called in
  `generateModularASM`): export throws a clear message if a project still holds both screen-mode
  types (e.g. imported/legacy JSON), instead of silently routing to one backend and dropping the
  other screens. Contracted in `scripts/check_msx2_project_profiles.mjs`.

### Choosing a mode per game type (author guidance)

- Single-screen / grid / puzzle / board, color-by-cell acceptable → **Tile (SCREEN 4)**.
- Scrolling or full-room action, rich multicolor art, no clash → **Bitmap room (SCREEN 5)**.
- Mostly static rooms + sprites for actors → either; SCREEN 5 if clash is the problem,
  SCREEN 4 if ROM/CPU budget is tight and the tile look is fine.

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

> Correction / mode note (2026-06-16): the OpenMSX trace shows Vampire Killer
> runs in **GRAPHIC 4 = SCREEN 5** (16-color packed bitmap, `R0=0x06`,
> 128-byte/4bpp stride), NOT in GRAPHIC 3. Its block composition uses the **VDP
> command engine** (`HMMM`/`LMMM`/`HMMV`/`LINE`), which **only works in bitmap
> modes (GRAPHIC 4/5/6/7), never in GRAPHIC 3**.
>
> Naming caveat: Mideas has **two** MSX2 routes both labelled "SCREEN 4":
> - `msx2-screen4-pattern`: a genuine GRAPHIC 3 tile mode (pattern/color/name
>   tables). It has the 2-color-per-cell clash and **cannot** run the command
>   engine; its "composition" is writing the name table (cheap).
> - `msx2-screen4-bitmap-room`: only *named* SCREEN 4. At runtime it does
>   `CHGMOD 5` and sets sprite mode 2 tables at `F400/F600/F800` — i.e. the
>   **actual VDP mode is SCREEN 5 / GRAPHIC 4** (the generator's own comment in
>   `msx2Screen5BitmapRoomGenerator.ts` says so). This backend DOES use the
>   command engine and IS the Vampire Killer technique.
>
> So the VK composer is available in Mideas through `msx2-screen4-bitmap-room`,
> which is SCREEN 5 under a "SCREEN 4" route name. Just don't expect command-engine
> helpers to work on the GRAPHIC 3 `msx2-screen4-pattern` path. See
> `docs/project/MSX2_BITMAP_MULTICOLOR_STUDY.md`.

The Vampire Killer OpenMSX research in
`research/vampire_killer_openmsx/report.md` gives a concrete target style for
Mideas MSX2. The useful lesson is not to copy game code, but to copy the
architecture:

- author with tiles/cells in Mideas;
- export/load as **SCREEN 5** bitmap resources (the command-engine composer
  requires a bitmap mode);
- use V9938 commands to compose the visible page;
- keep hardware sprites for moving actors.

This should be treated as an MSX2 backend direction only. It must not change
the SCREEN 2 tilebank backend. Screen Editor implementation planning lives in
`docs/project/MSX2_SCREEN_EDITOR_COMPOSED_ROOM_PLAN.md`.

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
