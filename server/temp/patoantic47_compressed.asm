; ==================================================================
; PATOANTIC47 - MEGAROM UNIFIED FILE
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
; Tiles: 6
; Sprites: 7
; Screens: 4
; Entities: 3
; Menus: Yes
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
; Bank 1 [#6000-#8000]: components (48261/8192 bytes est.)
; Bank 2 [#8000-#A000]: statemachine (13778/8192 bytes est.)
; Bank 3 [#A000-#C000]: gameflow (19149/8192 bytes est.)
; Bank 4 [#6000-#8000]: screens_code (12301/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 5 [#6000-#8000]: entities (7897/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 6 [#6000-#8000]: bosses (5666/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 7 [#6000-#8000]: sprites (5536/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 8 [#6000-#8000]: sound (4418/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 9 [#6000-#8000]: worlds (3931/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 10 [#6000-#8000]: font (3576/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 11 [#6000-#8000]: hud (3538/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 12 [#6000-#8000]: animtiles (3477/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 13 [#6000-#8000]: scroll (2353/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 14 [#6000-#8000]: patterns_code (894/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 15 [#6000-#8000]: colors_code (846/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 16 [#6000-#8000]: menus (444/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 4+ (data) [#C000+]: DATA mapped through the configured data window
; ------------------------------------------------------------------
; Far code banks: bank4(screens_code) bank5(entities) bank6(bosses) bank7(sprites) bank8(sound) bank9(worlds) bank10(font) bank11(hud) bank12(animtiles) bank13(scroll) bank14(patterns_code) bank15(colors_code) bank16(menus)
; ------------------------------------------------------------------
; 8KB BANK PACKER ESTIMATE (diagnostic placement view)
; Runtime bank constants are derived from label addresses at assemble time.
; Estimated payload bytes: 136228
; Estimated banks used: 17
; ------------------------------------------------------------------
; BANK 00 @#0000 : page0.asm (96 bytes)
; BANK 00 @#0060 : patterns.asm (894 bytes)
; BANK 00 @#03DE : colors.asm (846 bytes)
; BANK 00 @#072C : components.asm part 1/6 (6356 bytes)
; BANK 01 @#0000 : components.asm part 2/6 (8192 bytes)
; BANK 02 @#0000 : components.asm part 3/6 (8192 bytes)
; BANK 03 @#0000 : components.asm part 4/6 (8192 bytes)
; BANK 04 @#0000 : components.asm part 5/6 (8192 bytes)
; BANK 05 @#0000 : components.asm part 6/6 (8192 bytes)
; BANK 06 @#0000 : components.asm part 7/6 (971 bytes)
; BANK 06 @#03CB : entities.asm (7221 bytes)
; BANK 07 @#0000 : entities.asm (676 bytes)
; BANK 07 @#02A4 : worlds.asm (3931 bytes)
; BANK 07 @#11FF : screens.asm part 1/2 (3585 bytes)
; BANK 08 @#0000 : screens.asm part 2/2 (8192 bytes)
; BANK 09 @#0000 : screens.asm part 3/2 (525 bytes)
; BANK 09 @#020D : sprites.asm (5536 bytes)
; BANK 09 @#17AD : font.asm (2131 bytes)
; BANK 10 @#0000 : font.asm (1445 bytes)
; BANK 10 @#05A5 : hud.asm (3538 bytes)
; BANK 10 @#1377 : menus.asm (444 bytes)
; BANK 10 @#1533 : sound.asm (2765 bytes)
; BANK 11 @#0000 : sound.asm (1653 bytes)
; BANK 11 @#0675 : scroll.asm (2353 bytes)
; BANK 11 @#0FA6 : animtiles.asm (3477 bytes)
; BANK 11 @#1D3B : bosses.asm (709 bytes)
; BANK 12 @#0000 : bosses.asm (4957 bytes)
; BANK 12 @#135D : statemachine.asm part 1/2 (3235 bytes)
; BANK 13 @#0000 : statemachine.asm part 2/2 (8192 bytes)
; BANK 14 @#0000 : statemachine.asm part 3/2 (2388 bytes)
; BANK 14 @#0954 : gameflow.asm part 1/3 (5804 bytes)
; BANK 15 @#0000 : gameflow.asm part 2/3 (8192 bytes)
; BANK 16 @#0000 : gameflow.asm part 3/3 (5156 bytes); ==================================================================

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
; RESOURCE_ID_BOLA_DEAD_3_F0_LAYER1        EQU 8
; RESOURCE_ID_BOLA_DEAD_3_F1_LAYER1        EQU 9
; RESOURCE_ID_BOLA_DEAD_3_F2_LAYER1        EQU 10
; RESOURCE_ID_BOLA_DEAD_3_F3_LAYER1        EQU 11
; RESOURCE_ID_BOLA_DEAD_3_F4_LAYER1        EQU 12
; RESOURCE_ID_NINA_WALK_LEFT_4_F0_LAYER0   EQU 13
; RESOURCE_ID_NINA_WALK_LEFT_4_F0_LAYER1   EQU 14
; RESOURCE_ID_NINA_WALK_LEFT_4_F1_LAYER0   EQU 15
; RESOURCE_ID_NINA_WALK_LEFT_4_F1_LAYER1   EQU 16
; RESOURCE_ID_NINA_IDLE_LEFT_5_F0_LAYER1   EQU 17
; RESOURCE_ID_NINA_IDLE_LEFT_5_F0_LAYER2   EQU 18
; RESOURCE_ID_NINA_JUMP_LEFT_6_F0_LAYER0   EQU 19
; RESOURCE_ID_NINA_JUMP_LEFT_6_F0_LAYER1   EQU 20
; RESOURCE_ID_ANEC_LEFT_7_F0_LAYER1        EQU 21
; RESOURCE_ID_ANEC_LEFT_7_F0_LAYER2        EQU 22
; RESOURCE_ID_ANEC_LEFT_7_F1_LAYER1        EQU 23
; RESOURCE_ID_ANEC_LEFT_7_F1_LAYER2        EQU 24
; RESOURCE_ID_NINA_WALK_RIGHT_8_F0_LAYER0  EQU 25
; RESOURCE_ID_NINA_WALK_RIGHT_8_F0_LAYER1  EQU 26
; RESOURCE_ID_NINA_WALK_RIGHT_8_F1_LAYER0  EQU 27
; RESOURCE_ID_NINA_WALK_RIGHT_8_F1_LAYER1  EQU 28
; RESOURCE_ID_NINA_IDLE_RIGHT_9_F0_LAYER1  EQU 29
; RESOURCE_ID_NINA_IDLE_RIGHT_9_F0_LAYER2  EQU 30
; RESOURCE_ID_NINA_JUMP_RIGHT_10_F0_LAYER0 EQU 31
; RESOURCE_ID_NINA_JUMP_RIGHT_10_F0_LAYER1 EQU 32
; RESOURCE_ID_SPRITE_PLACEHOLDER_PATTERN   EQU 33
; RESOURCE_ID_TILE_PATTERN_BANK0           EQU 34
; RESOURCE_ID_TILEBANK_PATTERN_DATA_0      EQU 35
; RESOURCE_ID_TILE_COLOR_BANK0             EQU 36
; RESOURCE_ID_TILEBANK_COLOR_DATA_0        EQU 37
; RESOURCE_ID_SCREEN_PAN1_0_LAYOUT         EQU 38
; RESOURCE_ID_SCREEN_PAN1_0_EFFECTS_LAYOUT EQU 39
; RESOURCE_ID_SCREEN_PAN1_0_EFFECT_ZONE_TABLE EQU 40
; RESOURCE_ID_SCREEN_PAN1_0_BOSS_TABLE     EQU 41
; RESOURCE_ID_BEHAVIOR_PAN1_0_DATA         EQU 42
; RESOURCE_ID_SCREEN_PAN1_0_INTERACTION_TYPE_MAP EQU 43
; RESOURCE_ID_SCREEN_PAN1_0_INTERACTION_VALUE_MAP EQU 44
; RESOURCE_ID_SCREEN_PAN1_0_INTERACTION_TARGET_MAP EQU 45
; RESOURCE_ID_SCREEN_PAN2_1_LAYOUT         EQU 46
; RESOURCE_ID_SCREEN_PAN2_1_EFFECTS_LAYOUT EQU 47
; RESOURCE_ID_SCREEN_PAN2_1_EFFECT_ZONE_TABLE EQU 48
; RESOURCE_ID_SCREEN_PAN2_1_BOSS_TABLE     EQU 49
; RESOURCE_ID_BEHAVIOR_PAN2_1_DATA         EQU 50
; RESOURCE_ID_SCREEN_PAN2_1_INTERACTION_TYPE_MAP EQU 51
; RESOURCE_ID_SCREEN_PAN2_1_INTERACTION_VALUE_MAP EQU 52
; RESOURCE_ID_SCREEN_PAN2_1_INTERACTION_TARGET_MAP EQU 53
; RESOURCE_ID_SCREEN_BACKGROUND1_2_LAYOUT  EQU 54
; RESOURCE_ID_SCREEN_BACKGROUND1_2_EFFECTS_LAYOUT EQU 55
; RESOURCE_ID_SCREEN_BACKGROUND1_2_EFFECT_ZONE_TABLE EQU 56
; RESOURCE_ID_SCREEN_BACKGROUND1_2_BOSS_TABLE EQU 57
; RESOURCE_ID_BEHAVIOR_BACKGROUND1_2_DATA  EQU 58
; RESOURCE_ID_SCREEN_BACKGROUND1_2_INTERACTION_TYPE_MAP EQU 59
; RESOURCE_ID_SCREEN_BACKGROUND1_2_INTERACTION_VALUE_MAP EQU 60
; RESOURCE_ID_SCREEN_BACKGROUND1_2_INTERACTION_TARGET_MAP EQU 61
; RESOURCE_ID_SCREEN_PAN3_3_LAYOUT         EQU 62
; RESOURCE_ID_SCREEN_PAN3_3_EFFECTS_LAYOUT EQU 63
; RESOURCE_ID_SCREEN_PAN3_3_EFFECT_ZONE_TABLE EQU 64
; RESOURCE_ID_SCREEN_PAN3_3_BOSS_TABLE     EQU 65
; RESOURCE_ID_BEHAVIOR_PAN3_3_DATA         EQU 66
; RESOURCE_ID_SCREEN_PAN3_3_INTERACTION_TYPE_MAP EQU 67
; RESOURCE_ID_SCREEN_PAN3_3_INTERACTION_VALUE_MAP EQU 68
; RESOURCE_ID_SCREEN_PAN3_3_INTERACTION_TARGET_MAP EQU 69
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
; RESOURCE_TABLE_COUNT EQU 70
;
; resource_table:
;     ; ANEC_RIGHT_0_F0_LAYER1
;     db 17
;     dw #A1BB
;     dw 32
;     dw 32
;     db 0
;     ; ANEC_RIGHT_0_F0_LAYER2
;     db 17
;     dw #A1DB
;     dw 29
;     dw 29
;     db 0
;     ; ANEC_RIGHT_0_F1_LAYER1
;     db 17
;     dw #A1F8
;     dw 32
;     dw 32
;     db 0
;     ; ANEC_RIGHT_0_F1_LAYER2
;     db 17
;     dw #A218
;     dw 28
;     dw 28
;     db 0
;     ; BOLA_1_F0_LAYER1
;     db 17
;     dw #A234
;     dw 25
;     dw 25
;     db 0
;     ; BOLA_1_F1_LAYER1
;     db 17
;     dw #A24D
;     dw 29
;     dw 29
;     db 0
;     ; PANELL_2_F0_LAYER1
;     db 17
;     dw #A26A
;     dw 20
;     dw 20
;     db 0
;     ; PANELL_2_F0_LAYER2
;     db 17
;     dw #A314
;     dw 14
;     dw 14
;     db 0
;     ; BOLA_DEAD_3_F0_LAYER1
;     db 17
;     dw #A322
;     dw 32
;     dw 32
;     db 0
;     ; BOLA_DEAD_3_F1_LAYER1
;     db 17
;     dw #A342
;     dw 32
;     dw 32
;     db 0
;     ; BOLA_DEAD_3_F2_LAYER1
;     db 17
;     dw #A362
;     dw 32
;     dw 32
;     db 0
;     ; BOLA_DEAD_3_F3_LAYER1
;     db 17
;     dw #A382
;     dw 28
;     dw 28
;     db 0
;     ; BOLA_DEAD_3_F4_LAYER1
;     db 17
;     dw #A39E
;     dw 5
;     dw 5
;     db 0
;     ; NINA_WALK_LEFT_4_F0_LAYER0
;     db 17
;     dw #A3A3
;     dw 28
;     dw 28
;     db 0
;     ; NINA_WALK_LEFT_4_F0_LAYER1
;     db 17
;     dw #A3BF
;     dw 25
;     dw 25
;     db 0
;     ; NINA_WALK_LEFT_4_F1_LAYER0
;     db 17
;     dw #A3D8
;     dw 30
;     dw 30
;     db 0
;     ; NINA_WALK_LEFT_4_F1_LAYER1
;     db 17
;     dw #A3F6
;     dw 30
;     dw 30
;     db 0
;     ; NINA_IDLE_LEFT_5_F0_LAYER1
;     db 17
;     dw #A414
;     dw 24
;     dw 24
;     db 0
;     ; NINA_IDLE_LEFT_5_F0_LAYER2
;     db 17
;     dw #A42C
;     dw 29
;     dw 29
;     db 0
;     ; NINA_JUMP_LEFT_6_F0_LAYER0
;     db 17
;     dw #A449
;     dw 30
;     dw 30
;     db 0
;     ; NINA_JUMP_LEFT_6_F0_LAYER1
;     db 17
;     dw #A467
;     dw 28
;     dw 28
;     db 0
;     ; ANEC_LEFT_7_F0_LAYER1
;     db 17
;     dw #A483
;     dw 32
;     dw 32
;     db 0
;     ; ANEC_LEFT_7_F0_LAYER2
;     db 17
;     dw #A4A3
;     dw 29
;     dw 29
;     db 0
;     ; ANEC_LEFT_7_F1_LAYER1
;     db 17
;     dw #A50E
;     dw 32
;     dw 32
;     db 0
;     ; ANEC_LEFT_7_F1_LAYER2
;     db 17
;     dw #A52E
;     dw 29
;     dw 29
;     db 0
;     ; NINA_WALK_RIGHT_8_F0_LAYER0
;     db 17
;     dw #A54B
;     dw 30
;     dw 30
;     db 0
;     ; NINA_WALK_RIGHT_8_F0_LAYER1
;     db 17
;     dw #A569
;     dw 25
;     dw 25
;     db 0
;     ; NINA_WALK_RIGHT_8_F1_LAYER0
;     db 17
;     dw #A582
;     dw 31
;     dw 31
;     db 0
;     ; NINA_WALK_RIGHT_8_F1_LAYER1
;     db 17
;     dw #A5A1
;     dw 27
;     dw 27
;     db 0
;     ; NINA_IDLE_RIGHT_9_F0_LAYER1
;     db 17
;     dw #A5BC
;     dw 24
;     dw 24
;     db 0
;     ; NINA_IDLE_RIGHT_9_F0_LAYER2
;     db 17
;     dw #A5D4
;     dw 30
;     dw 30
;     db 0
;     ; NINA_JUMP_RIGHT_10_F0_LAYER0
;     db 17
;     dw #A5F2
;     dw 30
;     dw 30
;     db 0
;     ; NINA_JUMP_RIGHT_10_F0_LAYER1
;     db 17
;     dw #A610
;     dw 28
;     dw 28
;     db 0
;     ; SPRITE_PLACEHOLDER_PATTERN
;     db 17
;     dw #A62C
;     dw 5
;     dw 5
;     db 0
;     ; tile_pattern_bank0
;     db 17
;     dw #A109
;     dw 62
;     dw 62
;     db 0
;     ; tilebank_pattern_data_0
;     db 17
;     dw #A147
;     dw 62
;     dw 62
;     db 0
;     ; tile_color_bank0
;     db 17
;     dw #A185
;     dw 27
;     dw 27
;     db 0
;     ; tilebank_color_data_0
;     db 17
;     dw #A1A0
;     dw 27
;     dw 27
;     db 0
;     ; SCREEN_PAN1_0_LAYOUT
;     db 17
;     dw #A000
;     dw 105
;     dw 768
;     db 1
;     ; SCREEN_PAN1_0_EFFECTS_LAYOUT
;     db 17
;     dw #A000
;     dw 6
;     dw 6
;     db 0
;     ; SCREEN_PAN1_0_EFFECT_ZONE_TABLE
;     db 17
;     dw #A631
;     dw 1
;     dw 1
;     db 0
;     ; SCREEN_PAN1_0_BOSS_TABLE
;     db 17
;     dw #A632
;     dw 1
;     dw 1
;     db 0
;     ; BEHAVIOR_PAN1_0_DATA
;     db 17
;     dw #A006
;     dw 64
;     dw 64
;     db 0
;     ; SCREEN_PAN1_0_INTERACTION_TYPE_MAP
;     db 17
;     dw #A046
;     dw 15
;     dw 15
;     db 0
;     ; SCREEN_PAN1_0_INTERACTION_VALUE_MAP
;     db 17
;     dw #A055
;     dw 62
;     dw 62
;     db 0
;     ; SCREEN_PAN1_0_INTERACTION_TARGET_MAP
;     db 17
;     dw #A093
;     dw 6
;     dw 6
;     db 0
;     ; SCREEN_PAN2_1_LAYOUT
;     db 17
;     dw #A099
;     dw 52
;     dw 52
;     db 0
;     ; SCREEN_PAN2_1_EFFECTS_LAYOUT
;     db 17
;     dw #A0CD
;     dw 6
;     dw 6
;     db 0
;     ; SCREEN_PAN2_1_EFFECT_ZONE_TABLE
;     db 17
;     dw #A633
;     dw 1
;     dw 1
;     db 0
;     ; SCREEN_PAN2_1_BOSS_TABLE
;     db 17
;     dw #A634
;     dw 1
;     dw 1
;     db 0
;     ; BEHAVIOR_PAN2_1_DATA
;     db 17
;     dw #A0D3
;     dw 40
;     dw 40
;     db 0
;     ; SCREEN_PAN2_1_INTERACTION_TYPE_MAP
;     db 17
;     dw #A0FB
;     dw 14
;     dw 14
;     db 0
;     ; SCREEN_PAN2_1_INTERACTION_VALUE_MAP
;     db 17
;     dw #A27E
;     dw 40
;     dw 40
;     db 0
;     ; SCREEN_PAN2_1_INTERACTION_TARGET_MAP
;     db 17
;     dw #A2A6
;     dw 6
;     dw 6
;     db 0
;     ; SCREEN_BACKGROUND1_2_LAYOUT
;     db 17
;     dw #A2AC
;     dw 6
;     dw 6
;     db 0
;     ; SCREEN_BACKGROUND1_2_EFFECTS_LAYOUT
;     db 17
;     dw #A2B2
;     dw 6
;     dw 6
;     db 0
;     ; SCREEN_BACKGROUND1_2_EFFECT_ZONE_TABLE
;     db 17
;     dw #A635
;     dw 1
;     dw 1
;     db 0
;     ; SCREEN_BACKGROUND1_2_BOSS_TABLE
;     db 17
;     dw #A636
;     dw 1
;     dw 1
;     db 0
;     ; BEHAVIOR_BACKGROUND1_2_DATA
;     db 17
;     dw #A2B8
;     dw 6
;     dw 6
;     db 0
;     ; SCREEN_BACKGROUND1_2_INTERACTION_TYPE_MAP
;     db 17
;     dw #A2BE
;     dw 6
;     dw 6
;     db 0
;     ; SCREEN_BACKGROUND1_2_INTERACTION_VALUE_MAP
;     db 17
;     dw #A2C4
;     dw 6
;     dw 6
;     db 0
;     ; SCREEN_BACKGROUND1_2_INTERACTION_TARGET_MAP
;     db 17
;     dw #A2CA
;     dw 6
;     dw 6
;     db 0
;     ; SCREEN_PAN3_3_LAYOUT
;     db 17
;     dw #A2D0
;     dw 62
;     dw 62
;     db 0
;     ; SCREEN_PAN3_3_EFFECTS_LAYOUT
;     db 17
;     dw #A30E
;     dw 6
;     dw 6
;     db 0
;     ; SCREEN_PAN3_3_EFFECT_ZONE_TABLE
;     db 17
;     dw #A637
;     dw 1
;     dw 1
;     db 0
;     ; SCREEN_PAN3_3_BOSS_TABLE
;     db 17
;     dw #A638
;     dw 1
;     dw 1
;     db 0
;     ; BEHAVIOR_PAN3_3_DATA
;     db 17
;     dw #A4C0
;     dw 33
;     dw 33
;     db 0
;     ; SCREEN_PAN3_3_INTERACTION_TYPE_MAP
;     db 17
;     dw #A4E1
;     dw 6
;     dw 6
;     db 0
;     ; SCREEN_PAN3_3_INTERACTION_VALUE_MAP
;     db 17
;     dw #A4E7
;     dw 33
;     dw 33
;     db 0
;     ; SCREEN_PAN3_3_INTERACTION_TARGET_MAP
;     db 17
;     dw #A508
;     dw 6
;     dw 6
;     db 0
; [[[MIDEAS_ARTIFACT:resource_table.asm:END]]]

; [[[MIDEAS_ARTIFACT:packing_manifest.txt:BEGIN]]]
; MEGAROM PACKING MANIFEST
; Zone size: 8192
; Data start address: #26000
; Total resource blocks: 70
;
; BANK 17 used 1593 / 8192
; - SCREEN_PAN1_0_EFFECTS_LAYOUT         6 stored /     6 raw bytes @ #A000 (rom #26000, offset +#0000) [SCREENS/SCREEN_EFFECTS_LAYOUT] flags=0
; - BEHAVIOR_PAN1_0_DATA                64 stored /    64 raw bytes @ #A006 (rom #26006, offset +#0006) [SCREENS/SCREEN_BEHAVIOR_MAP] flags=0
; - SCREEN_PAN1_0_INTERACTION_TYPE_MAP    15 stored /    15 raw bytes @ #A046 (rom #26046, offset +#0046) [SCREENS/SCREEN_DATA] flags=0
; - SCREEN_PAN1_0_INTERACTION_VALUE_MAP    62 stored /    62 raw bytes @ #A055 (rom #26055, offset +#0055) [SCREENS/SCREEN_DATA] flags=0
; - SCREEN_PAN1_0_INTERACTION_TARGET_MAP     6 stored /     6 raw bytes @ #A093 (rom #26093, offset +#0093) [SCREENS/SCREEN_DATA] flags=0
; - SCREEN_PAN2_1_LAYOUT                52 stored /    52 raw bytes @ #A099 (rom #26099, offset +#0099) [SCREENS/SCREEN_LAYOUT] flags=0
; - SCREEN_PAN2_1_EFFECTS_LAYOUT         6 stored /     6 raw bytes @ #A0CD (rom #260CD, offset +#00CD) [SCREENS/SCREEN_EFFECTS_LAYOUT] flags=0
; - BEHAVIOR_PAN2_1_DATA                40 stored /    40 raw bytes @ #A0D3 (rom #260D3, offset +#00D3) [SCREENS/SCREEN_BEHAVIOR_MAP] flags=0
; - SCREEN_PAN2_1_INTERACTION_TYPE_MAP    14 stored /    14 raw bytes @ #A0FB (rom #260FB, offset +#00FB) [SCREENS/SCREEN_DATA] flags=0
; - tile_pattern_bank0                  62 stored /    62 raw bytes @ #A109 (rom #26109, offset +#0109) [PATTERNS/TILE_PATTERNS] flags=0
; - tilebank_pattern_data_0             62 stored /    62 raw bytes @ #A147 (rom #26147, offset +#0147) [PATTERNS/TILE_PATTERNS] flags=0
; - tile_color_bank0                    27 stored /    27 raw bytes @ #A185 (rom #26185, offset +#0185) [COLORS/TILE_COLORS] flags=0
; - tilebank_color_data_0               27 stored /    27 raw bytes @ #A1A0 (rom #261A0, offset +#01A0) [COLORS/TILE_COLORS] flags=0
; - ANEC_RIGHT_0_F0_LAYER1              32 stored /    32 raw bytes @ #A1BB (rom #261BB, offset +#01BB) [SPRITES/SPRITE_PATTERNS] flags=0
; - ANEC_RIGHT_0_F0_LAYER2              29 stored /    29 raw bytes @ #A1DB (rom #261DB, offset +#01DB) [SPRITES/SPRITE_PATTERNS] flags=0
; - ANEC_RIGHT_0_F1_LAYER1              32 stored /    32 raw bytes @ #A1F8 (rom #261F8, offset +#01F8) [SPRITES/SPRITE_PATTERNS] flags=0
; - ANEC_RIGHT_0_F1_LAYER2              28 stored /    28 raw bytes @ #A218 (rom #26218, offset +#0218) [SPRITES/SPRITE_PATTERNS] flags=0
; - BOLA_1_F0_LAYER1                    25 stored /    25 raw bytes @ #A234 (rom #26234, offset +#0234) [SPRITES/SPRITE_PATTERNS] flags=0
; - BOLA_1_F1_LAYER1                    29 stored /    29 raw bytes @ #A24D (rom #2624D, offset +#024D) [SPRITES/SPRITE_PATTERNS] flags=0
; - PANELL_2_F0_LAYER1                  20 stored /    20 raw bytes @ #A26A (rom #2626A, offset +#026A) [SPRITES/SPRITE_PATTERNS] flags=0
; - SCREEN_PAN2_1_INTERACTION_VALUE_MAP    40 stored /    40 raw bytes @ #A27E (rom #2627E, offset +#027E) [SCREENS/SCREEN_DATA] flags=0
; - SCREEN_PAN2_1_INTERACTION_TARGET_MAP     6 stored /     6 raw bytes @ #A2A6 (rom #262A6, offset +#02A6) [SCREENS/SCREEN_DATA] flags=0
; - SCREEN_BACKGROUND1_2_LAYOUT          6 stored /     6 raw bytes @ #A2AC (rom #262AC, offset +#02AC) [SCREENS/SCREEN_LAYOUT] flags=0
; - SCREEN_BACKGROUND1_2_EFFECTS_LAYOUT     6 stored /     6 raw bytes @ #A2B2 (rom #262B2, offset +#02B2) [SCREENS/SCREEN_EFFECTS_LAYOUT] flags=0
; - BEHAVIOR_BACKGROUND1_2_DATA          6 stored /     6 raw bytes @ #A2B8 (rom #262B8, offset +#02B8) [SCREENS/SCREEN_BEHAVIOR_MAP] flags=0
; - SCREEN_BACKGROUND1_2_INTERACTION_TYPE_MAP     6 stored /     6 raw bytes @ #A2BE (rom #262BE, offset +#02BE) [SCREENS/SCREEN_DATA] flags=0
; - SCREEN_BACKGROUND1_2_INTERACTION_VALUE_MAP     6 stored /     6 raw bytes @ #A2C4 (rom #262C4, offset +#02C4) [SCREENS/SCREEN_DATA] flags=0
; - SCREEN_BACKGROUND1_2_INTERACTION_TARGET_MAP     6 stored /     6 raw bytes @ #A2CA (rom #262CA, offset +#02CA) [SCREENS/SCREEN_DATA] flags=0
; - SCREEN_PAN3_3_LAYOUT                62 stored /    62 raw bytes @ #A2D0 (rom #262D0, offset +#02D0) [SCREENS/SCREEN_LAYOUT] flags=0
; - SCREEN_PAN3_3_EFFECTS_LAYOUT         6 stored /     6 raw bytes @ #A30E (rom #2630E, offset +#030E) [SCREENS/SCREEN_EFFECTS_LAYOUT] flags=0
; - PANELL_2_F0_LAYER2                  14 stored /    14 raw bytes @ #A314 (rom #26314, offset +#0314) [SPRITES/SPRITE_PATTERNS] flags=0
; - BOLA_DEAD_3_F0_LAYER1               32 stored /    32 raw bytes @ #A322 (rom #26322, offset +#0322) [SPRITES/SPRITE_PATTERNS] flags=0
; - BOLA_DEAD_3_F1_LAYER1               32 stored /    32 raw bytes @ #A342 (rom #26342, offset +#0342) [SPRITES/SPRITE_PATTERNS] flags=0
; - BOLA_DEAD_3_F2_LAYER1               32 stored /    32 raw bytes @ #A362 (rom #26362, offset +#0362) [SPRITES/SPRITE_PATTERNS] flags=0
; - BOLA_DEAD_3_F3_LAYER1               28 stored /    28 raw bytes @ #A382 (rom #26382, offset +#0382) [SPRITES/SPRITE_PATTERNS] flags=0
; - BOLA_DEAD_3_F4_LAYER1                5 stored /     5 raw bytes @ #A39E (rom #2639E, offset +#039E) [SPRITES/SPRITE_PATTERNS] flags=0
; - NINA_WALK_LEFT_4_F0_LAYER0          28 stored /    28 raw bytes @ #A3A3 (rom #263A3, offset +#03A3) [SPRITES/SPRITE_PATTERNS] flags=0
; - NINA_WALK_LEFT_4_F0_LAYER1          25 stored /    25 raw bytes @ #A3BF (rom #263BF, offset +#03BF) [SPRITES/SPRITE_PATTERNS] flags=0
; - NINA_WALK_LEFT_4_F1_LAYER0          30 stored /    30 raw bytes @ #A3D8 (rom #263D8, offset +#03D8) [SPRITES/SPRITE_PATTERNS] flags=0
; - NINA_WALK_LEFT_4_F1_LAYER1          30 stored /    30 raw bytes @ #A3F6 (rom #263F6, offset +#03F6) [SPRITES/SPRITE_PATTERNS] flags=0
; - NINA_IDLE_LEFT_5_F0_LAYER1          24 stored /    24 raw bytes @ #A414 (rom #26414, offset +#0414) [SPRITES/SPRITE_PATTERNS] flags=0
; - NINA_IDLE_LEFT_5_F0_LAYER2          29 stored /    29 raw bytes @ #A42C (rom #2642C, offset +#042C) [SPRITES/SPRITE_PATTERNS] flags=0
; - NINA_JUMP_LEFT_6_F0_LAYER0          30 stored /    30 raw bytes @ #A449 (rom #26449, offset +#0449) [SPRITES/SPRITE_PATTERNS] flags=0
; - NINA_JUMP_LEFT_6_F0_LAYER1          28 stored /    28 raw bytes @ #A467 (rom #26467, offset +#0467) [SPRITES/SPRITE_PATTERNS] flags=0
; - ANEC_LEFT_7_F0_LAYER1               32 stored /    32 raw bytes @ #A483 (rom #26483, offset +#0483) [SPRITES/SPRITE_PATTERNS] flags=0
; - ANEC_LEFT_7_F0_LAYER2               29 stored /    29 raw bytes @ #A4A3 (rom #264A3, offset +#04A3) [SPRITES/SPRITE_PATTERNS] flags=0
; - BEHAVIOR_PAN3_3_DATA                33 stored /    33 raw bytes @ #A4C0 (rom #264C0, offset +#04C0) [SCREENS/SCREEN_BEHAVIOR_MAP] flags=0
; - SCREEN_PAN3_3_INTERACTION_TYPE_MAP     6 stored /     6 raw bytes @ #A4E1 (rom #264E1, offset +#04E1) [SCREENS/SCREEN_DATA] flags=0
; - SCREEN_PAN3_3_INTERACTION_VALUE_MAP    33 stored /    33 raw bytes @ #A4E7 (rom #264E7, offset +#04E7) [SCREENS/SCREEN_DATA] flags=0
; - SCREEN_PAN3_3_INTERACTION_TARGET_MAP     6 stored /     6 raw bytes @ #A508 (rom #26508, offset +#0508) [SCREENS/SCREEN_DATA] flags=0
; - ANEC_LEFT_7_F1_LAYER1               32 stored /    32 raw bytes @ #A50E (rom #2650E, offset +#050E) [SPRITES/SPRITE_PATTERNS] flags=0
; - ANEC_LEFT_7_F1_LAYER2               29 stored /    29 raw bytes @ #A52E (rom #2652E, offset +#052E) [SPRITES/SPRITE_PATTERNS] flags=0
; - NINA_WALK_RIGHT_8_F0_LAYER0         30 stored /    30 raw bytes @ #A54B (rom #2654B, offset +#054B) [SPRITES/SPRITE_PATTERNS] flags=0
; - NINA_WALK_RIGHT_8_F0_LAYER1         25 stored /    25 raw bytes @ #A569 (rom #26569, offset +#0569) [SPRITES/SPRITE_PATTERNS] flags=0
; - NINA_WALK_RIGHT_8_F1_LAYER0         31 stored /    31 raw bytes @ #A582 (rom #26582, offset +#0582) [SPRITES/SPRITE_PATTERNS] flags=0
; - NINA_WALK_RIGHT_8_F1_LAYER1         27 stored /    27 raw bytes @ #A5A1 (rom #265A1, offset +#05A1) [SPRITES/SPRITE_PATTERNS] flags=0
; - NINA_IDLE_RIGHT_9_F0_LAYER1         24 stored /    24 raw bytes @ #A5BC (rom #265BC, offset +#05BC) [SPRITES/SPRITE_PATTERNS] flags=0
; - NINA_IDLE_RIGHT_9_F0_LAYER2         30 stored /    30 raw bytes @ #A5D4 (rom #265D4, offset +#05D4) [SPRITES/SPRITE_PATTERNS] flags=0
; - NINA_JUMP_RIGHT_10_F0_LAYER0        30 stored /    30 raw bytes @ #A5F2 (rom #265F2, offset +#05F2) [SPRITES/SPRITE_PATTERNS] flags=0
; - NINA_JUMP_RIGHT_10_F0_LAYER1        28 stored /    28 raw bytes @ #A610 (rom #26610, offset +#0610) [SPRITES/SPRITE_PATTERNS] flags=0
; - SPRITE_PLACEHOLDER_PATTERN           5 stored /     5 raw bytes @ #A62C (rom #2662C, offset +#062C) [SPRITES/SPRITE_PATTERNS] flags=0
; - SCREEN_PAN1_0_EFFECT_ZONE_TABLE      1 stored /     1 raw bytes @ #A631 (rom #26631, offset +#0631) [SCREENS/SCREEN_EFFECT_ZONE_TABLE] flags=0
; - SCREEN_PAN1_0_BOSS_TABLE             1 stored /     1 raw bytes @ #A632 (rom #26632, offset +#0632) [SCREENS/SCREEN_DATA] flags=0
; - SCREEN_PAN2_1_EFFECT_ZONE_TABLE      1 stored /     1 raw bytes @ #A633 (rom #26633, offset +#0633) [SCREENS/SCREEN_EFFECT_ZONE_TABLE] flags=0
; - SCREEN_PAN2_1_BOSS_TABLE             1 stored /     1 raw bytes @ #A634 (rom #26634, offset +#0634) [SCREENS/SCREEN_DATA] flags=0
; - SCREEN_BACKGROUND1_2_EFFECT_ZONE_TABLE     1 stored /     1 raw bytes @ #A635 (rom #26635, offset +#0635) [SCREENS/SCREEN_EFFECT_ZONE_TABLE] flags=0
; - SCREEN_BACKGROUND1_2_BOSS_TABLE      1 stored /     1 raw bytes @ #A636 (rom #26636, offset +#0636) [SCREENS/SCREEN_DATA] flags=0
; - SCREEN_PAN3_3_EFFECT_ZONE_TABLE      1 stored /     1 raw bytes @ #A637 (rom #26637, offset +#0637) [SCREENS/SCREEN_EFFECT_ZONE_TABLE] flags=0
; - SCREEN_PAN3_3_BOSS_TABLE             1 stored /     1 raw bytes @ #A638 (rom #26638, offset +#0638) [SCREENS/SCREEN_DATA] flags=0
; FREE 6599
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
;     "dataStartAddress": 155648,
;     "totalSourceBytes": 2361,
;     "resourceCount": 70,
;     "zoneCount": 1,
;     "overflowCount": 0,
;     "totalStoredBytes": 1698,
;     "compressedResourceCount": 1
;   },
;   "banks": [
;     {
;       "bank": 17,
;       "zoneIndex": 0,
;       "orgAddress": 155648,
;       "endAddress": 163840,
;       "usedBytes": 1593,
;       "freeBytes": 6599,
;       "resources": [
;         {
;           "id": 39,
;           "label": "SCREEN_PAN1_0_EFFECTS_LAYOUT",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN1_0_EFFECTS_LAYOUT",
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECTS_LAYOUT",
;           "bank": 17,
;           "zoneOffset": 0,
;           "physicalAddress": 155648,
;           "windowAddress": 40960,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 6,
;           "flags": 0,
;           "sourceIndex": 39
;         },
;         {
;           "id": 42,
;           "label": "BEHAVIOR_PAN1_0_DATA",
;           "resourceIdLabel": "RESOURCE_ID_BEHAVIOR_PAN1_0_DATA",
;           "group": "SCREENS",
;           "type": "SCREEN_BEHAVIOR_MAP",
;           "bank": 17,
;           "zoneOffset": 6,
;           "physicalAddress": 155654,
;           "windowAddress": 40966,
;           "size": 64,
;           "storedSize": 64,
;           "uncompressedSize": 64,
;           "flags": 0,
;           "sourceIndex": 42
;         },
;         {
;           "id": 43,
;           "label": "SCREEN_PAN1_0_INTERACTION_TYPE_MAP",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN1_0_INTERACTION_TYPE_MAP",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 17,
;           "zoneOffset": 70,
;           "physicalAddress": 155718,
;           "windowAddress": 41030,
;           "size": 15,
;           "storedSize": 15,
;           "uncompressedSize": 15,
;           "flags": 0,
;           "sourceIndex": 43
;         },
;         {
;           "id": 44,
;           "label": "SCREEN_PAN1_0_INTERACTION_VALUE_MAP",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN1_0_INTERACTION_VALUE_MAP",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 17,
;           "zoneOffset": 85,
;           "physicalAddress": 155733,
;           "windowAddress": 41045,
;           "size": 62,
;           "storedSize": 62,
;           "uncompressedSize": 62,
;           "flags": 0,
;           "sourceIndex": 44
;         },
;         {
;           "id": 45,
;           "label": "SCREEN_PAN1_0_INTERACTION_TARGET_MAP",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN1_0_INTERACTION_TARGET_MAP",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 17,
;           "zoneOffset": 147,
;           "physicalAddress": 155795,
;           "windowAddress": 41107,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 6,
;           "flags": 0,
;           "sourceIndex": 45
;         },
;         {
;           "id": 46,
;           "label": "SCREEN_PAN2_1_LAYOUT",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN2_1_LAYOUT",
;           "group": "SCREENS",
;           "type": "SCREEN_LAYOUT",
;           "bank": 17,
;           "zoneOffset": 153,
;           "physicalAddress": 155801,
;           "windowAddress": 41113,
;           "size": 52,
;           "storedSize": 52,
;           "uncompressedSize": 52,
;           "flags": 0,
;           "sourceIndex": 46
;         },
;         {
;           "id": 47,
;           "label": "SCREEN_PAN2_1_EFFECTS_LAYOUT",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN2_1_EFFECTS_LAYOUT",
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECTS_LAYOUT",
;           "bank": 17,
;           "zoneOffset": 205,
;           "physicalAddress": 155853,
;           "windowAddress": 41165,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 6,
;           "flags": 0,
;           "sourceIndex": 47
;         },
;         {
;           "id": 50,
;           "label": "BEHAVIOR_PAN2_1_DATA",
;           "resourceIdLabel": "RESOURCE_ID_BEHAVIOR_PAN2_1_DATA",
;           "group": "SCREENS",
;           "type": "SCREEN_BEHAVIOR_MAP",
;           "bank": 17,
;           "zoneOffset": 211,
;           "physicalAddress": 155859,
;           "windowAddress": 41171,
;           "size": 40,
;           "storedSize": 40,
;           "uncompressedSize": 40,
;           "flags": 0,
;           "sourceIndex": 50
;         },
;         {
;           "id": 51,
;           "label": "SCREEN_PAN2_1_INTERACTION_TYPE_MAP",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN2_1_INTERACTION_TYPE_MAP",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 17,
;           "zoneOffset": 251,
;           "physicalAddress": 155899,
;           "windowAddress": 41211,
;           "size": 14,
;           "storedSize": 14,
;           "uncompressedSize": 14,
;           "flags": 0,
;           "sourceIndex": 51
;         },
;         {
;           "id": 34,
;           "label": "tile_pattern_bank0",
;           "resourceIdLabel": "RESOURCE_ID_TILE_PATTERN_BANK0",
;           "group": "PATTERNS",
;           "type": "TILE_PATTERNS",
;           "bank": 17,
;           "zoneOffset": 265,
;           "physicalAddress": 155913,
;           "windowAddress": 41225,
;           "size": 62,
;           "storedSize": 62,
;           "uncompressedSize": 62,
;           "flags": 0,
;           "sourceIndex": 34
;         },
;         {
;           "id": 35,
;           "label": "tilebank_pattern_data_0",
;           "resourceIdLabel": "RESOURCE_ID_TILEBANK_PATTERN_DATA_0",
;           "group": "PATTERNS",
;           "type": "TILE_PATTERNS",
;           "bank": 17,
;           "zoneOffset": 327,
;           "physicalAddress": 155975,
;           "windowAddress": 41287,
;           "size": 62,
;           "storedSize": 62,
;           "uncompressedSize": 62,
;           "flags": 0,
;           "sourceIndex": 35
;         },
;         {
;           "id": 36,
;           "label": "tile_color_bank0",
;           "resourceIdLabel": "RESOURCE_ID_TILE_COLOR_BANK0",
;           "group": "COLORS",
;           "type": "TILE_COLORS",
;           "bank": 17,
;           "zoneOffset": 389,
;           "physicalAddress": 156037,
;           "windowAddress": 41349,
;           "size": 27,
;           "storedSize": 27,
;           "uncompressedSize": 27,
;           "flags": 0,
;           "sourceIndex": 36
;         },
;         {
;           "id": 37,
;           "label": "tilebank_color_data_0",
;           "resourceIdLabel": "RESOURCE_ID_TILEBANK_COLOR_DATA_0",
;           "group": "COLORS",
;           "type": "TILE_COLORS",
;           "bank": 17,
;           "zoneOffset": 416,
;           "physicalAddress": 156064,
;           "windowAddress": 41376,
;           "size": 27,
;           "storedSize": 27,
;           "uncompressedSize": 27,
;           "flags": 0,
;           "sourceIndex": 37
;         },
;         {
;           "id": 0,
;           "label": "ANEC_RIGHT_0_F0_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_ANEC_RIGHT_0_F0_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 17,
;           "zoneOffset": 443,
;           "physicalAddress": 156091,
;           "windowAddress": 41403,
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
;           "bank": 17,
;           "zoneOffset": 475,
;           "physicalAddress": 156123,
;           "windowAddress": 41435,
;           "size": 29,
;           "storedSize": 29,
;           "uncompressedSize": 29,
;           "flags": 0,
;           "sourceIndex": 1
;         },
;         {
;           "id": 2,
;           "label": "ANEC_RIGHT_0_F1_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_ANEC_RIGHT_0_F1_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 17,
;           "zoneOffset": 504,
;           "physicalAddress": 156152,
;           "windowAddress": 41464,
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
;           "bank": 17,
;           "zoneOffset": 536,
;           "physicalAddress": 156184,
;           "windowAddress": 41496,
;           "size": 28,
;           "storedSize": 28,
;           "uncompressedSize": 28,
;           "flags": 0,
;           "sourceIndex": 3
;         },
;         {
;           "id": 4,
;           "label": "BOLA_1_F0_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_BOLA_1_F0_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 17,
;           "zoneOffset": 564,
;           "physicalAddress": 156212,
;           "windowAddress": 41524,
;           "size": 25,
;           "storedSize": 25,
;           "uncompressedSize": 25,
;           "flags": 0,
;           "sourceIndex": 4
;         },
;         {
;           "id": 5,
;           "label": "BOLA_1_F1_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_BOLA_1_F1_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 17,
;           "zoneOffset": 589,
;           "physicalAddress": 156237,
;           "windowAddress": 41549,
;           "size": 29,
;           "storedSize": 29,
;           "uncompressedSize": 29,
;           "flags": 0,
;           "sourceIndex": 5
;         },
;         {
;           "id": 6,
;           "label": "PANELL_2_F0_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_PANELL_2_F0_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 17,
;           "zoneOffset": 618,
;           "physicalAddress": 156266,
;           "windowAddress": 41578,
;           "size": 20,
;           "storedSize": 20,
;           "uncompressedSize": 20,
;           "flags": 0,
;           "sourceIndex": 6
;         },
;         {
;           "id": 52,
;           "label": "SCREEN_PAN2_1_INTERACTION_VALUE_MAP",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN2_1_INTERACTION_VALUE_MAP",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 17,
;           "zoneOffset": 638,
;           "physicalAddress": 156286,
;           "windowAddress": 41598,
;           "size": 40,
;           "storedSize": 40,
;           "uncompressedSize": 40,
;           "flags": 0,
;           "sourceIndex": 52
;         },
;         {
;           "id": 53,
;           "label": "SCREEN_PAN2_1_INTERACTION_TARGET_MAP",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN2_1_INTERACTION_TARGET_MAP",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 17,
;           "zoneOffset": 678,
;           "physicalAddress": 156326,
;           "windowAddress": 41638,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 6,
;           "flags": 0,
;           "sourceIndex": 53
;         },
;         {
;           "id": 54,
;           "label": "SCREEN_BACKGROUND1_2_LAYOUT",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_BACKGROUND1_2_LAYOUT",
;           "group": "SCREENS",
;           "type": "SCREEN_LAYOUT",
;           "bank": 17,
;           "zoneOffset": 684,
;           "physicalAddress": 156332,
;           "windowAddress": 41644,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 6,
;           "flags": 0,
;           "sourceIndex": 54
;         },
;         {
;           "id": 55,
;           "label": "SCREEN_BACKGROUND1_2_EFFECTS_LAYOUT",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_BACKGROUND1_2_EFFECTS_LAYOUT",
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECTS_LAYOUT",
;           "bank": 17,
;           "zoneOffset": 690,
;           "physicalAddress": 156338,
;           "windowAddress": 41650,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 6,
;           "flags": 0,
;           "sourceIndex": 55
;         },
;         {
;           "id": 58,
;           "label": "BEHAVIOR_BACKGROUND1_2_DATA",
;           "resourceIdLabel": "RESOURCE_ID_BEHAVIOR_BACKGROUND1_2_DATA",
;           "group": "SCREENS",
;           "type": "SCREEN_BEHAVIOR_MAP",
;           "bank": 17,
;           "zoneOffset": 696,
;           "physicalAddress": 156344,
;           "windowAddress": 41656,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 6,
;           "flags": 0,
;           "sourceIndex": 58
;         },
;         {
;           "id": 59,
;           "label": "SCREEN_BACKGROUND1_2_INTERACTION_TYPE_MAP",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_BACKGROUND1_2_INTERACTION_TYPE_MAP",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 17,
;           "zoneOffset": 702,
;           "physicalAddress": 156350,
;           "windowAddress": 41662,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 6,
;           "flags": 0,
;           "sourceIndex": 59
;         },
;         {
;           "id": 60,
;           "label": "SCREEN_BACKGROUND1_2_INTERACTION_VALUE_MAP",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_BACKGROUND1_2_INTERACTION_VALUE_MAP",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 17,
;           "zoneOffset": 708,
;           "physicalAddress": 156356,
;           "windowAddress": 41668,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 6,
;           "flags": 0,
;           "sourceIndex": 60
;         },
;         {
;           "id": 61,
;           "label": "SCREEN_BACKGROUND1_2_INTERACTION_TARGET_MAP",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_BACKGROUND1_2_INTERACTION_TARGET_MAP",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 17,
;           "zoneOffset": 714,
;           "physicalAddress": 156362,
;           "windowAddress": 41674,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 6,
;           "flags": 0,
;           "sourceIndex": 61
;         },
;         {
;           "id": 62,
;           "label": "SCREEN_PAN3_3_LAYOUT",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN3_3_LAYOUT",
;           "group": "SCREENS",
;           "type": "SCREEN_LAYOUT",
;           "bank": 17,
;           "zoneOffset": 720,
;           "physicalAddress": 156368,
;           "windowAddress": 41680,
;           "size": 62,
;           "storedSize": 62,
;           "uncompressedSize": 62,
;           "flags": 0,
;           "sourceIndex": 62
;         },
;         {
;           "id": 63,
;           "label": "SCREEN_PAN3_3_EFFECTS_LAYOUT",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN3_3_EFFECTS_LAYOUT",
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECTS_LAYOUT",
;           "bank": 17,
;           "zoneOffset": 782,
;           "physicalAddress": 156430,
;           "windowAddress": 41742,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 6,
;           "flags": 0,
;           "sourceIndex": 63
;         },
;         {
;           "id": 7,
;           "label": "PANELL_2_F0_LAYER2",
;           "resourceIdLabel": "RESOURCE_ID_PANELL_2_F0_LAYER2",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 17,
;           "zoneOffset": 788,
;           "physicalAddress": 156436,
;           "windowAddress": 41748,
;           "size": 14,
;           "storedSize": 14,
;           "uncompressedSize": 14,
;           "flags": 0,
;           "sourceIndex": 7
;         },
;         {
;           "id": 8,
;           "label": "BOLA_DEAD_3_F0_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_BOLA_DEAD_3_F0_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 17,
;           "zoneOffset": 802,
;           "physicalAddress": 156450,
;           "windowAddress": 41762,
;           "size": 32,
;           "storedSize": 32,
;           "uncompressedSize": 32,
;           "flags": 0,
;           "sourceIndex": 8
;         },
;         {
;           "id": 9,
;           "label": "BOLA_DEAD_3_F1_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_BOLA_DEAD_3_F1_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 17,
;           "zoneOffset": 834,
;           "physicalAddress": 156482,
;           "windowAddress": 41794,
;           "size": 32,
;           "storedSize": 32,
;           "uncompressedSize": 32,
;           "flags": 0,
;           "sourceIndex": 9
;         },
;         {
;           "id": 10,
;           "label": "BOLA_DEAD_3_F2_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_BOLA_DEAD_3_F2_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 17,
;           "zoneOffset": 866,
;           "physicalAddress": 156514,
;           "windowAddress": 41826,
;           "size": 32,
;           "storedSize": 32,
;           "uncompressedSize": 32,
;           "flags": 0,
;           "sourceIndex": 10
;         },
;         {
;           "id": 11,
;           "label": "BOLA_DEAD_3_F3_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_BOLA_DEAD_3_F3_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 17,
;           "zoneOffset": 898,
;           "physicalAddress": 156546,
;           "windowAddress": 41858,
;           "size": 28,
;           "storedSize": 28,
;           "uncompressedSize": 28,
;           "flags": 0,
;           "sourceIndex": 11
;         },
;         {
;           "id": 12,
;           "label": "BOLA_DEAD_3_F4_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_BOLA_DEAD_3_F4_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 17,
;           "zoneOffset": 926,
;           "physicalAddress": 156574,
;           "windowAddress": 41886,
;           "size": 5,
;           "storedSize": 5,
;           "uncompressedSize": 5,
;           "flags": 0,
;           "sourceIndex": 12
;         },
;         {
;           "id": 13,
;           "label": "NINA_WALK_LEFT_4_F0_LAYER0",
;           "resourceIdLabel": "RESOURCE_ID_NINA_WALK_LEFT_4_F0_LAYER0",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 17,
;           "zoneOffset": 931,
;           "physicalAddress": 156579,
;           "windowAddress": 41891,
;           "size": 28,
;           "storedSize": 28,
;           "uncompressedSize": 28,
;           "flags": 0,
;           "sourceIndex": 13
;         },
;         {
;           "id": 14,
;           "label": "NINA_WALK_LEFT_4_F0_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_NINA_WALK_LEFT_4_F0_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 17,
;           "zoneOffset": 959,
;           "physicalAddress": 156607,
;           "windowAddress": 41919,
;           "size": 25,
;           "storedSize": 25,
;           "uncompressedSize": 25,
;           "flags": 0,
;           "sourceIndex": 14
;         },
;         {
;           "id": 15,
;           "label": "NINA_WALK_LEFT_4_F1_LAYER0",
;           "resourceIdLabel": "RESOURCE_ID_NINA_WALK_LEFT_4_F1_LAYER0",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 17,
;           "zoneOffset": 984,
;           "physicalAddress": 156632,
;           "windowAddress": 41944,
;           "size": 30,
;           "storedSize": 30,
;           "uncompressedSize": 30,
;           "flags": 0,
;           "sourceIndex": 15
;         },
;         {
;           "id": 16,
;           "label": "NINA_WALK_LEFT_4_F1_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_NINA_WALK_LEFT_4_F1_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 17,
;           "zoneOffset": 1014,
;           "physicalAddress": 156662,
;           "windowAddress": 41974,
;           "size": 30,
;           "storedSize": 30,
;           "uncompressedSize": 30,
;           "flags": 0,
;           "sourceIndex": 16
;         },
;         {
;           "id": 17,
;           "label": "NINA_IDLE_LEFT_5_F0_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_NINA_IDLE_LEFT_5_F0_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 17,
;           "zoneOffset": 1044,
;           "physicalAddress": 156692,
;           "windowAddress": 42004,
;           "size": 24,
;           "storedSize": 24,
;           "uncompressedSize": 24,
;           "flags": 0,
;           "sourceIndex": 17
;         },
;         {
;           "id": 18,
;           "label": "NINA_IDLE_LEFT_5_F0_LAYER2",
;           "resourceIdLabel": "RESOURCE_ID_NINA_IDLE_LEFT_5_F0_LAYER2",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 17,
;           "zoneOffset": 1068,
;           "physicalAddress": 156716,
;           "windowAddress": 42028,
;           "size": 29,
;           "storedSize": 29,
;           "uncompressedSize": 29,
;           "flags": 0,
;           "sourceIndex": 18
;         },
;         {
;           "id": 19,
;           "label": "NINA_JUMP_LEFT_6_F0_LAYER0",
;           "resourceIdLabel": "RESOURCE_ID_NINA_JUMP_LEFT_6_F0_LAYER0",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 17,
;           "zoneOffset": 1097,
;           "physicalAddress": 156745,
;           "windowAddress": 42057,
;           "size": 30,
;           "storedSize": 30,
;           "uncompressedSize": 30,
;           "flags": 0,
;           "sourceIndex": 19
;         },
;         {
;           "id": 20,
;           "label": "NINA_JUMP_LEFT_6_F0_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_NINA_JUMP_LEFT_6_F0_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 17,
;           "zoneOffset": 1127,
;           "physicalAddress": 156775,
;           "windowAddress": 42087,
;           "size": 28,
;           "storedSize": 28,
;           "uncompressedSize": 28,
;           "flags": 0,
;           "sourceIndex": 20
;         },
;         {
;           "id": 21,
;           "label": "ANEC_LEFT_7_F0_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_ANEC_LEFT_7_F0_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 17,
;           "zoneOffset": 1155,
;           "physicalAddress": 156803,
;           "windowAddress": 42115,
;           "size": 32,
;           "storedSize": 32,
;           "uncompressedSize": 32,
;           "flags": 0,
;           "sourceIndex": 21
;         },
;         {
;           "id": 22,
;           "label": "ANEC_LEFT_7_F0_LAYER2",
;           "resourceIdLabel": "RESOURCE_ID_ANEC_LEFT_7_F0_LAYER2",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 17,
;           "zoneOffset": 1187,
;           "physicalAddress": 156835,
;           "windowAddress": 42147,
;           "size": 29,
;           "storedSize": 29,
;           "uncompressedSize": 29,
;           "flags": 0,
;           "sourceIndex": 22
;         },
;         {
;           "id": 66,
;           "label": "BEHAVIOR_PAN3_3_DATA",
;           "resourceIdLabel": "RESOURCE_ID_BEHAVIOR_PAN3_3_DATA",
;           "group": "SCREENS",
;           "type": "SCREEN_BEHAVIOR_MAP",
;           "bank": 17,
;           "zoneOffset": 1216,
;           "physicalAddress": 156864,
;           "windowAddress": 42176,
;           "size": 33,
;           "storedSize": 33,
;           "uncompressedSize": 33,
;           "flags": 0,
;           "sourceIndex": 66
;         },
;         {
;           "id": 67,
;           "label": "SCREEN_PAN3_3_INTERACTION_TYPE_MAP",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN3_3_INTERACTION_TYPE_MAP",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 17,
;           "zoneOffset": 1249,
;           "physicalAddress": 156897,
;           "windowAddress": 42209,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 6,
;           "flags": 0,
;           "sourceIndex": 67
;         },
;         {
;           "id": 68,
;           "label": "SCREEN_PAN3_3_INTERACTION_VALUE_MAP",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN3_3_INTERACTION_VALUE_MAP",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 17,
;           "zoneOffset": 1255,
;           "physicalAddress": 156903,
;           "windowAddress": 42215,
;           "size": 33,
;           "storedSize": 33,
;           "uncompressedSize": 33,
;           "flags": 0,
;           "sourceIndex": 68
;         },
;         {
;           "id": 69,
;           "label": "SCREEN_PAN3_3_INTERACTION_TARGET_MAP",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN3_3_INTERACTION_TARGET_MAP",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 17,
;           "zoneOffset": 1288,
;           "physicalAddress": 156936,
;           "windowAddress": 42248,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 6,
;           "flags": 0,
;           "sourceIndex": 69
;         },
;         {
;           "id": 23,
;           "label": "ANEC_LEFT_7_F1_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_ANEC_LEFT_7_F1_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 17,
;           "zoneOffset": 1294,
;           "physicalAddress": 156942,
;           "windowAddress": 42254,
;           "size": 32,
;           "storedSize": 32,
;           "uncompressedSize": 32,
;           "flags": 0,
;           "sourceIndex": 23
;         },
;         {
;           "id": 24,
;           "label": "ANEC_LEFT_7_F1_LAYER2",
;           "resourceIdLabel": "RESOURCE_ID_ANEC_LEFT_7_F1_LAYER2",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 17,
;           "zoneOffset": 1326,
;           "physicalAddress": 156974,
;           "windowAddress": 42286,
;           "size": 29,
;           "storedSize": 29,
;           "uncompressedSize": 29,
;           "flags": 0,
;           "sourceIndex": 24
;         },
;         {
;           "id": 25,
;           "label": "NINA_WALK_RIGHT_8_F0_LAYER0",
;           "resourceIdLabel": "RESOURCE_ID_NINA_WALK_RIGHT_8_F0_LAYER0",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 17,
;           "zoneOffset": 1355,
;           "physicalAddress": 157003,
;           "windowAddress": 42315,
;           "size": 30,
;           "storedSize": 30,
;           "uncompressedSize": 30,
;           "flags": 0,
;           "sourceIndex": 25
;         },
;         {
;           "id": 26,
;           "label": "NINA_WALK_RIGHT_8_F0_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_NINA_WALK_RIGHT_8_F0_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 17,
;           "zoneOffset": 1385,
;           "physicalAddress": 157033,
;           "windowAddress": 42345,
;           "size": 25,
;           "storedSize": 25,
;           "uncompressedSize": 25,
;           "flags": 0,
;           "sourceIndex": 26
;         },
;         {
;           "id": 27,
;           "label": "NINA_WALK_RIGHT_8_F1_LAYER0",
;           "resourceIdLabel": "RESOURCE_ID_NINA_WALK_RIGHT_8_F1_LAYER0",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 17,
;           "zoneOffset": 1410,
;           "physicalAddress": 157058,
;           "windowAddress": 42370,
;           "size": 31,
;           "storedSize": 31,
;           "uncompressedSize": 31,
;           "flags": 0,
;           "sourceIndex": 27
;         },
;         {
;           "id": 28,
;           "label": "NINA_WALK_RIGHT_8_F1_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_NINA_WALK_RIGHT_8_F1_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 17,
;           "zoneOffset": 1441,
;           "physicalAddress": 157089,
;           "windowAddress": 42401,
;           "size": 27,
;           "storedSize": 27,
;           "uncompressedSize": 27,
;           "flags": 0,
;           "sourceIndex": 28
;         },
;         {
;           "id": 29,
;           "label": "NINA_IDLE_RIGHT_9_F0_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_NINA_IDLE_RIGHT_9_F0_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 17,
;           "zoneOffset": 1468,
;           "physicalAddress": 157116,
;           "windowAddress": 42428,
;           "size": 24,
;           "storedSize": 24,
;           "uncompressedSize": 24,
;           "flags": 0,
;           "sourceIndex": 29
;         },
;         {
;           "id": 30,
;           "label": "NINA_IDLE_RIGHT_9_F0_LAYER2",
;           "resourceIdLabel": "RESOURCE_ID_NINA_IDLE_RIGHT_9_F0_LAYER2",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 17,
;           "zoneOffset": 1492,
;           "physicalAddress": 157140,
;           "windowAddress": 42452,
;           "size": 30,
;           "storedSize": 30,
;           "uncompressedSize": 30,
;           "flags": 0,
;           "sourceIndex": 30
;         },
;         {
;           "id": 31,
;           "label": "NINA_JUMP_RIGHT_10_F0_LAYER0",
;           "resourceIdLabel": "RESOURCE_ID_NINA_JUMP_RIGHT_10_F0_LAYER0",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 17,
;           "zoneOffset": 1522,
;           "physicalAddress": 157170,
;           "windowAddress": 42482,
;           "size": 30,
;           "storedSize": 30,
;           "uncompressedSize": 30,
;           "flags": 0,
;           "sourceIndex": 31
;         },
;         {
;           "id": 32,
;           "label": "NINA_JUMP_RIGHT_10_F0_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_NINA_JUMP_RIGHT_10_F0_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 17,
;           "zoneOffset": 1552,
;           "physicalAddress": 157200,
;           "windowAddress": 42512,
;           "size": 28,
;           "storedSize": 28,
;           "uncompressedSize": 28,
;           "flags": 0,
;           "sourceIndex": 32
;         },
;         {
;           "id": 33,
;           "label": "SPRITE_PLACEHOLDER_PATTERN",
;           "resourceIdLabel": "RESOURCE_ID_SPRITE_PLACEHOLDER_PATTERN",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 17,
;           "zoneOffset": 1580,
;           "physicalAddress": 157228,
;           "windowAddress": 42540,
;           "size": 5,
;           "storedSize": 5,
;           "uncompressedSize": 5,
;           "flags": 0,
;           "sourceIndex": 33
;         },
;         {
;           "id": 40,
;           "label": "SCREEN_PAN1_0_EFFECT_ZONE_TABLE",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN1_0_EFFECT_ZONE_TABLE",
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECT_ZONE_TABLE",
;           "bank": 17,
;           "zoneOffset": 1585,
;           "physicalAddress": 157233,
;           "windowAddress": 42545,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "sourceIndex": 40
;         },
;         {
;           "id": 41,
;           "label": "SCREEN_PAN1_0_BOSS_TABLE",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN1_0_BOSS_TABLE",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 17,
;           "zoneOffset": 1586,
;           "physicalAddress": 157234,
;           "windowAddress": 42546,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "sourceIndex": 41
;         },
;         {
;           "id": 48,
;           "label": "SCREEN_PAN2_1_EFFECT_ZONE_TABLE",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN2_1_EFFECT_ZONE_TABLE",
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECT_ZONE_TABLE",
;           "bank": 17,
;           "zoneOffset": 1587,
;           "physicalAddress": 157235,
;           "windowAddress": 42547,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "sourceIndex": 48
;         },
;         {
;           "id": 49,
;           "label": "SCREEN_PAN2_1_BOSS_TABLE",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN2_1_BOSS_TABLE",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 17,
;           "zoneOffset": 1588,
;           "physicalAddress": 157236,
;           "windowAddress": 42548,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "sourceIndex": 49
;         },
;         {
;           "id": 56,
;           "label": "SCREEN_BACKGROUND1_2_EFFECT_ZONE_TABLE",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_BACKGROUND1_2_EFFECT_ZONE_TABLE",
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECT_ZONE_TABLE",
;           "bank": 17,
;           "zoneOffset": 1589,
;           "physicalAddress": 157237,
;           "windowAddress": 42549,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "sourceIndex": 56
;         },
;         {
;           "id": 57,
;           "label": "SCREEN_BACKGROUND1_2_BOSS_TABLE",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_BACKGROUND1_2_BOSS_TABLE",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 17,
;           "zoneOffset": 1590,
;           "physicalAddress": 157238,
;           "windowAddress": 42550,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "sourceIndex": 57
;         },
;         {
;           "id": 64,
;           "label": "SCREEN_PAN3_3_EFFECT_ZONE_TABLE",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN3_3_EFFECT_ZONE_TABLE",
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECT_ZONE_TABLE",
;           "bank": 17,
;           "zoneOffset": 1591,
;           "physicalAddress": 157239,
;           "windowAddress": 42551,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "sourceIndex": 64
;         },
;         {
;           "id": 65,
;           "label": "SCREEN_PAN3_3_BOSS_TABLE",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PAN3_3_BOSS_TABLE",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 17,
;           "zoneOffset": 1592,
;           "physicalAddress": 157240,
;           "windowAddress": 42552,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "sourceIndex": 65
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
;       "bank": 17,
;       "origin": 155648,
;       "end": 163840,
;       "usedBytes": 1593,
;       "freeBytes": 6599,
;       "resources": [
;         {
;           "id": 39,
;           "label": "SCREEN_PAN1_0_EFFECTS_LAYOUT",
;           "bank": 17,
;           "offset": 0,
;           "address": 40960,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 6,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECTS_LAYOUT"
;         },
;         {
;           "id": 42,
;           "label": "BEHAVIOR_PAN1_0_DATA",
;           "bank": 17,
;           "offset": 6,
;           "address": 40966,
;           "size": 64,
;           "storedSize": 64,
;           "uncompressedSize": 64,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_BEHAVIOR_MAP"
;         },
;         {
;           "id": 43,
;           "label": "SCREEN_PAN1_0_INTERACTION_TYPE_MAP",
;           "bank": 17,
;           "offset": 70,
;           "address": 41030,
;           "size": 15,
;           "storedSize": 15,
;           "uncompressedSize": 15,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
;         },
;         {
;           "id": 44,
;           "label": "SCREEN_PAN1_0_INTERACTION_VALUE_MAP",
;           "bank": 17,
;           "offset": 85,
;           "address": 41045,
;           "size": 62,
;           "storedSize": 62,
;           "uncompressedSize": 62,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
;         },
;         {
;           "id": 45,
;           "label": "SCREEN_PAN1_0_INTERACTION_TARGET_MAP",
;           "bank": 17,
;           "offset": 147,
;           "address": 41107,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 6,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
;         },
;         {
;           "id": 46,
;           "label": "SCREEN_PAN2_1_LAYOUT",
;           "bank": 17,
;           "offset": 153,
;           "address": 41113,
;           "size": 52,
;           "storedSize": 52,
;           "uncompressedSize": 52,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_LAYOUT"
;         },
;         {
;           "id": 47,
;           "label": "SCREEN_PAN2_1_EFFECTS_LAYOUT",
;           "bank": 17,
;           "offset": 205,
;           "address": 41165,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 6,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECTS_LAYOUT"
;         },
;         {
;           "id": 50,
;           "label": "BEHAVIOR_PAN2_1_DATA",
;           "bank": 17,
;           "offset": 211,
;           "address": 41171,
;           "size": 40,
;           "storedSize": 40,
;           "uncompressedSize": 40,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_BEHAVIOR_MAP"
;         },
;         {
;           "id": 51,
;           "label": "SCREEN_PAN2_1_INTERACTION_TYPE_MAP",
;           "bank": 17,
;           "offset": 251,
;           "address": 41211,
;           "size": 14,
;           "storedSize": 14,
;           "uncompressedSize": 14,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
;         },
;         {
;           "id": 34,
;           "label": "tile_pattern_bank0",
;           "bank": 17,
;           "offset": 265,
;           "address": 41225,
;           "size": 62,
;           "storedSize": 62,
;           "uncompressedSize": 62,
;           "flags": 0,
;           "group": "PATTERNS",
;           "type": "TILE_PATTERNS"
;         },
;         {
;           "id": 35,
;           "label": "tilebank_pattern_data_0",
;           "bank": 17,
;           "offset": 327,
;           "address": 41287,
;           "size": 62,
;           "storedSize": 62,
;           "uncompressedSize": 62,
;           "flags": 0,
;           "group": "PATTERNS",
;           "type": "TILE_PATTERNS"
;         },
;         {
;           "id": 36,
;           "label": "tile_color_bank0",
;           "bank": 17,
;           "offset": 389,
;           "address": 41349,
;           "size": 27,
;           "storedSize": 27,
;           "uncompressedSize": 27,
;           "flags": 0,
;           "group": "COLORS",
;           "type": "TILE_COLORS"
;         },
;         {
;           "id": 37,
;           "label": "tilebank_color_data_0",
;           "bank": 17,
;           "offset": 416,
;           "address": 41376,
;           "size": 27,
;           "storedSize": 27,
;           "uncompressedSize": 27,
;           "flags": 0,
;           "group": "COLORS",
;           "type": "TILE_COLORS"
;         },
;         {
;           "id": 0,
;           "label": "ANEC_RIGHT_0_F0_LAYER1",
;           "bank": 17,
;           "offset": 443,
;           "address": 41403,
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
;           "bank": 17,
;           "offset": 475,
;           "address": 41435,
;           "size": 29,
;           "storedSize": 29,
;           "uncompressedSize": 29,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 2,
;           "label": "ANEC_RIGHT_0_F1_LAYER1",
;           "bank": 17,
;           "offset": 504,
;           "address": 41464,
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
;           "bank": 17,
;           "offset": 536,
;           "address": 41496,
;           "size": 28,
;           "storedSize": 28,
;           "uncompressedSize": 28,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 4,
;           "label": "BOLA_1_F0_LAYER1",
;           "bank": 17,
;           "offset": 564,
;           "address": 41524,
;           "size": 25,
;           "storedSize": 25,
;           "uncompressedSize": 25,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 5,
;           "label": "BOLA_1_F1_LAYER1",
;           "bank": 17,
;           "offset": 589,
;           "address": 41549,
;           "size": 29,
;           "storedSize": 29,
;           "uncompressedSize": 29,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 6,
;           "label": "PANELL_2_F0_LAYER1",
;           "bank": 17,
;           "offset": 618,
;           "address": 41578,
;           "size": 20,
;           "storedSize": 20,
;           "uncompressedSize": 20,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 52,
;           "label": "SCREEN_PAN2_1_INTERACTION_VALUE_MAP",
;           "bank": 17,
;           "offset": 638,
;           "address": 41598,
;           "size": 40,
;           "storedSize": 40,
;           "uncompressedSize": 40,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
;         },
;         {
;           "id": 53,
;           "label": "SCREEN_PAN2_1_INTERACTION_TARGET_MAP",
;           "bank": 17,
;           "offset": 678,
;           "address": 41638,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 6,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
;         },
;         {
;           "id": 54,
;           "label": "SCREEN_BACKGROUND1_2_LAYOUT",
;           "bank": 17,
;           "offset": 684,
;           "address": 41644,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 6,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_LAYOUT"
;         },
;         {
;           "id": 55,
;           "label": "SCREEN_BACKGROUND1_2_EFFECTS_LAYOUT",
;           "bank": 17,
;           "offset": 690,
;           "address": 41650,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 6,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECTS_LAYOUT"
;         },
;         {
;           "id": 58,
;           "label": "BEHAVIOR_BACKGROUND1_2_DATA",
;           "bank": 17,
;           "offset": 696,
;           "address": 41656,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 6,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_BEHAVIOR_MAP"
;         },
;         {
;           "id": 59,
;           "label": "SCREEN_BACKGROUND1_2_INTERACTION_TYPE_MAP",
;           "bank": 17,
;           "offset": 702,
;           "address": 41662,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 6,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
;         },
;         {
;           "id": 60,
;           "label": "SCREEN_BACKGROUND1_2_INTERACTION_VALUE_MAP",
;           "bank": 17,
;           "offset": 708,
;           "address": 41668,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 6,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
;         },
;         {
;           "id": 61,
;           "label": "SCREEN_BACKGROUND1_2_INTERACTION_TARGET_MAP",
;           "bank": 17,
;           "offset": 714,
;           "address": 41674,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 6,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
;         },
;         {
;           "id": 62,
;           "label": "SCREEN_PAN3_3_LAYOUT",
;           "bank": 17,
;           "offset": 720,
;           "address": 41680,
;           "size": 62,
;           "storedSize": 62,
;           "uncompressedSize": 62,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_LAYOUT"
;         },
;         {
;           "id": 63,
;           "label": "SCREEN_PAN3_3_EFFECTS_LAYOUT",
;           "bank": 17,
;           "offset": 782,
;           "address": 41742,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 6,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECTS_LAYOUT"
;         },
;         {
;           "id": 7,
;           "label": "PANELL_2_F0_LAYER2",
;           "bank": 17,
;           "offset": 788,
;           "address": 41748,
;           "size": 14,
;           "storedSize": 14,
;           "uncompressedSize": 14,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 8,
;           "label": "BOLA_DEAD_3_F0_LAYER1",
;           "bank": 17,
;           "offset": 802,
;           "address": 41762,
;           "size": 32,
;           "storedSize": 32,
;           "uncompressedSize": 32,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 9,
;           "label": "BOLA_DEAD_3_F1_LAYER1",
;           "bank": 17,
;           "offset": 834,
;           "address": 41794,
;           "size": 32,
;           "storedSize": 32,
;           "uncompressedSize": 32,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 10,
;           "label": "BOLA_DEAD_3_F2_LAYER1",
;           "bank": 17,
;           "offset": 866,
;           "address": 41826,
;           "size": 32,
;           "storedSize": 32,
;           "uncompressedSize": 32,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 11,
;           "label": "BOLA_DEAD_3_F3_LAYER1",
;           "bank": 17,
;           "offset": 898,
;           "address": 41858,
;           "size": 28,
;           "storedSize": 28,
;           "uncompressedSize": 28,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 12,
;           "label": "BOLA_DEAD_3_F4_LAYER1",
;           "bank": 17,
;           "offset": 926,
;           "address": 41886,
;           "size": 5,
;           "storedSize": 5,
;           "uncompressedSize": 5,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 13,
;           "label": "NINA_WALK_LEFT_4_F0_LAYER0",
;           "bank": 17,
;           "offset": 931,
;           "address": 41891,
;           "size": 28,
;           "storedSize": 28,
;           "uncompressedSize": 28,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 14,
;           "label": "NINA_WALK_LEFT_4_F0_LAYER1",
;           "bank": 17,
;           "offset": 959,
;           "address": 41919,
;           "size": 25,
;           "storedSize": 25,
;           "uncompressedSize": 25,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 15,
;           "label": "NINA_WALK_LEFT_4_F1_LAYER0",
;           "bank": 17,
;           "offset": 984,
;           "address": 41944,
;           "size": 30,
;           "storedSize": 30,
;           "uncompressedSize": 30,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 16,
;           "label": "NINA_WALK_LEFT_4_F1_LAYER1",
;           "bank": 17,
;           "offset": 1014,
;           "address": 41974,
;           "size": 30,
;           "storedSize": 30,
;           "uncompressedSize": 30,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 17,
;           "label": "NINA_IDLE_LEFT_5_F0_LAYER1",
;           "bank": 17,
;           "offset": 1044,
;           "address": 42004,
;           "size": 24,
;           "storedSize": 24,
;           "uncompressedSize": 24,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 18,
;           "label": "NINA_IDLE_LEFT_5_F0_LAYER2",
;           "bank": 17,
;           "offset": 1068,
;           "address": 42028,
;           "size": 29,
;           "storedSize": 29,
;           "uncompressedSize": 29,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 19,
;           "label": "NINA_JUMP_LEFT_6_F0_LAYER0",
;           "bank": 17,
;           "offset": 1097,
;           "address": 42057,
;           "size": 30,
;           "storedSize": 30,
;           "uncompressedSize": 30,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 20,
;           "label": "NINA_JUMP_LEFT_6_F0_LAYER1",
;           "bank": 17,
;           "offset": 1127,
;           "address": 42087,
;           "size": 28,
;           "storedSize": 28,
;           "uncompressedSize": 28,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 21,
;           "label": "ANEC_LEFT_7_F0_LAYER1",
;           "bank": 17,
;           "offset": 1155,
;           "address": 42115,
;           "size": 32,
;           "storedSize": 32,
;           "uncompressedSize": 32,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 22,
;           "label": "ANEC_LEFT_7_F0_LAYER2",
;           "bank": 17,
;           "offset": 1187,
;           "address": 42147,
;           "size": 29,
;           "storedSize": 29,
;           "uncompressedSize": 29,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 66,
;           "label": "BEHAVIOR_PAN3_3_DATA",
;           "bank": 17,
;           "offset": 1216,
;           "address": 42176,
;           "size": 33,
;           "storedSize": 33,
;           "uncompressedSize": 33,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_BEHAVIOR_MAP"
;         },
;         {
;           "id": 67,
;           "label": "SCREEN_PAN3_3_INTERACTION_TYPE_MAP",
;           "bank": 17,
;           "offset": 1249,
;           "address": 42209,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 6,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
;         },
;         {
;           "id": 68,
;           "label": "SCREEN_PAN3_3_INTERACTION_VALUE_MAP",
;           "bank": 17,
;           "offset": 1255,
;           "address": 42215,
;           "size": 33,
;           "storedSize": 33,
;           "uncompressedSize": 33,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
;         },
;         {
;           "id": 69,
;           "label": "SCREEN_PAN3_3_INTERACTION_TARGET_MAP",
;           "bank": 17,
;           "offset": 1288,
;           "address": 42248,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 6,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
;         },
;         {
;           "id": 23,
;           "label": "ANEC_LEFT_7_F1_LAYER1",
;           "bank": 17,
;           "offset": 1294,
;           "address": 42254,
;           "size": 32,
;           "storedSize": 32,
;           "uncompressedSize": 32,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 24,
;           "label": "ANEC_LEFT_7_F1_LAYER2",
;           "bank": 17,
;           "offset": 1326,
;           "address": 42286,
;           "size": 29,
;           "storedSize": 29,
;           "uncompressedSize": 29,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 25,
;           "label": "NINA_WALK_RIGHT_8_F0_LAYER0",
;           "bank": 17,
;           "offset": 1355,
;           "address": 42315,
;           "size": 30,
;           "storedSize": 30,
;           "uncompressedSize": 30,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 26,
;           "label": "NINA_WALK_RIGHT_8_F0_LAYER1",
;           "bank": 17,
;           "offset": 1385,
;           "address": 42345,
;           "size": 25,
;           "storedSize": 25,
;           "uncompressedSize": 25,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 27,
;           "label": "NINA_WALK_RIGHT_8_F1_LAYER0",
;           "bank": 17,
;           "offset": 1410,
;           "address": 42370,
;           "size": 31,
;           "storedSize": 31,
;           "uncompressedSize": 31,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 28,
;           "label": "NINA_WALK_RIGHT_8_F1_LAYER1",
;           "bank": 17,
;           "offset": 1441,
;           "address": 42401,
;           "size": 27,
;           "storedSize": 27,
;           "uncompressedSize": 27,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 29,
;           "label": "NINA_IDLE_RIGHT_9_F0_LAYER1",
;           "bank": 17,
;           "offset": 1468,
;           "address": 42428,
;           "size": 24,
;           "storedSize": 24,
;           "uncompressedSize": 24,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 30,
;           "label": "NINA_IDLE_RIGHT_9_F0_LAYER2",
;           "bank": 17,
;           "offset": 1492,
;           "address": 42452,
;           "size": 30,
;           "storedSize": 30,
;           "uncompressedSize": 30,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 31,
;           "label": "NINA_JUMP_RIGHT_10_F0_LAYER0",
;           "bank": 17,
;           "offset": 1522,
;           "address": 42482,
;           "size": 30,
;           "storedSize": 30,
;           "uncompressedSize": 30,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 32,
;           "label": "NINA_JUMP_RIGHT_10_F0_LAYER1",
;           "bank": 17,
;           "offset": 1552,
;           "address": 42512,
;           "size": 28,
;           "storedSize": 28,
;           "uncompressedSize": 28,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 33,
;           "label": "SPRITE_PLACEHOLDER_PATTERN",
;           "bank": 17,
;           "offset": 1580,
;           "address": 42540,
;           "size": 5,
;           "storedSize": 5,
;           "uncompressedSize": 5,
;           "flags": 0,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS"
;         },
;         {
;           "id": 40,
;           "label": "SCREEN_PAN1_0_EFFECT_ZONE_TABLE",
;           "bank": 17,
;           "offset": 1585,
;           "address": 42545,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECT_ZONE_TABLE"
;         },
;         {
;           "id": 41,
;           "label": "SCREEN_PAN1_0_BOSS_TABLE",
;           "bank": 17,
;           "offset": 1586,
;           "address": 42546,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
;         },
;         {
;           "id": 48,
;           "label": "SCREEN_PAN2_1_EFFECT_ZONE_TABLE",
;           "bank": 17,
;           "offset": 1587,
;           "address": 42547,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECT_ZONE_TABLE"
;         },
;         {
;           "id": 49,
;           "label": "SCREEN_PAN2_1_BOSS_TABLE",
;           "bank": 17,
;           "offset": 1588,
;           "address": 42548,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
;         },
;         {
;           "id": 56,
;           "label": "SCREEN_BACKGROUND1_2_EFFECT_ZONE_TABLE",
;           "bank": 17,
;           "offset": 1589,
;           "address": 42549,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECT_ZONE_TABLE"
;         },
;         {
;           "id": 57,
;           "label": "SCREEN_BACKGROUND1_2_BOSS_TABLE",
;           "bank": 17,
;           "offset": 1590,
;           "address": 42550,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
;         },
;         {
;           "id": 64,
;           "label": "SCREEN_PAN3_3_EFFECT_ZONE_TABLE",
;           "bank": 17,
;           "offset": 1591,
;           "address": 42551,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECT_ZONE_TABLE"
;         },
;         {
;           "id": 65,
;           "label": "SCREEN_PAN3_3_BOSS_TABLE",
;           "bank": 17,
;           "offset": 1592,
;           "address": 42552,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA"
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
;     "sounds": false,
;     "stateMachines": true
;   },
;   "counts": {
;     "components": 40,
;     "templates": 4,
;     "sprites": 7,
;     "tiles": 6,
;     "tileBanks": 1,
;     "screens": 4,
;     "entities": 3,
;     "sounds": 0,
;     "tracks": 0,
;     "stateMachines": 1,
;     "bankedResources": 70
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
;       "count": 32
;     },
;     {
;       "key": "SPRITES",
;       "count": 34
;     }
;   ],
;   "resourceTypes": [
;     {
;       "key": "SCREEN_BEHAVIOR_MAP",
;       "count": 4
;     },
;     {
;       "key": "SCREEN_DATA",
;       "count": 16
;     },
;     {
;       "key": "SCREEN_EFFECT_ZONE_TABLE",
;       "count": 4
;     },
;     {
;       "key": "SCREEN_EFFECTS_LAYOUT",
;       "count": 4
;     },
;     {
;       "key": "SCREEN_LAYOUT",
;       "count": 4
;     },
;     {
;       "key": "SPRITE_PATTERNS",
;       "count": 34
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
;     }
;   ],
;   "bankedResources": [
;     {
;       "id": 0,
;       "label": "ANEC_RIGHT_0_F0_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 17,
;       "windowAddress": 41403,
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
;       "bank": 17,
;       "windowAddress": 41435,
;       "size": 29,
;       "storedSize": 29,
;       "uncompressedSize": 29,
;       "flags": 0
;     },
;     {
;       "id": 2,
;       "label": "ANEC_RIGHT_0_F1_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 17,
;       "windowAddress": 41464,
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
;       "bank": 17,
;       "windowAddress": 41496,
;       "size": 28,
;       "storedSize": 28,
;       "uncompressedSize": 28,
;       "flags": 0
;     },
;     {
;       "id": 4,
;       "label": "BOLA_1_F0_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 17,
;       "windowAddress": 41524,
;       "size": 25,
;       "storedSize": 25,
;       "uncompressedSize": 25,
;       "flags": 0
;     },
;     {
;       "id": 5,
;       "label": "BOLA_1_F1_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 17,
;       "windowAddress": 41549,
;       "size": 29,
;       "storedSize": 29,
;       "uncompressedSize": 29,
;       "flags": 0
;     },
;     {
;       "id": 6,
;       "label": "PANELL_2_F0_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 17,
;       "windowAddress": 41578,
;       "size": 20,
;       "storedSize": 20,
;       "uncompressedSize": 20,
;       "flags": 0
;     },
;     {
;       "id": 7,
;       "label": "PANELL_2_F0_LAYER2",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 17,
;       "windowAddress": 41748,
;       "size": 14,
;       "storedSize": 14,
;       "uncompressedSize": 14,
;       "flags": 0
;     },
;     {
;       "id": 8,
;       "label": "BOLA_DEAD_3_F0_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 17,
;       "windowAddress": 41762,
;       "size": 32,
;       "storedSize": 32,
;       "uncompressedSize": 32,
;       "flags": 0
;     },
;     {
;       "id": 9,
;       "label": "BOLA_DEAD_3_F1_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 17,
;       "windowAddress": 41794,
;       "size": 32,
;       "storedSize": 32,
;       "uncompressedSize": 32,
;       "flags": 0
;     },
;     {
;       "id": 10,
;       "label": "BOLA_DEAD_3_F2_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 17,
;       "windowAddress": 41826,
;       "size": 32,
;       "storedSize": 32,
;       "uncompressedSize": 32,
;       "flags": 0
;     },
;     {
;       "id": 11,
;       "label": "BOLA_DEAD_3_F3_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 17,
;       "windowAddress": 41858,
;       "size": 28,
;       "storedSize": 28,
;       "uncompressedSize": 28,
;       "flags": 0
;     },
;     {
;       "id": 12,
;       "label": "BOLA_DEAD_3_F4_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 17,
;       "windowAddress": 41886,
;       "size": 5,
;       "storedSize": 5,
;       "uncompressedSize": 5,
;       "flags": 0
;     },
;     {
;       "id": 13,
;       "label": "NINA_WALK_LEFT_4_F0_LAYER0",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 17,
;       "windowAddress": 41891,
;       "size": 28,
;       "storedSize": 28,
;       "uncompressedSize": 28,
;       "flags": 0
;     },
;     {
;       "id": 14,
;       "label": "NINA_WALK_LEFT_4_F0_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 17,
;       "windowAddress": 41919,
;       "size": 25,
;       "storedSize": 25,
;       "uncompressedSize": 25,
;       "flags": 0
;     },
;     {
;       "id": 15,
;       "label": "NINA_WALK_LEFT_4_F1_LAYER0",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 17,
;       "windowAddress": 41944,
;       "size": 30,
;       "storedSize": 30,
;       "uncompressedSize": 30,
;       "flags": 0
;     },
;     {
;       "id": 16,
;       "label": "NINA_WALK_LEFT_4_F1_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 17,
;       "windowAddress": 41974,
;       "size": 30,
;       "storedSize": 30,
;       "uncompressedSize": 30,
;       "flags": 0
;     },
;     {
;       "id": 17,
;       "label": "NINA_IDLE_LEFT_5_F0_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 17,
;       "windowAddress": 42004,
;       "size": 24,
;       "storedSize": 24,
;       "uncompressedSize": 24,
;       "flags": 0
;     },
;     {
;       "id": 18,
;       "label": "NINA_IDLE_LEFT_5_F0_LAYER2",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 17,
;       "windowAddress": 42028,
;       "size": 29,
;       "storedSize": 29,
;       "uncompressedSize": 29,
;       "flags": 0
;     },
;     {
;       "id": 19,
;       "label": "NINA_JUMP_LEFT_6_F0_LAYER0",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 17,
;       "windowAddress": 42057,
;       "size": 30,
;       "storedSize": 30,
;       "uncompressedSize": 30,
;       "flags": 0
;     },
;     {
;       "id": 20,
;       "label": "NINA_JUMP_LEFT_6_F0_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 17,
;       "windowAddress": 42087,
;       "size": 28,
;       "storedSize": 28,
;       "uncompressedSize": 28,
;       "flags": 0
;     },
;     {
;       "id": 21,
;       "label": "ANEC_LEFT_7_F0_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 17,
;       "windowAddress": 42115,
;       "size": 32,
;       "storedSize": 32,
;       "uncompressedSize": 32,
;       "flags": 0
;     },
;     {
;       "id": 22,
;       "label": "ANEC_LEFT_7_F0_LAYER2",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 17,
;       "windowAddress": 42147,
;       "size": 29,
;       "storedSize": 29,
;       "uncompressedSize": 29,
;       "flags": 0
;     },
;     {
;       "id": 23,
;       "label": "ANEC_LEFT_7_F1_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 17,
;       "windowAddress": 42254,
;       "size": 32,
;       "storedSize": 32,
;       "uncompressedSize": 32,
;       "flags": 0
;     },
;     {
;       "id": 24,
;       "label": "ANEC_LEFT_7_F1_LAYER2",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 17,
;       "windowAddress": 42286,
;       "size": 29,
;       "storedSize": 29,
;       "uncompressedSize": 29,
;       "flags": 0
;     },
;     {
;       "id": 25,
;       "label": "NINA_WALK_RIGHT_8_F0_LAYER0",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 17,
;       "windowAddress": 42315,
;       "size": 30,
;       "storedSize": 30,
;       "uncompressedSize": 30,
;       "flags": 0
;     },
;     {
;       "id": 26,
;       "label": "NINA_WALK_RIGHT_8_F0_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 17,
;       "windowAddress": 42345,
;       "size": 25,
;       "storedSize": 25,
;       "uncompressedSize": 25,
;       "flags": 0
;     },
;     {
;       "id": 27,
;       "label": "NINA_WALK_RIGHT_8_F1_LAYER0",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 17,
;       "windowAddress": 42370,
;       "size": 31,
;       "storedSize": 31,
;       "uncompressedSize": 31,
;       "flags": 0
;     },
;     {
;       "id": 28,
;       "label": "NINA_WALK_RIGHT_8_F1_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 17,
;       "windowAddress": 42401,
;       "size": 27,
;       "storedSize": 27,
;       "uncompressedSize": 27,
;       "flags": 0
;     },
;     {
;       "id": 29,
;       "label": "NINA_IDLE_RIGHT_9_F0_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 17,
;       "windowAddress": 42428,
;       "size": 24,
;       "storedSize": 24,
;       "uncompressedSize": 24,
;       "flags": 0
;     },
;     {
;       "id": 30,
;       "label": "NINA_IDLE_RIGHT_9_F0_LAYER2",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 17,
;       "windowAddress": 42452,
;       "size": 30,
;       "storedSize": 30,
;       "uncompressedSize": 30,
;       "flags": 0
;     },
;     {
;       "id": 31,
;       "label": "NINA_JUMP_RIGHT_10_F0_LAYER0",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 17,
;       "windowAddress": 42482,
;       "size": 30,
;       "storedSize": 30,
;       "uncompressedSize": 30,
;       "flags": 0
;     },
;     {
;       "id": 32,
;       "label": "NINA_JUMP_RIGHT_10_F0_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 17,
;       "windowAddress": 42512,
;       "size": 28,
;       "storedSize": 28,
;       "uncompressedSize": 28,
;       "flags": 0
;     },
;     {
;       "id": 33,
;       "label": "SPRITE_PLACEHOLDER_PATTERN",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 17,
;       "windowAddress": 42540,
;       "size": 5,
;       "storedSize": 5,
;       "uncompressedSize": 5,
;       "flags": 0
;     },
;     {
;       "id": 34,
;       "label": "tile_pattern_bank0",
;       "group": "PATTERNS",
;       "type": "TILE_PATTERNS",
;       "bank": 17,
;       "windowAddress": 41225,
;       "size": 62,
;       "storedSize": 62,
;       "uncompressedSize": 62,
;       "flags": 0
;     },
;     {
;       "id": 35,
;       "label": "tilebank_pattern_data_0",
;       "group": "PATTERNS",
;       "type": "TILE_PATTERNS",
;       "bank": 17,
;       "windowAddress": 41287,
;       "size": 62,
;       "storedSize": 62,
;       "uncompressedSize": 62,
;       "flags": 0
;     },
;     {
;       "id": 36,
;       "label": "tile_color_bank0",
;       "group": "COLORS",
;       "type": "TILE_COLORS",
;       "bank": 17,
;       "windowAddress": 41349,
;       "size": 27,
;       "storedSize": 27,
;       "uncompressedSize": 27,
;       "flags": 0
;     },
;     {
;       "id": 37,
;       "label": "tilebank_color_data_0",
;       "group": "COLORS",
;       "type": "TILE_COLORS",
;       "bank": 17,
;       "windowAddress": 41376,
;       "size": 27,
;       "storedSize": 27,
;       "uncompressedSize": 27,
;       "flags": 0
;     },
;     {
;       "id": 38,
;       "label": "SCREEN_PAN1_0_LAYOUT",
;       "group": "SCREENS",
;       "type": "SCREEN_LAYOUT",
;       "bank": 17,
;       "windowAddress": 40960,
;       "size": 105,
;       "storedSize": 105,
;       "uncompressedSize": 768,
;       "flags": 1
;     },
;     {
;       "id": 39,
;       "label": "SCREEN_PAN1_0_EFFECTS_LAYOUT",
;       "group": "SCREENS",
;       "type": "SCREEN_EFFECTS_LAYOUT",
;       "bank": 17,
;       "windowAddress": 40960,
;       "size": 6,
;       "storedSize": 6,
;       "uncompressedSize": 6,
;       "flags": 0
;     },
;     {
;       "id": 40,
;       "label": "SCREEN_PAN1_0_EFFECT_ZONE_TABLE",
;       "group": "SCREENS",
;       "type": "SCREEN_EFFECT_ZONE_TABLE",
;       "bank": 17,
;       "windowAddress": 42545,
;       "size": 1,
;       "storedSize": 1,
;       "uncompressedSize": 1,
;       "flags": 0
;     },
;     {
;       "id": 41,
;       "label": "SCREEN_PAN1_0_BOSS_TABLE",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 17,
;       "windowAddress": 42546,
;       "size": 1,
;       "storedSize": 1,
;       "uncompressedSize": 1,
;       "flags": 0
;     },
;     {
;       "id": 42,
;       "label": "BEHAVIOR_PAN1_0_DATA",
;       "group": "SCREENS",
;       "type": "SCREEN_BEHAVIOR_MAP",
;       "bank": 17,
;       "windowAddress": 40966,
;       "size": 64,
;       "storedSize": 64,
;       "uncompressedSize": 64,
;       "flags": 0
;     },
;     {
;       "id": 43,
;       "label": "SCREEN_PAN1_0_INTERACTION_TYPE_MAP",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 17,
;       "windowAddress": 41030,
;       "size": 15,
;       "storedSize": 15,
;       "uncompressedSize": 15,
;       "flags": 0
;     },
;     {
;       "id": 44,
;       "label": "SCREEN_PAN1_0_INTERACTION_VALUE_MAP",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 17,
;       "windowAddress": 41045,
;       "size": 62,
;       "storedSize": 62,
;       "uncompressedSize": 62,
;       "flags": 0
;     },
;     {
;       "id": 45,
;       "label": "SCREEN_PAN1_0_INTERACTION_TARGET_MAP",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 17,
;       "windowAddress": 41107,
;       "size": 6,
;       "storedSize": 6,
;       "uncompressedSize": 6,
;       "flags": 0
;     },
;     {
;       "id": 46,
;       "label": "SCREEN_PAN2_1_LAYOUT",
;       "group": "SCREENS",
;       "type": "SCREEN_LAYOUT",
;       "bank": 17,
;       "windowAddress": 41113,
;       "size": 52,
;       "storedSize": 52,
;       "uncompressedSize": 52,
;       "flags": 0
;     },
;     {
;       "id": 47,
;       "label": "SCREEN_PAN2_1_EFFECTS_LAYOUT",
;       "group": "SCREENS",
;       "type": "SCREEN_EFFECTS_LAYOUT",
;       "bank": 17,
;       "windowAddress": 41165,
;       "size": 6,
;       "storedSize": 6,
;       "uncompressedSize": 6,
;       "flags": 0
;     },
;     {
;       "id": 48,
;       "label": "SCREEN_PAN2_1_EFFECT_ZONE_TABLE",
;       "group": "SCREENS",
;       "type": "SCREEN_EFFECT_ZONE_TABLE",
;       "bank": 17,
;       "windowAddress": 42547,
;       "size": 1,
;       "storedSize": 1,
;       "uncompressedSize": 1,
;       "flags": 0
;     },
;     {
;       "id": 49,
;       "label": "SCREEN_PAN2_1_BOSS_TABLE",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 17,
;       "windowAddress": 42548,
;       "size": 1,
;       "storedSize": 1,
;       "uncompressedSize": 1,
;       "flags": 0
;     },
;     {
;       "id": 50,
;       "label": "BEHAVIOR_PAN2_1_DATA",
;       "group": "SCREENS",
;       "type": "SCREEN_BEHAVIOR_MAP",
;       "bank": 17,
;       "windowAddress": 41171,
;       "size": 40,
;       "storedSize": 40,
;       "uncompressedSize": 40,
;       "flags": 0
;     },
;     {
;       "id": 51,
;       "label": "SCREEN_PAN2_1_INTERACTION_TYPE_MAP",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 17,
;       "windowAddress": 41211,
;       "size": 14,
;       "storedSize": 14,
;       "uncompressedSize": 14,
;       "flags": 0
;     },
;     {
;       "id": 52,
;       "label": "SCREEN_PAN2_1_INTERACTION_VALUE_MAP",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 17,
;       "windowAddress": 41598,
;       "size": 40,
;       "storedSize": 40,
;       "uncompressedSize": 40,
;       "flags": 0
;     },
;     {
;       "id": 53,
;       "label": "SCREEN_PAN2_1_INTERACTION_TARGET_MAP",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 17,
;       "windowAddress": 41638,
;       "size": 6,
;       "storedSize": 6,
;       "uncompressedSize": 6,
;       "flags": 0
;     },
;     {
;       "id": 54,
;       "label": "SCREEN_BACKGROUND1_2_LAYOUT",
;       "group": "SCREENS",
;       "type": "SCREEN_LAYOUT",
;       "bank": 17,
;       "windowAddress": 41644,
;       "size": 6,
;       "storedSize": 6,
;       "uncompressedSize": 6,
;       "flags": 0
;     },
;     {
;       "id": 55,
;       "label": "SCREEN_BACKGROUND1_2_EFFECTS_LAYOUT",
;       "group": "SCREENS",
;       "type": "SCREEN_EFFECTS_LAYOUT",
;       "bank": 17,
;       "windowAddress": 41650,
;       "size": 6,
;       "storedSize": 6,
;       "uncompressedSize": 6,
;       "flags": 0
;     },
;     {
;       "id": 56,
;       "label": "SCREEN_BACKGROUND1_2_EFFECT_ZONE_TABLE",
;       "group": "SCREENS",
;       "type": "SCREEN_EFFECT_ZONE_TABLE",
;       "bank": 17,
;       "windowAddress": 42549,
;       "size": 1,
;       "storedSize": 1,
;       "uncompressedSize": 1,
;       "flags": 0
;     },
;     {
;       "id": 57,
;       "label": "SCREEN_BACKGROUND1_2_BOSS_TABLE",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 17,
;       "windowAddress": 42550,
;       "size": 1,
;       "storedSize": 1,
;       "uncompressedSize": 1,
;       "flags": 0
;     },
;     {
;       "id": 58,
;       "label": "BEHAVIOR_BACKGROUND1_2_DATA",
;       "group": "SCREENS",
;       "type": "SCREEN_BEHAVIOR_MAP",
;       "bank": 17,
;       "windowAddress": 41656,
;       "size": 6,
;       "storedSize": 6,
;       "uncompressedSize": 6,
;       "flags": 0
;     },
;     {
;       "id": 59,
;       "label": "SCREEN_BACKGROUND1_2_INTERACTION_TYPE_MAP",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 17,
;       "windowAddress": 41662,
;       "size": 6,
;       "storedSize": 6,
;       "uncompressedSize": 6,
;       "flags": 0
;     },
;     {
;       "id": 60,
;       "label": "SCREEN_BACKGROUND1_2_INTERACTION_VALUE_MAP",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 17,
;       "windowAddress": 41668,
;       "size": 6,
;       "storedSize": 6,
;       "uncompressedSize": 6,
;       "flags": 0
;     },
;     {
;       "id": 61,
;       "label": "SCREEN_BACKGROUND1_2_INTERACTION_TARGET_MAP",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 17,
;       "windowAddress": 41674,
;       "size": 6,
;       "storedSize": 6,
;       "uncompressedSize": 6,
;       "flags": 0
;     },
;     {
;       "id": 62,
;       "label": "SCREEN_PAN3_3_LAYOUT",
;       "group": "SCREENS",
;       "type": "SCREEN_LAYOUT",
;       "bank": 17,
;       "windowAddress": 41680,
;       "size": 62,
;       "storedSize": 62,
;       "uncompressedSize": 62,
;       "flags": 0
;     },
;     {
;       "id": 63,
;       "label": "SCREEN_PAN3_3_EFFECTS_LAYOUT",
;       "group": "SCREENS",
;       "type": "SCREEN_EFFECTS_LAYOUT",
;       "bank": 17,
;       "windowAddress": 41742,
;       "size": 6,
;       "storedSize": 6,
;       "uncompressedSize": 6,
;       "flags": 0
;     },
;     {
;       "id": 64,
;       "label": "SCREEN_PAN3_3_EFFECT_ZONE_TABLE",
;       "group": "SCREENS",
;       "type": "SCREEN_EFFECT_ZONE_TABLE",
;       "bank": 17,
;       "windowAddress": 42551,
;       "size": 1,
;       "storedSize": 1,
;       "uncompressedSize": 1,
;       "flags": 0
;     },
;     {
;       "id": 65,
;       "label": "SCREEN_PAN3_3_BOSS_TABLE",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 17,
;       "windowAddress": 42552,
;       "size": 1,
;       "storedSize": 1,
;       "uncompressedSize": 1,
;       "flags": 0
;     },
;     {
;       "id": 66,
;       "label": "BEHAVIOR_PAN3_3_DATA",
;       "group": "SCREENS",
;       "type": "SCREEN_BEHAVIOR_MAP",
;       "bank": 17,
;       "windowAddress": 42176,
;       "size": 33,
;       "storedSize": 33,
;       "uncompressedSize": 33,
;       "flags": 0
;     },
;     {
;       "id": 67,
;       "label": "SCREEN_PAN3_3_INTERACTION_TYPE_MAP",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 17,
;       "windowAddress": 42209,
;       "size": 6,
;       "storedSize": 6,
;       "uncompressedSize": 6,
;       "flags": 0
;     },
;     {
;       "id": 68,
;       "label": "SCREEN_PAN3_3_INTERACTION_VALUE_MAP",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 17,
;       "windowAddress": 42215,
;       "size": 33,
;       "storedSize": 33,
;       "uncompressedSize": 33,
;       "flags": 0
;     },
;     {
;       "id": 69,
;       "label": "SCREEN_PAN3_3_INTERACTION_TARGET_MAP",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 17,
;       "windowAddress": 42248,
;       "size": 6,
;       "storedSize": 6,
;       "uncompressedSize": 6,
;       "flags": 0
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
; - slots: 27/64
; - placeholder_slot: 26
; - sprites:
;   0: anec_right @ slot 0
;   2: panell @ slot 4
;   4: nina_walk_left @ slot 6
;   5: nina_idle_left @ slot 10
;   6: nina_jump_left @ slot 12
;   7: anec_left @ slot 14
;   8: nina_walk_right @ slot 18
;   9: nina_idle_right @ slot 22
;   10: nina_jump_right @ slot 24
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
; - sprite_pattern_slots: 27
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
; - sprite_pattern_slots: 9
; - music_in_game: 0
; - layout: RESOURCE_ID_SCREEN_PAN3_3_LAYOUT
; - effects_layout: RESOURCE_ID_SCREEN_PAN3_3_EFFECTS_LAYOUT
; - effect_zone_table: RESOURCE_ID_SCREEN_PAN3_3_EFFECT_ZONE_TABLE
; - interaction_type_map: RESOURCE_ID_SCREEN_PAN3_3_INTERACTION_TYPE_MAP
; - interaction_value_map: RESOURCE_ID_SCREEN_PAN3_3_INTERACTION_VALUE_MAP
; - interaction_target_map: RESOURCE_ID_SCREEN_PAN3_3_INTERACTION_TARGET_MAP
; - behavior: RESOURCE_ID_BEHAVIOR_PAN3_3_DATA
; [[[MIDEAS_ARTIFACT:screen_resource_policy.txt:END]]]

; [[[MIDEAS_ARTIFACT:unused_report.txt:BEGIN]]]
; MIDEAS UNUSED MODULE REPORT
; Scope: konami8k_megarom_resident_modules
; Candidate unused modules: 3
; Estimated removable bytes: 12437
;
; Candidates:
; - bosses: 5666 estimated bytes
; - sound: 4418 estimated bytes
; - scroll: 2353 estimated bytes
;
; Retained modules:
; - animtiles: 3477 estimated bytes
; - colors_code: 846 estimated bytes
; - components: 48261 estimated bytes
; - entities: 7897 estimated bytes
; - font: 3576 estimated bytes
; - gameflow: 19149 estimated bytes
; - hud: 3538 estimated bytes
; - menus: 444 estimated bytes
; - patterns_code: 894 estimated bytes
; - screens_code: 12301 estimated bytes
; - sprites: 5536 estimated bytes
; - statemachine: 13778 estimated bytes
; - worlds: 3931 estimated bytes
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
;       "estimatedUsedBytes": 48261,
;       "estimatedFreeBytes": 0,
;       "estimatedOverBudget": true,
;       "modules": [
;         {
;           "key": "components",
;           "estimatedBytes": 48261
;         }
;       ]
;     },
;     {
;       "bank": 2,
;       "role": "resident_code",
;       "page": 2,
;       "orgAddress": 32768,
;       "endAddress": 40960,
;       "estimatedUsedBytes": 13778,
;       "estimatedFreeBytes": 0,
;       "estimatedOverBudget": true,
;       "modules": [
;         {
;           "key": "statemachine",
;           "estimatedBytes": 13778
;         }
;       ]
;     },
;     {
;       "bank": 3,
;       "role": "resident_code",
;       "page": 3,
;       "orgAddress": 40960,
;       "endAddress": 49152,
;       "estimatedUsedBytes": 19149,
;       "estimatedFreeBytes": 0,
;       "estimatedOverBudget": true,
;       "modules": [
;         {
;           "key": "gameflow",
;           "estimatedBytes": 19149
;         }
;       ]
;     },
;     {
;       "bank": 4,
;       "role": "far_code",
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "estimatedUsedBytes": 12301,
;       "estimatedFreeBytes": 0,
;       "estimatedOverBudget": true,
;       "modules": [
;         {
;           "key": "screens_code",
;           "estimatedBytes": 12301
;         }
;       ]
;     },
;     {
;       "bank": 5,
;       "role": "far_code",
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "estimatedUsedBytes": 7897,
;       "estimatedFreeBytes": 295,
;       "estimatedOverBudget": false,
;       "modules": [
;         {
;           "key": "entities",
;           "estimatedBytes": 7897
;         }
;       ]
;     },
;     {
;       "bank": 6,
;       "role": "far_code",
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "estimatedUsedBytes": 5666,
;       "estimatedFreeBytes": 2526,
;       "estimatedOverBudget": false,
;       "modules": [
;         {
;           "key": "bosses",
;           "estimatedBytes": 5666
;         }
;       ]
;     },
;     {
;       "bank": 7,
;       "role": "far_code",
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "estimatedUsedBytes": 5536,
;       "estimatedFreeBytes": 2656,
;       "estimatedOverBudget": false,
;       "modules": [
;         {
;           "key": "sprites",
;           "estimatedBytes": 5536
;         }
;       ]
;     },
;     {
;       "bank": 8,
;       "role": "far_code",
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "estimatedUsedBytes": 4418,
;       "estimatedFreeBytes": 3774,
;       "estimatedOverBudget": false,
;       "modules": [
;         {
;           "key": "sound",
;           "estimatedBytes": 4418
;         }
;       ]
;     },
;     {
;       "bank": 9,
;       "role": "far_code",
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "estimatedUsedBytes": 3931,
;       "estimatedFreeBytes": 4261,
;       "estimatedOverBudget": false,
;       "modules": [
;         {
;           "key": "worlds",
;           "estimatedBytes": 3931
;         }
;       ]
;     },
;     {
;       "bank": 10,
;       "role": "far_code",
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "estimatedUsedBytes": 3576,
;       "estimatedFreeBytes": 4616,
;       "estimatedOverBudget": false,
;       "modules": [
;         {
;           "key": "font",
;           "estimatedBytes": 3576
;         }
;       ]
;     },
;     {
;       "bank": 11,
;       "role": "far_code",
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "estimatedUsedBytes": 3538,
;       "estimatedFreeBytes": 4654,
;       "estimatedOverBudget": false,
;       "modules": [
;         {
;           "key": "hud",
;           "estimatedBytes": 3538
;         }
;       ]
;     },
;     {
;       "bank": 12,
;       "role": "far_code",
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "estimatedUsedBytes": 3477,
;       "estimatedFreeBytes": 4715,
;       "estimatedOverBudget": false,
;       "modules": [
;         {
;           "key": "animtiles",
;           "estimatedBytes": 3477
;         }
;       ]
;     },
;     {
;       "bank": 13,
;       "role": "far_code",
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "estimatedUsedBytes": 2353,
;       "estimatedFreeBytes": 5839,
;       "estimatedOverBudget": false,
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
;       "estimatedUsedBytes": 894,
;       "estimatedFreeBytes": 7298,
;       "estimatedOverBudget": false,
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
;       "estimatedUsedBytes": 846,
;       "estimatedFreeBytes": 7346,
;       "estimatedOverBudget": false,
;       "modules": [
;         {
;           "key": "colors_code",
;           "estimatedBytes": 846
;         }
;       ]
;     },
;     {
;       "bank": 16,
;       "role": "far_code",
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "estimatedUsedBytes": 444,
;       "estimatedFreeBytes": 7748,
;       "estimatedOverBudget": false,
;       "modules": [
;         {
;           "key": "menus",
;           "estimatedBytes": 444
;         }
;       ]
;     }
;   ],
;   "dataBanks": [
;     {
;       "bank": 17,
;       "role": "asset_data",
;       "orgAddress": 155648,
;       "endAddress": 163840,
;       "usedBytes": 1593,
;       "freeBytes": 6599,
;       "resources": 69
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
; Flow: Start → SubMenu (DUCK INVADERS)
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
TOTAL_SPRITES           EQU 11
TOTAL_TILES             EQU 6
TOTAL_SCREENS           EQU 4

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

; ==================================================================
; SYSTEM VARIABLES
; ==================================================================
ROM_slot            EQU #C111   ; Expanded slot for normal page 1 ROM access
slot_primary_normal EQU #C112   ; Primary slot register snapshot for BIOS-ROM-ROM-RAM layout
page0_bios_slot     EQU #C113   ; Expanded slot for normal BIOS page 0
page2_normal_slot   EQU #C114   ; Expanded slot for normal page 2 layout
page3_normal_slot   EQU #C115   ; Expanded slot for normal RAM page 3
slot_subslot_normal EQU #C116   ; Raw subslot register snapshot for normal page 3 expanded slot
mapper_bank_p1_current EQU #C117   ; Mapper current bank for page/window 1
mapper_bank_p2_current EQU #C118   ; Mapper current bank for page/window 2
mapper_bank_p3_current EQU #C119   ; Mapper current bank for page/window 3
mapper_bank_p4_current EQU #C11A   ; Mapper current bank for page/window 4
mapper_saved_bank    EQU #C11B   ; Saved mapper bank for push/pop helpers
mapper_saved_bank_p1 EQU #C11C   ; Saved mapper bank for page/window 1 helpers
mapper_saved_bank_p3 EQU #C11D   ; Saved mapper bank for page/window 3 helpers
mapper_saved_bank_p4 EQU #C11E   ; Saved mapper bank for page/window 4 helpers
resource_descriptor_ptr EQU #C11F   ; Pointer to cached resource descriptor entry (16-bit)
resource_descriptor_id EQU #C121   ; Cached resource id
resource_descriptor_type EQU #C122   ; Cached resource type
resource_descriptor_group EQU #C123   ; Cached resource group
resource_descriptor_bank EQU #C124   ; Cached resource bank
resource_descriptor_addr EQU #C125   ; Cached resource visible address (16-bit)
resource_descriptor_size EQU #C127   ; Cached resource size (16-bit)
resource_descriptor_uncompressed_size EQU #C129   ; Cached resource uncompressed size (16-bit)
resource_descriptor_flags EQU #C12B   ; Cached resource flags
vram_cache_tile_patterns_ready EQU #C12C   ; 1 when shared gameplay tile patterns are already resident in VRAM
vram_cache_tile_colors_ready EQU #C12D   ; 1 when shared gameplay tile colors are already resident in VRAM
vram_cache_font_ready EQU #C12E   ; 1 when shared font patterns/colors are already resident in VRAM
resource_ram_cache_screen_layout_id EQU #C12F   ; Cached resource id for runtime_background_layout source
resource_ram_cache_effects_layout_id EQU #C130   ; Cached resource id for runtime_effects_layout source
resource_ram_cache_effect_zone_table_id EQU #C131   ; Cached resource id for runtime_effect_zone_table source
current_screen2_tilebank_id EQU #C132   ; Current SCREEN 2 shared tilebank loaded in VRAM (#FF=none/unknown)
frame_counter       EQU #C133   ; Frame counter (16-bit)

; Profiling counters (16-bit, cumulative)
prof_update_all_entities_calls EQU #C135   ; Calls to update_all_entities
prof_execute_sm_calls EQU #C137   ; Calls to execute_all_state_machines
prof_sm_update_calls  EQU #C139   ; Calls to SM_Update
prof_collision_calls  EQU #C13B   ; Calls to update_collision_component
prof_wall_calls       EQU #C13D   ; Calls to update_wallcollision_component
prof_deadly_calls     EQU #C13F   ; Calls to update_deadly_tiles_component
prof_tile_interaction_calls EQU #C141   ; Calls to check_tile_interaction
prof_animation_calls  EQU #C143   ; Calls to update_animation_component
prof_sprite_calls     EQU #C145   ; Calls to update_sprite_component
prof_music_task_calls EQU #C147   ; Calls to task_update_music
prof_deadly_behavior_reads EQU #C149   ; Deadly helper behavior-map reads
; page0_transfer_buffer shares the ZX0 scratch area declared near RAM_USAGE_END.

; ==================================================================
; SCREEN MAP POINTERS (Current active screen)
; ==================================================================
current_screen_layout   EQU #C14B   ; Pointer to current screen layout data (16-bit)
current_screen_layout_bank EQU #C14D   ; Mapper bank for current screen layout data
current_behavior_map    EQU #C14E   ; Pointer to current behavior map data (16-bit)
current_behavior_map_bank EQU #C150   ; Mapper bank for current behavior map data
behavior_cache_row     EQU #C151   ; Cached behavior row (255=invalid)
behavior_cache_map_l   EQU #C152   ; Cached behavior map pointer low byte
behavior_cache_map_h   EQU #C153   ; Cached behavior map pointer high byte
behavior_cache_row_base EQU #C154   ; Cached row base address in behavior map (16-bit)
RUNTIME_SCREEN_MAP_SIZE EQU 768
MAX_RUNTIME_EFFECT_ZONES EQU 0
runtime_background_layout EQU #C156   ; Immutable copy of current background layout (32x24)
runtime_screen_layout  EQU #C456   ; Mutable copy of current screen layout (32x24)
runtime_behavior_map   EQU #C756   ; Mutable copy of current behavior map (32x24)
runtime_interaction_type_map EQU #CA56   ; Mutable copy of current interaction type map (32x24)
runtime_interaction_value_map EQU #CD56   ; Mutable copy of current interaction value map (32x24)
runtime_interaction_target_map EQU #D056   ; Mutable copy of current interaction target map (32x24)
runtime_char_behavior_table EQU #D356   ; Current screen char -> behavior lookup table (256 bytes)
runtime_effects_layout EQU #D456   ; Alternate effects layout copy for secret zones (32x24)
screen_block_catalog_ptr EQU #D756   ; Scratch pointer to current screen block catalog during layout expansion
screen_block_map_ptr EQU #D758   ; Scratch pointer to current screen block index map during layout expansion
runtime_effect_zone_table EQU #D75A   ; Current screen effect zone table (0 bytes)
current_effect_zone_count EQU #D75A   ; Number of effect zones copied into runtime_effect_zone_table
secret_zone_active EQU #D75B   ; 1 if hero is currently inside an active secret zone
secret_zone_rect_x EQU #D75C   ; Active secret zone rect X in cells
secret_zone_rect_y EQU #D75D   ; Active secret zone rect Y in cells
secret_zone_rect_w EQU #D75E   ; Active secret zone rect width in cells
secret_zone_rect_h EQU #D75F   ; Active secret zone rect height in cells

; ==================================================================
; VIEWPORT/CAMERA VARIABLES (for scroll system)
; ==================================================================
camera_x            EQU #D760   ; Camera X position in pixels (16-bit)
camera_y            EQU #D762   ; Camera Y position in pixels (16-bit)
camera_tile_x       EQU #D764   ; Camera tile X (column)
camera_tile_y       EQU #D765   ; Camera tile Y (row)
world_width_tiles   EQU #D766   ; World width in tiles
world_height_tiles  EQU #D767   ; World height in tiles
scroll_dirty_flag   EQU #D768   ; 1=viewport changed, needs redraw
hud_dirty_flag      EQU #D769   ; 1=HUD needs redraw, 0=clean
time_second_frame_counter EQU #D76A   ; VBlank frames remaining until the next TimeRemaining decrement
time_last_interrupt_counter EQU #D76B   ; Last interrupt_counter snapshot used by TimeRemaining sync (16-bit)

; ==================================================================
; ANIMATED TILES VARIABLES
; ==================================================================
anim_tile_timer     EQU #D76D   ; Animation frame timer
anim_tile_frame     EQU #D76E   ; Current animation frame (0-3)
anim_tile_speed     EQU #D76F   ; Frames between animation updates

; ==================================================================
; ENTITY SYSTEM VARIABLES (Fixed 32 entities)
; ==================================================================
MAX_ENTITIES        EQU 32
entity_active       EQU #D770   ; Entity active flags (32 bytes, 0=inactive, 1=active)
entity_is_player    EQU #D790   ; Entity hero/player flag (32 bytes, 0=no, 1=yes)
entity_button_contact_active EQU #D7B0   ; 1 while entity stays on the same button tile (32 bytes)
entity_button_contact_x EQU #D7D0   ; Button tile X currently latched per entity (32 bytes)
entity_button_contact_y EQU #D7F0   ; Button tile Y currently latched per entity (32 bytes)
entity_on_ladder   EQU #D810   ; 1 while entity is centered on a ladder tile (32 bytes)
entity_gate_current_step EQU #D830   ; Current applied retract step (32 bytes)
entity_gate_step_timer EQU #D850   ; Countdown until next retract step (32 bytes)
entity_walljump_lock EQU #D870   ; Remaining horizontal lock frames after wall jump (32 bytes)
entity_walljump_locked_vx EQU #D890   ; Horizontal velocity preserved while wall jump lock is active (32 bytes)
entity_wallgrab_active EQU #D8B0   ; 1 if entity is currently grabbing a wall (32 bytes)
entity_wallgrab_grace EQU #D8D0   ; Frames to keep wall grab during transient wall flag gaps (32 bytes)
entity_wallgrab_timer EQU #D8F0   ; Remaining wall-grab frames until grounded reset (32 bytes)
entity_wallgrab_lockout EQU #D910   ; Wall grab disabled until grounded after timer is spent (32 bytes)
entity_walljump_anim_active EQU #D930   ; Wall jump one-shot animation is waiting to restore base sprite (32 bytes)
entity_x_pos        EQU #D950   ; Entity X positions (32 bytes)
entity_y_pos        EQU #D970   ; Entity Y positions (32 bytes)
entity_vel_x        EQU #D990   ; Entity X velocity (32 bytes)
entity_vel_y        EQU #D9B0   ; Entity Y velocity (32 bytes)
entity_comp_masks   EQU #D9D0   ; Entity component masks (32 bytes)
entity_comp_masks_hi EQU #D9F0   ; Entity component masks high byte (32 bytes)
entity_screen_id    EQU #DA10   ; Entity screen ID (32 bytes)
entity_job_period   EQU #DA30   ; Entity job period in frames (32 bytes, 1=100%,2=50%,3=33%,4=25%)
entity_job_entry    EQU #DA50   ; Entity job entry slot within period window (32 bytes)
entity_job_scheduler_active EQU #DA70   ; 1 when any entity uses non-default job cadence
entity_dir_mask     EQU #DA71   ; Entity direction mask (32 bytes)
entity_input_speed  EQU #DA91   ; Entity input/cursor speed (32 bytes)
entity_health       EQU #DAB1   ; Entity health (32 bytes)
entity_anim_frame   EQU #DAD1   ; Entity animation frame (32 bytes)
entity_anim_tick    EQU #DAF1   ; Entity animation tick counter (32 bytes)
entity_anim_speed   EQU #DB11   ; Entity animation speed (ticks per frame) (32 bytes)
entity_anim_flags   EQU #DB31   ; Entity animation flags (32 bytes)
entity_sm_ptr_l     EQU #DB51   ; Entity State Pointer Low (32 bytes)
entity_sm_ptr_h     EQU #DB71   ; Entity State Pointer High (32 bytes)
entity_sm_timer_l   EQU #DB91   ; Entity State Timer Low (32 bytes)
entity_sm_timer_h   EQU #DBB1   ; Entity State Timer High (32 bytes)
entity_sm_wait_timer EQU #DBD1   ; Entity State Wait Timer (32 bytes)
entity_sm_sprite_control EQU #DBF1   ; 1 when the assigned state machine explicitly drives sprite changes (32 bytes)
entity_lifetime     EQU #DC11   ; Entity lifetime for auto-destroy (32 bytes, 0=infinite)
entity_collectible_enabled EQU #DC31   ; 1 when entity has Collectible component (32 bytes)
entity_carried_by   EQU #DC51   ; Entity carrier ID (32 bytes, 255=not carried)
entity_template_token EQU #DC71   ; Entity template token (32 bytes, 0=unknown)
entity_facing_dir   EQU #DC91   ; Last facing direction (32 bytes, 0=none,1=left,2=right,3=up,4=down)
entity_sm_var_0     EQU #DCB1   ; Entity Variable 0 (32 bytes)
entity_sm_var_1     EQU #DCD1   ; Entity Variable 1 (32 bytes)
entity_sm_var_2     EQU #DCF1   ; Entity Variable 2 (32 bytes)
entity_sm_var_3     EQU #DD11   ; Entity Variable 3 (32 bytes)
entity_sm_var_4     EQU #DD31   ; Entity Variable 4 (32 bytes)
entity_sm_var_5     EQU #DD51   ; Entity Variable 5 (32 bytes)
entity_sm_var_6     EQU #DD71   ; Entity Variable 6 (32 bytes)
entity_sm_var_7     EQU #DD91   ; Entity Variable 7 (32 bytes)

; ==================================================================
; SPRITE SYSTEM VARIABLES
; ==================================================================
entity_sprite_asset_index EQU #DDB1   ; Entity sprite asset index - RAM copy (32 bytes)
entity_sprite_config EQU #DDD1   ; Entity sprite config RAM copy (base HW sprite + layer count, 64 bytes)
sprite_asset_frame_count EQU #DE11   ; Sprite asset frame counts RAM copy (11 bytes)
sprite_asset_layer_count EQU #DE1C   ; Sprite asset layer counts RAM copy (11 bytes)
sprite_loop_flags EQU #DE27   ; Sprite loop flags RAM copy (11 bytes)
sprite_dir_left_table EQU #DE32   ; Directional sprite lookup RAM copy (11 bytes)
sprite_dir_right_table EQU #DE3D   ; Directional sprite lookup RAM copy (11 bytes)
sprite_dir_up_table EQU #DE48   ; Directional sprite lookup RAM copy (11 bytes)
sprite_dir_down_table EQU #DE53   ; Directional sprite lookup RAM copy (11 bytes)
SM_SpriteLayerColorTable EQU #DE5E   ; Runtime SM sprite layer colors (11*2 bytes)
SM_SpriteLayerYOffsetTable EQU #DE74   ; Runtime SM sprite layer Y offsets (11*2 bytes)
active_sprite_count EQU #DE8A   ; Number of sprites currently active
sprites_dirty      EQU #DE8B   ; 1=sprite_attributes changed, needs VRAM sync
sprite_pattern      EQU #DE8C   ; Sprite pattern IDs (32 bytes)
sprite_color        EQU #DEAC   ; Sprite colors (32 bytes)
sprite_layer_colors EQU #DECC   ; HW sprite layer color cache - RAM copy (32 bytes, indexed by HW sprite index)
sprite_layer_y_offsets EQU #DEEC   ; HW sprite layer signed Y offsets - RAM copy (32 bytes, indexed by HW sprite index)
sprite_asset_base_pattern_slot_runtime EQU #DF0C   ; Runtime base 16x16 slot per sprite asset (11 bytes)
sprite_placeholder_base_pattern_num EQU #DF17   ; Runtime placeholder pattern number (base slot * 4)
current_sprite_pattern_pack_id EQU #DF18   ; Active runtime sprite pattern pack id (#FF=none loaded)
sprite_attributes   EQU #DF19   ; Interleaved sprite attributes (32 * 4 bytes)

; ==================================================================
; SCREEN SYSTEM VARIABLES (4 screens detected)
; ==================================================================
current_screen_id   EQU #DF99   ; Currently displayed screen ID
current_screen_engine EQU #DF9A   ; Runtime engine: 0=Player, 1=FakePlayer
screen_dirty_flag   EQU #DF9B   ; Screen needs redraw flag
screen_transition_cooldown EQU #DF9C   ; Cooldown frames after screen transition
current_world_id    EQU #DF9D   ; Current world ID (for multi-world support)
current_screen_index EQU #DF9E   ; Current screen index within world
current_screen_anim_group_count EQU #DF9F   ; Animated tile groups visible in current screen
current_screen_entity_count EQU #DFA0   ; Entity instances assigned to current screen
current_screen_sprite_pattern_slots EQU #DFA1   ; Sprite pattern slots needed by current screen
current_screen_summary_flags EQU #DFA2   ; Runtime screen summary flags (music/hud/effects/anim)

; ==================================================================
; PLAYER SYSTEM VARIABLES (player entity detected)
; ==================================================================
player_x            EQU #DFA3   ; Player X position (16-bit)
player_y            EQU #DFA5   ; Player Y position (16-bit)
player_runtime_enabled EQU #DFA7   ; 1=player fast runtime bound to hero entity
player_entity_index EQU #DFA8   ; Entity index used by player fast runtime (#FF=none)
player_vx_runtime   EQU #DFA9   ; Cached player X velocity (signed 8-bit)
player_vy_runtime   EQU #DFAA   ; Cached player Y velocity (signed 8-bit)
player_dash_timer   EQU #DFAB   ; Frames remaining in current Player dash
player_dash_cooldown EQU #DFAC   ; Frames until Player can dash again
player_dash_dir     EQU #DFAD   ; Player dash direction (1=left,2=right,3=up,4=down)
player_dash_tile_x  EQU #DFAE   ; Dash front probe tile X scratch
player_dash_tile_y  EQU #DFAF   ; Dash front probe tile Y scratch
player_health       EQU #DFB0   ; Player health points
player_score        EQU #DFB1   ; Player score (16-bit)
gem_count           EQU #DFB3   ; Collectible tile counter (8-bit)
last_interaction_char EQU #DFB4   ; Char code of last interacted tile (for SM VARIABLE_COMPARE)
last_gem_char       EQU last_interaction_char   ; Backwards-compatible alias for collectible SM checks
last_interaction_pending EQU #DFB5   ; 1 when a new tile interaction is pending for State Machine logic
last_interaction_type EQU #DFB6   ; Interaction type id of last interacted tile
last_interaction_value EQU #DFB7   ; Interaction value byte of last interacted tile
last_interaction_target EQU #DFB8   ; Interaction target id of last interacted tile
last_interaction_x  EQU #DFB9   ; Tile X coordinate of last interaction
last_interaction_y  EQU #DFBA   ; Tile Y coordinate of last interaction
last_interaction_entity EQU #DFBB   ; Entity index that triggered the last interaction

; Persistent collectibles list (survives screen re-entry)
MAX_COLLECTIBLES     EQU 64              ; Max persistent collectible records
collected_count      EQU #DFBC   ; Number of collected tiles recorded (8-bit)
collected_world      EQU #DFBD   ; World IDs for each collected tile (MAX_COLLECTIBLES bytes)
collected_screen     EQU #DFFD   ; Screen IDs for each collected tile (MAX_COLLECTIBLES bytes)
collected_idx_l      EQU #E03D   ; Tile name-table index low byte (MAX_COLLECTIBLES bytes)
collected_idx_h      EQU #E07D   ; Tile name-table index high byte (MAX_COLLECTIBLES bytes)

; Timed bonus tile respawn slots (bonus gem regeneration)
MAX_BONUS_RESPAWNS   EQU 16              ; Max timed bonus tiles waiting to respawn
bonus_respawn_world  EQU #E0BD   ; World IDs for timed bonus respawns (MAX_BONUS_RESPAWNS bytes)
bonus_respawn_screen EQU #E0CD   ; Screen IDs for timed bonus respawns (MAX_BONUS_RESPAWNS bytes)
bonus_respawn_idx_l  EQU #E0DD   ; Tile index low byte for timed respawns (MAX_BONUS_RESPAWNS bytes)
bonus_respawn_idx_h  EQU #E0ED   ; Tile index high byte for timed respawns (MAX_BONUS_RESPAWNS bytes)
bonus_respawn_secs   EQU #E0FD   ; Remaining seconds per timed respawn slot (MAX_BONUS_RESPAWNS bytes)
bonus_respawn_frames EQU #E10D   ; Frame countdown (60..1) per timed respawn slot (MAX_BONUS_RESPAWNS bytes)

; ==================================================================
; AUXILIARY VARIABLES 
; ==================================================================
deterministic        EQU #E11D   ; Deterministic mode flag

; ==================================================================
; TEMPORARY VARIABLES (ALWAYS NEEDED)
; ==================================================================
temp_word_1         EQU #E11E   ; Temporary 16-bit storage
temp_word_2         EQU #E120   ; Temporary 16-bit storage
temp_byte_1         EQU #E122   ; Temporary 8-bit storage
temp_byte_2         EQU #E123   ; Temporary 8-bit storage
temp_byte_3         EQU #E124   ; Temporary 8-bit storage (32 bytes)
temp_byte_4         EQU #E144   ; Temporary 8-bit storage (32 bytes)
temp_byte_5         EQU #E164   ; Temporary 8-bit storage (32 bytes)
temp_byte_6         EQU #E184   ; Temporary 8-bit storage (32 bytes)

; ==================================================================
; SOUND SYSTEM VARIABLES
; ==================================================================
sfx_active          EQU #E1A4   ; 0=no SFX active, 1=playing
sfx_timer           EQU #E1A5   ; Frames remaining for current SFX
sfx_fadeout         EQU #E1A6   ; Reserved fadeout flag/state
temp_byte_7         EQU #E1A7   ; Temporary 8-bit storage (32 bytes)
temp_byte_8         EQU #E1C7   ; Temporary 8-bit storage (32 bytes)
temp_byte_9         EQU #E1E7   ; Temporary 8-bit storage (32 bytes)
temp_byte_10        EQU #E207   ; Temporary 8-bit storage (32 bytes)
temp_byte_11        EQU #E227   ; Temporary 8-bit storage (32 bytes)
temp_byte_12        EQU #E247   ; Temporary 8-bit storage (32 bytes)
temp_byte_13        EQU #E267   ; Temporary 8-bit storage (32 bytes)
temp_byte_14        EQU #E287   ; Temporary 8-bit storage (32 bytes)
temp_byte_15        EQU #E2A7   ; Temporary 8-bit storage (32 bytes)
temp_byte_16        EQU #E2C7   ; Temporary 8-bit storage (32 bytes)
temp_byte_17        EQU #E2E7   ; Temporary 8-bit storage (32 bytes)
temp_byte_18        EQU #E307   ; Temporary 8-bit storage (32 bytes)
temp_byte_19        EQU #E327   ; Temporary 8-bit storage (32 bytes)
temp_byte_20        EQU #E347   ; Temporary 8-bit storage (32 bytes)
temp_byte_21        EQU #E367   ; Temporary 8-bit storage (32 bytes)
temp_byte_22        EQU #E387   ; Temporary 8-bit storage (32 bytes)
temp_byte_23        EQU #E3A7   ; Temporary 8-bit storage (32 bytes)
temp_byte_24        EQU #E3C7   ; Temporary 8-bit storage (32 bytes)
temp_byte_25        EQU #E3E7   ; Temporary 8-bit storage (32 bytes)
temp_word_3         EQU #E407   ; Temporary 16-bit storage (64 bytes)
temp_word_4         EQU #E447   ; Temporary 16-bit storage (64 bytes)
temp_byte_26        EQU #E487   ; Temporary 8-bit storage (32 bytes)
temp_byte_27        EQU #E4A7   ; Temporary 8-bit storage (32 bytes)
temp_byte_28        EQU #E4C7   ; Temporary 8-bit storage (32 bytes)
tileDead_dbg        EQU #E4E7   ; Debug byte: current hero deadly contact
tileDead_latched_dbg EQU #E4E8   ; Debug byte: latched hero deadly contact
tileDead_x_dbg      EQU #E4E9   ; Debug byte: last sampled deadly tile X
tileDead_y_dbg      EQU #E4EA   ; Debug byte: last sampled deadly tile Y
tileDead_value_dbg  EQU #E4EB   ; Debug byte: last raw deadly behavior value

; Wall collision temporary variables
wall_temp_x         EQU #E4EC   ; Cached entity X for wall checks
wall_temp_y         EQU #E4ED   ; Cached entity Y for wall checks
wall_hit_left       EQU #E4EE   ; Hitbox left edge cache
wall_hit_top        EQU #E4EF   ; Hitbox top edge cache
wall_hit_right      EQU #E4F0   ; Hitbox right edge cache
wall_hit_bottom     EQU #E4F1   ; Hitbox bottom edge cache
wall_hit_w          EQU #E4F2   ; Hitbox width cache (min 1)
wall_hit_h          EQU #E4F3   ; Hitbox height cache (min 1)
wall_probe_left     EQU #E4F4   ; X probe near hitbox left (adaptive inset)
wall_probe_right    EQU #E4F5   ; X probe near hitbox right (adaptive inset)
wall_probe_top      EQU #E4F6   ; Y probe near hitbox top (adaptive inset)
wall_probe_bottom   EQU #E4F7   ; Y probe near hitbox bottom (adaptive inset)

; Unified update helpers
active_entity_list  EQU #E4F8   ; Entity indices with non-zero component masks (MAX_ENTITIES bytes)
active_entity_count EQU #E518   ; Number of entries in active_entity_list
hero_entity_id      EQU #E519   ; First current-screen entity flagged as player (#FF = none)
active_entity_list_dirty EQU #E51A   ; 1=rebuild active_entity_list required
input_entity_list   EQU #E51B   ; Active current-screen entities with Input component (MAX_ENTITIES bytes)
input_entity_count  EQU #E53B   ; Number of entries in input_entity_list
render_entity_list  EQU #E53C   ; Active current-screen entities with Sprite component (MAX_ENTITIES bytes)
render_entity_count EQU #E55C   ; Number of entries in render_entity_list
collision_entity_list EQU #E55D   ; Active current-screen entities with Collision component (MAX_ENTITIES bytes)
collision_entity_count EQU #E57D   ; Number of entries in collision_entity_list
ground_entity_list  EQU #E57E   ; Active current-screen entities with Collision or Gravity (MAX_ENTITIES bytes)
ground_entity_count EQU #E59E   ; Number of entries in ground_entity_list
anim_entity_list    EQU #E59F   ; Active current-screen entities with Animation+Sprite (MAX_ENTITIES bytes)
anim_entity_count   EQU #E5BF   ; Number of entries in anim_entity_list

; Entity-entity collision optimized variables
coll_list           EQU #E5C0   ; Active collidable entity indices (MAX_ENTITIES bytes)
coll_list_count     EQU #E5E0   ; Number of entities in coll_list
coll_src_left       EQU #E5E1   ; Source AABB left edge (scratch)
coll_src_right      EQU #E5E2   ; Source AABB right edge (scratch)
coll_src_top        EQU #E5E3   ; Source AABB top edge (scratch)
coll_src_bottom     EQU #E5E4   ; Source AABB bottom edge (scratch)

; ==================================================================
; INTERRUPT SYSTEM VARIABLES (dynamically allocated)
; ==================================================================
task_table              EQU #E5E5   ; Task table base (8 slots x 2 bytes = 16 bytes)
task_0_ptr              EQU #E5E5   ; Slot 0 pointer (2 bytes)
task_1_ptr              EQU #E5E7   ; Slot 1 pointer (2 bytes)
task_2_ptr              EQU #E5E9   ; Slot 2 pointer (2 bytes)
task_3_ptr              EQU #E5EB   ; Slot 3 pointer (2 bytes)
task_4_ptr              EQU #E5ED   ; Slot 4 pointer (2 bytes)
task_5_ptr              EQU #E5EF   ; Slot 5 pointer (2 bytes)
task_6_ptr              EQU #E5F1   ; Slot 6 pointer (2 bytes)
task_7_ptr              EQU #E5F3   ; Slot 7 pointer (2 bytes)
interrupt_system_enabled EQU #E5F5   ; 0=disabled, 1=enabled (1 byte)
old_htimi_hook          EQU #E5F6   ; Original H.TIMI hook (5 bytes)
interrupt_counter       EQU #E5FB   ; Frame counter (16-bit)
task_exec_time          EQU #E5FD   ; Cycles used by tasks (16-bit, debug)
vblank_flag             EQU #E5FF   ; Set to 1 on each VBlank (1 byte)
interrupt_in_progress   EQU #E600   ; 1 while the H.TIMI dispatcher is running
RAM_INTERRUPT_END       EQU #E601   ; End of interrupt system

; ==================================================================
; STATE MACHINE SOUND RUNTIME (one active sound asset)
; ==================================================================
sm_sound_active       EQU #E601   ; 0=idle, 1=playing state-machine sound asset
sm_sound_frames_left  EQU #E602   ; Frames left for current state-machine sound asset
sm_sound_ptr_l        EQU #E603   ; Next sound frame pointer low byte
sm_sound_ptr_h        EQU #E604   ; Next sound frame pointer high byte

; ==================================================================
; TRACKER MUSIC RUNTIME
; ==================================================================
music_active         EQU #E605   ; 0=stopped, 1=track active
music_muted          EQU #E606   ; 0=audible, 1=muted/pause
music_loop           EQU #E607   ; 0=no loop, 1=loop enabled
music_track_index    EQU #E608   ; Current ROM track index
music_row_frames     EQU #E609   ; Frames per tracker row
music_row_countdown  EQU #E60A   ; Countdown to next row
music_order_pos      EQU #E60B   ; Current order position
music_pattern_index  EQU #E60C   ; Current pattern index
music_pattern_row    EQU #E60D   ; Current row inside pattern
music_pattern_rows   EQU #E60E   ; Cached rows in current pattern
music_track_ptr_l    EQU #E60F   ; Current track pointer low byte
music_track_ptr_h    EQU #E610   ; Current track pointer high byte
music_pattern_ptr_l  EQU #E611   ; Current pattern rows pointer low byte
music_pattern_ptr_h  EQU #E612   ; Current pattern rows pointer high byte
music_mixer_shadow   EQU #E613   ; PSG mixer shadow for music runtime
music_pitch_note_work EQU #E614   ; Scratch note index while resolving tone/ornament macros
music_pitch_step_work EQU #E615   ; Scratch macro step while resolving tone/ornament macros
music_pitch_len_work  EQU #E616   ; Scratch macro length while resolving tone/ornament macros
music_ch_note_base EQU #E617   ; Current note index (255=silent) (3 bytes)
music_ch_a_note EQU #E617   ; Channel A
music_ch_b_note EQU #E618   ; Channel B
music_ch_c_note EQU #E619   ; Channel C
music_ch_instrument_base EQU #E61A   ; Current instrument id (0=none) (3 bytes)
music_ch_a_instrument EQU #E61A   ; Channel A
music_ch_b_instrument EQU #E61B   ; Channel B
music_ch_c_instrument EQU #E61C   ; Channel C
music_ch_ornament_base EQU #E61D   ; Current ornament id (0=none) (3 bytes)
music_ch_a_ornament EQU #E61D   ; Channel A
music_ch_b_ornament EQU #E61E   ; Channel B
music_ch_c_ornament EQU #E61F   ; Channel C
music_ch_volume_base EQU #E620   ; Current base volume (0-15) (3 bytes)
music_ch_a_volume EQU #E620   ; Channel A
music_ch_b_volume EQU #E621   ; Channel B
music_ch_c_volume EQU #E622   ; Channel C
music_ch_vol_step_base EQU #E623   ; Reserved software volume envelope step (3 bytes)
music_ch_a_vol_step EQU #E623   ; Channel A
music_ch_b_vol_step EQU #E624   ; Channel B
music_ch_c_vol_step EQU #E625   ; Channel C
music_ch_tone_step_base EQU #E626   ; Reserved software tone envelope step (3 bytes)
music_ch_a_tone_step EQU #E626   ; Channel A
music_ch_b_tone_step EQU #E627   ; Channel B
music_ch_c_tone_step EQU #E628   ; Channel C
music_ch_noise_step_base EQU #E629   ; Reserved software noise envelope step (3 bytes)
music_ch_a_noise_step EQU #E629   ; Channel A
music_ch_b_noise_step EQU #E62A   ; Channel B
music_ch_c_noise_step EQU #E62B   ; Channel C
music_ch_orn_step_base EQU #E62C   ; Reserved ornament step (3 bytes)
music_ch_a_orn_step EQU #E62C   ; Channel A
music_ch_b_orn_step EQU #E62D   ; Channel B
music_ch_c_orn_step EQU #E62E   ; Channel C
music_ch_hw_env_step_base EQU #E62F   ; Software hardware-envelope divider step (3 bytes)
music_ch_a_hw_env_step EQU #E62F   ; Channel A
music_ch_b_hw_env_step EQU #E630   ; Channel B
music_ch_c_hw_env_step EQU #E631   ; Channel C

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
RAM_USAGE_END       EQU #E632   ; End of project variables (9778 bytes used)

; ==================================================================
; MEMORY LAYOUT INFO (Reference only - no code generated)
; ==================================================================
; RAM Layout:
;   #C000-#E632: Project variables (9778 bytes)
;   #E632-#E700: Alignment padding/free RAM (206 bytes)
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
RESOURCE_ID_BOLA_DEAD_3_F0_LAYER1        EQU 8
RESOURCE_ID_BOLA_DEAD_3_F1_LAYER1        EQU 9
RESOURCE_ID_BOLA_DEAD_3_F2_LAYER1        EQU 10
RESOURCE_ID_BOLA_DEAD_3_F3_LAYER1        EQU 11
RESOURCE_ID_BOLA_DEAD_3_F4_LAYER1        EQU 12
RESOURCE_ID_NINA_WALK_LEFT_4_F0_LAYER0   EQU 13
RESOURCE_ID_NINA_WALK_LEFT_4_F0_LAYER1   EQU 14
RESOURCE_ID_NINA_WALK_LEFT_4_F1_LAYER0   EQU 15
RESOURCE_ID_NINA_WALK_LEFT_4_F1_LAYER1   EQU 16
RESOURCE_ID_NINA_IDLE_LEFT_5_F0_LAYER1   EQU 17
RESOURCE_ID_NINA_IDLE_LEFT_5_F0_LAYER2   EQU 18
RESOURCE_ID_NINA_JUMP_LEFT_6_F0_LAYER0   EQU 19
RESOURCE_ID_NINA_JUMP_LEFT_6_F0_LAYER1   EQU 20
RESOURCE_ID_ANEC_LEFT_7_F0_LAYER1        EQU 21
RESOURCE_ID_ANEC_LEFT_7_F0_LAYER2        EQU 22
RESOURCE_ID_ANEC_LEFT_7_F1_LAYER1        EQU 23
RESOURCE_ID_ANEC_LEFT_7_F1_LAYER2        EQU 24
RESOURCE_ID_NINA_WALK_RIGHT_8_F0_LAYER0  EQU 25
RESOURCE_ID_NINA_WALK_RIGHT_8_F0_LAYER1  EQU 26
RESOURCE_ID_NINA_WALK_RIGHT_8_F1_LAYER0  EQU 27
RESOURCE_ID_NINA_WALK_RIGHT_8_F1_LAYER1  EQU 28
RESOURCE_ID_NINA_IDLE_RIGHT_9_F0_LAYER1  EQU 29
RESOURCE_ID_NINA_IDLE_RIGHT_9_F0_LAYER2  EQU 30
RESOURCE_ID_NINA_JUMP_RIGHT_10_F0_LAYER0 EQU 31
RESOURCE_ID_NINA_JUMP_RIGHT_10_F0_LAYER1 EQU 32
RESOURCE_ID_SPRITE_PLACEHOLDER_PATTERN   EQU 33
RESOURCE_ID_TILE_PATTERN_BANK0           EQU 34
RESOURCE_ID_TILEBANK_PATTERN_DATA_0      EQU 35
RESOURCE_ID_TILE_COLOR_BANK0             EQU 36
RESOURCE_ID_TILEBANK_COLOR_DATA_0        EQU 37
RESOURCE_ID_SCREEN_PAN1_0_LAYOUT         EQU 38
RESOURCE_ID_SCREEN_PAN1_0_EFFECTS_LAYOUT EQU 39
RESOURCE_ID_SCREEN_PAN1_0_EFFECT_ZONE_TABLE EQU 40
RESOURCE_ID_SCREEN_PAN1_0_BOSS_TABLE     EQU 41
RESOURCE_ID_BEHAVIOR_PAN1_0_DATA         EQU 42
RESOURCE_ID_SCREEN_PAN1_0_INTERACTION_TYPE_MAP EQU 43
RESOURCE_ID_SCREEN_PAN1_0_INTERACTION_VALUE_MAP EQU 44
RESOURCE_ID_SCREEN_PAN1_0_INTERACTION_TARGET_MAP EQU 45
RESOURCE_ID_SCREEN_PAN2_1_LAYOUT         EQU 46
RESOURCE_ID_SCREEN_PAN2_1_EFFECTS_LAYOUT EQU 47
RESOURCE_ID_SCREEN_PAN2_1_EFFECT_ZONE_TABLE EQU 48
RESOURCE_ID_SCREEN_PAN2_1_BOSS_TABLE     EQU 49
RESOURCE_ID_BEHAVIOR_PAN2_1_DATA         EQU 50
RESOURCE_ID_SCREEN_PAN2_1_INTERACTION_TYPE_MAP EQU 51
RESOURCE_ID_SCREEN_PAN2_1_INTERACTION_VALUE_MAP EQU 52
RESOURCE_ID_SCREEN_PAN2_1_INTERACTION_TARGET_MAP EQU 53
RESOURCE_ID_SCREEN_BACKGROUND1_2_LAYOUT  EQU 54
RESOURCE_ID_SCREEN_BACKGROUND1_2_EFFECTS_LAYOUT EQU 55
RESOURCE_ID_SCREEN_BACKGROUND1_2_EFFECT_ZONE_TABLE EQU 56
RESOURCE_ID_SCREEN_BACKGROUND1_2_BOSS_TABLE EQU 57
RESOURCE_ID_BEHAVIOR_BACKGROUND1_2_DATA  EQU 58
RESOURCE_ID_SCREEN_BACKGROUND1_2_INTERACTION_TYPE_MAP EQU 59
RESOURCE_ID_SCREEN_BACKGROUND1_2_INTERACTION_VALUE_MAP EQU 60
RESOURCE_ID_SCREEN_BACKGROUND1_2_INTERACTION_TARGET_MAP EQU 61
RESOURCE_ID_SCREEN_PAN3_3_LAYOUT         EQU 62
RESOURCE_ID_SCREEN_PAN3_3_EFFECTS_LAYOUT EQU 63
RESOURCE_ID_SCREEN_PAN3_3_EFFECT_ZONE_TABLE EQU 64
RESOURCE_ID_SCREEN_PAN3_3_BOSS_TABLE     EQU 65
RESOURCE_ID_BEHAVIOR_PAN3_3_DATA         EQU 66
RESOURCE_ID_SCREEN_PAN3_3_INTERACTION_TYPE_MAP EQU 67
RESOURCE_ID_SCREEN_PAN3_3_INTERACTION_VALUE_MAP EQU 68
RESOURCE_ID_SCREEN_PAN3_3_INTERACTION_TARGET_MAP EQU 69

; ==================================================================
; GENERATED RESOURCE TABLE
; Descriptor format: db bank / dw address / dw stored_size / dw raw_size / db flags
; Resource id is the zero-based descriptor index.
; Address is the mapper-window address visible after selecting bank.
; RESOURCE_FLAG_COMPRESSED_ZX0 means stored_size is compressed and raw_size is output size.
; ==================================================================
RESOURCE_TABLE_ENTRY_SIZE EQU 8
RESOURCE_FLAG_COMPRESSED_ZX0 EQU #01
RESOURCE_TABLE_COUNT EQU 70

resource_table:
    ; ANEC_RIGHT_0_F0_LAYER1
    db 17
    dw #A1BB
    dw 32
    dw 32
    db 0
    ; ANEC_RIGHT_0_F0_LAYER2
    db 17
    dw #A1DB
    dw 29
    dw 29
    db 0
    ; ANEC_RIGHT_0_F1_LAYER1
    db 17
    dw #A1F8
    dw 32
    dw 32
    db 0
    ; ANEC_RIGHT_0_F1_LAYER2
    db 17
    dw #A218
    dw 28
    dw 28
    db 0
    ; BOLA_1_F0_LAYER1
    db 17
    dw #A234
    dw 25
    dw 25
    db 0
    ; BOLA_1_F1_LAYER1
    db 17
    dw #A24D
    dw 29
    dw 29
    db 0
    ; PANELL_2_F0_LAYER1
    db 17
    dw #A26A
    dw 20
    dw 20
    db 0
    ; PANELL_2_F0_LAYER2
    db 17
    dw #A314
    dw 14
    dw 14
    db 0
    ; BOLA_DEAD_3_F0_LAYER1
    db 17
    dw #A322
    dw 32
    dw 32
    db 0
    ; BOLA_DEAD_3_F1_LAYER1
    db 17
    dw #A342
    dw 32
    dw 32
    db 0
    ; BOLA_DEAD_3_F2_LAYER1
    db 17
    dw #A362
    dw 32
    dw 32
    db 0
    ; BOLA_DEAD_3_F3_LAYER1
    db 17
    dw #A382
    dw 28
    dw 28
    db 0
    ; BOLA_DEAD_3_F4_LAYER1
    db 17
    dw #A39E
    dw 5
    dw 5
    db 0
    ; NINA_WALK_LEFT_4_F0_LAYER0
    db 17
    dw #A3A3
    dw 28
    dw 28
    db 0
    ; NINA_WALK_LEFT_4_F0_LAYER1
    db 17
    dw #A3BF
    dw 25
    dw 25
    db 0
    ; NINA_WALK_LEFT_4_F1_LAYER0
    db 17
    dw #A3D8
    dw 30
    dw 30
    db 0
    ; NINA_WALK_LEFT_4_F1_LAYER1
    db 17
    dw #A3F6
    dw 30
    dw 30
    db 0
    ; NINA_IDLE_LEFT_5_F0_LAYER1
    db 17
    dw #A414
    dw 24
    dw 24
    db 0
    ; NINA_IDLE_LEFT_5_F0_LAYER2
    db 17
    dw #A42C
    dw 29
    dw 29
    db 0
    ; NINA_JUMP_LEFT_6_F0_LAYER0
    db 17
    dw #A449
    dw 30
    dw 30
    db 0
    ; NINA_JUMP_LEFT_6_F0_LAYER1
    db 17
    dw #A467
    dw 28
    dw 28
    db 0
    ; ANEC_LEFT_7_F0_LAYER1
    db 17
    dw #A483
    dw 32
    dw 32
    db 0
    ; ANEC_LEFT_7_F0_LAYER2
    db 17
    dw #A4A3
    dw 29
    dw 29
    db 0
    ; ANEC_LEFT_7_F1_LAYER1
    db 17
    dw #A50E
    dw 32
    dw 32
    db 0
    ; ANEC_LEFT_7_F1_LAYER2
    db 17
    dw #A52E
    dw 29
    dw 29
    db 0
    ; NINA_WALK_RIGHT_8_F0_LAYER0
    db 17
    dw #A54B
    dw 30
    dw 30
    db 0
    ; NINA_WALK_RIGHT_8_F0_LAYER1
    db 17
    dw #A569
    dw 25
    dw 25
    db 0
    ; NINA_WALK_RIGHT_8_F1_LAYER0
    db 17
    dw #A582
    dw 31
    dw 31
    db 0
    ; NINA_WALK_RIGHT_8_F1_LAYER1
    db 17
    dw #A5A1
    dw 27
    dw 27
    db 0
    ; NINA_IDLE_RIGHT_9_F0_LAYER1
    db 17
    dw #A5BC
    dw 24
    dw 24
    db 0
    ; NINA_IDLE_RIGHT_9_F0_LAYER2
    db 17
    dw #A5D4
    dw 30
    dw 30
    db 0
    ; NINA_JUMP_RIGHT_10_F0_LAYER0
    db 17
    dw #A5F2
    dw 30
    dw 30
    db 0
    ; NINA_JUMP_RIGHT_10_F0_LAYER1
    db 17
    dw #A610
    dw 28
    dw 28
    db 0
    ; SPRITE_PLACEHOLDER_PATTERN
    db 17
    dw #A62C
    dw 5
    dw 5
    db 0
    ; tile_pattern_bank0
    db 17
    dw #A109
    dw 62
    dw 62
    db 0
    ; tilebank_pattern_data_0
    db 17
    dw #A147
    dw 62
    dw 62
    db 0
    ; tile_color_bank0
    db 17
    dw #A185
    dw 27
    dw 27
    db 0
    ; tilebank_color_data_0
    db 17
    dw #A1A0
    dw 27
    dw 27
    db 0
    ; SCREEN_PAN1_0_LAYOUT
    db 17
    dw #A000
    dw 105
    dw 768
    db 1
    ; SCREEN_PAN1_0_EFFECTS_LAYOUT
    db 17
    dw #A000
    dw 6
    dw 6
    db 0
    ; SCREEN_PAN1_0_EFFECT_ZONE_TABLE
    db 17
    dw #A631
    dw 1
    dw 1
    db 0
    ; SCREEN_PAN1_0_BOSS_TABLE
    db 17
    dw #A632
    dw 1
    dw 1
    db 0
    ; BEHAVIOR_PAN1_0_DATA
    db 17
    dw #A006
    dw 64
    dw 64
    db 0
    ; SCREEN_PAN1_0_INTERACTION_TYPE_MAP
    db 17
    dw #A046
    dw 15
    dw 15
    db 0
    ; SCREEN_PAN1_0_INTERACTION_VALUE_MAP
    db 17
    dw #A055
    dw 62
    dw 62
    db 0
    ; SCREEN_PAN1_0_INTERACTION_TARGET_MAP
    db 17
    dw #A093
    dw 6
    dw 6
    db 0
    ; SCREEN_PAN2_1_LAYOUT
    db 17
    dw #A099
    dw 52
    dw 52
    db 0
    ; SCREEN_PAN2_1_EFFECTS_LAYOUT
    db 17
    dw #A0CD
    dw 6
    dw 6
    db 0
    ; SCREEN_PAN2_1_EFFECT_ZONE_TABLE
    db 17
    dw #A633
    dw 1
    dw 1
    db 0
    ; SCREEN_PAN2_1_BOSS_TABLE
    db 17
    dw #A634
    dw 1
    dw 1
    db 0
    ; BEHAVIOR_PAN2_1_DATA
    db 17
    dw #A0D3
    dw 40
    dw 40
    db 0
    ; SCREEN_PAN2_1_INTERACTION_TYPE_MAP
    db 17
    dw #A0FB
    dw 14
    dw 14
    db 0
    ; SCREEN_PAN2_1_INTERACTION_VALUE_MAP
    db 17
    dw #A27E
    dw 40
    dw 40
    db 0
    ; SCREEN_PAN2_1_INTERACTION_TARGET_MAP
    db 17
    dw #A2A6
    dw 6
    dw 6
    db 0
    ; SCREEN_BACKGROUND1_2_LAYOUT
    db 17
    dw #A2AC
    dw 6
    dw 6
    db 0
    ; SCREEN_BACKGROUND1_2_EFFECTS_LAYOUT
    db 17
    dw #A2B2
    dw 6
    dw 6
    db 0
    ; SCREEN_BACKGROUND1_2_EFFECT_ZONE_TABLE
    db 17
    dw #A635
    dw 1
    dw 1
    db 0
    ; SCREEN_BACKGROUND1_2_BOSS_TABLE
    db 17
    dw #A636
    dw 1
    dw 1
    db 0
    ; BEHAVIOR_BACKGROUND1_2_DATA
    db 17
    dw #A2B8
    dw 6
    dw 6
    db 0
    ; SCREEN_BACKGROUND1_2_INTERACTION_TYPE_MAP
    db 17
    dw #A2BE
    dw 6
    dw 6
    db 0
    ; SCREEN_BACKGROUND1_2_INTERACTION_VALUE_MAP
    db 17
    dw #A2C4
    dw 6
    dw 6
    db 0
    ; SCREEN_BACKGROUND1_2_INTERACTION_TARGET_MAP
    db 17
    dw #A2CA
    dw 6
    dw 6
    db 0
    ; SCREEN_PAN3_3_LAYOUT
    db 17
    dw #A2D0
    dw 62
    dw 62
    db 0
    ; SCREEN_PAN3_3_EFFECTS_LAYOUT
    db 17
    dw #A30E
    dw 6
    dw 6
    db 0
    ; SCREEN_PAN3_3_EFFECT_ZONE_TABLE
    db 17
    dw #A637
    dw 1
    dw 1
    db 0
    ; SCREEN_PAN3_3_BOSS_TABLE
    db 17
    dw #A638
    dw 1
    dw 1
    db 0
    ; BEHAVIOR_PAN3_3_DATA
    db 17
    dw #A4C0
    dw 33
    dw 33
    db 0
    ; SCREEN_PAN3_3_INTERACTION_TYPE_MAP
    db 17
    dw #A4E1
    dw 6
    dw 6
    db 0
    ; SCREEN_PAN3_3_INTERACTION_VALUE_MAP
    db 17
    dw #A4E7
    dw 33
    dw 33
    db 0
    ; SCREEN_PAN3_3_INTERACTION_TARGET_MAP
    db 17
    dw #A508
    dw 6
    dw 6
    db 0

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

init_boss_system_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_6
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
    ld a, FAR_BANK_6
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
    ld a, FAR_BANK_6
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
    ld a, FAR_BANK_6
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

; --- Far bank 7 [#6000, window P1] trampolines ---
FAR_BANK_7 EQU 7

init_sprites_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_7
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
    ld a, FAR_BANK_7
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
    ld a, FAR_BANK_7
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
    ld a, FAR_BANK_7
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
    ld a, FAR_BANK_7
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
    ld a, FAR_BANK_7
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
    ld a, FAR_BANK_7
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

; --- Far bank 8 [#6000, window P1] trampolines ---
FAR_BANK_8 EQU 8

init_sound_system_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_8
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
    ld a, FAR_BANK_8
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
    ld a, FAR_BANK_8
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
    ld a, FAR_BANK_8
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
    ld a, FAR_BANK_8
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
    ld a, FAR_BANK_8
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
    ld a, FAR_BANK_8
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

; --- Far bank 9 [#6000, window P1] trampolines ---
FAR_BANK_9 EQU 9

load_world_default_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_9
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
    ld a, FAR_BANK_9
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
    ld a, FAR_BANK_9
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
    ld a, FAR_BANK_9
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
    ld a, FAR_BANK_9
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

; --- Far bank 10 [#6000, window P1] trampolines ---
FAR_BANK_10 EQU 10

init_font_system_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_10
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
    ld a, FAR_BANK_10
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

print_string_screen2_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_10
    call mapper_set_bank_p1
    call print_string_screen2
    pop af
    call mapper_set_bank_p1
    ld a, (interrupt_in_progress)
    or a
    jp nz, .print_string_screen2_far_irq_done
    ei
.print_string_screen2_far_irq_done:
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

init_animated_tiles_far:
    push af
    di
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_12
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
    ld a, FAR_BANK_12
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
    ld a, FAR_BANK_12
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

; --- Far bank 16 [#6000, window P1] trampolines ---
FAR_BANK_16 EQU 16

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

call_print_string_screen2_resident:
    jp print_string_screen2_far

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

call_apply_collected_tiles_resident:
    call mapper_push_p1
    ld a, 1
    call mapper_set_bank_p1
    call apply_collected_tiles
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
BANK_0_USED_END:
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
;   Active entities: 3
;   Used components: Position, Sprite, Animation, Patrol, Collision, Input, Cursors, Gravity, WallCollision, Jump, StateMachine, TileInteraction
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
    ; Used: Position, Sprite, Animation, Patrol, Collision, Input, Cursors, Gravity, WallCollision, Jump, StateMachine, TileInteraction 
 
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
    pop af                         ; Saved runtime was nonzero; force it back on.
    ld a, 1
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

interaction_target_variable_word_table:
    db 0
    db 1


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
; ------------------------------------------------------------------
; update_slash_component
; Filtered out: no tile bonus uses grant_extra_jump/slash in this project.
; Public label is kept because older generated call paths may still reference it.
; ------------------------------------------------------------------
update_slash_component:
    ret
record_bonus_respawn_slot:
    ret

update_bonus_respawns:
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

    jp .ti_collect_gem_normal

.ti_collect_gem_normal:
    call interaction_clear_vram_tile_at_de

    ; 3. Increment gem_count
    ld hl, gem_count
    inc (hl)

    ; No targetVariable/incrementAmount configured in the Tile Collector UI.

    ; No flagVariable configured in the Tile Collector UI.

    call interaction_add_last_value_default1

    ; No collectionSoundId configured in the Tile Collector UI.


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

    ; No supported bonus entity effect configured.


    ; No bonusSoundId configured.


    ; Bonus tile is visit-local only: do not persist across screen reloads.
    jp .ti_next


.ti_no_collect:
    pop hl                         ; Balance idx push
    pop de                         ; Balance tileX/tileY push

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
    pop af                         ; Saved runtime was nonzero; force it back on.
    ld a, 1
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
    ld a, 1
    ret
.pfd_left:
    ld b, #F8
    xor a
    call player_fast_dash_store_velocity_c
    ld a, 1
    ret
.pfd_up:
    ld b, 0
    ld a, #F8
    call player_fast_dash_store_velocity_c
    ld a, 1
    ret
.pfd_down:
    ld b, 0
    ld a, 8
    call player_fast_dash_store_velocity_c
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
    ret
player_dash_hit_boss_weakpoint:
    ret
player_dash_cleanup_dead_boss_attacks:
    ret
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
BANK_1_USED_END:
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
    DW Action_Nop ; 9 [Action_PlaySound stripped]
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

; [Action_PlaySound stripped - not used]

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

; [SM_PlaySoundAsset stripped - not used]

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

; [SM_PlaySfx_Beep stripped - not used]

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
SM_SpriteAssetCount EQU 11
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

; ==================================================================
; STATE MACHINE SOUND ASSET TABLES
; PLAY_SOUND exports a one-shot 60Hz frame stream per sound asset.
; Channel loops are flattened to a single pass to avoid stuck PSG.
; Hardware envelopes are not emitted yet in this state-machine path.
; ==================================================================
SM_SoundFrameSize EQU 11
SM_SoundAssetCount EQU 0
SM_SoundPtrTable:
    DW 0

; State Machine: New Statemachine (statemachine_1771533517310) 
SM_New_Statemachine_state_1771533526010: 
    DB 0; ID(unused) 
    DW SM_New_Statemachine_state_1771533526010_OnEnter 
    DW 0 
    DW SM_New_Statemachine_state_1771533526010_Transitions 
SM_New_Statemachine_state_1771533526010_OnEnter: 
    DB 5; CHANGE_SPRITE 
    DB 5; sprite: nina_idle 
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
    DB 3, 2, 0, 0; vy (ID 3) > 0
    DW SM_New_Statemachine_state_1772025558931 
    DW SM_New_Statemachine_state_1771533526010_Transitions_Actions_1 
    DB 8; HAS_COLLISION 
    DB 2          ; collisionType: enemy
    DW SM_New_Statemachine_state_1771533530403 
    DW SM_New_Statemachine_state_1771533526010_Transitions_Actions_2 

SM_New_Statemachine_state_1771533526010_Transitions_Actions_1: 
    DB 5; CHANGE_SPRITE 
    DB 6; sprite: nina_jump 
    DB 0xFF; END
SM_New_Statemachine_state_1771533526010_Transitions_Actions_2: 
    DB 5; CHANGE_SPRITE 
    DB 2; sprite: panell 
    DB 0xFF; END

SM_New_Statemachine_state_1771533530403: 
    DB 0; ID(unused) 
    DW 0 
    DW 0 
    DW 0 

SM_New_Statemachine_state_1771966990568: 
    DB 0; ID(unused) 
    DW SM_New_Statemachine_state_1771966990568_OnEnter 
    DW 0 
    DW SM_New_Statemachine_state_1771966990568_Transitions 
SM_New_Statemachine_state_1771966990568_OnEnter: 
    DB 5; CHANGE_SPRITE 
    DB 4; sprite: nina_walk 
    DB 0xFF; END
SM_New_Statemachine_state_1771966990568_Transitions: 
    DB 2; Count
    DB 14; VARIABLE_COMPARE 
    DB 2, 0, 0, 0; vx (ID 2) == 0
    DW SM_New_Statemachine_state_1771533526010 
    DW 0 
    DB 8; HAS_COLLISION 
    DB 2          ; collisionType: enemy
    DW SM_New_Statemachine_state_1771533530403 
    DW SM_New_Statemachine_state_1771966990568_Transitions_Actions_1 

SM_New_Statemachine_state_1771966990568_Transitions_Actions_1: 
    DB 5; CHANGE_SPRITE 
    DB 2; sprite: panell 
    DB 0xFF; END

SM_New_Statemachine_state_1772025558931: 
    DB 0; ID(unused) 
    DW SM_New_Statemachine_state_1772025558931_OnEnter 
    DW 0 
    DW SM_New_Statemachine_state_1772025558931_Transitions 
SM_New_Statemachine_state_1772025558931_OnEnter: 
    DB 5; CHANGE_SPRITE 
    DB 6; sprite: nina_jump 
    DB 0xFF; END
SM_New_Statemachine_state_1772025558931_Transitions: 
    DB 2; Count
    DB 14; VARIABLE_COMPARE 
    DB 3, 2, 0, 0; vy (ID 3) > 0
    DW SM_New_Statemachine_state_1772025563321 
    DW 0 
    DB 8; HAS_COLLISION 
    DB 2          ; collisionType: enemy
    DW SM_New_Statemachine_state_1771533530403 
    DW SM_New_Statemachine_state_1772025558931_Transitions_Actions_1 

SM_New_Statemachine_state_1772025558931_Transitions_Actions_1: 
    DB 5; CHANGE_SPRITE 
    DB 2; sprite: panell 
    DB 0xFF; END

SM_New_Statemachine_state_1772025563321: 
    DB 0; ID(unused) 
    DW SM_New_Statemachine_state_1772025563321_OnEnter 
    DW 0 
    DW SM_New_Statemachine_state_1772025563321_Transitions 
SM_New_Statemachine_state_1772025563321_OnEnter: 
    DB 5; CHANGE_SPRITE 
    DB 6; sprite: nina_jump 
    DB 0xFF; END
SM_New_Statemachine_state_1772025563321_Transitions: 
    DB 2; Count
    DB 14; VARIABLE_COMPARE 
    DB 3, 0, 0, 0; vy (ID 3) == 0
    DW SM_New_Statemachine_state_1772025566187 
    DW 0 
    DB 8; HAS_COLLISION 
    DB 2          ; collisionType: enemy
    DW SM_New_Statemachine_state_1771533530403 
    DW SM_New_Statemachine_state_1772025563321_Transitions_Actions_1 

SM_New_Statemachine_state_1772025563321_Transitions_Actions_1: 
    DB 5; CHANGE_SPRITE 
    DB 2; sprite: panell 
    DB 0xFF; END

SM_New_Statemachine_state_1772025566187: 
    DB 0; ID(unused) 
    DW SM_New_Statemachine_state_1772025566187_OnEnter 
    DW 0 
    DW SM_New_Statemachine_state_1772025566187_Transitions 
SM_New_Statemachine_state_1772025566187_OnEnter: 
    DB 5; CHANGE_SPRITE 
    DB 5; sprite: nina_idle 
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
    DB 2; sprite: panell 
    DB 0xFF; END



; --- End of Bank 2 — pad to 8KB boundary ---
BANK_2_USED_END:
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
; Total Nodes: 8
; Total Connections: 9
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
    cp NODE_TYPE_TEXT
    jp z, gameflow_handle_text
    cp NODE_TYPE_SUB_MENU
    jp z, gameflow_handle_submenu
    cp NODE_TYPE_TRANSITION
    jp z, gameflow_handle_transition
    
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

gameflow_handle_text:
    ; Text node - show text screen and wait for fire
    ; DE = text data pointer (pre-computed lines table)
    ; BC = connection table

    push bc

    ; Show text screen (full screen with title, message, prompt)
    call show_text_screen

    ; Wait for fire button
    call wait_for_fire

    ; Continue to next node
    pop bc
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

; ------------------------------------------------------------------
; show_text_screen
; Display full text screen with optional background screen asset
; Input: DE = text data pointer
;   Format: DB bgColor, DW screen_load_ptr (0=none), DB screen_load_bank, DB numLines
;           Per line: DB row, DB col, DW string_ptr
; If screen_load_ptr != 0: calls that function to load background screen
; (the load_screen function sets VDP colors and name table from screen asset)
; If screen_load_ptr == 0: sets bgColor, clears screen, renders text on solid bg
; ------------------------------------------------------------------
show_text_screen:
    push bc
    push de
    push hl

    ex de, hl                     ; HL = data pointer

    ; Read bgColor, screen load function pointer, and screen load bank
    ld a, (hl)                    ; A = bgColor
    inc hl
    ld c, (hl)                    ; C = screen_load_ptr low
    inc hl
    ld b, (hl)                    ; B = screen_load_ptr high
    inc hl                        ; BC = load function ptr (0 = no bg screen)
    ld e, (hl)                    ; E = screen_load_bank
    inc hl

    push hl                       ; (1) Save pointer to numLines
    push af                       ; (2) Save bgColor
    push bc                       ; (3) Save function pointer
    push de                       ; (4) Save bank byte (E)

    ; Disable screen before any VRAM write
    call DISSCR

    ; Check if we have a background screen to load
    pop de                        ; (4) Restore bank byte (E)
    pop bc                        ; (3) Restore function pointer
    ld a, b
    or c
    jr z, .sts_no_bg_screen

    ; Has background screen: mapper-safe call to load_screen_X
    ; (load_screen sets VDP colors + writes name table)
    ld h, b
    ld l, c                       ; HL = function address
    ld a, e                       ; A = screen_load_bank
    call mapper_call_hl_auto
    pop af                        ; (2) Discard saved bgColor (screen set its own colors)
    jp .sts_render

.sts_no_bg_screen:
    ; No background screen: set solid color and clear
    pop af                        ; (2) Restore bgColor
    ld b, a                       ; B = border color (same as bg)
    push af
    call call_set_screen_colors_resident
    pop af
    call call_init_char0_color_resident

    ; Clear entire screen (24 rows)
    ld a, 0
    ld b, 24
.sts_clear_loop:
    push af
    push bc
    call clear_screen_row
    pop bc
    pop af
    inc a
    djnz .sts_clear_loop

.sts_render:
    ; Background loaders may overwrite character patterns/colors used for text.
    ; Restore font before rendering text lines.
    call call_reload_font_system_resident

    ; Now render each text line
    pop hl                        ; (1) HL = pointer to numLines
    ld a, (hl)                    ; A = numLines
    inc hl                        ; HL = first line entry
    or a
    jp z, .sts_enable             ; No lines? just enable screen

    ld b, a                       ; B = line counter

.sts_line_loop:
    push bc

    ; Read row
    ld a, (hl)                    ; A = row
    inc hl
    ; Read col
    ld c, (hl)                    ; C = col
    inc hl
    ; Read string pointer
    ld e, (hl)
    inc hl
    ld d, (hl)                    ; DE = string pointer
    inc hl

    push hl                       ; Save data pointer

    ; Calculate VRAM address: #1800 + row*32 + col
    push de                       ; Save string pointer
    ld l, a
    ld h, 0
    add hl, hl                    ; * 2
    add hl, hl                    ; * 4
    add hl, hl                    ; * 8
    add hl, hl                    ; * 16
    add hl, hl                    ; * 32
    ld e, c
    ld d, 0
    add hl, de                    ; + col
    ld de, #1800
    add hl, de                    ; + name table base
    ex de, hl                     ; DE = VRAM address
    pop hl                        ; HL = string pointer

    call print_string_vram

    pop hl                        ; Restore data pointer
    pop bc
    djnz .sts_line_loop

.sts_enable:
    call ENASCR

    pop hl
    pop de
    pop bc
    ret

; ------------------------------------------------------------------
; wait_for_fire
; Wait for confirm key press and release outside gameplay loops
; ------------------------------------------------------------------
wait_for_fire:
    push bc

    ; Wait for fire button press
.wait_press:
    halt
    call call_task_audio_tick_resident

    call gameflow_read_confirm_direct
    or a
    jr z, .wait_press

    ; Wait for fire button release
.wait_release:
    halt
    call call_task_audio_tick_resident

    call gameflow_read_confirm_direct
    or a
    jr nz, .wait_release

    ; Small delay after release
    ld b, 5
.delay_loop:
    halt
    push bc
    call call_task_audio_tick_resident
    pop bc
    djnz .delay_loop

    pop bc
    ret

gameflow_handle_submenu:
    ; SubMenu node - interactive navigation
    ; DE points to SubMenu data:
    ;   [bg_color][cursor_sprite_idx][cursor_layer_count]
    ;   [cursor_layer_offsets x4][cursor_colors x4]
    ;   [bg_screen_fn DW][bg_screen_bank DB]
    ;   [option_count][initial_selection][title_ptr][option_ptr_0]...
    push bc
    call show_menu_placeholder
    ld a, (gameflow_menu_selection)
    cp 6
    jr c, .submenu_idx_ok
    ld a, 5                       ; Max supported connection option
.submenu_idx_ok:
    add a, CONNECTION_OPTION_0
    pop bc
    call gameflow_get_connection_by_type
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

; ------------------------------------------------------------------
; show_menu_placeholder
; Runtime GameFlow submenu renderer + input
; Input:  DE = menu data pointer
;   Format: DB bg_color, DB cursor_sprite_idx, DB cursor_layer_count,
;           DB cursor_src_off0..cursor_src_off3,
;           DB cursor_color0..cursor_color3,
;           DW bg_screen_fn, DB bg_screen_bank,
;           DB option_count, DB initial_selection,
;           DW title_ptr, DW option_ptr[n]
; Output: gameflow_menu_selection = selected index (0..5)
; ------------------------------------------------------------------
show_menu_placeholder:
    push bc
    push de
    push hl

    ; Cache menu data pointer
    ld h, d
    ld l, e
    ld (gameflow_submenu_data_ptr), hl

    ; Cache option count (clamped to supported range)
    ; option_count is at offset +14 (+11-12 = bg_screen_fn DW, +13 = bg_screen_bank)
    ld bc, 14
    add hl, bc
    ld a, (hl)
    cp 6
    jr c, .smp_count_ok
    ld a, 6
.smp_count_ok:
    ld (gameflow_submenu_option_count), a

    ; Initialize selected option
    or a
    jr nz, .smp_has_options
    xor a
    ld (gameflow_menu_selection), a
    call submenu_prepare_cursor_sprite
    call render_submenu_screen
    jp .smp_exit

.smp_has_options:
    ld b, a
    inc hl
    ld a, (hl)                    ; initial_selection
    cp b
    jr c, .smp_sel_ok
    xor a
.smp_sel_ok:
    ld (gameflow_menu_selection), a

    call submenu_prepare_cursor_sprite
    call render_submenu_screen

.smp_loop:
    halt
    call call_task_audio_tick_resident

    ; Defensive refresh: some projects keep background/runtime VRAM writers
    ; active while the submenu is idle, which can trample ASCII font chars.
    ; Re-apply the font after each VBlank before polling menu input.
    call call_init_font_system_resident
    ld a, 0
    call GTSTCK
    cp 1                          ; Up
    jr nz, .smp_check_down

    ld a, (gameflow_menu_selection)
    or a
    jr z, .smp_wait_neutral
    dec a
    ld (gameflow_menu_selection), a
    call render_submenu_screen
    jr .smp_wait_neutral

.smp_check_down:
    cp 5                          ; Down
    jr nz, .smp_check_fire

    ld a, (gameflow_submenu_option_count)
    dec a                         ; max index
    ld b, a
    ld a, (gameflow_menu_selection)
    cp b
    jr nc, .smp_wait_neutral
    inc a
    ld (gameflow_menu_selection), a
    call render_submenu_screen
    jr .smp_wait_neutral

.smp_check_fire:
    call gameflow_read_confirm_direct
    or a
    jr z, .smp_loop

.smp_wait_fire_release:
    halt
    call call_task_audio_tick_resident

    call call_init_font_system_resident
    call gameflow_read_confirm_direct
    or a
    jr nz, .smp_wait_fire_release
    jp .smp_exit

.smp_wait_neutral:
.smp_wait_neutral_loop:
    halt
    call call_task_audio_tick_resident

    call call_init_font_system_resident
    ld a, 0
    call GTSTCK
    or a
    jr nz, .smp_wait_neutral_loop
    jr .smp_loop

.smp_exit:
    call submenu_hide_cursor_sprite
    ; Ensure no gameplay/menu sprite remains resident after leaving submenu.
    call call_clear_all_sprites_resident
    call call_update_sprites_to_vram_resident
    pop hl
    pop de
    pop bc
    ret

; ------------------------------------------------------------------
; render_submenu_screen
; Draw title, options, and selection marker ('>').
; Uses cached pointer/count variables set by show_menu_placeholder.
; ------------------------------------------------------------------
render_submenu_screen:
    push bc
    push de
    push hl

    ; Apply submenu background/border colors from node config.
    ld hl, (gameflow_submenu_data_ptr)
    ld a, (hl)                    ; bg_color
    ld b, a                       ; border = bg
    push af
    call call_set_screen_colors_resident
    pop af
    call call_init_char0_color_resident

    ; Load background screen (if configured) or clear solid background.
    ; bg_screen_fn DW is at +11, bg_screen_bank is +13, option_count is +14.
    ld hl, (gameflow_submenu_data_ptr)
    ld bc, 11
    add hl, bc
    ld e, (hl)                    ; E = bg_screen_fn low
    inc hl
    ld d, (hl)                    ; D = bg_screen_fn high
    inc hl
    ld a, (hl)                    ; A = bg_screen_bank
    ld c, a
    ex de, hl                     ; HL = bg_screen_fn (0 if none)
    ld d, c                       ; D = bg_screen_bank
    ld a, h
    or l
    jr z, .rss_clear_screen       ; no bg screen -> solid clear

    ; Mapper-safe call to background screen loader.
    ld a, d
    call mapper_call_hl_auto
    jr .rss_read_count

.rss_clear_screen:
    ; Clear full visible screen (24 rows) with tile 0 (solid background).
    ld a, 0
    ld b, 24
.rss_clear_loop:
    push af
    push bc
    call clear_screen_row
    pop bc
    pop af
    inc a
    djnz .rss_clear_loop

.rss_read_count:
    ; Background loaders may overwrite character patterns/colors used for text.
    ; Restore font before printing title/options in submenu.
    call call_reload_font_system_resident

    ld hl, (gameflow_submenu_data_ptr)
    ld bc, 14                     ; offset to option_count (+11-12 fn, +13 bank)
    add hl, bc
    ld a, (hl)                    ; option_count
    cp 6
    jr c, .rss_count_ok
    ld a, 6
.rss_count_ok:
    ld b, a
    or a
    jp z, .rss_done

    inc hl                        ; skip option_count
    inc hl                        ; skip initial_selection

    ; Print title at row 5, horizontally centered (match PC preview Y=40)
    ld e, (hl)
    inc hl
    ld d, (hl)                    ; DE = title pointer
    inc hl                        ; HL = first option pointer
    push hl
    ex de, hl                     ; HL = title string
    call submenu_compute_center_col
    ld c, a                       ; C = centered col
    ld a, 5                       ; A = row 5 (5*8=40px)
    call submenu_calc_vram_addr   ; DE = VRAM addr
    call print_string_vram
    pop hl

    ; Print options from row 10, spaced 2 rows apart (match PC preview Y=80+idx*12)
    ld c, 0
.rss_option_loop:
    ld a, c
    cp b
    jp nc, .rss_done

    ; Read option string pointer
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    push hl                        ; Save option pointer cursor
    push de                        ; Save option string pointer
    push bc                        ; Save option_count/index
    ex de, hl                      ; HL = option string

    ; Marker at (centered text col - 2)
    ld a, (gameflow_menu_selection)
    cp c
    ld a, ' '
    jr nz, .rss_marker_ready
    ld a, (gameflow_submenu_cursor_enabled)
    or a
    jr nz, .rss_marker_ready      ; sprite cursor active -> keep blank marker
    ld a, '>'
.rss_marker_ready:
    push af
    push bc
    ld a, c
    add a, a                       ; *2 (2 rows per option)
    add a, 10                      ; start at row 10
    ld b, a                        ; B = row for current option
    call submenu_compute_center_col
    sub 2
    jr nc, .rss_marker_col_ok
    xor a
.rss_marker_col_ok:
    ld c, a
    ld a, b
    call submenu_calc_vram_addr
    pop bc
    pop af
    ex de, hl
    call WRTVRM

    pop bc                        ; Restore option_count/index
    pop hl                        ; HL = option string pointer

    ; Option text at centered column
    push bc
    ld a, c
    add a, a                       ; *2 (2 rows per option)
    add a, 10                      ; start at row 10
    ld b, a                        ; B = row for current option
    call submenu_compute_center_col
    ld c, a
    ld a, b
    call submenu_calc_vram_addr
    pop bc
    call print_string_vram

    pop hl                        ; Restore option pointer cursor
    inc c
    jr .rss_option_loop

.rss_done:
    call submenu_update_cursor_sprite
    pop hl
    pop de
    pop bc
    ret

; ------------------------------------------------------------------
; submenu_calc_vram_addr
; Convert row/col to name table VRAM address.
; Input:  A = row (0-23), C = col (0-31)
; Output: DE = VRAM address (#1800 + row*32 + col)
; ------------------------------------------------------------------
submenu_calc_vram_addr:
    push hl
    push bc

    ld l, a
    ld h, 0
    add hl, hl                    ; *2
    add hl, hl                    ; *4
    add hl, hl                    ; *8
    add hl, hl                    ; *16
    add hl, hl                    ; *32
    ld b, 0
    add hl, bc                    ; +col
    ld bc, #1800
    add hl, bc                    ; +name table base
    ex de, hl

    pop bc
    pop hl
    ret

; ------------------------------------------------------------------
; submenu_string_length
; Input: HL = null-terminated string
; Output: A = length in characters (0..255)
; Preserves: HL
; ------------------------------------------------------------------
submenu_string_length:
    push hl
    push bc
    ld c, 0                       ; C = length counter
.ssl_loop:
    ld a, (hl)
    or a                          ; test char for null terminator
    jr z, .ssl_done
    inc c
    inc hl
    jr .ssl_loop
.ssl_done:
    ld a, c                       ; A = string length
    pop bc
    pop hl
    ret

; ------------------------------------------------------------------
; submenu_compute_center_col
; Input: HL = null-terminated string
; Output: A = centered start column (0..31)
; Preserves: HL
; ------------------------------------------------------------------
submenu_compute_center_col:
    push bc
    call submenu_string_length
    cp 32
    jr c, .scc_len_ok
    xor a
    jr .scc_done
.scc_len_ok:
    ld b, a
    ld a, 32
    sub b
    srl a
.scc_done:
    pop bc
    ret

; ------------------------------------------------------------------
; submenu_prepare_cursor_sprite
; Load cursor sprite patterns and initialize cursor state.
; Uses sprite slots SUBMENU_CURSOR_BASE_SPRITE..+3.
; MegaROM path resolves sprite layer resources by id.
; ------------------------------------------------------------------
submenu_prepare_cursor_sprite:
    push bc
    push de
    push hl

    ; Default: no sprite cursor
    xor a
    ld (gameflow_submenu_cursor_enabled), a
    ld (gameflow_submenu_cursor_layer_count), a

    ; Clear SAT buffer once to avoid stale sprite garbage in menus
    call call_clear_all_sprites_resident

    ld hl, (gameflow_submenu_data_ptr)
    inc hl                        ; +1 cursor_sprite_idx
    ld a, (hl)
    cp #FF
    jp z, .sps_done               ; no sprite cursor configured
    ld b, a                       ; B = sprite asset index

    ; Read and clamp layer count (+2)
    ld hl, (gameflow_submenu_data_ptr)
    ld de, 2
    add hl, de
    ld a, (hl)
    or a
    jp z, .sps_done
    cp 5
    jp c, .sps_layer_ok
    ld a, 4
.sps_layer_ok:
    ld (gameflow_submenu_cursor_layer_count), a

    ld c, 0                       ; C = compact layer slot
.sps_load_loop:
    ld a, (gameflow_submenu_cursor_layer_count)
    cp c
    jp z, .sps_enable_cursor

    ld a, b                       ; A = sprite asset index
    call submenu_get_cursor_layer_resource_id
    jp c, .sps_done

    push bc
    push af                       ; save resource id
    ld a, c
    add a, SUBMENU_CURSOR_BASE_SPRITE
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                    ; HL = sprite slot * 32
    ld de, SPRPAT
    add hl, de
    push hl
    pop de                        ; DE = destination in VRAM
    pop af                        ; A = resource id
    call resource_load_to_vram_by_id
    pop bc

    inc c
    jp .sps_load_loop

.sps_enable_cursor:
    ld a, 1
    ld (gameflow_submenu_cursor_enabled), a

.sps_done:
    call submenu_update_cursor_sprite
    pop hl
    pop de
    pop bc
    ret


; ------------------------------------------------------------------
; submenu_prepare_cursor_sprite
; Load cursor sprite patterns and initialize cursor state.
; Uses sprite slots SUBMENU_CURSOR_BASE_SPRITE..+3.
; ------------------------------------------------------------------
submenu_prepare_cursor_sprite_legacy:
    push bc
    push de
    push hl

    ; Default: no sprite cursor
    xor a
    ld (gameflow_submenu_cursor_enabled), a
    ld (gameflow_submenu_cursor_layer_count), a

    ; Clear SAT buffer once to avoid stale sprite garbage in menus
    call call_clear_all_sprites_resident

    ld hl, (gameflow_submenu_data_ptr)
    inc hl                        ; +1 cursor_sprite_idx
    ld a, (hl)
    cp #FF
    jr z, .sps_legacy_done        ; no sprite cursor configured

    ; Resolve pattern pointer from sprite asset index
    call submenu_get_cursor_pattern_ptr
    jr c, .sps_legacy_done        ; invalid index -> fallback to char marker
    push hl                       ; save pattern ptr

    ; Read and clamp layer count (+2)
    ld hl, (gameflow_submenu_data_ptr)
    ld bc, 2
    add hl, bc
    ld a, (hl)
    or a
    jr z, .sps_legacy_restore_no_cursor
    cp 5
    jr c, .sps_legacy_layer_ok
    ld a, 4
.sps_legacy_layer_ok:
    ld (gameflow_submenu_cursor_layer_count), a

    ; Upload all layers as one contiguous block.
    ; SPRITE_X_PATTERN points to layer0 data; layers are stored sequentially
    ; in ROM so layer_count * 32 bytes covers all of them.
    ; SPRPAT + (SUBMENU_CURSOR_BASE_SPRITE * 32) is an assembly-time constant
    ; (no 8-bit runtime overflow).
    pop hl                        ; HL = source pattern base (SPRITE_X_PATTERN)
    ld a, (gameflow_submenu_cursor_layer_count)
    add a, a                      ; *2
    add a, a                      ; *4
    add a, a                      ; *8
    add a, a                      ; *16
    add a, a                      ; *32  (layer_count <= 4, max 128 — fits in A)
    ld c, a
    ld b, 0                       ; BC = layer_count * 32
    ld de, SPRPAT + (SUBMENU_CURSOR_BASE_SPRITE * 32)
    call FAST_LDIRVM

.sps_legacy_enable_cursor:

    ld a, 1
    ld (gameflow_submenu_cursor_enabled), a
    jr .sps_legacy_done

.sps_legacy_restore_no_cursor:
    pop hl

.sps_legacy_done:
    call submenu_update_cursor_sprite
    pop hl
    pop de
    pop bc
    ret

; ------------------------------------------------------------------
; submenu_update_cursor_sprite
; Draw or hide submenu cursor sprite according to current selection.
; ------------------------------------------------------------------
submenu_update_cursor_sprite:
    push bc
    push de
    push hl

    ld a, (gameflow_submenu_cursor_enabled)
    or a
    jp z, .sus_hide

    ; Compute cursor Y from selected option row (row = 10 + selection*2)
    ; Y = (10 + selection*2) * 8 - 4 to match PC preview placement.
    ld a, (gameflow_menu_selection)
    add a, a                      ; selection * 2
    add a, 10                     ; + 10 (start row)
    add a, a                      ; *2
    add a, a                      ; *4
    add a, a                      ; *8
    sub 4
    jr nc, .sus_y_ok
    xor a
.sus_y_ok:
    ld c, a                       ; C = Y (pixels)

    ; Resolve selected option pointer and centered text start column.
    ; Header layout (bg_screen_fn DW at +11-12, bg_screen_bank at +13):
    ; +18 = first option DW pointer
    ld hl, (gameflow_submenu_data_ptr)
    ld de, 18
    add hl, de
    ld a, (gameflow_menu_selection)
    add a, a                      ; *2 (DW stride)
    ld e, a
    ld d, 0
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ex de, hl                     ; HL = selected option string
    call submenu_compute_center_col

    ; X = (start_col * 8) - 16 (sprite width)
    add a, a                      ; *2
    add a, a                      ; *4
    add a, a                      ; *8
    sub 16
    jr nc, .sus_x_ok
    xor a
.sus_x_ok:
    ld b, a                       ; B = X (pixels)

    ; HL -> first cursor color byte (+7)
    ld hl, (gameflow_submenu_data_ptr)
    ld de, 7
    add hl, de

    ld a, (gameflow_submenu_cursor_layer_count)
    or a
    jp z, .sus_hide

    ld d, SUBMENU_CURSOR_BASE_SPRITE
.sus_draw_loop:
    push af                       ; [1] save remaining layer count
    ld e, (hl)                    ; E = color for this layer
    push hl                       ; [2] save color pointer
    push de                       ; [3] save D=sprite index, E=color
    ld a, d                       ; A = sprite index (for show_sprite param)
    push af                       ; [4] save A=sprite index
    add a, a
    add a, a
    ld d, a                       ; D = pattern = sprite_index * 4
    pop af                        ; [4] restore A=sprite index
    call call_show_sprite_resident              ; A=index, B=X, C=Y, D=pattern, E=color
    pop de                        ; [3] restore D=sprite index (E=old color, ignore)
    inc d                         ; next sprite slot
    pop hl                        ; [2] restore color pointer
    inc hl                        ; advance to next layer color
    pop af                        ; [1] restore remaining layer count
    dec a
    jr nz, .sus_draw_loop

    ; Hide unused reserved cursor sprite slots
    ld a, (gameflow_submenu_cursor_layer_count)
    ld e, a
    ld a, SUBMENU_CURSOR_MAX_LAYERS
    sub e
    ld b, a                       ; B = remaining to hide
    ld a, SUBMENU_CURSOR_BASE_SPRITE
    add a, e
    ld d, a                       ; D = first unused sprite slot
    jr .sus_hide_remaining_check

.sus_hide_remaining:
    ld a, d
    call call_hide_sprite_resident
    inc d
    djnz .sus_hide_remaining

.sus_hide_remaining_check:
    ld a, b
    or a
    jr nz, .sus_hide_remaining
    jr .sus_flush

.sus_hide:
    call submenu_hide_cursor_sprite
    jr .sus_done

.sus_flush:
    call call_update_sprites_to_vram_resident

.sus_done:
    pop hl
    pop de
    pop bc
    ret

; ------------------------------------------------------------------
; submenu_hide_cursor_sprite
; Hide reserved cursor sprite slots.
; ------------------------------------------------------------------
submenu_hide_cursor_sprite:
    push bc
    push de

    ld d, SUBMENU_CURSOR_BASE_SPRITE
    ld b, SUBMENU_CURSOR_MAX_LAYERS
.shc_loop:
    ld a, d
    call call_hide_sprite_resident
    inc d
    djnz .shc_loop
    call call_update_sprites_to_vram_resident

    pop de
    pop bc
    ret

; ------------------------------------------------------------------
; submenu_get_cursor_pattern_ptr
; Input: A = sprite asset index
; Output: HL = SPRITE_<index>_PATTERN, CF=1 on invalid index
; ------------------------------------------------------------------
submenu_get_cursor_pattern_ptr:
    cp SUBMENU_CURSOR_PATTERN_COUNT
    jr nc, .sgcpp_invalid
    ld l, a
    ld h, 0
    add hl, hl
    ld de, submenu_cursor_sprite_pattern_table
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ex de, hl
    or a                          ; clear carry
    ret
.sgcpp_invalid:
    scf
    ret

; ------------------------------------------------------------------
; submenu_get_cursor_layer_source
; Input: A = sprite asset index, C = compact layer slot (0..3)
; Output: HL = source label, A = source bank, CF=1 on invalid/missing layer
; ------------------------------------------------------------------
submenu_get_cursor_layer_source:
    cp SUBMENU_CURSOR_PATTERN_COUNT
    jr nc, .sgcls_invalid
    ld b, a
    ld a, c
    cp 4
    jr nc, .sgcls_invalid

    ; Pattern pointer table offset = sprite_index * 8 + layer_slot * 2
    ld l, b
    ld h, 0
    add hl, hl                    ; *2
    add hl, hl                    ; *4
    add hl, hl                    ; *8
    ld a, c
    add a, a                      ; layer_slot * 2
    ld e, a
    ld d, 0
    add hl, de
    ld de, submenu_cursor_sprite_layer_pattern_table
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld a, d
    or e
    jr z, .sgcls_invalid
    ex de, hl

    ; Bank table offset = sprite_index * 4 + layer_slot
    ld l, b
    ld h, 0
    add hl, hl                    ; *2
    add hl, hl                    ; *4
    ld d, 0
    ld e, c
    add hl, de
    ld de, submenu_cursor_sprite_layer_bank_table
    add hl, de
    ld a, (hl)
    or a                          ; clear carry
    ret

.sgcls_invalid:
    scf
    ret

; ------------------------------------------------------------------
; submenu_get_cursor_layer_resource_id
; Input: A = sprite asset index, C = compact layer slot (0..3)
; Output: A = resource id, CF=1 on invalid/missing layer
; ------------------------------------------------------------------
submenu_get_cursor_layer_resource_id:
    cp SUBMENU_CURSOR_PATTERN_COUNT
    jp nc, .sgcr_invalid
    ld b, a
    ld a, c
    cp 4
    jp nc, .sgcr_invalid

    ; Resource table offset = sprite_index * 4 + layer_slot
    ld l, b
    ld h, 0
    add hl, hl                    ; *2
    add hl, hl                    ; *4
    ld d, 0
    ld e, c
    add hl, de
    ld de, submenu_cursor_sprite_layer_resource_table
    add hl, de
    ld a, (hl)
    cp #FF
    jp z, .sgcr_invalid
    or a                          ; clear carry
    ret

.sgcr_invalid:
    scf
    ret


SUBMENU_CURSOR_BASE_SPRITE EQU 28
SUBMENU_CURSOR_MAX_LAYERS  EQU 4
SUBMENU_CURSOR_PATTERN_COUNT EQU 11

submenu_cursor_sprite_pattern_table:
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0


submenu_cursor_sprite_layer_pattern_table:
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0


submenu_cursor_sprite_layer_bank_table:
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0
    db 0


submenu_cursor_sprite_layer_resource_table:
    db RESOURCE_ID_ANEC_RIGHT_0_F0_LAYER1
    db RESOURCE_ID_ANEC_RIGHT_0_F0_LAYER2
    db #FF
    db #FF
    db RESOURCE_ID_BOLA_1_F0_LAYER1
    db #FF
    db #FF
    db #FF
    db RESOURCE_ID_PANELL_2_F0_LAYER1
    db RESOURCE_ID_PANELL_2_F0_LAYER2
    db #FF
    db #FF
    db RESOURCE_ID_BOLA_DEAD_3_F0_LAYER1
    db #FF
    db #FF
    db #FF
    db RESOURCE_ID_NINA_WALK_LEFT_4_F0_LAYER0
    db RESOURCE_ID_NINA_WALK_LEFT_4_F0_LAYER1
    db #FF
    db #FF
    db RESOURCE_ID_NINA_IDLE_LEFT_5_F0_LAYER1
    db RESOURCE_ID_NINA_IDLE_LEFT_5_F0_LAYER2
    db #FF
    db #FF
    db RESOURCE_ID_NINA_JUMP_LEFT_6_F0_LAYER0
    db RESOURCE_ID_NINA_JUMP_LEFT_6_F0_LAYER1
    db #FF
    db #FF
    db RESOURCE_ID_ANEC_LEFT_7_F0_LAYER1
    db RESOURCE_ID_ANEC_LEFT_7_F0_LAYER2
    db #FF
    db #FF
    db RESOURCE_ID_NINA_WALK_RIGHT_8_F0_LAYER0
    db RESOURCE_ID_NINA_WALK_RIGHT_8_F0_LAYER1
    db #FF
    db #FF
    db RESOURCE_ID_NINA_IDLE_RIGHT_9_F0_LAYER1
    db RESOURCE_ID_NINA_IDLE_RIGHT_9_F0_LAYER2
    db #FF
    db #FF
    db RESOURCE_ID_NINA_JUMP_RIGHT_10_F0_LAYER0
    db RESOURCE_ID_NINA_JUMP_RIGHT_10_F0_LAYER1
    db #FF
    db #FF


gameflow_handle_transition:
    ; Transition node - visual screen wipe/fade effect
    ; DE = transition data pointer (db effect_id)
    ; BC = connection table
    push bc
    call execute_transition_effect
    ; Restore VRAM after transition:
    ; 1. Tile colors (chars 128+) — corrupted by color-table effects (#11 = black)
    call resource_invalidate_color_vram_cache
    call call_load_colors_to_vram_resident
    ; 2. Font patterns + colors (chars 0-127) — also zeroed by color-table effects.
    ;    init_font_system reloads both pattern bytes and color attributes for all
    ;    font characters.  If no font is used in the project this is a no-op (ret).
    call resource_invalidate_font_vram_cache
    call call_init_font_system_resident
    pop bc                        ; Restore connection table AFTER VRAM restore
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

; ==================================================================
; execute_transition_effect
; Execute visual screen transition by clearing the Name Table
; in different patterns. All effects write tile 0 (blank/black)
; to Name Table (#1800-#1AFF, 768 bytes = 32x24 tiles).
;
; Input:  DE = Transition data pointer
;         (DE) = effect id: 0=cls, 1=dissolve_pixels, 2=dissolve_chars,
;                           3=vertical_lines, 4=horizontal_lines,
;                           5=spiral, 6=fill_white_squares
; Destroys: AF, BC, DE, HL
; ==================================================================
execute_transition_effect:
    ld a, (de)                    ; A = effect id (0-6)
    inc de
    push af                       ; Save effect id
    ld a, (de)                    ; A = frames per step (from node data)
    ld (transition_delay_var), a  ; Store for trans_wait_frames
    pop af                        ; Restore effect id
    or a
    jp z, .trans_cls
    dec a
    jp z, .trans_dissolve_pixels
    dec a
    jp z, .trans_dissolve_chars
    dec a
    jp z, .trans_vertical_lines
    dec a
    jp z, .trans_horizontal_lines
    dec a
    jp z, .trans_spiral
    dec a
    jp z, .trans_fill_white_squares
    ret                           ; Unknown id - do nothing

; ------------------------------------------------------------------
; EFFECT 0: CLS - Instant clear + hold black for configured duration
; ------------------------------------------------------------------
.trans_cls:
    ld hl, #1800
    ld bc, 768
    xor a                         ; Tile 0 = blank
    call trans_fast_filvrm
    call trans_wait_frames        ; Hold black screen for configured time
    ret

; ------------------------------------------------------------------
; EFFECT 1: DISSOLVE_PIXELS - Column-interleaved dissolve (8 passes)
; Each pass clears cols D, D+8, D+16, D+24 with 1 HALT delay
; ------------------------------------------------------------------
.trans_dissolve_pixels:
    ld d, 0                       ; D = pass counter (0-7)
.tdp_loop:
    ld a, d
    call trans_clear_column       ; col D
    ld a, d
    add a, 8
    call trans_clear_column       ; col D+8
    ld a, d
    add a, 16
    call trans_clear_column       ; col D+16
    ld a, d
    add a, 24
    call trans_clear_column       ; col D+24
    call trans_wait_frames        ; timed delay between passes
    inc d
    ld a, d
    cp 8
    jr c, .tdp_loop
    ret

; ------------------------------------------------------------------
; EFFECT 2: DISSOLVE_CHARS - Pixel-row interleaved dissolve (8 passes)
; Pass D clears pixel rows D, D+8, D+16, ..., D+184 (24 rows per pass)
; Uses color table manipulation for 1-pixel-row granularity (8x finer
; than tile-row approach).
; ------------------------------------------------------------------
.trans_dissolve_chars:
    ld d, 0                       ; D = pass counter (0-7)
.tdc_loop:
    ld b, d                       ; B = starting pixel row for this pass
    ld e, 24                      ; E = 24 pixel rows per pass (192/8)
.tdc_inner:
    ld a, b
    call trans_clear_pixel_row_colors   ; clear pixel row B (color table)
    ; trans_clear_pixel_row_colors preserves BC,DE,HL via push/pop
    ld a, b
    add a, 8                      ; next pixel row in this pass (step +8)
    ld b, a
    dec e
    jr nz, .tdc_inner
    call trans_wait_frames
    inc d
    ld a, d
    cp 8
    jr c, .tdc_loop
    ret

; ------------------------------------------------------------------
; EFFECT 3: VERTICAL_LINES - Left-to-right column wipe (2 cols/frame)
; ------------------------------------------------------------------
.trans_vertical_lines:
    ld c, 0                       ; C = current column
.tvl_loop:
    ld a, c
    call trans_clear_column       ; clear col C
    inc c
    ld a, c
    call trans_clear_column       ; clear col C+1
    inc c
    call trans_wait_frames
    ld a, c
    cp 32
    jr c, .tvl_loop
    ret

; ------------------------------------------------------------------
; EFFECT 4: HORIZONTAL_LINES - Top-to-bottom row wipe (1 row/frame)
; ------------------------------------------------------------------
.trans_horizontal_lines:
    ; Pixel-row resolution: 24 tile-rows x 8 sub-rows = 192 pixel rows
    ; Each step: clear all 8 pixel sub-rows of one tile-row, then wait
    ld c, 0                       ; C = tile row (0-23)
.thl_loop:
    ld a, c
    add a, a
    add a, a
    add a, a                      ; A = tile_row * 8 = first pixel row of tile
    ld e, a                       ; E = first pixel row
    ld b, 8                       ; 8 pixel sub-rows per tile row
.thl_inner:
    ld a, e
    call trans_clear_pixel_row_colors
    inc e
    djnz .thl_inner
    call trans_wait_frames
    inc c
    ld a, c
    cp 24
    jp c, .thl_loop
    ret

; ------------------------------------------------------------------
; EFFECT 5: SPIRAL - Pixel-row resolution via color table manipulation
; Clears pixel rows from outside in (top+bottom simultaneously).
; Works by setting color table bytes to 0x11 (black fg + black bg)
; for all 256 tile patterns at the given pixel sub-row in each bank.
; 96 rings: rows (0,191), (1,190), (2,189), ..., (95,96)
; ------------------------------------------------------------------
.trans_spiral:
    ld b, 0                       ; B = top pixel row (0..95)
    ld c, 191                     ; C = bottom pixel row (191..96)
.tsp_loop:
    ld a, b
    call trans_clear_pixel_row_colors   ; blacken pixel row B (top)
    ld a, c
    call trans_clear_pixel_row_colors   ; blacken pixel row C (bottom)
    call trans_wait_frames
    inc b
    dec c
    ld a, b
    cp c
    jr c, .tsp_loop               ; loop while top < bottom
    ret

; ------------------------------------------------------------------
; EFFECT 6: FILL_WHITE_SQUARES - 4-column stripe wipe (8 cols/frame)
; ------------------------------------------------------------------
.trans_fill_white_squares:
    ld c, 0                       ; C = current column (step 8)
.tws_loop:
    ld a, c
    call trans_clear_column
    ld a, c
    inc a
    call trans_clear_column
    ld a, c
    add a, 2
    call trans_clear_column
    ld a, c
    add a, 3
    call trans_clear_column
    ld a, c
    add a, 4
    call trans_clear_column
    ld a, c
    add a, 5
    call trans_clear_column
    ld a, c
    add a, 6
    call trans_clear_column
    ld a, c
    add a, 7
    call trans_clear_column
    ld a, c
    add a, 8
    ld c, a
    call trans_wait_frames
    ld a, c
    cp 32
    jr c, .tws_loop
    ret

; ==================================================================
; trans_clear_pixel_row_colors
; Blackens a single pixel row (1px tall) by setting the color table
; entry for all 256 tile patterns in the appropriate bank to 0x11
; (fg=black, bg=black).  Works at 1-pixel-row granularity unlike
; trans_clear_row_direct which works at 8-pixel (tile-row) granularity.
;
; Screen 2 color table layout:
;   Bank 0 (#2000): tiles used in name-table rows 0-7   (pixel rows 0-63)
;   Bank 1 (#2800): tiles used in name-table rows 8-15  (pixel rows 64-127)
;   Bank 2 (#3000): tiles used in name-table rows 16-23 (pixel rows 128-191)
; Each tile has 8 color bytes; byte J covers pixel sub-row J of that tile.
; Tile T color byte for sub-row J:  bank_base + T*8 + J
;
; Input:  A = pixel row (0-191)
;         bank    = A >> 6   (0-2)
;         sub_row = A & 7    (0-7)
;         color_base = #2000 + bank * #0800
; Preserves: BC, DE, HL
; ==================================================================
trans_clear_pixel_row_colors:
    push bc
    push de
    push hl
    ; --- Compute sub_row = A & 7 ---
    ld l, a                       ; L = pixel row (save)
    and 7
    ld e, a                       ; E = sub_row (0-7)
    ; --- Compute bank = A >> 6 (0-2) ---
    ld a, l
    srl a
    srl a
    srl a
    srl a
    srl a
    srl a                         ; A = bank (0, 1 or 2)
    ; --- Compute H = #20 + bank*8 (color table high byte) ---
    ; bank=0 -> H=#20, bank=1 -> H=#28, bank=2 -> H=#30
    add a, a                      ; bank * 2
    add a, a                      ; bank * 4
    add a, a                      ; bank * 8
    add a, #20
    ld h, a                       ; H = color table high byte for this bank
    ld l, e                       ; L = sub_row  (offset within tile 0 entry)
    ; HL now = address of tile-0 color byte for this pixel sub-row
    ; --- Write 0x11 (black/black) for all 256 tiles ---
    ; Tile addresses: HL, HL+8, HL+16, ... HL+255*8
    ; (consecutive tiles are 8 bytes apart in the color table)
    ld b, 0                       ; B=0 → djnz executes 256 times
.tpcr_loop:
    ; DI only around the 3 critical VDP port writes.
    ; Keeping DI for the whole loop would leave interrupts disabled for ~6ms
    ; and can cause DI+HALT if trans_wait_frames is reached before EI fires.
    di
    ld a, l
    out (#99), a                  ; VRAM address low
    ld a, h
    or #40
    out (#99), a                  ; VRAM address high + write mode
    ld a, #11                     ; fg=1 (black), bg=1 (black)
    out (#98), a                  ; Write to VRAM color table
    ei                            ; Re-enable: interrupt fires after next instr
    ld a, l                       ; (EI delay instruction) Advance HL += 8
    add a, 8
    ld l, a
    jr nc, .tpcr_nc
    inc h
.tpcr_nc:
    djnz .tpcr_loop
    pop hl
    pop de
    pop bc
    ret

; ==================================================================
; trans_wait_frames
; Wait N V-blank frames where N = transition_delay_var
; Provides timed delay between animation steps
; Preserves: BC, DE, HL
; ==================================================================
trans_wait_frames:
    push bc
    ld a, (transition_delay_var)
    or a
    jr z, .twf_done               ; 0 = no wait (safety)
    ld b, a
.twf_loop:
    halt                          ; Wait for V-blank (~20ms at 50Hz)
    push bc
    call call_task_audio_tick_resident
    pop bc
    djnz .twf_loop
.twf_done:
    pop bc
    ret

; ==================================================================
; trans_clear_column
; Write tile 0 to all 24 rows of a single column in the Name Table
; Input:  A = column (0-31)
; Preserves: BC, DE, HL
; ==================================================================
trans_clear_column:
    push bc
    push de
    push hl
    ld l, a
    ld h, #18                     ; HL = #1800 + column (row 0)
    ld b, 24                      ; 24 rows
    di                            ; Protect VDP address setup from ISR corruption
.tcc_row:
    ld a, l
    out (#99), a                  ; VRAM address low byte
    ld a, h
    or #40
    out (#99), a                  ; VRAM address high + write mode
    xor a
    out (#98), a                  ; Write tile 0
    ld a, l                       ; HL += 32 (advance to next row)
    add a, 32
    ld l, a
    jr nc, .tcc_no_carry
    inc h
.tcc_no_carry:
    djnz .tcc_row
    ei
    pop hl
    pop de
    pop bc
    ret

; ==================================================================
; trans_clear_row_direct
; Write tile 0 to all 32 columns of a single row in the Name Table
; Input:  A = row (0-23)
; Preserves: BC, DE, HL
; ==================================================================
trans_clear_row_direct:
    push bc
    push de
    push hl
    ; HL = #1800 + row * 32
    ld l, a
    ld h, 0
    add hl, hl                    ; *2
    add hl, hl                    ; *4
    add hl, hl                    ; *8
    add hl, hl                    ; *16
    add hl, hl                    ; *32
    ld de, #1800
    add hl, de                    ; HL = name table row start
    di                            ; Protect VDP address+data from ISR corruption
    ld a, l
    out (#99), a                  ; VRAM address low
    ld a, h
    or #40
    out (#99), a                  ; VRAM address high + write mode
    ld b, 32
    xor a                         ; Tile 0
.tcrd_loop:
    out (#98), a
    djnz .tcrd_loop
    ei
    pop hl
    pop de
    pop bc
    ret

; ==================================================================
; trans_fast_filvrm
; Fill VRAM with a constant byte using direct port access
; Input:  HL = VRAM destination address
;         BC = byte count
;         A  = fill value
; Destroys: A, BC, E
; ==================================================================
trans_fast_filvrm:
    ld e, a                       ; Save fill byte
    di                            ; Protect VDP address+data from ISR corruption
    ld a, l
    out (#99), a                  ; VRAM address low
    ld a, h
    or #40
    out (#99), a                  ; VRAM address high + write mode
.tff_loop:
    ld a, e
    out (#98), a                  ; Write byte to VRAM
    dec bc
    ld a, b
    or c
    jr nz, .tff_loop
    ei
    ret

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
    dw gameflow_node_gfn_1771277173268
    db CONNECTION_END

; ------------------------------------------------------------------
; gameflow_node_gf_start_1770754183471_init
; Initialization routine for Start node
; Initializes global variables and MSX systems
; ------------------------------------------------------------------
gameflow_node_gf_start_1770754183471_init:
    ; === Core Game Systems Initialization (ALWAYS required) ===
    call init_game_systems

    ret

; Node: WorldLink - "gfn_1770754189118"
gameflow_node_gfn_1770754189118:
    db NODE_TYPE_WORLD_LINK
    dw gameflow_node_gfn_1770754189118_data
    dw gameflow_node_gfn_1770754189118_conn

gameflow_node_gfn_1770754189118_data:
    dw load_world_worldmap_1770754170935_far
    db ((load_world_worldmap_1770754170935_far - #4000) / #2000)
    dw gameflow_node_gfn_1770754189118_init
    db ((gameflow_node_gfn_1770754189118_init - #4000) / #2000)

gameflow_node_gfn_1770754189118_conn:
    db CONNECTION_DEFAULT
    dw gameflow_node_gfn_1770754206759
    db CONNECTION_END

; ------------------------------------------------------------------
; gameflow_node_gfn_1770754189118_init
; Initialization routine for WorldLink node
; Applies optional per-world global values when entering the world
; ------------------------------------------------------------------
gameflow_node_gfn_1770754189118_init:
    ret

; Node: End - "gfn_1770754206759"
gameflow_node_gfn_1770754206759:
    db NODE_TYPE_END
    dw gameflow_no_data
    dw gameflow_node_gfn_1770754206759_conn

gameflow_node_gfn_1770754206759_conn:
    db CONNECTION_DEFAULT
    dw 0
    db CONNECTION_END

; Node: Text - "DUCK WORLD"
gameflow_node_gfn_1770833873618:
    db NODE_TYPE_TEXT
    dw gameflow_node_gfn_1770833873618_data
    dw gameflow_node_gfn_1770833873618_conn

gameflow_node_gfn_1770833873618_data:
    DB 6                  ; Background color (MSX index from #D4524D)
    DW load_screen_background1_771482721894_far            ; Background screen load function (0=none)
    DB ((load_screen_background1_771482721894_far - #4000) / #2000)         ; Background screen load bank
    DB 5                  ; Number of lines
    DB 3, 11              ; Row 3, Col 11
    DW text_gfn_1770833873618_title          ; -> "DUCK WORLD"
    DB 7, 2              ; Row 7, Col 2
    DW text_gfn_1770833873618_msg0          ; -> "LOS PATOS HAN CONQUISTADO EL"
    DB 8, 2              ; Row 8, Col 2
    DW text_gfn_1770833873618_msg1          ; -> "PLANETA TIERRA, INTENTA HUIR"
    DB 9, 5              ; Row 9, Col 5
    DW text_gfn_1770833873618_msg2          ; -> "ANTES QUE TE DEN CAZA."
    DB 20, 5              ; Row 20, Col 5
    DW text_gfn_1770833873618_prompt          ; -> "PRESS FIRE TO CONTINUE"

text_gfn_1770833873618_title:
    DB "DUCK WORLD", 0
text_gfn_1770833873618_msg0:
    DB "LOS PATOS HAN CONQUISTADO EL", 0
text_gfn_1770833873618_msg1:
    DB "PLANETA TIERRA, INTENTA HUIR", 0
text_gfn_1770833873618_msg2:
    DB "ANTES QUE TE DEN CAZA.", 0
text_gfn_1770833873618_prompt:
    DB "PRESS FIRE TO CONTINUE", 0

gameflow_node_gfn_1770833873618_conn:
    db CONNECTION_DEFAULT
    dw gameflow_node_gfn_1771277173268
    db CONNECTION_END

; Node: SubMenu - "DUCK INVADERS"
gameflow_node_gfn_1771277173268:
    db NODE_TYPE_SUB_MENU
    dw gameflow_node_gfn_1771277173268_data
    dw gameflow_node_gfn_1771277173268_conn

gameflow_node_gfn_1771277173268_data:
    db 1    ; Background color (MSX index)
    db 2    ; Cursor sprite asset index (#FF = use text marker)
    db 2    ; Cursor sprite layer count (max 4)
    db 1, 2, 0, 0    ; Cursor source layer offsets
    db 15, 8, 0, 0    ; Cursor layer colors
    dw load_screen_background1_771482721894_far    ; Background screen load function (0=none)
    db ((load_screen_background1_771482721894_far - #4000) / #2000)    ; Background screen load bank
    db 3    ; Number of options (max 6)
    db 0    ; Initial selected option
    dw submenu_gfn_1771277173268_title
    dw submenu_gfn_1771277173268_opt0
    dw submenu_gfn_1771277173268_opt1
    dw submenu_gfn_1771277173268_opt2

submenu_gfn_1771277173268_title:
    db "DUCK INVADERS", 0
submenu_gfn_1771277173268_opt0:
    db "INSTRUCTIONS", 0
submenu_gfn_1771277173268_opt1:
    db "START GAME", 0
submenu_gfn_1771277173268_opt2:
    db "CREDITS", 0

gameflow_node_gfn_1771277173268_conn:
    db CONNECTION_OPTION_0
    dw gameflow_node_gfn_1771445951141
    db CONNECTION_OPTION_1
    dw gameflow_node_gfn_1770754189118
    db CONNECTION_OPTION_2
    dw gameflow_node_gfn_1771422676132
    db CONNECTION_END

; Node: Text - "CREDITS"
gameflow_node_gfn_1771421649196:
    db NODE_TYPE_TEXT
    dw gameflow_node_gfn_1771421649196_data
    dw gameflow_node_gfn_1771421649196_conn

gameflow_node_gfn_1771421649196_data:
    DB 1                  ; Background color (MSX index from #000000)
    DW load_screen_background1_771482721894_far            ; Background screen load function (0=none)
    DB ((load_screen_background1_771482721894_far - #4000) / #2000)         ; Background screen load bank
    DB 5                  ; Number of lines
    DB 3, 12              ; Row 3, Col 12
    DW text_gfn_1771421649196_title          ; -> "CREDITS"
    DB 7, 6              ; Row 7, Col 6
    DW text_gfn_1771421649196_msg0          ; -> "GRAPHICS-JORDI SALA,"
    DB 8, 6              ; Row 8, Col 6
    DW text_gfn_1771421649196_msg1          ; -> "GAMEPLAY-JORDI SALA,"
    DB 9, 7              ; Row 9, Col 7
    DW text_gfn_1771421649196_msg2          ; -> "THANKS FOR PLAYING"
    DB 20, 5              ; Row 20, Col 5
    DW text_gfn_1771421649196_prompt          ; -> "PRESS FIRE TO CONTINUE"

text_gfn_1771421649196_title:
    DB "CREDITS", 0
text_gfn_1771421649196_msg0:
    DB "GRAPHICS-JORDI SALA,", 0
text_gfn_1771421649196_msg1:
    DB "GAMEPLAY-JORDI SALA,", 0
text_gfn_1771421649196_msg2:
    DB "THANKS FOR PLAYING", 0
text_gfn_1771421649196_prompt:
    DB "PRESS FIRE TO CONTINUE", 0

gameflow_node_gfn_1771421649196_conn:
    db CONNECTION_DEFAULT
    dw gameflow_node_gfn_1771277173268
    db CONNECTION_END

; Node: Transition - "gfn_1771422676132"
gameflow_node_gfn_1771422676132:
    db NODE_TYPE_TRANSITION
    dw gameflow_node_gfn_1771422676132_data
    dw gameflow_node_gfn_1771422676132_conn

gameflow_node_gfn_1771422676132_data:
    db 5              ; Effect: spiral
    db 1              ; Frames per step (duration 1000ms / 96 steps / 20ms)

gameflow_node_gfn_1771422676132_conn:
    db CONNECTION_DEFAULT
    dw gameflow_node_gfn_1771421649196
    db CONNECTION_END

; Node: Transition - "gfn_1771445951141"
gameflow_node_gfn_1771445951141:
    db NODE_TYPE_TRANSITION
    dw gameflow_node_gfn_1771445951141_data
    dw gameflow_node_gfn_1771445951141_conn

gameflow_node_gfn_1771445951141_data:
    db 4              ; Effect: horizontal_lines
    db 5              ; Frames per step (duration 2500ms / 24 steps / 20ms)

gameflow_node_gfn_1771445951141_conn:
    db CONNECTION_DEFAULT
    dw gameflow_node_gfn_1770833873618
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
BANK_3_USED_END:
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
SCREEN_PAN1_0_ANIM_GROUP_COUNT EQU 2
SCREEN_PAN1_0_ENTITY_COUNT EQU 2
SCREEN_PAN1_0_SPRITE_PATTERN_SLOTS EQU 27
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
SCREEN_PAN2_1_ANIM_GROUP_COUNT EQU 1
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
SCREEN_PAN3_3_ANIM_GROUP_COUNT EQU 0
SCREEN_PAN3_3_ENTITY_COUNT EQU 1
SCREEN_PAN3_3_SPRITE_PATTERN_SLOTS EQU 9
SCREEN_PAN3_3_MUSIC_IN_GAME EQU 0
SCREEN_PAN3_3_SUMMARY_FLAGS EQU #06

; ==================================================================
; SCREEN RUNTIME SUMMARY TABLE
; anim_groups: animated tile groups visible in this screen
; entity_count: entity instances assigned to this screen
; sprite_pattern_slots: SPRPAT slots needed by this screen's entity runtime set
; flags bit0=music_in_game, bit1=has_hud, bit2=has_effects, bit3=has_anim_tiles
; ==================================================================

screen_runtime_summary_table:
    db 2, 2, 27, #0E    ; Screen 0: pan1
    db 1, 0, 1, #0E    ; Screen 1: pan2
    db 0, 0, 1, #04    ; Screen 2: background1
    db 0, 1, 9, #06    ; Screen 3: pan3

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
    ld a, 0
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
    ld a, 2
    ld (current_screen_anim_group_count), a
    ld a, 2
    ld (current_screen_entity_count), a
    ld a, 27
    ld (current_screen_sprite_pattern_slots), a
    ld a, SCREEN_PAN1_0_SUMMARY_FLAGS
    ld (current_screen_summary_flags), a
    ld a, SCREEN_PAN1_0_BOSS_COUNT
    ld (current_screen_boss_count), a
    or a
    jp z, load_pan1_770754008863_boss_done
    ld a, RESOURCE_ID_SCREEN_PAN1_0_BOSS_TABLE
    ld de, current_screen_boss_entry
    call resource_load_to_ram_by_id
    jr nc, .load_pan1_770754008863_boss_done_loaded
    xor a
    ld (current_screen_boss_count), a
    jp load_pan1_770754008863_boss_done
.load_pan1_770754008863_boss_done_loaded:
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
    ld a, 0
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
    ld a, 1
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
    ld a, RESOURCE_ID_SCREEN_PAN2_1_BOSS_TABLE
    ld de, current_screen_boss_entry
    call resource_load_to_ram_by_id
    jr nc, .load_pan2_771184738851_boss_done_loaded
    xor a
    ld (current_screen_boss_count), a
    jp load_pan2_771184738851_boss_done
.load_pan2_771184738851_boss_done_loaded:
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
    ld a, 0
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
    ld a, RESOURCE_ID_SCREEN_BACKGROUND1_2_BOSS_TABLE
    ld de, current_screen_boss_entry
    call resource_load_to_ram_by_id
    jr nc, .load_background1_771482721894_boss_done_loaded
    xor a
    ld (current_screen_boss_count), a
    jp load_background1_771482721894_boss_done
.load_background1_771482721894_boss_done_loaded:
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
    ld a, 0
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
    ld a, 0
    ld (current_screen_anim_group_count), a
    ld a, 1
    ld (current_screen_entity_count), a
    ld a, 9
    ld (current_screen_sprite_pattern_slots), a
    ld a, SCREEN_PAN3_3_SUMMARY_FLAGS
    ld (current_screen_summary_flags), a
    ld a, SCREEN_PAN3_3_BOSS_COUNT
    ld (current_screen_boss_count), a
    or a
    jp z, load_pan3_771880109228_boss_done
    ld a, RESOURCE_ID_SCREEN_PAN3_3_BOSS_TABLE
    ld de, current_screen_boss_entry
    call resource_load_to_ram_by_id
    jr nc, .load_pan3_771880109228_boss_done_loaded
    xor a
    ld (current_screen_boss_count), a
    jp load_pan3_771880109228_boss_done
.load_pan3_771880109228_boss_done_loaded:
    ld hl, current_screen_boss_entry
    ld (current_screen_boss_table), hl
    ld a, #FF
    ld (current_screen_boss_table_bank), a
load_pan3_771880109228_boss_done:

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
BANK_4_USED_END:
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
;   Actually instantiated: 3
;   Used entity templates: 2
;   Filtered out: 2 unused templates
;
; ==================================================================

; ==================================================================
; ENTITY DEFINITIONS
; ==================================================================

; Entity: pato 1 (instance from template: tpl_1770837237607_l05j9)
ENTITY_PATO_1_ID EQU 0
ENTITY_PATO_1_COMP_MASK EQU #8F  ; Component mask: 10001111b
; Template: tpl_1770837237607_l05j9
ENTITY_PATO_1_X EQU 13
ENTITY_PATO_1_Y EQU 15

; Entity: hero 1 (instance from template: tpl_1771166650770_6ibnk)
ENTITY_HERO_1_ID EQU 1
ENTITY_HERO_1_COMP_MASK EQU #39B  ; Component mask: 1110011011b
; Template: tpl_1771166650770_6ibnk
ENTITY_HERO_1_X EQU 3
ENTITY_HERO_1_Y EQU 10

; Entity: pato 1 (instance from template: tpl_1770837237607_l05j9)
ENTITY_PATO_1_2_ID EQU 2
ENTITY_PATO_1_2_COMP_MASK EQU #8F  ; Component mask: 10001111b
; Template: tpl_1770837237607_l05j9
ENTITY_PATO_1_2_X EQU 5
ENTITY_PATO_1_2_Y EQU 3

; ==================================================================
; ENTITY MANAGEMENT FUNCTIONS
; ==================================================================

init_entities:
    ; Initialize all active game entities (3 entities)

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
    
    call init_pato_1
    call init_hero_1
    call init_pato_1_2
    call init_player_from_hero_entity
    ret

update_entities:
    ; Update all active entities (3 entities)
    ; Skip entity update if entity belongs to another screen
    ld hl, entity_screen_id + 0
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_update_0
    ; Run per-entity update
    call update_pato_1
.skip_update_0:
    ; Skip entity update if entity belongs to another screen
    ld hl, entity_screen_id + 1
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_update_1
    ; Run per-entity update
    call update_hero_1
.skip_update_1:
    ; Skip entity update if entity belongs to another screen
    ld hl, entity_screen_id + 2
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_update_2
    ; Run per-entity update
    call update_pato_1_2
.skip_update_2:
    ret

init_pato_1:
    ; Initialize pato 1 at real position from JSON
    ; JSON position: (13, 15) tiles = (104, 120) pixels
    ; Template: tpl_1770837237607_l05j9
    ; Components: Position, Sprite, Movement, Collision, Animation
    ; Direction mask: #0F (1111b) = All directions

    ; Set entity ID and component mask (DYNAMIC - based on template)
    ; Mask is 16-bit: B=low byte, C=high byte
    ld a, 0             ; Entity ID
    ld b, #8F              ; Mask low byte
    ld c, #00              ; Mask high byte
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
    ld (hl), 104         ; Set real X position from JSON

    ld hl, entity_y_pos
    add hl, de
    ld (hl), 120         ; Set real Y position from JSON

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
    ld (hl), #03           ; flags (playing/loop/onlyWhenMoving)


    ; === Patrol Component Init ===
    ; Waypoints: (56, 120) -> (184, 120)
    ; Override position with waypoint1
    ld hl, entity_x_pos
    add hl, de
    ld (hl), 56         ; Start X = waypoint1_x

    ld hl, entity_y_pos
    add hl, de
    ld (hl), 120         ; Start Y = waypoint1_y

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
    ld (hl), 0          ; Use entity index * 4 for 16x16 sprites

    ld hl, sprite_color
    add hl, de
    ld (hl), 2                ; Distinct color for debugging


    ; Set direction mask for Cursors component (if entity has Input component)
    ld hl, entity_dir_mask
    add hl, de
    ld (hl), #0F            ; Direction restrictions: All directions

    ; Set input speed for Cursors component (if entity has Input component)
    ld hl, entity_input_speed
    add hl, de
    ld (hl), 2            ; Cursor speed (px/frame)


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



    ret

update_pato_1:
    ; Update pato 1 - Patrol bounce
    ; Waypoints: (56, 120) -> (184, 120)
    ld e, 0             ; Entity index
    ld d, 0

    ; --- X axis bounce ---
    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    or a
    jp z, .patrol_end_0
    bit 7, a
    jp nz, .patrol_chk_min_x_0

    ; Moving right: x >= 184?
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    cp 184
    jp c, .patrol_end_0
    ; Bounce: negate vel_x
    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    neg
    ld (hl), a
    jp .patrol_end_0

.patrol_chk_min_x_0:
    ; Moving left: x <= 56?
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    cp 57
    jp nc, .patrol_end_0
    ; Bounce: negate vel_x
    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    neg
    ld (hl), a

.patrol_end_0:
    ; Sync sprite facing with current patrol velocity
    call update_entity_patrol_facing
    ret

init_hero_1:
    ; Initialize hero 1 at real position from JSON
    ; JSON position: (3, 10) tiles = (24, 80) pixels
    ; Template: tpl_1771166650770_6ibnk
    ; Components: Position, Sprite, Collision, Input, Animation, Jump, Gravity
    ; Direction mask: #0C (1100b) = LEFT+RIGHT

    ; Set entity ID and component mask (DYNAMIC - based on template)
    ; Mask is 16-bit: B=low byte, C=high byte
    ld a, 1             ; Entity ID
    ld b, #9B              ; Mask low byte
    ld c, #03              ; Mask high byte
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
    ld (hl), #06           ; animationSpeed

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
    ld (hl), 4          ; Use entity index * 4 for 16x16 sprites

    ld hl, sprite_color
    add hl, de
    ld (hl), 3                ; Distinct color for debugging


    ; Set direction mask for Cursors component (if entity has Input component)
    ld hl, entity_dir_mask
    add hl, de
    ld (hl), #0C            ; Direction restrictions: LEFT+RIGHT

    ; Set input speed for Cursors component (if entity has Input component)
    ld hl, entity_input_speed
    add hl, de
    ld (hl), 1            ; Cursor speed (px/frame)

    ; Set Jump component configuration
    ld hl, entity_jump_max
    add hl, de
    ld (hl), 1            ; Maximum jumps before touching ground


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



    ; Initialize State Machine pointer to initial state (New Statemachine)
    ld hl, SM_New_Statemachine_state_1771533526010          ; HL = initial state address
    ld a, l
    ld (entity_sm_ptr_l + 1), a   ; SM ptr low byte
    ld a, h
    ld (entity_sm_ptr_h + 1), a   ; SM ptr high byte

    ; Fire OnEnter of initial state immediately.
    ; Normally OnEnter fires via SM_ChangeState, but the first state is set
    ; directly (no transition). Without this call, ChangeSprite / other
    ; OnEnter actions never run and entity_sprite_asset_index stays at 0.
    ; State data layout: [ID:1][OnEnter ptr:2][OnExit ptr:2][Transitions ptr:2]
    ld hl, SM_New_Statemachine_state_1771533526010 + 1      ; HL = &OnEnter Actions Ptr field
    ld e, (hl)
    inc hl
    ld d, (hl)                    ; DE = OnEnter Actions Ptr (0 if none)
    ld a, 1                ; A = entity index
    call SM_ExecuteActions        ; safe: SM_ExecuteActions returns immediately if DE=0

    ret

update_hero_1:
    ; Update hero 1 logic with real behavior
    ; Check if entity has input component (player entities)
    ld a, 1
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

init_pato_1_2:
    ; Initialize pato 1 at real position from JSON
    ; JSON position: (5, 3) tiles = (40, 24) pixels
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
    ; period: 1 frame(s), entry: 0
    ld a, 2
    ld b, 1
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
    ld (hl), 24         ; Set real Y position from JSON

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
    ; Waypoints: (56, 24) -> (152, 24)
    ; Override position with waypoint1
    ld hl, entity_x_pos
    add hl, de
    ld (hl), 56         ; Start X = waypoint1_x

    ld hl, entity_y_pos
    add hl, de
    ld (hl), 24         ; Start Y = waypoint1_y

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

update_pato_1_2:
    ; Update pato 1 - Patrol bounce
    ; Waypoints: (56, 24) -> (152, 24)
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

    ; Moving right: x >= 152?
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    cp 152
    jp c, .patrol_end_2
    ; Bounce: negate vel_x
    ld hl, entity_vel_x
    add hl, de
    ld a, (hl)
    neg
    ld (hl), a
    jp .patrol_end_2

.patrol_chk_min_x_2:
    ; Moving left: x <= 56?
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    cp 57
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
    DB 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
entity_gate_cfg_height:
    DB 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
entity_gate_cfg_direction:
    DB 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
entity_gate_cfg_fill_char:
    DB 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
entity_gate_cfg_total_steps:
    DB 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
entity_gate_cfg_step_delay:
    DB 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
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
BANK_5_USED_END:
    ds #8000 - $, #FF
    org FAR_BANK_5_ROM_START + #2000

; ##################################################################
; FAR BANK 6 — [#6000h-#8000h] FAR CODE: bosses
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank6 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-3). No far-to-far calls allowed.
; ##################################################################
FAR_BANK_6_ROM_START:
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

















; --- End of Far Bank 6 — pad to 8KB boundary ---
BANK_6_USED_END:
    ds #8000 - $, #FF
    org FAR_BANK_6_ROM_START + #2000

; ##################################################################
; FAR BANK 7 — [#6000h-#8000h] FAR CODE: sprites
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank7 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-3). No far-to-far calls allowed.
; ##################################################################
FAR_BANK_7_ROM_START:
    org #6000

; ==================================================================
; SPRITE DATA
; File: sprites.asm
; Description: Sprite pattern and animation data
; Entities: 3
; Total Hardware Sprites (Layers): 32
; SAT Upload Sprites per frame: 32
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
SPRITE_3_PATTERN EQU BOLA_DEAD_3_F0_LAYER1
SPRITE_3_PATTERN_BANK EQU ((SPRITE_3_PATTERN - #4000) / #2000)

; Unified pattern label for sprite 4
SPRITE_4_PATTERN EQU NINA_WALK_LEFT_4_F0_LAYER0
SPRITE_4_PATTERN_BANK EQU ((SPRITE_4_PATTERN - #4000) / #2000)

; Unified pattern label for sprite 5
SPRITE_5_PATTERN EQU NINA_IDLE_LEFT_5_F0_LAYER1
SPRITE_5_PATTERN_BANK EQU ((SPRITE_5_PATTERN - #4000) / #2000)

; Unified pattern label for sprite 6
SPRITE_6_PATTERN EQU NINA_JUMP_LEFT_6_F0_LAYER0
SPRITE_6_PATTERN_BANK EQU ((SPRITE_6_PATTERN - #4000) / #2000)

; Unified pattern label for sprite 7
SPRITE_7_PATTERN EQU ANEC_LEFT_7_F0_LAYER1
SPRITE_7_PATTERN_BANK EQU ((SPRITE_7_PATTERN - #4000) / #2000)

; Unified pattern label for sprite 8
SPRITE_8_PATTERN EQU NINA_WALK_RIGHT_8_F0_LAYER0
SPRITE_8_PATTERN_BANK EQU ((SPRITE_8_PATTERN - #4000) / #2000)

; Unified pattern label for sprite 9
SPRITE_9_PATTERN EQU NINA_IDLE_RIGHT_9_F0_LAYER1
SPRITE_9_PATTERN_BANK EQU ((SPRITE_9_PATTERN - #4000) / #2000)

; Unified pattern label for sprite 10
SPRITE_10_PATTERN EQU NINA_JUMP_RIGHT_10_F0_LAYER0
SPRITE_10_PATTERN_BANK EQU ((SPRITE_10_PATTERN - #4000) / #2000)

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
    db 5 ; Sprite 3: bola_dead
    db 2 ; Sprite 4: nina_walk_left
    db 1 ; Sprite 5: nina_idle_left
    db 1 ; Sprite 6: nina_jump_left
    db 2 ; Sprite 7: anec_left
    db 2 ; Sprite 8: nina_walk_right
    db 1 ; Sprite 9: nina_idle_right
    db 1 ; Sprite 10: nina_jump_right

; Table: Sprite Asset Drawable Layer Counts
; Format: db compact drawable layer count (minimum 1)
sprite_asset_layer_count_init:
    db 2 ; Sprite 0: anec_right
    db 1 ; Sprite 1: bola
    db 2 ; Sprite 2: panell
    db 1 ; Sprite 3: bola_dead
    db 2 ; Sprite 4: nina_walk_left
    db 2 ; Sprite 5: nina_idle_left
    db 2 ; Sprite 6: nina_jump_left
    db 2 ; Sprite 7: anec_left
    db 2 ; Sprite 8: nina_walk_right
    db 2 ; Sprite 9: nina_idle_right
    db 2 ; Sprite 10: nina_jump_right
SPRITE_ASSET_COUNT EQU 11
SPRITE_PATTERN_PRELOAD_MODE EQU 1

; Table: Sprite Asset Loop Flags
; Format: db flags (bit 1: 1=loop, 0=once)
sprite_loop_flags_init:
    db 2 ; Sprite 0: anec_right
    db 0 ; Sprite 1: bola
    db 0 ; Sprite 2: panell
    db 0 ; Sprite 3: bola_dead
    db 2 ; Sprite 4: nina_walk_left
    db 0 ; Sprite 5: nina_idle_left
    db 0 ; Sprite 6: nina_jump_left
    db 2 ; Sprite 7: anec_left
    db 2 ; Sprite 8: nina_walk_right
    db 0 ; Sprite 9: nina_idle_right
    db 0 ; Sprite 10: nina_jump_right

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

; Sprite 0: anec_right frame pointers
SPRITE_0_FRAME_PTRS:
    dw 0
    dw 0

; Sprite 1: bola frame pointers
SPRITE_1_FRAME_PTRS:
    dw 0
    dw 0

; Sprite 2: panell frame pointers
SPRITE_2_FRAME_PTRS:
    dw 0

; Sprite 3: bola_dead frame pointers
SPRITE_3_FRAME_PTRS:
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0

; Sprite 4: nina_walk_left frame pointers
SPRITE_4_FRAME_PTRS:
    dw 0
    dw 0

; Sprite 5: nina_idle_left frame pointers
SPRITE_5_FRAME_PTRS:
    dw 0

; Sprite 6: nina_jump_left frame pointers
SPRITE_6_FRAME_PTRS:
    dw 0

; Sprite 7: anec_left frame pointers
SPRITE_7_FRAME_PTRS:
    dw 0
    dw 0

; Sprite 8: nina_walk_right frame pointers
SPRITE_8_FRAME_PTRS:
    dw 0
    dw 0

; Sprite 9: nina_idle_right frame pointers
SPRITE_9_FRAME_PTRS:
    dw 0

; Sprite 10: nina_jump_right frame pointers
SPRITE_10_FRAME_PTRS:
    dw 0

; ==================================================================
; DIRECTIONAL SPRITE LOOKUP TABLES
; Maps any sprite asset index to its directional variant index.
; If no directional variant exists, table points back to same index.
; ==================================================================
sprite_dir_left_table_init:
    db 7, 1, 2, 3, 4, 5, 6, 7, 4, 5, 6

sprite_dir_right_table_init:
    db 0, 1, 2, 3, 8, 9, 10, 0, 8, 9, 10

sprite_dir_up_table_init:
    db 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10

sprite_dir_down_table_init:
    db 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10

 
; ================================================================== 
; SPRITE CONFIGURATION TABLES 
; ================================================================== 

; Table: Entity Sprite Configuration 
; Format: db base_hw_sprite_index, layer_count 
entity_sprite_config_init:
    db 0, 2 ; Entity 0 (anec_right)
    db 2, 2 ; Entity 1 (nina_walk_left)
    db 4, 2 ; Entity 2 (anec_right)
    ds 58, 0 ; Padding

; Table: Entity -> Sprite Asset Index (ROM initial values)
; Copied to RAM entity_sprite_asset_index at init
; Format: db sprite_asset_index (#FF = none)
entity_sprite_asset_index_init:
    db #00 ; Entity 0 (anec_right)
    db #04 ; Entity 1 (nina_walk_left)
    db #00 ; Entity 2 (anec_right)
    ds 29, #FF ; Padding
SPRITE_MAX_ENTITY_LAYERS EQU 2  ; Max HW sprite layers per entity

; Table: Hardware Sprite Layer Colors (ROM initial values - copied to RAM at init)
; Format: db color_index
sprite_layer_colors_init:
    ; Entity 0 (anec_right) layers:
    db 15 ; Layer 0
    db 7 ; Layer 1
    ; Entity 1 (nina_walk_left) layers:
    db 6 ; Layer 0
    db 15 ; Layer 1
    ; Entity 2 (anec_right) layers:
    db 15 ; Layer 0
    db 7 ; Layer 1
    ds 26, 0 ; Padding

; Table: Hardware Sprite Layer Y Offsets (ROM initial values - copied to RAM at init)
; Format: db signed_offset_y
sprite_layer_y_offsets_init:
    ; Entity 0 (anec_right) layers:
    db 0 ; Layer 0
    db 0 ; Layer 1
    ; Entity 1 (nina_walk_left) layers:
    db 0 ; Layer 0
    db 0 ; Layer 1
    ; Entity 2 (anec_right) layers:
    db 0 ; Layer 0
    db 0 ; Layer 1
    ds 26, 0 ; Padding

; Table: SM Sprite Layer Colors (for Action_ChangeSprite runtime color update)
; Format: SPRITE_MAX_ENTITY_LAYERS bytes per sprite asset
; Entry[i*SPRITE_MAX_ENTITY_LAYERS + j] = color for HW sprite slot j of sprite i
SM_SpriteLayerColorTable_init:
    db 15, 7 ; Sprite 0: anec_right
    db 15, 0 ; Sprite 1: bola
    db 15, 8 ; Sprite 2: panell
    db 15, 0 ; Sprite 3: bola_dead
    db 6, 15 ; Sprite 4: nina_walk_left
    db 15, 6 ; Sprite 5: nina_idle_left
    db 6, 15 ; Sprite 6: nina_jump_left
    db 15, 7 ; Sprite 7: anec_left
    db 6, 15 ; Sprite 8: nina_walk_right
    db 15, 6 ; Sprite 9: nina_idle_right
    db 6, 15 ; Sprite 10: nina_jump_right

; Table: SM Sprite Layer Y Offsets (for Action_ChangeSprite runtime layer alignment)
; Format: SPRITE_MAX_ENTITY_LAYERS bytes per sprite asset
; Entry[i*SPRITE_MAX_ENTITY_LAYERS + j] = signed Y offset for HW sprite slot j of sprite i
SM_SpriteLayerYOffsetTable_init:
    db 0, 0 ; Sprite 0: anec_right
    db 0, 0 ; Sprite 1: bola
    db 0, 0 ; Sprite 2: panell
    db 0, 0 ; Sprite 3: bola_dead
    db 0, 0 ; Sprite 4: nina_walk_left
    db 0, 0 ; Sprite 5: nina_idle_left
    db 0, 0 ; Sprite 6: nina_jump_left
    db 0, 0 ; Sprite 7: anec_left
    db 0, 0 ; Sprite 8: nina_walk_right
    db 0, 0 ; Sprite 9: nina_idle_right
    db 0, 0 ; Sprite 10: nina_jump_right

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
    ld bc, 11
    ldir
    ld hl, sprite_asset_layer_count_init
    ld de, sprite_asset_layer_count
    ld bc, 11
    ldir
    ld hl, sprite_loop_flags_init
    ld de, sprite_loop_flags
    ld bc, 11
    ldir
    ld hl, sprite_dir_left_table_init
    ld de, sprite_dir_left_table
    ld bc, 11
    ldir
    ld hl, sprite_dir_right_table_init
    ld de, sprite_dir_right_table
    ld bc, 11
    ldir
    ld hl, sprite_dir_up_table_init
    ld de, sprite_dir_up_table
    ld bc, 11
    ldir
    ld hl, sprite_dir_down_table_init
    ld de, sprite_dir_down_table
    ld bc, 11
    ldir
    ld hl, SM_SpriteLayerColorTable_init
    ld de, SM_SpriteLayerColorTable
    ld bc, 22
    ldir
    ld hl, SM_SpriteLayerYOffsetTable_init
    ld de, SM_SpriteLayerYOffsetTable
    ld bc, 22
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
    ld bc, 10
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
; Slots required: 27/64
; ------------------------------------------------------------------
SPRITE_PATTERN_PACK_WORLDMAP_1770754170935_ID EQU 0

sprite_asset_base_pattern_slot_worldmap_1770754170935:
    db 0 ; Sprite 0: anec_right
    db 0 ; Sprite 1: bola
    db 4 ; Sprite 2: panell
    db 0 ; Sprite 3: bola_dead
    db 6 ; Sprite 4: nina_walk_left
    db 10 ; Sprite 5: nina_idle_left
    db 12 ; Sprite 6: nina_jump_left
    db 14 ; Sprite 7: anec_left
    db 18 ; Sprite 8: nina_walk_right
    db 22 ; Sprite 9: nina_idle_right
    db 24 ; Sprite 10: nina_jump_right

load_sprite_patterns_worldmap_1770754170935:
    ld hl, sprite_asset_base_pattern_slot_worldmap_1770754170935
    ld de, sprite_asset_base_pattern_slot_runtime
    ld bc, SPRITE_ASSET_COUNT
    ldir
    ld a, 104
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
    ; Sprite Asset 2: panell frame 0 (2 layers)
    ld a, RESOURCE_ID_PANELL_2_F0_LAYER1
    ld de, SPRPAT + (4 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_PANELL_2_F0_LAYER2
    ld de, SPRPAT + (5 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 4: nina_walk_left frame 0 (2 layers)
    ld a, RESOURCE_ID_NINA_WALK_LEFT_4_F0_LAYER0
    ld de, SPRPAT + (6 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_NINA_WALK_LEFT_4_F0_LAYER1
    ld de, SPRPAT + (7 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 4: nina_walk_left frame 1 (2 layers)
    ld a, RESOURCE_ID_NINA_WALK_LEFT_4_F1_LAYER0
    ld de, SPRPAT + (8 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_NINA_WALK_LEFT_4_F1_LAYER1
    ld de, SPRPAT + (9 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 5: nina_idle_left frame 0 (2 layers)
    ld a, RESOURCE_ID_NINA_IDLE_LEFT_5_F0_LAYER1
    ld de, SPRPAT + (10 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_NINA_IDLE_LEFT_5_F0_LAYER2
    ld de, SPRPAT + (11 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 6: nina_jump_left frame 0 (2 layers)
    ld a, RESOURCE_ID_NINA_JUMP_LEFT_6_F0_LAYER0
    ld de, SPRPAT + (12 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_NINA_JUMP_LEFT_6_F0_LAYER1
    ld de, SPRPAT + (13 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 7: anec_left frame 0 (2 layers)
    ld a, RESOURCE_ID_ANEC_LEFT_7_F0_LAYER1
    ld de, SPRPAT + (14 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_ANEC_LEFT_7_F0_LAYER2
    ld de, SPRPAT + (15 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 7: anec_left frame 1 (2 layers)
    ld a, RESOURCE_ID_ANEC_LEFT_7_F1_LAYER1
    ld de, SPRPAT + (16 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_ANEC_LEFT_7_F1_LAYER2
    ld de, SPRPAT + (17 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 8: nina_walk_right frame 0 (2 layers)
    ld a, RESOURCE_ID_NINA_WALK_RIGHT_8_F0_LAYER0
    ld de, SPRPAT + (18 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_NINA_WALK_RIGHT_8_F0_LAYER1
    ld de, SPRPAT + (19 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 8: nina_walk_right frame 1 (2 layers)
    ld a, RESOURCE_ID_NINA_WALK_RIGHT_8_F1_LAYER0
    ld de, SPRPAT + (20 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_NINA_WALK_RIGHT_8_F1_LAYER1
    ld de, SPRPAT + (21 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 9: nina_idle_right frame 0 (2 layers)
    ld a, RESOURCE_ID_NINA_IDLE_RIGHT_9_F0_LAYER1
    ld de, SPRPAT + (22 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_NINA_IDLE_RIGHT_9_F0_LAYER2
    ld de, SPRPAT + (23 * 32)
    call resource_load_to_vram_by_id
    ; Sprite Asset 10: nina_jump_right frame 0 (2 layers)
    ld a, RESOURCE_ID_NINA_JUMP_RIGHT_10_F0_LAYER0
    ld de, SPRPAT + (24 * 32)
    call resource_load_to_vram_by_id
    ld a, RESOURCE_ID_NINA_JUMP_RIGHT_10_F0_LAYER1
    ld de, SPRPAT + (25 * 32)
    call resource_load_to_vram_by_id
    ; Placeholder sprite used by missing sprite refs
    ld a, RESOURCE_ID_SPRITE_PLACEHOLDER_PATTERN
    ld de, SPRPAT + (26 * 32)
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
    ld bc, 128  ; Upload active sprite range + SAT end marker
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


; --- End of Far Bank 7 — pad to 8KB boundary ---
BANK_7_USED_END:
    ds #8000 - $, #FF
    org FAR_BANK_7_ROM_START + #2000

; ##################################################################
; FAR BANK 8 — [#6000h-#8000h] FAR CODE: sound
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank8 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-3). No far-to-far calls allowed.
; ##################################################################
FAR_BANK_8_ROM_START:
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


; --- End of Far Bank 8 — pad to 8KB boundary ---
BANK_8_USED_END:
    ds #8000 - $, #FF
    org FAR_BANK_8_ROM_START + #2000

; ##################################################################
; FAR BANK 9 — [#6000h-#8000h] FAR CODE: worlds
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank9 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-3). No far-to-far calls allowed.
; ##################################################################
FAR_BANK_9_ROM_START:
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
WORLD_NEW_WORLDMAP_SCREEN_COUNT EQU 3
WORLD_NEW_WORLDMAP_SCREEN_NEW_SCREENMAP_ID EQU 0
WORLD_NEW_WORLDMAP_SCREEN_PAN2_ID EQU 1
WORLD_NEW_WORLDMAP_SCREEN_PAN3_ID EQU 2

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
; Screens: 3
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
    call call_apply_collected_tiles_resident     ; Re-apply persistent collection state for this screen
    ret

; ==================================================================
; SCREEN TRANSITION FUNCTIONS
; ==================================================================

; ------------------------------------------------------------------
; World: New Worldmap
; Connections: 2
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
    call call_apply_collected_tiles_resident     ; Re-apply persistent collection state
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
    call call_apply_collected_tiles_resident     ; Re-apply persistent collection state
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
    call call_apply_collected_tiles_resident     ; Re-apply persistent collection state for new screen
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
    call call_apply_collected_tiles_resident     ; Re-apply persistent collection state for new screen
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
    call call_apply_collected_tiles_resident     ; Re-apply persistent collection state for new screen
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
    call call_apply_collected_tiles_resident     ; Re-apply persistent collection state for new screen
    ret

check_transition_worldmap_1770754170935_s2_skip_west:
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


; --- End of Far Bank 9 — pad to 8KB boundary ---
BANK_9_USED_END:
    ds #8000 - $, #FF
    org FAR_BANK_9_ROM_START + #2000

; ##################################################################
; FAR BANK 10 — [#6000h-#8000h] FAR CODE: font
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank10 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-3). No far-to-far calls allowed.
; ##################################################################
FAR_BANK_10_ROM_START:
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


; --- End of Far Bank 10 — pad to 8KB boundary ---
BANK_10_USED_END:
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
; Total HUD Elements: 2
; Screens with HUD: 1
;
; HUD Elements use TileBank fonts to render text in Screen 2 mode
; Each element can be positioned anywhere on screen (256x192 pixels)
; ==================================================================

; ------------------------------------------------------------------
; HUD DATA STRUCTURES
; ------------------------------------------------------------------

HUD_ELEMENT_COUNT   EQU 2

; HUD Element Data Table
; Format: [Type:1][X:1][Y:1][Width:1][Height:1][Flags:1][TextPtr:2][Visible:1]
hud_element_data:
    DB 1, 8, 8    ; Element 0: Score at (8,8)
    DB 13, 1, 0 ; W, H, Flags
    DW hud_text_0             ; Text pointer
    DB 1                ; Visible
    DB 2, 120, 8    ; Element 1: HighScore at (120,8)
    DB 16, 1, 0 ; W, H, Flags
    DW hud_text_1             ; Text pointer
    DB 1                ; Visible

; HUD Text Strings
hud_text_0:
    DB "SCORE: 000000", 0
hud_text_1:
    DB "HI-SCORE: 000000", 0

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
    ; No Lives element defined in HUD
    ret



; --- End of Far Bank 11 — pad to 8KB boundary ---
BANK_11_USED_END:
    ds #8000 - $, #FF
    org FAR_BANK_11_ROM_START + #2000

; ##################################################################
; FAR BANK 12 — [#6000h-#8000h] FAR CODE: animtiles
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank12 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-3). No far-to-far calls allowed.
; ##################################################################
FAR_BANK_12_ROM_START:
    org #6000

; ==================================================================
; ANIMATED TILES SYSTEM
; File: animtiles.asm
; Description: Background tile animation for water, lava, fire, etc.
; ==================================================================

; Auto-detected animated groups:
;   frame groups: 2
;   transform groups: 1

; ==================================================================
; ANIMATED TILES CONSTANTS
; ==================================================================

; Animation speeds (in frames)
ANIM_SPEED_SLOW         EQU 15      ; ~250ms (water)
ANIM_SPEED_MEDIUM       EQU 8       ; ~133ms (lava)
ANIM_SPEED_FAST         EQU 4       ; ~66ms (fire)

; Maximum animated tiles
MAX_ANIM_TILES          EQU 2
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
    db 133, 1, 8, 6, 16    ; corda -> tile tile_1772054023315
    dw anim_transform_0_corda
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


; --- End of Far Bank 12 — pad to 8KB boundary ---
BANK_12_USED_END:
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
BANK_13_USED_END:
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
; 6 tiles detected
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
BANK_14_USED_END:
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
; 6 tiles detected
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
BANK_15_USED_END:
    ds #8000 - $, #FF
    org FAR_BANK_15_ROM_START + #2000

; ##################################################################
; FAR BANK 16 — [#6000h-#8000h] FAR CODE: menus
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank16 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-3). No far-to-far calls allowed.
; ##################################################################
FAR_BANK_16_ROM_START:
    org #6000

; ==================================================================
; GAME MENUS
; File: menus.asm
; Description: Menu systems and user interface with custom font support
; ==================================================================

; ==================================================================
; MENU CONSTANTS
; ==================================================================

MENU_DUCK_INVADERS_ID EQU 0

; ==================================================================
; MENU FUNCTIONS
; ==================================================================

show_menu_gfn_1771277173268:
    ; Display DUCK INVADERS menu
    ; Set background color using VDP
    ld b, 17 ; Background (high) | Border (low)
    ld c, 7                     ; VDP Register 7
    call FAST_WRTVDP

    ; Set system color variables
    ld a, 1
    ld (BDRCLR), a

    ld a, 1
    ld (BAKCLR), a

    ld a, 15                    ; Default text color (White)
    ld (FORCLR), a

    ; Clear screen with background color
    call CLS

    ; Display menu title
    ld hl, menu_gfn_1771277173268_title
    ld de, NAMETBL + (5 * 32) + 10
    call call_print_string_screen2_resident

    ; Display menu options
    ; TODO: Add option rendering logic here

    ret

menu_gfn_1771277173268_title:
    db "DUCK INVADERS", 0

handle_menu_gfn_1771277173268:
    ; Handle DUCK INVADERS menu input
    call GTSTCK
    ; TODO: Implement input handling
    ret

; ==================================================================
; END OF MENUS
; ==================================================================


; --- End of Far Bank 16 — pad to 8KB boundary ---
BANK_16_USED_END:
    ds #8000 - $, #FF
    org FAR_BANK_16_ROM_START + #2000

; ==================================================================
; DATA BANKS — Zone-packed data (8192 bytes per zone)
; First data bank: 17
; Accessed through mapper P3 using
; (label & #1FFF) | #A000.
; BANK_NUMBER = ((label - #4000) / #2000)
; NOTE: Each zone is explicitly padded to preserve bank placement even after
;       server-side ZX0 block rewrites shrink individual data blobs.
; ==================================================================
; ------------------------------------------------------------------
; MEGAROM DATA ZONE PACKER (post-ZX0 final sizes)
; Zone size: 8192 bytes
; Data start address: #26000
; Total data bytes (post-ZX0 / final): 1593
; Zones used: 1
; ------------------------------------------------------------------
; ZONE 00 [#26000-#28000] bank 17 used=1593 slack=6599
;   + SCREEN_PAN1_0_EFFECTS_LAYOUT @ +#0000 size=6
;   + BEHAVIOR_PAN1_0_DATA @ +#0006 size=64
;   + SCREEN_PAN1_0_INTERACTION_TYPE_MAP @ +#0046 size=15
;   + SCREEN_PAN1_0_INTERACTION_VALUE_MAP @ +#0055 size=62
;   + SCREEN_PAN1_0_INTERACTION_TARGET_MAP @ +#0093 size=6
;   + SCREEN_PAN2_1_LAYOUT @ +#0099 size=52
;   + SCREEN_PAN2_1_EFFECTS_LAYOUT @ +#00CD size=6
;   + BEHAVIOR_PAN2_1_DATA @ +#00D3 size=40
;   + SCREEN_PAN2_1_INTERACTION_TYPE_MAP @ +#00FB size=14
;   + tile_pattern_bank0, tilebank_pattern_data_0 @ +#0109 size=124
;   + tile_color_bank0, tilebank_color_data_0 @ +#0185 size=54
;   + ANEC_RIGHT_0_F0_LAYER1 @ +#01BB size=32
;   + ANEC_RIGHT_0_F0_LAYER2 @ +#01DB size=29
;   + ANEC_RIGHT_0_F1_LAYER1 @ +#01F8 size=32
;   + ANEC_RIGHT_0_F1_LAYER2 @ +#0218 size=28
;   + BOLA_1_F0_LAYER1 @ +#0234 size=25
;   + BOLA_1_F1_LAYER1 @ +#024D size=29
;   + PANELL_2_F0_LAYER1 @ +#026A size=20
;   + SCREEN_PAN2_1_INTERACTION_VALUE_MAP @ +#027E size=40
;   + SCREEN_PAN2_1_INTERACTION_TARGET_MAP @ +#02A6 size=6
;   + SCREEN_BACKGROUND1_2_LAYOUT @ +#02AC size=6
;   + SCREEN_BACKGROUND1_2_EFFECTS_LAYOUT @ +#02B2 size=6
;   + BEHAVIOR_BACKGROUND1_2_DATA @ +#02B8 size=6
;   + SCREEN_BACKGROUND1_2_INTERACTION_TYPE_MAP @ +#02BE size=6
;   + SCREEN_BACKGROUND1_2_INTERACTION_VALUE_MAP @ +#02C4 size=6
;   + SCREEN_BACKGROUND1_2_INTERACTION_TARGET_MAP @ +#02CA size=6
;   + SCREEN_PAN3_3_LAYOUT @ +#02D0 size=62
;   + SCREEN_PAN3_3_EFFECTS_LAYOUT @ +#030E size=6
;   + PANELL_2_F0_LAYER2 @ +#0314 size=14
;   + BOLA_DEAD_3_F0_LAYER1 @ +#0322 size=32
;   + BOLA_DEAD_3_F1_LAYER1 @ +#0342 size=32
;   + BOLA_DEAD_3_F2_LAYER1 @ +#0362 size=32
;   + BOLA_DEAD_3_F3_LAYER1 @ +#0382 size=28
;   + BOLA_DEAD_3_F4_LAYER1 @ +#039E size=5
;   + NINA_WALK_LEFT_4_F0_LAYER0 @ +#03A3 size=28
;   + NINA_WALK_LEFT_4_F0_LAYER1 @ +#03BF size=25
;   + NINA_WALK_LEFT_4_F1_LAYER0 @ +#03D8 size=30
;   + NINA_WALK_LEFT_4_F1_LAYER1 @ +#03F6 size=30
;   + NINA_IDLE_LEFT_5_F0_LAYER1 @ +#0414 size=24
;   + NINA_IDLE_LEFT_5_F0_LAYER2 @ +#042C size=29
;   + NINA_JUMP_LEFT_6_F0_LAYER0 @ +#0449 size=30
;   + NINA_JUMP_LEFT_6_F0_LAYER1 @ +#0467 size=28
;   + ANEC_LEFT_7_F0_LAYER1 @ +#0483 size=32
;   + ANEC_LEFT_7_F0_LAYER2 @ +#04A3 size=29
;   + BEHAVIOR_PAN3_3_DATA @ +#04C0 size=33
;   + SCREEN_PAN3_3_INTERACTION_TYPE_MAP @ +#04E1 size=6
;   + SCREEN_PAN3_3_INTERACTION_VALUE_MAP @ +#04E7 size=33
;   + SCREEN_PAN3_3_INTERACTION_TARGET_MAP @ +#0508 size=6
;   + ANEC_LEFT_7_F1_LAYER1 @ +#050E size=32
;   + ANEC_LEFT_7_F1_LAYER2 @ +#052E size=29
;   + NINA_WALK_RIGHT_8_F0_LAYER0 @ +#054B size=30
;   + NINA_WALK_RIGHT_8_F0_LAYER1 @ +#0569 size=25
;   + NINA_WALK_RIGHT_8_F1_LAYER0 @ +#0582 size=31
;   + NINA_WALK_RIGHT_8_F1_LAYER1 @ +#05A1 size=27
;   + NINA_IDLE_RIGHT_9_F0_LAYER1 @ +#05BC size=24
;   + NINA_IDLE_RIGHT_9_F0_LAYER2 @ +#05D4 size=30
;   + NINA_JUMP_RIGHT_10_F0_LAYER0 @ +#05F2 size=30
;   + NINA_JUMP_RIGHT_10_F0_LAYER1 @ +#0610 size=28
;   + SPRITE_PLACEHOLDER_PATTERN @ +#062C size=5
;   + SCREEN_PAN1_0_EFFECT_ZONE_TABLE @ +#0631 size=1
;   + SCREEN_PAN1_0_BOSS_TABLE @ +#0632 size=1
;   + SCREEN_PAN2_1_EFFECT_ZONE_TABLE @ +#0633 size=1
;   + SCREEN_PAN2_1_BOSS_TABLE @ +#0634 size=1
;   + SCREEN_BACKGROUND1_2_EFFECT_ZONE_TABLE @ +#0635 size=1
;   + SCREEN_BACKGROUND1_2_BOSS_TABLE @ +#0636 size=1
;   + SCREEN_PAN3_3_EFFECT_ZONE_TABLE @ +#0637 size=1
;   + SCREEN_PAN3_3_BOSS_TABLE @ +#0638 size=1

    org #26000
; ==================================================================
; DATA ZONE 00 (bank 17) used=1593 slack=6599
; ==================================================================
; ==================================================================
    ; ZX0 compressed banked resource (768 -> 105 bytes)

SCREEN_PAN1_0_EFFECTS_LAYOUT:
    ; ZX0 compressed banked resource (768 -> 6 bytes)
    DB #85,#FF,#55,#5D,#55,#56


BEHAVIOR_PAN1_0_DATA:
    ; ZX0 compressed banked resource (768 -> 64 bytes)
    DB #85,#00,#56,#F1,#10,#CC,#7D,#C0,#69,#08,#53,#E1,#E7,#FE,#E5,#C0
    DB #3D,#80,#1F,#FF,#84,#C0,#5E,#FE,#F1,#C0,#4D,#D7,#5A,#D4,#C0,#3B
    DB #F6,#D4,#C0,#69,#08,#53,#CF,#F0,#FE,#5E,#D8,#0E,#90,#53,#97,#98
    DB #C0,#C0,#29,#08,#1F,#FE,#E4,#80,#3D,#FE,#1E,#C0,#10,#D5,#55,#60


SCREEN_PAN1_0_INTERACTION_TYPE_MAP:
    ; ZX0 compressed banked resource (768 -> 15 bytes)
    DB #80,#00,#50,#88,#01,#00,#54,#42,#DD,#01,#DA,#51,#75,#55,#58


SCREEN_PAN1_0_INTERACTION_VALUE_MAP:
    ; ZX0 compressed banked resource (768 -> 62 bytes)
    DB #85,#00,#56,#F1,#01,#CC,#7D,#C0,#68,#01,#00,#E1,#FE,#E5,#C0,#3D
    DB #80,#1F,#FF,#84,#C0,#5E,#FE,#F4,#C0,#5F,#CB,#60,#5A,#F5,#C0,#0E
    DB #F6,#F5,#C0,#1A,#01,#54,#F3,#E6,#D7,#FE,#F7,#DA,#C6,#47,#87,#A8
    DB #C0,#C0,#29,#01,#7C,#BA,#1F,#C0,#E0,#FE,#17,#55,#55,#80


SCREEN_PAN1_0_INTERACTION_TARGET_MAP:
    ; ZX0 compressed banked resource (768 -> 6 bytes)
    DB #85,#00,#55,#5D,#55,#56


SCREEN_PAN2_1_LAYOUT:
    ; ZX0 compressed banked resource (768 -> 52 bytes)
    DB #90,#FF,#03,#AA,#83,#82,#86,#51,#A5,#80,#4E,#C1,#E4,#81,#FC,#2E
    DB #FF,#FE,#01,#5D,#9D,#E0,#C1,#B4,#5D,#D5,#46,#5D,#71,#4A,#B9,#83
    DB #FC,#0C,#91,#FA,#3D,#A5,#2F,#C2,#C0,#47,#34,#06,#0F,#FC,#FD,#81
    DB #FC,#1D,#55,#56


SCREEN_PAN2_1_EFFECTS_LAYOUT:
    ; ZX0 compressed banked resource (768 -> 6 bytes)
    DB #85,#FF,#55,#5D,#55,#56


BEHAVIOR_PAN2_1_DATA:
    ; ZX0 compressed banked resource (768 -> 40 bytes)
    DB #90,#00,#03,#AA,#C1,#10,#08,#54,#F5,#80,#79,#FE,#1A,#00,#01,#02
    DB #94,#10,#28,#00,#55,#5D,#D1,#5E,#F7,#D6,#34,#FA,#1F,#C0,#A5,#08
    DB #0F,#80,#57,#D5,#FE,#35,#55,#58


SCREEN_PAN2_1_INTERACTION_TYPE_MAP:
    ; ZX0 compressed banked resource (768 -> 14 bytes)
    DB #90,#00,#42,#24,#01,#00,#54,#0D,#34,#C2,#00,#D5,#55,#60


tile_pattern_bank0:
    ; ZX0 compressed banked resource (72 -> 62 bytes)
    DB #28,#00,#7F,#BF,#00,#EF,#F5,#F6,#83,#FF,#FF,#00,#FB,#88,#E5,#FE
    DB #FE,#EF,#FF,#FB,#E4,#B8,#F7,#FF,#4A,#00,#7E,#DD,#00,#F7,#09,#FE
    DB #00,#18,#30,#68,#19,#18,#0C,#69,#98,#80,#18,#3C,#7E,#B9,#34,#18
    DB #01,#F0,#8E,#80,#FE,#B3,#1D,#DF,#AF,#DF,#FF,#7F,#55,#56

tilebank_pattern_data_0:
    ; ZX0 compressed banked resource (72 -> 62 bytes)
    DB #28,#00,#7F,#BF,#00,#EF,#F5,#F6,#83,#FF,#FF,#00,#FB,#88,#E5,#FE
    DB #FE,#EF,#FF,#FB,#E4,#B8,#F7,#FF,#4A,#00,#7E,#DD,#00,#F7,#09,#FE
    DB #00,#18,#30,#68,#19,#18,#0C,#69,#98,#80,#18,#3C,#7E,#B9,#34,#18
    DB #01,#F0,#8E,#80,#FE,#B3,#1D,#DF,#AF,#DF,#FF,#7F,#55,#56


tile_color_bank0:
    ; ZX0 compressed banked resource (72 -> 27 bytes)
    DB #8A,#41,#51,#FF,#FA,#F0,#F7,#FE,#E0,#E9,#F0,#BA,#C1,#FF,#31,#A2
    DB #C1,#8A,#81,#91,#A0,#A1,#4F,#9A,#75,#55,#58

tilebank_color_data_0:
    ; ZX0 compressed banked resource (72 -> 27 bytes)
    DB #8A,#41,#51,#FF,#FA,#F0,#F7,#FE,#E0,#E9,#F0,#BA,#C1,#FF,#31,#A2
    DB #C1,#8A,#81,#91,#A0,#A1,#4F,#9A,#75,#55,#58


ANEC_RIGHT_0_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#00,#01,#01,#03,#02,#03,#01,#00,#00,#00,#09,#0E,#07,#04,#0A
    DB #00,#C0,#B0,#D0,#58,#DC,#F7,#E0,#40,#00,#E0,#F8,#F8,#F0,#08,#14



ANEC_RIGHT_0_F0_LAYER2: ; Brush Color Index 2 (Actual Color: #42EBF5)
    ; ZX0 compressed banked resource (32 -> 29 bytes)
    DB #82,#00,#17,#01,#00,#40,#60,#30,#19,#16,#11,#08,#00,#04,#A6,#E0
    DB #20,#A0,#20,#E6,#FF,#E0,#18,#04,#ED,#E1,#08,#55,#56


ANEC_RIGHT_0_F1_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#00,#01,#01,#03,#02,#03,#01,#00,#20,#10,#09,#0E,#03,#00,#00
    DB #00,#C0,#B0,#D0,#58,#DC,#F7,#E0,#40,#00,#E0,#78,#F8,#F0,#40,#A0



ANEC_RIGHT_0_F1_LAYER2: ; Brush Color Index 2 (Actual Color: #42EBF5)
    ; ZX0 compressed banked resource (32 -> 28 bytes)
    DB #82,#00,#E4,#01,#FB,#E2,#E0,#D0,#29,#16,#01,#04,#E4,#7A,#20,#A0
    DB #20,#F4,#1A,#E0,#18,#84,#04,#08,#D5,#40,#55,#60


BOLA_1_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    ; ZX0 compressed banked resource (32 -> 25 bytes)
    DB #89,#00,#26,#03,#0F,#1F,#3F,#2F,#3F,#60,#1F,#07,#00,#82,#E0,#90
    DB #68,#FC,#19,#B5,#F8,#E0,#00,#55,#58


BOLA_1_F1_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    ; ZX0 compressed banked resource (32 -> 29 bytes)
    DB #48,#00,#07,#0F,#1D,#1B,#3F,#6A,#1F,#68,#0F,#07,#00,#AA,#C0,#E0
    DB #F0,#AA,#F8,#D8,#E7,#F8,#F3,#E0,#C0,#00,#55,#55,#80


PANELL_2_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    ; ZX0 compressed banked resource (32 -> 20 bytes)
    DB #92,#00,#8A,#3F,#00,#06,#1A,#30,#38,#3C,#FE,#FF,#7B,#3C,#18,#10
    DB #E8,#55,#55,#80


SCREEN_PAN2_1_INTERACTION_VALUE_MAP:
    ; ZX0 compressed banked resource (768 -> 40 bytes)
    DB #90,#00,#12,#FD,#01,#FD,#C0,#1F,#80,#57,#91,#FE,#A0,#00,#10,#29
    DB #01,#42,#85,#00,#55,#DD,#5E,#1F,#D6,#73,#FA,#41,#FF,#C0,#BC,#17
    DB #80,#80,#3D,#FE,#53,#55,#55,#80


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
    ; ZX0 compressed banked resource (768 -> 62 bytes)
    DB #84,#FF,#10,#8F,#80,#81,#FC,#0F,#DF,#D2,#FC,#24,#82,#83,#7D,#28
    DB #43,#24,#DE,#54,#E4,#C0,#72,#E7,#97,#88,#C5,#80,#A4,#88,#5F,#FC
    DB #0C,#C3,#04,#C7,#00,#9D,#2C,#C0,#AC,#A4,#83,#F0,#C0,#3A,#80,#95
    DB #82,#7C,#FC,#4D,#DE,#2C,#FC,#57,#BD,#C0,#80,#5D,#55,#56


SCREEN_PAN3_3_EFFECTS_LAYOUT:
    ; ZX0 compressed banked resource (768 -> 6 bytes)
    DB #85,#FF,#55,#5D,#55,#56


PANELL_2_F0_LAYER2: ; Brush Color Index 2 (Actual Color: #FF0000)
    ; ZX0 compressed banked resource (32 -> 14 bytes)
    DB #81,#00,#89,#3F,#00,#48,#6D,#C2,#24,#28,#30,#00,#55,#56


BOLA_DEAD_3_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#07,#05,#1D,#1B,#1E,#1F,#3D,#1F,#37,#39,#1F,#1F,#0F,#07,#00
    DB #00,#00,#E0,#60,#60,#B0,#70,#68,#C8,#58,#F0,#B0,#B0,#60,#C0,#00

;; ---- End of Frame: bola_dead_3_F0 ----

;; ---- Sprite Frame: bola_dead_3_F1 ----
;; Size: 16x16



BOLA_DEAD_3_F1_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#05,#01,#05,#03,#36,#22,#17,#3D,#0F,#36,#1F,#0F,#08,#04,#00
    DB #00,#40,#E0,#40,#60,#80,#F8,#78,#80,#50,#D0,#70,#30,#20,#40,#00

;; ---- End of Frame: bola_dead_3_F1 ----

;; ---- Sprite Frame: bola_dead_3_F2 ----
;; Size: 16x16



BOLA_DEAD_3_F2_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#05,#0D,#09,#00,#0B,#22,#30,#11,#1D,#2F,#0C,#10,#08,#01,#00
    DB #00,#40,#20,#40,#40,#00,#58,#50,#00,#40,#50,#10,#10,#A0,#40,#00

;; ---- End of Frame: bola_dead_3_F2 ----

;; ---- Sprite Frame: bola_dead_3_F3 ----
;; Size: 16x16



BOLA_DEAD_3_F3_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    ; ZX0 compressed banked resource (32 -> 28 bytes)
    DB #89,#00,#7A,#08,#00,#0C,#04,#20,#2A,#01,#EC,#F9,#06,#F6,#89,#60
    DB #40,#20,#A6,#30,#18,#00,#20,#20,#A0,#35,#55,#58


BOLA_DEAD_3_F4_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    ; ZX0 compressed banked resource (32 -> 5 bytes)
    DB #95,#00,#75,#55,#58


NINA_WALK_LEFT_4_F0_LAYER0: ; Brush Color Index 0 (Actual Color: #D4524D)
    ; ZX0 compressed banked resource (32 -> 28 bytes)
    DB #21,#1F,#00,#9A,#03,#16,#03,#E9,#07,#EE,#22,#02,#E0,#E0,#AC,#3A
    DB #01,#69,#C0,#40,#C0,#F5,#F0,#00,#80,#FD,#55,#58


NINA_WALK_LEFT_4_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    ; ZX0 compressed banked resource (32 -> 25 bytes)
    DB #12,#00,#0F,#0B,#1B,#1F,#0F,#01,#00,#29,#00,#1F,#EF,#9B,#FF,#40
    DB #C0,#80,#8F,#E6,#F5,#D5,#FD,#55,#60


NINA_WALK_LEFT_4_F1_LAYER0: ; Brush Color Index 0 (Actual Color: #D4524D)
    ; ZX0 compressed banked resource (32 -> 30 bytes)
    DB #61,#03,#1F,#00,#91,#E9,#03,#16,#03,#07,#05,#08,#00,#28,#C0,#E0
    DB #E1,#95,#2A,#DE,#6D,#C0,#40,#E0,#F0,#D4,#00,#04,#55,#56


NINA_WALK_LEFT_4_F1_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    ; ZX0 compressed banked resource (32 -> 30 bytes)
    DB #A0,#00,#68,#0F,#0B,#1B,#1F,#0F,#01,#00,#29,#00,#66,#0A,#00,#08
    DB #10,#00,#6F,#40,#C0,#80,#F0,#8F,#28,#04,#F9,#55,#55,#80


NINA_IDLE_LEFT_5_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    ; ZX0 compressed banked resource (32 -> 24 bytes)
    DB #12,#00,#0F,#0B,#1B,#1F,#0F,#01,#00,#01,#00,#1F,#F2,#82,#40,#C0
    DB #80,#80,#7A,#FD,#80,#75,#55,#58


NINA_IDLE_LEFT_5_F0_LAYER2: ; Brush Color Index 2 (Actual Color: #D4524D)
    ; ZX0 compressed banked resource (32 -> 29 bytes)
    DB #21,#1F,#00,#9A,#03,#02,#03,#22,#07,#00,#28,#02,#E0,#29,#A0,#30
    DB #18,#08,#7D,#C0,#40,#C0,#E0,#F0,#00,#80,#FD,#55,#56


NINA_JUMP_LEFT_6_F0_LAYER0: ; Brush Color Index 0 (Actual Color: #D4524D)
    ; ZX0 compressed banked resource (32 -> 30 bytes)
    DB #61,#03,#1F,#00,#87,#13,#06,#03,#87,#55,#A0,#F0,#2A,#C0,#E0,#E0
    DB #90,#28,#04,#02,#02,#54,#9A,#F0,#D6,#00,#D5,#00,#55,#60


NINA_JUMP_LEFT_6_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    ; ZX0 compressed banked resource (32 -> 28 bytes)
    DB #A0,#00,#68,#0F,#0B,#1B,#1F,#0F,#21,#28,#01,#00,#92,#AA,#00,#68
    DB #40,#C0,#80,#E2,#00,#2A,#E9,#28,#02,#35,#55,#58


ANEC_LEFT_7_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#03,#0D,#0B,#1A,#3B,#EF,#07,#02,#00,#07,#1F,#1F,#0F,#10,#28
    DB #00,#00,#80,#80,#C0,#40,#C0,#80,#00,#00,#00,#90,#70,#E0,#20,#50



ANEC_LEFT_7_F0_LAYER2: ; Brush Color Index 2 (Actual Color: #42EBF5)
    ; ZX0 compressed banked resource (32 -> 29 bytes)
    DB #89,#00,#E8,#04,#05,#04,#F4,#6E,#07,#18,#20,#20,#10,#FD,#9A,#00
    DB #80,#93,#02,#06,#0C,#98,#68,#88,#B5,#E5,#20,#55,#58


BEHAVIOR_PAN3_3_DATA:
    ; ZX0 compressed banked resource (768 -> 33 bytes)
    DB #84,#00,#10,#A5,#10,#38,#C0,#03,#D0,#FE,#02,#81,#10,#E4,#C0,#53
    DB #C4,#FE,#CE,#1C,#84,#10,#0E,#C0,#00,#77,#EA,#53,#D5,#C0,#75,#55
    DB #58


SCREEN_PAN3_3_INTERACTION_TYPE_MAP:
    ; ZX0 compressed banked resource (768 -> 6 bytes)
    DB #85,#00,#55,#5D,#55,#56


SCREEN_PAN3_3_INTERACTION_VALUE_MAP:
    ; ZX0 compressed banked resource (768 -> 33 bytes)
    DB #84,#00,#10,#A5,#01,#38,#C0,#03,#D0,#FE,#02,#81,#01,#E4,#C0,#53
    DB #C4,#FE,#CE,#1C,#84,#01,#0E,#C0,#00,#77,#EA,#53,#D5,#C0,#75,#55
    DB #58


SCREEN_PAN3_3_INTERACTION_TARGET_MAP:
    ; ZX0 compressed banked resource (768 -> 6 bytes)
    DB #85,#00,#55,#5D,#55,#56


ANEC_LEFT_7_F1_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    DB #00,#03,#0D,#0B,#1A,#3B,#EF,#07,#02,#00,#07,#1E,#1F,#0F,#02,#05
    DB #00,#00,#80,#80,#C0,#40,#C0,#80,#00,#04,#08,#90,#70,#C0,#00,#00



ANEC_LEFT_7_F1_LAYER2: ; Brush Color Index 2 (Actual Color: #42EBF5)
    ; ZX0 compressed banked resource (32 -> 29 bytes)
    DB #89,#00,#E8,#04,#05,#04,#F4,#6B,#07,#18,#21,#20,#10,#02,#BA,#EC
    DB #FB,#80,#24,#F5,#07,#0B,#94,#68,#80,#20,#F1,#55,#58


NINA_WALK_RIGHT_8_F0_LAYER0: ; Brush Color Index 0 (Actual Color: #D4524D)
    ; ZX0 compressed banked resource (32 -> 30 bytes)
    DB #A0,#07,#A1,#35,#5C,#80,#00,#61,#03,#02,#03,#07,#0F,#00,#01,#00
    DB #01,#F8,#00,#9A,#C0,#68,#C0,#EB,#E0,#F0,#40,#55,#55,#80


NINA_WALK_RIGHT_8_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    ; ZX0 compressed banked resource (32 -> 25 bytes)
    DB #89,#00,#A8,#02,#03,#01,#00,#3E,#F5,#F0,#92,#F0,#D0,#D8,#F8,#F0
    DB #80,#BF,#94,#ED,#FE,#B5,#80,#55,#58


NINA_WALK_RIGHT_8_F1_LAYER0: ; Brush Color Index 0 (Actual Color: #D4524D)
    ; ZX0 compressed banked resource (32 -> 31 bytes)
    DB #48,#03,#07,#87,#A9,#54,#00,#85,#83,#03,#02,#07,#0F,#2B,#00,#20
    DB #00,#C0,#F8,#00,#86,#F1,#68,#C0,#E0,#A0,#10,#B5,#14,#55,#58


NINA_WALK_RIGHT_8_F1_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    ; ZX0 compressed banked resource (32 -> 27 bytes)
    DB #99,#00,#BE,#02,#03,#01,#F0,#3E,#14,#20,#E4,#4A,#F0,#D0,#D8,#F8
    DB #F0,#80,#EA,#94,#E9,#50,#35,#10,#08,#55,#58


NINA_IDLE_RIGHT_9_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    ; ZX0 compressed banked resource (32 -> 24 bytes)
    DB #89,#00,#A8,#02,#03,#01,#00,#3E,#F5,#F0,#92,#F0,#D0,#D8,#F8,#F0
    DB #80,#FF,#FD,#FE,#D5,#F3,#55,#60


NINA_IDLE_RIGHT_9_F0_LAYER2: ; Brush Color Index 2 (Actual Color: #D4524D)
    ; ZX0 compressed banked resource (32 -> 30 bytes)
    DB #A0,#07,#A1,#05,#0C,#18,#10,#61,#03,#02,#03,#07,#0F,#00,#01,#00
    DB #01,#F8,#00,#9A,#C0,#40,#C0,#EB,#E0,#F3,#00,#55,#55,#80


NINA_JUMP_RIGHT_10_F0_LAYER0: ; Brush Color Index 0 (Actual Color: #D4524D)
    ; ZX0 compressed banked resource (32 -> 30 bytes)
    DB #28,#03,#07,#28,#09,#14,#20,#40,#58,#03,#2A,#07,#0F,#6B,#00,#40
    DB #00,#C0,#F8,#00,#64,#8D,#C8,#60,#C0,#E1,#AA,#00,#55,#56


NINA_JUMP_RIGHT_10_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    ; ZX0 compressed banked resource (32 -> 28 bytes)
    DB #99,#00,#A6,#02,#03,#01,#00,#54,#00,#8F,#14,#40,#E4,#85,#9D,#F0
    DB #D0,#D8,#F8,#F0,#84,#14,#80,#00,#00,#55,#55,#56


SPRITE_PLACEHOLDER_PATTERN:
    ; ZX0 compressed banked resource (32 -> 5 bytes)
    DB #95,#FF,#75,#55,#58


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


    ds #28000 - $, #FF

    end                 ; End of assembly
