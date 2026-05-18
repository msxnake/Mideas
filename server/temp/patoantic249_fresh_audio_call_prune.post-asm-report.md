# Post-ASM Report

- Input: `C:\Users\salam\Documents\Programacion\Mideas\server\temp\patoantic249_fresh_audio_call_prune.asm`
- Findings: 66
- Applied patches: 23
- Original lines: 53961
- Output lines: 53522
- Net line delta: -439

- Optimization passes run: 2
- Optimization source removed: 439 lines / 13836 bytes

## Mideas Block Inventory

- Blocks: 108
- Preserved blocks: 8
- Removable-by-policy blocks: 100
- Dead-block candidates: 21
- Annotated block source: 18868 lines / 524784 bytes
- Dead-candidate source: 311 lines / 9051 bytes
- Marker errors: 0

- By kind: data=3, routine=98, trampoline=7
- By owner: animtiles=1, bosses=2, components=34, entities=7, far-call=7, font=1, gameflow=10, hud=1, interrupt=5, mapper=1, menus=1, resources=1, screens=14, scroll=1, sound=13, sprites=1, stateMachine=4, unified=1, worlds=3
- By status: candidate_unreferenced=21, preserved=8, referenced=19, rooted=60

### Largest Annotated Blocks

| ID | Status | Source | Kind | Owner |
| --- | --- | --- | --- | --- |
| `runtime.statemachine.core` | `rooted` | 2311l/60794b | `routine` | `stateMachine` |
| `runtime.components.wallcollision` | `referenced` | 839l/31288b | `routine` | `components` |
| `runtime.components.scheduler` | `rooted` | 1299l/30456b | `routine` | `components` |
| `runtime.gameflow.submenu` | `rooted` | 1006l/24317b | `routine` | `gameflow` |
| `runtime.components.tile_interaction` | `rooted` | 966l/21802b | `routine` | `components` |
| `data.statemachine.statemachine_1771533517310` | `rooted` | 622l/20339b | `data` | `stateMachine` |
| `runtime.animtiles.core` | `rooted` | 540l/20056b | `routine` | `animtiles` |
| `runtime.boss.core` | `rooted` | 876l/19553b | `routine` | `bosses` |
| `runtime.components.collision` | `referenced` | 668l/18861b | `routine` | `components` |
| `runtime.resources.manager` | `rooted` | 680l/17743b | `routine` | `resources` |
| `runtime.hud.core` | `rooted` | 661l/15508b | `routine` | `hud` |
| `runtime.components.input` | `referenced` | 388l/12766b | `routine` | `components` |
| `runtime.components.animation` | `referenced` | 342l/10555b | `routine` | `components` |
| `runtime.components.sprite` | `rooted` | 396l/10316b | `routine` | `components` |
| `runtime.scroll.core` | `rooted` | 344l/8639b | `routine` | `scroll` |
| `runtime.components.jump` | `referenced` | 233l/7043b | `routine` | `components` |
| `runtime.font.loading` | `rooted` | 227l/6845b | `routine` | `font` |
| `runtime.components.secret_zones` | `rooted` | 258l/6746b | `routine` | `components` |
| `runtime.components.entity_management` | `rooted` | 221l/6549b | `routine` | `components` |
| `runtime.interrupt.task_input` | `rooted` | 231l/6052b | `routine` | `interrupt` |

## Global Label Inventory

- Global labels: 1104

| Label | Category | Source |
| --- | --- | --- |
| `FAST_SNSMAT` | `bios_helper` | 1076l/64963b |
| `update_wallcollision_component` | `runtime_code` | 538l/20410b |
| `FAR_BANK_9_ROM_START` | `bank_marker` | 310l/15186b |
| `Action_ChangeSprite` | `runtime_code` | 321l/14617b |
| `update_player_fastpath` | `runtime_code` | 604l/13839b |
| `resource_table` | `data` | 823l/12227b |
| `update_entity_collision_fast` | `runtime_code` | 345l/9814b |
| `BANK_2_USED_END` | `bank_marker` | 166l/9783b |
| `load_sprite_patterns_worldmap_1770754170935` | `data` | 222l/9051b |
| `scan_tile_interaction_entities` | `runtime_code` | 318l/8428b |
| `update_animation_component` | `runtime_code` | 255l/8328b |
| `mapper_call_hl_auto` | `shared_runtime` | 180l/7912b |
| `BANK_0_USED_END` | `bank_marker` | 141l/7650b |
| `load_sprite_patterns_worldmap_1774194757416` | `data` | 170l/6931b |
| `PRESENTATION_SCREEN_COLORS_B1` | `data` | 99l/6865b |
| `vdpLoop` | `bios_helper` | 192l/6712b |
| `pt3_track_0_data` | `data` | 101l/6709b |
| `PRESENTATION_SCREEN_PATTERNS_B1` | `data` | 96l/6680b |
| `screen_runtime_summary_table` | `data` | 138l/6188b |
| `update_slash_component` | `runtime_code` | 301l/6121b |
| `anim_group_2_new_tile` | `data` | 71l/5671b |
| `tile_pattern_bank0` | `data` | 54l/5555b |
| `init_hero_2` | `boot_or_init` | 187l/5389b |
| `init_hero_1` | `boot_or_init` | 187l/5384b |
| `tile_color_bank0` | `data` | 54l/5378b |
| `task_update_input` | `shared_runtime` | 200l/5024b |
| `render_hud` | `runtime_code` | 174l/4762b |
| `tilebank_color_data_0` | `data` | 64l/4736b |
| `jump_update_loop` | `runtime_code` | 157l/4675b |
| `render_submenu_screen` | `runtime_code` | 162l/4665b |

### Largest Unannotated Global Labels

- Unannotated labels: 577

