"use strict";
/**
 * @fileoverview World Generator - WorldMap structure and loading functions
 * Generates worlds.asm with world map data and screen loading functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWorldsFile = generateWorldsFile;
/**
 * Convert name to valid ASM label (lowercase)
 */
function toRoutineLabel(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '_');
}
/**
 * Convert name to valid ASM constant (uppercase)
 */
function toConstantName(name) {
    return name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
}
function hasGlobalVariableAsmName(analysis, asmName) {
    const globals = Array.isArray(analysis.globalVariables) ? analysis.globalVariables : [];
    return globals.some((variable) => String(variable?.asmName || '').trim().toLowerCase() === asmName.toLowerCase());
}
/**
 * Normalize world direction aliases to canonical values.
 */
function normalizeDirection(raw) {
    const value = String(raw ?? '').trim().toLowerCase();
    switch (value) {
        case 'north':
        case 'up':
            return 'north';
        case 'south':
        case 'down':
            return 'south';
        case 'east':
        case 'right':
            return 'east';
        case 'west':
        case 'left':
            return 'west';
        default:
            return null;
    }
}
/**
 * Extract node id from world connection endpoint.
 * Supports both modern and legacy forms:
 * - fromNodeId / toNodeId
 * - from: "nodeId"
 * - from: { nodeId: "..." }
 */
function extractConnectionNodeId(conn, side) {
    const directKey = side === 'from' ? 'fromNodeId' : 'toNodeId';
    const directValue = conn?.[directKey];
    if (typeof directValue === 'string' && directValue.length > 0)
        return directValue;
    const endpoint = conn?.[side];
    if (typeof endpoint === 'string' && endpoint.length > 0)
        return endpoint;
    if (endpoint && typeof endpoint.nodeId === 'string' && endpoint.nodeId.length > 0)
        return endpoint.nodeId;
    return null;
}
/**
 * Get canonical direction from connection side.
 */
function extractConnectionDirection(conn, side) {
    const directKey = side === 'from' ? 'fromDirection' : 'toDirection';
    const directValue = conn?.[directKey];
    const normalizedDirect = normalizeDirection(directValue);
    if (normalizedDirect)
        return normalizedDirect;
    const endpoint = conn?.[side];
    return normalizeDirection(endpoint?.direction);
}
/**
 * Get the generated load_screen routine name for a screen asset id.
 */
function getScreenLoadRoutineName(screenAssetId, analysis) {
    const screenAsset = analysis.screens?.find((s) => s.id === screenAssetId);
    const screenName = screenAsset?.name?.toUpperCase().replace(/[^A-Z0-9]/g, '_') || 'UNKNOWN';
    const screenIdSuffix = screenAssetId
        ? `_${screenAssetId.replace(/[^a-zA-Z0-9]/g, '_').slice(-12)}`
        : '';
    return `load_screen_${screenName.toLowerCase()}${screenIdSuffix.toLowerCase()}`;
}
function getScreenActiveAreaBounds(screenAssetId, analysis) {
    const screenAsset = analysis.screens?.find((s) => s.id === screenAssetId);
    const screenWidthTiles = Math.max(1, screenAsset?.width ?? 32);
    const screenHeightTiles = Math.max(1, screenAsset?.height ?? 24);
    const activeAreaX = Math.max(0, Math.min(screenWidthTiles - 1, screenAsset?.activeAreaX ?? 0));
    const activeAreaY = Math.max(0, Math.min(screenHeightTiles - 1, screenAsset?.activeAreaY ?? 0));
    const activeAreaWidth = Math.max(1, Math.min(screenWidthTiles - activeAreaX, screenAsset?.activeAreaWidth ?? screenWidthTiles));
    const activeAreaHeight = Math.max(1, Math.min(screenHeightTiles - activeAreaY, screenAsset?.activeAreaHeight ?? screenHeightTiles));
    const leftPx = activeAreaX * 8;
    const topPx = activeAreaY * 8;
    const rightPx = leftPx + (activeAreaWidth * 8);
    const bottomPx = topPx + (activeAreaHeight * 8);
    const entryMargin = 2;
    const spriteWidth = 16;
    const spriteHeight = 16;
    const enterWestX = leftPx + entryMargin;
    const enterEastX = Math.max(enterWestX, rightPx - spriteWidth - entryMargin);
    const enterNorthY = topPx + entryMargin;
    const enterSouthY = Math.max(enterNorthY, bottomPx - spriteHeight - entryMargin);
    return {
        leftPx,
        topPx,
        rightPx,
        bottomPx,
        westExitX: leftPx + entryMargin,
        eastExitX: Math.max(leftPx, rightPx - spriteWidth),
        northExitY: topPx + entryMargin,
        southExitY: Math.max(topPx, bottomPx - spriteHeight),
        enterWestX,
        enterEastX,
        enterNorthY,
        enterSouthY,
    };
}
/**
 * Get the generated imported HUD frame draw routine name for a screen asset id.
 * Returns null when screen has no imported HUD frame snapshot.
 */
