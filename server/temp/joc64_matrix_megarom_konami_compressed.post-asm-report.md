# Post-ASM Report

- Input: `C:\Users\salam\Documents\Programacion\Mideas\server\temp\joc64_matrix_megarom_konami_compressed.asm`
- Findings: 13
- Applied patches: 0
- Original lines: 39059
- Output lines: 39059
- Net line delta: 0

## Mideas Block Inventory

- Blocks: 108
- Preserved blocks: 25
- Removable-by-policy blocks: 83
- Dead-block candidates: 22
- Annotated block source: 19225 lines / 529167 bytes
- Dead-candidate source: 258 lines / 8151 bytes
- Marker errors: 2

- By kind: data=1, routine=96, trampoline=11
- By owner: animtiles=1, bosses=15, components=32, dialogues=1, entities=3, far-call=11, font=1, gameflow=7, hud=1, interrupt=5, mapper=1, resources=1, screens=7, scroll=1, sound=15, sprites=1, stateMachine=2, unified=1, worlds=2
- By status: candidate_unreferenced=22, empty=1, preserved=25, referenced=14, rooted=46

### Largest Annotated Blocks

| ID | Status | Source | Kind | Owner |
| --- | --- | --- | --- | --- |
| `runtime.gameflow.world_loop` | `rooted` | 2347l/70365b | `routine` | `gameflow` |
| `runtime.statemachine.core` | `rooted` | 2312l/61657b | `routine` | `stateMachine` |
| `runtime.components.scheduler` | `rooted` | 2197l/49443b | `routine` | `components` |
| `runtime.components.wallcollision` | `referenced` | 839l/31288b | `routine` | `components` |
| `runtime.boss.core` | `rooted` | 884l/19970b | `routine` | `bosses` |
| `runtime.components.collision` | `referenced` | 668l/18861b | `routine` | `components` |
| `runtime.resources.manager` | `rooted` | 697l/18133b | `routine` | `resources` |
| `runtime.components.tile_interaction` | `rooted` | 641l/15812b | `routine` | `components` |
| `runtime.hud.core` | `rooted` | 602l/14282b | `routine` | `hud` |
| `runtime.components.input` | `referenced` | 393l/13136b | `routine` | `components` |
| `data.statemachine.statemachine_1776707734563` | `rooted` | 356l/12906b | `data` | `stateMachine` |
| `runtime.animtiles.core` | `rooted` | 441l/12686b | `routine` | `animtiles` |
| `runtime.components.animation` | `referenced` | 342l/10555b | `routine` | `components` |
| `runtime.components.sprite` | `rooted` | 396l/10316b | `routine` | `components` |
| `runtime.boss.attacks` | `rooted` | 441l/9010b | `routine` | `bosses` |
| `runtime.scroll.core` | `rooted` | 344l/8639b | `routine` | `scroll` |
| `runtime.interrupt.task_input` | `rooted` | 272l/7149b | `routine` | `interrupt` |
| `runtime.components.jump` | `referenced` | 233l/7043b | `routine` | `components` |
| `runtime.font.loading` | `rooted` | 223l/6725b | `routine` | `font` |
| `runtime.components.entity_management` | `rooted` | 221l/6549b | `routine` | `components` |

- Marker error: Line 30589: @mideas:endblock without open block.
- Marker error: Line 36713: @mideas:block id=runtime.gameflow.world_loop has no closing @mideas:endblock.

## Global Label Inventory

- Global labels: 983

