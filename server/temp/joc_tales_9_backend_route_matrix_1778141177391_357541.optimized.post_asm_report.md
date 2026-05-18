# Post-ASM Report

- Input: `C:\Users\salam\Documents\Programacion\Mideas\server\temp\joc_tales_9_backend_route_matrix_1778141177391_357541.post_asm_input.asm`
- Findings: 20
- Applied patches: 20
- Original lines: 21361
- Output lines: 21101
- Net line delta: -260

- Optimization passes run: 2
- Optimization source removed: 260 lines / 7431 bytes

## Mideas Block Inventory

- Blocks: 69
- Preserved blocks: 1
- Removable-by-policy blocks: 68
- Dead-block candidates: 20
- Annotated block source: 11724 lines / 317433 bytes
- Dead-candidate source: 260 lines / 7431 bytes
- Marker errors: 0

- By kind: data=1, routine=68
- By owner: animtiles=1, bosses=2, components=31, entities=2, gameflow=6, hud=1, interrupt=5, mapper=1, resources=1, screens=6, scroll=1, sound=5, sprites=1, stateMachine=2, unified=2, worlds=2
- By status: candidate_unreferenced=20, preserved=1, referenced=12, rooted=36

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
| `runtime.components.entity_management` | `rooted` | 221l/6553b | `routine` | `components` |
| `runtime.interrupt.task_input` | `rooted` | 228l/5981b | `routine` | `interrupt` |
| `runtime.components.deadly_tiles` | `rooted` | 262l/5874b | `routine` | `components` |
| `runtime.mapper.core` | `rooted` | 213l/5412b | `routine` | `mapper` |
| `data.entities.player_1.init` | `rooted` | 177l/4974b | `routine` | `entities` |
| `runtime.components.health` | `rooted` | 152l/4701b | `routine` | `components` |
| `runtime.screens.load_screen_new_playable_screen_777833014252.loader` | `rooted` | 114l/4685b | `routine` | `screens` |
| `runtime.components.gravity` | `rooted` | 137l/4553b | `routine` | `components` |

## Global Label Inventory

- Global labels: 679

| Label | Category | Source |
| --- | --- | --- |
| `FAST_SNSMAT` | `bios_helper` | 1120l/71322b |
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
| `expand_screen_block_layout_4x4` | `runtime_code` | 126l/2467b |
| `FAST_LDIRVM` | `bios_helper` | 73l/2463b |
| `gameflow_world_game_loop` | `runtime_code` | 71l/2447b |

### Largest Unannotated Global Labels

- Unannotated labels: 331

| Category | Labels | Source |
| --- | ---: | ---: |
| `bank_marker` | 25 | 715l/31224b |
| `bios_helper` | 9 | 1721l/89611b |
| `boot_or_init` | 33 | 792l/21045b |
| `data` | 112 | 1136l/44233b |
| `far_trampoline` | 78 | 828l/16532b |
| `runtime_code` | 66 | 786l/24199b |
| `screen_loader` | 1 | 18l/458b |
| `shared_runtime` | 3 | 59l/1908b |
| `unknown` | 4 | 4l/70b |

