# Post-ASM Report

- Input: `C:\Users\salam\Documents\Programacion\Mideas\server\temp\patoantic249_backend_route_matrix_1778227582537_49268.post_asm_input.asm`
- Findings: 58
- Applied patches: 39
- Original lines: 50079
- Output lines: 49513
- Net line delta: -566

- Optimization passes run: 2
- Optimization source removed: 566 lines / 19126 bytes

## Mideas Block Inventory

- Blocks: 122
- Preserved blocks: 23
- Removable-by-policy blocks: 99
- Dead-block candidates: 21
- Annotated block source: 18130 lines / 510562 bytes
- Dead-candidate source: 311 lines / 9051 bytes
- Marker errors: 0

- By kind: data=3, routine=109, trampoline=10
- By owner: animtiles=1, bosses=13, components=34, entities=7, far-call=10, font=1, gameflow=10, hud=1, interrupt=5, mapper=1, menus=1, resources=1, screens=14, scroll=1, sound=13, sprites=1, stateMachine=4, unified=1, worlds=3
- By status: candidate_unreferenced=21, preserved=23, referenced=19, rooted=59

### Largest Annotated Blocks

| ID | Status | Source | Kind | Owner |
| --- | --- | --- | --- | --- |
| `runtime.statemachine.core` | `rooted` | 2311l/60794b | `routine` | `stateMachine` |
| `runtime.components.scheduler` | `rooted` | 1328l/31416b | `routine` | `components` |
| `runtime.components.wallcollision` | `referenced` | 839l/31288b | `routine` | `components` |
| `runtime.gameflow.submenu` | `rooted` | 1006l/24317b | `routine` | `gameflow` |
| `runtime.components.tile_interaction` | `rooted` | 966l/21802b | `routine` | `components` |
| `data.statemachine.statemachine_1771533517310` | `rooted` | 622l/20339b | `data` | `stateMachine` |
| `runtime.animtiles.core` | `rooted` | 540l/20056b | `routine` | `animtiles` |
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
| `runtime.components.deadly_tiles` | `rooted` | 262l/5874b | `routine` | `components` |

## Inactive Feature Runtime Inventory

| Feature | Findings | Patchable | Annotated | Unannotated | Preserved | Owners |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `bosses` | 18 | 0 | 18 | 0 | 15 | bosses=15, far-call=3 |

## Global Label Inventory

- Global labels: 1082

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

- Unannotated labels: 564

