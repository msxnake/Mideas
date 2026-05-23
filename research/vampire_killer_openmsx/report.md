# Vampire Killer MSX2 - OpenMSX debug notes

ROM investigated:

- Path: `C:\Users\salam\Downloads\Vampire Killer (Japan, Europe)\Vampire Killer (Japan, Europe).rom`
- Size: `131072` bytes, 16 banks of 8 KB.
- SHA1: `5EF7D03B138A2023F6DEF241B671C666F97ED83B`
- SHA256: `99EABAAEB2B6C02220E131043D5A6401D0D8C5F413D89204547ADCC04D65E7E2`
- OpenMSX software DB identifies this dump as `Vampire Killer - Akumajo Dracula`, `MSX2`, Konami, 1986, mapper `Konami`.

Runs used:

- Machine: `C-BIOS_MSX2+`
- ROM type: `konami`
- Main scripts: `probe_boot.tcl`, `probe_title_game.tcl`, `probe_entities_transition.tcl`, `probe_runtime_objects.tcl`, `probe_physical_vram.tcl`.

## Confirmed screen mode

During title and gameplay, the VDP registers are stable around:

`R00=06 R01=62 R02=1F R03=80 R04=00 R05=EF R06=1F R07=00/0F R08=08 R09=80 R14=03`

This is V9938/MSX2 bitmap mode, consistent with MSX2 `SCREEN 4` / Graphic 3 style rendering, not MSX1 tiled SCREEN 2. Evidence:

- `R00=06` selects the V9938 graphic mode path.
- The visible image is present in physical VRAM page 0 as packed pixel bitmap data.
- There is no active TMS9918-style pattern/name/color tile table driving the final game screen.

Physical VRAM at gameplay (`game_22s_physical_vram.bin`) shows visible screen data from base `0x00000`; row samples using 128 bytes per 256-pixel row line up with the HUD and stage image. Example: y=16 and y=24 already contain the HUD text pixels, while y=64+ contains the room graphics.

## Fonts/text placement

The title/gameplay text is not placed as hardware character names in a SCREEN 2 name table. It is rendered as pixels into the SCREEN 4 bitmap page.

Observed placement:

- Visible page: physical VRAM base `0x00000`.
- Packed row stride: 128 bytes per 256-pixel row.
- HUD text starts around visible y=16, so its physical VRAM region starts near `0x0800` (`16 * 128`), with bytes such as `0E/E0/EE` matching white/black/red packed pixel values.
- Gameplay room graphics occupy the same page; nonzero data covers roughly `0x00000-0x06FFF`.

There may still be a compressed or raw font source in ROM banks, but the runtime placement is confirmed as bitmap VRAM, not tile font tables.

## HUD construction

The HUD is built with the V9938 command engine, not mainly by direct CPU pixel writes.

Confirmed from `probe_hud_ports_9b.log`, `probe_hud_command_summary.log`, and `probe_hud_callers.log`:

- The game writes V9938 indirect command registers through port `#9B` after setting indirect register index `R17=#20`.
- Command register groups are written for `R32-R46`:
  - `R32/R33`: source X.
  - `R34/R35`: source Y.
  - `R36/R37`: destination X.
  - `R38/R39`: destination Y.
  - `R40/R41`: width.
  - `R42/R43`: height.
  - `R44`: color for fill/line commands.
  - `R45`: argument.
  - `R46`: command.
- The common visible HUD copy command is `cmd=D0`, 8x8 or 16x16 VRAM-to-VRAM block copies.
- It also uses `cmd=C0` for rectangle fill and `cmd=70` for line drawing.

### Offscreen HUD/font atlas

The HUD text and icons are copied from offscreen VRAM, outside the visible 212-line page:

- 8x8 glyph copies usually source from `sy=320` or `sy=328`.
- 16x16 icons source from `sy=368`.
- The visible HUD destination is `dy=0`, `dy=12`, `dy=20`, `dy=28`, etc.

