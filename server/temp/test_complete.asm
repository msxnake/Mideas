; ==================================================================
; TEST ROM - Start Node Initialization
; Demonstrates new Start node functionality
; ==================================================================

; ==================================================================
; HEADER (Konami ROM)
; ==================================================================

    ORG #4000

    ; ROM header
    db "AB"                     ; Cartridge signature
    dw init_rom                 ; Init address
    dw 0                        ; Statement handler (unused)
    dw 0                        ; Device handler (unused)
    dw 0                        ; Text handler (unused)
    ds #4010-$, #FF             ; Fill to #4010

; ==================================================================
; BIOS ADDRESSES
; ==================================================================

CHGMOD  EQU #005F               ; Change screen mode
WRTVDP  EQU #0047               ; Write to VDP register
LDIRVM  EQU #005C               ; Block write to VRAM
WRTVRM  EQU #004D               ; Write byte to VRAM
GTTRIG  EQU #00D8               ; Get trigger button status
GTSTCK  EQU #00D5               ; Get joystick status

; VDP Registers
RG0SAV  EQU #F3DF
RG1SAV  EQU #F3E0

; ==================================================================
; CONSTANTS
; ==================================================================

FLOW_STATE_GAME EQU 1

; ==================================================================
; MAIN INITIALIZATION
; ==================================================================

init_rom:
    ; Disable interrupts during init
    di

    ; Initialize screen mode (Screen 2)
    ld a, 2
    call CHGMOD

    ; Initialize GameFlow
    call gameflow_init

    ; Enable interrupts
    ei

    ; Start GameFlow execution
    call gameflow_start

    ; End of execution - infinite loop
.main_end_loop:
    halt
    jr .main_end_loop

; ==================================================================
; GAMEFLOW EXECUTION ENGINE
; ==================================================================

gameflow_init:
    xor a
    ld (gameflow_exit_requested), a
    ld (current_flow_state), a
    ret

gameflow_start:
    ld hl, gameflow_node_start_001
    jp gameflow_execute_node

gameflow_execute_node:
    ; Read node type
    ld a, (hl)
    inc hl

    ; Save data pointer and connection table pointer
    ld e, (hl)
    inc hl
    ld d, (hl)      ; DE = data pointer
    inc hl
    ld c, (hl)
    inc hl
    ld b, (hl)      ; BC = connection table pointer

    ; Dispatch based on node type
    cp 0            ; NODE_TYPE_START
    jp z, gameflow_handle_start
    cp 1            ; NODE_TYPE_END
    jp z, gameflow_handle_end

    ; Unknown node type
    ret

; ==================================================================
; NODE HANDLERS
; ==================================================================

gameflow_handle_start:
    ; Start node - Initialize game state and systems
    ; DE = node data pointer
    ; BC = connection table

    push bc         ; Save connection table

    ; Execute initialization routine
    ; DE points to initialization routine address
    ex de, hl
    ld e, (hl)
    inc hl
    ld d, (hl)      ; DE = initialization routine address

    ; Call initialization routine (if not null)
    ld a, d
    or e
    jr z, .skip_init

    ; Call the initialization routine
    push de
    ex de, hl
    ld de, .after_init
    push de
    jp (hl)         ; Indirect call, returns to .after_init

.after_init:
    pop de

.skip_init:
    ; Display success message on screen
    call show_init_complete_message

    ; Continue to next node
    pop bc
    call gameflow_get_default_connection
    ld a, h
    or l
    ret z           ; No connection
    jp gameflow_execute_node

gameflow_handle_end:
    ; End node - show end message and halt
    call show_end_message

.end_loop:
    halt
    jr .end_loop

; ==================================================================
; CONNECTION UTILITIES
; ==================================================================

