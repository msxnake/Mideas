; ==================================================================
; BASICENEMY - MSX ROM GENERADO POR MIDEAS
; ==================================================================

    ORG #4000

; ROM Header
    DB "AB"
    DW INIT_ROM
    DW 0, 0, 0, 0, 0, 0

; ==================================================================
; BIOS FUNCTIONS
; ==================================================================
CHGMOD  EQU #005F
CLS     EQU #00C3
LDIRVM  EQU #005C
WRTVRM  EQU #004D
WRTVDP  EQU #0047

; ==================================================================
; INITIALIZATION
; ==================================================================
INIT_ROM:
    DI
    LD SP, #F380

    ; Modo Screen 2
    LD A, 2
    CALL CHGMOD
    CALL CLS

    ; Inicializar gráficos
    CALL INIT_GRAPHICS

    EI

MAIN_LOOP:
    HALT
    JP MAIN_LOOP

INIT_GRAPHICS:
    CALL LOAD_TILES
    CALL INIT_SPRITES
    ; No screen map to load

    ; Mostrar mensaje de prueba
    LD H, 10
    LD L, 10
    LD A, 65                      ; 'A'
    LD DE, #1800 + 10*32 + 10     ; Name table position
    CALL WRTVRM

    RET


; ==================================================================
; TILE DATA
; ==================================================================

TILE_PATTERN_DATA:
    ; Tile 0: brick1
    DB #3C, #7E, #FF, #FF, #FF, #FF, #7E, #3C  ; Patrón básico

TILE_COLOR_DATA:
    ; Tile 0: brick1 colors
    DB #F4, #F4, #F4, #F4, #F4, #F4, #F4, #F4  ; Blanco sobre azul

LOAD_TILES:
    ; Cargar patrones
    LD HL, TILE_PATTERN_DATA
    LD DE, #0000                  ; Pattern table
    LD BC, 8
    CALL LDIRVM

    ; Cargar colores
    LD HL, TILE_COLOR_DATA
    LD DE, #2000                  ; Color table
    LD BC, 8
    CALL LDIRVM
    RET


; ==================================================================
; SPRITE DATA
; ==================================================================

SPRITE_PATTERN_DATA:
    ; Sprite 0: bot1
    DB #FF, #81, #81, #81, #81, #81, #81, #FF  ; Frame 1 row 1
    DB #FF, #81, #81, #81, #81, #81, #81, #FF  ; Frame 1 row 2
    DB #00, #00, #00, #00, #00, #00, #00, #00  ; (resto de patrones)
    DB #00, #00, #00, #00, #00, #00, #00, #00

LOAD_SPRITE_PATTERNS:
    LD HL, SPRITE_PATTERN_DATA
    LD DE, #3800                  ; Sprite pattern table
    LD BC, 32
    CALL LDIRVM
    RET

INIT_SPRITES:
    CALL LOAD_SPRITE_PATTERNS
    ; Mostrar primer sprite
    LD A, 0                       ; Sprite 0
    LD B, 100                     ; X = 100
    LD C, 100                     ; Y = 100
    LD D, 0                       ; Pattern 0
    LD E, 15                      ; Color blanco
    CALL SHOW_SPRITE
    RET

SHOW_SPRITE:
    ; A=sprite, B=X, C=Y, D=pattern, E=color
    ; Escribir atributos directamente a VRAM
    PUSH AF
    PUSH BC
    PUSH DE

    ; Y position
    LD HL, #1B00
    LD E, A
    LD D, 0
    SLA E
    SLA E                         ; E = sprite * 4
    ADD HL, DE
    LD A, C                       ; Y position
    CALL WRTVRM

    ; X position
    INC HL
    LD A, B                       ; X position
    CALL WRTVRM

    ; Pattern
    INC HL
    POP DE
    PUSH DE
    LD A, D                       ; Pattern
    CALL WRTVRM

    ; Color
    INC HL
    LD A, E                       ; Color
    CALL WRTVRM

    POP DE
    POP BC
    POP AF
    RET



    END