This means the game first has a bitmap glyph/icon atlas resident in VRAM, then composes the HUD by copying small rectangles from that atlas into visible screen coordinates.

### Main HUD commands observed

Initial screen clear/fill:

- `cmd=C0`, caller return `47E9`: clears/fills a large visible region with `dx=0 dy=0 nx=256 ny=212`. This likely resets the screen before room/HUD composition.

Text rendering:

- `cmd=D0`, helper PC `4987`, return `4AFC`: copies 8x8 glyphs from offscreen atlas to visible text positions.
- Examples:
  - `sx=024 sy=328 -> dx=008 dy=000`, `8x8`
  - `sx=152 sy=320 -> dx=016 dy=000`, `8x8`
  - `sx=248 sy=320 -> dx=024 dy=000`, `8x8`
  - These runs line up with the top text labels such as `SCORE`, `STAGE`, heart count, and `P-00`.

Life bar / meter boxes:

- `cmd=C0`, helper PC `4943`, fills rectangular areas:
  - `dx=059 dy=013 nx=066 ny=006 col=00`
  - `dx=060 dy=014 nx=064 ny=004 col=11`
  - `dx=059 dy=022 nx=066 ny=006 col=00`
  - `dx=060 dy=023 nx=064 ny=004 col=88`
- `cmd=70`, helper PCs `48A5` and `48D9`, draws horizontal/vertical line segments around the bars:
  - `dx=059 dy=013 nx=065 col=0E`
  - `dx=059 dy=018 nx=065 col=0E`
  - `dx=059 dy=022 nx=065 col=0E`
  - `dx=059 dy=027 nx=065 col=0E`

Inventory/weapon boxes:

- `cmd=70` line commands draw the box outlines around x ranges near `127`, `147`, `183`.
- `cmd=C0` fills inner box areas.

### Energy bar construction details

The two main energy bars are drawn procedurally with V9938 commands, not copied from a bitmap tile. The sequence observed in `probe_hud_command_summary.log` and `probe_hud_callers.log` is:

Player/upper bar:

1. Clear/background rectangle:
   - `cmd=C0`, `PC=4943`, return `5D0B`
   - `dx=059 dy=013 nx=066 ny=006 col=00`
2. Draw frame lines:
   - left vertical-ish segment: `cmd=70`, `PC=48D9`, `dx=059 dy=013 nx=005 col=0E`
   - top horizontal: `cmd=70`, `PC=48A5`, `dx=059 dy=013 nx=065 col=0E`
   - bottom horizontal: `cmd=70`, `PC=48A5`, `dx=059 dy=018 nx=065 col=0E`
   - right vertical-ish segment: `cmd=70`, `PC=48D9`, `dx=124 dy=013 nx=005 col=0E`
3. Fill active meter area:
   - `cmd=C0`, `PC=4943`, return `45B3`
   - `dx=060 dy=014 nx=064 ny=004 col=11`

Enemy/lower bar:

1. Clear/background rectangle:
   - `cmd=C0`, `PC=4943`, return `5D0B`
   - `dx=059 dy=022 nx=066 ny=006 col=00`
2. Draw frame lines:
   - left: `cmd=70`, `PC=48D9`, `dx=059 dy=022 nx=005 col=0E`
   - top: `cmd=70`, `PC=48A5`, `dx=059 dy=022 nx=065 col=0E`
   - bottom: `cmd=70`, `PC=48A5`, `dx=059 dy=027 nx=065 col=0E`
   - right: `cmd=70`, `PC=48D9`, `dx=124 dy=022 nx=005 col=0E`
3. Fill active meter area:
   - `cmd=C0`, `PC=4943`, return `4525`
   - `dx=060 dy=023 nx=064 ny=004 col=88`

So the visual bar is a 66x6 outer box, with a 64x4 inner fill. Full width starts at `x=60` and spans `64` pixels; changing life should only need changing the fill width and/or clearing the missing part. The traced startup shows full-width fills for both bars. The `col` values are VDP command color register values as written by the game; the visible palette interpretation depends on the active V9938 palette.