| Category | Labels | Source |
| --- | ---: | ---: |
| `bank_marker` | 30 | 1267l/56236b |
| `bios_helper` | 9 | 1678l/83341b |
| `boot_or_init` | 31 | 802l/21155b |
| `data` | 274 | 4484l/159176b |
| `far_trampoline` | 68 | 903l/18963b |
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
| `runtime.mapper.core` | `routine` | `mapper` | `rooted` | 177 | 213l/5412b | 21524-21736 | mapper_runtime_init, mapper_set_bank_p1, mapper_set_bank_p2, mapper_set_bank_p3, mapper_set_bank_p4, ... (+14) |
| `runtime.resources.manager` | `routine` | `resources` | `rooted` | 190 | 680l/17743b | 22768-23447 | resource_manager_init, resource_invalidate_pattern_vram_cache, resource_invalidate_color_vram_cache, resource_invalidate_font_vram_cache, resource_invalidate_gameplay_vram_cache, ... (+14) |
| `runtime.components.input_trigger_level` | `routine` | `components` | `candidate_unreferenced` | 0 | 33l/773b | 23529-23561 | component_trigger_level_pressed_a |
| `runtime.page0.stubs` | `routine` | `unified` | `rooted` | 1 | 22l/505b | 23568-23589 | init_page0_runtime_state, page0_map_expanded_slot, page0_map_game_rom, page0_restore_bios_rom, page0_copy_chunk_to_buffer, ... (+2) |
| `runtime.interrupt.stop` | `routine` | `interrupt` | `rooted` | 0 | 43l/1299b | 23668-23710 | stop_interrupt_system |
| `runtime.interrupt.dispatcher` | `routine` | `interrupt` | `preserved` | 1 | 124l/4150b | 23712-23835 | interrupt_dispatcher |
| `runtime.interrupt.vblank_flag` | `routine` | `interrupt` | `rooted` | 1 | 35l/983b | 23848-23882 | update_vblank_flag |
| `runtime.interrupt.task_api` | `routine` | `interrupt` | `rooted` | 2 | 121l/3195b | 23887-24007 | enable_task, disable_task, get_frame_count |
| `runtime.interrupt.task_input` | `routine` | `interrupt` | `rooted` | 2 | 231l/6052b | 24011-24241 | init_default_tasks_from_plan, task_update_input |
| `runtime.far_trampoline.init_sound_system_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/526b | 24951-24969 | init_sound_system_far |
| `runtime.far_trampoline.task_audio_tick_far` | `trampoline` | `far-call` | `preserved` | 0 | 19l/514b | 24971-24989 | task_audio_tick_far |
| `runtime.far_trampoline.sfx_update_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/484b | 24991-25009 | sfx_update_far |
| `runtime.far_trampoline.music_update_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/496b | 25011-25029 | music_update_far |
| `runtime.far_trampoline.music_stop_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/484b | 25031-25049 | music_stop_far |
| `runtime.far_trampoline.music_play_track_far` | `trampoline` | `far-call` | `preserved` | 1 | 21l/557b | 25051-25071 | music_play_track_far |
| `runtime.far_trampoline.music_execute_command_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/550b | 25073-25091 | music_execute_command_far |
| `runtime.far_trampoline.init_boss_system_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/520b | 25498-25516 | init_boss_system_far |
| `runtime.far_trampoline.init_screen_boss_from_current_screen_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/640b | 25518-25536 | init_screen_boss_from_current_screen_far |
| `runtime.far_trampoline.update_boss_system_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/532b | 25538-25556 | update_boss_system_far |
| `runtime.sound.resident.init` | `routine` | `sound` | `referenced` | 1 | 4l/184b | 25581-25584 | call_init_sound_system_resident |
| `runtime.sound.resident.tick` | `routine` | `sound` | `candidate_unreferenced` | 0 | 18l/606b | 25586-25603 | call_task_audio_tick_resident |
| `runtime.sound.resident.music_update` | `routine` | `sound` | `referenced` | 3 | 4l/190b | 25605-25608 | call_music_update_resident |
| `runtime.sound.resident.sfx_update` | `routine` | `sound` | `referenced` | 1 | 4l/182b | 25610-25613 | call_sfx_update_resident |
| `runtime.sound.resident.music_stop` | `routine` | `sound` | `referenced` | 1 | 4l/182b | 25615-25618 | call_music_stop_resident |
| `runtime.sound.resident.music_play_track` | `routine` | `sound` | `referenced` | 2 | 4l/206b | 25620-25623 | call_music_play_track_resident |
| `runtime.sound.resident.music_execute_command` | `routine` | `sound` | `referenced` | 1 | 4l/226b | 25625-25628 | call_music_execute_command_resident |
| `runtime.boss.resident.init` | `routine` | `bosses` | `preserved` | 0 | 4l/232b | 25742-25745 | call_init_boss_system_resident |
| `runtime.boss.resident.init_screen` | `routine` | `bosses` | `preserved` | 0 | 4l/306b | 25747-25750 | call_init_screen_boss_from_current_screen_resident |
| `runtime.boss.resident.update` | `routine` | `bosses` | `preserved` | 0 | 4l/242b | 25752-25755 | call_update_boss_system_resident |
| `runtime.boss.resident.update_projectile` | `routine` | `bosses` | `preserved` | 0 | 4l/279b | 25757-25760 | call_update_boss_projectile_runtime_resident |
| `runtime.boss.resident.draw_attack` | `routine` | `bosses` | `preserved` | 0 | 4l/239b | 25762-25765 | call_draw_boss_attack_resident |
| `runtime.boss.resident.draw_meteor` | `routine` | `bosses` | `preserved` | 0 | 4l/253b | 25767-25770 | call_draw_boss_meteor_attack_resident |
| `runtime.boss.resident.draw_bomb` | `routine` | `bosses` | `preserved` | 0 | 4l/245b | 25772-25775 | call_draw_boss_bomb_attack_resident |
| `runtime.boss.resident.draw_boomerang` | `routine` | `bosses` | `preserved` | 0 | 4l/265b | 25777-25780 | call_draw_boss_boomerang_attack_resident |
| `runtime.boss.resident.draw_rock` | `routine` | `bosses` | `preserved` | 0 | 4l/245b | 25782-25785 | call_draw_boss_rock_attack_resident |
| `runtime.boss.resident.draw_laser` | `routine` | `bosses` | `preserved` | 0 | 4l/249b | 25787-25790 | call_draw_boss_laser_attack_resident |
| `runtime.boss.resident.draw_sine_wave` | `routine` | `bosses` | `preserved` | 0 | 4l/265b | 25792-25795 | call_draw_boss_sine_wave_attack_resident |
| `runtime.boss.resident.draw_homing_missile` | `routine` | `bosses` | `preserved` | 0 | 4l/285b | 25797-25800 | call_draw_boss_homing_missile_attack_resident |
| `runtime.components.init` | `routine` | `components` | `rooted` | 11 | 82l/2818b | 26060-26141 | component_fill_32_a, init_components |
| `runtime.components.position` | `routine` | `components` | `rooted` | 3 | 108l/3281b | 26143-26250 | init_position_system, update_position_component, position_update_loop, position_next_entity |
| `runtime.components.sprite` | `routine` | `components` | `rooted` | 6 | 396l/10316b | 26251-26646 | init_sprite_system, update_sprite_component, sprite_update_loop, sprite_layer_loop, sprite_continue, ... (+6) |
| `runtime.components.movement_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 26652-26655 | update_movement_component |
| `runtime.components.collision` | `routine` | `components` | `referenced` | 2 | 668l/18861b | 26656-27323 | init_collision_system, update_collision_component, collision_update_loop, collision_next_entity, update_entity_collision_fast, ... (+13) |
| `runtime.components.behavior_tile` | `routine` | `components` | `rooted` | 17 | 110l/3809b | 27324-27433 | get_behavior_tile, get_behavior_tile_nb, gbt_oob |
| `runtime.components.directional_sprite_sync` | `routine` | `components` | `rooted` | 3 | 87l/2084b | 27434-27520 | component_sync_directional_sprite_from_initial, component_sync_directional_sprite_from_current, component_sync_directional_sprite_common |
| `runtime.components.input` | `routine` | `components` | `referenced` | 2 | 388l/12766b | 27521-27908 | init_input_system, update_input_component, input_update_loop, input_move_up, input_move_down, ... (+16) |
| `runtime.components.behavior_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 27914-27917 | update_behavior_component |
| `runtime.components.health` | `routine` | `components` | `rooted` | 2 | 152l/4701b | 27918-28069 | init_health_system, update_health_component, decrease_entity_lives, increase_entity_lives |
| `runtime.components.animation` | `routine` | `components` | `referenced` | 4 | 342l/10555b | 28070-28411 | init_animation_system, update_animation_component, anim_done_entity, refresh_player_animation_fastpath |
| `runtime.components.jump` | `routine` | `components` | `referenced` | 2 | 233l/7043b | 28412-28644 | init_jump_system, update_jump_component, jump_update_loop, jump_done_entity, jump_next_entity |
| `runtime.components.gravity` | `routine` | `components` | `rooted` | 2 | 137l/4553b | 28645-28781 | init_gravity_system, update_gravity_component, gravity_update_loop, gravity_store_vel, gravity_grounded, ... (+2) |
| `runtime.components.walljump_stub` | `routine` | `components` | `referenced` | 2 | 18l/326b | 28802-28819 | init_walljump_system, update_walljump_component, walljump_process_entity_c, walljump_input_is_left, walljump_input_is_right |
| `runtime.components.auto_destroy_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/219b | 28822-28828 | init_auto_destroy_system, update_auto_destroy_component |
| `runtime.components.state_machine_component_stub` | `routine` | `components` | `referenced` | 1 | 7l/241b | 28852-28858 | init_statemachine_system, update_statemachine_component |
| `runtime.components.retractable_gate_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/196b | 28864-28867 | update_retractable_gate_component |
| `runtime.components.carry_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/163b | 28873-28876 | update_carry_component |
| `runtime.components.auto_control_script_stubs` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/252b | 28882-28888 | update_auto_control_script_component, update_auto_event_string_component |
| `runtime.components.damage_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/166b | 28894-28897 | update_damage_component |
| `runtime.components.shoot_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/163b | 28903-28906 | update_shoot_component |
| `runtime.components.platform_riding_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/220b | 28926-28932 | prepare_platform_detection, update_platform_riding |
| `runtime.components.wallcollision` | `routine` | `components` | `referenced` | 11 | 839l/31288b | 28933-29771 | init_wallcollision_system, wall_behavior_is_full_blocker, wall_down_behavior_blocks, update_wallcollision_component, wall_build_hitbox_cache, ... (+2) |
| `runtime.components.deadly_tiles` | `routine` | `components` | `rooted` | 3 | 262l/5874b | 29772-30033 | init_deadly_tiles_system, deadly_tiles_runtime_tile_is_deadly_nb, update_entity_deadly_flag_runtime, update_deadly_tiles_component, refresh_player_deadly_fastpath |
| `runtime.components.in_water_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 30039-30042 | update_in_water_component |
| `runtime.components.collectible_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/181b | 30048-30051 | update_collectible_component |
| `runtime.components.tile_interaction` | `routine` | `components` | `rooted` | 4 | 966l/21802b | 30052-31017 | interaction_target_variable_ptr_table, interaction_target_variable_word_table, init_tile_interaction_system, update_slash_component, record_bonus_respawn_slot, ... (+8) |
| `runtime.components.collected_tiles` | `routine` | `components` | `rooted` | 1 | 76l/3015b | 31018-31093 | apply_collected_tiles |
| `runtime.components.entity_management` | `routine` | `components` | `rooted` | 3 | 221l/6549b | 31094-31314 | create_entity, entity_job_set, entity_job_set_period_ok, entity_job_set_entry_wrap, entity_job_set_entry_ok, ... (+13) |
| `runtime.components.scheduler` | `routine` | `components` | `rooted` | 7 | 1328l/31416b | 31315-32642 | update_all_entities, mark_used_entity_list_dirty, ensure_used_entity_list_current, rebuild_used_entity_list, ensure_player_fast_runtime_bound, ... (+11) |
| `runtime.components.state_machine_executor` | `routine` | `components` | `rooted` | 2 | 74l/1973b | 32648-32721 | execute_all_state_machines, refresh_player_state_machine_fastpath |
| `runtime.components.legacy_tile_collision` | `routine` | `components` | `candidate_unreferenced` | 0 | 43l/1404b | 32731-32773 | get_tile_at_position, get_tile_behavior, tile_behavior_table, check_collision_at_point, check_collision_box, ... (+1) |
| `runtime.components.secret_zones` | `routine` | `components` | `rooted` | 1 | 258l/6746b | 32810-33067 | update_secret_zone_component, secret_zone_apply_current_rect, secret_zone_restore_current_rect, secret_zone_clear_state, secret_zone_compute_offset |
| `runtime.statemachine.core` | `routine` | `stateMachine` | `rooted` | 5 | 2311l/60794b | 33075-35385 | SM_Update, sm_timer_no_overflow, sm_update_done, SM_CheckTransitions, SM_CheckTransitions_Loop, ... (+43) |
| `data.statemachine.sound-tables` | `data` | `stateMachine` | `rooted` | 1 | 34l/1115b | 35475-35508 | SM_SoundPtrTable, SM_SoundAsset_0, SM_SoundAsset_0_Frames, SM_SoundAsset_1, SM_SoundAsset_1_Frames |
| `data.statemachine.statemachine_1771533517310` | `data` | `stateMachine` | `rooted` | 4 | 622l/20339b | 35509-36130 | SM_New_Statemachine_state_1771533526010, SM_New_Statemachine_state_1771533526010_OnEnter, SM_New_Statemachine_state_1771533526010_Transitions, SM_New_Statemachine_state_1771533526010_Transitions_Actions_2, SM_New_Statemachine_state_1771533526010_Transitions_Actions_3, ... (+43) |
| `data.statemachine.statemachine_1775000000009` | `data` | `stateMachine` | `rooted` | 2 | 36l/1733b | 36131-36166 | SM_Exit_Door_Gem_Gate_state_exit_hidden_1775000000012, SM_Exit_Door_Gem_Gate_state_exit_hidden_1775000000012_OnEnter, SM_Exit_Door_Gem_Gate_state_exit_hidden_1775000000012_Transitions, SM_Exit_Door_Gem_Gate_state_exit_open_1775000000013, SM_Exit_Door_Gem_Gate_state_exit_open_1775000000013_OnEnter |
| `runtime.gameflow.text_screen` | `routine` | `gameflow` | `rooted` | 2 | 160l/4353b | 36327-36486 | show_text_screen, wait_for_fire |
| `runtime.gameflow.submenu` | `routine` | `gameflow` | `rooted` | 1 | 1006l/24317b | 36521-37526 | show_menu_placeholder, render_submenu_screen, submenu_calc_vram_addr, submenu_string_length, submenu_compute_center_col, ... (+11) |
| `runtime.gameflow.presentation_wait_frames` | `routine` | `gameflow` | `candidate_unreferenced` | 0 | 13l/318b | 37554-37566 | gameflow_presentation_wait_frames |
| `runtime.gameflow.worldlink` | `routine` | `gameflow` | `rooted` | 1 | 95l/2642b | 37615-37709 | gameflow_handle_worldlink |
| `runtime.gameflow.if_then_else` | `routine` | `gameflow` | `rooted` | 1 | 138l/2748b | 37711-37848 | gameflow_handle_ifthenelse |
| `runtime.gameflow.connection_by_type` | `routine` | `gameflow` | `referenced` | 3 | 37l/701b | 37918-37954 | gameflow_get_connection_by_type |
| `runtime.gameflow.confirm_input_direct` | `routine` | `gameflow` | `referenced` | 4 | 12l/298b | 37979-37990 | gameflow_read_confirm_direct |
| `runtime.gameflow.world_loop` | `routine` | `gameflow` | `rooted` | 1 | 84l/2738b | 37998-38081 | gameflow_world_game_loop |
| `runtime.gameflow.screen_timer` | `routine` | `gameflow` | `rooted` | 1 | 144l/3220b | 38088-38231 | get_world_screen_timer_frames_per_second, reload_world_screen_timer_frames, snapshot_world_screen_timer_interrupt_counter, reset_world_screen_timer, update_world_screen_timer |
| `runtime.gameflow.clear_screen_area_helpers` | `routine` | `gameflow` | `referenced` | 2 | 60l/1737b | 38566-38625 | clear_screen_area, clear_screen_row, empty_row_data |
| `runtime.screens.colors` | `routine` | `screens` | `rooted` | 1 | 44l/1514b | 40201-40244 | color_shift_table, set_screen_colors |
| `runtime.screens.copy_rect` | `routine` | `screens` | `rooted` | 4 | 77l/1494b | 40338-40414 | copy_layout_rect_to_vram, copy_layout_rect_ram_to_ram |
| `runtime.screens.block_layout_expander` | `routine` | `screens` | `rooted` | 0 | 194l/3798b | 40416-40609 | expand_screen_block_layout_to_background, expand_screen_block_layout_2x2, expand_screen_block_layout_4x4 |
| `runtime.screens.behavior_map_rebuild` | `routine` | `screens` | `candidate_unreferenced` | 0 | 26l/709b | 40627-40652 | build_runtime_behavior_map_from_screen_layout |
| `runtime.screens.load_screen_stub` | `routine` | `screens` | `candidate_unreferenced` | 0 | 6l/232b | 40653-40658 | load_screen |
| `runtime.screens.load_screen_pan1_770754008863.loader` | `routine` | `screens` | `rooted` | 1 | 115l/4298b | 40787-40901 | load_screen_pan1_770754008863, load_pan1_770754008863_boss_done |
| `runtime.screens.load_screen_pan2_771184738851.loader` | `routine` | `screens` | `rooted` | 1 | 115l/4297b | 41030-41144 | load_screen_pan2_771184738851, load_pan2_771184738851_boss_done |
| `runtime.screens.load_screen_background1_771482721894.loader` | `routine` | `screens` | `rooted` | 1 | 111l/4301b | 41146-41256 | load_screen_background1_771482721894, load_background1_771482721894_boss_done |
| `runtime.screens.load_screen_pan3_771880109228.loader` | `routine` | `screens` | `rooted` | 1 | 115l/4298b | 41385-41499 | load_screen_pan3_771880109228, load_pan3_771880109228_boss_done |
| `runtime.screens.load_screen_pan4_772291683578.loader` | `routine` | `screens` | `rooted` | 1 | 115l/4297b | 41628-41742 | load_screen_pan4_772291683578, load_pan4_772291683578_boss_done |
| `runtime.screens.load_screen_pan5_773321312901.loader` | `routine` | `screens` | `rooted` | 1 | 112l/4183b | 41744-41855 | load_screen_pan5_773321312901, load_pan5_773321312901_boss_done |
| `runtime.screens.load_screen_pan6_773382451315.loader` | `routine` | `screens` | `rooted` | 1 | 112l/4183b | 41857-41968 | load_screen_pan6_773382451315, load_pan6_773382451315_boss_done |
| `runtime.screens.load_screen_pan1_2_774194791624.loader` | `routine` | `screens` | `rooted` | 1 | 115l/4346b | 42097-42211 | load_screen_pan1_2_774194791624, load_pan1_2_774194791624_boss_done |
| `data.entities.hero_1.init` | `routine` | `entities` | `rooted` | 1 | 187l/5474b | 42454-42640 | init_hero_1 |
| `data.entities.pato_1.init` | `routine` | `entities` | `rooted` | 1 | 162l/4330b | 42659-42820 | init_pato_1 |
| ... | ... | ... | ... | ... | ... | ... | +22 more blocks |

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

