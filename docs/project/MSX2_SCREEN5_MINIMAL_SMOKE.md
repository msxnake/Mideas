# MSX2 SCREEN 5 Minimal Smoke Flow

This smoke fixture exercises only the `msx2-screen5-bitmap` backend. It does not route through the SCREEN 2 tilebank generator.

## Fixture

- JSON: `test/msx2-screen5/minimal-screen5-project.json`
- Screen mode: `SCREEN 5 (Graphics III)`
- Backend: `msx2-screen5-bitmap`
- Palette: 16 MSX2 V9938 RGB333 slots using the default MSX2 palette
- Tiles: two 8x8 tiles
- Screen map: 32x27 cells, matching the 256x212 SCREEN 5 bitmap area
- GameFlow: `Start -> Text(background screen) -> Transition(cls) -> Text(background screen) -> End`

The fixture stores a deterministic 32x27 background. The smoke script normalizes the background/collision/effects arrays before generation.

## Reproducible Command

```powershell
python scripts/build_msx2_screen5_smoke.py
```

Default outputs:

- ASM: `test/msx2-screen5/out/minimal-screen5.asm`
- ROM: `test/msx2-screen5/out/minimal-screen5.rom`
- symbols: `test/msx2-screen5/out/minimal-screen5.sym`
- screenshot: `test/msx2-screen5/out/minimal-screen5.png`

Compile without launching OpenMSX:

```powershell
python scripts/build_msx2_screen5_smoke.py --skip-openmsx
```

Use a specific OpenMSX binary or machine:

```powershell
python scripts/build_msx2_screen5_smoke.py --openmsx "C:\Program Files\openMSX\openmsx.exe" --machine C-BIOS_MSX2
```

Capture after advancing the minimal GameFlow with SPACE:

```powershell
python scripts\capture_openmsx_action.py `
  --rom test\msx2-screen5\out\minimal-screen5.rom `
  --sequence "SPACE,WAIT:500" `
  --project-root . `
  --output test\msx2-screen5\out\minimal-screen5-after-space.png `
  --openmsx "C:\Program Files\openMSX\openmsx.exe" `
  --machine C-BIOS_MSX2 `
  --boot-wait-ms 6000 `
  --capture-wait-ms 1000
```

## Isolation Checks

The helper calls `generateModularASM` with:

```text
screenMode = SCREEN 5 (Graphics III)
targetGraphicsBackend = msx2-screen5-bitmap
```

It also checks that the generated file contains the MSX2 SCREEN 5 backend marker and that the returned `patterns.asm` and `colors.asm` files are the backend isolation stubs saying SCREEN 2 tables are intentionally not used.

It also checks the first MSX2 GameFlow slice:

- `Text` nodes emit `wait_key`
- `Transition(cls)` emits `clear_screen5_bitmap`
- GameFlow code is emitted inline in `unitedFiles.asm`, not through the SCREEN 2 `gameFlowGenerator.ts`
- `scripts/capture_openmsx_action.py` can send SPACE through OpenMSX key matrix row 8 mask `0x01` and capture the post-input state.

## Current Scope Limit

The smoke remains a simple 32KB ROM. A single SCREEN 5 bitmap already takes 27136 bytes, so multiple full-screen bitmaps need compression or a mapper-backed resource path before they can be supported safely.

## MSX2 16x16 Layer Smoke

Use this when validating native `msx2screen` runtime layers without touching the MSX1 `screenmap` pipeline.

One-command smoke:

```powershell
python scripts\build_msx2screen_layers_smoke.py
```

Build and static-check only:

```powershell
python scripts\build_msx2screen_layers_smoke.py --skip-openmsx
```

Manual equivalent:

```powershell
node scripts\create_msx2_screen5_layers_fixture.mjs
python scripts\build_mideas_unified_rom.py `
  --json test\msx2-screen5\msx2screen-layers-project.json `
  --project-root . `
  --asm-output test\msx2-screen5\out\msx2screen-layers.asm `
  --rom-output test\msx2-screen5\out\msx2screen-layers.rom `
  --sym-output test\msx2-screen5\out\msx2screen-layers.sym
```

Expected ASM signals:

- `MSX2_LAYERS_SMOKE_SCREEN_COLLISION`
- `MSX2_LAYERS_SMOKE_SCREEN_EFFECTS`
- `msx2_current_collision_ptr`
- `msx2_collision_at_pixel`
- `msx2_effect_at_pixel`
- `msx2_player_dead_flag`
- `msx2_exit_reached_flag`
- `msx2_collectible_count`
- `msx2_exit_blocked_flag`
- `msx2_lives`
- `msx2_game_over_flag`
- `draw_msx2_lives_hud`
- `msx2_required_collectibles`
- `update_hardware_sprite_vertical`
- `apply_hardware_sprite_gravity`
- `msx2_player_jump_frames`
- `.right_blocked:`
- `.left_blocked:`

Optional OpenMSX action capture:

```powershell
python scripts\capture_openmsx_action.py `
  --rom test\msx2-screen5\out\msx2screen-layers.rom `
  --sequence "WAIT:500,RIGHT:1000" `
  --project-root . `
  --output test\msx2-screen5\out\msx2screen-layers-right.png `
  --machine C-BIOS_MSX2 `
  --boot-wait-ms 6000 `
  --capture-wait-ms 500
```

The one-command smoke performs two OpenMSX captures by default:

- `test\msx2-screen5\out\msx2screen-layers-right-blocked.png`: holds RIGHT and checks the player does not cross the collision wall.
- `test\msx2-screen5\out\msx2screen-layers-right-blocked-probe.txt`: records the right-collision RAM probe.
- `test\msx2-screen5\out\msx2screen-layers-collect.png`: moves onto the collectible cell.
- `test\msx2-screen5\out\msx2screen-layers-collect-probe.txt`: requires `collectible=01`, `collectible_cell=00`, and `screen=00`, proving the collectible effect cell was cleared in RAM after collection.
- `test\msx2-screen5\out\msx2screen-layers-hazard-respawn.png`: jumps into a hazard placed above the collectible.
- `test\msx2-screen5\out\msx2screen-layers-hazard-respawn-probe.txt`: requires `hazard=01`, `lives=02`, `gameover=00`, `player_x=60`, `player_y=8F/90`, and `screen=00`, proving hazard respawn uses the current room spawn and decrements one life.
- `test\msx2-screen5\out\msx2screen-layers-lives-gameover.png`: repeats the hazard route three times.
- `test\msx2-screen5\out\msx2screen-layers-lives-gameover-probe.txt`: requires `hazard=01`, `lives=00`, `gameover=01`, `player_x=60`, `player_y=8F/90`, and `screen=00`, proving repeated hazards reach game over while keeping respawn deterministic.
- `test\msx2-screen5\out\msx2screen-layers-grounded.png`: captures the grounded baseline used for the jump comparison.
- `test\msx2-screen5\out\msx2screen-layers-jump-mid.png`: holds SPACE briefly and checks the player sprite is visibly airborne.
- `test\msx2-screen5\out\msx2screen-layers-world-left-locked.png`: crosses into the exit room without collecting first.
- `test\msx2-screen5\out\msx2screen-layers-world-left.png`: holds LEFT long enough to cross a WorldMap link and checks the second `msx2screen` is loaded.
- `test\msx2-screen5\out\msx2screen-layers-gameplay-locked-probe.txt`: requires `collectible=00`, `hazard=01`, `exit=00`, and `blocked=01`.
- `test\msx2-screen5\out\msx2screen-layers-gameplay-probe.txt`: requires `collectible=01`, `hazard=01`, `exit=01`, and `blocked=00` after collecting first.

The visual checks use PNG pixel inspection, so they fail when the compiled ROM changes behavior instead of merely checking that files exist. The gameplay probes read RAM through OpenMSX debug and check collision position, hazard, collectible removal, and exit gating.

Before building the ROM, the same smoke also compiles `utils/msxGenerator/index.ts` to a temporary CommonJS build and calls `generateModularASMFromSummary(...)` with a ProjectSummary reconstructed from the fixture JSON. This catches regressions where exported summaries accidentally route SCREEN 5 projects back through the SCREEN 2/MSX1 generator path. The summary check requires the same MSX2 backend, collision, gravity, and WorldMap transition ASM markers as the raw project-asset path.

The native `msx2screen` backend intentionally loads 16x16 tile screens as packed tile rows plus collision/effects layers, not as one 27136-byte bitmap per screen. This keeps multiple MSX2 rooms viable in a 32KB smoke ROM and avoids touching the MSX1 `screenmap`/SCREEN 2 pipeline.

Current `effects` layer runtime semantics for MSX2 tile screens:

- `0`: no effect.
- `1`: hazard; sets `msx2_player_dead_flag`, decrements `msx2_lives`, sets `msx2_game_over_flag` when lives reach zero, then respawns at the current room spawn.
- `2`: exit; sets `msx2_exit_reached_flag` only when `msx2_collectible_count >= msx2_required_collectibles`; otherwise sets `msx2_exit_blocked_flag`.
- `3`: collectible; increments `msx2_collectible_count`, then clears the active effect cell in the RAM copy so the same collectible cannot be counted again.

Each screen load copies the selected 16x14 `effects` layer from ROM to `msx2_effects_runtime_buffer` at `#C020`, then points `msx2_current_effects_ptr` at that RAM buffer. Collision remains ROM-backed. This keeps collectible mutation local to the current room and avoids writing into cartridge ROM data.

Hazards decrement `msx2_lives` from the initial value `3`, redraw the tiny SCREEN 5 life pips with `draw_msx2_lives_hud`, and set `msx2_game_over_flag` when the counter reaches zero. They then call `msx2_respawn_current_screen`. The respawn X/Y tables are emitted as `msx2_screen_spawn_x` and `msx2_screen_spawn_y`, one byte per referenced `msx2screen`, using that screen's player entity position. The routine resets jump state and keeps `msx2_player_dead_flag` set for the smoke probe and later gameflow/life logic.

WorldMap edge transitions now set both X and Y on the target room. Y uses the target screen player entity when present and falls back to a playable platformer height, then resets jump state before gameplay resumes. This avoids carrying a falling Y position into the next room.

Playable MSX2 screens no longer auto-patrol the player when no cursor input is held. The smoke drives all motion explicitly through OpenMSX keymatrix input, which matches player-controlled platformer behavior.

The backend can be entered from both generator paths:

- `generateModularASM(...)` with raw project assets.
- `generateModularASMFromSummary(...)` when `screenMode` is `SCREEN 5 (Graphics III)` or `targetGraphicsBackend` resolves to MSX2.

For summary compatibility, the MSX2 path accepts both current and older graph field names: `worldAssetId` or `data.worldMapId`, `screenAssetId` or `screenId`, and connection endpoints as either nested `{ from: { nodeId }, to: { nodeId } }` or flat `fromNodeId/toNodeId`.
