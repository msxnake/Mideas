# Post-ASM Report

- Input: `C:\Users\salam\Documents\Programacion\Mideas\server\temp\atenas115_music_compressed.asm`
- Selected rules: dead-blocks, unused-screen-loaders, inactive-feature-runtime, unused-boss-attack-runtime, unused-component-runtime, state-machine-dispatch-handlers
- Findings: 152
- Applied patches: 102
- Original lines: 47921
- Output lines: 47350
- Net line delta: -571

- Optimization passes run: 1
- Optimization source removed: 571 lines / 17244 bytes

## Mideas Block Inventory

- Blocks: 110
- Preserved blocks: 25
- Removable-by-policy blocks: 85
- Dead-block candidates: 20
- Annotated block source: 17183 lines / 486544 bytes
- Dead-candidate source: 208 lines / 6157 bytes
- Marker errors: 2

- By kind: data=2, routine=98, trampoline=10
- By owner: animtiles=1, bosses=13, components=33, dialogues=1, entities=3, far-call=10, font=1, gameflow=7, hud=1, interrupt=5, mapper=1, menus=1, resources=1, screens=10, scroll=1, sound=13, sprites=1, stateMachine=3, unified=1, worlds=3
- By status: candidate_unreferenced=20, empty=2, preserved=25, referenced=18, rooted=45

### Largest Annotated Blocks

| ID | Status | Source | Kind | Owner |
| --- | --- | --- | --- | --- |
| `runtime.gameflow.world_loop` | `rooted` | 2046l/63558b | `routine` | `gameflow` |
| `runtime.components.scheduler` | `rooted` | 2649l/61306b | `routine` | `components` |
| `runtime.statemachine.core` | `rooted` | 1852l/52596b | `routine` | `stateMachine` |
| `runtime.components.wallcollision` | `referenced` | 839l/31288b | `routine` | `components` |
| `runtime.components.collision` | `referenced` | 668l/18861b | `routine` | `components` |
| `runtime.resources.manager` | `rooted` | 697l/18133b | `routine` | `resources` |
| `runtime.components.tile_interaction` | `rooted` | 622l/15401b | `routine` | `components` |
| `runtime.components.input` | `referenced` | 393l/13136b | `routine` | `components` |
| `runtime.dialogue.system` | `preserved` | 584l/12271b | `routine` | `dialogues` |
| `runtime.components.animation` | `referenced` | 342l/10555b | `routine` | `components` |
| `runtime.components.sprite` | `rooted` | 396l/10316b | `routine` | `components` |
| `runtime.animtiles.core` | `rooted` | 325l/9460b | `routine` | `animtiles` |
| `runtime.scroll.core` | `rooted` | 332l/8535b | `routine` | `scroll` |
| `runtime.interrupt.task_input` | `rooted` | 272l/7149b | `routine` | `interrupt` |
| `runtime.components.jump` | `referenced` | 233l/7043b | `routine` | `components` |
| `runtime.font.loading` | `rooted` | 229l/6905b | `routine` | `font` |
| `runtime.components.entity_management` | `rooted` | 221l/6553b | `routine` | `components` |
| `data.entities.player_1.init` | `rooted` | 222l/6316b | `routine` | `entities` |
| `runtime.components.deadly_tiles` | `rooted` | 262l/5874b | `routine` | `components` |
| `runtime.mapper.core` | `rooted` | 213l/5412b | `routine` | `mapper` |

- Marker error: Line 37991: @mideas:endblock without open block.
- Marker error: Line 45876: @mideas:block id=runtime.gameflow.world_loop has no closing @mideas:endblock.

## Inactive Feature Runtime Inventory

| Feature | Findings | Patchable | Annotated | Unannotated | Preserved | Owners |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `bosses` | 18 | 0 | 18 | 0 | 15 | bosses=15, far-call=3 |
| `menus` | 3 | 0 | 3 | 0 | 3 | menus=3 |

## Global Label Inventory

- Global labels: 1113

| Label | Category | Source |
| --- | --- | --- |
| `FAST_SNSMAT` | `bios_helper` | 1095l/68006b |
| `update_wallcollision_component` | `runtime_code` | 538l/20410b |
| `Action_ChangeSprite` | `runtime_code` | 330l/14930b |
| `update_player_fastpath` | `runtime_code` | 604l/13839b |
| `execute_transition_effect` | `runtime_code` | 398l/11680b |
| `update_entity_collision_fast` | `runtime_code` | 345l/9814b |
| `FAR_BANK_12_ROM_START` | `bank_marker` | 178l/9623b |
| `resource_table` | `data` | 625l/9544b |
| `PRESENTATION_SCREEN_PATTERNS_B2` | `data` | 131l/9095b |
| `PRESENTATION_SCREEN_COLORS_B2` | `data` | 131l/9091b |
| `scan_tile_interaction_entities` | `runtime_code` | 342l/9011b |
| `update_animation_component` | `runtime_code` | 255l/8328b |
| `PRESENTATION_SCREEN_PATTERNS_B1` | `data` | 120l/8107b |
| `PRESENTATION_SCREEN_COLORS_B1` | `data` | 114l/7884b |
| `BANK_0_USED_END` | `bank_marker` | 142l/7782b |
| `PRESENTATION_SCREEN_COLORS_B0` | `data` | 108l/7434b |
| `load_sprite_patterns_worldmap_1778070705501` | `data` | 182l/7399b |
| `PRESENTATION_SCREEN_PATTERNS_B0` | `data` | 105l/7249b |
| `BANK_2_USED_END` | `bank_marker` | 131l/6722b |
| `vdpLoop` | `bios_helper` | 192l/6712b |
| `mapper_call_hl_auto` | `shared_runtime` | 147l/6328b |
| `init_player_1` | `boot_or_init` | 222l/6222b |
| `task_update_input` | `shared_runtime` | 242l/6074b |
| `walljump_process_entity_c` | `runtime_code` | 256l/5548b |
| `screen_runtime_summary_table` | `data` | 106l/5176b |
| `execute_transition_reveal_target` | `runtime_code` | 265l/4788b |
| `jump_update_loop` | `runtime_code` | 157l/4675b |
| `rebuild_used_entity_list` | `runtime_code` | 207l/4475b |
| `init_fakeplayer_1` | `boot_or_init` | 162l/4450b |
| `interrupt_dispatcher` | `shared_runtime` | 122l/4176b |

### Largest Unannotated Global Labels

- Unannotated labels: 513

| Category | Labels | Source |
| --- | ---: | ---: |
| `bank_marker` | 13 | 737l/35471b |
| `bios_helper` | 9 | 1720l/86798b |
| `boot_or_init` | 30 | 924l/23942b |
| `data` | 233 | 3625l/149667b |
| `far_trampoline` | 71 | 1272l/27882b |
| `runtime_code` | 151 | 5464l/132189b |
| `screen_loader` | 4 | 100l/2486b |
| `shared_runtime` | 2 | 32l/1222b |

