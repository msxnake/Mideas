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

### SCREEN 5 backend de-tangling (2026-08-02)

Phased clean-up of the three SCREEN 5 routes. Every phase that touches a generator
runs under `npm run test:generator-byte-identical`, which hashes the generated
`unitedFiles.asm` (and optionally the glass.jar ROM) for 7 fixtures covering all
three routes. Record the baseline BEFORE the change; re-recording afterwards
voids the proof.

- **Phase 1 — DONE.** Shared presentation data converters in
  `screen5PresentationData.ts`. The three private copies had already diverged:
  one clamped hex-derived palette levels, and only the bitmap-room one accepted
  the nested `data.packedPixels` shape from the PNG importer (the other two
  rendered a black screen for import-only assets). Output byte-identical.
- **Phase 2 — PARTIALLY DONE, and re-scoped.** The plan assumed the wipe ASM was
  triplicated. It is not. Reading the bodies shows **three different engines**
  for the same six effects:

  | | Presentation | Flow walker | Bitmap-room intro |
  |---|---|---|---|
  | Fill primitive | BIOS `FILVRM`, raw VRAM bytes | command engine, `gf_fill_rect` + `GF_CMD_*` in RAM | command engine, registers direct (HL=DX, DE=DY, BC=NX, A=NY) |
  | Coordinates | byte offsets from `vramBase` | pixels | pixels |
  | Step granularity | 1 byte-column (2px) / 2 scanlines | 4px / 4-line bands | 2px / 2-line bands / 8x8 blocks |
  | Frame sync | `halt` | `halt` | `bitmap_intro_frame_wait` (restores R#15) |
  | Diagonal wipe | ROM table of rects + `clear_screen5_rect` | ROM table of DX,DY words, 16x16 blocks | computed, 8x8 blocks, uses `player_x`/`player_y` as scratch |

  So the same named effect runs at different speeds on different backends.
  Merging the ASM is a **behaviour change needing OpenMSX verification**, not a
  refactor, and it cannot pass the byte-identical harness by construction.

  What was unified instead (byte-identical): the effect **vocabulary**, now in
  `screen5TransitionEffects.ts`. It previously lived in three generators plus the
  editor dropdown, so adding an effect meant editing four lists and getting a
  runtime "not supported" from whichever one was missed. Two contract checks in
  `check_msx2_gameflow_contract.mjs` now hold the four in agreement.

  Remaining, as a separate piece of work: migrate the presentation backend's
  FILVRM wipes to the command engine so all three share one implementation. This
  is also a speed-up (the presentation backend is the oldest and slowest of the
  three), but it changes on-screen timing and needs hardware sign-off.
- **Phase 0 (renamed F1) — DONE 2026-08-02.** There are now exactly THREE
  backends, named after the VDP mode they really run in: `screen2`, `screen4`,
  `screen5`. The two SCREEN 5 routes collapsed into one backend; which emitter
  builds the ROM (`Screen5Emitter` = `bitmap-rooms` | `presentation`) is an
  internal detail resolved in `resolveGraphicsTarget()`, not part of the id.

  All six old ids (`screen2-tilebank`, `msx2-screen4-pattern`,
  `msx2-screen4-bitmap-room`, `msx2-screen5-presentation`, plus the two already
  deprecated) are accepted on input indefinitely and mapped in
  `normalizeGraphicsBackendId()`, so existing project JSON keeps working.

  Resolution priority is unchanged, including the fact that the GameFlow
  `purpose` beats an explicit `targetGraphicsBackend`; that order is now held by
  a contract check that compares positions inside the resolver rather than just
  looking for both strings.

  Verified byte-identical (ASM and ROM) across all 7 harness fixtures, plus three
  new alias-equivalence cases proving `legacy id == new id` generates the same
  ASM. Skills' `supportedBackends` migrated (`screen4`, `screen5`).

  **Follow-up done 2026-08-03:** the `; Backend: ...` markers emitted into the
  generated ASM now carry the current names, spelling out the emitter alongside
  the backend:

  | Marker | Emitted by |
  |---|---|
  | `; Backend: screen5 (presentation)` | strict-shape presentation |
  | `; Backend: screen5 (presentation chain)` | multi-scene chain |
  | `; Backend: screen5 (presentation chain -> screen4 runtime)` | mixed ROM |
  | `; Backend: screen5 (gameflow walker)` | generic node walker |
  | `; Backend: screen5 (bitmap rooms)` | bitmap-room game runtime |

  The SCREEN 4 project-slice artifact also reports `backend: 'screen4'`.

  Because these are comments, the check is inverted: `--rom-only` on the harness
  asserts that every ROM hash holds while the ASM hashes move. All 9 ROMs came
  out identical, so the baseline was re-recorded with that as the evidence.
- **F2 (GameFlow purposes) — DONE 2026-08-02.** The flow `purpose` was the real
  backend selector and had three values, two of which were both SCREEN 5. It is
  now `screen4` | `screen5`, and the MSX2 GameFlow editor shows two mode buttons
  instead of three.

  `screen5` no longer says which emitter runs. That is resolved by
  `resolveMsx2Screen5Emitter()` in `utils/msx2GameFlowPurpose.ts`: **bitmap rooms
  win**, because a project with rooms is a game that may also carry a title
  screen, and building only the title screen while dropping the rooms is never
  what the author meant. This inverts the old auto-detection order, which put
  presentation first. The three legacy purposes still PIN the emitter, so every
  project saved before the merge compiles through exactly the same generator.

  The editor calls the same helper as the generator, so the UI cannot validate a
  flow against rules the ROM will not follow.

  All `purpose === '...'` comparisons — four generators, the editor, the export
  modal and the CLI export script — now go through the shared predicates. The
  harness caught why that matters: `msx2Screen5BitmapRoomGenerator` filtered its
  flows by the literal `'screen4-bitmap-runtime'`, so with the new purpose the
  intro AND the whole GameFlow dispatcher silently vanished from the ROM.

  Verified byte-identical (ASM and ROM) plus two new purpose-equivalence cases
  proving `screen4-bitmap-runtime == screen5` on a project that has both rooms
  and a presentation asset.
- **F3 (mixed route) — DONE 2026-08-03.** The mixed SCREEN 5 intro + SCREEN 4
  runtime ROM is now **composed** instead of generated-then-rewritten.

  `Msx2Screen4Config.host` carries the hooks a host needs: `runtimeEntryLabel`,
  `bootEntryLabel`, `residentPrologueAsm`, `trailingAsm`, `headerTitle` and
  `extraHeaderMarkers`. All default to standalone behaviour. That deleted
  `renameScreen4EntryForMixedAsm()`, which did a global `\binit_rom\b` replace
  over the whole output and then re-patched the cartridge boot vector.

  The fixture gap is closed: `test/msx2-mixed/mixed_screen5_screen4_project.json`
  (regenerate with `scripts/create_msx2_mixed_screen5_screen4_fixture.mjs`),
  covered by the harness in both simple32k and Konami MegaROM.

  Two things the new coverage exposed:
  - The intro chain only accepts a `Transition` after a scene when ANOTHER
    `Screen5Presentation` follows it, so `Screen5Presentation -> Transition ->
    End` is not a chain and silently falls back to the plain presentation
    backend. The fixture goes straight to `End`.
  - `init_konami8k_fixed_bank0_banks` is emitted **only** for Konami MegaROM, so
    on simple32k the old two-line strip never matched and a redundant
    `call map_page2_to_cart_primary` survived into the banked intro. It is a
    harmless re-map; removing it would change the ROM, so it is kept and
    documented rather than "fixed" inside a refactor.

  The remaining strip now throws when the intro's bring-up is missing, with the
  patterns **anchored to line start** — an unanchored version still matched a
  re-indented emitter, which is exactly the silent pass this phase set out to
  remove.

  Verified byte-identical (ASM and ROM) across all 9 harness fixtures.
- **Phase 4 — deferred.** Collapse the presentation backend's strict-shape flow
  resolver into the generic walker (~600 lines). The strict resolver is the
  reference for the current smokes, so this waits until the walker has more
  hardware mileage.

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
