# Post-ASM Report

- Input: `C:\Users\salam\Documents\Programacion\Mideas\server\temp\joc64_far_block_check.asm`
- Findings: 59
- Applied patches: 20
- Original lines: 34934
- Output lines: 34661
- Net line delta: -273

- Optimization passes run: 2
- Optimization source removed: 273 lines / 7727 bytes

## Mideas Block Inventory

- Blocks: 139
- Preserved blocks: 56
- Removable-by-policy blocks: 83
- Dead-block candidates: 18
- Annotated block source: 16985 lines / 464621 bytes
- Dead-candidate source: 247 lines / 7081 bytes
- Marker errors: 0

- By kind: data=1, routine=83, trampoline=55
- By owner: animtiles=1, bosses=2, components=33, entities=3, far-call=55, font=1, gameflow=7, hud=1, interrupt=5, mapper=1, resources=1, screens=7, scroll=1, sound=15, sprites=1, stateMachine=2, unified=1, worlds=2
- By status: candidate_unreferenced=18, preserved=56, referenced=20, rooted=45

### Largest Annotated Blocks

| ID | Status | Source | Kind | Owner |
| --- | --- | --- | --- | --- |
| `runtime.statemachine.core` | `rooted` | 2268l/60444b | `routine` | `stateMachine` |
| `runtime.components.scheduler` | `rooted` | 1582l/36089b | `routine` | `components` |
| `runtime.components.wallcollision` | `referenced` | 839l/31288b | `routine` | `components` |
| `runtime.boss.core` | `rooted` | 1362l/29800b | `routine` | `bosses` |
| `runtime.components.collision` | `referenced` | 668l/18861b | `routine` | `components` |
| `runtime.resources.manager` | `rooted` | 680l/17743b | `routine` | `resources` |
| `runtime.components.tile_interaction` | `rooted` | 641l/15812b | `routine` | `components` |
| `runtime.hud.core` | `rooted` | 602l/14282b | `routine` | `hud` |
| `data.statemachine.statemachine_1776707734563` | `rooted` | 356l/12906b | `data` | `stateMachine` |
| `runtime.components.input` | `referenced` | 388l/12766b | `routine` | `components` |
| `runtime.animtiles.core` | `rooted` | 434l/12491b | `routine` | `animtiles` |
| `runtime.components.animation` | `referenced` | 342l/10555b | `routine` | `components` |
| `runtime.components.sprite` | `rooted` | 396l/10316b | `routine` | `components` |
| `runtime.scroll.core` | `rooted` | 344l/8639b | `routine` | `scroll` |
| `runtime.components.jump` | `referenced` | 233l/7043b | `routine` | `components` |
| `runtime.font.loading` | `rooted` | 223l/6725b | `routine` | `font` |
| `runtime.components.entity_management` | `rooted` | 221l/6549b | `routine` | `components` |
| `runtime.interrupt.task_input` | `rooted` | 228l/5981b | `routine` | `interrupt` |
| `runtime.components.deadly_tiles` | `rooted` | 262l/5874b | `routine` | `components` |
| `runtime.mapper.core` | `rooted` | 213l/5412b | `routine` | `mapper` |

## Global Label Inventory

- Global labels: 873

| Label | Category | Source |
| --- | --- | --- |
| `FAST_SNSMAT` | `bios_helper` | 1145l/69173b |
| `update_wallcollision_component` | `runtime_code` | 538l/20410b |
| `Action_ChangeSprite` | `runtime_code` | 329l/14785b |
| `update_player_fastpath` | `runtime_code` | 604l/13839b |
| `tile_pattern_bank0` | `data` | 227l/12655b |
| `tile_color_bank0` | `data` | 224l/11795b |
| `update_entity_collision_fast` | `runtime_code` | 345l/9814b |
| `scan_tile_interaction_entities` | `runtime_code` | 355l/9254b |
| `update_animation_component` | `runtime_code` | 255l/8328b |
| `BANK_0_USED_END` | `bank_marker` | 141l/7678b |
| `vdpLoop` | `bios_helper` | 192l/6712b |
| `resource_table` | `data` | 367l/5679b |
| `FAR_BANK_6_ROM_START` | `bank_marker` | 112l/5554b |
| `BANK_2_USED_END` | `bank_marker` | 89l/5039b |
| `task_update_input` | `shared_runtime` | 199l/4970b |
| `init_player_1` | `boot_or_init` | 177l/4877b |
| `tilebank_pattern_data_1` | `data` | 58l/4842b |
| `tilebank_pattern_data_0` | `data` | 58l/4842b |
| `tilebank_color_data_1` | `data` | 58l/4840b |
| `tilebank_color_data_0` | `data` | 58l/4840b |
| `jump_update_loop` | `runtime_code` | 157l/4675b |
| `render_hud` | `runtime_code` | 164l/4492b |
| `rebuild_used_entity_list` | `runtime_code` | 207l/4475b |
| `update_boss_system` | `runtime_code` | 135l/4269b |
| `interrupt_dispatcher` | `shared_runtime` | 122l/4176b |
| `mapper_call_hl_auto` | `shared_runtime` | 104l/4109b |
| `Condition_VariableCompare` | `runtime_code` | 186l/3892b |
| `wall_build_hitbox_cache` | `runtime_code` | 121l/3875b |
| `load_screen_pan1_776511902784` | `screen_loader` | 94l/3733b |
| `SCREEN_PAN1_0_INTERACTION_TARGET_MAP` | `runtime_code` | 58l/3694b |

