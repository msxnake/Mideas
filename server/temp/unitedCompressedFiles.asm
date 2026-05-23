; File: unitedFiles.asm
; ==================================================================
; Mideas MSX2 SCREEN 4 tile backend
; Project: pp1
; Screen mode: SCREEN 4 (Graphics II)
; ROM Mode: megarom
; Mapper Target: konami
; Auto MegaROM: No
; MSX2 MegaROM Path: Konami 8K fixed-bank0 compatibility
; ROM mode requested: megarom
; Mapper requested: konami
; ==================================================================

; [[[MIDEAS_ARTIFACT:project_slice.json:BEGIN]]]
; {
;   "scope": "msx2_screen4_project_slice",
;   "projectName": "pp1",
;   "backend": "msx2-screen4-pattern",
;   "screenMode": "SCREEN 4 (Graphics II)",
;   "romMode": "megarom",
;   "mapper": "konami",
;   "entryPoints": {
;     "gameFlowId": "gameflow_1779560142630",
;     "gameFlowName": "Main",
;     "worldIds": [
;       "worldmap_1779560130702"
;     ],
;     "screenIds": [
;       "msx2screen_1779559974838"
;     ]
;   },
;   "includedAssets": [
;     {
;       "type": "gameflow",
;       "id": "gameflow_1779560142630",
;       "name": "Main",
;       "reason": "Active MSX2 GameFlow entry point"
;     },
;     {
;       "type": "msx2screen_tile",
;       "id": "tile_1779559974838_0",
;       "name": "Blank",
;       "ownerScreenId": "msx2screen_1779559974838",
;       "ownerWorldIds": [
;         "worldmap_1779560130702"
;       ],
;       "reason": "Tile used by reachable native MSX2 screen"
;     },
;     {
;       "type": "msx2screen_tile",
;       "id": "tile_1779559974838_1",
;       "name": "Platform",
;       "ownerScreenId": "msx2screen_1779559974838",
;       "ownerWorldIds": [
;         "worldmap_1779560130702"
;       ],
;       "reason": "Tile used by reachable native MSX2 screen"
;     },
;     {
;       "type": "msx2screen",
;       "id": "msx2screen_1779559974838",
;       "name": "New MSX2 SCREEN 4 Room",
;       "reason": "Referenced by world worldmap_1779560130702",
;       "ownerWorldIds": [
;         "worldmap_1779560130702"
;       ]
;     },
;     {
;       "type": "msx2sprite",
;       "id": "msx2sprite_1779556659727",
;       "name": "New MSX2 Metasprite",
;       "reason": "Referenced by reachable MSX2 entity or sprite fallback",
;       "ownerWorldIds": []
;     },
;     {
;       "type": "worldmap",
;       "id": "worldmap_1779560130702",
;       "name": "New Worldmap",
;       "reason": "GameFlow WorldLink node gfn_1779560146006"
;     }
;   ],
;   "excludedAssets": [
;     {
;       "type": "code",
;       "id": "code_new_MyMSXGame_main_1779556555705_3116q",
;       "name": "main.asm",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "code",
;       "id": "code_new_MyMSXGame_data_graphics_1779556555705_v4e2d",
;       "name": "data/graphics.asm",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "code",
;       "id": "code_new_MyMSXGame_data_components_1779556555705_1837y",
;       "name": "data/components.asm",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "code",
;       "id": "code_new_MyMSXGame_code_behaviors_1779556555705_te30m",
;       "name": "code/behaviors.asm",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "msx2hudfont",
;       "id": "msx2hudfont_1779557282139",
;       "name": "New MSX2 HUD Font",
;       "reason": "Not reachable from active MSX2 GameFlow/world slice"
;     },
;     {
;       "type": "msx2bitmaproom",
;       "id": "msx2bitmaproom_1779560299984",
;       "name": "New MSX2 SCREEN 4 Bitmap Room",
;       "reason": "Not reachable from active MSX2 GameFlow/world slice"
;     },
;     {
;       "type": "entitytemplate",
;       "id": "tpl_msx2_player",
;       "name": "MSX2 Player Platform",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "entitytemplate",
;       "id": "tpl_msx2_player_maze",
;       "name": "MSX2 Player Maze",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "entitytemplate",
;       "id": "tpl_msx2_enemy_static",
;       "name": "MSX2 Enemy",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "entitytemplate",
;       "id": "tpl_msx2_ghost_maze",
;       "name": "MSX2 Ghost Maze",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "entitytemplate",
;       "id": "tpl_msx2_patrol_x",
;       "name": "MSX2 Patrol X",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "entitytemplate",
;       "id": "tpl_msx2_patrol_y",
;       "name": "MSX2 Patrol Y",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "entitytemplate",
;       "id": "tpl_msx2_hazard",
;       "name": "MSX2 Hazard",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "entitytemplate",
;       "id": "tpl_msx2_collectible",
;       "name": "MSX2 Collectible",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "entitytemplate",
;       "id": "tpl_msx2_door",
;       "name": "MSX2 Door",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "entitytemplate",
;       "id": "tpl_msx2_checkpoint",
;       "name": "MSX2 Checkpoint",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "entitytemplate",
;       "id": "tpl_msx2_galaxian_player",
;       "name": "Galaxian Player",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "entitytemplate",
;       "id": "tpl_msx2_galaxian_alien_formation",
;       "name": "Galaxian Alien",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "entitytemplate",
;       "id": "tpl_msx2_galaxian_laser",
;       "name": "Galaxian Laser",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "entitytemplate",
;       "id": "tpl_msx2_galaxian_wave_controller",
;       "name": "Galaxian Wave",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "entitytemplate",
;       "id": "tpl_msx2_pong_paddle",
;       "name": "MSX2 Pong Paddle",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "entitytemplate",
;       "id": "tpl_msx2_pong_2p_left_paddle",
;       "name": "MSX2 Pong 2P Left Paddle",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "entitytemplate",
;       "id": "tpl_msx2_pong_ball",
;       "name": "MSX2 Pong Ball",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "entitytemplate",
;       "id": "tpl_msx2_arkanoid_brick",
;       "name": "MSX2 Arkanoid Brick",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "entitytemplate",
;       "id": "tpl_msx2_snake_head",
;       "name": "MSX2 Snake Head",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "entitytemplate",
;       "id": "tpl_msx2_snake_segment",
;       "name": "MSX2 Snake Segment",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "entitytemplate",
;       "id": "tpl_msx2_snake_food",
;       "name": "MSX2 Snake Food",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "componentdefinition",
;       "id": "msx2_transform",
;       "name": "MSX2 Position",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "componentdefinition",
;       "id": "msx2_hardware_sprite",
;       "name": "MSX2 Render",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "componentdefinition",
;       "id": "msx2_player_control",
;       "name": "MSX2 Player Control",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "componentdefinition",
;       "id": "msx2_movement",
;       "name": "MSX2 Movement",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "componentdefinition",
;       "id": "msx2_collision",
;       "name": "MSX2 Collision",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "componentdefinition",
;       "id": "msx2_collectible",
;       "name": "MSX2 Collectible",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "componentdefinition",
;       "id": "msx2_door_exit",
;       "name": "MSX2 Door Exit",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "componentdefinition",
;       "id": "msx2_hazard",
;       "name": "MSX2 Hazard",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "componentdefinition",
;       "id": "msx2_ai",
;       "name": "MSX2 AI",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "componentdefinition",
;       "id": "msx2_animation",
;       "name": "MSX2 Animation",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "componentdefinition",
;       "id": "msx2_health",
;       "name": "MSX2 Health",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "componentdefinition",
;       "id": "msx2_damage",
;       "name": "MSX2 Damage",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "componentdefinition",
;       "id": "msx2_spawn",
;       "name": "MSX2 Spawn",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "componentdefinition",
;       "id": "msx2_checkpoint",
;       "name": "MSX2 Checkpoint",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "componentdefinition",
;       "id": "msx2_screen_transition",
;       "name": "MSX2 Screen Transition",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "componentdefinition",
;       "id": "msx2_inventory",
;       "name": "MSX2 Inventory",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "componentdefinition",
;       "id": "msx2_score",
;       "name": "MSX2 Score",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "componentdefinition",
;       "id": "msx2_timer",
;       "name": "MSX2 Timer",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "componentdefinition",
;       "id": "msx2_platform",
;       "name": "MSX2 Platform",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "componentdefinition",
;       "id": "msx2_shooter",
;       "name": "MSX2 Shooter",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "componentdefinition",
;       "id": "msx2_projectile",
;       "name": "MSX2 Projectile",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "componentdefinition",
;       "id": "msx2_formation",
;       "name": "MSX2 Formation",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "componentdefinition",
;       "id": "msx2_attack_pattern",
;       "name": "MSX2 Attack Pattern",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "componentdefinition",
;       "id": "msx2_attack_wave",
;       "name": "MSX2 Attack Wave",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "componentdefinition",
;       "id": "msx2_wave",
;       "name": "MSX2 Wave",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "componentdefinition",
;       "id": "msx2_lives",
;       "name": "MSX2 Lives",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "componentdefinition",
;       "id": "control_2_players",
;       "name": "MSX2 2P Controls",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "componentdefinition",
;       "id": "msx2_paddle",
;       "name": "MSX2 Paddle",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "componentdefinition",
;       "id": "msx2_ball",
;       "name": "MSX2 Ball",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "componentdefinition",
;       "id": "msx2_brick",
;       "name": "MSX2 Brick",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "componentdefinition",
;       "id": "msx2_char_render",
;       "name": "MSX2 Char Render",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "componentdefinition",
;       "id": "msx2_snake",
;       "name": "MSX2 Snake",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "componentdefinition",
;       "id": "msx2_snake_segment",
;       "name": "MSX2 Snake Segment",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "componentdefinition",
;       "id": "msx2_scroll",
;       "name": "MSX2 Scroll",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     }
;   ],
;   "includedRuntimeModules": [
;     "runtime.msx2.boot",
;     "runtime.msx2.screen4.vdp",
;     "runtime.msx2.input",
;     "runtime.msx2.screen_loader",
;     "runtime.msx2.layers.collision",
;     "runtime.msx2.layers.effects",
;     "runtime.msx2.layers.behavior",
;     "runtime.msx2.hardware_sprites",
;     "runtime.msx2.mapper.konami8k"
;   ],
;   "excludedRuntimeModules": [
;     {
;       "id": "runtime.msx2.projectiles",
;       "reason": "Enabled only by shooter-horizontal movement"
;     },
;     {
;       "id": "runtime.msx2.stage_banner",
;       "reason": "Enabled only by shooter wave flow"
;     },
;     {
;       "id": "runtime.msx2.scroll.vertical",
;       "reason": "Enabled only when reachable screens request scroll"
;     },
;     {
;       "id": "runtime.msx2.snake_char",
;       "reason": "Enabled only by snake-char movement"
;     }
;   ],
;   "worldPackageSummary": [
;     {
;       "worldId": "worldmap_1779560130702",
;       "assetCount": 2,
;       "screenCount": 1,
;       "estimatedBytes": 1879,
;       "estimated8kBanks": 1,
;       "bankClassBytes": [
;         {
;           "id": "world.screen",
;           "usedBytes": 1568
;         },
;         {
;           "id": "world.manifest",
;           "usedBytes": 311
;         }
;       ]
;     }
;   ],
;   "assetStoragePolicy": [
;     {
;       "type": "gameflow",
;       "id": "gameflow_1779560142630",
;       "name": "Main",
;       "rawBytes": 461,
;       "storedBytesEstimate": 461,
;       "accessPattern": "manifest_read",
;       "mutable": false,
;       "decision": "ROM_RAW",
;       "reason": "Included by the active MSX2 project slice; precise backend packing remains allocator-owned."
;     },
;     {
;       "type": "msx2screen_tile",
;       "id": "tile_1779559974838_0",
;       "name": "Blank",
;       "ownerScreenId": "msx2screen_1779559974838",
;       "ownerWorldIds": [
;         "worldmap_1779560130702"
;       ],
;       "rawBytes": 64,
;       "storedBytesEstimate": 64,
;       "accessPattern": "compiled_into_owner_screen",
;       "mutable": false,
;       "decision": "INHERIT_OWNER_SCREEN_POLICY",
;       "reason": "Tile bytes are emitted as part of the reachable SCREEN 4 room graphics."
;     },
;     {
;       "type": "msx2screen_tile",
;       "id": "tile_1779559974838_1",
;       "name": "Platform",
;       "ownerScreenId": "msx2screen_1779559974838",
;       "ownerWorldIds": [
;         "worldmap_1779560130702"
;       ],
;       "rawBytes": 64,
;       "storedBytesEstimate": 64,
;       "accessPattern": "compiled_into_owner_screen",
;       "mutable": false,
;       "decision": "INHERIT_OWNER_SCREEN_POLICY",
;       "reason": "Tile bytes are emitted as part of the reachable SCREEN 4 room graphics."
;     },
;     {
;       "type": "msx2screen",
;       "id": "msx2screen_1779559974838",
;       "name": "New MSX2 SCREEN 4 Room",
;       "ownerWorldIds": [
;         "worldmap_1779560130702"
;       ],
;       "rawBytes": 1568,
;       "storedBytesEstimate": 1568,
;       "accessPattern": "mixed_load_to_vram_and_runtime_read",
;       "mutable": false,
;       "decision": "MIXED_ROM_ZX0_CANDIDATE_TO_VRAM_AND_ROM_RAW",
;       "reason": "Reachable SCREEN 4 room: graphics are loaded to VRAM; layers/spawns stay as ROM/runtime data.",
;       "parts": [
;         {
;           "name": "nameTable",
;           "rawBytes": 768,
;           "accessPattern": "load_to_vram",
;           "decision": "ROM_ZX0_CANDIDATE_TO_VRAM"
;         },
;         {
;           "name": "patterns",
;           "rawBytes": 112,
;           "accessPattern": "load_to_vram",
;           "decision": "ROM_RAW_TO_VRAM"
;         },
;         {
;           "name": "colors",
;           "rawBytes": 112,
;           "accessPattern": "load_to_vram",
;           "decision": "ROM_RAW_TO_VRAM"
;         },
;         {
;           "name": "runtimeLayersAndSpawns",
;           "rawBytes": 576,
;           "accessPattern": "runtime_read",
;           "decision": "ROM_RAW"
;         }
;       ]
;     },
;     {
;       "type": "msx2sprite",
;       "id": "msx2sprite_1779556659727",
;       "name": "New MSX2 Metasprite",
;       "ownerWorldIds": [],
;       "rawBytes": 80,
;       "storedBytesEstimate": 80,
;       "accessPattern": "load_to_vram",
;       "mutable": false,
;       "decision": "ROM_RAW_TO_VRAM",
;       "reason": "Referenced MSX2 hardware sprite source; sprite patterns/colors are loaded to VRAM/SAT data.",
;       "superSpriteLayout": "single16",
;       "superSpriteParts": [
;         {
;           "label": "A",
;           "offsetX": 0,
;           "offsetY": 0,
;           "width": 16,
;           "height": 16
;         }
;       ],
;       "metaspriteCells": {
;         "columns": 1,
;         "rows": 1,
;         "count": 1
;       },
;       "hardwareLayerCount": 1,
;       "emittedHardwareLayerCount": 1,
;       "worstScanlineHardwareSprites": 1,
;       "scanlineLimit": 16,
;       "overScanlineLimit": false,
;       "parts": [
;         {
;           "name": "patterns",
;           "rawBytes": 64,
;           "accessPattern": "load_to_vram",
;           "decision": "ROM_RAW_TO_VRAM"
;         },
;         {
;           "name": "lineColors",
;           "rawBytes": 16,
;           "accessPattern": "load_to_vram",
;           "decision": "ROM_RAW_TO_VRAM"
;         }
;       ]
;     },
;     {
;       "type": "worldmap",
;       "id": "worldmap_1779560130702",
;       "name": "New Worldmap",
;       "rawBytes": 311,
;       "storedBytesEstimate": 311,
;       "accessPattern": "manifest_read",
;       "mutable": false,
;       "decision": "ROM_RAW",
;       "reason": "Included by the active MSX2 project slice; precise backend packing remains allocator-owned."
;     }
;   ],
;   "logicalBankBudget": {
;     "bankSizeBytes": 8192,
;     "warningThresholdBytes": 7372,
;     "totalPayloadBytes": 2420,
;     "estimatedMinimumBanks": 1,
;     "estimatedPackedBankCount": 1,
;     "estimatedPackedBanks": [
;       {
;         "bankIndex": 0,
;         "usedBytes": 2420,
;         "freeBytes": 5772,
;         "warning": false,
;         "overBudgetBytes": 0,
;         "packages": [
;           {
;             "id": "msx2screen.msx2screen_1779559974838",
;             "usedBytes": 1568,
;             "recommendedBankClass": "world.screen"
;           },
;           {
;             "id": "gameflow.gameflow_1779560142630",
;             "usedBytes": 461,
;             "recommendedBankClass": "world.manifest"
;           },
;           {
;             "id": "worldmap.worldmap_1779560130702",
;             "usedBytes": 311,
;             "recommendedBankClass": "world.manifest"
;           },
;           {
;             "id": "msx2sprite.msx2sprite_1779556659727",
;             "usedBytes": 80,
;             "recommendedBankClass": "world.graphics.sprite"
;           }
;         ]
;       }
;     ],
;     "overBudgetPackages": [],
;     "warningPackages": [],
;     "warningPackedBanks": [],
;     "bankClassSummary": [
;       {
;         "id": "world.screen",
;         "packageCount": 1,
;         "usedBytes": 1568,
;         "estimatedMinimumBanks": 1,
;         "warningPackageCount": 0,
;         "overBudgetPackageCount": 0,
;         "largestPackage": {
;           "id": "msx2screen.msx2screen_1779559974838",
;           "usedBytes": 1568
;         }
;       },
;       {
;         "id": "world.manifest",
;         "packageCount": 2,
;         "usedBytes": 772,
;         "estimatedMinimumBanks": 1,
;         "warningPackageCount": 0,
;         "overBudgetPackageCount": 0,
;         "largestPackage": {
;           "id": "gameflow.gameflow_1779560142630",
;           "usedBytes": 461
;         }
;       },
;       {
;         "id": "world.graphics.sprite",
;         "packageCount": 1,
;         "usedBytes": 80,
;         "estimatedMinimumBanks": 1,
;         "warningPackageCount": 0,
;         "overBudgetPackageCount": 0,
;         "largestPackage": {
;           "id": "msx2sprite.msx2sprite_1779556659727",
;           "usedBytes": 80
;         }
;       }
;     ],
;     "recoveryRecommendations": [
;       {
;         "severity": "ok",
;         "target": "logicalBankBudget",
;         "reason": "All estimated packages fit below warning threshold.",
;         "action": "No recovery needed before the final allocator pass."
;       }
;     ],
;     "recoveryPlan": [
;       {
;         "order": 1,
;         "id": "repack_final_sizes",
;         "status": "not_needed",
;         "trigger": "estimated packed bank reaches warning threshold or any package is over one 8 KB window",
;         "appliesTo": [],
;         "action": "Re-run first-fit-decreasing with final stored sizes after ZX0 policy decisions."
;       },
;       {
;         "order": 2,
;         "id": "split_world_packages",
;         "status": "not_needed",
;         "trigger": "independently addressable world/screen/sprite package is too large or near the bank limit",
;         "appliesTo": [],
;         "action": "Split the logical world package across additional physical world data banks."
;       },
;       {
;         "order": 3,
;         "id": "move_cold_readonly_data",
;         "status": "not_needed",
;         "trigger": "resident or manifest data creates bank pressure",
;         "appliesTo": [],
;         "action": "Move cold read-only tables out of resident/core placement and into world data banks."
;       },
;       {
;         "order": 4,
;         "id": "selective_zx0",
;         "status": "not_needed",
;         "trigger": "large load-to-VRAM screen, pattern, color, tilemap, or sprite data creates pressure",
;         "appliesTo": [],
;         "action": "Try ZX0 only for large load-to-VRAM resources; keep runtime lookup data raw."
;       },
;       {
;         "order": 5,
;         "id": "keep_hot_runtime_raw",
;         "status": "enforced",
;         "trigger": "runtime table is tiny, mutable, or accessed in hot loops",
;         "appliesTo": [
;           "runtime lookup tables",
;           "entity instances",
;           "state-machine runtime state"
;         ],
;         "action": "Do not solve ROM pressure by decompressing whole worlds into RAM or by compressing hot per-frame tables."
;       },
;       {
;         "order": 6,
;         "id": "world_special_code_bank",
;         "status": "not_needed",
;         "trigger": "rare behavior or boss-specific code contributes to resident pressure",
;         "appliesTo": [],
;         "action": "Move rare behavior behind a world special-code bank and far-call boundary."
;       },
;       {
;         "order": 7,
;         "id": "split_large_payload_chunks",
;         "status": "not_needed",
;         "trigger": "single screen/graphics payload cannot fit one mapper window as a unit",
;         "appliesTo": [],
;         "action": "Split large screen or graphics payloads into loader-addressable chunks only when each chunk is independently referenced."
;       },
;       {
;         "order": 8,
;         "id": "fail_actionable_report",
;         "status": "ready",
;         "trigger": "all deterministic recovery attempts still leave an over-budget unit",
;         "appliesTo": [],
;         "action": "Fail before Glass with largest contributors and concrete authoring changes."
;       }
;     ],
;     "packages": [
;       {
;         "id": "gameflow.gameflow_1779560142630",
;         "type": "gameflow",
;         "sourceId": "gameflow_1779560142630",
;         "recommendedBankClass": "world.manifest",
;         "usedBytes": 461,
;         "freeBytesIfAlone": 7731,
;         "warning": false,
;         "overBudgetBytes": 0,
;         "canSplit": false
;       },
;       {
;         "id": "msx2screen.msx2screen_1779559974838",
;         "type": "msx2screen",
;         "sourceId": "msx2screen_1779559974838",
;         "recommendedBankClass": "world.screen",
;         "usedBytes": 1568,
;         "freeBytesIfAlone": 6624,
;         "warning": false,
;         "overBudgetBytes": 0,
;         "canSplit": true
;       },
;       {
;         "id": "msx2sprite.msx2sprite_1779556659727",
;         "type": "msx2sprite",
;         "sourceId": "msx2sprite_1779556659727",
;         "recommendedBankClass": "world.graphics.sprite",
;         "usedBytes": 80,
;         "freeBytesIfAlone": 8112,
;         "warning": false,
;         "overBudgetBytes": 0,
;         "canSplit": true
;       },
;       {
;         "id": "worldmap.worldmap_1779560130702",
;         "type": "worldmap",
;         "sourceId": "worldmap_1779560130702",
;         "recommendedBankClass": "world.manifest",
;         "usedBytes": 311,
;         "freeBytesIfAlone": 7881,
;         "warning": false,
;         "overBudgetBytes": 0,
;         "canSplit": false
;       }
;     ],
;     "note": "Logical pre-pack budget by asset package with first-fit-decreasing estimate. Final allocator still decides physical Konami 8K placement after compression."
;   },
;   "ramBudget": {
;     "scope": "msx2_screen4_ram_budget",
;     "start": "#C000",
;     "end": "#C314",
;     "limit": "#F300",
;     "usableBytes": 13056,
;     "usedBytes": 788,
;     "freeBytes": 12268,
;     "warningThresholdBytes": 11097,
;     "maxPersistentScreens": 65,
;     "reachableScreens": 1,
;     "status": "ok",
;     "sections": [
;       {
;         "id": "runtime.globals_player_input",
;         "start": "#C000",
;         "end": "#C040",
;         "bytes": 64,
;         "mutable": true,
;         "reason": "Fixed hot runtime state for player/input/global counters."
;       },
;       {
;         "id": "runtime.snake_body_cache",
;         "start": "#C040",
;         "end": "#C080",
;         "bytes": 64,
;         "mutable": true,
;         "reason": "Fixed-size cache reserved only for snake-char body state."
;       },
;       {
;         "id": "runtime.persistent_effect_layers",
;         "start": "#C080",
;         "end": "#C140",
;         "bytes": 192,
;         "mutable": true,
;         "count": 1,
;         "bytesPerScreen": 192,
;         "reason": "One mutable effects layer per reachable SCREEN 4 room."
;       },
;       {
;         "id": "runtime.effects_scratch",
;         "start": "#C200",
;         "end": "#C2C0",
;         "bytes": 192,
;         "mutable": true,
;         "reason": "Temporary effect layer buffer for screens without persistent slot or loaders."
;       },
;       {
;         "id": "runtime.enemy_pool",
;         "start": "#C2C0",
;         "end": "#C314",
;         "bytes": 84,
;         "mutable": true,
;         "slots": 12,
;         "reason": "Active enemy/hazard runtime arrays; ROM keeps enemy templates."
;       }
;     ],
;     "recommendations": [
;       {
;         "severity": "ok",
;         "target": "runtimeRam",
;         "reason": "Estimated runtime RAM fits below warning threshold.",
;         "action": "No RAM recovery needed for this project slice."
;       }
;     ],
;     "note": "RAM budget reports mutable runtime state only. ROM and VRAM storage are reported separately."
;   },
;   "includedComponents": [],
;   "includedMovementProfiles": [],
;   "includedAttackProfiles": [],
;   "includedStateMachines": [],
;   "estimatedRamNeeds": {
;     "start": "#C000",
;     "end": "#C314",
;     "limit": "#F300",
;     "usedBytes": 788,
;     "freeBytes": 12268,
;     "persistentEffectBytes": 192,
;     "enemyRuntimeBytes": 84,
;     "ramBudgetStatus": "ok"
;   },
;   "estimatedRomNeeds": {
;     "reachableMsx2ScreenCount": 1,
;     "reachableMsx2SpriteCount": 1,
;     "reachableWorldCount": 1,
;     "usesKonamiDataBank": true,
;     "romPayloadBytesEstimate": 2420,
;     "estimated8kBanksForPayload": 1,
;     "warningThresholdBytesPerBank": 7372,
;     "note": "Slice reports reachability and storage policy estimates; final bank placement remains allocator-owned."
;   }
; }
;
; [[[MIDEAS_ARTIFACT:project_slice.json:END]]]

; [[[MIDEAS_ARTIFACT:asset_storage_policy.json:BEGIN]]]
; [
;   {
;     "type": "gameflow",
;     "id": "gameflow_1779560142630",
;     "name": "Main",
;     "rawBytes": 461,
;     "storedBytesEstimate": 461,
;     "accessPattern": "manifest_read",
;     "mutable": false,
;     "decision": "ROM_RAW",
;     "reason": "Included by the active MSX2 project slice; precise backend packing remains allocator-owned."
;   },
;   {
;     "type": "msx2screen_tile",
;     "id": "tile_1779559974838_0",
;     "name": "Blank",
;     "ownerScreenId": "msx2screen_1779559974838",
;     "ownerWorldIds": [
;       "worldmap_1779560130702"
;     ],
;     "rawBytes": 64,
;     "storedBytesEstimate": 64,
;     "accessPattern": "compiled_into_owner_screen",
;     "mutable": false,
;     "decision": "INHERIT_OWNER_SCREEN_POLICY",
;     "reason": "Tile bytes are emitted as part of the reachable SCREEN 4 room graphics."
;   },
;   {
;     "type": "msx2screen_tile",
;     "id": "tile_1779559974838_1",
;     "name": "Platform",
;     "ownerScreenId": "msx2screen_1779559974838",
;     "ownerWorldIds": [
;       "worldmap_1779560130702"
;     ],
;     "rawBytes": 64,
;     "storedBytesEstimate": 64,
;     "accessPattern": "compiled_into_owner_screen",
;     "mutable": false,
;     "decision": "INHERIT_OWNER_SCREEN_POLICY",
;     "reason": "Tile bytes are emitted as part of the reachable SCREEN 4 room graphics."
;   },
;   {
;     "type": "msx2screen",
;     "id": "msx2screen_1779559974838",
;     "name": "New MSX2 SCREEN 4 Room",
;     "ownerWorldIds": [
;       "worldmap_1779560130702"
;     ],
;     "rawBytes": 1568,
;     "storedBytesEstimate": 1568,
;     "accessPattern": "mixed_load_to_vram_and_runtime_read",
;     "mutable": false,
;     "decision": "MIXED_ROM_ZX0_CANDIDATE_TO_VRAM_AND_ROM_RAW",
;     "reason": "Reachable SCREEN 4 room: graphics are loaded to VRAM; layers/spawns stay as ROM/runtime data.",
;     "parts": [
;       {
;         "name": "nameTable",
;         "rawBytes": 768,
;         "accessPattern": "load_to_vram",
;         "decision": "ROM_ZX0_CANDIDATE_TO_VRAM"
;       },
;       {
;         "name": "patterns",
;         "rawBytes": 112,
;         "accessPattern": "load_to_vram",
;         "decision": "ROM_RAW_TO_VRAM"
;       },
;       {
;         "name": "colors",
;         "rawBytes": 112,
;         "accessPattern": "load_to_vram",
;         "decision": "ROM_RAW_TO_VRAM"
;       },
;       {
;         "name": "runtimeLayersAndSpawns",
;         "rawBytes": 576,
;         "accessPattern": "runtime_read",
;         "decision": "ROM_RAW"
;       }
;     ]
;   },
;   {
;     "type": "msx2sprite",
;     "id": "msx2sprite_1779556659727",
;     "name": "New MSX2 Metasprite",
;     "ownerWorldIds": [],
;     "rawBytes": 80,
;     "storedBytesEstimate": 80,
;     "accessPattern": "load_to_vram",
;     "mutable": false,
;     "decision": "ROM_RAW_TO_VRAM",
;     "reason": "Referenced MSX2 hardware sprite source; sprite patterns/colors are loaded to VRAM/SAT data.",
;     "superSpriteLayout": "single16",
;     "superSpriteParts": [
;       {
;         "label": "A",
;         "offsetX": 0,
;         "offsetY": 0,
;         "width": 16,
;         "height": 16
;       }
;     ],
;     "metaspriteCells": {
;       "columns": 1,
;       "rows": 1,
;       "count": 1
;     },
;     "hardwareLayerCount": 1,
;     "emittedHardwareLayerCount": 1,
;     "worstScanlineHardwareSprites": 1,
;     "scanlineLimit": 16,
;     "overScanlineLimit": false,
;     "parts": [
;       {
;         "name": "patterns",
;         "rawBytes": 64,
;         "accessPattern": "load_to_vram",
;         "decision": "ROM_RAW_TO_VRAM"
;       },
;       {
;         "name": "lineColors",
;         "rawBytes": 16,
;         "accessPattern": "load_to_vram",
;         "decision": "ROM_RAW_TO_VRAM"
;       }
;     ]
;   },
;   {
;     "type": "worldmap",
;     "id": "worldmap_1779560130702",
;     "name": "New Worldmap",
;     "rawBytes": 311,
;     "storedBytesEstimate": 311,
;     "accessPattern": "manifest_read",
;     "mutable": false,
;     "decision": "ROM_RAW",
;     "reason": "Included by the active MSX2 project slice; precise backend packing remains allocator-owned."
;   }
; ]
;
; [[[MIDEAS_ARTIFACT:asset_storage_policy.json:END]]]

; [[[MIDEAS_ARTIFACT:logical_bank_budget.json:BEGIN]]]
; {
;   "bankSizeBytes": 8192,
;   "warningThresholdBytes": 7372,
;   "totalPayloadBytes": 2420,
;   "estimatedMinimumBanks": 1,
;   "estimatedPackedBankCount": 1,
;   "estimatedPackedBanks": [
;     {
;       "bankIndex": 0,
;       "usedBytes": 2420,
;       "freeBytes": 5772,
;       "warning": false,
;       "overBudgetBytes": 0,
;       "packages": [
;         {
;           "id": "msx2screen.msx2screen_1779559974838",
;           "usedBytes": 1568,
;           "recommendedBankClass": "world.screen"
;         },
;         {
;           "id": "gameflow.gameflow_1779560142630",
;           "usedBytes": 461,
;           "recommendedBankClass": "world.manifest"
;         },
;         {
;           "id": "worldmap.worldmap_1779560130702",
;           "usedBytes": 311,
;           "recommendedBankClass": "world.manifest"
;         },
;         {
;           "id": "msx2sprite.msx2sprite_1779556659727",
;           "usedBytes": 80,
;           "recommendedBankClass": "world.graphics.sprite"
;         }
;       ]
;     }
;   ],
;   "overBudgetPackages": [],
;   "warningPackages": [],
;   "warningPackedBanks": [],
;   "bankClassSummary": [
;     {
;       "id": "world.screen",
;       "packageCount": 1,
;       "usedBytes": 1568,
;       "estimatedMinimumBanks": 1,
;       "warningPackageCount": 0,
;       "overBudgetPackageCount": 0,
;       "largestPackage": {
;         "id": "msx2screen.msx2screen_1779559974838",
;         "usedBytes": 1568
;       }
;     },
;     {
;       "id": "world.manifest",
;       "packageCount": 2,
;       "usedBytes": 772,
;       "estimatedMinimumBanks": 1,
;       "warningPackageCount": 0,
;       "overBudgetPackageCount": 0,
;       "largestPackage": {
;         "id": "gameflow.gameflow_1779560142630",
;         "usedBytes": 461
;       }
;     },
;     {
;       "id": "world.graphics.sprite",
;       "packageCount": 1,
;       "usedBytes": 80,
;       "estimatedMinimumBanks": 1,
;       "warningPackageCount": 0,
;       "overBudgetPackageCount": 0,
;       "largestPackage": {
;         "id": "msx2sprite.msx2sprite_1779556659727",
;         "usedBytes": 80
;       }
;     }
;   ],
;   "recoveryRecommendations": [
;     {
;       "severity": "ok",
;       "target": "logicalBankBudget",
;       "reason": "All estimated packages fit below warning threshold.",
;       "action": "No recovery needed before the final allocator pass."
;     }
;   ],
;   "recoveryPlan": [
;     {
;       "order": 1,
;       "id": "repack_final_sizes",
;       "status": "not_needed",
;       "trigger": "estimated packed bank reaches warning threshold or any package is over one 8 KB window",
;       "appliesTo": [],
;       "action": "Re-run first-fit-decreasing with final stored sizes after ZX0 policy decisions."
;     },
;     {
;       "order": 2,
;       "id": "split_world_packages",
;       "status": "not_needed",
;       "trigger": "independently addressable world/screen/sprite package is too large or near the bank limit",
;       "appliesTo": [],
;       "action": "Split the logical world package across additional physical world data banks."
;     },
;     {
;       "order": 3,
;       "id": "move_cold_readonly_data",
;       "status": "not_needed",
;       "trigger": "resident or manifest data creates bank pressure",
;       "appliesTo": [],
;       "action": "Move cold read-only tables out of resident/core placement and into world data banks."
;     },
;     {
;       "order": 4,
;       "id": "selective_zx0",
;       "status": "not_needed",
;       "trigger": "large load-to-VRAM screen, pattern, color, tilemap, or sprite data creates pressure",
;       "appliesTo": [],
;       "action": "Try ZX0 only for large load-to-VRAM resources; keep runtime lookup data raw."
;     },
;     {
;       "order": 5,
;       "id": "keep_hot_runtime_raw",
;       "status": "enforced",
;       "trigger": "runtime table is tiny, mutable, or accessed in hot loops",
;       "appliesTo": [
;         "runtime lookup tables",
;         "entity instances",
;         "state-machine runtime state"
;       ],
;       "action": "Do not solve ROM pressure by decompressing whole worlds into RAM or by compressing hot per-frame tables."
;     },
;     {
;       "order": 6,
;       "id": "world_special_code_bank",
;       "status": "not_needed",
;       "trigger": "rare behavior or boss-specific code contributes to resident pressure",
;       "appliesTo": [],
;       "action": "Move rare behavior behind a world special-code bank and far-call boundary."
;     },
;     {
;       "order": 7,
;       "id": "split_large_payload_chunks",
;       "status": "not_needed",
;       "trigger": "single screen/graphics payload cannot fit one mapper window as a unit",
;       "appliesTo": [],
;       "action": "Split large screen or graphics payloads into loader-addressable chunks only when each chunk is independently referenced."
;     },
;     {
;       "order": 8,
;       "id": "fail_actionable_report",
;       "status": "ready",
;       "trigger": "all deterministic recovery attempts still leave an over-budget unit",
;       "appliesTo": [],
;       "action": "Fail before Glass with largest contributors and concrete authoring changes."
;     }
;   ],
;   "packages": [
;     {
;       "id": "gameflow.gameflow_1779560142630",
;       "type": "gameflow",
;       "sourceId": "gameflow_1779560142630",
;       "recommendedBankClass": "world.manifest",
;       "usedBytes": 461,
;       "freeBytesIfAlone": 7731,
;       "warning": false,
;       "overBudgetBytes": 0,
;       "canSplit": false
;     },
;     {
;       "id": "msx2screen.msx2screen_1779559974838",
;       "type": "msx2screen",
;       "sourceId": "msx2screen_1779559974838",
;       "recommendedBankClass": "world.screen",
;       "usedBytes": 1568,
;       "freeBytesIfAlone": 6624,
;       "warning": false,
;       "overBudgetBytes": 0,
;       "canSplit": true
;     },
;     {
;       "id": "msx2sprite.msx2sprite_1779556659727",
;       "type": "msx2sprite",
;       "sourceId": "msx2sprite_1779556659727",
;       "recommendedBankClass": "world.graphics.sprite",
;       "usedBytes": 80,
;       "freeBytesIfAlone": 8112,
;       "warning": false,
;       "overBudgetBytes": 0,
;       "canSplit": true
;     },
;     {
;       "id": "worldmap.worldmap_1779560130702",
;       "type": "worldmap",
;       "sourceId": "worldmap_1779560130702",
;       "recommendedBankClass": "world.manifest",
;       "usedBytes": 311,
;       "freeBytesIfAlone": 7881,
;       "warning": false,
;       "overBudgetBytes": 0,
;       "canSplit": false
;     }
;   ],
;   "note": "Logical pre-pack budget by asset package with first-fit-decreasing estimate. Final allocator still decides physical Konami 8K placement after compression."
; }
;
; [[[MIDEAS_ARTIFACT:logical_bank_budget.json:END]]]

