# Post-ASM Report

- Input: `C:\Users\salam\Documents\Programacion\Mideas\server\temp\joc51_fresh_audio_far_block.asm`
- Findings: 60
- Applied patches: 21
- Original lines: 32972
- Output lines: 32575
- Net line delta: -397

- Optimization passes run: 2
- Optimization source removed: 397 lines / 12514 bytes

## Mideas Block Inventory

- Blocks: 92
- Preserved blocks: 8
- Removable-by-policy blocks: 84
- Dead-block candidates: 17
- Annotated block source: 15854 lines / 435303 bytes
- Dead-candidate source: 243 lines / 6915 bytes
- Marker errors: 0

- By kind: data=1, routine=84, trampoline=7
- By owner: animtiles=1, bosses=2, components=33, entities=4, far-call=7, font=1, gameflow=7, hud=1, interrupt=5, mapper=1, resources=1, screens=7, scroll=1, sound=15, sprites=1, stateMachine=2, unified=1, worlds=2
- By status: candidate_unreferenced=17, preserved=8, referenced=20, rooted=47

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

- Unannotated labels: 368

| Category | Labels | Source |
| --- | ---: | ---: |
| `bank_marker` | 27 | 846l/37860b |
| `bios_helper` | 9 | 1622l/80671b |
| `boot_or_init` | 30 | 788l/20992b |
| `data` | 162 | 2515l/103277b |
| `far_trampoline` | 68 | 736l/14529b |
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
| `runtime.far_trampoline.init_sound_system_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/525b | 13663-13681 | init_sound_system_far |
| `runtime.far_trampoline.task_audio_tick_far` | `trampoline` | `far-call` | `preserved` | 0 | 19l/513b | 13683-13701 | task_audio_tick_far |
| `runtime.far_trampoline.sfx_update_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/483b | 13703-13721 | sfx_update_far |
| `runtime.far_trampoline.music_update_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/495b | 13723-13741 | music_update_far |
| `runtime.far_trampoline.music_stop_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/483b | 13743-13761 | music_stop_far |
| `runtime.far_trampoline.music_play_track_far` | `trampoline` | `far-call` | `preserved` | 1 | 21l/556b | 13763-13783 | music_play_track_far |
| `runtime.far_trampoline.music_execute_command_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/549b | 13785-13803 | music_execute_command_far |
| `runtime.sound.resident.init` | `routine` | `sound` | `referenced` | 1 | 4l/184b | 14245-14248 | call_init_sound_system_resident |
| `runtime.sound.resident.tick` | `routine` | `sound` | `referenced` | 3 | 18l/606b | 14250-14267 | call_task_audio_tick_resident |
| `runtime.sound.resident.music_update` | `routine` | `sound` | `referenced` | 2 | 4l/190b | 14269-14272 | call_music_update_resident |
| `runtime.sound.resident.sfx_update` | `routine` | `sound` | `referenced` | 1 | 4l/182b | 14274-14277 | call_sfx_update_resident |
| `runtime.sound.resident.music_stop` | `routine` | `sound` | `referenced` | 1 | 4l/182b | 14279-14282 | call_music_stop_resident |
| `runtime.sound.resident.music_play_track` | `routine` | `sound` | `referenced` | 1 | 4l/206b | 14284-14287 | call_music_play_track_resident |
| `runtime.sound.resident.music_execute_command` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/226b | 14289-14292 | call_music_execute_command_resident |
| `runtime.components.init` | `routine` | `components` | `rooted` | 11 | 88l/3052b | 14697-14784 | component_fill_32_a, init_components |
| `runtime.components.position` | `routine` | `components` | `rooted` | 3 | 108l/3281b | 14786-14893 | init_position_system, update_position_component, position_update_loop, position_next_entity |
| `runtime.components.sprite` | `routine` | `components` | `rooted` | 6 | 396l/10316b | 14894-15289 | init_sprite_system, update_sprite_component, sprite_update_loop, sprite_layer_loop, sprite_continue, ... (+6) |
| `runtime.components.movement_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 15295-15298 | update_movement_component |
| `runtime.components.collision` | `routine` | `components` | `referenced` | 2 | 668l/18861b | 15299-15966 | init_collision_system, update_collision_component, collision_update_loop, collision_next_entity, update_entity_collision_fast, ... (+13) |
| `runtime.components.behavior_tile` | `routine` | `components` | `rooted` | 9 | 110l/3809b | 15967-16076 | get_behavior_tile, get_behavior_tile_nb, gbt_oob |
| `runtime.components.directional_sprite_sync` | `routine` | `components` | `rooted` | 3 | 87l/2084b | 16077-16163 | component_sync_directional_sprite_from_initial, component_sync_directional_sprite_from_current, component_sync_directional_sprite_common |
| `runtime.components.input` | `routine` | `components` | `referenced` | 2 | 388l/12766b | 16164-16551 | init_input_system, update_input_component, input_update_loop, input_move_up, input_move_down, ... (+16) |
| `runtime.components.health` | `routine` | `components` | `rooted` | 4 | 152l/4701b | 16589-16740 | init_health_system, update_health_component, decrease_entity_lives, increase_entity_lives |
| `runtime.components.animation` | `routine` | `components` | `referenced` | 4 | 342l/10555b | 16741-17082 | init_animation_system, update_animation_component, anim_done_entity, refresh_player_animation_fastpath |
| `runtime.components.jump` | `routine` | `components` | `referenced` | 2 | 233l/7043b | 17083-17315 | init_jump_system, update_jump_component, jump_update_loop, jump_done_entity, jump_next_entity |
| `runtime.components.gravity` | `routine` | `components` | `rooted` | 2 | 137l/4553b | 17316-17452 | init_gravity_system, update_gravity_component, gravity_update_loop, gravity_store_vel, gravity_grounded, ... (+2) |
| `runtime.components.walljump_stub` | `routine` | `components` | `referenced` | 2 | 18l/326b | 17473-17490 | init_walljump_system, update_walljump_component, walljump_process_entity_c, walljump_input_is_left, walljump_input_is_right |
| `runtime.components.auto_destroy_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/219b | 17493-17499 | init_auto_destroy_system, update_auto_destroy_component |
| `runtime.components.state_machine_component_stub` | `routine` | `components` | `referenced` | 1 | 7l/241b | 17523-17529 | init_statemachine_system, update_statemachine_component |
| `runtime.components.retractable_gate_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/196b | 17535-17538 | update_retractable_gate_component |
| `runtime.components.carry` | `routine` | `components` | `rooted` | 1 | 81l/2148b | 17539-17619 | init_carry_system, update_carry_component |
| `runtime.components.auto_control_script_stubs` | `routine` | `components` | `referenced` | 2 | 7l/252b | 17625-17631 | update_auto_control_script_component, update_auto_event_string_component |
| `runtime.components.damage` | `routine` | `components` | `rooted` | 2 | 126l/3906b | 17632-17757 | init_damage_system, update_damage_component, apply_damage_to_entity, check_entity_invincible |
| `runtime.components.shoot_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/163b | 17763-17766 | update_shoot_component |
| `runtime.components.platform_riding_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/220b | 17786-17792 | prepare_platform_detection, update_platform_riding |
| `runtime.components.wallcollision` | `routine` | `components` | `referenced` | 3 | 839l/31288b | 17793-18631 | init_wallcollision_system, wall_behavior_is_full_blocker, wall_down_behavior_blocks, update_wallcollision_component, wall_build_hitbox_cache, ... (+2) |
| `runtime.components.deadly_tiles` | `routine` | `components` | `rooted` | 3 | 262l/5874b | 18632-18893 | init_deadly_tiles_system, deadly_tiles_runtime_tile_is_deadly_nb, update_entity_deadly_flag_runtime, update_deadly_tiles_component, refresh_player_deadly_fastpath |
| `runtime.components.in_water_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 18899-18902 | update_in_water_component |
| `runtime.components.collectible_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/181b | 18908-18911 | update_collectible_component |
| `runtime.components.tile_interaction` | `routine` | `components` | `rooted` | 4 | 641l/15812b | 18912-19552 | interaction_target_variable_ptr_table, interaction_target_variable_word_table, init_tile_interaction_system, update_slash_component, record_bonus_respawn_slot, ... (+11) |
| `runtime.components.collected_tiles` | `routine` | `components` | `rooted` | 1 | 76l/3015b | 19553-19628 | apply_collected_tiles |
| `runtime.components.entity_management` | `routine` | `components` | `rooted` | 3 | 221l/6549b | 19629-19849 | create_entity, entity_job_set, entity_job_set_period_ok, entity_job_set_entry_wrap, entity_job_set_entry_ok, ... (+13) |
| `runtime.components.scheduler` | `routine` | `components` | `rooted` | 7 | 1583l/36142b | 19850-21432 | update_all_entities, mark_used_entity_list_dirty, ensure_used_entity_list_current, rebuild_used_entity_list, ensure_player_fast_runtime_bound, ... (+10) |
| `runtime.components.state_machine_executor` | `routine` | `components` | `rooted` | 2 | 74l/1973b | 21438-21511 | execute_all_state_machines, refresh_player_state_machine_fastpath |
| `runtime.components.legacy_tile_collision` | `routine` | `components` | `candidate_unreferenced` | 0 | 43l/1404b | 21521-21563 | get_tile_at_position, get_tile_behavior, tile_behavior_table, check_collision_at_point, check_collision_box, ... (+1) |
| `runtime.components.secret_zone_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/181b | 21600-21603 | update_secret_zone_component |
| `runtime.statemachine.core` | `routine` | `stateMachine` | `rooted` | 4 | 2268l/60444b | 21621-23888 | SM_Update, sm_timer_no_overflow, sm_update_done, SM_CheckTransitions, SM_CheckTransitions_Loop, ... (+35) |
| `data.statemachine.statemachine_1776707734563` | `data` | `stateMachine` | `rooted` | 1 | 356l/12906b | 23972-24327 | SM_New_Statemachine_state_1776707744092, SM_New_Statemachine_state_1776707744092_Transitions, SM_New_Statemachine_state_1776707744092_Transitions_Actions_0, SM_New_Statemachine_state_1776707744092_Transitions_Actions_1, SM_New_Statemachine_state_1776707744092_Transitions_Actions_2, ... (+33) |
| `runtime.gameflow.worldlink` | `routine` | `gameflow` | `rooted` | 1 | 85l/2442b | 24449-24533 | gameflow_handle_worldlink |
| `runtime.gameflow.end_screen` | `routine` | `gameflow` | `rooted` | 1 | 146l/4078b | 24535-24680 | gameflow_handle_end, display_end_screen, print_string_vram, str_victory, str_game_over, ... (+1) |
| `runtime.gameflow.connection_by_type` | `routine` | `gameflow` | `candidate_unreferenced` | 0 | 37l/701b | 24717-24753 | gameflow_get_connection_by_type |
| `runtime.gameflow.confirm_input_direct` | `routine` | `gameflow` | `candidate_unreferenced` | 0 | 12l/298b | 24778-24789 | gameflow_read_confirm_direct |
| `runtime.gameflow.world_loop` | `routine` | `gameflow` | `rooted` | 1 | 76l/2619b | 24797-24872 | gameflow_world_game_loop |
| `runtime.gameflow.screen_timer` | `routine` | `gameflow` | `rooted` | 1 | 144l/3220b | 24879-25022 | get_world_screen_timer_frames_per_second, reload_world_screen_timer_frames, snapshot_world_screen_timer_interrupt_counter, reset_world_screen_timer, update_world_screen_timer |
| `runtime.gameflow.clear_screen_area_helpers` | `routine` | `gameflow` | `referenced` | 1 | 60l/1737b | 25147-25206 | clear_screen_area, clear_screen_row, empty_row_data |
| `data.entities.player_1.init` | `routine` | `entities` | `rooted` | 1 | 177l/4971b | 26607-26783 | init_player_1 |
| `data.entities.basic_enemy_1.init` | `routine` | `entities` | `rooted` | 1 | 156l/4223b | 26802-26957 | init_basic_enemy_1 |
| `data.entities.fakeplayer_1.init` | `routine` | `entities` | `rooted` | 1 | 117l/3268b | 26976-27092 | init_fakeplayer_1 |
| `runtime.entities.patrol_facing` | `routine` | `entities` | `rooted` | 0 | 88l/2125b | 27269-27356 | update_entity_patrol_facing |
| `runtime.screens.colors` | `routine` | `screens` | `rooted` | 1 | 44l/1514b | 27609-27652 | color_shift_table, set_screen_colors |
| `runtime.screens.copy_rect` | `routine` | `screens` | `rooted` | 0 | 77l/1494b | 27746-27822 | copy_layout_rect_to_vram, copy_layout_rect_ram_to_ram |
| `runtime.screens.block_layout_expander` | `routine` | `screens` | `rooted` | 1 | 194l/3798b | 27824-28017 | expand_screen_block_layout_to_background, expand_screen_block_layout_2x2, expand_screen_block_layout_4x4 |
| `runtime.screens.behavior_map_rebuild` | `routine` | `screens` | `referenced` | 1 | 26l/709b | 28035-28060 | build_runtime_behavior_map_from_screen_layout |
| `runtime.screens.load_screen_stub` | `routine` | `screens` | `candidate_unreferenced` | 0 | 6l/232b | 28061-28066 | load_screen |
| `runtime.screens.load_screen_pan1_776511902784.loader` | `routine` | `screens` | `rooted` | 1 | 126l/4766b | 28068-28193 | load_screen_pan1_776511902784, load_pan1_776511902784_boss_done |
| `runtime.screens.load_screen_new_dialog_screen_777377884059.loader` | `routine` | `screens` | `rooted` | 1 | 111l/4504b | 28195-28305 | load_screen_new_dialog_screen_777377884059, load_new_dialog_screen_777377884059_boss_done |
| `runtime.boss.entry` | `routine` | `bosses` | `rooted` | 2 | 73l/1760b | 28358-28430 | init_boss_system, update_boss_system |
| `runtime.boss.core` | `routine` | `bosses` | `rooted` | 9 | 876l/19553b | 28432-29307 | init_screen_boss_from_current_screen, boss_resolve_initial_phase, boss_init_behavior_state, draw_active_boss_tiles, restore_active_boss_tiles, ... (+21) |
| `runtime.sprites.show_sprite_legacy` | `routine` | `sprites` | `candidate_unreferenced` | 0 | 43l/981b | 29902-29944 | show_sprite |
| `runtime.sound.init` | `routine` | `sound` | `rooted` | 1 | 22l/725b | 30096-30117 | init_sound_system |
| `runtime.sound.tick` | `routine` | `sound` | `rooted` | 1 | 17l/320b | 30124-30140 | task_audio_tick |
| `runtime.sound.psg_lowlevel` | `routine` | `sound` | `rooted` | 27 | 117l/3450b | 30145-30261 | psg_write, psg_set_tone, psg_set_volume, psg_set_noise, psg_set_mixer, ... (+1) |
| `runtime.sound.sfx_silence` | `routine` | `sound` | `referenced` | 2 | 21l/579b | 30271-30291 | sfx_silence_all |
| `runtime.sound.sfx_builtin_effects` | `routine` | `sound` | `referenced` | 6 | 127l/3025b | 30297-30423 | sfx_beep, sfx_jump, sfx_shoot, sfx_explosion, sfx_coin, ... (+1) |
| `runtime.sound.sfx_playback` | `routine` | `sound` | `referenced` | 1 | 119l/2384b | 30441-30559 | play_sound_effect, play_sound_effect_beep, play_sound_effect_jump, play_sound_effect_shoot, play_sound_effect_explosion, ... (+4) |
| `runtime.sound.music_noop_runtime` | `routine` | `sound` | `referenced` | 5 | 66l/1337b | 30568-30633 | music_init_system, music_reset_channel_state, music_silence_channels, music_stop, music_mute, ... (+7) |
| `runtime.sound.music_reset_noop` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/163b | 30589-30592 | music_reset_channel_state |
| `runtime.hud.core` | `routine` | `hud` | `rooted` | 3 | 602l/14282b | 30657-31258 | hud_element_data, hud_text_0, hud_text_1, hud_text_2, hud_text_3, ... (+10) |
| `runtime.font.loading` | `routine` | `font` | `rooted` | 3 | 223l/6725b | 31391-31613 | load_custom_font, load_font_bank0, load_font_bank1, load_font_bank2, load_all_font_banks, ... (+5) |
| `runtime.animtiles.core` | `routine` | `animtiles` | `rooted` | 3 | 434l/12491b | 31691-32124 | init_animated_tiles, update_animated_tiles, update_animated_tiles_vram, set_animation_speed, anim_copy_8_bytes, ... (+11) |
| `runtime.scroll.core` | `routine` | `scroll` | `rooted` | 0 | 344l/8639b | 32144-32487 | init_scroll_system, set_camera_position, move_camera, center_camera_on_entity, update_scroll, ... (+2) |
| `runtime.worlds.worldmap_1776512078647.loader` | `routine` | `worlds` | `rooted` | 2 | 36l/1331b | 32619-32654 | load_world_worldmap_1776512078647 |
| `runtime.worlds.current_screen_helpers` | `routine` | `worlds` | `candidate_unreferenced` | 0 | 23l/633b | 32727-32749 | get_current_world_id, get_current_screen_index, set_current_screen |

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
- [patchable] `runtime.sound.resident.music_execute_command` lines 14289-14292: Block `runtime.sound.resident.music_execute_command` (routine/sound) is a dead-code candidate. No external references found for any global label in this block. Labels: call_music_execute_command_resident.
- [patchable] `runtime.components.movement_stub` lines 15295-15298: Block `runtime.components.movement_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_movement_component.
- [patchable] `runtime.components.auto_destroy_stub` lines 17493-17499: Block `runtime.components.auto_destroy_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: init_auto_destroy_system, update_auto_destroy_component.
- [patchable] `runtime.components.retractable_gate_stub` lines 17535-17538: Block `runtime.components.retractable_gate_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_retractable_gate_component.
- [patchable] `runtime.components.shoot_stub` lines 17763-17766: Block `runtime.components.shoot_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_shoot_component.
- [patchable] `runtime.components.platform_riding_stub` lines 17786-17792: Block `runtime.components.platform_riding_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: prepare_platform_detection, update_platform_riding.
- [patchable] `runtime.components.in_water_stub` lines 18899-18902: Block `runtime.components.in_water_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_in_water_component.
- [patchable] `runtime.components.collectible_stub` lines 18908-18911: Block `runtime.components.collectible_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_collectible_component.
- [patchable] `runtime.components.legacy_tile_collision` lines 21521-21563: Block `runtime.components.legacy_tile_collision` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: get_tile_at_position, get_tile_behavior, tile_behavior_table, check_collision_at_point, check_collision_box, ... (+1).
- [patchable] `runtime.components.secret_zone_stub` lines 21600-21603: Block `runtime.components.secret_zone_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_secret_zone_component.
- [patchable] `runtime.gameflow.connection_by_type` lines 24717-24753: Block `runtime.gameflow.connection_by_type` (routine/gameflow) is a dead-code candidate. No external references found for any global label in this block. Labels: gameflow_get_connection_by_type.
- [patchable] `runtime.gameflow.confirm_input_direct` lines 24778-24789: Block `runtime.gameflow.confirm_input_direct` (routine/gameflow) is a dead-code candidate. No external references found for any global label in this block. Labels: gameflow_read_confirm_direct.
- [patchable] `runtime.screens.load_screen_stub` lines 28061-28066: Block `runtime.screens.load_screen_stub` (routine/screens) is a dead-code candidate. No external references found for any global label in this block. Labels: load_screen.
- [patchable] `runtime.sprites.show_sprite_legacy` lines 29902-29944: Block `runtime.sprites.show_sprite_legacy` (routine/sprites) is a dead-code candidate. No external references found for any global label in this block. Labels: show_sprite.
- [patchable] `runtime.sound.music_reset_noop` lines 30589-30592: Block `runtime.sound.music_reset_noop` (routine/sound) is a dead-code candidate. No external references found for any global label in this block. Labels: music_reset_channel_state.
- [patchable] `runtime.worlds.current_screen_helpers` lines 32727-32749: Block `runtime.worlds.current_screen_helpers` (routine/worlds) is a dead-code candidate. No external references found for any global label in this block. Labels: get_current_world_id, get_current_screen_index, set_current_screen.

## unused-screen-loaders

- Metrics: findings=2, patchable=2, removed_lines=128, removed_source_bytes=4953
- Routines: load_screen_new_dialog_screen_777377884059_far, runtime.screens.load_screen_new_dialog_screen_777377884059.loader

- [patchable] `load_screen_new_dialog_screen_777377884059_far` lines 13354-13371: `load_screen_new_dialog_screen_777377884059_far` is a generated screen loader (18 lines, 450 source bytes) with no external label references. Category reason: Generated screen loader routine. Project metadata maps it to scene `New Dialog Screen` (index=1, resources=8). GameFlow reachability marks this scene unreachable. Related annotated loader block `runtime.screens.load_screen_new_dialog_screen_777377884059.loader` is currently rooted by `load_screen_new_dialog_screen_777377884059`. Deletion is patchable only when GameFlow reachability proves the scene is unreachable.
- [patchable] `runtime.screens.load_screen_new_dialog_screen_777377884059.loader` lines 28195-28305: Annotated loader block `runtime.screens.load_screen_new_dialog_screen_777377884059.loader` only feeds `load_screen_new_dialog_screen_777377884059_far`, and GameFlow reachability marks the owning scene unreachable.

## inactive-feature-runtime

- Metrics: findings=41, patchable=3, removed_lines=30, removed_source_bytes=872
- Routines: call_init_sound_system_resident, call_music_execute_command_resident, call_music_play_track_resident, call_music_stop_resident, call_music_update_resident, call_sfx_update_resident, call_task_audio_tick_resident, init_sound_system, init_sound_system_far, music_execute_command, music_execute_command_far, music_init_system, music_play_track, music_play_track_far, music_reset_channel_state, music_silence_channels, music_stop, music_stop_far, music_update_far, runtime.sound.group.init, runtime.sound.group.music_execute_command, runtime.sound.group.music_execute_command:call_music_execute_command_resident, runtime.sound.group.music_execute_command:music_execute_command, runtime.sound.group.music_execute_command:music_execute_command_far, runtime.sound.group.music_play_track, runtime.sound.group.music_stop, runtime.sound.group.music_update, runtime.sound.group.sfx_update, runtime.sound.group.tick, sfx_beep, sfx_coin, sfx_damage, sfx_explosion, sfx_jump, sfx_play, sfx_shoot, sfx_silence_all, sfx_update, sfx_update_far, task_audio_tick, task_audio_tick_far

- [report-only] `runtime.sound.group.init` lines 13664-30124: `runtime.sound.group.init` groups inactive audio init runtime labels: call_init_sound_system_resident, init_sound_system, init_sound_system_far. Group deletion remains blocked by 1 external references: init_rom->call_init_sound_system_resident@9364.
- [report-only] `init_sound_system_far` lines 13664-13683: `init_sound_system_far` looks like audio runtime (20 lines, 524 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: boot_or_init (Boot/init routine). External references still exist (1): call_init_sound_system_resident@14247. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `runtime.sound.group.tick` lines 13684-30153: `runtime.sound.group.tick` groups inactive audio tick runtime labels: call_task_audio_tick_resident, task_audio_tick, task_audio_tick_far. Group deletion remains blocked by 3 external references: init_rom->call_task_audio_tick_resident@9385, gameflow_handle_end->call_task_audio_tick_resident@24562, gameflow_world_game_loop->call_task_audio_tick_resident@24806.
- [report-only] `task_audio_tick_far` lines 13684-13703: `task_audio_tick_far` looks like audio runtime (20 lines, 509 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Patch remains disabled because `task_audio_tick_far` is inside annotated block `runtime.far_trampoline.task_audio_tick_far`; group-level deletion must be handled by dead-blocks. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `runtime.sound.group.sfx_update` lines 13704-30568: `runtime.sound.group.sfx_update` groups inactive SFX update runtime labels: call_sfx_update_resident, sfx_update, sfx_update_far. Group deletion remains blocked by 1 external references: gameflow_world_game_loop->call_sfx_update_resident@24841.
- [report-only] `sfx_update_far` lines 13704-13723: `sfx_update_far` looks like audio runtime (20 lines, 486 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_sfx_update_resident@14276. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `runtime.sound.group.music_update` lines 13724-30615: `runtime.sound.group.music_update` groups inactive music update runtime labels: call_music_update_resident, music_update, music_update_far. Group deletion remains blocked by 2 external references: call_task_audio_tick_resident->call_music_update_resident@14260, task_audio_tick->call_music_update_resident@30131.
- [report-only] `music_update_far` lines 13724-13743: `music_update_far` looks like audio runtime (20 lines, 494 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_music_update_resident@14271. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `runtime.sound.group.music_stop` lines 13744-30612: `runtime.sound.group.music_stop` groups inactive music stop runtime labels: call_music_stop_resident, music_stop, music_stop_far. Group deletion remains blocked by 2 external references: music_execute_command->music_stop@30625, update_scroll->call_music_stop_resident@32557.
- [report-only] `music_stop_far` lines 13744-13763: `music_stop_far` looks like audio runtime (20 lines, 490 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_music_stop_resident@14281. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `runtime.sound.group.music_play_track` lines 13764-30619: `runtime.sound.group.music_play_track` groups inactive music play-track runtime labels: call_music_play_track_resident, music_play_track, music_play_track_far. Group deletion remains blocked by 1 external references: update_scroll->call_music_play_track_resident@32575.
- [report-only] `music_play_track_far` lines 13764-13785: `music_play_track_far` looks like audio runtime (22 lines, 562 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_music_play_track_resident@14286. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.music_execute_command:music_execute_command_far` lines 13785-13803: `music_execute_command_far` is part of inactive runtime group `runtime.sound.group.music_execute_command`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.sound.group.music_execute_command` lines 13786-30627: `runtime.sound.group.music_execute_command` groups inactive music command runtime labels: call_music_execute_command_resident, music_execute_command, music_execute_command_far. No external references outside the group were found. This is ready for a future atomic multi-window patch, or for dead-blocks to remove the annotated windows as whole groups. Atomic patch enabled as `runtime.sound.group.music_execute_command` with 3 window(s).
- [report-only] `music_execute_command_far` lines 13786-13807: `music_execute_command_far` looks like audio runtime (22 lines, 510 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_music_execute_command_resident@14291. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_init_sound_system_resident` lines 14246-14250: `call_init_sound_system_resident` looks like audio runtime (5 lines, 185 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): init_rom@9364. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_task_audio_tick_resident` lines 14251-14269: `call_task_audio_tick_resident` looks like audio runtime (19 lines, 615 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (3): init_rom@9385, gameflow_handle_end@24562, gameflow_world_game_loop@24806. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_music_update_resident` lines 14270-14274: `call_music_update_resident` looks like audio runtime (5 lines, 189 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (2): call_task_audio_tick_resident@14260, task_audio_tick@30131. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_sfx_update_resident` lines 14275-14279: `call_sfx_update_resident` looks like audio runtime (5 lines, 183 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): gameflow_world_game_loop@24841. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_music_stop_resident` lines 14280-14284: `call_music_stop_resident` looks like audio runtime (5 lines, 189 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): update_scroll@32557. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_music_play_track_resident` lines 14285-14289: `call_music_play_track_resident` looks like audio runtime (5 lines, 212 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): update_scroll@32575. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.music_execute_command:call_music_execute_command_resident` lines 14289-14292: `call_music_execute_command_resident` is part of inactive runtime group `runtime.sound.group.music_execute_command`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_music_execute_command_resident` lines 14290-14293: `call_music_execute_command_resident` looks like audio runtime (4 lines, 138 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Patch remains disabled because `call_music_execute_command_resident` is inside annotated block `runtime.sound.resident.music_execute_command`; group-level deletion must be handled by dead-blocks. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `init_sound_system` lines 30097-30124: `init_sound_system` looks like audio runtime (28 lines, 1006 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: boot_or_init (Boot/init routine). External references still exist (1): init_sound_system_far@13671. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `task_audio_tick` lines 30125-30153: `task_audio_tick` looks like audio runtime (29 lines, 836 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: shared_runtime (Shared low-level runtime helper). External references still exist (1): task_audio_tick_far@13691. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_silence_all` lines 30272-30297: `sfx_silence_all` looks like audio runtime (26 lines, 757 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (2): init_sound_system@30114, sfx_update@30555. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_beep` lines 30298-30318: `sfx_beep` looks like audio runtime (21 lines, 492 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_beep@30460. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_jump` lines 30319-30340: `sfx_jump` looks like audio runtime (22 lines, 473 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_jump@30466. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_shoot` lines 30341-30365: `sfx_shoot` looks like audio runtime (25 lines, 565 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_shoot@30472. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_explosion` lines 30366-30385: `sfx_explosion` looks like audio runtime (20 lines, 497 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_explosion@30478. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_coin` lines 30386-30407: `sfx_coin` looks like audio runtime (22 lines, 536 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_coin@30484. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_damage` lines 30408-30441: `sfx_damage` looks like audio runtime (34 lines, 1140 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_damage@30490. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_play` lines 30501-30529: `sfx_play` looks like audio runtime (29 lines, 600 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (6): play_sound_effect_beep@30462, play_sound_effect_jump@30468, play_sound_effect_shoot@30474, play_sound_effect_explosion@30480, play_sound_effect_coin@30486, ... (+1 more). Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_update` lines 30530-30568: `sfx_update` looks like audio runtime (39 lines, 1016 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): sfx_update_far@13711. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `music_init_system` lines 30569-30589: `music_init_system` looks like audio runtime (21 lines, 566 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (2): init_sound_system@30111, music_stop@30609. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `music_reset_channel_state` lines 30590-30593: `music_reset_channel_state` looks like audio runtime (4 lines, 89 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Patch remains disabled because `music_reset_channel_state` is inside annotated block `runtime.sound.music_reset_noop`; group-level deletion must be handled by dead-blocks. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `music_silence_channels` lines 30594-30607: `music_silence_channels` looks like audio runtime (14 lines, 212 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): music_stop@30610. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `music_stop` lines 30608-30612: `music_stop` looks like audio runtime (5 lines, 80 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (2): music_stop_far@13751, music_execute_command@30625. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `music_play_track` lines 30617-30619: `music_play_track` looks like audio runtime (3 lines, 27 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): music_play_track_far@13772. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.music_execute_command:music_execute_command` lines 30620-30626: `music_execute_command` is part of inactive runtime group `runtime.sound.group.music_execute_command`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `music_execute_command` lines 30620-30627: `music_execute_command` looks like audio runtime (8 lines, 98 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): music_execute_command_far@13793. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.

## Optimization Passes

- Pass 1: findings=60, patchable=21, removed=397 lines / 12514 bytes, lines=32972->32575
- Pass 2: findings=33, patchable=0, removed=0 lines / 0 bytes, lines=32575->32575