gameflow_get_default_connection:
    ; Input: BC = connection table pointer
    ; Output: HL = next node address
    ld h, b
    ld l, c
    ld a, (hl)
    cp 255          ; CONNECTION_END
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

    ; Clear sprite attribute table (#1B00-#1B7F)
    ld hl, #1B00
    ld b, 32            ; 32 sprites
    ld a, #D1           ; Y=209 (off-screen)

.clear_loop:
    ld c, a
    call WRTVRM         ; Write Y position
    inc hl
    xor a
    ld c, a
    call WRTVRM         ; Write X position
    inc hl
    call WRTVRM         ; Write pattern
    inc hl
    call WRTVRM         ; Write color
    inc hl
    djnz .clear_loop

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
; DISPLAY FUNCTIONS
; ==================================================================

show_init_complete_message:
    ; Display "INIT OK" message at center of screen
    ; Using direct VRAM write for simplicity
    push af
    push bc
    push de
    push hl

    ; Calculate center position (row 10, col 12)
    ; VRAM address = #1800 + (row * 32) + col
    ld hl, #1800 + (10 * 32) + 12

    ; Write "INIT OK!"
    ld a, 'I'
    ld c, a
    call WRTVRM
    inc hl
    ld a, 'N'
    ld c, a
    call WRTVRM
    inc hl
    ld a, 'I'
    ld c, a
    call WRTVRM
    inc hl
    ld a, 'T'
    ld c, a
    call WRTVRM
    inc hl
    ld a, ' '
    ld c, a
    call WRTVRM
    inc hl
    ld a, 'O'
    ld c, a
    call WRTVRM
    inc hl
    ld a, 'K'
    ld c, a
    call WRTVRM
    inc hl
    ld a, '!'
    ld c, a
    call WRTVRM

    ; Display variable values on next line
    ld hl, #1800 + (12 * 32) + 10
    ld a, 'S'
    ld c, a
    call WRTVRM
    inc hl
    ld a, 'C'
    ld c, a
    call WRTVRM
    inc hl
    ld a, 'O'
    ld c, a
    call WRTVRM
    inc hl
    ld a, 'R'
    ld c, a
    call WRTVRM
    inc hl
    ld a, 'E'
    ld c, a
    call WRTVRM
    inc hl
    ld a, '='
    ld c, a
    call WRTVRM
    inc hl
    ld a, (global_var_score)
    add a, '0'
    ld c, a
    call WRTVRM

    ; Wait a bit
    ld b, 60
.wait:
    halt
    djnz .wait

    pop hl
    pop de
    pop bc
    pop af
    ret

show_end_message:
    push af
    push bc
    push de
    push hl

    ld hl, #1800 + (10 * 32) + 10
    ld a, 'T'
    ld c, a
    call WRTVRM
    inc hl
    ld a, 'E'
    ld c, a
    call WRTVRM
    inc hl
    ld a, 'S'
    ld c, a
    call WRTVRM
    inc hl
    ld a, 'T'
    ld c, a
    call WRTVRM
    inc hl
    ld a, ' '
    ld c, a
    call WRTVRM
    inc hl
    ld a, 'D'
    ld c, a
    call WRTVRM
    inc hl
    ld a, 'O'
    ld c, a
    call WRTVRM
    inc hl
    ld a, 'N'
    ld c, a
    call WRTVRM
    inc hl
    ld a, 'E'
    ld c, a
    call WRTVRM
    inc hl
    ld a, '!'
    ld c, a
    call WRTVRM

    pop hl
    pop de
    pop bc
    pop af
    ret

; ==================================================================
; NODE DATA STRUCTURES
; ==================================================================

gameflow_node_start_001:
    db 0                        ; NODE_TYPE_START
    dw gameflow_node_start_001_data
    dw gameflow_node_start_001_conn

gameflow_node_start_001_data:
    dw gameflow_node_start_001_init

gameflow_node_start_001_conn:
    db 0                        ; CONNECTION_DEFAULT
    dw gameflow_node_end_001
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

    ; Initial delay (30 frames = 0.5 seconds)
    ld b, 30
.delay_loop:
    halt
    djnz .delay_loop

    ret

gameflow_node_end_001:
    db 1                        ; NODE_TYPE_END
    dw 0
    dw 0

; ==================================================================
; VARIABLES
; ==================================================================

gameflow_exit_requested:    db 0
current_flow_state:         db 0

; Global game variables
global_var_score:           db 0    ; Player score
global_var_lives:           db 0    ; Player lives

; ==================================================================
; END OF ROM
; ==================================================================
