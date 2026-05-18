# Post-ASM Report

- Input: `C:\Users\salam\Documents\Programacion\Mideas\server\temp\joc_tales_9_fresh_audio_far_block.asm`
- Findings: 62
- Applied patches: 23
- Original lines: 22306
- Output lines: 22016
- Net line delta: -290

- Optimization passes run: 2
- Optimization source removed: 290 lines / 8303 bytes

## Mideas Block Inventory

- Blocks: 86
- Preserved blocks: 8
- Removable-by-policy blocks: 78
- Dead-block candidates: 21
- Annotated block source: 12006 lines / 325195 bytes
- Dead-candidate source: 264 lines / 7657 bytes
- Marker errors: 0

- By kind: data=1, routine=78, trampoline=7
- By owner: animtiles=1, bosses=2, components=31, entities=2, far-call=7, gameflow=6, hud=1, interrupt=5, mapper=1, resources=1, screens=6, scroll=1, sound=15, sprites=1, stateMachine=2, unified=2, worlds=2
- By status: candidate_unreferenced=21, preserved=8, referenced=19, rooted=38

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
| `tile_pattern_bank0` | `data` | 261l/17019b |
| `tile_color_bank0` | `data` | 269l/16454b |
| `update_player_fastpath` | `runtime_code` | 604l/13839b |
| `update_entity_collision_fast` | `runtime_code` | 345l/9814b |
| `update_animation_component` | `runtime_code` | 255l/8328b |
| `BANK_0_USED_END` | `bank_marker` | 141l/7659b |
| `vdpLoop` | `bios_helper` | 192l/6712b |
| `tilebank_color_data_0` | `data` | 73l/6061b |
| `tilebank_pattern_data_0` | `data` | 70l/5874b |
| `task_update_input` | `shared_runtime` | 199l/4970b |
| `init_player_1` | `boot_or_init` | 177l/4880b |
| `jump_update_loop` | `runtime_code` | 157l/4675b |
| `rebuild_used_entity_list` | `runtime_code` | 207l/4475b |
| `update_boss_system` | `runtime_code` | 134l/4229b |
| `interrupt_dispatcher` | `shared_runtime` | 122l/4176b |
| `SCREEN_NEW_PLAYABLE_SCREEN_0_INTERACTION_TARGET_MAP` | `runtime_code` | 70l/4131b |
| `FAR_BANK_6_ROM_START` | `bank_marker` | 79l/3937b |
| `Condition_VariableCompare` | `runtime_code` | 186l/3892b |
| `wall_build_hitbox_cache` | `runtime_code` | 121l/3875b |
| `load_screen_new_playable_screen_777833014252` | `screen_loader` | 82l/3592b |
| `SCREEN_NEW_PLAYABLE_SCREEN_0_INTERACTION_VALUE_MAP` | `data` | 51l/3520b |
| `SCREEN_NEW_PLAYABLE_SCREEN_0_INTERACTION_TYPE_MAP` | `data` | 51l/3518b |
| `SCREEN_NEW_PLAYABLE_SCREEN_0_EFFECTS_LAYOUT` | `data` | 51l/3508b |
| `SCREEN_NEW_PLAYABLE_SCREEN_0_LAYOUT` | `data` | 50l/3446b |
| `wall_down_behavior_blocks` | `runtime_code` | 75l/3286b |
| `input_update_loop` | `runtime_code` | 108l/3269b |
| `FAR_BANK_8_ROM_START` | `bank_marker` | 79l/3183b |
| `init_components` | `boot_or_init` | 83l/3021b |

### Largest Unannotated Global Labels

- Unannotated labels: 304

| Category | Labels | Source |
| --- | ---: | ---: |
| `bank_marker` | 25 | 717l/31538b |
| `bios_helper` | 9 | 1721l/89611b |
| `boot_or_init` | 31 | 748l/19815b |
| `data` | 109 | 1847l/93639b |
| `far_trampoline` | 65 | 682l/13747b |
| `runtime_code` | 62 | 805l/27347b |
| `screen_loader` | 1 | 18l/458b |
| `shared_runtime` | 2 | 31l/1113b |