| Label | Category | Source |
| --- | --- | --- |
| `FAST_SNSMAT` | `bios_helper` | 1183l/72003b |
| `update_wallcollision_component` | `runtime_code` | 538l/20410b |
| `Action_ChangeSprite` | `runtime_code` | 329l/14785b |
| `update_player_fastpath` | `runtime_code` | 604l/13839b |
| `execute_transition_effect` | `runtime_code` | 398l/11680b |
| `update_entity_collision_fast` | `runtime_code` | 345l/9814b |
| `scan_tile_interaction_entities` | `runtime_code` | 355l/9254b |
| `update_animation_component` | `runtime_code` | 255l/8328b |
| `BANK_0_USED_END` | `bank_marker` | 141l/7678b |
| `BANK_2_USED_END` | `bank_marker` | 134l/7591b |
| `vdpLoop` | `bios_helper` | 192l/6712b |
| `task_update_input` | `shared_runtime` | 242l/6074b |
| `resource_table` | `data` | 373l/5733b |
| `init_player_1` | `boot_or_init` | 207l/5606b |
| `FAR_BANK_17_ROM_START` | `bank_marker` | 112l/5594b |
| `execute_transition_reveal_target` | `runtime_code` | 265l/4788b |
| `jump_update_loop` | `runtime_code` | 157l/4675b |
| `render_hud` | `runtime_code` | 164l/4492b |
| `rebuild_used_entity_list` | `runtime_code` | 207l/4475b |
| `update_boss_system` | `runtime_code` | 140l/4456b |
| `interrupt_dispatcher` | `shared_runtime` | 122l/4176b |
| `mapper_call_hl_auto` | `shared_runtime` | 105l/4157b |
| `init_fakeplayer_1` | `boot_or_init` | 147l/3895b |
| `Condition_VariableCompare` | `runtime_code` | 186l/3892b |
| `wall_build_hitbox_cache` | `runtime_code` | 121l/3875b |
| `boss_projectile_select_velocity` | `runtime_code` | 195l/3683b |
| `Action_SetVariable` | `runtime_code` | 150l/3656b |
| `load_sprite_patterns_worldmap_1776512078647` | `data` | 90l/3606b |
| `Action_IncVariable` | `runtime_code` | 136l/3515b |
| `init_char0_color` | `boot_or_init` | 127l/3471b |

### Largest Unannotated Global Labels

- Unannotated labels: 359

| Category | Labels | Source |
| --- | ---: | ---: |
| `bank_marker` | 15 | 581l/27313b |
| `bios_helper` | 9 | 1808l/90795b |
| `boot_or_init` | 27 | 864l/22852b |
| `data` | 153 | 1796l/61843b |
| `far_trampoline` | 76 | 1400l/30608b |
| `runtime_code` | 74 | 2579l/70158b |
| `screen_loader` | 2 | 50l/1253b |
| `shared_runtime` | 2 | 31l/1113b |
| `unknown` | 1 | 5l/65b |

| Label | Category | Source |
| --- | --- | --- |
| `FAST_SNSMAT` | `bios_helper` | 1183l/72003b |
| `execute_transition_effect` | `runtime_code` | 398l/11680b |
| `BANK_0_USED_END` | `bank_marker` | 141l/7678b |
| `BANK_2_USED_END` | `bank_marker` | 134l/7591b |
| `vdpLoop` | `bios_helper` | 192l/6712b |
| `resource_table` | `data` | 373l/5733b |
| `execute_transition_reveal_target` | `runtime_code` | 265l/4788b |
| `load_sprite_patterns_worldmap_1776512078647` | `data` | 90l/3606b |
| `init_char0_color` | `boot_or_init` | 127l/3471b |
| `gameflow_world_game_loop` | `runtime_code` | 94l/3319b |
| `FAR_BANK_10_ROM_START` | `bank_marker` | 79l/3184b |
| `tilebank_pattern_data_0` | `data` | 47l/3154b |
| `tilebank_pattern_data_1` | `data` | 47l/3146b |
| `init_entities` | `boot_or_init` | 137l/3101b |
| `gameflow_handle_transition` | `runtime_code` | 66l/3068b |
| `FAST_LDIRVM` | `bios_helper` | 80l/2624b |
| `restart_rom_continue` | `boot_or_init` | 80l/2346b |
| `init_interrupt_system` | `boot_or_init` | 65l/2143b |
| `init_sprites` | `boot_or_init` | 71l/1898b |
| `FAST_WRTVRM` | `bios_helper` | 70l/1868b |
| `FAST_FILLVRM` | `bios_helper` | 83l/1833b |
| `SPRITE_2_PATTERN` | `data` | 49l/1827b |
| `FAST_WRTVDP` | `bios_helper` | 59l/1764b |
| `tile_color_bank0` | `data` | 27l/1732b |
| `tilebank_color_data_0` | `data` | 26l/1657b |
| `tilebank_color_data_1` | `data` | 26l/1653b |
| `trans_wait_frames` | `runtime_code` | 45l/1499b |
| `FAST_RDVRM` | `bios_helper` | 53l/1498b |
| `init_all_global_variables` | `boot_or_init` | 39l/1416b |
| `joystick_direction_table` | `data` | 54l/1407b |

