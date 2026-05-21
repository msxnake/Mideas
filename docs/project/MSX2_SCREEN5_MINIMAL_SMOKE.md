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

The MSX2 editor also keeps its entity repertoire separate from legacy MSX1 entity templates/components:

- MSX2 Screen 5 entities are created from `MSX2_ENTITY_REPERTOIRE`.
- Each preset carries `runtime: 'MSX2'` and an MSX2 engine id.
- The MSX2 entity panel does not offer generic `custom` entities.
- Imported legacy/unknown MSX2 screen entities are normalized back to a valid MSX2 kind before editing/generation.

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

Named npm alias:

```powershell
npm run smoke:msx2-layers
```

Build and static-check only:

```powershell
python scripts\build_msx2screen_layers_smoke.py --skip-openmsx
npm run smoke:msx2-layers -- --skip-openmsx
```

Run the current MSX2 tester battery without OpenMSX:

```powershell
npm run smoke:msx2-static
```

Run the current MSX2 tester battery with OpenMSX screenshots and RAM probes:

```powershell
npm run smoke:msx2-visual
```

After a visual run, build or refresh the HTML evidence page:

```powershell
npm run smoke:msx2-report
```

Default report:

- `test\msx2-screen5\out\msx2-visual-report.html`
- `test\msx2-screen5\out\msx2-visual-report.json`

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
- `msx2_current_behavior_ptr`
- `msx2_collision_at_pixel`
- `msx2_effect_at_pixel`
- `msx2_behavior_at_pixel`
- `msx2_player_dead_flag`
- `msx2_exit_reached_flag`
- `msx2_collectible_count`
- `msx2_effects_runtime_buffers`
- `msx2_runtime_ram_end`
- `msx2_runtime_ram_limit`
- `init_msx2_effect_buffers`
- `apply_MSX2_LAYERS_SMOKE_SCREEN_collected_visuals`
- `clear_msx2_collectible_visual`
- `screen5_blank_tile`
- `msx2_exit_blocked_flag`
- `msx2_lives`
- `msx2_game_over_flag`
- `msx2_game_over_restart_lock`
- `msx2_level_complete_flag`
- `msx2_level_continue_lock`
- `msx2_enemy_hit_flag`
- `msx2_enemy_damage_cooldown`
- `draw_msx2_lives_hud`
- `draw_msx2_collectible_hud`
- `draw_msx2_air_hud`
- `update_msx2_air_timer`
- `msx2_air_value`
- `msx2_air_frame_counter`
- `msx2_ladder_at_player_center`
- `msx2_behavior_below_player_center`
- `apply_msx2_conveyor`
- `move_msx2_ladder_up`
- `draw_msx2_game_over_banner`
- `draw_msx2_level_complete_banner`
- `msx2_game_over_idle`
- `msx2_level_complete_idle`
- `msx2_continue_after_level_complete`
- `msx2_restart_game`
- `msx2_screen_enemy_count`
- `msx2_screen_enemy_min_x`
- `msx2_screen_enemy_max_x`
- `msx2_screen_enemy_min_y`
- `msx2_screen_enemy_max_y`
- `msx2_screen_enemy_dx`
- `msx2_screen_enemy_dy`
- `msx2_enemy_runtime_x`
- `msx2_enemy_runtime_dy`
- `msx2_hw_enemy_sprite_pattern`
- `msx2_hw_enemy_sprite_colors_0`
- `update_msx2_enemy_positions`
- `update_msx2_enemy_state`
- `.enemy_no_slot_1:`
- `msx2_apply_damage_respawn`
- `write_hardware_sprite_attrs`
- `msx2_required_collectibles`
- `msx2_required_collectibles EQU 2`
- `msx2_screen_required_collectibles`
- `msx2_compare_collectibles_required`
- `msx2_screen_initial_air`
- `msx2_load_current_screen_air`
- `msx2_reset_screen_transition_flags`
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

