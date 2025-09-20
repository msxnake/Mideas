; ==================================================================
; MSX SYSTEM CONSTANTS
; File: constants.asm
; Description: MSX hardware constants and project-specific definitions
; ==================================================================

; ==================================================================
; VRAM LAYOUT - SCREEN 2 MODE
; ==================================================================

; Pattern Generator Table (PGT) - 3 Banks
CHRTBL2 EQU #0000        ; Pattern table base address (Bank 0)
; Bank 1: CHRTBL2 + #800   (#0800)
; Bank 2: CHRTBL2 + #1000  (#1000)

; Color Attribute Table (CAT) - 3 Banks
CLRTBL2 EQU #2000        ; Color table base address (Bank 0)
; Bank 1: CLRTBL2 + #800   (#2800)
; Bank 2: CLRTBL2 + #1000  (#3000)

; Other VRAM Areas
NAMETBL EQU #1800        ; Name table base address
SPRATR  EQU #1B00        ; Sprite attribute table
SPRPAT  EQU #3800        ; Sprite pattern table

; ==================================================================
; SCREEN MODES
; ==================================================================
SCREEN0     EQU 0        ; 40x24 text
SCREEN1     EQU 1        ; 32x24 text/graphics
SCREEN2     EQU 2        ; 256x192 graphics
SCREEN3     EQU 3        ; 64x48 multicolor

; ==================================================================
; SCREEN DIMENSIONS (DYNAMIC BASED ON PROJECT TILES)
; ==================================================================

; Project-specific tile dimensions detected:
; Tile 0: brick1 = 16x16px (2x2 MSX chars)

; Using primary tile size: 16x16px
TILE_WIDTH      EQU 16    ; Primary tile width in pixels
TILE_HEIGHT     EQU 16   ; Primary tile height in pixels
SCREEN_TILES_X  EQU 16    ; Horizontal tiles (256px ÷ 16px)
SCREEN_TILES_Y  EQU 12   ; Vertical tiles (192px ÷ 16px)
MSX_CHARS_PER_TILE_X EQU 2  ; MSX characters wide per tile
MSX_CHARS_PER_TILE_Y EQU 2 ; MSX characters high per tile


; Legacy compatibility
SCREEN_WIDTH    EQU SCREEN_TILES_X
SCREEN_HEIGHT   EQU SCREEN_TILES_Y
TILE_SIZE       EQU 8    ; MSX character size (always 8x8)

; ==================================================================
; GAMEFLOW NODE TYPE CONSTANTS (Critical for Paridad)
; ==================================================================
NODE_TYPE_START        EQU 0    ; Start node (initial entry point)
NODE_TYPE_WORLDLINK    EQU 1    ; World link node (loads world map)
NODE_TYPE_SCREEN       EQU 2    ; Screen node (loads specific screen)
NODE_TYPE_MENU         EQU 3    ; Menu node (shows menu interface)
NODE_TYPE_UNKNOWN      EQU 255  ; Unknown/unsupported node type

; ==================================================================
; SPRITE CONSTANTS
; ==================================================================
MAX_SPRITES     EQU 32   ; Máximo sprites por pantalla
SPRITE_SIZE     EQU 8    ; 8x8 o 16x16 (según modo)
SPRITE_INVISIBLE EQU #D1 ; Y=209 (sprite fuera de pantalla)

; ==================================================================
; MSX COLORS
; ==================================================================
TRANSPARENT EQU 0
BLACK       EQU 1
MEDIUM_GREEN EQU 2
LIGHT_GREEN EQU 3
DARK_BLUE   EQU 4
LIGHT_BLUE  EQU 5
DARK_RED    EQU 6
CYAN        EQU 7
MEDIUM_RED  EQU 8
LIGHT_RED   EQU 9
DARK_YELLOW EQU 10
LIGHT_YELLOW EQU 11
DARK_GREEN  EQU 12
MAGENTA     EQU 13
GRAY        EQU 14
WHITE       EQU 15

; ==================================================================
; INPUT CONSTANTS
; ==================================================================

; Joystick Directions
STICK_UP    EQU 1
STICK_UPRIGHT EQU 2
STICK_RIGHT EQU 3
STICK_DOWNRIGHT EQU 4
STICK_DOWN  EQU 5
STICK_DOWNLEFT EQU 6
STICK_LEFT  EQU 7
STICK_UPLEFT EQU 8
STICK_CENTER EQU 0

; Trigger Constants
TRIG_A      EQU #10      ; Trigger A (Fire)
TRIG_B      EQU #20      ; Trigger B (MSX2+)

; ==================================================================
; GAME FLOW STATES (PROJECT-SPECIFIC)
; ==================================================================

; Basic Game Flow States (always available)
FLOW_STATE_MAIN_MENU    EQU 0
FLOW_STATE_GAME         EQU 1
FLOW_STATE_PAUSE        EQU 2
FLOW_STATE_GAME_OVER    EQU 3
FLOW_STATE_CREDITS      EQU 4

; Additional Game Flow States detected in project
; (Custom states would be added here if needed)


; ==================================================================
; PROJECT-SPECIFIC CONSTANTS
; ==================================================================

; Detected Assets
TOTAL_SPRITES           EQU 1
TOTAL_TILES             EQU 1
TOTAL_SCREENS           EQU 1

; ==================================================================
; END OF CONSTANTS
; ==================================================================