function getImportedHudFrameDrawRoutineName(screenAssetId, analysis) {
    const screenAsset = analysis.screens?.find((s) => s.id === screenAssetId);
    const importedCells = screenAsset?.hudConfiguration?.importedFrame?.cells;
    if (!Array.isArray(importedCells) || importedCells.length === 0) {
        return null;
    }
    const screenName = screenAsset?.name?.toUpperCase().replace(/[^A-Z0-9]/g, '_') || 'UNKNOWN';
    const screenIdSuffix = screenAssetId
        ? `_${screenAssetId.replace(/[^a-zA-Z0-9]/g, '_').slice(-12)}`
        : '';
    return `hud_imported_frame_${screenName.toLowerCase()}${screenIdSuffix.toLowerCase()}_draw`;
}
/**
 * Resolve one imported HUD frame draw routine for the whole world.
 * Priority: start screen first, then remaining screens in world order.
 */
function getWorldImportedHudFrameDrawRoutineName(world, analysis) {
    const nodes = Array.isArray(world?.nodes) ? world.nodes : [];
    if (nodes.length === 0)
        return null;
    const orderedNodes = [];
    const startScreenNodeId = world?.startScreenNodeId;
    const startNode = nodes.find((n) => n?.id === startScreenNodeId);
    if (startNode)
        orderedNodes.push(startNode);
    nodes.forEach((n) => {
        if (!startNode || n?.id !== startNode.id)
            orderedNodes.push(n);
    });
    for (const node of orderedNodes) {
        const screenAssetId = node?.screenAssetId;
        if (!screenAssetId)
            continue;
        const routine = getImportedHudFrameDrawRoutineName(screenAssetId, analysis);
        if (routine)
            return routine;
    }
    return null;
}
/**
 * Emit transition runtime snippet for one exit direction.
 */
