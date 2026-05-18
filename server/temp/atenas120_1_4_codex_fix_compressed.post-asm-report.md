# Post-ASM Report

- Input: `C:\Users\salam\Documents\Programacion\Mideas\server\temp\atenas120_1_4_codex_fix_compressed.asm`
- Selected rules: dead-blocks, unused-screen-loaders, inactive-feature-runtime, unused-boss-attack-runtime, unused-component-runtime, state-machine-dispatch-handlers
- Findings: 145
- Applied patches: 100
- Original lines: 47419
- Output lines: 46854
- Net line delta: -565

- Optimization passes run: 2
- Optimization source removed: 565 lines / 17054 bytes

## Mideas Block Inventory

- Blocks: 111
- Preserved blocks: 24
- Removable-by-policy blocks: 87
- Dead-block candidates: 19
- Annotated block source: 16997 lines / 474629 bytes
- Dead-candidate source: 204 lines / 5994 bytes
- Marker errors: 2

- By kind: data=2, routine=99, trampoline=10
- By owner: animtiles=1, bosses=13, components=34, dialogues=1, entities=4, far-call=10, font=1, gameflow=7, hud=1, interrupt=5, mapper=1, resources=1, screens=10, scroll=1, sound=13, sprites=1, stateMachine=3, unified=1, worlds=3
- By status: candidate_unreferenced=19, empty=2, preserved=24, referenced=19, rooted=47

### Largest Annotated Blocks

| ID | Status | Source | Kind | Owner |
| --- | --- | --- | --- | --- |
| `runtime.statemachine.core` | `rooted` | 1852l/52596b | `routine` | `stateMachine` |
| `runtime.components.scheduler` | `rooted` | 2055l/46343b | `routine` | `components` |
| `runtime.gameflow.world_loop` | `rooted` | 1506l/45804b | `routine` | `gameflow` |
| `runtime.components.wallcollision` | `referenced` | 846l/31455b | `routine` | `components` |
| `runtime.components.collision` | `referenced` | 684l/19218b | `routine` | `components` |
| `runtime.resources.manager` | `rooted` | 692l/17765b | `routine` | `resources` |
| `runtime.components.tile_interaction` | `rooted` | 674l/17225b | `routine` | `components` |
| `runtime.components.carry` | `rooted` | 724l/14824b | `routine` | `components` |
| `runtime.components.input` | `referenced` | 393l/13136b | `routine` | `components` |
| `runtime.dialogue.system` | `preserved` | 584l/12271b | `routine` | `dialogues` |
| `runtime.components.animation` | `referenced` | 342l/10555b | `routine` | `components` |
| `runtime.components.sprite` | `rooted` | 402l/10511b | `routine` | `components` |
| `runtime.animtiles.core` | `rooted` | 325l/9460b | `routine` | `animtiles` |
| `runtime.scroll.core` | `rooted` | 332l/8535b | `routine` | `scroll` |
| `runtime.interrupt.task_input` | `rooted` | 272l/7149b | `routine` | `interrupt` |
| `runtime.components.jump` | `referenced` | 233l/7043b | `routine` | `components` |
| `runtime.font.loading` | `rooted` | 229l/6905b | `routine` | `font` |
| `runtime.components.entity_management` | `rooted` | 221l/6553b | `routine` | `components` |
| `data.entities.player_1.init` | `rooted` | 222l/6316b | `routine` | `entities` |
| `runtime.components.deadly_tiles` | `rooted` | 262l/5874b | `routine` | `components` |

- Marker error: Line 37045: @mideas:endblock without open block.
- Marker error: Line 45914: @mideas:block id=runtime.gameflow.world_loop has no closing @mideas:endblock.

## Inactive Feature Runtime Inventory

| Feature | Findings | Patchable | Annotated | Unannotated | Preserved | Owners |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `bosses` | 18 | 0 | 18 | 0 | 15 | bosses=15, far-call=3 |

## Global Label Inventory

- Global labels: 1081

| Label | Category | Source |
| --- | --- | --- |
| `FAST_SNSMAT` | `bios_helper` | 1173l/72845b |
| `update_wallcollision_component` | `runtime_code` | 545l/20577b |
| `pt3_track_0_data` | `data` | 229l/15812b |
| `Action_ChangeSprite` | `runtime_code` | 330l/14930b |
| `update_player_fastpath` | `runtime_code` | 604l/13839b |
| `execute_transition_effect` | `runtime_code` | 385l/11163b |
| `scan_tile_interaction_entities` | `runtime_code` | 394l/10835b |
| `update_entity_collision_fast` | `runtime_code` | 352l/9978b |
| `FAR_BANK_13_ROM_START` | `bank_marker` | 178l/9623b |
| `resource_table` | `data` | 625l/9533b |
| `PRESENTATION_SCREEN_PATTERNS_B2` | `data` | 131l/9095b |
| `PRESENTATION_SCREEN_COLORS_B2` | `data` | 131l/9091b |
| `update_animation_component` | `runtime_code` | 255l/8328b |
| `PRESENTATION_SCREEN_PATTERNS_B1` | `data` | 120l/8107b |
| `PRESENTATION_SCREEN_COLORS_B1` | `data` | 114l/7884b |
| `BANK_0_USED_END` | `bank_marker` | 146l/7866b |
| `load_sprite_patterns_worldmap_1778070705501` | `data` | 186l/7562b |
| `PRESENTATION_SCREEN_COLORS_B0` | `data` | 108l/7434b |
| `PRESENTATION_SCREEN_PATTERNS_B0` | `data` | 105l/7249b |
| `vdpLoop` | `bios_helper` | 192l/6712b |
| `BANK_2_USED_END` | `bank_marker` | 131l/6712b |
| `mapper_call_hl_auto` | `shared_runtime` | 147l/6325b |
| `init_player_1` | `boot_or_init` | 222l/6222b |
| `task_update_input` | `shared_runtime` | 242l/6074b |
| `execute_transition_reveal_target` | `runtime_code` | 322l/5672b |
| `screen_runtime_summary_table` | `data` | 106l/5176b |
| `jump_update_loop` | `runtime_code` | 157l/4675b |
| `rebuild_used_entity_list` | `runtime_code` | 207l/4475b |
| `init_fakeplayer_1` | `boot_or_init` | 162l/4450b |
| `init_caixa_1` | `boot_or_init` | 160l/4211b |

### Largest Unannotated Global Labels

- Unannotated labels: 570

| Category | Labels | Source |
| --- | ---: | ---: |
| `bank_marker` | 17 | 837l/39105b |
| `bios_helper` | 9 | 1809l/91871b |
| `boot_or_init` | 30 | 982l/25830b |
| `data` | 266 | 3815l/165764b |
| `far_trampoline` | 71 | 1275l/28075b |
| `runtime_code` | 163 | 4590l/116260b |
| `runtime_inner_label` | 8 | 156l/4287b |
| `screen_loader` | 4 | 100l/2486b |
| `shared_runtime` | 2 | 32l/1222b |

