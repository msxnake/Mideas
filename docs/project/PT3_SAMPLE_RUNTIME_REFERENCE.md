# Native PT3 Sample Runtime Reference

This document defines the shared contract between the TypeScript PT3 sample
engine and the Z80 runtime emitted by `soundGenerator.ts`.

## Scope

The native tracker can mix legacy Mideas PSG instruments with instruments whose
`instrumentMode` is `pt3-sample`. Pattern effects such as `CurESld`/`CurEDel`,
PT3 pattern commands and the visual step editor are outside this runtime slice.

## Serialized instrument ABI

Bytes 0 through 17 keep the legacy descriptor unchanged. The extension is:

| Offset | Size | Meaning |
| --- | ---: | --- |
| 18 | 1 | Mode: `0=legacy`, `1=pt3-sample` |
| 19 | 1 | PT3 sample length |
| 20 | 1 | Loop position |
| 21 | 1 | Envelope slide mode: `0=legacy 8-bit`, `1=corrected 16-bit` |
| 22 | 2 | Pointer to normalized PT3 steps |

Each normalized step occupies five bytes:

1. Volume in bits 0-3; amplitude slide code in bits 4-5 (`0=none`, `1=-1`, `2=+1`).
2. Flags: accumulate tone, tone enable, noise enable, hardware-envelope enable,
   accumulate noise/envelope.
3. Signed tone-period offset low byte.
4. Signed tone-period offset high byte.
5. Noise offset byte or signed envelope offset byte.

## Runtime state

Every channel owns sample position, 16-bit tone accumulator, signed amplitude
slide, signed noise accumulator and 16-bit envelope accumulator. Note-on and cut
reset the complete per-channel group.

Global state follows the reference PT3 replayer:

- `AddToNs` is persistent. It is cleared only by music init, restart or track change.
- `AddToEn` is cleared every frame.
- Noise requests are last-wins in channel order A, B, C.
- Envelope requests sum in channel order A, B, C.
- If any contributing channel uses legacy envelope mode, the reducer wraps the
  final envelope sum to signed 8-bit; otherwise it remains signed 16-bit.
- R13 is written only for an explicit envelope-shape retrigger.

## Public register contracts

The public music API remains unchanged:

- `music_play_track`: input `A=track index`, `B bit0=loop`; destroys
  `AF,BC,DE,HL`; balances the stack on every exit.
- `music_update`: no input; destroys `AF,BC,DE,HL`; called once per VBlank.
- `music_stop`, `music_mute`, `music_resume`: existing public behavior retained.

New PT3 routines are internal. `music_update_one_pt3_channel` receives the
channel in `C`, may destroy `AF,BC,DE,HL`, preserves `IX/IY`, and never exposes
intermediate state to callers.

## Golden trace validation

`build_pt3_phase_e_rom.mjs` generates two simple 32K ROM fixtures:

- A real eight-frame KUVO sample-04 trace.
- A six-frame three-channel arbitration trace covering noise last-wins,
  envelope summation, loops and corrected 16-bit accumulation.

Glass compiles both ROMs. OpenMSX breaks at `phase_e_trace_marker`, captures
R0-R13, counts R13 writes and reads persistent `music_pt3_noise_add`. The checker
compares R0-R12 byte for byte with the TypeScript driver; R13 is compared only
when the TypeScript frame requests a write, and the cumulative write count
verifies that it is not retriggered accidentally.

Relevant commands:

```text
node scripts/build_pt3_phase_e_rom.mjs
python scripts/compile_glass.py --source test/pt3/out/phase_e_golden.asm --output test/pt3/out/phase_e_golden.rom --symbols test/pt3/out/phase_e_golden.sym --project-root .
python scripts/compile_glass.py --source test/pt3/out/phase_e_global.asm --output test/pt3/out/phase_e_global.rom --symbols test/pt3/out/phase_e_global.sym --project-root .
node scripts/check_pt3_phase_e.mjs
```

The OpenMSX runs between compilation and the final checker use
`test/pt3/phase_e_trace.tcl` and `test/pt3/phase_e_global_trace.tcl`.
