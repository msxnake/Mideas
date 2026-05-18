# Post-ASM Report

- Input: `C:\Users\salam\Documents\Programacion\Mideas\server\temp\patoantic249_backend_route_matrix_1778152268441_32815.post_asm_input.asm`
- Findings: 24
- Applied patches: 20
- Original lines: 50703
- Output lines: 50410
- Net line delta: -293

- Optimization passes run: 2
- Optimization source removed: 293 lines / 8445 bytes

## Mideas Block Inventory

- Blocks: 92
- Preserved blocks: 1
- Removable-by-policy blocks: 91
- Dead-block candidates: 20
- Annotated block source: 18652 lines / 518352 bytes
- Dead-candidate source: 293 lines / 8445 bytes
- Marker errors: 0

- By kind: data=3, routine=89
- By owner: animtiles=1, bosses=2, components=34, entities=7, font=1, gameflow=10, hud=1, interrupt=5, mapper=1, menus=1, resources=1, screens=14, scroll=1, sound=4, sprites=1, stateMachine=4, unified=1, worlds=3
- By status: candidate_unreferenced=20, preserved=1, referenced=13, rooted=58

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

- Unannotated labels: 593

| Category | Labels | Source |
| --- | ---: | ---: |
| `bank_marker` | 29 | 1254l/55540b |
| `bios_helper` | 9 | 1677l/83252b |
| `boot_or_init` | 35 | 882l/23201b |
| `data` | 273 | 4483l/159205b |
| `far_trampoline` | 94 | 1117l/23058b |
| `runtime_code` | 112 | 1996l/58790b |
| `runtime_inner_label` | 30 | 586l/16681b |
| `screen_loader` | 8 | 144l/3220b |
| `shared_runtime` | 3 | 59l/1908b |

