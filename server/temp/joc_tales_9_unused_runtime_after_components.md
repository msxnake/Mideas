# Post-ASM Report

- Input: `C:\Users\salam\Documents\Programacion\Mideas\server\temp\joc_tales_9_unified_compressed.asm`
- Findings: 28
- Applied patches: 0
- Original lines: 21319
- Output lines: 21319
- Net line delta: 0

## Mideas Block Inventory

- Blocks: 47
- Preserved blocks: 1
- Removable-by-policy blocks: 46
- Dead-block candidates: 3
- Annotated block source: 11194 lines / 303967 bytes
- Dead-candidate source: 83 lines / 2396 bytes
- Marker errors: 0

- By kind: data=1, routine=46
- By owner: animtiles=1, bosses=2, components=22, entities=2, gameflow=3, interrupt=5, mapper=1, resources=1, screens=4, scroll=1, sound=1, stateMachine=2, unified=1, worlds=1
- By status: candidate_unreferenced=3, preserved=1, referenced=7, rooted=36

### Largest Annotated Blocks

| ID | Status | Source | Kind | Owner |
| --- | --- | --- | --- | --- |
| `runtime.components.scheduler` | `rooted` | 1580l/35945b | `routine` | `components` |
| `runtime.components.wallcollision` | `referenced` | 839l/31288b | `routine` | `components` |
| `runtime.statemachine.core` | `rooted` | 1096l/25160b | `routine` | `stateMachine` |
| `runtime.boss.core` | `rooted` | 876l/19553b | `routine` | `bosses` |
| `runtime.components.collision` | `referenced` | 668l/18861b | `routine` | `components` |
| `runtime.resources.manager` | `rooted` | 680l/17743b | `routine` | `resources` |
| `runtime.components.input` | `referenced` | 388l/12766b | `routine` | `components` |
| `runtime.components.animation` | `referenced` | 342l/10555b | `routine` | `components` |
| `runtime.components.sprite` | `rooted` | 396l/10316b | `routine` | `components` |
| `runtime.animtiles.core` | `rooted` | 318l/9265b | `routine` | `animtiles` |
| `runtime.scroll.core` | `rooted` | 340l/8599b | `routine` | `scroll` |
| `runtime.components.jump` | `referenced` | 233l/7043b | `routine` | `components` |
| `runtime.components.entity_management` | `rooted` | 221l/6557b | `routine` | `components` |
| `runtime.interrupt.task_input` | `rooted` | 228l/5981b | `routine` | `interrupt` |
| `runtime.components.deadly_tiles` | `rooted` | 262l/5874b | `routine` | `components` |
| `runtime.mapper.core` | `rooted` | 213l/5411b | `routine` | `mapper` |
| `data.entities.player_1.init` | `rooted` | 177l/4974b | `routine` | `entities` |
| `runtime.components.health` | `rooted` | 152l/4701b | `routine` | `components` |
| `runtime.screens.load_screen_new_playable_screen_777833014252.loader` | `rooted` | 114l/4685b | `routine` | `screens` |
| `runtime.components.gravity` | `rooted` | 137l/4553b | `routine` | `components` |

## Global Label Inventory

- Global labels: 679

| Label | Category | Source |
| --- | --- | --- |
| `FAST_SNSMAT` | `bios_helper` | 1120l/71321b |
| `update_wallcollision_component` | `runtime_code` | 538l/20410b |
| `update_player_fastpath` | `runtime_code` | 604l/13839b |
| `update_entity_collision_fast` | `runtime_code` | 345l/9814b |
| `update_animation_component` | `runtime_code` | 255l/8328b |
| `BANK_0_USED_END` | `bank_marker` | 141l/7659b |
| `vdpLoop` | `bios_helper` | 192l/6712b |
| `task_update_input` | `shared_runtime` | 199l/4970b |
| `init_player_1` | `boot_or_init` | 177l/4880b |
| `jump_update_loop` | `runtime_code` | 157l/4675b |
| `rebuild_used_entity_list` | `runtime_code` | 207l/4475b |
| `update_boss_system` | `runtime_code` | 134l/4229b |
| `interrupt_dispatcher` | `shared_runtime` | 122l/4176b |
| `tilebank_pattern_data_0` | `data` | 59l/4015b |
| `FAR_BANK_6_ROM_START` | `bank_marker` | 79l/3937b |
| `Condition_VariableCompare` | `runtime_code` | 186l/3892b |
| `wall_build_hitbox_cache` | `runtime_code` | 121l/3875b |
| `tile_pattern_bank0` | `data` | 56l/3821b |
| `load_screen_new_playable_screen_777833014252` | `screen_loader` | 82l/3592b |
| `wall_down_behavior_blocks` | `runtime_code` | 75l/3286b |
| `input_update_loop` | `runtime_code` | 108l/3269b |
| `FAR_BANK_8_ROM_START` | `bank_marker` | 78l/3096b |
| `init_components` | `boot_or_init` | 83l/3021b |
| `input_apply_velocity` | `runtime_code` | 68l/2776b |
| `update_all_entities` | `runtime_code` | 61l/2494b |
| `init_char0_color` | `boot_or_init` | 95l/2487b |
| `restart_rom_continue` | `boot_or_init` | 83l/2480b |
| `FAST_LDIRVM` | `bios_helper` | 73l/2463b |
| `gameflow_world_game_loop` | `runtime_code` | 71l/2447b |
| `set_camera_position` | `runtime_code` | 119l/2425b |