| Label | Category | Source |
| --- | --- | --- |
| `FAST_SNSMAT` | `bios_helper` | 1095l/68006b |
| `execute_transition_effect` | `runtime_code` | 398l/11680b |
| `FAR_BANK_12_ROM_START` | `bank_marker` | 178l/9623b |
| `resource_table` | `data` | 625l/9544b |
| `PRESENTATION_SCREEN_PATTERNS_B2` | `data` | 131l/9095b |
| `PRESENTATION_SCREEN_COLORS_B2` | `data` | 131l/9091b |
| `PRESENTATION_SCREEN_PATTERNS_B1` | `data` | 120l/8107b |
| `PRESENTATION_SCREEN_COLORS_B1` | `data` | 114l/7884b |
| `BANK_0_USED_END` | `bank_marker` | 142l/7782b |
| `PRESENTATION_SCREEN_COLORS_B0` | `data` | 108l/7434b |
| `load_sprite_patterns_worldmap_1778070705501` | `data` | 182l/7399b |
| `PRESENTATION_SCREEN_PATTERNS_B0` | `data` | 105l/7249b |
| `BANK_2_USED_END` | `bank_marker` | 131l/6722b |
| `vdpLoop` | `bios_helper` | 192l/6712b |
| `walljump_process_entity_c` | `runtime_code` | 256l/5548b |
| `screen_runtime_summary_table` | `data` | 106l/5176b |
| `execute_transition_reveal_target` | `runtime_code` | 265l/4788b |
| `init_entities` | `boot_or_init` | 152l/3531b |
| `music_track_0_Glass_Runner_data` | `data` | 147l/3503b |
| `PRESENTATION_SCREEN_NAMETBL` | `data` | 52l/3486b |
| `init_char0_color` | `boot_or_init` | 127l/3471b |
| `tilebank_pattern_data_1` | `data` | 50l/3404b |
| `tilebank_pattern_data_0` | `data` | 48l/3253b |
| `FAR_BANK_8_ROM_START` | `bank_marker` | 79l/3183b |
| `music_resolve_channel_volume` | `runtime_code` | 159l/3078b |
| `gameflow_handle_transition` | `runtime_code` | 66l/3068b |
| `load_sprite_patterns_worldmap_1778241700081` | `data` | 72l/2850b |
| `FAR_BANK_10_ROM_START` | `bank_marker` | 78l/2814b |
| `gameflow_world_game_loop` | `runtime_code` | 81l/2698b |
| `FAST_LDIRVM` | `bios_helper` | 80l/2624b |