| Label | Category | Source |
| --- | --- | --- |
| `FAST_SNSMAT` | `bios_helper` | 1120l/71322b |
| `tile_pattern_bank0` | `data` | 261l/17019b |
| `tile_color_bank0` | `data` | 269l/16454b |
| `BANK_0_USED_END` | `bank_marker` | 141l/7659b |
| `vdpLoop` | `bios_helper` | 192l/6712b |
| `tilebank_color_data_0` | `data` | 73l/6061b |
| `tilebank_pattern_data_0` | `data` | 70l/5874b |
| `SCREEN_NEW_PLAYABLE_SCREEN_0_INTERACTION_TARGET_MAP` | `runtime_code` | 70l/4131b |
| `FAR_BANK_6_ROM_START` | `bank_marker` | 79l/3937b |
| `SCREEN_NEW_PLAYABLE_SCREEN_0_INTERACTION_VALUE_MAP` | `data` | 51l/3520b |
| `SCREEN_NEW_PLAYABLE_SCREEN_0_INTERACTION_TYPE_MAP` | `data` | 51l/3518b |
| `SCREEN_NEW_PLAYABLE_SCREEN_0_EFFECTS_LAYOUT` | `data` | 51l/3508b |
| `SCREEN_NEW_PLAYABLE_SCREEN_0_LAYOUT` | `data` | 50l/3446b |
| `FAR_BANK_8_ROM_START` | `bank_marker` | 79l/3183b |
| `init_char0_color` | `boot_or_init` | 95l/2487b |
| `restart_rom_continue` | `boot_or_init` | 83l/2480b |
| `FAST_LDIRVM` | `bios_helper` | 73l/2463b |
| `BANK_2_USED_END` | `bank_marker` | 41l/2149b |
| `init_interrupt_system` | `boot_or_init` | 63l/2073b |
| `init_entities` | `boot_or_init` | 91l/2038b |
| `resource_table` | `data` | 97l/1895b |
| `init_sprites` | `boot_or_init` | 68l/1814b |
| `FAST_WRTVDP` | `bios_helper` | 59l/1764b |
| `SCREEN_NEW_PLAYABLE_SCREEN_0_CHAR_BEHAVIOR_TABLE` | `data` | 28l/1735b |
| `FAST_WRTVRM` | `bios_helper` | 60l/1682b |
| `FAST_FILLVRM` | `bios_helper` | 76l/1677b |
| `FAST_RDVRM` | `bios_helper` | 53l/1498b |
| `FAR_BANK_10_ROM_START` | `bank_marker` | 34l/1434b |
| `joystick_direction_table` | `data` | 54l/1407b |
| `init_player_from_hero_entity` | `boot_or_init` | 62l/1324b |

