# Post-ASM Report

- Input: `C:\Users\salam\Documents\Programacion\Mideas\server\temp\patoantic249_backend_route_matrix_1778219335233_140640.post_asm_input.asm`
- Findings: 69
- Applied patches: 23
- Original lines: 50902
- Output lines: 50463
- Net line delta: -439

- Optimization passes run: 2
- Optimization source removed: 439 lines / 13836 bytes

## Mideas Block Inventory

- Blocks: 108
- Preserved blocks: 8
- Removable-by-policy blocks: 100
- Dead-block candidates: 21
- Annotated block source: 18879 lines / 525511 bytes
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
| `runtime.components.scheduler` | `rooted` | 1318l/31213b | `routine` | `components` |
| `runtime.gameflow.submenu` | `rooted` | 1006l/24317b | `routine` | `gameflow` |
| `runtime.components.tile_interaction` | `rooted` | 966l/21802b | `routine` | `components` |
| `data.statemachine.statemachine_1771533517310` | `rooted` | 622l/20339b | `data` | `stateMachine` |
| `runtime.animtiles.core` | `rooted` | 540l/20056b | `routine` | `animtiles` |
| `runtime.boss.core` | `rooted` | 866l/19482b | `routine` | `bosses` |
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

## Inactive Feature Runtime Inventory

| Feature | Findings | Patchable | Annotated | Unannotated | Preserved | Owners |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `bosses` | 43 | 0 | 27 | 16 | 0 | bosses=27 |
| `menus` | 3 | 0 | 3 | 0 | 0 | gameflow=1, menus=2 |

## Global Label Inventory

- Global labels: 1109

| Label | Category | Source |
| --- | --- | --- |
| `FAST_SNSMAT` | `bios_helper` | 1077l/65052b |
| `update_wallcollision_component` | `runtime_code` | 538l/20410b |
| `FAR_BANK_14_ROM_START` | `bank_marker` | 310l/15187b |
| `Action_ChangeSprite` | `runtime_code` | 321l/14617b |
| `update_player_fastpath` | `runtime_code` | 604l/13839b |
| `resource_table` | `data` | 823l/12168b |
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
| `update_slash_component` | `runtime_code` | 301l/6121b |
| `anim_group_2_new_tile` | `data` | 71l/5671b |
| `init_hero_2` | `boot_or_init` | 187l/5389b |
| `init_hero_1` | `boot_or_init` | 187l/5384b |
| `task_update_input` | `shared_runtime` | 200l/5024b |
| `render_hud` | `runtime_code` | 174l/4762b |
| `jump_update_loop` | `runtime_code` | 157l/4675b |
| `render_submenu_screen` | `runtime_code` | 162l/4665b |
| `rebuild_used_entity_list` | `runtime_code` | 207l/4475b |
| `Action_SetCompProp` | `runtime_code` | 242l/4370b |
| `init_pato_1` | `boot_or_init` | 162l/4240b |

### Largest Unannotated Global Labels

- Unannotated labels: 579

| Category | Labels | Source |
| --- | ---: | ---: |
| `bank_marker` | 30 | 1267l/56236b |
| `bios_helper` | 9 | 1678l/83341b |
| `boot_or_init` | 33 | 838l/21970b |
| `data` | 273 | 4483l/159207b |
| `far_trampoline` | 82 | 977l/20420b |
| `runtime_code` | 112 | 1993l/58517b |
| `runtime_inner_label` | 30 | 586l/16681b |
| `screen_loader` | 8 | 144l/3220b |
| `shared_runtime` | 2 | 31l/1113b |

| Label | Category | Source |
| --- | --- | --- |
| `FAST_SNSMAT` | `bios_helper` | 1077l/65052b |
| `FAR_BANK_14_ROM_START` | `bank_marker` | 310l/15187b |
| `resource_table` | `data` | 823l/12168b |
| `load_sprite_patterns_worldmap_1770754170935` | `data` | 222l/9051b |
| `BANK_2_USED_END` | `bank_marker` | 163l/8223b |
| `BANK_0_USED_END` | `bank_marker` | 141l/7650b |
| `load_sprite_patterns_worldmap_1774194757416` | `data` | 170l/6931b |
| `PRESENTATION_SCREEN_COLORS_B1` | `data` | 100l/6866b |
| `vdpLoop` | `bios_helper` | 192l/6712b |
| `pt3_track_0_data` | `data` | 101l/6709b |
| `PRESENTATION_SCREEN_PATTERNS_B1` | `data` | 97l/6681b |
| `screen_runtime_summary_table` | `data` | 138l/6188b |
| `FAR_BANK_11_ROM_START` | `bank_marker` | 98l/3568b |
| `PRESENTATION_SCREEN_NAMETBL` | `data` | 52l/3486b |
| `FAR_BANK_13_ROM_START` | `bank_marker` | 79l/3182b |
| `PRESENTATION_SCREEN_PATTERNS_B0` | `data` | 47l/3099b |
| `PRESENTATION_SCREEN_COLORS_B0` | `data` | 47l/3095b |
| `FONT_PATTERN_DATA` | `data` | 94l/3035b |
| `tilebank_pattern_data_0` | `data` | 41l/2764b |
| `tile_pattern_bank0` | `data` | 41l/2759b |
| `init_char0_color` | `boot_or_init` | 95l/2487b |
| `restart_rom_continue` | `boot_or_init` | 83l/2480b |
| `FAST_LDIRVM` | `bios_helper` | 73l/2463b |
| `FAR_BANK_10_ROM_START` | `bank_marker` | 68l/2255b |
| `PRESENTATION_SCREEN_PATTERNS_B2` | `data` | 35l/2247b |
| `PRESENTATION_SCREEN_COLORS_B2` | `data` | 34l/2242b |
| `init_entities` | `boot_or_init` | 96l/2145b |
| `init_interrupt_system` | `boot_or_init` | 63l/2073b |
| `hud_imported_frame_pan1_2_774194791624_data` | `data` | 99l/1926b |
| `hud_imported_frame_pan4_772291683578_data` | `data` | 99l/1922b |

