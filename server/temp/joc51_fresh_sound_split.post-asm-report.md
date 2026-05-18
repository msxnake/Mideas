# Post-ASM Report

- Input: `C:\Users\salam\Documents\Programacion\Mideas\server\temp\joc51_fresh_sound_split.asm`
- Findings: 57
- Applied patches: 20
- Original lines: 32958
- Output lines: 32570
- Net line delta: -388

- Optimization passes run: 2
- Optimization source removed: 388 lines / 12209 bytes

## Mideas Block Inventory

- Blocks: 85
- Preserved blocks: 1
- Removable-by-policy blocks: 84
- Dead-block candidates: 17
- Annotated block source: 15719 lines / 431699 bytes
- Dead-candidate source: 243 lines / 6915 bytes
- Marker errors: 0

- By kind: data=1, routine=84
- By owner: animtiles=1, bosses=2, components=33, entities=4, font=1, gameflow=7, hud=1, interrupt=5, mapper=1, resources=1, screens=7, scroll=1, sound=15, sprites=1, stateMachine=2, unified=1, worlds=2
- By status: candidate_unreferenced=17, preserved=1, referenced=20, rooted=47

### Largest Annotated Blocks

| ID | Status | Source | Kind | Owner |
| --- | --- | --- | --- | --- |
| `runtime.statemachine.core` | `rooted` | 2268l/60444b | `routine` | `stateMachine` |
| `runtime.components.scheduler` | `rooted` | 1583l/36142b | `routine` | `components` |
| `runtime.components.wallcollision` | `referenced` | 839l/31288b | `routine` | `components` |
| `runtime.boss.core` | `rooted` | 876l/19553b | `routine` | `bosses` |
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

- Global labels: 843

| Label | Category | Source |
| --- | --- | --- |
| `FAST_SNSMAT` | `bios_helper` | 1021l/62382b |
| `update_wallcollision_component` | `runtime_code` | 538l/20410b |
| `Action_ChangeSprite` | `runtime_code` | 329l/14785b |
| `update_player_fastpath` | `runtime_code` | 604l/13839b |
| `update_entity_collision_fast` | `runtime_code` | 345l/9814b |
| `scan_tile_interaction_entities` | `runtime_code` | 355l/9254b |
| `update_animation_component` | `runtime_code` | 255l/8328b |
| `BANK_0_USED_END` | `bank_marker` | 141l/7686b |
| `vdpLoop` | `bios_helper` | 192l/6712b |
| `FAR_BANK_6_ROM_START` | `bank_marker` | 112l/5553b |
| `resource_table` | `data` | 331l/5189b |
| `task_update_input` | `shared_runtime` | 199l/4970b |
| `init_player_1` | `boot_or_init` | 177l/4877b |
| `jump_update_loop` | `runtime_code` | 157l/4675b |
| `BANK_2_USED_END` | `bank_marker` | 80l/4510b |
| `render_hud` | `runtime_code` | 164l/4492b |
| `rebuild_used_entity_list` | `runtime_code` | 207l/4475b |
| `update_boss_system` | `runtime_code` | 134l/4229b |
| `interrupt_dispatcher` | `shared_runtime` | 122l/4176b |
| `init_basic_enemy_1` | `boot_or_init` | 156l/4119b |
| `tile_pattern_bank0` | `data` | 72l/4114b |
| `Condition_VariableCompare` | `runtime_code` | 186l/3892b |
| `wall_build_hitbox_cache` | `runtime_code` | 121l/3875b |
| `mapper_call_hl_auto` | `shared_runtime` | 98l/3821b |
| `load_screen_pan1_776511902784` | `screen_loader` | 94l/3733b |
| `tile_color_bank0` | `data` | 68l/3731b |
| `SCREEN_NEW_DIALOG_SCREEN_1_INTERACTION_TARGET_MAP` | `data` | 54l/3707b |
| `SCREEN_PAN1_0_INTERACTION_TARGET_MAP` | `runtime_code` | 58l/3694b |
| `Action_SetVariable` | `runtime_code` | 150l/3656b |
| `SCREEN_NEW_DIALOG_SCREEN_1_INTERACTION_VALUE_MAP` | `data` | 51l/3516b |

### Largest Unannotated Global Labels

- Unannotated labels: 375

| Category | Labels | Source |
| --- | ---: | ---: |
| `bank_marker` | 27 | 846l/37860b |
| `bios_helper` | 9 | 1622l/80671b |
| `boot_or_init` | 31 | 806l/21342b |
| `data` | 162 | 2514l/103168b |
| `far_trampoline` | 74 | 849l/16667b |
| `runtime_code` | 66 | 944l/32210b |
| `runtime_inner_label` | 2 | 28l/1163b |
| `screen_loader` | 2 | 36l/848b |
| `shared_runtime` | 2 | 31l/1113b |