| ID | Kind | Owner | Status | Incoming | Source | Lines | Labels |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `runtime.mapper.core` | `routine` | `mapper` | `rooted` | 173 | 213l/5412b | 19973-20185 | mapper_runtime_init, mapper_set_bank_p1, mapper_set_bank_p2, mapper_set_bank_p3, mapper_set_bank_p4, ... (+14) |
| `runtime.resources.manager` | `routine` | `resources` | `rooted` | 128 | 697l/18133b | 20986-21682 | resource_manager_init, resource_invalidate_pattern_vram_cache, resource_invalidate_color_vram_cache, resource_invalidate_font_vram_cache, resource_invalidate_gameplay_vram_cache, ... (+14) |
| `runtime.components.input_trigger_level` | `routine` | `components` | `candidate_unreferenced` | 0 | 33l/773b | 21764-21796 | component_trigger_level_pressed_a |
| `runtime.page0.stubs` | `routine` | `unified` | `rooted` | 1 | 22l/505b | 21803-21824 | init_page0_runtime_state, page0_map_expanded_slot, page0_map_game_rom, page0_restore_bios_rom, page0_copy_chunk_to_buffer, ... (+2) |
| `runtime.interrupt.stop` | `routine` | `interrupt` | `rooted` | 0 | 43l/1299b | 21905-21947 | stop_interrupt_system |
| `runtime.interrupt.dispatcher` | `routine` | `interrupt` | `preserved` | 1 | 124l/4150b | 21949-22072 | interrupt_dispatcher |
| `runtime.interrupt.vblank_flag` | `routine` | `interrupt` | `rooted` | 1 | 35l/983b | 22085-22119 | update_vblank_flag |
| `runtime.interrupt.task_api` | `routine` | `interrupt` | `rooted` | 1 | 121l/3195b | 22124-22244 | enable_task, disable_task, get_frame_count |
| `runtime.interrupt.task_input` | `routine` | `interrupt` | `rooted` | 2 | 272l/7149b | 22248-22519 | init_default_tasks_from_plan, task_update_input |
| `runtime.far_trampoline.init_sound_system_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/709b | 22574-22599 | init_sound_system_far |
| `runtime.far_trampoline.task_audio_tick_far` | `trampoline` | `far-call` | `preserved` | 0 | 26l/695b | 22601-22626 | task_audio_tick_far |
| `runtime.far_trampoline.sfx_update_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/660b | 22628-22653 | sfx_update_far |
| `runtime.far_trampoline.music_update_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/674b | 22655-22680 | music_update_far |
| `runtime.far_trampoline.music_stop_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/660b | 22682-22707 | music_stop_far |
| `runtime.far_trampoline.music_play_track_far` | `trampoline` | `far-call` | `preserved` | 1 | 28l/739b | 22709-22736 | music_play_track_far |
| `runtime.far_trampoline.music_execute_command_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/737b | 22738-22763 | music_execute_command_far |
| `runtime.far_trampoline.init_boss_system_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/703b | 24162-24187 | init_boss_system_far |
| `runtime.far_trampoline.init_screen_boss_from_current_screen_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/843b | 24189-24214 | init_screen_boss_from_current_screen_far |
| `runtime.far_trampoline.update_boss_system_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/717b | 24216-24241 | update_boss_system_far |
| `runtime.sound.resident.init` | `routine` | `sound` | `referenced` | 1 | 4l/184b | 24322-24325 | call_init_sound_system_resident |
| `runtime.sound.resident.tick` | `routine` | `sound` | `referenced` | 10 | 18l/606b | 24327-24344 | call_task_audio_tick_resident |
| `runtime.sound.resident.music_update` | `routine` | `sound` | `referenced` | 2 | 4l/190b | 24346-24349 | call_music_update_resident |
| `runtime.sound.resident.sfx_update` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/182b | 24351-24354 | call_sfx_update_resident |
| `runtime.sound.resident.music_stop` | `routine` | `sound` | `referenced` | 1 | 4l/182b | 24356-24359 | call_music_stop_resident |
| `runtime.sound.resident.music_play_track` | `routine` | `sound` | `referenced` | 2 | 4l/206b | 24361-24364 | call_music_play_track_resident |
| `runtime.sound.resident.music_execute_command` | `routine` | `sound` | `referenced` | 1 | 4l/226b | 24366-24369 | call_music_execute_command_resident |
| `runtime.boss.resident.init` | `routine` | `bosses` | `preserved` | 0 | 4l/232b | 24483-24486 | call_init_boss_system_resident |
| `runtime.boss.resident.init_screen` | `routine` | `bosses` | `preserved` | 0 | 4l/306b | 24488-24491 | call_init_screen_boss_from_current_screen_resident |
| `runtime.boss.resident.update` | `routine` | `bosses` | `preserved` | 0 | 4l/242b | 24493-24496 | call_update_boss_system_resident |
| `runtime.boss.resident.update_projectile` | `routine` | `bosses` | `preserved` | 0 | 4l/279b | 24498-24501 | call_update_boss_projectile_runtime_resident |
| `runtime.boss.resident.draw_attack` | `routine` | `bosses` | `preserved` | 0 | 4l/239b | 24503-24506 | call_draw_boss_attack_resident |
| `runtime.boss.resident.draw_meteor` | `routine` | `bosses` | `preserved` | 0 | 4l/253b | 24508-24511 | call_draw_boss_meteor_attack_resident |
| `runtime.boss.resident.draw_bomb` | `routine` | `bosses` | `preserved` | 0 | 4l/245b | 24513-24516 | call_draw_boss_bomb_attack_resident |
| `runtime.boss.resident.draw_boomerang` | `routine` | `bosses` | `preserved` | 0 | 4l/265b | 24518-24521 | call_draw_boss_boomerang_attack_resident |
| `runtime.boss.resident.draw_rock` | `routine` | `bosses` | `preserved` | 0 | 4l/245b | 24523-24526 | call_draw_boss_rock_attack_resident |
| `runtime.boss.resident.draw_laser` | `routine` | `bosses` | `preserved` | 0 | 4l/249b | 24528-24531 | call_draw_boss_laser_attack_resident |
| `runtime.boss.resident.draw_sine_wave` | `routine` | `bosses` | `preserved` | 0 | 4l/265b | 24533-24536 | call_draw_boss_sine_wave_attack_resident |
| `runtime.boss.resident.draw_homing_missile` | `routine` | `bosses` | `preserved` | 0 | 4l/285b | 24538-24541 | call_draw_boss_homing_missile_attack_resident |
| `runtime.components.init` | `routine` | `components` | `rooted` | 11 | 84l/2913b | 24807-24890 | component_fill_32_a, init_components |
| `runtime.components.position` | `routine` | `components` | `rooted` | 3 | 120l/3613b | 24892-25011 | init_position_system, update_position_component, position_update_loop, position_next_entity |
| `runtime.components.sprite` | `routine` | `components` | `rooted` | 6 | 396l/10316b | 25012-25407 | init_sprite_system, update_sprite_component, sprite_update_loop, sprite_layer_loop, sprite_continue, ... (+6) |
| `runtime.components.movement_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 25413-25416 | update_movement_component |
| `runtime.components.collision` | `routine` | `components` | `referenced` | 2 | 668l/18861b | 25417-26084 | init_collision_system, update_collision_component, collision_update_loop, collision_next_entity, update_entity_collision_fast, ... (+13) |
| `runtime.components.behavior_tile` | `routine` | `components` | `rooted` | 13 | 110l/3809b | 26085-26194 | get_behavior_tile, get_behavior_tile_nb, gbt_oob |
| `runtime.components.directional_sprite_sync` | `routine` | `components` | `rooted` | 3 | 87l/2084b | 26195-26281 | component_sync_directional_sprite_from_initial, component_sync_directional_sprite_from_current, component_sync_directional_sprite_common |
| `runtime.components.input` | `routine` | `components` | `referenced` | 2 | 393l/13136b | 26282-26674 | init_input_system, update_input_component, input_update_loop, input_move_up, input_move_down, ... (+16) |
| `runtime.components.behavior_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 26680-26683 | update_behavior_component |
| `runtime.components.health` | `routine` | `components` | `rooted` | 3 | 152l/4701b | 26684-26835 | init_health_system, update_health_component, decrease_entity_lives, increase_entity_lives |
| `runtime.components.animation` | `routine` | `components` | `referenced` | 4 | 342l/10555b | 26836-27177 | init_animation_system, update_animation_component, anim_done_entity, refresh_player_animation_fastpath |
| `runtime.components.jump` | `routine` | `components` | `referenced` | 2 | 233l/7043b | 27178-27410 | init_jump_system, update_jump_component, jump_update_loop, jump_done_entity, jump_next_entity |
| `runtime.components.gravity` | `routine` | `components` | `rooted` | 2 | 137l/4553b | 27411-27547 | init_gravity_system, update_gravity_component, gravity_update_loop, gravity_store_vel, gravity_grounded, ... (+2) |
| `runtime.components.auto_destroy_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/219b | 28867-28873 | init_auto_destroy_system, update_auto_destroy_component |
| `runtime.components.state_machine_component_stub` | `routine` | `components` | `referenced` | 1 | 7l/241b | 28897-28903 | init_statemachine_system, update_statemachine_component |
| `runtime.components.retractable_gate_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/196b | 28909-28912 | update_retractable_gate_component |
| `runtime.components.carry_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/163b | 28918-28921 | update_carry_component |
| `runtime.components.damage_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/166b | 28929-28932 | update_damage_component |
| `runtime.components.shoot_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/163b | 28938-28941 | update_shoot_component |
| `runtime.components.platform_riding_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/220b | 28961-28967 | prepare_platform_detection, update_platform_riding |
| `runtime.components.wallcollision` | `routine` | `components` | `referenced` | 8 | 839l/31288b | 28968-29806 | init_wallcollision_system, wall_behavior_is_full_blocker, wall_down_behavior_blocks, update_wallcollision_component, wall_build_hitbox_cache, ... (+2) |
| `runtime.components.deadly_tiles` | `routine` | `components` | `rooted` | 3 | 262l/5874b | 29807-30068 | init_deadly_tiles_system, deadly_tiles_runtime_tile_is_deadly_nb, update_entity_deadly_flag_runtime, update_deadly_tiles_component, refresh_player_deadly_fastpath |
| `runtime.components.in_water_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 30074-30077 | update_in_water_component |
| `runtime.components.collectible_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/181b | 30083-30086 | update_collectible_component |
| `runtime.components.tile_interaction` | `routine` | `components` | `rooted` | 4 | 622l/15401b | 30087-30708 | interaction_target_variable_ptr_table, interaction_target_variable_word_table, init_tile_interaction_system, update_slash_component, record_bonus_respawn_slot, ... (+11) |
| `runtime.components.collected_tiles` | `routine` | `components` | `rooted` | 1 | 76l/3015b | 30709-30784 | apply_collected_tiles |
| `runtime.components.mirror_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/166b | 30790-30793 | update_mirror_component |
| `runtime.components.entity_management` | `routine` | `components` | `rooted` | 3 | 221l/6553b | 30794-31014 | create_entity, entity_job_set, entity_job_set_period_ok, entity_job_set_entry_wrap, entity_job_set_entry_ok, ... (+13) |
| `runtime.components.scheduler` | `routine` | `components` | `rooted` | 7 | 2649l/61306b | 31015-33663 | update_all_entities, mark_used_entity_list_dirty, ensure_used_entity_list_current, rebuild_used_entity_list, ensure_player_fast_runtime_bound, ... (+130) |
| `runtime.dialogue.system` | `routine` | `dialogues` | `preserved` | 37 | 584l/12271b | 32304-32887 | dialogue_update_typewriter, dialogue_typewriter_emit, dialogue_typewriter_newline, dialogue_typewriter_done, dialogue_open_box, ... (+25) |
| `runtime.components.state_machine_executor` | `routine` | `components` | `rooted` | 2 | 74l/1973b | 33669-33742 | execute_all_state_machines, refresh_player_state_machine_fastpath |
| `runtime.components.legacy_tile_collision` | `routine` | `components` | `referenced` | 3 | 43l/1404b | 33752-33794 | get_tile_at_position, get_tile_behavior, tile_behavior_table, check_collision_at_point, check_collision_box, ... (+1) |
| `runtime.components.secret_zone_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/181b | 33831-33834 | update_secret_zone_component |
| `runtime.statemachine.core` | `routine` | `stateMachine` | `rooted` | 4 | 1852l/52596b | 33842-35693 | SM_Update, sm_timer_no_overflow, sm_timer_paused, sm_update_done, SM_ShouldPauseTimerForDialogue, ... (+34) |
| `data.statemachine.statemachine_1778070349580` | `data` | `stateMachine` | `rooted` | 2 | 112l/2808b | 35771-35882 | SM_state1_state_1778070362171, SM_state1_state_1778070362171_OnEnter, SM_state1_state_1778070362171_Transitions, SM_state1_state_1778070367956, SM_state1_state_1778070367956_OnEnter, ... (+13) |
| `data.statemachine.statemachine_dialog_jump_test` | `data` | `stateMachine` | `rooted` | 1 | 24l/895b | 35883-35906 | SM_dialog_jump_to_pantalla2_state_dialog_wait, SM_dialog_jump_to_pantalla2_state_dialog_wait_Transitions, SM_dialog_jump_to_pantalla2_state_dialog_wait_Transitions_Actions_0, SM_dialog_jump_to_pantalla2_state_dialog_done |
| `runtime.gameflow.worldlink` | `routine` | `gameflow` | `rooted` | 1 | 81l/2372b | 36038-36118 | gameflow_handle_worldlink |
| `runtime.gameflow.end_screen` | `routine` | `gameflow` | `rooted` | 16 | 86l/2567b | 36120-36205 | gameflow_handle_end, print_string_vram |
| `runtime.gameflow.presentation_wait_frames` | `routine` | `gameflow` | `empty` | 0 | 3l/230b | 36243-36245 |  |
| `runtime.gameflow.connection_by_type` | `routine` | `gameflow` | `empty` | 0 | 3l/216b | 37897-37899 |  |
| `runtime.sound.init` | `routine` | `sound` | `rooted` | 1 | 22l/725b | 40111-40132 | init_sound_system |
| `runtime.sound.tick` | `routine` | `sound` | `rooted` | 1 | 17l/320b | 40139-40155 | task_audio_tick |
| `runtime.sound.psg_lowlevel` | `routine` | `sound` | `rooted` | 32 | 117l/3450b | 40160-40276 | psg_write, psg_set_tone, psg_set_volume, psg_set_noise, psg_set_mixer, ... (+1) |
| `runtime.sound.sfx_silence` | `routine` | `sound` | `referenced` | 2 | 21l/579b | 40286-40306 | sfx_silence_all |
| `runtime.sound.sfx_builtin_effects` | `routine` | `sound` | `referenced` | 6 | 127l/3025b | 40312-40438 | sfx_beep, sfx_jump, sfx_shoot, sfx_explosion, sfx_coin, ... (+1) |
| `runtime.sound.sfx_playback` | `routine` | `sound` | `referenced` | 1 | 119l/2384b | 40456-40574 | play_sound_effect, play_sound_effect_beep, play_sound_effect_jump, play_sound_effect_shoot, play_sound_effect_explosion, ... (+4) |
| `runtime.screens.colors` | `routine` | `screens` | `rooted` | 1 | 44l/1514b | 41794-41837 | color_shift_table, set_screen_colors |
| `runtime.screens.copy_rect` | `routine` | `screens` | `rooted` | 0 | 77l/1494b | 41966-42042 | copy_layout_rect_to_vram, copy_layout_rect_ram_to_ram |
| `runtime.screens.block_layout_expander` | `routine` | `screens` | `rooted` | 4 | 194l/3798b | 42044-42237 | expand_screen_block_layout_to_background, expand_screen_block_layout_2x2, expand_screen_block_layout_4x4 |
| `runtime.screens.behavior_map_rebuild` | `routine` | `screens` | `candidate_unreferenced` | 0 | 26l/709b | 42255-42280 | build_runtime_behavior_map_from_screen_layout |
| `runtime.screens.load_screen_stub` | `routine` | `screens` | `candidate_unreferenced` | 0 | 6l/232b | 42281-42286 | load_screen |
| `runtime.screens.load_screen_pantalla1_778062394614.loader` | `routine` | `screens` | `rooted` | 1 | 133l/5247b | 42288-42420 | load_screen_pantalla1_778062394614, load_screen_pantalla1_778062394614_skip_vram_copy, load_pantalla1_778062394614_boss_done |
| `runtime.screens.load_screen_pantalla2_778230236021.loader` | `routine` | `screens` | `rooted` | 1 | 133l/5248b | 42422-42554 | load_screen_pantalla2_778230236021, load_screen_pantalla2_778230236021_skip_vram_copy, load_pantalla2_778230236021_boss_done |
| `runtime.screens.load_screen_pantalla3_778230684484.loader` | `routine` | `screens` | `rooted` | 1 | 133l/5247b | 42556-42688 | load_screen_pantalla3_778230684484, load_screen_pantalla3_778230684484_skip_vram_copy, load_pantalla3_778230684484_boss_done |
| `runtime.screens.load_screen_d_pantalla1_778241953722.loader` | `routine` | `screens` | `rooted` | 1 | 133l/5306b | 42690-42822 | load_screen_d_pantalla1_778241953722, load_screen_d_pantalla1_778241953722_skip_vram_copy, load_d_pantalla1_778241953722_boss_done |
| `runtime.sprites.show_sprite_legacy` | `routine` | `sprites` | `candidate_unreferenced` | 0 | 43l/981b | 43587-43629 | show_sprite |
| `data.entities.player_1.init` | `routine` | `entities` | `rooted` | 1 | 222l/6316b | 43917-44138 | init_player_1 |
| `data.entities.fakeplayer_1.init` | `routine` | `entities` | `rooted` | 1 | 162l/4552b | 44157-44318 | init_fakeplayer_1 |
| `runtime.entities.patrol_facing` | `routine` | `entities` | `rooted` | 0 | 88l/2125b | 44495-44582 | update_entity_patrol_facing |
| `runtime.screens.presentation_wait_frames` | `routine` | `screens` | `candidate_unreferenced` | 0 | 13l/298b | 44966-44978 | presentation_wait_frames |
| `runtime.gameflow.clear_screen_area_helpers` | `routine` | `gameflow` | `referenced` | 2 | 60l/1737b | 45139-45198 | clear_screen_area, clear_screen_row, empty_row_data |
| `runtime.gameflow.confirm_input_direct` | `routine` | `gameflow` | `referenced` | 1 | 12l/298b | 45857-45868 | gameflow_read_confirm_direct |
| ... | ... | ... | ... | ... | ... | ... | +10 more blocks |