| Label | Category | Source |
| --- | --- | --- |
| `FAST_SNSMAT` | `bios_helper` | 1173l/72845b |
| `pt3_track_0_data` | `data` | 229l/15812b |
| `execute_transition_effect` | `runtime_code` | 385l/11163b |
| `FAR_BANK_13_ROM_START` | `bank_marker` | 178l/9623b |
| `resource_table` | `data` | 625l/9533b |
| `PRESENTATION_SCREEN_PATTERNS_B2` | `data` | 131l/9095b |
| `PRESENTATION_SCREEN_COLORS_B2` | `data` | 131l/9091b |
| `PRESENTATION_SCREEN_PATTERNS_B1` | `data` | 120l/8107b |
| `PRESENTATION_SCREEN_COLORS_B1` | `data` | 114l/7884b |
| `BANK_0_USED_END` | `bank_marker` | 146l/7866b |
| `load_sprite_patterns_worldmap_1778070705501` | `data` | 186l/7562b |
| `PRESENTATION_SCREEN_COLORS_B0` | `data` | 108l/7434b |
| `PRESENTATION_SCREEN_PATTERNS_B0` | `data` | 105l/7249b |
| `vdpLoop` | `bios_helper` | 192l/6712b |
| `BANK_2_USED_END` | `bank_marker` | 131l/6712b |
| `execute_transition_reveal_target` | `runtime_code` | 322l/5672b |
| `screen_runtime_summary_table` | `data` | 106l/5176b |
| `init_entities` | `boot_or_init` | 153l/3553b |
| `PRESENTATION_SCREEN_NAMETBL` | `data` | 52l/3486b |
| `init_char0_color` | `boot_or_init` | 127l/3471b |
| `tilebank_pattern_data_1` | `data` | 50l/3404b |
| `tilebank_pattern_data_0` | `data` | 48l/3253b |
| `FAR_BANK_8_ROM_START` | `bank_marker` | 79l/3183b |
| `FAR_BANK_12_ROM_START` | `bank_marker` | 82l/2959b |
| `load_sprite_patterns_worldmap_1778241700081` | `data` | 72l/2850b |
| `gameflow_handle_transition` | `runtime_code` | 62l/2773b |
| `gameflow_world_game_loop` | `runtime_code` | 81l/2698b |
| `FAST_LDIRVM` | `bios_helper` | 82l/2640b |
| `restart_rom_continue` | `boot_or_init` | 83l/2480b |
| `wallgrab_input_toward_wall_c` | `runtime_code` | 119l/2455b |

