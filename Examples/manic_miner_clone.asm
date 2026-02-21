; Mini-Juego Manic Miner para MSX - ASM con Glass.jar

;==============================================================================
; MANIC MINER MSX - Ensamblador para Glass.jar
; ROM Header tipo Konami, Screen 2, Sprites 16x16
; Plataformas, gemas, fantasmas patrulla
;==============================================================================

   ;     DEVICE  MSX

;==============================================================================
; CONSTANTES DE HARDWARE MSX
;==============================================================================

; Puertos VDP
VDP_DATA        EQU     $98
VDP_CTRL        EQU     $99
VDP_STATUS      EQU     $99

; Puertos PSG
PSG_REG         EQU     $A0
PSG_WRITE       EQU     $A1
PSG_READ        EQU     $A2

; Puerto teclado
KEY_ROW         EQU     $AA
KEY_COL         EQU     $A9

; BIOS
CHPUT           EQU     $00A2
CHGET           EQU     $009F
POSIT           EQU     $00C6
CLS             EQU     $00C3
SNSMAT          EQU     $0141
INITXT          EQU     $006C
INIT32          EQU     $006F
INIGRP          EQU     $0072
INIMLT          EQU     $0075
CLRSPR          EQU     $0069
LDIRVM          EQU     $005C
FILVRM          EQU     $0056
SETWRT          EQU     $0053
SETRD           EQU     $004A
WRTVRM          EQU     $004D
RDVRM           EQU     $004A

; Registros BIOS
SCRMOD          EQU     $FCAF
RG0SAV          EQU     $F3DF
RG1SAV          EQU     $F3E0
FORCLR          EQU     $F3E9
BAKCLR          EQU     $F3EA
BDRCLR          EQU     $F3EB
GRPHED          EQU     $F3B4
CLIKSW          EQU     $F3DB
EXPTBL          EQU     $FCC1
JIFFY           EQU     $FC9E

;==============================================================================
; CONSTANTES VDP SCREEN 2
;==============================================================================

; Tablas VRAM Screen 2
SCR2_PAT_TABLE  EQU     $0000       ; Pattern table (6144 bytes)
SCR2_COL_TABLE  EQU     $2000       ; Color table (6144 bytes)
SCR2_NAME_TABLE EQU     $1800       ; Name table (768 bytes)
SCR2_SPR_ATTR   EQU     $1B00       ; Sprite attribute table
SCR2_SPR_PAT    EQU     $3800       ; Sprite pattern table

; Dimensiones pantalla
SCREEN_W        EQU     32          ; tiles ancho
SCREEN_H        EQU     24          ; tiles alto
TILE_SIZE       EQU     8           ; pixels por tile

; Tiles especiales
TILE_EMPTY      EQU     0           ; vacio/negro
TILE_SOLID      EQU     1           ; plataforma solida
TILE_LSOLID     EQU     2           ; borde izq plataforma
TILE_RSOLID     EQU     3           ; borde dcho plataforma
TILE_LADDER     EQU     4           ; escalera
TILE_GEM        EQU     5           ; gema
TILE_SPIKES     EQU     6           ; pinchos mortales
TILE_DECO       EQU     7           ; decoracion fondo
TILE_SOLID2     EQU     8           ; plataforma var2
TILE_SCORE_BG   EQU     9           ; fondo marcador

; Colores MSX
COL_BLACK       EQU     1
COL_GREEN       EQU     2
COL_LGREEN      EQU     3
COL_BLUE        EQU     4
COL_LBLUE       EQU     5
COL_RED         EQU     6
COL_CYAN        EQU     7
COL_MAGENTA     EQU     8
COL_ORANGE      EQU     9
COL_YELLOW      EQU     11
COL_WHITE       EQU     15
COL_GREY        EQU     14
COL_TRANS       EQU     0

; Sprites
SPR_PLAYER_L1   EQU     0           ; sprite player layer 1
SPR_PLAYER_L2   EQU     1           ; sprite player layer 2
SPR_GHOST1_L1   EQU     2           ; fantasma 1 layer 1
SPR_GHOST1_L2   EQU     3           ; fantasma 1 layer 2
SPR_GHOST2_L1   EQU     4           ; fantasma 2 layer 1
SPR_GHOST2_L2   EQU     5           ; fantasma 2 layer 2

; Patrones sprite
SPT_PLAYER1     EQU     0           ; patron player capa1
SPT_PLAYER2     EQU     2           ; patron player capa2 (16x16=4 bloques de 8)
SPT_GHOST1      EQU     4           ; patron fantasma
SPT_GHOST2      EQU     6           ; patron fantasma capa2

; Fisicas
GRAVITY         EQU     2
JUMP_FORCE      EQU     14
MAX_FALL        EQU     6
PLAYER_SPEED    EQU     2
GHOST_SPEED     EQU     1

; Juego
MAX_GEMS        EQU     8           ; gemas en el nivel
MAX_GHOSTS      EQU     2

;==============================================================================
; ROM HEADER - TIPO KONAMI
;==============================================================================

        ORG     $4000

ROMSTART:
        DB      $41,$42         ; "AB" - ID ROM MSX
        DW      INIT            ; INIT - punto entrada
        DW      $0000           ; STATEMENT
        DW      $0000           ; DEVICE
        DW      $0000           ; TEXT
        DS      6, $00          ; reservado

;==============================================================================
; ZONA DE DATOS - RAM (usar WRAM MSX $C000-$F000)
;==============================================================================

; Variables en RAM efectiva (no en ROM)
RAM_BASE        EQU     $C000

; --- Player ---
PLY_X           EQU     RAM_BASE
PLY_Y           EQU     PLY_X + 1
PLY_VX          EQU     PLY_Y + 1
PLY_VY          EQU     PLY_VX + 1
PLY_ON_GROUND   EQU     PLY_VY + 1
PLY_ALIVE       EQU     PLY_ON_GROUND + 1
PLY_FRAME       EQU     PLY_ALIVE + 1
PLY_DIR         EQU     PLY_FRAME + 1
PLY_JUMP_CNT    EQU     PLY_DIR + 1

; --- Fantasmas ---
GH1_X           EQU     PLY_JUMP_CNT + 1
GH1_Y           EQU     GH1_X + 1
GH1_VX          EQU     GH1_Y + 1
GH1_DIR         EQU     GH1_VX + 1
GH1_MIN         EQU     GH1_DIR + 1
GH1_MAX         EQU     GH1_MIN + 1
GH1_FRAME       EQU     GH1_MAX + 1

GH2_X           EQU     GH1_FRAME + 1
GH2_Y           EQU     GH2_X + 1
GH2_VX          EQU     GH2_Y + 1
GH2_DIR         EQU     GH2_VX + 1
GH2_MIN         EQU     GH2_DIR + 1
GH2_MAX         EQU     GH2_MIN + 1
GH2_FRAME       EQU     GH2_MAX + 1

; --- Gemas ---
GEM_X           EQU     GH2_FRAME + 1
GEM_Y           EQU     GEM_X + MAX_GEMS
GEM_ACTIVE      EQU     GEM_Y + MAX_GEMS ; 1=activa, 0=recogida

; --- Juego ---
SCORE           EQU     GEM_ACTIVE + MAX_GEMS ; puntuacion BCD (2 bytes)
GEMS_LEFT       EQU     SCORE + 2
GAME_STATE      EQU     GEMS_LEFT + 1   ; 0=jugando,1=game over,2=win
FRAME_COUNT     EQU     GAME_STATE + 1  ; contador frames global
ANIM_TIMER      EQU     FRAME_COUNT + 1 ; timer animacion sprites
INPUT_STATE     EQU     ANIM_TIMER + 1  ; teclas actuales
INPUT_PREV      EQU     INPUT_STATE + 1 ; teclas frame anterior
LIVES           EQU     INPUT_PREV + 1  ; vidas

; Buffer temporal
TEMP1           EQU     LIVES + 1
TEMP2           EQU     TEMP1 + 1
TEMP3           EQU     TEMP2 + 1
TEMP4           EQU     TEMP3 + 1