## Dead-Block Candidates

- `runtime.sprites.show_sprite_legacy`: 43 lines / 981 bytes. No external references found for any global label in this block.
- `runtime.components.input_trigger_level`: 33 lines / 773 bytes. No external references found for any global label in this block.
- `runtime.screens.behavior_map_rebuild`: 26 lines / 709 bytes. No external references found for any global label in this block.
- `runtime.worlds.current_screen_helpers`: 23 lines / 633 bytes. No external references found for any global label in this block.
- `runtime.screens.presentation_wait_frames`: 13 lines / 298 bytes. No external references found for any global label in this block.
- `runtime.screens.load_screen_stub`: 6 lines / 232 bytes. No external references found for any global label in this block.
- `runtime.components.platform_riding_stub`: 7 lines / 220 bytes. No external references found for any global label in this block.
- `runtime.components.auto_destroy_stub`: 7 lines / 219 bytes. No external references found for any global label in this block.
- `runtime.components.retractable_gate_stub`: 4 lines / 196 bytes. No external references found for any global label in this block.
- `runtime.sound.resident.sfx_update`: 4 lines / 182 bytes. No external references found for any global label in this block.
- `runtime.components.secret_zone_stub`: 4 lines / 181 bytes. No external references found for any global label in this block.
- `runtime.components.collectible_stub`: 4 lines / 181 bytes. No external references found for any global label in this block.
- `runtime.hud.empty_update_stubs`: 6 lines / 178 bytes. No external references found for any global label in this block.
- `runtime.components.movement_stub`: 4 lines / 172 bytes. No external references found for any global label in this block.
- `runtime.components.in_water_stub`: 4 lines / 172 bytes. No external references found for any global label in this block.
- `runtime.components.behavior_stub`: 4 lines / 172 bytes. No external references found for any global label in this block.
- `runtime.components.mirror_stub`: 4 lines / 166 bytes. No external references found for any global label in this block.
- `runtime.components.damage_stub`: 4 lines / 166 bytes. No external references found for any global label in this block.
- `runtime.components.shoot_stub`: 4 lines / 163 bytes. No external references found for any global label in this block.
- `runtime.components.carry_stub`: 4 lines / 163 bytes. No external references found for any global label in this block.

## ROM Validation

- Original ROM bytes: 188416
- Optimized ROM bytes: 188416
- ROM byte delta: 0
- ROM SHA256 equal: False

## dead-blocks

- Metrics: findings=20, patchable=20, removed_lines=208, removed_source_bytes=6157
- Routines: runtime.components.auto_destroy_stub, runtime.components.behavior_stub, runtime.components.carry_stub, runtime.components.collectible_stub, runtime.components.damage_stub, runtime.components.in_water_stub, runtime.components.input_trigger_level, runtime.components.mirror_stub, runtime.components.movement_stub, runtime.components.platform_riding_stub, runtime.components.retractable_gate_stub, runtime.components.secret_zone_stub, runtime.components.shoot_stub, runtime.hud.empty_update_stubs, runtime.screens.behavior_map_rebuild, runtime.screens.load_screen_stub, runtime.screens.presentation_wait_frames, runtime.sound.resident.sfx_update, runtime.sprites.show_sprite_legacy, runtime.worlds.current_screen_helpers