| ID | Kind | Owner | Status | Incoming | Source | Lines | Labels |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `runtime.mapper.core` | `routine` | `mapper` | `rooted` | 181 | 213l/5412b | 20059-20271 | mapper_runtime_init, mapper_set_bank_p1, mapper_set_bank_p2, mapper_set_bank_p3, mapper_set_bank_p4, ... (+14) |
| `runtime.resources.manager` | `routine` | `resources` | `rooted` | 128 | 692l/17765b | 21072-21763 | resource_manager_init, resource_invalidate_pattern_vram_cache, resource_invalidate_color_vram_cache, resource_invalidate_font_vram_cache, resource_invalidate_gameplay_vram_cache, ... (+14) |
| `runtime.components.input_trigger_level` | `routine` | `components` | `candidate_unreferenced` | 0 | 33l/773b | 21845-21877 | component_trigger_level_pressed_a |
| `runtime.page0.stubs` | `routine` | `unified` | `rooted` | 1 | 22l/505b | 21884-21905 | init_page0_runtime_state, page0_map_expanded_slot, page0_map_game_rom, page0_restore_bios_rom, page0_copy_chunk_to_buffer, ... (+2) |
| `runtime.interrupt.stop` | `routine` | `interrupt` | `rooted` | 0 | 43l/1299b | 21986-22028 | stop_interrupt_system |
| `runtime.interrupt.dispatcher` | `routine` | `interrupt` | `preserved` | 1 | 124l/4150b | 22030-22153 | interrupt_dispatcher |
| `runtime.interrupt.vblank_flag` | `routine` | `interrupt` | `rooted` | 1 | 35l/983b | 22166-22200 | update_vblank_flag |
| `runtime.interrupt.task_api` | `routine` | `interrupt` | `rooted` | 1 | 121l/3195b | 22205-22325 | enable_task, disable_task, get_frame_count |
| `runtime.interrupt.task_input` | `routine` | `interrupt` | `rooted` | 2 | 272l/7149b | 22329-22600 | init_default_tasks_from_plan, task_update_input |
| `runtime.far_trampoline.init_sound_system_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/709b | 22655-22680 | init_sound_system_far |
| `runtime.far_trampoline.task_audio_tick_far` | `trampoline` | `far-call` | `preserved` | 0 | 26l/695b | 22682-22707 | task_audio_tick_far |
| `runtime.far_trampoline.sfx_update_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/660b | 22709-22734 | sfx_update_far |
| `runtime.far_trampoline.music_update_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/674b | 22736-22761 | music_update_far |
| `runtime.far_trampoline.music_stop_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/660b | 22763-22788 | music_stop_far |
| `runtime.far_trampoline.music_play_track_far` | `trampoline` | `far-call` | `preserved` | 1 | 28l/739b | 22790-22817 | music_play_track_far |
| `runtime.far_trampoline.music_execute_command_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/737b | 22819-22844 | music_execute_command_far |
| `runtime.far_trampoline.init_boss_system_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/703b | 24271-24296 | init_boss_system_far |
| `runtime.far_trampoline.init_screen_boss_from_current_screen_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/843b | 24298-24323 | init_screen_boss_from_current_screen_far |
| `runtime.far_trampoline.update_boss_system_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/717b | 24325-24350 | update_boss_system_far |
| `runtime.sound.resident.init` | `routine` | `sound` | `referenced` | 1 | 4l/184b | 24428-24431 | call_init_sound_system_resident |
| `runtime.sound.resident.tick` | `routine` | `sound` | `referenced` | 6 | 18l/606b | 24433-24450 | call_task_audio_tick_resident |
| `runtime.sound.resident.music_update` | `routine` | `sound` | `referenced` | 2 | 4l/190b | 24452-24455 | call_music_update_resident |
| `runtime.sound.resident.sfx_update` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/182b | 24457-24460 | call_sfx_update_resident |
| `runtime.sound.resident.music_stop` | `routine` | `sound` | `referenced` | 1 | 4l/182b | 24462-24465 | call_music_stop_resident |
| `runtime.sound.resident.music_play_track` | `routine` | `sound` | `referenced` | 2 | 4l/206b | 24467-24470 | call_music_play_track_resident |
| `runtime.sound.resident.music_execute_command` | `routine` | `sound` | `referenced` | 1 | 4l/226b | 24472-24475 | call_music_execute_command_resident |
| `runtime.boss.resident.init` | `routine` | `bosses` | `preserved` | 0 | 4l/232b | 24589-24592 | call_init_boss_system_resident |
| `runtime.boss.resident.init_screen` | `routine` | `bosses` | `preserved` | 0 | 4l/306b | 24594-24597 | call_init_screen_boss_from_current_screen_resident |
| `runtime.boss.resident.update` | `routine` | `bosses` | `preserved` | 0 | 4l/242b | 24599-24602 | call_update_boss_system_resident |
| `runtime.boss.resident.update_projectile` | `routine` | `bosses` | `preserved` | 0 | 4l/279b | 24604-24607 | call_update_boss_projectile_runtime_resident |
| `runtime.boss.resident.draw_attack` | `routine` | `bosses` | `preserved` | 0 | 4l/239b | 24609-24612 | call_draw_boss_attack_resident |
| `runtime.boss.resident.draw_meteor` | `routine` | `bosses` | `preserved` | 0 | 4l/253b | 24614-24617 | call_draw_boss_meteor_attack_resident |
| `runtime.boss.resident.draw_bomb` | `routine` | `bosses` | `preserved` | 0 | 4l/245b | 24619-24622 | call_draw_boss_bomb_attack_resident |
| `runtime.boss.resident.draw_boomerang` | `routine` | `bosses` | `preserved` | 0 | 4l/265b | 24624-24627 | call_draw_boss_boomerang_attack_resident |
| `runtime.boss.resident.draw_rock` | `routine` | `bosses` | `preserved` | 0 | 4l/245b | 24629-24632 | call_draw_boss_rock_attack_resident |
| `runtime.boss.resident.draw_laser` | `routine` | `bosses` | `preserved` | 0 | 4l/249b | 24634-24637 | call_draw_boss_laser_attack_resident |
| `runtime.boss.resident.draw_sine_wave` | `routine` | `bosses` | `preserved` | 0 | 4l/265b | 24639-24642 | call_draw_boss_sine_wave_attack_resident |
| `runtime.boss.resident.draw_homing_missile` | `routine` | `bosses` | `preserved` | 0 | 4l/285b | 24644-24647 | call_draw_boss_homing_missile_attack_resident |
| `runtime.components.init` | `routine` | `components` | `rooted` | 17 | 105l/3518b | 24913-25017 | component_fill_32_a, init_components |
| `runtime.components.position` | `routine` | `components` | `rooted` | 3 | 120l/3613b | 25019-25138 | init_position_system, update_position_component, position_update_loop, position_next_entity |
| `runtime.components.sprite` | `routine` | `components` | `rooted` | 6 | 402l/10511b | 25139-25540 | init_sprite_system, update_sprite_component, sprite_update_loop, sprite_layer_loop, sprite_continue, ... (+6) |
| `runtime.components.movement_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 25546-25549 | update_movement_component |
| `runtime.components.collision` | `routine` | `components` | `referenced` | 2 | 684l/19218b | 25550-26233 | init_collision_system, update_collision_component, collision_update_loop, collision_next_entity, update_entity_collision_fast, ... (+13) |
| `runtime.components.behavior_tile` | `routine` | `components` | `rooted` | 13 | 110l/3809b | 26234-26343 | get_behavior_tile, get_behavior_tile_nb, gbt_oob |
| `runtime.components.directional_sprite_sync` | `routine` | `components` | `rooted` | 3 | 87l/2084b | 26344-26430 | component_sync_directional_sprite_from_initial, component_sync_directional_sprite_from_current, component_sync_directional_sprite_common |
| `runtime.components.input` | `routine` | `components` | `referenced` | 2 | 393l/13136b | 26431-26823 | init_input_system, update_input_component, input_update_loop, input_move_up, input_move_down, ... (+16) |
| `runtime.components.behavior_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 26829-26832 | update_behavior_component |
| `runtime.components.health` | `routine` | `components` | `rooted` | 3 | 152l/4701b | 26833-26984 | init_health_system, update_health_component, decrease_entity_lives, increase_entity_lives |
| `runtime.components.animation` | `routine` | `components` | `referenced` | 4 | 342l/10555b | 26985-27326 | init_animation_system, update_animation_component, anim_done_entity, refresh_player_animation_fastpath |
| `runtime.components.jump` | `routine` | `components` | `referenced` | 2 | 233l/7043b | 27327-27559 | init_jump_system, update_jump_component, jump_update_loop, jump_done_entity, jump_next_entity |
| `runtime.components.gravity` | `routine` | `components` | `rooted` | 2 | 137l/4553b | 27560-27696 | init_gravity_system, update_gravity_component, gravity_update_loop, gravity_store_vel, gravity_grounded, ... (+2) |
| `runtime.components.walljump_stub` | `routine` | `components` | `referenced` | 2 | 18l/326b | 28442-28459 | init_walljump_system, update_walljump_component, walljump_process_entity_c, walljump_input_is_left, walljump_input_is_right |
| `runtime.components.auto_destroy_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/219b | 28462-28468 | init_auto_destroy_system, update_auto_destroy_component |
| `runtime.components.state_machine_component_stub` | `routine` | `components` | `referenced` | 1 | 7l/241b | 28492-28498 | init_statemachine_system, update_statemachine_component |
| `runtime.components.retractable_gate_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/196b | 28504-28507 | update_retractable_gate_component |
| `runtime.components.damage_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/166b | 28517-28520 | update_damage_component |
| `runtime.components.shoot_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/163b | 28526-28529 | update_shoot_component |
| `runtime.components.platform_riding_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/220b | 28549-28555 | prepare_platform_detection, update_platform_riding |
| `runtime.components.wallcollision` | `routine` | `components` | `referenced` | 8 | 846l/31455b | 28556-29401 | init_wallcollision_system, wall_behavior_is_full_blocker, wall_down_behavior_blocks, update_wallcollision_component, wall_build_hitbox_cache, ... (+2) |
| `runtime.components.deadly_tiles` | `routine` | `components` | `rooted` | 3 | 262l/5874b | 29402-29663 | init_deadly_tiles_system, deadly_tiles_runtime_tile_is_deadly_nb, update_entity_deadly_flag_runtime, update_deadly_tiles_component, refresh_player_deadly_fastpath |
| `runtime.components.in_water_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 29669-29672 | update_in_water_component |
| `runtime.components.collectible_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/181b | 29678-29681 | update_collectible_component |
| `runtime.components.tile_interaction` | `routine` | `components` | `rooted` | 4 | 674l/17225b | 29682-30355 | interaction_target_variable_ptr_table, interaction_target_variable_word_table, init_tile_interaction_system, update_slash_component, record_bonus_respawn_slot, ... (+11) |
| `runtime.components.collected_tiles` | `routine` | `components` | `rooted` | 1 | 76l/3015b | 30356-30431 | apply_collected_tiles |
| `runtime.components.mirror_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/166b | 30437-30440 | update_mirror_component |
| `runtime.components.entity_management` | `routine` | `components` | `rooted` | 3 | 221l/6553b | 30441-30661 | create_entity, entity_job_set, entity_job_set_period_ok, entity_job_set_entry_wrap, entity_job_set_entry_ok, ... (+13) |
| `runtime.components.scheduler` | `routine` | `components` | `rooted` | 8 | 2055l/46343b | 30662-32716 | update_all_entities, mark_used_entity_list_dirty, ensure_used_entity_list_current, rebuild_used_entity_list, ensure_player_fast_runtime_bound, ... (+36) |
| `runtime.components.carry` | `routine` | `components` | `rooted` | 60 | 724l/14824b | 31221-31944 | entity_carry_enabled_init, entity_carry_sprite_index_init, entity_box_carriable_init, entity_box_tile_width_init, entity_box_tile_height_init, ... (+20) |
| `runtime.components.state_machine_executor` | `routine` | `components` | `rooted` | 2 | 74l/1973b | 32722-32795 | execute_all_state_machines, refresh_player_state_machine_fastpath |
| `runtime.components.legacy_tile_collision` | `routine` | `components` | `referenced` | 3 | 43l/1404b | 32805-32847 | get_tile_at_position, get_tile_behavior, tile_behavior_table, check_collision_at_point, check_collision_box, ... (+1) |
| `runtime.components.secret_zone_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/181b | 32884-32887 | update_secret_zone_component |
| `runtime.statemachine.core` | `routine` | `stateMachine` | `rooted` | 4 | 1852l/52596b | 32895-34746 | SM_Update, sm_timer_no_overflow, sm_timer_paused, sm_update_done, SM_ShouldPauseTimerForDialogue, ... (+34) |
| `data.statemachine.statemachine_1778070349580` | `data` | `stateMachine` | `rooted` | 2 | 112l/2808b | 34825-34936 | SM_state1_state_1778070362171, SM_state1_state_1778070362171_OnEnter, SM_state1_state_1778070362171_Transitions, SM_state1_state_1778070367956, SM_state1_state_1778070367956_OnEnter, ... (+13) |
| `data.statemachine.statemachine_dialog_jump_test` | `data` | `stateMachine` | `rooted` | 1 | 24l/895b | 34937-34960 | SM_dialog_jump_to_pantalla2_state_dialog_wait, SM_dialog_jump_to_pantalla2_state_dialog_wait_Transitions, SM_dialog_jump_to_pantalla2_state_dialog_wait_Transitions_Actions_0, SM_dialog_jump_to_pantalla2_state_dialog_done |
| `runtime.gameflow.worldlink` | `routine` | `gameflow` | `rooted` | 1 | 82l/2388b | 35090-35171 | gameflow_handle_worldlink |
| `runtime.gameflow.end_screen` | `routine` | `gameflow` | `rooted` | 1 | 57l/1892b | 35173-35229 | gameflow_handle_end |
| `runtime.gameflow.presentation_wait_frames` | `routine` | `gameflow` | `empty` | 0 | 3l/230b | 35270-35272 |  |
| `runtime.gameflow.connection_by_type` | `routine` | `gameflow` | `empty` | 0 | 3l/216b | 36951-36953 |  |
| `runtime.sound.init` | `routine` | `sound` | `rooted` | 1 | 22l/725b | 38994-39015 | init_sound_system |
| `runtime.sound.tick` | `routine` | `sound` | `rooted` | 1 | 17l/320b | 39022-39038 | task_audio_tick |
| `runtime.sound.psg_lowlevel` | `routine` | `sound` | `rooted` | 27 | 117l/3450b | 39043-39159 | psg_write, psg_set_tone, psg_set_volume, psg_set_noise, psg_set_mixer, ... (+1) |
| `runtime.sound.sfx_silence` | `routine` | `sound` | `referenced` | 2 | 21l/579b | 39169-39189 | sfx_silence_all |
| `runtime.sound.sfx_builtin_effects` | `routine` | `sound` | `referenced` | 6 | 127l/3025b | 39195-39321 | sfx_beep, sfx_jump, sfx_shoot, sfx_explosion, sfx_coin, ... (+1) |
| `runtime.sound.sfx_playback` | `routine` | `sound` | `referenced` | 1 | 119l/2384b | 39339-39457 | play_sound_effect, play_sound_effect_beep, play_sound_effect_jump, play_sound_effect_shoot, play_sound_effect_explosion, ... (+4) |
| `runtime.screens.colors` | `routine` | `screens` | `rooted` | 1 | 44l/1514b | 39931-39974 | color_shift_table, set_screen_colors |
| `runtime.screens.copy_rect` | `routine` | `screens` | `rooted` | 0 | 77l/1494b | 40103-40179 | copy_layout_rect_to_vram, copy_layout_rect_ram_to_ram |
| `runtime.screens.block_layout_expander` | `routine` | `screens` | `rooted` | 4 | 194l/3782b | 40181-40374 | expand_screen_block_layout_to_background, expand_screen_block_layout_2x2, expand_screen_block_layout_4x4 |
| `runtime.screens.behavior_map_rebuild` | `routine` | `screens` | `candidate_unreferenced` | 0 | 26l/709b | 40392-40417 | build_runtime_behavior_map_from_screen_layout |
| `runtime.screens.load_screen_stub` | `routine` | `screens` | `candidate_unreferenced` | 0 | 6l/232b | 40418-40423 | load_screen |
| `runtime.screens.load_screen_pantalla1_778062394614.loader` | `routine` | `screens` | `rooted` | 1 | 130l/5132b | 40425-40554 | load_screen_pantalla1_778062394614, load_screen_pantalla1_778062394614_skip_vram_copy, load_pantalla1_778062394614_boss_done |
| `runtime.screens.load_screen_pantalla2_778230236021.loader` | `routine` | `screens` | `rooted` | 1 | 130l/5133b | 40556-40685 | load_screen_pantalla2_778230236021, load_screen_pantalla2_778230236021_skip_vram_copy, load_pantalla2_778230236021_boss_done |
| `runtime.screens.load_screen_pantalla3_778230684484.loader` | `routine` | `screens` | `rooted` | 1 | 130l/5132b | 40687-40816 | load_screen_pantalla3_778230684484, load_screen_pantalla3_778230684484_skip_vram_copy, load_pantalla3_778230684484_boss_done |
| `runtime.screens.load_screen_d_pantalla1_778241953722.loader` | `routine` | `screens` | `rooted` | 1 | 133l/5315b | 40818-40950 | load_screen_d_pantalla1_778241953722, load_screen_d_pantalla1_778241953722_skip_vram_copy, load_d_pantalla1_778241953722_boss_done |
| `data.entities.player_1.init` | `routine` | `entities` | `rooted` | 1 | 222l/6316b | 41202-41423 | init_player_1 |
| `data.entities.caixa_1.init` | `routine` | `entities` | `rooted` | 1 | 160l/4303b | 41442-41601 | init_caixa_1 |
| `data.entities.fakeplayer_1.init` | `routine` | `entities` | `rooted` | 1 | 162l/4552b | 41620-41781 | init_fakeplayer_1 |
| `runtime.entities.patrol_facing` | `routine` | `entities` | `rooted` | 0 | 88l/2125b | 41958-42045 | update_entity_patrol_facing |
| `runtime.dialogue.system` | `routine` | `dialogues` | `preserved` | 5 | 584l/12271b | 42885-43468 | dialogue_update_typewriter, dialogue_typewriter_emit, dialogue_typewriter_newline, dialogue_typewriter_done, dialogue_open_box, ... (+25) |
| `runtime.sprites.show_sprite_legacy` | `routine` | `sprites` | `candidate_unreferenced` | 0 | 43l/981b | 44262-44304 | show_sprite |
| `runtime.screens.presentation_wait_frames` | `routine` | `screens` | `candidate_unreferenced` | 0 | 13l/298b | 44661-44673 | presentation_wait_frames |
| ... | ... | ... | ... | ... | ... | ... | +11 more blocks |

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

## ROM Validation

- Original ROM bytes: 188416
- Optimized ROM bytes: 188416
- ROM byte delta: 0
- ROM SHA256 equal: False

## dead-blocks

- Metrics: findings=19, patchable=19, removed_lines=204, removed_source_bytes=5994
- Routines: runtime.components.auto_destroy_stub, runtime.components.behavior_stub, runtime.components.collectible_stub, runtime.components.damage_stub, runtime.components.in_water_stub, runtime.components.input_trigger_level, runtime.components.mirror_stub, runtime.components.movement_stub, runtime.components.platform_riding_stub, runtime.components.retractable_gate_stub, runtime.components.secret_zone_stub, runtime.components.shoot_stub, runtime.hud.empty_update_stubs, runtime.screens.behavior_map_rebuild, runtime.screens.load_screen_stub, runtime.screens.presentation_wait_frames, runtime.sound.resident.sfx_update, runtime.sprites.show_sprite_legacy, runtime.worlds.current_screen_helpers

- [patchable] `runtime.components.input_trigger_level` lines 21845-21877: Block `runtime.components.input_trigger_level` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: component_trigger_level_pressed_a.
- [patchable] `runtime.sound.resident.sfx_update` lines 24457-24460: Block `runtime.sound.resident.sfx_update` (routine/sound) is a dead-code candidate. No external references found for any global label in this block. Labels: call_sfx_update_resident.
- [patchable] `runtime.components.movement_stub` lines 25546-25549: Block `runtime.components.movement_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_movement_component.
- [patchable] `runtime.components.behavior_stub` lines 26829-26832: Block `runtime.components.behavior_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_behavior_component.
- [patchable] `runtime.components.auto_destroy_stub` lines 28462-28468: Block `runtime.components.auto_destroy_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: init_auto_destroy_system, update_auto_destroy_component.
- [patchable] `runtime.components.retractable_gate_stub` lines 28504-28507: Block `runtime.components.retractable_gate_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_retractable_gate_component.
- [patchable] `runtime.components.damage_stub` lines 28517-28520: Block `runtime.components.damage_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_damage_component.
- [patchable] `runtime.components.shoot_stub` lines 28526-28529: Block `runtime.components.shoot_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_shoot_component.
- [patchable] `runtime.components.platform_riding_stub` lines 28549-28555: Block `runtime.components.platform_riding_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: prepare_platform_detection, update_platform_riding.
- [patchable] `runtime.components.in_water_stub` lines 29669-29672: Block `runtime.components.in_water_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_in_water_component.
- [patchable] `runtime.components.collectible_stub` lines 29678-29681: Block `runtime.components.collectible_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_collectible_component.
- [patchable] `runtime.components.mirror_stub` lines 30437-30440: Block `runtime.components.mirror_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_mirror_component.
- [patchable] `runtime.components.secret_zone_stub` lines 32884-32887: Block `runtime.components.secret_zone_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_secret_zone_component.
- [patchable] `runtime.screens.behavior_map_rebuild` lines 40392-40417: Block `runtime.screens.behavior_map_rebuild` (routine/screens) is a dead-code candidate. No external references found for any global label in this block. Labels: build_runtime_behavior_map_from_screen_layout.
- [patchable] `runtime.screens.load_screen_stub` lines 40418-40423: Block `runtime.screens.load_screen_stub` (routine/screens) is a dead-code candidate. No external references found for any global label in this block. Labels: load_screen.
- [patchable] `runtime.sprites.show_sprite_legacy` lines 44262-44304: Block `runtime.sprites.show_sprite_legacy` (routine/sprites) is a dead-code candidate. No external references found for any global label in this block. Labels: show_sprite.
- [patchable] `runtime.screens.presentation_wait_frames` lines 44661-44673: Block `runtime.screens.presentation_wait_frames` (routine/screens) is a dead-code candidate. No external references found for any global label in this block. Labels: presentation_wait_frames.
- [patchable] `runtime.worlds.current_screen_helpers` lines 45316-45338: Block `runtime.worlds.current_screen_helpers` (routine/worlds) is a dead-code candidate. No external references found for any global label in this block. Labels: get_current_world_id, get_current_screen_index, set_current_screen.
- [patchable] `runtime.hud.empty_update_stubs` lines 47407-47412: Block `runtime.hud.empty_update_stubs` (routine/hud) is a dead-code candidate. No external references found for any global label in this block. Labels: update_hud_score, update_hud_lives.