The one-command smoke performs multiple OpenMSX captures by default:

- `test\msx2-screen5\out\msx2screen-layers-right-blocked.png`: holds RIGHT and checks the player does not cross the collision wall.
- `test\msx2-screen5\out\msx2screen-layers-right-blocked-probe.txt`: records the right-collision RAM probe.
- `test\msx2-screen5\out\msx2screen-layers-collect.png`: moves onto the collectible cell.
- `test\msx2-screen5\out\msx2screen-layers-collect-probe.txt`: requires `collectible=01`, `collectible_cell=00`, and `screen=00`, proving the collectible effect cell was cleared in RAM after collection.
- `test\msx2-screen5\out\msx2screen-layers-grounded.png` versus `test\msx2-screen5\out\msx2screen-layers-collect.png`: compares yellow collectible pixels before and after collecting the first item, proving the matching visible tile is erased from SCREEN 5 VRAM while other collectibles can remain visible.
- `test\msx2-screen5\out\msx2screen-layers-collect-both.png`: collects both required items before crossing into the exit room.
- `test\msx2-screen5\out\msx2screen-layers-collect-both-probe.txt`: requires `collectible=02`, `collectible_cell=00`, `collectible_cell_left=00`, and `screen=00`, proving both collectible cells are cleared in RAM. The screenshot must also have zero remaining yellow collectible pixels.
- MSX2 effect layers are now persistent per `msx2screen` while a level is active: WorldMap transitions keep already collected item cells cleared, and restart/level-continue restores all effect buffers from ROM.
- The same three captures check the top HUD: zero yellow object pips at start, one yellow pip after the first collectible, and two after the second.
- `test\msx2-screen5\out\msx2screen-layers-hazard-respawn.png`: jumps into a hazard placed above the collectible.
- `test\msx2-screen5\out\msx2screen-layers-hazard-respawn-probe.txt`: requires `hazard=01`, `lives=02`, `gameover=00`, `player_x=60`, `player_y=8E/8F/90`, and `screen=00`, proving hazard respawn uses the current room spawn and decrements one life.
- `test\msx2-screen5\out\msx2screen-layers-enemy-respawn.png`: walks into an `enemy` entity declared in `msx2screen.layers.entities`.
- `test\msx2-screen5\out\msx2screen-layers-enemy-respawn-probe.txt`: requires `enemy=01`, `hazard=01`, `lives=02`, `gameover=00`, `player_x=5F/60`, `player_y=8E/8F/90`, and `screen=00`, proving MSX2 entity collision damages and respawns through the same life path as effects-layer hazards. The fixture keeps two enemies on the row and the calibrated route hits the second slot, so the smoke exercises multi-enemy table lookup instead of only slot zero; `5F` is accepted because LEFT can still be held for one tick after respawn.
- `test\msx2-screen5\out\msx2screen-layers-enemy-motion-a-probe.txt` and `test\msx2-screen5\out\msx2screen-layers-enemy-motion-b-probe.txt`: compare `enemy0_x` and `enemy2_y` after two waits and require movement inside the patrol bounds, proving `patrolX` and `patrolY` entities are copied into runtime RAM and updated every frame.
- `test\msx2-screen5\out\msx2screen-layers-enemy-motion-b.png`: must contain magenta enemy hardware-sprite pixels, proving entity enemies are visible through the SCREEN 5 SAT rather than existing only as collision probes.
- `test\msx2-screen5\out\msx2screen-layers-lives-gameover.png`: repeats the hazard route three times and must contain the red SCREEN 5 game-over banner.
- `test\msx2-screen5\out\msx2screen-layers-lives-gameover-probe.txt`: requires `hazard=01`, `lives=00`, `gameover=01`, `player_x=60`, `player_y=8E/8F/90`, and `screen=00`, proving repeated hazards reach game over while keeping respawn deterministic.
- `test\msx2-screen5\out\msx2screen-layers-restart.png`: reaches game over, releases SPACE, presses SPACE again, and must no longer contain the red game-over banner.
- `test\msx2-screen5\out\msx2screen-layers-restart-probe.txt`: requires `lives=03`, `gameover=00`, `collectible=00`, `collectible_cell=03`, `player_x=60`, `player_y=8E/8F/90`, and `screen=00`, proving restart reloads the first screen and restores mutable effects.
- `test\msx2-screen5\out\msx2screen-layers-grounded.png`: captures the grounded baseline used for the jump comparison.
- `test\msx2-screen5\out\msx2screen-layers-air.png`: waits on the first room and must show the top-right green air/time bar shortened compared with the grounded baseline.
- `test\msx2-screen5\out\msx2screen-layers-air-probe.txt`: requires `0 < air < FD`, `air_frame < 30h`, and `gameover=00`, proving the frame divider decrements the resource without prematurely ending the level.
- `test\msx2-screen5\out\msx2screen-layers-ladder.png`: holds UP on a behavior-layer ladder and captures immediately after input.
- `test\msx2-screen5\out\msx2screen-layers-ladder-probe.txt`: requires `player_y < 8Ah`, `screen=00`, and `gameover=00`, proving the MSX2-only `behavior` layer drives ladder climbing instead of duplicating the visual screen.
- `test\msx2-screen5\out\msx2screen-layers-jump-mid.png`: holds SPACE briefly and checks the player sprite is visibly airborne.
- `test\msx2-screen5\out\msx2screen-layers-world-left-locked.png`: crosses into the exit room without collecting first.
- `test\msx2-screen5\out\msx2screen-layers-world-left.png`: holds LEFT long enough to cross a WorldMap link, checks the second `msx2screen` is loaded, and must contain the yellow level-complete banner after touching an open exit.
- `test\msx2-screen5\out\msx2screen-layers-world-return.png`: collects one item, crosses into the exit room, returns to the first room, and proves the collected cell remains cleared while the other collectible remains available. The visual check requires remaining yellow collectible pixels on return, but fewer than the fresh room baseline and more than the collect-both cleared state.
- `test\msx2-screen5\out\msx2screen-layers-level-continue.png`: reaches level complete, releases SPACE, presses SPACE, and must no longer contain the yellow level-complete banner.
- `test\msx2-screen5\out\msx2screen-layers-level-continue-probe.txt`: requires `lives=02`, `exit=00`, `level=00`, `collectible=00`, `collectible_cell=03`, `player_x=60`, `player_y=8E/8F/90`, and `screen=00`, proving continue reloads the first screen, restores mutable effects, and preserves the life lost to the enemy during the route.
- `test\msx2-screen5\out\msx2screen-layers-gameplay-locked-probe.txt`: requires `collectible=01`, `hazard=00`, `exit=00`, `blocked=01`, `level=00`, `level_lock=00`, `enemy=00`, `lives=02`, and `screen=01`, proving one collected item is not enough when the room requires two and that stale damage flags are cleared on WorldMap entry.
- `test\msx2-screen5\out\msx2screen-layers-gameplay-probe.txt`: requires `collectible=02`, `hazard=00`, `exit=01`, `blocked=00`, `level=01`, `enemy=00`, `lives=02`, and `screen=01` after collecting both required items, proving target-room exit state is current while prior-room damage flags are not carried forward.