| Label | Category | Source |
| --- | --- | --- |
| `FAST_SNSMAT` | `bios_helper` | 1021l/62382b |
| `BANK_0_USED_END` | `bank_marker` | 141l/7686b |
| `vdpLoop` | `bios_helper` | 192l/6712b |
| `FAR_BANK_6_ROM_START` | `bank_marker` | 112l/5553b |
| `resource_table` | `data` | 331l/5189b |
| `BANK_2_USED_END` | `bank_marker` | 80l/4510b |
| `tile_pattern_bank0` | `data` | 72l/4114b |
| `tile_color_bank0` | `data` | 68l/3731b |
| `SCREEN_NEW_DIALOG_SCREEN_1_INTERACTION_TARGET_MAP` | `data` | 54l/3707b |
| `SCREEN_PAN1_0_INTERACTION_TARGET_MAP` | `runtime_code` | 58l/3694b |
| `SCREEN_NEW_DIALOG_SCREEN_1_INTERACTION_VALUE_MAP` | `data` | 51l/3516b |
| `SCREEN_NEW_DIALOG_SCREEN_1_INTERACTION_TYPE_MAP` | `data` | 51l/3514b |
| `SCREEN_NEW_DIALOG_SCREEN_1_EFFECTS_LAYOUT` | `data` | 51l/3504b |
| `BEHAVIOR_NEW_DIALOG_SCREEN_1_DATA` | `data` | 52l/3497b |
| `SCREEN_PAN1_0_INTERACTION_VALUE_MAP` | `data` | 51l/3490b |
| `SCREEN_PAN1_0_INTERACTION_TYPE_MAP` | `data` | 51l/3488b |
| `SCREEN_PAN1_0_EFFECTS_LAYOUT` | `data` | 51l/3478b |
| `SCREEN_NEW_DIALOG_SCREEN_1_LAYOUT` | `data` | 50l/3444b |
| `FAR_BANK_9_ROM_START` | `bank_marker` | 79l/3183b |
| `load_sprite_patterns_worldmap_1776512078647` | `data` | 76l/3051b |
| `FONT_PATTERN_DATA` | `data` | 90l/2903b |
| `init_char0_color` | `boot_or_init` | 95l/2487b |
| `restart_rom_continue` | `boot_or_init` | 83l/2480b |
| `FAST_LDIRVM` | `bios_helper` | 73l/2463b |
| `init_entities` | `boot_or_init` | 93l/2093b |
| `init_interrupt_system` | `boot_or_init` | 63l/2073b |
| `init_sprites` | `boot_or_init` | 71l/1898b |
| `FAST_WRTVDP` | `bios_helper` | 59l/1764b |
| `FAST_WRTVRM` | `bios_helper` | 60l/1682b |
| `FAST_FILLVRM` | `bios_helper` | 76l/1677b |