| Label | Category | Source |
| --- | --- | --- |
| `FAST_SNSMAT` | `bios_helper` | 1120l/71322b |
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
| `runtime.mapper.core` | `routine` | `mapper` | `rooted` | 129 | 213l/5412b | 5279-5491 | mapper_runtime_init, mapper_set_bank_p1, mapper_set_bank_p2, mapper_set_bank_p3, mapper_set_bank_p4, ... (+14) |
| `runtime.resources.manager` | `routine` | `resources` | `rooted` | 23 | 680l/17743b | 5676-6355 | resource_manager_init, resource_invalidate_pattern_vram_cache, resource_invalidate_color_vram_cache, resource_invalidate_font_vram_cache, resource_invalidate_gameplay_vram_cache, ... (+14) |
| `runtime.components.input_trigger_level` | `routine` | `components` | `candidate_unreferenced` | 0 | 33l/773b | 6437-6469 | component_trigger_level_pressed_a |
| `runtime.page0.stubs` | `routine` | `unified` | `rooted` | 1 | 22l/505b | 6476-6497 | init_page0_runtime_state, page0_map_expanded_slot, page0_map_game_rom, page0_restore_bios_rom, page0_copy_chunk_to_buffer, ... (+2) |
| `runtime.interrupt.stop` | `routine` | `interrupt` | `rooted` | 0 | 43l/1299b | 6576-6618 | stop_interrupt_system |
| `runtime.interrupt.dispatcher` | `routine` | `interrupt` | `preserved` | 1 | 124l/4150b | 6620-6743 | interrupt_dispatcher |
| `runtime.interrupt.vblank_flag` | `routine` | `interrupt` | `rooted` | 1 | 35l/983b | 6756-6790 | update_vblank_flag |
| `runtime.interrupt.task_api` | `routine` | `interrupt` | `rooted` | 1 | 121l/3195b | 6795-6915 | enable_task, disable_task, get_frame_count |
| `runtime.interrupt.task_input` | `routine` | `interrupt` | `rooted` | 2 | 228l/5981b | 6919-7146 | init_default_tasks_from_plan, task_update_input |
| `runtime.font.reload_stub` | `routine` | `unified` | `candidate_unreferenced` | 0 | 4l/146b | 8338-8341 | reload_font_system |
| `runtime.components.init` | `routine` | `components` | `rooted` | 11 | 86l/2962b | 8484-8569 | component_fill_32_a, init_components |
| `runtime.components.position` | `routine` | `components` | `rooted` | 3 | 108l/3281b | 8571-8678 | init_position_system, update_position_component, position_update_loop, position_next_entity |
| `runtime.components.sprite` | `routine` | `components` | `rooted` | 6 | 396l/10316b | 8679-9074 | init_sprite_system, update_sprite_component, sprite_update_loop, sprite_layer_loop, sprite_continue, ... (+6) |
| `runtime.components.movement_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 9080-9083 | update_movement_component |
| `runtime.components.collision` | `routine` | `components` | `referenced` | 2 | 668l/18861b | 9084-9751 | init_collision_system, update_collision_component, collision_update_loop, collision_next_entity, update_entity_collision_fast, ... (+13) |
| `runtime.components.behavior_tile` | `routine` | `components` | `rooted` | 9 | 110l/3809b | 9752-9861 | get_behavior_tile, get_behavior_tile_nb, gbt_oob |
| `runtime.components.directional_sprite_sync` | `routine` | `components` | `rooted` | 3 | 87l/2084b | 9862-9948 | component_sync_directional_sprite_from_initial, component_sync_directional_sprite_from_current, component_sync_directional_sprite_common |
| `runtime.components.input` | `routine` | `components` | `referenced` | 2 | 388l/12766b | 9949-10336 | init_input_system, update_input_component, input_update_loop, input_move_up, input_move_down, ... (+16) |
| `runtime.components.health` | `routine` | `components` | `rooted` | 2 | 152l/4701b | 10374-10525 | init_health_system, update_health_component, decrease_entity_lives, increase_entity_lives |
| `runtime.components.animation` | `routine` | `components` | `referenced` | 4 | 342l/10555b | 10526-10867 | init_animation_system, update_animation_component, anim_done_entity, refresh_player_animation_fastpath |
| `runtime.components.jump` | `routine` | `components` | `referenced` | 2 | 233l/7043b | 10868-11100 | init_jump_system, update_jump_component, jump_update_loop, jump_done_entity, jump_next_entity |
| `runtime.components.gravity` | `routine` | `components` | `rooted` | 2 | 137l/4553b | 11101-11237 | init_gravity_system, update_gravity_component, gravity_update_loop, gravity_store_vel, gravity_grounded, ... (+2) |
| `runtime.components.walljump_stub` | `routine` | `components` | `referenced` | 2 | 18l/326b | 11258-11275 | init_walljump_system, update_walljump_component, walljump_process_entity_c, walljump_input_is_left, walljump_input_is_right |
| `runtime.components.auto_destroy_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/219b | 11278-11284 | init_auto_destroy_system, update_auto_destroy_component |
| `runtime.components.state_machine_component_stub` | `routine` | `components` | `referenced` | 1 | 7l/241b | 11308-11314 | init_statemachine_system, update_statemachine_component |
| `runtime.components.retractable_gate_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/196b | 11320-11323 | update_retractable_gate_component |
| `runtime.components.carry` | `routine` | `components` | `rooted` | 1 | 81l/2148b | 11324-11404 | init_carry_system, update_carry_component |
| `runtime.components.auto_control_script_stubs` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/252b | 11410-11416 | update_auto_control_script_component, update_auto_event_string_component |
| `runtime.components.damage_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/166b | 11422-11425 | update_damage_component |
| `runtime.components.shoot_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/163b | 11431-11434 | update_shoot_component |
| `runtime.components.platform_riding_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/220b | 11454-11460 | prepare_platform_detection, update_platform_riding |
| `runtime.components.wallcollision` | `routine` | `components` | `referenced` | 3 | 839l/31288b | 11461-12299 | init_wallcollision_system, wall_behavior_is_full_blocker, wall_down_behavior_blocks, update_wallcollision_component, wall_build_hitbox_cache, ... (+2) |
| `runtime.components.deadly_tiles` | `routine` | `components` | `rooted` | 3 | 262l/5874b | 12300-12561 | init_deadly_tiles_system, deadly_tiles_runtime_tile_is_deadly_nb, update_entity_deadly_flag_runtime, update_deadly_tiles_component, refresh_player_deadly_fastpath |
| `runtime.components.in_water_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 12567-12570 | update_in_water_component |
| `runtime.components.collectible_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/181b | 12576-12579 | update_collectible_component |
| `runtime.components.entity_management` | `routine` | `components` | `rooted` | 3 | 221l/6553b | 12597-12817 | create_entity, entity_job_set, entity_job_set_period_ok, entity_job_set_entry_wrap, entity_job_set_entry_ok, ... (+13) |
| `runtime.components.scheduler` | `routine` | `components` | `rooted` | 7 | 1580l/35945b | 12818-14397 | update_all_entities, mark_used_entity_list_dirty, ensure_used_entity_list_current, rebuild_used_entity_list, ensure_player_fast_runtime_bound, ... (+10) |
| `runtime.components.state_machine_executor` | `routine` | `components` | `rooted` | 2 | 74l/1973b | 14403-14476 | execute_all_state_machines, refresh_player_state_machine_fastpath |
| `runtime.components.legacy_tile_collision` | `routine` | `components` | `candidate_unreferenced` | 0 | 43l/1404b | 14486-14528 | get_tile_at_position, get_tile_behavior, tile_behavior_table, check_collision_at_point, check_collision_box, ... (+1) |
| `runtime.components.secret_zone_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/181b | 14565-14568 | update_secret_zone_component |
| `runtime.statemachine.core` | `routine` | `stateMachine` | `rooted` | 4 | 1096l/25160b | 14586-15681 | SM_Update, sm_timer_no_overflow, sm_update_done, SM_CheckTransitions, SM_CheckTransitions_Loop, ... (+22) |
| `data.statemachine.statemachine_1777833246195` | `data` | `stateMachine` | `rooted` | 1 | 25l/863b | 15747-15771 | SM_New_Statemachine_state_1777833253256, SM_New_Statemachine_state_1777833253256_Transitions, SM_New_Statemachine_state_1777833253256_Transitions_Actions_0, SM_New_Statemachine_state_1777833256480 |
| `runtime.gameflow.worldlink` | `routine` | `gameflow` | `rooted` | 1 | 74l/2164b | 15893-15966 | gameflow_handle_worldlink |
| `runtime.gameflow.end_screen` | `routine` | `gameflow` | `rooted` | 1 | 146l/4078b | 15968-16113 | gameflow_handle_end, display_end_screen, print_string_vram, str_victory, str_game_over, ... (+1) |
| `runtime.gameflow.connection_by_type` | `routine` | `gameflow` | `candidate_unreferenced` | 0 | 37l/701b | 16150-16186 | gameflow_get_connection_by_type |
| `runtime.gameflow.confirm_input_direct` | `routine` | `gameflow` | `candidate_unreferenced` | 0 | 12l/298b | 16211-16222 | gameflow_read_confirm_direct |
| `runtime.gameflow.world_loop` | `routine` | `gameflow` | `rooted` | 1 | 65l/2282b | 16230-16294 | gameflow_world_game_loop |
| `runtime.gameflow.clear_screen_area_helpers` | `routine` | `gameflow` | `referenced` | 1 | 60l/1737b | 16400-16459 | clear_screen_area, clear_screen_row, empty_row_data |
| `runtime.boss.entry` | `routine` | `bosses` | `rooted` | 2 | 73l/1760b | 16756-16828 | init_boss_system, update_boss_system |
| `runtime.boss.core` | `routine` | `bosses` | `rooted` | 9 | 876l/19553b | 16830-17705 | init_screen_boss_from_current_screen, boss_resolve_initial_phase, boss_init_behavior_state, draw_active_boss_tiles, restore_active_boss_tiles, ... (+21) |
| `runtime.screens.colors` | `routine` | `screens` | `rooted` | 1 | 44l/1514b | 17911-17954 | color_shift_table, set_screen_colors |
| `runtime.screens.copy_rect` | `routine` | `screens` | `rooted` | 0 | 77l/1494b | 18048-18124 | copy_layout_rect_to_vram, copy_layout_rect_ram_to_ram |
| `runtime.screens.block_layout_expander` | `routine` | `screens` | `rooted` | 0 | 194l/3798b | 18126-18319 | expand_screen_block_layout_to_background, expand_screen_block_layout_2x2, expand_screen_block_layout_4x4 |
| `runtime.screens.behavior_map_rebuild` | `routine` | `screens` | `referenced` | 1 | 26l/709b | 18337-18362 | build_runtime_behavior_map_from_screen_layout |
| `runtime.screens.load_screen_stub` | `routine` | `screens` | `candidate_unreferenced` | 0 | 6l/232b | 18363-18368 | load_screen |
| `runtime.screens.load_screen_new_playable_screen_777833014252.loader` | `routine` | `screens` | `rooted` | 1 | 114l/4685b | 18370-18483 | load_screen_new_playable_screen_777833014252, load_new_playable_screen_777833014252_boss_done |
| `data.entities.player_1.init` | `routine` | `entities` | `rooted` | 1 | 177l/4974b | 18641-18817 | init_player_1 |
| `runtime.entities.patrol_facing` | `routine` | `entities` | `rooted` | 0 | 88l/2125b | 18994-19081 | update_entity_patrol_facing |
| `runtime.sound.psg_lowlevel` | `routine` | `sound` | `rooted` | 27 | 117l/3450b | 19305-19421 | psg_write, psg_set_tone, psg_set_volume, psg_set_noise, psg_set_mixer, ... (+1) |
| `runtime.sound.sfx_silence` | `routine` | `sound` | `referenced` | 2 | 21l/579b | 19431-19451 | sfx_silence_all |
| `runtime.sound.sfx_builtin_effects` | `routine` | `sound` | `referenced` | 6 | 127l/3025b | 19457-19583 | sfx_beep, sfx_jump, sfx_shoot, sfx_explosion, sfx_coin, ... (+1) |
| `runtime.sound.sfx_playback` | `routine` | `sound` | `referenced` | 1 | 119l/2384b | 19601-19719 | play_sound_effect, play_sound_effect_beep, play_sound_effect_jump, play_sound_effect_shoot, play_sound_effect_explosion, ... (+4) |
| `runtime.sound.music_reset_noop` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/163b | 19748-19751 | music_reset_channel_state |
| `runtime.sprites.show_sprite_legacy` | `routine` | `sprites` | `candidate_unreferenced` | 0 | 43l/981b | 20084-20126 | show_sprite |
| `runtime.animtiles.core` | `routine` | `animtiles` | `rooted` | 3 | 318l/9265b | 20204-20521 | init_animated_tiles, update_animated_tiles, update_animated_tiles_vram, set_animation_speed, anim_copy_8_bytes, ... (+9) |
| `runtime.scroll.core` | `routine` | `scroll` | `rooted` | 0 | 340l/8599b | 20541-20880 | init_scroll_system, set_camera_position, move_camera, center_camera_on_entity, update_scroll, ... (+2) |
| `runtime.worlds.worldmap_1777833018852.loader` | `routine` | `worlds` | `rooted` | 2 | 32l/1257b | 20980-21011 | load_world_worldmap_1777833018852 |
| `runtime.worlds.current_screen_helpers` | `routine` | `worlds` | `candidate_unreferenced` | 0 | 23l/633b | 21084-21106 | get_current_world_id, get_current_screen_index, set_current_screen |
| `runtime.hud.empty_update_stubs` | `routine` | `hud` | `candidate_unreferenced` | 0 | 6l/178b | 21349-21354 | update_hud_score, update_hud_lives |

## Dead-Block Candidates

- `runtime.components.legacy_tile_collision`: 43 lines / 1404 bytes. No external references found for any global label in this block.
- `runtime.sprites.show_sprite_legacy`: 43 lines / 981 bytes. No external references found for any global label in this block.
- `runtime.components.input_trigger_level`: 33 lines / 773 bytes. No external references found for any global label in this block.
- `runtime.gameflow.connection_by_type`: 37 lines / 701 bytes. No external references found for any global label in this block.
- `runtime.worlds.current_screen_helpers`: 23 lines / 633 bytes. No external references found for any global label in this block.
- `runtime.gameflow.confirm_input_direct`: 12 lines / 298 bytes. No external references found for any global label in this block.
- `runtime.components.auto_control_script_stubs`: 7 lines / 252 bytes. No external references found for any global label in this block.
- `runtime.screens.load_screen_stub`: 6 lines / 232 bytes. No external references found for any global label in this block.
- `runtime.components.platform_riding_stub`: 7 lines / 220 bytes. No external references found for any global label in this block.
- `runtime.components.auto_destroy_stub`: 7 lines / 219 bytes. No external references found for any global label in this block.
- `runtime.components.retractable_gate_stub`: 4 lines / 196 bytes. No external references found for any global label in this block.
- `runtime.components.secret_zone_stub`: 4 lines / 181 bytes. No external references found for any global label in this block.
- `runtime.components.collectible_stub`: 4 lines / 181 bytes. No external references found for any global label in this block.
- `runtime.hud.empty_update_stubs`: 6 lines / 178 bytes. No external references found for any global label in this block.
- `runtime.components.movement_stub`: 4 lines / 172 bytes. No external references found for any global label in this block.
- `runtime.components.in_water_stub`: 4 lines / 172 bytes. No external references found for any global label in this block.
- `runtime.components.damage_stub`: 4 lines / 166 bytes. No external references found for any global label in this block.
- `runtime.sound.music_reset_noop`: 4 lines / 163 bytes. No external references found for any global label in this block.
- `runtime.components.shoot_stub`: 4 lines / 163 bytes. No external references found for any global label in this block.
- `runtime.font.reload_stub`: 4 lines / 146 bytes. No external references found for any global label in this block.

## ROM Validation

- Original ROM bytes: 131072
- Optimized ROM bytes: 131072
- ROM byte delta: 0
- ROM SHA256 equal: False

## dead-blocks

- Metrics: findings=20, patchable=20, removed_lines=260, removed_source_bytes=7431
- Routines: runtime.components.auto_control_script_stubs, runtime.components.auto_destroy_stub, runtime.components.collectible_stub, runtime.components.damage_stub, runtime.components.in_water_stub, runtime.components.input_trigger_level, runtime.components.legacy_tile_collision, runtime.components.movement_stub, runtime.components.platform_riding_stub, runtime.components.retractable_gate_stub, runtime.components.secret_zone_stub, runtime.components.shoot_stub, runtime.font.reload_stub, runtime.gameflow.confirm_input_direct, runtime.gameflow.connection_by_type, runtime.hud.empty_update_stubs, runtime.screens.load_screen_stub, runtime.sound.music_reset_noop, runtime.sprites.show_sprite_legacy, runtime.worlds.current_screen_helpers

- [patchable] `runtime.components.input_trigger_level` lines 6437-6469: Block `runtime.components.input_trigger_level` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: component_trigger_level_pressed_a.
- [patchable] `runtime.font.reload_stub` lines 8338-8341: Block `runtime.font.reload_stub` (routine/unified) is a dead-code candidate. No external references found for any global label in this block. Labels: reload_font_system.
- [patchable] `runtime.components.movement_stub` lines 9080-9083: Block `runtime.components.movement_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_movement_component.
- [patchable] `runtime.components.auto_destroy_stub` lines 11278-11284: Block `runtime.components.auto_destroy_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: init_auto_destroy_system, update_auto_destroy_component.
- [patchable] `runtime.components.retractable_gate_stub` lines 11320-11323: Block `runtime.components.retractable_gate_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_retractable_gate_component.
- [patchable] `runtime.components.auto_control_script_stubs` lines 11410-11416: Block `runtime.components.auto_control_script_stubs` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_auto_control_script_component, update_auto_event_string_component.
- [patchable] `runtime.components.damage_stub` lines 11422-11425: Block `runtime.components.damage_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_damage_component.
- [patchable] `runtime.components.shoot_stub` lines 11431-11434: Block `runtime.components.shoot_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_shoot_component.
- [patchable] `runtime.components.platform_riding_stub` lines 11454-11460: Block `runtime.components.platform_riding_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: prepare_platform_detection, update_platform_riding.
- [patchable] `runtime.components.in_water_stub` lines 12567-12570: Block `runtime.components.in_water_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_in_water_component.
- [patchable] `runtime.components.collectible_stub` lines 12576-12579: Block `runtime.components.collectible_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_collectible_component.
- [patchable] `runtime.components.legacy_tile_collision` lines 14486-14528: Block `runtime.components.legacy_tile_collision` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: get_tile_at_position, get_tile_behavior, tile_behavior_table, check_collision_at_point, check_collision_box, ... (+1).
- [patchable] `runtime.components.secret_zone_stub` lines 14565-14568: Block `runtime.components.secret_zone_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_secret_zone_component.
- [patchable] `runtime.gameflow.connection_by_type` lines 16150-16186: Block `runtime.gameflow.connection_by_type` (routine/gameflow) is a dead-code candidate. No external references found for any global label in this block. Labels: gameflow_get_connection_by_type.
- [patchable] `runtime.gameflow.confirm_input_direct` lines 16211-16222: Block `runtime.gameflow.confirm_input_direct` (routine/gameflow) is a dead-code candidate. No external references found for any global label in this block. Labels: gameflow_read_confirm_direct.
- [patchable] `runtime.screens.load_screen_stub` lines 18363-18368: Block `runtime.screens.load_screen_stub` (routine/screens) is a dead-code candidate. No external references found for any global label in this block. Labels: load_screen.
- [patchable] `runtime.sound.music_reset_noop` lines 19748-19751: Block `runtime.sound.music_reset_noop` (routine/sound) is a dead-code candidate. No external references found for any global label in this block. Labels: music_reset_channel_state.
- [patchable] `runtime.sprites.show_sprite_legacy` lines 20084-20126: Block `runtime.sprites.show_sprite_legacy` (routine/sprites) is a dead-code candidate. No external references found for any global label in this block. Labels: show_sprite.
- [patchable] `runtime.worlds.current_screen_helpers` lines 21084-21106: Block `runtime.worlds.current_screen_helpers` (routine/worlds) is a dead-code candidate. No external references found for any global label in this block. Labels: get_current_world_id, get_current_screen_index, set_current_screen.
- [patchable] `runtime.hud.empty_update_stubs` lines 21349-21354: Block `runtime.hud.empty_update_stubs` (routine/hud) is a dead-code candidate. No external references found for any global label in this block. Labels: update_hud_score, update_hud_lives.

## Optimization Passes

- Pass 1: findings=20, patchable=20, removed=260 lines / 7431 bytes, lines=21361->21101
- Pass 2: findings=0, patchable=0, removed=0 lines / 0 bytes, lines=21101->21101

