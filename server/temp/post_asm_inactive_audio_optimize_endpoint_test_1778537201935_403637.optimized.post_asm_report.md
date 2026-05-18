# Post-ASM Report

- Input: `C:\Users\salam\Documents\Programacion\Mideas\server\temp\post_asm_inactive_audio_optimize_endpoint_test_1778537201935_403637.post_asm_input.asm`
- Findings: 3
- Applied patches: 1
- Original lines: 15
- Output lines: 13
- Net line delta: -2

- Optimization passes run: 2
- Optimization source removed: 2 lines / 29 bytes

## Mideas Block Inventory

- Blocks: 0
- Preserved blocks: 0
- Removable-by-policy blocks: 0
- Dead-block candidates: 0
- Annotated block source: 0 lines / 0 bytes
- Dead-candidate source: 0 lines / 0 bytes
- Marker errors: 0

## Inactive Feature Runtime Inventory

| Feature | Findings | Patchable | Annotated | Unannotated | Preserved | Owners |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `sounds` | 1 | 1 | 0 | 1 | 0 | - |

## Global Label Inventory

- Global labels: 3

| Label | Category | Source |
| --- | --- | --- |
| `task_audio_tick_far` | `far_trampoline` | 3l/30b |
| `show_menu_main` | `runtime_code` | 2l/24b |
| `boot_entry` | `boot_or_init` | 3l/21b |

### Largest Unannotated Global Labels

- Unannotated labels: 3

| Category | Labels | Source |
| --- | ---: | ---: |
| `boot_or_init` | 1 | 3l/21b |
| `far_trampoline` | 1 | 3l/30b |
| `runtime_code` | 1 | 2l/24b |

| Label | Category | Source |
| --- | --- | --- |
| `task_audio_tick_far` | `far_trampoline` | 3l/30b |
| `show_menu_main` | `runtime_code` | 2l/24b |
| `boot_entry` | `boot_or_init` | 3l/21b |

## inactive-feature-runtime

- Metrics: findings=3, patchable=2, removed_lines=4, removed_source_bytes=58
- Routines: runtime.sound.group.tick, runtime.sound.group.tick:task_audio_tick_far, task_audio_tick_far

- [report-only] `runtime.sound.group.tick` lines 11-13: `runtime.sound.group.tick` groups inactive audio tick runtime labels: task_audio_tick_far. No external references outside the group were found. This is ready for a future atomic multi-window patch, or for dead-blocks to remove the annotated windows as whole groups. Atomic patch enabled as `runtime.sound.group.tick` with 1 window(s).
- [patchable] `runtime.sound.group.tick:task_audio_tick_far` lines 11-12: `task_audio_tick_far` is part of inactive runtime group `runtime.sound.group.tick`. The group has no external references, so this window is removed only together with the other group windows.
- [patchable] `task_audio_tick_far` lines 11-13: `task_audio_tick_far` looks like audio runtime (3 lines, 30 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: unannotated.  Atomic patch enabled as `runtime.sound.group.tick` with 1 window(s).The patch is still validated by the post-ASM transform invariants.

## Optimization Passes

- Pass 1: findings=3, patchable=1, removed=2 lines / 29 bytes, lines=15->13
- Pass 2: findings=0, patchable=0, removed=0 lines / 0 bytes, lines=13->13

