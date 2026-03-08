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

`plain48k` is wired into the toolchain configuration and diagnostics, but the
generator does **not** yet relocate cold assets into page 0 (`0000h-3FFFh`).

That means:

- The mode can already be selected in CLI/server config.
- The compiler/server can report when a ROM is a good `plain48k` candidate.
- The runtime still lacks the real page-0 data layout needed for a functional
  linear 48 KB build.

## Constraint

A real 48 KB linear ROM needs:

1. A real page-0 section in the ROM image.
2. Runtime helpers to map the game into page 0 and restore BIOS safely.
3. Cold data moved there intentionally.

Without those pieces, a ROM that merely grows past 32 KB is not a valid
`plain48k` implementation.

## Practical Rule

Until page-0 packing is implemented:

- `plain48k` should be treated as experimental metadata/plumbing.
- Automatic fallback should stay conservative if the source ASM does not expose
  a real linear 48 KB layout.