## inactive-feature-runtime

- Metrics: findings=37, patchable=18, removed_lines=144, removed_source_bytes=5771
- Routines: call_draw_boss_attack_resident, call_draw_boss_bomb_attack_resident, call_draw_boss_boomerang_attack_resident, call_draw_boss_homing_missile_attack_resident, call_draw_boss_laser_attack_resident, call_draw_boss_meteor_attack_resident, call_draw_boss_rock_attack_resident, call_draw_boss_sine_wave_attack_resident, call_init_boss_system_resident, call_init_screen_boss_from_current_screen_resident, call_update_boss_projectile_runtime_resident, call_update_boss_system_resident, init_boss_system, init_boss_system_far, init_screen_boss_from_current_screen, init_screen_boss_from_current_screen_far, runtime.boss.group.stubs, runtime.boss.group.stubs:call_draw_boss_attack_resident, runtime.boss.group.stubs:call_draw_boss_bomb_attack_resident, runtime.boss.group.stubs:call_draw_boss_boomerang_attack_resident, runtime.boss.group.stubs:call_draw_boss_homing_missile_attack_resident, runtime.boss.group.stubs:call_draw_boss_laser_attack_resident, runtime.boss.group.stubs:call_draw_boss_meteor_attack_resident, runtime.boss.group.stubs:call_draw_boss_rock_attack_resident, runtime.boss.group.stubs:call_draw_boss_sine_wave_attack_resident, runtime.boss.group.stubs:call_init_boss_system_resident, runtime.boss.group.stubs:call_init_screen_boss_from_current_screen_resident, runtime.boss.group.stubs:call_update_boss_projectile_runtime_resident, runtime.boss.group.stubs:call_update_boss_system_resident, runtime.boss.group.stubs:init_boss_system, runtime.boss.group.stubs:init_boss_system_far, runtime.boss.group.stubs:init_screen_boss_from_current_screen, runtime.boss.group.stubs:init_screen_boss_from_current_screen_far, runtime.boss.group.stubs:update_boss_system, runtime.boss.group.stubs:update_boss_system_far, update_boss_system, update_boss_system_far