function emitDirectionalTransitionCode(worldLabel, screenIndex, direction, targetScreenIndex, targetLoadRoutine, currentBounds, targetBounds) {
    const skipLabel = `check_transition_${worldLabel}_s${screenIndex}_skip_${direction}`;
    const applyLabel = `check_transition_${worldLabel}_s${screenIndex}_apply_${direction}`;
    let conditionCode = '';
    let repositionCode = '';
    if (direction === 'east') {
        conditionCode = `    ; East exit: X near right edge and rightward input
    ld a, (input_state)
    cp STICK_RIGHT
    jr z, .dir_ok_${skipLabel}
    cp STICK_UPRIGHT
    jr z, .dir_ok_${skipLabel}
    cp STICK_DOWNRIGHT
    jp nz, ${skipLabel}
.dir_ok_${skipLabel}:
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    cp ${currentBounds.eastExitX}
    jp c, ${skipLabel}
`;
        repositionCode = `    ; Enter from west edge
    ld hl, entity_x_pos
    add hl, de
    ld (hl), ${targetBounds.enterWestX}
`;
    }
    else if (direction === 'west') {
        conditionCode = `    ; West exit: X near left edge and leftward input
    ld a, (input_state)
    cp STICK_LEFT
    jr z, .dir_ok_${skipLabel}
    cp STICK_UPLEFT
    jr z, .dir_ok_${skipLabel}
    cp STICK_DOWNLEFT
    jp nz, ${skipLabel}
.dir_ok_${skipLabel}:
    ld hl, entity_x_pos
    add hl, de
    ld a, (hl)
    cp ${currentBounds.westExitX}
    jp nc, ${skipLabel}
`;
        repositionCode = `    ; Enter from east edge of target active area
    ld hl, entity_x_pos
    add hl, de
    ld (hl), ${targetBounds.enterEastX}
`;
    }
    else if (direction === 'south') {
        conditionCode = `    ; South exit: Y near bottom edge
    ; No input-direction gate: supports gravity/platform-driven movement
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    cp ${currentBounds.southExitY}
    jp c, ${skipLabel}
`;
        repositionCode = `    ; Enter from north edge
    ld hl, entity_y_pos
    add hl, de
    ld (hl), ${targetBounds.enterNorthY}
`;
    }
    else {
        conditionCode = `    ; North exit: Y near top edge
    ; No input-direction gate: supports velocity-driven movement
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    cp ${currentBounds.northExitY}
    jp nc, ${skipLabel}
`;
        repositionCode = `    ; Enter from south edge of target active area
    ld hl, entity_y_pos
    add hl, de
    ld (hl), ${targetBounds.enterSouthY}
`;
    }
    return `${conditionCode}${applyLabel}:
    push de
    ld a, ((${targetLoadRoutine} - #4000) / #2000)
    ld hl, ${targetLoadRoutine}
    call mapper_call_hl_auto
    pop de
    ld a, ${targetScreenIndex}
    ld (current_screen_index), a
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
    ld hl, entity_screen_id
    add hl, de
    ld (hl), a
${repositionCode}    ; Reset player velocity after transition
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
    call rebuild_used_entity_list  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state for new screen
    ret

${skipLabel}:
`;
}
/**
 * Generate worlds file with world map data and loading functions (worlds.asm)
 *
 * WorldMap structure:
 * - nodes: Array of screen nodes with screenAssetId
 * - connections: Array of connections between screens (for transitions)
 * - startScreenNodeId: ID of the initial screen node
 *
 * @param analysis - Project analysis with world maps and screens
 * @returns ASM code string with world map data and loading functions
 */