### Largest Unannotated Global Labels

- Unannotated labels: 342

| Category | Labels | Source |
| --- | ---: | ---: |
| `bank_marker` | 27 | 848l/38109b |
| `bios_helper` | 9 | 1746l/87462b |
| `boot_or_init` | 24 | 660l/18478b |
| `data` | 172 | 3061l/139041b |
| `far_trampoline` | 41 | 225l/4357b |
| `runtime_code` | 65 | 914l/31159b |
| `runtime_inner_label` | 2 | 28l/1163b |
| `shared_runtime` | 2 | 32l/1221b |

| Label | Category | Source |
| --- | --- | --- |
| `FAST_SNSMAT` | `bios_helper` | 1145l/69173b |
| `tile_pattern_bank0` | `data` | 227l/12655b |
| `tile_color_bank0` | `data` | 224l/11795b |
| `BANK_0_USED_END` | `bank_marker` | 141l/7678b |
| `vdpLoop` | `bios_helper` | 192l/6712b |
| `resource_table` | `data` | 367l/5679b |
| `FAR_BANK_6_ROM_START` | `bank_marker` | 112l/5554b |
| `BANK_2_USED_END` | `bank_marker` | 89l/5039b |
| `tilebank_pattern_data_1` | `data` | 58l/4842b |
| `tilebank_pattern_data_0` | `data` | 58l/4842b |
| `tilebank_color_data_1` | `data` | 58l/4840b |
| `tilebank_color_data_0` | `data` | 58l/4840b |
| `SCREEN_PAN1_0_INTERACTION_TARGET_MAP` | `runtime_code` | 58l/3694b |
| `SCREEN_NEW_DIALOG_SCREEN_1_INTERACTION_TARGET_MAP` | `data` | 55l/3694b |
| `load_sprite_patterns_worldmap_1776512078647` | `data` | 90l/3606b |
| `SCREEN_NEW_DIALOG_SCREEN_1_INTERACTION_VALUE_MAP` | `data` | 51l/3516b |
| `SCREEN_NEW_DIALOG_SCREEN_1_INTERACTION_TYPE_MAP` | `data` | 51l/3514b |
| `SCREEN_NEW_DIALOG_SCREEN_1_EFFECTS_LAYOUT` | `data` | 51l/3504b |
| `BEHAVIOR_NEW_DIALOG_SCREEN_1_DATA` | `data` | 52l/3497b |
| `SCREEN_PAN1_0_INTERACTION_VALUE_MAP` | `data` | 51l/3490b |
| `SCREEN_PAN1_0_INTERACTION_TYPE_MAP` | `data` | 51l/3488b |
| `SCREEN_PAN1_0_EFFECTS_LAYOUT` | `data` | 51l/3478b |
| `SCREEN_NEW_DIALOG_SCREEN_1_LAYOUT` | `data` | 50l/3444b |
| `FAR_BANK_9_ROM_START` | `bank_marker` | 79l/3183b |
| `FONT_PATTERN_DATA` | `data` | 90l/2903b |
| `init_char0_color` | `boot_or_init` | 95l/2487b |
| `restart_rom_continue` | `boot_or_init` | 83l/2480b |
| `FAST_LDIRVM` | `bios_helper` | 73l/2463b |
| `init_interrupt_system` | `boot_or_init` | 63l/2073b |
| `init_entities` | `boot_or_init` | 92l/2065b |

