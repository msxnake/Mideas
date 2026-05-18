# VBlank Hard Player Scheduler

Mideas treats the MSX1 VBlank interrupt as the authoritative game tick. Extra interrupt types, such as MSX2 line IRQ, must not increment `interrupt_counter` and must not run gameplay cadence. A line IRQ may be used later for raster effects, palette splits, HUD effects, or scanline-local VRAM timing, but it is not a frame clock and must not advance gameplay.

## Model

The scheduler is split into two zones:

- Hard zone: a bounded, opt-in Player-only slice that runs once from the VBlank dispatcher before deferred tasks. It is for latency-sensitive work that must be visible in the same frame.
- Soft zone: the existing `task_table` scheduler. It runs deferred work that may be spread across frames or skipped without breaking Player responsiveness.

The hard zone is intentionally small. It is not a second main loop, not a general ECS pass, and not a way to catch up all game simulation after a slow frame.

## Runtime Policy

The VBlank dispatcher order is:

1. Acknowledge/latch VBlank through the existing status read.
2. Increment `interrupt_counter` once.
3. Run `run_hard_player_tick` if `player_hard_tick_enabled` is set.
4. Run soft IRQ tasks from `task_table`.

`run_hard_player_tick` is disabled by default and can be enabled by exporting with `interruptConfig.enableHardPlayerTick=true`. This keeps existing ROMs stable while the fast path is validated per mapper target. MegaROM ASCII16 currently forces this option off because its `components_tail` module is not kept in an IRQ-visible resident window.

There is no massive catch-up loop. If the hard zone cannot run because the IRQ-safe mapper/VRAM window is locked, Mideas records the miss in `player_hard_tick_lost` and returns to the normal dispatcher. The next VBlank runs one hard tick, not N accumulated hard ticks. Soft tasks use their own cadence gates and must also avoid unbounded catch-up.

## Hard Player Pipeline

`update_player_realtime_pipeline` runs only bounded Player-critical work:

- input polling
- Player fast movement/state update
- deadly/tile-interaction state needed by Player logic
- Player state machine
- wall-grab fast path
- Player animation
- Player sprite attribute build
- Player-only SAT upload

Broad ECS sweeps, enemy AI, NPCs, text, streaming, large VRAM jobs, and full SAT uploads remain soft/deferred work.

## SAT Rule

The Player must own reserved hardware sprite slots through `entity_sprite_config`. For the canonical Player, those reserved SAT slots are 0..3: slot 0 is the first hardware sprite layer and slots 1, 2, and 3 are the remaining contiguous Player layers. This keeps MSX1 sprite priority deterministic and makes the hard upload a small copy.

The hard path uploads only those contiguous Player SAT bytes through `upload_player_sprites_to_vram`; it does not rebuild or upload the full enemy/object SAT. Enemy/object sprite allocation can use later SAT slots and is uploaded by the soft sprite task.

The generator enforces this by allocating Player entities before other active entities and reserving at least four hardware sprite slots for them, even when the current Player sprite uses fewer drawable layers. Entity tables remain indexed by entity id, while layer color/Y-offset init tables are written by actual hardware slot so reserved holes cannot shift enemy sprite metadata into Player-owned slots.

In MegaROM builds, `upload_player_sprites_to_vram` is routed through a bank-0 resident wrapper so the ISR does not depend on the bank that contains `sprites.asm`.

## MSX1 VBlank vs MSX2 Line IRQ

MSX1 has a single frame-level VBlank cadence, so `interrupt_counter` is a VBlank counter. MSX2 line IRQ is a scanline event and must stay outside the gameplay clock:

- VBlank increments `interrupt_counter`.
- VBlank may run the hard Player tick when enabled.
- VBlank may run `task_table` soft jobs.
- Line IRQ does not increment `interrupt_counter`.
- Line IRQ does not run `run_hard_player_tick`.
- Line IRQ does not walk `task_table`.

