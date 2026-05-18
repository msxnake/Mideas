# Post-ASM Report

- Input: `C:\Users\salam\Documents\Programacion\Mideas\server\temp\patoantic249_backend_route_matrix_1778594251490_773119.post_asm_input.asm`
- Findings: 89
- Applied patches: 47
- Original lines: 57135
- Output lines: 56576
- Net line delta: -559

- Optimization passes run: 2
- Optimization source removed: 559 lines / 18987 bytes

## Mideas Block Inventory

- Blocks: 122
- Preserved blocks: 23
- Removable-by-policy blocks: 99
- Dead-block candidates: 19
- Annotated block source: 19229 lines / 542872 bytes
- Dead-candidate source: 258 lines / 7712 bytes
- Marker errors: 2

- By kind: data=3, routine=109, trampoline=10
- By owner: animtiles=1, bosses=13, components=34, entities=7, far-call=10, font=1, gameflow=10, hud=1, interrupt=5, mapper=1, menus=1, resources=1, screens=14, scroll=1, sound=13, sprites=1, stateMachine=4, unified=1, worlds=3
- By status: candidate_unreferenced=19, empty=1, preserved=23, referenced=20, rooted=59

### Largest Annotated Blocks

| ID | Status | Source | Kind | Owner |
| --- | --- | --- | --- | --- |
| `runtime.statemachine.core` | `rooted` | 2355l/62007b | `routine` | `stateMachine` |
| `runtime.components.scheduler` | `rooted` | 1340l/31712b | `routine` | `components` |
| `runtime.components.wallcollision` | `referenced` | 839l/31288b | `routine` | `components` |
| `runtime.gameflow.submenu` | `rooted` | 1006l/24325b | `routine` | `gameflow` |
| `runtime.gameflow.world_loop` | `rooted` | 763l/22615b | `routine` | `gameflow` |
| `runtime.components.tile_interaction` | `rooted` | 966l/21802b | `routine` | `components` |
| `data.statemachine.statemachine_1771533517310` | `rooted` | 622l/20339b | `data` | `stateMachine` |
| `runtime.animtiles.core` | `rooted` | 547l/20251b | `routine` | `animtiles` |
| `runtime.components.collision` | `referenced` | 668l/18861b | `routine` | `components` |
| `runtime.resources.manager` | `rooted` | 697l/18133b | `routine` | `resources` |
| `runtime.hud.core` | `rooted` | 661l/15508b | `routine` | `hud` |
| `runtime.components.input` | `referenced` | 393l/13136b | `routine` | `components` |
| `runtime.components.animation` | `referenced` | 342l/10555b | `routine` | `components` |
| `runtime.components.sprite` | `rooted` | 396l/10316b | `routine` | `components` |
| `runtime.scroll.core` | `rooted` | 344l/8639b | `routine` | `scroll` |
| `runtime.interrupt.task_input` | `rooted` | 275l/7220b | `routine` | `interrupt` |
| `runtime.components.jump` | `referenced` | 233l/7043b | `routine` | `components` |
| `runtime.font.loading` | `rooted` | 227l/6845b | `routine` | `font` |
| `runtime.components.secret_zones` | `rooted` | 258l/6746b | `routine` | `components` |
| `runtime.components.entity_management` | `rooted` | 221l/6549b | `routine` | `components` |

- Marker error: Line 44320: @mideas:endblock without open block.
- Marker error: Line 56373: @mideas:block id=runtime.gameflow.world_loop has no closing @mideas:endblock.

## Inactive Feature Runtime Inventory

| Feature | Findings | Patchable | Annotated | Unannotated | Preserved | Owners |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `bosses` | 18 | 0 | 18 | 0 | 15 | bosses=15, far-call=3 |

## Global Label Inventory

- Global labels: 1132

| Label | Category | Source |
| --- | --- | --- |
| `FAST_SNSMAT` | `bios_helper` | 1114l/67794b |
| `update_wallcollision_component` | `runtime_code` | 538l/20410b |
| `FAR_BANK_14_ROM_START` | `bank_marker` | 310l/15187b |
| `Action_ChangeSprite` | `runtime_code` | 321l/14617b |
| `update_player_fastpath` | `runtime_code` | 604l/13839b |
| `resource_table` | `data` | 823l/12168b |
| `execute_transition_effect` | `runtime_code` | 398l/11680b |
| `update_entity_collision_fast` | `runtime_code` | 345l/9814b |
| `load_sprite_patterns_worldmap_1770754170935` | `data` | 222l/9051b |
| `scan_tile_interaction_entities` | `runtime_code` | 318l/8428b |
| `update_animation_component` | `runtime_code` | 255l/8328b |
| `BANK_2_USED_END` | `bank_marker` | 163l/8223b |
| `mapper_call_hl_auto` | `shared_runtime` | 180l/7912b |
| `BANK_0_USED_END` | `bank_marker` | 141l/7650b |
| `load_sprite_patterns_worldmap_1774194757416` | `data` | 170l/6931b |
| `PRESENTATION_SCREEN_COLORS_B1` | `data` | 100l/6866b |
| `vdpLoop` | `bios_helper` | 192l/6712b |
| `pt3_track_0_data` | `data` | 101l/6709b |
| `PRESENTATION_SCREEN_PATTERNS_B1` | `data` | 97l/6681b |
| `screen_runtime_summary_table` | `data` | 138l/6188b |
| `task_update_input` | `shared_runtime` | 243l/6128b |
| `update_slash_component` | `runtime_code` | 301l/6121b |
| `init_hero_2` | `boot_or_init` | 217l/6118b |
| `init_hero_1` | `boot_or_init` | 217l/6113b |
| `anim_group_2_new_tile` | `data` | 71l/5671b |
| `init_pato_1` | `boot_or_init` | 192l/4969b |
| `init_bola2` | `boot_or_init` | 192l/4969b |
| `init_pato3` | `boot_or_init` | 192l/4958b |
| `execute_transition_reveal_target` | `runtime_code` | 265l/4788b |
| `render_hud` | `runtime_code` | 174l/4762b |

### Largest Unannotated Global Labels

- Unannotated labels: 578

| Category | Labels | Source |
| --- | ---: | ---: |
| `bank_marker` | 21 | 1106l/50316b |
| `bios_helper` | 9 | 1739l/86586b |
| `boot_or_init` | 30 | 920l/24220b |
| `data` | 263 | 4460l/157829b |
| `far_trampoline` | 79 | 1469l/32943b |
| `runtime_code` | 136 | 3843l/105279b |
| `runtime_inner_label` | 30 | 586l/16681b |
| `screen_loader` | 8 | 200l/4797b |
| `shared_runtime` | 2 | 31l/1113b |