| ID | Kind | Owner | Status | Incoming | Source | Lines | Labels |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `runtime.mapper.core` | `routine` | `mapper` | `rooted` | 154 | 213l/5412b | 11102-11314 | mapper_runtime_init, mapper_set_bank_p1, mapper_set_bank_p2, mapper_set_bank_p3, mapper_set_bank_p4, ... (+14) |
| `runtime.resources.manager` | `routine` | `resources` | `rooted` | 48 | 680l/17743b | 11772-12451 | resource_manager_init, resource_invalidate_pattern_vram_cache, resource_invalidate_color_vram_cache, resource_invalidate_font_vram_cache, resource_invalidate_gameplay_vram_cache, ... (+14) |
| `runtime.components.input_trigger_level` | `routine` | `components` | `candidate_unreferenced` | 0 | 33l/773b | 12533-12565 | component_trigger_level_pressed_a |
| `runtime.page0.stubs` | `routine` | `unified` | `rooted` | 1 | 22l/505b | 12572-12593 | init_page0_runtime_state, page0_map_expanded_slot, page0_map_game_rom, page0_restore_bios_rom, page0_copy_chunk_to_buffer, ... (+2) |
| `runtime.interrupt.stop` | `routine` | `interrupt` | `rooted` | 0 | 43l/1299b | 12672-12714 | stop_interrupt_system |
| `runtime.interrupt.dispatcher` | `routine` | `interrupt` | `preserved` | 1 | 124l/4150b | 12716-12839 | interrupt_dispatcher |
| `runtime.interrupt.vblank_flag` | `routine` | `interrupt` | `rooted` | 1 | 35l/983b | 12852-12886 | update_vblank_flag |
| `runtime.interrupt.task_api` | `routine` | `interrupt` | `rooted` | 1 | 121l/3195b | 12891-13011 | enable_task, disable_task, get_frame_count |
| `runtime.interrupt.task_input` | `routine` | `interrupt` | `rooted` | 2 | 228l/5981b | 13015-13242 | init_default_tasks_from_plan, task_update_input |
| `runtime.sound.resident.init` | `routine` | `sound` | `referenced` | 1 | 4l/184b | 14231-14234 | call_init_sound_system_resident |
| `runtime.sound.resident.tick` | `routine` | `sound` | `referenced` | 3 | 18l/606b | 14236-14253 | call_task_audio_tick_resident |
| `runtime.sound.resident.music_update` | `routine` | `sound` | `referenced` | 2 | 4l/190b | 14255-14258 | call_music_update_resident |
| `runtime.sound.resident.sfx_update` | `routine` | `sound` | `referenced` | 1 | 4l/182b | 14260-14263 | call_sfx_update_resident |
| `runtime.sound.resident.music_stop` | `routine` | `sound` | `referenced` | 1 | 4l/182b | 14265-14268 | call_music_stop_resident |
| `runtime.sound.resident.music_play_track` | `routine` | `sound` | `referenced` | 1 | 4l/206b | 14270-14273 | call_music_play_track_resident |
| `runtime.sound.resident.music_execute_command` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/226b | 14275-14278 | call_music_execute_command_resident |
| `runtime.components.init` | `routine` | `components` | `rooted` | 11 | 88l/3052b | 14683-14770 | component_fill_32_a, init_components |
| `runtime.components.position` | `routine` | `components` | `rooted` | 3 | 108l/3281b | 14772-14879 | init_position_system, update_position_component, position_update_loop, position_next_entity |
| `runtime.components.sprite` | `routine` | `components` | `rooted` | 6 | 396l/10316b | 14880-15275 | init_sprite_system, update_sprite_component, sprite_update_loop, sprite_layer_loop, sprite_continue, ... (+6) |
| `runtime.components.movement_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 15281-15284 | update_movement_component |
| `runtime.components.collision` | `routine` | `components` | `referenced` | 2 | 668l/18861b | 15285-15952 | init_collision_system, update_collision_component, collision_update_loop, collision_next_entity, update_entity_collision_fast, ... (+13) |
| `runtime.components.behavior_tile` | `routine` | `components` | `rooted` | 9 | 110l/3809b | 15953-16062 | get_behavior_tile, get_behavior_tile_nb, gbt_oob |
| `runtime.components.directional_sprite_sync` | `routine` | `components` | `rooted` | 3 | 87l/2084b | 16063-16149 | component_sync_directional_sprite_from_initial, component_sync_directional_sprite_from_current, component_sync_directional_sprite_common |
| `runtime.components.input` | `routine` | `components` | `referenced` | 2 | 388l/12766b | 16150-16537 | init_input_system, update_input_component, input_update_loop, input_move_up, input_move_down, ... (+16) |
| `runtime.components.health` | `routine` | `components` | `rooted` | 4 | 152l/4701b | 16575-16726 | init_health_system, update_health_component, decrease_entity_lives, increase_entity_lives |
| `runtime.components.animation` | `routine` | `components` | `referenced` | 4 | 342l/10555b | 16727-17068 | init_animation_system, update_animation_component, anim_done_entity, refresh_player_animation_fastpath |
| `runtime.components.jump` | `routine` | `components` | `referenced` | 2 | 233l/7043b | 17069-17301 | init_jump_system, update_jump_component, jump_update_loop, jump_done_entity, jump_next_entity |
| `runtime.components.gravity` | `routine` | `components` | `rooted` | 2 | 137l/4553b | 17302-17438 | init_gravity_system, update_gravity_component, gravity_update_loop, gravity_store_vel, gravity_grounded, ... (+2) |
| `runtime.components.walljump_stub` | `routine` | `components` | `referenced` | 2 | 18l/326b | 17459-17476 | init_walljump_system, update_walljump_component, walljump_process_entity_c, walljump_input_is_left, walljump_input_is_right |
| `runtime.components.auto_destroy_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/219b | 17479-17485 | init_auto_destroy_system, update_auto_destroy_component |
| `runtime.components.state_machine_component_stub` | `routine` | `components` | `referenced` | 1 | 7l/241b | 17509-17515 | init_statemachine_system, update_statemachine_component |
| `runtime.components.retractable_gate_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/196b | 17521-17524 | update_retractable_gate_component |
| `runtime.components.carry` | `routine` | `components` | `rooted` | 1 | 81l/2148b | 17525-17605 | init_carry_system, update_carry_component |
| `runtime.components.auto_control_script_stubs` | `routine` | `components` | `referenced` | 2 | 7l/252b | 17611-17617 | update_auto_control_script_component, update_auto_event_string_component |
| `runtime.components.damage` | `routine` | `components` | `rooted` | 2 | 126l/3906b | 17618-17743 | init_damage_system, update_damage_component, apply_damage_to_entity, check_entity_invincible |
| `runtime.components.shoot_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/163b | 17749-17752 | update_shoot_component |
| `runtime.components.platform_riding_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/220b | 17772-17778 | prepare_platform_detection, update_platform_riding |
| `runtime.components.wallcollision` | `routine` | `components` | `referenced` | 3 | 839l/31288b | 17779-18617 | init_wallcollision_system, wall_behavior_is_full_blocker, wall_down_behavior_blocks, update_wallcollision_component, wall_build_hitbox_cache, ... (+2) |
| `runtime.components.deadly_tiles` | `routine` | `components` | `rooted` | 3 | 262l/5874b | 18618-18879 | init_deadly_tiles_system, deadly_tiles_runtime_tile_is_deadly_nb, update_entity_deadly_flag_runtime, update_deadly_tiles_component, refresh_player_deadly_fastpath |
| `runtime.components.in_water_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 18885-18888 | update_in_water_component |
| `runtime.components.collectible_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/181b | 18894-18897 | update_collectible_component |
| `runtime.components.tile_interaction` | `routine` | `components` | `rooted` | 4 | 641l/15812b | 18898-19538 | interaction_target_variable_ptr_table, interaction_target_variable_word_table, init_tile_interaction_system, update_slash_component, record_bonus_respawn_slot, ... (+11) |
| `runtime.components.collected_tiles` | `routine` | `components` | `rooted` | 1 | 76l/3015b | 19539-19614 | apply_collected_tiles |
| `runtime.components.entity_management` | `routine` | `components` | `rooted` | 3 | 221l/6549b | 19615-19835 | create_entity, entity_job_set, entity_job_set_period_ok, entity_job_set_entry_wrap, entity_job_set_entry_ok, ... (+13) |
| `runtime.components.scheduler` | `routine` | `components` | `rooted` | 7 | 1583l/36142b | 19836-21418 | update_all_entities, mark_used_entity_list_dirty, ensure_used_entity_list_current, rebuild_used_entity_list, ensure_player_fast_runtime_bound, ... (+10) |
| `runtime.components.state_machine_executor` | `routine` | `components` | `rooted` | 2 | 74l/1973b | 21424-21497 | execute_all_state_machines, refresh_player_state_machine_fastpath |
| `runtime.components.legacy_tile_collision` | `routine` | `components` | `candidate_unreferenced` | 0 | 43l/1404b | 21507-21549 | get_tile_at_position, get_tile_behavior, tile_behavior_table, check_collision_at_point, check_collision_box, ... (+1) |
| `runtime.components.secret_zone_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/181b | 21586-21589 | update_secret_zone_component |
| `runtime.statemachine.core` | `routine` | `stateMachine` | `rooted` | 4 | 2268l/60444b | 21607-23874 | SM_Update, sm_timer_no_overflow, sm_update_done, SM_CheckTransitions, SM_CheckTransitions_Loop, ... (+35) |
| `data.statemachine.statemachine_1776707734563` | `data` | `stateMachine` | `rooted` | 1 | 356l/12906b | 23958-24313 | SM_New_Statemachine_state_1776707744092, SM_New_Statemachine_state_1776707744092_Transitions, SM_New_Statemachine_state_1776707744092_Transitions_Actions_0, SM_New_Statemachine_state_1776707744092_Transitions_Actions_1, SM_New_Statemachine_state_1776707744092_Transitions_Actions_2, ... (+33) |
| `runtime.gameflow.worldlink` | `routine` | `gameflow` | `rooted` | 1 | 85l/2442b | 24435-24519 | gameflow_handle_worldlink |
| `runtime.gameflow.end_screen` | `routine` | `gameflow` | `rooted` | 1 | 146l/4078b | 24521-24666 | gameflow_handle_end, display_end_screen, print_string_vram, str_victory, str_game_over, ... (+1) |
| `runtime.gameflow.connection_by_type` | `routine` | `gameflow` | `candidate_unreferenced` | 0 | 37l/701b | 24703-24739 | gameflow_get_connection_by_type |
| `runtime.gameflow.confirm_input_direct` | `routine` | `gameflow` | `candidate_unreferenced` | 0 | 12l/298b | 24764-24775 | gameflow_read_confirm_direct |
| `runtime.gameflow.world_loop` | `routine` | `gameflow` | `rooted` | 1 | 76l/2619b | 24783-24858 | gameflow_world_game_loop |
| `runtime.gameflow.screen_timer` | `routine` | `gameflow` | `rooted` | 1 | 144l/3220b | 24865-25008 | get_world_screen_timer_frames_per_second, reload_world_screen_timer_frames, snapshot_world_screen_timer_interrupt_counter, reset_world_screen_timer, update_world_screen_timer |
| `runtime.gameflow.clear_screen_area_helpers` | `routine` | `gameflow` | `referenced` | 1 | 60l/1737b | 25133-25192 | clear_screen_area, clear_screen_row, empty_row_data |
| `data.entities.player_1.init` | `routine` | `entities` | `rooted` | 1 | 177l/4971b | 26593-26769 | init_player_1 |
| `data.entities.basic_enemy_1.init` | `routine` | `entities` | `rooted` | 1 | 156l/4223b | 26788-26943 | init_basic_enemy_1 |
| `data.entities.fakeplayer_1.init` | `routine` | `entities` | `rooted` | 1 | 117l/3268b | 26962-27078 | init_fakeplayer_1 |
| `runtime.entities.patrol_facing` | `routine` | `entities` | `rooted` | 0 | 88l/2125b | 27255-27342 | update_entity_patrol_facing |
| `runtime.screens.colors` | `routine` | `screens` | `rooted` | 1 | 44l/1514b | 27595-27638 | color_shift_table, set_screen_colors |
| `runtime.screens.copy_rect` | `routine` | `screens` | `rooted` | 0 | 77l/1494b | 27732-27808 | copy_layout_rect_to_vram, copy_layout_rect_ram_to_ram |
| `runtime.screens.block_layout_expander` | `routine` | `screens` | `rooted` | 1 | 194l/3798b | 27810-28003 | expand_screen_block_layout_to_background, expand_screen_block_layout_2x2, expand_screen_block_layout_4x4 |
| `runtime.screens.behavior_map_rebuild` | `routine` | `screens` | `referenced` | 1 | 26l/709b | 28021-28046 | build_runtime_behavior_map_from_screen_layout |
| `runtime.screens.load_screen_stub` | `routine` | `screens` | `candidate_unreferenced` | 0 | 6l/232b | 28047-28052 | load_screen |
| `runtime.screens.load_screen_pan1_776511902784.loader` | `routine` | `screens` | `rooted` | 1 | 126l/4766b | 28054-28179 | load_screen_pan1_776511902784, load_pan1_776511902784_boss_done |
| `runtime.screens.load_screen_new_dialog_screen_777377884059.loader` | `routine` | `screens` | `rooted` | 1 | 111l/4504b | 28181-28291 | load_screen_new_dialog_screen_777377884059, load_new_dialog_screen_777377884059_boss_done |
| `runtime.boss.entry` | `routine` | `bosses` | `rooted` | 2 | 73l/1760b | 28344-28416 | init_boss_system, update_boss_system |
| `runtime.boss.core` | `routine` | `bosses` | `rooted` | 9 | 876l/19553b | 28418-29293 | init_screen_boss_from_current_screen, boss_resolve_initial_phase, boss_init_behavior_state, draw_active_boss_tiles, restore_active_boss_tiles, ... (+21) |
| `runtime.sprites.show_sprite_legacy` | `routine` | `sprites` | `candidate_unreferenced` | 0 | 43l/981b | 29888-29930 | show_sprite |
| `runtime.sound.init` | `routine` | `sound` | `rooted` | 1 | 22l/725b | 30082-30103 | init_sound_system |
| `runtime.sound.tick` | `routine` | `sound` | `rooted` | 1 | 17l/320b | 30110-30126 | task_audio_tick |
| `runtime.sound.psg_lowlevel` | `routine` | `sound` | `rooted` | 27 | 117l/3450b | 30131-30247 | psg_write, psg_set_tone, psg_set_volume, psg_set_noise, psg_set_mixer, ... (+1) |
| `runtime.sound.sfx_silence` | `routine` | `sound` | `referenced` | 2 | 21l/579b | 30257-30277 | sfx_silence_all |
| `runtime.sound.sfx_builtin_effects` | `routine` | `sound` | `referenced` | 6 | 127l/3025b | 30283-30409 | sfx_beep, sfx_jump, sfx_shoot, sfx_explosion, sfx_coin, ... (+1) |
| `runtime.sound.sfx_playback` | `routine` | `sound` | `referenced` | 1 | 119l/2384b | 30427-30545 | play_sound_effect, play_sound_effect_beep, play_sound_effect_jump, play_sound_effect_shoot, play_sound_effect_explosion, ... (+4) |
| `runtime.sound.music_noop_runtime` | `routine` | `sound` | `referenced` | 5 | 66l/1337b | 30554-30619 | music_init_system, music_reset_channel_state, music_silence_channels, music_stop, music_mute, ... (+7) |
| `runtime.sound.music_reset_noop` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/163b | 30575-30578 | music_reset_channel_state |
| `runtime.hud.core` | `routine` | `hud` | `rooted` | 3 | 602l/14282b | 30643-31244 | hud_element_data, hud_text_0, hud_text_1, hud_text_2, hud_text_3, ... (+10) |
| `runtime.font.loading` | `routine` | `font` | `rooted` | 3 | 223l/6725b | 31377-31599 | load_custom_font, load_font_bank0, load_font_bank1, load_font_bank2, load_all_font_banks, ... (+5) |
| `runtime.animtiles.core` | `routine` | `animtiles` | `rooted` | 3 | 434l/12491b | 31677-32110 | init_animated_tiles, update_animated_tiles, update_animated_tiles_vram, set_animation_speed, anim_copy_8_bytes, ... (+11) |
| `runtime.scroll.core` | `routine` | `scroll` | `rooted` | 0 | 344l/8639b | 32130-32473 | init_scroll_system, set_camera_position, move_camera, center_camera_on_entity, update_scroll, ... (+2) |
| `runtime.worlds.worldmap_1776512078647.loader` | `routine` | `worlds` | `rooted` | 2 | 36l/1331b | 32605-32640 | load_world_worldmap_1776512078647 |
| `runtime.worlds.current_screen_helpers` | `routine` | `worlds` | `candidate_unreferenced` | 0 | 23l/633b | 32713-32735 | get_current_world_id, get_current_screen_index, set_current_screen |

