# Vampire Killer SCREEN 4 Ideas for Mideas

Source analysis: `research/vampire_killer_openmsx/report.md`.

> Correction (2026-06-16): Vampire Killer actually runs in **SCREEN 5
> (GRAPHIC 4, 16-color packed bitmap)**, confirmed by the trace (`R0=0x06`,
> 128-byte/4bpp stride, active VDP command engine). The command engine only works
> in bitmap modes (SCREEN 5/6/7/8), never in GRAPHIC 3.
>
> Mideas naming caveat: there are two "SCREEN 4" routes. `msx2-screen4-pattern`
> is real GRAPHIC 3 tile mode (clash, no blitter). `msx2-screen4-bitmap-room` is
> only *named* SCREEN 4 — at runtime it does `CHGMOD 5` (real SCREEN 5) and
> composes a 4bpp bitmap with the command engine, i.e. the actual VK technique.
> So the section titles below saying "SCREEN 4" refer to that bitmap-room route,
> whose real hardware mode is SCREEN 5. See
> `docs/project/MSX2_BITMAP_MULTICOLOR_STUDY.md` and the mode note in
> `docs/project/MSX2_GRAPHICS_BACKEND_PLAN.md`.

## Core Takeaway

Vampire Killer is a useful model for the Mideas MSX2 path because it treats
SCREEN 5 as a composed bitmap scene, not as a live hardware tilemap.

The authoring model can stay tile/cell based in Mideas, but the runtime/export model should be:

1. Build or stage an offscreen bitmap atlas in VRAM.
2. Clear the visible page.
3. Compose the room with V9938 block-copy commands.
4. Draw HUD text/icons/bars with V9938 commands.
5. Put actors on top with MSX2 hardware sprites.

This matches the current Mideas direction: preserve editor data, optimize/export differently for MSX2.

## Ideas Worth Bringing Into Mideas

### 1. SCREEN 4 Room Composer

Current Mideas already has raw, `blocks2x2`, and `blocks4x4` export analysis for screen maps. Vampire Killer suggests one more MSX2-specific export target:

- Keep authoring as 32x24 cells of 8x8.
- Export a SCREEN 4 room as a command list or packed block map.
- Runtime expands that list into V9938 copies.

Recommended command units:

- `8x8` copy for normal background cells.
- `16x16` copy for larger props, doors, decorations, or metatile expansion.
- Avoid requiring `32x32` as a native runtime primitive; larger structures can expand into repeated `8x8`/`16x16` commands.

This lines up with the OpenMSX trace:

- most background commands were `8x8`;
- some were `16x16`;
- no direct `32x32` screen copies were observed.

### 2. Offscreen Atlas for SCREEN 4

Add an MSX2 export concept of a `screen4 atlas page`:

- Fonts and HUD icons can live beyond visible y=192/212.
- Room blocks can be staged in offscreen VRAM.
- The runtime copies from atlas coordinates to visible page coordinates.

Practical Mideas UI/export idea:

- Let a TileBank or generated atlas expose `(sx, sy, w, h)` for each block.
- Let ScreenMap cells reference atlas entries.
- Export a table of `{sx, sy, dx, dy, w, h, command}` records or compressed equivalents.

### 3. Procedural HUD Backend

Mideas already has HUD element types such as `EnergyBar`, `BossEnergyBar`, icons, counters, and text. Vampire Killer suggests how the SCREEN 4 backend should render them:

- Text: copy 8x8 glyphs from an offscreen font atlas.
- Icons: copy 16x16 icon blocks.
- Bars: do not store bar graphics as tiles; draw them with V9938 fill and line commands.

Energy bar primitive:

- outer box: fill/clear rectangle, then line frame;
- inner fill: rectangle whose width depends on variable value;
- redraw only the changed fill area where possible.

This should be a separate MSX2 HUD renderer, not a branch inside the SCREEN 2 HUD path.

### 4. Runtime Command Helpers

The report identifies a clear helper pattern:

- generic VRAM-to-VRAM copy helper;
- rectangle fill helper;
- line helper;
- 16x16 block helper.

Mideas should mirror that as stable generated ASM routines for SCREEN 4:

- `msx2_vdp_copy_rect`
- `msx2_vdp_fill_rect`
- `msx2_vdp_line_h`
- `msx2_vdp_line_v`
- `msx2_draw_glyph_8x8`
- `msx2_draw_icon_16x16`
- `msx2_draw_energy_bar`

The generator can emit data-driven calls to those helpers instead of inlining long VDP register sequences everywhere.

### 5. Full Room Load Instead of Scroll First

Vampire Killer changes rooms by loading/recomposing a full bitmap page. That is a good first target for Mideas MSX2:

- enter room;
- clear page;
- compose room background;
- draw static HUD frame/text;
- initialize sprites;
- enter gameplay loop.

Smooth scrolling can stay a later feature. Full-room composition is simpler, easier to validate in OpenMSX, and fits current ScreenMap/WorldMap transitions.

### 6. Hardware Sprites as Actors, Bitmap as World

Keep this separation:

- background and HUD are bitmap pixels;
- player/enemies/items are hardware sprites;
- complex actors may use multiple overlaid sprites.

Simon used four hardware sprites for a normal frame: two vertical 16x16 cells times two overlaid color planes. Mideas can expose this as an MSX2 sprite composition option:

- single 16x16 sprite;
- 16x32 actor made from two sprites;
- multicolor overlay mode using two sprites per cell;
- optional horizontal mirror generation.

This should build on the current MSX2 sprite MVP rather than reuse the MSX1 sprite path.

## Suggested Mideas Roadmap

### Phase A: Export-Only SCREEN 4 Composer

Implement a generated command-list path for one static SCREEN 4 screen:

1. Clear visible page.
2. Stage atlas data.
3. Emit and execute `8x8`/`16x16` copy commands.
4. Compile with Glass.
5. Capture OpenMSX screenshot and compare visually.

No gameplay required.

### Phase B: Procedural HUD Renderer

Implement SCREEN 4 HUD primitives:

1. 8x8 glyph atlas.
2. 16x16 icon copy.
3. Energy bar fill/line renderer.
4. GlobalVariable-backed numeric field update.

Validation should include a screen with score, stage text, player energy, boss energy, and icon slots.

### Phase C: Room Transition Runtime

Use WorldMap/GameFlow transitions to load a second screen:

1. Recompose background.
2. Redraw HUD static elements.
3. Reinitialize sprite SAT.
4. Preserve selected runtime variables such as score/lives.

This directly follows the Vampire Killer room-load model.

### Phase D: Multi-Sprite Actor Composition

Extend MSX2 sprite export/runtime:

1. 16x32 player from two 16x16 cells.
2. Optional two-plane overlay for richer color.
3. Per-frame SAT update from entity/player state.
4. Sprite color table generation per frame.

## What Not To Copy

- Do not migrate Mideas editor storage into a native metatile-only model.
- Do not mix SCREEN 4 branches into the existing SCREEN 2 generator internals.
- Do not require 32x32 block primitives just because some visual props are large.
- Do not make HUD bars as static tile graphics when V9938 fill/line commands are cheaper and more flexible.

## Immediate Best Candidate

The best next implementation is the SCREEN 4 procedural HUD backend, because Mideas already has HUD element data and the Vampire Killer report gives concrete command shapes:

- text as 8x8 atlas copies;
- icons as 16x16 atlas copies;
- energy bars as `fill + frame + variable-width fill`.

That would give visible MSX2 authenticity quickly without disrupting screen editor storage.