- [patchable] `runtime.components.input_trigger_level` lines 23529-23561: Block `runtime.components.input_trigger_level` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: component_trigger_level_pressed_a.
- [patchable] `runtime.sound.resident.tick` lines 25586-25603: Block `runtime.sound.resident.tick` (routine/sound) is a dead-code candidate. No external references found for any global label in this block. Labels: call_task_audio_tick_resident.
- [patchable] `runtime.components.movement_stub` lines 26652-26655: Block `runtime.components.movement_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_movement_component.
- [patchable] `runtime.components.behavior_stub` lines 27914-27917: Block `runtime.components.behavior_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_behavior_component.
- [patchable] `runtime.components.auto_destroy_stub` lines 28822-28828: Block `runtime.components.auto_destroy_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: init_auto_destroy_system, update_auto_destroy_component.
- [patchable] `runtime.components.retractable_gate_stub` lines 28864-28867: Block `runtime.components.retractable_gate_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_retractable_gate_component.
- [patchable] `runtime.components.carry_stub` lines 28873-28876: Block `runtime.components.carry_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_carry_component.
- [patchable] `runtime.components.auto_control_script_stubs` lines 28882-28888: Block `runtime.components.auto_control_script_stubs` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_auto_control_script_component, update_auto_event_string_component.
- [patchable] `runtime.components.damage_stub` lines 28894-28897: Block `runtime.components.damage_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_damage_component.
- [patchable] `runtime.components.shoot_stub` lines 28903-28906: Block `runtime.components.shoot_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_shoot_component.
- [patchable] `runtime.components.platform_riding_stub` lines 28926-28932: Block `runtime.components.platform_riding_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: prepare_platform_detection, update_platform_riding.
- [patchable] `runtime.components.in_water_stub` lines 30039-30042: Block `runtime.components.in_water_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_in_water_component.
- [patchable] `runtime.components.collectible_stub` lines 30048-30051: Block `runtime.components.collectible_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_collectible_component.
- [patchable] `runtime.components.legacy_tile_collision` lines 32731-32773: Block `runtime.components.legacy_tile_collision` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: get_tile_at_position, get_tile_behavior, tile_behavior_table, check_collision_at_point, check_collision_box, ... (+1).
- [patchable] `runtime.gameflow.presentation_wait_frames` lines 37554-37566: Block `runtime.gameflow.presentation_wait_frames` (routine/gameflow) is a dead-code candidate. No external references found for any global label in this block. Labels: gameflow_presentation_wait_frames.
- [patchable] `runtime.screens.behavior_map_rebuild` lines 40627-40652: Block `runtime.screens.behavior_map_rebuild` (routine/screens) is a dead-code candidate. No external references found for any global label in this block. Labels: build_runtime_behavior_map_from_screen_layout.
- [patchable] `runtime.screens.load_screen_stub` lines 40653-40658: Block `runtime.screens.load_screen_stub` (routine/screens) is a dead-code candidate. No external references found for any global label in this block. Labels: load_screen.
- [patchable] `runtime.sprites.show_sprite_legacy` lines 44987-45029: Block `runtime.sprites.show_sprite_legacy` (routine/sprites) is a dead-code candidate. No external references found for any global label in this block. Labels: show_sprite.
- [patchable] `runtime.worlds.current_screen_helpers` lines 46185-46207: Block `runtime.worlds.current_screen_helpers` (routine/worlds) is a dead-code candidate. No external references found for any global label in this block. Labels: get_current_world_id, get_current_screen_index, set_current_screen.
- [patchable] `runtime.screens.presentation_wait_frames` lines 47548-47560: Block `runtime.screens.presentation_wait_frames` (routine/screens) is a dead-code candidate. No external references found for any global label in this block. Labels: presentation_wait_frames.
- [patchable] `runtime.menus.gfn_1773429482585` lines 49964-50003: Block `runtime.menus.gfn_1773429482585` (routine/menus) is a dead-code candidate. No external references found for any global label in this block. Labels: show_menu_gfn_1773429482585, menu_gfn_1773429482585_title, handle_menu_gfn_1773429482585.

