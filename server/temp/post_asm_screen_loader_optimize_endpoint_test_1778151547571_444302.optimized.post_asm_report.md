# Post-ASM Report

- Input: `C:\Users\salam\Documents\Programacion\Mideas\server\temp\post_asm_screen_loader_optimize_endpoint_test_1778151547571_444302.post_asm_input.asm`
- Findings: 2
- Applied patches: 2
- Original lines: 18
- Output lines: 11
- Net line delta: -7

- Optimization passes run: 2
- Optimization source removed: 7 lines / 373 bytes

## Mideas Block Inventory

- Blocks: 1
- Preserved blocks: 0
- Removable-by-policy blocks: 1
- Dead-block candidates: 0
- Annotated block source: 4 lines / 277 bytes
- Dead-candidate source: 0 lines / 0 bytes
- Marker errors: 0

- By kind: routine=1
- By owner: screens=1
- By status: rooted=1

### Largest Annotated Blocks

| ID | Status | Source | Kind | Owner |
| --- | --- | --- | --- | --- |
| `runtime.screens.load_screen_dead_screen_234567890123.loader` | `rooted` | 4l/277b | `routine` | `screens` |

## Global Label Inventory

- Global labels: 3

| Label | Category | Source |
| --- | --- | --- |
| `load_screen_dead_screen_234567890123_far` | `screen_loader` | 5l/246b |
| `load_screen_dead_screen_234567890123` | `screen_loader` | 3l/128b |
| `boot_entry` | `boot_or_init` | 3l/21b |

### Largest Unannotated Global Labels

- Unannotated labels: 2

| Category | Labels | Source |
| --- | ---: | ---: |
| `boot_or_init` | 1 | 3l/21b |
| `screen_loader` | 1 | 5l/246b |

| Label | Category | Source |
| --- | --- | --- |
| `load_screen_dead_screen_234567890123_far` | `screen_loader` | 5l/246b |
| `boot_entry` | `boot_or_init` | 3l/21b |

| ID | Kind | Owner | Status | Incoming | Source | Lines | Labels |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `runtime.screens.load_screen_dead_screen_234567890123.loader` | `routine` | `screens` | `rooted` | 1 | 4l/277b | 15-18 | load_screen_dead_screen_234567890123 |

## unused-screen-loaders

- Metrics: findings=2, patchable=2, removed_lines=7, removed_source_bytes=373
- Routines: load_screen_dead_screen_234567890123_far, runtime.screens.load_screen_dead_screen_234567890123.loader

- [patchable] `load_screen_dead_screen_234567890123_far` lines 11-15: `load_screen_dead_screen_234567890123_far` is a generated screen loader (5 lines, 246 source bytes) with no external label references. Category reason: Generated screen loader routine. Project metadata maps it to scene `Dead Screen` (index=0, resources=1). GameFlow reachability marks this scene unreachable. Related annotated loader block `runtime.screens.load_screen_dead_screen_234567890123.loader` is currently rooted by `load_screen_dead_screen_234567890123`. Deletion is patchable only when GameFlow reachability proves the scene is unreachable.
- [patchable] `runtime.screens.load_screen_dead_screen_234567890123.loader` lines 15-18: Annotated loader block `runtime.screens.load_screen_dead_screen_234567890123.loader` only feeds `load_screen_dead_screen_234567890123_far`, and GameFlow reachability marks the owning scene unreachable.

## Optimization Passes

- Pass 1: findings=2, patchable=2, removed=7 lines / 373 bytes, lines=18->11
- Pass 2: findings=0, patchable=0, removed=0 lines / 0 bytes, lines=11->11

