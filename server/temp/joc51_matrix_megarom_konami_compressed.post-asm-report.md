# Post-ASM Report

- Input: `C:\Users\salam\Documents\Programacion\Mideas\server\temp\joc51_matrix_megarom_konami_compressed.asm`
- Findings: 13
- Applied patches: 0
- Original lines: 37456
- Output lines: 37456
- Net line delta: 0

## Mideas Block Inventory

- Blocks: 108
- Preserved blocks: 25
- Removable-by-policy blocks: 83
- Dead-block candidates: 21
- Annotated block source: 18655 lines / 519323 bytes
- Dead-candidate source: 254 lines / 7985 bytes
- Marker errors: 2

- By kind: data=1, routine=96, trampoline=11
- By owner: animtiles=1, bosses=14, components=32, dialogues=1, entities=4, far-call=11, font=1, gameflow=7, hud=1, interrupt=5, mapper=1, resources=1, screens=7, scroll=1, sound=15, sprites=1, stateMachine=2, unified=1, worlds=2
- By status: candidate_unreferenced=21, empty=1, preserved=25, referenced=14, rooted=47

### Largest Annotated Blocks

| ID | Status | Source | Kind | Owner |
| --- | --- | --- | --- | --- |
| `runtime.statemachine.core` | `rooted` | 2312l/61657b | `routine` | `stateMachine` |
| `runtime.gameflow.world_loop` | `rooted` | 1882l/60441b | `routine` | `gameflow` |
| `runtime.components.scheduler` | `rooted` | 2198l/49496b | `routine` | `components` |
| `runtime.components.wallcollision` | `referenced` | 839l/31288b | `routine` | `components` |
| `runtime.boss.core` | `rooted` | 911l/20450b | `routine` | `bosses` |
| `runtime.components.collision` | `referenced` | 668l/18861b | `routine` | `components` |
| `runtime.resources.manager` | `rooted` | 697l/18133b | `routine` | `resources` |
| `runtime.components.tile_interaction` | `rooted` | 641l/15812b | `routine` | `components` |
| `runtime.hud.core` | `rooted` | 602l/14282b | `routine` | `hud` |
| `runtime.components.input` | `referenced` | 393l/13136b | `routine` | `components` |
| `data.statemachine.statemachine_1776707734563` | `rooted` | 356l/12906b | `data` | `stateMachine` |
| `runtime.animtiles.core` | `rooted` | 441l/12686b | `routine` | `animtiles` |
| `runtime.components.animation` | `referenced` | 342l/10555b | `routine` | `components` |
| `runtime.components.sprite` | `rooted` | 396l/10316b | `routine` | `components` |
| `runtime.scroll.core` | `rooted` | 344l/8639b | `routine` | `scroll` |
| `runtime.interrupt.task_input` | `rooted` | 272l/7149b | `routine` | `interrupt` |
| `runtime.components.jump` | `referenced` | 233l/7043b | `routine` | `components` |
| `runtime.font.loading` | `rooted` | 223l/6725b | `routine` | `font` |
| `runtime.components.entity_management` | `rooted` | 221l/6549b | `routine` | `components` |
| `runtime.components.deadly_tiles` | `rooted` | 262l/5874b | `routine` | `components` |

- Marker error: Line 29417: @mideas:endblock without open block.
- Marker error: Line 35575: @mideas:block id=runtime.gameflow.world_loop has no closing @mideas:endblock.

## Global Label Inventory

- Global labels: 960

