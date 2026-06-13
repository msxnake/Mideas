; File: unitedFiles.asm
; ==================================================================
; Mideas MSX2 SCREEN 4 tile backend
; Project: msx2screen_layers_smoke
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
;   "projectName": "msx2screen_layers_smoke",
;   "backend": "msx2-screen4-pattern",
;   "screenMode": "SCREEN 4 (Graphics II)",
;   "romMode": "simple32k",
;   "mapper": "konami",
;   "entryPoints": {
;     "gameFlowId": "gameflow_msx2_layers_smoke",
;     "gameFlowName": "MSX2 Layers Smoke GameFlow",
;     "worldIds": [
;       "world_msx2_layers_smoke"
;     ],
;     "screenIds": [
;       "screen_msx2_layers_exit",
;       "screen_msx2_layers_smoke"
;     ]
;   },
;   "includedAssets": [
;     {
;       "type": "msx2screen_tile",
;       "id": "msx2_tile_blank",
;       "name": "Blank",
;       "ownerScreenId": "screen_msx2_layers_smoke",
;       "ownerWorldIds": [
;         "world_msx2_layers_smoke"
;       ],
;       "reason": "Tile used by reachable native MSX2 screen"
;     },
;     {
;       "type": "msx2screen_tile",
;       "id": "msx2_tile_blank",
;       "name": "Blank",
;       "ownerScreenId": "screen_msx2_layers_exit",
;       "ownerWorldIds": [
;         "world_msx2_layers_smoke"
;       ],
;       "reason": "Tile used by reachable native MSX2 screen"
;     },
;     {
;       "type": "msx2screen_tile",
;       "id": "msx2_tile_collectible",
;       "name": "Collectible",
;       "ownerScreenId": "screen_msx2_layers_smoke",
;       "ownerWorldIds": [
;         "world_msx2_layers_smoke"
;       ],
;       "reason": "Tile used by reachable native MSX2 screen"
;     },
;     {
;       "type": "msx2screen_tile",
;       "id": "msx2_tile_collectible",
;       "name": "Collectible",
;       "ownerScreenId": "screen_msx2_layers_exit",
;       "ownerWorldIds": [
;         "world_msx2_layers_smoke"
;       ],
;       "reason": "Tile used by reachable native MSX2 screen"
;     },
;     {
;       "type": "msx2screen_tile",
;       "id": "msx2_tile_conveyor",
;       "name": "Conveyor Right",
;       "ownerScreenId": "screen_msx2_layers_smoke",
;       "ownerWorldIds": [
;         "world_msx2_layers_smoke"
;       ],
;       "reason": "Tile used by reachable native MSX2 screen"
;     },
;     {
;       "type": "msx2screen_tile",
;       "id": "msx2_tile_conveyor",
;       "name": "Conveyor Right",
;       "ownerScreenId": "screen_msx2_layers_exit",
;       "ownerWorldIds": [
;         "world_msx2_layers_smoke"
;       ],
;       "reason": "Tile used by reachable native MSX2 screen"
;     },
;     {
;       "type": "msx2screen_tile",
;       "id": "msx2_tile_effect",
;       "name": "Effect Marker",
;       "ownerScreenId": "screen_msx2_layers_smoke",
;       "ownerWorldIds": [
;         "world_msx2_layers_smoke"
;       ],
;       "reason": "Tile used by reachable native MSX2 screen"
;     },
;     {
;       "type": "msx2screen_tile",
;       "id": "msx2_tile_effect",
;       "name": "Effect Marker",
;       "ownerScreenId": "screen_msx2_layers_exit",
;       "ownerWorldIds": [
;         "world_msx2_layers_smoke"
;       ],
;       "reason": "Tile used by reachable native MSX2 screen"
;     },
;     {
;       "type": "msx2screen_tile",
;       "id": "msx2_tile_ladder",
;       "name": "Ladder",
;       "ownerScreenId": "screen_msx2_layers_smoke",
;       "ownerWorldIds": [
;         "world_msx2_layers_smoke"
;       ],
;       "reason": "Tile used by reachable native MSX2 screen"
;     },
;     {
;       "type": "msx2screen_tile",
;       "id": "msx2_tile_ladder",
;       "name": "Ladder",
;       "ownerScreenId": "screen_msx2_layers_exit",
;       "ownerWorldIds": [
;         "world_msx2_layers_smoke"
;       ],
;       "reason": "Tile used by reachable native MSX2 screen"
;     },
;     {
;       "type": "msx2screen_tile",
;       "id": "msx2_tile_platform",
;       "name": "Platform",
;       "ownerScreenId": "screen_msx2_layers_smoke",
;       "ownerWorldIds": [
;         "world_msx2_layers_smoke"
;       ],
;       "reason": "Tile used by reachable native MSX2 screen"
;     },
;     {
;       "type": "msx2screen_tile",
;       "id": "msx2_tile_platform",
;       "name": "Platform",
;       "ownerScreenId": "screen_msx2_layers_exit",
;       "ownerWorldIds": [
;         "world_msx2_layers_smoke"
;       ],
;       "reason": "Tile used by reachable native MSX2 screen"
;     },
;     {
;       "type": "msx2screen_tile",
;       "id": "msx2_tile_wall",
;       "name": "Collision Wall",
;       "ownerScreenId": "screen_msx2_layers_smoke",
;       "ownerWorldIds": [
;         "world_msx2_layers_smoke"
;       ],
;       "reason": "Tile used by reachable native MSX2 screen"
;     },
;     {
;       "type": "msx2screen_tile",
;       "id": "msx2_tile_wall",
;       "name": "Collision Wall",
;       "ownerScreenId": "screen_msx2_layers_exit",
;       "ownerWorldIds": [
;         "world_msx2_layers_smoke"
;       ],
;       "reason": "Tile used by reachable native MSX2 screen"
;     }
;   ],
;   "excludedAssets": [],
;   "includedRuntimeModules": [
;     "runtime.msx2.boot",
;     "runtime.msx2.screen4.vdp",
;     "runtime.msx2.input",
;     "runtime.msx2.screen_loader",
;     "runtime.msx2.layers.collision",
;     "runtime.msx2.layers.effects",
;     "runtime.msx2.layers.behavior",
;     "runtime.msx2.hardware_sprites"
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
;     },
;     {
;       "id": "runtime.msx2.hardware_sprites",
;       "placement": "resident",
;       "reason": "Enabled only when a reachable MSX2 sprite source exists"
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
;       "included": false,
;       "placement": "resident",
;       "reason": "Enabled when reachable screens contain msx2_box2 or legacy msx2_push_box entities"
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
;     "estimatedPhysicalBanks": [],
;     "worlds": [],
;     "note": "Pre-allocator World Bank Pack manifest. Physical banks are estimates from logical_bank_budget.json and may change after compression."
;   },
;   "screen4RuntimeLayerPolicy": {
;     "collision": {
;       "definitionPlacement": "resident_rom",
;       "runtimePlacement": "resident_rom",
;       "cacheScope": "direct_pointer",
;       "bytesPerScreen": 192
;     },
;     "behavior": {
;       "definitionPlacement": "resident_rom",
;       "runtimePlacement": "resident_rom",
;       "cacheScope": "direct_pointer",
;       "bytesPerScreen": 192
;     },
;     "effects": {
;       "definitionPlacement": "resident_rom",
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
;       "type": "msx2screen_tile",
;       "id": "msx2_tile_blank",
;       "name": "Blank",
;       "ownerScreenId": "screen_msx2_layers_smoke",
;       "ownerWorldIds": [
;         "world_msx2_layers_smoke"
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
;       "id": "msx2_tile_blank",
;       "name": "Blank",
;       "ownerScreenId": "screen_msx2_layers_exit",
;       "ownerWorldIds": [
;         "world_msx2_layers_smoke"
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
;       "id": "msx2_tile_collectible",
;       "name": "Collectible",
;       "ownerScreenId": "screen_msx2_layers_smoke",
;       "ownerWorldIds": [
;         "world_msx2_layers_smoke"
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
;       "id": "msx2_tile_collectible",
;       "name": "Collectible",
;       "ownerScreenId": "screen_msx2_layers_exit",
;       "ownerWorldIds": [
;         "world_msx2_layers_smoke"
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
;       "id": "msx2_tile_conveyor",
;       "name": "Conveyor Right",
;       "ownerScreenId": "screen_msx2_layers_smoke",
;       "ownerWorldIds": [
;         "world_msx2_layers_smoke"
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
;       "id": "msx2_tile_conveyor",
;       "name": "Conveyor Right",
;       "ownerScreenId": "screen_msx2_layers_exit",
;       "ownerWorldIds": [
;         "world_msx2_layers_smoke"
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
;       "id": "msx2_tile_effect",
;       "name": "Effect Marker",
;       "ownerScreenId": "screen_msx2_layers_smoke",
;       "ownerWorldIds": [
;         "world_msx2_layers_smoke"
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
;       "id": "msx2_tile_effect",
;       "name": "Effect Marker",
;       "ownerScreenId": "screen_msx2_layers_exit",
;       "ownerWorldIds": [
;         "world_msx2_layers_smoke"
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
;       "id": "msx2_tile_ladder",
;       "name": "Ladder",
;       "ownerScreenId": "screen_msx2_layers_smoke",
;       "ownerWorldIds": [
;         "world_msx2_layers_smoke"
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
;       "id": "msx2_tile_ladder",
;       "name": "Ladder",
;       "ownerScreenId": "screen_msx2_layers_exit",
;       "ownerWorldIds": [
;         "world_msx2_layers_smoke"
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
;       "id": "msx2_tile_platform",
;       "name": "Platform",
;       "ownerScreenId": "screen_msx2_layers_smoke",
;       "ownerWorldIds": [
;         "world_msx2_layers_smoke"
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
;       "id": "msx2_tile_platform",
;       "name": "Platform",
;       "ownerScreenId": "screen_msx2_layers_exit",
;       "ownerWorldIds": [
;         "world_msx2_layers_smoke"
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
;       "id": "msx2_tile_wall",
;       "name": "Collision Wall",
;       "ownerScreenId": "screen_msx2_layers_smoke",
;       "ownerWorldIds": [
;         "world_msx2_layers_smoke"
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
;       "id": "msx2_tile_wall",
;       "name": "Collision Wall",
;       "ownerScreenId": "screen_msx2_layers_exit",
;       "ownerWorldIds": [
;         "world_msx2_layers_smoke"
;       ],
;       "rawBytes": 64,
;       "storedBytesEstimate": 64,
;       "accessPattern": "compiled_into_owner_screen",
;       "mutable": false,
;       "decision": "INHERIT_OWNER_SCREEN_POLICY",
;       "reason": "Tile bytes are emitted as part of the reachable SCREEN 4 room graphics."
;     }
;   ],
;   "logicalBankBudget": {
;     "bankSizeBytes": 8192,
;     "warningThresholdBytes": 7372,
;     "totalPayloadBytes": 0,
;     "estimatedMinimumBanks": 1,
;     "estimatedPackedBankCount": 0,
;     "estimatedPackedBanks": [],
;     "overBudgetPackages": [],
;     "warningPackages": [],
;     "warningPackedBanks": [],
;     "bankClassSummary": [],
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
;     "packages": [],
;     "splitPackages": [],
;     "splitChunkManifest": [],
;     "splitSourcePackages": [],
;     "note": "Logical pre-pack budget by asset package with first-fit-decreasing estimate. Final allocator still decides physical Konami 8K placement after compression."
;   },
;   "ramBudget": {
;     "scope": "msx2_screen4_ram_budget",
;     "start": "#C000",
;     "end": "#C674",
;     "limit": "#F300",
;     "usableBytes": 13056,
;     "usedBytes": 1652,
;     "freeBytes": 11404,
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
;         "end": "#C0A8",
;         "bytes": 97,
;         "mutable": true,
;         "reason": "Fixed-size cache reserved only for snake-char body state."
;       },
;       {
;         "id": "runtime.persistent_effect_layers",
;         "start": "#C0A8",
;         "end": "#C228",
;         "bytes": 384,
;         "mutable": true,
;         "count": 2,
;         "bytesPerScreen": 192,
;         "reason": "One mutable effects layer per reachable SCREEN 4 room."
;       },
;       {
;         "id": "runtime.effects_scratch",
;         "start": "#C230",
;         "end": "#C2F0",
;         "bytes": 192,
;         "mutable": true,
;         "reason": "Temporary effect layer buffer for screens without persistent slot or loaders."
;       },
;       {
;         "id": "runtime.collision_current_cache",
;         "start": "#C2F0",
;         "end": "#C3B0",
;         "bytes": 192,
;         "mutable": true,
;         "reason": "Hot cache for the current SCREEN 4 collision layer copied from ROM data banks."
;       },
;       {
;         "id": "runtime.behavior_current_cache",
;         "start": "#C3B0",
;         "end": "#C470",
;         "bytes": 192,
;         "mutable": true,
;         "reason": "Hot cache for the current SCREEN 4 behavior layer copied from ROM data banks."
;       },
;       {
;         "id": "runtime.cell_flags_current_cache",
;         "start": "#C470",
;         "end": "#C530",
;         "bytes": 192,
;         "mutable": true,
;         "reason": "Packed current SCREEN 4 solid/effect/behavior flags, staged for the unified runtime layer contract."
;       },
;       {
;         "id": "runtime.visual_map_cache",
;         "start": "#C530",
;         "end": "#C5F0",
;         "bytes": 192,
;         "mutable": true,
;         "reason": "Current SCREEN 4 visual tile index map used for per-tile hazard hitbox lookup."
;       },
;       {
;         "id": "runtime.hazard_hitbox_cache",
;         "start": "#C5F0",
;         "end": "#C6F0",
;         "bytes": 256,
;         "mutable": true,
;         "reason": "Current SCREEN 4 per-tile hazard hitbox table (ox, oy, w, h bytes)."
;       },
;       {
;         "id": "runtime.enemy_pool",
;         "start": "#C700",
;         "end": "#C754",
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
;   "includedMovementProfiles": [
;     "enemy",
;     "patrolX",
;     "patrolY",
;     "player"
;   ],
;   "includedAttackProfiles": [],
;   "includedStateMachines": [],
;   "estimatedRamNeeds": {
;     "start": "#C000",
;     "end": "#C674",
;     "limit": "#F300",
;     "usedBytes": 1652,
;     "freeBytes": 11404,
;     "persistentEffectBytes": 384,
;     "enemyRuntimeBytes": 84,
;     "ramBudgetStatus": "ok"
;   },
;   "estimatedRomNeeds": {
;     "reachableMsx2ScreenCount": 2,
;     "reachableMsx2SpriteCount": 1,
;     "reachableWorldCount": 1,
;     "usesKonamiDataBank": false,
;     "romPayloadBytesEstimate": 0,
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
;         "label": "MSX2_LAYERS_SMOKE_SCREEN",
;         "packageId": "msx2screen.screen_msx2_layers_smoke",
;         "bankIndex": 0,
;         "physicalBank": 4
;       },
;       {
;         "label": "MSX2_LAYERS_EXIT_SCREEN",
;         "packageId": "msx2screen.screen_msx2_layers_exit",
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
;     "type": "msx2screen_tile",
;     "id": "msx2_tile_blank",
;     "name": "Blank",
;     "ownerScreenId": "screen_msx2_layers_smoke",
;     "ownerWorldIds": [
;       "world_msx2_layers_smoke"
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
;     "id": "msx2_tile_blank",
;     "name": "Blank",
;     "ownerScreenId": "screen_msx2_layers_exit",
;     "ownerWorldIds": [
;       "world_msx2_layers_smoke"
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
;     "id": "msx2_tile_collectible",
;     "name": "Collectible",
;     "ownerScreenId": "screen_msx2_layers_smoke",
;     "ownerWorldIds": [
;       "world_msx2_layers_smoke"
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
;     "id": "msx2_tile_collectible",
;     "name": "Collectible",
;     "ownerScreenId": "screen_msx2_layers_exit",
;     "ownerWorldIds": [
;       "world_msx2_layers_smoke"
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
;     "id": "msx2_tile_conveyor",
;     "name": "Conveyor Right",
;     "ownerScreenId": "screen_msx2_layers_smoke",
;     "ownerWorldIds": [
;       "world_msx2_layers_smoke"
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
;     "id": "msx2_tile_conveyor",
;     "name": "Conveyor Right",
;     "ownerScreenId": "screen_msx2_layers_exit",
;     "ownerWorldIds": [
;       "world_msx2_layers_smoke"
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
;     "id": "msx2_tile_effect",
;     "name": "Effect Marker",
;     "ownerScreenId": "screen_msx2_layers_smoke",
;     "ownerWorldIds": [
;       "world_msx2_layers_smoke"
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
;     "id": "msx2_tile_effect",
;     "name": "Effect Marker",
;     "ownerScreenId": "screen_msx2_layers_exit",
;     "ownerWorldIds": [
;       "world_msx2_layers_smoke"
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
;     "id": "msx2_tile_ladder",
;     "name": "Ladder",
;     "ownerScreenId": "screen_msx2_layers_smoke",
;     "ownerWorldIds": [
;       "world_msx2_layers_smoke"
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
;     "id": "msx2_tile_ladder",
;     "name": "Ladder",
;     "ownerScreenId": "screen_msx2_layers_exit",
;     "ownerWorldIds": [
;       "world_msx2_layers_smoke"
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
;     "id": "msx2_tile_platform",
;     "name": "Platform",
;     "ownerScreenId": "screen_msx2_layers_smoke",
;     "ownerWorldIds": [
;       "world_msx2_layers_smoke"
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
;     "id": "msx2_tile_platform",
;     "name": "Platform",
;     "ownerScreenId": "screen_msx2_layers_exit",
;     "ownerWorldIds": [
;       "world_msx2_layers_smoke"
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
;     "id": "msx2_tile_wall",
;     "name": "Collision Wall",
;     "ownerScreenId": "screen_msx2_layers_smoke",
;     "ownerWorldIds": [
;       "world_msx2_layers_smoke"
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
;     "id": "msx2_tile_wall",
;     "name": "Collision Wall",
;     "ownerScreenId": "screen_msx2_layers_exit",
;     "ownerWorldIds": [
;       "world_msx2_layers_smoke"
;     ],
;     "rawBytes": 64,
;     "storedBytesEstimate": 64,
;     "accessPattern": "compiled_into_owner_screen",
;     "mutable": false,
;     "decision": "INHERIT_OWNER_SCREEN_POLICY",
;     "reason": "Tile bytes are emitted as part of the reachable SCREEN 4 room graphics."
;   }
; ]
;
; [[[MIDEAS_ARTIFACT:asset_storage_policy.json:END]]]

; [[[MIDEAS_ARTIFACT:logical_bank_budget.json:BEGIN]]]
; {
;   "bankSizeBytes": 8192,
;   "warningThresholdBytes": 7372,
;   "totalPayloadBytes": 0,
;   "estimatedMinimumBanks": 1,
;   "estimatedPackedBankCount": 0,
;   "estimatedPackedBanks": [],
;   "overBudgetPackages": [],
;   "warningPackages": [],
;   "warningPackedBanks": [],
;   "bankClassSummary": [],
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
;   "packages": [],
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
;   "mapper": "linear",
;   "bankSizeBytes": 8192,
;   "dataWindowAddress": "#8000",
;   "estimatedPhysicalBanks": [],
;   "worlds": [],
;   "note": "Pre-allocator World Bank Pack manifest. Physical banks are estimates from logical_bank_budget.json and may change after compression."
; }
;
; [[[MIDEAS_ARTIFACT:msx2_world_bank_manifest.json:END]]]

; [[[MIDEAS_ARTIFACT:ram_budget.json:BEGIN]]]
; {
;   "scope": "msx2_screen4_ram_budget",
;   "start": "#C000",
;   "end": "#C674",
;   "limit": "#F300",
;   "usableBytes": 13056,
;   "usedBytes": 1652,
;   "freeBytes": 11404,
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
;       "end": "#C0A8",
;       "bytes": 97,
;       "mutable": true,
;       "reason": "Fixed-size cache reserved only for snake-char body state."
;     },
;     {
;       "id": "runtime.persistent_effect_layers",
;       "start": "#C0A8",
;       "end": "#C228",
;       "bytes": 384,
;       "mutable": true,
;       "count": 2,
;       "bytesPerScreen": 192,
;       "reason": "One mutable effects layer per reachable SCREEN 4 room."
;     },
;     {
;       "id": "runtime.effects_scratch",
;       "start": "#C230",
;       "end": "#C2F0",
;       "bytes": 192,
;       "mutable": true,
;       "reason": "Temporary effect layer buffer for screens without persistent slot or loaders."
;     },
;     {
;       "id": "runtime.collision_current_cache",
;       "start": "#C2F0",
;       "end": "#C3B0",
;       "bytes": 192,
;       "mutable": true,
;       "reason": "Hot cache for the current SCREEN 4 collision layer copied from ROM data banks."
;     },
;     {
;       "id": "runtime.behavior_current_cache",
;       "start": "#C3B0",
;       "end": "#C470",
;       "bytes": 192,
;       "mutable": true,
;       "reason": "Hot cache for the current SCREEN 4 behavior layer copied from ROM data banks."
;     },
;     {
;       "id": "runtime.cell_flags_current_cache",
;       "start": "#C470",
;       "end": "#C530",
;       "bytes": 192,
;       "mutable": true,
;       "reason": "Packed current SCREEN 4 solid/effect/behavior flags, staged for the unified runtime layer contract."
;     },
;     {
;       "id": "runtime.visual_map_cache",
;       "start": "#C530",
;       "end": "#C5F0",
;       "bytes": 192,
;       "mutable": true,
;       "reason": "Current SCREEN 4 visual tile index map used for per-tile hazard hitbox lookup."
;     },
;     {
;       "id": "runtime.hazard_hitbox_cache",
;       "start": "#C5F0",
;       "end": "#C6F0",
;       "bytes": 256,
;       "mutable": true,
;       "reason": "Current SCREEN 4 per-tile hazard hitbox table (ox, oy, w, h bytes)."
;     },
;     {
;       "id": "runtime.enemy_pool",
;       "start": "#C700",
;       "end": "#C754",
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
msx2_player_coyote_timer EQU #C049
msx2_player_jump_buffer_timer EQU #C04A
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
MSX2_SCREEN4_DATA_BANK EQU 0
msx2_effects_runtime_buffers EQU #C0A8
msx2_effects_runtime_scratch EQU #C230
msx2_collision_runtime_cache EQU #C2F0
msx2_behavior_runtime_cache EQU #C3B0
msx2_cell_flags_runtime_cache EQU #C470
msx2_visual_map_cache EQU #C530
msx2_hazard_hitbox_cache EQU #C5F0
msx2_hazard_hitbox_count EQU 7
msx2_hazard_hitbox_cache_bytes EQU 32
msx2_hazard_probe_ox EQU #C610
msx2_hazard_probe_oy EQU #C611
msx2_hazard_probe_w EQU #C612
msx2_hazard_probe_h EQU #C613
msx2_enemy_runtime_x EQU #C620
msx2_enemy_runtime_y EQU #C62C
msx2_enemy_runtime_dx EQU #C638
msx2_enemy_runtime_dy EQU #C644
msx2_enemy_runtime_mode EQU #C650
msx2_enemy_runtime_speed EQU #C65C
msx2_enemy_runtime_tick EQU #C668
msx2_runtime_ram_end EQU #C674
msx2_runtime_ram_limit EQU #F300
msx2_layer_size EQU 192
msx2_required_collectibles EQU 2
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
    call load_MSX2_LAYERS_SMOKE_SCREEN_screen4
    call msx2_reset_enemy_runtime_for_current_screen
    call init_hardware_sprites



    call ENASCR
    ei

    ; MSX2 minimal GameFlow: MSX2 SCREEN 4 GameFlow entry.
    jp msx2_gf_node_0
msx2_gf_node_0:
    jp msx2_gf_node_1
msx2_gf_node_1:
    ld a, 0
    ld (msx2_current_screen_index), a
    call load_MSX2_LAYERS_SMOKE_SCREEN_screen4
    call msx2_reset_enemy_runtime_for_current_screen
    call init_hardware_sprites
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


    ld a, 96
    ld (msx2_player_sprite_x), a
    ld a, 144
    ld (msx2_player_sprite_y), a
    ld a, 1
    ld (msx2_player_sprite_dx), a
    ld a, 0
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

msx2_sfx_gem:
    ; collector_gems pickup blip. Clobbers AF/B/HL (msx2_play_psg_sfx).
    ld hl, msx2_sfx_gem_data
    ld b, 7
    jp msx2_play_psg_sfx

msx2_sfx_gem_data:
    db 7,#3E,0,#1C,1,#00,11,#28,12,#00,8,#10,13,#09

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
    call load_MSX2_LAYERS_SMOKE_SCREEN_screen4
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
    ; Arcade slice without platform vertical physics.
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
    ld a, 4
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
    ld a, 8
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
    ld a, 8
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
    ld a, 8
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
    ld a, 8
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
    ld a, 8
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
    ld a, 8
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
    ld a, 8
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
    ld a, 8
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
    ld a, 8
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
    ld a, 8
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
    ld a, 8
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
    ld a, 8
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
    ld a, 12
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
    ld a, 12
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
    ld a, 16
    ld hl, #1E42
    call write_vram_byte_ext
    xor a
    ld hl, #1E43
    call write_vram_byte_ext
.enemy_bullet_sprite_done:

    ; HUD life marker 1.
    ld a, (msx2_lives)
    cp 1
    jp nc, .hud_life_0_visible
    ld a, 208
    ld hl, #1E44
    call write_vram_byte_ext
    jp .hud_life_0_done
.hud_life_0_visible:
    ld a, 8
    ld hl, #1E44
    call write_vram_byte_ext
    ld a, 28
    ld hl, #1E45
    call write_vram_byte_ext
    ld a, 16
    ld hl, #1E46
    call write_vram_byte_ext
    xor a
    ld hl, #1E47
    call write_vram_byte_ext
.hud_life_0_done:

    ; HUD life marker 2.
    ld a, (msx2_lives)
    cp 2
    jp nc, .hud_life_1_visible
    ld a, 208
    ld hl, #1E48
    call write_vram_byte_ext
    jp .hud_life_1_done
.hud_life_1_visible:
    ld a, 18
    ld hl, #1E48
    call write_vram_byte_ext
    ld a, 28
    ld hl, #1E49
    call write_vram_byte_ext
    ld a, 16
    ld hl, #1E4A
    call write_vram_byte_ext
    xor a
    ld hl, #1E4B
    call write_vram_byte_ext
.hud_life_1_done:

    ; HUD life marker 3.
    ld a, (msx2_lives)
    cp 3
    jp nc, .hud_life_2_visible
    ld a, 208
    ld hl, #1E4C
    call write_vram_byte_ext
    jp .hud_life_2_done
.hud_life_2_visible:
    ld a, 28
    ld hl, #1E4C
    call write_vram_byte_ext
    ld a, 28
    ld hl, #1E4D
    call write_vram_byte_ext
    ld a, 16
    ld hl, #1E4E
    call write_vram_byte_ext
    xor a
    ld hl, #1E4F
    call write_vram_byte_ext
.hud_life_2_done:
    ld a, 208
    ld hl, #1E50
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
    cp 2
    jp c, .enemy_slot_0_ball_brick_not_complete
    ld (msx2_level_complete_flag), a
.enemy_slot_0_ball_brick_not_complete:

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
    ; collector_gems skill: +250 points per gem (16-bit score add).
    ld a, (msx2_score_lo)
    add a, #FA
    ld (msx2_score_lo), a
    ld a, (msx2_score_hi)
    adc a, #00
    ld (msx2_score_hi), a
    call draw_msx2_score_hud
    call msx2_sfx_gem
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
    ; B=x pixel, C=y pixel. Returns A=solid mask with Z set when empty.
    ; Clobbers AF/DE/HL. Preserves BC inputs.
    call msx2_cell_solid_at_pixel
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

    ret
















msx2_try_world_edge_transition_left:
    ld a, (msx2_current_screen_index)
    cp 0
    jp z, .left_screen_0
    cp 1
    jp z, .left_screen_1
    jp upload_hardware_sprite_attrs
.left_screen_0:
    ld a, 1
    ld (msx2_current_screen_index), a
    call load_MSX2_LAYERS_EXIT_SCREEN_screen4
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

.left_screen_1:
    jp upload_hardware_sprite_attrs

msx2_try_world_edge_transition_right:
    ld a, (msx2_current_screen_index)
    cp 0
    jp z, .right_screen_0
    cp 1
    jp z, .right_screen_1
    jp upload_hardware_sprite_attrs
.right_screen_0:
    jp upload_hardware_sprite_attrs

.right_screen_1:
    ld a, 0
    ld (msx2_current_screen_index), a
    call load_MSX2_LAYERS_SMOKE_SCREEN_screen4
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
    ; Restores each msx2screen mutable packed cell flag layer from ROM into persistent RAM.
    ; Clobbers AF/BC/DE/HL.
    ld hl, MSX2_LAYERS_SMOKE_SCREEN_CELL_FLAGS
    ld de, #C0A8
    ld bc, msx2_layer_size
    ldir

    ld hl, MSX2_LAYERS_EXIT_SCREEN_CELL_FLAGS
    ld de, #C168
    ld bc, msx2_layer_size
    ldir

    ret

load_current_msx2_screen4:
    ; Dispatches the active SCREEN 4 room by msx2_current_screen_index. Clobbers AF/BC/DE/HL.
    ld a, (msx2_current_screen_index)
    cp 0
    jp z, load_MSX2_LAYERS_SMOKE_SCREEN_screen4
    cp 1
    jp z, load_MSX2_LAYERS_EXIT_SCREEN_screen4
    jp load_MSX2_LAYERS_SMOKE_SCREEN_screen4

load_MSX2_LAYERS_SMOKE_SCREEN_screen4:
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

    ld hl, MSX2_LAYERS_SMOKE_SCREEN_BANK_0_PATTERNS
    ld de, #0000
    ld bc, 8
    call LDIRVM
    ld hl, MSX2_LAYERS_SMOKE_SCREEN_BANK_0_COLORS
    ld de, #2000
    ld bc, 8
    call LDIRVM
    ld hl, MSX2_LAYERS_SMOKE_SCREEN_BANK_1_PATTERNS
    ld de, #0800
    ld bc, 16
    call LDIRVM
    ld hl, MSX2_LAYERS_SMOKE_SCREEN_BANK_1_COLORS
    ld de, #2800
    ld bc, 16
    call LDIRVM
    ld hl, MSX2_LAYERS_SMOKE_SCREEN_BANK_2_PATTERNS
    ld de, #1000
    ld bc, 128
    call LDIRVM
    ld hl, MSX2_LAYERS_SMOKE_SCREEN_BANK_2_COLORS
    ld de, #3000
    ld bc, 128
    call LDIRVM

    ld hl, MSX2_LAYERS_SMOKE_SCREEN_NAMES
    ld de, SCREEN4_NAME_VRAM
    ld bc, SCREEN4_NAME_SIZE
    call LDIRVM

    call load_msx2_hud_font
    call draw_MSX2_LAYERS_SMOKE_SCREEN_hud_text
    ld hl, MSX2_LAYERS_SMOKE_SCREEN_COLLISION
    ld (msx2_current_collision_ptr), hl
    ld hl, MSX2_LAYERS_SMOKE_SCREEN_BEHAVIOR
    ld (msx2_current_behavior_ptr), hl
    ld hl, MSX2_LAYERS_SMOKE_SCREEN_CELL_FLAGS
    ld de, msx2_cell_flags_runtime_cache
    ld bc, msx2_layer_size
    ldir
    ld hl, MSX2_LAYERS_SMOKE_SCREEN_VISUAL_MAP
    ld de, msx2_visual_map_cache
    ld bc, msx2_layer_size
    ldir
    ld hl, MSX2_LAYERS_SMOKE_SCREEN_TILE_HAZ_HIT
    ld de, msx2_hazard_hitbox_cache
    ld bc, msx2_hazard_hitbox_cache_bytes
    ldir
    ld hl, #C0A8
    ld (msx2_current_effects_ptr), hl
    call apply_MSX2_LAYERS_SMOKE_SCREEN_collected_visuals
    ret

load_MSX2_LAYERS_EXIT_SCREEN_screen4:
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

    ld hl, MSX2_LAYERS_EXIT_SCREEN_BANK_0_PATTERNS
    ld de, #0000
    ld bc, 8
    call LDIRVM
    ld hl, MSX2_LAYERS_EXIT_SCREEN_BANK_0_COLORS
    ld de, #2000
    ld bc, 8
    call LDIRVM
    ld hl, MSX2_LAYERS_EXIT_SCREEN_BANK_1_PATTERNS
    ld de, #0800
    ld bc, 8
    call LDIRVM
    ld hl, MSX2_LAYERS_EXIT_SCREEN_BANK_1_COLORS
    ld de, #2800
    ld bc, 8
    call LDIRVM
    ld hl, MSX2_LAYERS_EXIT_SCREEN_BANK_2_PATTERNS
    ld de, #1000
    ld bc, 32
    call LDIRVM
    ld hl, MSX2_LAYERS_EXIT_SCREEN_BANK_2_COLORS
    ld de, #3000
    ld bc, 32
    call LDIRVM

    ld hl, MSX2_LAYERS_EXIT_SCREEN_NAMES
    ld de, SCREEN4_NAME_VRAM
    ld bc, SCREEN4_NAME_SIZE
    call LDIRVM

    call load_msx2_hud_font
    call draw_MSX2_LAYERS_EXIT_SCREEN_hud_text
    ld hl, MSX2_LAYERS_EXIT_SCREEN_COLLISION
    ld (msx2_current_collision_ptr), hl
    ld hl, MSX2_LAYERS_EXIT_SCREEN_BEHAVIOR
    ld (msx2_current_behavior_ptr), hl
    ld hl, MSX2_LAYERS_EXIT_SCREEN_CELL_FLAGS
    ld de, msx2_cell_flags_runtime_cache
    ld bc, msx2_layer_size
    ldir
    ld hl, MSX2_LAYERS_EXIT_SCREEN_VISUAL_MAP
    ld de, msx2_visual_map_cache
    ld bc, msx2_layer_size
    ldir
    ld hl, MSX2_LAYERS_EXIT_SCREEN_TILE_HAZ_HIT
    ld de, msx2_hazard_hitbox_cache
    ld bc, msx2_hazard_hitbox_cache_bytes
    ldir
    ld hl, #C168
    ld (msx2_current_effects_ptr), hl
    call apply_MSX2_LAYERS_EXIT_SCREEN_collected_visuals
    ret

apply_MSX2_LAYERS_SMOKE_SCREEN_collected_visuals:
    ; Re-erases collectibles already cleared from this screen's persistent effect RAM.
    ; Clobbers AF/BC/DE/HL.
    ld hl, #C13D
    ld a, (hl)
    and MSX2_CELL_EFFECT_MASK
    srl a
    cp 3
    jp z, keep_MSX2_LAYERS_SMOKE_SCREEN_collectible_0
    ld hl, #1A4A
    call clear_screen4_name_cell_16
keep_MSX2_LAYERS_SMOKE_SCREEN_collectible_0:
    ld hl, #C13F
    ld a, (hl)
    and MSX2_CELL_EFFECT_MASK
    srl a
    cp 3
    jp z, keep_MSX2_LAYERS_SMOKE_SCREEN_collectible_1
    ld hl, #1A4E
    call clear_screen4_name_cell_16
keep_MSX2_LAYERS_SMOKE_SCREEN_collectible_1:
    ret

apply_MSX2_LAYERS_EXIT_SCREEN_collected_visuals:
    ; Re-erases collectibles already cleared from this screen's persistent effect RAM.
    ; Clobbers AF/BC/DE/HL.
    ; No collectible cells on this screen.
    ret

draw_MSX2_LAYERS_SMOKE_SCREEN_hud_text:
    ld hl, #180D
    ld de, MSX2_LAYERS_SMOKE_SCREEN_HUD_TEXT_0
    call draw_msx2_hud_string
    ld hl, #1816
    ld de, MSX2_LAYERS_SMOKE_SCREEN_HUD_TEXT_1
    call draw_msx2_hud_string
    ret

; MSX2 Layers Smoke Screen HUD text "000"
MSX2_LAYERS_SMOKE_SCREEN_HUD_TEXT_0:
    DB #30,#30,#30,#00
; MSX2 Layers Smoke Screen HUD text "ROOM"
MSX2_LAYERS_SMOKE_SCREEN_HUD_TEXT_1:
    DB #52,#4F,#4F,#4D,#00

draw_MSX2_LAYERS_EXIT_SCREEN_hud_text:
    ret
    ret


; Palette bytes: byte1=(R<<4)|B, byte2=G
screen4_palette_data:
    DB #00,#00,#00,#00,#11,#06,#33,#07,#17,#01,#27,#03,#51,#01,#27,#06
    DB #71,#01,#73,#03,#61,#06,#64,#06,#11,#04,#65,#02,#55,#05,#77,#07

; Per-msx2screen respawn X coordinates
msx2_screen_spawn_x:
    DB #60,#60

; Per-msx2screen respawn Y coordinates
msx2_screen_spawn_y:
    DB #90,#90

; Per-msx2screen collectible count required before exits unlock
msx2_screen_required_collectibles:
    DB #02,#02

; Per-msx2screen initial air/time values
msx2_screen_initial_air:
    DB #FF,#C0

; Per-msx2screen HUD style: 0=compact runtime HUD, 1=status bars
msx2_screen_hud_style:
    DB #01,#01

; Per-msx2screen planned player energy maximum
msx2_screen_hud_player_energy_max:
    DB #10,#10

; Per-msx2screen planned player energy initial value
msx2_screen_hud_player_energy_initial:
    DB #0C,#08

; Per-msx2screen planned boss energy maximum
msx2_screen_hud_boss_energy_max:
    DB #20,#10

; Per-msx2screen planned boss energy initial value
msx2_screen_hud_boss_energy_initial:
    DB #18,#10

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
    DB #03,#02

; Per-msx2screen byte offsets into msx2_screen_hud_widget_records
msx2_screen_hud_widget_offset:
    DB #00,#00,#24,#00

; Flat authored HUD widget records: kind,binding,x,y,w,h,max,initial,primary,secondary,border,empty
msx2_screen_hud_widget_records:
    DB #01,#01,#08,#05,#40,#06,#10,#0C,#0A,#08,#0F,#04,#02,#04,#68,#04
    DB #28,#08,#FF,#00,#0F,#0A,#0F,#04,#04,#07,#B0,#04,#40,#08,#10,#10
    DB #0F,#08,#0F,#04,#01,#03,#10,#03,#60,#06,#FF,#C0,#0A,#08,#0F,#04
    DB #03,#05,#08,#04,#10,#10,#10,#10,#0F,#08,#0F,#04

; Per-widget icon tile index for icon HUD widgets, #FF means none
msx2_screen_hud_widget_icon_tile:
    DB #FF,#FF,#FF,#FF,#03

; Per-widget byte offsets into msx2_screen_hud_widget_text_pool
msx2_screen_hud_widget_text_offset:
    DB #00,#00,#00,#00,#01,#00,#00,#00,#00,#00

; Per-widget text lengths for text HUD widgets
msx2_screen_hud_widget_text_length:
    DB #00,#00,#04,#00,#00

; Zero-terminated ASCII text payloads for text HUD widgets; offset 0 is empty
msx2_screen_hud_widget_text_pool:
    DB #00,#52,#4F,#4F,#4D,#00

; Per-widget byte offsets into msx2_screen_hud_widget_variable_name_pool
msx2_screen_hud_widget_variable_name_offset:
    DB #00,#00,#00,#00,#01,#00,#00,#00,#00,#00

; Per-widget variable name lengths for custom HUD bindings
msx2_screen_hud_widget_variable_length:
    DB #00,#00,#0A,#00,#00

; Zero-terminated ASCII variable names for custom HUD bindings; offset 0 is empty
msx2_screen_hud_widget_variable_name_pool:
    DB #00,#52,#6F,#6F,#6D,#20,#4C,#61,#62,#65,#6C,#00

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


; Per-msx2screen active enemy/hazard entity count, capped at 12
msx2_screen_enemy_count:
    DB #03,#00

; Per-msx2screen enemy/hazard entity X coordinates, 12 slots per screen
msx2_screen_enemy_x:
    DB #30,#50,#C0,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard entity Y coordinates, 12 slots per screen
msx2_screen_enemy_y:
    DB #60,#90,#40,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard patrol minimum X, 12 slots per screen
msx2_screen_enemy_min_x:
    DB #20,#50,#C0,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard patrol maximum X, 12 slots per screen
msx2_screen_enemy_max_x:
    DB #60,#50,#C0,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard patrol minimum Y, 12 slots per screen
msx2_screen_enemy_min_y:
    DB #60,#90,#30,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard patrol maximum Y, 12 slots per screen
msx2_screen_enemy_max_y:
    DB #60,#90,#70,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard initial movement direction, 12 slots per screen
msx2_screen_enemy_dx:
    DB #01,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00

; Per-msx2screen enemy/hazard initial vertical movement direction, 12 slots per screen
msx2_screen_enemy_dy:
    DB #00,#00,#01,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
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






msx2_hw_sprite_patterns:
; Hardware metasprite frame 0 part 0: x+0, y+0
msx2_hw_sprite_frame_0_pattern_0:
    DB #0F,#1F,#0F,#0B,#0F,#0F,#1F,#20,#20,#0F,#0F,#0A,#0A,#0A,#11,#31
    DB #00,#80,#00,#00,#00,#00,#80,#40,#40,#00,#00,#00,#00,#00,#00,#80
; Hardware metasprite frame 0 part 1: x+0, y+0
msx2_hw_sprite_frame_0_pattern_1:
    DB #00,#00,#10,#14,#10,#00,#00,#1F,#1F,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#80,#80,#80,#00,#00,#80,#80,#00,#00,#00,#00,#00,#00,#00
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
    DB #05,#05,#02,#02,#02,#08,#08,#05,#05,#08,#05,#05,#05,#05,#05,#05
; Line colors for hardware sprite layer 1
msx2_hw_sprite_colors_1:
    DB #08,#08,#05,#05,#05,#08,#08,#08,#08,#08,#08,#08,#08,#08,#08,#08
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
; Line colors for HUD life marker 1
msx2_hw_hud_life_colors_0:
    DB #0A,#0A,#0A,#0A,#0A,#0A,#0A,#0A,#0A,#0A,#0A,#0A,#0A,#0A,#0A,#0A
; Line colors for HUD life marker 2
msx2_hw_hud_life_colors_1:
    DB #0A,#0A,#0A,#0A,#0A,#0A,#0A,#0A,#0A,#0A,#0A,#0A,#0A,#0A,#0A,#0A
; Line colors for HUD life marker 3
msx2_hw_hud_life_colors_2:
    DB #0A,#0A,#0A,#0A,#0A,#0A,#0A,#0A,#0A,#0A,#0A,#0A,#0A,#0A,#0A,#0A
msx2_hw_sprite_colors_end:

; 2 player hardware sprite(s), 12 enemy/hazard sprite slots, 2 player bullet slot, 2 enemy bullet slot, 3 HUD life slots; next Y=208 terminates the SAT
msx2_hw_sprite_attrs:
    DB #90,#60,#00,#00,#90,#60,#04,#00,#D0,#00,#08,#00,#D0,#00,#08,#00
    DB #D0,#00,#08,#00,#D0,#00,#08,#00,#D0,#00,#08,#00,#D0,#00,#08,#00
    DB #D0,#00,#08,#00,#D0,#00,#08,#00,#D0,#00,#08,#00,#D0,#00,#08,#00
    DB #D0,#00,#08,#00,#D0,#00,#08,#00,#D0,#00,#0C,#00,#D0,#00,#0C,#00
    DB #D0,#00,#10,#00,#D0,#08,#10,#00,#D0,#12,#10,#00,#D0,#1C,#10,#00
    DB #D0,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00


; MSX2 Layers Smoke Screen collision layer, 16x12 bytes
MSX2_LAYERS_SMOKE_SCREEN_COLLISION:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#01,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; MSX2 Layers Smoke Screen effects layer, 16x12 bytes
MSX2_LAYERS_SMOKE_SCREEN_EFFECTS:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#01,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#03,#00,#03,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; MSX2 Layers Smoke Screen behavior layer, 16x12 bytes
MSX2_LAYERS_SMOKE_SCREEN_BEHAVIOR:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#01,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#01,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#02,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; MSX2 Layers Smoke Screen packed cell flags (solid/effect/behavior), 16x12 bytes
MSX2_LAYERS_SMOKE_SCREEN_CELL_FLAGS:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#08,#02,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#06,#08,#06,#01,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#11,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; MSX2 Layers Smoke Screen visual tile index map, 16x12 bytes
MSX2_LAYERS_SMOKE_SCREEN_VISUAL_MAP:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#03,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#03,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#03,#05,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#04,#05,#04,#02,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; MSX2 Layers Smoke Screen per-tile hazard hitboxes (ox, oy, w, h)
MSX2_LAYERS_SMOKE_SCREEN_TILE_HAZ_HIT:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; MSX2 Layers Exit Screen collision layer, 16x12 bytes
MSX2_LAYERS_EXIT_SCREEN_COLLISION:
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
    DB #00,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; MSX2 Layers Exit Screen effects layer, 16x12 bytes
MSX2_LAYERS_EXIT_SCREEN_EFFECTS:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#02,#02,#02,#02,#02,#02
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#02,#02,#02,#02,#02,#02
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#02,#02,#02,#02,#02,#02
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; MSX2 Layers Exit Screen behavior layer, 16x12 bytes
MSX2_LAYERS_EXIT_SCREEN_BEHAVIOR:
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

; MSX2 Layers Exit Screen packed cell flags (solid/effect/behavior), 16x12 bytes
MSX2_LAYERS_EXIT_SCREEN_CELL_FLAGS:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#04,#04,#04,#04,#04,#04
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#04,#04,#04,#04,#04,#04
    DB #00,#01,#01,#01,#01,#01,#01,#01,#01,#01,#05,#05,#05,#05,#05,#05
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; MSX2 Layers Exit Screen visual tile index map, 16x12 bytes
MSX2_LAYERS_EXIT_SCREEN_VISUAL_MAP:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#03,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01,#01
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; MSX2 Layers Exit Screen per-tile hazard hitboxes (ox, oy, w, h)
MSX2_LAYERS_EXIT_SCREEN_TILE_HAZ_HIT:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; MSX2 Layers Smoke Screen SCREEN 4 name table, 32x24 chars
MSX2_LAYERS_SMOKE_SCREEN_NAMES:
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
    DB #00,#00,#00,#00,#00,#00,#00,#00,#01,#01,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#01,#01,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#01,#01,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#01,#01,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#01,#02,#03,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#01,#01,#04,#05,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#06,#07,#02,#03,#06,#07
    DB #0A,#0B,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#08,#09,#04,#05,#08,#09
    DB #0C,#0D,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E
    DB #0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#0E,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F
    DB #0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#0F,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; MSX2 Layers Smoke Screen SCREEN 4 bank 0 compact patterns
MSX2_LAYERS_SMOKE_SCREEN_BANK_0_PATTERNS:
    DB #00,#00,#00,#00,#00,#00,#00,#00

; MSX2 Layers Smoke Screen SCREEN 4 bank 0 compact colors
MSX2_LAYERS_SMOKE_SCREEN_BANK_0_COLORS:
    DB #00,#00,#00,#00,#00,#00,#00,#00

; MSX2 Layers Smoke Screen SCREEN 4 bank 1 compact patterns
MSX2_LAYERS_SMOKE_SCREEN_BANK_1_PATTERNS:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#AA,#55,#AA,#55,#AA,#55,#AA,#55

; MSX2 Layers Smoke Screen SCREEN 4 bank 1 compact colors
MSX2_LAYERS_SMOKE_SCREEN_BANK_1_COLORS:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#71,#71,#71,#71,#71,#71,#71,#71

; MSX2 Layers Smoke Screen SCREEN 4 bank 2 compact patterns
MSX2_LAYERS_SMOKE_SCREEN_BANK_2_PATTERNS:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#AA,#55,#AA,#55,#AA,#55,#AA,#55
    DB #00,#10,#10,#10,#10,#00,#10,#10,#00,#08,#08,#08,#08,#00,#08,#08
    DB #10,#10,#00,#10,#10,#10,#10,#00,#08,#08,#00,#08,#08,#08,#08,#00
    DB #00,#00,#00,#05,#0A,#15,#15,#15,#00,#00,#00,#A0,#A0,#A8,#A8,#A8
    DB #15,#15,#15,#05,#05,#00,#00,#00,#A8,#A8,#A8,#50,#A0,#00,#00,#00
    DB #00,#00,#00,#E0,#E0,#E0,#E0,#E0,#00,#00,#00,#07,#07,#07,#07,#07
    DB #E0,#E0,#E0,#E0,#E0,#00,#00,#00,#07,#07,#07,#07,#07,#00,#00,#00
    DB #00,#00,#00,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33

; MSX2 Layers Smoke Screen SCREEN 4 bank 2 compact colors
MSX2_LAYERS_SMOKE_SCREEN_BANK_2_COLORS:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#71,#71,#71,#71,#71,#71,#71,#71
    DB #77,#70,#70,#70,#70,#77,#70,#70,#77,#70,#70,#70,#70,#77,#70,#70
    DB #70,#70,#77,#70,#70,#70,#70,#77,#70,#70,#77,#70,#70,#70,#70,#77
    DB #00,#00,#00,#B0,#B0,#B0,#F0,#B0,#00,#00,#00,#F0,#B0,#F0,#B0,#F0
    DB #F0,#B0,#F0,#B0,#F0,#00,#00,#00,#B0,#F0,#B0,#B0,#B0,#00,#00,#00
    DB #FF,#FF,#FF,#F6,#F6,#F6,#F6,#F6,#FF,#FF,#FF,#F6,#F6,#F6,#F6,#F6
    DB #F6,#F6,#F6,#F6,#F6,#FF,#FF,#FF,#F6,#F6,#F6,#F6,#F6,#FF,#FF,#FF
    DB #FF,#FF,#FF,#54,#54,#54,#54,#54,#54,#54,#54,#54,#54,#54,#54,#54

; MSX2 Layers Exit Screen SCREEN 4 name table, 32x24 chars
MSX2_LAYERS_EXIT_SCREEN_NAMES:
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
    DB #00,#00,#00,#00,#00,#00,#01,#01,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#01,#01,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02
    DB #02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02,#02
    DB #00,#00,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03
    DB #03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03,#03
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00
    DB #00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00,#00

; MSX2 Layers Exit Screen SCREEN 4 bank 0 compact patterns
MSX2_LAYERS_EXIT_SCREEN_BANK_0_PATTERNS:
    DB #00,#00,#00,#00,#00,#00,#00,#00

; MSX2 Layers Exit Screen SCREEN 4 bank 0 compact colors
MSX2_LAYERS_EXIT_SCREEN_BANK_0_COLORS:
    DB #00,#00,#00,#00,#00,#00,#00,#00

; MSX2 Layers Exit Screen SCREEN 4 bank 1 compact patterns
MSX2_LAYERS_EXIT_SCREEN_BANK_1_PATTERNS:
    DB #00,#00,#00,#00,#00,#00,#00,#00

; MSX2 Layers Exit Screen SCREEN 4 bank 1 compact colors
MSX2_LAYERS_EXIT_SCREEN_BANK_1_COLORS:
    DB #00,#00,#00,#00,#00,#00,#00,#00

; MSX2 Layers Exit Screen SCREEN 4 bank 2 compact patterns
MSX2_LAYERS_EXIT_SCREEN_BANK_2_PATTERNS:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#AA,#55,#AA,#55,#AA,#55,#AA,#55
    DB #00,#00,#00,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33,#33

; MSX2 Layers Exit Screen SCREEN 4 bank 2 compact colors
MSX2_LAYERS_EXIT_SCREEN_BANK_2_COLORS:
    DB #00,#00,#00,#00,#00,#00,#00,#00,#71,#71,#71,#71,#71,#71,#71,#71
    DB #FF,#FF,#FF,#54,#54,#54,#54,#54,#54,#54,#54,#54,#54,#54,#54,#54

    ds #C000 - $, #FF
    end