- [patchable] `runtime.components.input_trigger_level` lines 21764-21796: Block `runtime.components.input_trigger_level` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: component_trigger_level_pressed_a.
- [patchable] `runtime.sound.resident.sfx_update` lines 24351-24354: Block `runtime.sound.resident.sfx_update` (routine/sound) is a dead-code candidate. No external references found for any global label in this block. Labels: call_sfx_update_resident.
- [patchable] `runtime.components.movement_stub` lines 25413-25416: Block `runtime.components.movement_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_movement_component.
- [patchable] `runtime.components.behavior_stub` lines 26680-26683: Block `runtime.components.behavior_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_behavior_component.
- [patchable] `runtime.components.auto_destroy_stub` lines 28867-28873: Block `runtime.components.auto_destroy_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: init_auto_destroy_system, update_auto_destroy_component.
- [patchable] `runtime.components.retractable_gate_stub` lines 28909-28912: Block `runtime.components.retractable_gate_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_retractable_gate_component.
- [patchable] `runtime.components.carry_stub` lines 28918-28921: Block `runtime.components.carry_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_carry_component.
- [patchable] `runtime.components.damage_stub` lines 28929-28932: Block `runtime.components.damage_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_damage_component.
- [patchable] `runtime.components.shoot_stub` lines 28938-28941: Block `runtime.components.shoot_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_shoot_component.
- [patchable] `runtime.components.platform_riding_stub` lines 28961-28967: Block `runtime.components.platform_riding_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: prepare_platform_detection, update_platform_riding.
- [patchable] `runtime.components.in_water_stub` lines 30074-30077: Block `runtime.components.in_water_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_in_water_component.
- [patchable] `runtime.components.collectible_stub` lines 30083-30086: Block `runtime.components.collectible_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_collectible_component.
- [patchable] `runtime.components.mirror_stub` lines 30790-30793: Block `runtime.components.mirror_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_mirror_component.
- [patchable] `runtime.components.secret_zone_stub` lines 33831-33834: Block `runtime.components.secret_zone_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_secret_zone_component.
- [patchable] `runtime.screens.behavior_map_rebuild` lines 42255-42280: Block `runtime.screens.behavior_map_rebuild` (routine/screens) is a dead-code candidate. No external references found for any global label in this block. Labels: build_runtime_behavior_map_from_screen_layout.
- [patchable] `runtime.screens.load_screen_stub` lines 42281-42286: Block `runtime.screens.load_screen_stub` (routine/screens) is a dead-code candidate. No external references found for any global label in this block. Labels: load_screen.
- [patchable] `runtime.sprites.show_sprite_legacy` lines 43587-43629: Block `runtime.sprites.show_sprite_legacy` (routine/sprites) is a dead-code candidate. No external references found for any global label in this block. Labels: show_sprite.
- [patchable] `runtime.screens.presentation_wait_frames` lines 44966-44978: Block `runtime.screens.presentation_wait_frames` (routine/screens) is a dead-code candidate. No external references found for any global label in this block. Labels: presentation_wait_frames.
- [patchable] `runtime.worlds.current_screen_helpers` lines 46381-46403: Block `runtime.worlds.current_screen_helpers` (routine/worlds) is a dead-code candidate. No external references found for any global label in this block. Labels: get_current_world_id, get_current_screen_index, set_current_screen.
- [patchable] `runtime.hud.empty_update_stubs` lines 47909-47914: Block `runtime.hud.empty_update_stubs` (routine/hud) is a dead-code candidate. No external references found for any global label in this block. Labels: update_hud_score, update_hud_lives.

## inactive-feature-runtime

- Metrics: findings=41, patchable=18, removed_lines=144, removed_source_bytes=5771
- Routines: call_draw_boss_attack_resident, call_draw_boss_bomb_attack_resident, call_draw_boss_boomerang_attack_resident, call_draw_boss_homing_missile_attack_resident, call_draw_boss_laser_attack_resident, call_draw_boss_meteor_attack_resident, call_draw_boss_rock_attack_resident, call_draw_boss_sine_wave_attack_resident, call_init_boss_system_resident, call_init_screen_boss_from_current_screen_resident, call_update_boss_projectile_runtime_resident, call_update_boss_system_resident, init_boss_system, init_boss_system_far, init_menus, init_screen_boss_from_current_screen, init_screen_boss_from_current_screen_far, runtime.boss.group.stubs, runtime.boss.group.stubs:call_draw_boss_attack_resident, runtime.boss.group.stubs:call_draw_boss_bomb_attack_resident, runtime.boss.group.stubs:call_draw_boss_boomerang_attack_resident, runtime.boss.group.stubs:call_draw_boss_homing_missile_attack_resident, runtime.boss.group.stubs:call_draw_boss_laser_attack_resident, runtime.boss.group.stubs:call_draw_boss_meteor_attack_resident, runtime.boss.group.stubs:call_draw_boss_rock_attack_resident, runtime.boss.group.stubs:call_draw_boss_sine_wave_attack_resident, runtime.boss.group.stubs:call_init_boss_system_resident, runtime.boss.group.stubs:call_init_screen_boss_from_current_screen_resident, runtime.boss.group.stubs:call_update_boss_projectile_runtime_resident, runtime.boss.group.stubs:call_update_boss_system_resident, runtime.boss.group.stubs:init_boss_system, runtime.boss.group.stubs:init_boss_system_far, runtime.boss.group.stubs:init_screen_boss_from_current_screen, runtime.boss.group.stubs:init_screen_boss_from_current_screen_far, runtime.boss.group.stubs:update_boss_system, runtime.boss.group.stubs:update_boss_system_far, runtime.menu.group.core, show_main_menu, update_boss_system, update_boss_system_far, update_menu_state