| ID | Kind | Owner | Status | Incoming | Source | Lines | Labels |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `runtime.mapper.core` | `routine` | `mapper` | `rooted` | 168 | 213l/5412b | 11999-12211 | mapper_runtime_init, mapper_set_bank_p1, mapper_set_bank_p2, mapper_set_bank_p3, mapper_set_bank_p4, ... (+14) |
| `runtime.resources.manager` | `routine` | `resources` | `rooted` | 52 | 680l/17743b | 12711-13390 | resource_manager_init, resource_invalidate_pattern_vram_cache, resource_invalidate_color_vram_cache, resource_invalidate_font_vram_cache, resource_invalidate_gameplay_vram_cache, ... (+14) |
| `runtime.components.input_trigger_level` | `routine` | `components` | `candidate_unreferenced` | 0 | 33l/773b | 13472-13504 | component_trigger_level_pressed_a |
| `runtime.page0.stubs` | `routine` | `unified` | `rooted` | 1 | 22l/505b | 13511-13532 | init_page0_runtime_state, page0_map_expanded_slot, page0_map_game_rom, page0_restore_bios_rom, page0_copy_chunk_to_buffer, ... (+2) |
| `runtime.interrupt.stop` | `routine` | `interrupt` | `rooted` | 0 | 43l/1299b | 13611-13653 | stop_interrupt_system |
| `runtime.interrupt.dispatcher` | `routine` | `interrupt` | `preserved` | 1 | 124l/4150b | 13655-13778 | interrupt_dispatcher |
| `runtime.interrupt.vblank_flag` | `routine` | `interrupt` | `rooted` | 1 | 35l/983b | 13791-13825 | update_vblank_flag |
| `runtime.interrupt.task_api` | `routine` | `interrupt` | `rooted` | 1 | 121l/3195b | 13830-13950 | enable_task, disable_task, get_frame_count |
| `runtime.interrupt.task_input` | `routine` | `interrupt` | `rooted` | 2 | 228l/5981b | 13954-14181 | init_default_tasks_from_plan, task_update_input |
| `runtime.far_trampoline.init_boss_system_far` | `trampoline` | `far-call` | `preserved` | 2 | 19l/519b | 14236-14254 | init_boss_system_far |
| `runtime.far_trampoline.init_screen_boss_from_current_screen_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/639b | 14256-14274 | init_screen_boss_from_current_screen_far |
| `runtime.far_trampoline.update_boss_system_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/531b | 14276-14294 | update_boss_system_far |
| `runtime.far_trampoline.draw_boss_attack_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/519b | 14296-14314 | draw_boss_attack_far |
| `runtime.far_trampoline.draw_boss_meteor_attack_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/561b | 14316-14334 | draw_boss_meteor_attack_far |
| `runtime.far_trampoline.draw_boss_bomb_attack_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/549b | 14336-14354 | draw_boss_bomb_attack_far |
| `runtime.far_trampoline.draw_boss_boomerang_attack_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/579b | 14356-14374 | draw_boss_boomerang_attack_far |
| `runtime.far_trampoline.draw_boss_rock_attack_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/549b | 14376-14394 | draw_boss_rock_attack_far |
| `runtime.far_trampoline.draw_boss_laser_attack_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/555b | 14396-14414 | draw_boss_laser_attack_far |
| `runtime.far_trampoline.draw_boss_sine_wave_attack_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/579b | 14416-14434 | draw_boss_sine_wave_attack_far |
| `runtime.far_trampoline.draw_boss_homing_missile_attack_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/609b | 14436-14454 | draw_boss_homing_missile_attack_far |
| `runtime.far_trampoline.load_screen_pan1_776511902784_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/597b | 14459-14477 | load_screen_pan1_776511902784_far |
| `runtime.far_trampoline.load_screen_new_dialog_screen_777377884059_far` | `trampoline` | `far-call` | `preserved` | 0 | 19l/675b | 14479-14497 | load_screen_new_dialog_screen_777377884059_far |
| `runtime.far_trampoline.show_presentation_screen_image_far` | `trampoline` | `far-call` | `preserved` | 0 | 19l/603b | 14499-14517 | show_presentation_screen_image_far |
| `runtime.far_trampoline.show_presentation_screen_far` | `trampoline` | `far-call` | `preserved` | 0 | 19l/567b | 14519-14537 | show_presentation_screen_far |
| `runtime.far_trampoline.set_screen_colors_far` | `trampoline` | `far-call` | `preserved` | 1 | 21l/562b | 14539-14559 | set_screen_colors_far |
| `runtime.far_trampoline.init_char0_color_far` | `trampoline` | `far-call` | `preserved` | 1 | 21l/556b | 14561-14581 | init_char0_color_far |
| `runtime.far_trampoline.init_entities_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/501b | 14586-14604 | init_entities_far |
| `runtime.far_trampoline.update_entities_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/513b | 14606-14624 | update_entities_far |
| `runtime.far_trampoline.init_sprites_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/495b | 14629-14647 | init_sprites_far |
| `runtime.far_trampoline.update_sprites_to_vram_far` | `trampoline` | `far-call` | `preserved` | 0 | 19l/555b | 14649-14667 | update_sprites_to_vram_far |
| `runtime.far_trampoline.clear_all_sprites_far` | `trampoline` | `far-call` | `preserved` | 0 | 19l/525b | 14669-14687 | clear_all_sprites_far |
| `runtime.far_trampoline.hide_sprite_far` | `trampoline` | `far-call` | `preserved` | 0 | 21l/526b | 14689-14709 | hide_sprite_far |
| `runtime.far_trampoline.load_sprite_patterns_by_pack_id_far` | `trampoline` | `far-call` | `preserved` | 1 | 21l/646b | 14711-14731 | load_sprite_patterns_by_pack_id_far |
| `runtime.far_trampoline.ensure_sprite_patterns_by_pack_id_far` | `trampoline` | `far-call` | `preserved` | 1 | 21l/658b | 14733-14753 | ensure_sprite_patterns_by_pack_id_far |
| `runtime.far_trampoline.ensure_sprite_patterns_for_world_id_far` | `trampoline` | `far-call` | `preserved` | 1 | 21l/670b | 14755-14775 | ensure_sprite_patterns_for_world_id_far |
| `runtime.far_trampoline.init_sound_system_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/525b | 14780-14798 | init_sound_system_far |
| `runtime.far_trampoline.task_audio_tick_far` | `trampoline` | `far-call` | `preserved` | 0 | 19l/513b | 14800-14818 | task_audio_tick_far |
| `runtime.far_trampoline.sfx_update_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/483b | 14820-14838 | sfx_update_far |
| `runtime.far_trampoline.music_update_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/495b | 14840-14858 | music_update_far |
| `runtime.far_trampoline.music_stop_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/483b | 14860-14878 | music_stop_far |
| `runtime.far_trampoline.music_play_track_far` | `trampoline` | `far-call` | `preserved` | 1 | 21l/556b | 14880-14900 | music_play_track_far |
| `runtime.far_trampoline.music_execute_command_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/549b | 14902-14920 | music_execute_command_far |
| `runtime.far_trampoline.render_hud_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/484b | 14925-14943 | render_hud_far |
| `runtime.far_trampoline.force_render_hud_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/520b | 14945-14963 | force_render_hud_far |
| `runtime.far_trampoline.imprimir_marco_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/508b | 14965-14983 | imprimir_marco_far |
| `runtime.far_trampoline.init_font_system_far` | `trampoline` | `far-call` | `preserved` | 2 | 19l/520b | 14988-15006 | init_font_system_far |
| `runtime.far_trampoline.reload_font_system_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/532b | 15008-15026 | reload_font_system_far |
| `runtime.far_trampoline.print_string_screen2_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/544b | 15028-15046 | print_string_screen2_far |
| `runtime.far_trampoline.init_animated_tiles_far` | `trampoline` | `far-call` | `preserved` | 2 | 19l/538b | 15051-15069 | init_animated_tiles_far |
| `runtime.far_trampoline.update_animated_tiles_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/550b | 15071-15089 | update_animated_tiles_far |
| `runtime.far_trampoline.update_animated_tiles_vram_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/580b | 15091-15109 | update_animated_tiles_vram_far |
| `runtime.far_trampoline.load_world_default_far` | `trampoline` | `far-call` | `preserved` | 0 | 19l/532b | 15117-15135 | load_world_default_far |
| `runtime.far_trampoline.check_world_screen_transition_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/598b | 15137-15155 | check_world_screen_transition_far |
| `runtime.far_trampoline.load_world_worldmap_1776512078647_far` | `trampoline` | `far-call` | `preserved` | 2 | 19l/622b | 15157-15175 | load_world_worldmap_1776512078647_far |
| `runtime.far_trampoline.load_pattern_bank0_far` | `trampoline` | `far-call` | `preserved` | 0 | 19l/532b | 15180-15198 | load_pattern_bank0_far |
| `runtime.far_trampoline.load_pattern_bank1_far` | `trampoline` | `far-call` | `preserved` | 0 | 19l/532b | 15200-15218 | load_pattern_bank1_far |
| `runtime.far_trampoline.load_pattern_bank2_far` | `trampoline` | `far-call` | `preserved` | 0 | 19l/532b | 15220-15238 | load_pattern_bank2_far |
| `runtime.far_trampoline.load_patterns_to_vram_far` | `trampoline` | `far-call` | `preserved` | 1 | 19l/550b | 15240-15258 | load_patterns_to_vram_far |
| `runtime.far_trampoline.load_tilebank_tilebank_1776511918552_patterns_to_vram_far` | `trampoline` | `far-call` | `preserved` | 2 | 19l/742b | 15260-15278 | load_tilebank_tilebank_1776511918552_patterns_to_vram_far |
| `runtime.far_trampoline.load_color_bank0_far` | `trampoline` | `far-call` | `preserved` | 0 | 19l/520b | 15283-15301 | load_color_bank0_far |
| `runtime.far_trampoline.load_color_bank1_far` | `trampoline` | `far-call` | `preserved` | 0 | 19l/520b | 15303-15321 | load_color_bank1_far |
| `runtime.far_trampoline.load_color_bank2_far` | `trampoline` | `far-call` | `preserved` | 0 | 19l/520b | 15323-15341 | load_color_bank2_far |
| `runtime.far_trampoline.load_colors_to_vram_far` | `trampoline` | `far-call` | `preserved` | 2 | 19l/538b | 15343-15361 | load_colors_to_vram_far |
| `runtime.far_trampoline.load_tilebank_tilebank_1776511918552_colors_to_vram_far` | `trampoline` | `far-call` | `preserved` | 2 | 19l/730b | 15363-15381 | load_tilebank_tilebank_1776511918552_colors_to_vram_far |
| `runtime.sound.resident.init` | `routine` | `sound` | `referenced` | 1 | 4l/184b | 15406-15409 | call_init_sound_system_resident |
| `runtime.sound.resident.tick` | `routine` | `sound` | `referenced` | 3 | 18l/606b | 15411-15428 | call_task_audio_tick_resident |
| `runtime.sound.resident.music_update` | `routine` | `sound` | `referenced` | 2 | 4l/190b | 15430-15433 | call_music_update_resident |
| `runtime.sound.resident.sfx_update` | `routine` | `sound` | `referenced` | 1 | 4l/182b | 15435-15438 | call_sfx_update_resident |
| `runtime.sound.resident.music_stop` | `routine` | `sound` | `referenced` | 1 | 4l/182b | 15440-15443 | call_music_stop_resident |
| `runtime.sound.resident.music_play_track` | `routine` | `sound` | `referenced` | 1 | 4l/206b | 15445-15448 | call_music_play_track_resident |
| `runtime.sound.resident.music_execute_command` | `routine` | `sound` | `candidate_unreferenced` | 0 | 4l/226b | 15450-15453 | call_music_execute_command_resident |
| `runtime.components.init` | `routine` | `components` | `rooted` | 11 | 86l/2981b | 15858-15943 | component_fill_32_a, init_components |
| `runtime.components.position` | `routine` | `components` | `rooted` | 3 | 108l/3281b | 15945-16052 | init_position_system, update_position_component, position_update_loop, position_next_entity |
| `runtime.components.sprite` | `routine` | `components` | `rooted` | 6 | 396l/10316b | 16053-16448 | init_sprite_system, update_sprite_component, sprite_update_loop, sprite_layer_loop, sprite_continue, ... (+6) |
| `runtime.components.movement_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 16454-16457 | update_movement_component |
| `runtime.components.collision` | `routine` | `components` | `referenced` | 2 | 668l/18861b | 16458-17125 | init_collision_system, update_collision_component, collision_update_loop, collision_next_entity, update_entity_collision_fast, ... (+13) |
| `runtime.components.behavior_tile` | `routine` | `components` | `rooted` | 9 | 110l/3809b | 17126-17235 | get_behavior_tile, get_behavior_tile_nb, gbt_oob |
| `runtime.components.directional_sprite_sync` | `routine` | `components` | `rooted` | 3 | 87l/2084b | 17236-17322 | component_sync_directional_sprite_from_initial, component_sync_directional_sprite_from_current, component_sync_directional_sprite_common |
| `runtime.components.input` | `routine` | `components` | `referenced` | 2 | 388l/12766b | 17323-17710 | init_input_system, update_input_component, input_update_loop, input_move_up, input_move_down, ... (+16) |
| `runtime.components.health` | `routine` | `components` | `rooted` | 3 | 152l/4701b | 17748-17899 | init_health_system, update_health_component, decrease_entity_lives, increase_entity_lives |
| `runtime.components.animation` | `routine` | `components` | `referenced` | 4 | 342l/10555b | 17900-18241 | init_animation_system, update_animation_component, anim_done_entity, refresh_player_animation_fastpath |
| `runtime.components.jump` | `routine` | `components` | `referenced` | 2 | 233l/7043b | 18242-18474 | init_jump_system, update_jump_component, jump_update_loop, jump_done_entity, jump_next_entity |
| `runtime.components.gravity` | `routine` | `components` | `rooted` | 2 | 137l/4553b | 18475-18611 | init_gravity_system, update_gravity_component, gravity_update_loop, gravity_store_vel, gravity_grounded, ... (+2) |
| `runtime.components.walljump_stub` | `routine` | `components` | `referenced` | 2 | 18l/326b | 18632-18649 | init_walljump_system, update_walljump_component, walljump_process_entity_c, walljump_input_is_left, walljump_input_is_right |
| `runtime.components.auto_destroy_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/219b | 18652-18658 | init_auto_destroy_system, update_auto_destroy_component |
| `runtime.components.state_machine_component_stub` | `routine` | `components` | `referenced` | 1 | 7l/241b | 18682-18688 | init_statemachine_system, update_statemachine_component |
| `runtime.components.retractable_gate_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/196b | 18694-18697 | update_retractable_gate_component |
| `runtime.components.carry` | `routine` | `components` | `rooted` | 1 | 81l/2148b | 18698-18778 | init_carry_system, update_carry_component |
| `runtime.components.auto_control_script_stubs` | `routine` | `components` | `referenced` | 2 | 7l/252b | 18784-18790 | update_auto_control_script_component, update_auto_event_string_component |
| `runtime.components.damage_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/166b | 18796-18799 | update_damage_component |
| `runtime.components.shoot_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/163b | 18805-18808 | update_shoot_component |
| `runtime.components.platform_riding_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 7l/220b | 18828-18834 | prepare_platform_detection, update_platform_riding |
| `runtime.components.wallcollision` | `routine` | `components` | `referenced` | 3 | 839l/31288b | 18835-19673 | init_wallcollision_system, wall_behavior_is_full_blocker, wall_down_behavior_blocks, update_wallcollision_component, wall_build_hitbox_cache, ... (+2) |
| `runtime.components.deadly_tiles` | `routine` | `components` | `rooted` | 3 | 262l/5874b | 19674-19935 | init_deadly_tiles_system, deadly_tiles_runtime_tile_is_deadly_nb, update_entity_deadly_flag_runtime, update_deadly_tiles_component, refresh_player_deadly_fastpath |
| `runtime.components.in_water_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/172b | 19941-19944 | update_in_water_component |
| `runtime.components.collectible_stub` | `routine` | `components` | `candidate_unreferenced` | 0 | 4l/181b | 19950-19953 | update_collectible_component |
| `runtime.components.tile_interaction` | `routine` | `components` | `rooted` | 4 | 641l/15812b | 19954-20594 | interaction_target_variable_ptr_table, interaction_target_variable_word_table, init_tile_interaction_system, update_slash_component, record_bonus_respawn_slot, ... (+11) |
| `runtime.components.collected_tiles` | `routine` | `components` | `rooted` | 1 | 76l/3015b | 20595-20670 | apply_collected_tiles |
| `runtime.components.entity_management` | `routine` | `components` | `rooted` | 3 | 221l/6549b | 20671-20891 | create_entity, entity_job_set, entity_job_set_period_ok, entity_job_set_entry_wrap, entity_job_set_entry_ok, ... (+13) |
| `runtime.components.scheduler` | `routine` | `components` | `rooted` | 7 | 1582l/36089b | 20892-22473 | update_all_entities, mark_used_entity_list_dirty, ensure_used_entity_list_current, rebuild_used_entity_list, ensure_player_fast_runtime_bound, ... (+10) |
| ... | ... | ... | ... | ... | ... | ... | +39 more blocks |