The visual checks use PNG pixel inspection, so they fail when the compiled ROM changes behavior instead of merely checking that files exist. The gameplay probes read RAM through OpenMSX debug and check collision position, hazard, collectible removal, and exit gating.

Before building the ROM, the same smoke also compiles `utils/msxGenerator/index.ts` to a temporary CommonJS build and calls `generateModularASMFromSummary(...)` with a ProjectSummary reconstructed from the fixture JSON. This catches regressions where exported summaries accidentally route SCREEN 5 projects back through the SCREEN 2/MSX1 generator path. The summary check requires the same MSX2 backend, collision, gravity, and WorldMap transition ASM markers as the raw project-asset path.

Before fixture generation, the smoke also runs `node scripts\check_msx2_entity_editor_contract.mjs`. That cheap editor-side contract fails if the MSX2 authoring surface loses the `Behavior` or `Entities` modes, duplicates the entity panel, or stops exposing labeled player/enemy patrol fields. This keeps browser-visible editor regressions close to the ROM smoke without touching the MSX1 `screenmap` editor.

The smoke fixture deliberately stores the non-start MSX2 screen before the WorldMap start screen in the project asset list. The MSX2 generator must therefore honor `world.startScreenNodeId` from the GameFlow `WorldLink` instead of assuming `analysis.msx2Screens[0]` is the start room.

