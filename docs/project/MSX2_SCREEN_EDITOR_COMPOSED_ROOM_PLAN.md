# MSX2 Screen Editor Plan: Composed-Room Workflow

Purpose: modify the Mideas MSX2 room editor so SCREEN 4 projects can be authored around a broad composed-room model: tile-friendly editing, bitmap-style screen composition, procedural HUD/status areas, and hardware sprites on top.

This is an editor plan. Runtime/export work should remain in the MSX2 backend plan:

- `docs/project/MSX2_GRAPHICS_BACKEND_PLAN.md`
- `docs/project/VAMPIRE_KILLER_SCREEN4_IDEAS_FOR_MIDEAS.md`

## Design Rules

- Keep the canonical screen storage unchanged: `layers.background`, `layers.collision`, `layers.effects`, `layers.entities`.
- Apply these changes only when the current mode is `SCREEN 4 (Graphics II)` or native MSX2 screen assets.
- Do not modify the SCREEN 2 tilebank workflow.
- Treat the editor grid as 8x8 cells, because that is the useful authoring unit even when runtime uses bitmap copies.
- Keep collision/effects tile-based, independent from any block/atlas optimization.
- Make every MSX2 feature preview-only or metadata-only until the generator consumes it.

## Phase 1: MSX2 Screen Composition Panel

Add a dedicated right-panel section next to the existing `ScreenOptimizationPanel`.

Working name: `MSX2CompositionPanel`.

It should show:

- screen mode and pixel metrics: `256x192`, `32x24`, `8x8`;
- active area split: top HUD rows, gameplay rows, bottom HUD rows;
- estimated visible composition:
  - raw 8x8 cells;
  - shared 2x2 blocks;
  - shared 4x4 blocks;
  - 8x8/16x16 command estimate;
- warning if side HUD margins exist, because MSX2 command composition should prefer full-width gameplay with top/bottom HUD bands;
- planned runtime primitive summary:
  - background: V9938 copy;
  - HUD bars: V9938 fill/line;
  - sprites: hardware SAT.

Acceptance:

- Visible only for SCREEN 4/MSX2.
- Does not change map data.
- Reuses existing optimization analysis where possible.

Likely files:

- `components/editors/ScreenEditor.tsx`
- `components/screen_editor/ScreenOptimizationPanel.tsx`
- new `components/screen_editor/MSX2CompositionPanel.tsx`

## Phase 2: MSX2 Overlay Modes

Extend the current optimization overlay with MSX2-specific overlays.

New overlay choices:

- `Off`
- `2x2 reuse`
- `4x4 reuse`
- `8x8 copy grid`
- `16x16 candidate props`
- `HUD/static bands`

Behavior:

- `8x8 copy grid`: shows every cell that would become a V9938 8x8 copy.
- `16x16 candidate props`: highlights aligned 2x2 visual groups that repeat or use the same tile stamp.
- `HUD/static bands`: shades non-active-area rows and labels them as static HUD/composition area.

This must be visualization only. Painting, copy/paste, collision, and entity placement must continue to work exactly as today.

Acceptance:

- Overlay can be toggled without changing project JSON.
- Overlay respects zoom and active area.
- Overlay never covers entity handles or selected-cell affordances in a way that blocks editing.

Likely files:

- `components/screen_editor/ScreenGrid.tsx`
- `components/screen_editor/ScreenOptimizationPanel.tsx`
- new shared overlay model in `components/screen_editor/msx2CompositionAnalysis.ts`

## Phase 3: Active Area Presets for MSX2

Add SCREEN 4 presets that align with common HUD/status-band layouts.

Presets:

- `Full gameplay`: active area `0,0,32,24`.
- `Top HUD 4 rows`: active area `0,4,32,20`.
- `Top HUD 4 + bottom HUD 2`: active area `0,4,32,18`.
- `Top HUD 5 rows`: active area `0,5,32,19` but warn that odd row counts are less friendly for 2x2/4x4 block modes.
- `Top status band`: active area `0,4,32,20`, HUD guide at rows `0-3`.

The existing snap logic already understands top/bottom HUD row alignment. The UI should expose that as intentional MSX2 presets.

Acceptance:

- Presets update `activeAreaX/Y/Width/Height`.
- Presets show whether they are valid for raw, 2x2, and 4x4 export.
- Side margins are cleared when applying MSX2 presets.

Likely files:

- `components/screen_editor/ScreenEditorToolbar.tsx`
- `components/editors/ScreenEditor.tsx`

## Phase 4: MSX2 HUD Authoring Improvements

Make the HUD editor show which elements can become procedural SCREEN 4 commands.

For each HUD element, display an MSX2 export hint:

- `Score`, `NumericField`, `SceneName`: 8x8 glyph atlas copies.
- `Lives`, `ItemDisplay`: 16x16 icon atlas copies plus optional numeric glyphs.
- `EnergyBar`, `BossEnergyBar`: fill/line rectangle primitive.
- imported HUD frame: static bitmap/tile frame that can be composed once on room load.

Add a generic `Status Bar` template:

- width: `64`;
- height: `6` outer, `4` inner;
- border color slot: default `14`;
- fill color: configurable;
- background color: configurable;
- orientation: horizontal;
- max value: `16` or `64`, selectable.

Acceptance:

- Existing HUD projects still load.
- New template is only a default details shape; it does not require generator support yet.
- Preview matches the intended 66x6 outer / 64x4 inner style.

Likely files:

- `components/editors/HUDEditorModal.tsx`
- `types.ts` if new detail fields need explicit typing

## Phase 5: Atlas Planning UI

Add an MSX2 atlas planning preview, not a full atlas editor yet.

Show:

- estimated 8x8 glyph atlas footprint;
- 16x16 icon count;
- unique background block count;
- predicted offscreen VRAM rows needed;
- whether visible page plus atlas fits the selected VRAM layout.

Initial assumptions:

- visible page starts at VRAM `0x00000`;
- SCREEN 4 row stride is 128 bytes;
- atlas can live beyond visible rows, using y coordinates after the visible playfield when the runtime supports it.

Acceptance:

- Panel is informative only.
- No generator contract is required in this phase.
- Warnings are clear when atlas estimates exceed simple limits.

Likely files:

- new `components/screen_editor/MSX2AtlasPreviewPanel.tsx`
- helper analysis near screen optimization utilities

## Phase 6: Export Contract Preview

Add a read-only `MSX2 Export Contract` section for the selected screen.

It should list the intended generated resources:

- `screen.clear`: visible page clear/fill;
- `screen.backgroundCopies`: 8x8/16x16 block-copy commands;
- `screen.hudStatic`: static HUD frame/text/icons;
- `screen.hudDynamic`: variables, bars, counters;
- `screen.spriteInit`: hardware sprite SAT/pattern/color initialization;
- `screen.collision`: RAM or ROM collision map;
- `screen.effects`: RAM or ROM effects map.

Acceptance:

- Displays a stable JSON-like preview.
- Does not export files yet.
- Helps compare editor intent against later `project_slice.json`, `asset_storage_policy.json`, and generated ASM.

Likely files:

- new `components/screen_editor/MSX2ExportContractPanel.tsx`
- `ScreenEditor.tsx`

## Phase 7: Validation Workflow

Add tests/validation after each implemented slice.

Minimum checks:

- `npm run build`
- manual Screen Editor smoke for SCREEN 2 to ensure no regression;
- manual Screen Editor smoke for SCREEN 4:
  - create or open a native MSX2 screen;
  - apply top HUD preset;
  - toggle overlays;
  - add status bars;
  - confirm project JSON remains backward compatible.

Later, when generator support exists:

- export SCREEN 4 ROM;
- compile with Glass;
- capture OpenMSX screenshot;
- compare HUD/room composition visually.

## Recommended Implementation Order

1. Add `MSX2CompositionPanel`.
2. Add Active Area presets for SCREEN 4.
3. Add HUD export hints and generic Status Bar template.
4. Add MSX2 overlay modes.
5. Add atlas planning preview.
6. Add export contract preview.
7. Wire generator consumption in a separate backend task.

## Non-Goals

- Do not replace the Screen Editor grid with a native bitmap paint editor.
- Do not remove raw tile editing.
- Do not change SCREEN 2 tilebank export.
- Do not make 32x32 a required runtime block.
- Do not implement runtime V9938 command generation inside React components.

## First Concrete Task

Implement `MSX2CompositionPanel` and SCREEN 4 Active Area presets.

This gives immediate authoring value, is low risk, and prepares the UI for the later procedural HUD and atlas work.

## Implementation Notes

- The MSX2 work belongs to the native `MSX2 SCREEN 4 Rooms` editor (`msx2screen` / `Msx2Screen4RoomEditor`), not the generic MSX1 `ScreenEditor`.
- `MSX2CompositionPanel` is now wired into the native room editor with 16x12 room cells, 16x16 authoring tiles, 256x192 pixels, and room-specific Active Area presets.
- The native room canvas now exposes MSX2 composition overlays: `2x2 reuse`, `4x4 reuse`, `8x8 copy grid`, `16x16 candidate props`, and `HUD/static bands`. These overlays are visual-only and do not alter project JSON.
- `MSX2HudPlanPanel` adds a native MSX2 HUD planning/editor surface with generic widgets (`bar`, `counter`, `icon`, `text`), per-widget bindings, placement, dimensions, colors, export hints, and quick templates for each widget kind.
- `MSX2AtlasPreviewPanel` adds an informational atlas footprint preview for glyphs, icons, unique room tiles, offscreen rows, and simple VRAM fit.
- `MSX2ExportContractPanel` adds a read-only JSON-like contract preview for clear, background copies, HUD static/dynamic widgets, widget primitives, per-widget record offsets, auxiliary HUD metadata tables, sprite initialization, collision, effects, and behavior resources.
- `Msx2SpriteEditor` now exposes MSX2 hardware color-plane diagnostics: stacked rows, 3+ color rows, maximum layers per 16x16 cell, per-scanline layer counts, and the transparent-mask plus V9938 CC/OR-color trick used for multi-color character details.
- `Msx2SpriteEditor` now includes a generic MetaSprite layout panel for 1x1, 1x2, 2x1, and 2x2 compositions. It resizes frames, stores 16x16 hardware-part offsets, overlays those parts on the paint grid, and reports the resulting hardware sprite cost with OR/mask layers included.
- `Msx2Screen4Runtime` now carries HUD metadata fields so authoring settings survive project save/load.
- The MSX2 SCREEN 4 generator now emits per-room HUD metadata tables (`msx2_screen_hud_*`), `msx2_screen_hud_widget_record_size EQU 12`, per-screen widget record offsets, flat authored HUD widget records, and auxiliary per-widget tables for icon tile index, text strings, and custom variable names next to the existing `requiredCollectibles` and `initialAir` tables.
- Actual SCREEN 4 VDP drawing must be data-driven from `hudWidgets`; hardcoded HUD bars were avoided because each MSX2 game needs different HUD composition.
- The MSX2 layers smoke fixture now carries authored `hudWidgets` on multiple rooms, and the smoke validates those widgets in JSON plus `msx2_screen_hud_widget_*` ASM records before compiling the ROM with Glass.