- [patchable] `runtime.boss.group.stubs:init_boss_system_far` lines 24271-24296: `init_boss_system_far` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.boss.group.stubs` lines 24272-47383: `runtime.boss.group.stubs` groups inactive boss compatibility stubs runtime labels: call_draw_boss_attack_resident, call_draw_boss_bomb_attack_resident, call_draw_boss_boomerang_attack_resident, call_draw_boss_homing_missile_attack_resident, call_draw_boss_laser_attack_resident, call_draw_boss_meteor_attack_resident, call_draw_boss_rock_attack_resident, call_draw_boss_sine_wave_attack_resident, call_init_boss_system_resident, call_init_screen_boss_from_current_screen_resident, call_update_boss_projectile_runtime_resident, call_update_boss_system_resident, init_boss_system, init_boss_system_far, init_screen_boss_from_current_screen, init_screen_boss_from_current_screen_far, update_boss_system, update_boss_system_far. No external references outside the group were found. This is ready for a future atomic multi-window patch, or for dead-blocks to remove the annotated windows as whole groups. Atomic patch enabled as `runtime.boss.group.stubs` with 18 window(s).
- [report-only] `init_boss_system_far` lines 24272-24298: `init_boss_system_far` looks like bosses runtime (27 lines, 724 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: boot_or_init (Boot/init routine). External references still exist (1): call_init_boss_system_resident@24591. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.far_trampoline.init_boss_system_far` owner=`far-call` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:init_screen_boss_from_current_screen_far` lines 24298-24323: `init_screen_boss_from_current_screen_far` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `init_screen_boss_from_current_screen_far` lines 24299-24325: `init_screen_boss_from_current_screen_far` looks like bosses runtime (27 lines, 826 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: boot_or_init (Boot/init routine). External references still exist (1): call_init_screen_boss_from_current_screen_resident@24596. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.far_trampoline.init_screen_boss_from_current_screen_far` owner=`far-call` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:update_boss_system_far` lines 24325-24350: `update_boss_system_far` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `update_boss_system_far` lines 24326-24354: `update_boss_system_far` looks like bosses runtime (29 lines, 681 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_update_boss_system_resident@24601. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.far_trampoline.update_boss_system_far` owner=`far-call` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_init_boss_system_resident` lines 24589-24592: `call_init_boss_system_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_init_boss_system_resident` lines 24590-24594: `call_init_boss_system_resident` looks like bosses runtime (5 lines, 260 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.init` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_init_screen_boss_from_current_screen_resident` lines 24594-24597: `call_init_screen_boss_from_current_screen_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_init_screen_boss_from_current_screen_resident` lines 24595-24599: `call_init_screen_boss_from_current_screen_resident` looks like bosses runtime (5 lines, 284 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.init_screen` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_update_boss_system_resident` lines 24599-24602: `call_update_boss_system_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_update_boss_system_resident` lines 24600-24604: `call_update_boss_system_resident` looks like bosses runtime (5 lines, 266 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.update` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_update_boss_projectile_runtime_resident` lines 24604-24607: `call_update_boss_projectile_runtime_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_update_boss_projectile_runtime_resident` lines 24605-24609: `call_update_boss_projectile_runtime_resident` looks like bosses runtime (5 lines, 260 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.update_projectile` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_attack_resident` lines 24609-24612: `call_draw_boss_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_attack_resident` lines 24610-24614: `call_draw_boss_attack_resident` looks like bosses runtime (5 lines, 247 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_attack` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_meteor_attack_resident` lines 24614-24617: `call_draw_boss_meteor_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_meteor_attack_resident` lines 24615-24619: `call_draw_boss_meteor_attack_resident` looks like bosses runtime (5 lines, 250 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_meteor` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_bomb_attack_resident` lines 24619-24622: `call_draw_boss_bomb_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_bomb_attack_resident` lines 24620-24624: `call_draw_boss_bomb_attack_resident` looks like bosses runtime (5 lines, 256 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_bomb` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_boomerang_attack_resident` lines 24624-24627: `call_draw_boss_boomerang_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_boomerang_attack_resident` lines 24625-24629: `call_draw_boss_boomerang_attack_resident` looks like bosses runtime (5 lines, 256 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_boomerang` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_rock_attack_resident` lines 24629-24632: `call_draw_boss_rock_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_rock_attack_resident` lines 24630-24634: `call_draw_boss_rock_attack_resident` looks like bosses runtime (5 lines, 248 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_rock` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_laser_attack_resident` lines 24634-24637: `call_draw_boss_laser_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_laser_attack_resident` lines 24635-24639: `call_draw_boss_laser_attack_resident` looks like bosses runtime (5 lines, 258 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_laser` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_sine_wave_attack_resident` lines 24639-24642: `call_draw_boss_sine_wave_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_sine_wave_attack_resident` lines 24640-24644: `call_draw_boss_sine_wave_attack_resident` looks like bosses runtime (5 lines, 276 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_sine_wave` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_homing_missile_attack_resident` lines 24644-24647: `call_draw_boss_homing_missile_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_homing_missile_attack_resident` lines 24645-24648: `call_draw_boss_homing_missile_attack_resident` looks like bosses runtime (4 lines, 133 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_homing_missile` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:init_boss_system` lines 47360-47373: `init_boss_system` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `init_boss_system` lines 47360-47374: `init_boss_system` looks like bosses runtime (15 lines, 330 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: boot_or_init (Boot/init routine). External references still exist (1): init_boss_system_far@24281. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.boss.entry` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:update_boss_system` lines 47375-47376: `update_boss_system` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `update_boss_system` lines 47375-47377: `update_boss_system` looks like bosses runtime (3 lines, 29 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): update_boss_system_far@24335. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.boss.entry` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:init_screen_boss_from_current_screen` lines 47378-47379: `init_screen_boss_from_current_screen` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `init_screen_boss_from_current_screen` lines 47378-47383: `init_screen_boss_from_current_screen` looks like bosses runtime (6 lines, 140 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: boot_or_init (Boot/init routine). External references still exist (1): init_screen_boss_from_current_screen_far@24308. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.boss.entry` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.

