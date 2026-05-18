# Post-ASM Report

- Input: `C:\Users\salam\Documents\Programacion\Mideas\server\temp\joc_tales_9_matrix_megarom_konami_compressed.asm`
- Findings: 11
- Applied patches: 0
- Original lines: 25020
- Output lines: 25020
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

- Marker error: Line 19289: @mideas:endblock without open block.
- Marker error: Line 23333: @mideas:block id=runtime.gameflow.world_loop has no closing @mideas:endblock.

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
| `runtime.mapper.core` | `routine` | `mapper` | `rooted` | 156 | 213l/5412b | 6117-6329 | mapper_runtime_init, mapper_set_bank_p1, mapper_set_bank_p2, mapper_set_bank_p3, mapper_set_bank_p4, ... (+14) |
| `runtime.resources.manager` | `routine` | `resources` | `rooted` | 25 | 697l/18133b | 6521-7217 | resource_manager_init, resource_invalidate_pattern_vram_cache, resource_invalidate_color_vram_cache, resource_invalidate_font_vram_cache, resource_invalidate_gameplay_vram_cache, ... (+14) |
| `runtime.components.input_trigger_level` | `routine` | `components` | `candidate_unreferenced` | 0 | 33l/773b | 7299-7331 | component_trigger_level_pressed_a |
| `runtime.page0.stubs` | `routine` | `unified` | `rooted` | 1 | 22l/505b | 7338-7359 | init_page0_runtime_state, page0_map_expanded_slot, page0_map_game_rom, page0_restore_bios_rom, page0_copy_chunk_to_buffer, ... (+2) |
| `runtime.interrupt.stop` | `routine` | `interrupt` | `rooted` | 0 | 43l/1299b | 7440-7482 | stop_interrupt_system |
| `runtime.interrupt.dispatcher` | `routine` | `interrupt` | `preserved` | 1 | 124l/4150b | 7484-7607 | interrupt_dispatcher |
| `runtime.interrupt.vblank_flag` | `routine` | `interrupt` | `rooted` | 1 | 35l/983b | 7620-7654 | update_vblank_flag |
| `runtime.interrupt.task_api` | `routine` | `interrupt` | `rooted` | 1 | 121l/3195b | 7659-7779 | enable_task, disable_task, get_frame_count |
| `runtime.interrupt.task_input` | `routine` | `interrupt` | `rooted` | 2 | 272l/7149b | 7783-8054 | init_default_tasks_from_plan, task_update_input |
| `runtime.far_trampoline.init_boss_system_far` | `trampoline` | `far-call` | `preserved` | 2 | 26l/702b | 8109-8134 | init_boss_system_far |
| `runtime.far_trampoline.init_screen_boss_from_current_screen_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/842b | 8136-8161 | init_screen_boss_from_current_screen_far |
| `runtime.far_trampoline.update_boss_system_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/716b | 8163-8188 | update_boss_system_far |
| `runtime.far_trampoline.draw_boss_attack_far` | `trampoline` | `far-call` | `preserved` | 0 | 26l/702b | 8190-8215 | draw_boss_attack_far |
| `runtime.far_trampoline.init_sound_system_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/709b | 8355-8380 | init_sound_system_far |
| `runtime.far_trampoline.task_audio_tick_far` | `trampoline` | `far-call` | `preserved` | 0 | 26l/695b | 8382-8407 | task_audio_tick_far |
| `runtime.far_trampoline.sfx_update_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/660b | 8409-8434 | sfx_update_far |
| `runtime.far_trampoline.music_update_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/674b | 8436-8461 | music_update_far |
| `runtime.far_trampoline.music_stop_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/660b | 8463-8488 | music_stop_far |
| `runtime.far_trampoline.music_play_track_far` | `trampoline` | `far-call` | `preserved` | 1 | 28l/739b | 8490-8517 | music_play_track_far |
| `runtime.far_trampoline.music_execute_command_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/737b | 8519-8544 | music_execute_command_far |
| `runtime.sound.resident.init` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/184b | 9603-9606 | call_init_sound_system_resident |
| `runtime.sound.resident.tick` | `routine` | `sound` | `candidate_unreferenced` | 0 | 18l/606b | 9608-9625 | call_task_audio_tick_resident |
| `runtime.sound.resident.music_update` | `routine` | `sound` | `referenced` | 2 | 4l/190b | 9627-9630 | call_music_update_resident |
| `runtime.sound.resident.sfx_update` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/182b | 9632-9635 | call_sfx_update_resident |
| `runtime.sound.resident.music_stop` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/182b | 9637-9640 | call_music_stop_resident |
| `runtime.sound.resident.music_play_track` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/206b | 9642-9645 | call_music_play_track_resident |
| `runtime.sound.resident.music_execute_command` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/226b | 9647-9650 | call_music_execute_command_resident |
| `runtime.boss.resident.init` | `routine` | `bosses` | `preserved` | 0 | 4l/232b | 9764-9767 | call_init_boss_system_resident |
| `runtime.boss.resident.init_screen` | `routine` | `bosses` | `preserved` | 1 | 4l/306b | 9769-9772 | call_init_screen_boss_from_current_screen_resident |
| `runtime.boss.resident.update` | `routine` | `bosses` | `preserved` | 1 | 4l/242b | 9774-9777 | call_update_boss_system_resident |
| `runtime.boss.resident.update_projectile` | `routine` | `bosses` | `preserved` | 0 | 4l/296b | 9779-9782 | call_update_boss_projectile_runtime_resident |
| `runtime.boss.resident.draw_attack` | `routine` | `bosses` | `preserved` | 0 | 4l/242b | 9784-9787 | call_draw_boss_attack_resident |
| `runtime.boss.resident.draw_meteor` | `routine` | `bosses` | `preserved` | 0 | 4l/253b | 9789-9792 | call_draw_boss_meteor_attack_resident |
| `runtime.boss.resident.draw_bomb` | `routine` | `bosses` | `preserved` | 0 | 4l/245b | 9794-9797 | call_draw_boss_bomb_attack_resident |
| `runtime.boss.resident.draw_boomerang` | `routine` | `bosses` | `preserved` | 0 | 4l/265b | 9799-9802 | call_draw_boss_boomerang_attack_resident |
| `runtime.boss.resident.draw_rock` | `routine` | `bosses` | `preserved` | 0 | 4l/245b | 9804-9807 | call_draw_boss_rock_attack_resident |
| `runtime.boss.resident.draw_laser` | `routine` | `bosses` | `preserved` | 0 | 4l/249b | 9809-9812 | call_draw_boss_laser_attack_resident |
| `runtime.boss.resident.draw_sine_wave` | `routine` | `bosses` | `preserved` | 0 | 4l/265b | 9814-9817 | call_draw_boss_sine_wave_attack_resident |
| `runtime.boss.resident.draw_homing_missile` | `routine` | `bosses` | `preserved` | 0 | 4l/285b | 9819-9822 | call_draw_boss_homing_missile_attack_resident |
| `runtime.font.reload_stub` | `routine` | `unified` | `candidate_unreferenced` | 0 | 4l/146b | 9949-9952 | reload_font_system |
| `runtime.components.init` | `routine` | `components` | `rooted` | 11 | 84l/2890b | 10095-10178 | component_fill_32_a, init_components |
| `runtime.components.position` | `routine` | `components` | `rooted` | 3 | 108l/3281b | 10180-10287 | init_position_system, update_position_component, position_update_loop, position_next_entity |
| `runtime.components.sprite` | `routine` | `components` | `rooted` | 6 | 396l/10316b | 10288-10683 | init_sprite_system, update_sprite_component, sprite_update_loop, sprite_layer_loop, sprite_continue, ... (+6) |
| `runtime.components.movement_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 10689-10692 | update_movement_component |
| `runtime.components.collision` | `routine` | `components` | `referenced` | 2 | 668l/18861b | 10693-11360 | init_collision_system, update_collision_component, collision_update_loop, collision_next_entity, update_entity_collision_fast, ... (+13) |
| `runtime.components.behavior_tile` | `routine` | `components` | `rooted` | 9 | 110l/3809b | 11361-11470 | get_behavior_tile, get_behavior_tile_nb, gbt_oob |
| `runtime.components.directional_sprite_sync` | `routine` | `components` | `rooted` | 3 | 87l/2084b | 11471-11557 | component_sync_directional_sprite_from_initial, component_sync_directional_sprite_from_current, component_sync_directional_sprite_common |
| `runtime.components.input` | `routine` | `components` | `referenced` | 2 | 393l/13136b | 11558-11950 | init_input_system, update_input_component, input_update_loop, input_move_up, input_move_down, ... (+16) |
| `runtime.components.health` | `routine` | `components` | `rooted` | 2 | 152l/4701b | 11988-12139 | init_health_system, update_health_component, decrease_entity_lives, increase_entity_lives |
| `runtime.components.animation` | `routine` | `components` | `referenced` | 4 | 342l/10555b | 12140-12481 | init_animation_system, update_animation_component, anim_done_entity, refresh_player_animation_fastpath |
| `runtime.components.jump` | `routine` | `components` | `referenced` | 2 | 233l/7043b | 12482-12714 | init_jump_system, update_jump_component, jump_update_loop, jump_done_entity, jump_next_entity |
| `runtime.components.gravity` | `routine` | `components` | `rooted` | 2 | 137l/4553b | 12715-12851 | init_gravity_system, update_gravity_component, gravity_update_loop, gravity_store_vel, gravity_grounded, ... (+2) |
| `runtime.components.walljump_stub` | `routine` | `components` | `referenced` | 2 | 18l/326b | 12872-12889 | init_walljump_system, update_walljump_component, walljump_process_entity_c, walljump_input_is_left, walljump_input_is_right |
| `runtime.components.auto_destroy_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/219b | 12892-12898 | init_auto_destroy_system, update_auto_destroy_component |
| `runtime.components.state_machine_component_stub` | `routine` | `components` | `referenced` | 1 | 7l/241b | 12922-12928 | init_statemachine_system, update_statemachine_component |
| `runtime.components.retractable_gate_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/196b | 12934-12937 | update_retractable_gate_component |
| `runtime.components.carry` | `routine` | `components` | `rooted` | 1 | 81l/2148b | 12938-13018 | init_carry_system, update_carry_component |
| `runtime.components.damage_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/166b | 13026-13029 | update_damage_component |
| `runtime.components.shoot_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/163b | 13035-13038 | update_shoot_component |
| `runtime.components.platform_riding_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/220b | 13058-13064 | prepare_platform_detection, update_platform_riding |
| `runtime.components.wallcollision` | `routine` | `components` | `referenced` | 3 | 839l/31288b | 13065-13903 | init_wallcollision_system, wall_behavior_is_full_blocker, wall_down_behavior_blocks, update_wallcollision_component, wall_build_hitbox_cache, ... (+2) |
| `runtime.components.deadly_tiles` | `routine` | `components` | `rooted` | 3 | 262l/5874b | 13904-14165 | init_deadly_tiles_system, deadly_tiles_runtime_tile_is_deadly_nb, update_entity_deadly_flag_runtime, update_deadly_tiles_component, refresh_player_deadly_fastpath |
| `runtime.components.in_water_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 14171-14174 | update_in_water_component |
| `runtime.components.collectible_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/181b | 14180-14183 | update_collectible_component |
| `runtime.components.entity_management` | `routine` | `components` | `rooted` | 3 | 221l/6553b | 14201-14421 | create_entity, entity_job_set, entity_job_set_period_ok, entity_job_set_entry_wrap, entity_job_set_entry_ok, ... (+13) |
| `runtime.components.scheduler` | `routine` | `components` | `rooted` | 7 | 1621l/37201b | 14422-16042 | update_all_entities, mark_used_entity_list_dirty, ensure_used_entity_list_current, rebuild_used_entity_list, ensure_player_fast_runtime_bound, ... (+14) |
| `runtime.components.auto_control_script_stubs` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/252b | 15419-15425 | update_auto_control_script_component, update_auto_event_string_component |
| `runtime.components.state_machine_executor` | `routine` | `components` | `rooted` | 2 | 74l/1973b | 16048-16121 | execute_all_state_machines, refresh_player_state_machine_fastpath |
| `runtime.components.legacy_tile_collision` | `routine` | `components` | `candidate_unreferenced` | 0 | 43l/1404b | 16131-16173 | get_tile_at_position, get_tile_behavior, tile_behavior_table, check_collision_at_point, check_collision_box, ... (+1) |
| `runtime.components.secret_zone_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/181b | 16210-16213 | update_secret_zone_component |
| `runtime.statemachine.core` | `routine` | `stateMachine` | `rooted` | 4 | 1140l/26373b | 16221-17360 | SM_Update, sm_timer_no_overflow, sm_timer_paused, sm_update_done, SM_ShouldPauseTimerForDialogue, ... (+24) |
| `data.statemachine.statemachine_1777833246195` | `data` | `stateMachine` | `rooted` | 1 | 25l/863b | 17426-17450 | SM_New_Statemachine_state_1777833253256, SM_New_Statemachine_state_1777833253256_Transitions, SM_New_Statemachine_state_1777833253256_Transitions_Actions_0, SM_New_Statemachine_state_1777833256480 |
| `runtime.gameflow.worldlink` | `routine` | `gameflow` | `rooted` | 1 | 81l/2372b | 17574-17654 | gameflow_handle_worldlink |
| `runtime.gameflow.end_screen` | `routine` | `gameflow` | `rooted` | 5 | 85l/2528b | 17656-17740 | gameflow_handle_end, print_string_vram |
| `runtime.gameflow.connection_by_type` | `routine` | `gameflow` | `empty` | 0 | 3l/216b | 19194-19196 |  |
| `runtime.boss.entry` | `routine` | `bosses` | `rooted` | 2 | 78l/1883b | 19776-19853 | init_boss_system, update_boss_system |
| `runtime.boss.core` | `routine` | `bosses` | `rooted` | 13 | 869l/19524b | 19855-20723 | init_screen_boss_from_current_screen, boss_push_data_bank, boss_pop_data_bank, boss_resolve_initial_phase, boss_init_behavior_state, ... (+24) |
| `data.entities.player_1.init` | `routine` | `entities` | `rooted` | 1 | 207l/5703b | 20924-21130 | init_player_1 |
| `runtime.entities.patrol_facing` | `routine` | `entities` | `rooted` | 0 | 88l/2125b | 21297-21384 | update_entity_patrol_facing |
| `runtime.screens.colors` | `routine` | `screens` | `rooted` | 1 | 44l/1514b | 21498-21541 | color_shift_table, set_screen_colors |
| `runtime.screens.copy_rect` | `routine` | `screens` | `rooted` | 0 | 77l/1494b | 21670-21746 | copy_layout_rect_to_vram, copy_layout_rect_ram_to_ram |
| `runtime.screens.block_layout_expander` | `routine` | `screens` | `rooted` | 0 | 194l/3798b | 21748-21941 | expand_screen_block_layout_to_background, expand_screen_block_layout_2x2, expand_screen_block_layout_4x4 |
| `runtime.screens.behavior_map_rebuild` | `routine` | `screens` | `candidate_unreferenced` | 0 | 26l/709b | 21959-21984 | build_runtime_behavior_map_from_screen_layout |
| `runtime.screens.load_screen_stub` | `routine` | `screens` | `candidate_unreferenced` | 0 | 6l/232b | 21985-21990 | load_screen |
| `runtime.screens.load_screen_new_playable_screen_777833014252.loader` | `routine` | `screens` | `rooted` | 1 | 122l/5127b | 21992-22113 | load_screen_new_playable_screen_777833014252, load_screen_new_playable_screen_777833014252_skip_vram_copy, load_new_playable_screen_777833014252_boss_done |
| `runtime.sound.init` | `routine` | `sound` | `rooted` | 1 | 22l/725b | 22212-22233 | init_sound_system |
| `runtime.sound.tick` | `routine` | `sound` | `rooted` | 1 | 17l/320b | 22240-22256 | task_audio_tick |
| `runtime.sound.psg_lowlevel` | `routine` | `sound` | `rooted` | 27 | 117l/3450b | 22261-22377 | psg_write, psg_set_tone, psg_set_volume, psg_set_noise, psg_set_mixer, ... (+1) |
| `runtime.sound.sfx_silence` | `routine` | `sound` | `referenced` | 2 | 21l/579b | 22387-22407 | sfx_silence_all |
| `runtime.sound.sfx_builtin_effects` | `routine` | `sound` | `referenced` | 6 | 127l/3025b | 22413-22539 | sfx_beep, sfx_jump, sfx_shoot, sfx_explosion, sfx_coin, ... (+1) |
| `runtime.sound.sfx_playback` | `routine` | `sound` | `referenced` | 1 | 119l/2384b | 22557-22675 | play_sound_effect, play_sound_effect_beep, play_sound_effect_jump, play_sound_effect_shoot, play_sound_effect_explosion, ... (+4) |
| `runtime.sound.music_noop_runtime` | `routine` | `sound` | `referenced` | 5 | 66l/1337b | 22684-22749 | music_init_system, music_reset_channel_state, music_silence_channels, music_stop, music_mute, ... (+7) |
| `runtime.sound.music_reset_noop` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/163b | 22705-22708 | music_reset_channel_state |
| `runtime.gameflow.clear_screen_area_helpers` | `routine` | `gameflow` | `referenced` | 1 | 60l/1737b | 22781-22840 | clear_screen_area, clear_screen_row, empty_row_data |
| `runtime.gameflow.confirm_input_direct` | `routine` | `gameflow` | `referenced` | 1 | 12l/298b | 23314-23325 | gameflow_read_confirm_direct |
| `runtime.gameflow.world_loop` | `routine` | `gameflow` | `rooted` | 31 | 1688l/53226b | 23333-25020 | BANK_10_USED_END, FAR_BANK_11_ROM_START, sprite_asset_frame_count_init, sprite_asset_layer_count_init, sprite_loop_flags_init, ... (+93) |
| `runtime.sprites.show_sprite_legacy` | `routine` | `sprites` | `candidate_unreferenced` | 0 | 43l/981b | 23622-23664 | show_sprite |
| `runtime.animtiles.core` | `routine` | `animtiles` | `rooted` | 10 | 325l/9460b | 23742-24066 | init_animated_tiles, update_animated_tiles, update_animated_tiles_vram, set_animation_speed, anim_copy_8_bytes, ... (+9) |
| `runtime.scroll.core` | `routine` | `scroll` | `rooted` | 5 | 340l/8599b | 24086-24425 | init_scroll_system, set_camera_position, move_camera, center_camera_on_entity, update_scroll, ... (+2) |
| `runtime.worlds.worldmap_1777833018852.loader` | `routine` | `worlds` | `rooted` | 2 | 31l/1281b | 24478-24508 | load_world_worldmap_1777833018852 |
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