; VDP write buffer sprite attr (4 bytes * 32 sprites)
SPR_BUF         EQU     TEMP4 + 1
SPR_BUF_END     EQU     SPR_BUF + 128
RAM_VARS_SIZE   EQU     SPR_BUF_END - RAM_BASE

;==============================================================================
; INICIO PROGRAMA (en ROM $4000)
;==============================================================================

INIT:
        DI                      ; deshabilitar interrupciones
        
        ; Inicializar Stack
        LD      SP,$F380

        ; Desactivar click de teclado BIOS (evita pitidos al pulsar teclas)
        XOR     A
        LD      (CLIKSW),A
        
        ; Limpiar RAM de variables del juego
        LD      HL,RAM_BASE
        LD      DE,RAM_BASE + 1
        LD      BC,RAM_VARS_SIZE - 1
        LD      (HL),0
        LDIR
        
        ; Inicializar Screen 2
        CALL    SETUP_SCREEN2
        
        ; Cargar tiles (patrones + colores)
        CALL    LOAD_TILES
        
        ; Cargar sprites
        CALL    LOAD_SPRITES
        
        ; Inicializar nivel
        CALL    INIT_LEVEL
        
        ; Pintar mapa
        CALL    DRAW_MAP
        
        ; Dibujar marcador inicial
        CALL    DRAW_HUD
        
        ; Estado inicial
        LD      A,1
        LD      (PLY_ALIVE),A
        LD      (LIVES),A
        XOR     A
        LD      (GAME_STATE),A

        ; Asegurar PSG en silencio al arrancar
        CALL    SILENCE_PSG
        
        ; Habilitar interrupciones VDP
        EI

;==============================================================================
; BUCLE PRINCIPAL
;==============================================================================

MAIN_LOOP:
        ; Esperar VSYNC (usando puerto VDP status)
        CALL    WAIT_VSYNC
        
        ; Incrementar contador frame
        LD      A,(FRAME_COUNT)
        INC     A
        LD      (FRAME_COUNT),A
        
        ; Leer estado juego
        LD      A,(GAME_STATE)
        OR      A
        JR      Z,GAME_PLAYING
        CP      1
        JR      Z,GAME_OVER_LOOP
        CP      2
        JR      Z,GAME_WIN_LOOP
        JR      MAIN_LOOP

GAME_PLAYING:
        ; Leer input
        CALL    READ_KEYBOARD
        
        ; Actualizar player
        CALL    UPDATE_PLAYER
        
        ; Actualizar fantasmas
        CALL    UPDATE_GHOSTS
        
        ; Verificar colisiones player-gemas
        CALL    CHECK_GEM_COLLISION
        
        ; Verificar colisiones player-fantasmas
        CALL    CHECK_GHOST_COLLISION
        
        ; Actualizar sprites en VRAM
        CALL    UPDATE_SPRITES
        
        ; Actualizar HUD cada 4 frames
        LD      A,(FRAME_COUNT)
        AND     $03
        JR      NZ,MAIN_LOOP
        CALL    DRAW_HUD
        
        JR      MAIN_LOOP

GAME_OVER_LOOP:
        CALL    SHOW_GAME_OVER
        ; Esperar tecla para reiniciar
        CALL    WAIT_KEY_SPACE
        CALL    RESTART_GAME
        JR      MAIN_LOOP

GAME_WIN_LOOP:
        CALL    SHOW_WIN
        CALL    WAIT_KEY_SPACE
        CALL    RESTART_GAME
        JR      MAIN_LOOP

;==============================================================================
; SETUP SCREEN 2
;==============================================================================

SETUP_SCREEN2:
        ; Configurar VDP para Screen 2
        ; Registro 0: modo grafico 2 (M1=0,M2=1)
        LD      A,%00000010
        LD      B,0
        CALL    WRITE_VDP_REG
        
        ; Registro 1: 16K, pantalla on, sprite 16x16, mag=0
        LD      A,%11100010
        LD      B,1
        CALL    WRITE_VDP_REG
        
        ; Registro 2: Name table en $1800 -> $1800/400h = 6 -> %00000110
        LD      A,%00000110
        LD      B,2
        CALL    WRITE_VDP_REG
        
        ; Registro 3: Color table en $2000 -> %10000000 (todos bancos)
        LD      A,%11111111
        LD      B,3
        CALL    WRITE_VDP_REG
        
        ; Registro 4: Pattern table en $0000 -> %00000011
        LD      A,%00000011
        LD      B,4
        CALL    WRITE_VDP_REG
        
        ; Registro 5: Sprite attr en $1B00 -> $1B00/80h = $36 -> %00110110
        LD      A,%00110110
        LD      B,5
        CALL    WRITE_VDP_REG
        
        ; Registro 6: Sprite pattern en $3800 -> $3800/800h = 7 -> %00000111
        LD      A,%00000111
        LD      B,6
        CALL    WRITE_VDP_REG
        
        ; Registro 7: Color borde negro (color 1)
        LD      A,$01
        LD      B,7
        CALL    WRITE_VDP_REG
        
        ; Limpiar toda la VRAM
        LD      HL,$0000
        LD      BC,$4000
        XOR     A
        CALL    FILL_VRAM
        
        ; Inicializar Name Table - todos tiles 0 (negro)
        LD      HL,SCR2_NAME_TABLE
        LD      BC,$0300
        XOR     A
        CALL    FILL_VRAM
        
        RET

;==============================================================================
; WRITE VDP REGISTER  A=valor, B=registro
;==============================================================================

WRITE_VDP_REG:
        OUT     (VDP_CTRL),A
        LD      A,B
        OR      $80
        OUT     (VDP_CTRL),A
        RET

;==============================================================================
; FILL VRAM  HL=direccion, BC=count, A=valor
;==============================================================================

FILL_VRAM:
        PUSH    AF
        ; Set write address
        LD      A,L
        OUT     (VDP_CTRL),A
        LD      A,H
        OR      $40
        OUT     (VDP_CTRL),A
        POP     AF
FILL_LOOP:
        OUT     (VDP_DATA),A
        NOP
        DEC     BC
        LD      HL,0
        ADD     HL,BC
        JR      NZ,FILL_LOOP
        RET

;==============================================================================
; WRITE VRAM BLOCK  HL=src_RAM, DE=dst_VRAM, BC=count
;==============================================================================

WRITE_VRAM_BLOCK:
        ; Set write address en DE
        LD      A,E
        OUT     (VDP_CTRL),A
        LD      A,D
        OR      $40
        OUT     (VDP_CTRL),A
WVB_LOOP:
        LD      A,(HL)
        OUT     (VDP_DATA),A
        NOP
        INC     HL
        DEC     BC
        LD      A,B
        OR      C
        JR      NZ,WVB_LOOP
        RET

;==============================================================================
; WAIT VSYNC
;==============================================================================

WAIT_VSYNC:
WV_LOOP:
        IN      A,(VDP_STATUS)
        AND     $80
        JR      Z,WV_LOOP
        RET

;==============================================================================
; LOAD TILES - Patrones y colores para Screen 2
; Screen 2 tiene 3 bancos de 256 chars (tiles 0-255 cada banco)
; Bank0: $0000-$07FF patterns, $2000-$27FF colors
; Bank1: $0800-$0FFF patterns, $2800-$2FFF colors  
; Bank2: $1000-$17FF patterns, $3000-$37FF colors
;==============================================================================