- [patchable] `runtime.boss.group.stubs:init_boss_system_far` lines 24162-24187: `init_boss_system_far` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.boss.group.stubs` lines 24163-47843: `runtime.boss.group.stubs` groups inactive boss compatibility stubs runtime labels: call_draw_boss_attack_resident, call_draw_boss_bomb_attack_resident, call_draw_boss_boomerang_attack_resident, call_draw_boss_homing_missile_attack_resident, call_draw_boss_laser_attack_resident, call_draw_boss_meteor_attack_resident, call_draw_boss_rock_attack_resident, call_draw_boss_sine_wave_attack_resident, call_init_boss_system_resident, call_init_screen_boss_from_current_screen_resident, call_update_boss_projectile_runtime_resident, call_update_boss_system_resident, init_boss_system, init_boss_system_far, init_screen_boss_from_current_screen, init_screen_boss_from_current_screen_far, update_boss_system, update_boss_system_far. No external references outside the group were found. This is ready for a future atomic multi-window patch, or for dead-blocks to remove the annotated windows as whole groups. Atomic patch enabled as `runtime.boss.group.stubs` with 18 window(s).
- [report-only] `init_boss_system_far` lines 24163-24189: `init_boss_system_far` looks like bosses runtime (27 lines, 724 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: boot_or_init (Boot/init routine). External references still exist (1): call_init_boss_system_resident@24485. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.far_trampoline.init_boss_system_far` owner=`far-call` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:init_screen_boss_from_current_screen_far` lines 24189-24214: `init_screen_boss_from_current_screen_far` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `init_screen_boss_from_current_screen_far` lines 24190-24216: `init_screen_boss_from_current_screen_far` looks like bosses runtime (27 lines, 826 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: boot_or_init (Boot/init routine). External references still exist (1): call_init_screen_boss_from_current_screen_resident@24490. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.far_trampoline.init_screen_boss_from_current_screen_far` owner=`far-call` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:update_boss_system_far` lines 24216-24241: `update_boss_system_far` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `update_boss_system_far` lines 24217-24248: `update_boss_system_far` looks like bosses runtime (32 lines, 754 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_update_boss_system_resident@24495. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.far_trampoline.update_boss_system_far` owner=`far-call` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_init_boss_system_resident` lines 24483-24486: `call_init_boss_system_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_init_boss_system_resident` lines 24484-24488: `call_init_boss_system_resident` looks like bosses runtime (5 lines, 260 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.init` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_init_screen_boss_from_current_screen_resident` lines 24488-24491: `call_init_screen_boss_from_current_screen_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_init_screen_boss_from_current_screen_resident` lines 24489-24493: `call_init_screen_boss_from_current_screen_resident` looks like bosses runtime (5 lines, 284 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.init_screen` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_update_boss_system_resident` lines 24493-24496: `call_update_boss_system_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_update_boss_system_resident` lines 24494-24498: `call_update_boss_system_resident` looks like bosses runtime (5 lines, 266 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.update` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_update_boss_projectile_runtime_resident` lines 24498-24501: `call_update_boss_projectile_runtime_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_update_boss_projectile_runtime_resident` lines 24499-24503: `call_update_boss_projectile_runtime_resident` looks like bosses runtime (5 lines, 260 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.update_projectile` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_attack_resident` lines 24503-24506: `call_draw_boss_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_attack_resident` lines 24504-24508: `call_draw_boss_attack_resident` looks like bosses runtime (5 lines, 247 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_attack` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_meteor_attack_resident` lines 24508-24511: `call_draw_boss_meteor_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_meteor_attack_resident` lines 24509-24513: `call_draw_boss_meteor_attack_resident` looks like bosses runtime (5 lines, 250 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_meteor` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_bomb_attack_resident` lines 24513-24516: `call_draw_boss_bomb_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_bomb_attack_resident` lines 24514-24518: `call_draw_boss_bomb_attack_resident` looks like bosses runtime (5 lines, 256 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_bomb` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_boomerang_attack_resident` lines 24518-24521: `call_draw_boss_boomerang_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_boomerang_attack_resident` lines 24519-24523: `call_draw_boss_boomerang_attack_resident` looks like bosses runtime (5 lines, 256 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_boomerang` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_rock_attack_resident` lines 24523-24526: `call_draw_boss_rock_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_rock_attack_resident` lines 24524-24528: `call_draw_boss_rock_attack_resident` looks like bosses runtime (5 lines, 248 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_rock` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_laser_attack_resident` lines 24528-24531: `call_draw_boss_laser_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_laser_attack_resident` lines 24529-24533: `call_draw_boss_laser_attack_resident` looks like bosses runtime (5 lines, 258 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_laser` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_sine_wave_attack_resident` lines 24533-24536: `call_draw_boss_sine_wave_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_sine_wave_attack_resident` lines 24534-24538: `call_draw_boss_sine_wave_attack_resident` looks like bosses runtime (5 lines, 276 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_sine_wave` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_homing_missile_attack_resident` lines 24538-24541: `call_draw_boss_homing_missile_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_homing_missile_attack_resident` lines 24539-24542: `call_draw_boss_homing_missile_attack_resident` looks like bosses runtime (4 lines, 133 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_homing_missile` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:init_boss_system` lines 47820-47833: `init_boss_system` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `init_boss_system` lines 47820-47834: `init_boss_system` looks like bosses runtime (15 lines, 330 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: boot_or_init (Boot/init routine). External references still exist (1): init_boss_system_far@24172. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.boss.entry` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:update_boss_system` lines 47835-47836: `update_boss_system` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `update_boss_system` lines 47835-47837: `update_boss_system` looks like bosses runtime (3 lines, 29 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): update_boss_system_far@24226. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.boss.entry` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:init_screen_boss_from_current_screen` lines 47838-47839: `init_screen_boss_from_current_screen` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `init_screen_boss_from_current_screen` lines 47838-47843: `init_screen_boss_from_current_screen` looks like bosses runtime (6 lines, 140 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: boot_or_init (Boot/init routine). External references still exist (1): init_screen_boss_from_current_screen_far@24199. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.boss.entry` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `runtime.menu.group.core` lines 47870-47885: `runtime.menu.group.core` groups inactive menu core runtime labels: init_menus, show_main_menu, update_menu_state. No external references outside the group were found. This is ready for a future atomic multi-window patch, or for dead-blocks to remove the annotated windows as whole groups. Patch policy: runtime group `runtime.menu.group.core` is report-only until it is added to the validated patchable set.
- [report-only] `init_menus` lines 47870-47872: `init_menus` looks like menus runtime (3 lines, 21 source bytes), but project_usage marks feature `menus` disabled (menus=0). Category: boot_or_init (Boot/init routine). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.menus.compat_stubs` owner=`menus` preserve=true. Patch policy: feature family `menus` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `show_main_menu` lines 47873-47875: `show_main_menu` looks like menus runtime (3 lines, 25 source bytes), but project_usage marks feature `menus` disabled (menus=0). Category: runtime_code (Instruction-bearing runtime label). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.menus.compat_stubs` owner=`menus` preserve=true. Patch policy: feature family `menus` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `update_menu_state` lines 47876-47885: `update_menu_state` looks like menus runtime (10 lines, 301 source bytes), but project_usage marks feature `menus` disabled (menus=0). Category: runtime_code (Instruction-bearing runtime label). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.menus.compat_stubs` owner=`menus` preserve=true. Patch policy: feature family `menus` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.

## unused-component-runtime

- Metrics: findings=25, patchable=16, removed_lines=53, removed_source_bytes=1817
- Routines: runtime.components.system.auto_destroy, runtime.components.system.auto_destroy:init_auto_destroy_system, runtime.components.system.behavior, runtime.components.system.behavior:update_behavior_component, runtime.components.system.carry, runtime.components.system.carry:init_carry_system, runtime.components.system.carry:update_carry_component, runtime.components.system.collectible, runtime.components.system.collectible:init_collectible_system, runtime.components.system.collectible:update_collectible_component, runtime.components.system.damage, runtime.components.system.damage:init_damage_system, runtime.components.system.damage:update_damage_component, runtime.components.system.in_water, runtime.components.system.in_water:init_in_water_system, runtime.components.system.in_water:update_in_water_component, runtime.components.system.movement, runtime.components.system.movement:init_movement_system, runtime.components.system.movement:update_movement_component, runtime.components.system.retractable_gate, runtime.components.system.retractable_gate:init_retractable_gate_system, runtime.components.system.retractable_gate:update_retractable_gate_component, runtime.components.system.shoot, runtime.components.system.shoot:init_shoot_system, runtime.components.system.shoot:update_shoot_component

- [report-only] `runtime.components.system.movement` lines 25410-25422: `runtime.components.system.movement` covers unused movement component labels: init_movement_system, update_movement_component. `project_usage.componentRuntime.usedComponents` is Animation, AutoControlScript, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, WallGrab, WallJump, so component type `Movement` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.movement` with 2 window(s).
- [patchable] `runtime.components.system.movement:init_movement_system` lines 25410-25411: `init_movement_system` is part of unused component runtime group `runtime.components.system.movement`. The group has no external references, so this window is removed only together with the other group windows.
- [patchable] `runtime.components.system.movement:update_movement_component` lines 25413-25416: `update_movement_component` is part of unused component runtime group `runtime.components.system.movement`. The group has no external references, so this window is removed only together with the other group windows.
- [patchable] `runtime.components.system.behavior:update_behavior_component` lines 26680-26683: `update_behavior_component` is part of unused component runtime group `runtime.components.system.behavior`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.components.system.behavior` lines 26681-26693: `runtime.components.system.behavior` covers unused behavior component labels: update_behavior_component. `project_usage.componentRuntime.usedComponents` is Animation, AutoControlScript, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, WallGrab, WallJump, so component type `Behavior` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.behavior` with 1 window(s).
- [patchable] `runtime.components.system.auto_destroy:init_auto_destroy_system` lines 28867-28873: `init_auto_destroy_system` is part of unused component runtime group `runtime.components.system.auto_destroy`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.components.system.auto_destroy` lines 28868-28882: `runtime.components.system.auto_destroy` covers unused auto-destroy component labels: init_auto_destroy_system, update_auto_destroy_component. `project_usage.componentRuntime.usedComponents` is Animation, AutoControlScript, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, WallGrab, WallJump, so component type `AutoDestroy` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.auto_destroy` with 1 window(s).
- [report-only] `runtime.components.system.retractable_gate` lines 28906-28914: `runtime.components.system.retractable_gate` covers unused retractable-gate component labels: init_retractable_gate_system, update_retractable_gate_component. `project_usage.componentRuntime.usedComponents` is Animation, AutoControlScript, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, WallGrab, WallJump, so component type `RetractableGate` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.retractable_gate` with 2 window(s).
- [patchable] `runtime.components.system.retractable_gate:init_retractable_gate_system` lines 28906-28907: `init_retractable_gate_system` is part of unused component runtime group `runtime.components.system.retractable_gate`. The group has no external references, so this window is removed only together with the other group windows.
- [patchable] `runtime.components.system.retractable_gate:update_retractable_gate_component` lines 28909-28912: `update_retractable_gate_component` is part of unused component runtime group `runtime.components.system.retractable_gate`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.components.system.carry` lines 28915-28925: `runtime.components.system.carry` covers unused carry component labels: init_carry_system, update_carry_component. `project_usage.componentRuntime.usedComponents` is Animation, AutoControlScript, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, WallGrab, WallJump, so component type `Carry` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.carry` with 2 window(s).
- [patchable] `runtime.components.system.carry:init_carry_system` lines 28915-28916: `init_carry_system` is part of unused component runtime group `runtime.components.system.carry`. The group has no external references, so this window is removed only together with the other group windows.
- [patchable] `runtime.components.system.carry:update_carry_component` lines 28918-28921: `update_carry_component` is part of unused component runtime group `runtime.components.system.carry`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.components.system.damage` lines 28926-28934: `runtime.components.system.damage` covers unused damage component labels: init_damage_system, update_damage_component. `project_usage.componentRuntime.usedComponents` is Animation, AutoControlScript, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, WallGrab, WallJump, so component type `Damage` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.damage` with 2 window(s).
- [patchable] `runtime.components.system.damage:init_damage_system` lines 28926-28927: `init_damage_system` is part of unused component runtime group `runtime.components.system.damage`. The group has no external references, so this window is removed only together with the other group windows.
- [patchable] `runtime.components.system.damage:update_damage_component` lines 28929-28932: `update_damage_component` is part of unused component runtime group `runtime.components.system.damage`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.components.system.shoot` lines 28935-28946: `runtime.components.system.shoot` covers unused shoot component labels: init_shoot_system, update_shoot_component. `project_usage.componentRuntime.usedComponents` is Animation, AutoControlScript, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, WallGrab, WallJump, so component type `Shoot` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.shoot` with 2 window(s).
- [patchable] `runtime.components.system.shoot:init_shoot_system` lines 28935-28936: `init_shoot_system` is part of unused component runtime group `runtime.components.system.shoot`. The group has no external references, so this window is removed only together with the other group windows.
- [patchable] `runtime.components.system.shoot:update_shoot_component` lines 28938-28941: `update_shoot_component` is part of unused component runtime group `runtime.components.system.shoot`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.components.system.in_water` lines 30071-30079: `runtime.components.system.in_water` covers unused in-water component labels: init_in_water_system, update_in_water_component. `project_usage.componentRuntime.usedComponents` is Animation, AutoControlScript, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, WallGrab, WallJump, so component type `InWater` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.in_water` with 2 window(s).
- [patchable] `runtime.components.system.in_water:init_in_water_system` lines 30071-30072: `init_in_water_system` is part of unused component runtime group `runtime.components.system.in_water`. The group has no external references, so this window is removed only together with the other group windows.
- [patchable] `runtime.components.system.in_water:update_in_water_component` lines 30074-30077: `update_in_water_component` is part of unused component runtime group `runtime.components.system.in_water`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.components.system.collectible` lines 30080-30099: `runtime.components.system.collectible` covers unused collectible component labels: init_collectible_system, update_collectible_component. `project_usage.componentRuntime.usedComponents` is Animation, AutoControlScript, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, WallGrab, WallJump, so component type `Collectible` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.collectible` with 2 window(s).
- [patchable] `runtime.components.system.collectible:init_collectible_system` lines 30080-30081: `init_collectible_system` is part of unused component runtime group `runtime.components.system.collectible`. The group has no external references, so this window is removed only together with the other group windows.
- [patchable] `runtime.components.system.collectible:update_collectible_component` lines 30083-30086: `update_collectible_component` is part of unused component runtime group `runtime.components.system.collectible`. The group has no external references, so this window is removed only together with the other group windows.

## state-machine-dispatch-handlers

- Metrics: findings=66, patchable=57, removed_lines=205, removed_source_bytes=5103
- Routines: Action_ChangeSprite, Action_ExitCurrentWorld, Action_Nop, Action_Nop:table:0, Action_Nop:table:1, Action_Nop:table:10, Action_Nop:table:11, Action_Nop:table:12, Action_Nop:table:13, Action_Nop:table:14, Action_Nop:table:15, Action_Nop:table:16, Action_Nop:table:17, Action_Nop:table:18, Action_Nop:table:19, Action_Nop:table:2, Action_Nop:table:20, Action_Nop:table:21, Action_Nop:table:22, Action_Nop:table:23, Action_Nop:table:24, Action_Nop:table:25, Action_Nop:table:26, Action_Nop:table:27, Action_Nop:table:28, Action_Nop:table:29, Action_Nop:table:3, Action_Nop:table:30, Action_Nop:table:31, Action_Nop:table:32, Action_Nop:table:33, Action_Nop:table:34, Action_Nop:table:35, Action_Nop:table:36, Action_Nop:table:37, Action_Nop:table:38, Action_Nop:table:39, Action_Nop:table:4, Action_Nop:table:41, Action_Nop:table:42, Action_Nop:table:43, Action_Nop:table:6, Action_Nop:table:9, Action_SetAnimSpeed, Action_ToggleAnim, Condition_And, Condition_AnimComplete, Condition_AnimComplete:table:12, Condition_KeyAndMove, Condition_Nop, Condition_Nop:table:0, Condition_Nop:table:10, Condition_Nop:table:11, Condition_Nop:table:15, Condition_Nop:table:16, Condition_Nop:table:17, Condition_Nop:table:4, Condition_Nop:table:5, Condition_Nop:table:7, Condition_Nop:table:8, Condition_Nop:table:9, Condition_Not, Condition_Or, Condition_TimeOut, Condition_VariableCompare, Condition_VariableCompare:table:14

- [patchable] `Action_Nop:table:0` lines 34286-34286: `Action_Nop` dispatch id 0 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:1` lines 34287-34287: `Action_Nop` dispatch id 1 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:2` lines 34288-34288: `Action_Nop` dispatch id 2 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:3` lines 34289-34289: `Action_Nop` dispatch id 3 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:4` lines 34290-34290: `Action_Nop` dispatch id 4 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:6` lines 34292-34292: `Action_Nop` dispatch id 6 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:9` lines 34295-34295: `Action_Nop` dispatch id 9 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:10` lines 34296-34296: `Action_Nop` dispatch id 10 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:11` lines 34297-34297: `Action_Nop` dispatch id 11 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:12` lines 34298-34298: `Action_Nop` dispatch id 12 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:13` lines 34299-34299: `Action_Nop` dispatch id 13 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:14` lines 34300-34300: `Action_Nop` dispatch id 14 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:15` lines 34301-34301: `Action_Nop` dispatch id 15 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:16` lines 34302-34302: `Action_Nop` dispatch id 16 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:17` lines 34303-34303: `Action_Nop` dispatch id 17 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:18` lines 34304-34304: `Action_Nop` dispatch id 18 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:19` lines 34305-34305: `Action_Nop` dispatch id 19 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:20` lines 34306-34306: `Action_Nop` dispatch id 20 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:21` lines 34307-34307: `Action_Nop` dispatch id 21 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:22` lines 34308-34308: `Action_Nop` dispatch id 22 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:23` lines 34309-34309: `Action_Nop` dispatch id 23 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:24` lines 34310-34310: `Action_Nop` dispatch id 24 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:25` lines 34311-34311: `Action_Nop` dispatch id 25 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:26` lines 34312-34312: `Action_Nop` dispatch id 26 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:27` lines 34313-34313: `Action_Nop` dispatch id 27 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:28` lines 34314-34314: `Action_Nop` dispatch id 28 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:29` lines 34315-34315: `Action_Nop` dispatch id 29 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:30` lines 34316-34316: `Action_Nop` dispatch id 30 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:31` lines 34317-34317: `Action_Nop` dispatch id 31 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:32` lines 34318-34318: `Action_Nop` dispatch id 32 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:33` lines 34319-34319: `Action_Nop` dispatch id 33 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:34` lines 34320-34320: `Action_Nop` dispatch id 34 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:35` lines 34321-34321: `Action_Nop` dispatch id 35 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:36` lines 34322-34322: `Action_Nop` dispatch id 36 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:37` lines 34323-34323: `Action_Nop` dispatch id 37 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:38` lines 34324-34324: `Action_Nop` dispatch id 38 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:39` lines 34325-34325: `Action_Nop` dispatch id 39 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:41` lines 34327-34327: `Action_Nop` dispatch id 41 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:42` lines 34328-34328: `Action_Nop` dispatch id 42 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:43` lines 34329-34329: `Action_Nop` dispatch id 43 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop` lines 34335-34345: `Action_Nop` is a state-machine action handler referenced by `SM_ActionTable` (40 table reference(s): SM_ActionTable@34286: `DW Action_Nop; 0`, SM_ActionTable@34287: `DW Action_Nop ; 1 [Action_SetPosition stripped]`, SM_ActionTable@34288: `DW Action_Nop ; 2 [Action_MoveBy stripped]`). Direct external references: none. Dispatch id 0 is not listed in `project_usage.stateMachineRuntime.usedActionIds`; this is only an unused-by-metadata signal. Patch enabled: all dispatch table ids for this handler are unused by project_usage metadata and there are no direct external references.
- [report-only] `Action_ChangeSprite` lines 34411-34740: `Action_ChangeSprite` is a state-machine action handler referenced by `SM_ActionTable` (1 table reference(s): SM_ActionTable@34291: `DW Action_ChangeSprite; 5`). Direct external references: none. Dispatch id 5 is listed in `project_usage.stateMachineRuntime.usedActionIds`. Patch disabled because one or more table dispatch ids are used or unknown.
- [report-only] `Action_SetAnimSpeed` lines 34741-34774: `Action_SetAnimSpeed` is a state-machine action handler referenced by `SM_ActionTable` (1 table reference(s): SM_ActionTable@34293: `DW Action_SetAnimSpeed; 7`). Direct external references: none. Dispatch id 7 is listed in `project_usage.stateMachineRuntime.usedActionIds`. Patch disabled because one or more table dispatch ids are used or unknown.
- [report-only] `Action_ToggleAnim` lines 34775-34874: `Action_ToggleAnim` is a state-machine action handler referenced by `SM_ActionTable` (1 table reference(s): SM_ActionTable@34294: `DW Action_ToggleAnim; 8`). Direct external references: none. Dispatch id 8 is listed in `project_usage.stateMachineRuntime.usedActionIds`. Patch disabled because one or more table dispatch ids are used or unknown.
- [report-only] `Action_ExitCurrentWorld` lines 35025-35034: `Action_ExitCurrentWorld` is a state-machine action handler referenced by `SM_ActionTable` (1 table reference(s): SM_ActionTable@34326: `DW Action_ExitCurrentWorld; 40`). Direct external references: none. Dispatch id 40 is listed in `project_usage.stateMachineRuntime.usedActionIds`. Patch disabled because one or more table dispatch ids are used or unknown.
- [patchable] `Condition_Nop:table:0` lines 35036-35036: `Condition_Nop` dispatch id 0 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_Nop:table:4` lines 35040-35040: `Condition_Nop` dispatch id 4 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_Nop:table:5` lines 35041-35041: `Condition_Nop` dispatch id 5 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_Nop:table:7` lines 35043-35043: `Condition_Nop` dispatch id 7 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_Nop:table:8` lines 35044-35044: `Condition_Nop` dispatch id 8 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_Nop:table:9` lines 35045-35045: `Condition_Nop` dispatch id 9 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_Nop:table:10` lines 35046-35046: `Condition_Nop` dispatch id 10 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_Nop:table:11` lines 35047-35047: `Condition_Nop` dispatch id 11 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_AnimComplete:table:12` lines 35048-35048: `Condition_AnimComplete` dispatch id 12 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_VariableCompare:table:14` lines 35050-35050: `Condition_VariableCompare` dispatch id 14 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_Nop:table:15` lines 35051-35051: `Condition_Nop` dispatch id 15 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_Nop:table:16` lines 35052-35052: `Condition_Nop` dispatch id 16 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_Nop:table:17` lines 35053-35053: `Condition_Nop` dispatch id 17 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_Nop` lines 35059-35062: `Condition_Nop` is a state-machine condition handler referenced by `SM_ConditionTable` (11 table reference(s): SM_ConditionTable@35036: `DW Condition_Nop            ; 0`, SM_ConditionTable@35040: `DW Condition_Nop ; 4 [Condition_KeyPressed stripped]`, SM_ConditionTable@35041: `DW Condition_Nop ; 5 [Condition_KeyReleased stripped]`). Direct external references: none. Dispatch id 0 is not listed in `project_usage.stateMachineRuntime.usedConditionIds`; this is only an unused-by-metadata signal. Patch enabled: all dispatch table ids for this handler are unused by project_usage metadata and there are no direct external references.
- [report-only] `Condition_And` lines 35063-35095: `Condition_And` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@35037: `DW Condition_And            ; 1`). Direct external references: none. Dispatch id 1 is listed in `project_usage.stateMachineRuntime.usedConditionIds`. Patch disabled because one or more table dispatch ids are used or unknown.
- [report-only] `Condition_Or` lines 35096-35130: `Condition_Or` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@35038: `DW Condition_Or             ; 2`). Direct external references: none. Dispatch id 2 is listed in `project_usage.stateMachineRuntime.usedConditionIds`. Patch disabled because one or more table dispatch ids are used or unknown.
- [report-only] `Condition_Not` lines 35131-35157: `Condition_Not` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@35039: `DW Condition_Not            ; 3`). Direct external references: none. Dispatch id 3 is listed in `project_usage.stateMachineRuntime.usedConditionIds`. Patch disabled because one or more table dispatch ids are used or unknown.
- [report-only] `Condition_TimeOut` lines 35384-35445: `Condition_TimeOut` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@35042: `DW Condition_TimeOut        ; 6`). Direct external references: none. Dispatch id 6 is listed in `project_usage.stateMachineRuntime.usedConditionIds`. Patch disabled because one or more table dispatch ids are used or unknown.
- [patchable] `Condition_AnimComplete` lines 35446-35466: `Condition_AnimComplete` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@35048: `DW Condition_AnimComplete   ; 12`). Direct external references: none. Dispatch id 12 is not listed in `project_usage.stateMachineRuntime.usedConditionIds`; this is only an unused-by-metadata signal. Patch enabled: all dispatch table ids for this handler are unused by project_usage metadata and there are no direct external references.
- [report-only] `Condition_KeyAndMove` lines 35467-35512: `Condition_KeyAndMove` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@35049: `DW Condition_KeyAndMove     ; 13`). Direct external references: none. Dispatch id 13 is listed in `project_usage.stateMachineRuntime.usedConditionIds`. Patch disabled because one or more table dispatch ids are used or unknown.
- [patchable] `Condition_VariableCompare` lines 35513-35698: `Condition_VariableCompare` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@35050: `DW Condition_VariableCompare; 14`). Direct external references: none. Dispatch id 14 is not listed in `project_usage.stateMachineRuntime.usedConditionIds`; this is only an unused-by-metadata signal. Patch enabled: all dispatch table ids for this handler are unused by project_usage metadata and there are no direct external references.

## Optimization Passes

- Pass 1: findings=152, patchable=102, removed=571 lines / 17244 bytes, lines=47921->47350

