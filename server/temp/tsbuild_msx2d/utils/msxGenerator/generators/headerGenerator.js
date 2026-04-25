"use strict";
/**
 * @fileoverview Header Generator - ROM header and initialization
 * Generates header.asm with basic MSX ROM initialization
 *
 * ARCHITECTURE: GameFlow-centric initialization
 * The ROM init now calls gameflow_init and gameflow_start,
 * making GameFlow the sole orchestrator of execution.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateHeaderFile = generateHeaderFile;
/**
 * Generate task registration code for interrupt system
 */
function generateTaskRegistration(analysis, executionPlan) {
    if (!analysis)
        return '';
    let code = '';
    const hasAudioTick = !!((analysis.tracks && analysis.tracks.length > 0) || (analysis.stateMachines && analysis.stateMachines.length > 0));
    const usesInterruptTaskManager = executionPlan?.mode === 'interruptTaskManager';
    if (hasAudioTick) {
        code += `    ; Initialize PSG/audio once at boot. WorldLink must not reset music after a Music node.\n`;
        code += `    call init_sound_system\n\n`;
    }
    if (usesInterruptTaskManager) {
        code += `    ; Register boot-time IRQ tasks defined by the engine execution plan.\n`;
        code += `    call init_default_tasks_from_plan\n\n`;
    }
    else {
        code += `    ; GameLoop+HALT mode: keep gameplay/audio ticks in the main GameFlow loops.\n\n`;
    }
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
function generateHeaderFile(projectName, analysis, executionPlan, romMode = 'simple32k') {
    // Generate GameFlow comment for documentation
    let gameFlowComment = '';
    if (analysis?.gameFlow) {
        const gameFlow = analysis.gameFlow;
        gameFlowComment = `\n; GameFlow Integration: Using "${gameFlow.name}" as execution orchestrator`;
        // Find Start node
        const startNode = gameFlow.nodes.find(n => n.type === 'Start');
        if (startNode) {
            // Find first connection from Start node
            const firstConnection = gameFlow.connections.find(c => c.from?.nodeId === startNode.id || (typeof c.from === 'string' && c.from === startNode.id));
            if (firstConnection) {
                // Find the target node
                const targetNodeId = firstConnection.to?.nodeId || firstConnection.to;
                const firstNode = gameFlow.nodes.find(n => n.id === targetNodeId);
                if (firstNode) {
                    gameFlowComment += `\n; Flow: Start → ${firstNode.type} (${firstNode.title || firstNode.name || firstNode.id})`;
                }
            }
        }
    }
    const shouldShowPresentationAtBoot = !!(analysis?.presentationScreen?.enabled &&
        analysis.presentationScreen.runtime?.showAtBoot &&
        Array.isArray(analysis.presentationScreen.data?.nameTable) &&
        analysis.presentationScreen.data.nameTable.length === (32 * 24));
    const presentationBootAsm = shouldShowPresentationAtBoot
        ? `    ; Optional Presentation Screen configured in project data
${romMode === 'megarom'
            ? `    call show_presentation_screen_far`
            : `    call show_presentation_screen`}

`
        : '';
    const initialPageSetupAsm = romMode === 'megarom'
        ? `    ; MegaROM cold boot: do not run the linear 32K SETPAGES32K slot remapper.
    ; The mapper registers below define the visible 8KB banks explicitly.
    jp restart_rom_continue`
        : `    ; Cold boot path: ensure cartridge page 2 (8000h-BFFFh) is mapped to the cartridge slot.
    ; Required for both simple32k and plain48k: the BIOS only maps page 1 when it finds "AB",
    ; page 2 must be explicitly mapped via SETPAGES32K (reads page-1 slot, applies it to page 2).
    call SETPAGES32K
    jp restart_rom_continue`;
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

${initialPageSetupAsm}

; Restart entry point for GameFlow Restart node.
; Reinitializes runtime safely without remapping cartridge pages.
restart_rom:
    di
    im 1
    ld sp, #F380

restart_rom_continue:
    ; Capture the normal slot state for optional linear 48K page-0 helpers.
    call init_page0_runtime_state

    ; Initialize mapper runtime state (safe no-op in simple32k mode)
    call mapper_runtime_init
${romMode === 'megarom' ? `
    ; Initialize cached resource descriptor mirrors used by banked resources.
    call resource_manager_init
    ; MEGAROM: Static bank setup — map physical banks 1-3 to their pages.
    ; Konami4 register layout: write to 6000h→6000-7FFFh, 8000h→8000-9FFFh, A000h→A000-BFFFh
    ; p1 writes to reg #6000, p2 to #8000, p3 to #A000.
    ; Bank 0 (4000h-5FFFh): fixed (Konami4 cannot change this page)
    ; Bank 1 (6000h-7FFFh): set via p1 (reg #6000)
    ; Bank 2 (8000h-9FFFh): set via p2 (reg #8000)
    ; Bank 3 (A000h-BFFFh): set via p3 (reg #A000)
    ld a, 1
    call mapper_set_bank_p1
    ld a, 2
    call mapper_set_bank_p2
    ld a, 3
    call mapper_set_bank_p3
` : ''}
    ; Reset some interrupts to ensure compatibility
    ; with MSX computers with disk controllers
    ld a, #C9
    ld (HKEY), a
    ; NOTE: TIMI (H.TIMI) is now managed by init_interrupt_system

    ; Silence click, init keyboard, clear config
    xor a
    ld (CLIKSW), a
    ld (deterministic), a
    
    ; Change background colors
    ld (BAKCLR), a
    ld (BDRCLR), a
    call CHGCLR

    ; Disable screen while switching modes / initializing VDP
    call DISSCR

    ; Change screen mode to SCREEN 2
    ld a, 2
    call CHGMOD

    ; Configure 16x16 sprites
    ; VDP Register #01: activate sprites, generate interrupts, 16x16 sprites
    ld bc, #E201
    call FAST_WRTVDP
    ; CRITICAL: Update BIOS system variable RG1SAV to match
    ; Without this, DISSCR/ENASCR will overwrite VDP R1 losing 16x16 sprite config
    ld a, #E2
    ld (#F3E0), a       ; RG1SAV = #E2 (preserves 16x16 sprite bit)

    ; Detect 50Hz/60Hz
    call CheckIf60Hz
    ld (isComputer50HzOr60Hz), a ; 0: 50Hz, 1: 60Hz

    ; ====================================================
    ; INTERRUPT SYSTEM INITIALIZATION (Konami-style)
    ; ====================================================
    ; Initialize interrupt task system (hooks H.TIMI)
    call init_interrupt_system
    di

    ; Register default tasks based on project needs
    ${generateTaskRegistration(analysis, executionPlan)}
    ei

${analysis.hasGameFlow ? `    ; ====================================================
    ; GAMEFLOW INITIALIZATION
    ; ====================================================
${presentationBootAsm}    ; Initialize GameFlow system
    call gameflow_init

    ; Start execution from GameFlow Start node
    ; GameFlow is now the sole orchestrator
    call ENASCR
    jp gameflow_start` : `    ; ====================================================
    ; SIMPLE GAME LOOP (No GameFlow)
    ; ====================================================
    ; Initialize game entities
${presentationBootAsm}    call init_entities
    call load_game_screen
    call rebuild_used_entity_list
    call ENASCR
    jp main_loop`}

main_loop:
    halt
    call update_all_entities
    jp main_loop

; ==================================================================
; AUXILIARY FUNCTIONS
; ==================================================================

; Helper: Get expanded slot value for ENASLT/CALSLT usage
; Input:  A = slot number (0-3) in lower bits
; Output: A = expanded slot value if needed
GETSLOT:
    and #03             ; Proteccion, nos aseguramos de que el valor esta en 0-3
    ld  c,a             ; c = slot de la pagina
    ld  b,0             ; bc = slot de la pagina
    ld  hl,#fcc1        ; Tabla de slots expandidos
    add hl,bc           ; hl -> variable que indica si este slot esta expandido
    ld  a,(hl)          ; Tomamos el valor
    and #80             ; Si el bit mas alto es cero...
    jr  z,GETSLOT_EXIT  ; ...nos vamos a @@EXIT
    ; --- El slot esta expandido ---
    or  c               ; Slot basico en el lugar adecuado
    ld  c,a             ; Guardamos el valor en c
    inc hl              ; Incrementamos hl una...
    inc hl              ; ...dos...
    inc hl              ; ...tres...
    inc hl              ; ...cuatro veces
    ld  a,(hl)          ; a = valor del registro de subslot del slot donde estamos
    and #0C             ; Nos quedamos con el valor donde esta nuestro cartucho
GETSLOT_EXIT:
    or  c
    ret

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