## Dead-Block Candidates

- `runtime.components.legacy_tile_collision`: 43 lines / 1404 bytes. No external references found for any global label in this block.
- `runtime.sprites.show_sprite_legacy`: 43 lines / 981 bytes. No external references found for any global label in this block.
- `runtime.components.input_trigger_level`: 33 lines / 773 bytes. No external references found for any global label in this block.
- `runtime.gameflow.connection_by_type`: 37 lines / 701 bytes. No external references found for any global label in this block.
- `runtime.worlds.current_screen_helpers`: 23 lines / 633 bytes. No external references found for any global label in this block.
- `runtime.gameflow.confirm_input_direct`: 12 lines / 298 bytes. No external references found for any global label in this block.
- `runtime.screens.load_screen_stub`: 6 lines / 232 bytes. No external references found for any global label in this block.
- `runtime.sound.resident.music_execute_command`: 4 lines / 226 bytes. No external references found for any global label in this block.
- `runtime.components.platform_riding_stub`: 7 lines / 220 bytes. No external references found for any global label in this block.
- `runtime.components.auto_destroy_stub`: 7 lines / 219 bytes. No external references found for any global label in this block.
- `runtime.components.retractable_gate_stub`: 4 lines / 196 bytes. No external references found for any global label in this block.
- `runtime.components.secret_zone_stub`: 4 lines / 181 bytes. No external references found for any global label in this block.
- `runtime.components.collectible_stub`: 4 lines / 181 bytes. No external references found for any global label in this block.
- `runtime.components.movement_stub`: 4 lines / 172 bytes. No external references found for any global label in this block.
- `runtime.components.in_water_stub`: 4 lines / 172 bytes. No external references found for any global label in this block.
- `runtime.components.damage_stub`: 4 lines / 166 bytes. No external references found for any global label in this block.
- `runtime.sound.music_reset_noop`: 4 lines / 163 bytes. No external references found for any global label in this block.
- `runtime.components.shoot_stub`: 4 lines / 163 bytes. No external references found for any global label in this block.

