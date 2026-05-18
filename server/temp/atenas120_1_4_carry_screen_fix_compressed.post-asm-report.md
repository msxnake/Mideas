# Post-ASM Report

- Input: `C:\Users\salam\Documents\Programacion\Mideas\server\temp\atenas120_1_4_carry_screen_fix_compressed.asm`
- Selected rules: dead-blocks, unused-screen-loaders, inactive-feature-runtime, unused-boss-attack-runtime, unused-component-runtime, state-machine-dispatch-handlers
- Findings: 145
- Applied patches: 100
- Original lines: 47752
- Output lines: 47187
- Net line delta: -565

- Optimization passes run: 2
- Optimization source removed: 565 lines / 17054 bytes

## Mideas Block Inventory

- Blocks: 111
- Preserved blocks: 24
- Removable-by-policy blocks: 87
- Dead-block candidates: 19
- Annotated block source: 17592 lines / 490666 bytes
- Dead-candidate source: 204 lines / 5994 bytes
- Marker errors: 2

- By kind: data=2, routine=99, trampoline=10
- By owner: animtiles=1, bosses=13, components=34, dialogues=1, entities=4, far-call=10, font=1, gameflow=7, hud=1, interrupt=5, mapper=1, resources=1, screens=10, scroll=1, sound=13, sprites=1, stateMachine=3, unified=1, worlds=3
- By status: candidate_unreferenced=19, empty=2, preserved=24, referenced=19, rooted=47

### Largest Annotated Blocks

| ID | Status | Source | Kind | Owner |
| --- | --- | --- | --- | --- |
| `runtime.components.scheduler` | `rooted` | 2353l/54290b | `routine` | `components` |
| `runtime.statemachine.core` | `rooted` | 1852l/52596b | `routine` | `stateMachine` |
| `runtime.gameflow.world_loop` | `rooted` | 1506l/45804b | `routine` | `gameflow` |
| `runtime.components.wallcollision` | `referenced` | 855l/31837b | `routine` | `components` |
| `runtime.components.carry` | `rooted` | 1003l/22291b | `routine` | `components` |
| `runtime.components.collision` | `referenced` | 684l/19218b | `routine` | `components` |
| `runtime.resources.manager` | `rooted` | 692l/17765b | `routine` | `resources` |
| `runtime.components.tile_interaction` | `rooted` | 674l/17225b | `routine` | `components` |
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

- Marker error: Line 37378: @mideas:endblock without open block.
- Marker error: Line 46247: @mideas:block id=runtime.gameflow.world_loop has no closing @mideas:endblock.

## Inactive Feature Runtime Inventory

| Feature | Findings | Patchable | Annotated | Unannotated | Preserved | Owners |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `bosses` | 18 | 0 | 18 | 0 | 15 | bosses=15, far-call=3 |

## Global Label Inventory

- Global labels: 1085

| Label | Category | Source |
| --- | --- | --- |
| `FAST_SNSMAT` | `bios_helper` | 1190l/73939b |
| `update_wallcollision_component` | `runtime_code` | 552l/20814b |
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
| `BANK_0_USED_END` | `bank_marker` | 146l/7861b |
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
| `rebuild_used_entity_list` | `runtime_code` | 225l/4869b |
| `jump_update_loop` | `runtime_code` | 157l/4675b |
| `init_fakeplayer_1` | `boot_or_init` | 162l/4450b |
| `init_caixa_1` | `boot_or_init` | 160l/4211b |

### Largest Unannotated Global Labels

- Unannotated labels: 570

| Category | Labels | Source |
| --- | ---: | ---: |
| `bank_marker` | 17 | 837l/39100b |
| `bios_helper` | 9 | 1826l/92965b |
| `boot_or_init` | 30 | 982l/25830b |
| `data` | 266 | 3815l/165764b |
| `far_trampoline` | 71 | 1275l/28075b |
| `runtime_code` | 163 | 4590l/116260b |
| `runtime_inner_label` | 8 | 156l/4287b |
| `screen_loader` | 4 | 100l/2486b |
| `shared_runtime` | 2 | 32l/1222b |