; [[[MIDEAS_ARTIFACT:ram_budget.json:BEGIN]]]
; {
;   "scope": "msx2_screen4_ram_budget",
;   "start": "#C000",
;   "end": "#C314",
;   "limit": "#F300",
;   "usableBytes": 13056,
;   "usedBytes": 788,
;   "freeBytes": 12268,
;   "warningThresholdBytes": 11097,
;   "maxPersistentScreens": 65,
;   "reachableScreens": 1,
;   "status": "ok",
;   "sections": [
;     {
;       "id": "runtime.globals_player_input",
;       "start": "#C000",
;       "end": "#C040",
;       "bytes": 64,
;       "mutable": true,
;       "reason": "Fixed hot runtime state for player/input/global counters."
;     },
;     {
;       "id": "runtime.snake_body_cache",
;       "start": "#C040",
;       "end": "#C080",
;       "bytes": 64,
;       "mutable": true,
;       "reason": "Fixed-size cache reserved only for snake-char body state."
;     },
;     {
;       "id": "runtime.persistent_effect_layers",
;       "start": "#C080",
;       "end": "#C140",
;       "bytes": 192,
;       "mutable": true,
;       "count": 1,
;       "bytesPerScreen": 192,
;       "reason": "One mutable effects layer per reachable SCREEN 4 room."
;     },
;     {
;       "id": "runtime.effects_scratch",
;       "start": "#C200",
;       "end": "#C2C0",
;       "bytes": 192,
;       "mutable": true,
;       "reason": "Temporary effect layer buffer for screens without persistent slot or loaders."
;     },
;     {
;       "id": "runtime.enemy_pool",
;       "start": "#C2C0",
;       "end": "#C314",
;       "bytes": 84,
;       "mutable": true,
;       "slots": 12,
;       "reason": "Active enemy/hazard runtime arrays; ROM keeps enemy templates."
;     }
;   ],
;   "recommendations": [
;     {
;       "severity": "ok",
;       "target": "runtimeRam",
;       "reason": "Estimated runtime RAM fits below warning threshold.",
;       "action": "No RAM recovery needed for this project slice."
;     }
;   ],
;   "note": "RAM budget reports mutable runtime state only. ROM and VRAM storage are reported separately."
; }
;
; [[[MIDEAS_ARTIFACT:ram_budget.json:END]]]

CHGMOD  EQU #005F
DISSCR  EQU #0041
ENASCR  EQU #0044
FILVRM  EQU #0056
WRTVRM  EQU #004D
WRTVDP  EQU #0047
LDIRVM  EQU #005C
CHGCLR  EQU #0062
CHGET   EQU #009F
GTSTCK  EQU #00D5
GTTRIG  EQU #00D8
SNSMAT  EQU #0141
RSLREG  EQU #0138
ENASLT  EQU #0024
HKEY    EQU #F3DB
HKEYI   EQU #FD9A
CLIKSW  EQU #F3DC
BAKCLR  EQU #F3E9
BDRCLR  EQU #F3EA

VDP_PALETTE_PORT EQU #9A
VDP_DATA_PORT EQU #98
VDP_CTRL_PORT EQU #99
SCREEN4_PATTERN_VRAM EQU #0000
SCREEN4_NAME_VRAM EQU #1800
SCREEN4_COLOR_VRAM EQU #2000
SCREEN4_PATTERN_SIZE EQU 6144
SCREEN4_COLOR_SIZE EQU 6144
SCREEN4_NAME_SIZE EQU 768
msx2_player_sprite_x EQU #C000
msx2_player_sprite_y EQU #C001
msx2_player_sprite_dx EQU #C002
msx2_player_sprite_frame EQU #C003
msx2_current_collision_ptr EQU #C004
msx2_current_effects_ptr EQU #C006
msx2_player_jump_frames EQU #C008
msx2_player_on_ground EQU #C009
msx2_player_jump_lock EQU #C00A
msx2_current_screen_index EQU #C00B
msx2_player_dead_flag EQU #C00C
msx2_exit_reached_flag EQU #C00D
msx2_collectible_count EQU #C00E
msx2_collectible_latch EQU #C00F
msx2_exit_blocked_flag EQU #C010
msx2_lives EQU #C011
msx2_game_over_flag EQU #C012
msx2_game_over_restart_lock EQU #C013
msx2_level_complete_flag EQU #C014
msx2_level_continue_lock EQU #C015
msx2_enemy_hit_flag EQU #C016
msx2_enemy_damage_cooldown EQU #C017
msx2_air_value EQU #C018
msx2_air_frame_counter EQU #C019
msx2_current_behavior_ptr EQU #C01A
msx2_snake_growth_pending EQU #C01C
msx2_player_anim_counter EQU #C01D
msx2_player_anim_frame EQU #C01E
msx2_player_bullet_active EQU #C01F
msx2_player_bullet_x EQU #C020
msx2_player_bullet_y EQU #C021
msx2_player_bullet_cooldown EQU #C022
msx2_score_lo EQU #C023
msx2_score_hi EQU #C024
msx2_score_digit_vram EQU #C025
msx2_runtime_frame_counter EQU #C026
msx2_enemy_bullet_active EQU #C027
msx2_enemy_bullet_x EQU #C028
msx2_enemy_bullet_y EQU #C029
msx2_enemy_bullet_cooldown EQU #C02A
msx2_score_work_lo EQU #C02B
msx2_score_work_hi EQU #C02C
msx2_player_bullet_1_active EQU #C02D
msx2_player_bullet_1_x EQU #C02E
msx2_player_bullet_1_y EQU #C02F
msx2_snake_head_x EQU #C030
msx2_snake_head_y EQU #C031
msx2_snake_food_x EQU #C032
msx2_snake_food_y EQU #C033
msx2_snake_dir EQU #C034
msx2_snake_frame_counter EQU #C035
msx2_snake_speed_frames EQU #C036
msx2_snake_draw_char EQU #C037
msx2_snake_body_length EQU #C038
msx2_snake_growth_flag EQU #C039
msx2_music_tick EQU #C03A
msx2_music_step EQU #C03B
msx2_attack_timer EQU #C03C
msx2_attack_seed EQU #C03D
msx2_attack_cursor EQU #C03E
msx2_attack_pending EQU #C03F
msx2_bg_scroll_frame EQU #C03D
msx2_bg_scroll_fine EQU #C03F
MSX2_SCREEN4_DATA_BANK EQU 4
msx2_snake_body_cells EQU #C040
msx2_effects_runtime_buffers EQU #C080
msx2_effects_runtime_scratch EQU #C200
msx2_enemy_runtime_x EQU #C2C0
msx2_enemy_runtime_y EQU #C2CC
msx2_enemy_runtime_dx EQU #C2D8
msx2_enemy_runtime_dy EQU #C2E4
msx2_enemy_runtime_mode EQU #C2F0
msx2_enemy_runtime_speed EQU #C2FC
msx2_enemy_runtime_tick EQU #C308
msx2_runtime_ram_end EQU #C314
msx2_runtime_ram_limit EQU #F300
msx2_layer_size EQU 192
msx2_required_collectibles EQU 0
MSX2_HUD_FONT_BASE_CHAR EQU #C0

    org #4000

    db "AB"
    dw init_rom
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0

init_rom:
    di
    im 1
    ld sp, #F380
    call map_page2_to_cart_primary
    call init_konami8k_fixed_bank0_banks

    ld a, #C9
    ld (HKEY), a
    xor a
    ld (CLIKSW), a

    call DISSCR
    ld a, 4
    call CHGMOD
    ld bc, #0007
    call WRTVDP
    ld bc, #0602
    call WRTVDP
    ld bc, #FF03
    call WRTVDP
    ld bc, #0304
    call WRTVDP
    ld bc, #000A
    call WRTVDP

    call load_screen4_palette
    ld a, 0
    ld (msx2_current_screen_index), a
    call init_msx2_effect_buffers
    call load_NEW_MSX2_SCREEN_4_ROOM_screen4
    call msx2_reset_enemy_runtime_for_current_screen
    call init_hardware_sprites



    call ENASCR
    ei

    ; MSX2 minimal GameFlow: Start/Text(background)/Transition(cls)/End.
    jp .main_loop

.main_loop:
    call update_hardware_sprite_input

    call update_msx2_air_timer



    call wait_frame_busy
    jr .main_loop

wait_frame_busy:
    ; VBlank-paced frame wait. On 60 Hz machines this locks gameplay to 60 frames/second.
    ei
    halt
    ret

map_page2_to_cart_primary:
    ; Keep #8000-#BFFF on the same slot as the cart page at #4000,
    ; including expanded-slot cartridges.
    call RSLREG
    rrca
    rrca
    call get_cart_slot_value
    ld h, #80
    jp ENASLT

get_cart_slot_value:
    and #03
    ld c, a
    ld b, 0
    ld hl, #FCC1
    add hl, bc
    ld a, (hl)
    and #80
    jr z, .slot_ready
    or c
    ld c, a
    inc hl
    inc hl
    inc hl
    inc hl
    ld a, (hl)
    and #0C
.slot_ready:
    or c
    ret

init_konami8k_fixed_bank0_banks:
    ; Konami without SCC: #4000-#5FFF is fixed segment 0.
    ; Runtime explicitly initializes the switchable #6000/#8000/#A000
    ; windows because their power-on contents are not guaranteed.
    ld a, 1
    call mapper_set_bank_p1
    ld a, 2
    call mapper_set_bank_p2
    ld a, 3
    call mapper_set_bank_p3
    ret

