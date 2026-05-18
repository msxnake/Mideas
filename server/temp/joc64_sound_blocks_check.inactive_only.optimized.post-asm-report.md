# Post-ASM Report

- Input: `C:\Users\salam\Documents\Programacion\Mideas\server\temp\joc64_sound_blocks_check.inactive_only.optimized.asm`
- Findings: 17
- Applied patches: 0
- Original lines: 34793
- Output lines: 34793
- Net line delta: 0

## Mideas Block Inventory

- Blocks: 77
- Preserved blocks: 1
- Removable-by-policy blocks: 76
- Dead-block candidates: 17
- Annotated block source: 15854 lines / 431994 bytes
- Dead-candidate source: 243 lines / 6855 bytes
- Marker errors: 0

- By kind: data=1, routine=76
- By owner: animtiles=1, bosses=2, components=33, entities=3, font=1, gameflow=7, hud=1, interrupt=5, mapper=1, resources=1, screens=7, scroll=1, sound=8, sprites=1, stateMachine=2, unified=1, worlds=2
- By status: candidate_unreferenced=17, preserved=1, referenced=13, rooted=46

### Largest Annotated Blocks

| ID | Status | Source | Kind | Owner |
| --- | --- | --- | --- | --- |
| `runtime.statemachine.core` | `rooted` | 2268l/60444b | `routine` | `stateMachine` |
| `runtime.components.scheduler` | `rooted` | 1582l/36089b | `routine` | `components` |
| `runtime.components.wallcollision` | `referenced` | 839l/31288b | `routine` | `components` |
| `runtime.boss.core` | `rooted` | 1362l/29800b | `routine` | `bosses` |
| `runtime.components.collision` | `referenced` | 668l/18861b | `routine` | `components` |
| `runtime.resources.manager` | `rooted` | 680l/17743b | `routine` | `resources` |
| `runtime.components.tile_interaction` | `rooted` | 641l/15812b | `routine` | `components` |
| `runtime.hud.core` | `rooted` | 602l/14282b | `routine` | `hud` |
| `data.statemachine.statemachine_1776707734563` | `rooted` | 356l/12906b | `data` | `stateMachine` |
| `runtime.components.input` | `referenced` | 388l/12766b | `routine` | `components` |
| `runtime.animtiles.core` | `rooted` | 434l/12491b | `routine` | `animtiles` |
| `runtime.components.animation` | `referenced` | 342l/10555b | `routine` | `components` |
| `runtime.components.sprite` | `rooted` | 396l/10316b | `routine` | `components` |
| `runtime.scroll.core` | `rooted` | 344l/8639b | `routine` | `scroll` |
| `runtime.components.jump` | `referenced` | 233l/7043b | `routine` | `components` |
| `runtime.font.loading` | `rooted` | 223l/6725b | `routine` | `font` |
| `runtime.components.entity_management` | `rooted` | 221l/6549b | `routine` | `components` |
| `runtime.interrupt.task_input` | `rooted` | 228l/5981b | `routine` | `interrupt` |
| `runtime.components.deadly_tiles` | `rooted` | 262l/5874b | `routine` | `components` |
| `runtime.mapper.core` | `rooted` | 213l/5412b | `routine` | `mapper` |

## Global Label Inventory

- Global labels: 872