## ROM Validation

- Original ROM bytes: 139264
- Optimized ROM bytes: 139264
- ROM byte delta: 0
- ROM SHA256 equal: False

## dead-blocks

- Metrics: findings=18, patchable=18, removed_lines=247, removed_source_bytes=7081
- Routines: runtime.components.auto_destroy_stub, runtime.components.collectible_stub, runtime.components.damage_stub, runtime.components.in_water_stub, runtime.components.input_trigger_level, runtime.components.legacy_tile_collision, runtime.components.movement_stub, runtime.components.platform_riding_stub, runtime.components.retractable_gate_stub, runtime.components.secret_zone_stub, runtime.components.shoot_stub, runtime.gameflow.confirm_input_direct, runtime.gameflow.connection_by_type, runtime.screens.load_screen_stub, runtime.sound.music_reset_noop, runtime.sound.resident.music_execute_command, runtime.sprites.show_sprite_legacy, runtime.worlds.current_screen_helpers

- [patchable] `runtime.components.input_trigger_level` lines 13472-13504: Block `runtime.components.input_trigger_level` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: component_trigger_level_pressed_a.
- [patchable] `runtime.sound.resident.music_execute_command` lines 15450-15453: Block `runtime.sound.resident.music_execute_command` (routine/sound) is a dead-code candidate. No external references found for any global label in this block. Labels: call_music_execute_command_resident.
- [patchable] `runtime.components.movement_stub` lines 16454-16457: Block `runtime.components.movement_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_movement_component.
- [patchable] `runtime.components.auto_destroy_stub` lines 18652-18658: Block `runtime.components.auto_destroy_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: init_auto_destroy_system, update_auto_destroy_component.
- [patchable] `runtime.components.retractable_gate_stub` lines 18694-18697: Block `runtime.components.retractable_gate_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_retractable_gate_component.
- [patchable] `runtime.components.damage_stub` lines 18796-18799: Block `runtime.components.damage_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_damage_component.
- [patchable] `runtime.components.shoot_stub` lines 18805-18808: Block `runtime.components.shoot_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_shoot_component.
- [patchable] `runtime.components.platform_riding_stub` lines 18828-18834: Block `runtime.components.platform_riding_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: prepare_platform_detection, update_platform_riding.
- [patchable] `runtime.components.in_water_stub` lines 19941-19944: Block `runtime.components.in_water_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_in_water_component.
- [patchable] `runtime.components.collectible_stub` lines 19950-19953: Block `runtime.components.collectible_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_collectible_component.
- [patchable] `runtime.components.legacy_tile_collision` lines 22562-22604: Block `runtime.components.legacy_tile_collision` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: get_tile_at_position, get_tile_behavior, tile_behavior_table, check_collision_at_point, check_collision_box, ... (+1).
- [patchable] `runtime.components.secret_zone_stub` lines 22641-22644: Block `runtime.components.secret_zone_stub` (routine/components) is a dead-code candidate. No external references found for any global label in this block. Labels: update_secret_zone_component.
- [patchable] `runtime.gameflow.connection_by_type` lines 25759-25795: Block `runtime.gameflow.connection_by_type` (routine/gameflow) is a dead-code candidate. No external references found for any global label in this block. Labels: gameflow_get_connection_by_type.
- [patchable] `runtime.gameflow.confirm_input_direct` lines 25820-25831: Block `runtime.gameflow.confirm_input_direct` (routine/gameflow) is a dead-code candidate. No external references found for any global label in this block. Labels: gameflow_read_confirm_direct.
- [patchable] `runtime.screens.load_screen_stub` lines 30242-30247: Block `runtime.screens.load_screen_stub` (routine/screens) is a dead-code candidate. No external references found for any global label in this block. Labels: load_screen.
- [patchable] `runtime.sprites.show_sprite_legacy` lines 31864-31906: Block `runtime.sprites.show_sprite_legacy` (routine/sprites) is a dead-code candidate. No external references found for any global label in this block. Labels: show_sprite.
- [patchable] `runtime.sound.music_reset_noop` lines 32551-32554: Block `runtime.sound.music_reset_noop` (routine/sound) is a dead-code candidate. No external references found for any global label in this block. Labels: music_reset_channel_state.
- [patchable] `runtime.worlds.current_screen_helpers` lines 34689-34711: Block `runtime.worlds.current_screen_helpers` (routine/worlds) is a dead-code candidate. No external references found for any global label in this block. Labels: get_current_world_id, get_current_screen_index, set_current_screen.

