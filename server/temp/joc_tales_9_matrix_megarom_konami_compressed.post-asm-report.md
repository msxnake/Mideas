# Post-ASM Report

- Input: `C:\Users\salam\Documents\Programacion\Mideas\server\temp\joc_tales_9_matrix_megarom_konami_compressed.asm`
- Findings: 6
- Applied patches: 0
- Original lines: 25046
- Output lines: 25046
- Net line delta: 0

## Mideas Block Inventory

- Blocks: 102
- Preserved blocks: 24
- Removable-by-policy blocks: 78
- Dead-block candidates: 25
- Annotated block source: 13933 lines / 387478 bytes
- Dead-candidate source: 275 lines / 8727 bytes
- Marker errors: 2

- By kind: data=1, routine=90, trampoline=11
- By owner: animtiles=1, bosses=14, components=31, entities=2, far-call=11, gameflow=6, hud=1, interrupt=5, mapper=1, resources=1, screens=6, scroll=1, sound=15, sprites=1, stateMachine=2, unified=2, worlds=2
- By status: candidate_unreferenced=25, empty=1, preserved=24, referenced=14, rooted=38

### Largest Annotated Blocks

| ID | Status | Source | Kind | Owner |
| --- | --- | --- | --- | --- |
| `runtime.gameflow.world_loop` | `rooted` | 1688l/53226b | `routine` | `gameflow` |
| `runtime.components.scheduler` | `rooted` | 1621l/37201b | `routine` | `components` |
| `runtime.components.wallcollision` | `referenced` | 839l/31288b | `routine` | `components` |
| `runtime.statemachine.core` | `rooted` | 1140l/26373b | `routine` | `stateMachine` |
| `runtime.boss.core` | `rooted` | 869l/19524b | `routine` | `bosses` |
| `runtime.components.collision` | `referenced` | 668l/18861b | `routine` | `components` |
| `runtime.resources.manager` | `rooted` | 697l/18133b | `routine` | `resources` |
| `runtime.components.input` | `referenced` | 393l/13136b | `routine` | `components` |
| `runtime.components.animation` | `referenced` | 342l/10555b | `routine` | `components` |
| `runtime.components.sprite` | `rooted` | 396l/10316b | `routine` | `components` |
| `runtime.animtiles.core` | `rooted` | 325l/9460b | `routine` | `animtiles` |
| `runtime.scroll.core` | `rooted` | 340l/8599b | `routine` | `scroll` |
| `runtime.interrupt.task_input` | `rooted` | 272l/7149b | `routine` | `interrupt` |
| `runtime.components.jump` | `referenced` | 233l/7043b | `routine` | `components` |
| `runtime.components.entity_management` | `rooted` | 221l/6553b | `routine` | `components` |
| `runtime.components.deadly_tiles` | `rooted` | 262l/5874b | `routine` | `components` |
| `data.entities.player_1.init` | `rooted` | 207l/5703b | `routine` | `entities` |
| `runtime.mapper.core` | `rooted` | 213l/5412b | `routine` | `mapper` |
| `runtime.screens.load_screen_new_playable_screen_777833014252.loader` | `rooted` | 122l/5127b | `routine` | `screens` |
| `runtime.components.health` | `rooted` | 152l/4701b | `routine` | `components` |

- Marker error: Line 19315: @mideas:endblock without open block.
- Marker error: Line 23359: @mideas:block id=runtime.gameflow.world_loop has no closing @mideas:endblock.

## Global Label Inventory

- Global labels: 724