### Largest Unannotated Global Labels

- Unannotated labels: 373

| Category | Labels | Source |
| --- | ---: | ---: |
| `bank_marker` | 25 | 715l/31224b |
| `bios_helper` | 9 | 1721l/89610b |
| `boot_or_init` | 33 | 782l/20203b |
| `data` | 110 | 1107l/42779b |
| `far_trampoline` | 78 | 828l/16532b |
| `runtime_code` | 110 | 1416l/40153b |
| `screen_loader` | 1 | 18l/458b |
| `shared_runtime` | 3 | 59l/1908b |
| `unknown` | 4 | 4l/70b |

| Label | Category | Source |
| --- | --- | --- |
| `FAST_SNSMAT` | `bios_helper` | 1120l/71321b |
| `BANK_0_USED_END` | `bank_marker` | 141l/7659b |
| `vdpLoop` | `bios_helper` | 192l/6712b |
| `tilebank_pattern_data_0` | `data` | 59l/4015b |
| `FAR_BANK_6_ROM_START` | `bank_marker` | 79l/3937b |
| `tile_pattern_bank0` | `data` | 56l/3821b |
| `FAR_BANK_8_ROM_START` | `bank_marker` | 78l/3096b |
| `init_char0_color` | `boot_or_init` | 95l/2487b |
| `restart_rom_continue` | `boot_or_init` | 83l/2480b |
| `FAST_LDIRVM` | `bios_helper` | 73l/2463b |
| `init_interrupt_system` | `boot_or_init` | 63l/2073b |
| `init_entities` | `boot_or_init` | 91l/2038b |
| `BANK_2_USED_END` | `bank_marker` | 40l/1922b |
| `resource_table` | `data` | 97l/1879b |
| `init_sprites` | `boot_or_init` | 68l/1814b |
| `FAST_WRTVDP` | `bios_helper` | 59l/1764b |
| `FAST_WRTVRM` | `bios_helper` | 60l/1682b |
| `FAST_FILLVRM` | `bios_helper` | 76l/1677b |
| `FAST_RDVRM` | `bios_helper` | 53l/1498b |
| `FAR_BANK_10_ROM_START` | `bank_marker` | 34l/1434b |
| `tilebank_color_data_0` | `data` | 22l/1426b |
| `joystick_direction_table` | `data` | 54l/1407b |
| `tile_color_bank0` | `data` | 21l/1354b |
| `init_player_from_hero_entity` | `boot_or_init` | 62l/1324b |
| `FAST_GTTRIG` | `bios_helper` | 54l/1254b |
| `FAST_GTSTCK` | `bios_helper` | 34l/1239b |
| `boss_0_new_boss_phase_0_forms_1_weak` | `data` | 19l/1225b |
| `FAR_BANK_5_ROM_START` | `bank_marker` | 37l/1199b |
| `boss_0_new_boss_phase_0_forms_1` | `data` | 15l/1167b |
| `boss_0_new_boss_phase_0_tiles` | `data` | 15l/1165b |

