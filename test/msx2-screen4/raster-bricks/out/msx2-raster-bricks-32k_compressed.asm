; File: unitedFiles.asm
; ==================================================================
; Mideas MSX2 SCREEN 4 tile backend
; Project: msx2_raster_bricks_demo
; Screen mode: SCREEN 4 (Graphics II)
; ROM Mode: simple32k
; Mapper Target: konami
; Auto MegaROM: No
; MSX2 MegaROM Path: simple linear ROM
; ROM mode requested: simple32k
; Mapper requested: konami
; ==================================================================

; [[[MIDEAS_ARTIFACT:project_slice.json:BEGIN]]]
; {
;   "scope": "msx2_screen4_project_slice",
;   "projectName": "msx2_raster_bricks_demo",
;   "backend": "msx2-screen4-pattern",
;   "screenMode": "SCREEN 4 (Graphics II)",
;   "romMode": "simple32k",
;   "mapper": "konami",
;   "entryPoints": {
;     "gameFlowId": "msx2_gameflow_raster_bricks",
;     "gameFlowName": "MSX2 Raster Bricks GameFlow",
;     "worldIds": [],
;     "screenIds": [
;       "screen_msx2_raster_bricks"
;     ]
;   },
;   "includedAssets": [
;     {
;       "type": "msx2screen_tile",
;       "id": "brick_blank",
;       "name": "Black",
;       "ownerScreenId": "screen_msx2_raster_bricks",
;       "ownerWorldIds": [],
;       "reason": "Tile used by reachable native MSX2 screen"
;     },
;     {
;       "type": "msx2screen_tile",
;       "id": "brick_dark",
;       "name": "Dark Brick",
;       "ownerScreenId": "screen_msx2_raster_bricks",
;       "ownerWorldIds": [],
;       "reason": "Tile used by reachable native MSX2 screen"
;     },
;     {
;       "type": "msx2screen_tile",
;       "id": "brick_gold",
;       "name": "Gold Brick",
;       "ownerScreenId": "screen_msx2_raster_bricks",
;       "ownerWorldIds": [],
;       "reason": "Tile used by reachable native MSX2 screen"
;     },
;     {
;       "type": "msx2screen_tile",
;       "id": "brick_hot",
;       "name": "Hot Brick",
;       "ownerScreenId": "screen_msx2_raster_bricks",
;       "ownerWorldIds": [],
;       "reason": "Tile used by reachable native MSX2 screen"
;     },
;     {
;       "type": "msx2screen_tile",
;       "id": "brick_red",
;       "name": "Red Brick",
;       "ownerScreenId": "screen_msx2_raster_bricks",
;       "ownerWorldIds": [],
;       "reason": "Tile used by reachable native MSX2 screen"
;     },
;     {
;       "type": "msx2screen",
;       "id": "asset_screen_msx2_raster_bricks",
;       "name": "MSX2 Raster Bricks Screen",
;       "reason": "GameFlow Screen4Screen background"
;     },
;     {
;       "type": "palette",
;       "id": "palette_msx2_raster_bricks",
;       "name": "MSX2 Raster Bricks Palette",
;       "reason": "Active native MSX2 SCREEN 4 palette source"
;     }
;   ],
;   "excludedAssets": [
;     {
;       "type": "msx2gameflow",
;       "id": "asset_msx2_gameflow_raster_bricks",
;       "name": "MSX2 Raster Bricks GameFlow",
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
;     "runtime.msx2.layers.behavior"
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
;       "reason": "Collision layer pointers are part of the current runtime contract"
;     },
;     {
;       "id": "runtime.msx2.layers.effects",
;       "placement": "resident",
;       "reason": "Effects layer runtime buffers are part of the current runtime contract"
;     },
;     {
;       "id": "runtime.msx2.layers.behavior",
;       "placement": "resident",
;       "reason": "Behavior layer pointers are part of the current runtime contract"
;     }
;   ],
;   "excludedRuntimeModules": [
;     {
;       "id": "runtime.msx2.hardware_sprites",
;       "placement": "resident",
;       "reason": "Enabled only when a reachable MSX2 sprite source exists"
;     },
;     {
;       "id": "runtime.msx2.projectiles",
;       "placement": "resident",
;       "reason": "Enabled only by shooter-horizontal movement"
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
;     },
;     {
;       "id": "runtime.msx2.mapper.konami8k",
;       "placement": "resident",
;       "reason": "Enabled by Konami MegaROM data-bank mode"
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
;       "reason": "Collision layer pointers are part of the current runtime contract"
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
;       "reason": "Behavior layer pointers are part of the current runtime contract"
;     },
;     {
;       "id": "runtime.msx2.hardware_sprites",
;       "included": false,
;       "placement": "resident",
;       "reason": "Enabled only when a reachable MSX2 sprite source exists"
;     },
;     {
;       "id": "runtime.msx2.projectiles",
;       "included": false,
;       "placement": "resident",
;       "reason": "Enabled only by shooter-horizontal movement"
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
;       "id": "runtime.msx2.mapper.konami8k",
;       "included": false,
;       "placement": "resident",
;       "reason": "Enabled by Konami MegaROM data-bank mode"
;     }
;   ],
;   "worldPackageSummary": [],
;   "worldBankManifest": {
;     "scope": "msx2_screen4_world_bank_manifest",
;     "mapper": "linear",
;     "bankSizeBytes": 8192,
;     "dataWindowAddress": "#8000",
;     "estimatedPhysicalBanks": [
;       {
;         "bankIndex": 0,
;         "windowAddress": "#8000",
;         "bankSizeBytes": 8192,
;         "warningThresholdBytes": 7372,
;         "usedBytes": 7182,
;         "freeBytes": 1010,
;         "usedPercent": 87.67,
;         "warning": false,
;         "overBudgetBytes": 0,
;         "status": "ok",
;         "packages": [
;           {
;             "id": "msx2screen.asset_screen_msx2_raster_bricks",
;             "usedBytes": 6347,
;             "recommendedBankClass": "world.screen"
;           },
;           {
;             "id": "palette.palette_msx2_raster_bricks",
;             "usedBytes": 835,
;             "recommendedBankClass": "world.manifest"
;           }
;         ]
;       }
;     ],
;     "worlds": [],
;     "note": "Pre-allocator World Bank Pack manifest. Physical banks are estimates from logical_bank_budget.json and may change after compression."
;   },
;   "assetStoragePolicy": [
;     {
;       "type": "msx2screen_tile",
;       "id": "brick_blank",
;       "name": "Black",
;       "ownerScreenId": "screen_msx2_raster_bricks",
;       "ownerWorldIds": [],
;       "rawBytes": 64,
;       "storedBytesEstimate": 64,
;       "accessPattern": "compiled_into_owner_screen",
;       "mutable": false,
;       "decision": "INHERIT_OWNER_SCREEN_POLICY",
;       "reason": "Tile bytes are emitted as part of the reachable SCREEN 4 room graphics."
;     },
;     {
;       "type": "msx2screen_tile",
;       "id": "brick_dark",
;       "name": "Dark Brick",
;       "ownerScreenId": "screen_msx2_raster_bricks",
;       "ownerWorldIds": [],
;       "rawBytes": 64,
;       "storedBytesEstimate": 64,
;       "accessPattern": "compiled_into_owner_screen",
;       "mutable": false,
;       "decision": "INHERIT_OWNER_SCREEN_POLICY",
;       "reason": "Tile bytes are emitted as part of the reachable SCREEN 4 room graphics."
;     },
;     {
;       "type": "msx2screen_tile",
;       "id": "brick_gold",
;       "name": "Gold Brick",
;       "ownerScreenId": "screen_msx2_raster_bricks",
;       "ownerWorldIds": [],
;       "rawBytes": 64,
;       "storedBytesEstimate": 64,
;       "accessPattern": "compiled_into_owner_screen",
;       "mutable": false,
;       "decision": "INHERIT_OWNER_SCREEN_POLICY",
;       "reason": "Tile bytes are emitted as part of the reachable SCREEN 4 room graphics."
;     },
;     {
;       "type": "msx2screen_tile",
;       "id": "brick_hot",
;       "name": "Hot Brick",
;       "ownerScreenId": "screen_msx2_raster_bricks",
;       "ownerWorldIds": [],
;       "rawBytes": 64,
;       "storedBytesEstimate": 64,
;       "accessPattern": "compiled_into_owner_screen",
;       "mutable": false,
;       "decision": "INHERIT_OWNER_SCREEN_POLICY",
;       "reason": "Tile bytes are emitted as part of the reachable SCREEN 4 room graphics."
;     },
;     {
;       "type": "msx2screen_tile",
;       "id": "brick_red",
;       "name": "Red Brick",
;       "ownerScreenId": "screen_msx2_raster_bricks",
;       "ownerWorldIds": [],
;       "rawBytes": 64,
;       "storedBytesEstimate": 64,
;       "accessPattern": "compiled_into_owner_screen",
;       "mutable": false,
;       "decision": "INHERIT_OWNER_SCREEN_POLICY",
;       "reason": "Tile bytes are emitted as part of the reachable SCREEN 4 room graphics."
;     },
;     {
;       "type": "msx2screen",
;       "id": "asset_screen_msx2_raster_bricks",
;       "name": "MSX2 Raster Bricks Screen",
;       "rawBytes": 6347,
;       "storedBytesEstimate": 6347,
;       "accessPattern": "manifest_read",
;       "mutable": false,
;       "decision": "ROM_RAW",
;       "reason": "Included by the active MSX2 project slice; precise backend packing remains allocator-owned."
;     },
;     {
;       "type": "palette",
;       "id": "palette_msx2_raster_bricks",
;       "name": "MSX2 Raster Bricks Palette",
;       "rawBytes": 835,
;       "storedBytesEstimate": 835,
;       "accessPattern": "manifest_read",
;       "mutable": false,
;       "decision": "ROM_RAW",
;       "reason": "Included by the active MSX2 project slice; precise backend packing remains allocator-owned."
;     }
;   ],
;   "logicalBankBudget": {
;     "bankSizeBytes": 8192,
;     "warningThresholdBytes": 7372,
;     "totalPayloadBytes": 7182,
;     "estimatedMinimumBanks": 1,
;     "estimatedPackedBankCount": 1,
;     "estimatedPackedBanks": [
;       {
;         "bankIndex": 0,
;         "bankSizeBytes": 8192,
;         "warningThresholdBytes": 7372,
;         "usedBytes": 7182,
;         "freeBytes": 1010,
;         "usedPercent": 87.67,
;         "warning": false,
;         "overBudgetBytes": 0,
;         "status": "ok",
;         "packages": [
;           {
;             "id": "msx2screen.asset_screen_msx2_raster_bricks",
;             "usedBytes": 6347,
;             "recommendedBankClass": "world.screen"
;           },
;           {
;             "id": "palette.palette_msx2_raster_bricks",
;             "usedBytes": 835,
;             "recommendedBankClass": "world.manifest"
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
;         "usedBytes": 6347,
;         "estimatedMinimumBanks": 1,
;         "warningPackageCount": 0,
;         "overBudgetPackageCount": 0,
;         "largestPackage": {
;           "id": "msx2screen.asset_screen_msx2_raster_bricks",
;           "usedBytes": 6347
;         }
;       },
;       {
;         "id": "world.manifest",
;         "packageCount": 1,
;         "usedBytes": 835,
;         "estimatedMinimumBanks": 1,
;         "warningPackageCount": 0,
;         "overBudgetPackageCount": 0,
;         "largestPackage": {
;           "id": "palette.palette_msx2_raster_bricks",
;           "usedBytes": 835
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
;         "id": "msx2screen.asset_screen_msx2_raster_bricks",
;         "type": "msx2screen",
;         "sourceId": "asset_screen_msx2_raster_bricks",
;         "recommendedBankClass": "world.screen",
;         "usedBytes": 6347,
;         "freeBytesIfAlone": 1845,
;         "warning": false,
;         "overBudgetBytes": 0,
;         "canSplit": true
;       },
;       {
;         "id": "palette.palette_msx2_raster_bricks",
;         "type": "palette",
;         "sourceId": "palette_msx2_raster_bricks",
;         "recommendedBankClass": "world.manifest",
;         "usedBytes": 835,
;         "freeBytesIfAlone": 7357,
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
;         "end": "#C044",
;         "bytes": 68,
;         "mutable": true,
;         "reason": "Fixed hot runtime state for player/input/global counters."
;       },
;       {
;         "id": "runtime.snake_body_cache",
;         "start": "#C044",
;         "end": "#C084",
;         "bytes": 64,
;         "mutable": true,
;         "reason": "Fixed-size cache reserved only for snake-char body state."
;       },
;       {
;         "id": "runtime.persistent_effect_layers",
;         "start": "#C084",
;         "end": "#C144",
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
;     "reachableMsx2SpriteCount": 0,
;     "reachableWorldCount": 0,
;     "usesKonamiDataBank": false,
;     "romPayloadBytesEstimate": 7182,
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
;     "type": "msx2screen_tile",
;     "id": "brick_blank",
;     "name": "Black",
;     "ownerScreenId": "screen_msx2_raster_bricks",
;     "ownerWorldIds": [],
;     "rawBytes": 64,
;     "storedBytesEstimate": 64,
;     "accessPattern": "compiled_into_owner_screen",
;     "mutable": false,
;     "decision": "INHERIT_OWNER_SCREEN_POLICY",
;     "reason": "Tile bytes are emitted as part of the reachable SCREEN 4 room graphics."
;   },
;   {
;     "type": "msx2screen_tile",
;     "id": "brick_dark",
;     "name": "Dark Brick",
;     "ownerScreenId": "screen_msx2_raster_bricks",
;     "ownerWorldIds": [],
;     "rawBytes": 64,
;     "storedBytesEstimate": 64,
;     "accessPattern": "compiled_into_owner_screen",
;     "mutable": false,
;     "decision": "INHERIT_OWNER_SCREEN_POLICY",
;     "reason": "Tile bytes are emitted as part of the reachable SCREEN 4 room graphics."
;   },
;   {
;     "type": "msx2screen_tile",
;     "id": "brick_gold",
;     "name": "Gold Brick",
;     "ownerScreenId": "screen_msx2_raster_bricks",
;     "ownerWorldIds": [],
;     "rawBytes": 64,
;     "storedBytesEstimate": 64,
;     "accessPattern": "compiled_into_owner_screen",
;     "mutable": false,
;     "decision": "INHERIT_OWNER_SCREEN_POLICY",
;     "reason": "Tile bytes are emitted as part of the reachable SCREEN 4 room graphics."
;   },
;   {
;     "type": "msx2screen_tile",
;     "id": "brick_hot",
;     "name": "Hot Brick",
;     "ownerScreenId": "screen_msx2_raster_bricks",
;     "ownerWorldIds": [],
;     "rawBytes": 64,
;     "storedBytesEstimate": 64,
;     "accessPattern": "compiled_into_owner_screen",
;     "mutable": false,
;     "decision": "INHERIT_OWNER_SCREEN_POLICY",
;     "reason": "Tile bytes are emitted as part of the reachable SCREEN 4 room graphics."
;   },
;   {
;     "type": "msx2screen_tile",
;     "id": "brick_red",
;     "name": "Red Brick",
;     "ownerScreenId": "screen_msx2_raster_bricks",
;     "ownerWorldIds": [],
;     "rawBytes": 64,
;     "storedBytesEstimate": 64,
;     "accessPattern": "compiled_into_owner_screen",
;     "mutable": false,
;     "decision": "INHERIT_OWNER_SCREEN_POLICY",
;     "reason": "Tile bytes are emitted as part of the reachable SCREEN 4 room graphics."
;   },
;   {
;     "type": "msx2screen",
;     "id": "asset_screen_msx2_raster_bricks",
;     "name": "MSX2 Raster Bricks Screen",
;     "rawBytes": 6347,
;     "storedBytesEstimate": 6347,
;     "accessPattern": "manifest_read",
;     "mutable": false,
;     "decision": "ROM_RAW",
;     "reason": "Included by the active MSX2 project slice; precise backend packing remains allocator-owned."
;   },
;   {
;     "type": "palette",
;     "id": "palette_msx2_raster_bricks",
;     "name": "MSX2 Raster Bricks Palette",
;     "rawBytes": 835,
;     "storedBytesEstimate": 835,
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
;   "totalPayloadBytes": 7182,
;   "estimatedMinimumBanks": 1,
;   "estimatedPackedBankCount": 1,
;   "estimatedPackedBanks": [
;     {
;       "bankIndex": 0,
;       "bankSizeBytes": 8192,
;       "warningThresholdBytes": 7372,
;       "usedBytes": 7182,
;       "freeBytes": 1010,
;       "usedPercent": 87.67,
;       "warning": false,
;       "overBudgetBytes": 0,
;       "status": "ok",
;       "packages": [
;         {
;           "id": "msx2screen.asset_screen_msx2_raster_bricks",
;           "usedBytes": 6347,
;           "recommendedBankClass": "world.screen"
;         },
;         {
;           "id": "palette.palette_msx2_raster_bricks",
;           "usedBytes": 835,
;           "recommendedBankClass": "world.manifest"
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
;       "usedBytes": 6347,
;       "estimatedMinimumBanks": 1,
;       "warningPackageCount": 0,
;       "overBudgetPackageCount": 0,
;       "largestPackage": {
;         "id": "msx2screen.asset_screen_msx2_raster_bricks",
;         "usedBytes": 6347
;       }
;     },
;     {
;       "id": "world.manifest",
;       "packageCount": 1,
;       "usedBytes": 835,
;       "estimatedMinimumBanks": 1,
;       "warningPackageCount": 0,
;       "overBudgetPackageCount": 0,
;       "largestPackage": {
;         "id": "palette.palette_msx2_raster_bricks",
;         "usedBytes": 835
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
;       "id": "msx2screen.asset_screen_msx2_raster_bricks",
;       "type": "msx2screen",
;       "sourceId": "asset_screen_msx2_raster_bricks",
;       "recommendedBankClass": "world.screen",
;       "usedBytes": 6347,
;       "freeBytesIfAlone": 1845,
;       "warning": false,
;       "overBudgetBytes": 0,
;       "canSplit": true
;     },
;     {
;       "id": "palette.palette_msx2_raster_bricks",
;       "type": "palette",
;       "sourceId": "palette_msx2_raster_bricks",
;       "recommendedBankClass": "world.manifest",
;       "usedBytes": 835,
;       "freeBytesIfAlone": 7357,
;       "warning": false,
;       "overBudgetBytes": 0,
;       "canSplit": false
;     }
;   ],
;   "note": "Logical pre-pack budget by asset package with first-fit-decreasing estimate. Final allocator still decides physical Konami 8K placement after compression."
; }
;
; [[[MIDEAS_ARTIFACT:logical_bank_budget.json:END]]]

; [[[MIDEAS_ARTIFACT:msx2_world_bank_manifest.json:BEGIN]]]
; {
;   "scope": "msx2_screen4_world_bank_manifest",
;   "mapper": "linear",
;   "bankSizeBytes": 8192,
;   "dataWindowAddress": "#8000",
;   "estimatedPhysicalBanks": [
;     {
;       "bankIndex": 0,
;       "windowAddress": "#8000",
;       "bankSizeBytes": 8192,
;       "warningThresholdBytes": 7372,
;       "usedBytes": 7182,
;       "freeBytes": 1010,
;       "usedPercent": 87.67,
;       "warning": false,
;       "overBudgetBytes": 0,
;       "status": "ok",
;       "packages": [
;         {
;           "id": "msx2screen.asset_screen_msx2_raster_bricks",
;           "usedBytes": 6347,
;           "recommendedBankClass": "world.screen"
;         },
;         {
;           "id": "palette.palette_msx2_raster_bricks",
;           "usedBytes": 835,
;           "recommendedBankClass": "world.manifest"
;         }
;       ]
;     }
;   ],
;   "worlds": [],
;   "note": "Pre-allocator World Bank Pack manifest. Physical banks are estimates from logical_bank_budget.json and may change after compression."
; }
;
; [[[MIDEAS_ARTIFACT:msx2_world_bank_manifest.json:END]]]

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
;       "end": "#C044",
;       "bytes": 68,
;       "mutable": true,
;       "reason": "Fixed hot runtime state for player/input/global counters."
;     },
;     {
;       "id": "runtime.snake_body_cache",
;       "start": "#C044",
;       "end": "#C084",
;       "bytes": 64,
;       "mutable": true,
;       "reason": "Fixed-size cache reserved only for snake-char body state."
;     },
;     {
;       "id": "runtime.persistent_effect_layers",
;       "start": "#C084",
;       "end": "#C144",
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
msx2_input_key_button1_mode EQU #C040
msx2_input_key_button2_mode EQU #C041
msx2_control_jump_button EQU #C042
msx2_control_action_button EQU #C043
MSX2_SCREEN4_DATA_BANK EQU 4
msx2_snake_body_cells EQU #C044
msx2_effects_runtime_buffers EQU #C084
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
    call init_msx2_controls
    call load_MSX2_RASTER_BRICKS_SCREEN_screen4



    call ENASCR
    ei

    ; MSX2 minimal GameFlow: MSX2 SCREEN 4 GameFlow entry.
    jp msx2_gf_node_0
msx2_gf_node_0:
    jp msx2_gf_node_1
msx2_gf_node_1:
    ld a, 0
    ld (msx2_current_screen_index), a
    call load_MSX2_RASTER_BRICKS_SCREEN_screen4
    ld b, #D2
.msx2_gf_node_1_wait_frames:
    halt
    djnz .msx2_gf_node_1_wait_frames
    jp msx2_gf_node_2
msx2_gf_node_2:
    call load_msx2_hud_font
    ld hl, #1980
    ld b, 2
    ld c, 32
    call clear_screen4_name_rect
    call wait_frame_busy
    ld hl, #1940
    ld b, 2
    ld c, 32
    call clear_screen4_name_rect
    call wait_frame_busy
    ld hl, #19C0
    ld b, 2
    ld c, 32
    call clear_screen4_name_rect
    call wait_frame_busy
    ld hl, #1900
    ld b, 2
    ld c, 32
    call clear_screen4_name_rect
    call wait_frame_busy
    ld hl, #1A00
    ld b, 2
    ld c, 32
    call clear_screen4_name_rect
    call wait_frame_busy
    ld hl, #18C0
    ld b, 2
    ld c, 32
    call clear_screen4_name_rect
    call wait_frame_busy
    ld hl, #1A40
    ld b, 2
    ld c, 32
    call clear_screen4_name_rect
    call wait_frame_busy
    ld hl, #1880
    ld b, 2
    ld c, 32
    call clear_screen4_name_rect
    call wait_frame_busy
    ld hl, #1A80
    ld b, 2
    ld c, 32
    call clear_screen4_name_rect
    call wait_frame_busy
    ld hl, #1840
    ld b, 2
    ld c, 32
    call clear_screen4_name_rect
    call wait_frame_busy
    ld hl, #1AC0
    ld b, 2
    ld c, 32
    call clear_screen4_name_rect
    call wait_frame_busy
    ld hl, #1800
    ld b, 2
    ld c, 32
    call clear_screen4_name_rect
    call wait_frame_busy
    jp msx2_gf_node_3
msx2_gf_node_3:
    jp .main_loop

.main_loop:




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
    ; Output: A=1 when the GameFlow Controls logical action button is pressed.
    ; Clobbers AF/CD. Callers that need BC/DE/HL must preserve them.
    call msx2_control_action_pressed
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


clear_screen4_names:
    ; Clears SCREEN 4 name table with the HUD blank char. Clobbers AF/BC/DE/HL.
    ld a, MSX2_HUD_FONT_BASE_CHAR
    ld hl, SCREEN4_NAME_VRAM
    ld bc, SCREEN4_NAME_SIZE
    call FILVRM
    ret

load_screen4_black_palette:
    ; Sets all SCREEN 4 palette slots to black. Clobbers AF/BC.
    ld bc, #0010
    call WRTVDP
    ld b, 32
    xor a
.black_palette_loop:
    out (VDP_PALETTE_PORT), a
    djnz .black_palette_loop
    ret

clear_screen4_name_cell_blank:
    ; HL=SCREEN 4 name-table cell. Clobbers AF/BC/DE/HL.
    ld a, MSX2_HUD_FONT_BASE_CHAR
    jp WRTVRM

clear_screen4_name_row:
    ; HL=start cell in SCREEN 4 name-table row. Clobbers AF/BC/DE/HL.
    ld a, MSX2_HUD_FONT_BASE_CHAR
    ld bc, 32
    jp FILVRM

clear_screen4_name_rect:
    ; HL=top-left SCREEN 4 name-table cell, B=height, C=width. Clobbers AF/BC/DE/HL.
    ld a, b
    or a
    ret z
    ld a, c
    or a
    ret z
.rect_loop:
    push bc
    push hl
    ld b, 0
    ld a, MSX2_HUD_FONT_BASE_CHAR
    call FILVRM
    pop hl
    ld de, 32
    add hl, de
    pop bc
    djnz .rect_loop
    ret

clear_screen4_name_column:
    ; HL=top cell in SCREEN 4 name-table column. Clobbers AF/BC/DE/HL.
    ld b, 24
.column_loop:
    push bc
    push hl
    ld a, MSX2_HUD_FONT_BASE_CHAR
    call WRTVRM
    pop hl
    ld de, 32
    add hl, de
    pop bc
    djnz .column_loop
    ret

clear_screen4_checkerboard_phase0:
    ; Clears alternating name-table cells. Clobbers AF/BC/DE/HL.
    ld hl, SCREEN4_NAME_VRAM
    ld b, 24
.phase0_row:
    push bc
    push hl
    ld a, b
    and 1
    jp z, .phase0_start
    inc hl
.phase0_start:
    ld c, 16
.phase0_column:
    push bc
    push hl
    ld a, MSX2_HUD_FONT_BASE_CHAR
    call WRTVRM
    pop hl
    ld de, 2
    add hl, de
    pop bc
    dec c
    jp nz, .phase0_column
    pop hl
    ld de, 32
    add hl, de
    pop bc
    djnz .phase0_row
    ret

clear_screen4_checkerboard_phase1:
    ; Clears the opposite alternating name-table cells. Clobbers AF/BC/DE/HL.
    ld hl, SCREEN4_NAME_VRAM
    ld b, 24
.phase1_row:
    push bc
    push hl
    ld a, b
    and 1
    jp nz, .phase1_start
    inc hl
.phase1_start:
    ld c, 16
.phase1_column:
    push bc
    push hl
    ld a, MSX2_HUD_FONT_BASE_CHAR
    call WRTVRM
    pop hl
    ld de, 2
    add hl, de
    pop bc
    dec c
    jp nz, .phase1_column
    pop hl
    ld de, 32
    add hl, de
    pop bc
    djnz .phase1_row
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


upload_hardware_sprite_attrs:
write_hardware_sprite_attrs:
update_hardware_sprite_input:
update_msx2_air_timer:
    ret

draw_msx2_lives_hud:
draw_msx2_score_hud:
draw_msx2_collectible_hud:
draw_msx2_air_hud:
draw_msx2_game_over_banner:
draw_msx2_level_complete_banner:
draw_msx2_stage_banner:
wait_msx2_stage_banner:
reset_msx2_status_border:
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

    ld bc, #0010
    call WRTVDP
    ld hl, screen4_palette_data
    ld b, 32
.palette_loop:
    ld a, (hl)
    out (VDP_PALETTE_PORT), a
    inc hl
    djnz .palette_loop

    ret

init_msx2_effect_buffers:
    ; Restores each msx2screen mutable effect layer from ROM into persistent RAM.
    ; Clobbers AF/BC/DE/HL.
    ld hl, MSX2_RASTER_BRICKS_SCREEN_EFFECTS
    ld de, #C084
    ld bc, msx2_layer_size
    ldir
    ret

load_current_msx2_screen4:
    ; Dispatches the active SCREEN 4 room by msx2_current_screen_index. Clobbers AF/BC/DE/HL.
    ld a, (msx2_current_screen_index)
    cp 0
    jp z, load_MSX2_RASTER_BRICKS_SCREEN_screen4
    jp load_MSX2_RASTER_BRICKS_SCREEN_screen4

load_MSX2_RASTER_BRICKS_SCREEN_screen4:
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

    ld hl, MSX2_RASTER_BRICKS_SCREEN_BANK_0_PATTERNS
    ld de, #0000
    ld bc, 128
    call LDIRVM
    ld hl, MSX2_RASTER_BRICKS_SCREEN_BANK_0_COLORS
    ld de, #2000
    ld bc, 128
    call LDIRVM
    ld hl, MSX2_RASTER_BRICKS_SCREEN_BANK_1_PATTERNS
    ld de, #0800
    ld bc, 128
    call LDIRVM
    ld hl, MSX2_RASTER_BRICKS_SCREEN_BANK_1_COLORS
    ld de, #2800
    ld bc, 128
    call LDIRVM
    ld hl, MSX2_RASTER_BRICKS_SCREEN_BANK_2_PATTERNS
    ld de, #1000
    ld bc, 128
    call LDIRVM
    ld hl, MSX2_RASTER_BRICKS_SCREEN_BANK_2_COLORS
    ld de, #3000
    ld bc, 128
    call LDIRVM

    ld hl, MSX2_RASTER_BRICKS_SCREEN_NAMES
    ld de, SCREEN4_NAME_VRAM
    ld bc, SCREEN4_NAME_SIZE
    call LDIRVM

    call load_msx2_hud_font
    call draw_MSX2_RASTER_BRICKS_SCREEN_hud_text
    ld hl, MSX2_RASTER_BRICKS_SCREEN_COLLISION
    ld (msx2_current_collision_ptr), hl
    ld hl, MSX2_RASTER_BRICKS_SCREEN_BEHAVIOR
    ld (msx2_current_behavior_ptr), hl
    ld hl, #C084
    ld (msx2_current_effects_ptr), hl
    call apply_MSX2_RASTER_BRICKS_SCREEN_collected_visuals
    ret

apply_MSX2_RASTER_BRICKS_SCREEN_collected_visuals:
    ; Re-erases collectibles already cleared from this screen's persistent effect RAM.
    ; Clobbers AF/BC/DE/HL.
    ; No collectible cells on this screen.
    ret

draw_MSX2_RASTER_BRICKS_SCREEN_hud_text:
    ret
    ret


; Palette bytes: byte1=(R<<4)|B, byte2=G
screen4_palette_data:
    DB #00,#00,#00,#00,#11,#06,#33,#07,#17,#01,#27,#03,#51,#01,#27,#06
    DB #71,#01,#73,#03,#61,#06,#64,#06,#11,#04,#65,#02,#55,#05,#77,#07

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




; MSX2 Raster Bricks Screen collision layer, 16x14 bytes
MSX2_RASTER_BRICKS_SCREEN_COLLISION:
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

; MSX2 Raster Bricks Screen effects layer, 16x14 bytes
MSX2_RASTER_BRICKS_SCREEN_EFFECTS:
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

; MSX2 Raster Bricks Screen behavior layer, 16x14 bytes
MSX2_RASTER_BRICKS_SCREEN_BEHAVIOR:
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

; MSX2 Raster Bricks Screen SCREEN 4 name table, 32x24 chars
MSX2_RASTER_BRICKS_SCREEN_NAMES:
    DB #00,#01,#04,#05,#04,#05,#04,#05,#08,#09,#04,#05,#04,#05,#0C,#0D
    DB #08,#09,#04,#05,#04,#05,#00,#01,#08,#09,#04,#05,#0C,#0D,#04,#05
    DB #02,#03,#06,#07,#06,#07,#06,#07,#0A,#0B,#06,#07,#06,#07,#0E,#0F
    DB #0A,#0B,#06,#07,#06,#07,#02,#03,#0A,#0B,#06,#07,#0E,#0F,#06,#07
    DB #04,#05,#04,#05,#0C,#0D,#08,#09,#04,#05,#04,#05,#04,#05,#08,#09
    DB #04,#05,#0C,#0D,#00,#01,#08,#09,#04,#05,#04,#05,#04,#05,#08,#09
    DB #06,#07,#06,#07,#0E,#0F,#0A,#0B,#06,#07,#06,#07,#06,#07,#0A,#0B
    DB #06,#07,#0E,#0F,#02,#03,#0A,#0B,#06,#07,#06,#07,#06,#07,#0A,#0B
    DB #04,#05,#04,#05,#08,#09,#04,#05,#0C,#0D,#04,#05,#08,#09,#04,#05
    DB #04,#05,#00,#01,#08,#09,#0C,#0D,#04,#05,#04,#05,#08,#09,#04,#05
    DB #06,#07,#06,#07,#0A,#0B,#06,#07,#0E,#0F,#06,#07,#0A,#0B,#06,#07
    DB #06,#07,#02,#03,#0A,#0B,#0E,#0F,#06,#07,#06,#07,#0A,#0B,#06,#07
    DB #04,#05,#08,#09,#04,#05,#04,#05,#04,#05,#08,#09,#0C,#0D,#04,#05
    DB #00,#01,#08,#09,#04,#05,#04,#05,#04,#05,#0C,#0D,#04,#05,#04,#05
    DB #06,#07,#0A,#0B,#06,#07,#06,#07,#06,#07,#0A,#0B,#0E,#0F,#06,#07
    DB #02,#03,#0A,#0B,#06,#07,#06,#07,#06,#07,#0E,#0F,#06,#07,#06,#07
    DB #00,#01,#04,#05,#08,#09,#08,#09,#00,#01,#08,#09,#08,#09,#0C,#0D
    DB #04,#05,#08,#09,#08,#09,#08,#09,#00,#01,#08,#09,#08,#09,#04,#05
    DB #02,#03,#06,#07,#0A,#0B,#0A,#0B,#02,#03,#0A,#0B,#0A,#0B,#0E,#0F
    DB #06,#07,#0A,#0B,#0A,#0B,#0A,#0B,#02,#03,#0A,#0B,#0A,#0B,#06,#07
    DB #08,#09,#08,#09,#08,#09,#04,#05,#08,#09,#08,#09,#0C,#0D,#00,#01
    DB #08,#09,#08,#09,#04,#05,#00,#01,#08,#09,#08,#09,#08,#09,#00,#01
    DB #0A,#0B,#0A,#0B,#0A,#0B,#06,#07,#0A,#0B,#0A,#0B,#0E,#0F,#02,#03
    DB #0A,#0B,#0A,#0B,#06,#07,#02,#03,#0A,#0B,#0A,#0B,#0A,#0B,#02,#03
    DB #08,#09,#08,#09,#00,#01,#08,#09,#08,#09,#0C,#0D,#00,#01,#08,#09
    DB #08,#09,#08,#09,#00,#01,#08,#09,#04,#05,#08,#09,#00,#01,#08,#09
    DB #0A,#0B,#0A,#0B,#02,#03,#0A,#0B,#0A,#0B,#0E,#0F,#02,#03,#0A,#0B
    DB #0A,#0B,#0A,#0B,#02,#03,#0A,#0B,#06,#07,#0A,#0B,#02,#03,#0A,#0B
    DB #04,#05,#00,#01,#08,#09,#08,#09,#0C,#0D,#00,#01,#08,#09,#04,#05
    DB #08,#09,#00,#01,#08,#09,#08,#09,#08,#09,#00,#01,#04,#05,#0C,#0D
    DB #06,#07,#02,#03,#0A,#0B,#0A,#0B,#0E,#0F,#02,#03,#0A,#0B,#06,#07
    DB #0A,#0B,#02,#03,#0A,#0B,#0A,#0B,#0A,#0B,#02,#03,#06,#07,#0E,#0F
    DB #00,#01,#04,#05,#08,#09,#0C,#0D,#00,#01,#04,#05,#04,#05,#04,#05
    DB #00,#01,#08,#09,#04,#05,#04,#05,#00,#01,#04,#05,#0C,#0D,#04,#05
    DB #02,#03,#06,#07,#0A,#0B,#0E,#0F,#02,#03,#06,#07,#06,#07,#06,#07
    DB #02,#03,#0A,#0B,#06,#07,#06,#07,#02,#03,#06,#07,#0E,#0F,#06,#07
    DB #04,#05,#04,#05,#0C,#0D,#00,#01,#08,#09,#04,#05,#04,#05,#00,#01
    DB #04,#05,#04,#05,#04,#05,#08,#09,#04,#05,#0C,#0D,#04,#05,#00,#01
    DB #06,#07,#06,#07,#0E,#0F,#02,#03,#0A,#0B,#06,#07,#06,#07,#02,#03
    DB #06,#07,#06,#07,#06,#07,#0A,#0B,#06,#07,#0E,#0F,#06,#07,#02,#03
    DB #04,#05,#0C,#0D,#00,#01,#04,#05,#04,#05,#04,#05,#08,#09,#04,#05
    DB #04,#05,#04,#05,#00,#01,#04,#05,#0C,#0D,#08,#09,#00,#01,#04,#05
    DB #06,#07,#0E,#0F,#02,#03,#06,#07,#06,#07,#06,#07,#0A,#0B,#06,#07
    DB #06,#07,#06,#07,#02,#03,#06,#07,#0E,#0F,#0A,#0B,#02,#03,#06,#07
    DB #0C,#0D,#08,#09,#04,#05,#04,#05,#04,#05,#00,#01,#04,#05,#04,#05
    DB #08,#09,#00,#01,#04,#05,#0C,#0D,#04,#05,#00,#01,#04,#05,#08,#09
    DB #0E,#0F,#0A,#0B,#06,#07,#06,#07,#06,#07,#02,#03,#06,#07,#06,#07
    DB #0A,#0B,#02,#03,#06,#07,#0E,#0F,#06,#07,#02,#03,#06,#07,#0A,#0B

; MSX2 Raster Bricks Screen SCREEN 4 bank 0 compact patterns
MSX2_RASTER_BRICKS_SCREEN_BANK_0_PATTERNS:
    DB #00,#80,#80,#80,#80,#80,#80,#40,#00,#81,#70,#68,#26,#46,#58,#02
    DB #40,#84,#85,#85,#85,#84,#84,#00,#02,#01,#16,#26,#01,#01,#01,#00
    DB #00,#80,#80,#80,#80,#80,#80,#40,#00,#81,#70,#68,#58,#38,#81,#02
    DB #40,#84,#84,#84,#84,#84,#84,#00,#02,#01,#16,#26,#01,#01,#01,#00
    DB #00,#80,#84,#88,#90,#A0,#C0,#40,#00,#83,#70,#68,#48,#28,#58,#00
    DB #40,#84,#72,#6A,#00,#00,#00,#00,#00,#03,#E8,#D8,#00,#00,#00,#00
    DB #00,#80,#80,#80,#80,#80,#80,#40,#00,#81,#70,#68,#58,#38,#81,#02
    DB #40,#84,#84,#84,#84,#84,#84,#00,#02,#01,#16,#26,#01,#01,#01,#00

; MSX2 Raster Bricks Screen SCREEN 4 bank 0 compact colors
MSX2_RASTER_BRICKS_SCREEN_BANK_0_COLORS:
    DB #11,#1F,#19,#19,#19,#19,#19,#91,#11,#1F,#98,#91,#81,#81,#91,#81
    DB #91,#1F,#19,#19,#18,#18,#18,#11,#81,#1F,#89,#89,#18,#18,#18,#11
    DB #11,#19,#18,#18,#18,#18,#18,#81,#11,#19,#86,#86,#86,#86,#18,#61
    DB #81,#19,#18,#18,#16,#16,#16,#11,#61,#19,#68,#68,#16,#16,#16,#11
    DB #11,#18,#16,#16,#16,#16,#16,#61,#11,#18,#61,#61,#61,#61,#61,#11
    DB #61,#18,#61,#61,#11,#11,#11,#11,#11,#18,#61,#61,#11,#11,#11,#11
    DB #11,#1B,#1A,#1A,#1A,#1A,#1A,#A1,#11,#1B,#A6,#A6,#A6,#A6,#1A,#61
    DB #A1,#1B,#1A,#1A,#16,#16,#16,#11,#61,#1B,#6A,#6A,#16,#16,#16,#11

; MSX2 Raster Bricks Screen SCREEN 4 bank 1 compact patterns
MSX2_RASTER_BRICKS_SCREEN_BANK_1_PATTERNS:
    DB #00,#80,#84,#88,#90,#A0,#C0,#40,#00,#83,#70,#68,#48,#28,#58,#00
    DB #40,#84,#72,#6A,#00,#00,#00,#00,#00,#03,#E8,#D8,#00,#00,#00,#00
    DB #00,#80,#80,#80,#80,#80,#80,#40,#00,#81,#70,#68,#58,#38,#81,#02
    DB #40,#84,#84,#84,#84,#84,#84,#00,#02,#01,#16,#26,#01,#01,#01,#00
    DB #00,#80,#80,#80,#80,#80,#80,#40,#00,#81,#70,#68,#58,#38,#81,#02
    DB #40,#84,#84,#84,#84,#84,#84,#00,#02,#01,#16,#26,#01,#01,#01,#00
    DB #00,#80,#80,#80,#80,#80,#80,#40,#00,#81,#70,#68,#26,#46,#58,#02
    DB #40,#84,#85,#85,#85,#84,#84,#00,#02,#01,#16,#26,#01,#01,#01,#00

; MSX2 Raster Bricks Screen SCREEN 4 bank 1 compact colors
MSX2_RASTER_BRICKS_SCREEN_BANK_1_COLORS:
    DB #11,#18,#16,#16,#16,#16,#16,#61,#11,#18,#61,#61,#61,#61,#61,#11
    DB #61,#18,#61,#61,#11,#11,#11,#11,#11,#18,#61,#61,#11,#11,#11,#11
    DB #11,#1B,#1A,#1A,#1A,#1A,#1A,#A1,#11,#1B,#A6,#A6,#A6,#A6,#1A,#61
    DB #A1,#1B,#1A,#1A,#16,#16,#16,#11,#61,#1B,#6A,#6A,#16,#16,#16,#11
    DB #11,#19,#18,#18,#18,#18,#18,#81,#11,#19,#86,#86,#86,#86,#18,#61
    DB #81,#19,#18,#18,#16,#16,#16,#11,#61,#19,#68,#68,#16,#16,#16,#11
    DB #11,#1F,#19,#19,#19,#19,#19,#91,#11,#1F,#98,#91,#81,#81,#91,#81
    DB #91,#1F,#19,#19,#18,#18,#18,#11,#81,#1F,#89,#89,#18,#18,#18,#11

; MSX2 Raster Bricks Screen SCREEN 4 bank 2 compact patterns
MSX2_RASTER_BRICKS_SCREEN_BANK_2_PATTERNS:
    DB #00,#80,#84,#88,#90,#A0,#C0,#40,#00,#83,#70,#68,#48,#28,#58,#00
    DB #40,#84,#72,#6A,#00,#00,#00,#00,#00,#03,#E8,#D8,#00,#00,#00,#00
    DB #00,#80,#80,#80,#80,#80,#80,#40,#00,#81,#70,#68,#58,#38,#81,#02
    DB #40,#84,#84,#84,#84,#84,#84,#00,#02,#01,#16,#26,#01,#01,#01,#00
    DB #00,#80,#80,#80,#80,#80,#80,#40,#00,#81,#70,#68,#58,#38,#81,#02
    DB #40,#84,#84,#84,#84,#84,#84,#00,#02,#01,#16,#26,#01,#01,#01,#00
    DB #00,#80,#80,#80,#80,#80,#80,#40,#00,#81,#70,#68,#26,#46,#58,#02
    DB #40,#84,#85,#85,#85,#84,#84,#00,#02,#01,#16,#26,#01,#01,#01,#00

; MSX2 Raster Bricks Screen SCREEN 4 bank 2 compact colors
MSX2_RASTER_BRICKS_SCREEN_BANK_2_COLORS:
    DB #11,#18,#16,#16,#16,#16,#16,#61,#11,#18,#61,#61,#61,#61,#61,#11
    DB #61,#18,#61,#61,#11,#11,#11,#11,#11,#18,#61,#61,#11,#11,#11,#11
    DB #11,#19,#18,#18,#18,#18,#18,#81,#11,#19,#86,#86,#86,#86,#18,#61
    DB #81,#19,#18,#18,#16,#16,#16,#11,#61,#19,#68,#68,#16,#16,#16,#11
    DB #11,#1B,#1A,#1A,#1A,#1A,#1A,#A1,#11,#1B,#A6,#A6,#A6,#A6,#1A,#61
    DB #A1,#1B,#1A,#1A,#16,#16,#16,#11,#61,#1B,#6A,#6A,#16,#16,#16,#11
    DB #11,#1F,#19,#19,#19,#19,#19,#91,#11,#1F,#98,#91,#81,#81,#91,#81
    DB #91,#1F,#19,#19,#18,#18,#18,#11,#81,#1F,#89,#89,#18,#18,#18,#11

    ds #C000 - $, #FF
    end