| Label | Category | Source |
| --- | --- | --- |
| `FAST_SNSMAT` | `bios_helper` | 1158l/74153b |
| `update_wallcollision_component` | `runtime_code` | 538l/20410b |
| `update_player_fastpath` | `runtime_code` | 604l/13839b |
| `execute_transition_effect` | `runtime_code` | 398l/11680b |
| `update_entity_collision_fast` | `runtime_code` | 345l/9814b |
| `update_animation_component` | `runtime_code` | 255l/8328b |
| `BANK_0_USED_END` | `bank_marker` | 141l/7659b |
| `vdpLoop` | `bios_helper` | 192l/6712b |
| `task_update_input` | `shared_runtime` | 242l/6074b |
| `init_player_1` | `boot_or_init` | 207l/5609b |
| `execute_transition_reveal_target` | `runtime_code` | 265l/4788b |
| `jump_update_loop` | `runtime_code` | 157l/4675b |
| `rebuild_used_entity_list` | `runtime_code` | 207l/4475b |
| `update_boss_system` | `runtime_code` | 139l/4402b |
| `interrupt_dispatcher` | `shared_runtime` | 122l/4176b |
| `tilebank_pattern_data_0` | `data` | 59l/4015b |
| `FAR_BANK_15_ROM_START` | `bank_marker` | 79l/3992b |
| `Condition_VariableCompare` | `runtime_code` | 186l/3892b |
| `wall_build_hitbox_cache` | `runtime_code` | 121l/3875b |
| `tile_pattern_bank0` | `data` | 56l/3797b |
| `init_char0_color` | `boot_or_init` | 127l/3471b |
| `wall_down_behavior_blocks` | `runtime_code` | 75l/3286b |
| `input_update_loop` | `runtime_code` | 108l/3269b |
| `FAR_BANK_9_ROM_START` | `bank_marker` | 79l/3183b |
| `init_entities` | `boot_or_init` | 136l/3074b |
| `gameflow_handle_transition` | `runtime_code` | 66l/3068b |
| `load_screen_new_playable_screen_777833014252` | `screen_loader` | 64l/3060b |
| `init_components` | `boot_or_init` | 81l/2949b |
| `input_apply_velocity` | `runtime_code` | 68l/2776b |
| `gameflow_world_game_loop` | `runtime_code` | 82l/2702b |

### Largest Unannotated Global Labels

- Unannotated labels: 261

| Category | Labels | Source |
| --- | ---: | ---: |
| `bank_marker` | 11 | 408l/18565b |
| `bios_helper` | 9 | 1783l/92945b |
| `boot_or_init` | 27 | 758l/20004b |
| `data` | 74 | 881l/33760b |
| `far_trampoline` | 64 | 1094l/23693b |
| `runtime_code` | 72 | 2461l/66681b |
| `screen_loader` | 1 | 25l/669b |
| `shared_runtime` | 2 | 32l/1221b |
| `unknown` | 1 | 5l/65b |

| Label | Category | Source |
| --- | --- | --- |
| `FAST_SNSMAT` | `bios_helper` | 1158l/74153b |
| `execute_transition_effect` | `runtime_code` | 398l/11680b |
| `BANK_0_USED_END` | `bank_marker` | 141l/7659b |
| `vdpLoop` | `bios_helper` | 192l/6712b |
| `execute_transition_reveal_target` | `runtime_code` | 265l/4788b |
| `tilebank_pattern_data_0` | `data` | 59l/4015b |
| `tile_pattern_bank0` | `data` | 56l/3797b |
| `init_char0_color` | `boot_or_init` | 127l/3471b |
| `FAR_BANK_9_ROM_START` | `bank_marker` | 79l/3183b |
| `init_entities` | `boot_or_init` | 136l/3074b |
| `gameflow_handle_transition` | `runtime_code` | 66l/3068b |
| `gameflow_world_game_loop` | `runtime_code` | 82l/2702b |
| `FAST_LDIRVM` | `bios_helper` | 80l/2624b |
| `restart_rom_continue` | `boot_or_init` | 80l/2346b |
| `init_interrupt_system` | `boot_or_init` | 65l/2143b |
| `BANK_2_USED_END` | `bank_marker` | 41l/1980b |
| `resource_table` | `data` | 103l/1972b |
| `FAST_WRTVRM` | `bios_helper` | 70l/1868b |
| `FAST_FILLVRM` | `bios_helper` | 83l/1833b |
| `FAST_WRTVDP` | `bios_helper` | 59l/1764b |
| `trans_wait_frames` | `runtime_code` | 45l/1499b |
| `FAST_RDVRM` | `bios_helper` | 53l/1498b |
| `tilebank_color_data_0` | `data` | 22l/1426b |
| `joystick_direction_table` | `data` | 54l/1407b |
| `tile_color_bank0` | `data` | 21l/1342b |
| `init_player_from_hero_entity` | `boot_or_init` | 62l/1324b |
| `trans_reveal_manhattan_pass` | `runtime_code` | 59l/1281b |
| `trans_reveal_zoom_band` | `runtime_code` | 51l/1262b |
| `init_game_systems` | `boot_or_init` | 41l/1258b |
| `FAST_GTTRIG` | `bios_helper` | 54l/1254b |