LOAD_TILES:
        ; Cargar patrones en banco 0 (filas 0-7 pantalla)
        LD      HL,TILE_PATTERNS
        LD      DE,SCR2_PAT_TABLE       ; $0000
        LD      BC,TILE_PAT_SIZE
        CALL    WRITE_VRAM_BLOCK
        
        ; Cargar patrones en banco 1 (filas 8-15 pantalla)
        LD      HL,TILE_PATTERNS
        LD      DE,SCR2_PAT_TABLE+$0800 ; $0800
        LD      BC,TILE_PAT_SIZE
        CALL    WRITE_VRAM_BLOCK
        
        ; Cargar patrones en banco 2 (filas 16-23 pantalla)
        LD      HL,TILE_PATTERNS
        LD      DE,SCR2_PAT_TABLE+$1000 ; $1000
        LD      BC,TILE_PAT_SIZE
        CALL    WRITE_VRAM_BLOCK
        
        ; Cargar colores en banco 0
        LD      HL,TILE_COLORS
        LD      DE,SCR2_COL_TABLE       ; $2000
        LD      BC,TILE_COL_SIZE
        CALL    WRITE_VRAM_BLOCK
        
        ; Cargar colores en banco 1
        LD      HL,TILE_COLORS
        LD      DE,SCR2_COL_TABLE+$0800 ; $2800
        LD      BC,TILE_COL_SIZE
        CALL    WRITE_VRAM_BLOCK
        
        ; Cargar colores en banco 2
        LD      HL,TILE_COLORS
        LD      DE,SCR2_COL_TABLE+$1000 ; $3000
        LD      BC,TILE_COL_SIZE
        CALL    WRITE_VRAM_BLOCK
        
        RET

;==============================================================================
; TILE PATTERNS (8 bytes por tile, primeros 16 tiles)
;==============================================================================

TILE_PATTERNS:

; Tile 0 - EMPTY (negro)
        DB      $00,$00,$00,$00,$00,$00,$00,$00

; Tile 1 - SOLID (plataforma solida - bloque roca)
        DB      $FF,$FF,$DB,$DB,$B7,$B7,$FF,$FF

; Tile 2 - SOLID BORDE IZQ
        DB      $FF,$FF,$CE,$CE,$B6,$B6,$FF,$FF

; Tile 3 - SOLID BORDE DCH
        DB      $FF,$FF,$73,$73,$6D,$6D,$FF,$FF

; Tile 4 - LADDER (escalera)
        DB      $66,$FF,$66,$FF,$66,$FF,$66,$FF

; Tile 5 - GEM (gema diamante)
        DB      $18,$3C,$7E,$FF,$FF,$7E,$3C,$18

; Tile 6 - SPIKES (pinchos)
        DB      $24,$24,$66,$66,$FF,$FF,$FF,$FF

; Tile 7 - DECO (fondo estrella)
        DB      $00,$08,$1C,$08,$00,$00,$00,$00

; Tile 8 - SOLID2 (plataforma variante)
        DB      $FF,$FF,$AA,$55,$AA,$55,$FF,$FF

; Tile 9 - SCORE BG (fondo marcador)
        DB      $FF,$FF,$FF,$FF,$FF,$FF,$FF,$FF

; Tile 10 - DIGIT 0
        DB      $3C,$66,$6E,$76,$66,$66,$3C,$00

; Tile 11 - DIGIT 1
        DB      $18,$38,$18,$18,$18,$18,$7E,$00

; Tile 12 - DIGIT 2
        DB      $3C,$66,$06,$0C,$18,$30,$7E,$00

; Tile 13 - DIGIT 3
        DB      $3C,$66,$06,$1C,$06,$66,$3C,$00

; Tile 14 - DIGIT 4
        DB      $0C,$1C,$2C,$4C,$7E,$0C,$0C,$00

; Tile 15 - DIGIT 5
        DB      $7E,$60,$7C,$06,$06,$66,$3C,$00

TILE_PAT_SIZE   EQU     $ - TILE_PATTERNS

;==============================================================================
; TILE COLORS (8 bytes por tile - formato VDP: high nibble=fg, low=bg)
;==============================================================================

TILE_COLORS:

; Tile 0 - EMPTY (transparente sobre negro)
        DB      $01,$01,$01,$01,$01,$01,$01,$01

; Tile 1 - SOLID (gris claro sobre gris)
        DB      $E1,$E1,$E1,$E1,$E1,$E1,$E1,$E1  ; $E=grey, $1=black

; Tile 2 - SOLID IZQ
        DB      $F1,$F1,$F1,$F1,$F1,$F1,$F1,$F1  ; $F=white, $1=black

; Tile 3 - SOLID DCH
        DB      $F1,$F1,$F1,$F1,$F1,$F1,$F1,$F1

; Tile 4 - LADDER (amarillo sobre negro)
        DB      $B1,$B1,$B1,$B1,$B1,$B1,$B1,$B1  ; $B=yellow

; Tile 5 - GEM (cyan brillante sobre negro)
        DB      $71,$71,$71,$71,$71,$71,$71,$71  ; $7=cyan

; Tile 6 - SPIKES (rojo sobre negro)
        DB      $61,$61,$61,$61,$61,$61,$61,$61  ; $6=red

; Tile 7 - DECO (azul oscuro sobre negro)
        DB      $41,$41,$41,$41,$41,$41,$41,$41  ; $4=dark blue

; Tile 8 - SOLID2 (verde sobre negro)
        DB      $21,$21,$21,$21,$21,$21,$21,$21  ; $2=green

; Tile 9 - SCORE BG (azul sobre azul)
        DB      $44,$44,$44,$44,$44,$44,$44,$44

; Tile 10 - DIGIT 0 (blanco sobre azul)
        DB      $F4,$F4,$F4,$F4,$F4,$F4,$F4,$F4

; Tile 11 - DIGIT 1
        DB      $F4,$F4,$F4,$F4,$F4,$F4,$F4,$F4

; Tile 12 - DIGIT 2
        DB      $F4,$F4,$F4,$F4,$F4,$F4,$F4,$F4

; Tile 13 - DIGIT 3
        DB      $F4,$F4,$F4,$F4,$F4,$F4,$F4,$F4

; Tile 14 - DIGIT 4
        DB      $F4,$F4,$F4,$F4,$F4,$F4,$F4,$F4

; Tile 15 - DIGIT 5
        DB      $F4,$F4,$F4,$F4,$F4,$F4,$F4,$F4

TILE_COL_SIZE   EQU     $ - TILE_COLORS

;==============================================================================
; MAPA DEL NIVEL (32x24 tiles)
; Fila 0 = HUD (marcador superior)
;==============================================================================

; Indices: 0=vacio, 1=solido, 4=escalera, 5=gema, 6=pinchos, 8=solid2
; S=Score bg (9), usamos notacion compacta

LEVEL_MAP:
; Fila 0 - HUD Bar
        DB      9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9
        DB      9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9
; Fila 1 - HUD cont
        DB      9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9
        DB      9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9
; Fila 2 - vacio
        DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
        DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
; Fila 3
        DB      0,0,0,5,0,0,0,0,0,5,0,0,0,0,0,5
        DB      0,0,0,0,0,0,5,0,0,0,0,0,5,0,0,0
; Fila 4 - plataforma alta
        DB      2,1,1,1,1,1,1,1,3,0,0,2,1,1,1,3
        DB      0,0,2,1,1,1,1,3,0,2,1,1,1,1,1,3
; Fila 5
        DB      0,0,0,0,4,0,0,0,0,0,0,0,0,4,0,0
        DB      0,0,0,0,0,4,0,0,0,0,0,0,0,0,4,0
; Fila 6
        DB      0,0,0,0,4,0,5,0,0,0,0,0,0,4,0,0
        DB      0,0,0,0,5,4,0,0,0,0,5,0,0,0,4,0
; Fila 7 - plataforma media-alta
        DB      2,1,1,1,1,3,0,2,1,1,1,1,3,0,0,0
        DB      2,1,1,1,3,0,0,2,1,1,1,1,3,0,0,0
; Fila 8
        DB      0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0
        DB      0,0,0,0,0,0,0,4,0,0,0,0,0,4,0,0
; Fila 9
        DB      0,5,0,0,0,0,0,0,0,4,5,0,0,0,0,5
        DB      0,0,0,0,0,0,0,4,0,5,0,0,0,4,0,0
; Fila 10 - plataforma media
        DB      2,1,1,3,0,0,2,1,1,1,1,1,3,0,2,1
        DB      1,1,3,0,2,1,1,1,3,0,2,1,1,1,1,3
; Fila 11
        DB      0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0
        DB      0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0
