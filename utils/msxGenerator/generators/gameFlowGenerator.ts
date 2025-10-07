/**
 * @fileoverview Game Flow Generator - GameFlow state machine
 * Generates GameFlow state machine from GameFlow graph for ASM
 */

import { ProjectAnalysis } from '../../asmTemplateGenerator';

/**
 * Convert routine name to lowercase (for labels, CALL, JP, JR targets)
 */
function toRoutineLabel(name: string): string {
  return name.toLowerCase();
}

/**
 * Generate GameFlow State Machine from GameFlow Graph
 * Creates node handlers and state transitions matching Play mode execution
 *
 * @param gameFlow - GameFlow graph with nodes and connections
 * @param analysis - Project analysis with assets and configuration
 * @returns ASM code string with GameFlow state machine
 */
export function generateGameFlowStateMachine(gameFlow: any, analysis: ProjectAnalysis): string {
  let code = `
; GameFlow: ${gameFlow.name || 'Unknown'}
; Nodes: ${gameFlow.nodes?.length || 0}
; Connections: ${gameFlow.connections?.length || 0}

`;

  // Generate handler routines for each node
  if (gameFlow.nodes && gameFlow.nodes.length > 0) {
    gameFlow.nodes.forEach((node: any) => {
      const nodeLabel = `gameflow_node_${node.id.replace(/[^a-zA-Z0-9]/g, '_')}`;

      switch (node.type) {
        case 'Start':
          // Find connection from Start node
          const startConnection = gameFlow.connections?.find(
            (c: any) => c.from?.nodeId === node.id || c.from === node.id
          );

          if (startConnection) {
            const nextNodeId = startConnection.to?.nodeId || startConnection.to;
            const nextNodeLabel = `gameflow_node_${nextNodeId.replace(/[^a-zA-Z0-9]/g, '_')}`;
            code += `
${nodeLabel}:
    ; Start Node - transition to first connected node
    ld hl, ${nextNodeLabel}
    jp execute_gameflow_node
`;
          } else {
            code += `
${nodeLabel}:
    ; Start Node - no connections, fallback to main program
    ret
`;
          }
          break;

        case 'WorldLink':
          const worldAssetId = node.worldAssetId;
          code += `
${nodeLabel}:
    ; WorldLink Node - Load world: ${worldAssetId || 'Unknown'}
    call init_sprites
    call init_components
    call init_entities
    call ${toRoutineLabel('load_world_' + (worldAssetId || 'default'))}
    ; CRITICAL: Set game flow state and update sprites to VRAM
    ld a, FLOW_STATE_GAME
    ld (current_flow_state), a
    call update_sprites_to_vram   ; Copy sprite attributes to VRAM

    jp main_loop
`;
          break;

        case 'SubMenu':
          code += `
${nodeLabel}:
    ; SubMenu Node - "${node.title || 'Menu'}"
    call init_font_system
    call ${toRoutineLabel('show_menu_' + node.id)}
    ; Wait for menu selection and transition to next node
    ret
`;
          break;

        case 'Text':
          code += `
${nodeLabel}:
    ; Text Node - "${node.title || 'Text'}"
    call init_font_system
    call ${toRoutineLabel('show_text_' + node.id)}
    ; Wait for user input, then transition to next node
    ret
`;
          break;

        case 'Transition':
          code += `
${nodeLabel}:
    ; Transition Node - Effect: ${node.effect || 'default'}
    call ${toRoutineLabel('transition_effect_' + node.id)}
    ret
`;
          break;

        case 'Group':
          code += `
${nodeLabel}:
    ; Group Node - Nested GameFlow
    ; Load GameFlow: ${node.gameFlowAssetId || 'Unknown'}
    call ${toRoutineLabel('init_gameflow_' + (node.gameFlowAssetId || 'default'))}
    ret
`;
          break;

        case 'End':
          code += `
${nodeLabel}:
    ; End Node - ${node.endType || 'Game Over'}
    call show_end_screen
    ; Halt or return to main menu
    ret
`;
          break;

        case 'Restart':
          code += `
${nodeLabel}:
    ; Restart Node
    jp init_rom  ; Restart entire game
`;
          break;

        case 'Waypoint':
          // Waypoint is just a routing node
          const waypointConnection = gameFlow.connections?.find(
            (c: any) => c.from?.nodeId === node.id || c.from === node.id
          );

          if (waypointConnection) {
            const nextNodeId = waypointConnection.to?.nodeId || waypointConnection.to;
            const nextNodeLabel = `gameflow_node_${nextNodeId.replace(/[^a-zA-Z0-9]/g, '_')}`;
            code += `
${nodeLabel}:
    ; Waypoint - route to next node
    ld hl, ${nextNodeLabel}
    jp execute_gameflow_node
`;
          }
          break;

        case 'IfThenElse':
          // Find THEN and ELSE connections (using sourceId to differentiate)
          const thenConnection = gameFlow.connections?.find(
            (c: any) => (c.from?.nodeId === node.id || c.from === node.id) &&
                       (c.from?.sourceId === 'then' || !c.from?.sourceId) // Default to THEN if no sourceId
          );
          const elseConnection = gameFlow.connections?.find(
            (c: any) => (c.from?.nodeId === node.id || c.from === node.id) &&
                       c.from?.sourceId === 'else'
          );

          const thenNodeId = thenConnection ? (thenConnection.to?.nodeId || thenConnection.to) : null;
          const elseNodeId = elseConnection ? (elseConnection.to?.nodeId || elseConnection.to) : null;

          const thenLabel = thenNodeId ? `gameflow_node_${thenNodeId.replace(/[^a-zA-Z0-9]/g, '_')}` : null;
          const elseLabel = elseNodeId ? `gameflow_node_${elseNodeId.replace(/[^a-zA-Z0-9]/g, '_')}` : null;

          // Generate variable name mapping (convert "Goal" to "global_var_goal")
          const variableName = `global_var_${node.variableName?.toLowerCase() || 'goal'}`;

          // Generate compare value mapping (convert "Completed" to "GOAL_COMPLETED")
          let compareConstant = '';
          const compareValueUpper = (node.compareValue || 'Completed').toUpperCase();
          const varNameUpper = (node.variableName || 'Goal').toUpperCase();
          compareConstant = `${varNameUpper}_${compareValueUpper}`;

          // Generate comparison operator (default to ==)
          const operator = node.operator || '==';

          code += `
${nodeLabel}:
    ; IfThenElse Node - Compare ${node.variableName || 'Goal'} ${operator} ${node.compareValue || 'Completed'}
    ld a, (${variableName})     ; Load global variable ${node.variableName || 'Goal'}
    cp ${compareConstant}        ; Compare with ${node.compareValue || 'Completed'}
`;

          // Generate conditional jump based on operator
          if (operator === '==') {
            if (thenLabel) {
              code += `    jp z, ${thenLabel}       ; If equal, jump to THEN branch\n`;
            }
            if (elseLabel) {
              code += `    jp ${elseLabel}          ; Otherwise, jump to ELSE branch\n`;
            } else {
              code += `    ret                      ; No ELSE branch, return\n`;
            }
          } else if (operator === '!=') {
            if (thenLabel) {
              code += `    jp nz, ${thenLabel}      ; If not equal, jump to THEN branch\n`;
            }
            if (elseLabel) {
              code += `    jp ${elseLabel}          ; Otherwise, jump to ELSE branch\n`;
            } else {
              code += `    ret                      ; No ELSE branch, return\n`;
            }
          } else if (operator === '>') {
            // For >, use carry flag (CP sets carry if A < operand)
            if (elseLabel) {
              code += `    jp c, ${elseLabel}       ; If A < value (carry set), ELSE\n`;
            }
            if (thenLabel) {
              code += `    jp z, ${elseLabel || 'if_then_else_skip'}       ; If A == value (zero set), ELSE\n`;
              code += `    jp ${thenLabel}          ; Otherwise A > value, THEN\n`;
            }
          } else if (operator === '<') {
            if (thenLabel) {
              code += `    jp c, ${thenLabel}       ; If A < value (carry set), THEN\n`;
            }
            if (elseLabel) {
              code += `    jp ${elseLabel}          ; Otherwise, ELSE\n`;
            }
          } else if (operator === '>=') {
            if (elseLabel) {
              code += `    jp c, ${elseLabel}       ; If A < value (carry set), ELSE\n`;
            }
            if (thenLabel) {
              code += `    jp ${thenLabel}          ; Otherwise A >= value, THEN\n`;
            }
          } else if (operator === '<=') {
            if (thenLabel) {
              code += `    jp z, ${thenLabel}       ; If A == value, THEN\n`;
              code += `    jp c, ${thenLabel}       ; If A < value, THEN\n`;
            }
            if (elseLabel) {
              code += `    jp ${elseLabel}          ; Otherwise A > value, ELSE\n`;
            }
          }

          if (!thenLabel && !elseLabel) {
            code += `    ret                      ; No connections, return\n`;
          }
          code += `if_then_else_skip:\n    ret\n`;
          break;

        default:
          code += `
${nodeLabel}:
    ; ${node.type} Node (not yet implemented)
    ; Node ID: ${node.id}
    ret
`;
      }
    });
  }

  code += `
; End of GameFlow State Machine
`;

  return code;
}
