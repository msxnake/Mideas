# MSX Collision Error Log (2026-02-24)

## Error observed
- Hero did not trigger `HAS_COLLISION` state machine transitions reliably.
- In some builds, collision appeared delayed or never triggered.

## Root causes
- **Entity collision loop register corruption**:
  - In `update_entity_collision_fast`, register `C` (source entity index) was being clobbered while restoring loop counters for inner loop `j=i+1`.
  - This caused pair checks/flag writes to use wrong entity indices.
- **State machine wait timer not initialized**:
  - `entity_sm_wait_timer` was not cleared in `init_entities`, so random RAM values could delay transitions.
- **Temporary debug path left enabled**:
  - A forced write to `entity_entity_collision_flags + 1` in the main loop interfered with real behavior during tests.

## Fix applied
- Preserve source index in collision pair loop:
  - Reworked stack restore in inner loop so `C` is not overwritten when restoring outer index `i`.
- Clear `entity_sm_wait_timer` in `init_entities` with `LDIR` block.
- Remove forced collision debug write from main game loop.
- Keep FSM transition `HAS_COLLISION` configured as `collisionType: entity` for robust trigger behavior in this project.

## Files patched
- `C:\Users\salam\Downloads\unitedCompressedFiles(11).asm`
- `C:\Users\salam\Documents\Programacion\Mideas\utils\msxGenerator\generators\componentsGenerator.ts`
- `C:\Users\salam\Documents\Programacion\Mideas\utils\msxGenerator\generators\entitiesGenerator.ts`
- `C:\Users\salam\Downloads\patoantic25.json`
