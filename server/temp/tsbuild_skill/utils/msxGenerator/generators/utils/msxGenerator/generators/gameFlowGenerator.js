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
 * Analyze first..last drawable layer range in a sprite.
 */
function analyzeDrawableLayerRange(sprite) {
    const palette = sprite?.spritePalette || [];
    const bg = sprite?.backgroundColor;
    const frames = sprite?.frames || [];
    if (!palette.length || !frames.length)
        return null;
    let first = -1;
    let last = -1;
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
        if (!hasPixels)
            continue;
        if (first === -1)
            first = layerIdx;
        last = layerIdx;
    }
    if (first === -1 || last === -1)
        return null;
    return { first, last };
}
/**
 * Build submenu cursor layer config (source pattern offsets + colors).
 * Keeps only drawable colors and clamps to 4 hardware sprite layers.
 */
function getSpriteLayerConfigForSubmenuCursor(sprite) {
    const palette = sprite?.spritePalette || [];
    const bg = sprite?.backgroundColor;
    const frames = sprite?.frames || [];
    const range = analyzeDrawableLayerRange(sprite);
    if (!range) {
        return { layerOffsets: [0], layerColors: [15] };
    }
    const usedLayerIndexes = [];
    for (let i = range.first; i <= range.last; i++) {
        const layerColor = palette[i];
        if (!layerColor || (bg && layerColor === bg))
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
            usedLayerIndexes.push(i);
        }
    }
    const selectedLayers = usedLayerIndexes.slice(0, 4);
    if (selectedLayers.length === 0) {
        return { layerOffsets: [0], layerColors: [15] };
    }
    const layerOffsets = selectedLayers.map((idx) => Math.max(0, idx - range.first));
    const layerColors = selectedLayers.map((idx) => {
        const hex = palette[idx];
        return hex ? hexToMSX1Index(hex, true) : 15;
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
function generateGameFlowFile(analysis) {
    // If no GameFlow exists, generate a minimal default one
    if (!analysis.gameFlow) {
        return generateDefaultGameFlow(analysis);
    }
    const gameFlow = analysis.gameFlow;
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
    code += generateNodeHandlers(nodeTypes, analysis);
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
    // Check if project has HUD elements
    const hasHud = analysis.screenMaps?.some(screen => screen.hudConfiguration?.elements && screen.hudConfiguration.elements.length > 0);
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

    ; Handle world screen edge transitions (Preview parity)
    call check_world_screen_transition

    ; Update all entities
    call update_all_entities

    ; Execute all state machines
    call execute_all_state_machines

    ; Update sprites to VRAM
    call update_sprites_to_vram
${hasHud ? `
    ; Render HUD elements
    call render_hud
` : ``}
    ; Wait for V-Blank
    halt

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
    push hl
    ld c, a
    call WRTVRM          ; Write to VRAM
    pop hl
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
    push hl
    ld c, a
    call WRTVRM
    pop hl
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
    push hl
    ld c, a
    call WRTVRM
    pop hl
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
            // Use first value from values array as initial value (or 0 if no values)
            const initialValue = v.values && v.values.length > 0 ? v.values[0].value : 0;
            const value = typeof initialValue === 'boolean' ? (initialValue ? 1 : 0) : initialValue;
            code += `    ld a, ${value}\n`;
            code += `    ld (${asmVarName}), a    ; ${varName} = ${initialValue}\n`;
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
function generateNodeHandlers(nodeTypes, analysis) {
    let code = '';
    const hasHud = analysis.screenMaps?.some(screen => screen.hudConfiguration?.elements && screen.hudConfiguration.elements.length > 0);
    nodeTypes.forEach((nodeType) => {
        switch (nodeType) {
            case 'Start':
                code += `gameflow_handle_start:
    ; Start node - Initialize game state and systems
    ; DE = node data pointer (initialization config)
    ; BC = connection table

    push bc         ; Save connection table

    ; Execute initialization routine
    ; DE points to start_init_data structure
    ex de, hl
    ld e, (hl)
    inc hl
    ld d, (hl)      ; DE = initialization routine address

    ; Call initialization routine (if not null)
    ld a, d
    or e
    jr z, .skip_init

    ; Call the initialization routine
    push de
    ex de, hl
    ld de, .after_init
    push de
    jp (hl)         ; Indirect call, returns to .after_init

.after_init:
    pop de

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
    ; DE = world data pointer (contains load_world_X routine address)
    ; BC = connection table (for exit)

    push bc         ; Save connection table

    ; Load the world
    ; DE points to: dw load_world_X
    ex de, hl
    ld a, (hl)
    inc hl
    ld h, (hl)
    ld l, a         ; HL = load_world_X address

    ; Call the load routine
    ld de, .after_load
    push de
    jp (hl)          ; Indirect call, returns to .after_load

.after_load:
    ; Set game state
    ld a, FLOW_STATE_GAME
    ld (current_flow_state), a

    ; Update sprites
    call update_sprites_to_vram
${hasHud ? `
    ; Set HUD dirty flag so it renders on first frame after screen load
    ld a, 1
    ld (hud_dirty_flag), a
    call render_hud
` : ``}
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

    ; Check for fire button to exit
    call GTTRIG
    or a
    jr nz, .end_screen_exit

    ; Check for ESC key to exit
    ld a, 7                       ; ESC key row
    call SNSMAT
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
    push af                       ; Save character
    ex de, hl                     ; HL = VRAM address (from DE)
    pop af                        ; Restore character to A
    call WRTVRM                   ; Write A to VRAM at HL
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
    ; Restart node - reset game
    jp init_rom

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
    ; option_count is at offset +11 in submenu header
    ld bc, 11
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
    ld a, 0
    call GTTRIG
    or a
    jr nz, .smp_wait_fire_release
    jr .smp_exit

.smp_wait_neutral:
.smp_wait_neutral_loop:
    halt
    ld a, 0
    call GTSTCK
    or a
    jr nz, .smp_wait_neutral_loop
    jr .smp_loop

.smp_exit:
    call submenu_hide_cursor_sprite
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

    ; Clear full visible screen (24 rows) before drawing menu.
    ; clear_screen_area only clears the center and leaves HUD/map artifacts.
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

    ld hl, (gameflow_submenu_data_ptr)
    ld bc, 11                     ; offset to option_count
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
    xor a
.ssl_loop:
    ld b, (hl)
    or b
    jr z, .ssl_done
    inc a
    inc hl
    jr .ssl_loop
.ssl_done:
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
    ; Header offsets:
    ;   +3..+6 = source layer offsets (from SPRITE_n_PATTERN base)
    ;   +7..+10 = layer colors
    pop de                        ; DE = source pattern base
    ld hl, (gameflow_submenu_data_ptr)
    ld bc, 3
    add hl, bc                    ; HL = first source layer offset
    ld a, (gameflow_submenu_cursor_layer_count)
    ld b, a                       ; B = remaining layers
    ld c, 0                       ; C = destination layer index
.sps_copy_layer_loop:
    ld a, b
    or a
    jr z, .sps_enable_cursor
    push bc
    push hl
    push de

    ld a, (hl)                    ; source offset from base pattern
    ld l, a
    ld h, 0
    add hl, hl                    ; *2
    add hl, hl                    ; *4
    add hl, hl                    ; *8
    add hl, hl                    ; *16
    add hl, hl                    ; *32
    pop de                        ; base source pointer
    add hl, de                    ; HL = source layer ptr
    push hl

    ld a, c
    add a, SUBMENU_CURSOR_BASE_SPRITE
    ld l, a
    ld h, 0
    add hl, hl                    ; *2
    add hl, hl                    ; *4
    add hl, hl                    ; *8
    add hl, hl                    ; *16
    add hl, hl                    ; *32
    ld de, SPRPAT
    add hl, de
    ex de, hl                     ; DE = destination VRAM
    pop hl                        ; HL = source layer ptr

    ld bc, 32
    call FAST_LDIRVM

    pop hl
    inc hl                        ; next source offset byte
    pop bc
    dec b
    inc c
    jr .sps_copy_layer_loop

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
    ; Header layout:
    ; +15 = first option DW pointer
    ld hl, (gameflow_submenu_data_ptr)
    ld de, 15
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
; Display full text screen: black bg, title, word-wrapped message, prompt
; Input: DE = text data pointer
;   Format: DB bgColor, DB numLines
;           Per line: DB row, DB col, DW string_ptr
; ------------------------------------------------------------------
show_text_screen:
    push bc
    push de
    push hl

    ; Save data pointer
    ex de, hl                     ; HL = data pointer

    ; Read background color
    ld a, (hl)                    ; A = bgColor (MSX color index)
    inc hl
    push hl                       ; Save pointer to numLines

    ; Disable screen to avoid flicker
    push af                       ; Save bgColor
    call DISSCR
    pop af                        ; A = bgColor

    ; Set background and border colors (A=bg, B=border)
    ld b, a                       ; B = border color (same as bg)
    push af                       ; Save bgColor again
    call set_screen_colors
    pop af                        ; A = bgColor

    ; Initialize char 0 color to background
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

    ; Now render each line
    pop hl                        ; HL = pointer to numLines
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
    ; Enable screen
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
    ld a, 0                       ; Trigger 0 = space bar
    call GTTRIG
    or a
    jr z, .wait_press

    ; Wait for fire button release
.wait_release:
    halt
    ld a, 0
    call GTTRIG
    or a
    jr nz, .wait_release

    ; Small delay after release
    ld b, 5
.delay_loop:
    halt
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
    ; Transition node - visual transition effect
    ; DE = transition data (effect type)
    ; BC = connection table
    
    push bc
    
    ; Execute transition effect (placeholder)
    call execute_transition_effect
    
    pop bc
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

; ------------------------------------------------------------------
; execute_transition_effect
; Execute visual transition effect
; Input:  DE = Transition data pointer (effect type + parameters)
; Destroys: AF, BC, DE, HL
; ------------------------------------------------------------------
execute_transition_effect:
    ; Get transition effect type from data
    ld a, (de)                    ; A = effect type
    inc de                        ; DE now points to parameters

    ; Dispatch to effect handler
    or a
    jr z, .trans_fade_out         ; 0 = Fade out
    dec a
    jr z, .trans_fade_in          ; 1 = Fade in
    dec a
    jr z, .trans_flash            ; 2 = Flash
    dec a
    jr z, .trans_wipe_down        ; 3 = Wipe down
    dec a
    jr z, .trans_wipe_up          ; 4 = Wipe up
    ret                           ; Unknown effect, do nothing

; ------------------------------------------------------------------
; Fade Out Effect (darken screen gradually)
; ------------------------------------------------------------------
.trans_fade_out:
    push de

    ; MSX Screen 2 fade: Modify color table to darken colors
    ; We'll do a simple version: set all colors to black in steps
    ld b, 4                       ; 4 fade steps

.fade_out_loop:
    push bc

    ; Darken one step (reduce brightness in color table)
    ; For simplicity, we'll just wait and then blank screen
    ld b, 20                      ; Wait frames
.fade_out_wait:
    halt                          ; Wait for V-blank
    djnz .fade_out_wait

    pop bc
    djnz .fade_out_loop

    ; Final step: blank screen
    call blank_screen

    pop de
    ret

; ------------------------------------------------------------------
; Fade In Effect (brighten screen gradually)
; ------------------------------------------------------------------
.trans_fade_in:
    push de

    ; Restore screen from black
    call restore_screen_colors

    ld b, 4                       ; 4 fade steps

.fade_in_loop:
    push bc

    ld b, 20                      ; Wait frames
.fade_in_wait:
    halt
    djnz .fade_in_wait

    pop bc
    djnz .fade_in_loop

    pop de
    ret

; ------------------------------------------------------------------
; Flash Effect (quick screen flash)
; ------------------------------------------------------------------
.trans_flash:
    push de

    ld b, 3                       ; Flash 3 times

.flash_loop:
    push bc

    ; Flash white
    ld a, 7                       ; VDP R#7 - Text color (affects border/backdrop)
    ld b, a
    ld c, #F0                     ; White on white
    call WRTVDP

    ld b, 5
.flash_white_wait:
    halt
    djnz .flash_white_wait

    ; Flash black
    ld a, 7
    ld b, a
    ld c, 0                       ; Black
    call WRTVDP

    ld b, 5
.flash_black_wait:
    halt
    djnz .flash_black_wait

    pop bc
    djnz .flash_loop

    ; Restore normal backdrop color
    ld a, 7
    ld b, a
    ld c, 0
    call WRTVDP

    pop de
    ret

; ------------------------------------------------------------------
; Wipe Down Effect (curtain wipe top to bottom)
; ------------------------------------------------------------------
.trans_wipe_down:
    push de

    ; Clear screen line by line from top to bottom
    ld b, 24                      ; 24 rows
    ld c, 0                       ; Start row

.wipe_down_loop:
    push bc

    ; Clear row C (fill with pattern 0)
    ld a, c
    call clear_screen_row

    ; Wait a bit
    ld b, 2
.wipe_down_wait:
    halt
    djnz .wipe_down_wait

    pop bc
    inc c                         ; Next row
    djnz .wipe_down_loop

    pop de
    ret

; ------------------------------------------------------------------
; Wipe Up Effect (curtain wipe bottom to top)
; ------------------------------------------------------------------
.trans_wipe_up:
    push de

    ; Clear screen line by line from bottom to top
    ld b, 24                      ; 24 rows
    ld c, 23                      ; Start row (bottom)

.wipe_up_loop:
    push bc

    ; Clear row C
    ld a, c
    call clear_screen_row

    ; Wait a bit
    ld b, 2
.wipe_up_wait:
    halt
    djnz .wipe_up_wait

    pop bc
    dec c                         ; Previous row
    djnz .wipe_up_loop

    pop de
    ret

; ------------------------------------------------------------------
; Helper: Blank entire screen (set all colors to black)
; ------------------------------------------------------------------
blank_screen:
    ; Set VDP backdrop color to black
    ld a, 7                       ; VDP R#7
    ld b, a
    ld c, 0                       ; Black backdrop
    call WRTVDP

    ; Optionally: Set all sprite colors to 0 (transparent)
    ; For now, just backdrop is enough
    ret

; ------------------------------------------------------------------
; Helper: Restore screen colors
; ------------------------------------------------------------------
restore_screen_colors:
    ; Restore normal backdrop color
    ld a, 7                       ; VDP R#7
    ld b, a
    ld c, #04                     ; Dark blue backdrop (MSX default)
    call WRTVDP
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
    ; DE = music data (track ID, flags)
    ; BC = connection table
    
    push bc
    
    ; Execute music command (placeholder)
    call execute_music_command
    
    pop bc
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

; ------------------------------------------------------------------
; execute_music_command
; Execute music playback command
; Input: DE = music data (command, track ID, loop flag)
; Commands: 0=stop, 1=play, 2=pause, 3=resume
; ------------------------------------------------------------------
execute_music_command:
    push af
    push bc
    push de
    push hl

    ; Get music command
    ld a, (de)
    inc de
    ld b, a                       ; B = command

    ; Get track ID
    ld a, (de)
    inc de
    ld c, a                       ; C = track ID

    ; Get loop flag
    ld a, (de)
    ld (music_loop_flag), a

    ; Dispatch based on command
    ld a, b
    or a
    jr z, .music_stop             ; 0 = Stop
    dec a
    jr z, .music_play             ; 1 = Play
    dec a
    jr z, .music_pause            ; 2 = Pause
    dec a
    jr z, .music_resume           ; 3 = Resume
    jr .music_done

.music_stop:
    ; Stop all music - silence PSG
    call psg_silence_all
    xor a
    ld (music_playing), a
    jr .music_done

.music_play:
    ; Play track C
    ld a, c
    ld (music_current_track), a
    call psg_init_track
    ld a, 1
    ld (music_playing), a
    jr .music_done

.music_pause:
    ; Pause current track
    call psg_silence_all
    xor a
    ld (music_playing), a
    jr .music_done

.music_resume:
    ; Resume current track
    ld a, (music_current_track)
    call psg_init_track
    ld a, 1
    ld (music_playing), a

.music_done:
    pop hl
    pop de
    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; PSG Helper Functions
; ------------------------------------------------------------------

; Silence all PSG channels
psg_silence_all:
    push af
    push bc

    ; Set volume to 0 for all 3 channels
    ld a, #88                     ; Channel A volume
    out (#A0), a
    ld a, 0
    out (#A1), a

    ld a, #89                     ; Channel B volume
    out (#A0), a
    ld a, 0
    out (#A1), a

    ld a, #8A                     ; Channel C volume
    out (#A0), a
    ld a, 0
    out (#A1), a

    pop bc
    pop af
    ret

; Initialize PSG track
psg_init_track:
    push af
    push bc
    push hl

    ; A = track ID
    ; For now, simple beep on channel A
    ; Full implementation would load track data from music table

    ; Set channel A frequency (440 Hz = A4 note)
    ld a, #00                     ; Fine tune register
    out (#A0), a
    ld a, #FE                     ; Frequency low byte
    out (#A1), a

    ld a, #01                     ; Coarse tune register
    out (#A0), a
    ld a, #01                     ; Frequency high byte
    out (#A1), a

    ; Set channel A volume
    ld a, #08                     ; Volume register
    out (#A0), a
    ld a, #0F                     ; Max volume
    out (#A1), a

    ; Enable tone on channel A
    ld a, #07                     ; Mixer register
    out (#A0), a
    ld a, #3E                     ; Enable tone A, disable noise
    out (#A1), a

    pop hl
    pop bc
    pop af
    ret

; ------------------------------------------------------------------
; Music system variables (should be in variables section)
; ------------------------------------------------------------------
music_playing:
    db 0                          ; 0=stopped, 1=playing

music_current_track:
    db 0                          ; Current track ID

music_loop_flag:
    db 0                          ; 0=no loop, 1=loop

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
    return code;
}
/**
 * Generate node structure and connection table for a specific node
 */
function generateNodeStructure(node, gameFlow, analysis) {
    const nodeLabel = `gameflow_node_${sanitizeId(node.id)}`;
    const connLabel = `${nodeLabel}_conn`;
    // Check if node has data
    const hasData = ['Start', 'WorldLink', 'SubMenu', 'Text', 'IfThenElse', 'Globals'].includes(node.type) ||
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
                // Generate initialization routine after the data structure
                // This will be appended after the switch
                break;
            case 'WorldLink':
                const worldAssetId = node.worldAssetId || 'default';
                code += `    dw load_world_${sanitizeId(worldAssetId)}\n`;
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
                    code += `    db ${submenuBgColor}    ; Background color (MSX index)\n`;
                    code += `    db ${cursorSpriteIndex}    ; Cursor sprite asset index (#FF = use text marker)\n`;
                    code += `    db ${cursorLayerCount}    ; Cursor sprite layer count (max 4)\n`;
                    code += `    db ${cursorLayerOffsets[0]}, ${cursorLayerOffsets[1]}, ${cursorLayerOffsets[2]}, ${cursorLayerOffsets[3]}    ; Cursor source layer offsets\n`;
                    code += `    db ${cursorLayerColors[0]}, ${cursorLayerColors[1]}, ${cursorLayerColors[2]}, ${cursorLayerColors[3]}    ; Cursor layer colors\n`;
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
                const title = (node.title || node.name || 'TEXT').replace(/"/g, '').toUpperCase();
                const message = (node.message || '').replace(/"/g, '');
                const bgColor = 1; // MSX color 1 = black (default for Text nodes)
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
                // Generate data table: bgColor, numLines, then per line: row, col, DW string_ptr
                code += `    DB ${bgColor}                  ; Background color (MSX: 1=black)\n`;
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
            case 'IfThenElse':
                const varName = node.variableName || 'unknown';
                const asmVarName = `global_var_${varName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')}`;
                const compareValue = node.compareValue || 0;
                code += `    dw ${asmVarName}    ; Variable to check\n`;
                code += `    db ${compareValue}   ; Compare value\n`;
                code += `    db 0                 ; Operator (0=equals)\n`;
                break;
            case 'Globals':
                if (node.variables && node.variables.length > 0) {
                    code += `    db ${node.variables.length}    ; Number of assignments\n`;
                    node.variables.forEach((v) => {
                        const vName = v.variableName || v.name || 'unknown';
                        const vAsmName = `global_var_${vName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')}`;
                        const vValue = v.value || 0;
                        code += `    dw ${vAsmName}\n`;
                        code += `    db ${vValue}\n`;
                    });
                }
                else {
                    code += `    db 0    ; No assignments\n`;
                }
                break;
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
                const varName = v.variableName;
                const asmVarName = `global_var_${varName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')}`;
                const value = typeof v.value === 'boolean' ? (v.value ? 1 : 0) : v.value;
                code += `    ld a, ${value}\n`;
                code += `    ld (${asmVarName}), a    ; ${varName} = ${v.value}\n`;
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
function generateDefaultGameFlow(analysis) {
    const defaultHasHud = analysis.screenMaps?.some(screen => screen.hudConfiguration?.elements && screen.hudConfiguration.elements.length > 0);
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
${defaultHasHud ? `    ; Set HUD dirty flag after screen load
    ld a, 1
    ld (hud_dirty_flag), a
    call render_hud
` : ``}    ret

gameflow_world_game_loop:
    call check_world_screen_transition
    call update_all_entities
    call execute_all_state_machines
    call update_sprites_to_vram
${defaultHasHud ? `    call render_hud
` : ``}    halt                            ; Wait for V-Blank
    jp gameflow_world_game_loop

; gameflow_exit_requested is allocated in variables.asm (RAM EQU)

; ==================================================================
; END OF DEFAULT GAMEFLOW
; ==================================================================
`;
}