## unused-screen-loaders

- Metrics: findings=2, patchable=2, removed_lines=128, removed_source_bytes=4726
- Routines: load_screen_background1_771482721894_far, runtime.screens.load_screen_background1_771482721894.loader

- [patchable] `load_screen_background1_771482721894_far` lines 24333-24350: `load_screen_background1_771482721894_far` is a generated screen loader (18 lines, 426 source bytes) with no external label references. Category reason: Generated screen loader routine. Project metadata maps it to scene `background1` (index=2, resources=8). GameFlow reachability marks this scene unreachable. Related annotated loader block `runtime.screens.load_screen_background1_771482721894.loader` is currently rooted by `load_screen_background1_771482721894`. Deletion is patchable only when GameFlow reachability proves the scene is unreachable.
- [patchable] `runtime.screens.load_screen_background1_771482721894.loader` lines 41146-41256: Annotated loader block `runtime.screens.load_screen_background1_771482721894.loader` only feeds `load_screen_background1_771482721894_far`, and GameFlow reachability marks the owning scene unreachable.

## inactive-feature-runtime

- Metrics: findings=35, patchable=16, removed_lines=127, removed_source_bytes=5349
- Routines: call_draw_boss_attack_resident, call_draw_boss_bomb_attack_resident, call_draw_boss_boomerang_attack_resident, call_draw_boss_homing_missile_attack_resident, call_draw_boss_laser_attack_resident, call_draw_boss_meteor_attack_resident, call_draw_boss_rock_attack_resident, call_draw_boss_sine_wave_attack_resident, call_init_boss_system_resident, call_init_screen_boss_from_current_screen_resident, call_update_boss_projectile_runtime_resident, call_update_boss_system_resident, init_boss_system, init_boss_system_far, init_screen_boss_from_current_screen, init_screen_boss_from_current_screen_far, runtime.boss.group.stubs, runtime.boss.group.stubs:call_draw_boss_attack_resident, runtime.boss.group.stubs:call_draw_boss_bomb_attack_resident, runtime.boss.group.stubs:call_draw_boss_boomerang_attack_resident, runtime.boss.group.stubs:call_draw_boss_homing_missile_attack_resident, runtime.boss.group.stubs:call_draw_boss_laser_attack_resident, runtime.boss.group.stubs:call_draw_boss_meteor_attack_resident, runtime.boss.group.stubs:call_draw_boss_rock_attack_resident, runtime.boss.group.stubs:call_draw_boss_sine_wave_attack_resident, runtime.boss.group.stubs:call_init_boss_system_resident, runtime.boss.group.stubs:call_init_screen_boss_from_current_screen_resident, runtime.boss.group.stubs:call_update_boss_projectile_runtime_resident, runtime.boss.group.stubs:call_update_boss_system_resident, runtime.boss.group.stubs:init_boss_system, runtime.boss.group.stubs:init_boss_system_far, runtime.boss.group.stubs:init_screen_boss_from_current_screen_far, runtime.boss.group.stubs:update_boss_system_far, update_boss_system, update_boss_system_far