; Fila 12
        DB      0,0,0,0,5,0,0,0,4,0,0,5,0,0,0,0
        DB      0,5,0,0,0,0,0,0,4,0,0,0,5,0,0,0
; Fila 13 - plataforma baja
        DB      0,0,0,2,1,1,3,0,0,0,2,1,1,1,1,3
        DB      2,1,3,0,0,2,1,1,1,1,3,0,0,0,0,0
; Fila 14
        DB      0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0
        DB      0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0
; Fila 15
        DB      0,5,0,0,0,0,5,0,0,0,0,0,0,4,0,5
        DB      0,0,0,5,0,0,0,0,0,0,4,5,0,0,0,0
; Fila 16 - plataforma suelo nivel
        DB      2,1,1,1,1,3,0,2,1,1,3,0,0,0,2,1
        DB      1,1,1,3,0,0,2,1,1,3,0,2,1,1,1,3
; Fila 17
        DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
        DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
; Fila 18
        DB      0,0,6,6,6,0,0,0,0,6,6,6,6,0,0,0
        DB      0,6,6,0,0,0,0,0,6,6,6,0,0,0,0,0
; Fila 19
        DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
        DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
; Fila 20
        DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
        DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
; Fila 21
        DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
        DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
; Fila 22
        DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
        DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
; Fila 23 - suelo absoluto
        DB      1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
        DB      1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1

;==============================================================================
; INICIALIZAR NIVEL
;==============================================================================

INIT_LEVEL:
        ; Posicion inicial player (pixel)
        LD      A,24            ; X = 3 tiles * 8
        LD      (PLY_X),A
        LD      A,152           ; Y = fila 19 * 8 (encima suelo)
        LD      (PLY_Y),A
        XOR     A
        LD      (PLY_VX),A
        LD      (PLY_VY),A
        LD      (PLY_FRAME),A
        LD      (PLY_DIR),A
        LD      A,1
        LD      (PLY_ON_GROUND),A
        LD      (PLY_ALIVE),A
        
        ; Inicializar fantasma 1
        LD      A,80            ; X pixel
        LD      (GH1_X),A
        LD      A,128           ; Y pixel (fila 16)
        LD      (GH1_Y),A
        LD      A,GHOST_SPEED
        LD      (GH1_VX),A
        XOR     A
        LD      (GH1_DIR),A
        LD      A,80
        LD      (GH1_MIN),A
        LD      A,144
        LD      (GH1_MAX),A
        
        ; Inicializar fantasma 2
        LD      A,168
        LD      (GH2_X),A
        LD      A,72            ; Y pixel (fila 9)
        LD      (GH2_Y),A
        LD      A,GHOST_SPEED
        LD      (GH2_VX),A
        XOR     A
        LD      (GH2_DIR),A
        LD      A,168
        LD      (GH2_MIN),A
        LD      A,232
        LD      (GH2_MAX),A
        
        ; Inicializar gemas (posiciones en pixels)
        ; 8 gemas en el mapa
        LD      HL,GEM_X
        LD      (HL),24         ; gema 0
        INC     HL
        LD      (HL),72         ; gema 1
        INC     HL
        LD      (HL),80         ; gema 2  
        INC     HL
        LD      (HL),128        ; gema 3
        INC     HL
        LD      (HL),184        ; gema 4
        INC     HL
        LD      (HL),208        ; gema 5
        INC     HL
        LD      (HL),40         ; gema 6
        INC     HL
        LD      (HL),160        ; gema 7

        LD      HL,GEM_Y
        LD      (HL),24         ; gema 0 (fila 3)
        INC     HL
        LD      (HL),24         ; gema 1
        INC     HL
        LD      (HL),72         ; gema 2
        INC     HL
        LD      (HL),48         ; gema 3
        INC     HL
        LD      (HL),24         ; gema 4
        INC     HL
        LD      (HL),72         ; gema 5
        INC     HL
        LD      (HL),120        ; gema 6
        INC     HL
        LD      (HL),96         ; gema 7

        ; Activar todas las gemas
        LD      HL,GEM_ACTIVE
        LD      B,MAX_GEMS
        LD      A,1
IL_GEMS:
        LD      (HL),A
        INC     HL
        DJNZ    IL_GEMS
        
        ; Contador gemas
        LD      A,MAX_GEMS
        LD      (GEMS_LEFT),A
        
        ; Score 0
        XOR     A
        LD      (SCORE),A
        LD      (SCORE+1),A
        
        RET

;==============================================================================
; DRAW MAP - Escribe el mapa en la Name Table de VRAM
;==============================================================================

DRAW_MAP:
        LD      HL,LEVEL_MAP
        LD      DE,SCR2_NAME_TABLE
        LD      BC,768          ; 32*24 = 768 bytes
        CALL    WRITE_VRAM_BLOCK
        RET

;==============================================================================
; LOAD SPRITES - Cargar patrones sprite en VRAM
;==============================================================================

LOAD_SPRITES:
        ; Cargar patron player layer 1 (sprite 16x16 = 32 bytes)
        LD      HL,SPR_PAT_PLAYER1
        LD      DE,SCR2_SPR_PAT + (SPT_PLAYER1 * 8)
        LD      BC,32
        CALL    WRITE_VRAM_BLOCK
        
        ; Cargar patron player layer 2
        LD      HL,SPR_PAT_PLAYER2
        LD      DE,SCR2_SPR_PAT + (SPT_PLAYER2 * 8)
        LD      BC,32
        CALL    WRITE_VRAM_BLOCK
        
        ; Cargar patron fantasma layer 1
        LD      HL,SPR_PAT_GHOST1
        LD      DE,SCR2_SPR_PAT + (SPT_GHOST1 * 8)
        LD      BC,32
        CALL    WRITE_VRAM_BLOCK
        
        ; Cargar patron fantasma layer 2
        LD      HL,SPR_PAT_GHOST2
        LD      DE,SCR2_SPR_PAT + (SPT_GHOST2 * 8)
        LD      BC,32
        CALL    WRITE_VRAM_BLOCK
        
        ; Inicializar sprite attribute table (todos fuera de pantalla)
        LD      A,$D0           ; Y=208 = sprite fuera pantalla
        LD      HL,SCR2_SPR_ATTR
        ; Set address
        LD      A,$00
        OUT     (VDP_CTRL),A
        LD      A,$5B
        OUT     (VDP_CTRL),A
        ; Escribir 128 bytes
        LD      B,128
        LD      A,$D0
LS_CLEAR:
        OUT     (VDP_DATA),A
        NOP
        DJNZ    LS_CLEAR
        
        RET

;==============================================================================
; SPRITE PATTERNS
; 16x16: cada sprite son 4 bloques de 8x8 (16 bytes cada bloque = 32 bytes)
; Formato MSX: 16 bytes upper-left, 16 bytes upper-right... pero en MSX
; el sprite 16x16 usa patrones: pat N (8x8 top), pat N+1 (8x8 bottom)
; En realidad MSX 16x16: los 16 bytes del patron N son el bitmap 16x8 top
; y patron N+1 son los 16 bytes bottom. Cada "byte" es una columna de 8px
;==============================================================================

; Player Layer 1 - cuerpo (blanco)
SPR_PAT_PLAYER1:
        ; Top 16x8 (16 bytes)
        DB      %00111100  ; ....####....
        DB      %00111100  ; ....####....
        DB      %01111110  ; ...######...
        DB      %11100111  ; ##...####...  (cabeza)
        DB      %11111111  ; ########
        DB      %01111110  ; .######.
        DB      %00111100  ; ..####..
        DB      %00011000  ; ...##...
        DB      %00011000  ; ...##...
        DB      %00111100  ; ..####..  (torso)
        DB      %01111110  ; .######.
        DB      %11100111  ; ##...##
        DB      %11000011  ; ##.....##
        DB      %01000010  ; .#.....#.
        DB      %01000010  ; .#.....#.
        DB      %00000000
        ; Bottom 16x8 (16 bytes)
        DB      %00011000  ; ...##...  (piernas)
        DB      %00100100  ; ..#..#..
        DB      %00100100  ; ..#..#..
        DB      %01100110  ; .##..##.
        DB      %11000011  ; ##....##  (pies)
        DB      %11000011
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000