| Label | Category | Source |
| --- | --- | --- |
| `FAST_SNSMAT` | `bios_helper` | 1114l/67794b |
| `FAR_BANK_14_ROM_START` | `bank_marker` | 310l/15187b |
| `resource_table` | `data` | 823l/12168b |
| `execute_transition_effect` | `runtime_code` | 398l/11680b |
| `load_sprite_patterns_worldmap_1770754170935` | `data` | 222l/9051b |
| `BANK_2_USED_END` | `bank_marker` | 163l/8223b |
| `BANK_0_USED_END` | `bank_marker` | 141l/7650b |
| `load_sprite_patterns_worldmap_1774194757416` | `data` | 170l/6931b |
| `PRESENTATION_SCREEN_COLORS_B1` | `data` | 100l/6866b |
| `vdpLoop` | `bios_helper` | 192l/6712b |
| `pt3_track_0_data` | `data` | 101l/6709b |
| `PRESENTATION_SCREEN_PATTERNS_B1` | `data` | 97l/6681b |
| `screen_runtime_summary_table` | `data` | 138l/6188b |
| `execute_transition_reveal_target` | `runtime_code` | 265l/4788b |
| `FAR_BANK_11_ROM_START` | `bank_marker` | 98l/3568b |
| `gameflow_world_game_loop` | `runtime_code` | 105l/3548b |
| `PRESENTATION_SCREEN_NAMETBL` | `data` | 52l/3486b |
| `init_char0_color` | `boot_or_init` | 127l/3471b |
| `FAR_BANK_13_ROM_START` | `bank_marker` | 79l/3182b |
| `init_entities` | `boot_or_init` | 141l/3181b |
| `PRESENTATION_SCREEN_PATTERNS_B0` | `data` | 47l/3099b |
| `PRESENTATION_SCREEN_COLORS_B0` | `data` | 47l/3095b |
| `gameflow_handle_transition` | `runtime_code` | 66l/3068b |
| `FONT_PATTERN_DATA` | `data` | 94l/3035b |
| `tilebank_pattern_data_0` | `data` | 41l/2764b |
| `tile_pattern_bank0` | `data` | 41l/2759b |
| `FAST_LDIRVM` | `bios_helper` | 80l/2624b |
| `restart_rom_continue` | `boot_or_init` | 83l/2480b |
| `FAR_BANK_10_ROM_START` | `bank_marker` | 68l/2255b |
| `PRESENTATION_SCREEN_PATTERNS_B2` | `data` | 35l/2247b |

