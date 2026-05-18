# Post-ASM Report

- Input: `C:\Users\salam\Documents\Programacion\Mideas\server\temp\post_asm_component_runtime_apply_test_1778610045410_482461.post_asm_input.asm`
- Findings: 2
- Applied patches: 1
- Original lines: 20
- Output lines: 17
- Net line delta: -3

- Optimization passes run: 2
- Optimization source removed: 3 lines / 44 bytes

## Mideas Block Inventory

- Blocks: 0
- Preserved blocks: 0
- Removable-by-policy blocks: 0
- Dead-block candidates: 0
- Annotated block source: 0 lines / 0 bytes
- Dead-candidate source: 0 lines / 0 bytes
- Marker errors: 0

## Global Label Inventory

- Global labels: 3

| Label | Category | Source |
| --- | --- | --- |
| `update_input_component` | `runtime_code` | 4l/45b |
| `update_position_component` | `runtime_code` | 2l/35b |
| `boot_entry` | `boot_or_init` | 3l/21b |

### Largest Unannotated Global Labels

- Unannotated labels: 3

| Category | Labels | Source |
| --- | ---: | ---: |
| `boot_or_init` | 1 | 3l/21b |
| `runtime_code` | 2 | 6l/80b |

| Label | Category | Source |
| --- | --- | --- |
| `update_input_component` | `runtime_code` | 4l/45b |
| `update_position_component` | `runtime_code` | 2l/35b |
| `boot_entry` | `boot_or_init` | 3l/21b |

## unused-component-runtime

- Metrics: findings=2, patchable=1, removed_lines=3, removed_source_bytes=44
- Routines: runtime.components.system.input, runtime.components.system.input:update_input_component

- [report-only] `runtime.components.system.input` lines 15-18: `runtime.components.system.input` covers unused input component labels: update_input_component. `project_usage.componentRuntime.usedComponents` is Position, so component type `Input` is not used by active entities. `componentCounts.Input` is 0. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.input` with 1 window(s).
- [patchable] `runtime.components.system.input:update_input_component` lines 15-17: `update_input_component` is part of unused component runtime group `runtime.components.system.input`. The group has no external references, so this window is removed only together with the other group windows.

## Optimization Passes

- Pass 1: findings=2, patchable=1, removed=3 lines / 44 bytes, lines=20->17
- Pass 2: findings=0, patchable=0, removed=0 lines / 0 bytes, lines=17->17