## unused-component-runtime

- Metrics: findings=23, patchable=14, removed_lines=47, removed_source_bytes=1627
- Routines: runtime.components.system.auto_destroy, runtime.components.system.auto_destroy:init_auto_destroy_system, runtime.components.system.behavior, runtime.components.system.behavior:update_behavior_component, runtime.components.system.collectible, runtime.components.system.collectible:init_collectible_system, runtime.components.system.collectible:update_collectible_component, runtime.components.system.damage, runtime.components.system.damage:init_damage_system, runtime.components.system.damage:update_damage_component, runtime.components.system.in_water, runtime.components.system.in_water:init_in_water_system, runtime.components.system.in_water:update_in_water_component, runtime.components.system.movement, runtime.components.system.movement:init_movement_system, runtime.components.system.movement:update_movement_component, runtime.components.system.retractable_gate, runtime.components.system.retractable_gate:init_retractable_gate_system, runtime.components.system.retractable_gate:update_retractable_gate_component, runtime.components.system.shoot, runtime.components.system.shoot:init_shoot_system, runtime.components.system.shoot:update_shoot_component, runtime.components.system.wall_jump

- [report-only] `runtime.components.system.movement` lines 25543-25555: `runtime.components.system.movement` covers unused movement component labels: init_movement_system, update_movement_component. `project_usage.componentRuntime.usedComponents` is Animation, AutoControlScript, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, WallGrab, comp_box, so component type `Movement` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.movement` with 2 window(s).
- [patchable] `runtime.components.system.movement:init_movement_system` lines 25543-25544: `init_movement_system` is part of unused component runtime group `runtime.components.system.movement`. The group has no external references, so this window is removed only together with the other group windows.
- [patchable] `runtime.components.system.movement:update_movement_component` lines 25546-25549: `update_movement_component` is part of unused component runtime group `runtime.components.system.movement`. The group has no external references, so this window is removed only together with the other group windows.
- [patchable] `runtime.components.system.behavior:update_behavior_component` lines 26829-26832: `update_behavior_component` is part of unused component runtime group `runtime.components.system.behavior`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.components.system.behavior` lines 26830-26842: `runtime.components.system.behavior` covers unused behavior component labels: update_behavior_component. `project_usage.componentRuntime.usedComponents` is Animation, AutoControlScript, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, WallGrab, comp_box, so component type `Behavior` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.behavior` with 1 window(s).
- [report-only] `runtime.components.system.wall_jump` lines 28443-28462: `runtime.components.system.wall_jump` covers unused wall-jump component labels: init_walljump_system, update_walljump_component, walljump_input_is_left, walljump_input_is_right, walljump_process_entity_c. `project_usage.componentRuntime.usedComponents` is Animation, AutoControlScript, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, WallGrab, comp_box, so component type `WallJump` is not used by active entities. External references still exist (2): update_player_fastpath->walljump_process_entity_c@32460, update_player_fastpath->walljump_process_entity_c@32663. Deletion stays blocked until the scheduler/caller path is proven dead or grouped. Patch policy: report-only.
- [patchable] `runtime.components.system.auto_destroy:init_auto_destroy_system` lines 28462-28468: `init_auto_destroy_system` is part of unused component runtime group `runtime.components.system.auto_destroy`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.components.system.auto_destroy` lines 28463-28477: `runtime.components.system.auto_destroy` covers unused auto-destroy component labels: init_auto_destroy_system, update_auto_destroy_component. `project_usage.componentRuntime.usedComponents` is Animation, AutoControlScript, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, WallGrab, comp_box, so component type `AutoDestroy` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.auto_destroy` with 1 window(s).
- [report-only] `runtime.components.system.retractable_gate` lines 28501-28513: `runtime.components.system.retractable_gate` covers unused retractable-gate component labels: init_retractable_gate_system, update_retractable_gate_component. `project_usage.componentRuntime.usedComponents` is Animation, AutoControlScript, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, WallGrab, comp_box, so component type `RetractableGate` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.retractable_gate` with 2 window(s).
- [patchable] `runtime.components.system.retractable_gate:init_retractable_gate_system` lines 28501-28502: `init_retractable_gate_system` is part of unused component runtime group `runtime.components.system.retractable_gate`. The group has no external references, so this window is removed only together with the other group windows.
- [patchable] `runtime.components.system.retractable_gate:update_retractable_gate_component` lines 28504-28507: `update_retractable_gate_component` is part of unused component runtime group `runtime.components.system.retractable_gate`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.components.system.damage` lines 28514-28522: `runtime.components.system.damage` covers unused damage component labels: init_damage_system, update_damage_component. `project_usage.componentRuntime.usedComponents` is Animation, AutoControlScript, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, WallGrab, comp_box, so component type `Damage` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.damage` with 2 window(s).
- [patchable] `runtime.components.system.damage:init_damage_system` lines 28514-28515: `init_damage_system` is part of unused component runtime group `runtime.components.system.damage`. The group has no external references, so this window is removed only together with the other group windows.
- [patchable] `runtime.components.system.damage:update_damage_component` lines 28517-28520: `update_damage_component` is part of unused component runtime group `runtime.components.system.damage`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.components.system.shoot` lines 28523-28534: `runtime.components.system.shoot` covers unused shoot component labels: init_shoot_system, update_shoot_component. `project_usage.componentRuntime.usedComponents` is Animation, AutoControlScript, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, WallGrab, comp_box, so component type `Shoot` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.shoot` with 2 window(s).
- [patchable] `runtime.components.system.shoot:init_shoot_system` lines 28523-28524: `init_shoot_system` is part of unused component runtime group `runtime.components.system.shoot`. The group has no external references, so this window is removed only together with the other group windows.
- [patchable] `runtime.components.system.shoot:update_shoot_component` lines 28526-28529: `update_shoot_component` is part of unused component runtime group `runtime.components.system.shoot`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.components.system.in_water` lines 29666-29674: `runtime.components.system.in_water` covers unused in-water component labels: init_in_water_system, update_in_water_component. `project_usage.componentRuntime.usedComponents` is Animation, AutoControlScript, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, WallGrab, comp_box, so component type `InWater` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.in_water` with 2 window(s).
- [patchable] `runtime.components.system.in_water:init_in_water_system` lines 29666-29667: `init_in_water_system` is part of unused component runtime group `runtime.components.system.in_water`. The group has no external references, so this window is removed only together with the other group windows.
- [patchable] `runtime.components.system.in_water:update_in_water_component` lines 29669-29672: `update_in_water_component` is part of unused component runtime group `runtime.components.system.in_water`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.components.system.collectible` lines 29675-29694: `runtime.components.system.collectible` covers unused collectible component labels: init_collectible_system, update_collectible_component. `project_usage.componentRuntime.usedComponents` is Animation, AutoControlScript, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, WallGrab, comp_box, so component type `Collectible` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.collectible` with 2 window(s).
- [patchable] `runtime.components.system.collectible:init_collectible_system` lines 29675-29676: `init_collectible_system` is part of unused component runtime group `runtime.components.system.collectible`. The group has no external references, so this window is removed only together with the other group windows.
- [patchable] `runtime.components.system.collectible:update_collectible_component` lines 29678-29681: `update_collectible_component` is part of unused component runtime group `runtime.components.system.collectible`. The group has no external references, so this window is removed only together with the other group windows.

