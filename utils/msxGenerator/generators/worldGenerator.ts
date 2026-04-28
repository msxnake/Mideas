/**
 * @fileoverview World Generator - WorldMap structure and loading functions
 * Generates worlds.asm with world map data and screen loading functions
 */

import { ProjectAnalysis } from '../../asmTemplateGenerator';

type WorldDirection = 'north' | 'south' | 'east' | 'west';

type ScreenActiveAreaBounds = {
  leftPx: number;
  topPx: number;
  rightPx: number;
  bottomPx: number;
  westExitX: number;
  eastExitX: number;
  northExitY: number;
  southExitY: number;
  enterWestX: number;
  enterEastX: number;
  enterNorthY: number;
  enterSouthY: number;
};

type WorldMusicPolicy =
  | { mode: 'preserve' }
  | { mode: 'stop' }
  | { mode: 'play'; trackIndex: number; loopFlag: number };

/**
 * Convert name to valid ASM label (lowercase)
 */
function toRoutineLabel(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

/**
 * Convert name to valid ASM constant (uppercase)
 */
function toConstantName(name: string): string {
  return name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
}

function hasGlobalVariableAsmName(analysis: ProjectAnalysis, asmName: string): boolean {
  const globals = Array.isArray((analysis as any).globalVariables) ? (analysis as any).globalVariables : [];
  return globals.some((variable: any) => String(variable?.asmName || '').trim().toLowerCase() === asmName.toLowerCase());
}

function getExportableTrackIndex(trackAssetId: string, analysis: ProjectAnalysis): number | null {
  const trimmedId = String(trackAssetId || '').trim();
  if (!trimmedId) return null;

  const trackIndexMap = ((analysis as any).trackIndexByAssetId || {}) as Record<string, number>;
  const trackIndex = trackIndexMap[trimmedId];
  return trackIndex !== undefined ? trackIndex : null;
}

function buildWorldMusicPolicyMap(analysis: ProjectAnalysis): Map<string, WorldMusicPolicy> {
  const policies = new Map<string, WorldMusicPolicy>();
  const gameFlow = analysis.gameFlow as any;
  const nodes = Array.isArray(gameFlow?.nodes) ? gameFlow.nodes : [];
  if (nodes.length === 0) return policies;

  const nodeById = new Map<string, any>();
  for (const node of nodes) {
    const nodeId = String(node?.id || '').trim();
    if (!nodeId) continue;
    nodeById.set(nodeId, node);
  }

  const adjacency = new Map<string, string[]>();
  for (const connection of Array.isArray(gameFlow?.connections) ? gameFlow.connections : []) {
    const fromId = String(connection?.from?.nodeId || '').trim();
    const toId = String(connection?.to?.nodeId || '').trim();
    if (!fromId || !toId) continue;
    const next = adjacency.get(fromId) || [];
    next.push(toId);
    adjacency.set(fromId, next);
  }

  const startNodeId = String(gameFlow?.startNodeId || '').trim();
  if (!startNodeId || !nodeById.has(startNodeId)) {
    return policies;
  }

  const initialPolicy: WorldMusicPolicy = { mode: 'stop' };
  const queue: Array<{ nodeId: string; policy: WorldMusicPolicy }> = [{ nodeId: startNodeId, policy: initialPolicy }];
  const seenStates = new Set<string>();

  const serializePolicy = (policy: WorldMusicPolicy): string => {
    if (policy.mode !== 'play') return policy.mode;
    return `play:${policy.trackIndex}:${policy.loopFlag}`;
  };

  const samePolicy = (left: WorldMusicPolicy, right: WorldMusicPolicy): boolean => {
    if (left.mode !== right.mode) return false;
    if (left.mode !== 'play' || right.mode !== 'play') return true;
    return left.trackIndex === right.trackIndex && left.loopFlag === right.loopFlag;
  };

  while (queue.length > 0) {
    const state = queue.shift()!;
    const stateKey = `${state.nodeId}|${serializePolicy(state.policy)}`;
    if (seenStates.has(stateKey)) continue;
    seenStates.add(stateKey);

    const node = nodeById.get(state.nodeId);
    if (!node) continue;

    let nextPolicy = state.policy;
    if (node.type === 'Music') {
      if (node.stop === true) {
        nextPolicy = { mode: 'stop' };
      } else if (node.autoPlay === false) {
        nextPolicy = state.policy;
      } else {
        const trackIndex = getExportableTrackIndex(String(node.trackAssetId || ''), analysis);
        if (trackIndex !== null) {
          nextPolicy = {
            mode: 'play',
            trackIndex,
            loopFlag: node.loop === false ? 0 : 1,
          };
        }
      }
    }

    if (node.type === 'WorldLink') {
      const worldId = String(node.worldAssetId || '').trim();
      if (worldId) {
        const previous = policies.get(worldId);
        if (!previous) {
          policies.set(worldId, nextPolicy);
        } else if (!samePolicy(previous, nextPolicy)) {
          policies.set(worldId, { mode: 'preserve' });
        }
      }
    }

    for (const nextNodeId of adjacency.get(state.nodeId) || []) {
      queue.push({ nodeId: nextNodeId, policy: nextPolicy });
    }
  }

  return policies;
}

export function buildWorldMusicPolicyManifest(analysis: ProjectAnalysis): string {
  const worldMaps = (analysis as any).worldmaps || [];
  const policies = buildWorldMusicPolicyMap(analysis);
  const lines: string[] = [];

  lines.push('WORLD MUSIC POLICY');
  lines.push('Source: inferred from Game Flow paths reaching each WorldLink.');
  lines.push('Mode preserve: multiple different music states can reach the same world.');
  lines.push('');

  if (worldMaps.length === 0) {
    lines.push('No worlds detected.');
    return lines.join('\n');
  }

  worldMaps.forEach((world: any, index: number) => {
    const worldName = String(world?.name || `world_${index}`).trim() || `world_${index}`;
    const worldId = String(world?.id || '').trim() || `world_${index}`;
    const policy = policies.get(worldId) || { mode: 'preserve' } as WorldMusicPolicy;
    const header = `WORLD ${index.toString().padStart(2, '0')} ${worldName} (${worldId})`;
    lines.push(header);
    if (policy.mode === 'play') {
      lines.push(`- policy: play track ${policy.trackIndex} loop=${policy.loopFlag}`);
    } else {
      lines.push(`- policy: ${policy.mode}`);
    }
    lines.push('');
  });

  return lines.join('\n').trimEnd();
}

/**
 * Normalize world direction aliases to canonical values.
 */
function normalizeDirection(raw: unknown): WorldDirection | null {
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
function extractConnectionNodeId(conn: any, side: 'from' | 'to'): string | null {
  const directKey = side === 'from' ? 'fromNodeId' : 'toNodeId';
  const directValue = conn?.[directKey];
  if (typeof directValue === 'string' && directValue.length > 0) return directValue;

  const endpoint = conn?.[side];
  if (typeof endpoint === 'string' && endpoint.length > 0) return endpoint;
  if (endpoint && typeof endpoint.nodeId === 'string' && endpoint.nodeId.length > 0) return endpoint.nodeId;

  return null;
}

/**
 * Get canonical direction from connection side.
 */
function extractConnectionDirection(conn: any, side: 'from' | 'to'): WorldDirection | null {
  const directKey = side === 'from' ? 'fromDirection' : 'toDirection';
  const directValue = conn?.[directKey];
  const normalizedDirect = normalizeDirection(directValue);
  if (normalizedDirect) return normalizedDirect;

  const endpoint = conn?.[side];
  return normalizeDirection(endpoint?.direction);
}

/**
 * Get the generated load_screen routine name for a screen asset id.
 */
function getScreenLoadRoutineName(screenAssetId: string, analysis: ProjectAnalysis): string {
  const screenAsset = analysis.screens?.find((s: any) => s.id === screenAssetId);
  const screenName = screenAsset?.name?.toUpperCase().replace(/[^A-Z0-9]/g, '_') || 'UNKNOWN';
  const screenIdSuffix = screenAssetId
    ? `_${screenAssetId.replace(/[^a-zA-Z0-9]/g, '_').slice(-12)}`
    : '';
  return `load_screen_${screenName.toLowerCase()}${screenIdSuffix.toLowerCase()}`;
}

function getScreenActiveAreaBounds(screenAssetId: string, analysis: ProjectAnalysis): ScreenActiveAreaBounds {
  const screenAsset = analysis.screens?.find((s: any) => s.id === screenAssetId);
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
function getImportedHudFrameDrawRoutineName(screenAssetId: string, analysis: ProjectAnalysis): string | null {
  const screenAsset = analysis.screens?.find((s: any) => s.id === screenAssetId);
  const importedCells = screenAsset?.hudConfiguration?.importedFrame?.cells;
  if (!Array.isArray(importedCells) || importedCells.length === 0) {
    return null;
  }

  const hasUsableSnapshot = importedCells.some((cell: any) => {
    if (cell?.tileId) return true;
    const charCode = Number(cell?.charCode);
    return Number.isFinite(charCode) && charCode > 0;
  });
  if (!hasUsableSnapshot) {
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
function getWorldImportedHudFrameDrawRoutineName(world: any, analysis: ProjectAnalysis): string | null {
  const nodes = Array.isArray(world?.nodes) ? world.nodes : [];
  if (nodes.length === 0) return null;

  const orderedNodes: any[] = [];
  const startScreenNodeId = world?.startScreenNodeId;
  const startNode = nodes.find((n: any) => n?.id === startScreenNodeId);
  if (startNode) orderedNodes.push(startNode);
  nodes.forEach((n: any) => {
    if (!startNode || n?.id !== startNode.id) orderedNodes.push(n);
  });

  for (const node of orderedNodes) {
    const screenAssetId = node?.screenAssetId;
    if (!screenAssetId) continue;
    const routine = getImportedHudFrameDrawRoutineName(screenAssetId, analysis);
    if (routine) return routine;
  }

  return null;
}

/**
 * Emit transition runtime snippet for one exit direction.
 */
function emitDirectionalTransitionCode(
  worldLabel: string,
  screenIndex: number,
  direction: WorldDirection,
  targetScreenIndex: number,
  targetGlobalScreenId: number,
  targetLoadRoutine: string,
  currentBounds: ScreenActiveAreaBounds,
  targetBounds: ScreenActiveAreaBounds,
  useFarCall: boolean = false
): string {
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
  } else if (direction === 'west') {
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
  } else if (direction === 'south') {
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
  } else {
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

  const screenCallCode = useFarCall
    ? `    call ${targetLoadRoutine}_far\n`
    : `    ld a, ((${targetLoadRoutine} - #4000) / #2000)\n    ld hl, ${targetLoadRoutine}\n    call mapper_call_hl_auto\n`;
  return `${conditionCode}${applyLabel}:
    push de
${screenCallCode}    pop de
    ld a, ${targetScreenIndex}
    ld (current_screen_index), a
    ld a, ${targetGlobalScreenId}
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
export function generateWorldsFile(analysis: ProjectAnalysis, romMode: string = 'simple32k'): string {
  const useFarCall = romMode === 'megarom';
  // Check if we have world maps in the analysis
  const worldMaps = (analysis as any).worldmaps || [];
  const worldMusicPolicies = buildWorldMusicPolicyMap(analysis);
  const hasHudElements = !!analysis.screenMaps?.some((screen: any) =>
    Array.isArray(screen?.hudConfiguration?.elements) && screen.hudConfiguration.elements.length > 0
  );
  const hasScreenTimer = hasGlobalVariableAsmName(analysis, 'global_var_time_remaining');
  const resetScreenTimerCall = hasScreenTimer
    ? (useFarCall ? 'world_reset_screen_timer' : 'reset_world_screen_timer')
    : '';
  const hudFrameCall = (routine: string) => useFarCall ? `${routine}_far` : routine;
  const drawHudFrameCall = useFarCall ? 'imprimir_marco_far' : 'imprimir_marco';
  const musicStopCall = useFarCall ? 'call_music_stop_resident' : 'music_stop';
  const musicPlayTrackCall = useFarCall ? 'call_music_play_track_resident' : 'music_play_track';

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

ensure_music_for_world_id:
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

  worldMaps.forEach((world: any, index: number) => {
    const worldName = toConstantName(world.name || `world_${index}`);
    const worldId = world.id || `world_${index}`;

    code += `; World: ${world.name || 'Unnamed'} (${worldId})
WORLD_${worldName}_ID EQU ${index}
WORLD_${worldName}_SCREEN_COUNT EQU ${world.nodes?.length || 0}
`;

    // Generate constants for each screen node in the world
    if (world.nodes && world.nodes.length > 0) {
      const nodeNameCounts = new Map<string, number>();
      world.nodes.forEach((node: any, nodeIndex: number) => {
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

  code += `; ==================================================================
; WORLD MUSIC POLICY
; preserve (#FE): do not touch current music when Game Flow can reach the
; world with multiple different music states.
; stop     (#FF): stop music on world enter.
; play     (0-254): ensure this track index is active on world enter.
; ==================================================================

world_music_policy_track_table:
`;

  worldMaps.forEach((world: any, index: number) => {
    const worldName = toConstantName(world.name || `world_${index}`);
    const policy = worldMusicPolicies.get(String(world.id || '').trim()) || { mode: 'preserve' } as WorldMusicPolicy;
    if (policy.mode === 'play') {
      code += `    db ${policy.trackIndex}    ; WORLD_${worldName}_ID -> track ${policy.trackIndex}\n`;
    } else if (policy.mode === 'stop') {
      code += `    db #FF    ; WORLD_${worldName}_ID -> stop\n`;
    } else {
      code += `    db #FE    ; WORLD_${worldName}_ID -> preserve\n`;
    }
  });

  code += `
world_music_policy_loop_table:
`;

  worldMaps.forEach((world: any, index: number) => {
    const worldName = toConstantName(world.name || `world_${index}`);
    const policy = worldMusicPolicies.get(String(world.id || '').trim()) || { mode: 'preserve' } as WorldMusicPolicy;
    const loopFlag = policy.mode === 'play' ? policy.loopFlag : 0;
    code += `    db ${loopFlag}    ; WORLD_${worldName}_ID loop\n`;
  });

  code += `
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
    jp ${musicStopCall}
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
    jp ${musicPlayTrackCall}

`;

  // Generate load_world_X functions for each world
  code += `; ==================================================================
; WORLD LOADING FUNCTIONS
; ==================================================================

`;

  if (hasScreenTimer && useFarCall) {
    code += `; ------------------------------------------------------------------
; world_reset_screen_timer
; Local copy used while executing inside the worlds far bank. The
; GameFlow timer routine lives in the primary P3 bank, which is hidden
; while this bank is mapped.
; ------------------------------------------------------------------
world_reset_screen_timer:
    push af
    ld a, (current_screen_engine)
    or a
    jr nz, world_local_timer_reset_done
    ld a, 60
    ld (global_var_time_remaining), a
    xor a
    ld (global_var_time_remaining+1), a
    ld a, (isComputer50HzOr60Hz)
    or a
    ld a, 50
    jr z, world_local_timer_frames_ready
    ld a, 60
world_local_timer_frames_ready:
    ld (time_second_frame_counter), a
    ld a, (interrupt_counter)
    ld (time_last_interrupt_counter), a
    ld a, (interrupt_counter+1)
    ld (time_last_interrupt_counter+1), a
    ld a, 1
    ld (hud_dirty_flag), a
world_local_timer_reset_done:
    pop af
    ret

`;
  }

  let worldGlobalOffset = 0;
  worldMaps.forEach((world: any) => {
    const worldId = world.id || 'unknown';
    const startScreenNodeId = world.startScreenNodeId;
    const nodes = world.nodes || [];
    const currentWorldGlobalOffset = worldGlobalOffset;
    worldGlobalOffset += nodes.length;

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
    const startNode = nodes.find((n: any) => n.id === startScreenNodeId) || nodes[0];
    const startNodeIndex = Math.max(0, nodes.findIndex((n: any) => n.id === startNode.id));
    const startScreenAssetId = startNode.screenAssetId;

    if (!startScreenAssetId) {
      code += `    ; No valid start screen found
    ret

`;
      return;
    }

    const loadRoutine = getScreenLoadRoutineName(startScreenAssetId, analysis);
    const worldImportedHudFrameDrawRoutine = getWorldImportedHudFrameDrawRoutineName(world, analysis);

    const startScreenCallCode = useFarCall
      ? `    call ${loadRoutine}_far\n`
      : `    ld a, ((${loadRoutine} - #4000) / #2000)\n    ld hl, ${loadRoutine}\n    call mapper_call_hl_auto\n`;
    code += `    ; Ensure default music policy for this world when unambiguous
    ld a, WORLD_${toConstantName(world.name || 'unnamed')}_ID
    call ensure_music_for_world_id
    ; Load runtime sprite patterns for this world
    ld a, WORLD_${toConstantName(world.name || 'unnamed')}_ID
    call ensure_sprite_patterns_for_world_id
    ; Load start screen: ${startNode.name || 'unknown'} (${startScreenAssetId})
${startScreenCallCode}
`;
    if (worldImportedHudFrameDrawRoutine) {
      code += `    ; Draw imported HUD frame once at world start
    call ${hudFrameCall(worldImportedHudFrameDrawRoutine)}

`;
    }
    if (hasHudElements) {
      code += `    ; Draw HUD frame once at world start
    call ${drawHudFrameCall}

`;
    }

    code += `    ; Initialize world state
    ld a, WORLD_${toConstantName(world.name || 'unnamed')}_ID
    ld (current_world_id), a

    ld a, ${startNodeIndex}
    ld (current_screen_index), a
    ld a, ${currentWorldGlobalOffset + startNodeIndex}
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1

    xor a
    ld (screen_transition_cooldown), a

${hasScreenTimer ? `    call ${resetScreenTimerCall}
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

  let transitionWorldGlobalOffset = 0;
  worldMaps.forEach((world: any) => {
    const worldId = world.id || 'unknown';
    const nodes = world.nodes || [];
    const connections = world.connections || [];
    const currentTransitionWorldOffset = transitionWorldGlobalOffset;
    transitionWorldGlobalOffset += nodes.length;

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

    connections.forEach((conn: any, connIndex: number) => {
      const fromNodeId = extractConnectionNodeId(conn, 'from');
      const toNodeId = extractConnectionNodeId(conn, 'to');

      if (!fromNodeId || !toNodeId) {
        code += `; Invalid connection ${connIndex}: missing endpoint IDs

`;
        return;
      }

      const fromNode = nodes.find((n: any) => n.id === fromNodeId);
      const toNode = nodes.find((n: any) => n.id === toNodeId);

      if (!fromNode || !toNode) {
        code += `; Invalid connection ${connIndex}: missing nodes

`;
        return;
      }

      const toScreenId = toNode.screenAssetId;
      const toScreenIndex = nodes.findIndex((n: any) => n.id === toNode.id);
      const toGlobalScreenId = currentTransitionWorldOffset + toScreenIndex;
      const toLoadRoutine = getScreenLoadRoutineName(toScreenId, analysis);

      const transitionScreenCallCode = useFarCall
        ? `    call ${toLoadRoutine}_far\n`
        : `    ld a, ((${toLoadRoutine} - #4000) / #2000)\n    ld hl, ${toLoadRoutine}\n    call mapper_call_hl_auto\n`;
      code += `; Transition: ${fromNode.name || 'screen'} -> ${toNode.name || 'screen'}
transition_${toRoutineLabel(worldId)}_${connIndex}:
${transitionScreenCallCode}
    ld a, ${toScreenIndex}
    ld (current_screen_index), a
    ld a, ${toGlobalScreenId}
    ld (current_screen_id), a
    ld hl, active_entity_list_dirty
    ld (hl), 1
${hasScreenTimer ? `    call ${resetScreenTimerCall}
` : ``}    call rebuild_used_entity_list  ; Precompute room entity buckets during transition
    call apply_collected_tiles     ; Re-apply persistent collection state
    ret

`;
    });
  });

  // Add load_world_default alias pointing to the first world
  // Required by megarom trampolines (getKnownEntryPoints includes 'load_world_default')
  if (worldMaps.length > 0) {
    const firstWorldId = worldMaps[0].id || 'unknown';
    code += `; ------------------------------------------------------------------
; load_world_default: alias for the first world (required by megarom trampolines)
; ------------------------------------------------------------------
load_world_default:
    jp load_world_${toRoutineLabel(firstWorldId)}

`;
  }

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

  worldMaps.forEach((world: any, worldIndex: number) => {
    const worldName = toConstantName(world.name || `world_${worldIndex}`);
    const worldId = world.id || `world_${worldIndex}`;
    const worldRoutine = `check_transition_world_${toRoutineLabel(worldId)}`;
    code += `    cp WORLD_${worldName}_ID
    jp z, ${worldRoutine}
`;
  });

  code += `    ret

`;

  let edgeTransitionGlobalOffset = 0;
  worldMaps.forEach((world: any, worldIndex: number) => {
    const worldId = world.id || `world_${worldIndex}`;
    const worldLabel = toRoutineLabel(worldId);
    const nodes = world.nodes || [];
    const connections = world.connections || [];
    const currentEdgeWorldOffset = edgeTransitionGlobalOffset;
    edgeTransitionGlobalOffset += nodes.length;

    code += `check_transition_world_${worldLabel}:
`;

    if (nodes.length === 0 || connections.length === 0) {
      code += `    ret

`;
      return;
    }

    // Build node index lookup
    const nodeIndexById = new Map<string, number>();
    nodes.forEach((node: any, idx: number) => nodeIndexById.set(node.id, idx));

    // Build transition map: screen index -> direction -> target screen index
    const transitionMap = new Map<number, Partial<Record<WorldDirection, number>>>();
    nodes.forEach((_: any, idx: number) => transitionMap.set(idx, {}));

    connections.forEach((conn: any) => {
      const fromNodeId = extractConnectionNodeId(conn, 'from');
      const toNodeId = extractConnectionNodeId(conn, 'to');
      const fromDir = extractConnectionDirection(conn, 'from');
      const toDir = extractConnectionDirection(conn, 'to');

      if (!fromNodeId || !toNodeId) return;
      const fromIndex = nodeIndexById.get(fromNodeId);
      const toIndex = nodeIndexById.get(toNodeId);
      if (fromIndex === undefined || toIndex === undefined) return;

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
    nodes.forEach((_: any, idx: number) => {
      const screenLabel = `check_transition_${worldLabel}_screen_${idx}`;
      code += `    cp ${idx}
    jp z, ${screenLabel}
`;
    });
    code += `    ret

`;

    nodes.forEach((node: any, idx: number) => {
      const transitions = transitionMap.get(idx) || {};
      const screenLabel = `check_transition_${worldLabel}_screen_${idx}`;
      code += `${screenLabel}:
`;

      const directions: WorldDirection[] = ['east', 'west', 'south', 'north'];
      let emittedAny = false;

      directions.forEach((direction) => {
        const targetIndex = transitions[direction];
        if (targetIndex === undefined) return;
        const targetNode = nodes[targetIndex];
        if (!targetNode?.screenAssetId) return;

        const targetLoadRoutine = getScreenLoadRoutineName(targetNode.screenAssetId, analysis);
        const currentBounds = getScreenActiveAreaBounds(node.screenAssetId, analysis);
        const targetBounds = getScreenActiveAreaBounds(targetNode.screenAssetId, analysis);
        const targetGlobalScreenId = currentEdgeWorldOffset + targetIndex;
        code += emitDirectionalTransitionCode(worldLabel, idx, direction, targetIndex, targetGlobalScreenId, targetLoadRoutine, currentBounds, targetBounds, useFarCall);
        emittedAny = true;
      });

      if (!emittedAny) {
        code += `    ret

`;
      } else {
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