| Category | Labels | Source |
| --- | ---: | ---: |
| `bank_marker` | 29 | 1258l/57187b |
| `bios_helper` | 9 | 1677l/83252b |
| `boot_or_init` | 33 | 838l/21970b |
| `data` | 265 | 6574l/303141b |
| `far_trampoline` | 81 | 971l/20264b |
| `runtime_code` | 120 | 2470l/88643b |
| `runtime_inner_label` | 30 | 586l/16681b |
| `screen_loader` | 8 | 144l/3220b |
| `shared_runtime` | 2 | 31l/1113b |

| Label | Category | Source |
| --- | --- | --- |
| `FAST_SNSMAT` | `bios_helper` | 1076l/64963b |
| `FAR_BANK_9_ROM_START` | `bank_marker` | 310l/15186b |
| `resource_table` | `data` | 823l/12227b |
| `BANK_2_USED_END` | `bank_marker` | 166l/9783b |
| `load_sprite_patterns_worldmap_1770754170935` | `data` | 222l/9051b |
| `BANK_0_USED_END` | `bank_marker` | 141l/7650b |
| `load_sprite_patterns_worldmap_1774194757416` | `data` | 170l/6931b |
| `PRESENTATION_SCREEN_COLORS_B1` | `data` | 99l/6865b |
| `vdpLoop` | `bios_helper` | 192l/6712b |
| `pt3_track_0_data` | `data` | 101l/6709b |
| `PRESENTATION_SCREEN_PATTERNS_B1` | `data` | 96l/6680b |
| `screen_runtime_summary_table` | `data` | 138l/6188b |
| `tile_pattern_bank0` | `data` | 54l/5555b |
| `tile_color_bank0` | `data` | 54l/5378b |
| `tilebank_color_data_0` | `data` | 64l/4736b |
| `tilebank_pattern_data_0` | `data` | 56l/4597b |
| `SCREEN_PAN1_0_EFFECTS_LAYOUT` | `runtime_code` | 70l/4099b |
| `SCREEN_PAN2_1_INTERACTION_TARGET_MAP` | `runtime_code` | 58l/3670b |
| `SCREEN_BACKGROUND1_2_INTERACTION_TARGET_MAP` | `runtime_code` | 58l/3656b |
| `SCREEN_PAN6_6_INTERACTION_TARGET_MAP` | `runtime_code` | 58l/3650b |
| `SCREEN_PAN5_5_INTERACTION_TARGET_MAP` | `runtime_code` | 58l/3642b |
| `SCREEN_PAN4_4_INTERACTION_TARGET_MAP` | `runtime_code` | 58l/3642b |
| `SCREEN_PAN3_3_INTERACTION_TARGET_MAP` | `runtime_code` | 58l/3642b |
| `SCREEN_PAN1_0_INTERACTION_TARGET_MAP` | `runtime_code` | 58l/3642b |
| `FAR_BANK_11_ROM_START` | `bank_marker` | 98l/3568b |
| `SCREEN_BACKGROUND1_2_INTERACTION_VALUE_MAP` | `data` | 51l/3504b |
| `SCREEN_BACKGROUND1_2_INTERACTION_TYPE_MAP` | `data` | 51l/3502b |
| `SCREEN_PAN1_2_7_INTERACTION_TARGET_MAP` | `data` | 51l/3496b |
| `SCREEN_PAN1_2_7_INTERACTION_VALUE_MAP` | `data` | 51l/3494b |
| `SCREEN_PAN1_2_7_INTERACTION_TYPE_MAP` | `data` | 51l/3492b |