## Dead-Block Candidates

- `runtime.components.legacy_tile_collision`: 43 lines / 1404 bytes. No external references found for any global label in this block.
- `runtime.sprites.show_sprite_legacy`: 43 lines / 981 bytes. No external references found for any global label in this block.
- `runtime.components.input_trigger_level`: 33 lines / 773 bytes. No external references found for any global label in this block.
- `runtime.gameflow.connection_by_type`: 37 lines / 701 bytes. No external references found for any global label in this block.
- `runtime.worlds.current_screen_helpers`: 23 lines / 633 bytes. No external references found for any global label in this block.
- `runtime.gameflow.confirm_input_direct`: 12 lines / 298 bytes. No external references found for any global label in this block.
- `runtime.screens.load_screen_stub`: 6 lines / 232 bytes. No external references found for any global label in this block.
- `runtime.sound.resident.music_execute_command`: 4 lines / 226 bytes. No external references found for any global label in this block.
- `runtime.components.platform_riding_stub`: 7 lines / 220 bytes. No external references found for any global label in this block.
- `runtime.components.auto_destroy_stub`: 7 lines / 219 bytes. No external references found for any global label in this block.
- `runtime.components.retractable_gate_stub`: 4 lines / 196 bytes. No external references found for any global label in this block.
- `runtime.components.secret_zone_stub`: 4 lines / 181 bytes. No external references found for any global label in this block.
- `runtime.components.collectible_stub`: 4 lines / 181 bytes. No external references found for any global label in this block.
- `runtime.components.movement_stub`: 4 lines / 172 bytes. No external references found for any global label in this block.
- `runtime.components.in_water_stub`: 4 lines / 172 bytes. No external references found for any global label in this block.
- `runtime.sound.music_reset_noop`: 4 lines / 163 bytes. No external references found for any global label in this block.
- `runtime.components.shoot_stub`: 4 lines / 163 bytes. No external references found for any global label in this block.

