# Post-ASM Report

- Input: `C:\Users\salam\Documents\Programacion\Mideas\server\temp\joc_tales_9_backend_route_matrix_1778225500805_583013.post_asm_input.asm`
- Findings: 79
- Applied patches: 45
- Original lines: 21440
- Output lines: 20635
- Net line delta: -805

- Optimization passes run: 4
- Optimization source removed: 805 lines / 21018 bytes

## Mideas Block Inventory

- Blocks: 91
- Preserved blocks: 12
- Removable-by-policy blocks: 79
- Dead-block candidates: 26
- Annotated block source: 12130 lines / 329194 bytes
- Dead-candidate source: 298 lines / 9017 bytes
- Marker errors: 0

- By kind: data=1, routine=79, trampoline=11
- By owner: animtiles=1, bosses=3, components=31, entities=2, far-call=11, gameflow=6, hud=1, interrupt=5, mapper=1, resources=1, screens=6, scroll=1, sound=15, sprites=1, stateMachine=2, unified=2, worlds=2
- By status: candidate_unreferenced=26, preserved=12, referenced=14, rooted=39

### Largest Annotated Blocks

| ID | Status | Source | Kind | Owner |
| --- | --- | --- | --- | --- |
| `runtime.components.scheduler` | `rooted` | 1599l/36702b | `routine` | `components` |
| `runtime.components.wallcollision` | `referenced` | 839l/31288b | `routine` | `components` |
| `runtime.statemachine.core` | `rooted` | 1096l/25160b | `routine` | `stateMachine` |
| `runtime.boss.core` | `rooted` | 866l/19482b | `routine` | `bosses` |
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
| `runtime.screens.load_screen_new_playable_screen_777833014252.loader` | `rooted` | 115l/4686b | `routine` | `screens` |
| `runtime.components.gravity` | `rooted` | 137l/4553b | `routine` | `components` |

## Inactive Feature Runtime Inventory

| Feature | Findings | Patchable | Annotated | Unannotated | Preserved | Owners |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `sounds` | 31 | 0 | 31 | 0 | 7 | far-call=7, sound=24 |

## Global Label Inventory

- Global labels: 678

| Label | Category | Source |
| --- | --- | --- |
| `FAST_SNSMAT` | `bios_helper` | 1121l/71411b |
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
| `update_boss_system` | `runtime_code` | 139l/4402b |
| `interrupt_dispatcher` | `shared_runtime` | 122l/4176b |
| `tilebank_pattern_data_0` | `data` | 59l/4015b |
| `FAR_BANK_14_ROM_START` | `bank_marker` | 79l/3938b |
| `Condition_VariableCompare` | `runtime_code` | 186l/3892b |
| `wall_build_hitbox_cache` | `runtime_code` | 121l/3875b |
| `tile_pattern_bank0` | `data` | 56l/3821b |
| `load_screen_new_playable_screen_777833014252` | `screen_loader` | 82l/3592b |
| `wall_down_behavior_blocks` | `runtime_code` | 75l/3286b |
| `input_update_loop` | `runtime_code` | 108l/3269b |
| `FAR_BANK_8_ROM_START` | `bank_marker` | 79l/3183b |
| `init_components` | `boot_or_init` | 83l/3021b |
| `input_apply_velocity` | `runtime_code` | 68l/2776b |
| `update_all_entities` | `runtime_code` | 61l/2494b |
| `init_char0_color` | `boot_or_init` | 95l/2487b |
| `expand_screen_block_layout_4x4` | `runtime_code` | 126l/2467b |
| `FAST_LDIRVM` | `bios_helper` | 73l/2463b |
| `set_camera_position` | `runtime_code` | 119l/2425b |
| `SM_ActionTable` | `data` | 50l/2419b |

### Largest Unannotated Global Labels

- Unannotated labels: 284

| Category | Labels | Source |
| --- | ---: | ---: |
| `bank_marker` | 26 | 724l/31771b |
| `bios_helper` | 9 | 1722l/89700b |
| `boot_or_init` | 29 | 709l/18844b |
| `data` | 104 | 1073l/41555b |
| `far_trampoline` | 52 | 614l/12604b |
| `runtime_code` | 60 | 727l/23384b |
| `screen_loader` | 1 | 18l/458b |
| `shared_runtime` | 2 | 32l/1221b |
| `unknown` | 1 | 5l/65b |

| Label | Category | Source |
| --- | --- | --- |
| `FAST_SNSMAT` | `bios_helper` | 1121l/71411b |
| `BANK_0_USED_END` | `bank_marker` | 141l/7659b |
| `vdpLoop` | `bios_helper` | 192l/6712b |
| `tilebank_pattern_data_0` | `data` | 59l/4015b |
| `FAR_BANK_14_ROM_START` | `bank_marker` | 79l/3938b |
| `tile_pattern_bank0` | `data` | 56l/3821b |
| `FAR_BANK_8_ROM_START` | `bank_marker` | 79l/3183b |
| `init_char0_color` | `boot_or_init` | 95l/2487b |
| `FAST_LDIRVM` | `bios_helper` | 73l/2463b |
| `restart_rom_continue` | `boot_or_init` | 80l/2346b |
| `init_interrupt_system` | `boot_or_init` | 63l/2073b |
| `init_entities` | `boot_or_init` | 91l/2038b |
| `BANK_2_USED_END` | `bank_marker` | 40l/1922b |
| `resource_table` | `data` | 97l/1879b |
| `init_sprites` | `boot_or_init` | 68l/1814b |
| `FAST_WRTVDP` | `bios_helper` | 59l/1764b |
| `FAST_WRTVRM` | `bios_helper` | 60l/1682b |
| `FAST_FILLVRM` | `bios_helper` | 76l/1677b |
| `FAST_RDVRM` | `bios_helper` | 53l/1498b |
| `FAR_BANK_11_ROM_START` | `bank_marker` | 34l/1434b |
| `tilebank_color_data_0` | `data` | 22l/1426b |
| `joystick_direction_table` | `data` | 54l/1407b |
| `tile_color_bank0` | `data` | 21l/1354b |
| `init_player_from_hero_entity` | `boot_or_init` | 62l/1324b |
| `FAST_GTTRIG` | `bios_helper` | 54l/1254b |
| `FAST_GTSTCK` | `bios_helper` | 34l/1239b |
| `FAR_BANK_6_ROM_START` | `bank_marker` | 37l/1198b |
| `boss_0_new_boss_phase_0_tiles` | `data` | 15l/1165b |
| `boss_0_new_boss_phase_0_weak` | `data` | 15l/1164b |
| `boss_empty_weak_matrix` | `data` | 15l/1158b |

