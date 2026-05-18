# Post-ASM Report

- Input: `C:\Users\salam\Documents\Programacion\Mideas\server\temp\joc_tales_9_matrix_megarom_konami_compressed.asm`
- Findings: 115
- Applied patches: 52
- Original lines: 25020
- Output lines: 24159
- Net line delta: -861

- Optimization passes run: 4
- Optimization source removed: 861 lines / 23840 bytes

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

## Inactive Feature Runtime Inventory

| Feature | Findings | Patchable | Annotated | Unannotated | Preserved | Owners |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `sounds` | 31 | 0 | 31 | 0 | 7 | far-call=7, sound=24 |

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

## ROM Validation

- Original ROM bytes: 155648
- Optimized ROM bytes: 155648
- ROM byte delta: 0
- ROM SHA256 equal: False

## dead-blocks

- Metrics: findings=25, patchable=25, removed_lines=275, removed_source_bytes=8727
- Routines: runtime.components.auto_control_script_stubs, runtime.components.auto_destroy_stub, runtime.components.collectible_stub, runtime.components.damage_stub, runtime.components.in_water_stub, runtime.components.input_trigger_level, runtime.components.legacy_tile_collision, runtime.components.movement_stub, runtime.components.platform_riding_stub, runtime.components.retractable_gate_stub, runtime.components.secret_zone_stub, runtime.components.shoot_stub, runtime.font.reload_stub, runtime.hud.empty_update_stubs, runtime.screens.behavior_map_rebuild, runtime.screens.load_screen_stub, runtime.sound.music_reset_noop, runtime.sound.resident.init, runtime.sound.resident.music_execute_command, runtime.sound.resident.music_play_track, runtime.sound.resident.music_stop, runtime.sound.resident.sfx_update, runtime.sound.resident.tick, runtime.sprites.show_sprite_legacy, runtime.worlds.current_screen_helpers