| ID | Kind | Owner | Status | Incoming | Source | Lines | Labels |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `runtime.mapper.core` | `routine` | `mapper` | `rooted` | 199 | 213l/5412b | 25501-25713 | mapper_runtime_init, mapper_set_bank_p1, mapper_set_bank_p2, mapper_set_bank_p3, mapper_set_bank_p4, ... (+14) |
| `runtime.resources.manager` | `routine` | `resources` | `rooted` | 191 | 697l/18133b | 26745-27441 | resource_manager_init, resource_invalidate_pattern_vram_cache, resource_invalidate_color_vram_cache, resource_invalidate_font_vram_cache, resource_invalidate_gameplay_vram_cache, ... (+14) |
| `runtime.components.input_trigger_level` | `routine` | `components` | `candidate_unreferenced` | 0 | 33l/773b | 27523-27555 | component_trigger_level_pressed_a |
| `runtime.page0.stubs` | `routine` | `unified` | `rooted` | 1 | 22l/505b | 27562-27583 | init_page0_runtime_state, page0_map_expanded_slot, page0_map_game_rom, page0_restore_bios_rom, page0_copy_chunk_to_buffer, ... (+2) |
| `runtime.interrupt.stop` | `routine` | `interrupt` | `rooted` | 0 | 43l/1299b | 27664-27706 | stop_interrupt_system |
| `runtime.interrupt.dispatcher` | `routine` | `interrupt` | `preserved` | 1 | 124l/4150b | 27708-27831 | interrupt_dispatcher |
| `runtime.interrupt.vblank_flag` | `routine` | `interrupt` | `rooted` | 1 | 35l/983b | 27844-27878 | update_vblank_flag |
| `runtime.interrupt.task_api` | `routine` | `interrupt` | `rooted` | 2 | 121l/3195b | 27883-28003 | enable_task, disable_task, get_frame_count |
| `runtime.interrupt.task_input` | `routine` | `interrupt` | `rooted` | 2 | 275l/7220b | 28007-28281 | init_default_tasks_from_plan, task_update_input |
| `runtime.far_trampoline.init_sound_system_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/710b | 29236-29261 | init_sound_system_far |
| `runtime.far_trampoline.task_audio_tick_far` | `trampoline` | `far-call` | `preserved` | 0 | 26l/696b | 29263-29288 | task_audio_tick_far |
| `runtime.far_trampoline.sfx_update_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/661b | 29290-29315 | sfx_update_far |
| `runtime.far_trampoline.music_update_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/675b | 29317-29342 | music_update_far |
| `runtime.far_trampoline.music_stop_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/661b | 29344-29369 | music_stop_far |
| `runtime.far_trampoline.music_play_track_far` | `trampoline` | `far-call` | `preserved` | 1 | 28l/740b | 29371-29398 | music_play_track_far |
| `runtime.far_trampoline.music_execute_command_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/738b | 29400-29425 | music_execute_command_far |
| `runtime.far_trampoline.init_boss_system_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/703b | 30279-30304 | init_boss_system_far |
| `runtime.far_trampoline.init_screen_boss_from_current_screen_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/843b | 30306-30331 | init_screen_boss_from_current_screen_far |
| `runtime.far_trampoline.update_boss_system_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/717b | 30333-30358 | update_boss_system_far |
| `runtime.sound.resident.init` | `routine` | `sound` | `referenced` | 1 | 4l/184b | 30383-30386 | call_init_sound_system_resident |
| `runtime.sound.resident.tick` | `routine` | `sound` | `candidate_unreferenced` | 0 | 18l/606b | 30388-30405 | call_task_audio_tick_resident |
| `runtime.sound.resident.music_update` | `routine` | `sound` | `referenced` | 3 | 4l/190b | 30407-30410 | call_music_update_resident |
| `runtime.sound.resident.sfx_update` | `routine` | `sound` | `referenced` | 1 | 4l/182b | 30412-30415 | call_sfx_update_resident |
| `runtime.sound.resident.music_stop` | `routine` | `sound` | `referenced` | 1 | 4l/182b | 30417-30420 | call_music_stop_resident |
| `runtime.sound.resident.music_play_track` | `routine` | `sound` | `referenced` | 2 | 4l/206b | 30422-30425 | call_music_play_track_resident |
| `runtime.sound.resident.music_execute_command` | `routine` | `sound` | `referenced` | 1 | 4l/226b | 30427-30430 | call_music_execute_command_resident |
| `runtime.boss.resident.init` | `routine` | `bosses` | `preserved` | 0 | 4l/232b | 30544-30547 | call_init_boss_system_resident |
| `runtime.boss.resident.init_screen` | `routine` | `bosses` | `preserved` | 0 | 4l/306b | 30549-30552 | call_init_screen_boss_from_current_screen_resident |
| `runtime.boss.resident.update` | `routine` | `bosses` | `preserved` | 0 | 4l/242b | 30554-30557 | call_update_boss_system_resident |
| `runtime.boss.resident.update_projectile` | `routine` | `bosses` | `preserved` | 0 | 4l/279b | 30559-30562 | call_update_boss_projectile_runtime_resident |
| `runtime.boss.resident.draw_attack` | `routine` | `bosses` | `preserved` | 0 | 4l/239b | 30564-30567 | call_draw_boss_attack_resident |
| `runtime.boss.resident.draw_meteor` | `routine` | `bosses` | `preserved` | 0 | 4l/253b | 30569-30572 | call_draw_boss_meteor_attack_resident |
| `runtime.boss.resident.draw_bomb` | `routine` | `bosses` | `preserved` | 0 | 4l/245b | 30574-30577 | call_draw_boss_bomb_attack_resident |
| `runtime.boss.resident.draw_boomerang` | `routine` | `bosses` | `preserved` | 0 | 4l/265b | 30579-30582 | call_draw_boss_boomerang_attack_resident |
| `runtime.boss.resident.draw_rock` | `routine` | `bosses` | `preserved` | 0 | 4l/245b | 30584-30587 | call_draw_boss_rock_attack_resident |
| `runtime.boss.resident.draw_laser` | `routine` | `bosses` | `preserved` | 0 | 4l/249b | 30589-30592 | call_draw_boss_laser_attack_resident |
| `runtime.boss.resident.draw_sine_wave` | `routine` | `bosses` | `preserved` | 0 | 4l/265b | 30594-30597 | call_draw_boss_sine_wave_attack_resident |
| `runtime.boss.resident.draw_homing_missile` | `routine` | `bosses` | `preserved` | 0 | 4l/285b | 30599-30602 | call_draw_boss_homing_missile_attack_resident |
| `runtime.components.init` | `routine` | `components` | `rooted` | 11 | 80l/2746b | 30870-30949 | component_fill_32_a, init_components |
| `runtime.components.position` | `routine` | `components` | `rooted` | 3 | 108l/3281b | 30951-31058 | init_position_system, update_position_component, position_update_loop, position_next_entity |
| `runtime.components.sprite` | `routine` | `components` | `rooted` | 6 | 396l/10316b | 31059-31454 | init_sprite_system, update_sprite_component, sprite_update_loop, sprite_layer_loop, sprite_continue, ... (+6) |
| `runtime.components.movement_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 31460-31463 | update_movement_component |
| `runtime.components.collision` | `routine` | `components` | `referenced` | 2 | 668l/18861b | 31464-32131 | init_collision_system, update_collision_component, collision_update_loop, collision_next_entity, update_entity_collision_fast, ... (+13) |
| `runtime.components.behavior_tile` | `routine` | `components` | `rooted` | 17 | 110l/3809b | 32132-32241 | get_behavior_tile, get_behavior_tile_nb, gbt_oob |
| `runtime.components.directional_sprite_sync` | `routine` | `components` | `rooted` | 3 | 87l/2084b | 32242-32328 | component_sync_directional_sprite_from_initial, component_sync_directional_sprite_from_current, component_sync_directional_sprite_common |
| `runtime.components.input` | `routine` | `components` | `referenced` | 2 | 393l/13136b | 32329-32721 | init_input_system, update_input_component, input_update_loop, input_move_up, input_move_down, ... (+16) |
| `runtime.components.behavior_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 32727-32730 | update_behavior_component |
| `runtime.components.health` | `routine` | `components` | `rooted` | 2 | 152l/4701b | 32731-32882 | init_health_system, update_health_component, decrease_entity_lives, increase_entity_lives |
| `runtime.components.animation` | `routine` | `components` | `referenced` | 4 | 342l/10555b | 32883-33224 | init_animation_system, update_animation_component, anim_done_entity, refresh_player_animation_fastpath |
| `runtime.components.jump` | `routine` | `components` | `referenced` | 2 | 233l/7043b | 33225-33457 | init_jump_system, update_jump_component, jump_update_loop, jump_done_entity, jump_next_entity |
| `runtime.components.gravity` | `routine` | `components` | `rooted` | 2 | 137l/4553b | 33458-33594 | init_gravity_system, update_gravity_component, gravity_update_loop, gravity_store_vel, gravity_grounded, ... (+2) |
| `runtime.components.walljump_stub` | `routine` | `components` | `referenced` | 2 | 18l/326b | 33615-33632 | init_walljump_system, update_walljump_component, walljump_process_entity_c, walljump_input_is_left, walljump_input_is_right |
| `runtime.components.auto_destroy_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/219b | 33635-33641 | init_auto_destroy_system, update_auto_destroy_component |
| `runtime.components.state_machine_component_stub` | `routine` | `components` | `referenced` | 1 | 7l/241b | 33665-33671 | init_statemachine_system, update_statemachine_component |
| `runtime.components.retractable_gate_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/196b | 33677-33680 | update_retractable_gate_component |
| `runtime.components.carry_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/163b | 33686-33689 | update_carry_component |
| `runtime.components.damage_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/166b | 33697-33700 | update_damage_component |
| `runtime.components.shoot_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/163b | 33706-33709 | update_shoot_component |
| `runtime.components.platform_riding_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/220b | 33729-33735 | prepare_platform_detection, update_platform_riding |
| `runtime.components.wallcollision` | `routine` | `components` | `referenced` | 11 | 839l/31288b | 33736-34574 | init_wallcollision_system, wall_behavior_is_full_blocker, wall_down_behavior_blocks, update_wallcollision_component, wall_build_hitbox_cache, ... (+2) |
| `runtime.components.deadly_tiles` | `routine` | `components` | `rooted` | 3 | 262l/5874b | 34575-34836 | init_deadly_tiles_system, deadly_tiles_runtime_tile_is_deadly_nb, update_entity_deadly_flag_runtime, update_deadly_tiles_component, refresh_player_deadly_fastpath |
| `runtime.components.in_water_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 34842-34845 | update_in_water_component |
| `runtime.components.collectible_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/181b | 34851-34854 | update_collectible_component |
| `runtime.components.tile_interaction` | `routine` | `components` | `rooted` | 4 | 966l/21802b | 34855-35820 | interaction_target_variable_ptr_table, interaction_target_variable_word_table, init_tile_interaction_system, update_slash_component, record_bonus_respawn_slot, ... (+8) |
| `runtime.components.collected_tiles` | `routine` | `components` | `rooted` | 1 | 76l/3015b | 35821-35896 | apply_collected_tiles |
| `runtime.components.entity_management` | `routine` | `components` | `rooted` | 3 | 221l/6549b | 35897-36117 | create_entity, entity_job_set, entity_job_set_period_ok, entity_job_set_entry_wrap, entity_job_set_entry_ok, ... (+13) |
| `runtime.components.scheduler` | `routine` | `components` | `rooted` | 7 | 1340l/31712b | 36118-37457 | update_all_entities, mark_used_entity_list_dirty, ensure_used_entity_list_current, rebuild_used_entity_list, ensure_player_fast_runtime_bound, ... (+14) |
| `runtime.components.auto_control_script_stubs` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/252b | 36679-36685 | update_auto_control_script_component, update_auto_event_string_component |
| `runtime.components.state_machine_executor` | `routine` | `components` | `rooted` | 2 | 74l/1973b | 37463-37536 | execute_all_state_machines, refresh_player_state_machine_fastpath |
| `runtime.components.legacy_tile_collision` | `routine` | `components` | `candidate_unreferenced` | 0 | 43l/1404b | 37546-37588 | get_tile_at_position, get_tile_behavior, tile_behavior_table, check_collision_at_point, check_collision_box, ... (+1) |
| `runtime.components.secret_zones` | `routine` | `components` | `rooted` | 1 | 258l/6746b | 37625-37882 | update_secret_zone_component, secret_zone_apply_current_rect, secret_zone_restore_current_rect, secret_zone_clear_state, secret_zone_compute_offset |
| `runtime.statemachine.core` | `routine` | `stateMachine` | `rooted` | 5 | 2355l/62007b | 37890-40244 | SM_Update, sm_timer_no_overflow, sm_timer_paused, sm_update_done, SM_ShouldPauseTimerForDialogue, ... (+45) |
| `data.statemachine.sound-tables` | `data` | `stateMachine` | `rooted` | 1 | 34l/1115b | 40334-40367 | SM_SoundPtrTable, SM_SoundAsset_0, SM_SoundAsset_0_Frames, SM_SoundAsset_1, SM_SoundAsset_1_Frames |
| `data.statemachine.statemachine_1771533517310` | `data` | `stateMachine` | `rooted` | 4 | 622l/20339b | 40368-40989 | SM_New_Statemachine_state_1771533526010, SM_New_Statemachine_state_1771533526010_OnEnter, SM_New_Statemachine_state_1771533526010_Transitions, SM_New_Statemachine_state_1771533526010_Transitions_Actions_2, SM_New_Statemachine_state_1771533526010_Transitions_Actions_3, ... (+43) |
| `data.statemachine.statemachine_1775000000009` | `data` | `stateMachine` | `rooted` | 2 | 36l/1733b | 40990-41025 | SM_Exit_Door_Gem_Gate_state_exit_hidden_1775000000012, SM_Exit_Door_Gem_Gate_state_exit_hidden_1775000000012_OnEnter, SM_Exit_Door_Gem_Gate_state_exit_hidden_1775000000012_Transitions, SM_Exit_Door_Gem_Gate_state_exit_open_1775000000013, SM_Exit_Door_Gem_Gate_state_exit_open_1775000000013_OnEnter |
| `runtime.gameflow.text_screen` | `routine` | `gameflow` | `rooted` | 2 | 160l/4361b | 41188-41347 | show_text_screen, wait_for_fire |
| `runtime.gameflow.submenu` | `routine` | `gameflow` | `rooted` | 1 | 1006l/24325b | 41382-42387 | show_menu_placeholder, render_submenu_screen, submenu_calc_vram_addr, submenu_string_length, submenu_compute_center_col, ... (+11) |
| `runtime.gameflow.presentation_wait_frames` | `routine` | `gameflow` | `empty` | 0 | 3l/230b | 42424-42426 |  |
| `runtime.gameflow.worldlink` | `routine` | `gameflow` | `rooted` | 1 | 102l/2850b | 42475-42576 | gameflow_handle_worldlink |
| `runtime.gameflow.if_then_else` | `routine` | `gameflow` | `rooted` | 1 | 138l/2748b | 42578-42715 | gameflow_handle_ifthenelse |
| `runtime.gameflow.connection_by_type` | `routine` | `gameflow` | `referenced` | 3 | 37l/701b | 44169-44205 | gameflow_get_connection_by_type |
| `runtime.gameflow.screen_timer` | `routine` | `gameflow` | `rooted` | 1 | 144l/3220b | 44327-44470 | get_world_screen_timer_frames_per_second, reload_world_screen_timer_frames, snapshot_world_screen_timer_interrupt_counter, reset_world_screen_timer, update_world_screen_timer |
| `runtime.gameflow.clear_screen_area_helpers` | `routine` | `gameflow` | `referenced` | 2 | 60l/1737b | 44808-44867 | clear_screen_area, clear_screen_row, empty_row_data |
| `runtime.screens.colors` | `routine` | `screens` | `rooted` | 1 | 44l/1514b | 46443-46486 | color_shift_table, set_screen_colors |
| `runtime.screens.copy_rect` | `routine` | `screens` | `rooted` | 4 | 77l/1494b | 46615-46691 | copy_layout_rect_to_vram, copy_layout_rect_ram_to_ram |
| `runtime.screens.block_layout_expander` | `routine` | `screens` | `rooted` | 0 | 194l/3798b | 46693-46886 | expand_screen_block_layout_to_background, expand_screen_block_layout_2x2, expand_screen_block_layout_4x4 |
| `runtime.screens.behavior_map_rebuild` | `routine` | `screens` | `candidate_unreferenced` | 0 | 26l/709b | 46904-46929 | build_runtime_behavior_map_from_screen_layout |
| `runtime.screens.load_screen_stub` | `routine` | `screens` | `candidate_unreferenced` | 0 | 6l/232b | 46930-46935 | load_screen |
| `runtime.screens.load_screen_pan1_770754008863.loader` | `routine` | `screens` | `rooted` | 1 | 121l/4605b | 47064-47184 | load_screen_pan1_770754008863, load_screen_pan1_770754008863_skip_vram_copy, load_pan1_770754008863_boss_done |
| `runtime.screens.load_screen_pan2_771184738851.loader` | `routine` | `screens` | `rooted` | 1 | 121l/4604b | 47313-47433 | load_screen_pan2_771184738851, load_screen_pan2_771184738851_skip_vram_copy, load_pan2_771184738851_boss_done |
| `runtime.screens.load_screen_background1_771482721894.loader` | `routine` | `screens` | `rooted` | 1 | 117l/4622b | 47435-47551 | load_screen_background1_771482721894, load_screen_background1_771482721894_skip_vram_copy, load_background1_771482721894_boss_done |
| `runtime.screens.load_screen_pan3_771880109228.loader` | `routine` | `screens` | `rooted` | 1 | 121l/4605b | 47680-47800 | load_screen_pan3_771880109228, load_screen_pan3_771880109228_skip_vram_copy, load_pan3_771880109228_boss_done |
| `runtime.screens.load_screen_pan4_772291683578.loader` | `routine` | `screens` | `rooted` | 1 | 121l/4604b | 47929-48049 | load_screen_pan4_772291683578, load_screen_pan4_772291683578_skip_vram_copy, load_pan4_772291683578_boss_done |
| `runtime.screens.load_screen_pan5_773321312901.loader` | `routine` | `screens` | `rooted` | 1 | 118l/4490b | 48051-48168 | load_screen_pan5_773321312901, load_screen_pan5_773321312901_skip_vram_copy, load_pan5_773321312901_boss_done |
| `runtime.screens.load_screen_pan6_773382451315.loader` | `routine` | `screens` | `rooted` | 1 | 118l/4490b | 48170-48287 | load_screen_pan6_773382451315, load_screen_pan6_773382451315_skip_vram_copy, load_pan6_773382451315_boss_done |
| `runtime.screens.load_screen_pan1_2_774194791624.loader` | `routine` | `screens` | `rooted` | 1 | 121l/4657b | 48416-48536 | load_screen_pan1_2_774194791624, load_screen_pan1_2_774194791624_skip_vram_copy, load_pan1_2_774194791624_boss_done |
| `data.entities.hero_1.init` | `routine` | `entities` | `rooted` | 1 | 217l/6203b | 48824-49040 | init_hero_1 |
| `data.entities.pato_1.init` | `routine` | `entities` | `rooted` | 1 | 192l/5059b | 49059-49250 | init_pato_1 |
| `data.entities.exit_trigger.init` | `routine` | `entities` | `rooted` | 1 | 157l/4573b | 49300-49456 | init_exit_trigger |
| `data.entities.pato3.init` | `routine` | `entities` | `rooted` | 1 | 192l/5046b | 49475-49666 | init_pato3 |
| ... | ... | ... | ... | ... | ... | ... | +22 more blocks |