; Player Layer 2 - detalles (amarillo)
SPR_PAT_PLAYER2:
        ; Top
        DB      %00000000
        DB      %00000000
        DB      %00011000  ; ojos
        DB      %00100100
        DB      %00000000
        DB      %00011000  ; boca
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00011000  ; cinturon
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        ; Bottom
        DB      %00000000
        DB      %00011000  ; rodillas
        DB      %00000000
        DB      %00011000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000

; Fantasma Layer 1 - cuerpo (magenta)
SPR_PAT_GHOST1:
        ; Top
        DB      %00111100
        DB      %01111110
        DB      %11111111
        DB      %11111111
        DB      %11111111
        DB      %11111111
        DB      %11111111
        DB      %11111111
        DB      %11111111
        DB      %11111111
        DB      %11111111
        DB      %11111111
        DB      %11111111
        DB      %11111111
        DB      %11111111
        DB      %11111111
        ; Bottom
        DB      %11111111
        DB      %11111111
        DB      %11111111
        DB      %11111111
        DB      %11111111
        DB      %10110101
        DB      %01001010
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000

; Fantasma Layer 2 - ojos (blanco)
SPR_PAT_GHOST2:
        ; Top
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %01100110  ; ojos
        DB      %01100110
        DB      %01100110
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        ; Bottom
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000
        DB      %00000000

;==============================================================================
; READ KEYBOARD - Lee cursores + espacio via BIOS SNSMAT
; Row 8, bits activos en 0:
; bit4=RIGHT, bit5=LEFT, bit6=DOWN, bit7=UP, bit0=SPACE
;==============================================================================

; Bits de input
KEY_LEFT        EQU     $01
KEY_RIGHT       EQU     $02
KEY_UP          EQU     $04
KEY_DOWN        EQU     $08
KEY_SPACE       EQU     $10

READ_KEYBOARD:
        LD      A,(INPUT_STATE)
        LD      (INPUT_PREV),A
        
        XOR     A
        LD      (INPUT_STATE),A
        
        ; Leer fila 8 del teclado usando BIOS (evita tocar PPI directo)
        LD      A,8
        CALL    SNSMAT              ; A = estado fila (activo bajo)
        
        LD      B,A
        XOR     A                   ; acumulador de INPUT_STATE
        
        ; Right -> KEY_RIGHT
        BIT     4,B
        JR      Z,RK_NO_RIGHT
        JR      RK_CHECK_LEFT
RK_NO_RIGHT:
        OR      KEY_RIGHT
RK_CHECK_LEFT:
        ; Left -> KEY_LEFT
        BIT     5,B
        JR      Z,RK_NO_LEFT
        JR      RK_CHECK_DOWN
RK_NO_LEFT:
        OR      KEY_LEFT
RK_CHECK_DOWN:
        ; Down -> KEY_DOWN
        BIT     6,B
        JR      Z,RK_NO_DOWN
        JR      RK_CHECK_UP
RK_NO_DOWN:
        OR      KEY_DOWN
RK_CHECK_UP:
        ; Up -> KEY_UP
        BIT     7,B
        JR      Z,RK_NO_UP
        JR      RK_CHECK_SPACE
RK_NO_UP:
        OR      KEY_UP
RK_CHECK_SPACE:
        ; Space (bit0) -> KEY_SPACE
        BIT     0,B
        JR      Z,RK_NO_SPACE
        JR      RK_DONE
RK_NO_SPACE:
        OR      KEY_SPACE
RK_DONE:
        LD      (INPUT_STATE),A
        RET

;==============================================================================
; UPDATE PLAYER - Fisicas y movimiento
;==============================================================================

UPDATE_PLAYER:
        LD      A,(PLY_ALIVE)
        OR      A
        RET     Z
        
        ; --- Movimiento horizontal ---
        LD      A,(INPUT_STATE)
        
        BIT     0,A             ; KEY_LEFT
        JR      Z,UP_NO_LEFT
        ; Mover izquierda
        LD      A,(PLY_X)
        SUB     PLAYER_SPEED
        JP      M,UP_STOP_LEFT  ; si negativo, parar
        ; Verificar colision izq
        LD      D,A             ; D = nuevo X
        LD      (TEMP1),A
        LD      A,(PLY_Y)
        ADD     A,4             ; punto medio altura
        CALL    CHECK_TILE_SOLID_XY_D
        LD      B,A
        LD      A,(PLY_Y)
        ADD     A,14
        CALL    CHECK_TILE_SOLID_XY_D ; check abajo-izq
        OR      B
        JR      NZ,UP_STOP_LEFT
        LD      A,(TEMP1)
        LD      (PLY_X),A
        LD      A,1
        LD      (PLY_DIR),A
        JR      UP_NO_LEFT
UP_STOP_LEFT:
UP_NO_LEFT:
        
        LD      A,(INPUT_STATE)
        BIT     1,A             ; KEY_RIGHT
        JR      Z,UP_NO_RIGHT
        LD      A,(PLY_X)
        ADD     A,PLAYER_SPEED
        CP      240             ; limite derecho (240 = 30 tiles * 8)
        JR      NC,UP_STOP_RIGHT
        LD      (TEMP1),A
        ; Verificar colision derecha (X+16)
        ADD     A,14
        LD      D,A             ; D = X derecho
        LD      A,(PLY_Y)
        ADD     A,4
        CALL    CHECK_TILE_SOLID_XY_D
        LD      B,A
        LD      A,(PLY_Y)
        ADD     A,14
        CALL    CHECK_TILE_SOLID_XY_D
        OR      B
        JR      NZ,UP_STOP_RIGHT
        LD      A,(TEMP1)
        LD      (PLY_X),A
        XOR     A
        LD      (PLY_DIR),A
        JR      UP_NO_RIGHT
UP_STOP_RIGHT:
UP_NO_RIGHT:
        
        ; --- Salto ---
        LD      A,(INPUT_STATE)
        BIT     4,A             ; KEY_SPACE
        JR      Z,UP_NO_JUMP
        LD      A,(PLY_ON_GROUND)
        OR      A
        JR      Z,UP_NO_JUMP
        ; Iniciar salto
        LD      A,256-JUMP_FORCE ; velocidad Y negativa (subir)
        LD      (PLY_VY),A
        XOR     A
        LD      (PLY_ON_GROUND),A
        ; Sonido salto
        CALL    PLAY_JUMP_SFX
UP_NO_JUMP:
        
        ; --- Gravedad ---
        LD      A,(PLY_VY)
        BIT     7,A             ; VY negativa (subiendo)?
        JR      NZ,UP_VY_NEG
        ; VY positiva: aplicar gravedad y limitar caida maxima
        ADD     A,GRAVITY
        CP      MAX_FALL
        JR      C,UP_VY_OK
        LD      A,MAX_FALL
        JR      UP_VY_OK
UP_VY_NEG:
        ; VY negativa: acercar gradualmente a 0 sin clamp de caida
        ADD     A,GRAVITY
UP_VY_OK:
        LD      (PLY_VY),A
        
        ; --- Aplicar velocidad Y ---
        LD      A,(PLY_Y)
        LD      B,A
        LD      A,(PLY_VY)
        ; VY puede ser negativo (como byte: >127 = negativo)
        BIT     7,A             ; negativo?
        JR      Z,UP_MOVING_DOWN
        
        ; Moviendo hacia arriba
        ADD     A,B             ; Y + VY (VY negativo)
        JP      M,UP_HIT_TOP    ; si resultado negativo, techo
        ; Comprobar colision techo
        LD      (TEMP1),A
        LD      E,A
        LD      A,(PLY_X)
        ADD     A,4
        LD      D,A
        LD      A,E
        CALL    CHECK_TILE_SOLID_XY_D
        OR      A
        JR      NZ,UP_HIT_TOP
        LD      A,(TEMP1)
        LD      (PLY_Y),A
        JR      UP_APPLY_Y_DONE
