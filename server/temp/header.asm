; ==================================================================
; MSX CARTRIDGE ROM HEADER
; File: header.asm
; Description: Standard MSX cartridge initialization
; GameFlow Integration: Using "main" as initialization flow
; Flow: Start → WorldLink (gfn_1757846312799)
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


    ; GameFlow: Start → WorldLink (World)
    ; Initialize game world directly from GameFlow
    call init_sprites
    call init_components
    call init_entities
    call load_world_worldmap_1757846280079
    jp game_loop  ; Jump to main game loop

; ==================================================================
; END OF HEADER
; ==================================================================