## Dead-Block Candidates

- `runtime.components.legacy_tile_collision`: 43 lines / 1404 bytes. No external references found for any global label in this block.
- `runtime.sprites.show_sprite_legacy`: 43 lines / 981 bytes. No external references found for any global label in this block.
- `runtime.components.input_trigger_level`: 33 lines / 773 bytes. No external references found for any global label in this block.
- `runtime.screens.behavior_map_rebuild`: 26 lines / 709 bytes. No external references found for any global label in this block.
- `runtime.worlds.current_screen_helpers`: 23 lines / 633 bytes. No external references found for any global label in this block.
- `runtime.sound.resident.tick`: 18 lines / 606 bytes. No external references found for any global label in this block.
- `runtime.screens.presentation_wait_frames`: 13 lines / 298 bytes. No external references found for any global label in this block.
- `runtime.components.auto_control_script_stubs`: 7 lines / 252 bytes. No external references found for any global label in this block.
- `runtime.screens.load_screen_stub`: 6 lines / 232 bytes. No external references found for any global label in this block.
- `runtime.components.platform_riding_stub`: 7 lines / 220 bytes. No external references found for any global label in this block.
- `runtime.components.auto_destroy_stub`: 7 lines / 219 bytes. No external references found for any global label in this block.
- `runtime.components.retractable_gate_stub`: 4 lines / 196 bytes. No external references found for any global label in this block.
- `runtime.components.collectible_stub`: 4 lines / 181 bytes. No external references found for any global label in this block.
- `runtime.components.movement_stub`: 4 lines / 172 bytes. No external references found for any global label in this block.
- `runtime.components.in_water_stub`: 4 lines / 172 bytes. No external references found for any global label in this block.
- `runtime.components.behavior_stub`: 4 lines / 172 bytes. No external references found for any global label in this block.
- `runtime.components.damage_stub`: 4 lines / 166 bytes. No external references found for any global label in this block.
- `runtime.components.shoot_stub`: 4 lines / 163 bytes. No external references found for any global label in this block.
- `runtime.components.carry_stub`: 4 lines / 163 bytes. No external references found for any global label in this block.

