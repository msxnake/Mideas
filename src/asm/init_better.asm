include "constants.asm"
 MAX_PTR: EQU #FFFF ; Placeholder, to be calculated

;-----------------------------------------------
; PAGE 2:

    org #4000   ; Start in the 2nd slot
 StartOfPage2:

;-----------------------------------------------
; MSX ROM Header (Standard compliant)
    db "AB"     ; ROM signature
    dw Execute  ; start address
    dw 00000h   ; STATEMENT (not used in games)
    dw 00000h   ; DEVICE (not used in games)
    dw 00000h   ; TEXT (not used in games)
    dw 00000h   ; BASIC (not used in games)
    dw 00000h   ; Reserved

BLANK_CHAR_PATTERN: ;aprovechamos valores 0
    db 0,0,0,0,0,0,0,0,0,0,0,0
;-----------------------------------------------

ALL_MAP_TILES_PTR:
 incbin "bin/AllPatterns.BIN"

ALL_MAP_TILES_COL:
 incbin "bin/AllColors.BIN"

PAN1_LAYOUT_DATA:
 incbin "bin/MapLayout.bin"

BLANK_CHAR_COLOR:
    DB #11,#11,#11,#11,#11,#11,#11,#11

;-----------------------------------------------
; Game State Variables
;-----------------------------------------------
game_state:         DB 0    ; 0=INIT, 1=PLAYING, 2=LOADING_ZONE, 3=PAUSED
zone_loading_flag:  DB 0    ; 0=normal, 1=loading zone
current_zone:       DB 0    ; Current zone number
old_hook_addr:      DW 0    ; Store original hook address

; Game state constants
STATE_INIT          EQU 0
STATE_PLAYING       EQU 1
STATE_LOADING_ZONE  EQU 2
STATE_PAUSED        EQU 3

;-------------------------------------------------------------------------------
; Main Program Entry Point
; Initializes MSX system and installs game hook
;-------------------------------------------------------------------------------
Execute:
    di
    ; init the stack:
    ld sp,#F380
    ; reset some interrupts to make sure it runs in some MSX computers
    ; with disk controllers installed in some interrupt handlers
    ld a,#C9
    ld (HKEY),a
    ld (TIMI),a
    
    ; Silence, init keyboard, and clear config:
    xor a
    ld (CLIKSW),a
    ld (deterministic),a

    ld a,1
    ld hl,$f3e9
    ld [hl],15
    inc hl
    ld [hl],1
    inc hl
    ld [hl],1

    ; Change background colors:
    ld (BAKCLR),a
    ld (BDRCLR),a
    call CHGCLR

    ld a,2      ; Change screen mode
    call CHGMOD

    ;; 16x16 sprites:
    ld bc,#e201  ;; write #e2 in VDP register #01 (activate sprites, generate interrupts, 16x16 sprites with no magnification)
    call WRTVDP

    ;call CheckIf60Hz
    ld (isComputer50HzOr60Hz),a ; 0: 50Hz, 1: 60Hz

    ; FULL GRAPHICS INITIALIZATION (outside hook)
    call FULL_GRAPHICS_INIT
    
    ; Install game hook for real-time logic
    call INSTALL_GAME_HOOK
    
    ; Set initial game state
    ld a, STATE_PLAYING
    ld (game_state), a
    
    ei  ; Enable interrupts

    ; Main game loop - hook handles most logic
MAIN_LOOP:
    halt                        ; Wait for VBLANK
    
    ; Check if zone loading is needed
    ld a, (zone_loading_flag)
    or a
    call nz, PROCESS_ZONE_CHANGE
    
    jp MAIN_LOOP

;-------------------------------------------------------------------------------
; FULL_GRAPHICS_INIT
; Complete graphics initialization done at startup
;-------------------------------------------------------------------------------
FULL_GRAPHICS_INIT:
    call loadMyScreen
    call redef_spr
    ret