| ID | Kind | Owner | Status | Incoming | Source | Lines | Labels |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `runtime.mapper.core` | `routine` | `mapper` | `rooted` | 129 | 213l/5411b | 5279-5491 | mapper_runtime_init, mapper_set_bank_p1, mapper_set_bank_p2, mapper_set_bank_p3, mapper_set_bank_p4, ... (+14) |
| `runtime.resources.manager` | `routine` | `resources` | `rooted` | 23 | 680l/17743b | 5676-6355 | resource_manager_init, resource_invalidate_pattern_vram_cache, resource_invalidate_color_vram_cache, resource_invalidate_font_vram_cache, resource_invalidate_gameplay_vram_cache, ... (+14) |
| `runtime.components.input_trigger_level` | `routine` | `components` | `candidate_unreferenced` | 0 | 33l/773b | 6437-6469 | component_trigger_level_pressed_a |
| `runtime.page0.stubs` | `routine` | `unified` | `rooted` | 1 | 22l/505b | 6476-6497 | init_page0_runtime_state, page0_map_expanded_slot, page0_map_game_rom, page0_restore_bios_rom, page0_copy_chunk_to_buffer, ... (+2) |
| `runtime.interrupt.stop` | `routine` | `interrupt` | `rooted` | 0 | 43l/1299b | 6576-6618 | stop_interrupt_system |
| `runtime.interrupt.dispatcher` | `routine` | `interrupt` | `preserved` | 1 | 124l/4150b | 6620-6743 | interrupt_dispatcher |
| `runtime.interrupt.vblank_flag` | `routine` | `interrupt` | `rooted` | 1 | 35l/983b | 6756-6790 | update_vblank_flag |
| `runtime.interrupt.task_api` | `routine` | `interrupt` | `rooted` | 1 | 121l/3195b | 6795-6915 | enable_task, disable_task, get_frame_count |
| `runtime.interrupt.task_input` | `routine` | `interrupt` | `rooted` | 2 | 228l/5981b | 6919-7146 | init_default_tasks_from_plan, task_update_input |
| `runtime.components.init` | `routine` | `components` | `rooted` | 11 | 86l/2962b | 8482-8567 | component_fill_32_a, init_components |
| `runtime.components.position` | `routine` | `components` | `rooted` | 3 | 108l/3281b | 8569-8676 | init_position_system, update_position_component, position_update_loop, position_next_entity |
| `runtime.components.sprite` | `routine` | `components` | `rooted` | 6 | 396l/10316b | 8677-9072 | init_sprite_system, update_sprite_component, sprite_update_loop, sprite_layer_loop, sprite_continue, ... (+6) |
| `runtime.components.collision` | `routine` | `components` | `referenced` | 2 | 668l/18861b | 9080-9747 | init_collision_system, update_collision_component, collision_update_loop, collision_next_entity, update_entity_collision_fast, ... (+13) |
| `runtime.components.behavior_tile` | `routine` | `components` | `rooted` | 9 | 110l/3809b | 9748-9857 | get_behavior_tile, get_behavior_tile_nb, gbt_oob |
| `runtime.components.directional_sprite_sync` | `routine` | `components` | `rooted` | 3 | 87l/2084b | 9858-9944 | component_sync_directional_sprite_from_initial, component_sync_directional_sprite_from_current, component_sync_directional_sprite_common |
| `runtime.components.input` | `routine` | `components` | `referenced` | 2 | 388l/12766b | 9945-10332 | init_input_system, update_input_component, input_update_loop, input_move_up, input_move_down, ... (+16) |
| `runtime.components.health` | `routine` | `components` | `rooted` | 2 | 152l/4701b | 10370-10521 | init_health_system, update_health_component, decrease_entity_lives, increase_entity_lives |
| `runtime.components.animation` | `routine` | `components` | `referenced` | 4 | 342l/10555b | 10522-10863 | init_animation_system, update_animation_component, anim_done_entity, refresh_player_animation_fastpath |
| `runtime.components.jump` | `routine` | `components` | `referenced` | 2 | 233l/7043b | 10864-11096 | init_jump_system, update_jump_component, jump_update_loop, jump_done_entity, jump_next_entity |
| `runtime.components.gravity` | `routine` | `components` | `rooted` | 2 | 137l/4553b | 11097-11233 | init_gravity_system, update_gravity_component, gravity_update_loop, gravity_store_vel, gravity_grounded, ... (+2) |
| `runtime.components.walljump_stub` | `routine` | `components` | `referenced` | 2 | 18l/326b | 11254-11271 | init_walljump_system, update_walljump_component, walljump_process_entity_c, walljump_input_is_left, walljump_input_is_right |
| `runtime.components.auto_destroy_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/219b | 11274-11280 | init_auto_destroy_system, update_auto_destroy_component |
| `runtime.components.state_machine_component_stub` | `routine` | `components` | `referenced` | 1 | 7l/241b | 11304-11310 | init_statemachine_system, update_statemachine_component |
| `runtime.components.carry` | `routine` | `components` | `rooted` | 1 | 81l/2148b | 11318-11398 | init_carry_system, update_carry_component |
| `runtime.components.wallcollision` | `routine` | `components` | `referenced` | 3 | 839l/31288b | 11447-12285 | init_wallcollision_system, wall_behavior_is_full_blocker, wall_down_behavior_blocks, update_wallcollision_component, wall_build_hitbox_cache, ... (+2) |
| `runtime.components.deadly_tiles` | `routine` | `components` | `rooted` | 3 | 262l/5874b | 12286-12547 | init_deadly_tiles_system, deadly_tiles_runtime_tile_is_deadly_nb, update_entity_deadly_flag_runtime, update_deadly_tiles_component, refresh_player_deadly_fastpath |
| `runtime.components.entity_management` | `routine` | `components` | `rooted` | 3 | 221l/6557b | 12579-12799 | create_entity, entity_job_set, entity_job_set_period_ok, entity_job_set_entry_wrap, entity_job_set_entry_ok, ... (+13) |
| `runtime.components.scheduler` | `routine` | `components` | `rooted` | 7 | 1580l/35945b | 12800-14379 | update_all_entities, mark_used_entity_list_dirty, ensure_used_entity_list_current, rebuild_used_entity_list, ensure_player_fast_runtime_bound, ... (+10) |
| `runtime.components.state_machine_executor` | `routine` | `components` | `rooted` | 2 | 74l/1973b | 14385-14458 | execute_all_state_machines, refresh_player_state_machine_fastpath |
| `runtime.components.legacy_tile_collision` | `routine` | `components` | `candidate_unreferenced` | 0 | 43l/1404b | 14468-14510 | get_tile_at_position, get_tile_behavior, tile_behavior_table, check_collision_at_point, check_collision_box, ... (+1) |
| `runtime.statemachine.core` | `routine` | `stateMachine` | `rooted` | 4 | 1096l/25160b | 14566-15661 | SM_Update, sm_timer_no_overflow, sm_update_done, SM_CheckTransitions, SM_CheckTransitions_Loop, ... (+22) |
| `data.statemachine.statemachine_1777833246195` | `data` | `stateMachine` | `rooted` | 1 | 25l/863b | 15727-15751 | SM_New_Statemachine_state_1777833253256, SM_New_Statemachine_state_1777833253256_Transitions, SM_New_Statemachine_state_1777833253256_Transitions_Actions_0, SM_New_Statemachine_state_1777833256480 |
| `runtime.gameflow.worldlink` | `routine` | `gameflow` | `rooted` | 1 | 74l/2164b | 15873-15946 | gameflow_handle_worldlink |
| `runtime.gameflow.end_screen` | `routine` | `gameflow` | `rooted` | 1 | 146l/4078b | 15948-16093 | gameflow_handle_end, display_end_screen, print_string_vram, str_victory, str_game_over, ... (+1) |
| `runtime.gameflow.world_loop` | `routine` | `gameflow` | `rooted` | 1 | 65l/2282b | 16206-16270 | gameflow_world_game_loop |
| `runtime.boss.entry` | `routine` | `bosses` | `rooted` | 2 | 73l/1760b | 16730-16802 | init_boss_system, update_boss_system |
| `runtime.boss.core` | `routine` | `bosses` | `rooted` | 9 | 876l/19553b | 16804-17679 | init_screen_boss_from_current_screen, boss_resolve_initial_phase, boss_init_behavior_state, draw_active_boss_tiles, restore_active_boss_tiles, ... (+21) |
| `runtime.screens.colors` | `routine` | `screens` | `rooted` | 1 | 44l/1514b | 17885-17928 | color_shift_table, set_screen_colors |
| `runtime.screens.copy_rect` | `routine` | `screens` | `rooted` | 0 | 77l/1494b | 18022-18098 | copy_layout_rect_to_vram, copy_layout_rect_ram_to_ram |
| `runtime.screens.block_layout_expander` | `routine` | `screens` | `rooted` | 0 | 194l/3798b | 18100-18293 | expand_screen_block_layout_to_background, expand_screen_block_layout_2x2, expand_screen_block_layout_4x4 |
| `runtime.screens.load_screen_new_playable_screen_777833014252.loader` | `routine` | `screens` | `rooted` | 1 | 114l/4685b | 18342-18455 | load_screen_new_playable_screen_777833014252, load_new_playable_screen_777833014252_boss_done |
| `data.entities.player_1.init` | `routine` | `entities` | `rooted` | 1 | 177l/4974b | 18613-18789 | init_player_1 |
| `runtime.entities.patrol_facing` | `routine` | `entities` | `rooted` | 0 | 88l/2125b | 18966-19053 | update_entity_patrol_facing |
| `runtime.sound.psg_lowlevel` | `routine` | `sound` | `rooted` | 27 | 117l/3450b | 19277-19393 | psg_write, psg_set_tone, psg_set_volume, psg_set_noise, psg_set_mixer, ... (+1) |
| `runtime.animtiles.core` | `routine` | `animtiles` | `rooted` | 3 | 318l/9265b | 20166-20483 | init_animated_tiles, update_animated_tiles, update_animated_tiles_vram, set_animation_speed, anim_copy_8_bytes, ... (+9) |
| `runtime.scroll.core` | `routine` | `scroll` | `rooted` | 0 | 340l/8599b | 20503-20842 | init_scroll_system, set_camera_position, move_camera, center_camera_on_entity, update_scroll, ... (+2) |
| `runtime.worlds.worldmap_1777833018852.loader` | `routine` | `worlds` | `rooted` | 2 | 32l/1257b | 20942-20973 | load_world_worldmap_1777833018852 |

## Dead-Block Candidates

- `runtime.components.legacy_tile_collision`: 43 lines / 1404 bytes. No external references found for any global label in this block.
- `runtime.components.input_trigger_level`: 33 lines / 773 bytes. No external references found for any global label in this block.
- `runtime.components.auto_destroy_stub`: 7 lines / 219 bytes. No external references found for any global label in this block.

## unused-runtime-labels

- Metrics: findings=28, patchable=0, removed_lines=0
- Routines: SM_GlobalVarWordTable, SM_SpritePatternPtrTable, SM_TemplateHealthMaxTable, gameflow_get_connection_by_type, gameflow_read_confirm_direct, get_current_screen_index, get_current_world_id, load_screen, music_reset_channel_state, play_sound_effect, play_sound_effect_beep, prepare_platform_detection, reload_font_system, set_current_screen, sfx_damage, show_sprite, update_auto_control_script_component, update_auto_event_string_component, update_collectible_component, update_damage_component, update_hud_lives, update_hud_score, update_in_water_component, update_movement_component, update_platform_riding, update_retractable_gate_component, update_secret_zone_component, update_shoot_component

- [report-only] `reload_font_system` lines 8338-8341: `reload_font_system` is unannotated runtime code (4 lines, 75 source bytes) and no external label references were found. Category reason: Instruction-bearing runtime label.
- [report-only] `update_movement_component` lines 9078-9085: `update_movement_component` is unannotated runtime code (8 lines, 360 source bytes) and no external label references were found. Category reason: Instruction-bearing runtime label.
- [report-only] `update_retractable_gate_component` lines 11316-11326: `update_retractable_gate_component` is unannotated runtime code (11 lines, 534 source bytes) and no external label references were found. Category reason: Instruction-bearing runtime label.
- [report-only] `update_auto_control_script_component` lines 11404-11406: `update_auto_control_script_component` is unannotated runtime code (3 lines, 47 source bytes) and no external label references were found. Category reason: Instruction-bearing runtime label.
- [report-only] `update_auto_event_string_component` lines 11407-11410: `update_auto_event_string_component` is unannotated runtime code (4 lines, 88 source bytes) and no external label references were found. Category reason: Instruction-bearing runtime label.
- [report-only] `update_damage_component` lines 11414-11417: `update_damage_component` is unannotated runtime code (4 lines, 80 source bytes) and no external label references were found. Category reason: Instruction-bearing runtime label.
- [report-only] `update_shoot_component` lines 11421-11427: `update_shoot_component` is unannotated runtime code (7 lines, 220 source bytes) and no external label references were found. Category reason: Instruction-bearing runtime label.
- [report-only] `prepare_platform_detection` lines 11442-11444: `prepare_platform_detection` is unannotated runtime code (3 lines, 37 source bytes) and no external label references were found. Category reason: Instruction-bearing runtime label.
- [report-only] `update_platform_riding` lines 11445-11455: `update_platform_riding` is unannotated runtime code (11 lines, 482 source bytes) and no external label references were found. Category reason: Instruction-bearing runtime label.
- [report-only] `update_in_water_component` lines 12553-12556: `update_in_water_component` is unannotated runtime code (4 lines, 88 source bytes) and no external label references were found. Category reason: Instruction-bearing runtime label.
- [report-only] `update_collectible_component` lines 12560-12563: `update_collectible_component` is unannotated runtime code (4 lines, 121 source bytes) and no external label references were found. Category reason: Instruction-bearing runtime label.
- [report-only] `update_secret_zone_component` lines 14547-14556: `update_secret_zone_component` is unannotated runtime code (10 lines, 269 source bytes) and no external label references were found. Category reason: Instruction-bearing runtime label.
- [report-only] `SM_GlobalVarWordTable` lines 15679-15697: `SM_GlobalVarWordTable` is unannotated runtime code (19 lines, 725 source bytes) and no external label references were found. Category reason: Instruction-bearing runtime label.
- [report-only] `SM_TemplateHealthMaxTable` lines 15704-15712: `SM_TemplateHealthMaxTable` is unannotated runtime code (9 lines, 427 source bytes) and no external label references were found. Category reason: Instruction-bearing runtime label.
- [report-only] `SM_SpritePatternPtrTable` lines 15713-15723: `SM_SpritePatternPtrTable` is unannotated runtime code (11 lines, 477 source bytes) and no external label references were found. Category reason: Instruction-bearing runtime label.
- [report-only] `gameflow_get_connection_by_type` lines 16130-16178: `gameflow_get_connection_by_type` is unannotated runtime code (49 lines, 943 source bytes) and no external label references were found. Category reason: Instruction-bearing runtime label.
- [report-only] `gameflow_read_confirm_direct` lines 16189-16206: `gameflow_read_confirm_direct` is unannotated runtime code (18 lines, 528 source bytes) and no external label references were found. Category reason: Instruction-bearing runtime label.
- [report-only] `load_screen` lines 18336-18342: `load_screen` is unannotated runtime code (7 lines, 265 source bytes) and no external label references were found. Category reason: Instruction-bearing runtime label.
- [report-only] `sfx_damage` lines 19537-19568: `sfx_damage` is unannotated runtime code (32 lines, 1013 source bytes) and no external label references were found. Category reason: Instruction-bearing runtime label.
- [report-only] `play_sound_effect` lines 19569-19585: `play_sound_effect` is unannotated runtime code (17 lines, 307 source bytes) and no external label references were found. Category reason: Instruction-bearing runtime label.
- [report-only] `play_sound_effect_beep` lines 19586-19591: `play_sound_effect_beep` is unannotated runtime code (6 lines, 91 source bytes) and no external label references were found. Category reason: Instruction-bearing runtime label.
- [report-only] `music_reset_channel_state` lines 19714-19716: `music_reset_channel_state` is unannotated runtime code (3 lines, 36 source bytes) and no external label references were found. Category reason: Instruction-bearing runtime label.
- [report-only] `show_sprite` lines 20048-20091: `show_sprite` is unannotated runtime code (44 lines, 954 source bytes) and no external label references were found. Category reason: Instruction-bearing runtime label.
- [report-only] `get_current_world_id` lines 21048-21053: `get_current_world_id` is unannotated runtime code (6 lines, 131 source bytes) and no external label references were found. Category reason: Instruction-bearing runtime label.
- [report-only] `get_current_screen_index` lines 21054-21059: `get_current_screen_index` is unannotated runtime code (6 lines, 115 source bytes) and no external label references were found. Category reason: Instruction-bearing runtime label.
- [report-only] `set_current_screen` lines 21060-21073: `set_current_screen` is unannotated runtime code (14 lines, 398 source bytes) and no external label references were found. Category reason: Instruction-bearing runtime label.
- [report-only] `update_hud_score` lines 21309-21310: `update_hud_score` is unannotated runtime code (2 lines, 26 source bytes) and no external label references were found. Category reason: Instruction-bearing runtime label.
- [report-only] `update_hud_lives` lines 21311-21315: `update_hud_lives` is unannotated runtime code (5 lines, 79 source bytes) and no external label references were found. Category reason: Instruction-bearing runtime label.