UP_HIT_TOP:
        XOR     A               ; VY = 0 al golpear techo
        LD      (PLY_VY),A
        JR      UP_APPLY_Y_DONE
        
UP_MOVING_DOWN:
        ; Moviendo hacia abajo
        ADD     A,B             ; Y + VY
        ; Comprobar colision suelo (Y+16)
        LD      (TEMP1),A
        LD      C,A
        ADD     A,15            ; pie del sprite
        LD      E,A
        LD      A,(PLY_X)
        ADD     A,2
        LD      D,A
        LD      A,E
        CALL    CHECK_TILE_SOLID_XY_D
        LD      B,A
        ; Tambien check derecha
        LD      A,D
        ADD     A,12
        LD      D,A
        LD      A,E
        CALL    CHECK_TILE_SOLID_XY_D
        OR      B
        JR      Z,UP_NO_LAND
        ; Aterrizar
        LD      A,(TEMP1)       ; snap al suelo
        ; Calcular Y snap (alinear a tile)
        ADD     A,15
        AND     %11111000       ; round al tile
        SUB     15
        LD      (PLY_Y),A
        XOR     A
        LD      (PLY_VY),A
        LD      A,1
        LD      (PLY_ON_GROUND),A
        JR      UP_APPLY_Y_DONE
UP_NO_LAND:
        LD      A,(TEMP1)
        LD      (PLY_Y),A
        XOR     A
        LD      (PLY_ON_GROUND),A
        ; Limite inferior pantalla
        LD      A,(PLY_Y)
        CP      175
        JR      C,UP_APPLY_Y_DONE
        LD      A,175
        LD      (PLY_Y),A
        LD      A,1
        LD      (PLY_ON_GROUND),A
        XOR     A
        LD      (PLY_VY),A
        
UP_APPLY_Y_DONE:
        ; Verificar pinchos
        CALL    CHECK_SPIKES
        
        ; Animar player
        LD      A,(FRAME_COUNT)
        AND     $07
        JR      NZ,UP_NO_ANIM
        LD      A,(PLY_FRAME)
        INC     A
        AND     $03
        LD      (PLY_FRAME),A
UP_NO_ANIM:
        RET

;==============================================================================
; CHECK_TILE_SOLID_XY_D - Verifica si tile en (D=x_pixel, A=y_pixel) es solido
; Entrada: D=X pixel, A=Y pixel
; Salida: A=0 libre, A=1 solido
;==============================================================================

CHECK_TILE_SOLID_XY_D:
        ; Convertir pixels a tiles
        SRL     A               ; Y/8 = tile row
        SRL     A
        SRL     A
        LD      E,A             ; E = tile row
        LD      A,D
        SRL     A               ; X/8 = tile col
        SRL     A
        SRL     A
        LD      D,A             ; D = tile col
        
        ; Bounds check
        LD      A,E
        CP      24
        JR      NC,CTSD_SOLID   ; fuera abajo = solido
        LD      A,D
        CP      32
        JR      NC,CTSD_FREE    ; fuera lateral = libre
        
        ; Calcular indice: row*32 + col
        LD      A,E
        LD      H,0
        LD      L,A
        ADD     HL,HL           ; *2
        ADD     HL,HL           ; *4
        ADD     HL,HL           ; *8
        ADD     HL,HL           ; *16
        ADD     HL,HL           ; *32
        LD      A,D
        ADD     A,L
        LD      L,A
        JR      NC,CTSD_NO_OV
        INC     H
CTSD_NO_OV:
        ; HL = offset en mapa
        ; Leer tile
        PUSH    DE
        LD      DE,LEVEL_MAP
        ADD     HL,DE
        LD      A,(HL)
        POP     DE
        
        ; Verificar si es tile solido
        OR      A
        JR      Z,CTSD_FREE     ; 0 = vacio
        CP      TILE_GEM
        JR      Z,CTSD_FREE     ; gem = no solido
        CP      TILE_DECO
        JR      Z,CTSD_FREE     ; deco = no solido
        CP      TILE_SCORE_BG
        JR      Z,CTSD_FREE     ; hud = libre para player
        ; Todo lo demas es solido (1,2,3,4,6,8,9...)
        ; LADDER no es solido lateralmente pero si verticalmente
        ; Simplificacion: solo 0,5,7,9 son libres
        LD      A,1
        RET
CTSD_FREE:
        XOR     A
        RET
CTSD_SOLID:
        LD      A,1
        RET

; Version con HL como coordenadas
CHECK_TILE_SOLID_XY:
        PUSH    DE
        LD      D,L             ; D=X, A=Y
        CALL    CHECK_TILE_SOLID_XY_D
        POP     DE
        RET

;==============================================================================
; CHECK_SPIKES - Si player sobre pinchos, game over
;==============================================================================

CHECK_SPIKES:
        ; Obtener tile bajo player
        LD      A,(PLY_Y)
        ADD     A,15            ; pie
        SRL     A
        SRL     A
        SRL     A               ; tile row
        LD      E,A
        LD      A,(PLY_X)
        ADD     A,8             ; centro X
        SRL     A
        SRL     A
        SRL     A               ; tile col
        LD      D,A
        
        ; Calcular indice
        LD      H,0
        LD      L,E
        ADD     HL,HL
        ADD     HL,HL
        ADD     HL,HL
        ADD     HL,HL
        ADD     HL,HL           ; *32
        LD      A,D
        ADD     A,L
        LD      L,A
        JR      NC,CS_NO_OV2
        INC     H
CS_NO_OV2:
        LD      DE,LEVEL_MAP
        ADD     HL,DE
        LD      A,(HL)
        CP      TILE_SPIKES
        RET     NZ
        
        ; Pinchos! -> Game Over
        CALL    TRIGGER_DEATH
        RET

;==============================================================================
; UPDATE GHOSTS
;==============================================================================

UPDATE_GHOSTS:
        ; --- Fantasma 1 ---
        LD      A,(GH1_X)
        LD      B,A
        LD      A,(GH1_DIR)
        OR      A
        JR      NZ,UG1_LEFT
        ; Mover derecha
        LD      A,B
        ADD     A,GHOST_SPEED
        LD      (GH1_X),A
        LD      A,(GH1_MAX)
        LD      B,A
        LD      A,(GH1_X)
        CP      B
        JR      C,UG1_DONE
        ; Cambiar direccion
        LD      A,1
        LD      (GH1_DIR),A
        JR      UG1_DONE
UG1_LEFT:
        LD      A,(GH1_X)
        SUB     GHOST_SPEED
        LD      (GH1_X),A
        LD      A,(GH1_MIN)
        LD      B,A
        LD      A,(GH1_X)
        CP      B
        JR      NC,UG1_DONE
        XOR     A
        LD      (GH1_DIR),A
UG1_DONE:
        ; Animar fantasma 1
        LD      A,(FRAME_COUNT)
        AND     $0F
        JR      NZ,UG2_START
        LD      A,(GH1_FRAME)
        INC     A
        AND     $01
        LD      (GH1_FRAME),A
        
UG2_START:
        ; --- Fantasma 2 ---
        LD      A,(GH2_X)
        LD      B,A
        LD      A,(GH2_DIR)
        OR      A
        JR      NZ,UG2_LEFT
        LD      A,B
        ADD     A,GHOST_SPEED
        LD      (GH2_X),A
        LD      A,(GH2_MAX)
        LD      B,A
        LD      A,(GH2_X)
        CP      B
        JR      C,UG2_DONE
        LD      A,1
        LD      (GH2_DIR),A
        JR      UG2_DONE
UG2_LEFT:
        LD      A,(GH2_X)
        SUB     GHOST_SPEED
        LD      (GH2_X),A
        LD      A,(GH2_MIN)
        LD      B,A
        LD      A,(GH2_X)
        CP      B
        JR      NC,UG2_DONE
        XOR     A
        LD      (GH2_DIR),A
UG2_DONE:
        RET

;==============================================================================
; CHECK_GEM_COLLISION - Verificar si player recoge gema
;==============================================================================