| Label | Category | Source |
| --- | --- | --- |
| `FAST_SNSMAT` | `bios_helper` | 1076l/64963b |
| `FAR_BANK_9_ROM_START` | `bank_marker` | 310l/15186b |
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
| `PRESENTATION_SCREEN_PATTERNS_B0` | `data` | 47l/3099b |
| `FAR_BANK_13_ROM_START` | `bank_marker` | 78l/3095b |
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
| `runtime.mapper.core` | `routine` | `mapper` | `rooted` | 179 | 213l/5412b | 21370-21582 | mapper_runtime_init, mapper_set_bank_p1, mapper_set_bank_p2, mapper_set_bank_p3, mapper_set_bank_p4, ... (+14) |
| `runtime.resources.manager` | `routine` | `resources` | `rooted` | 190 | 680l/17743b | 22614-23293 | resource_manager_init, resource_invalidate_pattern_vram_cache, resource_invalidate_color_vram_cache, resource_invalidate_font_vram_cache, resource_invalidate_gameplay_vram_cache, ... (+14) |
| `runtime.components.input_trigger_level` | `routine` | `components` | `candidate_unreferenced` | 0 | 33l/773b | 23375-23407 | component_trigger_level_pressed_a |
| `runtime.page0.stubs` | `routine` | `unified` | `rooted` | 1 | 22l/505b | 23414-23435 | init_page0_runtime_state, page0_map_expanded_slot, page0_map_game_rom, page0_restore_bios_rom, page0_copy_chunk_to_buffer, ... (+2) |
| `runtime.interrupt.stop` | `routine` | `interrupt` | `rooted` | 0 | 43l/1299b | 23514-23556 | stop_interrupt_system |
| `runtime.interrupt.dispatcher` | `routine` | `interrupt` | `preserved` | 1 | 124l/4150b | 23558-23681 | interrupt_dispatcher |
| `runtime.interrupt.vblank_flag` | `routine` | `interrupt` | `rooted` | 1 | 35l/983b | 23694-23728 | update_vblank_flag |
| `runtime.interrupt.task_api` | `routine` | `interrupt` | `rooted` | 2 | 121l/3195b | 23733-23853 | enable_task, disable_task, get_frame_count |
| `runtime.interrupt.task_input` | `routine` | `interrupt` | `rooted` | 2 | 231l/6052b | 23857-24087 | init_default_tasks_from_plan, task_update_input |
| `runtime.components.init` | `routine` | `components` | `rooted` | 11 | 82l/2818b | 25860-25941 | component_fill_32_a, init_components |
| `runtime.components.position` | `routine` | `components` | `rooted` | 3 | 108l/3281b | 25943-26050 | init_position_system, update_position_component, position_update_loop, position_next_entity |
| `runtime.components.sprite` | `routine` | `components` | `rooted` | 6 | 396l/10316b | 26051-26446 | init_sprite_system, update_sprite_component, sprite_update_loop, sprite_layer_loop, sprite_continue, ... (+6) |
| `runtime.components.movement_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 26452-26455 | update_movement_component |
| `runtime.components.collision` | `routine` | `components` | `referenced` | 2 | 668l/18861b | 26456-27123 | init_collision_system, update_collision_component, collision_update_loop, collision_next_entity, update_entity_collision_fast, ... (+13) |
| `runtime.components.behavior_tile` | `routine` | `components` | `rooted` | 17 | 110l/3809b | 27124-27233 | get_behavior_tile, get_behavior_tile_nb, gbt_oob |
| `runtime.components.directional_sprite_sync` | `routine` | `components` | `rooted` | 3 | 87l/2084b | 27234-27320 | component_sync_directional_sprite_from_initial, component_sync_directional_sprite_from_current, component_sync_directional_sprite_common |
| `runtime.components.input` | `routine` | `components` | `referenced` | 2 | 388l/12766b | 27321-27708 | init_input_system, update_input_component, input_update_loop, input_move_up, input_move_down, ... (+16) |
| `runtime.components.behavior_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 27714-27717 | update_behavior_component |
| `runtime.components.health` | `routine` | `components` | `rooted` | 2 | 152l/4701b | 27718-27869 | init_health_system, update_health_component, decrease_entity_lives, increase_entity_lives |
| `runtime.components.animation` | `routine` | `components` | `referenced` | 4 | 342l/10555b | 27870-28211 | init_animation_system, update_animation_component, anim_done_entity, refresh_player_animation_fastpath |
| `runtime.components.jump` | `routine` | `components` | `referenced` | 2 | 233l/7043b | 28212-28444 | init_jump_system, update_jump_component, jump_update_loop, jump_done_entity, jump_next_entity |
| `runtime.components.gravity` | `routine` | `components` | `rooted` | 2 | 137l/4553b | 28445-28581 | init_gravity_system, update_gravity_component, gravity_update_loop, gravity_store_vel, gravity_grounded, ... (+2) |
| `runtime.components.walljump_stub` | `routine` | `components` | `referenced` | 2 | 18l/326b | 28602-28619 | init_walljump_system, update_walljump_component, walljump_process_entity_c, walljump_input_is_left, walljump_input_is_right |
| `runtime.components.auto_destroy_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/219b | 28622-28628 | init_auto_destroy_system, update_auto_destroy_component |
| `runtime.components.state_machine_component_stub` | `routine` | `components` | `referenced` | 1 | 7l/241b | 28652-28658 | init_statemachine_system, update_statemachine_component |
| `runtime.components.retractable_gate_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/196b | 28664-28667 | update_retractable_gate_component |
| `runtime.components.carry_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/163b | 28673-28676 | update_carry_component |
| `runtime.components.auto_control_script_stubs` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/252b | 28682-28688 | update_auto_control_script_component, update_auto_event_string_component |
| `runtime.components.damage_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/166b | 28694-28697 | update_damage_component |
| `runtime.components.shoot_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/163b | 28703-28706 | update_shoot_component |
| `runtime.components.platform_riding_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/220b | 28726-28732 | prepare_platform_detection, update_platform_riding |
| `runtime.components.wallcollision` | `routine` | `components` | `referenced` | 11 | 839l/31288b | 28733-29571 | init_wallcollision_system, wall_behavior_is_full_blocker, wall_down_behavior_blocks, update_wallcollision_component, wall_build_hitbox_cache, ... (+2) |
| `runtime.components.deadly_tiles` | `routine` | `components` | `rooted` | 3 | 262l/5874b | 29572-29833 | init_deadly_tiles_system, deadly_tiles_runtime_tile_is_deadly_nb, update_entity_deadly_flag_runtime, update_deadly_tiles_component, refresh_player_deadly_fastpath |
| `runtime.components.in_water_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 29839-29842 | update_in_water_component |
| `runtime.components.collectible_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/181b | 29848-29851 | update_collectible_component |
| `runtime.components.tile_interaction` | `routine` | `components` | `rooted` | 4 | 966l/21802b | 29852-30817 | interaction_target_variable_ptr_table, interaction_target_variable_word_table, init_tile_interaction_system, update_slash_component, record_bonus_respawn_slot, ... (+8) |
| `runtime.components.collected_tiles` | `routine` | `components` | `rooted` | 1 | 76l/3015b | 30818-30893 | apply_collected_tiles |
| `runtime.components.entity_management` | `routine` | `components` | `rooted` | 3 | 221l/6549b | 30894-31114 | create_entity, entity_job_set, entity_job_set_period_ok, entity_job_set_entry_wrap, entity_job_set_entry_ok, ... (+13) |
| `runtime.components.scheduler` | `routine` | `components` | `rooted` | 7 | 1299l/30456b | 31115-32413 | update_all_entities, mark_used_entity_list_dirty, ensure_used_entity_list_current, rebuild_used_entity_list, ensure_player_fast_runtime_bound, ... (+10) |
| `runtime.components.state_machine_executor` | `routine` | `components` | `rooted` | 2 | 74l/1973b | 32419-32492 | execute_all_state_machines, refresh_player_state_machine_fastpath |
| `runtime.components.legacy_tile_collision` | `routine` | `components` | `candidate_unreferenced` | 0 | 43l/1404b | 32502-32544 | get_tile_at_position, get_tile_behavior, tile_behavior_table, check_collision_at_point, check_collision_box, ... (+1) |
| `runtime.components.secret_zones` | `routine` | `components` | `rooted` | 1 | 258l/6746b | 32581-32838 | update_secret_zone_component, secret_zone_apply_current_rect, secret_zone_restore_current_rect, secret_zone_clear_state, secret_zone_compute_offset |
| `runtime.statemachine.core` | `routine` | `stateMachine` | `rooted` | 5 | 2311l/60794b | 32856-35166 | SM_Update, sm_timer_no_overflow, sm_update_done, SM_CheckTransitions, SM_CheckTransitions_Loop, ... (+43) |
| `data.statemachine.sound-tables` | `data` | `stateMachine` | `rooted` | 1 | 34l/1115b | 35256-35289 | SM_SoundPtrTable, SM_SoundAsset_0, SM_SoundAsset_0_Frames, SM_SoundAsset_1, SM_SoundAsset_1_Frames |
| `data.statemachine.statemachine_1771533517310` | `data` | `stateMachine` | `rooted` | 4 | 622l/20339b | 35290-35911 | SM_New_Statemachine_state_1771533526010, SM_New_Statemachine_state_1771533526010_OnEnter, SM_New_Statemachine_state_1771533526010_Transitions, SM_New_Statemachine_state_1771533526010_Transitions_Actions_2, SM_New_Statemachine_state_1771533526010_Transitions_Actions_3, ... (+43) |
| `data.statemachine.statemachine_1775000000009` | `data` | `stateMachine` | `rooted` | 2 | 36l/1733b | 35912-35947 | SM_Exit_Door_Gem_Gate_state_exit_hidden_1775000000012, SM_Exit_Door_Gem_Gate_state_exit_hidden_1775000000012_OnEnter, SM_Exit_Door_Gem_Gate_state_exit_hidden_1775000000012_Transitions, SM_Exit_Door_Gem_Gate_state_exit_open_1775000000013, SM_Exit_Door_Gem_Gate_state_exit_open_1775000000013_OnEnter |
| `runtime.gameflow.text_screen` | `routine` | `gameflow` | `rooted` | 2 | 160l/4353b | 36108-36267 | show_text_screen, wait_for_fire |
| `runtime.gameflow.submenu` | `routine` | `gameflow` | `rooted` | 1 | 1006l/24317b | 36302-37307 | show_menu_placeholder, render_submenu_screen, submenu_calc_vram_addr, submenu_string_length, submenu_compute_center_col, ... (+11) |
| `runtime.gameflow.presentation_wait_frames` | `routine` | `gameflow` | `candidate_unreferenced` | 0 | 13l/318b | 37335-37347 | gameflow_presentation_wait_frames |
| `runtime.gameflow.worldlink` | `routine` | `gameflow` | `rooted` | 1 | 95l/2642b | 37396-37490 | gameflow_handle_worldlink |
| `runtime.gameflow.if_then_else` | `routine` | `gameflow` | `rooted` | 1 | 138l/2748b | 37492-37629 | gameflow_handle_ifthenelse |
| `runtime.gameflow.connection_by_type` | `routine` | `gameflow` | `referenced` | 3 | 37l/701b | 37699-37735 | gameflow_get_connection_by_type |
| `runtime.gameflow.confirm_input_direct` | `routine` | `gameflow` | `referenced` | 4 | 12l/298b | 37760-37771 | gameflow_read_confirm_direct |
| `runtime.gameflow.world_loop` | `routine` | `gameflow` | `rooted` | 1 | 85l/2780b | 37779-37863 | gameflow_world_game_loop |
| `runtime.gameflow.screen_timer` | `routine` | `gameflow` | `rooted` | 1 | 144l/3220b | 37870-38013 | get_world_screen_timer_frames_per_second, reload_world_screen_timer_frames, snapshot_world_screen_timer_interrupt_counter, reset_world_screen_timer, update_world_screen_timer |
| `runtime.gameflow.clear_screen_area_helpers` | `routine` | `gameflow` | `referenced` | 2 | 60l/1737b | 38348-38407 | clear_screen_area, clear_screen_row, empty_row_data |
| `runtime.screens.presentation_wait_frames` | `routine` | `screens` | `candidate_unreferenced` | 0 | 13l/298b | 40417-40429 | presentation_wait_frames |
| `runtime.screens.colors` | `routine` | `screens` | `rooted` | 1 | 44l/1514b | 40566-40609 | color_shift_table, set_screen_colors |
| `runtime.screens.copy_rect` | `routine` | `screens` | `rooted` | 4 | 77l/1494b | 40703-40779 | copy_layout_rect_to_vram, copy_layout_rect_ram_to_ram |
| `runtime.screens.block_layout_expander` | `routine` | `screens` | `rooted` | 0 | 194l/3798b | 40781-40974 | expand_screen_block_layout_to_background, expand_screen_block_layout_2x2, expand_screen_block_layout_4x4 |
| `runtime.screens.behavior_map_rebuild` | `routine` | `screens` | `candidate_unreferenced` | 0 | 26l/709b | 40992-41017 | build_runtime_behavior_map_from_screen_layout |
| `runtime.screens.load_screen_stub` | `routine` | `screens` | `candidate_unreferenced` | 0 | 6l/232b | 41018-41023 | load_screen |
| `runtime.screens.load_screen_pan1_770754008863.loader` | `routine` | `screens` | `rooted` | 1 | 115l/4357b | 41152-41266 | load_screen_pan1_770754008863, load_pan1_770754008863_boss_done |
| `runtime.screens.load_screen_pan2_771184738851.loader` | `routine` | `screens` | `rooted` | 1 | 115l/4356b | 41395-41509 | load_screen_pan2_771184738851, load_pan2_771184738851_boss_done |
| `runtime.screens.load_screen_background1_771482721894.loader` | `routine` | `screens` | `rooted` | 1 | 111l/4360b | 41511-41621 | load_screen_background1_771482721894, load_background1_771482721894_boss_done |
| `runtime.screens.load_screen_pan3_771880109228.loader` | `routine` | `screens` | `rooted` | 1 | 115l/4357b | 41750-41864 | load_screen_pan3_771880109228, load_pan3_771880109228_boss_done |
| `runtime.screens.load_screen_pan4_772291683578.loader` | `routine` | `screens` | `rooted` | 1 | 115l/4356b | 41993-42107 | load_screen_pan4_772291683578, load_pan4_772291683578_boss_done |
| `runtime.screens.load_screen_pan5_773321312901.loader` | `routine` | `screens` | `rooted` | 1 | 112l/4242b | 42109-42220 | load_screen_pan5_773321312901, load_pan5_773321312901_boss_done |
| `runtime.screens.load_screen_pan6_773382451315.loader` | `routine` | `screens` | `rooted` | 1 | 112l/4242b | 42222-42333 | load_screen_pan6_773382451315, load_pan6_773382451315_boss_done |
| `runtime.screens.load_screen_pan1_2_774194791624.loader` | `routine` | `screens` | `rooted` | 1 | 115l/4405b | 42462-42576 | load_screen_pan1_2_774194791624, load_pan1_2_774194791624_boss_done |
| `data.entities.hero_1.init` | `routine` | `entities` | `rooted` | 1 | 187l/5474b | 42819-43005 | init_hero_1 |
| `data.entities.pato_1.init` | `routine` | `entities` | `rooted` | 1 | 162l/4330b | 43024-43185 | init_pato_1 |
| `data.entities.exit_trigger.init` | `routine` | `entities` | `rooted` | 1 | 127l/3844b | 43235-43361 | init_exit_trigger |
| `data.entities.pato3.init` | `routine` | `entities` | `rooted` | 1 | 162l/4317b | 43380-43541 | init_pato3 |
| `data.entities.bola2.init` | `routine` | `entities` | `rooted` | 1 | 162l/4328b | 43591-43752 | init_bola2 |
| `data.entities.hero_2.init` | `routine` | `entities` | `rooted` | 1 | 187l/5479b | 43802-43988 | init_hero_2 |
| `runtime.entities.patrol_facing` | `routine` | `entities` | `rooted` | 3 | 88l/2125b | 44165-44252 | update_entity_patrol_facing |
| `runtime.sprites.show_sprite_legacy` | `routine` | `sprites` | `candidate_unreferenced` | 0 | 43l/981b | 45350-45392 | show_sprite |
| `runtime.worlds.worldmap_1770754170935.loader` | `routine` | `worlds` | `rooted` | 2 | 39l/1428b | 45594-45632 | load_world_worldmap_1770754170935 |
| `runtime.worlds.worldmap_1774194757416.loader` | `routine` | `worlds` | `rooted` | 1 | 39l/1425b | 45640-45678 | load_world_worldmap_1774194757416 |
| `runtime.worlds.current_screen_helpers` | `routine` | `worlds` | `candidate_unreferenced` | 0 | 23l/633b | 46548-46570 | get_current_world_id, get_current_screen_index, set_current_screen |
| `runtime.sound.psg_lowlevel` | `routine` | `sound` | `rooted` | 27 | 117l/3450b | 46713-46829 | psg_write, psg_set_tone, psg_set_volume, psg_set_noise, psg_set_mixer, ... (+1) |
| `runtime.sound.sfx_silence` | `routine` | `sound` | `referenced` | 2 | 21l/579b | 46839-46859 | sfx_silence_all |
| `runtime.sound.sfx_builtin_effects` | `routine` | `sound` | `referenced` | 6 | 127l/3025b | 46865-46991 | sfx_beep, sfx_jump, sfx_shoot, sfx_explosion, sfx_coin, ... (+1) |
| `runtime.sound.sfx_playback` | `routine` | `sound` | `referenced` | 1 | 119l/2384b | 47009-47127 | play_sound_effect, play_sound_effect_beep, play_sound_effect_jump, play_sound_effect_shoot, play_sound_effect_explosion, ... (+4) |
| `runtime.boss.entry` | `routine` | `bosses` | `rooted` | 2 | 17l/464b | 47488-47504 | init_boss_system, update_boss_system |
| `runtime.boss.core` | `routine` | `bosses` | `rooted` | 2 | 876l/19553b | 47506-48381 | init_screen_boss_from_current_screen, boss_resolve_initial_phase, boss_init_behavior_state, draw_active_boss_tiles, restore_active_boss_tiles, ... (+21) |
| `runtime.animtiles.core` | `routine` | `animtiles` | `rooted` | 3 | 540l/20056b | 48402-48941 | init_animated_tiles, update_animated_tiles, update_animated_tiles_vram, set_animation_speed, anim_copy_8_bytes, ... (+13) |
| `runtime.hud.core` | `routine` | `hud` | `rooted` | 3 | 661l/15508b | 48961-49621 | hud_element_data, hud_text_0, hud_text_1, hud_text_2, hud_text_3, ... (+12) |
| `runtime.font.loading` | `routine` | `font` | `rooted` | 3 | 227l/6845b | 49758-49984 | load_custom_font, load_font_bank0, load_font_bank1, load_font_bank2, load_all_font_banks, ... (+5) |
| `runtime.scroll.core` | `routine` | `scroll` | `rooted` | 0 | 344l/8639b | 50062-50405 | init_scroll_system, set_camera_position, move_camera, center_camera_on_entity, update_scroll, ... (+2) |
| `runtime.menus.gfn_1773429482585` | `routine` | `menus` | `candidate_unreferenced` | 0 | 40l/1021b | 50653-50692 | show_menu_gfn_1773429482585, menu_gfn_1773429482585_title, handle_menu_gfn_1773429482585 |