| Label | Category | Source |
| --- | --- | --- |
| `FAST_SNSMAT` | `bios_helper` | 1059l/65212b |
| `update_wallcollision_component` | `runtime_code` | 538l/20410b |
| `Action_ChangeSprite` | `runtime_code` | 329l/14785b |
| `update_player_fastpath` | `runtime_code` | 604l/13839b |
| `execute_transition_effect` | `runtime_code` | 398l/11680b |
| `update_entity_collision_fast` | `runtime_code` | 345l/9814b |
| `scan_tile_interaction_entities` | `runtime_code` | 355l/9254b |
| `update_animation_component` | `runtime_code` | 255l/8328b |
| `BANK_0_USED_END` | `bank_marker` | 141l/7686b |
| `vdpLoop` | `bios_helper` | 192l/6712b |
| `task_update_input` | `shared_runtime` | 242l/6074b |
| `init_player_1` | `boot_or_init` | 207l/5606b |
| `FAR_BANK_16_ROM_START` | `bank_marker` | 112l/5593b |
| `resource_table` | `data` | 337l/5244b |
| `init_basic_enemy_1` | `boot_or_init` | 186l/4848b |
| `execute_transition_reveal_target` | `runtime_code` | 265l/4788b |
| `jump_update_loop` | `runtime_code` | 157l/4675b |
| `render_hud` | `runtime_code` | 164l/4492b |
| `rebuild_used_entity_list` | `runtime_code` | 207l/4475b |
| `update_boss_system` | `runtime_code` | 139l/4402b |
| `interrupt_dispatcher` | `shared_runtime` | 122l/4176b |
| `BANK_2_USED_END` | `bank_marker` | 80l/3927b |
| `init_fakeplayer_1` | `boot_or_init` | 147l/3895b |
| `Condition_VariableCompare` | `runtime_code` | 186l/3892b |
| `wall_build_hitbox_cache` | `runtime_code` | 121l/3875b |
| `mapper_call_hl_auto` | `shared_runtime` | 99l/3869b |
| `Action_SetVariable` | `runtime_code` | 150l/3656b |
| `Action_IncVariable` | `runtime_code` | 136l/3515b |
| `init_char0_color` | `boot_or_init` | 127l/3471b |
| `SM_FacingDirTablePtrs` | `data` | 65l/3395b |

### Largest Unannotated Global Labels

- Unannotated labels: 345

| Category | Labels | Source |
| --- | ---: | ---: |
| `bank_marker` | 15 | 534l/23935b |
| `bios_helper` | 9 | 1684l/84004b |
| `boot_or_init` | 26 | 861l/22771b |
| `data` | 148 | 1622l/52710b |
| `far_trampoline` | 67 | 1171l/25242b |
| `runtime_code` | 75 | 2585l/70083b |
| `screen_loader` | 2 | 50l/1253b |
| `shared_runtime` | 2 | 31l/1113b |
| `unknown` | 1 | 5l/65b |

| Label | Category | Source |
| --- | --- | --- |
| `FAST_SNSMAT` | `bios_helper` | 1059l/65212b |
| `execute_transition_effect` | `runtime_code` | 398l/11680b |
| `BANK_0_USED_END` | `bank_marker` | 141l/7686b |
| `vdpLoop` | `bios_helper` | 192l/6712b |
| `resource_table` | `data` | 337l/5244b |
| `execute_transition_reveal_target` | `runtime_code` | 265l/4788b |
| `BANK_2_USED_END` | `bank_marker` | 80l/3927b |
| `init_char0_color` | `boot_or_init` | 127l/3471b |
| `gameflow_world_game_loop` | `runtime_code` | 94l/3319b |
| `FAR_BANK_10_ROM_START` | `bank_marker` | 79l/3184b |
| `init_entities` | `boot_or_init` | 138l/3129b |
| `gameflow_handle_transition` | `runtime_code` | 66l/3068b |
| `load_sprite_patterns_worldmap_1776512078647` | `data` | 76l/3051b |
| `FAST_LDIRVM` | `bios_helper` | 80l/2624b |
| `restart_rom_continue` | `boot_or_init` | 80l/2346b |
| `init_interrupt_system` | `boot_or_init` | 65l/2143b |
| `init_sprites` | `boot_or_init` | 71l/1898b |
| `FAST_WRTVRM` | `bios_helper` | 70l/1868b |
| `FAST_FILLVRM` | `bios_helper` | 83l/1833b |
| `FAST_WRTVDP` | `bios_helper` | 59l/1764b |
| `SPRITE_2_PATTERN` | `data` | 45l/1677b |
| `FAR_BANK_6_ROM_START` | `bank_marker` | 47l/1562b |
| `tile_pattern_bank0` | `data` | 24l/1532b |
| `trans_wait_frames` | `runtime_code` | 45l/1499b |
| `FAST_RDVRM` | `bios_helper` | 53l/1498b |
| `init_all_global_variables` | `boot_or_init` | 39l/1416b |
| `joystick_direction_table` | `data` | 54l/1407b |
| `init_game_systems` | `boot_or_init` | 45l/1394b |
| `init_player_from_hero_entity` | `boot_or_init` | 62l/1324b |
| `trans_reveal_manhattan_pass` | `runtime_code` | 59l/1281b |