CHECK_GEM_COLLISION:
        LD      B,MAX_GEMS
        LD      C,0             ; indice gema
        LD      HL,GEM_ACTIVE
        
CGC_LOOP:
        LD      A,(HL)
        OR      A
        JP      Z,CGC_NEXT      ; gema inactiva
        
        ; Obtener posicion gema
        PUSH    HL
        PUSH    BC
        LD      HL,GEM_X
        LD      A,C
        ADD     A,L
        LD      L,A
        LD      A,(HL)
        LD      (TEMP1),A       ; GemX
        LD      HL,GEM_Y
        LD      A,C
        ADD     A,L
        LD      L,A
        LD      A,(HL)
        LD      (TEMP2),A       ; GemY
        POP     BC
        POP     HL
        
        ; Verificar proximidad (bounding box simple)
        ; |PLY_X - GEM_X| < 12 y |PLY_Y - GEM_Y| < 12
        LD      A,(PLY_X)
        LD      D,A
        LD      A,(TEMP1)
        SUB     D
        JP      P,CGC_POS_X
        NEG
CGC_POS_X:
        CP      12
        JR      NC,CGC_NEXT
        
        LD      A,(PLY_Y)
        LD      D,A
        LD      A,(TEMP2)
        SUB     D
        JP      P,CGC_POS_Y
        NEG
CGC_POS_Y:
        CP      12
        JR      NC,CGC_NEXT
        
        ; Colision! Recoger gema
        PUSH    HL
        PUSH    BC
        LD      (HL),0          ; desactivar gema
        
        ; Borrar gema del mapa (escribir tile 0 en su posicion)
        LD      A,(TEMP2)       ; GemY pixel
        SRL     A
        SRL     A
        SRL     A               ; tile row
        LD      H,0
        LD      L,A
        ADD     HL,HL
        ADD     HL,HL
        ADD     HL,HL
        ADD     HL,HL
        ADD     HL,HL           ; *32
        LD      A,(TEMP1)       ; GemX pixel
        SRL     A
        SRL     A
        SRL     A               ; tile col
        ADD     A,L
        LD      L,A
        JR      NC,CGC_NO_OV
        INC     H
CGC_NO_OV:
        ; Escribir 0 en name table VRAM
        PUSH    HL
        LD      DE,SCR2_NAME_TABLE
        ADD     HL,DE
        ; SET VRAM WRITE
        LD      A,L
        OUT     (VDP_CTRL),A
        LD      A,H
        OR      $40
        OUT     (VDP_CTRL),A
        XOR     A
        OUT     (VDP_DATA),A
        ; Tambien borrar en el mapa RAM
        POP     HL
        LD      DE,LEVEL_MAP
        ADD     HL,DE
        LD      (HL),0
        
        ; Actualizar score
        LD      A,(SCORE)
        ADD     A,1
        LD      (SCORE),A
        
        ; Decrementar gemas restantes
        LD      A,(GEMS_LEFT)
        DEC     A
        LD      (GEMS_LEFT),A
        
        ; Sonido gema
        CALL    PLAY_GEM_SFX
        
        ; Victoria si todas recogidas
        OR      A
        JR      NZ,CGC_NO_WIN
        LD      A,2
        LD      (GAME_STATE),A
CGC_NO_WIN:
        POP     BC
        POP     HL
        
CGC_NEXT:
        INC     HL
        INC     C
        DEC     B
        JP      NZ,CGC_LOOP
        RET

;==============================================================================
; CHECK_GHOST_COLLISION
;==============================================================================

CHECK_GHOST_COLLISION:
        ; Verificar fantasma 1
        LD      A,(PLY_X)
        LD      B,A
        LD      A,(GH1_X)
        SUB     B
        JP      P,CGH_POS1
        NEG
CGH_POS1:
        CP      12
        JR      NC,CGH_CHECK2
        LD      A,(PLY_Y)
        LD      B,A
        LD      A,(GH1_Y)
        SUB     B
        JP      P,CGH_POS1Y
        NEG
CGH_POS1Y:
        CP      12
        JR      NC,CGH_CHECK2
        ; Colision!
        CALL    TRIGGER_DEATH
        RET
        
CGH_CHECK2:
        ; Verificar fantasma 2
        LD      A,(PLY_X)
        LD      B,A
        LD      A,(GH2_X)
        SUB     B
        JP      P,CGH_POS2
        NEG
CGH_POS2:
        CP      12
        RET     NC
        LD      A,(PLY_Y)
        LD      B,A
        LD      A,(GH2_Y)
        SUB     B
        JP      P,CGH_POS2Y
        NEG
CGH_POS2Y:
        CP      12
        RET     NC
        CALL    TRIGGER_DEATH
        RET

;==============================================================================
; TRIGGER_DEATH
;==============================================================================

TRIGGER_DEATH:
        XOR     A
        LD      (PLY_ALIVE),A
        LD      A,1
        LD      (GAME_STATE),A
        CALL    PLAY_DEATH_SFX
        RET

;==============================================================================
; UPDATE SPRITES - Actualizar atributos sprite en VRAM
; Formato sprite attr: Y, X, Pattern, Color (4 bytes por sprite)
;==============================================================================

UPDATE_SPRITES:
        ; Calcular offset VDP para sprite attr table
        ; SPR_ATTR = $1B00
        
        ; --- Player Layer 1 (sprite 0) ---
        LD      A,$00
        OUT     (VDP_CTRL),A
        LD      A,$5B
        OUT     (VDP_CTRL),A
        
        ; Y
        LD      A,(PLY_Y)
        DEC     A               ; VDP: Y es +1
        OUT     (VDP_DATA),A
        NOP
        ; X
        LD      A,(PLY_X)
        OUT     (VDP_DATA),A
        NOP
        ; Pattern (SPT_PLAYER1 = 0, en modo 16x16 son *4)
        LD      A,SPT_PLAYER1 * 4
        OUT     (VDP_DATA),A
        NOP
        ; Color = WHITE (15)
        LD      A,COL_WHITE
        OUT     (VDP_DATA),A
        NOP
        
        ; --- Player Layer 2 (sprite 1) ---
        ; Y
        LD      A,(PLY_Y)
        DEC     A
        OUT     (VDP_DATA),A
        NOP
        ; X
        LD      A,(PLY_X)
        OUT     (VDP_DATA),A
        NOP
        ; Pattern
        LD      A,SPT_PLAYER2 * 4
        OUT     (VDP_DATA),A
        NOP
        ; Color = YELLOW
        LD      A,COL_YELLOW
        OUT     (VDP_DATA),A
        NOP
        
        ; --- Fantasma 1 Layer 1 (sprite 2) ---
        LD      A,(GH1_Y)
        DEC     A
        OUT     (VDP_DATA),A
        NOP
        LD      A,(GH1_X)
        OUT     (VDP_DATA),A
        NOP
        LD      A,SPT_GHOST1 * 4
        OUT     (VDP_DATA),A
        NOP
        LD      A,COL_MAGENTA
        OUT     (VDP_DATA),A
        NOP
        
        ; --- Fantasma 1 Layer 2 (sprite 3) ---
        LD      A,(GH1_Y)
        DEC     A
        OUT     (VDP_DATA),A
        NOP
        LD      A,(GH1_X)
        OUT     (VDP_DATA),A
        NOP
        LD      A,SPT_GHOST2 * 4
        OUT     (VDP_DATA),A
        NOP
        LD      A,COL_WHITE
        OUT     (VDP_DATA),A
        NOP
        
        ; --- Fantasma 2 Layer 1 (sprite 4) ---
        LD      A,(GH2_Y)
        DEC     A
        OUT     (VDP_DATA),A
        NOP
        LD      A,(GH2_X)
        OUT     (VDP_DATA),A
        NOP
        LD      A,SPT_GHOST1 * 4
        OUT     (VDP_DATA),A
        NOP
        LD      A,COL_RED
        OUT     (VDP_DATA),A
        NOP
        
        ; --- Fantasma 2 Layer 2 (sprite 5) ---
        LD      A,(GH2_Y)
        DEC     A
        OUT     (VDP_DATA),A
        NOP
        LD      A,(GH2_X)
        OUT     (VDP_DATA),A
        NOP
        LD      A,SPT_GHOST2 * 4
        OUT     (VDP_DATA),A
        NOP
        LD      A,COL_YELLOW
        OUT     (VDP_DATA),A
        NOP
        
        ; Sprite 6 = terminador $D0
        LD      A,$D0
        OUT     (VDP_DATA),A
        NOP
        XOR     A
        OUT     (VDP_DATA),A
        NOP
        OUT     (VDP_DATA),A
        NOP
        OUT     (VDP_DATA),A
        NOP
        
        RET

