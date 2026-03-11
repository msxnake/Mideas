# State Machine Global Variable Compare Fix - 2026-03-10

## Summary

Fixed a bug in the MSX state machine runtime where `VARIABLE_COMPARE` failed for global variables.

Observed symptom:

- `HAS_DEADLY_TILE_COLLISION` worked.
- `VARIABLE_COMPARE` on `player -> Lives` did not.
- Exported ASM contained transitions like `Lives == 3`, but `EXIT_CURRENT_WORLD` never triggered.

This affected exported state machines that compared globals from `SM_GlobalVarTable`, including:

- `Lives`
- `Score`
- `gem_count`
- `last_gem_char`

## Root Cause

The bug was in `Condition_VariableCompare` for the global-variable path (`VarID >= 6`).

Broken sequence:

```asm
ld a, (de)              ; A = global variable value
ld e, a                 ; E = variable value
pop de                  ; Restore Compare Value to D
```

Problem:

- `E` temporarily held the global variable value.
- `pop de` restored the old `DE` pair and overwrote `E`.
- The compare stage then used a corrupted `E` instead of the actual global value.

As a result, expressions such as `Lives == 3` could evaluate false even when `global_var_lives` really was `3`.

## Fix

Correct sequence:

```asm
ld a, (de)              ; A = global variable value
pop de                  ; Restore Compare Value to D
ld e, a                 ; E = variable value
```

This preserves:

- `D` = compare constant
- `E` = global variable value

which matches the contract expected by `.do_compare`.

## Files Updated

- `utils/msxGenerator/generators/stateMachineGenerator.ts`
- exported test/fix target `C:/Users/salam/Downloads/pp3.asm`

## Practical Impact

After this fix, exported ASM can correctly evaluate transitions such as:

```asm
AND(HAS_DEADLY_TILE_COLLISION, VARIABLE_COMPARE("Lives" == 3))
```

and actions like `EXIT_CURRENT_WORLD` can fire when the global condition is actually true.