| ID | Kind | Owner | Status | Incoming | Source | Lines | Labels |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `runtime.mapper.core` | `routine` | `mapper` | `rooted` | 132 | 213l/5412b | 5336-5548 | mapper_runtime_init, mapper_set_bank_p1, mapper_set_bank_p2, mapper_set_bank_p3, mapper_set_bank_p4, ... (+14) |
| `runtime.resources.manager` | `routine` | `resources` | `rooted` | 23 | 680l/17743b | 5733-6412 | resource_manager_init, resource_invalidate_pattern_vram_cache, resource_invalidate_color_vram_cache, resource_invalidate_font_vram_cache, resource_invalidate_gameplay_vram_cache, ... (+14) |
| `runtime.components.input_trigger_level` | `routine` | `components` | `candidate_unreferenced` | 0 | 33l/773b | 6494-6526 | component_trigger_level_pressed_a |
| `runtime.page0.stubs` | `routine` | `unified` | `rooted` | 1 | 22l/505b | 6533-6554 | init_page0_runtime_state, page0_map_expanded_slot, page0_map_game_rom, page0_restore_bios_rom, page0_copy_chunk_to_buffer, ... (+2) |
| `runtime.interrupt.stop` | `routine` | `interrupt` | `rooted` | 0 | 43l/1299b | 6633-6675 | stop_interrupt_system |
| `runtime.interrupt.dispatcher` | `routine` | `interrupt` | `preserved` | 1 | 124l/4150b | 6677-6800 | interrupt_dispatcher |
| `runtime.interrupt.vblank_flag` | `routine` | `interrupt` | `rooted` | 1 | 35l/983b | 6813-6847 | update_vblank_flag |
| `runtime.interrupt.task_api` | `routine` | `interrupt` | `rooted` | 1 | 121l/3195b | 6852-6972 | enable_task, disable_task, get_frame_count |
| `runtime.interrupt.task_input` | `routine` | `interrupt` | `rooted` | 2 | 228l/5981b | 6976-7203 | init_default_tasks_from_plan, task_update_input |
| `runtime.far_trampoline.init_boss_system_far` | `trampoline` | `far-call` | `preserved` | 2 | 19l/519b | 7258-7276 | init_boss_system_far |
| `runtime.far_trampoline.init_screen_boss_from_current_screen_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/639b | 7278-7296 | init_screen_boss_from_current_screen_far |
| `runtime.far_trampoline.update_boss_system_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/531b | 7298-7316 | update_boss_system_far |
| `runtime.far_trampoline.draw_boss_attack_far` | `trampoline` | `far-call` | `preserved` | 0 | 19l/519b | 7318-7336 | draw_boss_attack_far |
| `runtime.far_trampoline.init_sound_system_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/525b | 7380-7398 | init_sound_system_far |
| `runtime.far_trampoline.task_audio_tick_far` | `trampoline` | `far-call` | `preserved` | 0 | 19l/513b | 7400-7418 | task_audio_tick_far |
| `runtime.far_trampoline.sfx_update_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/483b | 7420-7438 | sfx_update_far |
| `runtime.far_trampoline.music_update_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/495b | 7440-7458 | music_update_far |
| `runtime.far_trampoline.music_stop_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/483b | 7460-7478 | music_stop_far |
| `runtime.far_trampoline.music_play_track_far` | `trampoline` | `far-call` | `preserved` | 1 | 21l/556b | 7480-7500 | music_play_track_far |
| `runtime.far_trampoline.music_execute_command_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/549b | 7502-7520 | music_execute_command_far |
| `runtime.sound.resident.init` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/184b | 8124-8127 | call_init_sound_system_resident |
| `runtime.sound.resident.tick` | `routine` | `sound` | `candidate_unreferenced` | 0 | 18l/606b | 8129-8146 | call_task_audio_tick_resident |
| `runtime.sound.resident.music_update` | `routine` | `sound` | `referenced` | 2 | 4l/190b | 8148-8151 | call_music_update_resident |
| `runtime.sound.resident.sfx_update` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/182b | 8153-8156 | call_sfx_update_resident |
| `runtime.sound.resident.music_stop` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/182b | 8158-8161 | call_music_stop_resident |
| `runtime.sound.resident.music_play_track` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/206b | 8163-8166 | call_music_play_track_resident |
| `runtime.sound.resident.music_execute_command` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/226b | 8168-8171 | call_music_execute_command_resident |
| `runtime.boss.resident_wrappers` | `routine` | `bosses` | `rooted` | 2 | 37l/1130b | 8285-8321 | call_init_boss_system_resident, call_init_screen_boss_from_current_screen_resident, call_update_boss_system_resident, call_update_boss_projectile_runtime_resident, call_draw_boss_attack_resident, ... (+7) |
| `runtime.font.reload_stub` | `routine` | `unified` | `candidate_unreferenced` | 0 | 4l/146b | 8440-8443 | reload_font_system |
| `runtime.components.init` | `routine` | `components` | `rooted` | 11 | 86l/2962b | 8586-8671 | component_fill_32_a, init_components |
| `runtime.components.position` | `routine` | `components` | `rooted` | 3 | 108l/3281b | 8673-8780 | init_position_system, update_position_component, position_update_loop, position_next_entity |
| `runtime.components.sprite` | `routine` | `components` | `rooted` | 6 | 396l/10316b | 8781-9176 | init_sprite_system, update_sprite_component, sprite_update_loop, sprite_layer_loop, sprite_continue, ... (+6) |
| `runtime.components.movement_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 9182-9185 | update_movement_component |
| `runtime.components.collision` | `routine` | `components` | `referenced` | 2 | 668l/18861b | 9186-9853 | init_collision_system, update_collision_component, collision_update_loop, collision_next_entity, update_entity_collision_fast, ... (+13) |
| `runtime.components.behavior_tile` | `routine` | `components` | `rooted` | 9 | 110l/3809b | 9854-9963 | get_behavior_tile, get_behavior_tile_nb, gbt_oob |
| `runtime.components.directional_sprite_sync` | `routine` | `components` | `rooted` | 3 | 87l/2084b | 9964-10050 | component_sync_directional_sprite_from_initial, component_sync_directional_sprite_from_current, component_sync_directional_sprite_common |
| `runtime.components.input` | `routine` | `components` | `referenced` | 2 | 388l/12766b | 10051-10438 | init_input_system, update_input_component, input_update_loop, input_move_up, input_move_down, ... (+16) |
| `runtime.components.health` | `routine` | `components` | `rooted` | 2 | 152l/4701b | 10476-10627 | init_health_system, update_health_component, decrease_entity_lives, increase_entity_lives |
| `runtime.components.animation` | `routine` | `components` | `referenced` | 4 | 342l/10555b | 10628-10969 | init_animation_system, update_animation_component, anim_done_entity, refresh_player_animation_fastpath |
| `runtime.components.jump` | `routine` | `components` | `referenced` | 2 | 233l/7043b | 10970-11202 | init_jump_system, update_jump_component, jump_update_loop, jump_done_entity, jump_next_entity |
| `runtime.components.gravity` | `routine` | `components` | `rooted` | 2 | 137l/4553b | 11203-11339 | init_gravity_system, update_gravity_component, gravity_update_loop, gravity_store_vel, gravity_grounded, ... (+2) |
| `runtime.components.walljump_stub` | `routine` | `components` | `referenced` | 2 | 18l/326b | 11360-11377 | init_walljump_system, update_walljump_component, walljump_process_entity_c, walljump_input_is_left, walljump_input_is_right |
| `runtime.components.auto_destroy_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/219b | 11380-11386 | init_auto_destroy_system, update_auto_destroy_component |
| `runtime.components.state_machine_component_stub` | `routine` | `components` | `referenced` | 1 | 7l/241b | 11410-11416 | init_statemachine_system, update_statemachine_component |
| `runtime.components.retractable_gate_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/196b | 11422-11425 | update_retractable_gate_component |
| `runtime.components.carry` | `routine` | `components` | `rooted` | 1 | 81l/2148b | 11426-11506 | init_carry_system, update_carry_component |
| `runtime.components.auto_control_script_stubs` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/252b | 11512-11518 | update_auto_control_script_component, update_auto_event_string_component |
| `runtime.components.damage_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/166b | 11524-11527 | update_damage_component |
| `runtime.components.shoot_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/163b | 11533-11536 | update_shoot_component |
| `runtime.components.platform_riding_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/220b | 11556-11562 | prepare_platform_detection, update_platform_riding |
| `runtime.components.wallcollision` | `routine` | `components` | `referenced` | 3 | 839l/31288b | 11563-12401 | init_wallcollision_system, wall_behavior_is_full_blocker, wall_down_behavior_blocks, update_wallcollision_component, wall_build_hitbox_cache, ... (+2) |
| `runtime.components.deadly_tiles` | `routine` | `components` | `rooted` | 3 | 262l/5874b | 12402-12663 | init_deadly_tiles_system, deadly_tiles_runtime_tile_is_deadly_nb, update_entity_deadly_flag_runtime, update_deadly_tiles_component, refresh_player_deadly_fastpath |
| `runtime.components.in_water_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 12669-12672 | update_in_water_component |
| `runtime.components.collectible_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/181b | 12678-12681 | update_collectible_component |
| `runtime.components.entity_management` | `routine` | `components` | `rooted` | 3 | 221l/6553b | 12699-12919 | create_entity, entity_job_set, entity_job_set_period_ok, entity_job_set_entry_wrap, entity_job_set_entry_ok, ... (+13) |
| `runtime.components.scheduler` | `routine` | `components` | `rooted` | 7 | 1599l/36702b | 12920-14518 | update_all_entities, mark_used_entity_list_dirty, ensure_used_entity_list_current, rebuild_used_entity_list, ensure_player_fast_runtime_bound, ... (+11) |
| `runtime.components.state_machine_executor` | `routine` | `components` | `rooted` | 2 | 74l/1973b | 14524-14597 | execute_all_state_machines, refresh_player_state_machine_fastpath |
| `runtime.components.legacy_tile_collision` | `routine` | `components` | `candidate_unreferenced` | 0 | 43l/1404b | 14607-14649 | get_tile_at_position, get_tile_behavior, tile_behavior_table, check_collision_at_point, check_collision_box, ... (+1) |
| `runtime.components.secret_zone_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/181b | 14686-14689 | update_secret_zone_component |
| `runtime.statemachine.core` | `routine` | `stateMachine` | `rooted` | 4 | 1096l/25160b | 14697-15792 | SM_Update, sm_timer_no_overflow, sm_update_done, SM_CheckTransitions, SM_CheckTransitions_Loop, ... (+22) |
| `data.statemachine.statemachine_1777833246195` | `data` | `stateMachine` | `rooted` | 1 | 25l/863b | 15858-15882 | SM_New_Statemachine_state_1777833253256, SM_New_Statemachine_state_1777833253256_Transitions, SM_New_Statemachine_state_1777833253256_Transitions_Actions_0, SM_New_Statemachine_state_1777833256480 |
| `runtime.gameflow.worldlink` | `routine` | `gameflow` | `rooted` | 1 | 74l/2164b | 16004-16077 | gameflow_handle_worldlink |
| `runtime.gameflow.end_screen` | `routine` | `gameflow` | `rooted` | 1 | 145l/4039b | 16079-16223 | gameflow_handle_end, display_end_screen, print_string_vram, str_victory, str_game_over, ... (+1) |
| `runtime.gameflow.connection_by_type` | `routine` | `gameflow` | `candidate_unreferenced` | 0 | 37l/701b | 16260-16296 | gameflow_get_connection_by_type |
| `runtime.gameflow.confirm_input_direct` | `routine` | `gameflow` | `candidate_unreferenced` | 0 | 12l/298b | 16321-16332 | gameflow_read_confirm_direct |
| `runtime.gameflow.world_loop` | `routine` | `gameflow` | `rooted` | 1 | 62l/2172b | 16340-16401 | gameflow_world_game_loop |
| `runtime.gameflow.clear_screen_area_helpers` | `routine` | `gameflow` | `referenced` | 1 | 60l/1737b | 16507-16566 | clear_screen_area, clear_screen_row, empty_row_data |
| `runtime.boss.entry` | `routine` | `bosses` | `rooted` | 2 | 78l/1883b | 16936-17013 | init_boss_system, update_boss_system |
| `runtime.boss.core` | `routine` | `bosses` | `rooted` | 13 | 866l/19482b | 17015-17880 | init_screen_boss_from_current_screen, boss_push_data_bank, boss_pop_data_bank, boss_resolve_initial_phase, boss_init_behavior_state, ... (+23) |
| `data.entities.player_1.init` | `routine` | `entities` | `rooted` | 1 | 177l/4974b | 18036-18212 | init_player_1 |
| `runtime.entities.patrol_facing` | `routine` | `entities` | `rooted` | 0 | 88l/2125b | 18389-18476 | update_entity_patrol_facing |
| `runtime.sound.init` | `routine` | `sound` | `rooted` | 1 | 22l/725b | 18655-18676 | init_sound_system |
| `runtime.sound.tick` | `routine` | `sound` | `rooted` | 1 | 17l/320b | 18683-18699 | task_audio_tick |
| `runtime.sound.psg_lowlevel` | `routine` | `sound` | `rooted` | 27 | 117l/3450b | 18704-18820 | psg_write, psg_set_tone, psg_set_volume, psg_set_noise, psg_set_mixer, ... (+1) |
| `runtime.sound.sfx_silence` | `routine` | `sound` | `referenced` | 2 | 21l/579b | 18830-18850 | sfx_silence_all |
| `runtime.sound.sfx_builtin_effects` | `routine` | `sound` | `referenced` | 6 | 127l/3025b | 18856-18982 | sfx_beep, sfx_jump, sfx_shoot, sfx_explosion, sfx_coin, ... (+1) |
| `runtime.sound.sfx_playback` | `routine` | `sound` | `referenced` | 1 | 119l/2384b | 19000-19118 | play_sound_effect, play_sound_effect_beep, play_sound_effect_jump, play_sound_effect_shoot, play_sound_effect_explosion, ... (+4) |
| `runtime.sound.music_noop_runtime` | `routine` | `sound` | `referenced` | 5 | 66l/1337b | 19127-19192 | music_init_system, music_reset_channel_state, music_silence_channels, music_stop, music_mute, ... (+7) |
| `runtime.sound.music_reset_noop` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/163b | 19148-19151 | music_reset_channel_state |
| `runtime.screens.colors` | `routine` | `screens` | `rooted` | 1 | 44l/1514b | 19225-19268 | color_shift_table, set_screen_colors |
| `runtime.screens.copy_rect` | `routine` | `screens` | `rooted` | 0 | 77l/1494b | 19362-19438 | copy_layout_rect_to_vram, copy_layout_rect_ram_to_ram |
| `runtime.screens.block_layout_expander` | `routine` | `screens` | `rooted` | 0 | 194l/3798b | 19440-19633 | expand_screen_block_layout_to_background, expand_screen_block_layout_2x2, expand_screen_block_layout_4x4 |
| `runtime.screens.behavior_map_rebuild` | `routine` | `screens` | `referenced` | 1 | 26l/709b | 19651-19676 | build_runtime_behavior_map_from_screen_layout |
| `runtime.screens.load_screen_stub` | `routine` | `screens` | `candidate_unreferenced` | 0 | 6l/232b | 19677-19682 | load_screen |
| `runtime.screens.load_screen_new_playable_screen_777833014252.loader` | `routine` | `screens` | `rooted` | 1 | 115l/4686b | 19684-19798 | load_screen_new_playable_screen_777833014252, load_new_playable_screen_777833014252_boss_done |
| `runtime.sprites.show_sprite_legacy` | `routine` | `sprites` | `candidate_unreferenced` | 0 | 43l/981b | 20092-20134 | show_sprite |
| `runtime.animtiles.core` | `routine` | `animtiles` | `rooted` | 3 | 318l/9265b | 20212-20529 | init_animated_tiles, update_animated_tiles, update_animated_tiles_vram, set_animation_speed, anim_copy_8_bytes, ... (+9) |
| `runtime.scroll.core` | `routine` | `scroll` | `rooted` | 0 | 340l/8599b | 20549-20888 | init_scroll_system, set_camera_position, move_camera, center_camera_on_entity, update_scroll, ... (+2) |
| `runtime.worlds.worldmap_1777833018852.loader` | `routine` | `worlds` | `rooted` | 2 | 32l/1257b | 20941-20972 | load_world_worldmap_1777833018852 |
| `runtime.worlds.current_screen_helpers` | `routine` | `worlds` | `candidate_unreferenced` | 0 | 23l/633b | 21045-21067 | get_current_world_id, get_current_screen_index, set_current_screen |
| `runtime.hud.empty_update_stubs` | `routine` | `hud` | `candidate_unreferenced` | 0 | 6l/178b | 21428-21433 | update_hud_score, update_hud_lives |