| ID | Kind | Owner | Status | Incoming | Source | Lines | Labels |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `runtime.mapper.core` | `routine` | `mapper` | `rooted` | 182 | 213l/5412b | 21505-21717 | mapper_runtime_init, mapper_set_bank_p1, mapper_set_bank_p2, mapper_set_bank_p3, mapper_set_bank_p4, ... (+14) |
| `runtime.resources.manager` | `routine` | `resources` | `rooted` | 190 | 680l/17743b | 22749-23428 | resource_manager_init, resource_invalidate_pattern_vram_cache, resource_invalidate_color_vram_cache, resource_invalidate_font_vram_cache, resource_invalidate_gameplay_vram_cache, ... (+14) |
| `runtime.components.input_trigger_level` | `routine` | `components` | `candidate_unreferenced` | 0 | 33l/773b | 23510-23542 | component_trigger_level_pressed_a |
| `runtime.page0.stubs` | `routine` | `unified` | `rooted` | 1 | 22l/505b | 23549-23570 | init_page0_runtime_state, page0_map_expanded_slot, page0_map_game_rom, page0_restore_bios_rom, page0_copy_chunk_to_buffer, ... (+2) |
| `runtime.interrupt.stop` | `routine` | `interrupt` | `rooted` | 0 | 43l/1299b | 23649-23691 | stop_interrupt_system |
| `runtime.interrupt.dispatcher` | `routine` | `interrupt` | `preserved` | 1 | 124l/4150b | 23693-23816 | interrupt_dispatcher |
| `runtime.interrupt.vblank_flag` | `routine` | `interrupt` | `rooted` | 1 | 35l/983b | 23829-23863 | update_vblank_flag |
| `runtime.interrupt.task_api` | `routine` | `interrupt` | `rooted` | 2 | 121l/3195b | 23868-23988 | enable_task, disable_task, get_frame_count |
| `runtime.interrupt.task_input` | `routine` | `interrupt` | `rooted` | 2 | 231l/6052b | 23992-24222 | init_default_tasks_from_plan, task_update_input |
| `runtime.far_trampoline.init_sound_system_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/526b | 24932-24950 | init_sound_system_far |
| `runtime.far_trampoline.task_audio_tick_far` | `trampoline` | `far-call` | `preserved` | 0 | 19l/514b | 24952-24970 | task_audio_tick_far |
| `runtime.far_trampoline.sfx_update_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/484b | 24972-24990 | sfx_update_far |
| `runtime.far_trampoline.music_update_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/496b | 24992-25010 | music_update_far |
| `runtime.far_trampoline.music_stop_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/484b | 25012-25030 | music_stop_far |
| `runtime.far_trampoline.music_play_track_far` | `trampoline` | `far-call` | `preserved` | 1 | 21l/557b | 25032-25052 | music_play_track_far |
| `runtime.far_trampoline.music_execute_command_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/550b | 25054-25072 | music_execute_command_far |
| `runtime.sound.resident.init` | `routine` | `sound` | `referenced` | 1 | 4l/184b | 25574-25577 | call_init_sound_system_resident |
| `runtime.sound.resident.tick` | `routine` | `sound` | `candidate_unreferenced` | 0 | 18l/606b | 25579-25596 | call_task_audio_tick_resident |
| `runtime.sound.resident.music_update` | `routine` | `sound` | `referenced` | 3 | 4l/190b | 25598-25601 | call_music_update_resident |
| `runtime.sound.resident.sfx_update` | `routine` | `sound` | `referenced` | 1 | 4l/182b | 25603-25606 | call_sfx_update_resident |
| `runtime.sound.resident.music_stop` | `routine` | `sound` | `referenced` | 1 | 4l/182b | 25608-25611 | call_music_stop_resident |
| `runtime.sound.resident.music_play_track` | `routine` | `sound` | `referenced` | 2 | 4l/206b | 25613-25616 | call_music_play_track_resident |
| `runtime.sound.resident.music_execute_command` | `routine` | `sound` | `referenced` | 1 | 4l/226b | 25618-25621 | call_music_execute_command_resident |
| `runtime.components.init` | `routine` | `components` | `rooted` | 11 | 82l/2818b | 26029-26110 | component_fill_32_a, init_components |
| `runtime.components.position` | `routine` | `components` | `rooted` | 3 | 108l/3281b | 26112-26219 | init_position_system, update_position_component, position_update_loop, position_next_entity |
| `runtime.components.sprite` | `routine` | `components` | `rooted` | 6 | 396l/10316b | 26220-26615 | init_sprite_system, update_sprite_component, sprite_update_loop, sprite_layer_loop, sprite_continue, ... (+6) |
| `runtime.components.movement_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 26621-26624 | update_movement_component |
| `runtime.components.collision` | `routine` | `components` | `referenced` | 2 | 668l/18861b | 26625-27292 | init_collision_system, update_collision_component, collision_update_loop, collision_next_entity, update_entity_collision_fast, ... (+13) |
| `runtime.components.behavior_tile` | `routine` | `components` | `rooted` | 17 | 110l/3809b | 27293-27402 | get_behavior_tile, get_behavior_tile_nb, gbt_oob |
| `runtime.components.directional_sprite_sync` | `routine` | `components` | `rooted` | 3 | 87l/2084b | 27403-27489 | component_sync_directional_sprite_from_initial, component_sync_directional_sprite_from_current, component_sync_directional_sprite_common |
| `runtime.components.input` | `routine` | `components` | `referenced` | 2 | 388l/12766b | 27490-27877 | init_input_system, update_input_component, input_update_loop, input_move_up, input_move_down, ... (+16) |
| `runtime.components.behavior_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 27883-27886 | update_behavior_component |
| `runtime.components.health` | `routine` | `components` | `rooted` | 2 | 152l/4701b | 27887-28038 | init_health_system, update_health_component, decrease_entity_lives, increase_entity_lives |
| `runtime.components.animation` | `routine` | `components` | `referenced` | 4 | 342l/10555b | 28039-28380 | init_animation_system, update_animation_component, anim_done_entity, refresh_player_animation_fastpath |
| `runtime.components.jump` | `routine` | `components` | `referenced` | 2 | 233l/7043b | 28381-28613 | init_jump_system, update_jump_component, jump_update_loop, jump_done_entity, jump_next_entity |
| `runtime.components.gravity` | `routine` | `components` | `rooted` | 2 | 137l/4553b | 28614-28750 | init_gravity_system, update_gravity_component, gravity_update_loop, gravity_store_vel, gravity_grounded, ... (+2) |
| `runtime.components.walljump_stub` | `routine` | `components` | `referenced` | 2 | 18l/326b | 28771-28788 | init_walljump_system, update_walljump_component, walljump_process_entity_c, walljump_input_is_left, walljump_input_is_right |
| `runtime.components.auto_destroy_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/219b | 28791-28797 | init_auto_destroy_system, update_auto_destroy_component |
| `runtime.components.state_machine_component_stub` | `routine` | `components` | `referenced` | 1 | 7l/241b | 28821-28827 | init_statemachine_system, update_statemachine_component |
| `runtime.components.retractable_gate_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/196b | 28833-28836 | update_retractable_gate_component |
| `runtime.components.carry_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/163b | 28842-28845 | update_carry_component |
| `runtime.components.auto_control_script_stubs` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/252b | 28851-28857 | update_auto_control_script_component, update_auto_event_string_component |
| `runtime.components.damage_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/166b | 28863-28866 | update_damage_component |
| `runtime.components.shoot_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/163b | 28872-28875 | update_shoot_component |
| `runtime.components.platform_riding_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/220b | 28895-28901 | prepare_platform_detection, update_platform_riding |
| `runtime.components.wallcollision` | `routine` | `components` | `referenced` | 11 | 839l/31288b | 28902-29740 | init_wallcollision_system, wall_behavior_is_full_blocker, wall_down_behavior_blocks, update_wallcollision_component, wall_build_hitbox_cache, ... (+2) |
| `runtime.components.deadly_tiles` | `routine` | `components` | `rooted` | 3 | 262l/5874b | 29741-30002 | init_deadly_tiles_system, deadly_tiles_runtime_tile_is_deadly_nb, update_entity_deadly_flag_runtime, update_deadly_tiles_component, refresh_player_deadly_fastpath |
| `runtime.components.in_water_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 30008-30011 | update_in_water_component |
| `runtime.components.collectible_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/181b | 30017-30020 | update_collectible_component |
| `runtime.components.tile_interaction` | `routine` | `components` | `rooted` | 4 | 966l/21802b | 30021-30986 | interaction_target_variable_ptr_table, interaction_target_variable_word_table, init_tile_interaction_system, update_slash_component, record_bonus_respawn_slot, ... (+8) |
| `runtime.components.collected_tiles` | `routine` | `components` | `rooted` | 1 | 76l/3015b | 30987-31062 | apply_collected_tiles |
| `runtime.components.entity_management` | `routine` | `components` | `rooted` | 3 | 221l/6549b | 31063-31283 | create_entity, entity_job_set, entity_job_set_period_ok, entity_job_set_entry_wrap, entity_job_set_entry_ok, ... (+13) |
| `runtime.components.scheduler` | `routine` | `components` | `rooted` | 7 | 1318l/31213b | 31284-32601 | update_all_entities, mark_used_entity_list_dirty, ensure_used_entity_list_current, rebuild_used_entity_list, ensure_player_fast_runtime_bound, ... (+11) |
| `runtime.components.state_machine_executor` | `routine` | `components` | `rooted` | 2 | 74l/1973b | 32607-32680 | execute_all_state_machines, refresh_player_state_machine_fastpath |
| `runtime.components.legacy_tile_collision` | `routine` | `components` | `candidate_unreferenced` | 0 | 43l/1404b | 32690-32732 | get_tile_at_position, get_tile_behavior, tile_behavior_table, check_collision_at_point, check_collision_box, ... (+1) |
| `runtime.components.secret_zones` | `routine` | `components` | `rooted` | 1 | 258l/6746b | 32769-33026 | update_secret_zone_component, secret_zone_apply_current_rect, secret_zone_restore_current_rect, secret_zone_clear_state, secret_zone_compute_offset |
| `runtime.statemachine.core` | `routine` | `stateMachine` | `rooted` | 5 | 2311l/60794b | 33034-35344 | SM_Update, sm_timer_no_overflow, sm_update_done, SM_CheckTransitions, SM_CheckTransitions_Loop, ... (+43) |
| `data.statemachine.sound-tables` | `data` | `stateMachine` | `rooted` | 1 | 34l/1115b | 35434-35467 | SM_SoundPtrTable, SM_SoundAsset_0, SM_SoundAsset_0_Frames, SM_SoundAsset_1, SM_SoundAsset_1_Frames |
| `data.statemachine.statemachine_1771533517310` | `data` | `stateMachine` | `rooted` | 4 | 622l/20339b | 35468-36089 | SM_New_Statemachine_state_1771533526010, SM_New_Statemachine_state_1771533526010_OnEnter, SM_New_Statemachine_state_1771533526010_Transitions, SM_New_Statemachine_state_1771533526010_Transitions_Actions_2, SM_New_Statemachine_state_1771533526010_Transitions_Actions_3, ... (+43) |
| `data.statemachine.statemachine_1775000000009` | `data` | `stateMachine` | `rooted` | 2 | 36l/1733b | 36090-36125 | SM_Exit_Door_Gem_Gate_state_exit_hidden_1775000000012, SM_Exit_Door_Gem_Gate_state_exit_hidden_1775000000012_OnEnter, SM_Exit_Door_Gem_Gate_state_exit_hidden_1775000000012_Transitions, SM_Exit_Door_Gem_Gate_state_exit_open_1775000000013, SM_Exit_Door_Gem_Gate_state_exit_open_1775000000013_OnEnter |
| `runtime.gameflow.text_screen` | `routine` | `gameflow` | `rooted` | 2 | 160l/4353b | 36286-36445 | show_text_screen, wait_for_fire |
| `runtime.gameflow.submenu` | `routine` | `gameflow` | `rooted` | 1 | 1006l/24317b | 36480-37485 | show_menu_placeholder, render_submenu_screen, submenu_calc_vram_addr, submenu_string_length, submenu_compute_center_col, ... (+11) |
| `runtime.gameflow.presentation_wait_frames` | `routine` | `gameflow` | `candidate_unreferenced` | 0 | 13l/318b | 37513-37525 | gameflow_presentation_wait_frames |
| `runtime.gameflow.worldlink` | `routine` | `gameflow` | `rooted` | 1 | 95l/2642b | 37574-37668 | gameflow_handle_worldlink |
| `runtime.gameflow.if_then_else` | `routine` | `gameflow` | `rooted` | 1 | 138l/2748b | 37670-37807 | gameflow_handle_ifthenelse |
| `runtime.gameflow.connection_by_type` | `routine` | `gameflow` | `referenced` | 3 | 37l/701b | 37877-37913 | gameflow_get_connection_by_type |
| `runtime.gameflow.confirm_input_direct` | `routine` | `gameflow` | `referenced` | 4 | 12l/298b | 37938-37949 | gameflow_read_confirm_direct |
| `runtime.gameflow.world_loop` | `routine` | `gameflow` | `rooted` | 1 | 85l/2780b | 37957-38041 | gameflow_world_game_loop |
| `runtime.gameflow.screen_timer` | `routine` | `gameflow` | `rooted` | 1 | 144l/3220b | 38048-38191 | get_world_screen_timer_frames_per_second, reload_world_screen_timer_frames, snapshot_world_screen_timer_interrupt_counter, reset_world_screen_timer, update_world_screen_timer |
| `runtime.gameflow.clear_screen_area_helpers` | `routine` | `gameflow` | `referenced` | 2 | 60l/1737b | 38526-38585 | clear_screen_area, clear_screen_row, empty_row_data |
| `runtime.screens.colors` | `routine` | `screens` | `rooted` | 1 | 44l/1514b | 40161-40204 | color_shift_table, set_screen_colors |
| `runtime.screens.copy_rect` | `routine` | `screens` | `rooted` | 4 | 77l/1494b | 40298-40374 | copy_layout_rect_to_vram, copy_layout_rect_ram_to_ram |
| `runtime.screens.block_layout_expander` | `routine` | `screens` | `rooted` | 0 | 194l/3798b | 40376-40569 | expand_screen_block_layout_to_background, expand_screen_block_layout_2x2, expand_screen_block_layout_4x4 |
| `runtime.screens.behavior_map_rebuild` | `routine` | `screens` | `candidate_unreferenced` | 0 | 26l/709b | 40587-40612 | build_runtime_behavior_map_from_screen_layout |
| `runtime.screens.load_screen_stub` | `routine` | `screens` | `candidate_unreferenced` | 0 | 6l/232b | 40613-40618 | load_screen |
| `runtime.screens.load_screen_pan1_770754008863.loader` | `routine` | `screens` | `rooted` | 1 | 115l/4357b | 40747-40861 | load_screen_pan1_770754008863, load_pan1_770754008863_boss_done |
| `runtime.screens.load_screen_pan2_771184738851.loader` | `routine` | `screens` | `rooted` | 1 | 115l/4356b | 40990-41104 | load_screen_pan2_771184738851, load_pan2_771184738851_boss_done |
| `runtime.screens.load_screen_background1_771482721894.loader` | `routine` | `screens` | `rooted` | 1 | 111l/4360b | 41106-41216 | load_screen_background1_771482721894, load_background1_771482721894_boss_done |
| `runtime.screens.load_screen_pan3_771880109228.loader` | `routine` | `screens` | `rooted` | 1 | 115l/4357b | 41345-41459 | load_screen_pan3_771880109228, load_pan3_771880109228_boss_done |
| `runtime.screens.load_screen_pan4_772291683578.loader` | `routine` | `screens` | `rooted` | 1 | 115l/4356b | 41588-41702 | load_screen_pan4_772291683578, load_pan4_772291683578_boss_done |
| `runtime.screens.load_screen_pan5_773321312901.loader` | `routine` | `screens` | `rooted` | 1 | 112l/4242b | 41704-41815 | load_screen_pan5_773321312901, load_pan5_773321312901_boss_done |
| `runtime.screens.load_screen_pan6_773382451315.loader` | `routine` | `screens` | `rooted` | 1 | 112l/4242b | 41817-41928 | load_screen_pan6_773382451315, load_pan6_773382451315_boss_done |
| `runtime.screens.load_screen_pan1_2_774194791624.loader` | `routine` | `screens` | `rooted` | 1 | 115l/4405b | 42057-42171 | load_screen_pan1_2_774194791624, load_pan1_2_774194791624_boss_done |
| `data.entities.hero_1.init` | `routine` | `entities` | `rooted` | 1 | 187l/5474b | 42414-42600 | init_hero_1 |
| `data.entities.pato_1.init` | `routine` | `entities` | `rooted` | 1 | 162l/4330b | 42619-42780 | init_pato_1 |
| `data.entities.exit_trigger.init` | `routine` | `entities` | `rooted` | 1 | 127l/3844b | 42830-42956 | init_exit_trigger |
| `data.entities.pato3.init` | `routine` | `entities` | `rooted` | 1 | 162l/4317b | 42975-43136 | init_pato3 |
| `data.entities.bola2.init` | `routine` | `entities` | `rooted` | 1 | 162l/4328b | 43186-43347 | init_bola2 |
| `data.entities.hero_2.init` | `routine` | `entities` | `rooted` | 1 | 187l/5479b | 43397-43583 | init_hero_2 |
| `runtime.entities.patrol_facing` | `routine` | `entities` | `rooted` | 3 | 88l/2125b | 43760-43847 | update_entity_patrol_facing |
| `runtime.sprites.show_sprite_legacy` | `routine` | `sprites` | `candidate_unreferenced` | 0 | 43l/981b | 44945-44987 | show_sprite |
| `runtime.worlds.worldmap_1770754170935.loader` | `routine` | `worlds` | `rooted` | 2 | 39l/1428b | 45189-45227 | load_world_worldmap_1770754170935 |
| `runtime.worlds.worldmap_1774194757416.loader` | `routine` | `worlds` | `rooted` | 1 | 39l/1425b | 45235-45273 | load_world_worldmap_1774194757416 |
| `runtime.worlds.current_screen_helpers` | `routine` | `worlds` | `candidate_unreferenced` | 0 | 23l/633b | 46143-46165 | get_current_world_id, get_current_screen_index, set_current_screen |
| `runtime.sound.init` | `routine` | `sound` | `rooted` | 1 | 22l/725b | 46263-46284 | init_sound_system |
| `runtime.sound.tick` | `routine` | `sound` | `rooted` | 1 | 17l/320b | 46291-46307 | task_audio_tick |
| `runtime.sound.psg_lowlevel` | `routine` | `sound` | `rooted` | 27 | 117l/3450b | 46312-46428 | psg_write, psg_set_tone, psg_set_volume, psg_set_noise, psg_set_mixer, ... (+1) |
| `runtime.sound.sfx_silence` | `routine` | `sound` | `referenced` | 2 | 21l/579b | 46438-46458 | sfx_silence_all |
| `runtime.sound.sfx_builtin_effects` | `routine` | `sound` | `referenced` | 6 | 127l/3025b | 46464-46590 | sfx_beep, sfx_jump, sfx_shoot, sfx_explosion, sfx_coin, ... (+1) |
| `runtime.sound.sfx_playback` | `routine` | `sound` | `referenced` | 1 | 119l/2384b | 46608-46726 | play_sound_effect, play_sound_effect_beep, play_sound_effect_jump, play_sound_effect_shoot, play_sound_effect_explosion, ... (+4) |
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

- Original ROM bytes: 188416
- Optimized ROM bytes: 188416
- ROM byte delta: 0
- ROM SHA256 equal: False

## dead-blocks

- Metrics: findings=21, patchable=21, removed_lines=311, removed_source_bytes=9051
- Routines: runtime.components.auto_control_script_stubs, runtime.components.auto_destroy_stub, runtime.components.behavior_stub, runtime.components.carry_stub, runtime.components.collectible_stub, runtime.components.damage_stub, runtime.components.in_water_stub, runtime.components.input_trigger_level, runtime.components.legacy_tile_collision, runtime.components.movement_stub, runtime.components.platform_riding_stub, runtime.components.retractable_gate_stub, runtime.components.shoot_stub, runtime.gameflow.presentation_wait_frames, runtime.menus.gfn_1773429482585, runtime.screens.behavior_map_rebuild, runtime.screens.load_screen_stub, runtime.screens.presentation_wait_frames, runtime.sound.resident.tick, runtime.sprites.show_sprite_legacy, runtime.worlds.current_screen_helpers

- [patchable] `runtime.components.input_trigger_level` lines 23510-23542: Block `runtime.components.input_trigger_level` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: component_trigger_level_pressed_a.
- [patchable] `runtime.sound.resident.tick` lines 25579-25596: Block `runtime.sound.resident.tick` (routine/sound) is a dead-code candidate. No external references found for any global label in this block. Labels: call_task_audio_tick_resident.
- [patchable] `runtime.components.movement_stub` lines 26621-26624: Block `runtime.components.movement_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_movement_component.
- [patchable] `runtime.components.behavior_stub` lines 27883-27886: Block `runtime.components.behavior_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_behavior_component.
- [patchable] `runtime.components.auto_destroy_stub` lines 28791-28797: Block `runtime.components.auto_destroy_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: init_auto_destroy_system, update_auto_destroy_component.
- [patchable] `runtime.components.retractable_gate_stub` lines 28833-28836: Block `runtime.components.retractable_gate_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_retractable_gate_component.
- [patchable] `runtime.components.carry_stub` lines 28842-28845: Block `runtime.components.carry_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_carry_component.
- [patchable] `runtime.components.auto_control_script_stubs` lines 28851-28857: Block `runtime.components.auto_control_script_stubs` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_auto_control_script_component, update_auto_event_string_component.
- [patchable] `runtime.components.damage_stub` lines 28863-28866: Block `runtime.components.damage_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_damage_component.
- [patchable] `runtime.components.shoot_stub` lines 28872-28875: Block `runtime.components.shoot_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_shoot_component.
- [patchable] `runtime.components.platform_riding_stub` lines 28895-28901: Block `runtime.components.platform_riding_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: prepare_platform_detection, update_platform_riding.
- [patchable] `runtime.components.in_water_stub` lines 30008-30011: Block `runtime.components.in_water_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_in_water_component.
- [patchable] `runtime.components.collectible_stub` lines 30017-30020: Block `runtime.components.collectible_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_collectible_component.
- [patchable] `runtime.components.legacy_tile_collision` lines 32690-32732: Block `runtime.components.legacy_tile_collision` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: get_tile_at_position, get_tile_behavior, tile_behavior_table, check_collision_at_point, check_collision_box, ... (+1).
- [patchable] `runtime.gameflow.presentation_wait_frames` lines 37513-37525: Block `runtime.gameflow.presentation_wait_frames` (routine/gameflow) is a dead-code candidate. No external references found for any global label in this block. Labels: gameflow_presentation_wait_frames.
- [patchable] `runtime.screens.behavior_map_rebuild` lines 40587-40612: Block `runtime.screens.behavior_map_rebuild` (routine/screens) is a dead-code candidate. No external references found for any global label in this block. Labels: build_runtime_behavior_map_from_screen_layout.
- [patchable] `runtime.screens.load_screen_stub` lines 40613-40618: Block `runtime.screens.load_screen_stub` (routine/screens) is a dead-code candidate. No external references found for any global label in this block. Labels: load_screen.
- [patchable] `runtime.sprites.show_sprite_legacy` lines 44945-44987: Block `runtime.sprites.show_sprite_legacy` (routine/sprites) is a dead-code candidate. No external references found for any global label in this block. Labels: show_sprite.
- [patchable] `runtime.worlds.current_screen_helpers` lines 46143-46165: Block `runtime.worlds.current_screen_helpers` (routine/worlds) is a dead-code candidate. No external references found for any global label in this block. Labels: get_current_world_id, get_current_screen_index, set_current_screen.
- [patchable] `runtime.screens.presentation_wait_frames` lines 47506-47518: Block `runtime.screens.presentation_wait_frames` (routine/screens) is a dead-code candidate. No external references found for any global label in this block. Labels: presentation_wait_frames.
- [patchable] `runtime.menus.gfn_1773429482585` lines 50852-50891: Block `runtime.menus.gfn_1773429482585` (routine/menus) is a dead-code candidate. No external references found for any global label in this block. Labels: show_menu_gfn_1773429482585, menu_gfn_1773429482585_title, handle_menu_gfn_1773429482585.

## unused-screen-loaders

- Metrics: findings=2, patchable=2, removed_lines=128, removed_source_bytes=4785
- Routines: load_screen_background1_771482721894_far, runtime.screens.load_screen_background1_771482721894.loader

- [patchable] `load_screen_background1_771482721894_far` lines 24314-24331: `load_screen_background1_771482721894_far` is a generated screen loader (18 lines, 426 source bytes) with no external label references. Category reason: Generated screen loader routine. Project metadata maps it to scene `background1` (index=2, resources=8). GameFlow reachability marks this scene unreachable. Related annotated loader block `runtime.screens.load_screen_background1_771482721894.loader` is currently rooted by `load_screen_background1_771482721894`. Deletion is patchable only when GameFlow reachability proves the scene is unreachable.
- [patchable] `runtime.screens.load_screen_background1_771482721894.loader` lines 41106-41216: Annotated loader block `runtime.screens.load_screen_background1_771482721894.loader` only feeds `load_screen_background1_771482721894_far`, and GameFlow reachability marks the owning scene unreachable.

## inactive-feature-runtime

- Metrics: findings=46, patchable=0, removed_lines=0, removed_source_bytes=0
- Routines: boss_apply_behavior_form, boss_attack_get_sprite_pattern, boss_current_shape_covers_draw_cell, boss_draw_behavior_attack, boss_draw_write_cell, boss_falling_blocks_hide_all, boss_get_active_tile_char, boss_get_runtime_layout_char, boss_init_behavior_state, boss_load_current_behavior_action, boss_pop_data_bank, boss_prepare_behavior_move_timing, boss_projectile_hide_all, boss_projectile_show_current, boss_push_data_bank, boss_resolve_behavior_target, boss_resolve_initial_phase, boss_slam_rocks_hide_all, boss_step_towards_behavior_target, boss_tick_behavior_move_step, call_draw_boss_attack_resident, call_draw_boss_bomb_attack_resident, call_draw_boss_boomerang_attack_resident, call_draw_boss_homing_missile_attack_resident, call_draw_boss_laser_attack_resident, call_draw_boss_meteor_attack_resident, call_draw_boss_rock_attack_resident, call_draw_boss_sine_wave_attack_resident, call_init_boss_system_resident, call_init_screen_boss_from_current_screen_resident, call_update_boss_projectile_runtime_resident, call_update_boss_system_resident, draw_boss_attack, draw_boss_attack_far, draw_boss_projectile_attack, handle_menu_gfn_1773429482585, init_boss_system, init_boss_system_far, init_screen_boss_from_current_screen, init_screen_boss_from_current_screen_far, show_menu_gfn_1773429482585, show_menu_placeholder, update_boss_behavior, update_boss_projectile_runtime, update_boss_system, update_boss_system_far

- [report-only] `init_boss_system_far` lines 25116-25133: `init_boss_system_far` looks like bosses runtime (18 lines, 347 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: boot_or_init (Boot/init routine). External references still exist (2): call_init_boss_system_resident@25736, init_game_systems@25868. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: unannotated. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `init_screen_boss_from_current_screen_far` lines 25134-25151: `init_screen_boss_from_current_screen_far` looks like bosses runtime (18 lines, 427 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: boot_or_init (Boot/init routine). External references still exist (1): call_init_screen_boss_from_current_screen_resident@25739. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: unannotated. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `update_boss_system_far` lines 25152-25169: `update_boss_system_far` looks like bosses runtime (18 lines, 355 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_update_boss_system_resident@25742. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: unannotated. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `draw_boss_attack_far` lines 25170-25190: `draw_boss_attack_far` looks like bosses runtime (21 lines, 420 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: unannotated. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_init_boss_system_resident` lines 25735-25737: `call_init_boss_system_resident` looks like bosses runtime (3 lines, 61 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: unannotated. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_init_screen_boss_from_current_screen_resident` lines 25738-25740: `call_init_screen_boss_from_current_screen_resident` looks like bosses runtime (3 lines, 101 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (8): load_pan1_770754008863_boss_done@40832, load_pan2_771184738851_boss_done@41075, load_background1_771482721894_boss_done@41188, load_pan3_771880109228_boss_done@41430, load_pan4_772291683578_boss_done@41673, ... (+3 more). Deletion must stay blocked until callers are proven dead or rewired. Block ownership: unannotated. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_update_boss_system_resident` lines 25741-25743: `call_update_boss_system_resident` looks like bosses runtime (3 lines, 65 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): gameflow_world_game_loop@38008. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: unannotated. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_update_boss_projectile_runtime_resident` lines 25744-25746: `call_update_boss_projectile_runtime_resident` looks like bosses runtime (3 lines, 85 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: unannotated. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_draw_boss_attack_resident` lines 25747-25749: `call_draw_boss_attack_resident` looks like bosses runtime (3 lines, 57 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: unannotated. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_draw_boss_meteor_attack_resident` lines 25750-25752: `call_draw_boss_meteor_attack_resident` looks like bosses runtime (3 lines, 61 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: unannotated. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_draw_boss_bomb_attack_resident` lines 25753-25755: `call_draw_boss_bomb_attack_resident` looks like bosses runtime (3 lines, 59 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: unannotated. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_draw_boss_boomerang_attack_resident` lines 25756-25758: `call_draw_boss_boomerang_attack_resident` looks like bosses runtime (3 lines, 64 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: unannotated. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_draw_boss_rock_attack_resident` lines 25759-25761: `call_draw_boss_rock_attack_resident` looks like bosses runtime (3 lines, 59 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: unannotated. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_draw_boss_laser_attack_resident` lines 25762-25764: `call_draw_boss_laser_attack_resident` looks like bosses runtime (3 lines, 60 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: unannotated. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_draw_boss_sine_wave_attack_resident` lines 25765-25767: `call_draw_boss_sine_wave_attack_resident` looks like bosses runtime (3 lines, 64 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: unannotated. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_draw_boss_homing_missile_attack_resident` lines 25768-25770: `call_draw_boss_homing_missile_attack_resident` looks like bosses runtime (3 lines, 69 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: unannotated. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `show_menu_placeholder` lines 36481-36598: `show_menu_placeholder` looks like menus runtime (118 lines, 2791 source bytes), but project_usage marks feature `menus` disabled (menus=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): gameflow_handle_submenu@36454. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.gameflow.submenu` owner=`gameflow` preserve=false. Patch policy: feature family `menus` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `init_boss_system` lines 47696-47710: `init_boss_system` looks like bosses runtime (15 lines, 330 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: boot_or_init (Boot/init routine). External references still exist (1): init_boss_system_far@25123. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.boss.entry` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `update_boss_system` lines 47711-47799: `update_boss_system` looks like bosses runtime (89 lines, 3320 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): update_boss_system_far@25159. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.boss.entry` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `init_screen_boss_from_current_screen` lines 47800-47878: `init_screen_boss_from_current_screen` looks like bosses runtime (79 lines, 1697 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: boot_or_init (Boot/init routine). External references still exist (1): init_screen_boss_from_current_screen_far@25141. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.boss.core` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_push_data_bank` lines 47879-47890: `boss_push_data_bank` looks like bosses runtime (12 lines, 332 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): init_screen_boss_from_current_screen@47863. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.boss.core` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_pop_data_bank` lines 47891-47900: `boss_pop_data_bank` looks like bosses runtime (10 lines, 335 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): init_screen_boss_from_current_screen@47869. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.boss.core` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_resolve_initial_phase` lines 47901-47935: `boss_resolve_initial_phase` looks like bosses runtime (35 lines, 778 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): init_screen_boss_from_current_screen@47864. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.boss.core` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_init_behavior_state` lines 47936-47961: `boss_init_behavior_state` looks like bosses runtime (26 lines, 648 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): init_screen_boss_from_current_screen@47865. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.boss.core` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_current_shape_covers_draw_cell` lines 48111-48165: `boss_current_shape_covers_draw_cell` looks like bosses runtime (55 lines, 1084 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): init_screen_boss_from_current_screen@48085. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.boss.core` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_get_runtime_layout_char` lines 48166-48187: `boss_get_runtime_layout_char` looks like bosses runtime (22 lines, 474 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): init_screen_boss_from_current_screen@48087. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.boss.core` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_get_active_tile_char` lines 48188-48215: `boss_get_active_tile_char` looks like bosses runtime (28 lines, 577 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (2): init_screen_boss_from_current_screen@47992, init_screen_boss_from_current_screen@48154. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.boss.core` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_draw_write_cell` lines 48216-48239: `boss_draw_write_cell` looks like bosses runtime (24 lines, 490 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (2): init_screen_boss_from_current_screen@48012, init_screen_boss_from_current_screen@48089. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.boss.core` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `update_boss_behavior` lines 48240-48311: `update_boss_behavior` looks like bosses runtime (72 lines, 1418 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.core` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_load_current_behavior_action` lines 48312-48369: `boss_load_current_behavior_action` looks like bosses runtime (58 lines, 1431 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): update_boss_behavior@48247. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.boss.core` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_apply_behavior_form` lines 48370-48372: `boss_apply_behavior_form` looks like bosses runtime (3 lines, 35 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.core` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_prepare_behavior_move_timing` lines 48373-48440: `boss_prepare_behavior_move_timing` looks like bosses runtime (68 lines, 1386 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): update_boss_behavior@48359. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.boss.core` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_tick_behavior_move_step` lines 48441-48465: `boss_tick_behavior_move_step` looks like bosses runtime (25 lines, 555 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): update_boss_behavior@48257. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.boss.core` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_resolve_behavior_target` lines 48466-48507: `boss_resolve_behavior_target` looks like bosses runtime (42 lines, 967 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): update_boss_behavior@48374. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.boss.core` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_step_towards_behavior_target` lines 48508-48549: `boss_step_towards_behavior_target` looks like bosses runtime (42 lines, 773 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): update_boss_behavior@48259. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.boss.core` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_draw_behavior_attack` lines 48550-48553: `boss_draw_behavior_attack` looks like bosses runtime (4 lines, 37 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.core` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_attack_get_sprite_pattern` lines 48554-48556: `boss_attack_get_sprite_pattern` looks like bosses runtime (3 lines, 41 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: data (Asset/data table naming). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.core` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `draw_boss_attack` lines 48557-48560: `draw_boss_attack` looks like bosses runtime (4 lines, 28 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (2): update_boss_system_far@25177, call_draw_boss_attack_resident@25748. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.boss.core` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `draw_boss_projectile_attack` lines 48561-48563: `draw_boss_projectile_attack` looks like bosses runtime (3 lines, 38 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.core` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `update_boss_projectile_runtime` lines 48564-48566: `update_boss_projectile_runtime` looks like bosses runtime (3 lines, 41 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): call_update_boss_projectile_runtime_resident@25745. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.boss.core` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_projectile_show_current` lines 48567-48569: `boss_projectile_show_current` looks like bosses runtime (3 lines, 39 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.core` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_projectile_hide_all` lines 48570-48573: `boss_projectile_hide_all` looks like bosses runtime (4 lines, 36 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.core` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_slam_rocks_hide_all` lines 48574-48577: `boss_slam_rocks_hide_all` looks like bosses runtime (4 lines, 36 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.core` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `boss_falling_blocks_hide_all` lines 48578-48584: `boss_falling_blocks_hide_all` looks like bosses runtime (7 lines, 132 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.core` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `show_menu_gfn_1773429482585` lines 50853-50882: `show_menu_gfn_1773429482585` looks like menus runtime (30 lines, 686 source bytes), but project_usage marks feature `menus` disabled (menus=0). Category: runtime_code (Instruction-bearing runtime label). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.menus.gfn_1773429482585` owner=`menus` preserve=false. Patch policy: feature family `menus` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `handle_menu_gfn_1773429482585` lines 50886-50898: `handle_menu_gfn_1773429482585` looks like menus runtime (13 lines, 400 source bytes), but project_usage marks feature `menus` disabled (menus=0). Category: runtime_code (Instruction-bearing runtime label). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.menus.gfn_1773429482585` owner=`menus` preserve=false. Patch policy: feature family `menus` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.

## Optimization Passes

- Pass 1: findings=69, patchable=23, removed=439 lines / 13836 bytes, lines=50902->50463
- Pass 2: findings=44, patchable=0, removed=0 lines / 0 bytes, lines=50463->50463