| ID | Kind | Owner | Status | Incoming | Source | Lines | Labels |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `runtime.mapper.core` | `routine` | `mapper` | `rooted` | 129 | 213l/5412b | 5396-5608 | mapper_runtime_init, mapper_set_bank_p1, mapper_set_bank_p2, mapper_set_bank_p3, mapper_set_bank_p4, ... (+14) |
| `runtime.resources.manager` | `routine` | `resources` | `rooted` | 23 | 680l/17743b | 5793-6472 | resource_manager_init, resource_invalidate_pattern_vram_cache, resource_invalidate_color_vram_cache, resource_invalidate_font_vram_cache, resource_invalidate_gameplay_vram_cache, ... (+14) |
| `runtime.components.input_trigger_level` | `routine` | `components` | `candidate_unreferenced` | 0 | 33l/773b | 6554-6586 | component_trigger_level_pressed_a |
| `runtime.page0.stubs` | `routine` | `unified` | `rooted` | 1 | 22l/505b | 6593-6614 | init_page0_runtime_state, page0_map_expanded_slot, page0_map_game_rom, page0_restore_bios_rom, page0_copy_chunk_to_buffer, ... (+2) |
| `runtime.interrupt.stop` | `routine` | `interrupt` | `rooted` | 0 | 43l/1299b | 6693-6735 | stop_interrupt_system |
| `runtime.interrupt.dispatcher` | `routine` | `interrupt` | `preserved` | 1 | 124l/4150b | 6737-6860 | interrupt_dispatcher |
| `runtime.interrupt.vblank_flag` | `routine` | `interrupt` | `rooted` | 1 | 35l/983b | 6873-6907 | update_vblank_flag |
| `runtime.interrupt.task_api` | `routine` | `interrupt` | `rooted` | 1 | 121l/3195b | 6912-7032 | enable_task, disable_task, get_frame_count |
| `runtime.interrupt.task_input` | `routine` | `interrupt` | `rooted` | 2 | 228l/5981b | 7036-7263 | init_default_tasks_from_plan, task_update_input |
| `runtime.far_trampoline.init_sound_system_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/525b | 7529-7547 | init_sound_system_far |
| `runtime.far_trampoline.task_audio_tick_far` | `trampoline` | `far-call` | `preserved` | 0 | 19l/513b | 7549-7567 | task_audio_tick_far |
| `runtime.far_trampoline.sfx_update_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/483b | 7569-7587 | sfx_update_far |
| `runtime.far_trampoline.music_update_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/495b | 7589-7607 | music_update_far |
| `runtime.far_trampoline.music_stop_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/483b | 7609-7627 | music_stop_far |
| `runtime.far_trampoline.music_play_track_far` | `trampoline` | `far-call` | `preserved` | 1 | 21l/556b | 7629-7649 | music_play_track_far |
| `runtime.far_trampoline.music_execute_command_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/549b | 7651-7669 | music_execute_command_far |
| `runtime.sound.resident.init` | `routine` | `sound` | `referenced` | 1 | 4l/184b | 8173-8176 | call_init_sound_system_resident |
| `runtime.sound.resident.tick` | `routine` | `sound` | `referenced` | 3 | 18l/606b | 8178-8195 | call_task_audio_tick_resident |
| `runtime.sound.resident.music_update` | `routine` | `sound` | `referenced` | 2 | 4l/190b | 8197-8200 | call_music_update_resident |
| `runtime.sound.resident.sfx_update` | `routine` | `sound` | `referenced` | 1 | 4l/182b | 8202-8205 | call_sfx_update_resident |
| `runtime.sound.resident.music_stop` | `routine` | `sound` | `referenced` | 1 | 4l/182b | 8207-8210 | call_music_stop_resident |
| `runtime.sound.resident.music_play_track` | `routine` | `sound` | `referenced` | 1 | 4l/206b | 8212-8215 | call_music_play_track_resident |
| `runtime.sound.resident.music_execute_command` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/226b | 8217-8220 | call_music_execute_command_resident |
| `runtime.font.reload_stub` | `routine` | `unified` | `candidate_unreferenced` | 0 | 4l/146b | 8483-8486 | reload_font_system |
| `runtime.components.init` | `routine` | `components` | `rooted` | 11 | 86l/2962b | 8629-8714 | component_fill_32_a, init_components |
| `runtime.components.position` | `routine` | `components` | `rooted` | 3 | 108l/3281b | 8716-8823 | init_position_system, update_position_component, position_update_loop, position_next_entity |
| `runtime.components.sprite` | `routine` | `components` | `rooted` | 6 | 396l/10316b | 8824-9219 | init_sprite_system, update_sprite_component, sprite_update_loop, sprite_layer_loop, sprite_continue, ... (+6) |
| `runtime.components.movement_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 9225-9228 | update_movement_component |
| `runtime.components.collision` | `routine` | `components` | `referenced` | 2 | 668l/18861b | 9229-9896 | init_collision_system, update_collision_component, collision_update_loop, collision_next_entity, update_entity_collision_fast, ... (+13) |
| `runtime.components.behavior_tile` | `routine` | `components` | `rooted` | 9 | 110l/3809b | 9897-10006 | get_behavior_tile, get_behavior_tile_nb, gbt_oob |
| `runtime.components.directional_sprite_sync` | `routine` | `components` | `rooted` | 3 | 87l/2084b | 10007-10093 | component_sync_directional_sprite_from_initial, component_sync_directional_sprite_from_current, component_sync_directional_sprite_common |
| `runtime.components.input` | `routine` | `components` | `referenced` | 2 | 388l/12766b | 10094-10481 | init_input_system, update_input_component, input_update_loop, input_move_up, input_move_down, ... (+16) |
| `runtime.components.health` | `routine` | `components` | `rooted` | 2 | 152l/4701b | 10519-10670 | init_health_system, update_health_component, decrease_entity_lives, increase_entity_lives |
| `runtime.components.animation` | `routine` | `components` | `referenced` | 4 | 342l/10555b | 10671-11012 | init_animation_system, update_animation_component, anim_done_entity, refresh_player_animation_fastpath |
| `runtime.components.jump` | `routine` | `components` | `referenced` | 2 | 233l/7043b | 11013-11245 | init_jump_system, update_jump_component, jump_update_loop, jump_done_entity, jump_next_entity |
| `runtime.components.gravity` | `routine` | `components` | `rooted` | 2 | 137l/4553b | 11246-11382 | init_gravity_system, update_gravity_component, gravity_update_loop, gravity_store_vel, gravity_grounded, ... (+2) |
| `runtime.components.walljump_stub` | `routine` | `components` | `referenced` | 2 | 18l/326b | 11403-11420 | init_walljump_system, update_walljump_component, walljump_process_entity_c, walljump_input_is_left, walljump_input_is_right |
| `runtime.components.auto_destroy_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/219b | 11423-11429 | init_auto_destroy_system, update_auto_destroy_component |
| `runtime.components.state_machine_component_stub` | `routine` | `components` | `referenced` | 1 | 7l/241b | 11453-11459 | init_statemachine_system, update_statemachine_component |
| `runtime.components.retractable_gate_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/196b | 11465-11468 | update_retractable_gate_component |
| `runtime.components.carry` | `routine` | `components` | `rooted` | 1 | 81l/2148b | 11469-11549 | init_carry_system, update_carry_component |
| `runtime.components.auto_control_script_stubs` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/252b | 11555-11561 | update_auto_control_script_component, update_auto_event_string_component |
| `runtime.components.damage_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/166b | 11567-11570 | update_damage_component |
| `runtime.components.shoot_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/163b | 11576-11579 | update_shoot_component |
| `runtime.components.platform_riding_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/220b | 11599-11605 | prepare_platform_detection, update_platform_riding |
| `runtime.components.wallcollision` | `routine` | `components` | `referenced` | 3 | 839l/31288b | 11606-12444 | init_wallcollision_system, wall_behavior_is_full_blocker, wall_down_behavior_blocks, update_wallcollision_component, wall_build_hitbox_cache, ... (+2) |
| `runtime.components.deadly_tiles` | `routine` | `components` | `rooted` | 3 | 262l/5874b | 12445-12706 | init_deadly_tiles_system, deadly_tiles_runtime_tile_is_deadly_nb, update_entity_deadly_flag_runtime, update_deadly_tiles_component, refresh_player_deadly_fastpath |
| `runtime.components.in_water_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 12712-12715 | update_in_water_component |
| `runtime.components.collectible_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/181b | 12721-12724 | update_collectible_component |
| `runtime.components.entity_management` | `routine` | `components` | `rooted` | 3 | 221l/6553b | 12742-12962 | create_entity, entity_job_set, entity_job_set_period_ok, entity_job_set_entry_wrap, entity_job_set_entry_ok, ... (+13) |
| `runtime.components.scheduler` | `routine` | `components` | `rooted` | 7 | 1580l/35945b | 12963-14542 | update_all_entities, mark_used_entity_list_dirty, ensure_used_entity_list_current, rebuild_used_entity_list, ensure_player_fast_runtime_bound, ... (+10) |
| `runtime.components.state_machine_executor` | `routine` | `components` | `rooted` | 2 | 74l/1973b | 14548-14621 | execute_all_state_machines, refresh_player_state_machine_fastpath |
| `runtime.components.legacy_tile_collision` | `routine` | `components` | `candidate_unreferenced` | 0 | 43l/1404b | 14631-14673 | get_tile_at_position, get_tile_behavior, tile_behavior_table, check_collision_at_point, check_collision_box, ... (+1) |
| `runtime.components.secret_zone_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/181b | 14710-14713 | update_secret_zone_component |
| `runtime.statemachine.core` | `routine` | `stateMachine` | `rooted` | 4 | 1096l/25160b | 14731-15826 | SM_Update, sm_timer_no_overflow, sm_update_done, SM_CheckTransitions, SM_CheckTransitions_Loop, ... (+22) |
| `data.statemachine.statemachine_1777833246195` | `data` | `stateMachine` | `rooted` | 1 | 25l/863b | 15892-15916 | SM_New_Statemachine_state_1777833253256, SM_New_Statemachine_state_1777833253256_Transitions, SM_New_Statemachine_state_1777833253256_Transitions_Actions_0, SM_New_Statemachine_state_1777833256480 |
| `runtime.gameflow.worldlink` | `routine` | `gameflow` | `rooted` | 1 | 74l/2164b | 16038-16111 | gameflow_handle_worldlink |
| `runtime.gameflow.end_screen` | `routine` | `gameflow` | `rooted` | 1 | 146l/4078b | 16113-16258 | gameflow_handle_end, display_end_screen, print_string_vram, str_victory, str_game_over, ... (+1) |
| `runtime.gameflow.connection_by_type` | `routine` | `gameflow` | `candidate_unreferenced` | 0 | 37l/701b | 16295-16331 | gameflow_get_connection_by_type |
| `runtime.gameflow.confirm_input_direct` | `routine` | `gameflow` | `candidate_unreferenced` | 0 | 12l/298b | 16356-16367 | gameflow_read_confirm_direct |
| `runtime.gameflow.world_loop` | `routine` | `gameflow` | `rooted` | 1 | 65l/2282b | 16375-16439 | gameflow_world_game_loop |
| `runtime.gameflow.clear_screen_area_helpers` | `routine` | `gameflow` | `referenced` | 1 | 60l/1737b | 16545-16604 | clear_screen_area, clear_screen_row, empty_row_data |
| `runtime.boss.entry` | `routine` | `bosses` | `rooted` | 2 | 73l/1760b | 17695-17767 | init_boss_system, update_boss_system |
| `runtime.boss.core` | `routine` | `bosses` | `rooted` | 9 | 876l/19553b | 17769-18644 | init_screen_boss_from_current_screen, boss_resolve_initial_phase, boss_init_behavior_state, draw_active_boss_tiles, restore_active_boss_tiles, ... (+21) |
| `runtime.screens.colors` | `routine` | `screens` | `rooted` | 1 | 44l/1514b | 18850-18893 | color_shift_table, set_screen_colors |
| `runtime.screens.copy_rect` | `routine` | `screens` | `rooted` | 0 | 77l/1494b | 18987-19063 | copy_layout_rect_to_vram, copy_layout_rect_ram_to_ram |
| `runtime.screens.block_layout_expander` | `routine` | `screens` | `rooted` | 0 | 194l/3798b | 19065-19258 | expand_screen_block_layout_to_background, expand_screen_block_layout_2x2, expand_screen_block_layout_4x4 |
| `runtime.screens.behavior_map_rebuild` | `routine` | `screens` | `referenced` | 1 | 26l/709b | 19276-19301 | build_runtime_behavior_map_from_screen_layout |
| `runtime.screens.load_screen_stub` | `routine` | `screens` | `candidate_unreferenced` | 0 | 6l/232b | 19302-19307 | load_screen |
| `runtime.screens.load_screen_new_playable_screen_777833014252.loader` | `routine` | `screens` | `rooted` | 1 | 114l/4685b | 19309-19422 | load_screen_new_playable_screen_777833014252, load_new_playable_screen_777833014252_boss_done |
| `data.entities.player_1.init` | `routine` | `entities` | `rooted` | 1 | 177l/4974b | 19580-19756 | init_player_1 |
| `runtime.entities.patrol_facing` | `routine` | `entities` | `rooted` | 0 | 88l/2125b | 19933-20020 | update_entity_patrol_facing |
| `runtime.sound.init` | `routine` | `sound` | `rooted` | 1 | 22l/725b | 20199-20220 | init_sound_system |
| `runtime.sound.tick` | `routine` | `sound` | `rooted` | 1 | 17l/320b | 20227-20243 | task_audio_tick |
| `runtime.sound.psg_lowlevel` | `routine` | `sound` | `rooted` | 27 | 117l/3450b | 20248-20364 | psg_write, psg_set_tone, psg_set_volume, psg_set_noise, psg_set_mixer, ... (+1) |
| `runtime.sound.sfx_silence` | `routine` | `sound` | `referenced` | 2 | 21l/579b | 20374-20394 | sfx_silence_all |
| `runtime.sound.sfx_builtin_effects` | `routine` | `sound` | `referenced` | 6 | 127l/3025b | 20400-20526 | sfx_beep, sfx_jump, sfx_shoot, sfx_explosion, sfx_coin, ... (+1) |
| `runtime.sound.sfx_playback` | `routine` | `sound` | `referenced` | 1 | 119l/2384b | 20544-20662 | play_sound_effect, play_sound_effect_beep, play_sound_effect_jump, play_sound_effect_shoot, play_sound_effect_explosion, ... (+4) |
| `runtime.sound.music_noop_runtime` | `routine` | `sound` | `referenced` | 5 | 66l/1337b | 20671-20736 | music_init_system, music_reset_channel_state, music_silence_channels, music_stop, music_mute, ... (+7) |
| `runtime.sound.music_reset_noop` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/163b | 20692-20695 | music_reset_channel_state |
| `runtime.sprites.show_sprite_legacy` | `routine` | `sprites` | `candidate_unreferenced` | 0 | 43l/981b | 21029-21071 | show_sprite |
| `runtime.animtiles.core` | `routine` | `animtiles` | `rooted` | 3 | 318l/9265b | 21149-21466 | init_animated_tiles, update_animated_tiles, update_animated_tiles_vram, set_animation_speed, anim_copy_8_bytes, ... (+9) |
| `runtime.scroll.core` | `routine` | `scroll` | `rooted` | 0 | 340l/8599b | 21486-21825 | init_scroll_system, set_camera_position, move_camera, center_camera_on_entity, update_scroll, ... (+2) |
| `runtime.worlds.worldmap_1777833018852.loader` | `routine` | `worlds` | `rooted` | 2 | 32l/1257b | 21925-21956 | load_world_worldmap_1777833018852 |
| `runtime.worlds.current_screen_helpers` | `routine` | `worlds` | `candidate_unreferenced` | 0 | 23l/633b | 22029-22051 | get_current_world_id, get_current_screen_index, set_current_screen |
| `runtime.hud.empty_update_stubs` | `routine` | `hud` | `candidate_unreferenced` | 0 | 6l/178b | 22294-22299 | update_hud_score, update_hud_lives |

