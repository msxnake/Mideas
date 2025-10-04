/**
 * @fileoverview Header Generator - ROM header and initialization
 * Generates header.asm with Konami ROM header and GameFlow-based initialization
 */

import { ProjectAnalysis } from '../../asmTemplateGenerator';

/**
 * Convert routine name to lowercase (for labels, CALL, JP, JR targets)
 */
function toRoutineLabel(name: string): string {
  return name.toLowerCase();
}

/**
 * Generate initialization code for a specific GameFlow node
 * This determines what happens after INIT_ROM based on GameFlow structure
 *
 * @param node - GameFlow node to generate initialization for
 * @param analysis - Project analysis with assets and configuration
 * @returns ASM code string for node initialization
 */
export function generateInitCodeForNode(
  node: any | undefined,
  analysis: ProjectAnalysis
): string {
  if (!node) {
    return `
    ; No connected node - fallback to generic main program
    jp main_program`;
  }

  switch (node.type) {
    case 'WorldLink':
      const worldAssetId = node.worldAssetId;
      const worldMap = analysis.screenMaps?.find(s => s.id === worldAssetId);
      return `
    ; GameFlow: Start → WorldLink (${worldMap?.name || 'World'})
    ; Initialize game world directly from GameFlow
    call init_sprites
    call init_components
    call init_entities
    call ${toRoutineLabel('load_world_' + worldAssetId)}
    jp game_loop  ; Jump to main game loop`;

    case 'SubMenu':
      const menuNode = node;
      return `
    ; GameFlow: Start → SubMenu ("${menuNode.title || 'Menu'}")
    ; Show main menu from GameFlow
    call init_font_system
    call ${toRoutineLabel('show_menu_' + menuNode.id)}
    jp menu_loop  ; Jump to menu loop`;

    case 'Text':
      const textNode = node;
      return `
    ; GameFlow: Start → Text ("${textNode.title || 'Text'}")
    ; Show intro text from GameFlow
    call init_font_system
    call ${toRoutineLabel('show_text_' + textNode.id)}
    jp main_program`;

    case 'Transition':
      return `
    ; GameFlow: Start → Transition (${node.effect || 'default'})
    ; Show transition effect from GameFlow
    call init_sprites
    call ${toRoutineLabel('transition_effect_' + node.id)}
    jp main_program`;

    case 'Group':
      return `
    ; GameFlow: Start → Group (nested GameFlow)
    ; Load nested GameFlow: ${node.gameFlowAssetId || 'Unknown'}
    call ${toRoutineLabel('init_gameflow_' + (node.gameFlowAssetId || 'default'))}
    jp main_program`;

    default:
      return `
    ; GameFlow: Start → ${node.type} (not yet supported in ASM generator)
    ; Fallback to generic main program
    jp main_program`;
  }
}

/**
 * Generate ROM header with "AB" signature (header.asm)
 * NOW WITH GAMEFLOW INTEGRATION - generates initialization based on GameFlow Main
 *
 * @param projectName - Name of the project
 * @param analysis - Project analysis with GameFlow data
 * @returns ASM code string with ROM header and initialization
 */
export function generateHeaderFile(projectName: string, analysis?: ProjectAnalysis): string {
  // Check if we have GameFlow data to generate from
  let gameFlowComment = '';
  let initCode = `
    ; Jump to main program
    jp main_program`;

  if (analysis?.gameFlow) {
    const gameFlow = analysis.gameFlow;
    gameFlowComment = `\n; GameFlow Integration: Using "${gameFlow.name}" as initialization flow`;

    // Find Start node
    const startNode = gameFlow.nodes.find(n => n.type === 'Start');

    if (startNode) {
      // Find first connection from Start node
      const firstConnection = gameFlow.connections.find(
        c => (c.from as any)?.nodeId === startNode.id || (typeof c.from === 'string' && c.from === startNode.id)
      );

      if (firstConnection) {
        // Find the target node
        const targetNodeId = firstConnection.to?.nodeId || firstConnection.to;
        const firstNode = gameFlow.nodes.find(n => n.id === targetNodeId);

        if (firstNode) {
          gameFlowComment += `\n; Flow: Start → ${firstNode.type} (${(firstNode as any).title || (firstNode as any).name || firstNode.id})`;
          initCode = generateInitCodeForNode(firstNode, analysis);
        }
      }
    }
  }

  return `; ==================================================================
; MSX CARTRIDGE ROM HEADER
; File: header.asm
; Description: Standard MSX cartridge initialization${gameFlowComment}
; ==================================================================

    org #4000           ; MSX cartridge start address

; ==================================================================
; CARTRIDGE HEADER
; ==================================================================
    db "AB"             ; MSX cartridge signature
    dw init_rom         ; Initialization address
    dw 0                ; Statement handler (not used)
    dw 0                ; Device handler (not used)
    dw 0                ; Text handler (not used)
    dw 0                ; Reserved
    dw 0                ; Reserved
    dw 0                ; Reserved

; ==================================================================
; ROM INITIALIZATION ENTRY POINT
; ==================================================================
init_rom:
    ; Initialize stack
    ld sp, #F380

    di                           ; Disable interrupts during init
    ld a,#C9
    ld (HKEY),a
    ei

    ; Set up memory mapper (if any)
    ; This is a placeholder for future mapper initialization
    ; call setup_rom_ram_slots

    xor a
    ld (CLIKSW),a ; Click switch off
    ; Change background colors:
    ld (BAKCLR),a
    ld (BDRCLR),a
    call CHGCLR

    ld a,2      ; Change screen mode
    call CHGMOD

    ;; 16x16 sprites:
    ld bc,#e201  ;; write #e2 in VDP register #01 (activate sprites, generate interrupts, 16x16 sprites with no magnification)
    call WRTVDP

    ; init fill screen
    call fillscreen

     call check_if_60hz
    ld (isComputer50HzOr60Hz),a

    ;init random seed
    call random_seed_update

${initCode}

; ==================================================================
; END OF HEADER
; ==================================================================
`;
}
