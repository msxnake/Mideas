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
/**
 * Normalize world direction aliases to canonical values.
 */
function normalizeDirection(raw) {
    const value = String(raw !== null && raw !== void 0 ? raw : '').trim().toLowerCase();
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
    const directValue = conn === null || conn === void 0 ? void 0 : conn[directKey];
    if (typeof directValue === 'string' && directValue.length > 0)
        return directValue;
    const endpoint = conn === null || conn === void 0 ? void 0 : conn[side];
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
    const directValue = conn === null || conn === void 0 ? void 0 : conn[directKey];
    const normalizedDirect = normalizeDirection(directValue);
    if (normalizedDirect)
        return normalizedDirect;
    const endpoint = conn === null || conn === void 0 ? void 0 : conn[side];
    return normalizeDirection(endpoint === null || endpoint === void 0 ? void 0 : endpoint.direction);
}
/**
 * Get the generated load_screen routine name for a screen asset id.
 */
function getScreenLoadRoutineName(screenAssetId, analysis) {
    var _a, _b;
    const screenAsset = (_a = analysis.screens) === null || _a === void 0 ? void 0 : _a.find((s) => s.id === screenAssetId);
    const screenName = ((_b = screenAsset === null || screenAsset === void 0 ? void 0 : screenAsset.name) === null || _b === void 0 ? void 0 : _b.toUpperCase().replace(/[^A-Z0-9]/g, '_')) || 'UNKNOWN';
    const screenIdSuffix = screenAssetId
        ? `_${screenAssetId.replace(/[^a-zA-Z0-9]/g, '_').slice(-12)}`
        : '';
    return `load_screen_${screenName.toLowerCase()}${screenIdSuffix.toLowerCase()}`;
}
/**
 * Get the generated imported HUD frame draw routine name for a screen asset id.
 * Returns null when screen has no imported HUD frame snapshot.
 */
function getImportedHudFrameDrawRoutineName(screenAssetId, analysis) {
    var _a, _b, _c, _d;
    const screenAsset = (_a = analysis.screens) === null || _a === void 0 ? void 0 : _a.find((s) => s.id === screenAssetId);
    const importedCells = (_c = (_b = screenAsset === null || screenAsset === void 0 ? void 0 : screenAsset.hudConfiguration) === null || _b === void 0 ? void 0 : _b.importedFrame) === null || _c === void 0 ? void 0 : _c.cells;
    if (!Array.isArray(importedCells) || importedCells.length === 0) {
        return null;
    }
    const screenName = ((_d = screenAsset === null || screenAsset === void 0 ? void 0 : screenAsset.name) === null || _d === void 0 ? void 0 : _d.toUpperCase().replace(/[^A-Z0-9]/g, '_')) || 'UNKNOWN';
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
    const nodes = Array.isArray(world === null || world === void 0 ? void 0 : world.nodes) ? world.nodes : [];
    if (nodes.length === 0)
        return null;
    const orderedNodes = [];
    const startScreenNodeId = world === null || world === void 0 ? void 0 : world.startScreenNodeId;
    const startNode = nodes.find((n) => (n === null || n === void 0 ? void 0 : n.id) === startScreenNodeId);
    if (startNode)
        orderedNodes.push(startNode);
    nodes.forEach((n) => {
        if (!startNode || (n === null || n === void 0 ? void 0 : n.id) !== startNode.id)
            orderedNodes.push(n);
    });
    for (const node of orderedNodes) {
        const screenAssetId = node === null || node === void 0 ? void 0 : node.screenAssetId;
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
function emitDirectionalTransitionCode(worldLabel, screenIndex, direction, targetScreenIndex, targetLoadRoutine) {
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
    cp 240
    jp c, ${skipLabel}
`;
        repositionCode = `    ; Enter from west edge
    ld hl, entity_x_pos
    add hl, de
    ld (hl), 2
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
    cp 2
    jp nc, ${skipLabel}
`;
        repositionCode = `    ; Enter from east edge (256 - 16 - 2 = 238)
    ld hl, entity_x_pos
    add hl, de
    ld (hl), 238
`;
    }
    else if (direction === 'south') {
        conditionCode = `    ; South exit: Y near bottom edge
    ; No input-direction gate: supports gravity/platform-driven movement
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    cp 176
    jp c, ${skipLabel}
`;
        repositionCode = `    ; Enter from north edge
    ld hl, entity_y_pos
    add hl, de
    ld (hl), 2
`;
    }
    else {
        conditionCode = `    ; North exit: Y near top edge
    ; No input-direction gate: supports velocity-driven movement
    ld hl, entity_y_pos
    add hl, de
    ld a, (hl)
    cp 2
    jp nc, ${skipLabel}
`;
        repositionCode = `    ; Enter from south edge (192 - 16 - 2 = 174)
    ld hl, entity_y_pos
    add hl, de
    ld (hl), 174
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
    var _a;
    // Check if we have world maps in the analysis
    const worldMaps = analysis.worldmaps || [];
    const hasHudElements = !!((_a = analysis.screenMaps) === null || _a === void 0 ? void 0 : _a.some((screen) => { var _a; return Array.isArray((_a = screen === null || screen === void 0 ? void 0 : screen.hudConfiguration) === null || _a === void 0 ? void 0 : _a.elements) && screen.hudConfiguration.elements.length > 0; }));
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
        var _a;
        const worldName = toConstantName(world.name || `world_${index}`);
        const worldId = world.id || `world_${index}`;
        code += `; World: ${world.name || 'Unnamed'} (${worldId})
WORLD_${worldName}_ID EQU ${index}
WORLD_${worldName}_SCREEN_COUNT EQU ${((_a = world.nodes) === null || _a === void 0 ? void 0 : _a.length) || 0}
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

    xor a
    ld (screen_transition_cooldown), a

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

    ; Find first ACTIVE entity with Input component in current screen
.find_player_start:
    ld b, MAX_ENTITIES
    ld e, 0
    ld d, 0
.find_player_loop:
    ; Check entity active flag
    ld hl, entity_active
    add hl, de
    ld a, (hl)
    or a
    jr z, .find_player_next

    ; Check Input component mask
    ld hl, entity_comp_masks
    add hl, de
    ld a, (hl)
    and COMP_MASK_INPUT
    jr z, .find_player_next

    ; Check entity belongs to current screen
    ld hl, entity_screen_id
    add hl, de
    ld a, (hl)
    ld hl, current_screen_id
    cp (hl)
    jr z, .player_found

.find_player_next:
    inc e
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
                if (!(targetNode === null || targetNode === void 0 ? void 0 : targetNode.screenAssetId))
                    return;
                const targetLoadRoutine = getScreenLoadRoutineName(targetNode.screenAssetId, analysis);
                code += emitDirectionalTransitionCode(worldLabel, idx, direction, targetIndex, targetLoadRoutine);
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
    ret

; ==================================================================
; END OF WORLDS
; ==================================================================
`;
    return code;
}