| ID | Kind | Owner | Status | Incoming | Source | Lines | Labels |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `runtime.mapper.core` | `routine` | `mapper` | `rooted` | 181 | 213l/5412b | 12908-13120 | mapper_runtime_init, mapper_set_bank_p1, mapper_set_bank_p2, mapper_set_bank_p3, mapper_set_bank_p4, ... (+14) |
| `runtime.resources.manager` | `routine` | `resources` | `rooted` | 50 | 697l/18133b | 13585-14281 | resource_manager_init, resource_invalidate_pattern_vram_cache, resource_invalidate_color_vram_cache, resource_invalidate_font_vram_cache, resource_invalidate_gameplay_vram_cache, ... (+14) |
| `runtime.components.input_trigger_level` | `routine` | `components` | `candidate_unreferenced` | 0 | 33l/773b | 14363-14395 | component_trigger_level_pressed_a |
| `runtime.page0.stubs` | `routine` | `unified` | `rooted` | 1 | 22l/505b | 14402-14423 | init_page0_runtime_state, page0_map_expanded_slot, page0_map_game_rom, page0_restore_bios_rom, page0_copy_chunk_to_buffer, ... (+2) |
| `runtime.interrupt.stop` | `routine` | `interrupt` | `rooted` | 0 | 43l/1299b | 14504-14546 | stop_interrupt_system |
| `runtime.interrupt.dispatcher` | `routine` | `interrupt` | `preserved` | 1 | 124l/4150b | 14548-14671 | interrupt_dispatcher |
| `runtime.interrupt.vblank_flag` | `routine` | `interrupt` | `rooted` | 1 | 35l/983b | 14684-14718 | update_vblank_flag |
| `runtime.interrupt.task_api` | `routine` | `interrupt` | `rooted` | 1 | 121l/3195b | 14723-14843 | enable_task, disable_task, get_frame_count |
| `runtime.interrupt.task_input` | `routine` | `interrupt` | `rooted` | 2 | 272l/7149b | 14847-15118 | init_default_tasks_from_plan, task_update_input |
| `runtime.far_trampoline.init_boss_system_far` | `trampoline` | `far-call` | `preserved` | 2 | 26l/702b | 15226-15251 | init_boss_system_far |
| `runtime.far_trampoline.init_screen_boss_from_current_screen_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/842b | 15253-15278 | init_screen_boss_from_current_screen_far |
| `runtime.far_trampoline.update_boss_system_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/716b | 15280-15305 | update_boss_system_far |
| `runtime.far_trampoline.draw_boss_attack_far` | `trampoline` | `far-call` | `preserved` | 0 | 26l/702b | 15307-15332 | draw_boss_attack_far |
| `runtime.far_trampoline.init_sound_system_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/710b | 15630-15655 | init_sound_system_far |
| `runtime.far_trampoline.task_audio_tick_far` | `trampoline` | `far-call` | `preserved` | 0 | 26l/696b | 15657-15682 | task_audio_tick_far |
| `runtime.far_trampoline.sfx_update_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/661b | 15684-15709 | sfx_update_far |
| `runtime.far_trampoline.music_update_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/675b | 15711-15736 | music_update_far |
| `runtime.far_trampoline.music_stop_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/661b | 15738-15763 | music_stop_far |
| `runtime.far_trampoline.music_play_track_far` | `trampoline` | `far-call` | `preserved` | 1 | 28l/740b | 15765-15792 | music_play_track_far |
| `runtime.far_trampoline.music_execute_command_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/738b | 15794-15819 | music_execute_command_far |
| `runtime.sound.resident.init` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/184b | 16795-16798 | call_init_sound_system_resident |
| `runtime.sound.resident.tick` | `routine` | `sound` | `candidate_unreferenced` | 0 | 18l/606b | 16800-16817 | call_task_audio_tick_resident |
| `runtime.sound.resident.music_update` | `routine` | `sound` | `referenced` | 2 | 4l/190b | 16819-16822 | call_music_update_resident |
| `runtime.sound.resident.sfx_update` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/182b | 16824-16827 | call_sfx_update_resident |
| `runtime.sound.resident.music_stop` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/182b | 16829-16832 | call_music_stop_resident |
| `runtime.sound.resident.music_play_track` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/206b | 16834-16837 | call_music_play_track_resident |
| `runtime.sound.resident.music_execute_command` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/226b | 16839-16842 | call_music_execute_command_resident |
| `runtime.boss.resident.init` | `routine` | `bosses` | `preserved` | 0 | 4l/232b | 16956-16959 | call_init_boss_system_resident |
| `runtime.boss.resident.init_screen` | `routine` | `bosses` | `preserved` | 1 | 4l/306b | 16961-16964 | call_init_screen_boss_from_current_screen_resident |
| `runtime.boss.resident.update` | `routine` | `bosses` | `preserved` | 1 | 4l/242b | 16966-16969 | call_update_boss_system_resident |
| `runtime.boss.resident.update_projectile` | `routine` | `bosses` | `preserved` | 0 | 4l/296b | 16971-16974 | call_update_boss_projectile_runtime_resident |
| `runtime.boss.resident.draw_attack` | `routine` | `bosses` | `preserved` | 0 | 4l/242b | 16976-16979 | call_draw_boss_attack_resident |
| `runtime.boss.resident.draw_meteor` | `routine` | `bosses` | `preserved` | 0 | 4l/253b | 16981-16984 | call_draw_boss_meteor_attack_resident |
| `runtime.boss.resident.draw_bomb` | `routine` | `bosses` | `preserved` | 0 | 4l/245b | 16986-16989 | call_draw_boss_bomb_attack_resident |
| `runtime.boss.resident.draw_boomerang` | `routine` | `bosses` | `preserved` | 0 | 4l/265b | 16991-16994 | call_draw_boss_boomerang_attack_resident |
| `runtime.boss.resident.draw_rock` | `routine` | `bosses` | `preserved` | 0 | 4l/245b | 16996-16999 | call_draw_boss_rock_attack_resident |
| `runtime.boss.resident.draw_laser` | `routine` | `bosses` | `preserved` | 0 | 4l/249b | 17001-17004 | call_draw_boss_laser_attack_resident |
| `runtime.boss.resident.draw_sine_wave` | `routine` | `bosses` | `preserved` | 0 | 4l/265b | 17006-17009 | call_draw_boss_sine_wave_attack_resident |
| `runtime.boss.resident.draw_homing_missile` | `routine` | `bosses` | `preserved` | 0 | 4l/285b | 17011-17014 | call_draw_boss_homing_missile_attack_resident |
| `runtime.components.init` | `routine` | `components` | `rooted` | 11 | 86l/2980b | 17283-17368 | component_fill_32_a, init_components |
| `runtime.components.position` | `routine` | `components` | `rooted` | 3 | 108l/3281b | 17370-17477 | init_position_system, update_position_component, position_update_loop, position_next_entity |
| `runtime.components.sprite` | `routine` | `components` | `rooted` | 6 | 396l/10316b | 17478-17873 | init_sprite_system, update_sprite_component, sprite_update_loop, sprite_layer_loop, sprite_continue, ... (+6) |
| `runtime.components.movement_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 17879-17882 | update_movement_component |
| `runtime.components.collision` | `routine` | `components` | `referenced` | 2 | 668l/18861b | 17883-18550 | init_collision_system, update_collision_component, collision_update_loop, collision_next_entity, update_entity_collision_fast, ... (+13) |
| `runtime.components.behavior_tile` | `routine` | `components` | `rooted` | 9 | 110l/3809b | 18551-18660 | get_behavior_tile, get_behavior_tile_nb, gbt_oob |
| `runtime.components.directional_sprite_sync` | `routine` | `components` | `rooted` | 3 | 87l/2084b | 18661-18747 | component_sync_directional_sprite_from_initial, component_sync_directional_sprite_from_current, component_sync_directional_sprite_common |
| `runtime.components.input` | `routine` | `components` | `referenced` | 2 | 393l/13136b | 18748-19140 | init_input_system, update_input_component, input_update_loop, input_move_up, input_move_down, ... (+16) |
| `runtime.components.health` | `routine` | `components` | `rooted` | 4 | 152l/4701b | 19178-19329 | init_health_system, update_health_component, decrease_entity_lives, increase_entity_lives |
| `runtime.components.animation` | `routine` | `components` | `referenced` | 4 | 342l/10555b | 19330-19671 | init_animation_system, update_animation_component, anim_done_entity, refresh_player_animation_fastpath |
| `runtime.components.jump` | `routine` | `components` | `referenced` | 2 | 233l/7043b | 19672-19904 | init_jump_system, update_jump_component, jump_update_loop, jump_done_entity, jump_next_entity |
| `runtime.components.gravity` | `routine` | `components` | `rooted` | 2 | 137l/4553b | 19905-20041 | init_gravity_system, update_gravity_component, gravity_update_loop, gravity_store_vel, gravity_grounded, ... (+2) |
| `runtime.components.walljump_stub` | `routine` | `components` | `referenced` | 2 | 18l/326b | 20062-20079 | init_walljump_system, update_walljump_component, walljump_process_entity_c, walljump_input_is_left, walljump_input_is_right |
| `runtime.components.auto_destroy_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/219b | 20082-20088 | init_auto_destroy_system, update_auto_destroy_component |
| `runtime.components.state_machine_component_stub` | `routine` | `components` | `referenced` | 1 | 7l/241b | 20112-20118 | init_statemachine_system, update_statemachine_component |
| `runtime.components.retractable_gate_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/196b | 20124-20127 | update_retractable_gate_component |
| `runtime.components.carry` | `routine` | `components` | `rooted` | 1 | 81l/2148b | 20128-20208 | init_carry_system, update_carry_component |
| `runtime.components.damage` | `routine` | `components` | `rooted` | 2 | 126l/3906b | 20212-20337 | init_damage_system, update_damage_component, apply_damage_to_entity, check_entity_invincible |
| `runtime.components.shoot_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/163b | 20343-20346 | update_shoot_component |
| `runtime.components.platform_riding_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/220b | 20366-20372 | prepare_platform_detection, update_platform_riding |
| `runtime.components.wallcollision` | `routine` | `components` | `referenced` | 3 | 839l/31288b | 20373-21211 | init_wallcollision_system, wall_behavior_is_full_blocker, wall_down_behavior_blocks, update_wallcollision_component, wall_build_hitbox_cache, ... (+2) |
| `runtime.components.deadly_tiles` | `routine` | `components` | `rooted` | 3 | 262l/5874b | 21212-21473 | init_deadly_tiles_system, deadly_tiles_runtime_tile_is_deadly_nb, update_entity_deadly_flag_runtime, update_deadly_tiles_component, refresh_player_deadly_fastpath |
| `runtime.components.in_water_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 21479-21482 | update_in_water_component |
| `runtime.components.collectible_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/181b | 21488-21491 | update_collectible_component |
| `runtime.components.tile_interaction` | `routine` | `components` | `rooted` | 4 | 641l/15812b | 21492-22132 | interaction_target_variable_ptr_table, interaction_target_variable_word_table, init_tile_interaction_system, update_slash_component, record_bonus_respawn_slot, ... (+11) |
| `runtime.components.collected_tiles` | `routine` | `components` | `rooted` | 1 | 76l/3015b | 22133-22208 | apply_collected_tiles |
| `runtime.components.entity_management` | `routine` | `components` | `rooted` | 3 | 221l/6549b | 22209-22429 | create_entity, entity_job_set, entity_job_set_period_ok, entity_job_set_entry_wrap, entity_job_set_entry_ok, ... (+13) |
| `runtime.components.scheduler` | `routine` | `components` | `rooted` | 7 | 2198l/49496b | 22430-24627 | update_all_entities, mark_used_entity_list_dirty, ensure_used_entity_list_current, rebuild_used_entity_list, ensure_player_fast_runtime_bound, ... (+86) |
| `runtime.dialogue.system` | `routine` | `dialogues` | `preserved` | 5 | 16l/393b | 23991-24006 | dialogue_update_typewriter, dialogue_open_box, dialogue_start_line, dialogue_clear_box, dialogue_close_box |
| `runtime.components.state_machine_executor` | `routine` | `components` | `rooted` | 2 | 74l/1973b | 24633-24706 | execute_all_state_machines, refresh_player_state_machine_fastpath |
| `runtime.components.legacy_tile_collision` | `routine` | `components` | `candidate_unreferenced` | 0 | 43l/1404b | 24716-24758 | get_tile_at_position, get_tile_behavior, tile_behavior_table, check_collision_at_point, check_collision_box, ... (+1) |
| `runtime.components.secret_zone_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/181b | 24795-24798 | update_secret_zone_component |
| `runtime.statemachine.core` | `routine` | `stateMachine` | `rooted` | 4 | 2312l/61657b | 24806-27117 | SM_Update, sm_timer_no_overflow, sm_timer_paused, sm_update_done, SM_ShouldPauseTimerForDialogue, ... (+37) |
| `data.statemachine.statemachine_1776707734563` | `data` | `stateMachine` | `rooted` | 1 | 356l/12906b | 27201-27556 | SM_New_Statemachine_state_1776707744092, SM_New_Statemachine_state_1776707744092_Transitions, SM_New_Statemachine_state_1776707744092_Transitions_Actions_0, SM_New_Statemachine_state_1776707744092_Transitions_Actions_1, SM_New_Statemachine_state_1776707744092_Transitions_Actions_2, ... (+33) |
| `runtime.gameflow.worldlink` | `routine` | `gameflow` | `rooted` | 1 | 92l/2650b | 27680-27771 | gameflow_handle_worldlink |
| `runtime.gameflow.end_screen` | `routine` | `gameflow` | `rooted` | 5 | 85l/2528b | 27773-27857 | gameflow_handle_end, print_string_vram |
| `runtime.gameflow.connection_by_type` | `routine` | `gameflow` | `empty` | 0 | 3l/216b | 29311-29313 |  |
| `runtime.gameflow.screen_timer` | `routine` | `gameflow` | `rooted` | 1 | 144l/3220b | 29424-29567 | get_world_screen_timer_frames_per_second, reload_world_screen_timer_frames, snapshot_world_screen_timer_interrupt_counter, reset_world_screen_timer, update_world_screen_timer |
| `data.entities.player_1.init` | `routine` | `entities` | `rooted` | 1 | 207l/5700b | 30385-30591 | init_player_1 |
| `data.entities.basic_enemy_1.init` | `routine` | `entities` | `rooted` | 1 | 186l/4952b | 30610-30795 | init_basic_enemy_1 |
| `data.entities.fakeplayer_1.init` | `routine` | `entities` | `rooted` | 1 | 147l/3997b | 30814-30960 | init_fakeplayer_1 |
| `runtime.entities.patrol_facing` | `routine` | `entities` | `rooted` | 0 | 88l/2125b | 31127-31214 | update_entity_patrol_facing |
| `runtime.boss.entry` | `routine` | `bosses` | `rooted` | 2 | 78l/1883b | 31347-31424 | init_boss_system, update_boss_system |
| `runtime.boss.core` | `routine` | `bosses` | `rooted` | 13 | 911l/20450b | 31426-32336 | init_screen_boss_from_current_screen, boss_push_data_bank, boss_pop_data_bank, boss_resolve_initial_phase, boss_init_behavior_state, ... (+24) |
| `runtime.screens.colors` | `routine` | `screens` | `rooted` | 1 | 44l/1514b | 32368-32411 | color_shift_table, set_screen_colors |
| `runtime.screens.copy_rect` | `routine` | `screens` | `rooted` | 0 | 77l/1494b | 32540-32616 | copy_layout_rect_to_vram, copy_layout_rect_ram_to_ram |
| `runtime.screens.block_layout_expander` | `routine` | `screens` | `rooted` | 1 | 194l/3798b | 32618-32811 | expand_screen_block_layout_to_background, expand_screen_block_layout_2x2, expand_screen_block_layout_4x4 |
| `runtime.screens.behavior_map_rebuild` | `routine` | `screens` | `candidate_unreferenced` | 0 | 26l/709b | 32829-32854 | build_runtime_behavior_map_from_screen_layout |
| `runtime.screens.load_screen_stub` | `routine` | `screens` | `candidate_unreferenced` | 0 | 6l/232b | 32855-32860 | load_screen |
| `runtime.screens.load_screen_pan1_776511902784.loader` | `routine` | `screens` | `rooted` | 1 | 134l/5163b | 32862-32995 | load_screen_pan1_776511902784, load_screen_pan1_776511902784_skip_vram_copy, load_pan1_776511902784_boss_done |
| `runtime.screens.load_screen_new_dialog_screen_777377884059.loader` | `routine` | `screens` | `rooted` | 1 | 117l/4778b | 32997-33113 | load_screen_new_dialog_screen_777377884059, load_screen_new_dialog_screen_777377884059_skip_vram_copy, load_new_dialog_screen_777377884059_boss_done |
| `runtime.sprites.show_sprite_legacy` | `routine` | `sprites` | `candidate_unreferenced` | 0 | 43l/981b | 33639-33681 | show_sprite |
| `runtime.sound.init` | `routine` | `sound` | `rooted` | 1 | 22l/725b | 33833-33854 | init_sound_system |
| `runtime.sound.tick` | `routine` | `sound` | `rooted` | 1 | 17l/320b | 33861-33877 | task_audio_tick |
| `runtime.sound.psg_lowlevel` | `routine` | `sound` | `rooted` | 27 | 117l/3450b | 33882-33998 | psg_write, psg_set_tone, psg_set_volume, psg_set_noise, psg_set_mixer, ... (+1) |
| `runtime.sound.sfx_silence` | `routine` | `sound` | `referenced` | 2 | 21l/579b | 34008-34028 | sfx_silence_all |
| `runtime.sound.sfx_builtin_effects` | `routine` | `sound` | `referenced` | 6 | 127l/3025b | 34034-34160 | sfx_beep, sfx_jump, sfx_shoot, sfx_explosion, sfx_coin, ... (+1) |
| `runtime.sound.sfx_playback` | `routine` | `sound` | `referenced` | 1 | 119l/2384b | 34178-34296 | play_sound_effect, play_sound_effect_beep, play_sound_effect_jump, play_sound_effect_shoot, play_sound_effect_explosion, ... (+4) |
| `runtime.sound.music_noop_runtime` | `routine` | `sound` | `referenced` | 5 | 66l/1337b | 34305-34370 | music_init_system, music_reset_channel_state, music_silence_channels, music_stop, music_mute, ... (+7) |
| `runtime.sound.music_reset_noop` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/163b | 34326-34329 | music_reset_channel_state |
| `runtime.hud.core` | `routine` | `hud` | `rooted` | 3 | 602l/14282b | 34394-34995 | hud_element_data, hud_text_0, hud_text_1, hud_text_2, hud_text_3, ... (+10) |
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
- `runtime.sound.music_reset_noop`: 4 lines / 163 bytes. No external references found for any global label in this block.
- `runtime.components.shoot_stub`: 4 lines / 163 bytes. No external references found for any global label in this block.

## state-machine-dispatch-handlers

- Metrics: findings=13, patchable=0, removed_lines=0, removed_source_bytes=0
- Routines: Action_ChangeSprite, Action_IncVariable, Action_Nop, Action_RegenerateHud, Action_ReplaceTile, Action_SetVariable, Condition_And, Condition_AnimComplete, Condition_DeadlyTile, Condition_KeyPressed, Condition_KeyReleased, Condition_Nop, Condition_VariableCompare

- [report-only] `Action_Nop` lines 25299-25309: `Action_Nop` is a state-machine action handler referenced by `SM_ActionTable` (39 table reference(s): SM_ActionTable@25250: `DW Action_Nop; 0`, SM_ActionTable@25251: `DW Action_Nop ; 1 [Action_SetPosition stripped]`, SM_ActionTable@25252: `DW Action_Nop ; 2 [Action_MoveBy stripped]`). Direct external references: none. Dispatch id 0 is not listed in `project_usage.stateMachineRuntime.usedActionIds`; this is only an unused-by-metadata signal. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Action_ChangeSprite` lines 25375-25703: `Action_ChangeSprite` is a state-machine action handler referenced by `SM_ActionTable` (1 table reference(s): SM_ActionTable@25255: `DW Action_ChangeSprite; 5`). Direct external references: none. Dispatch id 5 is listed in `project_usage.stateMachineRuntime.usedActionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Action_SetVariable` lines 25704-25853: `Action_SetVariable` is a state-machine action handler referenced by `SM_ActionTable` (1 table reference(s): SM_ActionTable@25263: `DW Action_SetVariable; 13`). Direct external references: none. Dispatch id 13 is listed in `project_usage.stateMachineRuntime.usedActionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Action_IncVariable` lines 25854-25989: `Action_IncVariable` is a state-machine action handler referenced by `SM_ActionTable` (1 table reference(s): SM_ActionTable@25264: `DW Action_IncVariable; 14`). Direct external references: none. Dispatch id 14 is listed in `project_usage.stateMachineRuntime.usedActionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Action_RegenerateHud` lines 25990-25998: `Action_RegenerateHud` is a state-machine action handler referenced by `SM_ActionTable` (1 table reference(s): SM_ActionTable@25273: `DW Action_RegenerateHud; 23`). Direct external references: none. Dispatch id 23 is listed in `project_usage.stateMachineRuntime.usedActionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Action_ReplaceTile` lines 25999-26019: `Action_ReplaceTile` is a state-machine action handler referenced by `SM_ActionTable` (1 table reference(s): SM_ActionTable@25278: `DW Action_ReplaceTile; 28`). Direct external references: none. Dispatch id 28 is listed in `project_usage.stateMachineRuntime.usedActionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Condition_Nop` lines 26660-26663: `Condition_Nop` is a state-machine condition handler referenced by `SM_ConditionTable` (12 table reference(s): SM_ConditionTable@26637: `DW Condition_Nop            ; 0`, SM_ConditionTable@26639: `DW Condition_Nop ; 2 [Condition_Or stripped]`, SM_ConditionTable@26640: `DW Condition_Nop ; 3 [Condition_Not stripped]`). Direct external references: none. Dispatch id 0 is not listed in `project_usage.stateMachineRuntime.usedConditionIds`; this is only an unused-by-metadata signal. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Condition_And` lines 26664-26702: `Condition_And` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@26638: `DW Condition_And            ; 1`). Direct external references: none. Dispatch id 1 is listed in `project_usage.stateMachineRuntime.usedConditionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Condition_KeyPressed` lines 26812-26855: `Condition_KeyPressed` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@26641: `DW Condition_KeyPressed     ; 4`). Direct external references: none. Dispatch id 4 is listed in `project_usage.stateMachineRuntime.usedConditionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Condition_KeyReleased` lines 26856-26894: `Condition_KeyReleased` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@26642: `DW Condition_KeyReleased    ; 5`). Direct external references: none. Dispatch id 5 is listed in `project_usage.stateMachineRuntime.usedConditionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Condition_DeadlyTile` lines 26895-26913: `Condition_DeadlyTile` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@26648: `DW Condition_DeadlyTile     ; 11`). Direct external references: none. Dispatch id 11 is listed in `project_usage.stateMachineRuntime.usedConditionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Condition_AnimComplete` lines 26914-26936: `Condition_AnimComplete` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@26649: `DW Condition_AnimComplete   ; 12`). Direct external references: none. Dispatch id 12 is not listed in `project_usage.stateMachineRuntime.usedConditionIds`; this is only an unused-by-metadata signal. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Condition_VariableCompare` lines 26937-27122: `Condition_VariableCompare` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@26651: `DW Condition_VariableCompare; 14`). Direct external references: none. Dispatch id 14 is listed in `project_usage.stateMachineRuntime.usedConditionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.