Heart/icon copies:

- `cmd=D0`, helper PC `4987`, copies 16x16 blocks from `sx=080 sy=368`:
  - `dx=128 dy=012 nx=016 ny=016`
  - `dx=148 dy=012 nx=016 ny=016`
  - `dx=164 dy=012 nx=016 ny=016`
- These correspond to visible HUD icons/slots near the center top.

### HUD helper routines

Observed helper PCs:

- `PC=4987`: generic VRAM-to-VRAM rectangle copy through command registers, usually `cmd=D0`.
- `PC=4943`: rectangle fill helper, `cmd=C0`.
- `PC=48A5` and `PC=48D9`: line drawing helpers, `cmd=70`.

Observed return addresses during HUD creation:

- `4AFC`: repeated 8x8 glyph-copy caller, 39 HUD calls in the focused trace.
- `5D0B`: bar background/fill caller.
- `4525`, `45B3`: player/enemy bar fill callers.
- `452B`, `452E`: icon copy callers.
- `8EB7`, `8EE9`: item/box related callers in banked code.

Interpretation: the fixed bank contains low-level VDP command helpers around `48xx/49xx`; higher-level HUD code emits a sequence of glyph IDs and rectangle definitions, then calls those helpers to compose the HUD.

### Practical model for reproducing the style

To implement a similar HUD in Mideas/MSX2:

1. Use SCREEN 4 bitmap mode.
2. Keep a small font/icon atlas in offscreen VRAM, e.g. source rows beyond visible y=212.
3. For text, map each character to an 8x8 source rectangle and issue V9938 HMMM-style VRAM-to-VRAM copies to visible `(x, y)`.
4. For health bars and boxes, use V9938 fill and line commands instead of drawing each pixel manually.
5. Redraw only changed numbers/bars/icons during gameplay; static labels and frames can be composed once when entering the room.

## Mapper and bank switching

The dump is a 128 KB Konami mapper ROM with 16 x 8 KB banks.

Confirmed mapper writes:

- `0x6000`, `0x8000`, `0xA000` are used as bank registers.
- Common base mapping during boot/title: writes `6000=01`, `8000=02`, `A000=03`.
- During transition and runtime service calls the game repeatedly maps banks `0E/0F`, then restores `02/03`, and also maps `09/0A`, `0B/0C/0D` during the screen load path.

Observed mapper helper PCs:

- `PC=533D/5342/5348`: writes `6000/8000/A000` with banks `01/02/03`.
- `PC=5368/536E/5374`: writes `6000/8000/A000` with banks `0B/0C/0D`.
- `PC=5380/5386`: writes `8000/A000` with banks `09/0A`.
- `PC=4033/4038`: maps `8000=0E`, `A000=0F`.
- `PC=4042/4048`: restores `8000/ A000` to either `02/03` or `0C/0D`, depending on caller context.

Interpretation: the game has a small always-available code area with bank-switch wrappers and calls banked routines/data for music, screen loading, object logic, and room data.

## Screen/room transition

Reproduction:

1. Boot ROM.
2. Wait to title at ~10 seconds.
3. Press SPACE.
4. Gameplay is visible around ~18 seconds.

The transition is not a continuous tile-scroll. It is a room/screen load:

- SPACE on the title enters a loading path.
- The game maps banks `0E/0F`, `09/0A`, and `0B/0C/0D`.
- It performs tens of thousands of VDP data/control writes while building the new bitmap page.
- At gameplay it returns to stable SCREEN 4 registers and active runtime code.

The screen image is therefore built by bulk bitmap/command transfers into VRAM, likely from banked compressed or packed graphics data, plus later per-frame sprite/object updates.

## Screen creation pipeline

Confirmed model for gameplay screen creation:

1. The game sets V9938/MSX2 bitmap mode, equivalent to SCREEN 4 / Graphic 3 style rendering.
2. The visible page is physical VRAM base `0x00000`, with a 128-byte stride for each 256-pixel row.
3. It clears the visible page with a V9938 fill command:
   - `cmd=C0`, helper `PC=4943`
   - observed full clear: `dx=0 dy=0 nx=256 ny=212`.
4. It maps banked ROM data through the Konami mapper. Screen load paths use banks such as `09/0A`, `0B/0C/0D`, and `0E/0F`.
5. Room graphics are composed into the bitmap page from offscreen VRAM graphic blocks:
   - most visible room copies are `8x8`, `cmd=D0`, helper `PC=4987`;
   - some pieces are `16x16`, `cmd=98`, helper `PC=4A24`;
   - no direct `32x32` visible-screen copies were observed.
6. The HUD is drawn on the same visible bitmap page:
   - text/glyphs: 8x8 copies from offscreen rows `sy=320/328`;
   - icons: 16x16 copies from `sy=368`;
   - bars and frames: V9938 fill/line commands (`cmd=C0`, `cmd=70`).
7. Hardware sprites are then placed over the bitmap:
   - SAT at physical VRAM `0xF600`;
   - sprite patterns at `0xF800`;
   - sprite color table at `0xF400`.

The screen is therefore not a live hardware tilemap. It is a composed SCREEN 4 bitmap: room background plus HUD pixels in VRAM, with moving actors handled by hardware sprites on top.

## Background tile/block construction

The game does not use MSX1-style hardware tiles for the final playfield. In gameplay it is in MSX2/V9938 SCREEN 4 bitmap mode, so the room is a bitmap page. However, the bitmap is composed from small reusable offscreen graphic blocks using V9938 command transfers.

Focused command-size trace: `probe_tile_block_sizes.log`.

Observed during initial gameplay plus the garden-to-interior transition:

- Total V9938 command writes captured: `5096`.
- Visible screen commands: `4873`.
- Visible screen block copies:
  - `4626` commands of `8x8`, `cmd=D0`, caller `PC=4987`.
  - `247` commands of `16x16`, `cmd=98`, caller `PC=4A24`.
- No `32x32` visible-screen block copy appeared as a direct command size in this trace.

Interpretation:

- The main room graphics are effectively built from `8x8` bitmap cells copied from an offscreen atlas into the visible SCREEN 4 page.
- `16x16` blocks are also used, but the trace suggests they are special/animated/larger objects or grouped decorative pieces rather than the universal map unit. Door graphics are a confirmed example: `sx=032/048 sy=368 -> dx=064 dy=144 nx=016 ny=016`.
- Larger scenery such as walls, floors, columns, windows, and room patterns are not copied as native `32x32` blocks. They appear to be assembled from repeated `8x8` cells, and possibly higher-level metatiles in game data expand into multiple `8x8` copies.

Practical model:

1. Banked room data selects a sequence of block IDs or metatile IDs.
2. The renderer resolves those IDs to source rectangles in an offscreen bitmap atlas.
3. Most background writes are `8x8` VRAM-to-VRAM copies.
4. Some interactive/decorative elements use `16x16` copies.
5. The final result is normal SCREEN 4 bitmap pixels, not a live tilemap.

### Real gameplay start

A reliable start sequence needs two SPACE presses:

1. First SPACE from the title prompt.
2. Second SPACE confirms the `PLAY START` state.

With that sequence the game starts at the garden (`STAGE-00`, `P-02`). A single SPACE can leave the run in a title/demo-like path, where direction input may return to the title and contaminate input tests.

### Door transition: garden to interior

Holding RIGHT from real gameplay start reaches the door and transitions to the interior. Evidence:

- `walktrans_31.png`: player approaches the building entrance.
- `walktrans_34.png`: player is inside the doorway.
- `walktrans_40_release.png`: new interior room is loaded, HUD shows `STAGE-01`.