| ID | Kind | Owner | Status | Incoming | Source | Lines | Labels |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `runtime.mapper.core` | `routine` | `mapper` | `rooted` | 199 | 213l/5412b | 13930-14142 | mapper_runtime_init, mapper_set_bank_p1, mapper_set_bank_p2, mapper_set_bank_p3, mapper_set_bank_p4, ... (+14) |
| `runtime.resources.manager` | `routine` | `resources` | `rooted` | 54 | 697l/18133b | 14649-15345 | resource_manager_init, resource_invalidate_pattern_vram_cache, resource_invalidate_color_vram_cache, resource_invalidate_font_vram_cache, resource_invalidate_gameplay_vram_cache, ... (+14) |
| `runtime.components.input_trigger_level` | `routine` | `components` | `candidate_unreferenced` | 0 | 33l/773b | 15427-15459 | component_trigger_level_pressed_a |
| `runtime.page0.stubs` | `routine` | `unified` | `rooted` | 1 | 22l/505b | 15466-15487 | init_page0_runtime_state, page0_map_expanded_slot, page0_map_game_rom, page0_restore_bios_rom, page0_copy_chunk_to_buffer, ... (+2) |
| `runtime.interrupt.stop` | `routine` | `interrupt` | `rooted` | 0 | 43l/1299b | 15568-15610 | stop_interrupt_system |
| `runtime.interrupt.dispatcher` | `routine` | `interrupt` | `preserved` | 1 | 124l/4150b | 15612-15735 | interrupt_dispatcher |
| `runtime.interrupt.vblank_flag` | `routine` | `interrupt` | `rooted` | 1 | 35l/983b | 15748-15782 | update_vblank_flag |
| `runtime.interrupt.task_api` | `routine` | `interrupt` | `rooted` | 1 | 121l/3195b | 15787-15907 | enable_task, disable_task, get_frame_count |
| `runtime.interrupt.task_input` | `routine` | `interrupt` | `rooted` | 2 | 272l/7149b | 15911-16182 | init_default_tasks_from_plan, task_update_input |
| `runtime.far_trampoline.init_boss_system_far` | `trampoline` | `far-call` | `preserved` | 2 | 26l/702b | 16290-16315 | init_boss_system_far |
| `runtime.far_trampoline.init_screen_boss_from_current_screen_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/842b | 16317-16342 | init_screen_boss_from_current_screen_far |
| `runtime.far_trampoline.update_boss_system_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/716b | 16344-16369 | update_boss_system_far |
| `runtime.far_trampoline.init_sound_system_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/710b | 16667-16692 | init_sound_system_far |
| `runtime.far_trampoline.task_audio_tick_far` | `trampoline` | `far-call` | `preserved` | 0 | 26l/696b | 16694-16719 | task_audio_tick_far |
| `runtime.far_trampoline.sfx_update_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/661b | 16721-16746 | sfx_update_far |
| `runtime.far_trampoline.music_update_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/675b | 16748-16773 | music_update_far |
| `runtime.far_trampoline.music_stop_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/661b | 16775-16800 | music_stop_far |
| `runtime.far_trampoline.music_play_track_far` | `trampoline` | `far-call` | `preserved` | 1 | 28l/740b | 16802-16829 | music_play_track_far |
| `runtime.far_trampoline.music_execute_command_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/738b | 16831-16856 | music_execute_command_far |
| `runtime.far_trampoline.draw_boss_attack_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/703b | 17422-17447 | draw_boss_attack_far |
| `runtime.sound.resident.init` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/184b | 18087-18090 | call_init_sound_system_resident |
| `runtime.sound.resident.tick` | `routine` | `sound` | `candidate_unreferenced` | 0 | 18l/606b | 18092-18109 | call_task_audio_tick_resident |
| `runtime.sound.resident.music_update` | `routine` | `sound` | `referenced` | 2 | 4l/190b | 18111-18114 | call_music_update_resident |
| `runtime.sound.resident.sfx_update` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/182b | 18116-18119 | call_sfx_update_resident |
| `runtime.sound.resident.music_stop` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/182b | 18121-18124 | call_music_stop_resident |
| `runtime.sound.resident.music_play_track` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/206b | 18126-18129 | call_music_play_track_resident |
| `runtime.sound.resident.music_execute_command` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/226b | 18131-18134 | call_music_execute_command_resident |
| `runtime.boss.resident.init` | `routine` | `bosses` | `preserved` | 0 | 4l/232b | 18248-18251 | call_init_boss_system_resident |
| `runtime.boss.resident.init_screen` | `routine` | `bosses` | `preserved` | 1 | 4l/306b | 18253-18256 | call_init_screen_boss_from_current_screen_resident |
| `runtime.boss.resident.update` | `routine` | `bosses` | `preserved` | 1 | 4l/242b | 18258-18261 | call_update_boss_system_resident |
| `runtime.boss.resident.update_projectile` | `routine` | `bosses` | `preserved` | 1 | 4l/300b | 18263-18266 | call_update_boss_projectile_runtime_resident |
| `runtime.boss.resident.draw_attack` | `routine` | `bosses` | `preserved` | 1 | 4l/246b | 18268-18271 | call_draw_boss_attack_resident |
| `runtime.boss.resident.draw_meteor` | `routine` | `bosses` | `preserved` | 0 | 4l/267b | 18273-18276 | call_draw_boss_meteor_attack_resident |
| `runtime.boss.resident.draw_bomb` | `routine` | `bosses` | `preserved` | 0 | 4l/257b | 18278-18281 | call_draw_boss_bomb_attack_resident |
| `runtime.boss.resident.draw_boomerang` | `routine` | `bosses` | `preserved` | 0 | 4l/282b | 18283-18286 | call_draw_boss_boomerang_attack_resident |
| `runtime.boss.resident.draw_rock` | `routine` | `bosses` | `preserved` | 0 | 4l/257b | 18288-18291 | call_draw_boss_rock_attack_resident |
| `runtime.boss.resident.draw_laser` | `routine` | `bosses` | `preserved` | 0 | 4l/262b | 18293-18296 | call_draw_boss_laser_attack_resident |
| `runtime.boss.resident.draw_sine_wave` | `routine` | `bosses` | `preserved` | 0 | 4l/282b | 18298-18301 | call_draw_boss_sine_wave_attack_resident |
| `runtime.boss.resident.draw_homing_missile` | `routine` | `bosses` | `preserved` | 0 | 4l/307b | 18303-18306 | call_draw_boss_homing_missile_attack_resident |
| `runtime.components.init` | `routine` | `components` | `rooted` | 11 | 84l/2909b | 18575-18658 | component_fill_32_a, init_components |
| `runtime.components.position` | `routine` | `components` | `rooted` | 3 | 108l/3281b | 18660-18767 | init_position_system, update_position_component, position_update_loop, position_next_entity |
| `runtime.components.sprite` | `routine` | `components` | `rooted` | 6 | 396l/10316b | 18768-19163 | init_sprite_system, update_sprite_component, sprite_update_loop, sprite_layer_loop, sprite_continue, ... (+6) |
| `runtime.components.movement_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 19169-19172 | update_movement_component |
| `runtime.components.collision` | `routine` | `components` | `referenced` | 2 | 668l/18861b | 19173-19840 | init_collision_system, update_collision_component, collision_update_loop, collision_next_entity, update_entity_collision_fast, ... (+13) |
| `runtime.components.behavior_tile` | `routine` | `components` | `rooted` | 9 | 110l/3809b | 19841-19950 | get_behavior_tile, get_behavior_tile_nb, gbt_oob |
| `runtime.components.directional_sprite_sync` | `routine` | `components` | `rooted` | 3 | 87l/2084b | 19951-20037 | component_sync_directional_sprite_from_initial, component_sync_directional_sprite_from_current, component_sync_directional_sprite_common |
| `runtime.components.input` | `routine` | `components` | `referenced` | 2 | 393l/13136b | 20038-20430 | init_input_system, update_input_component, input_update_loop, input_move_up, input_move_down, ... (+16) |
| `runtime.components.health` | `routine` | `components` | `rooted` | 3 | 152l/4701b | 20468-20619 | init_health_system, update_health_component, decrease_entity_lives, increase_entity_lives |
| `runtime.components.animation` | `routine` | `components` | `referenced` | 4 | 342l/10555b | 20620-20961 | init_animation_system, update_animation_component, anim_done_entity, refresh_player_animation_fastpath |
| `runtime.components.jump` | `routine` | `components` | `referenced` | 2 | 233l/7043b | 20962-21194 | init_jump_system, update_jump_component, jump_update_loop, jump_done_entity, jump_next_entity |
| `runtime.components.gravity` | `routine` | `components` | `rooted` | 2 | 137l/4553b | 21195-21331 | init_gravity_system, update_gravity_component, gravity_update_loop, gravity_store_vel, gravity_grounded, ... (+2) |
| `runtime.components.walljump_stub` | `routine` | `components` | `referenced` | 2 | 18l/326b | 21352-21369 | init_walljump_system, update_walljump_component, walljump_process_entity_c, walljump_input_is_left, walljump_input_is_right |
| `runtime.components.auto_destroy_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/219b | 21372-21378 | init_auto_destroy_system, update_auto_destroy_component |
| `runtime.components.state_machine_component_stub` | `routine` | `components` | `referenced` | 1 | 7l/241b | 21402-21408 | init_statemachine_system, update_statemachine_component |
| `runtime.components.retractable_gate_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/196b | 21414-21417 | update_retractable_gate_component |
| `runtime.components.carry` | `routine` | `components` | `rooted` | 1 | 81l/2148b | 21418-21498 | init_carry_system, update_carry_component |
| `runtime.components.damage_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/166b | 21506-21509 | update_damage_component |
| `runtime.components.shoot_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/163b | 21515-21518 | update_shoot_component |
| `runtime.components.platform_riding_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/220b | 21538-21544 | prepare_platform_detection, update_platform_riding |
| `runtime.components.wallcollision` | `routine` | `components` | `referenced` | 3 | 839l/31288b | 21545-22383 | init_wallcollision_system, wall_behavior_is_full_blocker, wall_down_behavior_blocks, update_wallcollision_component, wall_build_hitbox_cache, ... (+2) |
| `runtime.components.deadly_tiles` | `routine` | `components` | `rooted` | 3 | 262l/5874b | 22384-22645 | init_deadly_tiles_system, deadly_tiles_runtime_tile_is_deadly_nb, update_entity_deadly_flag_runtime, update_deadly_tiles_component, refresh_player_deadly_fastpath |
| `runtime.components.in_water_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 22651-22654 | update_in_water_component |
| `runtime.components.collectible_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/181b | 22660-22663 | update_collectible_component |
| `runtime.components.tile_interaction` | `routine` | `components` | `rooted` | 4 | 641l/15812b | 22664-23304 | interaction_target_variable_ptr_table, interaction_target_variable_word_table, init_tile_interaction_system, update_slash_component, record_bonus_respawn_slot, ... (+11) |
| `runtime.components.collected_tiles` | `routine` | `components` | `rooted` | 1 | 76l/3015b | 23305-23380 | apply_collected_tiles |
| `runtime.components.entity_management` | `routine` | `components` | `rooted` | 3 | 221l/6549b | 23381-23601 | create_entity, entity_job_set, entity_job_set_period_ok, entity_job_set_entry_wrap, entity_job_set_entry_ok, ... (+13) |
| `runtime.components.scheduler` | `routine` | `components` | `rooted` | 7 | 2197l/49443b | 23602-25798 | update_all_entities, mark_used_entity_list_dirty, ensure_used_entity_list_current, rebuild_used_entity_list, ensure_player_fast_runtime_bound, ... (+86) |
| `runtime.dialogue.system` | `routine` | `dialogues` | `preserved` | 5 | 16l/393b | 25162-25177 | dialogue_update_typewriter, dialogue_open_box, dialogue_start_line, dialogue_clear_box, dialogue_close_box |
| `runtime.components.state_machine_executor` | `routine` | `components` | `rooted` | 2 | 74l/1973b | 25804-25877 | execute_all_state_machines, refresh_player_state_machine_fastpath |
| `runtime.components.legacy_tile_collision` | `routine` | `components` | `candidate_unreferenced` | 0 | 43l/1404b | 25887-25929 | get_tile_at_position, get_tile_behavior, tile_behavior_table, check_collision_at_point, check_collision_box, ... (+1) |
| `runtime.components.secret_zone_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/181b | 25966-25969 | update_secret_zone_component |
| `runtime.statemachine.core` | `routine` | `stateMachine` | `rooted` | 4 | 2312l/61657b | 25977-28288 | SM_Update, sm_timer_no_overflow, sm_timer_paused, sm_update_done, SM_ShouldPauseTimerForDialogue, ... (+37) |
| `data.statemachine.statemachine_1776707734563` | `data` | `stateMachine` | `rooted` | 1 | 356l/12906b | 28373-28728 | SM_New_Statemachine_state_1776707744092, SM_New_Statemachine_state_1776707744092_Transitions, SM_New_Statemachine_state_1776707744092_Transitions_Actions_0, SM_New_Statemachine_state_1776707744092_Transitions_Actions_1, SM_New_Statemachine_state_1776707744092_Transitions_Actions_2, ... (+33) |
| `runtime.gameflow.worldlink` | `routine` | `gameflow` | `rooted` | 1 | 92l/2650b | 28852-28943 | gameflow_handle_worldlink |
| `runtime.gameflow.end_screen` | `routine` | `gameflow` | `rooted` | 5 | 85l/2528b | 28945-29029 | gameflow_handle_end, print_string_vram |
| `runtime.gameflow.connection_by_type` | `routine` | `gameflow` | `empty` | 0 | 3l/216b | 30483-30485 |  |
| `runtime.gameflow.screen_timer` | `routine` | `gameflow` | `rooted` | 1 | 144l/3220b | 30596-30739 | get_world_screen_timer_frames_per_second, reload_world_screen_timer_frames, snapshot_world_screen_timer_interrupt_counter, reset_world_screen_timer, update_world_screen_timer |
| `data.entities.player_1.init` | `routine` | `entities` | `rooted` | 1 | 207l/5700b | 31730-31936 | init_player_1 |
| `data.entities.fakeplayer_1.init` | `routine` | `entities` | `rooted` | 1 | 147l/3997b | 31955-32101 | init_fakeplayer_1 |
| `runtime.entities.patrol_facing` | `routine` | `entities` | `rooted` | 0 | 88l/2125b | 32268-32355 | update_entity_patrol_facing |
| `runtime.boss.entry` | `routine` | `bosses` | `rooted` | 2 | 80l/1972b | 32488-32567 | init_boss_system, update_boss_system |
| `runtime.boss.core` | `routine` | `bosses` | `rooted` | 7 | 884l/19970b | 32569-33452 | init_screen_boss_from_current_screen, boss_push_data_bank, boss_pop_data_bank, boss_resolve_initial_phase, boss_init_behavior_state, ... (+15) |
| `runtime.screens.colors` | `routine` | `screens` | `rooted` | 1 | 44l/1514b | 33484-33527 | color_shift_table, set_screen_colors |
| `runtime.screens.copy_rect` | `routine` | `screens` | `rooted` | 0 | 77l/1494b | 33656-33732 | copy_layout_rect_to_vram, copy_layout_rect_ram_to_ram |
| `runtime.screens.block_layout_expander` | `routine` | `screens` | `rooted` | 1 | 194l/3798b | 33734-33927 | expand_screen_block_layout_to_background, expand_screen_block_layout_2x2, expand_screen_block_layout_4x4 |
| `runtime.screens.behavior_map_rebuild` | `routine` | `screens` | `candidate_unreferenced` | 0 | 26l/709b | 33945-33970 | build_runtime_behavior_map_from_screen_layout |
| `runtime.screens.load_screen_stub` | `routine` | `screens` | `candidate_unreferenced` | 0 | 6l/232b | 33971-33976 | load_screen |
| `runtime.screens.load_screen_pan1_776511902784.loader` | `routine` | `screens` | `rooted` | 1 | 134l/5163b | 33978-34111 | load_screen_pan1_776511902784, load_screen_pan1_776511902784_skip_vram_copy, load_pan1_776511902784_boss_done |
| `runtime.screens.load_screen_new_dialog_screen_777377884059.loader` | `routine` | `screens` | `rooted` | 1 | 117l/4779b | 34113-34229 | load_screen_new_dialog_screen_777377884059, load_screen_new_dialog_screen_777377884059_skip_vram_copy, load_new_dialog_screen_777377884059_boss_done |
| `runtime.sprites.show_sprite_legacy` | `routine` | `sprites` | `candidate_unreferenced` | 0 | 43l/981b | 34777-34819 | show_sprite |
| `runtime.sound.init` | `routine` | `sound` | `rooted` | 1 | 22l/725b | 34971-34992 | init_sound_system |
| `runtime.sound.tick` | `routine` | `sound` | `rooted` | 1 | 17l/320b | 34999-35015 | task_audio_tick |
| `runtime.sound.psg_lowlevel` | `routine` | `sound` | `rooted` | 27 | 117l/3450b | 35020-35136 | psg_write, psg_set_tone, psg_set_volume, psg_set_noise, psg_set_mixer, ... (+1) |
| `runtime.sound.sfx_silence` | `routine` | `sound` | `referenced` | 2 | 21l/579b | 35146-35166 | sfx_silence_all |
| `runtime.sound.sfx_builtin_effects` | `routine` | `sound` | `referenced` | 6 | 127l/3025b | 35172-35298 | sfx_beep, sfx_jump, sfx_shoot, sfx_explosion, sfx_coin, ... (+1) |
| `runtime.sound.sfx_playback` | `routine` | `sound` | `referenced` | 1 | 119l/2384b | 35316-35434 | play_sound_effect, play_sound_effect_beep, play_sound_effect_jump, play_sound_effect_shoot, play_sound_effect_explosion, ... (+4) |
| `runtime.sound.music_noop_runtime` | `routine` | `sound` | `referenced` | 5 | 66l/1337b | 35443-35508 | music_init_system, music_reset_channel_state, music_silence_channels, music_stop, music_mute, ... (+7) |
| `runtime.sound.music_reset_noop` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/163b | 35464-35467 | music_reset_channel_state |
| `runtime.hud.core` | `routine` | `hud` | `rooted` | 3 | 602l/14282b | 35532-36133 | hud_element_data, hud_text_0, hud_text_1, hud_text_2, hud_text_3, ... (+10) |
| `runtime.gameflow.clear_screen_area_helpers` | `routine` | `gameflow` | `referenced` | 1 | 60l/1737b | 36161-36220 | clear_screen_area, clear_screen_row, empty_row_data |
| ... | ... | ... | ... | ... | ... | ... | +8 more blocks |

## Dead-Block Candidates

- `runtime.components.legacy_tile_collision`: 43 lines / 1404 bytes. No external references found for any global label in this block.
- `runtime.sprites.show_sprite_legacy`: 43 lines / 981 bytes. No external references found for any global label in this block.
- `runtime.components.input_trigger_level`: 33 lines / 773 bytes. No external references found for any global label in this block.
- `runtime.screens.behavior_map_rebuild`: 26 lines / 709 bytes. No external references found for any global label in this block.
- `runtime.worlds.current_screen_helpers`: 23 lines / 633 bytes. No external references found for any global label in this block.
- `runtime.sound.resident.tick`: 18 lines / 606 bytes. No external references found for any global label in this block.
- `runtime.screens.load_screen_stub`: 6 lines / 232 bytes. No external references found for any global label in this block.
- `runtime.sound.resident.music_execute_command`: 4 lines / 226 bytes. No external references found for any global label in this block.
- `runtime.components.platform_riding_stub`: 7 lines / 220 bytes. No external references found for any global label in this block.
- `runtime.components.auto_destroy_stub`: 7 lines / 219 bytes. No external references found for any global label in this block.
- `runtime.sound.resident.music_play_track`: 4 lines / 206 bytes. No external references found for any global label in this block.
- `runtime.components.retractable_gate_stub`: 4 lines / 196 bytes. No external references found for any global label in this block.
- `runtime.sound.resident.init`: 4 lines / 184 bytes. No external references found for any global label in this block.
- `runtime.sound.resident.sfx_update`: 4 lines / 182 bytes. No external references found for any global label in this block.
- `runtime.sound.resident.music_stop`: 4 lines / 182 bytes. No external references found for any global label in this block.
- `runtime.components.secret_zone_stub`: 4 lines / 181 bytes. No external references found for any global label in this block.
- `runtime.components.collectible_stub`: 4 lines / 181 bytes. No external references found for any global label in this block.
- `runtime.components.movement_stub`: 4 lines / 172 bytes. No external references found for any global label in this block.
- `runtime.components.in_water_stub`: 4 lines / 172 bytes. No external references found for any global label in this block.
- `runtime.components.damage_stub`: 4 lines / 166 bytes. No external references found for any global label in this block.
- `runtime.sound.music_reset_noop`: 4 lines / 163 bytes. No external references found for any global label in this block.
- `runtime.components.shoot_stub`: 4 lines / 163 bytes. No external references found for any global label in this block.

## state-machine-dispatch-handlers

- Metrics: findings=13, patchable=0, removed_lines=0, removed_source_bytes=0
- Routines: Action_ChangeSprite, Action_IncVariable, Action_Nop, Action_RegenerateHud, Action_ReplaceTile, Action_SetVariable, Condition_And, Condition_AnimComplete, Condition_DeadlyTile, Condition_KeyPressed, Condition_KeyReleased, Condition_Nop, Condition_VariableCompare

- [report-only] `Action_Nop` lines 26470-26480: `Action_Nop` is a state-machine action handler referenced by `SM_ActionTable` (39 table reference(s): SM_ActionTable@26421: `DW Action_Nop; 0`, SM_ActionTable@26422: `DW Action_Nop ; 1 [Action_SetPosition stripped]`, SM_ActionTable@26423: `DW Action_Nop ; 2 [Action_MoveBy stripped]`). Direct external references: none. Dispatch id 0 is not listed in `project_usage.stateMachineRuntime.usedActionIds`; this is only an unused-by-metadata signal. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Action_ChangeSprite` lines 26546-26874: `Action_ChangeSprite` is a state-machine action handler referenced by `SM_ActionTable` (1 table reference(s): SM_ActionTable@26426: `DW Action_ChangeSprite; 5`). Direct external references: none. Dispatch id 5 is listed in `project_usage.stateMachineRuntime.usedActionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Action_SetVariable` lines 26875-27024: `Action_SetVariable` is a state-machine action handler referenced by `SM_ActionTable` (1 table reference(s): SM_ActionTable@26434: `DW Action_SetVariable; 13`). Direct external references: none. Dispatch id 13 is listed in `project_usage.stateMachineRuntime.usedActionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Action_IncVariable` lines 27025-27160: `Action_IncVariable` is a state-machine action handler referenced by `SM_ActionTable` (1 table reference(s): SM_ActionTable@26435: `DW Action_IncVariable; 14`). Direct external references: none. Dispatch id 14 is listed in `project_usage.stateMachineRuntime.usedActionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Action_RegenerateHud` lines 27161-27169: `Action_RegenerateHud` is a state-machine action handler referenced by `SM_ActionTable` (1 table reference(s): SM_ActionTable@26444: `DW Action_RegenerateHud; 23`). Direct external references: none. Dispatch id 23 is listed in `project_usage.stateMachineRuntime.usedActionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Action_ReplaceTile` lines 27170-27190: `Action_ReplaceTile` is a state-machine action handler referenced by `SM_ActionTable` (1 table reference(s): SM_ActionTable@26449: `DW Action_ReplaceTile; 28`). Direct external references: none. Dispatch id 28 is listed in `project_usage.stateMachineRuntime.usedActionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Condition_Nop` lines 27831-27834: `Condition_Nop` is a state-machine condition handler referenced by `SM_ConditionTable` (12 table reference(s): SM_ConditionTable@27808: `DW Condition_Nop            ; 0`, SM_ConditionTable@27810: `DW Condition_Nop ; 2 [Condition_Or stripped]`, SM_ConditionTable@27811: `DW Condition_Nop ; 3 [Condition_Not stripped]`). Direct external references: none. Dispatch id 0 is not listed in `project_usage.stateMachineRuntime.usedConditionIds`; this is only an unused-by-metadata signal. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Condition_And` lines 27835-27873: `Condition_And` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@27809: `DW Condition_And            ; 1`). Direct external references: none. Dispatch id 1 is listed in `project_usage.stateMachineRuntime.usedConditionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Condition_KeyPressed` lines 27983-28026: `Condition_KeyPressed` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@27812: `DW Condition_KeyPressed     ; 4`). Direct external references: none. Dispatch id 4 is listed in `project_usage.stateMachineRuntime.usedConditionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Condition_KeyReleased` lines 28027-28065: `Condition_KeyReleased` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@27813: `DW Condition_KeyReleased    ; 5`). Direct external references: none. Dispatch id 5 is listed in `project_usage.stateMachineRuntime.usedConditionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Condition_DeadlyTile` lines 28066-28084: `Condition_DeadlyTile` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@27819: `DW Condition_DeadlyTile     ; 11`). Direct external references: none. Dispatch id 11 is listed in `project_usage.stateMachineRuntime.usedConditionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Condition_AnimComplete` lines 28085-28107: `Condition_AnimComplete` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@27820: `DW Condition_AnimComplete   ; 12`). Direct external references: none. Dispatch id 12 is not listed in `project_usage.stateMachineRuntime.usedConditionIds`; this is only an unused-by-metadata signal. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Condition_VariableCompare` lines 28108-28293: `Condition_VariableCompare` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@27822: `DW Condition_VariableCompare; 14`). Direct external references: none. Dispatch id 14 is listed in `project_usage.stateMachineRuntime.usedConditionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.

