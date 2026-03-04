# PT3 Playback Timing Reference

Practical note for this project: if PT3 music slows down when the player moves or when gameplay gets busy, the base cause is usually not the song data. The usual cause is variable tick cadence.

## Root Cause

A PT3 player must be updated at a constant rate.

If `PT3_Update`, `PT3_Play`, `PT3_Decode`, or the equivalent tick routine is called from a variable-cost main loop:

- idle frames call the music routine more often
- busy frames call it less often
- the effective music tempo drops when gameplay work increases

Typical extra work that causes this:

- collision checks
- scroll updates
- VRAM copies
- expensive BIOS calls
- large loops under `DI`

Result:

- fewer music ticks per second
- slower playback
- possible audible stutter if frame pacing is uneven

## Correct Rule on MSX

The music tick must run at a fixed rate:

- 50 Hz on PAL timing
- 60 Hz on NTSC timing

The update cadence must be tied to an interrupt or to a frame-derived fixed tick, not to a free-running gameplay loop.

## Recommended Approaches

### A. Preferred: Run Music on VBlank

Use the VBlank interrupt path (IM1 / hook / project interrupt dispatcher) and execute only the music tick there.

Safe ISR pattern:

1. Save the required registers
2. Call the PT3 tick routine
3. Restore registers
4. Return quickly

Inside the interrupt:

- do music work
- optionally set a simple frame flag
- do not run heavy gameplay logic
- do not copy large blocks to VRAM

The interrupt path should stay short and deterministic.

### B. Acceptable: Frame Counter Gate

If the player should remain outside the ISR:

1. Use VBlank only to increment a byte/flag such as `frameTick`
2. In the main loop, detect whether `frameTick` changed
3. Call the PT3 routine exactly once for each new frame

This still guarantees one music tick per frame even if the main loop spins at a variable speed.

## Common Secondary Causes

### Long `DI` Windows

If interrupts are disabled for too long:

- VBlank can be delayed or missed
- music becomes jerky or slower

Rule:

- keep `DI` sections as short as possible
- never wrap expensive work such as long VRAM loops or large copies inside long interrupt-disabled regions

### Slow BIOS Usage During Active Frames

Repeated BIOS calls in the hot path can make the frame cost spike.

Examples that deserve scrutiny:

- joystick polling
- trigger polling
- VRAM copy helpers

The issue is not that BIOS is always wrong, but that a music tick tied to total frame time becomes fragile when these calls accumulate.

### PSG Contention With SFX

Independent SFX writes to the PSG usually cause:

- channel corruption
- wrong mixer state
- envelope glitches

They do not usually cause tempo slowdown by themselves, but they can make diagnosis confusing if music timing and PSG ownership are both wrong at once.

## Fast Diagnostic Checklist

- The music tick must be called from VBlank or from a fixed one-tick-per-frame gate.
- The game must avoid long `DI` sections.
- Heavy VRAM updates should be split or scheduled carefully.
- Movement logic should not introduce large per-frame timing spikes.
- SFX should respect channel ownership or a clear merge policy.

## Simple Confirmation Test

To confirm the problem with minimal intrusion:

1. Increment a counter every time the PT3 tick routine is called
2. Sample that counter over one second, or over a fixed frame window
3. Compare the value while idle versus while moving

If the count drops during movement, the music is being clocked by variable frame cost instead of a fixed cadence.

## Design Constraint for Mideas

Whenever this repository integrates or audits PT3 playback:

- do not tie PT3 tempo to a variable-cost gameplay loop
- keep the music tick cadence deterministic
- treat long `DI` sections as a timing bug risk
- separate music timing from heavy render/update work

This is the first thing to verify when music "slows down" under load.