| ID | Kind | Owner | Status | Incoming | Source | Lines | Labels |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `runtime.mapper.core` | `routine` | `mapper` | `rooted` | 156 | 213l/5412b | 6143-6355 | mapper_runtime_init, mapper_set_bank_p1, mapper_set_bank_p2, mapper_set_bank_p3, mapper_set_bank_p4, ... (+14) |
| `runtime.resources.manager` | `routine` | `resources` | `rooted` | 25 | 697l/18133b | 6547-7243 | resource_manager_init, resource_invalidate_pattern_vram_cache, resource_invalidate_color_vram_cache, resource_invalidate_font_vram_cache, resource_invalidate_gameplay_vram_cache, ... (+14) |
| `runtime.components.input_trigger_level` | `routine` | `components` | `candidate_unreferenced` | 0 | 33l/773b | 7325-7357 | component_trigger_level_pressed_a |
| `runtime.page0.stubs` | `routine` | `unified` | `rooted` | 1 | 22l/505b | 7364-7385 | init_page0_runtime_state, page0_map_expanded_slot, page0_map_game_rom, page0_restore_bios_rom, page0_copy_chunk_to_buffer, ... (+2) |
| `runtime.interrupt.stop` | `routine` | `interrupt` | `rooted` | 0 | 43l/1299b | 7466-7508 | stop_interrupt_system |
| `runtime.interrupt.dispatcher` | `routine` | `interrupt` | `preserved` | 1 | 124l/4150b | 7510-7633 | interrupt_dispatcher |
| `runtime.interrupt.vblank_flag` | `routine` | `interrupt` | `rooted` | 1 | 35l/983b | 7646-7680 | update_vblank_flag |
| `runtime.interrupt.task_api` | `routine` | `interrupt` | `rooted` | 1 | 121l/3195b | 7685-7805 | enable_task, disable_task, get_frame_count |
| `runtime.interrupt.task_input` | `routine` | `interrupt` | `rooted` | 2 | 272l/7149b | 7809-8080 | init_default_tasks_from_plan, task_update_input |
| `runtime.far_trampoline.init_boss_system_far` | `trampoline` | `far-call` | `preserved` | 2 | 26l/702b | 8135-8160 | init_boss_system_far |
| `runtime.far_trampoline.init_screen_boss_from_current_screen_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/842b | 8162-8187 | init_screen_boss_from_current_screen_far |
| `runtime.far_trampoline.update_boss_system_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/716b | 8189-8214 | update_boss_system_far |
| `runtime.far_trampoline.draw_boss_attack_far` | `trampoline` | `far-call` | `preserved` | 0 | 26l/702b | 8216-8241 | draw_boss_attack_far |
| `runtime.far_trampoline.init_sound_system_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/709b | 8381-8406 | init_sound_system_far |
| `runtime.far_trampoline.task_audio_tick_far` | `trampoline` | `far-call` | `preserved` | 0 | 26l/695b | 8408-8433 | task_audio_tick_far |
| `runtime.far_trampoline.sfx_update_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/660b | 8435-8460 | sfx_update_far |
| `runtime.far_trampoline.music_update_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/674b | 8462-8487 | music_update_far |
| `runtime.far_trampoline.music_stop_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/660b | 8489-8514 | music_stop_far |
| `runtime.far_trampoline.music_play_track_far` | `trampoline` | `far-call` | `preserved` | 1 | 28l/739b | 8516-8543 | music_play_track_far |
| `runtime.far_trampoline.music_execute_command_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/737b | 8545-8570 | music_execute_command_far |
| `runtime.sound.resident.init` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/184b | 9629-9632 | call_init_sound_system_resident |
| `runtime.sound.resident.tick` | `routine` | `sound` | `candidate_unreferenced` | 0 | 18l/606b | 9634-9651 | call_task_audio_tick_resident |
| `runtime.sound.resident.music_update` | `routine` | `sound` | `referenced` | 2 | 4l/190b | 9653-9656 | call_music_update_resident |
| `runtime.sound.resident.sfx_update` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/182b | 9658-9661 | call_sfx_update_resident |
| `runtime.sound.resident.music_stop` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/182b | 9663-9666 | call_music_stop_resident |
| `runtime.sound.resident.music_play_track` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/206b | 9668-9671 | call_music_play_track_resident |
| `runtime.sound.resident.music_execute_command` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/226b | 9673-9676 | call_music_execute_command_resident |
| `runtime.boss.resident.init` | `routine` | `bosses` | `preserved` | 0 | 4l/232b | 9790-9793 | call_init_boss_system_resident |
| `runtime.boss.resident.init_screen` | `routine` | `bosses` | `preserved` | 1 | 4l/306b | 9795-9798 | call_init_screen_boss_from_current_screen_resident |
| `runtime.boss.resident.update` | `routine` | `bosses` | `preserved` | 1 | 4l/242b | 9800-9803 | call_update_boss_system_resident |
| `runtime.boss.resident.update_projectile` | `routine` | `bosses` | `preserved` | 0 | 4l/296b | 9805-9808 | call_update_boss_projectile_runtime_resident |
| `runtime.boss.resident.draw_attack` | `routine` | `bosses` | `preserved` | 0 | 4l/242b | 9810-9813 | call_draw_boss_attack_resident |
| `runtime.boss.resident.draw_meteor` | `routine` | `bosses` | `preserved` | 0 | 4l/253b | 9815-9818 | call_draw_boss_meteor_attack_resident |
| `runtime.boss.resident.draw_bomb` | `routine` | `bosses` | `preserved` | 0 | 4l/245b | 9820-9823 | call_draw_boss_bomb_attack_resident |
| `runtime.boss.resident.draw_boomerang` | `routine` | `bosses` | `preserved` | 0 | 4l/265b | 9825-9828 | call_draw_boss_boomerang_attack_resident |
| `runtime.boss.resident.draw_rock` | `routine` | `bosses` | `preserved` | 0 | 4l/245b | 9830-9833 | call_draw_boss_rock_attack_resident |
| `runtime.boss.resident.draw_laser` | `routine` | `bosses` | `preserved` | 0 | 4l/249b | 9835-9838 | call_draw_boss_laser_attack_resident |
| `runtime.boss.resident.draw_sine_wave` | `routine` | `bosses` | `preserved` | 0 | 4l/265b | 9840-9843 | call_draw_boss_sine_wave_attack_resident |
| `runtime.boss.resident.draw_homing_missile` | `routine` | `bosses` | `preserved` | 0 | 4l/285b | 9845-9848 | call_draw_boss_homing_missile_attack_resident |
| `runtime.font.reload_stub` | `routine` | `unified` | `candidate_unreferenced` | 0 | 4l/146b | 9975-9978 | reload_font_system |
| `runtime.components.init` | `routine` | `components` | `rooted` | 11 | 84l/2890b | 10121-10204 | component_fill_32_a, init_components |
| `runtime.components.position` | `routine` | `components` | `rooted` | 3 | 108l/3281b | 10206-10313 | init_position_system, update_position_component, position_update_loop, position_next_entity |
| `runtime.components.sprite` | `routine` | `components` | `rooted` | 6 | 396l/10316b | 10314-10709 | init_sprite_system, update_sprite_component, sprite_update_loop, sprite_layer_loop, sprite_continue, ... (+6) |
| `runtime.components.movement_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 10715-10718 | update_movement_component |
| `runtime.components.collision` | `routine` | `components` | `referenced` | 2 | 668l/18861b | 10719-11386 | init_collision_system, update_collision_component, collision_update_loop, collision_next_entity, update_entity_collision_fast, ... (+13) |
| `runtime.components.behavior_tile` | `routine` | `components` | `rooted` | 9 | 110l/3809b | 11387-11496 | get_behavior_tile, get_behavior_tile_nb, gbt_oob |
| `runtime.components.directional_sprite_sync` | `routine` | `components` | `rooted` | 3 | 87l/2084b | 11497-11583 | component_sync_directional_sprite_from_initial, component_sync_directional_sprite_from_current, component_sync_directional_sprite_common |
| `runtime.components.input` | `routine` | `components` | `referenced` | 2 | 393l/13136b | 11584-11976 | init_input_system, update_input_component, input_update_loop, input_move_up, input_move_down, ... (+16) |
| `runtime.components.health` | `routine` | `components` | `rooted` | 2 | 152l/4701b | 12014-12165 | init_health_system, update_health_component, decrease_entity_lives, increase_entity_lives |
| `runtime.components.animation` | `routine` | `components` | `referenced` | 4 | 342l/10555b | 12166-12507 | init_animation_system, update_animation_component, anim_done_entity, refresh_player_animation_fastpath |
| `runtime.components.jump` | `routine` | `components` | `referenced` | 2 | 233l/7043b | 12508-12740 | init_jump_system, update_jump_component, jump_update_loop, jump_done_entity, jump_next_entity |
| `runtime.components.gravity` | `routine` | `components` | `rooted` | 2 | 137l/4553b | 12741-12877 | init_gravity_system, update_gravity_component, gravity_update_loop, gravity_store_vel, gravity_grounded, ... (+2) |
| `runtime.components.walljump_stub` | `routine` | `components` | `referenced` | 2 | 18l/326b | 12898-12915 | init_walljump_system, update_walljump_component, walljump_process_entity_c, walljump_input_is_left, walljump_input_is_right |
| `runtime.components.auto_destroy_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/219b | 12918-12924 | init_auto_destroy_system, update_auto_destroy_component |
| `runtime.components.state_machine_component_stub` | `routine` | `components` | `referenced` | 1 | 7l/241b | 12948-12954 | init_statemachine_system, update_statemachine_component |
| `runtime.components.retractable_gate_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/196b | 12960-12963 | update_retractable_gate_component |
| `runtime.components.carry` | `routine` | `components` | `rooted` | 1 | 81l/2148b | 12964-13044 | init_carry_system, update_carry_component |
| `runtime.components.damage_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/166b | 13052-13055 | update_damage_component |
| `runtime.components.shoot_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/163b | 13061-13064 | update_shoot_component |
| `runtime.components.platform_riding_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/220b | 13084-13090 | prepare_platform_detection, update_platform_riding |
| `runtime.components.wallcollision` | `routine` | `components` | `referenced` | 3 | 839l/31288b | 13091-13929 | init_wallcollision_system, wall_behavior_is_full_blocker, wall_down_behavior_blocks, update_wallcollision_component, wall_build_hitbox_cache, ... (+2) |
| `runtime.components.deadly_tiles` | `routine` | `components` | `rooted` | 3 | 262l/5874b | 13930-14191 | init_deadly_tiles_system, deadly_tiles_runtime_tile_is_deadly_nb, update_entity_deadly_flag_runtime, update_deadly_tiles_component, refresh_player_deadly_fastpath |
| `runtime.components.in_water_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 14197-14200 | update_in_water_component |
| `runtime.components.collectible_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/181b | 14206-14209 | update_collectible_component |
| `runtime.components.entity_management` | `routine` | `components` | `rooted` | 3 | 221l/6553b | 14227-14447 | create_entity, entity_job_set, entity_job_set_period_ok, entity_job_set_entry_wrap, entity_job_set_entry_ok, ... (+13) |
| `runtime.components.scheduler` | `routine` | `components` | `rooted` | 7 | 1621l/37201b | 14448-16068 | update_all_entities, mark_used_entity_list_dirty, ensure_used_entity_list_current, rebuild_used_entity_list, ensure_player_fast_runtime_bound, ... (+14) |
| `runtime.components.auto_control_script_stubs` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/252b | 15445-15451 | update_auto_control_script_component, update_auto_event_string_component |
| `runtime.components.state_machine_executor` | `routine` | `components` | `rooted` | 2 | 74l/1973b | 16074-16147 | execute_all_state_machines, refresh_player_state_machine_fastpath |
| `runtime.components.legacy_tile_collision` | `routine` | `components` | `candidate_unreferenced` | 0 | 43l/1404b | 16157-16199 | get_tile_at_position, get_tile_behavior, tile_behavior_table, check_collision_at_point, check_collision_box, ... (+1) |
| `runtime.components.secret_zone_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/181b | 16236-16239 | update_secret_zone_component |
| `runtime.statemachine.core` | `routine` | `stateMachine` | `rooted` | 4 | 1140l/26373b | 16247-17386 | SM_Update, sm_timer_no_overflow, sm_timer_paused, sm_update_done, SM_ShouldPauseTimerForDialogue, ... (+24) |
| `data.statemachine.statemachine_1777833246195` | `data` | `stateMachine` | `rooted` | 1 | 25l/863b | 17452-17476 | SM_New_Statemachine_state_1777833253256, SM_New_Statemachine_state_1777833253256_Transitions, SM_New_Statemachine_state_1777833253256_Transitions_Actions_0, SM_New_Statemachine_state_1777833256480 |
| `runtime.gameflow.worldlink` | `routine` | `gameflow` | `rooted` | 1 | 81l/2372b | 17600-17680 | gameflow_handle_worldlink |
| `runtime.gameflow.end_screen` | `routine` | `gameflow` | `rooted` | 5 | 85l/2528b | 17682-17766 | gameflow_handle_end, print_string_vram |
| `runtime.gameflow.connection_by_type` | `routine` | `gameflow` | `empty` | 0 | 3l/216b | 19220-19222 |  |
| `runtime.boss.entry` | `routine` | `bosses` | `rooted` | 2 | 78l/1883b | 19802-19879 | init_boss_system, update_boss_system |
| `runtime.boss.core` | `routine` | `bosses` | `rooted` | 13 | 869l/19524b | 19881-20749 | init_screen_boss_from_current_screen, boss_push_data_bank, boss_pop_data_bank, boss_resolve_initial_phase, boss_init_behavior_state, ... (+24) |
| `data.entities.player_1.init` | `routine` | `entities` | `rooted` | 1 | 207l/5703b | 20950-21156 | init_player_1 |
| `runtime.entities.patrol_facing` | `routine` | `entities` | `rooted` | 0 | 88l/2125b | 21323-21410 | update_entity_patrol_facing |
| `runtime.screens.colors` | `routine` | `screens` | `rooted` | 1 | 44l/1514b | 21524-21567 | color_shift_table, set_screen_colors |
| `runtime.screens.copy_rect` | `routine` | `screens` | `rooted` | 0 | 77l/1494b | 21696-21772 | copy_layout_rect_to_vram, copy_layout_rect_ram_to_ram |
| `runtime.screens.block_layout_expander` | `routine` | `screens` | `rooted` | 0 | 194l/3798b | 21774-21967 | expand_screen_block_layout_to_background, expand_screen_block_layout_2x2, expand_screen_block_layout_4x4 |
| `runtime.screens.behavior_map_rebuild` | `routine` | `screens` | `candidate_unreferenced` | 0 | 26l/709b | 21985-22010 | build_runtime_behavior_map_from_screen_layout |
| `runtime.screens.load_screen_stub` | `routine` | `screens` | `candidate_unreferenced` | 0 | 6l/232b | 22011-22016 | load_screen |
| `runtime.screens.load_screen_new_playable_screen_777833014252.loader` | `routine` | `screens` | `rooted` | 1 | 122l/5127b | 22018-22139 | load_screen_new_playable_screen_777833014252, load_screen_new_playable_screen_777833014252_skip_vram_copy, load_new_playable_screen_777833014252_boss_done |
| `runtime.sound.init` | `routine` | `sound` | `rooted` | 1 | 22l/725b | 22238-22259 | init_sound_system |
| `runtime.sound.tick` | `routine` | `sound` | `rooted` | 1 | 17l/320b | 22266-22282 | task_audio_tick |
| `runtime.sound.psg_lowlevel` | `routine` | `sound` | `rooted` | 27 | 117l/3450b | 22287-22403 | psg_write, psg_set_tone, psg_set_volume, psg_set_noise, psg_set_mixer, ... (+1) |
| `runtime.sound.sfx_silence` | `routine` | `sound` | `referenced` | 2 | 21l/579b | 22413-22433 | sfx_silence_all |
| `runtime.sound.sfx_builtin_effects` | `routine` | `sound` | `referenced` | 6 | 127l/3025b | 22439-22565 | sfx_beep, sfx_jump, sfx_shoot, sfx_explosion, sfx_coin, ... (+1) |
| `runtime.sound.sfx_playback` | `routine` | `sound` | `referenced` | 1 | 119l/2384b | 22583-22701 | play_sound_effect, play_sound_effect_beep, play_sound_effect_jump, play_sound_effect_shoot, play_sound_effect_explosion, ... (+4) |
| `runtime.sound.music_noop_runtime` | `routine` | `sound` | `referenced` | 5 | 66l/1337b | 22710-22775 | music_init_system, music_reset_channel_state, music_silence_channels, music_stop, music_mute, ... (+7) |
| `runtime.sound.music_reset_noop` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/163b | 22731-22734 | music_reset_channel_state |
| `runtime.gameflow.clear_screen_area_helpers` | `routine` | `gameflow` | `referenced` | 1 | 60l/1737b | 22807-22866 | clear_screen_area, clear_screen_row, empty_row_data |
| `runtime.gameflow.confirm_input_direct` | `routine` | `gameflow` | `referenced` | 1 | 12l/298b | 23340-23351 | gameflow_read_confirm_direct |
| `runtime.gameflow.world_loop` | `routine` | `gameflow` | `rooted` | 31 | 1688l/53226b | 23359-25046 | BANK_10_USED_END, FAR_BANK_11_ROM_START, sprite_asset_frame_count_init, sprite_asset_layer_count_init, sprite_loop_flags_init, ... (+93) |
| `runtime.sprites.show_sprite_legacy` | `routine` | `sprites` | `candidate_unreferenced` | 0 | 43l/981b | 23648-23690 | show_sprite |
| `runtime.animtiles.core` | `routine` | `animtiles` | `rooted` | 10 | 325l/9460b | 23768-24092 | init_animated_tiles, update_animated_tiles, update_animated_tiles_vram, set_animation_speed, anim_copy_8_bytes, ... (+9) |
| `runtime.scroll.core` | `routine` | `scroll` | `rooted` | 5 | 340l/8599b | 24112-24451 | init_scroll_system, set_camera_position, move_camera, center_camera_on_entity, update_scroll, ... (+2) |
| `runtime.worlds.worldmap_1777833018852.loader` | `routine` | `worlds` | `rooted` | 2 | 31l/1281b | 24504-24534 | load_world_worldmap_1777833018852 |
| ... | ... | ... | ... | ... | ... | ... | +2 more blocks |

