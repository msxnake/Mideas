; ==================================================================
; ATENASTEXTSCROLLCURRENTTEST - MEGAROM UNIFIED FILE
; File: unitedFiles.asm
; ROM Mode: megarom (multi-bank, 8KB banks, ASCII8K/Konami pattern)
; Mapper: konami
;
; Bank 0 [#4000-#5FFFh] : Bootstrap (header, bios, mapper, interrupt, init)
; Banks 1-2 [#6000-#9FFFh] : Resident engine code
; Bank 3+ (data) [#A000h+] : DATA TABLES (patterns, colors, screens, font - mapper data-window switch)
; Banks after data [far]    : Overlay code, constrained to P1 trampolines
; Generated artifacts: resource_ids.asm, resource_table.asm, resource_manager.asm, packing_manifest.txt, packing_manifest.json, manifest_v2.json, banks.json, project_usage.json, load_plan.json, bank_optimizer.json, tilebank_integrity.json, unused_report.txt, segment_budget.json
;
; Tiles: 0
; Sprites: 1
; Screens: 1
; Entities: 1
; Menus: No
; HUD: No
; State Machines: 0
; Engine Execution Mode: interruptTaskManager
; IRQ Task: slot 1 -> task_frame_counter (timer, every 1 frame)
; Mainline: postHalt -> update_sprites_to_vram (sprites)
; Mainline: preUpdate -> check_world_screen_transition (screenFlow)
; Mainline: postUpdate -> update_all_entities (entities)
; Mainline: postUpdate -> execute_all_state_machines (stateMachines)
; Mainline: postUpdate -> update_animated_tiles (animation)
; Mainline: render -> render_hud (hud)
; Warning: none
; ------------------------------------------------------------------
; DYNAMIC BANK PACKER (FFD) — Estimated layout for code banks
; ------------------------------------------------------------------
; Bank 1 [#6000-#8000]: components (15385/8192 bytes est.)
; Bank 2 [#8000-#A000]: components_tail, gameflow (20996/8192 bytes est.)
; Bank 4 [#6000-#8000]: font (6704/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 5 [#6000-#8000]: gameflow_aux (5276/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 6 [#6000-#8000]: entities (5018/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 7 [#6000-#8000]: sound (4763/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 8 [#6000-#8000]: screen_loaders (4557/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 9 [#6000-#8000]: sprites (3098/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 10 [#6000-#8000]: animtiles (2640/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 11 [#6000-#8000]: scroll (2407/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 12 [#6000-#8000]: worlds (1590/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 13 [#6000-#8000]: screens_code (1219/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 14 [#6000-#8000]: bosses (331/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 15 [#6000-#8000]: hud (114/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 16 [#6000-#8000]: patterns_code (74/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 17 [#6000-#8000]: colors_code (73/8192 bytes est.) [FAR — accessed via trampoline]
; Bank 3+ (data) [#A000+]: DATA mapped through P3/A000 before far code banks
; ------------------------------------------------------------------
; Far code banks: bank4(font) bank5(gameflow_aux) bank6(entities) bank7(sound) bank8(screen_loaders) bank9(sprites) bank10(animtiles) bank11(scroll) bank12(worlds) bank13(screens_code) bank14(bosses) bank15(hud) bank16(patterns_code) bank17(colors_code)
; ------------------------------------------------------------------
; 8KB BANK PACKER ESTIMATE (diagnostic placement view)
; Runtime bank constants are derived from label addresses at assemble time.
; Estimated payload bytes: 74205
; Estimated banks used: 10
; ------------------------------------------------------------------
; BANK 00 @#0000 : page0.asm (96 bytes)
; BANK 00 @#0060 : patterns.asm (74 bytes)
; BANK 00 @#00AA : colors.asm (73 bytes)
; BANK 00 @#00F3 : components.asm part 1/3 (7949 bytes)
; BANK 01 @#0000 : components.asm part 2/3 (8192 bytes)
; BANK 02 @#0000 : components.asm part 3/3 (5021 bytes)
; BANK 02 @#139D : entities.asm (3171 bytes)
; BANK 03 @#0000 : entities.asm (1847 bytes)
; BANK 03 @#0737 : worlds.asm (1590 bytes)
; BANK 03 @#0D6D : screens.asm (4755 bytes)
; BANK 04 @#0000 : screens.asm (924 bytes)
; BANK 04 @#039C : sprites.asm (3098 bytes)
; BANK 04 @#0FB6 : font.asm (4170 bytes)
; BANK 05 @#0000 : font.asm (2534 bytes)
; BANK 05 @#09E6 : hud.asm (114 bytes)
; BANK 05 @#0A58 : menus.asm (219 bytes)
; BANK 05 @#0B33 : sound.asm (4763 bytes)
; BANK 05 @#1DCE : scroll.asm (562 bytes)
; BANK 06 @#0000 : scroll.asm (1845 bytes)
; BANK 06 @#0735 : animtiles.asm (2640 bytes)
; BANK 06 @#1185 : bosses.asm (331 bytes)
; BANK 06 @#12D0 : statemachine.asm (5 bytes)
; BANK 06 @#12D5 : gameflow.asm part 1/3 (3371 bytes)
; BANK 07 @#0000 : gameflow.asm part 2/3 (8192 bytes)
; BANK 08 @#0000 : gameflow.asm part 3/3 (8192 bytes)
; BANK 09 @#0000 : gameflow.asm part 4/3 (477 bytes); ==================================================================

; [[[MIDEAS_ARTIFACT:resource_ids.asm:BEGIN]]]
; ; ==================================================================
; ; GENERATED RESOURCE IDS
; ; Generated by MegaROM export backend.
; ; ==================================================================
; RESOURCE_ID_INVALID EQU #FF
;
; RESOURCE_ID_NEW_SPRITE_0_F0_LAYER1       EQU 0
; RESOURCE_ID_SPRITE_PLACEHOLDER_PATTERN   EQU 1
; RESOURCE_ID_SCREEN_PANTALLA1_0_LAYOUT    EQU 2
; RESOURCE_ID_SCREEN_PANTALLA1_0_EFFECTS_LAYOUT EQU 3
; RESOURCE_ID_SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE EQU 4
; RESOURCE_ID_SCREEN_PANTALLA1_0_BOSS_TABLE EQU 5
; RESOURCE_ID_BEHAVIOR_PANTALLA1_0_DATA    EQU 6
; RESOURCE_ID_SCREEN_PANTALLA1_0_INTERACTION_TYPE_MAP EQU 7
; RESOURCE_ID_SCREEN_PANTALLA1_0_INTERACTION_VALUE_MAP EQU 8
; RESOURCE_ID_SCREEN_PANTALLA1_0_INTERACTION_TARGET_MAP EQU 9
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
; RESOURCE_TABLE_COUNT EQU 10
;
; resource_table:
;     ; NEW_SPRITE_0_F0_LAYER1
;     db 3
;     dw #A024
;     dw 25
;     dw 32
;     db 1
;     ; SPRITE_PLACEHOLDER_PATTERN
;     db 3
;     dw #A03D
;     dw 5
;     dw 32
;     db 1
;     ; SCREEN_PANTALLA1_0_LAYOUT
;     db 3
;     dw #A000
;     dw 6
;     dw 768
;     db 1
;     ; SCREEN_PANTALLA1_0_EFFECTS_LAYOUT
;     db 3
;     dw #A006
;     dw 6
;     dw 768
;     db 1
;     ; SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE
;     db 3
;     dw #A042
;     dw 1
;     dw 1
;     db 0
;     ; SCREEN_PANTALLA1_0_BOSS_TABLE
;     db 3
;     dw #A043
;     dw 1
;     dw 1
;     db 0
;     ; BEHAVIOR_PANTALLA1_0_DATA
;     db 3
;     dw #A00C
;     dw 6
;     dw 768
;     db 1
;     ; SCREEN_PANTALLA1_0_INTERACTION_TYPE_MAP
;     db 3
;     dw #A012
;     dw 6
;     dw 768
;     db 1
;     ; SCREEN_PANTALLA1_0_INTERACTION_VALUE_MAP
;     db 3
;     dw #A018
;     dw 6
;     dw 768
;     db 1
;     ; SCREEN_PANTALLA1_0_INTERACTION_TARGET_MAP
;     db 3
;     dw #A01E
;     dw 6
;     dw 768
;     db 1
; [[[MIDEAS_ARTIFACT:resource_table.asm:END]]]

; [[[MIDEAS_ARTIFACT:packing_manifest.txt:BEGIN]]]
; MEGAROM PACKING MANIFEST
; Zone size: 8192
; Data start address: #A000
; Total resource blocks: 10
;
; BANK 03 used 68 / 8192
; - SCREEN_PANTALLA1_0_LAYOUT            6 stored /   768 raw bytes @ #A000 (rom #A000, offset +#0000) [SCREENS/SCREEN_LAYOUT] flags=1
;   reason: post-ZX0 first-fit single SCREEN_PANTALLA1_0_LAYOUT resource; ZX0 6/768 bytes; bank 3 zone 0 offset +#0000; zone slack after pack 8124 bytes
; - SCREEN_PANTALLA1_0_EFFECTS_LAYOUT     6 stored /   768 raw bytes @ #A006 (rom #A006, offset +#0006) [SCREENS/SCREEN_EFFECTS_LAYOUT] flags=1
;   reason: post-ZX0 first-fit single SCREEN_PANTALLA1_0_EFFECTS_LAYOUT resource; ZX0 6/768 bytes; bank 3 zone 0 offset +#0006; zone slack after pack 8124 bytes
; - BEHAVIOR_PANTALLA1_0_DATA            6 stored /   768 raw bytes @ #A00C (rom #A00C, offset +#000C) [SCREENS/SCREEN_BEHAVIOR_MAP] flags=1
;   reason: post-ZX0 first-fit single BEHAVIOR_PANTALLA1_0_DATA resource; ZX0 6/768 bytes; bank 3 zone 0 offset +#000C; zone slack after pack 8124 bytes
; - SCREEN_PANTALLA1_0_INTERACTION_TYPE_MAP     6 stored /   768 raw bytes @ #A012 (rom #A012, offset +#0012) [SCREENS/SCREEN_DATA] flags=1
;   reason: post-ZX0 first-fit single SCREEN_PANTALLA1_0_INTERACTION_TYPE_MAP resource; ZX0 6/768 bytes; bank 3 zone 0 offset +#0012; zone slack after pack 8124 bytes
; - SCREEN_PANTALLA1_0_INTERACTION_VALUE_MAP     6 stored /   768 raw bytes @ #A018 (rom #A018, offset +#0018) [SCREENS/SCREEN_DATA] flags=1
;   reason: post-ZX0 first-fit single SCREEN_PANTALLA1_0_INTERACTION_VALUE_MAP resource; ZX0 6/768 bytes; bank 3 zone 0 offset +#0018; zone slack after pack 8124 bytes
; - SCREEN_PANTALLA1_0_INTERACTION_TARGET_MAP     6 stored /   768 raw bytes @ #A01E (rom #A01E, offset +#001E) [SCREENS/SCREEN_DATA] flags=1
;   reason: post-ZX0 first-fit single SCREEN_PANTALLA1_0_INTERACTION_TARGET_MAP resource; ZX0 6/768 bytes; bank 3 zone 0 offset +#001E; zone slack after pack 8124 bytes
; - NEW_SPRITE_0_F0_LAYER1              25 stored /    32 raw bytes @ #A024 (rom #A024, offset +#0024) [SPRITES/SPRITE_PATTERNS] flags=1
;   reason: post-ZX0 first-fit single NEW_SPRITE_0_F0_LAYER1 resource; ZX0 25/32 bytes; bank 3 zone 0 offset +#0024; zone slack after pack 8124 bytes
; - SPRITE_PLACEHOLDER_PATTERN           5 stored /    32 raw bytes @ #A03D (rom #A03D, offset +#003D) [SPRITES/SPRITE_PATTERNS] flags=1
;   reason: post-ZX0 first-fit single SPRITE_PLACEHOLDER_PATTERN resource; ZX0 5/32 bytes; bank 3 zone 0 offset +#003D; zone slack after pack 8124 bytes
; - SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE     1 stored /     1 raw bytes @ #A042 (rom #A042, offset +#0042) [SCREENS/SCREEN_EFFECT_ZONE_TABLE] flags=0
;   reason: post-ZX0 first-fit single SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE resource; raw 1 bytes; bank 3 zone 0 offset +#0042; zone slack after pack 8124 bytes
; - SCREEN_PANTALLA1_0_BOSS_TABLE        1 stored /     1 raw bytes @ #A043 (rom #A043, offset +#0043) [SCREENS/SCREEN_DATA] flags=0
;   reason: post-ZX0 first-fit single SCREEN_PANTALLA1_0_BOSS_TABLE resource; raw 1 bytes; bank 3 zone 0 offset +#0043; zone slack after pack 8124 bytes
; FREE 8124
;
; [[[MIDEAS_ARTIFACT:packing_manifest.txt:END]]]

; [[[MIDEAS_ARTIFACT:packing_manifest.json:BEGIN]]]
; {
;   "version": 1,
;   "mapper": {
;     "format": "konami",
;     "dataWindowPage": "p3",
;     "windowBase": "#A000",
;     "windowMask": "#1FFF",
;     "bankDivisor": "#2000",
;     "zoneSize": 8192
;   },
;   "summary": {
;     "dataStartAddress": 40960,
;     "totalSourceBytes": 4674,
;     "resourceCount": 10,
;     "zoneCount": 1,
;     "overflowCount": 0,
;     "totalStoredBytes": 68,
;     "compressedResourceCount": 8
;   },
;   "banks": [
;     {
;       "bank": 3,
;       "zoneIndex": 0,
;       "orgAddress": 40960,
;       "endAddress": 49152,
;       "usedBytes": 68,
;       "freeBytes": 8124,
;       "verification": {
;         "algorithm": "fnv1a32-resource-metadata",
;         "metadataChecksum": "fnv1a32:AF88F5F8",
;         "resourceCount": 10,
;         "storedBytes": 68
;       },
;       "resources": [
;         {
;           "id": 2,
;           "label": "SCREEN_PANTALLA1_0_LAYOUT",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PANTALLA1_0_LAYOUT",
;           "group": "SCREENS",
;           "type": "SCREEN_LAYOUT",
;           "bank": 3,
;           "zoneOffset": 0,
;           "physicalAddress": 40960,
;           "windowAddress": 40960,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 2,
;           "placementReason": "post-ZX0 first-fit single SCREEN_PANTALLA1_0_LAYOUT resource; ZX0 6/768 bytes; bank 3 zone 0 offset +#0000; zone slack after pack 8124 bytes"
;         },
;         {
;           "id": 3,
;           "label": "SCREEN_PANTALLA1_0_EFFECTS_LAYOUT",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PANTALLA1_0_EFFECTS_LAYOUT",
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECTS_LAYOUT",
;           "bank": 3,
;           "zoneOffset": 6,
;           "physicalAddress": 40966,
;           "windowAddress": 40966,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 3,
;           "placementReason": "post-ZX0 first-fit single SCREEN_PANTALLA1_0_EFFECTS_LAYOUT resource; ZX0 6/768 bytes; bank 3 zone 0 offset +#0006; zone slack after pack 8124 bytes"
;         },
;         {
;           "id": 6,
;           "label": "BEHAVIOR_PANTALLA1_0_DATA",
;           "resourceIdLabel": "RESOURCE_ID_BEHAVIOR_PANTALLA1_0_DATA",
;           "group": "SCREENS",
;           "type": "SCREEN_BEHAVIOR_MAP",
;           "bank": 3,
;           "zoneOffset": 12,
;           "physicalAddress": 40972,
;           "windowAddress": 40972,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 6,
;           "placementReason": "post-ZX0 first-fit single BEHAVIOR_PANTALLA1_0_DATA resource; ZX0 6/768 bytes; bank 3 zone 0 offset +#000C; zone slack after pack 8124 bytes"
;         },
;         {
;           "id": 7,
;           "label": "SCREEN_PANTALLA1_0_INTERACTION_TYPE_MAP",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PANTALLA1_0_INTERACTION_TYPE_MAP",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 3,
;           "zoneOffset": 18,
;           "physicalAddress": 40978,
;           "windowAddress": 40978,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 7,
;           "placementReason": "post-ZX0 first-fit single SCREEN_PANTALLA1_0_INTERACTION_TYPE_MAP resource; ZX0 6/768 bytes; bank 3 zone 0 offset +#0012; zone slack after pack 8124 bytes"
;         },
;         {
;           "id": 8,
;           "label": "SCREEN_PANTALLA1_0_INTERACTION_VALUE_MAP",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PANTALLA1_0_INTERACTION_VALUE_MAP",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 3,
;           "zoneOffset": 24,
;           "physicalAddress": 40984,
;           "windowAddress": 40984,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 8,
;           "placementReason": "post-ZX0 first-fit single SCREEN_PANTALLA1_0_INTERACTION_VALUE_MAP resource; ZX0 6/768 bytes; bank 3 zone 0 offset +#0018; zone slack after pack 8124 bytes"
;         },
;         {
;           "id": 9,
;           "label": "SCREEN_PANTALLA1_0_INTERACTION_TARGET_MAP",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PANTALLA1_0_INTERACTION_TARGET_MAP",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 3,
;           "zoneOffset": 30,
;           "physicalAddress": 40990,
;           "windowAddress": 40990,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "sourceIndex": 9,
;           "placementReason": "post-ZX0 first-fit single SCREEN_PANTALLA1_0_INTERACTION_TARGET_MAP resource; ZX0 6/768 bytes; bank 3 zone 0 offset +#001E; zone slack after pack 8124 bytes"
;         },
;         {
;           "id": 0,
;           "label": "NEW_SPRITE_0_F0_LAYER1",
;           "resourceIdLabel": "RESOURCE_ID_NEW_SPRITE_0_F0_LAYER1",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 3,
;           "zoneOffset": 36,
;           "physicalAddress": 40996,
;           "windowAddress": 40996,
;           "size": 25,
;           "storedSize": 25,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 0,
;           "placementReason": "post-ZX0 first-fit single NEW_SPRITE_0_F0_LAYER1 resource; ZX0 25/32 bytes; bank 3 zone 0 offset +#0024; zone slack after pack 8124 bytes"
;         },
;         {
;           "id": 1,
;           "label": "SPRITE_PLACEHOLDER_PATTERN",
;           "resourceIdLabel": "RESOURCE_ID_SPRITE_PLACEHOLDER_PATTERN",
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "bank": 3,
;           "zoneOffset": 61,
;           "physicalAddress": 41021,
;           "windowAddress": 41021,
;           "size": 5,
;           "storedSize": 5,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "sourceIndex": 1,
;           "placementReason": "post-ZX0 first-fit single SPRITE_PLACEHOLDER_PATTERN resource; ZX0 5/32 bytes; bank 3 zone 0 offset +#003D; zone slack after pack 8124 bytes"
;         },
;         {
;           "id": 4,
;           "label": "SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE",
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECT_ZONE_TABLE",
;           "bank": 3,
;           "zoneOffset": 66,
;           "physicalAddress": 41026,
;           "windowAddress": 41026,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "sourceIndex": 4,
;           "placementReason": "post-ZX0 first-fit single SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE resource; raw 1 bytes; bank 3 zone 0 offset +#0042; zone slack after pack 8124 bytes"
;         },
;         {
;           "id": 5,
;           "label": "SCREEN_PANTALLA1_0_BOSS_TABLE",
;           "resourceIdLabel": "RESOURCE_ID_SCREEN_PANTALLA1_0_BOSS_TABLE",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 3,
;           "zoneOffset": 67,
;           "physicalAddress": 41027,
;           "windowAddress": 41027,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "sourceIndex": 5,
;           "placementReason": "post-ZX0 first-fit single SCREEN_PANTALLA1_0_BOSS_TABLE resource; raw 1 bytes; bank 3 zone 0 offset +#0043; zone slack after pack 8124 bytes"
;         }
;       ]
;     }
;   ],
;   "overflow": []
; }
;
; [[[MIDEAS_ARTIFACT:packing_manifest.json:END]]]

; [[[MIDEAS_ARTIFACT:manifest_v2.json:BEGIN]]]
; {
;   "schema": "mideas.manifest/2",
;   "build_id": "mideas-v2:7ab76b58",
;   "entry_point": "0x4000",
;   "boot_reserved_size": 0,
;   "cartridge": {
;     "mapper": "KONAMI8K",
;     "bank_size": 8192,
;     "banks": 4,
;     "data_window": {
;       "page": "p3",
;       "base": "#A000",
;       "mask": "#1FFF",
;       "bank_divisor": "#2000"
;     }
;   },
;   "layout": {
;     "policy": "post_zx0_deterministic_first_fit_decreasing",
;     "file_offset_rule": "file_offset = rom_bank_index * bank_size + bank_offset",
;     "data_start_address": 40960,
;     "total_source_bytes": 4674
;   },
;   "groups": [
;     {
;       "name": "boot",
;       "fixed_bank": 0,
;       "lifetime": "persistent"
;     },
;     {
;       "name": "screens",
;       "lifetime": "stream"
;     },
;     {
;       "name": "sprites",
;       "lifetime": "persistent"
;     }
;   ],
;   "resources": [
;     {
;       "id": 0,
;       "type": "sprite_patterns",
;       "group": "sprites",
;       "file": "generated/sprites/NEW_SPRITE_0_F0_LAYER1.asm",
;       "symbol": "NEW_SPRITE_0_F0_LAYER1",
;       "resource_id_symbol": "RESOURCE_ID_NEW_SPRITE_0_F0_LAYER1",
;       "lifetime": "persistent",
;       "compress": "zx0",
;       "decompressor": "zx0",
;       "decompress_target": "VRAM",
;       "runtime_target": "VRAM",
;       "placement": {
;         "bank_index": 3,
;         "rom_bank_index": 3,
;         "window": "#A000",
;         "window_address": 40996,
;         "bank_offset": 36,
;         "file_offset": 24612,
;         "physical_address": 40996,
;         "align": 1
;       },
;       "size": {
;         "stored": 25,
;         "uncompressed": 32
;       },
;       "flags": 1
;     },
;     {
;       "id": 1,
;       "type": "sprite_patterns",
;       "group": "sprites",
;       "file": "generated/sprites/SPRITE_PLACEHOLDER_PATTERN.asm",
;       "symbol": "SPRITE_PLACEHOLDER_PATTERN",
;       "resource_id_symbol": "RESOURCE_ID_SPRITE_PLACEHOLDER_PATTERN",
;       "lifetime": "persistent",
;       "compress": "zx0",
;       "decompressor": "zx0",
;       "decompress_target": "VRAM",
;       "runtime_target": "VRAM",
;       "placement": {
;         "bank_index": 3,
;         "rom_bank_index": 3,
;         "window": "#A000",
;         "window_address": 41021,
;         "bank_offset": 61,
;         "file_offset": 24637,
;         "physical_address": 41021,
;         "align": 1
;       },
;       "size": {
;         "stored": 5,
;         "uncompressed": 32
;       },
;       "flags": 1
;     },
;     {
;       "id": 2,
;       "type": "screen_layout",
;       "group": "screens",
;       "file": "generated/screens/SCREEN_PANTALLA1_0_LAYOUT.asm",
;       "symbol": "SCREEN_PANTALLA1_0_LAYOUT",
;       "resource_id_symbol": "RESOURCE_ID_SCREEN_PANTALLA1_0_LAYOUT",
;       "lifetime": "stream",
;       "compress": "zx0",
;       "decompressor": "zx0",
;       "decompress_target": "VRAM",
;       "runtime_target": "VRAM",
;       "placement": {
;         "bank_index": 3,
;         "rom_bank_index": 3,
;         "window": "#A000",
;         "window_address": 40960,
;         "bank_offset": 0,
;         "file_offset": 24576,
;         "physical_address": 40960,
;         "align": 1
;       },
;       "size": {
;         "stored": 6,
;         "uncompressed": 768
;       },
;       "flags": 1
;     },
;     {
;       "id": 3,
;       "type": "screen_effects_layout",
;       "group": "screens",
;       "file": "generated/screens/SCREEN_PANTALLA1_0_EFFECTS_LAYOUT.asm",
;       "symbol": "SCREEN_PANTALLA1_0_EFFECTS_LAYOUT",
;       "resource_id_symbol": "RESOURCE_ID_SCREEN_PANTALLA1_0_EFFECTS_LAYOUT",
;       "lifetime": "stream",
;       "compress": "zx0",
;       "decompressor": "zx0",
;       "decompress_target": "VRAM",
;       "runtime_target": "VRAM",
;       "placement": {
;         "bank_index": 3,
;         "rom_bank_index": 3,
;         "window": "#A000",
;         "window_address": 40966,
;         "bank_offset": 6,
;         "file_offset": 24582,
;         "physical_address": 40966,
;         "align": 1
;       },
;       "size": {
;         "stored": 6,
;         "uncompressed": 768
;       },
;       "flags": 1
;     },
;     {
;       "id": 4,
;       "type": "screen_effect_zone_table",
;       "group": "screens",
;       "file": "generated/screens/SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE.asm",
;       "symbol": "SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE",
;       "resource_id_symbol": "RESOURCE_ID_SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE",
;       "lifetime": "stream",
;       "compress": "none",
;       "runtime_target": "RAM",
;       "placement": {
;         "bank_index": 3,
;         "rom_bank_index": 3,
;         "window": "#A000",
;         "window_address": 41026,
;         "bank_offset": 66,
;         "file_offset": 24642,
;         "physical_address": 41026,
;         "align": 1
;       },
;       "size": {
;         "stored": 1,
;         "uncompressed": 1
;       },
;       "flags": 0
;     },
;     {
;       "id": 5,
;       "type": "screen_data",
;       "group": "screens",
;       "file": "generated/screens/SCREEN_PANTALLA1_0_BOSS_TABLE.asm",
;       "symbol": "SCREEN_PANTALLA1_0_BOSS_TABLE",
;       "resource_id_symbol": "RESOURCE_ID_SCREEN_PANTALLA1_0_BOSS_TABLE",
;       "lifetime": "stream",
;       "compress": "none",
;       "runtime_target": "VRAM",
;       "placement": {
;         "bank_index": 3,
;         "rom_bank_index": 3,
;         "window": "#A000",
;         "window_address": 41027,
;         "bank_offset": 67,
;         "file_offset": 24643,
;         "physical_address": 41027,
;         "align": 1
;       },
;       "size": {
;         "stored": 1,
;         "uncompressed": 1
;       },
;       "flags": 0
;     },
;     {
;       "id": 6,
;       "type": "screen_behavior_map",
;       "group": "screens",
;       "file": "generated/screens/BEHAVIOR_PANTALLA1_0_DATA.asm",
;       "symbol": "BEHAVIOR_PANTALLA1_0_DATA",
;       "resource_id_symbol": "RESOURCE_ID_BEHAVIOR_PANTALLA1_0_DATA",
;       "lifetime": "stream",
;       "compress": "zx0",
;       "decompressor": "zx0",
;       "decompress_target": "VRAM",
;       "runtime_target": "VRAM",
;       "placement": {
;         "bank_index": 3,
;         "rom_bank_index": 3,
;         "window": "#A000",
;         "window_address": 40972,
;         "bank_offset": 12,
;         "file_offset": 24588,
;         "physical_address": 40972,
;         "align": 1
;       },
;       "size": {
;         "stored": 6,
;         "uncompressed": 768
;       },
;       "flags": 1
;     },
;     {
;       "id": 7,
;       "type": "screen_data",
;       "group": "screens",
;       "file": "generated/screens/SCREEN_PANTALLA1_0_INTERACTION_TYPE_MAP.asm",
;       "symbol": "SCREEN_PANTALLA1_0_INTERACTION_TYPE_MAP",
;       "resource_id_symbol": "RESOURCE_ID_SCREEN_PANTALLA1_0_INTERACTION_TYPE_MAP",
;       "lifetime": "stream",
;       "compress": "zx0",
;       "decompressor": "zx0",
;       "decompress_target": "VRAM",
;       "runtime_target": "VRAM",
;       "placement": {
;         "bank_index": 3,
;         "rom_bank_index": 3,
;         "window": "#A000",
;         "window_address": 40978,
;         "bank_offset": 18,
;         "file_offset": 24594,
;         "physical_address": 40978,
;         "align": 1
;       },
;       "size": {
;         "stored": 6,
;         "uncompressed": 768
;       },
;       "flags": 1
;     },
;     {
;       "id": 8,
;       "type": "screen_data",
;       "group": "screens",
;       "file": "generated/screens/SCREEN_PANTALLA1_0_INTERACTION_VALUE_MAP.asm",
;       "symbol": "SCREEN_PANTALLA1_0_INTERACTION_VALUE_MAP",
;       "resource_id_symbol": "RESOURCE_ID_SCREEN_PANTALLA1_0_INTERACTION_VALUE_MAP",
;       "lifetime": "stream",
;       "compress": "zx0",
;       "decompressor": "zx0",
;       "decompress_target": "VRAM",
;       "runtime_target": "VRAM",
;       "placement": {
;         "bank_index": 3,
;         "rom_bank_index": 3,
;         "window": "#A000",
;         "window_address": 40984,
;         "bank_offset": 24,
;         "file_offset": 24600,
;         "physical_address": 40984,
;         "align": 1
;       },
;       "size": {
;         "stored": 6,
;         "uncompressed": 768
;       },
;       "flags": 1
;     },
;     {
;       "id": 9,
;       "type": "screen_data",
;       "group": "screens",
;       "file": "generated/screens/SCREEN_PANTALLA1_0_INTERACTION_TARGET_MAP.asm",
;       "symbol": "SCREEN_PANTALLA1_0_INTERACTION_TARGET_MAP",
;       "resource_id_symbol": "RESOURCE_ID_SCREEN_PANTALLA1_0_INTERACTION_TARGET_MAP",
;       "lifetime": "stream",
;       "compress": "zx0",
;       "decompressor": "zx0",
;       "decompress_target": "VRAM",
;       "runtime_target": "VRAM",
;       "placement": {
;         "bank_index": 3,
;         "rom_bank_index": 3,
;         "window": "#A000",
;         "window_address": 40990,
;         "bank_offset": 30,
;         "file_offset": 24606,
;         "physical_address": 40990,
;         "align": 1
;       },
;       "size": {
;         "stored": 6,
;         "uncompressed": 768
;       },
;       "flags": 1
;     }
;   ],
;   "verification": {
;     "algorithm": "fnv1a32-resource-metadata",
;     "banks": [
;       {
;         "bank": 3,
;         "verification": {
;           "algorithm": "fnv1a32-resource-metadata",
;           "metadataChecksum": "fnv1a32:AF88F5F8",
;           "resourceCount": 10,
;           "storedBytes": 68
;         }
;       }
;     ],
;     "expected_ram_dumps": []
;   }
; }
;
; [[[MIDEAS_ARTIFACT:manifest_v2.json:END]]]

; [[[MIDEAS_ARTIFACT:banks.json:BEGIN]]]
; {
;   "version": 1,
;   "mapperFormat": "konami",
;   "segmentSize": 8192,
;   "dataWindow": {
;     "page": "p3",
;     "base": "#A000",
;     "mask": "#1FFF",
;     "bankDivisor": "#2000"
;   },
;   "banks": [
;     {
;       "bank": 3,
;       "origin": 40960,
;       "end": 49152,
;       "usedBytes": 68,
;       "freeBytes": 8124,
;       "verification": {
;         "algorithm": "fnv1a32-resource-metadata",
;         "metadataChecksum": "fnv1a32:AF88F5F8",
;         "resourceCount": 10,
;         "storedBytes": 68
;       },
;       "resources": [
;         {
;           "id": 2,
;           "label": "SCREEN_PANTALLA1_0_LAYOUT",
;           "bank": 3,
;           "offset": 0,
;           "address": 40960,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_LAYOUT",
;           "placementReason": "post-ZX0 first-fit single SCREEN_PANTALLA1_0_LAYOUT resource; ZX0 6/768 bytes; bank 3 zone 0 offset +#0000; zone slack after pack 8124 bytes"
;         },
;         {
;           "id": 3,
;           "label": "SCREEN_PANTALLA1_0_EFFECTS_LAYOUT",
;           "bank": 3,
;           "offset": 6,
;           "address": 40966,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECTS_LAYOUT",
;           "placementReason": "post-ZX0 first-fit single SCREEN_PANTALLA1_0_EFFECTS_LAYOUT resource; ZX0 6/768 bytes; bank 3 zone 0 offset +#0006; zone slack after pack 8124 bytes"
;         },
;         {
;           "id": 6,
;           "label": "BEHAVIOR_PANTALLA1_0_DATA",
;           "bank": 3,
;           "offset": 12,
;           "address": 40972,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_BEHAVIOR_MAP",
;           "placementReason": "post-ZX0 first-fit single BEHAVIOR_PANTALLA1_0_DATA resource; ZX0 6/768 bytes; bank 3 zone 0 offset +#000C; zone slack after pack 8124 bytes"
;         },
;         {
;           "id": 7,
;           "label": "SCREEN_PANTALLA1_0_INTERACTION_TYPE_MAP",
;           "bank": 3,
;           "offset": 18,
;           "address": 40978,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "placementReason": "post-ZX0 first-fit single SCREEN_PANTALLA1_0_INTERACTION_TYPE_MAP resource; ZX0 6/768 bytes; bank 3 zone 0 offset +#0012; zone slack after pack 8124 bytes"
;         },
;         {
;           "id": 8,
;           "label": "SCREEN_PANTALLA1_0_INTERACTION_VALUE_MAP",
;           "bank": 3,
;           "offset": 24,
;           "address": 40984,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "placementReason": "post-ZX0 first-fit single SCREEN_PANTALLA1_0_INTERACTION_VALUE_MAP resource; ZX0 6/768 bytes; bank 3 zone 0 offset +#0018; zone slack after pack 8124 bytes"
;         },
;         {
;           "id": 9,
;           "label": "SCREEN_PANTALLA1_0_INTERACTION_TARGET_MAP",
;           "bank": 3,
;           "offset": 30,
;           "address": 40990,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "placementReason": "post-ZX0 first-fit single SCREEN_PANTALLA1_0_INTERACTION_TARGET_MAP resource; ZX0 6/768 bytes; bank 3 zone 0 offset +#001E; zone slack after pack 8124 bytes"
;         },
;         {
;           "id": 0,
;           "label": "NEW_SPRITE_0_F0_LAYER1",
;           "bank": 3,
;           "offset": 36,
;           "address": 40996,
;           "size": 25,
;           "storedSize": 25,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "placementReason": "post-ZX0 first-fit single NEW_SPRITE_0_F0_LAYER1 resource; ZX0 25/32 bytes; bank 3 zone 0 offset +#0024; zone slack after pack 8124 bytes"
;         },
;         {
;           "id": 1,
;           "label": "SPRITE_PLACEHOLDER_PATTERN",
;           "bank": 3,
;           "offset": 61,
;           "address": 41021,
;           "size": 5,
;           "storedSize": 5,
;           "uncompressedSize": 32,
;           "flags": 1,
;           "group": "SPRITES",
;           "type": "SPRITE_PATTERNS",
;           "placementReason": "post-ZX0 first-fit single SPRITE_PLACEHOLDER_PATTERN resource; ZX0 5/32 bytes; bank 3 zone 0 offset +#003D; zone slack after pack 8124 bytes"
;         },
;         {
;           "id": 4,
;           "label": "SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE",
;           "bank": 3,
;           "offset": 66,
;           "address": 41026,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECT_ZONE_TABLE",
;           "placementReason": "post-ZX0 first-fit single SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE resource; raw 1 bytes; bank 3 zone 0 offset +#0042; zone slack after pack 8124 bytes"
;         },
;         {
;           "id": 5,
;           "label": "SCREEN_PANTALLA1_0_BOSS_TABLE",
;           "bank": 3,
;           "offset": 67,
;           "address": 41027,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "placementReason": "post-ZX0 first-fit single SCREEN_PANTALLA1_0_BOSS_TABLE resource; raw 1 bytes; bank 3 zone 0 offset +#0043; zone slack after pack 8124 bytes"
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
;   "mapper": {
;     "format": "konami",
;     "segmentSize": 8192,
;     "dataWindowPage": "p3",
;     "windowBase": "#A000",
;     "windowMask": "#1FFF",
;     "bankDivisor": "#2000"
;   },
;   "features": {
;     "sprites": true,
;     "tiles": false,
;     "screens": true,
;     "entities": true,
;     "components": true,
;     "gameFlow": true,
;     "menus": false,
;     "bosses": false,
;     "dialogues": false,
;     "worldmaps": true,
;     "fonts": true,
;     "animations": false,
;     "collisions": true,
;     "sounds": false,
;     "stateMachines": false
;   },
;   "counts": {
;     "components": 26,
;     "componentRuntimeTypes": 2,
;     "templates": 11,
;     "sprites": 1,
;     "tiles": 0,
;     "tileBanks": 0,
;     "screens": 1,
;     "entities": 1,
;     "menus": 0,
;     "bosses": 0,
;     "bossInstances": 0,
;     "bossAttackTypes": 0,
;     "bossAttacksReferenced": 0,
;     "dialogues": 0,
;     "worldmaps": 1,
;     "presentationScreens": 0,
;     "sounds": 0,
;     "tracks": 0,
;     "stateMachines": 0,
;     "stateMachineActionTypes": 0,
;     "stateMachineConditionTypes": 0,
;     "bankedResources": 10
;   },
;   "resourceGroups": [
;     {
;       "key": "SCREENS",
;       "count": 8
;     },
;     {
;       "key": "SPRITES",
;       "count": 2
;     }
;   ],
;   "resourceTypes": [
;     {
;       "key": "SCREEN_BEHAVIOR_MAP",
;       "count": 1
;     },
;     {
;       "key": "SCREEN_DATA",
;       "count": 4
;     },
;     {
;       "key": "SCREEN_EFFECT_ZONE_TABLE",
;       "count": 1
;     },
;     {
;       "key": "SCREEN_EFFECTS_LAYOUT",
;       "count": 1
;     },
;     {
;       "key": "SCREEN_LAYOUT",
;       "count": 1
;     },
;     {
;       "key": "SPRITE_PATTERNS",
;       "count": 2
;     }
;   ],
;   "bossAttackRuntime": {
;     "usedTypes": [],
;     "unusedTypes": [
;       "Projectile",
;       "Meteor",
;       "Bomb",
;       "Boomerang",
;       "Rock",
;       "Laser",
;       "SineWave",
;       "HomingMissile",
;       "SlamRocks",
;       "FallingBlocks"
;     ],
;     "typeCounts": {},
;     "referencedAttacks": 0
;   },
;   "componentRuntime": {
;     "usedComponents": [
;       "Position",
;       "Sprite"
;     ],
;     "unusedComponents": [
;       "Input",
;       "Movement",
;       "Collision",
;       "Behavior",
;       "Health",
;       "Animation",
;       "Jump",
;       "Gravity",
;       "WallGrab",
;       "WallJump",
;       "TileInteraction",
;       "AutoDestroy",
;       "Cursors",
;       "StateMachine",
;       "Carry",
;       "Damage",
;       "Shoot",
;       "WallCollision",
;       "DeadlyTiles",
;       "InWater",
;       "Collectible",
;       "RetractableGate",
;       "AutoControlScript",
;       "Mirror"
;     ],
;     "componentCounts": {
;       "Position": 1,
;       "Sprite": 1
;     },
;     "activeEntities": 1
;   },
;   "stateMachineRuntime": {
;     "stateMachines": 0,
;     "transitions": 0,
;     "usedActionIds": [],
;     "usedActionTypes": [],
;     "actionTypeCounts": {},
;     "unknownActionTypes": [],
;     "usedConditionIds": [],
;     "usedConditionTypes": [],
;     "conditionTypeCounts": {},
;     "unknownConditionTypes": [],
;     "implicitAlwaysTrueConditions": 0
;   },
;   "gameFlowReachability": {
;     "hasGameFlow": true,
;     "reachableScreenIds": [],
;     "reachableWorldIds": [],
;     "scenes": [
;       {
;         "index": 0,
;         "id": "screenmap_1767095338721",
;         "name": "pantalla1",
;         "reachable": false,
;         "sources": [],
;         "reason": "not reached from GameFlow start graph"
;       }
;     ],
;     "counts": {
;       "totalScreens": 1,
;       "reachableScreens": 0,
;       "unreachableScreens": 1,
;       "unknownScreens": 0
;     }
;   },
;   "scenes": [
;     {
;       "index": 0,
;       "id": "screenmap_1767095338721",
;       "name": "pantalla1",
;       "size": {
;         "width": 32,
;         "height": 24
;       },
;       "screenKind": null,
;       "screenEngine": null,
;       "tileBankAssetId": null,
;       "tileUsage": {
;         "backgroundTileIds": [],
;         "collisionTileIds": [],
;         "effectsTileIds": [],
;         "uniqueTileIds": []
;       },
;       "entities": {
;         "count": 1,
;         "templateIds": [
;           "tpl_1767095359697_dc6vt"
;         ],
;         "names": [
;           "puntdemira 1"
;         ]
;       },
;       "effectZones": {
;         "count": 0
;       },
;       "bosses": {
;         "count": 0,
;         "bossIds": []
;       },
;       "resourceIds": [
;         2,
;         3,
;         6,
;         7,
;         8,
;         9,
;         4,
;         5
;       ],
;       "resources": [
;         {
;           "id": 2,
;           "label": "SCREEN_PANTALLA1_0_LAYOUT",
;           "group": "SCREENS",
;           "type": "SCREEN_LAYOUT",
;           "bank": 3,
;           "windowAddress": 40960,
;           "zoneOffset": 0,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "placementReason": "post-ZX0 first-fit single SCREEN_PANTALLA1_0_LAYOUT resource; ZX0 6/768 bytes; bank 3 zone 0 offset +#0000; zone slack after pack 8124 bytes"
;         },
;         {
;           "id": 3,
;           "label": "SCREEN_PANTALLA1_0_EFFECTS_LAYOUT",
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECTS_LAYOUT",
;           "bank": 3,
;           "windowAddress": 40966,
;           "zoneOffset": 6,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "placementReason": "post-ZX0 first-fit single SCREEN_PANTALLA1_0_EFFECTS_LAYOUT resource; ZX0 6/768 bytes; bank 3 zone 0 offset +#0006; zone slack after pack 8124 bytes"
;         },
;         {
;           "id": 6,
;           "label": "BEHAVIOR_PANTALLA1_0_DATA",
;           "group": "SCREENS",
;           "type": "SCREEN_BEHAVIOR_MAP",
;           "bank": 3,
;           "windowAddress": 40972,
;           "zoneOffset": 12,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "placementReason": "post-ZX0 first-fit single BEHAVIOR_PANTALLA1_0_DATA resource; ZX0 6/768 bytes; bank 3 zone 0 offset +#000C; zone slack after pack 8124 bytes"
;         },
;         {
;           "id": 7,
;           "label": "SCREEN_PANTALLA1_0_INTERACTION_TYPE_MAP",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 3,
;           "windowAddress": 40978,
;           "zoneOffset": 18,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "placementReason": "post-ZX0 first-fit single SCREEN_PANTALLA1_0_INTERACTION_TYPE_MAP resource; ZX0 6/768 bytes; bank 3 zone 0 offset +#0012; zone slack after pack 8124 bytes"
;         },
;         {
;           "id": 8,
;           "label": "SCREEN_PANTALLA1_0_INTERACTION_VALUE_MAP",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 3,
;           "windowAddress": 40984,
;           "zoneOffset": 24,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "placementReason": "post-ZX0 first-fit single SCREEN_PANTALLA1_0_INTERACTION_VALUE_MAP resource; ZX0 6/768 bytes; bank 3 zone 0 offset +#0018; zone slack after pack 8124 bytes"
;         },
;         {
;           "id": 9,
;           "label": "SCREEN_PANTALLA1_0_INTERACTION_TARGET_MAP",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 3,
;           "windowAddress": 40990,
;           "zoneOffset": 30,
;           "size": 6,
;           "storedSize": 6,
;           "uncompressedSize": 768,
;           "flags": 1,
;           "placementReason": "post-ZX0 first-fit single SCREEN_PANTALLA1_0_INTERACTION_TARGET_MAP resource; ZX0 6/768 bytes; bank 3 zone 0 offset +#001E; zone slack after pack 8124 bytes"
;         },
;         {
;           "id": 4,
;           "label": "SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE",
;           "group": "SCREENS",
;           "type": "SCREEN_EFFECT_ZONE_TABLE",
;           "bank": 3,
;           "windowAddress": 41026,
;           "zoneOffset": 66,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "placementReason": "post-ZX0 first-fit single SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE resource; raw 1 bytes; bank 3 zone 0 offset +#0042; zone slack after pack 8124 bytes"
;         },
;         {
;           "id": 5,
;           "label": "SCREEN_PANTALLA1_0_BOSS_TABLE",
;           "group": "SCREENS",
;           "type": "SCREEN_DATA",
;           "bank": 3,
;           "windowAddress": 41027,
;           "zoneOffset": 67,
;           "size": 1,
;           "storedSize": 1,
;           "uncompressedSize": 1,
;           "flags": 0,
;           "placementReason": "post-ZX0 first-fit single SCREEN_PANTALLA1_0_BOSS_TABLE resource; raw 1 bytes; bank 3 zone 0 offset +#0043; zone slack after pack 8124 bytes"
;         }
;       ],
;       "banks": [
;         {
;           "bank": 3,
;           "count": 8,
;           "storedBytes": 38,
;           "rawBytes": 4610,
;           "resourceIds": [
;             2,
;             3,
;             6,
;             7,
;             8,
;             9,
;             4,
;             5
;           ],
;           "resourceLabels": [
;             "SCREEN_PANTALLA1_0_LAYOUT",
;             "SCREEN_PANTALLA1_0_EFFECTS_LAYOUT",
;             "BEHAVIOR_PANTALLA1_0_DATA",
;             "SCREEN_PANTALLA1_0_INTERACTION_TYPE_MAP",
;             "SCREEN_PANTALLA1_0_INTERACTION_VALUE_MAP",
;             "SCREEN_PANTALLA1_0_INTERACTION_TARGET_MAP",
;             "SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE",
;             "SCREEN_PANTALLA1_0_BOSS_TABLE"
;           ]
;         }
;       ],
;       "loadOrder": [
;         {
;           "bank": 3,
;           "resourceIds": [
;             2,
;             3,
;             6,
;             7,
;             8,
;             9,
;             4,
;             5
;           ],
;           "resourceLabels": [
;             "SCREEN_PANTALLA1_0_LAYOUT",
;             "SCREEN_PANTALLA1_0_EFFECTS_LAYOUT",
;             "BEHAVIOR_PANTALLA1_0_DATA",
;             "SCREEN_PANTALLA1_0_INTERACTION_TYPE_MAP",
;             "SCREEN_PANTALLA1_0_INTERACTION_VALUE_MAP",
;             "SCREEN_PANTALLA1_0_INTERACTION_TARGET_MAP",
;             "SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE",
;             "SCREEN_PANTALLA1_0_BOSS_TABLE"
;           ]
;         }
;       ],
;       "totals": {
;         "resourceCount": 8,
;         "storedBytes": 38,
;         "rawBytes": 4610,
;         "compressedResources": 6
;       }
;     }
;   ],
;   "bankedResources": [
;     {
;       "id": 0,
;       "label": "NEW_SPRITE_0_F0_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 3,
;       "windowAddress": 40996,
;       "size": 25,
;       "storedSize": 25,
;       "uncompressedSize": 32,
;       "flags": 1,
;       "placementReason": "post-ZX0 first-fit single NEW_SPRITE_0_F0_LAYER1 resource; ZX0 25/32 bytes; bank 3 zone 0 offset +#0024; zone slack after pack 8124 bytes"
;     },
;     {
;       "id": 1,
;       "label": "SPRITE_PLACEHOLDER_PATTERN",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 3,
;       "windowAddress": 41021,
;       "size": 5,
;       "storedSize": 5,
;       "uncompressedSize": 32,
;       "flags": 1,
;       "placementReason": "post-ZX0 first-fit single SPRITE_PLACEHOLDER_PATTERN resource; ZX0 5/32 bytes; bank 3 zone 0 offset +#003D; zone slack after pack 8124 bytes"
;     },
;     {
;       "id": 2,
;       "label": "SCREEN_PANTALLA1_0_LAYOUT",
;       "group": "SCREENS",
;       "type": "SCREEN_LAYOUT",
;       "bank": 3,
;       "windowAddress": 40960,
;       "size": 6,
;       "storedSize": 6,
;       "uncompressedSize": 768,
;       "flags": 1,
;       "placementReason": "post-ZX0 first-fit single SCREEN_PANTALLA1_0_LAYOUT resource; ZX0 6/768 bytes; bank 3 zone 0 offset +#0000; zone slack after pack 8124 bytes"
;     },
;     {
;       "id": 3,
;       "label": "SCREEN_PANTALLA1_0_EFFECTS_LAYOUT",
;       "group": "SCREENS",
;       "type": "SCREEN_EFFECTS_LAYOUT",
;       "bank": 3,
;       "windowAddress": 40966,
;       "size": 6,
;       "storedSize": 6,
;       "uncompressedSize": 768,
;       "flags": 1,
;       "placementReason": "post-ZX0 first-fit single SCREEN_PANTALLA1_0_EFFECTS_LAYOUT resource; ZX0 6/768 bytes; bank 3 zone 0 offset +#0006; zone slack after pack 8124 bytes"
;     },
;     {
;       "id": 4,
;       "label": "SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE",
;       "group": "SCREENS",
;       "type": "SCREEN_EFFECT_ZONE_TABLE",
;       "bank": 3,
;       "windowAddress": 41026,
;       "size": 1,
;       "storedSize": 1,
;       "uncompressedSize": 1,
;       "flags": 0,
;       "placementReason": "post-ZX0 first-fit single SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE resource; raw 1 bytes; bank 3 zone 0 offset +#0042; zone slack after pack 8124 bytes"
;     },
;     {
;       "id": 5,
;       "label": "SCREEN_PANTALLA1_0_BOSS_TABLE",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 3,
;       "windowAddress": 41027,
;       "size": 1,
;       "storedSize": 1,
;       "uncompressedSize": 1,
;       "flags": 0,
;       "placementReason": "post-ZX0 first-fit single SCREEN_PANTALLA1_0_BOSS_TABLE resource; raw 1 bytes; bank 3 zone 0 offset +#0043; zone slack after pack 8124 bytes"
;     },
;     {
;       "id": 6,
;       "label": "BEHAVIOR_PANTALLA1_0_DATA",
;       "group": "SCREENS",
;       "type": "SCREEN_BEHAVIOR_MAP",
;       "bank": 3,
;       "windowAddress": 40972,
;       "size": 6,
;       "storedSize": 6,
;       "uncompressedSize": 768,
;       "flags": 1,
;       "placementReason": "post-ZX0 first-fit single BEHAVIOR_PANTALLA1_0_DATA resource; ZX0 6/768 bytes; bank 3 zone 0 offset +#000C; zone slack after pack 8124 bytes"
;     },
;     {
;       "id": 7,
;       "label": "SCREEN_PANTALLA1_0_INTERACTION_TYPE_MAP",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 3,
;       "windowAddress": 40978,
;       "size": 6,
;       "storedSize": 6,
;       "uncompressedSize": 768,
;       "flags": 1,
;       "placementReason": "post-ZX0 first-fit single SCREEN_PANTALLA1_0_INTERACTION_TYPE_MAP resource; ZX0 6/768 bytes; bank 3 zone 0 offset +#0012; zone slack after pack 8124 bytes"
;     },
;     {
;       "id": 8,
;       "label": "SCREEN_PANTALLA1_0_INTERACTION_VALUE_MAP",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 3,
;       "windowAddress": 40984,
;       "size": 6,
;       "storedSize": 6,
;       "uncompressedSize": 768,
;       "flags": 1,
;       "placementReason": "post-ZX0 first-fit single SCREEN_PANTALLA1_0_INTERACTION_VALUE_MAP resource; ZX0 6/768 bytes; bank 3 zone 0 offset +#0018; zone slack after pack 8124 bytes"
;     },
;     {
;       "id": 9,
;       "label": "SCREEN_PANTALLA1_0_INTERACTION_TARGET_MAP",
;       "group": "SCREENS",
;       "type": "SCREEN_DATA",
;       "bank": 3,
;       "windowAddress": 40990,
;       "size": 6,
;       "storedSize": 6,
;       "uncompressedSize": 768,
;       "flags": 1,
;       "placementReason": "post-ZX0 first-fit single SCREEN_PANTALLA1_0_INTERACTION_TARGET_MAP resource; ZX0 6/768 bytes; bank 3 zone 0 offset +#001E; zone slack after pack 8124 bytes"
;     }
;   ]
; }
;
; [[[MIDEAS_ARTIFACT:project_usage.json:END]]]

; [[[MIDEAS_ARTIFACT:load_plan.json:BEGIN]]]
; {
;   "version": 1,
;   "scope": "konami8k_scene_load_plan",
;   "strategy": "group current banked resources by scene and physical bank; optimizer consumes this before repacking",
;   "mapper": {
;     "format": "konami",
;     "segmentSize": 8192,
;     "dataWindowPage": "p3",
;     "windowBase": "#A000",
;     "windowMask": "#1FFF",
;     "bankDivisor": "#2000"
;   },
;   "summary": {
;     "sceneCount": 1,
;     "resourceCount": 10,
;     "uniqueDataBanks": 1,
;     "totalSceneBankTouches": 1,
;     "maxSceneBankTouches": 1,
;     "totalStoredBytes": 68,
;     "totalRawBytes": 4674,
;     "compressedResources": 8
;   },
;   "scenes": [
;     {
;       "index": 0,
;       "id": "screenmap_1767095338721",
;       "name": "pantalla1",
;       "tileBankAssetId": null,
;       "resourceCount": 8,
;       "totalStoredBytes": 38,
;       "totalRawBytes": 4610,
;       "compressedResources": 6,
;       "banks": [
;         {
;           "bank": 3,
;           "count": 8,
;           "storedBytes": 38,
;           "rawBytes": 4610,
;           "resourceIds": [
;             2,
;             3,
;             6,
;             7,
;             8,
;             9,
;             4,
;             5
;           ],
;           "resourceLabels": [
;             "SCREEN_PANTALLA1_0_LAYOUT",
;             "SCREEN_PANTALLA1_0_EFFECTS_LAYOUT",
;             "BEHAVIOR_PANTALLA1_0_DATA",
;             "SCREEN_PANTALLA1_0_INTERACTION_TYPE_MAP",
;             "SCREEN_PANTALLA1_0_INTERACTION_VALUE_MAP",
;             "SCREEN_PANTALLA1_0_INTERACTION_TARGET_MAP",
;             "SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE",
;             "SCREEN_PANTALLA1_0_BOSS_TABLE"
;           ]
;         }
;       ],
;       "loadOrder": [
;         {
;           "bank": 3,
;           "resourceIds": [
;             2,
;             3,
;             6,
;             7,
;             8,
;             9,
;             4,
;             5
;           ],
;           "resourceLabels": [
;             "SCREEN_PANTALLA1_0_LAYOUT",
;             "SCREEN_PANTALLA1_0_EFFECTS_LAYOUT",
;             "BEHAVIOR_PANTALLA1_0_DATA",
;             "SCREEN_PANTALLA1_0_INTERACTION_TYPE_MAP",
;             "SCREEN_PANTALLA1_0_INTERACTION_VALUE_MAP",
;             "SCREEN_PANTALLA1_0_INTERACTION_TARGET_MAP",
;             "SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE",
;             "SCREEN_PANTALLA1_0_BOSS_TABLE"
;           ]
;         }
;       ],
;       "warnings": []
;     }
;   ]
; }
;
; [[[MIDEAS_ARTIFACT:load_plan.json:END]]]

; [[[MIDEAS_ARTIFACT:bank_optimizer.json:BEGIN]]]
; {
;   "version": 1,
;   "scope": "konami8k_bank_optimizer",
;   "strategy": "analysis-only scene-aware first-fit input; later pass may repack or duplicate resources",
;   "constraints": {
;     "mapperFormat": "konami",
;     "segmentSize": 8192,
;     "dynamicWindows": 1,
;     "dataWindow": {
;       "page": "p3",
;       "base": "#A000",
;       "mask": "#1FFF",
;       "bankDivisor": "#2000"
;     },
;     "maxRecommendedSceneBanks": 3
;   },
;   "currentPlacement": {
;     "bankCount": 1,
;     "resourceCount": 10,
;     "totalStoredBytes": 68,
;     "totalRawBytes": 4674,
;     "compressedResources": 8,
;     "banks": [
;       {
;         "bank": 3,
;         "count": 10,
;         "storedBytes": 68,
;         "rawBytes": 4674,
;         "resourceIds": [
;           2,
;           3,
;           6,
;           7,
;           8,
;           9,
;           0,
;           1,
;           4,
;           5
;         ],
;         "resourceLabels": [
;           "SCREEN_PANTALLA1_0_LAYOUT",
;           "SCREEN_PANTALLA1_0_EFFECTS_LAYOUT",
;           "BEHAVIOR_PANTALLA1_0_DATA",
;           "SCREEN_PANTALLA1_0_INTERACTION_TYPE_MAP",
;           "SCREEN_PANTALLA1_0_INTERACTION_VALUE_MAP",
;           "SCREEN_PANTALLA1_0_INTERACTION_TARGET_MAP",
;           "NEW_SPRITE_0_F0_LAYER1",
;           "SPRITE_PLACEHOLDER_PATTERN",
;           "SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE",
;           "SCREEN_PANTALLA1_0_BOSS_TABLE"
;         ]
;       }
;     ]
;   },
;   "proposedPlacement": {
;     "strategy": "dry-run scene bundles first-fit decreasing with mapper data-zone capacity; current ROM placement is unchanged",
;     "zoneSize": 8192,
;     "bankCount": 1,
;     "resourceCount": 10,
;     "totalStoredBytes": 68,
;     "resourcePlacements": [
;       {
;         "id": 2,
;         "label": "SCREEN_PANTALLA1_0_LAYOUT",
;         "bank": 3,
;         "zoneOffset": 0,
;         "windowAddress": 40960,
;         "storedSize": 6,
;         "uncompressedSize": 768,
;         "flags": 1,
;         "unitKind": "scene",
;         "sceneIndex": 0,
;         "sceneId": "screenmap_1767095338721",
;         "sceneName": "pantalla1",
;         "placementReason": "proposed scene first-fit placement; 6/768 bytes; bank 3 offset +#0000; current ROM placement unchanged"
;       },
;       {
;         "id": 3,
;         "label": "SCREEN_PANTALLA1_0_EFFECTS_LAYOUT",
;         "bank": 3,
;         "zoneOffset": 6,
;         "windowAddress": 40966,
;         "storedSize": 6,
;         "uncompressedSize": 768,
;         "flags": 1,
;         "unitKind": "scene",
;         "sceneIndex": 0,
;         "sceneId": "screenmap_1767095338721",
;         "sceneName": "pantalla1",
;         "placementReason": "proposed scene first-fit placement; 6/768 bytes; bank 3 offset +#0006; current ROM placement unchanged"
;       },
;       {
;         "id": 6,
;         "label": "BEHAVIOR_PANTALLA1_0_DATA",
;         "bank": 3,
;         "zoneOffset": 12,
;         "windowAddress": 40972,
;         "storedSize": 6,
;         "uncompressedSize": 768,
;         "flags": 1,
;         "unitKind": "scene",
;         "sceneIndex": 0,
;         "sceneId": "screenmap_1767095338721",
;         "sceneName": "pantalla1",
;         "placementReason": "proposed scene first-fit placement; 6/768 bytes; bank 3 offset +#000C; current ROM placement unchanged"
;       },
;       {
;         "id": 7,
;         "label": "SCREEN_PANTALLA1_0_INTERACTION_TYPE_MAP",
;         "bank": 3,
;         "zoneOffset": 18,
;         "windowAddress": 40978,
;         "storedSize": 6,
;         "uncompressedSize": 768,
;         "flags": 1,
;         "unitKind": "scene",
;         "sceneIndex": 0,
;         "sceneId": "screenmap_1767095338721",
;         "sceneName": "pantalla1",
;         "placementReason": "proposed scene first-fit placement; 6/768 bytes; bank 3 offset +#0012; current ROM placement unchanged"
;       },
;       {
;         "id": 8,
;         "label": "SCREEN_PANTALLA1_0_INTERACTION_VALUE_MAP",
;         "bank": 3,
;         "zoneOffset": 24,
;         "windowAddress": 40984,
;         "storedSize": 6,
;         "uncompressedSize": 768,
;         "flags": 1,
;         "unitKind": "scene",
;         "sceneIndex": 0,
;         "sceneId": "screenmap_1767095338721",
;         "sceneName": "pantalla1",
;         "placementReason": "proposed scene first-fit placement; 6/768 bytes; bank 3 offset +#0018; current ROM placement unchanged"
;       },
;       {
;         "id": 9,
;         "label": "SCREEN_PANTALLA1_0_INTERACTION_TARGET_MAP",
;         "bank": 3,
;         "zoneOffset": 30,
;         "windowAddress": 40990,
;         "storedSize": 6,
;         "uncompressedSize": 768,
;         "flags": 1,
;         "unitKind": "scene",
;         "sceneIndex": 0,
;         "sceneId": "screenmap_1767095338721",
;         "sceneName": "pantalla1",
;         "placementReason": "proposed scene first-fit placement; 6/768 bytes; bank 3 offset +#001E; current ROM placement unchanged"
;       },
;       {
;         "id": 4,
;         "label": "SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE",
;         "bank": 3,
;         "zoneOffset": 36,
;         "windowAddress": 40996,
;         "storedSize": 1,
;         "uncompressedSize": 1,
;         "flags": 0,
;         "unitKind": "scene",
;         "sceneIndex": 0,
;         "sceneId": "screenmap_1767095338721",
;         "sceneName": "pantalla1",
;         "placementReason": "proposed scene first-fit placement; 1/1 bytes; bank 3 offset +#0024; current ROM placement unchanged"
;       },
;       {
;         "id": 5,
;         "label": "SCREEN_PANTALLA1_0_BOSS_TABLE",
;         "bank": 3,
;         "zoneOffset": 37,
;         "windowAddress": 40997,
;         "storedSize": 1,
;         "uncompressedSize": 1,
;         "flags": 0,
;         "unitKind": "scene",
;         "sceneIndex": 0,
;         "sceneId": "screenmap_1767095338721",
;         "sceneName": "pantalla1",
;         "placementReason": "proposed scene first-fit placement; 1/1 bytes; bank 3 offset +#0025; current ROM placement unchanged"
;       },
;       {
;         "id": 0,
;         "label": "NEW_SPRITE_0_F0_LAYER1",
;         "bank": 3,
;         "zoneOffset": 38,
;         "windowAddress": 40998,
;         "storedSize": 25,
;         "uncompressedSize": 32,
;         "flags": 1,
;         "unitKind": "shared",
;         "sceneIndex": null,
;         "sceneId": null,
;         "sceneName": null,
;         "placementReason": "proposed shared first-fit placement; 25/32 bytes; bank 3 offset +#0026; current ROM placement unchanged"
;       },
;       {
;         "id": 1,
;         "label": "SPRITE_PLACEHOLDER_PATTERN",
;         "bank": 3,
;         "zoneOffset": 63,
;         "windowAddress": 41023,
;         "storedSize": 5,
;         "uncompressedSize": 32,
;         "flags": 1,
;         "unitKind": "shared",
;         "sceneIndex": null,
;         "sceneId": null,
;         "sceneName": null,
;         "placementReason": "proposed shared first-fit placement; 5/32 bytes; bank 3 offset +#003F; current ROM placement unchanged"
;       }
;     ],
;     "banks": [
;       {
;         "bank": 3,
;         "usedBytes": 68,
;         "freeBytes": 8124,
;         "units": [
;           {
;             "kind": "scene",
;             "sceneIndex": 0,
;             "sceneId": "screenmap_1767095338721",
;             "sceneName": "pantalla1",
;             "resourceIds": [
;               2,
;               3,
;               6,
;               7,
;               8,
;               9,
;               4,
;               5
;             ],
;             "resourceLabels": [
;               "SCREEN_PANTALLA1_0_LAYOUT",
;               "SCREEN_PANTALLA1_0_EFFECTS_LAYOUT",
;               "BEHAVIOR_PANTALLA1_0_DATA",
;               "SCREEN_PANTALLA1_0_INTERACTION_TYPE_MAP",
;               "SCREEN_PANTALLA1_0_INTERACTION_VALUE_MAP",
;               "SCREEN_PANTALLA1_0_INTERACTION_TARGET_MAP",
;               "SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE",
;               "SCREEN_PANTALLA1_0_BOSS_TABLE"
;             ],
;             "storedBytes": 38,
;             "rawBytes": 4610
;           },
;           {
;             "kind": "shared",
;             "sceneIndex": null,
;             "sceneId": null,
;             "sceneName": null,
;             "resourceIds": [
;               0
;             ],
;             "resourceLabels": [
;               "NEW_SPRITE_0_F0_LAYER1"
;             ],
;             "storedBytes": 25,
;             "rawBytes": 32
;           },
;           {
;             "kind": "shared",
;             "sceneIndex": null,
;             "sceneId": null,
;             "sceneName": null,
;             "resourceIds": [
;               1
;             ],
;             "resourceLabels": [
;               "SPRITE_PLACEHOLDER_PATTERN"
;             ],
;             "storedBytes": 5,
;             "rawBytes": 32
;           }
;         ],
;         "resourcePlacements": [
;           {
;             "id": 2,
;             "label": "SCREEN_PANTALLA1_0_LAYOUT",
;             "bank": 3,
;             "zoneOffset": 0,
;             "windowAddress": 40960,
;             "storedSize": 6,
;             "uncompressedSize": 768,
;             "flags": 1,
;             "unitKind": "scene",
;             "sceneIndex": 0,
;             "sceneId": "screenmap_1767095338721",
;             "sceneName": "pantalla1",
;             "placementReason": "proposed scene first-fit placement; 6/768 bytes; bank 3 offset +#0000; current ROM placement unchanged"
;           },
;           {
;             "id": 3,
;             "label": "SCREEN_PANTALLA1_0_EFFECTS_LAYOUT",
;             "bank": 3,
;             "zoneOffset": 6,
;             "windowAddress": 40966,
;             "storedSize": 6,
;             "uncompressedSize": 768,
;             "flags": 1,
;             "unitKind": "scene",
;             "sceneIndex": 0,
;             "sceneId": "screenmap_1767095338721",
;             "sceneName": "pantalla1",
;             "placementReason": "proposed scene first-fit placement; 6/768 bytes; bank 3 offset +#0006; current ROM placement unchanged"
;           },
;           {
;             "id": 6,
;             "label": "BEHAVIOR_PANTALLA1_0_DATA",
;             "bank": 3,
;             "zoneOffset": 12,
;             "windowAddress": 40972,
;             "storedSize": 6,
;             "uncompressedSize": 768,
;             "flags": 1,
;             "unitKind": "scene",
;             "sceneIndex": 0,
;             "sceneId": "screenmap_1767095338721",
;             "sceneName": "pantalla1",
;             "placementReason": "proposed scene first-fit placement; 6/768 bytes; bank 3 offset +#000C; current ROM placement unchanged"
;           },
;           {
;             "id": 7,
;             "label": "SCREEN_PANTALLA1_0_INTERACTION_TYPE_MAP",
;             "bank": 3,
;             "zoneOffset": 18,
;             "windowAddress": 40978,
;             "storedSize": 6,
;             "uncompressedSize": 768,
;             "flags": 1,
;             "unitKind": "scene",
;             "sceneIndex": 0,
;             "sceneId": "screenmap_1767095338721",
;             "sceneName": "pantalla1",
;             "placementReason": "proposed scene first-fit placement; 6/768 bytes; bank 3 offset +#0012; current ROM placement unchanged"
;           },
;           {
;             "id": 8,
;             "label": "SCREEN_PANTALLA1_0_INTERACTION_VALUE_MAP",
;             "bank": 3,
;             "zoneOffset": 24,
;             "windowAddress": 40984,
;             "storedSize": 6,
;             "uncompressedSize": 768,
;             "flags": 1,
;             "unitKind": "scene",
;             "sceneIndex": 0,
;             "sceneId": "screenmap_1767095338721",
;             "sceneName": "pantalla1",
;             "placementReason": "proposed scene first-fit placement; 6/768 bytes; bank 3 offset +#0018; current ROM placement unchanged"
;           },
;           {
;             "id": 9,
;             "label": "SCREEN_PANTALLA1_0_INTERACTION_TARGET_MAP",
;             "bank": 3,
;             "zoneOffset": 30,
;             "windowAddress": 40990,
;             "storedSize": 6,
;             "uncompressedSize": 768,
;             "flags": 1,
;             "unitKind": "scene",
;             "sceneIndex": 0,
;             "sceneId": "screenmap_1767095338721",
;             "sceneName": "pantalla1",
;             "placementReason": "proposed scene first-fit placement; 6/768 bytes; bank 3 offset +#001E; current ROM placement unchanged"
;           },
;           {
;             "id": 4,
;             "label": "SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE",
;             "bank": 3,
;             "zoneOffset": 36,
;             "windowAddress": 40996,
;             "storedSize": 1,
;             "uncompressedSize": 1,
;             "flags": 0,
;             "unitKind": "scene",
;             "sceneIndex": 0,
;             "sceneId": "screenmap_1767095338721",
;             "sceneName": "pantalla1",
;             "placementReason": "proposed scene first-fit placement; 1/1 bytes; bank 3 offset +#0024; current ROM placement unchanged"
;           },
;           {
;             "id": 5,
;             "label": "SCREEN_PANTALLA1_0_BOSS_TABLE",
;             "bank": 3,
;             "zoneOffset": 37,
;             "windowAddress": 40997,
;             "storedSize": 1,
;             "uncompressedSize": 1,
;             "flags": 0,
;             "unitKind": "scene",
;             "sceneIndex": 0,
;             "sceneId": "screenmap_1767095338721",
;             "sceneName": "pantalla1",
;             "placementReason": "proposed scene first-fit placement; 1/1 bytes; bank 3 offset +#0025; current ROM placement unchanged"
;           },
;           {
;             "id": 0,
;             "label": "NEW_SPRITE_0_F0_LAYER1",
;             "bank": 3,
;             "zoneOffset": 38,
;             "windowAddress": 40998,
;             "storedSize": 25,
;             "uncompressedSize": 32,
;             "flags": 1,
;             "unitKind": "shared",
;             "sceneIndex": null,
;             "sceneId": null,
;             "sceneName": null,
;             "placementReason": "proposed shared first-fit placement; 25/32 bytes; bank 3 offset +#0026; current ROM placement unchanged"
;           },
;           {
;             "id": 1,
;             "label": "SPRITE_PLACEHOLDER_PATTERN",
;             "bank": 3,
;             "zoneOffset": 63,
;             "windowAddress": 41023,
;             "storedSize": 5,
;             "uncompressedSize": 32,
;             "flags": 1,
;             "unitKind": "shared",
;             "sceneIndex": null,
;             "sceneId": null,
;             "sceneName": null,
;             "placementReason": "proposed shared first-fit placement; 5/32 bytes; bank 3 offset +#003F; current ROM placement unchanged"
;           }
;         ],
;         "resourceIds": [
;           2,
;           3,
;           6,
;           7,
;           8,
;           9,
;           4,
;           5,
;           0,
;           1
;         ],
;         "resourceLabels": [
;           "SCREEN_PANTALLA1_0_LAYOUT",
;           "SCREEN_PANTALLA1_0_EFFECTS_LAYOUT",
;           "BEHAVIOR_PANTALLA1_0_DATA",
;           "SCREEN_PANTALLA1_0_INTERACTION_TYPE_MAP",
;           "SCREEN_PANTALLA1_0_INTERACTION_VALUE_MAP",
;           "SCREEN_PANTALLA1_0_INTERACTION_TARGET_MAP",
;           "SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE",
;           "SCREEN_PANTALLA1_0_BOSS_TABLE",
;           "NEW_SPRITE_0_F0_LAYER1",
;           "SPRITE_PLACEHOLDER_PATTERN"
;         ]
;       }
;     ],
;     "sceneBankPlan": [
;       {
;         "index": 0,
;         "id": "screenmap_1767095338721",
;         "name": "pantalla1",
;         "currentBanks": [
;           3
;         ],
;         "proposedBanks": [
;           3
;         ]
;       }
;     ],
;     "delta": {
;       "currentBankCount": 1,
;       "proposedBankCount": 1,
;       "currentSceneBankTouches": 1,
;       "proposedSceneBankTouches": 1
;     }
;   },
;   "sceneClusters": [
;     {
;       "index": 0,
;       "id": "screenmap_1767095338721",
;       "name": "pantalla1",
;       "resourceIds": [
;         2,
;         3,
;         6,
;         7,
;         8,
;         9,
;         4,
;         5
;       ],
;       "banks": [
;         3
;       ],
;       "bankCount": 1,
;       "storedBytes": 38,
;       "rawBytes": 4610,
;       "coLocated": true,
;       "preferredBank": 3
;     }
;   ],
;   "pressureWarnings": [],
;   "sharedOrGlobalResources": [
;     {
;       "id": 0,
;       "label": "NEW_SPRITE_0_F0_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 3,
;       "windowAddress": 40996,
;       "zoneOffset": 36,
;       "size": 25,
;       "storedSize": 25,
;       "uncompressedSize": 32,
;       "flags": 1,
;       "placementReason": "post-ZX0 first-fit single NEW_SPRITE_0_F0_LAYER1 resource; ZX0 25/32 bytes; bank 3 zone 0 offset +#0024; zone slack after pack 8124 bytes"
;     },
;     {
;       "id": 1,
;       "label": "SPRITE_PLACEHOLDER_PATTERN",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 3,
;       "windowAddress": 41021,
;       "zoneOffset": 61,
;       "size": 5,
;       "storedSize": 5,
;       "uncompressedSize": 32,
;       "flags": 1,
;       "placementReason": "post-ZX0 first-fit single SPRITE_PLACEHOLDER_PATTERN resource; ZX0 5/32 bytes; bank 3 zone 0 offset +#003D; zone slack after pack 8124 bytes"
;     }
;   ],
;   "duplicationCandidates": [
;     {
;       "id": 0,
;       "label": "NEW_SPRITE_0_F0_LAYER1",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 3,
;       "storedSize": 25,
;       "uncompressedSize": 32
;     },
;     {
;       "id": 1,
;       "label": "SPRITE_PLACEHOLDER_PATTERN",
;       "group": "SPRITES",
;       "type": "SPRITE_PATTERNS",
;       "bank": 3,
;       "storedSize": 5,
;       "uncompressedSize": 32
;     }
;   ]
; }
;
; [[[MIDEAS_ARTIFACT:bank_optimizer.json:END]]]

; [[[MIDEAS_ARTIFACT:tilebank_integrity.json:BEGIN]]]
; {
;   "version": 1,
;   "scope": "konami8k_tilebank_integrity",
;   "summary": {
;     "screens": 1,
;     "tileBanks": 0,
;     "checkedScreens": 0,
;     "issueScreens": 0,
;     "issueCells": 0,
;     "issueTiles": 0,
;     "missingAssetCells": 0,
;     "missingAssetTiles": 0,
;     "unassignedCells": 0,
;     "unassignedTiles": 0
;   },
;   "screens": [
;     {
;       "index": 0,
;       "id": "screenmap_1767095338721",
;       "name": "pantalla1",
;       "tileBankAssetId": null,
;       "tileBankName": null,
;       "activeArea": {
;         "x": 0,
;         "y": 0,
;         "width": 32,
;         "height": 24
;       },
;       "status": "no_tilebank_selected",
;       "totals": {
;         "checkedCells": 0,
;         "uniqueTiles": 0,
;         "issueCells": 0,
;         "issueTiles": 0,
;         "missingAssetCells": 0,
;         "missingAssetTiles": 0,
;         "unassignedCells": 0,
;         "unassignedTiles": 0
;       },
;       "issues": []
;     }
;   ]
; }
;
; [[[MIDEAS_ARTIFACT:tilebank_integrity.json:END]]]

; [[[MIDEAS_ARTIFACT:resource_manager.asm:BEGIN]]]
; ; @mideas:block id=runtime.resources.manager kind=routine owner=resources roots=resource_manager_init,resource_find_by_id,resource_copy_from_bank_to_ram,resource_decompress_from_bank_to_ram,resource_copy_from_bank_to_vram,resource_decompress_from_bank_to_vram,resource_dzx0_to_vram,resource_load_to_ram_by_id,resource_load_to_vram_by_id,resource_read_byte_from_bank
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
;     ld (far_call_irq_lock_depth), a
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
;
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
;
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
;     ld a, (far_call_irq_lock_depth)
;     or a
;     jp nz, .resource_copy_ram_irq_done
;     ei
;
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
;     ld a, (far_call_irq_lock_depth)
;     or a
;     jp nz, .resource_decompress_ram_irq_done
;     ei
;
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
;     nop
;     ld a, d
;     or #40
;     out (#99), a
;     nop
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
;     ld a, (far_call_irq_lock_depth)
;     or a
;     jp nz, .resource_copy_vram_irq_done
;     ei
;
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
;     ld a, (far_call_irq_lock_depth)
;     or a
;     jp nz, .resource_decompress_vram_irq_done
;     ei
;
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
;     nop
;     ld a, d
;     or #40
;     out (#99), a
;     nop
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
;     nop
;     nop
;     nop
;     ld a, h
;     and #3F
;     out (#99), a
;     nop
;     nop
;     nop
;     nop
;     in a, (#98)
;     ld b, a
;     ld a, e
;     out (#99), a
;     nop
;     nop
;     ld a, d
;     or #40
;     out (#99), a
;     nop
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
; ;   Loads the current screen layout directly into runtime_screen_layout.
; ;   No immutable background copy is kept when secret zones are not generated.
; ; Clobbers:
; ;   AF, BC, DE, HL
; ; ------------------------------------------------------------------
; resource_load_screen_layout_cached:
;     ld de, runtime_screen_layout
;     call resource_load_to_ram_by_id
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
; ; @mideas:endblock id=runtime.resources.manager
;
; [[[MIDEAS_ARTIFACT:resource_manager.asm:END]]]

; [[[MIDEAS_ARTIFACT:world_music_policy.txt:BEGIN]]]
; WORLD MUSIC POLICY
; Source: inferred from Game Flow paths reaching each WorldLink.
; Mode preserve: multiple different music states can reach the same world.
;
; WORLD 00 New Worldmap (worldmap_1767095499385)
; - policy: preserve
; [[[MIDEAS_ARTIFACT:world_music_policy.txt:END]]]

; [[[MIDEAS_ARTIFACT:world_sprite_pattern_policy.txt:BEGIN]]]
; WORLD SPRITE PATTERN POLICY
; Source: runtime sprite packs inferred from entities present in each world.
; Pack capacity: 64 slots (including placeholder).
;
; PACKS
; PACK 00 worldmap_1767095499385
; - display: World "New Worldmap"
; - slots: 2/64
; - placeholder_slot: 1
; - sprites:
;   0: New Sprite @ slot 0
;
; WORLD -> PACK
; 00 New Worldmap (worldmap_1767095499385) -> worldmap_1767095499385 [id=0]
; [[[MIDEAS_ARTIFACT:world_sprite_pattern_policy.txt:END]]]

; [[[MIDEAS_ARTIFACT:screen_resource_policy.txt:BEGIN]]]
; SCREEN RESOURCE POLICY
; Logical view of resources consumed by screen/world loading paths.
;
; COMMON RESOURCES
; - patterns/colors: none
; - font patterns: RESOURCE_ID_FONT_PATTERN_DATA
; - font colors: RESOURCE_ID_FONT_COLOR_DATA
; - presentation: none
;
; SCREEN 00 pantalla1 (screenmap_1767095338721)
; - worlds: worldmap_1767095499385
; - tile_bank: default/base
; - sprite_pattern_slots: 2
; - music_in_game: 0
; - layout: RESOURCE_ID_SCREEN_PANTALLA1_0_LAYOUT
; - effects_layout: RESOURCE_ID_SCREEN_PANTALLA1_0_EFFECTS_LAYOUT
; - effect_zone_table: RESOURCE_ID_SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE
; - interaction_type_map: RESOURCE_ID_SCREEN_PANTALLA1_0_INTERACTION_TYPE_MAP
; - interaction_value_map: RESOURCE_ID_SCREEN_PANTALLA1_0_INTERACTION_VALUE_MAP
; - interaction_target_map: RESOURCE_ID_SCREEN_PANTALLA1_0_INTERACTION_TARGET_MAP
; - behavior: RESOURCE_ID_BEHAVIOR_PANTALLA1_0_DATA
; [[[MIDEAS_ARTIFACT:screen_resource_policy.txt:END]]]

; [[[MIDEAS_ARTIFACT:unused_report.txt:BEGIN]]]
; MIDEAS UNUSED MODULE REPORT
; Scope: konami8k_megarom_resident_modules
; Candidate unused modules: 7
; Estimated removable bytes: 10402
;
; Candidates:
; - sound: 4763 estimated bytes
; - animtiles: 2640 estimated bytes
; - scroll: 2407 estimated bytes
; - bosses: 331 estimated bytes
; - hud: 114 estimated bytes
; - patterns_code: 74 estimated bytes
; - colors_code: 73 estimated bytes
;
; Retained modules:
; - components: 15385 estimated bytes
; - components_tail: 5905 estimated bytes
; - entities: 5018 estimated bytes
; - font: 6704 estimated bytes
; - gameflow: 15091 estimated bytes
; - gameflow_aux: 5276 estimated bytes
; - screen_loaders: 4557 estimated bytes
; - screens_code: 1219 estimated bytes
; - sprites: 3098 estimated bytes
; - worlds: 1590 estimated bytes
;
; Note: report-only; module removal is a later pipeline step.
;
; [[[MIDEAS_ARTIFACT:unused_report.txt:END]]]

; [[[MIDEAS_ARTIFACT:segment_budget.json:BEGIN]]]
; {
;   "version": 1,
;   "scope": "konami8k_segment_budget",
;   "mapperFormat": "konami",
;   "mapper": {
;     "format": "konami",
;     "dataWindowPage": "p3",
;     "windowBase": "#A000",
;     "windowMask": "#1FFF",
;     "bankDivisor": "#2000",
;     "codeSegmentSize": 8192,
;     "dataSegmentSize": 8192
;   },
;   "segmentSize": 8192,
;   "segmentSizeMeaning": "code overlay bank size",
;   "codeSegmentSize": 8192,
;   "dataSegmentSize": 8192,
;   "runtimeLayout": {
;     "mapperFormat": "konami",
;     "codeWindowGranularity": 8192,
;     "status": "smoke-candidate",
;     "smokeBlocked": false,
;     "lowerPageResidentBanks": [],
;     "lowerPageFarBanks": [],
;     "upperPageResidentBanks": [],
;     "lowerPageHazardBankCount": 0,
;     "dataWindowResidentConflict": false,
;     "ramTrampolineRequired": false,
;     "ramTrampolineInstalled": false,
;     "residentEstimatedWindowOverflowCount": 0,
;     "residentEstimatedWindowOverflowSamples": [],
;     "residentEstimatedOutOfWindowLabelCount": 0,
;     "residentEstimatedOutOfWindowLabelSamples": [],
;     "residentEstimatedOutOfWindowCallCount": 0,
;     "residentEstimatedOutOfWindowCallSamples": [],
;     "farToFarDirectCallCount": 0,
;     "farToFarDirectCallSamples": [],
;     "lowerPageHiddenResidentCallCount": 0,
;     "lowerPageHiddenResidentCallSamples": [],
;     "reason": "No ASCII16 lower-page code-window hazard detected."
;   },
;   "codeBanks": [
;     {
;       "bank": 1,
;       "role": "resident_code",
;       "segmentSize": 8192,
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "placementReason": "resident kernel slot 1; fixed P1 window #6000-#8000; stays always mapped so runtime flow does not depend on P3 data-window state",
;       "estimatedUsedBytes": 15385,
;       "estimatedFreeBytes": 0,
;       "estimatedOverBudget": true,
;       "modules": [
;         {
;           "key": "components",
;           "placementReason": "resident kernel slot 1; fixed P1 window #6000-#8000; stays always mapped so runtime flow does not depend on P3 data-window state; module components is part of the resident execution kernel",
;           "estimatedBytes": 15385
;         }
;       ]
;     },
;     {
;       "bank": 2,
;       "role": "resident_code",
;       "segmentSize": 8192,
;       "page": 2,
;       "orgAddress": 32768,
;       "endAddress": 40960,
;       "placementReason": "resident kernel slot 2; fixed P2 window #8000-#A000; stays always mapped so runtime flow does not depend on P3 data-window state",
;       "estimatedUsedBytes": 20996,
;       "estimatedFreeBytes": 0,
;       "estimatedOverBudget": true,
;       "modules": [
;         {
;           "key": "components_tail",
;           "placementReason": "resident kernel slot 2; fixed P2 window #8000-#A000; stays always mapped so runtime flow does not depend on P3 data-window state; module components_tail is part of the resident execution kernel",
;           "estimatedBytes": 5905
;         },
;         {
;           "key": "gameflow",
;           "placementReason": "resident kernel slot 2; fixed P2 window #8000-#A000; stays always mapped so runtime flow does not depend on P3 data-window state; module gameflow is part of the resident execution kernel",
;           "estimatedBytes": 15091
;         }
;       ]
;     },
;     {
;       "bank": 4,
;       "role": "far_code",
;       "segmentSize": 8192,
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "placementReason": "far-call module; sorted by estimated size at overlay index 1; physical bank 4; executes through P1/#6000 after reserved asset-data banks",
;       "estimatedUsedBytes": 6704,
;       "estimatedFreeBytes": 1488,
;       "estimatedOverBudget": false,
;       "modules": [
;         {
;           "key": "font",
;           "placementReason": "far-call module; sorted by estimated size at overlay index 1; physical bank 4; executes through P1/#6000 after reserved asset-data banks; module font is callable only through bank-0 far trampolines",
;           "estimatedBytes": 6704
;         }
;       ]
;     },
;     {
;       "bank": 5,
;       "role": "far_code",
;       "segmentSize": 8192,
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "placementReason": "far-call module; sorted by estimated size at overlay index 2; physical bank 5; executes through P1/#6000 after reserved asset-data banks",
;       "estimatedUsedBytes": 5276,
;       "estimatedFreeBytes": 2916,
;       "estimatedOverBudget": false,
;       "modules": [
;         {
;           "key": "gameflow_aux",
;           "placementReason": "far-call module; sorted by estimated size at overlay index 2; physical bank 5; executes through P1/#6000 after reserved asset-data banks; module gameflow_aux is callable only through bank-0 far trampolines",
;           "estimatedBytes": 5276
;         }
;       ]
;     },
;     {
;       "bank": 6,
;       "role": "far_code",
;       "segmentSize": 8192,
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "placementReason": "far-call module; sorted by estimated size at overlay index 3; physical bank 6; executes through P1/#6000 after reserved asset-data banks",
;       "estimatedUsedBytes": 5018,
;       "estimatedFreeBytes": 3174,
;       "estimatedOverBudget": false,
;       "modules": [
;         {
;           "key": "entities",
;           "placementReason": "far-call module; sorted by estimated size at overlay index 3; physical bank 6; executes through P1/#6000 after reserved asset-data banks; module entities is callable only through bank-0 far trampolines",
;           "estimatedBytes": 5018
;         }
;       ]
;     },
;     {
;       "bank": 7,
;       "role": "far_code",
;       "segmentSize": 8192,
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "placementReason": "far-call module; sorted by estimated size at overlay index 4; physical bank 7; executes through P1/#6000 after reserved asset-data banks",
;       "estimatedUsedBytes": 4763,
;       "estimatedFreeBytes": 3429,
;       "estimatedOverBudget": false,
;       "modules": [
;         {
;           "key": "sound",
;           "placementReason": "far-call module; sorted by estimated size at overlay index 4; physical bank 7; executes through P1/#6000 after reserved asset-data banks; module sound is callable only through bank-0 far trampolines",
;           "estimatedBytes": 4763
;         }
;       ]
;     },
;     {
;       "bank": 8,
;       "role": "far_code",
;       "segmentSize": 8192,
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "placementReason": "far-call module; sorted by estimated size at overlay index 5; physical bank 8; executes through P1/#6000 after reserved asset-data banks",
;       "estimatedUsedBytes": 4557,
;       "estimatedFreeBytes": 3635,
;       "estimatedOverBudget": false,
;       "modules": [
;         {
;           "key": "screen_loaders",
;           "placementReason": "far-call module; sorted by estimated size at overlay index 5; physical bank 8; executes through P1/#6000 after reserved asset-data banks; module screen_loaders is callable only through bank-0 far trampolines",
;           "estimatedBytes": 4557
;         }
;       ]
;     },
;     {
;       "bank": 9,
;       "role": "far_code",
;       "segmentSize": 8192,
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "placementReason": "far-call module; sorted by estimated size at overlay index 6; physical bank 9; executes through P1/#6000 after reserved asset-data banks",
;       "estimatedUsedBytes": 3098,
;       "estimatedFreeBytes": 5094,
;       "estimatedOverBudget": false,
;       "modules": [
;         {
;           "key": "sprites",
;           "placementReason": "far-call module; sorted by estimated size at overlay index 6; physical bank 9; executes through P1/#6000 after reserved asset-data banks; module sprites is callable only through bank-0 far trampolines",
;           "estimatedBytes": 3098
;         }
;       ]
;     },
;     {
;       "bank": 10,
;       "role": "far_code",
;       "segmentSize": 8192,
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "placementReason": "far-call module; sorted by estimated size at overlay index 7; physical bank 10; executes through P1/#6000 after reserved asset-data banks",
;       "estimatedUsedBytes": 2640,
;       "estimatedFreeBytes": 5552,
;       "estimatedOverBudget": false,
;       "modules": [
;         {
;           "key": "animtiles",
;           "placementReason": "far-call module; sorted by estimated size at overlay index 7; physical bank 10; executes through P1/#6000 after reserved asset-data banks; module animtiles is callable only through bank-0 far trampolines",
;           "estimatedBytes": 2640
;         }
;       ]
;     },
;     {
;       "bank": 11,
;       "role": "far_code",
;       "segmentSize": 8192,
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "placementReason": "far-call module; sorted by estimated size at overlay index 8; physical bank 11; executes through P1/#6000 after reserved asset-data banks",
;       "estimatedUsedBytes": 2407,
;       "estimatedFreeBytes": 5785,
;       "estimatedOverBudget": false,
;       "modules": [
;         {
;           "key": "scroll",
;           "placementReason": "far-call module; sorted by estimated size at overlay index 8; physical bank 11; executes through P1/#6000 after reserved asset-data banks; module scroll is callable only through bank-0 far trampolines",
;           "estimatedBytes": 2407
;         }
;       ]
;     },
;     {
;       "bank": 12,
;       "role": "far_code",
;       "segmentSize": 8192,
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "placementReason": "far-call module; sorted by estimated size at overlay index 9; physical bank 12; executes through P1/#6000 after reserved asset-data banks",
;       "estimatedUsedBytes": 1590,
;       "estimatedFreeBytes": 6602,
;       "estimatedOverBudget": false,
;       "modules": [
;         {
;           "key": "worlds",
;           "placementReason": "far-call module; sorted by estimated size at overlay index 9; physical bank 12; executes through P1/#6000 after reserved asset-data banks; module worlds is callable only through bank-0 far trampolines",
;           "estimatedBytes": 1590
;         }
;       ]
;     },
;     {
;       "bank": 13,
;       "role": "far_code",
;       "segmentSize": 8192,
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "placementReason": "far-call module; sorted by estimated size at overlay index 10; physical bank 13; executes through P1/#6000 after reserved asset-data banks",
;       "estimatedUsedBytes": 1219,
;       "estimatedFreeBytes": 6973,
;       "estimatedOverBudget": false,
;       "modules": [
;         {
;           "key": "screens_code",
;           "placementReason": "far-call module; sorted by estimated size at overlay index 10; physical bank 13; executes through P1/#6000 after reserved asset-data banks; module screens_code is callable only through bank-0 far trampolines",
;           "estimatedBytes": 1219
;         }
;       ]
;     },
;     {
;       "bank": 14,
;       "role": "far_code",
;       "segmentSize": 8192,
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "placementReason": "far-call module; sorted by estimated size at overlay index 11; physical bank 14; executes through P1/#6000 after reserved asset-data banks",
;       "estimatedUsedBytes": 331,
;       "estimatedFreeBytes": 7861,
;       "estimatedOverBudget": false,
;       "modules": [
;         {
;           "key": "bosses",
;           "placementReason": "far-call module; sorted by estimated size at overlay index 11; physical bank 14; executes through P1/#6000 after reserved asset-data banks; module bosses is callable only through bank-0 far trampolines",
;           "estimatedBytes": 331
;         }
;       ]
;     },
;     {
;       "bank": 15,
;       "role": "far_code",
;       "segmentSize": 8192,
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "placementReason": "far-call module; sorted by estimated size at overlay index 12; physical bank 15; executes through P1/#6000 after reserved asset-data banks",
;       "estimatedUsedBytes": 114,
;       "estimatedFreeBytes": 8078,
;       "estimatedOverBudget": false,
;       "modules": [
;         {
;           "key": "hud",
;           "placementReason": "far-call module; sorted by estimated size at overlay index 12; physical bank 15; executes through P1/#6000 after reserved asset-data banks; module hud is callable only through bank-0 far trampolines",
;           "estimatedBytes": 114
;         }
;       ]
;     },
;     {
;       "bank": 16,
;       "role": "far_code",
;       "segmentSize": 8192,
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "placementReason": "far-call module; sorted by estimated size at overlay index 13; physical bank 16; executes through P1/#6000 after reserved asset-data banks",
;       "estimatedUsedBytes": 74,
;       "estimatedFreeBytes": 8118,
;       "estimatedOverBudget": false,
;       "modules": [
;         {
;           "key": "patterns_code",
;           "placementReason": "far-call module; sorted by estimated size at overlay index 13; physical bank 16; executes through P1/#6000 after reserved asset-data banks; module patterns_code is callable only through bank-0 far trampolines",
;           "estimatedBytes": 74
;         }
;       ]
;     },
;     {
;       "bank": 17,
;       "role": "far_code",
;       "segmentSize": 8192,
;       "page": 1,
;       "orgAddress": 24576,
;       "endAddress": 32768,
;       "placementReason": "far-call module; sorted by estimated size at overlay index 14; physical bank 17; executes through P1/#6000 after reserved asset-data banks",
;       "estimatedUsedBytes": 73,
;       "estimatedFreeBytes": 8119,
;       "estimatedOverBudget": false,
;       "modules": [
;         {
;           "key": "colors_code",
;           "placementReason": "far-call module; sorted by estimated size at overlay index 14; physical bank 17; executes through P1/#6000 after reserved asset-data banks; module colors_code is callable only through bank-0 far trampolines",
;           "estimatedBytes": 73
;         }
;       ]
;     }
;   ],
;   "dataBanks": [
;     {
;       "bank": 3,
;       "role": "asset_data",
;       "orgAddress": 40960,
;       "endAddress": 49152,
;       "usedBytes": 68,
;       "freeBytes": 8124,
;       "resources": 10
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
; Flow: Start → TextScroll (THE MAZE OF GALIOUS)
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
    ; MEGAROM Konami static bank setup.
    ; Bank 0 (#4000-#5FFF): fixed. Banks 1-3 map to P1/P2/P3.
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
    ; Re-enables on exit unless a far trampoline still owns the mapper window.
    ; NOTE: The old LD A,I / PUSH AF / RET PO pattern is unreliable on Z80 —
    ; an interrupt between LD A,I and PUSH AF clears P/V, skipping EI and
    ; leaving interrupts permanently disabled (next HALT locks the system).
    di

    ; Set VRAM write address
    ld a, e
    out (#99), a           ; Write address low byte to VDP
    nop                    ; Real VDPs need a short settle time between control writes
    nop
    ld a, d
    or #40                 ; Set bit 6 for write mode
    out (#99), a           ; Write address high byte + write command
    nop                    ; Let the VDP latch the address before the first data write
    nop

    ; Copy loop
.ldirvm_loop:
    ld a, (hl)             ; Read byte from RAM (7 cycles)
    out (#98), a           ; Write to VRAM data port (11 cycles)
    inc hl                 ; Next source address (6 cycles)
    dec bc                 ; Decrement counter (6 cycles)
    ld a, b                ; Check if BC = 0 (4 cycles)
    or c                   ; (4 cycles)
    jr nz, .ldirvm_loop    ; Loop if not zero (12/7 cycles)

    ld a, (interrupt_in_progress)
    or a
    jp nz, .ldirvm_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .ldirvm_irq_done
    ei
.ldirvm_irq_done:
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
    nop
    ld a, h
    or #40
    out (#99), a
    nop
    nop

    ld a, e
.fill_loop:
    out (#98), a
    dec bc
    ld a, b
    or c
    ld a, e
    jr nz, .fill_loop

    ld a, (interrupt_in_progress)
    or a
    jp nz, .fill_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .fill_irq_done
    ei
.fill_irq_done:
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
    nop                    ; TMS9918/MSX1 needs settling time between control writes
    nop
    ld a, h
    or #40                 ; Write mode (7 cycles)
    out (#99), a           ; Address high + command (11 cycles)
    nop                    ; Let the VDP latch the address before data write
    nop
    ld a, c
    out (#98), a           ; Write to VRAM (11 cycles)
    pop af                 ; Restore caller AF
    pop bc
    push af
    ld a, (interrupt_in_progress)
    or a
    jp nz, .wrtvrm_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .wrtvrm_irq_done
    ei
.wrtvrm_irq_done:
    pop af

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
    nop
    nop
    ld a, h
    and #3F                ; Clear bit 6 for read mode (bit 7 must be 0)
    out (#99), a           ; Address high + read command
    nop                    ; Let the VDP latch the read address
    nop
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

; No tiles detected - using MSX default character size
TILE_WIDTH      EQU 8    ; Default: 8x8 pixels per MSX character
TILE_HEIGHT     EQU 8    ; Default: 8x8 pixels per MSX character
SCREEN_TILES_X  EQU 32   ; Horizontal tiles (Screen 1/2)
SCREEN_TILES_Y  EQU 24   ; Vertical tiles
MSX_CHARS_PER_TILE_X EQU 1   ; 1 MSX character per tile
MSX_CHARS_PER_TILE_Y EQU 1   ; 1 MSX character per tile



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

; Runtime control binding modes
CONTROL_KEY_SPC    EQU 0
CONTROL_KEY_CTRL   EQU 1
CONTROL_KEY_N      EQU 0
CONTROL_PHYS_BTN1  EQU 0
CONTROL_PHYS_BTN2  EQU 1

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

; Goal Variable Values (default)
GOAL_FAILURE            EQU 0    ; Goal = "Failure"
GOAL_COMPLETED          EQU 1    ; Goal = "Completed"


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
NODE_TYPE_TEXT_SCROLL   EQU 15   ; Text scroll node (story crawl)
NODE_TYPE_TEXT_SCROLL2  EQU 16   ; Pattern-table pixel text scroll node
NODE_TYPE_TRANSITION    EQU 5    ; Transition node
NODE_TYPE_RESTART       EQU 6    ; Restart node (restart game/level)
NODE_TYPE_END           EQU 7    ; End node (game over, victory, credits)
NODE_TYPE_IF_THEN_ELSE  EQU 8    ; IfThenElse node (conditional branch)
NODE_TYPE_GLOBALS       EQU 9    ; Globals node (global variable ops)
NODE_TYPE_WAYPOINT      EQU 10   ; Waypoint node (routing marker)
NODE_TYPE_GROUP         EQU 11   ; Group node (nested flow)
NODE_TYPE_MUSIC         EQU 12   ; Music node (audio command)
NODE_TYPE_PRESENTATION_SCREEN EQU 13 ; Presentation Screen node (static tile screen)
NODE_TYPE_CONTROLS      EQU 14   ; Controls node (button binding menu)
NODE_TYPE_UNKNOWN       EQU 255  ; Unknown/unsupported node type

; Additional Game Flow States detected in project
; (Custom states would be added here if needed)


; ==================================================================
; PROJECT-SPECIFIC CONSTANTS
; ==================================================================

; Detected Assets
TOTAL_SPRITES           EQU 1
TOTAL_TILES             EQU 0
TOTAL_SCREENS           EQU 1

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
input_key_button1_mode EQU #C005   ; Keyboard binding for physical button 1 (0=SPC, 1=CTRL)
input_key_button2_mode EQU #C006   ; Keyboard binding for physical button 2 (0=N, 1=CTRL)
control_jump_button EQU #C007   ; Physical button assigned to jump/fire action (0=button1, 1=button2)
control_action_button EQU #C008   ; Physical button assigned to action/grab action (0=button1, 1=button2)
boss_runtime_tick   EQU #C009   ; Boss runtime frame counter
current_screen_boss_count EQU #C00A   ; Boss placements assigned to current screen
current_screen_boss_table EQU #C00B   ; Pointer to current screen boss placement table (16-bit)
current_screen_boss_table_bank EQU #C00D   ; Mapper bank for current screen boss placement table
current_screen_boss_entry EQU #C00E   ; First current-screen boss placement copied to RAM (13 bytes)
boss_active         EQU #C01B   ; 1 when a screen boss is active
boss_health_lo      EQU #C01C   ; Active boss health low byte
boss_health_hi      EQU #C01D   ; Active boss health high byte
boss_hit_cooldown   EQU #C01E   ; Frames until boss can receive dash damage again
boss_phase_table_ptr EQU #C01F   ; Active boss phase table pointer (16-bit)
boss_attack_table_ptr EQU #C021   ; Active boss attack table pointer (16-bit)
boss_data_bank      EQU #C023   ; Active boss data mapper bank (#FF for resident/simple)
boss_phase_ptr      EQU #C024   ; Active boss phase record pointer (16-bit)
boss_tile_matrix_ptr EQU #C026   ; Active boss tile matrix pointer (16-bit)
boss_x_char         EQU #C028   ; Active boss X in screen chars
boss_y_char         EQU #C029   ; Active boss Y in screen chars
boss_prev_x_char    EQU #C02A   ; Previous boss X in screen chars for redraw restore
boss_prev_y_char    EQU #C02B   ; Previous boss Y in screen chars for redraw restore
boss_initial_phase_index EQU #C02C   ; Active boss initial phase index
boss_width          EQU #C02D   ; Active boss width in chars
boss_height         EQU #C02E   ; Active boss height in chars
boss_behavior_table_ptr EQU #C02F   ; Active boss behavior table pointer (16-bit)
boss_form_table_ptr EQU #C031   ; Active boss visual form table pointer (16-bit)
boss_weak_matrix_ptr EQU #C033   ; Active boss weak-point matrix pointer (16-bit)
boss_behavior_action_ptr EQU #C035   ; Current boss behavior action pointer (16-bit)
boss_behavior_count EQU #C037   ; Active boss behavior action count
boss_behavior_index EQU #C038   ; Current boss behavior action index
boss_behavior_timer EQU #C039   ; Frames remaining in current boss behavior action
boss_behavior_duration EQU #C03A   ; Current boss behavior action duration
boss_behavior_step_interval EQU #C03B   ; Frames between tile movement steps
boss_behavior_step_timer EQU #C03C   ; Countdown until next tile movement step
boss_update_interval EQU #C03D   ; Frames between ASM boss updates (1=every frame)
boss_update_timer EQU #C03E   ; Countdown until next ASM boss update
boss_behavior_action_type EQU #C03F   ; Current boss behavior action type
boss_behavior_target_type EQU #C040   ; Current boss behavior target type
boss_behavior_target_x EQU #C041   ; Current boss behavior target X char
boss_behavior_target_y EQU #C042   ; Current boss behavior target Y char
boss_behavior_aux0 EQU #C043   ; Current boss behavior auxiliary byte 0
boss_behavior_aux1 EQU #C044   ; Current boss behavior auxiliary byte 1
boss_behavior_aux2 EQU #C045   ; Current boss behavior auxiliary byte 2
boss_visual_dirty   EQU #C046   ; Non-zero when boss tile matrix/form changed and needs redraw
boss_draw_row       EQU #C047   ; Boss tile draw row scratch
boss_draw_col       EQU #C048   ; Boss tile draw column scratch
boss_restore_row    EQU #C049   ; Boss previous footprint restore row scratch
boss_restore_col    EQU #C04A   ; Boss previous footprint restore column scratch
boss_draw_char      EQU #C04B   ; Boss tile draw char scratch
boss_draw_screen_x  EQU #C04C   ; Boss tile draw screen X scratch
boss_draw_screen_y  EQU #C04D   ; Boss tile draw screen Y scratch
boss_projectile_active EQU #C04E   ; 1 when the simple boss projectile is active
boss_projectile_x   EQU #C04F   ; Simple boss projectile X in pixels
boss_projectile_y   EQU #C050   ; Simple boss projectile Y in pixels
boss_projectile_sprite_slot EQU #C051   ; HW sprite slot for simple boss projectile
boss_projectile_color EQU #C052   ; Simple boss projectile sprite color
boss_projectile_color2 EQU #C053   ; Simple boss projectile second layer color
boss_projectile_pattern EQU #C054   ; Simple boss projectile base pattern
boss_projectile_speed EQU #C055   ; Simple boss projectile speed
boss_projectile_range EQU #C056   ; Simple boss projectile max travel distance
boss_projectile_distance EQU #C057   ; Simple boss projectile current travelled distance
boss_projectile_vel_x EQU #C058   ; Signed boss projectile X velocity
boss_projectile_vel_y EQU #C059   ; Signed boss projectile Y velocity
boss_projectile_abs_x EQU #C05A   ; Absolute X delta toward player
boss_projectile_abs_y EQU #C05B   ; Absolute Y delta toward player
boss_projectile_sign_x EQU #C05C   ; 1 when player is left of projectile origin
boss_projectile_sign_y EQU #C05D   ; 1 when player is above projectile origin
boss_projectile_frame_count EQU #C05E   ; Animation frame count for simple boss projectile
boss_projectile_layer_count EQU #C05F   ; HW sprite layer count for simple boss projectile
boss_slam_rocks_active EQU #C060   ; 1 while SlamRocks sequence is active
boss_slam_rocks_age EQU #C061   ; SlamRocks local frame age
boss_slam_rocks_origin_y EQU #C062   ; Boss Y before SlamRocks starts
boss_slam_rocks_rise_chars EQU #C063   ; Chars boss rises before impact
boss_slam_rocks_windup EQU #C064   ; Raised frames before impact
boss_slam_rocks_slam EQU #C065   ; Drop frames before rocks begin
boss_slam_rocks_hold EQU #C066   ; Ground hold frames before rocks begin
boss_slam_rocks_duration EQU #C067   ; Total SlamRocks active frames
boss_slam_rocks_count EQU #C068   ; Falling rock count
boss_slam_rocks_index EQU #C069   ; Current falling rock lane index
boss_slam_rocks_rng  EQU #C06A   ; Local SlamRocks random seed
boss_slam_rocks_sprite_slot EQU #C06B   ; First HW sprite slot for SlamRocks rocks
boss_slam_rocks_color EQU #C06C   ; SlamRocks rock sprite color
boss_slam_rocks_pattern EQU #C06D   ; SlamRocks rock base pattern
boss_slam_rocks_speed EQU #C06E   ; SlamRocks rock fall speed
boss_slam_rocks_range EQU #C06F   ; SlamRocks rock fall range
boss_slam_rock_x0    EQU #C070   ; SlamRocks lane 0 X
boss_slam_rock_x1    EQU #C071   ; SlamRocks lane 1 X
boss_slam_rock_x2    EQU #C072   ; SlamRocks lane 2 X
boss_slam_rock_x3    EQU #C073   ; SlamRocks lane 3 X
boss_falling_blocks_active EQU #C074   ; 1 while FallingBlocks sequence is active
boss_falling_blocks_age EQU #C075   ; FallingBlocks local frame age
boss_falling_blocks_count EQU #C076   ; Falling block count
boss_falling_blocks_index EQU #C077   ; Current falling block lane index
boss_falling_blocks_landed_flags EQU #C078   ; Bitmask of lanes already converted to chars
boss_falling_blocks_rng EQU #C079   ; Local FallingBlocks random seed
boss_falling_blocks_sprite_slot EQU #C07A   ; First HW sprite slot for falling blocks
boss_falling_blocks_color EQU #C07B   ; Falling block sprite color
boss_falling_blocks_pattern EQU #C07C   ; Falling block base pattern
boss_falling_blocks_speed EQU #C07D   ; Falling block speed
boss_falling_blocks_duration EQU #C07E   ; FallingBlocks max active frames
boss_falling_blocks_tile_char EQU #C07F   ; Char written when a falling block lands
boss_falling_blocks_landing_y EQU #C080   ; Landing row in chars
boss_falling_blocks_behavior EQU #C081   ; Behavior byte written when a block lands
boss_falling_blocks_tile_x EQU #C082   ; Landing X char scratch
boss_falling_blocks_x0 EQU #C083   ; FallingBlocks lane 0 X
boss_falling_blocks_x1 EQU #C084   ; FallingBlocks lane 1 X
boss_falling_blocks_x2 EQU #C085   ; FallingBlocks lane 2 X
boss_falling_blocks_x3 EQU #C086   ; FallingBlocks lane 3 X
boss_meteor_age     EQU #C087   ; Boss meteor cycle age
boss_meteor_count   EQU #C088   ; Active meteor lanes
boss_meteor_index   EQU #C089   ; Current meteor lane index
boss_meteor_base_x  EQU #C08A   ; First meteor lane X
boss_meteor_base_y  EQU #C08B   ; Meteor spawn Y
boss_meteor_sprite_slot EQU #C08C   ; First HW sprite slot for meteors
boss_meteor_color   EQU #C08D   ; Meteor sprite color
boss_meteor_pattern EQU #C08E   ; Meteor base pattern
boss_meteor_speed   EQU #C08F   ; Meteor fall speed
boss_meteor_range   EQU #C090   ; Meteor fall range
boss_meteor_spread  EQU #C091   ; Meteor lane spacing
boss_meteor_warn    EQU #C092   ; Meteor warning frames
boss_bomb_age       EQU #C093   ; Boss bomb cycle age
boss_bomb_count     EQU #C094   ; Active bomb lanes
boss_bomb_index     EQU #C095   ; Current bomb lane index
boss_bomb_base_x    EQU #C096   ; First bomb lane X
boss_bomb_base_y    EQU #C097   ; Bomb spawn Y
boss_bomb_sprite_slot EQU #C098   ; First HW sprite slot for bombs
boss_bomb_color     EQU #C099   ; Bomb sprite color
boss_bomb_pattern   EQU #C09A   ; Bomb base pattern
boss_bomb_explosion_pattern EQU #C09B   ; Bomb explosion pattern
boss_bomb_spread    EQU #C09C   ; Bomb lane spacing
boss_bomb_fuse      EQU #C09D   ; Bomb fuse frames
boss_bomb_radius    EQU #C09E   ; Bomb explosion radius
boss_bomb_duration  EQU #C09F   ; Bomb explosion active frames
boss_boomerang_age  EQU #C0A0   ; Boss boomerang cycle age
boss_boomerang_base_x EQU #C0A1   ; Boomerang origin X
boss_boomerang_base_y EQU #C0A2   ; Boomerang origin Y
boss_boomerang_sprite_slot EQU #C0A3   ; HW sprite slot for boomerang
boss_boomerang_color EQU #C0A4   ; Boomerang sprite color
boss_boomerang_pattern EQU #C0A5   ; Boomerang base pattern
boss_boomerang_speed EQU #C0A6   ; Boomerang speed
boss_boomerang_range EQU #C0A7   ; Boomerang max distance
boss_boomerang_distance EQU #C0A8   ; Current boomerang distance from origin
boss_boomerang_direction EQU #C0A9   ; Boomerang direction
boss_rock_age       EQU #C0AA   ; Boss rock cycle age
boss_rock_base_x    EQU #C0AB   ; Rock origin X
boss_rock_base_y    EQU #C0AC   ; Rock origin Y
boss_rock_sprite_slot EQU #C0AD   ; HW sprite slot for rock
boss_rock_color     EQU #C0AE   ; Rock sprite color
boss_rock_pattern   EQU #C0AF   ; Rock base pattern
boss_rock_speed     EQU #C0B0   ; Rock speed
boss_rock_range     EQU #C0B1   ; Rock max travel distance
boss_rock_distance  EQU #C0B2   ; Current rock distance from origin
boss_rock_direction EQU #C0B3   ; Rock direction
boss_rock_arc_height EQU #C0B4   ; Rock parabolic arc height
boss_rock_arc_offset EQU #C0B5   ; Current rock arc offset
boss_laser_age      EQU #C0B6   ; Boss laser cycle age
boss_laser_base_x   EQU #C0B7   ; Laser origin X in pixels
boss_laser_base_y   EQU #C0B8   ; Laser origin Y in pixels
boss_laser_tile_char EQU #C0B9   ; Laser beam char code
boss_laser_length   EQU #C0BA   ; Laser length in chars
boss_laser_duration EQU #C0BB   ; Laser active frames
boss_laser_direction EQU #C0BC   ; Laser direction
boss_laser_index    EQU #C0BD   ; Current laser char index
boss_laser_origin_tile_x EQU #C0BE   ; Laser origin tile X
boss_laser_origin_tile_y EQU #C0BF   ; Laser origin tile Y
boss_laser_tile_x   EQU #C0C0   ; Current laser tile X
boss_laser_tile_y   EQU #C0C1   ; Current laser tile Y
boss_laser_write_mode EQU #C0C2   ; 0=draw laser, 1=restore map
boss_wave_age       EQU #C0C3   ; Boss sine-wave projectile cycle age
boss_wave_base_x    EQU #C0C4   ; Sine-wave projectile origin X
boss_wave_base_y    EQU #C0C5   ; Sine-wave projectile origin Y
boss_wave_sprite_slot EQU #C0C6   ; HW sprite slot for sine-wave projectile
boss_wave_color     EQU #C0C7   ; Sine-wave projectile sprite color
boss_wave_pattern   EQU #C0C8   ; Sine-wave projectile base pattern
boss_wave_speed     EQU #C0C9   ; Sine-wave projectile speed
boss_wave_range     EQU #C0CA   ; Sine-wave projectile max travel distance
boss_wave_distance  EQU #C0CB   ; Current sine-wave projectile distance
boss_wave_direction EQU #C0CC   ; Sine-wave projectile direction
boss_wave_amplitude EQU #C0CD   ; Sine-wave perpendicular amplitude
boss_wave_frequency EQU #C0CE   ; Frames per sine-wave phase step
boss_wave_phase     EQU #C0CF   ; Current sine-wave phase index
boss_wave_offset    EQU #C0D0   ; Signed sine-wave perpendicular offset
boss_homing_age     EQU #C0D1   ; Boss homing missile cycle age
boss_homing_base_x  EQU #C0D2   ; Homing missile origin X
boss_homing_base_y  EQU #C0D3   ; Homing missile origin Y
boss_homing_sprite_slot EQU #C0D4   ; HW sprite slot for homing missile
boss_homing_color   EQU #C0D5   ; Homing missile sprite color
boss_homing_pattern EQU #C0D6   ; Homing missile base pattern
boss_homing_speed   EQU #C0D7   ; Homing missile speed
boss_homing_range   EQU #C0D8   ; Homing missile max travel distance
boss_homing_distance EQU #C0D9   ; Current homing missile distance
boss_homing_direction EQU #C0DA   ; Homing missile launch direction
boss_homing_turn_step EQU #C0DB   ; Homing missile steering strength
boss_homing_turn_distance EQU #C0DC   ; Homing missile steering distance
autocontrol_screen_id EQU #C0DD   ; Screen id bound to current FakePlayer script
autocontrol_entity_index EQU #C0DE   ; Active FakePlayer entity index (#FF=none)
autocontrol_script_ptr_l EQU #C0DF   ; Current FakePlayer script pointer low byte
autocontrol_script_ptr_h EQU #C0E0   ; Current FakePlayer script pointer high byte
autocontrol_script_start_l EQU #C0E1   ; FakePlayer script start pointer low byte
autocontrol_script_start_h EQU #C0E2   ; FakePlayer script start pointer high byte
autocontrol_wait_frames EQU #C0E3   ; FakePlayer wait countdown in frames
autocontrol_move_opcode EQU #C0E4   ; Active FakePlayer movement opcode
autocontrol_move_remaining EQU #C0E5   ; Remaining FakePlayer movement pixels
autocontrol_loop_flag EQU #C0E6   ; 1=loop FakePlayer script on END
autocontrol_active EQU #C0E7   ; 1=FakePlayer script active
autoev_screen_id EQU #C0E8   ; Screen id bound to compact FakePlayer event script
autoev_entity_index EQU #C0E9   ; Active compact FakePlayer entity index (#FF=none)
autoev_script_ptr_l EQU #C0EA   ; Compact FakePlayer event pointer low byte
autoev_script_ptr_h EQU #C0EB   ; Compact FakePlayer event pointer high byte
autoev_script_start_l EQU #C0EC   ; Compact FakePlayer event start pointer low byte
autoev_script_start_h EQU #C0ED   ; Compact FakePlayer event start pointer high byte
autoev_wait_frames EQU #C0EE   ; Compact FakePlayer wait countdown in frames
autoev_move_axis EQU #C0EF   ; Compact move axis (1=x,2=y)
autoev_move_step EQU #C0F0   ; Compact move step (1 or #FF)
autoev_move_remaining EQU #C0F1   ; Remaining compact FakePlayer movement pixels
autoev_loop_flag EQU #C0F2   ; 1=loop compact FakePlayer event script
autoev_active EQU #C0F3   ; 1=compact FakePlayer event script active
autoev_wait_mode EQU #C0F4   ; 1=wait SPC, 2=wait typewriter
autoev_number_l EQU #C0F5   ; Parsed compact event number low byte
autoev_number_h EQU #C0F6   ; Parsed compact event number high byte
dialogue_active    EQU #C0F7   ; 1=dialogue box is open
dialogue_current_box EQU #C0F8   ; Current dialogue box config index
dialogue_text_active EQU #C0F9   ; 1=typewriter is writing text
dialogue_text_ptr_l EQU #C0FA   ; Dialogue typewriter text pointer low byte
dialogue_text_ptr_h EQU #C0FB   ; Dialogue typewriter text pointer high byte
dialogue_vram_ptr_l EQU #C0FC   ; Dialogue typewriter VRAM pointer low byte
dialogue_vram_ptr_h EQU #C0FD   ; Dialogue typewriter VRAM pointer high byte
dialogue_row_start_l EQU #C0FE   ; Current dialogue row start VRAM low byte
dialogue_row_start_h EQU #C0FF   ; Current dialogue row start VRAM high byte
dialogue_char_delay EQU #C100   ; Dialogue character delay countdown
dialogue_char_delay_reload EQU #C101   ; Dialogue character delay reload value
dialogue_box_vram_l EQU #C102   ; Dialogue box VRAM start low byte
dialogue_box_vram_h EQU #C103   ; Dialogue box VRAM start high byte
dialogue_box_width EQU #C104   ; Dialogue box width in chars
dialogue_box_height EQU #C105   ; Dialogue box height in chars
dialogue_box_tl_char EQU #C106   ; Dialogue top-left border char
dialogue_box_tr_char EQU #C107   ; Dialogue top-right border char
dialogue_box_bl_char EQU #C108   ; Dialogue bottom-left border char
dialogue_box_br_char EQU #C109   ; Dialogue bottom-right border char
dialogue_box_h_char EQU #C10A   ; Dialogue horizontal border char
dialogue_box_v_char EQU #C10B   ; Dialogue vertical border char
dialogue_graphic_enabled EQU #C10C   ; 1=dialogue tile graphic is visible
dialogue_graphic_vram_l EQU #C10D   ; Dialogue graphic VRAM start low byte
dialogue_graphic_vram_h EQU #C10E   ; Dialogue graphic VRAM start high byte
dialogue_graphic_ptr_l EQU #C10F   ; Dialogue graphic tile data pointer low byte
dialogue_graphic_ptr_h EQU #C110   ; Dialogue graphic tile data pointer high byte
dialogue_graphic_width EQU #C111   ; Dialogue graphic width in chars
dialogue_graphic_height EQU #C112   ; Dialogue graphic height in chars
dialogue_graphic_tilebank_id EQU #C113   ; SCREEN2 tilebank id required by dialogue graphic (#FF=none)
dialogue_mouth_enabled EQU #C114   ; 1=dialogue portrait mouth animation enabled
dialogue_mouth_vram_l EQU #C115   ; Dialogue mouth VRAM low byte
dialogue_mouth_vram_h EQU #C116   ; Dialogue mouth VRAM high byte
dialogue_mouth_closed_char EQU #C117   ; Dialogue closed mouth char code
dialogue_mouth_open_char EQU #C118   ; Dialogue open mouth char code
dialogue_mouth_interval EQU #C119   ; Chars between mouth toggles
dialogue_mouth_counter EQU #C11A   ; Current mouth animation char counter
dialogue_mouth_state EQU #C11B   ; 0=closed, 1=open
current_flow_state  EQU #C11C   ; Current game flow state
prev_flow_state     EQU #C11D   ; Previous game flow state
gameflow_exit_requested EQU #C11E   ; Exit flag for WorldLink loop
gameflow_menu_selection EQU #C11F   ; Current/last submenu selection
gameflow_submenu_data_ptr EQU #C120   ; Pointer to active submenu data (16-bit)
gameflow_submenu_option_count EQU #C122   ; Cached submenu option count
gameflow_submenu_cursor_enabled EQU #C123   ; 1 when submenu uses sprite cursor
gameflow_submenu_cursor_layer_count EQU #C124   ; Cursor sprite layer count (1..4)
gameflow_condition_result EQU #C125   ; Result of last condition evaluation
gameflow_deferred_game_init EQU #C126   ; 1 when PresentationScreen deferred init_game_systems until after Transition
gameflow_reveal_world_after_load EQU #C127   ; 1 when Transition->WorldLink reveals the loaded screen by raster
gameflow_textscroll_line_table_ptr EQU #C128   ; TextScroll line table pointer (16-bit)
gameflow_textscroll_line_ptr EQU #C12A   ; TextScroll active string pointer (16-bit)
gameflow_textscroll_line_count EQU #C12C   ; TextScroll line count
gameflow_textscroll_speed EQU #C12D   ; TextScroll frames per pixel step
gameflow_textscroll_bg_color EQU #C12E   ; TextScroll screen background color
gameflow_textscroll_stripe_color EQU #C12F   ; TextScroll stripe/background color
gameflow_textscroll_step EQU #C130   ; TextScroll coarse row step
gameflow_textscroll_fine EQU #C131   ; TextScroll fine pixel offset
gameflow_textscroll_row EQU #C132   ; TextScroll current screen row
gameflow_textscroll_line_col EQU #C133   ; TextScroll active line column
gameflow_textscroll2_text_ptr EQU #C134   ; TextScroll2 active fixed-width line pointer (16-bit)
gameflow_textscroll2_text_pix EQU #C136   ; TextScroll2 active font scanline 0..7
gameflow_textscroll2_line_count EQU #C137   ; TextScroll2 generated text line count
gameflow_textscroll2_speed EQU #C138   ; TextScroll2 frames per pixel step
gameflow_textscroll2_bg_color EQU #C139   ; TextScroll2 screen background color
gameflow_textscroll2_stripe_color EQU #C13A   ; TextScroll2 pattern background color
gameflow_textscroll2_steps_left EQU #C13B   ; TextScroll2 remaining pixel scroll steps (16-bit)
transition_delay_var    EQU #C13D   ; Frames per step for active transition effect
transition_effect_id    EQU #C13E   ; Last Transition effect id for target reveal
transition_fill_char    EQU #C13F   ; Name Table char for active transition wipe (#FE/#FF)
transition_diag_index   EQU #C140   ; Diagonal clear current diagonal (0..54)
transition_diag_len     EQU #C141   ; Diagonal clear remaining cells in current diagonal
transition_diag_done    EQU #C142   ; 1 when diagonal clear is complete
transition_diag_addr    EQU #C143   ; Diagonal clear current VRAM address

; ==================================================================
; MIDEAS GLOBAL VARIABLES (DEFAULTS + CUSTOM)
; ==================================================================
global_var_goal     EQU #C145   ; Goal status (0=Failure, 1=Completed)

; ==================================================================
; SYSTEM VARIABLES
; ==================================================================
ROM_slot            EQU #C146   ; Expanded slot for normal page 1 ROM access
slot_primary_normal EQU #C147   ; Primary slot register snapshot for BIOS-ROM-ROM-RAM layout
page0_bios_slot     EQU #C148   ; Expanded slot for normal BIOS page 0
page2_normal_slot   EQU #C149   ; Expanded slot for normal page 2 layout
page3_normal_slot   EQU #C14A   ; Expanded slot for normal RAM page 3
slot_subslot_normal EQU #C14B   ; Raw subslot register snapshot for normal page 3 expanded slot
mapper_bank_p1_current EQU #C14C   ; Mapper current bank for page/window 1
mapper_bank_p2_current EQU #C14D   ; Mapper current bank for page/window 2
mapper_bank_p3_current EQU #C14E   ; Mapper current bank for page/window 3
mapper_bank_p4_current EQU #C14F   ; Mapper current bank for page/window 4
mapper_saved_bank    EQU #C150   ; Saved mapper bank for push/pop helpers
mapper_saved_bank_p1 EQU #C151   ; Saved mapper bank for page/window 1 helpers
mapper_saved_bank_p3 EQU #C152   ; Saved mapper bank for page/window 3 helpers
mapper_saved_bank_p4 EQU #C153   ; Saved mapper bank for page/window 4 helpers
resource_descriptor_ptr EQU #C154   ; Pointer to cached resource descriptor entry (16-bit)
resource_descriptor_id EQU #C156   ; Cached resource id
resource_descriptor_type EQU #C157   ; Cached resource type
resource_descriptor_group EQU #C158   ; Cached resource group
resource_descriptor_bank EQU #C159   ; Cached resource bank
resource_descriptor_addr EQU #C15A   ; Cached resource visible address (16-bit)
resource_descriptor_size EQU #C15C   ; Cached resource size (16-bit)
resource_descriptor_uncompressed_size EQU #C15E   ; Cached resource uncompressed size (16-bit)
resource_descriptor_flags EQU #C160   ; Cached resource flags
vram_cache_tile_patterns_ready EQU #C161   ; 1 when shared gameplay tile patterns are already resident in VRAM
vram_cache_tile_colors_ready EQU #C162   ; 1 when shared gameplay tile colors are already resident in VRAM
vram_cache_font_ready EQU #C163   ; 1 when shared font patterns/colors are already resident in VRAM
resource_ram_cache_effects_layout_id EQU #C164   ; Cached resource id for runtime_effects_layout source
resource_ram_cache_effect_zone_table_id EQU #C165   ; Cached resource id for runtime_effect_zone_table source
current_screen2_tilebank_id EQU #C166   ; Current SCREEN 2 shared tilebank loaded in VRAM (#FF=none/unknown)

; ASCII16 lower-window far-call bridge copied to RAM at boot
ASCII16_FAR_CALL_P1_RAM EQU #C167   ; RAM routine: map ASCII16 lower 16KB page, call target, restore page
ASCII16_FAR_CALL_P1_PRESERVE_A_RAM EQU #C1C7   ; RAM routine variant preserving caller/result A through AF'
ASCII16_RESIDENT_CALL_P1_RAM EQU #C227   ; RAM routine: call resident lower-page routine from ASCII16 P1 far code
ASCII16_TAIL_JUMP_P1_RAM EQU #C287   ; RAM routine: map ASCII16 lower page and JP without restoring
ASCII16_IRQ_ENTRY_RAM EQU #C2A7   ; RAM H.TIMI entry: map ASCII16 bank0 before interrupt_dispatcher
ASCII16_IRQ_EXIT_RAM EQU #C2E7   ; RAM H.TIMI exit: restore interrupted ASCII16 lower-page bank
ascii16_far_target_bank EQU #C327   ; Target ASCII16 bank for RAM far-call bridge
ascii16_far_old_bank EQU #C328   ; Previous ASCII16 lower-page bank for RAM far-call restore
ascii16_far_call_depth EQU #C329   ; Non-zero while executing inside ASCII16 RAM far-call target
ascii16_far_target_addr EQU #C32A   ; Target entry address for RAM far-call bridge (16-bit)
ascii16_resident_call_target_addr EQU #C32C   ; Resident target address for RAM bridge (16-bit)
ascii16_resident_call_saved_hl EQU #C32E   ; Saved HL input while RAM resident-call bridge stages target address
ascii16_resident_call_saved_de EQU #C330   ; Saved DE input while RAM resident-call bridge stages return address
ascii16_resident_call_old_bank EQU #C332   ; Previous far lower-page bank for RAM resident-call restore
ascii16_irq_saved_bank EQU #C333   ; Interrupted lower-page bank restored after ASCII16 RAM ISR
frame_counter       EQU #C334   ; Frame counter (16-bit)

; Profiling counters (16-bit, cumulative)
prof_update_all_entities_calls EQU #C336   ; Calls to update_all_entities
prof_execute_sm_calls EQU #C338   ; Calls to execute_all_state_machines
prof_sm_update_calls  EQU #C33A   ; Calls to SM_Update
prof_collision_calls  EQU #C33C   ; Calls to update_collision_component
prof_wall_calls       EQU #C33E   ; Calls to update_wallcollision_component
prof_deadly_calls     EQU #C340   ; Calls to update_deadly_tiles_component
prof_tile_interaction_calls EQU #C342   ; Calls to check_tile_interaction
prof_animation_calls  EQU #C344   ; Calls to update_animation_component
prof_sprite_calls     EQU #C346   ; Calls to update_sprite_component
prof_music_task_calls EQU #C348   ; Calls to task_update_music
prof_deadly_behavior_reads EQU #C34A   ; Deadly helper behavior-map reads
; page0_transfer_buffer shares the ZX0 scratch area declared near RAM_USAGE_END.

; ==================================================================
; SCREEN MAP POINTERS (Current active screen)
; ==================================================================
current_screen_layout   EQU #C34C   ; Pointer to current screen layout data (16-bit)
current_screen_layout_bank EQU #C34E   ; Mapper bank for current screen layout data
current_behavior_map    EQU #C34F   ; Pointer to current behavior map data (16-bit)
current_behavior_map_bank EQU #C351   ; Mapper bank for current behavior map data
behavior_cache_row     EQU #C352   ; Cached behavior row (255=invalid)
behavior_cache_map_l   EQU #C353   ; Cached behavior map pointer low byte
behavior_cache_map_h   EQU #C354   ; Cached behavior map pointer high byte
behavior_cache_row_base EQU #C355   ; Cached row base address in behavior map (16-bit)
RUNTIME_SCREEN_MAP_SIZE EQU 768
MAX_RUNTIME_EFFECT_ZONES EQU 0
RUNTIME_KEEP_BACKGROUND_LAYOUT EQU 0
runtime_screen_layout  EQU #C357   ; Mutable copy of current screen layout (32x24)
runtime_behavior_map   EQU #C657   ; Mutable copy of current behavior map (32x24)
runtime_interaction_type_map EQU #C957   ; Mutable copy of current interaction type map (32x24)
runtime_interaction_value_map EQU #CC57   ; Mutable copy of current interaction value map (32x24)
runtime_interaction_target_map EQU #CF57   ; Mutable copy of current interaction target map (32x24)
runtime_char_behavior_table EQU #D257   ; Current screen char -> behavior lookup table (256 bytes)
runtime_effects_layout EQU #D357   ; Alternate effects layout copy for secret zones (32x24)
screen_block_catalog_ptr EQU #D657   ; Scratch pointer to current screen block catalog during layout expansion
screen_block_map_ptr EQU #D659   ; Scratch pointer to current screen block index map during layout expansion
runtime_effect_zone_table EQU #D65B   ; Current screen effect zone table (0 bytes)
current_effect_zone_count EQU #D65B   ; Number of effect zones copied into runtime_effect_zone_table
secret_zone_active EQU #D65C   ; 1 if hero is currently inside an active secret zone
secret_zone_rect_x EQU #D65D   ; Active secret zone rect X in cells
secret_zone_rect_y EQU #D65E   ; Active secret zone rect Y in cells
secret_zone_rect_w EQU #D65F   ; Active secret zone rect width in cells
secret_zone_rect_h EQU #D660   ; Active secret zone rect height in cells

; ==================================================================
; VIEWPORT/CAMERA VARIABLES (for scroll system)
; ==================================================================
camera_x            EQU #D661   ; Camera X position in pixels (16-bit)
camera_y            EQU #D663   ; Camera Y position in pixels (16-bit)
camera_tile_x       EQU #D665   ; Camera tile X (column)
camera_tile_y       EQU #D666   ; Camera tile Y (row)
world_width_tiles   EQU #D667   ; World width in tiles
world_height_tiles  EQU #D668   ; World height in tiles
scroll_dirty_flag   EQU #D669   ; 1=viewport changed, needs redraw
hud_dirty_flag      EQU #D66A   ; 1=HUD needs redraw, 0=clean
time_second_frame_counter EQU #D66B   ; VBlank frames remaining until the next TimeRemaining decrement
time_last_interrupt_counter EQU #D66C   ; Last interrupt_counter snapshot used by TimeRemaining sync (16-bit)

; ==================================================================
; ANIMATED TILES VARIABLES
; ==================================================================
anim_tile_timer     EQU #D66E   ; Animation frame timer
anim_tile_frame     EQU #D66F   ; Current animation frame (0-3)
anim_tile_speed     EQU #D670   ; Frames between animation updates

; ==================================================================
; ENTITY SYSTEM VARIABLES (Fixed 32 entities)
; ==================================================================
MAX_ENTITIES        EQU 32
entity_active       EQU #D671   ; Entity active flags (32 bytes, 0=inactive, 1=active)
entity_is_player    EQU #D691   ; Entity hero/player flag (32 bytes, 0=no, 1=yes)
entity_limit_on     EQU #D6B1   ; Limit_on screen-edge clamp flag (32 bytes, 0=no, 1=yes)
entity_button_contact_active EQU #D6D1   ; 1 while entity stays on the same button tile (32 bytes)
entity_button_contact_x EQU #D6F1   ; Button tile X currently latched per entity (32 bytes)
entity_button_contact_y EQU #D711   ; Button tile Y currently latched per entity (32 bytes)
entity_on_ladder   EQU #D731   ; 1 while entity is centered on a ladder tile (32 bytes)
entity_gate_current_step EQU #D751   ; Current applied retract step (32 bytes)
entity_gate_step_timer EQU #D771   ; Countdown until next retract step (32 bytes)
entity_walljump_lock EQU #D791   ; Remaining horizontal lock frames after wall jump (32 bytes)
entity_walljump_locked_vx EQU #D7B1   ; Horizontal velocity preserved while wall jump lock is active (32 bytes)
entity_wallgrab_active EQU #D7D1   ; 1 if entity is currently grabbing a wall (32 bytes)
entity_wallgrab_grace EQU #D7F1   ; Frames to keep wall grab during transient wall flag gaps (32 bytes)
entity_wallgrab_timer EQU #D811   ; Remaining wall-grab frames until grounded reset (32 bytes)
entity_wallgrab_lockout EQU #D831   ; Wall grab disabled until grounded after timer is spent (32 bytes)
entity_wallgrab_cfg_enabled EQU #D851   ; Runtime WallGrab enabled flag per entity (32 bytes)
entity_wallgrab_cfg_fall_speed EQU #D871   ; Runtime WallGrab fall speed per entity (32 bytes)
entity_wallgrab_cfg_climb_speed EQU #D891   ; Runtime WallGrab climb speed per entity (32 bytes)
entity_wallgrab_cfg_duration_frames EQU #D8B1   ; Runtime WallGrab duration per entity (32 bytes)
entity_wallgrab_cfg_grab_sprite EQU #D8D1   ; Runtime WallGrab sprite index per entity (32 bytes)
entity_walljump_anim_active EQU #D8F1   ; Wall jump one-shot animation is waiting to restore base sprite (32 bytes)
entity_dash_cfg_enabled EQU #D911   ; Runtime Dash enabled flag per entity (32 bytes)
entity_x_pos        EQU #D931   ; Entity X positions (32 bytes)
entity_y_pos        EQU #D951   ; Entity Y positions (32 bytes)
entity_vel_x        EQU #D971   ; Entity X velocity (32 bytes)
entity_vel_y        EQU #D991   ; Entity Y velocity (32 bytes)
entity_comp_masks   EQU #D9B1   ; Entity component masks (32 bytes)
entity_comp_masks_hi EQU #D9D1   ; Entity component masks high byte (32 bytes)
entity_screen_id    EQU #D9F1   ; Entity screen ID (32 bytes)
entity_job_period   EQU #DA11   ; Entity job period in frames (32 bytes, 1=100%,2=50%,3=33%,4=25%)
entity_job_entry    EQU #DA31   ; Entity job entry slot within period window (32 bytes)
entity_job_scheduler_active EQU #DA51   ; 1 when any entity uses non-default job cadence
entity_dir_mask     EQU #DA52   ; Entity direction mask (32 bytes)
entity_input_speed  EQU #DA72   ; Entity input/cursor speed (32 bytes)
entity_health       EQU #DA92   ; Entity health (32 bytes)
entity_anim_frame   EQU #DAB2   ; Entity animation frame (32 bytes)
entity_anim_tick    EQU #DAD2   ; Entity animation tick counter (32 bytes)
entity_anim_speed   EQU #DAF2   ; Entity animation speed (ticks per frame) (32 bytes)
entity_anim_flags   EQU #DB12   ; Entity animation flags (32 bytes)
entity_sm_ptr_l     EQU #DB32   ; Entity State Pointer Low (32 bytes)
entity_sm_ptr_h     EQU #DB52   ; Entity State Pointer High (32 bytes)
entity_sm_timer_l   EQU #DB72   ; Entity State Timer Low (32 bytes)
entity_sm_timer_h   EQU #DB92   ; Entity State Timer High (32 bytes)
entity_sm_wait_timer EQU #DBB2   ; Entity State Wait Timer (32 bytes)
entity_sm_sprite_control EQU #DBD2   ; 1 when the assigned state machine explicitly drives sprite changes (32 bytes)
entity_lifetime     EQU #DBF2   ; Entity lifetime for auto-destroy (32 bytes, 0=infinite)
entity_collectible_enabled EQU #DC12   ; 1 when entity has Collectible component (32 bytes)
entity_carried_by   EQU #DC32   ; Entity carrier ID (32 bytes, 255=not carried)
entity_carry_held   EQU #DC52   ; Entity carried by this carrier (32 bytes, 255=none)
entity_carry_base_sprite EQU #DC72   ; Sprite asset to restore after carrying (32 bytes, 255=none)
entity_box_state    EQU #DC92   ; Box runtime state (0=sprite,1=carried,2=dropped tiles) (32 bytes)
entity_box_tile_x   EQU #DCB2   ; Dropped box tile X (32 bytes)
entity_box_tile_y   EQU #DCD2   ; Dropped box tile Y (32 bytes)
entity_template_token EQU #DCF2   ; Entity template token (32 bytes, 0=unknown)
entity_facing_dir   EQU #DD12   ; Last facing direction (32 bytes, 0=none,1=left,2=right,3=up,4=down)
entity_sm_var_0     EQU #DD32   ; Entity Variable 0 (32 bytes)
entity_sm_var_1     EQU #DD52   ; Entity Variable 1 (32 bytes)
entity_sm_var_2     EQU #DD72   ; Entity Variable 2 (32 bytes)
entity_sm_var_3     EQU #DD92   ; Entity Variable 3 (32 bytes)
entity_sm_var_4     EQU #DDB2   ; Entity Variable 4 (32 bytes)
entity_sm_var_5     EQU #DDD2   ; Entity Variable 5 (32 bytes)
entity_sm_var_6     EQU #DDF2   ; Entity Variable 6 (32 bytes)
entity_sm_var_7     EQU #DE12   ; Entity Variable 7 (32 bytes)

; ==================================================================
; SPRITE SYSTEM VARIABLES
; ==================================================================
entity_sprite_asset_index EQU #DE32   ; Entity sprite asset index - RAM copy (32 bytes)
entity_sprite_config EQU #DE52   ; Entity sprite config RAM copy (base HW sprite + layer count, 64 bytes)
sprite_asset_frame_count EQU #DE92   ; Sprite asset frame counts RAM copy (1 bytes)
sprite_asset_layer_count EQU #DE93   ; Sprite asset layer counts RAM copy (1 bytes)
sprite_loop_flags EQU #DE94   ; Sprite loop flags RAM copy (1 bytes)
sprite_dir_left_table EQU #DE95   ; Directional sprite lookup RAM copy (1 bytes)
sprite_dir_right_table EQU #DE96   ; Directional sprite lookup RAM copy (1 bytes)
sprite_dir_up_table EQU #DE97   ; Directional sprite lookup RAM copy (1 bytes)
sprite_dir_down_table EQU #DE98   ; Directional sprite lookup RAM copy (1 bytes)
SM_SpriteLayerColorTable EQU #DE99   ; Runtime SM sprite layer colors (1*1 bytes)
SM_SpriteLayerYOffsetTable EQU #DE9A   ; Runtime SM sprite layer Y offsets (1*1 bytes)
active_sprite_count EQU #DE9B   ; Number of sprites currently active
sprites_dirty      EQU #DE9C   ; 1=sprite_attributes changed, needs VRAM sync
sprite_pattern      EQU #DE9D   ; Sprite pattern IDs (32 bytes)
sprite_color        EQU #DEBD   ; Sprite colors (32 bytes)
sprite_layer_colors EQU #DEDD   ; HW sprite layer color cache - RAM copy (32 bytes, indexed by HW sprite index)
sprite_layer_y_offsets EQU #DEFD   ; HW sprite layer signed Y offsets - RAM copy (32 bytes, indexed by HW sprite index)
sprite_asset_base_pattern_slot_runtime EQU #DF1D   ; Runtime base 16x16 slot per sprite asset (1 bytes)
sprite_placeholder_base_pattern_num EQU #DF1E   ; Runtime placeholder pattern number (base slot * 4)
current_sprite_pattern_pack_id EQU #DF1F   ; Active runtime sprite pattern pack id (#FF=none loaded)
sprite_attributes   EQU #DF20   ; Interleaved sprite attributes (32 * 4 bytes)

; ==================================================================
; SCREEN SYSTEM VARIABLES (1 screens detected)
; ==================================================================
current_screen_id   EQU #DFA0   ; Currently displayed screen ID
current_screen_engine EQU #DFA1   ; Runtime engine: 0=Player, 1=FakePlayer
screen_dirty_flag   EQU #DFA2   ; Screen needs redraw flag
screen_transition_cooldown EQU #DFA3   ; Cooldown frames after screen transition
current_world_id    EQU #DFA4   ; Current world ID (for multi-world support)
current_screen_index EQU #DFA5   ; Current screen index within world
current_screen_anim_group_count EQU #DFA6   ; Animated tile groups visible in current screen
current_screen_entity_count EQU #DFA7   ; Entity instances assigned to current screen
current_screen_sprite_pattern_slots EQU #DFA8   ; Sprite pattern slots needed by current screen
current_screen_summary_flags EQU #DFA9   ; Runtime screen summary flags (music/hud/effects/anim)

; ==================================================================
; PLAYER SYSTEM VARIABLES (player entity detected)
; ==================================================================
player_x            EQU #DFAA   ; Player X position (16-bit)
player_y            EQU #DFAC   ; Player Y position (16-bit)
player_runtime_enabled EQU #DFAE   ; 1=player fast runtime bound to hero entity
player_entity_index EQU #DFAF   ; Entity index used by player fast runtime (#FF=none)
player_vx_runtime   EQU #DFB0   ; Cached player X velocity (signed 8-bit)
player_vy_runtime   EQU #DFB1   ; Cached player Y velocity (signed 8-bit)
player_dash_timer   EQU #DFB2   ; Frames remaining in current Player dash
player_dash_cooldown EQU #DFB3   ; Frames until Player can dash again
player_dash_dir     EQU #DFB4   ; Player dash direction (1=left,2=right,3=up,4=down)
player_dash_tile_x  EQU #DFB5   ; Dash front probe tile X scratch
player_dash_tile_y  EQU #DFB6   ; Dash front probe tile Y scratch
player_health       EQU #DFB7   ; Player health points
player_score        EQU #DFB8   ; Player score (16-bit)
gem_count           EQU #DFBA   ; Collectible tile counter (8-bit)
last_interaction_char EQU #DFBB   ; Char code of last interacted tile (for SM VARIABLE_COMPARE)
last_gem_char       EQU last_interaction_char   ; Backwards-compatible alias for collectible SM checks
last_interaction_pending EQU #DFBC   ; 1 when a new tile interaction is pending for State Machine logic
last_interaction_type EQU #DFBD   ; Interaction type id of last interacted tile
last_interaction_value EQU #DFBE   ; Interaction value byte of last interacted tile
last_interaction_target EQU #DFBF   ; Interaction target id of last interacted tile
last_interaction_x  EQU #DFC0   ; Tile X coordinate of last interaction
last_interaction_y  EQU #DFC1   ; Tile Y coordinate of last interaction
last_interaction_entity EQU #DFC2   ; Entity index that triggered the last interaction

; Persistent collectibles list (survives screen re-entry)
MAX_COLLECTIBLES     EQU 64              ; Max persistent collectible records
collected_count      EQU #DFC3   ; Number of collected tiles recorded (8-bit)
collected_world      EQU #DFC4   ; World IDs for each collected tile (MAX_COLLECTIBLES bytes)
collected_screen     EQU #E004   ; Screen IDs for each collected tile (MAX_COLLECTIBLES bytes)
collected_idx_l      EQU #E044   ; Tile name-table index low byte (MAX_COLLECTIBLES bytes)
collected_idx_h      EQU #E084   ; Tile name-table index high byte (MAX_COLLECTIBLES bytes)

; Timed bonus tile respawn slots (bonus gem regeneration)
MAX_BONUS_RESPAWNS   EQU 16              ; Max timed bonus tiles waiting to respawn
bonus_respawn_world  EQU #E0C4   ; World IDs for timed bonus respawns (MAX_BONUS_RESPAWNS bytes)
bonus_respawn_screen EQU #E0D4   ; Screen IDs for timed bonus respawns (MAX_BONUS_RESPAWNS bytes)
bonus_respawn_idx_l  EQU #E0E4   ; Tile index low byte for timed respawns (MAX_BONUS_RESPAWNS bytes)
bonus_respawn_idx_h  EQU #E0F4   ; Tile index high byte for timed respawns (MAX_BONUS_RESPAWNS bytes)
bonus_respawn_secs   EQU #E104   ; Remaining seconds per timed respawn slot (MAX_BONUS_RESPAWNS bytes)
bonus_respawn_frames EQU #E114   ; Frame countdown (60..1) per timed respawn slot (MAX_BONUS_RESPAWNS bytes)

; ==================================================================
; AUXILIARY VARIABLES 
; ==================================================================
deterministic        EQU #E124   ; Deterministic mode flag

; ==================================================================
; TEMPORARY VARIABLES (ALWAYS NEEDED)
; ==================================================================
temp_word_1         EQU #E125   ; Temporary 16-bit storage
temp_word_2         EQU #E127   ; Temporary 16-bit storage
temp_byte_1         EQU #E129   ; Temporary 8-bit storage
temp_byte_2         EQU #E12A   ; Temporary 8-bit storage
temp_byte_3         EQU #E12B   ; Temporary 8-bit storage (32 bytes)
temp_byte_4         EQU #E14B   ; Temporary 8-bit storage (32 bytes)
temp_byte_5         EQU #E16B   ; Temporary 8-bit storage (32 bytes)
temp_byte_6         EQU #E18B   ; Temporary 8-bit storage (32 bytes)

; ==================================================================
; SOUND SYSTEM VARIABLES
; ==================================================================
sfx_active          EQU #E1AB   ; 0=no SFX active, 1=playing
sfx_timer           EQU #E1AC   ; Frames remaining for current SFX
sfx_fadeout         EQU #E1AD   ; Reserved fadeout flag/state
temp_byte_7         EQU #E1AE   ; Temporary 8-bit storage (32 bytes)
temp_byte_8         EQU #E1CE   ; Temporary 8-bit storage (32 bytes)
temp_byte_9         EQU #E1EE   ; Temporary 8-bit storage (32 bytes)
temp_byte_10        EQU #E20E   ; Temporary 8-bit storage (32 bytes)
temp_byte_11        EQU #E22E   ; Temporary 8-bit storage (32 bytes)
temp_byte_12        EQU #E24E   ; Temporary 8-bit storage (32 bytes)
temp_byte_13        EQU #E26E   ; Temporary 8-bit storage (32 bytes)
temp_byte_14        EQU #E28E   ; Temporary 8-bit storage (32 bytes)
temp_byte_15        EQU #E2AE   ; Temporary 8-bit storage (32 bytes)
temp_byte_16        EQU #E2CE   ; Temporary 8-bit storage (32 bytes)
temp_byte_17        EQU #E2EE   ; Temporary 8-bit storage (32 bytes)
temp_byte_18        EQU #E30E   ; Temporary 8-bit storage (32 bytes)
temp_byte_19        EQU #E32E   ; Temporary 8-bit storage (32 bytes)
temp_byte_20        EQU #E34E   ; Temporary 8-bit storage (32 bytes)
temp_byte_21        EQU #E36E   ; Temporary 8-bit storage (32 bytes)
temp_byte_22        EQU #E38E   ; Temporary 8-bit storage (32 bytes)
temp_byte_23        EQU #E3AE   ; Temporary 8-bit storage (32 bytes)
temp_byte_24        EQU #E3CE   ; Temporary 8-bit storage (32 bytes)
temp_byte_25        EQU #E3EE   ; Temporary 8-bit storage (32 bytes)
temp_word_3         EQU #E40E   ; Temporary 16-bit storage (64 bytes)
temp_word_4         EQU #E44E   ; Temporary 16-bit storage (64 bytes)
temp_byte_26        EQU #E48E   ; Temporary 8-bit storage (32 bytes)
temp_byte_27        EQU #E4AE   ; Temporary 8-bit storage (32 bytes)
temp_byte_28        EQU #E4CE   ; Temporary 8-bit storage (32 bytes)
temp_byte_29        EQU #E4EE   ; Temporary 8-bit storage (32 bytes)
temp_byte_30        EQU #E50E   ; Temporary 8-bit storage (32 bytes)
temp_byte_31        EQU #E52E   ; Temporary 8-bit storage (32 bytes)
temp_byte_32        EQU #E54E   ; Temporary 8-bit storage (32 bytes)
tileDead_dbg        EQU #E56E   ; Debug byte: current hero deadly contact
tileDead_latched_dbg EQU #E56F   ; Debug byte: latched hero deadly contact
tileDead_x_dbg      EQU #E570   ; Debug byte: last sampled deadly tile X
tileDead_y_dbg      EQU #E571   ; Debug byte: last sampled deadly tile Y
tileDead_value_dbg  EQU #E572   ; Debug byte: last raw deadly behavior value

; Wall collision temporary variables
wall_temp_x         EQU #E573   ; Cached entity X for wall checks
wall_temp_y         EQU #E574   ; Cached entity Y for wall checks
wall_hit_left       EQU #E575   ; Hitbox left edge cache
wall_hit_top        EQU #E576   ; Hitbox top edge cache
wall_hit_right      EQU #E577   ; Hitbox right edge cache
wall_hit_bottom     EQU #E578   ; Hitbox bottom edge cache
wall_hit_w          EQU #E579   ; Hitbox width cache (min 1)
wall_hit_h          EQU #E57A   ; Hitbox height cache (min 1)
wall_probe_left     EQU #E57B   ; X probe near hitbox left (adaptive inset)
wall_probe_right    EQU #E57C   ; X probe near hitbox right (adaptive inset)
wall_probe_top      EQU #E57D   ; Y probe near hitbox top (adaptive inset)
wall_probe_bottom   EQU #E57E   ; Y probe near hitbox bottom (adaptive inset)

; Unified update helpers
active_entity_list  EQU #E57F   ; Entity indices with non-zero component masks (MAX_ENTITIES bytes)
active_entity_count EQU #E59F   ; Number of entries in active_entity_list
hero_entity_id      EQU #E5A0   ; First current-screen entity flagged as player (#FF = none)
active_entity_list_dirty EQU #E5A1   ; 1=rebuild active_entity_list required
input_entity_list   EQU #E5A2   ; Active current-screen entities with Input component (MAX_ENTITIES bytes)
input_entity_count  EQU #E5C2   ; Number of entries in input_entity_list
render_entity_list  EQU #E5C3   ; Active current-screen entities with Sprite component (MAX_ENTITIES bytes)
render_entity_count EQU #E5E3   ; Number of entries in render_entity_list
collision_entity_list EQU #E5E4   ; Active current-screen entities with Collision component (MAX_ENTITIES bytes)
collision_entity_count EQU #E604   ; Number of entries in collision_entity_list
ground_entity_list  EQU #E605   ; Active current-screen entities with Collision or Gravity (MAX_ENTITIES bytes)
ground_entity_count EQU #E625   ; Number of entries in ground_entity_list
anim_entity_list    EQU #E626   ; Active current-screen entities with Animation+Sprite (MAX_ENTITIES bytes)
anim_entity_count   EQU #E646   ; Number of entries in anim_entity_list

; Entity-entity collision optimized variables
coll_list           EQU #E647   ; Active collidable entity indices (MAX_ENTITIES bytes)
coll_list_count     EQU #E667   ; Number of entities in coll_list
coll_src_left       EQU #E668   ; Source AABB left edge (scratch)
coll_src_right      EQU #E669   ; Source AABB right edge (scratch)
coll_src_top        EQU #E66A   ; Source AABB top edge (scratch)
coll_src_bottom     EQU #E66B   ; Source AABB bottom edge (scratch)

; ==================================================================
; INTERRUPT SYSTEM VARIABLES (dynamically allocated)
; ==================================================================
task_table              EQU #E66C   ; Task table base (8 slots x 2 bytes = 16 bytes)
task_0_ptr              EQU #E66C   ; Slot 0 pointer (2 bytes)
task_1_ptr              EQU #E66E   ; Slot 1 pointer (2 bytes)
task_2_ptr              EQU #E670   ; Slot 2 pointer (2 bytes)
task_3_ptr              EQU #E672   ; Slot 3 pointer (2 bytes)
task_4_ptr              EQU #E674   ; Slot 4 pointer (2 bytes)
task_5_ptr              EQU #E676   ; Slot 5 pointer (2 bytes)
task_6_ptr              EQU #E678   ; Slot 6 pointer (2 bytes)
task_7_ptr              EQU #E67A   ; Slot 7 pointer (2 bytes)
interrupt_system_enabled EQU #E67C   ; 0=disabled, 1=enabled (1 byte)
old_htimi_hook          EQU #E67D   ; Original H.TIMI hook (5 bytes)
interrupt_counter       EQU #E682   ; Frame counter (16-bit)
task_exec_time          EQU #E684   ; Cycles used by tasks (16-bit, debug)
vblank_flag             EQU #E686   ; Set to 1 on each VBlank (1 byte)
interrupt_in_progress   EQU #E687   ; 1 while the H.TIMI dispatcher is running
far_call_irq_lock_depth EQU #E688   ; Nonzero while far trampolines own an IRQ-masked mapper window
RAM_INTERRUPT_END       EQU #E689   ; End of interrupt system

; ==================================================================
; STATE MACHINE SOUND RUNTIME (one active sound asset)
; ==================================================================
sm_sound_active       EQU #E689   ; 0=idle, 1=playing state-machine sound asset
sm_sound_frames_left  EQU #E68A   ; Frames left for current state-machine sound asset
sm_sound_ptr_l        EQU #E68B   ; Next sound frame pointer low byte
sm_sound_ptr_h        EQU #E68C   ; Next sound frame pointer high byte

; ==================================================================
; TRACKER MUSIC RUNTIME
; ==================================================================
music_active         EQU #E68D   ; 0=stopped, 1=track active
music_muted          EQU #E68E   ; 0=audible, 1=muted/pause
music_loop           EQU #E68F   ; 0=no loop, 1=loop enabled
music_track_index    EQU #E690   ; Current ROM track index
music_row_frames     EQU #E691   ; Frames per tracker row
music_row_countdown  EQU #E692   ; Countdown to next row
music_order_pos      EQU #E693   ; Current order position
music_pattern_index  EQU #E694   ; Current pattern index
music_pattern_row    EQU #E695   ; Current row inside pattern
music_pattern_rows   EQU #E696   ; Cached rows in current pattern
music_track_ptr_l    EQU #E697   ; Current track pointer low byte
music_track_ptr_h    EQU #E698   ; Current track pointer high byte
music_pattern_ptr_l  EQU #E699   ; Current pattern rows pointer low byte
music_pattern_ptr_h  EQU #E69A   ; Current pattern rows pointer high byte
music_mixer_shadow   EQU #E69B   ; PSG mixer shadow for music runtime
music_pitch_note_work EQU #E69C   ; Scratch note index while resolving tone/ornament macros
music_pitch_step_work EQU #E69D   ; Scratch macro step while resolving tone/ornament macros
music_pitch_len_work  EQU #E69E   ; Scratch macro length while resolving tone/ornament macros
music_ch_note_base EQU #E69F   ; Current note index (255=silent) (3 bytes)
music_ch_a_note EQU #E69F   ; Channel A
music_ch_b_note EQU #E6A0   ; Channel B
music_ch_c_note EQU #E6A1   ; Channel C
music_ch_instrument_base EQU #E6A2   ; Current instrument id (0=none) (3 bytes)
music_ch_a_instrument EQU #E6A2   ; Channel A
music_ch_b_instrument EQU #E6A3   ; Channel B
music_ch_c_instrument EQU #E6A4   ; Channel C
music_ch_ornament_base EQU #E6A5   ; Current ornament id (0=none) (3 bytes)
music_ch_a_ornament EQU #E6A5   ; Channel A
music_ch_b_ornament EQU #E6A6   ; Channel B
music_ch_c_ornament EQU #E6A7   ; Channel C
music_ch_volume_base EQU #E6A8   ; Current base volume (0-15) (3 bytes)
music_ch_a_volume EQU #E6A8   ; Channel A
music_ch_b_volume EQU #E6A9   ; Channel B
music_ch_c_volume EQU #E6AA   ; Channel C
music_ch_vol_step_base EQU #E6AB   ; Reserved software volume envelope step (3 bytes)
music_ch_a_vol_step EQU #E6AB   ; Channel A
music_ch_b_vol_step EQU #E6AC   ; Channel B
music_ch_c_vol_step EQU #E6AD   ; Channel C
music_ch_tone_step_base EQU #E6AE   ; Reserved software tone envelope step (3 bytes)
music_ch_a_tone_step EQU #E6AE   ; Channel A
music_ch_b_tone_step EQU #E6AF   ; Channel B
music_ch_c_tone_step EQU #E6B0   ; Channel C
music_ch_noise_step_base EQU #E6B1   ; Reserved software noise envelope step (3 bytes)
music_ch_a_noise_step EQU #E6B1   ; Channel A
music_ch_b_noise_step EQU #E6B2   ; Channel B
music_ch_c_noise_step EQU #E6B3   ; Channel C
music_ch_orn_step_base EQU #E6B4   ; Reserved ornament step (3 bytes)
music_ch_a_orn_step EQU #E6B4   ; Channel A
music_ch_b_orn_step EQU #E6B5   ; Channel B
music_ch_c_orn_step EQU #E6B6   ; Channel C
music_ch_hw_env_step_base EQU #E6B7   ; Software hardware-envelope divider step (3 bytes)
music_ch_a_hw_env_step EQU #E6B7   ; Channel A
music_ch_b_hw_env_step EQU #E6B8   ; Channel B
music_ch_c_hw_env_step EQU #E6B9   ; Channel C

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
RAM_USAGE_END       EQU #E6BA   ; End of project variables (9914 bytes used)

; ==================================================================
; MEMORY LAYOUT INFO (Reference only - no code generated)
; ==================================================================
; RAM Layout:
;   #C000-#E6BA: Project variables (9914 bytes)
;   #E6BA-#E700: Alignment padding/free RAM (70 bytes)
;   #E700-#ECCF: Shared ZX0 scratch (1488 bytes, do not use for persistent vars)
;   #ECD0-#F37F: Free RAM after scratch (~1712 bytes available)
;   #F380-#FFFF: MSX System variables (DO NOT TOUCH)
;
; NOTE: Variables are defined using EQU (address labels only).
;       RAM space is used at runtime, NOT reserved in ROM.
;       Do NOT use ORG #C000 in cartridge ROMs!
; ==================================================================


; @mideas:block id=runtime.mapper.core kind=routine owner=mapper roots=mapper_runtime_init,mapper_set_bank_p1,mapper_set_bank_p2,mapper_set_bank_p3,mapper_set_bank_p4,mapper_push_p1,mapper_pop_p1,mapper_push_p2,mapper_pop_p2,mapper_push_p3,mapper_pop_p3,mapper_push_p4,mapper_pop_p4,mapper_call_hl_p1,mapper_call_hl_p2,mapper_call_hl_p3,mapper_call_hl_p4,mapper_call_hl_auto
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
; Preserves:
;   DE across mapper trampoline code. The target routine may still define
;   its own clobbers; callers must save any live registers required by GameFlow.
; ------------------------------------------------------------------
mapper_call_hl_p1:
    push hl
    push af
    call mapper_push_p1
    pop af
    call mapper_set_bank_p1
    pop hl
    push de
    ld de, .return_p1
    push de
    jp (hl)
.return_p1:
    call mapper_pop_p1
    pop de
    ret

mapper_call_hl_p2:
    push hl
    push af
    call mapper_push_p2
    pop af
    call mapper_set_bank_p2
    pop hl
    push de
    ld de, .return_p2
    push de
    jp (hl)
.return_p2:
    call mapper_pop_p2
    pop de
    ret

mapper_call_hl_p3:
    push hl
    push af
    call mapper_push_p3
    pop af
    call mapper_set_bank_p3
    pop hl
    push de
    ld de, .return_p3
    push de
    jp (hl)
.return_p3:
    call mapper_pop_p3
    pop de
    ret

mapper_call_hl_p4:
    jp mapper_call_hl_p3


; ------------------------------------------------------------------
; ------------------------------------------------------------------
; mapper_call_hl_fixed
; Direct call helper for Konami fixed window (#4000-#5FFF).
; Input:
;   HL = target routine address in fixed window
; Preserves: DE across mapper trampoline code
; ------------------------------------------------------------------
mapper_call_hl_fixed:
    push de
    ld de, .return_fixed
    push de
    jp (hl)
.return_fixed:
    pop de
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

; @mideas:endblock id=runtime.mapper.core


; ==================================================================
; GENERATED RESOURCE IDS
; Generated by MegaROM export backend.
; ==================================================================
RESOURCE_ID_INVALID EQU #FF

RESOURCE_ID_NEW_SPRITE_0_F0_LAYER1       EQU 0
RESOURCE_ID_SPRITE_PLACEHOLDER_PATTERN   EQU 1
RESOURCE_ID_SCREEN_PANTALLA1_0_LAYOUT    EQU 2
RESOURCE_ID_SCREEN_PANTALLA1_0_EFFECTS_LAYOUT EQU 3
RESOURCE_ID_SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE EQU 4
RESOURCE_ID_SCREEN_PANTALLA1_0_BOSS_TABLE EQU 5
RESOURCE_ID_BEHAVIOR_PANTALLA1_0_DATA    EQU 6
RESOURCE_ID_SCREEN_PANTALLA1_0_INTERACTION_TYPE_MAP EQU 7
RESOURCE_ID_SCREEN_PANTALLA1_0_INTERACTION_VALUE_MAP EQU 8
RESOURCE_ID_SCREEN_PANTALLA1_0_INTERACTION_TARGET_MAP EQU 9

; ==================================================================
; GENERATED RESOURCE TABLE
; Descriptor format: db bank / dw address / dw stored_size / dw raw_size / db flags
; Resource id is the zero-based descriptor index.
; Address is the mapper-window address visible after selecting bank.
; RESOURCE_FLAG_COMPRESSED_ZX0 means stored_size is compressed and raw_size is output size.
; ==================================================================
RESOURCE_TABLE_ENTRY_SIZE EQU 8
RESOURCE_FLAG_COMPRESSED_ZX0 EQU #01
RESOURCE_TABLE_COUNT EQU 10

resource_table:
    ; NEW_SPRITE_0_F0_LAYER1
    db 3
    dw #A024
    dw 25
    dw 32
    db 1
    ; SPRITE_PLACEHOLDER_PATTERN
    db 3
    dw #A03D
    dw 5
    dw 32
    db 1
    ; SCREEN_PANTALLA1_0_LAYOUT
    db 3
    dw #A000
    dw 6
    dw 768
    db 1
    ; SCREEN_PANTALLA1_0_EFFECTS_LAYOUT
    db 3
    dw #A006
    dw 6
    dw 768
    db 1
    ; SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE
    db 3
    dw #A042
    dw 1
    dw 1
    db 0
    ; SCREEN_PANTALLA1_0_BOSS_TABLE
    db 3
    dw #A043
    dw 1
    dw 1
    db 0
    ; BEHAVIOR_PANTALLA1_0_DATA
    db 3
    dw #A00C
    dw 6
    dw 768
    db 1
    ; SCREEN_PANTALLA1_0_INTERACTION_TYPE_MAP
    db 3
    dw #A012
    dw 6
    dw 768
    db 1
    ; SCREEN_PANTALLA1_0_INTERACTION_VALUE_MAP
    db 3
    dw #A018
    dw 6
    dw 768
    db 1
    ; SCREEN_PANTALLA1_0_INTERACTION_TARGET_MAP
    db 3
    dw #A01E
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

; @mideas:block id=runtime.resources.manager kind=routine owner=resources roots=resource_manager_init,resource_find_by_id,resource_copy_from_bank_to_ram,resource_decompress_from_bank_to_ram,resource_copy_from_bank_to_vram,resource_decompress_from_bank_to_vram,resource_dzx0_to_vram,resource_load_to_ram_by_id,resource_load_to_vram_by_id,resource_read_byte_from_bank
; ==================================================================
; RESOURCE MANAGER
; File: resource_manager.asm
; Description: Centralized banked resource lookup and copy helpers
; Descriptor format: db bank / dw address / dw stored_size / dw raw_size / db flags
; Resource id is the zero-based descriptor index.
; ==================================================================

resource_manager_init:
    xor a
    ld (far_call_irq_lock_depth), a
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
    ld a, (far_call_irq_lock_depth)
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
    ld a, (far_call_irq_lock_depth)
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
    nop
    ld a, d
    or #40
    out (#99), a
    nop
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
    ld a, (far_call_irq_lock_depth)
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
    ld a, (far_call_irq_lock_depth)
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
    nop
    ld a, d
    or #40
    out (#99), a
    nop
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
    nop
    nop
    nop
    ld a, h
    and #3F
    out (#99), a
    nop
    nop
    nop
    nop
    in a, (#98)
    ld b, a
    ld a, e
    out (#99), a
    nop
    nop
    ld a, d
    or #40
    out (#99), a
    nop
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
;   Loads the current screen layout directly into runtime_screen_layout.
;   No immutable background copy is kept when secret zones are not generated.
; Clobbers:
;   AF, BC, DE, HL
; ------------------------------------------------------------------
resource_load_screen_layout_cached:
    ld de, runtime_screen_layout
    call resource_load_to_ram_by_id
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
; @mideas:endblock id=runtime.resources.manager


; ==================================================================
; COMPONENT TRIGGER HELPERS - bank 0 resident copy
; Components call these routines directly. In MegaROM they must not live in a
; lower-page overlay such as GameFlow, because ASCII16 maps #4000-#7FFF as one
; 16 KB segment and the same CPU address can mean a different ROM page.
; ==================================================================

; ==================================================================
; COMPONENT ACTION TRIGGER HELPERS
; ==================================================================
; Register Contract:
;   Purpose: Test whether a component-configured input trigger was pressed on this frame.
;   Inputs:
;     - A = COMP_TRIGGER_* value
;   Outputs:
;     - A = 1 and NZ if pressed this frame, A = 0 and Z if not
;   Clobbers:
;     - AF
;   Preserved:
;     - BC
;     - DE
;     - HL
;   Notes:
;     - Uses edge detection against input_btn_prev or prev_input_state.

component_trigger_edge_pressed_a:
    cp COMP_TRIGGER_UP
    jp z, .trigger_check_up
    cp COMP_TRIGGER_ACTION2
    jp z, .trigger_check_action2

.trigger_check_fire:
    ld a, (input_btn_curr)
    and INPUT_BTN_FIRE
    jp z, .trigger_false
    ld a, (input_btn_prev)
    and INPUT_BTN_FIRE
    jp nz, .trigger_false
    jp .trigger_true

.trigger_check_action2:
    ld a, (input_btn_curr)
    and INPUT_BTN_GRAB
    jp z, .trigger_false
    ld a, (input_btn_prev)
    and INPUT_BTN_GRAB
    jp nz, .trigger_false
    jp .trigger_true

.trigger_check_up:
    ld a, (input_state)
    cp STICK_UP
    jp nz, .trigger_false
    ld a, (prev_input_state)
    cp STICK_UP
    jp z, .trigger_false

.trigger_true:
    ld a, 1
    or a
    ret

.trigger_false:
    xor a
    ret

; Register Contract:
;   Purpose: Test whether a component-configured input trigger is currently held.
;   Inputs:
;     - A = COMP_TRIGGER_* value
;   Outputs:
;     - A = 1 and NZ if held, A = 0 and Z if not
;   Clobbers:
;     - AF
;   Preserved:
;     - BC
;     - DE
;     - HL

; @mideas:block id=runtime.components.input_trigger_level kind=routine owner=components
component_trigger_level_pressed_a:
    cp COMP_TRIGGER_UP
    jp z, .trigger_level_check_up
    cp COMP_TRIGGER_ACTION2
    jp z, .trigger_level_check_action2

.trigger_level_check_fire:
    ld a, (input_btn_curr)
    and INPUT_BTN_FIRE
    jp z, .trigger_level_false
    jp .trigger_level_true

.trigger_level_check_action2:
    ld a, (input_btn_curr)
    and INPUT_BTN_GRAB
    jp z, .trigger_level_false
    jp .trigger_level_true

.trigger_level_check_up:
    ld a, (input_state)
    cp STICK_UP
    jp nz, .trigger_level_false

.trigger_level_true:
    ld a, 1
    or a
    ret

.trigger_level_false:
    xor a
    ret
; @mideas:endblock id=runtime.components.input_trigger_level



; ==================================================================
; PAGE-0 STUBS — labels required by header.asm, no-ops in megarom
; ==================================================================
; @mideas:block id=runtime.page0.stubs kind=routine owner=unified roots=init_page0_runtime_state,page0_map_expanded_slot,page0_map_game_rom,page0_restore_bios_rom,page0_copy_chunk_to_buffer,page0_decompress_to_ram,page0_copy_to_vram
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
; @mideas:endblock id=runtime.page0.stubs

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
    ld (interrupt_in_progress), a
    ld (far_call_irq_lock_depth), a

    ; --- STEP 5: Mark system as enabled ---
    ld a, 1
    ld (interrupt_system_enabled), a

    ei                          ; Re-enable interrupts
    ret

; @mideas:block id=runtime.interrupt.stop kind=routine owner=interrupt roots=stop_interrupt_system
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
; @mideas:endblock id=runtime.interrupt.stop

; @mideas:block id=runtime.interrupt.dispatcher kind=routine owner=interrupt preserve=true roots=interrupt_dispatcher
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

; @mideas:endblock id=runtime.interrupt.dispatcher
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
; @mideas:block id=runtime.interrupt.vblank_flag kind=routine owner=interrupt roots=update_vblank_flag
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
; @mideas:endblock id=runtime.interrupt.vblank_flag

; ==================================================================
; ENABLE_TASK - Activate a task in the system
; ==================================================================
; @mideas:block id=runtime.interrupt.task_api kind=routine owner=interrupt roots=enable_task,disable_task,get_frame_count
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
; @mideas:endblock id=runtime.interrupt.task_api

; ==================================================================
; INIT_DEFAULT_TASKS_FROM_PLAN - Register engine-selected IRQ tasks
; @mideas:block id=runtime.interrupt.task_input kind=routine owner=interrupt roots=task_update_input
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
;     - C = logical button bitmask after control remap
;     - D = physical button bitmask and keyboard direction flags
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
    ld d, 0                     ; D = physical button bitmask (bit0=button1, bit1=button2)
    xor a                       ; Joystick 0 button A -> physical button 1
    call FAST_GTTRIG            ; A = #FF if pressed, 0 if not
    or a
    jr z, .phys_btn1_keyboard
    set 0, d
.phys_btn1_keyboard:
    ld a, (input_key_button1_mode)
    or a
    jr nz, .phys_btn1_ctrl
    ld a, 8                    ; SPACE row
    call FAST_SNSMAT
    bit 0, a                   ; SPC (active low)
    jr nz, .phys_btn1_done
    set 0, d
    jr .phys_btn1_done
.phys_btn1_ctrl:
    ld a, 6                    ; CTRL row
    call FAST_SNSMAT
    bit 2, a                   ; CTRL (active low)
    jr nz, .phys_btn1_done
    set 0, d
.phys_btn1_done:
    ; Joystick button B or configured keyboard key -> physical button 2
    push bc
    push hl
    ld a, 3                    ; GTTRIG(3) = joystick 1 button B
    call GTTRIG
    ld e, a
    pop hl
    pop bc
    ld a, e
    or a
    jr z, .phys_btn2_keyboard
    set 1, d
.phys_btn2_keyboard:
    ld a, (input_key_button2_mode)
    or a
    jr nz, .phys_btn2_ctrl
    ld a, 4                    ; Keyboard row containing N
    call FAST_SNSMAT
    bit 3, a                   ; N key (active low)
    jr nz, .phys_btn2_done
    set 1, d
    jr .phys_btn2_done
.phys_btn2_ctrl:
    ld a, 6                    ; CTRL row
    call FAST_SNSMAT
    bit 2, a                   ; CTRL (active low)
    jr nz, .phys_btn2_done
    set 1, d
.phys_btn2_done:
    ld c, 0                    ; C = logical buttons after action remap
    ld a, (control_jump_button)
    or a
    jr nz, .jump_uses_btn2
    bit 0, d
    jr z, .jump_done
    set 0, c                   ; logical fire/jump
    jr .jump_done
.jump_uses_btn2:
    bit 1, d
    jr z, .jump_done
    set 0, c
.jump_done:
    ld a, (control_action_button)
    or a
    jr nz, .action_uses_btn2
    bit 0, d
    jr z, .action_done
    set 1, c                   ; logical action/grab
    jr .action_done
.action_uses_btn2:
    bit 1, d
    jr z, .action_done
    set 1, c
.action_done:
    ld a, c
    and INPUT_BTN_FIRE
    jr z, .fire_state_released
    ld a, 1
    jr .store_fire_state
.fire_state_released:
    xor a
.store_fire_state:
    ld (input_fire), a
    ld a, b
    ld (input_state), a
    ld a, c
    ld (input_btn_curr), a

    pop de
    pop bc
    pop af
    ret

; @mideas:endblock id=runtime.interrupt.task_input

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

init_font_system_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_4
    call mapper_set_bank_p1
    call init_font_system
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .init_font_system_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .init_font_system_far_irq_done
    ei
.init_font_system_far_irq_done:
    pop af
    ret

reload_font_system_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_4
    call mapper_set_bank_p1
    call reload_font_system
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .reload_font_system_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .reload_font_system_far_irq_done
    ei
.reload_font_system_far_irq_done:
    pop af
    ret

print_string_screen2_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_4
    call mapper_set_bank_p1
    call print_string_screen2
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .print_string_screen2_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .print_string_screen2_far_irq_done
    ei
.print_string_screen2_far_irq_done:
    pop af
    ret

; --- Far bank 5 [#6000, window P1] trampolines ---
FAR_BANK_5 EQU 5

trans_clear_column_far:
    ex af, af'
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_5
    call mapper_set_bank_p1
    ex af, af'
    call trans_clear_column
    ex af, af'
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .trans_clear_column_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .trans_clear_column_far_irq_done
    ei
.trans_clear_column_far_irq_done:
    ex af, af'
    ret

trans_clear_column_range_far:
    ex af, af'
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_5
    call mapper_set_bank_p1
    ex af, af'
    call trans_clear_column_range
    ex af, af'
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .trans_clear_column_range_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .trans_clear_column_range_far_irq_done
    ei
.trans_clear_column_range_far_irq_done:
    ex af, af'
    ret

trans_reveal_column_far:
    ex af, af'
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_5
    call mapper_set_bank_p1
    ex af, af'
    call trans_reveal_column
    ex af, af'
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .trans_reveal_column_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .trans_reveal_column_far_irq_done
    ei
.trans_reveal_column_far_irq_done:
    ex af, af'
    ret

trans_reveal_column_range_far:
    ex af, af'
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_5
    call mapper_set_bank_p1
    ex af, af'
    call trans_reveal_column_range
    ex af, af'
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .trans_reveal_column_range_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .trans_reveal_column_range_far_irq_done
    ei
.trans_reveal_column_range_far_irq_done:
    ex af, af'
    ret

trans_clear_row_direct_far:
    ex af, af'
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_5
    call mapper_set_bank_p1
    ex af, af'
    call trans_clear_row_direct
    ex af, af'
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .trans_clear_row_direct_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .trans_clear_row_direct_far_irq_done
    ei
.trans_clear_row_direct_far_irq_done:
    ex af, af'
    ret

trans_clear_row_range_far:
    ex af, af'
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_5
    call mapper_set_bank_p1
    ex af, af'
    call trans_clear_row_range
    ex af, af'
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .trans_clear_row_range_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .trans_clear_row_range_far_irq_done
    ei
.trans_clear_row_range_far_irq_done:
    ex af, af'
    ret

trans_reveal_row_direct_far:
    ex af, af'
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_5
    call mapper_set_bank_p1
    ex af, af'
    call trans_reveal_row_direct
    ex af, af'
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .trans_reveal_row_direct_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .trans_reveal_row_direct_far_irq_done
    ei
.trans_reveal_row_direct_far_irq_done:
    ex af, af'
    ret

trans_reveal_row_range_far:
    ex af, af'
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_5
    call mapper_set_bank_p1
    ex af, af'
    call trans_reveal_row_range
    ex af, af'
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .trans_reveal_row_range_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .trans_reveal_row_range_far_irq_done
    ei
.trans_reveal_row_range_far_irq_done:
    ex af, af'
    ret

trans_fast_filvrm_far:
    ex af, af'
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_5
    call mapper_set_bank_p1
    ex af, af'
    call trans_fast_filvrm
    ex af, af'
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .trans_fast_filvrm_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .trans_fast_filvrm_far_irq_done
    ei
.trans_fast_filvrm_far_irq_done:
    ex af, af'
    ret

textscroll_capture_font_patterns_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_5
    call mapper_set_bank_p1
    call textscroll_capture_font_patterns
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .textscroll_capture_font_patterns_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .textscroll_capture_font_patterns_far_irq_done
    ei
.textscroll_capture_font_patterns_far_irq_done:
    pop af
    ret

textscroll_prepare_pattern_masks_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_5
    call mapper_set_bank_p1
    call textscroll_prepare_pattern_masks
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .textscroll_prepare_pattern_masks_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .textscroll_prepare_pattern_masks_far_irq_done
    ei
.textscroll_prepare_pattern_masks_far_irq_done:
    pop af
    ret

textscroll_clear_name_table_spaces_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_5
    call mapper_set_bank_p1
    call textscroll_clear_name_table_spaces
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .textscroll_clear_name_table_spaces_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .textscroll_clear_name_table_spaces_far_irq_done
    ei
.textscroll_clear_name_table_spaces_far_irq_done:
    pop af
    ret

textscroll_render_name_frame_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_5
    call mapper_set_bank_p1
    call textscroll_render_name_frame
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .textscroll_render_name_frame_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .textscroll_render_name_frame_far_irq_done
    ei
.textscroll_render_name_frame_far_irq_done:
    pop af
    ret

textscroll_build_color_frame_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_5
    call mapper_set_bank_p1
    call textscroll_build_color_frame
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .textscroll_build_color_frame_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .textscroll_build_color_frame_far_irq_done
    ei
.textscroll_build_color_frame_far_irq_done:
    pop af
    ret

textscroll_copy_color_frame_all_banks_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_5
    call mapper_set_bank_p1
    call textscroll_copy_color_frame_all_banks
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .textscroll_copy_color_frame_all_banks_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .textscroll_copy_color_frame_all_banks_far_irq_done
    ei
.textscroll_copy_color_frame_all_banks_far_irq_done:
    pop af
    ret

textscroll2_capture_font_patterns_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_5
    call mapper_set_bank_p1
    call textscroll2_capture_font_patterns
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .textscroll2_capture_font_patterns_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .textscroll2_capture_font_patterns_far_irq_done
    ei
.textscroll2_capture_font_patterns_far_irq_done:
    pop af
    ret

textscroll2_init_name_table_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_5
    call mapper_set_bank_p1
    call textscroll2_init_name_table
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .textscroll2_init_name_table_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .textscroll2_init_name_table_far_irq_done
    ei
.textscroll2_init_name_table_far_irq_done:
    pop af
    ret

textscroll2_init_color_table_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_5
    call mapper_set_bank_p1
    call textscroll2_init_color_table
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .textscroll2_init_color_table_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .textscroll2_init_color_table_far_irq_done
    ei
.textscroll2_init_color_table_far_irq_done:
    pop af
    ret

textscroll2_clear_pattern_table_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_5
    call mapper_set_bank_p1
    call textscroll2_clear_pattern_table
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .textscroll2_clear_pattern_table_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .textscroll2_clear_pattern_table_far_irq_done
    ei
.textscroll2_clear_pattern_table_far_irq_done:
    pop af
    ret

textscroll2_shift_vram_up1_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_5
    call mapper_set_bank_p1
    call textscroll2_shift_vram_up1
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .textscroll2_shift_vram_up1_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .textscroll2_shift_vram_up1_far_irq_done
    ei
.textscroll2_shift_vram_up1_far_irq_done:
    pop af
    ret

gameflow_get_default_connection_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_5
    call mapper_set_bank_p1
    call gameflow_get_default_connection
    pop af
    call mapper_set_bank_p1
    push hl
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .gameflow_get_default_connection_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .gameflow_get_default_connection_far_irq_done
    ei
.gameflow_get_default_connection_far_irq_done:
    pop hl
    pop af
    ret

gameflow_read_confirm_direct_far:
    ex af, af'
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_5
    call mapper_set_bank_p1
    ex af, af'
    call gameflow_read_confirm_direct
    ex af, af'
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .gameflow_read_confirm_direct_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .gameflow_read_confirm_direct_far_irq_done
    ei
.gameflow_read_confirm_direct_far_irq_done:
    ex af, af'
    ret

; --- Far bank 6 [#6000, window P1] trampolines ---
FAR_BANK_6 EQU 6

init_entities_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_6
    call mapper_set_bank_p1
    call init_entities
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .init_entities_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .init_entities_far_irq_done
    ei
.init_entities_far_irq_done:
    pop af
    ret

update_entities_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_6
    call mapper_set_bank_p1
    call update_entities
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .update_entities_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .update_entities_far_irq_done
    ei
.update_entities_far_irq_done:
    pop af
    ret

; --- Far bank 7 [#6000, window P1] trampolines ---
FAR_BANK_7 EQU 7

; @mideas:block id=runtime.far_trampoline.init_sound_system_far kind=trampoline owner=far-call preserve=true
init_sound_system_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_7
    call mapper_set_bank_p1
    call init_sound_system
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .init_sound_system_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .init_sound_system_far_irq_done
    ei
.init_sound_system_far_irq_done:
    pop af
    ret
; @mideas:endblock id=runtime.far_trampoline.init_sound_system_far

; @mideas:block id=runtime.far_trampoline.task_audio_tick_far kind=trampoline owner=far-call preserve=true
task_audio_tick_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_7
    call mapper_set_bank_p1
    call task_audio_tick
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .task_audio_tick_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .task_audio_tick_far_irq_done
    ei
.task_audio_tick_far_irq_done:
    pop af
    ret
; @mideas:endblock id=runtime.far_trampoline.task_audio_tick_far

; @mideas:block id=runtime.far_trampoline.sfx_update_far kind=trampoline owner=far-call preserve=true
sfx_update_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_7
    call mapper_set_bank_p1
    call sfx_update
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .sfx_update_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .sfx_update_far_irq_done
    ei
.sfx_update_far_irq_done:
    pop af
    ret
; @mideas:endblock id=runtime.far_trampoline.sfx_update_far

; @mideas:block id=runtime.far_trampoline.music_update_far kind=trampoline owner=far-call preserve=true
music_update_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_7
    call mapper_set_bank_p1
    call music_update
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .music_update_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .music_update_far_irq_done
    ei
.music_update_far_irq_done:
    pop af
    ret
; @mideas:endblock id=runtime.far_trampoline.music_update_far

; @mideas:block id=runtime.far_trampoline.music_stop_far kind=trampoline owner=far-call preserve=true
music_stop_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_7
    call mapper_set_bank_p1
    call music_stop
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .music_stop_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .music_stop_far_irq_done
    ei
.music_stop_far_irq_done:
    pop af
    ret
; @mideas:endblock id=runtime.far_trampoline.music_stop_far

; @mideas:block id=runtime.far_trampoline.music_play_track_far kind=trampoline owner=far-call preserve=true
music_play_track_far:
    ex af, af'
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_7
    call mapper_set_bank_p1
    ex af, af'
    call music_play_track
    ex af, af'
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .music_play_track_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .music_play_track_far_irq_done
    ei
.music_play_track_far_irq_done:
    ex af, af'
    ret
; @mideas:endblock id=runtime.far_trampoline.music_play_track_far

; @mideas:block id=runtime.far_trampoline.music_execute_command_far kind=trampoline owner=far-call preserve=true
music_execute_command_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_7
    call mapper_set_bank_p1
    call music_execute_command
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .music_execute_command_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .music_execute_command_far_irq_done
    ei
.music_execute_command_far_irq_done:
    pop af
    ret
; @mideas:endblock id=runtime.far_trampoline.music_execute_command_far

; --- Far bank 8 [#6000, window P1] trampolines ---
FAR_BANK_8 EQU 8

load_screen_pantalla1_767095338721_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_8
    call mapper_set_bank_p1
    call load_screen_pantalla1_767095338721
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .load_screen_pantalla1_767095338721_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .load_screen_pantalla1_767095338721_far_irq_done
    ei
.load_screen_pantalla1_767095338721_far_irq_done:
    pop af
    ret

set_screen_colors_far:
    ex af, af'
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_8
    call mapper_set_bank_p1
    ex af, af'
    call set_screen_colors
    ex af, af'
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .set_screen_colors_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .set_screen_colors_far_irq_done
    ei
.set_screen_colors_far_irq_done:
    ex af, af'
    ret

init_char0_color_far:
    ex af, af'
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_8
    call mapper_set_bank_p1
    ex af, af'
    call init_char0_color
    ex af, af'
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .init_char0_color_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .init_char0_color_far_irq_done
    ei
.init_char0_color_far_irq_done:
    ex af, af'
    ret

; --- Far bank 9 [#6000, window P1] trampolines ---
FAR_BANK_9 EQU 9

init_sprites_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_9
    call mapper_set_bank_p1
    call init_sprites
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .init_sprites_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .init_sprites_far_irq_done
    ei
.init_sprites_far_irq_done:
    pop af
    ret

update_sprites_to_vram_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_9
    call mapper_set_bank_p1
    call update_sprites_to_vram
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .update_sprites_to_vram_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .update_sprites_to_vram_far_irq_done
    ei
.update_sprites_to_vram_far_irq_done:
    pop af
    ret

clear_all_sprites_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_9
    call mapper_set_bank_p1
    call clear_all_sprites
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .clear_all_sprites_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .clear_all_sprites_far_irq_done
    ei
.clear_all_sprites_far_irq_done:
    pop af
    ret

hide_sprite_far:
    ex af, af'
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_9
    call mapper_set_bank_p1
    ex af, af'
    call hide_sprite
    ex af, af'
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .hide_sprite_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .hide_sprite_far_irq_done
    ei
.hide_sprite_far_irq_done:
    ex af, af'
    ret

load_sprite_patterns_by_pack_id_far:
    ex af, af'
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_9
    call mapper_set_bank_p1
    ex af, af'
    call load_sprite_patterns_by_pack_id
    ex af, af'
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .load_sprite_patterns_by_pack_id_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .load_sprite_patterns_by_pack_id_far_irq_done
    ei
.load_sprite_patterns_by_pack_id_far_irq_done:
    ex af, af'
    ret

ensure_sprite_patterns_by_pack_id_far:
    ex af, af'
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_9
    call mapper_set_bank_p1
    ex af, af'
    call ensure_sprite_patterns_by_pack_id
    ex af, af'
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .ensure_sprite_patterns_by_pack_id_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .ensure_sprite_patterns_by_pack_id_far_irq_done
    ei
.ensure_sprite_patterns_by_pack_id_far_irq_done:
    ex af, af'
    ret

ensure_sprite_patterns_for_world_id_far:
    ex af, af'
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_9
    call mapper_set_bank_p1
    ex af, af'
    call ensure_sprite_patterns_for_world_id
    ex af, af'
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .ensure_sprite_patterns_for_world_id_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .ensure_sprite_patterns_for_world_id_far_irq_done
    ei
.ensure_sprite_patterns_for_world_id_far_irq_done:
    ex af, af'
    ret

; --- Far bank 10 [#6000, window P1] trampolines ---
FAR_BANK_10 EQU 10

init_animated_tiles_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_10
    call mapper_set_bank_p1
    call init_animated_tiles
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .init_animated_tiles_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .init_animated_tiles_far_irq_done
    ei
.init_animated_tiles_far_irq_done:
    pop af
    ret

update_animated_tiles_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_10
    call mapper_set_bank_p1
    call update_animated_tiles
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .update_animated_tiles_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .update_animated_tiles_far_irq_done
    ei
.update_animated_tiles_far_irq_done:
    pop af
    ret

update_animated_tiles_vram_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_10
    call mapper_set_bank_p1
    call update_animated_tiles_vram
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .update_animated_tiles_vram_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .update_animated_tiles_vram_far_irq_done
    ei
.update_animated_tiles_vram_far_irq_done:
    pop af
    ret

; --- Far bank 11 [#6000, window P1] trampolines ---
FAR_BANK_11 EQU 11

; --- Far bank 12 [#6000, window P1] trampolines ---
FAR_BANK_12 EQU 12

load_world_default_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_12
    call mapper_set_bank_p1
    call load_world_default
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .load_world_default_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .load_world_default_far_irq_done
    ei
.load_world_default_far_irq_done:
    pop af
    ret

check_world_screen_transition_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_12
    call mapper_set_bank_p1
    call check_world_screen_transition
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .check_world_screen_transition_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .check_world_screen_transition_far_irq_done
    ei
.check_world_screen_transition_far_irq_done:
    pop af
    ret

load_world_worldmap_1767095499385_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_12
    call mapper_set_bank_p1
    call load_world_worldmap_1767095499385
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .load_world_worldmap_1767095499385_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .load_world_worldmap_1767095499385_far_irq_done
    ei
.load_world_worldmap_1767095499385_far_irq_done:
    pop af
    ret

; --- Far bank 13 [#6000, window P1] trampolines ---
FAR_BANK_13 EQU 13

show_presentation_screen_image_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_13
    call mapper_set_bank_p1
    call show_presentation_screen_image
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .show_presentation_screen_image_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .show_presentation_screen_image_far_irq_done
    ei
.show_presentation_screen_image_far_irq_done:
    pop af
    ret

show_presentation_screen_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_13
    call mapper_set_bank_p1
    call show_presentation_screen
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .show_presentation_screen_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .show_presentation_screen_far_irq_done
    ei
.show_presentation_screen_far_irq_done:
    pop af
    ret

; --- Far bank 14 [#6000, window P1] trampolines ---
FAR_BANK_14 EQU 14

; @mideas:block id=runtime.far_trampoline.init_boss_system_far kind=trampoline owner=far-call preserve=true
init_boss_system_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_14
    call mapper_set_bank_p1
    call init_boss_system
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .init_boss_system_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .init_boss_system_far_irq_done
    ei
.init_boss_system_far_irq_done:
    pop af
    ret
; @mideas:endblock id=runtime.far_trampoline.init_boss_system_far

; @mideas:block id=runtime.far_trampoline.init_screen_boss_from_current_screen_far kind=trampoline owner=far-call preserve=true
init_screen_boss_from_current_screen_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_14
    call mapper_set_bank_p1
    call init_screen_boss_from_current_screen
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .init_screen_boss_from_current_screen_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .init_screen_boss_from_current_screen_far_irq_done
    ei
.init_screen_boss_from_current_screen_far_irq_done:
    pop af
    ret
; @mideas:endblock id=runtime.far_trampoline.init_screen_boss_from_current_screen_far

; @mideas:block id=runtime.far_trampoline.update_boss_system_far kind=trampoline owner=far-call preserve=true
update_boss_system_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_14
    call mapper_set_bank_p1
    call update_boss_system
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .update_boss_system_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .update_boss_system_far_irq_done
    ei
.update_boss_system_far_irq_done:
    pop af
    ret
; @mideas:endblock id=runtime.far_trampoline.update_boss_system_far

; --- Far bank 15 [#6000, window P1] trampolines ---
FAR_BANK_15 EQU 15

render_hud_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_15
    call mapper_set_bank_p1
    call render_hud
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .render_hud_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .render_hud_far_irq_done
    ei
.render_hud_far_irq_done:
    pop af
    ret

force_render_hud_far:
    push af
    di
    ld hl, far_call_irq_lock_depth
    inc (hl)
    ld a, (mapper_bank_p1_current)
    push af
    ld a, FAR_BANK_15
    call mapper_set_bank_p1
    call force_render_hud
    pop af
    call mapper_set_bank_p1
    ld hl, far_call_irq_lock_depth
    dec (hl)
    ld a, (interrupt_in_progress)
    or a
    jp nz, .force_render_hud_far_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .force_render_hud_far_irq_done
    ei
.force_render_hud_far_irq_done:
    pop af
    ret

; --- Far bank 16 [#6000, window P1] trampolines ---
FAR_BANK_16 EQU 16

; --- Far bank 17 [#6000, window P1] trampolines ---
FAR_BANK_17 EQU 17

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

; @mideas:block id=runtime.sound.resident.init kind=routine owner=sound
call_init_sound_system_resident:
    jp init_sound_system_far
; @mideas:endblock id=runtime.sound.resident.init

; @mideas:block id=runtime.sound.resident.tick kind=routine owner=sound
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
    pop hl
    pop de
    pop bc
    pop af
    ret
; @mideas:endblock id=runtime.sound.resident.tick

; @mideas:block id=runtime.sound.resident.music_update kind=routine owner=sound
call_music_update_resident:
    jp music_update_far
; @mideas:endblock id=runtime.sound.resident.music_update

; @mideas:block id=runtime.sound.resident.sfx_update kind=routine owner=sound
call_sfx_update_resident:
    jp sfx_update_far
; @mideas:endblock id=runtime.sound.resident.sfx_update

; @mideas:block id=runtime.sound.resident.music_stop kind=routine owner=sound
call_music_stop_resident:
    jp music_stop_far
; @mideas:endblock id=runtime.sound.resident.music_stop

; @mideas:block id=runtime.sound.resident.music_play_track kind=routine owner=sound
call_music_play_track_resident:
    jp music_play_track_far
; @mideas:endblock id=runtime.sound.resident.music_play_track

; @mideas:block id=runtime.sound.resident.music_execute_command kind=routine owner=sound
call_music_execute_command_resident:
    jp music_execute_command_far
; @mideas:endblock id=runtime.sound.resident.music_execute_command

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

call_init_statemachine_system_resident:
    jp init_statemachine_system

call_update_statemachine_system_resident:
    jp resident_noop

call_execute_all_state_machines_resident:
    jp execute_all_state_machines

call_SM_ExecuteActions_resident:
    jp resident_noop

call_SM_UpdateSound_resident:
    jp resident_noop

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
    ld bc, 128
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

; @mideas:block id=runtime.boss.resident.init kind=routine owner=bosses preserve=true roots=call_init_boss_system_resident
call_init_boss_system_resident:
    jp init_boss_system_far
; @mideas:endblock id=runtime.boss.resident.init

; @mideas:block id=runtime.boss.resident.init_screen kind=routine owner=bosses preserve=true roots=call_init_screen_boss_from_current_screen_resident
call_init_screen_boss_from_current_screen_resident:
    jp init_screen_boss_from_current_screen_far
; @mideas:endblock id=runtime.boss.resident.init_screen

; @mideas:block id=runtime.boss.resident.update kind=routine owner=bosses preserve=true roots=call_update_boss_system_resident
call_update_boss_system_resident:
    jp update_boss_system_far
; @mideas:endblock id=runtime.boss.resident.update

; @mideas:block id=runtime.boss.resident.update_projectile kind=routine owner=bosses preserve=true roots=call_update_boss_projectile_runtime_resident
call_update_boss_projectile_runtime_resident:
    jp resident_noop
; @mideas:endblock id=runtime.boss.resident.update_projectile

; @mideas:block id=runtime.boss.resident.draw_attack kind=routine owner=bosses preserve=true roots=call_draw_boss_attack_resident
call_draw_boss_attack_resident:
    jp resident_noop
; @mideas:endblock id=runtime.boss.resident.draw_attack

; @mideas:block id=runtime.boss.resident.draw_meteor kind=routine owner=bosses preserve=true roots=call_draw_boss_meteor_attack_resident
call_draw_boss_meteor_attack_resident:
    jp resident_noop
; @mideas:endblock id=runtime.boss.resident.draw_meteor

; @mideas:block id=runtime.boss.resident.draw_bomb kind=routine owner=bosses preserve=true roots=call_draw_boss_bomb_attack_resident
call_draw_boss_bomb_attack_resident:
    jp resident_noop
; @mideas:endblock id=runtime.boss.resident.draw_bomb

; @mideas:block id=runtime.boss.resident.draw_boomerang kind=routine owner=bosses preserve=true roots=call_draw_boss_boomerang_attack_resident
call_draw_boss_boomerang_attack_resident:
    jp resident_noop
; @mideas:endblock id=runtime.boss.resident.draw_boomerang

; @mideas:block id=runtime.boss.resident.draw_rock kind=routine owner=bosses preserve=true roots=call_draw_boss_rock_attack_resident
call_draw_boss_rock_attack_resident:
    jp resident_noop
; @mideas:endblock id=runtime.boss.resident.draw_rock

; @mideas:block id=runtime.boss.resident.draw_laser kind=routine owner=bosses preserve=true roots=call_draw_boss_laser_attack_resident
call_draw_boss_laser_attack_resident:
    jp resident_noop
; @mideas:endblock id=runtime.boss.resident.draw_laser

; @mideas:block id=runtime.boss.resident.draw_sine_wave kind=routine owner=bosses preserve=true roots=call_draw_boss_sine_wave_attack_resident
call_draw_boss_sine_wave_attack_resident:
    jp resident_noop
; @mideas:endblock id=runtime.boss.resident.draw_sine_wave

; @mideas:block id=runtime.boss.resident.draw_homing_missile kind=routine owner=bosses preserve=true roots=call_draw_boss_homing_missile_attack_resident
call_draw_boss_homing_missile_attack_resident:
    jp resident_noop
; @mideas:endblock id=runtime.boss.resident.draw_homing_missile

call_load_colors_to_vram_resident:
    jp resident_noop

call_update_entities_resident:
    jp update_entities_far

call_init_components_resident:
    call init_components
    ret


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


call_sync_player_runtime_from_entity_resident:
    call mapper_push_p1
    ld a, 1
    call mapper_set_bank_p1
    call sync_player_runtime_from_entity
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
; Calls routines in statically-mapped primary banks (1-2) via CALL.
; Routines in far banks are called via _far trampolines above.
; ==================================================================
init_game_systems:
    ld a, (gameflow_reveal_world_after_load)
    or a
    jr nz, .igs_skip_disscr
    call DISSCR               ; Disable screen while loading VRAM assets
.igs_skip_disscr:
    ; Cold boot / restart must not trust cached VRAM state from RAM contents.
    xor a
    ld (vram_cache_tile_patterns_ready), a
    ld (vram_cache_tile_colors_ready), a
    ld (vram_cache_font_ready), a
    ld a, #FF
    ld (current_screen2_tilebank_id), a
    ; Initialize component systems (entities detected)
    call init_components

    ; No tiles detected - skipping pattern/color loading

    ; Initialize animated tile runtime (safe no-op if no animated groups)
    call init_animated_tiles_far
    ; No boss runtime - skip boss initialization


    ; Initialize game entities with real positions from JSON
    call init_entities_far

    ; Load the first game screen
    call load_game_screen
    call rebuild_used_entity_list

    ; Initialize font system
    call init_font_system_far
    ld a, (gameflow_reveal_world_after_load)
    or a
    jr nz, .igs_skip_enascr
    call ENASCR               ; Re-enable screen after VRAM updates
.igs_skip_enascr:
    ret

load_game_screen:
    ret

; --- End of Bank 0 — pad to 8KB boundary ---
BANK_0_USED_END:
    ds #6000 - $, #FF

; ##################################################################
; BANK 1 — [#6000h-#8000h] PRIMARY: components
; (Always mapped at boot: bank1→P1, bank2→P2)
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
;   Active entities: 1
;   Used components: Position, Sprite
;   Dynamic platform riding: STUB
;   Filtered out: 26 unused component systems
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

COMP_TRIGGER_FIRE    EQU 0 ; input_btn bit 0 / SPACE / joystick A
COMP_TRIGGER_ACTION2 EQU 1 ; input_btn bit 1 / second action / joystick B
COMP_TRIGGER_UP      EQU 2 ; direction edge on STICK_UP

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
entity_jump_trigger EQU temp_byte_29; Trigger action for jump (32 bytes)
entity_on_ground    EQU temp_byte_5; Ground contact flag(bit 0 = on ground)(32 bytes)

    ; Gravity Component Data
entity_gravity_vel  EQU temp_word_4; Accumulated gravity velocity(signed word, 64 bytes)

    ; Health Component Data
entity_health_current EQU temp_byte_6 ; Current health/lives (32 bytes)
entity_health_max     EQU temp_byte_7 ; Maximum health/lives (32 bytes)

; Deadly Tile Collision Data
entity_flag_deadly_tile EQU temp_byte_8 ; Flag: bit 0 = touching deadly tile (32 bytes)
entity_deadly_collision EQU temp_byte_8 ; Backward-compatible alias
entity_flag_in_water EQU temp_byte_31 ; Flag: bit 0 = entity center is inside a Water effect zone (32 bytes)
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
entity_shoot_trigger    EQU temp_byte_30 ; Trigger action for shooting (32 bytes)
entity_mirror_flags     EQU temp_byte_32 ; Mirror flags: bit0 enabled, bit1 invert facing (32 bytes)

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

        ; @mideas:block id=runtime.components.init kind=routine owner=components preserve=false roots=init_components,component_fill_32_a
BOX_STATE_ENTITY EQU 0
BOX_STATE_CARRIED EQU 1
BOX_STATE_DROPPED_TILE EQU 2

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
    ; Used: Position, Sprite 
 
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

    ; Initialize carry/box runtime flags even when the Carry system is filtered out.
        ld a, 255
        ld hl, entity_carried_by
        call component_fill_32_a
        ld hl, entity_carry_held
        call component_fill_32_a
        ld hl, entity_carry_base_sprite
        call component_fill_32_a

        xor a
        ld hl, entity_box_state
        call component_fill_32_a
        ld hl, entity_box_tile_x
        call component_fill_32_a
        ld hl, entity_box_tile_y
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
        ; Initialize animation state defaults (also needed by sprite rendering frame selection)
    call init_animation_system
        ; Initialize platform riding system
    call init_platform_riding_system
    
    ret
; @mideas:endblock id=runtime.components.init

; @mideas:block id=runtime.components.position kind=routine owner=components preserve=false roots=component-position

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
    jr nz, .position_has_velocity_source
    ; Mirror can invert X velocity generated by StateMachine/AI even if the
    ; template does not carry Movement/Input explicitly.
    push hl
    ld e, c
    ld d, 0
    ld hl, entity_mirror_flags
    add hl, de
    ld a, (hl)
    and #01
    pop hl
    jr z, position_next_entity ; Skip velocity if no movement/input/mirror source
.position_has_velocity_source:

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
; @mideas:endblock id=runtime.components.position
; @mideas:block id=runtime.components.sprite kind=routine owner=components preserve=false roots=component-sprite

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

    ; A dropped box is already part of the tilemap; do not render its sprite.
    ld hl, entity_box_state
    add hl, de
    ld a, (hl)
    cp BOX_STATE_DROPPED_TILE
    jp z, sprite_next_entity

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
; @mideas:endblock id=runtime.components.sprite

    ; Movement system filtered out(not used)
init_movement_system:
    ret

; @mideas:block id=runtime.components.movement_stub kind=routine owner=components
update_movement_component:
    ret
; @mideas:endblock id=runtime.components.movement_stub
    
    ; Collision system filtered out(not used)
init_collision_system:
    ret

update_collision_component:
    ret
    ; @mideas:block id=runtime.components.behavior_tile kind=routine owner=components preserve=false roots=get_behavior_tile,get_behavior_tile_nb,gbt_oob

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
; @mideas:endblock id=runtime.components.behavior_tile
; @mideas:block id=runtime.components.directional_sprite_sync kind=routine owner=components preserve=false roots=component_sync_directional_sprite_from_initial,component_sync_directional_sprite_from_current,component_sync_directional_sprite_common

; ------------------------------------------------------------------
; component_sync_directional_sprite_from_initial/current
; Shared resident helper for local directional sprite variant sync.
; Input: DE = active entity index.
; Output: entity_sprite_asset_index may be replaced and animation reset.
; Clobbers internally: AF, BC, HL. Preserves: AF, BC, DE, HL.
; ------------------------------------------------------------------
component_sync_directional_sprite_from_initial:
    push af
    push bc
    push de
    push hl
    ld bc, entity_sprite_asset_index_init
    jp component_sync_directional_sprite_common

component_sync_directional_sprite_from_current:
    push af
    push bc
    push de
    push hl
    ld bc, entity_sprite_asset_index

component_sync_directional_sprite_common:
    ld hl, entity_facing_dir
    add hl, de
    ld a, (hl)
    or a
    jp z, .csds_done
    cp 1
    jp z, .csds_left
    cp 2
    jp z, .csds_right
    cp 3
    jp z, .csds_up
    cp 4
    jp z, .csds_down
    jp .csds_done

.csds_left:
    ld hl, sprite_dir_left_table
    jp .csds_lookup
.csds_right:
    ld hl, sprite_dir_right_table
    jp .csds_lookup
.csds_up:
    ld hl, sprite_dir_up_table
    jp .csds_lookup
.csds_down:
    ld hl, sprite_dir_down_table

.csds_lookup:
    push hl
    ld h, b
    ld l, c
    add hl, de
    ld a, (hl)
    pop hl
    cp #FF
    jp z, .csds_done
    cp SPRITE_ASSET_COUNT
    jp nc, .csds_done
    ld c, a
    ld b, 0
    add hl, bc
    ld a, (hl)

    ld hl, entity_sprite_asset_index
    add hl, de
    cp (hl)
    jp z, .csds_done
    ld (hl), a
    ld hl, entity_anim_frame
    add hl, de
    ld (hl), 0
    ld hl, entity_anim_tick
    add hl, de
    ld (hl), 0

.csds_done:
    pop hl
    pop de
    pop bc
    pop af
    ret
; @mideas:endblock id=runtime.components.directional_sprite_sync

    ; Input system filtered out(not used)
init_input_system:
    ret

update_input_component:
    ret
    
    ; Behavior system filtered out(not used)
init_behavior_system:
    ret

; @mideas:block id=runtime.components.behavior_stub kind=routine owner=components
update_behavior_component:
    ret
; @mideas:endblock id=runtime.components.behavior_stub
    
    ; Health system filtered out(not used)
init_health_system:
    ret

update_health_component:
    ret
    
    ; Animation system filtered out(not used)
init_animation_system:
    ret

update_animation_component:
    ret

refresh_player_animation_fastpath:
    ret
    
    ; Jump system filtered out(not used)
init_jump_system:
    ret

update_jump_component:
    ret
    
    ; Gravity system filtered out(not used)
init_gravity_system:
    ret

update_gravity_component:
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
; @mideas:block id=runtime.components.walljump_stub kind=routine owner=components
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
; @mideas:endblock id=runtime.components.walljump_stub
    
    ; AutoDestroy system filtered out(not used)
; @mideas:block id=runtime.components.auto_destroy_stub kind=routine owner=components
init_auto_destroy_system:
    ret

update_auto_destroy_component:
    ret
; @mideas:endblock id=runtime.components.auto_destroy_stub
    
    ; Cursors system filtered out(not used)
init_cursors_system:
    ret

update_cursors_component:
    ret
    
    ; StateMachine system filtered out(not used)
; @mideas:block id=runtime.components.state_machine_component_stub kind=routine owner=components
init_statemachine_system:
    ret

update_statemachine_component:
    ret
; @mideas:endblock id=runtime.components.state_machine_component_stub
    
    ; RetractableGate system filtered out(not used)
init_retractable_gate_system:
    ret

; @mideas:block id=runtime.components.retractable_gate_stub kind=routine owner=components
update_retractable_gate_component:
    ret
; @mideas:endblock id=runtime.components.retractable_gate_stub
    
    ; Carry system filtered out(not used)
init_carry_system:
    ret

; @mideas:block id=runtime.components.carry_stub kind=routine owner=components
update_carry_component:
    ret
; @mideas:endblock id=runtime.components.carry_stub

; [AUTOCONTROL SCRIPT / DIALOGUE SYSTEM moved to components_tail resident module]

; Damage system filtered out(not used)
init_damage_system:
    ret

; @mideas:block id=runtime.components.damage_stub kind=routine owner=components
update_damage_component:
    ret
; @mideas:endblock id=runtime.components.damage_stub
    
    ; Shoot system filtered out(not used)
init_shoot_system:
    ret

; @mideas:block id=runtime.components.shoot_stub kind=routine owner=components
update_shoot_component:
    ret
; @mideas:endblock id=runtime.components.shoot_stub
    
    ; ==================================================================
    ; PLATFORM RIDING SYSTEM (STUB)
    ; ==================================================================

init_platform_riding_system:
    ; Keep jump/ground checks deterministic even when dynamic platforms are absent.
    ld hl, entity_platform_id
    ld de, entity_platform_id + 1
    ld bc, 31
    ld (hl), 255
    ldir
    ld hl, entity_platform_grace
    ld de, entity_platform_grace + 1
    ld bc, 31
    ld (hl), 0
    ldir
    ret

; @mideas:block id=runtime.components.platform_riding_stub kind=routine owner=components
prepare_platform_detection:
    ret

update_platform_riding:
    ret
; @mideas:endblock id=runtime.components.platform_riding_stub
    
    ; WallCollision system filtered out(not used)
init_wallcollision_system:
    ret

update_wallcollision_component:
    ret
    
    ; DeadlyTiles system filtered out(not used)
init_deadly_tiles_system:
    ret

update_deadly_tiles_component:
    ret

refresh_player_deadly_fastpath:
    ret
    
    ; InWater system filtered out(not used)
init_in_water_system:
    ret

; @mideas:block id=runtime.components.in_water_stub kind=routine owner=components
update_in_water_component:
    ret
; @mideas:endblock id=runtime.components.in_water_stub
    
    ; Collectible system filtered out(not used)
init_collectible_system:
    ret

; @mideas:block id=runtime.components.collectible_stub kind=routine owner=components
update_collectible_component:
    ret
; @mideas:endblock id=runtime.components.collectible_stub
    
    ; Tile interaction system filtered out(no interactable tiles or no input)
init_tile_interaction_system:
    ret

update_slash_component:
    ret

check_tile_interaction:
    ret

refresh_player_tile_interaction_fastpath:
    ret

; Stub: apply_collected_tiles (no interactable tiles in project)
apply_collected_tiles:
    ret
    
    ; Mirror system filtered out(not used)
init_mirror_system:
    ret

; @mideas:block id=runtime.components.mirror_stub kind=routine owner=components
update_mirror_component:
    ret
; @mideas:endblock id=runtime.components.mirror_stub
    ; @mideas:block id=runtime.components.entity_management kind=routine owner=components preserve=false roots=create_entity,entity_job_set,entity_job_should_run_c,force_update_entity_sprite

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
; @mideas:endblock id=runtime.components.entity_management
; @mideas:block id=runtime.components.scheduler kind=routine owner=components preserve=false roots=update_all_entities

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
    call update_position_component      ; 7. Apply velocity
    call update_sprite_component        ; 13. Sprite rendering
    call call_sync_player_runtime_from_entity_resident
    ret
.update_all_entities_fake_player:
    call update_position_component      ; 7. Apply velocity
    call update_sprite_component        ; 13. Sprite rendering
    ret
; Total player systems called: 2 (optimized from 16)
; Total fake-player systems called: 2 (screen engine optimized)


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
    call call_sync_player_runtime_from_entity_resident
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

; [PLAYER FASTPATH / STATE MACHINE EXECUTOR moved to components_tail resident module]


; --- End of Bank 1 — pad to 8KB boundary ---
BANK_1_USED_END:
    ds #8000 - $, #FF

; ##################################################################
; BANK 2 — [#8000h-#A000h] PRIMARY: components_tail, gameflow
; (Always mapped at boot: bank1→P1, bank2→P2)
; ##################################################################
    org #8000

; ==================================================================
; COMPONENTS RESIDENT TAIL
; Split from components.asm so the always-mapped P1 component core stays
; within one 8KB Konami/ASCII8 bank while tail routines run from P2.
; ==================================================================
    ; AutoControlScript system filtered out(no active scripts)
init_auto_control_script_system:
    ret

; @mideas:block id=runtime.components.auto_control_script_stubs kind=routine owner=components
update_auto_control_script_component:
    ret

update_auto_event_string_component:
    ret
; @mideas:endblock id=runtime.components.auto_control_script_stubs


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
    ld hl, entity_dash_cfg_enabled
    add hl, de
    ld a, (hl)
    or a
    jp nz, .pfd_dash_enabled
    xor a
    ld (player_dash_timer), a
    ld (player_dash_cooldown), a
    ret
.pfd_dash_enabled:
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
    jp nz, .player_fast_sync_sm_sprite_facing
    push de
    ld e, c
    ld d, 0

            ; Apply directional sprite variants from entity_facing_dir locally.
            ; Register contract: input DE = active entity index; preserves AF, BC, DE, HL.
            ; This must not call update_entity_patrol_facing because MegaROM lower
            ; page segments cannot safely call each other by raw address in ASCII16.
            ; Use the spawn sprite so plain auto-facing matches patrol/entity defaults.
            call component_sync_directional_sprite_from_initial
    
    pop de
    jp .player_fast_skip_patrol_facing
.player_fast_sync_sm_sprite_facing:
    push de
    ld e, c
    ld d, 0

            ; Apply directional sprite variants from entity_facing_dir locally.
            ; Register contract: input DE = active entity index; preserves AF, BC, DE, HL.
            ; This must not call update_entity_patrol_facing because MegaROM lower
            ; page segments cannot safely call each other by raw address in ASCII16.
            ; Use the active sprite so StateMachine-owned animations keep their state.
            call component_sync_directional_sprite_from_current
    
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

    ld hl, entity_jump_trigger
    add hl, de
    ld a, (hl)
    call component_trigger_edge_pressed_a
    jp z, .player_fast_after_jump

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
    call call_sync_player_runtime_from_entity_resident
    ret
; @mideas:endblock id=runtime.components.scheduler

; ==================================================================
; EXECUTE ALL STATE MACHINES - Called by GameFlow
; ==================================================================
; No state machines are present in this build.
; @mideas:block id=runtime.components.state_machine_executor kind=routine owner=components roots=execute_all_state_machines,refresh_player_state_machine_fastpath
execute_all_state_machines:
    ret

refresh_player_state_machine_fastpath:
    ret
; @mideas:endblock id=runtime.components.state_machine_executor


; ==================================================================
; TILE COLLISION SYSTEM
; ==================================================================
; Legacy compatibility labels. Current WallCollision and TileInteraction
; use get_behavior_tile directly, so keep this path compact in resident ROM.
; ==================================================================

; @mideas:block id=runtime.components.legacy_tile_collision kind=routine owner=components
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
; @mideas:endblock id=runtime.components.legacy_tile_collision


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


; @mideas:block id=runtime.components.secret_zone_stub kind=routine owner=components
update_secret_zone_component:
    ret
; @mideas:endblock id=runtime.components.secret_zone_stub


    ; ==================================================================
; END OF COMPONENT SYSTEMS
    ; ==================================================================
        

; ==================================================================
; GAMEFLOW EXECUTION ENGINE
; File: gameflow.asm
; Description: GameFlow-based game orchestration system
; ==================================================================
;
; GameFlow: Main
; Total Nodes: 2
; Total Connections: 1
; Start Node: start
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
    ld (gameflow_deferred_game_init), a
    ld (gameflow_reveal_world_after_load), a
    ret

; Main entry point - called from init_rom
; This is where the game STARTS
gameflow_start:
    ; Load the Start node
    ld hl, gameflow_node_start
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
    cp NODE_TYPE_TEXT_SCROLL
    jp z, gameflow_handle_textscroll
    
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
    call gameflow_get_default_connection_far
    ld a, h
    or l
    ret z           ; No connection
    jp gameflow_execute_node

gameflow_handle_textscroll:
    ; Galious-style pixel text scroll.
    ; DE = text scroll data pointer
    ; BC = connection table
    push bc
    call show_textscroll2_screen
    pop bc

    call gameflow_get_default_connection_far
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

TEXTSCROLL_FONT_FIRST EQU 32
TEXTSCROLL_FONT_COUNT EQU 64
TEXTSCROLL_FONT_BYTES EQU #0200
TEXTSCROLL_FONT_SRC EQU page0_transfer_buffer
TEXTSCROLL_FRAME_BUF EQU page0_transfer_buffer + TEXTSCROLL_FONT_BYTES

; ------------------------------------------------------------------
; show_textscroll_screen
; Data format:
;   db background_color
;   db stripe_color
;   db speed_frames_per_pixel
;   db line_count
;   repeated line_count times: db centered_col, dw string_ptr
; ------------------------------------------------------------------
show_textscroll_screen:
    ex de, hl
    ld a, (hl)
    ld (gameflow_textscroll_bg_color), a
    inc hl
    ld a, (hl)
    ld (gameflow_textscroll_stripe_color), a
    inc hl
    ld a, (hl)
    or a
    jr nz, .ts2_speed_ok
    inc a
.ts2_speed_ok:
    ld (gameflow_textscroll_speed), a
    inc hl
    ld a, (hl)
    ld (gameflow_textscroll_line_count), a
    inc hl
    ld (gameflow_textscroll_line_table_ptr), hl

    call DISSCR
    ld a, (gameflow_textscroll_bg_color)
    ld b, a
    call call_set_screen_colors_resident
    ld a, (gameflow_textscroll_bg_color)
    call call_init_char0_color_resident
    call call_reload_font_system_resident
    call textscroll_capture_font_patterns_far
    call textscroll_prepare_pattern_masks_far
    call textscroll_clear_name_table_spaces_far
    xor a
    ld (gameflow_textscroll_fine), a
    call textscroll_build_color_frame_far
    call textscroll_copy_color_frame_all_banks_far
    call ENASCR

    xor a
    ld (gameflow_textscroll_step), a
.scroll_loop:
    ld a, (gameflow_textscroll_line_count)
    add a, 24
    ld b, a
    ld a, (gameflow_textscroll_step)
    cp b
    jr nc, .scroll_done

    call textscroll_render_name_frame_far
    xor a
    ld (gameflow_textscroll_fine), a
.fine_loop:
    call textscroll_build_color_frame_far
    call textscroll_copy_color_frame_all_banks_far
    call textscroll_wait_speed
    ld hl, gameflow_textscroll_fine
    inc (hl)
    ld a, (hl)
    cp 8
    jr c, .fine_loop

    ld hl, gameflow_textscroll_step
    inc (hl)
    jr .scroll_loop

.scroll_done:
    call call_reload_font_system_resident
    ret

; ------------------------------------------------------------------
; Capture current font glyphs 32..95 from the first pattern bank.
; DI/EI protects the VDP address latch while the interrupt task manager is
; active, otherwise the mask may be built from corrupted scanlines.
; ------------------------------------------------------------------
; [TextScroll VRAM/color helpers moved to gameflow_aux far module]
textscroll_wait_speed:
    ld a, (gameflow_textscroll_speed)
    or a
    ret z
    ld b, a
.wait_loop:
    halt
    push bc
    pop bc
    djnz .wait_loop
    ret

gameflow_handle_textscroll2:
    ; SCREEN 2 pattern-table pixel text scroll.
    ; DE = text scroll data pointer
    ; BC = connection table
    push bc
    call show_textscroll2_screen
    pop bc

    call gameflow_get_default_connection_far
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

TEXTSCROLL2_FONT_FIRST EQU 32
TEXTSCROLL2_FONT_COUNT EQU 64
TEXTSCROLL2_FONT_BYTES EQU #0200
TEXTSCROLL2_FONT_SRC EQU page0_transfer_buffer
TEXTSCROLL2_PATTERN_BYTES EQU #1800

; ------------------------------------------------------------------
; show_textscroll2_screen
; Data format:
;   db background_color
;   db stripe_color
;   db speed_frames_per_pixel
;   db line_count
;   dw fixed_32_byte_text_lines
; Text lines are exactly 32 bytes each and end with a line whose first
; byte is #FF. This follows the classic pattern-table scroll model, but
; uses Mideas SCREEN 2 VRAM constants instead of reserving a 6144-byte
; RAM mirror.
; ------------------------------------------------------------------
show_textscroll2_screen:
    ex de, hl
    ld a, (hl)
    ld (gameflow_textscroll2_bg_color), a
    inc hl
    ld a, (hl)
    ld (gameflow_textscroll2_stripe_color), a
    inc hl
    ld a, (hl)
    or a
    jr nz, .speed_ok
    inc a
.speed_ok:
    ld (gameflow_textscroll2_speed), a
    inc hl
    ld a, (hl)
    ld (gameflow_textscroll2_line_count), a
    inc hl
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld (gameflow_textscroll2_text_ptr), de

    ld a, (gameflow_textscroll2_line_count)
    add a, 24
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    ld (gameflow_textscroll2_steps_left), hl

    call DISSCR
    ld a, (gameflow_textscroll2_bg_color)
    and #0F
    ld (BAKCLR), a
    ld (BDRCLR), a
    call CHGCLR
    call call_reload_font_system_resident
    call textscroll2_capture_font_patterns_far
    call textscroll2_init_name_table_far
    call textscroll2_init_color_table_far
    call textscroll2_clear_pattern_table_far
    xor a
    ld (gameflow_textscroll2_text_pix), a
    call ENASCR

.ts2_scroll_loop:
    ld hl, (gameflow_textscroll2_steps_left)
    ld a, h
    or l
    jr z, .ts2_scroll_done
    call textscroll2_shift_vram_up1_far
    call textscroll2_wait_speed
    ld hl, (gameflow_textscroll2_steps_left)
    dec hl
    ld (gameflow_textscroll2_steps_left), hl
    jr .ts2_scroll_loop

.ts2_scroll_done:
    call call_reload_font_system_resident
    ret

; [TextScroll2 pattern-scroll helpers moved to gameflow_aux far module]
textscroll2_wait_speed:
    ld a, (gameflow_textscroll2_speed)
    or a
    ret z
    ld b, a
.ts2_wait_loop:
    halt
    push bc
    pop bc
    djnz .ts2_wait_loop
    ret

gameflow_handle_transition:
    ; Transition node - visual screen wipe/fade effect
    ; DE = transition data pointer (db effect_id, frames_per_step, fill_char)
    ; BC = connection table
    push bc
    ; Presentation/background screens can overwrite all SCREEN 2 chars.
    ; Reinstall reserved char #FE immediately before the transition wipe.
    ld a, 1
    call call_init_char0_color_resident
    call execute_transition_effect
    pop bc                        ; Restore connection table after transition clobbers BC
    call gameflow_get_default_connection_far
    ld a, h
    or l
    ret z
    ld a, (hl)                    ; Next node type
    cp NODE_TYPE_TRANSITION
    jp z, gameflow_execute_node   ; Chain transitions without an intermediate VRAM restore/clear
    cp NODE_TYPE_WORLD_LINK
    jr nz, .gft_next_not_worldlink
    ld a, 1
    ld (gameflow_reveal_world_after_load), a
.gft_next_not_worldlink:
    push hl                       ; Preserve next node while restoring VRAM
    ld a, (gameflow_deferred_game_init)
    or a
    jr z, .gft_restore_shared_vram
    xor a
    ld (gameflow_deferred_game_init), a
    call init_game_systems
    jr .gft_restore_done
.gft_restore_shared_vram:
    ; Restore VRAM after transition:
    ; 1. Invalidate all shared gameplay/font VRAM caches. A transition may
    ;    follow presentation/dialog screens that used different CHRTBL/CLRTBL
    ;    contents, so the next WorldLink must reload its tilebank patterns.
    call resource_invalidate_gameplay_vram_cache
    ; 2. Tile colors (chars 128+) - may belong to the previous screen.
    call call_load_colors_to_vram_resident
    ; 3. Font patterns + colors (chars 0-127) - may belong to the previous screen.
    ;    init_font_system reloads both pattern bytes and color attributes for all
    ;    font characters.  If no font is used in the project this is a no-op (ret).
    call call_init_font_system_resident
.gft_restore_done:
    pop hl                        ; Restore next node
    jp gameflow_execute_node

; ==================================================================
; execute_transition_effect
; Execute visual screen transition by clearing the Name Table
; in different patterns. Name-table wipe effects write the node-selected
; transition_fill_char: #FE outline square or #FF SPC blank.
; Target is Name Table (#1800-#1AFF, 768 bytes = 32x24 tiles).
;
; Input:  DE = Transition data pointer
;         (DE) = effect id: 0=cls, 1=dissolve_pixels, 2=dissolve_chars,
;                           3=vertical_lines, 4=horizontal_lines,
;                           5=spiral, 6=fill_white_squares,
;                           7=diagonal_clear, 8=diagonal_inverse,
;                           9=checkerboard, 10=doors, 11=center_curtain,
;                           12=venetian_blinds, 13=radial_wipe,
;                           14=block4_shuffle, 15=zoom_box
;         (DE+1) = frames per step
;         (DE+2) = fill char (#FE box or #FF SPC)
; Destroys: AF, BC, DE, HL
; ==================================================================
execute_transition_effect:
    ld a, (de)                    ; A = effect id (0-15)
    ld (transition_effect_id), a
    inc de
    push af                       ; Save effect id
    ld a, (de)                    ; A = frames per step (from node data)
    inc de
    ld (transition_delay_var), a  ; Store for trans_wait_frames
    ld a, (de)                    ; A = fill char (#FE box or #FF SPC)
    cp #FF
    jr z, .ete_store_fill_char
    ld a, #FE                     ; Default/guard: transition box char
.ete_store_fill_char:
    ld (transition_fill_char), a
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
    dec a
    jp z, .trans_diagonal_clear
    dec a
    jp z, .trans_diagonal_inverse
    dec a
    jp z, .trans_checkerboard
    dec a
    jp z, .trans_doors
    dec a
    jp z, .trans_center_curtain
    dec a
    jp z, .trans_venetian_blinds
    dec a
    jp z, .trans_radial_wipe
    dec a
    jp z, .trans_block4_shuffle
    dec a
    jp z, .trans_zoom_box
    ret                           ; Unknown id - do nothing

; ------------------------------------------------------------------
; EFFECT 0: CLS - Instant clear + hold black for configured duration
; ------------------------------------------------------------------
.trans_cls:
    ld hl, #1800
    ld bc, 768
    ld a, (transition_fill_char)
    call trans_fast_filvrm_far
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
    call trans_clear_column_far       ; col D
    ld a, d
    add a, 8
    call trans_clear_column_far       ; col D+8
    ld a, d
    add a, 16
    call trans_clear_column_far       ; col D+16
    ld a, d
    add a, 24
    call trans_clear_column_far       ; col D+24
    call trans_wait_frames        ; timed delay between passes
    inc d
    ld a, d
    cp 8
    jr c, .tdp_loop
    ret

; ------------------------------------------------------------------
; EFFECT 2: DISSOLVE_CHARS - Name-table row interleaved dissolve (8 passes)
; Pass D clears tile rows D, D+8, D+16. Only the Name Table is touched.
; ------------------------------------------------------------------
.trans_dissolve_chars:
    ld d, 0                       ; D = pass counter (0-7)
.tdc_loop:
    ld a, d
    call trans_clear_row_direct_far    ; row D
    ld a, d
    add a, 8
    call trans_clear_row_direct_far    ; row D+8
    ld a, d
    add a, 16
    call trans_clear_row_direct_far    ; row D+16
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
    call trans_clear_column_far       ; clear col C
    inc c
    ld a, c
    call trans_clear_column_far       ; clear col C+1
    inc c
    call trans_wait_frames
    ld a, c
    cp 32
    jr c, .tvl_loop
    ret

; ------------------------------------------------------------------
; EFFECT 4: HORIZONTAL_LINES - Top-to-bottom Name Table raster
; ------------------------------------------------------------------
.trans_horizontal_lines:
    ld c, 0                       ; C = tile row (0-23)
.thl_loop:
    ld a, c
    call trans_clear_row_direct_far    ; clear one 32-char row in the Name Table
    call trans_wait_frames
    inc c
    ld a, c
    cp 24
    jp c, .thl_loop
    ret

; ------------------------------------------------------------------
; EFFECT 5: SPIRAL - Name-table rectangular rings from outside to inside.
; Clears only 8x8 character cells in the Name Table.
; ------------------------------------------------------------------
.trans_spiral:
    ld b, 0                       ; B = ring index (0..11)
.tsp_loop:
    ; Clear top and bottom row segments for this ring.
    ld a, b
    add a, a
    ld e, a                       ; E = ring * 2
    ld a, 32
    sub e
    ld e, a                       ; E = row segment width
    ld d, b                       ; D = start column
    ld a, b                       ; A = top row
    call trans_clear_row_range_far
    ld a, 23
    sub b                         ; A = bottom row
    call trans_clear_row_range_far

    ; Clear left and right column segments between those two rows.
    ld a, b
    add a, a
    ld d, a
    ld a, 22
    sub d                         ; A = side segment height
    jr z, .tsp_after_sides
    ld d, a                       ; D = row count
    ld a, b
    inc a
    ld c, a                       ; C = start row
    ld a, b                       ; A = left column
    call trans_clear_column_range_far
    ld a, 31
    sub b                         ; A = right column
    call trans_clear_column_range_far
.tsp_after_sides:
    call trans_wait_frames
    inc b
    ld a, b
    cp 12
    jr c, .tsp_loop
    ret

; ------------------------------------------------------------------
; EFFECT 6: FILL_WHITE_SQUARES - 4-column stripe wipe (8 cols/frame)
; ------------------------------------------------------------------
.trans_fill_white_squares:
    ld c, 0                       ; C = current column (step 8)
.tws_loop:
    ld a, c
    call trans_clear_column_far
    ld a, c
    inc a
    call trans_clear_column_far
    ld a, c
    add a, 2
    call trans_clear_column_far
    ld a, c
    add a, 3
    call trans_clear_column_far
    ld a, c
    add a, 4
    call trans_clear_column_far
    ld a, c
    add a, 5
    call trans_clear_column_far
    ld a, c
    add a, 6
    call trans_clear_column_far
    ld a, c
    add a, 7
    call trans_clear_column_far
    ld a, c
    add a, 8
    ld c, a
    call trans_wait_frames
    ld a, c
    cp 32
    jr c, .tws_loop
    ret

; ------------------------------------------------------------------
; EFFECT 7: DIAGONAL_CLEAR - Name-table raster wipe.
; Writes char #FE in diagonal order: (0,0), (1,0)/(0,1), ...
; The update routine clears one name-table char and returns Carry set
; when the full 32x24 table is complete. The effect runs several
; updates per frame so the configured duration remains practical.
; ------------------------------------------------------------------
.trans_diagonal_clear:
    call trans_diag_clear_init
.tdiag_frame_loop:
    ld b, 16                      ; one visible batch per frame
.tdiag_batch_loop:
    push bc
    call trans_diag_clear_update
    pop bc
    jr c, .tdiag_done
    djnz .tdiag_batch_loop
    call trans_wait_frames
    jr .tdiag_frame_loop
.tdiag_done:
    ret

; ------------------------------------------------------------------
; EFFECT 8: DIAGONAL_INVERSE - Name-table raster wipe, opposite slope.
; Writes transition_fill_char in diagonal order: (31,0), (30,0)/(31,1), ...
; ------------------------------------------------------------------
.trans_diagonal_inverse:
    call trans_diag_inverse_init
.tdiagi_frame_loop:
    ld b, 16                      ; one visible batch per frame
.tdiagi_batch_loop:
    push bc
    call trans_diag_inverse_clear_update
    pop bc
    jr c, .tdiagi_done
    djnz .tdiagi_batch_loop
    call trans_wait_frames
    jr .tdiagi_frame_loop
.tdiagi_done:
    ret

; ------------------------------------------------------------------
; EFFECT 9: CHECKERBOARD - Two-pass 32x24 Name Table damero wipe.
; ------------------------------------------------------------------
.trans_checkerboard:
    xor a
    call trans_clear_checkerboard_pass
    call trans_wait_frames
    ld a, 1
    call trans_clear_checkerboard_pass
    call trans_wait_frames
    ret

; ------------------------------------------------------------------
; EFFECT 10: DOORS - Side panels close towards the center.
; ------------------------------------------------------------------
.trans_doors:
    ld c, 0
.tdoor_loop:
    ld a, c
    call trans_clear_column_far       ; left panel column
    ld a, 31
    sub c
    call trans_clear_column_far       ; right panel column
    call trans_wait_frames
    inc c
    ld a, c
    cp 16
    jr c, .tdoor_loop
    ret

; ------------------------------------------------------------------
; EFFECT 11: CENTER_CURTAIN - Columns close from center to edges.
; ------------------------------------------------------------------
.trans_center_curtain:
    ld c, 0
.tccurt_loop:
    ld a, 15
    sub c
    call trans_clear_column_far       ; center-left outward
    ld a, 16
    add a, c
    call trans_clear_column_far       ; center-right outward
    call trans_wait_frames
    inc c
    ld a, c
    cp 16
    jr c, .tccurt_loop
    ret

; ------------------------------------------------------------------
; EFFECT 12: VENETIAN_BLINDS - Alternating even/odd tile rows.
; ------------------------------------------------------------------
.trans_venetian_blinds:
    ld c, 0
.tvb_even_loop:
    ld a, c
    call trans_clear_row_direct_far
    inc c
    inc c
    ld a, c
    cp 24
    jr c, .tvb_even_loop
    call trans_wait_frames
    ld c, 1
.tvb_odd_loop:
    ld a, c
    call trans_clear_row_direct_far
    inc c
    inc c
    ld a, c
    cp 24
    jr c, .tvb_odd_loop
    call trans_wait_frames
    ret

; ------------------------------------------------------------------
; EFFECT 13: RADIAL_WIPE - Approximate circular wipe from outside in.
; ------------------------------------------------------------------
.trans_radial_wipe:
    ld d, 26                      ; max Manhattan distance from center 2x2
.trw_loop:
    ld a, d
    call trans_clear_manhattan_pass
    call trans_wait_frames
    ld a, d
    or a
    jr z, .trw_done
    dec d
    jr .trw_loop
.trw_done:
    ret

; ------------------------------------------------------------------
; EFFECT 14: BLOCK4_SHUFFLE - Fixed pseudo-random 4x3 block wipe.
; ------------------------------------------------------------------
.trans_block4_shuffle:
    ld c, 0
.tb4_loop:
    ld a, c
    call trans_clear_block4_order
    call trans_wait_frames
    inc c
    ld a, c
    cp 64
    jr c, .tb4_loop
    ret

; ------------------------------------------------------------------
; EFFECT 15: ZOOM_BOX - 2-cell rectangular bands from outside to inside.
; ------------------------------------------------------------------
.trans_zoom_box:
    ld c, 0
.tzb_loop:
    ld a, c
    call trans_clear_zoom_band
    call trans_wait_frames
    ld a, c
    add a, 2
    ld c, a
    cp 12
    jr c, .tzb_loop
    ret

; ==================================================================
; execute_transition_reveal_target
; Reveal the freshly loaded WorldLink screen from runtime_screen_layout.
; The screen loader has already loaded patterns/colors and rebuilt the
; runtime layout, but skipped the final Name Table copy while the previous
; Transition cover was visible.
;
; Input:  runtime_screen_layout = destination 32x24 Name Table data
;         transition_effect_id / transition_delay_var from prior Transition
; Destroys: AF, BC, DE, HL
; ==================================================================
execute_transition_reveal_target:
    ld a, (transition_effect_id)
    or a
    jp z, .trt_full
    dec a
    jp z, .trt_dissolve_columns
    dec a
    jp z, .trt_horizontal_lines
    dec a
    jp z, .trt_vertical_lines
    dec a
    jp z, .trt_horizontal_lines
    dec a
    jp z, .trt_full
    dec a
    jp z, .trt_stripe_columns
    dec a
    jp z, .trt_diagonal
    dec a
    jp z, .trt_diagonal_inverse
    dec a
    jp z, .trt_checkerboard
    dec a
    jp z, .trt_doors
    dec a
    jp z, .trt_center_curtain
    dec a
    jp z, .trt_venetian_blinds
    dec a
    jp z, .trt_radial_wipe
    dec a
    jp z, .trt_block4_shuffle
    dec a
    jp z, .trt_zoom_box
    jp .trt_full

.trt_full:
    ld hl, runtime_screen_layout
    ld de, #1800
    ld bc, 768
    call FAST_LDIRVM
    call trans_wait_frames
    ret

.trt_dissolve_columns:
    ld d, 0
.trtc_loop:
    ld a, d
    call trans_reveal_column_far
    ld a, d
    add a, 8
    call trans_reveal_column_far
    ld a, d
    add a, 16
    call trans_reveal_column_far
    ld a, d
    add a, 24
    call trans_reveal_column_far
    call trans_wait_frames
    inc d
    ld a, d
    cp 8
    jr c, .trtc_loop
    ret

.trt_vertical_lines:
    ld c, 0
.trtv_loop:
    ld a, c
    call trans_reveal_column_far
    inc c
    ld a, c
    call trans_reveal_column_far
    inc c
    call trans_wait_frames
    ld a, c
    cp 32
    jr c, .trtv_loop
    ret

.trt_horizontal_lines:
    ld c, 0
.trth_loop:
    ld a, c
    call trans_reveal_row_direct_far
    call trans_wait_frames
    inc c
    ld a, c
    cp 24
    jp c, .trth_loop
    ret

.trt_stripe_columns:
    ld c, 0
.trts_loop:
    ld a, c
    call trans_reveal_column_far
    ld a, c
    inc a
    call trans_reveal_column_far
    ld a, c
    add a, 2
    call trans_reveal_column_far
    ld a, c
    add a, 3
    call trans_reveal_column_far
    ld a, c
    add a, 4
    call trans_reveal_column_far
    ld a, c
    add a, 5
    call trans_reveal_column_far
    ld a, c
    add a, 6
    call trans_reveal_column_far
    ld a, c
    add a, 7
    call trans_reveal_column_far
    ld a, c
    add a, 8
    ld c, a
    call trans_wait_frames
    ld a, c
    cp 32
    jr c, .trts_loop
    ret

.trt_diagonal:
    call trans_diag_clear_init
.trtd_frame_loop:
    ld b, 16
.trtd_batch_loop:
    push bc
    call trans_diag_reveal_update
    pop bc
    jr c, .trtd_done
    djnz .trtd_batch_loop
    call trans_wait_frames
    jr .trtd_frame_loop
.trtd_done:
    ret

.trt_diagonal_inverse:
    call trans_diag_inverse_init
.trtdi_frame_loop:
    ld b, 16
.trtdi_batch_loop:
    push bc
    call trans_diag_inverse_reveal_update
    pop bc
    jr c, .trtdi_done
    djnz .trtdi_batch_loop
    call trans_wait_frames
    jr .trtdi_frame_loop
.trtdi_done:
    ret

.trt_checkerboard:
    xor a
    call trans_reveal_checkerboard_pass
    call trans_wait_frames
    ld a, 1
    call trans_reveal_checkerboard_pass
    call trans_wait_frames
    ret

.trt_doors:
    ld c, 0
.trtdoor_loop:
    ld a, 15
    sub c
    call trans_reveal_column_far      ; open from center-left
    ld a, 16
    add a, c
    call trans_reveal_column_far      ; open from center-right
    call trans_wait_frames
    inc c
    ld a, c
    cp 16
    jr c, .trtdoor_loop
    ret

.trt_center_curtain:
    ld c, 0
.trtcurt_loop:
    ld a, c
    call trans_reveal_column_far      ; reveal left edge inward
    ld a, 31
    sub c
    call trans_reveal_column_far      ; reveal right edge inward
    call trans_wait_frames
    inc c
    ld a, c
    cp 16
    jr c, .trtcurt_loop
    ret

.trt_venetian_blinds:
    ld c, 0
.trtvb_even_loop:
    ld a, c
    call trans_reveal_row_direct_far
    inc c
    inc c
    ld a, c
    cp 24
    jr c, .trtvb_even_loop
    call trans_wait_frames
    ld c, 1
.trtvb_odd_loop:
    ld a, c
    call trans_reveal_row_direct_far
    inc c
    inc c
    ld a, c
    cp 24
    jr c, .trtvb_odd_loop
    call trans_wait_frames
    ret

.trt_radial_wipe:
    ld d, 0
.trtrw_loop:
    ld a, d
    call trans_reveal_manhattan_pass
    call trans_wait_frames
    inc d
    ld a, d
    cp 27
    jr c, .trtrw_loop
    ret

.trt_block4_shuffle:
    ld c, 0
.trtb4_loop:
    ld a, c
    call trans_reveal_block4_order
    call trans_wait_frames
    inc c
    ld a, c
    cp 64
    jr c, .trtb4_loop
    ret

.trt_zoom_box:
    ld c, 10
.trtzb_loop:
    ld a, c
    call trans_reveal_zoom_band
    call trans_wait_frames
    ld a, c
    or a
    jr z, .trtzb_done
    sub 2
    ld c, a
    jr .trtzb_loop
.trtzb_done:
    ret

; ------------------------------------------------------------------
; trans_diag_clear_init
; Initializes the diagonal clear runtime state in RAM.
; Output: Carry clear.
; Destroys: AF, DE, HL
; ------------------------------------------------------------------
trans_diag_clear_init:
    xor a
    ld (transition_diag_done), a
    ld (transition_diag_index), a
    call trans_diag_clear_setup_diagonal
    or a
    ret

; ------------------------------------------------------------------
; trans_diag_inverse_init
; Initializes inverse diagonal clear/reveal runtime state in RAM.
; Output: Carry clear.
; Destroys: AF, DE, HL
; ------------------------------------------------------------------
trans_diag_inverse_init:
    xor a
    ld (transition_diag_done), a
    ld (transition_diag_index), a
    call trans_diag_inverse_setup_diagonal
    or a
    ret

; ------------------------------------------------------------------
; trans_diag_clear_update
; Clears one char in the name table.
; Output: Carry clear while active, Carry set when complete.
; Destroys: AF, DE, HL
; ------------------------------------------------------------------
trans_diag_clear_update:
    ld a, (transition_diag_done)
    or a
    jr z, .tdcu_do_one
    scf
    ret

.tdcu_do_one:
    ld hl, (transition_diag_addr)
    ld a, (transition_fill_char)
    call trans_diag_vdp_write_byte

    ld de, 31                     ; next char in diagonal: +32 row, -1 col
    add hl, de
    ld (transition_diag_addr), hl

    ld hl, transition_diag_len
    dec (hl)
    jr nz, .tdcu_active_ret

    ld hl, transition_diag_index
    inc (hl)
    ld a, (hl)
    cp 55                         ; diagonals 0..54
    jr c, .tdcu_new_diagonal

    ld a, 1
    ld (transition_diag_done), a
    scf
    ret

.tdcu_new_diagonal:
    call trans_diag_clear_setup_diagonal

.tdcu_active_ret:
    or a
    ret

; ------------------------------------------------------------------
; trans_diag_reveal_update
; Reveals one char from runtime_screen_layout in the diagonal order.
; Output: Carry clear while active, Carry set when complete.
; Destroys: AF, DE, HL
; ------------------------------------------------------------------
trans_diag_reveal_update:
    ld a, (transition_diag_done)
    or a
    jr z, .tdru_do_one
    scf
    ret

.tdru_do_one:
    ld hl, (transition_diag_addr)
    push hl
    or a
    ld de, #1800
    sbc hl, de                    ; HL = name-table offset
    ld de, runtime_screen_layout
    add hl, de
    ld a, (hl)
    pop hl
    call trans_diag_vdp_write_byte

    ld de, 31                     ; next char in diagonal: +32 row, -1 col
    add hl, de
    ld (transition_diag_addr), hl

    ld hl, transition_diag_len
    dec (hl)
    jr nz, .tdru_active_ret

    ld hl, transition_diag_index
    inc (hl)
    ld a, (hl)
    cp 55                         ; diagonals 0..54
    jr c, .tdru_new_diagonal

    ld a, 1
    ld (transition_diag_done), a
    scf
    ret

.tdru_new_diagonal:
    call trans_diag_clear_setup_diagonal

.tdru_active_ret:
    or a
    ret

; ------------------------------------------------------------------
; trans_diag_inverse_clear_update
; Clears one char in the name table using opposite-slope diagonals.
; Output: Carry clear while active, Carry set when complete.
; Destroys: AF, DE, HL
; ------------------------------------------------------------------
trans_diag_inverse_clear_update:
    ld a, (transition_diag_done)
    or a
    jr z, .tdicu_do_one
    scf
    ret

.tdicu_do_one:
    ld hl, (transition_diag_addr)
    ld a, (transition_fill_char)
    call trans_diag_vdp_write_byte

    ld de, 33                     ; next char: +32 row, +1 col
    add hl, de
    ld (transition_diag_addr), hl

    ld hl, transition_diag_len
    dec (hl)
    jr nz, .tdicu_active_ret

    ld hl, transition_diag_index
    inc (hl)
    ld a, (hl)
    cp 55                         ; diagonals 0..54
    jr c, .tdicu_new_diagonal

    ld a, 1
    ld (transition_diag_done), a
    scf
    ret

.tdicu_new_diagonal:
    call trans_diag_inverse_setup_diagonal

.tdicu_active_ret:
    or a
    ret

; ------------------------------------------------------------------
; trans_diag_inverse_reveal_update
; Reveals one char from runtime_screen_layout using opposite-slope diagonals.
; Output: Carry clear while active, Carry set when complete.
; Destroys: AF, DE, HL
; ------------------------------------------------------------------
trans_diag_inverse_reveal_update:
    ld a, (transition_diag_done)
    or a
    jr z, .tdiru_do_one
    scf
    ret

.tdiru_do_one:
    ld hl, (transition_diag_addr)
    push hl
    or a
    ld de, #1800
    sbc hl, de                    ; HL = name-table offset
    ld de, runtime_screen_layout
    add hl, de
    ld a, (hl)
    pop hl
    call trans_diag_vdp_write_byte

    ld de, 33                     ; next char: +32 row, +1 col
    add hl, de
    ld (transition_diag_addr), hl

    ld hl, transition_diag_len
    dec (hl)
    jr nz, .tdiru_active_ret

    ld hl, transition_diag_index
    inc (hl)
    ld a, (hl)
    cp 55                         ; diagonals 0..54
    jr c, .tdiru_new_diagonal

    ld a, 1
    ld (transition_diag_done), a
    scf
    ret

.tdiru_new_diagonal:
    call trans_diag_inverse_setup_diagonal

.tdiru_active_ret:
    or a
    ret

; ------------------------------------------------------------------
; trans_diag_clear_setup_diagonal
; Calculates the starting VRAM address and length for diagonal d.
; Destroys: AF, DE, HL
; ------------------------------------------------------------------
trans_diag_clear_setup_diagonal:
    ld a, (transition_diag_index)
    cp 32
    jr nc, .tdcs_32_plus

.tdcs_0_31:
    ld e, a
    ld d, 0
    ld hl, #1800
    add hl, de
    ld (transition_diag_addr), hl

    ld a, (transition_diag_index)
    cp 24
    jr c, .tdcs_len_d_plus_1
    ld a, 24
    jr .tdcs_store_len

.tdcs_len_d_plus_1:
    inc a
    jr .tdcs_store_len

.tdcs_32_plus:
    sub 31
    ld e, a
    ld d, 0
    ld h, d
    ld l, e
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                    ; HL = (d - 31) * 32
    ld de, #181F                  ; NAME_TABLE + 31
    add hl, de
    ld (transition_diag_addr), hl

    ld a, 55
    ld hl, transition_diag_index
    sub (hl)

.tdcs_store_len:
    ld (transition_diag_len), a
    ret

; ------------------------------------------------------------------
; trans_diag_inverse_setup_diagonal
; Calculates the starting VRAM address and length for inverse diagonal d.
; Destroys: AF, DE, HL
; ------------------------------------------------------------------
trans_diag_inverse_setup_diagonal:
    ld a, (transition_diag_index)
    cp 32
    jr nc, .tdis_32_plus

.tdis_0_31:
    ld e, a
    ld a, 31
    sub e                         ; A = 31 - d
    ld e, a
    ld d, 0
    ld hl, #1800
    add hl, de
    ld (transition_diag_addr), hl

    ld a, (transition_diag_index)
    cp 24
    jr c, .tdis_len_d_plus_1
    ld a, 24
    jr .tdis_store_len

.tdis_len_d_plus_1:
    inc a
    jr .tdis_store_len

.tdis_32_plus:
    sub 31
    ld e, a
    ld d, 0
    ld h, d
    ld l, e
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                    ; HL = (d - 31) * 32
    ld de, #1800
    add hl, de
    ld (transition_diag_addr), hl

    ld a, 55
    ld hl, transition_diag_index
    sub (hl)

.tdis_store_len:
    ld (transition_diag_len), a
    ret

; ------------------------------------------------------------------
; trans_diag_vdp_write_byte
; Input: HL = VRAM address, A = byte.
; Destroys: AF. Preserves BC, DE, HL.
; ------------------------------------------------------------------
trans_diag_vdp_write_byte:
    push af
    di
    ld a, l
    out (#99), a
    ld a, h
    or #40
    out (#99), a
    pop af
    out (#98), a
    ei
    ret

; ------------------------------------------------------------------
; trans_clear_checkerboard_pass
; Input: A = parity pass (0 or 1). Clears cells where (row + col) & 1 == A.
; Destroys: AF, BC, DE, HL.
; ------------------------------------------------------------------
trans_clear_checkerboard_pass:
    ld e, a                       ; E = target parity
    ld hl, #1800
    ld b, 0                       ; B = row
.tcbp_row:
    ld c, 0                       ; C = col
.tcbp_col:
    ld a, b
    add a, c
    and 1
    cp e
    jr nz, .tcbp_skip
    ld a, (transition_fill_char)
    call trans_diag_vdp_write_byte
.tcbp_skip:
    inc hl
    inc c
    ld a, c
    cp 32
    jr c, .tcbp_col
    inc b
    ld a, b
    cp 24
    jr c, .tcbp_row
    ret

; ------------------------------------------------------------------
; trans_reveal_checkerboard_pass
; Input: A = parity pass (0 or 1). Reveals cells where (row + col) & 1 == A.
; Destroys: AF, BC, DE, HL.
; ------------------------------------------------------------------
trans_reveal_checkerboard_pass:
    ld e, a                       ; E = target parity
    ld hl, #1800
    ld b, 0                       ; B = row
.trbp_row:
    ld c, 0                       ; C = col
.trbp_col:
    ld a, b
    add a, c
    and 1
    cp e
    jr nz, .trbp_skip
    push de                       ; Preserve parity while deriving source byte.
    push hl
    or a
    ld de, #1800
    sbc hl, de                    ; HL = name-table offset
    ld de, runtime_screen_layout
    add hl, de
    ld a, (hl)
    pop hl
    pop de
    call trans_diag_vdp_write_byte
.trbp_skip:
    inc hl
    inc c
    ld a, c
    cp 32
    jr c, .trbp_col
    inc b
    ld a, b
    cp 24
    jr c, .trbp_row
    ret

; ------------------------------------------------------------------
; trans_clear_manhattan_pass
; Input: A = distance from center 2x2. Clears matching Name Table cells.
; Destroys: AF, BC, DE, HL.
; ------------------------------------------------------------------
trans_clear_manhattan_pass:
    ld d, a                       ; D = target distance
    ld hl, #1800
    ld b, 0                       ; B = row
.tcmp_row:
    ld c, 0                       ; C = col
.tcmp_col:
    ld a, c
    cp 16
    jr nc, .tcmp_x_right
    ld a, 15
    sub c
    jr .tcmp_x_done
.tcmp_x_right:
    ld a, c
    sub 16
.tcmp_x_done:
    ld e, a                       ; E = x distance from center 2x2
    ld a, b
    cp 12
    jr nc, .tcmp_y_bottom
    ld a, 11
    sub b
    jr .tcmp_y_done
.tcmp_y_bottom:
    ld a, b
    sub 12
.tcmp_y_done:
    add a, e                      ; A = Manhattan distance
    cp d
    jr nz, .tcmp_skip
    ld a, (transition_fill_char)
    call trans_diag_vdp_write_byte
.tcmp_skip:
    inc hl
    inc c
    ld a, c
    cp 32
    jr c, .tcmp_col
    inc b
    ld a, b
    cp 24
    jr c, .tcmp_row
    ret

; ------------------------------------------------------------------
; trans_reveal_manhattan_pass
; Input: A = distance from center 2x2. Reveals matching Name Table cells.
; Destroys: AF, BC, DE, HL.
; ------------------------------------------------------------------
trans_reveal_manhattan_pass:
    ld d, a                       ; D = target distance
    ld hl, #1800
    ld b, 0                       ; B = row
.trmp_row:
    ld c, 0                       ; C = col
.trmp_col:
    ld a, c
    cp 16
    jr nc, .trmp_x_right
    ld a, 15
    sub c
    jr .trmp_x_done
.trmp_x_right:
    ld a, c
    sub 16
.trmp_x_done:
    ld e, a                       ; E = x distance from center 2x2
    ld a, b
    cp 12
    jr nc, .trmp_y_bottom
    ld a, 11
    sub b
    jr .trmp_y_done
.trmp_y_bottom:
    ld a, b
    sub 12
.trmp_y_done:
    add a, e                      ; A = Manhattan distance
    cp d
    jr nz, .trmp_skip
    push de
    push hl
    or a
    ld de, #1800
    sbc hl, de                    ; HL = name-table offset
    ld de, runtime_screen_layout
    add hl, de
    ld a, (hl)
    pop hl
    pop de
    call trans_diag_vdp_write_byte
.trmp_skip:
    inc hl
    inc c
    ld a, c
    cp 32
    jr c, .trmp_col
    inc b
    ld a, b
    cp 24
    jr c, .trmp_row
    ret

; ------------------------------------------------------------------
; trans_clear_block4_order
; Input: A = step index (0..63). Clears one 4-column x 3-row block.
; Destroys: AF, BC, DE, HL.
; ------------------------------------------------------------------
trans_clear_block4_order:
    ld e, a
    ld d, 0
    ld hl, trans_block4_order
    add hl, de
    ld a, (hl)                    ; A = block id (row*8 + col)
    ld c, a                       ; C = block id
    and 7
    add a, a
    add a, a
    ld d, a                       ; D = start column (block col * 4)
    ld a, c
    srl a
    srl a
    srl a                         ; A = block row
    ld e, a
    add a, a
    add a, e                      ; A = start row (block row * 3)
    ld c, a                       ; C = current row
    ld b, 3
.tcb4_row:
    ld a, c
    ld e, 4
    call trans_clear_row_range_far
    inc c
    djnz .tcb4_row
    ret

; ------------------------------------------------------------------
; trans_reveal_block4_order
; Input: A = step index (0..63). Reveals one 4-column x 3-row block.
; Destroys: AF, BC, DE, HL.
; ------------------------------------------------------------------
trans_reveal_block4_order:
    ld e, a
    ld d, 0
    ld hl, trans_block4_order
    add hl, de
    ld a, (hl)                    ; A = block id (row*8 + col)
    ld c, a                       ; C = block id
    and 7
    add a, a
    add a, a
    ld d, a                       ; D = start column (block col * 4)
    ld a, c
    srl a
    srl a
    srl a                         ; A = block row
    ld e, a
    add a, a
    add a, e                      ; A = start row (block row * 3)
    ld c, a                       ; C = current row
    ld b, 3
.trb4_row:
    ld a, c
    ld e, 4
    call trans_reveal_row_range_far
    inc c
    djnz .trb4_row
    ret

trans_block4_order:
    db 0, 37, 10, 47, 20, 57, 30, 3
    db 40, 13, 50, 23, 60, 33, 6, 43
    db 16, 53, 26, 63, 36, 9, 46, 19
    db 56, 29, 2, 39, 12, 49, 22, 59
    db 32, 5, 42, 15, 52, 25, 62, 35
    db 8, 45, 18, 55, 28, 1, 38, 11
    db 48, 21, 58, 31, 4, 41, 14, 51
    db 24, 61, 34, 7, 44, 17, 54, 27

; ------------------------------------------------------------------
; trans_clear_zoom_band
; Input: A = ring start (0,2,4,6,8,10). Clears a 2-cell-thick band.
; Destroys: AF, BC, DE, HL.
; ------------------------------------------------------------------
trans_clear_zoom_band:
    ld b, a                       ; B = ring
    ld a, b
    add a, a
    ld e, a
    ld a, 32
    sub e
    ld e, a                       ; E = row segment width
    ld d, b                       ; D = start column
    ld a, b
    call trans_clear_row_range_far
    ld a, b
    inc a
    call trans_clear_row_range_far
    ld a, 23
    sub b
    call trans_clear_row_range_far
    ld a, 22
    sub b
    call trans_clear_row_range_far

    ld a, b
    add a, a
    ld e, a
    ld a, 20
    sub e                         ; A = side segment height
    jr z, .tczb_done
    ld d, a                       ; D = row count
    ld a, b
    add a, 2
    ld c, a                       ; C = start row
    ld a, b
    call trans_clear_column_range_far
    ld a, b
    inc a
    call trans_clear_column_range_far
    ld a, 30
    sub b
    call trans_clear_column_range_far
    ld a, 31
    sub b
    call trans_clear_column_range_far
.tczb_done:
    ret

; ------------------------------------------------------------------
; trans_reveal_zoom_band
; Input: A = ring start (0,2,4,6,8,10). Reveals a 2-cell-thick band.
; Destroys: AF, BC, DE, HL.
; ------------------------------------------------------------------
trans_reveal_zoom_band:
    ld b, a                       ; B = ring
    ld a, b
    add a, a
    ld e, a
    ld a, 32
    sub e
    ld e, a                       ; E = row segment width
    ld d, b                       ; D = start column
    ld a, b
    call trans_reveal_row_range_far
    ld a, b
    inc a
    call trans_reveal_row_range_far
    ld a, 23
    sub b
    call trans_reveal_row_range_far
    ld a, 22
    sub b
    call trans_reveal_row_range_far

    ld a, b
    add a, a
    ld e, a
    ld a, 20
    sub e                         ; A = side segment height
    jr z, .trzb_done
    ld d, a                       ; D = row count
    ld a, b
    add a, 2
    ld c, a                       ; C = start row
    ld a, b
    call trans_reveal_column_range_far
    ld a, b
    inc a
    call trans_reveal_column_range_far
    ld a, 30
    sub b
    call trans_reveal_column_range_far
    ld a, 31
    sub b
    call trans_reveal_column_range_far
.trzb_done:
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
    pop bc
    djnz .twf_loop
.twf_done:
    pop bc
    ret

; ==================================================================
; trans_clear_column
; Write transition_fill_char to all 24 rows of a single column in the Name Table
; Input:  A = column (0-31)
; Preserves: BC, DE, HL
; ==================================================================
; [Transition row/VRAM helpers moved to gameflow_aux far module]
; [Default connection helper moved to gameflow_aux far module]
; Get connection by type
; Input: BC = connection table pointer, A = connection type to find
; Output: HL = next node address (or 0 if not found)
; Preserves: BC, DE
; Clobbers: AF, HL
; @mideas:block id=runtime.gameflow.connection_by_type kind=routine owner=gameflow
; [Unused gameflow_get_connection_by_type stripped from resident GameFlow]
; @mideas:endblock id=runtime.gameflow.connection_by_type

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

; [Confirm input helper moved to gameflow_aux far module]
gameflow_world_game_loop:
    ; Check exit flag
    ld a, (gameflow_exit_requested)
    or a
    ret nz

    ; Frame sync first: start each tick exactly on V-Blank edge
    halt
    ; Poll input immediately after V-Blank edge so the hero uses
    ; the freshest input state in the same visible frame.
    call task_update_input
    ld a, (current_screen_engine)
    or a
    jp nz, .skip_player_fastpath_pre_update
    call update_player_fastpath
.skip_player_fastpath_pre_update:



    ; Handle world screen edge transitions (Preview parity)
    call call_check_world_screen_transition_resident

    ; Update all entities
    call update_all_entities

    ld a, (current_screen_engine)
    or a
    jp nz, .skip_player_fastpath_before_sm

    ; Refresh player deadly-tile state before state machines consume it.
    call refresh_player_deadly_fastpath

    ; Refresh player tile interactions without running bonus respawns twice.
    call refresh_player_tile_interaction_fastpath

    ; Run the player state machine before the generic SM sweep.
    call refresh_player_state_machine_fastpath
.skip_player_fastpath_before_sm:

    ; Execute all state machines
    call call_execute_all_state_machines_resident

    ld a, (current_screen_engine)
    or a
    jp nz, .skip_player_fastpath_post_update

    ; WallGrab owns the visible sprite while the grab button is held.
    ; Re-apply it after StateMachine actions so idle/jump/walk sprites
    ; cannot win the frame immediately before animation/sprite refresh.
    call refresh_player_wallgrab_fastpath
    call update_wallgrab_component

    ; Refresh player animation with the final state of this frame.
    call refresh_player_animation_fastpath

    ; Refresh player sprite once with the final state of this frame.
    call refresh_player_sprite_fastpath
.skip_player_fastpath_post_update:


    ; Upload sprites after gameplay so the hero position computed this frame
    ; is what gets shown on screen, instead of the previous frame's SAT.
    call call_update_sprites_to_vram_resident

    ; Animated transform tiles do VRAM read-modify-write, so defer them until
    ; after hero/entity work to keep player response prioritized.
    call call_update_animated_tiles_resident

    ; Sprite SAT upload runs once per frame, outside ISR.

    ; Loop
    jp gameflow_world_game_loop
; @mideas:endblock id=runtime.gameflow.world_loop

; ==================================================================
; NODE DATA STRUCTURES
; Each node has: type byte, data pointer, connection table pointer
; ==================================================================

; Node: Start - "start"
gameflow_node_start:
    db NODE_TYPE_START
    dw gameflow_node_start_data
    dw gameflow_node_start_conn

gameflow_node_start_data:
    dw gameflow_node_start_init    ; Initialization routine address
    db 2    ; Initialization routine bank

gameflow_node_start_conn:
    db CONNECTION_DEFAULT
    dw gameflow_node_scroll
    db CONNECTION_END

; ------------------------------------------------------------------
; gameflow_node_start_init
; Initialization routine for Start node
; Initializes global variables and MSX systems
; ------------------------------------------------------------------
gameflow_node_start_init:
    ; === Core Game Systems Initialization (ALWAYS required) ===
    call init_game_systems

    ret

; Node: TextScroll - "THE MAZE OF GALIOUS"
gameflow_node_scroll:
    db NODE_TYPE_TEXT_SCROLL
    dw gameflow_node_scroll_data
    dw gameflow_node_scroll_conn

gameflow_node_scroll_data:
    db 1                  ; Background color (MSX index from #000000)
    db 1                  ; Pattern background color (MSX index from #000000)
    db 1                  ; Frames per pixel step
    db 5                  ; Number of fixed 32-byte lines
    dw textscroll_scroll_lines

textscroll_scroll_lines:
    db "THE MAZE OF GALIOUS             "
    db "                                "
    db "EN UN TIEMPO REMOTO...          "
    db "LA HISTORIA COMIENZA...         "
    db "KONAMI STYLE TEXT SCROLL        "
    db #FF

gameflow_node_scroll_conn:
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
; @mideas:block id=runtime.gameflow.clear_screen_area_helpers kind=routine owner=gameflow
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
; @mideas:endblock id=runtime.gameflow.clear_screen_area_helpers

; ==================================================================
; END OF GAMEFLOW
; ==================================================================


; --- End of Bank 2 — pad to 8KB boundary ---
BANK_2_USED_END:
    ds #A000 - $, #FF

; ==================================================================
; DATA BANKS — Zone-packed data (8192 bytes per zone)
; First data bank: 3
; Accessed through mapper P3 using
; (label & #1FFF) | #A000.
; BANK_NUMBER = ((label - #4000) / #2000)
; NOTE: Each zone is explicitly padded to preserve bank placement even after
;       server-side ZX0 block rewrites shrink individual data blobs.
; ==================================================================
; ------------------------------------------------------------------
; MEGAROM DATA ZONE PACKER (post-ZX0 final sizes)
; Zone size: 8192 bytes
; Data start address: #A000
; Total data bytes (post-ZX0 / final): 68
; Zones used: 1
; ------------------------------------------------------------------
; ZONE 00 [#A000-#C000] bank 3 used=68 slack=8124
;   + SCREEN_PANTALLA1_0_LAYOUT @ +#0000 size=6
;   + SCREEN_PANTALLA1_0_EFFECTS_LAYOUT @ +#0006 size=6
;   + BEHAVIOR_PANTALLA1_0_DATA @ +#000C size=6
;   + SCREEN_PANTALLA1_0_INTERACTION_TYPE_MAP @ +#0012 size=6
;   + SCREEN_PANTALLA1_0_INTERACTION_VALUE_MAP @ +#0018 size=6
;   + SCREEN_PANTALLA1_0_INTERACTION_TARGET_MAP @ +#001E size=6
;   + NEW_SPRITE_0_F0_LAYER1 @ +#0024 size=25
;   + SPRITE_PLACEHOLDER_PATTERN @ +#003D size=5
;   + SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE @ +#0042 size=1
;   + SCREEN_PANTALLA1_0_BOSS_TABLE @ +#0043 size=1

    org #A000
; ==================================================================
; DATA ZONE 00 (bank 3) used=68 slack=8124
; ==================================================================
; ==================================================================
    ; ZX0 compressed banked resource (768 -> 6 bytes)
    DB #85,#FF,#55,#5D,#55,#56

SCREEN_PANTALLA1_0_EFFECTS_LAYOUT:
    ; ZX0 compressed banked resource (768 -> 6 bytes)
    DB #85,#FF,#55,#5D,#55,#56

BEHAVIOR_PANTALLA1_0_DATA:
    ; ZX0 compressed banked resource (768 -> 6 bytes)
    DB #85,#00,#55,#5D,#55,#56

SCREEN_PANTALLA1_0_INTERACTION_TYPE_MAP:
    ; ZX0 compressed banked resource (768 -> 6 bytes)
    DB #85,#00,#55,#5D,#55,#56

SCREEN_PANTALLA1_0_INTERACTION_VALUE_MAP:
    ; ZX0 compressed banked resource (768 -> 6 bytes)
    DB #85,#00,#55,#5D,#55,#56

SCREEN_PANTALLA1_0_INTERACTION_TARGET_MAP:
    ; ZX0 compressed banked resource (768 -> 6 bytes)
    DB #85,#00,#55,#5D,#55,#56

NEW_SPRITE_0_F0_LAYER1: ; Brush Color Index 1 (Actual Color: #FFFFFF)
    ; ZX0 compressed banked resource (32 -> 25 bytes)
    DB #A6,#00,#01,#02,#01,#9F,#11,#2E,#11,#F7,#FE,#F1,#E7,#FC,#A6,#80
    DB #00,#10,#E8,#FE,#F0,#FE,#D5,#55,#60

SPRITE_PLACEHOLDER_PATTERN:
    ; ZX0 compressed banked resource (32 -> 5 bytes)
    DB #95,#FF,#75,#55,#58

SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE:
    ; No effect zones for pantalla1
    DB #00


SCREEN_PANTALLA1_0_BOSS_TABLE:
    db 0    ; No boss placements

;; BEHAVIOR MAP: pantalla1_0 (32x24 tiles)
;; Total size: 768 bytes (Map IDs 0-255)
;; Data format: HEX

BEHAVIOR_PANTALLA1_0_WIDTH     EQU 32
BEHAVIOR_PANTALLA1_0_HEIGHT    EQU 24
BEHAVIOR_PANTALLA1_0_SIZE      EQU 768

    ds #C000 - $, #FF

; ##################################################################
; FAR BANK 4 — [#6000h-#8000h] FAR CODE: font
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank4 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-2). No far-to-far calls allowed.
; ##################################################################
FAR_BANK_4_ROM_START:

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
    ; Char 0 (0x00)
    DB #00, #00, #00, #00, #00, #00, #00, #00
    ; Char 1 (0x01)
    DB #7E, #81, #A5, #81, #BD, #99, #81, #7E
    ; Char 2 (0x02)
    DB #7E, #FF, #DB, #FF, #C3, #E7, #FF, #7E
    ; Char 3 (0x03)
    DB #6C, #FE, #FE, #FE, #7C, #38, #10, #00
    ; Char 4 (0x04)
    DB #10, #38, #7C, #FE, #7C, #38, #10, #00
    ; Char 5 (0x05)
    DB #38, #7C, #38, #FE, #FE, #7C, #38, #7C
    ; Char 6 (0x06)
    DB #10, #10, #38, #7C, #FE, #7C, #38, #7C
    ; Char 7 (0x07)
    DB #00, #00, #18, #3C, #3C, #18, #00, #00
    ; Char 8 (0x08)
    DB #FF, #FF, #E7, #C3, #C3, #E7, #FF, #FF
    ; Char 9 (0x09)
    DB #00, #3C, #66, #42, #42, #66, #3C, #00
    ; Char 10 (0x0A)
    DB #FF, #C3, #99, #BD, #BD, #99, #C3, #FF
    ; Char 11 (0x0B)
    DB #0F, #07, #0F, #7D, #CC, #CC, #CC, #78
    ; Char 12 (0x0C)
    DB #3C, #66, #66, #66, #3C, #18, #7E, #18
    ; Char 13 (0x0D)
    DB #3F, #33, #3F, #30, #30, #70, #F0, #E0
    ; Char 14 (0x0E)
    DB #7F, #63, #7F, #63, #63, #67, #E6, #C0
    ; Char 15 (0x0F)
    DB #99, #5A, #3C, #E7, #E7, #3C, #5A, #99
    ; Char 16 (0x10)
    DB #80, #E0, #F8, #FE, #F8, #E0, #80, #00
    ; Char 17 (0x11)
    DB #02, #0E, #3E, #FE, #3E, #0E, #02, #00
    ; Char 18 (0x12)
    DB #18, #3C, #7E, #18, #18, #7E, #3C, #18
    ; Char 19 (0x13)
    DB #66, #66, #66, #66, #66, #00, #66, #00
    ; Char 20 (0x14)
    DB #7F, #DB, #DB, #7B, #1B, #1B, #1B, #00
    ; Char 21 (0x15)
    DB #3E, #63, #38, #6C, #6C, #38, #CC, #78
    ; Char 22 (0x16)
    DB #00, #00, #00, #00, #7E, #7E, #7E, #00
    ; Char 23 (0x17)
    DB #18, #3C, #7E, #18, #7E, #3C, #18, #FF
    ; Char 24 (0x18)
    DB #18, #3C, #7E, #18, #18, #18, #18, #00
    ; Char 25 (0x19)
    DB #18, #18, #18, #18, #7E, #3C, #18, #00
    ; Char 26 (0x1A)
    DB #00, #18, #0C, #FE, #0C, #18, #00, #00
    ; Char 27 (0x1B)
    DB #00, #30, #60, #FE, #60, #30, #00, #00
    ; Char 28 (0x1C)
    DB #00, #00, #C0, #C0, #C0, #FE, #00, #00
    ; Char 29 (0x1D)
    DB #00, #24, #66, #FF, #66, #24, #00, #00
    ; Char 30 (0x1E)
    DB #00, #18, #3C, #7E, #FF, #FF, #00, #00
    ; Char 31 (0x1F)
    DB #00, #FF, #FF, #7E, #3C, #18, #00, #00
    ; Char 32 (' ')
    DB #00, #00, #00, #00, #00, #00, #00, #00
    ; Char 33 ('!')
    DB #30, #78, #78, #30, #30, #00, #30, #00
    ; Char 34 ('"')
    DB #6C, #6C, #6C, #00, #00, #00, #00, #00
    ; Char 35 ('#')
    DB #6C, #6C, #FE, #6C, #FE, #6C, #6C, #00
    ; Char 36 ('$')
    DB #30, #7C, #C0, #78, #0C, #F8, #30, #00
    ; Char 37 ('%')
    DB #00, #C6, #CC, #18, #30, #66, #C6, #00
    ; Char 38 ('&')
    DB #38, #6C, #38, #76, #DC, #CC, #76, #00
    ; Char 39 ('\'')
    DB #60, #60, #C0, #00, #00, #00, #00, #00
    ; Char 40 ('(')
    DB #18, #30, #60, #60, #60, #30, #18, #00
    ; Char 41 (')')
    DB #60, #30, #18, #18, #18, #30, #60, #00
    ; Char 42 ('*')
    DB #00, #66, #3C, #FF, #3C, #66, #00, #00
    ; Char 43 ('+')
    DB #00, #30, #30, #FC, #30, #30, #00, #00
    ; Char 44 (',')
    DB #00, #00, #00, #00, #00, #30, #30, #60
    ; Char 45 ('-')
    DB #00, #00, #00, #FC, #00, #00, #00, #00
    ; Char 46 ('.')
    DB #00, #00, #00, #00, #00, #30, #30, #00
    ; Char 47 ('/')
    DB #06, #0C, #18, #30, #60, #C0, #80, #00
    ; Char 48 ('0')
    DB #7C, #C6, #CE, #DE, #F6, #E6, #7C, #00
    ; Char 49 ('1')
    DB #30, #70, #30, #30, #30, #30, #FC, #00
    ; Char 50 ('2')
    DB #78, #CC, #0C, #38, #60, #CC, #FC, #00
    ; Char 51 ('3')
    DB #78, #CC, #0C, #38, #0C, #CC, #78, #00
    ; Char 52 ('4')
    DB #1C, #3C, #6C, #CC, #FE, #0C, #1E, #00
    ; Char 53 ('5')
    DB #FC, #C0, #F8, #0C, #0C, #CC, #78, #00
    ; Char 54 ('6')
    DB #38, #60, #C0, #F8, #CC, #CC, #78, #00
    ; Char 55 ('7')
    DB #FC, #CC, #0C, #18, #30, #30, #30, #00
    ; Char 56 ('8')
    DB #78, #CC, #CC, #78, #CC, #CC, #78, #00
    ; Char 57 ('9')
    DB #78, #CC, #CC, #7C, #0C, #18, #70, #00
    ; Char 58 (':')
    DB #00, #30, #30, #00, #00, #30, #30, #00
    ; Char 59 (';')
    DB #00, #30, #30, #00, #00, #30, #30, #60
    ; Char 60 ('<')
    DB #18, #30, #60, #C0, #60, #30, #18, #00
    ; Char 61 ('=')
    DB #00, #00, #FC, #00, #00, #FC, #00, #00
    ; Char 62 ('>')
    DB #60, #30, #18, #0C, #18, #30, #60, #00
    ; Char 63 ('?')
    DB #78, #CC, #0C, #18, #30, #00, #30, #00
    ; Char 64 ('@')
    DB #7C, #82, #BA, #AA, #BA, #80, #78, #00
    ; Char 65 ('A')
    DB #30, #78, #CC, #CC, #FC, #CC, #CC, #00
    ; Char 66 ('B')
    DB #FC, #66, #66, #7C, #66, #66, #FC, #00
    ; Char 67 ('C')
    DB #3C, #66, #C0, #C0, #C0, #66, #3C, #00
    ; Char 68 ('D')
    DB #F8, #6C, #66, #66, #66, #6C, #F8, #00
    ; Char 69 ('E')
    DB #FE, #62, #68, #78, #68, #62, #FE, #00
    ; Char 70 ('F')
    DB #FE, #62, #68, #78, #68, #60, #F0, #00
    ; Char 71 ('G')
    DB #3C, #66, #C0, #C0, #CE, #66, #3E, #00
    ; Char 72 ('H')
    DB #CC, #CC, #CC, #FC, #CC, #CC, #CC, #00
    ; Char 73 ('I')
    DB #78, #30, #30, #30, #30, #30, #78, #00
    ; Char 74 ('J')
    DB #1E, #0C, #0C, #0C, #CC, #CC, #78, #00
    ; Char 75 ('K')
    DB #E6, #66, #6C, #78, #6C, #66, #E6, #00
    ; Char 76 ('L')
    DB #F0, #60, #60, #60, #62, #66, #FE, #00
    ; Char 77 ('M')
    DB #C6, #EE, #FE, #FE, #D6, #C6, #C6, #00
    ; Char 78 ('N')
    DB #C6, #E6, #F6, #DE, #CE, #C6, #C6, #00
    ; Char 79 ('O')
    DB #38, #6C, #C6, #C6, #C6, #6C, #38, #00
    ; Char 80 ('P')
    DB #FC, #66, #66, #7C, #60, #60, #F0, #00
    ; Char 81 ('Q')
    DB #78, #CC, #CC, #CC, #DC, #78, #1C, #00
    ; Char 82 ('R')
    DB #FC, #66, #66, #7C, #6C, #66, #E6, #00
    ; Char 83 ('S')
    DB #78, #CC, #E0, #70, #1C, #CC, #78, #00
    ; Char 84 ('T')
    DB #FC, #B4, #30, #30, #30, #30, #78, #00
    ; Char 85 ('U')
    DB #CC, #CC, #CC, #CC, #CC, #CC, #FC, #00
    ; Char 86 ('V')
    DB #CC, #CC, #CC, #CC, #CC, #78, #30, #00
    ; Char 87 ('W')
    DB #C6, #C6, #C6, #D6, #FE, #EE, #C6, #00
    ; Char 88 ('X')
    DB #C6, #C6, #6C, #38, #38, #6C, #C6, #00
    ; Char 89 ('Y')
    DB #CC, #CC, #CC, #78, #30, #30, #78, #00
    ; Char 90 ('Z')
    DB #FE, #C6, #8C, #18, #32, #66, #FE, #00
    ; Char 91 ('[')
    DB #78, #60, #60, #60, #60, #60, #78, #00
    ; Char 92 ('\\')
    DB #C0, #60, #30, #18, #0C, #06, #02, #00
    ; Char 93 (']')
    DB #78, #18, #18, #18, #18, #18, #78, #00
    ; Char 94 ('^')
    DB #10, #38, #6C, #C6, #00, #00, #00, #00
    ; Char 95 ('_')
    DB #00, #00, #00, #00, #00, #00, #00, #FF
    ; Char 96 ('`')
    DB #30, #30, #18, #00, #00, #00, #00, #00
    ; Char 97 ('a')
    DB #00, #00, #78, #0C, #7C, #CC, #76, #00
    ; Char 98 ('b')
    DB #E0, #60, #60, #7C, #66, #66, #DC, #00
    ; Char 99 ('c')
    DB #00, #00, #78, #CC, #C0, #CC, #78, #00
    ; Char 100 ('d')
    DB #1C, #0C, #0C, #7C, #CC, #CC, #76, #00
    ; Char 101 ('e')
    DB #00, #00, #78, #CC, #FC, #C0, #78, #00
    ; Char 102 ('f')
    DB #38, #6C, #60, #F0, #60, #60, #F0, #00
    ; Char 103 ('g')
    DB #00, #00, #76, #CC, #CC, #7C, #0C, #F8
    ; Char 104 ('h')
    DB #E0, #60, #6C, #76, #66, #66, #E6, #00
    ; Char 105 ('i')
    DB #30, #00, #70, #30, #30, #30, #78, #00
    ; Char 106 ('j')
    DB #0C, #00, #0C, #0C, #0C, #CC, #CC, #78
    ; Char 107 ('k')
    DB #E0, #60, #66, #6C, #78, #6C, #E6, #00
    ; Char 108 ('l')
    DB #70, #30, #30, #30, #30, #30, #78, #00
    ; Char 109 ('m')
    DB #00, #00, #CC, #FE, #FE, #D6, #C6, #00
    ; Char 110 ('n')
    DB #00, #00, #F8, #CC, #CC, #CC, #CC, #00
    ; Char 111 ('o')
    DB #00, #00, #78, #CC, #CC, #CC, #78, #00
    ; Char 112 ('p')
    DB #00, #00, #DC, #66, #66, #7C, #60, #F0
    ; Char 113 ('q')
    DB #00, #00, #76, #CC, #CC, #7C, #0C, #1E
    ; Char 114 ('r')
    DB #00, #00, #DC, #76, #66, #60, #F0, #00
    ; Char 115 ('s')
    DB #00, #00, #7C, #C0, #78, #0C, #F8, #00
    ; Char 116 ('t')
    DB #10, #30, #7C, #30, #30, #34, #18, #00
    ; Char 117 ('u')
    DB #00, #00, #CC, #CC, #CC, #CC, #76, #00
    ; Char 118 ('v')
    DB #00, #00, #CC, #CC, #CC, #78, #30, #00
    ; Char 119 ('w')
    DB #00, #00, #C6, #D6, #FE, #FE, #6C, #00
    ; Char 120 ('x')
    DB #00, #00, #C6, #6C, #38, #6C, #C6, #00
    ; Char 121 ('y')
    DB #00, #00, #CC, #CC, #CC, #7C, #0C, #F8
    ; Char 122 ('z')
    DB #00, #00, #FC, #98, #30, #64, #FC, #00
    ; Char 123 ('{')
    DB #1C, #30, #30, #E0, #30, #30, #1C, #00
    ; Char 124 ('|')
    DB #18, #18, #18, #00, #18, #18, #18, #00
    ; Char 125 ('}')
    DB #1C, #18, #18, #18, #18, #18, #1C, #00
    ; Char 126 ('~')
    DB #6C, #6C, #36, #00, #00, #00, #00, #00
    ; Char 127 (0x7F)
    DB #7E, #7E, #7E, #7E, #7E, #7E, #7E, #7E


; Character index table (for quick lookup)
FONT_CHAR_INDEX:
    DB 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127
FONT_CHAR_COUNT EQU 128


; ==================================================================
; FONT LOADING FUNCTIONS
; ==================================================================
; @mideas:block id=runtime.font.loading kind=routine owner=font roots=load_custom_font,load_font_bank0,load_font_bank1,load_font_bank2,load_all_font_banks,load_font_patterns_to_bank,load_font_colors,load_font_colors_all_banks,load_font_colors_to_bank

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
    ; Char 0
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 1
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 2
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 3
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 4
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 5
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 6
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 7
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 8
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 9
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 10
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 11
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 12
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 13
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 14
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 15
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 16
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 17
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 18
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 19
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 20
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 21
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 22
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 23
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 24
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 25
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 26
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 27
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 28
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 29
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 30
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 31
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 32
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 33
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 34
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 35
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 36
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 37
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 38
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 39
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 40
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 41
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 42
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 43
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 44
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 45
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 46
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 47
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 48
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 49
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 50
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 51
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 52
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 53
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 54
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 55
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 56
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 57
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 58
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 59
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 60
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 61
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 62
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 63
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 64
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 65
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 66
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 67
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 68
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 69
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 70
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 71
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 72
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 73
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 74
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 75
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 76
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 77
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 78
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 79
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 80
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 81
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 82
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 83
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 84
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 85
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 86
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 87
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 88
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 89
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 90
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 91
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 92
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 93
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 94
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 95
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 96
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 97
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 98
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 99
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 100
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 101
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 102
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 103
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 104
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 105
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 106
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 107
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 108
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 109
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 110
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 111
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 112
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 113
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 114
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 115
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 116
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 117
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 118
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 119
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 120
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 121
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 122
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 123
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 124
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 125
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 126
    DB #F0, #F0, #F0, #F0, #F0, #F0, #F0, #F0
    ; Char 127
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
; @mideas:endblock id=runtime.font.loading

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


; --- End of Far Bank 4 — pad to 8KB boundary ---
BANK_4_USED_END:
    ds #8000 - $, #FF
    org FAR_BANK_4_ROM_START + #2000

; ##################################################################
; FAR BANK 5 — [#6000h-#8000h] FAR CODE: gameflow_aux
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank5 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-2). No far-to-far calls allowed.
; ##################################################################
FAR_BANK_5_ROM_START:

    org #6000

; ==================================================================
; GAMEFLOW AUXILIARY FAR RUNTIME
; Split from gameflow.asm so long-lived input loops stay resident while
; short render/toggle helpers can live in an overlay bank.
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
    ld a, (transition_fill_char)
    out (#98), a                  ; Write transition fill char
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
; trans_clear_column_range
; Clears part of a Name Table column.
; Input:  A = column (0-31), C = start row (0-23), D = row count
; Preserves: BC, DE, HL
; ==================================================================
trans_clear_column_range:
    push bc
    push de
    push hl
    ld b, d
    ld l, c
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                    ; HL = start row * 32
    ld e, a
    ld d, 0
    add hl, de
    ld de, #1800
    add hl, de                    ; HL = NAME_TABLE + row*32 + col
.tccr_loop:
    di
    ld a, l
    out (#99), a
    ld a, h
    or #40
    out (#99), a
    ld a, (transition_fill_char)
    out (#98), a
    ei
    ld a, l
    add a, 32
    ld l, a
    jr nc, .tccr_no_carry
    inc h
.tccr_no_carry:
    djnz .tccr_loop
    pop hl
    pop de
    pop bc
    ret

; ==================================================================
; trans_reveal_column
; Copy one column from runtime_screen_layout to the Name Table.
; Input:  A = column (0-31)
; Preserves: BC, DE, HL
; ==================================================================
trans_reveal_column:
    push bc
    push de
    push hl
    ld c, a
    ld e, a
    ld d, 0
    ld hl, runtime_screen_layout
    add hl, de                    ; HL = source row 0 + column
    ld e, c
    ld d, #18                     ; DE = #1800 + column
    ld b, 24
    di
.trc_row:
    ld a, e
    out (#99), a
    ld a, d
    or #40
    out (#99), a
    ld a, (hl)
    out (#98), a
    push de
    ld de, 32
    add hl, de
    pop de
    ld a, e
    add a, 32
    ld e, a
    jr nc, .trc_no_carry
    inc d
.trc_no_carry:
    djnz .trc_row
    ei
    pop hl
    pop de
    pop bc
    ret

; ==================================================================
; trans_reveal_column_range
; Copies part of a column from runtime_screen_layout to the Name Table.
; Input:  A = column (0-31), C = start row (0-23), D = row count
; Preserves: BC, DE, HL
; ==================================================================
trans_reveal_column_range:
    push bc
    push de
    push hl
    ld b, d
    ld l, c
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                    ; HL = start row * 32
    ld e, a
    ld d, 0
    add hl, de
    push hl                       ; save row+col offset
    ld de, runtime_screen_layout
    add hl, de
    ex de, hl                     ; DE = source cell
    pop hl
    push de
    ld de, #1800
    add hl, de                    ; HL = destination cell
    pop de
    di
.trcr_loop:
    ld a, l
    out (#99), a
    ld a, h
    or #40
    out (#99), a
    ld a, (de)
    out (#98), a
    ld a, e
    add a, 32
    ld e, a
    jr nc, .trcr_src_no_carry
    inc d
.trcr_src_no_carry:
    ld a, l
    add a, 32
    ld l, a
    jr nc, .trcr_dst_no_carry
    inc h
.trcr_dst_no_carry:
    djnz .trcr_loop
    ei
    pop hl
    pop de
    pop bc
    ret

; ==================================================================
; trans_clear_row_direct
; Write transition_fill_char to all 32 columns of a single Name Table row.
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
    ld a, (transition_fill_char)
.tcrd_loop:
    out (#98), a
    djnz .tcrd_loop
    ei
    pop hl
    pop de
    pop bc
    ret

; ==================================================================
; trans_clear_row_range
; Clears part of a Name Table row.
; Input:  A = row (0-23), D = start column (0-31), E = char count
; Preserves: BC, DE, HL
; ==================================================================
trans_clear_row_range:
    push bc
    push de
    push hl
    ld b, e
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                    ; HL = row * 32
    ld e, d
    ld d, 0
    add hl, de
    ld de, #1800
    add hl, de                    ; HL = NAME_TABLE + row*32 + start col
    di
    ld a, l
    out (#99), a
    ld a, h
    or #40
    out (#99), a
    ld a, (transition_fill_char)
.tcrr_loop:
    out (#98), a
    djnz .tcrr_loop
    ei
    pop hl
    pop de
    pop bc
    ret

; ==================================================================
; trans_reveal_row_direct
; Copy one row from runtime_screen_layout to the Name Table.
; Input:  A = row (0-23)
; Preserves: BC, DE, HL
; ==================================================================
trans_reveal_row_direct:
    push bc
    push de
    push hl
    ld l, a
    ld h, 0
    add hl, hl                    ; *2
    add hl, hl                    ; *4
    add hl, hl                    ; *8
    add hl, hl                    ; *16
    add hl, hl                    ; *32
    push hl                       ; save row offset
    ld de, runtime_screen_layout
    add hl, de
    ex de, hl                     ; DE = source row
    pop hl                        ; HL = row offset
    ld bc, #1800
    add hl, bc                    ; HL = name table row start
    di
    ld a, l
    out (#99), a
    ld a, h
    or #40
    out (#99), a
    ex de, hl                     ; HL = source row
    ld b, 32
.trrd_loop:
    ld a, (hl)
    out (#98), a
    inc hl
    djnz .trrd_loop
    ei
    pop hl
    pop de
    pop bc
    ret

; ==================================================================
; trans_reveal_row_range
; Copies part of a row from runtime_screen_layout to the Name Table.
; Input:  A = row (0-23), D = start column (0-31), E = char count
; Preserves: BC, DE, HL
; ==================================================================
trans_reveal_row_range:
    push bc
    push de
    push hl
    ld b, e
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl                    ; HL = row * 32
    ld e, d
    ld d, 0
    add hl, de
    push hl                       ; save row+col offset
    ld de, runtime_screen_layout
    add hl, de
    ex de, hl                     ; DE = source range
    pop hl
    push de
    ld de, #1800
    add hl, de                    ; HL = destination range
    pop de
    di
    ld a, l
    out (#99), a
    ld a, h
    or #40
    out (#99), a
    ex de, hl                     ; HL = source range
.trrr_loop:
    ld a, (hl)
    out (#98), a
    inc hl
    djnz .trrr_loop
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

; ------------------------------------------------------------------
; Shared helper: Print string to VRAM
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

; ==================================================================
; CONNECTION UTILITIES
; ==================================================================

; Get next node from connection table (for simple single-connection nodes)
; Input: BC = connection table pointer
; Output: HL = next node address (or 0 if none)

textscroll_capture_font_patterns:
    di
    ; FAST_RDVRM returns the byte after the programmed address on this path,
    ; so start one byte earlier to capture exact glyph rows.
    ld hl, CHRTBL2 + (TEXTSCROLL_FONT_FIRST * 8) - 1
    ld de, TEXTSCROLL_FONT_SRC
    ld bc, TEXTSCROLL_FONT_BYTES
.capture_loop:
    call FAST_RDVRM
    ld (de), a
    inc hl
    inc de
    dec bc
    ld a, b
    or c
    jr nz, .capture_loop
    ei
    ret

textscroll_prepare_pattern_masks:
    ld a, (gameflow_textscroll_stripe_color)
    and #0F
    or #F0
    ld hl, CLRTBL2 + (TEXTSCROLL_FONT_FIRST * 8)
    ld bc, TEXTSCROLL_FONT_BYTES
    call FAST_FILLVRM
    ld a, (gameflow_textscroll_stripe_color)
    and #0F
    or #F0
    ld hl, CLRTBL2 + #0800 + (TEXTSCROLL_FONT_FIRST * 8)
    ld bc, TEXTSCROLL_FONT_BYTES
    call FAST_FILLVRM
    ld a, (gameflow_textscroll_stripe_color)
    and #0F
    or #F0
    ld hl, CLRTBL2 + #1000 + (TEXTSCROLL_FONT_FIRST * 8)
    ld bc, TEXTSCROLL_FONT_BYTES
    jp FAST_FILLVRM

textscroll_clear_name_table_spaces:
    ld a, TEXTSCROLL_FONT_FIRST
    ld hl, NAMETBL
    ld bc, 768
    jp FAST_FILLVRM

; ------------------------------------------------------------------
; Render the coarse 8-pixel text layout into the name table.
; Fine scrolling is handled by textscroll_build_color_frame.
; ------------------------------------------------------------------
textscroll_render_name_frame:
    call textscroll_clear_name_table_spaces
    xor a
    ld (gameflow_textscroll_row), a
.row_loop:
    ld a, (gameflow_textscroll_row)
    cp 24
    ret nc

    ld c, a
    ld a, (gameflow_textscroll_step)
    add a, c
    cp 23
    jr c, .next_row
    sub 23
    ld hl, gameflow_textscroll_line_count
    cp (hl)
    jr nc, .next_row

    call textscroll_load_line_entry
    call textscroll_print_active_line

.next_row:
    ld hl, gameflow_textscroll_row
    inc (hl)
    jr .row_loop

; Input: A = line index
textscroll_load_line_entry:
    ld e, a
    ld d, 0
    ld h, d
    ld l, e
    add hl, hl
    add hl, de
    ld de, (gameflow_textscroll_line_table_ptr)
    add hl, de
    ld a, (hl)
    ld (gameflow_textscroll_line_col), a
    inc hl
    ld e, (hl)
    inc hl
    ld d, (hl)
    ld (gameflow_textscroll_line_ptr), de
    ret

textscroll_print_active_line:
    ld a, (gameflow_textscroll_row)
    ld h, 0
    ld l, a
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld a, (gameflow_textscroll_line_col)
    ld e, a
    ld d, 0
    add hl, de
    ld de, NAMETBL
    add hl, de
    ex de, hl
    ld hl, (gameflow_textscroll_line_ptr)
    jp print_string_vram

; ------------------------------------------------------------------
; Build a 512-byte pattern-table window for ASCII 32..95.
; Each glyph row is shifted up by gameflow_textscroll_fine pixels.
; ------------------------------------------------------------------
textscroll_build_color_frame:
    ld hl, TEXTSCROLL_FONT_SRC
    ld de, TEXTSCROLL_FRAME_BUF
    ld c, TEXTSCROLL_FONT_COUNT
.char_loop:
    push hl
    ld a, (gameflow_textscroll_fine)
    or a
    jr z, .source_ready
    push de
    ld e, a
    ld d, 0
    add hl, de
    pop de
.source_ready:
    ld a, 8
    ld b, a
    ld a, (gameflow_textscroll_fine)
    or a
    jr z, .visible_rows_ready
    ld b, a
    ld a, 8
    sub b
    ld b, a
.visible_rows_ready:
    ld a, b
    or a
    jr z, .visible_done
.visible_loop:
    ld a, (hl)
    ld (de), a
    inc de
    inc hl
    djnz .visible_loop
.visible_done:
    ld a, (gameflow_textscroll_fine)
    ld b, a
    or a
    jr z, .blank_done
.blank_loop:
    xor a
    ld (de), a
    inc de
    djnz .blank_loop
.blank_done:
    pop hl
    inc hl
    inc hl
    inc hl
    inc hl
    inc hl
    inc hl
    inc hl
    inc hl
    dec c
    jp nz, .char_loop
    ret

textscroll_copy_color_frame_all_banks:
    ld hl, TEXTSCROLL_FRAME_BUF
    ld de, CHRTBL2 + (TEXTSCROLL_FONT_FIRST * 8)
    ld bc, TEXTSCROLL_FONT_BYTES
    call FAST_LDIRVM
    ld hl, TEXTSCROLL_FRAME_BUF
    ld de, CHRTBL2 + #0800 + (TEXTSCROLL_FONT_FIRST * 8)
    ld bc, TEXTSCROLL_FONT_BYTES
    call FAST_LDIRVM
    ld hl, TEXTSCROLL_FRAME_BUF
    ld de, CHRTBL2 + #1000 + (TEXTSCROLL_FONT_FIRST * 8)
    ld bc, TEXTSCROLL_FONT_BYTES
    jp FAST_LDIRVM

textscroll2_capture_font_patterns:
    di
    ; FAST_RDVRM returns the byte after the programmed address on this path,
    ; so start one byte earlier to capture exact glyph rows.
    ld hl, CHRTBL2 + (TEXTSCROLL2_FONT_FIRST * 8) - 1
    ld de, TEXTSCROLL2_FONT_SRC
    ld bc, TEXTSCROLL2_FONT_BYTES
.ts2_capture_loop:
    call FAST_RDVRM
    ld (de), a
    inc hl
    inc de
    dec bc
    ld a, b
    or c
    jr nz, .ts2_capture_loop
    ei
    ret

textscroll2_init_name_table:
    ld hl, NAMETBL
    ld d, 3
.ts2_bank_loop:
    xor a
    ld b, 0
.ts2_byte_loop:
    call FAST_WRTVRM
    inc hl
    inc a
    djnz .ts2_byte_loop
    dec d
    jr nz, .ts2_bank_loop
    ret

textscroll2_init_color_table:
    ld a, (gameflow_textscroll2_stripe_color)
    and #0F
    or #F0
    ld hl, CLRTBL2
    ld bc, TEXTSCROLL2_PATTERN_BYTES
    jp FAST_FILLVRM

textscroll2_clear_pattern_table:
    xor a
    ld hl, CHRTBL2
    ld bc, TEXTSCROLL2_PATTERN_BYTES
    jp FAST_FILLVRM

textscroll2_shift_vram_up1:
    di
    ld hl, CHRTBL2
    ld c, 23
.ts2_row_loop:
    ld b, 32
.ts2_col_loop:
    push bc
    call textscroll2_shift_tile_take_below
    pop bc
    djnz .ts2_col_loop
    dec c
    jr nz, .ts2_row_loop

    ld de, (gameflow_textscroll2_text_ptr)
    ld b, 32
.ts2_last_col_loop:
    push bc
    push de
    call textscroll2_shift_tile_up7
    pop de
    ld a, (de)
    inc de
    push de
    call textscroll2_get_font_byte
    call FAST_WRTVRM
    inc hl
    pop de
    pop bc
    djnz .ts2_last_col_loop

    ei
    jp textscroll2_advance_text_scanline

textscroll2_shift_tile_take_below:
    push hl
    call textscroll2_shift_tile_up7
    push hl
    pop de
    pop hl
    inc h
    call FAST_RDVRM
    ex de, hl
    call FAST_WRTVRM
    inc hl
    ret

textscroll2_shift_tile_up7:
    ld b, 7
.ts2_shift_loop:
    push bc
    push hl
    inc hl
    call FAST_RDVRM
    pop hl
    call FAST_WRTVRM
    inc hl
    pop bc
    djnz .ts2_shift_loop
    ret

; IN: A = ASCII char. OUT: A = font scanline. Preserves HL.
textscroll2_get_font_byte:
    push hl
    cp TEXTSCROLL2_FONT_FIRST
    jr nc, .ts2_min_ok
    ld a, TEXTSCROLL2_FONT_FIRST
.ts2_min_ok:
    cp TEXTSCROLL2_FONT_FIRST + TEXTSCROLL2_FONT_COUNT
    jr c, .ts2_range_ok
    ld a, TEXTSCROLL2_FONT_FIRST
.ts2_range_ok:
    sub TEXTSCROLL2_FONT_FIRST
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    ld a, (gameflow_textscroll2_text_pix)
    add a, l
    ld l, a
    jr nc, .ts2_no_carry
    inc h
.ts2_no_carry:
    ld de, TEXTSCROLL2_FONT_SRC
    add hl, de
    ld a, (hl)
    pop hl
    ret

textscroll2_advance_text_scanline:
    ld a, (gameflow_textscroll2_text_pix)
    inc a
    cp 8
    jr nz, .ts2_store_pix
    xor a
    ld hl, (gameflow_textscroll2_text_ptr)
    ld de, 32
    add hl, de
    ld e, a
    ld a, (hl)
    cp #FF
    jr nz, .ts2_set_ptr
    ld hl, textscroll2_blank_line
.ts2_set_ptr:
    ld (gameflow_textscroll2_text_ptr), hl
    ld a, e
.ts2_store_pix:
    ld (gameflow_textscroll2_text_pix), a
    ret

textscroll2_blank_line:
    db "                                "
    db #FF

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

; ------------------------------------------------------------------
; gameflow_read_confirm_direct
; Read submenu/text confirm input directly from keyboard matrix.
; Output: A = 1 when SPACE is pressed, A = 0 otherwise
; Clobbers: AF
; Preserves: BC, DE, HL, IX, IY
; ------------------------------------------------------------------
; @mideas:block id=runtime.gameflow.confirm_input_direct kind=routine owner=gameflow
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
; @mideas:endblock id=runtime.gameflow.confirm_input_direct

; ==================================================================
; GAME LOOP (WorldLink nodes only)
; ==================================================================

; Main game loop - executed by WorldLink nodes
; This loop runs while a world/level is active
; @mideas:block id=runtime.gameflow.world_loop kind=routine owner=gameflow roots=gameflow_world_game_loop


; --- End of Far Bank 5 — pad to 8KB boundary ---
BANK_5_USED_END:
    ds #8000 - $, #FF
    org FAR_BANK_5_ROM_START + #2000

; ##################################################################
; FAR BANK 6 — [#6000h-#8000h] FAR CODE: entities
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank6 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-2). No far-to-far calls allowed.
; ##################################################################
FAR_BANK_6_ROM_START:

    org #6000

; ==================================================================
; GAME ENTITIES
; File: entities.asm
; Description: Game entity definitions and behavior
; ==================================================================
;
; INTELLIGENT FILTERING ACTIVE:
;   Entity templates in project: 11
;   Actually instantiated: 1
;   Used entity templates: 1
;   Filtered out: 10 unused templates
;
; ==================================================================

; ==================================================================
; ENTITY DEFINITIONS
; ==================================================================

; Entity: puntdemira 1 (instance from template: tpl_1767095359697_dc6vt)
ENTITY_PUNTDEMIRA_1_ID EQU 0
ENTITY_PUNTDEMIRA_1_COMP_MASK EQU #03  ; Component mask: 00000011b
; Template: tpl_1767095359697_dc6vt
ENTITY_PUNTDEMIRA_1_X EQU 14
ENTITY_PUNTDEMIRA_1_Y EQU 11

; ==================================================================
; ENTITY MANAGEMENT FUNCTIONS
; ==================================================================

init_entities:
    ; Initialize all active game entities (1 entities)

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

    ; Clear runtime Dash enable flags. Per-entity init fills active slots.
    ld hl, entity_dash_cfg_enabled
    ld de, entity_dash_cfg_enabled+1
    ld bc, 31
    ld (hl), 0
    ldir

    ; Clear runtime WallGrab config. Per-entity init fills active slots.
    ld hl, entity_wallgrab_cfg_enabled
    ld de, entity_wallgrab_cfg_enabled+1
    ld bc, 31
    ld (hl), 0
    ldir

    ld hl, entity_wallgrab_cfg_fall_speed
    ld de, entity_wallgrab_cfg_fall_speed+1
    ld bc, 31
    ld (hl), 0
    ldir

    ld hl, entity_wallgrab_cfg_climb_speed
    ld de, entity_wallgrab_cfg_climb_speed+1
    ld bc, 31
    ld (hl), 1
    ldir

    ld hl, entity_wallgrab_cfg_duration_frames
    ld de, entity_wallgrab_cfg_duration_frames+1
    ld bc, 31
    ld (hl), 240
    ldir

    ld hl, entity_wallgrab_cfg_grab_sprite
    ld de, entity_wallgrab_cfg_grab_sprite+1
    ld bc, 31
    ld (hl), #FF
    ldir

    ; Clear runtime Mirror flags. Per-entity init fills active slots.
    ld hl, entity_mirror_flags
    ld de, entity_mirror_flags+1
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

    ; Clear Limit_on screen-edge clamp flags
    ld hl, entity_limit_on
    ld de, entity_limit_on+1
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

    ; Clear directional wall flags so table-driven walkers do not react to
    ; stale collision RAM before the first WallCollision pass.
    ld hl, entity_wall_collision_flags
    ld de, entity_wall_collision_flags+1
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
    
    call init_puntdemira_1
    call init_player_from_hero_entity
    ret

update_entities:
    ; Update all active entities (1 entities)
    ; Skip entity update if entity belongs to another screen
    ld hl, entity_screen_id + 0
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr nz, .skip_update_0
    ; Run per-entity update
    call update_puntdemira_1
.skip_update_0:
    ret

; @mideas:block id=data.entities.puntdemira_1.init kind=routine owner=entities roots=init_puntdemira_1
init_puntdemira_1:
    ; Initialize puntdemira 1 at real position from JSON
    ; JSON position: (14, 11) tiles = (112, 88) pixels
    ; Template: tpl_1767095359697_dc6vt
    ; Components: Position, Sprite
    ; Direction mask: #0F (1111b) = All directions

    ; Set entity ID and component mask (DYNAMIC - based on template)
    ; Mask is 16-bit: B=low byte, C=high byte
    ld a, 0             ; Entity ID
    ld b, #03              ; Mask low byte
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
    ld (hl), 112         ; Set real X position from JSON

    ld hl, entity_y_pos
    add hl, de
    ld (hl), 88         ; Set real Y position from JSON

    ; Set entity screen ID (for multi-screen support)
    ld hl, entity_screen_id
    add hl, de
    ld (hl), 0                 ; Screen ID (world node index / fallback screen index)

    ld hl, entity_is_player
    add hl, de
    ld (hl), 0                 ; Player/hero marker from template

    ld hl, entity_limit_on
    add hl, de
    ld (hl), 0                 ; Limit_on implicit wall at missing WorldMap edges

    ; Template token for state-machine template-aware actions
    ld hl, entity_template_token
    add hl, de
    ld (hl), 11

    ; Mark whether this entity's state machine actually owns sprite changes.
    ; Plain state machines without ChangeSprite should keep auto-facing active.
    ld hl, entity_sm_sprite_control
    add hl, de
    ld (hl), 0

    ; Runtime Dash flag is read from always-mapped RAM by the player fastpath.
    ld hl, entity_dash_cfg_enabled
    add hl, de
    ld (hl), 0

    ; Runtime WallGrab config is read from always-mapped RAM by the component system.
    ld hl, entity_wallgrab_cfg_enabled
    add hl, de
    ld (hl), 0

    ld hl, entity_wallgrab_cfg_fall_speed
    add hl, de
    ld (hl), 0

    ld hl, entity_wallgrab_cfg_climb_speed
    add hl, de
    ld (hl), 1

    ld hl, entity_wallgrab_cfg_duration_frames
    add hl, de
    ld (hl), 240

    ld hl, entity_wallgrab_cfg_grab_sprite
    add hl, de
    ld (hl), 255

    ; Runtime Mirror flag is read by update_mirror_component before Position.
    ld hl, entity_mirror_flags
    add hl, de
    ld (hl), #00











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
; @mideas:endblock id=data.entities.puntdemira_1.init

update_puntdemira_1:
    ; Update puntdemira 1 logic with real behavior
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
    DB 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
entity_gate_cfg_height:
    DB 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
entity_gate_cfg_direction:
    DB 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
entity_gate_cfg_fill_char:
    DB 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
entity_gate_cfg_total_steps:
    DB 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
entity_gate_cfg_step_delay:
    DB 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
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
entity_aircontrol_cfg_mode:
    DB 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
entity_in_water_cfg_enabled:
    DB 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
entity_behavior_cfg_type:
    DB 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
entity_behavior_cfg_dir:
    DB 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2
entity_behavior_cfg_speed:
    DB 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
entity_behavior_cfg_range:
    DB 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
entity_behavior_cfg_stop:
    DB 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0


; @mideas:block id=runtime.entities.patrol_facing kind=routine owner=entities roots=update_entity_patrol_facing
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
; @mideas:endblock id=runtime.entities.patrol_facing

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
    jr nz, .player_seed_has_hero

    ; Entity init calls this before the active-list rebuild has resolved
    ; hero_entity_id. Fall back to the first generated player marker so the
    ; fast player runtime starts with valid coordinates on frame 1.
    ld hl, entity_is_player
    ld b, MAX_ENTITIES
    ld c, 0
.player_seed_scan_loop:
    ld a, (hl)
    or a
    jr nz, .player_seed_found
    inc hl
    inc c
    djnz .player_seed_scan_loop
    ret
.player_seed_found:
    ld a, c
    ld (hero_entity_id), a

.player_seed_has_hero:
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


; --- End of Far Bank 6 — pad to 8KB boundary ---
BANK_6_USED_END:
    ds #8000 - $, #FF
    org FAR_BANK_6_ROM_START + #2000

; ##################################################################
; FAR BANK 7 — [#6000h-#8000h] FAR CODE: sound
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank7 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-2). No far-to-far calls allowed.
; ##################################################################
FAR_BANK_7_ROM_START:

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

; @mideas:block id=runtime.sound.init kind=routine owner=sound roots=init_sound_system
init_sound_system:
    ; Avoid BIOS PSG init from banked overlays; direct PSG writes below leave
    ; the chip in a deterministic silent state without crossing ROM slots.

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
; @mideas:endblock id=runtime.sound.init

; ------------------------------------------------------------------
; task_audio_tick
; Shared audio tick wrapper for IRQ task_manager or HALT game loops.
; Preserves caller-visible registers on every exit path.
; ------------------------------------------------------------------
; @mideas:block id=runtime.sound.tick kind=routine owner=sound roots=task_audio_tick
task_audio_tick:
    push af
    push bc
    push de
    push hl

    call call_music_update_resident


    pop hl
    pop de
    pop bc
    pop af
    ret
; @mideas:endblock id=runtime.sound.tick

; ==================================================================
; PSG LOW-LEVEL CONTROL FUNCTIONS
; ==================================================================
; @mideas:block id=runtime.sound.psg_lowlevel kind=routine owner=sound roots=psg_write,psg_set_tone,psg_set_volume,psg_set_noise,psg_set_mixer,psg_set_envelope

; ------------------------------------------------------------------
; psg_write
; Write to PSG register via BIOS
; Input:  A = Register number (0-13)
;         E = Value to write
; Destroys: AF, E
; ------------------------------------------------------------------
psg_write:
    out (#A0), a
    ld a, e
    out (#A1), a
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
    call psg_write

    ; Write high byte (only lower 4 bits)
    ld a, b
    ld e, h
    ld a, e
    and #0F
    ld e, a
    ld a, b
    call psg_write

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
    call psg_write
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
    call psg_write
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
    call psg_write
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
    call psg_write
    ld a, PSG_ENV_HI
    ld e, h
    call psg_write
    ld a, b
    and #0F
    ld e, a
    ld a, PSG_ENV_SHAPE
    call psg_write
    ret
; @mideas:endblock id=runtime.sound.psg_lowlevel

; ==================================================================
; HIGH-LEVEL SOUND EFFECTS
; ==================================================================

; ------------------------------------------------------------------
; sfx_silence_all
; Silence all PSG channels
; ------------------------------------------------------------------
; @mideas:block id=runtime.sound.sfx_silence kind=routine owner=sound
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
; @mideas:endblock id=runtime.sound.sfx_silence

; ------------------------------------------------------------------
; sfx_beep
; Simple beep sound
; ------------------------------------------------------------------
; @mideas:block id=runtime.sound.sfx_builtin_effects kind=routine owner=sound
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
; @mideas:endblock id=runtime.sound.sfx_builtin_effects

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
; @mideas:block id=runtime.sound.sfx_playback kind=routine owner=sound
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
; @mideas:endblock id=runtime.sound.sfx_playback

; ==================================================================
; TRACKER MUSIC RUNTIME
; No exportable music tracks are referenced by this project.
; Public labels are kept as no-op stubs so GameFlow/audio wrappers
; remain link-compatible without carrying the tracker interpreter.
; ==================================================================

; @mideas:block id=runtime.sound.music_noop_runtime kind=routine owner=sound
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

; @mideas:block id=runtime.sound.music_reset_noop kind=routine owner=sound
music_reset_channel_state:
    ret
; @mideas:endblock id=runtime.sound.music_reset_noop

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
; @mideas:endblock id=runtime.sound.music_noop_runtime

; ==================================================================
; END OF PSG SOUND SYSTEM
; ==================================================================


; --- End of Far Bank 7 — pad to 8KB boundary ---
BANK_7_USED_END:
    ds #8000 - $, #FF
    org FAR_BANK_7_ROM_START + #2000

; ##################################################################
; FAR BANK 8 — [#6000h-#8000h] FAR CODE: screen_loaders
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank8 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-2). No far-to-far calls allowed.
; ##################################################################
FAR_BANK_8_ROM_START:

    org #6000

; ==================================================================
; SCREEN LOADER RUNTIME
; Split from screens.asm so screen constants/data metadata and loader
; routines can occupy separate 8KB MegaROM code banks.
; ==================================================================
; ==================================================================
; SCREEN LOADING FUNCTIONS
; ==================================================================

; @mideas:block id=runtime.screens.colors kind=routine owner=screens roots=set_screen_colors
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
; @mideas:endblock id=runtime.screens.colors

transition_box_char_pattern:
    db #FF, #81, #81, #81, #81, #81, #81, #FF

; Helper function to initialize blank sentinel characters with background color
; Input: A = background color (0-15)
; This ensures empty cells show the correct background color instead of stale VRAM.
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
    ld d, a                    ; D = blank color byte; FAST_FILLVRM preserves DE
    and #0F
    or #F0                     ; char 254 border: white foreground over background
    ld e, a                    ; E = transition box color byte; FAST_FILLVRM preserves DE
    
    ; Write color to character 0 in all 3 banks (8 bytes each)
    ; Bank 0: CLRTBL2 + (0 * 8)
    ld a, d                    ; Fill byte = background color in both nibbles
    ld hl, CLRTBL2
    ld bc, 8                   ; 8 bytes per character
    call FAST_FILLVRM
    
    ; Bank 1: CLRTBL2 + #800 + (0 * 8)
    ld a, d
    ld hl, CLRTBL2 + #800
    ld bc, 8
    call FAST_FILLVRM
    
    ; Bank 2: CLRTBL2 + #1000 + (0 * 8)
    ld a, d
    ld hl, CLRTBL2 + #1000
    ld bc, 8
    call FAST_FILLVRM

    ; Character 255 is also used as an empty/SPC sentinel by boss and layout data.
    ld a, d
    ld hl, CLRTBL2 + (255 * 8)
    ld bc, 8
    call FAST_FILLVRM
    ld a, d
    ld hl, CLRTBL2 + #800 + (255 * 8)
    ld bc, 8
    call FAST_FILLVRM
    ld a, d
    ld hl, CLRTBL2 + #1000 + (255 * 8)
    ld bc, 8
    call FAST_FILLVRM

    ; Character 254 is reserved for GameFlow transition box cells.
    ld a, e
    ld hl, CLRTBL2 + (254 * 8)
    ld bc, 8
    call FAST_FILLVRM
    ld a, e
    ld hl, CLRTBL2 + #800 + (254 * 8)
    ld bc, 8
    call FAST_FILLVRM
    ld a, e
    ld hl, CLRTBL2 + #1000 + (254 * 8)
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

    ; Keep character 255 visually blank even when layouts use #FF for absence.
    xor a
    ld hl, CHRTBL2 + (255 * 8)
    ld bc, 8
    call FAST_FILLVRM
    xor a
    ld hl, CHRTBL2 + #800 + (255 * 8)
    ld bc, 8
    call FAST_FILLVRM
    xor a
    ld hl, CHRTBL2 + #1000 + (255 * 8)
    ld bc, 8
    call FAST_FILLVRM

    ; Load the transition box outline into character 254 in all 3 banks.
    ld hl, transition_box_char_pattern
    ld de, CHRTBL2 + (254 * 8)
    ld bc, 8
    call FAST_LDIRVM
    ld hl, transition_box_char_pattern
    ld de, CHRTBL2 + #800 + (254 * 8)
    ld bc, 8
    call FAST_LDIRVM
    ld hl, transition_box_char_pattern
    ld de, CHRTBL2 + #1000 + (254 * 8)
    ld bc, 8
    call FAST_LDIRVM
    
    pop hl
    pop de
    pop bc
    pop af
    ret

; @mideas:block id=runtime.screens.copy_rect kind=routine owner=screens roots=copy_layout_rect_to_vram,copy_layout_rect_ram_to_ram
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
; @mideas:endblock id=runtime.screens.copy_rect

; @mideas:block id=runtime.screens.block_layout_expander kind=routine owner=screens roots=expand_screen_block_layout_to_background,expand_screen_block_layout_2x2,expand_screen_block_layout_4x4
; Register Contract:
;   Purpose: Expand a block-optimized screen background into the linear 32x24 runtime layout buffer.
;   Inputs:
;     - A = block width/mode (2 or 4)
;     - HL = block catalog source pointer
;     - DE = block index map source pointer
;   Outputs:
;     - runtime_screen_layout rebuilt as a linear 32x24 byte map
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
;     - Source block map must not overlap runtime_screen_layout because expansion writes there.
expand_screen_block_layout_to_background:
    ld (screen_block_catalog_ptr), hl
    ld (screen_block_map_ptr), de
    cp 4
    jp z, expand_screen_block_layout_4x4
    cp 2
    jp z, expand_screen_block_layout_2x2
    ret

expand_screen_block_layout_2x2:
    ld de, runtime_screen_layout
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
    ld de, runtime_screen_layout
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
    pop iy                    ; IY = destination block base in runtime_screen_layout

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
; @mideas:endblock id=runtime.screens.block_layout_expander

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
; @mideas:block id=runtime.screens.behavior_map_rebuild kind=routine owner=screens
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
; @mideas:endblock id=runtime.screens.behavior_map_rebuild
; @mideas:block id=runtime.screens.load_screen_stub kind=routine owner=screens
load_screen:
    ; Load screen (A = screen ID)
    ; TODO: Implement screen loading logic
    ret
; @mideas:endblock id=runtime.screens.load_screen_stub

; @mideas:block id=runtime.screens.load_screen_pantalla1_767095338721.loader kind=routine owner=screens roots=load_screen_pantalla1_767095338721
load_screen_pantalla1_767095338721:
    ; Load pantalla1 screen (fast direct port access)
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
    ; Clear hardware sprites on screen switch to avoid visual carry-over
    call call_clear_all_sprites_resident
    call call_update_sprites_to_vram_resident
    ; Rebuild mutable runtime screen background from RAM cache
    ld a, RESOURCE_ID_SCREEN_PANTALLA1_0_LAYOUT
    call resource_load_screen_layout_cached
    ld a, RESOURCE_ID_SCREEN_PANTALLA1_0_EFFECTS_LAYOUT
    call resource_load_effects_layout_cached
    ld a, RESOURCE_ID_BEHAVIOR_PANTALLA1_0_DATA
    call resource_load_behavior_map_cached
    ld a, RESOURCE_ID_SCREEN_PANTALLA1_0_INTERACTION_TYPE_MAP
    ld de, runtime_interaction_type_map
    call resource_load_to_ram_by_id
    ld a, RESOURCE_ID_SCREEN_PANTALLA1_0_INTERACTION_VALUE_MAP
    ld de, runtime_interaction_value_map
    call resource_load_to_ram_by_id
    ld a, RESOURCE_ID_SCREEN_PANTALLA1_0_INTERACTION_TARGET_MAP
    ld de, runtime_interaction_target_map
    call resource_load_to_ram_by_id
    ld a, 0
    ld (current_effect_zone_count), a
    or a
    jr z, .load_pantalla1_767095338721_zones_done
    ld a, RESOURCE_ID_SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE
    call resource_load_effect_zone_table_cached
.load_pantalla1_767095338721_zones_done:
    ; Transition->WorldLink reveal mode prepares runtime_screen_layout first,
    ; then GameFlow reveals it by raster after the world loader returns.
    ld a, (gameflow_reveal_world_after_load)
    or a
    jr nz, load_screen_pantalla1_767095338721_skip_vram_copy
    ; Now load screen layout (full 32x24) from runtime RAM buffer
    ld hl, runtime_screen_layout
    ld de, NAMETBL
    ld bc, RUNTIME_SCREEN_MAP_SIZE
    call FAST_LDIRVM           ; Fast VRAM write (direct port access)
load_screen_pantalla1_767095338721_skip_vram_copy:
    ld a, 0
    ld (current_screen_anim_group_count), a
    ld a, 1
    ld (current_screen_entity_count), a
    ld a, 2
    ld (current_screen_sprite_pattern_slots), a
    ld a, SCREEN_PANTALLA1_0_SUMMARY_FLAGS
    ld (current_screen_summary_flags), a
    ld a, SCREEN_PANTALLA1_0_BOSS_COUNT
    ld (current_screen_boss_count), a
    or a
    jp z, load_pantalla1_767095338721_boss_done
    ld a, RESOURCE_ID_SCREEN_PANTALLA1_0_BOSS_TABLE
    ld de, current_screen_boss_entry
    call resource_load_to_ram_by_id
    jr nc, .load_pantalla1_767095338721_boss_done_loaded
    xor a
    ld (current_screen_boss_count), a
    jp load_pantalla1_767095338721_boss_done
.load_pantalla1_767095338721_boss_done_loaded:
    ld hl, current_screen_boss_entry
    ld (current_screen_boss_table), hl
    ld a, #FF
    ld (current_screen_boss_table_bank), a
load_pantalla1_767095338721_boss_done:


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
; @mideas:endblock id=runtime.screens.load_screen_pantalla1_767095338721.loader


; ==================================================================
; END OF SCREENS
; ==================================================================


; --- End of Far Bank 8 — pad to 8KB boundary ---
BANK_8_USED_END:
    ds #8000 - $, #FF
    org FAR_BANK_8_ROM_START + #2000

; ##################################################################
; FAR BANK 9 — [#6000h-#8000h] FAR CODE: sprites
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank9 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-2). No far-to-far calls allowed.
; ##################################################################
FAR_BANK_9_ROM_START:

    org #6000

; ==================================================================
; SPRITE DATA
; File: sprites.asm
; Description: Sprite pattern and animation data
; Entities: 1
; Total Hardware Sprites (Layers): 32
; SAT Upload Sprites per frame: 2
; Sprite Pattern Preload Mode: STATIC_ALL_FRAMES
; Runtime Sprite Pattern Packs: 1
; ==================================================================
; SPRITE_DATA_ROM_DATA_GROUP: bank4
; (sprite pattern blobs are emitted in bank4 data zones for megarom builds)

; Unified pattern label for sprite 0
SPRITE_0_PATTERN EQU NEW_SPRITE_0_F0_LAYER1
SPRITE_0_PATTERN_BANK EQU ((SPRITE_0_PATTERN - #4000) / #2000)

SPRITE_PLACEHOLDER_PATTERN_BANK EQU ((SPRITE_PLACEHOLDER_PATTERN - #4000) / #2000)


; ==================================================================
; SPRITE ANIMATION METADATA TABLES
; ==================================================================

; Table: Sprite Asset Frame Counts
; Format: db frame_count
sprite_asset_frame_count_init:
    db 1 ; Sprite 0: New Sprite

; Table: Sprite Asset Drawable Layer Counts
; Format: db compact drawable layer count (minimum 1)
sprite_asset_layer_count_init:
    db 1 ; Sprite 0: New Sprite
SPRITE_ASSET_COUNT EQU 1
SPRITE_PATTERN_PRELOAD_MODE EQU 1

; Table: Sprite Asset Loop Flags
; Format: db flags (bit 1: 1=loop, 0=once)
sprite_loop_flags_init:
    db 2 ; Sprite 0: New Sprite

; Table: Sprite Asset Frame Pointer List Table
; Format: dw SPRITE_<id>_FRAME_PTRS
sprite_asset_frame_ptr_table:
    dw SPRITE_0_FRAME_PTRS

; Sprite 0: New Sprite frame pointers
SPRITE_0_FRAME_PTRS:
    dw 0

; ==================================================================
; DIRECTIONAL SPRITE LOOKUP TABLES
; Maps any sprite asset index to its directional variant index.
; If no directional variant exists, table points back to same index.
; ==================================================================
sprite_dir_left_table_init:
    db 0

sprite_dir_right_table_init:
    db 0

sprite_dir_up_table_init:
    db 0

sprite_dir_down_table_init:
    db 0

 
; ================================================================== 
; SPRITE CONFIGURATION TABLES 
; ================================================================== 

; Table: Entity Sprite Configuration 
; Format: db base_hw_sprite_index, layer_count 
entity_sprite_config_init:
    db 0, 1 ; Entity 0 (New Sprite)
    ds 62, 0 ; Padding

; Table: Entity -> Sprite Asset Index (ROM initial values)
; Copied to RAM entity_sprite_asset_index at init
; Format: db sprite_asset_index (#FF = none)
entity_sprite_asset_index_init:
    db #00 ; Entity 0 (New Sprite)
    ds 31, #FF ; Padding
SPRITE_MAX_ENTITY_LAYERS EQU 1  ; Max HW sprite layers per entity

; Table: Hardware Sprite Layer Colors (ROM initial values - copied to RAM at init)
; Format: db color_index
sprite_layer_colors_init:
    ; Entity 0 (New Sprite) layers:
    db 15 ; Layer 0
    ds 31, 0 ; Padding

; Table: Hardware Sprite Layer Y Offsets (ROM initial values - copied to RAM at init)
; Format: db signed_offset_y
sprite_layer_y_offsets_init:
    ; Entity 0 (New Sprite) layers:
    db 0 ; Layer 0
    ds 31, 0 ; Padding

; Table: SM Sprite Layer Colors (for Action_ChangeSprite runtime color update)
; Format: SPRITE_MAX_ENTITY_LAYERS bytes per sprite asset
; Entry[i*SPRITE_MAX_ENTITY_LAYERS + j] = color for HW sprite slot j of sprite i
SM_SpriteLayerColorTable_init:
    db 15 ; Sprite 0: New Sprite

; Table: SM Sprite Layer Y Offsets (for Action_ChangeSprite runtime layer alignment)
; Format: SPRITE_MAX_ENTITY_LAYERS bytes per sprite asset
; Entry[i*SPRITE_MAX_ENTITY_LAYERS + j] = signed Y offset for HW sprite slot j of sprite i
SM_SpriteLayerYOffsetTable_init:
    db 0 ; Sprite 0: New Sprite

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
    ld bc, 1
    ldir
    ld hl, sprite_asset_layer_count_init
    ld de, sprite_asset_layer_count
    ld bc, 1
    ldir
    ld hl, sprite_loop_flags_init
    ld de, sprite_loop_flags
    ld bc, 1
    ldir
    ld hl, sprite_dir_left_table_init
    ld de, sprite_dir_left_table
    ld bc, 1
    ldir
    ld hl, sprite_dir_right_table_init
    ld de, sprite_dir_right_table
    ld bc, 1
    ldir
    ld hl, sprite_dir_up_table_init
    ld de, sprite_dir_up_table
    ld bc, 1
    ldir
    ld hl, sprite_dir_down_table_init
    ld de, sprite_dir_down_table
    ld bc, 1
    ldir
    ld hl, SM_SpriteLayerColorTable_init
    ld de, SM_SpriteLayerColorTable
    ld bc, 1
    ldir
    ld hl, SM_SpriteLayerYOffsetTable_init
    ld de, SM_SpriteLayerYOffsetTable
    ld bc, 1
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
    xor a
    ld (sprite_placeholder_base_pattern_num), a
    ld a, #FF
    ld (current_sprite_pattern_pack_id), a
    xor a
    ld (active_sprite_count), a
    ret

load_sprite_patterns:
    call load_sprite_patterns_worldmap_1767095499385
    ret


SPRITE_PATTERN_PACK_INVALID EQU #FF
SPRITE_PATTERN_PACK_COUNT EQU 1

; World index -> runtime sprite pattern pack id
world_sprite_pattern_pack_table:
    db SPRITE_PATTERN_PACK_WORLDMAP_1767095499385_ID ; World 0: New Worldmap

; ------------------------------------------------------------------
; Runtime Sprite Pattern Pack: World "New Worldmap"
; Slots required: 2/64
; ------------------------------------------------------------------
SPRITE_PATTERN_PACK_WORLDMAP_1767095499385_ID EQU 0

sprite_asset_base_pattern_slot_worldmap_1767095499385:
    db 0 ; Sprite 0: New Sprite

load_sprite_patterns_worldmap_1767095499385:
    ld hl, sprite_asset_base_pattern_slot_worldmap_1767095499385
    ld de, sprite_asset_base_pattern_slot_runtime
    ld bc, SPRITE_ASSET_COUNT
    ldir
    ld a, 4
    ld (sprite_placeholder_base_pattern_num), a
    ; Sprite Asset 0: New Sprite frame 0 (1 layers)
    ld a, RESOURCE_ID_NEW_SPRITE_0_F0_LAYER1
    ld de, SPRPAT + (0 * 32)
    call resource_load_to_vram_by_id
    ; Placeholder sprite used by missing sprite refs
    ld a, RESOURCE_ID_SPRITE_PLACEHOLDER_PATTERN
    ld de, SPRPAT + (1 * 32)
    call resource_load_to_vram_by_id
    ld a, SPRITE_PATTERN_PACK_WORLDMAP_1767095499385_ID
    ld (current_sprite_pattern_pack_id), a
    ret


ensure_sprite_patterns_worldmap_1767095499385:
    ld a, (current_sprite_pattern_pack_id)
    cp SPRITE_PATTERN_PACK_WORLDMAP_1767095499385_ID
    ret z
    jp load_sprite_patterns_worldmap_1767095499385

; ------------------------------------------------------------------
; Generic sprite pattern dispatchers
; ------------------------------------------------------------------
load_sprite_patterns_by_pack_id:
    cp SPRITE_PATTERN_PACK_INVALID
    ret z
    cp SPRITE_PATTERN_PACK_WORLDMAP_1767095499385_ID
    jp z, load_sprite_patterns_worldmap_1767095499385
    ret

ensure_sprite_patterns_by_pack_id:
    cp SPRITE_PATTERN_PACK_INVALID
    ret z
    cp SPRITE_PATTERN_PACK_WORLDMAP_1767095499385_ID
    jp z, ensure_sprite_patterns_worldmap_1767095499385
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
; @mideas:block id=runtime.sprites.show_sprite_legacy kind=routine owner=sprites
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
; @mideas:endblock id=runtime.sprites.show_sprite_legacy

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
    ld bc, 8  ; Upload active sprite range + SAT end marker
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


; --- End of Far Bank 9 — pad to 8KB boundary ---
BANK_9_USED_END:
    ds #8000 - $, #FF
    org FAR_BANK_9_ROM_START + #2000

; ##################################################################
; FAR BANK 10 — [#6000h-#8000h] FAR CODE: animtiles
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank10 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-2). No far-to-far calls allowed.
; ##################################################################
FAR_BANK_10_ROM_START:

    org #6000

; @mideas:block id=runtime.animtiles.core kind=routine owner=animtiles roots=init_animated_tiles,update_animated_tiles,update_animated_tiles_vram,anim_upload_char_frame,set_animation_speed,register_animated_tile,get_tile_animation_frame
; ==================================================================
; ANIMATED TILES SYSTEM
; File: animtiles.asm
; Description: Background tile animation for water, lava, fire, etc.
; ==================================================================

; Auto-detected animated groups:
;   frame groups: 0
;   transform groups: 0

; ==================================================================
; ANIMATED TILES CONSTANTS
; ==================================================================

; Animation speeds (in frames)
ANIM_SPEED_SLOW         EQU 15      ; ~250ms (water)
ANIM_SPEED_MEDIUM       EQU 8       ; ~133ms (lava)
ANIM_SPEED_FAST         EQU 4       ; ~66ms (fire)

; Maximum animated tiles
MAX_ANIM_TILES          EQU 1
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
    ; Re-enables on exit unless a far trampoline still owns the mapper window.
    di

    ld a, (interrupt_in_progress)
    or a
    jp nz, .animtiles_vram_irq_done
    ld a, (far_call_irq_lock_depth)
    or a
    jp nz, .animtiles_vram_irq_done
    ei
.animtiles_vram_irq_done:
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
    ; No animated tile groups detected in project data
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
anim_group_empty_data:
    db #00


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
; @mideas:endblock id=runtime.animtiles.core


; --- End of Far Bank 10 — pad to 8KB boundary ---
BANK_10_USED_END:
    ds #8000 - $, #FF
    org FAR_BANK_10_ROM_START + #2000

; ##################################################################
; FAR BANK 11 — [#6000h-#8000h] FAR CODE: scroll
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank11 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-2). No far-to-far calls allowed.
; ##################################################################
FAR_BANK_11_ROM_START:

    org #6000

; @mideas:block id=runtime.scroll.core kind=routine owner=scroll roots=init_scroll_system,set_camera_position,move_camera,center_camera_on_entity,update_scroll,redraw_viewport,multiply_a_by_b
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
    ld a, 8
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
    
    ; Tile width is 8, shift right 3 times
    ld a, c
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
    ld a, 8
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
    
    ; Tile height is 8, shift right 3 times
    ld a, e
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
; @mideas:endblock id=runtime.scroll.core


; --- End of Far Bank 11 — pad to 8KB boundary ---
BANK_11_USED_END:
    ds #8000 - $, #FF
    org FAR_BANK_11_ROM_START + #2000

; ##################################################################
; FAR BANK 12 — [#6000h-#8000h] FAR CODE: worlds
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank12 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-2). No far-to-far calls allowed.
; ##################################################################
FAR_BANK_12_ROM_START:

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

; World: New Worldmap (worldmap_1767095499385)
WORLD_NEW_WORLDMAP_ID EQU 0
WORLD_NEW_WORLDMAP_SCREEN_COUNT EQU 1
WORLD_NEW_WORLDMAP_SCREEN_PANTALLA1_ID EQU 0

; ------------------------------------------------------------------
; ensure_music_for_world_id
; No music tracks are present, so world loading does not touch PSG music.
; ------------------------------------------------------------------
ensure_music_for_world_id:
    ret

; ==================================================================
; WORLD LOADING FUNCTIONS
; ==================================================================

; ------------------------------------------------------------------
; Load World: New Worldmap
; World ID: worldmap_1767095499385
; Screens: 1
; Start Screen Node: wmnode_1767095502796
; ------------------------------------------------------------------
; @mideas:block id=runtime.worlds.worldmap_1767095499385.loader kind=routine owner=worlds roots=load_world_worldmap_1767095499385
load_world_worldmap_1767095499385:
    ; Ensure default music policy for this world when unambiguous
    ld a, WORLD_NEW_WORLDMAP_ID
    call ensure_music_for_world_id
    ; Load runtime sprite patterns for this world
    ld a, WORLD_NEW_WORLDMAP_ID
    call call_ensure_sprite_patterns_for_world_id_resident
    ; Load start screen: pantalla1 (screenmap_1767095338721)
    call load_screen_pantalla1_767095338721_far

    ; Keep current_screen_engine from the screen loader so dialog/cutscene
    ; WorldLinks run the FakePlayer path instead of the Player runtime.
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
; @mideas:endblock id=runtime.worlds.worldmap_1767095499385.loader

; ==================================================================
; SCREEN TRANSITION FUNCTIONS
; ==================================================================

; World New Worldmap has no screen connections

; ------------------------------------------------------------------
; load_world_default: alias for the first world (required by megarom trampolines)
; ------------------------------------------------------------------
load_world_default:
    jp load_world_worldmap_1767095499385

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
    jp z, check_transition_world_worldmap_1767095499385
    ret

check_transition_world_worldmap_1767095499385:
    ret

; ==================================================================
; SCREEN EDGE LIMIT RUNTIME (SKIPPED - NO LIMIT_ON ENTITIES)
; ==================================================================

clamp_world_screen_limits:
    ret

; ==================================================================
; WORLD HELPER FUNCTIONS
; ==================================================================

; @mideas:block id=runtime.worlds.current_screen_helpers kind=routine owner=worlds
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
; @mideas:endblock id=runtime.worlds.current_screen_helpers

; ==================================================================
; END OF WORLDS
; ==================================================================


; --- End of Far Bank 12 — pad to 8KB boundary ---
BANK_12_USED_END:
    ds #8000 - $, #FF
    org FAR_BANK_12_ROM_START + #2000

; ##################################################################
; FAR BANK 13 — [#6000h-#8000h] FAR CODE: screens_code
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank13 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-2). No far-to-far calls allowed.
; ##################################################################
FAR_BANK_13_ROM_START:

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
BOSS_PLACEMENT_ENTRY_SIZE EQU 13
BOSS_PLACEMENT_FLAG_ENABLED EQU #01

SCREEN_PANTALLA1_0_ID EQU 0
SCREEN_PANTALLA1_0_LAYOUT_BANK EQU ((SCREEN_PANTALLA1_0_LAYOUT - #4000) / #2000)
SCREEN_PANTALLA1_0_BEHAVIOR_SOURCE EQU 0
BEHAVIOR_PANTALLA1_0_DATA_BANK EQU ((BEHAVIOR_PANTALLA1_0_DATA - #4000) / #2000)
SCREEN_PANTALLA1_0_CHAR_BEHAVIOR_TABLE_BANK EQU 0
SCREEN_PANTALLA1_0_CHAR_BEHAVIOR_TABLE_SIZE EQU 0
SCREEN_PANTALLA1_0_INTERACTION_TYPE_MAP_BANK EQU ((SCREEN_PANTALLA1_0_INTERACTION_TYPE_MAP - #4000) / #2000)
SCREEN_PANTALLA1_0_INTERACTION_VALUE_MAP_BANK EQU ((SCREEN_PANTALLA1_0_INTERACTION_VALUE_MAP - #4000) / #2000)
SCREEN_PANTALLA1_0_INTERACTION_TARGET_MAP_BANK EQU ((SCREEN_PANTALLA1_0_INTERACTION_TARGET_MAP - #4000) / #2000)
SCREEN_PANTALLA1_0_EFFECTS_LAYOUT_BANK EQU ((SCREEN_PANTALLA1_0_EFFECTS_LAYOUT - #4000) / #2000)
SCREEN_PANTALLA1_0_EFFECTS_LAYOUT_PRESENT EQU 1
SCREEN_PANTALLA1_0_EFFECTS_LAYOUT_SIZE EQU 768
SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE_BANK EQU ((SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE - #4000) / #2000)
SCREEN_PANTALLA1_0_EFFECT_ZONE_COUNT EQU 0
SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE_SIZE EQU 0
SCREEN_PANTALLA1_0_BOSS_TABLE_BANK EQU ((SCREEN_PANTALLA1_0_BOSS_TABLE - #4000) / #2000)
SCREEN_PANTALLA1_0_BOSS_COUNT EQU 0
SCREEN_PANTALLA1_0_BOSS_TABLE_SIZE EQU 0
SCREEN_PANTALLA1_0_BLOCK_LAYOUT_PRESENT EQU 0
SCREEN_PANTALLA1_0_BLOCK_LAYOUT_MODE EQU 0
SCREEN_PANTALLA1_0_BLOCK_CATALOG_BANK EQU 0
SCREEN_PANTALLA1_0_BLOCK_CATALOG_COUNT EQU 0
SCREEN_PANTALLA1_0_BLOCK_CATALOG_SIZE EQU 0
SCREEN_PANTALLA1_0_BLOCK_MAP_BANK EQU 0
SCREEN_PANTALLA1_0_BLOCK_MAP_WIDTH EQU 0
SCREEN_PANTALLA1_0_BLOCK_MAP_HEIGHT EQU 0
SCREEN_PANTALLA1_0_BLOCK_MAP_SIZE EQU 0
SCREEN_PANTALLA1_0_BLOCK_TOTAL_SIZE EQU 0
SCREEN_PANTALLA1_0_ANIM_GROUP_COUNT EQU 0
SCREEN_PANTALLA1_0_ENTITY_COUNT EQU 1
SCREEN_PANTALLA1_0_SPRITE_PATTERN_SLOTS EQU 2
SCREEN_PANTALLA1_0_MUSIC_IN_GAME EQU 0
SCREEN_PANTALLA1_0_SUMMARY_FLAGS EQU #04

; ==================================================================
; SCREEN RUNTIME SUMMARY TABLE
; anim_groups: animated tile groups visible in this screen
; entity_count: entity instances assigned to this screen
; sprite_pattern_slots: SPRPAT slots needed by this screen's entity runtime set
; flags bit0=music_in_game, bit1=has_hud, bit2=has_effects, bit3=has_anim_tiles
; ==================================================================

screen_runtime_summary_table:
    db 0, 1, 2, #04    ; Screen 0: pantalla1

; ==================================================================
; SCREEN MAP DATA
; ==================================================================

; [SCREEN_PANTALLA1_0_LAYOUT emitted in bank4 section]
; [SCREEN_PANTALLA1_0_EFFECTS_LAYOUT emitted in bank4 section]
; [SCREEN_PANTALLA1_0_EFFECT_ZONE_TABLE emitted in bank4 section]
; [SCREEN_PANTALLA1_0_BOSS_TABLE emitted in bank4 section]
; [SCREEN_PANTALLA1_0_INTERACTION_TYPE_MAP emitted in bank4 section]
; [SCREEN_PANTALLA1_0_INTERACTION_VALUE_MAP emitted in bank4 section]
; [SCREEN_PANTALLA1_0_INTERACTION_TARGET_MAP emitted in bank4 section]
; [BEHAVIOR_PANTALLA1_0_DATA emitted in bank4 section]


show_presentation_screen_image:
    ret

show_presentation_screen:
    ret

; [SCREEN LOADING FUNCTIONS moved to screen_loaders far module]


; --- End of Far Bank 13 — pad to 8KB boundary ---
BANK_13_USED_END:
    ds #8000 - $, #FF
    org FAR_BANK_13_ROM_START + #2000

; ##################################################################
; FAR BANK 14 — [#6000h-#8000h] FAR CODE: bosses
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank14 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-2). No far-to-far calls allowed.
; ##################################################################
FAR_BANK_14_ROM_START:

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

; @mideas:block id=runtime.boss.entry kind=routine owner=bosses roots=init_boss_system,update_boss_system
init_boss_system:
    xor a
    ld (boss_runtime_tick), a
    ld (boss_active), a
    ld (boss_health_lo), a
    ld (boss_health_hi), a
    ld (boss_hit_cooldown), a
    ld (boss_update_timer), a
    ld (boss_falling_blocks_active), a
    ld a, #FF
    ld (boss_data_bank), a
    ld a, 1
    ld (boss_update_interval), a
    ret

update_boss_system:
    ret

init_screen_boss_from_current_screen:
    ret
; @mideas:endblock id=runtime.boss.entry


; --- End of Far Bank 14 — pad to 8KB boundary ---
BANK_14_USED_END:
    ds #8000 - $, #FF
    org FAR_BANK_14_ROM_START + #2000

; ##################################################################
; FAR BANK 15 — [#6000h-#8000h] FAR CODE: hud
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank15 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-2). No far-to-far calls allowed.
; ##################################################################
FAR_BANK_15_ROM_START:

    org #6000

; ==================================================================
; HUD SYSTEM (EMPTY - No HUD elements defined)
; ==================================================================
render_hud:
    ret
force_render_hud:
    ret
; @mideas:block id=runtime.hud.empty_update_stubs kind=routine owner=hud
update_hud_score:
    ret
update_hud_lives:
    ret
; @mideas:endblock id=runtime.hud.empty_update_stubs


; --- End of Far Bank 15 — pad to 8KB boundary ---
BANK_15_USED_END:
    ds #8000 - $, #FF
    org FAR_BANK_15_ROM_START + #2000

; ##################################################################
; FAR BANK 16 — [#6000h-#8000h] FAR CODE: patterns_code
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank16 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-2). No far-to-far calls allowed.
; ##################################################################
FAR_BANK_16_ROM_START:

    org #6000

; ==================================================================
; PATTERN DATA (EMPTY - NO TILES DETECTED)
; File: patterns.asm
; ==================================================================

; No tiles detected in project - file generated as placeholder


; --- End of Far Bank 16 — pad to 8KB boundary ---
BANK_16_USED_END:
    ds #8000 - $, #FF
    org FAR_BANK_16_ROM_START + #2000

; ##################################################################
; FAR BANK 17 — [#6000h-#8000h] FAR CODE: colors_code
; Accessed ONLY via trampolines in bank 0 (entrypoint_far labels).
; At runtime: bank0 saves P1, maps bank17 to P1,
; calls routine, then restores P1.
; NOTE: routines in this bank MUST only call code in bank 0 or
;       primary banks (1-2). No far-to-far calls allowed.
; ##################################################################
FAR_BANK_17_ROM_START:

    org #6000

; ==================================================================
; COLOR DATA (EMPTY - NO TILES DETECTED)
; File: colors.asm
; ==================================================================

; No tiles detected in project - file generated as placeholder


; --- End of Far Bank 17 — pad to 8KB boundary ---
BANK_17_USED_END:
    ds #8000 - $, #FF
    org FAR_BANK_17_ROM_START + #2000
    end                 ; End of assembly