## Dead-Block Candidates

- `runtime.components.legacy_tile_collision`: 43 lines / 1404 bytes. No external references found for any global label in this block.
- `runtime.sprites.show_sprite_legacy`: 43 lines / 981 bytes. No external references found for any global label in this block.
- `runtime.components.input_trigger_level`: 33 lines / 773 bytes. No external references found for any global label in this block.
- `runtime.gameflow.connection_by_type`: 37 lines / 701 bytes. No external references found for any global label in this block.
- `runtime.worlds.current_screen_helpers`: 23 lines / 633 bytes. No external references found for any global label in this block.
- `runtime.sound.resident.tick`: 18 lines / 606 bytes. No external references found for any global label in this block.
- `runtime.gameflow.confirm_input_direct`: 12 lines / 298 bytes. No external references found for any global label in this block.
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

- Original ROM bytes: 147456
- Optimized ROM bytes: 147456
- ROM byte delta: 0
- ROM SHA256 equal: False

## dead-blocks

- Metrics: findings=26, patchable=26, removed_lines=298, removed_source_bytes=9017
- Routines: runtime.components.auto_control_script_stubs, runtime.components.auto_destroy_stub, runtime.components.collectible_stub, runtime.components.damage_stub, runtime.components.in_water_stub, runtime.components.input_trigger_level, runtime.components.legacy_tile_collision, runtime.components.movement_stub, runtime.components.platform_riding_stub, runtime.components.retractable_gate_stub, runtime.components.secret_zone_stub, runtime.components.shoot_stub, runtime.font.reload_stub, runtime.gameflow.confirm_input_direct, runtime.gameflow.connection_by_type, runtime.hud.empty_update_stubs, runtime.screens.load_screen_stub, runtime.sound.music_reset_noop, runtime.sound.resident.init, runtime.sound.resident.music_execute_command, runtime.sound.resident.music_play_track, runtime.sound.resident.music_stop, runtime.sound.resident.sfx_update, runtime.sound.resident.tick, runtime.sprites.show_sprite_legacy, runtime.worlds.current_screen_helpers