| Label | Category | Source |
| --- | --- | --- |
| `FAST_SNSMAT` | `bios_helper` | 1145l/69173b |
| `update_wallcollision_component` | `runtime_code` | 538l/20410b |
| `Action_ChangeSprite` | `runtime_code` | 329l/14785b |
| `update_player_fastpath` | `runtime_code` | 604l/13839b |
| `tile_pattern_bank0` | `data` | 227l/12655b |
| `tile_color_bank0` | `data` | 224l/11795b |
| `update_entity_collision_fast` | `runtime_code` | 345l/9814b |
| `scan_tile_interaction_entities` | `runtime_code` | 355l/9254b |
| `update_animation_component` | `runtime_code` | 255l/8328b |
| `BANK_0_USED_END` | `bank_marker` | 141l/7678b |
| `vdpLoop` | `bios_helper` | 192l/6712b |
| `resource_table` | `data` | 367l/5679b |
| `FAR_BANK_6_ROM_START` | `bank_marker` | 112l/5554b |
| `BANK_2_USED_END` | `bank_marker` | 89l/5039b |
| `task_update_input` | `shared_runtime` | 199l/4970b |
| `init_player_1` | `boot_or_init` | 177l/4877b |
| `tilebank_pattern_data_1` | `data` | 58l/4842b |
| `tilebank_pattern_data_0` | `data` | 58l/4842b |
| `tilebank_color_data_1` | `data` | 58l/4840b |
| `tilebank_color_data_0` | `data` | 58l/4840b |
| `jump_update_loop` | `runtime_code` | 157l/4675b |
| `render_hud` | `runtime_code` | 164l/4492b |
| `rebuild_used_entity_list` | `runtime_code` | 207l/4475b |
| `update_boss_system` | `runtime_code` | 135l/4269b |
| `interrupt_dispatcher` | `shared_runtime` | 122l/4176b |
| `mapper_call_hl_auto` | `shared_runtime` | 104l/4109b |
| `Condition_VariableCompare` | `runtime_code` | 186l/3892b |
| `wall_build_hitbox_cache` | `runtime_code` | 121l/3875b |
| `load_screen_pan1_776511902784` | `screen_loader` | 94l/3733b |
| `SCREEN_PAN1_0_INTERACTION_TARGET_MAP` | `runtime_code` | 58l/3694b |

### Largest Unannotated Global Labels

- Unannotated labels: 407

| Category | Labels | Source |
| --- | ---: | ---: |
| `bank_marker` | 27 | 848l/38109b |
| `bios_helper` | 9 | 1746l/87462b |
| `boot_or_init` | 32 | 810l/21424b |
| `data` | 179 | 3180l/142138b |
| `far_trampoline` | 80 | 957l/19302b |
| `runtime_code` | 70 | 965l/32142b |
| `runtime_inner_label` | 2 | 28l/1163b |
| `screen_loader` | 2 | 36l/848b |
| `shared_runtime` | 2 | 31l/1113b |
| `unknown` | 4 | 4l/70b |

| Label | Category | Source |
| --- | --- | --- |
| `FAST_SNSMAT` | `bios_helper` | 1145l/69173b |
| `tile_pattern_bank0` | `data` | 227l/12655b |
| `tile_color_bank0` | `data` | 224l/11795b |
| `BANK_0_USED_END` | `bank_marker` | 141l/7678b |
| `vdpLoop` | `bios_helper` | 192l/6712b |
| `resource_table` | `data` | 367l/5679b |
| `FAR_BANK_6_ROM_START` | `bank_marker` | 112l/5554b |
| `BANK_2_USED_END` | `bank_marker` | 89l/5039b |
| `tilebank_pattern_data_1` | `data` | 58l/4842b |
| `tilebank_pattern_data_0` | `data` | 58l/4842b |
| `tilebank_color_data_1` | `data` | 58l/4840b |
| `tilebank_color_data_0` | `data` | 58l/4840b |
| `SCREEN_PAN1_0_INTERACTION_TARGET_MAP` | `runtime_code` | 58l/3694b |
| `SCREEN_NEW_DIALOG_SCREEN_1_INTERACTION_TARGET_MAP` | `data` | 55l/3694b |
| `load_sprite_patterns_worldmap_1776512078647` | `data` | 90l/3606b |
| `SCREEN_NEW_DIALOG_SCREEN_1_INTERACTION_VALUE_MAP` | `data` | 51l/3516b |
| `SCREEN_NEW_DIALOG_SCREEN_1_INTERACTION_TYPE_MAP` | `data` | 51l/3514b |
| `SCREEN_NEW_DIALOG_SCREEN_1_EFFECTS_LAYOUT` | `data` | 51l/3504b |
| `BEHAVIOR_NEW_DIALOG_SCREEN_1_DATA` | `data` | 52l/3497b |
| `SCREEN_PAN1_0_INTERACTION_VALUE_MAP` | `data` | 51l/3490b |
| `SCREEN_PAN1_0_INTERACTION_TYPE_MAP` | `data` | 51l/3488b |
| `SCREEN_PAN1_0_EFFECTS_LAYOUT` | `data` | 51l/3478b |
| `SCREEN_NEW_DIALOG_SCREEN_1_LAYOUT` | `data` | 50l/3444b |
| `FAR_BANK_9_ROM_START` | `bank_marker` | 79l/3183b |
| `FONT_PATTERN_DATA` | `data` | 90l/2903b |
| `init_char0_color` | `boot_or_init` | 95l/2487b |
| `restart_rom_continue` | `boot_or_init` | 83l/2480b |
| `FAST_LDIRVM` | `bios_helper` | 73l/2463b |
| `init_interrupt_system` | `boot_or_init` | 63l/2073b |
| `init_entities` | `boot_or_init` | 92l/2065b |