The editor contract can also be run directly:

```powershell
npm run test:msx2-editor-contract
```

The native `msx2screen` backend intentionally loads 16x16 tile screens as packed tile rows plus collision/effects layers, not as one 27136-byte bitmap per screen. This keeps multiple MSX2 rooms viable in a 32KB smoke ROM and avoids touching the MSX1 `screenmap`/SCREEN 2 pipeline.

Current `effects` layer runtime semantics for MSX2 tile screens:

- `0`: no effect.
- `1`: hazard; sets `msx2_player_dead_flag`, decrements `msx2_lives`, sets `msx2_game_over_flag` when lives reach zero, then respawns at the current room spawn.
- `2`: exit; when `msx2_collectible_count` meets the active screen's `msx2_screen_required_collectibles` entry, sets `msx2_exit_reached_flag`, `msx2_level_complete_flag`, and `msx2_level_continue_lock`, draws `draw_msx2_level_complete_banner`, and enters `msx2_level_complete_idle`; otherwise sets `msx2_exit_blocked_flag`.
- `3`: collectible; increments `msx2_collectible_count`, clears the active effect cell in the RAM copy so the same collectible cannot be counted again, and calls `clear_msx2_collectible_visual` to blank the matching 16x16 SCREEN 5 tile. The smoke fixture contains two collectible cells and sets `runtime.requiredCollectibles = 2` on both MSX2 rooms, so exit gating is tested with both a partial and a complete collection route.

Each native `msx2screen.runtime` can define `requiredCollectibles` and `initialAir`. The generator emits one byte per referenced MSX2 screen as `msx2_screen_required_collectibles` and `msx2_screen_initial_air`. `msx2_compare_collectibles_required` gates exits against the active screen requirement, and `msx2_load_current_screen_air` loads the active screen air byte whenever the first room, restart, continue, or WorldMap screen-transition path resets the timer. If a screen omits `requiredCollectibles`, the backend falls back to counting `effects=3` cells on that screen. If it omits `initialAir`, the backend falls back to `255`. `msx2_required_collectibles EQU n` remains as the maximum requirement for the current ROM slice and is used by the tiny HUD pip renderer.

At level start/restart/continue, `init_msx2_effect_buffers` copies every referenced native `msx2screen` 16x14 `effects` layer from ROM into `msx2_effects_runtime_buffers` at `#C020`. Screen loads only repoint `msx2_current_effects_ptr` to the active screen slice and re-erase visuals for collectibles already cleared in that slice. Collision remains ROM-backed. This preserves collected items across WorldMap room transitions without writing into cartridge ROM data, while full restarts restore the ROM-authored effect layers.

The generator emits `msx2_runtime_ram_end` and `msx2_runtime_ram_limit` and fails generation if the native MSX2 runtime layout would exceed the safe RAM window. This makes larger WorldMaps fail loudly instead of letting persistent effect buffers, scratch RAM, and enemy runtime tables overlap.

Current `behavior` layer runtime semantics for MSX2 tile screens:

- `0`: no behavior.
- `1`: ladder; `UP` and upward diagonals climb when the player center is on the ladder cell, while `DOWN` and downward diagonals climb down when the lower center is on the ladder. Ladder motion clears jump frames and bypasses gravity for that frame. If the diagonal input is not on a ladder, it falls back to the normal horizontal movement path.
- `2`: conveyor right; while grounded, the tile under the player's lower center pushes one pixel right per frame when the right-side collision probe is empty.
- `3`: conveyor left; while grounded, the tile under the player's lower center pushes one pixel left per frame when the left-side collision probe is empty.

Behavior remains ROM-backed through `msx2_current_behavior_ptr`, separate from collision and effects. This is the intended MSX2 path for reusable mechanics like ladders or conveyors without redrawing duplicate screens.

The MSX2 Screen editor now exposes these runtime layers directly: `Collision`, `Effects`, `Behavior`, and `Entities`. `Effects` paints the current semantic code (`1` hazard, `2` exit, `3` collectible), while `Behavior` paints the current mechanic code (`1` ladder, `2` conveyor right, `3` conveyor left). Right-click clears a cell. This keeps authoring aligned with the exported ROM data instead of requiring hand-edits in project JSON.

`Entities` mode supports selecting or creating an entity by cell, editing its kind, tile position, and movement mode, and deleting it explicitly. `patrolX` and `patrolY` expose the same `minX`, `maxX`, `minY`, `maxY`, and `direction` params consumed by the MSX2 runtime enemy tables. `ghostMaze` exposes `initialDirection` and `speed` for Pac-Man-style maze enemies.

MSX2 visual tiles can store per-tile `width` and `height` metadata constrained to 8/16/24/32 pixels. The editor resizes tile pixel data without touching MSX1 tile assets, and the SCREEN 5 backend emits rectangular tile copies for variable-size MSX2 tiles instead of rasterizing every native `msx2screen` into a full bitmap. Runtime collision, effects, behavior, and entities remain on the existing 16x14 cell grid in this first slice.

The MSX2 tile editor now has an internal 16-slot palette picker, visual previews in the tile list, and basic tile operations for fill, horizontal/vertical flip, and one-pixel shifts. It also exposes tile-local paint modes for pencil, erase, contiguous bucket fill, and pick-color. These tools are scoped to native `msx2screen` tiles and do not alter the MSX1 `screenmap` editor.

Hardware sprite pattern, color, and attribute table uploads use the backend's extended VRAM writer instead of BIOS `LDIRVM`. This is required for sprite tables at `#7400`, `#7600`, and `#7800`; using the BIOS copy path can wrap those writes into visible SCREEN 5 bitmap rows and cause striped corruption in dense maps such as the Puck Maze screen.

The extended VRAM writer resets the VDP control-port latch with a status read before each two-byte control sequence. This is required on MSX2+ as well as MSX2, because a stale second-half latch can make the R#14 high-VRAM select write fail and redirect sprite-table uploads from `#7800` to visible bitmap row `#3800`.

Dynamic 16x16 hardware sprite patterns are emitted in V9938 quadrant order: top-left, bottom-left, top-right, bottom-right. A normal bitmap scan order swaps the right/top and left/bottom pattern blocks, which makes circular sprites such as the Puck player appear as broken fragments in OpenMSX.

The inline MSX2 status HUD is suppressed for maze/Pac-Man-style movement screens, and can also be disabled with `runtime.hideHud = true`, `runtime.showHud = false`, or `runtime.statusHud = false`. Those screens commonly use the full top row as authored maze graphics, so fixed life/collectible/air pips would otherwise overwrite the tilemap and look like intermittent play-time corruption.

The MSX2 effect dispatcher must not use VDP register 7 border-color writes as runtime debug feedback. Earlier collectible/hazard/exit paths changed the border on every effect sample, producing a visible flash every time the Puck player consumed a pellet. Effects now report through RAM flags and authored visual changes only.