## ROM Validation

- Original ROM bytes: 139264
- Optimized ROM bytes: 139264
- ROM byte delta: 0
- ROM SHA256 equal: False

## dead-blocks

- Metrics: findings=17, patchable=17, removed_lines=243, removed_source_bytes=6915
- Routines: runtime.components.auto_destroy_stub, runtime.components.collectible_stub, runtime.components.in_water_stub, runtime.components.input_trigger_level, runtime.components.legacy_tile_collision, runtime.components.movement_stub, runtime.components.platform_riding_stub, runtime.components.retractable_gate_stub, runtime.components.secret_zone_stub, runtime.components.shoot_stub, runtime.gameflow.confirm_input_direct, runtime.gameflow.connection_by_type, runtime.screens.load_screen_stub, runtime.sound.music_reset_noop, runtime.sound.resident.music_execute_command, runtime.sprites.show_sprite_legacy, runtime.worlds.current_screen_helpers

- [patchable] `runtime.components.input_trigger_level` lines 12533-12565: Block `runtime.components.input_trigger_level` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: component_trigger_level_pressed_a.
- [patchable] `runtime.sound.resident.music_execute_command` lines 14275-14278: Block `runtime.sound.resident.music_execute_command` (routine/sound) is a dead-code candidate. No external references found for any global label in this block. Labels: call_music_execute_command_resident.
- [patchable] `runtime.components.movement_stub` lines 15281-15284: Block `runtime.components.movement_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_movement_component.
- [patchable] `runtime.components.auto_destroy_stub` lines 17479-17485: Block `runtime.components.auto_destroy_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: init_auto_destroy_system, update_auto_destroy_component.
- [patchable] `runtime.components.retractable_gate_stub` lines 17521-17524: Block `runtime.components.retractable_gate_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_retractable_gate_component.
- [patchable] `runtime.components.shoot_stub` lines 17749-17752: Block `runtime.components.shoot_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_shoot_component.
- [patchable] `runtime.components.platform_riding_stub` lines 17772-17778: Block `runtime.components.platform_riding_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: prepare_platform_detection, update_platform_riding.
- [patchable] `runtime.components.in_water_stub` lines 18885-18888: Block `runtime.components.in_water_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_in_water_component.
- [patchable] `runtime.components.collectible_stub` lines 18894-18897: Block `runtime.components.collectible_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_collectible_component.
- [patchable] `runtime.components.legacy_tile_collision` lines 21507-21549: Block `runtime.components.legacy_tile_collision` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: get_tile_at_position, get_tile_behavior, tile_behavior_table, check_collision_at_point, check_collision_box, ... (+1).
- [patchable] `runtime.components.secret_zone_stub` lines 21586-21589: Block `runtime.components.secret_zone_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_secret_zone_component.
- [patchable] `runtime.gameflow.connection_by_type` lines 24703-24739: Block `runtime.gameflow.connection_by_type` (routine/gameflow) is a dead-code candidate. No external references found for any global label in this block. Labels: gameflow_get_connection_by_type.
- [patchable] `runtime.gameflow.confirm_input_direct` lines 24764-24775: Block `runtime.gameflow.confirm_input_direct` (routine/gameflow) is a dead-code candidate. No external references found for any global label in this block. Labels: gameflow_read_confirm_direct.
- [patchable] `runtime.screens.load_screen_stub` lines 28047-28052: Block `runtime.screens.load_screen_stub` (routine/screens) is a dead-code candidate. No external references found for any global label in this block. Labels: load_screen.
- [patchable] `runtime.sprites.show_sprite_legacy` lines 29888-29930: Block `runtime.sprites.show_sprite_legacy` (routine/sprites) is a dead-code candidate. No external references found for any global label in this block. Labels: show_sprite.
- [patchable] `runtime.sound.music_reset_noop` lines 30575-30578: Block `runtime.sound.music_reset_noop` (routine/sound) is a dead-code candidate. No external references found for any global label in this block. Labels: music_reset_channel_state.
- [patchable] `runtime.worlds.current_screen_helpers` lines 32713-32735: Block `runtime.worlds.current_screen_helpers` (routine/worlds) is a dead-code candidate. No external references found for any global label in this block. Labels: get_current_world_id, get_current_screen_index, set_current_screen.