## Dead-Block Candidates

- `runtime.components.legacy_tile_collision`: 43 lines / 1404 bytes. No external references found for any global label in this block.
- `runtime.sprites.show_sprite_legacy`: 43 lines / 981 bytes. No external references found for any global label in this block.
- `runtime.components.input_trigger_level`: 33 lines / 773 bytes. No external references found for any global label in this block.
- `runtime.screens.behavior_map_rebuild`: 26 lines / 709 bytes. No external references found for any global label in this block.
- `runtime.worlds.current_screen_helpers`: 23 lines / 633 bytes. No external references found for any global label in this block.
- `runtime.sound.resident.tick`: 18 lines / 606 bytes. No external references found for any global label in this block.
- `runtime.components.auto_control_script_stubs`: 7 lines / 252 bytes. No external references found for any global label in this block.
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
- `runtime.hud.empty_update_stubs`: 6 lines / 178 bytes. No external references found for any global label in this block.
- `runtime.components.movement_stub`: 4 lines / 172 bytes. No external references found for any global label in this block.
- `runtime.components.in_water_stub`: 4 lines / 172 bytes. No external references found for any global label in this block.
- `runtime.components.damage_stub`: 4 lines / 166 bytes. No external references found for any global label in this block.
- `runtime.sound.music_reset_noop`: 4 lines / 163 bytes. No external references found for any global label in this block.
- `runtime.components.shoot_stub`: 4 lines / 163 bytes. No external references found for any global label in this block.
- `runtime.font.reload_stub`: 4 lines / 146 bytes. No external references found for any global label in this block.