## dead-blocks

- Metrics: findings=19, patchable=19, removed_lines=258, removed_source_bytes=7712
- Routines: runtime.components.auto_control_script_stubs, runtime.components.auto_destroy_stub, runtime.components.behavior_stub, runtime.components.carry_stub, runtime.components.collectible_stub, runtime.components.damage_stub, runtime.components.in_water_stub, runtime.components.input_trigger_level, runtime.components.legacy_tile_collision, runtime.components.movement_stub, runtime.components.platform_riding_stub, runtime.components.retractable_gate_stub, runtime.components.shoot_stub, runtime.screens.behavior_map_rebuild, runtime.screens.load_screen_stub, runtime.screens.presentation_wait_frames, runtime.sound.resident.tick, runtime.sprites.show_sprite_legacy, runtime.worlds.current_screen_helpers

- [patchable] `runtime.components.input_trigger_level` lines 27523-27555: Block `runtime.components.input_trigger_level` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: component_trigger_level_pressed_a.
- [patchable] `runtime.sound.resident.tick` lines 30388-30405: Block `runtime.sound.resident.tick` (routine/sound) is a dead-code candidate. No external references found for any global label in this block. Labels: call_task_audio_tick_resident.
- [patchable] `runtime.components.movement_stub` lines 31460-31463: Block `runtime.components.movement_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_movement_component.
- [patchable] `runtime.components.behavior_stub` lines 32727-32730: Block `runtime.components.behavior_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_behavior_component.
- [patchable] `runtime.components.auto_destroy_stub` lines 33635-33641: Block `runtime.components.auto_destroy_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: init_auto_destroy_system, update_auto_destroy_component.
- [patchable] `runtime.components.retractable_gate_stub` lines 33677-33680: Block `runtime.components.retractable_gate_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_retractable_gate_component.
- [patchable] `runtime.components.carry_stub` lines 33686-33689: Block `runtime.components.carry_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_carry_component.
- [patchable] `runtime.components.damage_stub` lines 33697-33700: Block `runtime.components.damage_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_damage_component.
- [patchable] `runtime.components.shoot_stub` lines 33706-33709: Block `runtime.components.shoot_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_shoot_component.
- [patchable] `runtime.components.platform_riding_stub` lines 33729-33735: Block `runtime.components.platform_riding_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: prepare_platform_detection, update_platform_riding.
- [patchable] `runtime.components.in_water_stub` lines 34842-34845: Block `runtime.components.in_water_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_in_water_component.
- [patchable] `runtime.components.collectible_stub` lines 34851-34854: Block `runtime.components.collectible_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_collectible_component.
- [patchable] `runtime.components.auto_control_script_stubs` lines 36679-36685: Block `runtime.components.auto_control_script_stubs` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_auto_control_script_component, update_auto_event_string_component.
- [patchable] `runtime.components.legacy_tile_collision` lines 37546-37588: Block `runtime.components.legacy_tile_collision` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: get_tile_at_position, get_tile_behavior, tile_behavior_table, check_collision_at_point, check_collision_box, ... (+1).
- [patchable] `runtime.screens.behavior_map_rebuild` lines 46904-46929: Block `runtime.screens.behavior_map_rebuild` (routine/screens) is a dead-code candidate. No external references found for any global label in this block. Labels: build_runtime_behavior_map_from_screen_layout.
- [patchable] `runtime.screens.load_screen_stub` lines 46930-46935: Block `runtime.screens.load_screen_stub` (routine/screens) is a dead-code candidate. No external references found for any global label in this block. Labels: load_screen.
- [patchable] `runtime.sprites.show_sprite_legacy` lines 51525-51567: Block `runtime.sprites.show_sprite_legacy` (routine/sprites) is a dead-code candidate. No external references found for any global label in this block. Labels: show_sprite.
- [patchable] `runtime.worlds.current_screen_helpers` lines 52714-52736: Block `runtime.worlds.current_screen_helpers` (routine/worlds) is a dead-code candidate. No external references found for any global label in this block. Labels: get_current_world_id, get_current_screen_index, set_current_screen.
- [patchable] `runtime.screens.presentation_wait_frames` lines 54077-54089: Block `runtime.screens.presentation_wait_frames` (routine/screens) is a dead-code candidate. No external references found for any global label in this block. Labels: presentation_wait_frames.