This keeps the same ROM timing model across MSX1 and MSX2. MSX2-only raster features can add their own counters if needed, but those counters must not masquerade as frame ticks.

## Recommended Cadences

Use these cadences unless a game has a measured reason to do otherwise:

- Every VBlank: input polling, Player fast movement/state, Player collision/tile interaction needed by Player logic, Player animation, Player SAT upload.
- Every 1-2 VBlanks: camera follow, HUD counters that affect immediate feedback, lightweight bullets/projectiles when they must match Player feel.
- Every 2-4 VBlanks: enemy AI decisions, NPC scripts, non-critical animation, object cleanup.
- Every 4-8 VBlanks: spawn planning, background timers, score/life UI redraws that do not need instant response.
- Opportunistic/deferred: large VRAM copies, decompression, text streaming, map streaming, full SAT uploads, diagnostics.

Soft tasks should be idempotent and bounded. If a soft task sees that several frames passed, it may advance a compact state once or consume a small budget, but it must not try to replay every missed frame inside one interrupt.

## Debug Counter

`player_hard_tick_lost` increments when a VBlank hard tick is enabled but skipped because `far_call_irq_lock_depth` is nonzero. Normal gameplay should keep this counter at zero.

## Invariants

- `interruptConfig.enableHardPlayerTick` is opt-in and defaults to false.
- MegaROM ASCII16 disables `interruptConfig.enableHardPlayerTick` until its hard Player routines can be guaranteed resident.
- `interrupt_counter` increments exactly once per VBlank dispatcher entry while interrupts are enabled.
- `run_hard_player_tick` is called before the `task_table` walk.
- `run_hard_player_tick` checks `player_hard_tick_enabled` before doing Player work.
- `stop_interrupt_system` clears `player_hard_tick_enabled` so the main loop cannot keep skipping its normal Player path after H.TIMI is restored.
- `player_hard_tick_lost` exists as a 16-bit debug counter and increments on skipped locked hard ticks.
- The hard Player path only runs on the normal screen/gameplay engine.
- The hard Player path does not run enemy AI, NPC logic, text streaming, map streaming, full SAT upload, or large VRAM jobs.
- `upload_player_sprites_to_vram` copies only Player-owned SAT bytes derived from `entity_sprite_config`.
- Player SAT ownership is contiguous and expected to occupy slots 0..3 for the canonical Player.
- MSX2 line IRQ does not increment tick state, does not call the hard Player tick, and does not dispatch `task_table`.
- Missed hard ticks are counted, not replayed as a massive catch-up.

## Acceptance Tests

- Static generator checks prove the hard tick option exists in `MSXInterruptConfig` and is passed as `false` by default when absent.
- Static generator checks prove `interrupt_dispatcher` latches VBlank before incrementing `interrupt_counter`, then calls `run_hard_player_tick` before `task_table` is loaded.
- Static generator checks prove `player_hard_tick_enabled`, `player_hard_tick_lost`, and `far_call_irq_lock_depth` are allocated variables.
- Static generator checks prove `run_hard_player_tick` gates on `player_hard_tick_enabled`, increments `player_hard_tick_lost` when locked, calls `update_player_realtime_pipeline`, and calls `upload_player_sprites_to_vram`.
- Static generator checks prove Player sprite allocation is ordered before non-Player entities and reserves at least four SAT slots.
- Static generator checks prove `upload_player_sprites_to_vram` reads `entity_sprite_config`, uses `sprite_attributes` as the RAM SAT source, uses `SPRATR` as the VRAM SAT destination, and copies `layer count * 4` bytes.
- Static generator checks prove MegaROM routing exposes resident wrappers for the Player realtime pipeline and Player-only SAT upload, with ASCII16 hard tick forced off.
- Documentation checks prove the hard vs soft split, SAT slots 0..3, no massive catch-up, MSX1 VBlank vs MSX2 line IRQ rule, recommended cadences, invariants, and acceptance tests are kept visible.
