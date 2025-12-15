/**
 * @fileoverview Game Flow Generator - GameFlow-Based Execution Engine
 * Generates complete GameFlow execution system based on node graph
 * 
 * Architecture: GameFlow is the SOLE orchestrator of game execution.
 * The ASM code follows the graph structure exclusively, starting from
 * the Start node and executing each connected node in sequence.
 */

import { ProjectAnalysis } from '../../asmTemplateGenerator';

/**
 * Sanitize node ID for use in ASM labels
 */
function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, '_');
}

/**
 * Convert node type to constant name (e.g., "WorldLink" -> "NODE_TYPE_WORLD_LINK")
 */
function getNodeTypeConstant(nodeType: string): string {
  return `NODE_TYPE_${nodeType
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toUpperCase()
    }`;
}

/**
 * Get routine name for screen loading
 */
function getScreenLoadRoutineName(screen: { name?: string; id?: string }): string {
  const screenName = (screen.name || 'DEFAULT').toUpperCase().replace(/[^A-Z0-9]/g, '_');
  const screenIdSuffix = screen.id ? `_${screen.id.replace(/[^a-zA-Z0-9]/g, '_').slice(-12)}` : '';
  return `load_screen_${screenName.toLowerCase()}${screenIdSuffix.toLowerCase()}`;
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
export function generateGameFlowFile(analysis: ProjectAnalysis): string {
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
  const nodeTypes = Array.from(new Set(gameFlow.nodes?.map((n: any) => n.type) || []));

  nodeTypes.forEach((nodeType: any) => {
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
    
    ; Skip this entry (type + address)
    inc hl
    inc hl
    inc hl
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

`;

  // ===================================================================
  // SECTION 5: GAME LOOP (for WorldLink nodes)
  // ===================================================================

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

    ; Update all entities
    call update_all_entities
    
    ; Execute all state machines
    call execute_all_state_machines
    
    ; Update sprites to VRAM
    call update_sprites_to_vram
    
    ; Wait for V-Blank (from H.TIMI hook)
    call wait_vblank
    
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
    gameFlow.nodes.forEach((node: any) => {
      code += generateNodeStructure(node, gameFlow, analysis);
    });
  }

  // ===================================================================
  // SECTION 7: VARIABLES
  // ===================================================================

  code += `
; ==================================================================
; GAMEFLOW VARIABLES
; ==================================================================

gameflow_exit_requested:    db 0    ; Flag to exit current game loop
gameflow_menu_selection:    db 0    ; Last menu selection
gameflow_condition_result:  db 0    ; Result of last condition evaluation

; ==================================================================
; END OF GAMEFLOW
; ==================================================================
`;

  return code;
}

/**
 * Generate handlers for all node types
 */
function generateNodeHandlers(nodeTypes: string[], analysis: ProjectAnalysis): string {
  let code = '';

  nodeTypes.forEach((nodeType: string) => {
    switch (nodeType) {
      case 'Start':
        code += `gameflow_handle_start:
    ; Start node - simply transition to next node
    ; BC = connection table
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
    push hl
    ret             ; Tricky: call via push+ret
    
.after_load:
    ; Set game state
    ld a, FLOW_STATE_GAME
    ld (current_flow_state), a
    
    ; Update sprites
    call update_sprites_to_vram
    
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
    ; End node - stop execution
    ; TODO: Show end screen based on node data
    ret

`;
        break;

      case 'Restart':
        code += `gameflow_handle_restart:
    ; Restart node - reset game
    jp init_rom

`;
        break;

      case 'SubMenu':
        code += `gameflow_handle_submenu:
    ; SubMenu node - show menu and follow selected option
    ; DE = menu data pointer
    ; BC = connection table
    
    push bc         ; Save connection table
    
    ; Show menu (implementation in menusGenerator.ts)
    ; For now, placeholder
    call show_menu_placeholder
    
    ; Get selection (0-based index)
    ld a, (gameflow_menu_selection)
    
    ; Calculate connection type (CONNECTION_OPTION_0 + index)
    add a, CONNECTION_OPTION_0
    
    pop bc          ; Restore connection table
    call gameflow_get_connection_by_type
    
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

show_menu_placeholder:
    ; TODO: Implement via menusGenerator.ts
    xor a
    ld (gameflow_menu_selection), a
    ret

`;
        break;

      case 'Text':
        code += `gameflow_handle_text:
    ; Text node - show text and wait for input
    ; DE = text data pointer
    ; BC = connection table
    
    push bc
    
    ; Show text (placeholder)
    call show_text_placeholder
    
    ; Wait for fire button
    call wait_for_fire
    
    ; Continue to next node
    pop bc
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z
    jp gameflow_execute_node

show_text_placeholder:
    ; TODO: Implement text display
    ret

wait_for_fire:
    ; TODO: Implement input waiting
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

execute_transition_effect:
    ; TODO: Implement transition effects
    ret

`;
        break;

      case 'Group':
        code += `gameflow_handle_group:
    ; Group node - nested GameFlow (placeholder)
    ; TODO: Implement nested GameFlow execution
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

execute_music_command:
    ; TODO: Implement music control
    ret

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
function generateNodeStructure(node: any, gameFlow: any, analysis: ProjectAnalysis): string {
  const nodeLabel = `gameflow_node_${sanitizeId(node.id)}`;
  const dataLabel = `${nodeLabel}_data`;
  const connLabel = `${nodeLabel}_conn`;

  let code = `; Node: ${node.type} - "${node.title || node.name || node.id}"
${nodeLabel}:
    db ${getNodeTypeConstant(node.type)}
    dw ${dataLabel}
    dw ${connLabel}

`;

  // Generate node-specific data
  code += `${dataLabel}:
`;

  switch (node.type) {
    case 'WorldLink':
      const worldAssetId = node.worldAssetId || 'default';
      code += `    dw load_world_${sanitizeId(worldAssetId)}\n`;
      break;

    case 'SubMenu':
      code += `    db ${node.options?.length || 0}    ; Number of options\n`;
      break;

    case 'Text':
      code += `    dw text_${sanitizeId(node.id)}    ; Text content pointer\n`;
      break;

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
        node.variables.forEach((v: any) => {
          const vName = v.variableName || v.name || 'unknown';
          const vAsmName = `global_var_${vName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')}`;
          const vValue = v.value || 0;
          code += `    dw ${vAsmName}\n`;
          code += `    db ${vValue}\n`;
        });
      } else {
        code += `    db 0    ; No assignments\n`;
      }
      break;

    default:
      code += `    ; No additional data\n`;
      break;
  }

  code += `\n`;

  // Generate connection table
  code += `${connLabel}:
`;

  const connections = gameFlow.connections?.filter((c: any) =>
    (c.from?.nodeId || c.from) === node.id
  ) || [];

  if (node.type === 'IfThenElse') {
    // THEN/ELSE connections
    const thenConn = connections.find((c: any) => c.from?.sourceId === 'then' || !c.from?.sourceId);
    const elseConn = connections.find((c: any) => c.from?.sourceId === 'else');

    code += `    db CONNECTION_THEN\n`;
    code += `    dw ${thenConn ? `gameflow_node_${sanitizeId(thenConn.to?.nodeId || thenConn.to)}` : '0'}\n`;
    code += `    db CONNECTION_ELSE\n`;
    code += `    dw ${elseConn ? `gameflow_node_${sanitizeId(elseConn.to?.nodeId || elseConn.to)}` : '0'}\n`;
  } else if (node.type === 'SubMenu') {
    // Option connections
    node.options?.forEach((option: any, idx: number) => {
      const optConn = connections.find((c: any) => c.from?.sourceId === option.id);
      code += `    db CONNECTION_OPTION_${idx}\n`;
      code += `    dw ${optConn ? `gameflow_node_${sanitizeId(optConn.to?.nodeId || optConn.to)}` : '0'}\n`;
    });
  } else {
    // Single default connection
    const defaultConn = connections[0];
    code += `    db CONNECTION_DEFAULT\n`;
    code += `    dw ${defaultConn ? `gameflow_node_${sanitizeId(defaultConn.to?.nodeId || defaultConn.to)}` : '0'}\n`;
  }

  code += `    db CONNECTION_END\n\n`;

  return code;
}

/**
 * Generate default GameFlow when none exists
 */
function generateDefaultGameFlow(analysis: ProjectAnalysis): string {
  return `; ==================================================================
; DEFAULT GAMEFLOW (No GameFlow defined in project)
; ==================================================================

gameflow_init:
    ret

gameflow_start:
    ; Load first available screen/world
${analysis.screenMaps && analysis.screenMaps.length > 0 ?
      `    call ${getScreenLoadRoutineName(analysis.screenMaps[0])}` :
      `    ; No screens available`}
    ret

gameflow_world_game_loop:
    call update_all_entities
    call execute_all_state_machines
    call update_sprites_to_vram
    call wait_vblank
    jp gameflow_world_game_loop

gameflow_exit_requested:    db 0

; ==================================================================
; END OF DEFAULT GAMEFLOW
; ==================================================================
`;
}