| Label | Category | Source |
| --- | --- | --- |
| `FAST_SNSMAT` | `bios_helper` | 1190l/73939b |
| `pt3_track_0_data` | `data` | 229l/15812b |
| `execute_transition_effect` | `runtime_code` | 385l/11163b |
| `FAR_BANK_13_ROM_START` | `bank_marker` | 178l/9623b |
| `resource_table` | `data` | 625l/9533b |
| `PRESENTATION_SCREEN_PATTERNS_B2` | `data` | 131l/9095b |
| `PRESENTATION_SCREEN_COLORS_B2` | `data` | 131l/9091b |
| `PRESENTATION_SCREEN_PATTERNS_B1` | `data` | 120l/8107b |
| `PRESENTATION_SCREEN_COLORS_B1` | `data` | 114l/7884b |
| `BANK_0_USED_END` | `bank_marker` | 146l/7861b |
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
| `runtime.mapper.core` | `routine` | `mapper` | `rooted` | 181 | 213l/5412b | 20076-20288 | mapper_runtime_init, mapper_set_bank_p1, mapper_set_bank_p2, mapper_set_bank_p3, mapper_set_bank_p4, ... (+14) |
| `runtime.resources.manager` | `routine` | `resources` | `rooted` | 128 | 692l/17765b | 21089-21780 | resource_manager_init, resource_invalidate_pattern_vram_cache, resource_invalidate_color_vram_cache, resource_invalidate_font_vram_cache, resource_invalidate_gameplay_vram_cache, ... (+14) |
| `runtime.components.input_trigger_level` | `routine` | `components` | `candidate_unreferenced` | 0 | 33l/773b | 21862-21894 | component_trigger_level_pressed_a |
| `runtime.page0.stubs` | `routine` | `unified` | `rooted` | 1 | 22l/505b | 21901-21922 | init_page0_runtime_state, page0_map_expanded_slot, page0_map_game_rom, page0_restore_bios_rom, page0_copy_chunk_to_buffer, ... (+2) |
| `runtime.interrupt.stop` | `routine` | `interrupt` | `rooted` | 0 | 43l/1299b | 22003-22045 | stop_interrupt_system |
| `runtime.interrupt.dispatcher` | `routine` | `interrupt` | `preserved` | 1 | 124l/4150b | 22047-22170 | interrupt_dispatcher |
| `runtime.interrupt.vblank_flag` | `routine` | `interrupt` | `rooted` | 1 | 35l/983b | 22183-22217 | update_vblank_flag |
| `runtime.interrupt.task_api` | `routine` | `interrupt` | `rooted` | 1 | 121l/3195b | 22222-22342 | enable_task, disable_task, get_frame_count |
| `runtime.interrupt.task_input` | `routine` | `interrupt` | `rooted` | 2 | 272l/7149b | 22346-22617 | init_default_tasks_from_plan, task_update_input |
| `runtime.far_trampoline.init_sound_system_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/709b | 22672-22697 | init_sound_system_far |
| `runtime.far_trampoline.task_audio_tick_far` | `trampoline` | `far-call` | `preserved` | 0 | 26l/695b | 22699-22724 | task_audio_tick_far |
| `runtime.far_trampoline.sfx_update_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/660b | 22726-22751 | sfx_update_far |
| `runtime.far_trampoline.music_update_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/674b | 22753-22778 | music_update_far |
| `runtime.far_trampoline.music_stop_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/660b | 22780-22805 | music_stop_far |
| `runtime.far_trampoline.music_play_track_far` | `trampoline` | `far-call` | `preserved` | 1 | 28l/739b | 22807-22834 | music_play_track_far |
| `runtime.far_trampoline.music_execute_command_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/737b | 22836-22861 | music_execute_command_far |
| `runtime.far_trampoline.init_boss_system_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/703b | 24288-24313 | init_boss_system_far |
| `runtime.far_trampoline.init_screen_boss_from_current_screen_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/843b | 24315-24340 | init_screen_boss_from_current_screen_far |
| `runtime.far_trampoline.update_boss_system_far` | `trampoline` | `far-call` | `preserved` | 1 | 26l/717b | 24342-24367 | update_boss_system_far |
| `runtime.sound.resident.init` | `routine` | `sound` | `referenced` | 1 | 4l/184b | 24445-24448 | call_init_sound_system_resident |
| `runtime.sound.resident.tick` | `routine` | `sound` | `referenced` | 6 | 18l/606b | 24450-24467 | call_task_audio_tick_resident |
| `runtime.sound.resident.music_update` | `routine` | `sound` | `referenced` | 2 | 4l/190b | 24469-24472 | call_music_update_resident |
| `runtime.sound.resident.sfx_update` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/182b | 24474-24477 | call_sfx_update_resident |
| `runtime.sound.resident.music_stop` | `routine` | `sound` | `referenced` | 1 | 4l/182b | 24479-24482 | call_music_stop_resident |
| `runtime.sound.resident.music_play_track` | `routine` | `sound` | `referenced` | 2 | 4l/206b | 24484-24487 | call_music_play_track_resident |
| `runtime.sound.resident.music_execute_command` | `routine` | `sound` | `referenced` | 1 | 4l/226b | 24489-24492 | call_music_execute_command_resident |
| `runtime.boss.resident.init` | `routine` | `bosses` | `preserved` | 0 | 4l/232b | 24606-24609 | call_init_boss_system_resident |
| `runtime.boss.resident.init_screen` | `routine` | `bosses` | `preserved` | 0 | 4l/306b | 24611-24614 | call_init_screen_boss_from_current_screen_resident |
| `runtime.boss.resident.update` | `routine` | `bosses` | `preserved` | 0 | 4l/242b | 24616-24619 | call_update_boss_system_resident |
| `runtime.boss.resident.update_projectile` | `routine` | `bosses` | `preserved` | 0 | 4l/279b | 24621-24624 | call_update_boss_projectile_runtime_resident |
| `runtime.boss.resident.draw_attack` | `routine` | `bosses` | `preserved` | 0 | 4l/239b | 24626-24629 | call_draw_boss_attack_resident |
| `runtime.boss.resident.draw_meteor` | `routine` | `bosses` | `preserved` | 0 | 4l/253b | 24631-24634 | call_draw_boss_meteor_attack_resident |
| `runtime.boss.resident.draw_bomb` | `routine` | `bosses` | `preserved` | 0 | 4l/245b | 24636-24639 | call_draw_boss_bomb_attack_resident |
| `runtime.boss.resident.draw_boomerang` | `routine` | `bosses` | `preserved` | 0 | 4l/265b | 24641-24644 | call_draw_boss_boomerang_attack_resident |
| `runtime.boss.resident.draw_rock` | `routine` | `bosses` | `preserved` | 0 | 4l/245b | 24646-24649 | call_draw_boss_rock_attack_resident |
| `runtime.boss.resident.draw_laser` | `routine` | `bosses` | `preserved` | 0 | 4l/249b | 24651-24654 | call_draw_boss_laser_attack_resident |
| `runtime.boss.resident.draw_sine_wave` | `routine` | `bosses` | `preserved` | 0 | 4l/265b | 24656-24659 | call_draw_boss_sine_wave_attack_resident |
| `runtime.boss.resident.draw_homing_missile` | `routine` | `bosses` | `preserved` | 0 | 4l/285b | 24661-24664 | call_draw_boss_homing_missile_attack_resident |
| `runtime.components.init` | `routine` | `components` | `rooted` | 17 | 105l/3513b | 24930-25034 | component_fill_32_a, init_components |
| `runtime.components.position` | `routine` | `components` | `rooted` | 3 | 129l/3859b | 25036-25164 | init_position_system, update_position_component, position_update_loop, position_next_entity |
| `runtime.components.sprite` | `routine` | `components` | `rooted` | 6 | 402l/10511b | 25165-25566 | init_sprite_system, update_sprite_component, sprite_update_loop, sprite_layer_loop, sprite_continue, ... (+6) |
| `runtime.components.movement_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 25572-25575 | update_movement_component |
| `runtime.components.collision` | `routine` | `components` | `referenced` | 2 | 684l/19218b | 25576-26259 | init_collision_system, update_collision_component, collision_update_loop, collision_next_entity, update_entity_collision_fast, ... (+13) |
| `runtime.components.behavior_tile` | `routine` | `components` | `rooted` | 13 | 110l/3809b | 26260-26369 | get_behavior_tile, get_behavior_tile_nb, gbt_oob |
| `runtime.components.directional_sprite_sync` | `routine` | `components` | `rooted` | 3 | 87l/2084b | 26370-26456 | component_sync_directional_sprite_from_initial, component_sync_directional_sprite_from_current, component_sync_directional_sprite_common |
| `runtime.components.input` | `routine` | `components` | `referenced` | 2 | 393l/13136b | 26457-26849 | init_input_system, update_input_component, input_update_loop, input_move_up, input_move_down, ... (+16) |
| `runtime.components.behavior_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 26855-26858 | update_behavior_component |
| `runtime.components.health` | `routine` | `components` | `rooted` | 3 | 152l/4701b | 26859-27010 | init_health_system, update_health_component, decrease_entity_lives, increase_entity_lives |
| `runtime.components.animation` | `routine` | `components` | `referenced` | 4 | 342l/10555b | 27011-27352 | init_animation_system, update_animation_component, anim_done_entity, refresh_player_animation_fastpath |
| `runtime.components.jump` | `routine` | `components` | `referenced` | 2 | 233l/7043b | 27353-27585 | init_jump_system, update_jump_component, jump_update_loop, jump_done_entity, jump_next_entity |
| `runtime.components.gravity` | `routine` | `components` | `rooted` | 2 | 137l/4553b | 27586-27722 | init_gravity_system, update_gravity_component, gravity_update_loop, gravity_store_vel, gravity_grounded, ... (+2) |
| `runtime.components.walljump_stub` | `routine` | `components` | `referenced` | 2 | 18l/326b | 28468-28485 | init_walljump_system, update_walljump_component, walljump_process_entity_c, walljump_input_is_left, walljump_input_is_right |
| `runtime.components.auto_destroy_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/219b | 28488-28494 | init_auto_destroy_system, update_auto_destroy_component |
| `runtime.components.state_machine_component_stub` | `routine` | `components` | `referenced` | 1 | 7l/241b | 28518-28524 | init_statemachine_system, update_statemachine_component |
| `runtime.components.retractable_gate_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/196b | 28530-28533 | update_retractable_gate_component |
| `runtime.components.damage_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/166b | 28543-28546 | update_damage_component |
| `runtime.components.shoot_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/163b | 28552-28555 | update_shoot_component |
| `runtime.components.platform_riding_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/220b | 28575-28581 | prepare_platform_detection, update_platform_riding |
| `runtime.components.wallcollision` | `routine` | `components` | `referenced` | 8 | 855l/31837b | 28582-29436 | init_wallcollision_system, wall_behavior_is_full_blocker, wall_down_behavior_blocks, update_wallcollision_component, wall_build_hitbox_cache, ... (+2) |
| `runtime.components.deadly_tiles` | `routine` | `components` | `rooted` | 3 | 262l/5874b | 29437-29698 | init_deadly_tiles_system, deadly_tiles_runtime_tile_is_deadly_nb, update_entity_deadly_flag_runtime, update_deadly_tiles_component, refresh_player_deadly_fastpath |
| `runtime.components.in_water_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 29704-29707 | update_in_water_component |
| `runtime.components.collectible_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/181b | 29713-29716 | update_collectible_component |
| `runtime.components.tile_interaction` | `routine` | `components` | `rooted` | 4 | 674l/17225b | 29717-30390 | interaction_target_variable_ptr_table, interaction_target_variable_word_table, init_tile_interaction_system, update_slash_component, record_bonus_respawn_slot, ... (+11) |
| `runtime.components.collected_tiles` | `routine` | `components` | `rooted` | 1 | 76l/3015b | 30391-30466 | apply_collected_tiles |
| `runtime.components.mirror_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/166b | 30472-30475 | update_mirror_component |
| `runtime.components.entity_management` | `routine` | `components` | `rooted` | 3 | 221l/6553b | 30476-30696 | create_entity, entity_job_set, entity_job_set_period_ok, entity_job_set_entry_wrap, entity_job_set_entry_ok, ... (+13) |
| `runtime.components.scheduler` | `routine` | `components` | `rooted` | 9 | 2353l/54290b | 30697-33049 | update_all_entities, mark_used_entity_list_dirty, ensure_used_entity_list_current, rebuild_used_entity_list, ensure_player_fast_runtime_bound, ... (+40) |
| `runtime.components.carry` | `routine` | `components` | `rooted` | 163 | 1003l/22291b | 31275-32277 | entity_carry_enabled_init, entity_carry_sprite_index_init, entity_box_carriable_init, entity_box_tile_width_init, entity_box_tile_height_init, ... (+24) |
| `runtime.components.state_machine_executor` | `routine` | `components` | `rooted` | 2 | 74l/1973b | 33055-33128 | execute_all_state_machines, refresh_player_state_machine_fastpath |
| `runtime.components.legacy_tile_collision` | `routine` | `components` | `referenced` | 3 | 43l/1404b | 33138-33180 | get_tile_at_position, get_tile_behavior, tile_behavior_table, check_collision_at_point, check_collision_box, ... (+1) |
| `runtime.components.secret_zone_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/181b | 33217-33220 | update_secret_zone_component |
| `runtime.statemachine.core` | `routine` | `stateMachine` | `rooted` | 4 | 1852l/52596b | 33228-35079 | SM_Update, sm_timer_no_overflow, sm_timer_paused, sm_update_done, SM_ShouldPauseTimerForDialogue, ... (+34) |
| `data.statemachine.statemachine_1778070349580` | `data` | `stateMachine` | `rooted` | 2 | 112l/2808b | 35158-35269 | SM_state1_state_1778070362171, SM_state1_state_1778070362171_OnEnter, SM_state1_state_1778070362171_Transitions, SM_state1_state_1778070367956, SM_state1_state_1778070367956_OnEnter, ... (+13) |
| `data.statemachine.statemachine_dialog_jump_test` | `data` | `stateMachine` | `rooted` | 1 | 24l/895b | 35270-35293 | SM_dialog_jump_to_pantalla2_state_dialog_wait, SM_dialog_jump_to_pantalla2_state_dialog_wait_Transitions, SM_dialog_jump_to_pantalla2_state_dialog_wait_Transitions_Actions_0, SM_dialog_jump_to_pantalla2_state_dialog_done |
| `runtime.gameflow.worldlink` | `routine` | `gameflow` | `rooted` | 1 | 82l/2388b | 35423-35504 | gameflow_handle_worldlink |
| `runtime.gameflow.end_screen` | `routine` | `gameflow` | `rooted` | 1 | 57l/1892b | 35506-35562 | gameflow_handle_end |
| `runtime.gameflow.presentation_wait_frames` | `routine` | `gameflow` | `empty` | 0 | 3l/230b | 35603-35605 |  |
| `runtime.gameflow.connection_by_type` | `routine` | `gameflow` | `empty` | 0 | 3l/216b | 37284-37286 |  |
| `runtime.sound.init` | `routine` | `sound` | `rooted` | 1 | 22l/725b | 39327-39348 | init_sound_system |
| `runtime.sound.tick` | `routine` | `sound` | `rooted` | 1 | 17l/320b | 39355-39371 | task_audio_tick |
| `runtime.sound.psg_lowlevel` | `routine` | `sound` | `rooted` | 27 | 117l/3450b | 39376-39492 | psg_write, psg_set_tone, psg_set_volume, psg_set_noise, psg_set_mixer, ... (+1) |
| `runtime.sound.sfx_silence` | `routine` | `sound` | `referenced` | 2 | 21l/579b | 39502-39522 | sfx_silence_all |
| `runtime.sound.sfx_builtin_effects` | `routine` | `sound` | `referenced` | 6 | 127l/3025b | 39528-39654 | sfx_beep, sfx_jump, sfx_shoot, sfx_explosion, sfx_coin, ... (+1) |
| `runtime.sound.sfx_playback` | `routine` | `sound` | `referenced` | 1 | 119l/2384b | 39672-39790 | play_sound_effect, play_sound_effect_beep, play_sound_effect_jump, play_sound_effect_shoot, play_sound_effect_explosion, ... (+4) |
| `runtime.screens.colors` | `routine` | `screens` | `rooted` | 1 | 44l/1514b | 40264-40307 | color_shift_table, set_screen_colors |
| `runtime.screens.copy_rect` | `routine` | `screens` | `rooted` | 0 | 77l/1494b | 40436-40512 | copy_layout_rect_to_vram, copy_layout_rect_ram_to_ram |
| `runtime.screens.block_layout_expander` | `routine` | `screens` | `rooted` | 4 | 194l/3782b | 40514-40707 | expand_screen_block_layout_to_background, expand_screen_block_layout_2x2, expand_screen_block_layout_4x4 |
| `runtime.screens.behavior_map_rebuild` | `routine` | `screens` | `candidate_unreferenced` | 0 | 26l/709b | 40725-40750 | build_runtime_behavior_map_from_screen_layout |
| `runtime.screens.load_screen_stub` | `routine` | `screens` | `candidate_unreferenced` | 0 | 6l/232b | 40751-40756 | load_screen |
| `runtime.screens.load_screen_pantalla1_778062394614.loader` | `routine` | `screens` | `rooted` | 1 | 130l/5132b | 40758-40887 | load_screen_pantalla1_778062394614, load_screen_pantalla1_778062394614_skip_vram_copy, load_pantalla1_778062394614_boss_done |
| `runtime.screens.load_screen_pantalla2_778230236021.loader` | `routine` | `screens` | `rooted` | 1 | 130l/5133b | 40889-41018 | load_screen_pantalla2_778230236021, load_screen_pantalla2_778230236021_skip_vram_copy, load_pantalla2_778230236021_boss_done |
| `runtime.screens.load_screen_pantalla3_778230684484.loader` | `routine` | `screens` | `rooted` | 1 | 130l/5132b | 41020-41149 | load_screen_pantalla3_778230684484, load_screen_pantalla3_778230684484_skip_vram_copy, load_pantalla3_778230684484_boss_done |
| `runtime.screens.load_screen_d_pantalla1_778241953722.loader` | `routine` | `screens` | `rooted` | 1 | 133l/5315b | 41151-41283 | load_screen_d_pantalla1_778241953722, load_screen_d_pantalla1_778241953722_skip_vram_copy, load_d_pantalla1_778241953722_boss_done |
| `data.entities.player_1.init` | `routine` | `entities` | `rooted` | 1 | 222l/6316b | 41535-41756 | init_player_1 |
| `data.entities.caixa_1.init` | `routine` | `entities` | `rooted` | 1 | 160l/4303b | 41775-41934 | init_caixa_1 |
| `data.entities.fakeplayer_1.init` | `routine` | `entities` | `rooted` | 1 | 162l/4552b | 41953-42114 | init_fakeplayer_1 |
| `runtime.entities.patrol_facing` | `routine` | `entities` | `rooted` | 0 | 88l/2125b | 42291-42378 | update_entity_patrol_facing |
| `runtime.dialogue.system` | `routine` | `dialogues` | `preserved` | 5 | 584l/12271b | 43218-43801 | dialogue_update_typewriter, dialogue_typewriter_emit, dialogue_typewriter_newline, dialogue_typewriter_done, dialogue_open_box, ... (+25) |
| `runtime.sprites.show_sprite_legacy` | `routine` | `sprites` | `candidate_unreferenced` | 0 | 43l/981b | 44595-44637 | show_sprite |
| `runtime.screens.presentation_wait_frames` | `routine` | `screens` | `candidate_unreferenced` | 0 | 13l/298b | 44994-45006 | presentation_wait_frames |
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

