# Post-ASM Report

- Input: `C:\Users\salam\Documents\Programacion\Mideas\server\temp\patoantic249_matrix_megarom_konami_compressed.asm`
- Findings: 18
- Applied patches: 0
- Original lines: 57204
- Output lines: 57204
- Net line delta: 0

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

- Marker error: Line 44389: @mideas:endblock without open block.
- Marker error: Line 56442: @mideas:block id=runtime.gameflow.world_loop has no closing @mideas:endblock.

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
| `runtime.mapper.core` | `routine` | `mapper` | `rooted` | 199 | 213l/5412b | 25570-25782 | mapper_runtime_init, mapper_set_bank_p1, mapper_set_bank_p2, mapper_set_bank_p3, mapper_set_bank_p4, ... (+14) |
| `runtime.resources.manager` | `routine` | `resources` | `rooted` | 191 | 697l/18133b | 26814-27510 | resource_manager_init, resource_invalidate_pattern_vram_cache, resource_invalidate_color_vram_cache, resource_invalidate_font_vram_cache, resource_invalidate_gameplay_vram_cache, ... (+14) |
| `runtime.components.input_trigger_level` | `routine` | `components` | `candidate_unreferenced` | 0 | 33l/773b | 27592-27624 | component_trigger_level_pressed_a |
| `runtime.page0.stubs` | `routine` | `unified` | `rooted` | 1 | 22l/505b | 27631-27652 | init_page0_runtime_state, page0_map_expanded_slot, page0_map_game_rom, page0_restore_bios_rom, page0_copy_chunk_to_buffer, ... (+2) |
| `runtime.interrupt.stop` | `routine` | `interrupt` | `rooted` | 0 | 43l/1299b | 27733-27775 | stop_interrupt_system |
| `runtime.interrupt.dispatcher` | `routine` | `interrupt` | `preserved` | 1 | 124l/4150b | 27777-27900 | interrupt_dispatcher |
| `runtime.interrupt.vblank_flag` | `routine` | `interrupt` | `rooted` | 1 | 35l/983b | 27913-27947 | update_vblank_flag |
| `runtime.interrupt.task_api` | `routine` | `interrupt` | `rooted` | 2 | 121l/3195b | 27952-28072 | enable_task, disable_task, get_frame_count |
| `runtime.interrupt.task_input` | `routine` | `interrupt` | `rooted` | 2 | 275l/7220b | 28076-28350 | init_default_tasks_from_plan, task_update_input |
| `runtime.far_trampoline.init_sound_system_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/710b | 29305-29330 | init_sound_system_far |
| `runtime.far_trampoline.task_audio_tick_far` | `trampoline` | `far-call` | `preserved` | 0 | 26l/696b | 29332-29357 | task_audio_tick_far |
| `runtime.far_trampoline.sfx_update_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/661b | 29359-29384 | sfx_update_far |
| `runtime.far_trampoline.music_update_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/675b | 29386-29411 | music_update_far |
| `runtime.far_trampoline.music_stop_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/661b | 29413-29438 | music_stop_far |
| `runtime.far_trampoline.music_play_track_far` | `trampoline` | `far-call` | `preserved` | 1 | 28l/740b | 29440-29467 | music_play_track_far |
| `runtime.far_trampoline.music_execute_command_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/738b | 29469-29494 | music_execute_command_far |
| `runtime.far_trampoline.init_boss_system_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/703b | 30348-30373 | init_boss_system_far |
| `runtime.far_trampoline.init_screen_boss_from_current_screen_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/843b | 30375-30400 | init_screen_boss_from_current_screen_far |
| `runtime.far_trampoline.update_boss_system_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/717b | 30402-30427 | update_boss_system_far |
| `runtime.sound.resident.init` | `routine` | `sound` | `referenced` | 1 | 4l/184b | 30452-30455 | call_init_sound_system_resident |
| `runtime.sound.resident.tick` | `routine` | `sound` | `candidate_unreferenced` | 0 | 18l/606b | 30457-30474 | call_task_audio_tick_resident |
| `runtime.sound.resident.music_update` | `routine` | `sound` | `referenced` | 3 | 4l/190b | 30476-30479 | call_music_update_resident |
| `runtime.sound.resident.sfx_update` | `routine` | `sound` | `referenced` | 1 | 4l/182b | 30481-30484 | call_sfx_update_resident |
| `runtime.sound.resident.music_stop` | `routine` | `sound` | `referenced` | 1 | 4l/182b | 30486-30489 | call_music_stop_resident |
| `runtime.sound.resident.music_play_track` | `routine` | `sound` | `referenced` | 2 | 4l/206b | 30491-30494 | call_music_play_track_resident |
| `runtime.sound.resident.music_execute_command` | `routine` | `sound` | `referenced` | 1 | 4l/226b | 30496-30499 | call_music_execute_command_resident |
| `runtime.boss.resident.init` | `routine` | `bosses` | `preserved` | 0 | 4l/232b | 30613-30616 | call_init_boss_system_resident |
| `runtime.boss.resident.init_screen` | `routine` | `bosses` | `preserved` | 0 | 4l/306b | 30618-30621 | call_init_screen_boss_from_current_screen_resident |
| `runtime.boss.resident.update` | `routine` | `bosses` | `preserved` | 0 | 4l/242b | 30623-30626 | call_update_boss_system_resident |
| `runtime.boss.resident.update_projectile` | `routine` | `bosses` | `preserved` | 0 | 4l/279b | 30628-30631 | call_update_boss_projectile_runtime_resident |
| `runtime.boss.resident.draw_attack` | `routine` | `bosses` | `preserved` | 0 | 4l/239b | 30633-30636 | call_draw_boss_attack_resident |
| `runtime.boss.resident.draw_meteor` | `routine` | `bosses` | `preserved` | 0 | 4l/253b | 30638-30641 | call_draw_boss_meteor_attack_resident |
| `runtime.boss.resident.draw_bomb` | `routine` | `bosses` | `preserved` | 0 | 4l/245b | 30643-30646 | call_draw_boss_bomb_attack_resident |
| `runtime.boss.resident.draw_boomerang` | `routine` | `bosses` | `preserved` | 0 | 4l/265b | 30648-30651 | call_draw_boss_boomerang_attack_resident |
| `runtime.boss.resident.draw_rock` | `routine` | `bosses` | `preserved` | 0 | 4l/245b | 30653-30656 | call_draw_boss_rock_attack_resident |
| `runtime.boss.resident.draw_laser` | `routine` | `bosses` | `preserved` | 0 | 4l/249b | 30658-30661 | call_draw_boss_laser_attack_resident |
| `runtime.boss.resident.draw_sine_wave` | `routine` | `bosses` | `preserved` | 0 | 4l/265b | 30663-30666 | call_draw_boss_sine_wave_attack_resident |
| `runtime.boss.resident.draw_homing_missile` | `routine` | `bosses` | `preserved` | 0 | 4l/285b | 30668-30671 | call_draw_boss_homing_missile_attack_resident |
| `runtime.components.init` | `routine` | `components` | `rooted` | 11 | 80l/2746b | 30939-31018 | component_fill_32_a, init_components |
| `runtime.components.position` | `routine` | `components` | `rooted` | 3 | 108l/3281b | 31020-31127 | init_position_system, update_position_component, position_update_loop, position_next_entity |
| `runtime.components.sprite` | `routine` | `components` | `rooted` | 6 | 396l/10316b | 31128-31523 | init_sprite_system, update_sprite_component, sprite_update_loop, sprite_layer_loop, sprite_continue, ... (+6) |
| `runtime.components.movement_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 31529-31532 | update_movement_component |
| `runtime.components.collision` | `routine` | `components` | `referenced` | 2 | 668l/18861b | 31533-32200 | init_collision_system, update_collision_component, collision_update_loop, collision_next_entity, update_entity_collision_fast, ... (+13) |
| `runtime.components.behavior_tile` | `routine` | `components` | `rooted` | 17 | 110l/3809b | 32201-32310 | get_behavior_tile, get_behavior_tile_nb, gbt_oob |
| `runtime.components.directional_sprite_sync` | `routine` | `components` | `rooted` | 3 | 87l/2084b | 32311-32397 | component_sync_directional_sprite_from_initial, component_sync_directional_sprite_from_current, component_sync_directional_sprite_common |
| `runtime.components.input` | `routine` | `components` | `referenced` | 2 | 393l/13136b | 32398-32790 | init_input_system, update_input_component, input_update_loop, input_move_up, input_move_down, ... (+16) |
| `runtime.components.behavior_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 32796-32799 | update_behavior_component |
| `runtime.components.health` | `routine` | `components` | `rooted` | 2 | 152l/4701b | 32800-32951 | init_health_system, update_health_component, decrease_entity_lives, increase_entity_lives |
| `runtime.components.animation` | `routine` | `components` | `referenced` | 4 | 342l/10555b | 32952-33293 | init_animation_system, update_animation_component, anim_done_entity, refresh_player_animation_fastpath |
| `runtime.components.jump` | `routine` | `components` | `referenced` | 2 | 233l/7043b | 33294-33526 | init_jump_system, update_jump_component, jump_update_loop, jump_done_entity, jump_next_entity |
| `runtime.components.gravity` | `routine` | `components` | `rooted` | 2 | 137l/4553b | 33527-33663 | init_gravity_system, update_gravity_component, gravity_update_loop, gravity_store_vel, gravity_grounded, ... (+2) |
| `runtime.components.walljump_stub` | `routine` | `components` | `referenced` | 2 | 18l/326b | 33684-33701 | init_walljump_system, update_walljump_component, walljump_process_entity_c, walljump_input_is_left, walljump_input_is_right |
| `runtime.components.auto_destroy_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/219b | 33704-33710 | init_auto_destroy_system, update_auto_destroy_component |
| `runtime.components.state_machine_component_stub` | `routine` | `components` | `referenced` | 1 | 7l/241b | 33734-33740 | init_statemachine_system, update_statemachine_component |
| `runtime.components.retractable_gate_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/196b | 33746-33749 | update_retractable_gate_component |
| `runtime.components.carry_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/163b | 33755-33758 | update_carry_component |
| `runtime.components.damage_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/166b | 33766-33769 | update_damage_component |
| `runtime.components.shoot_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/163b | 33775-33778 | update_shoot_component |
| `runtime.components.platform_riding_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/220b | 33798-33804 | prepare_platform_detection, update_platform_riding |
| `runtime.components.wallcollision` | `routine` | `components` | `referenced` | 11 | 839l/31288b | 33805-34643 | init_wallcollision_system, wall_behavior_is_full_blocker, wall_down_behavior_blocks, update_wallcollision_component, wall_build_hitbox_cache, ... (+2) |
| `runtime.components.deadly_tiles` | `routine` | `components` | `rooted` | 3 | 262l/5874b | 34644-34905 | init_deadly_tiles_system, deadly_tiles_runtime_tile_is_deadly_nb, update_entity_deadly_flag_runtime, update_deadly_tiles_component, refresh_player_deadly_fastpath |
| `runtime.components.in_water_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 34911-34914 | update_in_water_component |
| `runtime.components.collectible_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/181b | 34920-34923 | update_collectible_component |
| `runtime.components.tile_interaction` | `routine` | `components` | `rooted` | 4 | 966l/21802b | 34924-35889 | interaction_target_variable_ptr_table, interaction_target_variable_word_table, init_tile_interaction_system, update_slash_component, record_bonus_respawn_slot, ... (+8) |
| `runtime.components.collected_tiles` | `routine` | `components` | `rooted` | 1 | 76l/3015b | 35890-35965 | apply_collected_tiles |
| `runtime.components.entity_management` | `routine` | `components` | `rooted` | 3 | 221l/6549b | 35966-36186 | create_entity, entity_job_set, entity_job_set_period_ok, entity_job_set_entry_wrap, entity_job_set_entry_ok, ... (+13) |
| `runtime.components.scheduler` | `routine` | `components` | `rooted` | 7 | 1340l/31712b | 36187-37526 | update_all_entities, mark_used_entity_list_dirty, ensure_used_entity_list_current, rebuild_used_entity_list, ensure_player_fast_runtime_bound, ... (+14) |
| `runtime.components.auto_control_script_stubs` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/252b | 36748-36754 | update_auto_control_script_component, update_auto_event_string_component |
| `runtime.components.state_machine_executor` | `routine` | `components` | `rooted` | 2 | 74l/1973b | 37532-37605 | execute_all_state_machines, refresh_player_state_machine_fastpath |
| `runtime.components.legacy_tile_collision` | `routine` | `components` | `candidate_unreferenced` | 0 | 43l/1404b | 37615-37657 | get_tile_at_position, get_tile_behavior, tile_behavior_table, check_collision_at_point, check_collision_box, ... (+1) |
| `runtime.components.secret_zones` | `routine` | `components` | `rooted` | 1 | 258l/6746b | 37694-37951 | update_secret_zone_component, secret_zone_apply_current_rect, secret_zone_restore_current_rect, secret_zone_clear_state, secret_zone_compute_offset |
| `runtime.statemachine.core` | `routine` | `stateMachine` | `rooted` | 5 | 2355l/62007b | 37959-40313 | SM_Update, sm_timer_no_overflow, sm_timer_paused, sm_update_done, SM_ShouldPauseTimerForDialogue, ... (+45) |
| `data.statemachine.sound-tables` | `data` | `stateMachine` | `rooted` | 1 | 34l/1115b | 40403-40436 | SM_SoundPtrTable, SM_SoundAsset_0, SM_SoundAsset_0_Frames, SM_SoundAsset_1, SM_SoundAsset_1_Frames |
| `data.statemachine.statemachine_1771533517310` | `data` | `stateMachine` | `rooted` | 4 | 622l/20339b | 40437-41058 | SM_New_Statemachine_state_1771533526010, SM_New_Statemachine_state_1771533526010_OnEnter, SM_New_Statemachine_state_1771533526010_Transitions, SM_New_Statemachine_state_1771533526010_Transitions_Actions_2, SM_New_Statemachine_state_1771533526010_Transitions_Actions_3, ... (+43) |
| `data.statemachine.statemachine_1775000000009` | `data` | `stateMachine` | `rooted` | 2 | 36l/1733b | 41059-41094 | SM_Exit_Door_Gem_Gate_state_exit_hidden_1775000000012, SM_Exit_Door_Gem_Gate_state_exit_hidden_1775000000012_OnEnter, SM_Exit_Door_Gem_Gate_state_exit_hidden_1775000000012_Transitions, SM_Exit_Door_Gem_Gate_state_exit_open_1775000000013, SM_Exit_Door_Gem_Gate_state_exit_open_1775000000013_OnEnter |
| `runtime.gameflow.text_screen` | `routine` | `gameflow` | `rooted` | 2 | 160l/4361b | 41257-41416 | show_text_screen, wait_for_fire |
| `runtime.gameflow.submenu` | `routine` | `gameflow` | `rooted` | 1 | 1006l/24325b | 41451-42456 | show_menu_placeholder, render_submenu_screen, submenu_calc_vram_addr, submenu_string_length, submenu_compute_center_col, ... (+11) |
| `runtime.gameflow.presentation_wait_frames` | `routine` | `gameflow` | `empty` | 0 | 3l/230b | 42493-42495 |  |
| `runtime.gameflow.worldlink` | `routine` | `gameflow` | `rooted` | 1 | 102l/2850b | 42544-42645 | gameflow_handle_worldlink |
| `runtime.gameflow.if_then_else` | `routine` | `gameflow` | `rooted` | 1 | 138l/2748b | 42647-42784 | gameflow_handle_ifthenelse |
| `runtime.gameflow.connection_by_type` | `routine` | `gameflow` | `referenced` | 3 | 37l/701b | 44238-44274 | gameflow_get_connection_by_type |
| `runtime.gameflow.screen_timer` | `routine` | `gameflow` | `rooted` | 1 | 144l/3220b | 44396-44539 | get_world_screen_timer_frames_per_second, reload_world_screen_timer_frames, snapshot_world_screen_timer_interrupt_counter, reset_world_screen_timer, update_world_screen_timer |
| `runtime.gameflow.clear_screen_area_helpers` | `routine` | `gameflow` | `referenced` | 2 | 60l/1737b | 44877-44936 | clear_screen_area, clear_screen_row, empty_row_data |
| `runtime.screens.colors` | `routine` | `screens` | `rooted` | 1 | 44l/1514b | 46512-46555 | color_shift_table, set_screen_colors |
| `runtime.screens.copy_rect` | `routine` | `screens` | `rooted` | 4 | 77l/1494b | 46684-46760 | copy_layout_rect_to_vram, copy_layout_rect_ram_to_ram |
| `runtime.screens.block_layout_expander` | `routine` | `screens` | `rooted` | 0 | 194l/3798b | 46762-46955 | expand_screen_block_layout_to_background, expand_screen_block_layout_2x2, expand_screen_block_layout_4x4 |
| `runtime.screens.behavior_map_rebuild` | `routine` | `screens` | `candidate_unreferenced` | 0 | 26l/709b | 46973-46998 | build_runtime_behavior_map_from_screen_layout |
| `runtime.screens.load_screen_stub` | `routine` | `screens` | `candidate_unreferenced` | 0 | 6l/232b | 46999-47004 | load_screen |
| `runtime.screens.load_screen_pan1_770754008863.loader` | `routine` | `screens` | `rooted` | 1 | 121l/4605b | 47133-47253 | load_screen_pan1_770754008863, load_screen_pan1_770754008863_skip_vram_copy, load_pan1_770754008863_boss_done |
| `runtime.screens.load_screen_pan2_771184738851.loader` | `routine` | `screens` | `rooted` | 1 | 121l/4604b | 47382-47502 | load_screen_pan2_771184738851, load_screen_pan2_771184738851_skip_vram_copy, load_pan2_771184738851_boss_done |
| `runtime.screens.load_screen_background1_771482721894.loader` | `routine` | `screens` | `rooted` | 1 | 117l/4622b | 47504-47620 | load_screen_background1_771482721894, load_screen_background1_771482721894_skip_vram_copy, load_background1_771482721894_boss_done |
| `runtime.screens.load_screen_pan3_771880109228.loader` | `routine` | `screens` | `rooted` | 1 | 121l/4605b | 47749-47869 | load_screen_pan3_771880109228, load_screen_pan3_771880109228_skip_vram_copy, load_pan3_771880109228_boss_done |
| `runtime.screens.load_screen_pan4_772291683578.loader` | `routine` | `screens` | `rooted` | 1 | 121l/4604b | 47998-48118 | load_screen_pan4_772291683578, load_screen_pan4_772291683578_skip_vram_copy, load_pan4_772291683578_boss_done |
| `runtime.screens.load_screen_pan5_773321312901.loader` | `routine` | `screens` | `rooted` | 1 | 118l/4490b | 48120-48237 | load_screen_pan5_773321312901, load_screen_pan5_773321312901_skip_vram_copy, load_pan5_773321312901_boss_done |
| `runtime.screens.load_screen_pan6_773382451315.loader` | `routine` | `screens` | `rooted` | 1 | 118l/4490b | 48239-48356 | load_screen_pan6_773382451315, load_screen_pan6_773382451315_skip_vram_copy, load_pan6_773382451315_boss_done |
| `runtime.screens.load_screen_pan1_2_774194791624.loader` | `routine` | `screens` | `rooted` | 1 | 121l/4657b | 48485-48605 | load_screen_pan1_2_774194791624, load_screen_pan1_2_774194791624_skip_vram_copy, load_pan1_2_774194791624_boss_done |
| `data.entities.hero_1.init` | `routine` | `entities` | `rooted` | 1 | 217l/6203b | 48893-49109 | init_hero_1 |
| `data.entities.pato_1.init` | `routine` | `entities` | `rooted` | 1 | 192l/5059b | 49128-49319 | init_pato_1 |
| `data.entities.exit_trigger.init` | `routine` | `entities` | `rooted` | 1 | 157l/4573b | 49369-49525 | init_exit_trigger |
| `data.entities.pato3.init` | `routine` | `entities` | `rooted` | 1 | 192l/5046b | 49544-49735 | init_pato3 |
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

