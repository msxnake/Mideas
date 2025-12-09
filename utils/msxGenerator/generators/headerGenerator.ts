/**
 * @fileoverview Header Generator - ROM header and initialization
 * Generates header.asm with basic MSX ROM initialization
 */

import { ProjectAnalysis } from '../../asmTemplateGenerator';

/**
 * Generate ROM header with "AB" signature (header.asm)
 * Generates basic MSX ROM initialization, then jumps to main_program
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

    ; NOTE: Background/border colors are now set by each load_screen_X function
    ; This allows each screen to have its own colors via ScreenMap.backgroundColor/borderColor

    ; Enable Inigrp bios
    call INIGRP
    
    ;; 16x16 sprites:
    ld bc,#e201  ;; write #e2 in VDP register #01 (activate sprites, generate interrupts, 16x16 sprites with no magnification)
    call WRTVDP

    ;call check_if_60hz
    ;ld (isComputer50HzOr60Hz),a

    ;init random seed
    ;call random_seed_update

    jp main_program

; ==================================================================
; END OF HEADER
; ==================================================================
`;
}