;-------------------------------------------------------------------------------
; Game Hook - Installed at TIMI for VBLANK processing
; Handles real-time game logic during VBLANK
;-------------------------------------------------------------------------------
GAME_HOOK:
    push af
    push bc
    push de
    push hl
    
    ; Check game state
    ld a, (game_state)
    cp STATE_PLAYING
    jr nz, GAME_HOOK_END    ; Skip if not playing
    
    ; Check if zone is loading
    ld a, (zone_loading_flag)
    or a
    jr nz, GAME_HOOK_END    ; Skip if loading zone
    
    ; ===== REAL-TIME GAME LOGIC =====
    call UPDATE_ENTITIES        ; Update game entities
    call READ_INPUT            ; Process player input
    call UPDATE_SPRITES_POS    ; Update sprite positions
    call CHECK_COLLISIONS      ; Collision detection
    call UPDATE_SOUND          ; Sound/music updates
    call CHECK_ZONE_TRIGGERS   ; Check if zone change needed
    
GAME_HOOK_END:
    pop hl
    pop de
    pop bc
    pop af
    
    ; Call original hook if exists
    ld hl, (old_hook_addr)
    ld a, h
    or l
    ret z                   ; No original hook
    jp (hl)                 ; Jump to original hook

;-------------------------------------------------------------------------------
; Hook Management
;-------------------------------------------------------------------------------
INSTALL_GAME_HOOK:
    ; Save current hook address
    ld hl, (TIMI+1)
    ld (old_hook_addr), hl
    
    ; Install our hook
    di
    ld a, #C3               ; JP instruction
    ld (TIMI), a
    ld hl, GAME_HOOK
    ld (TIMI+1), hl
    ei
    ret

UNINSTALL_GAME_HOOK:
    ; Restore original hook
    di
    ld hl, (old_hook_addr)
    ld a, h
    or l
    jr z, UNINSTALL_NO_HOOK
    
    ld a, #C3               ; JP instruction
    ld (TIMI), a
    ld (TIMI+1), hl
    jr UNINSTALL_DONE
    
UNINSTALL_NO_HOOK:
    ld a, #C9               ; RET instruction
    ld (TIMI), a
    
UNINSTALL_DONE:
    ei
    ret

;-------------------------------------------------------------------------------
; Zone Management System
;-------------------------------------------------------------------------------
TRIGGER_ZONE_CHANGE:
    ; A = new zone number
    ld (current_zone), a
    ld a, 1
    ld (zone_loading_flag), a   ; Set loading flag
    ret

PROCESS_ZONE_CHANGE:
    ; Temporarily disable hook for massive graphics loading
    call UNINSTALL_GAME_HOOK
    
    ; Set loading state
    ld a, STATE_LOADING_ZONE
    ld (game_state), a
    
    ; MASSIVE GRAPHICS LOADING (safe outside hook)
    ld a, (current_zone)
    call LOAD_ZONE_GRAPHICS     ; Load new zone graphics
    call LOAD_ZONE_PATTERNS     ; Load new patterns
    call LOAD_ZONE_COLORS       ; Load new colors
    call LOAD_ZONE_LAYOUT       ; Load new screen layout
    call LOAD_ZONE_SPRITES      ; Load new sprite data
    
    ; Re-install hook
    call INSTALL_GAME_HOOK
    
    ; Clear loading flag and return to playing
    xor a
    ld (zone_loading_flag), a
    ld a, STATE_PLAYING
    ld (game_state), a
    
    ret

;-------------------------------------------------------------------------------
; Zone Loading Functions (Massive graphics operations)
;-------------------------------------------------------------------------------
LOAD_ZONE_GRAPHICS:
    ; A = zone number
    ; Load zone-specific graphics safely
    push af
    
    ; Example: Load different graphics based on zone
    cp 1
    jr z, LOAD_ZONE_1_GRAPHICS
    cp 2
    jr z, LOAD_ZONE_2_GRAPHICS
    ; Add more zones as needed
    
    pop af
    ret

LOAD_ZONE_1_GRAPHICS:
    ; Load zone 1 specific patterns/colors
    call loadPatternBanks
    call loadColorBanks
    pop af
    ret