- [patchable] `runtime.components.input_trigger_level` lines 21862-21894: Block `runtime.components.input_trigger_level` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: component_trigger_level_pressed_a.
- [patchable] `runtime.sound.resident.sfx_update` lines 24474-24477: Block `runtime.sound.resident.sfx_update` (routine/sound) is a dead-code candidate. No external references found for any global label in this block. Labels: call_sfx_update_resident.
- [patchable] `runtime.components.movement_stub` lines 25572-25575: Block `runtime.components.movement_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_movement_component.
- [patchable] `runtime.components.behavior_stub` lines 26855-26858: Block `runtime.components.behavior_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_behavior_component.
- [patchable] `runtime.components.auto_destroy_stub` lines 28488-28494: Block `runtime.components.auto_destroy_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: init_auto_destroy_system, update_auto_destroy_component.
- [patchable] `runtime.components.retractable_gate_stub` lines 28530-28533: Block `runtime.components.retractable_gate_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_retractable_gate_component.
- [patchable] `runtime.components.damage_stub` lines 28543-28546: Block `runtime.components.damage_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_damage_component.
- [patchable] `runtime.components.shoot_stub` lines 28552-28555: Block `runtime.components.shoot_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_shoot_component.
- [patchable] `runtime.components.platform_riding_stub` lines 28575-28581: Block `runtime.components.platform_riding_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: prepare_platform_detection, update_platform_riding.
- [patchable] `runtime.components.in_water_stub` lines 29704-29707: Block `runtime.components.in_water_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_in_water_component.
- [patchable] `runtime.components.collectible_stub` lines 29713-29716: Block `runtime.components.collectible_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_collectible_component.
- [patchable] `runtime.components.mirror_stub` lines 30472-30475: Block `runtime.components.mirror_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_mirror_component.
- [patchable] `runtime.components.secret_zone_stub` lines 33217-33220: Block `runtime.components.secret_zone_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_secret_zone_component.
- [patchable] `runtime.screens.behavior_map_rebuild` lines 40725-40750: Block `runtime.screens.behavior_map_rebuild` (routine/screens) is a dead-code candidate. No external references found for any global label in this block. Labels: build_runtime_behavior_map_from_screen_layout.
- [patchable] `runtime.screens.load_screen_stub` lines 40751-40756: Block `runtime.screens.load_screen_stub` (routine/screens) is a dead-code candidate. No external references found for any global label in this block. Labels: load_screen.
- [patchable] `runtime.sprites.show_sprite_legacy` lines 44595-44637: Block `runtime.sprites.show_sprite_legacy` (routine/sprites) is a dead-code candidate. No external references found for any global label in this block. Labels: show_sprite.
- [patchable] `runtime.screens.presentation_wait_frames` lines 44994-45006: Block `runtime.screens.presentation_wait_frames` (routine/screens) is a dead-code candidate. No external references found for any global label in this block. Labels: presentation_wait_frames.
- [patchable] `runtime.worlds.current_screen_helpers` lines 45649-45671: Block `runtime.worlds.current_screen_helpers` (routine/worlds) is a dead-code candidate. No external references found for any global label in this block. Labels: get_current_world_id, get_current_screen_index, set_current_screen.
- [patchable] `runtime.hud.empty_update_stubs` lines 47740-47745: Block `runtime.hud.empty_update_stubs` (routine/hud) is a dead-code candidate. No external references found for any global label in this block. Labels: update_hud_score, update_hud_lives.

## inactive-feature-runtime

- Metrics: findings=37, patchable=18, removed_lines=144, removed_source_bytes=5771
- Routines: call_draw_boss_attack_resident, call_draw_boss_bomb_attack_resident, call_draw_boss_boomerang_attack_resident, call_draw_boss_homing_missile_attack_resident, call_draw_boss_laser_attack_resident, call_draw_boss_meteor_attack_resident, call_draw_boss_rock_attack_resident, call_draw_boss_sine_wave_attack_resident, call_init_boss_system_resident, call_init_screen_boss_from_current_screen_resident, call_update_boss_projectile_runtime_resident, call_update_boss_system_resident, init_boss_system, init_boss_system_far, init_screen_boss_from_current_screen, init_screen_boss_from_current_screen_far, runtime.boss.group.stubs, runtime.boss.group.stubs:call_draw_boss_attack_resident, runtime.boss.group.stubs:call_draw_boss_bomb_attack_resident, runtime.boss.group.stubs:call_draw_boss_boomerang_attack_resident, runtime.boss.group.stubs:call_draw_boss_homing_missile_attack_resident, runtime.boss.group.stubs:call_draw_boss_laser_attack_resident, runtime.boss.group.stubs:call_draw_boss_meteor_attack_resident, runtime.boss.group.stubs:call_draw_boss_rock_attack_resident, runtime.boss.group.stubs:call_draw_boss_sine_wave_attack_resident, runtime.boss.group.stubs:call_init_boss_system_resident, runtime.boss.group.stubs:call_init_screen_boss_from_current_screen_resident, runtime.boss.group.stubs:call_update_boss_projectile_runtime_resident, runtime.boss.group.stubs:call_update_boss_system_resident, runtime.boss.group.stubs:init_boss_system, runtime.boss.group.stubs:init_boss_system_far, runtime.boss.group.stubs:init_screen_boss_from_current_screen, runtime.boss.group.stubs:init_screen_boss_from_current_screen_far, runtime.boss.group.stubs:update_boss_system, runtime.boss.group.stubs:update_boss_system_far, update_boss_system, update_boss_system_far

- [patchable] `runtime.boss.group.stubs:init_boss_system_far` lines 24288-24313: `init_boss_system_far` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.boss.group.stubs` lines 24289-47716: `runtime.boss.group.stubs` groups inactive boss compatibility stubs runtime labels: call_draw_boss_attack_resident, call_draw_boss_bomb_attack_resident, call_draw_boss_boomerang_attack_resident, call_draw_boss_homing_missile_attack_resident, call_draw_boss_laser_attack_resident, call_draw_boss_meteor_attack_resident, call_draw_boss_rock_attack_resident, call_draw_boss_sine_wave_attack_resident, call_init_boss_system_resident, call_init_screen_boss_from_current_screen_resident, call_update_boss_projectile_runtime_resident, call_update_boss_system_resident, init_boss_system, init_boss_system_far, init_screen_boss_from_current_screen, init_screen_boss_from_current_screen_far, update_boss_system, update_boss_system_far. No external references outside the group were found. This is ready for a future atomic multi-window patch, or for dead-blocks to remove the annotated windows as whole groups. Atomic patch enabled as `runtime.boss.group.stubs` with 18 window(s).
- [report-only] `init_boss_system_far` lines 24289-24315: `init_boss_system_far` looks like bosses runtime (27 lines, 724 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: boot_or_init (Boot/init routine). External references still exist (1): call_init_boss_system_resident@24608. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.far_trampoline.init_boss_system_far` owner=`far-call` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:init_screen_boss_from_current_screen_far` lines 24315-24340: `init_screen_boss_from_current_screen_far` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `init_screen_boss_from_current_screen_far` lines 24316-24342: `init_screen_boss_from_current_screen_far` looks like bosses runtime (27 lines, 826 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: boot_or_init (Boot/init routine). External references still exist (1): call_init_screen_boss_from_current_screen_resident@24613. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.far_trampoline.init_screen_boss_from_current_screen_far` owner=`far-call` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:update_boss_system_far` lines 24342-24367: `update_boss_system_far` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `update_boss_system_far` lines 24343-24371: `update_boss_system_far` looks like bosses runtime (29 lines, 681 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_update_boss_system_resident@24618. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.far_trampoline.update_boss_system_far` owner=`far-call` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_init_boss_system_resident` lines 24606-24609: `call_init_boss_system_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_init_boss_system_resident` lines 24607-24611: `call_init_boss_system_resident` looks like bosses runtime (5 lines, 260 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.init` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_init_screen_boss_from_current_screen_resident` lines 24611-24614: `call_init_screen_boss_from_current_screen_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_init_screen_boss_from_current_screen_resident` lines 24612-24616: `call_init_screen_boss_from_current_screen_resident` looks like bosses runtime (5 lines, 284 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.init_screen` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_update_boss_system_resident` lines 24616-24619: `call_update_boss_system_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_update_boss_system_resident` lines 24617-24621: `call_update_boss_system_resident` looks like bosses runtime (5 lines, 266 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.update` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_update_boss_projectile_runtime_resident` lines 24621-24624: `call_update_boss_projectile_runtime_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_update_boss_projectile_runtime_resident` lines 24622-24626: `call_update_boss_projectile_runtime_resident` looks like bosses runtime (5 lines, 260 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.update_projectile` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_attack_resident` lines 24626-24629: `call_draw_boss_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_attack_resident` lines 24627-24631: `call_draw_boss_attack_resident` looks like bosses runtime (5 lines, 247 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_attack` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_meteor_attack_resident` lines 24631-24634: `call_draw_boss_meteor_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_meteor_attack_resident` lines 24632-24636: `call_draw_boss_meteor_attack_resident` looks like bosses runtime (5 lines, 250 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_meteor` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_bomb_attack_resident` lines 24636-24639: `call_draw_boss_bomb_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_bomb_attack_resident` lines 24637-24641: `call_draw_boss_bomb_attack_resident` looks like bosses runtime (5 lines, 256 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_bomb` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_boomerang_attack_resident` lines 24641-24644: `call_draw_boss_boomerang_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_boomerang_attack_resident` lines 24642-24646: `call_draw_boss_boomerang_attack_resident` looks like bosses runtime (5 lines, 256 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_boomerang` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_rock_attack_resident` lines 24646-24649: `call_draw_boss_rock_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_rock_attack_resident` lines 24647-24651: `call_draw_boss_rock_attack_resident` looks like bosses runtime (5 lines, 248 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_rock` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_laser_attack_resident` lines 24651-24654: `call_draw_boss_laser_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_laser_attack_resident` lines 24652-24656: `call_draw_boss_laser_attack_resident` looks like bosses runtime (5 lines, 258 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_laser` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_sine_wave_attack_resident` lines 24656-24659: `call_draw_boss_sine_wave_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_sine_wave_attack_resident` lines 24657-24661: `call_draw_boss_sine_wave_attack_resident` looks like bosses runtime (5 lines, 276 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_sine_wave` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_homing_missile_attack_resident` lines 24661-24664: `call_draw_boss_homing_missile_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_homing_missile_attack_resident` lines 24662-24665: `call_draw_boss_homing_missile_attack_resident` looks like bosses runtime (4 lines, 133 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_homing_missile` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:init_boss_system` lines 47693-47706: `init_boss_system` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `init_boss_system` lines 47693-47707: `init_boss_system` looks like bosses runtime (15 lines, 330 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: boot_or_init (Boot/init routine). External references still exist (1): init_boss_system_far@24298. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.boss.entry` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:update_boss_system` lines 47708-47709: `update_boss_system` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `update_boss_system` lines 47708-47710: `update_boss_system` looks like bosses runtime (3 lines, 29 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): update_boss_system_far@24352. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.boss.entry` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:init_screen_boss_from_current_screen` lines 47711-47712: `init_screen_boss_from_current_screen` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `init_screen_boss_from_current_screen` lines 47711-47716: `init_screen_boss_from_current_screen` looks like bosses runtime (6 lines, 140 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: boot_or_init (Boot/init routine). External references still exist (1): init_screen_boss_from_current_screen_far@24325. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.boss.entry` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.

## unused-component-runtime

- Metrics: findings=23, patchable=14, removed_lines=47, removed_source_bytes=1627
- Routines: runtime.components.system.auto_destroy, runtime.components.system.auto_destroy:init_auto_destroy_system, runtime.components.system.behavior, runtime.components.system.behavior:update_behavior_component, runtime.components.system.collectible, runtime.components.system.collectible:init_collectible_system, runtime.components.system.collectible:update_collectible_component, runtime.components.system.damage, runtime.components.system.damage:init_damage_system, runtime.components.system.damage:update_damage_component, runtime.components.system.in_water, runtime.components.system.in_water:init_in_water_system, runtime.components.system.in_water:update_in_water_component, runtime.components.system.movement, runtime.components.system.movement:init_movement_system, runtime.components.system.movement:update_movement_component, runtime.components.system.retractable_gate, runtime.components.system.retractable_gate:init_retractable_gate_system, runtime.components.system.retractable_gate:update_retractable_gate_component, runtime.components.system.shoot, runtime.components.system.shoot:init_shoot_system, runtime.components.system.shoot:update_shoot_component, runtime.components.system.wall_jump

- [report-only] `runtime.components.system.movement` lines 25569-25581: `runtime.components.system.movement` covers unused movement component labels: init_movement_system, update_movement_component. `project_usage.componentRuntime.usedComponents` is Animation, AutoControlScript, Box, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, WallGrab, so component type `Movement` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.movement` with 2 window(s).
- [patchable] `runtime.components.system.movement:init_movement_system` lines 25569-25570: `init_movement_system` is part of unused component runtime group `runtime.components.system.movement`. The group has no external references, so this window is removed only together with the other group windows.
- [patchable] `runtime.components.system.movement:update_movement_component` lines 25572-25575: `update_movement_component` is part of unused component runtime group `runtime.components.system.movement`. The group has no external references, so this window is removed only together with the other group windows.
- [patchable] `runtime.components.system.behavior:update_behavior_component` lines 26855-26858: `update_behavior_component` is part of unused component runtime group `runtime.components.system.behavior`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.components.system.behavior` lines 26856-26868: `runtime.components.system.behavior` covers unused behavior component labels: update_behavior_component. `project_usage.componentRuntime.usedComponents` is Animation, AutoControlScript, Box, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, WallGrab, so component type `Behavior` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.behavior` with 1 window(s).
- [report-only] `runtime.components.system.wall_jump` lines 28469-28488: `runtime.components.system.wall_jump` covers unused wall-jump component labels: init_walljump_system, update_walljump_component, walljump_input_is_left, walljump_input_is_right, walljump_process_entity_c. `project_usage.componentRuntime.usedComponents` is Animation, AutoControlScript, Box, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, WallGrab, so component type `WallJump` is not used by active entities. External references still exist (2): update_player_fastpath->walljump_process_entity_c@32793, update_player_fastpath->walljump_process_entity_c@32996. Deletion stays blocked until the scheduler/caller path is proven dead or grouped. Patch policy: report-only.
- [patchable] `runtime.components.system.auto_destroy:init_auto_destroy_system` lines 28488-28494: `init_auto_destroy_system` is part of unused component runtime group `runtime.components.system.auto_destroy`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.components.system.auto_destroy` lines 28489-28503: `runtime.components.system.auto_destroy` covers unused auto-destroy component labels: init_auto_destroy_system, update_auto_destroy_component. `project_usage.componentRuntime.usedComponents` is Animation, AutoControlScript, Box, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, WallGrab, so component type `AutoDestroy` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.auto_destroy` with 1 window(s).
- [report-only] `runtime.components.system.retractable_gate` lines 28527-28539: `runtime.components.system.retractable_gate` covers unused retractable-gate component labels: init_retractable_gate_system, update_retractable_gate_component. `project_usage.componentRuntime.usedComponents` is Animation, AutoControlScript, Box, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, WallGrab, so component type `RetractableGate` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.retractable_gate` with 2 window(s).
- [patchable] `runtime.components.system.retractable_gate:init_retractable_gate_system` lines 28527-28528: `init_retractable_gate_system` is part of unused component runtime group `runtime.components.system.retractable_gate`. The group has no external references, so this window is removed only together with the other group windows.
- [patchable] `runtime.components.system.retractable_gate:update_retractable_gate_component` lines 28530-28533: `update_retractable_gate_component` is part of unused component runtime group `runtime.components.system.retractable_gate`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.components.system.damage` lines 28540-28548: `runtime.components.system.damage` covers unused damage component labels: init_damage_system, update_damage_component. `project_usage.componentRuntime.usedComponents` is Animation, AutoControlScript, Box, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, WallGrab, so component type `Damage` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.damage` with 2 window(s).
- [patchable] `runtime.components.system.damage:init_damage_system` lines 28540-28541: `init_damage_system` is part of unused component runtime group `runtime.components.system.damage`. The group has no external references, so this window is removed only together with the other group windows.
- [patchable] `runtime.components.system.damage:update_damage_component` lines 28543-28546: `update_damage_component` is part of unused component runtime group `runtime.components.system.damage`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.components.system.shoot` lines 28549-28560: `runtime.components.system.shoot` covers unused shoot component labels: init_shoot_system, update_shoot_component. `project_usage.componentRuntime.usedComponents` is Animation, AutoControlScript, Box, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, WallGrab, so component type `Shoot` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.shoot` with 2 window(s).
- [patchable] `runtime.components.system.shoot:init_shoot_system` lines 28549-28550: `init_shoot_system` is part of unused component runtime group `runtime.components.system.shoot`. The group has no external references, so this window is removed only together with the other group windows.
- [patchable] `runtime.components.system.shoot:update_shoot_component` lines 28552-28555: `update_shoot_component` is part of unused component runtime group `runtime.components.system.shoot`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.components.system.in_water` lines 29701-29709: `runtime.components.system.in_water` covers unused in-water component labels: init_in_water_system, update_in_water_component. `project_usage.componentRuntime.usedComponents` is Animation, AutoControlScript, Box, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, WallGrab, so component type `InWater` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.in_water` with 2 window(s).
- [patchable] `runtime.components.system.in_water:init_in_water_system` lines 29701-29702: `init_in_water_system` is part of unused component runtime group `runtime.components.system.in_water`. The group has no external references, so this window is removed only together with the other group windows.
- [patchable] `runtime.components.system.in_water:update_in_water_component` lines 29704-29707: `update_in_water_component` is part of unused component runtime group `runtime.components.system.in_water`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.components.system.collectible` lines 29710-29729: `runtime.components.system.collectible` covers unused collectible component labels: init_collectible_system, update_collectible_component. `project_usage.componentRuntime.usedComponents` is Animation, AutoControlScript, Box, Carry, Collision, Cursors, DeadlyTiles, Gravity, Health, Input, Jump, Position, Sprite, StateMachine, TileInteraction, WallCollision, WallGrab, so component type `Collectible` is not used by active entities. No external references outside this component group were found. This is a candidate for a future atomic component-system patch. Atomic patch enabled as `runtime.components.system.collectible` with 2 window(s).
- [patchable] `runtime.components.system.collectible:init_collectible_system` lines 29710-29711: `init_collectible_system` is part of unused component runtime group `runtime.components.system.collectible`. The group has no external references, so this window is removed only together with the other group windows.
- [patchable] `runtime.components.system.collectible:update_collectible_component` lines 29713-29716: `update_collectible_component` is part of unused component runtime group `runtime.components.system.collectible`. The group has no external references, so this window is removed only together with the other group windows.

## state-machine-dispatch-handlers

- Metrics: findings=66, patchable=57, removed_lines=205, removed_source_bytes=5103
- Routines: Action_ChangeSprite, Action_ExitCurrentWorld, Action_Nop, Action_Nop:table:0, Action_Nop:table:1, Action_Nop:table:10, Action_Nop:table:11, Action_Nop:table:12, Action_Nop:table:13, Action_Nop:table:14, Action_Nop:table:15, Action_Nop:table:16, Action_Nop:table:17, Action_Nop:table:18, Action_Nop:table:19, Action_Nop:table:2, Action_Nop:table:20, Action_Nop:table:21, Action_Nop:table:22, Action_Nop:table:23, Action_Nop:table:24, Action_Nop:table:25, Action_Nop:table:26, Action_Nop:table:27, Action_Nop:table:28, Action_Nop:table:29, Action_Nop:table:3, Action_Nop:table:30, Action_Nop:table:31, Action_Nop:table:32, Action_Nop:table:33, Action_Nop:table:34, Action_Nop:table:35, Action_Nop:table:36, Action_Nop:table:37, Action_Nop:table:38, Action_Nop:table:39, Action_Nop:table:4, Action_Nop:table:41, Action_Nop:table:42, Action_Nop:table:43, Action_Nop:table:6, Action_Nop:table:9, Action_SetAnimSpeed, Action_ToggleAnim, Condition_And, Condition_AnimComplete, Condition_AnimComplete:table:12, Condition_KeyAndMove, Condition_Nop, Condition_Nop:table:0, Condition_Nop:table:10, Condition_Nop:table:11, Condition_Nop:table:15, Condition_Nop:table:16, Condition_Nop:table:17, Condition_Nop:table:4, Condition_Nop:table:5, Condition_Nop:table:7, Condition_Nop:table:8, Condition_Nop:table:9, Condition_Not, Condition_Or, Condition_TimeOut, Condition_VariableCompare, Condition_VariableCompare:table:14

- [patchable] `Action_Nop:table:0` lines 33672-33672: `Action_Nop` dispatch id 0 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:1` lines 33673-33673: `Action_Nop` dispatch id 1 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:2` lines 33674-33674: `Action_Nop` dispatch id 2 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:3` lines 33675-33675: `Action_Nop` dispatch id 3 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:4` lines 33676-33676: `Action_Nop` dispatch id 4 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:6` lines 33678-33678: `Action_Nop` dispatch id 6 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:9` lines 33681-33681: `Action_Nop` dispatch id 9 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:10` lines 33682-33682: `Action_Nop` dispatch id 10 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:11` lines 33683-33683: `Action_Nop` dispatch id 11 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:12` lines 33684-33684: `Action_Nop` dispatch id 12 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:13` lines 33685-33685: `Action_Nop` dispatch id 13 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:14` lines 33686-33686: `Action_Nop` dispatch id 14 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:15` lines 33687-33687: `Action_Nop` dispatch id 15 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:16` lines 33688-33688: `Action_Nop` dispatch id 16 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:17` lines 33689-33689: `Action_Nop` dispatch id 17 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:18` lines 33690-33690: `Action_Nop` dispatch id 18 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:19` lines 33691-33691: `Action_Nop` dispatch id 19 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:20` lines 33692-33692: `Action_Nop` dispatch id 20 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:21` lines 33693-33693: `Action_Nop` dispatch id 21 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:22` lines 33694-33694: `Action_Nop` dispatch id 22 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:23` lines 33695-33695: `Action_Nop` dispatch id 23 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:24` lines 33696-33696: `Action_Nop` dispatch id 24 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:25` lines 33697-33697: `Action_Nop` dispatch id 25 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:26` lines 33698-33698: `Action_Nop` dispatch id 26 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:27` lines 33699-33699: `Action_Nop` dispatch id 27 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:28` lines 33700-33700: `Action_Nop` dispatch id 28 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:29` lines 33701-33701: `Action_Nop` dispatch id 29 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:30` lines 33702-33702: `Action_Nop` dispatch id 30 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:31` lines 33703-33703: `Action_Nop` dispatch id 31 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:32` lines 33704-33704: `Action_Nop` dispatch id 32 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:33` lines 33705-33705: `Action_Nop` dispatch id 33 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:34` lines 33706-33706: `Action_Nop` dispatch id 34 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:35` lines 33707-33707: `Action_Nop` dispatch id 35 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:36` lines 33708-33708: `Action_Nop` dispatch id 36 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:37` lines 33709-33709: `Action_Nop` dispatch id 37 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:38` lines 33710-33710: `Action_Nop` dispatch id 38 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:39` lines 33711-33711: `Action_Nop` dispatch id 39 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:41` lines 33713-33713: `Action_Nop` dispatch id 41 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:42` lines 33714-33714: `Action_Nop` dispatch id 42 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop:table:43` lines 33715-33715: `Action_Nop` dispatch id 43 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Action_Nop` lines 33721-33731: `Action_Nop` is a state-machine action handler referenced by `SM_ActionTable` (40 table reference(s): SM_ActionTable@33672: `DW Action_Nop; 0`, SM_ActionTable@33673: `DW Action_Nop ; 1 [Action_SetPosition stripped]`, SM_ActionTable@33674: `DW Action_Nop ; 2 [Action_MoveBy stripped]`). Direct external references: none. Dispatch id 0 is not listed in `project_usage.stateMachineRuntime.usedActionIds`; this is only an unused-by-metadata signal. Patch enabled: all dispatch table ids for this handler are unused by project_usage metadata and there are no direct external references.
- [report-only] `Action_ChangeSprite` lines 33797-34126: `Action_ChangeSprite` is a state-machine action handler referenced by `SM_ActionTable` (1 table reference(s): SM_ActionTable@33677: `DW Action_ChangeSprite; 5`). Direct external references: none. Dispatch id 5 is listed in `project_usage.stateMachineRuntime.usedActionIds`. Patch disabled because one or more table dispatch ids are used or unknown.
- [report-only] `Action_SetAnimSpeed` lines 34127-34160: `Action_SetAnimSpeed` is a state-machine action handler referenced by `SM_ActionTable` (1 table reference(s): SM_ActionTable@33679: `DW Action_SetAnimSpeed; 7`). Direct external references: none. Dispatch id 7 is listed in `project_usage.stateMachineRuntime.usedActionIds`. Patch disabled because one or more table dispatch ids are used or unknown.
- [report-only] `Action_ToggleAnim` lines 34161-34260: `Action_ToggleAnim` is a state-machine action handler referenced by `SM_ActionTable` (1 table reference(s): SM_ActionTable@33680: `DW Action_ToggleAnim; 8`). Direct external references: none. Dispatch id 8 is listed in `project_usage.stateMachineRuntime.usedActionIds`. Patch disabled because one or more table dispatch ids are used or unknown.
- [report-only] `Action_ExitCurrentWorld` lines 34411-34420: `Action_ExitCurrentWorld` is a state-machine action handler referenced by `SM_ActionTable` (1 table reference(s): SM_ActionTable@33712: `DW Action_ExitCurrentWorld; 40`). Direct external references: none. Dispatch id 40 is listed in `project_usage.stateMachineRuntime.usedActionIds`. Patch disabled because one or more table dispatch ids are used or unknown.
- [patchable] `Condition_Nop:table:0` lines 34422-34422: `Condition_Nop` dispatch id 0 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_Nop:table:4` lines 34426-34426: `Condition_Nop` dispatch id 4 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_Nop:table:5` lines 34427-34427: `Condition_Nop` dispatch id 5 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_Nop:table:7` lines 34429-34429: `Condition_Nop` dispatch id 7 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_Nop:table:8` lines 34430-34430: `Condition_Nop` dispatch id 8 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_Nop:table:9` lines 34431-34431: `Condition_Nop` dispatch id 9 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_Nop:table:10` lines 34432-34432: `Condition_Nop` dispatch id 10 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_Nop:table:11` lines 34433-34433: `Condition_Nop` dispatch id 11 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_AnimComplete:table:12` lines 34434-34434: `Condition_AnimComplete` dispatch id 12 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_VariableCompare:table:14` lines 34436-34436: `Condition_VariableCompare` dispatch id 14 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_Nop:table:15` lines 34437-34437: `Condition_Nop` dispatch id 15 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_Nop:table:16` lines 34438-34438: `Condition_Nop` dispatch id 16 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_Nop:table:17` lines 34439-34439: `Condition_Nop` dispatch id 17 is unused by metadata, so the dispatch table entry is replaced with `DW 0` together with the handler body removal.
- [patchable] `Condition_Nop` lines 34445-34448: `Condition_Nop` is a state-machine condition handler referenced by `SM_ConditionTable` (11 table reference(s): SM_ConditionTable@34422: `DW Condition_Nop            ; 0`, SM_ConditionTable@34426: `DW Condition_Nop ; 4 [Condition_KeyPressed stripped]`, SM_ConditionTable@34427: `DW Condition_Nop ; 5 [Condition_KeyReleased stripped]`). Direct external references: none. Dispatch id 0 is not listed in `project_usage.stateMachineRuntime.usedConditionIds`; this is only an unused-by-metadata signal. Patch enabled: all dispatch table ids for this handler are unused by project_usage metadata and there are no direct external references.
- [report-only] `Condition_And` lines 34449-34481: `Condition_And` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@34423: `DW Condition_And            ; 1`). Direct external references: none. Dispatch id 1 is listed in `project_usage.stateMachineRuntime.usedConditionIds`. Patch disabled because one or more table dispatch ids are used or unknown.
- [report-only] `Condition_Or` lines 34482-34516: `Condition_Or` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@34424: `DW Condition_Or             ; 2`). Direct external references: none. Dispatch id 2 is listed in `project_usage.stateMachineRuntime.usedConditionIds`. Patch disabled because one or more table dispatch ids are used or unknown.
- [report-only] `Condition_Not` lines 34517-34543: `Condition_Not` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@34425: `DW Condition_Not            ; 3`). Direct external references: none. Dispatch id 3 is listed in `project_usage.stateMachineRuntime.usedConditionIds`. Patch disabled because one or more table dispatch ids are used or unknown.
- [report-only] `Condition_TimeOut` lines 34770-34831: `Condition_TimeOut` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@34428: `DW Condition_TimeOut        ; 6`). Direct external references: none. Dispatch id 6 is listed in `project_usage.stateMachineRuntime.usedConditionIds`. Patch disabled because one or more table dispatch ids are used or unknown.
- [patchable] `Condition_AnimComplete` lines 34832-34852: `Condition_AnimComplete` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@34434: `DW Condition_AnimComplete   ; 12`). Direct external references: none. Dispatch id 12 is not listed in `project_usage.stateMachineRuntime.usedConditionIds`; this is only an unused-by-metadata signal. Patch enabled: all dispatch table ids for this handler are unused by project_usage metadata and there are no direct external references.
- [report-only] `Condition_KeyAndMove` lines 34853-34898: `Condition_KeyAndMove` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@34435: `DW Condition_KeyAndMove     ; 13`). Direct external references: none. Dispatch id 13 is listed in `project_usage.stateMachineRuntime.usedConditionIds`. Patch disabled because one or more table dispatch ids are used or unknown.
- [patchable] `Condition_VariableCompare` lines 34899-35084: `Condition_VariableCompare` is a state-machine condition handler referenced by `SM_ConditionTable` (1 table reference(s): SM_ConditionTable@34436: `DW Condition_VariableCompare; 14`). Direct external references: none. Dispatch id 14 is not listed in `project_usage.stateMachineRuntime.usedConditionIds`; this is only an unused-by-metadata signal. Patch enabled: all dispatch table ids for this handler are unused by project_usage metadata and there are no direct external references.

## Optimization Passes

- Pass 1: findings=145, patchable=100, removed=565 lines / 17054 bytes, lines=47752->47187
- Pass 2: findings=10, patchable=0, removed=0 lines / 0 bytes, lines=47187->47187