## unused-screen-loaders

- Metrics: findings=2, patchable=2, removed_lines=141, removed_source_bytes=5250
- Routines: load_screen_background1_771482721894_far, runtime.screens.load_screen_background1_771482721894.loader

- [patchable] `load_screen_background1_771482721894_far` lines 28387-28411: `load_screen_background1_771482721894_far` is a generated screen loader (25 lines, 629 source bytes) with no external label references. Category reason: Generated screen loader routine. Project metadata maps it to scene `background1` (index=2, resources=8). GameFlow reachability marks this scene unreachable. Related annotated loader block `runtime.screens.load_screen_background1_771482721894.loader` is currently rooted by `load_screen_background1_771482721894`. Deletion is patchable only when GameFlow reachability proves the scene is unreachable.
- [patchable] `runtime.screens.load_screen_background1_771482721894.loader` lines 47435-47551: Annotated loader block `runtime.screens.load_screen_background1_771482721894.loader` only feeds `load_screen_background1_771482721894_far`, and GameFlow reachability marks the owning scene unreachable.

## inactive-feature-runtime

- Metrics: findings=37, patchable=18, removed_lines=144, removed_source_bytes=5771
- Routines: call_draw_boss_attack_resident, call_draw_boss_bomb_attack_resident, call_draw_boss_boomerang_attack_resident, call_draw_boss_homing_missile_attack_resident, call_draw_boss_laser_attack_resident, call_draw_boss_meteor_attack_resident, call_draw_boss_rock_attack_resident, call_draw_boss_sine_wave_attack_resident, call_init_boss_system_resident, call_init_screen_boss_from_current_screen_resident, call_update_boss_projectile_runtime_resident, call_update_boss_system_resident, init_boss_system, init_boss_system_far, init_screen_boss_from_current_screen, init_screen_boss_from_current_screen_far, runtime.boss.group.stubs, runtime.boss.group.stubs:call_draw_boss_attack_resident, runtime.boss.group.stubs:call_draw_boss_bomb_attack_resident, runtime.boss.group.stubs:call_draw_boss_boomerang_attack_resident, runtime.boss.group.stubs:call_draw_boss_homing_missile_attack_resident, runtime.boss.group.stubs:call_draw_boss_laser_attack_resident, runtime.boss.group.stubs:call_draw_boss_meteor_attack_resident, runtime.boss.group.stubs:call_draw_boss_rock_attack_resident, runtime.boss.group.stubs:call_draw_boss_sine_wave_attack_resident, runtime.boss.group.stubs:call_init_boss_system_resident, runtime.boss.group.stubs:call_init_screen_boss_from_current_screen_resident, runtime.boss.group.stubs:call_update_boss_projectile_runtime_resident, runtime.boss.group.stubs:call_update_boss_system_resident, runtime.boss.group.stubs:init_boss_system, runtime.boss.group.stubs:init_boss_system_far, runtime.boss.group.stubs:init_screen_boss_from_current_screen, runtime.boss.group.stubs:init_screen_boss_from_current_screen_far, runtime.boss.group.stubs:update_boss_system, runtime.boss.group.stubs:update_boss_system_far, update_boss_system, update_boss_system_far

