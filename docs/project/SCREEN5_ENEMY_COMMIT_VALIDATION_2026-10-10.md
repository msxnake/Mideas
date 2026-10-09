# SCREEN 5 enemy changes: isolated commit validation

Base: `25afe9982169cc91afa9cf5f45b72465219db4aa`, including Claude's two boss
commits. Validation used an archive of that HEAD plus only the enemy patch.
Fourteen enemy hunks in the room generator were retained; eight tetrahedron
hunks were excluded. Flow/Presentation, project art and project JSON are not
part of this patch.

## Frozen generator baseline

`node scripts/check_generator_output_identical.mjs --rom` on the clean HEAD
passes all 14 cases and backend/purpose aliases. With the enemy patch, these
13 cases retain both exact ASM and exact ROM hashes:

- presentation-minimal
- presentation-flow-strict
- presentation-chain-from-png
- presentation-bionic-simple32k
- presentation-bionic-megarom
- presentation-flow-walker-menu
- bitmap-room-intro
- bitmap-room-boss
- bitmap-room-boss-no-enemy-freeze
- bitmap-room-enemies
- bitmap-room-enemies-slime
- mixed-screen5-to-screen4
- mixed-screen5-to-screen4-megarom

Only `bitmap-room-enemies-scripted` changes intentionally: complete-body
descriptors, four shared RAM bytes, full-edge terrain probes and guarded
movement replace the fixed 16x16 probes. Its ASM hash changes from
`8a63e490d444e85a4a64ee9a89a0ed8b041b44aa865aa626478c5a6d68cedb11` to
`d0c1839b9d354582bbd15b9fde1d967bdc86d94ed3e10e002a4e82466e36028f`.
Its ROM hash changes from
`dcdd4989dbdf3ecbcf04fe2cebddd6b05642baa2a31786e7d2785f956902097c` to
`c3427efd2d9a5ef66cd31db93f5d373704ea7a764a2f1de5060b60ebd44808b8`.
Therefore the frozen-baseline harness correctly exits 1 for this single
intentional change. The baseline was not re-recorded.

The initial full working-tree run also had comment/layout changes in three
ASM cases, but their ROMs were identical. The isolated patch retains the old
SAT label/terminator layout when compaction is off, so those three ASM hashes
also match exactly. TypeScript compilation passes without allowing errors;
the SAT text replacement uses an ES2020-compatible global regex.

## Feature checks and actual project

On the isolated source:

- 76 OpenMSX pattern-compaction cases pass, using the W1 soldier extracted
  from the current `test744.json`.
- 32 OpenMSX full-body cases pass, plus complete standalone WalkerGravity
  compilation.
- Pursuer contracts, colour-cache positive/negative checks, RAM aliasing and
  sprite-part offsets pass. The historical cache check normalizes only the
  final SAT label/terminator line layout in addition to its documented cache
  address changes; it still compares every instruction.
- Both PowerShell runners retain the emulator process handle and refresh it
  before checking ExitCode, avoiding a null result after a fast exit.
- The current `C:/Users/salam/Downloads/test744.json` compiles with Glass to
  a 262144-byte Konami SCC ROM. Input SHA256:
  `5125450a7cbf1369b3329684b13d5a1d4daf720971d29a62b63c78b5c104b114`.
  Isolated ROM SHA256:
  `e52585e120140406db8060cbeaeb87ab49eeb4d38fc42a3b6ed7c613fef277e4`.
- The pursuer bank audit passes (bank 22, 318 bytes code, 338 bytes used).
  OpenMSX navigates the real flow to room 1; soldier Y=144, bottom=176 and
  full-body floor probe=176. A screenshot confirms all body layers above
  the floor. This isolated ROM excludes the uncommitted intro tetrahedron.

Logs, patch manifest, isolated ASM snapshots, ROM/symbols and screenshot are
under `%TEMP%/mideas-screen5-save-VPAG7R/`. No physical MSX testing or renewed
worst-case gameplay CPU benchmark is claimed.

## Timing and room loading

Five NOPs add 20 nominal Z80 T-states per data-port write. Four writes per
hardware slot add 80 T-states, including a hidden slot; the terminator and
reserved slots receive the same spacing. For a visible compact slot the map
lookup adds another 55 nominal T-states relative to the old immediate add,
for 135 nominal T-states in total. These are instruction counts, excluding
MSX wait states and interrupt overhead, not an emulator timing measurement.
Only the compact enemy writer changes; the player writer is untouched.

`bitmap_load_enemies` is called by the shared `commit_room_flip` path before
the boss load. Thus the compact map/pool load can also run when entering a
boss room in a project that emits the compact enemy system. There is no
special boss exemption. Empty rooms skip a zero-length pattern upload;
the old path uploaded enemy patterns per used slot, whereas the compact
path uploads the room's shared pool once. Boss-room flip latency and the
most crowded combined boss/soldier frame have not been remeasured.

Claude's follow-up proposes a dedicated 9x29 player-hitbox descriptor for the
pursuer in his F1a-2a rebase. This commit leaves that policy to that follow-up;
the current geometry remains the complete sprite for scripted/WalkerGravity.
