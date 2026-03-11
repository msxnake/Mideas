# Deadly Tiles Runtime Fix (2026-03-08)

## Summary

`DeadlyTiles` was reading correct `runtime_behavior_map` bytes (`#04` / `#14`), but the hero did not die and `flag_Deadly_tile` stayed cleared.

The root cause was register preservation inside `update_entity_deadly_flag_runtime`.

## Root Cause

The routine received the entity index in register `C`, then called `wall_build_hitbox_cache` before preserving `BC`.

That was unsafe because `wall_build_hitbox_cache` can clobber `BC`.

Later, when the routine reached `.det_found` or `.det_clear`, it restored or reused the wrong `C` value and wrote `entity_flag_deadly_tile` into the wrong entity slot.

Result:

- deadly tile probes could read the correct map value
- the state machine condition could remain false for the hero
- debug data could suggest "map detection works" while the per-entity flag still failed

## Fix Applied

File:

- [componentsGenerator.ts](/c:/Users/salam/Documents/Programacion/Mideas/utils/msxGenerator/generators/componentsGenerator.ts)

Change:

- moved `push bc` to the first instruction of `update_entity_deadly_flag_runtime`
- kept the same `pop bc` exit structure in `.det_found` and `.det_clear`

This guarantees that the original entity index survives the call to `wall_build_hitbox_cache` and the deadly flag is written back to the correct entity slot.

## Debugging Notes

During the investigation, dedicated RAM debug bytes were also introduced to avoid false readings from temporary scratch memory:

- `tileDead_dbg`
- `tileDead_latched_dbg`
- `tileDead_x_dbg`
- `tileDead_y_dbg`
- `tileDead_value_dbg`

These live in fixed RAM, not in `temp_byte_26`, so they are safer to inspect from OpenMSX.

## Observable Symptom Before Fix

- `runtime_behavior_map` contained valid deadly bytes
- `tileDeadValue` could show `04`
- `tileDead` / `tileDeadLatched` stayed `00`
- hero state machine did not transition to dead

## Expected Behavior After Fix

When the hero overlaps a deadly tile:

- `entity_flag_deadly_tile[hero]` bit 0 is set
- `Condition_DeadlyTile` becomes true
- the state machine can enter `Dead` or apply any configured death action

## Regression Check

In OpenMSX, confirm:

1. `runtime_behavior_map` contains `04`/`14` on deadly cells.
2. `tileDead_value_dbg` reaches `04` or `14` when the hero stands on deadly.
3. `tileDead_latched_dbg` becomes `01`.
4. the hero state machine reacts as expected.
