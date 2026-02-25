# Session Context - 2026-02-25

## Error report
- `jump + wall_collision` could teleport the player from lower screen area to top (`Y ~= 8`) during upward collision scenarios.
- Issue persisted even after regenerating ASM and reloading ROM, so it was not a stale-build problem.

## Findings
- The problematic path was in `update_wallcollision_component` during ceiling handling:
  - `.wall_up_blocked`
  - `.wall_up_top_edge`
- Behavior was consistent with an invalid ceiling snap target (top correction jumping too far up), plus possible one-frame abnormal vertical delta.

## Fixes applied
1. Ceiling snap guard in `.wall_up_blocked`:
   - If `new_top < current_top`, skip snap and only cancel upward momentum (`.wall_up_cancel_only`).
2. Top-edge sanity guard in `.wall_up_top_edge`:
   - If entity is not near top (`wall_temp_y >= 24`), treat as invalid top-edge event and go to `.wall_up_cancel_only`.
3. Defensive `VelY` clamp in `update_position_component`:
   - Clamp vertical delta to `[-16..+16]` before applying `Y = Y + VelY`.

## Files
- `utils/msxGenerator/generators/componentsGenerator.ts`
- `C:\Users\salam\Downloads\unitedCompressedFiles(16).asm`

## Validation
- ROM rebuilt and relaunched in OpenMSX.
- User-confirmed status: **resolved**.
