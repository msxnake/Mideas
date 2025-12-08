; ==================================================================
; MSX CARTRIDGE ROM HEADER
; File: header.asm
; Description: Standard MSX cartridge initialization
; GameFlow Integration: Using "Main" as initialization flow
; Flow: Start → WorldLink (gfn_1764189161182)
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

    ld a,2      ; Change screen mode
    call CHGMOD

    ;; Configure VDP sprite tables
    ld bc,#3705  ; VDP Register #5: Sprite Attribute Table = #1B80 (SPRATR)
    call WRTVDP
    ld bc,#3806  ; VDP Register #6: Sprite Pattern Table = #3800 (SPRPAT)
    call WRTVDP

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