- [patchable] `runtime.components.input_trigger_level` lines 6494-6526: Block `runtime.components.input_trigger_level` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: component_trigger_level_pressed_a.
- [patchable] `runtime.sound.resident.init` lines 8124-8127: Block `runtime.sound.resident.init` (routine/sound) is a dead-code candidate. No external references found for any global label in this block. Labels: call_init_sound_system_resident.
- [patchable] `runtime.sound.resident.tick` lines 8129-8146: Block `runtime.sound.resident.tick` (routine/sound) is a dead-code candidate. No external references found for any global label in this block. Labels: call_task_audio_tick_resident.
- [patchable] `runtime.sound.resident.sfx_update` lines 8153-8156: Block `runtime.sound.resident.sfx_update` (routine/sound) is a dead-code candidate. No external references found for any global label in this block. Labels: call_sfx_update_resident.
- [patchable] `runtime.sound.resident.music_stop` lines 8158-8161: Block `runtime.sound.resident.music_stop` (routine/sound) is a dead-code candidate. No external references found for any global label in this block. Labels: call_music_stop_resident.
- [patchable] `runtime.sound.resident.music_play_track` lines 8163-8166: Block `runtime.sound.resident.music_play_track` (routine/sound) is a dead-code candidate. No external references found for any global label in this block. Labels: call_music_play_track_resident.
- [patchable] `runtime.sound.resident.music_execute_command` lines 8168-8171: Block `runtime.sound.resident.music_execute_command` (routine/sound) is a dead-code candidate. No external references found for any global label in this block. Labels: call_music_execute_command_resident.
- [patchable] `runtime.font.reload_stub` lines 8440-8443: Block `runtime.font.reload_stub` (routine/unified) is a dead-code candidate. No external references found for any global label in this block. Labels: reload_font_system.
- [patchable] `runtime.components.movement_stub` lines 9182-9185: Block `runtime.components.movement_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_movement_component.
- [patchable] `runtime.components.auto_destroy_stub` lines 11380-11386: Block `runtime.components.auto_destroy_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: init_auto_destroy_system, update_auto_destroy_component.
- [patchable] `runtime.components.retractable_gate_stub` lines 11422-11425: Block `runtime.components.retractable_gate_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_retractable_gate_component.
- [patchable] `runtime.components.auto_control_script_stubs` lines 11512-11518: Block `runtime.components.auto_control_script_stubs` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_auto_control_script_component, update_auto_event_string_component.
- [patchable] `runtime.components.damage_stub` lines 11524-11527: Block `runtime.components.damage_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_damage_component.
- [patchable] `runtime.components.shoot_stub` lines 11533-11536: Block `runtime.components.shoot_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_shoot_component.
- [patchable] `runtime.components.platform_riding_stub` lines 11556-11562: Block `runtime.components.platform_riding_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: prepare_platform_detection, update_platform_riding.
- [patchable] `runtime.components.in_water_stub` lines 12669-12672: Block `runtime.components.in_water_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_in_water_component.
- [patchable] `runtime.components.collectible_stub` lines 12678-12681: Block `runtime.components.collectible_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_collectible_component.
- [patchable] `runtime.components.legacy_tile_collision` lines 14607-14649: Block `runtime.components.legacy_tile_collision` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: get_tile_at_position, get_tile_behavior, tile_behavior_table, check_collision_at_point, check_collision_box, ... (+1).
- [patchable] `runtime.components.secret_zone_stub` lines 14686-14689: Block `runtime.components.secret_zone_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_secret_zone_component.
- [patchable] `runtime.gameflow.connection_by_type` lines 16260-16296: Block `runtime.gameflow.connection_by_type` (routine/gameflow) is a dead-code candidate. No external references found for any global label in this block. Labels: gameflow_get_connection_by_type.
- [patchable] `runtime.gameflow.confirm_input_direct` lines 16321-16332: Block `runtime.gameflow.confirm_input_direct` (routine/gameflow) is a dead-code candidate. No external references found for any global label in this block. Labels: gameflow_read_confirm_direct.
- [patchable] `runtime.sound.music_reset_noop` lines 19148-19151: Block `runtime.sound.music_reset_noop` (routine/sound) is a dead-code candidate. No external references found for any global label in this block. Labels: music_reset_channel_state.
- [patchable] `runtime.screens.load_screen_stub` lines 19677-19682: Block `runtime.screens.load_screen_stub` (routine/screens) is a dead-code candidate. No external references found for any global label in this block. Labels: load_screen.
- [patchable] `runtime.sprites.show_sprite_legacy` lines 20092-20134: Block `runtime.sprites.show_sprite_legacy` (routine/sprites) is a dead-code candidate. No external references found for any global label in this block. Labels: show_sprite.
- [patchable] `runtime.worlds.current_screen_helpers` lines 21045-21067: Block `runtime.worlds.current_screen_helpers` (routine/worlds) is a dead-code candidate. No external references found for any global label in this block. Labels: get_current_world_id, get_current_screen_index, set_current_screen.
- [patchable] `runtime.hud.empty_update_stubs` lines 21428-21433: Block `runtime.hud.empty_update_stubs` (routine/hud) is a dead-code candidate. No external references found for any global label in this block. Labels: update_hud_score, update_hud_lives.

## inactive-feature-runtime

- Metrics: findings=53, patchable=15, removed_lines=208, removed_source_bytes=5729
- Routines: call_init_sound_system_resident, call_music_execute_command_resident, call_music_play_track_resident, call_music_stop_resident, call_music_update_resident, call_sfx_update_resident, call_task_audio_tick_resident, init_sound_system, init_sound_system_far, music_execute_command, music_execute_command_far, music_init_system, music_play_track, music_play_track_far, music_reset_channel_state, music_silence_channels, music_stop, music_stop_far, music_update_far, runtime.sound.group.init, runtime.sound.group.init:call_init_sound_system_resident, runtime.sound.group.init:init_sound_system, runtime.sound.group.init:init_sound_system_far, runtime.sound.group.music_execute_command, runtime.sound.group.music_execute_command:call_music_execute_command_resident, runtime.sound.group.music_execute_command:music_execute_command, runtime.sound.group.music_execute_command:music_execute_command_far, runtime.sound.group.music_play_track, runtime.sound.group.music_play_track:call_music_play_track_resident, runtime.sound.group.music_play_track:music_play_track, runtime.sound.group.music_play_track:music_play_track_far, runtime.sound.group.music_stop, runtime.sound.group.music_update, runtime.sound.group.sfx_update, runtime.sound.group.sfx_update:call_sfx_update_resident, runtime.sound.group.sfx_update:sfx_update, runtime.sound.group.sfx_update:sfx_update_far, runtime.sound.group.tick, runtime.sound.group.tick:call_task_audio_tick_resident, runtime.sound.group.tick:task_audio_tick, runtime.sound.group.tick:task_audio_tick_far, sfx_beep, sfx_coin, sfx_damage, sfx_explosion, sfx_jump, sfx_play, sfx_shoot, sfx_silence_all, sfx_update, sfx_update_far, task_audio_tick, task_audio_tick_far

- [patchable] `runtime.sound.group.init:init_sound_system_far` lines 7380-7398: `init_sound_system_far` is part of inactive runtime group `runtime.sound.group.init`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.sound.group.init` lines 7381-18683: `runtime.sound.group.init` groups inactive audio init runtime labels: call_init_sound_system_resident, init_sound_system, init_sound_system_far. No external references outside the group were found. This is ready for a future atomic multi-window patch, or for dead-blocks to remove the annotated windows as whole groups. Atomic patch enabled as `runtime.sound.group.init` with 3 window(s).
- [report-only] `init_sound_system_far` lines 7381-7400: `init_sound_system_far` looks like audio runtime (20 lines, 524 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: boot_or_init (Boot/init routine). External references still exist (1): call_init_sound_system_resident@8126. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.far_trampoline.init_sound_system_far` owner=`far-call` preserve=true. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.tick:task_audio_tick_far` lines 7400-7418: `task_audio_tick_far` is part of inactive runtime group `runtime.sound.group.tick`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.sound.group.tick` lines 7401-18712: `runtime.sound.group.tick` groups inactive audio tick runtime labels: call_task_audio_tick_resident, task_audio_tick, task_audio_tick_far. No external references outside the group were found. This is ready for a future atomic multi-window patch, or for dead-blocks to remove the annotated windows as whole groups. Atomic patch enabled as `runtime.sound.group.tick` with 3 window(s).
- [report-only] `task_audio_tick_far` lines 7401-7420: `task_audio_tick_far` looks like audio runtime (20 lines, 509 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.far_trampoline.task_audio_tick_far` owner=`far-call` preserve=true. Patch remains disabled because `task_audio_tick_far` is inside annotated block `runtime.far_trampoline.task_audio_tick_far`; group-level deletion must be handled by dead-blocks. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.sfx_update:sfx_update_far` lines 7420-7438: `sfx_update_far` is part of inactive runtime group `runtime.sound.group.sfx_update`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.sound.group.sfx_update` lines 7421-19127: `runtime.sound.group.sfx_update` groups inactive SFX update runtime labels: call_sfx_update_resident, sfx_update, sfx_update_far. No external references outside the group were found. This is ready for a future atomic multi-window patch, or for dead-blocks to remove the annotated windows as whole groups. Atomic patch enabled as `runtime.sound.group.sfx_update` with 3 window(s).
- [report-only] `sfx_update_far` lines 7421-7440: `sfx_update_far` looks like audio runtime (20 lines, 486 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_sfx_update_resident@8155. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.far_trampoline.sfx_update_far` owner=`far-call` preserve=true. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `runtime.sound.group.music_update` lines 7441-19174: `runtime.sound.group.music_update` groups inactive music update runtime labels: call_music_update_resident, music_update, music_update_far. Group deletion remains blocked by 2 external references: call_task_audio_tick_resident->call_music_update_resident@8139, task_audio_tick->call_music_update_resident@18690.
- [report-only] `music_update_far` lines 7441-7460: `music_update_far` looks like audio runtime (20 lines, 494 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_music_update_resident@8150. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.far_trampoline.music_update_far` owner=`far-call` preserve=true. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `runtime.sound.group.music_stop` lines 7461-19171: `runtime.sound.group.music_stop` groups inactive music stop runtime labels: call_music_stop_resident, music_stop, music_stop_far. Group deletion remains blocked by 1 external references: music_execute_command->music_stop@19184.
- [report-only] `music_stop_far` lines 7461-7480: `music_stop_far` looks like audio runtime (20 lines, 490 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_music_stop_resident@8160. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.far_trampoline.music_stop_far` owner=`far-call` preserve=true. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.music_play_track:music_play_track_far` lines 7480-7500: `music_play_track_far` is part of inactive runtime group `runtime.sound.group.music_play_track`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.sound.group.music_play_track` lines 7481-19178: `runtime.sound.group.music_play_track` groups inactive music play-track runtime labels: call_music_play_track_resident, music_play_track, music_play_track_far. No external references outside the group were found. This is ready for a future atomic multi-window patch, or for dead-blocks to remove the annotated windows as whole groups. Atomic patch enabled as `runtime.sound.group.music_play_track` with 3 window(s).
- [report-only] `music_play_track_far` lines 7481-7502: `music_play_track_far` looks like audio runtime (22 lines, 562 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_music_play_track_resident@8165. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.far_trampoline.music_play_track_far` owner=`far-call` preserve=true. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.music_execute_command:music_execute_command_far` lines 7502-7520: `music_execute_command_far` is part of inactive runtime group `runtime.sound.group.music_execute_command`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.sound.group.music_execute_command` lines 7503-19186: `runtime.sound.group.music_execute_command` groups inactive music command runtime labels: call_music_execute_command_resident, music_execute_command, music_execute_command_far. No external references outside the group were found. This is ready for a future atomic multi-window patch, or for dead-blocks to remove the annotated windows as whole groups. Atomic patch enabled as `runtime.sound.group.music_execute_command` with 3 window(s).
- [report-only] `music_execute_command_far` lines 7503-7524: `music_execute_command_far` looks like audio runtime (22 lines, 507 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_music_execute_command_resident@8170. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.far_trampoline.music_execute_command_far` owner=`far-call` preserve=true. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.init:call_init_sound_system_resident` lines 8124-8127: `call_init_sound_system_resident` is part of inactive runtime group `runtime.sound.group.init`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_init_sound_system_resident` lines 8125-8129: `call_init_sound_system_resident` looks like audio runtime (5 lines, 185 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.sound.resident.init` owner=`sound` preserve=false. Patch remains disabled because `call_init_sound_system_resident` is inside annotated block `runtime.sound.resident.init`; group-level deletion must be handled by dead-blocks. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.tick:call_task_audio_tick_resident` lines 8129-8146: `call_task_audio_tick_resident` is part of inactive runtime group `runtime.sound.group.tick`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_task_audio_tick_resident` lines 8130-8148: `call_task_audio_tick_resident` looks like audio runtime (19 lines, 615 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.sound.resident.tick` owner=`sound` preserve=false. Patch remains disabled because `call_task_audio_tick_resident` is inside annotated block `runtime.sound.resident.tick`; group-level deletion must be handled by dead-blocks. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_music_update_resident` lines 8149-8153: `call_music_update_resident` looks like audio runtime (5 lines, 189 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (2): call_task_audio_tick_resident@8139, task_audio_tick@18690. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.sound.resident.music_update` owner=`sound` preserve=false. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.sfx_update:call_sfx_update_resident` lines 8153-8156: `call_sfx_update_resident` is part of inactive runtime group `runtime.sound.group.sfx_update`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_sfx_update_resident` lines 8154-8158: `call_sfx_update_resident` looks like audio runtime (5 lines, 183 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.sound.resident.sfx_update` owner=`sound` preserve=false. Patch remains disabled because `call_sfx_update_resident` is inside annotated block `runtime.sound.resident.sfx_update`; group-level deletion must be handled by dead-blocks. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_music_stop_resident` lines 8159-8163: `call_music_stop_resident` looks like audio runtime (5 lines, 189 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.sound.resident.music_stop` owner=`sound` preserve=false. Patch remains disabled because `call_music_stop_resident` is inside annotated block `runtime.sound.resident.music_stop`; group-level deletion must be handled by dead-blocks. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.music_play_track:call_music_play_track_resident` lines 8163-8166: `call_music_play_track_resident` is part of inactive runtime group `runtime.sound.group.music_play_track`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_music_play_track_resident` lines 8164-8168: `call_music_play_track_resident` looks like audio runtime (5 lines, 212 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.sound.resident.music_play_track` owner=`sound` preserve=false. Patch remains disabled because `call_music_play_track_resident` is inside annotated block `runtime.sound.resident.music_play_track`; group-level deletion must be handled by dead-blocks. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.music_execute_command:call_music_execute_command_resident` lines 8168-8171: `call_music_execute_command_resident` is part of inactive runtime group `runtime.sound.group.music_execute_command`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_music_execute_command_resident` lines 8169-8172: `call_music_execute_command_resident` looks like audio runtime (4 lines, 138 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.sound.resident.music_execute_command` owner=`sound` preserve=false. Patch remains disabled because `call_music_execute_command_resident` is inside annotated block `runtime.sound.resident.music_execute_command`; group-level deletion must be handled by dead-blocks. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.init:init_sound_system` lines 18655-18676: `init_sound_system` is part of inactive runtime group `runtime.sound.group.init`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `init_sound_system` lines 18656-18683: `init_sound_system` looks like audio runtime (28 lines, 1006 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: boot_or_init (Boot/init routine). External references still exist (1): init_sound_system_far@7388. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.sound.init` owner=`sound` preserve=false. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.tick:task_audio_tick` lines 18683-18699: `task_audio_tick` is part of inactive runtime group `runtime.sound.group.tick`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `task_audio_tick` lines 18684-18712: `task_audio_tick` looks like audio runtime (29 lines, 836 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: shared_runtime (Shared low-level runtime helper). External references still exist (1): task_audio_tick_far@7408. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.sound.tick` owner=`sound` preserve=false. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_silence_all` lines 18831-18856: `sfx_silence_all` looks like audio runtime (26 lines, 757 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (2): init_sound_system@18673, sfx_update@19114. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.sound.sfx_silence` owner=`sound` preserve=false. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_beep` lines 18857-18877: `sfx_beep` looks like audio runtime (21 lines, 492 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_beep@19019. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.sound.sfx_builtin_effects` owner=`sound` preserve=false. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_jump` lines 18878-18899: `sfx_jump` looks like audio runtime (22 lines, 473 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_jump@19025. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.sound.sfx_builtin_effects` owner=`sound` preserve=false. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_shoot` lines 18900-18924: `sfx_shoot` looks like audio runtime (25 lines, 565 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_shoot@19031. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.sound.sfx_builtin_effects` owner=`sound` preserve=false. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_explosion` lines 18925-18944: `sfx_explosion` looks like audio runtime (20 lines, 497 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_explosion@19037. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.sound.sfx_builtin_effects` owner=`sound` preserve=false. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_coin` lines 18945-18966: `sfx_coin` looks like audio runtime (22 lines, 536 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_coin@19043. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.sound.sfx_builtin_effects` owner=`sound` preserve=false. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_damage` lines 18967-19000: `sfx_damage` looks like audio runtime (34 lines, 1140 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_damage@19049. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.sound.sfx_builtin_effects` owner=`sound` preserve=false. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_play` lines 19060-19088: `sfx_play` looks like audio runtime (29 lines, 600 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (6): play_sound_effect_beep@19021, play_sound_effect_jump@19027, play_sound_effect_shoot@19033, play_sound_effect_explosion@19039, play_sound_effect_coin@19045, ... (+1 more). Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.sound.sfx_playback` owner=`sound` preserve=false. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.sfx_update:sfx_update` lines 19089-19117: `sfx_update` is part of inactive runtime group `runtime.sound.group.sfx_update`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `sfx_update` lines 19089-19127: `sfx_update` looks like audio runtime (39 lines, 1016 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): sfx_update_far@7428. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.sound.sfx_playback` owner=`sound` preserve=false. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `music_init_system` lines 19128-19148: `music_init_system` looks like audio runtime (21 lines, 566 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (2): init_sound_system@18670, music_stop@19168. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.sound.music_noop_runtime` owner=`sound` preserve=false. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `music_reset_channel_state` lines 19149-19152: `music_reset_channel_state` looks like audio runtime (4 lines, 89 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.sound.music_reset_noop` owner=`sound` preserve=false. Patch remains disabled because `music_reset_channel_state` is inside annotated block `runtime.sound.music_reset_noop`; group-level deletion must be handled by dead-blocks. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `music_silence_channels` lines 19153-19166: `music_silence_channels` looks like audio runtime (14 lines, 212 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): music_stop@19169. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.sound.music_noop_runtime` owner=`sound` preserve=false. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `music_stop` lines 19167-19171: `music_stop` looks like audio runtime (5 lines, 80 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (2): music_stop_far@7468, music_execute_command@19184. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.sound.music_noop_runtime` owner=`sound` preserve=false. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.music_play_track:music_play_track` lines 19176-19177: `music_play_track` is part of inactive runtime group `runtime.sound.group.music_play_track`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `music_play_track` lines 19176-19178: `music_play_track` looks like audio runtime (3 lines, 27 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): music_play_track_far@7489. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.sound.music_noop_runtime` owner=`sound` preserve=false. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.music_execute_command:music_execute_command` lines 19179-19185: `music_execute_command` is part of inactive runtime group `runtime.sound.group.music_execute_command`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `music_execute_command` lines 19179-19186: `music_execute_command` looks like audio runtime (8 lines, 98 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): music_execute_command_far@7510. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.sound.music_noop_runtime` owner=`sound` preserve=false. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.

## Optimization Passes

- Pass 1: findings=79, patchable=36, removed=472 lines / 13342 bytes, lines=21440->20968
- Pass 2: findings=24, patchable=7, removed=158 lines / 3693 bytes, lines=20968->20810
- Pass 3: findings=10, patchable=2, removed=175 lines / 3983 bytes, lines=20810->20635
- Pass 4: findings=0, patchable=0, removed=0 lines / 0 bytes, lines=20635->20635