- [patchable] `runtime.boss.group.stubs:init_boss_system_far` lines 25498-25516: `init_boss_system_far` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.boss.group.stubs` lines 25499-50075: `runtime.boss.group.stubs` groups inactive boss compatibility stubs runtime labels: call_draw_boss_attack_resident, call_draw_boss_bomb_attack_resident, call_draw_boss_boomerang_attack_resident, call_draw_boss_homing_missile_attack_resident, call_draw_boss_laser_attack_resident, call_draw_boss_meteor_attack_resident, call_draw_boss_rock_attack_resident, call_draw_boss_sine_wave_attack_resident, call_init_boss_system_resident, call_init_screen_boss_from_current_screen_resident, call_update_boss_projectile_runtime_resident, call_update_boss_system_resident, init_boss_system, init_boss_system_far, init_screen_boss_from_current_screen, init_screen_boss_from_current_screen_far, update_boss_system, update_boss_system_far. No external references outside the group were found. This is ready for a future atomic multi-window patch, or for dead-blocks to remove the annotated windows as whole groups. Atomic patch enabled as `runtime.boss.group.stubs` with 16 window(s).
- [report-only] `init_boss_system_far` lines 25499-25518: `init_boss_system_far` looks like bosses runtime (20 lines, 541 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: boot_or_init (Boot/init routine). External references still exist (1): call_init_boss_system_resident@25744. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.far_trampoline.init_boss_system_far` owner=`far-call` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:init_screen_boss_from_current_screen_far` lines 25518-25536: `init_screen_boss_from_current_screen_far` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `init_screen_boss_from_current_screen_far` lines 25519-25538: `init_screen_boss_from_current_screen_far` looks like bosses runtime (20 lines, 623 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: boot_or_init (Boot/init routine). External references still exist (1): call_init_screen_boss_from_current_screen_resident@25749. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.far_trampoline.init_screen_boss_from_current_screen_far` owner=`far-call` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:update_boss_system_far` lines 25538-25556: `update_boss_system_far` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `update_boss_system_far` lines 25539-25562: `update_boss_system_far` looks like bosses runtime (24 lines, 762 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_update_boss_system_resident@25754. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.far_trampoline.update_boss_system_far` owner=`far-call` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_init_boss_system_resident` lines 25742-25745: `call_init_boss_system_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_init_boss_system_resident` lines 25743-25747: `call_init_boss_system_resident` looks like bosses runtime (5 lines, 260 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.init` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_init_screen_boss_from_current_screen_resident` lines 25747-25750: `call_init_screen_boss_from_current_screen_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_init_screen_boss_from_current_screen_resident` lines 25748-25752: `call_init_screen_boss_from_current_screen_resident` looks like bosses runtime (5 lines, 284 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.init_screen` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_update_boss_system_resident` lines 25752-25755: `call_update_boss_system_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_update_boss_system_resident` lines 25753-25757: `call_update_boss_system_resident` looks like bosses runtime (5 lines, 266 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.update` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_update_boss_projectile_runtime_resident` lines 25757-25760: `call_update_boss_projectile_runtime_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_update_boss_projectile_runtime_resident` lines 25758-25762: `call_update_boss_projectile_runtime_resident` looks like bosses runtime (5 lines, 260 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.update_projectile` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_attack_resident` lines 25762-25765: `call_draw_boss_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_attack_resident` lines 25763-25767: `call_draw_boss_attack_resident` looks like bosses runtime (5 lines, 247 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_attack` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_meteor_attack_resident` lines 25767-25770: `call_draw_boss_meteor_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_meteor_attack_resident` lines 25768-25772: `call_draw_boss_meteor_attack_resident` looks like bosses runtime (5 lines, 250 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_meteor` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_bomb_attack_resident` lines 25772-25775: `call_draw_boss_bomb_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_bomb_attack_resident` lines 25773-25777: `call_draw_boss_bomb_attack_resident` looks like bosses runtime (5 lines, 256 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_bomb` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_boomerang_attack_resident` lines 25777-25780: `call_draw_boss_boomerang_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_boomerang_attack_resident` lines 25778-25782: `call_draw_boss_boomerang_attack_resident` looks like bosses runtime (5 lines, 256 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_boomerang` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_rock_attack_resident` lines 25782-25785: `call_draw_boss_rock_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_rock_attack_resident` lines 25783-25787: `call_draw_boss_rock_attack_resident` looks like bosses runtime (5 lines, 248 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_rock` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_laser_attack_resident` lines 25787-25790: `call_draw_boss_laser_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_laser_attack_resident` lines 25788-25792: `call_draw_boss_laser_attack_resident` looks like bosses runtime (5 lines, 258 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_laser` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_sine_wave_attack_resident` lines 25792-25795: `call_draw_boss_sine_wave_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_sine_wave_attack_resident` lines 25793-25797: `call_draw_boss_sine_wave_attack_resident` looks like bosses runtime (5 lines, 276 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_sine_wave` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:call_draw_boss_homing_missile_attack_resident` lines 25797-25800: `call_draw_boss_homing_missile_attack_resident` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_draw_boss_homing_missile_attack_resident` lines 25798-25801: `call_draw_boss_homing_missile_attack_resident` looks like bosses runtime (4 lines, 133 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Block ownership: `runtime.boss.resident.draw_homing_missile` owner=`bosses` preserve=true. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.boss.group.stubs:init_boss_system` lines 50051-50072: `init_boss_system` is part of inactive runtime group `runtime.boss.group.stubs`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `init_boss_system` lines 50052-50066: `init_boss_system` looks like bosses runtime (15 lines, 330 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: boot_or_init (Boot/init routine). External references still exist (1): init_boss_system_far@25506. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.boss.entry` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `update_boss_system` lines 50067-50069: `update_boss_system` looks like bosses runtime (3 lines, 29 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): update_boss_system_far@25546. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.boss.entry` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `init_screen_boss_from_current_screen` lines 50070-50075: `init_screen_boss_from_current_screen` looks like bosses runtime (6 lines, 140 source bytes), but project_usage marks feature `bosses` disabled (bosses=0, bossInstances=0). Category: boot_or_init (Boot/init routine). External references still exist (1): init_screen_boss_from_current_screen_far@25526. Deletion must stay blocked until callers are proven dead or rewired. Block ownership: `runtime.boss.entry` owner=`bosses` preserve=false. Patch policy: feature family `bosses` is report-only; currently patchable inactive families: `sounds`. This is report-only until the generator metadata and invariants prove deletion is safe.

## Optimization Passes

- Pass 1: findings=58, patchable=39, removed=566 lines / 19126 bytes, lines=50079->49513
- Pass 2: findings=0, patchable=0, removed=0 lines / 0 bytes, lines=49513->49513