## Dead-Block Candidates

- `runtime.components.legacy_tile_collision`: 43 lines / 1404 bytes. No external references found for any global label in this block.
- `runtime.sprites.show_sprite_legacy`: 43 lines / 981 bytes. No external references found for any global label in this block.
- `runtime.components.input_trigger_level`: 33 lines / 773 bytes. No external references found for any global label in this block.
- `runtime.gameflow.connection_by_type`: 37 lines / 701 bytes. No external references found for any global label in this block.
- `runtime.worlds.current_screen_helpers`: 23 lines / 633 bytes. No external references found for any global label in this block.
- `runtime.gameflow.confirm_input_direct`: 12 lines / 298 bytes. No external references found for any global label in this block.
- `runtime.components.auto_control_script_stubs`: 7 lines / 252 bytes. No external references found for any global label in this block.
- `runtime.screens.load_screen_stub`: 6 lines / 232 bytes. No external references found for any global label in this block.
- `runtime.sound.resident.music_execute_command`: 4 lines / 226 bytes. No external references found for any global label in this block.
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

- Metrics: findings=21, patchable=21, removed_lines=264, removed_source_bytes=7657
- Routines: runtime.components.auto_control_script_stubs, runtime.components.auto_destroy_stub, runtime.components.collectible_stub, runtime.components.damage_stub, runtime.components.in_water_stub, runtime.components.input_trigger_level, runtime.components.legacy_tile_collision, runtime.components.movement_stub, runtime.components.platform_riding_stub, runtime.components.retractable_gate_stub, runtime.components.secret_zone_stub, runtime.components.shoot_stub, runtime.font.reload_stub, runtime.gameflow.confirm_input_direct, runtime.gameflow.connection_by_type, runtime.hud.empty_update_stubs, runtime.screens.load_screen_stub, runtime.sound.music_reset_noop, runtime.sound.resident.music_execute_command, runtime.sprites.show_sprite_legacy, runtime.worlds.current_screen_helpers

