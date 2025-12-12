/**
 * @fileoverview Header Generator - ROM header and initialization
 * Generates header.asm with basic MSX ROM initialization
 * 
 * ARCHITECTURE: GameFlow-centric initialization
 * The ROM init now calls gameflow_init and gameflow_start,
 * making GameFlow the sole orchestrator of execution.
 */

import { ProjectAnalysis } from '../../asmTemplateGenerator';

/**
 * Generate ROM header with "AB" signature (header.asm)
 * Generates basic MSX ROM initialization, then jumps to GameFlow
 *
 * @param projectName - Name of the project
 * @param analysis - Project analysis with GameFlow data
 * @returns ASM code string with ROM header and initialization
 */
export function generateHeaderFile(projectName: string, analysis?: ProjectAnalysis): string {
  // Generate GameFlow comment for documentation
  let gameFlowComment = '';

  if (analysis?.gameFlow) {
    const gameFlow = analysis.gameFlow;
    gameFlowComment = `\n; GameFlow Integration: Using "${gameFlow.name}" as execution orchestrator`;

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
    di
    im 1
    
    ; Initialize stack
    ld sp, #F380
    
    ; Reset some interrupts to ensure compatibility
    ; with MSX computers with disk controllers
    ld a, #C9
    ld (HKEY), a
    ld (TIMI), a
    ei

    call SETPAGES32K

    ; Silence click, init keyboard, clear config
    xor a
    ld (CLIKSW), a
    ld (deterministic), a
    
    ; Change background colors
    ld (BAKCLR), a
    ld (BDRCLR), a
    call CHGCLR

    ; Change screen mode to SCREEN 2
    ld a, 2
    call CHGMOD

    ; Configure 16x16 sprites
    ; VDP Register #01: activate sprites, generate interrupts, 16x16 sprites
    ld bc, #E201
    call WRTVDP

    ; Detect 50Hz/60Hz
    call CheckIf60Hz
    ld (isComputer50HzOr60Hz), a ; 0: 50Hz, 1: 60Hz

    ; ====================================================
    ; GAMEFLOW INITIALIZATION
    ; ====================================================
    ; Initialize GameFlow system
    call gameflow_init
    
    ; Start execution from GameFlow Start node
    ; GameFlow is now the sole orchestrator
    jp gameflow_start

; ==================================================================
; END OF HEADER
; ==================================================================
`;
}