## state-machine-dispatch-handlers

- Metrics: findings=66, patchable=57, removed_lines=205, removed_source_bytes=5103
- Routines: Action_ChangeSprite, Action_ExitCurrentWorld, Action_Nop, Action_Nop:table:0, Action_Nop:table:1, Action_Nop:table:10, Action_Nop:table:11, Action_Nop:table:12, Action_Nop:table:13, Action_Nop:table:14, Action_Nop:table:15, Action_Nop:table:16, Action_Nop:table:17, Action_Nop:table:18, Action_Nop:table:19, Action_Nop:table:2, Action_Nop:table:20, Action_Nop:table:21, Action_Nop:table:22, Action_Nop:table:23, Action_Nop:table:24, Action_Nop:table:25, Action_Nop:table:26, Action_Nop:table:27, Action_Nop:table:28, Action_Nop:table:29, Action_Nop:table:3, Action_Nop:table:30, Action_Nop:table:31, Action_Nop:table:32, Action_Nop:table:33, Action_Nop:table:34, Action_Nop:table:35, Action_Nop:table:36, Action_Nop:table:37, Action_Nop:table:38, Action_Nop:table:39, Action_Nop:table:4, Action_Nop:table:41, Action_Nop:table:42, Action_Nop:table:43, Action_Nop:table:6, Action_Nop:table:9, Action_SetAnimSpeed, Action_ToggleAnim, Condition_And, Condition_AnimComplete, Condition_AnimComplete:table:12, Condition_KeyAndMove, Condition_Nop, Condition_Nop:table:0, Condition_Nop:table:10, Condition_Nop:table:11, Condition_Nop:table:15, Condition_Nop:table:16, Condition_Nop:table:17, Condition_Nop:table:4, Condition_Nop:table:5, Condition_Nop:table:7, Condition_Nop:table:8, Condition_Nop:table:9, Condition_Not, Condition_Or, Condition_TimeOut, Condition_VariableCompare, Condition_VariableCompare:table:14