;==============================================================================
; DRAW HUD - Marcador superior
;==============================================================================

DRAW_HUD:
        ; Escribir texto en fila 0 y 1 del name table
        ; Usaremos tiles de digits (10-15 = 0-5)
        ; Fila 0: "GEMS: X" en tiles de la zona HUD
        
        ; Posicion name table fila 0, columna 1
        LD      DE,SCR2_NAME_TABLE + 1
        LD      A,E
        OUT     (VDP_CTRL),A
        LD      A,D
        OR      $40
        OUT     (VDP_CTRL),A
        
        ; Escribir patron "G" -> usaremos caracteres ASCII en tiles
        ; Simplificacion: mostrar score como numero en tiles digit
        ; Tiles 10=0, 11=1, 12=2, 13=3, 14=4, 15=5
        
        LD      A,(SCORE)
        ; Decenas
        LD      B,A
        LD      A,10
        PUSH    AF
        LD      A,B
        LD      B,0
DH_DIV10:
        CP      10
        JR      C,DH_DIV_DONE
        SUB     10
        INC     B
        JR      DH_DIV10
DH_DIV_DONE:
        ; B=decenas, A=unidades
        LD      C,A             ; guardar unidades
        LD      A,B
        ADD     A,10            ; tile digit decenas
        OUT     (VDP_DATA),A
        NOP
        LD      A,C
        ADD     A,10            ; tile digit unidades
        OUT     (VDP_DATA),A
        NOP
        
        RET

;==============================================================================
; SHOW GAME OVER
;==============================================================================

SHOW_GAME_OVER:
        ; Escribir texto GAME OVER en el centro de la pantalla
        ; Fila 11, columna 10
        LD      A,(FRAME_COUNT)
        CP      2
        RET     NZ              ; solo hacer una vez al inicio
        
        ; Dibujar rectangulo oscuro (tiles solidos azul)
        LD      HL,SCR2_NAME_TABLE + (11*32) + 8
        LD      A,L
        OUT     (VDP_CTRL),A
        LD      A,H
        OR      $40
        OUT     (VDP_CTRL),A
        
        ; Escribir "GAME OVER" usando tiles
        ; Tiles: G=0,A=0,M=0... usamos patron especial
        ; Simplificacion: escribir tiles negros con mensaje
        ; En una implementacion completa tendriamos tiles de letras
        
        ; Por ahora flashear pantalla (colorear fondo)
        LD      A,$61           ; rojo sobre negro
        LD      B,7
        CALL    WRITE_VDP_REG
        
        RET

;==============================================================================
; SHOW WIN
;==============================================================================

SHOW_WIN:
        LD      A,(FRAME_COUNT)
        CP      2
        RET     NZ
        
        ; Color borde amarillo = victoria
        LD      A,$B1           ; amarillo
        LD      B,7
        CALL    WRITE_VDP_REG
        
        RET

;==============================================================================
; RESTART GAME
;==============================================================================

RESTART_GAME:
        ; Resetear color borde
        LD      A,$01
        LD      B,7
        CALL    WRITE_VDP_REG

        ; Cortar cualquier sonido sostenido previo
        CALL    SILENCE_PSG
        
        ; Redibujar mapa
        CALL    DRAW_MAP
        
        ; Reinicializar nivel
        CALL    INIT_LEVEL
        
        ; Estado juego
        XOR     A
        LD      (GAME_STATE),A
        
        RET

;==============================================================================
; WAIT KEY SPACE
;==============================================================================

WAIT_KEY_SPACE:
WKS_LOOP:
        CALL    WAIT_VSYNC
        CALL    READ_KEYBOARD
        LD      A,(INPUT_STATE)
        BIT     4,A
        JR      Z,WKS_LOOP
        RET

;==============================================================================
; SOUND EFFECTS (usando PSG AY-3-8910)
;==============================================================================

SILENCE_PSG:
        ; Apagar volumen canales A/B/C
        LD      A,8
        OUT     (PSG_REG),A
        XOR     A
        OUT     (PSG_WRITE),A
        LD      A,9
        OUT     (PSG_REG),A
        XOR     A
        OUT     (PSG_WRITE),A
        LD      A,10
        OUT     (PSG_REG),A
        XOR     A
        OUT     (PSG_WRITE),A
        ; Deshabilitar tono y ruido en A/B/C
        LD      A,7
        OUT     (PSG_REG),A
        LD      A,$FF
        OUT     (PSG_WRITE),A
        RET

PLAY_JUMP_SFX:
        ; Tono corto y siempre auto-silenciado
        CALL    SILENCE_PSG
        LD      A,0
        OUT     (PSG_REG),A     ; reg 0 = tono A low
        LD      A,$30
        OUT     (PSG_WRITE),A
        LD      A,1
        OUT     (PSG_REG),A     ; reg 1 = tono A high
        XOR     A
        OUT     (PSG_WRITE),A
        LD      A,7
        OUT     (PSG_REG),A
        LD      A,$FE           ; habilitar solo tono A
        OUT     (PSG_WRITE),A
        LD      A,8
        OUT     (PSG_REG),A     ; reg 8 = vol A
        LD      A,$0A
        OUT     (PSG_WRITE),A
        LD      B,24
PJS_WAIT:
        DJNZ    PJS_WAIT
        JP      SILENCE_PSG

PLAY_GEM_SFX:
        ; Tono más agudo, breve
        CALL    SILENCE_PSG
        LD      A,0
        OUT     (PSG_REG),A
        LD      A,$14
        OUT     (PSG_WRITE),A
        LD      A,1
        OUT     (PSG_REG),A
        XOR     A
        OUT     (PSG_WRITE),A
        LD      A,7
        OUT     (PSG_REG),A
        LD      A,$FE
        OUT     (PSG_WRITE),A
        LD      A,8
        OUT     (PSG_REG),A
        LD      A,$08
        OUT     (PSG_WRITE),A
        LD      B,16
PGS_WAIT:
        DJNZ    PGS_WAIT
        JP      SILENCE_PSG

PLAY_DEATH_SFX:
        ; Ruido corto de muerte, luego silencio
        CALL    SILENCE_PSG
        LD      A,6
        OUT     (PSG_REG),A     ; ruido
        LD      A,$10
        OUT     (PSG_WRITE),A
        LD      A,7
        OUT     (PSG_REG),A
        LD      A,$F7           ; habilitar ruido en canal A
        OUT     (PSG_WRITE),A
        LD      A,8
        OUT     (PSG_REG),A
        LD      A,$09
        OUT     (PSG_WRITE),A
        LD      B,40
PDS_WAIT:
        DJNZ    PDS_WAIT
        JP      SILENCE_PSG

;==============================================================================
; TABLAS DE DATOS ADICIONALES
;==============================================================================

; Tabla de digits extendida (tiles 6-9: digitos 6-9)
EXTRA_DIGIT_TILES:
; Tile para digito 6
        DB      $1C,$30,$7C,$66,$66,$66,$3C,$00
; Tile para digito 7
        DB      $7E,$66,$0C,$18,$18,$18,$18,$00
; Tile para digito 8
        DB      $3C,$66,$66,$3C,$66,$66,$3C,$00
; Tile para digito 9
        DB      $3C,$66,$66,$3E,$06,$0C,$38,$00

;==============================================================================
; RELLENO Y FIN DE ROM
;==============================================================================

        ; Asegurar que tenemos al menos $8000 bytes de ROM (32K)
        DS      $8000 - ($ - $4000), $FF

        END
