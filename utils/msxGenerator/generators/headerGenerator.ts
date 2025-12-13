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
 * Generate task registration code for interrupt system
 */
function generateTaskRegistration(analysis?: ProjectAnalysis): string {
  if (!analysis) return '';

  let code = '';

  // Task 0: Input (ALWAYS registered)
  code += `    ld a, 0\n`;
  code += `    ld hl, task_update_input\n`;
  code += `    call enable_task\n\n`;

  // Task 1: Physics (if has entities - they likely need movement)
  if (analysis.hasEntities) {
    code += `    ld a, 1\n`;
    code += `    ld hl, task_update_physics\n`;
    code += `    call enable_task\n\n`;
  }

  // Task 2: Collision (if has collisions)
  if (analysis.hasCollisions) {
    code += `    ld a, 2\n`;
    code += `    ld hl, task_update_collision\n`;
    code += `    call enable_task\n\n`;
  }

  // Task 3: Sprites - NOT auto-registered (heavy task)
  // User should enable manually when needed

  return code;
}

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
    ; NOTE: TIMI (H.TIMI) is now managed by init_interrupt_system
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
    ; INTERRUPT SYSTEM INITIALIZATION (Konami-style)
    ; ====================================================
    ; Initialize interrupt task system (hooks H.TIMI)
    call init_interrupt_system

    ; Register default tasks based on project needs
    ${generateTaskRegistration(analysis)}

    ; ====================================================
    ; GAMEFLOW INITIALIZATION
    ; ====================================================
    ; Initialize GameFlow system
    call gameflow_init
    
    ; Start execution from GameFlow Start node
    ; GameFlow is now the sole orchestrator
    jp gameflow_start

; ==================================================================
; AUXILIARY FUNCTIONS
; ==================================================================

; From: http://www.z80st.es/downloads/code/
; SETPAGES32K:  BIOS-ROM-YY-ZZ   -> BIOS-ROM-ROM-ZZ (SITUA PAGINA 2)
SETPAGES32K:    ; --- Posiciona las paginas de un megarom o un 32K ---
    ld  a, #C9              ; Codigo de RET
    ld  (SETPAGES32K_NOPRET), a   ; Modificamos la siguiente instruccion si estamos en RAM
SETPAGES32K_NOPRET:
    nop                     ; No hacemos nada si no estamos en RAM
    ; --- Si llegamos aqui no estamos en RAM, hay que posicionar la pagina ---
    call RSLREG             ; Leemos el contenido del registro de seleccion de slots
    rrca                    ; Rotamos a la derecha...
    rrca                    ; ...dos veces
    call GETSLOT            ; Obtenemos el slot de la pagina 1 ($4000-$BFFF)
    ld (ROM_slot), a        ; Save slot for later use
    ld  h, #80              ; Seleccionamos pagina 2 ($8000-$BFFF)
    jp  ENASLT              ; Posicionamos la pagina 2 y volvemos

; Source: https://www.msx.org/forum/development/msx-development/how-0?page=0
; Returns 1 in a and clears z flag if vdp is 60Hz
CheckIf60Hz:
    di
    in      a, (#99)
    nop
    nop
    nop
vdpSync:
    in      a, (#99)
    and     #80
    jr      z, vdpSync

    ld      hl, #900
vdpLoop:
    dec     hl
    ld      a, h
    or      l
    jr      nz, vdpLoop

    in      a, (#99)
    rlca
    and     1
    ei
    ret

; ==================================================================
; END OF HEADER
; ==================================================================
`;
}
