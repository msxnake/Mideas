# MSX2 Shoot Definition: precise aimed fire

`aimed` with `spray=0` now targets the player's body centre at the instant each
wave fires. The bullet keeps this straight trajectory; it is not homing.
`freezeWhileFiring` still controls the boss independently. An intentional spray
continues to select offset ring directions. Linear, spread and radial patterns
retain their existing ring behaviour. A spread of one is still a spread.

The previous aim snapped to compass/ring directions. Its diagonal correction
could even move an exact 45-degree displacement onto an odd ring slot.

`bitmap_boss_aim_vector` calculates signed 16-bit centre differences, including
the player's authored hitbox offset. It divides the minor displacement by the
major displacement with eight binary steps and rounds to the nearest 1/256.
A 257-entry table yields normalised positive 8.8 components; signs, axis order
and speed are then applied. Coincident centres use a downward vector.

Contract: reads coordinates and `boss_shoot_spd`; returns whole dx/dy in D/E
and fractions in `boss_sbul_dxf/dyf`. Clobbers AF/BC/DE/HL, preserves IX/IY,
mapper and VDP state. Calls the existing shadow table reader and speed scaler.
The wave dispatcher tail-calls the existing slot allocator. Pool layout,
8-byte pattern records and per-frame bullet movement are unchanged. The helper
and its 1,028-byte table are emitted only when a precise aimed record is used.

Verification commands (repository root):

```powershell
python scripts/build_mideas_unified_rom.py --json test/msx2-boss/fixture_shoot_aimed.json --project-root . --rom-mode megarom --asm-output work/aimed_precise.asm --rom-output work/aimed_precise.rom --sym-output work/aimed_precise.sym
python scripts/check_msx2_aimed_openmsx.py --asm work/aimed_precise.asm
```

The directed ROM extracts the actual generated vector routine, scaler and table.
It isolates the shadow reader with its register contract. OpenMSX checks 1,004
cases at speeds 1–4, all quadrants, near-axis and diagonal bearings, coincident
centres, and centres extending beyond byte coordinates. Assertions cover signed
direction, perpendicular error below 1 pixel at target distance, speed error
below 0.5%, IX/IY and stack preservation. Observed maximums: 0.880 pixel,
0.256% speed error and 663 microseconds including the isolated table lookup.
This is subpixel fixed-point precision, not mathematically infinite precision.

The real-project route is `test/msx2-boss/test607_precise_aim.tcl`, paired with
`work/test607_precise.rom/.sym`. It checks accepted spawns, burst completion,
freeze behaviour, register preservation and timing with the real table reader.
Its player invulnerability poke is confined to the test session. The playable
ROM has no test instrumentation. Results go to `work/test607_precise_probe.txt`.

Real test607 result: 35 accepted spawns, eight completed four-wave bursts,
zero aim/register/freeze failures and one initial boot (no reset). Maximum
perpendicular miss was 0.126 pixel. The actual banked table reader brings the
maximum vector cost to 1,189 microseconds per shot. This does not by itself
prove a 60 Hz budget for every scene. The final build also clears the exhausted
wave counter, matching the ring path. Its extracted vector passes all 1,004
cases in `work/test607-final-vector-test`.

The existing generator baseline check reports a boss-fixture mismatch whose
first difference is the earlier body-centre change; the other 12 cases pass.
That broader baseline has not been reset as part of this fix.