- [patchable] `runtime.components.input_trigger_level` lines 6554-6586: Block `runtime.components.input_trigger_level` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: component_trigger_level_pressed_a.
- [patchable] `runtime.sound.resident.music_execute_command` lines 8217-8220: Block `runtime.sound.resident.music_execute_command` (routine/sound) is a dead-code candidate. No external references found for any global label in this block. Labels: call_music_execute_command_resident.
- [patchable] `runtime.font.reload_stub` lines 8483-8486: Block `runtime.font.reload_stub` (routine/unified) is a dead-code candidate. No external references found for any global label in this block. Labels: reload_font_system.
- [patchable] `runtime.components.movement_stub` lines 9225-9228: Block `runtime.components.movement_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_movement_component.
- [patchable] `runtime.components.auto_destroy_stub` lines 11423-11429: Block `runtime.components.auto_destroy_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: init_auto_destroy_system, update_auto_destroy_component.
- [patchable] `runtime.components.retractable_gate_stub` lines 11465-11468: Block `runtime.components.retractable_gate_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_retractable_gate_component.
- [patchable] `runtime.components.auto_control_script_stubs` lines 11555-11561: Block `runtime.components.auto_control_script_stubs` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_auto_control_script_component, update_auto_event_string_component.
- [patchable] `runtime.components.damage_stub` lines 11567-11570: Block `runtime.components.damage_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_damage_component.
- [patchable] `runtime.components.shoot_stub` lines 11576-11579: Block `runtime.components.shoot_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_shoot_component.
- [patchable] `runtime.components.platform_riding_stub` lines 11599-11605: Block `runtime.components.platform_riding_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: prepare_platform_detection, update_platform_riding.
- [patchable] `runtime.components.in_water_stub` lines 12712-12715: Block `runtime.components.in_water_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_in_water_component.
- [patchable] `runtime.components.collectible_stub` lines 12721-12724: Block `runtime.components.collectible_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_collectible_component.
- [patchable] `runtime.components.legacy_tile_collision` lines 14631-14673: Block `runtime.components.legacy_tile_collision` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: get_tile_at_position, get_tile_behavior, tile_behavior_table, check_collision_at_point, check_collision_box, ... (+1).
- [patchable] `runtime.components.secret_zone_stub` lines 14710-14713: Block `runtime.components.secret_zone_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_secret_zone_component.
- [patchable] `runtime.gameflow.connection_by_type` lines 16295-16331: Block `runtime.gameflow.connection_by_type` (routine/gameflow) is a dead-code candidate. No external references found for any global label in this block. Labels: gameflow_get_connection_by_type.
- [patchable] `runtime.gameflow.confirm_input_direct` lines 16356-16367: Block `runtime.gameflow.confirm_input_direct` (routine/gameflow) is a dead-code candidate. No external references found for any global label in this block. Labels: gameflow_read_confirm_direct.
- [patchable] `runtime.screens.load_screen_stub` lines 19302-19307: Block `runtime.screens.load_screen_stub` (routine/screens) is a dead-code candidate. No external references found for any global label in this block. Labels: load_screen.
- [patchable] `runtime.sound.music_reset_noop` lines 20692-20695: Block `runtime.sound.music_reset_noop` (routine/sound) is a dead-code candidate. No external references found for any global label in this block. Labels: music_reset_channel_state.
- [patchable] `runtime.sprites.show_sprite_legacy` lines 21029-21071: Block `runtime.sprites.show_sprite_legacy` (routine/sprites) is a dead-code candidate. No external references found for any global label in this block. Labels: show_sprite.
- [patchable] `runtime.worlds.current_screen_helpers` lines 22029-22051: Block `runtime.worlds.current_screen_helpers` (routine/worlds) is a dead-code candidate. No external references found for any global label in this block. Labels: get_current_world_id, get_current_screen_index, set_current_screen.
- [patchable] `runtime.hud.empty_update_stubs` lines 22294-22299: Block `runtime.hud.empty_update_stubs` (routine/hud) is a dead-code candidate. No external references found for any global label in this block. Labels: update_hud_score, update_hud_lives.

## inactive-feature-runtime

- Metrics: findings=41, patchable=3, removed_lines=30, removed_source_bytes=872
- Routines: call_init_sound_system_resident, call_music_execute_command_resident, call_music_play_track_resident, call_music_stop_resident, call_music_update_resident, call_sfx_update_resident, call_task_audio_tick_resident, init_sound_system, init_sound_system_far, music_execute_command, music_execute_command_far, music_init_system, music_play_track, music_play_track_far, music_reset_channel_state, music_silence_channels, music_stop, music_stop_far, music_update_far, runtime.sound.group.init, runtime.sound.group.music_execute_command, runtime.sound.group.music_execute_command:call_music_execute_command_resident, runtime.sound.group.music_execute_command:music_execute_command, runtime.sound.group.music_execute_command:music_execute_command_far, runtime.sound.group.music_play_track, runtime.sound.group.music_stop, runtime.sound.group.music_update, runtime.sound.group.sfx_update, runtime.sound.group.tick, sfx_beep, sfx_coin, sfx_damage, sfx_explosion, sfx_jump, sfx_play, sfx_shoot, sfx_silence_all, sfx_update, sfx_update_far, task_audio_tick, task_audio_tick_far

- [report-only] `runtime.sound.group.init` lines 7530-20227: `runtime.sound.group.init` groups inactive audio init runtime labels: call_init_sound_system_resident, init_sound_system, init_sound_system_far. Group deletion remains blocked by 1 external references: init_rom->call_init_sound_system_resident@3559.
- [report-only] `init_sound_system_far` lines 7530-7549: `init_sound_system_far` looks like audio runtime (20 lines, 524 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: boot_or_init (Boot/init routine). External references still exist (1): call_init_sound_system_resident@8175. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `runtime.sound.group.tick` lines 7550-20256: `runtime.sound.group.tick` groups inactive audio tick runtime labels: call_task_audio_tick_resident, task_audio_tick, task_audio_tick_far. Group deletion remains blocked by 3 external references: init_rom->call_task_audio_tick_resident@3580, gameflow_handle_end->call_task_audio_tick_resident@16140, gameflow_world_game_loop->call_task_audio_tick_resident@16384.
- [report-only] `task_audio_tick_far` lines 7550-7569: `task_audio_tick_far` looks like audio runtime (20 lines, 509 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Patch remains disabled because `task_audio_tick_far` is inside annotated block `runtime.far_trampoline.task_audio_tick_far`; group-level deletion must be handled by dead-blocks. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `runtime.sound.group.sfx_update` lines 7570-20671: `runtime.sound.group.sfx_update` groups inactive SFX update runtime labels: call_sfx_update_resident, sfx_update, sfx_update_far. Group deletion remains blocked by 1 external references: gameflow_world_game_loop->call_sfx_update_resident@16417.
- [report-only] `sfx_update_far` lines 7570-7589: `sfx_update_far` looks like audio runtime (20 lines, 486 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_sfx_update_resident@8204. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `runtime.sound.group.music_update` lines 7590-20718: `runtime.sound.group.music_update` groups inactive music update runtime labels: call_music_update_resident, music_update, music_update_far. Group deletion remains blocked by 2 external references: call_task_audio_tick_resident->call_music_update_resident@8188, task_audio_tick->call_music_update_resident@20234.
- [report-only] `music_update_far` lines 7590-7609: `music_update_far` looks like audio runtime (20 lines, 494 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_music_update_resident@8199. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `runtime.sound.group.music_stop` lines 7610-20715: `runtime.sound.group.music_stop` groups inactive music stop runtime labels: call_music_stop_resident, music_stop, music_stop_far. Group deletion remains blocked by 2 external references: music_execute_command->music_stop@20728, update_scroll->call_music_stop_resident@21895.
- [report-only] `music_stop_far` lines 7610-7629: `music_stop_far` looks like audio runtime (20 lines, 490 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_music_stop_resident@8209. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `runtime.sound.group.music_play_track` lines 7630-20722: `runtime.sound.group.music_play_track` groups inactive music play-track runtime labels: call_music_play_track_resident, music_play_track, music_play_track_far. Group deletion remains blocked by 1 external references: update_scroll->call_music_play_track_resident@21913.
- [report-only] `music_play_track_far` lines 7630-7651: `music_play_track_far` looks like audio runtime (22 lines, 562 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_music_play_track_resident@8214. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.music_execute_command:music_execute_command_far` lines 7651-7669: `music_execute_command_far` is part of inactive runtime group `runtime.sound.group.music_execute_command`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.sound.group.music_execute_command` lines 7652-20730: `runtime.sound.group.music_execute_command` groups inactive music command runtime labels: call_music_execute_command_resident, music_execute_command, music_execute_command_far. No external references outside the group were found. This is ready for a future atomic multi-window patch, or for dead-blocks to remove the annotated windows as whole groups. Atomic patch enabled as `runtime.sound.group.music_execute_command` with 3 window(s).
- [report-only] `music_execute_command_far` lines 7652-7673: `music_execute_command_far` looks like audio runtime (22 lines, 507 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_music_execute_command_resident@8219. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_init_sound_system_resident` lines 8174-8178: `call_init_sound_system_resident` looks like audio runtime (5 lines, 185 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): init_rom@3559. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_task_audio_tick_resident` lines 8179-8197: `call_task_audio_tick_resident` looks like audio runtime (19 lines, 615 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (3): init_rom@3580, gameflow_handle_end@16140, gameflow_world_game_loop@16384. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_music_update_resident` lines 8198-8202: `call_music_update_resident` looks like audio runtime (5 lines, 189 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (2): call_task_audio_tick_resident@8188, task_audio_tick@20234. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_sfx_update_resident` lines 8203-8207: `call_sfx_update_resident` looks like audio runtime (5 lines, 183 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): gameflow_world_game_loop@16417. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_music_stop_resident` lines 8208-8212: `call_music_stop_resident` looks like audio runtime (5 lines, 189 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): update_scroll@21895. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_music_play_track_resident` lines 8213-8217: `call_music_play_track_resident` looks like audio runtime (5 lines, 212 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): update_scroll@21913. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.music_execute_command:call_music_execute_command_resident` lines 8217-8220: `call_music_execute_command_resident` is part of inactive runtime group `runtime.sound.group.music_execute_command`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_music_execute_command_resident` lines 8218-8221: `call_music_execute_command_resident` looks like audio runtime (4 lines, 138 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Patch remains disabled because `call_music_execute_command_resident` is inside annotated block `runtime.sound.resident.music_execute_command`; group-level deletion must be handled by dead-blocks. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `init_sound_system` lines 20200-20227: `init_sound_system` looks like audio runtime (28 lines, 1006 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: boot_or_init (Boot/init routine). External references still exist (1): init_sound_system_far@7537. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `task_audio_tick` lines 20228-20256: `task_audio_tick` looks like audio runtime (29 lines, 836 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: shared_runtime (Shared low-level runtime helper). External references still exist (1): task_audio_tick_far@7557. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_silence_all` lines 20375-20400: `sfx_silence_all` looks like audio runtime (26 lines, 757 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (2): init_sound_system@20217, sfx_update@20658. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_beep` lines 20401-20421: `sfx_beep` looks like audio runtime (21 lines, 492 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_beep@20563. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_jump` lines 20422-20443: `sfx_jump` looks like audio runtime (22 lines, 473 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_jump@20569. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_shoot` lines 20444-20468: `sfx_shoot` looks like audio runtime (25 lines, 565 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_shoot@20575. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_explosion` lines 20469-20488: `sfx_explosion` looks like audio runtime (20 lines, 497 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_explosion@20581. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_coin` lines 20489-20510: `sfx_coin` looks like audio runtime (22 lines, 536 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_coin@20587. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_damage` lines 20511-20544: `sfx_damage` looks like audio runtime (34 lines, 1140 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_damage@20593. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_play` lines 20604-20632: `sfx_play` looks like audio runtime (29 lines, 600 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (6): play_sound_effect_beep@20565, play_sound_effect_jump@20571, play_sound_effect_shoot@20577, play_sound_effect_explosion@20583, play_sound_effect_coin@20589, ... (+1 more). Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_update` lines 20633-20671: `sfx_update` looks like audio runtime (39 lines, 1016 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): sfx_update_far@7577. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `music_init_system` lines 20672-20692: `music_init_system` looks like audio runtime (21 lines, 566 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (2): init_sound_system@20214, music_stop@20712. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `music_reset_channel_state` lines 20693-20696: `music_reset_channel_state` looks like audio runtime (4 lines, 89 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Patch remains disabled because `music_reset_channel_state` is inside annotated block `runtime.sound.music_reset_noop`; group-level deletion must be handled by dead-blocks. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `music_silence_channels` lines 20697-20710: `music_silence_channels` looks like audio runtime (14 lines, 212 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): music_stop@20713. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `music_stop` lines 20711-20715: `music_stop` looks like audio runtime (5 lines, 80 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (2): music_stop_far@7617, music_execute_command@20728. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `music_play_track` lines 20720-20722: `music_play_track` looks like audio runtime (3 lines, 27 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): music_play_track_far@7638. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.music_execute_command:music_execute_command` lines 20723-20729: `music_execute_command` is part of inactive runtime group `runtime.sound.group.music_execute_command`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `music_execute_command` lines 20723-20730: `music_execute_command` looks like audio runtime (8 lines, 98 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): music_execute_command_far@7659. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.

## Optimization Passes

- Pass 1: findings=62, patchable=23, removed=290 lines / 8303 bytes, lines=22306->22016
- Pass 2: findings=33, patchable=0, removed=0 lines / 0 bytes, lines=22016->22016

