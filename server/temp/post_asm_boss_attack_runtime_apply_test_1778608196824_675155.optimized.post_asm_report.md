# Post-ASM Report

- Input: `C:\Users\salam\Documents\Programacion\Mideas\server\temp\post_asm_boss_attack_runtime_apply_test_1778608196824_675155.post_asm_input.asm`
- Findings: 3
- Applied patches: 2
- Original lines: 19
- Output lines: 15
- Net line delta: -4

- Optimization passes run: 2
- Optimization source removed: 4 lines / 85 bytes

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
| `update_boss_projectile_runtime_far` | `far_trampoline` | 3l/45b |
| `draw_boss_projectile_attack_far` | `far_trampoline` | 3l/42b |
| `draw_boss_laser_attack_far` | `far_trampoline` | 2l/36b |
| `boot_entry` | `boot_or_init` | 3l/21b |

### Largest Unannotated Global Labels

- Unannotated labels: 4

| Category | Labels | Source |
| --- | ---: | ---: |
| `boot_or_init` | 1 | 3l/21b |
| `far_trampoline` | 3 | 8l/123b |

| Label | Category | Source |
| --- | --- | --- |
| `update_boss_projectile_runtime_far` | `far_trampoline` | 3l/45b |
| `draw_boss_projectile_attack_far` | `far_trampoline` | 3l/42b |
| `draw_boss_laser_attack_far` | `far_trampoline` | 2l/36b |
| `boot_entry` | `boot_or_init` | 3l/21b |

## unused-boss-attack-runtime

- Metrics: findings=3, patchable=2, removed_lines=4, removed_source_bytes=85
- Routines: runtime.boss.attack.projectile, runtime.boss.attack.projectile:draw_boss_projectile_attack_far, runtime.boss.attack.projectile:update_boss_projectile_runtime_far

- [patchable] `runtime.boss.attack.projectile:update_boss_projectile_runtime_far` lines 12-13: `update_boss_projectile_runtime_far` is part of unused boss attack group `runtime.boss.attack.projectile`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.boss.attack.projectile` lines 13-17: `runtime.boss.attack.projectile` covers boss projectile attack labels: draw_boss_projectile_attack_far, update_boss_projectile_runtime_far. `project_usage.bossAttackRuntime.usedTypes` is Laser, so attack type `Projectile` is not used by any referenced boss attack. No external references outside this attack group were found. This is a candidate for a future atomic type-specific patch. Atomic patch enabled as `runtime.boss.attack.projectile` with 2 window(s).
- [patchable] `runtime.boss.attack.projectile:draw_boss_projectile_attack_far` lines 15-16: `draw_boss_projectile_attack_far` is part of unused boss attack group `runtime.boss.attack.projectile`. The group has no external references, so this window is removed only together with the other group windows.

## Optimization Passes

- Pass 1: findings=3, patchable=2, removed=4 lines / 85 bytes, lines=19->15
- Pass 2: findings=0, patchable=0, removed=0 lines / 0 bytes, lines=15->15