Collected item erasure uses the dominant palette index from the authored collectible tiles, instead of assuming packed color `0/0`. This avoids replacing pellets with the SCREEN 5 backdrop color when slot 0 is transparent/backdrop and the corridor art actually uses palette slot 1 for black.

Maze/Pac-Man movement keeps the player advancing in the last successful direction when no input is held. A held direction is tried first so turns happen as soon as the corridor opens; if that requested turn is blocked, the runtime falls back to the current direction. Movement stops only when the current direction collides with a wall or map edge.

Direction changes in maze/Pac-Man movement are only accepted when the player position is aligned to the 16x16 tile grid. Input in the current direction remains valid between grid points, and blocked or premature turn requests fall back to the current direction instead of stopping the player.

Maze/Pac-Man input is latched separately from the current movement direction. Pressing a cursor stores that requested direction even after the key is released; the runtime keeps trying that request at 16x16 grid points and only changes the current direction when the requested turn is open.

MSX2 SCREEN 5 hardware sprites have their own frame runtime and do not reuse MSX1 sprite component code. The generator emits every authored `msx2sprite` frame as V9938 16x16 pattern groups, keeps `msx2_player_sprite_frame` for requested maze direction, and advances animation through `msx2_player_anim_counter` / `msx2_player_anim_frame` by changing the SAT pattern index.

MSX2 projects keep the legacy MSX1 ECS offline. Component definitions and entity templates now carry an optional `target`; omitted legacy data is treated as `MSX1`, new definitions created inside an MSX2 project are tagged `MSX2`, and the MSX2 UI/generator filters out MSX1 defaults instead of inheriting them.

WorldMap transitions in maze/Pac-Man mode resume through the maze sprite update path instead of the platformer vertical update path. This prevents a room transition from applying jump/gravity logic to a four-direction maze player.

The platformer vertical update label is also guarded in generated maze/Pac-Man ROMs: if any legacy path accidentally jumps there, it exits through the maze sprite update path before jump or gravity code can run.

Dedicated conveyor smoke:

```powershell
python scripts\build_msx2screen_conveyor_smoke.py
```

This creates `test\msx2-screen5\msx2screen-conveyor-project.json`, builds `test\msx2-screen5\out\msx2screen-conveyor.rom`, and captures both `test\msx2-screen5\out\msx2screen-conveyor-right.png` and `test\msx2-screen5\out\msx2screen-conveyor-left.png`. The right probe requires the player X coordinate to move from the spawn at `60h` to at least `68h`, proving behavior code `2` pushes right in OpenMSX. The left probe first walks onto a neighboring conveyor-left cell and then requires X to be no greater than `68h`, proving behavior code `3` pushes left.

The conveyor smoke reads the generated `.sym` file before OpenMSX capture, validates the MSX2 runtime RAM layout, and passes symbol-derived probe addresses to the shared capture helper. It also performs a PNG visual check by locating the green hardware sprite on the playable platform row in both conveyor screenshots.