- [patchable] `runtime.boss.group.stubs:init_boss_system_far` lines 30279-30304: `init_boss_system_far` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.boss.group.stubs` lines 30280-57131: `runtime.boss.group.stubs` groups inactive boss compatibility stubs runtime labels: call_draw_boss_attack_resident, call_draw_boss_bomb_attack_resident, call_draw_boss_boomerang_attack_resident, call_draw_boss_homing_missile_attack_resident, call_draw_boss_laser_attack_resident, call_draw_boss_meteor_attack_resident, call_draw_boss_rock_attack_resident, call_draw_boss_sine_wave_attack_resident, call_init_boss_system_resident, call_init_screen_boss_from_current_screen_resident, call_update_boss_projectile_runtime_resident, call_update_boss_system_resident, init_boss_system, init_boss_system_far, init_screen_boss_from_current_screen, init_screen_boss_from_current_screen_far, update_boss_system, update_boss_system_far. No external references outside the group were found. This is ready for a future atomic multi-window patch, or for dead-blocks to remove the annotated windows as whole groups. Atomic patch enabled as `runtime.boss.group.stubs` with 18 window(s).
- [report-only] `init_boss_system_far` lines 30280-30306: `init_boss_system_far` looks like bosses runtime (27 lines, 724 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: boot_or_init (Boot/init routine). External references still exist (1): call_init_boss_system_resident@30546. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.far_trampoline.init_boss_system_far` owner=`far-call` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:init_screen_boss_from_current_screen_far` lines 30306-30331: `init_screen_boss_from_current_screen_far` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `init_screen_boss_from_current_screen_far` lines 30307-30333: `init_screen_boss_from_current_screen_far` looks like bosses runtime (27 lines, 826 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: boot_or_init (Boot/init routine). External references still exist (1): call_init_screen_boss_from_current_screen_resident@30551. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.far_trampoline.init_screen_boss_from_current_screen_far` owner=`far-call` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:update_boss_system_far` lines 30333-30358: `update_boss_system_far` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `update_boss_system_far` lines 30334-30364: `update_boss_system_far` looks like bosses runtime (31 lines, 947 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_update_boss_system_resident@30556. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.far_trampoline.update_boss_system_far` owner=`far-call` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_init_boss_system_resident` lines 30544-30547: `call_init_boss_system_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_init_boss_system_resident` lines 30545-30549: `call_init_boss_system_resident` looks like bosses runtime (5 lines, 260 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.init` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_init_screen_boss_from_current_screen_resident` lines 30549-30552: `call_init_screen_boss_from_current_screen_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_init_screen_boss_from_current_screen_resident` lines 30550-30554: `call_init_screen_boss_from_current_screen_resident` looks like bosses runtime (5 lines, 284 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.init_screen` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_update_boss_system_resident` lines 30554-30557: `call_update_boss_system_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_update_boss_system_resident` lines 30555-30559: `call_update_boss_system_resident` looks like bosses runtime (5 lines, 266 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.update` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_update_boss_projectile_runtime_resident` lines 30559-30562: `call_update_boss_projectile_runtime_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_update_boss_projectile_runtime_resident` lines 30560-30564: `call_update_boss_projectile_runtime_resident` looks like bosses runtime (5 lines, 260 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.update_projectile` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_attack_resident` lines 30564-30567: `call_draw_boss_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_attack_resident` lines 30565-30569: `call_draw_boss_attack_resident` looks like bosses runtime (5 lines, 247 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_attack` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_meteor_attack_resident` lines 30569-30572: `call_draw_boss_meteor_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_meteor_attack_resident` lines 30570-30574: `call_draw_boss_meteor_attack_resident` looks like bosses runtime (5 lines, 250 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_meteor` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_bomb_attack_resident` lines 30574-30577: `call_draw_boss_bomb_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_bomb_attack_resident` lines 30575-30579: `call_draw_boss_bomb_attack_resident` looks like bosses runtime (5 lines, 256 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_bomb` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_boomerang_attack_resident` lines 30579-30582: `call_draw_boss_boomerang_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_boomerang_attack_resident` lines 30580-30584: `call_draw_boss_boomerang_attack_resident` looks like bosses runtime (5 lines, 256 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_boomerang` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_rock_attack_resident` lines 30584-30587: `call_draw_boss_rock_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_rock_attack_resident` lines 30585-30589: `call_draw_boss_rock_attack_resident` looks like bosses runtime (5 lines, 248 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_rock` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_laser_attack_resident` lines 30589-30592: `call_draw_boss_laser_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_laser_attack_resident` lines 30590-30594: `call_draw_boss_laser_attack_resident` looks like bosses runtime (5 lines, 258 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_laser` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_sine_wave_attack_resident` lines 30594-30597: `call_draw_boss_sine_wave_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_sine_wave_attack_resident` lines 30595-30599: `call_draw_boss_sine_wave_attack_resident` looks like bosses runtime (5 lines, 276 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_sine_wave` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_homing_missile_attack_resident` lines 30599-30602: `call_draw_boss_homing_missile_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_homing_missile_attack_resident` lines 30600-30603: `call_draw_boss_homing_missile_attack_resident` looks like bosses runtime (4 lines, 133 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_homing_missile` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:init_boss_system` lines 57108-57121: `init_boss_system` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `init_boss_system` lines 57108-57122: `init_boss_system` looks like bosses runtime (15 lines, 330 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: boot_or_init (Boot/init routine). External references still exist (1): init_boss_system_far@30289. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.boss.entry` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:update_boss_system` lines 57123-57124: `update_boss_system` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `update_boss_system` lines 57123-57125: `update_boss_system` looks like bosses runtime (3 lines, 29 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): update_boss_system_far@30343. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.boss.entry` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:init_screen_boss_from_current_screen` lines 57126-57127: `init_screen_boss_from_current_screen` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `init_screen_boss_from_current_screen` lines 57126-57131: `init_screen_boss_from_current_screen` looks like bosses runtime (6 lines, 140 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: boot_or_init (Boot/init routine). External references still exist (1): init_screen_boss_from_current_screen_far@30316. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.boss.entry` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.

## unused-component-runtime

- Metrics: findings=31, patchable=19, removed_lines=59, removed_source_bytes=1948
- Routines: runtime.components.system.auto_control_script, runtime.components.system.auto_control_script:init_auto_control_script_system, runtime.components.system.auto_control_script:update_auto_control_script_component, runtime.components.system.auto_control_script:update_auto_event_string_component, runtime.components.system.auto_destroy, runtime.components.system.auto_destroy:init_auto_destroy_system, runtime.components.system.behavior, runtime.components.system.behavior:update_behavior_component, runtime.components.system.carry, runtime.components.system.carry:init_carry_system, runtime.components.system.carry:update_carry_component, runtime.components.system.collectible, runtime.components.system.collectible:init_collectible_system, runtime.components.system.collectible:update_collectible_component, runtime.components.system.damage, runtime.components.system.damage:init_damage_system, runtime.components.system.damage:update_damage_component, runtime.components.system.in_water, runtime.components.system.in_water:init_in_water_system, runtime.components.system.in_water:update_in_water_component, runtime.components.system.movement, runtime.components.system.movement:init_movement_system, runtime.components.system.movement:update_movement_component, runtime.components.system.retractable_gate, runtime.components.system.retractable_gate:init_retractable_gate_system, runtime.components.system.retractable_gate:update_retractable_gate_component, runtime.components.system.shoot, runtime.components.system.shoot:init_shoot_system, runtime.components.system.shoot:update_shoot_component, runtime.components.system.wall_grab, runtime.components.system.wall_jump