| ID | Kind | Owner | Status | Incoming | Source | Lines | Labels |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `runtime.mapper.core` | `routine` | `mapper` | `rooted` | 179 | 213l/5412b | 22028-22240 | mapper_runtime_init, mapper_set_bank_p1, mapper_set_bank_p2, mapper_set_bank_p3, mapper_set_bank_p4, ... (+14) |
| `runtime.resources.manager` | `routine` | `resources` | `rooted` | 190 | 680l/17743b | 23272-23951 | resource_manager_init, resource_invalidate_pattern_vram_cache, resource_invalidate_color_vram_cache, resource_invalidate_font_vram_cache, resource_invalidate_gameplay_vram_cache, ... (+14) |
| `runtime.components.input_trigger_level` | `routine` | `components` | `candidate_unreferenced` | 0 | 33l/773b | 24033-24065 | component_trigger_level_pressed_a |
| `runtime.page0.stubs` | `routine` | `unified` | `rooted` | 1 | 22l/505b | 24072-24093 | init_page0_runtime_state, page0_map_expanded_slot, page0_map_game_rom, page0_restore_bios_rom, page0_copy_chunk_to_buffer, ... (+2) |
| `runtime.interrupt.stop` | `routine` | `interrupt` | `rooted` | 0 | 43l/1299b | 24172-24214 | stop_interrupt_system |
| `runtime.interrupt.dispatcher` | `routine` | `interrupt` | `preserved` | 1 | 124l/4150b | 24216-24339 | interrupt_dispatcher |
| `runtime.interrupt.vblank_flag` | `routine` | `interrupt` | `rooted` | 1 | 35l/983b | 24352-24386 | update_vblank_flag |
| `runtime.interrupt.task_api` | `routine` | `interrupt` | `rooted` | 2 | 121l/3195b | 24391-24511 | enable_task, disable_task, get_frame_count |
| `runtime.interrupt.task_input` | `routine` | `interrupt` | `rooted` | 2 | 231l/6052b | 24515-24745 | init_default_tasks_from_plan, task_update_input |
| `runtime.far_trampoline.init_sound_system_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/526b | 25491-25509 | init_sound_system_far |
| `runtime.far_trampoline.task_audio_tick_far` | `trampoline` | `far-call` | `preserved` | 0 | 19l/514b | 25511-25529 | task_audio_tick_far |
| `runtime.far_trampoline.sfx_update_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/484b | 25531-25549 | sfx_update_far |
| `runtime.far_trampoline.music_update_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/496b | 25551-25569 | music_update_far |
| `runtime.far_trampoline.music_stop_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/484b | 25571-25589 | music_stop_far |
| `runtime.far_trampoline.music_play_track_far` | `trampoline` | `far-call` | `preserved` | 1 | 21l/557b | 25591-25611 | music_play_track_far |
| `runtime.far_trampoline.music_execute_command_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/550b | 25613-25631 | music_execute_command_far |
| `runtime.sound.resident.init` | `routine` | `sound` | `referenced` | 1 | 4l/184b | 26094-26097 | call_init_sound_system_resident |
| `runtime.sound.resident.tick` | `routine` | `sound` | `candidate_unreferenced` | 0 | 18l/606b | 26099-26116 | call_task_audio_tick_resident |
| `runtime.sound.resident.music_update` | `routine` | `sound` | `referenced` | 3 | 4l/190b | 26118-26121 | call_music_update_resident |
| `runtime.sound.resident.sfx_update` | `routine` | `sound` | `referenced` | 1 | 4l/182b | 26123-26126 | call_sfx_update_resident |
| `runtime.sound.resident.music_stop` | `routine` | `sound` | `referenced` | 1 | 4l/182b | 26128-26131 | call_music_stop_resident |
| `runtime.sound.resident.music_play_track` | `routine` | `sound` | `referenced` | 2 | 4l/206b | 26133-26136 | call_music_play_track_resident |
| `runtime.sound.resident.music_execute_command` | `routine` | `sound` | `referenced` | 1 | 4l/226b | 26138-26141 | call_music_execute_command_resident |
| `runtime.components.init` | `routine` | `components` | `rooted` | 11 | 82l/2818b | 26546-26627 | component_fill_32_a, init_components |
| `runtime.components.position` | `routine` | `components` | `rooted` | 3 | 108l/3281b | 26629-26736 | init_position_system, update_position_component, position_update_loop, position_next_entity |
| `runtime.components.sprite` | `routine` | `components` | `rooted` | 6 | 396l/10316b | 26737-27132 | init_sprite_system, update_sprite_component, sprite_update_loop, sprite_layer_loop, sprite_continue, ... (+6) |
| `runtime.components.movement_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 27138-27141 | update_movement_component |
| `runtime.components.collision` | `routine` | `components` | `referenced` | 2 | 668l/18861b | 27142-27809 | init_collision_system, update_collision_component, collision_update_loop, collision_next_entity, update_entity_collision_fast, ... (+13) |
| `runtime.components.behavior_tile` | `routine` | `components` | `rooted` | 17 | 110l/3809b | 27810-27919 | get_behavior_tile, get_behavior_tile_nb, gbt_oob |
| `runtime.components.directional_sprite_sync` | `routine` | `components` | `rooted` | 3 | 87l/2084b | 27920-28006 | component_sync_directional_sprite_from_initial, component_sync_directional_sprite_from_current, component_sync_directional_sprite_common |
| `runtime.components.input` | `routine` | `components` | `referenced` | 2 | 388l/12766b | 28007-28394 | init_input_system, update_input_component, input_update_loop, input_move_up, input_move_down, ... (+16) |
| `runtime.components.behavior_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 28400-28403 | update_behavior_component |
| `runtime.components.health` | `routine` | `components` | `rooted` | 2 | 152l/4701b | 28404-28555 | init_health_system, update_health_component, decrease_entity_lives, increase_entity_lives |
| `runtime.components.animation` | `routine` | `components` | `referenced` | 4 | 342l/10555b | 28556-28897 | init_animation_system, update_animation_component, anim_done_entity, refresh_player_animation_fastpath |
| `runtime.components.jump` | `routine` | `components` | `referenced` | 2 | 233l/7043b | 28898-29130 | init_jump_system, update_jump_component, jump_update_loop, jump_done_entity, jump_next_entity |
| `runtime.components.gravity` | `routine` | `components` | `rooted` | 2 | 137l/4553b | 29131-29267 | init_gravity_system, update_gravity_component, gravity_update_loop, gravity_store_vel, gravity_grounded, ... (+2) |
| `runtime.components.walljump_stub` | `routine` | `components` | `referenced` | 2 | 18l/326b | 29288-29305 | init_walljump_system, update_walljump_component, walljump_process_entity_c, walljump_input_is_left, walljump_input_is_right |
| `runtime.components.auto_destroy_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/219b | 29308-29314 | init_auto_destroy_system, update_auto_destroy_component |
| `runtime.components.state_machine_component_stub` | `routine` | `components` | `referenced` | 1 | 7l/241b | 29338-29344 | init_statemachine_system, update_statemachine_component |
| `runtime.components.retractable_gate_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/196b | 29350-29353 | update_retractable_gate_component |
| `runtime.components.carry_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/163b | 29359-29362 | update_carry_component |
| `runtime.components.auto_control_script_stubs` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/252b | 29368-29374 | update_auto_control_script_component, update_auto_event_string_component |
| `runtime.components.damage_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/166b | 29380-29383 | update_damage_component |
| `runtime.components.shoot_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/163b | 29389-29392 | update_shoot_component |
| `runtime.components.platform_riding_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/220b | 29412-29418 | prepare_platform_detection, update_platform_riding |
| `runtime.components.wallcollision` | `routine` | `components` | `referenced` | 11 | 839l/31288b | 29419-30257 | init_wallcollision_system, wall_behavior_is_full_blocker, wall_down_behavior_blocks, update_wallcollision_component, wall_build_hitbox_cache, ... (+2) |
| `runtime.components.deadly_tiles` | `routine` | `components` | `rooted` | 3 | 262l/5874b | 30258-30519 | init_deadly_tiles_system, deadly_tiles_runtime_tile_is_deadly_nb, update_entity_deadly_flag_runtime, update_deadly_tiles_component, refresh_player_deadly_fastpath |
| `runtime.components.in_water_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 30525-30528 | update_in_water_component |
| `runtime.components.collectible_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/181b | 30534-30537 | update_collectible_component |
| `runtime.components.tile_interaction` | `routine` | `components` | `rooted` | 4 | 966l/21802b | 30538-31503 | interaction_target_variable_ptr_table, interaction_target_variable_word_table, init_tile_interaction_system, update_slash_component, record_bonus_respawn_slot, ... (+8) |
| `runtime.components.collected_tiles` | `routine` | `components` | `rooted` | 1 | 76l/3015b | 31504-31579 | apply_collected_tiles |
| `runtime.components.entity_management` | `routine` | `components` | `rooted` | 3 | 221l/6549b | 31580-31800 | create_entity, entity_job_set, entity_job_set_period_ok, entity_job_set_entry_wrap, entity_job_set_entry_ok, ... (+13) |
| `runtime.components.scheduler` | `routine` | `components` | `rooted` | 7 | 1299l/30456b | 31801-33099 | update_all_entities, mark_used_entity_list_dirty, ensure_used_entity_list_current, rebuild_used_entity_list, ensure_player_fast_runtime_bound, ... (+10) |
| `runtime.components.state_machine_executor` | `routine` | `components` | `rooted` | 2 | 74l/1973b | 33105-33178 | execute_all_state_machines, refresh_player_state_machine_fastpath |
| `runtime.components.legacy_tile_collision` | `routine` | `components` | `candidate_unreferenced` | 0 | 43l/1404b | 33188-33230 | get_tile_at_position, get_tile_behavior, tile_behavior_table, check_collision_at_point, check_collision_box, ... (+1) |
| `runtime.components.secret_zones` | `routine` | `components` | `rooted` | 1 | 258l/6746b | 33267-33524 | update_secret_zone_component, secret_zone_apply_current_rect, secret_zone_restore_current_rect, secret_zone_clear_state, secret_zone_compute_offset |
| `runtime.statemachine.core` | `routine` | `stateMachine` | `rooted` | 5 | 2311l/60794b | 33542-35852 | SM_Update, sm_timer_no_overflow, sm_update_done, SM_CheckTransitions, SM_CheckTransitions_Loop, ... (+43) |
| `data.statemachine.sound-tables` | `data` | `stateMachine` | `rooted` | 1 | 34l/1115b | 35942-35975 | SM_SoundPtrTable, SM_SoundAsset_0, SM_SoundAsset_0_Frames, SM_SoundAsset_1, SM_SoundAsset_1_Frames |
| `data.statemachine.statemachine_1771533517310` | `data` | `stateMachine` | `rooted` | 4 | 622l/20339b | 35976-36597 | SM_New_Statemachine_state_1771533526010, SM_New_Statemachine_state_1771533526010_OnEnter, SM_New_Statemachine_state_1771533526010_Transitions, SM_New_Statemachine_state_1771533526010_Transitions_Actions_2, SM_New_Statemachine_state_1771533526010_Transitions_Actions_3, ... (+43) |
| `data.statemachine.statemachine_1775000000009` | `data` | `stateMachine` | `rooted` | 2 | 36l/1733b | 36598-36633 | SM_Exit_Door_Gem_Gate_state_exit_hidden_1775000000012, SM_Exit_Door_Gem_Gate_state_exit_hidden_1775000000012_OnEnter, SM_Exit_Door_Gem_Gate_state_exit_hidden_1775000000012_Transitions, SM_Exit_Door_Gem_Gate_state_exit_open_1775000000013, SM_Exit_Door_Gem_Gate_state_exit_open_1775000000013_OnEnter |
| `runtime.gameflow.text_screen` | `routine` | `gameflow` | `rooted` | 2 | 160l/4353b | 36794-36953 | show_text_screen, wait_for_fire |
| `runtime.gameflow.submenu` | `routine` | `gameflow` | `rooted` | 1 | 1006l/24317b | 36988-37993 | show_menu_placeholder, render_submenu_screen, submenu_calc_vram_addr, submenu_string_length, submenu_compute_center_col, ... (+11) |
| `runtime.gameflow.presentation_wait_frames` | `routine` | `gameflow` | `candidate_unreferenced` | 0 | 13l/318b | 38021-38033 | gameflow_presentation_wait_frames |
| `runtime.gameflow.worldlink` | `routine` | `gameflow` | `rooted` | 1 | 95l/2642b | 38082-38176 | gameflow_handle_worldlink |
| `runtime.gameflow.if_then_else` | `routine` | `gameflow` | `rooted` | 1 | 138l/2748b | 38178-38315 | gameflow_handle_ifthenelse |
| `runtime.gameflow.connection_by_type` | `routine` | `gameflow` | `referenced` | 3 | 37l/701b | 38385-38421 | gameflow_get_connection_by_type |
| `runtime.gameflow.confirm_input_direct` | `routine` | `gameflow` | `referenced` | 4 | 12l/298b | 38446-38457 | gameflow_read_confirm_direct |
| `runtime.gameflow.world_loop` | `routine` | `gameflow` | `rooted` | 1 | 85l/2780b | 38465-38549 | gameflow_world_game_loop |
| `runtime.gameflow.screen_timer` | `routine` | `gameflow` | `rooted` | 1 | 144l/3220b | 38556-38699 | get_world_screen_timer_frames_per_second, reload_world_screen_timer_frames, snapshot_world_screen_timer_interrupt_counter, reset_world_screen_timer, update_world_screen_timer |
| `runtime.gameflow.clear_screen_area_helpers` | `routine` | `gameflow` | `referenced` | 2 | 60l/1737b | 39034-39093 | clear_screen_area, clear_screen_row, empty_row_data |
| `runtime.screens.presentation_wait_frames` | `routine` | `screens` | `candidate_unreferenced` | 0 | 13l/298b | 43671-43683 | presentation_wait_frames |
| `runtime.screens.colors` | `routine` | `screens` | `rooted` | 1 | 44l/1514b | 43820-43863 | color_shift_table, set_screen_colors |
| `runtime.screens.copy_rect` | `routine` | `screens` | `rooted` | 4 | 77l/1494b | 43957-44033 | copy_layout_rect_to_vram, copy_layout_rect_ram_to_ram |
| `runtime.screens.block_layout_expander` | `routine` | `screens` | `rooted` | 0 | 194l/3798b | 44035-44228 | expand_screen_block_layout_to_background, expand_screen_block_layout_2x2, expand_screen_block_layout_4x4 |
| `runtime.screens.behavior_map_rebuild` | `routine` | `screens` | `candidate_unreferenced` | 0 | 26l/709b | 44246-44271 | build_runtime_behavior_map_from_screen_layout |
| `runtime.screens.load_screen_stub` | `routine` | `screens` | `candidate_unreferenced` | 0 | 6l/232b | 44272-44277 | load_screen |
| `runtime.screens.load_screen_pan1_770754008863.loader` | `routine` | `screens` | `rooted` | 1 | 115l/4357b | 44406-44520 | load_screen_pan1_770754008863, load_pan1_770754008863_boss_done |
| `runtime.screens.load_screen_pan2_771184738851.loader` | `routine` | `screens` | `rooted` | 1 | 115l/4356b | 44649-44763 | load_screen_pan2_771184738851, load_pan2_771184738851_boss_done |
| `runtime.screens.load_screen_background1_771482721894.loader` | `routine` | `screens` | `rooted` | 1 | 111l/4360b | 44765-44875 | load_screen_background1_771482721894, load_background1_771482721894_boss_done |
| `runtime.screens.load_screen_pan3_771880109228.loader` | `routine` | `screens` | `rooted` | 1 | 115l/4357b | 45004-45118 | load_screen_pan3_771880109228, load_pan3_771880109228_boss_done |
| `runtime.screens.load_screen_pan4_772291683578.loader` | `routine` | `screens` | `rooted` | 1 | 115l/4356b | 45247-45361 | load_screen_pan4_772291683578, load_pan4_772291683578_boss_done |
| `runtime.screens.load_screen_pan5_773321312901.loader` | `routine` | `screens` | `rooted` | 1 | 112l/4242b | 45363-45474 | load_screen_pan5_773321312901, load_pan5_773321312901_boss_done |
| `runtime.screens.load_screen_pan6_773382451315.loader` | `routine` | `screens` | `rooted` | 1 | 112l/4242b | 45476-45587 | load_screen_pan6_773382451315, load_pan6_773382451315_boss_done |
| `runtime.screens.load_screen_pan1_2_774194791624.loader` | `routine` | `screens` | `rooted` | 1 | 115l/4405b | 45716-45830 | load_screen_pan1_2_774194791624, load_pan1_2_774194791624_boss_done |
| `data.entities.hero_1.init` | `routine` | `entities` | `rooted` | 1 | 187l/5474b | 46073-46259 | init_hero_1 |
| `data.entities.pato_1.init` | `routine` | `entities` | `rooted` | 1 | 162l/4330b | 46278-46439 | init_pato_1 |
| `data.entities.exit_trigger.init` | `routine` | `entities` | `rooted` | 1 | 127l/3844b | 46489-46615 | init_exit_trigger |
| `data.entities.pato3.init` | `routine` | `entities` | `rooted` | 1 | 162l/4317b | 46634-46795 | init_pato3 |
| `data.entities.bola2.init` | `routine` | `entities` | `rooted` | 1 | 162l/4328b | 46845-47006 | init_bola2 |
| `data.entities.hero_2.init` | `routine` | `entities` | `rooted` | 1 | 187l/5479b | 47056-47242 | init_hero_2 |
| `runtime.entities.patrol_facing` | `routine` | `entities` | `rooted` | 3 | 88l/2125b | 47419-47506 | update_entity_patrol_facing |
| `runtime.sprites.show_sprite_legacy` | `routine` | `sprites` | `candidate_unreferenced` | 0 | 43l/981b | 48604-48646 | show_sprite |
| `runtime.worlds.worldmap_1770754170935.loader` | `routine` | `worlds` | `rooted` | 2 | 39l/1428b | 48848-48886 | load_world_worldmap_1770754170935 |
| `runtime.worlds.worldmap_1774194757416.loader` | `routine` | `worlds` | `rooted` | 1 | 39l/1425b | 48894-48932 | load_world_worldmap_1774194757416 |
| `runtime.worlds.current_screen_helpers` | `routine` | `worlds` | `candidate_unreferenced` | 0 | 23l/633b | 49802-49824 | get_current_world_id, get_current_screen_index, set_current_screen |
| `runtime.sound.init` | `routine` | `sound` | `rooted` | 1 | 22l/725b | 49922-49943 | init_sound_system |
| `runtime.sound.tick` | `routine` | `sound` | `rooted` | 1 | 17l/320b | 49950-49966 | task_audio_tick |
| `runtime.sound.psg_lowlevel` | `routine` | `sound` | `rooted` | 27 | 117l/3450b | 49971-50087 | psg_write, psg_set_tone, psg_set_volume, psg_set_noise, psg_set_mixer, ... (+1) |
| `runtime.sound.sfx_silence` | `routine` | `sound` | `referenced` | 2 | 21l/579b | 50097-50117 | sfx_silence_all |
| `runtime.sound.sfx_builtin_effects` | `routine` | `sound` | `referenced` | 6 | 127l/3025b | 50123-50249 | sfx_beep, sfx_jump, sfx_shoot, sfx_explosion, sfx_coin, ... (+1) |
| ... | ... | ... | ... | ... | ... | ... | +8 more blocks |

## Dead-Block Candidates

- `runtime.components.legacy_tile_collision`: 43 lines / 1404 bytes. No external references found for any global label in this block.
- `runtime.menus.gfn_1773429482585`: 40 lines / 1021 bytes. No external references found for any global label in this block.
- `runtime.sprites.show_sprite_legacy`: 43 lines / 981 bytes. No external references found for any global label in this block.
- `runtime.components.input_trigger_level`: 33 lines / 773 bytes. No external references found for any global label in this block.
- `runtime.screens.behavior_map_rebuild`: 26 lines / 709 bytes. No external references found for any global label in this block.
- `runtime.worlds.current_screen_helpers`: 23 lines / 633 bytes. No external references found for any global label in this block.
- `runtime.sound.resident.tick`: 18 lines / 606 bytes. No external references found for any global label in this block.
- `runtime.gameflow.presentation_wait_frames`: 13 lines / 318 bytes. No external references found for any global label in this block.
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

## ROM Validation

- Original ROM bytes: 180224
- Optimized ROM bytes: 180224
- ROM byte delta: 0
- ROM SHA256 equal: False

## dead-blocks

- Metrics: findings=21, patchable=21, removed_lines=311, removed_source_bytes=9051
- Routines: runtime.components.auto_control_script_stubs, runtime.components.auto_destroy_stub, runtime.components.behavior_stub, runtime.components.carry_stub, runtime.components.collectible_stub, runtime.components.damage_stub, runtime.components.in_water_stub, runtime.components.input_trigger_level, runtime.components.legacy_tile_collision, runtime.components.movement_stub, runtime.components.platform_riding_stub, runtime.components.retractable_gate_stub, runtime.components.shoot_stub, runtime.gameflow.presentation_wait_frames, runtime.menus.gfn_1773429482585, runtime.screens.behavior_map_rebuild, runtime.screens.load_screen_stub, runtime.screens.presentation_wait_frames, runtime.sound.resident.tick, runtime.sprites.show_sprite_legacy, runtime.worlds.current_screen_helpers

- [patchable] `runtime.components.input_trigger_level` lines 24033-24065: Block `runtime.components.input_trigger_level` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: component_trigger_level_pressed_a.
- [patchable] `runtime.sound.resident.tick` lines 26099-26116: Block `runtime.sound.resident.tick` (routine/sound) is a dead-code candidate. No external references found for any global label in this block. Labels: call_task_audio_tick_resident.
- [patchable] `runtime.components.movement_stub` lines 27138-27141: Block `runtime.components.movement_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_movement_component.
- [patchable] `runtime.components.behavior_stub` lines 28400-28403: Block `runtime.components.behavior_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_behavior_component.
- [patchable] `runtime.components.auto_destroy_stub` lines 29308-29314: Block `runtime.components.auto_destroy_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: init_auto_destroy_system, update_auto_destroy_component.
- [patchable] `runtime.components.retractable_gate_stub` lines 29350-29353: Block `runtime.components.retractable_gate_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_retractable_gate_component.
- [patchable] `runtime.components.carry_stub` lines 29359-29362: Block `runtime.components.carry_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_carry_component.
- [patchable] `runtime.components.auto_control_script_stubs` lines 29368-29374: Block `runtime.components.auto_control_script_stubs` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_auto_control_script_component, update_auto_event_string_component.
- [patchable] `runtime.components.damage_stub` lines 29380-29383: Block `runtime.components.damage_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_damage_component.
- [patchable] `runtime.components.shoot_stub` lines 29389-29392: Block `runtime.components.shoot_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_shoot_component.
- [patchable] `runtime.components.platform_riding_stub` lines 29412-29418: Block `runtime.components.platform_riding_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: prepare_platform_detection, update_platform_riding.
- [patchable] `runtime.components.in_water_stub` lines 30525-30528: Block `runtime.components.in_water_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_in_water_component.
- [patchable] `runtime.components.collectible_stub` lines 30534-30537: Block `runtime.components.collectible_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_collectible_component.
- [patchable] `runtime.components.legacy_tile_collision` lines 33188-33230: Block `runtime.components.legacy_tile_collision` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: get_tile_at_position, get_tile_behavior, tile_behavior_table, check_collision_at_point, check_collision_box, ... (+1).
- [patchable] `runtime.gameflow.presentation_wait_frames` lines 38021-38033: Block `runtime.gameflow.presentation_wait_frames` (routine/gameflow) is a dead-code candidate. No external references found for any global label in this block. Labels: gameflow_presentation_wait_frames.
- [patchable] `runtime.screens.presentation_wait_frames` lines 43671-43683: Block `runtime.screens.presentation_wait_frames` (routine/screens) is a dead-code candidate. No external references found for any global label in this block. Labels: presentation_wait_frames.
- [patchable] `runtime.screens.behavior_map_rebuild` lines 44246-44271: Block `runtime.screens.behavior_map_rebuild` (routine/screens) is a dead-code candidate. No external references found for any global label in this block. Labels: build_runtime_behavior_map_from_screen_layout.
- [patchable] `runtime.screens.load_screen_stub` lines 44272-44277: Block `runtime.screens.load_screen_stub` (routine/screens) is a dead-code candidate. No external references found for any global label in this block. Labels: load_screen.
- [patchable] `runtime.sprites.show_sprite_legacy` lines 48604-48646: Block `runtime.sprites.show_sprite_legacy` (routine/sprites) is a dead-code candidate. No external references found for any global label in this block. Labels: show_sprite.
- [patchable] `runtime.worlds.current_screen_helpers` lines 49802-49824: Block `runtime.worlds.current_screen_helpers` (routine/worlds) is a dead-code candidate. No external references found for any global label in this block. Labels: get_current_world_id, get_current_screen_index, set_current_screen.
- [patchable] `runtime.menus.gfn_1773429482585` lines 53911-53950: Block `runtime.menus.gfn_1773429482585` (routine/menus) is a dead-code candidate. No external references found for any global label in this block. Labels: show_menu_gfn_1773429482585, menu_gfn_1773429482585_title, handle_menu_gfn_1773429482585.

## unused-screen-loaders

- Metrics: findings=2, patchable=2, removed_lines=128, removed_source_bytes=4785
- Routines: load_screen_background1_771482721894_far, runtime.screens.load_screen_background1_771482721894.loader

- [patchable] `load_screen_background1_771482721894_far` lines 24837-24854: `load_screen_background1_771482721894_far` is a generated screen loader (18 lines, 426 source bytes) with no external label references. Category reason: Generated screen loader routine. Project metadata maps it to scene `background1` (index=2, resources=8). GameFlow reachability marks this scene unreachable. Related annotated loader block `runtime.screens.load_screen_background1_771482721894.loader` is currently rooted by `load_screen_background1_771482721894`. Deletion is patchable only when GameFlow reachability proves the scene is unreachable.
- [patchable] `runtime.screens.load_screen_background1_771482721894.loader` lines 44765-44875: Annotated loader block `runtime.screens.load_screen_background1_771482721894.loader` only feeds `load_screen_background1_771482721894_far`, and GameFlow reachability marks the owning scene unreachable.

## inactive-feature-runtime

- Metrics: findings=43, patchable=0, removed_lines=0, removed_source_bytes=0
- Routines: boss_apply_behavior_form, boss_attack_get_sprite_pattern, boss_current_shape_covers_draw_cell, boss_draw_behavior_attack, boss_draw_write_cell, boss_falling_blocks_hide_all, boss_get_active_tile_char, boss_get_runtime_layout_char, boss_init_behavior_state, boss_load_current_behavior_action, boss_prepare_behavior_move_timing, boss_projectile_hide_all, boss_projectile_show_current, boss_resolve_behavior_target, boss_resolve_initial_phase, boss_slam_rocks_hide_all, boss_step_towards_behavior_target, boss_tick_behavior_move_step, call_draw_boss_attack_resident, call_draw_boss_bomb_attack_resident, call_draw_boss_boomerang_attack_resident, call_draw_boss_homing_missile_attack_resident, call_draw_boss_laser_attack_resident, call_draw_boss_meteor_attack_resident, call_draw_boss_rock_attack_resident, call_draw_boss_sine_wave_attack_resident, call_init_boss_system_resident, call_init_screen_boss_from_current_screen_resident, call_update_boss_system_resident, draw_boss_attack, draw_boss_attack_far, draw_boss_projectile_attack, handle_menu_gfn_1773429482585, init_boss_system, init_boss_system_far, init_screen_boss_from_current_screen, init_screen_boss_from_current_screen_far, show_menu_gfn_1773429482585, show_menu_placeholder, update_boss_behavior, update_boss_projectile_runtime, update_boss_system, update_boss_system_far

- [report-only] `init_boss_system_far` lines 25636-25653: `init_boss_system_far` looks like bosses runtime (18 lines, 347 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: boot_or_init (Boot/init routine). External references still exist (2): call_init_boss_system_resident@26256, init_game_systems@26385. Deletion must stay blocked until callers are proven dead or rewired. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `init_screen_boss_from_current_screen_far` lines 25654-25671: `init_screen_boss_from_current_screen_far` looks like bosses runtime (18 lines, 427 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: boot_or_init (Boot/init routine). External references still exist (1): call_init_screen_boss_from_current_screen_resident@26259. Deletion must stay blocked until callers are proven dead or rewired. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `update_boss_system_far` lines 25672-25689: `update_boss_system_far` looks like bosses runtime (18 lines, 355 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_update_boss_system_resident@26262. Deletion must stay blocked until callers are proven dead or rewired. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `draw_boss_attack_far` lines 25690-25710: `draw_boss_attack_far` looks like bosses runtime (21 lines, 420 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_draw_boss_attack_resident@26265. Deletion must stay blocked until callers are proven dead or rewired. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_init_boss_system_resident` lines 26255-26257: `call_init_boss_system_resident` looks like bosses runtime (3 lines, 61 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_init_screen_boss_from_current_screen_resident` lines 26258-26260: `call_init_screen_boss_from_current_screen_resident` looks like bosses runtime (3 lines, 101 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (8): load_pan1_770754008863_boss_done@44491, load_pan2_771184738851_boss_done@44734, load_background1_771482721894_boss_done@44847, load_pan3_771880109228_boss_done@45089, load_pan4_772291683578_boss_done@45332, ... (+3 more). Deletion must stay blocked until callers are proven dead or rewired. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_update_boss_system_resident` lines 26261-26263: `call_update_boss_system_resident` looks like bosses runtime (3 lines, 65 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): gameflow_world_game_loop@38516. Deletion must stay blocked until callers are proven dead or rewired. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_draw_boss_attack_resident` lines 26264-26266: `call_draw_boss_attack_resident` looks like bosses runtime (3 lines, 61 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_draw_boss_meteor_attack_resident` lines 26267-26269: `call_draw_boss_meteor_attack_resident` looks like bosses runtime (3 lines, 61 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_draw_boss_bomb_attack_resident` lines 26270-26272: `call_draw_boss_bomb_attack_resident` looks like bosses runtime (3 lines, 59 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_draw_boss_boomerang_attack_resident` lines 26273-26275: `call_draw_boss_boomerang_attack_resident` looks like bosses runtime (3 lines, 64 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_draw_boss_rock_attack_resident` lines 26276-26278: `call_draw_boss_rock_attack_resident` looks like bosses runtime (3 lines, 59 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_draw_boss_laser_attack_resident` lines 26279-26281: `call_draw_boss_laser_attack_resident` looks like bosses runtime (3 lines, 60 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_draw_boss_sine_wave_attack_resident` lines 26282-26284: `call_draw_boss_sine_wave_attack_resident` looks like bosses runtime (3 lines, 64 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_draw_boss_homing_missile_attack_resident` lines 26285-26287: `call_draw_boss_homing_missile_attack_resident` looks like bosses runtime (3 lines, 69 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `show_menu_placeholder` lines 36989-37106: `show_menu_placeholder` looks like menus runtime (118 lines, 2791 source bytes), but project_usage marks feature `menus` disabled (menus=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): gameflow_handle_submenu@36962. Deletion must stay blocked until callers are proven dead or rewired. Patch is not enabled yet for feature family `menus`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `init_boss_system` lines 50747-50759: `init_boss_system` looks like bosses runtime (13 lines, 289 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: boot_or_init (Boot/init routine). External references still exist (1): init_boss_system_far@25643. Deletion must stay blocked until callers are proven dead or rewired. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `update_boss_system` lines 50760-50846: `update_boss_system` looks like bosses runtime (87 lines, 3229 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): update_boss_system_far@25679. Deletion must stay blocked until callers are proven dead or rewired. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `init_screen_boss_from_current_screen` lines 50847-50917: `init_screen_boss_from_current_screen` looks like bosses runtime (71 lines, 1600 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: boot_or_init (Boot/init routine). External references still exist (1): init_screen_boss_from_current_screen_far@25661. Deletion must stay blocked until callers are proven dead or rewired. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_resolve_initial_phase` lines 50918-50952: `boss_resolve_initial_phase` looks like bosses runtime (35 lines, 778 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): init_screen_boss_from_current_screen@50904. Deletion must stay blocked until callers are proven dead or rewired. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_init_behavior_state` lines 50953-50978: `boss_init_behavior_state` looks like bosses runtime (26 lines, 648 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): init_screen_boss_from_current_screen@50905. Deletion must stay blocked until callers are proven dead or rewired. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_current_shape_covers_draw_cell` lines 51128-51182: `boss_current_shape_covers_draw_cell` looks like bosses runtime (55 lines, 1084 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): init_screen_boss_from_current_screen@51102. Deletion must stay blocked until callers are proven dead or rewired. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_get_runtime_layout_char` lines 51183-51204: `boss_get_runtime_layout_char` looks like bosses runtime (22 lines, 474 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): init_screen_boss_from_current_screen@51104. Deletion must stay blocked until callers are proven dead or rewired. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_get_active_tile_char` lines 51205-51232: `boss_get_active_tile_char` looks like bosses runtime (28 lines, 577 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (2): init_screen_boss_from_current_screen@51009, init_screen_boss_from_current_screen@51171. Deletion must stay blocked until callers are proven dead or rewired. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_draw_write_cell` lines 51233-51256: `boss_draw_write_cell` looks like bosses runtime (24 lines, 490 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (2): init_screen_boss_from_current_screen@51029, init_screen_boss_from_current_screen@51106. Deletion must stay blocked until callers are proven dead or rewired. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `update_boss_behavior` lines 51257-51330: `update_boss_behavior` looks like bosses runtime (74 lines, 1468 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_load_current_behavior_action` lines 51331-51389: `boss_load_current_behavior_action` looks like bosses runtime (59 lines, 1495 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): update_boss_behavior@51264. Deletion must stay blocked until callers are proven dead or rewired. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_apply_behavior_form` lines 51390-51431: `boss_apply_behavior_form` looks like bosses runtime (42 lines, 847 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): update_boss_behavior@51380. Deletion must stay blocked until callers are proven dead or rewired. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_prepare_behavior_move_timing` lines 51432-51499: `boss_prepare_behavior_move_timing` looks like bosses runtime (68 lines, 1386 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): update_boss_behavior@51378. Deletion must stay blocked until callers are proven dead or rewired. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_tick_behavior_move_step` lines 51500-51524: `boss_tick_behavior_move_step` looks like bosses runtime (25 lines, 555 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): update_boss_behavior@51276. Deletion must stay blocked until callers are proven dead or rewired. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_resolve_behavior_target` lines 51525-51566: `boss_resolve_behavior_target` looks like bosses runtime (42 lines, 967 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): update_boss_behavior@51433. Deletion must stay blocked until callers are proven dead or rewired. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_step_towards_behavior_target` lines 51567-51608: `boss_step_towards_behavior_target` looks like bosses runtime (42 lines, 773 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): update_boss_behavior@51278. Deletion must stay blocked until callers are proven dead or rewired. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_draw_behavior_attack` lines 51609-51612: `boss_draw_behavior_attack` looks like bosses runtime (4 lines, 37 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_attack_get_sprite_pattern` lines 51613-51615: `boss_attack_get_sprite_pattern` looks like bosses runtime (3 lines, 41 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: data (Asset/data table naming). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `draw_boss_attack` lines 51616-51619: `draw_boss_attack` looks like bosses runtime (4 lines, 28 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): update_boss_system_far@25697. Deletion must stay blocked until callers are proven dead or rewired. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `draw_boss_projectile_attack` lines 51620-51622: `draw_boss_projectile_attack` looks like bosses runtime (3 lines, 38 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `update_boss_projectile_runtime` lines 51623-51625: `update_boss_projectile_runtime` looks like bosses runtime (3 lines, 41 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_projectile_show_current` lines 51626-51628: `boss_projectile_show_current` looks like bosses runtime (3 lines, 39 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_projectile_hide_all` lines 51629-51632: `boss_projectile_hide_all` looks like bosses runtime (4 lines, 36 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_slam_rocks_hide_all` lines 51633-51636: `boss_slam_rocks_hide_all` looks like bosses runtime (4 lines, 36 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_falling_blocks_hide_all` lines 51637-51643: `boss_falling_blocks_hide_all` looks like bosses runtime (7 lines, 132 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Patch is not enabled yet for feature family `bosses`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `show_menu_gfn_1773429482585` lines 53912-53941: `show_menu_gfn_1773429482585` looks like menus runtime (30 lines, 686 source bytes), but project_usage marks feature `menus` disabled (menus=0). Category: runtime_code (Instruction-bearing runtime label). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Patch is not enabled yet for feature family `menus`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `handle_menu_gfn_1773429482585` lines 53945-53957: `handle_menu_gfn_1773429482585` looks like menus runtime (13 lines, 400 source bytes), but project_usage marks feature `menus` disabled (menus=0). Category: runtime_code (Instruction-bearing runtime label). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Patch is not enabled yet for feature family `menus`. This is report-only until the generator metadata and invariants prove deletion is safe.

## Optimization Passes

- Pass 1: findings=66, patchable=23, removed=439 lines / 13836 bytes, lines=53961->53522
- Pass 2: findings=41, patchable=0, removed=0 lines / 0 bytes, lines=53522->53522