## unused-component-runtime

- Metrics: findings=11, patchable=0, removed_lines=0, removed_source_bytes=0
- Routines: runtime.components.system.auto_control_script, runtime.components.system.auto_destroy, runtime.components.system.collectible, runtime.components.system.damage, runtime.components.system.in_water, runtime.components.system.movement, runtime.components.system.retractable_gate, runtime.components.system.shoot, runtime.components.system.slash, runtime.components.system.wall_grab, runtime.components.system.wall_jump

- [report-only] `runtime.components.system.movement` lines 10690-10698: `runtime.components.system.movement` covers unused movement component labels: update_movement_component. `project_usage.componentRuntime.usedComponents` is Animation, Behavior, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, so component type `Movement` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Patch policy: report-only.
- [report-only] `runtime.components.system.wall_grab` lines 12862-12864: `runtime.components.system.wall_grab` covers unused wall-grab component labels: update_wallgrab_component. `project_usage.componentRuntime.usedComponents` is Animation, Behavior, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, so component type `WallGrab` is not used by active entities. External references still exist (1): gameflow_world_game_loop->update_wallgrab_component@19265. Deletion stays blocked until the scheduler/caller path is proven dead or grouped. Patch policy: report-only.
- [report-only] `runtime.components.system.wall_jump` lines 12876-12878: `runtime.components.system.wall_jump` covers unused wall-jump component labels: update_walljump_component. `project_usage.componentRuntime.usedComponents` is Animation, Behavior, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, so component type `WallJump` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Patch policy: report-only.
- [report-only] `runtime.components.system.auto_destroy` lines 12896-12907: `runtime.components.system.auto_destroy` covers unused auto-destroy component labels: update_auto_destroy_component. `project_usage.componentRuntime.usedComponents` is Animation, Behavior, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, so component type `AutoDestroy` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Patch policy: report-only.
- [report-only] `runtime.components.system.retractable_gate` lines 12935-12946: `runtime.components.system.retractable_gate` covers unused retractable-gate component labels: update_retractable_gate_component. `project_usage.componentRuntime.usedComponents` is Animation, Behavior, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, so component type `RetractableGate` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Patch policy: report-only.
- [report-only] `runtime.components.system.damage` lines 13027-13031: `runtime.components.system.damage` covers unused damage component labels: update_damage_component. `project_usage.componentRuntime.usedComponents` is Animation, Behavior, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, so component type `Damage` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Patch policy: report-only.
- [report-only] `runtime.components.system.shoot` lines 13036-13043: `runtime.components.system.shoot` covers unused shoot component labels: update_shoot_component. `project_usage.componentRuntime.usedComponents` is Animation, Behavior, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, so component type `Shoot` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Patch policy: report-only.
- [report-only] `runtime.components.system.in_water` lines 14172-14176: `runtime.components.system.in_water` covers unused in-water component labels: update_in_water_component. `project_usage.componentRuntime.usedComponents` is Animation, Behavior, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, so component type `InWater` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Patch policy: report-only.
- [report-only] `runtime.components.system.collectible` lines 14181-14185: `runtime.components.system.collectible` covers unused collectible component labels: update_collectible_component. `project_usage.componentRuntime.usedComponents` is Animation, Behavior, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, so component type `Collectible` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Patch policy: report-only.
- [report-only] `runtime.components.system.slash` lines 14189-14191: `runtime.components.system.slash` covers unused slash component labels: update_slash_component. `project_usage.componentRuntime.usedComponents` is Animation, Behavior, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, so component type `Slash` is not used by active entities. External references still exist (1): update_all_entities->update_slash_component@14468. Deletion stays blocked until the scheduler/caller path is proven dead or grouped. Patch policy: report-only.
- [report-only] `runtime.components.system.auto_control_script` lines 15420-15422: `runtime.components.system.auto_control_script` covers unused auto-control-script component labels: update_auto_control_script_component. `project_usage.componentRuntime.usedComponents` is Animation, Behavior, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, so component type `AutoControlScript` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Patch policy: report-only.