## unused-screen-loaders

- Metrics: findings=2, patchable=2, removed_lines=128, removed_source_bytes=4953
- Routines: load_screen_new_dialog_screen_777377884059_far, runtime.screens.load_screen_new_dialog_screen_777377884059.loader

- [patchable] `load_screen_new_dialog_screen_777377884059_far` lines 13354-13371: `load_screen_new_dialog_screen_777377884059_far` is a generated screen loader (18 lines, 450 source bytes) with no external label references. Category reason: Generated screen loader routine. Project metadata maps it to scene `New Dialog Screen` (index=1, resources=8). GameFlow reachability marks this scene unreachable. Related annotated loader block `runtime.screens.load_screen_new_dialog_screen_777377884059.loader` is currently rooted by `load_screen_new_dialog_screen_777377884059`. Deletion is patchable only when GameFlow reachability proves the scene is unreachable.
- [patchable] `runtime.screens.load_screen_new_dialog_screen_777377884059.loader` lines 28181-28291: Annotated loader block `runtime.screens.load_screen_new_dialog_screen_777377884059.loader` only feeds `load_screen_new_dialog_screen_777377884059_far`, and GameFlow reachability marks the owning scene unreachable.

## inactive-feature-runtime

- Metrics: findings=38, patchable=1, removed_lines=17, removed_source_bytes=341
- Routines: call_init_sound_system_resident, call_music_execute_command_resident, call_music_play_track_resident, call_music_stop_resident, call_music_update_resident, call_sfx_update_resident, call_task_audio_tick_resident, init_sound_system, init_sound_system_far, music_execute_command, music_execute_command_far, music_init_system, music_play_track, music_play_track_far, music_reset_channel_state, music_silence_channels, music_stop, music_stop_far, music_update_far, runtime.sound.group.init, runtime.sound.group.music_execute_command, runtime.sound.group.music_play_track, runtime.sound.group.music_stop, runtime.sound.group.music_update, runtime.sound.group.sfx_update, runtime.sound.group.tick, sfx_beep, sfx_coin, sfx_damage, sfx_explosion, sfx_jump, sfx_play, sfx_shoot, sfx_silence_all, sfx_update, sfx_update_far, task_audio_tick, task_audio_tick_far

