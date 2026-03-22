# Plain48k Status

This note documents the current state of `plain48k` support in Mideas.

## Goal

Use a linear 48 KB ROM layout as the intermediate step between:

- `simple32k` for ROMs up to 32 KB
- `megarom` for ROMs above 48 KB

Target thresholds:

- `<= 32768` bytes: `simple32k`
- `32769 .. 49152` bytes: `plain48k`
- `>= 49153` bytes: `megarom`

## Current Status

`plain48k` is wired into the toolchain configuration and diagnostics. The
generator now emits an explicit linear-48K scaffold (`ORG #0000` page-0
section, `ORG #4000` cartridge header, and final pad to `#C000`).

The first real page-0 cold-data group is now implemented:

- `PresentationScreen` now defaults to `runtime.romDataGroup = auto`.
- `auto` packs it into page 0 first when the 16 KB budget allows it.
- Manual overrides still exist: `default` keeps it in the normal ROM area and
  `page0` forces page-0 placement.
- Those bytes are emitted into `page0.asm` instead of `screens.asm`.
- Runtime helpers now copy page-0 data through a RAM buffer and then to VRAM,
  restoring BIOS in page 0 after each chunk.
- ZX0 preprocessing now understands that compressed `PresentationScreen` data
  must switch from `page0_copy_to_vram` to `FAST_LDIRVM` once it has been
  decompressed into RAM.

That means:

- The mode can now be selected in UI/CLI/server config.
- Unified/main ASM preserve the intended 48K file structure explicitly.
- Diagnostics distinguish between `Linear48K Page0 Data: Yes` and `No`, and
  now expose used/remaining page-0 budget.
- `PresentationScreen` is the first supported grouped asset for page 0.
- The compiler/server can report when a ROM is a good `plain48k` candidate.
- General cold-data packing for other asset families is still pending.

## Constraint

A real 48 KB linear ROM needs:

1. A real page-0 section in the ROM image.
2. Runtime helpers to map the game into page 0 and restore BIOS safely.
3. Cold data moved there intentionally.

The current implementation satisfies those requirements for the
`PresentationScreen` group only, but the page-0 planner is now explicit and
budget-based instead of purely manual.

## Practical Rule

Until more page-0 groups are implemented:

- `plain48k` remains experimental, but no longer as empty plumbing only.
- `auto` should be treated as the default policy for cold data that becomes
  page-0-safe.
- Automatic fallback should stay conservative when the source ASM still marks
  `Linear48K Page0 Data: No`.
- New asset families should be added as explicit cold-data groups, not by
  mixing BIOS-dependent code into page 0.
