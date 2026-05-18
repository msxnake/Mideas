# Post-ASM Report

- Input: `C:\Users\salam\Documents\Programacion\Mideas\server\temp\post_asm_state_machine_dispatch_apply_test_1778610045857_87142.post_asm_input.asm`
- Findings: 3
- Applied patches: 2
- Original lines: 20
- Output lines: 18
- Net line delta: -2

- Optimization passes run: 2
- Optimization source removed: 2 lines / 30 bytes

## Mideas Block Inventory

- Blocks: 0
- Preserved blocks: 0
- Removable-by-policy blocks: 0
- Dead-block candidates: 0
- Annotated block source: 0 lines / 0 bytes
- Dead-candidate source: 0 lines / 0 bytes
- Marker errors: 0

## Global Label Inventory

- Global labels: 4

| Label | Category | Source |
| --- | --- | --- |
| `SM_ConditionTable` | `data` | 3l/52b |
| `SM_ActionTable` | `data` | 3l/47b |
| `Condition_KeyPressed` | `runtime_code` | 2l/30b |
| `Action_SetVelocity` | `runtime_code` | 3l/29b |

### Largest Unannotated Global Labels

- Unannotated labels: 4

| Category | Labels | Source |
| --- | ---: | ---: |
| `data` | 2 | 6l/99b |
| `runtime_code` | 2 | 5l/59b |

| Label | Category | Source |
| --- | --- | --- |
| `SM_ConditionTable` | `data` | 3l/52b |
| `SM_ActionTable` | `data` | 3l/47b |
| `Condition_KeyPressed` | `runtime_code` | 2l/30b |
| `Action_SetVelocity` | `runtime_code` | 3l/29b |

## state-machine-dispatch-handlers

- Metrics: findings=3, patchable=2, removed_lines=2, removed_source_bytes=30
- Routines: Action_SetVelocity, Condition_KeyPressed, Condition_KeyPressed:table:4

- [patchable] `Condition_KeyPressed:table:4` lines 14-14: `Condition_KeyPressed` dispatch id 4 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [report-only] `Action_SetVelocity` lines 16-18: `Action_SetVelocity` is a state-machine action handler referenced by `SM_ActionTable` (1 table reference(s): SM_ActionTable@11: `DW Action_SetVelocity ; 3`). Direct external references: none. Dispatch id 3 is listed in `project_usage.stateMachineRuntime.usedActionIds`. Patch disabled because one or more table dispatch ids are used or unknown.
- [patchable] `Condition_KeyPressed` lines 19-20: `Condition_KeyPressed` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@14: `DW Condition_KeyPressed ; 4`). Direct external references: none. Dispatch id 4 is not listed in `project_usage.stateMachineRuntime.usedConditionIds`; this is only an unused-by-metadata signal. Patch enabled: all dispatch table ids for this handler are unused by project_usage metadata and there are no direct external references.

## Optimization Passes

- Pass 1: findings=3, patchable=2, removed=2 lines / 30 bytes, lines=20->18
- Pass 2: findings=1, patchable=0, removed=0 lines / 0 bytes, lines=18->18