## state-machine-dispatch-handlers

- Metrics: findings=18, patchable=0, removed_lines=0, removed_source_bytes=0
- Routines: Action_ChangeSprite, Action_CleanSprites, Action_DecVariable, Action_DisableInput, Action_EnableInput, Action_ExitCurrentWorld, Action_Nop, Action_PlaySound, Action_RegenerateHud, Action_SetCompProp, Action_SetPosition, Action_SetVariable, Condition_And, Condition_AnimComplete, Condition_DeadlyTile, Condition_HasCollision, Condition_Nop, Condition_VariableCompare

- [report-only] `Action_Nop` lines 38452-38454: `Action_Nop` is a state-machine action handler referenced by `SM_ActionTable` (33 table reference(s): SM_ActionTable@38403: `DW Action_Nop; 0`, SM_ActionTable@38405: `DW Action_Nop ; 2 [Action_MoveBy stripped]`, SM_ActionTable@38406: `DW Action_Nop ; 3 [Action_SetVelocity stripped]`). Direct external references: none. Dispatch id 0 is not listed in `project_usage.stateMachineRuntime.usedActionIds`; this is only an unused-by-metadata signal. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Action_SetPosition` lines 38455-38484: `Action_SetPosition` is a state-machine action handler referenced by `SM_ActionTable` (1 table reference(s): SM_ActionTable@38404: `DW Action_SetPosition; 1`). Direct external references: none. Dispatch id 1 is listed in `project_usage.stateMachineRuntime.usedActionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Action_ChangeSprite` lines 38550-38870: `Action_ChangeSprite` is a state-machine action handler referenced by `SM_ActionTable` (1 table reference(s): SM_ActionTable@38408: `DW Action_ChangeSprite; 5`). Direct external references: none. Dispatch id 5 is listed in `project_usage.stateMachineRuntime.usedActionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Action_PlaySound` lines 38871-38888: `Action_PlaySound` is a state-machine action handler referenced by `SM_ActionTable` (1 table reference(s): SM_ActionTable@38412: `DW Action_PlaySound; 9`). Direct external references: none. Dispatch id 9 is listed in `project_usage.stateMachineRuntime.usedActionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Action_SetVariable` lines 38889-39040: `Action_SetVariable` is a state-machine action handler referenced by `SM_ActionTable` (1 table reference(s): SM_ActionTable@38416: `DW Action_SetVariable; 13`). Direct external references: none. Dispatch id 13 is listed in `project_usage.stateMachineRuntime.usedActionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Action_DecVariable` lines 39041-39165: `Action_DecVariable` is a state-machine action handler referenced by `SM_ActionTable` (1 table reference(s): SM_ActionTable@38418: `DW Action_DecVariable; 15`). Direct external references: none. Dispatch id 15 is listed in `project_usage.stateMachineRuntime.usedActionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Action_SetCompProp` lines 39166-39407: `Action_SetCompProp` is a state-machine action handler referenced by `SM_ActionTable` (1 table reference(s): SM_ActionTable@38419: `DW Action_SetCompProp; 16`). Direct external references: none. Dispatch id 16 is listed in `project_usage.stateMachineRuntime.usedActionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Action_RegenerateHud` lines 39408-39428: `Action_RegenerateHud` is a state-machine action handler referenced by `SM_ActionTable` (1 table reference(s): SM_ActionTable@38426: `DW Action_RegenerateHud; 23`). Direct external references: none. Dispatch id 23 is listed in `project_usage.stateMachineRuntime.usedActionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Action_DisableInput` lines 39887-39897: `Action_DisableInput` is a state-machine action handler referenced by `SM_ActionTable` (1 table reference(s): SM_ActionTable@38440: `DW Action_DisableInput; 37`). Direct external references: none. Dispatch id 37 is listed in `project_usage.stateMachineRuntime.usedActionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Action_EnableInput` lines 39898-39914: `Action_EnableInput` is a state-machine action handler referenced by `SM_ActionTable` (1 table reference(s): SM_ActionTable@38441: `DW Action_EnableInput; 38`). Direct external references: none. Dispatch id 38 is listed in `project_usage.stateMachineRuntime.usedActionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Action_CleanSprites` lines 39915-39922: `Action_CleanSprites` is a state-machine action handler referenced by `SM_ActionTable` (1 table reference(s): SM_ActionTable@38442: `DW Action_CleanSprites; 39`). Direct external references: none. Dispatch id 39 is listed in `project_usage.stateMachineRuntime.usedActionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Action_ExitCurrentWorld` lines 39923-39932: `Action_ExitCurrentWorld` is a state-machine action handler referenced by `SM_ActionTable` (1 table reference(s): SM_ActionTable@38443: `DW Action_ExitCurrentWorld; 40`). Direct external references: none. Dispatch id 40 is listed in `project_usage.stateMachineRuntime.usedActionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Condition_Nop` lines 39957-39960: `Condition_Nop` is a state-machine condition handler referenced by `SM_ConditionTable` (13 table reference(s): SM_ConditionTable@39934: `DW Condition_Nop            ; 0`, SM_ConditionTable@39936: `DW Condition_Nop ; 2 [Condition_Or stripped]`, SM_ConditionTable@39937: `DW Condition_Nop ; 3 [Condition_Not stripped]`). Direct external references: none. Dispatch id 0 is not listed in `project_usage.stateMachineRuntime.usedConditionIds`; this is only an unused-by-metadata signal. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Condition_And` lines 39961-40013: `Condition_And` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@39935: `DW Condition_And            ; 1`). Direct external references: none. Dispatch id 1 is listed in `project_usage.stateMachineRuntime.usedConditionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Condition_HasCollision` lines 40014-40090: `Condition_HasCollision` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@39942: `DW Condition_HasCollision   ; 8`). Direct external references: none. Dispatch id 8 is listed in `project_usage.stateMachineRuntime.usedConditionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Condition_DeadlyTile` lines 40091-40109: `Condition_DeadlyTile` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@39945: `DW Condition_DeadlyTile     ; 11`). Direct external references: none. Dispatch id 11 is listed in `project_usage.stateMachineRuntime.usedConditionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Condition_AnimComplete` lines 40110-40132: `Condition_AnimComplete` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@39946: `DW Condition_AnimComplete   ; 12`). Direct external references: none. Dispatch id 12 is listed in `project_usage.stateMachineRuntime.usedConditionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.
- [report-only] `Condition_VariableCompare` lines 40133-40318: `Condition_VariableCompare` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@39948: `DW Condition_VariableCompare; 14`). Direct external references: none. Dispatch id 14 is listed in `project_usage.stateMachineRuntime.usedConditionIds`. Patch policy: report-only because state-machine reachability is data-driven through action/condition ids, not direct calls.