## Dead-Block Candidates

- `runtime.components.legacy_tile_collision`: 43 lines / 1404 bytes. No external references found for any global label in this block.
- `runtime.menus.gfn_1773429482585`: 40 lines / 1021 bytes. No external references found for any global label in this block.
- `runtime.sprites.show_sprite_legacy`: 43 lines / 981 bytes. No external references found for any global label in this block.
- `runtime.components.input_trigger_level`: 33 lines / 773 bytes. No external references found for any global label in this block.
- `runtime.screens.behavior_map_rebuild`: 26 lines / 709 bytes. No external references found for any global label in this block.
- `runtime.worlds.current_screen_helpers`: 23 lines / 633 bytes. No external references found for any global label in this block.
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

- Metrics: findings=20, patchable=20, removed_lines=293, removed_source_bytes=8445
- Routines: runtime.components.auto_control_script_stubs, runtime.components.auto_destroy_stub, runtime.components.behavior_stub, runtime.components.carry_stub, runtime.components.collectible_stub, runtime.components.damage_stub, runtime.components.in_water_stub, runtime.components.input_trigger_level, runtime.components.legacy_tile_collision, runtime.components.movement_stub, runtime.components.platform_riding_stub, runtime.components.retractable_gate_stub, runtime.components.shoot_stub, runtime.gameflow.presentation_wait_frames, runtime.menus.gfn_1773429482585, runtime.screens.behavior_map_rebuild, runtime.screens.load_screen_stub, runtime.screens.presentation_wait_frames, runtime.sprites.show_sprite_legacy, runtime.worlds.current_screen_helpers

