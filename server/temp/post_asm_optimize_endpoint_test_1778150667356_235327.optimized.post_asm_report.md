# Post-ASM Report

- Input: `C:\Users\salam\Documents\Programacion\Mideas\server\temp\post_asm_optimize_endpoint_test_1778150667356_235327.post_asm_input.asm`
- Findings: 1
- Applied patches: 1
- Original lines: 13
- Output lines: 9
- Net line delta: -4

- Optimization passes run: 2
- Optimization source removed: 4 lines / 123 bytes

## Mideas Block Inventory

- Blocks: 2
- Preserved blocks: 0
- Removable-by-policy blocks: 2
- Dead-block candidates: 1
- Annotated block source: 8 lines / 243 bytes
- Dead-candidate source: 4 lines / 123 bytes
- Marker errors: 0

- By kind: component=2
- By owner: test=2
- By status: candidate_unreferenced=1, rooted=1

### Largest Annotated Blocks

| ID | Status | Source | Kind | Owner |
| --- | --- | --- | --- | --- |
| `dead_block` | `candidate_unreferenced` | 4l/123b | `component` | `test` |
| `live_block` | `rooted` | 4l/120b | `component` | `test` |

## Global Label Inventory

- Global labels: 3

| Label | Category | Source |
| --- | --- | --- |
| `live_label` | `runtime_code` | 5l/110b |
| `boot_entry` | `boot_or_init` | 5l/108b |
| `init_auto_destroy_system` | `boot_or_init` | 3l/67b |

### Largest Unannotated Global Labels

- Unannotated labels: 1

| Category | Labels | Source |
| --- | ---: | ---: |
| `boot_or_init` | 1 | 5l/108b |

| Label | Category | Source |
| --- | --- | --- |
| `boot_entry` | `boot_or_init` | 5l/108b |

| ID | Kind | Owner | Status | Incoming | Source | Lines | Labels |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `live_block` | `component` | `test` | `rooted` | 1 | 4l/120b | 5-8 | live_label |
| `dead_block` | `component` | `test` | `candidate_unreferenced` | 0 | 4l/123b | 10-13 | init_auto_destroy_system |

## Dead-Block Candidates

- `dead_block`: 4 lines / 123 bytes. No external references found for any global label in this block.

## dead-blocks

- Metrics: findings=1, patchable=1, removed_lines=4, removed_source_bytes=123
- Routines: dead_block

- [patchable] `dead_block` lines 10-13: Block `dead_block` (component/test) is a dead-code candidate. No external references found for any global label in this block. Labels: init_auto_destroy_system.

## Optimization Passes

- Pass 1: findings=1, patchable=1, removed=4 lines / 123 bytes, lines=13->9
- Pass 2: findings=0, patchable=0, removed=0 lines / 0 bytes, lines=9->9