Hazards decrement `msx2_lives` from the initial value `3`, redraw the tiny SCREEN 5 life pips with `draw_msx2_lives_hud`, and set `msx2_game_over_flag` when the counter reaches zero. Collectibles redraw the object-progress pips with `draw_msx2_collectible_hud`, which emits up to four yellow pips for collected required items next to the life HUD. `msx2_air_value` is initialized from the active screen's `msx2_screen_initial_air` byte; `update_msx2_air_timer` decrements it through a coarse frame divider stored in `msx2_air_frame_counter`, and `draw_msx2_air_hud` renders a 16-segment green bar at the top-right of the SCREEN 5 playfield. When air reaches zero, the runtime sets `msx2_game_over_flag`, locks restart until SPACE is released, and draws the game-over banner. Hazards also set `msx2_game_over_restart_lock` so the SPACE press that caused the final jump cannot immediately restart the game. They then call `msx2_respawn_current_screen` and refresh sprite attributes without re-entering the effect dispatcher. Once game over is active, `msx2_game_over_idle` draws `draw_msx2_game_over_banner`, keeps the sprite visible, and skips movement/effect processing. After SPACE has been released, pressing SPACE again calls `msx2_restart_game`, reloads the first screen, restores the mutable effects layer, resets lives/collectibles/flags/air, redraws the HUD sections, and respawns the player. Level-complete uses the same release-then-press pattern with `msx2_level_continue_lock`; pressing SPACE calls `msx2_continue_after_level_complete`, reloads the first screen, restores mutable effects, clears exit/level flags, resets air, redraws the HUD sections, and keeps current lives. The respawn X/Y tables are emitted as `msx2_screen_spawn_x` and `msx2_screen_spawn_y`, one byte per referenced `msx2screen`, using that screen's player entity position; respawn resets jump frames and leaves `msx2_player_jump_lock` set until SPACE is released, so damage cannot trigger an immediate second jump. Up to four `enemy` or `hazard` entities per screen are emitted as `msx2_screen_enemy_count`, `msx2_screen_enemy_x`, `msx2_screen_enemy_y`, `msx2_screen_enemy_min_x`, `msx2_screen_enemy_max_x`, `msx2_screen_enemy_min_y`, `msx2_screen_enemy_max_y`, `msx2_screen_enemy_dx`, `msx2_screen_enemy_dy`, `msx2_screen_enemy_mode`, and `msx2_screen_enemy_speed`; on screen load they are copied into `msx2_enemy_runtime_x`, `msx2_enemy_runtime_y`, `msx2_enemy_runtime_dx`, `msx2_enemy_runtime_dy`, `msx2_enemy_runtime_mode`, `msx2_enemy_runtime_speed`, and `msx2_enemy_runtime_tick`. The SAT writer emits one magenta 16x16 hardware sprite per active enemy slot using `msx2_hw_enemy_sprite_pattern`, so moving entities are visible in OpenMSX as well as collidable. Entities with `params.movement = "patrolX"` use `minX`, `maxX`, and `direction` to move horizontally; `params.movement = "patrolY"` uses `minY`, `maxY`, and `direction` to move vertically before collision checks. Entities with `params.movement = "ghostMaze"` use `initialDirection` and `speed` as a native MSX2 ghost movement component: they advance inside collision-layer corridors, re-evaluate direction on 16x16 cell boundaries, and prefer directions that close distance to the player before falling back to open alternatives or reversing. `update_msx2_enemy_state` treats each one as a 16x16 damage body, calls the shared `msx2_apply_damage_respawn` path, and uses `msx2_enemy_damage_cooldown` so one held direction cannot drain all lives immediately. The routine resets jump state and keeps `msx2_player_dead_flag` set for the smoke probe and later gameflow/life logic.

WorldMap edge transitions now set both X and Y on the target room. Y uses the target screen player entity when present and falls back to a playable platformer height, then resets jump state before gameplay resumes. The transition reloads the target screen's enemy runtime and `initialAir`, clears transient event flags through `msx2_reset_screen_transition_flags`, and preserves collectible progress, so multi-screen level routes can collect items in one room and unlock an exit in another without carrying the previous room's timer or stale damage events.

Playable MSX2 screens no longer auto-patrol the player when no cursor input is held. The smoke drives all motion explicitly through OpenMSX keymatrix input, which matches player-controlled platformer behavior.

The backend can be entered from both generator paths:

- `generateModularASM(...)` with raw project assets.
- `generateModularASMFromSummary(...)` when `screenMode` is `SCREEN 5 (Graphics III)` or `targetGraphicsBackend` resolves to MSX2.

For summary compatibility, the MSX2 path accepts both current and older graph field names: `worldAssetId` or `data.worldMapId`, `screenAssetId` or `screenId`, and connection endpoints as either nested `{ from: { nodeId }, to: { nodeId } }` or flat `fromNodeId/toNodeId`.
