# Post-ASM Report

- Input: `C:\Users\salam\Documents\Programacion\Mideas\builds\msx2_screen4_pacman_player_only_compressed.asm`
- Selected rules: dead-blocks, unused-screen-loaders, inactive-feature-runtime, unused-boss-attack-runtime, unused-component-runtime, state-machine-dispatch-handlers
- Findings: 0
- Applied patches: 0
- Original lines: 15764
- Output lines: 15764
- Net line delta: 0

- Optimization passes run: 1
- Optimization source removed: 0 lines / 0 bytes

## Mideas Block Inventory

- Blocks: 0
- Preserved blocks: 0
- Removable-by-policy blocks: 0
- Dead-block candidates: 0
- Annotated block source: 0 lines / 0 bytes
- Dead-candidate source: 0 lines / 0 bytes
- Marker errors: 0

## Global Label Inventory

- Global labels: 159

| Label | Category | Source |
| --- | --- | --- |
| `msx2_player_bullet_1_check_enemy_collision` | `runtime_code` | 1674l/27352b |
| `msx2_player_bullet_check_enemy_collision` | `runtime_code` | 1674l/27278b |
| `update_msx2_enemy_state` | `runtime_code` | 956l/14924b |
| `update_msx2_enemy_bullet` | `runtime_code` | 844l/14003b |
| `update_msx2_enemy_position_slot_11` | `runtime_code` | 629l/11359b |
| `update_msx2_enemy_position_slot_10` | `runtime_code` | 627l/11357b |
| `update_msx2_enemy_position_slot_9` | `runtime_code` | 627l/11192b |
| `update_msx2_enemy_position_slot_8` | `runtime_code` | 627l/11191b |
| `update_msx2_enemy_position_slot_7` | `runtime_code` | 627l/11191b |
| `update_msx2_enemy_position_slot_6` | `runtime_code` | 627l/11191b |
| `update_msx2_enemy_position_slot_5` | `runtime_code` | 627l/11191b |
| `update_msx2_enemy_position_slot_4` | `runtime_code` | 627l/11191b |
| `update_msx2_enemy_position_slot_3` | `runtime_code` | 627l/11191b |
| `update_msx2_enemy_position_slot_2` | `runtime_code` | 627l/11191b |
| `update_msx2_enemy_position_slot_1` | `runtime_code` | 627l/11191b |
| `write_hardware_sprite_attrs` | `runtime_code` | 504l/10799b |
| `update_msx2_enemy_position_slot_0` | `runtime_code` | 516l/9644b |
| `msx2_check_enemy_wave_complete` | `runtime_code` | 438l/7099b |
| `MSX2_SCREEN_4_PAC_MAN_PLAYER_ONLY_NAMES` | `data` | 51l/3519b |
| `msx2_reset_enemy_runtime_for_current_screen` | `runtime_code` | 166l/2576b |
| `init_hardware_sprites` | `boot_or_init` | 91l/2521b |
| `update_msx2_effect_state` | `runtime_code` | 71l/1492b |
| `update_msx2_player_bullet_slot_1` | `runtime_code` | 68l/1475b |
| `load_MSX2_SCREEN_4_PAC_MAN_PLAYER_ONLY_screen4` | `runtime_code` | 50l/1400b |
| `msx2_restart_game` | `runtime_code` | 41l/1331b |
| `msx2_continue_after_level_complete` | `runtime_code` | 39l/1313b |
| `update_hardware_sprite_vertical` | `runtime_code` | 52l/1267b |
| `msx2_respawn_current_screen` | `runtime_code` | 41l/1100b |
| `MSX2_SCREEN_4_PAC_MAN_PLAYER_ONLY_BANK_2_PATTERNS` | `data` | 17l/1081b |
| `MSX2_SCREEN_4_PAC_MAN_PLAYER_ONLY_BANK_1_PATTERNS` | `data` | 17l/1081b |

### Largest Unannotated Global Labels

- Unannotated labels: 159

| Category | Labels | Source |
| --- | ---: | ---: |
| `boot_or_init` | 3 | 151l/3740b |
| `data` | 54 | 391l/21981b |
| `runtime_code` | 97 | 15111l/270608b |
| `unknown` | 5 | 8l/296b |

| Label | Category | Source |
| --- | --- | --- |
| `msx2_player_bullet_1_check_enemy_collision` | `runtime_code` | 1674l/27352b |
| `msx2_player_bullet_check_enemy_collision` | `runtime_code` | 1674l/27278b |
| `update_msx2_enemy_state` | `runtime_code` | 956l/14924b |
| `update_msx2_enemy_bullet` | `runtime_code` | 844l/14003b |
| `update_msx2_enemy_position_slot_11` | `runtime_code` | 629l/11359b |
| `update_msx2_enemy_position_slot_10` | `runtime_code` | 627l/11357b |
| `update_msx2_enemy_position_slot_9` | `runtime_code` | 627l/11192b |
| `update_msx2_enemy_position_slot_8` | `runtime_code` | 627l/11191b |
| `update_msx2_enemy_position_slot_7` | `runtime_code` | 627l/11191b |
| `update_msx2_enemy_position_slot_6` | `runtime_code` | 627l/11191b |
| `update_msx2_enemy_position_slot_5` | `runtime_code` | 627l/11191b |
| `update_msx2_enemy_position_slot_4` | `runtime_code` | 627l/11191b |
| `update_msx2_enemy_position_slot_3` | `runtime_code` | 627l/11191b |
| `update_msx2_enemy_position_slot_2` | `runtime_code` | 627l/11191b |
| `update_msx2_enemy_position_slot_1` | `runtime_code` | 627l/11191b |
| `write_hardware_sprite_attrs` | `runtime_code` | 504l/10799b |
| `update_msx2_enemy_position_slot_0` | `runtime_code` | 516l/9644b |
| `msx2_check_enemy_wave_complete` | `runtime_code` | 438l/7099b |
| `MSX2_SCREEN_4_PAC_MAN_PLAYER_ONLY_NAMES` | `data` | 51l/3519b |
| `msx2_reset_enemy_runtime_for_current_screen` | `runtime_code` | 166l/2576b |
| `init_hardware_sprites` | `boot_or_init` | 91l/2521b |
| `update_msx2_effect_state` | `runtime_code` | 71l/1492b |
| `update_msx2_player_bullet_slot_1` | `runtime_code` | 68l/1475b |
| `load_MSX2_SCREEN_4_PAC_MAN_PLAYER_ONLY_screen4` | `runtime_code` | 50l/1400b |
| `msx2_restart_game` | `runtime_code` | 41l/1331b |
| `msx2_continue_after_level_complete` | `runtime_code` | 39l/1313b |
| `update_hardware_sprite_vertical` | `runtime_code` | 52l/1267b |
| `msx2_respawn_current_screen` | `runtime_code` | 41l/1100b |
| `MSX2_SCREEN_4_PAC_MAN_PLAYER_ONLY_BANK_2_PATTERNS` | `data` | 17l/1081b |
| `MSX2_SCREEN_4_PAC_MAN_PLAYER_ONLY_BANK_1_PATTERNS` | `data` | 17l/1081b |

## ROM Validation

- Original ROM bytes: 32768
- Optimized ROM bytes: 32768
- ROM byte delta: 0
- ROM SHA256 equal: True

No rule findings.

## Optimization Passes

- Pass 1: findings=0, patchable=0, removed=0 lines / 0 bytes, lines=15764->15764