LOAD_ZONE_2_GRAPHICS:
    ; Load zone 2 specific patterns/colors
    ; TODO: Load different bin files for zone 2
    call loadPatternBanks
    call loadColorBanks
    pop af
    ret

LOAD_ZONE_PATTERNS:
    ; Load new pattern data for current zone
    ; This is where you'd load zone-specific .BIN files
    ret

LOAD_ZONE_COLORS:
    ; Load new color data for current zone
    ret

LOAD_ZONE_LAYOUT:
    ; Load new screen layout
    call drawScreenLayout
    ret

LOAD_ZONE_SPRITES:
    ; Load new sprite definitions
    call redef_spr
    ret

;-------------------------------------------------------------------------------
; Real-time Game Logic Functions (called from hook)
;-------------------------------------------------------------------------------
UPDATE_ENTITIES:
    ; Light-weight entity updates
    ; Move sprites, update animations, etc.
    ret

READ_INPUT:
    ; Read joystick/keyboard input
    ret

UPDATE_SPRITES_POS:
    ; Update sprite positions in VRAM
    ret

CHECK_COLLISIONS:
    ; Collision detection between entities
    ret

UPDATE_SOUND:
    ; Update PSG sound/music
    ret

CHECK_ZONE_TRIGGERS:
    ; Check if player reached zone transition points
    ; Example: if player X > 240, trigger zone change
    ; ld a, 2              ; New zone number
    ; call TRIGGER_ZONE_CHANGE
    ret

;-------------------------------------------------------------------------------
; Original graphics functions (preserved)
;-------------------------------------------------------------------------------
redef_spr:
            ;es redefineixen tots els sprites
    ; define sprites
        ld      hl,spr_jack
        ld      de,SPRTBL
        ld      b,160
        call    DoCopy
    ; define sprite
        ld      hl,SPRATR
        ld      de,sprites
        ld      bc,32
        ldir
        ret

;-----------------------------------------------------------
;hl=origen
;de=destino
;b=blokes de 8 bytes

DoCopy:
 ld a,e
 di
 out ($99),a
 ld a,d
 or a,$40

 out ($99),a
 ei
 ld c,$98
 VdpReady:
  ld d,b
  outi
  outi
  outi
  outi
  outi
  outi
  outi
  ld b,d
  outi
  jp nz,VdpReady

  ret

