# Post-ASM Report

- Input: `C:\Users\salam\Documents\Programacion\Mideas\builds\msx2_screen4_manic_miner_one_screen_compressed.asm`
- Selected rules: dead-blocks, unused-screen-loaders, inactive-feature-runtime, unused-boss-attack-runtime, unused-component-runtime, state-machine-dispatch-handlers
- Findings: 0
- Applied patches: 0
- Original lines: 15657
- Output lines: 15657
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

- Global labels: 142

| Label | Category | Source |
| --- | --- | --- |
| `msx2_player_bullet_1_check_enemy_collision` | `runtime_code` | 1674l/27352b |
| `msx2_player_bullet_check_enemy_collision` | `runtime_code` | 1674l/27278b |
| `update_msx2_enemy_state` | `runtime_code` | 956l/14924b |
| `update_msx2_enemy_bullet` | `runtime_code` | 844l/14003b |
| `update_msx2_enemy_position_slot_11` | `runtime_code` | 637l/11451b |
| `update_msx2_enemy_position_slot_10` | `runtime_code` | 635l/11449b |
| `update_msx2_enemy_position_slot_9` | `runtime_code` | 635l/11284b |
| `update_msx2_enemy_position_slot_8` | `runtime_code` | 635l/11283b |
| `update_msx2_enemy_position_slot_7` | `runtime_code` | 635l/11283b |
| `update_msx2_enemy_position_slot_6` | `runtime_code` | 635l/11283b |
| `update_msx2_enemy_position_slot_5` | `runtime_code` | 635l/11283b |
| `update_msx2_enemy_position_slot_4` | `runtime_code` | 635l/11283b |
| `update_msx2_enemy_position_slot_3` | `runtime_code` | 635l/11283b |
| `update_msx2_enemy_position_slot_2` | `runtime_code` | 635l/11283b |
| `update_msx2_enemy_position_slot_1` | `runtime_code` | 635l/11283b |
| `write_hardware_sprite_attrs` | `runtime_code` | 504l/10799b |
| `update_msx2_enemy_position_slot_0` | `runtime_code` | 524l/9736b |
| `msx2_check_enemy_wave_complete` | `runtime_code` | 438l/7099b |
| `MANIC_MINER_STYLE_ROOM_NAMES` | `data` | 51l/3497b |
| `msx2_reset_enemy_runtime_for_current_screen` | `runtime_code` | 166l/2576b |
| `init_hardware_sprites` | `boot_or_init` | 91l/2520b |
| `MANIC_MINER_STYLE_ROOM_BANK_2_PATTERNS` | `data` | 24l/1588b |
| `MANIC_MINER_STYLE_ROOM_BANK_2_COLORS` | `data` | 25l/1560b |
| `MANIC_MINER_STYLE_ROOM_BANK_1_PATTERNS` | `data` | 24l/1556b |
| `MANIC_MINER_STYLE_ROOM_BANK_1_COLORS` | `data` | 24l/1556b |
| `update_msx2_effect_state` | `runtime_code` | 71l/1492b |
| `update_msx2_player_bullet_slot_1` | `runtime_code` | 68l/1475b |
| `msx2_restart_game` | `runtime_code` | 41l/1320b |
| `msx2_continue_after_level_complete` | `runtime_code` | 39l/1302b |
| `load_MANIC_MINER_STYLE_ROOM_screen4` | `runtime_code` | 50l/1279b |

### Largest Unannotated Global Labels

- Unannotated labels: 142

| Category | Labels | Source |
| --- | ---: | ---: |
| `boot_or_init` | 3 | 151l/3706b |
| `data` | 54 | 423l/24097b |
| `runtime_code` | 80 | 14972l/266258b |
| `unknown` | 5 | 8l/296b |

| Label | Category | Source |
| --- | --- | --- |
| `msx2_player_bullet_1_check_enemy_collision` | `runtime_code` | 1674l/27352b |
| `msx2_player_bullet_check_enemy_collision` | `runtime_code` | 1674l/27278b |
| `update_msx2_enemy_state` | `runtime_code` | 956l/14924b |
| `update_msx2_enemy_bullet` | `runtime_code` | 844l/14003b |
| `update_msx2_enemy_position_slot_11` | `runtime_code` | 637l/11451b |
| `update_msx2_enemy_position_slot_10` | `runtime_code` | 635l/11449b |
| `update_msx2_enemy_position_slot_9` | `runtime_code` | 635l/11284b |
| `update_msx2_enemy_position_slot_8` | `runtime_code` | 635l/11283b |
| `update_msx2_enemy_position_slot_7` | `runtime_code` | 635l/11283b |
| `update_msx2_enemy_position_slot_6` | `runtime_code` | 635l/11283b |
| `update_msx2_enemy_position_slot_5` | `runtime_code` | 635l/11283b |
| `update_msx2_enemy_position_slot_4` | `runtime_code` | 635l/11283b |
| `update_msx2_enemy_position_slot_3` | `runtime_code` | 635l/11283b |
| `update_msx2_enemy_position_slot_2` | `runtime_code` | 635l/11283b |
| `update_msx2_enemy_position_slot_1` | `runtime_code` | 635l/11283b |
| `write_hardware_sprite_attrs` | `runtime_code` | 504l/10799b |
| `update_msx2_enemy_position_slot_0` | `runtime_code` | 524l/9736b |
| `msx2_check_enemy_wave_complete` | `runtime_code` | 438l/7099b |
| `MANIC_MINER_STYLE_ROOM_NAMES` | `data` | 51l/3497b |
| `msx2_reset_enemy_runtime_for_current_screen` | `runtime_code` | 166l/2576b |
| `init_hardware_sprites` | `boot_or_init` | 91l/2520b |
| `MANIC_MINER_STYLE_ROOM_BANK_2_PATTERNS` | `data` | 24l/1588b |
| `MANIC_MINER_STYLE_ROOM_BANK_2_COLORS` | `data` | 25l/1560b |
| `MANIC_MINER_STYLE_ROOM_BANK_1_PATTERNS` | `data` | 24l/1556b |
| `MANIC_MINER_STYLE_ROOM_BANK_1_COLORS` | `data` | 24l/1556b |
| `update_msx2_effect_state` | `runtime_code` | 71l/1492b |
| `update_msx2_player_bullet_slot_1` | `runtime_code` | 68l/1475b |
| `msx2_restart_game` | `runtime_code` | 41l/1320b |
| `msx2_continue_after_level_complete` | `runtime_code` | 39l/1302b |
| `load_MANIC_MINER_STYLE_ROOM_screen4` | `runtime_code` | 50l/1279b |

## ROM Validation

- Original ROM bytes: 32768
- Optimized ROM bytes: 32768
- ROM byte delta: 0
- ROM SHA256 equal: True

No rule findings.

## Optimization Passes

- Pass 1: findings=0, patchable=0, removed=0 lines / 0 bytes, lines=15657->15657