function generateWorldsFile(analysis) {
    // Check if we have world maps in the analysis
    const worldMaps = analysis.worldmaps || [];
    const hasHudElements = !!analysis.screenMaps?.some((screen) => Array.isArray(screen?.hudConfiguration?.elements) && screen.hudConfiguration.elements.length > 0);
    const hasScreenTimer = hasGlobalVariableAsmName(analysis, 'global_var_time_remaining');
    // Skip world system if no worlds in project
    if (worldMaps.length === 0) {
        return `; ==================================================================
; WORLD MAPS (SKIPPED - NO WORLDS DETECTED)
; File: worlds.asm
; ==================================================================

; No worlds detected in project - world system not needed

; Minimal stub functions for compatibility
load_world_default:
    ret

check_world_screen_transition:
    ret

; ==================================================================
; END OF WORLDS (MINIMAL VERSION)
; ==================================================================
`;
    }
    let code = `; ==================================================================
; WORLD MAPS
; File: worlds.asm
; Description: World map structures and screen loading functions
; Generated by Mideas MSX Generator
; ==================================================================

`;
    // Generate constants for each world
    code += `; ==================================================================
; WORLD MAP CONSTANTS
; ==================================================================

`;
    worldMaps.forEach((world, index) => {
        const worldName = toConstantName(world.name || `world_${index}`);
        const worldId = world.id || `world_${index}`;
        code += `; World: ${world.name || 'Unnamed'} (${worldId})
WORLD_${worldName}_ID EQU ${index}
WORLD_${worldName}_SCREEN_COUNT EQU ${world.nodes?.length || 0}
`;
        // Generate constants for each screen node in the world
        if (world.nodes && world.nodes.length > 0) {
            const nodeNameCounts = new Map();
            world.nodes.forEach((node, nodeIndex) => {
                const baseNodeName = toConstantName(node.name || `screen_${nodeIndex}`);
                const seenCount = nodeNameCounts.get(baseNodeName) || 0;
                const nodeName = seenCount === 0 ? baseNodeName : `${baseNodeName}_${seenCount + 1}`;
                nodeNameCounts.set(baseNodeName, seenCount + 1);
                code += `WORLD_${worldName}_SCREEN_${nodeName}_ID EQU ${nodeIndex}
`;
            });
        }
        code += `\n`;
    });
    // Generate load_world_X functions for each world
    code += `; ==================================================================
; WORLD LOADING FUNCTIONS
; ==================================================================

`;
    worldMaps.forEach((world) => {
        const worldId = world.id || 'unknown';
        const startScreenNodeId = world.startScreenNodeId;
        const nodes = world.nodes || [];
        code += `; ------------------------------------------------------------------
; Load World: ${world.name || 'Unnamed'}
; World ID: ${worldId}
; Screens: ${nodes.length}
; Start Screen Node: ${startScreenNodeId || 'none'}
; ------------------------------------------------------------------
load_world_${toRoutineLabel(worldId)}:
`;
        if (nodes.length === 0) {
            code += `    ; No screens in this world
    ret

`;
            return;
        }
        // Find the start screen node
        const startNode = nodes.find((n) => n.id === startScreenNodeId) || nodes[0];
        const startNodeIndex = Math.max(0, nodes.findIndex((n) => n.id === startNode.id));
        const startScreenAssetId = startNode.screenAssetId;
        if (!startScreenAssetId) {
            code += `    ; No valid start screen found
    ret

`;
            return;
        }
        const loadRoutine = getScreenLoadRoutineName(startScreenAssetId, analysis);
        const worldImportedHudFrameDrawRoutine = getWorldImportedHudFrameDrawRoutineName(world, analysis);
        code += `    ; Load start screen: ${startNode.name || 'unknown'} (${startScreenAssetId})
    ld a, ((${loadRoutine} - #4000) / #2000)
    ld hl, ${loadRoutine}
    call mapper_call_hl_auto

`;
        if (worldImportedHudFrameDrawRoutine) {
            code += `    ; Draw imported HUD frame once at world start
    call ${worldImportedHudFrameDrawRoutine}

`;
        }
        if (hasHudElements) {
            code += `    ; Draw HUD frame once at world start
    call imprimir_marco

`;
        }
        code += `    ; Initialize world state
    ld a, WORLD_${toConstantName(world.name || 'unnamed')}_ID
    ld (current_world_id), a

    ld a, ${startNodeIndex}
    ld (current_screen_index), a
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1

    xor a
    ld (screen_transition_cooldown), a

${hasScreenTimer ? `    call reset_world_screen_timer
` : ``}    call rebuild_used_entity_list  ; Precompute room entity buckets before gameplay resumes
    call apply_collected_tiles     ; Re-apply persistent collection state for this screen
    ret

`;
    });
    // Generate screen transition functions
    code += `; ==================================================================
; SCREEN TRANSITION FUNCTIONS
; ==================================================================

`;
    worldMaps.forEach((world) => {
        const worldId = world.id || 'unknown';
        const nodes = world.nodes || [];
        const connections = world.connections || [];
        if (connections.length === 0) {
            code += `; World ${world.name || 'Unnamed'} has no screen connections

`;
            return;
        }
        code += `; ------------------------------------------------------------------
; World: ${world.name || 'Unnamed'}
; Connections: ${connections.length}
; ------------------------------------------------------------------

`;
        connections.forEach((conn, connIndex) => {
            const fromNodeId = extractConnectionNodeId(conn, 'from');
            const toNodeId = extractConnectionNodeId(conn, 'to');
            if (!fromNodeId || !toNodeId) {
                code += `; Invalid connection ${connIndex}: missing endpoint IDs

`;
                return;
            }
            const fromNode = nodes.find((n) => n.id === fromNodeId);
            const toNode = nodes.find((n) => n.id === toNodeId);
            if (!fromNode || !toNode) {
                code += `; Invalid connection ${connIndex}: missing nodes

`;
                return;
            }
            const toScreenId = toNode.screenAssetId;
            const toScreenIndex = nodes.findIndex((n) => n.id === toNode.id);
            const toLoadRoutine = getScreenLoadRoutineName(toScreenId, analysis);
            code += `; Transition: ${fromNode.name || 'screen'} -> ${toNode.name || 'screen'}
transition_${toRoutineLabel(worldId)}_${connIndex}:
    ld a, ((${toLoadRoutine} - #4000) / #2000)
    ld hl, ${toLoadRoutine}
    call mapper_call_hl_auto

    ld a, ${toScreenIndex}
    ld (current_screen_index), a
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
${hasScreenTimer ? `    call reset_world_screen_timer
` : ``}    call rebuild_used_entity_list  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state
    ret

`;
        });
    });
    // Generate runtime edge transition checker (Preview parity)
    code += `; ==================================================================
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
`;
    worldMaps.forEach((world, worldIndex) => {
        const worldName = toConstantName(world.name || `world_${worldIndex}`);
        const worldId = world.id || `world_${worldIndex}`;
        const worldRoutine = `check_transition_world_${toRoutineLabel(worldId)}`;
        code += `    cp WORLD_${worldName}_ID
    jp z, ${worldRoutine}
`;
    });
    code += `    ret

`;
    worldMaps.forEach((world, worldIndex) => {
        const worldId = world.id || `world_${worldIndex}`;
        const worldLabel = toRoutineLabel(worldId);
        const nodes = world.nodes || [];
        const connections = world.connections || [];
        code += `check_transition_world_${worldLabel}:
`;
        if (nodes.length === 0 || connections.length === 0) {
            code += `    ret

`;
            return;
        }
        // Build node index lookup
        const nodeIndexById = new Map();
        nodes.forEach((node, idx) => nodeIndexById.set(node.id, idx));
        // Build transition map: screen index -> direction -> target screen index
        const transitionMap = new Map();
        nodes.forEach((_, idx) => transitionMap.set(idx, {}));
        connections.forEach((conn) => {
            const fromNodeId = extractConnectionNodeId(conn, 'from');
            const toNodeId = extractConnectionNodeId(conn, 'to');
            const fromDir = extractConnectionDirection(conn, 'from');
            const toDir = extractConnectionDirection(conn, 'to');
            if (!fromNodeId || !toNodeId)
                return;
            const fromIndex = nodeIndexById.get(fromNodeId);
            const toIndex = nodeIndexById.get(toNodeId);
            if (fromIndex === undefined || toIndex === undefined)
                return;
            if (fromDir) {
                const mapEntry = transitionMap.get(fromIndex);
                if (mapEntry && mapEntry[fromDir] === undefined) {
                    mapEntry[fromDir] = toIndex;
                }
            }
            if (toDir) {
                const mapEntry = transitionMap.get(toIndex);
                if (mapEntry && mapEntry[toDir] === undefined) {
                    mapEntry[toDir] = fromIndex;
                }
            }
        });
        code += `    ld a, (current_screen_index)
`;
        nodes.forEach((_, idx) => {
            const screenLabel = `check_transition_${worldLabel}_screen_${idx}`;
            code += `    cp ${idx}
    jp z, ${screenLabel}
`;
        });
        code += `    ret

`;
        nodes.forEach((node, idx) => {
            const transitions = transitionMap.get(idx) || {};
            const screenLabel = `check_transition_${worldLabel}_screen_${idx}`;
            code += `${screenLabel}:
`;
            const directions = ['east', 'west', 'south', 'north'];
            let emittedAny = false;
            directions.forEach((direction) => {
                const targetIndex = transitions[direction];
                if (targetIndex === undefined)
                    return;
                const targetNode = nodes[targetIndex];
                if (!targetNode?.screenAssetId)
                    return;
                const targetLoadRoutine = getScreenLoadRoutineName(targetNode.screenAssetId, analysis);
                const currentBounds = getScreenActiveAreaBounds(node.screenAssetId, analysis);
                const targetBounds = getScreenActiveAreaBounds(targetNode.screenAssetId, analysis);
                code += emitDirectionalTransitionCode(worldLabel, idx, direction, targetIndex, targetLoadRoutine, currentBounds, targetBounds);
                emittedAny = true;
            });
            if (!emittedAny) {
                code += `    ret

`;
            }
            else {
                code += `    ret

`;
            }
        });
    });
    // Generate helper functions
    code += `; ==================================================================
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
    call rebuild_used_entity_list
    ret

; ==================================================================
; END OF WORLDS
; ==================================================================
`;
    return code;
}