- [patchable] `runtime.components.input_trigger_level` lines 23375-23407: Block `runtime.components.input_trigger_level` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: component_trigger_level_pressed_a.
- [patchable] `runtime.components.movement_stub` lines 26452-26455: Block `runtime.components.movement_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_movement_component.
- [patchable] `runtime.components.behavior_stub` lines 27714-27717: Block `runtime.components.behavior_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_behavior_component.
- [patchable] `runtime.components.auto_destroy_stub` lines 28622-28628: Block `runtime.components.auto_destroy_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: init_auto_destroy_system, update_auto_destroy_component.
- [patchable] `runtime.components.retractable_gate_stub` lines 28664-28667: Block `runtime.components.retractable_gate_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_retractable_gate_component.
- [patchable] `runtime.components.carry_stub` lines 28673-28676: Block `runtime.components.carry_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_carry_component.
- [patchable] `runtime.components.auto_control_script_stubs` lines 28682-28688: Block `runtime.components.auto_control_script_stubs` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_auto_control_script_component, update_auto_event_string_component.
- [patchable] `runtime.components.damage_stub` lines 28694-28697: Block `runtime.components.damage_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_damage_component.
- [patchable] `runtime.components.shoot_stub` lines 28703-28706: Block `runtime.components.shoot_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_shoot_component.
- [patchable] `runtime.components.platform_riding_stub` lines 28726-28732: Block `runtime.components.platform_riding_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: prepare_platform_detection, update_platform_riding.
- [patchable] `runtime.components.in_water_stub` lines 29839-29842: Block `runtime.components.in_water_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_in_water_component.
- [patchable] `runtime.components.collectible_stub` lines 29848-29851: Block `runtime.components.collectible_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_collectible_component.
- [patchable] `runtime.components.legacy_tile_collision` lines 32502-32544: Block `runtime.components.legacy_tile_collision` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: get_tile_at_position, get_tile_behavior, tile_behavior_table, check_collision_at_point, check_collision_box, ... (+1).
- [patchable] `runtime.gameflow.presentation_wait_frames` lines 37335-37347: Block `runtime.gameflow.presentation_wait_frames` (routine/gameflow) is a dead-code candidate. No external references found for any global label in this block. Labels: gameflow_presentation_wait_frames.
- [patchable] `runtime.screens.presentation_wait_frames` lines 40417-40429: Block `runtime.screens.presentation_wait_frames` (routine/screens) is a dead-code candidate. No external references found for any global label in this block. Labels: presentation_wait_frames.
- [patchable] `runtime.screens.behavior_map_rebuild` lines 40992-41017: Block `runtime.screens.behavior_map_rebuild` (routine/screens) is a dead-code candidate. No external references found for any global label in this block. Labels: build_runtime_behavior_map_from_screen_layout.
- [patchable] `runtime.screens.load_screen_stub` lines 41018-41023: Block `runtime.screens.load_screen_stub` (routine/screens) is a dead-code candidate. No external references found for any global label in this block. Labels: load_screen.
- [patchable] `runtime.sprites.show_sprite_legacy` lines 45350-45392: Block `runtime.sprites.show_sprite_legacy` (routine/sprites) is a dead-code candidate. No external references found for any global label in this block. Labels: show_sprite.
- [patchable] `runtime.worlds.current_screen_helpers` lines 46548-46570: Block `runtime.worlds.current_screen_helpers` (routine/worlds) is a dead-code candidate. No external references found for any global label in this block. Labels: get_current_world_id, get_current_screen_index, set_current_screen.
- [patchable] `runtime.menus.gfn_1773429482585` lines 50653-50692: Block `runtime.menus.gfn_1773429482585` (routine/menus) is a dead-code candidate. No external references found for any global label in this block. Labels: show_menu_gfn_1773429482585, menu_gfn_1773429482585_title, handle_menu_gfn_1773429482585.

