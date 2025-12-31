; ==================================================================
; GAMEFLOW EXECUTION ENGINE - TEST
; File: test_gameflow.asm
; Description: Testing Start node with initialization
; ==================================================================
;
; GameFlow: Main
; Total Nodes: 2
; Start Node: start_001
; ==================================================================

; ==================================================================
; GAMEFLOW INITIALIZATION
; ==================================================================

gameflow_init:
    xor a
    ld (gameflow_exit_requested), a
    ret

gameflow_start:
    ld hl, gameflow_node_start_001
    jp gameflow_execute_node

; ==================================================================
; CORE EXECUTION ENGINE
; ==================================================================

gameflow_execute_node:
    ld a, (hl)
    inc hl
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld c, (hl)
    inc hl
    ld b, (hl)

    ; Dispatch to Start handler (simplified)
    cp 0  ; NODE_TYPE_START
    jp z, gameflow_handle_start
    ret

; ==================================================================
; NODE HANDLERS
; ==================================================================

gameflow_handle_start:
    ; Start node - Initialize game state and systems
    push bc

    ; Execute initialization routine
    ex de, hl
    ld e, (hl)
    inc hl
    ld d, (hl)

    ; Call initialization routine
    ld a, d
    or e
    jr z, .skip_init

    push de
    ex de, hl
    ld de, .after_init
    push de
    jp (hl)

.after_init:
    pop de

.skip_init:
    ; Continue to next node (End node in this test)
    pop bc
    ret

; ==================================================================
; INITIALIZATION UTILITY FUNCTIONS
; ==================================================================

init_psg_silence:
    push af
    push bc

    ; Silence channel A
    ld a, #08
    out (#A0), a
    ld a, 0
    out (#A1), a

    ; Silence channel B
    ld a, #09
    out (#A0), a
    ld a, 0
    out (#A1), a

    ; Silence channel C
    ld a, #0A
    out (#A0), a
    ld a, 0
    out (#A1), a

    pop bc
    pop af
    ret

clear_sprite_table:
    push af
    push bc
    push de
    push hl

    ld hl, #1B00
    ld bc, 128
    ld a, #D1
.clear_loop:
    push hl
    ld c, a
    call WRTVRM
    pop hl
    inc hl
    dec bc
    ld a, b
    or c
    jr nz, .clear_loop

    pop hl
    pop de
    pop bc
    pop af
    ret

init_all_global_variables:
    ; Initialize global variables
    ld a, 0
    ld (global_var_score), a    ; score = 0
    ld a, 0
    ld (global_var_lives), a    ; lives = 0
    ret

; ==================================================================
; NODE DATA STRUCTURES
; ==================================================================

; Node: Start - Game Initialization
gameflow_node_start_001:
    db 0                        ; NODE_TYPE_START
    dw gameflow_node_start_001_data        ; Data pointer
    dw gameflow_node_start_001_conn        ; Connection table

gameflow_node_start_001_data:
    dw gameflow_node_start_001_init        ; Initialization routine address

gameflow_node_start_001_conn:
    db 0                        ; CONNECTION_DEFAULT
    dw gameflow_node_end_001    ; Next node (End)
    db 255                      ; CONNECTION_END

; ------------------------------------------------------------------
; gameflow_node_start_001_init
; Initialization routine for Start node
; ------------------------------------------------------------------
gameflow_node_start_001_init:
    ; === MSX System Initialization ===
    ; Initialize PSG (silence all channels)
    call init_psg_silence

    ; Clear sprite attribute table
    call clear_sprite_table

    ; === Global Variables Initialization ===
    ld a, 0
    ld (global_var_score), a    ; score = 0
    ld a, 3
    ld (global_var_lives), a    ; lives = 3

    ; Initial delay
    ld b, 30
.delay_loop:
    halt    ; Wait for V-blank
    djnz .delay_loop

    ret

; End node (placeholder)
gameflow_node_end_001:
    db 1                        ; NODE_TYPE_END
    dw 0
    dw 0

; ==================================================================
; GAMEFLOW VARIABLES
; ==================================================================

gameflow_exit_requested:    db 0

; Global game variables
global_var_score:    db 0    ; Player score
global_var_lives:    db 0    ; Player lives

; ==================================================================
; BIOS ROUTINES (placeholders)
; ==================================================================

WRTVRM:
    ret

; ==================================================================
; END OF GAMEFLOW
; ==================================================================