- [patchable] `runtime.components.input_trigger_level` lines 7299-7331: Block `runtime.components.input_trigger_level` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: component_trigger_level_pressed_a.
- [patchable] `runtime.sound.resident.init` lines 9603-9606: Block `runtime.sound.resident.init` (routine/sound) is a dead-code candidate. No external references found for any global label in this block. Labels: call_init_sound_system_resident.
- [patchable] `runtime.sound.resident.tick` lines 9608-9625: Block `runtime.sound.resident.tick` (routine/sound) is a dead-code candidate. No external references found for any global label in this block. Labels: call_task_audio_tick_resident.
- [patchable] `runtime.sound.resident.sfx_update` lines 9632-9635: Block `runtime.sound.resident.sfx_update` (routine/sound) is a dead-code candidate. No external references found for any global label in this block. Labels: call_sfx_update_resident.
- [patchable] `runtime.sound.resident.music_stop` lines 9637-9640: Block `runtime.sound.resident.music_stop` (routine/sound) is a dead-code candidate. No external references found for any global label in this block. Labels: call_music_stop_resident.
- [patchable] `runtime.sound.resident.music_play_track` lines 9642-9645: Block `runtime.sound.resident.music_play_track` (routine/sound) is a dead-code candidate. No external references found for any global label in this block. Labels: call_music_play_track_resident.
- [patchable] `runtime.sound.resident.music_execute_command` lines 9647-9650: Block `runtime.sound.resident.music_execute_command` (routine/sound) is a dead-code candidate. No external references found for any global label in this block. Labels: call_music_execute_command_resident.
- [patchable] `runtime.font.reload_stub` lines 9949-9952: Block `runtime.font.reload_stub` (routine/unified) is a dead-code candidate. No external references found for any global label in this block. Labels: reload_font_system.
- [patchable] `runtime.components.movement_stub` lines 10689-10692: Block `runtime.components.movement_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_movement_component.
- [patchable] `runtime.components.auto_destroy_stub` lines 12892-12898: Block `runtime.components.auto_destroy_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: init_auto_destroy_system, update_auto_destroy_component.
- [patchable] `runtime.components.retractable_gate_stub` lines 12934-12937: Block `runtime.components.retractable_gate_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_retractable_gate_component.
- [patchable] `runtime.components.damage_stub` lines 13026-13029: Block `runtime.components.damage_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_damage_component.
- [patchable] `runtime.components.shoot_stub` lines 13035-13038: Block `runtime.components.shoot_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_shoot_component.
- [patchable] `runtime.components.platform_riding_stub` lines 13058-13064: Block `runtime.components.platform_riding_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: prepare_platform_detection, update_platform_riding.
- [patchable] `runtime.components.in_water_stub` lines 14171-14174: Block `runtime.components.in_water_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_in_water_component.
- [patchable] `runtime.components.collectible_stub` lines 14180-14183: Block `runtime.components.collectible_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_collectible_component.
- [patchable] `runtime.components.auto_control_script_stubs` lines 15419-15425: Block `runtime.components.auto_control_script_stubs` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_auto_control_script_component, update_auto_event_string_component.
- [patchable] `runtime.components.legacy_tile_collision` lines 16131-16173: Block `runtime.components.legacy_tile_collision` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: get_tile_at_position, get_tile_behavior, tile_behavior_table, check_collision_at_point, check_collision_box, ... (+1).
- [patchable] `runtime.components.secret_zone_stub` lines 16210-16213: Block `runtime.components.secret_zone_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_secret_zone_component.
- [patchable] `runtime.screens.behavior_map_rebuild` lines 21959-21984: Block `runtime.screens.behavior_map_rebuild` (routine/screens) is a dead-code candidate. No external references found for any global label in this block. Labels: build_runtime_behavior_map_from_screen_layout.
- [patchable] `runtime.screens.load_screen_stub` lines 21985-21990: Block `runtime.screens.load_screen_stub` (routine/screens) is a dead-code candidate. No external references found for any global label in this block. Labels: load_screen.
- [patchable] `runtime.sound.music_reset_noop` lines 22705-22708: Block `runtime.sound.music_reset_noop` (routine/sound) is a dead-code candidate. No external references found for any global label in this block. Labels: music_reset_channel_state.
- [patchable] `runtime.sprites.show_sprite_legacy` lines 23622-23664: Block `runtime.sprites.show_sprite_legacy` (routine/sprites) is a dead-code candidate. No external references found for any global label in this block. Labels: show_sprite.
- [patchable] `runtime.worlds.current_screen_helpers` lines 24588-24610: Block `runtime.worlds.current_screen_helpers` (routine/worlds) is a dead-code candidate. No external references found for any global label in this block. Labels: get_current_world_id, get_current_screen_index, set_current_screen.
- [patchable] `runtime.hud.empty_update_stubs` lines 25008-25013: Block `runtime.hud.empty_update_stubs` (routine/hud) is a dead-code candidate. No external references found for any global label in this block. Labels: update_hud_score, update_hud_lives.

## inactive-feature-runtime

- Metrics: findings=53, patchable=15, removed_lines=243, removed_source_bytes=6643
- Routines: call_init_sound_system_resident, call_music_execute_command_resident, call_music_play_track_resident, call_music_stop_resident, call_music_update_resident, call_sfx_update_resident, call_task_audio_tick_resident, init_sound_system, init_sound_system_far, music_execute_command, music_execute_command_far, music_init_system, music_play_track, music_play_track_far, music_reset_channel_state, music_silence_channels, music_stop, music_stop_far, music_update_far, runtime.sound.group.init, runtime.sound.group.init:call_init_sound_system_resident, runtime.sound.group.init:init_sound_system, runtime.sound.group.init:init_sound_system_far, runtime.sound.group.music_execute_command, runtime.sound.group.music_execute_command:call_music_execute_command_resident, runtime.sound.group.music_execute_command:music_execute_command, runtime.sound.group.music_execute_command:music_execute_command_far, runtime.sound.group.music_play_track, runtime.sound.group.music_play_track:call_music_play_track_resident, runtime.sound.group.music_play_track:music_play_track, runtime.sound.group.music_play_track:music_play_track_far, runtime.sound.group.music_stop, runtime.sound.group.music_update, runtime.sound.group.sfx_update, runtime.sound.group.sfx_update:call_sfx_update_resident, runtime.sound.group.sfx_update:sfx_update, runtime.sound.group.sfx_update:sfx_update_far, runtime.sound.group.tick, runtime.sound.group.tick:call_task_audio_tick_resident, runtime.sound.group.tick:task_audio_tick, runtime.sound.group.tick:task_audio_tick_far, sfx_beep, sfx_coin, sfx_damage, sfx_explosion, sfx_jump, sfx_play, sfx_shoot, sfx_silence_all, sfx_update, sfx_update_far, task_audio_tick, task_audio_tick_far

- [patchable] `runtime.sound.group.init:init_sound_system_far` lines 8355-8380: `init_sound_system_far` is part of inactive runtime group `runtime.sound.group.init`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.sound.group.init` lines 8356-22240: `runtime.sound.group.init` groups inactive audio init runtime labels: call_init_sound_system_resident, init_sound_system, init_sound_system_far. No external references outside the group were found. This is ready for a future atomic multi-window patch, or for dead-blocks to remove the annotated windows as whole groups. Atomic patch enabled as `runtime.sound.group.init` with 3 window(s).
- [report-only] `init_sound_system_far` lines 8356-8382: `init_sound_system_far` looks like audio runtime (27 lines, 708 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: boot_or_init (Boot/init routine). External references still exist (1): call_init_sound_system_resident@9605. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.far_trampoline.init_sound_system_far` owner=`far-call` preserve=true. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.tick:task_audio_tick_far` lines 8382-8407: `task_audio_tick_far` is part of inactive runtime group `runtime.sound.group.tick`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.sound.group.tick` lines 8383-22269: `runtime.sound.group.tick` groups inactive audio tick runtime labels: call_task_audio_tick_resident, task_audio_tick, task_audio_tick_far. No external references outside the group were found. This is ready for a future atomic multi-window patch, or for dead-blocks to remove the annotated windows as whole groups. Atomic patch enabled as `runtime.sound.group.tick` with 3 window(s).
- [report-only] `task_audio_tick_far` lines 8383-8409: `task_audio_tick_far` looks like audio runtime (27 lines, 691 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.far_trampoline.task_audio_tick_far` owner=`far-call` preserve=true. Patch remains disabled because `task_audio_tick_far` is inside annotated block `runtime.far_trampoline.task_audio_tick_far`; group-level deletion must be handled by dead-blocks. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.sfx_update:sfx_update_far` lines 8409-8434: `sfx_update_far` is part of inactive runtime group `runtime.sound.group.sfx_update`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.sound.group.sfx_update` lines 8410-22684: `runtime.sound.group.sfx_update` groups inactive SFX update runtime labels: call_sfx_update_resident, sfx_update, sfx_update_far. No external references outside the group were found. This is ready for a future atomic multi-window patch, or for dead-blocks to remove the annotated windows as whole groups. Atomic patch enabled as `runtime.sound.group.sfx_update` with 3 window(s).
- [report-only] `sfx_update_far` lines 8410-8436: `sfx_update_far` looks like audio runtime (27 lines, 663 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_sfx_update_resident@9634. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.far_trampoline.sfx_update_far` owner=`far-call` preserve=true. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `runtime.sound.group.music_update` lines 8437-22731: `runtime.sound.group.music_update` groups inactive music update runtime labels: call_music_update_resident, music_update, music_update_far. Group deletion remains blocked by 2 external references: call_task_audio_tick_resident->call_music_update_resident@9618, task_audio_tick->call_music_update_resident@22247.
- [report-only] `music_update_far` lines 8437-8463: `music_update_far` looks like audio runtime (27 lines, 673 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_music_update_resident@9629. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.far_trampoline.music_update_far` owner=`far-call` preserve=true. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `runtime.sound.group.music_stop` lines 8464-22728: `runtime.sound.group.music_stop` groups inactive music stop runtime labels: call_music_stop_resident, music_stop, music_stop_far. Group deletion remains blocked by 1 external references: music_execute_command->music_stop@22741.
- [report-only] `music_stop_far` lines 8464-8490: `music_stop_far` looks like audio runtime (27 lines, 667 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_music_stop_resident@9639. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.far_trampoline.music_stop_far` owner=`far-call` preserve=true. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.music_play_track:music_play_track_far` lines 8490-8517: `music_play_track_far` is part of inactive runtime group `runtime.sound.group.music_play_track`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.sound.group.music_play_track` lines 8491-22735: `runtime.sound.group.music_play_track` groups inactive music play-track runtime labels: call_music_play_track_resident, music_play_track, music_play_track_far. No external references outside the group were found. This is ready for a future atomic multi-window patch, or for dead-blocks to remove the annotated windows as whole groups. Atomic patch enabled as `runtime.sound.group.music_play_track` with 3 window(s).
- [report-only] `music_play_track_far` lines 8491-8519: `music_play_track_far` looks like audio runtime (29 lines, 745 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_music_play_track_resident@9644. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.far_trampoline.music_play_track_far` owner=`far-call` preserve=true. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.music_execute_command:music_execute_command_far` lines 8519-8544: `music_execute_command_far` is part of inactive runtime group `runtime.sound.group.music_execute_command`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.sound.group.music_execute_command` lines 8520-22743: `runtime.sound.group.music_execute_command` groups inactive music command runtime labels: call_music_execute_command_resident, music_execute_command, music_execute_command_far. No external references outside the group were found. This is ready for a future atomic multi-window patch, or for dead-blocks to remove the annotated windows as whole groups. Atomic patch enabled as `runtime.sound.group.music_execute_command` with 3 window(s).
- [report-only] `music_execute_command_far` lines 8520-8548: `music_execute_command_far` looks like audio runtime (29 lines, 698 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_music_execute_command_resident@9649. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.far_trampoline.music_execute_command_far` owner=`far-call` preserve=true. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.init:call_init_sound_system_resident` lines 9603-9606: `call_init_sound_system_resident` is part of inactive runtime group `runtime.sound.group.init`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_init_sound_system_resident` lines 9604-9608: `call_init_sound_system_resident` looks like audio runtime (5 lines, 185 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.sound.resident.init` owner=`sound` preserve=false. Patch remains disabled because `call_init_sound_system_resident` is inside annotated block `runtime.sound.resident.init`; group-level deletion must be handled by dead-blocks. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.tick:call_task_audio_tick_resident` lines 9608-9625: `call_task_audio_tick_resident` is part of inactive runtime group `runtime.sound.group.tick`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_task_audio_tick_resident` lines 9609-9627: `call_task_audio_tick_resident` looks like audio runtime (19 lines, 615 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.sound.resident.tick` owner=`sound` preserve=false. Patch remains disabled because `call_task_audio_tick_resident` is inside annotated block `runtime.sound.resident.tick`; group-level deletion must be handled by dead-blocks. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_music_update_resident` lines 9628-9632: `call_music_update_resident` looks like audio runtime (5 lines, 189 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (2): call_task_audio_tick_resident@9618, task_audio_tick@22247. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.sound.resident.music_update` owner=`sound` preserve=false. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.sfx_update:call_sfx_update_resident` lines 9632-9635: `call_sfx_update_resident` is part of inactive runtime group `runtime.sound.group.sfx_update`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_sfx_update_resident` lines 9633-9637: `call_sfx_update_resident` looks like audio runtime (5 lines, 183 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.sound.resident.sfx_update` owner=`sound` preserve=false. Patch remains disabled because `call_sfx_update_resident` is inside annotated block `runtime.sound.resident.sfx_update`; group-level deletion must be handled by dead-blocks. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_music_stop_resident` lines 9638-9642: `call_music_stop_resident` looks like audio runtime (5 lines, 189 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.sound.resident.music_stop` owner=`sound` preserve=false. Patch remains disabled because `call_music_stop_resident` is inside annotated block `runtime.sound.resident.music_stop`; group-level deletion must be handled by dead-blocks. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.music_play_track:call_music_play_track_resident` lines 9642-9645: `call_music_play_track_resident` is part of inactive runtime group `runtime.sound.group.music_play_track`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_music_play_track_resident` lines 9643-9647: `call_music_play_track_resident` looks like audio runtime (5 lines, 212 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.sound.resident.music_play_track` owner=`sound` preserve=false. Patch remains disabled because `call_music_play_track_resident` is inside annotated block `runtime.sound.resident.music_play_track`; group-level deletion must be handled by dead-blocks. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.music_execute_command:call_music_execute_command_resident` lines 9647-9650: `call_music_execute_command_resident` is part of inactive runtime group `runtime.sound.group.music_execute_command`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_music_execute_command_resident` lines 9648-9651: `call_music_execute_command_resident` looks like audio runtime (4 lines, 138 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.sound.resident.music_execute_command` owner=`sound` preserve=false. Patch remains disabled because `call_music_execute_command_resident` is inside annotated block `runtime.sound.resident.music_execute_command`; group-level deletion must be handled by dead-blocks. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.init:init_sound_system` lines 22212-22233: `init_sound_system` is part of inactive runtime group `runtime.sound.group.init`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `init_sound_system` lines 22213-22240: `init_sound_system` looks like audio runtime (28 lines, 1006 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: boot_or_init (Boot/init routine). External references still exist (1): init_sound_system_far@8365. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.sound.init` owner=`sound` preserve=false. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.tick:task_audio_tick` lines 22240-22256: `task_audio_tick` is part of inactive runtime group `runtime.sound.group.tick`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `task_audio_tick` lines 22241-22269: `task_audio_tick` looks like audio runtime (29 lines, 836 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: shared_runtime (Shared low-level runtime helper). External references still exist (1): task_audio_tick_far@8392. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.sound.tick` owner=`sound` preserve=false. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_silence_all` lines 22388-22413: `sfx_silence_all` looks like audio runtime (26 lines, 757 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (2): init_sound_system@22230, sfx_update@22671. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.sound.sfx_silence` owner=`sound` preserve=false. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_beep` lines 22414-22434: `sfx_beep` looks like audio runtime (21 lines, 492 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_beep@22576. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.sound.sfx_builtin_effects` owner=`sound` preserve=false. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_jump` lines 22435-22456: `sfx_jump` looks like audio runtime (22 lines, 473 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_jump@22582. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.sound.sfx_builtin_effects` owner=`sound` preserve=false. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_shoot` lines 22457-22481: `sfx_shoot` looks like audio runtime (25 lines, 565 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_shoot@22588. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.sound.sfx_builtin_effects` owner=`sound` preserve=false. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_explosion` lines 22482-22501: `sfx_explosion` looks like audio runtime (20 lines, 497 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_explosion@22594. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.sound.sfx_builtin_effects` owner=`sound` preserve=false. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_coin` lines 22502-22523: `sfx_coin` looks like audio runtime (22 lines, 536 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_coin@22600. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.sound.sfx_builtin_effects` owner=`sound` preserve=false. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_damage` lines 22524-22557: `sfx_damage` looks like audio runtime (34 lines, 1140 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_damage@22606. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.sound.sfx_builtin_effects` owner=`sound` preserve=false. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_play` lines 22617-22645: `sfx_play` looks like audio runtime (29 lines, 600 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (6): play_sound_effect_beep@22578, play_sound_effect_jump@22584, play_sound_effect_shoot@22590, play_sound_effect_explosion@22596, play_sound_effect_coin@22602, ... (+1 more). Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.sound.sfx_playback` owner=`sound` preserve=false. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.sfx_update:sfx_update` lines 22646-22674: `sfx_update` is part of inactive runtime group `runtime.sound.group.sfx_update`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `sfx_update` lines 22646-22684: `sfx_update` looks like audio runtime (39 lines, 1016 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): sfx_update_far@8419. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.sound.sfx_playback` owner=`sound` preserve=false. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `music_init_system` lines 22685-22705: `music_init_system` looks like audio runtime (21 lines, 566 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (2): init_sound_system@22227, music_stop@22725. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.sound.music_noop_runtime` owner=`sound` preserve=false. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `music_reset_channel_state` lines 22706-22709: `music_reset_channel_state` looks like audio runtime (4 lines, 89 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.sound.music_reset_noop` owner=`sound` preserve=false. Patch remains disabled because `music_reset_channel_state` is inside annotated block `runtime.sound.music_reset_noop`; group-level deletion must be handled by dead-blocks. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `music_silence_channels` lines 22710-22723: `music_silence_channels` looks like audio runtime (14 lines, 212 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): music_stop@22726. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.sound.music_noop_runtime` owner=`sound` preserve=false. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `music_stop` lines 22724-22728: `music_stop` looks like audio runtime (5 lines, 80 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (2): music_stop_far@8473, music_execute_command@22741. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.sound.music_noop_runtime` owner=`sound` preserve=false. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.music_play_track:music_play_track` lines 22733-22734: `music_play_track` is part of inactive runtime group `runtime.sound.group.music_play_track`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `music_play_track` lines 22733-22735: `music_play_track` looks like audio runtime (3 lines, 27 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): music_play_track_far@8501. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.sound.music_noop_runtime` owner=`sound` preserve=false. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.music_execute_command:music_execute_command` lines 22736-22742: `music_execute_command` is part of inactive runtime group `runtime.sound.group.music_execute_command`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `music_execute_command` lines 22736-22743: `music_execute_command` looks like audio runtime (8 lines, 98 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): music_execute_command_far@8529. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.sound.music_noop_runtime` owner=`sound` preserve=false. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.

## unused-boss-attack-runtime

- Metrics: findings=17, patchable=7, removed_lines=28, removed_source_bytes=1807
- Routines: runtime.boss.attack.bomb, runtime.boss.attack.bomb:call_draw_boss_bomb_attack_resident, runtime.boss.attack.boomerang, runtime.boss.attack.boomerang:call_draw_boss_boomerang_attack_resident, runtime.boss.attack.falling_blocks, runtime.boss.attack.homing_missile, runtime.boss.attack.homing_missile:call_draw_boss_homing_missile_attack_resident, runtime.boss.attack.laser, runtime.boss.attack.laser:call_draw_boss_laser_attack_resident, runtime.boss.attack.meteor, runtime.boss.attack.meteor:call_draw_boss_meteor_attack_resident, runtime.boss.attack.projectile, runtime.boss.attack.rock, runtime.boss.attack.rock:call_draw_boss_rock_attack_resident, runtime.boss.attack.sine_wave, runtime.boss.attack.sine_wave:call_draw_boss_sine_wave_attack_resident, runtime.boss.attack.slam_rocks

- [report-only] `runtime.boss.attack.projectile` lines 9781-20716: `runtime.boss.attack.projectile` covers boss projectile attack labels: boss_projectile_hide_all, boss_projectile_select_velocity, boss_projectile_show_current, call_update_boss_projectile_runtime_resident, draw_boss_projectile_attack, update_boss_projectile_runtime. `project_usage.bossAttackRuntime.usedTypes` is none, so attack type `Projectile` is not used by any referenced boss attack. External references still exist (1): update_entity_ladder_state_c->boss_projectile_hide_all@15373. Deletion stays blocked until the caller path is proven dead or grouped. Patch policy: report-only.
- [patchable] `runtime.boss.attack.meteor:call_draw_boss_meteor_attack_resident` lines 9789-9792: `call_draw_boss_meteor_attack_resident` is part of unused boss attack group `runtime.boss.attack.meteor`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.boss.attack.meteor` lines 9791-9794: `runtime.boss.attack.meteor` covers boss meteor attack labels: call_draw_boss_meteor_attack_resident. `project_usage.bossAttackRuntime.usedTypes` is none, so attack type `Meteor` is not used by any referenced boss attack. No external references outside this attack group were found. This is a candidate for a future atomic type-specific patch. Atomic patch enabled as `runtime.boss.attack.meteor` with 1 window(s).
- [patchable] `runtime.boss.attack.bomb:call_draw_boss_bomb_attack_resident` lines 9794-9797: `call_draw_boss_bomb_attack_resident` is part of unused boss attack group `runtime.boss.attack.bomb`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.boss.attack.bomb` lines 9796-9799: `runtime.boss.attack.bomb` covers boss bomb attack labels: call_draw_boss_bomb_attack_resident. `project_usage.bossAttackRuntime.usedTypes` is none, so attack type `Bomb` is not used by any referenced boss attack. No external references outside this attack group were found. This is a candidate for a future atomic type-specific patch. Atomic patch enabled as `runtime.boss.attack.bomb` with 1 window(s).
- [patchable] `runtime.boss.attack.boomerang:call_draw_boss_boomerang_attack_resident` lines 9799-9802: `call_draw_boss_boomerang_attack_resident` is part of unused boss attack group `runtime.boss.attack.boomerang`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.boss.attack.boomerang` lines 9801-9804: `runtime.boss.attack.boomerang` covers boss boomerang attack labels: call_draw_boss_boomerang_attack_resident. `project_usage.bossAttackRuntime.usedTypes` is none, so attack type `Boomerang` is not used by any referenced boss attack. No external references outside this attack group were found. This is a candidate for a future atomic type-specific patch. Atomic patch enabled as `runtime.boss.attack.boomerang` with 1 window(s).
- [patchable] `runtime.boss.attack.rock:call_draw_boss_rock_attack_resident` lines 9804-9807: `call_draw_boss_rock_attack_resident` is part of unused boss attack group `runtime.boss.attack.rock`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.boss.attack.rock` lines 9806-9809: `runtime.boss.attack.rock` covers boss rock attack labels: call_draw_boss_rock_attack_resident. `project_usage.bossAttackRuntime.usedTypes` is none, so attack type `Rock` is not used by any referenced boss attack. No external references outside this attack group were found. This is a candidate for a future atomic type-specific patch. Atomic patch enabled as `runtime.boss.attack.rock` with 1 window(s).
- [patchable] `runtime.boss.attack.laser:call_draw_boss_laser_attack_resident` lines 9809-9812: `call_draw_boss_laser_attack_resident` is part of unused boss attack group `runtime.boss.attack.laser`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.boss.attack.laser` lines 9811-9814: `runtime.boss.attack.laser` covers boss laser attack labels: call_draw_boss_laser_attack_resident. `project_usage.bossAttackRuntime.usedTypes` is none, so attack type `Laser` is not used by any referenced boss attack. No external references outside this attack group were found. This is a candidate for a future atomic type-specific patch. Atomic patch enabled as `runtime.boss.attack.laser` with 1 window(s).
- [patchable] `runtime.boss.attack.sine_wave:call_draw_boss_sine_wave_attack_resident` lines 9814-9817: `call_draw_boss_sine_wave_attack_resident` is part of unused boss attack group `runtime.boss.attack.sine_wave`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.boss.attack.sine_wave` lines 9816-9819: `runtime.boss.attack.sine_wave` covers boss sine-wave attack labels: call_draw_boss_sine_wave_attack_resident. `project_usage.bossAttackRuntime.usedTypes` is none, so attack type `SineWave` is not used by any referenced boss attack. No external references outside this attack group were found. This is a candidate for a future atomic type-specific patch. Atomic patch enabled as `runtime.boss.attack.sine_wave` with 1 window(s).
- [patchable] `runtime.boss.attack.homing_missile:call_draw_boss_homing_missile_attack_resident` lines 9819-9822: `call_draw_boss_homing_missile_attack_resident` is part of unused boss attack group `runtime.boss.attack.homing_missile`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.boss.attack.homing_missile` lines 9821-9823: `runtime.boss.attack.homing_missile` covers boss homing missile attack labels: call_draw_boss_homing_missile_attack_resident. `project_usage.bossAttackRuntime.usedTypes` is none, so attack type `HomingMissile` is not used by any referenced boss attack. No external references outside this attack group were found. This is a candidate for a future atomic type-specific patch. Atomic patch enabled as `runtime.boss.attack.homing_missile` with 1 window(s).
- [report-only] `runtime.boss.attack.slam_rocks` lines 20718-20720: `runtime.boss.attack.slam_rocks` covers boss slam-rocks attack labels: boss_slam_rocks_hide_all. `project_usage.bossAttackRuntime.usedTypes` is none, so attack type `SlamRocks` is not used by any referenced boss attack. External references still exist (1): update_entity_ladder_state_c->boss_slam_rocks_hide_all@15378. Deletion stays blocked until the caller path is proven dead or grouped. Patch policy: report-only.
- [report-only] `runtime.boss.attack.falling_blocks` lines 20722-20724: `runtime.boss.attack.falling_blocks` covers boss falling-blocks attack labels: boss_falling_blocks_hide_all. `project_usage.bossAttackRuntime.usedTypes` is none, so attack type `FallingBlocks` is not used by any referenced boss attack. External references still exist (1): update_entity_ladder_state_c->boss_falling_blocks_hide_all@15383. Deletion stays blocked until the caller path is proven dead or grouped. Patch policy: report-only.

## unused-component-runtime

- Metrics: findings=20, patchable=9, removed_lines=30, removed_source_bytes=1170
- Routines: runtime.components.system.auto_control_script, runtime.components.system.auto_control_script:update_auto_control_script_component, runtime.components.system.auto_destroy, runtime.components.system.auto_destroy:update_auto_destroy_component, runtime.components.system.collectible, runtime.components.system.collectible:update_collectible_component, runtime.components.system.damage, runtime.components.system.damage:update_damage_component, runtime.components.system.in_water, runtime.components.system.in_water:update_in_water_component, runtime.components.system.movement, runtime.components.system.movement:update_movement_component, runtime.components.system.retractable_gate, runtime.components.system.retractable_gate:update_retractable_gate_component, runtime.components.system.shoot, runtime.components.system.shoot:update_shoot_component, runtime.components.system.slash, runtime.components.system.wall_grab, runtime.components.system.wall_jump, runtime.components.system.wall_jump:update_walljump_component

- [patchable] `runtime.components.system.movement:update_movement_component` lines 10689-10692: `update_movement_component` is part of unused component runtime group `runtime.components.system.movement`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.components.system.movement` lines 10690-10698: `runtime.components.system.movement` covers unused movement component labels: update_movement_component. `project_usage.componentRuntime.usedComponents` is Animation, Behavior, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, so component type `Movement` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.movement` with 1 window(s).
- [report-only] `runtime.components.system.wall_grab` lines 12862-12864: `runtime.components.system.wall_grab` covers unused wall-grab component labels: update_wallgrab_component. `project_usage.componentRuntime.usedComponents` is Animation, Behavior, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, so component type `WallGrab` is not used by active entities. External references still exist (1): gameflow_world_game_loop->update_wallgrab_component@19265. Deletion stays blocked until the scheduler/caller path is proven dead or grouped. Patch policy: report-only.
- [report-only] `runtime.components.system.wall_jump` lines 12876-12878: `runtime.components.system.wall_jump` covers unused wall-jump component labels: update_walljump_component. `project_usage.componentRuntime.usedComponents` is Animation, Behavior, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, so component type `WallJump` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.wall_jump` with 1 window(s).
- [patchable] `runtime.components.system.wall_jump:update_walljump_component` lines 12876-12877: `update_walljump_component` is part of unused component runtime group `runtime.components.system.wall_jump`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.components.system.auto_destroy` lines 12896-12907: `runtime.components.system.auto_destroy` covers unused auto-destroy component labels: update_auto_destroy_component. `project_usage.componentRuntime.usedComponents` is Animation, Behavior, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, so component type `AutoDestroy` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.auto_destroy` with 1 window(s).
- [patchable] `runtime.components.system.auto_destroy:update_auto_destroy_component` lines 12896-12897: `update_auto_destroy_component` is part of unused component runtime group `runtime.components.system.auto_destroy`. The group has no external references, so this window is removed only together with the other group windows.
- [patchable] `runtime.components.system.retractable_gate:update_retractable_gate_component` lines 12934-12937: `update_retractable_gate_component` is part of unused component runtime group `runtime.components.system.retractable_gate`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.components.system.retractable_gate` lines 12935-12946: `runtime.components.system.retractable_gate` covers unused retractable-gate component labels: update_retractable_gate_component. `project_usage.componentRuntime.usedComponents` is Animation, Behavior, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, so component type `RetractableGate` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.retractable_gate` with 1 window(s).
- [patchable] `runtime.components.system.damage:update_damage_component` lines 13026-13029: `update_damage_component` is part of unused component runtime group `runtime.components.system.damage`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.components.system.damage` lines 13027-13031: `runtime.components.system.damage` covers unused damage component labels: update_damage_component. `project_usage.componentRuntime.usedComponents` is Animation, Behavior, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, so component type `Damage` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.damage` with 1 window(s).
- [patchable] `runtime.components.system.shoot:update_shoot_component` lines 13035-13038: `update_shoot_component` is part of unused component runtime group `runtime.components.system.shoot`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.components.system.shoot` lines 13036-13043: `runtime.components.system.shoot` covers unused shoot component labels: update_shoot_component. `project_usage.componentRuntime.usedComponents` is Animation, Behavior, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, so component type `Shoot` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.shoot` with 1 window(s).
- [patchable] `runtime.components.system.in_water:update_in_water_component` lines 14171-14174: `update_in_water_component` is part of unused component runtime group `runtime.components.system.in_water`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.components.system.in_water` lines 14172-14176: `runtime.components.system.in_water` covers unused in-water component labels: update_in_water_component. `project_usage.componentRuntime.usedComponents` is Animation, Behavior, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, so component type `InWater` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.in_water` with 1 window(s).
- [patchable] `runtime.components.system.collectible:update_collectible_component` lines 14180-14183: `update_collectible_component` is part of unused component runtime group `runtime.components.system.collectible`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.components.system.collectible` lines 14181-14185: `runtime.components.system.collectible` covers unused collectible component labels: update_collectible_component. `project_usage.componentRuntime.usedComponents` is Animation, Behavior, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, so component type `Collectible` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.collectible` with 1 window(s).
- [report-only] `runtime.components.system.slash` lines 14189-14191: `runtime.components.system.slash` covers unused slash component labels: update_slash_component. `project_usage.componentRuntime.usedComponents` is Animation, Behavior, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, so component type `Slash` is not used by active entities. External references still exist (1): update_all_entities->update_slash_component@14468. Deletion stays blocked until the scheduler/caller path is proven dead or grouped. Patch policy: report-only.
- [report-only] `runtime.components.system.auto_control_script` lines 15420-15422: `runtime.components.system.auto_control_script` covers unused auto-control-script component labels: update_auto_control_script_component. `project_usage.componentRuntime.usedComponents` is Animation, Behavior, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, so component type `AutoControlScript` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.auto_control_script` with 1 window(s).
- [patchable] `runtime.components.system.auto_control_script:update_auto_control_script_component` lines 15420-15421: `update_auto_control_script_component` is part of unused component runtime group `runtime.components.system.auto_control_script`. The group has no external references, so this window is removed only together with the other group windows.

## Optimization Passes

- Pass 1: findings=115, patchable=43, removed=514 lines / 15808 bytes, lines=25020->24506
- Pass 2: findings=29, patchable=7, removed=172 lines / 4049 bytes, lines=24506->24334
- Pass 3: findings=15, patchable=2, removed=175 lines / 3983 bytes, lines=24334->24159
- Pass 4: findings=5, patchable=0, removed=0 lines / 0 bytes, lines=24159->24159

