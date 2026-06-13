; File: unitedFiles.asm
; ==================================================================
; Mideas MSX2 SCREEN 4 tile backend
; Project: v22walljump
; Screen mode: SCREEN 4 (Graphics II)
; ROM Mode: megarom
; Mapper Target: konami
; Auto MegaROM: Yes
; MSX2 MegaROM Path: Konami 8K fixed-bank0 compatibility
; ROM mode requested: megarom
; Mapper requested: konami
; ==================================================================

; [[[MIDEAS_ARTIFACT:project_slice.json:BEGIN]]]
; {
;   "scope": "msx2_screen4_project_slice",
;   "projectName": "v22walljump",
;   "backend": "msx2-screen4-pattern",
;   "screenMode": "SCREEN 4 (Graphics II)",
;   "romMode": "megarom",
;   "mapper": "konami",
;   "entryPoints": {
;     "gameFlowId": "gf_platform_mymsxgame",
;     "gameFlowName": "Main MSX2",
;     "worldIds": [
;       "worldmap_1780415077651"
;     ],
;     "screenIds": [
;       "msx2screen_1780415045987",
;       "screen_platform_mymsxgame"
;     ]
;   },
;   "includedAssets": [
;     {
;       "type": "msx2player",
;       "id": "msx2player_1780388067666",
;       "name": "Player_Main",
;       "reason": "Referenced by reachable native MSX2 player source",
;       "ownerWorldIds": [
;         "worldmap_1780415077651"
;       ]
;     },
;     {
;       "type": "msx2screen_tile",
;       "id": "screen_platform_mymsxgame_tile_0",
;       "name": "Blank",
;       "ownerScreenId": "screen_platform_mymsxgame",
;       "ownerWorldIds": [
;         "worldmap_1780415077651"
;       ],
;       "reason": "Tile used by reachable native MSX2 screen"
;     },
;     {
;       "type": "msx2screen_tile",
;       "id": "screen_platform_mymsxgame_tile_1",
;       "name": "Solid",
;       "ownerScreenId": "screen_platform_mymsxgame",
;       "ownerWorldIds": [
;         "worldmap_1780415077651"
;       ],
;       "reason": "Tile used by reachable native MSX2 screen"
;     },
;     {
;       "type": "msx2screen_tile",
;       "id": "tile_1780001908330",
;       "name": "caja",
;       "ownerScreenId": "screen_platform_mymsxgame",
;       "ownerWorldIds": [
;         "worldmap_1780415077651"
;       ],
;       "reason": "Tile used by reachable native MSX2 screen"
;     },
;     {
;       "type": "msx2screen_tile",
;       "id": "tile_1780093534882",
;       "name": "pinchos",
;       "ownerScreenId": "screen_platform_mymsxgame",
;       "ownerWorldIds": [
;         "worldmap_1780415077651"
;       ],
;       "reason": "Tile used by reachable native MSX2 screen"
;     },
;     {
;       "type": "msx2screen_tile",
;       "id": "tile_1780415045987_0",
;       "name": "Blank",
;       "ownerScreenId": "msx2screen_1780415045987",
;       "ownerWorldIds": [
;         "worldmap_1780415077651"
;       ],
;       "reason": "Tile used by reachable native MSX2 screen"
;     },
;     {
;       "type": "msx2screen_tile",
;       "id": "tile_1780415045987_1",
;       "name": "Platform",
;       "ownerScreenId": "msx2screen_1780415045987",
;       "ownerWorldIds": [
;         "worldmap_1780415077651"
;       ],
;       "reason": "Tile used by reachable native MSX2 screen"
;     },
;     {
;       "type": "msx2screen",
;       "id": "msx2screen_1780415045987",
;       "name": "pantalla2",
;       "reason": "Referenced by world worldmap_1780415077651",
;       "ownerWorldIds": [
;         "worldmap_1780415077651"
;       ]
;     },
;     {
;       "type": "msx2screen",
;       "id": "screen_platform_mymsxgame",
;       "name": "pantalla1",
;       "reason": "Referenced by world worldmap_1780415077651",
;       "ownerWorldIds": [
;         "worldmap_1780415077651"
;       ]
;     },
;     {
;       "type": "msx2sprite",
;       "id": "msx2sprite_1779969383977",
;       "name": "player_spr",
;       "reason": "Referenced by reachable MSX2 entity or sprite fallback",
;       "ownerWorldIds": [
;         "worldmap_1780415077651"
;       ]
;     },
;     {
;       "type": "msx2sprite",
;       "id": "msx2sprite_1780501897203",
;       "name": "caja (sprite)",
;       "reason": "Referenced by reachable MSX2 entity or sprite fallback",
;       "ownerWorldIds": [
;         "worldmap_1780415077651"
;       ]
;     },
;     {
;       "type": "worldmap",
;       "id": "worldmap_1780415077651",
;       "name": "New Worldmap",
;       "reason": "GameFlow WorldLink node msx2_gf_worldlink_1780415155491"
;     }
;   ],
;   "excludedAssets": [
;     {
;       "type": "code",
;       "id": "code_new_MyMSXGame_main_1779969301603_locff",
;       "name": "main.asm",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "code",
;       "id": "code_new_MyMSXGame_data_graphics_1779969301603_v4xc5",
;       "name": "data/graphics.asm",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "code",
;       "id": "code_new_MyMSXGame_data_components_1779969301603_6fka7",
;       "name": "data/components.asm",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "code",
;       "id": "code_new_MyMSXGame_code_behaviors_1779969301603_1uy72",
;       "name": "code/behaviors.asm",
;       "reason": "Not used by native MSX2 SCREEN 4 backend"
;     },
;     {
;       "type": "msx2gameflow",
;       "id": "asset_platform_gameflow_1779969301603",
;       "name": "Main MSX2",
;       "reason": "Not reachable from active MSX2 GameFlow/world slice"
;     },
;     {
;       "type": "msx2sprite",
;       "id": "msx2sprite_1780002158610",
;       "name": "box_spr",
;       "reason": "Not reachable from active MSX2 GameFlow/world slice"
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
;     "runtime.msx2.box2",
;     "runtime.msx2.mapper.konami8k"
;   ],
;   "includedRuntimeModuleDetails": [
;     {
;       "id": "runtime.msx2.boot",
;       "placement": "resident",
;       "reason": "Required by every native MSX2 SCREEN 4 build"
;     },
;     {
;       "id": "runtime.msx2.screen4.vdp",
;       "placement": "resident",
;       "reason": "Required by every native MSX2 SCREEN 4 build"
;     },
;     {
;       "id": "runtime.msx2.input",
;       "placement": "resident",
;       "reason": "Required by current MSX2 gameplay loop"
;     },
;     {
;       "id": "runtime.msx2.screen_loader",
;       "placement": "resident",
;       "reason": "Required to load reachable native MSX2 screens"
;     },
;     {
;       "id": "runtime.msx2.layers.collision",
;       "placement": "resident",
;       "reason": "Collision reader stays resident; current screen data is cached in RAM from world data banks"
;     },
;     {
;       "id": "runtime.msx2.layers.effects",
;       "placement": "resident",
;       "reason": "Effects layer runtime buffers are part of the current runtime contract"
;     },
;     {
;       "id": "runtime.msx2.layers.behavior",
;       "placement": "resident",
;       "reason": "Behavior reader stays resident; current screen data is cached in RAM from world data banks"
;     },
;     {
;       "id": "runtime.msx2.hardware_sprites",
;       "placement": "resident",
;       "reason": "Enabled only when a reachable MSX2 sprite source exists"
;     },
;     {
;       "id": "runtime.msx2.box2",
;       "placement": "resident",
;       "reason": "Enabled when reachable screens contain msx2_box2 or legacy msx2_push_box entities"
;     },
;     {
;       "id": "runtime.msx2.mapper.konami8k",
;       "placement": "resident",
;       "reason": "Enabled by Konami MegaROM data-bank mode"
;     }
;   ],
;   "excludedRuntimeModules": [
;     {
;       "id": "runtime.msx2.projectiles",
;       "placement": "resident",
;       "reason": "Enabled by shooter-horizontal movement or player msx2_shooter component"
;     },
;     {
;       "id": "runtime.msx2.shooter60hz.contract",
;       "placement": "metadata",
;       "reason": "Enabled when reachable SCREEN 4 screens declare shooter 60Hz budgets and IRQ profiles"
;     },
;     {
;       "id": "runtime.msx2.stage_banner",
;       "placement": "resident",
;       "reason": "Enabled only by shooter wave flow"
;     },
;     {
;       "id": "runtime.msx2.scroll.vertical",
;       "placement": "resident",
;       "reason": "Enabled only when reachable screens request scroll"
;     },
;     {
;       "id": "runtime.msx2.snake_char",
;       "placement": "resident",
;       "reason": "Enabled only by snake-char movement"
;     }
;   ],
;   "runtimeModuleDetails": [
;     {
;       "id": "runtime.msx2.boot",
;       "included": true,
;       "placement": "resident",
;       "reason": "Required by every native MSX2 SCREEN 4 build"
;     },
;     {
;       "id": "runtime.msx2.screen4.vdp",
;       "included": true,
;       "placement": "resident",
;       "reason": "Required by every native MSX2 SCREEN 4 build"
;     },
;     {
;       "id": "runtime.msx2.input",
;       "included": true,
;       "placement": "resident",
;       "reason": "Required by current MSX2 gameplay loop"
;     },
;     {
;       "id": "runtime.msx2.screen_loader",
;       "included": true,
;       "placement": "resident",
;       "reason": "Required to load reachable native MSX2 screens"
;     },
;     {
;       "id": "runtime.msx2.layers.collision",
;       "included": true,
;       "placement": "resident",
;       "reason": "Collision reader stays resident; current screen data is cached in RAM from world data banks"
;     },
;     {
;       "id": "runtime.msx2.layers.effects",
;       "included": true,
;       "placement": "resident",
;       "reason": "Effects layer runtime buffers are part of the current runtime contract"
;     },
;     {
;       "id": "runtime.msx2.layers.behavior",
;       "included": true,
;       "placement": "resident",
;       "reason": "Behavior reader stays resident; current screen data is cached in RAM from world data banks"
;     },
;     {
;       "id": "runtime.msx2.hardware_sprites",
;       "included": true,
;       "placement": "resident",
;       "reason": "Enabled only when a reachable MSX2 sprite source exists"
;     },
;     {
;       "id": "runtime.msx2.projectiles",
;       "included": false,
;       "placement": "resident",
;       "reason": "Enabled by shooter-horizontal movement or player msx2_shooter component"
;     },
;     {
;       "id": "runtime.msx2.shooter60hz.contract",
;       "included": false,
;       "placement": "metadata",
;       "reason": "Enabled when reachable SCREEN 4 screens declare shooter 60Hz budgets and IRQ profiles"
;     },
;     {
;       "id": "runtime.msx2.stage_banner",
;       "included": false,
;       "placement": "resident",
;       "reason": "Enabled only by shooter wave flow"
;     },
;     {
;       "id": "runtime.msx2.scroll.vertical",
;       "included": false,
;       "placement": "resident",
;       "reason": "Enabled only when reachable screens request scroll"
;     },
;     {
;       "id": "runtime.msx2.snake_char",
;       "included": false,
;       "placement": "resident",
;       "reason": "Enabled only by snake-char movement"
;     },
;     {
;       "id": "runtime.msx2.box2",
;       "included": true,
;       "placement": "resident",
;       "reason": "Enabled when reachable screens contain msx2_box2 or legacy msx2_push_box entities"
;     },
;     {
;       "id": "runtime.msx2.mapper.konami8k",
;       "included": true,
;       "placement": "resident",
;       "reason": "Enabled by Konami MegaROM data-bank mode"
;     }
;   ],
;   "worldPackageSummary": [
;     {
;       "worldId": "worldmap_1780415077651",
;       "assetCount": 5,
;       "screenCount": 2,
;       "estimatedBytes": 4905,
;       "estimated8kBanks": 1,
;       "bankClassBytes": [
;         {
;           "id": "world.screen",
;           "usedBytes": 3920
;         },
;         {
;           "id": "world.manifest",
;           "usedBytes": 649
;         },
;         {
;           "id": "world.graphics.sprite",
;           "usedBytes": 336
;         }
;       ]
;     }
;   ],
;   "worldBankManifest": {
;     "scope": "msx2_screen4_world_bank_manifest",
;     "mapper": "konami",
;     "bankSizeBytes": 8192,
;     "dataWindowAddress": "#8000",
;     "estimatedPhysicalBanks": [
;       {
;         "bankIndex": 0,
;         "windowAddress": "#8000",
;         "bankSizeBytes": 8192,
;         "warningThresholdBytes": 7372,
;         "usedBytes": 4905,
;         "freeBytes": 3287,
;         "usedPercent": 59.88,
;         "warning": false,
;         "overBudgetBytes": 0,
;         "status": "ok",
;         "packages": [
;           {
;             "id": "msx2screen.screen_platform_mymsxgame",
;             "usedBytes": 2304,
;             "recommendedBankClass": "world.screen"
;           },
;           {
;             "id": "msx2screen.msx2screen_1780415045987",
;             "usedBytes": 1616,
;             "recommendedBankClass": "world.screen"
;           },
;           {
;             "id": "worldmap.worldmap_1780415077651",
;             "usedBytes": 649,
;             "recommendedBankClass": "world.manifest"
;           },
;           {
;             "id": "msx2sprite.msx2sprite_1779969383977",
;             "usedBytes": 288,
;             "recommendedBankClass": "world.graphics.sprite"
;           },
;           {
;             "id": "msx2sprite.msx2sprite_1780501897203",
;             "usedBytes": 48,
;             "recommendedBankClass": "world.graphics.sprite"
;           }
;         ]
;       }
;     ],
;     "worlds": [
;       {
;         "worldId": "worldmap_1780415077651",
;         "estimatedBytes": 4905,
;         "estimated8kBanks": 1,
;         "packages": [
;           {
;             "packageId": "msx2screen.msx2screen_1780415045987",
;             "type": "msx2screen",
;             "sourceId": "msx2screen_1780415045987",
;             "logicalSection": "world screens",
;             "recommendedBankClass": "world.screen",
;             "physicalBankIndex": 0,
;             "windowAddress": "#8000",
;             "bankSizeBytes": 8192,
;             "rawBytes": 1616,
;             "storedBytes": 1616,
;             "decision": "MIXED_ROM_ZX0_CANDIDATE_TO_VRAM_AND_ROM_RAW",
;             "placementReason": "Estimated first-fit-decreasing placement before final compression and allocator pass."
;           },
;           {
;             "packageId": "msx2screen.screen_platform_mymsxgame",
;             "type": "msx2screen",
;             "sourceId": "screen_platform_mymsxgame",
;             "logicalSection": "world screens",
;             "recommendedBankClass": "world.screen",
;             "physicalBankIndex": 0,
;             "windowAddress": "#8000",
;             "bankSizeBytes": 8192,
;             "rawBytes": 2304,
;             "storedBytes": 2304,
;             "decision": "MIXED_ROM_ZX0_CANDIDATE_TO_VRAM_AND_ROM_RAW",
;             "placementReason": "Estimated first-fit-decreasing placement before final compression and allocator pass."
;           },
;           {
;             "packageId": "msx2sprite.msx2sprite_1779969383977",
;             "type": "msx2sprite",
;             "sourceId": "msx2sprite_1779969383977",
;             "logicalSection": "world graphics",
;             "recommendedBankClass": "world.graphics.sprite",
;             "physicalBankIndex": 0,
;             "windowAddress": "#8000",
;             "bankSizeBytes": 8192,
;             "rawBytes": 288,
;             "storedBytes": 288,
;             "decision": "ROM_RAW_TO_VRAM",
;             "placementReason": "Estimated first-fit-decreasing placement before final compression and allocator pass."
;           },
;           {
;             "packageId": "msx2sprite.msx2sprite_1780501897203",
;             "type": "msx2sprite",
;             "sourceId": "msx2sprite_1780501897203",
;             "logicalSection": "world graphics",
;             "recommendedBankClass": "world.graphics.sprite",
;             "physicalBankIndex": 0,
;             "windowAddress": "#8000",
;             "bankSizeBytes": 8192,
;             "rawBytes": 48,
;             "storedBytes": 48,
;             "decision": "ROM_RAW_TO_VRAM",
;             "placementReason": "Estimated first-fit-decreasing placement before final compression and allocator pass."
;           },
;           {
;             "packageId": "worldmap.worldmap_1780415077651",
;             "type": "worldmap",
;             "sourceId": "worldmap_1780415077651",
;             "logicalSection": "world manifest",
;             "recommendedBankClass": "world.manifest",
;             "physicalBankIndex": 0,
;             "windowAddress": "#8000",
;             "bankSizeBytes": 8192,
;             "rawBytes": 649,
;             "storedBytes": 649,
;             "decision": "ROM_RAW",
;             "placementReason": "Estimated first-fit-decreasing placement before final compression and allocator pass."
;           }
;         ]
;       }
;     ],
;     "note": "Pre-allocator World Bank Pack manifest. Physical banks are estimates from logical_bank_budget.json and may change after compression."
;   },
;   "screen4RuntimeLayerPolicy": {
;     "collision": {
;       "definitionPlacement": "world_data_bank",
;       "runtimePlacement": "ram_cache",
;       "cacheScope": "current_screen",
;       "bytesPerScreen": 192
;     },
;     "behavior": {
;       "definitionPlacement": "world_data_bank",
;       "runtimePlacement": "ram_cache",
;       "cacheScope": "current_screen",
;       "bytesPerScreen": 192
;     },
;     "effects": {
;       "definitionPlacement": "world_data_bank",
;       "runtimePlacement": "persistent_ram",
;       "cacheScope": "per_screen",
;       "bytesPerScreen": 192
;     }
;   },
;   "shooter60Hz": {
;     "targetHz": 60,
;     "frameBudget": null,
;     "screens": [],
;     "screenCount": 0,
;     "warnings": [],
;     "errors": []
;   },
;   "assetStoragePolicy": [
;     {
;       "type": "msx2player",
;       "id": "msx2player_1780388067666",
;       "name": "Player_Main",
;       "ownerWorldIds": [
;         "worldmap_1780415077651"
;       ],
;       "rawBytes": 0,
;       "storedBytesEstimate": 0,
;       "accessPattern": "compile_time_player_definition",
;       "mutable": false,
;       "decision": "COMPILED_INTO_RUNTIME_CONSTANTS",
;       "reason": "MSX2 Player editor documents are compile-time configuration only; runtime sprites and maps are budgeted as their referenced assets."
;     },
;     {
;       "type": "msx2screen_tile",
;       "id": "screen_platform_mymsxgame_tile_0",
;       "name": "Blank",
;       "ownerScreenId": "screen_platform_mymsxgame",
;       "ownerWorldIds": [
;         "worldmap_1780415077651"
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
;       "id": "screen_platform_mymsxgame_tile_1",
;       "name": "Solid",
;       "ownerScreenId": "screen_platform_mymsxgame",
;       "ownerWorldIds": [
;         "worldmap_1780415077651"
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
;       "id": "tile_1780001908330",
;       "name": "caja",
;       "ownerScreenId": "screen_platform_mymsxgame",
;       "ownerWorldIds": [
;         "worldmap_1780415077651"
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
;       "id": "tile_1780093534882",
;       "name": "pinchos",
;       "ownerScreenId": "screen_platform_mymsxgame",
;       "ownerWorldIds": [
;         "worldmap_1780415077651"
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
;       "id": "tile_1780415045987_0",
;       "name": "Blank",
;       "ownerScreenId": "msx2screen_1780415045987",
;       "ownerWorldIds": [
;         "worldmap_1780415077651"
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
;       "id": "tile_1780415045987_1",
;       "name": "Platform",
;       "ownerScreenId": "msx2screen_1780415045987",
;       "ownerWorldIds": [
;         "worldmap_1780415077651"
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
;       "id": "msx2screen_1780415045987",
;       "name": "pantalla2",
;       "ownerWorldIds": [
;         "worldmap_1780415077651"
;       ],
;       "rawBytes": 1616,
;       "storedBytesEstimate": 1616,
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
;           "rawBytes": 40,
;           "accessPattern": "load_to_vram",
;           "decision": "ROM_RAW_TO_VRAM"
;         },
;         {
;           "name": "colors",
;           "rawBytes": 40,
;           "accessPattern": "load_to_vram",
;           "decision": "ROM_RAW_TO_VRAM"
;         },
;         {
;           "name": "runtimeLayersAndSpawns",
;           "rawBytes": 768,
;           "accessPattern": "runtime_read",
;           "decision": "ROM_RAW",
;           "placement": "world_data_bank",
;           "runtimePlacement": "ram_cache_for_collision_behavior_and_persistent_ram_for_effects"
;         }
;       ],
;       "screenLabel": "PANTALLA2",
;       "payloadParts": [
;         {
;           "label": "PANTALLA2_NAMES",
;           "kind": "screen4_names",
;           "rawBytes": 768,
;           "loadOrder": 20
;         },
;         {
;           "label": "PANTALLA2_BANK_0_PATTERNS",
;           "kind": "screen4_patterns",
;           "rawBytes": 8,
;           "loadOrder": 0
;         },
;         {
;           "label": "PANTALLA2_BANK_0_COLORS",
;           "kind": "screen4_colors",
;           "rawBytes": 8,
;           "loadOrder": 1
;         },
;         {
;           "label": "PANTALLA2_BANK_1_PATTERNS",
;           "kind": "screen4_patterns",
;           "rawBytes": 8,
;           "loadOrder": 2
;         },
;         {
;           "label": "PANTALLA2_BANK_1_COLORS",
;           "kind": "screen4_colors",
;           "rawBytes": 8,
;           "loadOrder": 3
;         },
;         {
;           "label": "PANTALLA2_BANK_2_PATTERNS",
;           "kind": "screen4_patterns",
;           "rawBytes": 24,
;           "loadOrder": 4
;         },
;         {
;           "label": "PANTALLA2_BANK_2_COLORS",
;           "kind": "screen4_colors",
;           "rawBytes": 24,
;           "loadOrder": 5
;         },
;         {
;           "label": "PANTALLA2_COLLISION",
;           "kind": "screen4_collision",
;           "rawBytes": 192,
;           "loadOrder": 30
;         },
;         {
;           "label": "PANTALLA2_EFFECTS",
;           "kind": "screen4_effects",
;           "rawBytes": 192,
;           "loadOrder": 31
;         },
;         {
;           "label": "PANTALLA2_BEHAVIOR",
;           "kind": "screen4_behavior",
;           "rawBytes": 192,
;           "loadOrder": 32
;         },
;         {
;           "label": "PANTALLA2_CELL_FLAGS",
;           "kind": "screen4_cell_flags",
;           "rawBytes": 192,
;           "loadOrder": 33
;         },
;         {
;           "label": "PANTALLA2_VISUAL_MAP",
;           "kind": "screen4_visual_map",
;           "rawBytes": 192,
;           "loadOrder": 34
;         },
;         {
;           "label": "PANTALLA2_TILE_HAZ_HIT",
;           "kind": "screen4_hazard_hitbox",
;           "rawBytes": 8,
;           "loadOrder": 35
;         }
;       ],
;       "payloadLabels": [
;         "PANTALLA2_NAMES",
;         "PANTALLA2_BANK_0_PATTERNS",
;         "PANTALLA2_BANK_0_COLORS",
;         "PANTALLA2_BANK_1_PATTERNS",
;         "PANTALLA2_BANK_1_COLORS",
;         "PANTALLA2_BANK_2_PATTERNS",
;         "PANTALLA2_BANK_2_COLORS",
;         "PANTALLA2_COLLISION",
;         "PANTALLA2_EFFECTS",
;         "PANTALLA2_BEHAVIOR",
;         "PANTALLA2_CELL_FLAGS",
;         "PANTALLA2_VISUAL_MAP",
;         "PANTALLA2_TILE_HAZ_HIT"
;       ]
;     },
;     {
;       "type": "msx2screen",
;       "id": "screen_platform_mymsxgame",
;       "name": "pantalla1",
;       "ownerWorldIds": [
;         "worldmap_1780415077651"
;       ],
;       "rawBytes": 2304,
;       "storedBytesEstimate": 2304,
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
;           "rawBytes": 384,
;           "accessPattern": "load_to_vram",
;           "decision": "ROM_RAW_TO_VRAM"
;         },
;         {
;           "name": "colors",
;           "rawBytes": 384,
;           "accessPattern": "load_to_vram",
;           "decision": "ROM_RAW_TO_VRAM"
;         },
;         {
;           "name": "runtimeLayersAndSpawns",
;           "rawBytes": 768,
;           "accessPattern": "runtime_read",
;           "decision": "ROM_RAW",
;           "placement": "world_data_bank",
;           "runtimePlacement": "ram_cache_for_collision_behavior_and_persistent_ram_for_effects"
;         }
;       ],
;       "screenLabel": "PANTALLA1",
;       "payloadParts": [
;         {
;           "label": "PANTALLA1_NAMES",
;           "kind": "screen4_names",
;           "rawBytes": 768,
;           "loadOrder": 20
;         },
;         {
;           "label": "PANTALLA1_BANK_0_PATTERNS",
;           "kind": "screen4_patterns",
;           "rawBytes": 112,
;           "loadOrder": 0
;         },
;         {
;           "label": "PANTALLA1_BANK_0_COLORS",
;           "kind": "screen4_colors",
;           "rawBytes": 112,
;           "loadOrder": 1
;         },
;         {
;           "label": "PANTALLA1_BANK_1_PATTERNS",
;           "kind": "screen4_patterns",
;           "rawBytes": 144,
;           "loadOrder": 2
;         },
;         {
;           "label": "PANTALLA1_BANK_1_COLORS",
;           "kind": "screen4_colors",
;           "rawBytes": 144,
;           "loadOrder": 3
;         },
;         {
;           "label": "PANTALLA1_BANK_2_PATTERNS",
;           "kind": "screen4_patterns",
;           "rawBytes": 128,
;           "loadOrder": 4
;         },
;         {
;           "label": "PANTALLA1_BANK_2_COLORS",
;           "kind": "screen4_colors",
;           "rawBytes": 128,
;           "loadOrder": 5
;         },
;         {
;           "label": "PANTALLA1_COLLISION",
;           "kind": "screen4_collision",
;           "rawBytes": 192,
;           "loadOrder": 30
;         },
;         {
;           "label": "PANTALLA1_EFFECTS",
;           "kind": "screen4_effects",
;           "rawBytes": 192,
;           "loadOrder": 31
;         },
;         {
;           "label": "PANTALLA1_BEHAVIOR",
;           "kind": "screen4_behavior",
;           "rawBytes": 192,
;           "loadOrder": 32
;         },
;         {
;           "label": "PANTALLA1_CELL_FLAGS",
;           "kind": "screen4_cell_flags",
;           "rawBytes": 192,
;           "loadOrder": 33
;         },
;         {
;           "label": "PANTALLA1_VISUAL_MAP",
;           "kind": "screen4_visual_map",
;           "rawBytes": 192,
;           "loadOrder": 34
;         },
;         {
;           "label": "PANTALLA1_TILE_HAZ_HIT",
;           "kind": "screen4_hazard_hitbox",
;           "rawBytes": 16,
;           "loadOrder": 35
;         }
;       ],
;       "payloadLabels": [
;         "PANTALLA1_NAMES",
;         "PANTALLA1_BANK_0_PATTERNS",
;         "PANTALLA1_BANK_0_COLORS",
;         "PANTALLA1_BANK_1_PATTERNS",
;         "PANTALLA1_BANK_1_COLORS",
;         "PANTALLA1_BANK_2_PATTERNS",
;         "PANTALLA1_BANK_2_COLORS",
;         "PANTALLA1_COLLISION",
;         "PANTALLA1_EFFECTS",
;         "PANTALLA1_BEHAVIOR",
;         "PANTALLA1_CELL_FLAGS",
;         "PANTALLA1_VISUAL_MAP",
;         "PANTALLA1_TILE_HAZ_HIT"
;       ]
;     },
;     {
;       "type": "msx2sprite",
;       "id": "msx2sprite_1779969383977",
;       "name": "player_spr",
;       "ownerWorldIds": [
;         "worldmap_1780415077651"
;       ],
;       "rawBytes": 288,
;       "storedBytesEstimate": 288,
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
;       "hardwareLayerCount": 2,
;       "emittedHardwareLayerCount": 2,
;       "worstScanlineHardwareSprites": 2,
;       "scanlineLimit": 15,
;       "overScanlineLimit": false,
;       "parts": [
;         {
;           "name": "patterns",
;           "rawBytes": 256,
;           "accessPattern": "load_to_vram",
;           "decision": "ROM_RAW_TO_VRAM"
;         },
;         {
;           "name": "lineColors",
;           "rawBytes": 32,
;           "accessPattern": "load_to_vram",
;           "decision": "ROM_RAW_TO_VRAM"
;         }
;       ]
;     },
;     {
;       "type": "msx2sprite",
;       "id": "msx2sprite_1780501897203",
;       "name": "caja (sprite)",
;       "ownerWorldIds": [
;         "worldmap_1780415077651"
;       ],
;       "rawBytes": 48,
;       "storedBytesEstimate": 48,
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
;       "scanlineLimit": 15,
;       "overScanlineLimit": false,
;       "parts": [
;         {
;           "name": "patterns",
;           "rawBytes": 32,
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
;       "id": "worldmap_1780415077651",
;       "name": "New Worldmap",
;       "rawBytes": 649,
;       "storedBytesEstimate": 649,
;       "accessPattern": "manifest_read",
;       "mutable": false,
;       "decision": "ROM_RAW",
;       "reason": "Included by the active MSX2 project slice; precise backend packing remains allocator-owned."
;     }
;   ],
;   "logicalBankBudget": {
;     "bankSizeBytes": 8192,
;     "warningThresholdBytes": 7372,
;     "totalPayloadBytes": 4905,
;     "estimatedMinimumBanks": 1,
;     "estimatedPackedBankCount": 1,
;     "estimatedPackedBanks": [
;       {
;         "bankIndex": 0,
;         "bankSizeBytes": 8192,
;         "warningThresholdBytes": 7372,
;         "usedBytes": 4905,
;         "freeBytes": 3287,
;         "usedPercent": 59.88,
;         "warning": false,
;         "overBudgetBytes": 0,
;         "status": "ok",
;         "packages": [
;           {
;             "id": "msx2screen.screen_platform_mymsxgame",
;             "usedBytes": 2304,
;             "recommendedBankClass": "world.screen"
;           },
;           {
;             "id": "msx2screen.msx2screen_1780415045987",
;             "usedBytes": 1616,
;             "recommendedBankClass": "world.screen"
;           },
;           {
;             "id": "worldmap.worldmap_1780415077651",
;             "usedBytes": 649,
;             "recommendedBankClass": "world.manifest"
;           },
;           {
;             "id": "msx2sprite.msx2sprite_1779969383977",
;             "usedBytes": 288,
;             "recommendedBankClass": "world.graphics.sprite"
;           },
;           {
;             "id": "msx2sprite.msx2sprite_1780501897203",
;             "usedBytes": 48,
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
;         "packageCount": 2,
;         "usedBytes": 3920,
;         "estimatedMinimumBanks": 1,
;         "warningPackageCount": 0,
;         "overBudgetPackageCount": 0,
;         "largestPackage": {
;           "id": "msx2screen.screen_platform_mymsxgame",
;           "usedBytes": 2304
;         }
;       },
;       {
;         "id": "world.manifest",
;         "packageCount": 1,
;         "usedBytes": 649,
;         "estimatedMinimumBanks": 1,
;         "warningPackageCount": 0,
;         "overBudgetPackageCount": 0,
;         "largestPackage": {
;           "id": "worldmap.worldmap_1780415077651",
;           "usedBytes": 649
;         }
;       },
;       {
;         "id": "world.graphics.sprite",
;         "packageCount": 2,
;         "usedBytes": 336,
;         "estimatedMinimumBanks": 1,
;         "warningPackageCount": 0,
;         "overBudgetPackageCount": 0,
;         "largestPackage": {
;           "id": "msx2sprite.msx2sprite_1779969383977",
;           "usedBytes": 288
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
;         "id": "msx2screen.msx2screen_1780415045987",
;         "type": "msx2screen",
;         "sourceId": "msx2screen_1780415045987",
;         "recommendedBankClass": "world.screen",
;         "usedBytes": 1616,
;         "freeBytesIfAlone": 6576,
;         "warning": false,
;         "overBudgetBytes": 0,
;         "canSplit": true,
;         "screenLabel": "PANTALLA2",
;         "payloadParts": [
;           {
;             "label": "PANTALLA2_NAMES",
;             "kind": "screen4_names",
;             "rawBytes": 768,
;             "loadOrder": 20
;           },
;           {
;             "label": "PANTALLA2_BANK_0_PATTERNS",
;             "kind": "screen4_patterns",
;             "rawBytes": 8,
;             "loadOrder": 0
;           },
;           {
;             "label": "PANTALLA2_BANK_0_COLORS",
;             "kind": "screen4_colors",
;             "rawBytes": 8,
;             "loadOrder": 1
;           },
;           {
;             "label": "PANTALLA2_BANK_1_PATTERNS",
;             "kind": "screen4_patterns",
;             "rawBytes": 8,
;             "loadOrder": 2
;           },
;           {
;             "label": "PANTALLA2_BANK_1_COLORS",
;             "kind": "screen4_colors",
;             "rawBytes": 8,
;             "loadOrder": 3
;           },
;           {
;             "label": "PANTALLA2_BANK_2_PATTERNS",
;             "kind": "screen4_patterns",
;             "rawBytes": 24,
;             "loadOrder": 4
;           },
;           {
;             "label": "PANTALLA2_BANK_2_COLORS",
;             "kind": "screen4_colors",
;             "rawBytes": 24,
;             "loadOrder": 5
;           },
;           {
;             "label": "PANTALLA2_COLLISION",
;             "kind": "screen4_collision",
;             "rawBytes": 192,
;             "loadOrder": 30
;           },
;           {
;             "label": "PANTALLA2_EFFECTS",
;             "kind": "screen4_effects",
;             "rawBytes": 192,
;             "loadOrder": 31
;           },
;           {
;             "label": "PANTALLA2_BEHAVIOR",
;             "kind": "screen4_behavior",
;             "rawBytes": 192,
;             "loadOrder": 32
;           },
;           {
;             "label": "PANTALLA2_CELL_FLAGS",
;             "kind": "screen4_cell_flags",
;             "rawBytes": 192,
;             "loadOrder": 33
;           },
;           {
;             "label": "PANTALLA2_VISUAL_MAP",
;             "kind": "screen4_visual_map",
;             "rawBytes": 192,
;             "loadOrder": 34
;           },
;           {
;             "label": "PANTALLA2_TILE_HAZ_HIT",
;             "kind": "screen4_hazard_hitbox",
;             "rawBytes": 8,
;             "loadOrder": 35
;           }
;         ],
;         "payloadLabels": [
;           "PANTALLA2_NAMES",
;           "PANTALLA2_BANK_0_PATTERNS",
;           "PANTALLA2_BANK_0_COLORS",
;           "PANTALLA2_BANK_1_PATTERNS",
;           "PANTALLA2_BANK_1_COLORS",
;           "PANTALLA2_BANK_2_PATTERNS",
;           "PANTALLA2_BANK_2_COLORS",
;           "PANTALLA2_COLLISION",
;           "PANTALLA2_EFFECTS",
;           "PANTALLA2_BEHAVIOR",
;           "PANTALLA2_CELL_FLAGS",
;           "PANTALLA2_VISUAL_MAP",
;           "PANTALLA2_TILE_HAZ_HIT"
;         ]
;       },
;       {
;         "id": "msx2screen.screen_platform_mymsxgame",
;         "type": "msx2screen",
;         "sourceId": "screen_platform_mymsxgame",
;         "recommendedBankClass": "world.screen",
;         "usedBytes": 2304,
;         "freeBytesIfAlone": 5888,
;         "warning": false,
;         "overBudgetBytes": 0,
;         "canSplit": true,
;         "screenLabel": "PANTALLA1",
;         "payloadParts": [
;           {
;             "label": "PANTALLA1_NAMES",
;             "kind": "screen4_names",
;             "rawBytes": 768,
;             "loadOrder": 20
;           },
;           {
;             "label": "PANTALLA1_BANK_0_PATTERNS",
;             "kind": "screen4_patterns",
;             "rawBytes": 112,
;             "loadOrder": 0
;           },
;           {
;             "label": "PANTALLA1_BANK_0_COLORS",
;             "kind": "screen4_colors",
;             "rawBytes": 112,
;             "loadOrder": 1
;           },
;           {
;             "label": "PANTALLA1_BANK_1_PATTERNS",
;             "kind": "screen4_patterns",
;             "rawBytes": 144,
;             "loadOrder": 2
;           },
;           {
;             "label": "PANTALLA1_BANK_1_COLORS",
;             "kind": "screen4_colors",
;             "rawBytes": 144,
;             "loadOrder": 3
;           },
;           {
;             "label": "PANTALLA1_BANK_2_PATTERNS",
;             "kind": "screen4_patterns",
;             "rawBytes": 128,
;             "loadOrder": 4
;           },
;           {
;             "label": "PANTALLA1_BANK_2_COLORS",
;             "kind": "screen4_colors",
;             "rawBytes": 128,
;             "loadOrder": 5
;           },
;           {
;             "label": "PANTALLA1_COLLISION",
;             "kind": "screen4_collision",
;             "rawBytes": 192,
;             "loadOrder": 30
;           },
;           {
;             "label": "PANTALLA1_EFFECTS",
;             "kind": "screen4_effects",
;             "rawBytes": 192,
;             "loadOrder": 31
;           },
;           {
;             "label": "PANTALLA1_BEHAVIOR",
;             "kind": "screen4_behavior",
;             "rawBytes": 192,
;             "loadOrder": 32
;           },
;           {
;             "label": "PANTALLA1_CELL_FLAGS",
;             "kind": "screen4_cell_flags",
;             "rawBytes": 192,
;             "loadOrder": 33
;           },
;           {
;             "label": "PANTALLA1_VISUAL_MAP",
;             "kind": "screen4_visual_map",
;             "rawBytes": 192,
;             "loadOrder": 34
;           },
;           {
;             "label": "PANTALLA1_TILE_HAZ_HIT",
;             "kind": "screen4_hazard_hitbox",
;             "rawBytes": 16,
;             "loadOrder": 35
;           }
;         ],
;         "payloadLabels": [
;           "PANTALLA1_NAMES",
;           "PANTALLA1_BANK_0_PATTERNS",
;           "PANTALLA1_BANK_0_COLORS",
;           "PANTALLA1_BANK_1_PATTERNS",
;           "PANTALLA1_BANK_1_COLORS",
;           "PANTALLA1_BANK_2_PATTERNS",
;           "PANTALLA1_BANK_2_COLORS",
;           "PANTALLA1_COLLISION",
;           "PANTALLA1_EFFECTS",
;           "PANTALLA1_BEHAVIOR",
;           "PANTALLA1_CELL_FLAGS",
;           "PANTALLA1_VISUAL_MAP",
;           "PANTALLA1_TILE_HAZ_HIT"
;         ]
;       },
;       {
;         "id": "msx2sprite.msx2sprite_1779969383977",
;         "type": "msx2sprite",
;         "sourceId": "msx2sprite_1779969383977",
;         "recommendedBankClass": "world.graphics.sprite",
;         "usedBytes": 288,
;         "freeBytesIfAlone": 7904,
;         "warning": false,
;         "overBudgetBytes": 0,
;         "canSplit": true,
;         "payloadParts": [],
;         "payloadLabels": []
;       },
;       {
;         "id": "msx2sprite.msx2sprite_1780501897203",
;         "type": "msx2sprite",
;         "sourceId": "msx2sprite_1780501897203",
;         "recommendedBankClass": "world.graphics.sprite",
;         "usedBytes": 48,
;         "freeBytesIfAlone": 8144,
;         "warning": false,
;         "overBudgetBytes": 0,
;         "canSplit": true,
;         "payloadParts": [],
;         "payloadLabels": []
;       },
;       {
;         "id": "worldmap.worldmap_1780415077651",
;         "type": "worldmap",
;         "sourceId": "worldmap_1780415077651",
;         "recommendedBankClass": "world.manifest",
;         "usedBytes": 649,
;         "freeBytesIfAlone": 7543,
;         "warning": false,
;         "overBudgetBytes": 0,
;         "canSplit": false,
;         "payloadParts": [],
;         "payloadLabels": []
;       }
;     ],
;     "splitPackages": [],
;     "splitChunkManifest": [],
;     "splitSourcePackages": [],
;     "note": "Logical pre-pack budget by asset package with first-fit-decreasing estimate. Final allocator still decides physical Konami 8K placement after compression."
;   },
;   "ramBudget": {
;     "scope": "msx2_screen4_ram_budget",
;     "start": "#C000",
;     "end": "#C644",
;     "limit": "#F300",
;     "usableBytes": 13056,
;     "usedBytes": 1604,
;     "freeBytes": 11452,
;     "warningThresholdBytes": 11097,
;     "maxPersistentScreens": 60,
;     "reachableScreens": 2,
;     "status": "ok",
;     "sections": [
;       {
;         "id": "runtime.globals_player_input",
;         "start": "#C000",
;         "end": "#C047",
;         "bytes": 71,
;         "mutable": true,
;         "reason": "Fixed hot runtime state for player/input/global counters."
;       },
;       {
;         "id": "runtime.snake_body_cache",
;         "start": "#C047",
;         "end": "#C08C",
;         "bytes": 69,
;         "mutable": true,
;         "reason": "Fixed-size cache reserved only for snake-char body state."
;       },
;       {
;         "id": "runtime.persistent_effect_layers",
;         "start": "#C08C",
;         "end": "#C20C",
;         "bytes": 384,
;         "mutable": true,
;         "count": 2,
;         "bytesPerScreen": 192,
;         "reason": "One mutable effects layer per reachable SCREEN 4 room."
;       },
;       {
;         "id": "runtime.effects_scratch",
;         "start": "#C210",
;         "end": "#C2D0",
;         "bytes": 192,
;         "mutable": true,
;         "reason": "Temporary effect layer buffer for screens without persistent slot or loaders."
;       },
;       {
;         "id": "runtime.collision_current_cache",
;         "start": "#C2D0",
;         "end": "#C390",
;         "bytes": 192,
;         "mutable": true,
;         "reason": "Hot cache for the current SCREEN 4 collision layer copied from ROM data banks."
;       },
;       {
;         "id": "runtime.behavior_current_cache",
;         "start": "#C390",
;         "end": "#C450",
;         "bytes": 192,
;         "mutable": true,
;         "reason": "Hot cache for the current SCREEN 4 behavior layer copied from ROM data banks."
;       },
;       {
;         "id": "runtime.cell_flags_current_cache",
;         "start": "#C450",
;         "end": "#C510",
;         "bytes": 192,
;         "mutable": true,
;         "reason": "Packed current SCREEN 4 solid/effect/behavior flags, staged for the unified runtime layer contract."
;       },
;       {
;         "id": "runtime.visual_map_cache",
;         "start": "#C510",
;         "end": "#C5D0",
;         "bytes": 192,
;         "mutable": true,
;         "reason": "Current SCREEN 4 visual tile index map used for per-tile hazard hitbox lookup."
;       },
;       {
;         "id": "runtime.hazard_hitbox_cache",
;         "start": "#C5D0",
;         "end": "#C6D0",
;         "bytes": 256,
;         "mutable": true,
;         "reason": "Current SCREEN 4 per-tile hazard hitbox table (ox, oy, w, h bytes)."
;       },
;       {
;         "id": "runtime.enemy_pool",
;         "start": "#C6E0",
;         "end": "#C734",
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
;   "includedComponents": [
;     "msx2_player_control",
;     "msx2_push_box"
;   ],
;   "includedMovementProfiles": [],
;   "includedAttackProfiles": [],
;   "includedStateMachines": [],
;   "estimatedRamNeeds": {
;     "start": "#C000",
;     "end": "#C644",
;     "limit": "#F300",
;     "usedBytes": 1604,
;     "freeBytes": 11452,
;     "persistentEffectBytes": 384,
;     "enemyRuntimeBytes": 84,
;     "ramBudgetStatus": "ok"
;   },
;   "estimatedRomNeeds": {
;     "reachableMsx2ScreenCount": 2,
;     "reachableMsx2SpriteCount": 2,
;     "reachableWorldCount": 1,
;     "usesKonamiDataBank": true,
;     "romPayloadBytesEstimate": 4905,
;     "estimated8kBanksForPayload": 1,
;     "warningThresholdBytesPerBank": 7372,
;     "note": "Slice reports reachability and storage policy estimates; final bank placement remains allocator-owned."
;   },
;   "screen4DataBankPlan": {
;     "supported": true,
;     "bankCount": 1,
;     "dataWindowAddress": "#8000",
;     "unsupportedReason": null,
;     "splitChunkCount": 0,
;     "splitChunkManifest": [],
;     "screenBanks": [
;       {
;         "label": "PANTALLA1",
;         "packageId": "msx2screen.screen_platform_mymsxgame",
;         "bankIndex": 0,
;         "physicalBank": 4
;       },
;       {
;         "label": "PANTALLA2",
;         "packageId": "msx2screen.msx2screen_1780415045987",
;         "bankIndex": 0,
;         "physicalBank": 4
;       }
;     ]
;   }
; }
;
; [[[MIDEAS_ARTIFACT:project_slice.json:END]]]

; [[[MIDEAS_ARTIFACT:asset_storage_policy.json:BEGIN]]]
; [
;   {
;     "type": "msx2player",
;     "id": "msx2player_1780388067666",
;     "name": "Player_Main",
;     "ownerWorldIds": [
;       "worldmap_1780415077651"
;     ],
;     "rawBytes": 0,
;     "storedBytesEstimate": 0,
;     "accessPattern": "compile_time_player_definition",
;     "mutable": false,
;     "decision": "COMPILED_INTO_RUNTIME_CONSTANTS",
;     "reason": "MSX2 Player editor documents are compile-time configuration only; runtime sprites and maps are budgeted as their referenced assets."
;   },
;   {
;     "type": "msx2screen_tile",
;     "id": "screen_platform_mymsxgame_tile_0",
;     "name": "Blank",
;     "ownerScreenId": "screen_platform_mymsxgame",
;     "ownerWorldIds": [
;       "worldmap_1780415077651"
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
;     "id": "screen_platform_mymsxgame_tile_1",
;     "name": "Solid",
;     "ownerScreenId": "screen_platform_mymsxgame",
;     "ownerWorldIds": [
;       "worldmap_1780415077651"
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
;     "id": "tile_1780001908330",
;     "name": "caja",
;     "ownerScreenId": "screen_platform_mymsxgame",
;     "ownerWorldIds": [
;       "worldmap_1780415077651"
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
;     "id": "tile_1780093534882",
;     "name": "pinchos",
;     "ownerScreenId": "screen_platform_mymsxgame",
;     "ownerWorldIds": [
;       "worldmap_1780415077651"
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
;     "id": "tile_1780415045987_0",
;     "name": "Blank",
;     "ownerScreenId": "msx2screen_1780415045987",
;     "ownerWorldIds": [
;       "worldmap_1780415077651"
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
;     "id": "tile_1780415045987_1",
;     "name": "Platform",
;     "ownerScreenId": "msx2screen_1780415045987",
;     "ownerWorldIds": [
;       "worldmap_1780415077651"
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
;     "id": "msx2screen_1780415045987",
;     "name": "pantalla2",
;     "ownerWorldIds": [
;       "worldmap_1780415077651"
;     ],
;     "rawBytes": 1616,
;     "storedBytesEstimate": 1616,
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
;         "rawBytes": 40,
;         "accessPattern": "load_to_vram",
;         "decision": "ROM_RAW_TO_VRAM"
;       },
;       {
;         "name": "colors",
;         "rawBytes": 40,
;         "accessPattern": "load_to_vram",
;         "decision": "ROM_RAW_TO_VRAM"
;       },
;       {
;         "name": "runtimeLayersAndSpawns",
;         "rawBytes": 768,
;         "accessPattern": "runtime_read",
;         "decision": "ROM_RAW",
;         "placement": "world_data_bank",
;         "runtimePlacement": "ram_cache_for_collision_behavior_and_persistent_ram_for_effects"
;       }
;     ],
;     "screenLabel": "PANTALLA2",
;     "payloadParts": [
;       {
;         "label": "PANTALLA2_NAMES",
;         "kind": "screen4_names",
;         "rawBytes": 768,
;         "loadOrder": 20
;       },
;       {
;         "label": "PANTALLA2_BANK_0_PATTERNS",
;         "kind": "screen4_patterns",
;         "rawBytes": 8,
;         "loadOrder": 0
;       },
;       {
;         "label": "PANTALLA2_BANK_0_COLORS",
;         "kind": "screen4_colors",
;         "rawBytes": 8,
;         "loadOrder": 1
;       },
;       {
;         "label": "PANTALLA2_BANK_1_PATTERNS",
;         "kind": "screen4_patterns",
;         "rawBytes": 8,
;         "loadOrder": 2
;       },
;       {
;         "label": "PANTALLA2_BANK_1_COLORS",
;         "kind": "screen4_colors",
;         "rawBytes": 8,
;         "loadOrder": 3
;       },
;       {
;         "label": "PANTALLA2_BANK_2_PATTERNS",
;         "kind": "screen4_patterns",
;         "rawBytes": 24,
;         "loadOrder": 4
;       },
;       {
;         "label": "PANTALLA2_BANK_2_COLORS",
;         "kind": "screen4_colors",
;         "rawBytes": 24,
;         "loadOrder": 5
;       },
;       {
;         "label": "PANTALLA2_COLLISION",
;         "kind": "screen4_collision",
;         "rawBytes": 192,
;         "loadOrder": 30
;       },
;       {
;         "label": "PANTALLA2_EFFECTS",
;         "kind": "screen4_effects",
;         "rawBytes": 192,
;         "loadOrder": 31
;       },
;       {
;         "label": "PANTALLA2_BEHAVIOR",
;         "kind": "screen4_behavior",
;         "rawBytes": 192,
;         "loadOrder": 32
;       },
;       {
;         "label": "PANTALLA2_CELL_FLAGS",
;         "kind": "screen4_cell_flags",
;         "rawBytes": 192,
;         "loadOrder": 33
;       },
;       {
;         "label": "PANTALLA2_VISUAL_MAP",
;         "kind": "screen4_visual_map",
;         "rawBytes": 192,
;         "loadOrder": 34
;       },
;       {
;         "label": "PANTALLA2_TILE_HAZ_HIT",
;         "kind": "screen4_hazard_hitbox",
;         "rawBytes": 8,
;         "loadOrder": 35
;       }
;     ],
;     "payloadLabels": [
;       "PANTALLA2_NAMES",
;       "PANTALLA2_BANK_0_PATTERNS",
;       "PANTALLA2_BANK_0_COLORS",
;       "PANTALLA2_BANK_1_PATTERNS",
;       "PANTALLA2_BANK_1_COLORS",
;       "PANTALLA2_BANK_2_PATTERNS",
;       "PANTALLA2_BANK_2_COLORS",
;       "PANTALLA2_COLLISION",
;       "PANTALLA2_EFFECTS",
;       "PANTALLA2_BEHAVIOR",
;       "PANTALLA2_CELL_FLAGS",
;       "PANTALLA2_VISUAL_MAP",
;       "PANTALLA2_TILE_HAZ_HIT"
;     ]
;   },
;   {
;     "type": "msx2screen",
;     "id": "screen_platform_mymsxgame",
;     "name": "pantalla1",
;     "ownerWorldIds": [
;       "worldmap_1780415077651"
;     ],
;     "rawBytes": 2304,
;     "storedBytesEstimate": 2304,
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
;         "rawBytes": 384,
;         "accessPattern": "load_to_vram",
;         "decision": "ROM_RAW_TO_VRAM"
;       },
;       {
;         "name": "colors",
;         "rawBytes": 384,
;         "accessPattern": "load_to_vram",
;         "decision": "ROM_RAW_TO_VRAM"
;       },
;       {
;         "name": "runtimeLayersAndSpawns",
;         "rawBytes": 768,
;         "accessPattern": "runtime_read",
;         "decision": "ROM_RAW",
;         "placement": "world_data_bank",
;         "runtimePlacement": "ram_cache_for_collision_behavior_and_persistent_ram_for_effects"
;       }
;     ],
;     "screenLabel": "PANTALLA1",
;     "payloadParts": [
;       {
;         "label": "PANTALLA1_NAMES",
;         "kind": "screen4_names",
;         "rawBytes": 768,
;         "loadOrder": 20
;       },
;       {
;         "label": "PANTALLA1_BANK_0_PATTERNS",
;         "kind": "screen4_patterns",
;         "rawBytes": 112,
;         "loadOrder": 0
;       },
;       {
;         "label": "PANTALLA1_BANK_0_COLORS",
;         "kind": "screen4_colors",
;         "rawBytes": 112,
;         "loadOrder": 1
;       },
;       {
;         "label": "PANTALLA1_BANK_1_PATTERNS",
;         "kind": "screen4_patterns",
;         "rawBytes": 144,
;         "loadOrder": 2
;       },
;       {
;         "label": "PANTALLA1_BANK_1_COLORS",
;         "kind": "screen4_colors",
;         "rawBytes": 144,
;         "loadOrder": 3
;       },
;       {
;         "label": "PANTALLA1_BANK_2_PATTERNS",
;         "kind": "screen4_patterns",
;         "rawBytes": 128,
;         "loadOrder": 4
;       },
;       {
;         "label": "PANTALLA1_BANK_2_COLORS",
;         "kind": "screen4_colors",
;         "rawBytes": 128,
;         "loadOrder": 5
;       },
;       {
;         "label": "PANTALLA1_COLLISION",
;         "kind": "screen4_collision",
;         "rawBytes": 192,
;         "loadOrder": 30
;       },
;       {
;         "label": "PANTALLA1_EFFECTS",
;         "kind": "screen4_effects",
;         "rawBytes": 192,
;         "loadOrder": 31
;       },
;       {
;         "label": "PANTALLA1_BEHAVIOR",
;         "kind": "screen4_behavior",
;         "rawBytes": 192,
;         "loadOrder": 32
;       },
;       {
;         "label": "PANTALLA1_CELL_FLAGS",
;         "kind": "screen4_cell_flags",
;         "rawBytes": 192,
;         "loadOrder": 33
;       },
;       {
;         "label": "PANTALLA1_VISUAL_MAP",
;         "kind": "screen4_visual_map",
;         "rawBytes": 192,
;         "loadOrder": 34
;       },
;       {
;         "label": "PANTALLA1_TILE_HAZ_HIT",
;         "kind": "screen4_hazard_hitbox",
;         "rawBytes": 16,
;         "loadOrder": 35
;       }
;     ],
;     "payloadLabels": [
;       "PANTALLA1_NAMES",
;       "PANTALLA1_BANK_0_PATTERNS",
;       "PANTALLA1_BANK_0_COLORS",
;       "PANTALLA1_BANK_1_PATTERNS",
;       "PANTALLA1_BANK_1_COLORS",
;       "PANTALLA1_BANK_2_PATTERNS",
;       "PANTALLA1_BANK_2_COLORS",
;       "PANTALLA1_COLLISION",
;       "PANTALLA1_EFFECTS",
;       "PANTALLA1_BEHAVIOR",
;       "PANTALLA1_CELL_FLAGS",
;       "PANTALLA1_VISUAL_MAP",
;       "PANTALLA1_TILE_HAZ_HIT"
;     ]
;   },
;   {
;     "type": "msx2sprite",
;     "id": "msx2sprite_1779969383977",
;     "name": "player_spr",
;     "ownerWorldIds": [
;       "worldmap_1780415077651"
;     ],
;     "rawBytes": 288,
;     "storedBytesEstimate": 288,
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
;     "hardwareLayerCount": 2,
;     "emittedHardwareLayerCount": 2,
;     "worstScanlineHardwareSprites": 2,
;     "scanlineLimit": 15,
;     "overScanlineLimit": false,
;     "parts": [
;       {
;         "name": "patterns",
;         "rawBytes": 256,
;         "accessPattern": "load_to_vram",
;         "decision": "ROM_RAW_TO_VRAM"
;       },
;       {
;         "name": "lineColors",
;         "rawBytes": 32,
;         "accessPattern": "load_to_vram",
;         "decision": "ROM_RAW_TO_VRAM"
;       }
;     ]
;   },
;   {
;     "type": "msx2sprite",
;     "id": "msx2sprite_1780501897203",
;     "name": "caja (sprite)",
;     "ownerWorldIds": [
;       "worldmap_1780415077651"
;     ],
;     "rawBytes": 48,
;     "storedBytesEstimate": 48,
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
;     "scanlineLimit": 15,
;     "overScanlineLimit": false,
;     "parts": [
;       {
;         "name": "patterns",
;         "rawBytes": 32,
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
;     "id": "worldmap_1780415077651",
;     "name": "New Worldmap",
;     "rawBytes": 649,
;     "storedBytesEstimate": 649,
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
;   "totalPayloadBytes": 4905,
;   "estimatedMinimumBanks": 1,
;   "estimatedPackedBankCount": 1,
;   "estimatedPackedBanks": [
;     {
;       "bankIndex": 0,
;       "bankSizeBytes": 8192,
;       "warningThresholdBytes": 7372,
;       "usedBytes": 4905,
;       "freeBytes": 3287,
;       "usedPercent": 59.88,
;       "warning": false,
;       "overBudgetBytes": 0,
;       "status": "ok",
;       "packages": [
;         {
;           "id": "msx2screen.screen_platform_mymsxgame",
;           "usedBytes": 2304,
;           "recommendedBankClass": "world.screen"
;         },
;         {
;           "id": "msx2screen.msx2screen_1780415045987",
;           "usedBytes": 1616,
;           "recommendedBankClass": "world.screen"
;         },
;         {
;           "id": "worldmap.worldmap_1780415077651",
;           "usedBytes": 649,
;           "recommendedBankClass": "world.manifest"
;         },
;         {
;           "id": "msx2sprite.msx2sprite_1779969383977",
;           "usedBytes": 288,
;           "recommendedBankClass": "world.graphics.sprite"
;         },
;         {
;           "id": "msx2sprite.msx2sprite_1780501897203",
;           "usedBytes": 48,
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
;       "packageCount": 2,
;       "usedBytes": 3920,
;       "estimatedMinimumBanks": 1,
;       "warningPackageCount": 0,
;       "overBudgetPackageCount": 0,
;       "largestPackage": {
;         "id": "msx2screen.screen_platform_mymsxgame",
;         "usedBytes": 2304
;       }
;     },
;     {
;       "id": "world.manifest",
;       "packageCount": 1,
;       "usedBytes": 649,
;       "estimatedMinimumBanks": 1,
;       "warningPackageCount": 0,
;       "overBudgetPackageCount": 0,
;       "largestPackage": {
;         "id": "worldmap.worldmap_1780415077651",
;         "usedBytes": 649
;       }
;     },
;     {
;       "id": "world.graphics.sprite",
;       "packageCount": 2,
;       "usedBytes": 336,
;       "estimatedMinimumBanks": 1,
;       "warningPackageCount": 0,
;       "overBudgetPackageCount": 0,
;       "largestPackage": {
;         "id": "msx2sprite.msx2sprite_1779969383977",
;         "usedBytes": 288
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
;       "id": "msx2screen.msx2screen_1780415045987",
;       "type": "msx2screen",
;       "sourceId": "msx2screen_1780415045987",
;       "recommendedBankClass": "world.screen",
;       "usedBytes": 1616,
;       "freeBytesIfAlone": 6576,
;       "warning": false,
;       "overBudgetBytes": 0,
;       "canSplit": true,
;       "screenLabel": "PANTALLA2",
;       "payloadParts": [
;         {
;           "label": "PANTALLA2_NAMES",
;           "kind": "screen4_names",
;           "rawBytes": 768,
;           "loadOrder": 20
;         },
;         {
;           "label": "PANTALLA2_BANK_0_PATTERNS",
;           "kind": "screen4_patterns",
;           "rawBytes": 8,
;           "loadOrder": 0
;         },
;         {
;           "label": "PANTALLA2_BANK_0_COLORS",
;           "kind": "screen4_colors",
;           "rawBytes": 8,
;           "loadOrder": 1
;         },
;         {
;           "label": "PANTALLA2_BANK_1_PATTERNS",
;           "kind": "screen4_patterns",
;           "rawBytes": 8,
;           "loadOrder": 2
;         },
;         {
;           "label": "PANTALLA2_BANK_1_COLORS",
;           "kind": "screen4_colors",
;           "rawBytes": 8,
;           "loadOrder": 3
;         },
;         {
;           "label": "PANTALLA2_BANK_2_PATTERNS",
;           "kind": "screen4_patterns",
;           "rawBytes": 24,
;           "loadOrder": 4
;         },
;         {
;           "label": "PANTALLA2_BANK_2_COLORS",
;           "kind": "screen4_colors",
;           "rawBytes": 24,
;           "loadOrder": 5
;         },
;         {
;           "label": "PANTALLA2_COLLISION",
;           "kind": "screen4_collision",
;           "rawBytes": 192,
;           "loadOrder": 30
;         },
;         {
;           "label": "PANTALLA2_EFFECTS",
;           "kind": "screen4_effects",
;           "rawBytes": 192,
;           "loadOrder": 31
;         },
;         {
;           "label": "PANTALLA2_BEHAVIOR",
;           "kind": "screen4_behavior",
;           "rawBytes": 192,
;           "loadOrder": 32
;         },
;         {
;           "label": "PANTALLA2_CELL_FLAGS",
;           "kind": "screen4_cell_flags",
;           "rawBytes": 192,
;           "loadOrder": 33
;         },
;         {
;           "label": "PANTALLA2_VISUAL_MAP",
;           "kind": "screen4_visual_map",
;           "rawBytes": 192,
;           "loadOrder": 34
;         },
;         {
;           "label": "PANTALLA2_TILE_HAZ_HIT",
;           "kind": "screen4_hazard_hitbox",
;           "rawBytes": 8,
;           "loadOrder": 35
;         }
;       ],
;       "payloadLabels": [
;         "PANTALLA2_NAMES",
;         "PANTALLA2_BANK_0_PATTERNS",
;         "PANTALLA2_BANK_0_COLORS",
;         "PANTALLA2_BANK_1_PATTERNS",
;         "PANTALLA2_BANK_1_COLORS",
;         "PANTALLA2_BANK_2_PATTERNS",
;         "PANTALLA2_BANK_2_COLORS",
;         "PANTALLA2_COLLISION",
;         "PANTALLA2_EFFECTS",
;         "PANTALLA2_BEHAVIOR",
;         "PANTALLA2_CELL_FLAGS",
;         "PANTALLA2_VISUAL_MAP",
;         "PANTALLA2_TILE_HAZ_HIT"
;       ]
;     },
;     {
;       "id": "msx2screen.screen_platform_mymsxgame",
;       "type": "msx2screen",
;       "sourceId": "screen_platform_mymsxgame",
;       "recommendedBankClass": "world.screen",
;       "usedBytes": 2304,
;       "freeBytesIfAlone": 5888,
;       "warning": false,
;       "overBudgetBytes": 0,
;       "canSplit": true,
;       "screenLabel": "PANTALLA1",
;       "payloadParts": [
;         {
;           "label": "PANTALLA1_NAMES",
;           "kind": "screen4_names",
;           "rawBytes": 768,
;           "loadOrder": 20
;         },
;         {
;           "label": "PANTALLA1_BANK_0_PATTERNS",
;           "kind": "screen4_patterns",
;           "rawBytes": 112,
;           "loadOrder": 0
;         },
;         {
;           "label": "PANTALLA1_BANK_0_COLORS",
;           "kind": "screen4_colors",
;           "rawBytes": 112,
;           "loadOrder": 1
;         },
;         {
;           "label": "PANTALLA1_BANK_1_PATTERNS",
;           "kind": "screen4_patterns",
;           "rawBytes": 144,
;           "loadOrder": 2
;         },
;         {
;           "label": "PANTALLA1_BANK_1_COLORS",
;           "kind": "screen4_colors",
;           "rawBytes": 144,
;           "loadOrder": 3
;         },
;         {
;           "label": "PANTALLA1_BANK_2_PATTERNS",
;           "kind": "screen4_patterns",
;           "rawBytes": 128,
;           "loadOrder": 4
;         },
;         {
;           "label": "PANTALLA1_BANK_2_COLORS",
;           "kind": "screen4_colors",
;           "rawBytes": 128,
;           "loadOrder": 5
;         },
;         {
;           "label": "PANTALLA1_COLLISION",
;           "kind": "screen4_collision",
;           "rawBytes": 192,
;           "loadOrder": 30
;         },
;         {
;           "label": "PANTALLA1_EFFECTS",
;           "kind": "screen4_effects",
;           "rawBytes": 192,
;           "loadOrder": 31
;         },
;         {
;           "label": "PANTALLA1_BEHAVIOR",
;           "kind": "screen4_behavior",
;           "rawBytes": 192,
;           "loadOrder": 32
;         },
;         {
;           "label": "PANTALLA1_CELL_FLAGS",
;           "kind": "screen4_cell_flags",
;           "rawBytes": 192,
;           "loadOrder": 33
;         },
;         {
;           "label": "PANTALLA1_VISUAL_MAP",
;           "kind": "screen4_visual_map",
;           "rawBytes": 192,
;           "loadOrder": 34
;         },
;         {
;           "label": "PANTALLA1_TILE_HAZ_HIT",
;           "kind": "screen4_hazard_hitbox",
;           "rawBytes": 16,
;           "loadOrder": 35
;         }
;       ],
;       "payloadLabels": [
;         "PANTALLA1_NAMES",
;         "PANTALLA1_BANK_0_PATTERNS",
;         "PANTALLA1_BANK_0_COLORS",
;         "PANTALLA1_BANK_1_PATTERNS",
;         "PANTALLA1_BANK_1_COLORS",
;         "PANTALLA1_BANK_2_PATTERNS",
;         "PANTALLA1_BANK_2_COLORS",
;         "PANTALLA1_COLLISION",
;         "PANTALLA1_EFFECTS",
;         "PANTALLA1_BEHAVIOR",
;         "PANTALLA1_CELL_FLAGS",
;         "PANTALLA1_VISUAL_MAP",
;         "PANTALLA1_TILE_HAZ_HIT"
;       ]
;     },
;     {
;       "id": "msx2sprite.msx2sprite_1779969383977",
;       "type": "msx2sprite",
;       "sourceId": "msx2sprite_1779969383977",
;       "recommendedBankClass": "world.graphics.sprite",
;       "usedBytes": 288,
;       "freeBytesIfAlone": 7904,
;       "warning": false,
;       "overBudgetBytes": 0,
;       "canSplit": true,
;       "payloadParts": [],
;       "payloadLabels": []
;     },
;     {
;       "id": "msx2sprite.msx2sprite_1780501897203",
;       "type": "msx2sprite",
;       "sourceId": "msx2sprite_1780501897203",
;       "recommendedBankClass": "world.graphics.sprite",
;       "usedBytes": 48,
;       "freeBytesIfAlone": 8144,
;       "warning": false,
;       "overBudgetBytes": 0,
;       "canSplit": true,
;       "payloadParts": [],
;       "payloadLabels": []
;     },
;     {
;       "id": "worldmap.worldmap_1780415077651",
;       "type": "worldmap",
;       "sourceId": "worldmap_1780415077651",
;       "recommendedBankClass": "world.manifest",
;       "usedBytes": 649,
;       "freeBytesIfAlone": 7543,
;       "warning": false,
;       "overBudgetBytes": 0,
;       "canSplit": false,
;       "payloadParts": [],
;       "payloadLabels": []
;     }
;   ],
;   "splitPackages": [],
;   "splitChunkManifest": [],
;   "splitSourcePackages": [],
;   "note": "Logical pre-pack budget by asset package with first-fit-decreasing estimate. Final allocator still decides physical Konami 8K placement after compression."
; }
;
; [[[MIDEAS_ARTIFACT:logical_bank_budget.json:END]]]

; [[[MIDEAS_ARTIFACT:msx2_world_bank_manifest.json:BEGIN]]]
; {
;   "scope": "msx2_screen4_world_bank_manifest",
;   "mapper": "konami",
;   "bankSizeBytes": 8192,
;   "dataWindowAddress": "#8000",
;   "estimatedPhysicalBanks": [
;     {
;       "bankIndex": 0,
;       "windowAddress": "#8000",
;       "bankSizeBytes": 8192,
;       "warningThresholdBytes": 7372,
;       "usedBytes": 4905,
;       "freeBytes": 3287,
;       "usedPercent": 59.88,
;       "warning": false,
;       "overBudgetBytes": 0,
;       "status": "ok",
;       "packages": [
;         {
;           "id": "msx2screen.screen_platform_mymsxgame",
;           "usedBytes": 2304,
;           "recommendedBankClass": "world.screen"
;         },
;         {
;           "id": "msx2screen.msx2screen_1780415045987",
;           "usedBytes": 1616,
;           "recommendedBankClass": "world.screen"
;         },
;         {
;           "id": "worldmap.worldmap_1780415077651",
;           "usedBytes": 649,
;           "recommendedBankClass": "world.manifest"
;         },
;         {
;           "id": "msx2sprite.msx2sprite_1779969383977",
;           "usedBytes": 288,
;           "recommendedBankClass": "world.graphics.sprite"
;         },
;         {
;           "id": "msx2sprite.msx2sprite_1780501897203",
;           "usedBytes": 48,
;           "recommendedBankClass": "world.graphics.sprite"
;         }
;       ]
;     }
;   ],
;   "worlds": [
;     {
;       "worldId": "worldmap_1780415077651",
;       "estimatedBytes": 4905,
;       "estimated8kBanks": 1,
;       "packages": [
;         {
;           "packageId": "msx2screen.msx2screen_1780415045987",
;           "type": "msx2screen",
;           "sourceId": "msx2screen_1780415045987",
;           "logicalSection": "world screens",
;           "recommendedBankClass": "world.screen",
;           "physicalBankIndex": 0,
;           "windowAddress": "#8000",
;           "bankSizeBytes": 8192,
;           "rawBytes": 1616,
;           "storedBytes": 1616,
;           "decision": "MIXED_ROM_ZX0_CANDIDATE_TO_VRAM_AND_ROM_RAW",
;           "placementReason": "Estimated first-fit-decreasing placement before final compression and allocator pass."
;         },
;         {
;           "packageId": "msx2screen.screen_platform_mymsxgame",
;           "type": "msx2screen",
;           "sourceId": "screen_platform_mymsxgame",
;           "logicalSection": "world screens",
;           "recommendedBankClass": "world.screen",
;           "physicalBankIndex": 0,
;           "windowAddress": "#8000",
;           "bankSizeBytes": 8192,
;           "rawBytes": 2304,
;           "storedBytes": 2304,
;           "decision": "MIXED_ROM_ZX0_CANDIDATE_TO_VRAM_AND_ROM_RAW",
;           "placementReason": "Estimated first-fit-decreasing placement before final compression and allocator pass."
;         },
;         {
;           "packageId": "msx2sprite.msx2sprite_1779969383977",
;           "type": "msx2sprite",
;           "sourceId": "msx2sprite_1779969383977",
;           "logicalSection": "world graphics",
;           "recommendedBankClass": "world.graphics.sprite",
;           "physicalBankIndex": 0,
;           "windowAddress": "#8000",
;           "bankSizeBytes": 8192,
;           "rawBytes": 288,
;           "storedBytes": 288,
;           "decision": "ROM_RAW_TO_VRAM",
;           "placementReason": "Estimated first-fit-decreasing placement before final compression and allocator pass."
;         },
;         {
;           "packageId": "msx2sprite.msx2sprite_1780501897203",
;           "type": "msx2sprite",
;           "sourceId": "msx2sprite_1780501897203",
;           "logicalSection": "world graphics",
;           "recommendedBankClass": "world.graphics.sprite",
;           "physicalBankIndex": 0,
;           "windowAddress": "#8000",
;           "bankSizeBytes": 8192,
;           "rawBytes": 48,
;           "storedBytes": 48,
;           "decision": "ROM_RAW_TO_VRAM",
;           "placementReason": "Estimated first-fit-decreasing placement before final compression and allocator pass."
;         },
;         {
;           "packageId": "worldmap.worldmap_1780415077651",
;           "type": "worldmap",
;           "sourceId": "worldmap_1780415077651",
;           "logicalSection": "world manifest",
;           "recommendedBankClass": "world.manifest",
;           "physicalBankIndex": 0,
;           "windowAddress": "#8000",
;           "bankSizeBytes": 8192,
;           "rawBytes": 649,
;           "storedBytes": 649,
;           "decision": "ROM_RAW",
;           "placementReason": "Estimated first-fit-decreasing placement before final compression and allocator pass."
;         }
;       ]
;     }
;   ],
;   "note": "Pre-allocator World Bank Pack manifest. Physical banks are estimates from logical_bank_budget.json and may change after compression."
; }
;
; [[[MIDEAS_ARTIFACT:msx2_world_bank_manifest.json:END]]]

; [[[MIDEAS_ARTIFACT:ram_budget.json:BEGIN]]]
; {
;   "scope": "msx2_screen4_ram_budget",
;   "start": "#C000",
;   "end": "#C644",
;   "limit": "#F300",
;   "usableBytes": 13056,
;   "usedBytes": 1604,
;   "freeBytes": 11452,
;   "warningThresholdBytes": 11097,
;   "maxPersistentScreens": 60,
;   "reachableScreens": 2,
;   "status": "ok",
;   "sections": [
;     {
;       "id": "runtime.globals_player_input",
;       "start": "#C000",
;       "end": "#C047",
;       "bytes": 71,
;       "mutable": true,
;       "reason": "Fixed hot runtime state for player/input/global counters."
;     },
;     {
;       "id": "runtime.snake_body_cache",
;       "start": "#C047",
;       "end": "#C08C",
;       "bytes": 69,
;       "mutable": true,
;       "reason": "Fixed-size cache reserved only for snake-char body state."
;     },
;     {
;       "id": "runtime.persistent_effect_layers",
;       "start": "#C08C",
;       "end": "#C20C",
;       "bytes": 384,
;       "mutable": true,
;       "count": 2,
;       "bytesPerScreen": 192,
;       "reason": "One mutable effects layer per reachable SCREEN 4 room."
;     },
;     {
;       "id": "runtime.effects_scratch",
;       "start": "#C210",
;       "end": "#C2D0",
;       "bytes": 192,
;       "mutable": true,
;       "reason": "Temporary effect layer buffer for screens without persistent slot or loaders."
;     },
;     {
;       "id": "runtime.collision_current_cache",
;       "start": "#C2D0",
;       "end": "#C390",
;       "bytes": 192,
;       "mutable": true,
;       "reason": "Hot cache for the current SCREEN 4 collision layer copied from ROM data banks."
;     },
;     {
;       "id": "runtime.behavior_current_cache",
;       "start": "#C390",
;       "end": "#C450",
;       "bytes": 192,
;       "mutable": true,
;       "reason": "Hot cache for the current SCREEN 4 behavior layer copied from ROM data banks."
;     },
;     {
;       "id": "runtime.cell_flags_current_cache",
;       "start": "#C450",
;       "end": "#C510",
;       "bytes": 192,
;       "mutable": true,
;       "reason": "Packed current SCREEN 4 solid/effect/behavior flags, staged for the unified runtime layer contract."
;     },
;     {
;       "id": "runtime.visual_map_cache",
;       "start": "#C510",
;       "end": "#C5D0",
;       "bytes": 192,
;       "mutable": true,
;       "reason": "Current SCREEN 4 visual tile index map used for per-tile hazard hitbox lookup."
;     },
;     {
;       "id": "runtime.hazard_hitbox_cache",
;       "start": "#C5D0",
;       "end": "#C6D0",
;       "bytes": 256,
;       "mutable": true,
;       "reason": "Current SCREEN 4 per-tile hazard hitbox table (ox, oy, w, h bytes)."
;     },
;     {
;       "id": "runtime.enemy_pool",
;       "start": "#C6E0",
;       "end": "#C734",
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
KILBUF  EQU #0156
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
MSX2_CELL_SOLID_MASK EQU #01
MSX2_CELL_EFFECT_MASK EQU #06
MSX2_CELL_BEHAVIOR_MASK EQU #38
MSX2_CELL_ZONE_MASK EQU #C0
MSX2_CELL_BEHAVIOR_LADDER EQU #01
MSX2_CELL_BEHAVIOR_CONVEYOR_RIGHT EQU #02
MSX2_CELL_BEHAVIOR_CONVEYOR_LEFT EQU #03
MSX2_CELL_BEHAVIOR_ROPE EQU #04
MSX2_CELL_BEHAVIOR_BOX EQU #05
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
msx2_player_coyote_timer EQU #C077
msx2_player_jump_buffer_timer EQU #C078
msx2_wall_slide_side EQU #C079
msx2_wall_jump_lock_timer EQU #C07A
msx2_wall_jump_lock_vx EQU #C07B
msx2_wall_jump_key_lock EQU #C07C
msx2_player_gravity_vel EQU #C008
msx2_player_flags EQU #C00A
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
msx2_player_walking_flag EQU #C01C
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
msx2_enemy_bullet_1_active EQU #C040
msx2_enemy_bullet_1_x EQU #C041
msx2_enemy_bullet_1_y EQU #C042
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
msx2_box2_count EQU #C047
msx2_box2_try_dx EQU #C048
msx2_box2_try_dy EQU #C049
msx2_box2_draw_char EQU #C04A
msx2_box2_active EQU #C04B
msx2_box2_moving_slot EQU #C04C
msx2_box2_speed_scratch EQU #C04D
msx2_box2_move_mode EQU #C04E
msx2_box2_runtime_x EQU #C04F
msx2_box2_runtime_y EQU #C057
msx2_box2_runtime_target_x EQU #C05F
msx2_box2_runtime_target_y EQU #C067
msx2_box2_runtime_moving EQU #C06F
msx2_box2_runtime_end EQU #C077
MSX2_MAX_BOX2_PER_SCREEN EQU 8
msx2_attack_timer EQU #C03C
msx2_attack_seed EQU #C03D
msx2_attack_cursor EQU #C03E
msx2_attack_pending EQU #C03F
msx2_bg_scroll_frame EQU #C03D
msx2_bg_scroll_fine EQU #C03F
msx2_input_key_button1_mode EQU #C043
msx2_input_key_button2_mode EQU #C044
msx2_control_jump_button EQU #C045
msx2_control_action_button EQU #C046
MSX2_SCREEN4_DATA_BANK EQU 4
MSX2_SCREEN4_DATA_BANK_0 EQU 4
PANTALLA1_DATA_BANK EQU MSX2_SCREEN4_DATA_BANK_0
PANTALLA2_DATA_BANK EQU MSX2_SCREEN4_DATA_BANK_0
MSX2_SCREEN4_MULTI_BANK_LOADER_READY EQU 1
; msx2_snake_body_cells region reused by box2 runtime (#C047-#C076)
msx2_effects_runtime_buffers EQU #C08C
msx2_effects_runtime_scratch EQU #C210
msx2_collision_runtime_cache EQU #C2D0
msx2_behavior_runtime_cache EQU #C390
msx2_cell_flags_runtime_cache EQU #C450
msx2_visual_map_cache EQU #C510
msx2_hazard_hitbox_cache EQU #C5D0
msx2_hazard_hitbox_count EQU 4
msx2_hazard_hitbox_cache_bytes EQU 16
msx2_hazard_probe_ox EQU #C5E0
msx2_hazard_probe_oy EQU #C5E1
msx2_hazard_probe_w EQU #C5E2
msx2_hazard_probe_h EQU #C5E3
msx2_enemy_runtime_x EQU #C5F0
msx2_enemy_runtime_y EQU #C5FC
msx2_enemy_runtime_dx EQU #C608
msx2_enemy_runtime_dy EQU #C614
msx2_enemy_runtime_mode EQU #C620
msx2_enemy_runtime_speed EQU #C62C
msx2_enemy_runtime_tick EQU #C638
msx2_runtime_ram_end EQU #C644
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
    call init_msx2_controls
    call load_PANTALLA1_screen4
    call msx2_reset_enemy_runtime_for_current_screen
    call init_hardware_sprites

    call init_msx2_box2_boxes


    call ENASCR
    ei

    ; MSX2 minimal GameFlow: MSX2 SCREEN 4 GameFlow entry.
    jp msx2_gf_node_0
msx2_gf_node_0:
    jp msx2_gf_node_2
msx2_gf_node_2:
    ld a, 0
    ld (msx2_current_screen_index), a
    call load_PANTALLA1_screen4
    call msx2_reset_enemy_runtime_for_current_screen
    call init_hardware_sprites
    jp .main_loop
msx2_gf_node_1:
    call load_msx2_hud_font
    call draw_msx2_gf_node_1_END
    call wait_key_release
    call wait_key
    jp .main_loop
draw_msx2_gf_node_1_END:
    ld hl, #1945
    ld de, msx2_gf_node_1_END_TEXT_0
    call draw_msx2_hud_string
    ld hl, #1984
    ld de, msx2_gf_node_1_END_TEXT_1
    call draw_msx2_hud_string
    ld hl, #1AEE
    ld de, msx2_gf_node_1_END_TEXT_2
    call draw_msx2_hud_string
    ret

; MSX2 SCREEN 4 Text node text "END"
msx2_gf_node_1_END_TEXT_0:
    DB #45,#4E,#44,#00
; MSX2 SCREEN 4 Text node text "THANKS FOR PLAYING"
msx2_gf_node_1_END_TEXT_1:
    DB #54,#48,#41,#4E,#4B,#53,#20,#46,#4F,#52,#20,#50,#4C,#41,#59,#49
    DB #4E,#47,#00
; MSX2 SCREEN 4 Text node text "PRESS KEY"
msx2_gf_node_1_END_TEXT_2:
    DB #50,#52,#45,#53,#53,#20,#4B,#45,#59,#00

.main_loop:
    call update_hardware_sprite_input

    call update_msx2_box2_boxes

    call refresh_msx2_box2_hardware_sprite_sat

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
    jp msx2_screen4_data_bank_enter_selected

msx2_screen4_data_bank_enter_selected:
    ; Input: A=8KB physical segment for SCREEN 4 cold data at P2/#8000.
    ; Clobbers AF.
    jp mapper_set_bank_p2

msx2_screen4_data_bank_leave:
    ; Restores normal P2 bank 2 after cold data copies.
    ; Clobbers AF.
    ld a, 2
    jp mapper_set_bank_p2

init_msx2_controls:
    ; Defaults match legacy MSX1 Controls: B1=SPC, B2=N, jump=B1, action=B2. Clobbers AF.
    xor a
    ld (msx2_input_key_button1_mode), a
    ld (msx2_input_key_button2_mode), a
    ld (msx2_control_jump_button), a
    ld a, 1
    ld (msx2_control_action_button), a
    ret

msx2_control_jump_pressed:
    ; Output: A=1 when logical jump is pressed, A=0 otherwise. Clobbers AF/CD.
    call msx2_read_control_buttons
    bit 0, c
    jp z, .jump_not_pressed
    ld a, 1
    ret
.jump_not_pressed:
    xor a
    ret

msx2_control_action_pressed:
    ; Output: A=1 when logical action is pressed, A=0 otherwise. Clobbers AF/CD.
    call msx2_read_control_buttons
    bit 1, c
    jp z, .action_not_pressed
    ld a, 1
    ret
.action_not_pressed:
    xor a
    ret

msx2_read_control_buttons:
    ; Output: C bit0=logical jump, bit1=logical action. Clobbers AF/CD.
    ld d, 0
    xor a
    call GTTRIG
    or a
    jp z, .button1_keyboard
    set 0, d
.button1_keyboard:
    ld a, (msx2_input_key_button1_mode)
    or a
    jp nz, .button1_ctrl
    ld a, 8
    call SNSMAT
    bit 0, a
    jp nz, .button1_done
    set 0, d
    jp .button1_done
.button1_ctrl:
    ld a, 6
    call SNSMAT
    bit 2, a
    jp nz, .button1_done
    set 0, d
.button1_done:
    ld a, 3
    call GTTRIG
    or a
    jp z, .button2_keyboard
    set 1, d
.button2_keyboard:
    ld a, (msx2_input_key_button2_mode)
    or a
    jp nz, .button2_ctrl
    ld a, 4
    call SNSMAT
    bit 3, a
    jp nz, .button2_done
    set 1, d
    jp .button2_done
.button2_ctrl:
    ld a, 6
    call SNSMAT
    bit 2, a
    jp nz, .button2_done
    set 1, d
.button2_done:
    ld c, 0
    ld a, (msx2_control_jump_button)
    or a
    jp nz, .jump_uses_button2
    bit 0, d
    jp z, .jump_done
    set 0, c
    jp .jump_done
.jump_uses_button2:
    bit 1, d
    jp z, .jump_done
    set 0, c
.jump_done:
    ld a, (msx2_control_action_button)
    or a
    jp nz, .action_uses_button2
    bit 0, d
    ret z
    set 1, c
    ret
.action_uses_button2:
    bit 1, d
    ret z
    set 1, c
    ret

wait_key:
    ; Wait for the GameFlow Controls logical action button instead of raw BIOS CHGET.
.wait_action:
    call wait_frame_busy
    call msx2_control_action_pressed
    or a
    jp z, .wait_action
    call wait_key_release
    ret

wait_key_release:
    ; Debounce menu-confirm keys and clear BIOS keyboard buffer before action waits.
.release_loop:
    call wait_frame_busy
    call msx2_submenu_confirm_pressed
    or a
    jp nz, .release_loop
    call KILBUF
    ret

msx2_submenu_select:
    ; Input: B=option count, 1..6. Output: A=selected zero-based option.
    ; Uses BIOS GTSTCK plus the GameFlow Controls logical action button. Clobbers AF/BC/HL.
    ld c, 0
    push bc
    call draw_msx2_submenu_cursor
    pop bc
.loop:
    call wait_frame_busy
    ld a, 0
    push bc
    call GTSTCK
    pop bc
    cp 1
    jp z, .up
    cp 5
    jp z, .down
    push bc
    call msx2_submenu_confirm_pressed
    pop bc
    or a
    jp z, .loop
    ld a, c
    push af
.wait_confirm_release:
    call wait_frame_busy
    push bc
    call msx2_submenu_confirm_pressed
    pop bc
    or a
    jp nz, .wait_confirm_release
    pop af
    ret
.up:
    ld a, c
    or a
    jp z, .wait_neutral
    dec c
    push bc
    call draw_msx2_submenu_cursor
    pop bc
    jp .wait_neutral
.down:
    ld a, c
    inc a
    cp b
    jp nc, .wait_neutral
    ld c, a
    push bc
    call draw_msx2_submenu_cursor
    pop bc
    jp .wait_neutral
.wait_neutral:
    call wait_frame_busy
    ld a, 0
    push bc
    call GTSTCK
    pop bc
    or a
    jp nz, .wait_neutral
    jp .loop

msx2_submenu_confirm_pressed:
    ; Output: A=1 when either menu-confirm logical button is pressed.
    ; Clobbers AF/CD. Callers that need BC/DE/HL must preserve them.
    call msx2_control_action_pressed
    or a
    ret nz
    call msx2_control_jump_pressed
    ret

draw_msx2_submenu_cursor:
    ; Input: C=selected option index. Draws a simple '-' marker in fixed menu rows.
    ; Clobbers AF/BC/HL.
    ld hl, #19E5
    ld a, MSX2_HUD_FONT_BASE_CHAR
    call WRTVRM
    ld hl, #1A05
    ld a, MSX2_HUD_FONT_BASE_CHAR
    call WRTVRM
    ld hl, #1A25
    ld a, MSX2_HUD_FONT_BASE_CHAR
    call WRTVRM
    ld hl, #1A45
    ld a, MSX2_HUD_FONT_BASE_CHAR
    call WRTVRM
    ld hl, #1A65
    ld a, MSX2_HUD_FONT_BASE_CHAR
    call WRTVRM
    ld hl, #1A85
    ld a, MSX2_HUD_FONT_BASE_CHAR
    call WRTVRM
    ld a, c
    ld h, 0
    ld l, a
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld bc, #19E5
    add hl, bc
    ld a, MSX2_HUD_FONT_BASE_CHAR + 38
    jp WRTVRM



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


    ld a, 71
    ld (msx2_player_sprite_x), a
    ld a, 112
    ld (msx2_player_sprite_y), a
    ld a, 1
    ld (msx2_player_sprite_dx), a
    ld a, 1
    ld (msx2_player_sprite_frame), a
    xor a
    ld hl, msx2_player_gravity_vel
    ld (hl), a
    inc hl
    ld (hl), a
    ld (msx2_player_flags), a
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
    ld (msx2_enemy_bullet_1_active), a
    ld (msx2_enemy_bullet_1_x), a
    ld (msx2_enemy_bullet_1_y), a
    ld (msx2_score_lo), a
    ld (msx2_score_hi), a
    ld (msx2_runtime_frame_counter), a
    call msx2_load_current_screen_air
    ld a, #03
    ld (msx2_lives), a
    ld a, #FF
    ld (msx2_wall_slide_side), a
    xor a
    ld (msx2_wall_jump_lock_timer), a
    ld (msx2_wall_jump_lock_vx), a
    ld (msx2_wall_jump_key_lock), a
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


load_msx2_hud_font:
    ; Loads the generic MSX2 SCREEN 4 HUD font into reserved high char slots. Clobbers AF/BC/DE/HL.
    call msx2_screen4_data_bank_enter

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
    call msx2_screen4_data_bank_leave

    ld a, #F1
    ld hl, #2600
    ld bc, msx2_hud_font_patterns_end - msx2_hud_font_patterns
    call FILVRM
    ld a, #F1
    ld hl, #2E00
    ld bc, msx2_hud_font_patterns_end - msx2_hud_font_patterns
    call FILVRM
    ld a, #F1
    ld hl, #3600
    ld bc, msx2_hud_font_patterns_end - msx2_hud_font_patterns
    jp FILVRM

fill_msx2_hud_font_color:
    ; A=color byte, high nibble foreground and low nibble background. Clobbers AF/BC/HL.
    push af
    ld hl, #2600
    ld bc, msx2_hud_font_patterns_end - msx2_hud_font_patterns
    call FILVRM
    pop af
    push af
    ld hl, #2E00
    ld bc, msx2_hud_font_patterns_end - msx2_hud_font_patterns
    call FILVRM
    pop af
    ld hl, #3600
    ld bc, msx2_hud_font_patterns_end - msx2_hud_font_patterns
    jp FILVRM

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


draw_msx2_lives_hud:
draw_msx2_score_hud:
draw_msx2_collectible_hud:
draw_msx2_air_hud:
    ; Native SCREEN 4 HUD authoring is exported as metadata for now.
    ; Runtime drawing is intentionally data-driven work, not hardcoded bars.
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
    ld (msx2_enemy_bullet_1_active), a
    call draw_msx2_level_complete_banner
    call write_hardware_sprite_attrs
    ret

update_msx2_enemy_bullet:
    ; Enemy projectile pool for Galaxian-style MSX2 screens. Clobbers AF/BC/DE/HL.
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
    ld hl, msx2_enemy_bullet_active
    call msx2_enemy_bullet_update_slot
    jp .enemy_bullet_try_spawn

msx2_enemy_bullet_update_slot:
    ; HL -> slot active byte (active,x,y are contiguous). Clobbers AF/BC/DE/HL.
    ld a, (hl)
    or a
    ret z
    push hl
    inc hl
    inc hl
    ld a, (hl)
    cp 204
    jp nc, .enemy_bullet_deactivate_hl_pop
    add a, 2
    ld (hl), a
    pop hl
    push hl
    call msx2_enemy_bullet_check_effect_collision_hl
    pop hl
    ld a, (hl)
    or a
    ret z
    jp msx2_enemy_bullet_check_player_collision_hl

.enemy_bullet_deactivate_hl_pop:
    pop hl
msx2_enemy_bullet_deactivate_hl:
    xor a
    ld (hl), a
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
    ld a, (msx2_enemy_bullet_active)
    or a
    jp z, .enemy_bullet_spawn_slot_0_0
    jp .enemy_bullet_no_spawn_0
.enemy_bullet_spawn_slot_0_0:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
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
    ld a, (msx2_enemy_bullet_active)
    or a
    jp z, .enemy_bullet_spawn_slot_0_1
    jp .enemy_bullet_no_spawn_1
.enemy_bullet_spawn_slot_0_1:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
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
    ld a, (msx2_enemy_bullet_active)
    or a
    jp z, .enemy_bullet_spawn_slot_0_2
    jp .enemy_bullet_no_spawn_2
.enemy_bullet_spawn_slot_0_2:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
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
    ld a, (msx2_enemy_bullet_active)
    or a
    jp z, .enemy_bullet_spawn_slot_0_3
    jp .enemy_bullet_no_spawn_3
.enemy_bullet_spawn_slot_0_3:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
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
    ld a, (msx2_enemy_bullet_active)
    or a
    jp z, .enemy_bullet_spawn_slot_0_4
    jp .enemy_bullet_no_spawn_4
.enemy_bullet_spawn_slot_0_4:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
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
    ld a, (msx2_enemy_bullet_active)
    or a
    jp z, .enemy_bullet_spawn_slot_0_5
    jp .enemy_bullet_no_spawn_5
.enemy_bullet_spawn_slot_0_5:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
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
    ld a, (msx2_enemy_bullet_active)
    or a
    jp z, .enemy_bullet_spawn_slot_0_6
    jp .enemy_bullet_no_spawn_6
.enemy_bullet_spawn_slot_0_6:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
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
    ld a, (msx2_enemy_bullet_active)
    or a
    jp z, .enemy_bullet_spawn_slot_0_7
    jp .enemy_bullet_no_spawn_7
.enemy_bullet_spawn_slot_0_7:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
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
    ld a, (msx2_enemy_bullet_active)
    or a
    jp z, .enemy_bullet_spawn_slot_0_8
    jp .enemy_bullet_no_spawn_8
.enemy_bullet_spawn_slot_0_8:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
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
    ld a, (msx2_enemy_bullet_active)
    or a
    jp z, .enemy_bullet_spawn_slot_0_9
    jp .enemy_bullet_no_spawn_9
.enemy_bullet_spawn_slot_0_9:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
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
    ld a, (msx2_enemy_bullet_active)
    or a
    jp z, .enemy_bullet_spawn_slot_0_10
    jp .enemy_bullet_no_spawn_10
.enemy_bullet_spawn_slot_0_10:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
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
    ld a, (msx2_enemy_bullet_active)
    or a
    jp z, .enemy_bullet_spawn_slot_0_11
    jp .enemy_bullet_no_spawn_11
.enemy_bullet_spawn_slot_0_11:
    ld a, (msx2_current_screen_index)
    ld b, a
    xor a
    add a, b
    add a, b
    add a, b
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

msx2_enemy_bullet_check_player_collision_hl:
    ; HL -> slot active. Clobbers AF/BC/DE/HL.
    push hl
    inc hl
    inc hl
    ld a, (hl)
    add a, 4
    ld c, a
    ld a, (msx2_player_sprite_y)
    ld b, a
    ld a, c
    cp b
    jp c, .enemy_bullet_player_miss_pop
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_bullet_player_miss_pop
    dec hl
    ld a, (hl)
    add a, 4
    ld c, a
    ld a, (msx2_player_sprite_x)
    ld b, a
    ld a, c
    cp b
    jp c, .enemy_bullet_player_miss_pop
    ld a, b
    add a, 15
    cp c
    jp c, .enemy_bullet_player_miss_pop
    pop hl
    xor a
    ld (hl), a
    ld a, 80
    ld (msx2_enemy_bullet_cooldown), a
    call msx2_sfx_hit
    call msx2_apply_damage_respawn
    ret
.enemy_bullet_player_miss_pop:
    pop hl
    ret

msx2_enemy_bullet_check_effect_collision_hl:
    ; HL -> slot active. Clobbers AF/BC/DE/HL.
    push hl
    inc hl
    ld a, (hl)
    add a, 4
    ld b, a
    inc hl
    ld a, (hl)
    add a, 8
    ld c, a
    push bc
    call msx2_effect_at_pixel
    cp 3
    jp z, .enemy_bullet_effect_hit_hl
    pop bc
    pop hl
    ret
.enemy_bullet_effect_hit_hl:
    call msx2_clear_effect_bits_at_hl
    pop bc
    pop hl
    xor a
    ld (hl), a
    call clear_msx2_effect_visual_at_pixel
    call msx2_sfx_hit
    ret

update_hardware_sprite_input:
    ; First playable MSX2 slice: keyboard/joystick left-right plus jump/gravity.
    ; Clobbers AF/BC/DE/HL.



    xor a
    ld (msx2_player_walking_flag), a
    ld a, (msx2_level_complete_flag)
    or a
    jp nz, msx2_level_complete_idle
    ld a, (msx2_game_over_flag)
    or a
    jp nz, msx2_game_over_idle
    ; wall_jump: detect contact, release key lock, try kick, step horizontal lock.
    call msx2_wall_jump_detect_contact
    ld (msx2_wall_slide_side), a
    call msx2_wall_jump_release_lock
    call msx2_try_wall_jump_kick
    call msx2_step_wall_jump_lock
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
    ld hl, msx2_player_gravity_vel
    ld (hl), a
    inc hl
    ld (hl), a
    ld (msx2_player_flags), a
    jp upload_hardware_sprite_attrs

move_msx2_ladder_down:
    ld a, (msx2_player_sprite_y)
    cp 196
    jp nc, upload_hardware_sprite_attrs
    inc a
    ld (msx2_player_sprite_y), a
    xor a
    ld hl, msx2_player_gravity_vel
    ld (hl), a
    inc hl
    ld (hl), a
    ld (msx2_player_flags), a
    jp upload_hardware_sprite_attrs

hold_msx2_rope:
    xor a
    ld hl, msx2_player_gravity_vel
    ld (hl), a
    inc hl
    ld (hl), a
    ld (msx2_player_flags), a
    jp upload_hardware_sprite_attrs

move_hardware_sprite_right:
    ; Moves platformMoveSpeed pixels right per frame. Clobbers AF/BC/DE/HL.
    ld a, (msx2_player_sprite_x)
    add a, 2
    cp 240
    jp nc, msx2_try_world_edge_transition_right
    ld a, #10
    ld (msx2_box2_try_dx), a
    ld a, #00
    ld (msx2_box2_try_dy), a
    call msx2_try_box2_from_player
    jp c, .right_blocked
    ; msx2_try_box2_from_player clobbers A: rebuild the probe X from RAM.
    ld a, (msx2_player_sprite_x)
    add a, 2
    add a, 15
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    jp nz, .right_blocked
.right_move_player:
    ld a, (msx2_player_sprite_x)
    add a, 2
    ld (msx2_player_sprite_x), a
    ld a, 1
    ld (msx2_player_sprite_dx), a
    ld a, 1
    ld (msx2_player_walking_flag), a
    jp finish_msx2_horizontal_move
.right_blocked:
    xor a
    ld (msx2_player_sprite_dx), a
    jp finish_msx2_horizontal_move

move_hardware_sprite_left:
    ; Moves platformMoveSpeed pixels left per frame. Clobbers AF/BC/DE/HL.
    ld a, (msx2_player_sprite_x)
    cp 1
    jp z, msx2_try_world_edge_transition_left
    jp c, msx2_try_world_edge_transition_left
    ld a, #F0
    ld (msx2_box2_try_dx), a
    ld a, #00
    ld (msx2_box2_try_dy), a
    call msx2_try_box2_from_player
    jp c, .left_blocked
    ld a, (msx2_player_sprite_x)
    sub 2
    jp nc, .left_clamp_min
    ld a, 1
    jp .left_do_collision
.left_clamp_min:
    cp 1
    jp nc, .left_do_collision
    ld a, 1
.left_do_collision:
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    jp nz, .left_blocked
.left_move_player:
    ld a, (msx2_player_sprite_x)
    sub 2
    jp nc, .left_store_min
    ld a, 1
    jp .left_store
.left_store_min:
    cp 1
    jp nc, .left_store
    ld a, 1
.left_store:
    ld (msx2_player_sprite_x), a
    xor a
    ld (msx2_player_sprite_dx), a
    ld a, 1
    ld (msx2_player_walking_flag), a
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
    jp z, .restart_action_check
    call msx2_control_action_pressed
    or a
    jp nz, .draw_game_over
    ld a, 8
    call SNSMAT
    bit 0, a
    jp z, .draw_game_over
    xor a
    ld (msx2_game_over_restart_lock), a
    jp .draw_game_over
.restart_action_check:
    call msx2_control_action_pressed
    or a
    jp nz, msx2_restart_game
.restart_space_check:
    ld a, 8
    call SNSMAT
    bit 0, a
    jp z, msx2_restart_game
.draw_game_over:
    call draw_msx2_game_over_banner
    call write_hardware_sprite_attrs
    ret

msx2_level_complete_idle:
    call msx2_control_action_pressed
    or a
    jp z, .continue_space_released
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
    ld (msx2_enemy_bullet_1_active), a
    ld (msx2_enemy_bullet_1_x), a
    ld (msx2_enemy_bullet_1_y), a
    ld (msx2_runtime_frame_counter), a
    call msx2_load_current_screen_air
    call msx2_reset_enemy_runtime_for_current_screen
    call draw_msx2_lives_hud
    call draw_msx2_collectible_hud
    call draw_msx2_air_hud
    call msx2_respawn_current_screen
    ld a, #01
    ld (msx2_player_flags), a
    call write_hardware_sprite_attrs
    ret

msx2_advance_to_next_wave_screen:
    ; Advances to the next referenced SCREEN 4 sector, wrapping after the final wave. Clobbers AF.
    ld a, (msx2_current_screen_index)
    inc a
    cp 2
    jp c, .store_next_wave_screen
    xor a
.store_next_wave_screen:
    ld (msx2_current_screen_index), a
    ret

msx2_restart_game:
    ld a, 0
    ld (msx2_current_screen_index), a
    call init_msx2_effect_buffers
    call load_PANTALLA1_screen4
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
    ld (msx2_enemy_bullet_1_active), a
    ld (msx2_enemy_bullet_1_x), a
    ld (msx2_enemy_bullet_1_y), a
    ld (msx2_runtime_frame_counter), a
    call msx2_load_current_screen_air
    call msx2_reset_enemy_runtime_for_current_screen
    ld a, #03
    ld (msx2_lives), a
    call draw_msx2_lives_hud
    call draw_msx2_collectible_hud
    call draw_msx2_air_hud
    call msx2_respawn_current_screen
    ld a, #01
    ld (msx2_player_flags), a
    xor a
    ld (msx2_player_coyote_timer), a
    ld (msx2_player_jump_buffer_timer), a
    ld a, #FF
    ld (msx2_wall_slide_side), a
    xor a
    ld (msx2_wall_jump_lock_timer), a
    ld (msx2_wall_jump_lock_vx), a
    ld (msx2_wall_jump_key_lock), a
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
    ; Platform jump/gravity uses MSX1-style 8.8 physics (msx2_jump + msx2_gravity components).
    ; Clobbers AF/BC/DE/HL.
    ; MSX2 platform vertical physics (msx2_jump + msx2_gravity components, 8.8).
    ; Body hitbox: x=3, y=0, w=10, h=16. Vertical probes use inset 2.
    call msx2_control_jump_pressed
    or a
    jp z, .platform_jump_space_released
    ld a, (msx2_player_flags)
    and #2
    jp nz, .platform_after_jump_input
    ld a, (msx2_player_flags)
    bit 0, a
    jp nz, .platform_jump_grounded
    ; Airborne: check coyote / buffer
    ld a, (msx2_player_coyote_timer)
    or a
    jp z, .platform_coyote_blocked
    ; coyote window active: count as grounded
    ld a, (msx2_player_flags)
    or #1
    jp .platform_apply_jump_impulse
.platform_coyote_blocked:
    ; coyote expired: record jump press as buffer if enabled
    ; jump buffer disabled
    ld a, (msx2_player_flags)
    rra
    rra
    and #7
    cp #01
    jp nc, .platform_after_jump_input
    jp .platform_apply_jump_impulse
.platform_jump_grounded:
    jp .platform_apply_jump_impulse
.platform_apply_jump_impulse:
    ld hl, msx2_player_gravity_vel
    ld (hl), #00
    inc hl
    ld (hl), #FC
    ld a, (msx2_player_flags)
    bit 0, a
    jr nz, .platform_jump_set_count_one
    ld a, (msx2_player_flags)
    add a, #4
    jr .platform_jump_store_flags
.platform_jump_set_count_one:
    ld a, (msx2_player_flags)
    and #FA
    or #4
.platform_jump_store_flags:
    and #FE
    or #2
    ld (msx2_player_flags), a
    jp .platform_after_jump_input
.platform_jump_space_released:
    ld a, (msx2_player_flags)
    and #FD
    ld (msx2_player_flags), a
.platform_after_jump_input:
    ld hl, msx2_player_coyote_timer
    ld a, (hl)
    or a
    jr z, .skip_all_dec
    dec (hl)
.skip_coyote_dec:
.skip_all_dec:
    call msx2_rope_at_player_center
    jp z, .platform_hold_rope
    ld a, (msx2_player_flags)
    and #1
    jp z, .platform_apply_gravity_in_air
    ld hl, msx2_player_gravity_vel
    xor a
    ld (hl), a
    inc hl
    ld (hl), a
    jp .platform_apply_vertical_delta
.platform_apply_gravity_in_air:
    call msx2_apply_platform_gravity
    call msx2_wall_jump_slide_clamp
    jp .platform_apply_vertical_delta
.platform_apply_vertical_delta:
    ld hl, msx2_player_gravity_vel
    inc hl
    ld a, (hl)
    or a
    jp z, .platform_check_grounded
    bit 7, a
    jp nz, .platform_move_up_once
    ld d, a
.platform_move_down_loop:
    ld a, (msx2_player_sprite_x)
    add a, #05
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, #10
    ld c, a
    ld e, c
    push de
    push bc
    call msx2_collision_at_pixel
    pop bc
    pop de
    jp nz, .platform_land
    ld a, (msx2_player_sprite_x)
    add a, #0A
    ld b, a
    ld c, e
    push de
    push bc
    call msx2_collision_at_pixel
    pop bc
    pop de
    jp nz, .platform_land
    ld a, (msx2_player_sprite_y)
    inc a
    jp c, upload_hardware_sprite_attrs
    cp 196
    jp nc, upload_hardware_sprite_attrs
    ld (msx2_player_sprite_y), a
    dec d
    ld a, d
    or a
    jp nz, .platform_move_down_loop
    jp upload_hardware_sprite_attrs
.platform_move_up_once:
    neg
    ld d, a
.platform_move_up_loop:
    ld a, (msx2_player_sprite_y)
    or a
    jp z, upload_hardware_sprite_attrs
    dec a
    ld (msx2_player_sprite_y), a
    ld a, (msx2_player_sprite_x)
    add a, #05
    ld b, a
    ld a, (msx2_player_sprite_y)
    ld c, a
    ld e, c
    push de
    push bc
    call msx2_collision_at_pixel
    pop bc
    pop de
    jp nz, .platform_cancel_jump
    ld a, (msx2_player_sprite_x)
    add a, #0A
    ld b, a
    ld c, e
    push de
    push bc
    call msx2_collision_at_pixel
    pop bc
    pop de
    jp nz, .platform_cancel_jump
    dec d
    ld a, d
    or a
    jp nz, .platform_move_up_loop
    jp upload_hardware_sprite_attrs
.platform_cancel_jump:
    ld a, e
    and #F0
    add a, #10
    sub #00
    ld (msx2_player_sprite_y), a
    ld hl, msx2_player_gravity_vel
    xor a
    ld (hl), a
    inc hl
    ld (hl), a
    jp upload_hardware_sprite_attrs
.platform_land:
    ld a, e
    and #F0
    sub #10
    ld (msx2_player_sprite_y), a
    ld hl, msx2_player_gravity_vel
    xor a
    ld (hl), a
    inc hl
    ld (hl), a
    ld a, #FF
    ld (msx2_wall_slide_side), a
    xor a
    ld (msx2_wall_jump_lock_timer), a
    ld (msx2_wall_jump_lock_vx), a
    ld a, #1
    ld (msx2_player_flags), a
    ; landing clears any stale coyote timer
    xor a
    ld (msx2_player_coyote_timer), a
    call apply_msx2_conveyor
    jp upload_hardware_sprite_attrs
.platform_check_grounded:
    ld a, (msx2_player_sprite_x)
    add a, #05
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, #10
    ld c, a
    ld e, c
    push de
    push bc
    call msx2_collision_at_pixel
    pop bc
    pop de
    jp nz, .platform_land
    ld a, (msx2_player_sprite_x)
    add a, #0A
    ld b, a
    ld c, e
    push de
    push bc
    call msx2_collision_at_pixel
    pop bc
    pop de
    jp nz, .platform_land
    ld a, (msx2_player_flags)
    and #FE
    ld (msx2_player_flags), a
    ; left ground: arm coyote timer if not already armed
    ld a, (msx2_player_coyote_timer)
    or a
    jr nz, .platform_coyote_skip_arm
    ld a, #08
    ld (msx2_player_coyote_timer), a
.platform_coyote_skip_arm:
    jp upload_hardware_sprite_attrs
.platform_hold_rope:
    ld hl, msx2_player_gravity_vel
    xor a
    ld (hl), a
    inc hl
    ld (hl), a
    ld a, (msx2_player_flags)
    and #FE
    ld (msx2_player_flags), a
    jp upload_hardware_sprite_attrs

msx2_apply_platform_gravity:
    ; msx2_gravity component: adds configured strength to the 8.8 accumulator. Clobbers AF/DE/HL.
    ld hl, msx2_player_gravity_vel
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
    jp nz, .platform_store_gravity_vel
    cp #04
    jp c, .platform_store_gravity_vel
    ld de, #0400
.platform_store_gravity_vel:
    ld hl, msx2_player_gravity_vel
    ld (hl), e
    inc hl
    ld (hl), d
    ret


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
    ld a, 1
    ld (msx2_player_walking_flag), a
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
    ld a, 1
    ld (msx2_player_walking_flag), a
    ret


update_msx2_player_sprite_animation:
    ; Advances the player hardware sprite frame. Clobbers AF.
    ld a, (msx2_player_walking_flag)
    or a
    jp z, .reset_player_sprite_frame_idle
    ld a, (msx2_player_anim_counter)
    inc a
    cp 8
    jp nc, .advance_player_sprite_frame
    ld (msx2_player_anim_counter), a
    ret
.advance_player_sprite_frame:
    xor a
    ld (msx2_player_anim_counter), a
    ld a, (msx2_player_anim_frame)
    inc a
    cp 2
    jp c, .store_player_sprite_frame
    xor a
.store_player_sprite_frame:
    ld (msx2_player_anim_frame), a
    ret
.reset_player_sprite_frame_idle:
    xor a
    ld (msx2_player_anim_counter), a
    ld (msx2_player_anim_frame), a
    ret
refresh_msx2_box2_hardware_sprite_sat:
    ; Idempotent SAT refresh for a moving box2 slot (no slide/fall step). Clobbers AF/BC/HL.
    ld a, (msx2_box2_moving_slot)
    cp #FF
    ret z
    ld c, a
    ld b, 0
    ld hl, msx2_box2_runtime_moving
    add hl, bc
    ld a, (hl)
    or a
    ret z
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld a, (hl)
    ld hl, #1E44
    call write_vram_byte_ext
    ; write_vram_byte_ext clobbers B, so rebuild BC before indexing by slot again.
    ld b, 0
    ld hl, msx2_box2_runtime_x
    add hl, bc
    ld a, (hl)
    ld hl, #1E45
    call write_vram_byte_ext
    ld a, 44
    ld hl, #1E46
    call write_vram_byte_ext
    xor a
    ld hl, #1E47
    call write_vram_byte_ext
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
    ld a, (msx2_player_anim_frame)
    add a, a
    add a, a
    add a, a
    add a, 0
    ld b, a
    ld a, (msx2_player_sprite_dx)
    or a
    ld a, b
    jp nz, .msx2_player_pattern_base_0
    add a, 16
.msx2_player_pattern_base_0:
    ld hl, #1E02
    call write_vram_byte_ext
    xor a
    ld hl, #1E03
    call write_vram_byte_ext

    ; Sprite layer 1: x+0, y+0
    ld a, (msx2_player_sprite_y)
    ld hl, #1E04
    call write_vram_byte_ext
    ld a, (msx2_player_sprite_x)
    ld hl, #1E05
    call write_vram_byte_ext
    ld a, (msx2_player_anim_frame)
    add a, a
    add a, a
    add a, a
    add a, 4
    ld b, a
    ld a, (msx2_player_sprite_dx)
    or a
    ld a, b
    jp nz, .msx2_player_pattern_base_1
    add a, 16
.msx2_player_pattern_base_1:
    ld hl, #1E06
    call write_vram_byte_ext
    xor a
    ld hl, #1E07
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
    ld hl, #1E08
    call write_vram_byte_ext
    jp .enemy_sprite_0_done
.enemy_sprite_0_visible:
    ld hl, msx2_enemy_runtime_y
    ld a, (hl)
    ld hl, #1E08
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld a, (hl)
    ld hl, #1E09
    call write_vram_byte_ext
    ld a, 32
    ld hl, #1E0A
    call write_vram_byte_ext
    xor a
    ld hl, #1E0B
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
    ld hl, #1E0C
    call write_vram_byte_ext
    jp .enemy_sprite_1_done
.enemy_sprite_1_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 1
    add hl, de
    ld a, (hl)
    ld hl, #1E0C
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 1
    add hl, de
    ld a, (hl)
    ld hl, #1E0D
    call write_vram_byte_ext
    ld a, 32
    ld hl, #1E0E
    call write_vram_byte_ext
    xor a
    ld hl, #1E0F
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
    ld hl, #1E10
    call write_vram_byte_ext
    jp .enemy_sprite_2_done
.enemy_sprite_2_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 2
    add hl, de
    ld a, (hl)
    ld hl, #1E10
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 2
    add hl, de
    ld a, (hl)
    ld hl, #1E11
    call write_vram_byte_ext
    ld a, 32
    ld hl, #1E12
    call write_vram_byte_ext
    xor a
    ld hl, #1E13
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
    ld hl, #1E14
    call write_vram_byte_ext
    jp .enemy_sprite_3_done
.enemy_sprite_3_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 3
    add hl, de
    ld a, (hl)
    ld hl, #1E14
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 3
    add hl, de
    ld a, (hl)
    ld hl, #1E15
    call write_vram_byte_ext
    ld a, 32
    ld hl, #1E16
    call write_vram_byte_ext
    xor a
    ld hl, #1E17
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
    ld hl, #1E18
    call write_vram_byte_ext
    jp .enemy_sprite_4_done
.enemy_sprite_4_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 4
    add hl, de
    ld a, (hl)
    ld hl, #1E18
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 4
    add hl, de
    ld a, (hl)
    ld hl, #1E19
    call write_vram_byte_ext
    ld a, 32
    ld hl, #1E1A
    call write_vram_byte_ext
    xor a
    ld hl, #1E1B
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
    ld hl, #1E1C
    call write_vram_byte_ext
    jp .enemy_sprite_5_done
.enemy_sprite_5_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 5
    add hl, de
    ld a, (hl)
    ld hl, #1E1C
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 5
    add hl, de
    ld a, (hl)
    ld hl, #1E1D
    call write_vram_byte_ext
    ld a, 32
    ld hl, #1E1E
    call write_vram_byte_ext
    xor a
    ld hl, #1E1F
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
    ld hl, #1E20
    call write_vram_byte_ext
    jp .enemy_sprite_6_done
.enemy_sprite_6_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 6
    add hl, de
    ld a, (hl)
    ld hl, #1E20
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 6
    add hl, de
    ld a, (hl)
    ld hl, #1E21
    call write_vram_byte_ext
    ld a, 32
    ld hl, #1E22
    call write_vram_byte_ext
    xor a
    ld hl, #1E23
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
    ld hl, #1E24
    call write_vram_byte_ext
    jp .enemy_sprite_7_done
.enemy_sprite_7_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 7
    add hl, de
    ld a, (hl)
    ld hl, #1E24
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 7
    add hl, de
    ld a, (hl)
    ld hl, #1E25
    call write_vram_byte_ext
    ld a, 32
    ld hl, #1E26
    call write_vram_byte_ext
    xor a
    ld hl, #1E27
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
    ld hl, #1E28
    call write_vram_byte_ext
    jp .enemy_sprite_8_done
.enemy_sprite_8_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 8
    add hl, de
    ld a, (hl)
    ld hl, #1E28
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 8
    add hl, de
    ld a, (hl)
    ld hl, #1E29
    call write_vram_byte_ext
    ld a, 32
    ld hl, #1E2A
    call write_vram_byte_ext
    xor a
    ld hl, #1E2B
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
    ld hl, #1E2C
    call write_vram_byte_ext
    jp .enemy_sprite_9_done
.enemy_sprite_9_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 9
    add hl, de
    ld a, (hl)
    ld hl, #1E2C
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 9
    add hl, de
    ld a, (hl)
    ld hl, #1E2D
    call write_vram_byte_ext
    ld a, 32
    ld hl, #1E2E
    call write_vram_byte_ext
    xor a
    ld hl, #1E2F
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
    ld hl, #1E30
    call write_vram_byte_ext
    jp .enemy_sprite_10_done
.enemy_sprite_10_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 10
    add hl, de
    ld a, (hl)
    ld hl, #1E30
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 10
    add hl, de
    ld a, (hl)
    ld hl, #1E31
    call write_vram_byte_ext
    ld a, 32
    ld hl, #1E32
    call write_vram_byte_ext
    xor a
    ld hl, #1E33
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
    ld hl, #1E34
    call write_vram_byte_ext
    jp .enemy_sprite_11_done
.enemy_sprite_11_visible:
    ld hl, msx2_enemy_runtime_y
    ld de, 11
    add hl, de
    ld a, (hl)
    ld hl, #1E34
    call write_vram_byte_ext
    ld hl, msx2_enemy_runtime_x
    ld de, 11
    add hl, de
    ld a, (hl)
    ld hl, #1E35
    call write_vram_byte_ext
    ld a, 32
    ld hl, #1E36
    call write_vram_byte_ext
    xor a
    ld hl, #1E37
    call write_vram_byte_ext
.enemy_sprite_11_done:
    ; Player bullet hardware sprite slot 0.
    ld a, (msx2_player_bullet_active)
    or a
    jp nz, .player_bullet_sprite_visible
    ld a, 208
    ld hl, #1E38
    call write_vram_byte_ext
    jp .player_bullet_sprite_done
.player_bullet_sprite_visible:
    ld a, (msx2_player_bullet_y)
    ld hl, #1E38
    call write_vram_byte_ext
    ld a, (msx2_player_bullet_x)
    ld hl, #1E39
    call write_vram_byte_ext
    ld a, 36
    ld hl, #1E3A
    call write_vram_byte_ext
    xor a
    ld hl, #1E3B
    call write_vram_byte_ext
.player_bullet_sprite_done:

    ; Player bullet hardware sprite slot 1.
    ld a, (msx2_player_bullet_1_active)
    or a
    jp nz, .player_bullet_1_sprite_visible
    ld a, 208
    ld hl, #1E3C
    call write_vram_byte_ext
    jp .player_bullet_1_sprite_done
.player_bullet_1_sprite_visible:
    ld a, (msx2_player_bullet_1_y)
    ld hl, #1E3C
    call write_vram_byte_ext
    ld a, (msx2_player_bullet_1_x)
    ld hl, #1E3D
    call write_vram_byte_ext
    ld a, 36
    ld hl, #1E3E
    call write_vram_byte_ext
    xor a
    ld hl, #1E3F
    call write_vram_byte_ext
.player_bullet_1_sprite_done:
    ; Enemy bullet hardware sprite slot 0.
    ld a, (msx2_enemy_bullet_active)
    or a
    jp nz, .enemy_bullet_sprite_visible
    ld a, 208
    ld hl, #1E40
    call write_vram_byte_ext
    jp .enemy_bullet_sprite_done
.enemy_bullet_sprite_visible:
    ld a, (msx2_enemy_bullet_y)
    ld hl, #1E40
    call write_vram_byte_ext
    ld a, (msx2_enemy_bullet_x)
    ld hl, #1E41
    call write_vram_byte_ext
    ld a, 40
    ld hl, #1E42
    call write_vram_byte_ext
    xor a
    ld hl, #1E43
    call write_vram_byte_ext
.enemy_bullet_sprite_done:

    ; Box2 hardware sprite while sliding or falling (hybrid render).
    ld a, (msx2_box2_moving_slot)
    cp #FF
    jp z, .box2_sprite_hide
    ld c, a
    ld b, 0
    ld hl, msx2_box2_runtime_moving
    add hl, bc
    ld a, (hl)
    or a
    jp z, .box2_sprite_hide
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld a, (hl)
    ld hl, #1E44
    call write_vram_byte_ext
    ; write_vram_byte_ext clobbers B, so rebuild BC before indexing by slot again.
    ld b, 0
    ld hl, msx2_box2_runtime_x
    add hl, bc
    ld a, (hl)
    ld hl, #1E45
    call write_vram_byte_ext
    ld a, 44
    ld hl, #1E46
    call write_vram_byte_ext
    xor a
    ld hl, #1E47
    call write_vram_byte_ext
    jp .box2_sprite_done
.box2_sprite_hide:
    ld a, 208
    ld hl, #1E44
    call write_vram_byte_ext
    xor a
    ld hl, #1E45
    call write_vram_byte_ext
    ld hl, #1E46
    call write_vram_byte_ext
    ld hl, #1E47
    call write_vram_byte_ext
.box2_sprite_done:
    ld a, 208
    ld hl, #1E48
    call write_vram_byte_ext
    ret

upload_hardware_sprite_attrs:
    call update_msx2_player_sprite_animation

    call update_msx2_effect_state
    call update_msx2_box2_boxes
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
    call init_msx2_box2_boxes
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
    call msx2_clear_effect_bits_at_hl
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
    call msx2_clear_effect_bits_at_hl
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
    call msx2_clear_effect_bits_at_hl
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
    call msx2_clear_effect_bits_at_hl
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
    call msx2_clear_effect_bits_at_hl
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
    call msx2_clear_effect_bits_at_hl
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
    call msx2_clear_effect_bits_at_hl
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
    call msx2_clear_effect_bits_at_hl
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
    call msx2_clear_effect_bits_at_hl
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
    call msx2_clear_effect_bits_at_hl
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
    call msx2_clear_effect_bits_at_hl
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
    call msx2_clear_effect_bits_at_hl
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
    jp z, .damage_game_over
    jp .damage_after_lives
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
    jp nz, .damage_show_game_over
    xor a
    ld (msx2_player_dead_flag), a
    ret
.damage_show_game_over:
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
    ld a, (msx2_wall_jump_lock_timer)
    or a
    ret nz
    ld a, 1
    ld (msx2_enemy_hit_flag), a
    ld a, #3C
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
    call msx2_probe_player_hazard_hit
    or a
    jp nz, .hazard
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_effect_at_pixel
    or a
    jp nz, .effect_dispatch
    ld a, (msx2_player_sprite_x)
    add a, 4
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 15
    ld c, a
    call msx2_effect_at_pixel
    or a
    jp nz, .effect_dispatch
    ld a, (msx2_player_sprite_x)
    add a, 12
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 15
    ld c, a
    call msx2_effect_at_pixel
    or a
    jp nz, .effect_dispatch
    jp .no_effect
.effect_dispatch:
    ; A=effect code, HL=effect cell from the probe that matched (needed by .collectible).
    ; Hazard (1) uses per-tile hitboxes via msx2_probe_player_hazard_hit above.
    cp 1
    jp z, .no_effect
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
    ld a, (msx2_wall_jump_lock_timer)
    or a
    jp nz, .no_effect
    ld a, (msx2_enemy_damage_cooldown)
    or a
    ret nz
    xor a
    ld (msx2_collectible_latch), a
    ld a, #3C
    ld (msx2_enemy_damage_cooldown), a
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
    call msx2_clear_effect_bits_at_hl
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
    ld a, #FF
    ld (msx2_wall_slide_side), a
    xor a
    ld (msx2_wall_jump_lock_timer), a
    ld (msx2_wall_jump_lock_vx), a
    ld (msx2_wall_jump_key_lock), a
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
    ; B=x pixel, C=y pixel. Returns A=solid mask with Z set when empty.
    ; Clobbers AF/DE/HL. Preserves BC inputs.
    ; Moving/idle box2 slots override packed flags so sprite motion stays collidable.
    push bc
    ld d, b
    ld e, c
    call msx2_box2_find_at_pixel
    pop bc
    cp #FF
    jr nz, .collision_box_runtime_solid
    call msx2_cell_solid_at_pixel
    or a
    ret nz
    call msx2_cell_flags_at_pixel
    ld e, a
    and MSX2_CELL_BEHAVIOR_MASK
    srl a
    srl a
    srl a
    cp MSX2_CELL_BEHAVIOR_BOX
    ret z
    ld a, e
    and MSX2_CELL_SOLID_MASK
    or a
    ret
.collision_box_runtime_solid:
    ld a, MSX2_CELL_SOLID_MASK
    or a
    ret


msx2_effect_at_pixel:
    ; B=x pixel, C=y pixel. Returns A=effect enum 0..3 with Z set when empty.
    ; HL points at the mutable effects-layer byte so callers may clear it.
    ; Clobbers AF/DE/HL. Preserves BC inputs.
    call msx2_cell_effect_at_pixel
    ret

msx2_cell_flags_at_pixel:
    ; B=x pixel, C=y pixel. Returns A=packed cell flags, Z set when zero.
    ; HL points at the mutable packed flag cell in msx2_cell_flags_runtime_cache.
    ; Clobbers AF/DE/HL. Preserves BC inputs.
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
    ld hl, msx2_cell_flags_runtime_cache
    add hl, de
    ld a, (hl)
    or a
    ret

msx2_cell_solid_at_pixel:
    ; B=x pixel, C=y pixel. Returns A=solid mask (#01) or 0. Preserves BC inputs.
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
    and MSX2_CELL_SOLID_MASK
    ret

msx2_cell_effect_at_pixel:
    ; B=x pixel, C=y pixel. Returns A=effect enum 0..3. Preserves BC inputs.
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

msx2_cell_behavior_at_pixel:
    ; B=x pixel, C=y pixel. Returns A=behavior enum 0..7. Preserves BC inputs.
    call msx2_cell_flags_at_pixel
    and MSX2_CELL_BEHAVIOR_MASK
    srl a
    srl a
    srl a
    ret

msx2_clear_effect_bits_at_hl:
    ; HL=effects-layer cell. Clears the effect byte for collectibles/exits.
    ; Clobbers AF. Preserves HL.
    xor a
    ld (hl), a
    ret

msx2_hazard_hit_at_pixel:
    ; B=x pixel, C=y pixel. Returns A=1 when inside a dangerous tile hitbox, else A=0.
    ; Clobbers AF/DE/HL. Preserves BC inputs.
    push bc
    push de
    push hl
    ld a, c
    sub 192
    jp nc, .hazard_miss_full
    ld a, b
    srl a
    srl a
    srl a
    srl a
    cp 16
    jp nc, .hazard_miss_full
    ld d, a
    ld a, c
    srl a
    srl a
    srl a
    srl a
    cp 12
    jp nc, .hazard_miss_full
    ld e, a
    ld a, e
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld a, d
    add a, l
    ld l, a
    ld h, 0
    ld d, h
    ld e, l
    push de
    ld hl, (msx2_current_effects_ptr)
    add hl, de
    ld a, (hl)
    pop de
    cp 1
    jp nz, .hazard_miss_full
    ld hl, msx2_visual_map_cache
    add hl, de
    ld a, (hl)
    ld e, a
    ld d, 0
    ld a, e
    cp msx2_hazard_hitbox_count
    jp nc, .hazard_miss_full
    ld hl, msx2_hazard_hitbox_cache
    sla e
    sla e
    ld d, 0
    add hl, de
    ld a, (hl)
    ld (msx2_hazard_probe_ox), a
    inc hl
    ld a, (hl)
    ld (msx2_hazard_probe_oy), a
    inc hl
    ld a, (hl)
    ld (msx2_hazard_probe_w), a
    inc hl
    ld a, (hl)
    ld (msx2_hazard_probe_h), a
    ld a, (msx2_hazard_probe_w)
    or a
    jp z, .hazard_miss_full
    ld a, (msx2_hazard_probe_h)
    or a
    jp z, .hazard_miss_full
    pop hl
    pop de
    pop bc
    ld a, (msx2_hazard_probe_ox)
    ld d, a
    ld a, (msx2_hazard_probe_oy)
    ld e, a
    ld a, (msx2_hazard_probe_w)
    ld h, a
    ld a, (msx2_hazard_probe_h)
    ld l, a
    ld a, b
    and #0F
    cp d
    jp c, .hazard_miss_only
    sub d
    cp h
    jp nc, .hazard_miss_only
    ld a, c
    and #0F
    cp e
    jp c, .hazard_miss_only
    sub e
    cp l
    jp nc, .hazard_miss_only
    ld a, 1
    ret
.hazard_miss_only:
    xor a
    ret
.hazard_miss_full:
    pop hl
    pop de
    pop bc
    xor a
    ret

msx2_probe_player_hazard_hit:
    ; Returns A=1 when any player body probe overlaps a tile hazard hitbox.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_player_sprite_x)
    inc a
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 15
    ld c, a
    call msx2_hazard_hit_at_pixel
    or a
    ret nz
    ld a, (msx2_player_sprite_x)
    add a, 14
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 15
    ld c, a
    call msx2_hazard_hit_at_pixel
    or a
    ret nz
    ld a, (msx2_player_sprite_x)
    add a, 8
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_hazard_hit_at_pixel
    or a
    ret nz
    ld a, (msx2_player_sprite_x)
    inc a
    ld b, a
    ld a, (msx2_player_sprite_y)
    inc a
    ld c, a
    call msx2_hazard_hit_at_pixel
    or a
    ret nz
    ld a, (msx2_player_sprite_x)
    add a, 14
    ld b, a
    ld a, (msx2_player_sprite_y)
    inc a
    ld c, a
    call msx2_hazard_hit_at_pixel
    or a
    ret nz
    ld a, (msx2_player_sprite_x)
    inc a
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_hazard_hit_at_pixel
    or a
    ret nz
    ld a, (msx2_player_sprite_x)
    add a, 14
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_hazard_hit_at_pixel
    ret

msx2_behavior_at_pixel:
    ; B=x pixel, C=y pixel. Returns A=behavior byte with Z set when empty.
    ; Clobbers AF/BC/DE/HL.
    call msx2_cell_flags_at_pixel
    and MSX2_CELL_BEHAVIOR_MASK
    srl a
    srl a
    srl a
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
    ld hl, msx2_player_gravity_vel
    ld (hl), a
    inc hl
    ld (hl), a
    ld (msx2_player_flags), a
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
    ld (msx2_enemy_bullet_1_active), a
    ld (msx2_enemy_bullet_1_x), a
    ld (msx2_enemy_bullet_1_y), a
    ld (msx2_player_anim_counter), a
    ld (msx2_player_anim_frame), a
    ld a, #01
    ld (msx2_player_flags), a
    ld a, #FF
    ld (msx2_wall_slide_side), a
    xor a
    ld (msx2_wall_jump_lock_timer), a
    ld (msx2_wall_jump_lock_vx), a
    ld (msx2_wall_jump_key_lock), a

    ret




msx2_control_wall_jump_pressed:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_control_wall_jump_pressed
    ; PURPOSE: A=1 when the configured wall jump skill input combo is held.
    ; INPUT: none (reads joystick/keyboard via BIOS).
    ; OUTPUT: A=1 pressed, A=0 not pressed (Z set when not pressed).
    ; DESTROYS: AF, BC, DE (GTSTCK / msx2_read_control_buttons BIOS paths).
    ; PRESERVES: HL, IX, IY.
    ; ------------------------------------------------------------
    call msx2_control_jump_pressed
    or a
    ret z
    ld a, 1
    ret

msx2_wall_jump_detect_contact:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_wall_jump_detect_contact
    ; PURPOSE: Probes left and right for solid wall contact using the
    ;   same probe offsets as move_hardware_sprite_left/right. This
    ;   ensures detection fires when the player is blocked by a wall
    ;   (the movement code stops the player platformMoveSpeed pixels
    ;   short, so the exact sprite edge is never inside a solid cell).
    ;   Returns A=0 if left wall, A=1 if right wall, A=0xFF if none.
    ; NOTES: msx2_collision_at_pixel clobbers AF/DE/HL. BC inputs survive.
    ; ------------------------------------------------------------
    push de
    ; Left probe: same X as move_hardware_sprite_left (X - speed)
    ld a, (msx2_player_sprite_x)
    sub #02
    jp c, .left_probe_skip
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    or a
    jr nz, .wall_contact_left
.left_probe_skip:
    ; Right probe: same X as move_hardware_sprite_right (X + speed + 15)
    ld a, (msx2_player_sprite_x)
    add a, #02
    add a, 15
    ld b, a
    ld a, (msx2_player_sprite_y)
    add a, 8
    ld c, a
    call msx2_collision_at_pixel
    or a
    jr nz, .wall_contact_right
    pop de
    ld a, #FF
    ret
.wall_contact_left:
    pop de
    xor a
    ret
.wall_contact_right:
    pop de
    ld a, 1
    ret

msx2_wall_jump_slide_clamp:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_wall_jump_slide_clamp
    ; PURPOSE: Caps gravityVel high byte to wallSlideSpeed when
    ;   wall_slide is active and the player is falling. Skips when
    ;   wall_slide is inactive (msx2_wall_slide_side == 0xFF).
    ; NOTES: Polarities:
    ;   - Skip if slide side == 0xFF (cp #FF; ret z)
    ;   - Skip if grounded (player_flags bit 0)
    ;   - Skip if not falling (gravityVel high bit 7 = negative = rising)
    ;   - Cap if current fall speed > slideSpeed (cp b; jp c, .cap_store)
    ;   The cp/jp c is a CAP, not an ASSIGN — the cap only fires when the
    ;   current fall speed exceeds the cap. See LESSONS_LEARNED 2026-06-10
    ;   fix F for the glide precedent.
    ; ------------------------------------------------------------
    ld a, (msx2_wall_slide_side)
    cp #FF
    ret z
    ld a, (msx2_player_flags)
    bit 0, a
    ret nz
    ld hl, msx2_player_gravity_vel
    inc hl
    ld a, (hl)
    bit 7, a
    ret nz
    ld b, a
    ld a, #01
    cp b
    jp c, .wall_slide_cap_store
    ; Current fall <= cap, nothing to do. Restore A and return.
    ret
.wall_slide_cap_store:
    ld (hl), a
    dec hl
    xor a
    ld (hl), a
    ret

msx2_wall_jump_release_lock:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_wall_jump_release_lock
    ; PURPOSE: Clears the wall_jump key lock once the jump input is
    ;   released. Without this the key_lock set by the first kick stays
    ;   1 forever and only ONE wall jump is possible per life (bug found
    ;   in the 2026-06-11 OpenMSX smoke; same pattern as
    ;   msx2_dash_release_lock).
    ; INPUT: none. OUTPUT: none.
    ; DESTROYS: AF, BC, DE (via msx2_control_wall_jump_pressed). PRESERVES: HL.
    ; ------------------------------------------------------------
    call msx2_control_wall_jump_pressed
    or a
    ret nz
    xor a
    ld (msx2_wall_jump_key_lock), a
    ret

msx2_try_wall_jump_kick:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_try_wall_jump_kick
    ; PURPOSE: If wall_slide is active and the jump key is pressed
    ;   (with optional key-release lock), apply the wall_jump kick:
    ;   set msx2_player_gravity_vel = -wallJumpPower (8.8), arm the
    ;   horizontal lock with signed vx = ±wallJumpHorizontal, and
    ;   set the key_lock if requireKeyRelease is enabled.
    ; NOTES: Caller must have already updated msx2_wall_slide_side via
    ;   msx2_wall_jump_detect_contact. This routine does not probe.
    ; DESTROYS: AF, B, DE, HL.
    ; PRESERVES: C, IX, IY.
    ; ------------------------------------------------------------
    ld a, (msx2_wall_slide_side)
    cp #FF
    ret z
    ; Must be airborne (bit 0 of player_flags is grounded)
    ld a, (msx2_player_flags)
    bit 0, a
    ret nz
    call msx2_control_wall_jump_pressed
    or a
    jp z, .wall_kick_blocked
    ld a, (msx2_wall_jump_key_lock)
    or a
    jp nz, .wall_kick_blocked
    ; Apply wall_jump kick.
    ; gravityVel: high byte = signed -wallJumpPower (negative = up), low = 0
    ld hl, msx2_player_gravity_vel
    ld a, #FC
    inc hl
    ld (hl), a
    dec hl
    xor a
    ld (hl), a
    ; Compute signed lock_vx based on which wall we are on.
    ; Left wall (side=0) -> push right -> vx = +wallJumpHorizontal
    ; Right wall (side=1) -> push left -> vx = -wallJumpHorizontal
    ld a, (msx2_wall_slide_side)
    or a
    jr z, .wall_kick_push_right
    ; side == 1 (right wall): vx = -N via cpl/inc
    ld a, #04
    cpl
    inc a
    jr .wall_kick_store_vx
.wall_kick_push_right:
    ld a, #04
.wall_kick_store_vx:
    ld (msx2_wall_jump_lock_vx), a
    ld a, #08
    ld (msx2_wall_jump_lock_timer), a
    ld a, 1
    ld (msx2_wall_jump_key_lock), a
    ; Clear slide state so we don't immediately re-trigger.
    ld a, #FF
    ld (msx2_wall_slide_side), a
    ret
.wall_kick_blocked:
    ret

msx2_step_wall_jump_lock:
    ; ------------------------------------------------------------
    ; FUNCTION: msx2_step_wall_jump_lock
    ; PURPOSE: While lock_timer > 0, advance sprite_x by lock_vx (which
    ;   is stored SIGNED: +N for right motion, 0x100-N for left motion)
    ;   and decrement the timer. When the timer reaches 0, clear
    ;   lock_vx to avoid stale data leaking.
    ; NOTES: The MSX2 player runtime does not store a persistent vx
    ;   variable; horizontal motion is applied directly to sprite_x by
    ;   'move_hardware_sprite_left/right'. To "lock vx" during the
    ;   wall_jump kick, we re-implement the motion here (same approach
    ;   as dash in msx2_step_dash_movement).
    ;   'lock_vx' is signed: +wallJumpHorizontal for right kick,
    ;   0x100-wallJumpHorizontal for left kick. 'add a, (lock_vx)' with
    ;   a "negative" lock_vx (>= 0x80) automatically subtracts because
    ;   the carry is discarded and the 2's-complement representation
    ;   wraps modulo 256.
    ; INPUT: msx2_wall_jump_lock_timer, msx2_wall_jump_lock_vx.
    ; OUTPUT: msx2_player_sprite_x advanced, dx synced with kick dir.
    ; DESTROYS: AF, B, HL.
    ; PRESERVES: C, D, E, IX, IY.
    ; ------------------------------------------------------------
    ld a, (msx2_wall_jump_lock_timer)
    or a
    ret z
    ; Sync facing direction with the lock's sign bit. high bit = 1 -> left.
    ld a, (msx2_wall_jump_lock_vx)
    bit 7, a
    ld a, 0
    jr nz, .wall_lock_face_left
    inc a
.wall_lock_face_left:
    ld (msx2_player_sprite_dx), a
    ; sprite_x += lock_vx (signed via 2's-complement wrap).
    ; NOTE: add a, (nnnn) is NOT a valid Z80 instruction; we load lock_vx through HL.
    ld hl, msx2_wall_jump_lock_vx
    ld a, (msx2_player_sprite_x)
    add a, (hl)
    ld (msx2_player_sprite_x), a
    ; Decrement lock_timer and clear lock_vx if it just hit 0.
    ld a, (msx2_wall_jump_lock_timer)
    dec a
    ld (msx2_wall_jump_lock_timer), a
    or a
    ret nz
    xor a
    ld (msx2_wall_jump_lock_vx), a
    ret






msx2_box2_grid_draw_char_block_16:
    ; Draw a 2x2 SCREEN 4 char block (16x16 px) at pixel B=x, C=y.
    ; Char base code must be preloaded in (msx2_box2_draw_char).
    ; Clobbers AF/BC/DE/HL.
    ld a, b
    srl a
    srl a
    srl a
    srl a
    ld b, a
    ld a, c
    srl a
    srl a
    srl a
    srl a
    ld c, a
    ld hl, SCREEN4_NAME_VRAM
    ld a, c
    or a
    jp z, .grid_row_done
    ld de, 64
.grid_row_loop:
    add hl, de
    dec a
    jp nz, .grid_row_loop
.grid_row_done:
    ld a, b
    add a, a
    ld e, a
    ld d, 0
    add hl, de
    ld a, (msx2_box2_draw_char)
    call WRTVRM
    inc hl
    ld a, (msx2_box2_draw_char)
    inc a
    call WRTVRM
    ld de, 31
    add hl, de
    ld a, (msx2_box2_draw_char)
    add a, 2
    call WRTVRM
    inc hl
    ld a, (msx2_box2_draw_char)
    add a, 3
    call WRTVRM
    ret


init_msx2_box2_boxes:
    ; Load box2 slots for current screen and draw idle 2x2 char blocks.
    ; Clobbers AF/BC/DE/HL.
    call msx2_reset_box2_for_current_screen
    ld a, (msx2_box2_count)
    or a
    ret z
    ld b, a
    xor a
.box2_init_loop:
    push bc
    push af
    call msx2_box2_draw_chars_for_slot
    pop af
    push af
    call msx2_box2_set_collision_for_slot
    pop af
    pop bc
    inc a
    djnz .box2_init_loop
    ret

update_msx2_box2_boxes:
    ; Advance sliding/falling box2 slots. Clobbers AF/BC/DE/HL.
    ld a, (msx2_box2_moving_slot)
    cp #FF
    jp nz, .box2_update_active
    call msx2_box2_try_gravity_falls
    ret
.box2_update_active:
    ld a, (msx2_box2_move_mode)
    or a
    jp nz, msx2_box2_update_gravity_fall
    call msx2_box2_step_slide_toward_target
    ret

msx2_box2_screen_base:
    ; Output: DE = current_screen_index * MSX2_MAX_BOX2_PER_SCREEN. Clobbers AF/DE/HL.
    ld a, (msx2_current_screen_index)
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    ex de, hl
    ret

msx2_box2_load_speed_for_slot:
    ; Input: C=slot. Output: (msx2_box2_speed_scratch)=speed. Clobbers AF/DE/HL. Preserves BC.
    push bc
    call msx2_box2_screen_base
    pop bc
    push bc
    ld hl, msx2_screen_box2_speed
    add hl, de
    add hl, bc
    ld a, (hl)
    ld (msx2_box2_speed_scratch), a
    pop bc
    ret

msx2_reset_box2_for_current_screen:
    ; Copy static box2 slots for current screen into mutable RAM.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_current_screen_index)
    ld e, a
    ld d, 0
    ld hl, msx2_screen_box2_count
    add hl, de
    ld a, (hl)
    cp MSX2_MAX_BOX2_PER_SCREEN + 1
    jr c, .box2_count_ok
    ld a, MSX2_MAX_BOX2_PER_SCREEN
.box2_count_ok:
    ld (msx2_box2_count), a
    call msx2_box2_screen_base
    ld hl, msx2_screen_box2_x
    add hl, de
    push de
    ld de, msx2_box2_runtime_x
    ld bc, MSX2_MAX_BOX2_PER_SCREEN
    ldir
    pop de
    ld hl, msx2_screen_box2_y
    add hl, de
    ld de, msx2_box2_runtime_y
    ld bc, MSX2_MAX_BOX2_PER_SCREEN
    ldir
    ld hl, msx2_box2_runtime_x
    ld de, msx2_box2_runtime_target_x
    ld bc, MSX2_MAX_BOX2_PER_SCREEN
    ldir
    ld hl, msx2_box2_runtime_y
    ld de, msx2_box2_runtime_target_y
    ld bc, MSX2_MAX_BOX2_PER_SCREEN
    ldir
    ld a, #FF
    ld (msx2_box2_moving_slot), a
    xor a
    ld (msx2_box2_move_mode), a
    ld hl, msx2_box2_runtime_moving
    ld bc, MSX2_MAX_BOX2_PER_SCREEN
.box2_clear_moving:
    ld (hl), a
    inc hl
    dec bc
    ld a, b
    or c
    jr nz, .box2_clear_moving
    ret

msx2_box2_draw_chars_for_slot:
    ; Draw idle 2x2 char block for slot A at runtime pixel coords. Clobbers AF/BC/DE/HL.
    push af
    call msx2_box2_screen_base
    pop af
    push af
    ld c, a
    ld b, 0
    ld hl, msx2_screen_box2_char_base
    add hl, de
    add hl, bc
    ld a, (hl)
    ld (msx2_box2_draw_char), a
    pop af
    ld c, a
    ld b, 0
    ld hl, msx2_box2_runtime_x
    add hl, bc
    ld d, (hl)
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld e, (hl)
    ld b, d
    ld c, e
    call msx2_box2_grid_draw_char_block_16
    ret

msx2_box2_restore_chars_for_slot:
    ; Clears the 2x2 name-table block under slot A before sprite movement.
    ; Map-origin boxes are the tile itself, so restoring their source quad would duplicate the box.
    ; Clobbers AF/BC/DE/HL.
    ld c, a
    call msx2_box2_slot_is_map_origin
    or a
    jp nz, msx2_box2_restore_map_underlay_for_slot
    ld a, c
    ld b, 0
    ld hl, msx2_box2_runtime_x
    add hl, bc
    ld d, (hl)
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld e, (hl)
    ld b, d
    ld c, e
    call screen4_name_cell_from_bc
    jp clear_screen4_name_cell_16

msx2_box2_draw_source_tile_for_slot:
    ; Input: A=slot. Draws the tile quad that represents this box at its runtime position.
    ; Clobbers AF/BC/DE/HL.
    jp msx2_box2_draw_chars_for_slot

msx2_box2_restore_map_underlay_for_slot:
    ; Input: C=slot. Restores the painted background name quad for a map-origin box.
    ; Clobbers AF/BC/DE/HL.
    push bc
    call msx2_box2_screen_base
    ld hl, msx2_screen_box2_restore_names
    add hl, de
    pop bc
    push bc
    push hl
    ld a, c
    ld e, a
    ld d, 0
    sla e
    sla e
    add hl, de
    ex de, hl
    pop hl
    pop bc
    ; DE = restore_names source quad pointer. screen4_name_cell_from_bc clobbers DE,
    ; so preserve the source pointer on the stack across the cell computation.
    push de
    ld b, 0
    ld hl, msx2_box2_runtime_x
    add hl, bc
    ld a, (hl)
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld c, (hl)
    ld b, a
    call screen4_name_cell_from_bc
    pop de
    ld a, (de)
    push hl
    push de
    call WRTVRM
    pop de
    pop hl
    inc hl
    inc de
    ld a, (de)
    push hl
    push de
    call WRTVRM
    pop de
    pop hl
    ld bc, 31
    add hl, bc
    inc de
    ld a, (de)
    push hl
    push de
    call WRTVRM
    pop de
    pop hl
    inc hl
    inc de
    ld a, (de)
    call WRTVRM
    ret

msx2_box2_slot_is_map_origin:
    ; Input: A=slot. Returns A=1 when slot comes from a painted map box tile.
    ; Clobbers AF/DE/HL. Preserves BC.
    push bc
    ld c, a
    ld b, 0
    push bc
    call msx2_box2_screen_base
    pop bc
    ld hl, msx2_screen_box2_map_origin
    add hl, de
    add hl, bc
    ld a, (hl)
    pop bc
    or a
    ret

msx2_box2_maybe_clear_map_visual_for_slot:
    ; Input: A=slot. Clears visual map cell when slot is map-origin.
    ; Clobbers AF/BC/DE/HL.
    ld c, a
    call msx2_box2_slot_is_map_origin
    or a
    ret z
    ld a, c
    call msx2_box2_clear_map_visual_for_slot
    ret

msx2_box2_maybe_restore_map_visual_for_slot:
    ; Input: A=slot. Restores visual map cell when slot is map-origin.
    ; Clobbers AF/BC/DE/HL.
    ld c, a
    call msx2_box2_slot_is_map_origin
    or a
    ret z
    ld a, c
    call msx2_box2_restore_map_visual_for_slot
    ret

msx2_box2_patch_visual_map_for_slot:
    ; Input: A=slot, B=visual tile index for the runtime map cell. Clobbers AF/BC/DE/HL.
    ld c, a
    ld a, b
    push af
    ld b, 0
    ld hl, msx2_box2_runtime_x
    add hl, bc
    ld a, (hl)
    srl a
    srl a
    srl a
    srl a
    ld d, a
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld a, (hl)
    srl a
    srl a
    srl a
    srl a
    ld e, a
    ld a, e
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld a, d
    add a, l
    ld l, a
    ld h, 0
    ex de, hl
    pop af
    ld hl, msx2_visual_map_cache
    add hl, de
    ld (hl), a
    ret

msx2_box2_clear_map_visual_for_slot:
    ; Input: A=slot. Clears visual map cell for map-origin boxes when they slide away.
    xor a
    ld b, a
    jr msx2_box2_patch_visual_map_for_slot

msx2_box2_restore_map_visual_for_slot:
    ; Input: A=slot. Restores visual map cell to the box tile index for map-origin boxes.
    ld c, a
    ld b, 0
    push bc
    call msx2_box2_screen_base
    pop bc
    push bc
    push de
    ld hl, msx2_screen_box2_map_tile_index
    add hl, de
    add hl, bc
    ld a, (hl)
    pop de
    pop bc
    ld b, a
    ld a, c
    jr msx2_box2_patch_visual_map_for_slot

msx2_box2_find_at_pixel:
    ; Input: B=probe X px, C=probe Y px. Output: A=slot or #FF. Clobbers AF/BC/DE/HL.
    ld d, b
    ld e, c
    ld a, (msx2_box2_count)
    or a
    jr z, .box2_find_none
    ld b, a
    ld c, 0
.box2_find_loop:
    push bc
    ld b, 0
    ld hl, msx2_box2_runtime_x
    add hl, bc
    ld a, (hl)
    ld h, a
    ld a, d
    sub h
    jr c, .box2_find_next
    cp 16
    jr nc, .box2_find_next
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld a, (hl)
    ld h, a
    ld a, e
    sub h
    jr c, .box2_find_next
    cp 16
    jr nc, .box2_find_next
    pop bc
    ld a, c
    ret
.box2_find_next:
    pop bc
    inc c
    djnz .box2_find_loop
.box2_find_none:
    ld a, #FF
    ret

msx2_box2_collision_index_from_bc:
    ; B=pixel X, C=pixel Y. Output DE=16x12 collision cell index. Clobbers AF/HL.
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
    ld a, b
    srl a
    srl a
    srl a
    srl a
    and #0F
    add a, l
    ld l, a
    ld h, 0
    ex de, hl
    ret

msx2_box2_patch_cell_flags_at_bc:
    ; B=x pixel, C=y pixel. A=0 clears box/solid bits, A=1 writes packed box (#29).
    ; Patches msx2_cell_flags_runtime_cache (packed CELL_FLAGS). Clobbers AF/DE/HL. Preserves BC.
    push af
    push bc
    call msx2_box2_collision_index_from_bc
    ld hl, msx2_cell_flags_runtime_cache
    add hl, de
    pop bc
    pop af
    or a
    jr nz, .box2_set_cell_box_at_hl
    ld a, (hl)
    and MSX2_CELL_BEHAVIOR_MASK
    srl a
    srl a
    srl a
    cp MSX2_CELL_BEHAVIOR_BOX
    jr nz, .box2_patch_cell_flags_done
    ld a, (hl)
    and MSX2_CELL_ZONE_MASK
    ld (hl), a
    ret
.box2_set_cell_box_at_hl:
    ld a, (hl)
    and MSX2_CELL_ZONE_MASK
    or #29
    ld (hl), a
.box2_patch_cell_flags_done:
    ret

msx2_box2_patch_collision_value_for_slot:
    ; Input: C=slot, B=0 clear or 1 set packed box at the slot runtime cell.
    ; Clobbers AF/BC/DE/HL.
    ld a, b
    push af
    ld b, 0
    ld hl, msx2_box2_runtime_x
    add hl, bc
    ld d, (hl)
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld e, (hl)
    ld b, d
    ld c, e
    pop af
    jp msx2_box2_patch_cell_flags_at_bc

msx2_box2_clear_static_origin_cell_for_slot:
    ; Input: A=slot. Clears packed box bits at the static spawn cell for this slot.
    ; Clobbers AF/BC/DE/HL.
    ld c, a
    ld b, 0
    call msx2_box2_screen_base
    push bc
    push de
    ld hl, msx2_screen_box2_x
    add hl, de
    add hl, bc
    ld d, (hl)
    ld hl, msx2_screen_box2_y
    add hl, de
    add hl, bc
    ld e, (hl)
    ld b, d
    ld c, e
    xor a
    call msx2_box2_patch_cell_flags_at_bc
    pop de
    pop bc
    ret

msx2_box2_set_collision_for_slot:
    ; Input: A=slot. Writes idle box (#29) into CELL_FLAGS at the runtime cell.
    ; Clobbers AF/BC/DE/HL.
    ld c, a
    ld b, 1
    jr msx2_box2_patch_collision_value_for_slot

msx2_box2_clear_collision_for_slot:
    ; Input: A=slot. Clears packed box bits at the runtime cell (if marked as box).
    ; Clobbers AF/BC/DE/HL.
    ld c, a
    xor a
    jr msx2_box2_patch_collision_value_for_slot

msx2_box2_slot_allows_axis:
    ; Input: C=slot, try_dx/dy set. Zero flag set when axis allows push direction.
    ; Clobbers AF/DE/HL. Preserves BC.
    push bc
    call msx2_box2_screen_base
    pop bc
    push bc
    ld hl, msx2_screen_box2_axis
    add hl, de
    add hl, bc
    ld a, (hl)
    ld e, a
    pop bc
    ld a, (msx2_box2_try_dx)
    or a
    jr z, .box2_axis_check_vert
    ld a, e
    cp 1
    jr z, .box2_axis_denied
    xor a
    ret
.box2_axis_check_vert:
    ld a, e
    or a
    jr z, .box2_axis_denied
    xor a
    ret
.box2_axis_denied:
    ld a, 1
    ret

msx2_box2_slot_requires_alignment:
    ; Input: C=slot. Zero flag set when alignment is required.
    ; Clobbers AF/DE/HL. Preserves BC.
    push bc
    call msx2_box2_screen_base
    pop bc
    push bc
    ld hl, msx2_screen_box2_align
    add hl, de
    add hl, bc
    ld a, (hl)
    pop bc
    or a
    ret

msx2_box2_player_aligned_for_push:
    ; Input: C=slot. A=0 when player is aligned for push (sprite tops match on H push).
    ; Clobbers AF/DE/HL. Preserves BC.
    call msx2_box2_slot_requires_alignment
    ret z
    push bc
    ld b, 0
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld d, (hl)
    ld a, (msx2_player_sprite_y)
    ld e, a
    ld a, d
    sub e
    jp p, .box2_align_pos
    neg
.box2_align_pos:
    cp 5
    pop bc
    ret nc
    xor a
    ret

msx2_box2_can_move_slot:
    ; Input: A=slot, try_dx/dy set. Carry SET = destination free. Clobbers AF/BC/DE/HL.
    ld c, a
    ld b, 0
    ld hl, msx2_box2_runtime_x
    add hl, bc
    ld a, (hl)
    ld d, a
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld a, (hl)
    ld e, a
    ld a, (msx2_box2_try_dx)
    or a
    jr z, .box2_move_vert
    ; Horizontal probe: one SCREEN 4 logical tile (16px).
    cp #80
    jr nc, .box2_move_left
    ld a, d
    add a, 16
    ld d, a
    jr .box2_move_check
.box2_move_left:
    ld a, d
    sub 16
    ld d, a
    jr .box2_move_check
.box2_move_vert:
    ld a, (msx2_box2_try_dy)
    ; Vertical probe: one SCREEN 4 logical tile (16px).
    cp #80
    jr nc, .box2_move_up
    ld a, e
    add a, 16
    ld e, a
    jr .box2_move_check
.box2_move_up:
    ld a, e
    sub 16
    ld e, a
.box2_move_check:
    ld a, d
    cp 241
    jr nc, .box2_move_blocked
    ld a, e
    cp 177
    jr nc, .box2_move_blocked
    push bc
    push de
    ld b, d
    ld c, e
    call msx2_box2_find_at_pixel
    pop de
    pop bc
    cp #FF
    jr z, .box2_move_check_collision
    cp c
    jr z, .box2_move_free
    ld (msx2_box2_active), a
    call msx2_box2_can_move_slot
    ret
.box2_move_check_collision:
    push de
    ld b, d
    ld c, e
    call msx2_collision_at_pixel
    pop de
    jr nz, .box2_move_blocked
    push de
    ld a, d
    add a, 15
    ld b, a
    ld c, e
    call msx2_collision_at_pixel
    pop de
    jr nz, .box2_move_blocked
    push de
    ld a, e
    add a, 15
    ld c, a
    ld b, d
    call msx2_collision_at_pixel
    pop de
    jr nz, .box2_move_blocked
    push de
    ld a, d
    add a, 15
    ld b, a
    ld a, e
    add a, 15
    ld c, a
    call msx2_collision_at_pixel
    pop de
    jr nz, .box2_move_blocked
    scf
    ret
.box2_move_free:
    scf
    ret
.box2_move_blocked:
    or a
    ret

msx2_box2_start_slide:
    ; Input: A=slot. Starts slide toward one cell in try_dx/dy direction.
    ; Clobbers AF/BC/DE/HL.
    ld c, a
    ld a, (msx2_box2_moving_slot)
    cp #FF
    ret nz
    ld a, c
    ld b, 0
    push bc
    ld a, c
    call msx2_box2_clear_collision_for_slot
    pop bc
    push bc
    ; Erase box at current position before moving
    ld a, c
    call msx2_box2_restore_chars_for_slot
    pop bc
    push bc
    ld a, c
    call msx2_box2_maybe_clear_map_visual_for_slot
    pop bc
    push bc
    ld hl, msx2_box2_runtime_x
    add hl, bc
    ld a, (hl)
    ld d, a
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld a, (hl)
    ld e, a
    ld a, (msx2_box2_try_dx)
    or a
    jr z, .box2_target_vert
    ; Horizontal push: move exactly one SCREEN 4 logical tile (16px).
    cp #80
    jr nc, .box2_target_left
    ld a, d
    add a, 16
    ld d, a
    jr .box2_target_store
.box2_target_left:
    ld a, d
    sub 16
    ld d, a
    jr .box2_target_store
.box2_target_vert:
    ld a, (msx2_box2_try_dy)
    ; Vertical push: move exactly one SCREEN 4 logical tile (16px).
    cp #80
    jr nc, .box2_target_up
    ld a, e
    add a, 16
    ld e, a
    jr .box2_target_store
.box2_target_up:
    ld a, e
    sub 16
    ld e, a
.box2_target_store:
    ld hl, msx2_box2_runtime_target_x
    add hl, bc
    ld a, d
    ld (hl), a
    ld hl, msx2_box2_runtime_target_y
    add hl, bc
    ld a, e
    ld (hl), a
    ld hl, msx2_box2_runtime_moving
    add hl, bc
    ld a, 1
    ld (hl), a
    pop bc
    ld a, c
    ld (msx2_box2_moving_slot), a
    xor a
    ld (msx2_box2_move_mode), a
    call refresh_msx2_box2_hardware_sprite_sat
    ret

msx2_box2_finish_slide:
    ; Snap to 16px grid. If gravity is enabled and no support exists below,
    ; keep the box as a sprite and continue directly into fall mode.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_box2_moving_slot)
    cp #FF
    ret z
    ld c, a
    ld b, 0
    ld hl, msx2_box2_runtime_x
    add hl, bc
    ld a, (hl)
    and #F0
    ld (hl), a
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld a, (hl)
    and #F0
    ld (hl), a
    ld hl, msx2_box2_runtime_target_x
    add hl, bc
    ld a, (hl)
    and #F0
    ld (hl), a
    ld hl, msx2_box2_runtime_target_y
    add hl, bc
    ld a, (hl)
    and #F0
    ld (hl), a
    call msx2_box2_slot_has_gravity
    jp z, .box2_finish_draw_chars
    ld a, (msx2_box2_moving_slot)
    ld (msx2_box2_active), a
    call msx2_box2_slot_has_support
    jp c, .box2_finish_draw_chars
    ld a, 1
    ld (msx2_box2_move_mode), a
    ret
.box2_finish_draw_chars:
    ld a, (msx2_box2_moving_slot)
    call msx2_box2_clear_static_origin_cell_for_slot
    ld a, (msx2_box2_moving_slot)
    call msx2_box2_draw_source_tile_for_slot
    ld a, (msx2_box2_moving_slot)
    call msx2_box2_set_collision_for_slot
    ld a, (msx2_box2_moving_slot)
    call msx2_box2_maybe_restore_map_visual_for_slot
    ld a, (msx2_box2_moving_slot)
    ld c, a
    ld b, 0
    ld hl, msx2_box2_runtime_moving
    add hl, bc
    xor a
    ld (hl), a
    ld a, #FF
    ld (msx2_box2_moving_slot), a
    xor a
    ld (msx2_box2_move_mode), a
    ret

msx2_box2_step_slide_toward_target:
    ; Input: (msx2_box2_moving_slot)=active slot. Clobbers AF/BC/DE/HL.
    ld a, (msx2_box2_moving_slot)
    ld c, a
    ld b, 0
    call msx2_box2_load_speed_for_slot
    ld a, (msx2_box2_speed_scratch)
    ld d, a
    ld hl, msx2_box2_runtime_x
    add hl, bc
    ld e, (hl)
    ld hl, msx2_box2_runtime_target_x
    add hl, bc
    ld a, (hl)
    cp e
    jr z, .box2_step_y_axis
    jr c, .box2_step_x_backward
    ld a, e
    add a, d
    cp (hl)
    jr c, .box2_step_x_write
    jr z, .box2_step_x_write
    ld a, (hl)
    jr .box2_step_x_write
.box2_step_x_backward:
    ld a, e
    sub d
    cp (hl)
    jr nc, .box2_step_x_write
    ld a, (hl)
.box2_step_x_write:
    ld hl, msx2_box2_runtime_x
    add hl, bc
    ld (hl), a
.box2_step_y_axis:
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld e, (hl)
    ld hl, msx2_box2_runtime_target_y
    add hl, bc
    ld a, (hl)
    cp e
    jr z, .box2_step_done_check
    jr c, .box2_step_y_backward
    ld a, e
    add a, d
    cp (hl)
    jr c, .box2_step_y_write
    jr z, .box2_step_y_write
    ld a, (hl)
    jr .box2_step_y_write
.box2_step_y_backward:
    ld a, e
    sub d
    cp (hl)
    jr nc, .box2_step_y_write
    ld a, (hl)
.box2_step_y_write:
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld (hl), a
.box2_step_done_check:
    ld hl, msx2_box2_runtime_x
    add hl, bc
    ld a, (hl)
    ld e, a
    ld hl, msx2_box2_runtime_target_x
    add hl, bc
    ld a, (hl)
    cp e
    jr nz, .box2_step_continue
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld a, (hl)
    ld e, a
    ld hl, msx2_box2_runtime_target_y
    add hl, bc
    ld a, (hl)
    cp e
    jr nz, .box2_step_continue
    jp msx2_box2_finish_slide
.box2_step_continue:
    ld a, (msx2_box2_moving_slot)
    call refresh_msx2_box2_hardware_sprite_sat
    ret


msx2_box2_slot_has_gravity:
    ; Input: C=slot. Zero flag clear when gravity is enabled. Clobbers AF/DE/HL. Preserves BC.
    push bc
    call msx2_box2_screen_base
    pop bc
    push bc
    ld hl, msx2_screen_box2_gravity
    add hl, de
    add hl, bc
    ld a, (hl)
    pop bc
    or a
    ret

msx2_box2_slot_has_support:
    ; Input: (msx2_box2_active)=slot. Carry SET when supported below.
    ; Probes only the row below (y+16). The box's own 16px collision cell
    ; may still be solid while idle, so y+15 would make it support itself.
    ; Clobbers AF/BC/DE/HL. BC probe inputs survive msx2_collision_at_pixel; DE does not.
    ld a, (msx2_box2_active)
    ld c, a
    ld b, 0
    ld hl, msx2_box2_runtime_x
    add hl, bc
    ld d, (hl)
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld a, (hl)
    add a, 16
    ld e, a
    push de
    ld b, d
    ld c, e
    call msx2_collision_at_pixel
    pop de
    jr nz, .box2_supported
    push de
    ld a, d
    add a, 15
    ld b, a
    ld c, e
    call msx2_collision_at_pixel
    pop de
    jr nz, .box2_supported
    ld a, (msx2_box2_active)
    ld c, a
    ld b, 0
    ld hl, msx2_box2_runtime_x
    add hl, bc
    ld d, (hl)
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld a, (hl)
    ld b, d
    add a, 16
    ld c, a
    call msx2_box2_find_at_pixel
    cp #FF
    jr z, .box2_unsupported
    ld c, a
    ld a, (msx2_box2_active)
    cp c
    jr z, .box2_unsupported
.box2_supported:
    scf
    ret
.box2_unsupported:
    or a
    ret

msx2_box2_try_gravity_falls:
    ; Start gravity fall for first unsupported gravity-enabled idle slot.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_box2_count)
    or a
    ret z
    ld b, a
    ld c, 0
.box2_gravity_scan:
    push bc
    call msx2_box2_slot_has_gravity
    jr z, .box2_gravity_next
    ld a, c
    ld (msx2_box2_active), a
    call msx2_box2_slot_has_support
    jr c, .box2_gravity_next
    pop bc
    ld a, c
    call msx2_box2_start_gravity_fall
    ret
.box2_gravity_next:
    pop bc
    inc c
    djnz .box2_gravity_scan
    ret

msx2_box2_start_gravity_fall:
    ; Input: A=slot. Starts pixel fall when unsupported below. Clobbers AF/BC/DE/HL.
    ld c, a
    ld b, 0
    push bc
    ld a, c
    call msx2_box2_clear_collision_for_slot
    pop bc
    push bc
    ld a, c
    call msx2_box2_restore_chars_for_slot
    pop bc
    push bc
    ld a, c
    call msx2_box2_maybe_clear_map_visual_for_slot
    pop bc
    ld hl, msx2_box2_runtime_moving
    add hl, bc
    ld a, 1
    ld (hl), a
    ld a, c
    ld (msx2_box2_moving_slot), a
    ld a, 1
    ld (msx2_box2_move_mode), a
    ret

msx2_box2_update_gravity_fall:
    ; Input: moving_slot = falling slot. Clobbers AF/BC/DE/HL.
    ld a, (msx2_box2_moving_slot)
    ld (msx2_box2_active), a
    call msx2_box2_slot_has_support
    jr c, msx2_box2_finish_gravity_fall
    ld a, (msx2_box2_moving_slot)
    ld c, a
    ld b, 0
    call msx2_box2_load_speed_for_slot
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld a, (hl)
    ld hl, msx2_box2_speed_scratch
    add a, (hl)
    cp 177
    jp nc, msx2_box2_finish_gravity_fall
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld (hl), a
    ld a, (msx2_box2_moving_slot)
    call refresh_msx2_box2_hardware_sprite_sat
    ret


msx2_box2_finish_gravity_fall:
    ; Snap Y, draw chars immediately. Clobbers AF/BC/DE/HL.
    ld a, (msx2_box2_moving_slot)
    cp #FF
    ret z
    ld c, a
    ld b, 0
    ld hl, msx2_box2_runtime_y
    add hl, bc
    ld a, (hl)
    and #F0
    ld (hl), a
    ld a, (msx2_box2_moving_slot)
    call msx2_box2_clear_static_origin_cell_for_slot
    ld a, (msx2_box2_moving_slot)
    call msx2_box2_draw_source_tile_for_slot
    ld a, (msx2_box2_moving_slot)
    call msx2_box2_set_collision_for_slot
    ld a, (msx2_box2_moving_slot)
    call msx2_box2_maybe_restore_map_visual_for_slot
    ld a, (msx2_box2_moving_slot)
    ld c, a
    ld b, 0
    ld hl, msx2_box2_runtime_moving
    add hl, bc
    xor a
    ld (hl), a
    ld a, #FF
    ld (msx2_box2_moving_slot), a
    xor a
    ld (msx2_box2_move_mode), a
    ret

msx2_try_box2_from_player:
    ; Probe one cell ahead. Carry SET = blocked by box. Carry CLEAR = free or push started.
    ; Clobbers AF/BC/DE/HL.
    ld a, (msx2_box2_count)
    or a
    ret z
    ld a, (msx2_box2_moving_slot)
    cp #FF
    jr z, .box2_try_idle
    ld a, (msx2_box2_move_mode)
    or a
    jr nz, .box2_player_blocked
    ; Horizontal slide active: block the player until the box finishes moving.
    jp .box2_player_blocked
.box2_try_idle:
    ld a, (msx2_player_sprite_x)
    ld b, a
    ld a, (msx2_player_sprite_y)
    ld c, a
    ld a, (msx2_box2_try_dx)
    or a
    jr z, .box2_probe_vert_setup
    push af
    ld a, c
    add a, 8
    ld c, a
    pop af
    cp #80
    jp nc, .box2_probe_left
    ; Leading right edge at the movement target (x + speed + 15), same pixel
    ; as move_hardware_sprite_right's collision probe.
    ld a, b
    add a, 17
    ld b, a
    jr .box2_probe_ready
.box2_probe_left:
    ; Leading left edge at the movement target (x - speed), same pixel as
    ; move_hardware_sprite_left's collision probe.
    ld a, b
    sub 2
    ld b, a
    jr .box2_probe_ready
.box2_probe_vert_setup:
    ld a, c
    add a, 8
    ld c, a
    ret
.box2_probe_ready:
    call msx2_box2_find_at_pixel
    cp #FF
    jr z, .box2_player_free
    ld c, a
    push bc
    call msx2_box2_slot_allows_axis
    pop bc
    or a
    jr nz, .box2_player_blocked
    push bc
    call msx2_box2_player_aligned_for_push
    pop bc
    or a
    jr nz, .box2_player_blocked
    ld a, c
    ld (msx2_box2_active), a
    call msx2_box2_can_move_slot
    jr nc, .box2_player_blocked
    ld a, (msx2_box2_active)
    call msx2_box2_start_slide
.box2_player_free:
    or a
    ret
.box2_player_blocked:
    scf
    ret



msx2_try_world_edge_transition_left:
    ld a, (msx2_current_screen_index)
    cp 0
    jp z, .left_screen_0
    cp 1
    jp z, .left_screen_1
    jp upload_hardware_sprite_attrs
.left_screen_0:
    jp upload_hardware_sprite_attrs

.left_screen_1:
    ld a, 0
    ld (msx2_current_screen_index), a
    call load_PANTALLA1_screen4
    call msx2_reset_screen_transition_flags
    call msx2_reset_enemy_runtime_for_current_screen
    call msx2_load_current_screen_air
    call draw_msx2_air_hud
    ld a, 231
    ld (msx2_player_sprite_x), a
    xor a
    ld hl, msx2_player_gravity_vel
    ld (hl), a
    inc hl
    ld (hl), a
    ld (msx2_player_flags), a
    jp update_hardware_sprite_vertical

msx2_try_world_edge_transition_right:
    ld a, (msx2_current_screen_index)
    cp 0
    jp z, .right_screen_0
    cp 1
    jp z, .right_screen_1
    jp upload_hardware_sprite_attrs
.right_screen_0:
    ld a, 1
    ld (msx2_current_screen_index), a
    call load_PANTALLA2_screen4
    call msx2_reset_screen_transition_flags
    call msx2_reset_enemy_runtime_for_current_screen
    call msx2_load_current_screen_air
    call draw_msx2_air_hud
    ld a, 8
    ld (msx2_player_sprite_x), a
    xor a
    ld hl, msx2_player_gravity_vel
    ld (hl), a
    inc hl
    ld (hl), a
    ld (msx2_player_flags), a
    jp update_hardware_sprite_vertical

.right_screen_1:
    jp upload_hardware_sprite_attrs

msx2_try_world_edge_transition_up:
    ld a, (msx2_current_screen_index)
    cp 0
    jp z, .up_screen_0
    cp 1
    jp z, .up_screen_1
    jp upload_hardware_sprite_attrs
.up_screen_0:
    jp upload_hardware_sprite_attrs

.up_screen_1:
    jp upload_hardware_sprite_attrs

msx2_try_world_edge_transition_down:
    ld a, (msx2_current_screen_index)
    cp 0
    jp z, .down_screen_0
    cp 1
    jp z, .down_screen_1
    jp upload_hardware_sprite_attrs
.down_screen_0:
    jp upload_hardware_sprite_attrs

.down_screen_1:
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
    ; Restores each msx2screen mutable packed cell flag layer from ROM into persistent RAM.
    ; Clobbers AF/BC/DE/HL.
    ld a, PANTALLA1_DATA_BANK
    call msx2_screen4_data_bank_enter_selected
    ld hl, PANTALLA1_CELL_FLAGS
    ld de, #C08C
    ld bc, msx2_layer_size
    ldir
    call msx2_screen4_data_bank_leave

    ld a, PANTALLA2_DATA_BANK
    call msx2_screen4_data_bank_enter_selected
    ld hl, PANTALLA2_CELL_FLAGS
    ld de, #C14C
    ld bc, msx2_layer_size
    ldir
    call msx2_screen4_data_bank_leave

    ret

load_current_msx2_screen4:
    ; Dispatches the active SCREEN 4 room by msx2_current_screen_index. Clobbers AF/BC/DE/HL.
    ld a, (msx2_current_screen_index)
    cp 0
    jp z, load_PANTALLA1_screen4
    cp 1
    jp z, load_PANTALLA2_screen4
    jp load_PANTALLA1_screen4

load_PANTALLA1_screen4:
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
    ld a, PANTALLA1_DATA_BANK
    call msx2_screen4_data_bank_enter_selected

    ld hl, PANTALLA1_BANK_0_PATTERNS
    ld de, #0000
    ld bc, 112
    call LDIRVM
    ld hl, PANTALLA1_BANK_0_COLORS
    ld de, #2000
    ld bc, 112
    call LDIRVM
    ld hl, PANTALLA1_BANK_1_PATTERNS
    ld de, #0800
    ld bc, 144
    call LDIRVM
    ld hl, PANTALLA1_BANK_1_COLORS
    ld de, #2800
    ld bc, 144
    call LDIRVM
    ld hl, PANTALLA1_BANK_2_PATTERNS
    ld de, #1000
    ld bc, 128
    call LDIRVM
    ld hl, PANTALLA1_BANK_2_COLORS
    ld de, #3000
    ld bc, 128
    call LDIRVM

    ld hl, PANTALLA1_NAMES
    ld de, SCREEN4_NAME_VRAM
    ld bc, SCREEN4_NAME_SIZE
    call LDIRVM
    call msx2_screen4_data_bank_leave

    call load_msx2_hud_font
    call draw_PANTALLA1_hud_text
    ld a, PANTALLA1_DATA_BANK
    call msx2_screen4_data_bank_enter_selected
    ld hl, PANTALLA1_COLLISION
    ld de, msx2_collision_runtime_cache
    ld bc, msx2_layer_size
    ldir
    ld hl, PANTALLA1_BEHAVIOR
    ld de, msx2_behavior_runtime_cache
    ld bc, msx2_layer_size
    ldir
    call msx2_screen4_data_bank_leave
    ld hl, msx2_collision_runtime_cache
    ld (msx2_current_collision_ptr), hl
    ld hl, msx2_behavior_runtime_cache
    ld (msx2_current_behavior_ptr), hl
    ld a, PANTALLA1_DATA_BANK
    call msx2_screen4_data_bank_enter_selected
    ld hl, PANTALLA1_CELL_FLAGS
    ld de, msx2_cell_flags_runtime_cache
    ld bc, msx2_layer_size
    ldir
    call msx2_screen4_data_bank_leave
    ld a, PANTALLA1_DATA_BANK
    call msx2_screen4_data_bank_enter_selected
    ld hl, PANTALLA1_VISUAL_MAP
    ld de, msx2_visual_map_cache
    ld bc, msx2_layer_size
    ldir
    ld hl, PANTALLA1_TILE_HAZ_HIT
    ld de, msx2_hazard_hitbox_cache
    ld bc, msx2_hazard_hitbox_cache_bytes
    ldir
    call msx2_screen4_data_bank_leave
    ld hl, #C08C
    ld (msx2_current_effects_ptr), hl
    call apply_PANTALLA1_collected_visuals
    ret

load_PANTALLA2_screen4:
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
    ld a, PANTALLA2_DATA_BANK
    call msx2_screen4_data_bank_enter_selected

    ld hl, PANTALLA2_BANK_0_PATTERNS
    ld de, #0000
    ld bc, 8
    call LDIRVM
    ld hl, PANTALLA2_BANK_0_COLORS
    ld de, #2000
    ld bc, 8
    call LDIRVM
    ld hl, PANTALLA2_BANK_1_PATTERNS
    ld de, #0800
    ld bc, 8
    call LDIRVM
    ld hl, PANTALLA2_BANK_1_COLORS
    ld de, #2800
    ld bc, 8
    call LDIRVM
    ld hl, PANTALLA2_BANK_2_PATTERNS
    ld de, #1000
    ld bc, 24
    call LDIRVM
    ld hl, PANTALLA2_BANK_2_COLORS
    ld de, #3000
    ld bc, 24
    call LDIRVM

    ld hl, PANTALLA2_NAMES
    ld de, SCREEN4_NAME_VRAM
    ld bc, SCREEN4_NAME_SIZE
    call LDIRVM
    call msx2_screen4_data_bank_leave

    call load_msx2_hud_font
    call draw_PANTALLA2_hud_text
    ld a, PANTALLA2_DATA_BANK
    call msx2_screen4_data_bank_enter_selected
    ld hl, PANTALLA2_COLLISION
    ld de, msx2_collision_runtime_cache
    ld bc, msx2_layer_size
    ldir
    ld hl, PANTALLA2_BEHAVIOR
    ld de, msx2_behavior_runtime_cache
    ld bc, msx2_layer_size
    ldir
    call msx2_screen4_data_bank_leave
    ld hl, msx2_collision_runtime_cache
    ld (msx2_current_collision_ptr), hl
    ld hl, msx2_behavior_runtime_cache
    ld (msx2_current_behavior_ptr), hl
    ld a, PANTALLA2_DATA_BANK
    call msx2_screen4_data_bank_enter_selected
    ld hl, PANTALLA2_CELL_FLAGS
    ld de, msx2_cell_flags_runtime_cache
    ld bc, msx2_layer_size
    ldir
    call msx2_screen4_data_bank_leave
    ld a, PANTALLA2_DATA_BANK
    call msx2_screen4_data_bank_enter_selected
    ld hl, PANTALLA2_VISUAL_MAP
    ld de, msx2_visual_map_cache
    ld bc, msx2_layer_size
    ldir
    ld hl, PANTALLA2_TILE_HAZ_HIT
    ld de, msx2_hazard_hitbox_cache
    ld bc, msx2_hazard_hitbox_cache_bytes
    ldir
    call msx2_screen4_data_bank_leave
    ld hl, #C14C
    ld (msx2_current_effects_ptr), hl
    call apply_PANTALLA2_collected_visuals
    ret

apply_PANTALLA1_collected_visuals:
    ; Re-erases collectibles already cleared from this screen's persistent effect RAM.
    ; Clobbers AF/BC/DE/HL.
    ; No collectible cells on this screen.
    ret

apply_PANTALLA2_collected_visuals:
    ; Re-erases collectibles already cleared from this screen's persistent effect RAM.
    ; Clobbers AF/BC/DE/HL.
    ; No collectible cells on this screen.
    ret

draw_PANTALLA1_hud_text:
    ret
    ret


draw_PANTALLA2_hud_text:
    ret
    ret



; Per-msx2screen respawn X coordinates
msx2_screen_spawn_x:
    DB #47,#7B

; Per-msx2screen respawn Y coordinates
msx2_screen_spawn_y:
    DB #70,#A5

; Per-msx2screen collectible count required before exits unlock
msx2_screen_required_collectibles:
    DB #00,#00

; Per-msx2screen initial air/time values
msx2_screen_initial_air:
    DB #FF,#FF

; Per-msx2screen HUD style: 0=compact runtime HUD, 1=status bars
msx2_screen_hud_style:
    DB #00,#00

; Per-msx2screen planned player energy maximum
msx2_screen_hud_player_energy_max:
    DB #10,#10

; Per-msx2screen planned player energy initial value
msx2_screen_hud_player_energy_initial:
    DB #10,#10

; Per-msx2screen planned boss energy maximum
msx2_screen_hud_boss_energy_max:
    DB #10,#10

; Per-msx2screen planned boss energy initial value
msx2_screen_hud_boss_energy_initial:
    DB #10,#10

; Per-msx2screen planned player energy/fill color slot
msx2_screen_hud_primary_color:
    DB #0A,#0A

; Per-msx2screen planned boss/secondary color slot
msx2_screen_hud_secondary_color:
    DB #08,#08

; Per-msx2screen planned HUD border color slot
msx2_screen_hud_border_color:
    DB #0F,#0F

; Per-msx2screen planned HUD empty/background color slot
msx2_screen_hud_empty_color:
    DB #04,#04

msx2_screen_hud_widget_record_size EQU 12
; Per-msx2screen authored HUD widget counts
msx2_screen_hud_widget_count:
    DB #00,#00

; Per-msx2screen byte offsets into msx2_screen_hud_widget_records
msx2_screen_hud_widget_offset:
    DB #00,#00,#00,#00

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



; Per-msx2screen active enemy/hazard entity count, capped at 12
msx2_screen_enemy_count:
    DB #00,#00

; Per-msx2screen enemy/hazard entity X coordinates, 12 slots per screen
msx2_screen_enemy_x:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard entity Y coordinates, 12 slots per screen
msx2_screen_enemy_y:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard patrol minimum X, 12 slots per screen
msx2_screen_enemy_min_x:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard patrol maximum X, 12 slots per screen
msx2_screen_enemy_max_x:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard patrol minimum Y, 12 slots per screen
msx2_screen_enemy_min_y:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard patrol maximum Y, 12 slots per screen
msx2_screen_enemy_max_y:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard initial movement direction, 12 slots per screen
msx2_screen_enemy_dx:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard initial vertical movement direction, 12 slots per screen
msx2_screen_enemy_dy:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard movement component mode, 12 slots per screen
msx2_screen_enemy_mode:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard movement component frame delay, 12 slots per screen
msx2_screen_enemy_speed:
    DB #02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02
    DB #02,#02,#02,#02,#02,#02,#02,#02

; Per-msx2screen enemy/hazard score value, 12 slots per screen
msx2_screen_enemy_score:
    DB #01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01
    DB #01,#01,#01,#01,#01,#01,#01,#01

; Per-screen box2 count
msx2_screen_box2_count:
    DB #04,#00

; Per-screen box2 initial X (8-aligned px), 8 slots/screen
msx2_screen_box2_x:
    DB #A0,#60,#B0,#50,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Per-screen box2 initial Y (8-aligned px), 8 slots/screen
msx2_screen_box2_y:
    DB #50,#70,#90,#A0,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Per-screen box2 2x2 char block base, 8 slots/screen
msx2_screen_box2_char_base:
    DB #09,#09,#09,#09,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Per-screen box2 slide speed (px/frame), 8 slots/screen
msx2_screen_box2_speed:
    DB #01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01

; Per-screen box2 gravity flag, 8 slots/screen
msx2_screen_box2_gravity:
    DB #01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01

; Per-screen box2 requires-alignment flag, 8 slots/screen
msx2_screen_box2_align:
    DB #01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01

; Per-screen box2 push axis (0=H,1=V,2=both), 8 slots/screen
msx2_screen_box2_axis:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Per-screen box2 map-tile origin flag (1=painted tile), 8 slots/screen
msx2_screen_box2_map_origin:
    DB #01,#01,#01,#01,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Per-screen box2 source map tile index, 8 slots/screen
msx2_screen_box2_map_tile_index:
    DB #02,#02,#02,#02,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; Per-screen box2 restore name quads for map tiles, 8 slots x 4 bytes
msx2_screen_box2_restore_names:
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00







    ds #C000 - $, #FF

; ==================================================================
; MSX2 SCREEN 4 cold data bank 0.
; Mapped to P2/#8000 only while copying palette, sprite patterns, and
; screen pattern/name data into VRAM. Resident gameplay code restores P2
; before returning to normal execution.
; ==================================================================
MSX2_SCREEN4_DATA_BANK_0_PHYS_START:
    org #8000
MSX2_SCREEN4_DATA_BANK_0_ROM_START:
MSX2_SCREEN4_DATA_BANK_ROM_START:

; Palette bytes: byte1=(R<<4)|B, byte2=G
screen4_palette_data:
    DB #00,#00,#00,#00,#22,#05,#33,#06,#15,#01,#27,#02,#51,#01,#36,#06
    DB #72,#02,#74,#04,#52,#05,#63,#06,#12,#04,#55,#02,#44,#04,#77,#07

; MSX2 SCREEN 4 HUD font patterns: space, digits, A-Z, colon, dash, slash
msx2_hud_font_patterns:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#3C,#66,#6E,#76,#66,#66,#3C,#00
    DB #18,#38,#18,#18,#18,#18,#7E,#00,#3C,#66,#06,#1C,#30,#60,#7E,#00
    DB #3C,#66,#06,#1C,#06,#66,#3C,#00,#0C,#1C,#3C,#6C,#7E,#0C,#0C,#00
    DB #7E,#60,#7C,#06,#06,#66,#3C,#00,#1C,#30,#60,#7C,#66,#66,#3C,#00
    DB #7E,#06,#0C,#18,#30,#30,#30,#00,#3C,#66,#66,#3C,#66,#66,#3C,#00
    DB #3C,#66,#66,#3E,#06,#0C,#38,#00,#18,#3C,#66,#66,#7E,#66,#66,#00
    DB #7C,#66,#66,#7C,#66,#66,#7C,#00,#3C,#66,#60,#60,#60,#66,#3C,#00
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


msx2_hw_sprite_patterns:
; Hardware metasprite frame 0 part 0: x+0, y+0
msx2_hw_sprite_frame_0_pattern_0:
    DB #00,#00,#00,#00,#00,#00,#08,#1B,#2F,#17,#03,#07,#07,#07,#38,#3C
    DB #00,#00,#00,#10,#68,#94,#9E,#FE,#F8,#C8,#C0,#E0,#80,#80,#70,#78
; Hardware metasprite frame 0 part 1: x+0, y+0
msx2_hw_sprite_frame_0_pattern_1:
    DB #00,#00,#00,#1F,#3F,#7F,#77,#64,#50,#28,#1C,#08,#00,#00,#00,#00
    DB #00,#00,#00,#E0,#90,#48,#40,#00,#00,#10,#20,#00,#00,#00,#00,#00
; Hardware metasprite frame 1 part 0: x+0, y+0
msx2_hw_sprite_frame_1_pattern_0:
    DB #00,#00,#1F,#00,#00,#08,#1B,#2E,#16,#03,#07,#07,#01,#01,#03,#03
    DB #00,#00,#E0,#60,#90,#9E,#FE,#F8,#08,#00,#E0,#80,#00,#00,#80,#C0
; Hardware metasprite frame 1 part 1: x+0, y+0
msx2_hw_sprite_frame_1_pattern_1:
    DB #00,#00,#00,#3F,#7F,#77,#64,#51,#28,#1C,#08,#00,#06,#00,#00,#00
    DB #00,#00,#00,#90,#48,#40,#00,#00,#F0,#00,#00,#00,#80,#00,#00,#00
; Mirrored hardware metasprite frame 0 part 0: authored right
msx2_hw_sprite_frame_0_mirror_pattern_0:
    DB #00,#00,#00,#08,#16,#29,#79,#7F,#1F,#13,#03,#07,#01,#01,#0E,#1E
    DB #00,#00,#00,#00,#00,#00,#10,#D8,#F4,#E8,#C0,#E0,#E0,#E0,#1C,#3C
; Mirrored hardware metasprite frame 0 part 1: authored right
msx2_hw_sprite_frame_0_mirror_pattern_1:
    DB #00,#00,#00,#07,#09,#12,#02,#00,#00,#08,#04,#00,#00,#00,#00,#00
    DB #00,#00,#00,#F8,#FC,#FE,#EE,#26,#0A,#14,#38,#10,#00,#00,#00,#00
; Mirrored hardware metasprite frame 1 part 0: authored right
msx2_hw_sprite_frame_1_mirror_pattern_0:
    DB #00,#00,#07,#06,#09,#79,#7F,#1F,#10,#00,#07,#01,#00,#00,#01,#03
    DB #00,#00,#F8,#00,#00,#10,#D8,#74,#68,#C0,#E0,#E0,#80,#80,#C0,#C0
; Mirrored hardware metasprite frame 1 part 1: authored right
msx2_hw_sprite_frame_1_mirror_pattern_1:
    DB #00,#00,#00,#09,#12,#02,#00,#00,#0F,#00,#00,#00,#01,#00,#00,#00
    DB #00,#00,#00,#FC,#FE,#EE,#26,#8A,#14,#38,#10,#00,#60,#00,#00,#00
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
; Push box moving hardware sprite pattern from entity Render or Tile
msx2_hw_push_box_sprite_pattern:
    DB #7F,#C0,#9F,#AF,#B7,#BB,#BD,#BE,#BE,#BD,#BB,#B7,#AF,#9F,#C0,#7F
    DB #FE,#03,#F9,#F5,#ED,#DD,#BD,#7D,#7D,#BD,#DD,#ED,#F5,#F9,#03,#FE
msx2_hw_sprite_patterns_end:

msx2_hw_sprite_colors:
; Line colors for hardware sprite layer 0
msx2_hw_sprite_colors_0:
    DB #05,#05,#0F,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#0F,#0F,#0F
; Line colors for hardware sprite layer 1
msx2_hw_sprite_colors_1:
    DB #05,#05,#05,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#05,#0F,#05,#05,#05
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
; Line colors for player bullet hardware sprite slot 0
msx2_hw_player_bullet_colors:
    DB #06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06
; Line colors for player bullet hardware sprite slot 1
msx2_hw_player_bullet_colors_1:
    DB #06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06,#06
; Line colors for enemy bullet hardware sprite slot
msx2_hw_enemy_bullet_colors:
    DB #08,#08,#08,#08,#08,#08,#08,#08,#08,#08,#08,#08,#08,#08,#08,#08
; Push box moving hardware sprite line colors
msx2_hw_push_box_sprite_colors:
    DB #0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E
msx2_hw_sprite_colors_end:

; 2 player hardware sprite(s), 12 enemy/hazard sprite slots, 2 player bullet slot, 2 enemy bullet slot; next Y=208 terminates the SAT
msx2_hw_sprite_attrs:
    DB #70,#47,#00,#00,#70,#47,#04,#00,#D0,#00,#20,#00,#D0,#00,#20,#00
    DB #D0,#00,#20,#00,#D0,#00,#20,#00,#D0,#00,#20,#00,#D0,#00,#20,#00
    DB #D0,#00,#20,#00,#D0,#00,#20,#00,#D0,#00,#20,#00,#D0,#00,#20,#00
    DB #D0,#00,#20,#00,#D0,#00,#20,#00,#D0,#00,#24,#00,#D0,#00,#24,#00
    DB #D0,#00,#28,#00,#D0,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00


; pantalla1 SCREEN 4 name table, 32x24 chars
PANTALLA1_NAMES:
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #0D,#0D,#0D,#0D,#09,#0A,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0B,#0C,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #0E,#0E,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0E,#0E,#0E,#0E,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #0F,#0F,#10,#11,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0F,#0F,#0F,#0F,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #0E,#0E,#0E,#0E,#0E,#0E,#0D,#0D,#0D,#0D,#0D,#0D,#09,#0A,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #0F,#0F,#0F,#0F,#0F,#0F,#0D,#0D,#0D,#0D,#0D,#0D,#0B,#0C,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#10,#11,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0E,#0E,#0E,#0E,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0F,#0F,#0F,#0F,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0D,#0D,#09,#0A,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0B,#0C,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#09,#0A,#0D,#0D,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0E,#0E,#0E,#0E,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0B,#0C,#0D,#0D,#0D,#0D
    DB #0D,#0D,#0D,#0D,#0F,#0F,#0F,#0F,#0D,#0D,#0D,#0D,#0D,#0D,#0D,#0D
    DB #0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E
    DB #0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E
    DB #0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F
    DB #0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F

; pantalla1 SCREEN 4 bank 0 compact patterns
PANTALLA1_BANK_0_PATTERNS:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#80,#C0,#60,#50,#48,#44,#42,#41
    DB #01,#03,#06,#0A,#12,#22,#42,#82,#41,#42,#44,#48,#50,#60,#C0,#80
    DB #82,#42,#22,#12,#0A,#06,#03,#01,#00,#00,#00,#00,#00,#00,#00,#00

; pantalla1 SCREEN 4 bank 0 compact colors
PANTALLA1_BANK_0_COLORS:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#0E,#E0,#0E,#0E,#0E,#0E,#0E,#0E
    DB #0E,#E0,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#E0,#0E
    DB #0E,#0E,#0E,#0E,#0E,#0E,#E0,#0E,#00,#00,#00,#00,#00,#00,#00,#00

; pantalla1 SCREEN 4 bank 1 compact patterns
PANTALLA1_BANK_1_PATTERNS:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#80,#C0,#60,#50,#48,#44,#42,#41
    DB #01,#03,#06,#0A,#12,#22,#42,#82,#41,#42,#44,#48,#50,#60,#C0,#80
    DB #82,#42,#22,#12,#0A,#06,#03,#01,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#F0,#F0,#F0,#F0,#F0,#F0,#F0,#F0,#F0,#F0,#F0,#F0,#F0
    DB #00,#00,#00,#00,#20,#22,#22,#00,#00,#00,#00,#00,#11,#11,#11,#00

; pantalla1 SCREEN 4 bank 1 compact colors
PANTALLA1_BANK_1_COLORS:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#0E,#E0,#0E,#0E,#0E,#0E,#0E,#0E
    DB #0E,#E0,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#E0,#0E
    DB #0E,#0E,#0E,#0E,#0E,#0E,#E0,#0E,#00,#00,#00,#00,#00,#00,#00,#00
    DB #FF,#FF,#FF,#54,#54,#54,#54,#54,#54,#54,#54,#54,#54,#54,#54,#54
    DB #00,#00,#00,#00,#60,#60,#F0,#FF,#00,#00,#00,#00,#60,#F0,#F0,#FF

; pantalla1 SCREEN 4 bank 2 compact patterns
PANTALLA1_BANK_2_PATTERNS:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#80,#C0,#60,#50,#48,#44,#42,#41
    DB #01,#03,#06,#0A,#12,#22,#42,#82,#41,#42,#44,#48,#50,#60,#C0,#80
    DB #82,#42,#22,#12,#0A,#06,#03,#01,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#F0,#F0,#F0,#F0,#F0,#F0,#F0,#F0,#F0,#F0,#F0,#F0,#F0

; pantalla1 SCREEN 4 bank 2 compact colors
PANTALLA1_BANK_2_COLORS:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#0E,#E0,#0E,#0E,#0E,#0E,#0E,#0E
    DB #0E,#E0,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#E0,#0E
    DB #0E,#0E,#0E,#0E,#0E,#0E,#E0,#0E,#00,#00,#00,#00,#00,#00,#00,#00
    DB #FF,#FF,#FF,#54,#54,#54,#54,#54,#54,#54,#54,#54,#54,#54,#54,#54

; pantalla2 SCREEN 4 name table, 32x24 chars
PANTALLA2_NAMES:
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
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01
    DB #01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01
    DB #02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02
    DB #02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02

; pantalla2 SCREEN 4 bank 0 compact patterns
PANTALLA2_BANK_0_PATTERNS:
    DB #00,#00,#00,#00,#00,#00,#00,#00

; pantalla2 SCREEN 4 bank 0 compact colors
PANTALLA2_BANK_0_COLORS:
    DB #00,#00,#00,#00,#00,#00,#00,#00

; pantalla2 SCREEN 4 bank 1 compact patterns
PANTALLA2_BANK_1_PATTERNS:
    DB #00,#00,#00,#00,#00,#00,#00,#00

; pantalla2 SCREEN 4 bank 1 compact colors
PANTALLA2_BANK_1_COLORS:
    DB #00,#00,#00,#00,#00,#00,#00,#00

; pantalla2 SCREEN 4 bank 2 compact patterns
PANTALLA2_BANK_2_PATTERNS:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#F0,#F0,#F0,#F0,#F0
    DB #F0,#F0,#F0,#F0,#F0,#F0,#F0,#F0

; pantalla2 SCREEN 4 bank 2 compact colors
PANTALLA2_BANK_2_COLORS:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#FF,#FF,#FF,#54,#54,#54,#54,#54
    DB #54,#54,#54,#54,#54,#54,#54,#54

; pantalla1 collision layer, copied from cold ROM to current RAM cache on screen load
PANTALLA1_COLLISION:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #01,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#01,#00,#00,#00,#00
    DB #01,#01,#01,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#01,#01,#01,#01,#00,#00,#00,#00,#00,#01,#01,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#01,#00,#00,#00,#00
    DB #01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01

; pantalla2 collision layer, copied from cold ROM to current RAM cache on screen load
PANTALLA2_COLLISION:
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

; pantalla1 effects layer, copied from cold ROM to RAM on screen reset
PANTALLA1_EFFECTS:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#01,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; pantalla2 effects layer, copied from cold ROM to RAM on screen reset
PANTALLA2_EFFECTS:
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

; pantalla1 behavior layer, copied from cold ROM to current RAM cache on screen load
PANTALLA1_BEHAVIOR:
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

; pantalla2 behavior layer, copied from cold ROM to current RAM cache on screen load
PANTALLA2_BEHAVIOR:
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

; pantalla1 packed cell flags (solid/effect/behavior), copied from cold ROM to current RAM cache on screen load
PANTALLA1_CELL_FLAGS:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#29,#00,#00,#00,#00,#00
    DB #01,#02,#00,#00,#00,#00,#00,#00,#00,#00,#01,#01,#00,#00,#00,#00
    DB #01,#01,#01,#00,#00,#00,#29,#00,#00,#00,#00,#00,#00,#00,#02,#00
    DB #00,#00,#00,#00,#01,#01,#01,#01,#00,#00,#00,#00,#00,#01,#01,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#29,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#29,#00,#00,#00,#00,#01,#01,#00,#00,#00,#00
    DB #01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01

; pantalla2 packed cell flags (solid/effect/behavior), copied from cold ROM to current RAM cache on screen load
PANTALLA2_CELL_FLAGS:
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

; pantalla1 visual tile index map copied to RAM on screen load
PANTALLA1_VISUAL_MAP:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#02,#00,#00,#00,#00,#00
    DB #01,#03,#00,#00,#00,#00,#00,#00,#00,#00,#01,#01,#00,#00,#00,#00
    DB #01,#01,#01,#00,#00,#00,#02,#00,#00,#00,#00,#00,#00,#00,#03,#00
    DB #00,#00,#00,#00,#01,#01,#01,#01,#00,#00,#00,#00,#00,#01,#01,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#02,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#02,#00,#00,#00,#00,#01,#01,#00,#00,#00,#00
    DB #01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01

; pantalla2 visual tile index map copied to RAM on screen load
PANTALLA2_VISUAL_MAP:
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

; pantalla1 per-tile hazard hitboxes copied to RAM on screen load
PANTALLA1_TILE_HAZ_HIT:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#0C,#10,#04

; pantalla2 per-tile hazard hitboxes copied to RAM on screen load
PANTALLA2_TILE_HAZ_HIT:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

MSX2_SCREEN4_DATA_BANK_0_USED_END:
    ds #A000 - $, #FF
    org MSX2_SCREEN4_DATA_BANK_0_PHYS_START + #2000
    end