mapper_set_bank_p1:
    ; input: A=8KB physical segment for #6000-#7FFF. Clobbers no other registers.
    ld (#6000), a
    ret

mapper_set_bank_p2:
    ; input: A=8KB physical segment for #8000-#9FFF. Clobbers no other registers.
    ld (#8000), a
    ret

mapper_set_bank_p3:
    ; input: A=8KB physical segment for #A000-#BFFF. Clobbers no other registers.
    ld (#A000), a
    ret

msx2_screen4_data_bank_enter:
    ; Maps cold SCREEN 4 data to P2/#8000 while resident code runs from P0/P1.
    ; Clobbers AF. MSX2 SCREEN 4 runtime keeps normal P2 on bank 2.
    ld a, MSX2_SCREEN4_DATA_BANK
    jp mapper_set_bank_p2

msx2_screen4_data_bank_leave:
    ; Restores normal P2 bank 2 after cold data copies.
    ; Clobbers AF.
    ld a, 2
    jp mapper_set_bank_p2

wait_key:
    call CHGET
    ret

clear_screen4_names:
    xor a
    ld hl, SCREEN4_NAME_VRAM
    ld bc, SCREEN4_NAME_SIZE
    call FILVRM
    ret

clear_screen4_name_cell_16:
    ; HL=top-left SCREEN 4 name-table cell for a 16x16 block. Clobbers AF/BC/HL.
    xor a
    call WRTVRM
    inc hl
    xor a
    call WRTVRM
    ld bc, 31
    add hl, bc
    xor a
    call WRTVRM
    inc hl
    xor a
    call WRTVRM
    ret


init_hardware_sprites:
    ; SCREEN 4 hardware sprite runtime. Clobbers AF/BC/DE/HL.
    ; Preserve the SCREEN 4 mode bits set by CHGMOD; only select 16x16, non-magnified sprites.
    ld a, (#F3E0)
    or #02
    and #FE
    ld (#F3E0), a
    ld b, a
    ld c, #01
    call WRTVDP

    ; Sprite attribute/color/pattern tables use the SCREEN 4 V9938 layout.
    ; In sprite mode 2, R#5 selects the combined color+attribute table:
    ; color table #7400, SAT #7600. Bits 0-2 must be 1.
    ld bc, #3F05
    call WRTVDP
    ld bc, #000B
    call WRTVDP
    ld bc, #0706
    call WRTVDP

    call msx2_screen4_data_bank_enter

    ld hl, msx2_hw_sprite_patterns
    ld de, #3800
    ld bc, msx2_hw_sprite_patterns_end - msx2_hw_sprite_patterns
    call copy_to_vram_ext

    ld hl, msx2_hw_sprite_colors
    ld de, #1C00
    ld bc, msx2_hw_sprite_colors_end - msx2_hw_sprite_colors
    call copy_to_vram_ext

    ld hl, msx2_hw_sprite_attrs
    ld de, #1E00
    ld bc, 128
    call copy_to_vram_ext
    call msx2_screen4_data_bank_leave


    ld a, 72
    ld (msx2_player_sprite_x), a
    ld a, 102
    ld (msx2_player_sprite_y), a
    ld a, 1
    ld (msx2_player_sprite_dx), a

    xor a
    ld (msx2_player_sprite_frame), a

    ld (msx2_player_jump_frames), a
    ld (msx2_player_jump_lock), a
    ld (msx2_player_on_ground), a
    ld (msx2_player_anim_counter), a
    ld (msx2_player_anim_frame), a
    ld (msx2_player_dead_flag), a
    ld (msx2_exit_reached_flag), a
    ld (msx2_collectible_count), a
    ld (msx2_collectible_latch), a
    ld (msx2_exit_blocked_flag), a
    ld (msx2_snake_growth_pending), a
    ld (msx2_game_over_flag), a
    ld (msx2_game_over_restart_lock), a
    ld (msx2_level_complete_flag), a
    ld (msx2_level_continue_lock), a
    ld (msx2_enemy_hit_flag), a
    ld (msx2_enemy_damage_cooldown), a
    ld (msx2_player_bullet_active), a
    ld (msx2_player_bullet_x), a
    ld (msx2_player_bullet_y), a
    ld (msx2_player_bullet_1_active), a
    ld (msx2_player_bullet_1_x), a
    ld (msx2_player_bullet_1_y), a
    ld (msx2_player_bullet_cooldown), a
    ld (msx2_enemy_bullet_active), a
    ld (msx2_enemy_bullet_x), a
    ld (msx2_enemy_bullet_y), a
    ld (msx2_enemy_bullet_cooldown), a
    ld (msx2_score_lo), a
    ld (msx2_score_hi), a
    ld (msx2_runtime_frame_counter), a
    call msx2_load_current_screen_air
    ld a, 3
    ld (msx2_lives), a
    call draw_msx2_lives_hud
    call draw_msx2_score_hud
    call draw_msx2_collectible_hud
    call draw_msx2_air_hud
    call upload_hardware_sprite_attrs

    xor a
    ld bc, #000E
    call WRTVDP
    ret

copy_to_vram_ext:
    ; HL=RAM/ROM source, DE=absolute VRAM destination, BC=length. Clobbers AF/BC/DE/HL.
    ld a, d
    and #C0
    rlca
    rlca
    push af
    in a, (VDP_CTRL_PORT)
    pop af
    out (VDP_CTRL_PORT), a
    ld a, #8E
    out (VDP_CTRL_PORT), a
    in a, (VDP_CTRL_PORT)
    ld a, e
    out (VDP_CTRL_PORT), a
    ld a, d
    and #3F
    or #40
    out (VDP_CTRL_PORT), a
.copy_loop:
    ld a, (hl)
    out (VDP_DATA_PORT), a
    inc hl
    dec bc
    ld a, b
    or c
    jr nz, .copy_loop
    xor a
    push af
    in a, (VDP_CTRL_PORT)
    pop af
    out (VDP_CTRL_PORT), a
    ld a, #8E
    out (VDP_CTRL_PORT), a
    ret

write_vram_byte_ext:
    ; A=data, HL=absolute VRAM destination. Clobbers AF/B.
    ld b, a
    ld a, h
    and #C0
    rlca
    rlca
    push af
    in a, (VDP_CTRL_PORT)
    pop af
    out (VDP_CTRL_PORT), a
    ld a, #8E
    out (VDP_CTRL_PORT), a
    in a, (VDP_CTRL_PORT)
    ld a, l
    out (VDP_CTRL_PORT), a
    ld a, h
    and #3F
    or #40
    out (VDP_CTRL_PORT), a
    ld a, b
    out (VDP_DATA_PORT), a
    xor a
    push af
    in a, (VDP_CTRL_PORT)
    pop af
    out (VDP_CTRL_PORT), a
    ld a, #8E
    out (VDP_CTRL_PORT), a
    ret


draw_msx2_lives_hud:
draw_msx2_score_hud:
draw_msx2_collectible_hud:
draw_msx2_air_hud:
    ; Native SCREEN 4 HUD authoring is exported as metadata for now.
    ; Runtime drawing is intentionally data-driven work, not hardcoded bars.
    ret

load_msx2_hud_font:
    ; Loads the generic MSX2 SCREEN 4 HUD font into reserved high char slots. Clobbers AF/BC/DE/HL.
    ld hl, msx2_hud_font_patterns
    ld de, #0600
    ld bc, msx2_hud_font_patterns_end - msx2_hud_font_patterns
    call LDIRVM
    ld hl, msx2_hud_font_patterns
    ld de, #0E00
    ld bc, msx2_hud_font_patterns_end - msx2_hud_font_patterns
    call LDIRVM
    ld hl, msx2_hud_font_patterns
    ld de, #1600
    ld bc, msx2_hud_font_patterns_end - msx2_hud_font_patterns
    call LDIRVM
    ld hl, msx2_hud_font_colors
    ld de, #2600
    ld bc, msx2_hud_font_colors_end - msx2_hud_font_colors
    call LDIRVM
    ld hl, msx2_hud_font_colors
    ld de, #2E00
    ld bc, msx2_hud_font_colors_end - msx2_hud_font_colors
    call LDIRVM
    ld hl, msx2_hud_font_colors
    ld de, #3600
    ld bc, msx2_hud_font_colors_end - msx2_hud_font_colors
    jp LDIRVM

draw_msx2_hud_string:
    ; DE=zero-terminated ASCII, HL=SCREEN 4 name-table VRAM destination. Clobbers AF/B/DE/HL.
    ld a, (de)
    or a
    ret z
    inc de
    call msx2_hud_ascii_to_char
    call write_vram_byte_ext
    inc hl
    jp draw_msx2_hud_string

msx2_hud_ascii_to_char:
    ; Input A=ASCII. Output A=SCREEN 4 HUD font char code.
    cp #20
    jp z, .space
    cp #30
    jp c, .punct
    cp #3A
    jp c, .digit
    cp #41
    jp c, .punct
    cp #5B
    jp c, .upper
.punct:
    cp #3A
    jp z, .colon
    cp #2D
    jp z, .dash
    cp #2F
    jp z, .slash
.space:
    ld a, MSX2_HUD_FONT_BASE_CHAR
    ret
.digit:
    sub #30
    add a, MSX2_HUD_FONT_BASE_CHAR + 1
    ret
.upper:
    sub #41
    add a, MSX2_HUD_FONT_BASE_CHAR + 11
    ret
.colon:
    ld a, MSX2_HUD_FONT_BASE_CHAR + 37
    ret
.dash:
    ld a, MSX2_HUD_FONT_BASE_CHAR + 38
    ret
.slash:
    ld a, MSX2_HUD_FONT_BASE_CHAR + 39
    ret


draw_msx2_game_over_banner:
    ; Final-state feedback: red backdrop. Normal screen reload restores black.
    ; Clobbers BC.
    ld bc, #0607
    call WRTVDP
    ret

draw_msx2_level_complete_banner:
    ; Final-state feedback: green backdrop. Normal screen reload restores black.
    ; Clobbers BC.
    ld bc, #0307
    call WRTVDP
    ret


draw_msx2_stage_banner:
wait_msx2_stage_banner:
    ; Stage banners are omitted when the active MSX2 slice has no shooter wave flow.
    ret

reset_msx2_status_border:
    ; Clear final-state border feedback after restart/continue. Clobbers BC.
    ld bc, #0007
    call WRTVDP
    ret

update_msx2_air_timer:
    ; Decrements the SCREEN 4 air/time resource on a coarse frame divider. Clobbers AF/BC/DE/HL.
    ld a, (msx2_game_over_flag)
    or a
    ret nz
    ld a, (msx2_level_complete_flag)
    or a
    ret nz
    ld a, (msx2_air_value)
    or a
    ret z
    ld a, (msx2_air_frame_counter)
    inc a
    cp 48
    jp nc, .air_tick
    ld (msx2_air_frame_counter), a
    ret
.air_tick:
    xor a
    ld (msx2_air_frame_counter), a
    ld a, (msx2_air_value)
    or a
    jp z, .air_empty
    dec a
    ld (msx2_air_value), a
    call draw_msx2_air_hud
    ld a, (msx2_air_value)
    or a
    ret nz
.air_empty:
    ld a, 1
    ld (msx2_game_over_flag), a
    ld (msx2_game_over_restart_lock), a
    call draw_msx2_game_over_banner
    call write_hardware_sprite_attrs
    ret



update_hardware_sprite_input_paddle_horizontal:
    ; Pong/Arkanoid paddle control: left/right only, no jump/gravity and no bullet engine.
    ; Clobbers AF/BC/DE/HL.
    jp update_hardware_sprite_input_shooter_horizontal

update_hardware_sprite_input_shooter_horizontal:
    ; Galaxian-style horizontal player control: left/right only, no jump/gravity.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_level_complete_flag)
    or a
    jp nz, msx2_level_complete_idle
    ld a, (msx2_game_over_flag)
    or a
    jp nz, msx2_game_over_idle
    xor a
    call GTSTCK
    cp 2
    jp z, move_hardware_sprite_right_flat
    cp 3
    jp z, move_hardware_sprite_right_flat
    cp 4
    jp z, move_hardware_sprite_right_flat
    cp 6
    jp z, move_hardware_sprite_left_flat
    cp 7
    jp z, move_hardware_sprite_left_flat
    cp 8
    jp z, move_hardware_sprite_left_flat
    jp upload_hardware_sprite_attrs

move_hardware_sprite_right_flat:
    ld a, (msx2_player_sprite_x)
    cp 239
    jp nc, upload_hardware_sprite_attrs
    inc a

    ld (msx2_player_sprite_x), a
    ld a, 1
    ld (msx2_player_sprite_dx), a
    jp upload_hardware_sprite_attrs

move_hardware_sprite_left_flat:
    ld a, (msx2_player_sprite_x)
    cp 1
    jp z, upload_hardware_sprite_attrs
    jp c, upload_hardware_sprite_attrs
    dec a

    ld (msx2_player_sprite_x), a
    xor a
    ld (msx2_player_sprite_dx), a
    jp upload_hardware_sprite_attrs

update_msx2_player_bullet:
    ; Player bullet pool for Galaxian-style MSX2 screens. Clobbers AF/BC/DE/HL.
    ld a, (msx2_player_bullet_cooldown)
    or a
    jp z, .bullet_cooldown_done
    dec a
    ld (msx2_player_bullet_cooldown), a
.bullet_cooldown_done:
    call update_msx2_player_bullet_slot_0
    call update_msx2_player_bullet_slot_1

    jp .bullet_try_fire

update_msx2_player_bullet_slot_0:
    ld a, (msx2_player_bullet_active)
    or a
    ret z
    ld a, (msx2_player_bullet_y)
    cp 8
    jp c, .bullet_deactivate_0
    sub 6
    ld (msx2_player_bullet_y), a
    call msx2_player_bullet_check_effect_collision
    ld a, (msx2_player_bullet_active)
    or a
    ret z
    call msx2_player_bullet_check_enemy_collision
    ret
.bullet_deactivate_0:
    xor a
    ld (msx2_player_bullet_active), a
    ret

update_msx2_player_bullet_slot_1:
    ld a, (msx2_player_bullet_1_active)
    or a
    ret z
    ld a, (msx2_player_bullet_1_y)
    cp 8
    jp c, .bullet_deactivate_1
    sub 6
    ld (msx2_player_bullet_1_y), a
    call msx2_player_bullet_1_check_effect_collision
    ld a, (msx2_player_bullet_1_active)
    or a
    ret z
    call msx2_player_bullet_1_check_enemy_collision
    ret
.bullet_deactivate_1:
    xor a
    ld (msx2_player_bullet_1_active), a
    ret

.bullet_try_fire:
    ld a, (msx2_player_bullet_cooldown)
    or a
    ret nz
    ld a, 8
    call SNSMAT
    bit 0, a
    jp z, .bullet_fire_pressed
    xor a
    call GTTRIG
    or a
    jp nz, .bullet_fire_pressed
    ld a, 1
    call GTTRIG
    or a
    ret z
.bullet_fire_pressed:
    ld a, (msx2_player_bullet_active)
    or a
    jp z, .bullet_spawn_slot_0

    ld a, (msx2_player_bullet_1_active)
    or a
    ret nz
    jp .bullet_spawn_slot_1

.bullet_spawn_slot_0:
    ld a, (msx2_player_sprite_x)
    add a, 6
    ld (msx2_player_bullet_x), a
    ld a, (msx2_player_sprite_y)
    cp 8
    jp c, .bullet_spawn_top
    sub 8
    jp .bullet_spawn_store_y
.bullet_spawn_top:
    xor a
.bullet_spawn_store_y:
    ld (msx2_player_bullet_y), a
    ld a, 1
    ld (msx2_player_bullet_active), a
    ld a, 8
    ld (msx2_player_bullet_cooldown), a
    call msx2_sfx_fire
    ret
.bullet_spawn_slot_1:
    ld a, (msx2_player_sprite_x)
    add a, 6
    ld (msx2_player_bullet_1_x), a
    ld a, (msx2_player_sprite_y)
    cp 8
    jp c, .bullet_1_spawn_top
    sub 8
    jp .bullet_1_spawn_store_y
.bullet_1_spawn_top:
    xor a
.bullet_1_spawn_store_y:
    ld (msx2_player_bullet_1_y), a
    ld a, 1
    ld (msx2_player_bullet_1_active), a
    ld a, 8
    ld (msx2_player_bullet_cooldown), a
    call msx2_sfx_fire
    ret


msx2_play_psg_sfx:
    ; HL=register/value table, B=pair count. Clobbers AF/B/HL.
.sfx_loop:
    ld a, (hl)
    out (#A0), a
    inc hl
    ld a, (hl)
    out (#A1), a
    inc hl
    djnz .sfx_loop
    ret

msx2_sfx_fire:
    ld hl, msx2_sfx_fire_data
    ld b, 6
    jp msx2_play_psg_sfx

msx2_sfx_hit:
    ld hl, msx2_sfx_hit_data
    ld b, 6
    jp msx2_play_psg_sfx

msx2_sfx_fire_data:
    db 7,#3E,0,#38,1,#00,11,#30,8,#10,13,#09
msx2_sfx_hit_data:
    db 7,#37,6,#12,11,#70,12,#00,8,#10,13,#00

msx2_player_bullet_check_enemy_collision:
    ; Hides the hit enemy slot and increments the internal score. Clobbers AF/BC/DE/HL.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 1
    jp c, .bullet_no_enemy_slot_0_0
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_0_0
    ld b, a
    ld a, (msx2_player_bullet_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_0
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_0
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x

    ld b, (hl)
    ld a, (msx2_player_bullet_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_0
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_0
    xor a
    ld (msx2_player_bullet_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_0_0
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_0_0:
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
.bullet_no_enemy_slot_0_0:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 2
    jp c, .bullet_no_enemy_slot_0_1
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_0_1
    ld b, a
    ld a, (msx2_player_bullet_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_1
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_1
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_1
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_1
    xor a
    ld (msx2_player_bullet_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_0_1
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_0_1:
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
.bullet_no_enemy_slot_0_1:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 3
    jp c, .bullet_no_enemy_slot_0_2
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_0_2
    ld b, a
    ld a, (msx2_player_bullet_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_2
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_2
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_2
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_2
    xor a
    ld (msx2_player_bullet_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_0_2
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_0_2:
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
.bullet_no_enemy_slot_0_2:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 4
    jp c, .bullet_no_enemy_slot_0_3
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_0_3
    ld b, a
    ld a, (msx2_player_bullet_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_3
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_3
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_3
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_3
    xor a
    ld (msx2_player_bullet_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_0_3
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_0_3:
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
.bullet_no_enemy_slot_0_3:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 5
    jp c, .bullet_no_enemy_slot_0_4
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_0_4
    ld b, a
    ld a, (msx2_player_bullet_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_4
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_4
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_4
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_4
    xor a
    ld (msx2_player_bullet_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_0_4
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_0_4:
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
.bullet_no_enemy_slot_0_4:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 6
    jp c, .bullet_no_enemy_slot_0_5
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_0_5
    ld b, a
    ld a, (msx2_player_bullet_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_5
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_5
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_5
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_5
    xor a
    ld (msx2_player_bullet_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_0_5
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_0_5:
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
.bullet_no_enemy_slot_0_5:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 7
    jp c, .bullet_no_enemy_slot_0_6
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_0_6
    ld b, a
    ld a, (msx2_player_bullet_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_6
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_6
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_6
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_6
    xor a
    ld (msx2_player_bullet_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_0_6
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_0_6:
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
.bullet_no_enemy_slot_0_6:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 8
    jp c, .bullet_no_enemy_slot_0_7
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_0_7
    ld b, a
    ld a, (msx2_player_bullet_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_7
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_7
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_7
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_7
    xor a
    ld (msx2_player_bullet_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_0_7
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_0_7:
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
.bullet_no_enemy_slot_0_7:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 9
    jp c, .bullet_no_enemy_slot_0_8
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_0_8
    ld b, a
    ld a, (msx2_player_bullet_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_8
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_8
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_8
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_8
    xor a
    ld (msx2_player_bullet_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_0_8
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_0_8:
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
.bullet_no_enemy_slot_0_8:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 10
    jp c, .bullet_no_enemy_slot_0_9
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_0_9
    ld b, a
    ld a, (msx2_player_bullet_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_9
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_9
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_9
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_9
    xor a
    ld (msx2_player_bullet_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_0_9
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_0_9:
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
.bullet_no_enemy_slot_0_9:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 11
    jp c, .bullet_no_enemy_slot_0_10
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_0_10
    ld b, a
    ld a, (msx2_player_bullet_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_10
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_10
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_10
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_10
    xor a
    ld (msx2_player_bullet_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_0_10
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_0_10:
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
.bullet_no_enemy_slot_0_10:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 12
    jp c, .bullet_no_enemy_slot_0_11
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_0_11
    ld b, a
    ld a, (msx2_player_bullet_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_11
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_11
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_0_11
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_0_11
    xor a
    ld (msx2_player_bullet_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_0_11
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_0_11:
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
.bullet_no_enemy_slot_0_11:
    ret

msx2_player_bullet_check_effect_collision:
    ; Clears a destructible effect cell hit by the player projectile. Clobbers AF/BC/DE/HL.
    ld a, (msx2_player_bullet_x)
    add a, 4
    ld b, a
    ld a, (msx2_player_bullet_y)
    add a, 4
    ld c, a
    push bc
    call msx2_effect_at_pixel
    cp 3
    jp z, .player_bullet_effect_hit
    pop bc
    ret
.player_bullet_effect_hit:
    xor a
    ld (hl), a
    ld (msx2_player_bullet_active), a
    pop bc
    call clear_msx2_effect_visual_at_pixel
    call msx2_sfx_hit
    ret

msx2_player_bullet_1_check_enemy_collision:
    ; Hides the hit enemy slot and increments the internal score. Clobbers AF/BC/DE/HL.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 1
    jp c, .bullet_no_enemy_slot_1_0
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_1_0
    ld b, a
    ld a, (msx2_player_bullet_1_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_0
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_0
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x

    ld b, (hl)
    ld a, (msx2_player_bullet_1_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_0
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_0
    xor a
    ld (msx2_player_bullet_1_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_1_0
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_1_0:
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
.bullet_no_enemy_slot_1_0:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 2
    jp c, .bullet_no_enemy_slot_1_1
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_1_1
    ld b, a
    ld a, (msx2_player_bullet_1_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_1
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_1
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_1_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_1
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_1
    xor a
    ld (msx2_player_bullet_1_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_1_1
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_1_1:
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
.bullet_no_enemy_slot_1_1:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 3
    jp c, .bullet_no_enemy_slot_1_2
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_1_2
    ld b, a
    ld a, (msx2_player_bullet_1_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_2
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_2
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_1_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_2
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_2
    xor a
    ld (msx2_player_bullet_1_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_1_2
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_1_2:
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
.bullet_no_enemy_slot_1_2:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 4
    jp c, .bullet_no_enemy_slot_1_3
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_1_3
    ld b, a
    ld a, (msx2_player_bullet_1_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_3
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_3
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_1_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_3
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_3
    xor a
    ld (msx2_player_bullet_1_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_1_3
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_1_3:
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
.bullet_no_enemy_slot_1_3:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 5
    jp c, .bullet_no_enemy_slot_1_4
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_1_4
    ld b, a
    ld a, (msx2_player_bullet_1_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_4
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_4
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_1_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_4
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_4
    xor a
    ld (msx2_player_bullet_1_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_1_4
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_1_4:
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
.bullet_no_enemy_slot_1_4:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 6
    jp c, .bullet_no_enemy_slot_1_5
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_1_5
    ld b, a
    ld a, (msx2_player_bullet_1_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_5
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_5
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_1_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_5
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_5
    xor a
    ld (msx2_player_bullet_1_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_1_5
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_1_5:
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
.bullet_no_enemy_slot_1_5:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 7
    jp c, .bullet_no_enemy_slot_1_6
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_1_6
    ld b, a
    ld a, (msx2_player_bullet_1_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_6
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_6
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_1_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_6
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_6
    xor a
    ld (msx2_player_bullet_1_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_1_6
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_1_6:
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
.bullet_no_enemy_slot_1_6:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 8
    jp c, .bullet_no_enemy_slot_1_7
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_1_7
    ld b, a
    ld a, (msx2_player_bullet_1_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_7
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_7
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_1_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_7
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_7
    xor a
    ld (msx2_player_bullet_1_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_1_7
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_1_7:
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
.bullet_no_enemy_slot_1_7:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 9
    jp c, .bullet_no_enemy_slot_1_8
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_1_8
    ld b, a
    ld a, (msx2_player_bullet_1_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_8
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_8
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_1_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_8
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_8
    xor a
    ld (msx2_player_bullet_1_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_1_8
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_1_8:
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
.bullet_no_enemy_slot_1_8:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 10
    jp c, .bullet_no_enemy_slot_1_9
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_1_9
    ld b, a
    ld a, (msx2_player_bullet_1_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_9
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_9
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_1_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_9
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_9
    xor a
    ld (msx2_player_bullet_1_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_1_9
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_1_9:
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
.bullet_no_enemy_slot_1_9:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 11
    jp c, .bullet_no_enemy_slot_1_10
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_1_10
    ld b, a
    ld a, (msx2_player_bullet_1_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_10
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_10
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_1_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_10
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_10
    xor a
    ld (msx2_player_bullet_1_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_1_10
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_1_10:
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
.bullet_no_enemy_slot_1_10:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 12
    jp c, .bullet_no_enemy_slot_1_11
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld a, (hl)
    cp 208
    jp nc, .bullet_no_enemy_slot_1_11
    ld b, a
    ld a, (msx2_player_bullet_1_y)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_11
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_11
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_bullet_1_x)
    add a, 4
    ld c, a
    ld a, c
    cp b
    jp c, .bullet_no_enemy_slot_1_11
    ld a, b
    add a, 15
    cp c
    jp c, .bullet_no_enemy_slot_1_11
    xor a
    ld (msx2_player_bullet_1_active), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld (hl), 208
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_score
    add hl, de
    ld a, (hl)
    ld b, a
    ld a, (msx2_score_lo)
    add a, b
    ld (msx2_score_lo), a
    jp nc, .bullet_score_changed_1_11
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.bullet_score_changed_1_11:
    call msx2_sfx_hit
    jp msx2_check_enemy_wave_complete
.bullet_no_enemy_slot_1_11:
    ret

msx2_player_bullet_1_check_effect_collision:
    ; Clears a destructible effect cell hit by the second player projectile. Clobbers AF/BC/DE/HL.
    ld a, (msx2_player_bullet_1_x)
    add a, 4
    ld b, a
    ld a, (msx2_player_bullet_1_y)
    add a, 4
    ld c, a
    push bc
    call msx2_effect_at_pixel
    cp 3
    jp z, .player_bullet_1_effect_hit
    pop bc
    ret
.player_bullet_1_effect_hit:
    xor a
    ld (hl), a
    ld (msx2_player_bullet_1_active), a
    pop bc
    call clear_msx2_effect_visual_at_pixel
    call msx2_sfx_hit
    ret


msx2_check_enemy_wave_complete:
    ; Completes Galaxian-style screens when every active enemy slot is hidden. Clobbers AF/BC/DE/HL.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    or a
    ret z
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 1
    jp c, .wave_slot_0_not_active
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y

    ld a, (hl)
    cp 208
    ret c
.wave_slot_0_not_active:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 2
    jp c, .wave_slot_1_not_active
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld a, (hl)
    cp 208
    ret c
.wave_slot_1_not_active:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 3
    jp c, .wave_slot_2_not_active
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld a, (hl)
    cp 208
    ret c
.wave_slot_2_not_active:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 4
    jp c, .wave_slot_3_not_active
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld a, (hl)
    cp 208
    ret c
.wave_slot_3_not_active:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 5
    jp c, .wave_slot_4_not_active
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld a, (hl)
    cp 208
    ret c
.wave_slot_4_not_active:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 6
    jp c, .wave_slot_5_not_active
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld a, (hl)
    cp 208
    ret c
.wave_slot_5_not_active:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 7
    jp c, .wave_slot_6_not_active
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld a, (hl)
    cp 208
    ret c
.wave_slot_6_not_active:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 8
    jp c, .wave_slot_7_not_active
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld a, (hl)
    cp 208
    ret c
.wave_slot_7_not_active:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 9
    jp c, .wave_slot_8_not_active
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld a, (hl)
    cp 208
    ret c
.wave_slot_8_not_active:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 10
    jp c, .wave_slot_9_not_active
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld a, (hl)
    cp 208
    ret c
.wave_slot_9_not_active:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 11
    jp c, .wave_slot_10_not_active
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld a, (hl)
    cp 208
    ret c
.wave_slot_10_not_active:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 12
    jp c, .wave_slot_11_not_active
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld a, (hl)
    cp 208
    ret c
.wave_slot_11_not_active:
    ld a, 1
    ld (msx2_level_complete_flag), a
    ld (msx2_level_continue_lock), a
    xor a
    ld (msx2_player_bullet_active), a
    ld (msx2_player_bullet_1_active), a
    ld (msx2_enemy_bullet_active), a
    call draw_msx2_level_complete_banner
    call write_hardware_sprite_attrs
    ret

update_msx2_enemy_bullet:
    ; Single enemy projectile for Galaxian-style MSX2 screens. Clobbers AF/BC/DE/HL.
    ld a, (msx2_game_over_flag)
    or a
    ret nz
    ld a, (msx2_level_complete_flag)
    or a
    ret nz
    ld a, (msx2_enemy_bullet_cooldown)
    or a
    jp z, .enemy_bullet_cooldown_done
    dec a
    ld (msx2_enemy_bullet_cooldown), a
.enemy_bullet_cooldown_done:
    ld a, (msx2_enemy_bullet_active)
    or a
    jp z, .enemy_bullet_try_spawn
    ld a, (msx2_enemy_bullet_y)
    cp 204
    jp nc, .enemy_bullet_deactivate
    add a, 2
    ld (msx2_enemy_bullet_y), a
    call msx2_enemy_bullet_check_effect_collision
    ld a, (msx2_enemy_bullet_active)
    or a
    ret z
    call msx2_enemy_bullet_check_player_collision
    ret
.enemy_bullet_deactivate:
    xor a
    ld (msx2_enemy_bullet_active), a
    ret
.enemy_bullet_try_spawn:
    ld a, (msx2_enemy_bullet_cooldown)
    or a
    ret nz
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 1
    jp c, .enemy_bullet_no_spawn_0
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y

    ld a, (hl)
    cp 200
    jp nc, .enemy_bullet_no_spawn_0
    add a, 16
    ld (msx2_enemy_bullet_y), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x

    ld a, (hl)
    add a, 6
    ld (msx2_enemy_bullet_x), a
    ld a, 1
    ld (msx2_enemy_bullet_active), a
    ld a, 54
    ld (msx2_enemy_bullet_cooldown), a
    ret
.enemy_bullet_no_spawn_0:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 2
    jp c, .enemy_bullet_no_spawn_1
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld a, (hl)
    cp 200
    jp nc, .enemy_bullet_no_spawn_1
    add a, 16
    ld (msx2_enemy_bullet_y), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld a, (hl)
    add a, 6
    ld (msx2_enemy_bullet_x), a
    ld a, 1
    ld (msx2_enemy_bullet_active), a
    ld a, 54
    ld (msx2_enemy_bullet_cooldown), a
    ret
.enemy_bullet_no_spawn_1:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 3
    jp c, .enemy_bullet_no_spawn_2
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld a, (hl)
    cp 200
    jp nc, .enemy_bullet_no_spawn_2
    add a, 16
    ld (msx2_enemy_bullet_y), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld a, (hl)
    add a, 6
    ld (msx2_enemy_bullet_x), a
    ld a, 1
    ld (msx2_enemy_bullet_active), a
    ld a, 54
    ld (msx2_enemy_bullet_cooldown), a
    ret
.enemy_bullet_no_spawn_2:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 4
    jp c, .enemy_bullet_no_spawn_3
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld a, (hl)
    cp 200
    jp nc, .enemy_bullet_no_spawn_3
    add a, 16
    ld (msx2_enemy_bullet_y), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld a, (hl)
    add a, 6
    ld (msx2_enemy_bullet_x), a
    ld a, 1
    ld (msx2_enemy_bullet_active), a
    ld a, 54
    ld (msx2_enemy_bullet_cooldown), a
    ret
.enemy_bullet_no_spawn_3:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 5
    jp c, .enemy_bullet_no_spawn_4
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld a, (hl)
    cp 200
    jp nc, .enemy_bullet_no_spawn_4
    add a, 16
    ld (msx2_enemy_bullet_y), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld a, (hl)
    add a, 6
    ld (msx2_enemy_bullet_x), a
    ld a, 1
    ld (msx2_enemy_bullet_active), a
    ld a, 54
    ld (msx2_enemy_bullet_cooldown), a
    ret
.enemy_bullet_no_spawn_4:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 6
    jp c, .enemy_bullet_no_spawn_5
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld a, (hl)
    cp 200
    jp nc, .enemy_bullet_no_spawn_5
    add a, 16
    ld (msx2_enemy_bullet_y), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld a, (hl)
    add a, 6
    ld (msx2_enemy_bullet_x), a
    ld a, 1
    ld (msx2_enemy_bullet_active), a
    ld a, 54
    ld (msx2_enemy_bullet_cooldown), a
    ret
.enemy_bullet_no_spawn_5:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 7
    jp c, .enemy_bullet_no_spawn_6
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld a, (hl)
    cp 200
    jp nc, .enemy_bullet_no_spawn_6
    add a, 16
    ld (msx2_enemy_bullet_y), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld a, (hl)
    add a, 6
    ld (msx2_enemy_bullet_x), a
    ld a, 1
    ld (msx2_enemy_bullet_active), a
    ld a, 54
    ld (msx2_enemy_bullet_cooldown), a
    ret
.enemy_bullet_no_spawn_6:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 8
    jp c, .enemy_bullet_no_spawn_7
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld a, (hl)
    cp 200
    jp nc, .enemy_bullet_no_spawn_7
    add a, 16
    ld (msx2_enemy_bullet_y), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld a, (hl)
    add a, 6
    ld (msx2_enemy_bullet_x), a
    ld a, 1
    ld (msx2_enemy_bullet_active), a
    ld a, 54
    ld (msx2_enemy_bullet_cooldown), a
    ret
.enemy_bullet_no_spawn_7:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 9
    jp c, .enemy_bullet_no_spawn_8
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld a, (hl)
    cp 200
    jp nc, .enemy_bullet_no_spawn_8
    add a, 16
    ld (msx2_enemy_bullet_y), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld a, (hl)
    add a, 6
    ld (msx2_enemy_bullet_x), a
    ld a, 1
    ld (msx2_enemy_bullet_active), a
    ld a, 54
    ld (msx2_enemy_bullet_cooldown), a
    ret
.enemy_bullet_no_spawn_8:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 10
    jp c, .enemy_bullet_no_spawn_9
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld a, (hl)
    cp 200
    jp nc, .enemy_bullet_no_spawn_9
    add a, 16
    ld (msx2_enemy_bullet_y), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld a, (hl)
    add a, 6
    ld (msx2_enemy_bullet_x), a
    ld a, 1
    ld (msx2_enemy_bullet_active), a
    ld a, 54
    ld (msx2_enemy_bullet_cooldown), a
    ret
.enemy_bullet_no_spawn_9:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 11
    jp c, .enemy_bullet_no_spawn_10
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld a, (hl)
    cp 200
    jp nc, .enemy_bullet_no_spawn_10
    add a, 16
    ld (msx2_enemy_bullet_y), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld a, (hl)
    add a, 6
    ld (msx2_enemy_bullet_x), a
    ld a, 1
    ld (msx2_enemy_bullet_active), a
    ld a, 54
    ld (msx2_enemy_bullet_cooldown), a
    ret
.enemy_bullet_no_spawn_10:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 12
    jp c, .enemy_bullet_no_spawn_11
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld a, (hl)
    cp 200
    jp nc, .enemy_bullet_no_spawn_11
    add a, 16
    ld (msx2_enemy_bullet_y), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld a, (hl)
    add a, 6
    ld (msx2_enemy_bullet_x), a
    ld a, 1
    ld (msx2_enemy_bullet_active), a
    ld a, 54
    ld (msx2_enemy_bullet_cooldown), a
    ret
.enemy_bullet_no_spawn_11:
    ret

msx2_enemy_bullet_check_player_collision:
    ; Collides enemy projectile with player 16x16 body. Clobbers AF/BC/DE/HL.
    ld a, (msx2_enemy_bullet_y)
    add a, 4
    ld c, a
    ld a, (msx2_player_sprite_y)
    ld b, a
    ld a, c
    cp b
    ret c
    ld a, b
    add a, 15
    cp c
    ret c
    ld a, (msx2_enemy_bullet_x)
    add a, 4
    ld c, a
    ld a, (msx2_player_sprite_x)
    ld b, a
    ld a, c
    cp b
    ret c
    ld a, b
    add a, 15
    cp c
    ret c
    xor a
    ld (msx2_enemy_bullet_active), a
    ld a, 80
    ld (msx2_enemy_bullet_cooldown), a
    call msx2_sfx_hit
    call msx2_apply_damage_respawn
    ret

msx2_enemy_bullet_check_effect_collision:
    ; Clears a destructible effect cell hit by an enemy projectile. Clobbers AF/BC/DE/HL.
    ld a, (msx2_enemy_bullet_x)
    add a, 4
    ld b, a
    ld a, (msx2_enemy_bullet_y)
    add a, 8
    ld c, a
    push bc
    call msx2_effect_at_pixel
    cp 3
    jp z, .enemy_bullet_effect_hit
    pop bc
    ret
.enemy_bullet_effect_hit:
    xor a
    ld (hl), a
    ld (msx2_enemy_bullet_active), a
    pop bc
    call clear_msx2_effect_visual_at_pixel
    call msx2_sfx_hit
    ret

update_hardware_sprite_input:
    ; First playable MSX2 slice: keyboard/joystick left-right plus jump/gravity.
    ; Clobbers AF/BC/DE/HL.




    ld a, (msx2_level_complete_flag)
    or a
    jp nz, msx2_level_complete_idle
    ld a, (msx2_game_over_flag)
    or a
    jp nz, msx2_game_over_idle
    xor a
    call GTSTCK
    cp 1
    jp z, try_msx2_ladder_up
    cp 2
    jp z, try_msx2_ladder_up_or_right
    cp 8
    jp z, try_msx2_ladder_up_or_left
    cp 5
    jp z, try_msx2_ladder_down
    cp 4
    jp z, try_msx2_ladder_down_or_right
    cp 6
    jp z, try_msx2_ladder_down_or_left
    cp 2
    jp z, move_hardware_sprite_right
    cp 3
    jp z, move_hardware_sprite_right
    cp 4
    jp z, move_hardware_sprite_right
    cp 6
    jp z, move_hardware_sprite_left
    cp 7
    jp z, move_hardware_sprite_left
    cp 8
    jp z, move_hardware_sprite_left
    jp update_hardware_sprite_vertical

try_msx2_ladder_up:
    call msx2_ladder_at_player_center
    jp z, move_msx2_ladder_up
    jp update_hardware_sprite_vertical

try_msx2_ladder_up_or_right:
    call msx2_ladder_at_player_center
    jp z, move_msx2_ladder_up
    jp move_hardware_sprite_right

try_msx2_ladder_up_or_left:
    call msx2_ladder_at_player_center
    jp z, move_msx2_ladder_up
    jp move_hardware_sprite_left

try_msx2_ladder_down:
    call msx2_ladder_below_player_center
    jp z, move_msx2_ladder_down
    jp update_hardware_sprite_vertical

try_msx2_ladder_down_or_right:
    call msx2_ladder_below_player_center
    jp z, move_msx2_ladder_down
    jp move_hardware_sprite_right

try_msx2_ladder_down_or_left:
    call msx2_ladder_below_player_center
    jp z, move_msx2_ladder_down
    jp move_hardware_sprite_left

move_msx2_ladder_up:
    ld a, (msx2_player_sprite_y)
    or a
    jp z, upload_hardware_sprite_attrs
    dec a
    ld (msx2_player_sprite_y), a
    xor a
    ld (msx2_player_jump_frames), a
    ld (msx2_player_on_ground), a
    jp upload_hardware_sprite_attrs

move_msx2_ladder_down:
    ld a, (msx2_player_sprite_y)
    cp 196
    jp nc, upload_hardware_sprite_attrs
    inc a
    ld (msx2_player_sprite_y), a
    xor a
    ld (msx2_player_jump_frames), a
    ld (msx2_player_on_ground), a
    jp upload_hardware_sprite_attrs

hold_msx2_rope:
    xor a
    ld (msx2_player_jump_frames), a
    ld (msx2_player_on_ground), a
    jp upload_hardware_sprite_attrs

move_hardware_sprite_right:
    ld a, (msx2_player_sprite_x)
    cp 239
    jp nc, msx2_try_world_edge_transition_right
    inc a
    add a, 15
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    jp nz, .right_blocked
    ld a, (msx2_player_sprite_x)
    inc a
    ld (msx2_player_sprite_x), a
    ld a, 1
    ld (msx2_player_sprite_dx), a
    jp finish_msx2_horizontal_move
.right_blocked:
    xor a
    ld (msx2_player_sprite_dx), a
    jp finish_msx2_horizontal_move

move_hardware_sprite_left:
    ld a, (msx2_player_sprite_x)
    cp 1
    jp z, msx2_try_world_edge_transition_left
    jp c, msx2_try_world_edge_transition_left
    dec a
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    jp nz, .left_blocked
    ld a, (msx2_player_sprite_x)
    dec a
    ld (msx2_player_sprite_x), a
    xor a
    ld (msx2_player_sprite_dx), a
    jp finish_msx2_horizontal_move
.left_blocked:
    ld a, 1
    ld (msx2_player_sprite_dx), a
    jp finish_msx2_horizontal_move

finish_msx2_horizontal_move:
    call msx2_rope_at_player_center
    jp z, hold_msx2_rope
    jp update_hardware_sprite_vertical

msx2_game_over_idle:
    ld a, (msx2_game_over_restart_lock)
    or a
    jp z, .restart_space_check
    ld a, 8
    call SNSMAT
    bit 0, a
    jp z, .draw_game_over
    xor a
    ld (msx2_game_over_restart_lock), a
    jp .draw_game_over
.restart_space_check:
    ld a, 8
    call SNSMAT
    bit 0, a
    jp z, msx2_restart_game
    xor a
    call GTTRIG
    or a
    jp nz, msx2_restart_game
    ld a, 1
    call GTTRIG
    or a
    jp nz, msx2_restart_game
.draw_game_over:
    call draw_msx2_game_over_banner
    call write_hardware_sprite_attrs
    ret

msx2_level_complete_idle:
    ld a, 8
    call SNSMAT
    bit 0, a
    jp nz, .continue_space_released
    ld a, (msx2_level_continue_lock)
    or a
    jp z, msx2_continue_after_level_complete
    jp .draw_level_complete
.continue_space_released:
    xor a
    ld (msx2_level_continue_lock), a
.draw_level_complete:
    call draw_msx2_level_complete_banner
    call write_hardware_sprite_attrs
    ret

msx2_continue_after_level_complete:
    call msx2_advance_to_next_wave_screen
    call init_msx2_effect_buffers
    call load_current_msx2_screen4
    call reset_msx2_status_border
    call draw_msx2_stage_banner
    call wait_msx2_stage_banner
    call load_current_msx2_screen4
    xor a
    ld (msx2_level_complete_flag), a
    ld (msx2_level_continue_lock), a
    ld (msx2_exit_reached_flag), a
    ld (msx2_exit_blocked_flag), a
    ld (msx2_collectible_count), a
    ld (msx2_collectible_latch), a
    ld (msx2_snake_growth_pending), a
    ld (msx2_player_dead_flag), a
    ld (msx2_game_over_flag), a
    ld (msx2_game_over_restart_lock), a
    ld (msx2_enemy_hit_flag), a
    ld (msx2_enemy_damage_cooldown), a
    ld (msx2_player_bullet_active), a
    ld (msx2_player_bullet_x), a
    ld (msx2_player_bullet_y), a
    ld (msx2_player_bullet_1_active), a
    ld (msx2_player_bullet_1_x), a
    ld (msx2_player_bullet_1_y), a
    ld (msx2_player_bullet_cooldown), a
    ld (msx2_enemy_bullet_active), a
    ld (msx2_enemy_bullet_x), a
    ld (msx2_enemy_bullet_y), a
    ld (msx2_enemy_bullet_cooldown), a
    ld (msx2_runtime_frame_counter), a
    call msx2_load_current_screen_air
    call msx2_reset_enemy_runtime_for_current_screen
    call draw_msx2_lives_hud
    call draw_msx2_collectible_hud
    call draw_msx2_air_hud
    call msx2_respawn_current_screen
    ld (msx2_player_jump_lock), a
    call write_hardware_sprite_attrs
    ret

msx2_advance_to_next_wave_screen:
    ; Advances to the next referenced SCREEN 4 sector, wrapping after the final wave. Clobbers AF.
    ld a, (msx2_current_screen_index)
    inc a
    cp 1
    jp c, .store_next_wave_screen
    xor a
.store_next_wave_screen:
    ld (msx2_current_screen_index), a
    ret

msx2_restart_game:
    ld a, 0
    ld (msx2_current_screen_index), a
    call init_msx2_effect_buffers
    call load_NEW_MSX2_SCREEN_4_ROOM_screen4
    call reset_msx2_status_border
    xor a
    ld (msx2_game_over_flag), a
    ld (msx2_game_over_restart_lock), a
    ld (msx2_player_dead_flag), a
    ld (msx2_exit_reached_flag), a
    ld (msx2_collectible_count), a
    ld (msx2_collectible_latch), a
    ld (msx2_exit_blocked_flag), a
    ld (msx2_snake_growth_pending), a
    ld (msx2_level_complete_flag), a
    ld (msx2_level_continue_lock), a
    ld (msx2_enemy_hit_flag), a
    ld (msx2_enemy_damage_cooldown), a
    ld (msx2_player_bullet_active), a
    ld (msx2_player_bullet_x), a
    ld (msx2_player_bullet_y), a
    ld (msx2_player_bullet_1_active), a
    ld (msx2_player_bullet_1_x), a
    ld (msx2_player_bullet_1_y), a
    ld (msx2_player_bullet_cooldown), a
    ld (msx2_enemy_bullet_active), a
    ld (msx2_enemy_bullet_x), a
    ld (msx2_enemy_bullet_y), a
    ld (msx2_enemy_bullet_cooldown), a
    ld (msx2_runtime_frame_counter), a
    call msx2_load_current_screen_air
    call msx2_reset_enemy_runtime_for_current_screen
    ld a, 3
    ld (msx2_lives), a
    call draw_msx2_lives_hud
    call draw_msx2_collectible_hud
    call draw_msx2_air_hud
    call msx2_respawn_current_screen
    ld (msx2_player_jump_lock), a
    call write_hardware_sprite_attrs
    ret

auto_patrol_hardware_sprite:
    ; Move every 4 frames so the sprite visibly patrols without racing.
    ld a, (msx2_player_sprite_frame)
    inc a
    and 3
    ld (msx2_player_sprite_frame), a
    jp nz, update_hardware_sprite_vertical
    ld a, (msx2_player_sprite_dx)
    or a
    jp z, move_hardware_sprite_left
    jp move_hardware_sprite_right

update_hardware_sprite_vertical:
    ; Jump uses SPACE on keyboard matrix row 8, bit 0. Gravity is 1 px/frame.
    ; Clobbers AF/BC/DE/HL.

    ld a, 8
    call SNSMAT
    bit 0, a
    jp nz, .space_released
    ld a, (msx2_player_jump_lock)
    or a
    jp nz, .after_jump_input
    ld a, (msx2_player_on_ground)
    or a
    jp z, .after_jump_input
    ld a, 22
    ld (msx2_player_jump_frames), a
    xor a
    ld (msx2_player_on_ground), a
    ld a, 1
    ld (msx2_player_jump_lock), a
    jp .after_jump_input
.space_released:
    xor a
    ld (msx2_player_jump_lock), a
.after_jump_input:
    call msx2_rope_at_player_center
    jp z, hold_msx2_rope
    ld a, (msx2_player_jump_frames)
    or a
    jp z, apply_hardware_sprite_gravity
    ld a, (msx2_player_sprite_y)
    or a
    jp z, .cancel_jump
    dec a
    ld c, a
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    jp nz, .cancel_jump
    ld a, (msx2_player_sprite_y)
    dec a
    ld (msx2_player_sprite_y), a
    ld a, (msx2_player_jump_frames)
    dec a
    ld (msx2_player_jump_frames), a
    jp upload_hardware_sprite_attrs
.cancel_jump:
    xor a
    ld (msx2_player_jump_frames), a
    jp upload_hardware_sprite_attrs

apply_hardware_sprite_gravity:
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 16
    ld c, a
    call msx2_collision_at_pixel
    jp nz, .grounded
    xor a
    ld (msx2_player_on_ground), a
    ld a, (msx2_player_sprite_y)
    cp 196
    jp nc, upload_hardware_sprite_attrs
    inc a
    ld (msx2_player_sprite_y), a
    jp upload_hardware_sprite_attrs
.grounded:
    ld a, 1
    ld (msx2_player_on_ground), a
    call apply_msx2_conveyor
    jp upload_hardware_sprite_attrs

apply_msx2_conveyor:
    ; Behavior code 2 pushes right, code 3 pushes left. Clobbers AF/BC/DE/HL.
    call msx2_behavior_below_player_center
    cp 2
    jp z, .conveyor_right
    cp 3
    jp z, .conveyor_left
    ret
.conveyor_right:
    ld a, (msx2_player_sprite_x)
    cp 239
    ret nc
    inc a
    add a, 15
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret nz
    ld a, (msx2_player_sprite_x)
    inc a
    ld (msx2_player_sprite_x), a
    ld a, 1
    ld (msx2_player_sprite_dx), a
    ret
.conveyor_left:
    ld a, (msx2_player_sprite_x)
    cp 1
    ret z
    ret c
    dec a
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret nz
    ld a, (msx2_player_sprite_x)
    dec a
    ld (msx2_player_sprite_x), a
    xor a
    ld (msx2_player_sprite_dx), a
    ret

write_hardware_sprite_attrs:
    ; Writes player and enemy sprite attributes to the SCREEN 4 SAT. Clobbers AF/BC/DE/HL.
    ; Sprite layer 0: x+0, y+0
    ld a, (msx2_player_sprite_y)
    ld hl, #1E00
    call write_vram_byte_ext
    ld a, (msx2_player_sprite_x)
    ld hl, #1E01
    call write_vram_byte_ext
    ld a, 0
    ld b, a
    ld a, (msx2_player_sprite_dx)
    or a
    ld a, b
    jp nz, .msx2_player_pattern_base_0
    add a, 4
.msx2_player_pattern_base_0:
    ld hl, #1E02
    call write_vram_byte_ext
    xor a
    ld hl, #1E03
    call write_vram_byte_ext

    ; Enemy/hazard sprite slot 0.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 1
    jp nc, .enemy_sprite_0_visible
    ld a, 208
    ld hl, #1E04
    call write_vram_byte_ext
    jp .enemy_sprite_0_done
.enemy_sprite_0_visible:
    ld hl, msx2_enemy_runtime_y
    ld a, (hl)
    ld hl, #1E04
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld a, (hl)
    ld hl, #1E05
    call write_vram_byte_ext
    ld a, 8
    ld hl, #1E06
    call write_vram_byte_ext
    xor a
    ld hl, #1E07
    call write_vram_byte_ext
.enemy_sprite_0_done:

    ; Enemy/hazard sprite slot 1.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 2
    jp nc, .enemy_sprite_1_visible
    ld a, 208
    ld hl, #1E08
    call write_vram_byte_ext
    jp .enemy_sprite_1_done
.enemy_sprite_1_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de
    ld a, (hl)
    ld hl, #1E08
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de
    ld a, (hl)
    ld hl, #1E09
    call write_vram_byte_ext
    ld a, 8
    ld hl, #1E0A
    call write_vram_byte_ext
    xor a
    ld hl, #1E0B
    call write_vram_byte_ext
.enemy_sprite_1_done:

    ; Enemy/hazard sprite slot 2.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 3
    jp nc, .enemy_sprite_2_visible
    ld a, 208
    ld hl, #1E0C
    call write_vram_byte_ext
    jp .enemy_sprite_2_done
.enemy_sprite_2_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de
    ld a, (hl)
    ld hl, #1E0C
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de
    ld a, (hl)
    ld hl, #1E0D
    call write_vram_byte_ext
    ld a, 8
    ld hl, #1E0E
    call write_vram_byte_ext
    xor a
    ld hl, #1E0F
    call write_vram_byte_ext
.enemy_sprite_2_done:

    ; Enemy/hazard sprite slot 3.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 4
    jp nc, .enemy_sprite_3_visible
    ld a, 208
    ld hl, #1E10
    call write_vram_byte_ext
    jp .enemy_sprite_3_done
.enemy_sprite_3_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de
    ld a, (hl)
    ld hl, #1E10
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de
    ld a, (hl)
    ld hl, #1E11
    call write_vram_byte_ext
    ld a, 8
    ld hl, #1E12
    call write_vram_byte_ext
    xor a
    ld hl, #1E13
    call write_vram_byte_ext
.enemy_sprite_3_done:

    ; Enemy/hazard sprite slot 4.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 5
    jp nc, .enemy_sprite_4_visible
    ld a, 208
    ld hl, #1E14
    call write_vram_byte_ext
    jp .enemy_sprite_4_done
.enemy_sprite_4_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de
    ld a, (hl)
    ld hl, #1E14
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de
    ld a, (hl)
    ld hl, #1E15
    call write_vram_byte_ext
    ld a, 8
    ld hl, #1E16
    call write_vram_byte_ext
    xor a
    ld hl, #1E17
    call write_vram_byte_ext
.enemy_sprite_4_done:

    ; Enemy/hazard sprite slot 5.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 6
    jp nc, .enemy_sprite_5_visible
    ld a, 208
    ld hl, #1E18
    call write_vram_byte_ext
    jp .enemy_sprite_5_done
.enemy_sprite_5_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de
    ld a, (hl)
    ld hl, #1E18
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de
    ld a, (hl)
    ld hl, #1E19
    call write_vram_byte_ext
    ld a, 8
    ld hl, #1E1A
    call write_vram_byte_ext
    xor a
    ld hl, #1E1B
    call write_vram_byte_ext
.enemy_sprite_5_done:

    ; Enemy/hazard sprite slot 6.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 7
    jp nc, .enemy_sprite_6_visible
    ld a, 208
    ld hl, #1E1C
    call write_vram_byte_ext
    jp .enemy_sprite_6_done
.enemy_sprite_6_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de
    ld a, (hl)
    ld hl, #1E1C
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de
    ld a, (hl)
    ld hl, #1E1D
    call write_vram_byte_ext
    ld a, 8
    ld hl, #1E1E
    call write_vram_byte_ext
    xor a
    ld hl, #1E1F
    call write_vram_byte_ext
.enemy_sprite_6_done:

    ; Enemy/hazard sprite slot 7.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 8
    jp nc, .enemy_sprite_7_visible
    ld a, 208
    ld hl, #1E20
    call write_vram_byte_ext
    jp .enemy_sprite_7_done
.enemy_sprite_7_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de
    ld a, (hl)
    ld hl, #1E20
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de
    ld a, (hl)
    ld hl, #1E21
    call write_vram_byte_ext
    ld a, 8
    ld hl, #1E22
    call write_vram_byte_ext
    xor a
    ld hl, #1E23
    call write_vram_byte_ext
.enemy_sprite_7_done:

    ; Enemy/hazard sprite slot 8.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 9
    jp nc, .enemy_sprite_8_visible
    ld a, 208
    ld hl, #1E24
    call write_vram_byte_ext
    jp .enemy_sprite_8_done
.enemy_sprite_8_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de
    ld a, (hl)
    ld hl, #1E24
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de
    ld a, (hl)
    ld hl, #1E25
    call write_vram_byte_ext
    ld a, 8
    ld hl, #1E26
    call write_vram_byte_ext
    xor a
    ld hl, #1E27
    call write_vram_byte_ext
.enemy_sprite_8_done:

    ; Enemy/hazard sprite slot 9.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 10
    jp nc, .enemy_sprite_9_visible
    ld a, 208
    ld hl, #1E28
    call write_vram_byte_ext
    jp .enemy_sprite_9_done
.enemy_sprite_9_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de
    ld a, (hl)
    ld hl, #1E28
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de
    ld a, (hl)
    ld hl, #1E29
    call write_vram_byte_ext
    ld a, 8
    ld hl, #1E2A
    call write_vram_byte_ext
    xor a
    ld hl, #1E2B
    call write_vram_byte_ext
.enemy_sprite_9_done:

    ; Enemy/hazard sprite slot 10.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 11
    jp nc, .enemy_sprite_10_visible
    ld a, 208
    ld hl, #1E2C
    call write_vram_byte_ext
    jp .enemy_sprite_10_done
.enemy_sprite_10_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de
    ld a, (hl)
    ld hl, #1E2C
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de
    ld a, (hl)
    ld hl, #1E2D
    call write_vram_byte_ext
    ld a, 8
    ld hl, #1E2E
    call write_vram_byte_ext
    xor a
    ld hl, #1E2F
    call write_vram_byte_ext
.enemy_sprite_10_done:

    ; Enemy/hazard sprite slot 11.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 12
    jp nc, .enemy_sprite_11_visible
    ld a, 208
    ld hl, #1E30
    call write_vram_byte_ext
    jp .enemy_sprite_11_done
.enemy_sprite_11_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de
    ld a, (hl)
    ld hl, #1E30
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de
    ld a, (hl)
    ld hl, #1E31
    call write_vram_byte_ext
    ld a, 8
    ld hl, #1E32
    call write_vram_byte_ext
    xor a
    ld hl, #1E33
    call write_vram_byte_ext
.enemy_sprite_11_done:
    ; Player bullet hardware sprite slot 0.
    ld a, (msx2_player_bullet_active)
    or a
    jp nz, .player_bullet_sprite_visible
    ld a, 208
    ld hl, #1E34
    call write_vram_byte_ext
    jp .player_bullet_sprite_done
.player_bullet_sprite_visible:
    ld a, (msx2_player_bullet_y)
    ld hl, #1E34
    call write_vram_byte_ext
    ld a, (msx2_player_bullet_x)
    ld hl, #1E35
    call write_vram_byte_ext
    ld a, 12
    ld hl, #1E36
    call write_vram_byte_ext
    xor a
    ld hl, #1E37
    call write_vram_byte_ext
.player_bullet_sprite_done:

    ; Player bullet hardware sprite slot 1.
    ld a, (msx2_player_bullet_1_active)
    or a
    jp nz, .player_bullet_1_sprite_visible
    ld a, 208
    ld hl, #1E38
    call write_vram_byte_ext
    jp .player_bullet_1_sprite_done
.player_bullet_1_sprite_visible:
    ld a, (msx2_player_bullet_1_y)
    ld hl, #1E38
    call write_vram_byte_ext
    ld a, (msx2_player_bullet_1_x)
    ld hl, #1E39
    call write_vram_byte_ext
    ld a, 12
    ld hl, #1E3A
    call write_vram_byte_ext
    xor a
    ld hl, #1E3B
    call write_vram_byte_ext
.player_bullet_1_sprite_done:

    ; Enemy bullet hardware sprite slot.
    ld a, (msx2_enemy_bullet_active)
    or a
    jp nz, .enemy_bullet_sprite_visible
    ld a, 208
    ld hl, #1E3C
    call write_vram_byte_ext
    jp .enemy_bullet_sprite_done
.enemy_bullet_sprite_visible:
    ld a, (msx2_enemy_bullet_y)
    ld hl, #1E3C
    call write_vram_byte_ext
    ld a, (msx2_enemy_bullet_x)
    ld hl, #1E3D
    call write_vram_byte_ext
    ld a, 16
    ld hl, #1E3E
    call write_vram_byte_ext
    xor a
    ld hl, #1E3F
    call write_vram_byte_ext
.enemy_bullet_sprite_done:
    ld a, 208
    ld hl, #1E40
    call write_vram_byte_ext
    ret

upload_hardware_sprite_attrs:

    call update_msx2_effect_state
    call update_msx2_enemy_positions
    call update_msx2_enemy_state
    call write_hardware_sprite_attrs
    ret

msx2_reset_enemy_runtime_for_current_screen:
    ; Copy static enemy slots for current screen into mutable runtime RAM.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_x
    add hl, de
    ld de, msx2_enemy_runtime_x
    ld bc, 12
    ldir
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_y
    add hl, de
    ld de, msx2_enemy_runtime_y
    ld bc, 12
    ldir
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_dx
    add hl, de
    ld de, msx2_enemy_runtime_dx
    ld bc, 12
    ldir
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_dy
    add hl, de
    ld de, msx2_enemy_runtime_dy
    ld bc, 12
    ldir
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_mode
    add hl, de
    ld de, msx2_enemy_runtime_mode
    ld bc, 12
    ldir
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_speed
    add hl, de
    ld de, msx2_enemy_runtime_speed
    ld bc, 12
    ldir
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_speed
    add hl, de
    ld de, msx2_enemy_runtime_tick
    ld bc, 12
    ldir

    ret

update_msx2_enemy_positions:
    ; Move active enemy/hazard runtime slots before collision checks.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_game_over_flag)
    or a
    ret nz
    ld a, (msx2_level_complete_flag)
    or a
    ret nz
    call update_msx2_enemy_position_slot_0
    call update_msx2_enemy_position_slot_1
    call update_msx2_enemy_position_slot_2
    call update_msx2_enemy_position_slot_3
    call update_msx2_enemy_position_slot_4
    call update_msx2_enemy_position_slot_5
    call update_msx2_enemy_position_slot_6
    call update_msx2_enemy_position_slot_7
    call update_msx2_enemy_position_slot_8
    call update_msx2_enemy_position_slot_9
    call update_msx2_enemy_position_slot_10
    call update_msx2_enemy_position_slot_11
    ret



update_msx2_enemy_position_slot_0:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 1
    ret c
    ld hl, msx2_enemy_runtime_mode

    ld a, (hl)
    cp 4
    jp z, .enemy_slot_0_ball_bounce
    cp 3
    jp z, .enemy_slot_0_dive
    cp 2
    jp z, .enemy_slot_0_ghost_maze
    ld hl, msx2_enemy_runtime_dx

    ld a, (hl)
    or a
    jp z, .enemy_slot_0_check_y
    cp #FF
    jp z, .enemy_slot_0_left
.enemy_slot_0_right:
    ld hl, msx2_enemy_runtime_x

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_0_turn_left
    inc b
    ld hl, msx2_enemy_runtime_x

    ld (hl), b
    ret
.enemy_slot_0_turn_left:
    ld hl, msx2_enemy_runtime_dx

    ld (hl), #FF
.enemy_slot_0_left:
    ld hl, msx2_enemy_runtime_x

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_0_turn_right
    jp z, .enemy_slot_0_turn_right
    dec b
    ld hl, msx2_enemy_runtime_x

    ld (hl), b
    ret
.enemy_slot_0_turn_right:
    ld hl, msx2_enemy_runtime_dx

    ld (hl), 1
    ret
.enemy_slot_0_check_y:
    ld hl, msx2_enemy_runtime_dy

    ld a, (hl)
    or a
    ret z
    cp #FF
    jp z, .enemy_slot_0_up
.enemy_slot_0_down:
    ld hl, msx2_enemy_runtime_y

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_0_turn_up
    inc b
    ld hl, msx2_enemy_runtime_y

    ld (hl), b
    ret
.enemy_slot_0_turn_up:
    ld hl, msx2_enemy_runtime_dy

    ld (hl), #FF
.enemy_slot_0_up:
    ld hl, msx2_enemy_runtime_y

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_0_turn_down
    jp z, .enemy_slot_0_turn_down
    dec b
    ld hl, msx2_enemy_runtime_y

    ld (hl), b
    ret
.enemy_slot_0_turn_down:
    ld hl, msx2_enemy_runtime_dy

    ld (hl), 1
    ret

.enemy_slot_0_ball_bounce:
    ; Pong/Arkanoid ball movement. Runtime dx/dy are signed bytes. Clobbers AF/BC/DE/HL.

    ld hl, msx2_enemy_runtime_dx

    ld a, (hl)
    bit 7, a
    jp nz, .enemy_slot_0_ball_left
.enemy_slot_0_ball_right:
    ld c, a
    ld hl, msx2_enemy_runtime_x

    ld a, (hl)
    add a, c
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_0_ball_turn_left
    ld hl, msx2_enemy_runtime_x

    ld (hl), b
    jp .enemy_slot_0_ball_y
.enemy_slot_0_ball_turn_left:
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_x

    ld (hl), b
    xor a
    sub c
    ld hl, msx2_enemy_runtime_dx

    ld (hl), a
    jp .enemy_slot_0_ball_y
.enemy_slot_0_ball_left:
    neg
    ld c, a
    ld hl, msx2_enemy_runtime_x

    ld a, (hl)
    sub c
    jp c, .enemy_slot_0_ball_turn_right
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_0_ball_turn_right
    ld hl, msx2_enemy_runtime_x

    ld (hl), b
    jp .enemy_slot_0_ball_y
.enemy_slot_0_ball_turn_right:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_x

    ld (hl), b
    ld a, c
    ld hl, msx2_enemy_runtime_dx

    ld (hl), a

.enemy_slot_0_ball_y:
    ld hl, msx2_enemy_runtime_dy

    ld a, (hl)
    bit 7, a
    jp nz, .enemy_slot_0_ball_up
.enemy_slot_0_ball_down:
    ld c, a
    ld hl, msx2_enemy_runtime_y

    ld a, (hl)
    add a, c
    ld b, a

    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_0_ball_check_paddle

.enemy_slot_0_ball_store_y:
    ld hl, msx2_enemy_runtime_y

    ld (hl), b
    jp .enemy_slot_0_ball_check_brick
.enemy_slot_0_ball_check_paddle:
    ld hl, msx2_enemy_runtime_x

    ld b, (hl)
    ld a, b
    add a, 8
    ld c, a
    ld a, (msx2_player_sprite_x)
    ld e, a
    ld a, c
    sub e
    cp 32
    jp nc, .enemy_slot_0_ball_no_paddle_hit

    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_y

    ld (hl), b
    ld hl, msx2_enemy_runtime_dy

    ld a, (hl)
    neg
    ld hl, msx2_enemy_runtime_dy

    ld (hl), a
    ret
.enemy_slot_0_ball_no_paddle_hit:
    jp .enemy_slot_0_ball_miss_paddle
.enemy_slot_0_ball_miss_paddle:
    call msx2_apply_damage_respawn
    call msx2_reset_enemy_runtime_for_current_screen
    ld a, 1
    ld (msx2_player_bullet_active), a
    ret
.enemy_slot_0_ball_up:
    neg
    ld c, a
    ld hl, msx2_enemy_runtime_y

    ld a, (hl)
    sub c
    jp c, .enemy_slot_0_ball_turn_down
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_0_ball_turn_down
    ld hl, msx2_enemy_runtime_y

    ld (hl), b
    jp .enemy_slot_0_ball_check_brick
.enemy_slot_0_ball_turn_down:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_y

    ld (hl), b
    ld a, c
    ld hl, msx2_enemy_runtime_dy

    ld (hl), a
    jp .enemy_slot_0_ball_check_brick

.enemy_slot_0_ball_check_brick:
    ; Ball center probes mutable effect RAM. Effect 3 is collectible/brick and is cleared on hit.
    ; Clobbers AF/BC/DE/HL.
    ld hl, msx2_enemy_runtime_x

    ld a, (hl)
    add a, 8
    ld b, a
    ld hl, msx2_enemy_runtime_y

    ld a, (hl)
    add a, 8
    ld c, a
    push bc
    call msx2_effect_at_pixel
    cp 3
    jp z, .enemy_slot_0_ball_break_brick
    pop bc
    ret
.enemy_slot_0_ball_break_brick:
    xor a
    ld (hl), a
    pop bc
    call clear_msx2_effect_visual_at_pixel
    ld hl, msx2_enemy_runtime_dy

    ld a, (hl)
    neg
    ld (hl), a
    ld a, (msx2_score_lo)
    add a, 10
    ld (msx2_score_lo), a
    jp nc, .enemy_slot_0_ball_brick_score_done
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.enemy_slot_0_ball_brick_score_done:
    ld a, (msx2_collectible_count)
    inc a
    ld (msx2_collectible_count), a

    ret

.enemy_slot_0_dive:
    ld hl, msx2_enemy_runtime_tick

    ld a, (hl)
    or a
    jp z, .enemy_slot_0_dive_active
    dec a
    ld (hl), a
    ret

.enemy_slot_0_dive_active:
    ld hl, msx2_enemy_runtime_y

    ld a, (hl)
    cp 208
    ret nc
    cp 200
    jp nc, .enemy_slot_0_dive_reset
    add a, 2
    ld (hl), a
    ld hl, msx2_enemy_runtime_x

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_0_dive_left
    jp z, .enemy_slot_0_dive_done
    inc b
    ld (hl), b
    ret
.enemy_slot_0_dive_left:
    dec b
    ld (hl), b
.enemy_slot_0_dive_done:
    ret
.enemy_slot_0_dive_reset:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_x
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_x

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_y
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_y

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_speed
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_tick

    ld (hl), a
    ret

.enemy_slot_0_ghost_maze:
    ld hl, msx2_enemy_runtime_tick

    ld a, (hl)
    or a
    jp z, .enemy_slot_0_ghost_tick_ready
    dec a
    ld (hl), a
    ret
.enemy_slot_0_ghost_tick_ready:
    ld hl, msx2_enemy_runtime_speed

    ld a, (hl)
    or a
    jp nz, .enemy_slot_0_ghost_store_tick
    ld a, 2
.enemy_slot_0_ghost_store_tick:
    ld hl, msx2_enemy_runtime_tick

    ld (hl), a
    ld hl, msx2_enemy_runtime_x

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_0_ghost_forward
    ld hl, msx2_enemy_runtime_y

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_0_ghost_forward
    ld hl, msx2_enemy_runtime_x

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_0_ghost_prefer_left
.enemy_slot_0_ghost_prefer_right:
    jp .enemy_slot_0_ghost_try_right_first
.enemy_slot_0_ghost_prefer_left:
    jp .enemy_slot_0_ghost_try_left_first
.enemy_slot_0_ghost_try_right_first:
    call .enemy_slot_0_ghost_can_right
    jp z, .enemy_slot_0_ghost_set_right
    jp .enemy_slot_0_ghost_try_vertical
.enemy_slot_0_ghost_try_left_first:
    call .enemy_slot_0_ghost_can_left
    jp z, .enemy_slot_0_ghost_set_left
.enemy_slot_0_ghost_try_vertical:
    ld hl, msx2_enemy_runtime_y

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    cp b
    jp c, .enemy_slot_0_ghost_try_up_first
    call .enemy_slot_0_ghost_can_down
    jp z, .enemy_slot_0_ghost_set_down
    call .enemy_slot_0_ghost_can_up
    jp z, .enemy_slot_0_ghost_set_up
    jp .enemy_slot_0_ghost_try_reverse
.enemy_slot_0_ghost_try_up_first:
    call .enemy_slot_0_ghost_can_up
    jp z, .enemy_slot_0_ghost_set_up
    call .enemy_slot_0_ghost_can_down
    jp z, .enemy_slot_0_ghost_set_down
.enemy_slot_0_ghost_try_reverse:
    ld hl, msx2_enemy_runtime_dx

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_0_ghost_set_left
    cp #FF
    jp z, .enemy_slot_0_ghost_set_right
    ld hl, msx2_enemy_runtime_dy

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_0_ghost_set_up
    cp #FF
    jp z, .enemy_slot_0_ghost_set_down
    ret
.enemy_slot_0_ghost_forward:
    ld hl, msx2_enemy_runtime_dx

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_0_ghost_move_right_checked
    cp #FF
    jp z, .enemy_slot_0_ghost_move_left_checked
    ld hl, msx2_enemy_runtime_dy

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_0_ghost_move_down_checked
    cp #FF
    jp z, .enemy_slot_0_ghost_move_up_checked
    jp .enemy_slot_0_ghost_try_right_first
.enemy_slot_0_ghost_set_right:
    ld hl, msx2_enemy_runtime_dx

    ld (hl), 1
    ld hl, msx2_enemy_runtime_dy

    ld (hl), 0
    jp .enemy_slot_0_ghost_move_right
.enemy_slot_0_ghost_set_left:
    ld hl, msx2_enemy_runtime_dx

    ld (hl), #FF
    ld hl, msx2_enemy_runtime_dy

    ld (hl), 0
    jp .enemy_slot_0_ghost_move_left
.enemy_slot_0_ghost_set_down:
    ld hl, msx2_enemy_runtime_dx

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy

    ld (hl), 1
    jp .enemy_slot_0_ghost_move_down
.enemy_slot_0_ghost_set_up:
    ld hl, msx2_enemy_runtime_dx

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy

    ld (hl), #FF
    jp .enemy_slot_0_ghost_move_up
.enemy_slot_0_ghost_move_right_checked:
    call .enemy_slot_0_ghost_can_right
    jp nz, .enemy_slot_0_ghost_try_vertical
.enemy_slot_0_ghost_move_right:
    ld hl, msx2_enemy_runtime_x

    inc (hl)
    ret
.enemy_slot_0_ghost_move_left_checked:
    call .enemy_slot_0_ghost_can_left
    jp nz, .enemy_slot_0_ghost_try_vertical
.enemy_slot_0_ghost_move_left:
    ld hl, msx2_enemy_runtime_x

    dec (hl)
    ret
.enemy_slot_0_ghost_move_down_checked:
    call .enemy_slot_0_ghost_can_down
    jp nz, .enemy_slot_0_ghost_try_right_first
.enemy_slot_0_ghost_move_down:
    ld hl, msx2_enemy_runtime_y

    inc (hl)
    ret
.enemy_slot_0_ghost_move_up_checked:
    call .enemy_slot_0_ghost_can_up
    jp nz, .enemy_slot_0_ghost_try_right_first
.enemy_slot_0_ghost_move_up:
    ld hl, msx2_enemy_runtime_y

    dec (hl)
    ret
.enemy_slot_0_ghost_can_right:
    ld hl, msx2_enemy_runtime_x

    ld a, (hl)
    cp 239
    jp nc, .enemy_slot_0_ghost_blocked
    inc a
    add a, 15
    ld b, a
    ld hl, msx2_enemy_runtime_y

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_0_ghost_can_left:
    ld hl, msx2_enemy_runtime_x

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_0_ghost_blocked
    jp c, .enemy_slot_0_ghost_blocked
    dec a
    ld b, a
    ld hl, msx2_enemy_runtime_y

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_0_ghost_can_down:
    ld hl, msx2_enemy_runtime_y

    ld a, (hl)
    cp 196
    jp nc, .enemy_slot_0_ghost_blocked
    inc a
    add a, 15
    ld c, a
    ld hl, msx2_enemy_runtime_x

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_0_ghost_can_up:
    ld hl, msx2_enemy_runtime_y

    ld a, (hl)
    or a
    jp z, .enemy_slot_0_ghost_blocked
    dec a
    ld c, a
    ld hl, msx2_enemy_runtime_x

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_0_ghost_blocked:
    or 1
    ret

update_msx2_enemy_position_slot_1:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 2
    ret c
    ld hl, msx2_enemy_runtime_mode
    ld de, 1
    add hl, de

    ld a, (hl)
    cp 4
    jp z, .enemy_slot_1_ball_bounce
    cp 3
    jp z, .enemy_slot_1_dive
    cp 2
    jp z, .enemy_slot_1_ghost_maze
    ld hl, msx2_enemy_runtime_dx
    ld de, 1
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_1_check_y
    cp #FF
    jp z, .enemy_slot_1_left
.enemy_slot_1_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_1_turn_left
    inc b
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld (hl), b
    ret
.enemy_slot_1_turn_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 1
    add hl, de

    ld (hl), #FF
.enemy_slot_1_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_1_turn_right
    jp z, .enemy_slot_1_turn_right
    dec b
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld (hl), b
    ret
.enemy_slot_1_turn_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 1
    add hl, de

    ld (hl), 1
    ret
.enemy_slot_1_check_y:
    ld hl, msx2_enemy_runtime_dy
    ld de, 1
    add hl, de

    ld a, (hl)
    or a
    ret z
    cp #FF
    jp z, .enemy_slot_1_up
.enemy_slot_1_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_1_turn_up
    inc b
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld (hl), b
    ret
.enemy_slot_1_turn_up:
    ld hl, msx2_enemy_runtime_dy
    ld de, 1
    add hl, de

    ld (hl), #FF
.enemy_slot_1_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_1_turn_down
    jp z, .enemy_slot_1_turn_down
    dec b
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld (hl), b
    ret
.enemy_slot_1_turn_down:
    ld hl, msx2_enemy_runtime_dy
    ld de, 1
    add hl, de

    ld (hl), 1
    ret

.enemy_slot_1_ball_bounce:
    ; Pong/Arkanoid ball movement. Runtime dx/dy are signed bytes. Clobbers AF/BC/DE/HL.

    ld hl, msx2_enemy_runtime_dx
    ld de, 1
    add hl, de

    ld a, (hl)
    bit 7, a
    jp nz, .enemy_slot_1_ball_left
.enemy_slot_1_ball_right:
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld a, (hl)
    add a, c
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_1_ball_turn_left
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld (hl), b
    jp .enemy_slot_1_ball_y
.enemy_slot_1_ball_turn_left:
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld (hl), b
    xor a
    sub c
    ld hl, msx2_enemy_runtime_dx
    ld de, 1
    add hl, de

    ld (hl), a
    jp .enemy_slot_1_ball_y
.enemy_slot_1_ball_left:
    neg
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld a, (hl)
    sub c
    jp c, .enemy_slot_1_ball_turn_right
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_1_ball_turn_right
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld (hl), b
    jp .enemy_slot_1_ball_y
.enemy_slot_1_ball_turn_right:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld (hl), b
    ld a, c
    ld hl, msx2_enemy_runtime_dx
    ld de, 1
    add hl, de

    ld (hl), a

.enemy_slot_1_ball_y:
    ld hl, msx2_enemy_runtime_dy
    ld de, 1
    add hl, de

    ld a, (hl)
    bit 7, a
    jp nz, .enemy_slot_1_ball_up
.enemy_slot_1_ball_down:
    ld c, a
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld a, (hl)
    add a, c
    ld b, a

    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_1_ball_check_paddle

.enemy_slot_1_ball_store_y:
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld (hl), b
    jp .enemy_slot_1_ball_check_brick
.enemy_slot_1_ball_check_paddle:
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld b, (hl)
    ld a, b
    add a, 8
    ld c, a
    ld a, (msx2_player_sprite_x)
    ld e, a
    ld a, c
    sub e
    cp 32
    jp nc, .enemy_slot_1_ball_no_paddle_hit

    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld (hl), b
    ld hl, msx2_enemy_runtime_dy
    ld de, 1
    add hl, de

    ld a, (hl)
    neg
    ld hl, msx2_enemy_runtime_dy
    ld de, 1
    add hl, de

    ld (hl), a
    ret
.enemy_slot_1_ball_no_paddle_hit:
    jp .enemy_slot_1_ball_miss_paddle
.enemy_slot_1_ball_miss_paddle:

    call msx2_apply_damage_respawn
    call write_hardware_sprite_attrs
    ret
.enemy_slot_1_ball_up:
    neg
    ld c, a
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld a, (hl)
    sub c
    jp c, .enemy_slot_1_ball_turn_down
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_1_ball_turn_down
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld (hl), b
    jp .enemy_slot_1_ball_check_brick
.enemy_slot_1_ball_turn_down:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld (hl), b
    ld a, c
    ld hl, msx2_enemy_runtime_dy
    ld de, 1
    add hl, de

    ld (hl), a
    jp .enemy_slot_1_ball_check_brick

.enemy_slot_1_ball_check_brick:
    ; Ball center probes mutable effect RAM. Effect 3 is collectible/brick and is cleared on hit.
    ; Clobbers AF/BC/DE/HL.
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    push bc
    call msx2_effect_at_pixel
    cp 3
    jp z, .enemy_slot_1_ball_break_brick
    pop bc
    ret
.enemy_slot_1_ball_break_brick:
    xor a
    ld (hl), a
    pop bc
    call clear_msx2_effect_visual_at_pixel
    ld hl, msx2_enemy_runtime_dy
    ld de, 1
    add hl, de

    ld a, (hl)
    neg
    ld (hl), a
    ld a, (msx2_score_lo)
    add a, 10
    ld (msx2_score_lo), a
    jp nc, .enemy_slot_1_ball_brick_score_done
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.enemy_slot_1_ball_brick_score_done:
    ld a, (msx2_collectible_count)
    inc a
    ld (msx2_collectible_count), a

    ret

.enemy_slot_1_dive:
    ld hl, msx2_enemy_runtime_tick
    ld de, 1
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_1_dive_active
    dec a
    ld (hl), a
    ret

.enemy_slot_1_dive_active:
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld a, (hl)
    cp 208
    ret nc
    cp 200
    jp nc, .enemy_slot_1_dive_reset
    add a, 2
    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_1_dive_left
    jp z, .enemy_slot_1_dive_done
    inc b
    ld (hl), b
    ret
.enemy_slot_1_dive_left:
    dec b
    ld (hl), b
.enemy_slot_1_dive_done:
    ret
.enemy_slot_1_dive_reset:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_x
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_y
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_speed
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_tick
    ld de, 1
    add hl, de

    ld (hl), a
    ret

.enemy_slot_1_ghost_maze:
    ld hl, msx2_enemy_runtime_tick
    ld de, 1
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_1_ghost_tick_ready
    dec a
    ld (hl), a
    ret
.enemy_slot_1_ghost_tick_ready:
    ld hl, msx2_enemy_runtime_speed
    ld de, 1
    add hl, de

    ld a, (hl)
    or a
    jp nz, .enemy_slot_1_ghost_store_tick
    ld a, 2
.enemy_slot_1_ghost_store_tick:
    ld hl, msx2_enemy_runtime_tick
    ld de, 1
    add hl, de

    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_1_ghost_forward
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_1_ghost_forward
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_1_ghost_prefer_left
.enemy_slot_1_ghost_prefer_right:
    jp .enemy_slot_1_ghost_try_right_first
.enemy_slot_1_ghost_prefer_left:
    jp .enemy_slot_1_ghost_try_left_first
.enemy_slot_1_ghost_try_right_first:
    call .enemy_slot_1_ghost_can_right
    jp z, .enemy_slot_1_ghost_set_right
    jp .enemy_slot_1_ghost_try_vertical
.enemy_slot_1_ghost_try_left_first:
    call .enemy_slot_1_ghost_can_left
    jp z, .enemy_slot_1_ghost_set_left
.enemy_slot_1_ghost_try_vertical:
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    cp b
    jp c, .enemy_slot_1_ghost_try_up_first
    call .enemy_slot_1_ghost_can_down
    jp z, .enemy_slot_1_ghost_set_down
    call .enemy_slot_1_ghost_can_up
    jp z, .enemy_slot_1_ghost_set_up
    jp .enemy_slot_1_ghost_try_reverse
.enemy_slot_1_ghost_try_up_first:
    call .enemy_slot_1_ghost_can_up
    jp z, .enemy_slot_1_ghost_set_up
    call .enemy_slot_1_ghost_can_down
    jp z, .enemy_slot_1_ghost_set_down
.enemy_slot_1_ghost_try_reverse:
    ld hl, msx2_enemy_runtime_dx
    ld de, 1
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_1_ghost_set_left
    cp #FF
    jp z, .enemy_slot_1_ghost_set_right
    ld hl, msx2_enemy_runtime_dy
    ld de, 1
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_1_ghost_set_up
    cp #FF
    jp z, .enemy_slot_1_ghost_set_down
    ret
.enemy_slot_1_ghost_forward:
    ld hl, msx2_enemy_runtime_dx
    ld de, 1
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_1_ghost_move_right_checked
    cp #FF
    jp z, .enemy_slot_1_ghost_move_left_checked
    ld hl, msx2_enemy_runtime_dy
    ld de, 1
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_1_ghost_move_down_checked
    cp #FF
    jp z, .enemy_slot_1_ghost_move_up_checked
    jp .enemy_slot_1_ghost_try_right_first
.enemy_slot_1_ghost_set_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 1
    add hl, de

    ld (hl), 1
    ld hl, msx2_enemy_runtime_dy
    ld de, 1
    add hl, de

    ld (hl), 0
    jp .enemy_slot_1_ghost_move_right
.enemy_slot_1_ghost_set_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 1
    add hl, de

    ld (hl), #FF
    ld hl, msx2_enemy_runtime_dy
    ld de, 1
    add hl, de

    ld (hl), 0
    jp .enemy_slot_1_ghost_move_left
.enemy_slot_1_ghost_set_down:
    ld hl, msx2_enemy_runtime_dx
    ld de, 1
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 1
    add hl, de

    ld (hl), 1
    jp .enemy_slot_1_ghost_move_down
.enemy_slot_1_ghost_set_up:
    ld hl, msx2_enemy_runtime_dx
    ld de, 1
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 1
    add hl, de

    ld (hl), #FF
    jp .enemy_slot_1_ghost_move_up
.enemy_slot_1_ghost_move_right_checked:
    call .enemy_slot_1_ghost_can_right
    jp nz, .enemy_slot_1_ghost_try_vertical
.enemy_slot_1_ghost_move_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    inc (hl)
    ret
.enemy_slot_1_ghost_move_left_checked:
    call .enemy_slot_1_ghost_can_left
    jp nz, .enemy_slot_1_ghost_try_vertical
.enemy_slot_1_ghost_move_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    dec (hl)
    ret
.enemy_slot_1_ghost_move_down_checked:
    call .enemy_slot_1_ghost_can_down
    jp nz, .enemy_slot_1_ghost_try_right_first
.enemy_slot_1_ghost_move_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    inc (hl)
    ret
.enemy_slot_1_ghost_move_up_checked:
    call .enemy_slot_1_ghost_can_up
    jp nz, .enemy_slot_1_ghost_try_right_first
.enemy_slot_1_ghost_move_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    dec (hl)
    ret
.enemy_slot_1_ghost_can_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld a, (hl)
    cp 239
    jp nc, .enemy_slot_1_ghost_blocked
    inc a
    add a, 15
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_1_ghost_can_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_1_ghost_blocked
    jp c, .enemy_slot_1_ghost_blocked
    dec a
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_1_ghost_can_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld a, (hl)
    cp 196
    jp nc, .enemy_slot_1_ghost_blocked
    inc a
    add a, 15
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_1_ghost_can_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_1_ghost_blocked
    dec a
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_1_ghost_blocked:
    or 1
    ret

update_msx2_enemy_position_slot_2:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 3
    ret c
    ld hl, msx2_enemy_runtime_mode
    ld de, 2
    add hl, de

    ld a, (hl)
    cp 4
    jp z, .enemy_slot_2_ball_bounce
    cp 3
    jp z, .enemy_slot_2_dive
    cp 2
    jp z, .enemy_slot_2_ghost_maze
    ld hl, msx2_enemy_runtime_dx
    ld de, 2
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_2_check_y
    cp #FF
    jp z, .enemy_slot_2_left
.enemy_slot_2_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_2_turn_left
    inc b
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld (hl), b
    ret
.enemy_slot_2_turn_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 2
    add hl, de

    ld (hl), #FF
.enemy_slot_2_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_2_turn_right
    jp z, .enemy_slot_2_turn_right
    dec b
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld (hl), b
    ret
.enemy_slot_2_turn_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 2
    add hl, de

    ld (hl), 1
    ret
.enemy_slot_2_check_y:
    ld hl, msx2_enemy_runtime_dy
    ld de, 2
    add hl, de

    ld a, (hl)
    or a
    ret z
    cp #FF
    jp z, .enemy_slot_2_up
.enemy_slot_2_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_2_turn_up
    inc b
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld (hl), b
    ret
.enemy_slot_2_turn_up:
    ld hl, msx2_enemy_runtime_dy
    ld de, 2
    add hl, de

    ld (hl), #FF
.enemy_slot_2_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_2_turn_down
    jp z, .enemy_slot_2_turn_down
    dec b
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld (hl), b
    ret
.enemy_slot_2_turn_down:
    ld hl, msx2_enemy_runtime_dy
    ld de, 2
    add hl, de

    ld (hl), 1
    ret

.enemy_slot_2_ball_bounce:
    ; Pong/Arkanoid ball movement. Runtime dx/dy are signed bytes. Clobbers AF/BC/DE/HL.

    ld hl, msx2_enemy_runtime_dx
    ld de, 2
    add hl, de

    ld a, (hl)
    bit 7, a
    jp nz, .enemy_slot_2_ball_left
.enemy_slot_2_ball_right:
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld a, (hl)
    add a, c
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_2_ball_turn_left
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld (hl), b
    jp .enemy_slot_2_ball_y
.enemy_slot_2_ball_turn_left:
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld (hl), b
    xor a
    sub c
    ld hl, msx2_enemy_runtime_dx
    ld de, 2
    add hl, de

    ld (hl), a
    jp .enemy_slot_2_ball_y
.enemy_slot_2_ball_left:
    neg
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld a, (hl)
    sub c
    jp c, .enemy_slot_2_ball_turn_right
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_2_ball_turn_right
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld (hl), b
    jp .enemy_slot_2_ball_y
.enemy_slot_2_ball_turn_right:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld (hl), b
    ld a, c
    ld hl, msx2_enemy_runtime_dx
    ld de, 2
    add hl, de

    ld (hl), a

.enemy_slot_2_ball_y:
    ld hl, msx2_enemy_runtime_dy
    ld de, 2
    add hl, de

    ld a, (hl)
    bit 7, a
    jp nz, .enemy_slot_2_ball_up
.enemy_slot_2_ball_down:
    ld c, a
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld a, (hl)
    add a, c
    ld b, a

    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_2_ball_check_paddle

.enemy_slot_2_ball_store_y:
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld (hl), b
    jp .enemy_slot_2_ball_check_brick
.enemy_slot_2_ball_check_paddle:
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld b, (hl)
    ld a, b
    add a, 8
    ld c, a
    ld a, (msx2_player_sprite_x)
    ld e, a
    ld a, c
    sub e
    cp 32
    jp nc, .enemy_slot_2_ball_no_paddle_hit

    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld (hl), b
    ld hl, msx2_enemy_runtime_dy
    ld de, 2
    add hl, de

    ld a, (hl)
    neg
    ld hl, msx2_enemy_runtime_dy
    ld de, 2
    add hl, de

    ld (hl), a
    ret
.enemy_slot_2_ball_no_paddle_hit:
    jp .enemy_slot_2_ball_miss_paddle
.enemy_slot_2_ball_miss_paddle:

    call msx2_apply_damage_respawn
    call write_hardware_sprite_attrs
    ret
.enemy_slot_2_ball_up:
    neg
    ld c, a
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld a, (hl)
    sub c
    jp c, .enemy_slot_2_ball_turn_down
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_2_ball_turn_down
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld (hl), b
    jp .enemy_slot_2_ball_check_brick
.enemy_slot_2_ball_turn_down:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld (hl), b
    ld a, c
    ld hl, msx2_enemy_runtime_dy
    ld de, 2
    add hl, de

    ld (hl), a
    jp .enemy_slot_2_ball_check_brick

.enemy_slot_2_ball_check_brick:
    ; Ball center probes mutable effect RAM. Effect 3 is collectible/brick and is cleared on hit.
    ; Clobbers AF/BC/DE/HL.
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    push bc
    call msx2_effect_at_pixel
    cp 3
    jp z, .enemy_slot_2_ball_break_brick
    pop bc
    ret
.enemy_slot_2_ball_break_brick:
    xor a
    ld (hl), a
    pop bc
    call clear_msx2_effect_visual_at_pixel
    ld hl, msx2_enemy_runtime_dy
    ld de, 2
    add hl, de

    ld a, (hl)
    neg
    ld (hl), a
    ld a, (msx2_score_lo)
    add a, 10
    ld (msx2_score_lo), a
    jp nc, .enemy_slot_2_ball_brick_score_done
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.enemy_slot_2_ball_brick_score_done:
    ld a, (msx2_collectible_count)
    inc a
    ld (msx2_collectible_count), a

    ret

.enemy_slot_2_dive:
    ld hl, msx2_enemy_runtime_tick
    ld de, 2
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_2_dive_active
    dec a
    ld (hl), a
    ret

.enemy_slot_2_dive_active:
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld a, (hl)
    cp 208
    ret nc
    cp 200
    jp nc, .enemy_slot_2_dive_reset
    add a, 2
    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_2_dive_left
    jp z, .enemy_slot_2_dive_done
    inc b
    ld (hl), b
    ret
.enemy_slot_2_dive_left:
    dec b
    ld (hl), b
.enemy_slot_2_dive_done:
    ret
.enemy_slot_2_dive_reset:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_x
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_y
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_speed
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_tick
    ld de, 2
    add hl, de

    ld (hl), a
    ret

.enemy_slot_2_ghost_maze:
    ld hl, msx2_enemy_runtime_tick
    ld de, 2
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_2_ghost_tick_ready
    dec a
    ld (hl), a
    ret
.enemy_slot_2_ghost_tick_ready:
    ld hl, msx2_enemy_runtime_speed
    ld de, 2
    add hl, de

    ld a, (hl)
    or a
    jp nz, .enemy_slot_2_ghost_store_tick
    ld a, 2
.enemy_slot_2_ghost_store_tick:
    ld hl, msx2_enemy_runtime_tick
    ld de, 2
    add hl, de

    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_2_ghost_forward
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_2_ghost_forward
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_2_ghost_prefer_left
.enemy_slot_2_ghost_prefer_right:
    jp .enemy_slot_2_ghost_try_right_first
.enemy_slot_2_ghost_prefer_left:
    jp .enemy_slot_2_ghost_try_left_first
.enemy_slot_2_ghost_try_right_first:
    call .enemy_slot_2_ghost_can_right
    jp z, .enemy_slot_2_ghost_set_right
    jp .enemy_slot_2_ghost_try_vertical
.enemy_slot_2_ghost_try_left_first:
    call .enemy_slot_2_ghost_can_left
    jp z, .enemy_slot_2_ghost_set_left
.enemy_slot_2_ghost_try_vertical:
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    cp b
    jp c, .enemy_slot_2_ghost_try_up_first
    call .enemy_slot_2_ghost_can_down
    jp z, .enemy_slot_2_ghost_set_down
    call .enemy_slot_2_ghost_can_up
    jp z, .enemy_slot_2_ghost_set_up
    jp .enemy_slot_2_ghost_try_reverse
.enemy_slot_2_ghost_try_up_first:
    call .enemy_slot_2_ghost_can_up
    jp z, .enemy_slot_2_ghost_set_up
    call .enemy_slot_2_ghost_can_down
    jp z, .enemy_slot_2_ghost_set_down
.enemy_slot_2_ghost_try_reverse:
    ld hl, msx2_enemy_runtime_dx
    ld de, 2
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_2_ghost_set_left
    cp #FF
    jp z, .enemy_slot_2_ghost_set_right
    ld hl, msx2_enemy_runtime_dy
    ld de, 2
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_2_ghost_set_up
    cp #FF
    jp z, .enemy_slot_2_ghost_set_down
    ret
.enemy_slot_2_ghost_forward:
    ld hl, msx2_enemy_runtime_dx
    ld de, 2
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_2_ghost_move_right_checked
    cp #FF
    jp z, .enemy_slot_2_ghost_move_left_checked
    ld hl, msx2_enemy_runtime_dy
    ld de, 2
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_2_ghost_move_down_checked
    cp #FF
    jp z, .enemy_slot_2_ghost_move_up_checked
    jp .enemy_slot_2_ghost_try_right_first
.enemy_slot_2_ghost_set_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 2
    add hl, de

    ld (hl), 1
    ld hl, msx2_enemy_runtime_dy
    ld de, 2
    add hl, de

    ld (hl), 0
    jp .enemy_slot_2_ghost_move_right
.enemy_slot_2_ghost_set_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 2
    add hl, de

    ld (hl), #FF
    ld hl, msx2_enemy_runtime_dy
    ld de, 2
    add hl, de

    ld (hl), 0
    jp .enemy_slot_2_ghost_move_left
.enemy_slot_2_ghost_set_down:
    ld hl, msx2_enemy_runtime_dx
    ld de, 2
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 2
    add hl, de

    ld (hl), 1
    jp .enemy_slot_2_ghost_move_down
.enemy_slot_2_ghost_set_up:
    ld hl, msx2_enemy_runtime_dx
    ld de, 2
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 2
    add hl, de

    ld (hl), #FF
    jp .enemy_slot_2_ghost_move_up
.enemy_slot_2_ghost_move_right_checked:
    call .enemy_slot_2_ghost_can_right
    jp nz, .enemy_slot_2_ghost_try_vertical
.enemy_slot_2_ghost_move_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    inc (hl)
    ret
.enemy_slot_2_ghost_move_left_checked:
    call .enemy_slot_2_ghost_can_left
    jp nz, .enemy_slot_2_ghost_try_vertical
.enemy_slot_2_ghost_move_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    dec (hl)
    ret
.enemy_slot_2_ghost_move_down_checked:
    call .enemy_slot_2_ghost_can_down
    jp nz, .enemy_slot_2_ghost_try_right_first
.enemy_slot_2_ghost_move_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    inc (hl)
    ret
.enemy_slot_2_ghost_move_up_checked:
    call .enemy_slot_2_ghost_can_up
    jp nz, .enemy_slot_2_ghost_try_right_first
.enemy_slot_2_ghost_move_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    dec (hl)
    ret
.enemy_slot_2_ghost_can_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld a, (hl)
    cp 239
    jp nc, .enemy_slot_2_ghost_blocked
    inc a
    add a, 15
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_2_ghost_can_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_2_ghost_blocked
    jp c, .enemy_slot_2_ghost_blocked
    dec a
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_2_ghost_can_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld a, (hl)
    cp 196
    jp nc, .enemy_slot_2_ghost_blocked
    inc a
    add a, 15
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_2_ghost_can_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_2_ghost_blocked
    dec a
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_2_ghost_blocked:
    or 1
    ret

update_msx2_enemy_position_slot_3:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 4
    ret c
    ld hl, msx2_enemy_runtime_mode
    ld de, 3
    add hl, de

    ld a, (hl)
    cp 4
    jp z, .enemy_slot_3_ball_bounce
    cp 3
    jp z, .enemy_slot_3_dive
    cp 2
    jp z, .enemy_slot_3_ghost_maze
    ld hl, msx2_enemy_runtime_dx
    ld de, 3
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_3_check_y
    cp #FF
    jp z, .enemy_slot_3_left
.enemy_slot_3_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_3_turn_left
    inc b
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld (hl), b
    ret
.enemy_slot_3_turn_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 3
    add hl, de

    ld (hl), #FF
.enemy_slot_3_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_3_turn_right
    jp z, .enemy_slot_3_turn_right
    dec b
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld (hl), b
    ret
.enemy_slot_3_turn_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 3
    add hl, de

    ld (hl), 1
    ret
.enemy_slot_3_check_y:
    ld hl, msx2_enemy_runtime_dy
    ld de, 3
    add hl, de

    ld a, (hl)
    or a
    ret z
    cp #FF
    jp z, .enemy_slot_3_up
.enemy_slot_3_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_3_turn_up
    inc b
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld (hl), b
    ret
.enemy_slot_3_turn_up:
    ld hl, msx2_enemy_runtime_dy
    ld de, 3
    add hl, de

    ld (hl), #FF
.enemy_slot_3_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_3_turn_down
    jp z, .enemy_slot_3_turn_down
    dec b
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld (hl), b
    ret
.enemy_slot_3_turn_down:
    ld hl, msx2_enemy_runtime_dy
    ld de, 3
    add hl, de

    ld (hl), 1
    ret

.enemy_slot_3_ball_bounce:
    ; Pong/Arkanoid ball movement. Runtime dx/dy are signed bytes. Clobbers AF/BC/DE/HL.

    ld hl, msx2_enemy_runtime_dx
    ld de, 3
    add hl, de

    ld a, (hl)
    bit 7, a
    jp nz, .enemy_slot_3_ball_left
.enemy_slot_3_ball_right:
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld a, (hl)
    add a, c
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_3_ball_turn_left
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld (hl), b
    jp .enemy_slot_3_ball_y
.enemy_slot_3_ball_turn_left:
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld (hl), b
    xor a
    sub c
    ld hl, msx2_enemy_runtime_dx
    ld de, 3
    add hl, de

    ld (hl), a
    jp .enemy_slot_3_ball_y
.enemy_slot_3_ball_left:
    neg
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld a, (hl)
    sub c
    jp c, .enemy_slot_3_ball_turn_right
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_3_ball_turn_right
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld (hl), b
    jp .enemy_slot_3_ball_y
.enemy_slot_3_ball_turn_right:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld (hl), b
    ld a, c
    ld hl, msx2_enemy_runtime_dx
    ld de, 3
    add hl, de

    ld (hl), a

.enemy_slot_3_ball_y:
    ld hl, msx2_enemy_runtime_dy
    ld de, 3
    add hl, de

    ld a, (hl)
    bit 7, a
    jp nz, .enemy_slot_3_ball_up
.enemy_slot_3_ball_down:
    ld c, a
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld a, (hl)
    add a, c
    ld b, a

    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_3_ball_check_paddle

.enemy_slot_3_ball_store_y:
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld (hl), b
    jp .enemy_slot_3_ball_check_brick
.enemy_slot_3_ball_check_paddle:
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld b, (hl)
    ld a, b
    add a, 8
    ld c, a
    ld a, (msx2_player_sprite_x)
    ld e, a
    ld a, c
    sub e
    cp 32
    jp nc, .enemy_slot_3_ball_no_paddle_hit

    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld (hl), b
    ld hl, msx2_enemy_runtime_dy
    ld de, 3
    add hl, de

    ld a, (hl)
    neg
    ld hl, msx2_enemy_runtime_dy
    ld de, 3
    add hl, de

    ld (hl), a
    ret
.enemy_slot_3_ball_no_paddle_hit:
    jp .enemy_slot_3_ball_miss_paddle
.enemy_slot_3_ball_miss_paddle:

    call msx2_apply_damage_respawn
    call write_hardware_sprite_attrs
    ret
.enemy_slot_3_ball_up:
    neg
    ld c, a
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld a, (hl)
    sub c
    jp c, .enemy_slot_3_ball_turn_down
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_3_ball_turn_down
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld (hl), b
    jp .enemy_slot_3_ball_check_brick
.enemy_slot_3_ball_turn_down:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld (hl), b
    ld a, c
    ld hl, msx2_enemy_runtime_dy
    ld de, 3
    add hl, de

    ld (hl), a
    jp .enemy_slot_3_ball_check_brick

.enemy_slot_3_ball_check_brick:
    ; Ball center probes mutable effect RAM. Effect 3 is collectible/brick and is cleared on hit.
    ; Clobbers AF/BC/DE/HL.
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    push bc
    call msx2_effect_at_pixel
    cp 3
    jp z, .enemy_slot_3_ball_break_brick
    pop bc
    ret
.enemy_slot_3_ball_break_brick:
    xor a
    ld (hl), a
    pop bc
    call clear_msx2_effect_visual_at_pixel
    ld hl, msx2_enemy_runtime_dy
    ld de, 3
    add hl, de

    ld a, (hl)
    neg
    ld (hl), a
    ld a, (msx2_score_lo)
    add a, 10
    ld (msx2_score_lo), a
    jp nc, .enemy_slot_3_ball_brick_score_done
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.enemy_slot_3_ball_brick_score_done:
    ld a, (msx2_collectible_count)
    inc a
    ld (msx2_collectible_count), a

    ret

.enemy_slot_3_dive:
    ld hl, msx2_enemy_runtime_tick
    ld de, 3
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_3_dive_active
    dec a
    ld (hl), a
    ret

.enemy_slot_3_dive_active:
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld a, (hl)
    cp 208
    ret nc
    cp 200
    jp nc, .enemy_slot_3_dive_reset
    add a, 2
    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_3_dive_left
    jp z, .enemy_slot_3_dive_done
    inc b
    ld (hl), b
    ret
.enemy_slot_3_dive_left:
    dec b
    ld (hl), b
.enemy_slot_3_dive_done:
    ret
.enemy_slot_3_dive_reset:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_x
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_y
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_speed
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_tick
    ld de, 3
    add hl, de

    ld (hl), a
    ret

.enemy_slot_3_ghost_maze:
    ld hl, msx2_enemy_runtime_tick
    ld de, 3
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_3_ghost_tick_ready
    dec a
    ld (hl), a
    ret
.enemy_slot_3_ghost_tick_ready:
    ld hl, msx2_enemy_runtime_speed
    ld de, 3
    add hl, de

    ld a, (hl)
    or a
    jp nz, .enemy_slot_3_ghost_store_tick
    ld a, 2
.enemy_slot_3_ghost_store_tick:
    ld hl, msx2_enemy_runtime_tick
    ld de, 3
    add hl, de

    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_3_ghost_forward
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_3_ghost_forward
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_3_ghost_prefer_left
.enemy_slot_3_ghost_prefer_right:
    jp .enemy_slot_3_ghost_try_right_first
.enemy_slot_3_ghost_prefer_left:
    jp .enemy_slot_3_ghost_try_left_first
.enemy_slot_3_ghost_try_right_first:
    call .enemy_slot_3_ghost_can_right
    jp z, .enemy_slot_3_ghost_set_right
    jp .enemy_slot_3_ghost_try_vertical
.enemy_slot_3_ghost_try_left_first:
    call .enemy_slot_3_ghost_can_left
    jp z, .enemy_slot_3_ghost_set_left
.enemy_slot_3_ghost_try_vertical:
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    cp b
    jp c, .enemy_slot_3_ghost_try_up_first
    call .enemy_slot_3_ghost_can_down
    jp z, .enemy_slot_3_ghost_set_down
    call .enemy_slot_3_ghost_can_up
    jp z, .enemy_slot_3_ghost_set_up
    jp .enemy_slot_3_ghost_try_reverse
.enemy_slot_3_ghost_try_up_first:
    call .enemy_slot_3_ghost_can_up
    jp z, .enemy_slot_3_ghost_set_up
    call .enemy_slot_3_ghost_can_down
    jp z, .enemy_slot_3_ghost_set_down
.enemy_slot_3_ghost_try_reverse:
    ld hl, msx2_enemy_runtime_dx
    ld de, 3
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_3_ghost_set_left
    cp #FF
    jp z, .enemy_slot_3_ghost_set_right
    ld hl, msx2_enemy_runtime_dy
    ld de, 3
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_3_ghost_set_up
    cp #FF
    jp z, .enemy_slot_3_ghost_set_down
    ret
.enemy_slot_3_ghost_forward:
    ld hl, msx2_enemy_runtime_dx
    ld de, 3
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_3_ghost_move_right_checked
    cp #FF
    jp z, .enemy_slot_3_ghost_move_left_checked
    ld hl, msx2_enemy_runtime_dy
    ld de, 3
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_3_ghost_move_down_checked
    cp #FF
    jp z, .enemy_slot_3_ghost_move_up_checked
    jp .enemy_slot_3_ghost_try_right_first
.enemy_slot_3_ghost_set_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 3
    add hl, de

    ld (hl), 1
    ld hl, msx2_enemy_runtime_dy
    ld de, 3
    add hl, de

    ld (hl), 0
    jp .enemy_slot_3_ghost_move_right
.enemy_slot_3_ghost_set_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 3
    add hl, de

    ld (hl), #FF
    ld hl, msx2_enemy_runtime_dy
    ld de, 3
    add hl, de

    ld (hl), 0
    jp .enemy_slot_3_ghost_move_left
.enemy_slot_3_ghost_set_down:
    ld hl, msx2_enemy_runtime_dx
    ld de, 3
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 3
    add hl, de

    ld (hl), 1
    jp .enemy_slot_3_ghost_move_down
.enemy_slot_3_ghost_set_up:
    ld hl, msx2_enemy_runtime_dx
    ld de, 3
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 3
    add hl, de

    ld (hl), #FF
    jp .enemy_slot_3_ghost_move_up
.enemy_slot_3_ghost_move_right_checked:
    call .enemy_slot_3_ghost_can_right
    jp nz, .enemy_slot_3_ghost_try_vertical
.enemy_slot_3_ghost_move_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    inc (hl)
    ret
.enemy_slot_3_ghost_move_left_checked:
    call .enemy_slot_3_ghost_can_left
    jp nz, .enemy_slot_3_ghost_try_vertical
.enemy_slot_3_ghost_move_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    dec (hl)
    ret
.enemy_slot_3_ghost_move_down_checked:
    call .enemy_slot_3_ghost_can_down
    jp nz, .enemy_slot_3_ghost_try_right_first
.enemy_slot_3_ghost_move_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    inc (hl)
    ret
.enemy_slot_3_ghost_move_up_checked:
    call .enemy_slot_3_ghost_can_up
    jp nz, .enemy_slot_3_ghost_try_right_first
.enemy_slot_3_ghost_move_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    dec (hl)
    ret
.enemy_slot_3_ghost_can_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld a, (hl)
    cp 239
    jp nc, .enemy_slot_3_ghost_blocked
    inc a
    add a, 15
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_3_ghost_can_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_3_ghost_blocked
    jp c, .enemy_slot_3_ghost_blocked
    dec a
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_3_ghost_can_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld a, (hl)
    cp 196
    jp nc, .enemy_slot_3_ghost_blocked
    inc a
    add a, 15
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_3_ghost_can_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_3_ghost_blocked
    dec a
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_3_ghost_blocked:
    or 1
    ret

update_msx2_enemy_position_slot_4:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 5
    ret c
    ld hl, msx2_enemy_runtime_mode
    ld de, 4
    add hl, de

    ld a, (hl)
    cp 4
    jp z, .enemy_slot_4_ball_bounce
    cp 3
    jp z, .enemy_slot_4_dive
    cp 2
    jp z, .enemy_slot_4_ghost_maze
    ld hl, msx2_enemy_runtime_dx
    ld de, 4
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_4_check_y
    cp #FF
    jp z, .enemy_slot_4_left
.enemy_slot_4_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_4_turn_left
    inc b
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld (hl), b
    ret
.enemy_slot_4_turn_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 4
    add hl, de

    ld (hl), #FF
.enemy_slot_4_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_4_turn_right
    jp z, .enemy_slot_4_turn_right
    dec b
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld (hl), b
    ret
.enemy_slot_4_turn_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 4
    add hl, de

    ld (hl), 1
    ret
.enemy_slot_4_check_y:
    ld hl, msx2_enemy_runtime_dy
    ld de, 4
    add hl, de

    ld a, (hl)
    or a
    ret z
    cp #FF
    jp z, .enemy_slot_4_up
.enemy_slot_4_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_4_turn_up
    inc b
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld (hl), b
    ret
.enemy_slot_4_turn_up:
    ld hl, msx2_enemy_runtime_dy
    ld de, 4
    add hl, de

    ld (hl), #FF
.enemy_slot_4_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_4_turn_down
    jp z, .enemy_slot_4_turn_down
    dec b
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld (hl), b
    ret
.enemy_slot_4_turn_down:
    ld hl, msx2_enemy_runtime_dy
    ld de, 4
    add hl, de

    ld (hl), 1
    ret

.enemy_slot_4_ball_bounce:
    ; Pong/Arkanoid ball movement. Runtime dx/dy are signed bytes. Clobbers AF/BC/DE/HL.

    ld hl, msx2_enemy_runtime_dx
    ld de, 4
    add hl, de

    ld a, (hl)
    bit 7, a
    jp nz, .enemy_slot_4_ball_left
.enemy_slot_4_ball_right:
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld a, (hl)
    add a, c
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_4_ball_turn_left
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld (hl), b
    jp .enemy_slot_4_ball_y
.enemy_slot_4_ball_turn_left:
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld (hl), b
    xor a
    sub c
    ld hl, msx2_enemy_runtime_dx
    ld de, 4
    add hl, de

    ld (hl), a
    jp .enemy_slot_4_ball_y
.enemy_slot_4_ball_left:
    neg
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld a, (hl)
    sub c
    jp c, .enemy_slot_4_ball_turn_right
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_4_ball_turn_right
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld (hl), b
    jp .enemy_slot_4_ball_y
.enemy_slot_4_ball_turn_right:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld (hl), b
    ld a, c
    ld hl, msx2_enemy_runtime_dx
    ld de, 4
    add hl, de

    ld (hl), a

.enemy_slot_4_ball_y:
    ld hl, msx2_enemy_runtime_dy
    ld de, 4
    add hl, de

    ld a, (hl)
    bit 7, a
    jp nz, .enemy_slot_4_ball_up
.enemy_slot_4_ball_down:
    ld c, a
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld a, (hl)
    add a, c
    ld b, a

    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_4_ball_check_paddle

.enemy_slot_4_ball_store_y:
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld (hl), b
    jp .enemy_slot_4_ball_check_brick
.enemy_slot_4_ball_check_paddle:
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld b, (hl)
    ld a, b
    add a, 8
    ld c, a
    ld a, (msx2_player_sprite_x)
    ld e, a
    ld a, c
    sub e
    cp 32
    jp nc, .enemy_slot_4_ball_no_paddle_hit

    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld (hl), b
    ld hl, msx2_enemy_runtime_dy
    ld de, 4
    add hl, de

    ld a, (hl)
    neg
    ld hl, msx2_enemy_runtime_dy
    ld de, 4
    add hl, de

    ld (hl), a
    ret
.enemy_slot_4_ball_no_paddle_hit:
    jp .enemy_slot_4_ball_miss_paddle
.enemy_slot_4_ball_miss_paddle:

    call msx2_apply_damage_respawn
    call write_hardware_sprite_attrs
    ret
.enemy_slot_4_ball_up:
    neg
    ld c, a
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld a, (hl)
    sub c
    jp c, .enemy_slot_4_ball_turn_down
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_4_ball_turn_down
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld (hl), b
    jp .enemy_slot_4_ball_check_brick
.enemy_slot_4_ball_turn_down:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld (hl), b
    ld a, c
    ld hl, msx2_enemy_runtime_dy
    ld de, 4
    add hl, de

    ld (hl), a
    jp .enemy_slot_4_ball_check_brick

.enemy_slot_4_ball_check_brick:
    ; Ball center probes mutable effect RAM. Effect 3 is collectible/brick and is cleared on hit.
    ; Clobbers AF/BC/DE/HL.
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    push bc
    call msx2_effect_at_pixel
    cp 3
    jp z, .enemy_slot_4_ball_break_brick
    pop bc
    ret
.enemy_slot_4_ball_break_brick:
    xor a
    ld (hl), a
    pop bc
    call clear_msx2_effect_visual_at_pixel
    ld hl, msx2_enemy_runtime_dy
    ld de, 4
    add hl, de

    ld a, (hl)
    neg
    ld (hl), a
    ld a, (msx2_score_lo)
    add a, 10
    ld (msx2_score_lo), a
    jp nc, .enemy_slot_4_ball_brick_score_done
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.enemy_slot_4_ball_brick_score_done:
    ld a, (msx2_collectible_count)
    inc a
    ld (msx2_collectible_count), a

    ret

.enemy_slot_4_dive:
    ld hl, msx2_enemy_runtime_tick
    ld de, 4
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_4_dive_active
    dec a
    ld (hl), a
    ret

.enemy_slot_4_dive_active:
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld a, (hl)
    cp 208
    ret nc
    cp 200
    jp nc, .enemy_slot_4_dive_reset
    add a, 2
    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_4_dive_left
    jp z, .enemy_slot_4_dive_done
    inc b
    ld (hl), b
    ret
.enemy_slot_4_dive_left:
    dec b
    ld (hl), b
.enemy_slot_4_dive_done:
    ret
.enemy_slot_4_dive_reset:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_x
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_y
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_speed
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_tick
    ld de, 4
    add hl, de

    ld (hl), a
    ret

.enemy_slot_4_ghost_maze:
    ld hl, msx2_enemy_runtime_tick
    ld de, 4
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_4_ghost_tick_ready
    dec a
    ld (hl), a
    ret
.enemy_slot_4_ghost_tick_ready:
    ld hl, msx2_enemy_runtime_speed
    ld de, 4
    add hl, de

    ld a, (hl)
    or a
    jp nz, .enemy_slot_4_ghost_store_tick
    ld a, 2
.enemy_slot_4_ghost_store_tick:
    ld hl, msx2_enemy_runtime_tick
    ld de, 4
    add hl, de

    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_4_ghost_forward
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_4_ghost_forward
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_4_ghost_prefer_left
.enemy_slot_4_ghost_prefer_right:
    jp .enemy_slot_4_ghost_try_right_first
.enemy_slot_4_ghost_prefer_left:
    jp .enemy_slot_4_ghost_try_left_first
.enemy_slot_4_ghost_try_right_first:
    call .enemy_slot_4_ghost_can_right
    jp z, .enemy_slot_4_ghost_set_right
    jp .enemy_slot_4_ghost_try_vertical
.enemy_slot_4_ghost_try_left_first:
    call .enemy_slot_4_ghost_can_left
    jp z, .enemy_slot_4_ghost_set_left
.enemy_slot_4_ghost_try_vertical:
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    cp b
    jp c, .enemy_slot_4_ghost_try_up_first
    call .enemy_slot_4_ghost_can_down
    jp z, .enemy_slot_4_ghost_set_down
    call .enemy_slot_4_ghost_can_up
    jp z, .enemy_slot_4_ghost_set_up
    jp .enemy_slot_4_ghost_try_reverse
.enemy_slot_4_ghost_try_up_first:
    call .enemy_slot_4_ghost_can_up
    jp z, .enemy_slot_4_ghost_set_up
    call .enemy_slot_4_ghost_can_down
    jp z, .enemy_slot_4_ghost_set_down
.enemy_slot_4_ghost_try_reverse:
    ld hl, msx2_enemy_runtime_dx
    ld de, 4
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_4_ghost_set_left
    cp #FF
    jp z, .enemy_slot_4_ghost_set_right
    ld hl, msx2_enemy_runtime_dy
    ld de, 4
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_4_ghost_set_up
    cp #FF
    jp z, .enemy_slot_4_ghost_set_down
    ret
.enemy_slot_4_ghost_forward:
    ld hl, msx2_enemy_runtime_dx
    ld de, 4
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_4_ghost_move_right_checked
    cp #FF
    jp z, .enemy_slot_4_ghost_move_left_checked
    ld hl, msx2_enemy_runtime_dy
    ld de, 4
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_4_ghost_move_down_checked
    cp #FF
    jp z, .enemy_slot_4_ghost_move_up_checked
    jp .enemy_slot_4_ghost_try_right_first
.enemy_slot_4_ghost_set_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 4
    add hl, de

    ld (hl), 1
    ld hl, msx2_enemy_runtime_dy
    ld de, 4
    add hl, de

    ld (hl), 0
    jp .enemy_slot_4_ghost_move_right
.enemy_slot_4_ghost_set_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 4
    add hl, de

    ld (hl), #FF
    ld hl, msx2_enemy_runtime_dy
    ld de, 4
    add hl, de

    ld (hl), 0
    jp .enemy_slot_4_ghost_move_left
.enemy_slot_4_ghost_set_down:
    ld hl, msx2_enemy_runtime_dx
    ld de, 4
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 4
    add hl, de

    ld (hl), 1
    jp .enemy_slot_4_ghost_move_down
.enemy_slot_4_ghost_set_up:
    ld hl, msx2_enemy_runtime_dx
    ld de, 4
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 4
    add hl, de

    ld (hl), #FF
    jp .enemy_slot_4_ghost_move_up
.enemy_slot_4_ghost_move_right_checked:
    call .enemy_slot_4_ghost_can_right
    jp nz, .enemy_slot_4_ghost_try_vertical
.enemy_slot_4_ghost_move_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    inc (hl)
    ret
.enemy_slot_4_ghost_move_left_checked:
    call .enemy_slot_4_ghost_can_left
    jp nz, .enemy_slot_4_ghost_try_vertical
.enemy_slot_4_ghost_move_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    dec (hl)
    ret
.enemy_slot_4_ghost_move_down_checked:
    call .enemy_slot_4_ghost_can_down
    jp nz, .enemy_slot_4_ghost_try_right_first
.enemy_slot_4_ghost_move_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    inc (hl)
    ret
.enemy_slot_4_ghost_move_up_checked:
    call .enemy_slot_4_ghost_can_up
    jp nz, .enemy_slot_4_ghost_try_right_first
.enemy_slot_4_ghost_move_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    dec (hl)
    ret
.enemy_slot_4_ghost_can_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld a, (hl)
    cp 239
    jp nc, .enemy_slot_4_ghost_blocked
    inc a
    add a, 15
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_4_ghost_can_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_4_ghost_blocked
    jp c, .enemy_slot_4_ghost_blocked
    dec a
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_4_ghost_can_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld a, (hl)
    cp 196
    jp nc, .enemy_slot_4_ghost_blocked
    inc a
    add a, 15
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_4_ghost_can_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_4_ghost_blocked
    dec a
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_4_ghost_blocked:
    or 1
    ret

update_msx2_enemy_position_slot_5:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 6
    ret c
    ld hl, msx2_enemy_runtime_mode
    ld de, 5
    add hl, de

    ld a, (hl)
    cp 4
    jp z, .enemy_slot_5_ball_bounce
    cp 3
    jp z, .enemy_slot_5_dive
    cp 2
    jp z, .enemy_slot_5_ghost_maze
    ld hl, msx2_enemy_runtime_dx
    ld de, 5
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_5_check_y
    cp #FF
    jp z, .enemy_slot_5_left
.enemy_slot_5_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_5_turn_left
    inc b
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld (hl), b
    ret
.enemy_slot_5_turn_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 5
    add hl, de

    ld (hl), #FF
.enemy_slot_5_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_5_turn_right
    jp z, .enemy_slot_5_turn_right
    dec b
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld (hl), b
    ret
.enemy_slot_5_turn_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 5
    add hl, de

    ld (hl), 1
    ret
.enemy_slot_5_check_y:
    ld hl, msx2_enemy_runtime_dy
    ld de, 5
    add hl, de

    ld a, (hl)
    or a
    ret z
    cp #FF
    jp z, .enemy_slot_5_up
.enemy_slot_5_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_5_turn_up
    inc b
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld (hl), b
    ret
.enemy_slot_5_turn_up:
    ld hl, msx2_enemy_runtime_dy
    ld de, 5
    add hl, de

    ld (hl), #FF
.enemy_slot_5_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_5_turn_down
    jp z, .enemy_slot_5_turn_down
    dec b
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld (hl), b
    ret
.enemy_slot_5_turn_down:
    ld hl, msx2_enemy_runtime_dy
    ld de, 5
    add hl, de

    ld (hl), 1
    ret

.enemy_slot_5_ball_bounce:
    ; Pong/Arkanoid ball movement. Runtime dx/dy are signed bytes. Clobbers AF/BC/DE/HL.

    ld hl, msx2_enemy_runtime_dx
    ld de, 5
    add hl, de

    ld a, (hl)
    bit 7, a
    jp nz, .enemy_slot_5_ball_left
.enemy_slot_5_ball_right:
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld a, (hl)
    add a, c
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_5_ball_turn_left
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld (hl), b
    jp .enemy_slot_5_ball_y
.enemy_slot_5_ball_turn_left:
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld (hl), b
    xor a
    sub c
    ld hl, msx2_enemy_runtime_dx
    ld de, 5
    add hl, de

    ld (hl), a
    jp .enemy_slot_5_ball_y
.enemy_slot_5_ball_left:
    neg
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld a, (hl)
    sub c
    jp c, .enemy_slot_5_ball_turn_right
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_5_ball_turn_right
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld (hl), b
    jp .enemy_slot_5_ball_y
.enemy_slot_5_ball_turn_right:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld (hl), b
    ld a, c
    ld hl, msx2_enemy_runtime_dx
    ld de, 5
    add hl, de

    ld (hl), a

.enemy_slot_5_ball_y:
    ld hl, msx2_enemy_runtime_dy
    ld de, 5
    add hl, de

    ld a, (hl)
    bit 7, a
    jp nz, .enemy_slot_5_ball_up
.enemy_slot_5_ball_down:
    ld c, a
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld a, (hl)
    add a, c
    ld b, a

    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_5_ball_check_paddle

.enemy_slot_5_ball_store_y:
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld (hl), b
    jp .enemy_slot_5_ball_check_brick
.enemy_slot_5_ball_check_paddle:
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld b, (hl)
    ld a, b
    add a, 8
    ld c, a
    ld a, (msx2_player_sprite_x)
    ld e, a
    ld a, c
    sub e
    cp 32
    jp nc, .enemy_slot_5_ball_no_paddle_hit

    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld (hl), b
    ld hl, msx2_enemy_runtime_dy
    ld de, 5
    add hl, de

    ld a, (hl)
    neg
    ld hl, msx2_enemy_runtime_dy
    ld de, 5
    add hl, de

    ld (hl), a
    ret
.enemy_slot_5_ball_no_paddle_hit:
    jp .enemy_slot_5_ball_miss_paddle
.enemy_slot_5_ball_miss_paddle:

    call msx2_apply_damage_respawn
    call write_hardware_sprite_attrs
    ret
.enemy_slot_5_ball_up:
    neg
    ld c, a
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld a, (hl)
    sub c
    jp c, .enemy_slot_5_ball_turn_down
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_5_ball_turn_down
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld (hl), b
    jp .enemy_slot_5_ball_check_brick
.enemy_slot_5_ball_turn_down:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld (hl), b
    ld a, c
    ld hl, msx2_enemy_runtime_dy
    ld de, 5
    add hl, de

    ld (hl), a
    jp .enemy_slot_5_ball_check_brick

.enemy_slot_5_ball_check_brick:
    ; Ball center probes mutable effect RAM. Effect 3 is collectible/brick and is cleared on hit.
    ; Clobbers AF/BC/DE/HL.
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    push bc
    call msx2_effect_at_pixel
    cp 3
    jp z, .enemy_slot_5_ball_break_brick
    pop bc
    ret
.enemy_slot_5_ball_break_brick:
    xor a
    ld (hl), a
    pop bc
    call clear_msx2_effect_visual_at_pixel
    ld hl, msx2_enemy_runtime_dy
    ld de, 5
    add hl, de

    ld a, (hl)
    neg
    ld (hl), a
    ld a, (msx2_score_lo)
    add a, 10
    ld (msx2_score_lo), a
    jp nc, .enemy_slot_5_ball_brick_score_done
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.enemy_slot_5_ball_brick_score_done:
    ld a, (msx2_collectible_count)
    inc a
    ld (msx2_collectible_count), a

    ret

.enemy_slot_5_dive:
    ld hl, msx2_enemy_runtime_tick
    ld de, 5
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_5_dive_active
    dec a
    ld (hl), a
    ret

.enemy_slot_5_dive_active:
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld a, (hl)
    cp 208
    ret nc
    cp 200
    jp nc, .enemy_slot_5_dive_reset
    add a, 2
    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_5_dive_left
    jp z, .enemy_slot_5_dive_done
    inc b
    ld (hl), b
    ret
.enemy_slot_5_dive_left:
    dec b
    ld (hl), b
.enemy_slot_5_dive_done:
    ret
.enemy_slot_5_dive_reset:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_x
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_y
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_speed
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_tick
    ld de, 5
    add hl, de

    ld (hl), a
    ret

.enemy_slot_5_ghost_maze:
    ld hl, msx2_enemy_runtime_tick
    ld de, 5
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_5_ghost_tick_ready
    dec a
    ld (hl), a
    ret
.enemy_slot_5_ghost_tick_ready:
    ld hl, msx2_enemy_runtime_speed
    ld de, 5
    add hl, de

    ld a, (hl)
    or a
    jp nz, .enemy_slot_5_ghost_store_tick
    ld a, 2
.enemy_slot_5_ghost_store_tick:
    ld hl, msx2_enemy_runtime_tick
    ld de, 5
    add hl, de

    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_5_ghost_forward
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_5_ghost_forward
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_5_ghost_prefer_left
.enemy_slot_5_ghost_prefer_right:
    jp .enemy_slot_5_ghost_try_right_first
.enemy_slot_5_ghost_prefer_left:
    jp .enemy_slot_5_ghost_try_left_first
.enemy_slot_5_ghost_try_right_first:
    call .enemy_slot_5_ghost_can_right
    jp z, .enemy_slot_5_ghost_set_right
    jp .enemy_slot_5_ghost_try_vertical
.enemy_slot_5_ghost_try_left_first:
    call .enemy_slot_5_ghost_can_left
    jp z, .enemy_slot_5_ghost_set_left
.enemy_slot_5_ghost_try_vertical:
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    cp b
    jp c, .enemy_slot_5_ghost_try_up_first
    call .enemy_slot_5_ghost_can_down
    jp z, .enemy_slot_5_ghost_set_down
    call .enemy_slot_5_ghost_can_up
    jp z, .enemy_slot_5_ghost_set_up
    jp .enemy_slot_5_ghost_try_reverse
.enemy_slot_5_ghost_try_up_first:
    call .enemy_slot_5_ghost_can_up
    jp z, .enemy_slot_5_ghost_set_up
    call .enemy_slot_5_ghost_can_down
    jp z, .enemy_slot_5_ghost_set_down
.enemy_slot_5_ghost_try_reverse:
    ld hl, msx2_enemy_runtime_dx
    ld de, 5
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_5_ghost_set_left
    cp #FF
    jp z, .enemy_slot_5_ghost_set_right
    ld hl, msx2_enemy_runtime_dy
    ld de, 5
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_5_ghost_set_up
    cp #FF
    jp z, .enemy_slot_5_ghost_set_down
    ret
.enemy_slot_5_ghost_forward:
    ld hl, msx2_enemy_runtime_dx
    ld de, 5
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_5_ghost_move_right_checked
    cp #FF
    jp z, .enemy_slot_5_ghost_move_left_checked
    ld hl, msx2_enemy_runtime_dy
    ld de, 5
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_5_ghost_move_down_checked
    cp #FF
    jp z, .enemy_slot_5_ghost_move_up_checked
    jp .enemy_slot_5_ghost_try_right_first
.enemy_slot_5_ghost_set_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 5
    add hl, de

    ld (hl), 1
    ld hl, msx2_enemy_runtime_dy
    ld de, 5
    add hl, de

    ld (hl), 0
    jp .enemy_slot_5_ghost_move_right
.enemy_slot_5_ghost_set_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 5
    add hl, de

    ld (hl), #FF
    ld hl, msx2_enemy_runtime_dy
    ld de, 5
    add hl, de

    ld (hl), 0
    jp .enemy_slot_5_ghost_move_left
.enemy_slot_5_ghost_set_down:
    ld hl, msx2_enemy_runtime_dx
    ld de, 5
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 5
    add hl, de

    ld (hl), 1
    jp .enemy_slot_5_ghost_move_down
.enemy_slot_5_ghost_set_up:
    ld hl, msx2_enemy_runtime_dx
    ld de, 5
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 5
    add hl, de

    ld (hl), #FF
    jp .enemy_slot_5_ghost_move_up
.enemy_slot_5_ghost_move_right_checked:
    call .enemy_slot_5_ghost_can_right
    jp nz, .enemy_slot_5_ghost_try_vertical
.enemy_slot_5_ghost_move_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    inc (hl)
    ret
.enemy_slot_5_ghost_move_left_checked:
    call .enemy_slot_5_ghost_can_left
    jp nz, .enemy_slot_5_ghost_try_vertical
.enemy_slot_5_ghost_move_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    dec (hl)
    ret
.enemy_slot_5_ghost_move_down_checked:
    call .enemy_slot_5_ghost_can_down
    jp nz, .enemy_slot_5_ghost_try_right_first
.enemy_slot_5_ghost_move_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    inc (hl)
    ret
.enemy_slot_5_ghost_move_up_checked:
    call .enemy_slot_5_ghost_can_up
    jp nz, .enemy_slot_5_ghost_try_right_first
.enemy_slot_5_ghost_move_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    dec (hl)
    ret
.enemy_slot_5_ghost_can_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld a, (hl)
    cp 239
    jp nc, .enemy_slot_5_ghost_blocked
    inc a
    add a, 15
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_5_ghost_can_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_5_ghost_blocked
    jp c, .enemy_slot_5_ghost_blocked
    dec a
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_5_ghost_can_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld a, (hl)
    cp 196
    jp nc, .enemy_slot_5_ghost_blocked
    inc a
    add a, 15
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_5_ghost_can_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_5_ghost_blocked
    dec a
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_5_ghost_blocked:
    or 1
    ret

update_msx2_enemy_position_slot_6:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 7
    ret c
    ld hl, msx2_enemy_runtime_mode
    ld de, 6
    add hl, de

    ld a, (hl)
    cp 4
    jp z, .enemy_slot_6_ball_bounce
    cp 3
    jp z, .enemy_slot_6_dive
    cp 2
    jp z, .enemy_slot_6_ghost_maze
    ld hl, msx2_enemy_runtime_dx
    ld de, 6
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_6_check_y
    cp #FF
    jp z, .enemy_slot_6_left
.enemy_slot_6_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_6_turn_left
    inc b
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld (hl), b
    ret
.enemy_slot_6_turn_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 6
    add hl, de

    ld (hl), #FF
.enemy_slot_6_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_6_turn_right
    jp z, .enemy_slot_6_turn_right
    dec b
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld (hl), b
    ret
.enemy_slot_6_turn_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 6
    add hl, de

    ld (hl), 1
    ret
.enemy_slot_6_check_y:
    ld hl, msx2_enemy_runtime_dy
    ld de, 6
    add hl, de

    ld a, (hl)
    or a
    ret z
    cp #FF
    jp z, .enemy_slot_6_up
.enemy_slot_6_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_6_turn_up
    inc b
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld (hl), b
    ret
.enemy_slot_6_turn_up:
    ld hl, msx2_enemy_runtime_dy
    ld de, 6
    add hl, de

    ld (hl), #FF
.enemy_slot_6_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_6_turn_down
    jp z, .enemy_slot_6_turn_down
    dec b
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld (hl), b
    ret
.enemy_slot_6_turn_down:
    ld hl, msx2_enemy_runtime_dy
    ld de, 6
    add hl, de

    ld (hl), 1
    ret

.enemy_slot_6_ball_bounce:
    ; Pong/Arkanoid ball movement. Runtime dx/dy are signed bytes. Clobbers AF/BC/DE/HL.

    ld hl, msx2_enemy_runtime_dx
    ld de, 6
    add hl, de

    ld a, (hl)
    bit 7, a
    jp nz, .enemy_slot_6_ball_left
.enemy_slot_6_ball_right:
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld a, (hl)
    add a, c
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_6_ball_turn_left
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld (hl), b
    jp .enemy_slot_6_ball_y
.enemy_slot_6_ball_turn_left:
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld (hl), b
    xor a
    sub c
    ld hl, msx2_enemy_runtime_dx
    ld de, 6
    add hl, de

    ld (hl), a
    jp .enemy_slot_6_ball_y
.enemy_slot_6_ball_left:
    neg
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld a, (hl)
    sub c
    jp c, .enemy_slot_6_ball_turn_right
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_6_ball_turn_right
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld (hl), b
    jp .enemy_slot_6_ball_y
.enemy_slot_6_ball_turn_right:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld (hl), b
    ld a, c
    ld hl, msx2_enemy_runtime_dx
    ld de, 6
    add hl, de

    ld (hl), a

.enemy_slot_6_ball_y:
    ld hl, msx2_enemy_runtime_dy
    ld de, 6
    add hl, de

    ld a, (hl)
    bit 7, a
    jp nz, .enemy_slot_6_ball_up
.enemy_slot_6_ball_down:
    ld c, a
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld a, (hl)
    add a, c
    ld b, a

    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_6_ball_check_paddle

.enemy_slot_6_ball_store_y:
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld (hl), b
    jp .enemy_slot_6_ball_check_brick
.enemy_slot_6_ball_check_paddle:
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld b, (hl)
    ld a, b
    add a, 8
    ld c, a
    ld a, (msx2_player_sprite_x)
    ld e, a
    ld a, c
    sub e
    cp 32
    jp nc, .enemy_slot_6_ball_no_paddle_hit

    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld (hl), b
    ld hl, msx2_enemy_runtime_dy
    ld de, 6
    add hl, de

    ld a, (hl)
    neg
    ld hl, msx2_enemy_runtime_dy
    ld de, 6
    add hl, de

    ld (hl), a
    ret
.enemy_slot_6_ball_no_paddle_hit:
    jp .enemy_slot_6_ball_miss_paddle
.enemy_slot_6_ball_miss_paddle:

    call msx2_apply_damage_respawn
    call write_hardware_sprite_attrs
    ret
.enemy_slot_6_ball_up:
    neg
    ld c, a
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld a, (hl)
    sub c
    jp c, .enemy_slot_6_ball_turn_down
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_6_ball_turn_down
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld (hl), b
    jp .enemy_slot_6_ball_check_brick
.enemy_slot_6_ball_turn_down:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld (hl), b
    ld a, c
    ld hl, msx2_enemy_runtime_dy
    ld de, 6
    add hl, de

    ld (hl), a
    jp .enemy_slot_6_ball_check_brick

.enemy_slot_6_ball_check_brick:
    ; Ball center probes mutable effect RAM. Effect 3 is collectible/brick and is cleared on hit.
    ; Clobbers AF/BC/DE/HL.
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    push bc
    call msx2_effect_at_pixel
    cp 3
    jp z, .enemy_slot_6_ball_break_brick
    pop bc
    ret
.enemy_slot_6_ball_break_brick:
    xor a
    ld (hl), a
    pop bc
    call clear_msx2_effect_visual_at_pixel
    ld hl, msx2_enemy_runtime_dy
    ld de, 6
    add hl, de

    ld a, (hl)
    neg
    ld (hl), a
    ld a, (msx2_score_lo)
    add a, 10
    ld (msx2_score_lo), a
    jp nc, .enemy_slot_6_ball_brick_score_done
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.enemy_slot_6_ball_brick_score_done:
    ld a, (msx2_collectible_count)
    inc a
    ld (msx2_collectible_count), a

    ret

.enemy_slot_6_dive:
    ld hl, msx2_enemy_runtime_tick
    ld de, 6
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_6_dive_active
    dec a
    ld (hl), a
    ret

.enemy_slot_6_dive_active:
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld a, (hl)
    cp 208
    ret nc
    cp 200
    jp nc, .enemy_slot_6_dive_reset
    add a, 2
    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_6_dive_left
    jp z, .enemy_slot_6_dive_done
    inc b
    ld (hl), b
    ret
.enemy_slot_6_dive_left:
    dec b
    ld (hl), b
.enemy_slot_6_dive_done:
    ret
.enemy_slot_6_dive_reset:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_x
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_y
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_speed
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_tick
    ld de, 6
    add hl, de

    ld (hl), a
    ret

.enemy_slot_6_ghost_maze:
    ld hl, msx2_enemy_runtime_tick
    ld de, 6
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_6_ghost_tick_ready
    dec a
    ld (hl), a
    ret
.enemy_slot_6_ghost_tick_ready:
    ld hl, msx2_enemy_runtime_speed
    ld de, 6
    add hl, de

    ld a, (hl)
    or a
    jp nz, .enemy_slot_6_ghost_store_tick
    ld a, 2
.enemy_slot_6_ghost_store_tick:
    ld hl, msx2_enemy_runtime_tick
    ld de, 6
    add hl, de

    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_6_ghost_forward
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_6_ghost_forward
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_6_ghost_prefer_left
.enemy_slot_6_ghost_prefer_right:
    jp .enemy_slot_6_ghost_try_right_first
.enemy_slot_6_ghost_prefer_left:
    jp .enemy_slot_6_ghost_try_left_first
.enemy_slot_6_ghost_try_right_first:
    call .enemy_slot_6_ghost_can_right
    jp z, .enemy_slot_6_ghost_set_right
    jp .enemy_slot_6_ghost_try_vertical
.enemy_slot_6_ghost_try_left_first:
    call .enemy_slot_6_ghost_can_left
    jp z, .enemy_slot_6_ghost_set_left
.enemy_slot_6_ghost_try_vertical:
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    cp b
    jp c, .enemy_slot_6_ghost_try_up_first
    call .enemy_slot_6_ghost_can_down
    jp z, .enemy_slot_6_ghost_set_down
    call .enemy_slot_6_ghost_can_up
    jp z, .enemy_slot_6_ghost_set_up
    jp .enemy_slot_6_ghost_try_reverse
.enemy_slot_6_ghost_try_up_first:
    call .enemy_slot_6_ghost_can_up
    jp z, .enemy_slot_6_ghost_set_up
    call .enemy_slot_6_ghost_can_down
    jp z, .enemy_slot_6_ghost_set_down
.enemy_slot_6_ghost_try_reverse:
    ld hl, msx2_enemy_runtime_dx
    ld de, 6
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_6_ghost_set_left
    cp #FF
    jp z, .enemy_slot_6_ghost_set_right
    ld hl, msx2_enemy_runtime_dy
    ld de, 6
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_6_ghost_set_up
    cp #FF
    jp z, .enemy_slot_6_ghost_set_down
    ret
.enemy_slot_6_ghost_forward:
    ld hl, msx2_enemy_runtime_dx
    ld de, 6
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_6_ghost_move_right_checked
    cp #FF
    jp z, .enemy_slot_6_ghost_move_left_checked
    ld hl, msx2_enemy_runtime_dy
    ld de, 6
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_6_ghost_move_down_checked
    cp #FF
    jp z, .enemy_slot_6_ghost_move_up_checked
    jp .enemy_slot_6_ghost_try_right_first
.enemy_slot_6_ghost_set_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 6
    add hl, de

    ld (hl), 1
    ld hl, msx2_enemy_runtime_dy
    ld de, 6
    add hl, de

    ld (hl), 0
    jp .enemy_slot_6_ghost_move_right
.enemy_slot_6_ghost_set_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 6
    add hl, de

    ld (hl), #FF
    ld hl, msx2_enemy_runtime_dy
    ld de, 6
    add hl, de

    ld (hl), 0
    jp .enemy_slot_6_ghost_move_left
.enemy_slot_6_ghost_set_down:
    ld hl, msx2_enemy_runtime_dx
    ld de, 6
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 6
    add hl, de

    ld (hl), 1
    jp .enemy_slot_6_ghost_move_down
.enemy_slot_6_ghost_set_up:
    ld hl, msx2_enemy_runtime_dx
    ld de, 6
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 6
    add hl, de

    ld (hl), #FF
    jp .enemy_slot_6_ghost_move_up
.enemy_slot_6_ghost_move_right_checked:
    call .enemy_slot_6_ghost_can_right
    jp nz, .enemy_slot_6_ghost_try_vertical
.enemy_slot_6_ghost_move_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    inc (hl)
    ret
.enemy_slot_6_ghost_move_left_checked:
    call .enemy_slot_6_ghost_can_left
    jp nz, .enemy_slot_6_ghost_try_vertical
.enemy_slot_6_ghost_move_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    dec (hl)
    ret
.enemy_slot_6_ghost_move_down_checked:
    call .enemy_slot_6_ghost_can_down
    jp nz, .enemy_slot_6_ghost_try_right_first
.enemy_slot_6_ghost_move_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    inc (hl)
    ret
.enemy_slot_6_ghost_move_up_checked:
    call .enemy_slot_6_ghost_can_up
    jp nz, .enemy_slot_6_ghost_try_right_first
.enemy_slot_6_ghost_move_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    dec (hl)
    ret
.enemy_slot_6_ghost_can_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld a, (hl)
    cp 239
    jp nc, .enemy_slot_6_ghost_blocked
    inc a
    add a, 15
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_6_ghost_can_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_6_ghost_blocked
    jp c, .enemy_slot_6_ghost_blocked
    dec a
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_6_ghost_can_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld a, (hl)
    cp 196
    jp nc, .enemy_slot_6_ghost_blocked
    inc a
    add a, 15
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_6_ghost_can_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_6_ghost_blocked
    dec a
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_6_ghost_blocked:
    or 1
    ret

update_msx2_enemy_position_slot_7:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 8
    ret c
    ld hl, msx2_enemy_runtime_mode
    ld de, 7
    add hl, de

    ld a, (hl)
    cp 4
    jp z, .enemy_slot_7_ball_bounce
    cp 3
    jp z, .enemy_slot_7_dive
    cp 2
    jp z, .enemy_slot_7_ghost_maze
    ld hl, msx2_enemy_runtime_dx
    ld de, 7
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_7_check_y
    cp #FF
    jp z, .enemy_slot_7_left
.enemy_slot_7_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_7_turn_left
    inc b
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld (hl), b
    ret
.enemy_slot_7_turn_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 7
    add hl, de

    ld (hl), #FF
.enemy_slot_7_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_7_turn_right
    jp z, .enemy_slot_7_turn_right
    dec b
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld (hl), b
    ret
.enemy_slot_7_turn_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 7
    add hl, de

    ld (hl), 1
    ret
.enemy_slot_7_check_y:
    ld hl, msx2_enemy_runtime_dy
    ld de, 7
    add hl, de

    ld a, (hl)
    or a
    ret z
    cp #FF
    jp z, .enemy_slot_7_up
.enemy_slot_7_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_7_turn_up
    inc b
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld (hl), b
    ret
.enemy_slot_7_turn_up:
    ld hl, msx2_enemy_runtime_dy
    ld de, 7
    add hl, de

    ld (hl), #FF
.enemy_slot_7_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_7_turn_down
    jp z, .enemy_slot_7_turn_down
    dec b
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld (hl), b
    ret
.enemy_slot_7_turn_down:
    ld hl, msx2_enemy_runtime_dy
    ld de, 7
    add hl, de

    ld (hl), 1
    ret

.enemy_slot_7_ball_bounce:
    ; Pong/Arkanoid ball movement. Runtime dx/dy are signed bytes. Clobbers AF/BC/DE/HL.

    ld hl, msx2_enemy_runtime_dx
    ld de, 7
    add hl, de

    ld a, (hl)
    bit 7, a
    jp nz, .enemy_slot_7_ball_left
.enemy_slot_7_ball_right:
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld a, (hl)
    add a, c
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_7_ball_turn_left
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld (hl), b
    jp .enemy_slot_7_ball_y
.enemy_slot_7_ball_turn_left:
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld (hl), b
    xor a
    sub c
    ld hl, msx2_enemy_runtime_dx
    ld de, 7
    add hl, de

    ld (hl), a
    jp .enemy_slot_7_ball_y
.enemy_slot_7_ball_left:
    neg
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld a, (hl)
    sub c
    jp c, .enemy_slot_7_ball_turn_right
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_7_ball_turn_right
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld (hl), b
    jp .enemy_slot_7_ball_y
.enemy_slot_7_ball_turn_right:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld (hl), b
    ld a, c
    ld hl, msx2_enemy_runtime_dx
    ld de, 7
    add hl, de

    ld (hl), a

.enemy_slot_7_ball_y:
    ld hl, msx2_enemy_runtime_dy
    ld de, 7
    add hl, de

    ld a, (hl)
    bit 7, a
    jp nz, .enemy_slot_7_ball_up
.enemy_slot_7_ball_down:
    ld c, a
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld a, (hl)
    add a, c
    ld b, a

    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_7_ball_check_paddle

.enemy_slot_7_ball_store_y:
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld (hl), b
    jp .enemy_slot_7_ball_check_brick
.enemy_slot_7_ball_check_paddle:
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld b, (hl)
    ld a, b
    add a, 8
    ld c, a
    ld a, (msx2_player_sprite_x)
    ld e, a
    ld a, c
    sub e
    cp 32
    jp nc, .enemy_slot_7_ball_no_paddle_hit

    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld (hl), b
    ld hl, msx2_enemy_runtime_dy
    ld de, 7
    add hl, de

    ld a, (hl)
    neg
    ld hl, msx2_enemy_runtime_dy
    ld de, 7
    add hl, de

    ld (hl), a
    ret
.enemy_slot_7_ball_no_paddle_hit:
    jp .enemy_slot_7_ball_miss_paddle
.enemy_slot_7_ball_miss_paddle:

    call msx2_apply_damage_respawn
    call write_hardware_sprite_attrs
    ret
.enemy_slot_7_ball_up:
    neg
    ld c, a
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld a, (hl)
    sub c
    jp c, .enemy_slot_7_ball_turn_down
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_7_ball_turn_down
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld (hl), b
    jp .enemy_slot_7_ball_check_brick
.enemy_slot_7_ball_turn_down:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld (hl), b
    ld a, c
    ld hl, msx2_enemy_runtime_dy
    ld de, 7
    add hl, de

    ld (hl), a
    jp .enemy_slot_7_ball_check_brick

.enemy_slot_7_ball_check_brick:
    ; Ball center probes mutable effect RAM. Effect 3 is collectible/brick and is cleared on hit.
    ; Clobbers AF/BC/DE/HL.
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    push bc
    call msx2_effect_at_pixel
    cp 3
    jp z, .enemy_slot_7_ball_break_brick
    pop bc
    ret
.enemy_slot_7_ball_break_brick:
    xor a
    ld (hl), a
    pop bc
    call clear_msx2_effect_visual_at_pixel
    ld hl, msx2_enemy_runtime_dy
    ld de, 7
    add hl, de

    ld a, (hl)
    neg
    ld (hl), a
    ld a, (msx2_score_lo)
    add a, 10
    ld (msx2_score_lo), a
    jp nc, .enemy_slot_7_ball_brick_score_done
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.enemy_slot_7_ball_brick_score_done:
    ld a, (msx2_collectible_count)
    inc a
    ld (msx2_collectible_count), a

    ret

.enemy_slot_7_dive:
    ld hl, msx2_enemy_runtime_tick
    ld de, 7
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_7_dive_active
    dec a
    ld (hl), a
    ret

.enemy_slot_7_dive_active:
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld a, (hl)
    cp 208
    ret nc
    cp 200
    jp nc, .enemy_slot_7_dive_reset
    add a, 2
    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_7_dive_left
    jp z, .enemy_slot_7_dive_done
    inc b
    ld (hl), b
    ret
.enemy_slot_7_dive_left:
    dec b
    ld (hl), b
.enemy_slot_7_dive_done:
    ret
.enemy_slot_7_dive_reset:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_x
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_y
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_speed
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_tick
    ld de, 7
    add hl, de

    ld (hl), a
    ret

.enemy_slot_7_ghost_maze:
    ld hl, msx2_enemy_runtime_tick
    ld de, 7
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_7_ghost_tick_ready
    dec a
    ld (hl), a
    ret
.enemy_slot_7_ghost_tick_ready:
    ld hl, msx2_enemy_runtime_speed
    ld de, 7
    add hl, de

    ld a, (hl)
    or a
    jp nz, .enemy_slot_7_ghost_store_tick
    ld a, 2
.enemy_slot_7_ghost_store_tick:
    ld hl, msx2_enemy_runtime_tick
    ld de, 7
    add hl, de

    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_7_ghost_forward
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_7_ghost_forward
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_7_ghost_prefer_left
.enemy_slot_7_ghost_prefer_right:
    jp .enemy_slot_7_ghost_try_right_first
.enemy_slot_7_ghost_prefer_left:
    jp .enemy_slot_7_ghost_try_left_first
.enemy_slot_7_ghost_try_right_first:
    call .enemy_slot_7_ghost_can_right
    jp z, .enemy_slot_7_ghost_set_right
    jp .enemy_slot_7_ghost_try_vertical
.enemy_slot_7_ghost_try_left_first:
    call .enemy_slot_7_ghost_can_left
    jp z, .enemy_slot_7_ghost_set_left
.enemy_slot_7_ghost_try_vertical:
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    cp b
    jp c, .enemy_slot_7_ghost_try_up_first
    call .enemy_slot_7_ghost_can_down
    jp z, .enemy_slot_7_ghost_set_down
    call .enemy_slot_7_ghost_can_up
    jp z, .enemy_slot_7_ghost_set_up
    jp .enemy_slot_7_ghost_try_reverse
.enemy_slot_7_ghost_try_up_first:
    call .enemy_slot_7_ghost_can_up
    jp z, .enemy_slot_7_ghost_set_up
    call .enemy_slot_7_ghost_can_down
    jp z, .enemy_slot_7_ghost_set_down
.enemy_slot_7_ghost_try_reverse:
    ld hl, msx2_enemy_runtime_dx
    ld de, 7
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_7_ghost_set_left
    cp #FF
    jp z, .enemy_slot_7_ghost_set_right
    ld hl, msx2_enemy_runtime_dy
    ld de, 7
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_7_ghost_set_up
    cp #FF
    jp z, .enemy_slot_7_ghost_set_down
    ret
.enemy_slot_7_ghost_forward:
    ld hl, msx2_enemy_runtime_dx
    ld de, 7
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_7_ghost_move_right_checked
    cp #FF
    jp z, .enemy_slot_7_ghost_move_left_checked
    ld hl, msx2_enemy_runtime_dy
    ld de, 7
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_7_ghost_move_down_checked
    cp #FF
    jp z, .enemy_slot_7_ghost_move_up_checked
    jp .enemy_slot_7_ghost_try_right_first
.enemy_slot_7_ghost_set_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 7
    add hl, de

    ld (hl), 1
    ld hl, msx2_enemy_runtime_dy
    ld de, 7
    add hl, de

    ld (hl), 0
    jp .enemy_slot_7_ghost_move_right
.enemy_slot_7_ghost_set_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 7
    add hl, de

    ld (hl), #FF
    ld hl, msx2_enemy_runtime_dy
    ld de, 7
    add hl, de

    ld (hl), 0
    jp .enemy_slot_7_ghost_move_left
.enemy_slot_7_ghost_set_down:
    ld hl, msx2_enemy_runtime_dx
    ld de, 7
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 7
    add hl, de

    ld (hl), 1
    jp .enemy_slot_7_ghost_move_down
.enemy_slot_7_ghost_set_up:
    ld hl, msx2_enemy_runtime_dx
    ld de, 7
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 7
    add hl, de

    ld (hl), #FF
    jp .enemy_slot_7_ghost_move_up
.enemy_slot_7_ghost_move_right_checked:
    call .enemy_slot_7_ghost_can_right
    jp nz, .enemy_slot_7_ghost_try_vertical
.enemy_slot_7_ghost_move_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    inc (hl)
    ret
.enemy_slot_7_ghost_move_left_checked:
    call .enemy_slot_7_ghost_can_left
    jp nz, .enemy_slot_7_ghost_try_vertical
.enemy_slot_7_ghost_move_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    dec (hl)
    ret
.enemy_slot_7_ghost_move_down_checked:
    call .enemy_slot_7_ghost_can_down
    jp nz, .enemy_slot_7_ghost_try_right_first
.enemy_slot_7_ghost_move_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    inc (hl)
    ret
.enemy_slot_7_ghost_move_up_checked:
    call .enemy_slot_7_ghost_can_up
    jp nz, .enemy_slot_7_ghost_try_right_first
.enemy_slot_7_ghost_move_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    dec (hl)
    ret
.enemy_slot_7_ghost_can_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld a, (hl)
    cp 239
    jp nc, .enemy_slot_7_ghost_blocked
    inc a
    add a, 15
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_7_ghost_can_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_7_ghost_blocked
    jp c, .enemy_slot_7_ghost_blocked
    dec a
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_7_ghost_can_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld a, (hl)
    cp 196
    jp nc, .enemy_slot_7_ghost_blocked
    inc a
    add a, 15
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_7_ghost_can_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_7_ghost_blocked
    dec a
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_7_ghost_blocked:
    or 1
    ret

update_msx2_enemy_position_slot_8:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 9
    ret c
    ld hl, msx2_enemy_runtime_mode
    ld de, 8
    add hl, de

    ld a, (hl)
    cp 4
    jp z, .enemy_slot_8_ball_bounce
    cp 3
    jp z, .enemy_slot_8_dive
    cp 2
    jp z, .enemy_slot_8_ghost_maze
    ld hl, msx2_enemy_runtime_dx
    ld de, 8
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_8_check_y
    cp #FF
    jp z, .enemy_slot_8_left
.enemy_slot_8_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_8_turn_left
    inc b
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld (hl), b
    ret
.enemy_slot_8_turn_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 8
    add hl, de

    ld (hl), #FF
.enemy_slot_8_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_8_turn_right
    jp z, .enemy_slot_8_turn_right
    dec b
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld (hl), b
    ret
.enemy_slot_8_turn_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 8
    add hl, de

    ld (hl), 1
    ret
.enemy_slot_8_check_y:
    ld hl, msx2_enemy_runtime_dy
    ld de, 8
    add hl, de

    ld a, (hl)
    or a
    ret z
    cp #FF
    jp z, .enemy_slot_8_up
.enemy_slot_8_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_8_turn_up
    inc b
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld (hl), b
    ret
.enemy_slot_8_turn_up:
    ld hl, msx2_enemy_runtime_dy
    ld de, 8
    add hl, de

    ld (hl), #FF
.enemy_slot_8_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_8_turn_down
    jp z, .enemy_slot_8_turn_down
    dec b
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld (hl), b
    ret
.enemy_slot_8_turn_down:
    ld hl, msx2_enemy_runtime_dy
    ld de, 8
    add hl, de

    ld (hl), 1
    ret

.enemy_slot_8_ball_bounce:
    ; Pong/Arkanoid ball movement. Runtime dx/dy are signed bytes. Clobbers AF/BC/DE/HL.

    ld hl, msx2_enemy_runtime_dx
    ld de, 8
    add hl, de

    ld a, (hl)
    bit 7, a
    jp nz, .enemy_slot_8_ball_left
.enemy_slot_8_ball_right:
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld a, (hl)
    add a, c
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_8_ball_turn_left
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld (hl), b
    jp .enemy_slot_8_ball_y
.enemy_slot_8_ball_turn_left:
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld (hl), b
    xor a
    sub c
    ld hl, msx2_enemy_runtime_dx
    ld de, 8
    add hl, de

    ld (hl), a
    jp .enemy_slot_8_ball_y
.enemy_slot_8_ball_left:
    neg
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld a, (hl)
    sub c
    jp c, .enemy_slot_8_ball_turn_right
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_8_ball_turn_right
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld (hl), b
    jp .enemy_slot_8_ball_y
.enemy_slot_8_ball_turn_right:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld (hl), b
    ld a, c
    ld hl, msx2_enemy_runtime_dx
    ld de, 8
    add hl, de

    ld (hl), a

.enemy_slot_8_ball_y:
    ld hl, msx2_enemy_runtime_dy
    ld de, 8
    add hl, de

    ld a, (hl)
    bit 7, a
    jp nz, .enemy_slot_8_ball_up
.enemy_slot_8_ball_down:
    ld c, a
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld a, (hl)
    add a, c
    ld b, a

    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_8_ball_check_paddle

.enemy_slot_8_ball_store_y:
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld (hl), b
    jp .enemy_slot_8_ball_check_brick
.enemy_slot_8_ball_check_paddle:
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld b, (hl)
    ld a, b
    add a, 8
    ld c, a
    ld a, (msx2_player_sprite_x)
    ld e, a
    ld a, c
    sub e
    cp 32
    jp nc, .enemy_slot_8_ball_no_paddle_hit

    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld (hl), b
    ld hl, msx2_enemy_runtime_dy
    ld de, 8
    add hl, de

    ld a, (hl)
    neg
    ld hl, msx2_enemy_runtime_dy
    ld de, 8
    add hl, de

    ld (hl), a
    ret
.enemy_slot_8_ball_no_paddle_hit:
    jp .enemy_slot_8_ball_miss_paddle
.enemy_slot_8_ball_miss_paddle:

    call msx2_apply_damage_respawn
    call write_hardware_sprite_attrs
    ret
.enemy_slot_8_ball_up:
    neg
    ld c, a
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld a, (hl)
    sub c
    jp c, .enemy_slot_8_ball_turn_down
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_8_ball_turn_down
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld (hl), b
    jp .enemy_slot_8_ball_check_brick
.enemy_slot_8_ball_turn_down:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld (hl), b
    ld a, c
    ld hl, msx2_enemy_runtime_dy
    ld de, 8
    add hl, de

    ld (hl), a
    jp .enemy_slot_8_ball_check_brick

.enemy_slot_8_ball_check_brick:
    ; Ball center probes mutable effect RAM. Effect 3 is collectible/brick and is cleared on hit.
    ; Clobbers AF/BC/DE/HL.
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    push bc
    call msx2_effect_at_pixel
    cp 3
    jp z, .enemy_slot_8_ball_break_brick
    pop bc
    ret
.enemy_slot_8_ball_break_brick:
    xor a
    ld (hl), a
    pop bc
    call clear_msx2_effect_visual_at_pixel
    ld hl, msx2_enemy_runtime_dy
    ld de, 8
    add hl, de

    ld a, (hl)
    neg
    ld (hl), a
    ld a, (msx2_score_lo)
    add a, 10
    ld (msx2_score_lo), a
    jp nc, .enemy_slot_8_ball_brick_score_done
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.enemy_slot_8_ball_brick_score_done:
    ld a, (msx2_collectible_count)
    inc a
    ld (msx2_collectible_count), a

    ret

.enemy_slot_8_dive:
    ld hl, msx2_enemy_runtime_tick
    ld de, 8
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_8_dive_active
    dec a
    ld (hl), a
    ret

.enemy_slot_8_dive_active:
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld a, (hl)
    cp 208
    ret nc
    cp 200
    jp nc, .enemy_slot_8_dive_reset
    add a, 2
    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_8_dive_left
    jp z, .enemy_slot_8_dive_done
    inc b
    ld (hl), b
    ret
.enemy_slot_8_dive_left:
    dec b
    ld (hl), b
.enemy_slot_8_dive_done:
    ret
.enemy_slot_8_dive_reset:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_x
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_y
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_speed
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_tick
    ld de, 8
    add hl, de

    ld (hl), a
    ret

.enemy_slot_8_ghost_maze:
    ld hl, msx2_enemy_runtime_tick
    ld de, 8
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_8_ghost_tick_ready
    dec a
    ld (hl), a
    ret
.enemy_slot_8_ghost_tick_ready:
    ld hl, msx2_enemy_runtime_speed
    ld de, 8
    add hl, de

    ld a, (hl)
    or a
    jp nz, .enemy_slot_8_ghost_store_tick
    ld a, 2
.enemy_slot_8_ghost_store_tick:
    ld hl, msx2_enemy_runtime_tick
    ld de, 8
    add hl, de

    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_8_ghost_forward
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_8_ghost_forward
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_8_ghost_prefer_left
.enemy_slot_8_ghost_prefer_right:
    jp .enemy_slot_8_ghost_try_right_first
.enemy_slot_8_ghost_prefer_left:
    jp .enemy_slot_8_ghost_try_left_first
.enemy_slot_8_ghost_try_right_first:
    call .enemy_slot_8_ghost_can_right
    jp z, .enemy_slot_8_ghost_set_right
    jp .enemy_slot_8_ghost_try_vertical
.enemy_slot_8_ghost_try_left_first:
    call .enemy_slot_8_ghost_can_left
    jp z, .enemy_slot_8_ghost_set_left
.enemy_slot_8_ghost_try_vertical:
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    cp b
    jp c, .enemy_slot_8_ghost_try_up_first
    call .enemy_slot_8_ghost_can_down
    jp z, .enemy_slot_8_ghost_set_down
    call .enemy_slot_8_ghost_can_up
    jp z, .enemy_slot_8_ghost_set_up
    jp .enemy_slot_8_ghost_try_reverse
.enemy_slot_8_ghost_try_up_first:
    call .enemy_slot_8_ghost_can_up
    jp z, .enemy_slot_8_ghost_set_up
    call .enemy_slot_8_ghost_can_down
    jp z, .enemy_slot_8_ghost_set_down
.enemy_slot_8_ghost_try_reverse:
    ld hl, msx2_enemy_runtime_dx
    ld de, 8
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_8_ghost_set_left
    cp #FF
    jp z, .enemy_slot_8_ghost_set_right
    ld hl, msx2_enemy_runtime_dy
    ld de, 8
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_8_ghost_set_up
    cp #FF
    jp z, .enemy_slot_8_ghost_set_down
    ret
.enemy_slot_8_ghost_forward:
    ld hl, msx2_enemy_runtime_dx
    ld de, 8
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_8_ghost_move_right_checked
    cp #FF
    jp z, .enemy_slot_8_ghost_move_left_checked
    ld hl, msx2_enemy_runtime_dy
    ld de, 8
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_8_ghost_move_down_checked
    cp #FF
    jp z, .enemy_slot_8_ghost_move_up_checked
    jp .enemy_slot_8_ghost_try_right_first
.enemy_slot_8_ghost_set_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 8
    add hl, de

    ld (hl), 1
    ld hl, msx2_enemy_runtime_dy
    ld de, 8
    add hl, de

    ld (hl), 0
    jp .enemy_slot_8_ghost_move_right
.enemy_slot_8_ghost_set_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 8
    add hl, de

    ld (hl), #FF
    ld hl, msx2_enemy_runtime_dy
    ld de, 8
    add hl, de

    ld (hl), 0
    jp .enemy_slot_8_ghost_move_left
.enemy_slot_8_ghost_set_down:
    ld hl, msx2_enemy_runtime_dx
    ld de, 8
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 8
    add hl, de

    ld (hl), 1
    jp .enemy_slot_8_ghost_move_down
.enemy_slot_8_ghost_set_up:
    ld hl, msx2_enemy_runtime_dx
    ld de, 8
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 8
    add hl, de

    ld (hl), #FF
    jp .enemy_slot_8_ghost_move_up
.enemy_slot_8_ghost_move_right_checked:
    call .enemy_slot_8_ghost_can_right
    jp nz, .enemy_slot_8_ghost_try_vertical
.enemy_slot_8_ghost_move_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    inc (hl)
    ret
.enemy_slot_8_ghost_move_left_checked:
    call .enemy_slot_8_ghost_can_left
    jp nz, .enemy_slot_8_ghost_try_vertical
.enemy_slot_8_ghost_move_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    dec (hl)
    ret
.enemy_slot_8_ghost_move_down_checked:
    call .enemy_slot_8_ghost_can_down
    jp nz, .enemy_slot_8_ghost_try_right_first
.enemy_slot_8_ghost_move_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    inc (hl)
    ret
.enemy_slot_8_ghost_move_up_checked:
    call .enemy_slot_8_ghost_can_up
    jp nz, .enemy_slot_8_ghost_try_right_first
.enemy_slot_8_ghost_move_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    dec (hl)
    ret
.enemy_slot_8_ghost_can_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld a, (hl)
    cp 239
    jp nc, .enemy_slot_8_ghost_blocked
    inc a
    add a, 15
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_8_ghost_can_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_8_ghost_blocked
    jp c, .enemy_slot_8_ghost_blocked
    dec a
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_8_ghost_can_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld a, (hl)
    cp 196
    jp nc, .enemy_slot_8_ghost_blocked
    inc a
    add a, 15
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_8_ghost_can_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_8_ghost_blocked
    dec a
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_8_ghost_blocked:
    or 1
    ret

update_msx2_enemy_position_slot_9:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 10
    ret c
    ld hl, msx2_enemy_runtime_mode
    ld de, 9
    add hl, de

    ld a, (hl)
    cp 4
    jp z, .enemy_slot_9_ball_bounce
    cp 3
    jp z, .enemy_slot_9_dive
    cp 2
    jp z, .enemy_slot_9_ghost_maze
    ld hl, msx2_enemy_runtime_dx
    ld de, 9
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_9_check_y
    cp #FF
    jp z, .enemy_slot_9_left
.enemy_slot_9_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_9_turn_left
    inc b
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld (hl), b
    ret
.enemy_slot_9_turn_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 9
    add hl, de

    ld (hl), #FF
.enemy_slot_9_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_9_turn_right
    jp z, .enemy_slot_9_turn_right
    dec b
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld (hl), b
    ret
.enemy_slot_9_turn_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 9
    add hl, de

    ld (hl), 1
    ret
.enemy_slot_9_check_y:
    ld hl, msx2_enemy_runtime_dy
    ld de, 9
    add hl, de

    ld a, (hl)
    or a
    ret z
    cp #FF
    jp z, .enemy_slot_9_up
.enemy_slot_9_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_9_turn_up
    inc b
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld (hl), b
    ret
.enemy_slot_9_turn_up:
    ld hl, msx2_enemy_runtime_dy
    ld de, 9
    add hl, de

    ld (hl), #FF
.enemy_slot_9_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_9_turn_down
    jp z, .enemy_slot_9_turn_down
    dec b
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld (hl), b
    ret
.enemy_slot_9_turn_down:
    ld hl, msx2_enemy_runtime_dy
    ld de, 9
    add hl, de

    ld (hl), 1
    ret

.enemy_slot_9_ball_bounce:
    ; Pong/Arkanoid ball movement. Runtime dx/dy are signed bytes. Clobbers AF/BC/DE/HL.

    ld hl, msx2_enemy_runtime_dx
    ld de, 9
    add hl, de

    ld a, (hl)
    bit 7, a
    jp nz, .enemy_slot_9_ball_left
.enemy_slot_9_ball_right:
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld a, (hl)
    add a, c
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_9_ball_turn_left
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld (hl), b
    jp .enemy_slot_9_ball_y
.enemy_slot_9_ball_turn_left:
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld (hl), b
    xor a
    sub c
    ld hl, msx2_enemy_runtime_dx
    ld de, 9
    add hl, de

    ld (hl), a
    jp .enemy_slot_9_ball_y
.enemy_slot_9_ball_left:
    neg
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld a, (hl)
    sub c
    jp c, .enemy_slot_9_ball_turn_right
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_9_ball_turn_right
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld (hl), b
    jp .enemy_slot_9_ball_y
.enemy_slot_9_ball_turn_right:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld (hl), b
    ld a, c
    ld hl, msx2_enemy_runtime_dx
    ld de, 9
    add hl, de

    ld (hl), a

.enemy_slot_9_ball_y:
    ld hl, msx2_enemy_runtime_dy
    ld de, 9
    add hl, de

    ld a, (hl)
    bit 7, a
    jp nz, .enemy_slot_9_ball_up
.enemy_slot_9_ball_down:
    ld c, a
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld a, (hl)
    add a, c
    ld b, a

    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_9_ball_check_paddle

.enemy_slot_9_ball_store_y:
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld (hl), b
    jp .enemy_slot_9_ball_check_brick
.enemy_slot_9_ball_check_paddle:
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld b, (hl)
    ld a, b
    add a, 8
    ld c, a
    ld a, (msx2_player_sprite_x)
    ld e, a
    ld a, c
    sub e
    cp 32
    jp nc, .enemy_slot_9_ball_no_paddle_hit

    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld (hl), b
    ld hl, msx2_enemy_runtime_dy
    ld de, 9
    add hl, de

    ld a, (hl)
    neg
    ld hl, msx2_enemy_runtime_dy
    ld de, 9
    add hl, de

    ld (hl), a
    ret
.enemy_slot_9_ball_no_paddle_hit:
    jp .enemy_slot_9_ball_miss_paddle
.enemy_slot_9_ball_miss_paddle:

    call msx2_apply_damage_respawn
    call write_hardware_sprite_attrs
    ret
.enemy_slot_9_ball_up:
    neg
    ld c, a
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld a, (hl)
    sub c
    jp c, .enemy_slot_9_ball_turn_down
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_9_ball_turn_down
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld (hl), b
    jp .enemy_slot_9_ball_check_brick
.enemy_slot_9_ball_turn_down:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld (hl), b
    ld a, c
    ld hl, msx2_enemy_runtime_dy
    ld de, 9
    add hl, de

    ld (hl), a
    jp .enemy_slot_9_ball_check_brick

.enemy_slot_9_ball_check_brick:
    ; Ball center probes mutable effect RAM. Effect 3 is collectible/brick and is cleared on hit.
    ; Clobbers AF/BC/DE/HL.
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    push bc
    call msx2_effect_at_pixel
    cp 3
    jp z, .enemy_slot_9_ball_break_brick
    pop bc
    ret
.enemy_slot_9_ball_break_brick:
    xor a
    ld (hl), a
    pop bc
    call clear_msx2_effect_visual_at_pixel
    ld hl, msx2_enemy_runtime_dy
    ld de, 9
    add hl, de

    ld a, (hl)
    neg
    ld (hl), a
    ld a, (msx2_score_lo)
    add a, 10
    ld (msx2_score_lo), a
    jp nc, .enemy_slot_9_ball_brick_score_done
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.enemy_slot_9_ball_brick_score_done:
    ld a, (msx2_collectible_count)
    inc a
    ld (msx2_collectible_count), a

    ret

.enemy_slot_9_dive:
    ld hl, msx2_enemy_runtime_tick
    ld de, 9
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_9_dive_active
    dec a
    ld (hl), a
    ret

.enemy_slot_9_dive_active:
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld a, (hl)
    cp 208
    ret nc
    cp 200
    jp nc, .enemy_slot_9_dive_reset
    add a, 2
    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_9_dive_left
    jp z, .enemy_slot_9_dive_done
    inc b
    ld (hl), b
    ret
.enemy_slot_9_dive_left:
    dec b
    ld (hl), b
.enemy_slot_9_dive_done:
    ret
.enemy_slot_9_dive_reset:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_x
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_y
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_speed
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_tick
    ld de, 9
    add hl, de

    ld (hl), a
    ret

.enemy_slot_9_ghost_maze:
    ld hl, msx2_enemy_runtime_tick
    ld de, 9
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_9_ghost_tick_ready
    dec a
    ld (hl), a
    ret
.enemy_slot_9_ghost_tick_ready:
    ld hl, msx2_enemy_runtime_speed
    ld de, 9
    add hl, de

    ld a, (hl)
    or a
    jp nz, .enemy_slot_9_ghost_store_tick
    ld a, 2
.enemy_slot_9_ghost_store_tick:
    ld hl, msx2_enemy_runtime_tick
    ld de, 9
    add hl, de

    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_9_ghost_forward
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_9_ghost_forward
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_9_ghost_prefer_left
.enemy_slot_9_ghost_prefer_right:
    jp .enemy_slot_9_ghost_try_right_first
.enemy_slot_9_ghost_prefer_left:
    jp .enemy_slot_9_ghost_try_left_first
.enemy_slot_9_ghost_try_right_first:
    call .enemy_slot_9_ghost_can_right
    jp z, .enemy_slot_9_ghost_set_right
    jp .enemy_slot_9_ghost_try_vertical
.enemy_slot_9_ghost_try_left_first:
    call .enemy_slot_9_ghost_can_left
    jp z, .enemy_slot_9_ghost_set_left
.enemy_slot_9_ghost_try_vertical:
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    cp b
    jp c, .enemy_slot_9_ghost_try_up_first
    call .enemy_slot_9_ghost_can_down
    jp z, .enemy_slot_9_ghost_set_down
    call .enemy_slot_9_ghost_can_up
    jp z, .enemy_slot_9_ghost_set_up
    jp .enemy_slot_9_ghost_try_reverse
.enemy_slot_9_ghost_try_up_first:
    call .enemy_slot_9_ghost_can_up
    jp z, .enemy_slot_9_ghost_set_up
    call .enemy_slot_9_ghost_can_down
    jp z, .enemy_slot_9_ghost_set_down
.enemy_slot_9_ghost_try_reverse:
    ld hl, msx2_enemy_runtime_dx
    ld de, 9
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_9_ghost_set_left
    cp #FF
    jp z, .enemy_slot_9_ghost_set_right
    ld hl, msx2_enemy_runtime_dy
    ld de, 9
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_9_ghost_set_up
    cp #FF
    jp z, .enemy_slot_9_ghost_set_down
    ret
.enemy_slot_9_ghost_forward:
    ld hl, msx2_enemy_runtime_dx
    ld de, 9
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_9_ghost_move_right_checked
    cp #FF
    jp z, .enemy_slot_9_ghost_move_left_checked
    ld hl, msx2_enemy_runtime_dy
    ld de, 9
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_9_ghost_move_down_checked
    cp #FF
    jp z, .enemy_slot_9_ghost_move_up_checked
    jp .enemy_slot_9_ghost_try_right_first
.enemy_slot_9_ghost_set_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 9
    add hl, de

    ld (hl), 1
    ld hl, msx2_enemy_runtime_dy
    ld de, 9
    add hl, de

    ld (hl), 0
    jp .enemy_slot_9_ghost_move_right
.enemy_slot_9_ghost_set_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 9
    add hl, de

    ld (hl), #FF
    ld hl, msx2_enemy_runtime_dy
    ld de, 9
    add hl, de

    ld (hl), 0
    jp .enemy_slot_9_ghost_move_left
.enemy_slot_9_ghost_set_down:
    ld hl, msx2_enemy_runtime_dx
    ld de, 9
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 9
    add hl, de

    ld (hl), 1
    jp .enemy_slot_9_ghost_move_down
.enemy_slot_9_ghost_set_up:
    ld hl, msx2_enemy_runtime_dx
    ld de, 9
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 9
    add hl, de

    ld (hl), #FF
    jp .enemy_slot_9_ghost_move_up
.enemy_slot_9_ghost_move_right_checked:
    call .enemy_slot_9_ghost_can_right
    jp nz, .enemy_slot_9_ghost_try_vertical
.enemy_slot_9_ghost_move_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    inc (hl)
    ret
.enemy_slot_9_ghost_move_left_checked:
    call .enemy_slot_9_ghost_can_left
    jp nz, .enemy_slot_9_ghost_try_vertical
.enemy_slot_9_ghost_move_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    dec (hl)
    ret
.enemy_slot_9_ghost_move_down_checked:
    call .enemy_slot_9_ghost_can_down
    jp nz, .enemy_slot_9_ghost_try_right_first
.enemy_slot_9_ghost_move_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    inc (hl)
    ret
.enemy_slot_9_ghost_move_up_checked:
    call .enemy_slot_9_ghost_can_up
    jp nz, .enemy_slot_9_ghost_try_right_first
.enemy_slot_9_ghost_move_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    dec (hl)
    ret
.enemy_slot_9_ghost_can_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld a, (hl)
    cp 239
    jp nc, .enemy_slot_9_ghost_blocked
    inc a
    add a, 15
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_9_ghost_can_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_9_ghost_blocked
    jp c, .enemy_slot_9_ghost_blocked
    dec a
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_9_ghost_can_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld a, (hl)
    cp 196
    jp nc, .enemy_slot_9_ghost_blocked
    inc a
    add a, 15
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_9_ghost_can_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_9_ghost_blocked
    dec a
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_9_ghost_blocked:
    or 1
    ret

update_msx2_enemy_position_slot_10:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 11
    ret c
    ld hl, msx2_enemy_runtime_mode
    ld de, 10
    add hl, de

    ld a, (hl)
    cp 4
    jp z, .enemy_slot_10_ball_bounce
    cp 3
    jp z, .enemy_slot_10_dive
    cp 2
    jp z, .enemy_slot_10_ghost_maze
    ld hl, msx2_enemy_runtime_dx
    ld de, 10
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_10_check_y
    cp #FF
    jp z, .enemy_slot_10_left
.enemy_slot_10_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_10_turn_left
    inc b
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld (hl), b
    ret
.enemy_slot_10_turn_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 10
    add hl, de

    ld (hl), #FF
.enemy_slot_10_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_10_turn_right
    jp z, .enemy_slot_10_turn_right
    dec b
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld (hl), b
    ret
.enemy_slot_10_turn_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 10
    add hl, de

    ld (hl), 1
    ret
.enemy_slot_10_check_y:
    ld hl, msx2_enemy_runtime_dy
    ld de, 10
    add hl, de

    ld a, (hl)
    or a
    ret z
    cp #FF
    jp z, .enemy_slot_10_up
.enemy_slot_10_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_10_turn_up
    inc b
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld (hl), b
    ret
.enemy_slot_10_turn_up:
    ld hl, msx2_enemy_runtime_dy
    ld de, 10
    add hl, de

    ld (hl), #FF
.enemy_slot_10_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_10_turn_down
    jp z, .enemy_slot_10_turn_down
    dec b
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld (hl), b
    ret
.enemy_slot_10_turn_down:
    ld hl, msx2_enemy_runtime_dy
    ld de, 10
    add hl, de

    ld (hl), 1
    ret

.enemy_slot_10_ball_bounce:
    ; Pong/Arkanoid ball movement. Runtime dx/dy are signed bytes. Clobbers AF/BC/DE/HL.

    ld hl, msx2_enemy_runtime_dx
    ld de, 10
    add hl, de

    ld a, (hl)
    bit 7, a
    jp nz, .enemy_slot_10_ball_left
.enemy_slot_10_ball_right:
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld a, (hl)
    add a, c
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_10_ball_turn_left
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld (hl), b
    jp .enemy_slot_10_ball_y
.enemy_slot_10_ball_turn_left:
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld (hl), b
    xor a
    sub c
    ld hl, msx2_enemy_runtime_dx
    ld de, 10
    add hl, de

    ld (hl), a
    jp .enemy_slot_10_ball_y
.enemy_slot_10_ball_left:
    neg
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld a, (hl)
    sub c
    jp c, .enemy_slot_10_ball_turn_right
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_10_ball_turn_right
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld (hl), b
    jp .enemy_slot_10_ball_y
.enemy_slot_10_ball_turn_right:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld (hl), b
    ld a, c
    ld hl, msx2_enemy_runtime_dx
    ld de, 10
    add hl, de

    ld (hl), a

.enemy_slot_10_ball_y:
    ld hl, msx2_enemy_runtime_dy
    ld de, 10
    add hl, de

    ld a, (hl)
    bit 7, a
    jp nz, .enemy_slot_10_ball_up
.enemy_slot_10_ball_down:
    ld c, a
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld a, (hl)
    add a, c
    ld b, a

    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_10_ball_check_paddle

.enemy_slot_10_ball_store_y:
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld (hl), b
    jp .enemy_slot_10_ball_check_brick
.enemy_slot_10_ball_check_paddle:
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld b, (hl)
    ld a, b
    add a, 8
    ld c, a
    ld a, (msx2_player_sprite_x)
    ld e, a
    ld a, c
    sub e
    cp 32
    jp nc, .enemy_slot_10_ball_no_paddle_hit

    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld (hl), b
    ld hl, msx2_enemy_runtime_dy
    ld de, 10
    add hl, de

    ld a, (hl)
    neg
    ld hl, msx2_enemy_runtime_dy
    ld de, 10
    add hl, de

    ld (hl), a
    ret
.enemy_slot_10_ball_no_paddle_hit:
    jp .enemy_slot_10_ball_miss_paddle
.enemy_slot_10_ball_miss_paddle:

    call msx2_apply_damage_respawn
    call write_hardware_sprite_attrs
    ret
.enemy_slot_10_ball_up:
    neg
    ld c, a
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld a, (hl)
    sub c
    jp c, .enemy_slot_10_ball_turn_down
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_10_ball_turn_down
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld (hl), b
    jp .enemy_slot_10_ball_check_brick
.enemy_slot_10_ball_turn_down:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld (hl), b
    ld a, c
    ld hl, msx2_enemy_runtime_dy
    ld de, 10
    add hl, de

    ld (hl), a
    jp .enemy_slot_10_ball_check_brick

.enemy_slot_10_ball_check_brick:
    ; Ball center probes mutable effect RAM. Effect 3 is collectible/brick and is cleared on hit.
    ; Clobbers AF/BC/DE/HL.
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    push bc
    call msx2_effect_at_pixel
    cp 3
    jp z, .enemy_slot_10_ball_break_brick
    pop bc
    ret
.enemy_slot_10_ball_break_brick:
    xor a
    ld (hl), a
    pop bc
    call clear_msx2_effect_visual_at_pixel
    ld hl, msx2_enemy_runtime_dy
    ld de, 10
    add hl, de

    ld a, (hl)
    neg
    ld (hl), a
    ld a, (msx2_score_lo)
    add a, 10
    ld (msx2_score_lo), a
    jp nc, .enemy_slot_10_ball_brick_score_done
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.enemy_slot_10_ball_brick_score_done:
    ld a, (msx2_collectible_count)
    inc a
    ld (msx2_collectible_count), a

    ret

.enemy_slot_10_dive:
    ld hl, msx2_enemy_runtime_tick
    ld de, 10
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_10_dive_active
    dec a
    ld (hl), a
    ret

.enemy_slot_10_dive_active:
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld a, (hl)
    cp 208
    ret nc
    cp 200
    jp nc, .enemy_slot_10_dive_reset
    add a, 2
    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_10_dive_left
    jp z, .enemy_slot_10_dive_done
    inc b
    ld (hl), b
    ret
.enemy_slot_10_dive_left:
    dec b
    ld (hl), b
.enemy_slot_10_dive_done:
    ret
.enemy_slot_10_dive_reset:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_x
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_y
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_speed
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_tick
    ld de, 10
    add hl, de

    ld (hl), a
    ret

.enemy_slot_10_ghost_maze:
    ld hl, msx2_enemy_runtime_tick
    ld de, 10
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_10_ghost_tick_ready
    dec a
    ld (hl), a
    ret
.enemy_slot_10_ghost_tick_ready:
    ld hl, msx2_enemy_runtime_speed
    ld de, 10
    add hl, de

    ld a, (hl)
    or a
    jp nz, .enemy_slot_10_ghost_store_tick
    ld a, 2
.enemy_slot_10_ghost_store_tick:
    ld hl, msx2_enemy_runtime_tick
    ld de, 10
    add hl, de

    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_10_ghost_forward
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_10_ghost_forward
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_10_ghost_prefer_left
.enemy_slot_10_ghost_prefer_right:
    jp .enemy_slot_10_ghost_try_right_first
.enemy_slot_10_ghost_prefer_left:
    jp .enemy_slot_10_ghost_try_left_first
.enemy_slot_10_ghost_try_right_first:
    call .enemy_slot_10_ghost_can_right
    jp z, .enemy_slot_10_ghost_set_right
    jp .enemy_slot_10_ghost_try_vertical
.enemy_slot_10_ghost_try_left_first:
    call .enemy_slot_10_ghost_can_left
    jp z, .enemy_slot_10_ghost_set_left
.enemy_slot_10_ghost_try_vertical:
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    cp b
    jp c, .enemy_slot_10_ghost_try_up_first
    call .enemy_slot_10_ghost_can_down
    jp z, .enemy_slot_10_ghost_set_down
    call .enemy_slot_10_ghost_can_up
    jp z, .enemy_slot_10_ghost_set_up
    jp .enemy_slot_10_ghost_try_reverse
.enemy_slot_10_ghost_try_up_first:
    call .enemy_slot_10_ghost_can_up
    jp z, .enemy_slot_10_ghost_set_up
    call .enemy_slot_10_ghost_can_down
    jp z, .enemy_slot_10_ghost_set_down
.enemy_slot_10_ghost_try_reverse:
    ld hl, msx2_enemy_runtime_dx
    ld de, 10
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_10_ghost_set_left
    cp #FF
    jp z, .enemy_slot_10_ghost_set_right
    ld hl, msx2_enemy_runtime_dy
    ld de, 10
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_10_ghost_set_up
    cp #FF
    jp z, .enemy_slot_10_ghost_set_down
    ret
.enemy_slot_10_ghost_forward:
    ld hl, msx2_enemy_runtime_dx
    ld de, 10
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_10_ghost_move_right_checked
    cp #FF
    jp z, .enemy_slot_10_ghost_move_left_checked
    ld hl, msx2_enemy_runtime_dy
    ld de, 10
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_10_ghost_move_down_checked
    cp #FF
    jp z, .enemy_slot_10_ghost_move_up_checked
    jp .enemy_slot_10_ghost_try_right_first
.enemy_slot_10_ghost_set_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 10
    add hl, de

    ld (hl), 1
    ld hl, msx2_enemy_runtime_dy
    ld de, 10
    add hl, de

    ld (hl), 0
    jp .enemy_slot_10_ghost_move_right
.enemy_slot_10_ghost_set_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 10
    add hl, de

    ld (hl), #FF
    ld hl, msx2_enemy_runtime_dy
    ld de, 10
    add hl, de

    ld (hl), 0
    jp .enemy_slot_10_ghost_move_left
.enemy_slot_10_ghost_set_down:
    ld hl, msx2_enemy_runtime_dx
    ld de, 10
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 10
    add hl, de

    ld (hl), 1
    jp .enemy_slot_10_ghost_move_down
.enemy_slot_10_ghost_set_up:
    ld hl, msx2_enemy_runtime_dx
    ld de, 10
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 10
    add hl, de

    ld (hl), #FF
    jp .enemy_slot_10_ghost_move_up
.enemy_slot_10_ghost_move_right_checked:
    call .enemy_slot_10_ghost_can_right
    jp nz, .enemy_slot_10_ghost_try_vertical
.enemy_slot_10_ghost_move_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    inc (hl)
    ret
.enemy_slot_10_ghost_move_left_checked:
    call .enemy_slot_10_ghost_can_left
    jp nz, .enemy_slot_10_ghost_try_vertical
.enemy_slot_10_ghost_move_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    dec (hl)
    ret
.enemy_slot_10_ghost_move_down_checked:
    call .enemy_slot_10_ghost_can_down
    jp nz, .enemy_slot_10_ghost_try_right_first
.enemy_slot_10_ghost_move_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    inc (hl)
    ret
.enemy_slot_10_ghost_move_up_checked:
    call .enemy_slot_10_ghost_can_up
    jp nz, .enemy_slot_10_ghost_try_right_first
.enemy_slot_10_ghost_move_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    dec (hl)
    ret
.enemy_slot_10_ghost_can_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld a, (hl)
    cp 239
    jp nc, .enemy_slot_10_ghost_blocked
    inc a
    add a, 15
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_10_ghost_can_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_10_ghost_blocked
    jp c, .enemy_slot_10_ghost_blocked
    dec a
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_10_ghost_can_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld a, (hl)
    cp 196
    jp nc, .enemy_slot_10_ghost_blocked
    inc a
    add a, 15
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_10_ghost_can_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_10_ghost_blocked
    dec a
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_10_ghost_blocked:
    or 1
    ret

update_msx2_enemy_position_slot_11:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 12
    ret c
    ld hl, msx2_enemy_runtime_mode
    ld de, 11
    add hl, de

    ld a, (hl)
    cp 4
    jp z, .enemy_slot_11_ball_bounce
    cp 3
    jp z, .enemy_slot_11_dive
    cp 2
    jp z, .enemy_slot_11_ghost_maze
    ld hl, msx2_enemy_runtime_dx
    ld de, 11
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_11_check_y
    cp #FF
    jp z, .enemy_slot_11_left
.enemy_slot_11_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_11_turn_left
    inc b
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld (hl), b
    ret
.enemy_slot_11_turn_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 11
    add hl, de

    ld (hl), #FF
.enemy_slot_11_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_11_turn_right
    jp z, .enemy_slot_11_turn_right
    dec b
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld (hl), b
    ret
.enemy_slot_11_turn_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 11
    add hl, de

    ld (hl), 1
    ret
.enemy_slot_11_check_y:
    ld hl, msx2_enemy_runtime_dy
    ld de, 11
    add hl, de

    ld a, (hl)
    or a
    ret z
    cp #FF
    jp z, .enemy_slot_11_up
.enemy_slot_11_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_11_turn_up
    inc b
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld (hl), b
    ret
.enemy_slot_11_turn_up:
    ld hl, msx2_enemy_runtime_dy
    ld de, 11
    add hl, de

    ld (hl), #FF
.enemy_slot_11_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld b, (hl)
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_11_turn_down
    jp z, .enemy_slot_11_turn_down
    dec b
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld (hl), b
    ret
.enemy_slot_11_turn_down:
    ld hl, msx2_enemy_runtime_dy
    ld de, 11
    add hl, de

    ld (hl), 1
    ret

.enemy_slot_11_ball_bounce:
    ; Pong/Arkanoid ball movement. Runtime dx/dy are signed bytes. Clobbers AF/BC/DE/HL.

    ld hl, msx2_enemy_runtime_dx
    ld de, 11
    add hl, de

    ld a, (hl)
    bit 7, a
    jp nz, .enemy_slot_11_ball_left
.enemy_slot_11_ball_right:
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld a, (hl)
    add a, c
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_11_ball_turn_left
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld (hl), b
    jp .enemy_slot_11_ball_y
.enemy_slot_11_ball_turn_left:
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld (hl), b
    xor a
    sub c
    ld hl, msx2_enemy_runtime_dx
    ld de, 11
    add hl, de

    ld (hl), a
    jp .enemy_slot_11_ball_y
.enemy_slot_11_ball_left:
    neg
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld a, (hl)
    sub c
    jp c, .enemy_slot_11_ball_turn_right
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_11_ball_turn_right
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld (hl), b
    jp .enemy_slot_11_ball_y
.enemy_slot_11_ball_turn_right:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_x
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld (hl), b
    ld a, c
    ld hl, msx2_enemy_runtime_dx
    ld de, 11
    add hl, de

    ld (hl), a

.enemy_slot_11_ball_y:
    ld hl, msx2_enemy_runtime_dy
    ld de, 11
    add hl, de

    ld a, (hl)
    bit 7, a
    jp nz, .enemy_slot_11_ball_up
.enemy_slot_11_ball_down:
    ld c, a
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld a, (hl)
    add a, c
    ld b, a

    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp nc, .enemy_slot_11_ball_check_paddle

.enemy_slot_11_ball_store_y:
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld (hl), b
    jp .enemy_slot_11_ball_check_brick
.enemy_slot_11_ball_check_paddle:
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld b, (hl)
    ld a, b
    add a, 8
    ld c, a
    ld a, (msx2_player_sprite_x)
    ld e, a
    ld a, c
    sub e
    cp 32
    jp nc, .enemy_slot_11_ball_no_paddle_hit

    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_max_y
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld (hl), b
    ld hl, msx2_enemy_runtime_dy
    ld de, 11
    add hl, de

    ld a, (hl)
    neg
    ld hl, msx2_enemy_runtime_dy
    ld de, 11
    add hl, de

    ld (hl), a
    ret
.enemy_slot_11_ball_no_paddle_hit:
    jp .enemy_slot_11_ball_miss_paddle
.enemy_slot_11_ball_miss_paddle:

    call msx2_apply_damage_respawn
    call write_hardware_sprite_attrs
    ret
.enemy_slot_11_ball_up:
    neg
    ld c, a
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld a, (hl)
    sub c
    jp c, .enemy_slot_11_ball_turn_down
    ld b, a
    push bc
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    pop bc
    ld a, b
    cp (hl)
    jp c, .enemy_slot_11_ball_turn_down
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld (hl), b
    jp .enemy_slot_11_ball_check_brick
.enemy_slot_11_ball_turn_down:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_min_y
    add hl, de
    ld a, (hl)
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld (hl), b
    ld a, c
    ld hl, msx2_enemy_runtime_dy
    ld de, 11
    add hl, de

    ld (hl), a
    jp .enemy_slot_11_ball_check_brick

.enemy_slot_11_ball_check_brick:
    ; Ball center probes mutable effect RAM. Effect 3 is collectible/brick and is cleared on hit.
    ; Clobbers AF/BC/DE/HL.
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    push bc
    call msx2_effect_at_pixel
    cp 3
    jp z, .enemy_slot_11_ball_break_brick
    pop bc
    ret
.enemy_slot_11_ball_break_brick:
    xor a
    ld (hl), a
    pop bc
    call clear_msx2_effect_visual_at_pixel
    ld hl, msx2_enemy_runtime_dy
    ld de, 11
    add hl, de

    ld a, (hl)
    neg
    ld (hl), a
    ld a, (msx2_score_lo)
    add a, 10
    ld (msx2_score_lo), a
    jp nc, .enemy_slot_11_ball_brick_score_done
    ld a, (msx2_score_hi)
    inc a
    ld (msx2_score_hi), a
.enemy_slot_11_ball_brick_score_done:
    ld a, (msx2_collectible_count)
    inc a
    ld (msx2_collectible_count), a

    ret

.enemy_slot_11_dive:
    ld hl, msx2_enemy_runtime_tick
    ld de, 11
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_11_dive_active
    dec a
    ld (hl), a
    ret

.enemy_slot_11_dive_active:
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld a, (hl)
    cp 208
    ret nc
    cp 200
    jp nc, .enemy_slot_11_dive_reset
    add a, 2
    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_11_dive_left
    jp z, .enemy_slot_11_dive_done
    inc b
    ld (hl), b
    ret
.enemy_slot_11_dive_left:
    dec b
    ld (hl), b
.enemy_slot_11_dive_done:
    ret
.enemy_slot_11_dive_reset:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_x
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_y
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld (hl), a
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_screen_enemy_speed
    add hl, de
    ld a, (hl)
    ld hl, msx2_enemy_runtime_tick
    ld de, 11
    add hl, de

    ld (hl), a
    ret

.enemy_slot_11_ghost_maze:
    ld hl, msx2_enemy_runtime_tick
    ld de, 11
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_11_ghost_tick_ready
    dec a
    ld (hl), a
    ret
.enemy_slot_11_ghost_tick_ready:
    ld hl, msx2_enemy_runtime_speed
    ld de, 11
    add hl, de

    ld a, (hl)
    or a
    jp nz, .enemy_slot_11_ghost_store_tick
    ld a, 2
.enemy_slot_11_ghost_store_tick:
    ld hl, msx2_enemy_runtime_tick
    ld de, 11
    add hl, de

    ld (hl), a
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_11_ghost_forward
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld a, (hl)
    and #0F
    jp nz, .enemy_slot_11_ghost_forward
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    cp b
    jp c, .enemy_slot_11_ghost_prefer_left
.enemy_slot_11_ghost_prefer_right:
    jp .enemy_slot_11_ghost_try_right_first
.enemy_slot_11_ghost_prefer_left:
    jp .enemy_slot_11_ghost_try_left_first
.enemy_slot_11_ghost_try_right_first:
    call .enemy_slot_11_ghost_can_right
    jp z, .enemy_slot_11_ghost_set_right
    jp .enemy_slot_11_ghost_try_vertical
.enemy_slot_11_ghost_try_left_first:
    call .enemy_slot_11_ghost_can_left
    jp z, .enemy_slot_11_ghost_set_left
.enemy_slot_11_ghost_try_vertical:
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    cp b
    jp c, .enemy_slot_11_ghost_try_up_first
    call .enemy_slot_11_ghost_can_down
    jp z, .enemy_slot_11_ghost_set_down
    call .enemy_slot_11_ghost_can_up
    jp z, .enemy_slot_11_ghost_set_up
    jp .enemy_slot_11_ghost_try_reverse
.enemy_slot_11_ghost_try_up_first:
    call .enemy_slot_11_ghost_can_up
    jp z, .enemy_slot_11_ghost_set_up
    call .enemy_slot_11_ghost_can_down
    jp z, .enemy_slot_11_ghost_set_down
.enemy_slot_11_ghost_try_reverse:
    ld hl, msx2_enemy_runtime_dx
    ld de, 11
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_11_ghost_set_left
    cp #FF
    jp z, .enemy_slot_11_ghost_set_right
    ld hl, msx2_enemy_runtime_dy
    ld de, 11
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_11_ghost_set_up
    cp #FF
    jp z, .enemy_slot_11_ghost_set_down
    ret
.enemy_slot_11_ghost_forward:
    ld hl, msx2_enemy_runtime_dx
    ld de, 11
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_11_ghost_move_right_checked
    cp #FF
    jp z, .enemy_slot_11_ghost_move_left_checked
    ld hl, msx2_enemy_runtime_dy
    ld de, 11
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_11_ghost_move_down_checked
    cp #FF
    jp z, .enemy_slot_11_ghost_move_up_checked
    jp .enemy_slot_11_ghost_try_right_first
.enemy_slot_11_ghost_set_right:
    ld hl, msx2_enemy_runtime_dx
    ld de, 11
    add hl, de

    ld (hl), 1
    ld hl, msx2_enemy_runtime_dy
    ld de, 11
    add hl, de

    ld (hl), 0
    jp .enemy_slot_11_ghost_move_right
.enemy_slot_11_ghost_set_left:
    ld hl, msx2_enemy_runtime_dx
    ld de, 11
    add hl, de

    ld (hl), #FF
    ld hl, msx2_enemy_runtime_dy
    ld de, 11
    add hl, de

    ld (hl), 0
    jp .enemy_slot_11_ghost_move_left
.enemy_slot_11_ghost_set_down:
    ld hl, msx2_enemy_runtime_dx
    ld de, 11
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 11
    add hl, de

    ld (hl), 1
    jp .enemy_slot_11_ghost_move_down
.enemy_slot_11_ghost_set_up:
    ld hl, msx2_enemy_runtime_dx
    ld de, 11
    add hl, de

    ld (hl), 0
    ld hl, msx2_enemy_runtime_dy
    ld de, 11
    add hl, de

    ld (hl), #FF
    jp .enemy_slot_11_ghost_move_up
.enemy_slot_11_ghost_move_right_checked:
    call .enemy_slot_11_ghost_can_right
    jp nz, .enemy_slot_11_ghost_try_vertical
.enemy_slot_11_ghost_move_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    inc (hl)
    ret
.enemy_slot_11_ghost_move_left_checked:
    call .enemy_slot_11_ghost_can_left
    jp nz, .enemy_slot_11_ghost_try_vertical
.enemy_slot_11_ghost_move_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    dec (hl)
    ret
.enemy_slot_11_ghost_move_down_checked:
    call .enemy_slot_11_ghost_can_down
    jp nz, .enemy_slot_11_ghost_try_right_first
.enemy_slot_11_ghost_move_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    inc (hl)
    ret
.enemy_slot_11_ghost_move_up_checked:
    call .enemy_slot_11_ghost_can_up
    jp nz, .enemy_slot_11_ghost_try_right_first
.enemy_slot_11_ghost_move_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    dec (hl)
    ret
.enemy_slot_11_ghost_can_right:
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld a, (hl)
    cp 239
    jp nc, .enemy_slot_11_ghost_blocked
    inc a
    add a, 15
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_11_ghost_can_left:
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld a, (hl)
    cp 1
    jp z, .enemy_slot_11_ghost_blocked
    jp c, .enemy_slot_11_ghost_blocked
    dec a
    ld b, a
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld a, (hl)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_11_ghost_can_down:
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld a, (hl)
    cp 196
    jp nc, .enemy_slot_11_ghost_blocked
    inc a
    add a, 15
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_11_ghost_can_up:
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld a, (hl)
    or a
    jp z, .enemy_slot_11_ghost_blocked
    dec a
    ld c, a
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld a, (hl)
    add a, 8
    ld b, a
    call msx2_collision_at_pixel
    ret
.enemy_slot_11_ghost_blocked:
    or 1
    ret



msx2_apply_damage_respawn:
    ; Shared damage path for effect hazards and entity enemies.
    ; Clobbers AF/DE/HL.
    ld a, 1
    ld (msx2_player_dead_flag), a
    ld a, (msx2_lives)
    or a
    jp z, .damage_game_over
    dec a
    ld (msx2_lives), a
    jp nz, .damage_after_lives
.damage_game_over:
    ld a, 1
    ld (msx2_game_over_flag), a
    ld (msx2_game_over_restart_lock), a
.damage_after_lives:
    call draw_msx2_lives_hud
    call draw_msx2_air_hud
    call msx2_respawn_current_screen
    ld a, (msx2_game_over_flag)
    or a
    ret z
    call draw_msx2_game_over_banner
    ret

update_msx2_enemy_state:
    ; Uses enemy/hazard entities for the active screen as tile-sized damage bodies.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_game_over_flag)
    or a
    ret nz
    ld a, (msx2_level_complete_flag)
    or a
    ret nz
    ld a, (msx2_enemy_damage_cooldown)
    or a
    jp z, .enemy_cooldown_ready
    dec a
    ld (msx2_enemy_damage_cooldown), a
    ret
.enemy_cooldown_ready:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 1
    jp c, .enemy_no_slot_0


    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_0
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_0
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_0
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_0
    jp .enemy_damage
.enemy_no_slot_0:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 2
    jp c, .enemy_no_slot_1


    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_1
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_1
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 1
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_1
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_1
    jp .enemy_damage
.enemy_no_slot_1:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 3
    jp c, .enemy_no_slot_2


    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_2
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_2
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 2
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_2
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_2
    jp .enemy_damage
.enemy_no_slot_2:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 4
    jp c, .enemy_no_slot_3


    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_3
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_3
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 3
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_3
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_3
    jp .enemy_damage
.enemy_no_slot_3:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 5
    jp c, .enemy_no_slot_4


    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_4
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_4
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 4
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_4
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_4
    jp .enemy_damage
.enemy_no_slot_4:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 6
    jp c, .enemy_no_slot_5


    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_5
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_5
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 5
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_5
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_5
    jp .enemy_damage
.enemy_no_slot_5:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 7
    jp c, .enemy_no_slot_6


    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_6
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_6
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 6
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_6
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_6
    jp .enemy_damage
.enemy_no_slot_6:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 8
    jp c, .enemy_no_slot_7


    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_7
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_7
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 7
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_7
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_7
    jp .enemy_damage
.enemy_no_slot_7:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 9
    jp c, .enemy_no_slot_8


    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_8
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_8
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 8
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_8
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_8
    jp .enemy_damage
.enemy_no_slot_8:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 10
    jp c, .enemy_no_slot_9


    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_9
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_9
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 9
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_9
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_9
    jp .enemy_damage
.enemy_no_slot_9:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 11
    jp c, .enemy_no_slot_10


    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_10
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_10
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 10
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_10
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_10
    jp .enemy_damage
.enemy_no_slot_10:
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_enemy_count
    add hl, de
    ld a, (hl)
    cp 12
    jp c, .enemy_no_slot_11


    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_11
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_11
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, b
    add a, 11
    ld e, a
    ld d, 0

    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de

    ld b, (hl)
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    ld a, c
    cp b
    jp c, .enemy_no_slot_11
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_no_slot_11
    jp .enemy_damage
.enemy_no_slot_11:
    ret
.enemy_damage:
    ld a, 1
    ld (msx2_enemy_hit_flag), a
    ld a, 255
    ld (msx2_enemy_damage_cooldown), a
    call msx2_apply_damage_respawn
    call write_hardware_sprite_attrs
    ret

update_msx2_effect_state:
    ; Effect layer contract: 1=hazard, 2=exit, 3=collectible.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_game_over_flag)
    or a
    ret nz
    ld a, (msx2_level_complete_flag)
    or a
    ret nz
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_effect_at_pixel
    or a
    jp z, .no_effect
    cp 1
    jp z, .hazard
    cp 2
    jp z, .exit
    cp 3
    jp z, .collectible
    ret
.no_effect:
    xor a
    ld (msx2_collectible_latch), a
    ret
.hazard:
    xor a
    ld (msx2_collectible_latch), a
    call msx2_apply_damage_respawn
    call write_hardware_sprite_attrs
    ret
.exit:
    xor a
    ld (msx2_collectible_latch), a
    call msx2_compare_collectibles_required
    jp c, .exit_locked
    ld a, 1
    ld (msx2_exit_reached_flag), a
    ld (msx2_level_complete_flag), a
    ld (msx2_level_continue_lock), a
    xor a
    ld (msx2_exit_blocked_flag), a
    call draw_msx2_level_complete_banner
    call write_hardware_sprite_attrs
    ret
.exit_locked:
    ld a, 1
    ld (msx2_exit_blocked_flag), a
    ret
.collectible:
    ld a, (msx2_collectible_latch)
    or a
    ret nz
    xor a
    ld (hl), a
    call clear_msx2_collectible_visual
    ld a, 1
    ld (msx2_collectible_latch), a
    call msx2_compare_collectibles_required
    ret nc
    ld a, (msx2_collectible_count)
    inc a
    ld (msx2_collectible_count), a
    call draw_msx2_collectible_hud
    ret


msx2_compare_collectibles_required:
    ; Compares current collected count with the active screen requirement.
    ; Carry set means collected < required. Clobbers AF/HL, preserves BC/DE.
    ld a, (msx2_current_screen_index)
    ld hl, msx2_screen_required_collectibles
    add a, l
    ld l, a
    ld a, h
    adc a, 0
    ld h, a
    ld a, (msx2_collectible_count)
    cp (hl)
    ret

msx2_load_current_screen_air:
    ; Loads the active screen initial air value. Clobbers AF/HL, preserves BC/DE.
    xor a
    ld (msx2_air_frame_counter), a
    ld a, (msx2_current_screen_index)
    ld hl, msx2_screen_initial_air
    add a, l
    ld l, a
    ld a, h
    adc a, 0
    ld h, a
    ld a, (hl)
    ld (msx2_air_value), a
    ret

msx2_reset_screen_transition_flags:
    ; Clears transient per-screen event flags on WorldMap entry. Clobbers AF only.
    xor a
    ld (msx2_player_dead_flag), a
    ld (msx2_exit_reached_flag), a
    ld (msx2_exit_blocked_flag), a
    ld (msx2_collectible_latch), a
    ld (msx2_enemy_hit_flag), a
    ld (msx2_enemy_damage_cooldown), a
    ld (msx2_snake_growth_pending), a
    ld (msx2_level_complete_flag), a
    ld (msx2_level_continue_lock), a
    ret

clear_msx2_collectible_visual:
    ; Clears the 16x16 visual tile under the active collectible cell.
    ; Clobbers AF/BC/DE/HL.
    call screen4_name_cell_from_player
    call clear_screen4_name_cell_16
    ret

clear_msx2_effect_visual_at_pixel:
    ; B=x pixel, C=y pixel. Clears the containing 16x16 SCREEN 4 name-table cell.
    ; Clobbers AF/BC/DE/HL.
    call screen4_name_cell_from_bc
    call clear_screen4_name_cell_16
    ret

screen4_name_cell_from_player:
    ; Returns HL=top-left name-table address for the player's 16x16 cell.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_player_sprite_y)
    add a, 8
    srl a
    srl a
    srl a
    srl a
    and #0F
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld a, (msx2_player_sprite_x)
    add a, 8
    srl a
    srl a
    srl a
    srl a
    and #0F
    add a, a
    ld e, a
    ld d, 0
    add hl, de
    ld de, #1800
    add hl, de
    ret

screen4_name_cell_from_bc:
    ; B=x pixel, C=y pixel. Returns HL=top-left name-table address for the containing 16x16 cell.
    ; Clobbers AF/BC/DE/HL.
    ld a, c
    srl a
    srl a
    srl a
    srl a
    and #0F
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld a, b
    srl a
    srl a
    srl a
    srl a
    and #0F
    add a, a
    ld e, a
    ld d, 0
    add hl, de
    ld de, #1800
    add hl, de
    ret

msx2_collision_at_pixel:
    ; B=x pixel, C=y pixel. Returns A=collision byte with Z set when empty.
    ; Clobbers AF/BC/DE/HL.
    ld a, c
    srl a
    srl a
    srl a
    srl a
    and #0F
    add a, a
    add a, a
    add a, a
    add a, a
    ld e, a
    ld a, b
    srl a
    srl a
    srl a
    srl a
    and #0F
    add a, e
    ld e, a
    ld d, 0
    ld hl, (msx2_current_collision_ptr)
    add hl, de
    ld a, (hl)
    or a
    ret

msx2_effect_at_pixel:
    ; B=x pixel, C=y pixel. Returns A=effect byte with Z set when empty.
    ; HL points at the effect cell so callers may clear mutable RAM effects.
    ; Clobbers AF/BC/DE/HL.
    ld a, c
    srl a
    srl a
    srl a
    srl a
    and #0F
    add a, a
    add a, a
    add a, a
    add a, a
    ld e, a
    ld a, b
    srl a
    srl a
    srl a
    srl a
    and #0F
    add a, e
    ld e, a
    ld d, 0
    ld hl, (msx2_current_effects_ptr)
    add hl, de
    ld a, (hl)
    or a
    ret

msx2_behavior_at_pixel:
    ; B=x pixel, C=y pixel. Returns A=behavior byte with Z set when empty.
    ; Clobbers AF/BC/DE/HL.
    ld a, c
    srl a
    srl a
    srl a
    srl a
    and #0F
    add a, a
    add a, a
    add a, a
    add a, a
    ld e, a
    ld a, b
    srl a
    srl a
    srl a
    srl a
    and #0F
    add a, e
    ld e, a
    ld d, 0
    ld hl, (msx2_current_behavior_ptr)
    add hl, de
    ld a, (hl)
    or a
    ret

msx2_ladder_at_player_center:
    ; Returns Z when the player center is on behavior code 1 (ladder). Clobbers AF/BC/DE/HL.
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_behavior_at_pixel
    cp 1
    ret

msx2_ladder_below_player_center:
    ; Returns Z when the lower center is on behavior code 1 (ladder). Clobbers AF/BC/DE/HL.
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 10
    ld c, a
    call msx2_behavior_at_pixel
    cp 1
    ret

msx2_rope_at_player_center:
    ; Returns Z when the player center is on behavior code 4 (rope). Clobbers AF/BC/DE/HL.
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_behavior_at_pixel
    cp 4
    ret

msx2_behavior_below_player_center:
    ; Returns the behavior byte under the player feet. Clobbers AF/BC/DE/HL.
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 16
    ld c, a
    call msx2_behavior_at_pixel
    ret

msx2_respawn_current_screen:
    ; Respawn at the player entity for the active msx2screen.
    ; Clobbers AF/DE/HL.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_spawn_x
    add hl, de
    ld a, (hl)
    ld (msx2_player_sprite_x), a
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_spawn_y
    add hl, de
    ld a, (hl)
    ld (msx2_player_sprite_y), a
    xor a
    ld (msx2_player_jump_frames), a
    ld (msx2_player_on_ground), a
    ld (msx2_player_bullet_active), a
    ld (msx2_player_bullet_x), a
    ld (msx2_player_bullet_y), a
    ld (msx2_player_bullet_1_active), a
    ld (msx2_player_bullet_1_x), a
    ld (msx2_player_bullet_1_y), a
    ld (msx2_player_bullet_cooldown), a
    ld (msx2_enemy_bullet_active), a
    ld (msx2_enemy_bullet_x), a
    ld (msx2_enemy_bullet_y), a
    ld (msx2_enemy_bullet_cooldown), a
    ld (msx2_player_anim_counter), a
    ld (msx2_player_anim_frame), a
    inc a
    ld (msx2_player_jump_lock), a

    ret




msx2_try_world_edge_transition_left:
    ld a, (msx2_current_screen_index)
    cp 0
    jp z, .left_screen_0
    jp upload_hardware_sprite_attrs
.left_screen_0:
    jp upload_hardware_sprite_attrs

msx2_try_world_edge_transition_right:
    ld a, (msx2_current_screen_index)
    cp 0
    jp z, .right_screen_0
    jp upload_hardware_sprite_attrs
.right_screen_0:
    jp upload_hardware_sprite_attrs

load_screen4_palette:
    ; R#16 selects the first palette register; port #9A receives 2 bytes per slot.
    call msx2_screen4_data_bank_enter

    ld bc, #0010
    call WRTVDP
    ld hl, screen4_palette_data
    ld b, 32
.palette_loop:
    ld a, (hl)
    out (VDP_PALETTE_PORT), a
    inc hl
    djnz .palette_loop
    call msx2_screen4_data_bank_leave

    ret

init_msx2_effect_buffers:
    ; Restores each msx2screen mutable effect layer from ROM into persistent RAM.
    ; Clobbers AF/BC/DE/HL.
    ; Decompress ZX0 screen4 effects directly into the runtime buffer
    di
    ld hl, NEW_MSX2_SCREEN_4_ROOM_EFFECTS
    ld de, #C080
    call dzx0_standard
    ei
    ret

load_current_msx2_screen4:
    ; Dispatches the active SCREEN 4 room by msx2_current_screen_index. Clobbers AF/BC/DE/HL.
    ld a, (msx2_current_screen_index)
    cp 0
    jp z, load_NEW_MSX2_SCREEN_4_ROOM_screen4
    jp load_NEW_MSX2_SCREEN_4_ROOM_screen4

load_NEW_MSX2_SCREEN_4_ROOM_screen4:
    xor a
    ld hl, SCREEN4_NAME_VRAM
    ld bc, SCREEN4_NAME_SIZE
    call FILVRM
    xor a
    ld hl, SCREEN4_PATTERN_VRAM
    ld bc, SCREEN4_PATTERN_SIZE
    call FILVRM
    xor a
    ld hl, SCREEN4_COLOR_VRAM
    ld bc, SCREEN4_COLOR_SIZE
    call FILVRM
    call msx2_screen4_data_bank_enter

    ; Decompress ZX0 screen4 pattern bank into RAM buffer
    di
    ld hl, NEW_MSX2_SCREEN_4_ROOM_BANK_0_PATTERNS
    ld de, ZX0_TILE_PATTERN_BUFFER
    call dzx0_standard
    ei
    ld hl, ZX0_TILE_PATTERN_BUFFER
    ld de, #0000
    ld bc, 32
    call LDIRVM
    ; Decompress ZX0 screen4 color bank into RAM buffer
    di
    ld hl, NEW_MSX2_SCREEN_4_ROOM_BANK_0_COLORS
    ld de, ZX0_TILE_COLOR_BUFFER
    call dzx0_standard
    ei
    ld hl, ZX0_TILE_COLOR_BUFFER
    ld de, #2000
    ld bc, 32
    call LDIRVM
    ; Decompress ZX0 screen4 pattern bank into RAM buffer
    di
    ld hl, NEW_MSX2_SCREEN_4_ROOM_BANK_1_PATTERNS
    ld de, ZX0_TILE_PATTERN_BUFFER
    call dzx0_standard
    ei
    ld hl, ZX0_TILE_PATTERN_BUFFER
    ld de, #0800
    ld bc, 32
    call LDIRVM
    ; Decompress ZX0 screen4 color bank into RAM buffer
    di
    ld hl, NEW_MSX2_SCREEN_4_ROOM_BANK_1_COLORS
    ld de, ZX0_TILE_COLOR_BUFFER
    call dzx0_standard
    ei
    ld hl, ZX0_TILE_COLOR_BUFFER
    ld de, #2800
    ld bc, 32
    call LDIRVM
    ; Decompress ZX0 screen4 pattern bank into RAM buffer
    di
    ld hl, NEW_MSX2_SCREEN_4_ROOM_BANK_2_PATTERNS
    ld de, ZX0_TILE_PATTERN_BUFFER
    call dzx0_standard
    ei
    ld hl, ZX0_TILE_PATTERN_BUFFER
    ld de, #1000
    ld bc, 48
    call LDIRVM
    ; Decompress ZX0 screen4 color bank into RAM buffer
    di
    ld hl, NEW_MSX2_SCREEN_4_ROOM_BANK_2_COLORS
    ld de, ZX0_TILE_COLOR_BUFFER
    call dzx0_standard
    ei
    ld hl, ZX0_TILE_COLOR_BUFFER
    ld de, #3000
    ld bc, 48
    call LDIRVM

    ; Decompress ZX0 screen4 name table into RAM buffer
    di
    ld hl, NEW_MSX2_SCREEN_4_ROOM_NAMES
    ld de, ZX0_SCREEN_BUFFER
    call dzx0_standard
    ei
    ld hl, ZX0_SCREEN_BUFFER
    ld de, SCREEN4_NAME_VRAM
    ld bc, SCREEN4_NAME_SIZE
    call LDIRVM
    call msx2_screen4_data_bank_leave

    call load_msx2_hud_font
    call draw_NEW_MSX2_SCREEN_4_ROOM_hud_text
    ld hl, NEW_MSX2_SCREEN_4_ROOM_COLLISION
    ld (msx2_current_collision_ptr), hl
    ld hl, NEW_MSX2_SCREEN_4_ROOM_BEHAVIOR
    ld (msx2_current_behavior_ptr), hl
    ld hl, #C080
    ld (msx2_current_effects_ptr), hl
    call apply_NEW_MSX2_SCREEN_4_ROOM_collected_visuals
    ret

apply_NEW_MSX2_SCREEN_4_ROOM_collected_visuals:
    ; Re-erases collectibles already cleared from this screen's persistent effect RAM.
    ; Clobbers AF/BC/DE/HL.
    ; No collectible cells on this screen.
    ret

draw_NEW_MSX2_SCREEN_4_ROOM_hud_text:
    ret
    ret



; Per-msx2screen respawn X coordinates
msx2_screen_spawn_x:
    DB #60

; Per-msx2screen respawn Y coordinates
msx2_screen_spawn_y:
    DB #90

; Per-msx2screen collectible count required before exits unlock
msx2_screen_required_collectibles:
    DB #00

; Per-msx2screen initial air/time values
msx2_screen_initial_air:
    DB #FF

; Per-msx2screen HUD style: 0=compact runtime HUD, 1=status bars
msx2_screen_hud_style:
    DB #00

; Per-msx2screen planned player energy maximum
msx2_screen_hud_player_energy_max:
    DB #10

; Per-msx2screen planned player energy initial value
msx2_screen_hud_player_energy_initial:
    DB #10

; Per-msx2screen planned boss energy maximum
msx2_screen_hud_boss_energy_max:
    DB #10

; Per-msx2screen planned boss energy initial value
msx2_screen_hud_boss_energy_initial:
    DB #10

; Per-msx2screen planned player energy/fill color slot
msx2_screen_hud_primary_color:
    DB #0A

; Per-msx2screen planned boss/secondary color slot
msx2_screen_hud_secondary_color:
    DB #08

; Per-msx2screen planned HUD border color slot
msx2_screen_hud_border_color:
    DB #0F

; Per-msx2screen planned HUD empty/background color slot
msx2_screen_hud_empty_color:
    DB #04

msx2_screen_hud_widget_record_size EQU 12
; Per-msx2screen authored HUD widget counts
msx2_screen_hud_widget_count:
    DB #00

; Per-msx2screen byte offsets into msx2_screen_hud_widget_records
msx2_screen_hud_widget_offset:
    DB #00,#00

; Flat authored HUD widget records: kind,binding,x,y,w,h,max,initial,primary,secondary,border,empty
msx2_screen_hud_widget_records:
    DB #00

; Per-widget icon tile index for icon HUD widgets, #FF means none
msx2_screen_hud_widget_icon_tile:
    DB #FF

; Per-widget byte offsets into msx2_screen_hud_widget_text_pool
msx2_screen_hud_widget_text_offset:
    DB #00,#00

; Per-widget text lengths for text HUD widgets
msx2_screen_hud_widget_text_length:
    DB #00

; Zero-terminated ASCII text payloads for text HUD widgets; offset 0 is empty
msx2_screen_hud_widget_text_pool:
    DB #00

; Per-widget byte offsets into msx2_screen_hud_widget_variable_name_pool
msx2_screen_hud_widget_variable_name_offset:
    DB #00,#00

; Per-widget variable name lengths for custom HUD bindings
msx2_screen_hud_widget_variable_length:
    DB #00

; Zero-terminated ASCII variable names for custom HUD bindings; offset 0 is empty
msx2_screen_hud_widget_variable_name_pool:
    DB #00

; MSX2 SCREEN 4 HUD font patterns: space, digits, A-Z, colon, dash, slash
msx2_hud_font_patterns:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#3C,#66,#6E,#76,#66,#66,#3C,#00
    DB #18,#38,#18,#18,#18,#18,#7E,#00,#3C,#66,#06,#1C,#30,#60,#7E,#00
    DB #3C,#66,#06,#1C,#06,#66,#3C,#00,#0C,#1C,#3C,#6C,#7E,#0C,#0C,#00
    DB #7E,#60,#7C,#06,#06,#66,#3C,#00,#1C,#30,#60,#7C,#66,#66,#3C,#00
    DB #7E,#06,#0C,#18,#30,#30,#30,#00,#3C,#66,#66,#3C,#66,#66,#3C,#00
    DB #3C,#66,#66,#3E,#06,#0C,#38,#00,#18,#3C,#66,#66,#7E,#66,#66,#00
    DB #7C,#66,#66,#7C,#66,#66,#7C,#00,#3C,#66,#60,#60,#60,#76,#3C,#00
    DB #78,#6C,#66,#66,#66,#6C,#78,#00,#7E,#60,#60,#7C,#60,#60,#7E,#00
    DB #7E,#60,#60,#7C,#60,#60,#60,#00,#3C,#66,#60,#6E,#66,#66,#3C,#00
    DB #66,#66,#66,#7E,#66,#66,#66,#00,#7E,#18,#18,#18,#18,#18,#7E,#00
    DB #1E,#0C,#0C,#0C,#0C,#6C,#38,#00,#66,#6C,#78,#70,#78,#6C,#66,#00
    DB #60,#60,#60,#60,#60,#60,#7E,#00,#63,#77,#7F,#6B,#63,#63,#63,#00
    DB #66,#76,#7E,#7E,#6E,#66,#66,#00,#3C,#66,#66,#66,#66,#66,#3C,#00
    DB #7C,#66,#66,#7C,#60,#60,#60,#00,#3C,#66,#66,#66,#6A,#6C,#36,#00
    DB #7C,#66,#66,#7C,#78,#6C,#66,#00,#3C,#66,#60,#3C,#06,#66,#3C,#00
    DB #7E,#18,#18,#18,#18,#18,#18,#00,#66,#66,#66,#66,#66,#66,#3C,#00
    DB #66,#66,#66,#66,#66,#3C,#18,#00,#63,#63,#63,#6B,#7F,#77,#63,#00
    DB #66,#66,#3C,#18,#3C,#66,#66,#00,#66,#66,#66,#3C,#18,#18,#18,#00
    DB #7E,#06,#0C,#18,#30,#60,#7E,#00,#00,#18,#18,#00,#00,#18,#18,#00
    DB #00,#00,#00,#7E,#00,#00,#00,#00,#06,#0C,#0C,#18,#30,#30,#60,#00

msx2_hud_font_patterns_end:
; MSX2 SCREEN 4 HUD font colors: foreground 15 over background 1
msx2_hud_font_colors:
    DB #75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75
    DB #75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75
    DB #75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75
    DB #75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75
    DB #75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75
    DB #75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75
    DB #75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75
    DB #75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75
    DB #75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75
    DB #75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75
    DB #75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75
    DB #75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75
    DB #75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75
    DB #75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75
    DB #75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75
    DB #75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75
    DB #75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75
    DB #75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75
    DB #75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75
    DB #75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75,#75

msx2_hud_font_colors_end:
; Per-msx2screen Galaxian Attack Wave interval in frames
msx2_screen_attack_interval:
    DB #B4

; Per-msx2screen Galaxian Attack Wave minimum attackers
msx2_screen_attack_min:
    DB #01

; Per-msx2screen Galaxian Attack Wave maximum attackers
msx2_screen_attack_max:
    DB #03

; Per-msx2screen Galaxian Attack Wave random seed
msx2_screen_attack_seed:
    DB #49

; Per-msx2screen active enemy/hazard entity count, capped at 12
msx2_screen_enemy_count:
    DB #00

; Per-msx2screen enemy/hazard entity X coordinates, 12 slots per screen
msx2_screen_enemy_x:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard entity Y coordinates, 12 slots per screen
msx2_screen_enemy_y:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard patrol minimum X, 12 slots per screen
msx2_screen_enemy_min_x:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard patrol maximum X, 12 slots per screen
msx2_screen_enemy_max_x:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard patrol minimum Y, 12 slots per screen
msx2_screen_enemy_min_y:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard patrol maximum Y, 12 slots per screen
msx2_screen_enemy_max_y:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard initial movement direction, 12 slots per screen
msx2_screen_enemy_dx:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard initial vertical movement direction, 12 slots per screen
msx2_screen_enemy_dy:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard movement component mode, 12 slots per screen
msx2_screen_enemy_mode:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard movement component frame delay, 12 slots per screen
msx2_screen_enemy_speed:
    DB #02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02

; Per-msx2screen enemy/hazard score value, 12 slots per screen
msx2_screen_enemy_score:
    DB #01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01

; Default empty MSX2 SCREEN 4 collision layer, 16x12 cells
screen4_empty_collision_layer:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Default empty MSX2 SCREEN 4 effects layer, 16x12 cells
screen4_empty_effects_layer:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Default empty MSX2 SCREEN 4 behavior layer, 16x12 cells
screen4_empty_behavior_layer:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00



; New MSX2 SCREEN 4 Room collision layer, 16x14 bytes
NEW_MSX2_SCREEN_4_ROOM_COLLISION:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01

; New MSX2 SCREEN 4 Room effects layer, 16x14 bytes
NEW_MSX2_SCREEN_4_ROOM_EFFECTS:
    ; ZX0 compressed effects (192 -> 6 bytes)
    DB #85,#00,#55,#D5,#55,#60
NEW_MSX2_SCREEN_4_ROOM_BEHAVIOR:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; ==================================================================
; ZX0 DECOMPRESSOR (AUTO-INJECTED)
; ==================================================================
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


    ds #C000 - $, #FF

; ==================================================================
; MSX2 SCREEN 4 cold data bank.
; Mapped to P2/#8000 only while copying palette, sprite patterns, and
; screen pattern/name data into VRAM. Resident gameplay code restores P2
; before returning to normal execution.
; ==================================================================
    org #8000
MSX2_SCREEN4_DATA_BANK_ROM_START:

; Palette bytes: byte1=(R<<4)|B, byte2=G
screen4_palette_data:
    DB #00,#00,#00,#00,#22,#05,#33,#06,#15,#01,#27,#02,#51,#01,#36,#06
    DB #72,#02,#74,#04,#52,#05,#63,#06,#12,#04,#55,#02,#44,#04,#77,#07


msx2_hw_sprite_patterns:
; Hardware metasprite frame 0 part 0: x+0, y+0
msx2_hw_sprite_frame_0_pattern_0:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
; Mirrored hardware metasprite frame 0 part 0: authored right
msx2_hw_sprite_frame_0_mirror_pattern_0:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
; Shared 16x16 enemy/hazard hardware sprite pattern
msx2_hw_enemy_sprite_pattern:
    DB #07,#1F,#3F,#7F,#67,#E7,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#EE,#C6,#80
    DB #E0,#F8,#FC,#FE,#9E,#9F,#FF,#FF,#FF,#FF,#FF,#FF,#FF,#EF,#31,#01
; Shared 16x16 player bullet hardware sprite pattern
msx2_hw_player_bullet_pattern:
    DB #18,#18,#18,#18,#18,#18,#18,#18,#18,#18,#18,#18,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
; Shared 16x16 enemy bullet hardware sprite pattern
msx2_hw_enemy_bullet_pattern:
    DB #00,#00,#18,#18,#3C,#3C,#18,#18,#18,#18,#3C,#3C,#18,#18,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
msx2_hw_sprite_patterns_end:

msx2_hw_sprite_colors:
; Line colors for hardware sprite layer 0
msx2_hw_sprite_colors_0:
    DB #05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05,#05
; Line colors for enemy/hazard hardware sprite slot 0
msx2_hw_enemy_sprite_colors_0:
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
; Line colors for enemy/hazard hardware sprite slot 1
msx2_hw_enemy_sprite_colors_1:
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
; Line colors for enemy/hazard hardware sprite slot 2
msx2_hw_enemy_sprite_colors_2:
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
; Line colors for enemy/hazard hardware sprite slot 3
msx2_hw_enemy_sprite_colors_3:
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
; Line colors for enemy/hazard hardware sprite slot 4
msx2_hw_enemy_sprite_colors_4:
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
; Line colors for enemy/hazard hardware sprite slot 5
msx2_hw_enemy_sprite_colors_5:
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
; Line colors for enemy/hazard hardware sprite slot 6
msx2_hw_enemy_sprite_colors_6:
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
; Line colors for enemy/hazard hardware sprite slot 7
msx2_hw_enemy_sprite_colors_7:
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
; Line colors for enemy/hazard hardware sprite slot 8
msx2_hw_enemy_sprite_colors_8:
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
; Line colors for enemy/hazard hardware sprite slot 9
msx2_hw_enemy_sprite_colors_9:
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
; Line colors for enemy/hazard hardware sprite slot 10
msx2_hw_enemy_sprite_colors_10:
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
; Line colors for enemy/hazard hardware sprite slot 11
msx2_hw_enemy_sprite_colors_11:
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
; Line colors for player bullet hardware sprite slot
msx2_hw_player_bullet_colors:
    DB #06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06
; Line colors for enemy bullet hardware sprite slot
msx2_hw_enemy_bullet_colors:
    DB #08,#08,#08,#08,#08,#08,#08,#08,#08,#08,#08,#08,#08,#08,#08,#08
msx2_hw_sprite_colors_end:

; 1 player hardware sprite(s), 12 enemy/hazard sprite slots, 2 player bullet slot, 1 enemy bullet slot; next Y=208 terminates the SAT
msx2_hw_sprite_attrs:
    DB #66,#48,#00,#00,#D0,#00,#08,#00,#D0,#00,#08,#00,#D0,#00,#08,#00
    DB #D0,#00,#08,#00,#D0,#00,#08,#00,#D0,#00,#08,#00,#D0,#00,#08,#00
    DB #D0,#00,#08,#00,#D0,#00,#08,#00,#D0,#00,#08,#00,#D0,#00,#08,#00
    DB #D0,#00,#08,#00,#D0,#00,#0C,#00,#D0,#00,#0C,#00,#D0,#00,#10,#00
    DB #D0,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00


; New MSX2 SCREEN 4 Room SCREEN 4 name table, 32x24 chars
NEW_MSX2_SCREEN_4_ROOM_NAMES:
    ; ZX0 compressed layout (768 -> 21 bytes)
    DB #3D,#00,#01,#FC,#18,#95,#02,#03,#38,#80,#55,#56,#F5,#04,#FE,#29
    DB #05,#57,#55,#55,#80
NEW_MSX2_SCREEN_4_ROOM_BANK_0_PATTERNS:
    ; ZX0 compressed tile_pattern (32 -> 30 bytes)
    DB #2A,#00,#C0,#20,#86,#05,#06,#07,#00,#01,#92,#02,#04,#50,#A0,#0D
    DB #07,#28,#20,#98,#C0,#00,#0D,#A2,#02,#35,#01,#00,#55,#58
NEW_MSX2_SCREEN_4_ROOM_BANK_0_COLORS:
    ; ZX0 compressed tile_color (32 -> 27 bytes)
    DB #2A,#00,#03,#E0,#8A,#40,#90,#29,#00,#0D,#22,#E0,#90,#40,#90,#09
    DB #90,#89,#E0,#8E,#0E,#00,#09,#F0,#35,#55,#58
NEW_MSX2_SCREEN_4_ROOM_BANK_1_PATTERNS:
    ; ZX0 compressed tile_pattern (32 -> 30 bytes)
    DB #2A,#00,#C0,#20,#86,#05,#06,#07,#00,#01,#92,#02,#04,#50,#A0,#0D
    DB #07,#28,#20,#98,#C0,#00,#0D,#A2,#02,#35,#01,#00,#55,#58
NEW_MSX2_SCREEN_4_ROOM_BANK_1_COLORS:
    ; ZX0 compressed tile_color (32 -> 27 bytes)
    DB #2A,#00,#03,#E0,#8A,#40,#90,#29,#00,#0D,#22,#E0,#90,#40,#90,#09
    DB #90,#89,#E0,#8E,#0E,#00,#09,#F0,#35,#55,#58
NEW_MSX2_SCREEN_4_ROOM_BANK_2_PATTERNS:
    ; ZX0 compressed tile_pattern (48 -> 33 bytes)
    DB #2A,#00,#C0,#20,#86,#05,#06,#07,#00,#01,#92,#02,#04,#50,#A0,#0D
    DB #07,#28,#20,#98,#C0,#00,#0D,#A2,#02,#26,#01,#00,#90,#F0,#D5,#55
    DB #60
NEW_MSX2_SCREEN_4_ROOM_BANK_2_COLORS:
    ; ZX0 compressed tile_color (48 -> 32 bytes)
    DB #2A,#00,#03,#E0,#8A,#40,#90,#29,#00,#0D,#22,#E0,#90,#40,#90,#09
    DB #90,#89,#E0,#8E,#0E,#00,#09,#F0,#2E,#FF,#FF,#90,#54,#D5,#55,#60
    ds #A000 - $, #FF

; ==================================================================
; ZX0 SCREEN BUFFER (AUTO-INJECTED)
; Shared scratch buffer for screen layout decompression (768 bytes, scratch slot 768 bytes)
; ==================================================================
ZX0_SCREEN_BUFFER EQU #C900

; ==================================================================
; ZX0 TILE PATTERN BUFFER (AUTO-INJECTED)
; Shared scratch buffer for tile pattern data decompression (48 bytes, scratch slot 768 bytes)
; ==================================================================
ZX0_TILE_PATTERN_BUFFER EQU #C900

; ==================================================================
; ZX0 TILE COLOR BUFFER (AUTO-INJECTED)
; Shared scratch buffer for tile color data decompression (48 bytes, scratch slot 768 bytes)
; ==================================================================
ZX0_TILE_COLOR_BUFFER EQU #C900

    end