| ID | Kind | Owner | Status | Incoming | Source | Lines | Labels |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `runtime.mapper.core` | `routine` | `mapper` | `rooted` | 166 | 213l/5412b | 11999-12211 | mapper_runtime_init, mapper_set_bank_p1, mapper_set_bank_p2, mapper_set_bank_p3, mapper_set_bank_p4, ... (+14) |
| `runtime.resources.manager` | `routine` | `resources` | `rooted` | 52 | 680l/17743b | 12711-13390 | resource_manager_init, resource_invalidate_pattern_vram_cache, resource_invalidate_color_vram_cache, resource_invalidate_font_vram_cache, resource_invalidate_gameplay_vram_cache, ... (+14) |
| `runtime.components.input_trigger_level` | `routine` | `components` | `candidate_unreferenced` | 0 | 33l/773b | 13472-13504 | component_trigger_level_pressed_a |
| `runtime.page0.stubs` | `routine` | `unified` | `rooted` | 1 | 22l/505b | 13511-13532 | init_page0_runtime_state, page0_map_expanded_slot, page0_map_game_rom, page0_restore_bios_rom, page0_copy_chunk_to_buffer, ... (+2) |
| `runtime.interrupt.stop` | `routine` | `interrupt` | `rooted` | 0 | 43l/1299b | 13611-13653 | stop_interrupt_system |
| `runtime.interrupt.dispatcher` | `routine` | `interrupt` | `preserved` | 1 | 124l/4150b | 13655-13778 | interrupt_dispatcher |
| `runtime.interrupt.vblank_flag` | `routine` | `interrupt` | `rooted` | 1 | 35l/983b | 13791-13825 | update_vblank_flag |
| `runtime.interrupt.task_api` | `routine` | `interrupt` | `rooted` | 1 | 121l/3195b | 13830-13950 | enable_task, disable_task, get_frame_count |
| `runtime.interrupt.task_input` | `routine` | `interrupt` | `rooted` | 2 | 228l/5981b | 13954-14181 | init_default_tasks_from_plan, task_update_input |
| `runtime.sound.resident_wrappers` | `routine` | `sound` | `rooted` | 8 | 36l/1172b | 15279-15314 | call_init_sound_system_resident, call_task_audio_tick_resident, call_music_update_resident, call_sfx_update_resident, call_music_stop_resident, ... (+2) |
| `runtime.components.init` | `routine` | `components` | `rooted` | 11 | 86l/2981b | 15719-15804 | component_fill_32_a, init_components |
| `runtime.components.position` | `routine` | `components` | `rooted` | 3 | 108l/3281b | 15806-15913 | init_position_system, update_position_component, position_update_loop, position_next_entity |
| `runtime.components.sprite` | `routine` | `components` | `rooted` | 6 | 396l/10316b | 15914-16309 | init_sprite_system, update_sprite_component, sprite_update_loop, sprite_layer_loop, sprite_continue, ... (+6) |
| `runtime.components.movement_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 16315-16318 | update_movement_component |
| `runtime.components.collision` | `routine` | `components` | `referenced` | 2 | 668l/18861b | 16319-16986 | init_collision_system, update_collision_component, collision_update_loop, collision_next_entity, update_entity_collision_fast, ... (+13) |
| `runtime.components.behavior_tile` | `routine` | `components` | `rooted` | 9 | 110l/3809b | 16987-17096 | get_behavior_tile, get_behavior_tile_nb, gbt_oob |
| `runtime.components.directional_sprite_sync` | `routine` | `components` | `rooted` | 3 | 87l/2084b | 17097-17183 | component_sync_directional_sprite_from_initial, component_sync_directional_sprite_from_current, component_sync_directional_sprite_common |
| `runtime.components.input` | `routine` | `components` | `referenced` | 2 | 388l/12766b | 17184-17571 | init_input_system, update_input_component, input_update_loop, input_move_up, input_move_down, ... (+16) |
| `runtime.components.health` | `routine` | `components` | `rooted` | 3 | 152l/4701b | 17609-17760 | init_health_system, update_health_component, decrease_entity_lives, increase_entity_lives |
| `runtime.components.animation` | `routine` | `components` | `referenced` | 4 | 342l/10555b | 17761-18102 | init_animation_system, update_animation_component, anim_done_entity, refresh_player_animation_fastpath |
| `runtime.components.jump` | `routine` | `components` | `referenced` | 2 | 233l/7043b | 18103-18335 | init_jump_system, update_jump_component, jump_update_loop, jump_done_entity, jump_next_entity |
| `runtime.components.gravity` | `routine` | `components` | `rooted` | 2 | 137l/4553b | 18336-18472 | init_gravity_system, update_gravity_component, gravity_update_loop, gravity_store_vel, gravity_grounded, ... (+2) |
| `runtime.components.walljump_stub` | `routine` | `components` | `referenced` | 2 | 18l/326b | 18493-18510 | init_walljump_system, update_walljump_component, walljump_process_entity_c, walljump_input_is_left, walljump_input_is_right |
| `runtime.components.auto_destroy_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/219b | 18513-18519 | init_auto_destroy_system, update_auto_destroy_component |
| `runtime.components.state_machine_component_stub` | `routine` | `components` | `referenced` | 1 | 7l/241b | 18543-18549 | init_statemachine_system, update_statemachine_component |
| `runtime.components.retractable_gate_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/196b | 18555-18558 | update_retractable_gate_component |
| `runtime.components.carry` | `routine` | `components` | `rooted` | 1 | 81l/2148b | 18559-18639 | init_carry_system, update_carry_component |
| `runtime.components.auto_control_script_stubs` | `routine` | `components` | `referenced` | 2 | 7l/252b | 18645-18651 | update_auto_control_script_component, update_auto_event_string_component |
| `runtime.components.damage_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/166b | 18657-18660 | update_damage_component |
| `runtime.components.shoot_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/163b | 18666-18669 | update_shoot_component |
| `runtime.components.platform_riding_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/220b | 18689-18695 | prepare_platform_detection, update_platform_riding |
| `runtime.components.wallcollision` | `routine` | `components` | `referenced` | 3 | 839l/31288b | 18696-19534 | init_wallcollision_system, wall_behavior_is_full_blocker, wall_down_behavior_blocks, update_wallcollision_component, wall_build_hitbox_cache, ... (+2) |
| `runtime.components.deadly_tiles` | `routine` | `components` | `rooted` | 3 | 262l/5874b | 19535-19796 | init_deadly_tiles_system, deadly_tiles_runtime_tile_is_deadly_nb, update_entity_deadly_flag_runtime, update_deadly_tiles_component, refresh_player_deadly_fastpath |
| `runtime.components.in_water_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 19802-19805 | update_in_water_component |
| `runtime.components.collectible_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/181b | 19811-19814 | update_collectible_component |
| `runtime.components.tile_interaction` | `routine` | `components` | `rooted` | 4 | 641l/15812b | 19815-20455 | interaction_target_variable_ptr_table, interaction_target_variable_word_table, init_tile_interaction_system, update_slash_component, record_bonus_respawn_slot, ... (+11) |
| `runtime.components.collected_tiles` | `routine` | `components` | `rooted` | 1 | 76l/3015b | 20456-20531 | apply_collected_tiles |
| `runtime.components.entity_management` | `routine` | `components` | `rooted` | 3 | 221l/6549b | 20532-20752 | create_entity, entity_job_set, entity_job_set_period_ok, entity_job_set_entry_wrap, entity_job_set_entry_ok, ... (+13) |
| `runtime.components.scheduler` | `routine` | `components` | `rooted` | 7 | 1582l/36089b | 20753-22334 | update_all_entities, mark_used_entity_list_dirty, ensure_used_entity_list_current, rebuild_used_entity_list, ensure_player_fast_runtime_bound, ... (+10) |
| `runtime.components.state_machine_executor` | `routine` | `components` | `rooted` | 2 | 74l/1973b | 22340-22413 | execute_all_state_machines, refresh_player_state_machine_fastpath |
| `runtime.components.legacy_tile_collision` | `routine` | `components` | `candidate_unreferenced` | 0 | 43l/1404b | 22423-22465 | get_tile_at_position, get_tile_behavior, tile_behavior_table, check_collision_at_point, check_collision_box, ... (+1) |
| `runtime.components.secret_zone_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/181b | 22502-22505 | update_secret_zone_component |
| `runtime.statemachine.core` | `routine` | `stateMachine` | `rooted` | 4 | 2268l/60444b | 22523-24790 | SM_Update, sm_timer_no_overflow, sm_update_done, SM_CheckTransitions, SM_CheckTransitions_Loop, ... (+35) |
| `data.statemachine.statemachine_1776707734563` | `data` | `stateMachine` | `rooted` | 1 | 356l/12906b | 24875-25230 | SM_New_Statemachine_state_1776707744092, SM_New_Statemachine_state_1776707744092_Transitions, SM_New_Statemachine_state_1776707744092_Transitions_Actions_0, SM_New_Statemachine_state_1776707744092_Transitions_Actions_1, SM_New_Statemachine_state_1776707744092_Transitions_Actions_2, ... (+33) |
| `runtime.gameflow.worldlink` | `routine` | `gameflow` | `rooted` | 1 | 85l/2442b | 25352-25436 | gameflow_handle_worldlink |
| `runtime.gameflow.end_screen` | `routine` | `gameflow` | `rooted` | 1 | 146l/4078b | 25438-25583 | gameflow_handle_end, display_end_screen, print_string_vram, str_victory, str_game_over, ... (+1) |
| `runtime.gameflow.connection_by_type` | `routine` | `gameflow` | `candidate_unreferenced` | 0 | 37l/701b | 25620-25656 | gameflow_get_connection_by_type |
| `runtime.gameflow.confirm_input_direct` | `routine` | `gameflow` | `candidate_unreferenced` | 0 | 12l/298b | 25681-25692 | gameflow_read_confirm_direct |
| `runtime.gameflow.world_loop` | `routine` | `gameflow` | `rooted` | 1 | 76l/2619b | 25700-25775 | gameflow_world_game_loop |
| `runtime.gameflow.screen_timer` | `routine` | `gameflow` | `rooted` | 1 | 144l/3220b | 25782-25925 | get_world_screen_timer_frames_per_second, reload_world_screen_timer_frames, snapshot_world_screen_timer_interrupt_counter, reset_world_screen_timer, update_world_screen_timer |
| `runtime.gameflow.clear_screen_area_helpers` | `routine` | `gameflow` | `referenced` | 1 | 60l/1737b | 26050-26109 | clear_screen_area, clear_screen_row, empty_row_data |
| `runtime.boss.entry` | `routine` | `bosses` | `rooted` | 2 | 75l/1835b | 27927-28001 | init_boss_system, update_boss_system |
| `runtime.boss.core` | `routine` | `bosses` | `rooted` | 17 | 1362l/29800b | 28003-29364 | init_screen_boss_from_current_screen, boss_resolve_initial_phase, boss_init_behavior_state, draw_active_boss_tiles, restore_active_boss_tiles, ... (+33) |
| `runtime.screens.colors` | `routine` | `screens` | `rooted` | 1 | 44l/1514b | 29651-29694 | color_shift_table, set_screen_colors |
| `runtime.screens.copy_rect` | `routine` | `screens` | `rooted` | 0 | 77l/1494b | 29788-29864 | copy_layout_rect_to_vram, copy_layout_rect_ram_to_ram |
| `runtime.screens.block_layout_expander` | `routine` | `screens` | `rooted` | 1 | 194l/3798b | 29866-30059 | expand_screen_block_layout_to_background, expand_screen_block_layout_2x2, expand_screen_block_layout_4x4 |
| `runtime.screens.behavior_map_rebuild` | `routine` | `screens` | `referenced` | 1 | 26l/709b | 30077-30102 | build_runtime_behavior_map_from_screen_layout |
| `runtime.screens.load_screen_stub` | `routine` | `screens` | `candidate_unreferenced` | 0 | 6l/232b | 30103-30108 | load_screen |
| `runtime.screens.load_screen_pan1_776511902784.loader` | `routine` | `screens` | `rooted` | 1 | 126l/4766b | 30110-30235 | load_screen_pan1_776511902784, load_pan1_776511902784_boss_done |
| `runtime.screens.load_screen_new_dialog_screen_777377884059.loader` | `routine` | `screens` | `rooted` | 1 | 111l/4505b | 30237-30347 | load_screen_new_dialog_screen_777377884059, load_new_dialog_screen_777377884059_boss_done |
| `data.entities.player_1.init` | `routine` | `entities` | `rooted` | 1 | 177l/4971b | 30522-30698 | init_player_1 |
| `data.entities.fakeplayer_1.init` | `routine` | `entities` | `rooted` | 1 | 117l/3268b | 30717-30833 | init_fakeplayer_1 |
| `runtime.entities.patrol_facing` | `routine` | `entities` | `rooted` | 0 | 88l/2125b | 31010-31097 | update_entity_patrol_facing |
| `runtime.sprites.show_sprite_legacy` | `routine` | `sprites` | `candidate_unreferenced` | 0 | 43l/981b | 31725-31767 | show_sprite |
| `runtime.sound.init` | `routine` | `sound` | `rooted` | 1 | 22l/725b | 31919-31940 | init_sound_system |
| `runtime.sound.tick` | `routine` | `sound` | `rooted` | 0 | 17l/320b | 31947-31963 | task_audio_tick |
| `runtime.sound.psg_lowlevel` | `routine` | `sound` | `rooted` | 27 | 117l/3450b | 31968-32084 | psg_write, psg_set_tone, psg_set_volume, psg_set_noise, psg_set_mixer, ... (+1) |
| `runtime.sound.sfx_silence` | `routine` | `sound` | `referenced` | 2 | 21l/579b | 32094-32114 | sfx_silence_all |
| `runtime.sound.sfx_builtin_effects` | `routine` | `sound` | `referenced` | 6 | 127l/3025b | 32120-32246 | sfx_beep, sfx_jump, sfx_shoot, sfx_explosion, sfx_coin, ... (+1) |
| `runtime.sound.sfx_playback` | `routine` | `sound` | `referenced` | 1 | 119l/2384b | 32264-32382 | play_sound_effect, play_sound_effect_beep, play_sound_effect_jump, play_sound_effect_shoot, play_sound_effect_explosion, ... (+4) |
| `runtime.sound.music_reset_noop` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/163b | 32411-32414 | music_reset_channel_state |
| `runtime.hud.core` | `routine` | `hud` | `rooted` | 3 | 602l/14282b | 32478-33079 | hud_element_data, hud_text_0, hud_text_1, hud_text_2, hud_text_3, ... (+10) |
| `runtime.font.loading` | `routine` | `font` | `rooted` | 3 | 223l/6725b | 33212-33434 | load_custom_font, load_font_bank0, load_font_bank1, load_font_bank2, load_all_font_banks, ... (+5) |
| `runtime.animtiles.core` | `routine` | `animtiles` | `rooted` | 3 | 434l/12491b | 33512-33945 | init_animated_tiles, update_animated_tiles, update_animated_tiles_vram, set_animation_speed, anim_copy_8_bytes, ... (+11) |
| `runtime.scroll.core` | `routine` | `scroll` | `rooted` | 0 | 344l/8639b | 33965-34308 | init_scroll_system, set_camera_position, move_camera, center_camera_on_entity, update_scroll, ... (+2) |
| `runtime.worlds.worldmap_1776512078647.loader` | `routine` | `worlds` | `rooted` | 2 | 36l/1331b | 34440-34475 | load_world_worldmap_1776512078647 |
| `runtime.worlds.current_screen_helpers` | `routine` | `worlds` | `candidate_unreferenced` | 0 | 23l/633b | 34548-34570 | get_current_world_id, get_current_screen_index, set_current_screen |

## Dead-Block Candidates

- `runtime.components.legacy_tile_collision`: 43 lines / 1404 bytes. No external references found for any global label in this block.
- `runtime.sprites.show_sprite_legacy`: 43 lines / 981 bytes. No external references found for any global label in this block.
- `runtime.components.input_trigger_level`: 33 lines / 773 bytes. No external references found for any global label in this block.
- `runtime.gameflow.connection_by_type`: 37 lines / 701 bytes. No external references found for any global label in this block.
- `runtime.worlds.current_screen_helpers`: 23 lines / 633 bytes. No external references found for any global label in this block.
- `runtime.gameflow.confirm_input_direct`: 12 lines / 298 bytes. No external references found for any global label in this block.
- `runtime.screens.load_screen_stub`: 6 lines / 232 bytes. No external references found for any global label in this block.
- `runtime.components.platform_riding_stub`: 7 lines / 220 bytes. No external references found for any global label in this block.
- `runtime.components.auto_destroy_stub`: 7 lines / 219 bytes. No external references found for any global label in this block.
- `runtime.components.retractable_gate_stub`: 4 lines / 196 bytes. No external references found for any global label in this block.
- `runtime.components.secret_zone_stub`: 4 lines / 181 bytes. No external references found for any global label in this block.
- `runtime.components.collectible_stub`: 4 lines / 181 bytes. No external references found for any global label in this block.
- `runtime.components.movement_stub`: 4 lines / 172 bytes. No external references found for any global label in this block.
- `runtime.components.in_water_stub`: 4 lines / 172 bytes. No external references found for any global label in this block.
- `runtime.components.damage_stub`: 4 lines / 166 bytes. No external references found for any global label in this block.
- `runtime.sound.music_reset_noop`: 4 lines / 163 bytes. No external references found for any global label in this block.
- `runtime.components.shoot_stub`: 4 lines / 163 bytes. No external references found for any global label in this block.

## dead-blocks

- Metrics: findings=17, patchable=0, removed_lines=0, removed_source_bytes=0
- Routines: runtime.components.auto_destroy_stub, runtime.components.collectible_stub, runtime.components.damage_stub, runtime.components.in_water_stub, runtime.components.input_trigger_level, runtime.components.legacy_tile_collision, runtime.components.movement_stub, runtime.components.platform_riding_stub, runtime.components.retractable_gate_stub, runtime.components.secret_zone_stub, runtime.components.shoot_stub, runtime.gameflow.confirm_input_direct, runtime.gameflow.connection_by_type, runtime.screens.load_screen_stub, runtime.sound.music_reset_noop, runtime.sprites.show_sprite_legacy, runtime.worlds.current_screen_helpers

- [report-only] `runtime.components.input_trigger_level` lines 13472-13504: Block `runtime.components.input_trigger_level` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: component_trigger_level_pressed_a.
- [report-only] `runtime.components.movement_stub` lines 16315-16318: Block `runtime.components.movement_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_movement_component.
- [report-only] `runtime.components.auto_destroy_stub` lines 18513-18519: Block `runtime.components.auto_destroy_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: init_auto_destroy_system, update_auto_destroy_component.
- [report-only] `runtime.components.retractable_gate_stub` lines 18555-18558: Block `runtime.components.retractable_gate_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_retractable_gate_component.
- [report-only] `runtime.components.damage_stub` lines 18657-18660: Block `runtime.components.damage_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_damage_component.
- [report-only] `runtime.components.shoot_stub` lines 18666-18669: Block `runtime.components.shoot_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_shoot_component.
- [report-only] `runtime.components.platform_riding_stub` lines 18689-18695: Block `runtime.components.platform_riding_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: prepare_platform_detection, update_platform_riding.
- [report-only] `runtime.components.in_water_stub` lines 19802-19805: Block `runtime.components.in_water_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_in_water_component.
- [report-only] `runtime.components.collectible_stub` lines 19811-19814: Block `runtime.components.collectible_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_collectible_component.
- [report-only] `runtime.components.legacy_tile_collision` lines 22423-22465: Block `runtime.components.legacy_tile_collision` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: get_tile_at_position, get_tile_behavior, tile_behavior_table, check_collision_at_point, check_collision_box, ... (+1).
- [report-only] `runtime.components.secret_zone_stub` lines 22502-22505: Block `runtime.components.secret_zone_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_secret_zone_component.
- [report-only] `runtime.gameflow.connection_by_type` lines 25620-25656: Block `runtime.gameflow.connection_by_type` (routine/gameflow) is a dead-code candidate. No external references found for any global label in this block. Labels: gameflow_get_connection_by_type.
- [report-only] `runtime.gameflow.confirm_input_direct` lines 25681-25692: Block `runtime.gameflow.confirm_input_direct` (routine/gameflow) is a dead-code candidate. No external references found for any global label in this block. Labels: gameflow_read_confirm_direct.
- [report-only] `runtime.screens.load_screen_stub` lines 30103-30108: Block `runtime.screens.load_screen_stub` (routine/screens) is a dead-code candidate. No external references found for any global label in this block. Labels: load_screen.
- [report-only] `runtime.sprites.show_sprite_legacy` lines 31725-31767: Block `runtime.sprites.show_sprite_legacy` (routine/sprites) is a dead-code candidate. No external references found for any global label in this block. Labels: show_sprite.
- [report-only] `runtime.sound.music_reset_noop` lines 32411-32414: Block `runtime.sound.music_reset_noop` (routine/sound) is a dead-code candidate. No external references found for any global label in this block. Labels: music_reset_channel_state.
- [report-only] `runtime.worlds.current_screen_helpers` lines 34548-34570: Block `runtime.worlds.current_screen_helpers` (routine/worlds) is a dead-code candidate. No external references found for any global label in this block. Labels: get_current_world_id, get_current_screen_index, set_current_screen.

