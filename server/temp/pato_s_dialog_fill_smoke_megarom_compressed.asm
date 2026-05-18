; ==================================================================
; PATO_S - MEGAROM UNIFIED FILE
; File: unitedFiles.asm
; ROM Mode: megarom (multi-bank, 8KB banks, ASCII8K/Konami pattern)
; Mapper: konami
;
; Bank 0 [#4000-#5FFFh] : Bootstrap (header, bios, mapper, interrupt, init)
; Banks 1-2 [#6000-#9FFFh] : Resident engine code
; Bank 3 [#A000-#BFFFh] : Default resident window, restored after data loads
; Bank 4+ (code) [far]  : Overlay code, constrained to P1 trampolines
; Bank 4+ (data) [#C000h+] : DATA TABLES (patterns, colors, screens, font - mapper data-window switch)
; Generated artifacts: resource_ids.asm, resource_table.asm, resource_manager.asm, packing_manifest.txt, packing_manifest.json, banks.json, project_usage.json, unused_report.txt, segment_budget.json
;
; Tiles: 12
; Sprites: 10
; Screens: 5
; Entities: 4
; Menus: No
; HUD: Yes
; State Machines: 1
; Engine Execution Mode: interruptTaskManager
; IRQ Task: slot 1 -> task_frame_counter (timer, every 1 frame)
; Mainline: postHalt -> task_audio_tick (audio)
; Mainline: postHalt -> update_sprites_to_vram (sprites)
; Mainline: preUpdate -> check_world_screen_transition (screenFlow)
; Mainline: postUpdate -> update_all_entities (entities)
; Mainline: postUpdate -> execute_all_state_machines (stateMachines)
; Mainline: postUpdate -> update_animated_tiles (animation)
; Mainline: postUpdate -> sfx_update (sfx)
; Mainline: render -> render_hud (hud)
; Warning: none
; ------------------------------------------------------------------
; DYNAMIC BANK PACKER (FFD) — Estimated layout for code banks
; ------------------------------------------------------------------
; Bank 1 [#6000-#8000]: components (52556/8192 bytes est.)
; Bank 2 [#8000-#A000]: statemachine (15042/8192 bytes est.)
; Bank 3 [#A000-#C000]: gameflow (5666/8192 bytes est.)
; Bank 4 [#6000-#8000]: screens_code (14687/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 5 [#6000-#8000]: entities (9445/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 6 [#6000-#8000]: sprites (8343/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 7 [#6000-#8000]: bosses (5666/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 8 [#6000-#8000]: worlds (4765/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 9 [#6000-#8000]: sound (4418/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 10 [#6000-#8000]: animtiles (4223/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 11 [#6000-#8000]: hud (3640/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 12 [#6000-#8000]: font (3576/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 13 [#6000-#8000]: scroll (2353/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 14 [#6000-#8000]: patterns_code (894/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 15 [#6000-#8000]: colors_code (846/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 4+ (data) [#C000+]: DATA mapped through the configured data window
; ------------------------------------------------------------------
; Far code banks: bank4(screens_code) bank5(entities) bank6(sprites) bank7(bosses) bank8(worlds) bank9(sound) bank10(animtiles) bank11(hud) bank12(font) bank13(scroll) bank14(patterns_code) bank15(colors_code)
; ------------------------------------------------------------------
; 8KB BANK PACKER ESTIMATE (diagnostic placement view)
; Runtime bank constants are derived from label addresses at assemble time.
; Estimated payload bytes: 136455
; Estimated banks used: 17
; ------------------------------------------------------------------
; BANK 00 @#0000 : page0.asm (96 bytes)
; BANK 00 @#0060 : patterns.asm (894 bytes)
; BANK 00 @#03DE : colors.asm (846 bytes)
; BANK 00 @#072C : components.asm part 1/7 (6356 bytes)
; BANK 01 @#0000 : components.asm part 2/7 (8192 bytes)
; BANK 02 @#0000 : components.asm part 3/7 (8192 bytes)
; BANK 03 @#0000 : components.asm part 4/7 (8192 bytes)
; BANK 04 @#0000 : components.asm part 5/7 (8192 bytes)
; BANK 05 @#0000 : components.asm part 6/7 (8192 bytes)
; BANK 06 @#0000 : components.asm part 7/7 (5273 bytes)
; BANK 06 @#1499 : entities.asm part 1/2 (2919 bytes)
; BANK 07 @#0000 : entities.asm part 2/2 (6526 bytes)
; BANK 07 @#197E : worlds.asm (1666 bytes)
; BANK 08 @#0000 : worlds.asm (3099 bytes)
; BANK 08 @#0C1B : screens.asm part 1/2 (5093 bytes)
; BANK 09 @#0000 : screens.asm part 2/2 (8192 bytes)
; BANK 10 @#0000 : screens.asm part 3/2 (1402 bytes)
; BANK 10 @#057A : sprites.asm part 1/2 (6790 bytes)
; BANK 11 @#0000 : sprites.asm part 2/2 (1553 bytes)
; BANK 11 @#0611 : font.asm (3576 bytes)
; BANK 11 @#1409 : hud.asm (3063 bytes)
; BANK 12 @#0000 : hud.asm (577 bytes)
; BANK 12 @#0241 : menus.asm (168 bytes)
; BANK 12 @#02E9 : sound.asm (4418 bytes)
; BANK 12 @#142B : scroll.asm (2353 bytes)
; BANK 12 @#1D5C : animtiles.asm (676 bytes)
; BANK 13 @#0000 : animtiles.asm (3547 bytes)
; BANK 13 @#0DDB : bosses.asm (4645 bytes)
; BANK 14 @#0000 : bosses.asm (1021 bytes)
; BANK 14 @#03FD : statemachine.asm part 1/2 (7171 bytes)
; BANK 15 @#0000 : statemachine.asm part 2/2 (7909 bytes)
; BANK 15 @#1EE5 : gameflow.asm (283 bytes)
; BANK 16 @#0000 : gameflow.asm (5383 bytes); ==================================================================

; [[[MIDEAS_ARTIFACT:resource_ids.asm:BEGIN]]]
; ; ==================================================================
; ; GENERATED RESOURCE IDS
; ; Generated by MegaROM export backend.
; ; ==================================================================
; RESOURCE_ID_INVALID EQU #FF
;
; RESOURCE_ID_ANEC_RIGHT_0_F0_LAYER1       EQU 0
; RESOURCE_ID_ANEC_RIGHT_0_F0_LAYER2       EQU 1
; RESOURCE_ID_ANEC_RIGHT_0_F1_LAYER1       EQU 2
; RESOURCE_ID_ANEC_RIGHT_0_F1_LAYER2       EQU 3
; RESOURCE_ID_BOLA_1_F0_LAYER1             EQU 4
; RESOURCE_ID_BOLA_1_F1_LAYER1             EQU 5
; RESOURCE_ID_PANELL_2_F0_LAYER1           EQU 6
; RESOURCE_ID_PANELL_2_F0_LAYER2           EQU 7
; RESOURCE_ID_NINA_WALK_RIGHT_3_F0_LAYER0  EQU 8
; RESOURCE_ID_NINA_WALK_RIGHT_3_F0_LAYER1  EQU 9
; RESOURCE_ID_NINA_WALK_RIGHT_3_F1_LAYER0  EQU 10
; RESOURCE_ID_NINA_WALK_RIGHT_3_F1_LAYER1  EQU 11
; RESOURCE_ID_NINA_JUMP_RIGHT_4_F0_LAYER0  EQU 12
; RESOURCE_ID_NINA_JUMP_RIGHT_4_F0_LAYER1  EQU 13
; RESOURCE_ID_NINA_LAND_RIGHT_5_F0_LAYER0  EQU 14
; RESOURCE_ID_NINA_LAND_RIGHT_5_F0_LAYER1  EQU 15
; RESOURCE_ID_NINA_LAND_RIGHT_5_F1_LAYER0  EQU 16
; RESOURCE_ID_NINA_LAND_RIGHT_5_F1_LAYER1  EQU 17
; RESOURCE_ID_NINA_LAND_RIGHT_5_F2_LAYER0  EQU 18
; RESOURCE_ID_NINA_LAND_RIGHT_5_F2_LAYER1  EQU 19
; RESOURCE_ID_NINA_DEAD_RIGHT_6_F0_LAYER0  EQU 20
; RESOURCE_ID_NINA_DEAD_RIGHT_6_F0_LAYER2  EQU 21
; RESOURCE_ID_NINA_DEAD_RIGHT_6_F1_LAYER0  EQU 22
; RESOURCE_ID_NINA_DEAD_RIGHT_6_F1_LAYER2  EQU 23
; RESOURCE_ID_NINA_IDLE_RIGHT_7_F0_LAYER0  EQU 24
; RESOURCE_ID_NINA_IDLE_RIGHT_7_F0_LAYER1  EQU 25
; RESOURCE_ID_NINA_IDLE_RIGHT_7_F1_LAYER0  EQU 26
; RESOURCE_ID_NINA_IDLE_RIGHT_7_F1_LAYER1  EQU 27
; RESOURCE_ID_NINA_FALL_RIGHT_8_F0_LAYER0  EQU 28
; RESOURCE_ID_NINA_FALL_RIGHT_8_F0_LAYER1  EQU 29
; RESOURCE_ID_CAPCUADRAT1_RIGHT_9_F0_LAYER2 EQU 30
; RESOURCE_ID_CAPCUADRAT1_RIGHT_9_F0_LAYER3 EQU 31
; RESOURCE_ID_CAPCUADRAT1_RIGHT_9_F1_LAYER2 EQU 32
; RESOURCE_ID_CAPCUADRAT1_RIGHT_9_F1_LAYER3 EQU 33
; RESOURCE_ID_ANEC_LEFT_10_F0_LAYER1       EQU 34
; RESOURCE_ID_ANEC_LEFT_10_F0_LAYER2       EQU 35
; RESOURCE_ID_ANEC_LEFT_10_F1_LAYER1       EQU 36
; RESOURCE_ID_ANEC_LEFT_10_F1_LAYER2       EQU 37
; RESOURCE_ID_NINA_WALK_LEFT_11_F0_LAYER0  EQU 38
; RESOURCE_ID_NINA_WALK_LEFT_11_F0_LAYER1  EQU 39
; RESOURCE_ID_NINA_WALK_LEFT_11_F1_LAYER0  EQU 40
; RESOURCE_ID_NINA_WALK_LEFT_11_F1_LAYER1  EQU 41
; RESOURCE_ID_NINA_JUMP_LEFT_12_F0_LAYER0  EQU 42
; RESOURCE_ID_NINA_JUMP_LEFT_12_F0_LAYER1  EQU 43
; RESOURCE_ID_NINA_LAND_LEFT_13_F0_LAYER0  EQU 44
; RESOURCE_ID_NINA_LAND_LEFT_13_F0_LAYER1  EQU 45
; RESOURCE_ID_NINA_LAND_LEFT_13_F1_LAYER0  EQU 46
; RESOURCE_ID_NINA_LAND_LEFT_13_F1_LAYER1  EQU 47
; RESOURCE_ID_NINA_LAND_LEFT_13_F2_LAYER0  EQU 48
; RESOURCE_ID_NINA_LAND_LEFT_13_F2_LAYER1  EQU 49
; RESOURCE_ID_NINA_DEAD_LEFT_14_F0_LAYER0  EQU 50
; RESOURCE_ID_NINA_DEAD_LEFT_14_F0_LAYER2  EQU 51
; RESOURCE_ID_NINA_DEAD_LEFT_14_F1_LAYER0  EQU 52
; RESOURCE_ID_NINA_DEAD_LEFT_14_F1_LAYER2  EQU 53
; RESOURCE_ID_NINA_IDLE_LEFT_15_F0_LAYER0  EQU 54
; RESOURCE_ID_NINA_IDLE_LEFT_15_F0_LAYER1  EQU 55
; RESOURCE_ID_NINA_IDLE_LEFT_15_F1_LAYER0  EQU 56
; RESOURCE_ID_NINA_IDLE_LEFT_15_F1_LAYER1  EQU 57
; RESOURCE_ID_NINA_FALL_LEFT_16_F0_LAYER0  EQU 58
; RESOURCE_ID_NINA_FALL_LEFT_16_F0_LAYER1  EQU 59
; RESOURCE_ID_CAPCUADRAT1_LEFT_17_F0_LAYER2 EQU 60
; RESOURCE_ID_CAPCUADRAT1_LEFT_17_F0_LAYER3 EQU 61
; RESOURCE_ID_CAPCUADRAT1_LEFT_17_F1_LAYER2 EQU 62
; RESOURCE_ID_CAPCUADRAT1_LEFT_17_F1_LAYER3 EQU 63
; RESOURCE_ID_SPRITE_PLACEHOLDER_PATTERN   EQU 64
; RESOURCE_ID_TILE_PATTERN_BANK0           EQU 65
; RESOURCE_ID_TILEBANK_PATTERN_DATA_0      EQU 66
; RESOURCE_ID_TILE_COLOR_BANK0             EQU 67
; RESOURCE_ID_TILEBANK_COLOR_DATA_0        EQU 68
; RESOURCE_ID_SCREEN_PAN1_0_LAYOUT         EQU 69
; RESOURCE_ID_SCREEN_PAN1_0_EFFECTS_LAYOUT EQU 70
; RESOURCE_ID_SCREEN_PAN1_0_EFFECT_ZONE_TABLE EQU 71
; RESOURCE_ID_SCREEN_PAN1_0_BOSS_TABLE     EQU 72
; RESOURCE_ID_BEHAVIOR_PAN1_0_DATA         EQU 73
; RESOURCE_ID_SCREEN_PAN1_0_INTERACTION_TYPE_MAP EQU 74
; RESOURCE_ID_SCREEN_PAN1_0_INTERACTION_VALUE_MAP EQU 75
; RESOURCE_ID_SCREEN_PAN1_0_INTERACTION_TARGET_MAP EQU 76
; RESOURCE_ID_SCREEN_PAN2_1_LAYOUT         EQU 77
; RESOURCE_ID_SCREEN_PAN2_1_EFFECTS_LAYOUT EQU 78
; RESOURCE_ID_SCREEN_PAN2_1_EFFECT_ZONE_TABLE EQU 79
; RESOURCE_ID_SCREEN_PAN2_1_BOSS_TABLE     EQU 80
; RESOURCE_ID_BEHAVIOR_PAN2_1_DATA         EQU 81
; RESOURCE_ID_SCREEN_PAN2_1_INTERACTION_TYPE_MAP EQU 82
; RESOURCE_ID_SCREEN_PAN2_1_INTERACTION_VALUE_MAP EQU 83
; RESOURCE_ID_SCREEN_PAN2_1_INTERACTION_TARGET_MAP EQU 84
; RESOURCE_ID_SCREEN_BACKGROUND1_2_LAYOUT  EQU 85
; RESOURCE_ID_SCREEN_BACKGROUND1_2_EFFECTS_LAYOUT EQU 86
; RESOURCE_ID_SCREEN_BACKGROUND1_2_EFFECT_ZONE_TABLE EQU 87
; RESOURCE_ID_SCREEN_BACKGROUND1_2_BOSS_TABLE EQU 88
; RESOURCE_ID_BEHAVIOR_BACKGROUND1_2_DATA  EQU 89
; RESOURCE_ID_SCREEN_BACKGROUND1_2_INTERACTION_TYPE_MAP EQU 90
; RESOURCE_ID_SCREEN_BACKGROUND1_2_INTERACTION_VALUE_MAP EQU 91
; RESOURCE_ID_SCREEN_BACKGROUND1_2_INTERACTION_TARGET_MAP EQU 92
; RESOURCE_ID_SCREEN_PAN3_3_LAYOUT         EQU 93
; RESOURCE_ID_SCREEN_PAN3_3_EFFECTS_LAYOUT EQU 94
; RESOURCE_ID_SCREEN_PAN3_3_EFFECT_ZONE_TABLE EQU 95
; RESOURCE_ID_SCREEN_PAN3_3_BOSS_TABLE     EQU 96
; RESOURCE_ID_BEHAVIOR_PAN3_3_DATA         EQU 97
; RESOURCE_ID_SCREEN_PAN3_3_INTERACTION_TYPE_MAP EQU 98
; RESOURCE_ID_SCREEN_PAN3_3_INTERACTION_VALUE_MAP EQU 99
; RESOURCE_ID_SCREEN_PAN3_3_INTERACTION_TARGET_MAP EQU 100
; RESOURCE_ID_SCREEN_PAN4_4_LAYOUT         EQU 101
; RESOURCE_ID_SCREEN_PAN4_4_EFFECTS_LAYOUT EQU 102
; RESOURCE_ID_SCREEN_PAN4_4_EFFECT_ZONE_TABLE EQU 103
; RESOURCE_ID_SCREEN_PAN4_4_BOSS_TABLE     EQU 104
; RESOURCE_ID_BEHAVIOR_PAN4_4_DATA         EQU 105
; RESOURCE_ID_SCREEN_PAN4_4_INTERACTION_TYPE_MAP EQU 106
; RESOURCE_ID_SCREEN_PAN4_4_INTERACTION_VALUE_MAP EQU 107
; RESOURCE_ID_SCREEN_PAN4_4_INTERACTION_TARGET_MAP EQU 108
; [[[MIDEAS_ARTIFACT:resource_ids.asm:END]]]

; [[[MIDEAS_ARTIFACT:resource_table.asm:BEGIN]]]
; ; ==================================================================
; ; GENERATED RESOURCE TABLE
; ; Descriptor format: db bank / dw address / dw stored_size / dw raw_size / db flags
; ; Resource id is the zero-based descriptor index.
; ; Address is the mapper-window address visible after selecting bank.
; ; RESOURCE_FLAG_COMPRESSED_ZX0 means stored_size is compressed and raw_size is output size.
; ; ==================================================================
; RESOURCE_TABLE_ENTRY_SIZE EQU 8
; RESOURCE_FLAG_COMPRESSED_ZX0 EQU #01
; RESOURCE_TABLE_COUNT EQU 109
;
; resource_table:
;     ; ANEC_RIGHT_0_F0_LAYER1
;     db 16
;     dw #A2E1
;     dw 32
;     dw 32
;     db 0
;     ; ANEC_RIGHT_0_F0_LAYER2
;     db 16
;     dw #A301
;     dw 29
;     dw 32
;     db 1
;     ; ANEC_RIGHT_0_F1_LAYER1
;     db 16
;     dw #A417
;     dw 32
;     dw 32
;     db 0
;     ; ANEC_RIGHT_0_F1_LAYER2
;     db 16
;     dw #A437
;     dw 28
;     dw 32
;     db 1
;     ; BOLA_1_F0_LAYER1
;     db 16
;     dw #A453
;     dw 24
;     dw 32
;     db 1
;     ; BOLA_1_F1_LAYER1
;     db 16
;     dw #A46B
;     dw 28
;     dw 32
;     db 1
;     ; PANELL_2_F0_LAYER1
;     db 16
;     dw #A487
;     dw 20
;     dw 32
;     db 1
;     ; PANELL_2_F0_LAYER2
;     db 16
;     dw #A49B
;     dw 14
;     dw 32
;     db 1
;     ; NINA_WALK_RIGHT_3_F0_LAYER0
;     db 16
;     dw #A4A9
;     dw 30
;     dw 32
;     db 1
;     ; NINA_WALK_RIGHT_3_F0_LAYER1
;     db 16
;     dw #A4C7
;     dw 25
;     dw 32
;     db 1
;     ; NINA_WALK_RIGHT_3_F1_LAYER0
;     db 16
;     dw #A4E0
;     dw 31
;     dw 32
;     db 1
;     ; NINA_WALK_RIGHT_3_F1_LAYER1
;     db 16
;     dw #A4FF
;     dw 27
;     dw 32
;     db 1
;     ; NINA_JUMP_RIGHT_4_F0_LAYER0
;     db 16
;     dw #A51A
;     dw 27
;     dw 32
;     db 1
;     ; NINA_JUMP_RIGHT_4_F0_LAYER1
;     db 16
;     dw #A6D7
;     dw 24
;     dw 32
;     db 1
;     ; NINA_LAND_RIGHT_5_F0_LAYER0
;     db 16
;     dw #A6EF
;     dw 30
;     dw 32
;     db 1
;     ; NINA_LAND_RIGHT_5_F0_LAYER1
;     db 16
;     dw #A70D
;     dw 23
;     dw 32
;     db 1
;     ; NINA_LAND_RIGHT_5_F1_LAYER0
;     db 16
;     dw #A724
;     dw 28
;     dw 32
;     db 1
;     ; NINA_LAND_RIGHT_5_F1_LAYER1
;     db 16
;     dw #A740
;     dw 27
;     dw 32
;     db 1
;     ; NINA_LAND_RIGHT_5_F2_LAYER0
;     db 16
;     dw #A75B
;     dw 30
;     dw 32
;     db 1
;     ; NINA_LAND_RIGHT_5_F2_LAYER1
;     db 16
;     dw #A779
;     dw 26
;     dw 32
;     db 1
;     ; NINA_DEAD_RIGHT_6_F0_LAYER0
;     db 16
;     dw #A793
;     dw 32
;     dw 32
;     db 0
;     ; NINA_DEAD_RIGHT_6_F0_LAYER2
;     db 16
;     dw #A7B3
;     dw 32
;     dw 32
;     db 0
;     ; NINA_DEAD_RIGHT_6_F1_LAYER0
;     db 16
;     dw #A7D3
;     dw 26
;     dw 32
;     db 1
;     ; NINA_DEAD_RIGHT_6_F1_LAYER2
;     db 16
;     dw #A7ED
;     dw 32
;     dw 32
;     db 0
;     ; NINA_IDLE_RIGHT_7_F0_LAYER0
;     db 16
;     dw #A80D
;     dw 30
;     dw 32
;     db 1
;     ; NINA_IDLE_RIGHT_7_F0_LAYER1
;     db 16
;     dw #A82B
;     dw 24
;     dw 32
;     db 1
;     ; NINA_IDLE_RIGHT_7_F1_LAYER0
;     db 16
;     dw #A843
;     dw 30
;     dw 32
;     db 1
;     ; NINA_IDLE_RIGHT_7_F1_LAYER1
;     db 16
;     dw #A861
;     dw 24
;     dw 32
;     db 1
;     ; NINA_FALL_RIGHT_8_F0_LAYER0
;     db 16
;     dw #A879
;     dw 29
;     dw 32
;     db 1
;     ; NINA_FALL_RIGHT_8_F0_LAYER1
;     db 16
;     dw #A896
;     dw 24
;     dw 32
;     db 1
;     ; CAPCUADRAT1_RIGHT_9_F0_LAYER2
;     db 16
;     dw #A8AE
;     dw 21
;     dw 32
;     db 1
;     ; CAPCUADRAT1_RIGHT_9_F0_LAYER3
;     db 16
;     dw #A8C3
;     dw 29
;     dw 32
;     db 1
;     ; CAPCUADRAT1_RIGHT_9_F1_LAYER2
;     db 16
;     dw #A8E0
;     dw 21
;     dw 32
;     db 1
;     ; CAPCUADRAT1_RIGHT_9_F1_LAYER3
;     db 16
;     dw #A8F5
;     dw 28
;     dw 32
;     db 1
;     ; ANEC_LEFT_10_F0_LAYER1
;     db 16
;     dw #A911
;     dw 32
;     dw 32
;     db 0
;     ; ANEC_LEFT_10_F0_LAYER2
;     db 16
;     dw #A931
;     dw 29
;     dw 32
;     db 1
;     ; ANEC_LEFT_10_F1_LAYER1
;     db 16
;     dw #A94E
;     dw 32
;     dw 32
;     db 0
;     ; ANEC_LEFT_10_F1_LAYER2
;     db 16
;     dw #A96E
;     dw 29
;     dw 32
;     db 1
;     ; NINA_WALK_LEFT_11_F0_LAYER0
;     db 16
;     dw #A98B
;     dw 28
;     dw 32
;     db 1
;     ; NINA_WALK_LEFT_11_F0_LAYER1
;     db 16
;     dw #A9A7
;     dw 25
;     dw 32
;     db 1
;     ; NINA_WALK_LEFT_11_F1_LAYER0
;     db 16
;     dw #A9C0
;     dw 30
;     dw 32
;     db 1
;     ; NINA_WALK_LEFT_11_F1_LAYER1
;     db 16
;     dw #A9DE
;     dw 30
;     dw 32
;     db 1
;     ; NINA_JUMP_LEFT_12_F0_LAYER0
;     db 16
;     dw #A9FC
;     dw 27
;     dw 32
;     db 1
;     ; NINA_JUMP_LEFT_12_F0_LAYER1
;     db 16
;     dw #AA17
;     dw 24
;     dw 32
;     db 1
;     ; NINA_LAND_LEFT_13_F0_LAYER0
;     db 16
;     dw #AA2F
;     dw 29
;     dw 32
;     db 1
;     ; NINA_LAND_LEFT_13_F0_LAYER1
;     db 16
;     dw #AA4C
;     dw 24
;     dw 32
;     db 1
;     ; NINA_LAND_LEFT_13_F1_LAYER0
;     db 16
;     dw #AA64
;     dw 28
;     dw 32
;     db 1
;     ; NINA_LAND_LEFT_13_F1_LAYER1
;     db 16
;     dw #AA80
;     dw 28
;     dw 32
;     db 1
;     ; NINA_LAND_LEFT_13_F2_LAYER0
;     db 16
;     dw #AA9C
;     dw 29
;     dw 32
;     db 1
;     ; NINA_LAND_LEFT_13_F2_LAYER1
;     db 16
;     dw #AAB9
;     dw 27
;     dw 32
;     db 1
;     ; NINA_DEAD_LEFT_14_F0_LAYER0
;     db 16
;     dw #AAD4
;     dw 32
;     dw 32
;     db 0
;     ; NINA_DEAD_LEFT_14_F0_LAYER2
;     db 16
;     dw #AAF4
;     dw 32
;     dw 32
;     db 0
;     ; NINA_DEAD_LEFT_14_F1_LAYER0
;     db 16
;     dw #AB14
;     dw 25
;     dw 32
;     db 1
;     ; NINA_DEAD_LEFT_14_F1_LAYER2
;     db 16
;     dw #AB2D
;     dw 32
;     dw 32
;     db 0
;     ; NINA_IDLE_LEFT_15_F0_LAYER0
;     db 16
;     dw #AB4D
;     dw 30
;     dw 32
;     db 1
;     ; NINA_IDLE_LEFT_15_F0_LAYER1
;     db 16
;     dw #AB6B
;     dw 24
;     dw 32
;     db 1
;     ; NINA_IDLE_LEFT_15_F1_LAYER0
;     db 16
;     dw #AB83
;     dw 30
;     dw 32
;     db 1
;     ; NINA_IDLE_LEFT_15_F1_LAYER1
;     db 16
;     dw #ABA1
;     dw 24
;     dw 32
;     db 1
;     ; NINA_FALL_LEFT_16_F0_LAYER0
;     db 16
;     dw #ABB9
;     dw 29
;     dw 32
;     db 1
;     ; NINA_FALL_LEFT_16_F0_LAYER1
;     db 16
;     dw #ABD6
;     dw 24
;     dw 32
;     db 1
;     ; CAPCUADRAT1_LEFT_17_F0_LAYER2
;     db 16
;     dw #ABEE
;     dw 20
;     dw 32
;     db 1
;     ; CAPCUADRAT1_LEFT_17_F0_LAYER3
;     db 16
;     dw #AC02
;     dw 29
;     dw 32
;     db 1
;     ; CAPCUADRAT1_LEFT_17_F1_LAYER2
;     db 16
;     dw #AC1F
;     dw 20
;     dw 32
;     db 1
;     ; CAPCUADRAT1_LEFT_17_F1_LAYER3
;     db 16
;     dw #AC33
;     dw 26
;     dw 32
;     db 1
;     ; SPRITE_PLACEHOLDER_PATTERN
;     db 16
;     dw #AC4D
;     dw 5
;     dw 32
;     db 1
;     ; tile_pattern_bank0
;     db 16
;     dw #A1BA
;     dw 125
;     dw 144
;     db 1
;     ; tilebank_pattern_data_0
;     db 16
;     dw #A26A
;     dw 119
;     dw 136
;     db 1
;     ; tile_color_bank0
;     db 16
;     dw #A237
;     dw 51
;     dw 144
;     db 1
;     ; tilebank_color_data_0
;     db 16
;     dw #A3E7
;     dw 48
;     dw 136
;     db 1
;     ; SCREEN_PAN1_0_LAYOUT
;     db 16
;     dw #A000
;     dw 136
;     dw 768
;     db 1
;     ; SCREEN_PAN1_0_EFFECTS_LAYOUT
;     db 16
;     dw #A088
;     dw 6
;     dw 768
;     db 1
;     ; SCREEN_PAN1_0_EFFECT_ZONE_TABLE
;     db 16
;     dw #A31E
;     dw 1
;     dw 1
;     db 0
;     ; SCREEN_PAN1_0_BOSS_TABLE
;     db 16
;     dw #A31F
;     dw 1
;     dw 1
;     db 0
;     ; BEHAVIOR_PAN1_0_DATA
;     db 16
;     dw #A08E
;     dw 69
;     dw 768
;     db 1
;     ; SCREEN_PAN1_0_INTERACTION_TYPE_MAP
;     db 16
;     dw #A0D3
;     dw 15
;     dw 768
;     db 1
;     ; SCREEN_PAN1_0_INTERACTION_VALUE_MAP
;     db 16
;     dw #A0E2
;     dw 60
;     dw 768
;     db 1
;     ; SCREEN_PAN1_0_INTERACTION_TARGET_MAP
;     db 16
;     dw #A11E
;     dw 6
;     dw 768
;     db 1
;     ; SCREEN_PAN2_1_LAYOUT
;     db 16
;     dw #A124
;     dw 87
;     dw 768
;     db 1
;     ; SCREEN_PAN2_1_EFFECTS_LAYOUT
;     db 16
;     dw #A17B
;     dw 6
;     dw 768
;     db 1
;     ; SCREEN_PAN2_1_EFFECT_ZONE_TABLE
;     db 16
;     dw #A320
;     dw 1
;     dw 1
;     db 0
;     ; SCREEN_PAN2_1_BOSS_TABLE
;     db 16
;     dw #A321
;     dw 1
;     dw 1
;     db 0
;     ; BEHAVIOR_PAN2_1_DATA
;     db 16
;     dw #A181
;     dw 42
;     dw 768
;     db 1
;     ; SCREEN_PAN2_1_INTERACTION_TYPE_MAP
;     db 16
;     dw #A1AB
;     dw 15
;     dw 768
;     db 1
;     ; SCREEN_PAN2_1_INTERACTION_VALUE_MAP
;     db 16
;     dw #A328
;     dw 40
;     dw 768
;     db 1
;     ; SCREEN_PAN2_1_INTERACTION_TARGET_MAP
;     db 16
;     dw #A350
;     dw 6
;     dw 768
;     db 1
;     ; SCREEN_BACKGROUND1_2_LAYOUT
;     db 16
;     dw #A356
;     dw 6
;     dw 768
;     db 1
;     ; SCREEN_BACKGROUND1_2_EFFECTS_LAYOUT
;     db 16
;     dw #A35C
;     dw 6
;     dw 768
;     db 1
;     ; SCREEN_BACKGROUND1_2_EFFECT_ZONE_TABLE
;     db 16
;     dw #A322
;     dw 1
;     dw 1
;     db 0
;     ; SCREEN_BACKGROUND1_2_BOSS_TABLE
;     db 16
;     dw #A323
;     dw 1
;     dw 1
;     db 0
;     ; BEHAVIOR_BACKGROUND1_2_DATA
;     db 16
;     dw #A362
;     dw 6
;     dw 768
;     db 1
;     ; SCREEN_BACKGROUND1_2_INTERACTION_TYPE_MAP
;     db 16
;     dw #A368
;     dw 6
;     dw 768
;     db 1
;     ; SCREEN_BACKGROUND1_2_INTERACTION_VALUE_MAP
;     db 16
;     dw #A36E
;     dw 6
;     dw 768
;     db 1
;     ; SCREEN_BACKGROUND1_2_INTERACTION_TARGET_MAP
;     db 16
;     dw #A374
;     dw 6
;     dw 768
;     db 1
;     ; SCREEN_PAN3_3_LAYOUT
;     db 16
;     dw #A37A
;     dw 103
;     dw 768
;     db 1
;     ; SCREEN_PAN3_3_EFFECTS_LAYOUT
;     db 16
;     dw #A3E1
;     dw 6
;     dw 768
;     db 1
;     ; SCREEN_PAN3_3_EFFECT_ZONE_TABLE
;     db 16
;     dw #A324
;     dw 1
;     dw 1
;     db 0
;     ; SCREEN_PAN3_3_BOSS_TABLE
;     db 16
;     dw #A325
;     dw 1
;     dw 1
;     db 0
;     ; BEHAVIOR_PAN3_3_DATA
;     db 16
;     dw #A535
;     dw 60
;     dw 768
;     db 1
;     ; SCREEN_PAN3_3_INTERACTION_TYPE_MAP
;     db 16
;     dw #A571
;     dw 24
;     dw 768
;     db 1
;     ; SCREEN_PAN3_3_INTERACTION_VALUE_MAP
;     db 16
;     dw #A589
;     dw 58
;     dw 768
;     db 1
;     ; SCREEN_PAN3_3_INTERACTION_TARGET_MAP
;     db 16
;     dw #A5C3
;     dw 6
;     dw 768
;     db 1
;     ; SCREEN_PAN4_4_LAYOUT
;     db 16
;     dw #A5C9
;     dw 109
;     dw 768
;     db 1
;     ; SCREEN_PAN4_4_EFFECTS_LAYOUT
;     db 16
;     dw #A636
;     dw 6
;     dw 768
;     db 1
;     ; SCREEN_PAN4_4_EFFECT_ZONE_TABLE
;     db 16
;     dw #A326
;     dw 1
;     dw 1
;     db 0
;     ; SCREEN_PAN4_4_BOSS_TABLE
;     db 16
;     dw #A327
;     dw 1
;     dw 1
;     db 0
;     ; BEHAVIOR_PAN4_4_DATA
;     db 16
;     dw #A63C
;     dw 64
;     dw 768
;     db 1
;     ; SCREEN_PAN4_4_INTERACTION_TYPE_MAP
;     db 16
;     dw #A67C
;     dw 21
;     dw 768
;     db 1
;     ; SCREEN_PAN4_4_INTERACTION_VALUE_MAP
;     db 16
;     dw #A691
;     dw 64
;     dw 768
;     db 1
;     ; SCREEN_PAN4_4_INTERACTION_TARGET_MAP
;     db 16
;     dw #A6D1
;     dw 6
;     dw 768
;     db 1
; [[[MIDEAS_ARTIFACT:resource_table.asm:END]]]

; [[[MIDEAS_ARTIFACT:packing_manifest.txt:BEGIN]]]
; MEGAROM PACKING MANIFEST
; Zone size: 8192
; Data start address: #24000
; Total resource blocks: 109
;
; BANK 16 used 3154 / 8192
; - SCREEN_PAN1_0_LAYOUT               136 stored /   768 raw bytes @ #A000 (rom #24000, offset +#0000) [SCREENS/SCREEN_LAYOUT] flags=1
; - SCREEN_PAN1_0_EFFECTS_LAYOUT         6 stored /   768 raw bytes @ #A088 (rom #24088, offset +#0088) [SCREENS/SCREEN_EFFECTS_LAYOUT] flags=1
; - BEHAVIOR_PAN1_0_DATA                69 stored /   768 raw bytes @ #A08E (rom #2408E, offset +#008E) [SCREENS/SCREEN_BEHAVIOR_MAP] flags=1
; - SCREEN_PAN1_0_INTERACTION_TYPE_MAP    15 stored /   768 raw bytes @ #A0D3 (rom #240D3, offset +#00D3) [SCREENS/SCREEN_DATA] flags=1
; - SCREEN_PAN1_0_INTERACTION_VALUE_MAP    60 stored /   768 raw bytes @ #A0E2 (rom #240E2, offset +#00E2) [SCREENS/SCREEN_DATA] flags=1
; - SCREEN_PAN1_0_INTERACTION_TARGET_MAP     6 stored /   768 raw bytes @ #A11E (rom #2411E, offset +#011E) [SCREENS/SCREEN_DATA] flags=1
; - SCREEN_PAN2_1_LAYOUT                87 stored /   768 raw bytes @ #A124 (rom #24124, offset +#0124) [SCREENS/SCREEN_LAYOUT] flags=1
; - SCREEN_PAN2_1_EFFECTS_LAYOUT         6 stored /   768 raw bytes @ #A17B (rom #2417B, offset +#017B) [SCREENS/SCREEN_EFFECTS_LAYOUT] flags=1
; - BEHAVIOR_PAN2_1_DATA                42 stored /   768 raw bytes @ #A181 (rom #24181, offset +#0181) [SCREENS/SCREEN_BEHAVIOR_MAP] flags=1
; - SCREEN_PAN2_1_INTERACTION_TYPE_MAP    15 stored /   768 raw bytes @ #A1AB (rom #241AB, offset +#01AB) [SCREENS/SCREEN_DATA] flags=1
; - tile_pattern_bank0                 125 stored /   144 raw bytes @ #A1BA (rom #241BA, offset +#01BA) [PATTERNS/TILE_PATTERNS] flags=1
; - tile_color_bank0                    51 stored /   144 raw bytes @ #A237 (rom #24237, offset +#0237) [COLORS/TILE_COLORS] flags=1
; - tilebank_pattern_data_0            119 stored /   136 raw bytes @ #A26A (rom #2426A, offset +#026A) [PATTERNS/TILE_PATTERNS] flags=1
; - ANEC_RIGHT_0_F0_LAYER1              32 stored /    32 raw bytes @ #A2E1 (rom #242E1, offset +#02E1) [SPRITES/SPRITE_PATTERNS] flags=0
; - ANEC_RIGHT_0_F0_LAYER2              29 stored /    32 raw bytes @ #A301 (rom #24301, offset +#0301) [SPRITES/SPRITE_PATTERNS] flags=1
; - SCREEN_PAN1_0_EFFECT_ZONE_TABLE      1 stored /     1 raw bytes @ #A31E (rom #2431E, offset +#031E) [SCREENS/SCREEN_EFFECT_ZONE_TABLE] flags=0
; - SCREEN_PAN1_0_BOSS_TABLE             1 stored /     1 raw bytes @ #A31F (rom #2431F, offset +#031F) [SCREENS/SCREEN_DATA] flags=0
; - SCREEN_PAN2_1_EFFECT_ZONE_TABLE      1 stored /     1 raw bytes @ #A320 (rom #24320, offset +#0320) [SCREENS/SCREEN_EFFECT_ZONE_TABLE] flags=0
; - SCREEN_PAN2_1_BOSS_TABLE             1 stored /     1 raw bytes @ #A321 (rom #24321, offset +#0321) [SCREENS/SCREEN_DATA] flags=0
; - SCREEN_BACKGROUND1_2_EFFECT_ZONE_TABLE     1 stored /     1 raw bytes @ #A322 (rom #24322, offset +#0322) [SCREENS/SCREEN_EFFECT_ZONE_TABLE] flags=0
; - SCREEN_BACKGROUND1_2_BOSS_TABLE      1 stored /     1 raw bytes @ #A323 (rom #24323, offset +#0323) [SCREENS/SCREEN_DATA] flags=0
; - SCREEN_PAN3_3_EFFECT_ZONE_TABLE      1 stored /     1 raw bytes @ #A324 (rom #24324, offset +#0324) [SCREENS/SCREEN_EFFECT_ZONE_TABLE] flags=0
; - SCREEN_PAN3_3_BOSS_TABLE             1 stored /     1 raw bytes @ #A325 (rom #24325, offset +#0325) [SCREENS/SCREEN_DATA] flags=0
; - SCREEN_PAN4_4_EFFECT_ZONE_TABLE      1 stored /     1 raw bytes @ #A326 (rom #24326, offset +#0326) [SCREENS/SCREEN_EFFECT_ZONE_TABLE] flags=0
; - SCREEN_PAN4_4_BOSS_TABLE             1 stored /     1 raw bytes @ #A327 (rom #24327, offset +#0327) [SCREENS/SCREEN_DATA] flags=0
; - SCREEN_PAN2_1_INTERACTION_VALUE_MAP    40 stored /   768 raw bytes @ #A328 (rom #24328, offset +#0328) [SCREENS/SCREEN_DATA] flags=1
; - SCREEN_PAN2_1_INTERACTION_TARGET_MAP     6 stored /   768 raw bytes @ #A350 (rom #24350, offset +#0350) [SCREENS/SCREEN_DATA] flags=1
; - SCREEN_BACKGROUND1_2_LAYOUT          6 stored /   768 raw bytes @ #A356 (rom #24356, offset +#0356) [SCREENS/SCREEN_LAYOUT] flags=1
; - SCREEN_BACKGROUND1_2_EFFECTS_LAYOUT     6 stored /   768 raw bytes @ #A35C (rom #2435C, offset +#035C) [SCREENS/SCREEN_EFFECTS_LAYOUT] flags=1
; - BEHAVIOR_BACKGROUND1_2_DATA          6 stored /   768 raw bytes @ #A362 (rom #24362, offset +#0362) [SCREENS/SCREEN_BEHAVIOR_MAP] flags=1
; - SCREEN_BACKGROUND1_2_INTERACTION_TYPE_MAP     6 stored /   768 raw bytes @ #A368 (rom #24368, offset +#0368) [SCREENS/SCREEN_DATA] flags=1
; - SCREEN_BACKGROUND1_2_INTERACTION_VALUE_MAP     6 stored /   768 raw bytes @ #A36E (rom #2436E, offset +#036E) [SCREENS/SCREEN_DATA] flags=1
; - SCREEN_BACKGROUND1_2_INTERACTION_TARGET_MAP     6 stored /   768 raw bytes @ #A374 (rom #24374, offset +#0374) [SCREENS/SCREEN_DATA] flags=1
; - SCREEN_PAN3_3_LAYOUT               103 stored /   768 raw bytes @ #A37A (rom #2437A, offset +#037A) [SCREENS/SCREEN_LAYOUT] flags=1
; - SCREEN_PAN3_3_EFFECTS_LAYOUT         6 stored /   768 raw bytes @ #A3E1 (rom #243E1, offset +#03E1) [SCREENS/SCREEN_EFFECTS_LAYOUT] flags=1
; - tilebank_color_data_0               48 stored /   136 raw bytes @ #A3E7 (rom #243E7, offset +#03E7) [COLORS/TILE_COLORS] flags=1
; - ANEC_RIGHT_0_F1_LAYER1              32 stored /    32 raw bytes @ #A417 (rom #24417, offset +#0417) [SPRITES/SPRITE_PATTERNS] flags=0
; - ANEC_RIGHT_0_F1_LAYER2              28 stored /    32 raw bytes @ #A437 (rom #24437, offset +#0437) [SPRITES/SPRITE_PATTERNS] flags=1
; - BOLA_1_F0_LAYER1                    24 stored /    32 raw bytes @ #A453 (rom #24453, offset +#0453) [SPRITES/SPRITE_PATTERNS] flags=1
; - BOLA_1_F1_LAYER1                    28 stored /    32 raw bytes @ #A46B (rom #2446B, offset +#046B) [SPRITES/SPRITE_PATTERNS] flags=1
; - PANELL_2_F0_LAYER1                  20 stored /    32 raw bytes @ #A487 (rom #24487, offset +#0487) [SPRITES/SPRITE_PATTERNS] flags=1
; - PANELL_2_F0_LAYER2                  14 stored /    32 raw bytes @ #A49B (rom #2449B, offset +#049B) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_WALK_RIGHT_3_F0_LAYER0         30 stored /    32 raw bytes @ #A4A9 (rom #244A9, offset +#04A9) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_WALK_RIGHT_3_F0_LAYER1         25 stored /    32 raw bytes @ #A4C7 (rom #244C7, offset +#04C7) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_WALK_RIGHT_3_F1_LAYER0         31 stored /    32 raw bytes @ #A4E0 (rom #244E0, offset +#04E0) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_WALK_RIGHT_3_F1_LAYER1         27 stored /    32 raw bytes @ #A4FF (rom #244FF, offset +#04FF) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_JUMP_RIGHT_4_F0_LAYER0         27 stored /    32 raw bytes @ #A51A (rom #2451A, offset +#051A) [SPRITES/SPRITE_PATTERNS] flags=1
; - BEHAVIOR_PAN3_3_DATA                60 stored /   768 raw bytes @ #A535 (rom #24535, offset +#0535) [SCREENS/SCREEN_BEHAVIOR_MAP] flags=1
; - SCREEN_PAN3_3_INTERACTION_TYPE_MAP    24 stored /   768 raw bytes @ #A571 (rom #24571, offset +#0571) [SCREENS/SCREEN_DATA] flags=1
; - SCREEN_PAN3_3_INTERACTION_VALUE_MAP    58 stored /   768 raw bytes @ #A589 (rom #24589, offset +#0589) [SCREENS/SCREEN_DATA] flags=1
; - SCREEN_PAN3_3_INTERACTION_TARGET_MAP     6 stored /   768 raw bytes @ #A5C3 (rom #245C3, offset +#05C3) [SCREENS/SCREEN_DATA] flags=1
; - SCREEN_PAN4_4_LAYOUT               109 stored /   768 raw bytes @ #A5C9 (rom #245C9, offset +#05C9) [SCREENS/SCREEN_LAYOUT] flags=1
; - SCREEN_PAN4_4_EFFECTS_LAYOUT         6 stored /   768 raw bytes @ #A636 (rom #24636, offset +#0636) [SCREENS/SCREEN_EFFECTS_LAYOUT] flags=1
; - BEHAVIOR_PAN4_4_DATA                64 stored /   768 raw bytes @ #A63C (rom #2463C, offset +#063C) [SCREENS/SCREEN_BEHAVIOR_MAP] flags=1
; - SCREEN_PAN4_4_INTERACTION_TYPE_MAP    21 stored /   768 raw bytes @ #A67C (rom #2467C, offset +#067C) [SCREENS/SCREEN_DATA] flags=1
; - SCREEN_PAN4_4_INTERACTION_VALUE_MAP    64 stored /   768 raw bytes @ #A691 (rom #24691, offset +#0691) [SCREENS/SCREEN_DATA] flags=1
; - SCREEN_PAN4_4_INTERACTION_TARGET_MAP     6 stored /   768 raw bytes @ #A6D1 (rom #246D1, offset +#06D1) [SCREENS/SCREEN_DATA] flags=1
; - NINA_JUMP_RIGHT_4_F0_LAYER1         24 stored /    32 raw bytes @ #A6D7 (rom #246D7, offset +#06D7) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_LAND_RIGHT_5_F0_LAYER0         30 stored /    32 raw bytes @ #A6EF (rom #246EF, offset +#06EF) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_LAND_RIGHT_5_F0_LAYER1         23 stored /    32 raw bytes @ #A70D (rom #2470D, offset +#070D) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_LAND_RIGHT_5_F1_LAYER0         28 stored /    32 raw bytes @ #A724 (rom #24724, offset +#0724) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_LAND_RIGHT_5_F1_LAYER1         27 stored /    32 raw bytes @ #A740 (rom #24740, offset +#0740) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_LAND_RIGHT_5_F2_LAYER0         30 stored /    32 raw bytes @ #A75B (rom #2475B, offset +#075B) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_LAND_RIGHT_5_F2_LAYER1         26 stored /    32 raw bytes @ #A779 (rom #24779, offset +#0779) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_DEAD_RIGHT_6_F0_LAYER0         32 stored /    32 raw bytes @ #A793 (rom #24793, offset +#0793) [SPRITES/SPRITE_PATTERNS] flags=0
; - NINA_DEAD_RIGHT_6_F0_LAYER2         32 stored /    32 raw bytes @ #A7B3 (rom #247B3, offset +#07B3) [SPRITES/SPRITE_PATTERNS] flags=0
; - NINA_DEAD_RIGHT_6_F1_LAYER0         26 stored /    32 raw bytes @ #A7D3 (rom #247D3, offset +#07D3) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_DEAD_RIGHT_6_F1_LAYER2         32 stored /    32 raw bytes @ #A7ED (rom #247ED, offset +#07ED) [SPRITES/SPRITE_PATTERNS] flags=0
; - NINA_IDLE_RIGHT_7_F0_LAYER0         30 stored /    32 raw bytes @ #A80D (rom #2480D, offset +#080D) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_IDLE_RIGHT_7_F0_LAYER1         24 stored /    32 raw bytes @ #A82B (rom #2482B, offset +#082B) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_IDLE_RIGHT_7_F1_LAYER0         30 stored /    32 raw bytes @ #A843 (rom #24843, offset +#0843) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_IDLE_RIGHT_7_F1_LAYER1         24 stored /    32 raw bytes @ #A861 (rom #24861, offset +#0861) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_FALL_RIGHT_8_F0_LAYER0         29 stored /    32 raw bytes @ #A879 (rom #24879, offset +#0879) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_FALL_RIGHT_8_F0_LAYER1         24 stored /    32 raw bytes @ #A896 (rom #24896, offset +#0896) [SPRITES/SPRITE_PATTERNS] flags=1
; - CAPCUADRAT1_RIGHT_9_F0_LAYER2       21 stored /    32 raw bytes @ #A8AE (rom #248AE, offset +#08AE) [SPRITES/SPRITE_PATTERNS] flags=1
; - CAPCUADRAT1_RIGHT_9_F0_LAYER3       29 stored /    32 raw bytes @ #A8C3 (rom #248C3, offset +#08C3) [SPRITES/SPRITE_PATTERNS] flags=1
; - CAPCUADRAT1_RIGHT_9_F1_LAYER2       21 stored /    32 raw bytes @ #A8E0 (rom #248E0, offset +#08E0) [SPRITES/SPRITE_PATTERNS] flags=1
; - CAPCUADRAT1_RIGHT_9_F1_LAYER3       28 stored /    32 raw bytes @ #A8F5 (rom #248F5, offset +#08F5) [SPRITES/SPRITE_PATTERNS] flags=1
; - ANEC_LEFT_10_F0_LAYER1              32 stored /    32 raw bytes @ #A911 (rom #24911, offset +#0911) [SPRITES/SPRITE_PATTERNS] flags=0
; - ANEC_LEFT_10_F0_LAYER2              29 stored /    32 raw bytes @ #A931 (rom #24931, offset +#0931) [SPRITES/SPRITE_PATTERNS] flags=1
; - ANEC_LEFT_10_F1_LAYER1              32 stored /    32 raw bytes @ #A94E (rom #2494E, offset +#094E) [SPRITES/SPRITE_PATTERNS] flags=0
; - ANEC_LEFT_10_F1_LAYER2              29 stored /    32 raw bytes @ #A96E (rom #2496E, offset +#096E) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_WALK_LEFT_11_F0_LAYER0         28 stored /    32 raw bytes @ #A98B (rom #2498B, offset +#098B) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_WALK_LEFT_11_F0_LAYER1         25 stored /    32 raw bytes @ #A9A7 (rom #249A7, offset +#09A7) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_WALK_LEFT_11_F1_LAYER0         30 stored /    32 raw bytes @ #A9C0 (rom #249C0, offset +#09C0) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_WALK_LEFT_11_F1_LAYER1         30 stored /    32 raw bytes @ #A9DE (rom #249DE, offset +#09DE) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_JUMP_LEFT_12_F0_LAYER0         27 stored /    32 raw bytes @ #A9FC (rom #249FC, offset +#09FC) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_JUMP_LEFT_12_F0_LAYER1         24 stored /    32 raw bytes @ #AA17 (rom #24A17, offset +#0A17) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_LAND_LEFT_13_F0_LAYER0         29 stored /    32 raw bytes @ #AA2F (rom #24A2F, offset +#0A2F) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_LAND_LEFT_13_F0_LAYER1         24 stored /    32 raw bytes @ #AA4C (rom #24A4C, offset +#0A4C) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_LAND_LEFT_13_F1_LAYER0         28 stored /    32 raw bytes @ #AA64 (rom #24A64, offset +#0A64) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_LAND_LEFT_13_F1_LAYER1         28 stored /    32 raw bytes @ #AA80 (rom #24A80, offset +#0A80) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_LAND_LEFT_13_F2_LAYER0         29 stored /    32 raw bytes @ #AA9C (rom #24A9C, offset +#0A9C) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_LAND_LEFT_13_F2_LAYER1         27 stored /    32 raw bytes @ #AAB9 (rom #24AB9, offset +#0AB9) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_DEAD_LEFT_14_F0_LAYER0         32 stored /    32 raw bytes @ #AAD4 (rom #24AD4, offset +#0AD4) [SPRITES/SPRITE_PATTERNS] flags=0
; - NINA_DEAD_LEFT_14_F0_LAYER2         32 stored /    32 raw bytes @ #AAF4 (rom #24AF4, offset +#0AF4) [SPRITES/SPRITE_PATTERNS] flags=0
; - NINA_DEAD_LEFT_14_F1_LAYER0         25 stored /    32 raw bytes @ #AB14 (rom #24B14, offset +#0B14) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_DEAD_LEFT_14_F1_LAYER2         32 stored /    32 raw bytes @ #AB2D (rom #24B2D, offset +#0B2D) [SPRITES/SPRITE_PATTERNS] flags=0
; - NINA_IDLE_LEFT_15_F0_LAYER0         30 stored /    32 raw bytes @ #AB4D (rom #24B4D, offset +#0B4D) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_IDLE_LEFT_15_F0_LAYER1         24 stored /    32 raw bytes @ #AB6B (rom #24B6B, offset +#0B6B) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_IDLE_LEFT_15_F1_LAYER0         30 stored /    32 raw bytes @ #AB83 (rom #24B83, offset +#0B83) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_IDLE_LEFT_15_F1_LAYER1         24 stored /    32 raw bytes @ #ABA1 (rom #24BA1, offset +#0BA1) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_FALL_LEFT_16_F0_LAYER0         29 stored /    32 raw bytes @ #ABB9 (rom #24BB9, offset +#0BB9) [SPRITES/SPRITE_PATTERNS] flags=1
; - NINA_FALL_LEFT_16_F0_LAYER1         24 stored /    32 raw bytes @ #ABD6 (rom #24BD6, offset +#0BD6) [SPRITES/SPRITE_PATTERNS] flags=1
; - CAPCUADRAT1_LEFT_17_F0_LAYER2       20 stored /    32 raw bytes @ #ABEE (rom #24BEE, offset +#0BEE) [SPRITES/SPRITE_PATTERNS] flags=1
; - CAPCUADRAT1_LEFT_17_F0_LAYER3       29 stored /    32 raw bytes @ #AC02 (rom #24C02, offset +#0C02) [SPRITES/SPRITE_PATTERNS] flags=1
; - CAPCUADRAT1_LEFT_17_F1_LAYER2       20 stored /    32 raw bytes @ #AC1F (rom #24C1F, offset +#0C1F) [SPRITES/SPRITE_PATTERNS] flags=1
; - CAPCUADRAT1_LEFT_17_F1_LAYER3       26 stored /    32 raw bytes @ #AC33 (rom #24C33, offset +#0C33) [SPRITES/SPRITE_PATTERNS] flags=1
; - SPRITE_PLACEHOLDER_PATTERN           5 stored /    32 raw bytes @ #AC4D (rom #24C4D, offset +#0C4D) [SPRITES/SPRITE_PATTERNS] flags=1
; FREE 5038
;
; [[[MIDEAS_ARTIFACT:packing_manifest.txt:END]]]

; [[[MIDEAS_ARTIFACT:packing_manifest.json:BEGIN]]]
; {
;   "version": 1,
;   "mapper": {
;     "dataWindowPage": "p3",
;     "windowBase": "#A000",
;     "windowMask": "#1FFF",
;     "bankDivisor": "#2000",
;     "zoneSize": 8192
;   },
;   "summary": {
;     "dataStartAddress": 147456,
;     "totalSourceBytes": 25690,
;     "resourceCount": 109,
;     "zoneCount": 1,
;     "overflowCount": 0,
;     "totalStoredBytes": 3154,
;     "compressedResourceCount": 89
;   },
;   "banks": [
;     {
;       "bank": 16,
;       "zoneIndex": 0,
;       "orgAddress": 147456,
;       "endAddress": 155648,
;       "usedBytes": 3154,
;       "freeBytes": 5038,
;       "resources": [
;         {
;           "id": 69,
;           "label": "SCREEN_PAN1_0_LAYOUT",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN1_0_LAYOUT",
;           "group": "SCREENS",
;           "type": "SCREEN_LAYOUT",
;           "bank": 16,
;           "zoneOffset": 0,
;           "physicalAddress": 147456,
;           "windowAddress": 40960,
;           "size": 136,
;           "storedSize": 136,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 69
;         },
;         {
;           "id": 70,
;           "label": "SCREEN_PAN1_0_EFFECTS_LAYOUT",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN1_0_EFFECTS_LAYOUT",
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECTS_LAYOUT",
;           "bank": 16,
;           "zoneOffset": 136,
;           "physicalAddress": 147592,
;           "windowAddress": 41096,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 70
;         },
;         {
;           "id": 73,
;           "label": "BEHAVIOR_PAN1_0_DATA",
;           "resourceIdLabel": "RESOURCE_ID_BEHAVIOR_PAN1_0_DATA",
;           "group": "SCREENS",
;           "type": "SCREEN_BEHAVIOR_MAP",
;           "bank": 16,
;           "zoneOffset": 142,
;           "physicalAddress": 147598,
;           "windowAddress": 41102,
;           "size": 69,
;           "storedSize": 69,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 73
;         },
;         {
;           "id": 74,
;           "label": "SCREEN_PAN1_0_INTERACTION_TYPE_MAP",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN1_0_INTERACTION_TYPE_MAP",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 16,
;           "zoneOffset": 211,
;           "physicalAddress": 147667,
;           "windowAddress": 41171,
;           "size": 15,
;           "storedSize": 15,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 74
;         },
;         {
;           "id": 75,
;           "label": "SCREEN_PAN1_0_INTERACTION_VALUE_MAP",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN1_0_INTERACTION_VALUE_MAP",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 16,
;           "zoneOffset": 226,
;           "physicalAddress": 147682,
;           "windowAddress": 41186,
;           "size": 60,
;           "storedSize": 60,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 75
;         },
;         {
;           "id": 76,
;           "label": "SCREEN_PAN1_0_INTERACTION_TARGET_MAP",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN1_0_INTERACTION_TARGET_MAP",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 16,
;           "zoneOffset": 286,
;           "physicalAddress": 147742,
;           "windowAddress": 41246,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 76
;         },
;         {
;           "id": 77,
;           "label": "SCREEN_PAN2_1_LAYOUT",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN2_1_LAYOUT",
;           "group": "SCREENS",
;           "type": "SCREEN_LAYOUT",
;           "bank": 16,
;           "zoneOffset": 292,
;           "physicalAddress": 147748,
;           "windowAddress": 41252,
;           "size": 87,
;           "storedSize": 87,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 77
;         },
;         {
;           "id": 78,
;           "label": "SCREEN_PAN2_1_EFFECTS_LAYOUT",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN2_1_EFFECTS_LAYOUT",
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECTS_LAYOUT",
;           "bank": 16,
;           "zoneOffset": 379,
;           "physicalAddress": 147835,
;           "windowAddress": 41339,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 78
;         },
;         {
;           "id": 81,
;           "label": "BEHAVIOR_PAN2_1_DATA",
;           "resourceIdLabel": "RESOURCE_ID_BEHAVIOR_PAN2_1_DATA",
;           "group": "SCREENS",
;           "type": "SCREEN_BEHAVIOR_MAP",
;           "bank": 16,
;           "zoneOffset": 385,
;           "physicalAddress": 147841,
;           "windowAddress": 41345,
;           "size": 42,
;           "storedSize": 42,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 81
;         },
;         {
;           "id": 82,
;           "label": "SCREEN_PAN2_1_INTERACTION_TYPE_MAP",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN2_1_INTERACTION_TYPE_MAP",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 16,
;           "zoneOffset": 427,
;           "physicalAddress": 147883,
;           "windowAddress": 41387,
;           "size": 15,
;           "storedSize": 15,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 82
;         },
;         {
;           "id": 65,
;           "label": "tile_pattern_bank0",
;           "resourceIdLabel": "RESOURCE_ID_TILE_PATTERN_BANK0",
;           "group": "PATTERNS",
;           "type": "TILE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 442,
;           "physicalAddress": 147898,
;           "windowAddress": 41402,
;           "size": 125,
;           "storedSize": 125,
;           "uncompressedSize": 144,
;           "flags": 1,
;           "sourceIndex": 65
;         },
;         {
;           "id": 67,
;           "label": "tile_color_bank0",
;           "resourceIdLabel": "RESOURCE_ID_TILE_COLOR_BANK0",
;           "group": "COLORS",
;           "type": "TILE_COLORS",
;           "bank": 16,
;           "zoneOffset": 567,
;           "physicalAddress": 148023,
;           "windowAddress": 41527,
;           "size": 51,
;           "storedSize": 51,
;           "uncompressedSize": 144,
;           "flags": 1,
;           "sourceIndex": 67
;         },
;         {
;           "id": 66,
;           "label": "tilebank_pattern_data_0",
;           "resourceIdLabel": "RESOURCE_ID_TILEBANK_PATTERN_DATA_0",
;           "group": "PATTERNS",
;           "type": "TILE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 618,
;           "physicalAddress": 148074,
;           "windowAddress": 41578,
;           "size": 119,
;           "storedSize": 119,
;           "uncompressedSize": 136,
;           "flags": 1,
;           "sourceIndex": 66
;         },
;         {
;           "id": 0,
;           "label": "ANEC_RIGHT_0_F0_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_ANEC_RIGHT_0_F0_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 737,
;           "physicalAddress": 148193,
;           "windowAddress": 41697,
;           "size": 32,
;           "storedSize": 32,
;           "uncompressedSize": 32,
;           "flags": 0,
;           "sourceIndex": 0
;         },
;         {
;           "id": 1,
;           "label": "ANEC_RIGHT_0_F0_LAYER2",
;           "resourceIdLabel": "RESOURCE_ID_ANEC_RIGHT_0_F0_LAYER2",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 769,
;           "physicalAddress": 148225,
;           "windowAddress": 41729,
;           "size": 29,
;           "storedSize": 29,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 1
;         },
;         {
;           "id": 71,
;           "label": "SCREEN_PAN1_0_EFFECT_ZONE_TABLE",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN1_0_EFFECT_ZONE_TABLE",
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECT_ZONE_TABLE",
;           "bank": 16,
;           "zoneOffset": 798,
;           "physicalAddress": 148254,
;           "windowAddress": 41758,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "sourceIndex": 71
;         },
;         {
;           "id": 72,
;           "label": "SCREEN_PAN1_0_BOSS_TABLE",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN1_0_BOSS_TABLE",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 16,
;           "zoneOffset": 799,
;           "physicalAddress": 148255,
;           "windowAddress": 41759,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "sourceIndex": 72
;         },
;         {
;           "id": 79,
;           "label": "SCREEN_PAN2_1_EFFECT_ZONE_TABLE",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN2_1_EFFECT_ZONE_TABLE",
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECT_ZONE_TABLE",
;           "bank": 16,
;           "zoneOffset": 800,
;           "physicalAddress": 148256,
;           "windowAddress": 41760,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "sourceIndex": 79
;         },
;         {
;           "id": 80,
;           "label": "SCREEN_PAN2_1_BOSS_TABLE",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN2_1_BOSS_TABLE",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 16,
;           "zoneOffset": 801,
;           "physicalAddress": 148257,
;           "windowAddress": 41761,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "sourceIndex": 80
;         },
;         {
;           "id": 87,
;           "label": "SCREEN_BACKGROUND1_2_EFFECT_ZONE_TABLE",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_BACKGROUND1_2_EFFECT_ZONE_TABLE",
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECT_ZONE_TABLE",
;           "bank": 16,
;           "zoneOffset": 802,
;           "physicalAddress": 148258,
;           "windowAddress": 41762,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "sourceIndex": 87
;         },
;         {
;           "id": 88,
;           "label": "SCREEN_BACKGROUND1_2_BOSS_TABLE",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_BACKGROUND1_2_BOSS_TABLE",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 16,
;           "zoneOffset": 803,
;           "physicalAddress": 148259,
;           "windowAddress": 41763,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "sourceIndex": 88
;         },
;         {
;           "id": 95,
;           "label": "SCREEN_PAN3_3_EFFECT_ZONE_TABLE",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN3_3_EFFECT_ZONE_TABLE",
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECT_ZONE_TABLE",
;           "bank": 16,
;           "zoneOffset": 804,
;           "physicalAddress": 148260,
;           "windowAddress": 41764,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "sourceIndex": 95
;         },
;         {
;           "id": 96,
;           "label": "SCREEN_PAN3_3_BOSS_TABLE",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN3_3_BOSS_TABLE",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 16,
;           "zoneOffset": 805,
;           "physicalAddress": 148261,
;           "windowAddress": 41765,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "sourceIndex": 96
;         },
;         {
;           "id": 103,
;           "label": "SCREEN_PAN4_4_EFFECT_ZONE_TABLE",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN4_4_EFFECT_ZONE_TABLE",
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECT_ZONE_TABLE",
;           "bank": 16,
;           "zoneOffset": 806,
;           "physicalAddress": 148262,
;           "windowAddress": 41766,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "sourceIndex": 103
;         },
;         {
;           "id": 104,
;           "label": "SCREEN_PAN4_4_BOSS_TABLE",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN4_4_BOSS_TABLE",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 16,
;           "zoneOffset": 807,
;           "physicalAddress": 148263,
;           "windowAddress": 41767,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "sourceIndex": 104
;         },
;         {
;           "id": 83,
;           "label": "SCREEN_PAN2_1_INTERACTION_VALUE_MAP",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN2_1_INTERACTION_VALUE_MAP",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 16,
;           "zoneOffset": 808,
;           "physicalAddress": 148264,
;           "windowAddress": 41768,
;           "size": 40,
;           "storedSize": 40,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 83
;         },
;         {
;           "id": 84,
;           "label": "SCREEN_PAN2_1_INTERACTION_TARGET_MAP",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN2_1_INTERACTION_TARGET_MAP",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 16,
;           "zoneOffset": 848,
;           "physicalAddress": 148304,
;           "windowAddress": 41808,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 84
;         },
;         {
;           "id": 85,
;           "label": "SCREEN_BACKGROUND1_2_LAYOUT",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_BACKGROUND1_2_LAYOUT",
;           "group": "SCREENS",
;           "type": "SCREEN_LAYOUT",
;           "bank": 16,
;           "zoneOffset": 854,
;           "physicalAddress": 148310,
;           "windowAddress": 41814,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 85
;         },
;         {
;           "id": 86,
;           "label": "SCREEN_BACKGROUND1_2_EFFECTS_LAYOUT",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_BACKGROUND1_2_EFFECTS_LAYOUT",
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECTS_LAYOUT",
;           "bank": 16,
;           "zoneOffset": 860,
;           "physicalAddress": 148316,
;           "windowAddress": 41820,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 86
;         },
;         {
;           "id": 89,
;           "label": "BEHAVIOR_BACKGROUND1_2_DATA",
;           "resourceIdLabel": "RESOURCE_ID_BEHAVIOR_BACKGROUND1_2_DATA",
;           "group": "SCREENS",
;           "type": "SCREEN_BEHAVIOR_MAP",
;           "bank": 16,
;           "zoneOffset": 866,
;           "physicalAddress": 148322,
;           "windowAddress": 41826,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 89
;         },
;         {
;           "id": 90,
;           "label": "SCREEN_BACKGROUND1_2_INTERACTION_TYPE_MAP",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_BACKGROUND1_2_INTERACTION_TYPE_MAP",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 16,
;           "zoneOffset": 872,
;           "physicalAddress": 148328,
;           "windowAddress": 41832,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 90
;         },
;         {
;           "id": 91,
;           "label": "SCREEN_BACKGROUND1_2_INTERACTION_VALUE_MAP",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_BACKGROUND1_2_INTERACTION_VALUE_MAP",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 16,
;           "zoneOffset": 878,
;           "physicalAddress": 148334,
;           "windowAddress": 41838,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 91
;         },
;         {
;           "id": 92,
;           "label": "SCREEN_BACKGROUND1_2_INTERACTION_TARGET_MAP",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_BACKGROUND1_2_INTERACTION_TARGET_MAP",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 16,
;           "zoneOffset": 884,
;           "physicalAddress": 148340,
;           "windowAddress": 41844,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 92
;         },
;         {
;           "id": 93,
;           "label": "SCREEN_PAN3_3_LAYOUT",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN3_3_LAYOUT",
;           "group": "SCREENS",
;           "type": "SCREEN_LAYOUT",
;           "bank": 16,
;           "zoneOffset": 890,
;           "physicalAddress": 148346,
;           "windowAddress": 41850,
;           "size": 103,
;           "storedSize": 103,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 93
;         },
;         {
;           "id": 94,
;           "label": "SCREEN_PAN3_3_EFFECTS_LAYOUT",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN3_3_EFFECTS_LAYOUT",
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECTS_LAYOUT",
;           "bank": 16,
;           "zoneOffset": 993,
;           "physicalAddress": 148449,
;           "windowAddress": 41953,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 94
;         },
;         {
;           "id": 68,
;           "label": "tilebank_color_data_0",
;           "resourceIdLabel": "RESOURCE_ID_TILEBANK_COLOR_DATA_0",
;           "group": "COLORS",
;           "type": "TILE_COLORS",
;           "bank": 16,
;           "zoneOffset": 999,
;           "physicalAddress": 148455,
;           "windowAddress": 41959,
;           "size": 48,
;           "storedSize": 48,
;           "uncompressedSize": 136,
;           "flags": 1,
;           "sourceIndex": 68
;         },
;         {
;           "id": 2,
;           "label": "ANEC_RIGHT_0_F1_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_ANEC_RIGHT_0_F1_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 1047,
;           "physicalAddress": 148503,
;           "windowAddress": 42007,
;           "size": 32,
;           "storedSize": 32,
;           "uncompressedSize": 32,
;           "flags": 0,
;           "sourceIndex": 2
;         },
;         {
;           "id": 3,
;           "label": "ANEC_RIGHT_0_F1_LAYER2",
;           "resourceIdLabel": "RESOURCE_ID_ANEC_RIGHT_0_F1_LAYER2",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 1079,
;           "physicalAddress": 148535,
;           "windowAddress": 42039,
;           "size": 28,
;           "storedSize": 28,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 3
;         },
;         {
;           "id": 4,
;           "label": "BOLA_1_F0_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_BOLA_1_F0_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 1107,
;           "physicalAddress": 148563,
;           "windowAddress": 42067,
;           "size": 24,
;           "storedSize": 24,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 4
;         },
;         {
;           "id": 5,
;           "label": "BOLA_1_F1_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_BOLA_1_F1_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 1131,
;           "physicalAddress": 148587,
;           "windowAddress": 42091,
;           "size": 28,
;           "storedSize": 28,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 5
;         },
;         {
;           "id": 6,
;           "label": "PANELL_2_F0_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_PANELL_2_F0_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 1159,
;           "physicalAddress": 148615,
;           "windowAddress": 42119,
;           "size": 20,
;           "storedSize": 20,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 6
;         },
;         {
;           "id": 7,
;           "label": "PANELL_2_F0_LAYER2",
;           "resourceIdLabel": "RESOURCE_ID_PANELL_2_F0_LAYER2",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 1179,
;           "physicalAddress": 148635,
;           "windowAddress": 42139,
;           "size": 14,
;           "storedSize": 14,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 7
;         },
;         {
;           "id": 8,
;           "label": "NINA_WALK_RIGHT_3_F0_LAYER0",
;           "resourceIdLabel": "RESOURCE_ID_NINA_WALK_RIGHT_3_F0_LAYER0",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 1193,
;           "physicalAddress": 148649,
;           "windowAddress": 42153,
;           "size": 30,
;           "storedSize": 30,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 8
;         },
;         {
;           "id": 9,
;           "label": "NINA_WALK_RIGHT_3_F0_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_NINA_WALK_RIGHT_3_F0_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 1223,
;           "physicalAddress": 148679,
;           "windowAddress": 42183,
;           "size": 25,
;           "storedSize": 25,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 9
;         },
;         {
;           "id": 10,
;           "label": "NINA_WALK_RIGHT_3_F1_LAYER0",
;           "resourceIdLabel": "RESOURCE_ID_NINA_WALK_RIGHT_3_F1_LAYER0",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 1248,
;           "physicalAddress": 148704,
;           "windowAddress": 42208,
;           "size": 31,
;           "storedSize": 31,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 10
;         },
;         {
;           "id": 11,
;           "label": "NINA_WALK_RIGHT_3_F1_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_NINA_WALK_RIGHT_3_F1_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 1279,
;           "physicalAddress": 148735,
;           "windowAddress": 42239,
;           "size": 27,
;           "storedSize": 27,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 11
;         },
;         {
;           "id": 12,
;           "label": "NINA_JUMP_RIGHT_4_F0_LAYER0",
;           "resourceIdLabel": "RESOURCE_ID_NINA_JUMP_RIGHT_4_F0_LAYER0",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 1306,
;           "physicalAddress": 148762,
;           "windowAddress": 42266,
;           "size": 27,
;           "storedSize": 27,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 12
;         },
;         {
;           "id": 97,
;           "label": "BEHAVIOR_PAN3_3_DATA",
;           "resourceIdLabel": "RESOURCE_ID_BEHAVIOR_PAN3_3_DATA",
;           "group": "SCREENS",
;           "type": "SCREEN_BEHAVIOR_MAP",
;           "bank": 16,
;           "zoneOffset": 1333,
;           "physicalAddress": 148789,
;           "windowAddress": 42293,
;           "size": 60,
;           "storedSize": 60,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 97
;         },
;         {
;           "id": 98,
;           "label": "SCREEN_PAN3_3_INTERACTION_TYPE_MAP",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN3_3_INTERACTION_TYPE_MAP",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 16,
;           "zoneOffset": 1393,
;           "physicalAddress": 148849,
;           "windowAddress": 42353,
;           "size": 24,
;           "storedSize": 24,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 98
;         },
;         {
;           "id": 99,
;           "label": "SCREEN_PAN3_3_INTERACTION_VALUE_MAP",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN3_3_INTERACTION_VALUE_MAP",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 16,
;           "zoneOffset": 1417,
;           "physicalAddress": 148873,
;           "windowAddress": 42377,
;           "size": 58,
;           "storedSize": 58,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 99
;         },
;         {
;           "id": 100,
;           "label": "SCREEN_PAN3_3_INTERACTION_TARGET_MAP",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN3_3_INTERACTION_TARGET_MAP",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 16,
;           "zoneOffset": 1475,
;           "physicalAddress": 148931,
;           "windowAddress": 42435,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 100
;         },
;         {
;           "id": 101,
;           "label": "SCREEN_PAN4_4_LAYOUT",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN4_4_LAYOUT",
;           "group": "SCREENS",
;           "type": "SCREEN_LAYOUT",
;           "bank": 16,
;           "zoneOffset": 1481,
;           "physicalAddress": 148937,
;           "windowAddress": 42441,
;           "size": 109,
;           "storedSize": 109,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 101
;         },
;         {
;           "id": 102,
;           "label": "SCREEN_PAN4_4_EFFECTS_LAYOUT",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN4_4_EFFECTS_LAYOUT",
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECTS_LAYOUT",
;           "bank": 16,
;           "zoneOffset": 1590,
;           "physicalAddress": 149046,
;           "windowAddress": 42550,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 102
;         },
;         {
;           "id": 105,
;           "label": "BEHAVIOR_PAN4_4_DATA",
;           "resourceIdLabel": "RESOURCE_ID_BEHAVIOR_PAN4_4_DATA",
;           "group": "SCREENS",
;           "type": "SCREEN_BEHAVIOR_MAP",
;           "bank": 16,
;           "zoneOffset": 1596,
;           "physicalAddress": 149052,
;           "windowAddress": 42556,
;           "size": 64,
;           "storedSize": 64,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 105
;         },
;         {
;           "id": 106,
;           "label": "SCREEN_PAN4_4_INTERACTION_TYPE_MAP",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN4_4_INTERACTION_TYPE_MAP",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 16,
;           "zoneOffset": 1660,
;           "physicalAddress": 149116,
;           "windowAddress": 42620,
;           "size": 21,
;           "storedSize": 21,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 106
;         },
;         {
;           "id": 107,
;           "label": "SCREEN_PAN4_4_INTERACTION_VALUE_MAP",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN4_4_INTERACTION_VALUE_MAP",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 16,
;           "zoneOffset": 1681,
;           "physicalAddress": 149137,
;           "windowAddress": 42641,
;           "size": 64,
;           "storedSize": 64,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 107
;         },
;         {
;           "id": 108,
;           "label": "SCREEN_PAN4_4_INTERACTION_TARGET_MAP",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN4_4_INTERACTION_TARGET_MAP",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 16,
;           "zoneOffset": 1745,
;           "physicalAddress": 149201,
;           "windowAddress": 42705,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 108
;         },
;         {
;           "id": 13,
;           "label": "NINA_JUMP_RIGHT_4_F0_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_NINA_JUMP_RIGHT_4_F0_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 1751,
;           "physicalAddress": 149207,
;           "windowAddress": 42711,
;           "size": 24,
;           "storedSize": 24,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 13
;         },
;         {
;           "id": 14,
;           "label": "NINA_LAND_RIGHT_5_F0_LAYER0",
;           "resourceIdLabel": "RESOURCE_ID_NINA_LAND_RIGHT_5_F0_LAYER0",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 1775,
;           "physicalAddress": 149231,
;           "windowAddress": 42735,
;           "size": 30,
;           "storedSize": 30,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 14
;         },
;         {
;           "id": 15,
;           "label": "NINA_LAND_RIGHT_5_F0_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_NINA_LAND_RIGHT_5_F0_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 1805,
;           "physicalAddress": 149261,
;           "windowAddress": 42765,
;           "size": 23,
;           "storedSize": 23,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 15
;         },
;         {
;           "id": 16,
;           "label": "NINA_LAND_RIGHT_5_F1_LAYER0",
;           "resourceIdLabel": "RESOURCE_ID_NINA_LAND_RIGHT_5_F1_LAYER0",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 1828,
;           "physicalAddress": 149284,
;           "windowAddress": 42788,
;           "size": 28,
;           "storedSize": 28,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 16
;         },
;         {
;           "id": 17,
;           "label": "NINA_LAND_RIGHT_5_F1_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_NINA_LAND_RIGHT_5_F1_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 1856,
;           "physicalAddress": 149312,
;           "windowAddress": 42816,
;           "size": 27,
;           "storedSize": 27,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 17
;         },
;         {
;           "id": 18,
;           "label": "NINA_LAND_RIGHT_5_F2_LAYER0",
;           "resourceIdLabel": "RESOURCE_ID_NINA_LAND_RIGHT_5_F2_LAYER0",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 1883,
;           "physicalAddress": 149339,
;           "windowAddress": 42843,
;           "size": 30,
;           "storedSize": 30,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 18
;         },
;         {
;           "id": 19,
;           "label": "NINA_LAND_RIGHT_5_F2_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_NINA_LAND_RIGHT_5_F2_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 1913,
;           "physicalAddress": 149369,
;           "windowAddress": 42873,
;           "size": 26,
;           "storedSize": 26,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 19
;         },
;         {
;           "id": 20,
;           "label": "NINA_DEAD_RIGHT_6_F0_LAYER0",
;           "resourceIdLabel": "RESOURCE_ID_NINA_DEAD_RIGHT_6_F0_LAYER0",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 1939,
;           "physicalAddress": 149395,
;           "windowAddress": 42899,
;           "size": 32,
;           "storedSize": 32,
;           "uncompressedSize": 32,
;           "flags": 0,
;           "sourceIndex": 20
;         },
;         {
;           "id": 21,
;           "label": "NINA_DEAD_RIGHT_6_F0_LAYER2",
;           "resourceIdLabel": "RESOURCE_ID_NINA_DEAD_RIGHT_6_F0_LAYER2",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 1971,
;           "physicalAddress": 149427,
;           "windowAddress": 42931,
;           "size": 32,
;           "storedSize": 32,
;           "uncompressedSize": 32,
;           "flags": 0,
;           "sourceIndex": 21
;         },
;         {
;           "id": 22,
;           "label": "NINA_DEAD_RIGHT_6_F1_LAYER0",
;           "resourceIdLabel": "RESOURCE_ID_NINA_DEAD_RIGHT_6_F1_LAYER0",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2003,
;           "physicalAddress": 149459,
;           "windowAddress": 42963,
;           "size": 26,
;           "storedSize": 26,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 22
;         },
;         {
;           "id": 23,
;           "label": "NINA_DEAD_RIGHT_6_F1_LAYER2",
;           "resourceIdLabel": "RESOURCE_ID_NINA_DEAD_RIGHT_6_F1_LAYER2",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2029,
;           "physicalAddress": 149485,
;           "windowAddress": 42989,
;           "size": 32,
;           "storedSize": 32,
;           "uncompressedSize": 32,
;           "flags": 0,
;           "sourceIndex": 23
;         },
;         {
;           "id": 24,
;           "label": "NINA_IDLE_RIGHT_7_F0_LAYER0",
;           "resourceIdLabel": "RESOURCE_ID_NINA_IDLE_RIGHT_7_F0_LAYER0",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2061,
;           "physicalAddress": 149517,
;           "windowAddress": 43021,
;           "size": 30,
;           "storedSize": 30,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 24
;         },
;         {
;           "id": 25,
;           "label": "NINA_IDLE_RIGHT_7_F0_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_NINA_IDLE_RIGHT_7_F0_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2091,
;           "physicalAddress": 149547,
;           "windowAddress": 43051,
;           "size": 24,
;           "storedSize": 24,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 25
;         },
;         {
;           "id": 26,
;           "label": "NINA_IDLE_RIGHT_7_F1_LAYER0",
;           "resourceIdLabel": "RESOURCE_ID_NINA_IDLE_RIGHT_7_F1_LAYER0",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2115,
;           "physicalAddress": 149571,
;           "windowAddress": 43075,
;           "size": 30,
;           "storedSize": 30,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 26
;         },
;         {
;           "id": 27,
;           "label": "NINA_IDLE_RIGHT_7_F1_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_NINA_IDLE_RIGHT_7_F1_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2145,
;           "physicalAddress": 149601,
;           "windowAddress": 43105,
;           "size": 24,
;           "storedSize": 24,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 27
;         },
;         {
;           "id": 28,
;           "label": "NINA_FALL_RIGHT_8_F0_LAYER0",
;           "resourceIdLabel": "RESOURCE_ID_NINA_FALL_RIGHT_8_F0_LAYER0",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2169,
;           "physicalAddress": 149625,
;           "windowAddress": 43129,
;           "size": 29,
;           "storedSize": 29,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 28
;         },
;         {
;           "id": 29,
;           "label": "NINA_FALL_RIGHT_8_F0_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_NINA_FALL_RIGHT_8_F0_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2198,
;           "physicalAddress": 149654,
;           "windowAddress": 43158,
;           "size": 24,
;           "storedSize": 24,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 29
;         },
;         {
;           "id": 30,
;           "label": "CAPCUADRAT1_RIGHT_9_F0_LAYER2",
;           "resourceIdLabel": "RESOURCE_ID_CAPCUADRAT1_RIGHT_9_F0_LAYER2",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2222,
;           "physicalAddress": 149678,
;           "windowAddress": 43182,
;           "size": 21,
;           "storedSize": 21,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 30
;         },
;         {
;           "id": 31,
;           "label": "CAPCUADRAT1_RIGHT_9_F0_LAYER3",
;           "resourceIdLabel": "RESOURCE_ID_CAPCUADRAT1_RIGHT_9_F0_LAYER3",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2243,
;           "physicalAddress": 149699,
;           "windowAddress": 43203,
;           "size": 29,
;           "storedSize": 29,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 31
;         },
;         {
;           "id": 32,
;           "label": "CAPCUADRAT1_RIGHT_9_F1_LAYER2",
;           "resourceIdLabel": "RESOURCE_ID_CAPCUADRAT1_RIGHT_9_F1_LAYER2",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2272,
;           "physicalAddress": 149728,
;           "windowAddress": 43232,
;           "size": 21,
;           "storedSize": 21,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 32
;         },
;         {
;           "id": 33,
;           "label": "CAPCUADRAT1_RIGHT_9_F1_LAYER3",
;           "resourceIdLabel": "RESOURCE_ID_CAPCUADRAT1_RIGHT_9_F1_LAYER3",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2293,
;           "physicalAddress": 149749,
;           "windowAddress": 43253,
;           "size": 28,
;           "storedSize": 28,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 33
;         },
;         {
;           "id": 34,
;           "label": "ANEC_LEFT_10_F0_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_ANEC_LEFT_10_F0_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2321,
;           "physicalAddress": 149777,
;           "windowAddress": 43281,
;           "size": 32,
;           "storedSize": 32,
;           "uncompressedSize": 32,
;           "flags": 0,
;           "sourceIndex": 34
;         },
;         {
;           "id": 35,
;           "label": "ANEC_LEFT_10_F0_LAYER2",
;           "resourceIdLabel": "RESOURCE_ID_ANEC_LEFT_10_F0_LAYER2",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2353,
;           "physicalAddress": 149809,
;           "windowAddress": 43313,
;           "size": 29,
;           "storedSize": 29,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 35
;         },
;         {
;           "id": 36,
;           "label": "ANEC_LEFT_10_F1_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_ANEC_LEFT_10_F1_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2382,
;           "physicalAddress": 149838,
;           "windowAddress": 43342,
;           "size": 32,
;           "storedSize": 32,
;           "uncompressedSize": 32,
;           "flags": 0,
;           "sourceIndex": 36
;         },
;         {
;           "id": 37,
;           "label": "ANEC_LEFT_10_F1_LAYER2",
;           "resourceIdLabel": "RESOURCE_ID_ANEC_LEFT_10_F1_LAYER2",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2414,
;           "physicalAddress": 149870,
;           "windowAddress": 43374,
;           "size": 29,
;           "storedSize": 29,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 37
;         },
;         {
;           "id": 38,
;           "label": "NINA_WALK_LEFT_11_F0_LAYER0",
;           "resourceIdLabel": "RESOURCE_ID_NINA_WALK_LEFT_11_F0_LAYER0",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2443,
;           "physicalAddress": 149899,
;           "windowAddress": 43403,
;           "size": 28,
;           "storedSize": 28,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 38
;         },
;         {
;           "id": 39,
;           "label": "NINA_WALK_LEFT_11_F0_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_NINA_WALK_LEFT_11_F0_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2471,
;           "physicalAddress": 149927,
;           "windowAddress": 43431,
;           "size": 25,
;           "storedSize": 25,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 39
;         },
;         {
;           "id": 40,
;           "label": "NINA_WALK_LEFT_11_F1_LAYER0",
;           "resourceIdLabel": "RESOURCE_ID_NINA_WALK_LEFT_11_F1_LAYER0",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2496,
;           "physicalAddress": 149952,
;           "windowAddress": 43456,
;           "size": 30,
;           "storedSize": 30,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 40
;         },
;         {
;           "id": 41,
;           "label": "NINA_WALK_LEFT_11_F1_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_NINA_WALK_LEFT_11_F1_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2526,
;           "physicalAddress": 149982,
;           "windowAddress": 43486,
;           "size": 30,
;           "storedSize": 30,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 41
;         },
;         {
;           "id": 42,
;           "label": "NINA_JUMP_LEFT_12_F0_LAYER0",
;           "resourceIdLabel": "RESOURCE_ID_NINA_JUMP_LEFT_12_F0_LAYER0",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2556,
;           "physicalAddress": 150012,
;           "windowAddress": 43516,
;           "size": 27,
;           "storedSize": 27,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 42
;         },
;         {
;           "id": 43,
;           "label": "NINA_JUMP_LEFT_12_F0_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_NINA_JUMP_LEFT_12_F0_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2583,
;           "physicalAddress": 150039,
;           "windowAddress": 43543,
;           "size": 24,
;           "storedSize": 24,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 43
;         },
;         {
;           "id": 44,
;           "label": "NINA_LAND_LEFT_13_F0_LAYER0",
;           "resourceIdLabel": "RESOURCE_ID_NINA_LAND_LEFT_13_F0_LAYER0",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2607,
;           "physicalAddress": 150063,
;           "windowAddress": 43567,
;           "size": 29,
;           "storedSize": 29,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 44
;         },
;         {
;           "id": 45,
;           "label": "NINA_LAND_LEFT_13_F0_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_NINA_LAND_LEFT_13_F0_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2636,
;           "physicalAddress": 150092,
;           "windowAddress": 43596,
;           "size": 24,
;           "storedSize": 24,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 45
;         },
;         {
;           "id": 46,
;           "label": "NINA_LAND_LEFT_13_F1_LAYER0",
;           "resourceIdLabel": "RESOURCE_ID_NINA_LAND_LEFT_13_F1_LAYER0",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2660,
;           "physicalAddress": 150116,
;           "windowAddress": 43620,
;           "size": 28,
;           "storedSize": 28,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 46
;         },
;         {
;           "id": 47,
;           "label": "NINA_LAND_LEFT_13_F1_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_NINA_LAND_LEFT_13_F1_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2688,
;           "physicalAddress": 150144,
;           "windowAddress": 43648,
;           "size": 28,
;           "storedSize": 28,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 47
;         },
;         {
;           "id": 48,
;           "label": "NINA_LAND_LEFT_13_F2_LAYER0",
;           "resourceIdLabel": "RESOURCE_ID_NINA_LAND_LEFT_13_F2_LAYER0",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2716,
;           "physicalAddress": 150172,
;           "windowAddress": 43676,
;           "size": 29,
;           "storedSize": 29,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 48
;         },
;         {
;           "id": 49,
;           "label": "NINA_LAND_LEFT_13_F2_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_NINA_LAND_LEFT_13_F2_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2745,
;           "physicalAddress": 150201,
;           "windowAddress": 43705,
;           "size": 27,
;           "storedSize": 27,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 49
;         },
;         {
;           "id": 50,
;           "label": "NINA_DEAD_LEFT_14_F0_LAYER0",
;           "resourceIdLabel": "RESOURCE_ID_NINA_DEAD_LEFT_14_F0_LAYER0",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2772,
;           "physicalAddress": 150228,
;           "windowAddress": 43732,
;           "size": 32,
;           "storedSize": 32,
;           "uncompressedSize": 32,
;           "flags": 0,
;           "sourceIndex": 50
;         },
;         {
;           "id": 51,
;           "label": "NINA_DEAD_LEFT_14_F0_LAYER2",
;           "resourceIdLabel": "RESOURCE_ID_NINA_DEAD_LEFT_14_F0_LAYER2",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2804,
;           "physicalAddress": 150260,
;           "windowAddress": 43764,
;           "size": 32,
;           "storedSize": 32,
;           "uncompressedSize": 32,
;           "flags": 0,
;           "sourceIndex": 51
;         },
;         {
;           "id": 52,
;           "label": "NINA_DEAD_LEFT_14_F1_LAYER0",
;           "resourceIdLabel": "RESOURCE_ID_NINA_DEAD_LEFT_14_F1_LAYER0",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2836,
;           "physicalAddress": 150292,
;           "windowAddress": 43796,
;           "size": 25,
;           "storedSize": 25,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 52
;         },
;         {
;           "id": 53,
;           "label": "NINA_DEAD_LEFT_14_F1_LAYER2",
;           "resourceIdLabel": "RESOURCE_ID_NINA_DEAD_LEFT_14_F1_LAYER2",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2861,
;           "physicalAddress": 150317,
;           "windowAddress": 43821,
;           "size": 32,
;           "storedSize": 32,
;           "uncompressedSize": 32,
;           "flags": 0,
;           "sourceIndex": 53
;         },
;         {
;           "id": 54,
;           "label": "NINA_IDLE_LEFT_15_F0_LAYER0",
;           "resourceIdLabel": "RESOURCE_ID_NINA_IDLE_LEFT_15_F0_LAYER0",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2893,
;           "physicalAddress": 150349,
;           "windowAddress": 43853,
;           "size": 30,
;           "storedSize": 30,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 54
;         },
;         {
;           "id": 55,
;           "label": "NINA_IDLE_LEFT_15_F0_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_NINA_IDLE_LEFT_15_F0_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2923,
;           "physicalAddress": 150379,
;           "windowAddress": 43883,
;           "size": 24,
;           "storedSize": 24,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 55
;         },
;         {
;           "id": 56,
;           "label": "NINA_IDLE_LEFT_15_F1_LAYER0",
;           "resourceIdLabel": "RESOURCE_ID_NINA_IDLE_LEFT_15_F1_LAYER0",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2947,
;           "physicalAddress": 150403,
;           "windowAddress": 43907,
;           "size": 30,
;           "storedSize": 30,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 56
;         },
;         {
;           "id": 57,
;           "label": "NINA_IDLE_LEFT_15_F1_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_NINA_IDLE_LEFT_15_F1_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 2977,
;           "physicalAddress": 150433,
;           "windowAddress": 43937,
;           "size": 24,
;           "storedSize": 24,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 57
;         },
;         {
;           "id": 58,
;           "label": "NINA_FALL_LEFT_16_F0_LAYER0",
;           "resourceIdLabel": "RESOURCE_ID_NINA_FALL_LEFT_16_F0_LAYER0",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 3001,
;           "physicalAddress": 150457,
;           "windowAddress": 43961,
;           "size": 29,
;           "storedSize": 29,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 58
;         },
;         {
;           "id": 59,
;           "label": "NINA_FALL_LEFT_16_F0_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_NINA_FALL_LEFT_16_F0_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 3030,
;           "physicalAddress": 150486,
;           "windowAddress": 43990,
;           "size": 24,
;           "storedSize": 24,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 59
;         },
;         {
;           "id": 60,
;           "label": "CAPCUADRAT1_LEFT_17_F0_LAYER2",
;           "resourceIdLabel": "RESOURCE_ID_CAPCUADRAT1_LEFT_17_F0_LAYER2",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 3054,
;           "physicalAddress": 150510,
;           "windowAddress": 44014,
;           "size": 20,
;           "storedSize": 20,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 60
;         },
;         {
;           "id": 61,
;           "label": "CAPCUADRAT1_LEFT_17_F0_LAYER3",
;           "resourceIdLabel": "RESOURCE_ID_CAPCUADRAT1_LEFT_17_F0_LAYER3",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 3074,
;           "physicalAddress": 150530,
;           "windowAddress": 44034,
;           "size": 29,
;           "storedSize": 29,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 61
;         },
;         {
;           "id": 62,
;           "label": "CAPCUADRAT1_LEFT_17_F1_LAYER2",
;           "resourceIdLabel": "RESOURCE_ID_CAPCUADRAT1_LEFT_17_F1_LAYER2",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 3103,
;           "physicalAddress": 150559,
;           "windowAddress": 44063,
;           "size": 20,
;           "storedSize": 20,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 62
;         },
;         {
;           "id": 63,
;           "label": "CAPCUADRAT1_LEFT_17_F1_LAYER3",
;           "resourceIdLabel": "RESOURCE_ID_CAPCUADRAT1_LEFT_17_F1_LAYER3",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 3123,
;           "physicalAddress": 150579,
;           "windowAddress": 44083,
;           "size": 26,
;           "storedSize": 26,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 63
;         },
;         {
;           "id": 64,
;           "label": "SPRITE_PLACEHOLDER_PATTERN",
;           "resourceIdLabel": "RESOURCE_ID_SPRITE_PLACEHOLDER_PATTERN",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 16,
;           "zoneOffset": 3149,
;           "physicalAddress": 150605,
;           "windowAddress": 44109,
;           "size": 5,
;           "storedSize": 5,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 64
;         }
;       ]
;     }
;   ],
;   "overflow": []
; }
;
; [[[MIDEAS_ARTIFACT:packing_manifest.json:END]]]

; [[[MIDEAS_ARTIFACT:banks.json:BEGIN]]]
; {
;   "version": 1,
;   "segmentSize": 8192,
;   "dataWindow": {
;     "page": "p3",
;     "base": "#A000",
;     "mask": "#1FFF",
;     "bankDivisor": "#2000"
;   },
;   "banks": [
;     {
;       "bank": 16,
;       "origin": 147456,
;       "end": 155648,
;       "usedBytes": 3154,
;       "freeBytes": 5038,
;       "resources": [
;         {
;           "id": 69,
;           "label": "SCREEN_PAN1_0_LAYOUT",
;           "bank": 16,
;           "offset": 0,
;           "address": 40960,
;           "size": 136,
;           "storedSize": 136,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_LAYOUT"
;         },
;         {
;           "id": 70,
;           "label": "SCREEN_PAN1_0_EFFECTS_LAYOUT",
;           "bank": 16,
;           "offset": 136,
;           "address": 41096,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECTS_LAYOUT"
;         },
;         {
;           "id": 73,
;           "label": "BEHAVIOR_PAN1_0_DATA",
;           "bank": 16,
;           "offset": 142,
;           "address": 41102,
;           "size": 69,
;           "storedSize": 69,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_BEHAVIOR_MAP"
;         },
;         {
;           "id": 74,
;           "label": "SCREEN_PAN1_0_INTERACTION_TYPE_MAP",
;           "bank": 16,
;           "offset": 211,
;           "address": 41171,
;           "size": 15,
;           "storedSize": 15,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
;         },
;         {
;           "id": 75,
;           "label": "SCREEN_PAN1_0_INTERACTION_VALUE_MAP",
;           "bank": 16,
;           "offset": 226,
;           "address": 41186,
;           "size": 60,
;           "storedSize": 60,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
;         },
;         {
;           "id": 76,
;           "label": "SCREEN_PAN1_0_INTERACTION_TARGET_MAP",
;           "bank": 16,
;           "offset": 286,
;           "address": 41246,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
;         },
;         {
;           "id": 77,
;           "label": "SCREEN_PAN2_1_LAYOUT",
;           "bank": 16,
;           "offset": 292,
;           "address": 41252,
;           "size": 87,
;           "storedSize": 87,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_LAYOUT"
;         },
;         {
;           "id": 78,
;           "label": "SCREEN_PAN2_1_EFFECTS_LAYOUT",
;           "bank": 16,
;           "offset": 379,
;           "address": 41339,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECTS_LAYOUT"
;         },
;         {
;           "id": 81,
;           "label": "BEHAVIOR_PAN2_1_DATA",
;           "bank": 16,
;           "offset": 385,
;           "address": 41345,
;           "size": 42,
;           "storedSize": 42,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_BEHAVIOR_MAP"
;         },
;         {
;           "id": 82,
;           "label": "SCREEN_PAN2_1_INTERACTION_TYPE_MAP",
;           "bank": 16,
;           "offset": 427,
;           "address": 41387,
;           "size": 15,
;           "storedSize": 15,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
;         },
;         {
;           "id": 65,
;           "label": "tile_pattern_bank0",
;           "bank": 16,
;           "offset": 442,
;           "address": 41402,
;           "size": 125,
;           "storedSize": 125,
;           "uncompressedSize": 144,
;           "flags": 1,
;           "group": "PATTERNS",
;           "type": "TILE_PATTERNS"
;         },
;         {
;           "id": 67,
;           "label": "tile_color_bank0",
;           "bank": 16,
;           "offset": 567,
;           "address": 41527,
;           "size": 51,
;           "storedSize": 51,
;           "uncompressedSize": 144,
;           "flags": 1,
;           "group": "COLORS",
;           "type": "TILE_COLORS"
;         },
;         {
;           "id": 66,
;           "label": "tilebank_pattern_data_0",
;           "bank": 16,
;           "offset": 618,
;           "address": 41578,
;           "size": 119,
;           "storedSize": 119,
;           "uncompressedSize": 136,
;           "flags": 1,
;           "group": "PATTERNS",
;           "type": "TILE_PATTERNS"
;         },
;         {
;           "id": 0,
;           "label": "ANEC_RIGHT_0_F0_LAYER1",
;           "bank": 16,
;           "offset": 737,
;           "address": 41697,
;           "size": 32,
;           "storedSize": 32,
;           "uncompressedSize": 32,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 1,
;           "label": "ANEC_RIGHT_0_F0_LAYER2",
;           "bank": 16,
;           "offset": 769,
;           "address": 41729,
;           "size": 29,
;           "storedSize": 29,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 71,
;           "label": "SCREEN_PAN1_0_EFFECT_ZONE_TABLE",
;           "bank": 16,
;           "offset": 798,
;           "address": 41758,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECT_ZONE_TABLE"
;         },
;         {
;           "id": 72,
;           "label": "SCREEN_PAN1_0_BOSS_TABLE",
;           "bank": 16,
;           "offset": 799,
;           "address": 41759,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
;         },
;         {
;           "id": 79,
;           "label": "SCREEN_PAN2_1_EFFECT_ZONE_TABLE",
;           "bank": 16,
;           "offset": 800,
;           "address": 41760,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECT_ZONE_TABLE"
;         },
;         {
;           "id": 80,
;           "label": "SCREEN_PAN2_1_BOSS_TABLE",
;           "bank": 16,
;           "offset": 801,
;           "address": 41761,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
;         },
;         {
;           "id": 87,
;           "label": "SCREEN_BACKGROUND1_2_EFFECT_ZONE_TABLE",
;           "bank": 16,
;           "offset": 802,
;           "address": 41762,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECT_ZONE_TABLE"
;         },
;         {
;           "id": 88,
;           "label": "SCREEN_BACKGROUND1_2_BOSS_TABLE",
;           "bank": 16,
;           "offset": 803,
;           "address": 41763,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
;         },
;         {
;           "id": 95,
;           "label": "SCREEN_PAN3_3_EFFECT_ZONE_TABLE",
;           "bank": 16,
;           "offset": 804,
;           "address": 41764,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECT_ZONE_TABLE"
;         },
;         {
;           "id": 96,
;           "label": "SCREEN_PAN3_3_BOSS_TABLE",
;           "bank": 16,
;           "offset": 805,
;           "address": 41765,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
;         },
;         {
;           "id": 103,
;           "label": "SCREEN_PAN4_4_EFFECT_ZONE_TABLE",
;           "bank": 16,
;           "offset": 806,
;           "address": 41766,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECT_ZONE_TABLE"
;         },
;         {
;           "id": 104,
;           "label": "SCREEN_PAN4_4_BOSS_TABLE",
;           "bank": 16,
;           "offset": 807,
;           "address": 41767,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
;         },
;         {
;           "id": 83,
;           "label": "SCREEN_PAN2_1_INTERACTION_VALUE_MAP",
;           "bank": 16,
;           "offset": 808,
;           "address": 41768,
;           "size": 40,
;           "storedSize": 40,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
;         },
;         {
;           "id": 84,
;           "label": "SCREEN_PAN2_1_INTERACTION_TARGET_MAP",
;           "bank": 16,
;           "offset": 848,
;           "address": 41808,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
;         },
;         {
;           "id": 85,
;           "label": "SCREEN_BACKGROUND1_2_LAYOUT",
;           "bank": 16,
;           "offset": 854,
;           "address": 41814,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_LAYOUT"
;         },
;         {
;           "id": 86,
;           "label": "SCREEN_BACKGROUND1_2_EFFECTS_LAYOUT",
;           "bank": 16,
;           "offset": 860,
;           "address": 41820,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECTS_LAYOUT"
;         },
;         {
;           "id": 89,
;           "label": "BEHAVIOR_BACKGROUND1_2_DATA",
;           "bank": 16,
;           "offset": 866,
;           "address": 41826,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_BEHAVIOR_MAP"
;         },
;         {
;           "id": 90,
;           "label": "SCREEN_BACKGROUND1_2_INTERACTION_TYPE_MAP",
;           "bank": 16,
;           "offset": 872,
;           "address": 41832,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
;         },
;         {
;           "id": 91,
;           "label": "SCREEN_BACKGROUND1_2_INTERACTION_VALUE_MAP",
;           "bank": 16,
;           "offset": 878,
;           "address": 41838,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
;         },
;         {
;           "id": 92,
;           "label": "SCREEN_BACKGROUND1_2_INTERACTION_TARGET_MAP",
;           "bank": 16,
;           "offset": 884,
;           "address": 41844,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
;         },
;         {
;           "id": 93,
;           "label": "SCREEN_PAN3_3_LAYOUT",
;           "bank": 16,
;           "offset": 890,
;           "address": 41850,
;           "size": 103,
;           "storedSize": 103,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_LAYOUT"
;         },
;         {
;           "id": 94,
;           "label": "SCREEN_PAN3_3_EFFECTS_LAYOUT",
;           "bank": 16,
;           "offset": 993,
;           "address": 41953,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECTS_LAYOUT"
;         },
;         {
;           "id": 68,
;           "label": "tilebank_color_data_0",
;           "bank": 16,
;           "offset": 999,
;           "address": 41959,
;           "size": 48,
;           "storedSize": 48,
;           "uncompressedSize": 136,
;           "flags": 1,
;           "group": "COLORS",
;           "type": "TILE_COLORS"
;         },
;         {
;           "id": 2,
;           "label": "ANEC_RIGHT_0_F1_LAYER1",
;           "bank": 16,
;           "offset": 1047,
;           "address": 42007,
;           "size": 32,
;           "storedSize": 32,
;           "uncompressedSize": 32,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 3,
;           "label": "ANEC_RIGHT_0_F1_LAYER2",
;           "bank": 16,
;           "offset": 1079,
;           "address": 42039,
;           "size": 28,
;           "storedSize": 28,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 4,
;           "label": "BOLA_1_F0_LAYER1",
;           "bank": 16,
;           "offset": 1107,
;           "address": 42067,
;           "size": 24,
;           "storedSize": 24,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 5,
;           "label": "BOLA_1_F1_LAYER1",
;           "bank": 16,
;           "offset": 1131,
;           "address": 42091,
;           "size": 28,
;           "storedSize": 28,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 6,
;           "label": "PANELL_2_F0_LAYER1",
;           "bank": 16,
;           "offset": 1159,
;           "address": 42119,
;           "size": 20,
;           "storedSize": 20,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 7,
;           "label": "PANELL_2_F0_LAYER2",
;           "bank": 16,
;           "offset": 1179,
;           "address": 42139,
;           "size": 14,
;           "storedSize": 14,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 8,
;           "label": "NINA_WALK_RIGHT_3_F0_LAYER0",
;           "bank": 16,
;           "offset": 1193,
;           "address": 42153,
;           "size": 30,
;           "storedSize": 30,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 9,
;           "label": "NINA_WALK_RIGHT_3_F0_LAYER1",
;           "bank": 16,
;           "offset": 1223,
;           "address": 42183,
;           "size": 25,
;           "storedSize": 25,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 10,
;           "label": "NINA_WALK_RIGHT_3_F1_LAYER0",
;           "bank": 16,
;           "offset": 1248,
;           "address": 42208,
;           "size": 31,
;           "storedSize": 31,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 11,
;           "label": "NINA_WALK_RIGHT_3_F1_LAYER1",
;           "bank": 16,
;           "offset": 1279,
;           "address": 42239,
;           "size": 27,
;           "storedSize": 27,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 12,
;           "label": "NINA_JUMP_RIGHT_4_F0_LAYER0",
;           "bank": 16,
;           "offset": 1306,
;           "address": 42266,
;           "size": 27,
;           "storedSize": 27,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 97,
;           "label": "BEHAVIOR_PAN3_3_DATA",
;           "bank": 16,
;           "offset": 1333,
;           "address": 42293,
;           "size": 60,
;           "storedSize": 60,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_BEHAVIOR_MAP"
;         },
;         {
;           "id": 98,
;           "label": "SCREEN_PAN3_3_INTERACTION_TYPE_MAP",
;           "bank": 16,
;           "offset": 1393,
;           "address": 42353,
;           "size": 24,
;           "storedSize": 24,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
;         },
;         {
;           "id": 99,
;           "label": "SCREEN_PAN3_3_INTERACTION_VALUE_MAP",
;           "bank": 16,
;           "offset": 1417,
;           "address": 42377,
;           "size": 58,
;           "storedSize": 58,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
;         },
;         {
;           "id": 100,
;           "label": "SCREEN_PAN3_3_INTERACTION_TARGET_MAP",
;           "bank": 16,
;           "offset": 1475,
;           "address": 42435,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
;         },
;         {
;           "id": 101,
;           "label": "SCREEN_PAN4_4_LAYOUT",
;           "bank": 16,
;           "offset": 1481,
;           "address": 42441,
;           "size": 109,
;           "storedSize": 109,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_LAYOUT"
;         },
;         {
;           "id": 102,
;           "label": "SCREEN_PAN4_4_EFFECTS_LAYOUT",
;           "bank": 16,
;           "offset": 1590,
;           "address": 42550,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECTS_LAYOUT"
;         },
;         {
;           "id": 105,
;           "label": "BEHAVIOR_PAN4_4_DATA",
;           "bank": 16,
;           "offset": 1596,
;           "address": 42556,
;           "size": 64,
;           "storedSize": 64,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_BEHAVIOR_MAP"
;         },
;         {
;           "id": 106,
;           "label": "SCREEN_PAN4_4_INTERACTION_TYPE_MAP",
;           "bank": 16,
;           "offset": 1660,
;           "address": 42620,
;           "size": 21,
;           "storedSize": 21,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
;         },
;         {
;           "id": 107,
;           "label": "SCREEN_PAN4_4_INTERACTION_VALUE_MAP",
;           "bank": 16,
;           "offset": 1681,
;           "address": 42641,
;           "size": 64,
;           "storedSize": 64,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
;         },
;         {
;           "id": 108,
;           "label": "SCREEN_PAN4_4_INTERACTION_TARGET_MAP",
;           "bank": 16,
;           "offset": 1745,
;           "address": 42705,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
;         },
;         {
;           "id": 13,
;           "label": "NINA_JUMP_RIGHT_4_F0_LAYER1",
;           "bank": 16,
;           "offset": 1751,
;           "address": 42711,
;           "size": 24,
;           "storedSize": 24,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 14,
;           "label": "NINA_LAND_RIGHT_5_F0_LAYER0",
;           "bank": 16,
;           "offset": 1775,
;           "address": 42735,
;           "size": 30,
;           "storedSize": 30,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 15,
;           "label": "NINA_LAND_RIGHT_5_F0_LAYER1",
;           "bank": 16,
;           "offset": 1805,
;           "address": 42765,
;           "size": 23,
;           "storedSize": 23,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 16,
;           "label": "NINA_LAND_RIGHT_5_F1_LAYER0",
;           "bank": 16,
;           "offset": 1828,
;           "address": 42788,
;           "size": 28,
;           "storedSize": 28,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 17,
;           "label": "NINA_LAND_RIGHT_5_F1_LAYER1",
;           "bank": 16,
;           "offset": 1856,
;           "address": 42816,
;           "size": 27,
;           "storedSize": 27,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 18,
;           "label": "NINA_LAND_RIGHT_5_F2_LAYER0",
;           "bank": 16,
;           "offset": 1883,
;           "address": 42843,
;           "size": 30,
;           "storedSize": 30,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 19,
;           "label": "NINA_LAND_RIGHT_5_F2_LAYER1",
;           "bank": 16,
;           "offset": 1913,
;           "address": 42873,
;           "size": 26,
;           "storedSize": 26,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 20,
;           "label": "NINA_DEAD_RIGHT_6_F0_LAYER0",
;           "bank": 16,
;           "offset": 1939,
;           "address": 42899,
;           "size": 32,
;           "storedSize": 32,
;           "uncompressedSize": 32,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 21,
;           "label": "NINA_DEAD_RIGHT_6_F0_LAYER2",
;           "bank": 16,
;           "offset": 1971,
;           "address": 42931,
;           "size": 32,
;           "storedSize": 32,
;           "uncompressedSize": 32,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 22,
;           "label": "NINA_DEAD_RIGHT_6_F1_LAYER0",
;           "bank": 16,
;           "offset": 2003,
;           "address": 42963,
;           "size": 26,
;           "storedSize": 26,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 23,
;           "label": "NINA_DEAD_RIGHT_6_F1_LAYER2",
;           "bank": 16,
;           "offset": 2029,
;           "address": 42989,
;           "size": 32,
;           "storedSize": 32,
;           "uncompressedSize": 32,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 24,
;           "label": "NINA_IDLE_RIGHT_7_F0_LAYER0",
;           "bank": 16,
;           "offset": 2061,
;           "address": 43021,
;           "size": 30,
;           "storedSize": 30,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 25,
;           "label": "NINA_IDLE_RIGHT_7_F0_LAYER1",
;           "bank": 16,
;           "offset": 2091,
;           "address": 43051,
;           "size": 24,
;           "storedSize": 24,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 26,
;           "label": "NINA_IDLE_RIGHT_7_F1_LAYER0",
;           "bank": 16,
;           "offset": 2115,
;           "address": 43075,
;           "size": 30,
;           "storedSize": 30,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 27,
;           "label": "NINA_IDLE_RIGHT_7_F1_LAYER1",
;           "bank": 16,
;           "offset": 2145,
;           "address": 43105,
;           "size": 24,
;           "storedSize": 24,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 28,
;           "label": "NINA_FALL_RIGHT_8_F0_LAYER0",
;           "bank": 16,
;           "offset": 2169,
;           "address": 43129,
;           "size": 29,
;           "storedSize": 29,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 29,
;           "label": "NINA_FALL_RIGHT_8_F0_LAYER1",
;           "bank": 16,
;           "offset": 2198,
;           "address": 43158,
;           "size": 24,
;           "storedSize": 24,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 30,
;           "label": "CAPCUADRAT1_RIGHT_9_F0_LAYER2",
;           "bank": 16,
;           "offset": 2222,
;           "address": 43182,
;           "size": 21,
;           "storedSize": 21,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 31,
;           "label": "CAPCUADRAT1_RIGHT_9_F0_LAYER3",
;           "bank": 16,
;           "offset": 2243,
;           "address": 43203,
;           "size": 29,
;           "storedSize": 29,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 32,
;           "label": "CAPCUADRAT1_RIGHT_9_F1_LAYER2",
;           "bank": 16,
;           "offset": 2272,
;           "address": 43232,
;           "size": 21,
;           "storedSize": 21,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 33,
;           "label": "CAPCUADRAT1_RIGHT_9_F1_LAYER3",
;           "bank": 16,
;           "offset": 2293,
;           "address": 43253,
;           "size": 28,
;           "storedSize": 28,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 34,
;           "label": "ANEC_LEFT_10_F0_LAYER1",
;           "bank": 16,
;           "offset": 2321,
;           "address": 43281,
;           "size": 32,
;           "storedSize": 32,
;           "uncompressedSize": 32,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 35,
;           "label": "ANEC_LEFT_10_F0_LAYER2",
;           "bank": 16,
;           "offset": 2353,
;           "address": 43313,
;           "size": 29,
;           "storedSize": 29,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 36,
;           "label": "ANEC_LEFT_10_F1_LAYER1",
;           "bank": 16,
;           "offset": 2382,
;           "address": 43342,
;           "size": 32,
;           "storedSize": 32,
;           "uncompressedSize": 32,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 37,
;           "label": "ANEC_LEFT_10_F1_LAYER2",
;           "bank": 16,
;           "offset": 2414,
;           "address": 43374,
;           "size": 29,
;           "storedSize": 29,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 38,
;           "label": "NINA_WALK_LEFT_11_F0_LAYER0",
;           "bank": 16,
;           "offset": 2443,
;           "address": 43403,
;           "size": 28,
;           "storedSize": 28,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 39,
;           "label": "NINA_WALK_LEFT_11_F0_LAYER1",
;           "bank": 16,
;           "offset": 2471,
;           "address": 43431,
;           "size": 25,
;           "storedSize": 25,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 40,
;           "label": "NINA_WALK_LEFT_11_F1_LAYER0",
;           "bank": 16,
;           "offset": 2496,
;           "address": 43456,
;           "size": 30,
;           "storedSize": 30,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 41,
;           "label": "NINA_WALK_LEFT_11_F1_LAYER1",
;           "bank": 16,
;           "offset": 2526,
;           "address": 43486,
;           "size": 30,
;           "storedSize": 30,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 42,
;           "label": "NINA_JUMP_LEFT_12_F0_LAYER0",
;           "bank": 16,
;           "offset": 2556,
;           "address": 43516,
;           "size": 27,
;           "storedSize": 27,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 43,
;           "label": "NINA_JUMP_LEFT_12_F0_LAYER1",
;           "bank": 16,
;           "offset": 2583,
;           "address": 43543,
;           "size": 24,
;           "storedSize": 24,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 44,
;           "label": "NINA_LAND_LEFT_13_F0_LAYER0",
;           "bank": 16,
;           "offset": 2607,
;           "address": 43567,
;           "size": 29,
;           "storedSize": 29,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 45,
;           "label": "NINA_LAND_LEFT_13_F0_LAYER1",
;           "bank": 16,
;           "offset": 2636,
;           "address": 43596,
;           "size": 24,
;           "storedSize": 24,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 46,
;           "label": "NINA_LAND_LEFT_13_F1_LAYER0",
;           "bank": 16,
;           "offset": 2660,
;           "address": 43620,
;           "size": 28,
;           "storedSize": 28,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 47,
;           "label": "NINA_LAND_LEFT_13_F1_LAYER1",
;           "bank": 16,
;           "offset": 2688,
;           "address": 43648,
;           "size": 28,
;           "storedSize": 28,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 48,
;           "label": "NINA_LAND_LEFT_13_F2_LAYER0",
;           "bank": 16,
;           "offset": 2716,
;           "address": 43676,
;           "size": 29,
;           "storedSize": 29,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 49,
;           "label": "NINA_LAND_LEFT_13_F2_LAYER1",
;           "bank": 16,
;           "offset": 2745,
;           "address": 43705,
;           "size": 27,
;           "storedSize": 27,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 50,
;           "label": "NINA_DEAD_LEFT_14_F0_LAYER0",
;           "bank": 16,
;           "offset": 2772,
;           "address": 43732,
;           "size": 32,
;           "storedSize": 32,
;           "uncompressedSize": 32,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 51,
;           "label": "NINA_DEAD_LEFT_14_F0_LAYER2",
;           "bank": 16,
;           "offset": 2804,
;           "address": 43764,
;           "size": 32,
;           "storedSize": 32,
;           "uncompressedSize": 32,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 52,
;           "label": "NINA_DEAD_LEFT_14_F1_LAYER0",
;           "bank": 16,
;           "offset": 2836,
;           "address": 43796,
;           "size": 25,
;           "storedSize": 25,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 53,
;           "label": "NINA_DEAD_LEFT_14_F1_LAYER2",
;           "bank": 16,
;           "offset": 2861,
;           "address": 43821,
;           "size": 32,
;           "storedSize": 32,
;           "uncompressedSize": 32,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 54,
;           "label": "NINA_IDLE_LEFT_15_F0_LAYER0",
;           "bank": 16,
;           "offset": 2893,
;           "address": 43853,
;           "size": 30,
;           "storedSize": 30,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 55,
;           "label": "NINA_IDLE_LEFT_15_F0_LAYER1",
;           "bank": 16,
;           "offset": 2923,
;           "address": 43883,
;           "size": 24,
;           "storedSize": 24,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 56,
;           "label": "NINA_IDLE_LEFT_15_F1_LAYER0",
;           "bank": 16,
;           "offset": 2947,
;           "address": 43907,
;           "size": 30,
;           "storedSize": 30,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 57,
;           "label": "NINA_IDLE_LEFT_15_F1_LAYER1",
;           "bank": 16,
;           "offset": 2977,
;           "address": 43937,
;           "size": 24,
;           "storedSize": 24,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 58,
;           "label": "NINA_FALL_LEFT_16_F0_LAYER0",
;           "bank": 16,
;           "offset": 3001,
;           "address": 43961,
;           "size": 29,
;           "storedSize": 29,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 59,
;           "label": "NINA_FALL_LEFT_16_F0_LAYER1",
;           "bank": 16,
;           "offset": 3030,
;           "address": 43990,
;           "size": 24,
;           "storedSize": 24,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 60,
;           "label": "CAPCUADRAT1_LEFT_17_F0_LAYER2",
;           "bank": 16,
;           "offset": 3054,
;           "address": 44014,
;           "size": 20,
;           "storedSize": 20,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 61,
;           "label": "CAPCUADRAT1_LEFT_17_F0_LAYER3",
;           "bank": 16,
;           "offset": 3074,
;           "address": 44034,
;           "size": 29,
;           "storedSize": 29,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 62,
;           "label": "CAPCUADRAT1_LEFT_17_F1_LAYER2",
;           "bank": 16,
;           "offset": 3103,
;           "address": 44063,
;           "size": 20,
;           "storedSize": 20,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 63,
;           "label": "CAPCUADRAT1_LEFT_17_F1_LAYER3",
;           "bank": 16,
;           "offset": 3123,
;           "address": 44083,
;           "size": 26,
;           "storedSize": 26,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 64,
;           "label": "SPRITE_PLACEHOLDER_PATTERN",
;           "bank": 16,
;           "offset": 3149,
;           "address": 44109,
;           "size": 5,
;           "storedSize": 5,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         }
;       ]
;     }
;   ],
;   "overflow": []
; }
;
; [[[MIDEAS_ARTIFACT:banks.json:END]]]

; [[[MIDEAS_ARTIFACT:project_usage.json:BEGIN]]]
; {
;   "version": 1,
;   "scope": "konami8k_megarom_data",
;   "features": {
;     "sprites": true,
;     "tiles": true,
;     "screens": true,
;     "entities": true,
;     "components": true,
;     "gameFlow": true,
;     "menus": false,
;     "fonts": true,
;     "animations": true,
;     "collisions": true,
;     "sounds": true,
;     "stateMachines": true
;   },
;   "counts": {
;     "components": 13,
;     "templates": 4,
;     "sprites": 10,
;     "tiles": 12,
;     "tileBanks": 1,
;     "screens": 5,
;     "entities": 4,
;     "sounds": 2,
;     "tracks": 0,
;     "stateMachines": 1,
;     "bankedResources": 109
;   },
;   "resourceGroups": [
;     {
;       "key": "COLORS",
;       "count": 2
;     },
;     {
;       "key": "PATTERNS",
;       "count": 2
;     },
;     {
;       "key": "SCREENS",
;       "count": 40
;     },
;     {
;       "key": "SPRITES",
;       "count": 65
;     }
;   ],
;   "resourceTypes": [
;     {
;       "key": "SCREEN_BEHAVIOR_MAP",
;       "count": 5
;     },
;     {
;       "key": "SCREEN_DATA",
;       "count": 20
;     },
;     {
;       "key": "SCREEN_EFFECT_ZONE_TABLE",
;       "count": 5
;     },
;     {
;       "key": "SCREEN_EFFECTS_LAYOUT",
;       "count": 5
;     },
;     {
;       "key": "SCREEN_LAYOUT",
;       "count": 5
;     },
;     {
;       "key": "SPRITE_PATTERNS",
;       "count": 65
;     },
;     {
;       "key": "TILE_COLORS",
;       "count": 2
;     },
;     {
;       "key": "TILE_PATTERNS",
;       "count": 2
;     }
;   ],
;   "scenes": [
;     {
;       "index": 0,
;       "id": "screenmap_1770754008863",
;       "name": "pan1"
;     },
;     {
;       "index": 1,
;       "id": "screenmap_1771184738851",
;       "name": "pan2"
;     },
;     {
;       "index": 2,
;       "id": "screenmap_1771482721894",
;       "name": "background1"
;     },
;     {
;       "index": 3,
;       "id": "screenmap_1771880109228",
;       "name": "pan3"
;     },
;     {
;       "index": 4,
;       "id": "screenmap_1772291683578",
;       "name": "pan4"
;     }
;   ],
;   "bankedResources": [
;     {
;       "id": 0,
;       "label": "ANEC_RIGHT_0_F0_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 41697,
;       "size": 32,
;       "storedSize": 32,
;       "uncompressedSize": 32,
;       "flags": 0
;     },
;     {
;       "id": 1,
;       "label": "ANEC_RIGHT_0_F0_LAYER2",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 41729,
;       "size": 29,
;       "storedSize": 29,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 2,
;       "label": "ANEC_RIGHT_0_F1_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 42007,
;       "size": 32,
;       "storedSize": 32,
;       "uncompressedSize": 32,
;       "flags": 0
;     },
;     {
;       "id": 3,
;       "label": "ANEC_RIGHT_0_F1_LAYER2",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 42039,
;       "size": 28,
;       "storedSize": 28,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 4,
;       "label": "BOLA_1_F0_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 42067,
;       "size": 24,
;       "storedSize": 24,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 5,
;       "label": "BOLA_1_F1_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 42091,
;       "size": 28,
;       "storedSize": 28,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 6,
;       "label": "PANELL_2_F0_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 42119,
;       "size": 20,
;       "storedSize": 20,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 7,
;       "label": "PANELL_2_F0_LAYER2",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 42139,
;       "size": 14,
;       "storedSize": 14,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 8,
;       "label": "NINA_WALK_RIGHT_3_F0_LAYER0",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 42153,
;       "size": 30,
;       "storedSize": 30,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 9,
;       "label": "NINA_WALK_RIGHT_3_F0_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 42183,
;       "size": 25,
;       "storedSize": 25,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 10,
;       "label": "NINA_WALK_RIGHT_3_F1_LAYER0",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 42208,
;       "size": 31,
;       "storedSize": 31,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 11,
;       "label": "NINA_WALK_RIGHT_3_F1_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 42239,
;       "size": 27,
;       "storedSize": 27,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 12,
;       "label": "NINA_JUMP_RIGHT_4_F0_LAYER0",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 42266,
;       "size": 27,
;       "storedSize": 27,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 13,
;       "label": "NINA_JUMP_RIGHT_4_F0_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 42711,
;       "size": 24,
;       "storedSize": 24,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 14,
;       "label": "NINA_LAND_RIGHT_5_F0_LAYER0",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 42735,
;       "size": 30,
;       "storedSize": 30,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 15,
;       "label": "NINA_LAND_RIGHT_5_F0_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 42765,
;       "size": 23,
;       "storedSize": 23,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 16,
;       "label": "NINA_LAND_RIGHT_5_F1_LAYER0",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 42788,
;       "size": 28,
;       "storedSize": 28,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 17,
;       "label": "NINA_LAND_RIGHT_5_F1_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 42816,
;       "size": 27,
;       "storedSize": 27,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 18,
;       "label": "NINA_LAND_RIGHT_5_F2_LAYER0",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 42843,
;       "size": 30,
;       "storedSize": 30,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 19,
;       "label": "NINA_LAND_RIGHT_5_F2_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 42873,
;       "size": 26,
;       "storedSize": 26,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 20,
;       "label": "NINA_DEAD_RIGHT_6_F0_LAYER0",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 42899,
;       "size": 32,
;       "storedSize": 32,
;       "uncompressedSize": 32,
;       "flags": 0
;     },
;     {
;       "id": 21,
;       "label": "NINA_DEAD_RIGHT_6_F0_LAYER2",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 42931,
;       "size": 32,
;       "storedSize": 32,
;       "uncompressedSize": 32,
;       "flags": 0
;     },
;     {
;       "id": 22,
;       "label": "NINA_DEAD_RIGHT_6_F1_LAYER0",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 42963,
;       "size": 26,
;       "storedSize": 26,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 23,
;       "label": "NINA_DEAD_RIGHT_6_F1_LAYER2",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 42989,
;       "size": 32,
;       "storedSize": 32,
;       "uncompressedSize": 32,
;       "flags": 0
;     },
;     {
;       "id": 24,
;       "label": "NINA_IDLE_RIGHT_7_F0_LAYER0",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43021,
;       "size": 30,
;       "storedSize": 30,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 25,
;       "label": "NINA_IDLE_RIGHT_7_F0_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43051,
;       "size": 24,
;       "storedSize": 24,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 26,
;       "label": "NINA_IDLE_RIGHT_7_F1_LAYER0",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43075,
;       "size": 30,
;       "storedSize": 30,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 27,
;       "label": "NINA_IDLE_RIGHT_7_F1_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43105,
;       "size": 24,
;       "storedSize": 24,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 28,
;       "label": "NINA_FALL_RIGHT_8_F0_LAYER0",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43129,
;       "size": 29,
;       "storedSize": 29,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 29,
;       "label": "NINA_FALL_RIGHT_8_F0_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43158,
;       "size": 24,
;       "storedSize": 24,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 30,
;       "label": "CAPCUADRAT1_RIGHT_9_F0_LAYER2",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43182,
;       "size": 21,
;       "storedSize": 21,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 31,
;       "label": "CAPCUADRAT1_RIGHT_9_F0_LAYER3",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43203,
;       "size": 29,
;       "storedSize": 29,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 32,
;       "label": "CAPCUADRAT1_RIGHT_9_F1_LAYER2",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43232,
;       "size": 21,
;       "storedSize": 21,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 33,
;       "label": "CAPCUADRAT1_RIGHT_9_F1_LAYER3",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43253,
;       "size": 28,
;       "storedSize": 28,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 34,
;       "label": "ANEC_LEFT_10_F0_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43281,
;       "size": 32,
;       "storedSize": 32,
;       "uncompressedSize": 32,
;       "flags": 0
;     },
;     {
;       "id": 35,
;       "label": "ANEC_LEFT_10_F0_LAYER2",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43313,
;       "size": 29,
;       "storedSize": 29,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 36,
;       "label": "ANEC_LEFT_10_F1_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43342,
;       "size": 32,
;       "storedSize": 32,
;       "uncompressedSize": 32,
;       "flags": 0
;     },
;     {
;       "id": 37,
;       "label": "ANEC_LEFT_10_F1_LAYER2",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43374,
;       "size": 29,
;       "storedSize": 29,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 38,
;       "label": "NINA_WALK_LEFT_11_F0_LAYER0",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43403,
;       "size": 28,
;       "storedSize": 28,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 39,
;       "label": "NINA_WALK_LEFT_11_F0_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43431,
;       "size": 25,
;       "storedSize": 25,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 40,
;       "label": "NINA_WALK_LEFT_11_F1_LAYER0",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43456,
;       "size": 30,
;       "storedSize": 30,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 41,
;       "label": "NINA_WALK_LEFT_11_F1_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43486,
;       "size": 30,
;       "storedSize": 30,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 42,
;       "label": "NINA_JUMP_LEFT_12_F0_LAYER0",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43516,
;       "size": 27,
;       "storedSize": 27,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 43,
;       "label": "NINA_JUMP_LEFT_12_F0_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43543,
;       "size": 24,
;       "storedSize": 24,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 44,
;       "label": "NINA_LAND_LEFT_13_F0_LAYER0",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43567,
;       "size": 29,
;       "storedSize": 29,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 45,
;       "label": "NINA_LAND_LEFT_13_F0_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43596,
;       "size": 24,
;       "storedSize": 24,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 46,
;       "label": "NINA_LAND_LEFT_13_F1_LAYER0",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43620,
;       "size": 28,
;       "storedSize": 28,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 47,
;       "label": "NINA_LAND_LEFT_13_F1_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43648,
;       "size": 28,
;       "storedSize": 28,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 48,
;       "label": "NINA_LAND_LEFT_13_F2_LAYER0",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43676,
;       "size": 29,
;       "storedSize": 29,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 49,
;       "label": "NINA_LAND_LEFT_13_F2_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43705,
;       "size": 27,
;       "storedSize": 27,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 50,
;       "label": "NINA_DEAD_LEFT_14_F0_LAYER0",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43732,
;       "size": 32,
;       "storedSize": 32,
;       "uncompressedSize": 32,
;       "flags": 0
;     },
;     {
;       "id": 51,
;       "label": "NINA_DEAD_LEFT_14_F0_LAYER2",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43764,
;       "size": 32,
;       "storedSize": 32,
;       "uncompressedSize": 32,
;       "flags": 0
;     },
;     {
;       "id": 52,
;       "label": "NINA_DEAD_LEFT_14_F1_LAYER0",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43796,
;       "size": 25,
;       "storedSize": 25,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 53,
;       "label": "NINA_DEAD_LEFT_14_F1_LAYER2",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43821,
;       "size": 32,
;       "storedSize": 32,
;       "uncompressedSize": 32,
;       "flags": 0
;     },
;     {
;       "id": 54,
;       "label": "NINA_IDLE_LEFT_15_F0_LAYER0",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43853,
;       "size": 30,
;       "storedSize": 30,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 55,
;       "label": "NINA_IDLE_LEFT_15_F0_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43883,
;       "size": 24,
;       "storedSize": 24,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 56,
;       "label": "NINA_IDLE_LEFT_15_F1_LAYER0",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43907,
;       "size": 30,
;       "storedSize": 30,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 57,
;       "label": "NINA_IDLE_LEFT_15_F1_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43937,
;       "size": 24,
;       "storedSize": 24,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 58,
;       "label": "NINA_FALL_LEFT_16_F0_LAYER0",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43961,
;       "size": 29,
;       "storedSize": 29,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 59,
;       "label": "NINA_FALL_LEFT_16_F0_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 43990,
;       "size": 24,
;       "storedSize": 24,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 60,
;       "label": "CAPCUADRAT1_LEFT_17_F0_LAYER2",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 44014,
;       "size": 20,
;       "storedSize": 20,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 61,
;       "label": "CAPCUADRAT1_LEFT_17_F0_LAYER3",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 44034,
;       "size": 29,
;       "storedSize": 29,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 62,
;       "label": "CAPCUADRAT1_LEFT_17_F1_LAYER2",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 44063,
;       "size": 20,
;       "storedSize": 20,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 63,
;       "label": "CAPCUADRAT1_LEFT_17_F1_LAYER3",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 44083,
;       "size": 26,
;       "storedSize": 26,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 64,
;       "label": "SPRITE_PLACEHOLDER_PATTERN",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 44109,
;       "size": 5,
;       "storedSize": 5,
;       "uncompressedSize": 32,
;       "flags": 1
;     },
;     {
;       "id": 65,
;       "label": "tile_pattern_bank0",
;       "group": "PATTERNS",
;       "type": "TILE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 41402,
;       "size": 125,
;       "storedSize": 125,
;       "uncompressedSize": 144,
;       "flags": 1
;     },
;     {
;       "id": 66,
;       "label": "tilebank_pattern_data_0",
;       "group": "PATTERNS",
;       "type": "TILE_PATTERNS",
;       "bank": 16,
;       "windowAddress": 41578,
;       "size": 119,
;       "storedSize": 119,
;       "uncompressedSize": 136,
;       "flags": 1
;     },
;     {
;       "id": 67,
;       "label": "tile_color_bank0",
;       "group": "COLORS",
;       "type": "TILE_COLORS",
;       "bank": 16,
;       "windowAddress": 41527,
;       "size": 51,
;       "storedSize": 51,
;       "uncompressedSize": 144,
;       "flags": 1
;     },
;     {
;       "id": 68,
;       "label": "tilebank_color_data_0",
;       "group": "COLORS",
;       "type": "TILE_COLORS",
;       "bank": 16,
;       "windowAddress": 41959,
;       "size": 48,
;       "storedSize": 48,
;       "uncompressedSize": 136,
;       "flags": 1
;     },
;     {
;       "id": 69,
;       "label": "SCREEN_PAN1_0_LAYOUT",
;       "group": "SCREENS",
;       "type": "SCREEN_LAYOUT",
;       "bank": 16,
;       "windowAddress": 40960,
;       "size": 136,
;       "storedSize": 136,
;       "uncompressedSize": 768,
;       "flags": 1
;     },
;     {
;       "id": 70,
;       "label": "SCREEN_PAN1_0_EFFECTS_LAYOUT",
;       "group": "SCREENS",
;       "type": "SCREEN_EFFECTS_LAYOUT",
;       "bank": 16,
;       "windowAddress": 41096,
;       "size": 6,
;       "storedSize": 6,
;       "uncompressedSize": 768,
;       "flags": 1
;     },
;     {
;       "id": 71,
;       "label": "SCREEN_PAN1_0_EFFECT_ZONE_TABLE",
;       "group": "SCREENS",
;       "type": "SCREEN_EFFECT_ZONE_TABLE",
;       "bank": 16,
;       "windowAddress": 41758,
;       "size": 1,
;       "storedSize": 1,
;       "uncompressedSize": 1,
;       "flags": 0
;     },
;     {
;       "id": 72,
;       "label": "SCREEN_PAN1_0_BOSS_TABLE",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 16,
;       "windowAddress": 41759,
;       "size": 1,
;       "storedSize": 1,
;       "uncompressedSize": 1,
;       "flags": 0
;     },
;     {
;       "id": 73,
;       "label": "BEHAVIOR_PAN1_0_DATA",
;       "group": "SCREENS",
;       "type": "SCREEN_BEHAVIOR_MAP",
;       "bank": 16,
;       "windowAddress": 41102,
;       "size": 69,
;       "storedSize": 69,
;       "uncompressedSize": 768,
;       "flags": 1
;     },
;     {
;       "id": 74,
;       "label": "SCREEN_PAN1_0_INTERACTION_TYPE_MAP",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 16,
;       "windowAddress": 41171,
;       "size": 15,
;       "storedSize": 15,
;       "uncompressedSize": 768,
;       "flags": 1
;     },
;     {
;       "id": 75,
;       "label": "SCREEN_PAN1_0_INTERACTION_VALUE_MAP",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 16,
;       "windowAddress": 41186,
;       "size": 60,
;       "storedSize": 60,
;       "uncompressedSize": 768,
;       "flags": 1
;     },
;     {
;       "id": 76,
;       "label": "SCREEN_PAN1_0_INTERACTION_TARGET_MAP",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 16,
;       "windowAddress": 41246,
;       "size": 6,
;       "storedSize": 6,
;       "uncompressedSize": 768,
;       "flags": 1
;     },
;     {
;       "id": 77,
;       "label": "SCREEN_PAN2_1_LAYOUT",
;       "group": "SCREENS",
;       "type": "SCREEN_LAYOUT",
;       "bank": 16,
;       "windowAddress": 41252,
;       "size": 87,
;       "storedSize": 87,
;       "uncompressedSize": 768,
;       "flags": 1
;     },
;     {
;       "id": 78,
;       "label": "SCREEN_PAN2_1_EFFECTS_LAYOUT",
;       "group": "SCREENS",
;       "type": "SCREEN_EFFECTS_LAYOUT",
;       "bank": 16,
;       "windowAddress": 41339,
;       "size": 6,
;       "storedSize": 6,
;       "uncompressedSize": 768,
;       "flags": 1
;     },
;     {
;       "id": 79,
;       "label": "SCREEN_PAN2_1_EFFECT_ZONE_TABLE",
;       "group": "SCREENS",
;       "type": "SCREEN_EFFECT_ZONE_TABLE",
;       "bank": 16,
;       "windowAddress": 41760,
;       "size": 1,
;       "storedSize": 1,
;       "uncompressedSize": 1,
;       "flags": 0
;     },
;     {
;       "id": 80,
;       "label": "SCREEN_PAN2_1_BOSS_TABLE",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 16,
;       "windowAddress": 41761,
;       "size": 1,
;       "storedSize": 1,
;       "uncompressedSize": 1,
;       "flags": 0
;     },
;     {
;       "id": 81,
;       "label": "BEHAVIOR_PAN2_1_DATA",
;       "group": "SCREENS",
;       "type": "SCREEN_BEHAVIOR_MAP",
;       "bank": 16,
;       "windowAddress": 41345,
;       "size": 42,
;       "storedSize": 42,
;       "uncompressedSize": 768,
;       "flags": 1
;     },
;     {
;       "id": 82,
;       "label": "SCREEN_PAN2_1_INTERACTION_TYPE_MAP",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 16,
;       "windowAddress": 41387,
;       "size": 15,
;       "storedSize": 15,
;       "uncompressedSize": 768,
;       "flags": 1
;     },
;     {
;       "id": 83,
;       "label": "SCREEN_PAN2_1_INTERACTION_VALUE_MAP",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 16,
;       "windowAddress": 41768,
;       "size": 40,
;       "storedSize": 40,
;       "uncompressedSize": 768,
;       "flags": 1
;     },
;     {
;       "id": 84,
;       "label": "SCREEN_PAN2_1_INTERACTION_TARGET_MAP",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 16,
;       "windowAddress": 41808,
;       "size": 6,
;       "storedSize": 6,
;       "uncompressedSize": 768,
;       "flags": 1
;     },
;     {
;       "id": 85,
;       "label": "SCREEN_BACKGROUND1_2_LAYOUT",
;       "group": "SCREENS",
;       "type": "SCREEN_LAYOUT",
;       "bank": 16,
;       "windowAddress": 41814,
;       "size": 6,
;       "storedSize": 6,
;       "uncompressedSize": 768,
;       "flags": 1
;     },
;     {
;       "id": 86,
;       "label": "SCREEN_BACKGROUND1_2_EFFECTS_LAYOUT",
;       "group": "SCREENS",
;       "type": "SCREEN_EFFECTS_LAYOUT",
;       "bank": 16,
;       "windowAddress": 41820,
;       "size": 6,
;       "storedSize": 6,
;       "uncompressedSize": 768,
;       "flags": 1
;     },
;     {
;       "id": 87,
;       "label": "SCREEN_BACKGROUND1_2_EFFECT_ZONE_TABLE",
;       "group": "SCREENS",
;       "type": "SCREEN_EFFECT_ZONE_TABLE",
;       "bank": 16,
;       "windowAddress": 41762,
;       "size": 1,
;       "storedSize": 1,
;       "uncompressedSize": 1,
;       "flags": 0
;     },
;     {
;       "id": 88,
;       "label": "SCREEN_BACKGROUND1_2_BOSS_TABLE",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 16,
;       "windowAddress": 41763,
;       "size": 1,
;       "storedSize": 1,
;       "uncompressedSize": 1,
;       "flags": 0
;     },
;     {
;       "id": 89,
;       "label": "BEHAVIOR_BACKGROUND1_2_DATA",
;       "group": "SCREENS",
;       "type": "SCREEN_BEHAVIOR_MAP",
;       "bank": 16,
;       "windowAddress": 41826,
;       "size": 6,
;       "storedSize": 6,
;       "uncompressedSize": 768,
;       "flags": 1
;     },
;     {
;       "id": 90,
;       "label": "SCREEN_BACKGROUND1_2_INTERACTION_TYPE_MAP",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 16,
;       "windowAddress": 41832,
;       "size": 6,
;       "storedSize": 6,
;       "uncompressedSize": 768,
;       "flags": 1
;     },
;     {
;       "id": 91,
;       "label": "SCREEN_BACKGROUND1_2_INTERACTION_VALUE_MAP",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 16,
;       "windowAddress": 41838,
;       "size": 6,
;       "storedSize": 6,
;       "uncompressedSize": 768,
;       "flags": 1
;     },
;     {
;       "id": 92,
;       "label": "SCREEN_BACKGROUND1_2_INTERACTION_TARGET_MAP",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 16,
;       "windowAddress": 41844,
;       "size": 6,
;       "storedSize": 6,
;       "uncompressedSize": 768,
;       "flags": 1
;     },
;     {
;       "id": 93,
;       "label": "SCREEN_PAN3_3_LAYOUT",
;       "group": "SCREENS",
;       "type": "SCREEN_LAYOUT",
;       "bank": 16,
;       "windowAddress": 41850,
;       "size": 103,
;       "storedSize": 103,
;       "uncompressedSize": 768,
;       "flags": 1
;     },
;     {
;       "id": 94,
;       "label": "SCREEN_PAN3_3_EFFECTS_LAYOUT",
;       "group": "SCREENS",
;       "type": "SCREEN_EFFECTS_LAYOUT",
;       "bank": 16,
;       "windowAddress": 41953,
;       "size": 6,
;       "storedSize": 6,
;       "uncompressedSize": 768,
;       "flags": 1
;     },
;     {
;       "id": 95,
;       "label": "SCREEN_PAN3_3_EFFECT_ZONE_TABLE",
;       "group": "SCREENS",
;       "type": "SCREEN_EFFECT_ZONE_TABLE",
;       "bank": 16,
;       "windowAddress": 41764,
;       "size": 1,
;       "storedSize": 1,
;       "uncompressedSize": 1,
;       "flags": 0
;     },
;     {
;       "id": 96,
;       "label": "SCREEN_PAN3_3_BOSS_TABLE",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 16,
;       "windowAddress": 41765,
;       "size": 1,
;       "storedSize": 1,
;       "uncompressedSize": 1,
;       "flags": 0
;     },
;     {
;       "id": 97,
;       "label": "BEHAVIOR_PAN3_3_DATA",
;       "group": "SCREENS",
;       "type": "SCREEN_BEHAVIOR_MAP",
;       "bank": 16,
;       "windowAddress": 42293,
;       "size": 60,
;       "storedSize": 60,
;       "uncompressedSize": 768,
;       "flags": 1
;     },
;     {
;       "id": 98,
;       "label": "SCREEN_PAN3_3_INTERACTION_TYPE_MAP",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 16,
;       "windowAddress": 42353,
;       "size": 24,
;       "storedSize": 24,
;       "uncompressedSize": 768,
;       "flags": 1
;     },
;     {
;       "id": 99,
;       "label": "SCREEN_PAN3_3_INTERACTION_VALUE_MAP",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 16,
;       "windowAddress": 42377,
;       "size": 58,
;       "storedSize": 58,
;       "uncompressedSize": 768,
;       "flags": 1
;     },
;     {
;       "id": 100,
;       "label": "SCREEN_PAN3_3_INTERACTION_TARGET_MAP",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 16,
;       "windowAddress": 42435,
;       "size": 6,
;       "storedSize": 6,
;       "uncompressedSize": 768,
;       "flags": 1
;     },
;     {
;       "id": 101,
;       "label": "SCREEN_PAN4_4_LAYOUT",
;       "group": "SCREENS",
;       "type": "SCREEN_LAYOUT",
;       "bank": 16,
;       "windowAddress": 42441,
;       "size": 109,
;       "storedSize": 109,
;       "uncompressedSize": 768,
;       "flags": 1
;     },
;     {
;       "id": 102,
;       "label": "SCREEN_PAN4_4_EFFECTS_LAYOUT",
;       "group": "SCREENS",
;       "type": "SCREEN_EFFECTS_LAYOUT",
;       "bank": 16,
;       "windowAddress": 42550,
;       "size": 6,
;       "storedSize": 6,
;       "uncompressedSize": 768,
;       "flags": 1
;     },
;     {
;       "id": 103,
;       "label": "SCREEN_PAN4_4_EFFECT_ZONE_TABLE",
;       "group": "SCREENS",
;       "type": "SCREEN_EFFECT_ZONE_TABLE",
;       "bank": 16,
;       "windowAddress": 41766,
;       "size": 1,
;       "storedSize": 1,
;       "uncompressedSize": 1,
;       "flags": 0
;     },
;     {
;       "id": 104,
;       "label": "SCREEN_PAN4_4_BOSS_TABLE",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 16,
;       "windowAddress": 41767,
;       "size": 1,
;       "storedSize": 1,
;       "uncompressedSize": 1,
;       "flags": 0
;     },
;     {
;       "id": 105,
;       "label": "BEHAVIOR_PAN4_4_DATA",
;       "group": "SCREENS",
;       "type": "SCREEN_BEHAVIOR_MAP",
;       "bank": 16,
;       "windowAddress": 42556,
;       "size": 64,
;       "storedSize": 64,
;       "uncompressedSize": 768,
;       "flags": 1
;     },
;     {
;       "id": 106,
;       "label": "SCREEN_PAN4_4_INTERACTION_TYPE_MAP",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 16,
;       "windowAddress": 42620,
;       "size": 21,
;       "storedSize": 21,
;       "uncompressedSize": 768,
;       "flags": 1
;     },
;     {
;       "id": 107,
;       "label": "SCREEN_PAN4_4_INTERACTION_VALUE_MAP",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 16,
;       "windowAddress": 42641,
;       "size": 64,
;       "storedSize": 64,
;       "uncompressedSize": 768,
;       "flags": 1
;     },
;     {
;       "id": 108,
;       "label": "SCREEN_PAN4_4_INTERACTION_TARGET_MAP",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 16,
;       "windowAddress": 42705,
;       "size": 6,
;       "storedSize": 6,
;       "uncompressedSize": 768,
;       "flags": 1
;     }
;   ]
; }
;
; [[[MIDEAS_ARTIFACT:project_usage.json:END]]]

; [[[MIDEAS_ARTIFACT:resource_manager.asm:BEGIN]]]
; ; ==================================================================
; ; RESOURCE MANAGER
; ; File: resource_manager.asm
; ; Description: Centralized banked resource lookup and copy helpers
; ; Descriptor format: db bank / dw address / dw stored_size / dw raw_size / db flags
; ; Resource id is the zero-based descriptor index.
; ; ==================================================================
;
; resource_manager_init:
;     xor a
;     ld (resource_descriptor_bank), a
;     ld (resource_descriptor_ptr), a
;     ld (resource_descriptor_ptr + 1), a
;     ld (resource_descriptor_addr), a
;     ld (resource_descriptor_addr + 1), a
;     ld (resource_descriptor_size), a
;     ld (resource_descriptor_size + 1), a
;     ld (resource_descriptor_uncompressed_size), a
;     ld (resource_descriptor_uncompressed_size + 1), a
;     ld (resource_descriptor_flags), a
;     ld (vram_cache_tile_patterns_ready), a
;     ld (vram_cache_tile_colors_ready), a
;     ld (vram_cache_font_ready), a
;     ld a, #FF
;     ld (resource_descriptor_id), a
;     ld (resource_ram_cache_screen_layout_id), a
;     ld (resource_ram_cache_effects_layout_id), a
;     ld (resource_ram_cache_effect_zone_table_id), a
;     ld (current_screen2_tilebank_id), a
;     ret
;
; ; ------------------------------------------------------------------
; ; resource_invalidate_pattern_vram_cache
; ; Outputs:
; ;   none
; ; Clobbers:
; ;   AF
; ; ------------------------------------------------------------------
; resource_invalidate_pattern_vram_cache:
;     xor a
;     ld (vram_cache_tile_patterns_ready), a
;     ret
;
; ; ------------------------------------------------------------------
; ; resource_invalidate_color_vram_cache
; ; Outputs:
; ;   none
; ; Clobbers:
; ;   AF
; ; ------------------------------------------------------------------
; resource_invalidate_color_vram_cache:
;     xor a
;     ld (vram_cache_tile_colors_ready), a
;     ret
;
; ; ------------------------------------------------------------------
; ; resource_invalidate_font_vram_cache
; ; Outputs:
; ;   none
; ; Clobbers:
; ;   AF
; ; ------------------------------------------------------------------
; resource_invalidate_font_vram_cache:
;     xor a
;     ld (vram_cache_font_ready), a
;     ret
;
; ; ------------------------------------------------------------------
; ; resource_invalidate_gameplay_vram_cache
; ; Outputs:
; ;   none
; ; Clobbers:
; ;   AF
; ; Notes:
; ;   Use this when a fullscreen effect or presentation screen overwrites
; ;   shared gameplay/font VRAM tables outside the normal loaders.
; ; ------------------------------------------------------------------
; resource_invalidate_gameplay_vram_cache:
;     call resource_invalidate_pattern_vram_cache
;     call resource_invalidate_color_vram_cache
;     call resource_invalidate_font_vram_cache
;     ld a, #FF
;     ld (current_screen2_tilebank_id), a
;     ret
;
; ; ------------------------------------------------------------------
; ; resource_invalidate_screen_ram_cache
; ; Outputs:
; ;   none
; ; Clobbers:
; ;   AF
; ; Notes:
; ;   Invalidates the clean RAM copies used to rebuild runtime screen data
; ;   without re-reading the same banked resource on repeated screen loads.
; ; ------------------------------------------------------------------
; resource_invalidate_screen_ram_cache:
;     ld a, #FF
;     ld (resource_ram_cache_screen_layout_id), a
;     ld (resource_ram_cache_effects_layout_id), a
;     ld (resource_ram_cache_effect_zone_table_id), a
;     ret
;
; ; ------------------------------------------------------------------
; ; resource_find_by_id
; ; Inputs:
; ;   A = resource id
; ; Outputs on success (carry clear):
; ;   HL = pointer to descriptor entry
; ;   A  = bank number
; ;   DE = visible window address
; ;   BC = stored size in bytes
; ; Outputs on failure (carry set):
; ;   HL = resource_table
; ; Clobbers:
; ;   AF, BC, DE, HL
; ; Notes:
; ;   Mirrors the descriptor into RAM so callers can inspect fields later
; ;   without re-scanning the table.
; ; ------------------------------------------------------------------
; resource_find_by_id:
;     ld c, a
;     ld a, (resource_descriptor_id)
;     cp c
;     jr nz, .resource_find_lookup
;     ld a, (resource_descriptor_bank)
;     ld de, (resource_descriptor_addr)
;     ld bc, (resource_descriptor_size)
;     or a
;     ret
; .resource_find_lookup:
;     ld a, c
;     cp RESOURCE_TABLE_COUNT
;     jp nc, .resource_find_not_found
;     ld l, a
;     ld h, 0
;     add hl, hl
;     add hl, hl
;     add hl, hl
;     ld de, resource_table
;     add hl, de
;     ld a, c
;     ld (resource_descriptor_id), a
;     ld (resource_descriptor_ptr), hl
;     push hl
;     ld a, (hl)
;     ld (resource_descriptor_bank), a
;     inc hl
;     ld e, (hl)
;     inc hl
;     ld d, (hl)
;     ld (resource_descriptor_addr), de
;     inc hl
;     ld c, (hl)
;     inc hl
;     ld b, (hl)
;     ld (resource_descriptor_size), bc
;     inc hl
;     ld e, (hl)
;     inc hl
;     ld d, (hl)
;     ld (resource_descriptor_uncompressed_size), de
;     inc hl
;     ld a, (hl)
;     ld (resource_descriptor_flags), a
;     ld de, (resource_descriptor_addr)
;     ld bc, (resource_descriptor_size)
;     pop hl
;     ld a, (resource_descriptor_bank)
;     or a
;     ret
;
; .resource_find_not_found:
;     xor a
;     ld (resource_descriptor_bank), a
;     ld (resource_descriptor_ptr), a
;     ld (resource_descriptor_ptr + 1), a
;     ld (resource_descriptor_addr), a
;     ld (resource_descriptor_addr + 1), a
;     ld (resource_descriptor_size), a
;     ld (resource_descriptor_size + 1), a
;     ld (resource_descriptor_uncompressed_size), a
;     ld (resource_descriptor_uncompressed_size + 1), a
;     ld (resource_descriptor_flags), a
;     ld a, #FF
;     ld (resource_descriptor_id), a
;     scf
;     ret
;
; ; ------------------------------------------------------------------
; ; resource_copy_from_bank_to_ram
; ; Inputs:
; ;   A  = bank number
; ;   HL = source visible in mapper data window
; ;   DE = destination in RAM
; ;   BC = size in bytes
; ; Outputs:
; ;   carry clear
; ; Clobbers:
; ;   AF, BC, DE, HL
; ; ------------------------------------------------------------------
; resource_copy_from_bank_to_ram:
;     push af
;     ld a, b
;     or c
;     jr nz, .resource_copy_ram_has_size
;     pop af
;     or a
;     ret
; .resource_copy_ram_has_size:
;     pop af
;     di
;     push af
;     call mapper_push_p3
;     pop af
;     call mapper_set_bank_p3
;     ldir
;     call mapper_pop_p3
;     ld a, (interrupt_in_progress)
;     or a
;     jp nz, .resource_copy_ram_irq_done
;     ei
; .resource_copy_ram_irq_done:
;     or a
;     ret
;
; ; ------------------------------------------------------------------
; ; resource_decompress_from_bank_to_ram
; ; Inputs:
; ;   A  = bank number
; ;   HL = ZX0 source visible in mapper data window
; ;   DE = destination in RAM
; ; Outputs:
; ;   carry clear
; ; Clobbers:
; ;   AF, BC, DE, HL
; ; ------------------------------------------------------------------
; resource_decompress_from_bank_to_ram:
;     di
;     push af
;     call mapper_push_p3
;     pop af
;     call mapper_set_bank_p3
;     call dzx0_standard
;     call mapper_pop_p3
;     ld a, (interrupt_in_progress)
;     or a
;     jp nz, .resource_decompress_ram_irq_done
;     ei
; .resource_decompress_ram_irq_done:
;     or a
;     ret
;
; ; ------------------------------------------------------------------
; ; resource_copy_from_bank_to_vram
; ; Inputs:
; ;   A  = bank number
; ;   HL = source visible in mapper data window
; ;   DE = destination in VRAM
; ;   BC = size in bytes
; ; Outputs:
; ;   carry clear
; ; Clobbers:
; ;   AF, BC, DE, HL
; ; ------------------------------------------------------------------
; resource_copy_from_bank_to_vram:
;     push af
;     ld a, b
;     or c
;     jr nz, .resource_copy_vram_has_size
;     pop af
;     or a
;     ret
; .resource_copy_vram_has_size:
;     pop af
;     di
;     push af
;     call mapper_push_p3
;     pop af
;     call mapper_set_bank_p3
;     ; Banked VRAM copy keeps IRQs masked until P2 is restored.
;     ; FAST_LDIRVM re-enables IRQs internally, so inline the same port loop here.
;     ; Restore IRQs only if they were enabled on entry.
;     ld a, e
;     out (#99), a
;     nop
;     ld a, d
;     or #40
;     out (#99), a
;     nop
; .resource_copy_vram_loop:
;     ld a, (hl)
;     out (#98), a
;     inc hl
;     dec bc
;     ld a, b
;     or c
;     jr nz, .resource_copy_vram_loop
;     call mapper_pop_p3
;     ld a, (interrupt_in_progress)
;     or a
;     jp nz, .resource_copy_vram_irq_done
;     ei
; .resource_copy_vram_irq_done:
;     or a
;     ret
;
; ; ------------------------------------------------------------------
; ; resource_decompress_from_bank_to_vram
; ; Inputs:
; ;   A  = bank number
; ;   HL = ZX0 source visible in mapper data window
; ;   DE = destination in VRAM
; ;   BC = uncompressed size in bytes
; ; Outputs:
; ;   carry clear
; ; Clobbers:
; ;   AF, BC, DE, HL
; ; Notes:
; ;   Uses fast RAM staging when the uncompressed output fits the shared scratch
; ;   buffer. Larger resources fall back to direct-to-VRAM ZX0 decode.
; ; ------------------------------------------------------------------
; resource_decompress_from_bank_to_vram:
;     push af
;     ld a, b
;     or c
;     jp nz, .resource_decompress_vram_has_size
;     pop af
;     or a
;     ret
; .resource_decompress_vram_has_size:
;     ld a, b
;     cp ZX0_VRAM_TRANSFER_BUFFER_LIMIT_HIGH
;     jp c, .resource_decompress_vram_staged
;     jp nz, .resource_decompress_vram_direct
;     ld a, c
;     cp ZX0_VRAM_TRANSFER_BUFFER_LIMIT_NEXT_LOW
;     jp c, .resource_decompress_vram_staged
; .resource_decompress_vram_direct:
;     pop af
;     di
;     push af
;     call mapper_push_p3
;     pop af
;     call mapper_set_bank_p3
;     call resource_dzx0_to_vram
;     call mapper_pop_p3
;     ld a, (interrupt_in_progress)
;     or a
;     jp nz, .resource_decompress_vram_irq_done
;     ei
; .resource_decompress_vram_irq_done:
;     or a
;     ret
; .resource_decompress_vram_staged:
;     pop af
;     push de
;     push bc
;     ld de, ZX0_VRAM_TRANSFER_BUFFER
;     call resource_decompress_from_bank_to_ram
;     pop bc
;     pop de
;     ld hl, ZX0_VRAM_TRANSFER_BUFFER
;     jp FAST_LDIRVM
;
; ; ------------------------------------------------------------------
; ; resource_dzx0_to_vram
; ; Inputs:
; ;   HL = ZX0 source visible in mapper data window
; ;   DE = destination in VRAM
; ; Outputs:
; ;   DE advanced past decompressed stream
; ; Clobbers:
; ;   AF, BC, DE, HL
; ; Notes:
; ;   Adapted from the standard ZX0 decoder structure. Literal bytes are read
; ;   from mapper-visible ROM and written to VRAM; match bytes are read from
; ;   already decompressed VRAM and written to the current VRAM destination.
; ;   IRQs and mapper bank lifetime are managed by the caller.
; ; ------------------------------------------------------------------
; resource_dzx0_to_vram:
;     ld bc, #FFFF
;     push bc
;     inc bc
;     ld a, #80
; .resource_dzx0_vram_literals:
;     call .resource_dzx0_vram_elias
;     push af
; .resource_dzx0_vram_literal_loop:
;     ld a, e
;     out (#99), a
;     nop
;     ld a, d
;     or #40
;     out (#99), a
;     nop
;     ld a, (hl)
;     out (#98), a
;     inc hl
;     inc de
;     dec bc
;     ld a, b
;     or c
;     jp nz, .resource_dzx0_vram_literal_loop
;     pop af
;     add a, a
;     jp c, .resource_dzx0_vram_new_offset
;     call .resource_dzx0_vram_elias
; .resource_dzx0_vram_copy:
;     ex (sp), hl
;     push hl
;     add hl, de
;     push af
; .resource_dzx0_vram_copy_loop:
;     push bc
;     ld a, l
;     out (#99), a
;     nop
;     ld a, h
;     and #3F
;     out (#99), a
;     nop
;     nop
;     in a, (#98)
;     ld b, a
;     ld a, e
;     out (#99), a
;     nop
;     ld a, d
;     or #40
;     out (#99), a
;     nop
;     ld a, b
;     out (#98), a
;     pop bc
;     inc hl
;     inc de
;     dec bc
;     ld a, b
;     or c
;     jp nz, .resource_dzx0_vram_copy_loop
;     pop af
;     pop hl
;     ex (sp), hl
;     add a, a
;     jp nc, .resource_dzx0_vram_literals
; .resource_dzx0_vram_new_offset:
;     pop bc
;     ld c, #FE
;     call .resource_dzx0_vram_elias_loop
;     inc c
;     ret z
;     ld b, c
;     ld c, (hl)
;     inc hl
;     rr b
;     rr c
;     push bc
;     ld bc, 1
;     call nc, .resource_dzx0_vram_elias_backtrack
;     inc bc
;     jp .resource_dzx0_vram_copy
; .resource_dzx0_vram_elias:
;     inc c
; .resource_dzx0_vram_elias_loop:
;     add a, a
;     jp nz, .resource_dzx0_vram_elias_skip
;     ld a, (hl)
;     inc hl
;     rla
; .resource_dzx0_vram_elias_skip:
;     ret c
; .resource_dzx0_vram_elias_backtrack:
;     add a, a
;     rl c
;     rl b
;     jp .resource_dzx0_vram_elias_loop
;
; ; ------------------------------------------------------------------
; ; resource_load_to_ram_by_id
; ; Inputs:
; ;   A  = resource id
; ;   DE = destination in RAM
; ; Outputs:
; ;   carry clear on success
; ;   carry set if resource id is missing
; ; Clobbers:
; ;   AF, BC, DE, HL
; ; ------------------------------------------------------------------
; resource_load_to_ram_by_id:
;     push de
;     call resource_find_by_id
;     jp c, .resource_load_to_ram_fail
;     push de
;     pop hl
;     pop de
;     ld a, (resource_descriptor_flags)
;     and RESOURCE_FLAG_COMPRESSED_ZX0
;     jr z, .resource_load_to_ram_raw
;     ld a, (resource_descriptor_bank)
;     jp resource_decompress_from_bank_to_ram
; .resource_load_to_ram_raw:
;     ld a, (resource_descriptor_bank)
;     jp resource_copy_from_bank_to_ram
;
; .resource_load_to_ram_fail:
;     pop de
;     ret
;
; ; ------------------------------------------------------------------
; ; resource_load_to_vram_by_id
; ; Inputs:
; ;   A  = resource id
; ;   DE = destination in VRAM
; ; Outputs:
; ;   carry clear on success
; ;   carry set if resource id is missing
; ; Clobbers:
; ;   AF, BC, DE, HL
; ; ------------------------------------------------------------------
; resource_load_to_vram_by_id:
;     push de
;     call resource_find_by_id
;     jp c, .resource_load_to_vram_fail
;     ld a, (resource_descriptor_flags)
;     and RESOURCE_FLAG_COMPRESSED_ZX0
;     jp nz, .resource_load_to_vram_compressed
;     push de
;     pop hl
;     pop de
;     ld a, (resource_descriptor_bank)
;     jp resource_copy_from_bank_to_vram
;
; .resource_load_to_vram_compressed:
;     push de
;     pop hl
;     ld bc, (resource_descriptor_uncompressed_size)
;     pop de
;     ld a, (resource_descriptor_bank)
;     jp resource_decompress_from_bank_to_vram
;
; .resource_load_to_vram_fail:
;     pop de
;     ret
;
; ; ------------------------------------------------------------------
; ; resource_load_screen_layout_cached
; ; Inputs:
; ;   A = screen layout resource id
; ; Outputs:
; ;   carry clear on success
; ;   carry set if resource id is missing
; ; Notes:
; ;   Keeps the immutable layout in runtime_background_layout and rebuilds
; ;   runtime_screen_layout from that clean RAM copy on every screen load.
; ; Clobbers:
; ;   AF, BC, DE, HL
; ; ------------------------------------------------------------------
; resource_load_screen_layout_cached:
;     ld c, a
;     ld a, (resource_ram_cache_screen_layout_id)
;     cp c
;     jr z, .resource_layout_cache_hit
;     push bc
;     ld a, c
;     ld de, runtime_background_layout
;     call resource_load_to_ram_by_id
;     pop bc
;     ret c
;     ld a, c
;     ld (resource_ram_cache_screen_layout_id), a
; .resource_layout_cache_hit:
;     ld hl, runtime_background_layout
;     ld de, runtime_screen_layout
;     ld bc, RUNTIME_SCREEN_MAP_SIZE
;     ldir
;     xor a
;     ret
;
; ; ------------------------------------------------------------------
; ; resource_load_effects_layout_cached
; ; Inputs:
; ;   A = effects layout resource id
; ; Outputs:
; ;   carry clear on success
; ;   carry set if resource id is missing
; ; Notes:
; ;   Keeps the immutable effects layer in runtime_effects_layout.
; ; Clobbers:
; ;   AF, BC, DE, HL
; ; ------------------------------------------------------------------
; resource_load_effects_layout_cached:
;     ld c, a
;     ld a, (resource_ram_cache_effects_layout_id)
;     cp c
;     jr z, .resource_effects_cache_hit
;     push bc
;     ld a, c
;     ld de, runtime_effects_layout
;     call resource_load_to_ram_by_id
;     pop bc
;     ret c
;     ld a, c
;     ld (resource_ram_cache_effects_layout_id), a
; .resource_effects_cache_hit:
;     xor a
;     ret
;
; ; ------------------------------------------------------------------
; ; resource_load_behavior_map_cached
; ; Inputs:
; ;   A = behavior map resource id
; ; Outputs:
; ;   carry clear on success
; ;   carry set if resource id is missing
; ; Notes:
; ;   Reloads the mutable runtime_behavior_map directly from the banked
; ;   resource. This avoids a second resident 32x24 behavior-map copy in RAM.
; ; Clobbers:
; ;   AF, BC, DE, HL
; ; ------------------------------------------------------------------
; resource_load_behavior_map_cached:
;     ld de, runtime_behavior_map
;     call resource_load_to_ram_by_id
;     ret
;
; ; ------------------------------------------------------------------
; ; resource_load_effect_zone_table_cached
; ; Inputs:
; ;   A = effect zone table resource id
; ; Outputs:
; ;   carry clear on success
; ;   carry set if resource id is missing
; ; Notes:
; ;   Keeps the current screen's immutable effect zone table resident in RAM.
; ; Clobbers:
; ;   AF, BC, DE, HL
; ; ------------------------------------------------------------------
; resource_load_effect_zone_table_cached:
;     ld c, a
;     ld a, (resource_ram_cache_effect_zone_table_id)
;     cp c
;     jr z, .resource_effect_zone_cache_hit
;     push bc
;     ld a, c
;     ld de, runtime_effect_zone_table
;     call resource_load_to_ram_by_id
;     pop bc
;     ret c
;     ld a, c
;     ld (resource_ram_cache_effect_zone_table_id), a
; .resource_effect_zone_cache_hit:
;     xor a
;     ret
;
; ; ------------------------------------------------------------------
; ; resource_read_byte_from_bank
; ; Inputs:
; ;   A  = bank number
; ;   HL = source visible in mapper data window
; ; Outputs:
; ;   A = byte read
; ; Clobbers:
; ;   AF, BC, HL
; ; Preserves:
; ;   DE
; ; ------------------------------------------------------------------
; resource_read_byte_from_bank:
;     ld b, a
;     ld a, b
;     push af
;     call mapper_push_p3
;     pop af
;     call mapper_set_bank_p3
;     ld a, (hl)
;     ld b, a
;     call mapper_pop_p3
;     ld a, b
;     ret
;
; [[[MIDEAS_ARTIFACT:resource_manager.asm:END]]]

; [[[MIDEAS_ARTIFACT:world_music_policy.txt:BEGIN]]]
; WORLD MUSIC POLICY
; Source: inferred from Game Flow paths reaching each WorldLink.
; Mode preserve: multiple different music states can reach the same world.
;
; WORLD 00 New Worldmap (worldmap_1770754170935)
; - policy: stop
; [[[MIDEAS_ARTIFACT:world_music_policy.txt:END]]]

; [[[MIDEAS_ARTIFACT:world_sprite_pattern_policy.txt:BEGIN]]]
; WORLD SPRITE PATTERN POLICY
; Source: runtime sprite packs inferred from entities present in each world.
; Pack capacity: 64 slots (including placeholder).
;
; PACKS
; PACK 00 worldmap_1770754170935
; - display: World "New Worldmap"
; - slots: 63/64
; - placeholder_slot: 62
; - sprites:
;   0: anec_right @ slot 0
;   1: bola @ slot 4
;   3: nina_walk_right @ slot 6
;   4: nina_jump_right @ slot 10
;   5: nina_land_right @ slot 12
;   6: nina_dead_right @ slot 18
;   7: nina_idle_right @ slot 22
;   8: nina_fall_right @ slot 26
;   9: capcuadrat1_right @ slot 28
;   10: anec_left @ slot 32
;   11: nina_walk_left @ slot 36
;   12: nina_jump_left @ slot 40
;   13: nina_land_left @ slot 42
;   14: nina_dead_left @ slot 48
;   15: nina_idle_left @ slot 52
;   16: nina_fall_left @ slot 56
;   17: capcuadrat1_left @ slot 58
;
; WORLD -> PACK
; 00 New Worldmap (worldmap_1770754170935) -> worldmap_1770754170935 [id=0]
; [[[MIDEAS_ARTIFACT:world_sprite_pattern_policy.txt:END]]]

; [[[MIDEAS_ARTIFACT:screen_resource_policy.txt:BEGIN]]]
; SCREEN RESOURCE POLICY
; Logical view of resources consumed by screen/world loading paths.
;
; COMMON RESOURCES
; - patterns: RESOURCE_ID_TILE_PATTERN_BANK0 -> load_pattern_bank0/load_pattern_bank1/load_pattern_bank2
; - colors: RESOURCE_ID_TILE_COLOR_BANK0 -> load_color_bank0/load_color_bank1/load_color_bank2
; - font patterns: RESOURCE_ID_FONT_PATTERN_DATA
; - font colors: RESOURCE_ID_FONT_COLOR_DATA
; - presentation: none
; - tilebank loaders:
;   tilebank_1770753778086: load_tilebank_tilebank_1770753778086_patterns_to_vram / load_tilebank_tilebank_1770753778086_colors_to_vram
;
; SCREEN 00 pan1 (screenmap_1770754008863)
; - worlds: worldmap_1770754170935
; - tile_bank: tilebank_1770753778086
; - sprite_pattern_slots: 53
; - music_in_game: 0
; - layout: RESOURCE_ID_SCREEN_PAN1_0_LAYOUT
; - effects_layout: RESOURCE_ID_SCREEN_PAN1_0_EFFECTS_LAYOUT
; - effect_zone_table: RESOURCE_ID_SCREEN_PAN1_0_EFFECT_ZONE_TABLE
; - interaction_type_map: RESOURCE_ID_SCREEN_PAN1_0_INTERACTION_TYPE_MAP
; - interaction_value_map: RESOURCE_ID_SCREEN_PAN1_0_INTERACTION_VALUE_MAP
; - interaction_target_map: RESOURCE_ID_SCREEN_PAN1_0_INTERACTION_TARGET_MAP
; - behavior: RESOURCE_ID_BEHAVIOR_PAN1_0_DATA
;
; SCREEN 01 pan2 (screenmap_1771184738851)
; - worlds: worldmap_1770754170935
; - tile_bank: tilebank_1770753778086
; - sprite_pattern_slots: 1
; - music_in_game: 0
; - layout: RESOURCE_ID_SCREEN_PAN2_1_LAYOUT
; - effects_layout: RESOURCE_ID_SCREEN_PAN2_1_EFFECTS_LAYOUT
; - effect_zone_table: RESOURCE_ID_SCREEN_PAN2_1_EFFECT_ZONE_TABLE
; - interaction_type_map: RESOURCE_ID_SCREEN_PAN2_1_INTERACTION_TYPE_MAP
; - interaction_value_map: RESOURCE_ID_SCREEN_PAN2_1_INTERACTION_VALUE_MAP
; - interaction_target_map: RESOURCE_ID_SCREEN_PAN2_1_INTERACTION_TARGET_MAP
; - behavior: RESOURCE_ID_BEHAVIOR_PAN2_1_DATA
;
; SCREEN 02 background1 (screenmap_1771482721894)
; - worlds: none
; - tile_bank: tilebank_1770753778086
; - sprite_pattern_slots: 1
; - music_in_game: 0
; - layout: RESOURCE_ID_SCREEN_BACKGROUND1_2_LAYOUT
; - effects_layout: RESOURCE_ID_SCREEN_BACKGROUND1_2_EFFECTS_LAYOUT
; - effect_zone_table: RESOURCE_ID_SCREEN_BACKGROUND1_2_EFFECT_ZONE_TABLE
; - interaction_type_map: RESOURCE_ID_SCREEN_BACKGROUND1_2_INTERACTION_TYPE_MAP
; - interaction_value_map: RESOURCE_ID_SCREEN_BACKGROUND1_2_INTERACTION_VALUE_MAP
; - interaction_target_map: RESOURCE_ID_SCREEN_BACKGROUND1_2_INTERACTION_TARGET_MAP
; - behavior: RESOURCE_ID_BEHAVIOR_BACKGROUND1_2_DATA
;
; SCREEN 03 pan3 (screenmap_1771880109228)
; - worlds: worldmap_1770754170935
; - tile_bank: tilebank_1770753778086
; - sprite_pattern_slots: 11
; - music_in_game: 0
; - layout: RESOURCE_ID_SCREEN_PAN3_3_LAYOUT
; - effects_layout: RESOURCE_ID_SCREEN_PAN3_3_EFFECTS_LAYOUT
; - effect_zone_table: RESOURCE_ID_SCREEN_PAN3_3_EFFECT_ZONE_TABLE
; - interaction_type_map: RESOURCE_ID_SCREEN_PAN3_3_INTERACTION_TYPE_MAP
; - interaction_value_map: RESOURCE_ID_SCREEN_PAN3_3_INTERACTION_VALUE_MAP
; - interaction_target_map: RESOURCE_ID_SCREEN_PAN3_3_INTERACTION_TARGET_MAP
; - behavior: RESOURCE_ID_BEHAVIOR_PAN3_3_DATA
;
; SCREEN 04 pan4 (screenmap_1772291683578)
; - worlds: worldmap_1770754170935
; - tile_bank: tilebank_1770753778086
; - sprite_pattern_slots: 1
; - music_in_game: 0
; - layout: RESOURCE_ID_SCREEN_PAN4_4_LAYOUT
; - effects_layout: RESOURCE_ID_SCREEN_PAN4_4_EFFECTS_LAYOUT
; - effect_zone_table: RESOURCE_ID_SCREEN_PAN4_4_EFFECT_ZONE_TABLE
; - interaction_type_map: RESOURCE_ID_SCREEN_PAN4_4_INTERACTION_TYPE_MAP
; - interaction_value_map: RESOURCE_ID_SCREEN_PAN4_4_INTERACTION_VALUE_MAP
; - interaction_target_map: RESOURCE_ID_SCREEN_PAN4_4_INTERACTION_TARGET_MAP
; - behavior: RESOURCE_ID_BEHAVIOR_PAN4_4_DATA
; [[[MIDEAS_ARTIFACT:screen_resource_policy.txt:END]]]

; [[[MIDEAS_ARTIFACT:unused_report.txt:BEGIN]]]
; MIDEAS UNUSED MODULE REPORT
; Scope: konami8k_megarom_resident_modules
; Candidate unused modules: 2
; Estimated removable bytes: 8019
;
; Candidates:
; - bosses: 5666 estimated bytes
; - scroll: 2353 estimated bytes
;
; Retained modules:
; - animtiles: 4223 estimated bytes
; - colors_code: 846 estimated bytes
; - components: 52556 estimated bytes
; - entities: 9445 estimated bytes
; - font: 3576 estimated bytes
; - gameflow: 5666 estimated bytes
; - hud: 3640 estimated bytes
; - patterns_code: 894 estimated bytes
; - screens_code: 14687 estimated bytes
; - sound: 4418 estimated bytes
; - sprites: 8343 estimated bytes
; - statemachine: 15042 estimated bytes
; - worlds: 4765 estimated bytes
;
; Note: report-only; module removal is a later pipeline step.
;
; [[[MIDEAS_ARTIFACT:unused_report.txt:END]]]

; [[[MIDEAS_ARTIFACT:segment_budget.json:BEGIN]]]
; {
;   "version": 1,
;   "scope": "konami8k_segment_budget",
;   "segmentSize": 8192,
;   "codeBanks": [
;     {
;       "bank": 1,
;       "role": "resident_code",
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "usedBytes": 52556,
;       "freeBytes": 0,
;       "overBudget": true,
;       "modules": [
;         {
;           "key": "components",
;           "estimatedBytes": 52556
;         }
;       ]
;     },
;     {
;       "bank": 2,
;       "role": "resident_code",
;       "page": 2,
;       "orgAddress": 32768,
;       "endAddress": 40960,
;       "usedBytes": 15042,
;       "freeBytes": 0,
;       "overBudget": true,
;       "modules": [
;         {
;           "key": "statemachine",
;           "estimatedBytes": 15042
;         }
;       ]
;     },
;     {
;       "bank": 3,
;       "role": "resident_code",
;       "page": 3,
;       "orgAddress": 40960,
;       "endAddress": 49152,
;       "usedBytes": 5666,
;       "freeBytes": 2526,
;       "overBudget": false,
;       "modules": [
;         {
;           "key": "gameflow",
;           "estimatedBytes": 5666
;         }
;       ]
;     },
;     {
;       "bank": 4,
;       "role": "far_code",
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "usedBytes": 14687,
;       "freeBytes": 0,
;       "overBudget": true,
;       "modules": [
;         {
;           "key": "screens_code",
;           "estimatedBytes": 14687
;         }
;       ]
;     },
;     {
;       "bank": 5,
;       "role": "far_code",
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "usedBytes": 9445,
;       "freeBytes": 0,
;       "overBudget": true,
;       "modules": [
;         {
;           "key": "entities",
;           "estimatedBytes": 9445
;         }
;       ]
;     },
;     {
;       "bank": 6,
;       "role": "far_code",
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "usedBytes": 8343,
;       "freeBytes": 0,
;       "overBudget": true,
;       "modules": [
;         {
;           "key": "sprites",
;           "estimatedBytes": 8343
;         }
;       ]
;     },
;     {
;       "bank": 7,
;       "role": "far_code",
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "usedBytes": 5666,
;       "freeBytes": 2526,
;       "overBudget": false,
;       "modules": [
;         {
;           "key": "bosses",
;           "estimatedBytes": 5666
;         }
;       ]
;     },
;     {
;       "bank": 8,
;       "role": "far_code",
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "usedBytes": 4765,
;       "freeBytes": 3427,
;       "overBudget": false,
;       "modules": [
;         {
;           "key": "worlds",
;           "estimatedBytes": 4765
;         }
;       ]
;     },
;     {
;       "bank": 9,
;       "role": "far_code",
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "usedBytes": 4418,
;       "freeBytes": 3774,
;       "overBudget": false,
;       "modules": [
;         {
;           "key": "sound",
;           "estimatedBytes": 4418
;         }
;       ]
;     },
;     {
;       "bank": 10,
;       "role": "far_code",
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "usedBytes": 4223,
;       "freeBytes": 3969,
;       "overBudget": false,
;       "modules": [
;         {
;           "key": "animtiles",
;           "estimatedBytes": 4223
;         }
;       ]
;     },
;     {
;       "bank": 11,
;       "role": "far_code",
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "usedBytes": 3640,
;       "freeBytes": 4552,
;       "overBudget": false,
;       "modules": [
;         {
;           "key": "hud",
;           "estimatedBytes": 3640
;         }
;       ]
;     },
;     {
;       "bank": 12,
;       "role": "far_code",
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "usedBytes": 3576,
;       "freeBytes": 4616,
;       "overBudget": false,
;       "modules": [
;         {
;           "key": "font",
;           "estimatedBytes": 3576
;         }
;       ]
;     },
;     {
;       "bank": 13,
;       "role": "far_code",
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "usedBytes": 2353,
;       "freeBytes": 5839,
;       "overBudget": false,
;       "modules": [
;         {
;           "key": "scroll",
;           "estimatedBytes": 2353
;         }
;       ]
;     },
;     {
;       "bank": 14,
;       "role": "far_code",
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "usedBytes": 894,
;       "freeBytes": 7298,
;       "overBudget": false,
;       "modules": [
;         {
;           "key": "patterns_code",
;           "estimatedBytes": 894
;         }
;       ]
;     },
;     {
;       "bank": 15,
;       "role": "far_code",
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "usedBytes": 846,
;       "freeBytes": 7346,
;       "overBudget": false,
;       "modules": [
;         {
;           "key": "colors_code",
;           "estimatedBytes": 846
;         }
;       ]
;     }
;   ],
;   "dataBanks": [
;     {
;       "bank": 16,
;       "role": "asset_data",
;       "orgAddress": 147456,
;       "endAddress": 155648,
;       "usedBytes": 3154,
;       "freeBytes": 5038,
;       "resources": 109
;     }
;   ]
; }
;
; [[[MIDEAS_ARTIFACT:segment_budget.json:END]]]

; ##################################################################
; BANK 0 — Bootstrap (#4000h-#5FFFh, FIXED window in Konami mapper)
; Contains: header, bios, constants, variables, mapper, interrupt,
;           page-0 stubs, far-call trampolines, init_game_systems.
; All mapper_set_bank calls are here so they execute from this fixed bank.
; ##################################################################

; CRITICAL: header.asm with ORG #4000 and "AB" signature MUST be first
; ==================================================================
; MSX CARTRIDGE ROM HEADER
; File: header.asm
; Description: Standard MSX cartridge initialization
; GameFlow Integration: Using "Main" as execution orchestrator
; Flow: Start → WorldLink (gfn_1772275295906)
; ==================================================================

    org #4000           ; MSX cartridge start address

; ==================================================================
; CARTRIDGE HEADER
; ==================================================================
    db "AB"             ; MSX cartridge signature
    dw init_rom         ; Initialization address
    dw 0                ; Statement handler (not used)
    dw 0                ; Device handler (not used)
    dw 0                ; Text handler (not used)
    dw 0                ; Reserved
    dw 0                ; Reserved
    dw 0                ; Reserved

; ==================================================================
; ROM INITIALIZATION ENTRY POINT
; ==================================================================
init_rom:
    di
    im 1
    
    ; Initialize stack
    ld sp, #F380

    ; MegaROM cold boot: page 2 (#8000-#BFFF) must be mapped to the
    ; cartridge slot before writes to Konami registers at #8000/#A000 can work.
    call SETPAGES32K
    jp restart_rom_continue

; Restart entry point for GameFlow Restart node.
; Reinitializes runtime safely without remapping cartridge pages.
restart_rom:
    di
    im 1
    ld sp, #F380

restart_rom_continue:
    ; Capture the normal slot state for optional linear 48K page-0 helpers.
    call init_page0_runtime_state

    ; Initialize mapper runtime state (safe no-op in simple32k mode)
    call mapper_runtime_init

    ; Initialize cached resource descriptor mirrors used by banked resources.
    call resource_manager_init
    ; MEGAROM: Static bank setup — map physical banks 1-3 to their pages.
    ; Konami4 register layout: write to 6000h→6000-7FFFh, 8000h→8000-9FFFh, A000h→A000-BFFFh
    ; p1 writes to reg #6000, p2 to #8000, p3 to #A000.
    ; Bank 0 (4000h-5FFFh): fixed (Konami4 cannot change this page)
    ; Bank 1 (6000h-7FFFh): set via p1 (reg #6000)
    ; Bank 2 (8000h-9FFFh): set via p2 (reg #8000)
    ; Bank 3 (A000h-BFFFh): set via p3 (reg #A000)
    ld a, 1
    call mapper_set_bank_p1
    ld a, 2
    call mapper_set_bank_p2
    ld a, 3
    call mapper_set_bank_p3

    ; Reset some interrupts to ensure compatibility
    ; with MSX computers with disk controllers
    ld a, #C9
    ld (HKEY), a
    ; NOTE: TIMI (H.TIMI) is now managed by init_interrupt_system

    ; Silence click, init keyboard, clear config
    xor a
    ld (CLIKSW), a
    ld (deterministic), a
    
    ; Change background colors
    ld (BAKCLR), a
    ld (BDRCLR), a
    call CHGCLR

    ; Disable screen while switching modes / initializing VDP
    call DISSCR

    ; Change screen mode to SCREEN 2
    ld a, 2
    call CHGMOD

    ; Configure 16x16 sprites
    ; VDP Register #01: activate sprites, generate interrupts, 16x16 sprites
    ld bc, #E201
    call FAST_WRTVDP
    ; CRITICAL: Update BIOS system variable RG1SAV to match
    ; Without this, DISSCR/ENASCR will overwrite VDP R1 losing 16x16 sprite config
    ld a, #E2
    ld (#F3E0), a       ; RG1SAV = #E2 (preserves 16x16 sprite bit)

    ; Detect 50Hz/60Hz
    call CheckIf60Hz
    ld (isComputer50HzOr60Hz), a ; 0: 50Hz, 1: 60Hz

    ; ====================================================
    ; INTERRUPT SYSTEM INITIALIZATION (Konami-style)
    ; ====================================================
    ; Initialize interrupt task system (hooks H.TIMI)
    call init_interrupt_system
    di

    ; Register default tasks based on project needs
        ; Initialize PSG/audio once at boot. WorldLink must not reset music after a Music node.
    call call_init_sound_system_resident

    ; Register boot-time IRQ tasks defined by the engine execution plan.
    call init_default_tasks_from_plan


    ei

    ; ====================================================
    ; GAMEFLOW INITIALIZATION
    ; ====================================================
    ; Initialize GameFlow system
    call gameflow_init

    ; Start execution from GameFlow Start node
    ; GameFlow is now the sole orchestrator
    call ENASCR
    jp gameflow_start

main_loop:
    halt
    call call_task_audio_tick_resident
    ; Update gameplay state
    call update_all_entities
    jp main_loop

; ==================================================================
; AUXILIARY FUNCTIONS
; ==================================================================

; Helper: Get expanded slot value for ENASLT/CALSLT usage
; Input:  A = slot number (0-3) in lower bits
; Output: A = expanded slot value if needed
GETSLOT:
    and #03             ; Proteccion, nos aseguramos de que el valor esta en 0-3
    ld  c,a             ; c = slot de la pagina
    ld  b,0             ; bc = slot de la pagina
    ld  hl,#fcc1        ; Tabla de slots expandidos
    add hl,bc           ; hl -> variable que indica si este slot esta expandido
    ld  a,(hl)          ; Tomamos el valor
    and #80             ; Si el bit mas alto es cero...
    jr  z,GETSLOT_EXIT  ; ...nos vamos a @@EXIT
    ; --- El slot esta expandido ---
    or  c               ; Slot basico en el lugar adecuado
    ld  c,a             ; Guardamos el valor en c
    inc hl              ; Incrementamos hl una...
    inc hl              ; ...dos...
    inc hl              ; ...tres...
    inc hl              ; ...cuatro veces
    ld  a,(hl)          ; a = valor del registro de subslot del slot donde estamos
    and #0C             ; Nos quedamos con el valor donde esta nuestro cartucho
GETSLOT_EXIT:
    or  c
    ret

; From: http://www.z80st.es/downloads/code/
; SETPAGES32K:  BIOS-ROM-YY-ZZ   -> BIOS-ROM-ROM-ZZ (SITUA PAGINA 2)
SETPAGES32K:    ; --- Posiciona las paginas de un megarom o un 32K ---
    ld  a, #C9              ; Codigo de RET
    ld  (SETPAGES32K_NOPRET), a   ; Modificamos la siguiente instruccion si estamos en RAM
SETPAGES32K_NOPRET:
    nop                     ; No hacemos nada si no estamos en RAM
    ; --- Si llegamos aqui no estamos en RAM, hay que posicionar la pagina ---
    call RSLREG             ; Leemos el contenido del registro de seleccion de slots
    rrca                    ; Rotamos a la derecha...
    rrca                    ; ...dos veces
    call GETSLOT            ; Obtenemos el slot de la pagina 1 ($4000-$BFFF)
    ld (ROM_slot), a        ; Save slot for later use
    ld  h, #80              ; Seleccionamos pagina 2 ($8000-$BFFF)
    jp  ENASLT              ; Posicionamos la pagina 2 y volvemos

; Source: https://www.msx.org/forum/development/msx-development/how-0?page=0
; Returns 1 in a and clears z flag if vdp is 60Hz
CheckIf60Hz:
    di
    in      a, (#99)
    nop
    nop
    nop
vdpSync:
    in      a, (#99)
    and     #80
    jr      z, vdpSync

    ld      hl, #900
vdpLoop:
    dec     hl
    ld      a, h
    or      l
    jr      nz, vdpLoop

    in      a, (#99)
    rlca
    and     1
    ei
    ret

; ==================================================================
; END OF HEADER
; ==================================================================


; ==================================================================
; MSX BIOS FUNCTIONS AND ADDRESSES
; File: bios.asm
; Description: Standard MSX BIOS function definitions
; ==================================================================

; ==================================================================
; MAIN BIOS FUNCTIONS
; ==================================================================

; Screen and Display
CHGMOD  EQU #005F        ; Change screen mode (A=mode)
CHGCLR  EQU #0062        ; Change colors
CLS     EQU #00C3        ; Clear screen
POSIT   EQU #00C6        ; Position cursor (H=X, L=Y)
ERAFNK  EQU #00CC        ; Erase function keys
DSPFNK  EQU #00CF        ; Display function keys
DISSCR  EQU #0041        ; Disable screen (prevent flicker)
ENASCR  EQU #0044        ; Enable screen
INITXT  EQU #006C        ; Initialize text mode
INIT32  EQU #006F        ; Initialize screen mode
INIGRP  EQU #0072        ; Initialize graphics routines

; Character I/O
CHPUT   EQU #00A2        ; Character output (A=char)
CHGET   EQU #009F        ; Character input
CHSNS   EQU #009C        ; Character sense (check key)
BREAKX  EQU #00B7        ; Check CTRL+STOP
ISCNTC  EQU #00BA        ; Check CTRL+C

; String I/O
OUTDO   EQU #005A        ; String output (HL=string)

; Input Devices
GTSTCK  EQU #00D5        ; Get joystick status (A=port)
GTTRIG  EQU #00D8        ; Get trigger status (A=port)
GTPAD   EQU #00DB        ; Get paddle (A=port)
GTPDL   EQU #00DE        ; Get paddle value
SNSMAT  EQU #0141        ; Sense matrix (A=row)
KILBUF  EQU #0156        ; Kill keyboard buffer

; Slot Management
RSLREG  EQU #0138        ; Read slot register
WSLREG  EQU #013B        ; Write slot register
ENASLT  EQU #0024        ; Enable slot (H=page, A=slot)
CALSLT  EQU #001C        ; Call routine in another slot

; Sound
GICINI  EQU #0090        ; Initialize PSG
WRTPSG  EQU #0093        ; Write PSG register (A=reg, E=value)
RDPSG   EQU #0096        ; Read PSG register (A=reg)

; Graphics VDP
GRPPRT  EQU #0089        ; Print in graphic mode
SETGRP  EQU #007E        ; Set graphic mode

; Memory Transfer
LDIRVM  EQU #005C        ; Block transfer from CPU to VRAM
LDIRMV  EQU #0059        ; Block transfer from VRAM to CPU
WRTVDP  EQU #0047        ; Write to VDP register
WRTVRM  EQU #004D        ; Write data to VRAM (A=data, HL=address)

; File I/O (Disk BIOS) - Not used in cartridge ROMs
; DSKIO   EQU #004A      ; Disk I/O (conflicts with WRTVRM, not available in cartridge)
; DSKCHF  EQU #004D      ; Disk change flag (same address as WRTVRM, not used)

; Math
GETYPR  EQU #0053        ; Get type of variable

; ==================================================================
; VDP PORTS AND REGISTERS
; ==================================================================

; VDP Data/Status Ports
VDPDR   EQU #0098        ; VDP Data Register (Port 0)
VDPSR   EQU #0099        ; VDP Status Register (Port 1)

; VDP Registers (use with VDPSR)
VDP_R0  EQU 0            ; Mode register 0
VDP_R1  EQU 1            ; Mode register 1
VDP_R2  EQU 2            ; Name table base address
VDP_R3  EQU 3            ; Color table base address
VDP_R4  EQU 4            ; Pattern table base address
VDP_R5  EQU 5            ; Sprite attribute table
VDP_R6  EQU 6            ; Sprite pattern table
VDP_R7  EQU 7            ; Text/border color

; System Variables
HKEY    EQU #F3DB        ; Hook function key (system variable)
CLIKSW  EQU #F3DC        ; Key click switch
FORCLR  EQU #F3E8        ; Foreground color
BAKCLR  EQU #F3E9        ; Background color
BDRCLR  EQU #F3EA        ; Border color
isComputer50HzOr60Hz EQU #F3EB  ; System frequency flag

; ==================================================================
; NOTE: Fast hardware access routines (FAST_LDIRVM, FAST_WRTVRM, etc.)
;       are provided by directHardwareGenerator.ts when hybrid/direct mode
;       is enabled. See directHardwareGenerator.ts for implementations.
; ==================================================================

; ==================================================================
; END OF BIOS DEFINITIONS
; ==================================================================

; ==================================================================
; DIRECT HARDWARE ACCESS ROUTINES
; ==================================================================
; Mode: HYBRID
; Optimize Level: safe
; Debug: DISABLED
;
; These routines provide direct hardware access for maximum performance.
; They replace BIOS calls in performance-critical sections.
;
; Performance Gains vs BIOS:
;   FAST_LDIRVM:  ~40% faster (12,288 vs 20,480 cycles for 256 bytes)
;   FAST_WRTVRM:  ~43% faster (40 vs 70 cycles)
;   FAST_WRTVDP:  ~55% faster (25 vs 55 cycles)
;   FAST_GTSTCK:  ~58% faster (50 vs 120 cycles)
;   FAST_GTTRIG:  direct trigger read (joystick button)
;   FAST_SNSMAT:  direct keyboard matrix row read
;
; Compatibility: MSX1, MSX2, MSX2+
; ==================================================================


; ==================================================================
; FAST_LDIRVM - Fast Block Transfer to VRAM
; ==================================================================
; Register Contract:
;   Purpose: Block copy from RAM to VRAM using VDP data port auto-increment.
;   Inputs:
;     - HL = source address (RAM)
;     - DE = destination address (VRAM)
;     - BC = byte count
;   Outputs:
;     - None
;   Clobbers:
;     - AF
;     - BC
;     - HL
;   Preserved:
;     - DE
;   Register roles:
;     - A = VDP address bytes and data byte being transferred
;     - HL = RAM read pointer (increments each byte)
;     - DE = only used to program initial VRAM address
;     - BC = countdown loop counter
;   Notes:
;     - Caller must preserve AF/BC/HL if needed after call.

; Replaces BIOS LDIRVM with direct hardware access
;
; Input:
;   HL = Source address (RAM)
;   DE = Destination address (VRAM)
;   BC = Byte count
;
; Output:
;   None
;
; Destroys:
;   AF, BC, HL
;
; Performance:
;   ~48 cycles/byte vs BIOS ~80+ cycles/byte
;   For 256 bytes: 12,288 cycles vs 20,480+ (40% faster)
;
; Notes:
;   - Auto-increments VRAM address (VDP feature)
;   - Keeps IRQs masked for the whole transfer to avoid VDP port races
;   - Restores previous IRQ enable state on return
;   - Works on all MSX models (TMS9918, V9938, V9958)
; ==================================================================
FAST_LDIRVM:
    ; Disable interrupts during VDP port sequence to prevent ISR races.
    ; Always re-enables on exit (called from main loop where EI is guaranteed).
    ; NOTE: The old LD A,I / PUSH AF / RET PO pattern is unreliable on Z80 —
    ; an interrupt between LD A,I and PUSH AF clears P/V, skipping EI and
    ; leaving interrupts permanently disabled (next HALT locks the system).
    di

    ; Set VRAM write address
    ld a, e
    out (#99), a           ; Write address low byte to VDP
    nop                    ; Real VDPs need a short settle time between control writes
    ld a, d
    or #40                 ; Set bit 6 for write mode
    out (#99), a           ; Write address high byte + write command
    nop                    ; Let the VDP latch the address before the first data write

    ; Copy loop
.ldirvm_loop:
    ld a, (hl)             ; Read byte from RAM (7 cycles)
    out (#98), a           ; Write to VRAM data port (11 cycles)
    inc hl                 ; Next source address (6 cycles)
    dec bc                 ; Decrement counter (6 cycles)
    ld a, b                ; Check if BC = 0 (4 cycles)
    or c                   ; (4 cycles)
    jr nz, .ldirvm_loop    ; Loop if not zero (12/7 cycles)

    ei
    ret


; ==================================================================
; FAST_FILLVRM - Fast Repeated Byte Fill to VRAM
; ==================================================================
; Register Contract:
;   Purpose: Fill a sequential VRAM range with one repeated byte using VDP data port auto-increment.
;   Inputs:
;     - A = byte to write
;     - HL = destination address (VRAM)
;     - BC = byte count
;   Outputs:
;     - None
;   Clobbers:
;     - AF
;     - BC
;   Preserved:
;     - DE
;     - HL
;   Register roles:
;     - A = VDP address bytes, loop zero-test, and data byte
;     - BC = countdown loop counter
;     - E = cached fill byte while DE is saved on stack
;     - HL = only used to program initial VRAM address
;   Notes:
;     - Returns without touching VRAM when BC = 0.
;     - Caller must preserve AF/BC if needed after call.

; Replaces small loops that call FAST_WRTVRM for repeated values
;
; Input:
;   A  = Data byte to write
;   HL = Destination address (VRAM)
;   BC = Byte count
;
; Output:
;   None
;
; Destroys:
;   AF, BC
;
; Performance:
;   Avoids reprogramming the VDP address for every byte.
; ==================================================================
FAST_FILLVRM:
    push de
    ld e, a                ; Cache fill byte while AF is free for address setup/checks
    ld a, b
    or c
    jr z, .fill_done

    ; Disable interrupts during VDP port sequence (see FAST_LDIRVM note).
    di

    ; Set VRAM write address once; the VDP auto-increments after each data write.
    ld a, l
    out (#99), a
    nop
    ld a, h
    or #40
    out (#99), a
    nop

    ld a, e
.fill_loop:
    out (#98), a
    dec bc
    ld a, b
    or c
    ld a, e
    jr nz, .fill_loop

    ei
.fill_done:
    pop de
    ret


; ==================================================================
; FAST_WRTVRM - Write Single Byte to VRAM
; ==================================================================
; Register Contract:
;   Purpose: Write one byte into VRAM while preserving caller-visible state.
;   Inputs:
;     - A = byte to write
;     - HL = VRAM destination address
;   Outputs:
;     - None
;   Clobbers:
;     - None (all registers preserved)
;   Preserved:
;     - AF
;     - BC
;     - DE
;     - HL
;   Register roles:
;     - A = temporarily saved/restored around VDP address programming
;     - HL = VRAM address source (not modified)
;   Notes:
;     - Safe helper when the caller cannot tolerate register changes.

; Replaces BIOS WRTVRM
;
; Input:
;   A = Data byte to write
;   HL = VRAM destination address
;
; Output:
;   None
;
; Destroys:
;   None (all registers preserved)
;
; Performance:
;   ~40 cycles vs BIOS ~70 cycles (43% faster)
;
; Notes:
;   - Preserves all registers including AF
;   - VDP write sequence is atomic against ISR VRAM writes
; ==================================================================
FAST_WRTVRM:
    ; Preserve caller-visible state. Disable interrupts during VDP write
    ; (see FAST_LDIRVM note on why LD A,I / RET PO is unsafe).
    push bc
    ld c, a                ; C = input data byte
    push af                ; Save caller AF
    di
    ld a, l
    out (#99), a           ; Address low (11 cycles)
    ld a, h
    or #40                 ; Write mode (7 cycles)
    out (#99), a           ; Address high + command (11 cycles)
    ld a, c
    out (#98), a           ; Write to VRAM (11 cycles)
    pop af                 ; Restore caller AF
    pop bc
    ei
    ret


; ==================================================================
; FAST_RDVRM - Read Single Byte from VRAM
; ==================================================================
; Register Contract:
;   Purpose: Read one byte from VRAM data port.
;   Inputs:
;     - HL = VRAM source address
;   Outputs:
;     - A = byte read from VRAM
;   Clobbers:
;     - AF
;   Preserved:
;     - BC
;     - DE
;     - HL
;   Register roles:
;     - A = VDP addressing command then read result
;     - HL = address source only (unchanged)
;   Notes:
;     - Callers relying on flags must account for AF clobber.

; Replaces BIOS RDVRM
;
; Input:
;   HL = VRAM source address
;
; Output:
;   A = Byte read from VRAM
;
; Destroys:
;   AF
;
; Performance:
;   Slower than a naive single IN, but correct on TMS9918/MSX1 because
;   VRAM reads require one dummy fetch after setting the address.
;
; Notes:
;   - Useful for collision detection, tile reading
;   - First IN primes the VDP read-ahead buffer; second IN returns the byte
; ==================================================================
FAST_RDVRM:
    ld a, l
    out (#99), a           ; Address low
    ld a, h
    and #3F                ; Clear bit 6 for read mode (bit 7 must be 0)
    out (#99), a           ; Address high + read command
    nop                    ; Let the VDP latch the read address
    in a, (#98)            ; Dummy read: primes the TMS9918 prefetch buffer
    in a, (#98)            ; Actual byte from VRAM[HL]
    ret


; ==================================================================
; FAST_WRTVDP - Write VDP Register
; ==================================================================
; Register Contract:
;   Purpose: Write one VDP register value (value first, then register index).
;   Inputs:
;     - B = register value
;     - C = register number
;   Outputs:
;     - None
;   Clobbers:
;     - AF
;   Preserved:
;     - BC
;     - DE
;     - HL
;   Register roles:
;     - A = output staging register for both OUT operations
;     - B/C = preserved input pair for value and register id
;   Notes:
;     - Order of writes is mandatory for VDP register writes.

; Replaces BIOS WRTVDP
;
; Input:
;   B = Register value
;   C = Register number (0-7 for MSX1, 0-23 for MSX2, 0-46 for MSX2+)
;
; Output:
;   None
;
; Destroys:
;   AF
;
; Performance:
;   ~25 cycles vs BIOS ~55 cycles (55% faster)
;
; Notes:
;   - Used for mode changes, colors, scroll, etc.
;   - Register write order matters: value first, then register number
; ==================================================================
FAST_WRTVDP:
    ld a, b                ; Get register value (4 cycles)
    out (#99), a           ; Write value first (11 cycles)
    ld a, c                ; Get register number (4 cycles)
    or #80                 ; Set bit 7 for register write (7 cycles)
    out (#99), a           ; Write register select (11 cycles)
    ret                    ; (10 cycles)
                           ; Total: ~25 cycles


; ==================================================================
; FAST_GTSTCK - Read Joystick Direction
; ==================================================================
; Register Contract:
;   Purpose: Read joystick direction and map PSG bits to MSX GTSTCK direction code.
;   Inputs:
;     - A = joystick port (0 or 1)
;   Outputs:
;     - A = direction code (0-8)
;   Clobbers:
;     - AF
;     - HL
;   Preserved:
;     - BC
;     - DE
;   Register roles:
;     - A = PSG register selection, raw read, and final direction code
;     - HL = lookup table pointer into joystick_direction_table
;   Notes:
;     - Bits are active-low; routine inverts and masks input nibble.

; Replaces BIOS GTSTCK (which is notoriously slow)
;
; Input:
;   A = Joystick port (0 = port 1, 1 = port 2)
;
; Output:
;   A = Direction code (0-8)
;       0 = Center (no direction)
;       1 = Up
;       2 = Up + Right
;       3 = Right
;       4 = Down + Right
;       5 = Down
;       6 = Down + Left
;       7 = Left
;       8 = Up + Left
;
; Destroys:
;   AF, HL
;
; Performance:
;   ~50 cycles vs BIOS ~120+ cycles (58% faster)
;
; Notes:
;   - Reads from PSG register 14 (port 1) or 15 (port 2)
;   - Joystick bits are active-low (inverted)
;   - Uses lookup table for direction decoding
; ==================================================================
FAST_GTSTCK:
    ; Calculate PSG register: 14 (port 1) or 15 (port 2)
    rrca                   ; A = A / 2 (joystick port becomes 0 or 8)
    and #0F                ; Mask to valid range
    or #0E                 ; Add 14 (base register for joystick)

    ; Make PSG select+read atomic so VBlank music writes cannot
    ; corrupt the selected register mid-access.
    di
    out (#A0), a           ; Write register number to PSG address port
    in a, (#A2)            ; Read value from PSG data port
    ei

    ; Process joystick data
    cpl                    ; Invert bits (joystick is active-low)
    and #0F                ; Mask to 4 direction bits (Up, Down, Left, Right)

    ; Lookup direction code from table
    ld hl, joystick_direction_table
    add a, l               ; Add offset to table base
    ld l, a
    adc a, h               ; Handle carry if table crosses page boundary
    sub l
    ld h, a
    ld a, (hl)             ; Get direction code (0-8)
    ret

; Direction lookup table (16 entries for all 4-bit combinations)
; MSX PSG register 14 joystick bit order:
;   Bit 0 = Up    (0001)
;   Bit 1 = Down  (0010)
;   Bit 2 = Left  (0100)
;   Bit 3 = Right (1000)
; Value: GTSTCK-compatible direction code (0-8)
joystick_direction_table:
    db 0  ; 0000 = Center
    db 1  ; 0001 = Up
    db 5  ; 0010 = Down
    db 0  ; 0011 = Up+Down (invalid)
    db 7  ; 0100 = Left
    db 8  ; 0101 = Up+Left
    db 6  ; 0110 = Down+Left
    db 0  ; 0111 = Invalid
    db 3  ; 1000 = Right
    db 2  ; 1001 = Up+Right
    db 4  ; 1010 = Down+Right
    db 0  ; 1011 = Invalid
    db 0  ; 1100 = Left+Right (invalid)
    db 0  ; 1101 = Invalid
    db 0  ; 1110 = Invalid
    db 0  ; 1111 = All directions (invalid)


; ==================================================================
; FAST_GTTRIG - Read Joystick Trigger
; ==================================================================
; Register Contract:
;   Purpose: Read joystick trigger bit directly from PSG register.
;   Inputs:
;     - A = joystick port (0 or 1)
;   Outputs:
;     - A = #FF if pressed, #00 if released
;   Clobbers:
;     - AF
;   Preserved:
;     - BC
;     - DE
;     - HL
;   Register roles:
;     - A = register select, raw PSG read, and normalized return value
;   Notes:
;     - Trigger is active-low in PSG bit 4.

; Direct hardware replacement for BIOS GTTRIG
;
; Input:
;   A = Joystick port (0 = port 1, 1 = port 2)
;
; Output:
;   A = #FF if pressed, 0 if released
;
; Destroys:
;   AF
;
; Notes:
;   - Reads PSG register 14/15 directly
;   - Trigger bit is active-low
; ==================================================================
FAST_GTTRIG:
    ; Calculate PSG register: 14 (port 1) or 15 (port 2)
    rrca
    and #0F
    or #0E

    ; Make PSG select+read atomic so VBlank music writes cannot
    ; corrupt the selected register mid-access.
    di
    out (#A0), a
    in a, (#A2)
    ei

    ; Trigger bit (bit 4): 0 when pressed, 1 when released
    and #10
    ld a, #00
    ret nz
    ld a, #FF
    ret


; ==================================================================
; FAST_SNSMAT - Sense Keyboard Matrix Row
; ==================================================================
; Register Contract:
;   Purpose: Select keyboard matrix row via PPI and return row state.
;   Inputs:
;     - A = matrix row (0-11)
;   Outputs:
;     - A = row bits (active-low)
;   Clobbers:
;     - AF
;     - C
;   Preserved:
;     - B
;     - DE
;     - HL
;   Register roles:
;     - A = row selector composition and final row read
;     - C = cached low nibble used to build PPI port C output
;   Notes:
;     - Upper nibble of current PPI port C is preserved.

; Direct hardware replacement for BIOS SNSMAT
;
; Input:
;   A = row (0-11)
;
; Output:
;   A = row bits (active-low, 0=pressed)
;
; Destroys:
;   AF, C
; ==================================================================
FAST_SNSMAT:
    and #0F                 ; Keep valid row bits
    ld c, a
    in a, (#AA)             ; Read current PPI port C
    and #F0                 ; Preserve upper nibble
    or c                    ; Set keyboard row in lower nibble
    out (#AA), a            ; Select row
    in a, (#A9)             ; Read keyboard matrix row
    ret


; ==================================================================
; END OF DIRECT HARDWARE ROUTINES
; ==================================================================


; ==================================================================
; MSX SYSTEM CONSTANTS
; File: constants.asm
; Description: MSX hardware constants and project-specific definitions
; ==================================================================

; ==================================================================
; VRAM LAYOUT - SCREEN 2 MODE
; ==================================================================

; Pattern Generator Table (PGT) - 3 Banks
CHRTBL  EQU #0000        ; Pattern table base address (alias)
CHRTBL2 EQU #0000        ; Pattern table base address (Bank 0)
; Bank 1: CHRTBL2 + #800   (#0800)
; Bank 2: CHRTBL2 + #1000  (#1000)

; Color Attribute Table (CAT) - 3 Banks
CLRTBL  EQU #2000        ; Color table base address (alias)
CLRTBL2 EQU #2000        ; Color table base address (Bank 0)
; Bank 1: CLRTBL2 + #800   (#2800)
; Bank 2: CLRTBL2 + #1000  (#3000)

; Other VRAM Areas
NAMETBL EQU #1800        ; Name table base address
SPRATR  EQU #1B00        ; Sprite attribute table
SPRPAT  EQU #3800        ; Sprite pattern table

; ==================================================================
; SCREEN MODES
; ==================================================================
SCREEN0     EQU 0        ; 40x24 text
SCREEN1     EQU 1        ; 32x24 text/graphics
SCREEN2     EQU 2        ; 256x192 graphics
SCREEN3     EQU 3        ; 64x48 multicolor

; ==================================================================
; SCREEN DIMENSIONS (DYNAMIC BASED ON PROJECT TILES)
; ==================================================================

; Project-specific tile dimensions detected:
; Tile 0: rajol1 = 16x16px (2x2 MSX chars)
; Tile 1: senefa1 = 8x8px (1x1 MSX chars)
; Tile 2: corda = 8x8px (1x1 MSX chars)
; Tile 3: gema = 8x8px (1x1 MSX chars)
; Tile 4: gema_f0 = 8x8px (1x1 MSX chars)
; Tile 5: rajola = 8x8px (1x1 MSX chars)
; Tile 6: rajol_terra5 = 16x16px (2x2 MSX chars)
; Tile 7: gem_extra_jump = 8x8px (1x1 MSX chars)
; Tile 8: rajol_vermell = 8x8px (1x1 MSX chars)
; Tile 9: gem_extra_jump_f0 = 8x8px (1x1 MSX chars)
; Tile 10: elevador1 = 8x8px (1x1 MSX chars)
; Tile 11: elevador2 = 8x8px (1x1 MSX chars)

; Using primary tile size: 16x16px
TILE_WIDTH      EQU 16    ; Primary tile width in pixels
TILE_HEIGHT     EQU 16   ; Primary tile height in pixels
SCREEN_TILES_X  EQU 16    ; Horizontal tiles (256px ÷ 16px)
SCREEN_TILES_Y  EQU 12   ; Vertical tiles (192px ÷ 16px)
MSX_CHARS_PER_TILE_X EQU 2  ; MSX characters wide per tile
MSX_CHARS_PER_TILE_Y EQU 2 ; MSX characters high per tile



; ==================================================================
; MSX COLORS
; ==================================================================
TRANSPARENT EQU 0
BLACK       EQU 1
MEDIUM_GREEN EQU 2
LIGHT_GREEN EQU 3
DARK_BLUE   EQU 4
LIGHT_BLUE  EQU 5
DARK_RED    EQU 6
CYAN        EQU 7
MEDIUM_RED  EQU 8
LIGHT_RED   EQU 9
DARK_YELLOW EQU 10
LIGHT_YELLOW EQU 11
DARK_GREEN  EQU 12
MAGENTA     EQU 13
GRAY        EQU 14
WHITE       EQU 15

; ==================================================================
; INPUT CONSTANTS
; ==================================================================

; Joystick Directions
STICK_UP    EQU 1
STICK_UPRIGHT EQU 2
STICK_RIGHT EQU 3
STICK_DOWNRIGHT EQU 4
STICK_DOWN  EQU 5
STICK_DOWNLEFT EQU 6
STICK_LEFT  EQU 7
STICK_UPLEFT EQU 8
STICK_CENTER EQU 0

; Trigger Constants
TRIG_A      EQU #10      ; Trigger A (Fire)
TRIG_B      EQU #20      ; Trigger B (MSX2+)

; Input Button Bitmask
INPUT_BTN_FIRE EQU #01   ; Fire/Space button bit in input_btn_curr/input_btn_prev
INPUT_BTN_GRAB EQU #02   ; Grab button bit in input_btn_curr/input_btn_prev

; Direction flags shared by input/state machine helpers
DIR_ALLOW_UP     EQU #01 ; Bit 0: Allow UP movement
DIR_ALLOW_DOWN   EQU #02 ; Bit 1: Allow DOWN movement
DIR_ALLOW_LEFT   EQU #04 ; Bit 2: Allow LEFT movement
DIR_ALLOW_RIGHT  EQU #08 ; Bit 3: Allow RIGHT movement

; ==================================================================
; TILE BEHAVIOR CONSTANTS (for collision detection)
; ==================================================================

; Tile Behavior encoding matches TileEditor logicalProperties.mapId:
;   bits 7-4 = solidity family
;   bits 3-0 = property flags
TILE_PASSABLE       EQU #00    ; Family 0: passable / no-solid
TILE_SOLID          EQU #10    ; Family 1: solid wall/floor
TILE_PLATFORM       EQU #20    ; Family 2: top-solid platform
TILE_SLOPE          EQU #30    ; Family 3: slope / custom solid family
TILE_BREAKABLE      EQU #01    ; Flag bit 0
TILE_MOVABLE        EQU #02    ; Flag bit 1
TILE_DEADLY         EQU #04    ; Flag bit 2: causesDamage
TILE_INTERACTABLE   EQU #08    ; Flag bit 3: isInteractiveSwitch

; Collision Directions (for platform logic)
COLL_FROM_ABOVE     EQU #01    ; Entity approaching from above
COLL_FROM_BELOW     EQU #02    ; Entity approaching from below
COLL_FROM_LEFT      EQU #04    ; Entity approaching from left
COLL_FROM_RIGHT     EQU #08    ; Entity approaching from right

; Entity Collision Layer Presets (entity_collision_layer / entity_collides_with)
COLLISION_LAYER_PLAYER      EQU #01
COLLISION_LAYER_ENEMY       EQU #02
COLLISION_LAYER_PROJECTILE  EQU #04
COLLISION_LAYER_PLATFORM    EQU #08
COLLISION_LAYER_ITEM        EQU #10

; Entity-Entity Collision Event Flags (entity_entity_collision_flags)
COLLISION_EVENT_ENTITY      EQU #01
COLLISION_EVENT_ENEMY       EQU #02
COLLISION_EVENT_ITEM        EQU #04

; ==================================================================
; MIDEAS GLOBAL VARIABLES - CONSTANTS FOR VALUES
; ==================================================================


; Score - Current player score (0-65535)
UNKNOWN                 EQU 0    ; Score = "Custom Value"

; Lives - Remaining lives (0-255)


; ==================================================================
; GAME FLOW STATES (PROJECT-SPECIFIC)
; ==================================================================

; Basic Game Flow States (always available)
FLOW_STATE_MAIN_MENU    EQU 0
FLOW_STATE_GAME         EQU 1
FLOW_STATE_PAUSE        EQU 2
FLOW_STATE_GAME_OVER    EQU 3
FLOW_STATE_CREDITS      EQU 4

; GameFlow Node Types
NODE_TYPE_START         EQU 0    ; Start node (initial entry point)
NODE_TYPE_WORLDLINK     EQU 1    ; World link node (loads world map)
NODE_TYPE_WORLD_LINK    EQU 1    ; Alias with underscore (for compatibility)
NODE_TYPE_SCREEN        EQU 2    ; Screen node (loads specific screen)
NODE_TYPE_MENU          EQU 3    ; Menu node (shows menu interface)
NODE_TYPE_SUBMENU       EQU 3    ; Alias for menu node
NODE_TYPE_SUB_MENU      EQU 3    ; Alias with underscore (for compatibility)
NODE_TYPE_TEXT          EQU 4    ; Text node (displays text)
NODE_TYPE_TRANSITION    EQU 5    ; Transition node
NODE_TYPE_RESTART       EQU 6    ; Restart node (restart game/level)
NODE_TYPE_END           EQU 7    ; End node (game over, victory, credits)
NODE_TYPE_IF_THEN_ELSE  EQU 8    ; IfThenElse node (conditional branch)
NODE_TYPE_GLOBALS       EQU 9    ; Globals node (global variable ops)
NODE_TYPE_WAYPOINT      EQU 10   ; Waypoint node (routing marker)
NODE_TYPE_GROUP         EQU 11   ; Group node (nested flow)
NODE_TYPE_MUSIC         EQU 12   ; Music node (audio command)
NODE_TYPE_PRESENTATION_SCREEN EQU 13 ; Presentation Screen node (static tile screen)
NODE_TYPE_UNKNOWN       EQU 255  ; Unknown/unsupported node type

; Additional Game Flow States detected in project
; (Custom states would be added here if needed)


; ==================================================================
; PROJECT-SPECIFIC CONSTANTS
; ==================================================================

; Detected Assets
TOTAL_SPRITES           EQU 18
TOTAL_TILES             EQU 12
TOTAL_SCREENS           EQU 5

; ==================================================================
; END OF CONSTANTS
; ==================================================================


; ==================================================================
; RAM VARIABLES DEFINITIONS
; File: variables.asm
; Description: Dynamic variable allocation using EQU addresses
; Generated based on project analysis
; ==================================================================

; ==================================================================
; CORE SYSTEM VARIABLES (ALWAYS PRESENT)
; ==================================================================
input_state         EQU #C000   ; Current direction state (0-8)
prev_input_state    EQU #C001   ; Previous direction state (0-8)
input_btn_curr      EQU #C002   ; Current input buttons bitmask (bit0=fire, bit1=grab)
input_btn_prev      EQU #C003   ; Previous input buttons bitmask (bit0=fire, bit1=grab)
input_fire          EQU #C004   ; Fire button state (0=released, 1=pressed)
boss_runtime_tick   EQU #C005   ; Boss runtime frame counter
current_screen_boss_count EQU #C006   ; Boss placements assigned to current screen
current_screen_boss_table EQU #C007   ; Pointer to current screen boss placement table (16-bit)
current_screen_boss_table_bank EQU #C009   ; Mapper bank for current screen boss placement table
current_screen_boss_entry EQU #C00A   ; First current-screen boss placement copied to RAM (11 bytes)
boss_active         EQU #C015   ; 1 when a screen boss is active
boss_health_lo      EQU #C016   ; Active boss health low byte
boss_health_hi      EQU #C017   ; Active boss health high byte
boss_hit_cooldown   EQU #C018   ; Frames until boss can receive dash damage again
boss_phase_table_ptr EQU #C019   ; Active boss phase table pointer (16-bit)
boss_attack_table_ptr EQU #C01B   ; Active boss attack table pointer (16-bit)
boss_phase_ptr      EQU #C01D   ; Active boss phase record pointer (16-bit)
boss_tile_matrix_ptr EQU #C01F   ; Active boss tile matrix pointer (16-bit)
boss_x_char         EQU #C021   ; Active boss X in screen chars
boss_y_char         EQU #C022   ; Active boss Y in screen chars
boss_prev_x_char    EQU #C023   ; Previous boss X in screen chars for redraw restore
boss_prev_y_char    EQU #C024   ; Previous boss Y in screen chars for redraw restore
boss_initial_phase_index EQU #C025   ; Active boss initial phase index
boss_width          EQU #C026   ; Active boss width in chars
boss_height         EQU #C027   ; Active boss height in chars
boss_behavior_table_ptr EQU #C028   ; Active boss behavior table pointer (16-bit)
boss_form_table_ptr EQU #C02A   ; Active boss visual form table pointer (16-bit)
boss_weak_matrix_ptr EQU #C02C   ; Active boss weak-point matrix pointer (16-bit)
boss_behavior_action_ptr EQU #C02E   ; Current boss behavior action pointer (16-bit)
boss_behavior_count EQU #C030   ; Active boss behavior action count
boss_behavior_index EQU #C031   ; Current boss behavior action index
boss_behavior_timer EQU #C032   ; Frames remaining in current boss behavior action
boss_behavior_duration EQU #C033   ; Current boss behavior action duration
boss_behavior_step_interval EQU #C034   ; Frames between tile movement steps
boss_behavior_step_timer EQU #C035   ; Countdown until next tile movement step
boss_update_interval EQU #C036   ; Frames between ASM boss updates (1=every frame)
boss_update_timer EQU #C037   ; Countdown until next ASM boss update
boss_behavior_action_type EQU #C038   ; Current boss behavior action type
boss_behavior_target_type EQU #C039   ; Current boss behavior target type
boss_behavior_target_x EQU #C03A   ; Current boss behavior target X char
boss_behavior_target_y EQU #C03B   ; Current boss behavior target Y char
boss_behavior_aux0 EQU #C03C   ; Current boss behavior auxiliary byte 0
boss_behavior_aux1 EQU #C03D   ; Current boss behavior auxiliary byte 1
boss_behavior_aux2 EQU #C03E   ; Current boss behavior auxiliary byte 2
boss_visual_dirty   EQU #C03F   ; Non-zero when boss tile matrix/form changed and needs redraw
boss_draw_row       EQU #C040   ; Boss tile draw row scratch
boss_draw_col       EQU #C041   ; Boss tile draw column scratch
boss_restore_row    EQU #C042   ; Boss previous footprint restore row scratch
boss_restore_col    EQU #C043   ; Boss previous footprint restore column scratch
boss_draw_char      EQU #C044   ; Boss tile draw char scratch
boss_draw_screen_x  EQU #C045   ; Boss tile draw screen X scratch
boss_draw_screen_y  EQU #C046   ; Boss tile draw screen Y scratch
boss_projectile_active EQU #C047   ; 1 when the simple boss projectile is active
boss_projectile_x   EQU #C048   ; Simple boss projectile X in pixels
boss_projectile_y   EQU #C049   ; Simple boss projectile Y in pixels
boss_projectile_sprite_slot EQU #C04A   ; HW sprite slot for simple boss projectile
boss_projectile_color EQU #C04B   ; Simple boss projectile sprite color
boss_projectile_pattern EQU #C04C   ; Simple boss projectile base pattern
boss_projectile_speed EQU #C04D   ; Simple boss projectile speed
boss_projectile_range EQU #C04E   ; Simple boss projectile max travel distance
boss_projectile_distance EQU #C04F   ; Simple boss projectile current travelled distance
boss_projectile_direction EQU #C050   ; Simple boss projectile direction
boss_slam_rocks_active EQU #C051   ; 1 while SlamRocks sequence is active
boss_slam_rocks_age EQU #C052   ; SlamRocks local frame age
boss_slam_rocks_origin_y EQU #C053   ; Boss Y before SlamRocks starts
boss_slam_rocks_rise_chars EQU #C054   ; Chars boss rises before impact
boss_slam_rocks_windup EQU #C055   ; Raised frames before impact
boss_slam_rocks_slam EQU #C056   ; Drop frames before rocks begin
boss_slam_rocks_hold EQU #C057   ; Ground hold frames before rocks begin
boss_slam_rocks_duration EQU #C058   ; Total SlamRocks active frames
boss_slam_rocks_count EQU #C059   ; Falling rock count
boss_slam_rocks_index EQU #C05A   ; Current falling rock lane index
boss_slam_rocks_rng  EQU #C05B   ; Local SlamRocks random seed
boss_slam_rocks_sprite_slot EQU #C05C   ; First HW sprite slot for SlamRocks rocks
boss_slam_rocks_color EQU #C05D   ; SlamRocks rock sprite color
boss_slam_rocks_pattern EQU #C05E   ; SlamRocks rock base pattern
boss_slam_rocks_speed EQU #C05F   ; SlamRocks rock fall speed
boss_slam_rocks_range EQU #C060   ; SlamRocks rock fall range
boss_slam_rock_x0    EQU #C061   ; SlamRocks lane 0 X
boss_slam_rock_x1    EQU #C062   ; SlamRocks lane 1 X
boss_slam_rock_x2    EQU #C063   ; SlamRocks lane 2 X
boss_slam_rock_x3    EQU #C064   ; SlamRocks lane 3 X
boss_falling_blocks_active EQU #C065   ; 1 while FallingBlocks sequence is active
boss_falling_blocks_age EQU #C066   ; FallingBlocks local frame age
boss_falling_blocks_count EQU #C067   ; Falling block count
boss_falling_blocks_index EQU #C068   ; Current falling block lane index
boss_falling_blocks_landed_flags EQU #C069   ; Bitmask of lanes already converted to chars
boss_falling_blocks_rng EQU #C06A   ; Local FallingBlocks random seed
boss_falling_blocks_sprite_slot EQU #C06B   ; First HW sprite slot for falling blocks
boss_falling_blocks_color EQU #C06C   ; Falling block sprite color
boss_falling_blocks_pattern EQU #C06D   ; Falling block base pattern
boss_falling_blocks_speed EQU #C06E   ; Falling block speed
boss_falling_blocks_duration EQU #C06F   ; FallingBlocks max active frames
boss_falling_blocks_tile_char EQU #C070   ; Char written when a falling block lands
boss_falling_blocks_landing_y EQU #C071   ; Landing row in chars
boss_falling_blocks_behavior EQU #C072   ; Behavior byte written when a block lands
boss_falling_blocks_tile_x EQU #C073   ; Landing X char scratch
boss_falling_blocks_x0 EQU #C074   ; FallingBlocks lane 0 X
boss_falling_blocks_x1 EQU #C075   ; FallingBlocks lane 1 X
boss_falling_blocks_x2 EQU #C076   ; FallingBlocks lane 2 X
boss_falling_blocks_x3 EQU #C077   ; FallingBlocks lane 3 X
boss_meteor_age     EQU #C078   ; Boss meteor cycle age
boss_meteor_count   EQU #C079   ; Active meteor lanes
boss_meteor_index   EQU #C07A   ; Current meteor lane index
boss_meteor_base_x  EQU #C07B   ; First meteor lane X
boss_meteor_base_y  EQU #C07C   ; Meteor spawn Y
boss_meteor_sprite_slot EQU #C07D   ; First HW sprite slot for meteors
boss_meteor_color   EQU #C07E   ; Meteor sprite color
boss_meteor_pattern EQU #C07F   ; Meteor base pattern
boss_meteor_speed   EQU #C080   ; Meteor fall speed
boss_meteor_range   EQU #C081   ; Meteor fall range
boss_meteor_spread  EQU #C082   ; Meteor lane spacing
boss_meteor_warn    EQU #C083   ; Meteor warning frames
boss_bomb_age       EQU #C084   ; Boss bomb cycle age
boss_bomb_count     EQU #C085   ; Active bomb lanes
boss_bomb_index     EQU #C086   ; Current bomb lane index
boss_bomb_base_x    EQU #C087   ; First bomb lane X
boss_bomb_base_y    EQU #C088   ; Bomb spawn Y
boss_bomb_sprite_slot EQU #C089   ; First HW sprite slot for bombs
boss_bomb_color     EQU #C08A   ; Bomb sprite color
boss_bomb_pattern   EQU #C08B   ; Bomb base pattern
boss_bomb_explosion_pattern EQU #C08C   ; Bomb explosion pattern
boss_bomb_spread    EQU #C08D   ; Bomb lane spacing
boss_bomb_fuse      EQU #C08E   ; Bomb fuse frames
boss_bomb_radius    EQU #C08F   ; Bomb explosion radius
boss_bomb_duration  EQU #C090   ; Bomb explosion active frames
boss_boomerang_age  EQU #C091   ; Boss boomerang cycle age
boss_boomerang_base_x EQU #C092   ; Boomerang origin X
boss_boomerang_base_y EQU #C093   ; Boomerang origin Y
boss_boomerang_sprite_slot EQU #C094   ; HW sprite slot for boomerang
boss_boomerang_color EQU #C095   ; Boomerang sprite color
boss_boomerang_pattern EQU #C096   ; Boomerang base pattern
boss_boomerang_speed EQU #C097   ; Boomerang speed
boss_boomerang_range EQU #C098   ; Boomerang max distance
boss_boomerang_distance EQU #C099   ; Current boomerang distance from origin
boss_boomerang_direction EQU #C09A   ; Boomerang direction
boss_rock_age       EQU #C09B   ; Boss rock cycle age
boss_rock_base_x    EQU #C09C   ; Rock origin X
boss_rock_base_y    EQU #C09D   ; Rock origin Y
boss_rock_sprite_slot EQU #C09E   ; HW sprite slot for rock
boss_rock_color     EQU #C09F   ; Rock sprite color
boss_rock_pattern   EQU #C0A0   ; Rock base pattern
boss_rock_speed     EQU #C0A1   ; Rock speed
boss_rock_range     EQU #C0A2   ; Rock max travel distance
boss_rock_distance  EQU #C0A3   ; Current rock distance from origin
boss_rock_direction EQU #C0A4   ; Rock direction
boss_rock_arc_height EQU #C0A5   ; Rock parabolic arc height
boss_rock_arc_offset EQU #C0A6   ; Current rock arc offset
boss_laser_age      EQU #C0A7   ; Boss laser cycle age
boss_laser_base_x   EQU #C0A8   ; Laser origin X in pixels
boss_laser_base_y   EQU #C0A9   ; Laser origin Y in pixels
boss_laser_tile_char EQU #C0AA   ; Laser beam char code
boss_laser_length   EQU #C0AB   ; Laser length in chars
boss_laser_duration EQU #C0AC   ; Laser active frames
boss_laser_direction EQU #C0AD   ; Laser direction
boss_laser_index    EQU #C0AE   ; Current laser char index
boss_laser_origin_tile_x EQU #C0AF   ; Laser origin tile X
boss_laser_origin_tile_y EQU #C0B0   ; Laser origin tile Y
boss_laser_tile_x   EQU #C0B1   ; Current laser tile X
boss_laser_tile_y   EQU #C0B2   ; Current laser tile Y
boss_laser_write_mode EQU #C0B3   ; 0=draw laser, 1=restore map
boss_wave_age       EQU #C0B4   ; Boss sine-wave projectile cycle age
boss_wave_base_x    EQU #C0B5   ; Sine-wave projectile origin X
boss_wave_base_y    EQU #C0B6   ; Sine-wave projectile origin Y
boss_wave_sprite_slot EQU #C0B7   ; HW sprite slot for sine-wave projectile
boss_wave_color     EQU #C0B8   ; Sine-wave projectile sprite color
boss_wave_pattern   EQU #C0B9   ; Sine-wave projectile base pattern
boss_wave_speed     EQU #C0BA   ; Sine-wave projectile speed
boss_wave_range     EQU #C0BB   ; Sine-wave projectile max travel distance
boss_wave_distance  EQU #C0BC   ; Current sine-wave projectile distance
boss_wave_direction EQU #C0BD   ; Sine-wave projectile direction
boss_wave_amplitude EQU #C0BE   ; Sine-wave perpendicular amplitude
boss_wave_frequency EQU #C0BF   ; Frames per sine-wave phase step
boss_wave_phase     EQU #C0C0   ; Current sine-wave phase index
boss_wave_offset    EQU #C0C1   ; Signed sine-wave perpendicular offset
boss_homing_age     EQU #C0C2   ; Boss homing missile cycle age
boss_homing_base_x  EQU #C0C3   ; Homing missile origin X
boss_homing_base_y  EQU #C0C4   ; Homing missile origin Y
boss_homing_sprite_slot EQU #C0C5   ; HW sprite slot for homing missile
boss_homing_color   EQU #C0C6   ; Homing missile sprite color
boss_homing_pattern EQU #C0C7   ; Homing missile base pattern
boss_homing_speed   EQU #C0C8   ; Homing missile speed
boss_homing_range   EQU #C0C9   ; Homing missile max travel distance
boss_homing_distance EQU #C0CA   ; Current homing missile distance
boss_homing_direction EQU #C0CB   ; Homing missile launch direction
boss_homing_turn_step EQU #C0CC   ; Homing missile steering strength
boss_homing_turn_distance EQU #C0CD   ; Homing missile steering distance
autocontrol_screen_id EQU #C0CE   ; Screen id bound to current FakePlayer script
autocontrol_entity_index EQU #C0CF   ; Active FakePlayer entity index (#FF=none)
autocontrol_script_ptr_l EQU #C0D0   ; Current FakePlayer script pointer low byte
autocontrol_script_ptr_h EQU #C0D1   ; Current FakePlayer script pointer high byte
autocontrol_script_start_l EQU #C0D2   ; FakePlayer script start pointer low byte
autocontrol_script_start_h EQU #C0D3   ; FakePlayer script start pointer high byte
autocontrol_wait_frames EQU #C0D4   ; FakePlayer wait countdown in frames
autocontrol_move_opcode EQU #C0D5   ; Active FakePlayer movement opcode
autocontrol_move_remaining EQU #C0D6   ; Remaining FakePlayer movement pixels
autocontrol_loop_flag EQU #C0D7   ; 1=loop FakePlayer script on END
autocontrol_active EQU #C0D8   ; 1=FakePlayer script active
autoev_screen_id EQU #C0D9   ; Screen id bound to compact FakePlayer event script
autoev_entity_index EQU #C0DA   ; Active compact FakePlayer entity index (#FF=none)
autoev_script_ptr_l EQU #C0DB   ; Compact FakePlayer event pointer low byte
autoev_script_ptr_h EQU #C0DC   ; Compact FakePlayer event pointer high byte
autoev_script_start_l EQU #C0DD   ; Compact FakePlayer event start pointer low byte
autoev_script_start_h EQU #C0DE   ; Compact FakePlayer event start pointer high byte
autoev_wait_frames EQU #C0DF   ; Compact FakePlayer wait countdown in frames
autoev_move_axis EQU #C0E0   ; Compact move axis (1=x,2=y)
autoev_move_step EQU #C0E1   ; Compact move step (1 or #FF)
autoev_move_remaining EQU #C0E2   ; Remaining compact FakePlayer movement pixels
autoev_loop_flag EQU #C0E3   ; 1=loop compact FakePlayer event script
autoev_active EQU #C0E4   ; 1=compact FakePlayer event script active
autoev_wait_mode EQU #C0E5   ; 1=wait SPC, 2=wait typewriter
autoev_number_l EQU #C0E6   ; Parsed compact event number low byte
autoev_number_h EQU #C0E7   ; Parsed compact event number high byte
dialogue_active    EQU #C0E8   ; 1=dialogue box is open
dialogue_current_box EQU #C0E9   ; Current dialogue box config index
dialogue_text_active EQU #C0EA   ; 1=typewriter is writing text
dialogue_text_ptr_l EQU #C0EB   ; Dialogue typewriter text pointer low byte
dialogue_text_ptr_h EQU #C0EC   ; Dialogue typewriter text pointer high byte
dialogue_vram_ptr_l EQU #C0ED   ; Dialogue typewriter VRAM pointer low byte
dialogue_vram_ptr_h EQU #C0EE   ; Dialogue typewriter VRAM pointer high byte
dialogue_row_start_l EQU #C0EF   ; Current dialogue row start VRAM low byte
dialogue_row_start_h EQU #C0F0   ; Current dialogue row start VRAM high byte
dialogue_char_delay EQU #C0F1   ; Dialogue character delay countdown
dialogue_char_delay_reload EQU #C0F2   ; Dialogue character delay reload value
dialogue_box_vram_l EQU #C0F3   ; Dialogue box VRAM start low byte
dialogue_box_vram_h EQU #C0F4   ; Dialogue box VRAM start high byte
dialogue_box_width EQU #C0F5   ; Dialogue box width in chars
dialogue_box_height EQU #C0F6   ; Dialogue box height in chars
dialogue_box_tl_char EQU #C0F7   ; Dialogue top-left border char
dialogue_box_tr_char EQU #C0F8   ; Dialogue top-right border char
dialogue_box_bl_char EQU #C0F9   ; Dialogue bottom-left border char
dialogue_box_br_char EQU #C0FA   ; Dialogue bottom-right border char
dialogue_box_h_char EQU #C0FB   ; Dialogue horizontal border char
dialogue_box_v_char EQU #C0FC   ; Dialogue vertical border char
dialogue_graphic_enabled EQU #C0FD   ; 1=dialogue tile graphic is visible
dialogue_graphic_vram_l EQU #C0FE   ; Dialogue graphic VRAM start low byte
dialogue_graphic_vram_h EQU #C0FF   ; Dialogue graphic VRAM start high byte
dialogue_graphic_ptr_l EQU #C100   ; Dialogue graphic tile data pointer low byte
dialogue_graphic_ptr_h EQU #C101   ; Dialogue graphic tile data pointer high byte
dialogue_graphic_width EQU #C102   ; Dialogue graphic width in chars
dialogue_graphic_height EQU #C103   ; Dialogue graphic height in chars
current_flow_state  EQU #C104   ; Current game flow state
prev_flow_state     EQU #C105   ; Previous game flow state
gameflow_exit_requested EQU #C106   ; Exit flag for WorldLink loop
gameflow_menu_selection EQU #C107   ; Current/last submenu selection
gameflow_submenu_data_ptr EQU #C108   ; Pointer to active submenu data (16-bit)
gameflow_submenu_option_count EQU #C10A   ; Cached submenu option count
gameflow_submenu_cursor_enabled EQU #C10B   ; 1 when submenu uses sprite cursor
gameflow_submenu_cursor_layer_count EQU #C10C   ; Cursor sprite layer count (1..4)
gameflow_condition_result EQU #C10D   ; Result of last condition evaluation
transition_delay_var    EQU #C10E   ; Frames per step for active transition effect

; ==================================================================
; MIDEAS GLOBAL VARIABLES (DEFAULTS + CUSTOM)
; ==================================================================
global_var_score     EQU #C10F   ; Current player score (0-65535) (16-bit)
global_var_lives     EQU #C111   ; Remaining lives (0-255) (8-bit)

; ==================================================================
; SYSTEM VARIABLES
; ==================================================================
ROM_slot            EQU #C112   ; Expanded slot for normal page 1 ROM access
slot_primary_normal EQU #C113   ; Primary slot register snapshot for BIOS-ROM-ROM-RAM layout
page0_bios_slot     EQU #C114   ; Expanded slot for normal BIOS page 0
page2_normal_slot   EQU #C115   ; Expanded slot for normal page 2 layout
page3_normal_slot   EQU #C116   ; Expanded slot for normal RAM page 3
slot_subslot_normal EQU #C117   ; Raw subslot register snapshot for normal page 3 expanded slot
mapper_bank_p1_current EQU #C118   ; Mapper current bank for page/window 1
mapper_bank_p2_current EQU #C119   ; Mapper current bank for page/window 2
mapper_bank_p3_current EQU #C11A   ; Mapper current bank for page/window 3
mapper_bank_p4_current EQU #C11B   ; Mapper current bank for page/window 4
mapper_saved_bank    EQU #C11C   ; Saved mapper bank for push/pop helpers
mapper_saved_bank_p1 EQU #C11D   ; Saved mapper bank for page/window 1 helpers
mapper_saved_bank_p3 EQU #C11E   ; Saved mapper bank for page/window 3 helpers
mapper_saved_bank_p4 EQU #C11F   ; Saved mapper bank for page/window 4 helpers
resource_descriptor_ptr EQU #C120   ; Pointer to cached resource descriptor entry (16-bit)
resource_descriptor_id EQU #C122   ; Cached resource id
resource_descriptor_type EQU #C123   ; Cached resource type
resource_descriptor_group EQU #C124   ; Cached resource group
resource_descriptor_bank EQU #C125   ; Cached resource bank
resource_descriptor_addr EQU #C126   ; Cached resource visible address (16-bit)
resource_descriptor_size EQU #C128   ; Cached resource size (16-bit)
resource_descriptor_uncompressed_size EQU #C12A   ; Cached resource uncompressed size (16-bit)
resource_descriptor_flags EQU #C12C   ; Cached resource flags
vram_cache_tile_patterns_ready EQU #C12D   ; 1 when shared gameplay tile patterns are already resident in VRAM
vram_cache_tile_colors_ready EQU #C12E   ; 1 when shared gameplay tile colors are already resident in VRAM
vram_cache_font_ready EQU #C12F   ; 1 when shared font patterns/colors are already resident in VRAM
resource_ram_cache_screen_layout_id EQU #C130   ; Cached resource id for runtime_background_layout source
resource_ram_cache_effects_layout_id EQU #C131   ; Cached resource id for runtime_effects_layout source
resource_ram_cache_effect_zone_table_id EQU #C132   ; Cached resource id for runtime_effect_zone_table source
current_screen2_tilebank_id EQU #C133   ; Current SCREEN 2 shared tilebank loaded in VRAM (#FF=none/unknown)
frame_counter       EQU #C134   ; Frame counter (16-bit)

; Profiling counters (16-bit, cumulative)
prof_update_all_entities_calls EQU #C136   ; Calls to update_all_entities
prof_execute_sm_calls EQU #C138   ; Calls to execute_all_state_machines
prof_sm_update_calls  EQU #C13A   ; Calls to SM_Update
prof_collision_calls  EQU #C13C   ; Calls to update_collision_component
prof_wall_calls       EQU #C13E   ; Calls to update_wallcollision_component
prof_deadly_calls     EQU #C140   ; Calls to update_deadly_tiles_component
prof_tile_interaction_calls EQU #C142   ; Calls to check_tile_interaction
prof_animation_calls  EQU #C144   ; Calls to update_animation_component
prof_sprite_calls     EQU #C146   ; Calls to update_sprite_component
prof_music_task_calls EQU #C148   ; Calls to task_update_music
prof_deadly_behavior_reads EQU #C14A   ; Deadly helper behavior-map reads
; page0_transfer_buffer shares the ZX0 scratch area declared near RAM_USAGE_END.

; ==================================================================
; SCREEN MAP POINTERS (Current active screen)
; ==================================================================
current_screen_layout   EQU #C14C   ; Pointer to current screen layout data (16-bit)
current_screen_layout_bank EQU #C14E   ; Mapper bank for current screen layout data
current_behavior_map    EQU #C14F   ; Pointer to current behavior map data (16-bit)
current_behavior_map_bank EQU #C151   ; Mapper bank for current behavior map data
behavior_cache_row     EQU #C152   ; Cached behavior row (255=invalid)
behavior_cache_map_l   EQU #C153   ; Cached behavior map pointer low byte
behavior_cache_map_h   EQU #C154   ; Cached behavior map pointer high byte
behavior_cache_row_base EQU #C155   ; Cached row base address in behavior map (16-bit)
RUNTIME_SCREEN_MAP_SIZE EQU 768
MAX_RUNTIME_EFFECT_ZONES EQU 0
runtime_background_layout EQU #C157   ; Immutable copy of current background layout (32x24)
runtime_screen_layout  EQU #C457   ; Mutable copy of current screen layout (32x24)
runtime_behavior_map   EQU #C757   ; Mutable copy of current behavior map (32x24)
runtime_interaction_type_map EQU #CA57   ; Mutable copy of current interaction type map (32x24)
runtime_interaction_value_map EQU #CD57   ; Mutable copy of current interaction value map (32x24)
runtime_interaction_target_map EQU #D057   ; Mutable copy of current interaction target map (32x24)
runtime_char_behavior_table EQU #D357   ; Current screen char -> behavior lookup table (256 bytes)
runtime_effects_layout EQU #D457   ; Alternate effects layout copy for secret zones (32x24)
screen_block_catalog_ptr EQU #D757   ; Scratch pointer to current screen block catalog during layout expansion
screen_block_map_ptr EQU #D759   ; Scratch pointer to current screen block index map during layout expansion
runtime_effect_zone_table EQU #D75B   ; Current screen effect zone table (0 bytes)
current_effect_zone_count EQU #D75B   ; Number of effect zones copied into runtime_effect_zone_table
secret_zone_active EQU #D75C   ; 1 if hero is currently inside an active secret zone
secret_zone_rect_x EQU #D75D   ; Active secret zone rect X in cells
secret_zone_rect_y EQU #D75E   ; Active secret zone rect Y in cells
secret_zone_rect_w EQU #D75F   ; Active secret zone rect width in cells
secret_zone_rect_h EQU #D760   ; Active secret zone rect height in cells

; ==================================================================
; VIEWPORT/CAMERA VARIABLES (for scroll system)
; ==================================================================
camera_x            EQU #D761   ; Camera X position in pixels (16-bit)
camera_y            EQU #D763   ; Camera Y position in pixels (16-bit)
camera_tile_x       EQU #D765   ; Camera tile X (column)
camera_tile_y       EQU #D766   ; Camera tile Y (row)
world_width_tiles   EQU #D767   ; World width in tiles
world_height_tiles  EQU #D768   ; World height in tiles
scroll_dirty_flag   EQU #D769   ; 1=viewport changed, needs redraw
hud_dirty_flag      EQU #D76A   ; 1=HUD needs redraw, 0=clean
time_second_frame_counter EQU #D76B   ; VBlank frames remaining until the next TimeRemaining decrement
time_last_interrupt_counter EQU #D76C   ; Last interrupt_counter snapshot used by TimeRemaining sync (16-bit)

; ==================================================================
; ANIMATED TILES VARIABLES
; ==================================================================
anim_tile_timer     EQU #D76E   ; Animation frame timer
anim_tile_frame     EQU #D76F   ; Current animation frame (0-3)
anim_tile_speed     EQU #D770   ; Frames between animation updates

; ==================================================================
; ENTITY SYSTEM VARIABLES (Fixed 32 entities)
; ==================================================================
MAX_ENTITIES        EQU 32
entity_active       EQU #D771   ; Entity active flags (32 bytes, 0=inactive, 1=active)
entity_is_player    EQU #D791   ; Entity hero/player flag (32 bytes, 0=no, 1=yes)
entity_button_contact_active EQU #D7B1   ; 1 while entity stays on the same button tile (32 bytes)
entity_button_contact_x EQU #D7D1   ; Button tile X currently latched per entity (32 bytes)
entity_button_contact_y EQU #D7F1   ; Button tile Y currently latched per entity (32 bytes)
entity_on_ladder   EQU #D811   ; 1 while entity is centered on a ladder tile (32 bytes)
entity_gate_current_step EQU #D831   ; Current applied retract step (32 bytes)
entity_gate_step_timer EQU #D851   ; Countdown until next retract step (32 bytes)
entity_walljump_lock EQU #D871   ; Remaining horizontal lock frames after wall jump (32 bytes)
entity_walljump_locked_vx EQU #D891   ; Horizontal velocity preserved while wall jump lock is active (32 bytes)
entity_wallgrab_active EQU #D8B1   ; 1 if entity is currently grabbing a wall (32 bytes)
entity_wallgrab_grace EQU #D8D1   ; Frames to keep wall grab during transient wall flag gaps (32 bytes)
entity_wallgrab_timer EQU #D8F1   ; Remaining wall-grab frames until grounded reset (32 bytes)
entity_wallgrab_lockout EQU #D911   ; Wall grab disabled until grounded after timer is spent (32 bytes)
entity_walljump_anim_active EQU #D931   ; Wall jump one-shot animation is waiting to restore base sprite (32 bytes)
entity_x_pos        EQU #D951   ; Entity X positions (32 bytes)
entity_y_pos        EQU #D971   ; Entity Y positions (32 bytes)
entity_vel_x        EQU #D991   ; Entity X velocity (32 bytes)
entity_vel_y        EQU #D9B1   ; Entity Y velocity (32 bytes)
entity_comp_masks   EQU #D9D1   ; Entity component masks (32 bytes)
entity_comp_masks_hi EQU #D9F1   ; Entity component masks high byte (32 bytes)
entity_screen_id    EQU #DA11   ; Entity screen ID (32 bytes)
entity_job_period   EQU #DA31   ; Entity job period in frames (32 bytes, 1=100%,2=50%,3=33%,4=25%)
entity_job_entry    EQU #DA51   ; Entity job entry slot within period window (32 bytes)
entity_job_scheduler_active EQU #DA71   ; 1 when any entity uses non-default job cadence
entity_dir_mask     EQU #DA72   ; Entity direction mask (32 bytes)
entity_input_speed  EQU #DA92   ; Entity input/cursor speed (32 bytes)
entity_health       EQU #DAB2   ; Entity health (32 bytes)
entity_anim_frame   EQU #DAD2   ; Entity animation frame (32 bytes)
entity_anim_tick    EQU #DAF2   ; Entity animation tick counter (32 bytes)
entity_anim_speed   EQU #DB12   ; Entity animation speed (ticks per frame) (32 bytes)
entity_anim_flags   EQU #DB32   ; Entity animation flags (32 bytes)
entity_sm_ptr_l     EQU #DB52   ; Entity State Pointer Low (32 bytes)
entity_sm_ptr_h     EQU #DB72   ; Entity State Pointer High (32 bytes)
entity_sm_timer_l   EQU #DB92   ; Entity State Timer Low (32 bytes)
entity_sm_timer_h   EQU #DBB2   ; Entity State Timer High (32 bytes)
entity_sm_wait_timer EQU #DBD2   ; Entity State Wait Timer (32 bytes)
entity_sm_sprite_control EQU #DBF2   ; 1 when the assigned state machine explicitly drives sprite changes (32 bytes)
entity_lifetime     EQU #DC12   ; Entity lifetime for auto-destroy (32 bytes, 0=infinite)
entity_collectible_enabled EQU #DC32   ; 1 when entity has Collectible component (32 bytes)
entity_carried_by   EQU #DC52   ; Entity carrier ID (32 bytes, 255=not carried)
entity_template_token EQU #DC72   ; Entity template token (32 bytes, 0=unknown)
entity_facing_dir   EQU #DC92   ; Last facing direction (32 bytes, 0=none,1=left,2=right,3=up,4=down)
entity_sm_var_0     EQU #DCB2   ; Entity Variable 0 (32 bytes)
entity_sm_var_1     EQU #DCD2   ; Entity Variable 1 (32 bytes)
entity_sm_var_2     EQU #DCF2   ; Entity Variable 2 (32 bytes)
entity_sm_var_3     EQU #DD12   ; Entity Variable 3 (32 bytes)
entity_sm_var_4     EQU #DD32   ; Entity Variable 4 (32 bytes)
entity_sm_var_5     EQU #DD52   ; Entity Variable 5 (32 bytes)
entity_sm_var_6     EQU #DD72   ; Entity Variable 6 (32 bytes)
entity_sm_var_7     EQU #DD92   ; Entity Variable 7 (32 bytes)

; ==================================================================
; SPRITE SYSTEM VARIABLES
; ==================================================================
entity_sprite_asset_index EQU #DDB2   ; Entity sprite asset index - RAM copy (32 bytes)
entity_sprite_config EQU #DDD2   ; Entity sprite config RAM copy (base HW sprite + layer count, 64 bytes)
sprite_asset_frame_count EQU #DE12   ; Sprite asset frame counts RAM copy (18 bytes)
sprite_asset_layer_count EQU #DE24   ; Sprite asset layer counts RAM copy (18 bytes)
sprite_loop_flags EQU #DE36   ; Sprite loop flags RAM copy (18 bytes)
sprite_dir_left_table EQU #DE48   ; Directional sprite lookup RAM copy (18 bytes)
sprite_dir_right_table EQU #DE5A   ; Directional sprite lookup RAM copy (18 bytes)
sprite_dir_up_table EQU #DE6C   ; Directional sprite lookup RAM copy (18 bytes)
sprite_dir_down_table EQU #DE7E   ; Directional sprite lookup RAM copy (18 bytes)
SM_SpriteLayerColorTable EQU #DE90   ; Runtime SM sprite layer colors (18*2 bytes)
SM_SpriteLayerYOffsetTable EQU #DEB4   ; Runtime SM sprite layer Y offsets (18*2 bytes)
active_sprite_count EQU #DED8   ; Number of sprites currently active
sprites_dirty      EQU #DED9   ; 1=sprite_attributes changed, needs VRAM sync
sprite_pattern      EQU #DEDA   ; Sprite pattern IDs (32 bytes)
sprite_color        EQU #DEFA   ; Sprite colors (32 bytes)
sprite_layer_colors EQU #DF1A   ; HW sprite layer color cache - RAM copy (32 bytes, indexed by HW sprite index)
sprite_layer_y_offsets EQU #DF3A   ; HW sprite layer signed Y offsets - RAM copy (32 bytes, indexed by HW sprite index)
sprite_asset_base_pattern_slot_runtime EQU #DF5A   ; Runtime base 16x16 slot per sprite asset (18 bytes)
sprite_placeholder_base_pattern_num EQU #DF6C   ; Runtime placeholder pattern number (base slot * 4)
current_sprite_pattern_pack_id EQU #DF6D   ; Active runtime sprite pattern pack id (#FF=none loaded)
sprite_attributes   EQU #DF6E   ; Interleaved sprite attributes (32 * 4 bytes)

; ==================================================================
; SCREEN SYSTEM VARIABLES (5 screens detected)
; ==================================================================
current_screen_id   EQU #DFEE   ; Currently displayed screen ID
current_screen_engine EQU #DFEF   ; Runtime engine: 0=Player, 1=FakePlayer
screen_dirty_flag   EQU #DFF0   ; Screen needs redraw flag
screen_transition_cooldown EQU #DFF1   ; Cooldown frames after screen transition
current_world_id    EQU #DFF2   ; Current world ID (for multi-world support)
current_screen_index EQU #DFF3   ; Current screen index within world
current_screen_anim_group_count EQU #DFF4   ; Animated tile groups visible in current screen
current_screen_entity_count EQU #DFF5   ; Entity instances assigned to current screen
current_screen_sprite_pattern_slots EQU #DFF6   ; Sprite pattern slots needed by current screen
current_screen_summary_flags EQU #DFF7   ; Runtime screen summary flags (music/hud/effects/anim)

; ==================================================================
; PLAYER SYSTEM VARIABLES (player entity detected)
; ==================================================================
player_x            EQU #DFF8   ; Player X position (16-bit)
player_y            EQU #DFFA   ; Player Y position (16-bit)
player_runtime_enabled EQU #DFFC   ; 1=player fast runtime bound to hero entity
player_entity_index EQU #DFFD   ; Entity index used by player fast runtime (#FF=none)
player_vx_runtime   EQU #DFFE   ; Cached player X velocity (signed 8-bit)
player_vy_runtime   EQU #DFFF   ; Cached player Y velocity (signed 8-bit)
player_dash_timer   EQU #E000   ; Frames remaining in current Player dash
player_dash_cooldown EQU #E001   ; Frames until Player can dash again
player_dash_dir     EQU #E002   ; Player dash direction (1=left,2=right,3=up,4=down)
player_dash_tile_x  EQU #E003   ; Dash front probe tile X scratch
player_dash_tile_y  EQU #E004   ; Dash front probe tile Y scratch
player_health       EQU #E005   ; Player health points
player_score        EQU #E006   ; Player score (16-bit)
gem_count           EQU #E008   ; Collectible tile counter (8-bit)
last_interaction_char EQU #E009   ; Char code of last interacted tile (for SM VARIABLE_COMPARE)
last_gem_char       EQU last_interaction_char   ; Backwards-compatible alias for collectible SM checks
last_interaction_pending EQU #E00A   ; 1 when a new tile interaction is pending for State Machine logic
last_interaction_type EQU #E00B   ; Interaction type id of last interacted tile
last_interaction_value EQU #E00C   ; Interaction value byte of last interacted tile
last_interaction_target EQU #E00D   ; Interaction target id of last interacted tile
last_interaction_x  EQU #E00E   ; Tile X coordinate of last interaction
last_interaction_y  EQU #E00F   ; Tile Y coordinate of last interaction
last_interaction_entity EQU #E010   ; Entity index that triggered the last interaction

; Persistent collectibles list (survives screen re-entry)
MAX_COLLECTIBLES     EQU 64              ; Max persistent collectible records
collected_count      EQU #E011   ; Number of collected tiles recorded (8-bit)
collected_world      EQU #E012   ; World IDs for each collected tile (MAX_COLLECTIBLES bytes)
collected_screen     EQU #E052   ; Screen IDs for each collected tile (MAX_COLLECTIBLES bytes)
collected_idx_l      EQU #E092   ; Tile name-table index low byte (MAX_COLLECTIBLES bytes)
collected_idx_h      EQU #E0D2   ; Tile name-table index high byte (MAX_COLLECTIBLES bytes)

; Timed bonus tile respawn slots (bonus gem regeneration)
MAX_BONUS_RESPAWNS   EQU 16              ; Max timed bonus tiles waiting to respawn
bonus_respawn_world  EQU #E112   ; World IDs for timed bonus respawns (MAX_BONUS_RESPAWNS bytes)
bonus_respawn_screen EQU #E122   ; Screen IDs for timed bonus respawns (MAX_BONUS_RESPAWNS bytes)
bonus_respawn_idx_l  EQU #E132   ; Tile index low byte for timed respawns (MAX_BONUS_RESPAWNS bytes)
bonus_respawn_idx_h  EQU #E142   ; Tile index high byte for timed respawns (MAX_BONUS_RESPAWNS bytes)
bonus_respawn_secs   EQU #E152   ; Remaining seconds per timed respawn slot (MAX_BONUS_RESPAWNS bytes)
bonus_respawn_frames EQU #E162   ; Frame countdown (60..1) per timed respawn slot (MAX_BONUS_RESPAWNS bytes)

; ==================================================================
; AUXILIARY VARIABLES 
; ==================================================================
deterministic        EQU #E172   ; Deterministic mode flag

; ==================================================================
; TEMPORARY VARIABLES (ALWAYS NEEDED)
; ==================================================================
temp_word_1         EQU #E173   ; Temporary 16-bit storage
temp_word_2         EQU #E175   ; Temporary 16-bit storage
temp_byte_1         EQU #E177   ; Temporary 8-bit storage
temp_byte_2         EQU #E178   ; Temporary 8-bit storage
temp_byte_3         EQU #E179   ; Temporary 8-bit storage (32 bytes)
temp_byte_4         EQU #E199   ; Temporary 8-bit storage (32 bytes)
temp_byte_5         EQU #E1B9   ; Temporary 8-bit storage (32 bytes)
temp_byte_6         EQU #E1D9   ; Temporary 8-bit storage (32 bytes)

; ==================================================================
; SOUND SYSTEM VARIABLES
; ==================================================================
sfx_active          EQU #E1F9   ; 0=no SFX active, 1=playing
sfx_timer           EQU #E1FA   ; Frames remaining for current SFX
sfx_fadeout         EQU #E1FB   ; Reserved fadeout flag/state
temp_byte_7         EQU #E1FC   ; Temporary 8-bit storage (32 bytes)
temp_byte_8         EQU #E21C   ; Temporary 8-bit storage (32 bytes)
temp_byte_9         EQU #E23C   ; Temporary 8-bit storage (32 bytes)
temp_byte_10        EQU #E25C   ; Temporary 8-bit storage (32 bytes)
temp_byte_11        EQU #E27C   ; Temporary 8-bit storage (32 bytes)
temp_byte_12        EQU #E29C   ; Temporary 8-bit storage (32 bytes)
temp_byte_13        EQU #E2BC   ; Temporary 8-bit storage (32 bytes)
temp_byte_14        EQU #E2DC   ; Temporary 8-bit storage (32 bytes)
temp_byte_15        EQU #E2FC   ; Temporary 8-bit storage (32 bytes)
temp_byte_16        EQU #E31C   ; Temporary 8-bit storage (32 bytes)
temp_byte_17        EQU #E33C   ; Temporary 8-bit storage (32 bytes)
temp_byte_18        EQU #E35C   ; Temporary 8-bit storage (32 bytes)
temp_byte_19        EQU #E37C   ; Temporary 8-bit storage (32 bytes)
temp_byte_20        EQU #E39C   ; Temporary 8-bit storage (32 bytes)
temp_byte_21        EQU #E3BC   ; Temporary 8-bit storage (32 bytes)
temp_byte_22        EQU #E3DC   ; Temporary 8-bit storage (32 bytes)
temp_byte_23        EQU #E3FC   ; Temporary 8-bit storage (32 bytes)
temp_byte_24        EQU #E41C   ; Temporary 8-bit storage (32 bytes)
temp_byte_25        EQU #E43C   ; Temporary 8-bit storage (32 bytes)
temp_word_3         EQU #E45C   ; Temporary 16-bit storage (64 bytes)
temp_word_4         EQU #E49C   ; Temporary 16-bit storage (64 bytes)
temp_byte_26        EQU #E4DC   ; Temporary 8-bit storage (32 bytes)
temp_byte_27        EQU #E4FC   ; Temporary 8-bit storage (32 bytes)
temp_byte_28        EQU #E51C   ; Temporary 8-bit storage (32 bytes)
tileDead_dbg        EQU #E53C   ; Debug byte: current hero deadly contact
tileDead_latched_dbg EQU #E53D   ; Debug byte: latched hero deadly contact
tileDead_x_dbg      EQU #E53E   ; Debug byte: last sampled deadly tile X
tileDead_y_dbg      EQU #E53F   ; Debug byte: last sampled deadly tile Y
tileDead_value_dbg  EQU #E540   ; Debug byte: last raw deadly behavior value

; Wall collision temporary variables
wall_temp_x         EQU #E541   ; Cached entity X for wall checks
wall_temp_y         EQU #E542   ; Cached entity Y for wall checks
wall_hit_left       EQU #E543   ; Hitbox left edge cache
wall_hit_top        EQU #E544   ; Hitbox top edge cache
wall_hit_right      EQU #E545   ; Hitbox right edge cache
wall_hit_bottom     EQU #E546   ; Hitbox bottom edge cache
wall_hit_w          EQU #E547   ; Hitbox width cache (min 1)
wall_hit_h          EQU #E548   ; Hitbox height cache (min 1)
wall_probe_left     EQU #E549   ; X probe near hitbox left (adaptive inset)
wall_probe_right    EQU #E54A   ; X probe near hitbox right (adaptive inset)
wall_probe_top      EQU #E54B   ; Y probe near hitbox top (adaptive inset)
wall_probe_bottom   EQU #E54C   ; Y probe near hitbox bottom (adaptive inset)

; Unified update helpers
active_entity_list  EQU #E54D   ; Entity indices with non-zero component masks (MAX_ENTITIES bytes)
active_entity_count EQU #E56D   ; Number of entries in active_entity_list
hero_entity_id      EQU #E56E   ; First current-screen entity flagged as player (#FF = none)
active_entity_list_dirty EQU #E56F   ; 1=rebuild active_entity_list required
input_entity_list   EQU #E570   ; Active current-screen entities with Input component (MAX_ENTITIES bytes)
input_entity_count  EQU #E590   ; Number of entries in input_entity_list
render_entity_list  EQU #E591   ; Active current-screen entities with Sprite component (MAX_ENTITIES bytes)
render_entity_count EQU #E5B1   ; Number of entries in render_entity_list
collision_entity_list EQU #E5B2   ; Active current-screen entities with Collision component (MAX_ENTITIES bytes)
collision_entity_count EQU #E5D2   ; Number of entries in collision_entity_list
ground_entity_list  EQU #E5D3   ; Active current-screen entities with Collision or Gravity (MAX_ENTITIES bytes)
ground_entity_count EQU #E5F3   ; Number of entries in ground_entity_list
anim_entity_list    EQU #E5F4   ; Active current-screen entities with Animation+Sprite (MAX_ENTITIES bytes)
anim_entity_count   EQU #E614   ; Number of entries in anim_entity_list

; Entity-entity collision optimized variables
coll_list           EQU #E615   ; Active collidable entity indices (MAX_ENTITIES bytes)
coll_list_count     EQU #E635   ; Number of entities in coll_list
coll_src_left       EQU #E636   ; Source AABB left edge (scratch)
coll_src_right      EQU #E637   ; Source AABB right edge (scratch)
coll_src_top        EQU #E638   ; Source AABB top edge (scratch)
coll_src_bottom     EQU #E639   ; Source AABB bottom edge (scratch)

; ==================================================================
; INTERRUPT SYSTEM VARIABLES (dynamically allocated)
; ==================================================================
task_table              EQU #E63A   ; Task table base (8 slots x 2 bytes = 16 bytes)
task_0_ptr              EQU #E63A   ; Slot 0 pointer (2 bytes)
task_1_ptr              EQU #E63C   ; Slot 1 pointer (2 bytes)
task_2_ptr              EQU #E63E   ; Slot 2 pointer (2 bytes)
task_3_ptr              EQU #E640   ; Slot 3 pointer (2 bytes)
task_4_ptr              EQU #E642   ; Slot 4 pointer (2 bytes)
task_5_ptr              EQU #E644   ; Slot 5 pointer (2 bytes)
task_6_ptr              EQU #E646   ; Slot 6 pointer (2 bytes)
task_7_ptr              EQU #E648   ; Slot 7 pointer (2 bytes)
interrupt_system_enabled EQU #E64A   ; 0=disabled, 1=enabled (1 byte)
old_htimi_hook          EQU #E64B   ; Original H.TIMI hook (5 bytes)
interrupt_counter       EQU #E650   ; Frame counter (16-bit)
task_exec_time          EQU #E652   ; Cycles used by tasks (16-bit, debug)
vblank_flag             EQU #E654   ; Set to 1 on each VBlank (1 byte)
interrupt_in_progress   EQU #E655   ; 1 while the H.TIMI dispatcher is running
RAM_INTERRUPT_END       EQU #E656   ; End of interrupt system

; ==================================================================
; STATE MACHINE SOUND RUNTIME (one active sound asset)
; ==================================================================
sm_sound_active       EQU #E656   ; 0=idle, 1=playing state-machine sound asset
sm_sound_frames_left  EQU #E657   ; Frames left for current state-machine sound asset
sm_sound_ptr_l        EQU #E658   ; Next sound frame pointer low byte
sm_sound_ptr_h        EQU #E659   ; Next sound frame pointer high byte

; ==================================================================
; TRACKER MUSIC RUNTIME
; ==================================================================
music_active         EQU #E65A   ; 0=stopped, 1=track active
music_muted          EQU #E65B   ; 0=audible, 1=muted/pause
music_loop           EQU #E65C   ; 0=no loop, 1=loop enabled
music_track_index    EQU #E65D   ; Current ROM track index
music_row_frames     EQU #E65E   ; Frames per tracker row
music_row_countdown  EQU #E65F   ; Countdown to next row
music_order_pos      EQU #E660   ; Current order position
music_pattern_index  EQU #E661   ; Current pattern index
music_pattern_row    EQU #E662   ; Current row inside pattern
music_pattern_rows   EQU #E663   ; Cached rows in current pattern
music_track_ptr_l    EQU #E664   ; Current track pointer low byte
music_track_ptr_h    EQU #E665   ; Current track pointer high byte
music_pattern_ptr_l  EQU #E666   ; Current pattern rows pointer low byte
music_pattern_ptr_h  EQU #E667   ; Current pattern rows pointer high byte
music_mixer_shadow   EQU #E668   ; PSG mixer shadow for music runtime
music_pitch_note_work EQU #E669   ; Scratch note index while resolving tone/ornament macros
music_pitch_step_work EQU #E66A   ; Scratch macro step while resolving tone/ornament macros
music_pitch_len_work  EQU #E66B   ; Scratch macro length while resolving tone/ornament macros
music_ch_note_base EQU #E66C   ; Current note index (255=silent) (3 bytes)
music_ch_a_note EQU #E66C   ; Channel A
music_ch_b_note EQU #E66D   ; Channel B
music_ch_c_note EQU #E66E   ; Channel C
music_ch_instrument_base EQU #E66F   ; Current instrument id (0=none) (3 bytes)
music_ch_a_instrument EQU #E66F   ; Channel A
music_ch_b_instrument EQU #E670   ; Channel B
music_ch_c_instrument EQU #E671   ; Channel C
music_ch_ornament_base EQU #E672   ; Current ornament id (0=none) (3 bytes)
music_ch_a_ornament EQU #E672   ; Channel A
music_ch_b_ornament EQU #E673   ; Channel B
music_ch_c_ornament EQU #E674   ; Channel C
music_ch_volume_base EQU #E675   ; Current base volume (0-15) (3 bytes)
music_ch_a_volume EQU #E675   ; Channel A
music_ch_b_volume EQU #E676   ; Channel B
music_ch_c_volume EQU #E677   ; Channel C
music_ch_vol_step_base EQU #E678   ; Reserved software volume envelope step (3 bytes)
music_ch_a_vol_step EQU #E678   ; Channel A
music_ch_b_vol_step EQU #E679   ; Channel B
music_ch_c_vol_step EQU #E67A   ; Channel C
music_ch_tone_step_base EQU #E67B   ; Reserved software tone envelope step (3 bytes)
music_ch_a_tone_step EQU #E67B   ; Channel A
music_ch_b_tone_step EQU #E67C   ; Channel B
music_ch_c_tone_step EQU #E67D   ; Channel C
music_ch_noise_step_base EQU #E67E   ; Reserved software noise envelope step (3 bytes)
music_ch_a_noise_step EQU #E67E   ; Channel A
music_ch_b_noise_step EQU #E67F   ; Channel B
music_ch_c_noise_step EQU #E680   ; Channel C
music_ch_orn_step_base EQU #E681   ; Reserved ornament step (3 bytes)
music_ch_a_orn_step EQU #E681   ; Channel A
music_ch_b_orn_step EQU #E682   ; Channel B
music_ch_c_orn_step EQU #E683   ; Channel C
music_ch_hw_env_step_base EQU #E684   ; Software hardware-envelope divider step (3 bytes)
music_ch_a_hw_env_step EQU #E684   ; Channel A
music_ch_b_hw_env_step EQU #E685   ; Channel B
music_ch_c_hw_env_step EQU #E686   ; Channel C

; ==================================================================
; ZX0 TEMPORARY RAM BUFFERS
; ==================================================================
; Compact scratch layout placed strictly after RAM_USAGE_END.
; Screen/behavior/tile buffers share the same large work area because they
; are decompressed and consumed sequentially, never concurrently.
; Font and sprite frame buffers are injected later by the ZX0 post-processor
; only when compression selects those blocks; they share scratch there too.
ZX0_SCREEN_BUFFER       EQU #E700   ; Screen/layout scratch (shares 1488-byte area)
ZX0_BEHAVIOR_BUFFER     EQU #E700   ; Behavior map scratch (shares 1488-byte area)
ZX0_TILE_PATTERN_BUFFER EQU #E700   ; Tile pattern scratch (shares 1488-byte area)
ZX0_TILE_COLOR_BUFFER   EQU #E700   ; Tile color scratch (shares 1488-byte area)
ZX0_VRAM_TRANSFER_BUFFER EQU #E700  ; Fast ROM-to-VRAM staging for compressed resources that fit the shared scratch
ZX0_VRAM_TRANSFER_BUFFER_SIZE EQU 1488   ; Staging threshold; larger MegaROM resources decode direct to VRAM
ZX0_VRAM_TRANSFER_BUFFER_LIMIT_HIGH EQU #05   ; High byte for BC <= staging threshold
ZX0_VRAM_TRANSFER_BUFFER_LIMIT_NEXT_LOW EQU #D1   ; Low byte one past threshold when high bytes match
page0_transfer_buffer   EQU #E700   ; Page-0 copy staging buffer (shares scratch area)
ZX0_SCRATCH_END         EQU #ECD0   ; First byte after shared ZX0 scratch area

; ==================================================================
; END OF VARIABLES
; ==================================================================
RAM_USAGE_END       EQU #E687   ; End of project variables (9863 bytes used)

; ==================================================================
; MEMORY LAYOUT INFO (Reference only - no code generated)
; ==================================================================
; RAM Layout:
;   #C000-#E687: Project variables (9863 bytes)
;   #E687-#E700: Alignment padding/free RAM (121 bytes)
;   #E700-#ECCF: Shared ZX0 scratch (1488 bytes, do not use for persistent vars)
;   #ECD0-#F37F: Free RAM after scratch (~1712 bytes available)
;   #F380-#FFFF: MSX System variables (DO NOT TOUCH)
;
; NOTE: Variables are defined using EQU (address labels only).
;       RAM space is used at runtime, NOT reserved in ROM.
;       Do NOT use ORG #C000 in cartridge ROMs!
; ==================================================================


; ==================================================================
; MAPPER RUNTIME API
; File: mapper.asm
; Description: Centralized mapper register writes (no scattered inline writes)
; Target mapper: konami
; ROM mode: megarom (autoMegaROM=false)
; ==================================================================

; Konami (without SCC) write window references:
;   6000h-7FFFh, 8000h-9FFFh, A000h-BFFFh are switch registers.
; Note: in original Konami cartridges 4000h-5FFFh is typically fixed.
; Mapper register writes are enabled for this build configuration.

; Mapper registers for active target format
MAPPER_REG_P1       EQU #6000
MAPPER_REG_P2       EQU #8000
MAPPER_REG_P3       EQU #A000
MAPPER_REG_P4       EQU #A000

; ------------------------------------------------------------------
; mapper_runtime_init
; Initializes mapper state variables with deterministic defaults.
; ------------------------------------------------------------------
mapper_runtime_init:
    ; Konami4 / Konami 8K without SCC:
    ;   bank 0 is fixed at #4000-#5FFF.
    ;   p1/p2/p3 are the selectable #6000/#8000/#A000 windows.
    ld a, 1
    call mapper_set_bank_p1
    ld a, 2
    call mapper_set_bank_p2
    ld a, 3
    call mapper_set_bank_p3
    ld (mapper_bank_p4_current), a
    ret

; ------------------------------------------------------------------
; API: mapper_set_bank_pX
; Input: A = bank number
; ------------------------------------------------------------------
mapper_set_bank_p1:
    ld (mapper_bank_p1_current), a
    ld (MAPPER_REG_P1), a
    ret

mapper_set_bank_p2:
    ld (mapper_bank_p2_current), a
    ld (MAPPER_REG_P2), a
    ret

mapper_set_bank_p3:
    ld (mapper_bank_p3_current), a
    ld (MAPPER_REG_P3), a
    ret

mapper_set_bank_p4:
    jp mapper_set_bank_p3


; ------------------------------------------------------------------
; Helpers for deterministic save/restore around far calls.
; ------------------------------------------------------------------
mapper_push_p1:
    ld a, (mapper_bank_p1_current)
    ld (mapper_saved_bank_p1), a
    ret

mapper_pop_p1:
    ld a, (mapper_saved_bank_p1)
    jp mapper_set_bank_p1

mapper_push_p2:
    ld a, (mapper_bank_p2_current)
    ld (mapper_saved_bank), a
    ret

mapper_pop_p2:
    ld a, (mapper_saved_bank)
    jp mapper_set_bank_p2

mapper_push_p3:
    ld a, (mapper_bank_p3_current)
    ld (mapper_saved_bank_p3), a
    ret

mapper_pop_p3:
    ld a, (mapper_saved_bank_p3)
    jp mapper_set_bank_p3

mapper_push_p4:
    jp mapper_push_p3

mapper_pop_p4:
    jp mapper_pop_p3


; ------------------------------------------------------------------
; Far call helpers (dynamic target address in HL)
; Input:
;   A = target bank number
;   HL = target routine address in selected page window
; Output:
;   Returns after restoring previous bank.
; ------------------------------------------------------------------
mapper_call_hl_p1:
    push hl
    push af
    call mapper_push_p1
    pop af
    call mapper_set_bank_p1
    pop hl
    ld de, .return_p1
    push de
    jp (hl)
.return_p1:
    call mapper_pop_p1
    ret

mapper_call_hl_p2:
    push hl
    push af
    call mapper_push_p2
    pop af
    call mapper_set_bank_p2
    pop hl
    ld de, .return_p2
    push de
    jp (hl)
.return_p2:
    call mapper_pop_p2
    ret

mapper_call_hl_p3:
    push hl
    push af
    call mapper_push_p3
    pop af
    call mapper_set_bank_p3
    pop hl
    ld de, .return_p3
    push de
    jp (hl)
.return_p3:
    call mapper_pop_p3
    ret

mapper_call_hl_p4:
    jp mapper_call_hl_p3


; ------------------------------------------------------------------
; ------------------------------------------------------------------
; mapper_call_hl_fixed
; Direct call helper for Konami fixed window (#4000-#5FFF).
; Input:
;   HL = target routine address in fixed window
; ------------------------------------------------------------------
mapper_call_hl_fixed:
    ld de, .return_fixed
    push de
    jp (hl)
.return_fixed:
    ret

; ------------------------------------------------------------------
; mapper_call_hl_auto
; Auto-select mapper window from HL target address range:
;   4000-5FFF -> fixed
;   6000-7FFF -> p1
;   8000-9FFF -> p2
;   A000-BFFF -> p3
; Input:
;   A = target bank
;   HL = target routine address
; ------------------------------------------------------------------
mapper_call_hl_auto:
    push af
    ld a, h
    cp #60
    jr c, .use_fixed
    cp #80
    jr c, .use_p1
    cp #A0
    jr c, .use_p2
    pop af
    jp mapper_call_hl_p3

.use_fixed:
    pop af
    jp mapper_call_hl_fixed

.use_p1:
    pop af
    jp mapper_call_hl_p1

.use_p2:
    pop af
    jp mapper_call_hl_p2



; ==================================================================
; GENERATED RESOURCE IDS
; Generated by MegaROM export backend.
; ==================================================================
RESOURCE_ID_INVALID EQU #FF

RESOURCE_ID_ANEC_RIGHT_0_F0_LAYER1       EQU 0
RESOURCE_ID_ANEC_RIGHT_0_F0_LAYER2       EQU 1
RESOURCE_ID_ANEC_RIGHT_0_F1_LAYER1       EQU 2
RESOURCE_ID_ANEC_RIGHT_0_F1_LAYER2       EQU 3
RESOURCE_ID_BOLA_1_F0_LAYER1             EQU 4
RESOURCE_ID_BOLA_1_F1_LAYER1             EQU 5
RESOURCE_ID_PANELL_2_F0_LAYER1           EQU 6
RESOURCE_ID_PANELL_2_F0_LAYER2           EQU 7
RESOURCE_ID_NINA_WALK_RIGHT_3_F0_LAYER0  EQU 8
RESOURCE_ID_NINA_WALK_RIGHT_3_F0_LAYER1  EQU 9
RESOURCE_ID_NINA_WALK_RIGHT_3_F1_LAYER0  EQU 10
RESOURCE_ID_NINA_WALK_RIGHT_3_F1_LAYER1  EQU 11
RESOURCE_ID_NINA_JUMP_RIGHT_4_F0_LAYER0  EQU 12
RESOURCE_ID_NINA_JUMP_RIGHT_4_F0_LAYER1  EQU 13
RESOURCE_ID_NINA_LAND_RIGHT_5_F0_LAYER0  EQU 14
RESOURCE_ID_NINA_LAND_RIGHT_5_F0_LAYER1  EQU 15
RESOURCE_ID_NINA_LAND_RIGHT_5_F1_LAYER0  EQU 16
RESOURCE_ID_NINA_LAND_RIGHT_5_F1_LAYER1  EQU 17
RESOURCE_ID_NINA_LAND_RIGHT_5_F2_LAYER0  EQU 18
RESOURCE_ID_NINA_LAND_RIGHT_5_F2_LAYER1  EQU 19
RESOURCE_ID_NINA_DEAD_RIGHT_6_F0_LAYER0  EQU 20
RESOURCE_ID_NINA_DEAD_RIGHT_6_F0_LAYER2  EQU 21
RESOURCE_ID_NINA_DEAD_RIGHT_6_F1_LAYER0  EQU 22
RESOURCE_ID_NINA_DEAD_RIGHT_6_F1_LAYER2  EQU 23
RESOURCE_ID_NINA_IDLE_RIGHT_7_F0_LAYER0  EQU 24
RESOURCE_ID_NINA_IDLE_RIGHT_7_F0_LAYER1  EQU 25
RESOURCE_ID_NINA_IDLE_RIGHT_7_F1_LAYER0  EQU 26
RESOURCE_ID_NINA_IDLE_RIGHT_7_F1_LAYER1  EQU 27
RESOURCE_ID_NINA_FALL_RIGHT_8_F0_LAYER0  EQU 28
RESOURCE_ID_NINA_FALL_RIGHT_8_F0_LAYER1  EQU 29
RESOURCE_ID_CAPCUADRAT1_RIGHT_9_F0_LAYER2 EQU 30
RESOURCE_ID_CAPCUADRAT1_RIGHT_9_F0_LAYER3 EQU 31
RESOURCE_ID_CAPCUADRAT1_RIGHT_9_F1_LAYER2 EQU 32
RESOURCE_ID_CAPCUADRAT1_RIGHT_9_F1_LAYER3 EQU 33
RESOURCE_ID_ANEC_LEFT_10_F0_LAYER1       EQU 34
RESOURCE_ID_ANEC_LEFT_10_F0_LAYER2       EQU 35
RESOURCE_ID_ANEC_LEFT_10_F1_LAYER1       EQU 36
RESOURCE_ID_ANEC_LEFT_10_F1_LAYER2       EQU 37
RESOURCE_ID_NINA_WALK_LEFT_11_F0_LAYER0  EQU 38
RESOURCE_ID_NINA_WALK_LEFT_11_F0_LAYER1  EQU 39
RESOURCE_ID_NINA_WALK_LEFT_11_F1_LAYER0  EQU 40
RESOURCE_ID_NINA_WALK_LEFT_11_F1_LAYER1  EQU 41
RESOURCE_ID_NINA_JUMP_LEFT_12_F0_LAYER0  EQU 42
RESOURCE_ID_NINA_JUMP_LEFT_12_F0_LAYER1  EQU 43
RESOURCE_ID_NINA_LAND_LEFT_13_F0_LAYER0  EQU 44
RESOURCE_ID_NINA_LAND_LEFT_13_F0_LAYER1  EQU 45
RESOURCE_ID_NINA_LAND_LEFT_13_F1_LAYER0  EQU 46
RESOURCE_ID_NINA_LAND_LEFT_13_F1_LAYER1  EQU 47
RESOURCE_ID_NINA_LAND_LEFT_13_F2_LAYER0  EQU 48
RESOURCE_ID_NINA_LAND_LEFT_13_F2_LAYER1  EQU 49
RESOURCE_ID_NINA_DEAD_LEFT_14_F0_LAYER0  EQU 50
RESOURCE_ID_NINA_DEAD_LEFT_14_F0_LAYER2  EQU 51
RESOURCE_ID_NINA_DEAD_LEFT_14_F1_LAYER0  EQU 52
RESOURCE_ID_NINA_DEAD_LEFT_14_F1_LAYER2  EQU 53
RESOURCE_ID_NINA_IDLE_LEFT_15_F0_LAYER0  EQU 54
RESOURCE_ID_NINA_IDLE_LEFT_15_F0_LAYER1  EQU 55
RESOURCE_ID_NINA_IDLE_LEFT_15_F1_LAYER0  EQU 56
RESOURCE_ID_NINA_IDLE_LEFT_15_F1_LAYER1  EQU 57
RESOURCE_ID_NINA_FALL_LEFT_16_F0_LAYER0  EQU 58
RESOURCE_ID_NINA_FALL_LEFT_16_F0_LAYER1  EQU 59
RESOURCE_ID_CAPCUADRAT1_LEFT_17_F0_LAYER2 EQU 60
RESOURCE_ID_CAPCUADRAT1_LEFT_17_F0_LAYER3 EQU 61
RESOURCE_ID_CAPCUADRAT1_LEFT_17_F1_LAYER2 EQU 62
RESOURCE_ID_CAPCUADRAT1_LEFT_17_F1_LAYER3 EQU 63
RESOURCE_ID_SPRITE_PLACEHOLDER_PATTERN   EQU 64
RESOURCE_ID_TILE_PATTERN_BANK0           EQU 65
RESOURCE_ID_TILEBANK_PATTERN_DATA_0      EQU 66
RESOURCE_ID_TILE_COLOR_BANK0             EQU 67
RESOURCE_ID_TILEBANK_COLOR_DATA_0        EQU 68
RESOURCE_ID_SCREEN_PAN1_0_LAYOUT         EQU 69
RESOURCE_ID_SCREEN_PAN1_0_EFFECTS_LAYOUT EQU 70
RESOURCE_ID_SCREEN_PAN1_0_EFFECT_ZONE_TABLE EQU 71
RESOURCE_ID_SCREEN_PAN1_0_BOSS_TABLE     EQU 72
RESOURCE_ID_BEHAVIOR_PAN1_0_DATA         EQU 73
RESOURCE_ID_SCREEN_PAN1_0_INTERACTION_TYPE_MAP EQU 74
RESOURCE_ID_SCREEN_PAN1_0_INTERACTION_VALUE_MAP EQU 75
RESOURCE_ID_SCREEN_PAN1_0_INTERACTION_TARGET_MAP EQU 76
RESOURCE_ID_SCREEN_PAN2_1_LAYOUT         EQU 77
RESOURCE_ID_SCREEN_PAN2_1_EFFECTS_LAYOUT EQU 78
RESOURCE_ID_SCREEN_PAN2_1_EFFECT_ZONE_TABLE EQU 79
RESOURCE_ID_SCREEN_PAN2_1_BOSS_TABLE     EQU 80
RESOURCE_ID_BEHAVIOR_PAN2_1_DATA         EQU 81
RESOURCE_ID_SCREEN_PAN2_1_INTERACTION_TYPE_MAP EQU 82
RESOURCE_ID_SCREEN_PAN2_1_INTERACTION_VALUE_MAP EQU 83
RESOURCE_ID_SCREEN_PAN2_1_INTERACTION_TARGET_MAP EQU 84
RESOURCE_ID_SCREEN_BACKGROUND1_2_LAYOUT  EQU 85
RESOURCE_ID_SCREEN_BACKGROUND1_2_EFFECTS_LAYOUT EQU 86
RESOURCE_ID_SCREEN_BACKGROUND1_2_EFFECT_ZONE_TABLE EQU 87
RESOURCE_ID_SCREEN_BACKGROUND1_2_BOSS_TABLE EQU 88
RESOURCE_ID_BEHAVIOR_BACKGROUND1_2_DATA  EQU 89
RESOURCE_ID_SCREEN_BACKGROUND1_2_INTERACTION_TYPE_MAP EQU 90
RESOURCE_ID_SCREEN_BACKGROUND1_2_INTERACTION_VALUE_MAP EQU 91
RESOURCE_ID_SCREEN_BACKGROUND1_2_INTERACTION_TARGET_MAP EQU 92
RESOURCE_ID_SCREEN_PAN3_3_LAYOUT         EQU 93
RESOURCE_ID_SCREEN_PAN3_3_EFFECTS_LAYOUT EQU 94
RESOURCE_ID_SCREEN_PAN3_3_EFFECT_ZONE_TABLE EQU 95
RESOURCE_ID_SCREEN_PAN3_3_BOSS_TABLE     EQU 96
RESOURCE_ID_BEHAVIOR_PAN3_3_DATA         EQU 97
RESOURCE_ID_SCREEN_PAN3_3_INTERACTION_TYPE_MAP EQU 98
RESOURCE_ID_SCREEN_PAN3_3_INTERACTION_VALUE_MAP EQU 99
RESOURCE_ID_SCREEN_PAN3_3_INTERACTION_TARGET_MAP EQU 100
RESOURCE_ID_SCREEN_PAN4_4_LAYOUT         EQU 101
RESOURCE_ID_SCREEN_PAN4_4_EFFECTS_LAYOUT EQU 102
RESOURCE_ID_SCREEN_PAN4_4_EFFECT_ZONE_TABLE EQU 103
RESOURCE_ID_SCREEN_PAN4_4_BOSS_TABLE     EQU 104
RESOURCE_ID_BEHAVIOR_PAN4_4_DATA         EQU 105
RESOURCE_ID_SCREEN_PAN4_4_INTERACTION_TYPE_MAP EQU 106
RESOURCE_ID_SCREEN_PAN4_4_INTERACTION_VALUE_MAP EQU 107
RESOURCE_ID_SCREEN_PAN4_4_INTERACTION_TARGET_MAP EQU 108

; ==================================================================
; GENERATED RESOURCE TABLE
; Descriptor format: db bank / dw address / dw stored_size / dw raw_size / db flags
; Resource id is the zero-based descriptor index.
; Address is the mapper-window address visible after selecting bank.
; RESOURCE_FLAG_COMPRESSED_ZX0 means stored_size is compressed and raw_size is output size.
; ==================================================================
RESOURCE_TABLE_ENTRY_SIZE EQU 8
RESOURCE_FLAG_COMPRESSED_ZX0 EQU #01
RESOURCE_TABLE_COUNT EQU 109

resource_table:
    ; ANEC_RIGHT_0_F0_LAYER1
    db 16
    dw #A2E1
    dw 32
    dw 32
    db 0
    ; ANEC_RIGHT_0_F0_LAYER2
    db 16
    dw #A301
    dw 29
    dw 32
    db 1
    ; ANEC_RIGHT_0_F1_LAYER1
    db 16
    dw #A417
    dw 32
    dw 32
    db 0
    ; ANEC_RIGHT_0_F1_LAYER2
    db 16
    dw #A437
    dw 28
    dw 32
    db 1
    ; BOLA_1_F0_LAYER1
    db 16
    dw #A453
    dw 24
    dw 32
    db 1
    ; BOLA_1_F1_LAYER1
    db 16
    dw #A46B
    dw 28
    dw 32
    db 1
    ; PANELL_2_F0_LAYER1
    db 16
    dw #A487
    dw 20
    dw 32
    db 1
    ; PANELL_2_F0_LAYER2
    db 16
    dw #A49B
    dw 14
    dw 32
    db 1
    ; NINA_WALK_RIGHT_3_F0_LAYER0
    db 16
    dw #A4A9
    dw 30
    dw 32
    db 1
    ; NINA_WALK_RIGHT_3_F0_LAYER1
    db 16
    dw #A4C7
    dw 25
    dw 32
    db 1
    ; NINA_WALK_RIGHT_3_F1_LAYER0
    db 16
    dw #A4E0
    dw 31
    dw 32
    db 1
    ; NINA_WALK_RIGHT_3_F1_LAYER1
    db 16
    dw #A4FF
    dw 27
    dw 32
    db 1
    ; NINA_JUMP_RIGHT_4_F0_LAYER0
    db 16
    dw #A51A
    dw 27
    dw 32
    db 1
    ; NINA_JUMP_RIGHT_4_F0_LAYER1
    db 16
    dw #A6D7
    dw 24
    dw 32
    db 1
    ; NINA_LAND_RIGHT_5_F0_LAYER0
    db 16
    dw #A6EF
    dw 30
    dw 32
    db 1
    ; NINA_LAND_RIGHT_5_F0_LAYER1
    db 16
    dw #A70D
    dw 23
    dw 32
    db 1
    ; NINA_LAND_RIGHT_5_F1_LAYER0
    db 16
    dw #A724
    dw 28
    dw 32
    db 1
    ; NINA_LAND_RIGHT_5_F1_LAYER1
    db 16
    dw #A740
    dw 27
    dw 32
    db 1
    ; NINA_LAND_RIGHT_5_F2_LAYER0
    db 16
    dw #A75B
    dw 30
    dw 32
    db 1
    ; NINA_LAND_RIGHT_5_F2_LAYER1
    db 16
    dw #A779
    dw 26
    dw 32
    db 1
    ; NINA_DEAD_RIGHT_6_F0_LAYER0
    db 16
    dw #A793
    dw 32
    dw 32
    db 0
    ; NINA_DEAD_RIGHT_6_F0_LAYER2
    db 16
    dw #A7B3
    dw 32
    dw 32
    db 0
    ; NINA_DEAD_RIGHT_6_F1_LAYER0
    db 16
    dw #A7D3
    dw 26
    dw 32
    db 1
    ; NINA_DEAD_RIGHT_6_F1_LAYER2
    db 16
    dw #A7ED
    dw 32
    dw 32
    db 0
    ; NINA_IDLE_RIGHT_7_F0_LAYER0
    db 16
    dw #A80D
    dw 30
    dw 32
    db 1
    ; NINA_IDLE_RIGHT_7_F0_LAYER1
    db 16
    dw #A82B
    dw 24
    dw 32
    db 1
    ; NINA_IDLE_RIGHT_7_F1_LAYER0
    db 16
    dw #A843
    dw 30
    dw 32
    db 1
    ; NINA_IDLE_RIGHT_7_F1_LAYER1
    db 16
    dw #A861
    dw 24
    dw 32
    db 1
    ; NINA_FALL_RIGHT_8_F0_LAYER0
    db 16
    dw #A879
    dw 29
    dw 32
    db 1
    ; NINA_FALL_RIGHT_8_F0_LAYER1
    db 16
    dw #A896
    dw 24
    dw 32
    db 1
    ; CAPCUADRAT1_RIGHT_9_F0_LAYER2
    db 16
    dw #A8AE
    dw 21
    dw 32
    db 1
    ; CAPCUADRAT1_RIGHT_9_F0_LAYER3
    db 16
    dw #A8C3
    dw 29
    dw 32
    db 1
    ; CAPCUADRAT1_RIGHT_9_F1_LAYER2
    db 16
    dw #A8E0
    dw 21
    dw 32
    db 1
    ; CAPCUADRAT1_RIGHT_9_F1_LAYER3
    db 16
    dw #A8F5
    dw 28
    dw 32
    db 1
    ; ANEC_LEFT_10_F0_LAYER1
    db 16
    dw #A911
    dw 32
    dw 32
    db 0
    ; ANEC_LEFT_10_F0_LAYER2
    db 16
    dw #A931
    dw 29
    dw 32
    db 1
    ; ANEC_LEFT_10_F1_LAYER1
    db 16
    dw #A94E
    dw 32
    dw 32
    db 0
    ; ANEC_LEFT_10_F1_LAYER2
    db 16
    dw #A96E
    dw 29
    dw 32
    db 1
    ; NINA_WALK_LEFT_11_F0_LAYER0
    db 16
    dw #A98B
    dw 28
    dw 32
    db 1
    ; NINA_WALK_LEFT_11_F0_LAYER1
    db 16
    dw #A9A7
    dw 25
    dw 32
    db 1
    ; NINA_WALK_LEFT_11_F1_LAYER0
    db 16
    dw #A9C0
    dw 30
    dw 32
    db 1
    ; NINA_WALK_LEFT_11_F1_LAYER1
    db 16
    dw #A9DE
    dw 30
    dw 32
    db 1
    ; NINA_JUMP_LEFT_12_F0_LAYER0
    db 16
    dw #A9FC
    dw 27
    dw 32
    db 1
    ; NINA_JUMP_LEFT_12_F0_LAYER1
    db 16
    dw #AA17
    dw 24
    dw 32
    db 1
    ; NINA_LAND_LEFT_13_F0_LAYER0
    db 16
    dw #AA2F
    dw 29
    dw 32
    db 1
    ; NINA_LAND_LEFT_13_F0_LAYER1
    db 16
    dw #AA4C
    dw 24
    dw 32
    db 1
    ; NINA_LAND_LEFT_13_F1_LAYER0
    db 16
    dw #AA64
    dw 28
    dw 32
    db 1
    ; NINA_LAND_LEFT_13_F1_LAYER1
    db 16
    dw #AA80
    dw 28
    dw 32
    db 1
    ; NINA_LAND_LEFT_13_F2_LAYER0
    db 16
    dw #AA9C
    dw 29
    dw 32
    db 1
    ; NINA_LAND_LEFT_13_F2_LAYER1
    db 16
    dw #AAB9
    dw 27
    dw 32
    db 1
    ; NINA_DEAD_LEFT_14_F0_LAYER0
    db 16
    dw #AAD4
    dw 32
    dw 32
    db 0
    ; NINA_DEAD_LEFT_14_F0_LAYER2
    db 16
    dw #AAF4
    dw 32
    dw 32
    db 0
    ; NINA_DEAD_LEFT_14_F1_LAYER0
    db 16
    dw #AB14
    dw 25
    dw 32
    db 1
    ; NINA_DEAD_LEFT_14_F1_LAYER2
    db 16
    dw #AB2D
    dw 32
    dw 32
    db 0
    ; NINA_IDLE_LEFT_15_F0_LAYER0
    db 16
    dw #AB4D
    dw 30
    dw 32
    db 1
    ; NINA_IDLE_LEFT_15_F0_LAYER1
    db 16
    dw #AB6B
    dw 24
    dw 32
    db 1
    ; NINA_IDLE_LEFT_15_F1_LAYER0
    db 16
    dw #AB83
    dw 30
    dw 32
    db 1
    ; NINA_IDLE_LEFT_15_F1_LAYER1
    db 16
    dw #ABA1
    dw 24
    dw 32
    db 1
    ; NINA_FALL_LEFT_16_F0_LAYER0
    db 16
    dw #ABB9
    dw 29
    dw 32
    db 1
    ; NINA_FALL_LEFT_16_F0_LAYER1
    db 16
    dw #ABD6
    dw 24
    dw 32
    db 1
    ; CAPCUADRAT1_LEFT_17_F0_LAYER2
    db 16
    dw #ABEE
    dw 20
    dw 32
    db 1
    ; CAPCUADRAT1_LEFT_17_F0_LAYER3
    db 16
    dw #AC02
    dw 29
    dw 32
    db 1
    ; CAPCUADRAT1_LEFT_17_F1_LAYER2
    db 16
    dw #AC1F
    dw 20
    dw 32
    db 1
    ; CAPCUADRAT1_LEFT_17_F1_LAYER3
    db 16
    dw #AC33
    dw 26
    dw 32
    db 1
    ; SPRITE_PLACEHOLDER_PATTERN
    db 16
    dw #AC4D
    dw 5
    dw 32
    db 1
    ; tile_pattern_bank0
    db 16
    dw #A1BA
    dw 125
    dw 144
    db 1
    ; tilebank_pattern_data_0
    db 16
    dw #A26A
    dw 119
    dw 136
    db 1
    ; tile_color_bank0
    db 16
    dw #A237
    dw 51
    dw 144
    db 1
    ; tilebank_color_data_0
    db 16
    dw #A3E7
    dw 48
    dw 136
    db 1
    ; SCREEN_PAN1_0_LAYOUT
    db 16
    dw #A000
    dw 136
    dw 768
    db 1
    ; SCREEN_PAN1_0_EFFECTS_LAYOUT
    db 16
    dw #A088
    dw 6
    dw 768
    db 1
    ; SCREEN_PAN1_0_EFFECT_ZONE_TABLE
    db 16
    dw #A31E
    dw 1
    dw 1
    db 0
    ; SCREEN_PAN1_0_BOSS_TABLE
    db 16
    dw #A31F
    dw 1
    dw 1
    db 0
    ; BEHAVIOR_PAN1_0_DATA
    db 16
    dw #A08E
    dw 69
    dw 768
    db 1
    ; SCREEN_PAN1_0_INTERACTION_TYPE_MAP
    db 16
    dw #A0D3
    dw 15
    dw 768
    db 1
    ; SCREEN_PAN1_0_INTERACTION_VALUE_MAP
    db 16
    dw #A0E2
    dw 60
    dw 768
    db 1
    ; SCREEN_PAN1_0_INTERACTION_TARGET_MAP
    db 16
    dw #A11E
    dw 6
    dw 768
    db 1
    ; SCREEN_PAN2_1_LAYOUT
    db 16
    dw #A124
    dw 87
    dw 768
    db 1
    ; SCREEN_PAN2_1_EFFECTS_LAYOUT
    db 16
    dw #A17B
    dw 6
    dw 768
    db 1
    ; SCREEN_PAN2_1_EFFECT_ZONE_TABLE
    db 16
    dw #A320
    dw 1
    dw 1
    db 0
    ; SCREEN_PAN2_1_BOSS_TABLE
    db 16
    dw #A321
    dw 1
    dw 1
    db 0
    ; BEHAVIOR_PAN2_1_DATA
    db 16
    dw #A181
    dw 42
    dw 768
    db 1
    ; SCREEN_PAN2_1_INTERACTION_TYPE_MAP
    db 16
    dw #A1AB
    dw 15
    dw 768
    db 1
    ; SCREEN_PAN2_1_INTERACTION_VALUE_MAP
    db 16
    dw #A328
    dw 40
    dw 768
    db 1
    ; SCREEN_PAN2_1_INTERACTION_TARGET_MAP
    db 16
    dw #A350
    dw 6
    dw 768
    db 1
    ; SCREEN_BACKGROUND1_2_LAYOUT
    db 16
    dw #A356
    dw 6
    dw 768
    db 1
    ; SCREEN_BACKGROUND1_2_EFFECTS_LAYOUT
    db 16
    dw #A35C
    dw 6
    dw 768
    db 1
    ; SCREEN_BACKGROUND1_2_EFFECT_ZONE_TABLE
    db 16
    dw #A322
    dw 1
    dw 1
    db 0
    ; SCREEN_BACKGROUND1_2_BOSS_TABLE
    db 16
    dw #A323
    dw 1
    dw 1
    db 0
    ; BEHAVIOR_BACKGROUND1_2_DATA
    db 16
    dw #A362
    dw 6
    dw 768
    db 1
    ; SCREEN_BACKGROUND1_2_INTERACTION_TYPE_MAP
    db 16
    dw #A368
    dw 6
    dw 768
    db 1
    ; SCREEN_BACKGROUND1_2_INTERACTION_VALUE_MAP
    db 16
    dw #A36E
    dw 6
    dw 768
    db 1
    ; SCREEN_BACKGROUND1_2_INTERACTION_TARGET_MAP
    db 16
    dw #A374
    dw 6
    dw 768
    db 1
    ; SCREEN_PAN3_3_LAYOUT
    db 16
    dw #A37A
    dw 103
    dw 768
    db 1
    ; SCREEN_PAN3_3_EFFECTS_LAYOUT
    db 16
    dw #A3E1
    dw 6
    dw 768
    db 1
    ; SCREEN_PAN3_3_EFFECT_ZONE_TABLE
    db 16
    dw #A324
    dw 1
    dw 1
    db 0
    ; SCREEN_PAN3_3_BOSS_TABLE
    db 16
    dw #A325
    dw 1
    dw 1
    db 0
    ; BEHAVIOR_PAN3_3_DATA
    db 16
    dw #A535
    dw 60
    dw 768
    db 1
    ; SCREEN_PAN3_3_INTERACTION_TYPE_MAP
    db 16
    dw #A571
    dw 24
    dw 768
    db 1
    ; SCREEN_PAN3_3_INTERACTION_VALUE_MAP
    db 16
    dw #A589
    dw 58
    dw 768
    db 1
    ; SCREEN_PAN3_3_INTERACTION_TARGET_MAP
    db 16
    dw #A5C3
    dw 6
    dw 768
    db 1
    ; SCREEN_PAN4_4_LAYOUT
    db 16
    dw #A5C9
    dw 109
    dw 768
    db 1
    ; SCREEN_PAN4_4_EFFECTS_LAYOUT
    db 16
    dw #A636
    dw 6
    dw 768
    db 1
    ; SCREEN_PAN4_4_EFFECT_ZONE_TABLE
    db 16
    dw #A326
    dw 1
    dw 1
    db 0
    ; SCREEN_PAN4_4_BOSS_TABLE
    db 16
    dw #A327
    dw 1
    dw 1
    db 0
    ; BEHAVIOR_PAN4_4_DATA
    db 16
    dw #A63C
    dw 64
    dw 768
    db 1
    ; SCREEN_PAN4_4_INTERACTION_TYPE_MAP
    db 16
    dw #A67C
    dw 21
    dw 768
    db 1
    ; SCREEN_PAN4_4_INTERACTION_VALUE_MAP
    db 16
    dw #A691
    dw 64
    dw 768
    db 1
    ; SCREEN_PAN4_4_INTERACTION_TARGET_MAP
    db 16
    dw #A6D1
    dw 6
    dw 768
    db 1

; ZX0 decoder is resident in bank 0 so banked resource loads can
; decompress data while the P3 mapper window exposes the source bank.
; -----------------------------------------------------------------------------
; ZX0 decoder by Einar Saukas & Urusergi
; "Standard" version (68 bytes only)
; -----------------------------------------------------------------------------
; Parameters:
;   HL: source address (compressed data)
;   DE: destination address (decompressing)
; -----------------------------------------------------------------------------

dzx0_standard:
        ld      bc, $ffff               ; preserve default offset 1
        push    bc
        inc     bc
        ld      a, $80
dzx0s_literals:
        call    dzx0s_elias             ; obtain length
        ldir                            ; copy literals
        add     a, a                    ; copy from last offset or new offset?
        jr      c, dzx0s_new_offset
        call    dzx0s_elias             ; obtain length
dzx0s_copy:
        ex      (sp), hl                ; preserve source, restore offset
        push    hl                      ; preserve offset
        add     hl, de                  ; calculate destination - offset
        ldir                            ; copy from offset
        pop     hl                      ; restore offset
        ex      (sp), hl                ; preserve offset, restore source
        add     a, a                    ; copy from literals or new offset?
        jr      nc, dzx0s_literals
dzx0s_new_offset:
        pop     bc                      ; discard last offset
        ld      c, $fe                  ; prepare negative offset
        call    dzx0s_elias_loop        ; obtain offset MSB
        inc     c
        ret     z                       ; check end marker
        ld      b, c
        ld      c, (hl)                 ; obtain offset LSB
        inc     hl
        rr      b                       ; last offset bit becomes first length bit
        rr      c
        push    bc                      ; preserve new offset
        ld      bc, 1                   ; obtain length
        call    nc, dzx0s_elias_backtrack
        inc     bc
        jr      dzx0s_copy
dzx0s_elias:
        inc     c                       ; interlaced Elias gamma coding
dzx0s_elias_loop:
        add     a, a
        jr      nz, dzx0s_elias_skip
        ld      a, (hl)                 ; load another group of 8 bits
        inc     hl
        rla
dzx0s_elias_skip:
        ret     c
dzx0s_elias_backtrack:
        add     a, a
        rl      c
        rl      b
        jr      dzx0s_elias_loop
; -----------------------------------------------------------------------------

; ==================================================================
; RESOURCE MANAGER
; File: resource_manager.asm
; Description: Centralized banked resource lookup and copy helpers
; Descriptor format: db bank / dw address / dw stored_size / dw raw_size / db flags
; Resource id is the zero-based descriptor index.
; ==================================================================

resource_manager_init:
    xor a
    ld (resource_descriptor_bank), a
    ld (resource_descriptor_ptr), a
    ld (resource_descriptor_ptr + 1), a
    ld (resource_descriptor_addr), a
    ld (resource_descriptor_addr + 1), a
    ld (resource_descriptor_size), a
    ld (resource_descriptor_size + 1), a
    ld (resource_descriptor_uncompressed_size), a
    ld (resource_descriptor_uncompressed_size + 1), a
    ld (resource_descriptor_flags), a
    ld (vram_cache_tile_patterns_ready), a
    ld (vram_cache_tile_colors_ready), a
    ld (vram_cache_font_ready), a
    ld a, #FF
    ld (resource_descriptor_id), a
    ld (resource_ram_cache_screen_layout_id), a
    ld (resource_ram_cache_effects_layout_id), a
    ld (resource_ram_cache_effect_zone_table_id), a
    ld (current_screen2_tilebank_id), a
    ret

; ------------------------------------------------------------------
; resource_invalidate_pattern_vram_cache
; Outputs:
;   none
; Clobbers:
;   AF
; ------------------------------------------------------------------
resource_invalidate_pattern_vram_cache:
    xor a
    ld (vram_cache_tile_patterns_ready), a
    ret

; ------------------------------------------------------------------
; resource_invalidate_color_vram_cache
; Outputs:
;   none
; Clobbers:
;   AF
; ------------------------------------------------------------------
resource_invalidate_color_vram_cache:
    xor a
    ld (vram_cache_tile_colors_ready), a
    ret

; ------------------------------------------------------------------
; resource_invalidate_font_vram_cache
; Outputs:
;   none
; Clobbers:
;   AF
; ------------------------------------------------------------------
resource_invalidate_font_vram_cache:
    xor a
    ld (vram_cache_font_ready), a
    ret

; ------------------------------------------------------------------
; resource_invalidate_gameplay_vram_cache
; Outputs:
;   none
; Clobbers:
;   AF
; Notes:
;   Use this when a fullscreen effect or presentation screen overwrites
;   shared gameplay/font VRAM tables outside the normal loaders.
; ------------------------------------------------------------------
resource_invalidate_gameplay_vram_cache:
    call resource_invalidate_pattern_vram_cache
    call resource_invalidate_color_vram_cache
    call resource_invalidate_font_vram_cache
    ld a, #FF
    ld (current_screen2_tilebank_id), a
    ret

; ------------------------------------------------------------------
; resource_invalidate_screen_ram_cache
; Outputs:
;   none
; Clobbers:
;   AF
; Notes:
;   Invalidates the clean RAM copies used to rebuild runtime screen data
;   without re-reading the same banked resource on repeated screen loads.
; ------------------------------------------------------------------
resource_invalidate_screen_ram_cache:
    ld a, #FF
    ld (resource_ram_cache_screen_layout_id), a
    ld (resource_ram_cache_effects_layout_id), a
    ld (resource_ram_cache_effect_zone_table_id), a
    ret

; ------------------------------------------------------------------
; resource_find_by_id
; Inputs:
;   A = resource id
; Outputs on success (carry clear):
;   HL = pointer to descriptor entry
;   A  = bank number
;   DE = visible window address
;   BC = stored size in bytes
; Outputs on failure (carry set):
;   HL = resource_table
; Clobbers:
;   AF, BC, DE, HL
; Notes:
;   Mirrors the descriptor into RAM so callers can inspect fields later
;   without re-scanning the table.
; ------------------------------------------------------------------
resource_find_by_id:
    ld c, a
    ld a, (resource_descriptor_id)
    cp c
    jr nz, .resource_find_lookup
    ld a, (resource_descriptor_bank)
    ld de, (resource_descriptor_addr)
    ld bc, (resource_descriptor_size)
    or a
    ret
.resource_find_lookup:
    ld a, c
    cp RESOURCE_TABLE_COUNT
    jp nc, .resource_find_not_found
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    ld de, resource_table
    add hl, de
    ld a, c
    ld (resource_descriptor_id), a
    ld (resource_descriptor_ptr), hl
    push hl
    ld a, (hl)
    ld (resource_descriptor_bank), a
    inc hl
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld (resource_descriptor_addr), de
    inc hl
    ld c, (hl)
    inc hl
    ld b, (hl)
    ld (resource_descriptor_size), bc
    inc hl
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld (resource_descriptor_uncompressed_size), de
    inc hl
    ld a, (hl)
    ld (resource_descriptor_flags), a
    ld de, (resource_descriptor_addr)
    ld bc, (resource_descriptor_size)
    pop hl
    ld a, (resource_descriptor_bank)
    or a
    ret

.resource_find_not_found:
    xor a
    ld (resource_descriptor_bank), a
    ld (resource_descriptor_ptr), a
    ld (resource_descriptor_ptr + 1), a
    ld (resource_descriptor_addr), a
    ld (resource_descriptor_addr + 1), a
    ld (resource_descriptor_size), a
    ld (resource_descriptor_size + 1), a
    ld (resource_descriptor_uncompressed_size), a
    ld (resource_descriptor_uncompressed_size + 1), a
    ld (resource_descriptor_flags), a
    ld a, #FF
    ld (resource_descriptor_id), a
    scf
    ret

; ------------------------------------------------------------------
; resource_copy_from_bank_to_ram
; Inputs:
;   A  = bank number
;   HL = source visible in mapper data window
;   DE = destination in RAM
;   BC = size in bytes
; Outputs:
;   carry clear
; Clobbers:
;   AF, BC, DE, HL
; ------------------------------------------------------------------
resource_copy_from_bank_to_ram:
    push af
    ld a, b
    or c
    jr nz, .resource_copy_ram_has_size
    pop af
    or a
    ret
.resource_copy_ram_has_size:
    pop af
    di
    push af
    call mapper_push_p3
    pop af
    call mapper_set_bank_p3
    ldir
    call mapper_pop_p3
    ld a, (interrupt_in_progress)
    or a
    jp nz, .resource_copy_ram_irq_done
    ei
.resource_copy_ram_irq_done:
    or a
    ret

; ------------------------------------------------------------------
; resource_decompress_from_bank_to_ram
; Inputs:
;   A  = bank number
;   HL = ZX0 source visible in mapper data window
;   DE = destination in RAM
; Outputs:
;   carry clear
; Clobbers:
;   AF, BC, DE, HL
; ------------------------------------------------------------------
resource_decompress_from_bank_to_ram:
    di
    push af
    call mapper_push_p3
    pop af
    call mapper_set_bank_p3
    call dzx0_standard
    call mapper_pop_p3
    ld a, (interrupt_in_progress)
    or a
    jp nz, .resource_decompress_ram_irq_done
    ei
.resource_decompress_ram_irq_done:
    or a
    ret

; ------------------------------------------------------------------
; resource_copy_from_bank_to_vram
; Inputs:
;   A  = bank number
;   HL = source visible in mapper data window
;   DE = destination in VRAM
;   BC = size in bytes
; Outputs:
;   carry clear
; Clobbers:
;   AF, BC, DE, HL
; ------------------------------------------------------------------
resource_copy_from_bank_to_vram:
    push af
    ld a, b
    or c
    jr nz, .resource_copy_vram_has_size
    pop af
    or a
    ret
.resource_copy_vram_has_size:
    pop af
    di
    push af
    call mapper_push_p3
    pop af
    call mapper_set_bank_p3
    ; Banked VRAM copy keeps IRQs masked until P2 is restored.
    ; FAST_LDIRVM re-enables IRQs internally, so inline the same port loop here.
    ; Restore IRQs only if they were enabled on entry.
    ld a, e
    out (#99), a
    nop
    ld a, d
    or #40
    out (#99), a
    nop
.resource_copy_vram_loop:
    ld a, (hl)
    out (#98), a
    inc hl
    dec bc
    ld a, b
    or c
    jr nz, .resource_copy_vram_loop
    call mapper_pop_p3
    ld a, (interrupt_in_progress)
    or a
    jp nz, .resource_copy_vram_irq_done
    ei
.resource_copy_vram_irq_done:
    or a
    ret

; ------------------------------------------------------------------
; resource_decompress_from_bank_to_vram
; Inputs:
;   A  = bank number
;   HL = ZX0 source visible in mapper data window
;   DE = destination in VRAM
;   BC = uncompressed size in bytes
; Outputs:
;   carry clear
; Clobbers:
;   AF, BC, DE, HL
; Notes:
;   Uses fast RAM staging when the uncompressed output fits the shared scratch
;   buffer. Larger resources fall back to direct-to-VRAM ZX0 decode.
; ------------------------------------------------------------------
resource_decompress_from_bank_to_vram:
    push af
    ld a, b
    or c
    jp nz, .resource_decompress_vram_has_size
    pop af
    or a
    ret
.resource_decompress_vram_has_size:
    ld a, b
    cp ZX0_VRAM_TRANSFER_BUFFER_LIMIT_HIGH
    jp c, .resource_decompress_vram_staged
    jp nz, .resource_decompress_vram_direct
    ld a, c
    cp ZX0_VRAM_TRANSFER_BUFFER_LIMIT_NEXT_LOW
    jp c, .resource_decompress_vram_staged
.resource_decompress_vram_direct:
    pop af
    di
    push af
    call mapper_push_p3
    pop af
    call mapper_set_bank_p3
    call resource_dzx0_to_vram
    call mapper_pop_p3
    ld a, (interrupt_in_progress)
    or a
    jp nz, .resource_decompress_vram_irq_done
    ei
.resource_decompress_vram_irq_done:
    or a
    ret
.resource_decompress_vram_staged:
    pop af
    push de
    push bc
    ld de, ZX0_VRAM_TRANSFER_BUFFER
    call resource_decompress_from_bank_to_ram
    pop bc
    pop de
    ld hl, ZX0_VRAM_TRANSFER_BUFFER
    jp FAST_LDIRVM

; ------------------------------------------------------------------
; resource_dzx0_to_vram
; Inputs:
;   HL = ZX0 source visible in mapper data window
;   DE = destination in VRAM
; Outputs:
;   DE advanced past decompressed stream
; Clobbers:
;   AF, BC, DE, HL
; Notes:
;   Adapted from the standard ZX0 decoder structure. Literal bytes are read
;   from mapper-visible ROM and written to VRAM; match bytes are read from
;   already decompressed VRAM and written to the current VRAM destination.
;   IRQs and mapper bank lifetime are managed by the caller.
; ------------------------------------------------------------------
resource_dzx0_to_vram:
    ld bc, #FFFF
    push bc
    inc bc
    ld a, #80
.resource_dzx0_vram_literals:
    call .resource_dzx0_vram_elias
    push af
.resource_dzx0_vram_literal_loop:
    ld a, e
    out (#99), a
    nop
    ld a, d
    or #40
    out (#99), a
    nop
    ld a, (hl)
    out (#98), a
    inc hl
    inc de
    dec bc
    ld a, b
    or c
    jp nz, .resource_dzx0_vram_literal_loop
    pop af
    add a, a
    jp c, .resource_dzx0_vram_new_offset
    call .resource_dzx0_vram_elias
.resource_dzx0_vram_copy:
    ex (sp), hl
    push hl
    add hl, de
    push af
.resource_dzx0_vram_copy_loop:
    push bc
    ld a, l
    out (#99), a
    nop
    ld a, h
    and #3F
    out (#99), a
    nop
    nop
    in a, (#98)
    ld b, a
    ld a, e
    out (#99), a
    nop
    ld a, d
    or #40
    out (#99), a
    nop
    ld a, b
    out (#98), a
    pop bc
    inc hl
    inc de
    dec bc
    ld a, b
    or c
    jp nz, .resource_dzx0_vram_copy_loop
    pop af
    pop hl
    ex (sp), hl
    add a, a
    jp nc, .resource_dzx0_vram_literals
.resource_dzx0_vram_new_offset:
    pop bc
    ld c, #FE
    call .resource_dzx0_vram_elias_loop
    inc c
    ret z
    ld b, c
    ld c, (hl)
    inc hl
    rr b
    rr c
    push bc
    ld bc, 1
    call nc, .resource_dzx0_vram_elias_backtrack
    inc bc
    jp .resource_dzx0_vram_copy
.resource_dzx0_vram_elias:
    inc c
.resource_dzx0_vram_elias_loop:
    add a, a
    jp nz, .resource_dzx0_vram_elias_skip
    ld a, (hl)
    inc hl
    rla
.resource_dzx0_vram_elias_skip:
    ret c
.resource_dzx0_vram_elias_backtrack:
    add a, a
    rl c
    rl b
    jp .resource_dzx0_vram_elias_loop

; ------------------------------------------------------------------
; resource_load_to_ram_by_id
; Inputs:
;   A  = resource id
;   DE = destination in RAM
; Outputs:
;   carry clear on success
;   carry set if resource id is missing
; Clobbers:
;   AF, BC, DE, HL
; ------------------------------------------------------------------
resource_load_to_ram_by_id:
    push de
    call resource_find_by_id
    jp c, .resource_load_to_ram_fail
    push de
    pop hl
    pop de
    ld a, (resource_descriptor_flags)
    and RESOURCE_FLAG_COMPRESSED_ZX0
    jr z, .resource_load_to_ram_raw
    ld a, (resource_descriptor_bank)
    jp resource_decompress_from_bank_to_ram
.resource_load_to_ram_raw:
    ld a, (resource_descriptor_bank)
    jp resource_copy_from_bank_to_ram

.resource_load_to_ram_fail:
    pop de
    ret

; ------------------------------------------------------------------
; resource_load_to_vram_by_id
; Inputs:
;   A  = resource id
;   DE = destination in VRAM
; Outputs:
;   carry clear on success
;   carry set if resource id is missing
; Clobbers:
;   AF, BC, DE, HL
; ------------------------------------------------------------------
resource_load_to_vram_by_id:
    push de
    call resource_find_by_id
    jp c, .resource_load_to_vram_fail
    ld a, (resource_descriptor_flags)
    and RESOURCE_FLAG_COMPRESSED_ZX0
    jp nz, .resource_load_to_vram_compressed
    push de
    pop hl
    pop de
    ld a, (resource_descriptor_bank)
    jp resource_copy_from_bank_to_vram

.resource_load_to_vram_compressed:
    push de
    pop hl
    ld bc, (resource_descriptor_uncompressed_size)
    pop de
    ld a, (resource_descriptor_bank)
    jp resource_decompress_from_bank_to_vram

.resource_load_to_vram_fail:
    pop de
    ret

; ------------------------------------------------------------------
; resource_load_screen_layout_cached
; Inputs:
;   A = screen layout resource id
; Outputs:
;   carry clear on success
;   carry set if resource id is missing
; Notes:
;   Keeps the immutable layout in runtime_background_layout and rebuilds
;   runtime_screen_layout from that clean RAM copy on every screen load.
; Clobbers:
;   AF, BC, DE, HL
; ------------------------------------------------------------------
resource_load_screen_layout_cached:
    ld c, a
    ld a, (resource_ram_cache_screen_layout_id)
    cp c
    jr z, .resource_layout_cache_hit
    push bc
    ld a, c
    ld de, runtime_background_layout
    call resource_load_to_ram_by_id
    pop bc
    ret c
    ld a, c
    ld (resource_ram_cache_screen_layout_id), a
.resource_layout_cache_hit:
    ld hl, runtime_background_layout
    ld de, runtime_screen_layout
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    ldir
    xor a
    ret

; ------------------------------------------------------------------
; resource_load_effects_layout_cached
; Inputs:
;   A = effects layout resource id
; Outputs:
;   carry clear on success
;   carry set if resource id is missing
; Notes:
;   Keeps the immutable effects layer in runtime_effects_layout.
; Clobbers:
;   AF, BC, DE, HL
; ------------------------------------------------------------------
resource_load_effects_layout_cached:
    ld c, a
    ld a, (resource_ram_cache_effects_layout_id)
    cp c
    jr z, .resource_effects_cache_hit
    push bc
    ld a, c
    ld de, runtime_effects_layout
    call resource_load_to_ram_by_id
    pop bc
    ret c
    ld a, c
    ld (resource_ram_cache_effects_layout_id), a
.resource_effects_cache_hit:
    xor a
    ret

; ------------------------------------------------------------------
; resource_load_behavior_map_cached
; Inputs:
;   A = behavior map resource id
; Outputs:
;   carry clear on success
;   carry set if resource id is missing
; Notes:
;   Reloads the mutable runtime_behavior_map directly from the banked
;   resource. This avoids a second resident 32x24 behavior-map copy in RAM.
; Clobbers:
;   AF, BC, DE, HL
; ------------------------------------------------------------------
resource_load_behavior_map_cached:
    ld de, runtime_behavior_map
    call resource_load_to_ram_by_id
    ret

; ------------------------------------------------------------------
; resource_load_effect_zone_table_cached
; Inputs:
;   A = effect zone table resource id
; Outputs:
;   carry clear on success
;   carry set if resource id is missing
; Notes:
;   Keeps the current screen's immutable effect zone table resident in RAM.
; Clobbers:
;   AF, BC, DE, HL
; ------------------------------------------------------------------
resource_load_effect_zone_table_cached:
    ld c, a
    ld a, (resource_ram_cache_effect_zone_table_id)
    cp c
    jr z, .resource_effect_zone_cache_hit
    push bc
    ld a, c
    ld de, runtime_effect_zone_table
    call resource_load_to_ram_by_id
    pop bc
    ret c
    ld a, c
    ld (resource_ram_cache_effect_zone_table_id), a
.resource_effect_zone_cache_hit:
    xor a
    ret

; ------------------------------------------------------------------
; resource_read_byte_from_bank
; Inputs:
;   A  = bank number
;   HL = source visible in mapper data window
; Outputs:
;   A = byte read
; Clobbers:
;   AF, BC, HL
; Preserves:
;   DE
; ------------------------------------------------------------------
resource_read_byte_from_bank:
    ld b, a
    ld a, b
    push af
    call mapper_push_p3
    pop af
    call mapper_set_bank_p3
    ld a, (hl)
    ld b, a
    call mapper_pop_p3
    ld a, b
    ret


; ==================================================================
; PAGE-0 STUBS — labels required by header.asm, no-ops in megarom
; ==================================================================
init_page0_runtime_state:
    ret

page0_map_expanded_slot:
    ret

page0_map_game_rom:
    ret

page0_restore_bios_rom:
    ret

page0_copy_chunk_to_buffer:
    ret

page0_decompress_to_ram:
    ret

page0_copy_to_vram:
    ret

; ==================================================================
; INTERRUPT TASK SYSTEM - File: interrupt.asm
; Konami-style technique: Hook H.TIMI for 50/60Hz task execution
; ==================================================================

; ==================================================================
; INTERRUPT SYSTEM MEMORY LAYOUT
; Variables are defined in variables.asm (dynamically allocated)
; This avoids RAM overlap with entity system arrays
; ==================================================================
; Slots: task_table (8 slots x 2 bytes), task_0_ptr..task_7_ptr
; State: interrupt_system_enabled, old_htimi_hook, interrupt_counter,
;        task_exec_time, vblank_flag
; ==================================================================

; ==================================================================
; INIT_INTERRUPT_SYSTEM - Install H.TIMI hook
; ==================================================================
; Register Contract:
;   Purpose: Install JP hook on H.TIMI and initialize interrupt task state.
;   Inputs:
;     - None
;   Outputs:
;     - None
;   Clobbers:
;     - AF
;     - BC
;     - DE
;     - HL
;   Preserved:
;     - None
;   Register roles:
;     - HL/DE/BC = block copy parameters for hook backup and task table clear
;     - A = enable flag and zeroing value
;   Notes:
;     - Runs with DI/EI, so caller must not assume interrupt state is unchanged.

; Inputs: None
; Outputs: None
; Modifies: AF, BC, DE, HL
; ==================================================================
init_interrupt_system:
    di                          ; Disable interrupts during hook install

    ; --- STEP 1: Save original hook ---
    ld hl, #FD9F                ; H.TIMI address
    ld de, old_htimi_hook       ; Our backup location
    ld bc, 5                    ; Save 5 bytes (JP nnnn + padding)
    ldir                        ; Copy original hook to RAM

    ; --- STEP 2: Install our hook ---
    ; Write "JP interrupt_dispatcher" at FD9F
    ld a, #C3                   ; Opcode for JP
    ld (#FD9F), a               ; Write JP opcode
    ld hl, interrupt_dispatcher ; Address of our ISR
    ld (#FDA0), hl              ; Write address (little-endian)

    ; --- STEP 3: Initialize task table to 0 (all disabled) ---
    ld hl, task_table
    ld de, task_table+1
    ld bc, 15                   ; 8 slots Ç- 2 bytes = 16 bytes - 1
    ld (hl), 0
    ldir                        ; Clear all task pointers

    ; --- STEP 4: Initialize counters ---
    xor a
    ld (interrupt_counter), a
    ld (interrupt_counter+1), a
    ld (vblank_flag), a

    ; --- STEP 5: Mark system as enabled ---
    ld a, 1
    ld (interrupt_system_enabled), a

    ei                          ; Re-enable interrupts
    ret

; ==================================================================
; STOP_INTERRUPT_SYSTEM - Restore original H.TIMI hook
; ==================================================================
; Register Contract:
;   Purpose: Restore original H.TIMI bytes and mark system disabled.
;   Inputs:
;     - None
;   Outputs:
;     - None
;   Clobbers:
;     - AF
;     - BC
;     - DE
;     - HL
;   Preserved:
;     - None
;   Register roles:
;     - HL/DE/BC = LDIR source/destination/count for hook restore
;     - A = zero flag write to interrupt_system_enabled
;   Notes:
;     - Runs with DI/EI for atomic hook restoration.

; Inputs: None
; Outputs: None
; Modifies: AF, BC, DE, HL
; ==================================================================
stop_interrupt_system:
    di                          ; Disable interrupts

    ; Restore original hook
    ld hl, old_htimi_hook       ; Our backup
    ld de, #FD9F                ; H.TIMI location
    ld bc, 5                    ; Restore 5 bytes
    ldir

    ; Mark system as disabled
    xor a
    ld (interrupt_system_enabled), a

    ei                          ; Re-enable interrupts
    ret

; ==================================================================
; INTERRUPT_DISPATCHER - Main ISR (60Hz/50Hz)
; ==================================================================
; Register Contract:
;   Purpose: Dispatch enabled interrupt tasks each VBlank and chain BIOS hook.
;   Inputs:
;     - Triggered by H.TIMI hook
;   Outputs:
;     - interrupt_counter incremented
;     - vblank_flag refreshed
;   Clobbers:
;     - AF
;     - BC
;     - DE
;     - HL
;     - IX
;     - IY (all restored before exit)
;   Preserved:
;     - DE
;     - IX
;     - IY
;   Register roles:
;     - HL = walks task_table and holds task pointer
;     - B = task slot loop counter
;     - C = temporary low byte for pointer reconstruction
;     - A = enabled checks and pointer validation
;   Notes:
;     - Dispatcher saves/restores DE/IX/IY defensively, reducing coupling with task internals.

; This routine executes on each V-Blank
; CRITICAL: Minimal CPU cycles, maximum efficiency
; Overhead: ~80 cycles base + ~40 cycles per active task
; ==================================================================
interrupt_dispatcher:
    ; --- STEP 1: Save caller-visible registers used by BIOS/user code ---
    push af                     ; 11 cycles
    push hl                     ; 11 cycles
    push bc                     ; 11 cycles
    push de                     ; 11 cycles
    push ix                     ; 15 cycles
    push iy                     ; 15 cycles
    ; Total: 74 cycles fixed prologue overhead

    ld a, 1
    ld (interrupt_in_progress), a

    ; --- STEP 2: Check if system is enabled ---
    ld a, (interrupt_system_enabled)
    or a
    jr z, .exit                 ; If disabled, exit quickly

    ; --- STEP 3: Increment frame counter ---
    ld hl, (interrupt_counter)
    inc hl
    ld (interrupt_counter), hl

    ; --- STEP 3.5: Update VBlank flag (reads VDP status) ---
    call update_vblank_flag

    ; --- STEP 4: Walk through task table (DI ensures no nested interrupts) ---
    di                          ; Disable interrupts for task execution
    ld hl, task_table           ; HL = pointer to task table
    ld b, 8                     ; 8 slots

.task_loop:
    ; Read task pointer (16-bit address)
    ld a, (hl)                  ; Low byte
    inc hl
    ld c, a
    ld a, (hl)                  ; High byte
    inc hl
    or c                        ; Check if pointer == 0
    jr z, .next_task            ; Skip if disabled (pointer == 0)

    ; Valid pointer: execute task
    dec hl
    dec hl                      ; Back to low byte
    push bc                     ; Save loop counter
    push hl                     ; Save table position

    ; Load task address into HL
    ld c, (hl)                  ; Low byte
    inc hl
    ld h, (hl)                  ; High byte
    ld l, c                     ; HL = task address

    ; Call task using JP (HL) pattern (faster than indirect CALL)
    call .call_task             ; Call the task

    pop hl                      ; Restore table position
    pop bc                      ; Restore loop counter
    inc hl
    inc hl                      ; Advance to next slot
    jr .continue_loop

.next_task:
    ; Nothing to do, HL already points to next slot

.continue_loop:
    djnz .task_loop             ; Loop 8 times

.exit:
    xor a
    ld (interrupt_in_progress), a

    ; --- STEP 5: Restore registers ---
    pop iy                      ; 14 cycles
    pop ix                      ; 14 cycles
    pop de                      ; 10 cycles
    pop bc                      ; 10 cycles
    pop hl                      ; 10 cycles
    pop af                      ; 10 cycles

    ; --- STEP 6: Return from interrupt ---
    ; For H.TIMI we should chain to the original hook (best compatibility)
    ; and let the BIOS interrupt handler manage EI/RETI.
    jp old_htimi_hook

; Helper for indirect call
.call_task:
    jp (hl)                     ; Jump to task (task will RET back here)

; ==================================================================
; TASK MANAGEMENT FUNCTIONS
; ==================================================================

; ==================================================================
; NOTE: wait_vblank function removed - use HALT directly in game loop
; HALT is more efficient (no call/ret overhead)
; ==================================================================

; ==================================================================
; UPDATE_VBLANK_FLAG - For interrupt dispatcher use only
; ==================================================================
; Register Contract:
;   Purpose: Read VDP status register and latch VBlank state in RAM flag.
;   Inputs:
;     - None
;   Outputs:
;     - vblank_flag = 0/1
;   Clobbers:
;     - AF (internally saved/restored)
;   Preserved:
;     - AF, BC, DE, HL
;   Register roles:
;     - A = VDP status read and boolean conversion

; Updates vblank_flag only if we're actually in VBlank
; Called from interrupt_dispatcher
; Inputs: None
; Outputs: None
; Modifies: AF
; ==================================================================
update_vblank_flag:
    push af
    in a, (#99)                 ; Read VDP status register
    bit 7, a                    ; Are we in VBlank?
    jr z, .not_in_vblank
    ld a, 1
    ld (vblank_flag), a
    jr .uvf_done
.not_in_vblank:
    xor a
    ld (vblank_flag), a
.uvf_done:
    pop af
    ret

; ==================================================================
; ENABLE_TASK - Activate a task in the system
; ==================================================================
; Register Contract:
;   Purpose: Store routine pointer into task_table slot.
;   Inputs:
;     - A = task slot (0-7)
;     - HL = task routine address
;   Outputs:
;     - task_table[slot] = HL
;   Clobbers:
;     - AF
;     - BC
;     - DE
;     - HL
;   Preserved:
;     - None
;   Register roles:
;     - A = slot validation and offset math
;     - DE = holds routine address while HL is repurposed as slot pointer
;     - BC = task_table base address
;     - HL = slot address calculation / pointer write

; Inputs:
;   A = task slot (0-7)
;   HL = address of task routine
; Outputs: None
; Modifies: AF, BC, DE, HL
; ==================================================================
enable_task:
    ; Validate slot (0-7)
    cp 8
    ret nc                      ; Return if slot >= 8

    ; Calculate offset in table: slot * 2
    add a, a                    ; A = slot * 2
    ld e, a
    ld d, 0
    ld bc, task_table
    ex de, hl                   ; HL = offset, DE = task address
    add hl, bc                  ; HL = task_table + offset

    ; Write task address
    ex de, hl                   ; HL = task address, DE = slot location
    ld a, l
    ld (de), a                  ; Write low byte
    inc de
    ld a, h
    ld (de), a                  ; Write high byte

    ret

; ==================================================================
; DISABLE_TASK - Deactivate a task
; ==================================================================
; Register Contract:
;   Purpose: Clear routine pointer in selected task slot.
;   Inputs:
;     - A = task slot (0-7)
;   Outputs:
;     - task_table[slot] = 0
;   Clobbers:
;     - AF
;     - DE
;     - HL
;   Preserved:
;     - BC
;   Register roles:
;     - A = slot validation and zero value for clearing
;     - HL = destination slot pointer
;     - DE = computed slot offset

; Inputs:
;   A = task slot (0-7)
; Outputs: None
; Modifies: AF, DE, HL
; ==================================================================
disable_task:
    ; Validate slot
    cp 8
    ret nc

    ; Calculate offset
    add a, a                    ; A = slot * 2
    ld e, a
    ld d, 0
    ld hl, task_table
    add hl, de                  ; HL = task_table + offset

    ; Write 0 (disable)
    xor a
    ld (hl), a                  ; Low byte = 0
    inc hl
    ld (hl), a                  ; High byte = 0

    ret

; ==================================================================
; GET_FRAME_COUNT - Get frame counter value
; ==================================================================
; Register Contract:
;   Purpose: Expose current 16-bit interrupt frame counter.
;   Inputs:
;     - None
;   Outputs:
;     - HL = interrupt_counter
;   Clobbers:
;     - HL
;   Preserved:
;     - AF
;     - BC
;     - DE
;   Register roles:
;     - HL = loaded return value

; Inputs: None
; Outputs: HL = frame count (16-bit)
; Modifies: HL
; ==================================================================
get_frame_count:
    ld hl, (interrupt_counter)
    ret

; ==================================================================
; INIT_DEFAULT_TASKS_FROM_PLAN - Register engine-selected IRQ tasks
; ==================================================================
; Register Contract:
;   Purpose: Enable the IRQ task set selected by the engine execution plan.
;   Inputs:
;     - None
;   Outputs:
;     - task_table updated for all enabled-at-boot tasks
;   Clobbers:
;     - AF
;     - HL
;   Preserved:
;     - BC
;     - DE
;   Register roles:
;     - A = task slot
;     - HL = task routine address
;   Notes:
;     - Calls enable_task once per enabled task.
init_default_tasks_from_plan:
    ld a, 1
    ld hl, task_frame_counter
    call enable_task
    ret

; ==================================================================
; SHARED MAINLINE TASK WRAPPERS
; ==================================================================
; These wrappers stay available in interruptTaskManager mode because
; the HALT-driven GameFlow loops still call them directly.
; ==================================================================

; ==================================================================
; TASK_UPDATE_INPUT - Joystick/Cursor polling wrapper
; ==================================================================
; Register Contract:
;   Purpose: Poll joystick + keyboard fallback and update input state buffers.
;   Inputs:
;     - Reads hardware via FAST_GTSTCK / FAST_GTTRIG / FAST_SNSMAT
;   Outputs:
;     - input_state, prev_input_state, input_btn_curr, input_btn_prev, input_fire
;   Clobbers:
;     - AF
;     - BC
;     - DE
;   Preserved:
;     - AF
;     - BC
;     - DE (by push/pop wrapper)
;     - HL
;   Register roles:
;     - A = hardware reads and final scalar writes
;     - B = direction accumulator
;     - D = button bitmask and keyboard direction flags
;     - E = temporary keyboard row bits
;   Notes:
;     - Wrapper preserves caller-visible regs despite internal mutation.
task_update_input:
    push af
    push bc
    push de

    ; Save previous state
    ld a, (input_state)
    ld (prev_input_state), a
    ld a, (input_btn_curr)
    ld (input_btn_prev), a

    ; Read joystick direction first (priority source, direct hardware)
    xor a                       ; Joystick 0
    call FAST_GTSTCK            ; Direct hardware read
    ld b, a                     ; B = joystick direction
    or a
    jp nz, .dir_ready

    ; Fallback to keyboard cursor keys (row 8, direct matrix read)
    ld a, 8
    call FAST_SNSMAT            ; Active low bits
    ld e, a
    xor a
    ld d, a                     ; D = direction flags: 0=none
    bit 5, e                    ; Up
    jr nz, .kbd_no_up
    set 0, d
.kbd_no_up:
    bit 6, e                    ; Down
    jr nz, .kbd_no_down
    set 1, d
.kbd_no_down:
    bit 4, e                    ; Left
    jr nz, .kbd_no_left
    set 2, d
.kbd_no_left:
    bit 7, e                    ; Right
    jr nz, .kbd_no_right
    set 3, d
.kbd_no_right:
    ; Cancel impossible opposite cursor pairs before mapping to STICK_*
    bit 0, d                    ; Up pressed?
    jr z, .kbd_vertical_ok
    bit 1, d                    ; Down also pressed?
    jr z, .kbd_vertical_ok
    res 0, d
    res 1, d
.kbd_vertical_ok:
    bit 2, d                    ; Left pressed?
    jr z, .kbd_opposites_done
    bit 3, d                    ; Right also pressed?
    jr z, .kbd_opposites_done
    res 2, d
    res 3, d
.kbd_opposites_done:
    xor a
    bit 0, d
    jr z, .kbd_check_down
    bit 3, d
    jr nz, .kbd_upright
    bit 2, d
    jr nz, .kbd_upleft
    ld a, STICK_UP
    jr .kbd_done
.kbd_upright:
    ld a, STICK_UPRIGHT
    jr .kbd_done
.kbd_upleft:
    ld a, STICK_UPLEFT
    jr .kbd_done
.kbd_check_down:
    bit 1, d
    jr z, .kbd_check_lr
    bit 3, d
    jr nz, .kbd_downright
    bit 2, d
    jr nz, .kbd_downleft
    ld a, STICK_DOWN
    jr .kbd_done
.kbd_downright:
    ld a, STICK_DOWNRIGHT
    jr .kbd_done
.kbd_downleft:
    ld a, STICK_DOWNLEFT
    jr .kbd_done
.kbd_check_lr:
    bit 2, d
    jr z, .kbd_check_right
    ld a, STICK_LEFT
    jr .kbd_done
.kbd_check_right:
    bit 3, d
    jr z, .kbd_done
    ld a, STICK_RIGHT
.kbd_done:
    ld b, a
.dir_ready:
    ; Normalize diagonals to cardinal directions for runtime stability
    ; UP+RIGHT/DOWN+RIGHT -> RIGHT, UP+LEFT/DOWN+LEFT -> LEFT
    ld a, b
    cp STICK_UPRIGHT
    jr z, .dir_norm_right
    cp STICK_DOWNRIGHT
    jr z, .dir_norm_right
    cp STICK_UPLEFT
    jr z, .dir_norm_left
    cp STICK_DOWNLEFT
    jr z, .dir_norm_left
    jr .dir_norm_done
.dir_norm_right:
    ld a, STICK_RIGHT
    jr .dir_norm_store
.dir_norm_left:
    ld a, STICK_LEFT
.dir_norm_store:
    ld b, a
.dir_norm_done:
    xor a                       ; Joystick 0
    call FAST_GTTRIG            ; A = #FF if pressed, 0 if not
    ld d, 0                     ; D = button bitmask
    or a
    jr z, .no_fire              ; Jump if NOT pressed (A=0)
    ld d, INPUT_BTN_FIRE
    ld a, 1                     ; Fire pressed
    ld (input_fire), a
    jr .fire_done
.no_fire:
    ; Keyboard fallback for fire (SPACE, row 8 bit 0, active low)
    ld a, 8
    call FAST_SNSMAT
    bit 0, a
    jr nz, .fire_released
    ld d, INPUT_BTN_FIRE
    ld a, 1
    ld (input_fire), a
    jr .fire_done
.fire_released:
    xor a                       ; Fire not pressed
    ld (input_fire), a
.fire_done:
    ; Second action button: joystick button B or keyboard N
    push bc
    push hl
    ld a, 3                    ; GTTRIG(3) = joystick 1 button B
    call GTTRIG
    ld e, a
    pop hl
    pop bc
    ld a, e
    or a
    jr nz, .grab_pressed
    ld a, 4                    ; Keyboard row containing N
    call FAST_SNSMAT
    bit 3, a                   ; N key (active low)
    jr nz, .grab_done
.grab_pressed:
    ld a, d
    or INPUT_BTN_GRAB
    ld d, a
.grab_done:
    ld a, b
    ld (input_state), a
    ld a, d
    ld (input_btn_curr), a

    pop de
    pop bc
    pop af
    ret

; ==================================================================
; ENGINE EXECUTION PLAN TASKS
; ==================================================================

; Slot 1: frame_counter -> task_frame_counter (period=1)

; ==================================================================
; TASK_FRAME_COUNTER - Custom timing/animations
; ==================================================================
; Placeholder for user-defined frame-based timing
; interrupt_counter is already incremented in dispatcher
; ==================================================================
; Register Contract:
;   Purpose: Optional per-frame timing hook for lightweight counters/animations.
;   Inputs:
;     - None
;   Outputs:
;     - None
;   Clobbers:
;     - None
;   Preserved:
;     - AF
;     - BC
;     - DE
;     - HL
;   Register roles:
;     - No registers modified in the default implementation
task_frame_counter:
    ; Placeholder - counter is already incremented in dispatcher
    ; Add custom timing logic here if needed
    ret

; ==================================================================
; USER CUSTOM TASK SLOTS (5-7)
; ==================================================================
; These slots are reserved for user-defined tasks
; Enable them dynamically using:
;   LD A, 5                    ; Slot 5
;   LD HL, my_custom_task
;   CALL enable_task
; ==================================================================



; ==================================================================
; FAR-CALL TRAMPOLINES — bank 0 (always accessible at #4000-#5FFF)
; Far banks are mapped to their window temporarily, routine is called,
; then the original bank is restored. Window used matches the bank ORG.
; ==================================================================

; --- Far bank 4 [#6000, window P1] trampolines ---
FAR_BANK_4 EQU 4

load_screen_pan1_770754008863_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_4
    call mapper_set_bank_p1
    call load_screen_pan1_770754008863
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .load_screen_pan1_770754008863_far_irq_done
    ei
.load_screen_pan1_770754008863_far_irq_done:
    pop af
    ret

load_screen_pan2_771184738851_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_4
    call mapper_set_bank_p1
    call load_screen_pan2_771184738851
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .load_screen_pan2_771184738851_far_irq_done
    ei
.load_screen_pan2_771184738851_far_irq_done:
    pop af
    ret

load_screen_background1_771482721894_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_4
    call mapper_set_bank_p1
    call load_screen_background1_771482721894
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .load_screen_background1_771482721894_far_irq_done
    ei
.load_screen_background1_771482721894_far_irq_done:
    pop af
    ret

load_screen_pan3_771880109228_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_4
    call mapper_set_bank_p1
    call load_screen_pan3_771880109228
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .load_screen_pan3_771880109228_far_irq_done
    ei
.load_screen_pan3_771880109228_far_irq_done:
    pop af
    ret

load_screen_pan4_772291683578_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_4
    call mapper_set_bank_p1
    call load_screen_pan4_772291683578
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .load_screen_pan4_772291683578_far_irq_done
    ei
.load_screen_pan4_772291683578_far_irq_done:
    pop af
    ret

hud_imported_frame_pan1_770754008863_draw_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_4
    call mapper_set_bank_p1
    call hud_imported_frame_pan1_770754008863_draw
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .hud_imported_frame_pan1_770754008863_draw_far_irq_done
    ei
.hud_imported_frame_pan1_770754008863_draw_far_irq_done:
    pop af
    ret

hud_imported_frame_pan2_771184738851_draw_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_4
    call mapper_set_bank_p1
    call hud_imported_frame_pan2_771184738851_draw
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .hud_imported_frame_pan2_771184738851_draw_far_irq_done
    ei
.hud_imported_frame_pan2_771184738851_draw_far_irq_done:
    pop af
    ret

hud_imported_frame_pan3_771880109228_draw_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_4
    call mapper_set_bank_p1
    call hud_imported_frame_pan3_771880109228_draw
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .hud_imported_frame_pan3_771880109228_draw_far_irq_done
    ei
.hud_imported_frame_pan3_771880109228_draw_far_irq_done:
    pop af
    ret

hud_imported_frame_pan4_772291683578_draw_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_4
    call mapper_set_bank_p1
    call hud_imported_frame_pan4_772291683578_draw
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .hud_imported_frame_pan4_772291683578_draw_far_irq_done
    ei
.hud_imported_frame_pan4_772291683578_draw_far_irq_done:
    pop af
    ret

show_presentation_screen_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_4
    call mapper_set_bank_p1
    call show_presentation_screen
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .show_presentation_screen_far_irq_done
    ei
.show_presentation_screen_far_irq_done:
    pop af
    ret

set_screen_colors_far:
    ex af, af'
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_4
    call mapper_set_bank_p1
    ex af, af'
    call set_screen_colors
    ex af, af'
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .set_screen_colors_far_irq_done
    ei
.set_screen_colors_far_irq_done:
    ex af, af'
    ret

init_char0_color_far:
    ex af, af'
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_4
    call mapper_set_bank_p1
    ex af, af'
    call init_char0_color
    ex af, af'
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .init_char0_color_far_irq_done
    ei
.init_char0_color_far_irq_done:
    ex af, af'
    ret

; --- Far bank 5 [#6000, window P1] trampolines ---
FAR_BANK_5 EQU 5

init_entities_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_5
    call mapper_set_bank_p1
    call init_entities
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .init_entities_far_irq_done
    ei
.init_entities_far_irq_done:
    pop af
    ret

update_entities_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_5
    call mapper_set_bank_p1
    call update_entities
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .update_entities_far_irq_done
    ei
.update_entities_far_irq_done:
    pop af
    ret

; --- Far bank 6 [#6000, window P1] trampolines ---
FAR_BANK_6 EQU 6

init_sprites_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_6
    call mapper_set_bank_p1
    call init_sprites
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .init_sprites_far_irq_done
    ei
.init_sprites_far_irq_done:
    pop af
    ret

update_sprites_to_vram_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_6
    call mapper_set_bank_p1
    call update_sprites_to_vram
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .update_sprites_to_vram_far_irq_done
    ei
.update_sprites_to_vram_far_irq_done:
    pop af
    ret

clear_all_sprites_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_6
    call mapper_set_bank_p1
    call clear_all_sprites
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .clear_all_sprites_far_irq_done
    ei
.clear_all_sprites_far_irq_done:
    pop af
    ret

hide_sprite_far:
    ex af, af'
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_6
    call mapper_set_bank_p1
    ex af, af'
    call hide_sprite
    ex af, af'
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .hide_sprite_far_irq_done
    ei
.hide_sprite_far_irq_done:
    ex af, af'
    ret

load_sprite_patterns_by_pack_id_far:
    ex af, af'
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_6
    call mapper_set_bank_p1
    ex af, af'
    call load_sprite_patterns_by_pack_id
    ex af, af'
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .load_sprite_patterns_by_pack_id_far_irq_done
    ei
.load_sprite_patterns_by_pack_id_far_irq_done:
    ex af, af'
    ret

ensure_sprite_patterns_by_pack_id_far:
    ex af, af'
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_6
    call mapper_set_bank_p1
    ex af, af'
    call ensure_sprite_patterns_by_pack_id
    ex af, af'
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .ensure_sprite_patterns_by_pack_id_far_irq_done
    ei
.ensure_sprite_patterns_by_pack_id_far_irq_done:
    ex af, af'
    ret

ensure_sprite_patterns_for_world_id_far:
    ex af, af'
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_6
    call mapper_set_bank_p1
    ex af, af'
    call ensure_sprite_patterns_for_world_id
    ex af, af'
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .ensure_sprite_patterns_for_world_id_far_irq_done
    ei
.ensure_sprite_patterns_for_world_id_far_irq_done:
    ex af, af'
    ret

; --- Far bank 7 [#6000, window P1] trampolines ---
FAR_BANK_7 EQU 7

init_boss_system_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_7
    call mapper_set_bank_p1
    call init_boss_system
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .init_boss_system_far_irq_done
    ei
.init_boss_system_far_irq_done:
    pop af
    ret

init_screen_boss_from_current_screen_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_7
    call mapper_set_bank_p1
    call init_screen_boss_from_current_screen
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .init_screen_boss_from_current_screen_far_irq_done
    ei
.init_screen_boss_from_current_screen_far_irq_done:
    pop af
    ret

update_boss_system_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_7
    call mapper_set_bank_p1
    call update_boss_system
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .update_boss_system_far_irq_done
    ei
.update_boss_system_far_irq_done:
    pop af
    ret

draw_boss_attack_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_7
    call mapper_set_bank_p1
    call draw_boss_attack
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .draw_boss_attack_far_irq_done
    ei
.draw_boss_attack_far_irq_done:
    pop af
    ret

; --- Far bank 8 [#6000, window P1] trampolines ---
FAR_BANK_8 EQU 8

load_world_default_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_8
    call mapper_set_bank_p1
    call load_world_default
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .load_world_default_far_irq_done
    ei
.load_world_default_far_irq_done:
    pop af
    ret

check_world_screen_transition_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_8
    call mapper_set_bank_p1
    call check_world_screen_transition
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .check_world_screen_transition_far_irq_done
    ei
.check_world_screen_transition_far_irq_done:
    pop af
    ret

load_world_worldmap_1770754170935_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_8
    call mapper_set_bank_p1
    call load_world_worldmap_1770754170935
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .load_world_worldmap_1770754170935_far_irq_done
    ei
.load_world_worldmap_1770754170935_far_irq_done:
    pop af
    ret

transition_worldmap_1770754170935_0_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_8
    call mapper_set_bank_p1
    call transition_worldmap_1770754170935_0
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .transition_worldmap_1770754170935_0_far_irq_done
    ei
.transition_worldmap_1770754170935_0_far_irq_done:
    pop af
    ret

transition_worldmap_1770754170935_1_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_8
    call mapper_set_bank_p1
    call transition_worldmap_1770754170935_1
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .transition_worldmap_1770754170935_1_far_irq_done
    ei
.transition_worldmap_1770754170935_1_far_irq_done:
    pop af
    ret

transition_worldmap_1770754170935_2_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_8
    call mapper_set_bank_p1
    call transition_worldmap_1770754170935_2
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .transition_worldmap_1770754170935_2_far_irq_done
    ei
.transition_worldmap_1770754170935_2_far_irq_done:
    pop af
    ret

; --- Far bank 9 [#6000, window P1] trampolines ---
FAR_BANK_9 EQU 9

init_sound_system_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_9
    call mapper_set_bank_p1
    call init_sound_system
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .init_sound_system_far_irq_done
    ei
.init_sound_system_far_irq_done:
    pop af
    ret

task_audio_tick_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_9
    call mapper_set_bank_p1
    call task_audio_tick
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .task_audio_tick_far_irq_done
    ei
.task_audio_tick_far_irq_done:
    pop af
    ret

sfx_update_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_9
    call mapper_set_bank_p1
    call sfx_update
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .sfx_update_far_irq_done
    ei
.sfx_update_far_irq_done:
    pop af
    ret

music_update_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_9
    call mapper_set_bank_p1
    call music_update
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .music_update_far_irq_done
    ei
.music_update_far_irq_done:
    pop af
    ret

music_stop_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_9
    call mapper_set_bank_p1
    call music_stop
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .music_stop_far_irq_done
    ei
.music_stop_far_irq_done:
    pop af
    ret

music_play_track_far:
    ex af, af'
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_9
    call mapper_set_bank_p1
    ex af, af'
    call music_play_track
    ex af, af'
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .music_play_track_far_irq_done
    ei
.music_play_track_far_irq_done:
    ex af, af'
    ret

music_execute_command_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_9
    call mapper_set_bank_p1
    call music_execute_command
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .music_execute_command_far_irq_done
    ei
.music_execute_command_far_irq_done:
    pop af
    ret

; --- Far bank 10 [#6000, window P1] trampolines ---
FAR_BANK_10 EQU 10

init_animated_tiles_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_10
    call mapper_set_bank_p1
    call init_animated_tiles
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .init_animated_tiles_far_irq_done
    ei
.init_animated_tiles_far_irq_done:
    pop af
    ret

update_animated_tiles_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_10
    call mapper_set_bank_p1
    call update_animated_tiles
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .update_animated_tiles_far_irq_done
    ei
.update_animated_tiles_far_irq_done:
    pop af
    ret

update_animated_tiles_vram_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_10
    call mapper_set_bank_p1
    call update_animated_tiles_vram
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .update_animated_tiles_vram_far_irq_done
    ei
.update_animated_tiles_vram_far_irq_done:
    pop af
    ret

; --- Far bank 11 [#6000, window P1] trampolines ---
FAR_BANK_11 EQU 11

render_hud_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_11
    call mapper_set_bank_p1
    call render_hud
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .render_hud_far_irq_done
    ei
.render_hud_far_irq_done:
    pop af
    ret

force_render_hud_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_11
    call mapper_set_bank_p1
    call force_render_hud
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .force_render_hud_far_irq_done
    ei
.force_render_hud_far_irq_done:
    pop af
    ret

imprimir_marco_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_11
    call mapper_set_bank_p1
    call imprimir_marco
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .imprimir_marco_far_irq_done
    ei
.imprimir_marco_far_irq_done:
    pop af
    ret

; --- Far bank 12 [#6000, window P1] trampolines ---
FAR_BANK_12 EQU 12

init_font_system_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_12
    call mapper_set_bank_p1
    call init_font_system
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .init_font_system_far_irq_done
    ei
.init_font_system_far_irq_done:
    pop af
    ret

reload_font_system_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_12
    call mapper_set_bank_p1
    call reload_font_system
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .reload_font_system_far_irq_done
    ei
.reload_font_system_far_irq_done:
    pop af
    ret

; --- Far bank 13 [#6000, window P1] trampolines ---
FAR_BANK_13 EQU 13

; --- Far bank 14 [#6000, window P1] trampolines ---
FAR_BANK_14 EQU 14

load_pattern_bank0_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_14
    call mapper_set_bank_p1
    call load_pattern_bank0
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .load_pattern_bank0_far_irq_done
    ei
.load_pattern_bank0_far_irq_done:
    pop af
    ret

load_pattern_bank1_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_14
    call mapper_set_bank_p1
    call load_pattern_bank1
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .load_pattern_bank1_far_irq_done
    ei
.load_pattern_bank1_far_irq_done:
    pop af
    ret

load_pattern_bank2_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_14
    call mapper_set_bank_p1
    call load_pattern_bank2
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .load_pattern_bank2_far_irq_done
    ei
.load_pattern_bank2_far_irq_done:
    pop af
    ret

load_patterns_to_vram_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_14
    call mapper_set_bank_p1
    call load_patterns_to_vram
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .load_patterns_to_vram_far_irq_done
    ei
.load_patterns_to_vram_far_irq_done:
    pop af
    ret

load_tilebank_tilebank_1770753778086_patterns_to_vram_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_14
    call mapper_set_bank_p1
    call load_tilebank_tilebank_1770753778086_patterns_to_vram
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .load_tilebank_tilebank_1770753778086_patterns_to_vram_far_irq_done
    ei
.load_tilebank_tilebank_1770753778086_patterns_to_vram_far_irq_done:
    pop af
    ret

; --- Far bank 15 [#6000, window P1] trampolines ---
FAR_BANK_15 EQU 15

load_color_bank0_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_15
    call mapper_set_bank_p1
    call load_color_bank0
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .load_color_bank0_far_irq_done
    ei
.load_color_bank0_far_irq_done:
    pop af
    ret

load_color_bank1_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_15
    call mapper_set_bank_p1
    call load_color_bank1
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .load_color_bank1_far_irq_done
    ei
.load_color_bank1_far_irq_done:
    pop af
    ret

load_color_bank2_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_15
    call mapper_set_bank_p1
    call load_color_bank2
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .load_color_bank2_far_irq_done
    ei
.load_color_bank2_far_irq_done:
    pop af
    ret

load_colors_to_vram_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_15
    call mapper_set_bank_p1
    call load_colors_to_vram
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .load_colors_to_vram_far_irq_done
    ei
.load_colors_to_vram_far_irq_done:
    pop af
    ret

load_tilebank_tilebank_1770753778086_colors_to_vram_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_15
    call mapper_set_bank_p1
    call load_tilebank_tilebank_1770753778086_colors_to_vram
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .load_tilebank_tilebank_1770753778086_colors_to_vram_far_irq_done
    ei
.load_tilebank_tilebank_1770753778086_colors_to_vram_far_irq_done:
    pop af
    ret

; ==================================================================
; RESIDENT CALL WRAPPERS — bank 0 stable entrypoints
; Mainline code calls these labels instead of calling banked modules directly.
; Each wrapper dispatches to the local label or its _far trampoline.
; ==================================================================
call_check_world_screen_transition_resident:
    jp check_world_screen_transition_far

call_init_font_system_resident:
    jp init_font_system_far

call_reload_font_system_resident:
    jp reload_font_system_far

call_render_hud_resident:
    jp render_hud_far

call_force_render_hud_resident:
    jp force_render_hud_far

call_init_sound_system_resident:
    jp init_sound_system_far

call_task_audio_tick_resident:
    ; Keep IRQ audio dispatch resident: music_update may live in a far
    ; sound bank, while SM_UpdateSound lives in the primary statemachine
    ; window. Running the original task_audio_tick inside the sound bank
    ; would hide SM_UpdateSound and jump into the wrong bank.
    push af
    push bc
    push de
    push hl
    call call_music_update_resident
    call SM_UpdateSound
    pop hl
    pop de
    pop bc
    pop af
    ret

call_music_update_resident:
    jp music_update_far

call_sfx_update_resident:
    jp sfx_update_far

call_music_stop_resident:
    jp music_stop_far

call_music_play_track_resident:
    jp music_play_track_far

call_music_execute_command_resident:
    jp music_execute_command_far

call_init_sprites_resident:
    jp init_sprites_far

call_load_sprite_patterns_by_pack_id_resident:
    jp load_sprite_patterns_by_pack_id_far

call_ensure_sprite_patterns_by_pack_id_resident:
    jp ensure_sprite_patterns_by_pack_id_far

call_ensure_sprite_patterns_for_world_id_resident:
    jp ensure_sprite_patterns_for_world_id_far

call_set_screen_colors_resident:
    jp set_screen_colors_far

call_init_char0_color_resident:
    jp init_char0_color_far

call_show_sprite_resident:
    cp 32
    ret nc
    push af
    ld a, c
    cp 208
    jr c, .cssr_y_ok
    ld c, SPRITE_INVISIBLE
.cssr_y_ok:
    pop af
    push de
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    ld de, sprite_attributes
    add hl, de
    pop de
    ld (hl), c
    inc hl
    ld (hl), b
    inc hl
    ld (hl), d
    inc hl
    ld (hl), e
    ld a, 1
    ld (sprites_dirty), a
    ret

call_update_sprites_to_vram_resident:
    ld a, (sprites_dirty)
    or a
    ret z
    xor a
    ld (sprites_dirty), a
    ld hl, sprite_attributes
    ld de, SPRATR
    ld bc, 44
    call FAST_LDIRVM
    ret

call_clear_all_sprites_resident:
    ld hl, sprite_attributes
    ld b, 32
    ld a, 224
.casr_loop:
    ld (hl), a
    inc hl
    inc hl
    inc hl
    inc hl
    djnz .casr_loop
    ld a, 1
    ld (sprites_dirty), a
    ret

call_hide_sprite_resident:
    cp 32
    ret nc
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    ld de, sprite_attributes
    add hl, de
    ld (hl), 224
    ld a, 1
    ld (sprites_dirty), a
    ret

call_init_animated_tiles_resident:
    jp init_animated_tiles_far

call_update_animated_tiles_resident:
    jp update_animated_tiles_far

call_update_animated_tiles_vram_resident:
    jp update_animated_tiles_vram_far

call_init_boss_system_resident:
    jp init_boss_system_far

call_init_screen_boss_from_current_screen_resident:
    jp init_screen_boss_from_current_screen_far

call_update_boss_system_resident:
    jp update_boss_system_far

call_draw_boss_attack_resident:
    jp draw_boss_attack_far

call_draw_boss_meteor_attack_resident:
    jp resident_noop

call_draw_boss_bomb_attack_resident:
    jp resident_noop

call_draw_boss_boomerang_attack_resident:
    jp resident_noop

call_draw_boss_rock_attack_resident:
    jp resident_noop

call_draw_boss_laser_attack_resident:
    jp resident_noop

call_draw_boss_sine_wave_attack_resident:
    jp resident_noop

call_draw_boss_homing_missile_attack_resident:
    jp resident_noop

call_load_colors_to_vram_resident:
    jp load_colors_to_vram_far

call_update_entities_resident:
    jp update_entities_far

call_create_entity_resident:
    push af
    call mapper_push_p1
    ld a, 1
    call mapper_set_bank_p1
    pop af
    call create_entity
    push af
    call mapper_pop_p1
    pop af
    ret

call_entity_job_set_resident:
    push af
    call mapper_push_p1
    ld a, 1
    call mapper_set_bank_p1
    pop af
    call entity_job_set
    push af
    call mapper_pop_p1
    pop af
    ret

call_force_update_entity_sprite_resident:
    call mapper_push_p1
    ld a, 1
    call mapper_set_bank_p1
    call force_update_entity_sprite
    call mapper_pop_p1
    ret

call_rebuild_used_entity_list_resident:
    call mapper_push_p1
    ld a, 1
    call mapper_set_bank_p1
    call rebuild_used_entity_list
    call mapper_pop_p1
    ret

resident_noop:
    ret

; ==================================================================
; INIT_GAME_SYSTEMS — in bank 0 so it is reachable from any bank
; Calls routines in statically-mapped primary banks (1-3) via CALL.
; Routines in far banks (4+) are called via _far trampolines above.
; ==================================================================
init_game_systems:
    call DISSCR               ; Disable screen while loading VRAM assets
    ; Cold boot / restart must not trust cached VRAM state from RAM contents.
    xor a
    ld (vram_cache_tile_patterns_ready), a
    ld (vram_cache_tile_colors_ready), a
    ld (vram_cache_font_ready), a
    ld a, #FF
    ld (current_screen2_tilebank_id), a
    ; Initialize component systems (entities detected)
    call init_components

    ; Load shared gameplay pattern/color data once unless VRAM was invalidated.
    call load_patterns_to_vram_far
    call load_colors_to_vram_far

    ; Initialize animated tile runtime (safe no-op if no animated groups)
    call init_animated_tiles_far
    ; Initialize boss runtime (safe no-op if no boss assets)
    call init_boss_system_far

    ; Initialize game entities with real positions from JSON
    call init_entities_far

    ; Load the first game screen
    call load_game_screen
    call rebuild_used_entity_list

    ; Initialize font system
    call init_font_system_far
    ; HUD dirty flag - will be rendered after screen loading (by GameFlow WorldLink)
    ld a, 1
    ld (hud_dirty_flag), a
    call ENASCR               ; Re-enable screen after VRAM updates
    ret

load_game_screen:
    ret

; --- End of Bank 0 — pad to 8KB boundary ---
    ds #6000 - $, #FF

; ##################################################################
; BANK 1 — [#6000h-#8000h] PRIMARY: components
; (Always mapped at boot: bank1→P1, bank2→P2, bank3→P3)
; ##################################################################
    org #6000

; ==================================================================
; GAME COMPONENT SYSTEMS - MSX ECS ENGINE
    ; File: components.asm
        ; Description: Component systems based on Mideas React.js architecture
    ; Implements Position, Sprite, Movement, Collision, Input, and Behavior systems
    ; ==================================================================
;
; INTELLIGENT FILTERING ACTIVE:
;   Active entities: 4
;   Used components: Position, Sprite, Input, Cursors, Gravity, WallCollision, Animation, Jump, StateMachine, Collision, TileInteraction, Patrol
;   Filtered out: 14 unused component systems
    ;
; ==================================================================

; ==================================================================
; COMPONENT TYPE CONSTANTS(Based on ComponentDefinition analysis)
    ; ==================================================================

; Core Components(always present)
COMP_POSITION   EQU 0; Position component(x, y coordinates)
COMP_SPRITE     EQU 1; Sprite rendering component
COMP_MOVEMENT   EQU 2; Movement / velocity component
COMP_COLLISION  EQU 3; Collision detection component
COMP_INPUT      EQU 4; Input handling component
COMP_BEHAVIOR   EQU 5; AI / Logic behavior component
COMP_HEALTH     EQU 6; Health / damage component
COMP_ANIMATION  EQU 7; Animation state component
COMP_JUMP       EQU 8; Jump behavior component(platformer physics)
COMP_GRAVITY    EQU 9; Gravity physics component
COMP_DEADLY_TILES EQU 13; Deadly behavior-map tile detection marker
COMP_AIR_CONTROL EQU 15; Air control restrictions while airborne

    ; Component flags for entity filtering(16 - bit masks for 10 + components)
COMP_MASK_POSITION   EQU #0001; Binary: 0000000000000001
COMP_MASK_SPRITE     EQU #0002; Binary: 0000000000000010
COMP_MASK_MOVEMENT   EQU #0004; Binary: 0000000000000100
COMP_MASK_COLLISION  EQU #0008; Binary: 0000000000001000
COMP_MASK_INPUT      EQU #0010; Binary: 0000000000010000
COMP_MASK_BEHAVIOR   EQU #0020; Binary: 0000000000100000
COMP_MASK_HEALTH     EQU #0040; Binary: 0000000001000000
COMP_MASK_ANIMATION  EQU #0080; Binary: 0000000010000000
COMP_MASK_JUMP       EQU #0100; Binary: 0000000100000000
COMP_MASK_GRAVITY    EQU #0200; Binary: 0000001000000000
COMP_MASK_AUTO_DESTROY EQU #0400; Binary: 0000010000000000
COMP_MASK_DEADLY_TILES EQU #2000; Binary: 0010000000000000
COMP_MASK_WALL_JUMP EQU #4000; Binary: 0100000000000000
COMP_MASK_AIR_CONTROL EQU #8000; Binary: 1000000000000000

; ==================================================================
; ANIMATION FLAGS (entity_anim_flags)
; ==================================================================
ANIM_FLAG_PLAYING            EQU #01
ANIM_FLAG_LOOP               EQU #02
ANIM_FLAG_ONLY_WHEN_MOVING   EQU #04
ANIM_FLAG_COMPLETED          EQU #08
ANIM_FLAG_FORCE_UPLOAD       EQU #10
ANIM_DEFAULT_SPEED           EQU 8

    ; ==================================================================
; COMPONENT DATA STRUCTURES(Entity - Component arrays)
    ; ==================================================================

; NOTE: Core entity variables are now defined in variables.asm
    ; (entity_x_pos, entity_y_pos, entity_vel_x, entity_vel_y, entity_comp_masks, etc.)

    ; Jump Component Data(Fixed - Point 8.8 for smooth physics)
    ; Using temporary storage for optional components to save RAM
entity_jump_vel_y   EQU temp_word_3; Y velocity for jumping(signed word, 32 words = 64 bytes)
entity_slash_vel_x  EQU temp_byte_3; Additive horizontal slash velocity from bonus tiles (32 bytes)
entity_slash_vel_y  EQU temp_byte_28; Additive vertical slash velocity from bonus tiles (32 bytes)
entity_jump_count   EQU temp_byte_4; Current jump count(0 = grounded, 1 = first jump, etc.)(32 bytes)
entity_jump_max     EQU temp_byte_25; Configured max jumps for this entity (32 bytes)
entity_jump_bonus   EQU temp_byte_27; Temporary extra jumps granted by bonus tiles (32 bytes)
entity_on_ground    EQU temp_byte_5; Ground contact flag(bit 0 = on ground)(32 bytes)

    ; Gravity Component Data
entity_gravity_vel  EQU temp_word_4; Accumulated gravity velocity(signed word, 64 bytes)

    ; Health Component Data
entity_health_current EQU temp_byte_6 ; Current health/lives (32 bytes)
entity_health_max     EQU temp_byte_7 ; Maximum health/lives (32 bytes)

; Deadly Tile Collision Data
entity_flag_deadly_tile EQU temp_byte_8 ; Flag: bit 0 = touching deadly tile (32 bytes)
entity_deadly_collision EQU temp_byte_8 ; Backward-compatible alias
tileDead EQU tileDead_dbg ; Debug byte: mirrors hero deadly contact (entity 0)
tileDeadLatched EQU tileDead_latched_dbg ; Debug byte: latched hero deadly detection
tileDeadX EQU tileDead_x_dbg ; Debug byte: last sampled tile X
tileDeadY EQU tileDead_y_dbg ; Debug byte: last sampled tile Y
tileDeadValue EQU tileDead_value_dbg ; Debug byte: raw behavior byte read

    ; Damage Component Data
entity_invincibility_frames EQU temp_byte_9  ; Countdown timer for invulnerability (32 bytes)
entity_damage_amount        EQU temp_byte_10 ; Damage dealt by this entity (32 bytes)

    ; Shoot Component Data
entity_shoot_cooldown   EQU temp_byte_11 ; Cooldown frames until can shoot (32 bytes)
entity_shoot_sprite_id  EQU temp_byte_12 ; Projectile sprite ID (32 bytes)
entity_shoot_speed      EQU temp_byte_13 ; Projectile velocity (32 bytes)

    ; Collision Layer Data (for projectile and advanced collision)
entity_collision_layer  EQU temp_byte_14 ; Which layer this entity is on (32 bytes)
entity_collides_with    EQU temp_byte_15 ; Bitmask of layers this entity collides with (32 bytes)

    ; Platform Riding Data
entity_platform_id      EQU temp_byte_16 ; ID of platform underneath (255 = none) (32 bytes)
entity_platform_grace   EQU temp_byte_17 ; Grace frames for platform (32 bytes)
entity_wall_collision_flags EQU temp_byte_18 ; Directional wall collision bits (32 bytes)
entity_collision_hitbox_w EQU temp_byte_19 ; Entity collision hitbox width (32 bytes)
entity_collision_hitbox_h EQU temp_byte_20 ; Entity collision hitbox height (32 bytes)
entity_collision_offset_x EQU temp_byte_21 ; Entity collision hitbox X offset (32 bytes)
entity_collision_offset_y EQU temp_byte_22 ; Entity collision hitbox Y offset (32 bytes)
entity_entity_collision_flags EQU temp_byte_23 ; bit0 entity(any), bit1 enemy, bit2 item (32 bytes)
entity_last_collision_entity EQU temp_byte_24 ; Last collided entity index (255=none) (32 bytes)

    ; Input Disable Flag
entity_input_disabled EQU temp_byte_26 ; 0=enabled, 1=disabled (32 bytes)


    ; ==================================================================
; CORE ECS SYSTEM FUNCTIONS
    ; ==================================================================

        component_fill_32_a:
        ld (hl), a
        ld d, h
        ld e, l
        inc de
        ld bc, 31
        ldir
        ret

init_components: 
; Initialize component systems(OPTIMIZED - only used components) 
    ; Used: Position, Sprite, Input, Cursors, Gravity, WallCollision, Animation, Jump, StateMachine, Collision, TileInteraction, Patrol 
 
; Initialize current screen ID(multi - screen support) 
        ld a, 0; Start at screen 0 
        ld (current_screen_id), a 
        ld (current_world_id), a
        ld (current_screen_index), a
        ld (screen_transition_cooldown), a
        ld hl, active_entity_list_dirty
        ld (hl), 1

    ; Reset collectible persistence state on new game / restart.
    ; Cartridge RAM is not guaranteed to be zeroed.
        ld hl, gem_count
        ld de, gem_count + 1
        ld bc, 361                 ; bytes to clear - 1 (gem_count..bonus_respawn_frames, including last_interaction_*)
        xor a
        ld (hl), a
        ldir

    ; Clear all component masks 
        ld hl, entity_comp_masks 
        call component_fill_32_a

    ; Clear all component masks (high byte)
        ld hl, entity_comp_masks_hi
        call component_fill_32_a

    ; Initialize entity job scheduler defaults
    ; period=1 (100%), entry=0 for every entity slot
        ld a, 1
        ld hl, entity_job_period
        call component_fill_32_a

        xor a
        ld hl, entity_job_entry
        call component_fill_32_a
        ld (entity_job_scheduler_active), a
 
        ; Initialize position system (always)
    call init_position_system
        ; Initialize sprite system
    call init_sprite_system
        ; Initialize collision system
    call init_collision_system
        ; Initialize input system
    call init_input_system
        ; Initialize animation state defaults (also needed by sprite rendering frame selection)
    call init_animation_system
        ; Initialize jump system
    call init_jump_system
        ; Initialize gravity system
    call init_gravity_system
        ; Initialize cursors system (stub)
    call init_cursors_system
        ; Initialize state machine system (stub)
    call init_statemachine_system
        ; Initialize platform riding system
    call init_platform_riding_system
        ; Initialize wall collision system (stub)
    call init_wallcollision_system
        ; Initialize tile interaction system
    call init_tile_interaction_system
    
    ret
    

; ==================================================================
; POSITION COMPONENT SYSTEM (Based on SpriteEditor position handling)
; ==================================================================

init_position_system:
    ; Initialize position component system
    ; Clear all entity positions
    xor a
    ld hl, entity_x_pos
    call component_fill_32_a

    ld hl, entity_y_pos
    call component_fill_32_a
    ret

update_position_component:
    ; Update positions based on velocities (Movement -> Position)
    ld a, (active_entity_count)
    or a
    ret z
    ld b, a                    ; Loop through used entities only
    ld hl, active_entity_list

position_update_loop:
    ld c, (hl)                 ; C = entity index
    inc hl                     ; Advance list pointer
    push hl                    ; Save list pointer
    ld a, (player_runtime_enabled)
    or a
    jp z, .position_check_mask
    ld a, (player_entity_index)
    cp c
    jp z, .position_skip_fast_player
.position_check_mask:
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)                 ; Get entity component mask
    ld d, a                    ; OPTIMIZED: Save mask in D to avoid redundant memory read
    pop hl                     ; Restore list pointer
    and COMP_MASK_POSITION     ; Check if has position component
    jr z, position_next_entity ; Skip if no position component

    ; Apply velocity to position (if has movement OR input component)
    ld a, d                    ; OPTIMIZED: Reuse saved mask (saves 1 memory read)
    and COMP_MASK_MOVEMENT | COMP_MASK_INPUT
    jr z, position_next_entity ; Skip velocity if no movement/input source

    ; active_entity_list already guarantees current_screen_id membership

    push bc
    push hl

    ; Update X Position
    ; X = X + VelX
    ld hl, entity_vel_x
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                 ; A = VelX
    ld b, a                    ; B = VelX

    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)                 ; A = X
    add a, b                   ; A = X + VelX
    ld (hl), a                 ; Store new X

    ; Update Y Position
    ; Y = Y + VelY (defensive clamp to avoid byte-wrap teleports)
    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)                 ; A = VelY (signed)
    ; Clamp vertical delta to [-16..+16] to avoid single-frame wrap jumps
    bit 7, a
    jr z, .pos_vy_positive
    cp #F0                     ; -16
    jr nc, .pos_vy_ready       ; already in [-16..-1]
    ld a, #F0
    jr .pos_vy_ready
.pos_vy_positive:
    cp #11                     ; 17
    jr c, .pos_vy_ready        ; already in [0..16]
    ld a, #10                  ; +16
.pos_vy_ready:
    ld b, a                    ; B = VelY

    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)                 ; A = Y
    add a, b                   ; A = Y + VelY
    ld (hl), a                 ; Store new Y

    pop hl
    pop bc
    jp position_next_entity

.position_skip_fast_player:
    pop hl

position_next_entity:
    dec b
    jp nz, position_update_loop
    ret

; ==================================================================
; SPRITE COMPONENT SYSTEM (Based on SpriteEditor rendering)
; ==================================================================

init_sprite_system:
    ; Initialize sprite rendering system
    ; Clear all sprite attributes
    call call_clear_all_sprites_resident
    ; Copy entity_sprite_asset_index from ROM to RAM (so CHANGE_SPRITE can modify it)
    ld hl, entity_sprite_asset_index_init
    ld de, entity_sprite_asset_index
    ld bc, 32
    ldir
    ret

update_sprite_component:
    ; Update sprite rendering based on entity positions
    ld a, (render_entity_count)
    or a
    ret z
    ld b, a                    ; Loop through renderable entities only
    ld hl, render_entity_list

sprite_update_loop:
    ld c, (hl)                 ; C = entity index
    inc hl                     ; Advance list pointer
    ld e, c
    ld d, 0
    ld a, (player_runtime_enabled)
    or a
    jp z, .sprite_not_fast_player
    ld a, (player_entity_index)
    cp c
    jp z, sprite_next_entity
.sprite_not_fast_player:

    ; render_entity_list already guarantees active + current_screen_id + sprite
    push bc
    push hl

    ; E already contains entity index (from line 129)
    ; D = 0 (from line 130)
    
    ; Get entity position (X, Y)
    ld hl, entity_x_pos
    add hl, de                 ; HL points to entity X
    ld b, (hl)                 ; B = X position

    ld hl, entity_y_pos
    add hl, de                 ; HL points to entity Y
    ld c, (hl)                 ; C = Y position

    ; Get sprite configuration (Base HW Sprite + Layer Count)
    ; E still contains entity index, D = 0
    ld hl, entity_sprite_config
    add hl, de
    add hl, de                 ; Index * 2 (2 bytes per entry)
    
    ld a, (hl)                 ; Base HW Sprite
    inc hl
    ld h, (hl)                 ; Layer Count
    ld l, a                    ; L = Base HW Sprite (Current HW Sprite)
    ld a, h
    or a
    jp z, sprite_continue      ; No layers -> skip rendering

.sprite_layers_ready:
    ld a, SPRITE_PATTERN_PRELOAD_MODE
    or a
    jr z, .sprite_layers_legacy
    push bc
    push hl
    call compute_entity_base_pattern
    ld d, a                    ; D = current pattern number for layer 0
    pop hl
    pop bc
    jr .sprite_layers_mode_ready

.sprite_layers_legacy:
    ld d, 0                    ; Legacy path recomputes pattern from HW slot each layer

.sprite_layers_mode_ready:
    
    ; Loop through layers
    ; H = Remaining Layers
    ; L = Current HW Sprite
    ; B = X Position
    ; C = Y Position
    
sprite_layer_loop:
    push hl                    ; Save counters
    push bc                    ; Save Position
    ld a, SPRITE_PATTERN_PRELOAD_MODE
    or a
    jr z, .sprite_layer_pattern_legacy
    push de                    ; Preserve current pattern number across lookup/call
    jr .sprite_layer_have_pattern

.sprite_layer_pattern_legacy:
    ld a, l
    sla a
    sla a
    ld d, a                    ; D = Pattern (HW index * 4 for 16x16)
    jr .sprite_layer_have_pattern

.sprite_layer_have_pattern:

    ; Get Color from sprite_layer_colors table
    ; Table is indexed by HW Sprite Index (L)
    push de
    ld de, sprite_layer_colors
    ld a, l
    add a, e
    ld e, a
    ld a, 0
    adc a, d
    ld d, a                    ; DE = &sprite_layer_colors[hwSprite]
    ld a, (de)                 ; A = Color
    pop de                     ; Restore D (Pattern)
    ld e, a                    ; E = Color

    ; Apply signed per-layer Y offset. B/C is restored after the call
    ; from the saved entity position pushed at the top of this layer pass.
    push de                    ; Preserve D=Pattern, E=Color
    ld de, sprite_layer_y_offsets
    ld a, l
    add a, e
    ld e, a
    ld a, 0
    adc a, d
    ld d, a                    ; DE = &sprite_layer_y_offsets[hwSprite]
    ld a, (de)                 ; A = signed Y offset (two's complement)
    pop de
    add a, c
    ld c, a                    ; C = Y + layer offset
    
    ; Call show_sprite (A=HW Sprite, B=X, C=Y, D=Pattern, E=Color)
    ld a, l                    ; A = HW Sprite
    call call_show_sprite_resident

    ld a, SPRITE_PATTERN_PRELOAD_MODE
    or a
    jr z, .sprite_layer_after_pattern_restore
    pop de                     ; Restore current pattern number

.sprite_layer_after_pattern_restore:
    pop bc                     ; Restore Position
    pop hl                     ; Restore counters
    
    inc l                      ; Next HW Sprite
    ld a, SPRITE_PATTERN_PRELOAD_MODE
    or a
    jr z, .sprite_layer_next
    ld a, d
    add a, 4                   ; Next 16x16 pattern
    ld d, a

.sprite_layer_next:
    dec h                      ; Decrement Layer Count
    jr nz, sprite_layer_loop
    
sprite_continue:
    pop hl
    pop bc

sprite_next_entity:
    dec b
    jp nz, sprite_update_loop

    ret

; ==================================================================
; PLAYER SPRITE FASTPATH
; ==================================================================
refresh_player_sprite_fastpath:
    ld a, (player_runtime_enabled)
    or a
    ret z
    ld a, (player_entity_index)
    cp #FF
    ret z
    ld c, a
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_SPRITE
    ret z
    call call_force_update_entity_sprite_resident
    ret

; ==================================================================
; HELPER: Force update a single entity's sprite (used by init_entities)
; Input: C = Entity Index
; ==================================================================
force_update_entity_sprite:
    push bc
    push de
    push hl
    
    ; Get X/Y from memory
    ld hl, entity_x_pos
    ld e, c
    ld d, 0
    add hl, de
    ld b, (hl)                 ; B = X
    
    ld hl, entity_y_pos
    add hl, de
    ld c, (hl)                 ; C = Y

    ; E still has Entity Index, D = 0
    ; B = X, C = Y
    
    ; Get Config
    ld hl, entity_sprite_config
    add hl, de
    add hl, de                 ; Index * 2
    
    ld a, (hl)                 ; Base HW Sprite
    inc hl
    ld h, (hl)                 ; Layer Count
    ld l, a                    ; L = Base HW Sprite
    ld a, h
    or a
    jr z, force_sprite_done    ; Skip if no layers for this entity

.force_sprite_layers_ready:
    ld a, SPRITE_PATTERN_PRELOAD_MODE
    or a
    jr z, .force_sprite_layers_legacy
    push bc
    push hl
    call compute_entity_base_pattern
    ld d, a                    ; D = current pattern number for layer 0
    pop hl
    pop bc
    jr .force_sprite_layers_mode_ready

.force_sprite_layers_legacy:
    ld d, 0                    ; Legacy path recomputes pattern from HW slot each layer

.force_sprite_layers_mode_ready:

    ; Loop through layers
    ; H = Layer Count
    ; L = HW Sprite Index
    ; B = X, C = Y
force_sprite_layer_loop:
    push hl                    ; Save counters
    push bc                    ; Save Position
    ld a, SPRITE_PATTERN_PRELOAD_MODE
    or a
    jr z, .force_sprite_pattern_legacy
    push de                    ; Preserve current pattern number across lookup/call
    jr .force_sprite_have_pattern

.force_sprite_pattern_legacy:
    ld a, l
    sla a
    sla a
    ld d, a                    ; D = Pattern (HW index * 4 for 16x16)
    jr .force_sprite_have_pattern

.force_sprite_have_pattern:

    ; Get Color
    push de
    ld de, sprite_layer_colors
    ld a, l
    add a, e
    ld e, a
    ld a, 0
    adc a, d
    ld d, a
    ld a, (de)
    pop de                     ; Restore D
    ld e, a                    ; E = Color

    ; Apply signed per-layer Y offset. B/C is restored after the call
    ; from the saved entity position pushed at the top of this layer pass.
    push de
    ld de, sprite_layer_y_offsets
    ld a, l
    add a, e
    ld e, a
    ld a, 0
    adc a, d
    ld d, a
    ld a, (de)
    pop de
    add a, c
    ld c, a
    
    ; Call show_sprite
    ld a, l                    ; A = HW Sprite
    call call_show_sprite_resident

    ld a, SPRITE_PATTERN_PRELOAD_MODE
    or a
    jr z, .force_sprite_after_pattern_restore
    pop de                     ; Restore current pattern number

.force_sprite_after_pattern_restore:
    pop bc                     ; Restore Position
    pop hl                     ; Restore counters
    
    inc l
    ld a, SPRITE_PATTERN_PRELOAD_MODE
    or a
    jr z, .force_sprite_next
    ld a, d
    add a, 4
    ld d, a

.force_sprite_next:
    dec h
    jr nz, force_sprite_layer_loop

force_sprite_done:
    pop hl
    pop de
    pop bc
    ret

compute_entity_base_pattern:
    ; Input: DE = entity index
    ; Output: A = base pattern number for this entity's current frame
    ; Clobbers: AF, BC, HL
    ld a, SPRITE_PATTERN_PRELOAD_MODE
    or a
    jr z, .legacy_hw_pattern

    ld hl, entity_sprite_asset_index
    add hl, de
    ld a, (hl)
    cp #FF
    jr z, .placeholder_pattern
    cp SPRITE_ASSET_COUNT
    jr nc, .placeholder_pattern

    ld c, a
    ld b, 0
    ld hl, sprite_asset_base_pattern_slot_runtime
    add hl, bc
    ld a, (hl)                 ; A = base 16x16 pattern slot for this asset
    push af                    ; Save base slot before HL is reused

    ld hl, sprite_asset_layer_count
    add hl, bc
    ld b, (hl)                 ; B = current sprite layer count (frame stride)
    ld a, b
    or a
    jr nz, .sprite_stride_ready
    ld b, 1
.sprite_stride_ready:

    ld hl, entity_anim_frame
    add hl, de
    ld c, (hl)                 ; C = current animation frame

    pop af                     ; A = base slot (restored)
    ld l, a                    ; L = base slot (ready for stride loop)
    ld a, c
    or a
    jr z, .slot_to_pattern

.frame_stride_loop:
    ld a, l
    add a, b
    ld l, a
    dec c
    jr nz, .frame_stride_loop

.slot_to_pattern:
    ld a, l
    add a, a
    add a, a
    ret

.placeholder_pattern:
    ld a, (sprite_placeholder_base_pattern_num)
    ret

.legacy_hw_pattern:
    ld hl, entity_sprite_config
    add hl, de
    add hl, de
    ld a, (hl)
    add a, a
    add a, a
    ret

    ; Movement system filtered out(not used)
init_movement_system:
    ret

update_movement_component:
    ret
    
        ; ==================================================================
; COLLISION COMPONENT SYSTEM(Based on ScreenEditor collision detection)
        ; ==================================================================

            init_collision_system:
    ; Initialize collision detection system
    ; Clear deadly collision flags
    xor a
    ld hl, entity_deadly_collision
    call component_fill_32_a

    ; Clear entity-entity collision flags
    ld hl, entity_entity_collision_flags
    call component_fill_32_a

    ; Initialize last collided entity to "none"
    ld a, 255
    ld hl, entity_last_collision_entity
    call component_fill_32_a

    ; Default collision hitboxes: 16x16 with no offset
    ld a, 16
    ld hl, entity_collision_hitbox_w
    call component_fill_32_a

    ld hl, entity_collision_hitbox_h
    call component_fill_32_a

    xor a
    ld hl, entity_collision_offset_x
    call component_fill_32_a

    ld hl, entity_collision_offset_y
    call component_fill_32_a
    ret

    update_collision_component:
    ; Ground detection for entities with Collision or Gravity components
    ; Sets entity_on_ground flag based on Y position
    ld a, (ground_entity_count)
    or a
    ret z
    ld b, a                       ; Loop through ground-probe entities only
    ld hl, ground_entity_list

    collision_update_loop:
    ld c, (hl)                    ; C = entity index
    inc hl                        ; Advance list pointer
    push hl                       ; Save list pointer

    ; Get entity Y position
    push bc
    push hl
    push de

    ; Ground detection is handled exclusively by update_wallcollision_component (tile-based)
    ; Check only platform_id and grace frames for platform-riding entities
    ; Entity is grounded if: on tiles OR on platform OR has grace frames

    ; Check if entity has platform reference
    push hl
    ld hl, entity_platform_id
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)                    ; A = platform_id
    cp 255
    jr nz, .grounded_by_platform  ; Has platform, mark grounded

    ; No platform, check grace frames
    ld hl, entity_platform_grace
    add hl, de
    ld a, (hl)                    ; A = grace frames
    or a
    jr nz, .grounded_by_platform  ; Has grace, mark grounded

    ; No tiles, no platform, no grace - entity is in air
    pop hl
    ld hl, entity_on_ground
    ld e, c
    ld d, 0
    add hl, de
    res 0, (hl)                   ; Mark as in air
    jr .ground_check_done

.grounded_by_platform:
    ; Entity is grounded by platform or grace frames
    pop hl
    ld hl, entity_on_ground
    ld e, c
    ld d, 0
    add hl, de
    set 0, (hl)                   ; Mark as grounded

.ground_check_done:
    ; Deadly contact is updated later by update_deadly_tiles_component.
    ; Keep collision focused on ground/platform state so we do not resample
    ; the behavior map twice per frame for the same entity.
    pop de
    pop hl
    pop bc

    collision_next_entity:
    pop hl                        ; Restore list pointer
    dec b
    jp nz, collision_update_loop

    ; Run lightweight entity-entity collision pass for all collidable entities
    call update_entity_collision_fast
    ret

update_entity_collision_fast:
    ; =============================================================
    ; Optimized entity-entity collision: 2-phase active-list system
    ; Phase 1: Build list of active collidable entities on screen
    ; Phase 2: Check only valid pairs (i < j) with clamped AABB
    ; Runs every 2 frames (latches previous result on skip frames)
    ; =============================================================

    ; Frame skip - every 2 frames
    ld hl, interrupt_counter
    ld a, (hl)
    and 1
    ret nz

    ; === PHASE 1: Build active list from prefiltered collision bucket ===
    ld hl, coll_list              ; HL = write pointer into coll_list
    xor a
    ld (coll_list_count), a       ; count = 0
    ld a, (collision_entity_count)
    or a
    ret z
    ld b, a
    ld de, collision_entity_list

.build_loop:
    ld a, (de)
    ld c, a
    inc de

    ; Clear collision flags for ALL entities with collision component
    push hl                       ; Save list write pointer
    push de
    ld e, c
    ld d, 0

    ; Clear collision flags for this entity (even if wrong screen)
    ld hl, entity_entity_collision_flags
    add hl, de
    ld (hl), 0
    ld hl, entity_last_collision_entity
    add hl, de
    ld (hl), 255

    ; Entity qualifies - add to list (max MAX_ENTITIES)
    ld a, (coll_list_count)
    cp MAX_ENTITIES
    jp nc, .build_skip            ; List full

    ; Restore pointers in reverse push order: DE read cursor first, then HL write cursor.
    ; The previous order wrote into collision_entity_list instead of coll_list.
    pop de
    pop hl
    ld (hl), c                    ; coll_list[count] = entity index
    inc hl                        ; Advance write pointer
    push hl                       ; Save updated write pointer
    push de

    ld a, (coll_list_count)
    inc a
    ld (coll_list_count), a

.build_skip:
    pop de
    pop hl                        ; Restore list write pointer
    djnz .build_loop

.build_done:
    ; === PHASE 2: Check pairs ===
    ; Need at least 2 entities for any pair
    ld a, (coll_list_count)
    cp 2
    ret c                         ; 0 or 1 entities, nothing to check

    ; Outer loop: i = 0 .. count-2
    ld b, 0                       ; B = outer index i

.outer_loop:
    ld a, (coll_list_count)
    dec a                         ; A = count - 1
    cp b
    jp z, .coll_done              ; i == count-1, done
    jp c, .coll_done              ; safety

    ; Get source entity index from coll_list[i]
    push bc                       ; Save B=i
    ld hl, coll_list
    ld e, b
    ld d, 0
    add hl, de
    ld c, (hl)                    ; C = source entity index

    ; Cache source AABB with clamping
    ld e, c
    ld d, 0

    ; source left = x + offset_x
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    ld hl, entity_collision_offset_x
    add hl, de
    call coll_add_signed_offset_clamped
    ld (coll_src_left), a

    ; source right = left + hitbox_w (clamped)
    ld hl, entity_collision_hitbox_w
    add hl, de
    add a, (hl)
    jp nc, .src_right_ok
    ld a, 255                     ; Clamp on overflow
.src_right_ok:
    ld (coll_src_right), a

    ; source top = y + offset_y
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    ld hl, entity_collision_offset_y
    add hl, de
    call coll_add_signed_offset_clamped
    ld (coll_src_top), a

    ; source bottom = top + hitbox_h (clamped)
    ld hl, entity_collision_hitbox_h
    add hl, de
    add a, (hl)
    jp nc, .src_bot_ok
    ld a, 255
.src_bot_ok:
    ld (coll_src_bottom), a

    ; Inner loop: j = i+1 .. count-1
    ; Preserve C=source entity index while restoring outer index i.
    pop de                        ; D = outer index i, E = saved scratch
    ld b, d
    push de                       ; Save i again for .inner_done
    ld a, b
    inc a                         ; A = i+1
    ld b, a                       ; B = inner index j (reusing B temporarily)
    push bc                       ; Save B=j, (stack: j, i)

.inner_loop:
    pop bc                        ; Restore B=j
    ld a, (coll_list_count)
    cp b
    jp z, .inner_done             ; j == count, done with inner
    jp c, .inner_done

    ; Get target entity index from coll_list[j]
    push bc                       ; Save B=j
    ld hl, coll_list
    ld e, b
    ld d, 0
    add hl, de
    ld b, (hl)                    ; B = target entity index

    ; --- Mutual layer mask check ---
    ; source.collidesWith & target.layer
    ld e, c
    ld d, 0
    ld hl, entity_collides_with
    add hl, de
    ld a, (hl)                    ; A = source.collidesWith
    ld e, b
    ld hl, entity_collision_layer
    add hl, de
    and (hl)                      ; A = source.collidesWith & target.layer
    jp z, .next_inner

    ; target.collidesWith & source.layer
    ld e, b
    ld d, 0
    ld hl, entity_collides_with
    add hl, de
    ld a, (hl)                    ; A = target.collidesWith
    ld e, c
    ld hl, entity_collision_layer
    add hl, de
    and (hl)                      ; A = target.collidesWith & source.layer
    jp z, .next_inner

    ; --- AABB overlap test (source cached, compute target with clamp) ---
    ; target left = x + offset_x
    ld e, b
    ld d, 0
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    ld hl, entity_collision_offset_x
    add hl, de
    push bc
    call coll_add_signed_offset_clamped
    pop bc
    ld e, a                       ; E = target_left

    ; source.right < target.left => no overlap
    ; (edge-touch counts as collision contact)
    ld a, (coll_src_right)
    cp e
    jp c, .next_inner

    ; target right = target_left + hitbox_w (clamped)
    push de                       ; Save E=target_left, D free
    ld e, b
    ld d, 0
    ld hl, entity_collision_hitbox_w
    add hl, de
    pop de                        ; Restore E=target_left
    ld a, e                       ; A = target_left
    add a, (hl)                   ; A = target_left + width
    jp nc, .tgt_right_ok
    ld a, 255
.tgt_right_ok:
    ; source.left > target.right => no overlap
    ; (edge-touch counts as collision contact)
    ld d, a                       ; D = target_right
    ld a, (coll_src_left)
    cp d
    jp c, .x_overlap_ok
    jp z, .x_overlap_ok
    jp .next_inner
.x_overlap_ok:

    ; target top = y + offset_y
    ld e, b
    ld d, 0
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    ld hl, entity_collision_offset_y
    add hl, de
    push bc
    call coll_add_signed_offset_clamped
    pop bc
    ld e, a                       ; E = target_top

    ; source.bottom < target.top => no overlap
    ; (edge-touch counts as collision contact)
    ld a, (coll_src_bottom)
    cp e
    jp c, .next_inner

    ; target bottom = target_top + hitbox_h (clamped)
    push de                       ; Save E=target_top
    ld e, b
    ld d, 0
    ld hl, entity_collision_hitbox_h
    add hl, de
    pop de                        ; Restore E=target_top
    ld a, e                       ; A = target_top
    add a, (hl)                   ; A = target_top + height
    jp nc, .tgt_bot_ok
    ld a, 255
.tgt_bot_ok:
    ; source.top > target.bottom => no overlap
    ; (edge-touch counts as collision contact)
    ld d, a                       ; D = target_bottom
    ld a, (coll_src_top)
    cp d
    jp c, .y_overlap_ok
    jp z, .y_overlap_ok
    jp .next_inner
.y_overlap_ok:

    ; ==========  COLLISION DETECTED between source(C) and target(B) ==========

    ; --- Set flags for SOURCE entity (C) ---
    push bc                       ; Save B=target, C=source
    ld e, c
    ld d, 0

    ; Store target index in source's last_collision_entity
    ld hl, entity_last_collision_entity
    add hl, de
    ld (hl), b

    ; Classify target layer into collision event flags
    push de
    ld e, b
    ld d, 0
    ld hl, entity_collision_layer
    add hl, de
    ld a, (hl)                    ; A = target layer bitmask
    pop de
    call coll_flags_from_layer
    ld hl, entity_entity_collision_flags
    add hl, de
    or (hl)                       ; OR with existing flags (multiple hits)
    ld (hl), a

    ; --- Set flags for TARGET entity (B) --- (bidirectional)
    pop bc                        ; Restore B=target, C=source
    push bc

    ld e, b
    ld d, 0

    ; Store source index in target's last_collision_entity
    ld hl, entity_last_collision_entity
    add hl, de
    ld (hl), c

    ; Classify source layer into collision event flags
    push de
    ld e, c
    ld d, 0
    ld hl, entity_collision_layer
    add hl, de
    ld a, (hl)                    ; A = source layer bitmask
    pop de
    call coll_flags_from_layer
    ld hl, entity_entity_collision_flags
    add hl, de
    or (hl)                       ; OR with existing flags
    ld (hl), a

    pop bc                        ; Restore B=target, C=source

.next_inner:
    ; Advance j
    pop bc                        ; Restore B=j (inner index)
    inc b
    push bc                       ; Save updated j
    jp .inner_loop

.inner_done:
    pop de                        ; Restore D=i (keep C=source untouched)
    ld b, d
    inc b                         ; i++
    jp .outer_loop

.coll_done:
    ret

        ; ==================================================================
; COLLISION HELPER FUNCTIONS(Critical for Gameplay Parity)
        ; ==================================================================

; ------------------------------------------------------------------
; coll_add_signed_offset_clamped
; Input:  A = base coordinate (0..255)
;         HL = pointer to signed offset byte (-128..127, two's complement)
; Output: A = clamped (base + offset), saturated to 0..255
; Clobbers: B
; ------------------------------------------------------------------
coll_add_signed_offset_clamped:
    ld b, (hl)                    ; B = signed offset byte
    add a, b                      ; A = base + offset (wrapped)
    bit 7, b
    jr z, .casc_positive
    ; Negative offset: carry=0 means underflow (wrapped below 0)
    jr c, .casc_done
    xor a                         ; Clamp to 0
    ret
.casc_positive:
    ; Positive offset: carry=1 means overflow (wrapped above 255)
    jr nc, .casc_done
    ld a, 255                     ; Clamp to 255
.casc_done:
    ret

; ------------------------------------------------------------------
; coll_flags_from_layer
; Input:  A = collision layer bitmask of the other entity
; Output: A = collision event flags (entity/enemy/item)
; Clobbers: B, C
; ------------------------------------------------------------------
coll_flags_from_layer:
    ld b, a
    ld c, COLLISION_EVENT_ENTITY

    ld a, b
    and COLLISION_LAYER_ENEMY
    jr z, .cffl_no_enemy
    ld a, c
    or COLLISION_EVENT_ENEMY
    ld c, a
.cffl_no_enemy:
    ld a, b
    and COLLISION_LAYER_ITEM
    jr z, .cffl_done
    ld a, c
    or COLLISION_EVENT_ITEM
    ld c, a
.cffl_done:
    ld a, c
    ret

            check_tile_collision:
    ; Check collision with background tiles
        ; A = X position, B = Y position
        ; Convert pixel position to tile coordinates
    push af
    push bc

        ; DYNAMIC TILE SIZE CONVERSION
        ; TODO: This should be calculated from actual screen map tile sizes
        ; For now, detect most common tile size in project
; MSX Screen 2: behavior map is 32x24 (one entry per 8x8 character cell)
    ; Always divide by 8 to convert pixels to character column/row
    ; Convert X to tile column (divide by 8)

    srl a                      ; A = X / 2
    srl a                      ; A = X / 4
    srl a                      ; A = X / 8
    ld c, a; C = tile column

        ; Convert Y to tile row (divide by 8)
    ld a, b
    srl a                      ; A = Y / 2
    srl a                      ; A = Y / 4
    srl a                      ; A = Y / 8
    ld b, a; B = tile row

        ; Check if position is within valid tile map
    ld a, c
    cp 32; Screen width in tiles
    jr nc, no_tile_collision
    ld a, b
    cp 24; Screen height in tiles
    jr nc, no_tile_collision

        ; Get tile at position(simplified - would read from behavior map)
        ; For now, assume all non - zero tiles are solid
        ; This would read from the behavior map generated from screen data
    call get_behavior_tile; Returns A = behavior value
    and #F0               ; Family bits only (0=NoSolid, #10+=Solid)
    jr z, no_tile_collision; 0 = passable (NoSolid family)

        ; Collision detected - handle it
    call handle_tile_collision

    no_tile_collision:
    pop bc
    pop af
    ret

    check_entity_collision:
    ; Check collision with other entities
        ; A = current entity X, B = current entity Y, C = current entity index
    push bc
    push af

        ; Loop through all other entities
    ld hl, entity_comp_masks
    ld e, 0; Other entity index

    entity_collision_loop:
    ld a, e
    cp c; Skip self
    jr z, next_entity_collision

        ; Check if other entity has collision component
    ld a, (hl)
    and COMP_MASK_COLLISION
    jr z, next_entity_collision

        ; Get other entity position
    push hl
    push de

    ld hl, entity_x_pos
    ld d, 0
    add hl, de; HL points to other entity X
    ld d, (hl); D = other X

    push de; Save D=otherX, E=otherIndex
    ld d, 0; Reset D for correct address calculation
    ld hl, entity_y_pos
    add hl, de; HL points to other entity Y
    ld a, (hl); A = other Y
    pop de; Restore D=otherX, E=otherIndex
    ld e, a; E = other Y

        ; Check if entities overlap(16x16 sprites)
            ; Current entity: A = X, B = Y
                ; Other entity: D = X, E = Y

                    ; X overlap check: | X1 - X2 | <16
    ld h, a; H = current X
    ld a, d; A = other X
    sub h; A = other X - current X
    jr nc, x_diff_positive; Jump if positive
    neg; Make positive
    x_diff_positive:
    cp 16; Check if <16
    jr nc, no_entity_collision; No X overlap

        ; Y overlap check: | Y1 - Y2 | <16
    ld a, e; A = other Y
    sub b; A = other Y - current Y
    jr nc, y_diff_positive; Jump if positive
    neg; Make positive
    y_diff_positive:
    cp 16; Check if <16
    jr nc, no_entity_collision; No Y overlap

        ; Collision detected!
    call handle_entity_collision

    no_entity_collision:
    pop de
    pop hl

    next_entity_collision:
    inc hl; Next entity mask
    inc e; Next entity index
    ld a, e
    cp 32; Check all 32 entities
    jr nz, entity_collision_loop

    pop af
    pop bc
    ret

    handle_boundary_collision:
    ; Handle collision with screen boundaries
    ; C = entity index (from collision loop)
    push de
    push hl
    ld e, c
    ld d, 0
    xor a
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a              ; Stop X movement for this entity
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a              ; Stop Y movement for this entity
    pop hl
    pop de
    ret

    handle_tile_collision:
    ; Handle collision with solid tiles
    ; C = entity index (from collision loop)
    push de
    push hl
    ld e, c
    ld d, 0
    xor a
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a              ; Stop X movement for this entity
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a              ; Stop Y movement for this entity
    pop hl
    pop de
    ret

    handle_entity_collision:
    ; Handle collision between entities
    ; At entry:
    ;   C = current entity index
    ;   Stack top: DE (E = other entity index), HL, AF, BC
    ; Check for platform riding: if current entity is above other entity and
    ; other entity is a platform (collision_layer & 8), set platform reference

    push bc
    push de
    push hl

    ; Get other entity index from stack (it's at SP+6)
    ld hl, 6
    add hl, sp
    ld a, (hl)              ; A = other entity index (E from pushed DE)
    ld e, a                 ; E = other entity index

    ; Get current entity Y position
    ld hl, entity_y_pos
    ld d, 0
    ld b, c                 ; B = current entity index
    add hl, bc              ; HL = &entity_y_pos[current]
    ld b, (hl)              ; B = current Y

    ; Get other entity Y position
    ld hl, entity_y_pos
    ld d, 0
    add hl, de              ; HL = &entity_y_pos[other]
    ld d, (hl)              ; D = other Y

    ; Check if current entity is above other entity
    ; Current is above if: current_Y + 16 is near other_Y (within 4 pixels)
    ld a, b                 ; A = current Y
    add a, 16               ; A = current Y + height
    sub d                   ; A = (current Y + 16) - other Y
    ; If result is 0-4, current is standing on other
    cp 5
    jr nc, .not_on_platform ; Not standing on platform

    ; Current entity is above other entity
    ; Check if other entity is a platform (collision_layer & COLLISION_LAYER_PLATFORM)
    ld hl, entity_collision_layer
    ld d, 0
    add hl, de              ; HL = &entity_collision_layer[other]
    ld a, (hl)              ; A = other entity collision layer
    and COLLISION_LAYER_PLATFORM
    jr z, .not_on_platform  ; Not a platform

    ; Other entity IS a platform - set platform reference
    ld a, e                 ; A = other entity index
    ld hl, entity_platform_id
    ld d, 0
    ld e, c                 ; E = current entity index
    add hl, de              ; HL = &entity_platform_id[current]
    ld (hl), a              ; Set platform reference

    ; Reset grace frames to 0 (we're on a platform now)
    ld hl, entity_platform_grace
    ld e, c
    add hl, de
    ld (hl), 0

.not_on_platform:
    pop hl
    pop de
    pop bc
    ret

        
    ; ------------------------------------------------------------------
    ; get_behavior_tile
    ; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Read behavior byte for tile at (B=row, C=column) from the runtime behavior map.
;   Inputs:
;     - B = tile row    (0..23, out-of-range → A=0, passable)
;     - C = tile column (0..31, out-of-range → A=0, passable)
;     - current_behavior_map = 16-bit pointer to active screen behavior map
;     - current_behavior_map_bank = memory bank number (mapper context)
;   Outputs:
;     - A = behavior byte:
;     -   bits 7-4 (A & #F0): family / solidity class (0x00 = NoSolid, 0x10+ = Solid)
;     -   bits 3-0 (A & #0F): flag bits (e.g. 0x08 = Interactable)
;   Clobbers:
;     - AF
;   Preserved:
;     - BC
;     - DE
;     - HL
;   Notes:
;     - Maintains a single-row cache (behavior_cache_row / behavior_cache_row_base)
;     - so consecutive calls for the same row skip the row*32 multiply.
;     - Mapper push/pop protects data-window bank around the map read (no-op in simple32k mode).
;     - MUST be called with DE = entity index already set (DE is preserved, not used).

get_behavior_tile:
    ; Bounds check: row must be 0-23, column must be 0-31
    ; NOTE: jp nc (not jr nc) to gbt_oob — gbt_oob is a global label defined after
    ; get_behavior_tile_nb. Using jr would create a local-label scoping conflict in
    ; glass.jar (get_behavior_tile_nb: starts a new scope, so .bt_out_of_bounds would
    ; belong to that scope, not get_behavior_tile's scope).
    ld a, b
    cp 24
    jp nc, gbt_oob                ; Row >= 24: treat as passable
    ld a, c
    cp 32
    jp nc, gbt_oob                ; Column >= 32: treat as passable
get_behavior_tile_nb:
    ; Entry point for callers that guarantee B ∈ 0..23 and C ∈ 0..31.
    ; Saves 36 cycles (4+7+7+4+7+7) by skipping bounds validation.
    ; DO NOT call this unless the probe coordinates are provably in-bounds.
    push hl
    push de

    ; Load cached behavior map pointer (fallback to current_behavior_map)
    ld hl, behavior_cache_map_l
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, d
    or e
    jr nz, .map_ptr_ready

    ld de, (current_behavior_map)
    ld a, e
    ld (behavior_cache_map_l), a
    ld a, d
    ld (behavior_cache_map_h), a
    ld a, #FF
    ld (behavior_cache_row), a

.map_ptr_ready:
    ; Reuse previous row base when checking multiple points on same row
    ld a, b
    ld hl, behavior_cache_row
    cp (hl)
    jr z, .use_cached_row_base

    ; Cache miss: row base = behavior_map + row*32
    ld a, b
    ld l, a
    ld h, 0
    add hl, hl                    ; HL = row * 2
    add hl, hl                    ; HL = row * 4
    add hl, hl                    ; HL = row * 8
    add hl, hl                    ; HL = row * 16
    add hl, hl                    ; HL = row * 32
    add hl, de                    ; HL = row base address

    ld a, b
    ld (behavior_cache_row), a
    ld (behavior_cache_row_base), hl
    jr .row_base_ready

.use_cached_row_base:
    ld hl, (behavior_cache_row_base)

.row_base_ready:
    ld e, c
    ld d, 0
    add hl, de                    ; HL = row base + column

    ; Banked ROM build: protect data-window bank around the read in case behavior map is in ROM bank.
    call mapper_push_p3
    ld a, (current_behavior_map_bank)
    call mapper_set_bank_p3
    ld a, (hl)                    ; A = behavior value
    push af
    call mapper_pop_p3
    pop af
    pop de
    pop hl
    ret
gbt_oob:
    xor a                         ; A = 0 (passable)
    ret
    
        ; ==================================================================
        ; INPUT COMPONENT SYSTEM (With direction restrictions - Cursors)
        ; ==================================================================

        init_input_system:
            ; Initialize input handling system
            xor a
            ld (input_state), a
            ld (prev_input_state), a
            ld (input_btn_curr), a
            ld (input_btn_prev), a
            ld (input_fire), a

            ; Initialize direction masks for all entities (default: all directions allowed)
            ld hl, entity_dir_mask
            ld de, entity_dir_mask + 1
            ld bc, 31
            ld (hl), #0F               ; Default: 00001111 = all directions enabled
            ldir

            ; Initialize cursor speed for all entities (default: 2 px/frame)
            ld hl, entity_input_speed
            ld de, entity_input_speed + 1
            ld bc, 31
            ld (hl), 2
            ldir

            ; Initialize input disabled flags to 0 (all entities start with input ENABLED)
            ld hl, entity_input_disabled
            ld de, entity_input_disabled + 1
            ld bc, 31
            ld (hl), 0
            ldir

            ; Initialize ladder state flags to 0
            ld hl, entity_on_ladder
            ld de, entity_on_ladder + 1
            ld bc, 31
            ld (hl), 0
            ldir
            ret

        update_input_component:
            ; Update input handling for player entities
            ; NOTE: input_state/prev_input_state are polled by interrupt task_update_input

            ; Process input for entities with input component
            ld a, (input_entity_count)
            or a
            ret z
            ld b, a                    ; Loop through input-enabled entities only
            ld hl, input_entity_list

        input_update_loop:
            ld c, (hl)                 ; C = entity index
            inc hl                     ; Advance list pointer
            push hl                    ; Save list pointer
            pop hl                     ; Restore list pointer
            ld a, (player_runtime_enabled)
            or a
            jp z, .input_not_fast_player
            ld a, (player_entity_index)
            cp c
            jp z, input_next_entity
        .input_not_fast_player:

            push hl
            call update_entity_ladder_state_c
            pop hl

            ; input_entity_list already guarantees active + current_screen_id + input

            ; Check if input is disabled for this entity (DISABLE_INPUT action)
            push hl
            ld e, c
            ld d, 0
            ld hl, entity_input_disabled
            add hl, de
            ld a, (hl)
            pop hl
            or a
            jp z, .input_enabled
            ; Input disabled: zero velocity and skip
            push hl
            ld e, c
            ld d, 0
            ld hl, entity_vel_x
            add hl, de
            ld (hl), 0
            ld hl, entity_vel_y
            add hl, de
            ld (hl), 0
            pop hl
            jp input_next_entity
        .input_enabled:

            ; Apply input to entity movement (real implementation)
            push bc
            push hl

            call aircontrol_should_lock_horizontal_c
            jp z, .input_aircontrol_continue
            pop hl
            pop bc
            jp input_next_entity
.input_aircontrol_continue:

            ; Get direction mask for this entity
            ld hl, entity_dir_mask
            ld e, c
            ld d, 0
            add hl, de
            ld d, (hl)                 ; D = direction mask (allowUp / Down / Left / Right)

            ; Convert joystick input to velocity
            ld a, (input_state)
            ld b, 0                    ; Default X velocity
            ld c, 0                    ; Default Y velocity

            ; Resolve per-entity input speed once per update.
            ; H = cardinal speed, L = diagonal speed (max(1, speed/2)).
            push af
            ld a, d
            push af
            ld d, 0
            ld hl, entity_input_speed
            add hl, de
            ld a, (hl)
            or a
            jr nz, .input_speed_ok
            ld a, 1
        .input_speed_ok:
            ld h, a
            srl a
            jr nz, .input_diag_speed_ok
            ld a, 1
        .input_diag_speed_ok:
            ld l, a
            pop af
            ld d, a
            pop af

            ; Check directional input with direction restrictions
            cp STICK_UP
            jp z, input_move_up
            cp STICK_DOWN
            jp z, input_move_down
            cp STICK_LEFT
            jp z, input_move_left
            cp STICK_RIGHT
            jp z, input_move_right
            cp STICK_UPRIGHT
            jp z, input_move_upright
            cp STICK_UPLEFT
            jp z, input_move_upleft
            cp STICK_DOWNRIGHT
            jp z, input_move_downright
            cp STICK_DOWNLEFT
            jp z, input_move_downleft
            jp input_apply_velocity

        input_move_up:
            ; Check if UP is allowed (bit 0)
            ld a, d
            and DIR_ALLOW_UP
            jp z, input_apply_velocity ; Not allowed, skip
            ld a, h
            neg
            ld c, a                    ; Negative Y velocity (up)
            jp input_apply_velocity

        input_move_down:
            ; Check if DOWN is allowed (bit 1)
            ld a, d
            and DIR_ALLOW_DOWN
            jp z, input_apply_velocity ; Not allowed, skip
            ld a, h
            ld c, a                    ; Positive Y velocity (down)
            jp input_apply_velocity

        input_move_left:
            ; Check if LEFT is allowed (bit 2)
            ld a, d
            and DIR_ALLOW_LEFT
            jp z, input_apply_velocity ; Not allowed, skip
            ld a, h
            neg
            ld b, a                    ; Negative X velocity (left)
            jp input_apply_velocity

        input_move_right:
            ; Check if RIGHT is allowed (bit 3)
            ld a, d
            and DIR_ALLOW_RIGHT
            jp z, input_apply_velocity ; Not allowed, skip
            ld a, h
            ld b, a                    ; Positive X velocity (right)
            jp input_apply_velocity

        input_move_upright:
            ; Check if both UP and RIGHT are allowed
            ld a, d
            and DIR_ALLOW_UP
            jp z, input_check_right_only ; UP not allowed
            ld a, d
            and DIR_ALLOW_RIGHT
            jp z, input_check_up_only  ; RIGHT not allowed
            ; Both allowed - diagonal
            ld a, l                    ; Diagonal movement (slower)
            ld b, a
            neg
            ld c, a
            jp input_apply_velocity
        input_check_right_only:
            ; Only RIGHT allowed
            ld a, d
            and DIR_ALLOW_RIGHT
            jp z, input_apply_velocity
            ld a, h
            ld b, a
            jp input_apply_velocity
        input_check_up_only:
            ; Only UP allowed
            ld a, h
            neg
            ld c, a
            jp input_apply_velocity

        input_move_upleft:
            ; Check if both UP and LEFT are allowed
            ld a, d
            and DIR_ALLOW_UP
            jp z, input_check_left_only1 ; UP not allowed
            ld a, d
            and DIR_ALLOW_LEFT
            jp z, input_check_up_only1 ; LEFT not allowed
            ; Both allowed - diagonal
            ld a, l
            neg
            ld b, a
            ld c, a
            jp input_apply_velocity
        input_check_left_only1:
            ; Only LEFT allowed
            ld a, d
            and DIR_ALLOW_LEFT
            jp z, input_apply_velocity
            ld a, h
            neg
            ld b, a
            jp input_apply_velocity
        input_check_up_only1:
            ; Only UP allowed
            ld a, h
            neg
            ld c, a
            jp input_apply_velocity

        input_move_downright:
            ; Check if both DOWN and RIGHT are allowed
            ld a, d
            and DIR_ALLOW_DOWN
            jp z, input_check_right_only2 ; DOWN not allowed
            ld a, d
            and DIR_ALLOW_RIGHT
            jp z, input_check_down_only2 ; RIGHT not allowed
            ; Both allowed - diagonal
            ld a, l
            ld b, a
            ld c, a
            jp input_apply_velocity
        input_check_right_only2:
            ; Only RIGHT allowed
            ld a, d
            and DIR_ALLOW_RIGHT
            jp z, input_apply_velocity
            ld a, h
            ld b, a
            jp input_apply_velocity
        input_check_down_only2:
            ; Only DOWN allowed
            ld a, h
            ld c, a
            jp input_apply_velocity

        input_move_downleft:
            ; Check if both DOWN and LEFT are allowed
            ld a, d
            and DIR_ALLOW_DOWN
            jp z, input_check_left_only3 ; DOWN not allowed
            ld a, d
            and DIR_ALLOW_LEFT
            jp z, input_check_down_only3 ; LEFT not allowed
            ; Both allowed - diagonal
            ld a, l
            ld c, a
            neg
            ld b, a
            jp input_apply_velocity
        input_check_left_only3:
            ; Only LEFT allowed
            ld a, d
            and DIR_ALLOW_LEFT
            jp z, input_apply_velocity
            ld a, h
            neg
            ld b, a
            jp input_apply_velocity
        input_check_down_only3:
            ; Only DOWN allowed
            ld a, h
            ld c, a

        input_apply_velocity:
            ; Apply calculated velocity to entity
            ; B = X velocity, C = Y velocity, E = entity index (preserved from earlier)
            ld d, 0
            ld hl, entity_vel_x
            add hl, de
            ld (hl), b                 ; entity_vel_x[entity_index] = X velocity

            ld hl, entity_vel_y
            add hl, de
            ld (hl), c                 ; entity_vel_y[entity_index] = Y velocity

            ; Update entity_facing_dir based on input_state
            ; Only updates for directional inputs (0 = no change, keeps last facing)
            push af
            ld a, (input_state)
            or a
            jr z, .input_facing_done    ; 0 = no direction pressed, keep last facing
            cp 2
            jr c, .input_facing_up      ; 1 = UP only
            cp 5
            jr c, .input_facing_right   ; 2,3,4 = UP+RIGHT, RIGHT, DOWN+RIGHT
            jr z, .input_facing_down    ; 5 = DOWN only
            ; 6,7,8 = DOWN+LEFT, LEFT, UP+LEFT
            ld a, 1                     ; FACING_LEFT = 1
            jr .input_facing_write
.input_facing_right:
            ld a, 2                     ; FACING_RIGHT = 2
            jr .input_facing_write
.input_facing_up:
            ld a, 3                     ; FACING_UP = 3
            jr .input_facing_write
.input_facing_down:
            ld a, 4                     ; FACING_DOWN = 4
.input_facing_write:
            push hl
            push de
            ld hl, entity_facing_dir
            add hl, de                  ; DE = (0, entity_index)
            ld (hl), a
            pop de
            pop hl
.input_facing_done:
            pop af

            ; Sync directional sprite facing for input-driven entities.
            ; Uses sprite_dir_* lookup tables (left/right/up/down variants).
            ; Skip only when the assigned state machine explicitly uses ChangeSprite.
            ; Plain state machines without sprite actions must keep auto-facing active.
            push af
            ld hl, entity_sm_sprite_control
            add hl, de              ; DE = (0, entity_index)
            ld a, (hl)
            pop af
            jr nz, .skip_patrol_facing
            call update_entity_patrol_facing
.skip_patrol_facing:

            pop hl
            pop bc

        input_next_entity:
            dec b
            jp nz, input_update_loop
            ret
    
    ; Behavior system filtered out(not used)
init_behavior_system:
    ret

update_behavior_component:
    ret
    
    ; Health system filtered out(not used)
init_health_system:
    ret

update_health_component:
    ret
    
    ; ==================================================================
        ; ANIMATION COMPONENT SYSTEM
    ; ==================================================================

        init_animation_system:
            ; Initialize animation component data
            ; Clear frames
            ld hl, entity_anim_frame
            ld de, entity_anim_frame+1
            ld bc, 31
            ld (hl), 0
            ldir

            ; Clear ticks
            ld hl, entity_anim_tick
            ld de, entity_anim_tick+1
            ld bc, 31
            ld (hl), 0
            ldir

            ; Default speed = ANIM_DEFAULT_SPEED
            ld hl, entity_anim_speed
            ld de, entity_anim_speed+1
            ld bc, 31
            ld (hl), ANIM_DEFAULT_SPEED
            ldir

            ; Default flags = playing + loop (loop cleared/set per-sprite by Action_ChangeSprite)
            ld hl, entity_anim_flags
            ld de, entity_anim_flags+1
            ld bc, 31
            ld (hl), ANIM_FLAG_PLAYING | ANIM_FLAG_LOOP
            ldir
            ret

        update_animation_component:
            ; Update animations for entities
            ; - Advances entity_anim_frame using entity_anim_tick/entity_anim_speed
            ; - In preload mode, sprite rendering picks the frame directly from SAT pattern indices
            ; - In fallback mode, copies the selected frame's patterns to VRAM for this entity
            ld a, (anim_entity_count)
            or a
            ret z
            ld b, a                    ; Loop animated render entities only
            ld hl, anim_entity_list

        .anim_loop:
            ld c, (hl)                 ; C = entity index
            inc hl                     ; Advance list pointer
            push hl                    ; Save list pointer
            ld e, c
            ld d, 0
            pop hl                     ; Restore list pointer
            ld a, (player_runtime_enabled)
            or a
            jp z, .anim_not_fast_player
            ld a, (player_entity_index)
            cp c
            jp z, .anim_next_entity
        .anim_not_fast_player:

            ; anim_entity_list already guarantees active + current_screen_id + animation + sprite

            push bc
            push hl

            ; Check flags (playing?)
            ld e, c
            ld d, 0
            ld hl, entity_anim_flags
            add hl, de
            ld a, (hl)
            bit 0, a
            jp z, anim_done_entity

            ; Only animate when moving?
            bit 2, a
            jr z, .tick

            ; vel_x != 0 || vel_y != 0
            ld hl, entity_vel_x
            add hl, de
            ld a, (hl)
            ld hl, entity_vel_y
            add hl, de
            or (hl)
            jp z, anim_done_entity

        .tick:
            ; ChangeSprite defers the frame sync to the next animation pass
            ; so sprite changes happen from the regular frame pipeline instead
            ; of mid-frame inside the state-machine action path.
            ld hl, entity_anim_flags
            add hl, de
            bit 4, (hl)
            jr z, .anim_tick_advance
            res 4, (hl)
            ld hl, entity_sprite_asset_index
            add hl, de
            ld a, (hl)
            cp #FF
            jp z, anim_done_entity
            cp SPRITE_ASSET_COUNT
            jp nc, anim_done_entity
            ld b, a                    ; B = sprite asset index for forced upload
            ld hl, entity_anim_frame
            add hl, de
            ld a, (hl)
            jp .anim_upload_frame

        .anim_tick_advance:
            ; tick++
            ld hl, entity_anim_tick
            add hl, de
            inc (hl)

            ; if tick < speed -> done
            ld a, (hl)
            ld hl, entity_anim_speed
            add hl, de
            cp (hl)
            jp c, anim_done_entity

            ; tick = 0
            ld hl, entity_anim_tick
            add hl, de
            ld (hl), 0

            ; Sprite asset index for this entity (#FF = none)
            ld hl, entity_sprite_asset_index
            add hl, de
            ld a, (hl)
            cp #FF
            jp z, anim_done_entity
            cp SPRITE_ASSET_COUNT
            jp nc, anim_done_entity
            ld b, a                    ; B = sprite asset index

            ; frameCount = sprite_asset_frame_count[B]
            ld hl, sprite_asset_frame_count
            ld e, b
            ld d, 0
            add hl, de
            ld a, (hl)                 ; A = frameCount
            cp 2
            jp nc, .anim_has_multiple_frames

            ; 0/1-frame one-shots must still complete. This lets temporary
            ; sprites such as wall-jump poses restore automatically.
            ld e, c
            ld d, 0
            ld hl, entity_anim_flags
            add hl, de
            bit 1, (hl)                ; loop flag
            jp nz, anim_done_entity
            set 3, (hl)                ; ANIM_FLAG_COMPLETED
            res 0, (hl)                ; clear ANIM_FLAG_PLAYING
            jp anim_done_entity

.anim_has_multiple_frames:
            push af                    ; Save frameCount on stack

            ; Advance frame (entity_anim_frame++)
            ld e, c
            ld d, 0
            ld hl, entity_anim_frame
            add hl, de
            ld a, (hl)                 ; A = current frame
            inc a                      ; A = next frame
            pop de                     ; D = frameCount (was pushed as A)
            push de                    ; Keep frameCount on stack for .clamp_last
            cp d                       ; Compare frame with frameCount
            jr c, .store_frame

            ; Overflow: loop?
            ld e, c
            ld d, 0
            ld hl, entity_anim_flags
            add hl, de
            bit 1, (hl)                ; loop flag
            jr z, .clamp_last
            xor a                      ; frame = 0
            jr .store_frame

        .clamp_last:
            pop de                     ; D = frameCount
            push de                    ; Keep balanced
            ld a, d
            dec a                      ; frame = frameCount-1
            push af                    ; Preserve clamped frame index

            ; Mark one-shot completion and stop playback for non-loop anim.
            ; State machine condition ANIMATION_COMPLETE consumes this flag.
            ld e, c
            ld d, 0
            ld hl, entity_anim_flags
            add hl, de
            set 3, (hl)                ; ANIM_FLAG_COMPLETED
            res 0, (hl)                ; clear ANIM_FLAG_PLAYING
            pop af

        .store_frame:
            pop de                     ; Clean stack (discard frameCount)
            ld e, c
            ld d, 0
            ld hl, entity_anim_frame
            add hl, de
            ld (hl), a                 ; store new frame index

        .anim_upload_frame:
            push af                    ; Preserve frame index
            ld a, SPRITE_PATTERN_PRELOAD_MODE
            or a
            jr z, .anim_upload_frame_fallback
            pop af
            jp anim_done_entity

        .anim_upload_frame_fallback:
            pop af

            ; Get pointer to this sprite asset's frame pointer list
            ld l, b
            ld h, 0
            add hl, hl                 ; index * 2
            ld de, sprite_asset_frame_ptr_table
            add hl, de
            ld e, (hl)
            inc hl
            ld d, (hl)
            ex de, hl                  ; HL = frame pointer list base

            ; HL = &frame_ptrs[frame]
            ld e, a
            ld d, 0
            add hl, de
            add hl, de                 ; + frame*2
            ld e, (hl)
            inc hl
            ld d, (hl)
            ex de, hl                  ; HL = source pattern data

            ; Get entity sprite config (base HW sprite + layer count)
            push hl                    ; save source
            ld e, c
            ld d, 0
            ld hl, entity_sprite_config
            add hl, de
            add hl, de                 ; entityIndex * 2
            ld a, (hl)                 ; base HW sprite
            inc hl
            ld c, (hl)                 ; layer count
            ld d, a                    ; D = base HW sprite (save)
            pop hl                     ; restore source

            ld a, c
            or a
            jp z, anim_done_entity     ; no layers for this entity

            ; BC = layerCount * 32
            ld a, c
            ld b, 0
            ld c, a
            sla c
            rl b
            sla c
            rl b
            sla c
            rl b
            sla c
            rl b
            sla c
            rl b

            ; DE = SPRPAT + baseHwSprite*32
            push hl                    ; save source
            ld a, d
            ld l, a
            ld h, 0
            add hl, hl
            add hl, hl
            add hl, hl
            add hl, hl
            add hl, hl                 ; HL = base * 32
            ld de, SPRPAT
            add hl, de
            ex de, hl                  ; DE = VRAM destination
            pop hl                     ; restore source

            call FAST_LDIRVM           ; copy pattern data to VRAM

anim_done_entity:
            pop hl
            pop bc

        .anim_next_entity:
            dec b
            jp nz, .anim_loop
    ret

refresh_player_animation_fastpath:
    ld a, (player_runtime_enabled)
    or a
    ret z
    ld a, (player_entity_index)
    cp #FF
    ret z
    ld c, a
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_ANIMATION | COMP_MASK_SPRITE
    cp COMP_MASK_ANIMATION | COMP_MASK_SPRITE
    ret nz

    ld a, (player_runtime_enabled)
    push af
    ld a, (anim_entity_count)
    push af
    ld a, (anim_entity_list)
    push af

    xor a
    ld (player_runtime_enabled), a
    ld a, c
    ld (anim_entity_list), a
    ld a, 1
    ld (anim_entity_count), a
    call update_animation_component

    pop af
    ld (anim_entity_list), a
    pop af
    ld (anim_entity_count), a
    pop af
    ld (player_runtime_enabled), a
    ret
    
    ; ==================================================================
        ; JUMP COMPONENT SYSTEM
    ; ==================================================================

        init_jump_system:
            ; Initialize jump system
            ; Clear jump velocities (32 words = 64 bytes)
            ld hl, entity_jump_vel_y
            ld de, entity_jump_vel_y+1
            ld bc, 63
            ld (hl), 0
            ldir

            ; Clear jump counters
            ld hl, entity_jump_count
            ld de, entity_jump_count+1
            ld bc, 31
            ld (hl), 0
            ldir

            ; Clear temporary extra-jump charges granted by bonus pickups
            ld hl, entity_jump_bonus
            ld de, entity_jump_bonus+1
            ld bc, 31
            ld (hl), 0
            ldir

            ; Initialize configured max jumps (default: single jump)
            ld hl, entity_jump_max
            ld de, entity_jump_max+1
            ld bc, 31
            ld (hl), 1
            ldir

            ; Clear on-ground flags
            ld hl, entity_on_ground
            ld de, entity_on_ground+1
            ld bc, 31
            ld (hl), 0
            ldir
            ret

        update_jump_component:
            ; Update jump logic for entities
            ; Fire button edge triggers jump for entities with Jump+Input
            ; Uses: entity_jump_count, entity_jump_max, entity_jump_bonus, entity_on_ground, entity_gravity_vel
            ; Uses global input_btn_curr/input_btn_prev edge detection

            ld a, (active_entity_count)
            or a
            ret z
            ld b, a                       ; Loop used entities only
            ld hl, active_entity_list

        jump_update_loop:
            ld c, (hl)                    ; C = entity index
            inc hl                        ; Advance list pointer
            push hl                       ; Save list pointer
            ld a, (player_runtime_enabled)
            or a
            jp z, .jump_check_mask
            ld a, (player_entity_index)
            cp c
            jp z, .jump_skip_fast_player
        .jump_check_mask:
            ld e, c
            ld d, 0
            ld hl, entity_comp_masks_hi
            add hl, de
            ld a, (hl)
            pop hl                        ; Restore list pointer
            and #01                       ; Jump bit (COMP_MASK_JUMP=#0100 -> high byte bit0)
            jp z, jump_next_entity

            ; Require Input component
            push hl
            ld hl, entity_comp_masks
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            and COMP_MASK_INPUT
            pop hl
            jp z, jump_next_entity

            push bc
            push hl

            ; Ground detection is now handled by update_collision_component
            ; Just reset jump count if grounded
            ld e, c
            ld d, 0
            ld hl, entity_on_ground
            add hl, de
            bit 0, (hl)                   ; Check if on ground
            jr z, .jump_check             ; Not grounded, skip reset

            ; Entity is grounded - reset jump count
            ld hl, entity_jump_count
            add hl, de
            ld (hl), 0

            ; Landing also clears any unused extra-jump bonus.
            ld hl, entity_jump_bonus
            add hl, de
            ld (hl), 0

        .jump_check:
            ld hl, entity_on_ladder
            add hl, de
            ld a, (hl)
            or a
            jp nz, jump_done_entity

            ; --- Jump trigger edge (fire pressed now, not pressed previous frame) ---
            ld a, (input_btn_curr)
            and INPUT_BTN_FIRE
            jp z, jump_done_entity        ; not pressed
            ld a, (input_btn_prev)
            and INPUT_BTN_FIRE
            jp nz, jump_done_entity       ; already held last frame

            ; Check jump count < configured max OR grounded
            ld hl, entity_jump_count
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            ld hl, entity_jump_max
            ld e, c
            ld d, 0
            add hl, de
            ld b, (hl)
            ld hl, entity_jump_bonus
            add hl, de
            ld d, (hl)
            ld a, b
            add a, d
            ld b, a
            ld hl, entity_jump_count
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            cp b
            jr c, .do_jump

            ld hl, entity_on_ground
            add hl, de
            bit 0, (hl)
            jp z, jump_done_entity

        .do_jump:
            ; Consume one bonus jump only when performing an airborne jump
            ; beyond the entity's base maxJumps.
            ld hl, entity_on_ground
            add hl, de
            bit 0, (hl)
            jr nz, .skip_bonus_consume

            ld hl, entity_jump_count
            add hl, de
            ld a, (hl)
            ld hl, entity_jump_max
            add hl, de
            cp (hl)
            jr c, .skip_bonus_consume

            ld hl, entity_jump_bonus
            add hl, de
            ld a, (hl)
            or a
            jr z, .skip_bonus_consume
            dec (hl)

        .skip_bonus_consume:
            ; jump_count++
            ld hl, entity_jump_count
            add hl, de
            inc (hl)

            ; clear grounded
            ld hl, entity_on_ground
            add hl, de
            res 0, (hl)

            ; clear platform reference (prevent infinite jumps)
            ld hl, entity_platform_id
            add hl, de
            ld (hl), 255

            ; If entity has Gravity, set gravity velocity to negative jump impulse
            ; Jump impulse: -1024 (8.8 fixed) => #FC00 (~4 tiles height with gravity #40)
            ld hl, entity_comp_masks_hi
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            and #02                       ; Gravity bit (COMP_MASK_GRAVITY=#0200 -> high byte bit1)
            jp z, jump_done_entity

            ld hl, entity_gravity_vel
            ld e, c
            ld d, 0
            add hl, de
            add hl, de                    ; word index
            ld (hl), #00                  ; low byte
            inc hl
            ld (hl), #FC                  ; high byte (negative)

jump_done_entity:
            pop hl
            pop bc
            jp jump_next_entity

        .jump_skip_fast_player:
            pop hl

        jump_next_entity:
            dec b
            jp nz, jump_update_loop
    ret
    
    ; ==================================================================
        ; GRAVITY COMPONENT SYSTEM(Constant downward acceleration)
    ; ==================================================================

        init_gravity_system:
; Initialize gravity system
    ; Clear gravity velocities
            ld hl, entity_gravity_vel
            ld de, entity_gravity_vel + 1
            ld bc, 63; 64 bytes - 1(32 words)
            ld (hl), 0
            ldir
            ret

update_gravity_component:
; Apply gravity acceleration to entities
            ld a, (active_entity_count)
            or a
            ret z
            ld b, a                    ; Loop through used entities only
            ld hl, active_entity_list

gravity_update_loop:
            ld c, (hl)                 ; C = entity index
            inc hl                     ; Advance list pointer
            push hl                    ; Save list pointer
            ld a, (player_runtime_enabled)
            or a
            jp z, .gravity_check_mask
            ld a, (player_entity_index)
            cp c
            jp z, .gravity_skip_fast_player
        .gravity_check_mask:
            ld e, c
            ld d, 0
            ld hl, entity_comp_masks_hi
            add hl, de
            ld a, (hl)                 ; Get entity component mask high byte
            pop hl                     ; Restore list pointer
            and #02; Check COMP_MASK_GRAVITY(#0200) => bit 1 in high byte
            jr z, gravity_next_entity; Skip if no gravity component

    ; active_entity_list already guarantees current_screen_id membership

    ; Entity has gravity - apply acceleration
            push bc
            push hl

    ; Check if entity is grounded
            ld hl, entity_on_ground
            ld e, c
            ld d, 0
            add hl, de
            ld a, (hl)
            bit 0, a; Check ground flag
            jr nz, gravity_grounded; Skip gravity if on ground

            ld hl, entity_on_ladder
            add hl, de
            ld a, (hl)
            or a
            jr nz, gravity_grounded

    ; Apply gravity acceleration
            ld hl, entity_gravity_vel
            ld e, c
            ld d, 0
            add hl, de
            add hl, de; HL points to gravity velocity(word)

            ld e, (hl); Load current gravity velocity
            inc hl
            ld d, (hl)

    ; Add gravity strength(64 in fixed - point = ~0.25 pixels / frame acceleration)
            ld a, e
            add a, #40; Add 64 to low byte
            ld e, a
            ld a, d
            adc a, #00; Add carry to high byte
            ld d, a

    ; Check terminal velocity(1024 = max fall speed)
    ; Skip cap if velocity is negative (entity is moving UP / jumping)
            ld a, d
            bit 7, a; Check sign bit - negative means going up
            jr nz, gravity_store_vel; Skip cap for upward velocity
            cp #04; Check if >= 1024 (unsigned, only for positive/downward)
            jr c, gravity_store_vel; If < 1024, continue
            ld de, #0400; Cap at terminal velocity

gravity_store_vel:
; Store updated gravity velocity
            dec hl
            ld (hl), e
            inc hl
            ld (hl), d

    ; Set entity_vel_y to gravity integer part
    ; Position component will apply vel_y to Y position
    ; Wall collision can then detect vertical movement and snap back
            push de                ; Save gravity velocity (D=integer part)
            ld hl, entity_vel_y
            ld e, c                ; E = entity index
            ld d, 0
            add hl, de             ; HL = &entity_vel_y[entity]
            pop de                 ; Restore gravity velocity
            ld (hl), d             ; vel_y = gravity velocity integer part

            jr gravity_done

gravity_grounded:
; Entity is grounded - reset gravity velocity
            ld hl, entity_gravity_vel
            ld e, c
            ld d, 0
            add hl, de
            add hl, de
            ld (hl), 0; Clear velocity low
            inc hl
            ld (hl), 0; Clear velocity high

gravity_done:
            pop hl
            pop bc
            jp gravity_next_entity

        .gravity_skip_fast_player:
            pop hl

gravity_next_entity:
            dec b
            jp nz, gravity_update_loop
    ret
    
    ; AirControl helpers filtered out (not used)
aircontrol_should_lock_horizontal_c:
    xor a
    ret
    
    ; WallGrab system filtered out (not used)
init_wallgrab_system:
    ret

update_wallgrab_component:
    ret

refresh_player_wallgrab_fastpath:
    ret

wallgrab_process_entity_c:
    ret
    
    ; WallJump system filtered out (not used)
init_walljump_system:
    ret

update_walljump_component:
    ret

walljump_process_entity_c:
    ret

walljump_input_is_left:
    xor a
    ret

walljump_input_is_right:
    xor a
    ret
    
    ; AutoDestroy system filtered out(not used)
init_auto_destroy_system:
    ret

update_auto_destroy_component:
    ret
    
    ; ==================================================================
    ; CURSORS COMPONENT SYSTEM
    ; ==================================================================
    ; NOTE:
    ; This system is intentionally disabled in runtime gameplay.
    ; Directional movement is already handled by update_input_component.
    ; Keeping cursor movement here causes double movement/jitter.

init_cursors_system:
    ; No initialization needed
    ret

; ------------------------------------------------------------------
; update_cursors_component
; Disabled no-op (reserved for future menu-only cursor implementation)
; ------------------------------------------------------------------
update_cursors_component:
    ret
    
    ; StateMachine per-entity component tick filtered out.
    ; GameFlow calls execute_all_state_machines once per frame, so this
    ; resident component wrapper must stay a no-op to avoid duplicate SM ticks.
init_statemachine_system:
    ret

update_statemachine_component:
    ret
    
    ; RetractableGate system filtered out(not used)
init_retractable_gate_system:
    ret

update_retractable_gate_component:
    ret
    
    ; Carry system filtered out(not used)
init_carry_system:
    ret

update_carry_component:
    ret
    
    ; AutoControlScript system filtered out(no active scripts)
init_auto_control_script_system:
    ret

update_auto_control_script_component:
    ret

update_auto_event_string_component:
    ret

    ; Damage system filtered out(not used)
init_damage_system:
    ret

update_damage_component:
    ret
    
    ; Shoot system filtered out(not used)
init_shoot_system:
    ret

update_shoot_component:
    ret
    
    ; ==================================================================
    ; PLATFORM RIDING SYSTEM
    ; ==================================================================
    ; Detects when entities are standing on platforms and transfers velocity
    ;
    ; Platform detection: Entity A is on platform B if:
    ; - A's bottom edge is at or near B's top edge
    ; - A has horizontal overlap with B
    ; - B has collision_layer bit 3 set (platform layer = 8)
    ;
    ; Grace frames: 6 frames tolerance when leaving platform

init_platform_riding_system:
    ; Initialize platform IDs to 255 (no platform)
    ld hl, entity_platform_id
    ld de, entity_platform_id + 1
    ld bc, 31
    ld (hl), 255
    ldir

    ; Initialize grace frames to 0
    ld hl, entity_platform_grace
    ld de, entity_platform_grace + 1
    ld bc, 31
    ld (hl), 0
    ldir
    ret

prepare_platform_detection:
    ; PHASE 1 - Called BEFORE collision detection
    ; Clear platform references from previous frame
    ; Entities that were on platforms get grace frames
    ; Collision detection will reset platform_id if still in contact

    ld a, (active_entity_count)
    or a
    ret z
    ld b, a

    ld hl, active_entity_list
.platform_clear_loop:
    ld e, (hl)              ; E = entity index
    ld d, 0                 ; DE = entity index (16-bit offset)
    inc hl
    push hl
    push bc

    ; Check entity_platform_id[entity]
    ld hl, entity_platform_id
    add hl, de
    ld a, (hl)              ; A = platform_id
    cp 255                  ; Check if on a platform
    jr z, .platform_skip_clear ; Already no platform, skip

    ; Entity was on a platform last frame
    ; Set grace frames to 6 (coyote time for leaving platform)
    push hl                 ; Save entity_platform_id pointer
    ld hl, entity_platform_grace
    add hl, de
    ld a, 6
    ld (hl), a              ; Set grace frames
    pop hl                  ; Restore entity_platform_id pointer

    ; Clear platform reference (collision will reset if still touching)
    ld (hl), 255

.platform_skip_clear:
    pop bc
    pop hl
    djnz .platform_clear_loop
    ret

update_platform_riding:
    ; PHASE 2 - Called AFTER collision detection
    ; Decrement grace frames for entities not on platforms
    ; (Entities on platforms have grace=0, set by handle_entity_collision)

    ld a, (active_entity_count)
    or a
    ret z
    ld b, a

    ld hl, active_entity_list
.grace_loop:
    ld e, (hl)              ; E = entity index
    ld d, 0                 ; DE = entity index (16-bit offset)
    inc hl
    push hl
    push bc

    ; Check if entity has platform reference
    ld hl, entity_platform_id
    add hl, de
    ld a, (hl)              ; A = platform_id
    cp 255
    jr nz, .grace_skip      ; Has platform, skip grace decrement

    ; No platform - decrement grace frames if > 0
    ld hl, entity_platform_grace
    add hl, de
    ld a, (hl)              ; A = grace frames
    or a
    jr z, .grace_skip       ; Already 0, skip

    dec a                   ; Decrement grace
    ld (hl), a

.grace_skip:
    pop bc
    pop hl
    djnz .grace_loop
    ret
    
    ; ==================================================================
    ; WALL COLLISION COMPONENT SYSTEM
    ; ==================================================================
    ; Prevents entities from moving through walls
    ; Uses per-entity hitbox (offset + width/height)
    ; Snaps entity position to wall edge AND zeros velocity

init_wallcollision_system:
    ret

; ------------------------------------------------------------------
; wall_behavior_is_full_blocker
; Input:  A = behavior byte or family bits
; Output: Z = passable / top-solid platform, NZ = full blocker
; Clobbers: AF
; Notes:
;   - familyId 2 (#20) is treated as one-way/top-solid, so it must not
;     block horizontal motion or upward motion.
; ------------------------------------------------------------------
wall_behavior_is_full_blocker:
    and #F0
    ret z
    cp #20
    ret z
    or a
    ret

; ------------------------------------------------------------------
; wall_down_behavior_blocks
; Input:
;   - A  = behavior byte or family bits from get_behavior_tile
;   - B  = tile row of the floor probe
;   - DE = entity index
; Output:
;   - Z  = passable
;   - NZ = blocks downward movement / supports standing
; Clobbers: AF, C, HL
; Preserved: B, DE
; Notes:
;   - familyId 2 (#20) is top-solid: it only blocks when the entity was
;     already above the tile before this frame's vertical movement.
;   - update_position_component already applied vel_y before WallCollision,
;     so previous_bottom = wall_hit_bottom - entity_vel_y.
; ------------------------------------------------------------------
wall_down_behavior_blocks:
    and #F0
    ret z
    cp #20
    jr z, .platform_check
    or a
    ret

.platform_check:
    push bc
    push hl
    ld a, b
    add a, a
    add a, a
    add a, a                      ; A = tileTop = row * 8
    add a, 2
    ld c, a                       ; C = tileTop + tolerance
    ld a, (wall_hit_bottom)
    ld hl, entity_vel_y
    add hl, de
    sub (hl)                      ; previous_bottom = current_bottom - vel_y
    cp c
    pop hl
    pop bc
    jr c, .platform_blocks
    jr z, .platform_blocks
    xor a
    ret

.platform_blocks:
    ld a, 1
    ret

; ------------------------------------------------------------------
; update_wallcollision_component
; ------------------------------------------------------------------
; Check wall collisions and prevent movement through solid tiles.
; Uses behavior map (current_behavior_map) for collision detection.
; Entity position is cached in wall_temp_x/y and converted to hitbox bounds.
; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Iterate all entity slots; for each active entity with
;            WallCollision eligibility, probe solid tiles in movement
;            direction(s) and snap position + zero velocity on hit.
;   Inputs:
;     - entity_active[]         : 1 = entity exists
;     - active_entity_list[] / active_entity_count : compact active list already current
;     - entity_comp_masks[]     : low byte component bitmask
;     - entity_comp_masks_hi[]  : high byte (COMP_MASK_GRAVITY at bit 1)
;     - entity_collides_with[]  : must include COLLISION_LAYER_PLATFORM (#08)
;     - entity_x_pos/y_pos[]    : world position
;     - entity_vel_x/vel_y[]    : signed 8-bit velocity (negative = left/up)
;     - entity_gravity_vel[]    : 16-bit signed gravity accumulator (word)
;     - entity_collision_offset_x/y[]: signed offset from origin to hitbox corner
;     - entity_collision_hitbox_w/h[]: hitbox size (minimum 1 if zero)
;     - current_behavior_map    : pointer to active screen behavior map
;   Outputs:
;     - entity_x_pos/y_pos[]    : snapped on collision
;     - entity_vel_x/vel_y[]    : zeroed on collision axis
;     - entity_gravity_vel[]    : zeroed on vertical collision
;     - entity_on_ground[]      : bit 0 set=floor, cleared at loop start
;     - entity_wall_collision_flags[]: bits 0=UP,1=DOWN,2=LEFT,3=RIGHT
;   Clobbers: AF, BC, DE, HL
;   Preserved: (none — uses scratch RAM wall_temp_x/y, wall_hit_*, wall_probe_*)
;   Notes:
;     - Opt-B: loop uses active_entity_list (entities guaranteed active + on screen).
;       Eliminates ~29 wasted iterations vs 0..MAX_ENTITIES scan (3 entities active).
;     - Caller must refresh active_entity_list earlier in the frame.
;     - Opt-C: wall_build_hitbox_cache is skipped on DOWN snap when new Y == current Y
;       (entity already on floor). Saves ~200 cycles/entity/frame when standing still.
;     - wall_build_hitbox_cache is called once at entity entry, and after each snap
;       where the position actually changes.
;     - Gravity floor check (.check_wall_y_gravity) runs even when vel_y=0
;       so entity_on_ground stays accurate when entity is standing still.
; ------------------------------------------------------------------
update_wallcollision_component:
    ; update_all_entities refreshed active_entity_list before entering the
    ; component chain, so we can consume it directly here.
    ld a, (collision_entity_count)
    or a
    ret z                         ; no active entities → done
    ld b, a                       ; B = entity count (loop counter for djnz)
    ld hl, collision_entity_list

.wall_loop:
    ; ---- Load next entity index from compact list ----
    ld e, (hl)                    ; E = entity index
    ld d, 0                       ; DE = entity index (word)
    push hl                       ; save list pointer (clobbered by hl arithmetic below)
    push bc                       ; save loop counter

    ; --- Filter A: entity must have Collision component ---
    ; (entity_active and entity_screen_id are implicit via active_entity_list)
    ; Hitbox data lives in Collision arrays; no Collision = no valid hitbox.
    ; Opt-D: read comp_masks into B (B is free — loop counter saved on stack above).
    ; B holds comp_masks for Filter C reuse, eliminating a second memory read.
    ld hl, entity_comp_masks
    add hl, de
    ld b, (hl)                    ; B = comp_masks[E] (safe: loop ctr on stack)
    ld a, b
    and COMP_MASK_COLLISION       ; low byte, bit 3
    jp z, .wall_next

    ; --- Filter B: entity must collide with the Platform layer ---
    ; entity_collides_with is a bitmask; COLLISION_LAYER_PLATFORM (#08) = map tiles.
    ld hl, entity_collides_with
    add hl, de
    ld a, (hl)
    and COLLISION_LAYER_PLATFORM
    jp z, .wall_next

    ; --- Filter C: entity must be moveable (Input or Movement component) ---
    ; Static entities (platforms, decorations) have no velocity to correct.
    ; Opt-D: reuse comp_masks from B — no extra ld hl/add hl,de/ld a,(hl) needed (saves 28 cycles/entity).
    ld a, b
    and COMP_MASK_MOVEMENT | COMP_MASK_INPUT
    jp z, .wall_next

    ; ---- Entity passed all filters — cache its position ----
    ; wall_temp_x/y are scratch RAM used by wall_build_hitbox_cache and
    ; the snap routines to avoid repeated indexed array lookups.
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    ld (wall_temp_x), a          ; scratch X = entity_x_pos[E]
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    ld (wall_temp_y), a          ; scratch Y = entity_y_pos[E]

    ; Clear on_ground flag - will be re-set by .wall_down_blocked if floor found
    ; This ensures entity correctly detects walking off platform edges
    ld hl, entity_wall_collision_flags
    add hl, de                        ; DE still = entity index from above
    ld (hl), 0                        ; Clear directional wall flags

    ld hl, entity_on_ground
    add hl, de                        ; DE still = entity index from above
    res 0, (hl)

    ; Build initial hitbox cache for this entity.
    call wall_build_hitbox_cache

    ; ---- CHECK HORIZONTAL VELOCITY ----
    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    or a
    jp z, .check_wall_y           ; No X velocity, check Y

    bit 7, a
    jp z, .wall_check_right

.wall_check_left:
    ; Moving left - probe one pixel before hitbox left edge
    ld a, (wall_hit_left)
    or a
    jp z, .check_wall_y           ; already at left boundary
    sub 1
    srl a
    srl a
    srl a                         ; Column = (left-1) / 8
    ld c, a

    ; Check point 1: adaptive top probe (safe for small hitboxes)
    ld a, (wall_probe_top)
    srl a
    srl a
    srl a
    ld b, a                       ; Row = top / 8
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    jp nz, .wall_left_blocked

    ; Check point 2: adaptive bottom probe (safe for small hitboxes)
    ; probe_bottom = hitbox_bottom - inset ≤ 191 → row ≤ 23, col = (left-1)/8 ≤ 31 → NB safe
    ld a, (wall_probe_bottom)
    srl a
    srl a
    srl a
    ld b, a                       ; Row = bottom / 8
    call get_behavior_tile_nb
    call wall_behavior_is_full_blocker
    jp z, .check_wall_y           ; Both passable

.wall_left_blocked:
    ; ---------------------------------------------------------------
    ; Snap formula (LEFT wall):
    ;   C = tile column that blocked us (from (left-1)/8 probe)
    ;   new_hitbox_left = (C + 1) * 8   → first pixel right of the wall
    ;   entity_x = new_hitbox_left - collision_offset_x
    ;              (wall_sub_signed_offset_clamped reverses the offset)
    ; After snap: vel_x = 0, entity_wall_collision_flags bit 2 (LEFT) set.
    ; ---------------------------------------------------------------
    ld a, c
    inc a
    add a, a
    add a, a
    add a, a                      ; A = (C+1)*8 = new hitbox left pixel
    push af                       ; save new hitbox left
    ld hl, entity_collision_offset_x
    add hl, de
    pop af
    call wall_sub_signed_offset_clamped ; A = entity_x = new_left - offset_x
    ld (wall_temp_x), a           ; update position cache
    push af
    ld hl, entity_x_pos
    add hl, de
    pop af
    ld (hl), a                    ; write snapped entity X to RAM
    call wall_build_hitbox_cache  ; recalculate hitbox after position change

    ; Cancel leftward velocity and flag the collision
    ld hl, entity_vel_x
    add hl, de
    ld (hl), 0
    ld hl, entity_wall_collision_flags
    add hl, de
    set 2, (hl)                       ; bit 2 = LEFT wall collision
    jp .check_wall_y

.wall_check_right:
    ; Moving right - probe one pixel after hitbox right edge
    ld a, (wall_hit_right)
    inc a
    jp z, .check_wall_y           ; overflow (right==255), skip
    srl a
    srl a
    srl a                         ; Column = (X+16) / 8
    ld c, a

    ; Check point 1: adaptive top probe (safe for small hitboxes)
    ld a, (wall_probe_top)
    srl a
    srl a
    srl a
    ld b, a                       ; Row = top / 8
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    jp nz, .wall_right_blocked

    ; Check point 2: adaptive bottom probe (safe for small hitboxes)
    ; probe_bottom ≤ 191 → row ≤ 23, col = (right+1)/8 ≤ 31 → NB safe
    ld a, (wall_probe_bottom)
    srl a
    srl a
    srl a
    ld b, a                       ; Row = bottom / 8
    call get_behavior_tile_nb
    call wall_behavior_is_full_blocker
    jp z, .check_wall_y           ; Both passable

.wall_right_blocked:
    ; ---------------------------------------------------------------
    ; Snap formula (RIGHT wall):
    ;   C = tile column that blocked us (from (right+1)/8 probe)
    ;   wall_left_of_tile = C * 8           → left pixel of blocking tile
    ;   new_hitbox_left   = C*8 - hitbox_w  → push entity left so right edge
    ;                                         just touches the tile's left side
    ;   If underflow (hitbox_w > C*8): clamp new_hitbox_left to 0.
    ;   entity_x = new_hitbox_left - collision_offset_x
    ; After snap: vel_x = 0, entity_wall_collision_flags bit 3 (RIGHT) set.
    ; ---------------------------------------------------------------
    ld a, c
    add a, a
    add a, a
    add a, a                      ; A = C * 8 = left pixel of blocking tile
    ld b, a                       ; B = C*8
    ld a, (wall_hit_w)
    ld c, a                       ; C = hitbox width
    ld a, b
    sub c                         ; A = C*8 - hitbox_w = new hitbox left
    jr nc, .wall_right_left_ok
    xor a                         ; underflow: clamp to 0
.wall_right_left_ok:
    push af                       ; save new hitbox left
    ld hl, entity_collision_offset_x
    add hl, de
    pop af
    call wall_sub_signed_offset_clamped ; A = entity_x = new_left - offset_x
    ld (wall_temp_x), a           ; update position cache
    push af
    ld hl, entity_x_pos
    add hl, de
    pop af
    ld (hl), a                    ; write snapped entity X to RAM
    call wall_build_hitbox_cache  ; recalculate hitbox after position change

    ; Cancel rightward velocity and flag the collision
    ld hl, entity_vel_x
    add hl, de
    ld (hl), 0
    ld hl, entity_wall_collision_flags
    add hl, de
    set 3, (hl)                       ; bit 3 = RIGHT wall collision

.check_wall_y:
    ; ---- CHECK VERTICAL VELOCITY ----
    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)
    or a
    jp z, .check_wall_y_gravity   ; vel_y=0, but check floor for gravity entities

    bit 7, a
    jp z, .wall_check_down

.wall_check_up:
    ; Moving up - probe one pixel above hitbox top edge
    ld a, (wall_hit_top)
    or a
    jp z, .wall_up_top_edge       ; top=0, clamp + stop upward velocity
    sub 1
    srl a
    srl a
    srl a
    ld b, a                       ; Row = (top-1) / 8

    ; Check point 1: adaptive left probe (safe for small hitboxes)
    ; NOTE: uses get_behavior_tile (with bounds) — entity_y can wrap off-screen,
    ; making B = (top-1)/8 > 23 (e.g. top=252 → row=31). Bounds check returns 0.
    ld a, (wall_probe_left)
    srl a
    srl a
    srl a
    ld c, a                       ; Column = left / 8
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    jp nz, .wall_up_blocked

    ; Check point 2: adaptive right probe (safe for small hitboxes)
    ld a, (wall_probe_right)
    srl a
    srl a
    srl a
    ld c, a                       ; Column = right / 8
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    jp z, .wall_next              ; Both passable

.wall_up_top_edge:
    ; ---------------------------------------------------------------
    ; Screen top boundary clamp (wall_hit_top == 0, no tile above row 0).
    ; This path is entered when wall_hit_left == 0 (entity already at top
    ; screen boundary) or when the UP probe is at row -1 (invalid).
    ; Sanity guard: only snap if entity_y < 24 (i.e. truly near the top).
    ; If entity_y >= 24, the "top=0" probe is a false positive — just
    ; cancel velocity via .wall_up_cancel_only without moving entity.
    ; new_hitbox_top = 0, entity_y = 0 - offset_y (clamped).
    ; ---------------------------------------------------------------
    ld a, (wall_temp_y)
    cp 24
    jp nc, .wall_up_cancel_only
    xor a
    push af                       ; keep new hitbox top
    ld hl, entity_collision_offset_y
    add hl, de
    pop af
    call wall_sub_signed_offset_clamped
    ld (wall_temp_y), a
    push af
    ld hl, entity_y_pos
    add hl, de
    pop af
    ld (hl), a                    ; Clamp entity Y to top boundary
    call wall_build_hitbox_cache  ; Refresh hitbox cache after snap

    ; Zero Y velocity
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0

    ; Also zero gravity_vel to stop upward momentum at top edge
    ld hl, entity_gravity_vel
    add hl, de
    add hl, de                        ; word index
    ld (hl), 0
    inc hl
    ld (hl), 0
    ld hl, entity_wall_collision_flags
    add hl, de
    set 0, (hl)                       ; UP wall collision
    jp .wall_next

.wall_up_blocked:
    ; ---------------------------------------------------------------
    ; Snap formula (UP / ceiling):
    ;   B = tile row that blocked us (from (top-1)/8 probe)
    ;   new_hitbox_top = (B + 1) * 8  → first pixel below the ceiling tile
    ;   Safety guard: if new_top < current wall_hit_top, the snap would
    ;   push us further into the ceiling (sub-pixel rounding artefact).
    ;   In that case, fall through to .wall_up_cancel_only to just
    ;   cancel velocity without moving the entity.
    ;   entity_y = new_hitbox_top - collision_offset_y
    ; After snap: vel_y = 0, gravity_vel = 0, wall_collision_flags bit 0 (UP) set.
    ; ---------------------------------------------------------------
    ld a, b
    inc a
    add a, a
    add a, a
    add a, a                      ; A = (B+1)*8 = new hitbox top pixel
    ; Guard: new_top must be >= current hitbox top (no upward nudge)
    ld c, a
    ld hl, wall_hit_top
    ld a, c
    cp (hl)                       ; new_top < current_top? → carry set
    jp c, .wall_up_cancel_only    ; invalid snap: only cancel momentum
    ld a, c
    push af                       ; save new hitbox top
    ld hl, entity_collision_offset_y
    add hl, de
    pop af
    call wall_sub_signed_offset_clamped ; A = entity_y = new_top - offset_y
    ld (wall_temp_y), a           ; update position cache
    push af
    ld hl, entity_y_pos
    add hl, de
    pop af
    ld (hl), a                    ; write snapped entity Y to RAM
    call wall_build_hitbox_cache  ; recalculate hitbox after position change

    ; Cancel upward velocity and gravity accumulator
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0

    ; gravity_vel is 16-bit (word array): DE*2 offset
    ld hl, entity_gravity_vel
    add hl, de
    add hl, de                        ; word index (2 bytes per entity)
    ld (hl), 0
    inc hl
    ld (hl), 0
    ld hl, entity_wall_collision_flags
    add hl, de
    set 0, (hl)                       ; bit 0 = UP wall collision
    jp .wall_next

.wall_up_cancel_only:
    ; ---------------------------------------------------------------
    ; Defensive path: snap would move entity upward (invalid) or
    ; entity is far from the screen top boundary.
    ; Keep current Y position, but cancel upward momentum this frame.
    ; ---------------------------------------------------------------
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0

    ld hl, entity_gravity_vel
    add hl, de
    add hl, de                        ; word index
    ld (hl), 0
    inc hl
    ld (hl), 0
    ld hl, entity_wall_collision_flags
    add hl, de
    set 0, (hl)                       ; UP wall collision
    jp .wall_next

.wall_check_down:
    ; Moving down - probe one pixel below hitbox bottom edge
    ld a, (wall_hit_bottom)
    inc a
    jp z, .wall_next              ; overflow (bottom==255), skip
    srl a
    srl a
    srl a
    ld b, a                       ; Row = (bottom+1) / 8

    ; Check point 1: adaptive left probe (safe for small hitboxes)
    ld a, (wall_probe_left)
    srl a
    srl a
    srl a
    ld c, a                       ; Column = left / 8
    call get_behavior_tile
    call wall_down_behavior_blocks
    jp nz, .wall_down_blocked

    ; Check point 2: adaptive right probe (safe for small hitboxes)
    ld a, (wall_probe_right)
    srl a
    srl a
    srl a
    ld c, a                       ; Column = right / 8
    call get_behavior_tile
    call wall_down_behavior_blocks
    jp z, .wall_next              ; Both passable

.wall_down_blocked:
    ; ---------------------------------------------------------------
    ; Snap formula (DOWN / floor):
    ;   B = tile row that blocked us (from (bottom+1)/8 probe)
    ;   floor_top_pixel  = B * 8          → top pixel of the floor tile
    ;   new_hitbox_top   = B*8 - hitbox_h → push entity up so bottom edge
    ;                                       just sits on the floor surface
    ;   If underflow (hitbox_h > B*8): clamp new_hitbox_top to 0.
    ;   entity_y = new_hitbox_top - collision_offset_y
    ; After snap: vel_y = 0, gravity_vel = 0, entity_on_ground bit 0 set,
    ;             entity_wall_collision_flags bit 1 (DOWN) set.
    ; Note: jp .wall_next skips .check_wall_y_gravity intentionally —
    ;       floor already detected; no redundant gravity probe needed.
    ; ---------------------------------------------------------------
    ld a, b
    add a, a
    add a, a
    add a, a                      ; A = B*8 = top pixel of floor tile
    ld b, a                       ; B = floor_top_pixel
    ld a, (wall_hit_h)
    ld c, a                       ; C = hitbox height
    ld a, b
    sub c                         ; A = B*8 - hitbox_h = new hitbox top
    jr nc, .wall_down_top_ok
    xor a                         ; underflow: clamp to 0
.wall_down_top_ok:
    push af                       ; save new hitbox top
    ld hl, entity_collision_offset_y
    add hl, de
    pop af
    call wall_sub_signed_offset_clamped ; A = entity_y = new_top - offset_y
    ld (wall_temp_y), a           ; update position cache
    push af
    ld hl, entity_y_pos
    add hl, de
    pop af
    ; Opt-C: skip rebuild if new Y == current Y (entity already on floor).
    ; Saves ~200 cycles/frame for standing-still entities (most common state).
    ; Falls through to normal snap path on actual position change (e.g. landing).
    cp (hl)
    jp z, .wall_down_at_floor     ; position unchanged → hitbox still valid
    ld (hl), a                    ; write snapped entity Y to RAM
    call wall_build_hitbox_cache  ; recalculate hitbox after position change
.wall_down_at_floor:
    ; Cancel downward velocity and gravity accumulator (landing)
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0

    ; gravity_vel is 16-bit (word array): DE*2 offset
    ld hl, entity_gravity_vel
    add hl, de
    add hl, de                        ; word index (2 bytes per entity)
    ld (hl), 0
    inc hl
    ld (hl), 0

    ; Mark entity as on-ground and flag DOWN wall collision
    ld hl, entity_on_ground
    add hl, de
    set 0, (hl)                       ; bit 0 = standing on solid floor
    ld hl, entity_wall_collision_flags
    add hl, de
    set 1, (hl)                       ; bit 1 = DOWN wall collision
    jp .wall_next                     ; floor handled; skip gravity floor check

.check_wall_y_gravity:
    ; ---------------------------------------------------------------
    ; vel_y == 0, but gravity entities still need a floor probe every
    ; frame to keep entity_on_ground accurate (e.g. entity walks off
    ; a platform edge — vel_y is 0 at that instant but the flag must
    ; be cleared promptly so the gravity system can accelerate it).
    ; Only enter .wall_check_down if entity has COMP_MASK_GRAVITY
    ; (stored in entity_comp_masks_hi bit 1).
    ; Non-gravity entities: skip vertical check entirely.
    ; ---------------------------------------------------------------
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    and #02                       ; COMP_MASK_GRAVITY high byte bit 1
    jp nz, .wall_check_down       ; gravity entity → check floor
    ; No gravity component → no vertical wall check needed
.wall_next:
    ; Opt-B: restore list pointer and count, advance to next entity.
    ; NOTE: djnz range is ±127 bytes — wall_loop body is too large.
    ; Use dec b / jp nz instead (jp supports any distance).
    pop bc
    pop hl
    inc hl                        ; next entry in active_entity_list
    dec b
    jp nz, .wall_loop
    ret

; ------------------------------------------------------------------
; wall_build_hitbox_cache
; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Compute and cache hitbox AABB and adaptive probe coordinates
;            from entity position (wall_temp_x/y) plus collision offsets/sizes.
;   Inputs:
;     - DE                        = entity index (used to index per-entity arrays)
;     - wall_temp_x               = cached entity X origin (set before calling)
;     - wall_temp_y               = cached entity Y origin (set before calling)
;     - entity_collision_hitbox_w[DE]: hitbox width  (0 treated as 1)
;     - entity_collision_hitbox_h[DE]: hitbox height (0 treated as 1)
;     - entity_collision_offset_x[DE]: signed X offset from entity origin to hitbox left
;     - entity_collision_offset_y[DE]: signed Y offset from entity origin to hitbox top
;   Outputs:
;     - wall_hit_left   = hitbox left  pixel (entity_x + offset_x, clamped 0..255)
;     - wall_hit_top    = hitbox top   pixel (entity_y + offset_y, clamped 0..255)
;     - wall_hit_right  = left + (w-1), clamped 0..255
;     - wall_hit_bottom = top  + (h-1), clamped 0..255
;     - wall_hit_w      = effective width  (>= 1)
;     - wall_hit_h      = effective height (>= 1)
;     - wall_probe_left / wall_probe_right : X probes (inset up to 2px from sides)
;     - wall_probe_top  / wall_probe_bottom: Y probes (inset up to 2px from top/bottom)
;   Clobbers: AF, BC, HL
;   Preserved: DE (entity index is never modified)
;   Notes:
;     - Adaptive inset: min(2, floor((right-left)/2)) and min(2, floor((bottom-top)/2)).
;       Prevents corner-only probes for entities smaller than 4 pixels on an axis.
;     - Call wall_add_signed_offset_clamped for offset application.
;     - Called once at entity loop entry; called again after every position snap.
; ------------------------------------------------------------------
wall_build_hitbox_cache:
    ; Width (minimum 1)
    ld hl, entity_collision_hitbox_w
    add hl, de
    ld a, (hl)
    or a
    jr nz, .wbhc_w_ok
    ld a, 1
.wbhc_w_ok:
    ld (wall_hit_w), a

    ; Height (minimum 1)
    ld hl, entity_collision_hitbox_h
    add hl, de
    ld a, (hl)
    or a
    jr nz, .wbhc_h_ok
    ld a, 1
.wbhc_h_ok:
    ld (wall_hit_h), a

    ; left = entity_x + offset_x (signed, clamped)
    ld a, (wall_temp_x)
    ld hl, entity_collision_offset_x
    add hl, de
    call wall_add_signed_offset_clamped
    ld (wall_hit_left), a

    ; top = entity_y + offset_y (signed, clamped)
    ld a, (wall_temp_y)
    ld hl, entity_collision_offset_y
    add hl, de
    call wall_add_signed_offset_clamped
    ld (wall_hit_top), a

    ; right = left + (w-1), clamped
    ld a, (wall_hit_w)
    dec a
    ld b, a
    ld a, (wall_hit_left)
    add a, b
    jr nc, .wbhc_right_ok
    ld a, 255
.wbhc_right_ok:
    ld (wall_hit_right), a

    ; bottom = top + (h-1), clamped
    ld a, (wall_hit_h)
    dec a
    ld b, a
    ld a, (wall_hit_top)
    add a, b
    jr nc, .wbhc_bottom_ok
    ld a, 255
.wbhc_bottom_ok:
    ld (wall_hit_bottom), a

    ; ---- Adaptive X probes: inset = min(2, floor((right-left)/2)) ----
    ; Purpose: avoid probing the exact corner pixels for small sprites.
    ; For a 16px-wide entity: inset = min(2, 8) = 2.
    ;   probe_left  = left  + 2  (2px inside left edge)
    ;   probe_right = right - 2  (2px inside right edge)
    ; For a 4px-wide entity: inset = min(2, 2) = 2 (probes overlap at center).
    ; For a 2px-wide entity: inset = min(2, 1) = 1.
    ld a, (wall_hit_left)
    ld c, a                       ; C = left pixel
    ld a, (wall_hit_right)
    sub c                         ; A = width span (right - left)
    srl a                         ; A = span / 2
    cp 3                          ; is span/2 < 3 (i.e. inset < 2)?
    jr c, .wbhc_inset_x_ready    ; yes: use as-is
    ld a, 2                       ; no: cap inset at 2
.wbhc_inset_x_ready:
    ld b, a                       ; B = inset value
    ld a, c
    add a, b
    ld (wall_probe_left), a       ; probe_left  = left  + inset
    ld a, (wall_hit_right)
    sub b
    ld (wall_probe_right), a      ; probe_right = right - inset

    ; ---- Adaptive Y probes: inset = min(2, floor((bottom-top)/2)) ----
    ; Same logic on Y axis.
    ;   probe_top    = top    + inset
    ;   probe_bottom = bottom - inset
    ld a, (wall_hit_top)
    ld c, a                       ; C = top pixel
    ld a, (wall_hit_bottom)
    sub c                         ; A = height span (bottom - top)
    srl a                         ; A = span / 2
    cp 3
    jr c, .wbhc_inset_y_ready
    ld a, 2
.wbhc_inset_y_ready:
    ld b, a                       ; B = inset value
    ld a, c
    add a, b
    ld (wall_probe_top), a        ; probe_top    = top    + inset
    ld a, (wall_hit_bottom)
    sub b
    ld (wall_probe_bottom), a     ; probe_bottom = bottom - inset
    ret

; ------------------------------------------------------------------
; wall_add_signed_offset_clamped
; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Add a signed 8-bit offset to a pixel coordinate, clamping result to 0..255.
;            Used to apply entity_collision_offset_x/y to entity origin (entity→hitbox).
;   Inputs:
;     - A  = base pixel coordinate (unsigned, 0..255)
;     - HL = pointer to signed offset byte (-128..127)
;   Outputs:
;     - A  = clamp(base + offset, 0, 255)
;   Clobbers: AF, B
;   Preserved: C, DE, HL
;   Notes:
;     - Negative offset: carry=0 after add → underflow → A clamped to 0.
;     - Positive offset: carry=1 after add → overflow → A clamped to 255.
;     - B is used to hold the offset byte; caller must save B if needed.
; ------------------------------------------------------------------
wall_add_signed_offset_clamped:
    ld b, (hl)                    ; B = signed offset
    add a, b
    bit 7, b
    jr z, .wasc_positive
    ; Negative offset: carry=0 means underflow
    jr c, .wasc_done
    xor a
    ret
.wasc_positive:
    ; Positive offset: carry=1 means overflow
    jr nc, .wasc_done
    ld a, 255
.wasc_done:
    ret

; ------------------------------------------------------------------
; wall_sub_signed_offset_clamped
; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Subtract a signed 8-bit offset from a hitbox coordinate, clamping to 0..255.
;            Used to convert hitbox left/top back to entity origin after a snap.
;            Inverse of wall_add_signed_offset_clamped.
;   Inputs:
;     - A  = hitbox pixel coordinate (left or top, unsigned 0..255)
;     - HL = pointer to signed collision offset byte (-128..127)
;            (same pointer passed to wall_add_signed_offset_clamped when building)
;   Outputs:
;     - A  = clamp(hitbox - offset, 0, 255)
;            i.e. the entity origin coordinate that produces the snapped hitbox edge
;   Clobbers: AF, B, C
;   Preserved: DE, HL
;   Notes:
;     - If offset is negative: hitbox - offset = hitbox + abs(offset).
;       Overflow (carry clear after add) → A clamped to 255.
;     - If offset is positive: hitbox - offset computed directly.
;       Underflow (carry clear after sub) → A clamped to 0.
;     - B holds the raw offset byte; C holds the original hitbox coordinate.
; ------------------------------------------------------------------
wall_sub_signed_offset_clamped:
    ld c, a
    ld b, (hl)                    ; B = signed offset
    bit 7, b
    jr z, .wssc_positive
    ; offset < 0 -> hitbox - offset = hitbox + abs(offset)
    ld a, b
    neg
    add a, c
    jr nc, .wssc_done
    ld a, 255
    ret
.wssc_positive:
    ld a, c
    sub b
    jr nc, .wssc_done
    xor a
.wssc_done:
    ret
    
    ; DeadlyTiles system filtered out(not used)
init_deadly_tiles_system:
    ret

update_deadly_tiles_component:
    ret

refresh_player_deadly_fastpath:
    ret
    
    ; Collectible system filtered out(not used)
init_collectible_system:
    ret

update_collectible_component:
    ret
    
; ==================================================================
; TILE INTERACTION SYSTEM
; ==================================================================
; Checks if any entity with COMP_INPUT overlaps a tile marked as
; Interactable (mapId & #08 != 0) in the runtime behavior map.
; When found: removes tile from screen and increments gem_count.
; ------------------------------------------------------------------
; Called once per frame from update_all_entities.
; ------------------------------------------------------------------


interaction_target_variable_ptr_table:
    dw 0
    dw global_var_score
    dw global_var_lives

interaction_target_variable_word_table:
    db 0
    db 1
    db 0


init_tile_interaction_system:
    ld hl, entity_slash_vel_x
    ld de, entity_slash_vel_x+1
    ld bc, 31
    ld (hl), 0
    ldir
    ld hl, entity_slash_vel_y
    ld de, entity_slash_vel_y+1
    ld bc, 31
    ld (hl), 0
    ldir
    ld hl, entity_button_contact_active
    ld de, entity_button_contact_active+1
    ld bc, 31
    ld (hl), 0
    ldir
    ld hl, entity_button_contact_x
    ld de, entity_button_contact_x+1
    ld bc, 31
    ld (hl), 0
    ldir
    ld hl, entity_button_contact_y
    ld de, entity_button_contact_y+1
    ld bc, 31
    ld (hl), 0
    ldir
    xor a
    ld (last_interaction_pending), a
    ret

; ------------------------------------------------------------------
; update_slash_component
; Tile-by-tile slash: moves entity exactly 8px per frame, checking
; for solid tiles before each step.  Covers the remaining distance
; stored in entity_slash_vel_x/y (decayed by 8 each frame).
; ------------------------------------------------------------------
update_slash_component:
    ld a, (active_entity_count)
    or a
    ret z
    ld b, a
    ld hl, active_entity_list

.slash_loop:
    ld c, (hl)
    inc hl
    push hl                    ; Save list pointer
    ld e, c
    ld d, 0

    ; Check if entity has any slash velocity (X or Y)
    ld hl, entity_slash_vel_x
    add hl, de
    ld a, (hl)
    ld hl, entity_slash_vel_y
    add hl, de
    or (hl)
    jp z, .slash_next          ; both zero → skip

    push bc

    ; --- Build hitbox for tile checks (reuse wall_hit_* scratch) ---
    ; hitbox_left = entity_x + collision_offset_x
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    ld hl, entity_collision_offset_x
    add hl, de
    add a, (hl)
    ld (wall_hit_left), a

    ; hitbox_right = left + w - 1
    ld hl, entity_collision_hitbox_w
    add hl, de
    ld a, (hl)
    or a
    jp nz, .sl_w_ok
    ld a, 1
.sl_w_ok:
    ld c, a
    ld a, (wall_hit_left)
    add a, c
    dec a
    ld (wall_hit_right), a

    ; hitbox_top = entity_y + collision_offset_y
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    ld hl, entity_collision_offset_y
    add hl, de
    add a, (hl)
    ld (wall_hit_top), a

    ; hitbox_bottom = top + h - 1
    ld hl, entity_collision_hitbox_h
    add hl, de
    ld a, (hl)
    or a
    jp nz, .sl_h_ok
    ld a, 1
.sl_h_ok:
    ld c, a
    ld a, (wall_hit_top)
    add a, c
    dec a
    ld (wall_hit_bottom), a

    ; ============ PROCESS X SLASH ============
    ld hl, entity_slash_vel_x
    add hl, de
    ld a, (hl)
    or a
    jp z, .slash_x_done
    bit 7, a
    jp nz, .slash_x_left

.slash_x_right:
    ; Check tile at column (hitbox_right + 8) / 8
    ld a, (wall_hit_right)
    add a, 8
    jp c, .slash_x_stop        ; overflow → screen edge
    srl a
    srl a
    srl a
    ld c, a                    ; C = probe column
    ; Probe top row
    ld a, (wall_hit_top)
    srl a
    srl a
    srl a
    ld b, a
    push bc
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    pop bc
    jp nz, .slash_x_stop
    ; Probe bottom row
    ld a, (wall_hit_bottom)
    srl a
    srl a
    srl a
    ld b, a
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    jp nz, .slash_x_stop

    ; Passable → override vel_x = +8, decay slash_vel_x by 8
    ld hl, entity_vel_x
    add hl, de
    ld (hl), 8
    ld hl, entity_slash_vel_x
    add hl, de
    ld a, (hl)
    sub 8
    jp nc, .slash_x_store
    xor a
.slash_x_store:
    ld (hl), a
    jp .slash_x_done

.slash_x_left:
    ; Check tile at column (hitbox_left - 8) / 8
    ld a, (wall_hit_left)
    cp 8
    jp c, .slash_x_stop        ; < 8 → screen edge
    sub 8
    srl a
    srl a
    srl a
    ld c, a                    ; C = probe column
    ; Probe top row
    ld a, (wall_hit_top)
    srl a
    srl a
    srl a
    ld b, a
    push bc
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    pop bc
    jp nz, .slash_x_stop
    ; Probe bottom row
    ld a, (wall_hit_bottom)
    srl a
    srl a
    srl a
    ld b, a
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    jp nz, .slash_x_stop

    ; Passable → override vel_x = -8, decay slash_vel_x by 8 toward 0
    ld hl, entity_vel_x
    add hl, de
    ld (hl), #F8               ; -8
    ld hl, entity_slash_vel_x
    add hl, de
    ld a, (hl)
    add a, 8                   ; negative + 8 → toward zero
    bit 7, a
    jp nz, .slash_x_store_l
    xor a                      ; crossed zero → clamp
.slash_x_store_l:
    ld (hl), a
    jp .slash_x_done

.slash_x_stop:
    ; Hit solid tile or screen edge → kill X slash and X velocity
    ld hl, entity_slash_vel_x
    add hl, de
    ld (hl), 0
    ld hl, entity_vel_x
    add hl, de
    ld (hl), 0

.slash_x_done:

    ; ============ PROCESS Y SLASH ============
    ld hl, entity_slash_vel_y
    add hl, de
    ld a, (hl)
    or a
    jp z, .slash_y_done
    bit 7, a
    jp nz, .slash_y_up

.slash_y_down:
    ; Check tile at row (hitbox_bottom + 8) / 8
    ld a, (wall_hit_bottom)
    add a, 8
    cp 192
    jp nc, .slash_y_stop       ; off-screen bottom
    srl a
    srl a
    srl a
    ld b, a                    ; B = probe row
    ; Probe left column
    ld a, (wall_hit_left)
    srl a
    srl a
    srl a
    ld c, a
    push bc
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    pop bc
    jp nz, .slash_y_stop
    ; Probe right column
    ld a, (wall_hit_right)
    srl a
    srl a
    srl a
    ld c, a
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    jp nz, .slash_y_stop

    ; Passable → override vel_y = +8, decay slash_vel_y by 8
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 8
    ld hl, entity_slash_vel_y
    add hl, de
    ld a, (hl)
    sub 8
    jp nc, .slash_y_store
    xor a
.slash_y_store:
    ld (hl), a
    jp .slash_y_done

.slash_y_up:
    ; Check tile at row (hitbox_top - 8) / 8
    ld a, (wall_hit_top)
    cp 8
    jp c, .slash_y_stop        ; < 8 → screen edge
    sub 8
    srl a
    srl a
    srl a
    ld b, a                    ; B = probe row
    ; Probe left column
    ld a, (wall_hit_left)
    srl a
    srl a
    srl a
    ld c, a
    push bc
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    pop bc
    jp nz, .slash_y_stop
    ; Probe right column
    ld a, (wall_hit_right)
    srl a
    srl a
    srl a
    ld c, a
    call get_behavior_tile
    call wall_behavior_is_full_blocker
    jp nz, .slash_y_stop

    ; Passable → override vel_y = -8, decay slash_vel_y by 8 toward 0
    ld hl, entity_vel_y
    add hl, de
    ld (hl), #F8               ; -8
    ld hl, entity_slash_vel_y
    add hl, de
    ld a, (hl)
    add a, 8                   ; negative + 8 → toward zero
    bit 7, a
    jp nz, .slash_y_store_u
    xor a
.slash_y_store_u:
    ld (hl), a
    jp .slash_y_done

.slash_y_stop:
    ; Hit solid tile or screen edge → kill Y slash and Y velocity
    ld hl, entity_slash_vel_y
    add hl, de
    ld (hl), 0
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0

.slash_y_done:
    pop bc

.slash_next:
    pop hl
    dec b
    jp nz, .slash_loop
    ret


record_bonus_respawn_slot:
    ld a, d
    push af
    ld a, e
    push af
    ld b, MAX_BONUS_RESPAWNS
    ld c, 0
.rbr_loop:
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_secs
    add hl, de
    ld a, (hl)
    or a
    jp z, .rbr_store
    inc c
    dec b
    jp nz, .rbr_loop
    pop af
    pop af
    ret
.rbr_store:
    ld (hl), 5
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_frames
    add hl, de
    ld (hl), 60
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_world
    add hl, de
    ld a, (current_world_id)
    ld (hl), a
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_screen
    add hl, de
    ld a, (current_screen_id)
    ld (hl), a
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_idx_l
    add hl, de
    pop af
    ld (hl), a
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_idx_h
    add hl, de
    pop af
    ld (hl), a
    ret

update_bonus_respawns:
    ld b, MAX_BONUS_RESPAWNS
    ld c, 0
.ubr_loop:
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_secs
    add hl, de
    ld a, (hl)
    or a
    jp z, .ubr_next
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_frames
    add hl, de
    ld a, (hl)
    dec a
    ld (hl), a
    jp nz, .ubr_next
    ld (hl), 60
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_secs
    add hl, de
    ld a, (hl)
    dec a
    ld (hl), a
    jp nz, .ubr_next
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_world
    add hl, de
    ld a, (current_world_id)
    cp (hl)
    jp nz, .ubr_clear_slot
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_screen
    add hl, de
    ld a, (current_screen_id)
    cp (hl)
    jp nz, .ubr_clear_slot
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_idx_l
    add hl, de
    ld a, (hl)
    push af
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_idx_h
    add hl, de
    ld a, (hl)
    ld d, a
    pop af
    ld e, a
    push bc
    ld hl, NAMETBL
    add hl, de
    ld a, 141
    call FAST_WRTVRM
    pop bc
    ld hl, runtime_behavior_map
    add hl, de
    ld (hl), #08
.ubr_clear_slot:
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_secs
    add hl, de
    ld (hl), 0
    ld d, 0
    ld e, c
    ld hl, bonus_respawn_frames
    add hl, de
    ld (hl), 0
.ubr_next:
    inc c
    dec b
    jp nz, .ubr_loop
    ret


; ------------------------------------------------------------------
; Generic interaction helpers
; ------------------------------------------------------------------
resolve_interaction_target_ptr:
    push de
    ld e, a
    ld d, 0
    push de
    ld hl, interaction_target_variable_ptr_table
    add hl, de
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ex de, hl
    pop de
    push hl
    ld hl, interaction_target_variable_word_table
    add hl, de
    ld a, (hl)
    pop hl
    pop de
    ret

interaction_add_last_value_default1:
    push bc
    push de
    ld a, (last_interaction_target)
    or a
    jr z, .iat_add_done
    call resolve_interaction_target_ptr
    ld b, a
    ld a, h
    or l
    jr z, .iat_add_done
    ld a, (last_interaction_value)
    or a
    jr nz, .iat_add_have_amount
    ld a, 1
.iat_add_have_amount:
    ld c, a
    ld a, b
    or a
    jr z, .iat_add_byte
    ld a, (hl)
    add a, c
    ld (hl), a
    inc hl
    ld a, (hl)
    adc a, 0
    ld (hl), a
    jr .iat_add_sync
.iat_add_byte:
    ld a, (hl)
    add a, c
    ld (hl), a
.iat_add_sync:
    call call_force_render_hud_resident
.iat_add_done:
    pop de
    pop bc
    ret


interaction_clear_behavior_at_de:
    push hl
    ld hl, runtime_behavior_map
    add hl, de
    ld (hl), 0
    pop hl
    ret

interaction_clear_vram_tile_at_de:
    push hl
    ld hl, NAMETBL
    add hl, de
    ld a, 0
    call FAST_WRTVRM
    pop hl
    ret

; ------------------------------------------------------------------
; check_tile_interaction
; Purpose:
;   Scan active input-driven entities against the interactable tile map,
;   dispatch the configured per-tile interaction, and update persistence/runtime state.
; Input:
;   None (reads active_entity_list / input_entity_count and runtime maps)
; Output:
;   None
; Clobbers:
;   AF, BC, DE, HL
; Preserves:
;   IX, IY, SP
; ------------------------------------------------------------------
check_tile_interaction:
    xor a
    ld (last_interaction_pending), a
    call scan_tile_interaction_entities
    call update_bonus_respawns
    ret

scan_tile_interaction_entities:
    ld a, (input_entity_count)
    or a
    ret z                         ; No active entities

    ld hl, input_entity_list
    ld b, a                        ; B = entity count

.ti_loop:
    ld c, (hl)                     ; C = entity index
    ld a, (player_runtime_enabled)
    or a
    jp z, .ti_process_entity
    ld a, (player_entity_index)
    cp c
    jp z, .ti_skip_fast_player
.ti_process_entity:
    push hl                        ; Save list pointer
    push bc                        ; Save count(B) + entity(C)

    ; Check COMP_MASK_INPUT (bit 4, value #10 in low mask byte)
    ld e, c
    ld d, 0                        ; DE = entity index
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_INPUT
    jp z, .ti_next                 ; No input component → skip

    ; Deadly state is produced earlier by update_deadly_tiles_component.
    ; Tile interaction only consumes entity_flag_deadly_tile.

    ; Get center X
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    add a, 8                       ; center X = x + 8
    push af                        ; Save centerX

    ; Get center Y
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    add a, 8                       ; center Y = y + 8
    ld e, a                        ; E = centerY

    pop af                         ; A = centerX
    ld d, a                        ; D = centerX, E = centerY

    ; Convert pixel → tile coords (div 8 via 3x rrca + and #1F)
    ld a, d
    rrca
    rrca
    rrca
    and #1F
    ld d, a                        ; D = tileX (0-31)

    ld a, e
    rrca
    rrca
    rrca
    and #1F
    ld e, a                        ; E = tileY (0-23)

    push de                        ; Save tileX/tileY for last_interaction_*

    ; Compute idx = tileY * 32 + tileX
    ld h, 0
    ld l, e                        ; HL = tileY
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                     ; HL = tileY * 32
    ld b, 0
    ld c, d                        ; BC = tileX
    add hl, bc                     ; HL = idx

    push hl                        ; Save idx

    ; Check runtime_behavior_map[idx]
    ld de, runtime_behavior_map
    add hl, de                     ; HL = &runtime_behavior_map[idx]
    ld a, (hl)
    and #08                        ; INTERACTABLE flag (bit 3)
    jp z, .ti_no_collect

    ; Recover tile index and tile coordinates for the interaction dispatcher.
    pop de                         ; DE = idx
    pop hl                         ; H = tileX, L = tileY
    pop bc                         ; B = loop count, C = entity index
    push bc                        ; Restore loop state for .ti_next
    ld a, h
    ld (last_interaction_x), a
    ld a, l
    ld (last_interaction_y), a
    ld a, c
    ld (last_interaction_entity), a

    ; 0. Read char code from VRAM Name Table BEFORE clearing VRAM.
    ;    Stored in last_interaction_char / last_gem_char for SM comparisons.
    push de                        ; Preserve DE = idx across VRAM read setup
    ld hl, NAMETBL
    add hl, de                     ; HL = NAMETBL + idx (VRAM address to read)
    ; MSX1 direct VRAM read (port #99 = address register, port #98 = data)
    ld a, l
    out (#99), a                   ; Set VRAM address low byte
    ld a, h
    and #3F                        ; Bits 7,6 = 0 → read mode
    out (#99), a                   ; Set VRAM address high byte
    nop                            ; Short delay for VDP address latch
    nop
    in a, (#98)                    ; A = char code from VRAM data port
    ld (last_interaction_char), a
    ld b, a                        ; Preserve collected char code for bonus-tile compare
    pop de                         ; Restore DE = idx

    push de
    ld hl, runtime_interaction_type_map
    add hl, de
    ld a, (hl)
    ld (last_interaction_type), a
    pop de

    push de
    ld hl, runtime_interaction_value_map
    add hl, de
    ld a, (hl)
    ld (last_interaction_value), a
    pop de

    push de
    ld hl, runtime_interaction_target_map
    add hl, de
    ld a, (hl)
    ld (last_interaction_target), a
    pop de

    ld a, (last_interaction_type)
    cp 1
    jp z, .ti_collect_gem
    jp .ti_next

.ti_collect_gem:
    call interaction_clear_behavior_at_de
    ld a, b
    cp 141
    jp z, .ti_collect_bonus

    jp .ti_collect_gem_normal

.ti_collect_gem_normal:
    call interaction_clear_vram_tile_at_de

    ; 3. Increment gem_count
    ld hl, gem_count
    inc (hl)

    ; Tile Collector configured variable increment (16-bit).
    ld hl, global_var_score
    ld a, (hl)
    add a, 10
    ld (hl), a
    inc hl
    ld a, (hl)
    adc a, 0
    ld (hl), a
    ; Keep HUD Score text in sync with the updated global variable.
    push de
    call call_force_render_hud_resident
    pop de


    ; No flagVariable configured in the Tile Collector UI.

    call interaction_add_last_value_default1

    ; Tile Collector UI-configured collection sound.
    ; Preserve DE because it still carries the tile index for persistence.
    push de
    ld a, 1
    call SM_PlaySoundAsset
    pop de


    ; 4. Record in persistent collected list (survives screen re-entry via apply_collected_tiles)
    ;    FAST_WRTVRM preserves all registers, so DE = idx is still valid here.
.ti_record_persistent:
    ld a, (collected_count)
    cp MAX_COLLECTIBLES
    jp nc, .ti_next                ; List full - skip recording
    ld c, a                        ; C = index = old collected_count
    ld b, 0                        ; BC = (0, index)
    ; Store world+screen ID of the collected tile
    ld hl, collected_world
    add hl, bc
    ld a, (current_world_id)
    ld (hl), a
    ld hl, collected_screen
    add hl, bc
    ld a, (current_screen_id)
    ld (hl), a
    ; Store tile name-table index (DE = idx, preserved by FAST_WRTVRM)
    ld hl, collected_idx_l
    add hl, bc
    ld (hl), e                     ; E = idx low byte
    ld hl, collected_idx_h
    add hl, bc
    ld (hl), d                     ; D = idx high byte
    ; Increment collected_count
    ld hl, collected_count
    inc (hl)

    jp .ti_next


.ti_collect_bonus:
    ; Bonus tile path: independent from normal collectible gem logic.
    push hl
    ld hl, NAMETBL
    add hl, de                     ; HL = NAMETBL + idx
    ld a, 0
    call FAST_WRTVRM
    pop hl

    ; Bonus tile effect: 8px-per-frame slash in current movement direction.
    ; Covers 8 tiles (64px). Checks solid tiles each step.
    push de
    ld e, c
    ld d, 0
    ld hl, entity_on_ground
    add hl, de
    res 0, (hl)

    ld hl, entity_platform_id
    add hl, de
    ld (hl), 255

    ; --- Set slash_vel_x = sign(vel_x) * 64 ---
    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    or a
    jp z, .ti_slash_x_zero
    bit 7, a
    jp nz, .ti_slash_x_neg
    ld a, 64          ; +64 (moving right)
    jp .ti_slash_x_set
.ti_slash_x_neg:
    ld a, #C0          ; -64 (moving left)
.ti_slash_x_set:
    ld hl, entity_slash_vel_x
    add hl, de
    ld (hl), a
    jp .ti_slash_x_done
.ti_slash_x_zero:
    ld hl, entity_slash_vel_x
    add hl, de
    ld (hl), 0
.ti_slash_x_done:

    ; --- Set slash_vel_y = sign(vel_y) * 64 ---
    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)
    or a
    jp z, .ti_slash_y_zero
    bit 7, a
    jp nz, .ti_slash_y_neg
    ld a, 64          ; +64 (moving down)
    jp .ti_slash_y_set
.ti_slash_y_neg:
    ld a, #C0          ; -64 (moving up)
.ti_slash_y_set:
    ld hl, entity_slash_vel_y
    add hl, de
    ld (hl), a
    jp .ti_slash_y_done
.ti_slash_y_zero:
    ld hl, entity_slash_vel_y
    add hl, de
    ld (hl), 0
.ti_slash_y_done:

    ; Zero gravity so it doesn't fight the vertical slash
    ld hl, entity_gravity_vel
    add hl, de
    add hl, de
    ld (hl), 0
    inc hl
    ld (hl), 0

.ti_bonus_done:
    pop de


    ; No bonusSoundId configured.


    ; Timed bonus respawn enabled: queue tile restoration and skip persistence.
    call record_bonus_respawn_slot
    jp .ti_next


.ti_no_collect:
    pop hl                         ; Balance idx push
    pop de                         ; Balance tileX/tileY push
    pop bc                         ; Restore B=count, C=entity

.ti_next:
    pop bc                         ; Restore B=count, C=entity
    pop hl                         ; Restore list pointer
    inc hl                         ; Advance to next entity
    dec b
    jp nz, .ti_loop                ; djnz replaced with jp nz (loop body > 127 bytes)
    ret

.ti_skip_fast_player:
    inc hl
    dec b
    jp nz, .ti_loop
    ret

refresh_player_tile_interaction_fastpath:
    ld a, (player_runtime_enabled)
    or a
    ret z
    ld a, (player_entity_index)
    cp #FF
    ret z
    ld c, a
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_INPUT
    ret z

    ld a, (player_runtime_enabled)
    push af
    ld a, (input_entity_count)
    push af
    ld a, (input_entity_list)
    push af

    xor a
    ld (player_runtime_enabled), a
    ld a, c
    ld (input_entity_list), a
    ld a, 1
    ld (input_entity_count), a
    call scan_tile_interaction_entities

    pop af
    ld (input_entity_list), a
    pop af
    ld (input_entity_count), a
    pop af
    ld (player_runtime_enabled), a
    ret

; ------------------------------------------------------------------
; apply_collected_tiles
; Re-clears tiles that were previously collected on the current world/screen.
; Called after every screen load so collected tiles do not respawn.
; Input:  current_world_id and current_screen_id must already be set.
; Output: None
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
apply_collected_tiles:
    ld a, (collected_count)
    or a
    ret z                          ; Nothing collected yet - return early

    ld b, a                        ; B = djnz counter (total collected entries)
    ld c, 0                        ; C = loop index
.apply_ct_loop:
    ; DE = (0, index) used for all three table lookups.
    ; add hl, de does NOT modify DE, so we can reuse it for all 3 tables.
    ld d, 0
    ld e, c                        ; DE = (0, current index)

    ; Check if this entry belongs to current world
    ld hl, collected_world
    add hl, de                     ; HL = &collected_world[index]
    ld a, (current_world_id)       ; A = world currently loaded
    cp (hl)                        ; Compare with stored world ID
    jr nz, .apply_ct_skip          ; Different world - skip

    ; Check if this entry belongs to current screen
    ld hl, collected_screen
    add hl, de                     ; HL = &collected_screen[index]
    ld a, (current_screen_id)      ; A = screen currently loaded
    cp (hl)                        ; Compare with stored screen ID
    jr nz, .apply_ct_skip          ; Different screen - skip

    ; Entry matches current screen: re-clear this tile
    push bc                        ; Save B=count, C=index across FAST_WRTVRM

    ; Build tile index: D = idx_h, E = idx_l
    ; (DE is still (0, index) because add hl, de never modifies DE)
    ld hl, collected_idx_l
    add hl, de                     ; HL = &collected_idx_l[index]
    ld a, (hl)
    push af                        ; Save idx_l on stack

    ld hl, collected_idx_h
    add hl, de                     ; HL = &collected_idx_h[index], DE still (0, index)
    ld a, (hl)
    ld d, a                        ; D = idx_h

    pop af                         ; A = idx_l
    ld e, a                        ; E = idx_l
    ; DE = tile index (D=high, E=low)

    ; Re-clear runtime_behavior_map[idx]
    push de                        ; Save idx
    ld hl, runtime_behavior_map
    add hl, de
    ld (hl), 0
    pop de                         ; Restore idx

    ; Re-clear VRAM Name Table (NAMETBL + idx)
    ld hl, NAMETBL
    add hl, de
    xor a                          ; A = 0 (empty tile char)
    call FAST_WRTVRM               ; Preserves all registers

    pop bc                         ; Restore B=count, C=index

.apply_ct_skip:
    inc c
    djnz .apply_ct_loop
    ret
 
    ; ================================================================== 
        ; ENTITY MANAGEMENT FUNCTIONS(Based on EntityTemplate system) 
    ; ================================================================== 

        ; Create entity with components(A = entity ID, B = mask low byte, C = mask high byte) 
        create_entity:
    ; Guard invalid indices to avoid RAM table corruption.
            cp MAX_ENTITIES
            ret nc
; Set component mask for entity
            ld hl, entity_comp_masks
            ld e, a; Entity index
            ld d, 0
            add hl, de; HL points to entity mask
            ld (hl), b; Set component mask low byte

            ld hl, entity_comp_masks_hi
            add hl, de
            ld (hl), c; Set component mask high byte

    ; Mark entity as active
            ld hl, entity_active
            add hl, de
            ld (hl), 1                    ; entity_active[entity] = 1
            ld hl, active_entity_list_dirty
            ld (hl), 1

    ; Default job scheduler profile for newly created entities
    ; period=1 (100%), entry=0
            ld hl, entity_job_period
            add hl, de
            ld (hl), 1
            ld hl, entity_job_entry
            add hl, de
            ld (hl), 0

    ; Initialize component data based on mask
            bit 0, b; Check COMP_MASK_POSITION (low byte)
            call nz, init_entity_position

            bit 1, b; Check COMP_MASK_SPRITE (low byte)
            call nz, init_entity_sprite

    ret 

    ; ------------------------------------------------------------------
    ; entity_job_set
    ; Set/update job scheduler profile for one entity.
    ; Input:  A = entity index (0..31)
    ;         B = period in frames (0 treated as 1)
    ;         C = entry slot (wrapped to 0..period-1)
    ; Output: entity_job_period/entry updated for that entity
    ; Destroys: AF, DE, HL
    ; ------------------------------------------------------------------
entity_job_set:
            cp MAX_ENTITIES
            ret nc
            ld e, a
            ld d, 0

            ld a, b
            or a
            jr nz, entity_job_set_period_ok
            ld a, 1
entity_job_set_period_ok:
            ld b, a

            ld a, c
entity_job_set_entry_wrap:
            cp b
            jr c, entity_job_set_entry_ok
            sub b
            jr entity_job_set_entry_wrap
entity_job_set_entry_ok:
            ld c, a

            ld hl, entity_job_period
            add hl, de
            ld a, b
            ld (hl), a

            ld hl, entity_job_entry
            add hl, de
            ld a, c
            ld (hl), a
            ld a, b
            cp 1
            jr nz, entity_job_set_enable_scheduler
            ld a, c
            or a
            ret z
entity_job_set_enable_scheduler:
            ld a, 1
            ld (entity_job_scheduler_active), a
            ret

    ; ------------------------------------------------------------------
    ; entity_job_should_run_c
    ; Evaluate per-entity cadence gate for current frame.
    ; Input:  C = entity index (0..31)
    ; Output: A = 1 when entity should run this frame, 0 otherwise
    ; Destroys: AF, BC, DE, HL
    ; Notes:
    ;   - Fast path for power-of-two periods using bitmask modulo.
    ;   - Fallback path uses 16-bit frame modulo with fixed 16-iteration cost.
    ; ------------------------------------------------------------------
entity_job_should_run_c:
            ld a, c
            cp MAX_ENTITIES
            jr c, .entity_job_run_idx_ok
            xor a
            ret
.entity_job_run_idx_ok:
            push bc
            push de
            push hl

            ld e, c
            ld d, 0

            ld hl, entity_job_period
            add hl, de
            ld a, (hl)
            or a
            jr nz, entity_job_run_period_ok
            ld a, 1
entity_job_run_period_ok:
            cp 1
            jr z, entity_job_run_active
            ld b, a

            ld hl, entity_job_entry
            add hl, de
            ld a, (hl)
            ld e, a

            ; Fast modulo for power-of-two period:
            ; if (period & (period - 1)) == 0 then use AND mask.
            ld a, b
            dec a
            ld d, a                    ; D = period - 1
            ld a, d
            and b
            jr nz, entity_job_run_fallback_mod

            ld a, e
            and d
            ld e, a
            ld a, (interrupt_counter)
            and d
            cp e
            jr nz, entity_job_run_inactive
            jr entity_job_run_active

entity_job_run_fallback_mod:
            ld a, e
entity_job_run_entry_mod:
            cp b
            jr c, entity_job_run_entry_ready
            sub b
            jr entity_job_run_entry_mod
entity_job_run_entry_ready:
            ld e, a

            ; 16-bit frame modulo: (interrupt_counter % period) in A
            ; Uses shift/subtract division with fixed 16 iterations.
            ld hl, (interrupt_counter)
            xor a
            ld d, 16
entity_job_run_frame_mod16:
            add hl, hl
            adc a, a
            cp b
            jr c, entity_job_run_frame_mod16_no_sub
            sub b
entity_job_run_frame_mod16_no_sub:
            dec d
            jr nz, entity_job_run_frame_mod16

            cp e
            jr nz, entity_job_run_inactive
entity_job_run_active:
            ld a, 1
            jr entity_job_run_done
entity_job_run_inactive:
            xor a
entity_job_run_done:
            pop hl
            pop de
            pop bc
            ret

    ; Initialize position component for entity(A = entity ID)
        init_entity_position:
            ld hl, entity_x_pos
            ld e, a
            ld d, 0
            add hl, de
            ld (hl), 100; Default X position

            ld hl, entity_y_pos
            add hl, de
            ld (hl), 100; Default Y position
    ret

    ; Initialize sprite component for entity(A = entity ID)
        init_entity_sprite:
    ; Set sprite as visible with default pattern
            ld hl, sprite_pattern
            ld e, a
            ld d, 0
            add hl, de
            ld (hl), 0; Pattern 0

            ld hl, sprite_color
            add hl, de
            ld (hl), 15; White color
    ret
    
; ==================================================================
; UPDATE ALL ENTITIES - Called by GameFlow (OPTIMIZED)
; ==================================================================
; Only calls component systems that are actually used in this project
; Unused systems are NOT called (saves Z80 cycles)
; Register Contract:
;   Purpose: Main ECS tick entrypoint for one frame.
;   Inputs:
;     - Entity/component tables in RAM
;   Outputs:
;     - Components updated in fixed order
;   Clobbers:
;     - AF
;     - BC
;     - DE
;     - HL
;   Preserved:
;     - None (callers should save what they need)
;   Register roles:
;     - Registers are scratch across component CALL chain
;     - Contract intentionally conservative to prevent hidden coupling
;   Notes:
;     - Do not assume any register survives this routine.

update_all_entities:
    ; Fast path: when all entities use default job cadence (period=1, entry=0),
    ; rebuild the compact list only when entity/screen membership changes.
    ld a, (entity_job_scheduler_active)
    or a
    jp nz, .update_all_entities_rebuild_list
    call ensure_used_entity_list_current
    jp .update_all_entities_list_ready
.update_all_entities_rebuild_list:
    ; Scheduler active: cadence depends on interrupt_counter, so rebuild every frame.
    call call_rebuild_used_entity_list_resident
.update_all_entities_list_ready:
    ld a, (current_screen_engine)
    or a
    jp nz, .update_all_entities_fake_player
.update_all_entities_player:
    call update_input_component         ; 1. Input (player control)
    call call_update_entities_resident                ; 3b. Patrol/per-entity update
    call update_jump_component          ; 4. Jump impulse
    call update_cursors_component       ; 5b. Cursors movement
    call update_gravity_component       ; 6. Gravity
    call update_slash_component         ; 6c. Additive slash velocity
    call update_position_component      ; 7. Apply velocity
    call prepare_platform_detection     ; 8a. Clear platform refs
    call update_collision_component     ; 8b. Collision detection
    call update_platform_riding         ; 8c. Platform riding
    call update_wallcollision_component ; 8d. Wall collision
    call check_tile_interaction         ; 8f. Tile interaction (gems/collectibles)
    call update_animation_component     ; 11. Animation
    call update_sprite_component        ; 13. Sprite rendering
    call sync_player_runtime_from_entity
    ret
.update_all_entities_fake_player:
    call update_position_component      ; 7. Apply velocity
    call update_animation_component     ; 11. Animation
    call update_sprite_component        ; 13. Sprite rendering
    ret
; Total player systems called: 14 (optimized from 16)
; Total fake-player systems called: 3 (screen engine optimized)


; ------------------------------------------------------------------
; mark_used_entity_list_dirty
; Invalidate compact entity list cache.
; Call this after spawn/despawn or screen-id changes.
; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Mark compact active-entity cache as stale.
;   Inputs:
;     - None
;   Outputs:
;     - active_entity_list_dirty = 1
;   Clobbers:
;     - HL
;   Preserved:
;     - AF
;     - BC
;     - DE
;   Register roles:
;     - HL = points to dirty flag byte

mark_used_entity_list_dirty:
    ld hl, active_entity_list_dirty
    ld (hl), 1
    ret

; ------------------------------------------------------------------
; ensure_used_entity_list_current
; Rebuild compact list only when marked dirty.
; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Conditionally rebuild compact active list only when dirty.
;   Inputs:
;     - active_entity_list_dirty flag
;   Outputs:
;     - active_entity_list rebuilt if needed
;   Clobbers:
;     - AF
;   Preserved:
;     - BC
;     - DE
;     - HL (except nested call clobbers when rebuild happens)
;   Register roles:
;     - A = dirty flag test and branch
;   Notes:
;     - If dirty, downstream rebuild_used_entity_list can clobber many registers.

ensure_used_entity_list_current:
    ld a, (active_entity_list_dirty)
    or a
    ret z
    call call_rebuild_used_entity_list_resident
    ret

; ------------------------------------------------------------------
; rebuild_used_entity_list
; Build compact list of ACTIVE entity slots that are in use
; for the CURRENT SCREEN only:
; (entity_active != 0 and mask_l|mask_h != 0 and entity_screen_id == current_screen_id)
; Output:
;   active_entity_list[]   = entity indices with components
;   active_entity_count    = number of entries
; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Recompute compact list of entities active on current screen.
;   Inputs:
;     - entity_active, entity_comp_masks(_hi), entity_screen_id, current_screen_id
;   Outputs:
;     - active_entity_list[]
;     - active_entity_count
;     - hero_entity_id updated from first current-screen entity flagged as player
;     - input/render/collision/ground/anim buckets refreshed
;     - active_entity_list_dirty=0
;   Clobbers:
;     - AF
;     - BC
;     - DE
;     - HL
;   Preserved:
;     - None
;   Register roles:
;     - B = slots remaining (MAX_ENTITIES..1)
;     - C = entity slot iterator (0..MAX_ENTITIES-1)
;     - DE = index offset (entity id / active list position)
;     - HL = pointer math over component and state arrays
;     - A = predicate checks and counters

rebuild_used_entity_list:
    xor a
    ld (active_entity_count), a
    ld (input_entity_count), a
    ld (render_entity_count), a
    ld (collision_entity_count), a
    ld (ground_entity_count), a
    ld (anim_entity_count), a
    ld a, #FF
    ld (hero_entity_id), a
    ld b, MAX_ENTITIES
    ld c, 0

.rebuild_loop:
    ld e, c
    ld d, 0
    ld hl, entity_active
    add hl, de
    ld a, (hl)
    or a
    jp z, .next_entity

    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    ld hl, entity_comp_masks_hi
    add hl, de
    or (hl)
    jp z, .next_entity

    ; Keep only entities from currently visible screen
    ld hl, entity_screen_id
    add hl, de
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jp nz, .next_entity

    ; Keep only entities scheduled to run on this frame.
    ; entity_job_should_run_c expects C=entity index.
    push bc
    call entity_job_should_run_c
    pop bc
    or a
    jp z, .next_entity

    ld hl, active_entity_count
    ld a, (hl)
    cp MAX_ENTITIES
    jp nc, .next_entity

    ld e, a
    ld d, 0
    ld hl, active_entity_list
    add hl, de
    ld (hl), c
    ld hl, active_entity_count
    inc (hl)

    ld e, c
    ld d, 0
    ld a, (hero_entity_id)
    cp #FF
    jr nz, .skip_hero_candidate
    ld hl, entity_is_player
    add hl, de
    ld a, (hl)
    or a
    jr z, .skip_hero_candidate
    ld a, c
    ld (hero_entity_id), a
.skip_hero_candidate:

    ; Build hot-path buckets once so gameplay systems avoid repeating
    ; the same component-mask filtering every frame.
    ld e, c
    ld d, 0

    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_INPUT
    jr z, .skip_input_bucket
    ld a, (input_entity_count)
    ld l, a
    ld h, 0
    ld de, input_entity_list
    add hl, de
    ld (hl), c
    ld hl, input_entity_count
    inc (hl)
.skip_input_bucket:

    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_SPRITE
    jr z, .skip_render_bucket
    ld a, (render_entity_count)
    ld l, a
    ld h, 0
    ld de, render_entity_list
    add hl, de
    ld (hl), c
    ld hl, render_entity_count
    inc (hl)
.skip_render_bucket:

    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_COLLISION
    jr z, .skip_collision_bucket
    ld a, (collision_entity_count)
    ld l, a
    ld h, 0
    ld de, collision_entity_list
    add hl, de
    ld (hl), c
    ld hl, collision_entity_count
    inc (hl)
.skip_collision_bucket:

    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_COLLISION
    jr nz, .store_ground_bucket
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    and #02                       ; COMP_MASK_GRAVITY
    jr z, .skip_ground_bucket
.store_ground_bucket:
    ld a, (ground_entity_count)
    ld l, a
    ld h, 0
    ld de, ground_entity_list
    add hl, de
    ld (hl), c
    ld hl, ground_entity_count
    inc (hl)
.skip_ground_bucket:

    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_ANIMATION | COMP_MASK_SPRITE
    cp COMP_MASK_ANIMATION | COMP_MASK_SPRITE
    jp nz, .next_entity
    ld a, (anim_entity_count)
    ld l, a
    ld h, 0
    ld de, anim_entity_list
    add hl, de
    ld (hl), c
    ld hl, anim_entity_count
    inc (hl)

.next_entity:
    inc c
    dec b
    jp nz, .rebuild_loop

.rebuild_done:
    ld a, (hero_entity_id)
    cp #FF
    jr nz, .rebuild_store_clean
    ld a, (input_entity_count)
    or a
    jr z, .rebuild_store_clean
    ld hl, input_entity_list
    ld a, (hl)
    ld (hero_entity_id), a
.rebuild_store_clean:
    xor a
    ld (active_entity_list_dirty), a
    ret

; ------------------------------------------------------------------
; ensure_player_fast_runtime_bound
; Keep the dedicated player runtime attached to the current hero entity.
; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Bind the player fast-path runtime to the current hero entity.
;   Inputs:
;     - active_entity_list_dirty, hero_entity_id, current-screen filtered entity lists
;   Outputs:
;     - player_runtime_enabled, player_entity_index, player_x/player_y, player_vx_runtime/player_vy_runtime
;   Clobbers:
;     - AF
;     - BC
;     - DE
;     - HL
;   Preserved:
;     - None
;   Notes:
;     - Calls ensure_used_entity_list_current and resolve_runtime_hero_entity.

ensure_player_fast_runtime_bound:
    call ensure_used_entity_list_current
    call resolve_runtime_hero_entity
    cp #FF
    jp nz, .bind_runtime

    xor a
    ld (player_runtime_enabled), a
    ld (player_vx_runtime), a
    ld (player_vy_runtime), a
    ld (player_dash_timer), a
    ld (player_dash_cooldown), a
    ld (player_dash_dir), a
    ld (player_x), a
    ld (player_x+1), a
    ld (player_y), a
    ld (player_y+1), a
    ld a, #FF
    ld (player_entity_index), a
    ret

.bind_runtime:
    ld (player_entity_index), a
    ld a, 1
    ld (player_runtime_enabled), a
    call sync_player_runtime_from_entity
    ret

; ------------------------------------------------------------------
; sync_player_runtime_from_entity
; Mirror hero ECS coordinates/velocity into player_* runtime vars.
; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Copy the current bound hero entity state into player_* runtime variables.
;   Inputs:
;     - player_runtime_enabled, player_entity_index, entity_x_pos/y_pos, entity_vel_x/y
;   Outputs:
;     - player_x, player_y, player_vx_runtime, player_vy_runtime updated
;   Clobbers:
;     - AF
;     - BC
;     - DE
;     - HL
;   Preserved:
;     - None

sync_player_runtime_from_entity:
    ld a, (player_runtime_enabled)
    or a
    ret z
    ld a, (player_entity_index)
    cp #FF
    ret z
    ld c, a
    ld e, c
    ld d, 0

    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    ld (player_x), a
    xor a
    ld (player_x+1), a

    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    ld (player_y), a
    xor a
    ld (player_y+1), a

    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    ld (player_vx_runtime), a

    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)
    ld (player_vy_runtime), a
    ret

get_runtime_interaction_type_tile:
    ; Input: B = row (0..23), C = col (0..31)
    ; Output: A = interaction type id, 0 if out of bounds
    ; Clobbers: AF, DE, HL
    ld a, b
    cp 24
    jr nc, .gritt_oob
    ld a, c
    cp 32
    jr nc, .gritt_oob
    ld l, b
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld e, c
    ld d, 0
    add hl, de
    ld de, runtime_interaction_type_map
    add hl, de
    ld a, (hl)
    ret
.gritt_oob:
    xor a
    ret

update_entity_ladder_state_c:
    ; Input: C = entity index
    ; Output: A = 1 when entity center/feet overlap a ladder tile, else 0
    ; Clobbers: AF, DE, HL
    ; Preserves: BC
    push bc
    ld e, c
    ld d, 0

    ; Sample center tile
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    add a, 8
    rrca
    rrca
    rrca
    and #1F
    ld c, a

    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    add a, 8
    rrca
    rrca
    rrca
    and #1F
    ld b, a
    push de
    call get_runtime_interaction_type_tile
    pop de
    cp 7
    jr z, .uelt_store_active

    ; Sample near feet too, so 16x16 player sprites keep climbing smoothly.
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    add a, 14
    rrca
    rrca
    rrca
    and #1F
    ld b, a
    push de
    call get_runtime_interaction_type_tile
    pop de
    cp 7
    jr z, .uelt_store_active

    xor a
    jr .uelt_store

.uelt_store_active:
    ld a, 1

.uelt_store:
    push af
    ld hl, entity_on_ladder
    add hl, de
    ld (hl), a
    pop af
    pop bc
    ret

; ------------------------------------------------------------------
; Player dash helpers
; ------------------------------------------------------------------
; Register Contract:
; input: C = player entity index, input_btn_curr/input_btn_prev refreshed
; output: A = 1 while dash is active this frame, entity_vel_x/y overridden
; clobbers: AF, BC, DE, HL
; preserved: None
player_fast_dash_process_c:
    ld e, c
    ld d, 0
    ld hl, entity_input_disabled
    add hl, de
    ld a, (hl)
    or a
    jp z, .pfd_input_ok
    xor a
    ld (player_dash_timer), a
    ret
.pfd_input_ok:
    ld a, (boss_hit_cooldown)
    or a
    jp z, .pfd_hit_cooldown_done
    dec a
    ld (boss_hit_cooldown), a
.pfd_hit_cooldown_done:
    ld a, (player_dash_timer)
    or a
    jp nz, .pfd_active
    ld a, (player_dash_cooldown)
    or a
    jp z, .pfd_check_start
    dec a
    ld (player_dash_cooldown), a
.pfd_check_start:
    ld a, (input_btn_curr)
    and INPUT_BTN_GRAB
    jp z, .pfd_inactive
    ld a, (input_btn_prev)
    and INPUT_BTN_GRAB
    jp nz, .pfd_inactive
    call player_fast_dash_resolve_dir_c
    ld (player_dash_dir), a
    ld a, 8
    ld (player_dash_timer), a
    ld a, 18
    ld (player_dash_cooldown), a
.pfd_active:
    ld a, (player_dash_timer)
    dec a
    ld (player_dash_timer), a
    ld a, (player_dash_dir)
    cp 1
    jp z, .pfd_left
    cp 3
    jp z, .pfd_up
    cp 4
    jp z, .pfd_down
.pfd_right:
    ld b, 8
    xor a
    call player_fast_dash_store_velocity_c
    call player_dash_break_front_tile_c
    call player_dash_hit_boss_weakpoint
    ld a, 1
    ret
.pfd_left:
    ld b, #F8
    xor a
    call player_fast_dash_store_velocity_c
    call player_dash_break_front_tile_c
    call player_dash_hit_boss_weakpoint
    ld a, 1
    ret
.pfd_up:
    ld b, 0
    ld a, #F8
    call player_fast_dash_store_velocity_c
    call player_dash_break_front_tile_c
    call player_dash_hit_boss_weakpoint
    ld a, 1
    ret
.pfd_down:
    ld b, 0
    ld a, 8
    call player_fast_dash_store_velocity_c
    call player_dash_break_front_tile_c
    call player_dash_hit_boss_weakpoint
    ld a, 1
    ret
.pfd_inactive:
    xor a
    ret

; Register Contract:
; input: C = player entity index, input_state/entity_facing_dir
; output: A = dash direction (1=left,2=right,3=up,4=down)
; clobbers: AF, DE, HL
; preserved: C
player_fast_dash_resolve_dir_c:
    ld a, (input_state)
    cp STICK_RIGHT
    jp z, .pfdr_right
    cp STICK_UPRIGHT
    jp z, .pfdr_right
    cp STICK_DOWNRIGHT
    jp z, .pfdr_right
    cp STICK_LEFT
    jp z, .pfdr_left
    cp STICK_UPLEFT
    jp z, .pfdr_left
    cp STICK_DOWNLEFT
    jp z, .pfdr_left
    cp STICK_UP
    jp z, .pfdr_up
    cp STICK_DOWN
    jp z, .pfdr_down
    ld e, c
    ld d, 0
    ld hl, entity_facing_dir
    add hl, de
    ld a, (hl)
    cp 1
    ret z
    cp 2
    ret z
    cp 3
    ret z
    cp 4
    ret z
.pfdr_right:
    ld a, 2
    ret
.pfdr_left:
    ld a, 1
    ret
.pfdr_up:
    ld a, 3
    ret
.pfdr_down:
    ld a, 4
    ret

; Register Contract:
; input: B = signed X velocity, A = signed Y velocity, C = entity index
; output: entity_vel_x/y updated
; clobbers: AF, DE, HL
; preserved: BC
player_fast_dash_store_velocity_c:
    push af
    ld e, c
    ld d, 0
    ld hl, entity_vel_x
    add hl, de
    ld (hl), b
    pop af
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a
    ret

; Register Contract:
; input: C = player entity index, player_dash_dir
; output: player_dash_tile_x/y updated for the front probe; Breakable tile at that probe cleared from runtime maps and VRAM
; clobbers: AF, BC, DE, HL
; preserved: None
player_dash_break_front_tile_c:
    ld a, #FF
    ld (player_dash_tile_x), a
    ld (player_dash_tile_y), a
    ld e, c
    ld d, 0
    ld hl, entity_x_pos
    add hl, de
    ld b, (hl)                    ; B = player X pixel
    ld hl, entity_y_pos
    add hl, de
    ld c, (hl)                    ; C = player Y pixel

    ld a, (player_dash_dir)
    cp 1
    jp z, .pdb_left
    cp 3
    jp z, .pdb_up
    cp 4
    jp z, .pdb_down

.pdb_right:
    ld a, b
    cp 240
    ret nc
    add a, 16
    ld b, a
    ld a, c
    cp 184
    ret nc
    add a, 8
    ld c, a
    jp .pdb_probe_tile

.pdb_left:
    ld a, b
    or a
    ret z
    dec a
    ld b, a
    ld a, c
    cp 184
    ret nc
    add a, 8
    ld c, a
    jp .pdb_probe_tile

.pdb_up:
    ld a, c
    or a
    ret z
    dec a
    ld c, a
    ld a, b
    cp 248
    ret nc
    add a, 8
    ld b, a
    jp .pdb_probe_tile

.pdb_down:
    ld a, c
    cp 176
    ret nc
    add a, 16
    ld c, a
    ld a, b
    cp 248
    ret nc
    add a, 8
    ld b, a

.pdb_probe_tile:
    ld a, b
    srl a
    srl a
    srl a
    cp 32
    ret nc
    ld (player_dash_tile_x), a
    ld a, c
    srl a
    srl a
    srl a
    cp 24
    ret nc
    ld (player_dash_tile_y), a

    ld a, (player_dash_tile_y)
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld a, (player_dash_tile_x)
    ld e, a
    ld d, 0
    add hl, de                    ; HL = tile index
    push hl
    ld de, runtime_behavior_map
    add hl, de
    ld a, (hl)
    and TILE_BREAKABLE
    pop hl
    ret z

    push hl
    ld de, runtime_behavior_map
    add hl, de
    ld (hl), 0
    pop hl

    push hl
    ld de, runtime_screen_layout
    add hl, de
    ld (hl), 0
    pop hl

    ld de, NAMETBL
    add hl, de
    xor a
    call FAST_WRTVRM
    ret

; Register Contract:
; input: player_dash_tile_x/y = front dash probe tile, active boss runtime RAM
; output: boss_health_lo/hi decremented by the weak matrix damage byte when hit
; clobbers: AF, BC, DE, HL
; preserved: None
player_dash_hit_boss_weakpoint:
    ld a, (boss_active)
    or a
    ret z
    ld a, (boss_hit_cooldown)
    or a
    ret nz
    ld a, (player_dash_tile_x)
    cp #FF
    ret z
    ld b, a                       ; B = screen tile X
    ld a, (player_dash_tile_y)
    cp #FF
    ret z
    ld c, a                       ; C = screen tile Y

    ld a, (boss_x_char)
    ld d, a
    ld a, b
    cp d
    ret c
    sub d
    ld b, a                       ; B = local boss X
    ld a, (boss_width)
    cp b
    ret z
    ret c

    ld a, (boss_y_char)
    ld d, a
    ld a, c
    cp d
    ret c
    sub d
    ld c, a                       ; C = local boss Y
    ld a, (boss_height)
    cp c
    ret z
    ret c

    ld hl, 0
    ld a, c
    or a
    jp z, .pdhb_row_done
    ld e, a
.pdhb_row_loop:
    ld a, (boss_width)
    ld d, 0
    add a, l
    ld l, a
    ld a, h
    adc a, d
    ld h, a
    dec e
    jp nz, .pdhb_row_loop
.pdhb_row_done:
    ld e, b
    ld d, 0
    add hl, de
    ld de, (boss_weak_matrix_ptr)
    add hl, de
    ld a, (hl)
    or a
    ret z
    ld e, a                       ; E = weak point damage

    ld a, (boss_health_lo)
    ld l, a
    ld a, (boss_health_hi)
    ld h, a
    or l
    ret z
    ld a, l
    sub e
    ld l, a
    ld a, h
    sbc a, 0
    ld h, a
    jp nc, .pdhb_store_health
    ld hl, 0
.pdhb_store_health:
    ld a, l
    ld (boss_health_lo), a
    ld a, h
    ld (boss_health_hi), a

.pdhb_after_damage:
    ld a, 12
    ld (boss_hit_cooldown), a
    ld a, (boss_health_lo)
    ld b, a
    ld a, (boss_health_hi)
    or b
    ret nz
    call restore_active_boss_tiles
    call player_dash_cleanup_dead_boss_attacks
    xor a
    ld (boss_active), a
    ret

; Register Contract:
; input: boss projectile/slam/falling block active flags and sprite slots
; output: active boss attack sprites hidden and boss attack active flags cleared
; clobbers: AF, BC, DE, HL
; preserved: None
player_dash_cleanup_dead_boss_attacks:
    ld a, (boss_projectile_active)
    or a
    jp z, .pdcdba_no_projectile
    ld a, (boss_projectile_sprite_slot)
    call call_hide_sprite_resident
.pdcdba_no_projectile:
    ld a, (boss_slam_rocks_active)
    or a
    jp z, .pdcdba_no_slam
    call boss_slam_rocks_hide_all
.pdcdba_no_slam:
    ld a, (boss_falling_blocks_active)
    or a
    jp z, .pdcdba_clear_flags
    call boss_falling_blocks_hide_all
.pdcdba_clear_flags:
    xor a
    ld (boss_projectile_active), a
    ld (boss_slam_rocks_active), a
    ld (boss_falling_blocks_active), a
    ret

; ------------------------------------------------------------------
; update_player_fastpath
; Dedicated hero update path executed before the generic ECS sweeps.
; Mirrors the critical input->jump->gravity->position chain for the
; current player entity without iterating over every active entity.
; ------------------------------------------------------------------
; Register Contract:
;   Purpose: Run the critical per-frame player update without ECS list iteration.
;   Inputs:
;     - task_update_input already refreshed input_state/input_btn_*
;   Outputs:
;     - Hero input/jump/gravity/position resolved into entity tables and player_* mirror
;   Clobbers:
;     - AF
;     - BC
;     - DE
;     - HL
;   Preserved:
;     - None
;   Notes:
;     - Global collision/wall/sprite systems still run later in the frame and may refine the final result.

update_player_fastpath:
    call ensure_player_fast_runtime_bound
    ld a, (player_runtime_enabled)
    or a
    ret z
    ld a, (player_entity_index)
    cp #FF
    ret z
    ld c, a

    ; Require Input component to treat this entity as the player fast-path target.
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_INPUT
    jp z, .player_fast_sync

    ; --------------------------------------------------------------
    ; INPUT
    ; --------------------------------------------------------------
    ld e, c
    ld d, 0
    call update_entity_ladder_state_c
    ld e, c
    ld d, 0
    ld hl, entity_input_disabled
    add hl, de
    ld a, (hl)
    or a
    jp z, .player_fast_input_enabled

    ld hl, entity_vel_x
    add hl, de
    ld (hl), 0
    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0
    jp .player_fast_after_input

.player_fast_input_enabled:
    call aircontrol_should_lock_horizontal_c
    jp nz, .player_fast_after_input

    ld e, c
    ld d, 0
    ld hl, entity_dir_mask
    add hl, de
    ld b, (hl)                    ; B = direction mask

    ld hl, entity_input_speed
    add hl, de
    ld a, (hl)
    or a
    jr nz, .player_fast_speed_ok
    ld a, 1
.player_fast_speed_ok:
    ld h, a                       ; H = cardinal speed
    srl a
    jr nz, .player_fast_diag_speed_ok
    ld a, 1
.player_fast_diag_speed_ok:
    ld l, a                       ; L = diagonal speed

    ld a, (input_state)
    ld d, 0                       ; D = vel_x
    ld e, 0                       ; E = vel_y
    cp STICK_UP
    jp z, .player_fast_input_up
    cp STICK_DOWN
    jp z, .player_fast_input_down
    cp STICK_LEFT
    jp z, .player_fast_input_left
    cp STICK_RIGHT
    jp z, .player_fast_input_right
    cp STICK_UPRIGHT
    jp z, .player_fast_input_upright
    cp STICK_UPLEFT
    jp z, .player_fast_input_upleft
    cp STICK_DOWNRIGHT
    jp z, .player_fast_input_downright
    cp STICK_DOWNLEFT
    jp z, .player_fast_input_downleft
    jp .player_fast_apply_velocity

.player_fast_input_up:
    ld a, b
    and DIR_ALLOW_UP
    jp z, .player_fast_apply_velocity
    ld a, h
    neg
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_input_down:
    ld a, b
    and DIR_ALLOW_DOWN
    jp z, .player_fast_apply_velocity
    ld a, h
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_input_left:
    ld a, b
    and DIR_ALLOW_LEFT
    jp z, .player_fast_apply_velocity
    ld a, h
    neg
    ld d, a
    jp .player_fast_apply_velocity

.player_fast_input_right:
    ld a, b
    and DIR_ALLOW_RIGHT
    jp z, .player_fast_apply_velocity
    ld a, h
    ld d, a
    jp .player_fast_apply_velocity

.player_fast_input_upright:
    ld a, b
    and DIR_ALLOW_UP
    jp z, .player_fast_check_right_only
    ld a, b
    and DIR_ALLOW_RIGHT
    jp z, .player_fast_check_up_only
    ld a, l
    ld d, a
    neg
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_check_right_only:
    ld a, b
    and DIR_ALLOW_RIGHT
    jp z, .player_fast_apply_velocity
    ld a, h
    ld d, a
    jp .player_fast_apply_velocity

.player_fast_check_up_only:
    ld a, h
    neg
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_input_upleft:
    ld a, b
    and DIR_ALLOW_UP
    jp z, .player_fast_check_left_only_1
    ld a, b
    and DIR_ALLOW_LEFT
    jp z, .player_fast_check_up_only_1
    ld a, l
    neg
    ld d, a
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_check_left_only_1:
    ld a, b
    and DIR_ALLOW_LEFT
    jp z, .player_fast_apply_velocity
    ld a, h
    neg
    ld d, a
    jp .player_fast_apply_velocity

.player_fast_check_up_only_1:
    ld a, h
    neg
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_input_downright:
    ld a, b
    and DIR_ALLOW_DOWN
    jp z, .player_fast_check_right_only_2
    ld a, b
    and DIR_ALLOW_RIGHT
    jp z, .player_fast_check_down_only_2
    ld a, l
    ld d, a
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_check_right_only_2:
    ld a, b
    and DIR_ALLOW_RIGHT
    jp z, .player_fast_apply_velocity
    ld a, h
    ld d, a
    jp .player_fast_apply_velocity

.player_fast_check_down_only_2:
    ld a, h
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_input_downleft:
    ld a, b
    and DIR_ALLOW_DOWN
    jp z, .player_fast_check_left_only_3
    ld a, b
    and DIR_ALLOW_LEFT
    jp z, .player_fast_check_down_only_3
    ld a, l
    neg
    ld d, a
    neg
    ld e, a
    jp .player_fast_apply_velocity

.player_fast_check_left_only_3:
    ld a, b
    and DIR_ALLOW_LEFT
    jp z, .player_fast_apply_velocity
    ld a, h
    neg
    ld d, a
    jp .player_fast_apply_velocity

.player_fast_check_down_only_3:
    ld a, h
    ld e, a

.player_fast_apply_velocity:
    push de
    ld hl, entity_vel_x
    ld e, c
    ld d, 0
    add hl, de
    pop de
    ld (hl), d

    push de
    ld hl, entity_vel_y
    ld e, c
    ld d, 0
    add hl, de
    pop de
    ld (hl), e

    ; Update entity_facing_dir based on input_state.
    ; Match the generic input system so Player fast-path preserves the
    ; same directional semantics used by ChangeSprite and sprite variants.
    push af
    ld a, (input_state)
    or a
    jr z, .player_fast_facing_done
    cp 2
    jr c, .player_fast_facing_up
    cp 5
    jr c, .player_fast_facing_right
    jr z, .player_fast_facing_down
    ld a, 1                     ; FACING_LEFT
    jr .player_fast_facing_write
.player_fast_facing_right:
    ld a, 2                     ; FACING_RIGHT
    jr .player_fast_facing_write
.player_fast_facing_up:
    ld a, 3                     ; FACING_UP
    jr .player_fast_facing_write
.player_fast_facing_down:
    ld a, 4                     ; FACING_DOWN
.player_fast_facing_write:
    push hl
    push de
    ld e, c
    ld d, 0
    ld hl, entity_facing_dir
    add hl, de
    ld (hl), a
    pop de
    pop hl
.player_fast_facing_done:
    pop af

    ; Sync directional sprite facing for input-driven entities.
    ; Keep the same rule as the generic input system: skip only when
    ; the assigned State Machine explicitly uses ChangeSprite.
    push af
    push de
    ld e, c
    ld d, 0
    ld hl, entity_sm_sprite_control
    add hl, de
    ld a, (hl)
    pop de
    pop af
    jr nz, .player_fast_skip_patrol_facing
    push de
    ld e, c
    ld d, 0
    call update_entity_patrol_facing
    pop de
.player_fast_skip_patrol_facing:

.player_fast_after_input:
    push bc
    call player_fast_dash_process_c
    pop bc
    or a
    jp nz, .player_fast_after_walljump

    ; --------------------------------------------------------------
    ; WALL JUMP PRIORITY
    ; --------------------------------------------------------------
    ; A wall jump must win over the regular Jump component. Otherwise the
    ; same SPACE edge can be partially handled as a normal air jump first,
    ; making the wall rebound feel weak or inconsistent.
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    and #40                       ; COMP_MASK_WALL_JUMP (#4000) => high byte bit 6
    jp z, .player_fast_walljump_priority_done
    push bc
    call walljump_process_entity_c
    pop bc
    ld e, c
    ld d, 0
    ld hl, entity_walljump_locked_vx
    add hl, de
    ld a, (hl)
    or a
    jp nz, .player_fast_after_jump
.player_fast_walljump_priority_done:

    ; --------------------------------------------------------------
    ; JUMP
    ; --------------------------------------------------------------
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    and #01
    jp z, .player_fast_after_jump

    ld hl, entity_on_ground
    add hl, de
    bit 0, (hl)
    jr z, .player_fast_jump_check

    ld hl, entity_jump_count
    add hl, de
    ld (hl), 0
    ld hl, entity_jump_bonus
    add hl, de
    ld (hl), 0

.player_fast_jump_check:
    ld hl, entity_on_ladder
    add hl, de
    ld a, (hl)
    or a
    jp nz, .player_fast_after_jump

    ld a, (input_btn_curr)
    and INPUT_BTN_FIRE
    jp z, .player_fast_after_jump
    ld a, (input_btn_prev)
    and INPUT_BTN_FIRE
    jp nz, .player_fast_after_jump

    ld hl, entity_jump_max
    add hl, de
    ld b, (hl)
    ld hl, entity_jump_bonus
    add hl, de
    ld a, (hl)
    add a, b
    ld b, a

    ld hl, entity_jump_count
    add hl, de
    ld a, (hl)
    cp b
    jr c, .player_fast_do_jump

    ld hl, entity_on_ground
    add hl, de
    bit 0, (hl)
    jp z, .player_fast_after_jump

.player_fast_do_jump:
    ld hl, entity_on_ground
    add hl, de
    bit 0, (hl)
    jr nz, .player_fast_skip_bonus_consume

    ld hl, entity_jump_count
    add hl, de
    ld a, (hl)
    ld hl, entity_jump_max
    add hl, de
    cp (hl)
    jr c, .player_fast_skip_bonus_consume

    ld hl, entity_jump_bonus
    add hl, de
    ld a, (hl)
    or a
    jr z, .player_fast_skip_bonus_consume
    dec (hl)

.player_fast_skip_bonus_consume:
    ld hl, entity_jump_count
    add hl, de
    inc (hl)

    ld hl, entity_on_ground
    add hl, de
    res 0, (hl)

    ld hl, entity_platform_id
    add hl, de
    ld (hl), 255

    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    and #02
    jp z, .player_fast_after_jump

    ld hl, entity_gravity_vel
    add hl, de
    add hl, de
    ld (hl), #00
    inc hl
    ld (hl), #FC

.player_fast_after_jump:
    ; --------------------------------------------------------------
    ; GRAVITY
    ; --------------------------------------------------------------
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    and #02
    jp z, .player_fast_after_gravity

    ld hl, entity_on_ground
    add hl, de
    ld a, (hl)
    bit 0, a
    jr nz, .player_fast_gravity_grounded

    ld hl, entity_on_ladder
    add hl, de
    ld a, (hl)
    or a
    jr z, .player_fast_apply_gravity
    jr .player_fast_gravity_grounded

.player_fast_apply_gravity:
    ld hl, entity_gravity_vel
    add hl, de
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)

    ld a, e
    add a, #40
    ld e, a
    ld a, d
    adc a, #00
    ld d, a

    ld a, d
    bit 7, a
    jr nz, .player_fast_store_gravity
    cp #04
    jr c, .player_fast_store_gravity
    ld de, #0400

.player_fast_store_gravity:
    dec hl
    ld (hl), e
    inc hl
    ld (hl), d

    push de
    ld hl, entity_vel_y
    ld e, c
    ld d, 0
    add hl, de
    pop de
    ld (hl), d
    jr .player_fast_after_gravity

.player_fast_gravity_grounded:
    ld hl, entity_gravity_vel
    add hl, de
    add hl, de
    ld (hl), 0
    inc hl
    ld (hl), 0

.player_fast_after_gravity:
    ; --------------------------------------------------------------
    ; WALL GRAB
    ; --------------------------------------------------------------
    push bc
    call wallgrab_process_entity_c
    pop bc

    ; --------------------------------------------------------------
    ; WALL JUMP / WALL SLIDE
    ; --------------------------------------------------------------
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks_hi
    add hl, de
    ld a, (hl)
    and #40                       ; COMP_MASK_WALL_JUMP (#4000) => high byte bit 6
    jp z, .player_fast_after_walljump
    push bc
    call walljump_process_entity_c
    pop bc
.player_fast_after_walljump:
    ; --------------------------------------------------------------
    ; POSITION
    ; --------------------------------------------------------------
    ld e, c
    ld d, 0
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    ld b, a
    and COMP_MASK_POSITION
    jp z, .player_fast_sync

    ld a, b
    and COMP_MASK_MOVEMENT | COMP_MASK_INPUT
    jp z, .player_fast_sync

    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    add a, b
    ld (hl), a

    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)
    bit 7, a
    jr z, .player_fast_vy_positive
    cp #F0
    jr nc, .player_fast_vy_ready
    ld a, #F0
    jr .player_fast_vy_ready
.player_fast_vy_positive:
    cp #11
    jr c, .player_fast_vy_ready
    ld a, #10
.player_fast_vy_ready:
    ld b, a
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    add a, b
    ld (hl), a

.player_fast_sync:
    call sync_player_runtime_from_entity
    ret

; ==================================================================
; EXECUTE ALL STATE MACHINES - Called by GameFlow
; ==================================================================
; This function executes the state machine for each entity that has one
execute_all_state_machines:
    ld a, (active_entity_count)
    or a
    ret z
    ld b, a                       ; Loop through used entities only
    ld hl, active_entity_list
    
.sm_loop:
    ld a, (hl)                    ; A = entity index
    inc hl                        ; Advance list pointer
    push hl                       ; Save list pointer
    ld c, a
    ld a, (player_runtime_enabled)
    or a
    jr z, .sm_entity_ready
    ld a, (player_entity_index)
    cp c
    jr z, .skip_entity
.sm_entity_ready:
    ld a, c

    ; active_entity_list already guarantees active + current_screen_id
    ld e, a                       ; DE = entity index
    ld d, 0

    ; Check if this entity has a state machine assigned
    ld hl, entity_sm_ptr_l
    add hl, de
    ld c, (hl)                    ; C = SM ptr low
    
    ld hl, entity_sm_ptr_h
    add hl, de
    ld a, (hl)                    ; A = SM ptr high
    
    ; Check if SM pointer is non-zero
    or c
    jr z, .skip_entity            ; No SM assigned, skip

    ; Entity has a state machine - execute it
    ld a, e
    push bc                       ; Preserve loop counter (B) across call
    call SM_Update                ; Execute state machine (A = entity index)
    pop bc
    
.skip_entity:
    pop hl                        ; Restore list pointer
    djnz .sm_loop                 ; Loop for all used entities
    
    ret

refresh_player_state_machine_fastpath:
    ld a, (player_runtime_enabled)
    or a
    ret z
    ld a, (player_entity_index)
    cp #FF
    ret z

    ld e, a
    ld d, 0
    ld hl, entity_sm_ptr_l
    add hl, de
    ld c, (hl)
    ld hl, entity_sm_ptr_h
    add hl, de
    ld a, (hl)
    or c
    ret z

    ld a, e
    call SM_Update
    ret


; ==================================================================
; TILE COLLISION SYSTEM
; ==================================================================
; Legacy compatibility labels. Current WallCollision and TileInteraction
; use get_behavior_tile directly, so keep this path compact in resident ROM.
; ==================================================================

get_tile_at_position:
    ; Deprecated: callers should use get_behavior_tile with B=row/C=column.
    xor a
    ret

get_tile_behavior:
    ; Deprecated ID-based lookup. Preserve label, return passable.
    xor a
    ret

tile_behavior_table:
    db TILE_PASSABLE

check_collision_at_point:
    ; Deprecated legacy helper. WallCollision uses behavior maps directly.
    xor a
    ret

; ------------------------------------------------------------------
; check_collision_box
; Check collision for entity bounding box (16x16)
; Input:  D = X position (top-left), E = Y position (top-left)
; Output: Z flag set if no collision, cleared if collision detected
;         A = Behavior flags of colliding tile
; Destroys: BC, HL
; ------------------------------------------------------------------
check_collision_box:
    ; Deprecated legacy helper. WallCollision uses behavior maps directly.
    xor a                         ; passable/no collision
    ret

; ------------------------------------------------------------------
; div_a_by_c
; Divide A by C (unsigned 8-bit division)
; Input:  A = dividend, C = divisor
; Output: A = quotient
; Destroys: B
; ------------------------------------------------------------------
div_a_by_c:
    xor a
    ret


; ------------------------------------------------------------------
; resolve_runtime_hero_entity
; Preferred order:
;   1) hero_entity_id if valid
;   2) first input entity of current screen
;   3) entity 0 if still active (legacy compatibility)
; Output: A = entity index, or #FF when unavailable
; Clobbers: AF, HL
; ------------------------------------------------------------------
resolve_runtime_hero_entity:
    ld a, (hero_entity_id)
    cp #FF
    ret nz
    ld a, (input_entity_count)
    or a
    jr z, .resolve_legacy_entity0
    ld hl, input_entity_list
    ld a, (hl)
    ld (hero_entity_id), a
    ret

.resolve_legacy_entity0:
    ld a, (entity_active)
    or a
    jr z, .resolve_none
    xor a
    ld (hero_entity_id), a
    ret

.resolve_none:
    ld a, #FF
    ret


update_secret_zone_component:
    ret


    ; ==================================================================
; END OF COMPONENT SYSTEMS
    ; ==================================================================
        

; --- End of Bank 1 — pad to 8KB boundary ---
    ds #8000 - $, #FF

; ##################################################################
; BANK 2 — [#8000h-#A000h] PRIMARY: statemachine
; (Always mapped at boot: bank1→P1, bank2→P2, bank3→P3)
; ##################################################################
    org #8000


    ; ------------------------------------------------------------------
    ; SM_Update
    ; Main State Machine Update Routine
    ; Input: A = Entity Index
    ; ------------------------------------------------------------------
SM_Update:
    ld hl, prof_sm_update_calls
    inc (hl)
    jr nz, .sm_prof_counted
    inc hl
    inc (hl)
.sm_prof_counted:
    push af
    push bc
    push de
    push hl
    
    ld c, a             ; C = Entity Index
    ld b, 0             ; BC = Entity Index
    
    ; 0. Check Wait Timer
    ld hl, entity_sm_wait_timer
    add hl, bc
    ld a, (hl)
    or a
    jr z, .sm_update_continue

    ; Timer Active, Decrement
    dec a
    ld (hl), a
    jp sm_update_done   ; Skip update

.sm_update_continue:
    ; BC is still Entity Index.
    
    ; 1. Increment Timer
    ld hl, entity_sm_timer_l
    add hl, bc
    inc (hl)
    jr nz, sm_timer_no_overflow
    
    ld hl, entity_sm_timer_h
    add hl, bc
    inc (hl)
sm_timer_no_overflow:

    ; 2. Get Current State Pointer
    ld hl, entity_sm_ptr_l
    add hl, bc
    ld e, (hl)          ; E = Ptr Low
    
    ld hl, entity_sm_ptr_h
    add hl, bc
    ld d, (hl)          ; D = Ptr High

    ; Check if pointer is null(0)
    ld a, d
    or e
    jp z, sm_update_done

    ; DE points to State Data:
    ; [0] = ID(Debug / Unused)
    ; [1-2] = OnEnter Actions Ptr
    ; [3-4] = OnExit Actions Ptr
    ; [5-6] = Transitions List Ptr
    
    ex de, hl           ; HL = State Data Ptr

    ; 3. Check Transitions
    ld de, 5
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ; DE = Transitions List Ptr
    ld a, c             ; A = Entity Index (kept in C)
    
    call SM_CheckTransitions

    ; If Carry set, transition happened, stop update
    jp c, sm_update_done

    ; 4. Execute OnUpdate Actions (Optional)

sm_update_done:
    pop hl
    pop de
    pop bc
    pop af
    ret

    ; ------------------------------------------------------------------
; SM_CheckTransitions
    ; Checks all transitions for the current state
; Input: DE = Pointer to Transitions List
    ; A = Entity Index
    ; Output: Carry Set if transition occurred
        ; ------------------------------------------------------------------
            SM_CheckTransitions:
    ld b, a; Save Entity Index in B
    
    ld a, d
    or e
    ret z; Null pointer, no transitions
    
    ex de, hl; HL = Transitions List

    ; Read Count
    ld c, (hl); C = Count
    inc hl

    ; If count is 0, return
    ld a, c
    or a
    ret z

    ; B = Entity Index
    ; C = Count
    ; HL = Transitions List Ptr

SM_CheckTransitions_Loop:
    push bc; Save Loop Counter(C) and Entity Index(B)

    ; Structure of Transition Entry:
;[0] = Condition Type
    ;[1...] = Params(Variable length)
    ;[Next] = Target State Ptr(Low)
    ;[Next + 1] = Target State Ptr(High)
    ;[Next + 2] = Actions Ptr(Low)
    ;[Next + 3] = Actions Ptr(High)
    
    ld a, b; A = Entity Index
    call SM_EvaluateCondition
    ; HL now points to Target State Ptr(or next param if we were parsing)
; Result in A(1 = True, 0 = False)
    
    or a
    jr nz, SM_TransitionTriggered

    ; Condition False: Skip Transition Tail and continue to next transition
    ; Transition tail layout after condition payload:
    ;   [0-1] Target State Ptr
    ;   [2-3] Actions Ptr
    ld de, 4
    add hl, de
    
    pop bc; Restore counters
    dec c; Decrement loop counter
    jr nz, SM_CheckTransitions_Loop
    
    or a            ; Clear carry(no transition)
    ret

SM_TransitionTriggered:
    pop bc; Restore counters(B = Entity Index)

    ; HL points to Target State Ptr
    ld e, (hl)
    inc hl
    ld d, (hl)
    ; DE = Target State Address
    inc hl
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ; HL = Actions Ptr (0 if none)

    ; Execute transition actions if present
    ld a, h
    or l
    jr z, .skip_transition_actions
    push de            ; Save target state
    ld a, b            ; Entity Index
    ex de, hl          ; DE = Actions Ptr
    call SM_ExecuteActions
    ex de, hl          ; HL = Actions Ptr (unused)
    pop de             ; Restore target state

.skip_transition_actions:

    ; Special case: Target State = 0 -> don't change state (Any->Any)
    ld a, d
    or e
    jr z, .no_state_change

    ; Perform State Change
    ld a, b; A = Entity Index
    call SM_ChangeState

    scf             ; Set carry(transition occurred)
    ret

.no_state_change:
    scf             ; Transition occurred (actions already executed)
    ret

    ; ------------------------------------------------------------------
; SM_ChangeState
    ; Changes the entity's state to DE
    ; Input: DE = New State Address
    ; A = Entity Index
    ; ------------------------------------------------------------------
        SM_ChangeState:
    push de; Save New State
    push af; Save Entity Index

    ; 1. Execute OnExit of Old State
    ; Get Old State Ptr
    ld c, a
    ld b, 0
    ld hl, entity_sm_ptr_l
    add hl, bc
    ld e, (hl)
    ld hl, entity_sm_ptr_h
    add hl, bc
    ld d, (hl)
    ; DE = Old State Ptr
    
    ex de, hl; HL = Old State Ptr
    ld bc, 3
    add hl, bc
    ld e, (hl)
    inc hl
    ld d, (hl)
    ; DE = OnExit Actions Ptr
    
    pop af; Restore Entity Index
    push af; Keep it saved
    
    call SM_ExecuteActions

    ; 2. Set New State
    pop af; Restore Entity Index
    pop de; Restore New State
    
    push af; Save Entity Index again
    push de; Save New State again
    
    ld c, a
    ld b, 0
    
    ld hl, entity_sm_ptr_l
    add hl, bc
    ld (hl), e
    
    ld hl, entity_sm_ptr_h
    add hl, bc
    ld (hl), d

    ; 3. Reset Timer
    ld hl, entity_sm_timer_l
    add hl, bc
    ld (hl), 0
    
    ld hl, entity_sm_timer_h
    add hl, bc
    ld (hl), 0

    ; 4. Execute OnEnter of New State
    pop hl; HL = New State Base
    pop af; A = Entity Index
    
    push hl; Save New State Base(needed ?) No.
    
    inc hl; Skip ID
    ld e, (hl)
    inc hl
    ld d, (hl)
    ; DE = OnEnter Actions Ptr
    
    pop hl; Clean stack(wait, I pushed HL above)
    
    call SM_ExecuteActions

    ret

    ; ------------------------------------------------------------------
; SM_ExecuteActions
    ; Executes a list of actions
    ; Input: DE = Pointer to Action List
    ; A = Entity Index
    ; ------------------------------------------------------------------
        SM_ExecuteActions:
    ld c, a         ; Save entity index before null check overwrites A
    ld a, d
    or e
    ret z           ; Null pointer

    ex de, hl       ; HL = Action List

    ld b, c         ; B = Entity Index (restored from C)

SM_ExecuteActions_Loop:
    ld a, (hl); Get Action ID
    inc hl
    
    cp 0xFF; END
    ret z
    
    push hl; Save Action List Ptr
    push bc; Save Entity Index

    ; Dispatch Action
    ; Input: A = Action ID
    ; HL = Params Ptr
    ; B = Entity Index

    ; We need to pass Entity Index in A to Dispatch ?
    ; Or B ?
    ; Let's use A for Action ID.
    ; Let's use B for Entity Index.
    
    ld c, a; C = Action ID
    ld a, b; A = Entity Index(swap for dispatch if needed)
    ; Actually, let's keep Entity Index in B.
    ld a, c; A = Action ID
    
    call SM_Dispatch
    ; Output: HL = Updated Params Ptr

    ; Restore Entity Index
    pop bc; B = Entity Index

    ; Restore Action List Ptr ?
    ; No, HL was updated by Dispatch to point to next action.
    ; So we discard the old HL.
    pop de; Pop old HL into DE(discard)
    
    jp SM_ExecuteActions_Loop

    ; ------------------------------------------------------------------
; SM_EvaluateCondition
    ; Evaluates a condition at HL
    ; Input: HL = Pointer to Condition Data
    ; A = Entity Index
    ; Output: A = 1(True), 0(False)
        ; HL = Updated Pointer(after params)
    ; ------------------------------------------------------------------
        SM_EvaluateCondition:
    ld b, a             ; B = Entity Index
    ld a, (hl)          ; Get Condition ID
    inc hl

    ; Dispatch to condition handler
    push hl             ; Save Params Ptr
    
    ; Calculate Table Address
    ld l, a
    ld h, 0
    add hl, hl          ; * 2 (word addresses)
    ld de, SM_ConditionTable
    add hl, de
    
    ; Get Handler Address
    ld e, (hl)
    inc hl
    ld d, (hl)
    ; DE = Handler Address
    
    ; Restore Params Ptr to HL
    pop hl
    
    ; Jump to Handler (B = Entity Index, HL = Params)
    push de
    ret
    

    ; ------------------------------------------------------------------
; SM_Dispatch
    ; Dispatches to the handler for Action A
    ; Input: A = Action ID
    ; HL = Pointer to Params
    ; B = Entity Index
    ; Output: HL = Updated Pointer(after params)
    ; ------------------------------------------------------------------
        SM_Dispatch:
; 1. Save Params Ptr
    push hl

    ; 2. Calculate Table Address
    ld l, a
    ld h, 0
    add hl, hl
    ld de, SM_ActionTable
    add hl, de

    ; 3. Get Handler Address
    ld e, (hl)
    inc hl
    ld d, (hl)
    ; DE = Handler Address

    ; 4. Restore Params Ptr to HL
    pop hl

    ; 5. Jump to Handler
    push de
    ret

SM_ActionTable:
    DW Action_Nop; 0
    DW Action_Nop ; 1 [Action_SetPosition stripped]
    DW Action_Nop ; 2 [Action_MoveBy stripped]
    DW Action_Nop ; 3 [Action_SetVelocity stripped]
    DW Action_Nop ; 4 [Action_ApplyForce stripped]
    DW Action_ChangeSprite; 5
    DW Action_Nop ; 6 [Action_PlayAnimation stripped]
    DW Action_Nop ; 7 [Action_SetAnimSpeed stripped]
    DW Action_Nop ; 8 [Action_ToggleAnim stripped]
    DW Action_PlaySound; 9
    DW Action_Nop ; 10 [Action_PlayMusic stripped]
    DW Action_Nop ; 11 [Action_MuteMusic stripped]
    DW Action_Nop ; 12 [Action_StopMusic stripped]
    DW Action_Nop ; 13 [Action_SetVariable stripped]
    DW Action_Nop ; 14 [Action_IncVariable stripped]
    DW Action_Nop ; 15 [Action_DecVariable stripped]
    DW Action_Nop ; 16 [Action_SetCompProp stripped]
    DW Action_Nop ; 17 [Action_Wait stripped]
    DW Action_Nop ; 18 [Action_GotoState stripped]
    DW Action_Nop ; 19 [Action_DestroyEntity stripped]
    DW Action_Nop ; 20 [Action_SpawnEntity stripped]
    DW Action_Nop ; 21 [Action_GetRandomPos stripped]
    DW Action_Nop ; 22 [Action_ChangeGameFlow stripped]
    DW Action_Nop ; 23 [Action_RegenerateHud stripped]
    DW Action_Nop ; 24 [Action_DecLives stripped]
    DW Action_Nop ; 25 [Action_IncLives stripped]
    DW Action_Nop ; 26 [Action_Respawn stripped]
    DW Action_Nop ; 27 [Action_BreakTile stripped]
    DW Action_Nop ; 28 [Action_ReplaceTile stripped]
    DW Action_Nop ; 29 [Action_Rnd stripped]
    DW Action_Nop ; 30 [Action_PointAt stripped]
    DW Action_Nop ; 31 [Action_AddVars stripped]
    DW Action_Nop ; 32 [Action_SubVars stripped]
    DW Action_Nop ; 33 [Action_MulVars stripped]
    DW Action_Nop ; 34 [Action_DivVars stripped]
    DW Action_Nop ; 35 [Action_ModVars stripped]
    DW Action_Nop ; 36 [Action_AssignVar stripped]
    DW Action_Nop ; 37 [Action_DisableInput stripped]
    DW Action_Nop ; 38 [Action_EnableInput stripped]
    DW Action_Nop ; 39 [Action_CleanSprites stripped]
    DW Action_Nop ; 40 [Action_ExitCurrentWorld stripped]
    DW Action_Nop ; 41 [Action_ReplaceTileAt stripped]
    DW Action_Nop ; 42 [Action_MoveTileArea stripped]
    DW Action_Nop ; 43 [Action_ShiftTileArea stripped]

    ; ------------------------------------------------------------------
; ACTION HANDLERS IMPLEMENTATION
    ; ------------------------------------------------------------------

Action_Nop:
    ret

; [Action_SetPosition stripped - not used]

; [Action_MoveBy stripped - not used]

; [Action_SetVelocity stripped - not used]

; [Action_ApplyForce stripped - not used]

SM_FacingDirTablePtrs:
    DW sprite_dir_left_table    ; facing 1 (LEFT)  → dec → 0
    DW sprite_dir_right_table   ; facing 2 (RIGHT) → dec → 1
    DW sprite_dir_up_table      ; facing 3 (UP)    → dec → 2
    DW sprite_dir_down_table    ; facing 4 (DOWN)  → dec → 3

; ==================================================================
; Action_ChangeSprite
; ------------------------------------------------------------------
; Cambia el sprite activo de una entidad. Realiza 6 operaciones:
;   1. Redirect direccional: si entity_facing_dir != 0, sustituye el
;      sprite pedido por su variante direccional (left/right/up/down)
;      usando SM_FacingDirTablePtrs.
;   2. Commit: escribe el sprite final en entity_sprite_asset_index.
;   3. Reset de animación: pone entity_anim_frame y entity_anim_tick a 0.
;   4. Flags de animación: activa PLAYING, aplica el flag de LOOP del
;      sprite, borra ONLY_WHEN_MOVING y marca FORCE_UPLOAD para que el
;      próximo update_animation_component sincronice el frame actual
;      fuera del path de cambio de sprite.
;   5. Colores de capas: actualiza sprite_layer_colors (tabla RAM) con
;      los colores del nuevo sprite desde SM_SpriteLayerColorTable.
;   6. Offsets Y de capas: actualiza sprite_layer_y_offsets con
;      SM_SpriteLayerYOffsetTable.
;
; Input:
;   HL  = puntero al parámetro (sprite asset ID, 1 byte)
;   B   = entity index (convención SM_ExecuteActions)
;
; Output:
;   HL  = puntero al byte siguiente a los parámetros (para el caller)
;
; Destruye: AF, BC, DE, HL (todos restaurados al salir salvo HL=next param)
;
; Stack al entrar (top → bottom):
;   [llamada desde SM_ExecuteActions]
; Stack al salir: igual que al entrar.
;
; Tablas ROM usadas:
;   SM_FacingDirTablePtrs      — punteros a las 4 tablas de redirect
;   sprite_loop_flags          — 1 byte/sprite: 0x02=loop, 0x00=one-shot
;   SM_SpritePatternPtrTable   — puntero al frame 0 de cada sprite
;   SM_SpriteLayerColorTable   — colores por sprite (SPRITE_MAX_ENTITY_LAYERS bytes/sprite)
;   SM_SpriteLayerYOffsetTable — offsets Y por sprite (SPRITE_MAX_ENTITY_LAYERS bytes/sprite)
;
; Variables RAM usadas:
;   entity_facing_dir          — dirección actual de la entidad (0-4)
;   entity_sprite_asset_index  — índice del sprite activo de la entidad
;   entity_anim_frame          — frame actual de la animación
;   entity_anim_tick           — contador de ticks entre frames
;   entity_anim_flags          — flags de animación (ver bits más abajo)
;   entity_sprite_config       — base HW sprite + layer count (2 bytes/entidad)
;   sprite_layer_colors        — colores actuales por slot HW sprite (RAM)
;   sprite_layer_y_offsets     — offsets Y actuales por slot HW sprite (RAM)
;
; Bits de entity_anim_flags:
;   bit 0 = ANIM_FLAG_PLAYING       (1 = animando)
;   bit 1 = ANIM_FLAG_LOOP          (1 = bucle infinito, 0 = one-shot)
;   bit 2 = ANIM_FLAG_ONLY_WHEN_MOVING (1 = solo anima si vel != 0)
;   bit 3 = ANIM_FLAG_COMPLETED     (1 = one-shot llegó al último frame)
;   bit 4 = ANIM_FLAG_FORCE_UPLOAD  (1 = sincronizar frame actual en el próximo update_animation_component)
;
; NOTA: el bloque de redirect direccional usa B como registro temporal
; para guardar el sprite ID. Al salir del bloque, B queda corrupto.
; Se restaura explícitamente con "ld b, 0" antes de los add hl, bc.
; ==================================================================
Action_ChangeSprite:
    ld a, (hl)              ; A = Sprite Asset ID pedido por la SM
    inc hl                  ; HL apunta al byte siguiente al parámetro
    push hl                 ; [stack] guarda puntero de parámetros para el ret final

    push af                 ; [stack] guarda Sprite Asset ID (se necesita tras setup)

    ; ------------------------------------------------------------------
    ; Setup: convertir B (entity index) a BC = (0, entity_index)
    ; Convención de SM_ExecuteActions: B = entity index al entrar.
    ; ------------------------------------------------------------------
    ld c, b                 ; C = entity index
    ld b, 0                 ; B = 0  →  BC = (0, entity_index)

    ; Pre-calcular HL = &entity_sprite_asset_index[entity]
    ; Se usará tras el bloque de redirect para escribir el sprite final.
    ld hl, entity_sprite_asset_index
    add hl, bc              ; HL = &entity_sprite_asset_index[entity]

    pop af                  ; A = Sprite Asset ID (recuperado del stack)
    push hl                 ; [stack] guarda &entity_sprite_asset_index[entity]
    push af                 ; [stack] guarda Sprite Asset ID durante refresh facing

    ; ------------------------------------------------------------------
    ; BLOQUE 1: Redirect direccional
    ; Si entity_facing_dir[entity] != 0, reemplaza el sprite pedido por
    ; su variante para la dirección actual.
    ;   facing 0 = sin dirección → usar sprite tal cual
    ;   facing 1 = izquierda  → SM_FacingDirTablePtrs[0] → sprite_dir_left_table
    ;   facing 2 = derecha     → SM_FacingDirTablePtrs[1] → sprite_dir_right_table
    ;   facing 3 = arriba      → SM_FacingDirTablePtrs[2] → sprite_dir_up_table
    ;   facing 4 = abajo       → SM_FacingDirTablePtrs[3] → sprite_dir_down_table
    ;
    ; Las tablas de dirección son arrays de 1 byte por sprite asset:
    ;   dir_table[originalSprite] = spriteVariante
    ; Si no existe variante, la tabla devuelve el mismo ID original.
    ;
    ; IMPORTANTE: este bloque usa B como temporal para guardar el sprite ID.
    ; Al salir, B queda con el sprite ID (no con 0). Se corrige después.
    ; ------------------------------------------------------------------
    ; StateMachine runs before the Cursors/Input movement systems in the
    ; frame update. For input-driven entities, refresh facing from the
    ; current input_state now so KEY_PRESSED -> CHANGE_SPRITE resolves the
    ; left/right mirror on the same frame as the transition.
    ld hl, entity_comp_masks
    add hl, bc
    ld a, (hl)
    and COMP_MASK_INPUT
    jr z, .acs_input_facing_done
    ld a, (input_state)
    or a
    jr z, .acs_input_facing_done
    cp 2
    jr c, .acs_input_facing_up
    cp 5
    jr c, .acs_input_facing_right
    jr z, .acs_input_facing_down
    ld a, 1                     ; FACING_LEFT
    jr .acs_input_facing_write
.acs_input_facing_right:
    ld a, 2                     ; FACING_RIGHT
    jr .acs_input_facing_write
.acs_input_facing_up:
    ld a, 3                     ; FACING_UP
    jr .acs_input_facing_write
.acs_input_facing_down:
    ld a, 4                     ; FACING_DOWN
.acs_input_facing_write:
    ld hl, entity_facing_dir
    add hl, bc
    ld (hl), a
.acs_input_facing_done:

    pop af                  ; A = Sprite Asset ID original
    pop hl                  ; HL = &entity_sprite_asset_index[entity]
    push hl                 ; [stack] guarda &entity_sprite_asset_index[entity]

    ld h, 0
    ld l, c                 ; HL = entity index
    ld de, entity_facing_dir
    add hl, de              ; HL = &entity_facing_dir[entity]
    ld e, (hl)              ; E = facing dir (0=none, 1=left, 2=right, 3=up, 4=down)

    ld b, a                 ; B = sprite ID original  [B QUEDA CORRUPTO hasta ld b,0 abajo]
    ld a, e                 ; A = facing dir
    or a
    jr z, .acs_dir_done     ; facing = 0 → no hay redirect, usar sprite original
    cp 5
    jr nc, .acs_dir_done    ; facing inválido → ignorar redirect y usar sprite original

    ; Convertir facing (1-4) a índice de tabla (0-3): dec a
    dec a                   ; A = índice en SM_FacingDirTablePtrs (0=left, 1=right, 2=up, 3=down)
    ld hl, SM_FacingDirTablePtrs
    ld d, 0
    ld e, a
    add hl, de
    add hl, de              ; HL = &SM_FacingDirTablePtrs[facing_index * 2]  (tabla de punteros, DW)
    ld e, (hl)
    inc hl
    ld d, (hl)              ; DE = puntero a la tabla de sprites para esta dirección

    ; Leer el sprite redirigido: dir_table[originalSprite]
    ld l, b                 ; L = sprite ID original
    ld h, 0
    add hl, de              ; HL = &dir_table[originalSprite]
    ld b, (hl)              ; B = sprite ID redirigido (puede ser el mismo si no hay variante)

.acs_dir_done:
    ; A = sprite ID final (original o redirigido)
    ld a, b                 ; A = sprite ID (posiblemente redirigido)
    pop hl                  ; HL = &entity_sprite_asset_index[entity]  [recuperado del stack]

    ; ------------------------------------------------------------------
    ; BLOQUE 2: Commit del sprite y reset de estado de animación
    ; ------------------------------------------------------------------

    ; D guardará el sprite ID para uso posterior (color update, loop flags).
    ; No usar A directamente porque las instrucciones siguientes lo machan.
    ld d, a                 ; D = Sprite Asset ID final (preservado para los bloques 3-5)
    ld (hl), a              ; entity_sprite_asset_index[entity] = sprite ID final

    ; RESTAURAR B=0: el bloque de redirect dejó B=sprite_ID.
    ; Todos los "add hl, bc" siguientes necesitan BC = (0, entity_index).
    ld b, 0                 ; B = 0  →  BC = (0, entity_index)  [BUG FIX: corrupto por redirect]

    ; Reiniciar frame al principio del nuevo sprite
    ld hl, entity_anim_frame
    add hl, bc              ; HL = &entity_anim_frame[entity]
    ld (hl), 0              ; entity_anim_frame[entity] = 0  (empieza desde frame 0)

    ; Reiniciar contador de ticks para que el primer avance de frame
    ; ocurra tras entity_anim_speed ticks completos, no de inmediato.
    ld hl, entity_anim_tick
    add hl, bc              ; HL = &entity_anim_tick[entity]
    ld (hl), 0              ; entity_anim_tick[entity] = 0

    ; ------------------------------------------------------------------
    ; BLOQUE 3: Leer el flag de loop del nuevo sprite
    ; sprite_loop_flags[spriteId] = 0x02 si loop, 0x00 si one-shot
    ; El valor se guarda en E para aplicarlo a entity_anim_flags.
    ; D se restaura al sprite ID tras poner D=0 para el add hl,de.
    ; ------------------------------------------------------------------
    ld hl, sprite_loop_flags
    ld a, d                 ; A = Sprite Asset ID (salvar antes de poner D=0)
    ld e, a                 ; E = Sprite Asset ID
    ld d, 0
    add hl, de              ; HL = &sprite_loop_flags[spriteId]
    ld e, (hl)              ; E = loop flag (0x02=loop, 0x00=one-shot)
    ld d, a                 ; D = Sprite Asset ID  (restaurado para el upload)

    ; ------------------------------------------------------------------
    ; BLOQUE 4: Actualizar entity_anim_flags
    ;
    ; Cambios aplicados:
    ;   - bit 3 (COMPLETED)       → 0  (el one-shot anterior ya no importa)
    ;   - bit 0 (PLAYING)         → 1  (arrancar animación)
    ;   - bit 1 (LOOP)            → según sprite_loop_flags del nuevo sprite
    ;   - bit 2 (ONLY_WHEN_MOVING)→ 0  SIEMPRE, para cualquier sprite
    ;   - bit 4 (FORCE_UPLOAD)    → 1  pedir sincronización del frame actual
    ;                                 en el próximo update_animation_component
    ;
    ; Razón de limpiar ONLY_WHEN_MOVING siempre:
    ;   Cuando el SM llama ChangeSprite, lo hace porque quiere mostrar ese
    ;   sprite ahora. La animación debe avanzar siempre que PLAYING=1,
    ;   sin importar la velocidad. La lógica de "anima solo si se mueve"
    ;   es solo relevante para el sprite inicial de la entidad (config del
    ;   editor). Una vez en la SM, el estado controla qué sprite se muestra.
    ;   Si se dejara ONLY_WHEN_MOVING=1 para sprites loop, la animación walk
    ;   no avanzaría: la fricción del movement component puede dejar vel_x=0
    ;   antes de que llegue el turno de animation (step 11 > step 5).
    ; ------------------------------------------------------------------
    ld hl, entity_anim_flags
    add hl, bc              ; HL = &entity_anim_flags[entity]
    ld a, (hl)              ; A = flags actuales

    res 3, a                ; bit 3 = 0: borrar ANIM_FLAG_COMPLETED
    or ANIM_FLAG_PLAYING    ; bit 0 = 1: activar ANIM_FLAG_PLAYING
    and #FD                 ; bit 1 = 0: limpiar ANIM_FLAG_LOOP antes de aplicar el nuevo
    or e                    ; bit 1 = nuevo loop flag (E=0x02 o 0x00 según el sprite)
    and #FB                 ; bit 2 = 0: borrar ANIM_FLAG_ONLY_WHEN_MOVING (siempre)
    and #EF                 ; bit 4 = 0: limpiar FORCE_UPLOAD previo
    or ANIM_FLAG_FORCE_UPLOAD
    ld (hl), a              ; entity_anim_flags[entity] = flags actualizados

    ; ------------------------------------------------------------------
    ; BLOQUE 5: Actualizar tabla de colores de capas en RAM
    ;
    ; sprite_layer_colors es una tabla RAM indexada por slot HW sprite.
    ; SM_SpriteLayerColorTable es una tabla ROM de SPRITE_MAX_ENTITY_LAYERS
    ; bytes por sprite, con el color de cada capa del sprite.
    ;
    ; Se copian los colores del nuevo sprite a los slots HW de la entidad
    ; para que render_sprites use los colores correctos en el próximo frame.
    ;
    ; Registros a la entrada:
    ;   D = sprite asset ID
    ;   C = entity index
    ;   B = 0
    ; ------------------------------------------------------------------

    ; Validar rango (mismo guard que en el upload)
    ld a, d
    cp SM_SpriteAssetCount
    jp nc, .acs_skip_color_update  ; fuera de rango → saltar

    push bc                 ; [stack] guarda BC = (0, entity index)
    push de                 ; [stack] guarda D=spriteId, E=loopFlag
    push de                 ; [stack] guarda D=spriteId, E=loopFlag

    ; Obtener el base HW sprite de la entidad: entity_sprite_config[entity * 2]
    ld h, 0
    ld l, c                 ; HL = entity index
    add hl, hl              ; HL = entity index * 2
    ld de, entity_sprite_config
    add hl, de              ; HL = &entity_sprite_config[entity * 2]
    ld c, (hl)              ; C = base HW sprite index (slot de partida en la OAM)

    pop de                  ; DE: D=spriteId, E=loopFlag  [recuperado del stack]

    ; Calcular HL = SM_SpriteLayerColorTable + spriteId * SPRITE_MAX_ENTITY_LAYERS
    ; mediante suma repetida (SPRITE_MAX_ENTITY_LAYERS es pequeño, típicamente 2-4)
    ld l, d                 ; L = sprite asset ID
    ld h, 0                 ; HL = sprite asset ID
    ld e, l
    ld d, h                 ; DE = sprite asset ID (multiplicando)
    ld hl, 0
    ld b, SPRITE_MAX_ENTITY_LAYERS
.acs_mul_max_layers:
    add hl, de              ; acumulador += sprite_ID
    djnz .acs_mul_max_layers ; repetir SPRITE_MAX_ENTITY_LAYERS veces → HL = spriteId * maxLayers
    ld de, SM_SpriteLayerColorTable
    add hl, de              ; HL = &SM_SpriteLayerColorTable[spriteId * maxLayers]

    ; Copiar SPRITE_MAX_ENTITY_LAYERS colores desde la tabla ROM a sprite_layer_colors[hw..]
    ; C = slot HW actual (se incrementa en cada iteración)
    ; HL = fuente en ROM (se incrementa con inc hl)
    ld b, SPRITE_MAX_ENTITY_LAYERS  ; B = contador de capas
.acs_color_update_loop:
    ld a, (hl)              ; A = color de esta capa en la tabla ROM
    inc hl                  ; avanzar al siguiente color en la tabla ROM
    push hl                 ; [stack] preservar HL (fuente ROM) durante el write
    push bc                 ; [stack] preservar B (contador) y C (slot HW)

    ld h, 0
    ld l, c                 ; HL = slot HW actual (índice en sprite_layer_colors)
    ld de, sprite_layer_colors
    add hl, de              ; HL = &sprite_layer_colors[hw_slot]
    ld (hl), a              ; sprite_layer_colors[hw_slot] = color del nuevo sprite

    pop bc                  ; [stack] restaurar B=contador, C=slot HW
    pop hl                  ; [stack] restaurar HL=fuente ROM
    inc c                   ; avanzar al siguiente slot HW
    djnz .acs_color_update_loop

    pop de                  ; DE: D=spriteId, E=loopFlag
    pop bc                  ; BC = (0, entity index)

    ; ------------------------------------------------------------------
    ; BLOQUE 6: Actualizar tabla de offsets Y de capas en RAM
    ;
    ; Misma alineación que los colores: se indexa por slot HW sprite.
    ; ------------------------------------------------------------------

    push de                 ; [stack] guarda D=spriteId, E=loopFlag

    ; Obtener el base HW sprite de la entidad: entity_sprite_config[entity * 2]
    ld h, 0
    ld l, c                 ; HL = entity index
    add hl, hl              ; HL = entity index * 2
    ld de, entity_sprite_config
    add hl, de              ; HL = &entity_sprite_config[entity * 2]
    ld c, (hl)              ; C = base HW sprite index (slot de partida en la OAM)

    pop de                  ; DE: D=spriteId, E=loopFlag

    ; Calcular HL = SM_SpriteLayerYOffsetTable + spriteId * SPRITE_MAX_ENTITY_LAYERS
    ld l, d                 ; L = sprite asset ID
    ld h, 0                 ; HL = sprite asset ID
    ld e, l
    ld d, h                 ; DE = sprite asset ID (multiplicando)
    ld hl, 0
    ld b, SPRITE_MAX_ENTITY_LAYERS
.acs_y_offset_mul_max_layers:
    add hl, de
    djnz .acs_y_offset_mul_max_layers
    ld de, SM_SpriteLayerYOffsetTable
    add hl, de              ; HL = &SM_SpriteLayerYOffsetTable[spriteId * maxLayers]

    ; Copiar SPRITE_MAX_ENTITY_LAYERS offsets desde ROM a sprite_layer_y_offsets[hw..]
    ld b, SPRITE_MAX_ENTITY_LAYERS
.acs_y_offset_update_loop:
    ld a, (hl)
    inc hl
    push hl
    push bc

    ld h, 0
    ld l, c
    ld de, sprite_layer_y_offsets
    add hl, de
    ld (hl), a

    pop bc
    pop hl
    inc c
    djnz .acs_y_offset_update_loop

.acs_skip_color_update:

    ; ------------------------------------------------------------------
    ; Epilogue: restaurar puntero de parámetros y retornar al dispatcher
    ; ------------------------------------------------------------------
    pop hl                  ; HL = puntero al byte tras los parámetros  [del push inicial]
    ret

; [Action_PlayAnimation stripped - not used]

; [Action_SetAnimSpeed stripped - not used]

; [Action_ToggleAnim stripped - not used]

Action_PlaySound:
; Params: Sound Asset Index (1 byte)
    ld a, (hl)
    inc hl

    push hl
    ; PLAY_SOUND now uses the real exported sound asset stream.
    ; This keeps multi-step sounds audible and guarantees auto-silence.
    call SM_PlaySoundAsset
    pop hl
    ret

; [Action_PlayMusic stripped - not used]

; [Action_MuteMusic stripped - not used]

; [Action_StopMusic stripped - not used]

; [Action_SetVariable stripped - not used]

; [Action_IncVariable stripped - not used]

; [Action_DecVariable stripped - not used]

; [Action_Wait stripped - not used]

; [Action_GotoState stripped - not used]

; [Action_SetCompProp stripped - not used]

; [Action_DestroyEntity stripped - not used]

; [Action_SpawnEntity stripped - not used]

; [Action_ChangeGameFlow stripped - not used]

; [Action_RegenerateHud stripped - not used]

; [Action_DecLives stripped - not used]

; [Action_BreakTile stripped - not used]

; [Action_ReplaceTile stripped - not used]

; [Action_ReplaceTileAt stripped - not used]

; [Action_MoveTileArea stripped - not used]

; [Action_ShiftTileArea stripped - not used]

; [Action_Rnd stripped - not used]

; [Action_PointAt stripped - not used]

SM_MusicState:
    db 0                    ; 0=stopped, 1=playing, 2=muted
SM_MusicTrack:
    db 0
SM_RandSeed:
    db #5A
SM_TemplateFilterToken:
    db 0

SM_SilencePSG:
    xor a
    ld e, a
    ld a, 8                 ; Volume A
    call WRTPSG
    xor a
    ld e, a
    ld a, 9                 ; Volume B
    call WRTPSG
    xor a
    ld e, a
    ld a, 10                ; Volume C
    call WRTPSG
    ld a, #3F               ; Disable all tone/noise
    ld e, a
    ld a, 7                 ; Mixer register
    call WRTPSG
    ret

SM_ApplySoundFrame:
    ; Input: HL = pointer to 11-byte pre-expanded sound frame
    ; Output: HL = pointer to next frame
    ld e, (hl)
    ld a, 0
    call WRTPSG
    inc hl
    ld e, (hl)
    ld a, 1
    call WRTPSG
    inc hl
    ld e, (hl)
    ld a, 8
    call WRTPSG
    inc hl

    ld e, (hl)
    ld a, 2
    call WRTPSG
    inc hl
    ld e, (hl)
    ld a, 3
    call WRTPSG
    inc hl
    ld e, (hl)
    ld a, 9
    call WRTPSG
    inc hl

    ld e, (hl)
    ld a, 4
    call WRTPSG
    inc hl
    ld e, (hl)
    ld a, 5
    call WRTPSG
    inc hl
    ld e, (hl)
    ld a, 10
    call WRTPSG
    inc hl

    ld e, (hl)
    ld a, 6
    call WRTPSG
    inc hl
    ld e, (hl)
    ld a, 7
    call WRTPSG
    inc hl
    ret

SM_PlaySoundAsset:
    ; Input: A = sound asset index (0..SM_SoundAssetCount-1)
    ; Destroys: AF, BC, DE, HL
    ld b, a
    ld a, (music_active)
    or a
    jr z, .play_music_inactive
    xor a
    ld (sm_sound_active), a
    ld (sm_sound_frames_left), a
    ret

.play_music_inactive:
    ld a, b
    cp SM_SoundAssetCount
    jr c, .play_valid_sound
    call SM_SilencePSG
    xor a
    ld (sfx_active), a
    ld (sm_sound_active), a
    ld (sm_sound_frames_left), a
    ret

.play_valid_sound:

    ; Stop any previous state-machine sound before starting a new one.
    push af
    call SM_SilencePSG
    xor a
    ld (sfx_active), a
    pop af

    ld l, a
    ld h, 0
    add hl, hl
    ld de, SM_SoundPtrTable
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ex de, hl

    ld a, (hl)
    or a
    jr z, .empty_sound
    ld (sm_sound_frames_left), a
    inc hl
    ld e, (hl)
    inc hl
    ld d, (hl)
    ex de, hl

    call SM_ApplySoundFrame

    ld a, l
    ld (sm_sound_ptr_l), a
    ld a, h
    ld (sm_sound_ptr_h), a
    ld a, 1
    ld (sm_sound_active), a
    ret

.empty_sound:
    xor a
    ld (sm_sound_active), a
    ld (sm_sound_frames_left), a
    ret

SM_UpdateSound:
    ; Advances one frame of the active PLAY_SOUND asset.
    ; The current frame is emitted immediately on SM_PlaySoundAsset, so
    ; frames_left includes the frame already sounding.
    ld a, (music_active)
    or a
    jr z, .update_music_inactive
    xor a
    ld (sm_sound_active), a
    ld (sm_sound_frames_left), a
    ret

.update_music_inactive:
    ld a, (sm_sound_active)
    or a
    ret z

    ld a, (sm_sound_frames_left)
    or a
    jr z, .stop_sound

    dec a
    ld (sm_sound_frames_left), a
    jr z, .stop_sound

    ld a, (sm_sound_ptr_l)
    ld l, a
    ld a, (sm_sound_ptr_h)
    ld h, a
    call SM_ApplySoundFrame
    ld a, l
    ld (sm_sound_ptr_l), a
    ld a, h
    ld (sm_sound_ptr_h), a
    ret

.stop_sound:
    call SM_SilencePSG
    xor a
    ld (sm_sound_active), a
    ret

SM_PlaySfx_Beep:
    ld a, 0                 ; Tone A low
    ld e, #1C               ; NOTE_A4 low (284)
    call WRTPSG
    ld a, 1                 ; Tone A high
    ld e, #01
    call WRTPSG
    ld a, 8                 ; Volume A
    ld e, 12
    call WRTPSG
    ld a, 7                 ; Mixer
    ld e, #3E               ; Tone A on
    call WRTPSG
    ret

SM_PlaySfx_Jump:
    ld a, 0
    ld e, #DD               ; NOTE_C4 low (477)
    call WRTPSG
    ld a, 1
    ld e, #01
    call WRTPSG
    ld a, 8
    ld e, 10
    call WRTPSG
    ld a, 7
    ld e, #3E
    call WRTPSG
    ret

SM_PlaySfx_Shoot:
    ld a, 0
    ld e, #64               ; Tone A low (period 100)
    call WRTPSG
    ld a, 1
    ld e, 0
    call WRTPSG
    ld a, 6                 ; Noise period
    ld e, 5
    call WRTPSG
    ld a, 8                 ; Volume A
    ld e, 8
    call WRTPSG
    ld a, 7
    ld e, #36               ; Tone A + Noise A on
    call WRTPSG
    ret

SM_PlaySfx_Explosion:
    ld a, 6
    ld e, 10
    call WRTPSG
    ld a, 8
    ld e, 15
    call WRTPSG
    ld a, 7
    ld e, #39               ; Noise A only
    call WRTPSG
    ret

SM_PlaySfx_Coin:
    ld a, 2                 ; Tone B low
    ld e, #7B               ; NOTE_E4 low (379)
    call WRTPSG
    ld a, 3                 ; Tone B high
    ld e, #01
    call WRTPSG
    ld a, 9                 ; Volume B
    ld e, 10
    call WRTPSG
    ld a, 7
    ld e, #3D               ; Tone B on
    call WRTPSG
    ret

SM_PlaySfx_Damage:
    ld a, 6                 ; Noise period
    ld e, 3
    call WRTPSG
    ld a, 10                ; Volume C
    ld e, 12
    call WRTPSG
    ld a, 7
    ld e, #1F               ; Noise C on
    call WRTPSG
    ret

; [SM_RandomByte stripped - not used]

; [SM_WriteTileRelativeToEntity stripped - not used]

; [SM_ReadVar stripped - not used]

; [Action_AddVars stripped - not used]

; [Action_SubVars stripped - not used]

; [Action_MulVars stripped - not used]

; [Action_DivVars stripped - not used]

; [Action_ModVars stripped - not used]

; [Action_AssignVar stripped - not used]

; [Action_DisableInput stripped - not used]

; [Action_EnableInput stripped - not used]

; [Action_CleanSprites stripped - not used]

; [Action_ExitCurrentWorld stripped - not used]

SM_ConditionTable:
    DW Condition_Nop            ; 0
    DW Condition_And            ; 1
    DW Condition_Nop ; 2 [Condition_Or stripped]
    DW Condition_Nop ; 3 [Condition_Not stripped]
    DW Condition_Nop ; 4 [Condition_KeyPressed stripped]
    DW Condition_Nop ; 5 [Condition_KeyReleased stripped]
    DW Condition_Nop ; 6 [Condition_TimeOut stripped]
    DW Condition_Nop ; 7 [Condition_CanMove stripped]
    DW Condition_HasCollision   ; 8
    DW Condition_Nop ; 9 [Condition_PathClear stripped]
    DW Condition_Nop ; 10 [Condition_OnWallCollision stripped]
    DW Condition_Nop ; 11 [Condition_DeadlyTile stripped]
    DW Condition_AnimComplete   ; 12
    DW Condition_Nop ; 13 [Condition_KeyAndMove stripped]
    DW Condition_VariableCompare; 14
    DW Condition_Nop ; 15 [Condition_Xor stripped]

    ; ------------------------------------------------------------------
    ; CONDITION HANDLERS IMPLEMENTATION
    ; ------------------------------------------------------------------

Condition_Nop:
    ld a, 1                 ; Always true
    ret

Condition_And:
    ; AND compound condition
    ; Data format: DB subcondition_count, then N subconditions inline
    ; Evaluates all subconditions; returns true only if ALL are true
    ; Input: B = Entity Index, HL = Params (points to count byte)
    ; Output: A = 1 (all true) or 0 (any false), HL = past all subcondition data
    ld c, (hl)              ; C = subcondition count
    inc hl
    ld d, 1                 ; D = result accumulator (1 = all true so far)

.and_loop:
    ld a, c
    or a
    jr z, .and_done         ; No more subconditions

    push bc                 ; Save count (C) and entity index (implicitly)
    push de                 ; Save result accumulator (D)

    ld a, b                 ; A = Entity Index
    call SM_EvaluateCondition ; A = subcondition result, HL advanced

    pop de                  ; Restore result accumulator
    and d                   ; Combine: D = D AND result
    ld d, a

    pop bc                  ; Restore count and entity index
    dec c
    jr .and_loop

.and_done:
    ld a, d                 ; A = AND result
    ret

; [Condition_Or stripped - not used]

; [Condition_Xor stripped - not used]

; [Condition_Not stripped - not used]

; [SM_MatchDirection stripped - not used]

; [SM_DeduceDirectionFromVelocity stripped - not used]

; [SM_TestMoveDirection stripped - not used]

; [Condition_KeyPressed stripped - not used]

; [Condition_KeyReleased stripped - not used]

; [Condition_TimeOut stripped - not used]

; [Condition_CanMove stripped - not used]

Condition_HasCollision:
    ; Params: collisionType (0=any, 1=wall, 2=enemy, 3=item, 4=entity)
    ld a, (hl)
    inc hl
    ld c, a                 ; C = collision type

    push hl
    ld e, b
    ld d, 0

    ; Read wall collision flags without clobbering DE index
    ld hl, entity_wall_collision_flags
    add hl, de
    ld a, (hl)              ; A = wall flags

    ; Read entity-entity collision flags using same DE index
    ld hl, entity_entity_collision_flags
    add hl, de
    ld e, (hl)
    ld d, a                 ; D = wall flags
    pop hl

    ld a, c
    or a
    jr z, .chc_any
    cp 1
    jr z, .chc_wall
    cp 2
    jr z, .chc_enemy
    cp 3
    jr z, .chc_item
    cp 4
    jr z, .chc_entity

.chc_none:
    xor a
    ret

.chc_any:
    ld a, d
    or e
    jr z, .chc_none
    ld a, 1
    ret

.chc_wall:
    ld a, d
    or a
    jr z, .chc_none
    ld a, 1
    ret

.chc_enemy:
    ld a, e
    and COLLISION_EVENT_ENEMY
    jr z, .chc_none
    ld a, 1
    ret

.chc_item:
    ld a, e
    and COLLISION_EVENT_ITEM
    jr z, .chc_none
    ld a, 1
    ret

.chc_entity:
    ld a, e
    and COLLISION_EVENT_ENTITY
    jr z, .chc_none
    ld a, 1
    ret

; [Condition_PathClear stripped - not used]

; [Condition_OnWallCollision stripped - not used]

; [Condition_DeadlyTile stripped - not used]

Condition_AnimComplete:
    ; One-shot event latched by update_animation_component when
    ; a non-loop animation reaches its final frame.
    ; Consume-on-read semantics prevents repeated transitions.
    push hl
    ld hl, entity_anim_flags
    ld e, b
    ld d, 0
    add hl, de
    bit 3, (hl)                    ; ANIM_FLAG_COMPLETED
    jr z, .anim_complete_false
    res 3, (hl)                    ; consume event
    ld a, 1
    pop hl
    ret

.anim_complete_false:
    xor a
    pop hl
    ret

; [Condition_KeyAndMove stripped - not used]

Condition_VariableCompare:
    ; Params: VarID (1 byte), Operator (1 byte), CompareSource (1 byte), ValueOrVarID (1 byte)
    ; CompareSource: 0 = constant byte, 1 = variable ID
    ; Input: B = Entity Index, HL = Params Ptr
    ; Output: A = 1 (true) or 0 (false), HL = Updated Ptr
    ; Supports entity variables (ID 0-5) and global variables (ID 6+)

    ld a, (hl)              ; A = Variable ID
    inc hl
    ld c, (hl)              ; C = Operator ID
    inc hl
    ld d, (hl)              ; D = CompareSource
    inc hl
    ld e, (hl)              ; E = Compare Value or Variable ID
    inc hl

    push hl                 ; Save updated params ptr
    push bc                 ; Save Operator and Entity Index
    push de                 ; Save CompareSource/ValueOrVarID

    call .load_variable_value
    ld d, e                 ; D = left value

    pop hl                  ; H = CompareSource, L = Compare Value / VarID
    ld a, h
    or a
    jr z, .compare_constant

    ld a, l                 ; Resolve right-side variable
    call .load_variable_value
    jr .do_compare

.compare_constant:
    ld e, l                 ; E = right constant value

.do_compare:
    pop bc                  ; C = Operator ID, B = Entity Index (restore)
    pop hl                  ; HL = Updated Params Ptr
    
    ; Now: D = Left Value, E = Right Value, C = Operator
    ; Perform comparison based on operator
    ld a, c                 ; A = Operator ID
    
    cp 0                    ; == operator
    jr z, .op_equals
    cp 1                    ; != operator
    jr z, .op_not_equals
    cp 2                    ; > operator
    jr z, .op_greater
    cp 3                    ; < operator
    jr z, .op_less
    cp 4                    ; >= operator
    jr z, .op_greater_equal
    cp 5                    ; <= operator
    jr z, .op_less_equal
    
    ; Invalid operator, return false
    ld a, 0
    ret

.op_equals:
    ld a, d
    cp e
    jp z, .return_true
    jp .return_false

.op_not_equals:
    ld a, d
    cp e
    jp nz, .return_true
    jp .return_false

.op_greater:
    ld a, d
    cp e
    jp z, .return_false
    jp nc, .return_true
    jp .return_false

.op_less:
    ld a, d
    cp e
    jp c, .return_true
    jp .return_false

.op_greater_equal:
    ld a, d
    cp e
    jp nc, .return_true
    jp .return_false

.op_less_equal:
    ld a, d
    cp e
    jp z, .return_true
    jp c, .return_true
    jp .return_false

.load_variable_value:
    push bc

    cp 6
    jr nc, .load_global_var

    ld c, b
    ld b, 0

    cp 0
    jr z, .load_x
    cp 1
    jr z, .load_y
    cp 2
    jr z, .load_vx
    cp 3
    jr z, .load_vy
    cp 4
    jr z, .load_on_ground

.load_health:
    ld hl, entity_health_current
    add hl, bc
    ld e, (hl)
    jr .load_done

.load_global_var:
    sub 6
    ld l, a
    ld h, 0
    add hl, hl
    ld de, SM_GlobalVarTable
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, (de)
    ld e, a
    jr .load_done

.load_x:
    ld hl, entity_x_pos
    add hl, bc
    ld e, (hl)
    jr .load_done

.load_y:
    ld hl, entity_y_pos
    add hl, bc
    ld e, (hl)
    jr .load_done

.load_vx:
    ld hl, entity_vel_x
    add hl, bc
    ld e, (hl)
    jr .load_done

.load_vy:
    ld hl, entity_vel_y
    add hl, bc
    ld e, (hl)
    jr .load_done

.load_on_ground:
    ld hl, entity_on_ground
    add hl, bc
    ld a, (hl)
    and #01
    ld e, a

.load_done:
    pop bc
    ret

.return_true:
    ld a, 1
    ret

.return_false:
    ld a, 0
    ret
    

; ==================================================================
; GLOBAL VARIABLES TABLE
; ==================================================================
; Maps variable IDs (6+) to their RAM addresses
; ID 6 = gem_count, ID 7 = last_interaction_char, ID 8 = pending, ID 9+ = interaction context, ID 15+ = user globals
SM_GlobalVarTable:
    DW gem_count            ; ID 6: gem_count
    DW last_interaction_char ; ID 7: last_interaction_char
    DW last_interaction_pending ; ID 8: last_interaction_pending
    DW last_interaction_type ; ID 9: last_interaction_type
    DW last_interaction_value ; ID 10: last_interaction_value
    DW last_interaction_target ; ID 11: last_interaction_target
    DW last_interaction_x   ; ID 12: last_interaction_x
    DW last_interaction_y   ; ID 13: last_interaction_y
    DW last_interaction_entity ; ID 14: last_interaction_entity
    DW global_var_score            ; ID 15: Score
    DW global_var_lives            ; ID 16: Lives

; Global variable width flags: 1 = word, 0 = byte
SM_GlobalVarWordTable:
    DB 0 ; ID 6: gem_count
    DB 0 ; ID 7: last_interaction_char
    DB 0 ; ID 8: last_interaction_pending
    DB 0 ; ID 9: last_interaction_type
    DB 0 ; ID 10: last_interaction_value
    DB 0 ; ID 11: last_interaction_target
    DB 0 ; ID 12: last_interaction_x
    DB 0 ; ID 13: last_interaction_y
    DB 0 ; ID 14: last_interaction_entity
    DB 1 ; ID 15: Score
    DB 0 ; ID 16: Lives

; ==================================================================
; STATE MACHINE DATA
; ==================================================================

; ==================================================================
; TEMPLATE PROFILE TABLES
; ==================================================================
SM_TemplateProfileCount EQU 4
SM_TemplateSpriteTable:
    DB 0, 0, 0, 0, 0
SM_TemplateAnimSpeedTable:
    DB 6, 6, 6, 6, 6
SM_TemplateHealthCurrentTable:
    DB 1, 1, 1, 1, 1
SM_TemplateHealthMaxTable:
    DB 1, 1, 1, 1, 1

; ==================================================================
; STATE MACHINE SPRITE RUNTIME TABLES
; NOTE: frame bank is derived from the frame pointer at runtime.
; This keeps ChangeSprite compatible with post-export ZX0 label remaps.
; ==================================================================
SM_SpriteAssetCount EQU 18
SM_SpritePatternPtrTable:
    DW SPRITE_0_PATTERN
    DW SPRITE_1_PATTERN
    DW SPRITE_2_PATTERN
    DW SPRITE_3_PATTERN
    DW SPRITE_4_PATTERN
    DW SPRITE_5_PATTERN
    DW SPRITE_6_PATTERN
    DW SPRITE_7_PATTERN
    DW SPRITE_8_PATTERN
    DW SPRITE_9_PATTERN
    DW SPRITE_10_PATTERN
    DW SPRITE_11_PATTERN
    DW SPRITE_12_PATTERN
    DW SPRITE_13_PATTERN
    DW SPRITE_14_PATTERN
    DW SPRITE_15_PATTERN
    DW SPRITE_16_PATTERN
    DW SPRITE_17_PATTERN

; ==================================================================
; STATE MACHINE SOUND ASSET TABLES
; PLAY_SOUND exports a one-shot 60Hz frame stream per sound asset.
; Channel loops are flattened to a single pass to avoid stuck PSG.
; Hardware envelopes are not emitted yet in this state-machine path.
; ==================================================================
SM_SoundFrameSize EQU 11
SM_SoundAssetCount EQU 2
SM_SoundPtrTable:
    DW SM_SoundAsset_0
    DW SM_SoundAsset_1

SM_SoundAsset_0:
    DB 6
    DW SM_SoundAsset_0_Frames

SM_SoundAsset_0_Frames:
    DB 238, 5, 10, 0, 0, 0, 0, 0, 0, 16, 54
    DB 238, 5, 10, 0, 0, 0, 0, 0, 0, 16, 54
    DB 238, 5, 10, 0, 0, 0, 0, 0, 0, 16, 54
    DB 238, 5, 10, 0, 0, 0, 0, 0, 0, 16, 54
    DB 238, 5, 10, 0, 0, 0, 0, 0, 0, 16, 54
    DB 238, 5, 10, 0, 0, 0, 0, 0, 0, 16, 54

SM_SoundAsset_1:
    DB 9
    DW SM_SoundAsset_1_Frames

SM_SoundAsset_1_Frames:
    DB 77, 1, 10, 0, 0, 0, 0, 0, 0, 16, 62
    DB 77, 1, 10, 0, 0, 0, 0, 0, 0, 16, 62
    DB 77, 1, 10, 0, 0, 0, 0, 0, 0, 16, 62
    DB 77, 1, 10, 0, 0, 0, 0, 0, 0, 16, 62
    DB 122, 0, 10, 0, 0, 0, 0, 0, 0, 16, 62
    DB 122, 0, 10, 0, 0, 0, 0, 0, 0, 16, 62
    DB 122, 0, 10, 0, 0, 0, 0, 0, 0, 16, 62
    DB 122, 0, 10, 0, 0, 0, 0, 0, 0, 16, 62
    DB 122, 0, 10, 0, 0, 0, 0, 0, 0, 16, 62
; State Machine: New Statemachine (statemachine_1771533517310) 
SM_New_Statemachine_state_1771533526010: 
    DB 0; ID(unused) 
    DW SM_New_Statemachine_state_1771533526010_OnEnter 
    DW 0 
    DW SM_New_Statemachine_state_1771533526010_Transitions 
SM_New_Statemachine_state_1771533526010_OnEnter: 
    DB 5; CHANGE_SPRITE 
    DB 7; sprite: nina_idle 
    DB 0xFF; END
SM_New_Statemachine_state_1771533526010_Transitions: 
    DB 3; Count
    DB 1; AND 
    DB 2 
    DB 14; VARIABLE_COMPARE 
    DB 4, 0, 0, 1; isOnGround (ID 4) == true
    DB 14; VARIABLE_COMPARE 
    DB 2, 1, 0, 0; vx (ID 2) != 0
    DW SM_New_Statemachine_state_1771966990568 
    DW 0 
    DB 1; AND 
    DB 2 
    DB 14; VARIABLE_COMPARE 
    DB 4, 0, 0, 0; isOnGround (ID 4) == 0
    DB 14; VARIABLE_COMPARE 
    DB 3, 2, 0, 127; vy (ID 3) > 127
    DW SM_New_Statemachine_state_1772025558931 
    DW 0 
    DB 8; HAS_COLLISION 
    DB 2          ; collisionType: enemy
    DW SM_New_Statemachine_state_1771533530403 
    DW SM_New_Statemachine_state_1771533526010_Transitions_Actions_2 

SM_New_Statemachine_state_1771533526010_Transitions_Actions_2: 
    DB 5; CHANGE_SPRITE 
    DB 6; sprite: nina_dead 
    DB 0xFF; END

SM_New_Statemachine_state_1771533530403: 
    DB 0; ID(unused) 
    DW SM_New_Statemachine_state_1771533530403_OnEnter 
    DW 0 
    DW 0 
SM_New_Statemachine_state_1771533530403_OnEnter: 
    DB 5; CHANGE_SPRITE 
    DB 6; sprite: nina_dead 
    DB 0xFF; END

SM_New_Statemachine_state_1771966990568: 
    DB 0; ID(unused) 
    DW SM_New_Statemachine_state_1771966990568_OnEnter 
    DW 0 
    DW SM_New_Statemachine_state_1771966990568_Transitions 
SM_New_Statemachine_state_1771966990568_OnEnter: 
    DB 5; CHANGE_SPRITE 
    DB 3; sprite: nina_walk 
    DB 0xFF; END
SM_New_Statemachine_state_1771966990568_Transitions: 
    DB 3; Count
    DB 14; VARIABLE_COMPARE 
    DB 2, 0, 0, 0; vx (ID 2) == 0
    DW SM_New_Statemachine_state_1771533526010 
    DW 0 
    DB 8; HAS_COLLISION 
    DB 2          ; collisionType: enemy
    DW SM_New_Statemachine_state_1771533530403 
    DW SM_New_Statemachine_state_1771966990568_Transitions_Actions_1 
    DB 1; AND 
    DB 2 
    DB 14; VARIABLE_COMPARE 
    DB 4, 0, 0, 0; isOnGround (ID 4) == 0
    DB 14; VARIABLE_COMPARE 
    DB 3, 2, 0, 127; vy (ID 3) > 127
    DW SM_New_Statemachine_state_1772025558931 
    DW 0 

SM_New_Statemachine_state_1771966990568_Transitions_Actions_1: 
    DB 5; CHANGE_SPRITE 
    DB 6; sprite: nina_dead 
    DB 0xFF; END

SM_New_Statemachine_state_1772025558931: 
    DB 0; ID(unused) 
    DW SM_New_Statemachine_state_1772025558931_OnEnter 
    DW 0 
    DW SM_New_Statemachine_state_1772025558931_Transitions 
SM_New_Statemachine_state_1772025558931_OnEnter: 
    DB 5; CHANGE_SPRITE 
    DB 4; sprite: nina_jump 
    DB 0xFF; END
SM_New_Statemachine_state_1772025558931_Transitions: 
    DB 2; Count
    DB 14; VARIABLE_COMPARE 
    DB 3, 3, 0, 128; vy (ID 3) < 128
    DW SM_New_Statemachine_state_1772025563321 
    DW 0 
    DB 8; HAS_COLLISION 
    DB 2          ; collisionType: enemy
    DW SM_New_Statemachine_state_1771533530403 
    DW SM_New_Statemachine_state_1772025558931_Transitions_Actions_1 

SM_New_Statemachine_state_1772025558931_Transitions_Actions_1: 
    DB 5; CHANGE_SPRITE 
    DB 6; sprite: nina_dead 
    DB 0xFF; END

SM_New_Statemachine_state_1772025563321: 
    DB 0; ID(unused) 
    DW SM_New_Statemachine_state_1772025563321_OnEnter 
    DW 0 
    DW SM_New_Statemachine_state_1772025563321_Transitions 
SM_New_Statemachine_state_1772025563321_OnEnter: 
    DB 5; CHANGE_SPRITE 
    DB 8; sprite: nina_fall 
    DB 0xFF; END
SM_New_Statemachine_state_1772025563321_Transitions: 
    DB 2; Count
    DB 1; AND 
    DB 2 
    DB 14; VARIABLE_COMPARE 
    DB 3, 0, 0, 0; vy (ID 3) == 0
    DB 14; VARIABLE_COMPARE 
    DB 4, 0, 0, 1; isOnGround (ID 4) == true
    DW SM_New_Statemachine_state_1772025566187 
    DW 0 
    DB 8; HAS_COLLISION 
    DB 2          ; collisionType: enemy
    DW SM_New_Statemachine_state_1771533530403 
    DW SM_New_Statemachine_state_1772025563321_Transitions_Actions_1 

SM_New_Statemachine_state_1772025563321_Transitions_Actions_1: 
    DB 5; CHANGE_SPRITE 
    DB 6; sprite: nina_dead 
    DB 0xFF; END

SM_New_Statemachine_state_1772025566187: 
    DB 0; ID(unused) 
    DW SM_New_Statemachine_state_1772025566187_OnEnter 
    DW 0 
    DW SM_New_Statemachine_state_1772025566187_Transitions 
SM_New_Statemachine_state_1772025566187_OnEnter: 
    DB 5; CHANGE_SPRITE 
    DB 5; sprite: nina_land 
    DB 9; PLAY_SOUND 
    DB 0        ; sound: sound_1772354483190
    DB 0xFF; END
SM_New_Statemachine_state_1772025566187_Transitions: 
    DB 2; Count
    DB 12; ANIMATION_COMPLETE 
    DW SM_New_Statemachine_state_1771533526010 
    DW 0 
    DB 8; HAS_COLLISION 
    DB 2          ; collisionType: enemy
    DW SM_New_Statemachine_state_1771533530403 
    DW SM_New_Statemachine_state_1772025566187_Transitions_Actions_1 

SM_New_Statemachine_state_1772025566187_Transitions_Actions_1: 
    DB 5; CHANGE_SPRITE 
    DB 6; sprite: nina_dead 
    DB 0xFF; END



; --- End of Bank 2 — pad to 8KB boundary ---
    ds #A000 - $, #FF

; ##################################################################
; BANK 3 — [#A000h-#C000h] PRIMARY: gameflow
; (Always mapped at boot: bank1→P1, bank2→P2, bank3→P3)
; ##################################################################
    org #A000

; ==================================================================
; GAMEFLOW EXECUTION ENGINE
; File: gameflow.asm
; Description: GameFlow-based game orchestration system
; ==================================================================
;
; GameFlow: Main
; Total Nodes: 3
; Total Connections: 2
; Start Node: gf_start_1770754183471
;
; ARCHITECTURE:
; - GameFlow is the SOLE execution orchestrator
; - Each node generates its own execution code
; - Connections between nodes define the complete flow
; - No hardcoded main_loop outside GameFlow
; ==================================================================

; ==================================================================
; GAMEFLOW INITIALIZATION
; ==================================================================

gameflow_init:
    ; Initialize GameFlow system
    ; Reset state
    xor a
    ld (gameflow_exit_requested), a
    ld (current_flow_state), a
    ret

; Main entry point - called from init_rom
; This is where the game STARTS
gameflow_start:
    ; Load the Start node
    ld hl, gameflow_node_gf_start_1770754183471
    jp gameflow_execute_node

; ==================================================================
; CORE EXECUTION ENGINE
; ==================================================================

; Execute a GameFlow node
; Input: HL = address of node structure
; 
; Node Structure:
;   +0: Node type (byte)
;   +1-2: Data pointer (word) - node-specific data
;   +3-4: Connection table pointer (word)
;
gameflow_execute_node:
    ; Read node type
    ld a, (hl)
    inc hl
    
    ; Save data pointer and connection table pointer for handlers
    ld e, (hl)
    inc hl
    ld d, (hl)      ; DE = data pointer
    inc hl
    ld c, (hl)
    inc hl
    ld b, (hl)      ; BC = connection table pointer
    
    ; DE = node data, BC = connection table
    ; Dispatch based on node type
    cp NODE_TYPE_START
    jp z, gameflow_handle_start
    cp NODE_TYPE_WORLD_LINK
    jp z, gameflow_handle_worldlink
    cp NODE_TYPE_END
    jp z, gameflow_handle_end
    
    ; Unknown node type - error
    ret

; ==================================================================
; NODE TYPE HANDLERS
; Each handler receives:
;   DE = node data pointer
;   BC = connection table pointer
; ==================================================================

gameflow_handle_start:
    ; Start node - Initialize game state and systems
    ; DE = node data pointer:
    ;   [init_routine_ptr DW][init_routine_bank DB]
    ; BC = connection table

    push bc         ; Save connection table

    ; Execute initialization routine
    ; DE points to start_init_data structure
    ex de, hl
    ld e, (hl)
    inc hl
    ld d, (hl)      ; DE = initialization routine address
    inc hl
    ld b, (hl)      ; B = initialization routine bank
    ld h, d
    ld l, e         ; HL = initialization routine address

    ; Call initialization routine (if not null)
    ld a, h
    or l
    jr z, .skip_init

    ; Mapper-safe far call (auto window from HL address)
    ld a, b
    call mapper_call_hl_auto

.skip_init:
    ; Continue to next node
    pop bc
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z           ; No connection
    jp gameflow_execute_node

gameflow_handle_worldlink:
    ; WorldLink node - load world and enter game loop
    ; DE = world data pointer:
    ;   [load_world_ptr DW][load_world_bank DB][init_ptr DW][init_bank DB]
    ; BC = connection table (for exit)

    push bc         ; Save connection table

    ; Load the world
    ; DE points to: dw load_world_X, db load_world_bank, dw init_routine, db init_bank
    ex de, hl
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld b, (hl)      ; B = load_world_X bank
    inc hl
    push hl         ; Save pointer to optional WorldLink init routine
    ld h, d
    ld l, e         ; HL = load_world_X address

    ; Mapper-safe far call to world load routine
    ld a, h
    or l
    jr z, .after_load
    ld a, b
    call mapper_call_hl_auto

.after_load:
    ; Optional per-world globals initialization
    pop hl
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld b, (hl)      ; B = init routine bank
    ld h, d
    ld l, e         ; HL = init routine address
    ld a, h
    or l
    jr z, .after_init
    ld a, b
    call mapper_call_hl_auto

.after_init:
    ; Set game state
    xor a
    ld (gameflow_exit_requested), a
    ld a, FLOW_STATE_GAME
    ld (current_flow_state), a

    ; Sync SAT patterns using the slot table just filled by load_world.
    ; force_update_entity_sprite (called during init_entities) ran before
    ; load_sprite_patterns, so sprite_asset_base_pattern_slot_runtime was
    ; all zeros then.  Calling update_sprite_component here recomputes the
    ; correct slot->pattern mapping for all entities in the render list
    ; so the very first update_sprites_to_vram below writes the right data.
    call update_sprite_component

    ; Update sprites
    call call_update_sprites_to_vram_resident

    ; Bootstrap HUD only on screens that actually use HUD
    ld a, (current_screen_id)
    cp 0
    jp z, .gf_worldlink_hud_do
    cp 1
    jp z, .gf_worldlink_hud_do
    cp 2
    jp z, .gf_worldlink_hud_do
    cp 3
    jp z, .gf_worldlink_hud_do
    jp .gf_worldlink_hud_skip
.gf_worldlink_hud_do:
    ld a, 1
    ld (hud_dirty_flag), a
    call call_render_hud_resident
.gf_worldlink_hud_skip:

    ; Enter game loop
    call gameflow_world_game_loop

    ; Exited loop - continue to next node
    pop bc          ; Restore connection table
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

gameflow_handle_end:
    ; End node - stop execution and show end screen
    ; DE = end screen data pointer (screen type, message pointer)
    ; BC = connection table (unused, end stops execution)

    push de

    ; Get end screen type from data
    ld a, (de)                    ; A = screen type (0=victory, 1=defeat, 2=credits, etc.)
    push af                       ; Save screen type
    inc de
    ld a, (de)                    ; Get low byte of message pointer
    ld l, a
    inc de
    ld a, (de)                    ; Get high byte of message pointer
    ld h, a                       ; HL = message pointer (if any)
    pop af                        ; Restore screen type

    ; Display end screen based on type
    call display_end_screen

    pop de

    ; End screen loop - wait for input or timeout
.end_screen_loop:
    halt                          ; Wait V-blank
    call call_task_audio_tick_resident


    ; Avoid BIOS joystick helpers here because they touch the PSG while
    ; VBlank music is writing it. Use keyboard matrix reads only.
    ld a, 8                       ; SPACE row
    call FAST_SNSMAT
    bit 0, a                      ; SPACE
    jr z, .end_screen_exit

    ; Check for ESC key to exit
    ld a, 7                       ; ESC key row
    call FAST_SNSMAT
    bit 2, a                      ; ESC key
    jr z, .end_screen_exit

    jr .end_screen_loop

.end_screen_exit:
    ret

; ------------------------------------------------------------------
; display_end_screen
; Display end screen based on type
; Input:  A = screen type (0=victory, 1=defeat, 2=credits, 3=custom)
;         HL = message pointer (for custom messages)
; ------------------------------------------------------------------
display_end_screen:
    push af
    push hl

    ; Clear screen first
    call clear_screen_area

    pop hl
    pop af

    ; Dispatch based on screen type
    or a
    jr z, .show_victory           ; 0 = Victory
    dec a
    jr z, .show_defeat            ; 1 = Defeat
    dec a
    jr z, .show_credits           ; 2 = Credits
    jr .show_custom               ; 3+ = Custom message

.show_victory:
    ; Display "VICTORY!" message
    ld hl, str_victory
    ld de, #1800 + (10 * 32) + 12 ; Row 10, col 12
    call print_string_vram
    ret

.show_defeat:
    ; Display "GAME OVER" message
    ld hl, str_game_over
    ld de, #1800 + (10 * 32) + 11 ; Row 10, col 11
    call print_string_vram
    ret

.show_credits:
    ; Display "CREDITS" message
    ld hl, str_credits
    ld de, #1800 + (8 * 32) + 13  ; Row 8, col 13
    call print_string_vram
    ; Add more credits lines here if needed
    ret

.show_custom:
    ; Display custom message from HL
    ld de, #1800 + (10 * 32) + 8  ; Row 10, col 8
    call print_string_vram
    ret

; ------------------------------------------------------------------
; Helper: Print string to VRAM
; Input: HL = string pointer (null-terminated)
;        DE = VRAM destination
; ------------------------------------------------------------------
print_string_vram:
    push bc
    push de
    push hl

.psv_loop:
    ld a, (hl)                    ; Get character
    or a                          ; Check for null terminator
    jr z, .psv_done

    ; Write character to VRAM
    push hl
    push de
    ex de, hl                     ; HL = VRAM address (from DE)
    call FAST_WRTVRM              ; Write A to VRAM at HL (direct port)
    pop de
    pop hl

    inc hl                        ; Next character
    inc de                        ; Next VRAM position
    jr .psv_loop

.psv_done:
    pop hl
    pop de
    pop bc
    ret

; ------------------------------------------------------------------
; End screen message strings
; ------------------------------------------------------------------
str_victory:
    db "VICTORY!", 0

str_game_over:
    db "GAME OVER", 0

str_credits:
    db "CREDITS", 0

; ==================================================================
; CONNECTION UTILITIES
; ==================================================================

; Get next node from connection table (for simple single-connection nodes)
; Input: BC = connection table pointer
; Output: HL = next node address (or 0 if none)
gameflow_get_default_connection:
    ; Connection table format:
    ;   db CONNECTION_TYPE
    ;   dw NODE_ADDRESS
    ;   db CONNECTION_END
    
    ld h, b
    ld l, c
    ld a, (hl)
    cp CONNECTION_END
    jr z, .no_connection
    
    inc hl
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a         ; HL = next node address
    ret

.no_connection:
    ld hl, 0
    ret

; Get connection by type
; Input: BC = connection table pointer, A = connection type to find
; Output: HL = next node address (or 0 if not found)
gameflow_get_connection_by_type:
    ld d, a         ; Save connection type
    ld h, b
    ld l, c

.search_loop:
    ld a, (hl)
    cp CONNECTION_END
    jr z, .not_found

    cp d
    jr z, .found

    ; OPTIMIZED: Skip this entry using ADD (11 cycles vs 3× INC = 18 cycles)
    ld bc, 3        ; Entry size: 1 byte type + 2 bytes address
    add hl, bc
    jr .search_loop

.found:
    inc hl
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a
    ret

.not_found:
    ld hl, 0
    ret

; Connection type constants
CONNECTION_DEFAULT      EQU 0
CONNECTION_THEN         EQU 1
CONNECTION_ELSE         EQU 2
CONNECTION_OPTION_0     EQU 10
CONNECTION_OPTION_1     EQU 11
CONNECTION_OPTION_2     EQU 12
CONNECTION_OPTION_3     EQU 13
CONNECTION_OPTION_4     EQU 14
CONNECTION_OPTION_5     EQU 15
CONNECTION_END          EQU 255

; Shared data pointer for nodes without data
gameflow_no_data:
    db #C9                        ; RET instruction - returns immediately

; ------------------------------------------------------------------
; gameflow_read_confirm_direct
; Read submenu/text confirm input directly from keyboard matrix.
; Output: A = 1 when SPACE is pressed, A = 0 otherwise
; Clobbers: AF
; Preserves: BC, DE, HL, IX, IY
; ------------------------------------------------------------------
gameflow_read_confirm_direct:
    ld a, 8
    call FAST_SNSMAT
    bit 0, a
    jr z, .grcd_pressed
    xor a
    ret
.grcd_pressed:
    ld a, 1
    ret

; ==================================================================
; GAME LOOP (WorldLink nodes only)
; ==================================================================

; Main game loop - executed by WorldLink nodes
; This loop runs while a world/level is active
gameflow_world_game_loop:
    ; Check exit flag
    ld a, (gameflow_exit_requested)
    or a
    ret nz

    ; Frame sync first: start each tick exactly on V-Blank edge
    halt
    call call_task_audio_tick_resident
    ; Poll input immediately after V-Blank edge so the hero uses
    ; the freshest input state in the same visible frame.
    call task_update_input
    call update_player_fastpath



    ; Handle world screen edge transitions (Preview parity)
    call call_check_world_screen_transition_resident

    ; Update all entities
    call update_all_entities

    ; Refresh player deadly-tile state before state machines consume it.
    call refresh_player_deadly_fastpath

    ; Refresh player tile interactions without running bonus respawns twice.
    call refresh_player_tile_interaction_fastpath

    ; Run the player state machine before the generic SM sweep.
    call refresh_player_state_machine_fastpath

    ; Execute all state machines
    call execute_all_state_machines

    ; WallGrab owns the visible sprite while the grab button is held.
    ; Re-apply it after StateMachine actions so idle/jump/walk sprites
    ; cannot win the frame immediately before animation/sprite refresh.
    call refresh_player_wallgrab_fastpath
    call update_wallgrab_component

    ; Update timed PSG sound effects
    call call_sfx_update_resident

    ; Refresh player animation with the final state of this frame.
    call refresh_player_animation_fastpath

    ; Refresh player sprite once with the final state of this frame.
    call refresh_player_sprite_fastpath

    call call_update_boss_system_resident

    ; Upload sprites after gameplay so the hero position computed this frame
    ; is what gets shown on screen, instead of the previous frame's SAT.
    call call_update_sprites_to_vram_resident

    ; Animated transform tiles do VRAM read-modify-write, so defer them until
    ; after hero/entity work to keep player response prioritized.
    call call_update_animated_tiles_resident

    ; Sprite SAT upload runs once per frame, outside ISR.

    ; Render HUD only on screens that define HUD elements
    ld a, (current_screen_id)
    cp 0
    jp z, .gf_worldloop_hud_do
    cp 1
    jp z, .gf_worldloop_hud_do
    cp 2
    jp z, .gf_worldloop_hud_do
    cp 3
    jp z, .gf_worldloop_hud_do
    jp .gf_worldloop_hud_skip
.gf_worldloop_hud_do:
    call call_render_hud_resident
.gf_worldloop_hud_skip:

    ; Loop
    jp gameflow_world_game_loop

; ==================================================================
; NODE DATA STRUCTURES
; Each node has: type byte, data pointer, connection table pointer
; ==================================================================

; Node: Start - "gf_start_1770754183471"
gameflow_node_gf_start_1770754183471:
    db NODE_TYPE_START
    dw gameflow_node_gf_start_1770754183471_data
    dw gameflow_node_gf_start_1770754183471_conn

gameflow_node_gf_start_1770754183471_data:
    dw gameflow_node_gf_start_1770754183471_init    ; Initialization routine address
    db ((gameflow_node_gf_start_1770754183471_init - #4000) / #2000)    ; Initialization routine bank

gameflow_node_gf_start_1770754183471_conn:
    db CONNECTION_DEFAULT
    dw gameflow_node_gfn_1772275295906
    db CONNECTION_END

; ------------------------------------------------------------------
; gameflow_node_gf_start_1770754183471_init
; Initialization routine for Start node
; Initializes global variables and MSX systems
; ------------------------------------------------------------------
gameflow_node_gf_start_1770754183471_init:
    ; === Core Game Systems Initialization (ALWAYS required) ===
    call init_game_systems

    ; === Global Variables Initialization ===
    ld a, 0
    ld (global_var_score), a    ; Score low byte = 0
    ld a, 0
    ld (global_var_score+1), a    ; Score high byte = 0
    ld a, 3
    ld (global_var_lives), a    ; Lives = 3

    ret

; Node: WorldLink - "gfn_1772275295906"
gameflow_node_gfn_1772275295906:
    db NODE_TYPE_WORLD_LINK
    dw gameflow_node_gfn_1772275295906_data
    dw gameflow_node_gfn_1772275295906_conn

gameflow_node_gfn_1772275295906_data:
    dw load_world_worldmap_1770754170935_far
    db ((load_world_worldmap_1770754170935_far - #4000) / #2000)
    dw gameflow_node_gfn_1772275295906_init
    db ((gameflow_node_gfn_1772275295906_init - #4000) / #2000)

gameflow_node_gfn_1772275295906_conn:
    db CONNECTION_DEFAULT
    dw gameflow_node_gfn_1772881845818
    db CONNECTION_END

; ------------------------------------------------------------------
; gameflow_node_gfn_1772275295906_init
; Initialization routine for WorldLink node
; Applies optional per-world global values when entering the world
; ------------------------------------------------------------------
gameflow_node_gfn_1772275295906_init:
    ret

; Node: End - "gfn_1772881845818"
gameflow_node_gfn_1772881845818:
    db NODE_TYPE_END
    dw gameflow_no_data
    dw gameflow_node_gfn_1772881845818_conn

gameflow_node_gfn_1772881845818_conn:
    db CONNECTION_DEFAULT
    dw 0
    db CONNECTION_END


; ==================================================================
; INITIALIZATION UTILITY FUNCTIONS
; ==================================================================

; ------------------------------------------------------------------
; init_psg_silence
; Silence all PSG channels
; ------------------------------------------------------------------








init_all_global_variables:
    ; Initialize global variables
    ld a, 0
    ld (global_var_score), a    ; Score low byte = 0
    ld a, 0
    ld (global_var_score+1), a    ; Score high byte = 0
    ld a, 0
    ld (global_var_lives), a    ; Lives = 0
    ret

; ==================================================================
; GAMEFLOW VARIABLES
; ==================================================================

; Runtime GameFlow variables are allocated in variables.asm (RAM EQUs):
; gameflow_exit_requested, gameflow_menu_selection,
; gameflow_submenu_data_ptr, gameflow_submenu_option_count,
; gameflow_submenu_cursor_enabled, gameflow_submenu_cursor_layer_count,
; gameflow_condition_result

; ==================================================================
; COMMON GAMEFLOW UTILITIES
; ==================================================================

; ------------------------------------------------------------------
; Helper: Clear screen area for menus/end screens
; ------------------------------------------------------------------
clear_screen_area:
    ; Clear center area of screen
    ld b, 8                       ; 8 rows
    ld c, 8                       ; Start at row 8

.csa_loop:
    push bc
    ld a, c
    call clear_screen_row
    pop bc
    inc c
    djnz .csa_loop
    ret

; ------------------------------------------------------------------
; Helper: Clear a screen row (fill with empty tile)
; Input: A = Row number (0-23)
; ------------------------------------------------------------------
clear_screen_row:
    push af
    push bc
    push de
    push hl

    ; Calculate row start in name table
    ; Row address = #1800 + (row * 32)
    ld l, a
    ld h, 0
    add hl, hl                    ; * 2
    add hl, hl                    ; * 4
    add hl, hl                    ; * 8
    add hl, hl                    ; * 16
    add hl, hl                    ; * 32

    ; Add base address (name table)
    ld de, #1800                  ; Name table base (Screen 2)
    add hl, de                    ; HL = VRAM address

    ; Clear 32 tiles (one row)
    ex de, hl                     ; DE = VRAM destination
    ld hl, empty_row_data         ; HL = source (32 zeros)
    ld bc, 32                     ; Copy 32 bytes
    call LDIRVM

    pop hl
    pop de
    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; Data: Empty row (32 zero bytes)
; ------------------------------------------------------------------
empty_row_data:
    db 0, 0, 0, 0, 0, 0, 0, 0
    db 0, 0, 0, 0, 0, 0, 0, 0
    db 0, 0, 0, 0, 0, 0, 0, 0
    db 0, 0, 0, 0, 0, 0, 0, 0

; ==================================================================
; END OF GAMEFLOW
; ==================================================================


; --- End of Bank 3 — pad to 8KB boundary ---
    ds #C000 - $, #FF

; ##################################################################
; FAR BANK 4 — [#6000h-#8000h] FAR CODE: screens_code
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank4 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-3). No far-to-far calls allowed.
; ##################################################################
FAR_BANK_4_ROM_START:
    org #6000

; ==================================================================
; SCREEN MAPS
; File: screens.asm
; Description: Screen layout and map data
; ==================================================================

; ==================================================================
; SCREEN MAP CONSTANTS
; ==================================================================

EFFECT_ZONE_ENTRY_SIZE EQU 8
EFFECT_TYPE_SECRET_ZONE EQU 0
EFFECT_TYPE_WIND EQU 1
EFFECT_TYPE_WATER EQU 2
EFFECT_TYPE_CUSTOM_GRAVITY EQU 3
EFFECT_TYPE_ICE_PHYSICS EQU 4
EFFECT_TYPE_SPRITE_CONCEAL EQU 5
EFFECT_WIND_DIR_LEFT EQU 0
EFFECT_WIND_DIR_RIGHT EQU 1
EFFECT_WIND_DIR_UP EQU 2
EFFECT_WIND_DIR_DOWN EQU 3
SCREEN_RUNTIME_SUMMARY_ENTRY_SIZE EQU 4
SCREEN_RUNTIME_SUMMARY_OFFS_ANIM_GROUPS EQU 0
SCREEN_RUNTIME_SUMMARY_OFFS_ENTITY_COUNT EQU 1
SCREEN_RUNTIME_SUMMARY_OFFS_SPRITE_PATTERN_SLOTS EQU 2
SCREEN_RUNTIME_SUMMARY_OFFS_FLAGS EQU 3
SCREEN_RUNTIME_SUMMARY_FLAG_MUSIC_IN_GAME EQU #01
SCREEN_RUNTIME_SUMMARY_FLAG_HAS_HUD EQU #02
SCREEN_RUNTIME_SUMMARY_FLAG_HAS_EFFECTS EQU #04
SCREEN_RUNTIME_SUMMARY_FLAG_HAS_ANIM_TILES EQU #08
BOSS_PLACEMENT_ENTRY_SIZE EQU 11
BOSS_PLACEMENT_FLAG_ENABLED EQU #01

SCREEN_PAN1_0_ID EQU 0
SCREEN_PAN1_0_LAYOUT_BANK EQU ((SCREEN_PAN1_0_LAYOUT - #4000) / #2000)
SCREEN_PAN1_0_BEHAVIOR_SOURCE EQU 0
BEHAVIOR_PAN1_0_DATA_BANK EQU ((BEHAVIOR_PAN1_0_DATA - #4000) / #2000)
SCREEN_PAN1_0_CHAR_BEHAVIOR_TABLE_BANK EQU 0
SCREEN_PAN1_0_CHAR_BEHAVIOR_TABLE_SIZE EQU 0
SCREEN_PAN1_0_INTERACTION_TYPE_MAP_BANK EQU ((SCREEN_PAN1_0_INTERACTION_TYPE_MAP - #4000) / #2000)
SCREEN_PAN1_0_INTERACTION_VALUE_MAP_BANK EQU ((SCREEN_PAN1_0_INTERACTION_VALUE_MAP - #4000) / #2000)
SCREEN_PAN1_0_INTERACTION_TARGET_MAP_BANK EQU ((SCREEN_PAN1_0_INTERACTION_TARGET_MAP - #4000) / #2000)
SCREEN_PAN1_0_EFFECTS_LAYOUT_BANK EQU ((SCREEN_PAN1_0_EFFECTS_LAYOUT - #4000) / #2000)
SCREEN_PAN1_0_EFFECTS_LAYOUT_PRESENT EQU 1
SCREEN_PAN1_0_EFFECTS_LAYOUT_SIZE EQU 768
SCREEN_PAN1_0_EFFECT_ZONE_TABLE_BANK EQU ((SCREEN_PAN1_0_EFFECT_ZONE_TABLE - #4000) / #2000)
SCREEN_PAN1_0_EFFECT_ZONE_COUNT EQU 0
SCREEN_PAN1_0_EFFECT_ZONE_TABLE_SIZE EQU 0
SCREEN_PAN1_0_BOSS_TABLE_BANK EQU ((SCREEN_PAN1_0_BOSS_TABLE - #4000) / #2000)
SCREEN_PAN1_0_BOSS_COUNT EQU 0
SCREEN_PAN1_0_BOSS_TABLE_SIZE EQU 0
SCREEN_PAN1_0_BLOCK_LAYOUT_PRESENT EQU 0
SCREEN_PAN1_0_BLOCK_LAYOUT_MODE EQU 0
SCREEN_PAN1_0_BLOCK_CATALOG_BANK EQU 0
SCREEN_PAN1_0_BLOCK_CATALOG_COUNT EQU 0
SCREEN_PAN1_0_BLOCK_CATALOG_SIZE EQU 0
SCREEN_PAN1_0_BLOCK_MAP_BANK EQU 0
SCREEN_PAN1_0_BLOCK_MAP_WIDTH EQU 0
SCREEN_PAN1_0_BLOCK_MAP_HEIGHT EQU 0
SCREEN_PAN1_0_BLOCK_MAP_SIZE EQU 0
SCREEN_PAN1_0_BLOCK_TOTAL_SIZE EQU 0
SCREEN_PAN1_0_ANIM_GROUP_COUNT EQU 3
SCREEN_PAN1_0_ENTITY_COUNT EQU 2
SCREEN_PAN1_0_SPRITE_PATTERN_SLOTS EQU 53
SCREEN_PAN1_0_MUSIC_IN_GAME EQU 0
SCREEN_PAN1_0_SUMMARY_FLAGS EQU #0E
SCREEN_PAN2_1_ID EQU 1
SCREEN_PAN2_1_LAYOUT_BANK EQU ((SCREEN_PAN2_1_LAYOUT - #4000) / #2000)
SCREEN_PAN2_1_BEHAVIOR_SOURCE EQU 0
BEHAVIOR_PAN2_1_DATA_BANK EQU ((BEHAVIOR_PAN2_1_DATA - #4000) / #2000)
SCREEN_PAN2_1_CHAR_BEHAVIOR_TABLE_BANK EQU 0
SCREEN_PAN2_1_CHAR_BEHAVIOR_TABLE_SIZE EQU 0
SCREEN_PAN2_1_INTERACTION_TYPE_MAP_BANK EQU ((SCREEN_PAN2_1_INTERACTION_TYPE_MAP - #4000) / #2000)
SCREEN_PAN2_1_INTERACTION_VALUE_MAP_BANK EQU ((SCREEN_PAN2_1_INTERACTION_VALUE_MAP - #4000) / #2000)
SCREEN_PAN2_1_INTERACTION_TARGET_MAP_BANK EQU ((SCREEN_PAN2_1_INTERACTION_TARGET_MAP - #4000) / #2000)
SCREEN_PAN2_1_EFFECTS_LAYOUT_BANK EQU ((SCREEN_PAN2_1_EFFECTS_LAYOUT - #4000) / #2000)
SCREEN_PAN2_1_EFFECTS_LAYOUT_PRESENT EQU 1
SCREEN_PAN2_1_EFFECTS_LAYOUT_SIZE EQU 768
SCREEN_PAN2_1_EFFECT_ZONE_TABLE_BANK EQU ((SCREEN_PAN2_1_EFFECT_ZONE_TABLE - #4000) / #2000)
SCREEN_PAN2_1_EFFECT_ZONE_COUNT EQU 0
SCREEN_PAN2_1_EFFECT_ZONE_TABLE_SIZE EQU 0
SCREEN_PAN2_1_BOSS_TABLE_BANK EQU ((SCREEN_PAN2_1_BOSS_TABLE - #4000) / #2000)
SCREEN_PAN2_1_BOSS_COUNT EQU 0
SCREEN_PAN2_1_BOSS_TABLE_SIZE EQU 0
SCREEN_PAN2_1_BLOCK_LAYOUT_PRESENT EQU 0
SCREEN_PAN2_1_BLOCK_LAYOUT_MODE EQU 0
SCREEN_PAN2_1_BLOCK_CATALOG_BANK EQU 0
SCREEN_PAN2_1_BLOCK_CATALOG_COUNT EQU 0
SCREEN_PAN2_1_BLOCK_CATALOG_SIZE EQU 0
SCREEN_PAN2_1_BLOCK_MAP_BANK EQU 0
SCREEN_PAN2_1_BLOCK_MAP_WIDTH EQU 0
SCREEN_PAN2_1_BLOCK_MAP_HEIGHT EQU 0
SCREEN_PAN2_1_BLOCK_MAP_SIZE EQU 0
SCREEN_PAN2_1_BLOCK_TOTAL_SIZE EQU 0
SCREEN_PAN2_1_ANIM_GROUP_COUNT EQU 2
SCREEN_PAN2_1_ENTITY_COUNT EQU 0
SCREEN_PAN2_1_SPRITE_PATTERN_SLOTS EQU 1
SCREEN_PAN2_1_MUSIC_IN_GAME EQU 0
SCREEN_PAN2_1_SUMMARY_FLAGS EQU #0E
SCREEN_BACKGROUND1_2_ID EQU 2
SCREEN_BACKGROUND1_2_LAYOUT_BANK EQU ((SCREEN_BACKGROUND1_2_LAYOUT - #4000) / #2000)
SCREEN_BACKGROUND1_2_BEHAVIOR_SOURCE EQU 0
BEHAVIOR_BACKGROUND1_2_DATA_BANK EQU ((BEHAVIOR_BACKGROUND1_2_DATA - #4000) / #2000)
SCREEN_BACKGROUND1_2_CHAR_BEHAVIOR_TABLE_BANK EQU 0
SCREEN_BACKGROUND1_2_CHAR_BEHAVIOR_TABLE_SIZE EQU 0
SCREEN_BACKGROUND1_2_INTERACTION_TYPE_MAP_BANK EQU ((SCREEN_BACKGROUND1_2_INTERACTION_TYPE_MAP - #4000) / #2000)
SCREEN_BACKGROUND1_2_INTERACTION_VALUE_MAP_BANK EQU ((SCREEN_BACKGROUND1_2_INTERACTION_VALUE_MAP - #4000) / #2000)
SCREEN_BACKGROUND1_2_INTERACTION_TARGET_MAP_BANK EQU ((SCREEN_BACKGROUND1_2_INTERACTION_TARGET_MAP - #4000) / #2000)
SCREEN_BACKGROUND1_2_EFFECTS_LAYOUT_BANK EQU ((SCREEN_BACKGROUND1_2_EFFECTS_LAYOUT - #4000) / #2000)
SCREEN_BACKGROUND1_2_EFFECTS_LAYOUT_PRESENT EQU 1
SCREEN_BACKGROUND1_2_EFFECTS_LAYOUT_SIZE EQU 768
SCREEN_BACKGROUND1_2_EFFECT_ZONE_TABLE_BANK EQU ((SCREEN_BACKGROUND1_2_EFFECT_ZONE_TABLE - #4000) / #2000)
SCREEN_BACKGROUND1_2_EFFECT_ZONE_COUNT EQU 0
SCREEN_BACKGROUND1_2_EFFECT_ZONE_TABLE_SIZE EQU 0
SCREEN_BACKGROUND1_2_BOSS_TABLE_BANK EQU ((SCREEN_BACKGROUND1_2_BOSS_TABLE - #4000) / #2000)
SCREEN_BACKGROUND1_2_BOSS_COUNT EQU 0
SCREEN_BACKGROUND1_2_BOSS_TABLE_SIZE EQU 0
SCREEN_BACKGROUND1_2_BLOCK_LAYOUT_PRESENT EQU 0
SCREEN_BACKGROUND1_2_BLOCK_LAYOUT_MODE EQU 0
SCREEN_BACKGROUND1_2_BLOCK_CATALOG_BANK EQU 0
SCREEN_BACKGROUND1_2_BLOCK_CATALOG_COUNT EQU 0
SCREEN_BACKGROUND1_2_BLOCK_CATALOG_SIZE EQU 0
SCREEN_BACKGROUND1_2_BLOCK_MAP_BANK EQU 0
SCREEN_BACKGROUND1_2_BLOCK_MAP_WIDTH EQU 0
SCREEN_BACKGROUND1_2_BLOCK_MAP_HEIGHT EQU 0
SCREEN_BACKGROUND1_2_BLOCK_MAP_SIZE EQU 0
SCREEN_BACKGROUND1_2_BLOCK_TOTAL_SIZE EQU 0
SCREEN_BACKGROUND1_2_ANIM_GROUP_COUNT EQU 0
SCREEN_BACKGROUND1_2_ENTITY_COUNT EQU 0
SCREEN_BACKGROUND1_2_SPRITE_PATTERN_SLOTS EQU 1
SCREEN_BACKGROUND1_2_MUSIC_IN_GAME EQU 0
SCREEN_BACKGROUND1_2_SUMMARY_FLAGS EQU #04
SCREEN_PAN3_3_ID EQU 3
SCREEN_PAN3_3_LAYOUT_BANK EQU ((SCREEN_PAN3_3_LAYOUT - #4000) / #2000)
SCREEN_PAN3_3_BEHAVIOR_SOURCE EQU 0
BEHAVIOR_PAN3_3_DATA_BANK EQU ((BEHAVIOR_PAN3_3_DATA - #4000) / #2000)
SCREEN_PAN3_3_CHAR_BEHAVIOR_TABLE_BANK EQU 0
SCREEN_PAN3_3_CHAR_BEHAVIOR_TABLE_SIZE EQU 0
SCREEN_PAN3_3_INTERACTION_TYPE_MAP_BANK EQU ((SCREEN_PAN3_3_INTERACTION_TYPE_MAP - #4000) / #2000)
SCREEN_PAN3_3_INTERACTION_VALUE_MAP_BANK EQU ((SCREEN_PAN3_3_INTERACTION_VALUE_MAP - #4000) / #2000)
SCREEN_PAN3_3_INTERACTION_TARGET_MAP_BANK EQU ((SCREEN_PAN3_3_INTERACTION_TARGET_MAP - #4000) / #2000)
SCREEN_PAN3_3_EFFECTS_LAYOUT_BANK EQU ((SCREEN_PAN3_3_EFFECTS_LAYOUT - #4000) / #2000)
SCREEN_PAN3_3_EFFECTS_LAYOUT_PRESENT EQU 1
SCREEN_PAN3_3_EFFECTS_LAYOUT_SIZE EQU 768
SCREEN_PAN3_3_EFFECT_ZONE_TABLE_BANK EQU ((SCREEN_PAN3_3_EFFECT_ZONE_TABLE - #4000) / #2000)
SCREEN_PAN3_3_EFFECT_ZONE_COUNT EQU 0
SCREEN_PAN3_3_EFFECT_ZONE_TABLE_SIZE EQU 0
SCREEN_PAN3_3_BOSS_TABLE_BANK EQU ((SCREEN_PAN3_3_BOSS_TABLE - #4000) / #2000)
SCREEN_PAN3_3_BOSS_COUNT EQU 0
SCREEN_PAN3_3_BOSS_TABLE_SIZE EQU 0
SCREEN_PAN3_3_BLOCK_LAYOUT_PRESENT EQU 0
SCREEN_PAN3_3_BLOCK_LAYOUT_MODE EQU 0
SCREEN_PAN3_3_BLOCK_CATALOG_BANK EQU 0
SCREEN_PAN3_3_BLOCK_CATALOG_COUNT EQU 0
SCREEN_PAN3_3_BLOCK_CATALOG_SIZE EQU 0
SCREEN_PAN3_3_BLOCK_MAP_BANK EQU 0
SCREEN_PAN3_3_BLOCK_MAP_WIDTH EQU 0
SCREEN_PAN3_3_BLOCK_MAP_HEIGHT EQU 0
SCREEN_PAN3_3_BLOCK_MAP_SIZE EQU 0
SCREEN_PAN3_3_BLOCK_TOTAL_SIZE EQU 0
SCREEN_PAN3_3_ANIM_GROUP_COUNT EQU 2
SCREEN_PAN3_3_ENTITY_COUNT EQU 2
SCREEN_PAN3_3_SPRITE_PATTERN_SLOTS EQU 11
SCREEN_PAN3_3_MUSIC_IN_GAME EQU 0
SCREEN_PAN3_3_SUMMARY_FLAGS EQU #0E
SCREEN_PAN4_4_ID EQU 4
SCREEN_PAN4_4_LAYOUT_BANK EQU ((SCREEN_PAN4_4_LAYOUT - #4000) / #2000)
SCREEN_PAN4_4_BEHAVIOR_SOURCE EQU 0
BEHAVIOR_PAN4_4_DATA_BANK EQU ((BEHAVIOR_PAN4_4_DATA - #4000) / #2000)
SCREEN_PAN4_4_CHAR_BEHAVIOR_TABLE_BANK EQU 0
SCREEN_PAN4_4_CHAR_BEHAVIOR_TABLE_SIZE EQU 0
SCREEN_PAN4_4_INTERACTION_TYPE_MAP_BANK EQU ((SCREEN_PAN4_4_INTERACTION_TYPE_MAP - #4000) / #2000)
SCREEN_PAN4_4_INTERACTION_VALUE_MAP_BANK EQU ((SCREEN_PAN4_4_INTERACTION_VALUE_MAP - #4000) / #2000)
SCREEN_PAN4_4_INTERACTION_TARGET_MAP_BANK EQU ((SCREEN_PAN4_4_INTERACTION_TARGET_MAP - #4000) / #2000)
SCREEN_PAN4_4_EFFECTS_LAYOUT_BANK EQU ((SCREEN_PAN4_4_EFFECTS_LAYOUT - #4000) / #2000)
SCREEN_PAN4_4_EFFECTS_LAYOUT_PRESENT EQU 1
SCREEN_PAN4_4_EFFECTS_LAYOUT_SIZE EQU 768
SCREEN_PAN4_4_EFFECT_ZONE_TABLE_BANK EQU ((SCREEN_PAN4_4_EFFECT_ZONE_TABLE - #4000) / #2000)
SCREEN_PAN4_4_EFFECT_ZONE_COUNT EQU 0
SCREEN_PAN4_4_EFFECT_ZONE_TABLE_SIZE EQU 0
SCREEN_PAN4_4_BOSS_TABLE_BANK EQU ((SCREEN_PAN4_4_BOSS_TABLE - #4000) / #2000)
SCREEN_PAN4_4_BOSS_COUNT EQU 0
SCREEN_PAN4_4_BOSS_TABLE_SIZE EQU 0
SCREEN_PAN4_4_BLOCK_LAYOUT_PRESENT EQU 0
SCREEN_PAN4_4_BLOCK_LAYOUT_MODE EQU 0
SCREEN_PAN4_4_BLOCK_CATALOG_BANK EQU 0
SCREEN_PAN4_4_BLOCK_CATALOG_COUNT EQU 0
SCREEN_PAN4_4_BLOCK_CATALOG_SIZE EQU 0
SCREEN_PAN4_4_BLOCK_MAP_BANK EQU 0
SCREEN_PAN4_4_BLOCK_MAP_WIDTH EQU 0
SCREEN_PAN4_4_BLOCK_MAP_HEIGHT EQU 0
SCREEN_PAN4_4_BLOCK_MAP_SIZE EQU 0
SCREEN_PAN4_4_BLOCK_TOTAL_SIZE EQU 0
SCREEN_PAN4_4_ANIM_GROUP_COUNT EQU 2
SCREEN_PAN4_4_ENTITY_COUNT EQU 0
SCREEN_PAN4_4_SPRITE_PATTERN_SLOTS EQU 1
SCREEN_PAN4_4_MUSIC_IN_GAME EQU 0
SCREEN_PAN4_4_SUMMARY_FLAGS EQU #0E

; ==================================================================
; SCREEN RUNTIME SUMMARY TABLE
; anim_groups: animated tile groups visible in this screen
; entity_count: entity instances assigned to this screen
; sprite_pattern_slots: SPRPAT slots needed by this screen's entity runtime set
; flags bit0=music_in_game, bit1=has_hud, bit2=has_effects, bit3=has_anim_tiles
; ==================================================================

screen_runtime_summary_table:
    db 3, 2, 53, #0E    ; Screen 0: pan1
    db 2, 0, 1, #0E    ; Screen 1: pan2
    db 0, 0, 1, #04    ; Screen 2: background1
    db 2, 2, 11, #0E    ; Screen 3: pan3
    db 2, 0, 1, #0E    ; Screen 4: pan4

; ==================================================================
; SCREEN MAP DATA
; ==================================================================

; [SCREEN_PAN1_0_LAYOUT emitted in bank4 section]
; [SCREEN_PAN1_0_EFFECTS_LAYOUT emitted in bank4 section]
; [SCREEN_PAN1_0_EFFECT_ZONE_TABLE emitted in bank4 section]
; [SCREEN_PAN1_0_BOSS_TABLE emitted in bank4 section]
; [SCREEN_PAN1_0_INTERACTION_TYPE_MAP emitted in bank4 section]
; [SCREEN_PAN1_0_INTERACTION_VALUE_MAP emitted in bank4 section]
; [SCREEN_PAN1_0_INTERACTION_TARGET_MAP emitted in bank4 section]
; [BEHAVIOR_PAN1_0_DATA emitted in bank4 section]


; [SCREEN_PAN2_1_LAYOUT emitted in bank4 section]
; [SCREEN_PAN2_1_EFFECTS_LAYOUT emitted in bank4 section]
; [SCREEN_PAN2_1_EFFECT_ZONE_TABLE emitted in bank4 section]
; [SCREEN_PAN2_1_BOSS_TABLE emitted in bank4 section]
; [SCREEN_PAN2_1_INTERACTION_TYPE_MAP emitted in bank4 section]
; [SCREEN_PAN2_1_INTERACTION_VALUE_MAP emitted in bank4 section]
; [SCREEN_PAN2_1_INTERACTION_TARGET_MAP emitted in bank4 section]
; [BEHAVIOR_PAN2_1_DATA emitted in bank4 section]


; [SCREEN_BACKGROUND1_2_LAYOUT emitted in bank4 section]
; [SCREEN_BACKGROUND1_2_EFFECTS_LAYOUT emitted in bank4 section]
; [SCREEN_BACKGROUND1_2_EFFECT_ZONE_TABLE emitted in bank4 section]
; [SCREEN_BACKGROUND1_2_BOSS_TABLE emitted in bank4 section]
; [SCREEN_BACKGROUND1_2_INTERACTION_TYPE_MAP emitted in bank4 section]
; [SCREEN_BACKGROUND1_2_INTERACTION_VALUE_MAP emitted in bank4 section]
; [SCREEN_BACKGROUND1_2_INTERACTION_TARGET_MAP emitted in bank4 section]
; [BEHAVIOR_BACKGROUND1_2_DATA emitted in bank4 section]


; [SCREEN_PAN3_3_LAYOUT emitted in bank4 section]
; [SCREEN_PAN3_3_EFFECTS_LAYOUT emitted in bank4 section]
; [SCREEN_PAN3_3_EFFECT_ZONE_TABLE emitted in bank4 section]
; [SCREEN_PAN3_3_BOSS_TABLE emitted in bank4 section]
; [SCREEN_PAN3_3_INTERACTION_TYPE_MAP emitted in bank4 section]
; [SCREEN_PAN3_3_INTERACTION_VALUE_MAP emitted in bank4 section]
; [SCREEN_PAN3_3_INTERACTION_TARGET_MAP emitted in bank4 section]
; [BEHAVIOR_PAN3_3_DATA emitted in bank4 section]


; [SCREEN_PAN4_4_LAYOUT emitted in bank4 section]
; [SCREEN_PAN4_4_EFFECTS_LAYOUT emitted in bank4 section]
; [SCREEN_PAN4_4_EFFECT_ZONE_TABLE emitted in bank4 section]
; [SCREEN_PAN4_4_BOSS_TABLE emitted in bank4 section]
; [SCREEN_PAN4_4_INTERACTION_TYPE_MAP emitted in bank4 section]
; [SCREEN_PAN4_4_INTERACTION_VALUE_MAP emitted in bank4 section]
; [SCREEN_PAN4_4_INTERACTION_TARGET_MAP emitted in bank4 section]
; [BEHAVIOR_PAN4_4_DATA emitted in bank4 section]


show_presentation_screen:
    ret

; ==================================================================
; SCREEN LOADING FUNCTIONS
; ==================================================================

; Color shift lookup table (0-15 shifted to high nibble)
; OPTIMIZED: Table lookup is faster than 4× RLCA (11 cycles vs 16 cycles)
color_shift_table:
    db #00, #10, #20, #30, #40, #50, #60, #70
    db #80, #90, #A0, #B0, #C0, #D0, #E0, #F0

; Helper function to set VDP background and border colors
; Input: A = background color (0-15), B = border color (0-15)
set_screen_colors:
    push af
    push bc
    push hl

    ; Set VDP Register 7: [Background Color (4-7) | Border Color (0-3)]

    ; OPTIMIZED: Use lookup table instead of 4× RLCA
    ; Process Background Color (in A) -> High Nibble
    and #0F                    ; Ensure 0-15 range
    ld hl, color_shift_table
    add a, l                   ; Add offset to table base
    ld l, a
    adc a, h                   ; Handle carry
    sub l
    ld h, a
    ld a, (hl)                 ; A = background color << 4
    ld c, a                    ; Save shifted background in C

    ; Process Border Color (in B) -> Low Nibble
    ld a, b                    ; Get border color
    and #0F                    ; Ensure 0-15 range

    ; Combine
    or c                       ; Combine: background << 4 | border

    ld b, a                    ; Value for VDP R#7
    ld c, 7                    ; VDP Register 7
    call FAST_WRTVDP           ; BIOS call to write VDP register

    pop hl
    pop bc
    pop af
    ret

; Helper function to initialize character 0 (empty cell) with background color
; Input: A = background color (0-15)
; This ensures empty cells show the correct background color instead of BIOS default (blue)
init_char0_color:
    push af
    push bc
    push de
    push hl
    
    ; Calculate color byte: (bg_color << 4) | bg_color
    ; This makes both foreground and background the same color
    and #0F                    ; Ensure 0-15 range
    ld b, a                    ; Save in B
    rlca                       ; Shift to high nibble
    rlca
    rlca
    rlca
    or b                       ; Combine: bg_color in both nibbles
    ld b, a                    ; B = color byte to write
    
    ; Write color to character 0 in all 3 banks (8 bytes each)
    ; Bank 0: CLRTBL2 + (0 * 8)
    ld a, b                    ; Fill byte = background color in both nibbles
    ld hl, CLRTBL2
    ld bc, 8                   ; 8 bytes per character
    call FAST_FILLVRM
    
    ; Bank 1: CLRTBL2 + #800 + (0 * 8)
    ld a, b
    ld hl, CLRTBL2 + #800
    ld bc, 8
    call FAST_FILLVRM
    
    ; Bank 2: CLRTBL2 + #1000 + (0 * 8)
    ld a, b
    ld hl, CLRTBL2 + #1000
    ld bc, 8
    call FAST_FILLVRM
    
    ; Also clear pattern for character 0 (all zeros = blank)
    ; Bank 0: CHRTBL2 + (0 * 8)
    xor a                      ; A = 0 (blank pattern)
    ld hl, CHRTBL2
    ld bc, 8
    call FAST_FILLVRM
    
    ; Bank 1: CHRTBL2 + #800 + (0 * 8)
    xor a
    ld hl, CHRTBL2 + #800
    ld bc, 8
    call FAST_FILLVRM
    
    ; Bank 2: CHRTBL2 + #1000 + (0 * 8)
    xor a
    ld hl, CHRTBL2 + #1000
    ld bc, 8
    call FAST_FILLVRM
    
    pop hl
    pop de
    pop bc
    pop af
    ret

; Helper: Copy rectangular area from screen layout (RAM) to Name Table (VRAM)
; Input: HL = source in RAM
;        DE = destination in VRAM
;        A  = number of rows
;        C  = bytes per row (width)
copy_layout_rect_to_vram:
    or a
    ret z
    ld b, a
    ld a, c
    or a
    ret z
    ld a, b

.copy_rect_row_loop:
    push af
    push bc
    push hl
    push de
    ld b, 0
    call FAST_LDIRVM
    pop de
    pop hl
    pop bc
    pop af

    dec a
    ret z
    ; HL/DE were restored by push/pop, so advance a full row (32 bytes)
    push bc
    ld bc, 32
    add hl, bc
    ex de, hl
    add hl, bc
    ex de, hl
    pop bc
    jr .copy_rect_row_loop

; Helper: Copy rectangular area between 32-byte rows in RAM
; Input: HL = source in RAM
;        DE = destination in RAM
;        A  = number of rows
;        C  = bytes per row (width)
copy_layout_rect_ram_to_ram:
    or a
    ret z
    ld b, a
    ld a, c
    or a
    ret z
    ld a, b

.copy_rect_ram_row_loop:
    push af
    push bc
    push hl
    push de
    ld b, 0
    ldir
    pop de
    pop hl
    pop bc
    pop af

    dec a
    ret z
    ; HL/DE were restored by push/pop, so advance a full row (32 bytes)
    push bc
    ld bc, 32
    add hl, bc
    ex de, hl
    add hl, bc
    ex de, hl
    pop bc
    jr .copy_rect_ram_row_loop

; Register Contract:
;   Purpose: Expand a block-optimized screen background into the linear 32x24 runtime layout buffer.
;   Inputs:
;     - A = block width/mode (2 or 4)
;     - HL = block catalog source pointer
;     - DE = block index map source pointer
;   Outputs:
;     - runtime_background_layout rebuilt as a linear 32x24 byte map
;   Clobbers:
;     - AF
;     - BC
;     - DE
;     - HL
;   Preserved:
;     - IX
;     - IY
;   Notes:
;     - Uses screen_block_catalog_ptr and screen_block_map_ptr as scratch pointers.
;     - Callers should copy runtime_background_layout to runtime_screen_layout after expansion.
expand_screen_block_layout_to_background:
    ld (screen_block_catalog_ptr), hl
    ld (screen_block_map_ptr), de
    cp 4
    jp z, expand_screen_block_layout_4x4
    cp 2
    jp z, expand_screen_block_layout_2x2
    ret

expand_screen_block_layout_2x2:
    ld de, runtime_background_layout
    ld c, 12
.expand2x2_row_loop:
    ld b, 16
.expand2x2_col_loop:
    push bc
    push de
    ld hl, (screen_block_map_ptr)
    ld a, (hl)
    inc hl
    ld (screen_block_map_ptr), hl
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    ld bc, (screen_block_catalog_ptr)
    add hl, bc
    pop de
    push de
    ld a, (hl)
    ld (de), a
    inc hl
    inc de
    ld a, (hl)
    ld (de), a
    pop de
    push de
    inc hl
    push bc
    ld bc, 32
    ex de, hl
    add hl, bc
    ex de, hl
    pop bc
    ld a, (hl)
    ld (de), a
    inc hl
    inc de
    ld a, (hl)
    ld (de), a
    pop de
    inc de
    inc de
    pop bc
    dec b
    jp nz, .expand2x2_col_loop
    push bc
    ld bc, 32
    ex de, hl
    add hl, bc
    ex de, hl
    pop bc
    dec c
    jp nz, .expand2x2_row_loop
    ret

expand_screen_block_layout_4x4:
    push ix
    push iy
    ld de, runtime_background_layout
    ld c, 6
.expand4x4_row_loop:
    ld b, 8
.expand4x4_col_loop:
    push bc
    ld hl, (screen_block_map_ptr)
    ld a, (hl)
    inc hl
    ld (screen_block_map_ptr), hl
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld bc, (screen_block_catalog_ptr)
    add hl, bc
    push hl
    pop ix                    ; IX = source block base (16 bytes)
    push de
    pop iy                    ; IY = destination block base in runtime_background_layout

    ; Row 0: copy catalog bytes +0..+3 to destination +0..+3
    push bc
    push ix
    pop hl
    push iy
    pop de
    ld bc, 4
    ldir
    pop bc

    ; Row 1: copy catalog bytes +4..+7 to destination +32..+35
    push bc
    push ix
    pop hl
    ld bc, 4
    add hl, bc
    push hl
    push iy
    pop hl
    ld bc, 32
    add hl, bc
    ex de, hl
    pop hl
    ld bc, 4
    ldir
    pop bc

    ; Row 2: copy catalog bytes +8..+11 to destination +64..+67
    push bc
    push ix
    pop hl
    ld bc, 8
    add hl, bc
    push hl
    push iy
    pop hl
    ld bc, 64
    add hl, bc
    ex de, hl
    pop hl
    ld bc, 4
    ldir
    pop bc

    ; Row 3: copy catalog bytes +12..+15 to destination +96..+99
    push bc
    push ix
    pop hl
    ld bc, 12
    add hl, bc
    push hl
    push iy
    pop hl
    ld bc, 96
    add hl, bc
    ex de, hl
    pop hl
    ld bc, 4
    ldir
    pop bc

    ; Advance destination base by one 4-char block horizontally
    push iy
    pop hl
    ld bc, 4
    add hl, bc
    ex de, hl
    pop bc
    dec b
    jp nz, .expand4x4_col_loop
    push bc
    ld bc, 96
    ex de, hl
    add hl, bc
    ex de, hl
    pop bc
    dec c
    jp nz, .expand4x4_row_loop
    pop iy
    pop ix
    ret

; Register Contract:
;   Purpose: Rebuild runtime_behavior_map from the current runtime_screen_layout using the per-screen char behavior table.
;   Inputs:
;     - HL = source screen layout pointer (normally runtime_screen_layout)
;   Outputs:
;     - runtime_behavior_map rebuilt in RAM
;   Clobbers:
;     - AF
;     - BC
;     - DE
;     - HL
;   Preserved:
;     - IX
;     - IY
;   Notes:
;     - Uses screen_block_catalog_ptr and screen_block_map_ptr as generic scratch pointers during the rebuild.
build_runtime_behavior_map_from_screen_layout:
    ld (screen_block_map_ptr), hl
    ld hl, runtime_behavior_map
    ld (screen_block_catalog_ptr), hl
    ld bc, RUNTIME_SCREEN_MAP_SIZE
.build_behavior_loop:
    ld a, b
    or c
    ret z
    ld hl, (screen_block_map_ptr)
    ld a, (hl)
    inc hl
    ld (screen_block_map_ptr), hl
    ld l, a
    ld h, 0
    ld de, runtime_char_behavior_table
    add hl, de
    ld a, (hl)
    ld hl, (screen_block_catalog_ptr)
    ld (hl), a
    inc hl
    ld (screen_block_catalog_ptr), hl
    dec bc
    jr .build_behavior_loop

load_screen:

    ; Load screen (A = screen ID)
    ; TODO: Implement screen loading logic
    ret

hud_imported_frame_pan1_770754008863_data:
    ; Imported HUD frame snapshot for pan1 (96 cells)
    DB #00,#00,#84
    DB #01,#00,#84
    DB #02,#00,#84
    DB #03,#00,#84
    DB #04,#00,#84
    DB #05,#00,#84
    DB #06,#00,#84
    DB #07,#00,#84
    DB #08,#00,#84
    DB #09,#00,#84
    DB #0A,#00,#84
    DB #0B,#00,#84
    DB #0C,#00,#84
    DB #0D,#00,#84
    DB #0E,#00,#84
    DB #0F,#00,#84
    DB #10,#00,#84
    DB #11,#00,#84
    DB #12,#00,#84
    DB #13,#00,#84
    DB #14,#00,#84
    DB #15,#00,#84
    DB #16,#00,#84
    DB #17,#00,#84
    DB #18,#00,#84
    DB #19,#00,#84
    DB #1A,#00,#84
    DB #1B,#00,#84
    DB #1C,#00,#84
    DB #1D,#00,#84
    DB #1E,#00,#84
    DB #1F,#00,#84
    DB #20,#00,#00
    DB #21,#00,#00
    DB #22,#00,#00
    DB #23,#00,#00
    DB #24,#00,#00
    DB #25,#00,#00
    DB #26,#00,#00
    DB #27,#00,#00
    DB #28,#00,#00
    DB #29,#00,#00
    DB #2A,#00,#00
    DB #2B,#00,#00
    DB #2C,#00,#00
    DB #2D,#00,#00
    DB #2E,#00,#00
    DB #2F,#00,#00
    DB #30,#00,#00
    DB #31,#00,#00
    DB #32,#00,#00
    DB #33,#00,#00
    DB #34,#00,#00
    DB #35,#00,#00
    DB #36,#00,#00
    DB #37,#00,#00
    DB #38,#00,#00
    DB #39,#00,#00
    DB #3A,#00,#00
    DB #3B,#00,#00
    DB #3C,#00,#00
    DB #3D,#00,#00
    DB #3E,#00,#00
    DB #3F,#00,#00
    DB #40,#00,#84
    DB #41,#00,#84
    DB #42,#00,#84
    DB #43,#00,#84
    DB #44,#00,#84
    DB #45,#00,#84
    DB #46,#00,#84
    DB #47,#00,#84
    DB #48,#00,#84
    DB #49,#00,#84
    DB #4A,#00,#84
    DB #4B,#00,#84
    DB #4C,#00,#84
    DB #4D,#00,#84
    DB #4E,#00,#84
    DB #4F,#00,#84
    DB #50,#00,#84
    DB #51,#00,#84
    DB #52,#00,#84
    DB #53,#00,#84
    DB #54,#00,#84
    DB #55,#00,#84
    DB #56,#00,#84
    DB #57,#00,#84
    DB #58,#00,#84
    DB #59,#00,#84
    DB #5A,#00,#84
    DB #5B,#00,#84
    DB #5C,#00,#84
    DB #5D,#00,#84
    DB #5E,#00,#84
    DB #5F,#00,#84

hud_imported_frame_pan1_770754008863_draw:
    ; Draw imported HUD frame chars into Name Table
    ld hl, hud_imported_frame_pan1_770754008863_data
    ld bc, 96

hud_imported_frame_pan1_770754008863_draw_loop:
    ld a, b
    or c
    ret z

    ld e, (hl)                ; DE = Name Table offset
    inc hl
    ld d, (hl)
    inc hl
    ld a, (hl)                ; A = char code
    inc hl

    push hl
    ld h, d
    ld l, e
    ld de, NAMETBL
    add hl, de                ; HL = VRAM address
    call FAST_WRTVRM
    pop hl

    dec bc
    jr hud_imported_frame_pan1_770754008863_draw_loop

load_screen_pan1_770754008863:
    ; Load pan1 screen (fast direct port access)
    ; Active Area: X=0, Y=3, W=32, H=21
    ; Preserve HUD/non-active area: only overwrite active game area
    ld a, 1
    ld (current_screen_engine), a
    ld a, #FF
    ld (autocontrol_screen_id), a
    ; Set VDP colors FIRST (before loading screen data)
    ld a, 1           ; Background color
    ld b, 1       ; Border color
    call call_set_screen_colors_resident
    ; Initialize character 0 (empty cells) with background color
    ld a, 1           ; Background color for char 0
    call call_init_char0_color_resident
    ld a, (current_screen2_tilebank_id)
    cp SCREEN2_TILEBANK_TILEBANK_1770753778086_ID
    jr z, .load_pan1_770754008863_tilebank_ready
    call load_tilebank_tilebank_1770753778086_patterns_to_vram_far
    call load_tilebank_tilebank_1770753778086_colors_to_vram_far
    ld a, SCREEN2_TILEBANK_TILEBANK_1770753778086_ID
    ld (current_screen2_tilebank_id), a
    xor a
    ld (vram_cache_font_ready), a
    call call_init_font_system_resident
.load_pan1_770754008863_tilebank_ready:
    ; Clear hardware sprites on screen switch to avoid visual carry-over
    call call_clear_all_sprites_resident
    call call_update_sprites_to_vram_resident
    ; Rebuild mutable runtime screen background from RAM cache
    ld a, RESOURCE_ID_SCREEN_PAN1_0_LAYOUT
    call resource_load_screen_layout_cached
    ld a, RESOURCE_ID_SCREEN_PAN1_0_EFFECTS_LAYOUT
    call resource_load_effects_layout_cached
    ld a, RESOURCE_ID_BEHAVIOR_PAN1_0_DATA
    call resource_load_behavior_map_cached
    ld a, RESOURCE_ID_SCREEN_PAN1_0_INTERACTION_TYPE_MAP
    ld de, runtime_interaction_type_map
    call resource_load_to_ram_by_id
    ld a, RESOURCE_ID_SCREEN_PAN1_0_INTERACTION_VALUE_MAP
    ld de, runtime_interaction_value_map
    call resource_load_to_ram_by_id
    ld a, RESOURCE_ID_SCREEN_PAN1_0_INTERACTION_TARGET_MAP
    ld de, runtime_interaction_target_map
    call resource_load_to_ram_by_id
    ld a, 0
    ld (current_effect_zone_count), a
    or a
    jr z, .load_pan1_770754008863_zones_done
    ld a, RESOURCE_ID_SCREEN_PAN1_0_EFFECT_ZONE_TABLE
    call resource_load_effect_zone_table_cached
.load_pan1_770754008863_zones_done:
    ; Preserve HUD / non-active VRAM area: overwrite only gameplay rows
    ld hl, runtime_screen_layout + 96
    ld de, NAMETBL + 96
    ld bc, 672
    call FAST_LDIRVM
    ld a, 3
    ld (current_screen_anim_group_count), a
    ld a, 2
    ld (current_screen_entity_count), a
    ld a, 53
    ld (current_screen_sprite_pattern_slots), a
    ld a, SCREEN_PAN1_0_SUMMARY_FLAGS
    ld (current_screen_summary_flags), a
    ld a, SCREEN_PAN1_0_BOSS_COUNT
    ld (current_screen_boss_count), a
    or a
    jp z, load_pan1_770754008863_boss_done
    call mapper_push_p3
    ld a, SCREEN_PAN1_0_BOSS_TABLE_BANK & #FF
    call mapper_set_bank_p3
    ld hl, (SCREEN_PAN1_0_BOSS_TABLE & #1FFF) | #A000
    ld de, current_screen_boss_entry
    ld bc, BOSS_PLACEMENT_ENTRY_SIZE
    ldir
    call mapper_pop_p3
    ld hl, current_screen_boss_entry
    ld (current_screen_boss_table), hl
    ld a, #FF
    ld (current_screen_boss_table_bank), a
load_pan1_770754008863_boss_done:

    call call_update_animated_tiles_vram_resident
    call call_init_screen_boss_from_current_screen_resident
    ; Imported HUD frame is drawn on world/game start only
    ; Initialize collision system pointers for this screen
    ld hl, runtime_screen_layout
    ld (current_screen_layout), hl
    ld a, #FF
    ld (current_screen_layout_bank), a
    ld hl, runtime_behavior_map
    ld (current_behavior_map), hl
    ld a, #FF
    ld (current_behavior_map_bank), a
    ld a, l
    ld (behavior_cache_map_l), a
    ld a, h
    ld (behavior_cache_map_h), a
    ld a, #FF
    ld (behavior_cache_row), a
    xor a
    ld (secret_zone_active), a
    ld (secret_zone_rect_x), a
    ld (secret_zone_rect_y), a
    ld (secret_zone_rect_w), a
    ld (secret_zone_rect_h), a
    ld hl, entity_button_contact_active
    ld de, entity_button_contact_active + 1
    ld bc, 31
    ld (hl), a
    ldir
    ret

hud_imported_frame_pan2_771184738851_data:
    ; Imported HUD frame snapshot for pan2 (96 cells)
    DB #00,#00,#84
    DB #01,#00,#84
    DB #02,#00,#84
    DB #03,#00,#84
    DB #04,#00,#84
    DB #05,#00,#84
    DB #06,#00,#84
    DB #07,#00,#84
    DB #08,#00,#84
    DB #09,#00,#84
    DB #0A,#00,#84
    DB #0B,#00,#84
    DB #0C,#00,#84
    DB #0D,#00,#84
    DB #0E,#00,#84
    DB #0F,#00,#84
    DB #10,#00,#84
    DB #11,#00,#84
    DB #12,#00,#84
    DB #13,#00,#84
    DB #14,#00,#84
    DB #15,#00,#84
    DB #16,#00,#84
    DB #17,#00,#84
    DB #18,#00,#84
    DB #19,#00,#84
    DB #1A,#00,#84
    DB #1B,#00,#84
    DB #1C,#00,#84
    DB #1D,#00,#84
    DB #1E,#00,#84
    DB #1F,#00,#84
    DB #20,#00,#00
    DB #21,#00,#00
    DB #22,#00,#00
    DB #23,#00,#00
    DB #24,#00,#00
    DB #25,#00,#00
    DB #26,#00,#00
    DB #27,#00,#00
    DB #28,#00,#00
    DB #29,#00,#00
    DB #2A,#00,#00
    DB #2B,#00,#00
    DB #2C,#00,#00
    DB #2D,#00,#00
    DB #2E,#00,#00
    DB #2F,#00,#00
    DB #30,#00,#00
    DB #31,#00,#00
    DB #32,#00,#00
    DB #33,#00,#00
    DB #34,#00,#00
    DB #35,#00,#00
    DB #36,#00,#00
    DB #37,#00,#00
    DB #38,#00,#00
    DB #39,#00,#00
    DB #3A,#00,#00
    DB #3B,#00,#00
    DB #3C,#00,#00
    DB #3D,#00,#00
    DB #3E,#00,#00
    DB #3F,#00,#00
    DB #40,#00,#84
    DB #41,#00,#84
    DB #42,#00,#84
    DB #43,#00,#84
    DB #44,#00,#84
    DB #45,#00,#84
    DB #46,#00,#84
    DB #47,#00,#84
    DB #48,#00,#84
    DB #49,#00,#84
    DB #4A,#00,#84
    DB #4B,#00,#84
    DB #4C,#00,#84
    DB #4D,#00,#84
    DB #4E,#00,#84
    DB #4F,#00,#84
    DB #50,#00,#84
    DB #51,#00,#84
    DB #52,#00,#84
    DB #53,#00,#84
    DB #54,#00,#84
    DB #55,#00,#84
    DB #56,#00,#84
    DB #57,#00,#84
    DB #58,#00,#84
    DB #59,#00,#84
    DB #5A,#00,#84
    DB #5B,#00,#84
    DB #5C,#00,#84
    DB #5D,#00,#84
    DB #5E,#00,#84
    DB #5F,#00,#84

hud_imported_frame_pan2_771184738851_draw:
    ; Draw imported HUD frame chars into Name Table
    ld hl, hud_imported_frame_pan2_771184738851_data
    ld bc, 96

hud_imported_frame_pan2_771184738851_draw_loop:
    ld a, b
    or c
    ret z

    ld e, (hl)                ; DE = Name Table offset
    inc hl
    ld d, (hl)
    inc hl
    ld a, (hl)                ; A = char code
    inc hl

    push hl
    ld h, d
    ld l, e
    ld de, NAMETBL
    add hl, de                ; HL = VRAM address
    call FAST_WRTVRM
    pop hl

    dec bc
    jr hud_imported_frame_pan2_771184738851_draw_loop

load_screen_pan2_771184738851:
    ; Load pan2 screen (fast direct port access)
    ; Active Area: X=0, Y=3, W=32, H=21
    ; Preserve HUD/non-active area: only overwrite active game area
    ld a, 1
    ld (current_screen_engine), a
    ld a, #FF
    ld (autocontrol_screen_id), a
    ; Set VDP colors FIRST (before loading screen data)
    ld a, 1           ; Background color
    ld b, 1       ; Border color
    call call_set_screen_colors_resident
    ; Initialize character 0 (empty cells) with background color
    ld a, 1           ; Background color for char 0
    call call_init_char0_color_resident
    ld a, (current_screen2_tilebank_id)
    cp SCREEN2_TILEBANK_TILEBANK_1770753778086_ID
    jr z, .load_pan2_771184738851_tilebank_ready
    call load_tilebank_tilebank_1770753778086_patterns_to_vram_far
    call load_tilebank_tilebank_1770753778086_colors_to_vram_far
    ld a, SCREEN2_TILEBANK_TILEBANK_1770753778086_ID
    ld (current_screen2_tilebank_id), a
    xor a
    ld (vram_cache_font_ready), a
    call call_init_font_system_resident
.load_pan2_771184738851_tilebank_ready:
    ; Clear hardware sprites on screen switch to avoid visual carry-over
    call call_clear_all_sprites_resident
    call call_update_sprites_to_vram_resident
    ; Rebuild mutable runtime screen background from RAM cache
    ld a, RESOURCE_ID_SCREEN_PAN2_1_LAYOUT
    call resource_load_screen_layout_cached
    ld a, RESOURCE_ID_SCREEN_PAN2_1_EFFECTS_LAYOUT
    call resource_load_effects_layout_cached
    ld a, RESOURCE_ID_BEHAVIOR_PAN2_1_DATA
    call resource_load_behavior_map_cached
    ld a, RESOURCE_ID_SCREEN_PAN2_1_INTERACTION_TYPE_MAP
    ld de, runtime_interaction_type_map
    call resource_load_to_ram_by_id
    ld a, RESOURCE_ID_SCREEN_PAN2_1_INTERACTION_VALUE_MAP
    ld de, runtime_interaction_value_map
    call resource_load_to_ram_by_id
    ld a, RESOURCE_ID_SCREEN_PAN2_1_INTERACTION_TARGET_MAP
    ld de, runtime_interaction_target_map
    call resource_load_to_ram_by_id
    ld a, 0
    ld (current_effect_zone_count), a
    or a
    jr z, .load_pan2_771184738851_zones_done
    ld a, RESOURCE_ID_SCREEN_PAN2_1_EFFECT_ZONE_TABLE
    call resource_load_effect_zone_table_cached
.load_pan2_771184738851_zones_done:
    ; Preserve HUD / non-active VRAM area: overwrite only gameplay rows
    ld hl, runtime_screen_layout + 96
    ld de, NAMETBL + 96
    ld bc, 672
    call FAST_LDIRVM
    ld a, 2
    ld (current_screen_anim_group_count), a
    ld a, 0
    ld (current_screen_entity_count), a
    ld a, 1
    ld (current_screen_sprite_pattern_slots), a
    ld a, SCREEN_PAN2_1_SUMMARY_FLAGS
    ld (current_screen_summary_flags), a
    ld a, SCREEN_PAN2_1_BOSS_COUNT
    ld (current_screen_boss_count), a
    or a
    jp z, load_pan2_771184738851_boss_done
    call mapper_push_p3
    ld a, SCREEN_PAN2_1_BOSS_TABLE_BANK & #FF
    call mapper_set_bank_p3
    ld hl, (SCREEN_PAN2_1_BOSS_TABLE & #1FFF) | #A000
    ld de, current_screen_boss_entry
    ld bc, BOSS_PLACEMENT_ENTRY_SIZE
    ldir
    call mapper_pop_p3
    ld hl, current_screen_boss_entry
    ld (current_screen_boss_table), hl
    ld a, #FF
    ld (current_screen_boss_table_bank), a
load_pan2_771184738851_boss_done:

    call call_update_animated_tiles_vram_resident
    call call_init_screen_boss_from_current_screen_resident
    ; Imported HUD frame is drawn on world/game start only
    ; Initialize collision system pointers for this screen
    ld hl, runtime_screen_layout
    ld (current_screen_layout), hl
    ld a, #FF
    ld (current_screen_layout_bank), a
    ld hl, runtime_behavior_map
    ld (current_behavior_map), hl
    ld a, #FF
    ld (current_behavior_map_bank), a
    ld a, l
    ld (behavior_cache_map_l), a
    ld a, h
    ld (behavior_cache_map_h), a
    ld a, #FF
    ld (behavior_cache_row), a
    xor a
    ld (secret_zone_active), a
    ld (secret_zone_rect_x), a
    ld (secret_zone_rect_y), a
    ld (secret_zone_rect_w), a
    ld (secret_zone_rect_h), a
    ld hl, entity_button_contact_active
    ld de, entity_button_contact_active + 1
    ld bc, 31
    ld (hl), a
    ldir
    ret

load_screen_background1_771482721894:
    ; Load background1 screen (fast direct port access)
    ld a, 1
    ld (current_screen_engine), a
    ld a, #FF
    ld (autocontrol_screen_id), a
    ; Set VDP colors FIRST (before loading screen data)
    ld a, 1           ; Background color
    ld b, 1       ; Border color
    call call_set_screen_colors_resident
    ; Initialize character 0 (empty cells) with background color
    ld a, 1           ; Background color for char 0
    call call_init_char0_color_resident
    ld a, (current_screen2_tilebank_id)
    cp SCREEN2_TILEBANK_TILEBANK_1770753778086_ID
    jr z, .load_background1_771482721894_tilebank_ready
    call load_tilebank_tilebank_1770753778086_patterns_to_vram_far
    call load_tilebank_tilebank_1770753778086_colors_to_vram_far
    ld a, SCREEN2_TILEBANK_TILEBANK_1770753778086_ID
    ld (current_screen2_tilebank_id), a
    xor a
    ld (vram_cache_font_ready), a
    call call_init_font_system_resident
.load_background1_771482721894_tilebank_ready:
    ; Clear hardware sprites on screen switch to avoid visual carry-over
    call call_clear_all_sprites_resident
    call call_update_sprites_to_vram_resident
    ; Rebuild mutable runtime screen background from RAM cache
    ld a, RESOURCE_ID_SCREEN_BACKGROUND1_2_LAYOUT
    call resource_load_screen_layout_cached
    ld a, RESOURCE_ID_SCREEN_BACKGROUND1_2_EFFECTS_LAYOUT
    call resource_load_effects_layout_cached
    ld a, RESOURCE_ID_BEHAVIOR_BACKGROUND1_2_DATA
    call resource_load_behavior_map_cached
    ld a, RESOURCE_ID_SCREEN_BACKGROUND1_2_INTERACTION_TYPE_MAP
    ld de, runtime_interaction_type_map
    call resource_load_to_ram_by_id
    ld a, RESOURCE_ID_SCREEN_BACKGROUND1_2_INTERACTION_VALUE_MAP
    ld de, runtime_interaction_value_map
    call resource_load_to_ram_by_id
    ld a, RESOURCE_ID_SCREEN_BACKGROUND1_2_INTERACTION_TARGET_MAP
    ld de, runtime_interaction_target_map
    call resource_load_to_ram_by_id
    ld a, 0
    ld (current_effect_zone_count), a
    or a
    jr z, .load_background1_771482721894_zones_done
    ld a, RESOURCE_ID_SCREEN_BACKGROUND1_2_EFFECT_ZONE_TABLE
    call resource_load_effect_zone_table_cached
.load_background1_771482721894_zones_done:
    ; Now load screen layout (full 32x24) from runtime RAM buffer
    ld hl, runtime_screen_layout
    ld de, NAMETBL
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    call FAST_LDIRVM           ; Fast VRAM write (direct port access)
    ld a, 0
    ld (current_screen_anim_group_count), a
    ld a, 0
    ld (current_screen_entity_count), a
    ld a, 1
    ld (current_screen_sprite_pattern_slots), a
    ld a, SCREEN_BACKGROUND1_2_SUMMARY_FLAGS
    ld (current_screen_summary_flags), a
    ld a, SCREEN_BACKGROUND1_2_BOSS_COUNT
    ld (current_screen_boss_count), a
    or a
    jp z, load_background1_771482721894_boss_done
    call mapper_push_p3
    ld a, SCREEN_BACKGROUND1_2_BOSS_TABLE_BANK & #FF
    call mapper_set_bank_p3
    ld hl, (SCREEN_BACKGROUND1_2_BOSS_TABLE & #1FFF) | #A000
    ld de, current_screen_boss_entry
    ld bc, BOSS_PLACEMENT_ENTRY_SIZE
    ldir
    call mapper_pop_p3
    ld hl, current_screen_boss_entry
    ld (current_screen_boss_table), hl
    ld a, #FF
    ld (current_screen_boss_table_bank), a
load_background1_771482721894_boss_done:

    call call_init_screen_boss_from_current_screen_resident
    ; Initialize collision system pointers for this screen
    ld hl, runtime_screen_layout
    ld (current_screen_layout), hl
    ld a, #FF
    ld (current_screen_layout_bank), a
    ld hl, runtime_behavior_map
    ld (current_behavior_map), hl
    ld a, #FF
    ld (current_behavior_map_bank), a
    ld a, l
    ld (behavior_cache_map_l), a
    ld a, h
    ld (behavior_cache_map_h), a
    ld a, #FF
    ld (behavior_cache_row), a
    xor a
    ld (secret_zone_active), a
    ld (secret_zone_rect_x), a
    ld (secret_zone_rect_y), a
    ld (secret_zone_rect_w), a
    ld (secret_zone_rect_h), a
    ld hl, entity_button_contact_active
    ld de, entity_button_contact_active + 1
    ld bc, 31
    ld (hl), a
    ldir
    ret

hud_imported_frame_pan3_771880109228_data:
    ; Imported HUD frame snapshot for pan3 (96 cells)
    DB #00,#00,#84
    DB #01,#00,#84
    DB #02,#00,#84
    DB #03,#00,#84
    DB #04,#00,#84
    DB #05,#00,#84
    DB #06,#00,#84
    DB #07,#00,#84
    DB #08,#00,#84
    DB #09,#00,#84
    DB #0A,#00,#84
    DB #0B,#00,#84
    DB #0C,#00,#84
    DB #0D,#00,#84
    DB #0E,#00,#84
    DB #0F,#00,#84
    DB #10,#00,#84
    DB #11,#00,#84
    DB #12,#00,#84
    DB #13,#00,#84
    DB #14,#00,#84
    DB #15,#00,#84
    DB #16,#00,#84
    DB #17,#00,#84
    DB #18,#00,#84
    DB #19,#00,#84
    DB #1A,#00,#84
    DB #1B,#00,#84
    DB #1C,#00,#84
    DB #1D,#00,#84
    DB #1E,#00,#84
    DB #1F,#00,#84
    DB #20,#00,#00
    DB #21,#00,#00
    DB #22,#00,#00
    DB #23,#00,#00
    DB #24,#00,#00
    DB #25,#00,#00
    DB #26,#00,#00
    DB #27,#00,#00
    DB #28,#00,#00
    DB #29,#00,#00
    DB #2A,#00,#00
    DB #2B,#00,#00
    DB #2C,#00,#00
    DB #2D,#00,#00
    DB #2E,#00,#00
    DB #2F,#00,#00
    DB #30,#00,#00
    DB #31,#00,#00
    DB #32,#00,#00
    DB #33,#00,#00
    DB #34,#00,#00
    DB #35,#00,#00
    DB #36,#00,#00
    DB #37,#00,#00
    DB #38,#00,#00
    DB #39,#00,#00
    DB #3A,#00,#00
    DB #3B,#00,#00
    DB #3C,#00,#00
    DB #3D,#00,#00
    DB #3E,#00,#00
    DB #3F,#00,#00
    DB #40,#00,#84
    DB #41,#00,#84
    DB #42,#00,#84
    DB #43,#00,#84
    DB #44,#00,#84
    DB #45,#00,#84
    DB #46,#00,#84
    DB #47,#00,#84
    DB #48,#00,#84
    DB #49,#00,#84
    DB #4A,#00,#84
    DB #4B,#00,#84
    DB #4C,#00,#84
    DB #4D,#00,#84
    DB #4E,#00,#84
    DB #4F,#00,#84
    DB #50,#00,#84
    DB #51,#00,#84
    DB #52,#00,#84
    DB #53,#00,#84
    DB #54,#00,#84
    DB #55,#00,#84
    DB #56,#00,#84
    DB #57,#00,#84
    DB #58,#00,#84
    DB #59,#00,#84
    DB #5A,#00,#84
    DB #5B,#00,#84
    DB #5C,#00,#84
    DB #5D,#00,#84
    DB #5E,#00,#84
    DB #5F,#00,#84

hud_imported_frame_pan3_771880109228_draw:
    ; Draw imported HUD frame chars into Name Table
    ld hl, hud_imported_frame_pan3_771880109228_data
    ld bc, 96

hud_imported_frame_pan3_771880109228_draw_loop:
    ld a, b
    or c
    ret z

    ld e, (hl)                ; DE = Name Table offset
    inc hl
    ld d, (hl)
    inc hl
    ld a, (hl)                ; A = char code
    inc hl

    push hl
    ld h, d
    ld l, e
    ld de, NAMETBL
    add hl, de                ; HL = VRAM address
    call FAST_WRTVRM
    pop hl

    dec bc
    jr hud_imported_frame_pan3_771880109228_draw_loop

load_screen_pan3_771880109228:
    ; Load pan3 screen (fast direct port access)
    ; Active Area: X=0, Y=3, W=32, H=21
    ; Preserve HUD/non-active area: only overwrite active game area
    ld a, 1
    ld (current_screen_engine), a
    ld a, #FF
    ld (autocontrol_screen_id), a
    ; Set VDP colors FIRST (before loading screen data)
    ld a, 1           ; Background color
    ld b, 1       ; Border color
    call call_set_screen_colors_resident
    ; Initialize character 0 (empty cells) with background color
    ld a, 1           ; Background color for char 0
    call call_init_char0_color_resident
    ld a, (current_screen2_tilebank_id)
    cp SCREEN2_TILEBANK_TILEBANK_1770753778086_ID
    jr z, .load_pan3_771880109228_tilebank_ready
    call load_tilebank_tilebank_1770753778086_patterns_to_vram_far
    call load_tilebank_tilebank_1770753778086_colors_to_vram_far
    ld a, SCREEN2_TILEBANK_TILEBANK_1770753778086_ID
    ld (current_screen2_tilebank_id), a
    xor a
    ld (vram_cache_font_ready), a
    call call_init_font_system_resident
.load_pan3_771880109228_tilebank_ready:
    ; Clear hardware sprites on screen switch to avoid visual carry-over
    call call_clear_all_sprites_resident
    call call_update_sprites_to_vram_resident
    ; Rebuild mutable runtime screen background from RAM cache
    ld a, RESOURCE_ID_SCREEN_PAN3_3_LAYOUT
    call resource_load_screen_layout_cached
    ld a, RESOURCE_ID_SCREEN_PAN3_3_EFFECTS_LAYOUT
    call resource_load_effects_layout_cached
    ld a, RESOURCE_ID_BEHAVIOR_PAN3_3_DATA
    call resource_load_behavior_map_cached
    ld a, RESOURCE_ID_SCREEN_PAN3_3_INTERACTION_TYPE_MAP
    ld de, runtime_interaction_type_map
    call resource_load_to_ram_by_id
    ld a, RESOURCE_ID_SCREEN_PAN3_3_INTERACTION_VALUE_MAP
    ld de, runtime_interaction_value_map
    call resource_load_to_ram_by_id
    ld a, RESOURCE_ID_SCREEN_PAN3_3_INTERACTION_TARGET_MAP
    ld de, runtime_interaction_target_map
    call resource_load_to_ram_by_id
    ld a, 0
    ld (current_effect_zone_count), a
    or a
    jr z, .load_pan3_771880109228_zones_done
    ld a, RESOURCE_ID_SCREEN_PAN3_3_EFFECT_ZONE_TABLE
    call resource_load_effect_zone_table_cached
.load_pan3_771880109228_zones_done:
    ; Preserve HUD / non-active VRAM area: overwrite only gameplay rows
    ld hl, runtime_screen_layout + 96
    ld de, NAMETBL + 96
    ld bc, 672
    call FAST_LDIRVM
    ld a, 2
    ld (current_screen_anim_group_count), a
    ld a, 2
    ld (current_screen_entity_count), a
    ld a, 11
    ld (current_screen_sprite_pattern_slots), a
    ld a, SCREEN_PAN3_3_SUMMARY_FLAGS
    ld (current_screen_summary_flags), a
    ld a, SCREEN_PAN3_3_BOSS_COUNT
    ld (current_screen_boss_count), a
    or a
    jp z, load_pan3_771880109228_boss_done
    call mapper_push_p3
    ld a, SCREEN_PAN3_3_BOSS_TABLE_BANK & #FF
    call mapper_set_bank_p3
    ld hl, (SCREEN_PAN3_3_BOSS_TABLE & #1FFF) | #A000
    ld de, current_screen_boss_entry
    ld bc, BOSS_PLACEMENT_ENTRY_SIZE
    ldir
    call mapper_pop_p3
    ld hl, current_screen_boss_entry
    ld (current_screen_boss_table), hl
    ld a, #FF
    ld (current_screen_boss_table_bank), a
load_pan3_771880109228_boss_done:

    call call_update_animated_tiles_vram_resident
    call call_init_screen_boss_from_current_screen_resident
    ; Imported HUD frame is drawn on world/game start only
    ; Initialize collision system pointers for this screen
    ld hl, runtime_screen_layout
    ld (current_screen_layout), hl
    ld a, #FF
    ld (current_screen_layout_bank), a
    ld hl, runtime_behavior_map
    ld (current_behavior_map), hl
    ld a, #FF
    ld (current_behavior_map_bank), a
    ld a, l
    ld (behavior_cache_map_l), a
    ld a, h
    ld (behavior_cache_map_h), a
    ld a, #FF
    ld (behavior_cache_row), a
    xor a
    ld (secret_zone_active), a
    ld (secret_zone_rect_x), a
    ld (secret_zone_rect_y), a
    ld (secret_zone_rect_w), a
    ld (secret_zone_rect_h), a
    ld hl, entity_button_contact_active
    ld de, entity_button_contact_active + 1
    ld bc, 31
    ld (hl), a
    ldir
    ret

hud_imported_frame_pan4_772291683578_data:
    ; Imported HUD frame snapshot for pan4 (96 cells)
    DB #00,#00,#84
    DB #01,#00,#84
    DB #02,#00,#84
    DB #03,#00,#84
    DB #04,#00,#84
    DB #05,#00,#84
    DB #06,#00,#84
    DB #07,#00,#84
    DB #08,#00,#84
    DB #09,#00,#84
    DB #0A,#00,#84
    DB #0B,#00,#84
    DB #0C,#00,#84
    DB #0D,#00,#84
    DB #0E,#00,#84
    DB #0F,#00,#84
    DB #10,#00,#84
    DB #11,#00,#84
    DB #12,#00,#84
    DB #13,#00,#84
    DB #14,#00,#84
    DB #15,#00,#84
    DB #16,#00,#84
    DB #17,#00,#84
    DB #18,#00,#84
    DB #19,#00,#84
    DB #1A,#00,#84
    DB #1B,#00,#84
    DB #1C,#00,#84
    DB #1D,#00,#84
    DB #1E,#00,#84
    DB #1F,#00,#84
    DB #20,#00,#00
    DB #21,#00,#00
    DB #22,#00,#00
    DB #23,#00,#00
    DB #24,#00,#00
    DB #25,#00,#00
    DB #26,#00,#00
    DB #27,#00,#00
    DB #28,#00,#00
    DB #29,#00,#00
    DB #2A,#00,#00
    DB #2B,#00,#00
    DB #2C,#00,#00
    DB #2D,#00,#00
    DB #2E,#00,#00
    DB #2F,#00,#00
    DB #30,#00,#00
    DB #31,#00,#00
    DB #32,#00,#00
    DB #33,#00,#00
    DB #34,#00,#00
    DB #35,#00,#00
    DB #36,#00,#00
    DB #37,#00,#00
    DB #38,#00,#00
    DB #39,#00,#00
    DB #3A,#00,#00
    DB #3B,#00,#00
    DB #3C,#00,#00
    DB #3D,#00,#00
    DB #3E,#00,#00
    DB #3F,#00,#00
    DB #40,#00,#84
    DB #41,#00,#84
    DB #42,#00,#84
    DB #43,#00,#84
    DB #44,#00,#84
    DB #45,#00,#84
    DB #46,#00,#84
    DB #47,#00,#84
    DB #48,#00,#84
    DB #49,#00,#84
    DB #4A,#00,#84
    DB #4B,#00,#84
    DB #4C,#00,#84
    DB #4D,#00,#84
    DB #4E,#00,#84
    DB #4F,#00,#84
    DB #50,#00,#84
    DB #51,#00,#84
    DB #52,#00,#84
    DB #53,#00,#84
    DB #54,#00,#84
    DB #55,#00,#84
    DB #56,#00,#84
    DB #57,#00,#84
    DB #58,#00,#84
    DB #59,#00,#84
    DB #5A,#00,#84
    DB #5B,#00,#84
    DB #5C,#00,#84
    DB #5D,#00,#84
    DB #5E,#00,#84
    DB #5F,#00,#84

hud_imported_frame_pan4_772291683578_draw:
    ; Draw imported HUD frame chars into Name Table
    ld hl, hud_imported_frame_pan4_772291683578_data
    ld bc, 96

hud_imported_frame_pan4_772291683578_draw_loop:
    ld a, b
    or c
    ret z

    ld e, (hl)                ; DE = Name Table offset
    inc hl
    ld d, (hl)
    inc hl
    ld a, (hl)                ; A = char code
    inc hl

    push hl
    ld h, d
    ld l, e
    ld de, NAMETBL
    add hl, de                ; HL = VRAM address
    call FAST_WRTVRM
    pop hl

    dec bc
    jr hud_imported_frame_pan4_772291683578_draw_loop

load_screen_pan4_772291683578:
    ; Load pan4 screen (fast direct port access)
    ; Active Area: X=0, Y=3, W=32, H=21
    ; Preserve HUD/non-active area: only overwrite active game area
    ld a, 1
    ld (current_screen_engine), a
    ld a, #FF
    ld (autocontrol_screen_id), a
    ; Set VDP colors FIRST (before loading screen data)
    ld a, 1           ; Background color
    ld b, 1       ; Border color
    call call_set_screen_colors_resident
    ; Initialize character 0 (empty cells) with background color
    ld a, 1           ; Background color for char 0
    call call_init_char0_color_resident
    ld a, (current_screen2_tilebank_id)
    cp SCREEN2_TILEBANK_TILEBANK_1770753778086_ID
    jr z, .load_pan4_772291683578_tilebank_ready
    call load_tilebank_tilebank_1770753778086_patterns_to_vram_far
    call load_tilebank_tilebank_1770753778086_colors_to_vram_far
    ld a, SCREEN2_TILEBANK_TILEBANK_1770753778086_ID
    ld (current_screen2_tilebank_id), a
    xor a
    ld (vram_cache_font_ready), a
    call call_init_font_system_resident
.load_pan4_772291683578_tilebank_ready:
    ; Clear hardware sprites on screen switch to avoid visual carry-over
    call call_clear_all_sprites_resident
    call call_update_sprites_to_vram_resident
    ; Rebuild mutable runtime screen background from RAM cache
    ld a, RESOURCE_ID_SCREEN_PAN4_4_LAYOUT
    call resource_load_screen_layout_cached
    ld a, RESOURCE_ID_SCREEN_PAN4_4_EFFECTS_LAYOUT
    call resource_load_effects_layout_cached
    ld a, RESOURCE_ID_BEHAVIOR_PAN4_4_DATA
    call resource_load_behavior_map_cached
    ld a, RESOURCE_ID_SCREEN_PAN4_4_INTERACTION_TYPE_MAP
    ld de, runtime_interaction_type_map
    call resource_load_to_ram_by_id
    ld a, RESOURCE_ID_SCREEN_PAN4_4_INTERACTION_VALUE_MAP
    ld de, runtime_interaction_value_map
    call resource_load_to_ram_by_id
    ld a, RESOURCE_ID_SCREEN_PAN4_4_INTERACTION_TARGET_MAP
    ld de, runtime_interaction_target_map
    call resource_load_to_ram_by_id
    ld a, 0
    ld (current_effect_zone_count), a
    or a
    jr z, .load_pan4_772291683578_zones_done
    ld a, RESOURCE_ID_SCREEN_PAN4_4_EFFECT_ZONE_TABLE
    call resource_load_effect_zone_table_cached
.load_pan4_772291683578_zones_done:
    ; Preserve HUD / non-active VRAM area: overwrite only gameplay rows
    ld hl, runtime_screen_layout + 96
    ld de, NAMETBL + 96
    ld bc, 672
    call FAST_LDIRVM
    ld a, 2
    ld (current_screen_anim_group_count), a
    ld a, 0
    ld (current_screen_entity_count), a
    ld a, 1
    ld (current_screen_sprite_pattern_slots), a
    ld a, SCREEN_PAN4_4_SUMMARY_FLAGS
    ld (current_screen_summary_flags), a
    ld a, SCREEN_PAN4_4_BOSS_COUNT
    ld (current_screen_boss_count), a
    or a
    jp z, load_pan4_772291683578_boss_done
    call mapper_push_p3
    ld a, SCREEN_PAN4_4_BOSS_TABLE_BANK & #FF
    call mapper_set_bank_p3
    ld hl, (SCREEN_PAN4_4_BOSS_TABLE & #1FFF) | #A000
    ld de, current_screen_boss_entry
    ld bc, BOSS_PLACEMENT_ENTRY_SIZE
    ldir
    call mapper_pop_p3
    ld hl, current_screen_boss_entry
    ld (current_screen_boss_table), hl
    ld a, #FF
    ld (current_screen_boss_table_bank), a
load_pan4_772291683578_boss_done:

    call call_update_animated_tiles_vram_resident
    call call_init_screen_boss_from_current_screen_resident
    ; Imported HUD frame is drawn on world/game start only
    ; Initialize collision system pointers for this screen
    ld hl, runtime_screen_layout
    ld (current_screen_layout), hl
    ld a, #FF
    ld (current_screen_layout_bank), a
    ld hl, runtime_behavior_map
    ld (current_behavior_map), hl
    ld a, #FF
    ld (current_behavior_map_bank), a
    ld a, l
    ld (behavior_cache_map_l), a
    ld a, h
    ld (behavior_cache_map_h), a
    ld a, #FF
    ld (behavior_cache_row), a
    xor a
    ld (secret_zone_active), a
    ld (secret_zone_rect_x), a
    ld (secret_zone_rect_y), a
    ld (secret_zone_rect_w), a
    ld (secret_zone_rect_h), a
    ld hl, entity_button_contact_active
    ld de, entity_button_contact_active + 1
    ld bc, 31
    ld (hl), a
    ldir
    ret


; ==================================================================
; END OF SCREENS
; ==================================================================


; --- End of Far Bank 4 — pad to 8KB boundary ---
    ds #8000 - $, #FF
    org FAR_BANK_4_ROM_START + #2000

; ##################################################################
; FAR BANK 5 — [#6000h-#8000h] FAR CODE: entities
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank5 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-3). No far-to-far calls allowed.
; ##################################################################
FAR_BANK_5_ROM_START:
    org #6000

; ==================================================================
; GAME ENTITIES
; File: entities.asm
; Description: Game entity definitions and behavior
; ==================================================================
;
; INTELLIGENT FILTERING ACTIVE:
;   Entity templates in project: 4
;   Actually instantiated: 4
;   Used entity templates: 2
;   Filtered out: 2 unused templates
;
; ==================================================================

; ==================================================================
; ENTITY DEFINITIONS
; ==================================================================

; Entity: hero 1 (instance from template: tpl_1771166650770_6ibnk)
ENTITY_HERO_1_ID EQU 0
ENTITY_HERO_1_COMP_MASK EQU #39B  ; Component mask: 1110011011b
; Template: tpl_1771166650770_6ibnk
ENTITY_HERO_1_X EQU 3
ENTITY_HERO_1_Y EQU 10

; Entity: pato 1 (instance from template: tpl_1770837237607_l05j9)
ENTITY_PATO_1_ID EQU 1
ENTITY_PATO_1_COMP_MASK EQU #8F  ; Component mask: 10001111b
; Template: tpl_1770837237607_l05j9
ENTITY_PATO_1_X EQU 19
ENTITY_PATO_1_Y EQU 20

; Entity: pato3 (instance from template: tpl_1770837237607_l05j9)
ENTITY_PATO3_ID EQU 2
ENTITY_PATO3_COMP_MASK EQU #8F  ; Component mask: 10001111b
; Template: tpl_1770837237607_l05j9
ENTITY_PATO3_X EQU 5
ENTITY_PATO3_Y EQU 4

; Entity: bola2 (instance from template: tpl_1770837237607_l05j9)
ENTITY_BOLA2_ID EQU 3
ENTITY_BOLA2_COMP_MASK EQU #8F  ; Component mask: 10001111b
; Template: tpl_1770837237607_l05j9
ENTITY_BOLA2_X EQU 16
ENTITY_BOLA2_Y EQU 19

; ==================================================================
; ENTITY MANAGEMENT FUNCTIONS
; ==================================================================

init_entities:
    ; Initialize all active game entities (4 entities)

    ; Ensure sprite system is reset whenever entities are initialized
    call call_init_sprites_resident
    call init_player_fast_runtime

    ; CRITICAL: Clear ALL entity component masks to prevent ghost entities
    ; RAM may contain random data - entities 0..N will be set by create_entity
    ld hl, entity_comp_masks
    ld de, entity_comp_masks+1
    ld bc, 31                  ; Clear 32 bytes (32-1 for LDIR)
    ld (hl), 0
    ldir

    ld hl, entity_comp_masks_hi
    ld de, entity_comp_masks_hi+1
    ld bc, 31
    ld (hl), 0
    ldir

    ; Clear entity screen IDs to prevent ghost entities on restart
    ld hl, entity_screen_id
    ld de, entity_screen_id+1
    ld bc, 31
    ld (hl), 0
    ldir

    ; Clear entity player-role flags
    ld hl, entity_is_player
    ld de, entity_is_player+1
    ld bc, 31
    ld (hl), 0
    ldir

    ; Clear entity template tokens
    ld hl, entity_template_token
    ld de, entity_template_token+1
    ld bc, 31
    ld (hl), 0
    ldir

    ; Clear facing-direction cache so first-frame ChangeSprite does not
    ; redirect through stale RAM garbage from a previous run/screen.
    ld hl, entity_facing_dir
    ld de, entity_facing_dir+1
    ld bc, 31
    ld (hl), 0
    ldir
    
    ; Initialize State Machine variables (Clear to 0)
    ld hl, entity_sm_ptr_l
    ld de, entity_sm_ptr_l+1
    ld bc, 31
    ld (hl), 0
    ldir

    ld hl, entity_sm_ptr_h
    ld de, entity_sm_ptr_h+1
    ld bc, 31
    ld (hl), 0
    ldir

    ld hl, entity_sm_timer_l
    ld de, entity_sm_timer_l+1
    ld bc, 31
    ld (hl), 0
    ldir

    ld hl, entity_sm_timer_h
    ld de, entity_sm_timer_h+1
    ld bc, 31
    ld (hl), 0
    ldir

    ld hl, entity_sm_wait_timer
    ld de, entity_sm_wait_timer+1
    ld bc, 31
    ld (hl), 0
    ldir

    ld hl, entity_sm_sprite_control
    ld de, entity_sm_sprite_control+1
    ld bc, 31
    ld (hl), 0
    ldir
    
    call init_hero_1
    call init_pato_1
    call init_pato3
    call init_bola2
    call init_player_from_hero_entity
    ret

update_entities:
    ; Update all active entities (4 entities)
    ; Skip entity update if entity belongs to another screen
    ld hl, entity_screen_id + 0
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_update_0
    ; Run per-entity update
    call update_hero_1
.skip_update_0:
    ; Skip entity update if entity belongs to another screen
    ld hl, entity_screen_id + 1
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_update_1
    ; Run per-entity update
    call update_pato_1
.skip_update_1:
    ; Skip entity update if entity belongs to another screen
    ld hl, entity_screen_id + 2
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_update_2
    ; Run per-entity update
    call update_pato3
.skip_update_2:
    ; Skip entity update if entity belongs to another screen
    ld hl, entity_screen_id + 3
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_update_3
    ; Run per-entity update
    call update_bola2
.skip_update_3:
    ret

init_hero_1:
    ; Initialize hero 1 at real position from JSON
    ; JSON position: (3, 10) tiles = (24, 80) pixels
    ; Template: tpl_1771166650770_6ibnk
    ; Components: Position, Sprite, Collision, Input, Animation, Jump, Gravity
    ; Direction mask: #0D (1101b) = UP+LEFT+RIGHT

    ; Set entity ID and component mask (DYNAMIC - based on template)
    ; Mask is 16-bit: B=low byte, C=high byte
    ld a, 0             ; Entity ID
    ld b, #9B              ; Mask low byte
    ld c, #03              ; Mask high byte
    call call_create_entity_resident         ; Create with actual components from template

    ; Configure per-entity job cadence
    ; period: 1 frame(s), entry: 0
    ld a, 0
    ld b, 1
    ld c, 0
    call call_entity_job_set_resident

    ; Set real position from JSON data
    ld hl, entity_x_pos
    ld e, 0             ; Entity index
    ld d, 0
    add hl, de
    ld (hl), 24         ; Set real X position from JSON

    ld hl, entity_y_pos
    add hl, de
    ld (hl), 80         ; Set real Y position from JSON

    ; Set entity screen ID (for multi-screen support)
    ld hl, entity_screen_id
    add hl, de
    ld (hl), 0                 ; Screen ID (world node index / fallback screen index)

    ld hl, entity_is_player
    add hl, de
    ld (hl), 1                 ; Player/hero marker from template

    ; Template token for state-machine template-aware actions
    ld hl, entity_template_token
    add hl, de
    ld (hl), 3

    ; Mark whether this entity's state machine actually owns sprite changes.
    ; Plain state machines without ChangeSprite should keep auto-facing active.
    ld hl, entity_sm_sprite_control
    add hl, de
    ld (hl), 1

    ; Deterministic spawn facing: right.
    ; This keeps the first SM ChangeSprite aligned with the same default
    ; world-facing direction used by Preview/runtime web.
    ld hl, entity_facing_dir
    add hl, de
    ld (hl), 2



    ; Initialize Animation component
    ld hl, entity_anim_frame
    add hl, de
    ld (hl), #00           ; currentFrameIndex

    ld hl, entity_anim_tick
    add hl, de
    ld (hl), 0                ; tick counter

    ld hl, entity_anim_speed
    add hl, de
    ld (hl), #07           ; animationSpeed

    ld hl, entity_anim_flags
    add hl, de
    ld (hl), #07           ; flags (playing/loop/onlyWhenMoving)



    ; Initialize Collision component (hitbox + layer masks)
    ld hl, entity_collision_hitbox_w
    add hl, de
    ld (hl), #10      ; hitboxWidth

    ld hl, entity_collision_hitbox_h
    add hl, de
    ld (hl), #10      ; hitboxHeight

    ld hl, entity_collision_offset_x
    add hl, de
    ld (hl), #00      ; offsetX (0)

    ld hl, entity_collision_offset_y
    add hl, de
    ld (hl), #00      ; offsetY (0)

    ld hl, entity_collision_layer
    add hl, de
    ld (hl), #01      ; collisionLayer

    ld hl, entity_collides_with
    add hl, de
    ld (hl), #0A      ; collidesWith







    ; Set sprite pattern and color (renderable entity)
    ld hl, sprite_pattern
    add hl, de
    ld (hl), 0          ; Use entity index * 4 for 16x16 sprites

    ld hl, sprite_color
    add hl, de
    ld (hl), 2                ; Distinct color for debugging


    ; Set direction mask for Cursors component (if entity has Input component)
    ld hl, entity_dir_mask
    add hl, de
    ld (hl), #0D            ; Direction restrictions: UP+LEFT+RIGHT

    ; Set input speed for Cursors component (if entity has Input component)
    ld hl, entity_input_speed
    add hl, de
    ld (hl), 1            ; Cursor speed (px/frame)

    ; Set Jump component configuration
    ld hl, entity_jump_max
    add hl, de
    ld (hl), 1            ; Maximum jumps before touching ground


    ; Force update sprite attributes only if entity is in current screen
    ld hl, entity_screen_id + 0
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_force_show_0

    ; Force update sprite attributes (using correct multi-layer config)
    ld c, 0             ; Entity Index
    call call_force_update_entity_sprite_resident
.skip_force_show_0:



    ; Initialize State Machine pointer to initial state (New Statemachine)
    ld hl, SM_New_Statemachine_state_1771533526010          ; HL = initial state address
    ld a, l
    ld (entity_sm_ptr_l + 0), a   ; SM ptr low byte
    ld a, h
    ld (entity_sm_ptr_h + 0), a   ; SM ptr high byte

    ; Fire OnEnter of initial state immediately.
    ; Normally OnEnter fires via SM_ChangeState, but the first state is set
    ; directly (no transition). Without this call, ChangeSprite / other
    ; OnEnter actions never run and entity_sprite_asset_index stays at 0.
    ; State data layout: [ID:1][OnEnter ptr:2][OnExit ptr:2][Transitions ptr:2]
    ld hl, SM_New_Statemachine_state_1771533526010 + 1      ; HL = &OnEnter Actions Ptr field
    ld e, (hl)
    inc hl
    ld d, (hl)                    ; DE = OnEnter Actions Ptr (0 if none)
    ld a, 0                ; A = entity index
    call SM_ExecuteActions        ; safe: SM_ExecuteActions returns immediately if DE=0

    ret

update_hero_1:
    ; Update hero 1 logic with real behavior
    ; Check if entity has input component (player entities)
    ld a, 0
    ld hl, entity_comp_masks
    ld e, a
    ld d, 0
    add hl, de
    ld a, (hl)
    and COMP_MASK_INPUT
    ret z                      ; Skip if no input component

    ; This is a player entity - update based on input
    ; Input velocity is already calculated in UPDATE_INPUT_COMPONENT
    ; Position update happens in UPDATE_POSITION_COMPONENT
    ret

init_pato_1:
    ; Initialize pato 1 at real position from JSON
    ; JSON position: (19, 20) tiles = (152, 160) pixels
    ; Template: tpl_1770837237607_l05j9
    ; Components: Position, Sprite, Movement, Collision, Animation
    ; Direction mask: #0F (1111b) = All directions

    ; Set entity ID and component mask (DYNAMIC - based on template)
    ; Mask is 16-bit: B=low byte, C=high byte
    ld a, 1             ; Entity ID
    ld b, #8F              ; Mask low byte
    ld c, #00              ; Mask high byte
    call call_create_entity_resident         ; Create with actual components from template

    ; Configure per-entity job cadence
    ; period: 1 frame(s), entry: 0
    ld a, 1
    ld b, 1
    ld c, 0
    call call_entity_job_set_resident

    ; Set real position from JSON data
    ld hl, entity_x_pos
    ld e, 1             ; Entity index
    ld d, 0
    add hl, de
    ld (hl), 152         ; Set real X position from JSON

    ld hl, entity_y_pos
    add hl, de
    ld (hl), 160         ; Set real Y position from JSON

    ; Set entity screen ID (for multi-screen support)
    ld hl, entity_screen_id
    add hl, de
    ld (hl), 0                 ; Screen ID (world node index / fallback screen index)

    ld hl, entity_is_player
    add hl, de
    ld (hl), 0                 ; Player/hero marker from template

    ; Template token for state-machine template-aware actions
    ld hl, entity_template_token
    add hl, de
    ld (hl), 2

    ; Mark whether this entity's state machine actually owns sprite changes.
    ; Plain state machines without ChangeSprite should keep auto-facing active.
    ld hl, entity_sm_sprite_control
    add hl, de
    ld (hl), 0



    ; Initialize Animation component
    ld hl, entity_anim_frame
    add hl, de
    ld (hl), #00           ; currentFrameIndex

    ld hl, entity_anim_tick
    add hl, de
    ld (hl), 0                ; tick counter

    ld hl, entity_anim_speed
    add hl, de
    ld (hl), #06           ; animationSpeed

    ld hl, entity_anim_flags
    add hl, de
    ld (hl), #07           ; flags (playing/loop/onlyWhenMoving)


    ; === Patrol Component Init ===
    ; Waypoints: (72, 160) -> (144, 160)
    ; Override position with waypoint1
    ld hl, entity_x_pos
    add hl, de
    ld (hl), 72         ; Start X = waypoint1_x

    ld hl, entity_y_pos
    add hl, de
    ld (hl), 160         ; Start Y = waypoint1_y

    ; Set patrol velocity
    ld hl, entity_vel_x
    add hl, de
    ld (hl), 1           ; VelX = +1

    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0           ; VelY = +0


    ; Initialize Collision component (hitbox + layer masks)
    ld hl, entity_collision_hitbox_w
    add hl, de
    ld (hl), #10      ; hitboxWidth

    ld hl, entity_collision_hitbox_h
    add hl, de
    ld (hl), #10      ; hitboxHeight

    ld hl, entity_collision_offset_x
    add hl, de
    ld (hl), #00      ; offsetX (0)

    ld hl, entity_collision_offset_y
    add hl, de
    ld (hl), #00      ; offsetY (0)

    ld hl, entity_collision_layer
    add hl, de
    ld (hl), #01      ; collisionLayer

    ld hl, entity_collides_with
    add hl, de
    ld (hl), #FF      ; collidesWith







    ; Set sprite pattern and color (renderable entity)
    ld hl, sprite_pattern
    add hl, de
    ld (hl), 4          ; Use entity index * 4 for 16x16 sprites

    ld hl, sprite_color
    add hl, de
    ld (hl), 3                ; Distinct color for debugging


    ; Set direction mask for Cursors component (if entity has Input component)
    ld hl, entity_dir_mask
    add hl, de
    ld (hl), #0F            ; Direction restrictions: All directions

    ; Set input speed for Cursors component (if entity has Input component)
    ld hl, entity_input_speed
    add hl, de
    ld (hl), 2            ; Cursor speed (px/frame)


    ; Force update sprite attributes only if entity is in current screen
    ld hl, entity_screen_id + 1
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_force_show_1

    ; Force update sprite attributes (using correct multi-layer config)
    ld c, 1             ; Entity Index
    call call_force_update_entity_sprite_resident
.skip_force_show_1:



    ret

update_pato_1:
    ; Update pato 1 - Patrol bounce
    ; Waypoints: (72, 160) -> (144, 160)
    ld e, 1             ; Entity index
    ld d, 0

    ; --- X axis bounce ---
    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    or a
    jp z, .patrol_end_1
    bit 7, a
    jp nz, .patrol_chk_min_x_1

    ; Moving right: x >= 144?
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    cp 144
    jp c, .patrol_end_1
    ; Bounce: negate vel_x
    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    neg
    ld (hl), a
    jp .patrol_end_1

.patrol_chk_min_x_1:
    ; Moving left: x <= 72?
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    cp 73
    jp nc, .patrol_end_1
    ; Bounce: negate vel_x
    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    neg
    ld (hl), a

.patrol_end_1:
    ; Sync sprite facing with current patrol velocity
    call update_entity_patrol_facing
    ret

init_pato3:
    ; Initialize pato3 at real position from JSON
    ; JSON position: (5, 4) tiles = (40, 32) pixels
    ; Template: tpl_1770837237607_l05j9
    ; Components: Position, Sprite, Movement, Collision, Animation
    ; Direction mask: #0F (1111b) = All directions

    ; Set entity ID and component mask (DYNAMIC - based on template)
    ; Mask is 16-bit: B=low byte, C=high byte
    ld a, 2             ; Entity ID
    ld b, #8F              ; Mask low byte
    ld c, #00              ; Mask high byte
    call call_create_entity_resident         ; Create with actual components from template

    ; Configure per-entity job cadence
    ; period: 2 frame(s), entry: 0
    ld a, 2
    ld b, 2
    ld c, 0
    call call_entity_job_set_resident

    ; Set real position from JSON data
    ld hl, entity_x_pos
    ld e, 2             ; Entity index
    ld d, 0
    add hl, de
    ld (hl), 40         ; Set real X position from JSON

    ld hl, entity_y_pos
    add hl, de
    ld (hl), 32         ; Set real Y position from JSON

    ; Set entity screen ID (for multi-screen support)
    ld hl, entity_screen_id
    add hl, de
    ld (hl), 2                 ; Screen ID (world node index / fallback screen index)

    ld hl, entity_is_player
    add hl, de
    ld (hl), 0                 ; Player/hero marker from template

    ; Template token for state-machine template-aware actions
    ld hl, entity_template_token
    add hl, de
    ld (hl), 2

    ; Mark whether this entity's state machine actually owns sprite changes.
    ; Plain state machines without ChangeSprite should keep auto-facing active.
    ld hl, entity_sm_sprite_control
    add hl, de
    ld (hl), 0



    ; Initialize Animation component
    ld hl, entity_anim_frame
    add hl, de
    ld (hl), #00           ; currentFrameIndex

    ld hl, entity_anim_tick
    add hl, de
    ld (hl), 0                ; tick counter

    ld hl, entity_anim_speed
    add hl, de
    ld (hl), #06           ; animationSpeed

    ld hl, entity_anim_flags
    add hl, de
    ld (hl), #03           ; flags (playing/loop/onlyWhenMoving)


    ; === Patrol Component Init ===
    ; Waypoints: (64, 32) -> (144, 32)
    ; Override position with waypoint1
    ld hl, entity_x_pos
    add hl, de
    ld (hl), 64         ; Start X = waypoint1_x

    ld hl, entity_y_pos
    add hl, de
    ld (hl), 32         ; Start Y = waypoint1_y

    ; Set patrol velocity
    ld hl, entity_vel_x
    add hl, de
    ld (hl), 1           ; VelX = +1

    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0           ; VelY = +0


    ; Initialize Collision component (hitbox + layer masks)
    ld hl, entity_collision_hitbox_w
    add hl, de
    ld (hl), #10      ; hitboxWidth

    ld hl, entity_collision_hitbox_h
    add hl, de
    ld (hl), #10      ; hitboxHeight

    ld hl, entity_collision_offset_x
    add hl, de
    ld (hl), #00      ; offsetX (0)

    ld hl, entity_collision_offset_y
    add hl, de
    ld (hl), #00      ; offsetY (0)

    ld hl, entity_collision_layer
    add hl, de
    ld (hl), #02      ; collisionLayer

    ld hl, entity_collides_with
    add hl, de
    ld (hl), #01      ; collidesWith







    ; Set sprite pattern and color (renderable entity)
    ld hl, sprite_pattern
    add hl, de
    ld (hl), 8          ; Use entity index * 4 for 16x16 sprites

    ld hl, sprite_color
    add hl, de
    ld (hl), 4                ; Distinct color for debugging


    ; Set direction mask for Cursors component (if entity has Input component)
    ld hl, entity_dir_mask
    add hl, de
    ld (hl), #0F            ; Direction restrictions: All directions

    ; Set input speed for Cursors component (if entity has Input component)
    ld hl, entity_input_speed
    add hl, de
    ld (hl), 2            ; Cursor speed (px/frame)


    ; Force update sprite attributes only if entity is in current screen
    ld hl, entity_screen_id + 2
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_force_show_2

    ; Force update sprite attributes (using correct multi-layer config)
    ld c, 2             ; Entity Index
    call call_force_update_entity_sprite_resident
.skip_force_show_2:



    ret

update_pato3:
    ; Update pato3 - Patrol bounce
    ; Waypoints: (64, 32) -> (144, 32)
    ld e, 2             ; Entity index
    ld d, 0

    ; --- X axis bounce ---
    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    or a
    jp z, .patrol_end_2
    bit 7, a
    jp nz, .patrol_chk_min_x_2

    ; Moving right: x >= 144?
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    cp 144
    jp c, .patrol_end_2
    ; Bounce: negate vel_x
    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    neg
    ld (hl), a
    jp .patrol_end_2

.patrol_chk_min_x_2:
    ; Moving left: x <= 64?
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    cp 65
    jp nc, .patrol_end_2
    ; Bounce: negate vel_x
    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    neg
    ld (hl), a

.patrol_end_2:
    ; Sync sprite facing with current patrol velocity
    call update_entity_patrol_facing
    ret

init_bola2:
    ; Initialize bola2 at real position from JSON
    ; JSON position: (16, 19) tiles = (128, 152) pixels
    ; Template: tpl_1770837237607_l05j9
    ; Components: Position, Sprite, Movement, Collision, Animation
    ; Direction mask: #0F (1111b) = All directions

    ; Set entity ID and component mask (DYNAMIC - based on template)
    ; Mask is 16-bit: B=low byte, C=high byte
    ld a, 3             ; Entity ID
    ld b, #8F              ; Mask low byte
    ld c, #00              ; Mask high byte
    call call_create_entity_resident         ; Create with actual components from template

    ; Configure per-entity job cadence
    ; period: 2 frame(s), entry: 1
    ld a, 3
    ld b, 2
    ld c, 1
    call call_entity_job_set_resident

    ; Set real position from JSON data
    ld hl, entity_x_pos
    ld e, 3             ; Entity index
    ld d, 0
    add hl, de
    ld (hl), 128         ; Set real X position from JSON

    ld hl, entity_y_pos
    add hl, de
    ld (hl), 152         ; Set real Y position from JSON

    ; Set entity screen ID (for multi-screen support)
    ld hl, entity_screen_id
    add hl, de
    ld (hl), 2                 ; Screen ID (world node index / fallback screen index)

    ld hl, entity_is_player
    add hl, de
    ld (hl), 0                 ; Player/hero marker from template

    ; Template token for state-machine template-aware actions
    ld hl, entity_template_token
    add hl, de
    ld (hl), 2

    ; Mark whether this entity's state machine actually owns sprite changes.
    ; Plain state machines without ChangeSprite should keep auto-facing active.
    ld hl, entity_sm_sprite_control
    add hl, de
    ld (hl), 0



    ; Initialize Animation component
    ld hl, entity_anim_frame
    add hl, de
    ld (hl), #00           ; currentFrameIndex

    ld hl, entity_anim_tick
    add hl, de
    ld (hl), 0                ; tick counter

    ld hl, entity_anim_speed
    add hl, de
    ld (hl), #06           ; animationSpeed

    ld hl, entity_anim_flags
    add hl, de
    ld (hl), #03           ; flags (playing/loop/onlyWhenMoving)


    ; === Patrol Component Init ===
    ; Waypoints: (120, 152) -> (216, 152)
    ; Override position with waypoint1
    ld hl, entity_x_pos
    add hl, de
    ld (hl), 120         ; Start X = waypoint1_x

    ld hl, entity_y_pos
    add hl, de
    ld (hl), 152         ; Start Y = waypoint1_y

    ; Set patrol velocity
    ld hl, entity_vel_x
    add hl, de
    ld (hl), 1           ; VelX = +1

    ld hl, entity_vel_y
    add hl, de
    ld (hl), 0           ; VelY = +0


    ; Initialize Collision component (hitbox + layer masks)
    ld hl, entity_collision_hitbox_w
    add hl, de
    ld (hl), #10      ; hitboxWidth

    ld hl, entity_collision_hitbox_h
    add hl, de
    ld (hl), #10      ; hitboxHeight

    ld hl, entity_collision_offset_x
    add hl, de
    ld (hl), #00      ; offsetX (0)

    ld hl, entity_collision_offset_y
    add hl, de
    ld (hl), #00      ; offsetY (0)

    ld hl, entity_collision_layer
    add hl, de
    ld (hl), #02      ; collisionLayer

    ld hl, entity_collides_with
    add hl, de
    ld (hl), #01      ; collidesWith







    ; Set sprite pattern and color (renderable entity)
    ld hl, sprite_pattern
    add hl, de
    ld (hl), 12          ; Use entity index * 4 for 16x16 sprites

    ld hl, sprite_color
    add hl, de
    ld (hl), 5                ; Distinct color for debugging


    ; Set direction mask for Cursors component (if entity has Input component)
    ld hl, entity_dir_mask
    add hl, de
    ld (hl), #0F            ; Direction restrictions: All directions

    ; Set input speed for Cursors component (if entity has Input component)
    ld hl, entity_input_speed
    add hl, de
    ld (hl), 2            ; Cursor speed (px/frame)


    ; Force update sprite attributes only if entity is in current screen
    ld hl, entity_screen_id + 3
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_force_show_3

    ; Force update sprite attributes (using correct multi-layer config)
    ld c, 3             ; Entity Index
    call call_force_update_entity_sprite_resident
.skip_force_show_3:



    ret

update_bola2:
    ; Update bola2 - Patrol bounce
    ; Waypoints: (120, 152) -> (216, 152)
    ld e, 3             ; Entity index
    ld d, 0

    ; --- X axis bounce ---
    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    or a
    jp z, .patrol_end_3
    bit 7, a
    jp nz, .patrol_chk_min_x_3

    ; Moving right: x >= 216?
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    cp 216
    jp c, .patrol_end_3
    ; Bounce: negate vel_x
    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    neg
    ld (hl), a
    jp .patrol_end_3

.patrol_chk_min_x_3:
    ; Moving left: x <= 120?
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    cp 121
    jp nc, .patrol_end_3
    ; Bounce: negate vel_x
    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    neg
    ld (hl), a

.patrol_end_3:
    ; Sync sprite facing with current patrol velocity
    call update_entity_patrol_facing
    ret

; ------------------------------------------------------------------
; RETRACTABLE GATE STATIC CONFIG TABLES (ROM)
; Indexed by entity slot (0..31)
; ------------------------------------------------------------------
entity_gate_cfg_enabled:
    DB 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
entity_gate_cfg_x:
    DB 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
entity_gate_cfg_y:
    DB 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
entity_gate_cfg_width:
    DB 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
entity_gate_cfg_height:
    DB 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
entity_gate_cfg_direction:
    DB 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
entity_gate_cfg_fill_char:
    DB 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
entity_gate_cfg_total_steps:
    DB 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
entity_gate_cfg_step_delay:
    DB 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
entity_gate_cfg_trigger_ptr:
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
entity_gate_cfg_trigger_is_word:
    DB 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
entity_gate_cfg_trigger_operator:
    DB 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
entity_gate_cfg_trigger_value:
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0

; ------------------------------------------------------------------
; WALL JUMP STATIC CONFIG TABLES (ROM)
; Indexed by entity slot (0..31)
; ------------------------------------------------------------------
entity_walljump_cfg_enabled:
    DB 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
entity_walljump_cfg_horizontal_push:
    DB 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
entity_walljump_cfg_vertical_impulse:
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
    DW 0
entity_walljump_cfg_animation_sprite:
    DB 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255
entity_walljump_cfg_slide_fall_speed:
    DB 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
entity_walljump_cfg_lock_frames:
    DB 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
entity_walljump_cfg_require_away:
    DB 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
entity_wallgrab_cfg_enabled:
    DB 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
entity_wallgrab_cfg_fall_speed:
    DB 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
entity_wallgrab_cfg_climb_speed:
    DB 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1
entity_wallgrab_cfg_duration_frames:
    DB 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240
entity_wallgrab_cfg_grab_sprite:
    DB 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255
entity_aircontrol_cfg_mode:
    DB 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0


; ------------------------------------------------------------------
; update_entity_patrol_facing
; Input: DE = entity index
; Updates entity_sprite_asset_index using directional lookup tables.
; ------------------------------------------------------------------
update_entity_patrol_facing:
    push af
    push bc
    push hl

    ; Guard invalid DE index coming from callers.
    ld a, d
    or a
    jp nz, .patrol_facing_done
    ld a, e
    cp MAX_ENTITIES
    jp nc, .patrol_facing_done

    ; Read base sprite asset index from ROM init table.
    ; This keeps patrol facing within the entity's directional family
    ; and avoids getting stuck in an unrelated 1-layer sprite asset.
    ld hl, entity_sprite_asset_index_init
    add hl, de
    ld a, (hl)
    cp #FF
    jp z, .patrol_facing_done
    cp SPRITE_ASSET_COUNT
    jp nc, .patrol_facing_done
    ld c, a
    ld b, 0

    ; Prefer horizontal facing when vel_x != 0
    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    or a
    jr z, .check_vertical
    bit 7, a
    jr nz, .use_left
    ld hl, sprite_dir_right_table
    jr .apply_lookup

.use_left:
    ld hl, sprite_dir_left_table
    jr .apply_lookup

.check_vertical:
    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)
    or a
    jr z, .patrol_facing_done
    bit 7, a
    jr nz, .use_up
    ld hl, sprite_dir_down_table
    jr .apply_lookup

.use_up:
    ld hl, sprite_dir_up_table

.apply_lookup:
    add hl, bc
    ld a, (hl)

    ld hl, entity_sprite_asset_index
    add hl, de
    cp (hl)
    jr z, .patrol_facing_done
    ld (hl), a

    ; Reset animation progression when directional variant changes.
    ; Without this, switching to a variant with fewer frames can leave
    ; entity_anim_frame out of range until the next animation wrap.
    ld hl, entity_anim_frame
    add hl, de
    ld (hl), 0

    ld hl, entity_anim_tick
    add hl, de
    ld (hl), 0

.patrol_facing_done:
    pop hl
    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; init_player_fast_runtime
; Reset the dedicated player fast-path runtime mirror.
; ------------------------------------------------------------------
init_player_fast_runtime:
    xor a
    ld (player_runtime_enabled), a
    ld (player_vx_runtime), a
    ld (player_vy_runtime), a
    ld (player_dash_timer), a
    ld (player_dash_cooldown), a
    ld (player_dash_dir), a
    ld (player_x), a
    ld (player_x+1), a
    ld (player_y), a
    ld (player_y+1), a
    ld a, #FF
    ld (player_entity_index), a
    ret

; ------------------------------------------------------------------
; init_player_from_hero_entity
; Seed player fast-path runtime from current hero_entity_id when available.
; Safe to call before hero_entity_id has been resolved.
; ------------------------------------------------------------------
init_player_from_hero_entity:
    ld a, (hero_entity_id)
    cp #FF
    ret z
    ld (player_entity_index), a
    ld c, a
    ld a, 1
    ld (player_runtime_enabled), a

    ld e, c
    ld d, 0

    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    ld (player_x), a
    xor a
    ld (player_x+1), a

    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    ld (player_y), a
    xor a
    ld (player_y+1), a

    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    ld (player_vx_runtime), a

    ld hl, entity_vel_y
    add hl, de
    ld a, (hl)
    ld (player_vy_runtime), a
    ret
; ==================================================================
; END OF ENTITIES
; ==================================================================


; --- End of Far Bank 5 — pad to 8KB boundary ---
    ds #8000 - $, #FF
    org FAR_BANK_5_ROM_START + #2000

; ##################################################################
; FAR BANK 6 — [#6000h-#8000h] FAR CODE: sprites
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank6 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-3). No far-to-far calls allowed.
; ##################################################################
FAR_BANK_6_ROM_START:
    org #6000

; ==================================================================
; SPRITE DATA
; File: sprites.asm
; Description: Sprite pattern and animation data
; Entities: 4
; Total Hardware Sprites (Layers): 32
; SAT Upload Sprites per frame: 8
; Sprite Pattern Preload Mode: STATIC_ALL_FRAMES
; Runtime Sprite Pattern Packs: 1
; ==================================================================
; SPRITE_DATA_ROM_DATA_GROUP: bank4
; (sprite pattern blobs are emitted in bank4 data zones for megarom builds)

; Unified pattern label for sprite 0
SPRITE_0_PATTERN EQU ANEC_RIGHT_0_F0_LAYER1
SPRITE_0_PATTERN_BANK EQU ((SPRITE_0_PATTERN - #4000) / #2000)

; Unified pattern label for sprite 1
SPRITE_1_PATTERN EQU BOLA_1_F0_LAYER1
SPRITE_1_PATTERN_BANK EQU ((SPRITE_1_PATTERN - #4000) / #2000)

; Unified pattern label for sprite 2
SPRITE_2_PATTERN EQU PANELL_2_F0_LAYER1
SPRITE_2_PATTERN_BANK EQU ((SPRITE_2_PATTERN - #4000) / #2000)

; Unified pattern label for sprite 3
SPRITE_3_PATTERN EQU NINA_WALK_RIGHT_3_F0_LAYER0
SPRITE_3_PATTERN_BANK EQU ((SPRITE_3_PATTERN - #4000) / #2000)

; Unified pattern label for sprite 4
SPRITE_4_PATTERN EQU NINA_JUMP_RIGHT_4_F0_LAYER0
SPRITE_4_PATTERN_BANK EQU ((SPRITE_4_PATTERN - #4000) / #2000)

; Unified pattern label for sprite 5
SPRITE_5_PATTERN EQU NINA_LAND_RIGHT_5_F0_LAYER0
SPRITE_5_PATTERN_BANK EQU ((SPRITE_5_PATTERN - #4000) / #2000)

; Unified pattern label for sprite 6
SPRITE_6_PATTERN EQU NINA_DEAD_RIGHT_6_F0_LAYER0
SPRITE_6_PATTERN_BANK EQU ((SPRITE_6_PATTERN - #4000) / #2000)

; Unified pattern label for sprite 7
SPRITE_7_PATTERN EQU NINA_IDLE_RIGHT_7_F0_LAYER0
SPRITE_7_PATTERN_BANK EQU ((SPRITE_7_PATTERN - #4000) / #2000)

; Unified pattern label for sprite 8
SPRITE_8_PATTERN EQU NINA_FALL_RIGHT_8_F0_LAYER0
SPRITE_8_PATTERN_BANK EQU ((SPRITE_8_PATTERN - #4000) / #2000)

; Unified pattern label for sprite 9
SPRITE_9_PATTERN EQU CAPCUADRAT1_RIGHT_9_F0_LAYER2
SPRITE_9_PATTERN_BANK EQU ((SPRITE_9_PATTERN - #4000) / #2000)

; Unified pattern label for sprite 10
SPRITE_10_PATTERN EQU ANEC_LEFT_10_F0_LAYER1
SPRITE_10_PATTERN_BANK EQU ((SPRITE_10_PATTERN - #4000) / #2000)

; Unified pattern label for sprite 11
SPRITE_11_PATTERN EQU NINA_WALK_LEFT_11_F0_LAYER0
SPRITE_11_PATTERN_BANK EQU ((SPRITE_11_PATTERN - #4000) / #2000)

; Unified pattern label for sprite 12
SPRITE_12_PATTERN EQU NINA_JUMP_LEFT_12_F0_LAYER0
SPRITE_12_PATTERN_BANK EQU ((SPRITE_12_PATTERN - #4000) / #2000)

; Unified pattern label for sprite 13
SPRITE_13_PATTERN EQU NINA_LAND_LEFT_13_F0_LAYER0
SPRITE_13_PATTERN_BANK EQU ((SPRITE_13_PATTERN - #4000) / #2000)

; Unified pattern label for sprite 14
SPRITE_14_PATTERN EQU NINA_DEAD_LEFT_14_F0_LAYER0
SPRITE_14_PATTERN_BANK EQU ((SPRITE_14_PATTERN - #4000) / #2000)

; Unified pattern label for sprite 15
SPRITE_15_PATTERN EQU NINA_IDLE_LEFT_15_F0_LAYER0
SPRITE_15_PATTERN_BANK EQU ((SPRITE_15_PATTERN - #4000) / #2000)

; Unified pattern label for sprite 16
SPRITE_16_PATTERN EQU NINA_FALL_LEFT_16_F0_LAYER0
SPRITE_16_PATTERN_BANK EQU ((SPRITE_16_PATTERN - #4000) / #2000)

; Unified pattern label for sprite 17
SPRITE_17_PATTERN EQU CAPCUADRAT1_LEFT_17_F0_LAYER2
SPRITE_17_PATTERN_BANK EQU ((SPRITE_17_PATTERN - #4000) / #2000)

SPRITE_PLACEHOLDER_PATTERN_BANK EQU ((SPRITE_PLACEHOLDER_PATTERN - #4000) / #2000)


; ==================================================================
; SPRITE ANIMATION METADATA TABLES
; ==================================================================

; Table: Sprite Asset Frame Counts
; Format: db frame_count
sprite_asset_frame_count_init:
    db 2 ; Sprite 0: anec_right
    db 2 ; Sprite 1: bola
    db 1 ; Sprite 2: panell
    db 2 ; Sprite 3: nina_walk_right
    db 1 ; Sprite 4: nina_jump_right
    db 3 ; Sprite 5: nina_land_right
    db 2 ; Sprite 6: nina_dead_right
    db 2 ; Sprite 7: nina_idle_right
    db 1 ; Sprite 8: nina_fall_right
    db 2 ; Sprite 9: capcuadrat1_right
    db 2 ; Sprite 10: anec_left
    db 2 ; Sprite 11: nina_walk_left
    db 1 ; Sprite 12: nina_jump_left
    db 3 ; Sprite 13: nina_land_left
    db 2 ; Sprite 14: nina_dead_left
    db 2 ; Sprite 15: nina_idle_left
    db 1 ; Sprite 16: nina_fall_left
    db 2 ; Sprite 17: capcuadrat1_left

; Table: Sprite Asset Drawable Layer Counts
; Format: db compact drawable layer count (minimum 1)
sprite_asset_layer_count_init:
    db 2 ; Sprite 0: anec_right
    db 1 ; Sprite 1: bola
    db 2 ; Sprite 2: panell
    db 2 ; Sprite 3: nina_walk_right
    db 2 ; Sprite 4: nina_jump_right
    db 2 ; Sprite 5: nina_land_right
    db 2 ; Sprite 6: nina_dead_right
    db 2 ; Sprite 7: nina_idle_right
    db 2 ; Sprite 8: nina_fall_right
    db 2 ; Sprite 9: capcuadrat1_right
    db 2 ; Sprite 10: anec_left
    db 2 ; Sprite 11: nina_walk_left
    db 2 ; Sprite 12: nina_jump_left
    db 2 ; Sprite 13: nina_land_left
    db 2 ; Sprite 14: nina_dead_left
    db 2 ; Sprite 15: nina_idle_left
    db 2 ; Sprite 16: nina_fall_left
    db 2 ; Sprite 17: capcuadrat1_left
SPRITE_ASSET_COUNT EQU 18
SPRITE_PATTERN_PRELOAD_MODE EQU 1

; Table: Sprite Asset Loop Flags
; Format: db flags (bit 1: 1=loop, 0=once)
sprite_loop_flags_init:
    db 2 ; Sprite 0: anec_right
    db 2 ; Sprite 1: bola
    db 0 ; Sprite 2: panell
    db 2 ; Sprite 3: nina_walk_right
    db 0 ; Sprite 4: nina_jump_right
    db 0 ; Sprite 5: nina_land_right
    db 0 ; Sprite 6: nina_dead_right
    db 0 ; Sprite 7: nina_idle_right
    db 0 ; Sprite 8: nina_fall_right
    db 2 ; Sprite 9: capcuadrat1_right
    db 2 ; Sprite 10: anec_left
    db 2 ; Sprite 11: nina_walk_left
    db 0 ; Sprite 12: nina_jump_left
    db 0 ; Sprite 13: nina_land_left
    db 0 ; Sprite 14: nina_dead_left
    db 0 ; Sprite 15: nina_idle_left
    db 0 ; Sprite 16: nina_fall_left
    db 2 ; Sprite 17: capcuadrat1_left

; Table: Sprite Asset Frame Pointer List Table
; Format: dw SPRITE_<id>_FRAME_PTRS
sprite_asset_frame_ptr_table:
    dw SPRITE_0_FRAME_PTRS
    dw SPRITE_1_FRAME_PTRS
    dw SPRITE_2_FRAME_PTRS
    dw SPRITE_3_FRAME_PTRS
    dw SPRITE_4_FRAME_PTRS
    dw SPRITE_5_FRAME_PTRS
    dw SPRITE_6_FRAME_PTRS
    dw SPRITE_7_FRAME_PTRS
    dw SPRITE_8_FRAME_PTRS
    dw SPRITE_9_FRAME_PTRS
    dw SPRITE_10_FRAME_PTRS
    dw SPRITE_11_FRAME_PTRS
    dw SPRITE_12_FRAME_PTRS
    dw SPRITE_13_FRAME_PTRS
    dw SPRITE_14_FRAME_PTRS
    dw SPRITE_15_FRAME_PTRS
    dw SPRITE_16_FRAME_PTRS
    dw SPRITE_17_FRAME_PTRS

; Sprite 0: anec_right frame pointers
SPRITE_0_FRAME_PTRS:
    dw ANEC_RIGHT_0_F0_LAYER1
    dw ANEC_RIGHT_0_F1_LAYER1

; Sprite 1: bola frame pointers
SPRITE_1_FRAME_PTRS:
    dw BOLA_1_F0_LAYER1
    dw BOLA_1_F1_LAYER1

; Sprite 2: panell frame pointers
SPRITE_2_FRAME_PTRS:
    dw PANELL_2_F0_LAYER1

; Sprite 3: nina_walk_right frame pointers
SPRITE_3_FRAME_PTRS:
    dw NINA_WALK_RIGHT_3_F0_LAYER0
    dw NINA_WALK_RIGHT_3_F1_LAYER0

; Sprite 4: nina_jump_right frame pointers
SPRITE_4_FRAME_PTRS:
    dw NINA_JUMP_RIGHT_4_F0_LAYER0

; Sprite 5: nina_land_right frame pointers
SPRITE_5_FRAME_PTRS:
    dw NINA_LAND_RIGHT_5_F0_LAYER0
    dw NINA_LAND_RIGHT_5_F1_LAYER0
    dw NINA_LAND_RIGHT_5_F2_LAYER0

; Sprite 6: nina_dead_right frame pointers
SPRITE_6_FRAME_PTRS:
    dw NINA_DEAD_RIGHT_6_F0_LAYER0
    dw NINA_DEAD_RIGHT_6_F1_LAYER0

; Sprite 7: nina_idle_right frame pointers
SPRITE_7_FRAME_PTRS:
    dw NINA_IDLE_RIGHT_7_F0_LAYER0
    dw NINA_IDLE_RIGHT_7_F1_LAYER0

; Sprite 8: nina_fall_right frame pointers
SPRITE_8_FRAME_PTRS:
    dw NINA_FALL_RIGHT_8_F0_LAYER0

; Sprite 9: capcuadrat1_right frame pointers
SPRITE_9_FRAME_PTRS:
    dw CAPCUADRAT1_RIGHT_9_F0_LAYER2
    dw CAPCUADRAT1_RIGHT_9_F1_LAYER2

; Sprite 10: anec_left frame pointers
SPRITE_10_FRAME_PTRS:
    dw ANEC_LEFT_10_F0_LAYER1
    dw ANEC_LEFT_10_F1_LAYER1

; Sprite 11: nina_walk_left frame pointers
SPRITE_11_FRAME_PTRS:
    dw NINA_WALK_LEFT_11_F0_LAYER0
    dw NINA_WALK_LEFT_11_F1_LAYER0

; Sprite 12: nina_jump_left frame pointers
SPRITE_12_FRAME_PTRS:
    dw NINA_JUMP_LEFT_12_F0_LAYER0

; Sprite 13: nina_land_left frame pointers
SPRITE_13_FRAME_PTRS:
    dw NINA_LAND_LEFT_13_F0_LAYER0
    dw NINA_LAND_LEFT_13_F1_LAYER0
    dw NINA_LAND_LEFT_13_F2_LAYER0

; Sprite 14: nina_dead_left frame pointers
SPRITE_14_FRAME_PTRS:
    dw NINA_DEAD_LEFT_14_F0_LAYER0
    dw NINA_DEAD_LEFT_14_F1_LAYER0

; Sprite 15: nina_idle_left frame pointers
SPRITE_15_FRAME_PTRS:
    dw NINA_IDLE_LEFT_15_F0_LAYER0
    dw NINA_IDLE_LEFT_15_F1_LAYER0

; Sprite 16: nina_fall_left frame pointers
SPRITE_16_FRAME_PTRS:
    dw NINA_FALL_LEFT_16_F0_LAYER0

; Sprite 17: capcuadrat1_left frame pointers
SPRITE_17_FRAME_PTRS:
    dw CAPCUADRAT1_LEFT_17_F0_LAYER2
    dw CAPCUADRAT1_LEFT_17_F1_LAYER2

; ==================================================================
; DIRECTIONAL SPRITE LOOKUP TABLES
; Maps any sprite asset index to its directional variant index.
; If no directional variant exists, table points back to same index.
; ==================================================================
sprite_dir_left_table_init:
    db 10, 1, 2, 11, 12, 13, 14, 15, 16, 17, 10, 11, 12, 13, 14, 15
    db 16, 17

sprite_dir_right_table_init:
    db 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 3, 4, 5, 6, 7
    db 8, 9

sprite_dir_up_table_init:
    db 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15
    db 16, 17

sprite_dir_down_table_init:
    db 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15
    db 16, 17

 
; ================================================================== 
; SPRITE CONFIGURATION TABLES 
; ================================================================== 

; Table: Entity Sprite Configuration 
; Format: db base_hw_sprite_index, layer_count 
entity_sprite_config_init:
    db 0, 2 ; Entity 0 (nina_idle_right)
    db 2, 2 ; Entity 1 (capcuadrat1_right)
    db 4, 2 ; Entity 2 (anec_right)
    db 6, 1 ; Entity 3 (bola)
    ds 56, 0 ; Padding

; Table: Entity -> Sprite Asset Index (ROM initial values)
; Copied to RAM entity_sprite_asset_index at init
; Format: db sprite_asset_index (#FF = none)
entity_sprite_asset_index_init:
    db #07 ; Entity 0 (nina_idle_right)
    db #09 ; Entity 1 (capcuadrat1_right)
    db #00 ; Entity 2 (anec_right)
    db #01 ; Entity 3 (bola)
    ds 28, #FF ; Padding
SPRITE_MAX_ENTITY_LAYERS EQU 2  ; Max HW sprite layers per entity

; Table: Hardware Sprite Layer Colors (ROM initial values - copied to RAM at init)
; Format: db color_index
sprite_layer_colors_init:
    ; Entity 0 (nina_idle_right) layers:
    db 6 ; Layer 0
    db 15 ; Layer 1
    ; Entity 1 (capcuadrat1_right) layers:
    db 10 ; Layer 0
    db 14 ; Layer 1
    ; Entity 2 (anec_right) layers:
    db 15 ; Layer 0
    db 7 ; Layer 1
    ; Entity 3 (bola) layers:
    db 13 ; Layer 0
    ds 25, 0 ; Padding

; Table: Hardware Sprite Layer Y Offsets (ROM initial values - copied to RAM at init)
; Format: db signed_offset_y
sprite_layer_y_offsets_init:
    ; Entity 0 (nina_idle_right) layers:
    db 0 ; Layer 0
    db 0 ; Layer 1
    ; Entity 1 (capcuadrat1_right) layers:
    db 0 ; Layer 0
    db 0 ; Layer 1
    ; Entity 2 (anec_right) layers:
    db 0 ; Layer 0
    db 0 ; Layer 1
    ; Entity 3 (bola) layers:
    db 0 ; Layer 0
    ds 25, 0 ; Padding

; Table: SM Sprite Layer Colors (for Action_ChangeSprite runtime color update)
; Format: SPRITE_MAX_ENTITY_LAYERS bytes per sprite asset
; Entry[i*SPRITE_MAX_ENTITY_LAYERS + j] = color for HW sprite slot j of sprite i
SM_SpriteLayerColorTable_init:
    db 15, 7 ; Sprite 0: anec_right
    db 13, 0 ; Sprite 1: bola
    db 15, 8 ; Sprite 2: panell
    db 6, 15 ; Sprite 3: nina_walk_right
    db 6, 15 ; Sprite 4: nina_jump_right
    db 6, 15 ; Sprite 5: nina_land_right
    db 6, 1 ; Sprite 6: nina_dead_right
    db 6, 15 ; Sprite 7: nina_idle_right
    db 6, 15 ; Sprite 8: nina_fall_right
    db 10, 14 ; Sprite 9: capcuadrat1_right
    db 15, 7 ; Sprite 10: anec_left
    db 6, 15 ; Sprite 11: nina_walk_left
    db 6, 15 ; Sprite 12: nina_jump_left
    db 6, 15 ; Sprite 13: nina_land_left
    db 6, 1 ; Sprite 14: nina_dead_left
    db 6, 15 ; Sprite 15: nina_idle_left
    db 6, 15 ; Sprite 16: nina_fall_left
    db 10, 14 ; Sprite 17: capcuadrat1_left

; Table: SM Sprite Layer Y Offsets (for Action_ChangeSprite runtime layer alignment)
; Format: SPRITE_MAX_ENTITY_LAYERS bytes per sprite asset
; Entry[i*SPRITE_MAX_ENTITY_LAYERS + j] = signed Y offset for HW sprite slot j of sprite i
SM_SpriteLayerYOffsetTable_init:
    db 0, 0 ; Sprite 0: anec_right
    db 0, 0 ; Sprite 1: bola
    db 0, 0 ; Sprite 2: panell
    db 0, 0 ; Sprite 3: nina_walk_right
    db 0, 0 ; Sprite 4: nina_jump_right
    db 0, 0 ; Sprite 5: nina_land_right
    db 0, 0 ; Sprite 6: nina_dead_right
    db 0, 0 ; Sprite 7: nina_idle_right
    db 0, 0 ; Sprite 8: nina_fall_right
    db 0, 0 ; Sprite 9: capcuadrat1_right
    db 0, 0 ; Sprite 10: anec_left
    db 0, 0 ; Sprite 11: nina_walk_left
    db 0, 0 ; Sprite 12: nina_jump_left
    db 0, 0 ; Sprite 13: nina_land_left
    db 0, 0 ; Sprite 14: nina_dead_left
    db 0, 0 ; Sprite 15: nina_idle_left
    db 0, 0 ; Sprite 16: nina_fall_left
    db 0, 0 ; Sprite 17: capcuadrat1_left

; ==================================================================
; SPRITE INITIALIZATION FUNCTIONS
; ==================================================================

init_sprites:
    ; Copy ROM sprite metadata tables into RAM so gameplay code can read them
    ; without depending on which MegaROM bank is currently mapped.
    ld hl, entity_sprite_config_init
    ld de, entity_sprite_config
    ld bc, 64
    ldir
    ld hl, sprite_asset_frame_count_init
    ld de, sprite_asset_frame_count
    ld bc, 18
    ldir
    ld hl, sprite_asset_layer_count_init
    ld de, sprite_asset_layer_count
    ld bc, 18
    ldir
    ld hl, sprite_loop_flags_init
    ld de, sprite_loop_flags
    ld bc, 18
    ldir
    ld hl, sprite_dir_left_table_init
    ld de, sprite_dir_left_table
    ld bc, 18
    ldir
    ld hl, sprite_dir_right_table_init
    ld de, sprite_dir_right_table
    ld bc, 18
    ldir
    ld hl, sprite_dir_up_table_init
    ld de, sprite_dir_up_table
    ld bc, 18
    ldir
    ld hl, sprite_dir_down_table_init
    ld de, sprite_dir_down_table
    ld bc, 18
    ldir
    ld hl, SM_SpriteLayerColorTable_init
    ld de, SM_SpriteLayerColorTable
    ld bc, 36
    ldir
    ld hl, SM_SpriteLayerYOffsetTable_init
    ld de, SM_SpriteLayerYOffsetTable
    ld bc, 36
    ldir
    ld hl, entity_sprite_asset_index_init
    ld de, entity_sprite_asset_index
    ld bc, 32
    ldir
    ; Copy sprite_layer_colors_init (ROM) -> sprite_layer_colors (RAM)
    ld hl, sprite_layer_colors_init
    ld de, sprite_layer_colors
    ld bc, 32
    ldir
    ; Copy sprite_layer_y_offsets_init (ROM) -> sprite_layer_y_offsets (RAM)
    ld hl, sprite_layer_y_offsets_init
    ld de, sprite_layer_y_offsets
    ld bc, 32
    ldir
    call call_clear_all_sprites_resident
    ld hl, sprite_asset_base_pattern_slot_runtime
    ld (hl), 0
    ld de, sprite_asset_base_pattern_slot_runtime+1
    ld bc, 17
    ldir
    xor a
    ld (sprite_placeholder_base_pattern_num), a
    ld a, #FF
    ld (current_sprite_pattern_pack_id), a
    xor a
    ld (active_sprite_count), a
    ret

load_sprite_patterns:
    call load_sprite_patterns_worldmap_1770754170935
    ret


SPRITE_PATTERN_PACK_INVALID EQU #FF
SPRITE_PATTERN_PACK_COUNT EQU 1

; World index -> runtime sprite pattern pack id
world_sprite_pattern_pack_table:
    db SPRITE_PATTERN_PACK_WORLDMAP_1770754170935_ID ; World 0: New Worldmap

; ------------------------------------------------------------------
; Runtime Sprite Pattern Pack: World "New Worldmap"
; Slots required: 63/64
; ------------------------------------------------------------------
SPRITE_PATTERN_PACK_WORLDMAP_1770754170935_ID EQU 0

sprite_asset_base_pattern_slot_worldmap_1770754170935:
    db 0 ; Sprite 0: anec_right
    db 4 ; Sprite 1: bola
    db 0 ; Sprite 2: panell
    db 6 ; Sprite 3: nina_walk_right
    db 10 ; Sprite 4: nina_jump_right
    db 12 ; Sprite 5: nina_land_right
    db 18 ; Sprite 6: nina_dead_right
    db 22 ; Sprite 7: nina_idle_right
    db 26 ; Sprite 8: nina_fall_right
    db 28 ; Sprite 9: capcuadrat1_right
    db 32 ; Sprite 10: anec_left
    db 36 ; Sprite 11: nina_walk_left
    db 40 ; Sprite 12: nina_jump_left
    db 42 ; Sprite 13: nina_land_left
    db 48 ; Sprite 14: nina_dead_left
    db 52 ; Sprite 15: nina_idle_left
    db 56 ; Sprite 16: nina_fall_left
    db 58 ; Sprite 17: capcuadrat1_left

load_sprite_patterns_worldmap_1770754170935:
    ld hl, sprite_asset_base_pattern_slot_worldmap_1770754170935
    ld de, sprite_asset_base_pattern_slot_runtime
    ld bc, SPRITE_ASSET_COUNT
    ldir
    ld a, 248
    ld (sprite_placeholder_base_pattern_num), a
    ; Sprite Asset 0: anec_right frame 0 (2 layers)
    ld a, RESOURCE_ID_ANEC_RIGHT_0_F0_LAYER1
    ld de, SPRPAT + (0 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_ANEC_RIGHT_0_F0_LAYER2
    ld de, SPRPAT + (1 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 0: anec_right frame 1 (2 layers)
    ld a, RESOURCE_ID_ANEC_RIGHT_0_F1_LAYER1
    ld de, SPRPAT + (2 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_ANEC_RIGHT_0_F1_LAYER2
    ld de, SPRPAT + (3 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 1: bola frame 0 (1 layers)
    ld a, RESOURCE_ID_BOLA_1_F0_LAYER1
    ld de, SPRPAT + (4 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 1: bola frame 1 (1 layers)
    ld a, RESOURCE_ID_BOLA_1_F1_LAYER1
    ld de, SPRPAT + (5 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 3: nina_walk_right frame 0 (2 layers)
    ld a, RESOURCE_ID_NINA_WALK_RIGHT_3_F0_LAYER0
    ld de, SPRPAT + (6 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_NINA_WALK_RIGHT_3_F0_LAYER1
    ld de, SPRPAT + (7 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 3: nina_walk_right frame 1 (2 layers)
    ld a, RESOURCE_ID_NINA_WALK_RIGHT_3_F1_LAYER0
    ld de, SPRPAT + (8 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_NINA_WALK_RIGHT_3_F1_LAYER1
    ld de, SPRPAT + (9 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 4: nina_jump_right frame 0 (2 layers)
    ld a, RESOURCE_ID_NINA_JUMP_RIGHT_4_F0_LAYER0
    ld de, SPRPAT + (10 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_NINA_JUMP_RIGHT_4_F0_LAYER1
    ld de, SPRPAT + (11 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 5: nina_land_right frame 0 (2 layers)
    ld a, RESOURCE_ID_NINA_LAND_RIGHT_5_F0_LAYER0
    ld de, SPRPAT + (12 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_NINA_LAND_RIGHT_5_F0_LAYER1
    ld de, SPRPAT + (13 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 5: nina_land_right frame 1 (2 layers)
    ld a, RESOURCE_ID_NINA_LAND_RIGHT_5_F1_LAYER0
    ld de, SPRPAT + (14 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_NINA_LAND_RIGHT_5_F1_LAYER1
    ld de, SPRPAT + (15 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 5: nina_land_right frame 2 (2 layers)
    ld a, RESOURCE_ID_NINA_LAND_RIGHT_5_F2_LAYER0
    ld de, SPRPAT + (16 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_NINA_LAND_RIGHT_5_F2_LAYER1
    ld de, SPRPAT + (17 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 6: nina_dead_right frame 0 (2 layers)
    ld a, RESOURCE_ID_NINA_DEAD_RIGHT_6_F0_LAYER0
    ld de, SPRPAT + (18 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_NINA_DEAD_RIGHT_6_F0_LAYER2
    ld de, SPRPAT + (19 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 6: nina_dead_right frame 1 (2 layers)
    ld a, RESOURCE_ID_NINA_DEAD_RIGHT_6_F1_LAYER0
    ld de, SPRPAT + (20 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_NINA_DEAD_RIGHT_6_F1_LAYER2
    ld de, SPRPAT + (21 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 7: nina_idle_right frame 0 (2 layers)
    ld a, RESOURCE_ID_NINA_IDLE_RIGHT_7_F0_LAYER0
    ld de, SPRPAT + (22 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_NINA_IDLE_RIGHT_7_F0_LAYER1
    ld de, SPRPAT + (23 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 7: nina_idle_right frame 1 (2 layers)
    ld a, RESOURCE_ID_NINA_IDLE_RIGHT_7_F1_LAYER0
    ld de, SPRPAT + (24 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_NINA_IDLE_RIGHT_7_F1_LAYER1
    ld de, SPRPAT + (25 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 8: nina_fall_right frame 0 (2 layers)
    ld a, RESOURCE_ID_NINA_FALL_RIGHT_8_F0_LAYER0
    ld de, SPRPAT + (26 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_NINA_FALL_RIGHT_8_F0_LAYER1
    ld de, SPRPAT + (27 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 9: capcuadrat1_right frame 0 (2 layers)
    ld a, RESOURCE_ID_CAPCUADRAT1_RIGHT_9_F0_LAYER2
    ld de, SPRPAT + (28 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_CAPCUADRAT1_RIGHT_9_F0_LAYER3
    ld de, SPRPAT + (29 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 9: capcuadrat1_right frame 1 (2 layers)
    ld a, RESOURCE_ID_CAPCUADRAT1_RIGHT_9_F1_LAYER2
    ld de, SPRPAT + (30 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_CAPCUADRAT1_RIGHT_9_F1_LAYER3
    ld de, SPRPAT + (31 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 10: anec_left frame 0 (2 layers)
    ld a, RESOURCE_ID_ANEC_LEFT_10_F0_LAYER1
    ld de, SPRPAT + (32 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_ANEC_LEFT_10_F0_LAYER2
    ld de, SPRPAT + (33 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 10: anec_left frame 1 (2 layers)
    ld a, RESOURCE_ID_ANEC_LEFT_10_F1_LAYER1
    ld de, SPRPAT + (34 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_ANEC_LEFT_10_F1_LAYER2
    ld de, SPRPAT + (35 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 11: nina_walk_left frame 0 (2 layers)
    ld a, RESOURCE_ID_NINA_WALK_LEFT_11_F0_LAYER0
    ld de, SPRPAT + (36 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_NINA_WALK_LEFT_11_F0_LAYER1
    ld de, SPRPAT + (37 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 11: nina_walk_left frame 1 (2 layers)
    ld a, RESOURCE_ID_NINA_WALK_LEFT_11_F1_LAYER0
    ld de, SPRPAT + (38 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_NINA_WALK_LEFT_11_F1_LAYER1
    ld de, SPRPAT + (39 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 12: nina_jump_left frame 0 (2 layers)
    ld a, RESOURCE_ID_NINA_JUMP_LEFT_12_F0_LAYER0
    ld de, SPRPAT + (40 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_NINA_JUMP_LEFT_12_F0_LAYER1
    ld de, SPRPAT + (41 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 13: nina_land_left frame 0 (2 layers)
    ld a, RESOURCE_ID_NINA_LAND_LEFT_13_F0_LAYER0
    ld de, SPRPAT + (42 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_NINA_LAND_LEFT_13_F0_LAYER1
    ld de, SPRPAT + (43 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 13: nina_land_left frame 1 (2 layers)
    ld a, RESOURCE_ID_NINA_LAND_LEFT_13_F1_LAYER0
    ld de, SPRPAT + (44 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_NINA_LAND_LEFT_13_F1_LAYER1
    ld de, SPRPAT + (45 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 13: nina_land_left frame 2 (2 layers)
    ld a, RESOURCE_ID_NINA_LAND_LEFT_13_F2_LAYER0
    ld de, SPRPAT + (46 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_NINA_LAND_LEFT_13_F2_LAYER1
    ld de, SPRPAT + (47 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 14: nina_dead_left frame 0 (2 layers)
    ld a, RESOURCE_ID_NINA_DEAD_LEFT_14_F0_LAYER0
    ld de, SPRPAT + (48 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_NINA_DEAD_LEFT_14_F0_LAYER2
    ld de, SPRPAT + (49 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 14: nina_dead_left frame 1 (2 layers)
    ld a, RESOURCE_ID_NINA_DEAD_LEFT_14_F1_LAYER0
    ld de, SPRPAT + (50 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_NINA_DEAD_LEFT_14_F1_LAYER2
    ld de, SPRPAT + (51 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 15: nina_idle_left frame 0 (2 layers)
    ld a, RESOURCE_ID_NINA_IDLE_LEFT_15_F0_LAYER0
    ld de, SPRPAT + (52 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_NINA_IDLE_LEFT_15_F0_LAYER1
    ld de, SPRPAT + (53 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 15: nina_idle_left frame 1 (2 layers)
    ld a, RESOURCE_ID_NINA_IDLE_LEFT_15_F1_LAYER0
    ld de, SPRPAT + (54 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_NINA_IDLE_LEFT_15_F1_LAYER1
    ld de, SPRPAT + (55 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 16: nina_fall_left frame 0 (2 layers)
    ld a, RESOURCE_ID_NINA_FALL_LEFT_16_F0_LAYER0
    ld de, SPRPAT + (56 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_NINA_FALL_LEFT_16_F0_LAYER1
    ld de, SPRPAT + (57 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 17: capcuadrat1_left frame 0 (2 layers)
    ld a, RESOURCE_ID_CAPCUADRAT1_LEFT_17_F0_LAYER2
    ld de, SPRPAT + (58 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_CAPCUADRAT1_LEFT_17_F0_LAYER3
    ld de, SPRPAT + (59 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 17: capcuadrat1_left frame 1 (2 layers)
    ld a, RESOURCE_ID_CAPCUADRAT1_LEFT_17_F1_LAYER2
    ld de, SPRPAT + (60 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_CAPCUADRAT1_LEFT_17_F1_LAYER3
    ld de, SPRPAT + (61 * 32)
    call resource_load_to_vram_by_id
    ; Placeholder sprite used by missing sprite refs
    ld a, RESOURCE_ID_SPRITE_PLACEHOLDER_PATTERN
    ld de, SPRPAT + (62 * 32)
    call resource_load_to_vram_by_id
    ld a, SPRITE_PATTERN_PACK_WORLDMAP_1770754170935_ID
    ld (current_sprite_pattern_pack_id), a
    ret


ensure_sprite_patterns_worldmap_1770754170935:
    ld a, (current_sprite_pattern_pack_id)
    cp SPRITE_PATTERN_PACK_WORLDMAP_1770754170935_ID
    ret z
    jp load_sprite_patterns_worldmap_1770754170935

; ------------------------------------------------------------------
; Generic sprite pattern dispatchers
; ------------------------------------------------------------------
load_sprite_patterns_by_pack_id:
    cp SPRITE_PATTERN_PACK_INVALID
    ret z
    cp SPRITE_PATTERN_PACK_WORLDMAP_1770754170935_ID
    jp z, load_sprite_patterns_worldmap_1770754170935
    ret

ensure_sprite_patterns_by_pack_id:
    cp SPRITE_PATTERN_PACK_INVALID
    ret z
    cp SPRITE_PATTERN_PACK_WORLDMAP_1770754170935_ID
    jp z, ensure_sprite_patterns_worldmap_1770754170935
    ret

; ------------------------------------------------------------------
; ensure_sprite_patterns_for_world_id
; Input:  A = world id
; Output: matching sprite pack ensured when world id is valid
; Destroys: AF, DE, HL
; ------------------------------------------------------------------
ensure_sprite_patterns_for_world_id:
    cp 1
    ret nc
    ld e, a
    ld d, 0
    ld hl, world_sprite_pattern_pack_table
    add hl, de
    ld a, (hl)
    jp ensure_sprite_patterns_by_pack_id

; ==================================================================
; SPRITE MANAGEMENT FUNCTIONS
; ==================================================================

; A = hardware sprite index, B = X, C = Y, D = pattern, E = color
show_sprite:
    ; Safety check: Ensure sprite index < 32
    cp 32
    ret nc

    ; Safety check: Never write Y >= 208 (208 is SAT end marker on MSX)
    push af
    ld a, c
    cp 208
    jr c, .y_ok
    ld c, SPRITE_INVISIBLE
.y_ok:
    pop af

    ; Save pattern (D) and color (E) before calculating address
    push de

    ; Calculate base address for sprite: index * 4
    ld l, a
    ld h, 0
    add hl, hl      ; index * 2
    add hl, hl      ; index * 4
    ; Add base of the attribute table
    ld de, sprite_attributes
    add hl, de      ; HL = &sprite_attributes[index * 4]

    ; Restore pattern and color
    pop de

    ; Write attributes
    ld (hl), c      ; Y
    inc hl
    ld (hl), b      ; X
    inc hl
    ld (hl), d      ; Pattern
    inc hl
    ld (hl), e      ; Color

    ld a, 1
    ld (sprites_dirty), a
    ret

; Clear all sprites (set Y = SPRITE_INVISIBLE)
; OPTIMIZED: Uses faster increment method instead of ADD HL,DE
clear_all_sprites:
    ld hl, sprite_attributes
    ld b, 32
    ld a, SPRITE_INVISIBLE
.sprite_clear_loop:
    ld (hl), a      ; Set Y = SPRITE_INVISIBLE
    inc hl          ; Skip to X
    inc hl          ; Skip to Pattern
    inc hl          ; Skip to Color
    inc hl          ; Next sprite (4× INC HL = 24 cycles vs ADD HL,DE = 35 cycles)
    djnz .sprite_clear_loop
    ld a, 1
    ld (sprites_dirty), a
    ret

; Hide specific sprite (A = hardware sprite index)
hide_sprite:
    cp 32
    ret nc
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    ld de, sprite_attributes
    add hl, de
    ld (hl), SPRITE_INVISIBLE
    ld a, 1
    ld (sprites_dirty), a
    ret

; Copy sprite attributes from RAM to VRAM
update_sprites_to_vram:
    ld a, (sprites_dirty)
    or a
    ret z
    xor a
    ld (sprites_dirty), a
    ld hl, sprite_attributes
    ld de, SPRATR
    ld bc, 32  ; Upload active sprite range + SAT end marker
    call FAST_LDIRVM
    ret

; ==================================================================
; SPRITE CONSTANTS
; ==================================================================
SPRITE_INVISIBLE    EQU 224

; ==================================================================
; RAM REQUIREMENTS
; ==================================================================
; sprite_attributes: ds 128
; active_sprite_count: db 0
; sprites_dirty: db 0
; sprite_layer_y_offsets: ds 32


; --- End of Far Bank 6 — pad to 8KB boundary ---
    ds #8000 - $, #FF
    org FAR_BANK_6_ROM_START + #2000

; ##################################################################
; FAR BANK 7 — [#6000h-#8000h] FAR CODE: bosses
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank7 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-3). No far-to-far calls allowed.
; ##################################################################
FAR_BANK_7_ROM_START:
    org #6000

; ==================================================================
; BOSSES
; No boss assets in this project.
; ==================================================================

BOSS_COUNT EQU 0
BOSS_DIR_LEFT EQU 0
BOSS_DIR_RIGHT EQU 1
BOSS_DIR_UP EQU 2
BOSS_DIR_DOWN EQU 3
BOSS_ATTACK_PROJECTILE EQU 0
BOSS_ATTACK_MELEE EQU 1
BOSS_ATTACK_SPECIAL EQU 2
BOSS_ATTACK_PATTERN EQU 3
BOSS_ATTACK_METEOR EQU 4
BOSS_ATTACK_BOMB EQU 5
BOSS_ATTACK_BOOMERANG EQU 6
BOSS_ATTACK_ROCK EQU 7
BOSS_ATTACK_LASER EQU 8
BOSS_ATTACK_SINE_WAVE EQU 9
BOSS_ATTACK_HOMING_MISSILE EQU 10
BOSS_ATTACK_SLAM_ROCKS EQU 11
BOSS_ATTACK_FALLING_BLOCKS EQU 12

init_boss_system:
    xor a
    ld (boss_runtime_tick), a
    ld (boss_active), a
    ld (boss_health_lo), a
    ld (boss_health_hi), a
    ld (boss_hit_cooldown), a
    ld (boss_update_timer), a
    ld (boss_falling_blocks_active), a
    ld a, 1
    ld (boss_update_interval), a
    ret

update_boss_system:
    ret

; ------------------------------------------------------------------
; Boss attack record layout
; ------------------------------------------------------------------
BOSS_ATTACK_TYPE_OFF EQU 0
BOSS_ATTACK_SPRITE_OFF EQU 1
BOSS_ATTACK_DAMAGE_OFF EQU 2
BOSS_ATTACK_SPEED_OFF EQU 3
BOSS_ATTACK_DIR_OFF EQU 4
BOSS_ATTACK_OFFX_OFF EQU 5
BOSS_ATTACK_OFFY_OFF EQU 6
BOSS_ATTACK_RANGE_LO_OFF EQU 7
BOSS_ATTACK_COOLDOWN_LO_OFF EQU 9
BOSS_ATTACK_DURATION_LO_OFF EQU 11
BOSS_ATTACK_METEOR_COUNT_OFF EQU 13
BOSS_ATTACK_METEOR_SPREAD_OFF EQU 14
BOSS_ATTACK_METEOR_WARN_OFF EQU 15
BOSS_ATTACK_COOLDOWN_FRAMES_OFF EQU 16
BOSS_ATTACK_METEOR_COOLDOWN_FRAMES_OFF EQU 16
BOSS_ATTACK_BOMB_COUNT_OFF EQU 17
BOSS_ATTACK_BOMB_SPREAD_OFF EQU 18
BOSS_ATTACK_BOMB_FUSE_OFF EQU 19
BOSS_ATTACK_EXPLOSION_RADIUS_OFF EQU 20
BOSS_ATTACK_EXPLOSION_DURATION_OFF EQU 21
BOSS_ATTACK_EXPLOSION_SPRITE_OFF EQU 22
BOSS_ATTACK_ARC_HEIGHT_OFF EQU 23
BOSS_ATTACK_LASER_TILE_OFF EQU 24
BOSS_ATTACK_LASER_LENGTH_OFF EQU 25
BOSS_ATTACK_LASER_DURATION_OFF EQU 26
BOSS_ATTACK_WAVE_AMPLITUDE_OFF EQU 27
BOSS_ATTACK_WAVE_FREQUENCY_OFF EQU 28
BOSS_ATTACK_HOMING_TURN_STEP_OFF EQU 29
BOSS_ATTACK_SLAM_RISE_CHARS_OFF EQU 30
BOSS_ATTACK_SLAM_WINDUP_FRAMES_OFF EQU 31
BOSS_ATTACK_SLAM_FRAMES_OFF EQU 32
BOSS_ATTACK_SLAM_HOLD_FRAMES_OFF EQU 33
BOSS_ATTACK_BLOCK_TILE_OFF EQU 34
BOSS_ATTACK_BLOCK_LANDING_Y_OFF EQU 35
BOSS_ATTACK_BLOCK_BEHAVIOR_OFF EQU 36
BOSS_ATTACK_RECORD_SIZE EQU 37

; ------------------------------------------------------------------
; Boss phase and screen placement runtime layout
; ------------------------------------------------------------------
BOSS_PHASE_BUILD_TYPE_OFF EQU 1
BOSS_PHASE_WIDTH_OFF EQU 2
BOSS_PHASE_HEIGHT_OFF EQU 3
BOSS_PHASE_TILE_MATRIX_PTR_OFF EQU 4
BOSS_PHASE_BEHAVIOR_PTR_OFF EQU 14
BOSS_PHASE_FORM_TABLE_PTR_OFF EQU 16
BOSS_PHASE_WEAK_MATRIX_PTR_OFF EQU 18
BOSS_BUILD_TYPE_TILE EQU 0
BOSS_RUNTIME_PLACEMENT_PHASE_TABLE_OFF EQU 0
BOSS_RUNTIME_PLACEMENT_ATTACK_TABLE_OFF EQU 2
BOSS_RUNTIME_PLACEMENT_X_OFF EQU 4
BOSS_RUNTIME_PLACEMENT_Y_OFF EQU 5
BOSS_RUNTIME_PLACEMENT_INITIAL_PHASE_OFF EQU 6
BOSS_RUNTIME_PLACEMENT_FLAGS_OFF EQU 7
BOSS_RUNTIME_PLACEMENT_UPDATE_INTERVAL_OFF EQU 8
BOSS_RUNTIME_PLACEMENT_HEALTH_LO_OFF EQU 9
BOSS_RUNTIME_PLACEMENT_HEALTH_HI_OFF EQU 10
BOSS_RUNTIME_PLACEMENT_FLAG_ENABLED EQU #01
BOSS_BEHAVIOR_WAIT EQU 0
BOSS_BEHAVIOR_MOVE_TO EQU 1
BOSS_BEHAVIOR_ATTACK EQU 2
BOSS_BEHAVIOR_SLAM EQU 3
BOSS_BEHAVIOR_PROTECT EQU 4
BOSS_BEHAVIOR_SHIELD EQU 5
BOSS_BEHAVIOR_SET_FORM EQU 6
BOSS_BEHAVIOR_ANIMATE_FORM EQU 7
BOSS_BEHAVIOR_LOOP EQU 8
BOSS_BEHAVIOR_TARGET_FIXED EQU 0
BOSS_BEHAVIOR_TARGET_PLAYER_CURRENT EQU 1
BOSS_BEHAVIOR_TARGET_PLAYER_PREDICTED EQU 2
BOSS_BEHAVIOR_TARGET_PLAYER_LAST_KNOWN EQU 3
BOSS_BEHAVIOR_TARGET_BOSS_RELATIVE EQU 4
BOSS_BEHAVIOR_ACTION_SIZE EQU 8

; Register Contract:
; input: current_screen_boss_count/current_screen_boss_table identify the current screen placement table
; output: first enabled boss placement is copied to boss runtime RAM and drawn to the SCREEN 2 name table
; clobbers: AF, BC, DE, HL
; preserves: IX
init_screen_boss_from_current_screen:
    push ix
    xor a
    ld (boss_active), a
    ld (boss_health_lo), a
    ld (boss_health_hi), a
    ld (boss_hit_cooldown), a
    ld (boss_projectile_active), a
    ld (boss_slam_rocks_active), a
    ld (boss_falling_blocks_active), a
    ld a, (current_screen_boss_count)
    or a
    jp z, .isb_done

    ld hl, (current_screen_boss_table)
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld (boss_phase_table_ptr), de
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld (boss_attack_table_ptr), de
    ld a, (hl)
    inc hl
    ld (boss_x_char), a
    ld (boss_prev_x_char), a
    ld a, (hl)
    inc hl
    ld (boss_y_char), a
    ld (boss_prev_y_char), a
    ld a, (hl)
    inc hl
    ld (boss_initial_phase_index), a
    ld a, (hl)
    inc hl
    and BOSS_RUNTIME_PLACEMENT_FLAG_ENABLED
    jp z, .isb_done
    ld a, (hl)
    or a
    jp nz, .isb_update_interval_ok
    ld a, 1
.isb_update_interval_ok:
    ld (boss_update_interval), a
    inc hl
    xor a
    ld (boss_update_timer), a
    ld (boss_hit_cooldown), a
    ld a, (hl)
    inc hl
    ld (boss_health_lo), a
    ld a, (hl)
    inc hl
    ld (boss_health_hi), a

    call boss_resolve_initial_phase
    call boss_init_behavior_state
    ld a, 1
    ld (boss_active), a
    call draw_active_boss_tiles

.isb_done:
    pop ix
    ret

; Register Contract:
; input: boss_phase_table_ptr and boss_initial_phase_index
; output: boss_phase_ptr, boss_tile_matrix_ptr, boss_weak_matrix_ptr, boss_width and boss_height populated from the selected phase record
; clobbers: AF, DE, HL, IX
boss_resolve_initial_phase:
    ld hl, (boss_phase_table_ptr)
    ld a, (boss_initial_phase_index)
    add a, a
    ld e, a
    ld d, 0
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld (boss_phase_ptr), de
    push de
    pop ix
    ld a, (ix+2)
    ld (boss_width), a
    ld a, (ix+3)
    ld (boss_height), a
    ld e, (ix+4)
    ld d, (ix+5)
    ld (boss_tile_matrix_ptr), de
    ld e, (ix+14)
    ld d, (ix+15)
    ld (boss_behavior_table_ptr), de
    ld e, (ix+16)
    ld d, (ix+17)
    ld (boss_form_table_ptr), de
    ld e, (ix+18)
    ld d, (ix+19)
    ld (boss_weak_matrix_ptr), de
    ret

; Register Contract:
; input: boss_behavior_table_ptr resolved from the active phase
; output: behavior interpreter counters reset for this phase
; clobbers: AF, HL
boss_init_behavior_state:
    ld hl, (boss_behavior_table_ptr)
    ld a, h
    cp #FF
    jp nz, .bibs_has_table
    ld a, l
    cp #FF
    jp nz, .bibs_has_table
    xor a
    ld (boss_behavior_count), a
    ld (boss_behavior_index), a
    ld (boss_behavior_timer), a
    ret
.bibs_has_table:
    ld a, (hl)
    ld (boss_behavior_count), a
    xor a
    ld (boss_behavior_index), a
    ld (boss_behavior_timer), a
    ret

; Register Contract:
; input: active boss runtime RAM populated by init_screen_boss_from_current_screen
; output: non-empty boss tile chars are written into the SCREEN 2 name table
; clobbers: AF, BC, DE, HL
; preserves: IX
draw_active_boss_tiles:
    push ix
    ld a, (boss_active)
    or a
    jp z, .dabt_done
    ld a, (boss_width)
    or a
    jp z, .dabt_done
    ld a, (boss_height)
    or a
    jp z, .dabt_done

    xor a
    ld (boss_draw_row), a
.dabt_row_loop:
    ld a, (boss_draw_row)
    ld c, a
    ld a, (boss_height)
    cp c
    jp z, .dabt_done

    xor a
    ld (boss_draw_col), a
.dabt_col_loop:
    ld a, (boss_draw_col)
    ld c, a
    ld a, (boss_width)
    cp c
    jp z, .dabt_next_row

    call boss_get_active_tile_char
    cp #FF
    jp z, .dabt_skip_cell
    ld (boss_draw_char), a

    ld a, (boss_x_char)
    ld b, a
    ld a, (boss_draw_col)
    add a, b
    cp 32
    jp nc, .dabt_skip_cell
    ld (boss_draw_screen_x), a

    ld a, (boss_y_char)
    ld b, a
    ld a, (boss_draw_row)
    add a, b
    cp 24
    jp nc, .dabt_skip_cell
    ld (boss_draw_screen_y), a
    call boss_draw_write_cell

.dabt_skip_cell:
    ld a, (boss_draw_col)
    inc a
    ld (boss_draw_col), a
    jp .dabt_col_loop

.dabt_next_row:
    ld a, (boss_draw_row)
    inc a
    ld (boss_draw_row), a
    jp .dabt_row_loop

.dabt_done:
    pop ix
    ret

; Register Contract:
; input: boss_prev_x_char/boss_prev_y_char and active boss dimensions
; output: previous boss footprint restored from runtime_screen_layout into SCREEN 2 name table
; clobbers: AF, BC, DE, HL
; preserves: IX

restore_active_boss_tiles:
    ret

restore_active_boss_tiles_exposed:
    push ix
    ld a, (boss_active)
    or a
    jp z, .rabte_done
    ld a, (boss_width)
    or a
    jp z, .rabte_done
    ld a, (boss_height)
    or a
    jp z, .rabte_done

    xor a
    ld (boss_restore_row), a
.rabte_row_loop:
    ld a, (boss_restore_row)
    ld c, a
    ld a, (boss_height)
    cp c
    jp z, .rabte_done

    xor a
    ld (boss_restore_col), a
.rabte_col_loop:
    ld a, (boss_restore_col)
    ld c, a
    ld a, (boss_width)
    cp c
    jp z, .rabte_next_row

    ld a, (boss_prev_x_char)
    ld b, a
    ld a, (boss_restore_col)
    add a, b
    cp 32
    jp nc, .rabte_skip_cell
    ld (boss_draw_screen_x), a

    ld a, (boss_prev_y_char)
    ld b, a
    ld a, (boss_restore_row)
    add a, b
    cp 24
    jp nc, .rabte_skip_cell
    ld (boss_draw_screen_y), a

    call boss_current_shape_covers_draw_cell
    jp nz, .rabte_skip_cell
    call boss_get_runtime_layout_char
    ld (boss_draw_char), a
    call boss_draw_write_cell

.rabte_skip_cell:
    ld a, (boss_restore_col)
    inc a
    ld (boss_restore_col), a
    jp .rabte_col_loop

.rabte_next_row:
    ld a, (boss_restore_row)
    inc a
    ld (boss_restore_row), a
    jp .rabte_row_loop

.rabte_done:
    pop ix
    ret

; Register Contract:
; input: boss_draw_screen_x/boss_draw_screen_y and current boss position/shape
; output: NZ if the current boss has a non-empty tile covering that screen cell, Z otherwise
; clobbers: AF, BC, DE, HL
boss_current_shape_covers_draw_cell:
    ld a, (boss_draw_screen_x)
    ld b, a
    ld a, (boss_x_char)
    cp b
    jp z, .bcscdc_x_in_range
    jp nc, .bcscdc_not_covered
.bcscdc_x_in_range:
    ld a, b
    ld b, a
    ld a, (boss_x_char)
    ld c, a
    ld a, b
    sub c
    ld b, a
    ld a, (boss_width)
    cp b
    jp z, .bcscdc_not_covered
    jp c, .bcscdc_not_covered
    ld a, b
    ld (boss_draw_col), a

    ld a, (boss_draw_screen_y)
    ld b, a
    ld a, (boss_y_char)
    cp b
    jp z, .bcscdc_y_in_range
    jp nc, .bcscdc_not_covered
.bcscdc_y_in_range:
    ld a, b
    ld b, a
    ld a, (boss_y_char)
    ld c, a
    ld a, b
    sub c
    ld b, a
    ld a, (boss_height)
    cp b
    jp z, .bcscdc_not_covered
    jp c, .bcscdc_not_covered
    ld a, b
    ld (boss_draw_row), a

    call boss_get_active_tile_char
    cp #FF
    jp z, .bcscdc_not_covered
    ret
.bcscdc_not_covered:
    xor a
    ret

; Register Contract:
; input: boss_draw_screen_x and boss_draw_screen_y
; output: A = char from runtime_screen_layout at that coordinate
; clobbers: AF, DE, HL
boss_get_runtime_layout_char:
    ld a, (boss_draw_screen_y)
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld a, (boss_draw_screen_x)
    ld e, a
    ld d, 0
    add hl, de
    ld de, runtime_screen_layout
    add hl, de
    ld a, (hl)
    ret

; Register Contract:
; input: boss_draw_row, boss_draw_col, boss_tile_matrix_ptr and boss_width
; output: A = tile char for the current boss cell
; clobbers: AF, B, DE, HL
boss_get_active_tile_char:
    ld a, (boss_draw_row)
    ld b, a
    ld hl, 0
.bgat_row_offset_loop:
    ld a, b
    or a
    jp z, .bgat_row_offset_done
    ld a, (boss_width)
    ld e, a
    ld d, 0
    add hl, de
    dec b
    jp .bgat_row_offset_loop
.bgat_row_offset_done:
    ld a, (boss_draw_col)
    ld e, a
    ld d, 0
    add hl, de
    ld de, (boss_tile_matrix_ptr)
    add hl, de
    ld a, (hl)
    ret

; Register Contract:
; input: boss_draw_screen_x, boss_draw_screen_y and boss_draw_char
; output: one SCREEN 2 name table cell is written
; clobbers: AF, DE, HL
boss_draw_write_cell:
    ld a, (boss_draw_screen_y)
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld a, (boss_draw_screen_x)
    ld e, a
    ld d, 0
    add hl, de
    ld de, NAMETBL
    add hl, de
    ld a, (boss_draw_char)
    call FAST_WRTVRM
    ret

; Register Contract:
; input: active boss behavior RAM
; output: boss_x_char/boss_y_char updated according to current behavior action
; clobbers: AF, BC, DE, HL
; preserves: IX
update_boss_behavior:
    push ix
    ld a, (boss_behavior_count)
    or a
    jp z, .ubb_done
    ld a, (boss_behavior_timer)
    or a
    call z, boss_load_current_behavior_action

    ld a, (boss_behavior_action_type)
    cp BOSS_BEHAVIOR_MOVE_TO
    jp z, .ubb_move
    cp BOSS_BEHAVIOR_SET_FORM
    jp z, .ubb_tick
    cp BOSS_BEHAVIOR_LOOP
    jp z, .ubb_loop
    jp .ubb_tick

.ubb_move:
    call boss_tick_behavior_move_step
    jp z, .ubb_tick
    call boss_step_towards_behavior_target
    jp .ubb_tick



.ubb_loop:
    ld a, (boss_behavior_aux0)
    ld b, a
    ld a, (boss_behavior_count)
    cp b
    jp z, .ubb_loop_reset
    jp c, .ubb_loop_reset
    ld a, b
    ld (boss_behavior_index), a
    xor a
    ld (boss_behavior_timer), a
    jp .ubb_done
.ubb_loop_reset:
    xor a
    ld (boss_behavior_index), a
    ld (boss_behavior_timer), a
    jp .ubb_done

.ubb_tick:
    ld a, (boss_behavior_timer)
    or a
    jp z, .ubb_advance
    dec a
    ld (boss_behavior_timer), a
    jp nz, .ubb_done

.ubb_advance:
    ld a, (boss_behavior_index)
    inc a
    ld b, a
    ld a, (boss_behavior_count)
    cp b
    jp nz, .ubb_store_index
    xor a
    jp .ubb_store_index_a
.ubb_store_index:
    ld a, b
.ubb_store_index_a:
    ld (boss_behavior_index), a

.ubb_done:
    pop ix
    ret

; Register Contract:
; input: boss_behavior_table_ptr and boss_behavior_index
; output: current action fields copied to boss_behavior_* RAM
; clobbers: AF, BC, DE, HL
boss_load_current_behavior_action:
    ld hl, (boss_behavior_table_ptr)
    inc hl
    inc hl
    inc hl
    ld a, (boss_behavior_index)
    ld b, a
.blcba_offset_loop:
    ld a, b
    or a
    jp z, .blcba_offset_done
    ld de, BOSS_BEHAVIOR_ACTION_SIZE
    add hl, de
    dec b
    jp .blcba_offset_loop
.blcba_offset_done:
    ld (boss_behavior_action_ptr), hl
    ld a, (hl)
    ld (boss_behavior_action_type), a
    inc hl
    ld a, (hl)
    or a
    jp nz, .blcba_duration_ok
    ld a, 1
.blcba_duration_ok:
    ld (boss_behavior_duration), a
    ld (boss_behavior_timer), a
    inc hl
    ld a, (hl)
    ld (boss_behavior_target_type), a
    inc hl
    ld a, (hl)
    ld (boss_behavior_target_x), a
    inc hl
    ld a, (hl)
    ld (boss_behavior_target_y), a
    inc hl
    ld a, (hl)
    ld (boss_behavior_aux0), a
    inc hl
    ld a, (hl)
    ld (boss_behavior_aux1), a
    inc hl
    ld a, (hl)
    ld (boss_behavior_aux2), a
    ld a, (boss_behavior_action_type)
    cp BOSS_BEHAVIOR_MOVE_TO
    jp z, boss_prepare_behavior_move_timing
    cp BOSS_BEHAVIOR_SET_FORM
    jp z, boss_apply_behavior_form
    ld a, 1
    ld (boss_behavior_step_interval), a
    ld (boss_behavior_step_timer), a
    ret

; Register Contract:
; input: boss_behavior_aux0 = visual form index, boss_form_table_ptr points to db count + dw tileMatrix, weakMatrix pairs
; output: boss_tile_matrix_ptr/boss_weak_matrix_ptr switched and boss_visual_dirty set when form index is valid
; clobbers: AF, BC, DE, HL
boss_apply_behavior_form:
    ld hl, (boss_form_table_ptr)
    ld a, h
    cp #FF
    ret z
    ld a, (hl)
    ld b, a
    ld a, (boss_behavior_aux0)
    cp b
    ret nc
    inc hl
    ld b, a
.babf_offset_loop:
    ld a, b
    or a
    jp z, .babf_offset_done
    inc hl
    inc hl
    inc hl
    inc hl
    dec b
    jp .babf_offset_loop
.babf_offset_done:
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld (boss_tile_matrix_ptr), de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld (boss_weak_matrix_ptr), de
    ld a, 1
    ld (boss_visual_dirty), a
    ld (boss_behavior_step_interval), a
    ld (boss_behavior_step_timer), a
    ret

; Register Contract:
; input: freshly loaded move/slam behavior action fields
; output: target resolved once, movement step interval/timer prepared from duration and distance
; clobbers: AF, B, C, D
boss_prepare_behavior_move_timing:
    call boss_resolve_behavior_target
    ld a, (boss_x_char)
    ld b, a
    ld a, (boss_behavior_target_x)
    cp b
    jp nc, .bpbmt_x_positive
    ld a, b
    ld c, a
    ld a, (boss_behavior_target_x)
    ld b, a
    ld a, c
    sub b
    jp .bpbmt_x_ready
.bpbmt_x_positive:
    sub b
.bpbmt_x_ready:
    ld d, a
    ld a, (boss_y_char)
    ld b, a
    ld a, (boss_behavior_target_y)
    cp b
    jp nc, .bpbmt_y_positive
    ld a, b
    ld c, a
    ld a, (boss_behavior_target_y)
    ld b, a
    ld a, c
    sub b
    jp .bpbmt_y_ready
.bpbmt_y_positive:
    sub b
.bpbmt_y_ready:
    cp d
    jp c, .bpbmt_distance_ready
    ld d, a
.bpbmt_distance_ready:
    ld a, d
    or a
    jp nz, .bpbmt_has_distance
    ld a, 1
    ld (boss_behavior_step_interval), a
    ld (boss_behavior_step_timer), a
    ret
.bpbmt_has_distance:
    ld b, a
    ld a, (boss_behavior_duration)
    ld c, 0
.bpbmt_div_loop:
    cp b
    jp c, .bpbmt_div_done
    sub b
    inc c
    jp .bpbmt_div_loop
.bpbmt_div_done:
    ld a, c
    or a
    jp nz, .bpbmt_store_interval
    ld a, 1
.bpbmt_store_interval:
    ld (boss_behavior_step_interval), a
    ld (boss_behavior_step_timer), a
    ret

; Register Contract:
; input: boss_behavior_step_timer/interval
; output: Z flag set when movement should not step; NZ when one tile step should be applied
; clobbers: AF
boss_tick_behavior_move_step:
    ld a, (boss_behavior_step_timer)
    or a
    jp z, .btbms_step
    dec a
    ld (boss_behavior_step_timer), a
    jp nz, .btbms_no_step
.btbms_step:
    ld a, (boss_behavior_step_interval)
    or a
    jp nz, .btbms_has_interval
    ld a, 1
.btbms_has_interval:
    ld (boss_behavior_step_timer), a
    ld a, 1
    or a
    ret
.btbms_no_step:
    xor a
    ret

; Register Contract:
; input: current behavior target fields
; output: boss_behavior_target_x/y resolved for fixed/player/relative targets
; clobbers: AF, B
boss_resolve_behavior_target:
    ld a, (boss_behavior_target_type)
    cp BOSS_BEHAVIOR_TARGET_PLAYER_CURRENT
    jp z, .brbt_player
    cp BOSS_BEHAVIOR_TARGET_PLAYER_PREDICTED
    jp z, .brbt_player
    cp BOSS_BEHAVIOR_TARGET_PLAYER_LAST_KNOWN
    jp z, .brbt_player
    cp BOSS_BEHAVIOR_TARGET_BOSS_RELATIVE
    jp z, .brbt_relative
    ret

.brbt_player:
    ld a, (player_x)
    srl a
    srl a
    srl a
    ld (boss_behavior_target_x), a
    ld a, (player_y)
    srl a
    srl a
    srl a
    ld (boss_behavior_target_y), a
    ret

.brbt_relative:
    ld a, (boss_x_char)
    ld b, a
    ld a, (boss_behavior_target_x)
    add a, b
    ld (boss_behavior_target_x), a
    ld a, (boss_y_char)
    ld b, a
    ld a, (boss_behavior_target_y)
    add a, b
    ld (boss_behavior_target_y), a
    ret

; Register Contract:
; input: boss_x_char/y_char and resolved boss_behavior_target_x/y
; output: boss_x_char/y_char step one char toward target
; clobbers: AF, B
boss_step_towards_behavior_target:
    ld a, (boss_x_char)
    ld b, a
    ld a, (boss_behavior_target_x)
    cp b
    jp z, .bstbt_y
    jp c, .bstbt_dec_x
    ld a, b
    inc a
    ld (boss_x_char), a
    jp .bstbt_y
.bstbt_dec_x:
    ld a, b
    or a
    jp z, .bstbt_y
    dec a
    ld (boss_x_char), a

.bstbt_y:
    ld a, (boss_y_char)
    ld b, a
    ld a, (boss_behavior_target_y)
    cp b
    ret z
    jp c, .bstbt_dec_y
    ld a, b
    inc a
    ld (boss_y_char), a
    ret
.bstbt_dec_y:
    ld a, b
    or a
    ret z
    dec a
    ld (boss_y_char), a
    ret

; Register Contract:
; input: boss_behavior_aux0 = attack index, boss_attack_table_ptr, boss_x/y_char
; output: configured attack renderer invoked at current boss position
; clobbers: AF, BC, DE, HL

boss_draw_behavior_attack:
    ret


boss_attack_get_sprite_pattern:
    ret

draw_boss_attack:
    ret




boss_slam_rocks_hide_all:
    ret


boss_falling_blocks_hide_all:
    ret

















; --- End of Far Bank 7 — pad to 8KB boundary ---
    ds #8000 - $, #FF
    org FAR_BANK_7_ROM_START + #2000

; ##################################################################
; FAR BANK 8 — [#6000h-#8000h] FAR CODE: worlds
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank8 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-3). No far-to-far calls allowed.
; ##################################################################
FAR_BANK_8_ROM_START:
    org #6000

; ==================================================================
; WORLD MAPS
; File: worlds.asm
; Description: World map structures and screen loading functions
; Generated by Mideas MSX Generator
; ==================================================================

; ==================================================================
; WORLD MAP CONSTANTS
; ==================================================================

; World: New Worldmap (worldmap_1770754170935)
WORLD_NEW_WORLDMAP_ID EQU 0
WORLD_NEW_WORLDMAP_SCREEN_COUNT EQU 4
WORLD_NEW_WORLDMAP_SCREEN_NEW_SCREENMAP_ID EQU 0
WORLD_NEW_WORLDMAP_SCREEN_PAN2_ID EQU 1
WORLD_NEW_WORLDMAP_SCREEN_PAN3_ID EQU 2
WORLD_NEW_WORLDMAP_SCREEN_PAN4_ID EQU 3

; ==================================================================
; WORLD MUSIC POLICY
; preserve (#FE): do not touch current music when Game Flow can reach the
; world with multiple different music states.
; stop     (#FF): stop music on world enter.
; play     (0-254): ensure this track index is active on world enter.
; ==================================================================

world_music_policy_track_table:
    db #FF    ; WORLD_NEW_WORLDMAP_ID -> stop

world_music_policy_loop_table:
    db 0    ; WORLD_NEW_WORLDMAP_ID loop

; ------------------------------------------------------------------
; ensure_music_for_world_id
; Input:  A = WORLD_*_ID
; Output: Starts/stops music only when the world policy is unambiguous.
;         #FE preserve entries leave current music untouched.
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
ensure_music_for_world_id:
    ld e, a
    ld d, 0
    ld hl, world_music_policy_track_table
    add hl, de
    ld a, (hl)
    cp #FE
    ret z
    cp #FF
    jr nz, ensure_music_for_world_id_play_or_keep
    ld a, (music_active)
    or a
    ret z
    jp call_music_stop_resident
ensure_music_for_world_id_play_or_keep:
    ld c, a
    ld hl, world_music_policy_loop_table
    add hl, de
    ld b, (hl)
    ld a, (music_active)
    or a
    jr z, ensure_music_for_world_id_play_track
    ld a, (music_track_index)
    cp c
    jr nz, ensure_music_for_world_id_play_track
    ld a, (music_loop)
    and 1
    cp b
    ret z
ensure_music_for_world_id_play_track:
    ld a, c
    jp call_music_play_track_resident

; ==================================================================
; WORLD LOADING FUNCTIONS
; ==================================================================

; ------------------------------------------------------------------
; Load World: New Worldmap
; World ID: worldmap_1770754170935
; Screens: 4
; Start Screen Node: wmnode_1770754173003
; ------------------------------------------------------------------
load_world_worldmap_1770754170935:
    ; Ensure default music policy for this world when unambiguous
    ld a, WORLD_NEW_WORLDMAP_ID
    call ensure_music_for_world_id
    ; Load runtime sprite patterns for this world
    ld a, WORLD_NEW_WORLDMAP_ID
    call call_ensure_sprite_patterns_for_world_id_resident
    ; Load start screen: New Screenmap (screenmap_1770754008863)
    call load_screen_pan1_770754008863_far

    ; Screen loaders mark the screen-engine path; WorldLink must run gameplay.
    xor a
    ld (current_screen_engine), a
    ; Draw imported HUD frame once at world start
    call hud_imported_frame_pan1_770754008863_draw_far

    ; Draw HUD frame once at world start
    call imprimir_marco_far

    ; Initialize world state
    ld a, WORLD_NEW_WORLDMAP_ID
    ld (current_world_id), a

    ld a, 0
    ld (current_screen_index), a
    ld a, 0
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1

    xor a
    ld (screen_transition_cooldown), a

    call call_rebuild_used_entity_list_resident  ; Precompute room entity buckets before gameplay resumes
    call apply_collected_tiles     ; Re-apply persistent collection state for this screen
    ret

; ==================================================================
; SCREEN TRANSITION FUNCTIONS
; ==================================================================

; ------------------------------------------------------------------
; World: New Worldmap
; Connections: 3
; ------------------------------------------------------------------

; Transition: pan2 -> New Screenmap
transition_worldmap_1770754170935_0:
    call load_screen_pan1_770754008863_far

    ; Screen loaders mark the screen-engine path; WorldLink must run gameplay.
    xor a
    ld (current_screen_engine), a
    ld a, 0
    ld (current_screen_index), a
    ld a, 0
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    call call_rebuild_used_entity_list_resident  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state
    ret

; Transition: pan3 -> pan2
transition_worldmap_1770754170935_1:
    call load_screen_pan2_771184738851_far

    ; Screen loaders mark the screen-engine path; WorldLink must run gameplay.
    xor a
    ld (current_screen_engine), a
    ld a, 1
    ld (current_screen_index), a
    ld a, 1
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    call call_rebuild_used_entity_list_resident  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state
    ret

; Transition: pan4 -> pan3
transition_worldmap_1770754170935_2:
    call load_screen_pan3_771880109228_far

    ; Screen loaders mark the screen-engine path; WorldLink must run gameplay.
    xor a
    ld (current_screen_engine), a
    ld a, 2
    ld (current_screen_index), a
    ld a, 2
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    call call_rebuild_used_entity_list_resident  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state
    ret

; ------------------------------------------------------------------
; load_world_default: alias for the first world (required by megarom trampolines)
; ------------------------------------------------------------------
load_world_default:
    jp load_world_worldmap_1770754170935

; ==================================================================
; SCREEN EDGE TRANSITION RUNTIME
; ==================================================================
; Checks controllable entity exits and transitions world screen.
; Prevents X/Y byte wrap from keeping player in same screen.
; ==================================================================

check_world_screen_transition:
    ; Debounce to prevent immediate re-trigger after crossing
    ld a, (screen_transition_cooldown)
    or a
    jr z, .find_player_start
    dec a
    ld (screen_transition_cooldown), a
    ret

    ; Find first controllable entity from active list (already filtered by screen)
    ; This avoids scanning all 32 entity slots every frame.
.find_player_start:
    ld a, (active_entity_count)
    or a
    ret z
    ld b, a
    ld hl, active_entity_list
.find_player_loop:
    ; E = entity index from compact active list
    ld e, (hl)
    inc hl
    ld d, 0

    ; Check Input component mask
    push hl
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_INPUT
    pop hl
    jr nz, .player_found

.find_player_next:
    djnz .find_player_loop
    ret                        ; No controllable entity found

.player_found:
    ld d, 0                    ; DE = player entity index

.dispatch_world:
    ld a, (current_world_id)
    cp WORLD_NEW_WORLDMAP_ID
    jp z, check_transition_world_worldmap_1770754170935
    ret

check_transition_world_worldmap_1770754170935:
    ld a, (current_screen_index)
    cp 0
    jp z, check_transition_worldmap_1770754170935_screen_0
    cp 1
    jp z, check_transition_worldmap_1770754170935_screen_1
    cp 2
    jp z, check_transition_worldmap_1770754170935_screen_2
    cp 3
    jp z, check_transition_worldmap_1770754170935_screen_3
    ret

check_transition_worldmap_1770754170935_screen_0:
    ; East exit: X near right edge and rightward input
    ld a, (input_state)
    cp STICK_RIGHT
    jr z, .dir_ok_check_transition_worldmap_1770754170935_s0_skip_east
    cp STICK_UPRIGHT
    jr z, .dir_ok_check_transition_worldmap_1770754170935_s0_skip_east
    cp STICK_DOWNRIGHT
    jp nz, check_transition_worldmap_1770754170935_s0_skip_east
.dir_ok_check_transition_worldmap_1770754170935_s0_skip_east:
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    cp 240
    jp c, check_transition_worldmap_1770754170935_s0_skip_east
check_transition_worldmap_1770754170935_s0_apply_east:
    push de
    call load_screen_pan2_771184738851_far
    pop de
    ld a, 1
    ld (current_screen_index), a
    ld a, 1
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    ld hl, entity_screen_id
    add hl, de
    ld (hl), a
    ; Enter from west edge
    ld hl, entity_x_pos
    add hl, de
    ld (hl), 2
    ; Reset player velocity after transition
    xor a
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a

    ; Debounce immediate re-trigger
    ld a, 8
    ld (screen_transition_cooldown), a
    call call_rebuild_used_entity_list_resident  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state for new screen
    ret

check_transition_worldmap_1770754170935_s0_skip_east:
    ret

check_transition_worldmap_1770754170935_screen_1:
    ; East exit: X near right edge and rightward input
    ld a, (input_state)
    cp STICK_RIGHT
    jr z, .dir_ok_check_transition_worldmap_1770754170935_s1_skip_east
    cp STICK_UPRIGHT
    jr z, .dir_ok_check_transition_worldmap_1770754170935_s1_skip_east
    cp STICK_DOWNRIGHT
    jp nz, check_transition_worldmap_1770754170935_s1_skip_east
.dir_ok_check_transition_worldmap_1770754170935_s1_skip_east:
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    cp 240
    jp c, check_transition_worldmap_1770754170935_s1_skip_east
check_transition_worldmap_1770754170935_s1_apply_east:
    push de
    call load_screen_pan3_771880109228_far
    pop de
    ld a, 2
    ld (current_screen_index), a
    ld a, 2
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    ld hl, entity_screen_id
    add hl, de
    ld (hl), a
    ; Enter from west edge
    ld hl, entity_x_pos
    add hl, de
    ld (hl), 2
    ; Reset player velocity after transition
    xor a
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a

    ; Debounce immediate re-trigger
    ld a, 8
    ld (screen_transition_cooldown), a
    call call_rebuild_used_entity_list_resident  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state for new screen
    ret

check_transition_worldmap_1770754170935_s1_skip_east:
    ; West exit: X near left edge and leftward input
    ld a, (input_state)
    cp STICK_LEFT
    jr z, .dir_ok_check_transition_worldmap_1770754170935_s1_skip_west
    cp STICK_UPLEFT
    jr z, .dir_ok_check_transition_worldmap_1770754170935_s1_skip_west
    cp STICK_DOWNLEFT
    jp nz, check_transition_worldmap_1770754170935_s1_skip_west
.dir_ok_check_transition_worldmap_1770754170935_s1_skip_west:
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    cp 2
    jp nc, check_transition_worldmap_1770754170935_s1_skip_west
check_transition_worldmap_1770754170935_s1_apply_west:
    push de
    call load_screen_pan1_770754008863_far
    pop de
    ld a, 0
    ld (current_screen_index), a
    ld a, 0
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    ld hl, entity_screen_id
    add hl, de
    ld (hl), a
    ; Enter from east edge of target active area
    ld hl, entity_x_pos
    add hl, de
    ld (hl), 238
    ; Reset player velocity after transition
    xor a
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a

    ; Debounce immediate re-trigger
    ld a, 8
    ld (screen_transition_cooldown), a
    call call_rebuild_used_entity_list_resident  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state for new screen
    ret

check_transition_worldmap_1770754170935_s1_skip_west:
    ret

check_transition_worldmap_1770754170935_screen_2:
    ; West exit: X near left edge and leftward input
    ld a, (input_state)
    cp STICK_LEFT
    jr z, .dir_ok_check_transition_worldmap_1770754170935_s2_skip_west
    cp STICK_UPLEFT
    jr z, .dir_ok_check_transition_worldmap_1770754170935_s2_skip_west
    cp STICK_DOWNLEFT
    jp nz, check_transition_worldmap_1770754170935_s2_skip_west
.dir_ok_check_transition_worldmap_1770754170935_s2_skip_west:
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    cp 2
    jp nc, check_transition_worldmap_1770754170935_s2_skip_west
check_transition_worldmap_1770754170935_s2_apply_west:
    push de
    call load_screen_pan2_771184738851_far
    pop de
    ld a, 1
    ld (current_screen_index), a
    ld a, 1
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    ld hl, entity_screen_id
    add hl, de
    ld (hl), a
    ; Enter from east edge of target active area
    ld hl, entity_x_pos
    add hl, de
    ld (hl), 238
    ; Reset player velocity after transition
    xor a
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a

    ; Debounce immediate re-trigger
    ld a, 8
    ld (screen_transition_cooldown), a
    call call_rebuild_used_entity_list_resident  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state for new screen
    ret

check_transition_worldmap_1770754170935_s2_skip_west:
    ; South exit: Y near bottom edge
    ; No input-direction gate: supports gravity/platform-driven movement
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    cp 176
    jp c, check_transition_worldmap_1770754170935_s2_skip_south
check_transition_worldmap_1770754170935_s2_apply_south:
    push de
    call load_screen_pan4_772291683578_far
    pop de
    ld a, 3
    ld (current_screen_index), a
    ld a, 3
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    ld hl, entity_screen_id
    add hl, de
    ld (hl), a
    ; Enter from north edge
    ld hl, entity_y_pos
    add hl, de
    ld (hl), 26
    ; Reset player velocity after transition
    xor a
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a

    ; Debounce immediate re-trigger
    ld a, 8
    ld (screen_transition_cooldown), a
    call call_rebuild_used_entity_list_resident  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state for new screen
    ret

check_transition_worldmap_1770754170935_s2_skip_south:
    ret

check_transition_worldmap_1770754170935_screen_3:
    ; North exit: Y near top edge
    ; No input-direction gate: supports velocity-driven movement
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    cp 26
    jp nc, check_transition_worldmap_1770754170935_s3_skip_north
check_transition_worldmap_1770754170935_s3_apply_north:
    push de
    call load_screen_pan3_771880109228_far
    pop de
    ld a, 2
    ld (current_screen_index), a
    ld a, 2
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    ld hl, entity_screen_id
    add hl, de
    ld (hl), a
    ; Enter from south edge of target active area
    ld hl, entity_y_pos
    add hl, de
    ld (hl), 174
    ; Reset player velocity after transition
    xor a
    ld hl, entity_vel_x
    add hl, de
    ld (hl), a
    ld hl, entity_vel_y
    add hl, de
    ld (hl), a

    ; Debounce immediate re-trigger
    ld a, 8
    ld (screen_transition_cooldown), a
    call call_rebuild_used_entity_list_resident  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state for new screen
    ret

check_transition_worldmap_1770754170935_s3_skip_north:
    ret

; ==================================================================
; WORLD HELPER FUNCTIONS
; ==================================================================

; Get current world ID
; Output: A = current world ID
get_current_world_id:
    ld a, (current_world_id)
    ret

; Get current screen index
; Output: A = current screen index in world
get_current_screen_index:
    ld a, (current_screen_index)
    ret

; Set current screen
; Input: A = screen index
set_current_screen:
    ld (current_screen_index), a
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    call call_rebuild_used_entity_list_resident
    ret

; ==================================================================
; END OF WORLDS
; ==================================================================


; --- End of Far Bank 8 — pad to 8KB boundary ---
    ds #8000 - $, #FF
    org FAR_BANK_8_ROM_START + #2000

; ##################################################################
; FAR BANK 9 — [#6000h-#8000h] FAR CODE: sound
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank9 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-3). No far-to-far calls allowed.
; ##################################################################
FAR_BANK_9_ROM_START:
    org #6000

; ==================================================================
; PSG SOUND SYSTEM
; File: sound.asm
; Description: AY-3-8910 PSG control and sound effects
; Engine Audio Tick: GameFlow/game loop
; ==================================================================

; ==================================================================
; PSG REGISTER ADDRESSES
; ==================================================================

; Tone Generators (Channels A, B, C)
PSG_TONE_A_LO       EQU 0        ; Channel A period low byte
PSG_TONE_A_HI       EQU 1        ; Channel A period high byte (4 bits)
PSG_TONE_B_LO       EQU 2        ; Channel B period low byte
PSG_TONE_B_HI       EQU 3        ; Channel B period high byte (4 bits)
PSG_TONE_C_LO       EQU 4        ; Channel C period low byte
PSG_TONE_C_HI       EQU 5        ; Channel C period high byte (4 bits)

; Noise Generator
PSG_NOISE_PERIOD    EQU 6        ; Noise period (5 bits)

; Mixer Control
PSG_MIXER           EQU 7        ; Mixer/Enable register
; Bit 0: Channel A tone enable (0=on, 1=off)
; Bit 1: Channel B tone enable
; Bit 2: Channel C tone enable
; Bit 3: Channel A noise enable (0=on, 1=off)
; Bit 4: Channel B noise enable
; Bit 5: Channel C noise enable

; Volume Control
PSG_VOL_A           EQU 8        ; Channel A volume (4 bits) + envelope flag (bit 4)
PSG_VOL_B           EQU 9        ; Channel B volume
PSG_VOL_C           EQU 10       ; Channel C volume

; Envelope Generator
PSG_ENV_LO          EQU 11       ; Envelope period low byte
PSG_ENV_HI          EQU 12       ; Envelope period high byte
PSG_ENV_SHAPE       EQU 13       ; Envelope shape (4 bits)

; ==================================================================
; PSG TONE PERIODS (Musical notes, octave 4, 3.579545 MHz clock)
; ==================================================================

; Note frequencies for octave 4 (middle C = C4)
NOTE_C4         EQU 477      ; C  - 261.63 Hz
NOTE_CS4        EQU 450      ; C# - 277.18 Hz
NOTE_D4         EQU 425      ; D  - 293.66 Hz
NOTE_DS4        EQU 401      ; D# - 311.13 Hz
NOTE_E4         EQU 379      ; E  - 329.63 Hz
NOTE_F4         EQU 357      ; F  - 349.23 Hz
NOTE_FS4        EQU 337      ; F# - 369.99 Hz
NOTE_G4         EQU 318      ; G  - 392.00 Hz
NOTE_GS4        EQU 300      ; G# - 415.30 Hz
NOTE_A4         EQU 284      ; A  - 440.00 Hz
NOTE_AS4        EQU 268      ; A# - 466.16 Hz
NOTE_B4         EQU 253      ; B  - 493.88 Hz
NOTE_C5         EQU 238      ; C5 - 523.25 Hz

; Octave multipliers: Divide period by 2 for +1 octave, multiply by 2 for -1 octave

; ==================================================================
; SOUND EFFECT DURATIONS (in frames, 60Hz)
; ==================================================================

SFX_SHORT           EQU 5        ; ~83ms
SFX_MEDIUM          EQU 15       ; ~250ms
SFX_LONG            EQU 30       ; ~500ms

; ==================================================================
; SOUND SYSTEM INITIALIZATION
; ==================================================================

init_sound_system:
    ; Initialize PSG via BIOS
    call GICINI

    ; Clear runtime sound state so power-on RAM garbage cannot make
    ; sfx_update / SM_UpdateSound drive the PSG for a few random frames.
    xor a
    ld (sfx_active), a
    ld (sfx_timer), a
    ld (sfx_fadeout), a
    ld (sm_sound_active), a
    ld (sm_sound_frames_left), a
    ld (sm_sound_ptr_l), a
    ld (sm_sound_ptr_h), a
    call music_init_system

    ; Silence all channels
    call sfx_silence_all

    ret

; ------------------------------------------------------------------
; task_audio_tick
; Shared audio tick wrapper for IRQ task_manager or HALT game loops.
; Preserves caller-visible registers on every exit path.
; ------------------------------------------------------------------
task_audio_tick:
    push af
    push bc
    push de
    push hl

    call call_music_update_resident
    call SM_UpdateSound


    pop hl
    pop de
    pop bc
    pop af
    ret

; ==================================================================
; PSG LOW-LEVEL CONTROL FUNCTIONS
; ==================================================================

; ------------------------------------------------------------------
; psg_write
; Write to PSG register via BIOS
; Input:  A = Register number (0-13)
;         E = Value to write
; Destroys: AF, E
; ------------------------------------------------------------------
psg_write:
    call WRTPSG
    ret

; ------------------------------------------------------------------
; psg_set_tone
; Set tone period for a channel
; Input:  A = Channel (0=A, 1=B, 2=C)
;         HL = Tone period (clamped to PSG 12-bit range 1..#0FFF)
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
psg_set_tone:
    ld b, a                      ; Preserve channel while clamping period
    ld a, h
    and #F0
    jr z, .tone_period_in_range
    ld hl, #0FFF                 ; AY tone period is 12-bit; saturate overflow
.tone_period_in_range:
    ld a, h
    or l
    jr nz, .tone_period_nonzero
    inc l                        ; Avoid period 0, which is unstable on PSG
.tone_period_nonzero:
    ld a, b
    ; Calculate register numbers (A*2 for low, A*2+1 for high)
    add a, a                     ; A = channel * 2
    ld c, a                      ; C = low register number
    inc a
    ld b, a                      ; B = high register number

    ; Write low byte
    ld a, c
    ld e, l
    call WRTPSG

    ; Write high byte (only lower 4 bits)
    ld a, b
    ld e, h
    ld a, e
    and #0F
    ld e, a
    ld a, b
    call WRTPSG

    ret

; ------------------------------------------------------------------
; psg_set_volume
; Set volume for a channel
; Input:  A = Channel (0=A, 1=B, 2=C)
;         B = Volume (0-15) or #10 to enable PSG hardware envelope
; Destroys: AF, E
; ------------------------------------------------------------------
psg_set_volume:
    add a, PSG_VOL_A             ; A = PSG_VOL_x register
    ld e, b                      ; E = volume value
    call WRTPSG
    ret

; ------------------------------------------------------------------
; psg_set_noise
; Set noise generator period
; Input:  A = Noise period (0-31)
; Destroys: AF, E
; ------------------------------------------------------------------
psg_set_noise:
    ld e, a
    ld a, PSG_NOISE_PERIOD
    call WRTPSG
    ret

; ------------------------------------------------------------------
; psg_set_mixer
; Set mixer control (enable/disable tone and noise)
; Input:  A = Mixer value
;         Bits 0-2: Tone off (0=on, 1=off) for channels A,B,C
;         Bits 3-5: Noise off (0=on, 1=off) for channels A,B,C
; Destroys: AF, E
; ------------------------------------------------------------------
psg_set_mixer:
    ld e, a
    ld a, PSG_MIXER
    call WRTPSG
    ret

; ------------------------------------------------------------------
; psg_set_envelope
; Program the global PSG hardware envelope generator
; Input:  HL = Envelope period
;         B = Envelope shape (0-15)
; Destroys: AF, E
; ------------------------------------------------------------------
psg_set_envelope:
    ld a, PSG_ENV_LO
    ld e, l
    call WRTPSG
    ld a, PSG_ENV_HI
    ld e, h
    call WRTPSG
    ld a, b
    and #0F
    ld e, a
    ld a, PSG_ENV_SHAPE
    call WRTPSG
    ret

; ==================================================================
; HIGH-LEVEL SOUND EFFECTS
; ==================================================================

; ------------------------------------------------------------------
; sfx_silence_all
; Silence all PSG channels
; ------------------------------------------------------------------
sfx_silence_all:
    ; Set all volumes to 0
    xor a                        ; A = channel A
    ld b, 0                      ; B = volume 0
    call psg_set_volume

    ld a, 1                      ; A = channel B
    ld b, 0
    call psg_set_volume

    ld a, 2                      ; A = channel C
    ld b, 0
    call psg_set_volume

    ; Disable all tone and noise
    ld a, #3F                    ; All tone and noise off
    call psg_set_mixer

    ret

; ------------------------------------------------------------------
; sfx_beep
; Simple beep sound
; ------------------------------------------------------------------
sfx_beep:
    ; Channel A: 440Hz (A4)
    xor a                        ; A = channel A
    ld hl, NOTE_A4
    call psg_set_tone

    ; Volume 12
    xor a
    ld b, 12
    call psg_set_volume

    ; Enable tone A only
    ld a, #3E                    ; Tone A on, others off
    call psg_set_mixer

    ret

; ------------------------------------------------------------------
; sfx_jump
; Jump sound effect (rising pitch)
; ------------------------------------------------------------------
sfx_jump:
    ; Channel A: Start at C4, quick rise
    xor a
    ld hl, NOTE_C4
    call psg_set_tone

    ; Volume 10
    xor a
    ld b, 10
    call psg_set_volume

    ; Enable tone A
    ld a, #3E
    call psg_set_mixer

    ; TODO: Add pitch sweep for realistic jump sound
    ret

; ------------------------------------------------------------------
; sfx_shoot
; Shooting sound (noise + low tone)
; ------------------------------------------------------------------
sfx_shoot:
    ; Channel A: Low tone
    xor a
    ld hl, 100                   ; Low period = high pitch
    call psg_set_tone

    ; Volume 8
    xor a
    ld b, 8
    call psg_set_volume

    ; Noise generator at period 5
    ld a, 5
    call psg_set_noise

    ; Enable tone A + noise A
    ld a, #36                    ; Tone A + Noise A on
    call psg_set_mixer

    ret

; ------------------------------------------------------------------
; sfx_explosion
; Explosion sound (noise-heavy)
; ------------------------------------------------------------------
sfx_explosion:
    ; Noise generator at period 10
    ld a, 10
    call psg_set_noise

    ; Channel A: Volume 15 (max) with noise
    xor a
    ld b, 15
    call psg_set_volume

    ; Enable noise A only (no tone)
    ld a, #39                    ; Noise A on, tone off
    call psg_set_mixer

    ret

; ------------------------------------------------------------------
; sfx_coin
; Coin/pickup sound (quick ascending notes)
; ------------------------------------------------------------------
sfx_coin:
    ; Channel B: E4 note
    ld a, 1                      ; Channel B
    ld hl, NOTE_E4
    call psg_set_tone

    ; Volume 10
    ld a, 1
    ld b, 10
    call psg_set_volume

    ; Enable tone B
    ld a, #3D                    ; Tone B on, others off
    call psg_set_mixer

    ; TODO: Quick ascend to G4 for classic coin sound
    ret

; ------------------------------------------------------------------
; sfx_damage
; Damage/hit sound (harsh noise)
; ------------------------------------------------------------------
sfx_damage:
    ; Short noise burst
    ld a, 3                      ; Harsh noise period
    call psg_set_noise

    ; Channel C: Volume 12
    ld a, 2                      ; Channel C
    ld b, 12
    call psg_set_volume

    ; Enable noise C only
    ld a, #1F                    ; Noise C on
    call psg_set_mixer

    ret

; ==================================================================
; SOUND EFFECT PLAYBACK SYSTEM
; ==================================================================
; This section provides a simple sound effect manager that can
; play effects with automatic duration and fadeout

; Runtime state lives in variables.asm:
;   sfx_active, sfx_timer, sfx_fadeout

; ------------------------------------------------------------------
; play_sound_effect
; Play one of the built-in sound effects by ID
; Input:  A = sound ID
;         0=beep, 1=jump, 2=shoot, 3=explosion, 4=coin, 5=damage
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
play_sound_effect:
    ld b, a
    ld a, (music_active)
    or a
    ret nz
    ld a, b
    cp 1
    jp z, play_sound_effect_jump
    cp 2
    jp z, play_sound_effect_shoot
    cp 3
    jp z, play_sound_effect_explosion
    cp 4
    jp z, play_sound_effect_coin
    cp 5
    jp z, play_sound_effect_damage

play_sound_effect_beep:
    ld hl, sfx_beep
    ld b, SFX_SHORT
    call sfx_play
    ret

play_sound_effect_jump:
    ld hl, sfx_jump
    ld b, SFX_SHORT
    call sfx_play
    ret

play_sound_effect_shoot:
    ld hl, sfx_shoot
    ld b, SFX_SHORT
    call sfx_play
    ret

play_sound_effect_explosion:
    ld hl, sfx_explosion
    ld b, SFX_MEDIUM
    call sfx_play
    ret

play_sound_effect_coin:
    ld hl, sfx_coin
    ld b, SFX_SHORT
    call sfx_play
    ret

play_sound_effect_damage:
    ld hl, sfx_damage
    ld b, SFX_SHORT
    call sfx_play
    ret

; ------------------------------------------------------------------
; sfx_play
; Play a sound effect with duration
; Input:  HL = Sound effect function address
;         B = Duration in frames
; ------------------------------------------------------------------
sfx_play:
    ld a, (music_active)
    or a
    ret nz
    ; Call the sound effect function
    push bc
    push hl
    ld de, .return_address
    push de
    jp (hl)                      ; Indirect call
.return_address:
    pop hl
    pop bc

    ; Set timer
    ld a, b
    ld (sfx_timer), a

    ; Mark as active
    ld a, 1
    ld (sfx_active), a

    ret

; ------------------------------------------------------------------
; sfx_update
; Update sound effect system (call every frame)
; Handles automatic fadeout and silence
; ------------------------------------------------------------------
sfx_update:
    ld a, (music_active)
    or a
    ret nz
    ; Check if sound is active
    ld a, (sfx_active)
    or a
    ret z                        ; No active sound

    ; Decrement timer
    ld a, (sfx_timer)
    or a
    jr z, .silence_now

    dec a
    ld (sfx_timer), a

    ; Check if entering fadeout zone (last 5 frames)
    cp 5
    ret nc                       ; Still in main sound

    ; TODO: Implement volume fadeout here
    ret

.silence_now:
    call sfx_silence_all
    xor a
    ld (sfx_active), a
    ret

; ==================================================================
; TRACKER MUSIC RUNTIME
; No exportable music tracks are referenced by this project.
; Public labels are kept as no-op stubs so GameFlow/audio wrappers
; remain link-compatible without carrying the tracker interpreter.
; ==================================================================

music_init_system:
    xor a
    ld (music_active), a
    ld (music_muted), a
    ld (music_loop), a
    ld (music_track_index), a
    ld (music_row_frames), a
    ld (music_row_countdown), a
    ld (music_order_pos), a
    ld (music_pattern_index), a
    ld (music_pattern_row), a
    ld (music_pattern_rows), a
    ld (music_track_ptr_l), a
    ld (music_track_ptr_h), a
    ld (music_pattern_ptr_l), a
    ld (music_pattern_ptr_h), a
    ld a, #3F
    ld (music_mixer_shadow), a
    ret

music_reset_channel_state:
    ret

music_silence_channels:
    xor a
    ld b, 0
    call psg_set_volume
    ld a, 1
    ld b, 0
    call psg_set_volume
    ld a, 2
    ld b, 0
    call psg_set_volume
    ld a, #3F
    call psg_set_mixer
    ret

music_stop:
    call music_init_system
    call music_silence_channels
    ret

music_mute:
music_resume:
music_update:
music_update_channel_effects:
music_play_track:
    ret

music_execute_command:
    ld a, (de)
    cp #FF
    ret z
    or a
    jp z, music_stop
    ret

music_track_count:
    DB #00

music_track_ptr_table:
    DW 0

; ==================================================================
; END OF PSG SOUND SYSTEM
; ==================================================================


; --- End of Far Bank 9 — pad to 8KB boundary ---
    ds #8000 - $, #FF
    org FAR_BANK_9_ROM_START + #2000

; ##################################################################
; FAR BANK 10 — [#6000h-#8000h] FAR CODE: animtiles
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank10 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-3). No far-to-far calls allowed.
; ##################################################################
FAR_BANK_10_ROM_START:
    org #6000

; ==================================================================
; ANIMATED TILES SYSTEM
; File: animtiles.asm
; Description: Background tile animation for water, lava, fire, etc.
; ==================================================================

; Auto-detected animated groups:
;   frame groups: 5
;   transform groups: 3

; ==================================================================
; ANIMATED TILES CONSTANTS
; ==================================================================

; Animation speeds (in frames)
ANIM_SPEED_SLOW         EQU 15      ; ~250ms (water)
ANIM_SPEED_MEDIUM       EQU 8       ; ~133ms (lava)
ANIM_SPEED_FAST         EQU 4       ; ~66ms (fire)

; Maximum animated tiles
MAX_ANIM_TILES          EQU 5
ANIM_TILE_ENTRY_SIZE    EQU 7       ; char, chars, frames, speed, bytesPerFrame, ptr(2)
ANIM_TRANS_ENTRY_SIZE   EQU 4       ; char, chars, opCode, flags
ANIM_TILE_DATA_BANK     EQU 0       ; Deprecated: anim data is local to animtiles code bank

; ==================================================================
; ANIMATED TILES INITIALIZATION
; ==================================================================

init_animated_tiles:
    ; Initialize animation variables
    xor a
    ld (anim_tile_timer), a
    ld (anim_tile_frame), a

    ; Set default global animation speed
    ld a, 8
    ld (anim_tile_speed), a

    ; Upload initial animation frame state immediately
    call call_update_animated_tiles_vram_resident

    ret

; ==================================================================
; ANIMATED TILES UPDATE FUNCTIONS
; ==================================================================

; ------------------------------------------------------------------
; update_animated_tiles
; Update animation frame and redraw animated tiles if needed
; Call this every frame from main loop
; ------------------------------------------------------------------
update_animated_tiles:
    ; Skip animation work on screens with no animated tile groups
    ld a, (current_screen_anim_group_count)
    or a
    ret z

    ; Increment timer
    ld a, (anim_tile_timer)
    inc a
    ld (anim_tile_timer), a

    ; Check if it's time to advance frame
    ld b, a
    ld a, (anim_tile_speed)
    or a
    jr nz, .anim_speed_ok
    ld a, 1
    ld (anim_tile_speed), a
.anim_speed_ok:
    cp b
    ret nc                          ; Not yet time to update (timer < speed)

    ; Reset timer
    xor a
    ld (anim_tile_timer), a

    ; Advance global animation counter
    ld a, (anim_tile_frame)
    inc a
    ld (anim_tile_frame), a

    ; Update all animated tiles in VRAM
    call call_update_animated_tiles_vram_resident

    ret

; ------------------------------------------------------------------
; update_animated_tiles_vram
; Update pattern data in VRAM for all animated tiles
; This updates the actual tile patterns based on current frame
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
update_animated_tiles_vram:
    ; Protect VDP port sequence from ISR VRAM writes.
    ; Always re-enables on exit (see FAST_LDIRVM note on LD A,I bug).
    di
    ld hl, anim_tile_table

.anim_vram_loop:
    ld a, (hl)                      ; A = target char code
    cp 255
    jp z, .anim_vram_done

    push af                         ; Save target char code
    inc hl
    ld a, (hl)                      ; A = chars per tile
    push af
    inc hl
    ld b, (hl)                      ; B = frame count
    inc hl
    inc hl                          ; Skip speed byte (reserved)
    ld c, (hl)                      ; C = bytes per frame
    inc hl
    ld e, (hl)                      ; DE = data pointer
    inc hl
    ld d, (hl)
    inc hl                          ; HL = next table entry
    push hl
    ex de, hl                       ; HL = data pointer

    ; frame = global_frame % frame_count
    ; Fast path for power-of-two frame counts: frame & (count-1)
    ld a, b
    dec a
    ld d, a
    and b
    jr nz, .anim_mod_slow
    ld a, (anim_tile_frame)
    and d
    jr .anim_mod_done
.anim_mod_slow:
    ld a, (anim_tile_frame)
.anim_mod_loop:
    cp b
    jr c, .anim_mod_done
    sub b
    jr .anim_mod_loop
.anim_mod_done:

    ; DE = frame offset (frame * bytes_per_frame)
    ld b, a
    ld d, 0
    ld e, 0
.anim_mul_loop:
    ld a, b
    or a
    jr z, .anim_mul_done
    ld a, e
    add a, c
    ld e, a
    ld a, d
    adc a, 0
    ld d, a
    dec b
    jr .anim_mul_loop
.anim_mul_done:
    add hl, de                      ; HL = frame data pointer

    pop de                          ; DE = next table entry pointer
    pop af
    ld b, a                         ; B = chars per tile
    pop af
    ld c, a                         ; C = target char code
    push de

.anim_char_loop:
    ld a, b
    or a
    jr z, .anim_char_done

    push bc
    push hl
    ld a, c
    call anim_upload_char_frame
    pop hl
    pop bc

    ld de, 16
    add hl, de                      ; Next char frame chunk
    inc c                           ; Next target char code
    dec b
    jr .anim_char_loop

.anim_char_done:
    pop de
    ex de, hl                       ; HL = next table entry
    jp .anim_vram_loop

.anim_vram_done:

    ei
    ret

; ------------------------------------------------------------------
; set_animation_speed
; Set global animation speed for all animated tiles
; Input:  A = Speed (frames between updates)
; ------------------------------------------------------------------
set_animation_speed:
    or a
    jr nz, .anim_speed_store
    ld a, 1
.anim_speed_store:
    ld (anim_tile_speed), a
    ret

; ------------------------------------------------------------------
; anim_copy_8_bytes
; Copy 8 bytes from CPU memory to VRAM
; Input: DE = source pointer, HL = VRAM destination
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
anim_copy_8_bytes:
    push de                         ; Save source pointer
    push hl                         ; Save VRAM destination
    pop de                          ; DE = VRAM destination for FAST_LDIRVM
    pop hl                          ; HL = source pointer for FAST_LDIRVM
    ld bc, 8
    call FAST_LDIRVM
    push hl
    pop de                          ; Preserve legacy postcondition: DE = source + 8
    ret

; ==================================================================
; anim_upload_char_frame
; Upload one animated char (pattern + color) to all 3 Screen 2 banks
; Input: A = target char code, HL = source frame chunk (16 bytes)
; Source layout: 8 pattern bytes + 8 color bytes
; Destroys: AF, BC, DE, HL
; ==================================================================
anim_upload_char_frame:
    push af
    push bc
    push de
    push hl

    ; BC = target char offset (charCode * 8)
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    ld b, h
    ld c, l

    pop hl
    ex de, hl                      ; DE = source pattern pointer

    ; Pattern bank 0
    push de
    ld hl, CHRTBL2
    add hl, bc
    push bc
    call anim_copy_8_bytes
    pop bc
    pop de

    ; Pattern bank 1
    push de
    ld hl, CHRTBL2 + #800
    add hl, bc
    push bc
    call anim_copy_8_bytes
    pop bc
    pop de

    ; Pattern bank 2
    ld hl, CHRTBL2 + #1000
    add hl, bc
    push bc
    call anim_copy_8_bytes
    pop bc

    ; DE now points to color bytes (source + 8)
    ; Color bank 0
    push de
    ld hl, CLRTBL2
    add hl, bc
    push bc
    call anim_copy_8_bytes
    pop bc
    pop de

    ; Color bank 1
    push de
    ld hl, CLRTBL2 + #800
    add hl, bc
    push bc
    call anim_copy_8_bytes
    pop bc
    pop de

    ; Color bank 2
    ld hl, CLRTBL2 + #1000
    add hl, bc
    push bc
    call anim_copy_8_bytes
    pop bc

    pop de
    pop bc
    pop af
    ret

; ==================================================================
; TRANSFORM MODE COMPATIBILITY STUBS
; ==================================================================
; Transform-mode tiles are precomputed into normal frame data by the
; generator. Runtime VRAM read/modify/write is intentionally disabled.

update_animated_transform_tiles_vram:
    ret

anim_transform_char_frame:
    ret

anim_transform_vram_block:
    ret

; ==================================================================
; ANIMATED TILE DEFINITIONS (AUTO-GENERATED)
; ==================================================================

; ------------------------------------------------------------------
; Animated tile mapping table
; Format:
;   db targetCharCode, charsPerTile, numFrames, speed, bytesPerFrame
;   dw frameDataPointer
; ------------------------------------------------------------------
anim_tile_table:
    db 134, 1, 2, 8, 16    ; gema -> tile tile_1772126067456
    dw anim_group_0_gema
    db 141, 1, 2, 8, 16    ; gem_extra_jump -> tile tile_1772380335352
    dw anim_group_1_gem_extra_jump
    db 133, 1, 8, 10, 16    ; corda -> tile tile_1772054023315
    dw anim_transform_0_corda
    db 144, 1, 8, 8, 16    ; elevador1 -> tile tile_1772736409923
    dw anim_transform_1_elevador1
    db 145, 1, 8, 8, 16    ; elevador2 -> tile tile_1772737039713
    dw anim_transform_2_elevador2
    db 255                          ; End marker

; ------------------------------------------------------------------
; Transform tile mapping table
; Format:
;   db targetCharCode, charsPerTile, opCode, flags
; flags:
;   bit0 = apply vertical transform on color rows
; ------------------------------------------------------------------
anim_transform_table:
    ; Transform groups are precomputed as frame data in anim_tile_table
    db 255                          ; End marker

; ==================================================================
; ANIMATION FRAME DATA
; ==================================================================
anim_group_0_gema:
    ; Group "gema" targetChar=134 chars=1
    ; Frame 0: gema
    db #80, #18, #3C, #7E, #7E, #34, #18, #01, #A1, #A1, #A1, #A1, #A1, #A1, #A1, #A1
    ; Frame 1: gema_f0
    db #01, #18, #3C, #7E, #7E, #34, #18, #80, #A1, #A1, #A1, #A1, #A1, #A1, #A1, #A1

anim_group_1_gem_extra_jump:
    ; Group "gem_extra_jump" targetChar=141 chars=1
    ; Frame 0: gem_extra_jump
    db #00, #00, #38, #38, #38, #00, #00, #00, #F1, #F1, #71, #E1, #E1, #F1, #F1, #F1
    ; Frame 1: gem_extra_jump_f0
    db #00, #10, #38, #7C, #38, #10, #00, #00, #F1, #F1, #F1, #71, #E1, #F1, #F1, #F1

anim_transform_0_corda:
    ; Group "corda" targetChar=133 chars=1
    ; Frame 0: transform_step_0
    db #18, #30, #30, #19, #18, #0C, #0C, #98, #81, #81, #81, #91, #91, #A1, #A1, #A1
    ; Frame 1: transform_step_1
    db #98, #18, #30, #30, #19, #18, #0C, #0C, #81, #81, #81, #91, #91, #A1, #A1, #A1
    ; Frame 2: transform_step_2
    db #0C, #98, #18, #30, #30, #19, #18, #0C, #81, #81, #81, #91, #91, #A1, #A1, #A1
    ; Frame 3: transform_step_3
    db #0C, #0C, #98, #18, #30, #30, #19, #18, #81, #81, #81, #91, #91, #A1, #A1, #A1
    ; Frame 4: transform_step_4
    db #18, #0C, #0C, #98, #18, #30, #30, #19, #81, #81, #81, #91, #91, #A1, #A1, #A1
    ; Frame 5: transform_step_5
    db #19, #18, #0C, #0C, #98, #18, #30, #30, #81, #81, #81, #91, #91, #A1, #A1, #A1
    ; Frame 6: transform_step_6
    db #30, #19, #18, #0C, #0C, #98, #18, #30, #81, #81, #81, #91, #91, #A1, #A1, #A1
    ; Frame 7: transform_step_7
    db #30, #30, #19, #18, #0C, #0C, #98, #18, #81, #81, #81, #91, #91, #A1, #A1, #A1

anim_transform_1_elevador1:
    ; Group "elevador1" targetChar=144 chars=1
    ; Frame 0: transform_step_0
    db #D0, #D0, #C0, #C0, #FF, #C0, #C0, #D0, #71, #E1, #E1, #E1, #71, #71, #71, #71
    ; Frame 1: transform_step_1
    db #D0, #C0, #C0, #FF, #C0, #C0, #D0, #D0, #E1, #E1, #E1, #71, #71, #71, #71, #71
    ; Frame 2: transform_step_2
    db #C0, #C0, #FF, #C0, #C0, #D0, #D0, #D0, #E1, #E1, #71, #71, #71, #71, #71, #E1
    ; Frame 3: transform_step_3
    db #C0, #FF, #C0, #C0, #D0, #D0, #D0, #C0, #E1, #71, #71, #71, #71, #71, #E1, #E1
    ; Frame 4: transform_step_4
    db #FF, #C0, #C0, #D0, #D0, #D0, #C0, #C0, #71, #71, #71, #71, #71, #E1, #E1, #E1
    ; Frame 5: transform_step_5
    db #C0, #C0, #D0, #D0, #D0, #C0, #C0, #FF, #71, #71, #71, #71, #E1, #E1, #E1, #71
    ; Frame 6: transform_step_6
    db #C0, #D0, #D0, #D0, #C0, #C0, #FF, #C0, #71, #71, #71, #E1, #E1, #E1, #71, #71
    ; Frame 7: transform_step_7
    db #D0, #D0, #D0, #C0, #C0, #FF, #C0, #C0, #71, #71, #E1, #E1, #E1, #71, #71, #71

anim_transform_2_elevador2:
    ; Group "elevador2" targetChar=145 chars=1
    ; Frame 0: transform_step_0
    db #0B, #0B, #03, #03, #FF, #03, #03, #03, #71, #E1, #E1, #E1, #71, #71, #71, #71
    ; Frame 1: transform_step_1
    db #0B, #03, #03, #FF, #03, #03, #03, #0B, #E1, #E1, #E1, #71, #71, #71, #71, #71
    ; Frame 2: transform_step_2
    db #03, #03, #FF, #03, #03, #03, #0B, #0B, #E1, #E1, #71, #71, #71, #71, #71, #E1
    ; Frame 3: transform_step_3
    db #03, #FF, #03, #03, #03, #0B, #0B, #03, #E1, #71, #71, #71, #71, #71, #E1, #E1
    ; Frame 4: transform_step_4
    db #FF, #03, #03, #03, #0B, #0B, #03, #03, #71, #71, #71, #71, #71, #E1, #E1, #E1
    ; Frame 5: transform_step_5
    db #03, #03, #03, #0B, #0B, #03, #03, #FF, #71, #71, #71, #71, #E1, #E1, #E1, #71
    ; Frame 6: transform_step_6
    db #03, #03, #0B, #0B, #03, #03, #FF, #03, #71, #71, #71, #E1, #E1, #E1, #71, #71
    ; Frame 7: transform_step_7
    db #03, #0B, #0B, #03, #03, #FF, #03, #03, #71, #71, #E1, #E1, #E1, #71, #71, #71


; ------------------------------------------------------------------
; register_animated_tile
; Runtime registration is not supported in this generator version.
; Input:  A = Tile ID to animate
;         B = Number of frames (2-4)
;         C = Animation speed
; Output: A = 0 if failed (table full), 1 if success
; Destroys: AF, DE, HL
; ------------------------------------------------------------------
register_animated_tile:
    xor a                           ; Not supported (static generated table)
    ret

; ------------------------------------------------------------------
; get_tile_animation_frame
; Get current animation frame for a tile
; Input:  A = target char code
; Output: A = Current frame index (mod numFrames), or 0 if not animated
; Destroys: BC, DE, HL
; ------------------------------------------------------------------
get_tile_animation_frame:
    ld c, a                         ; C = char code to search
    ld hl, anim_tile_table

.anim_search_loop:
    ld a, (hl)
    cp 255
    jr z, .anim_not_found
    cp c
    jr z, .anim_found_tile

    ld de, ANIM_TILE_ENTRY_SIZE
    add hl, de
    jr .anim_search_loop

.anim_found_tile:
    inc hl
    inc hl
    ld b, (hl)                      ; B = numFrames
    ld a, (anim_tile_frame)
.anim_found_mod:
    cp b
    jr c, .anim_found_done
    sub b
    jr .anim_found_mod
.anim_found_done:
    ret

.anim_not_found:
    xor a
    ret

; ==================================================================
; END OF ANIMATED TILES SYSTEM
; ==================================================================


; --- End of Far Bank 10 — pad to 8KB boundary ---
    ds #8000 - $, #FF
    org FAR_BANK_10_ROM_START + #2000

; ##################################################################
; FAR BANK 11 — [#6000h-#8000h] FAR CODE: hud
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank11 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-3). No far-to-far calls allowed.
; ##################################################################
FAR_BANK_11_ROM_START:
    org #6000

; ==================================================================
; HUD SYSTEM - Screen 2 Text Rendering
; ==================================================================
; Total HUD Elements: 3
; Screens with HUD: 1
;
; HUD Elements use TileBank fonts to render text in Screen 2 mode
; Each element can be positioned anywhere on screen (256x192 pixels)
; ==================================================================

; ------------------------------------------------------------------
; HUD DATA STRUCTURES
; ------------------------------------------------------------------

HUD_ELEMENT_COUNT   EQU 3

; HUD Element Data Table
; Format: [Type:1][X:1][Y:1][Width:1][Height:1][Flags:1][TextPtr:2][Visible:1]
hud_element_data:
    DB 1, 8, 8    ; Element 0: Score at (8,8)
    DB 13, 1, 0 ; W, H, Flags
    DW hud_text_0             ; Text pointer
    DB 1                ; Visible
    DB 3, 120, 8    ; Element 1: Lives at (120,8)
    DB 8, 1, 0 ; W, H, Flags
    DW hud_text_1             ; Text pointer
    DB 1                ; Visible
    DB 6, 192, 8    ; Element 2: SceneName at (192,8)
    DB 7, 1, 0 ; W, H, Flags
    DW hud_text_2             ; Text pointer
    DB 1                ; Visible

; HUD Text Strings
hud_text_0:
    DB "SCORE: 000000", 0
hud_text_1:
    DB "LIVES: 3", 0
hud_text_2:
    DB "STAGE 1", 0

; ------------------------------------------------------------------
; imprimir_marco
; Draw HUD frame borders (called once per screen load)
; ------------------------------------------------------------------
imprimir_marco:
    push af
    push bc
    push de
    push hl
    push ix

    ld b, HUD_ELEMENT_COUNT
    ld ix, hud_element_data

.marco_loop:
    push bc                     ; Save counter

    ; Check visible flag first (offset 8)
    ld a, (ix+8)                ; A = Visible
    or a
    jr z, .skip_marco           ; Skip if not visible

    ; Read element fields
    ld d, (ix+1)                ; D = X position (pixels)
    ld e, (ix+2)                ; E = Y position (pixels)
    ld b, (ix+3)                ; B = Width (tiles)
    ld c, (ix+4)                ; C = Height (tiles)
    ld a, (ix+5)                ; A = Flags

    ; Check if border flag is set (bit 0)
    bit 0, a
    jr z, .skip_marco           ; Skip if no border

    ; Convert X,Y pixels to Tile coordinates
    ; TileX = X/8, TileY = Y/8
    ld a, d
    srl a
    srl a
    srl a
    ld d, a                     ; D = Tile X

    ld a, e
    srl a
    srl a
    srl a
    ld e, a                     ; E = Tile Y

    ; Adjust for padding: Frame is 1 tile larger on all sides
    dec d                       ; Frame X = Content X - 1
    dec e                       ; Frame Y = Content Y - 1

    ; Frame Width = Content Width + 2
    inc b
    inc b                       ; Width += 2

    inc c
    inc c                       ; Height += 2

    call hud_draw_frame

.skip_marco:
    ; Move to next element
    ld bc, 9                    ; Size of each element entry
    add ix, bc                  ; IX points to next element

    pop bc                      ; Restore counter
    djnz .marco_loop

    pop ix
    pop hl
    pop de
    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; render_hud
; Main HUD rendering function
; Only redraws when hud_dirty_flag is set
; Input:
;   None
; Output:
;   None
; Clobbers:
;   None visible to caller
; Preserves:
;   AF, BC, DE, HL, IX
; Notes:
;   - Returns immediately if hud_dirty_flag = 0
;   - Re-applies dynamic numeric fields (Score/Lives/custom bindings) after redrawing static text
; ------------------------------------------------------------------
render_hud:
    ld a, (hud_dirty_flag)
    or a
    ret z                       ; Skip if HUD hasn't changed
    xor a
    ld (hud_dirty_flag), a      ; Clear flag after rendering
    push af
    push bc
    push de
    push hl
    push ix

    ld b, HUD_ELEMENT_COUNT
    ld ix, hud_element_data

.render_loop:
    push bc                     ; Save counter

    ; Check visible flag first (offset 8)
    ld a, (ix+8)                ; A = Visible
    or a
    jp z, .skip_element         ; Skip if not visible

    ; Read element fields
    ld d, (ix+1)                ; D = X position (pixels)
    ld e, (ix+2)                ; E = Y position (pixels)
    ld b, (ix+3)                ; B = Width (tiles)
    ld c, (ix+4)                ; C = Height (tiles)
    ld a, (ix+5)                ; A = Flags

    ; Save values we'll need later
    push bc                     ; Save Width, Height
    push de                     ; Save X, Y

    ; ---------------------------------------------------------
    ; 1. Draw Frame (if enabled)
    ; ---------------------------------------------------------
    bit 0, a                    ; Check Bit 0 (Border)
    jr z, .no_border

    ; Convert X,Y pixels to Tile coordinates
    ; TileX = X/8, TileY = Y/8
    ld a, d
    srl a
    srl a
    srl a
    ld d, a                     ; D = Tile X
    
    ld a, e
    srl a
    srl a
    srl a
    ld e, a                     ; E = Tile Y
    
    ; Adjust for padding: Frame is 1 tile larger on all sides
    dec d                       ; Frame X = Content X - 1
    dec e                       ; Frame Y = Content Y - 1
    
    ; Frame Width = Content Width + 2
    inc b
    inc b                       ; Width += 2
    
    inc c
    inc c                       ; Height += 2
    
    call hud_draw_frame
    
    ; Restore original X, Y, Width, Height for text rendering
    pop de                      ; DE = X, Y (pixels)
    pop bc                      ; BC = Width, Height (tiles)
    ; Re-push in same order as original (BC bottom, DE top)
    push bc                     ; Save Width, Height (bottom)
    push de                     ; Save X, Y (top)

.no_border:
    ; ---------------------------------------------------------
    ; 2. Draw Text
    ; ---------------------------------------------------------
    pop de                      ; DE = X, Y (pixels)
    pop bc                      ; BC = Width, Height (discard, not needed)

    ; Calculate VRAM address from X,Y pixel coordinates
    ; Screen 2 Name Table = #1800 + (Y/8)*32 + (X/8)
    
    ; Y/8 = row
    ld a, e                     ; A = Y
    srl a
    srl a
    srl a                       ; A = Y/8 (row)

    ; row * 32
    ld l, a
    ld h, 0
    add hl, hl                  ; * 2
    add hl, hl                  ; * 4
    add hl, hl                  ; * 8
    add hl, hl                  ; * 16
    add hl, hl                  ; * 32

    ; Add X/8
    ld a, d                     ; A = X
    srl a
    srl a
    srl a                       ; A = X/8 (column)
    ld e, a
    ld d, 0
    add hl, de

    ; Add Name Table base
    ld de, #1800
    add hl, de                  ; HL = VRAM address

    ; Get Text Pointer
    ld e, (ix+6)                ; TextPtr Low
    ld d, (ix+7)                ; TextPtr High
    ; DE = Text Pointer

    ; Render text string at HL (VRAM) from DE (string)
    call hud_print_string

.skip_element:
    ; Move to next element
    ld bc, 9                    ; Size of each element entry
    add ix, bc                  ; IX points to next element

    pop bc                      ; Restore counter
    djnz .render_loop

    ; Re-apply dynamic Score digits after redrawing static HUD text.
    ld a, (global_var_score)
    ld l, a
    ld a, (global_var_score+1)
    ld h, a
    call update_hud_score

    ; Re-apply dynamic Lives digit after redrawing static HUD text.
    ld a, (global_var_lives)
    call update_hud_lives


    pop ix
    pop hl
    pop de
    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; force_render_hud
; Force a HUD redraw on this frame, preserving caller-visible registers
; Input:
;   None
; Output:
;   None
; Clobbers:
;   None visible to caller
; Preserves:
;   AF, BC, DE, HL, IX
; Notes:
;   - Sets hud_dirty_flag = 1 and then calls render_hud
; ------------------------------------------------------------------
force_render_hud:
    push af
    ld a, 1
    ld (hud_dirty_flag), a
    call call_render_hud_resident
    pop af
    ret

; ------------------------------------------------------------------
; hud_print_string
; Print a null-terminated string to Screen 2 Name Table
; Input: HL = VRAM address, DE = String pointer (RAM)
; ------------------------------------------------------------------
hud_print_string:
    push af
    push bc
    push de
    push hl

.print_loop:
    ld a, (de)                  ; Get character from string
    or a                        ; Check for null terminator
    jr z, .print_done

    cp 32                       ; Check if >= 32 (printable ASCII)
    jr nc, .valid_char
    ld a, 32                    ; Replace control chars with space
.valid_char:
    push de
    call FAST_WRTVRM
    pop de
    inc de
    inc hl
    jr .print_loop

.print_done:
    pop hl
    pop de
    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; hud_ascii_to_tile
; Convert ASCII character to tile index for font rendering
; Input: A = ASCII character
; Output: A = Tile index (ASCII code for direct mapping)
; ------------------------------------------------------------------
hud_ascii_to_tile:
    cp 32
    ret nc
    ld a, 32
    ret

; ------------------------------------------------------------------
; hud_draw_frame
; Draw a rectangular frame using font characters
; Input: D = Tile X, E = Tile Y, B = Width (tiles), C = Height (tiles)
; Uses characters: 43 (+), 45 (-), 124 (|)
; ------------------------------------------------------------------
hud_draw_frame:
    push af
    push bc
    push de
    push hl
    ld l, e
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld e, d
    ld d, 0
    add hl, de
    ld de, #1800
    add hl, de
    push hl
    push bc
    ld a, 43
    call FAST_WRTVRM
    inc hl
    ld a, b
    sub 2
    jr z, .skip_top_edge
    jr c, .skip_top_edge
    ld b, a
.top_edge_loop:
    ld a, 45
    call FAST_WRTVRM
    inc hl
    djnz .top_edge_loop
.skip_top_edge:
    ld a, 43
    call FAST_WRTVRM
    pop bc
    pop hl
    ld de, 32
    add hl, de
    ld a, c
    sub 2
    jr z, .bottom_row
    jr c, .bottom_row
    ld c, a
.middle_row_loop:
    push hl
    push bc
    ld a, 124
    call FAST_WRTVRM
    ld a, b
    dec a
    ld e, a
    ld d, 0
    add hl, de
    ld a, 124
    call FAST_WRTVRM
    pop bc
    pop hl
    ld de, 32
    add hl, de
    dec c
    jr nz, .middle_row_loop
.bottom_row:
    ld a, 43
    call FAST_WRTVRM
    inc hl
    ld a, b
    sub 2
    jr z, .skip_bottom_edge
    jr c, .skip_bottom_edge
    ld b, a
.bottom_edge_loop:
    ld a, 45
    call FAST_WRTVRM
    inc hl
    djnz .bottom_edge_loop
.skip_bottom_edge:
    ld a, 43
    call FAST_WRTVRM
    pop hl
    pop de
    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; update_hud_score
; Update score HUD element with current score value
; Input: HL = Score value (16-bit binary, 0-65535)
; Output:
;   None
; Clobbers:
;   None visible to caller
; Preserves:
;   AF, BC, DE, HL
; ------------------------------------------------------------------
update_hud_score:
    push af
    push bc
    push de
    push hl

    ld de, #1828

    ; Leading digit 0: forced zero (Score max 65535)
    ld a, '0'
    push hl
    ld h, d
    ld l, e
    call FAST_WRTVRM
    pop hl
    inc de
    ; Runtime digit 0: / 10000
    ld bc, 10000
    call hud_div16
    add a, '0'
    push hl
    ld h, d
    ld l, e
    call FAST_WRTVRM
    pop hl
    inc de
    ; Runtime digit 1: / 1000
    ld bc, 1000
    call hud_div16
    add a, '0'
    push hl
    ld h, d
    ld l, e
    call FAST_WRTVRM
    pop hl
    inc de
    ; Runtime digit 2: / 100
    ld bc, 100
    call hud_div16
    add a, '0'
    push hl
    ld h, d
    ld l, e
    call FAST_WRTVRM
    pop hl
    inc de
    ; Runtime digit 3: / 10
    ld bc, 10
    call hud_div16
    add a, '0'
    push hl
    ld h, d
    ld l, e
    call FAST_WRTVRM
    pop hl
    inc de
    ; Final digit: ones (remainder)
    ld a, l
    add a, '0'
    push hl
    ld h, d
    ld l, e
    call FAST_WRTVRM
    pop hl
    pop hl
    pop de
    pop bc
    pop af
    ret

; Helper: HL = HL / BC, A = quotient, HL = remainder
hud_div16:
    xor a
.hud_div16_loop:
    or a
    sbc hl, bc
    jr c, .hud_div16_done
    inc a
    jr .hud_div16_loop
.hud_div16_done:
    add hl, bc
    ret

; ------------------------------------------------------------------
; update_hud_lives
; Update lives HUD element
; Input: A = Number of lives (0-9)
; Output:
;   None
; Clobbers:
;   None visible to caller
; Preserves:
;   AF, HL
; ------------------------------------------------------------------
update_hud_lives:
    push af
    push hl
    add a, '0'
    ld hl, #1836
    call FAST_WRTVRM
    pop hl
    pop af
    ret



; --- End of Far Bank 11 — pad to 8KB boundary ---
    ds #8000 - $, #FF
    org FAR_BANK_11_ROM_START + #2000

; ##################################################################
; FAR BANK 12 — [#6000h-#8000h] FAR CODE: font
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank12 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-3). No far-to-far calls allowed.
; ##################################################################
FAR_BANK_12_ROM_START:
    org #6000

; ==================================================================
; MSX FONT DATA FOR SCREEN 2 TEXT
; File: font.asm
; Description: Font pattern data generated from project assets
; ==================================================================

; FONT_DATA_ROM_DATA_GROUP: bank4
; (FONT_PATTERN_DATA and FONT_COLOR_DATA are in bank4 section, org #C000, for megarom builds)
FONT_PATTERN_DATA_BANK EQU ((FONT_PATTERN_DATA - #4000) / #2000)
FONT_COLOR_DATA_BANK   EQU ((FONT_COLOR_DATA - #4000) / #2000)

; ==================================================================
; FONT PATTERN DATA
; ==================================================================

FONT_PATTERN_DATA:
    ; Char 32 (' ')
    DB #00, #00, #00, #00, #00, #00, #00, #00
    ; Char 43 ('+')
    DB #00, #10, #10, #7C, #10, #10, #00, #00
    ; Char 44 (',')
    DB #00, #00, #00, #00, #08, #08, #08, #10
    ; Char 45 ('-')
    DB #00, #00, #00, #7E, #00, #00, #00, #00
    ; Char 46 ('.')
    DB #00, #00, #00, #00, #00, #18, #18, #00
    ; Char 48 ('0')
    DB #3E, #7F, #73, #73, #73, #7F, #3E, #00
    ; Char 49 ('1')
    DB #18, #38, #18, #18, #18, #18, #7E, #00
    ; Char 50 ('2')
    DB #3E, #7F, #03, #3E, #60, #7F, #3E, #00
    ; Char 51 ('3')
    DB #3E, #7F, #03, #3E, #03, #7F, #3E, #00
    ; Char 52 ('4')
    DB #06, #0E, #1E, #36, #7F, #06, #06, #00
    ; Char 53 ('5')
    DB #7F, #7F, #60, #7E, #03, #7F, #3E, #00
    ; Char 54 ('6')
    DB #3E, #7F, #60, #7E, #63, #7F, #3E, #00
    ; Char 55 ('7')
    DB #7F, #7F, #03, #06, #0C, #18, #18, #00
    ; Char 56 ('8')
    DB #3E, #7F, #63, #3E, #63, #7F, #3E, #00
    ; Char 57 ('9')
    DB #3E, #7F, #63, #3F, #03, #7F, #3E, #00
    ; Char 58 (':')
    DB #00, #36, #36, #00, #36, #36, #00, #00
    ; Char 62 ('>')
    DB #00, #30, #18, #0C, #18, #30, #00, #00
    ; Char 63 ('?')
    DB #3E, #7F, #63, #18, #18, #00, #18, #00
    ; Char 65 ('A')
    DB #3E, #7F, #63, #7F, #7F, #63, #63, #00
    ; Char 66 ('B')
    DB #7E, #7F, #63, #7E, #63, #7F, #7E, #00
    ; Char 67 ('C')
    DB #3C, #7E, #60, #60, #60, #7E, #3C, #00
    ; Char 68 ('D')
    DB #7C, #7E, #66, #66, #66, #7E, #7C, #00
    ; Char 69 ('E')
    DB #7F, #7F, #60, #7C, #60, #7F, #7F, #00
    ; Char 70 ('F')
    DB #7F, #7F, #60, #7C, #60, #60, #60, #00
    ; Char 71 ('G')
    DB #3E, #7F, #63, #60, #67, #7F, #3E, #00
    ; Char 72 ('H')
    DB #63, #63, #63, #7F, #63, #63, #63, #00
    ; Char 73 ('I')
    DB #3E, #3E, #1C, #1C, #1C, #3E, #3E, #00
    ; Char 74 ('J')
    DB #1F, #1F, #06, #06, #66, #7E, #3C, #00
    ; Char 75 ('K')
    DB #63, #66, #6C, #78, #6C, #66, #63, #00
    ; Char 76 ('L')
    DB #60, #60, #60, #60, #60, #7F, #7F, #00
    ; Char 77 ('M')
    DB #63, #77, #7F, #6B, #63, #63, #63, #00
    ; Char 78 ('N')
    DB #63, #73, #7B, #6F, #67, #63, #63, #00
    ; Char 79 ('O')
    DB #3E, #7F, #63, #63, #63, #7F, #3E, #00
    ; Char 80 ('P')
    DB #7E, #7F, #63, #7E, #60, #60, #60, #00
    ; Char 81 ('Q')
    DB #3E, #7F, #63, #6B, #67, #7F, #3E, #00
    ; Char 82 ('R')
    DB #7E, #7F, #63, #7E, #7B, #6F, #63, #00
    ; Char 83 ('S')
    DB #3E, #7F, #60, #3E, #0F, #7F, #3E, #00
    ; Char 84 ('T')
    DB #7F, #7F, #18, #18, #18, #18, #18, #00
    ; Char 85 ('U')
    DB #63, #63, #63, #63, #63, #7F, #3E, #00
    ; Char 86 ('V')
    DB #63, #63, #63, #63, #36, #1C, #08, #00
    ; Char 87 ('W')
    DB #63, #63, #63, #6B, #7F, #77, #63, #00
    ; Char 88 ('X')
    DB #63, #63, #36, #1C, #36, #63, #63, #00
    ; Char 89 ('Y')
    DB #63, #63, #36, #1C, #18, #18, #18, #00
    ; Char 90 ('Z')
    DB #7F, #7F, #06, #0C, #30, #7F, #7F, #00
    ; Char 124 ('|')
    DB #18, #18, #18, #18, #18, #18, #18, #18


; Character index table (for quick lookup)
FONT_CHAR_INDEX:
    DB 32, 43, 44, 45, 46, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 62, 63, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 124
FONT_CHAR_COUNT EQU 45


; ==================================================================
; FONT LOADING FUNCTIONS
; ==================================================================

load_custom_font:
    ; Load custom font patterns to VRAM Pattern Generator Table
    ; Uses FONT_CHAR_INDEX to map specific characters to their correct VRAM addresses
    ld de, CHRTBL2                ; Bank 0 Base
    call load_font_patterns_to_bank
    ret

load_font_bank0:
    ld de, CHRTBL2                ; Bank 0 Base
    call load_font_patterns_to_bank
    ret

load_font_bank1:
    ld de, CHRTBL2 + #800         ; Bank 1 Base
    call load_font_patterns_to_bank
    ret

load_font_bank2:
    ld de, CHRTBL2 + #1000        ; Bank 2 Base
    call load_font_patterns_to_bank
    ret

load_all_font_banks:
    call load_font_bank0
    call load_font_bank1
    call load_font_bank2
    ret

; Helper: Load font patterns to a specific bank
; Input: DE = Bank Base Address
load_font_patterns_to_bank:
    ld ix, FONT_CHAR_INDEX        ; Pointer to ASCII codes
    ld iy, FONT_PATTERN_DATA      ; Pointer to pattern data
    ld b, FONT_CHAR_COUNT         ; Number of characters to load


.load_loop:
    push bc                       ; Save loop counter
    push de                       ; Save bank base address

    ; Get ASCII code
    ld a, (ix)                    ; A = ASCII code
    inc ix                        ; Next index

    ; Calculate VRAM offset: Base + (ASCII * 8)
    ld l, a
    ld h, 0
    add hl, hl                    ; * 2
    add hl, hl                    ; * 4
    add hl, hl                    ; * 8
    add hl, de                    ; Add Base Address
    ex de, hl                     ; DE = VRAM Destination

    ; Prepare source pointer (IY is in RAM, so use HL)
    push iy
    pop hl                        ; HL = Source Pattern (IY)

    ; Copy 8 bytes
    ld bc, 8
    call FAST_LDIRVM              ; Copy from HL(RAM) to DE(VRAM)

    ; Advance source pointer
    ld bc, 8
    add iy, bc                    ; IY += 8

    pop de                        ; Restore bank base
    pop bc                        ; Restore loop counter
    djnz .load_loop
    ret

; ==================================================================
; FONT COLOR ATTRIBUTES
; ==================================================================

FONT_COLOR_DATA:
    ; Char 32
    DB #F1, #F1, #F1, #F1, #F1, #F1, #F1, #F1
    ; Char 43
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 44
    DB #F1, #F1, #F1, #F1, #F1, #F1, #F1, #F1
    ; Char 45
    DB #F1, #F1, #F1, #F1, #F1, #F1, #F1, #F1
    ; Char 46
    DB #F1, #F1, #F1, #F1, #F1, #F1, #F1, #F1
    ; Char 48
    DB #81, #81, #81, #91, #91, #91, #F1, #F1
    ; Char 49
    DB #81, #81, #81, #91, #91, #91, #F1, #F1
    ; Char 50
    DB #81, #81, #81, #91, #91, #91, #F1, #F1
    ; Char 51
    DB #81, #81, #81, #91, #91, #91, #F1, #F1
    ; Char 52
    DB #81, #81, #81, #91, #91, #91, #F1, #F1
    ; Char 53
    DB #81, #81, #81, #91, #91, #91, #F1, #F1
    ; Char 54
    DB #81, #81, #81, #91, #91, #91, #F1, #F1
    ; Char 55
    DB #81, #81, #81, #91, #91, #91, #F1, #F1
    ; Char 56
    DB #81, #81, #81, #91, #91, #91, #F1, #F1
    ; Char 57
    DB #81, #81, #81, #91, #91, #91, #F1, #F1
    ; Char 58
    DB #F1, #F1, #F1, #F1, #F1, #F1, #F1, #F1
    ; Char 62
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 63
    DB #F1, #F1, #F1, #F1, #F1, #F1, #F1, #F1
    ; Char 65
    DB #A1, #A1, #A1, #A1, #F1, #F1, #F1, #F1
    ; Char 66
    DB #A1, #A1, #A1, #A1, #F1, #F1, #F1, #F1
    ; Char 67
    DB #A1, #A1, #A1, #A1, #F1, #F1, #F1, #F1
    ; Char 68
    DB #A1, #A1, #A1, #A1, #F1, #F1, #F1, #F1
    ; Char 69
    DB #A1, #A1, #A1, #A1, #F1, #F1, #F1, #F1
    ; Char 70
    DB #A1, #A1, #A1, #A1, #F1, #F1, #F1, #F1
    ; Char 71
    DB #A1, #A1, #A1, #A1, #F1, #F1, #F1, #F1
    ; Char 72
    DB #A1, #A1, #A1, #A1, #F1, #F1, #F1, #F1
    ; Char 73
    DB #A1, #A1, #A1, #A1, #F1, #F1, #F1, #F1
    ; Char 74
    DB #A1, #A1, #A1, #A1, #F1, #F1, #F1, #F1
    ; Char 75
    DB #A1, #A1, #A1, #A1, #F1, #F1, #F1, #F1
    ; Char 76
    DB #A1, #A1, #A1, #A1, #F1, #F1, #F1, #F1
    ; Char 77
    DB #A1, #A1, #A1, #A1, #F1, #F1, #F1, #F1
    ; Char 78
    DB #A1, #A1, #A1, #A1, #F1, #F1, #F1, #F1
    ; Char 79
    DB #A1, #A1, #A1, #A1, #F1, #F1, #F1, #F1
    ; Char 80
    DB #A1, #A1, #A1, #A1, #F1, #F1, #F1, #F1
    ; Char 81
    DB #A1, #A1, #A1, #A1, #F1, #F1, #F1, #F1
    ; Char 82
    DB #A1, #A1, #A1, #A1, #F1, #F1, #F1, #F1
    ; Char 83
    DB #A1, #A1, #A1, #A1, #F1, #F1, #F1, #F1
    ; Char 84
    DB #A1, #A1, #A1, #A1, #F1, #F1, #F1, #F1
    ; Char 85
    DB #A1, #A1, #A1, #A1, #F1, #F1, #F1, #F1
    ; Char 86
    DB #A1, #A1, #A1, #A1, #F1, #F1, #F1, #F1
    ; Char 87
    DB #A1, #A1, #A1, #A1, #F1, #F1, #F1, #F1
    ; Char 88
    DB #A1, #A1, #A1, #A1, #F1, #F1, #F1, #F1
    ; Char 89
    DB #A1, #A1, #A1, #A1, #F1, #F1, #F1, #F1
    ; Char 90
    DB #A1, #A1, #A1, #A1, #F1, #F1, #F1, #F1
    ; Char 124
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0


load_font_colors:
    ld de, CLRTBL2                ; Bank 0 Base
    call load_font_colors_to_bank
    ret

load_font_colors_all_banks:
    ld de, CLRTBL2                ; Bank 0 Base
    call load_font_colors_to_bank

    ld de, CLRTBL2 + #800         ; Bank 1 Base
    call load_font_colors_to_bank

    ld de, CLRTBL2 + #1000        ; Bank 2 Base
    call load_font_colors_to_bank
    ret

; Helper: Load font colors to a specific bank
; Input: DE = Bank Base Address
load_font_colors_to_bank:
    ld ix, FONT_CHAR_INDEX        ; Pointer to ASCII codes
    ld iy, FONT_COLOR_DATA        ; Pointer to color data
    ld b, FONT_CHAR_COUNT         ; Number of characters to load


.load_colors_loop:
    push bc                       ; Save loop counter
    push de                       ; Save bank base address

    ; Get ASCII code
    ld a, (ix)                    ; A = ASCII code
    inc ix                        ; Next index

    ; Calculate VRAM offset: Base + (ASCII * 8)
    ld l, a
    ld h, 0
    add hl, hl                    ; * 2
    add hl, hl                    ; * 4
    add hl, hl                    ; * 8
    add hl, de                    ; Add Base Address
    ex de, hl                     ; DE = VRAM Destination

    ; Prepare source pointer
    push iy
    pop hl                        ; HL = Source Color (IY)

    ; Copy 8 bytes
    ld bc, 8
    call FAST_LDIRVM              ; Copy from HL(RAM) to DE(VRAM)

    ; Advance source pointer
    ld bc, 8
    add iy, bc                    ; IY += 8

    pop de                        ; Restore bank base
    pop bc                        ; Restore loop counter
    djnz .load_colors_loop
    ret

; ==================================================================
; TEXT RENDERING FUNCTIONS (Based on Mideas renderMSX1TextToDataURL)
; ==================================================================

; Print string to Screen 2 name table (text mode compatible)
; HL = string pointer (null-terminated), DE = VRAM position
print_string_screen2:
    push bc
    ld b, 0                        ; Character counter

print_string_loop:
    ld a, (hl)                     ; Get character
    or a                           ; Check for null terminator
    jr z, print_string_end         ; End if null

    ; Write character to VRAM Name Table
    ; FAST_WRTVRM signature: A = data, HL = VRAM address
    ; A already has character, HL already has VRAM address
    push hl                        ; Save string pointer
    push de                        ; Save VRAM position
    ex de, hl                      ; Swap: DE = string ptr, HL = VRAM address for FAST_WRTVRM
    call FAST_WRTVRM               ; Write character to VRAM (fast)
    pop de                         ; Restore VRAM position
    pop hl                         ; Restore string pointer

    ; Move to next character
    inc hl                         ; Next character in string
    inc de                         ; Next position in VRAM
    inc b                          ; Count characters
    ld a, b
    cp 32                          ; Limit to screen width
    jr nz, print_string_loop       ; Continue if not at edge

print_string_end:
    pop bc
    ret

; Initialize font system for Screen 2 text rendering
init_font_system:
    ld a, (vram_cache_font_ready)
    or a
    ret nz
    ; Load custom font patterns and colors
    call load_all_font_banks       ; Load patterns to all banks
    call load_font_colors_all_banks ; Load colors to all banks
    ld a, 1
    ld (vram_cache_font_ready), a
    ret

reload_font_system:
    xor a
    ld (vram_cache_font_ready), a
    jp init_font_system

; ==================================================================
; END OF FONT DATA
; ==================================================================


; --- End of Far Bank 12 — pad to 8KB boundary ---
    ds #8000 - $, #FF
    org FAR_BANK_12_ROM_START + #2000

; ##################################################################
; FAR BANK 13 — [#6000h-#8000h] FAR CODE: scroll
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank13 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-3). No far-to-far calls allowed.
; ##################################################################
FAR_BANK_13_ROM_START:
    org #6000

; ==================================================================
; SCROLL SYSTEM
; File: scroll.asm
; Description: Viewport management and screen scrolling for large worlds
; ==================================================================

; ==================================================================
; SCROLL SYSTEM CONSTANTS
; ==================================================================

SCREEN_WIDTH_TILES      EQU 32      ; MSX Screen 2 width in tiles
SCREEN_HEIGHT_TILES     EQU 24      ; MSX Screen 2 height in tiles
SCREEN_WIDTH_PIXELS     EQU 256     ; MSX Screen 2 width in pixels
SCREEN_HEIGHT_PIXELS    EQU 192     ; MSX Screen 2 height in pixels

; Note: NAMETBL (#1800) is already defined in constants.asm

; ==================================================================
; SCROLL SYSTEM INITIALIZATION
; ==================================================================

init_scroll_system:
    ; Initialize camera to (0, 0)
    xor a
    ld (camera_x), a
    ld (camera_x + 1), a
    ld (camera_y), a
    ld (camera_y + 1), a
    ld (camera_tile_x), a
    ld (camera_tile_y), a

    ; Set world dimensions (will be updated by level loader)
    ld a, SCREEN_WIDTH_TILES
    ld (world_width_tiles), a
    ld a, SCREEN_HEIGHT_TILES
    ld (world_height_tiles), a

    ; Clear dirty flag
    xor a
    ld (scroll_dirty_flag), a

    ret

; ==================================================================
; CAMERA CONTROL FUNCTIONS
; ==================================================================

; ------------------------------------------------------------------
; set_camera_position
; Set camera position in pixels (with bounds checking)
; Input:  HL = X position (pixels), DE = Y position (pixels)
; Destroys: AF, BC
; ------------------------------------------------------------------
set_camera_position:
    ; Bounds check X
    push hl
    push de

    ; Calculate max X = (world_width_tiles - SCREEN_WIDTH_TILES) * TILE_WIDTH
    ld a, (world_width_tiles)
    sub SCREEN_WIDTH_TILES
    jr c, .scroll_x_in_bounds   ; World smaller than screen

    ; A = tiles to scroll, multiply by tile width
    ld b, a
    ld a, 16
    call multiply_a_by_b        ; HL = max X

    ; Compare camera X with max X
    pop de
    pop bc                      ; BC = requested X
    push bc
    push de

    ; If requested X > max X, clamp to max X
    ld a, b
    cp h
    jr c, .scroll_x_clamped
    jr nz, .scroll_x_in_bounds
    ld a, c
    cp l
    jr c, .scroll_x_clamped
    jr .scroll_x_in_bounds

.scroll_x_clamped:
    ld b, h
    ld c, l
    jr .scroll_x_done

.scroll_x_in_bounds:
    pop de
    pop bc
    push bc
    push de

.scroll_x_done:
    ; Store camera X
    ld a, c
    ld (camera_x), a
    ld a, b
    ld (camera_x + 1), a

    ; Calculate camera_tile_x = camera_x / TILE_WIDTH
    
    ; Tile width is 16, shift right 4 times
    ld a, c
    srl b
    rra
    srl b
    rra
    srl b
    rra
    srl b
    rra
    ld (camera_tile_x), a

    ; Bounds check Y
    pop de                      ; DE = requested Y
    pop bc

    ; Calculate max Y = (world_height_tiles - SCREEN_HEIGHT_TILES) * TILE_HEIGHT
    ld a, (world_height_tiles)
    sub SCREEN_HEIGHT_TILES
    jr c, .scroll_y_in_bounds   ; World smaller than screen

    ld b, a
    ld a, 16
    call multiply_a_by_b        ; HL = max Y

    ; If requested Y > max Y, clamp to max Y
    ld a, d
    cp h
    jr c, .scroll_y_clamped
    jr nz, .scroll_y_in_bounds
    ld a, e
    cp l
    jr c, .scroll_y_clamped
    jr .scroll_y_in_bounds

.scroll_y_clamped:
    ld d, h
    ld e, l

.scroll_y_in_bounds:
    ; Store camera Y
    ld a, e
    ld (camera_y), a
    ld a, d
    ld (camera_y + 1), a

    ; Calculate camera_tile_y = camera_y / TILE_HEIGHT
    
    ; Tile height is 16, shift right 4 times
    ld a, e
    srl d
    rra
    srl d
    rra
    srl d
    rra
    srl d
    rra
    ld (camera_tile_y), a

    ; Mark viewport as dirty (needs redraw)
    ld a, 1
    ld (scroll_dirty_flag), a

    ret

; ------------------------------------------------------------------
; move_camera
; Move camera by delta (relative movement)
; Input:  B = delta X (signed), C = delta Y (signed)
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
move_camera:
    ; Get current camera position
    ld a, (camera_x)
    ld l, a
    ld a, (camera_x + 1)
    ld h, a                     ; HL = camera X

    ld a, (camera_y)
    ld e, a
    ld a, (camera_y + 1)
    ld d, a                     ; DE = camera Y

    ; Add delta X (signed 8-bit)
    ld a, b
    or a
    jp p, .move_positive_x      ; Positive delta

    ; Negative delta
    cpl
    inc a                       ; A = abs(delta)
    ld b, a
    ld a, l
    sub b
    ld l, a
    ld a, h
    sbc a, 0
    ld h, a
    jr .move_x_done

.move_positive_x:
    ld a, l
    add a, b
    ld l, a
    ld a, h
    adc a, 0
    ld h, a

.move_x_done:
    ; Add delta Y (signed 8-bit)
    ld a, c
    or a
    jp p, .move_positive_y

    ; Negative delta
    cpl
    inc a
    ld c, a
    ld a, e
    sub c
    ld e, a
    ld a, d
    sbc a, 0
    ld d, a
    jr .move_y_done

.move_positive_y:
    ld a, e
    add a, c
    ld e, a
    ld a, d
    adc a, 0
    ld d, a

.move_y_done:
    ; Set new camera position (with bounds checking)
    call set_camera_position
    ret

; ------------------------------------------------------------------
; center_camera_on_entity
; Center viewport on an entity (e.g. player)
; Input:  A = Entity index
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
center_camera_on_entity:
    ; Get entity position
    ld c, a
    ld b, 0
    ld hl, entity_x_pos
    add hl, bc
    ld a, (hl)                  ; A = entity X

    ld hl, entity_y_pos
    add hl, bc
    ld e, (hl)                  ; E = entity Y

    ; Calculate camera position to center entity
    ; camera_x = entity_x - (SCREEN_WIDTH / 2)
    sub 128                     ; Center horizontally
    ld l, a
    ld h, 0                     ; HL = camera X

    ; camera_y = entity_y - (SCREEN_HEIGHT / 2)
    ld a, e
    sub 96                      ; Center vertically
    ld e, a
    ld d, 0                     ; DE = camera Y

    ; Set camera position
    call set_camera_position
    ret

; ==================================================================
; VIEWPORT RENDERING
; ==================================================================

; ------------------------------------------------------------------
; update_scroll
; Update viewport if dirty flag is set
; Redraws visible tiles based on camera position
; ------------------------------------------------------------------
update_scroll:
    ; Check if viewport changed
    ld a, (scroll_dirty_flag)
    or a
    ret z                       ; Not dirty, nothing to do

    ; TODO: Implement efficient partial screen redraw
    ; For now: redraw entire visible area (simple but slow)
    call redraw_viewport

    ; Clear dirty flag
    xor a
    ld (scroll_dirty_flag), a
    ret

; ------------------------------------------------------------------
; redraw_viewport
; Redraw all visible tiles based on camera position
; This is the simple (slow) version that redraws everything
; ------------------------------------------------------------------
redraw_viewport:
    ; TODO: Implement full viewport redraw
    ; For each visible tile (32x24):
    ;   1. Calculate world tile coords (camera_tile + screen offset)
    ;   2. Read tile ID from world map
    ;   3. Write tile ID to Name Table

    ; Placeholder: Just return for now
    ret

; ==================================================================
; UTILITY FUNCTIONS
; ==================================================================

; ------------------------------------------------------------------
; multiply_a_by_b
; Multiply A by B (unsigned 8-bit)
; Input:  A = multiplicand, B = multiplier
; Output: HL = result (16-bit)
; Destroys: AF, BC
; ------------------------------------------------------------------
multiply_a_by_b:
    ld hl, 0
    ld c, a
.scroll_mul_loop:
    ld a, b
    or a
    ret z
    add hl, bc
    dec b
    jr .scroll_mul_loop

; ==================================================================
; END OF SCROLL SYSTEM
; ==================================================================


; --- End of Far Bank 13 — pad to 8KB boundary ---
    ds #8000 - $, #FF
    org FAR_BANK_13_ROM_START + #2000

; ##################################################################
; FAR BANK 14 — [#6000h-#8000h] FAR CODE: patterns_code
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank14 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-3). No far-to-far calls allowed.
; ##################################################################
FAR_BANK_14_ROM_START:
    org #6000

; ==================================================================
; TILE PATTERN DATA
; File: patterns.asm
; Description: Tile pattern definitions for MSX Screen 2
; 12 tiles detected
; ==================================================================

PATTERN_DATA_BANK EQU ((tile_pattern_bank0 - #4000) / #2000)
SCREEN2_TILEBANK_INVALID EQU #FF
SCREEN2_TILEBANK_TILEBANK_1770753778086_ID EQU 0



; PATTERN_DATA_ROM_DATA_GROUP: bank4
; (tile_pattern_bank0 and tilebank data are emitted in bank4 section, org #C000+)

; ==================================================================
; PATTERN LOADING FUNCTIONS
; ==================================================================
load_pattern_bank0:
    ; Load pattern bank 0 to VRAM (base patterns)
    ; Fast direct port access (no BIOS overhead)
    ld a, RESOURCE_ID_TILE_PATTERN_BANK0
    ld de, CHRTBL2 + (128 * 8)    ; VRAM pattern table bank 0 (start at char 128)
    call resource_load_to_vram_by_id
    ret

load_pattern_bank1:
    ; Load pattern bank 1: same patterns as bank 0 (MSX Screen 2 standard)
    ; Fast direct port access (no BIOS overhead)
    ld a, RESOURCE_ID_TILE_PATTERN_BANK0
    ld de, CHRTBL2 + #800 + (128 * 8) ; VRAM pattern table bank 1 (+#800 offset + char 128)
    call resource_load_to_vram_by_id
    ret

load_pattern_bank2:
    ; Load pattern bank 2: same patterns as bank 0 (MSX Screen 2 standard)
    ; Fast direct port access (no BIOS overhead)
    ld a, RESOURCE_ID_TILE_PATTERN_BANK0
    ld de, CHRTBL2 + #1000 + (128 * 8) ; VRAM pattern table bank 2 (+#1000 offset + char 128)
    call resource_load_to_vram_by_id
    ret

load_patterns_to_vram:
    ; Load all pattern banks to VRAM (required for SCREEN 2)
    ; This loads the same patterns to all 3 banks (standard MSX Screen 2 setup)
    ld a, (vram_cache_tile_patterns_ready)
    or a
    ret nz
    call load_pattern_bank0
    call load_pattern_bank1
    call load_pattern_bank2
    ld a, 1
    ld (vram_cache_tile_patterns_ready), a
    ret

; ==================================================================
; SCREEN 2 TILEBANK PATTERN DATA (tilebank_1770753778086)
; ==================================================================

tilebank_tilebank_1770753778086_load_pattern_bank0:
    ld a, RESOURCE_ID_TILEBANK_PATTERN_DATA_0
    ld de, CHRTBL2 + (128 * 8)
    call resource_load_to_vram_by_id
    ret

tilebank_tilebank_1770753778086_load_pattern_bank1:
    ld a, RESOURCE_ID_TILEBANK_PATTERN_DATA_0
    ld de, CHRTBL2 + #800 + (128 * 8)
    call resource_load_to_vram_by_id
    ret

tilebank_tilebank_1770753778086_load_pattern_bank2:
    ld a, RESOURCE_ID_TILEBANK_PATTERN_DATA_0
    ld de, CHRTBL2 + #1000 + (128 * 8)
    call resource_load_to_vram_by_id
    ret

load_tilebank_tilebank_1770753778086_patterns_to_vram:
    call tilebank_tilebank_1770753778086_load_pattern_bank0
    call tilebank_tilebank_1770753778086_load_pattern_bank1
    call tilebank_tilebank_1770753778086_load_pattern_bank2
    ret

; [tilebank_pattern_data_* emitted in bank4 section]

; ==================================================================
; END OF PATTERN DATA
; ==================================================================


; --- End of Far Bank 14 — pad to 8KB boundary ---
    ds #8000 - $, #FF
    org FAR_BANK_14_ROM_START + #2000

; ##################################################################
; FAR BANK 15 — [#6000h-#8000h] FAR CODE: colors_code
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank15 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-3). No far-to-far calls allowed.
; ##################################################################
FAR_BANK_15_ROM_START:
    org #6000

; ==================================================================
; TILE COLOR DATA
; File: colors.asm
; Description: Tile color definitions for MSX Screen 2
; 12 tiles detected
; ==================================================================

COLOR_DATA_BANK EQU ((tile_color_bank0 - #4000) / #2000)

; COLOR_DATA_ROM_DATA_GROUP: bank4
; (tile_color_bank0 and tilebank data are emitted in bank4 section, org #C000+)

; ==================================================================
; COLOR LOADING FUNCTIONS
; ==================================================================
load_color_bank0:
    ; Load color bank 0 to VRAM (base colors)
    ; Fast direct port access (no BIOS overhead)
    ld a, RESOURCE_ID_TILE_COLOR_BANK0
    ld de, CLRTBL2 + (128 * 8)    ; VRAM color table bank 0 (start at char 128)
    call resource_load_to_vram_by_id
    ret

load_color_bank1:
    ; Load color bank 1: same colors as bank 0 (MSX Screen 2 standard)
    ; Fast direct port access (no BIOS overhead)
    ld a, RESOURCE_ID_TILE_COLOR_BANK0
    ld de, CLRTBL2 + #800 + (128 * 8) ; VRAM color table bank 1 (+#800 offset + char 128)
    call resource_load_to_vram_by_id
    ret

load_color_bank2:
    ; Load color bank 2: same colors as bank 0 (MSX Screen 2 standard)
    ; Fast direct port access (no BIOS overhead)
    ld a, RESOURCE_ID_TILE_COLOR_BANK0
    ld de, CLRTBL2 + #1000 + (128 * 8) ; VRAM color table bank 2 (+#1000 offset + char 128)
    call resource_load_to_vram_by_id
    ret

load_colors_to_vram:
    ; Load all color banks to VRAM (required for SCREEN 2)
    ; This loads the same colors to all 3 banks (standard MSX Screen 2 setup)
    ld a, (vram_cache_tile_colors_ready)
    or a
    ret nz
    call load_color_bank0
    call load_color_bank1
    call load_color_bank2
    ld a, 1
    ld (vram_cache_tile_colors_ready), a
    ret

; ==================================================================
; SCREEN 2 TILEBANK COLOR DATA (tilebank_1770753778086)
; ==================================================================

tilebank_tilebank_1770753778086_load_color_bank0:
    ld a, RESOURCE_ID_TILEBANK_COLOR_DATA_0
    ld de, CLRTBL2 + (128 * 8)
    call resource_load_to_vram_by_id
    ret

tilebank_tilebank_1770753778086_load_color_bank1:
    ld a, RESOURCE_ID_TILEBANK_COLOR_DATA_0
    ld de, CLRTBL2 + #800 + (128 * 8)
    call resource_load_to_vram_by_id
    ret

tilebank_tilebank_1770753778086_load_color_bank2:
    ld a, RESOURCE_ID_TILEBANK_COLOR_DATA_0
    ld de, CLRTBL2 + #1000 + (128 * 8)
    call resource_load_to_vram_by_id
    ret

load_tilebank_tilebank_1770753778086_colors_to_vram:
    call tilebank_tilebank_1770753778086_load_color_bank0
    call tilebank_tilebank_1770753778086_load_color_bank1
    call tilebank_tilebank_1770753778086_load_color_bank2
    ret

; [tilebank_color_data_* emitted in bank4 section]

; ==================================================================
; END OF COLOR DATA
; ==================================================================


; --- End of Far Bank 15 — pad to 8KB boundary ---
    ds #8000 - $, #FF
    org FAR_BANK_15_ROM_START + #2000

; ==================================================================
; DATA BANKS — Zone-packed data (8192 bytes per zone)
; First data bank: 16
; Accessed through mapper P3 using
; (label & #1FFF) | #A000.
; BANK_NUMBER = ((label - #4000) / #2000)
; NOTE: Each zone is explicitly padded to preserve bank placement even after
;       server-side ZX0 block rewrites shrink individual data blobs.
; ==================================================================
; ------------------------------------------------------------------
; MEGAROM DATA ZONE PACKER (post-ZX0 final sizes)
; Zone size: 8192 bytes
; Data start address: #24000
; Total data bytes (post-ZX0 / final): 3154
; Zones used: 1
; ------------------------------------------------------------------
; ZONE 00 [#24000-#26000] bank 16 used=3154 slack=5038
;   + SCREEN_PAN1_0_LAYOUT @ +#0000 size=136
;   + SCREEN_PAN1_0_EFFECTS_LAYOUT @ +#0088 size=6
;   + BEHAVIOR_PAN1_0_DATA @ +#008E size=69
;   + SCREEN_PAN1_0_INTERACTION_TYPE_MAP @ +#00D3 size=15
;   + SCREEN_PAN1_0_INTERACTION_VALUE_MAP @ +#00E2 size=60
;   + SCREEN_PAN1_0_INTERACTION_TARGET_MAP @ +#011E size=6
;   + SCREEN_PAN2_1_LAYOUT @ +#0124 size=87
;   + SCREEN_PAN2_1_EFFECTS_LAYOUT @ +#017B size=6
;   + BEHAVIOR_PAN2_1_DATA @ +#0181 size=42
;   + SCREEN_PAN2_1_INTERACTION_TYPE_MAP @ +#01AB size=15
;   + tile_pattern_bank0 @ +#01BA size=125
;   + tile_color_bank0 @ +#0237 size=51
;   + tilebank_pattern_data_0 @ +#026A size=119
;   + ANEC_RIGHT_0_F0_LAYER1 @ +#02E1 size=32
;   + ANEC_RIGHT_0_F0_LAYER2 @ +#0301 size=29
;   + SCREEN_PAN1_0_EFFECT_ZONE_TABLE @ +#031E size=1
;   + SCREEN_PAN1_0_BOSS_TABLE @ +#031F size=1
;   + SCREEN_PAN2_1_EFFECT_ZONE_TABLE @ +#0320 size=1
;   + SCREEN_PAN2_1_BOSS_TABLE @ +#0321 size=1
;   + SCREEN_BACKGROUND1_2_EFFECT_ZONE_TABLE @ +#0322 size=1
;   + SCREEN_BACKGROUND1_2_BOSS_TABLE @ +#0323 size=1
;   + SCREEN_PAN3_3_EFFECT_ZONE_TABLE @ +#0324 size=1
;   + SCREEN_PAN3_3_BOSS_TABLE @ +#0325 size=1
;   + SCREEN_PAN4_4_EFFECT_ZONE_TABLE @ +#0326 size=1
;   + SCREEN_PAN4_4_BOSS_TABLE @ +#0327 size=1
;   + SCREEN_PAN2_1_INTERACTION_VALUE_MAP @ +#0328 size=40
;   + SCREEN_PAN2_1_INTERACTION_TARGET_MAP @ +#0350 size=6
;   + SCREEN_BACKGROUND1_2_LAYOUT @ +#0356 size=6
;   + SCREEN_BACKGROUND1_2_EFFECTS_LAYOUT @ +#035C size=6
;   + BEHAVIOR_BACKGROUND1_2_DATA @ +#0362 size=6
;   + SCREEN_BACKGROUND1_2_INTERACTION_TYPE_MAP @ +#0368 size=6
;   + SCREEN_BACKGROUND1_2_INTERACTION_VALUE_MAP @ +#036E size=6
;   + SCREEN_BACKGROUND1_2_INTERACTION_TARGET_MAP @ +#0374 size=6
;   + SCREEN_PAN3_3_LAYOUT @ +#037A size=103
;   + SCREEN_PAN3_3_EFFECTS_LAYOUT @ +#03E1 size=6
;   + tilebank_color_data_0 @ +#03E7 size=48
;   + ANEC_RIGHT_0_F1_LAYER1 @ +#0417 size=32
;   + ANEC_RIGHT_0_F1_LAYER2 @ +#0437 size=28
;   + BOLA_1_F0_LAYER1 @ +#0453 size=24
;   + BOLA_1_F1_LAYER1 @ +#046B size=28
;   + PANELL_2_F0_LAYER1 @ +#0487 size=20
;   + PANELL_2_F0_LAYER2 @ +#049B size=14
;   + NINA_WALK_RIGHT_3_F0_LAYER0 @ +#04A9 size=30
;   + NINA_WALK_RIGHT_3_F0_LAYER1 @ +#04C7 size=25
;   + NINA_WALK_RIGHT_3_F1_LAYER0 @ +#04E0 size=31
;   + NINA_WALK_RIGHT_3_F1_LAYER1 @ +#04FF size=27
;   + NINA_JUMP_RIGHT_4_F0_LAYER0 @ +#051A size=27
;   + BEHAVIOR_PAN3_3_DATA @ +#0535 size=60
;   + SCREEN_PAN3_3_INTERACTION_TYPE_MAP @ +#0571 size=24
;   + SCREEN_PAN3_3_INTERACTION_VALUE_MAP @ +#0589 size=58
;   + SCREEN_PAN3_3_INTERACTION_TARGET_MAP @ +#05C3 size=6
;   + SCREEN_PAN4_4_LAYOUT @ +#05C9 size=109
;   + SCREEN_PAN4_4_EFFECTS_LAYOUT @ +#0636 size=6
;   + BEHAVIOR_PAN4_4_DATA @ +#063C size=64
;   + SCREEN_PAN4_4_INTERACTION_TYPE_MAP @ +#067C size=21
;   + SCREEN_PAN4_4_INTERACTION_VALUE_MAP @ +#0691 size=64
;   + SCREEN_PAN4_4_INTERACTION_TARGET_MAP @ +#06D1 size=6
;   + NINA_JUMP_RIGHT_4_F0_LAYER1 @ +#06D7 size=24
;   + NINA_LAND_RIGHT_5_F0_LAYER0 @ +#06EF size=30
;   + NINA_LAND_RIGHT_5_F0_LAYER1 @ +#070D size=23
;   + NINA_LAND_RIGHT_5_F1_LAYER0 @ +#0724 size=28
;   + NINA_LAND_RIGHT_5_F1_LAYER1 @ +#0740 size=27
;   + NINA_LAND_RIGHT_5_F2_LAYER0 @ +#075B size=30
;   + NINA_LAND_RIGHT_5_F2_LAYER1 @ +#0779 size=26
;   + NINA_DEAD_RIGHT_6_F0_LAYER0 @ +#0793 size=32
;   + NINA_DEAD_RIGHT_6_F0_LAYER2 @ +#07B3 size=32
;   + NINA_DEAD_RIGHT_6_F1_LAYER0 @ +#07D3 size=26
;   + NINA_DEAD_RIGHT_6_F1_LAYER2 @ +#07ED size=32
;   + NINA_IDLE_RIGHT_7_F0_LAYER0 @ +#080D size=30
;   + NINA_IDLE_RIGHT_7_F0_LAYER1 @ +#082B size=24
;   + NINA_IDLE_RIGHT_7_F1_LAYER0 @ +#0843 size=30
;   + NINA_IDLE_RIGHT_7_F1_LAYER1 @ +#0861 size=24
;   + NINA_FALL_RIGHT_8_F0_LAYER0 @ +#0879 size=29
;   + NINA_FALL_RIGHT_8_F0_LAYER1 @ +#0896 size=24
;   + CAPCUADRAT1_RIGHT_9_F0_LAYER2 @ +#08AE size=21
;   + CAPCUADRAT1_RIGHT_9_F0_LAYER3 @ +#08C3 size=29
;   + CAPCUADRAT1_RIGHT_9_F1_LAYER2 @ +#08E0 size=21
;   + CAPCUADRAT1_RIGHT_9_F1_LAYER3 @ +#08F5 size=28
;   + ANEC_LEFT_10_F0_LAYER1 @ +#0911 size=32
;   + ANEC_LEFT_10_F0_LAYER2 @ +#0931 size=29
;   + ANEC_LEFT_10_F1_LAYER1 @ +#094E size=32
;   + ANEC_LEFT_10_F1_LAYER2 @ +#096E size=29
;   + NINA_WALK_LEFT_11_F0_LAYER0 @ +#098B size=28
;   + NINA_WALK_LEFT_11_F0_LAYER1 @ +#09A7 size=25
;   + NINA_WALK_LEFT_11_F1_LAYER0 @ +#09C0 size=30
;   + NINA_WALK_LEFT_11_F1_LAYER1 @ +#09DE size=30
;   + NINA_JUMP_LEFT_12_F0_LAYER0 @ +#09FC size=27
;   + NINA_JUMP_LEFT_12_F0_LAYER1 @ +#0A17 size=24
;   + NINA_LAND_LEFT_13_F0_LAYER0 @ +#0A2F size=29
;   + NINA_LAND_LEFT_13_F0_LAYER1 @ +#0A4C size=24
;   + NINA_LAND_LEFT_13_F1_LAYER0 @ +#0A64 size=28
;   + NINA_LAND_LEFT_13_F1_LAYER1 @ +#0A80 size=28
;   + NINA_LAND_LEFT_13_F2_LAYER0 @ +#0A9C size=29
;   + NINA_LAND_LEFT_13_F2_LAYER1 @ +#0AB9 size=27
;   + NINA_DEAD_LEFT_14_F0_LAYER0 @ +#0AD4 size=32
;   + NINA_DEAD_LEFT_14_F0_LAYER2 @ +#0AF4 size=32
;   + NINA_DEAD_LEFT_14_F1_LAYER0 @ +#0B14 size=25
;   + NINA_DEAD_LEFT_14_F1_LAYER2 @ +#0B2D size=32
;   + NINA_IDLE_LEFT_15_F0_LAYER0 @ +#0B4D size=30
;   + NINA_IDLE_LEFT_15_F0_LAYER1 @ +#0B6B size=24
;   + NINA_IDLE_LEFT_15_F1_LAYER0 @ +#0B83 size=30
;   + NINA_IDLE_LEFT_15_F1_LAYER1 @ +#0BA1 size=24
;   + NINA_FALL_LEFT_16_F0_LAYER0 @ +#0BB9 size=29
;   + NINA_FALL_LEFT_16_F0_LAYER1 @ +#0BD6 size=24
;   + CAPCUADRAT1_LEFT_17_F0_LAYER2 @ +#0BEE size=20
;   + CAPCUADRAT1_LEFT_17_F0_LAYER3 @ +#0C02 size=29
;   + CAPCUADRAT1_LEFT_17_F1_LAYER2 @ +#0C1F size=20
;   + CAPCUADRAT1_LEFT_17_F1_LAYER3 @ +#0C33 size=26
;   + SPRITE_PLACEHOLDER_PATTERN @ +#0C4D size=5

    org #24000
; ==================================================================
; DATA ZONE 00 (bank 16) used=3154 slack=5038
; ==================================================================
; ==================================================================
    ; ZX0 compressed banked resource (768 -> 136 bytes)
    DB #95,#84,#69,#FF,#56,#95,#84,#6A,#80,#E3,#81,#FC,#F1,#FB,#FC,#BB
    DB #88,#FE,#EF,#F0,#82,#48,#48,#84,#90,#8F,#8E,#82,#83,#FD,#E5,#80
    DB #C0,#7D,#B8,#F4,#C0,#2B,#86,#C1,#80,#8F,#81,#81,#00,#46,#25,#83
    DB #83,#0D,#DE,#6E,#80,#57,#E7,#8B,#FC,#95,#80,#E2,#CD,#FF,#85,#0C
    DB #86,#C6,#F2,#8E,#FF,#BE,#4F,#FB,#9E,#C0,#76,#32,#0C,#43,#DD,#80
    DB #65,#CC,#7D,#80,#EF,#F6,#80,#44,#F7,#C0,#F4,#F1,#FC,#EF,#C0,#F0
    DB #EA,#40,#86,#10,#A7,#82,#7E,#88,#A8,#78,#FE,#1E,#80,#1E,#FC,#F5
    DB #80,#3F,#FC,#D2,#80,#90,#86,#E5,#B0,#CD,#7E,#A3,#82,#C3,#80,#DE
    DB #B0,#A0,#0F,#FB,#8D,#80,#55,#56

SCREEN_PAN1_0_EFFECTS_LAYOUT:
    ; ZX0 compressed banked resource (768 -> 6 bytes)
    DB #85,#FF,#55,#5D,#55,#56

BEHAVIOR_PAN1_0_DATA:
    ; ZX0 compressed banked resource (768 -> 69 bytes)
    DB #85,#00,#56,#80,#10,#0F,#88,#57,#D4,#40,#F4,#C0,#69,#08,#17,#9F
    DB #02,#C0,#15,#FD,#CF,#C0,#53,#B3,#CF,#04,#C0,#19,#91,#11,#11,#11
    DB #F3,#C1,#F8,#47,#DE,#C0,#F6,#F0,#C0,#13,#58,#90,#1F,#C1,#72,#3E
    DB #84,#08,#38,#C0,#F7,#FE,#D5,#C0,#7D,#BA,#7A,#C1,#08,#1F,#FE,#47
    DB #84,#C0,#35,#55,#58

SCREEN_PAN1_0_INTERACTION_TYPE_MAP:
    ; ZX0 compressed banked resource (768 -> 15 bytes)
    DB #91,#00,#51,#88,#01,#00,#50,#16,#E5,#01,#18,#45,#D5,#55,#60

SCREEN_PAN1_0_INTERACTION_VALUE_MAP:
    ; ZX0 compressed banked resource (768 -> 60 bytes)
    DB #85,#00,#56,#80,#01,#0F,#A0,#4E,#DE,#5F,#C0,#57,#FD,#FE,#C0,#1A
    DB #01,#45,#E7,#02,#C5,#C0,#7F,#F1,#C0,#55,#F3,#FB,#C0,#17,#C3,#C0
    DB #25,#4A,#38,#60,#3C,#C0,#04,#D6,#90,#13,#60,#B0,#E5,#86,#38,#A8
    DB #7D,#C0,#07,#31,#72,#3E,#F9,#FE,#01,#75,#55,#58

SCREEN_PAN1_0_INTERACTION_TARGET_MAP:
    ; ZX0 compressed banked resource (768 -> 6 bytes)
    DB #85,#00,#55,#5D,#55,#56

SCREEN_PAN2_1_LAYOUT:
    ; ZX0 compressed banked resource (768 -> 87 bytes)
    DB #85,#FF,#56,#3D,#80,#81,#FC,#1F,#BA,#F5,#3A,#2A,#80,#94,#86,#4D
    DB #95,#46,#0F,#00,#55,#77,#46,#05,#23,#89,#8A,#DD,#FC,#D2,#5E,#7E
    DB #8D,#82,#83,#FC,#20,#8B,#8C,#3B,#E4,#D3,#84,#BD,#98,#40,#0E,#98
    DB #F4,#C0,#3B,#5C,#59,#02,#1E,#4F,#EF,#8A,#FA,#40,#CF,#32,#8D,#F0
    DB #8F,#BC,#FB,#9F,#E4,#4F,#6A,#E0,#8C,#F7,#F9,#B8,#7F,#F8,#BF,#F4
    DB #FB,#E4,#39,#FC,#D5,#55,#60

SCREEN_PAN2_1_EFFECTS_LAYOUT:
    ; ZX0 compressed banked resource (768 -> 6 bytes)
    DB #85,#FF,#55,#5D,#55,#56

BEHAVIOR_PAN2_1_DATA:
    ; ZX0 compressed banked resource (768 -> 42 bytes)
    DB #85,#00,#56,#95,#10,#7F,#BA,#D4,#3A,#AA,#10,#08,#51,#36,#46,#54
    DB #3D,#00,#55,#DD,#46,#05,#E5,#C6,#B7,#08,#1E,#57,#20,#FA,#1E,#C0
    DB #05,#B9,#08,#CE,#0E,#FE,#04,#75,#55,#58

SCREEN_PAN2_1_INTERACTION_TYPE_MAP:
    ; ZX0 compressed banked resource (768 -> 15 bytes)
    DB #84,#00,#10,#89,#01,#00,#04,#52,#F0,#01,#32,#01,#D5,#55,#60

tile_pattern_bank0:
    ; ZX0 compressed banked resource (144 -> 125 bytes)
    DB #29,#00,#7F,#68,#00,#E0,#EC,#00,#74,#00,#EF,#A0,#00,#11,#22,#00
    DB #22,#71,#00,#F0,#F1,#00,#70,#04,#A6,#41,#00,#11,#02,#00,#05,#20
    DB #C2,#00,#7E,#FF,#00,#F7,#08,#FF,#7E,#18,#30,#19,#18,#0C,#86,#98
    DB #80,#18,#3C,#7E,#9B,#34,#18,#01,#98,#F0,#1F,#80,#FE,#FF,#FF,#DF
    DB #AF,#DF,#FF,#7F,#70,#8A,#80,#20,#82,#42,#28,#09,#80,#A2,#42,#08
    DB #02,#10,#BA,#00,#F7,#09,#20,#BA,#40,#00,#04,#01,#FF,#38,#3E,#F7
    DB #FD,#2A,#FF,#A9,#A5,#EA,#E2,#10,#98,#7C,#38,#10,#82,#D0,#D0,#C0
    DB #C0,#E4,#FB,#BD,#D0,#0B,#0B,#03,#03,#FF,#FF,#55,#56

tile_color_bank0:
    ; ZX0 compressed banked resource (144 -> 51 bytes)
    DB #8A,#41,#51,#FF,#FA,#F0,#F7,#FE,#E0,#E9,#F0,#BA,#C1,#FF,#31,#A2
    DB #C1,#8A,#81,#91,#A0,#A1,#4F,#9A,#7D,#70,#59,#3A,#F1,#F1,#71,#E1
    DB #E1,#F1,#FF,#61,#3B,#71,#81,#BF,#EE,#DE,#8E,#F6,#FF,#9F,#71,#F0
    DB #75,#55,#58

tilebank_pattern_data_0:
    ; ZX0 compressed banked resource (136 -> 119 bytes)
    DB #29,#00,#7F,#68,#00,#E0,#EC,#00,#74,#00,#EF,#A0,#00,#11,#22,#00
    DB #22,#71,#00,#F0,#F1,#00,#70,#04,#A6,#41,#00,#11,#02,#00,#05,#20
    DB #C2,#00,#7E,#FF,#00,#F7,#08,#FF,#7E,#18,#30,#19,#18,#0C,#86,#98
    DB #80,#18,#3C,#7E,#9B,#34,#18,#01,#98,#F0,#1F,#80,#FE,#FF,#FF,#DF
    DB #AF,#DF,#FF,#7F,#70,#8A,#80,#20,#82,#42,#28,#09,#80,#A2,#42,#08
    DB #02,#10,#BA,#00,#F7,#09,#20,#BA,#40,#00,#04,#01,#FF,#38,#29,#00
    DB #92,#FF,#A9,#FF,#A5,#FF,#00,#AA,#D0,#C0,#8A,#FF,#C0,#2A,#D0,#0B
    DB #03,#88,#FF,#03,#D5,#55,#60

ANEC_RIGHT_0_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#00,#01,#01,#03,#02,#03,#01,#00,#00,#00,#09,#0E,#07,#04,#0A
    DB #00,#C0,#B0,#D0,#58,#DC,#F7,#E0,#40,#00,#E0,#F8,#F8,#F0,#08,#14


ANEC_RIGHT_0_F0_LAYER2: ; Brush Color Index 2 (Actual Color: #42EBF5)
    ; ZX0 compressed banked resource (32 -> 29 bytes)
    DB #82,#00,#17,#01,#00,#40,#60,#30,#19,#16,#11,#08,#00,#04,#A6,#E0
    DB #20,#A0,#20,#E6,#FF,#E0,#18,#04,#ED,#E1,#08,#55,#56

SCREEN_PAN1_0_EFFECT_ZONE_TABLE:
    ; No effect zones for pan1
    DB #00


SCREEN_PAN1_0_BOSS_TABLE:
    db 0    ; No boss placements

;; BEHAVIOR MAP: pan1_0 (32x24 tiles)
;; Total size: 768 bytes (Map IDs 0-255)
;; Data format: HEX

BEHAVIOR_PAN1_0_WIDTH     EQU 32
BEHAVIOR_PAN1_0_HEIGHT    EQU 24
BEHAVIOR_PAN1_0_SIZE      EQU 768


SCREEN_PAN2_1_EFFECT_ZONE_TABLE:
    ; No effect zones for pan2
    DB #00


SCREEN_PAN2_1_BOSS_TABLE:
    db 0    ; No boss placements

;; BEHAVIOR MAP: pan2_1 (32x24 tiles)
;; Total size: 768 bytes (Map IDs 0-255)
;; Data format: HEX

BEHAVIOR_PAN2_1_WIDTH     EQU 32
BEHAVIOR_PAN2_1_HEIGHT    EQU 24
BEHAVIOR_PAN2_1_SIZE      EQU 768


SCREEN_BACKGROUND1_2_EFFECT_ZONE_TABLE:
    ; No effect zones for background1
    DB #00


SCREEN_BACKGROUND1_2_BOSS_TABLE:
    db 0    ; No boss placements

;; BEHAVIOR MAP: background1_2 (32x24 tiles)
;; Total size: 768 bytes (Map IDs 0-255)
;; Data format: HEX

BEHAVIOR_BACKGROUND1_2_WIDTH     EQU 32
BEHAVIOR_BACKGROUND1_2_HEIGHT    EQU 24
BEHAVIOR_BACKGROUND1_2_SIZE      EQU 768


SCREEN_PAN3_3_EFFECT_ZONE_TABLE:
    ; No effect zones for pan3
    DB #00


SCREEN_PAN3_3_BOSS_TABLE:
    db 0    ; No boss placements

;; BEHAVIOR MAP: pan3_3 (32x24 tiles)
;; Total size: 768 bytes (Map IDs 0-255)
;; Data format: HEX

BEHAVIOR_PAN3_3_WIDTH     EQU 32
BEHAVIOR_PAN3_3_HEIGHT    EQU 24
BEHAVIOR_PAN3_3_SIZE      EQU 768


SCREEN_PAN4_4_EFFECT_ZONE_TABLE:
    ; No effect zones for pan4
    DB #00


SCREEN_PAN4_4_BOSS_TABLE:
    db 0    ; No boss placements

;; BEHAVIOR MAP: pan4_4 (32x24 tiles)
;; Total size: 768 bytes (Map IDs 0-255)
;; Data format: HEX

BEHAVIOR_PAN4_4_WIDTH     EQU 32
BEHAVIOR_PAN4_4_HEIGHT    EQU 24
BEHAVIOR_PAN4_4_SIZE      EQU 768

SCREEN_PAN2_1_INTERACTION_VALUE_MAP:
    ; ZX0 compressed banked resource (768 -> 40 bytes)
    DB #85,#00,#56,#95,#01,#7F,#BA,#D5,#7A,#FD,#FD,#3A,#07,#65,#46,#43
    DB #D5,#00,#5D,#D0,#46,#5D,#D5,#0C,#E0,#84,#7D,#40,#5F,#C0,#57,#E4
    DB #F9,#CE,#38,#FE,#11,#D5,#55,#60

SCREEN_PAN2_1_INTERACTION_TARGET_MAP:
    ; ZX0 compressed banked resource (768 -> 6 bytes)
    DB #85,#00,#55,#5D,#55,#56

SCREEN_BACKGROUND1_2_LAYOUT:
    ; ZX0 compressed banked resource (768 -> 6 bytes)
    DB #85,#84,#55,#5D,#55,#56

SCREEN_BACKGROUND1_2_EFFECTS_LAYOUT:
    ; ZX0 compressed banked resource (768 -> 6 bytes)
    DB #85,#FF,#55,#5D,#55,#56

BEHAVIOR_BACKGROUND1_2_DATA:
    ; ZX0 compressed banked resource (768 -> 6 bytes)
    DB #85,#00,#55,#5D,#55,#56

SCREEN_BACKGROUND1_2_INTERACTION_TYPE_MAP:
    ; ZX0 compressed banked resource (768 -> 6 bytes)
    DB #85,#00,#55,#5D,#55,#56

SCREEN_BACKGROUND1_2_INTERACTION_VALUE_MAP:
    ; ZX0 compressed banked resource (768 -> 6 bytes)
    DB #85,#00,#55,#5D,#55,#56

SCREEN_BACKGROUND1_2_INTERACTION_TARGET_MAP:
    ; ZX0 compressed banked resource (768 -> 6 bytes)
    DB #85,#00,#55,#5D,#55,#56

SCREEN_PAN3_3_LAYOUT:
    ; ZX0 compressed banked resource (768 -> 103 bytes)
    DB #85,#FF,#56,#3D,#80,#81,#FC,#1F,#82,#57,#96,#C0,#81,#86,#29,#82
    DB #BB,#8D,#F5,#83,#C3,#FC,#95,#80,#A1,#FF,#1F,#00,#57,#E0,#41,#FA
    DB #7D,#80,#1E,#00,#10,#6B,#86,#35,#54,#39,#80,#4C,#A4,#EB,#88,#F4
    DB #80,#28,#88,#1E,#E9,#3C,#89,#8A,#FC,#F8,#D9,#80,#A5,#82,#FF,#F4
    DB #E0,#8F,#8B,#8C,#FC,#3F,#E1,#00,#0F,#2C,#E0,#56,#DD,#00,#18,#90
    DB #80,#81,#68,#86,#3F,#6B,#F1,#80,#80,#D3,#84,#43,#68,#2D,#82,#79
    DB #FC,#5E,#80,#04,#D5,#55,#60

SCREEN_PAN3_3_EFFECTS_LAYOUT:
    ; ZX0 compressed banked resource (768 -> 6 bytes)
    DB #85,#FF,#55,#5D,#55,#56

tilebank_color_data_0:
    ; ZX0 compressed banked resource (136 -> 48 bytes)
    DB #8A,#41,#51,#FF,#FA,#F0,#F7,#FE,#E0,#E9,#F0,#BA,#C1,#FF,#31,#A2
    DB #C1,#8A,#81,#91,#A0,#A1,#4F,#9A,#7D,#70,#59,#3A,#F1,#F1,#71,#E1
    DB #E1,#F1,#FF,#61,#3B,#71,#81,#FA,#E4,#FF,#71,#7D,#F0,#D5,#55,#60

ANEC_RIGHT_0_F1_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#00,#01,#01,#03,#02,#03,#01,#00,#20,#10,#09,#0E,#03,#00,#00
    DB #00,#C0,#B0,#90,#58,#DC,#F7,#E0,#40,#00,#E0,#78,#F8,#F0,#40,#A0


ANEC_RIGHT_0_F1_LAYER2: ; Brush Color Index 2 (Actual Color: #42EBF5)
    ; ZX0 compressed banked resource (32 -> 28 bytes)
    DB #82,#00,#E4,#01,#FB,#E2,#E0,#D0,#29,#16,#01,#04,#E4,#7A,#20,#A0
    DB #20,#F4,#1A,#E0,#18,#84,#04,#08,#D5,#40,#55,#60

BOLA_1_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #C95BBA)
    ; ZX0 compressed banked resource (32 -> 24 bytes)
    DB #82,#00,#49,#03,#0F,#1F,#3F,#2F,#3F,#98,#1F,#07,#00,#20,#86,#E0
    DB #90,#68,#FC,#35,#F8,#E0,#55,#58

BOLA_1_F1_LAYER1: ; Brush Color Index 1 (Actual Color: #C95BBA)
    ; ZX0 compressed banked resource (32 -> 28 bytes)
    DB #A1,#00,#86,#07,#0F,#1D,#1B,#3F,#A6,#1F,#0F,#07,#00,#8A,#C0,#E0
    DB #AA,#F0,#F8,#AE,#D8,#F8,#F3,#35,#E0,#C0,#55,#58

PANELL_2_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    ; ZX0 compressed banked resource (32 -> 20 bytes)
    DB #92,#00,#8A,#3F,#00,#06,#1A,#30,#38,#3C,#FE,#FF,#7B,#3C,#18,#10
    DB #E8,#55,#55,#80

PANELL_2_F0_LAYER2: ; Brush Color Index 2 (Actual Color: #FF0000)
    ; ZX0 compressed banked resource (32 -> 14 bytes)
    DB #81,#00,#89,#3F,#00,#48,#6D,#C2,#24,#28,#30,#00,#55,#56

NINA_WALK_RIGHT_3_F0_LAYER0: ; Brush Color Index 0 (Actual Color: #D4524D)
    ; ZX0 compressed banked resource (32 -> 30 bytes)
    DB #A0,#07,#A1,#35,#5C,#80,#00,#61,#03,#02,#03,#07,#0F,#00,#01,#00
    DB #01,#F8,#00,#9A,#C0,#68,#C0,#EB,#E0,#F0,#40,#55,#55,#80

NINA_WALK_RIGHT_3_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    ; ZX0 compressed banked resource (32 -> 25 bytes)
    DB #89,#00,#A8,#02,#03,#01,#00,#3E,#F5,#F0,#92,#F0,#D0,#D8,#F8,#F0
    DB #80,#BF,#94,#ED,#FE,#B5,#80,#55,#58

NINA_WALK_RIGHT_3_F1_LAYER0: ; Brush Color Index 0 (Actual Color: #D4524D)
    ; ZX0 compressed banked resource (32 -> 31 bytes)
    DB #48,#03,#07,#87,#A9,#54,#00,#85,#83,#03,#02,#07,#0F,#2B,#00,#20
    DB #00,#C0,#F8,#00,#86,#F1,#68,#C0,#E0,#A0,#10,#B5,#14,#55,#58

NINA_WALK_RIGHT_3_F1_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    ; ZX0 compressed banked resource (32 -> 27 bytes)
    DB #99,#00,#BE,#02,#03,#01,#F0,#3E,#14,#20,#E4,#4A,#F0,#D0,#D8,#F8
    DB #F0,#80,#EA,#94,#E9,#50,#35,#10,#08,#55,#58

NINA_JUMP_RIGHT_4_F0_LAYER0: ; Brush Color Index 0 (Actual Color: #D4524D)
    ; ZX0 compressed banked resource (32 -> 27 bytes)
    DB #A5,#07,#EE,#09,#14,#20,#10,#20,#03,#02,#EF,#06,#FC,#8B,#00,#F8
    DB #88,#FE,#20,#C0,#40,#C0,#E0,#B5,#00,#55,#58

BEHAVIOR_PAN3_3_DATA:
    ; ZX0 compressed banked resource (768 -> 60 bytes)
    DB #85,#00,#56,#95,#10,#7D,#82,#4F,#C0,#0A,#08,#14,#FC,#D3,#58,#1E
    DB #40,#50,#A1,#00,#5E,#FA,#07,#84,#40,#1C,#D1,#54,#89,#08,#10,#57
    DB #81,#C0,#4C,#D7,#82,#34,#60,#F5,#C0,#7D,#76,#DC,#40,#0F,#C0,#56
    DB #93,#08,#D2,#F1,#82,#51,#E0,#C0,#13,#55,#55,#80

SCREEN_PAN3_3_INTERACTION_TYPE_MAP:
    ; ZX0 compressed banked resource (768 -> 24 bytes)
    DB #84,#00,#45,#B9,#01,#D2,#4F,#12,#00,#7D,#FA,#77,#1C,#10,#7D,#FE
    DB #04,#6D,#01,#D4,#20,#0D,#55,#56

SCREEN_PAN3_3_INTERACTION_VALUE_MAP:
    ; ZX0 compressed banked resource (768 -> 58 bytes)
    DB #85,#00,#56,#95,#01,#7D,#82,#5F,#E6,#03,#DF,#DA,#F8,#F0,#58,#79
    DB #40,#42,#85,#00,#78,#FA,#1E,#40,#10,#73,#84,#57,#34,#54,#78,#C0
    DB #15,#CD,#82,#73,#60,#1F,#C0,#57,#71,#A6,#3C,#DA,#F5,#C0,#69,#01
    DB #3D,#FB,#25,#82,#1E,#C0,#01,#35,#55,#58

SCREEN_PAN3_3_INTERACTION_TARGET_MAP:
    ; ZX0 compressed banked resource (768 -> 6 bytes)
    DB #85,#00,#55,#5D,#55,#56

SCREEN_PAN4_4_LAYOUT:
    ; ZX0 compressed banked resource (768 -> 109 bytes)
    DB #85,#FF,#56,#3C,#80,#81,#FC,#4F,#C3,#F1,#F9,#88,#7A,#FA,#FA,#82
    DB #40,#86,#14,#A2,#82,#B8,#82,#EE,#BC,#83,#FC,#38,#80,#0F,#2B,#70
    DB #DC,#F5,#80,#A3,#8D,#93,#C0,#E5,#E7,#80,#5A,#FF,#55,#A0,#8D,#7F
    DB #EF,#80,#47,#F1,#EF,#00,#A4,#86,#F5,#80,#28,#8D,#53,#F8,#C0,#80
    DB #0F,#FD,#86,#00,#81,#88,#7E,#FD,#80,#06,#8D,#8D,#65,#C0,#3A,#81
    DB #82,#07,#91,#BA,#E3,#40,#94,#80,#A5,#FF,#A5,#8D,#5F,#C6,#06,#E3
    DB #81,#80,#C0,#46,#DB,#26,#4D,#00,#0D,#B5,#26,#55,#58

SCREEN_PAN4_4_EFFECTS_LAYOUT:
    ; ZX0 compressed banked resource (768 -> 6 bytes)
    DB #85,#FF,#55,#5D,#55,#56

BEHAVIOR_PAN4_4_DATA:
    ; ZX0 compressed banked resource (768 -> 64 bytes)
    DB #85,#00,#56,#94,#10,#3F,#C2,#C5,#88,#F6,#C0,#95,#08,#7D,#52,#3D
    DB #C0,#3D,#34,#38,#C0,#1A,#08,#47,#D5,#80,#F4,#40,#5F,#EF,#D1,#80
    DB #F5,#C0,#A0,#08,#1F,#40,#55,#FC,#FF,#C0,#03,#F3,#40,#00,#47,#94
    DB #C0,#A0,#00,#56,#94,#08,#34,#D4,#48,#F5,#C0,#7D,#FE,#5D,#55,#56

SCREEN_PAN4_4_INTERACTION_TYPE_MAP:
    ; ZX0 compressed banked resource (768 -> 21 bytes)
    DB #84,#00,#10,#BD,#01,#42,#15,#F5,#40,#56,#85,#01,#56,#94,#00,#01
    DB #F5,#FE,#75,#55,#58

SCREEN_PAN4_4_INTERACTION_VALUE_MAP:
    ; ZX0 compressed banked resource (768 -> 64 bytes)
    DB #85,#00,#56,#94,#01,#3F,#C2,#C5,#88,#F6,#C0,#95,#01,#7D,#52,#3D
    DB #C0,#3D,#34,#38,#C0,#1A,#01,#47,#D5,#80,#F4,#40,#5F,#EF,#D1,#80
    DB #F5,#C0,#A0,#01,#1F,#40,#55,#FC,#FF,#C0,#07,#B3,#DA,#00,#47,#94
    DB #C0,#A0,#00,#56,#94,#01,#34,#D4,#48,#F5,#C0,#7D,#FE,#5D,#55,#56

SCREEN_PAN4_4_INTERACTION_TARGET_MAP:
    ; ZX0 compressed banked resource (768 -> 6 bytes)
    DB #85,#00,#55,#5D,#55,#56

NINA_JUMP_RIGHT_4_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    ; ZX0 compressed banked resource (32 -> 24 bytes)
    DB #89,#00,#BE,#02,#03,#01,#F5,#FD,#86,#01,#58,#F0,#D0,#D8,#F8,#F0
    DB #80,#00,#FF,#FE,#F3,#55,#55,#80

NINA_LAND_RIGHT_5_F0_LAYER0: ; Brush Color Index 0 (Actual Color: #D4524D)
    ; ZX0 compressed banked resource (32 -> 30 bytes)
    DB #AA,#00,#07,#0A,#05,#0C,#18,#10,#02,#03,#02,#07,#0F,#3F,#00,#01
    DB #00,#88,#F8,#00,#64,#B5,#C0,#40,#E0,#F0,#FC,#00,#55,#58

NINA_LAND_RIGHT_5_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    ; ZX0 compressed banked resource (32 -> 23 bytes)
    DB #82,#00,#6E,#02,#03,#01,#EE,#3E,#F5,#E0,#92,#F0,#D0,#D8,#F8,#F0
    DB #80,#A7,#80,#D5,#F7,#55,#60

NINA_LAND_RIGHT_5_F1_LAYER0: ; Brush Color Index 0 (Actual Color: #D4524D)
    ; ZX0 compressed banked resource (32 -> 28 bytes)
    DB #8A,#00,#07,#82,#05,#0C,#18,#10,#96,#03,#02,#07,#0F,#1F,#01,#00
    DB #22,#F8,#00,#18,#3D,#C0,#40,#E0,#F0,#EB,#55,#56

NINA_LAND_RIGHT_5_F1_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    ; ZX0 compressed banked resource (32 -> 27 bytes)
    DB #86,#00,#6E,#02,#03,#01,#F2,#9F,#40,#A0,#40,#E4,#92,#F0,#D0,#D8
    DB #F8,#F0,#80,#E7,#FD,#01,#02,#81,#55,#55,#80

NINA_LAND_RIGHT_5_F2_LAYER0: ; Brush Color Index 0 (Actual Color: #D4524D)
    ; ZX0 compressed banked resource (32 -> 30 bytes)
    DB #28,#00,#07,#28,#05,#0C,#18,#10,#29,#03,#02,#03,#07,#21,#05,#00
    DB #01,#00,#F8,#00,#82,#C0,#40,#C0,#E0,#BD,#20,#F1,#55,#56

NINA_LAND_RIGHT_5_F2_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    ; ZX0 compressed banked resource (32 -> 26 bytes)
    DB #99,#00,#A8,#02,#03,#01,#00,#26,#80,#21,#00,#24,#F8,#F0,#D0,#D8
    DB #F8,#F0,#80,#E9,#DD,#8D,#01,#04,#55,#56

NINA_DEAD_RIGHT_6_F0_LAYER0: ; Brush Color Index 0 (Actual Color: #D4524D)
    DB #17,#37,#65,#4E,#5B,#51,#51,#43,#7A,#33,#27,#2F,#21,#3D,#05,#05
    DB #FA,#F2,#D2,#DA,#FA,#F2,#86,#DC,#D0,#D8,#C8,#E8,#08,#78,#10,#D0


NINA_DEAD_RIGHT_6_F0_LAYER2: ; Brush Color Index 2 (Actual Color: #000000)
    DB #08,#08,#1A,#31,#24,#2E,#2E,#3C,#05,#0C,#18,#10,#1E,#02,#02,#02
    DB #04,#0C,#2C,#24,#04,#0C,#78,#20,#20,#20,#30,#10,#F0,#80,#E0,#20

;; ---- End of Frame: nina_dead_right_6_F0 ----

;; ---- Sprite Frame: nina_dead_right_6_F1 ----
;; Size: 16x16


NINA_DEAD_RIGHT_6_F1_LAYER0: ; Brush Color Index 0 (Actual Color: #D4524D)
    ; ZX0 compressed banked resource (32 -> 26 bytes)
    DB #08,#10,#30,#60,#40,#26,#78,#30,#20,#22,#3C,#04,#A1,#02,#86,#06
    DB #1C,#10,#18,#08,#22,#78,#10,#D5,#55,#60

NINA_DEAD_RIGHT_6_F1_LAYER2: ; Brush Color Index 2 (Actual Color: #000000)
    DB #08,#08,#1A,#31,#24,#2E,#2E,#3C,#05,#0C,#18,#00,#1E,#02,#02,#02
    DB #04,#0C,#2C,#24,#04,#0C,#78,#20,#20,#20,#30,#10,#F0,#80,#E0,#20

;; ---- End of Frame: nina_dead_right_6_F1 ----


; Sprite Asset 7: nina_idle_right
;; Sprite: nina_idle_right
;; Total Frames: 2
;; Size: 16x16
;; Background Color (not exported as a layer): rgba(0,0,0,0)
;; Drawable Palette (Hex): C0=#D4524D, C1=#FFFFFF, C2=#000000, C3=#3EB847

SPRITE_NINA_IDLE_RIGHT_7_WIDTH     EQU 16
SPRITE_NINA_IDLE_RIGHT_7_HEIGHT    EQU 16
SPRITE_NINA_IDLE_RIGHT_7_FRAMES    EQU 2

;; MSX1 HW Layer Order (front to back): C0=#D4524D, C1=#FFFFFF

;; ---- Sprite Frame: nina_idle_right_7_F0 ----
;; Size: 16x16


NINA_IDLE_RIGHT_7_F0_LAYER0: ; Brush Color Index 0 (Actual Color: #D4524D)
    ; ZX0 compressed banked resource (32 -> 30 bytes)
    DB #A0,#07,#A1,#05,#0C,#18,#10,#61,#03,#02,#03,#07,#0F,#00,#01,#00
    DB #01,#F8,#00,#92,#C0,#40,#C0,#E0,#F0,#00,#2D,#40,#55,#56

NINA_IDLE_RIGHT_7_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    ; ZX0 compressed banked resource (32 -> 24 bytes)
    DB #89,#00,#A8,#02,#03,#01,#00,#3E,#F5,#F0,#92,#F0,#D0,#F8,#F8,#F0
    DB #80,#FF,#FD,#FE,#D5,#F3,#55,#60

NINA_IDLE_RIGHT_7_F1_LAYER0: ; Brush Color Index 0 (Actual Color: #D4524D)
    ; ZX0 compressed banked resource (32 -> 30 bytes)
    DB #A0,#07,#A1,#05,#0C,#18,#20,#61,#03,#02,#03,#07,#0F,#00,#01,#00
    DB #01,#F8,#00,#92,#C0,#40,#C0,#E0,#F0,#00,#2D,#40,#55,#56

NINA_IDLE_RIGHT_7_F1_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    ; ZX0 compressed banked resource (32 -> 24 bytes)
    DB #89,#00,#A8,#02,#03,#01,#00,#3E,#F5,#F0,#92,#F0,#D0,#D8,#F8,#F0
    DB #80,#FF,#FD,#FE,#D5,#F3,#55,#60

NINA_FALL_RIGHT_8_F0_LAYER0: ; Brush Color Index 0 (Actual Color: #D4524D)
    ; ZX0 compressed banked resource (32 -> 29 bytes)
    DB #A0,#07,#A5,#05,#0C,#18,#10,#EB,#03,#02,#07,#0F,#3F,#01,#00,#FD
    DB #F8,#89,#FE,#27,#C0,#40,#E0,#F0,#FC,#00,#55,#55,#80

NINA_FALL_RIGHT_8_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    ; ZX0 compressed banked resource (32 -> 24 bytes)
    DB #89,#00,#BF,#02,#03,#01,#F5,#FC,#A6,#01,#58,#F0,#D0,#D8,#F8,#F0
    DB #80,#00,#FF,#FE,#F3,#55,#55,#80

CAPCUADRAT1_RIGHT_9_F0_LAYER2: ; Brush Color Index 2 (Actual Color: #D4C154)
    ; ZX0 compressed banked resource (32 -> 21 bytes)
    DB #0A,#00,#07,#0C,#1C,#6A,#3E,#3A,#34,#00,#48,#E6,#0C,#F8,#F0,#24
    DB #20,#20,#D5,#55,#60

CAPCUADRAT1_RIGHT_9_F0_LAYER3: ; Brush Color Index 3 (Actual Color: #CCCCCC)
    ; ZX0 compressed banked resource (32 -> 29 bytes)
    DB #A8,#00,#03,#A2,#01,#0A,#03,#1B,#0F,#07,#8A,#03,#00,#9A,#E0,#90
    DB #D0,#A2,#F0,#00,#80,#A9,#C0,#D5,#80,#00,#C0,#55,#60

CAPCUADRAT1_RIGHT_9_F1_LAYER2: ; Brush Color Index 2 (Actual Color: #D4C154)
    ; ZX0 compressed banked resource (32 -> 21 bytes)
    DB #0A,#00,#07,#0C,#1C,#6A,#3E,#3A,#34,#00,#48,#E6,#0C,#F8,#F0,#24
    DB #20,#20,#D5,#55,#60

CAPCUADRAT1_RIGHT_9_F1_LAYER3: ; Brush Color Index 3 (Actual Color: #CCCCCC)
    ; ZX0 compressed banked resource (32 -> 28 bytes)
    DB #A8,#00,#03,#A2,#01,#0A,#03,#1B,#0F,#07,#0A,#0E,#1C,#0E,#00,#6A
    DB #E0,#90,#D0,#F0,#88,#00,#80,#A7,#00,#55,#55,#80

ANEC_LEFT_10_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#03,#0D,#0B,#1A,#3B,#EF,#07,#02,#00,#07,#1F,#1F,#0F,#10,#28
    DB #00,#00,#80,#80,#C0,#40,#C0,#80,#00,#00,#00,#90,#70,#E0,#20,#50


ANEC_LEFT_10_F0_LAYER2: ; Brush Color Index 2 (Actual Color: #42EBF5)
    ; ZX0 compressed banked resource (32 -> 29 bytes)
    DB #89,#00,#E8,#04,#05,#04,#F4,#6E,#07,#18,#20,#20,#10,#FD,#9A,#00
    DB #80,#93,#02,#06,#0C,#98,#68,#88,#B5,#E5,#20,#55,#58

ANEC_LEFT_10_F1_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#03,#0D,#09,#1A,#3B,#EF,#07,#02,#00,#07,#1E,#1F,#0F,#02,#05
    DB #00,#00,#80,#80,#C0,#40,#C0,#80,#00,#04,#08,#90,#70,#C0,#00,#00


ANEC_LEFT_10_F1_LAYER2: ; Brush Color Index 2 (Actual Color: #42EBF5)
    ; ZX0 compressed banked resource (32 -> 29 bytes)
    DB #89,#00,#E8,#04,#05,#04,#F4,#6B,#07,#18,#21,#20,#10,#02,#BA,#EC
    DB #FB,#80,#24,#F5,#07,#0B,#94,#68,#80,#20,#F1,#55,#58

NINA_WALK_LEFT_11_F0_LAYER0: ; Brush Color Index 0 (Actual Color: #D4524D)
    ; ZX0 compressed banked resource (32 -> 28 bytes)
    DB #21,#1F,#00,#9A,#03,#16,#03,#E9,#07,#EE,#22,#02,#E0,#E0,#AC,#3A
    DB #01,#69,#C0,#40,#C0,#F5,#F0,#00,#80,#FD,#55,#58

NINA_WALK_LEFT_11_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    ; ZX0 compressed banked resource (32 -> 25 bytes)
    DB #12,#00,#0F,#0B,#1B,#1F,#0F,#01,#00,#29,#00,#1F,#EF,#9B,#FF,#40
    DB #C0,#80,#8F,#E6,#F5,#D5,#FD,#55,#60

NINA_WALK_LEFT_11_F1_LAYER0: ; Brush Color Index 0 (Actual Color: #D4524D)
    ; ZX0 compressed banked resource (32 -> 30 bytes)
    DB #61,#03,#1F,#00,#91,#E9,#03,#16,#03,#07,#05,#08,#00,#28,#C0,#E0
    DB #E1,#95,#2A,#DE,#6D,#C0,#40,#E0,#F0,#D4,#00,#04,#55,#56

NINA_WALK_LEFT_11_F1_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    ; ZX0 compressed banked resource (32 -> 30 bytes)
    DB #A0,#00,#68,#0F,#0B,#1B,#1F,#0F,#01,#00,#29,#00,#66,#0A,#00,#08
    DB #10,#00,#6F,#40,#C0,#80,#F0,#8F,#28,#04,#F9,#55,#55,#80

NINA_JUMP_LEFT_12_F0_LAYER0: ; Brush Color Index 0 (Actual Color: #D4524D)
    ; ZX0 compressed banked resource (32 -> 27 bytes)
    DB #21,#1F,#00,#82,#03,#02,#03,#07,#08,#A5,#00,#E0,#EE,#90,#28,#04
    DB #08,#04,#C0,#40,#EF,#60,#FC,#B5,#00,#55,#58

NINA_JUMP_LEFT_12_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    ; ZX0 compressed banked resource (32 -> 24 bytes)
    DB #12,#00,#0F,#0B,#1B,#1F,#0F,#01,#00,#01,#00,#1F,#F2,#82,#40,#C0
    DB #80,#80,#3A,#FD,#80,#0D,#55,#56

NINA_LAND_LEFT_13_F0_LAYER0: ; Brush Color Index 0 (Actual Color: #D4524D)
    ; ZX0 compressed banked resource (32 -> 29 bytes)
    DB #A2,#00,#1F,#00,#19,#26,#03,#02,#07,#0F,#3F,#00,#A0,#E0,#A5,#A0
    DB #30,#18,#08,#D5,#C0,#40,#E0,#F0,#FC,#00,#80,#55,#60

NINA_LAND_LEFT_13_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    ; ZX0 compressed banked resource (32 -> 24 bytes)
    DB #89,#00,#7F,#0F,#0B,#1B,#1F,#0F,#01,#00,#FD,#FF,#BE,#F6,#FE,#6E
    DB #40,#C0,#80,#EE,#3D,#F5,#55,#56

NINA_LAND_LEFT_13_F1_LAYER0: ; Brush Color Index 0 (Actual Color: #D4524D)
    ; ZX0 compressed banked resource (32 -> 28 bytes)
    DB #88,#00,#86,#1F,#00,#49,#03,#02,#07,#0F,#1F,#00,#A8,#E0,#29,#A0
    DB #30,#18,#08,#35,#C0,#40,#E0,#F0,#F8,#80,#55,#58

NINA_LAND_LEFT_13_F1_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    ; ZX0 compressed banked resource (32 -> 28 bytes)
    DB #99,#00,#18,#0F,#0B,#1B,#1F,#0F,#01,#00,#01,#00,#80,#40,#81,#00
    DB #66,#40,#C0,#80,#E9,#F2,#D5,#02,#05,#02,#55,#60

NINA_LAND_LEFT_13_F2_LAYER0: ; Brush Color Index 0 (Actual Color: #D4524D)
    ; ZX0 compressed banked resource (32 -> 29 bytes)
    DB #61,#00,#1F,#00,#82,#03,#02,#03,#07,#BA,#04,#EC,#12,#E0,#E0,#A0
    DB #30,#18,#08,#08,#C0,#40,#C0,#63,#00,#80,#55,#55,#80

NINA_LAND_LEFT_13_F2_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    ; ZX0 compressed banked resource (32 -> 27 bytes)
    DB #A5,#00,#E7,#0F,#0B,#1B,#1F,#0F,#01,#00,#FD,#00,#80,#20,#F9,#F4
    DB #FF,#BF,#40,#C0,#80,#F0,#AD,#E5,#84,#55,#56

NINA_DEAD_LEFT_14_F0_LAYER0: ; Brush Color Index 0 (Actual Color: #D4524D)
    DB #5F,#4F,#4B,#5B,#5F,#4F,#61,#3B,#0B,#1B,#13,#17,#10,#1E,#08,#0B
    DB #E8,#EC,#A6,#72,#DA,#8A,#8A,#C2,#5E,#CC,#E4,#F4,#84,#BC,#A0,#A0


NINA_DEAD_LEFT_14_F0_LAYER2: ; Brush Color Index 2 (Actual Color: #000000)
    DB #20,#30,#34,#24,#20,#30,#1E,#04,#04,#04,#0C,#08,#0F,#01,#07,#04
    DB #10,#10,#58,#8C,#24,#74,#74,#3C,#A0,#30,#18,#08,#78,#40,#40,#40

;; ---- End of Frame: nina_dead_left_14_F0 ----

;; ---- Sprite Frame: nina_dead_left_14_F1 ----
;; Size: 16x16


NINA_DEAD_LEFT_14_F1_LAYER0: ; Brush Color Index 0 (Actual Color: #D4524D)
    ; ZX0 compressed banked resource (32 -> 25 bytes)
    DB #86,#40,#18,#60,#38,#08,#18,#10,#88,#1E,#08,#98,#0C,#06,#02,#26
    DB #1E,#0C,#04,#22,#3C,#20,#D5,#55,#60

NINA_DEAD_LEFT_14_F1_LAYER2: ; Brush Color Index 2 (Actual Color: #000000)
    DB #20,#30,#34,#24,#20,#30,#1E,#04,#04,#04,#0C,#08,#0F,#01,#07,#04
    DB #10,#10,#58,#8C,#24,#74,#74,#3C,#A0,#30,#18,#00,#78,#40,#40,#40

;; ---- End of Frame: nina_dead_left_14_F1 ----


; Sprite Asset 15: nina_idle_left
;; Sprite: nina_idle_left
;; Total Frames: 2
;; Size: 16x16
;; Background Color (not exported as a layer): rgba(0,0,0,0)
;; Drawable Palette (Hex): C0=#D4524D, C1=#FFFFFF, C2=#000000, C3=#3EB847

SPRITE_NINA_IDLE_LEFT_15_WIDTH     EQU 16
SPRITE_NINA_IDLE_LEFT_15_HEIGHT    EQU 16
SPRITE_NINA_IDLE_LEFT_15_FRAMES    EQU 2

;; MSX1 HW Layer Order (front to back): C0=#D4524D, C1=#FFFFFF

;; ---- Sprite Frame: nina_idle_left_15_F0 ----
;; Size: 16x16


NINA_IDLE_LEFT_15_F0_LAYER0: ; Brush Color Index 0 (Actual Color: #D4524D)
    ; ZX0 compressed banked resource (32 -> 30 bytes)
    DB #21,#1F,#00,#92,#03,#02,#03,#07,#0F,#00,#22,#02,#E0,#82,#A0,#30
    DB #18,#08,#97,#C0,#40,#C0,#E0,#F0,#00,#80,#D5,#FD,#55,#60

NINA_IDLE_LEFT_15_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    ; ZX0 compressed banked resource (32 -> 24 bytes)
    DB #0A,#00,#0F,#0B,#1F,#7F,#0F,#01,#00,#FD,#FE,#E2,#F2,#09,#40,#C0
    DB #80,#80,#E9,#FD,#80,#D5,#55,#60

NINA_IDLE_LEFT_15_F1_LAYER0: ; Brush Color Index 0 (Actual Color: #D4524D)
    ; ZX0 compressed banked resource (32 -> 30 bytes)
    DB #21,#1F,#00,#92,#03,#02,#03,#07,#0F,#00,#22,#02,#E0,#82,#A0,#30
    DB #18,#04,#97,#C0,#40,#C0,#E0,#F0,#00,#80,#D5,#FD,#55,#60

NINA_IDLE_LEFT_15_F1_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    ; ZX0 compressed banked resource (32 -> 24 bytes)
    DB #12,#00,#0F,#0B,#1B,#1F,#0F,#01,#00,#01,#00,#1F,#F2,#82,#40,#C0
    DB #80,#80,#7A,#FD,#80,#75,#55,#58

NINA_FALL_LEFT_16_F0_LAYER0: ; Brush Color Index 0 (Actual Color: #D4524D)
    ; ZX0 compressed banked resource (32 -> 29 bytes)
    DB #21,#1F,#00,#92,#03,#02,#07,#0F,#3F,#00,#6A,#E0,#0A,#A0,#30,#18
    DB #08,#5F,#C0,#40,#E0,#F0,#FC,#80,#00,#FD,#55,#55,#80

NINA_FALL_LEFT_16_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    ; ZX0 compressed banked resource (32 -> 24 bytes)
    DB #12,#00,#0F,#0B,#1B,#1F,#0F,#01,#00,#01,#00,#1F,#F2,#82,#40,#C0
    DB #80,#80,#3E,#FC,#8D,#80,#55,#56

CAPCUADRAT1_LEFT_17_F0_LAYER2: ; Brush Color Index 2 (Actual Color: #D4C154)
    ; ZX0 compressed banked resource (32 -> 20 bytes)
    DB #61,#30,#1F,#00,#AA,#04,#00,#49,#A6,#E0,#30,#38,#7C,#5C,#2C,#F3
    DB #E2,#55,#55,#80

CAPCUADRAT1_LEFT_17_F0_LAYER3: ; Brush Color Index 3 (Actual Color: #CCCCCC)
    ; ZX0 compressed banked resource (32 -> 29 bytes)
    DB #A6,#00,#07,#09,#0B,#A8,#0F,#AA,#00,#01,#03,#0A,#01,#00,#03,#00
    DB #8A,#C0,#80,#20,#BB,#C0,#D8,#F0,#E0,#EA,#55,#55,#80

CAPCUADRAT1_LEFT_17_F1_LAYER2: ; Brush Color Index 2 (Actual Color: #D4C154)
    ; ZX0 compressed banked resource (32 -> 20 bytes)
    DB #61,#30,#1F,#00,#AA,#04,#00,#49,#A6,#E0,#30,#38,#7C,#5C,#2C,#F3
    DB #E2,#55,#55,#80

CAPCUADRAT1_LEFT_17_F1_LAYER3: ; Brush Color Index 3 (Actual Color: #CCCCCC)
    ; ZX0 compressed banked resource (32 -> 26 bytes)
    DB #A6,#00,#07,#09,#0B,#A8,#0F,#8A,#00,#01,#00,#1A,#C0,#28,#80,#82
    DB #C0,#D8,#F0,#E0,#9D,#70,#38,#70,#55,#56

SPRITE_PLACEHOLDER_PATTERN:
    ; ZX0 compressed banked resource (32 -> 5 bytes)
    DB #95,#FF,#75,#55,#58

    ds #26000 - $, #FF

    end                 ; End of assembly