- [report-only] `runtime.components.system.movement` lines 31457-31469: `runtime.components.system.movement` covers unused movement component labels: init_movement_system, update_movement_component. `project_usage.componentRuntime.usedComponents` is Animation, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Patrol, Position, Sprite, StateMachine, TileInteraction, WallCollision, so component type `Movement` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.movement` with 2 window(s).
- [patchable] `runtime.components.system.movement:init_movement_system` lines 31457-31458: `init_movement_system` is part of unused component runtime group `runtime.components.system.movement`. The group has no external references, so this window is removed only together with the other group windows.
- [patchable] `runtime.components.system.movement:update_movement_component` lines 31460-31463: `update_movement_component` is part of unused component runtime group `runtime.components.system.movement`. The group has no external references, so this window is removed only together with the other group windows.
- [patchable] `runtime.components.system.behavior:update_behavior_component` lines 32727-32730: `update_behavior_component` is part of unused component runtime group `runtime.components.system.behavior`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.components.system.behavior` lines 32728-32740: `runtime.components.system.behavior` covers unused behavior component labels: update_behavior_component. `project_usage.componentRuntime.usedComponents` is Animation, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Patrol, Position, Sprite, StateMachine, TileInteraction, WallCollision, so component type `Behavior` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.behavior` with 1 window(s).
- [report-only] `runtime.components.system.wall_grab` lines 33602-33615: `runtime.components.system.wall_grab` covers unused wall-grab component labels: init_wallgrab_system, refresh_player_wallgrab_fastpath, update_wallgrab_component, wallgrab_process_entity_c. `project_usage.componentRuntime.usedComponents` is Animation, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Patrol, Position, Sprite, StateMachine, TileInteraction, WallCollision, so component type `WallGrab` is not used by active entities. External references still exist (3): update_player_fastpath->wallgrab_process_entity_c@37390, gameflow_world_game_loop->refresh_player_wallgrab_fastpath@44275, gameflow_world_game_loop->update_wallgrab_component@44276. Deletion stays blocked until the scheduler/caller path is proven dead or grouped. Patch policy: report-only.
- [report-only] `runtime.components.system.wall_jump` lines 33616-33635: `runtime.components.system.wall_jump` covers unused wall-jump component labels: init_walljump_system, update_walljump_component, walljump_input_is_left, walljump_input_is_right, walljump_process_entity_c. `project_usage.componentRuntime.usedComponents` is Animation, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Patrol, Position, Sprite, StateMachine, TileInteraction, WallCollision, so component type `WallJump` is not used by active entities. External references still exist (2): update_player_fastpath->walljump_process_entity_c@37201, update_player_fastpath->walljump_process_entity_c@37404. Deletion stays blocked until the scheduler/caller path is proven dead or grouped. Patch policy: report-only.
- [patchable] `runtime.components.system.auto_destroy:init_auto_destroy_system` lines 33635-33641: `init_auto_destroy_system` is part of unused component runtime group `runtime.components.system.auto_destroy`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.components.system.auto_destroy` lines 33636-33650: `runtime.components.system.auto_destroy` covers unused auto-destroy component labels: init_auto_destroy_system, update_auto_destroy_component. `project_usage.componentRuntime.usedComponents` is Animation, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Patrol, Position, Sprite, StateMachine, TileInteraction, WallCollision, so component type `AutoDestroy` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.auto_destroy` with 1 window(s).
- [report-only] `runtime.components.system.retractable_gate` lines 33674-33682: `runtime.components.system.retractable_gate` covers unused retractable-gate component labels: init_retractable_gate_system, update_retractable_gate_component. `project_usage.componentRuntime.usedComponents` is Animation, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Patrol, Position, Sprite, StateMachine, TileInteraction, WallCollision, so component type `RetractableGate` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.retractable_gate` with 2 window(s).
- [patchable] `runtime.components.system.retractable_gate:init_retractable_gate_system` lines 33674-33675: `init_retractable_gate_system` is part of unused component runtime group `runtime.components.system.retractable_gate`. The group has no external references, so this window is removed only together with the other group windows.
- [patchable] `runtime.components.system.retractable_gate:update_retractable_gate_component` lines 33677-33680: `update_retractable_gate_component` is part of unused component runtime group `runtime.components.system.retractable_gate`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.components.system.carry` lines 33683-33693: `runtime.components.system.carry` covers unused carry component labels: init_carry_system, update_carry_component. `project_usage.componentRuntime.usedComponents` is Animation, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Patrol, Position, Sprite, StateMachine, TileInteraction, WallCollision, so component type `Carry` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.carry` with 2 window(s).
- [patchable] `runtime.components.system.carry:init_carry_system` lines 33683-33684: `init_carry_system` is part of unused component runtime group `runtime.components.system.carry`. The group has no external references, so this window is removed only together with the other group windows.
- [patchable] `runtime.components.system.carry:update_carry_component` lines 33686-33689: `update_carry_component` is part of unused component runtime group `runtime.components.system.carry`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.components.system.damage` lines 33694-33702: `runtime.components.system.damage` covers unused damage component labels: init_damage_system, update_damage_component. `project_usage.componentRuntime.usedComponents` is Animation, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Patrol, Position, Sprite, StateMachine, TileInteraction, WallCollision, so component type `Damage` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.damage` with 2 window(s).
- [patchable] `runtime.components.system.damage:init_damage_system` lines 33694-33695: `init_damage_system` is part of unused component runtime group `runtime.components.system.damage`. The group has no external references, so this window is removed only together with the other group windows.
- [patchable] `runtime.components.system.damage:update_damage_component` lines 33697-33700: `update_damage_component` is part of unused component runtime group `runtime.components.system.damage`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.components.system.shoot` lines 33703-33714: `runtime.components.system.shoot` covers unused shoot component labels: init_shoot_system, update_shoot_component. `project_usage.componentRuntime.usedComponents` is Animation, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Patrol, Position, Sprite, StateMachine, TileInteraction, WallCollision, so component type `Shoot` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.shoot` with 2 window(s).
- [patchable] `runtime.components.system.shoot:init_shoot_system` lines 33703-33704: `init_shoot_system` is part of unused component runtime group `runtime.components.system.shoot`. The group has no external references, so this window is removed only together with the other group windows.
- [patchable] `runtime.components.system.shoot:update_shoot_component` lines 33706-33709: `update_shoot_component` is part of unused component runtime group `runtime.components.system.shoot`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.components.system.in_water` lines 34839-34847: `runtime.components.system.in_water` covers unused in-water component labels: init_in_water_system, update_in_water_component. `project_usage.componentRuntime.usedComponents` is Animation, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Patrol, Position, Sprite, StateMachine, TileInteraction, WallCollision, so component type `InWater` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.in_water` with 2 window(s).
- [patchable] `runtime.components.system.in_water:init_in_water_system` lines 34839-34840: `init_in_water_system` is part of unused component runtime group `runtime.components.system.in_water`. The group has no external references, so this window is removed only together with the other group windows.
- [patchable] `runtime.components.system.in_water:update_in_water_component` lines 34842-34845: `update_in_water_component` is part of unused component runtime group `runtime.components.system.in_water`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.components.system.collectible` lines 34848-34867: `runtime.components.system.collectible` covers unused collectible component labels: init_collectible_system, update_collectible_component. `project_usage.componentRuntime.usedComponents` is Animation, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Patrol, Position, Sprite, StateMachine, TileInteraction, WallCollision, so component type `Collectible` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.collectible` with 2 window(s).
- [patchable] `runtime.components.system.collectible:init_collectible_system` lines 34848-34849: `init_collectible_system` is part of unused component runtime group `runtime.components.system.collectible`. The group has no external references, so this window is removed only together with the other group windows.
- [patchable] `runtime.components.system.collectible:update_collectible_component` lines 34851-34854: `update_collectible_component` is part of unused component runtime group `runtime.components.system.collectible`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.components.system.auto_control_script` lines 36676-36693: `runtime.components.system.auto_control_script` covers unused auto-control-script component labels: init_auto_control_script_system, update_auto_control_script_component, update_auto_event_string_component. `project_usage.componentRuntime.usedComponents` is Animation, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Patrol, Position, Sprite, StateMachine, TileInteraction, WallCollision, so component type `AutoControlScript` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.auto_control_script` with 3 window(s).
- [patchable] `runtime.components.system.auto_control_script:init_auto_control_script_system` lines 36676-36677: `init_auto_control_script_system` is part of unused component runtime group `runtime.components.system.auto_control_script`. The group has no external references, so this window is removed only together with the other group windows.
- [patchable] `runtime.components.system.auto_control_script:update_auto_control_script_component` lines 36680-36681: `update_auto_control_script_component` is part of unused component runtime group `runtime.components.system.auto_control_script`. The group has no external references, so this window is removed only together with the other group windows.
- [patchable] `runtime.components.system.auto_control_script:update_auto_event_string_component` lines 36683-36684: `update_auto_event_string_component` is part of unused component runtime group `runtime.components.system.auto_control_script`. The group has no external references, so this window is removed only together with the other group windows.

## Optimization Passes

- Pass 1: findings=89, patchable=47, removed=559 lines / 18987 bytes, lines=57135->56576
- Pass 2: findings=2, patchable=0, removed=0 lines / 0 bytes, lines=56576->56576

