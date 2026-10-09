# SCREEN 5: collision against the complete enemy body

Implemented on 2026-10-09 after the soldier collision diagnosis.

## Behaviour

The scripted enemy runtime and WalkerGravity now use the complete sprite
rectangle for terrain collisions. Bounds include the authored canvas and all
positioned 16x16 cells across the selected animation frames. Colour layers do
not add separate physical bodies. The damage hitbox remains independent.

Floor and ceiling probes cover the complete width; wall probes cover the
complete height. Edge sampling visits every intersected 8x8 collision quadrant,
including unaligned edges and partial tile shapes. Horizontal and vertical
movement check each traversed pixel to prevent fast movement, WALK,
WALK_BACK and TURN_AND_WALK from entering terrain. Foot probes preserve the
existing one-way platform semantics. Physical room bounds constrain the
scripted and WalkerGravity spawn and movement limits.

Other dedicated movement engines (for example, patrol, flyers and slime) retain
their existing behaviour; this change covers the terrain walking runtime used
by the soldier and WalkerGravity.

## Representation and register contracts

`msx2EnemyBodyCollision.ts` owns geometry generation and shared ASM probes.
The room generator emits resident four-byte descriptors:
`left, top, width - 1, height - 1`. Left/top are signed; spans support a
256-pixel width without wrapping. A descriptor is emitted for each source
colour block, so `(ix+12)` identifies geometry independently of pattern
compaction, colour layers and shared behaviour programs.

Descriptors are loaded once per enemy update into four shared RAM bytes.
The enemy pool stride is unchanged. The RAM allocation places these bytes
before bullets and the colour cache, including the WalkerGravity runtime
without a scripted behaviour program.

Public probes return AF/Z and preserve BC/DE/HL/IX/IY. Internal geometry and
scan routines document their narrower contracts and save the registers that
`bitmap_probe_solid` destroys. No mapper or VDP interrupt contract changes.

## Validation

- `test/msx2-enemy-body-collision/run_validation.ps1`: 32 OpenMSX cases with
  the real terrain probes, multiple body sizes, signed cell offsets, partial
  walls, one-way platforms, fast movement, falling, jumping, WALK_BACK and
  WalkerGravity. It also compiles a complete WalkerGravity fixture without
  the scripted runtime.
- Pursuer allocation/room transition contracts, colour cache isolation and
  RAM aliasing checks pass. Production Vite build and Glass compilation pass.
- The rebuilt `test744` Konami SCC ROM passes the pursuer bank contract.
  OpenMSX reaches rooms 4, 3, 2 and 1 through the real flow.
- In room 1 the 16x32 soldier now settles at Y=144, with its bottom at the
  floor's Y=176. Before the fix it settled at Y=160, penetrating 16 pixels.
- With the real map and the soldier positioned at X=176,Y=128, the previous
  trace entered the lower wall at X=177. The corrected trace keeps X=176
  (right edge 192) and turns. The independent cases also verify wall probes
  and unconditional WALK blocking directly.

Artifacts in `%TEMP%/mideas-enemy-slot-fix/`: `test744-collision.asm/.rom/.sym`,
`soldier-bounds-fixed.tcl/.log`, `soldier-floor-fixed.png`, and
`soldier-wall-fixed.tcl/.log`. The ROM is padded with FF to 262144 bytes.