## inactive-feature-runtime

- Metrics: findings=41, patchable=3, removed_lines=30, removed_source_bytes=872
- Routines: call_init_sound_system_resident, call_music_execute_command_resident, call_music_play_track_resident, call_music_stop_resident, call_music_update_resident, call_sfx_update_resident, call_task_audio_tick_resident, init_sound_system, init_sound_system_far, music_execute_command, music_execute_command_far, music_init_system, music_play_track, music_play_track_far, music_reset_channel_state, music_silence_channels, music_stop, music_stop_far, music_update_far, runtime.sound.group.init, runtime.sound.group.music_execute_command, runtime.sound.group.music_execute_command:call_music_execute_command_resident, runtime.sound.group.music_execute_command:music_execute_command, runtime.sound.group.music_execute_command:music_execute_command_far, runtime.sound.group.music_play_track, runtime.sound.group.music_stop, runtime.sound.group.music_update, runtime.sound.group.sfx_update, runtime.sound.group.tick, sfx_beep, sfx_coin, sfx_damage, sfx_explosion, sfx_jump, sfx_play, sfx_shoot, sfx_silence_all, sfx_update, sfx_update_far, task_audio_tick, task_audio_tick_far

- [report-only] `runtime.sound.group.init` lines 14781-32086: `runtime.sound.group.init` groups inactive audio init runtime labels: call_init_sound_system_resident, init_sound_system, init_sound_system_far. Group deletion remains blocked by 1 external references: init_rom->call_init_sound_system_resident@10137.
- [report-only] `init_sound_system_far` lines 14781-14800: `init_sound_system_far` looks like audio runtime (20 lines, 524 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: boot_or_init (Boot/init routine). External references still exist (1): call_init_sound_system_resident@15408. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `runtime.sound.group.tick` lines 14801-32115: `runtime.sound.group.tick` groups inactive audio tick runtime labels: call_task_audio_tick_resident, task_audio_tick, task_audio_tick_far. Group deletion remains blocked by 3 external references: init_rom->call_task_audio_tick_resident@10158, gameflow_handle_end->call_task_audio_tick_resident@25604, gameflow_world_game_loop->call_task_audio_tick_resident@25848.
- [report-only] `task_audio_tick_far` lines 14801-14820: `task_audio_tick_far` looks like audio runtime (20 lines, 509 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Patch remains disabled because `task_audio_tick_far` is inside annotated block `runtime.far_trampoline.task_audio_tick_far`; group-level deletion must be handled by dead-blocks. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `runtime.sound.group.sfx_update` lines 14821-32530: `runtime.sound.group.sfx_update` groups inactive SFX update runtime labels: call_sfx_update_resident, sfx_update, sfx_update_far. Group deletion remains blocked by 1 external references: gameflow_world_game_loop->call_sfx_update_resident@25883.
- [report-only] `sfx_update_far` lines 14821-14840: `sfx_update_far` looks like audio runtime (20 lines, 486 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_sfx_update_resident@15437. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `runtime.sound.group.music_update` lines 14841-32577: `runtime.sound.group.music_update` groups inactive music update runtime labels: call_music_update_resident, music_update, music_update_far. Group deletion remains blocked by 2 external references: call_task_audio_tick_resident->call_music_update_resident@15421, task_audio_tick->call_music_update_resident@32093.
- [report-only] `music_update_far` lines 14841-14860: `music_update_far` looks like audio runtime (20 lines, 494 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_music_update_resident@15432. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `runtime.sound.group.music_stop` lines 14861-32574: `runtime.sound.group.music_stop` groups inactive music stop runtime labels: call_music_stop_resident, music_stop, music_stop_far. Group deletion remains blocked by 2 external references: music_execute_command->music_stop@32587, update_scroll->call_music_stop_resident@34519.
- [report-only] `music_stop_far` lines 14861-14880: `music_stop_far` looks like audio runtime (20 lines, 490 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_music_stop_resident@15442. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `runtime.sound.group.music_play_track` lines 14881-32581: `runtime.sound.group.music_play_track` groups inactive music play-track runtime labels: call_music_play_track_resident, music_play_track, music_play_track_far. Group deletion remains blocked by 1 external references: update_scroll->call_music_play_track_resident@34537.
- [report-only] `music_play_track_far` lines 14881-14902: `music_play_track_far` looks like audio runtime (22 lines, 562 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_music_play_track_resident@15447. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.music_execute_command:music_execute_command_far` lines 14902-14920: `music_execute_command_far` is part of inactive runtime group `runtime.sound.group.music_execute_command`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `runtime.sound.group.music_execute_command` lines 14903-32589: `runtime.sound.group.music_execute_command` groups inactive music command runtime labels: call_music_execute_command_resident, music_execute_command, music_execute_command_far. No external references outside the group were found. This is ready for a future atomic multi-window patch, or for dead-blocks to remove the annotated windows as whole groups. Atomic patch enabled as `runtime.sound.group.music_execute_command` with 3 window(s).
- [report-only] `music_execute_command_far` lines 14903-14925: `music_execute_command_far` looks like audio runtime (23 lines, 612 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): call_music_execute_command_resident@15452. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_init_sound_system_resident` lines 15407-15411: `call_init_sound_system_resident` looks like audio runtime (5 lines, 185 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): init_rom@10137. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_task_audio_tick_resident` lines 15412-15430: `call_task_audio_tick_resident` looks like audio runtime (19 lines, 615 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (3): init_rom@10158, gameflow_handle_end@25604, gameflow_world_game_loop@25848. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_music_update_resident` lines 15431-15435: `call_music_update_resident` looks like audio runtime (5 lines, 189 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (2): call_task_audio_tick_resident@15421, task_audio_tick@32093. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_sfx_update_resident` lines 15436-15440: `call_sfx_update_resident` looks like audio runtime (5 lines, 183 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): gameflow_world_game_loop@25883. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_music_stop_resident` lines 15441-15445: `call_music_stop_resident` looks like audio runtime (5 lines, 189 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): update_scroll@34519. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `call_music_play_track_resident` lines 15446-15450: `call_music_play_track_resident` looks like audio runtime (5 lines, 212 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). External references still exist (1): update_scroll@34537. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.music_execute_command:call_music_execute_command_resident` lines 15450-15453: `call_music_execute_command_resident` is part of inactive runtime group `runtime.sound.group.music_execute_command`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `call_music_execute_command_resident` lines 15451-15454: `call_music_execute_command_resident` looks like audio runtime (4 lines, 138 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: far_trampoline (MegaROM far-call or resident-call trampoline). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Patch remains disabled because `call_music_execute_command_resident` is inside annotated block `runtime.sound.resident.music_execute_command`; group-level deletion must be handled by dead-blocks. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `init_sound_system` lines 32059-32086: `init_sound_system` looks like audio runtime (28 lines, 1006 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: boot_or_init (Boot/init routine). External references still exist (1): init_sound_system_far@14788. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `task_audio_tick` lines 32087-32115: `task_audio_tick` looks like audio runtime (29 lines, 836 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: shared_runtime (Shared low-level runtime helper). External references still exist (1): task_audio_tick_far@14808. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_silence_all` lines 32234-32259: `sfx_silence_all` looks like audio runtime (26 lines, 757 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (2): init_sound_system@32076, sfx_update@32517. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_beep` lines 32260-32280: `sfx_beep` looks like audio runtime (21 lines, 492 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_beep@32422. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_jump` lines 32281-32302: `sfx_jump` looks like audio runtime (22 lines, 473 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_jump@32428. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_shoot` lines 32303-32327: `sfx_shoot` looks like audio runtime (25 lines, 565 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_shoot@32434. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_explosion` lines 32328-32347: `sfx_explosion` looks like audio runtime (20 lines, 497 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_explosion@32440. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_coin` lines 32348-32369: `sfx_coin` looks like audio runtime (22 lines, 536 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_coin@32446. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_damage` lines 32370-32403: `sfx_damage` looks like audio runtime (34 lines, 1140 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): play_sound_effect_damage@32452. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_play` lines 32463-32491: `sfx_play` looks like audio runtime (29 lines, 600 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (6): play_sound_effect_beep@32424, play_sound_effect_jump@32430, play_sound_effect_shoot@32436, play_sound_effect_explosion@32442, play_sound_effect_coin@32448, ... (+1 more). Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `sfx_update` lines 32492-32530: `sfx_update` looks like audio runtime (39 lines, 1016 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): sfx_update_far@14828. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `music_init_system` lines 32531-32551: `music_init_system` looks like audio runtime (21 lines, 566 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (2): init_sound_system@32073, music_stop@32571. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `music_reset_channel_state` lines 32552-32555: `music_reset_channel_state` looks like audio runtime (4 lines, 89 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). No external label references were found, making this a candidate for a future feature-specific patch rule once block ownership and invariants are added. Patch remains disabled because `music_reset_channel_state` is inside annotated block `runtime.sound.music_reset_noop`; group-level deletion must be handled by dead-blocks. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `music_silence_channels` lines 32556-32569: `music_silence_channels` looks like audio runtime (14 lines, 212 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): music_stop@32572. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `music_stop` lines 32570-32574: `music_stop` looks like audio runtime (5 lines, 80 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (2): music_stop_far@14868, music_execute_command@32587. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [report-only] `music_play_track` lines 32579-32581: `music_play_track` looks like audio runtime (3 lines, 27 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): music_play_track_far@14889. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.
- [patchable] `runtime.sound.group.music_execute_command:music_execute_command` lines 32582-32588: `music_execute_command` is part of inactive runtime group `runtime.sound.group.music_execute_command`. The group has no external references, so this window is removed only together with the other group windows.
- [report-only] `music_execute_command` lines 32582-32589: `music_execute_command` looks like audio runtime (8 lines, 98 source bytes), but project_usage marks feature `sounds` disabled (sounds=0, tracks=0). Category: runtime_code (Instruction-bearing runtime label). External references still exist (1): music_execute_command_far@14910. Deletion must stay blocked until callers are proven dead or rewired. Patch remains disabled because external references still exist. This is report-only until the generator metadata and invariants prove deletion is safe.

## Optimization Passes

- Pass 1: findings=59, patchable=20, removed=273 lines / 7727 bytes, lines=34934->34661
- Pass 2: findings=33, patchable=0, removed=0 lines / 0 bytes, lines=34661->34661