The transition is a full room load, not scroll:

- The visible bitmap changes from the garden to a newly composed interior screen.
- HUD is redrawn, including the stage number.
- Mapper writes spike heavily during the transition; the focused run observed 4658 mapper writes after tracing started near the door.
- VDP command activity during the transition included 75 HUD commands and 801 visible-screen commands.

Observed variables around the transition:

- Before door (`doorfocus_31_before_door`): `C426=2C00`, `C42E=01`, `C42F=01`.
- In doorway (`doorfocus_35_in_door`): `C000=04`, `C410=03:01:01:01`, `C426=E800`, `C42E=00`, `C42F=00`.
- Inside (`doorfocus_39_inside`): `C000=05`, `C410=02:01:01:01`, `C426=7800`, `C42E=02`, `C42F=02`.

Interpretation:

- `C000` looks like a high-level game/substate byte: it changes from normal gameplay (`05`) to door/transition state (`04`) and returns to gameplay (`05`).
- `C426/C427` act like player horizontal position or screen-space X/state coordinate; they change continuously with movement and are reset/rebased by the room transition.
- `C42E/C42F` change with movement/animation/collision state and reset during doorway transition.
- `C410-C41F` is likely the primary player/control slot header. It changes from `02:00:01:01` at garden start to `03:01:01:01` in the doorway, then `02:01:01:01` inside.

### Input/control observations

Confirmed in real gameplay:

- Row 8 mask `128`: RIGHT.
- Row 8 mask `32`: UP.
- Row 8 mask `1`: SPACE/action/start.
- Row 4 mask `4`: M.
- Row 4 mask `8`: N.
- Row 5 mask `128`: Z.
- Row 5 mask `32`: X.

In the short test, RIGHT visibly moved Simon and updated player state. The other keys did not produce a clearly visible action in the sampled frames, but they did execute gameplay code paths and may be timing/context dependent.

### Player and object runtime RAM

New focused tests strengthen the earlier RAM map:

- `C426/C427`: player X/position-related value. During RIGHT movement it advanced through values like `0x1200`, `0x1400`, `0x1600`, etc. at `PC=6C98`.
- `C42E/C42F`: pair written together by `PC=6CBC`, often `01/01` or `02/02` during movement.
- `C470` and `C480`: active object slots for garden props/enemies. Their field at offset `+6` updates every frame via `PC=869D`.
- `C0xx`: transient object/script slots. Routines around `PC=89C6`, `89CA`, `8A8A`, `8AD9`, `8ADC`, `8AEF`, `8B12`, `8B4A`, `8Cxx`, `8Dxx` populate/update these records while bank `0E/0F` is active.

The object loader/state code frequently maps:

- `8000=0E`, `A000=0F` for object/script logic.
- `6000=0B`, `8000=0C`, `A000=0D` during room/screen data work.
- Restores to `6000=01`, `8000=02`, `A000=03`.

## Hardware sprites and Simon composition

Vampire Killer uses MSX2/V9938 hardware sprites over the SCREEN 4 bitmap background. The sprite setup observed in real gameplay is:

- `R01=62`: 16x16 sprite mode, no magnification.
- `R05=EF` plus `R11=01`: sprite attribute table at physical VRAM `0xF600`.
- `R06=1F`: sprite pattern table at physical VRAM `0xF800`.
- Sprite color table at physical VRAM `0xF400`.

In the walking gameplay frame `sprites_24_after_right.png`, Simon is composed from four visible hardware sprite entries:

- SAT entry `20`: `y=90`, `x=74`, `pattern=08`; upper body, color layer A.
- SAT entry `21`: `y=90`, `x=74`, `pattern=0C`; upper body, color layer B.
- SAT entry `02`: `y=A0`, `x=74`, `pattern=00`; lower body, color layer A.
- SAT entry `03`: `y=A0`, `x=74`, `pattern=04`; lower body, color layer B.