## unused-screen-loaders

- Metrics: findings=1, patchable=0, removed_lines=0, removed_source_bytes=0
- Routines: load_screen_background1_771482721894_far

- [report-only] `load_screen_background1_771482721894_far` lines 24179-24196: `load_screen_background1_771482721894_far` is a generated screen loader (18 lines, 426 source bytes) with no external label references. Category reason: Generated screen loader routine. Project metadata maps it to scene `background1` (index=2, resources=8). Related annotated loader block `runtime.screens.load_screen_background1_771482721894.loader` is currently rooted by `load_screen_background1_771482721894`. Deletion is patchable only when GameFlow reachability proves the scene is unreachable.

## inactive-feature-runtime

- Metrics: findings=3, patchable=0, removed_lines=0, removed_source_bytes=0
- Routines: handle_menu_gfn_1773429482585, show_menu_gfn_1773429482585, show_menu_placeholder

- [report-only] `show_menu_placeholder` lines 36303-36420: `show_menu_placeholder` looks like menus runtime (118 lines, 2791 source bytes), but project_usage marks feature `menus` disabled. Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): gameflow_handle_submenu@36276. Deletion must stay blocked until callers are proven dead or rewired. Patch is not enabled yet for feature family `menus`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `show_menu_gfn_1773429482585` lines 50654-50683: `show_menu_gfn_1773429482585` looks like menus runtime (30 lines, 686 source bytes), but project_usage marks feature `menus` disabled. Category: runtime_code (Instruction-bearing runtime label). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Patch is not enabled yet for feature family `menus`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `handle_menu_gfn_1773429482585` lines 50687-50699: `handle_menu_gfn_1773429482585` looks like menus runtime (13 lines, 400 source bytes), but project_usage marks feature `menus` disabled. Category: runtime_code (Instruction-bearing runtime label). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Patch is not enabled yet for feature family `menus`. This is report-only until the generator metadata and invariants prove deletion is safe.

## Optimization Passes

- Pass 1: findings=24, patchable=20, removed=293 lines / 8445 bytes, lines=50703->50410
- Pass 2: findings=2, patchable=0, removed=0 lines / 0 bytes, lines=50410->50410

