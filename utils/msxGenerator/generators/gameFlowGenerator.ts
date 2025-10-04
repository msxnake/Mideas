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
    jp game_loop
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