- [patchable] `Action_Nop:table:0` lines 33339-33339: `Action_Nop` dispatch id 0 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:1` lines 33340-33340: `Action_Nop` dispatch id 1 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:2` lines 33341-33341: `Action_Nop` dispatch id 2 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:3` lines 33342-33342: `Action_Nop` dispatch id 3 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:4` lines 33343-33343: `Action_Nop` dispatch id 4 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:6` lines 33345-33345: `Action_Nop` dispatch id 6 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:9` lines 33348-33348: `Action_Nop` dispatch id 9 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:10` lines 33349-33349: `Action_Nop` dispatch id 10 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:11` lines 33350-33350: `Action_Nop` dispatch id 11 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:12` lines 33351-33351: `Action_Nop` dispatch id 12 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:13` lines 33352-33352: `Action_Nop` dispatch id 13 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:14` lines 33353-33353: `Action_Nop` dispatch id 14 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:15` lines 33354-33354: `Action_Nop` dispatch id 15 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:16` lines 33355-33355: `Action_Nop` dispatch id 16 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:17` lines 33356-33356: `Action_Nop` dispatch id 17 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:18` lines 33357-33357: `Action_Nop` dispatch id 18 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:19` lines 33358-33358: `Action_Nop` dispatch id 19 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:20` lines 33359-33359: `Action_Nop` dispatch id 20 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:21` lines 33360-33360: `Action_Nop` dispatch id 21 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:22` lines 33361-33361: `Action_Nop` dispatch id 22 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:23` lines 33362-33362: `Action_Nop` dispatch id 23 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:24` lines 33363-33363: `Action_Nop` dispatch id 24 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:25` lines 33364-33364: `Action_Nop` dispatch id 25 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:26` lines 33365-33365: `Action_Nop` dispatch id 26 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:27` lines 33366-33366: `Action_Nop` dispatch id 27 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:28` lines 33367-33367: `Action_Nop` dispatch id 28 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:29` lines 33368-33368: `Action_Nop` dispatch id 29 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:30` lines 33369-33369: `Action_Nop` dispatch id 30 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:31` lines 33370-33370: `Action_Nop` dispatch id 31 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:32` lines 33371-33371: `Action_Nop` dispatch id 32 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:33` lines 33372-33372: `Action_Nop` dispatch id 33 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:34` lines 33373-33373: `Action_Nop` dispatch id 34 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:35` lines 33374-33374: `Action_Nop` dispatch id 35 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:36` lines 33375-33375: `Action_Nop` dispatch id 36 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:37` lines 33376-33376: `Action_Nop` dispatch id 37 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:38` lines 33377-33377: `Action_Nop` dispatch id 38 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:39` lines 33378-33378: `Action_Nop` dispatch id 39 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:41` lines 33380-33380: `Action_Nop` dispatch id 41 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:42` lines 33381-33381: `Action_Nop` dispatch id 42 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:43` lines 33382-33382: `Action_Nop` dispatch id 43 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop` lines 33388-33398: `Action_Nop` is a state-machine action handler referenced by `SM_ActionTable` (40 table reference(s): SM_ActionTable@33339: `DW Action_Nop; 0`, SM_ActionTable@33340: `DW Action_Nop ; 1 [Action_SetPosition stripped]`, SM_ActionTable@33341: `DW Action_Nop ; 2 [Action_MoveBy stripped]`). Direct external references: none. Dispatch id 0 is not listed in `project_usage.stateMachineRuntime.usedActionIds`; this is only an unused-by-metadata signal. Patch enabled: all dispatch table ids for this handler are unused by project_usage metadata and there are no direct external references.
- [report-only] `Action_ChangeSprite` lines 33464-33793: `Action_ChangeSprite` is a state-machine action handler referenced by `SM_ActionTable` (1 table reference(s): SM_ActionTable@33344: `DW Action_ChangeSprite; 5`). Direct external references: none. Dispatch id 5 is listed in `project_usage.stateMachineRuntime.usedActionIds`. Patch disabled because one or more table dispatch ids are used or unknown.
- [report-only] `Action_SetAnimSpeed` lines 33794-33827: `Action_SetAnimSpeed` is a state-machine action handler referenced by `SM_ActionTable` (1 table reference(s): SM_ActionTable@33346: `DW Action_SetAnimSpeed; 7`). Direct external references: none. Dispatch id 7 is listed in `project_usage.stateMachineRuntime.usedActionIds`. Patch disabled because one or more table dispatch ids are used or unknown.
- [report-only] `Action_ToggleAnim` lines 33828-33927: `Action_ToggleAnim` is a state-machine action handler referenced by `SM_ActionTable` (1 table reference(s): SM_ActionTable@33347: `DW Action_ToggleAnim; 8`). Direct external references: none. Dispatch id 8 is listed in `project_usage.stateMachineRuntime.usedActionIds`. Patch disabled because one or more table dispatch ids are used or unknown.
- [report-only] `Action_ExitCurrentWorld` lines 34078-34087: `Action_ExitCurrentWorld` is a state-machine action handler referenced by `SM_ActionTable` (1 table reference(s): SM_ActionTable@33379: `DW Action_ExitCurrentWorld; 40`). Direct external references: none. Dispatch id 40 is listed in `project_usage.stateMachineRuntime.usedActionIds`. Patch disabled because one or more table dispatch ids are used or unknown.
- [patchable] `Condition_Nop:table:0` lines 34089-34089: `Condition_Nop` dispatch id 0 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_Nop:table:4` lines 34093-34093: `Condition_Nop` dispatch id 4 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_Nop:table:5` lines 34094-34094: `Condition_Nop` dispatch id 5 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_Nop:table:7` lines 34096-34096: `Condition_Nop` dispatch id 7 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_Nop:table:8` lines 34097-34097: `Condition_Nop` dispatch id 8 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_Nop:table:9` lines 34098-34098: `Condition_Nop` dispatch id 9 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_Nop:table:10` lines 34099-34099: `Condition_Nop` dispatch id 10 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_Nop:table:11` lines 34100-34100: `Condition_Nop` dispatch id 11 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_AnimComplete:table:12` lines 34101-34101: `Condition_AnimComplete` dispatch id 12 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_VariableCompare:table:14` lines 34103-34103: `Condition_VariableCompare` dispatch id 14 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_Nop:table:15` lines 34104-34104: `Condition_Nop` dispatch id 15 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_Nop:table:16` lines 34105-34105: `Condition_Nop` dispatch id 16 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_Nop:table:17` lines 34106-34106: `Condition_Nop` dispatch id 17 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_Nop` lines 34112-34115: `Condition_Nop` is a state-machine condition handler referenced by `SM_ConditionTable` (11 table reference(s): SM_ConditionTable@34089: `DW Condition_Nop            ; 0`, SM_ConditionTable@34093: `DW Condition_Nop ; 4 [Condition_KeyPressed stripped]`, SM_ConditionTable@34094: `DW Condition_Nop ; 5 [Condition_KeyReleased stripped]`). Direct external references: none. Dispatch id 0 is not listed in `project_usage.stateMachineRuntime.usedConditionIds`; this is only an unused-by-metadata signal. Patch enabled: all dispatch table ids for this handler are unused by project_usage metadata and there are no direct external references.
- [report-only] `Condition_And` lines 34116-34148: `Condition_And` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@34090: `DW Condition_And            ; 1`). Direct external references: none. Dispatch id 1 is listed in `project_usage.stateMachineRuntime.usedConditionIds`. Patch disabled because one or more table dispatch ids are used or unknown.
- [report-only] `Condition_Or` lines 34149-34183: `Condition_Or` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@34091: `DW Condition_Or             ; 2`). Direct external references: none. Dispatch id 2 is listed in `project_usage.stateMachineRuntime.usedConditionIds`. Patch disabled because one or more table dispatch ids are used or unknown.
- [report-only] `Condition_Not` lines 34184-34210: `Condition_Not` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@34092: `DW Condition_Not            ; 3`). Direct external references: none. Dispatch id 3 is listed in `project_usage.stateMachineRuntime.usedConditionIds`. Patch disabled because one or more table dispatch ids are used or unknown.
- [report-only] `Condition_TimeOut` lines 34437-34498: `Condition_TimeOut` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@34095: `DW Condition_TimeOut        ; 6`). Direct external references: none. Dispatch id 6 is listed in `project_usage.stateMachineRuntime.usedConditionIds`. Patch disabled because one or more table dispatch ids are used or unknown.
- [patchable] `Condition_AnimComplete` lines 34499-34519: `Condition_AnimComplete` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@34101: `DW Condition_AnimComplete   ; 12`). Direct external references: none. Dispatch id 12 is not listed in `project_usage.stateMachineRuntime.usedConditionIds`; this is only an unused-by-metadata signal. Patch enabled: all dispatch table ids for this handler are unused by project_usage metadata and there are no direct external references.
- [report-only] `Condition_KeyAndMove` lines 34520-34565: `Condition_KeyAndMove` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@34102: `DW Condition_KeyAndMove     ; 13`). Direct external references: none. Dispatch id 13 is listed in `project_usage.stateMachineRuntime.usedConditionIds`. Patch disabled because one or more table dispatch ids are used or unknown.
- [patchable] `Condition_VariableCompare` lines 34566-34751: `Condition_VariableCompare` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@34103: `DW Condition_VariableCompare; 14`). Direct external references: none. Dispatch id 14 is not listed in `project_usage.stateMachineRuntime.usedConditionIds`; this is only an unused-by-metadata signal. Patch enabled: all dispatch table ids for this handler are unused by project_usage metadata and there are no direct external references.

## Optimization Passes

- Pass 1: findings=145, patchable=100, removed=565 lines / 17054 bytes, lines=47419->46854
- Pass 2: findings=10, patchable=0, removed=0 lines / 0 bytes, lines=46854->46854