- [report-only] `runtime.sound.group.init` lines 13663-30110: `runtime.sound.group.init` groups inactive audio init runtime labels: call_init_sound_system_resident, init_sound_system, init_sound_system_far. Group deletion remains blocked by 1 external references: init_rom->call_init_sound_system_resident@9364.
- [report-only] `init_sound_system_far` lines 13663-13680: `init_sound_system_far` looks like audio runtime (18 lines, 350 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: boot_or_init (Boot/init routine). External references still exist (1): call_init_sound_system_resident@14233. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `runtime.sound.group.tick` lines 13681-30139: `runtime.sound.group.tick` groups inactive audio tick runtime labels: call_task_audio_tick_resident, task_audio_tick, task_audio_tick_far. Group deletion remains blocked by 3 external references: init_rom->call_task_audio_tick_resident@9385, gameflow_handle_end->call_task_audio_tick_resident@24548, gameflow_world_game_loop->call_task_audio_tick_resident@24792.
- [patchable] `task_audio_tick_far` lines 13681-13698: `task_audio_tick_far` looks like audio runtime (18 lines, 342 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Patch enabled for inactive audio runtime with no external references. The patch is still validated by the post-ASM transform invariants.
- [report-only] `runtime.sound.group.sfx_update` lines 13699-30554: `runtime.sound.group.sfx_update` groups inactive SFX update runtime labels: call_sfx_update_resident, sfx_update, sfx_update_far. Group deletion remains blocked by 1 external references: gameflow_world_game_loop->call_sfx_update_resident@24827.
- [report-only] `sfx_update_far` lines 13699-13716: `sfx_update_far` looks like audio runtime (18 lines, 322 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_sfx_update_resident@14262. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `runtime.sound.group.music_update` lines 13717-30601: `runtime.sound.group.music_update` groups inactive music update runtime labels: call_music_update_resident, music_update, music_update_far. Group deletion remains blocked by 2 external references: call_task_audio_tick_resident->call_music_update_resident@14246, task_audio_tick->call_music_update_resident@30117.
- [report-only] `music_update_far` lines 13717-13734: `music_update_far` looks like audio runtime (18 lines, 330 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_music_update_resident@14257. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `runtime.sound.group.music_stop` lines 13735-30598: `runtime.sound.group.music_stop` groups inactive music stop runtime labels: call_music_stop_resident, music_stop, music_stop_far. Group deletion remains blocked by 2 external references: music_execute_command->music_stop@30611, update_scroll->call_music_stop_resident@32543.
- [report-only] `music_stop_far` lines 13735-13752: `music_stop_far` looks like audio runtime (18 lines, 322 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_music_stop_resident@14267. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `runtime.sound.group.music_play_track` lines 13753-30605: `runtime.sound.group.music_play_track` groups inactive music play-track runtime labels: call_music_play_track_resident, music_play_track, music_play_track_far. Group deletion remains blocked by 1 external references: update_scroll->call_music_play_track_resident@32561.
- [report-only] `music_play_track_far` lines 13753-13772: `music_play_track_far` looks like audio runtime (20 lines, 383 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_music_play_track_resident@14272. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `runtime.sound.group.music_execute_command` lines 13773-30613: `runtime.sound.group.music_execute_command` groups inactive music command runtime labels: call_music_execute_command_resident, music_execute_command, music_execute_command_far. No external references outside the group were found. This is ready for a future atomic multi-window patch, or for dead-blocks to remove the annotated windows as whole groups.
- [report-only] `music_execute_command_far` lines 13773-13793: `music_execute_command_far` looks like audio runtime (21 lines, 439 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_music_execute_command_resident@14277. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_init_sound_system_resident` lines 14232-14236: `call_init_sound_system_resident` looks like audio runtime (5 lines, 185 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): init_rom@9364. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_task_audio_tick_resident` lines 14237-14255: `call_task_audio_tick_resident` looks like audio runtime (19 lines, 615 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (3): init_rom@9385, gameflow_handle_end@24548, gameflow_world_game_loop@24792. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_music_update_resident` lines 14256-14260: `call_music_update_resident` looks like audio runtime (5 lines, 189 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (2): call_task_audio_tick_resident@14246, task_audio_tick@30117. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_sfx_update_resident` lines 14261-14265: `call_sfx_update_resident` looks like audio runtime (5 lines, 183 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): gameflow_world_game_loop@24827. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_music_stop_resident` lines 14266-14270: `call_music_stop_resident` looks like audio runtime (5 lines, 189 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): update_scroll@32543. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_music_play_track_resident` lines 14271-14275: `call_music_play_track_resident` looks like audio runtime (5 lines, 212 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): update_scroll@32561. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_music_execute_command_resident` lines 14276-14279: `call_music_execute_command_resident` looks like audio runtime (4 lines, 138 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Patch remains disabled because `call_music_execute_command_resident` is inside annotated block `runtime.sound.resident.music_execute_command`; group-level deletion must be handled by dead-blocks. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `init_sound_system` lines 30083-30110: `init_sound_system` looks like audio runtime (28 lines, 1006 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: boot_or_init (Boot/init routine). External references still exist (1): init_sound_system_far@13670. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `task_audio_tick` lines 30111-30139: `task_audio_tick` looks like audio runtime (29 lines, 836 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: shared_runtime (Shared low-level runtime helper). External references still exist (1): task_audio_tick_far@13688. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_silence_all` lines 30258-30283: `sfx_silence_all` looks like audio runtime (26 lines, 757 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (2): init_sound_system@30100, sfx_update@30541. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_beep` lines 30284-30304: `sfx_beep` looks like audio runtime (21 lines, 492 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_beep@30446. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_jump` lines 30305-30326: `sfx_jump` looks like audio runtime (22 lines, 473 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_jump@30452. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_shoot` lines 30327-30351: `sfx_shoot` looks like audio runtime (25 lines, 565 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_shoot@30458. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_explosion` lines 30352-30371: `sfx_explosion` looks like audio runtime (20 lines, 497 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_explosion@30464. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_coin` lines 30372-30393: `sfx_coin` looks like audio runtime (22 lines, 536 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_coin@30470. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_damage` lines 30394-30427: `sfx_damage` looks like audio runtime (34 lines, 1140 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_damage@30476. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_play` lines 30487-30515: `sfx_play` looks like audio runtime (29 lines, 600 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (6): play_sound_effect_beep@30448, play_sound_effect_jump@30454, play_sound_effect_shoot@30460, play_sound_effect_explosion@30466, play_sound_effect_coin@30472, ... (+1 more). Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_update` lines 30516-30554: `sfx_update` looks like audio runtime (39 lines, 1016 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): sfx_update_far@13706. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `music_init_system` lines 30555-30575: `music_init_system` looks like audio runtime (21 lines, 566 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (2): init_sound_system@30097, music_stop@30595. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `music_reset_channel_state` lines 30576-30579: `music_reset_channel_state` looks like audio runtime (4 lines, 89 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Patch remains disabled because `music_reset_channel_state` is inside annotated block `runtime.sound.music_reset_noop`; group-level deletion must be handled by dead-blocks. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `music_silence_channels` lines 30580-30593: `music_silence_channels` looks like audio runtime (14 lines, 212 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): music_stop@30596. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `music_stop` lines 30594-30598: `music_stop` looks like audio runtime (5 lines, 80 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (2): music_stop_far@13742, music_execute_command@30611. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `music_play_track` lines 30603-30605: `music_play_track` looks like audio runtime (3 lines, 27 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): music_play_track_far@13761. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `music_execute_command` lines 30606-30613: `music_execute_command` looks like audio runtime (8 lines, 98 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): music_execute_command_far@13780. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.

## Optimization Passes

- Pass 1: findings=57, patchable=20, removed=388 lines / 12209 bytes, lines=32958->32570
- Pass 2: findings=35, patchable=0, removed=0 lines / 0 bytes, lines=32570->32570