;-------------------------------------------------------------------------------
; loadMyScreen (NEW ROUTINE)
; Loads custom tile patterns and colors into all three VRAM banks,
; and then draws the screen layout.
;-------------------------------------------------------------------------------
 loadMyScreen:

 loadPatternBanks:
        ; --- Load TILE1 Pattern Data into all three PGT banks ---
        LD      HL, ALL_MAP_TILES_PTR ; Source RAM address for TILE1 patterns
        LD DE,CHRTBL2
        LD BC,MAX_PTR       ; 4 characters (0-3) * 8 bytes/char = 32 bytes
        CALL LDIRVM
        ; Load TILE1 patterns into the second PGT bank
        LD    HL, ALL_MAP_TILES_PTR ; Source RAM address for TILE1 patterns
        LD DE,CHRTBL2 + #800 ; Destination VRAM address for PGT bank 1
        LD BC, MAX_PTR       ; 4 characters (0-3) * 8 bytes/char = 32 bytes
        CALL LDIRVM
        ; Load TILE1 patterns into the third PGT bank
        LD    HL, ALL_MAP_TILES_PTR ; Source RAM address for TILE1 patterns
        LD DE,CHRTBL2 + #1000 ; Destination VRAM address for P
        LD BC, MAX_PTR        ; 4 characters (0-3) * 8 bytes/char = 32 bytes
        CALL LDIRVM

 loadColorBanks:
        ; --- Load TILE1 Color Data into all three CAT banks ---
        LD      HL,ALL_MAP_TILES_COL; Source RAM address for TILE1 colors
        LD      DE, CLRTBL2
        LD      BC, MAX_PTR      ; 4 characters * 8 bytes/char = 32 bytes
        CALL    LDIRVM

        ; Load TILE1 colors into the second CAT bank
        LD      HL,ALL_MAP_TILES_COL;Source RAM address for TILE1 colors
        LD      DE, CLRTBL2 + #800 ; Destination VRAM address for CAT
        LD      BC,MAX_PTR    ; 4 characters * 8 bytes/char = 32 bytes
        CALL    LDIRVM
        ; Load TILE1 colors into the third CAT bank
        LD      HL,ALL_MAP_TILES_COL;Source RAM address for TILE1 colors
        LD      DE, CLRTBL2 + #1000 ; Destination VRAM address for
        LD      BC,MAX_PTR     ; 4 characters * 8 bytes/char = 32 bytes
        CALL    LDIRVM

        ; --- Load Blank Character Pattern (character #255) into all three PGT banks ---

 loadBlankCharPatterns:
        LD      HL, BLANK_CHAR_PATTERN ; Source RAM address for blank character pattern
        LD     DE, CHRTBL2 + #0000 + (255 * 8) ; Destination VRAM address for char #255 in PGT bank 0
        LD      BC, 8           ; 8 bytes for one character pattern
        CALL    LDIRVM
        ; Load BLANK_CHAR_PATTERN into the second PGT bank
        LD      HL, BLANK_CHAR_PATTERN ; Source RAM address for blank character pattern
        LD      DE, CHRTBL2 + #800 + (255 * 8)
        ; Destination VRAM address for char #255 in PGT bank 1
        LD      BC, 8           ; 8 bytes for one character pattern
        CALL    LDIRVM
        ; Load BLANK_CHAR_PATTERN into the third PGT bank
        LD      HL, BLANK_CHAR_PATTERN ; Source RAM address for blank character pattern
        LD      DE, CHRTBL2 + #1000 + (255 * 8)
        ; Destination VRAM address for char #255 in PGT bank 2
        LD      BC, 8           ; 8 bytes for one character pattern
        CALL    LDIRVM

 loadBlankCharColors:
        ; --- Load Blank Character Color Data (character #255) into all three CAT banks ---
        LD      HL, BLANK_CHAR_COLOR ; Source RAM address for blank character color
        LD      DE, CLRTBL2 + #0000 + (255 * 8)
        LD      BC, 8           ; 8 bytes for one character color
        CALL    LDIRVM
        ; Load BLANK_CHAR_COLOR into the second CAT bank
        LD      HL, BLANK_CHAR_COLOR ; Source RAM address for blank character color
        LD      DE, CLRTBL2 + #800 + (255 * 8)
        ; Destination VRAM address for char #255 in CAT bank 1
        LD      BC, 8           ; 8 bytes for one character color
        CALL    LDIRVM
        ; Load BLANK_CHAR_COLOR into the third CAT bank
        LD      HL, BLANK_CHAR_COLOR ; Source RAM address for blank character color
        LD      DE, CLRTBL2 + #1000 + (255 * 8)
        ; Destination VRAM address for char #255 in CAT bank 2
        LD      BC, 8           ; 8 bytes for one character color
        CALL    LDIRVM

        ; --- Draw the Screen Layout to the Name Table ---
        CALL    drawScreenLayout
        RET

;-------------------------------------------------------------------------------
; Draw Screen Layout
; Copies the PAN1_LAYOUT_DATA to the VRAM Name Table.
;-------------------------------------------------------------------------------
 drawScreenLayout:
        LD      HL, PAN1_LAYOUT_DATA  ; Source RAM address
        LD      DE, #1800             ; Destination VRAM address (Name Table base)
        LD      BC, 256 * 3               ; Size of the layout data (32 columns * 24 rows)
        CALL    LDIRVM           ; Copy data to VRAM

        RET

;-------------------------------------------------------------------------------
; Data section (add your sprite data here)
;-------------------------------------------------------------------------------
spr_jack:
    ; TODO: Add sprite pattern data
    ds 160, 0

sprites:
    ; TODO: Add sprite attribute data  
    ds 32, 0

; Additional required variables (add as needed)
deterministic: DB 0
isComputer50HzOr60Hz: DB 0