"use strict";
/**
 * @fileoverview Game Flow Generator - GameFlow-Based Execution Engine
 * Generates complete GameFlow execution system based on node graph
 *
 * Architecture: GameFlow is the SOLE orchestrator of game execution.
 * The ASM code follows the graph structure exclusively, starting from
 * the Start node and executing each connected node in sequence.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateGameFlowFile = generateGameFlowFile;
const constants_1 = require("../../../constants");
function hasFrameAudio(analysis) {
    return ((analysis.tracks?.length || 0) > 0) || ((analysis.stateMachines?.length || 0) > 0);
}
function shouldTickAudioInGameFlow(analysis, executionPlan) {
    if (!hasFrameAudio(analysis)) {
        return false;
    }
    return !executionPlan?.tasks.some((task) => task.responsibility === 'audio');
}
function buildGameFlowAudioTickAsm(analysis, executionPlan) {
    if (!shouldTickAudioInGameFlow(analysis, executionPlan)) {
        return '';
    }
    return '    call task_audio_tick\n';
}
/**
 * Sanitize node ID for use in ASM labels
 */
function sanitizeId(id) {
    return id.replace(/[^a-zA-Z0-9]/g, '_');
}
/**
 * Normalize text for ASM string literals used in generated labels/data.
 */
function sanitizeAsmText(value) {
    return String(value || '')
        .replace(/"/g, '')
        .replace(/\r?\n/g, ' ')
        .trim();
}
/**
 * Convert hex color to MSX color code (0-15).
 * Matches the mapping strategy used by menusGenerator.
 */
function hexToRGB(hex) {
    const clean = String(hex || '').trim();
    if (!clean || clean.toLowerCase().startsWith('rgba(0,0,0,0'))
        return null;
    const normalized = clean.replace('#', '');
    if (normalized.length !== 6)
        return null;
    const r = parseInt(normalized.substring(0, 2), 16);
    const g = parseInt(normalized.substring(2, 4), 16);
    const b = parseInt(normalized.substring(4, 6), 16);
    if ([r, g, b].some((v) => Number.isNaN(v)))
        return null;
    return { r, g, b };
}
function hexToMSX1Index(hex, allowTransparent = true) {
    const raw = String(hex || '').trim();
    if (!raw)
        return allowTransparent ? 0 : 1;
    if (raw.toLowerCase().startsWith('rgba(0,0,0,0'))
        return allowTransparent ? 0 : 1;
    const upper = raw.toUpperCase();
    const exact = constants_1.MSX1_PALETTE.find((c) => c.hex.toUpperCase() === upper);
    if (exact)
        return exact.index;
    const rgb = hexToRGB(raw);
    if (!rgb)
        return allowTransparent ? 0 : 1;
    let bestIndex = allowTransparent ? 0 : 1;
    let bestDist = Infinity;
    for (const c of constants_1.MSX1_PALETTE) {
        if (!allowTransparent && c.index === 0)
            continue;
        const cRgb = hexToRGB(c.hex);
        if (!cRgb)
            continue;
        const dist = (rgb.r - cRgb.r) ** 2 + (rgb.g - cRgb.g) ** 2 + (rgb.b - cRgb.b) ** 2;
        if (dist < bestDist) {
            bestDist = dist;
            bestIndex = c.index;
        }
    }
    return bestIndex;
}
function hexToMSXColor(hex) {
    const idx = hexToMSX1Index(hex, false);
    return idx === 0 ? 1 : idx;
}
/**
 * Find sprite asset index by id in analysis.sprites.
 */
function findSpriteAssetIndex(analysis, spriteAssetId) {
    const id = String(spriteAssetId || '').trim();
    if (!id)
        return -1;
    const sprites = Array.isArray(analysis.sprites) ? analysis.sprites : [];
    return sprites.findIndex((s) => String(s?.id || '').trim() === id);
}
/**
 * Analyze drawable layer indexes in a sprite (used at least once).
 */
function analyzeDrawableLayerIndexes(sprite) {
    const palette = sprite?.spritePalette || [];
    const bg = sprite?.backgroundColor;
    const frames = sprite?.frames || [];
    if (!palette.length || !frames.length)
        return [];
    const used = [];
    for (let layerIdx = 0; layerIdx < palette.length; layerIdx++) {
        const layerColor = palette[layerIdx];
        if (!layerColor || layerColor === bg)
            continue;
        let hasPixels = false;
        for (const frame of frames) {
            if (!frame?.data)
                continue;
            for (let y = 0; y < (frame.data.length || 0) && !hasPixels; y++) {
                for (let x = 0; x < (frame.data[y]?.length || 0) && !hasPixels; x++) {
                    if (frame.data[y][x] === layerColor) {
                        hasPixels = true;
                    }
                }
            }
            if (hasPixels)
                break;
        }
        if (hasPixels) {
            used.push(layerIdx);
        }
    }
    return used;
}
/**
 * Build submenu cursor layer config (source pattern offsets + colors).
 * Keeps only drawable colors and clamps to 4 hardware sprite layers.
 */
function getSpriteLayerConfigForSubmenuCursor(sprite) {
    const palette = sprite?.spritePalette || [];
    const bg = sprite?.backgroundColor;
    const usedLayerIndexes = analyzeDrawableLayerIndexes(sprite);
    if (usedLayerIndexes.length === 0) {
        return { layerOffsets: [0], layerColors: [15] };
    }
    const selectedLayers = usedLayerIndexes.slice(0, 4);
    if (selectedLayers.length === 0) {
        return { layerOffsets: [0], layerColors: [15] };
    }
    const layerOffsets = selectedLayers.map((_idx, compactIndex) => compactIndex);
    const layerColors = selectedLayers.map((idx) => {
        const hex = palette[idx];
        if (!hex || (bg && hex === bg))
            return 0;
        return hexToMSX1Index(hex, true);
    });
    return { layerOffsets, layerColors };
}
/**
 * Resolve submenu selector mode from JSON appearance.
 * Supports aliases for backward/forward compatibility.
 */
function getSubMenuSelectorMode(node) {
    const raw = node?.appearance?.selectorType ??
        node?.appearance?.cursorType ??
        node?.appearance?.cursorMode ??
        node?.selectorType ??
        node?.cursorType ??
        node?.cursorMode;
    const mode = String(raw || '')
        .trim()
        .toLowerCase();
    if (mode === 'char' || mode === 'character' || mode === 'text' || mode === 'glyph') {
        return 'char';
    }
    if (mode === 'sprite' || mode === 'image') {
        return 'sprite';
    }
    return 'auto';
}
/**
 * Choose initial option index for SubMenu nodes.
 * Preview defaults to option 0 unless an explicit index exists.
 */
function getSubMenuInitialOptionIndex(node) {
    const options = Array.isArray(node?.options) ? node.options : [];
    if (options.length === 0)
        return 0;
    const explicitRaw = node?.initialSelection ??
        node?.initialSelectedOption ??
        node?.appearance?.initialSelection ??
        0;
    const explicit = Number(explicitRaw);
    if (!Number.isFinite(explicit))
        return 0;
    if (explicit < 0)
        return 0;
    if (explicit >= options.length)
        return 0;
    return Math.floor(explicit);
}
/**
 * Convert node type to constant name (e.g., "WorldLink" -> "NODE_TYPE_WORLD_LINK")
 */
function getNodeTypeConstant(nodeType) {
    return `NODE_TYPE_${nodeType
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .toUpperCase()}`;
}
/**
 * Get routine name for screen loading
 */
function getScreenLoadRoutineName(screen) {
    const screenName = (screen.name || 'DEFAULT').toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const screenIdSuffix = screen.id ? `_${screen.id.replace(/[^a-zA-Z0-9]/g, '_').slice(-12)}` : '';
    return `load_screen_${screenName.toLowerCase()}${screenIdSuffix.toLowerCase()}`;
}
/**
 * Resolve a global variable reference used by GameFlow nodes to a valid ASM symbol.
 * Returns null when the variable does not exist in analysis.globalVariables.
 */
function resolveGlobalVariableAsmName(variableName, analysis) {
    const rawName = String(variableName || '').trim();
    if (!rawName)
        return null;
    const toDefaultAsmName = (name) => `global_var_${name.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '').replace(/[^a-z0-9_]/g, '_')}`;
    const normalizedInput = rawName.toLowerCase();
    const expectedAsmName = toDefaultAsmName(rawName);
    const globals = Array.isArray(analysis.globalVariables) ? analysis.globalVariables : [];
    for (const v of globals) {
        const candidateName = String(v?.name || '').trim();
        const candidateAsmName = String(v?.asmName || '').trim();
        if (candidateName && candidateName.toLowerCase() === normalizedInput) {
            return candidateAsmName || toDefaultAsmName(candidateName);
        }
        if (candidateAsmName && candidateAsmName.toLowerCase() === normalizedInput) {
            return candidateAsmName;
        }
        if (candidateName && toDefaultAsmName(candidateName) === expectedAsmName) {
            return candidateAsmName || toDefaultAsmName(candidateName);
        }
    }
    return null;
}
/**
 * Get imported HUD frame draw routine name for a screen.
 * Returns null when screen has no imported HUD frame snapshot.
 */
function getImportedHudFrameDrawRoutineName(screen) {
    const importedCells = screen?.hudConfiguration?.importedFrame?.cells;
    if (!Array.isArray(importedCells) || importedCells.length === 0) {
        return null;
    }
    const screenName = (screen.name || 'DEFAULT').toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const screenIdSuffix = screen.id ? `_${screen.id.replace(/[^a-zA-Z0-9]/g, '_').slice(-12)}` : '';
    return `hud_imported_frame_${screenName.toLowerCase()}${screenIdSuffix.toLowerCase()}_draw`;
}
/**
 * Resolve runtime screen indexes where HUD has visible elements.
 * In world-based projects we map by world node index (current_screen_id runtime contract).
 * Without worlds, fallback to screen array index.
 */
function getHudRuntimeScreenIndexes(analysis) {
    const screenMaps = Array.isArray(analysis.screenMaps) ? analysis.screenMaps : [];
    const hudScreenAssetIds = new Set();
    screenMaps.forEach((screen) => {
        const hasHudElems = Array.isArray(screen?.hudConfiguration?.elements) && screen.hudConfiguration.elements.length > 0;
        if (hasHudElems && screen?.id) {
            hudScreenAssetIds.add(String(screen.id));
        }
    });
    if (hudScreenAssetIds.size === 0)
        return [];
    const worldMaps = Array.isArray(analysis.worldmaps) ? analysis.worldmaps : [];
    const runtimeIndexes = new Set();
    if (worldMaps.length > 0) {
        worldMaps.forEach((world) => {
            const nodes = Array.isArray(world?.nodes) ? world.nodes : [];
            nodes.forEach((node, idx) => {
                const screenAssetId = String(node?.screenAssetId || '');
                if (hudScreenAssetIds.has(screenAssetId)) {
                    runtimeIndexes.add(idx);
                }
            });
        });
    }
    else {
        screenMaps.forEach((screen, idx) => {
            if (screen?.id && hudScreenAssetIds.has(String(screen.id))) {
                runtimeIndexes.add(idx);
            }
        });
    }
    return Array.from(runtimeIndexes).sort((a, b) => a - b);
}
/**
 * Emit conditional HUD rendering for current_screen_id.
 */
function generateConditionalRenderHudAsm(runtimeScreenIndexes, labelBase, setDirtyBeforeRender = false) {
    if (runtimeScreenIndexes.length === 0)
        return '';
    let code = `    ld a, (current_screen_id)\n`;
    runtimeScreenIndexes.forEach((screenId) => {
        code += `    cp ${screenId}\n`;
        code += `    jp z, .${labelBase}_do\n`;
    });
    code += `    jp .${labelBase}_skip\n`;
    code += `.${labelBase}_do:\n`;
    if (setDirtyBeforeRender) {
        code += `    ld a, 1\n`;
        code += `    ld (hud_dirty_flag), a\n`;
    }
    code += `    call render_hud\n`;
    code += `.${labelBase}_skip:\n`;
    return code;
}
/**
 * Generate complete GameFlow file (gameflow.asm)
 *
 * This is the CORE of the new architecture. It generates:
 * 1. GameFlow execution engine (dispatcher)
 * 2. Node handlers for each node type
 * 3. Node data structures
 * 4. Connection tables
 *
 * @param analysis - Project analysis with GameFlow data
 * @returns Complete ASM code for GameFlow execution
 */
function generateGameFlowFile(analysis, executionPlan) {
    // If no GameFlow exists, generate a minimal default one
    if (!analysis.gameFlow) {
        return generateDefaultGameFlow(analysis, executionPlan);
    }
    const gameFlow = analysis.gameFlow;
    const frameAudioTickAsm = buildGameFlowAudioTickAsm(analysis, executionPlan);
    let code = `; ==================================================================
; GAMEFLOW EXECUTION ENGINE
; File: gameflow.asm
; Description: GameFlow-based game orchestration system
; ==================================================================
;
; GameFlow: ${gameFlow.name || 'Unnamed'}
; Total Nodes: ${gameFlow.nodes?.length || 0}
; Total Connections: ${gameFlow.connections?.length || 0}
; Start Node: ${gameFlow.startNodeId || 'NONE'}
;
; ARCHITECTURE:
; - GameFlow is the SOLE execution orchestrator
; - Each node generates its own execution code
; - Connections between nodes define the complete flow
; - No hardcoded main_loop outside GameFlow
; ==================================================================

`;
    // ===================================================================
    // SECTION 1: GAMEFLOW INITIALIZATION AND ENTRY POINT
    // ===================================================================
    code += `; ==================================================================
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
${gameFlow.startNodeId ? `    ld hl, gameflow_node_${sanitizeId(gameFlow.startNodeId)}` : `    ; ERROR: No start node defined!
    ret`}
    jp gameflow_execute_node

`;
    // ===================================================================
    // SECTION 2: CORE EXECUTION ENGINE
    // ===================================================================
    code += `; ==================================================================
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
`;
    // Generate dispatcher for all node types present in this GameFlow
    const nodeTypes = Array.from(new Set(gameFlow.nodes?.map((n) => n.type) || []));
    nodeTypes.forEach((nodeType) => {
        const handlerLabel = `gameflow_handle_${nodeType.toLowerCase()}`;
        code += `    cp ${getNodeTypeConstant(nodeType)}
    jp z, ${handlerLabel}
`;
    });
    code += `    
    ; Unknown node type - error
    ret

`;
    // ===================================================================
    // SECTION 3: NODE TYPE HANDLERS
    // ===================================================================
    code += `; ==================================================================
; NODE TYPE HANDLERS
; Each handler receives:
;   DE = node data pointer
;   BC = connection table pointer
; ==================================================================

`;
    code += generateNodeHandlers(nodeTypes, analysis, executionPlan);
    // ===================================================================
    // SECTION 4: CONNECTION UTILITIES
    // ===================================================================
    code += `; ==================================================================
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

`;
    // ===================================================================
    // SECTION 5: GAME LOOP (for WorldLink nodes)
    // ===================================================================
    // HUD is rendered only on runtime screens that actually contain HUD elements.
    const hudRuntimeScreenIndexes = getHudRuntimeScreenIndexes(analysis);
    const hasHud = hudRuntimeScreenIndexes.length > 0;
    const worldLoopHudRenderAsm = generateConditionalRenderHudAsm(hudRuntimeScreenIndexes, 'gf_worldloop_hud');
    const worldLinkHudBootstrapAsm = generateConditionalRenderHudAsm(hudRuntimeScreenIndexes, 'gf_worldlink_hud', true);
    code += `; ==================================================================
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
${frameAudioTickAsm}    ; Upload sprites right after V-Blank edge (60/50 Hz frame-paced)
    call update_sprites_to_vram

    ; Animated transform tiles do VRAM read-modify-write, so update them
    ; near the V-Blank edge before the expensive gameplay work.
    call update_animated_tiles

    ; Poll input in main loop (avoids BIOS-in-ISR compatibility issues)
    call task_update_input

    ; Handle world screen edge transitions (Preview parity)
    call check_world_screen_transition

    ; Update all entities
    call update_all_entities

    ; Execute all state machines
    call execute_all_state_machines

    ; Update timed PSG sound effects
    call sfx_update

    ; Sprite SAT upload runs once per frame, outside ISR (done at frame start).
${hasHud ? `
    ; Render HUD only on screens that define HUD elements
${worldLoopHudRenderAsm}` : ``}
    ; Loop
    jp gameflow_world_game_loop

`;
    // ===================================================================
    // SECTION 6: NODE DATA STRUCTURES
    // ===================================================================
    code += `; ==================================================================
; NODE DATA STRUCTURES
; Each node has: type byte, data pointer, connection table pointer
; ==================================================================

`;
    // Generate node structures and connection tables
    if (gameFlow.nodes && gameFlow.nodes.length > 0) {
        gameFlow.nodes.forEach((node) => {
            code += generateNodeStructure(node, gameFlow, analysis);
        });
    }
    // ===================================================================
    // SECTION 6.5: INITIALIZATION UTILITIES
    // ===================================================================
    code += `
; ==================================================================
; INITIALIZATION UTILITY FUNCTIONS
; ==================================================================

; ------------------------------------------------------------------
; init_psg_silence
; Silence all PSG channels
; ------------------------------------------------------------------
init_psg_silence:
    push af
    push bc

    ; Silence channel A
    ld a, #08    ; Volume register channel A
    out (#A0), a
    ld a, 0      ; Volume = 0
    out (#A1), a

    ; Silence channel B
    ld a, #09    ; Volume register channel B
    out (#A0), a
    ld a, 0
    out (#A1), a

    ; Silence channel C
    ld a, #0A    ; Volume register channel C
    out (#A0), a
    ld a, 0
    out (#A1), a

    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; clear_sprite_table
; Clear sprite attribute table in VRAM
; ------------------------------------------------------------------
clear_sprite_table:
    push af
    push bc
    push de
    push hl

    ; Clear sprite attribute table (#1B00-#1B7F, 128 bytes)
    ld hl, #1B00         ; Sprite attribute table base
    ld bc, 128           ; 128 bytes (32 sprites × 4 bytes)
    ld a, #D1            ; Y=209 (off-screen)
.cst_loop:
    push af
    push bc
    push hl
    call WRTVRM          ; Write to VRAM
    pop hl
    pop bc
    pop af
    inc hl
    dec bc
    ld a, b
    or c
    jr nz, .cst_loop

    pop hl
    pop de
    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; clear_vram_areas
; Clear VRAM pattern and color tables
; ------------------------------------------------------------------
clear_vram_areas:
    push af
    push bc
    push de
    push hl

    ; Clear pattern table (#0000-#17FF, 6144 bytes)
    ld hl, #0000
    ld bc, 6144
    ld a, 0
.clear_patterns:
    push af
    push bc
    push hl
    call WRTVRM
    pop hl
    pop bc
    pop af
    inc hl
    dec bc
    ld a, b
    or c
    jr nz, .clear_patterns

    ; Clear color table (#2000-#37FF, 6144 bytes)
    ld hl, #2000
    ld bc, 6144
    ld a, #F0            ; White on black
.clear_colors:
    push af
    push bc
    push hl
    call WRTVRM
    pop hl
    pop bc
    pop af
    inc hl
    dec bc
    ld a, b
    or c
    jr nz, .clear_colors

    pop hl
    pop de
    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; reset_vdp_registers
; Reset VDP registers to Screen 2 defaults
; ------------------------------------------------------------------
reset_vdp_registers:
    push af
    push bc

    ; Already configured in init_rom, this is a no-op for now
    ; Could be extended to reset specific registers if needed

    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; init_all_global_variables
; Initialize all global variables to their default values
; ------------------------------------------------------------------
init_all_global_variables:
`;
    // Generate initialization for all global variables in the project
    if (analysis.globalVariables && analysis.globalVariables.length > 0) {
        code += `    ; Initialize global variables\n`;
        analysis.globalVariables.forEach((v) => {
            const varName = v.name;
            const asmVarName = v.asmName || `global_var_${varName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')}`;
            const type = String(v.type || '').toLowerCase();
            // Use first value from values array as initial value (or 0 if no values).
            // Built-in variables may use placeholder strings like "number"; those are not valid ASM immediates,
            // so any non-numeric placeholder falls back to 0 for ROM initialization.
            const rawInitialValue = v.values && v.values.length > 0 ? v.values[0].value : 0;
            let numericValue = 0;
            if (typeof rawInitialValue === 'boolean') {
                numericValue = rawInitialValue ? 1 : 0;
            }
            else {
                const parsedValue = Number(rawInitialValue);
                numericValue = Number.isFinite(parsedValue) ? Math.trunc(parsedValue) : 0;
            }
            if (type === 'word' || type === '16bit') {
                const wordValue = Math.max(0, Math.min(65535, numericValue));
                code += `    ld a, ${wordValue & 0xFF}\n`;
                code += `    ld (${asmVarName}), a    ; ${varName} low byte = ${wordValue}\n`;
                code += `    ld a, ${(wordValue >> 8) & 0xFF}\n`;
                code += `    ld (${asmVarName}+1), a    ; ${varName} high byte = ${wordValue}\n`;
            }
            else {
                const byteValue = Math.max(0, Math.min(255, numericValue));
                code += `    ld a, ${byteValue}\n`;
                code += `    ld (${asmVarName}), a    ; ${varName} = ${byteValue}\n`;
            }
        });
    }
    code += `    ret

`;
    // ===================================================================
    // SECTION 7: VARIABLES
    // ===================================================================
    code += `; ==================================================================
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
`;
    return code;
}
/**
 * Generate handlers for all node types
 */
function generateNodeHandlers(nodeTypes, analysis, executionPlan) {
    let code = '';
    const frameAudioTickAsm = buildGameFlowAudioTickAsm(analysis, executionPlan);
    const hudRuntimeScreenIndexes = getHudRuntimeScreenIndexes(analysis);
    const hasHud = hudRuntimeScreenIndexes.length > 0;
    const worldLinkHudBootstrapAsm = generateConditionalRenderHudAsm(hudRuntimeScreenIndexes, 'gf_worldlink_hud', true);
    nodeTypes.forEach((nodeType) => {
        switch (nodeType) {
            case 'Start':
                code += `gameflow_handle_start:
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

`;
                break;
            case 'WorldLink':
                code += `gameflow_handle_worldlink:
    ; WorldLink node - load world and enter game loop
    ; DE = world data pointer:
    ;   [load_world_ptr DW][load_world_bank DB]
    ; BC = connection table (for exit)

    push bc         ; Save connection table

    ; Load the world
    ; DE points to: dw load_world_X, db load_world_bank
    ex de, hl
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld b, (hl)      ; B = load_world_X bank
    ld h, d
    ld l, e         ; HL = load_world_X address

    ; Mapper-safe far call to world load routine
    ld a, h
    or l
    jr z, .after_load
    ld a, b
    call mapper_call_hl_auto

.after_load:
    ; Set game state
    xor a
    ld (gameflow_exit_requested), a
    ld a, FLOW_STATE_GAME
    ld (current_flow_state), a

    ; Update sprites
    call update_sprites_to_vram
${hasHud ? `
    ; Bootstrap HUD only on screens that actually use HUD
${worldLinkHudBootstrapAsm}` : ``}
    ; Enter game loop
    call gameflow_world_game_loop

    ; Exited loop - continue to next node
    pop bc          ; Restore connection table
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

`;
                break;
            case 'End':
                code += `gameflow_handle_end:
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
${frameAudioTickAsm}

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

`;
                break;
            case 'Restart':
                code += `gameflow_handle_restart:
    ; Restart node - safe runtime reinit entry (no cold page remap).
    jp restart_rom

`;
                break;
            case 'SubMenu':
                {
                    const submenuCursorPatternCount = Math.max((analysis.sprites?.length || 0), 1);
                    let submenuCursorPatternTable = '';
                    for (let i = 0; i < submenuCursorPatternCount; i++) {
                        submenuCursorPatternTable += `    dw SPRITE_${i}_PATTERN\n`;
                    }
                    code += `gameflow_handle_submenu:
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
    jr .smp_exit

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
${frameAudioTickAsm}
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
    ld a, 0
    call GTTRIG
    or a
    jr z, .smp_loop

.smp_wait_fire_release:
    halt
${frameAudioTickAsm}
    ld a, 0
    call GTTRIG
    or a
    jr nz, .smp_wait_fire_release
    jr .smp_exit

.smp_wait_neutral:
.smp_wait_neutral_loop:
    halt
${frameAudioTickAsm}
    ld a, 0
    call GTSTCK
    or a
    jr nz, .smp_wait_neutral_loop
    jr .smp_loop

.smp_exit:
    call submenu_hide_cursor_sprite
    ; Ensure no gameplay/menu sprite remains resident after leaving submenu.
    call clear_all_sprites
    call update_sprites_to_vram
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
    call set_screen_colors
    pop af
    call init_char0_color

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
    call init_font_system

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
    jr z, .rss_done

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
    jr nc, .rss_done

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
    call clear_all_sprites

    ld hl, (gameflow_submenu_data_ptr)
    inc hl                        ; +1 cursor_sprite_idx
    ld a, (hl)
    cp #FF
    jr z, .sps_done               ; no sprite cursor configured

    ; Resolve pattern pointer from sprite asset index
    call submenu_get_cursor_pattern_ptr
    jr c, .sps_done               ; invalid index -> fallback to char marker
    push hl                       ; save pattern ptr

    ; Read and clamp layer count (+2)
    ld hl, (gameflow_submenu_data_ptr)
    ld bc, 2
    add hl, bc
    ld a, (hl)
    or a
    jr z, .sps_restore_no_cursor
    cp 5
    jr c, .sps_layer_ok
    ld a, 4
.sps_layer_ok:
    ld (gameflow_submenu_cursor_layer_count), a

    ; Copy selected source layers to reserved cursor slots.
    ; Header offsets +3..+6 are kept for format compatibility, but sprite
    ; export is compact (layer0..layerN-1), so we upload a contiguous block:
    ; bytes = layer_count * 32.
    ; In ZX0-compressed exports, server-side preprocessing rewrites this
    ; FAST_LDIRVM call to COPY_SPRITE_SRC_TO_VRAM.
    pop hl                        ; HL = source pattern base
    ld a, (gameflow_submenu_cursor_layer_count)
    add a, a                      ; *2
    add a, a                      ; *4
    add a, a                      ; *8
    add a, a                      ; *16
    add a, a                      ; *32
    ld c, a
    ld b, 0
    ld de, SPRPAT + (SUBMENU_CURSOR_BASE_SPRITE * 32)
    call FAST_LDIRVM

.sps_enable_cursor:

    ld a, 1
    ld (gameflow_submenu_cursor_enabled), a
    jr .sps_done

.sps_restore_no_cursor:
    pop hl

.sps_done:
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
    jr z, .sus_hide

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
    jr z, .sus_hide

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
    call show_sprite              ; A=index, B=X, C=Y, D=pattern, E=color
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
    call hide_sprite
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
    call update_sprites_to_vram

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
    call hide_sprite
    inc d
    djnz .shc_loop
    call update_sprites_to_vram

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

SUBMENU_CURSOR_BASE_SPRITE EQU 28
SUBMENU_CURSOR_MAX_LAYERS  EQU 4
SUBMENU_CURSOR_PATTERN_COUNT EQU ${submenuCursorPatternCount}

submenu_cursor_sprite_pattern_table:
${submenuCursorPatternTable}

`;
                    break;
                }
            case 'Text':
                code += `gameflow_handle_text:
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
    call set_screen_colors
    pop af
    call init_char0_color

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
    call init_font_system

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
; Wait for fire button press and release
; ------------------------------------------------------------------
wait_for_fire:
    push bc

    ; Wait for fire button press
.wait_press:
    halt
${frameAudioTickAsm}
    ld a, 0                       ; Trigger 0 = space bar
    call GTTRIG
    or a
    jr z, .wait_press

    ; Wait for fire button release
.wait_release:
    halt
${frameAudioTickAsm}
    ld a, 0
    call GTTRIG
    or a
    jr nz, .wait_release

    ; Small delay after release
    ld b, 5
.delay_loop:
    halt
    push bc
${frameAudioTickAsm}    pop bc
    djnz .delay_loop

    pop bc
    ret

`;
                break;
            case 'IfThenElse':
                code += `gameflow_handle_ifthenelse:
    ; IfThenElse node - conditional branching
    ; DE = condition data pointer (variable address, compare value, operator)
    ; BC = connection table
    
    push bc         ; Save connection table
    
    ; Read condition data
    ex de, hl
    ld e, (hl)
    inc hl
    ld d, (hl)      ; DE = variable address
    inc hl
    ld a, (hl)      ; A = compare value
    inc hl
    ld c, (hl)      ; C = operator
    
    ; Load variable value
    ex de, hl
    ld b, (hl)      ; B = current value
    
    ; Compare based on operator
    ; For now, only == (operator 0)
    cp b
    jr z, .then_branch
    
.else_branch:
    pop bc
    ld a, CONNECTION_ELSE
    call gameflow_get_connection_by_type
    ld a, h
    or l
    ret z
    jp gameflow_execute_node
    
.then_branch:
    pop bc
    ld a, CONNECTION_THEN
    call gameflow_get_connection_by_type
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

`;
                break;
            case 'Globals':
                code += `gameflow_handle_globals:
    ; Globals node - set global variables
    ; DE = globals data pointer (list of variable assignments)
    ; BC = connection table
    
    push bc
    
    ; Execute global variable assignments
    ; Data format: count, [var_addr, value]*count
    ex de, hl
    ld b, (hl)      ; B = count
    inc hl
    
.assign_loop:
    ld a, b
    or a
    jr z, .done
    
    ; Read var address
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    
    ; Read value
    ld a, (hl)
    inc hl
    
    ; Assign
    ex de, hl
    ld (hl), a
    ex de, hl
    
    djnz .assign_loop
    
.done:
    pop bc
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

`;
                break;
            case 'Waypoint':
                code += `gameflow_handle_waypoint:
    ; Waypoint node - passthrough routing node
    ; Simply follow default connection
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

`;
                break;
            case 'Transition':
                code += `gameflow_handle_transition:
    ; Transition node - visual screen wipe/fade effect
    ; DE = transition data pointer (db effect_id)
    ; BC = connection table
    push bc
    call execute_transition_effect
    ; Restore VRAM after transition:
    ; 1. Tile colors (chars 128+) — corrupted by color-table effects (#11 = black)
    call load_colors_to_vram
    ; 2. Font patterns + colors (chars 0-127) — also zeroed by color-table effects.
    ;    init_font_system reloads both pattern bytes and color attributes for all
    ;    font characters.  If no font is used in the project this is a no-op (ret).
    call init_font_system
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
${frameAudioTickAsm}    pop bc
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

`;
                break;
            case 'Group':
                code += `gameflow_handle_group:
    ; Group node - nested GameFlow execution
    ; DE = group data pointer (nested GameFlow entry point)
    ; BC = connection table

    push bc                       ; Save parent connection table

    ; Get nested GameFlow entry point
    ex de, hl
    ld e, (hl)
    inc hl
    ld d, (hl)                    ; DE = nested GameFlow entry node pointer

    ; Save current GameFlow state (stack-based)
    ; In a full implementation, we'd push current node pointer
    ; For now, we'll just execute the nested flow

    ; Execute nested GameFlow
    ex de, hl                     ; HL = nested entry node
    push hl
    call gameflow_execute_node    ; Execute nested flow
    pop hl

    ; Nested flow complete, return to parent
    pop bc                        ; Restore parent connection table

    ; Follow default connection to continue parent flow
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

`;
                break;
            case 'Music':
                code += `gameflow_handle_music:
    ; Music node - play/stop music
    ; DE = music data (command, track index, loop flag)
    ; BC = connection table
    
    push bc
    call music_execute_command
    pop bc
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node
`;
                break;
            default:
                code += `gameflow_handle_${nodeType.toLowerCase()}:
    ; ${nodeType} node - not yet implemented
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

`;
                break;
        }
    });
    const needsPrintStringVram = nodeTypes.includes('Text') || nodeTypes.includes('SubMenu');
    const hasEndNode = nodeTypes.includes('End');
    if (needsPrintStringVram && !hasEndNode) {
        code += `; ------------------------------------------------------------------
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

`;
    }
    return code;
}
/**
 * Generate node structure and connection table for a specific node
 */
function generateNodeStructure(node, gameFlow, analysis) {
    const nodeLabel = `gameflow_node_${sanitizeId(node.id)}`;
    const connLabel = `${nodeLabel}_conn`;
    // Check if node has data
    const hasData = ['Start', 'WorldLink', 'SubMenu', 'Text', 'IfThenElse', 'Globals', 'Transition', 'Music'].includes(node.type) ||
        (node.type === 'Globals' && node.variables && node.variables.length > 0);
    const dataLabel = hasData ? `${nodeLabel}_data` : 'gameflow_no_data';
    let code = `; Node: ${node.type} - "${node.title || node.name || node.id}"
${nodeLabel}:
    db ${getNodeTypeConstant(node.type)}
    dw ${dataLabel}
    dw ${connLabel}

`;
    // Generate node-specific data only if needed
    if (hasData) {
        code += `${nodeLabel}_data:
`;
        switch (node.type) {
            case 'Start':
                // Generate Start node initialization data
                code += `    dw ${nodeLabel}_init    ; Initialization routine address\n`;
                code += `    db ((${nodeLabel}_init - #4000) / #2000)    ; Initialization routine bank\n`;
                // Generate initialization routine after the data structure
                // This will be appended after the switch
                break;
            case 'WorldLink':
                const worldAssetId = node.worldAssetId || 'default';
                code += `    dw load_world_${sanitizeId(worldAssetId)}\n`;
                code += `    db ((load_world_${sanitizeId(worldAssetId)} - #4000) / #2000)\n`;
                break;
            case 'SubMenu':
                {
                    const nodeId = sanitizeId(node.id);
                    const options = (Array.isArray(node.options) ? node.options : []).slice(0, 6);
                    const optionCount = options.length;
                    const fallbackRaw = getSubMenuInitialOptionIndex(node);
                    const fallbackIndex = optionCount > 0 ? Math.min(fallbackRaw, optionCount - 1) : 0;
                    const titleText = sanitizeAsmText(node.title || node.name || 'MENU').toUpperCase();
                    const submenuBgHex = node?.appearance?.colors?.background || '#000000';
                    const submenuBgColor = hexToMSXColor(submenuBgHex);
                    const selectorMode = getSubMenuSelectorMode(node);
                    const cursorSpriteAssetId = node?.appearance?.cursorSpriteAssetId;
                    const cursorSpriteIndexRaw = findSpriteAssetIndex(analysis, cursorSpriteAssetId);
                    const cursorSprite = cursorSpriteIndexRaw >= 0 ? analysis.sprites?.[cursorSpriteIndexRaw] : null;
                    const useSpriteCursor = selectorMode === 'char'
                        ? false
                        : selectorMode === 'sprite'
                            ? cursorSpriteIndexRaw >= 0
                            : cursorSpriteIndexRaw >= 0;
                    const cursorSpriteIndex = useSpriteCursor ? cursorSpriteIndexRaw : 0xFF;
                    const layerConfig = useSpriteCursor && cursorSprite
                        ? getSpriteLayerConfigForSubmenuCursor(cursorSprite)
                        : { layerOffsets: [], layerColors: [] };
                    const cursorLayerOffsets = layerConfig.layerOffsets.slice(0, 4);
                    const cursorLayerColors = layerConfig.layerColors.slice(0, 4);
                    const cursorLayerCount = Math.min(cursorLayerColors.length, 4);
                    while (cursorLayerOffsets.length < 4) {
                        cursorLayerOffsets.push(0);
                    }
                    while (cursorLayerColors.length < 4) {
                        cursorLayerColors.push(0);
                    }
                    // Resolve background screen load function pointer (0 = none)
                    const submenuBgScreenId = node?.appearance?.backgroundScreenAssetId;
                    let submenuBgScreenLabel = '0';
                    if (submenuBgScreenId && analysis.screenMaps) {
                        const bgScreen = analysis.screenMaps.find((s) => s.id === submenuBgScreenId);
                        if (bgScreen) {
                            const sName = bgScreen.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
                            const sIdSuffix = bgScreen.id ? `_${bgScreen.id.replace(/[^a-zA-Z0-9]/g, '_').slice(-12)}` : '';
                            submenuBgScreenLabel = `load_screen_${sName.toLowerCase()}${sIdSuffix.toLowerCase()}`;
                        }
                    }
                    const submenuBgScreenBankExpr = submenuBgScreenLabel === '0'
                        ? '0'
                        : `((${submenuBgScreenLabel} - #4000) / #2000)`;
                    code += `    db ${submenuBgColor}    ; Background color (MSX index)\n`;
                    code += `    db ${cursorSpriteIndex}    ; Cursor sprite asset index (#FF = use text marker)\n`;
                    code += `    db ${cursorLayerCount}    ; Cursor sprite layer count (max 4)\n`;
                    code += `    db ${cursorLayerOffsets[0]}, ${cursorLayerOffsets[1]}, ${cursorLayerOffsets[2]}, ${cursorLayerOffsets[3]}    ; Cursor source layer offsets\n`;
                    code += `    db ${cursorLayerColors[0]}, ${cursorLayerColors[1]}, ${cursorLayerColors[2]}, ${cursorLayerColors[3]}    ; Cursor layer colors\n`;
                    code += `    dw ${submenuBgScreenLabel}    ; Background screen load function (0=none)\n`;
                    code += `    db ${submenuBgScreenBankExpr}    ; Background screen load bank\n`;
                    code += `    db ${optionCount}    ; Number of options (max 6)\n`;
                    code += `    db ${fallbackIndex}    ; Initial selected option\n`;
                    code += `    dw submenu_${nodeId}_title\n`;
                    options.forEach((_, idx) => {
                        code += `    dw submenu_${nodeId}_opt${idx}\n`;
                    });
                    code += `\nsubmenu_${nodeId}_title:\n`;
                    code += `    db "${titleText}", 0\n`;
                    options.forEach((option, idx) => {
                        const optionText = sanitizeAsmText(option?.text || option?.label || option?.name || option?.id || `OPTION ${idx + 1}`).toUpperCase();
                        code += `submenu_${nodeId}_opt${idx}:\n`;
                        code += `    db "${optionText}", 0\n`;
                    });
                }
                break;
            case 'Text': {
                const nodeId = sanitizeId(node.id);
                const title = (node.title || node.name || '').replace(/"/g, '').replace(/\r?\n/g, ' ').trim().toUpperCase() || 'TEXT';
                const message = (node.message || '').replace(/"/g, '').replace(/\r?\n/g, ' ');
                const bgHex = node.appearance?.colors?.background || '#000000';
                const bgColor = hexToMSXColor(bgHex);
                // Word-wrap message to 28 chars per line (leaving 2-char margin each side)
                const maxLineWidth = 28;
                const words = message.split(' ');
                const messageLines = [];
                let currentLine = '';
                for (const word of words) {
                    const upperWord = word.toUpperCase();
                    const testLine = currentLine ? currentLine + ' ' + upperWord : upperWord;
                    if (testLine.length > maxLineWidth && currentLine) {
                        messageLines.push(currentLine);
                        currentLine = upperWord;
                    }
                    else {
                        currentLine = testLine;
                    }
                }
                if (currentLine.trim())
                    messageLines.push(currentLine);
                const promptText = 'PRESS FIRE TO CONTINUE';
                // Build lines array: title + message lines + prompt
                const allLines = [];
                // Title at row 3
                allLines.push({ row: 3, text: title, label: `text_${nodeId}_title` });
                // Message lines starting at row 7
                messageLines.forEach((line, i) => {
                    allLines.push({ row: 7 + i, text: line, label: `text_${nodeId}_msg${i}` });
                });
                // Prompt at row 20
                allLines.push({ row: 20, text: promptText, label: `text_${nodeId}_prompt` });
                // Resolve background screen load function pointer
                const bgScreenId = node.appearance?.backgroundScreenAssetId;
                let bgScreenLabel = '0';
                if (bgScreenId && analysis.screenMaps) {
                    const bgScreen = analysis.screenMaps.find((s) => s.id === bgScreenId);
                    if (bgScreen) {
                        const sName = bgScreen.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
                        const sIdSuffix = bgScreen.id ? `_${bgScreen.id.replace(/[^a-zA-Z0-9]/g, '_').slice(-12)}` : '';
                        bgScreenLabel = `load_screen_${sName.toLowerCase()}${sIdSuffix.toLowerCase()}`;
                    }
                }
                const bgScreenBankExpr = bgScreenLabel === '0'
                    ? '0'
                    : `((${bgScreenLabel} - #4000) / #2000)`;
                // Generate data table: bgColor, DW screen_load_ptr, DB screen_load_bank, numLines...
                code += `    DB ${bgColor}                  ; Background color (MSX index from ${bgHex})\n`;
                code += `    DW ${bgScreenLabel}            ; Background screen load function (0=none)\n`;
                code += `    DB ${bgScreenBankExpr}         ; Background screen load bank\n`;
                code += `    DB ${allLines.length}                  ; Number of lines\n`;
                for (const line of allLines) {
                    const col = Math.max(0, Math.floor((32 - line.text.length) / 2));
                    code += `    DB ${line.row}, ${col}              ; Row ${line.row}, Col ${col}\n`;
                    code += `    DW ${line.label}          ; -> "${line.text}"\n`;
                }
                // Generate string data labels
                code += `\n`;
                for (const line of allLines) {
                    code += `${line.label}:\n`;
                    code += `    DB "${line.text}", 0\n`;
                }
                break;
            }
            case 'Music': {
                const trackAssetId = typeof node.trackAssetId === 'string' ? node.trackAssetId : '';
                const trackIndexMap = (analysis.trackIndexByAssetId || {});
                const trackAssets = (analysis.tracks || []);
                let command = 0xFF;
                let trackIndex = 0xFF;
                let loopFlag = node.loop === false ? 0 : 1;
                let warning = '';
                if (node.stop === true) {
                    command = 0;
                    loopFlag = 0;
                }
                else if (node.autoPlay === false) {
                    warning = '; WARNING: Music node autoPlay=false -> no-op in ROM';
                }
                else if (trackAssetId && trackIndexMap[trackAssetId] !== undefined) {
                    command = 1;
                    trackIndex = trackIndexMap[trackAssetId];
                }
                else if (trackAssetId) {
                    const sameIdTrack = trackAssets.find((track) => track?.id === trackAssetId);
                    if (sameIdTrack?.soundChip === 'SCC') {
                        warning = `; WARNING: Track "${trackAssetId}" uses SCC and is ignored in ROM export`;
                    }
                    else {
                        warning = `; WARNING: Track "${trackAssetId}" not found / not exportable as PSG`;
                    }
                }
                else {
                    warning = '; WARNING: Music node has no trackAssetId -> no-op';
                }
                code += `    db ${command}, ${trackIndex}, ${loopFlag}    ; command, track index, loop flag\n`;
                if (warning) {
                    code += `    ${warning}\n`;
                }
                break;
            }
            case 'IfThenElse':
                const varName = node.variableName || 'unknown';
                const asmVarName = resolveGlobalVariableAsmName(varName, analysis);
                const compareValue = node.compareValue || 0;
                if (asmVarName) {
                    code += `    dw ${asmVarName}    ; Variable to check\n`;
                }
                else {
                    code += `    dw 0                 ; WARNING: Missing global variable "${varName}"\n`;
                }
                code += `    db ${compareValue}   ; Compare value\n`;
                code += `    db 0                 ; Operator (0=equals)\n`;
                break;
            case 'Globals':
                if (node.variables && node.variables.length > 0) {
                    const resolvedAssignments = node.variables
                        .map((v) => {
                        const vName = v.variableName || v.name || 'unknown';
                        const vAsmName = resolveGlobalVariableAsmName(vName, analysis);
                        const vValue = v.value || 0;
                        return { vName, vAsmName, vValue };
                    })
                        .filter((entry) => !!entry.vAsmName);
                    code += `    db ${resolvedAssignments.length}    ; Number of assignments\n`;
                    resolvedAssignments.forEach((entry) => {
                        code += `    dw ${entry.vAsmName}\n`;
                        code += `    db ${entry.vValue}\n`;
                    });
                    const missingAssignments = node.variables.length - resolvedAssignments.length;
                    if (missingAssignments > 0) {
                        code += `    ; WARNING: ${missingAssignments} Globals assignment(s) skipped (undefined global variable)\n`;
                    }
                    if (resolvedAssignments.length === 0) {
                        code += `    ; No valid global assignments found\n`;
                    }
                }
                else {
                    code += `    db 0    ; No assignments\n`;
                }
                break;
            case 'Transition': {
                // Effect IDs match execute_transition_effect dispatch (0-6)
                const transEffectMap = {
                    'cls': 0,
                    'dissolve_pixels': 1,
                    'dissolve_chars': 2,
                    'vertical_lines': 3,
                    'horizontal_lines': 4,
                    'spiral': 5,
                    'fill_white_squares': 6,
                };
                // Steps per effect = number of animation stages (each stage = N frames)
                const transStepsMap = {
                    'cls': 1,
                    'dissolve_pixels': 8,
                    'dissolve_chars': 8,
                    'vertical_lines': 16,
                    'horizontal_lines': 24,
                    'spiral': 96, // 96 pixel-row rings (top+bottom closing in, 192px/2)
                    'fill_white_squares': 4,
                };
                const transEffectId = transEffectMap[node.effect] ?? 0;
                const transSteps = transStepsMap[node.effect] ?? 8;
                const transDurationMs = node.duration ?? 1000;
                // Convert ms → frames per step (50Hz MSX = 20ms/frame). Clamp to 1-255.
                const transFramesPerStep = Math.max(1, Math.min(255, Math.round(transDurationMs / transSteps / 20)));
                code += `    db ${transEffectId}              ; Effect: ${node.effect || 'cls'}\n`;
                code += `    db ${transFramesPerStep}              ; Frames per step (duration ${transDurationMs}ms / ${transSteps} steps / 20ms)\n`;
                break;
            }
        }
        code += `\n`;
    }
    // Generate connection table
    code += `${connLabel}:
`;
    const connections = gameFlow.connections?.filter((c) => (c.from?.nodeId || c.from) === node.id) || [];
    if (node.type === 'IfThenElse') {
        // THEN/ELSE connections
        const thenConn = connections.find((c) => c.from?.sourceId === 'then' || !c.from?.sourceId);
        const elseConn = connections.find((c) => c.from?.sourceId === 'else');
        code += `    db CONNECTION_THEN\n`;
        code += `    dw ${thenConn ? `gameflow_node_${sanitizeId(thenConn.to?.nodeId || thenConn.to)}` : '0'}\n`;
        code += `    db CONNECTION_ELSE\n`;
        code += `    dw ${elseConn ? `gameflow_node_${sanitizeId(elseConn.to?.nodeId || elseConn.to)}` : '0'}\n`;
    }
    else if (node.type === 'SubMenu') {
        // Option connections
        const options = (Array.isArray(node.options) ? node.options : []).slice(0, 6);
        options.forEach((option, idx) => {
            const optConn = connections.find((c) => c.from?.sourceId === option.id);
            code += `    db CONNECTION_OPTION_${idx}\n`;
            code += `    dw ${optConn ? `gameflow_node_${sanitizeId(optConn.to?.nodeId || optConn.to)}` : '0'}\n`;
        });
    }
    else {
        // Single default connection
        const defaultConn = connections[0];
        code += `    db CONNECTION_DEFAULT\n`;
        code += `    dw ${defaultConn ? `gameflow_node_${sanitizeId(defaultConn.to?.nodeId || defaultConn.to)}` : '0'}\n`;
    }
    code += `    db CONNECTION_END\n\n`;
    // Generate initialization routine for Start nodes
    if (node.type === 'Start') {
        code += generateStartNodeInitRoutine(node, nodeLabel, analysis);
    }
    return code;
}
/**
 * Generate initialization routine for Start node
 */
function generateStartNodeInitRoutine(node, nodeLabel, analysis) {
    let code = `; ------------------------------------------------------------------
; ${nodeLabel}_init
; Initialization routine for Start node
; Initializes global variables and MSX systems
; ------------------------------------------------------------------
${nodeLabel}_init:
`;
    const initGlobals = node.initializeGlobals;
    const systemConfig = node.systemConfig;
    // CRITICAL: Always call init_game_systems to initialize ECS components,
    // entities, and load game assets. Without this, the screen stays black
    // because no patterns, sprites, or entities are set up.
    code += `    ; === Core Game Systems Initialization (ALWAYS required) ===\n`;
    code += `    call init_game_systems\n\n`;
    // 1. Initialize MSX Systems (if configured)
    if (systemConfig) {
        code += `    ; === MSX System Initialization ===\n`;
        if (systemConfig.initPSG) {
            code += `    ; Initialize PSG (silence all channels)\n`;
            code += `    call init_psg_silence\n\n`;
        }
        if (systemConfig.clearSprites) {
            code += `    ; Clear sprite attribute table\n`;
            code += `    call clear_sprite_table\n\n`;
        }
        if (systemConfig.clearVRAM) {
            code += `    ; Clear VRAM areas\n`;
            code += `    call clear_vram_areas\n\n`;
        }
        if (systemConfig.resetVDP) {
            code += `    ; Reset VDP registers to default\n`;
            code += `    call reset_vdp_registers\n\n`;
        }
    }
    // 2. Initialize Global Variables (if configured)
    if (initGlobals && initGlobals.enabled) {
        code += `    ; === Global Variables Initialization ===\n`;
        if (initGlobals.variables && initGlobals.variables.length > 0) {
            // Use specified variables
            initGlobals.variables.forEach((v) => {
                const rawVarName = String(v?.variableName || '').trim();
                if (!rawVarName)
                    return;
                const globals = Array.isArray(analysis.globalVariables) ? analysis.globalVariables : [];
                const normalizedVarName = rawVarName.toLowerCase();
                const resolvedVar = globals.find((candidate) => {
                    const candidateName = String(candidate?.name || '').trim().toLowerCase();
                    const candidateAsmName = String(candidate?.asmName || '').trim().toLowerCase();
                    return candidateName === normalizedVarName || candidateAsmName === normalizedVarName;
                });
                const varName = String(resolvedVar?.name || rawVarName);
                const asmVarName = String(resolvedVar?.asmName ||
                    `global_var_${varName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')}`);
                const type = String(resolvedVar?.type || '').toLowerCase();
                let numericValue = 0;
                if (typeof v.value === 'boolean') {
                    numericValue = v.value ? 1 : 0;
                }
                else {
                    const parsedValue = Number(v.value);
                    numericValue = Number.isFinite(parsedValue) ? Math.trunc(parsedValue) : 0;
                }
                if (type === 'word' || type === '16bit') {
                    const wordValue = Math.max(0, Math.min(65535, numericValue));
                    code += `    ld a, ${wordValue & 0xFF}\n`;
                    code += `    ld (${asmVarName}), a    ; ${varName} low byte = ${wordValue}\n`;
                    code += `    ld a, ${(wordValue >> 8) & 0xFF}\n`;
                    code += `    ld (${asmVarName}+1), a    ; ${varName} high byte = ${wordValue}\n`;
                }
                else {
                    const byteValue = Math.max(0, Math.min(255, numericValue));
                    code += `    ld a, ${byteValue}\n`;
                    code += `    ld (${asmVarName}), a    ; ${varName} = ${byteValue}\n`;
                }
            });
        }
        else {
            // Initialize all global variables to their default values
            code += `    ; Initialize all global variables to default values\n`;
            code += `    call init_all_global_variables\n`;
        }
        code += `\n`;
    }
    // 3. Initial delay (if configured)
    if (systemConfig && systemConfig.initialDelayFrames && systemConfig.initialDelayFrames > 0) {
        code += `    ; Initial delay\n`;
        code += `    ld b, ${systemConfig.initialDelayFrames}\n`;
        code += `.delay_loop:\n`;
        code += `    halt    ; Wait for V-blank\n`;
        code += `    djnz .delay_loop\n\n`;
    }
    code += `    ret\n\n`;
    return code;
}
/**
 * Generate default GameFlow when none exists
 */
function generateDefaultGameFlow(analysis, executionPlan) {
    const defaultHudRuntimeScreenIndexes = getHudRuntimeScreenIndexes(analysis);
    const defaultHasHud = defaultHudRuntimeScreenIndexes.length > 0;
    const defaultStartHudAsm = generateConditionalRenderHudAsm(defaultHudRuntimeScreenIndexes, 'gf_default_start_hud', true);
    const defaultLoopHudAsm = generateConditionalRenderHudAsm(defaultHudRuntimeScreenIndexes, 'gf_default_loop_hud');
    const frameAudioTickAsm = buildGameFlowAudioTickAsm(analysis, executionPlan);
    const firstScreen = analysis.screenMaps && analysis.screenMaps.length > 0 ? analysis.screenMaps[0] : null;
    const firstImportedHudFrameDrawRoutine = firstScreen ? getImportedHudFrameDrawRoutineName(firstScreen) : null;
    const firstScreenLoadCode = firstScreen
        ? `    call ${getScreenLoadRoutineName(firstScreen)}\n`
        : `    ; No screens available\n`;
    return `; ==================================================================
; DEFAULT GAMEFLOW (No GameFlow defined in project)
; ==================================================================

gameflow_init:
    ret

gameflow_start:
    ; Load first available screen/world
${firstScreenLoadCode}${firstImportedHudFrameDrawRoutine ? `    ; Draw imported HUD frame once at game start
    call ${firstImportedHudFrameDrawRoutine}
` : ``}
${defaultHasHud ? `    ; Bootstrap HUD only on screens that define HUD elements
${defaultStartHudAsm}` : ``}    ret

gameflow_world_game_loop:
    halt                            ; Frame sync at loop start (V-Blank edge)
${frameAudioTickAsm}    call update_sprites_to_vram     ; Frame-paced SAT upload (outside ISR)
    ; Animated transform tiles do VRAM read-modify-write, so update them
    ; near the V-Blank edge before the expensive gameplay work.
    call update_animated_tiles
    ; Poll input in main loop (avoids BIOS-in-ISR compatibility issues)
    call task_update_input
    call check_world_screen_transition
    call update_all_entities
    call execute_all_state_machines
${defaultHasHud ? `    ; Render HUD only on screens that define HUD elements
${defaultLoopHudAsm}
` : ``}
    jp gameflow_world_game_loop

; gameflow_exit_requested is allocated in variables.asm (RAM EQU)

; ==================================================================
; END OF DEFAULT GAMEFLOW
; ==================================================================
`;
}