So the normal player frame is built as `2` vertical 16x16 cells times `2` overlaid color planes: `4` hardware sprites total. The two sprites at the same X/Y are not duplicates; they are layered pattern/color planes used to get a richer multicolor character than a single sprite plane would allow.

The SAT color byte is `00` for these entries because this is MSX2 sprite mode 2: colors are read per scanline from the separate sprite color table, not from the old MSX1 single color byte model. Pattern numbers are multiples of `4` because one 16x16 sprite consumes four 8x8 pattern chunks; its pattern data address is `0xF800 + pattern * 8`.

Likely creation pipeline:

1. Player/object state in `C4xx` chooses animation frame, body half, X/Y, and facing/state.
2. The game writes SAT entries into VRAM `0xF600`.
3. It writes or selects per-line sprite colors in VRAM `0xF400`.
4. V9938 composites those sprites over the SCREEN 4 bitmap room and HUD.

The exact RAM-to-SAT copy routine still needs a tighter watchpoint trace, but the visible hardware composition and VRAM locations are confirmed.

### SAT and sprite-color update trace

Follow-up probe: `probe_sat_update_trace.tcl`.

Reproduction used:

1. Boot the ROM with OpenMSX `C-BIOS_MSX2+`, `-romtype konami`.
2. Press SPACE at 9.0 seconds.
3. Press SPACE again at 12.0 seconds to enter real gameplay.
4. At 21.5 seconds enable VDP-port tracing and dump registers/SAT/color table.
5. Hold RIGHT from 22.0 to 24.0 seconds.
6. At 24.2 seconds dump the post-move registers/SAT/color table.

Files produced:

- `probe_sat_update_trace.log`
- `sat_trace_21_real_gameplay.png`
- `sat_trace_24_after_right.png`
- `sat_trace_21_sat_f600.bin`
- `sat_trace_24_sat_f600.bin`
- `sat_trace_21_sct_f400.bin`
- `sat_trace_24_sct_f400.bin`

Confirmed VDP state at both gameplay samples:

`R00=06 R01=62 R02=1F R03=80 R04=00 R05=EF R06=1F R07=00 R08=08 R09=80 R11=01 R14=03`

This keeps the same interpretation:

- 16x16 sprites, no magnification.
- Sprite color table: physical VRAM `0xF400`.
- Sprite attribute table: physical VRAM `0xF600`.
- Sprite pattern table: physical VRAM `0xF800`.

The new port trace identifies the active upload path:

- SAT VRAM address setup is repeatedly done at `PC=46CA`, with `HL=F600` and `R14=03`.
- Sprite color table address setup is also done at `PC=46CA`, with `HL=F400` and `R14=03`.
- SAT data bytes are written to VDP port `#98` at `PC=6581`.
- Sprite color table bytes are written to VDP port `#98` at `PC=659D`.

Representative first SAT burst:

```text
addr F600..F607 = E0 99 40 00  E0 99 50 00
addr F608..F60F = A0 08 00 00  A0 08 04 00
```

The source pointer in this burst advances through RAM around `HL=D639..D640` and `HL=D601..D608`. This strongly suggests the game builds or sorts a RAM-side SAT buffer first, then uploads that buffer to VRAM each frame. The same trace alternates `F400` color uploads and `F600` SAT uploads, so color planes and SAT entries are refreshed together.

### Decoded Simon SAT entries

At the post-move sample `sat_trace_24_after_right`, the visible Simon entries are:

| SAT entry | Y | X | Pattern | Role |
| --- | ---: | ---: | ---: | --- |
| `02` | `A0` | `80` | `00` | lower 16x16 cell, plane A |
| `03` | `A0` | `80` | `04` | lower 16x16 cell, plane B |
| `20` | `90` | `80` | `08` | upper 16x16 cell, plane A |
| `21` | `90` | `80` | `0C` | upper 16x16 cell, plane B |

So the player is a vertical MetaSprite:

```text
upper cell:  16x16 at x=0x80, y=0x90, patterns 08 + 0C
lower cell:  16x16 at x=0x80, y=0xA0, patterns 00 + 04
```

Each cell uses two hardware sprites at the same coordinate. The second plane is not a separate body part; it is the overlay color plane for the same 16x16 cell.

Decoded sprite color-table bytes for Simon in the same sample:

```text
entry 02: 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01
entry 03: 42 42 42 42 42 42 42 42 42 42 42 42 42 42 42 42
entry 20: 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01 01
entry 21: 42 42 42 42 42 42 42 42 42 42 42 42 42 42 42 42
```

Interpretation:

- Plane A uses color slot `1` for every line.
- Plane B uses byte `0x42`, meaning color slot `2` with the V9938 sprite CC/OR bit set.
- Where plane A and plane B overlap, the visible color becomes `1 OR 2 = 3`.

This confirms the earlier visual suspicion: the apparent third color is not a third hardware sprite. It is produced by two overlaid sprites using transparent masks plus the V9938 OR-color mode in the sprite color byte. For Simon's normal walking sample, the full body uses four hardware sprite entries: two 16x16 cells times two planes.

### Progress checklist

- [x] Volcar registros VDP y tablas de sprites en gameplay real.
- [x] Decodificar entradas SAT visibles y agrupar las del jugador.
- [x] Trazar qué rutina actualiza los slots de Simon.
- [x] Actualizar informe con composición de sprites.

## Enemy/object data

Two separate RAM areas matter:

### Runtime slots: `C400-C4BF`

`C4xx` is active runtime object state. Evidence:

- At gameplay, CPU often has `IX=C460`, `IX=C470`, `IX=C480`.
- Watchpoints after gameplay starts show constant writes to `C470`, `C476`, `C480`, `C486`, and player/control state around `C422-C42F`.
- Writes are produced by routines around `PC=868C`, `PC=869D`, `PC=6B77`, `PC=6C54`, `PC=6CBC`, `PC=6C98`, and `PC=71xx/72xx`.

Representative slots at gameplay:

- `C470: 02 90 30 00 00 01 2C E0 18 ...`
- `C480: 02 90 70 00 00 06 2E E0 1A ...`
- `C490: 02 40 90 00 00 01 30 E0 1C ...`
- `C4A0: 02 80 B0 00 00 09 32 E0 1E ...`

These look like 16-byte object records. The first byte marks active/type, the next fields include room/screen coordinates or state, and some bytes point into `E0xx` descriptor data. Exact field names need one more targeted trace per object routine.

### Descriptor/pointer data: `E000-E0BF`

`E0xx` contains structured data but did not change during the runtime watch window:

- Watchpoint `E000-E0BF` after gameplay start: 0 writes.
- The region contains many little-endian values and compact records.
- Some `C4xx` object records appear to reference nearby `E0xx` entries.

Interpretation: `E0xx` is loaded/decoded room or object descriptor data, while `C4xx` is the live per-frame object table.

## Evidence files

- `boot_02s.png`, `boot_06s.png`, `boot_10s.png`: boot/logo/title progression.
- `after_space_18s.png`, `after_space_22s.png`: gameplay after title transition.
- `game_22s_physical_vram.bin`: physical VRAM dump at gameplay.
- `game_22s_ram_c000_efff.bin`: RAM dump of active low work RAM area at gameplay.
- Logs: `probe_boot.log`, `probe_title_game.log`, `probe_entities_transition.log`, `probe_runtime_objects.log`, `probe_physical_vram.log`.

## Remaining unknowns

- Exact compression/packing format for room graphics is not yet decoded.
- Exact field names of the `C4xx` object structure need targeted breakpoints around `PC=868C/869D` and the `6Cxx/72xx` state routines.
- Exact ROM bank/offset of each room/enemy table needs correlating current bank state with the `E0xx` load routine, ideally by setting watchpoints only during the room load and logging source pointers.