## state-machine-dispatch-handlers

- Metrics: findings=6, patchable=0, removed_lines=0, removed_source_bytes=0
- Routines: Action_Nop, Action_SetVelocity, Condition_AnimComplete, Condition_KeyPressed, Condition_Nop, Condition_VariableCompare

- [report-only] `Action_Nop` lines 16740-16746: `Action_Nop` is a state-machine action handler referenced by `SM_ActionTable` (43 table reference(s): SM_ActionTable@16691: `DW Action_Nop; 0`, SM_ActionTable@16692: `DW Action_Nop ; 1 [Action_SetPosition stripped]`, SM_ActionTable@16693: `DW Action_Nop ; 2 [Action_MoveBy stripped]`). Direct external references: none. Dispatch id 0 is not listed in `project_usage.stateMachineRuntime.usedActionIds`; this is only an unused-by-metadata signal. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Action_SetVelocity` lines 16747-16823: `Action_SetVelocity` is a state-machine action handler referenced by `SM_ActionTable` (1 table reference(s): SM_ActionTable@16694: `DW Action_SetVelocity; 3`). Direct external references: none. Dispatch id 3 is listed in `project_usage.stateMachineRuntime.usedActionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Condition_Nop` lines 17000-17011: `Condition_Nop` is a state-machine condition handler referenced by `SM_ConditionTable` (15 table reference(s): SM_ConditionTable@16977: `DW Condition_Nop            ; 0`, SM_ConditionTable@16978: `DW Condition_Nop ; 1 [Condition_And stripped]`, SM_ConditionTable@16979: `DW Condition_Nop ; 2 [Condition_Or stripped]`). Direct external references: none. Dispatch id 0 is not listed in `project_usage.stateMachineRuntime.usedConditionIds`; this is only an unused-by-metadata signal. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Condition_KeyPressed` lines 17121-17182: `Condition_KeyPressed` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@16981: `DW Condition_KeyPressed     ; 4`). Direct external references: none. Dispatch id 4 is listed in `project_usage.stateMachineRuntime.usedConditionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Condition_AnimComplete` lines 17183-17205: `Condition_AnimComplete` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@16989: `DW Condition_AnimComplete   ; 12`). Direct external references: none. Dispatch id 12 is not listed in `project_usage.stateMachineRuntime.usedConditionIds`; this is only an unused-by-metadata signal. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Condition_VariableCompare` lines 17206-17391: `Condition_VariableCompare` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@16991: `DW Condition_VariableCompare; 14`). Direct external references: none. Dispatch id 14 is not listed in `project_usage.stateMachineRuntime.usedConditionIds`; this is only an unused-by-metadata signal. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.

