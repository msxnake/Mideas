;	""
;Agente:
;	Eres un programador de videojuegos de la vieja escuela, con conocimientos de la era 8bit. Con conocimientos Z80, asm.
;	Conocimientos arquitectura de un MSX.
;	Conocimientos de glass.jar
;
;Tu trabajo: 
;	Hacer un mini-juego programado en asm para MSX de primera generaciÃƒÂ³n. 
;
;Herramientas: 
;	Hazlo en asm para el compilar glass.jar, que es un compilador cruzado,
;si no sabes sus caracterÃƒÂ­sticas buscalas en la nube.
;Incluye una cabecera header "AB" para ".rom". Tipo konami. 
;Usa Screen 2, pantalla fondo negro, con tiles redefinidos en los 3 bancos de screen 2, sprites 16x16.
;No uses dos o mas directivas ORG. Para variables en Ram usa EQU con direcciÃƒÂ³n directa a partir de $C000.
;No uses jr, en su lugar siempre jp. 
;Usa sprites MSX cogidos de internet, con sus db
;Asegurate que el personaje puede llegar saltando a las plataformas.
;
;
;Descripcion: 
;	Escribe el minijuego  tipo Manic Miner. Generar estructura colision tiles solidos (chars redefinidos).
;	Personaje principal en Sprite Hardware de 2 layers, cada layer distinto color.
;	Un juego tipo plataformas que mueves un personaje con los cursores y saltas con spc, recoges gemas y evitas fantasmas que tienen movimiento tipo patrulla. 
;	Un  marcador en la zona superior con el numero de gemas recogidas. 
;	Si los fantasmas nos tocan se acaba la partida. Y mensaje de Game Over.
;
;""
; ============================================================================
; MANIC MINER CLONE - MSX1
; Compilador: Glass (glass.jar)
; Formato: ROM 16KB tipo Konami/AB header
; Screen 2 - Sprites 16x16 - 2 layers por personaje
; ============================================================================

; --- CONSTANTES DEL SISTEMA MSX ---
VDP_DATA        EQU     $98
VDP_CTRL        EQU     $99
SNSMAT          EQU     $0141           ; BIOS: Leer teclado
CLIKSW          EQU     $F3DB           ; Click del teclado
PSG_ADDR_PORT   EQU     $A0             ; PSG: seleccionar registro
PSG_DATA_PORT   EQU     $A1             ; PSG: escribir dato

; --- DIRECCIONES VRAM (SCREEN 2) ---
VRAM_PATTERNS0  EQU     $0000           ; Patrones banco 0 (chars 0-255)
VRAM_PATTERNS1  EQU     $0800           ; Patrones banco 1
VRAM_PATTERNS2  EQU     $1000           ; Patrones banco 2
VRAM_NAMES      EQU     $1800           ; Tabla de nombres
VRAM_COLORS0    EQU     $2000           ; Colores banco 0
VRAM_COLORS1    EQU     $2800           ; Colores banco 1
VRAM_COLORS2    EQU     $3000           ; Colores banco 2
VRAM_SPRITES_PAT EQU    $3800           ; Patrones sprites
VRAM_SPRITES_ATR EQU    $1B00           ; Atributos sprites

; --- COLORES MSX ---
COLOR_BLACK     EQU     1
COLOR_GREEN     EQU     3
COLOR_BLUE      EQU     5
COLOR_RED       EQU     6
COLOR_CYAN      EQU     7
COLOR_YELLOW    EQU     10
COLOR_WHITE     EQU     15
COLOR_MAGENTA   EQU     13

; --- VARIABLES EN RAM (desde $C000) ---
PLAYER_X        EQU     $C000           ; PosiciÃƒÂ³n X jugador
PLAYER_Y        EQU     $C001           ; PosiciÃƒÂ³n Y jugador
PLAYER_VY       EQU     $C002           ; Velocidad vertical (signed)
PLAYER_ONGROUND EQU     $C003           ; Flag: 1 si estÃƒÂ¡ en suelo
PLAYER_DIR      EQU     $C004           ; DirecciÃƒÂ³n: 0=izq, 1=der
PLAYER_FRAME    EQU     $C005           ; Frame animaciÃƒÂ³n

GHOST1_X        EQU     $C010           ; Fantasma 1 X
GHOST1_Y        EQU     $C011           ; Fantasma 1 Y
GHOST1_DIR      EQU     $C012           ; Fantasma 1 direcciÃƒÂ³n
GHOST1_MIN      EQU     $C013           ; LÃƒÂ­mite izquierdo
GHOST1_MAX      EQU     $C014           ; LÃƒÂ­mite derecho

GHOST2_X        EQU     $C020           ; Fantasma 2 X
GHOST2_Y        EQU     $C021           ; Fantasma 2 Y
GHOST2_DIR      EQU     $C022           ; Fantasma 2 direcciÃƒÂ³n
GHOST2_MIN      EQU     $C023           ; LÃƒÂ­mite izquierdo
GHOST2_MAX      EQU     $C024           ; LÃƒÂ­mite derecho

GEMS_COUNT      EQU     $C030           ; Gemas recogidas
GAME_STATE      EQU     $C031           ; 0=jugando, 1=game over
FRAME_COUNT     EQU     $C032           ; Contador frames
CURRENT_SCREEN  EQU     $C033           ; 0=pantalla inicio, 1=pantalla 2, 2=pantalla 3
JUMP_ACTIVE     EQU     $C034           ; 1 si se esta ejecutando perfil de salto
JUMP_INDEX      EQU     $C035           ; indice actual del perfil de salto
JUMP_REPEAT     EQU     $C036           ; pasos restantes (1 px/frame) del valor actual
JUMP_DELAY      EQU     $C037           ; frames de espera entre subpasos de salto
GEM_SFX_TIMER   EQU     $C038           ; frames restantes del sonido de gema
GO_SFX_ACTIVE   EQU     $C039           ; 1 si jingle de game over activo
GO_SFX_STEP     EQU     $C03A           ; paso actual del jingle
GO_SFX_TIMER    EQU     $C03B           ; frames restantes de la nota actual
TEMP_BYTE       EQU     $C040           ; Temporal
TEMP_WORD       EQU     $C041           ; Temporal 2 bytes
LEVEL_MAP_RAM   EQU     $C100           ; Copia mutable del mapa (24x32 = 768 bytes)
LEVEL_MAP_SIZE  EQU     24*32

; --- CONSTANTES DEL JUEGO ---
GRAVITY         EQU     1               ; Fuerza gravedad
JUMP_FORCE      EQU     -4              ; Impulso inicial (referencia)
MAX_FALL        EQU     4               ; Limite de velocidad de caida
PLAYER_SPEED    EQU     1               ; Movimiento horizontal mas suave
HERO_IDLE_PAT1  EQU     80              ; Hero idle capa 1 (mirando izquierda)
HERO_IDLE_PAT2  EQU     84              ; Hero idle capa 2 (mirando izquierda)
HERO_IDLE_MIRROR_PAT1 EQU 88            ; Hero idle capa 1 (mirando derecha)
HERO_IDLE_MIRROR_PAT2 EQU 92            ; Hero idle capa 2 (mirando derecha)
GEMS_TO_SCREEN2 EQU     12              ; Al llegar, cambiar a pantalla 2
GEMS_TO_SCREEN3 EQU     24              ; Al llegar, cambiar a pantalla 3
JUMP_PROFILE_LEN EQU    21              ; pasos del vector de salto

; --- TILES DEL MAPA ---
TILE_EMPTY      EQU     0               ; VacÃƒÂ­o
TILE_PLATFORM   EQU     1               ; Plataforma sÃƒÂ³lida
TILE_GEM        EQU     2               ; Gema coleccionable
TILE_WALL       EQU     3               ; Pared lateral
TILE_BRICK_L_VIS EQU    7               ; Ladrillo azul (mitad izquierda visual)
TILE_BRICK_R_VIS EQU    8               ; Ladrillo azul (mitad derecha visual)
TILE_HUD_TL     EQU     9               ; HUD esquina izquierda
TILE_HUD_H      EQU     10              ; HUD borde horizontal
TILE_HUD_TR     EQU     11              ; HUD esquina derecha
TILE_HUD_VL     EQU     12              ; HUD borde vertical izquierdo
TILE_HUD_VR     EQU     13              ; HUD borde vertical derecho
TILE_CHAR_C     EQU     14              ; Letra C para SCORE
TILE_CHAR_L     EQU     15              ; Letra L para LEVEL
TILE_HUD_BL     EQU     32              ; HUD esquina inferior izquierda
TILE_HUD_BR     EQU     33              ; HUD esquina inferior derecha
TOTAL_TILES     EQU     34              ; Total tiles definidos (0..33)

; ============================================================================
; HEADER ROM TIPO AB (KONAMI STYLE)
; ============================================================================
                ORG     $4000

                ; Cabecera ROM tipo AB
                DB      "AB"            ; ID de cartucho ROM
                DW      INIT            ; DirecciÃƒÂ³n de inicio
                DW      $0000           ; STATEMENT
                DW      $0000           ; DEVICE
                DW      $0000           ; TEXT
                DW      $0000,$0000,$0000 ; Reservado

; ============================================================================
; INICIO DEL PROGRAMA
; ============================================================================
INIT:
                DI                      ; Desactivar interrupciones
                LD      SP,$F380        ; Inicializar stack

                ; Desactivar click del teclado
                XOR     A
                LD      (CLIKSW),A

                ; Inicializar modo Screen 2
                CALL    SET_SCREEN2

                ; Cargar patrones de tiles en los 3 bancos
                CALL    LOAD_PATTERNS

                ; Cargar patrones de sprites
                CALL    LOAD_SPRITES

                ; Inicializar PSG y dejar canal de sfx en silencio
                CALL    INIT_SOUND

                ; Inicializar variables del juego
                CALL    INIT_GAME

                ; Dibujar pantalla del nivel
                CALL    DRAW_LEVEL
                CALL    DRAW_HUD_PANEL

                ; Dibujar marcador inicial
                CALL    DRAW_SCORE

                EI                      ; Habilitar interrupciones

; ============================================================================
; BUCLE PRINCIPAL
; ============================================================================
MAIN_LOOP:
                HALT                    ; Esperar VBlank

                LD      A,(GAME_STATE)
                OR      A
                JP      NZ,GAME_OVER_LOOP

                ; Actualizar frame counter
                LD      A,(FRAME_COUNT)
                INC     A
                LD      (FRAME_COUNT),A

                ; Leer controles
                CALL    READ_INPUT

                ; Aplicar fÃƒÂ­sica
                CALL    APPLY_PHYSICS

                ; Mover fantasmas
                CALL    MOVE_GHOSTS

                ; Comprobar colisiones
                CALL    CHECK_COLLISIONS

                ; Actualizar sprites
                CALL    UPDATE_SPRITES

                ; Actualizar marcador
                CALL    DRAW_SCORE
                CALL    UPDATE_SOUND

                JP      MAIN_LOOP

; ============================================================================
; GAME OVER LOOP
; ============================================================================
GAME_OVER_LOOP:
                CALL    DRAW_GAME_OVER
                HALT
                CALL    UPDATE_SOUND

                ; Esperar tecla SPACE para reiniciar
                LD      A,8
                CALL    SNSMAT
                BIT     0,A
                JP      NZ,GAME_OVER_LOOP

                ; Esperar a soltar tecla
WAIT_RELEASE:
                HALT
                LD      A,8
                CALL    SNSMAT
                BIT     0,A
                JP      Z,WAIT_RELEASE

                ; Reiniciar juego
                CALL    INIT_GAME
                CALL    DRAW_LEVEL
                CALL    DRAW_HUD_PANEL
                CALL    DRAW_SCORE
                JP      MAIN_LOOP

; ============================================================================
; SONIDO PSG (SFX GEMA)
; ============================================================================
INIT_SOUND:
                XOR     A
                LD      (GEM_SFX_TIMER),A
                LD      (GO_SFX_ACTIVE),A
                LD      (GO_SFX_STEP),A
                LD      (GO_SFX_TIMER),A
                CALL    STOP_GEM_PLINK
                RET

UPDATE_SOUND:
                ; SFX de gema (plink)
                LD      A,(GEM_SFX_TIMER)
                OR      A
                JP      Z,UPDATE_SOUND_GO
                DEC     A
                LD      (GEM_SFX_TIMER),A
                JP      NZ,UPDATE_SOUND_GO
                CALL    STOP_GEM_PLINK

UPDATE_SOUND_GO:
                ; Jingle de game over: "ta da naaa"
                LD      A,(GO_SFX_ACTIVE)
                OR      A
                RET     Z
                LD      A,(GO_SFX_TIMER)
                OR      A
                JP      Z,GO_SFX_NEXT_STEP
                DEC     A
                LD      (GO_SFX_TIMER),A
                RET

GO_SFX_NEXT_STEP:
                LD      A,(GO_SFX_STEP)
                CP      0
                JP      Z,GO_SFX_STEP0
                CP      1
                JP      Z,GO_SFX_STEP1
                CP      2
                JP      Z,GO_SFX_STEP2
                XOR     A
                LD      (GO_SFX_ACTIVE),A
                CALL    STOP_GEM_PLINK
                RET

GO_SFX_STEP0:
                ; "ta" - G5 (periodo $008F), corto
                LD      A,0
                LD      E,$8F
                CALL    PSG_WRITE_AE
                LD      A,1
                LD      E,$00
                CALL    PSG_WRITE_AE
                LD      A,7
                LD      E,$3E
                CALL    PSG_WRITE_AE
                LD      A,8
                LD      E,$0E
                CALL    PSG_WRITE_AE
                LD      A,6
                LD      (GO_SFX_TIMER),A
                LD      A,1
                LD      (GO_SFX_STEP),A
                RET

GO_SFX_STEP1:
                ; "da" - E5 (periodo $00AA), corto
                LD      A,0
                LD      E,$AA
                CALL    PSG_WRITE_AE
                LD      A,1
                LD      E,$00
                CALL    PSG_WRITE_AE
                LD      A,7
                LD      E,$3E
                CALL    PSG_WRITE_AE
                LD      A,8
                LD      E,$0E
                CALL    PSG_WRITE_AE
                LD      A,6
                LD      (GO_SFX_TIMER),A
                LD      A,2
                LD      (GO_SFX_STEP),A
                RET

GO_SFX_STEP2:
                ; "naaa" - C5 (periodo $00D6), largo
                LD      A,0
                LD      E,$D6
                CALL    PSG_WRITE_AE
                LD      A,1
                LD      E,$00
                CALL    PSG_WRITE_AE
                LD      A,7
                LD      E,$3E
                CALL    PSG_WRITE_AE
                LD      A,8
                LD      E,$0F
                CALL    PSG_WRITE_AE
                LD      A,22
                LD      (GO_SFX_TIMER),A
                LD      A,3
                LD      (GO_SFX_STEP),A
                RET

START_GAMEOVER_SFX:
                XOR     A
                LD      (GEM_SFX_TIMER),A
                LD      (GO_SFX_STEP),A
                LD      (GO_SFX_TIMER),A
                LD      A,1
                LD      (GO_SFX_ACTIVE),A
                RET

PLAY_GEM_PLINK:
                ; Tono agudo corto en canal A.
                LD      A,0             ; Fine tune canal A
                LD      E,$38
                CALL    PSG_WRITE_AE
                LD      A,1             ; Coarse tune canal A
                LD      E,$00
                CALL    PSG_WRITE_AE
                LD      A,7             ; Mixer: solo tono A activo
                LD      E,$3E
                CALL    PSG_WRITE_AE
                LD      A,8             ; Volumen canal A
                LD      E,$0F
                CALL    PSG_WRITE_AE
                LD      A,4
                LD      (GEM_SFX_TIMER),A
                RET

STOP_GEM_PLINK:
                LD      A,8             ; Volumen canal A = 0
                LD      E,$00
                CALL    PSG_WRITE_AE
                LD      A,7             ; Mixer: desactivar tonos/ruidos
                LD      E,$3F
                CALL    PSG_WRITE_AE
                RET

; Entrada: A=registro PSG, E=valor
PSG_WRITE_AE:
                OUT     (PSG_ADDR_PORT),A
                LD      A,E
                OUT     (PSG_DATA_PORT),A
                RET

; ============================================================================
; CONFIGURAR SCREEN 2
; ============================================================================
SET_SCREEN2:
                ; VDP Register 0: Mode control 1
                LD      A,$02           ; Screen 2 mode
                LD      B,0
                CALL    WRITE_VDP_REG

                ; VDP Register 1: Mode control 2
                LD      A,$E2           ; 16K VRAM, display on, sprites 16x16
                LD      B,1
                CALL    WRITE_VDP_REG

                ; VDP Register 2: Name table base ($1800)
                LD      A,$06           ; $1800 / $400 = 6
                LD      B,2
                CALL    WRITE_VDP_REG

                ; VDP Register 3: Color table base ($2000)
                LD      A,$FF           ; Screen 2: $2000
                LD      B,3
                CALL    WRITE_VDP_REG

                ; VDP Register 4: Pattern table base ($0000)
                LD      A,$03           ; Screen 2: $0000
                LD      B,4
                CALL    WRITE_VDP_REG

                ; VDP Register 5: Sprite attribute table ($1B00)
                LD      A,$36           ; $1B00 / $80 = $36
                LD      B,5
                CALL    WRITE_VDP_REG

                ; VDP Register 6: Sprite pattern table ($3800)
                LD      A,$07           ; $3800 / $800 = 7
                LD      B,6
                CALL    WRITE_VDP_REG

                ; VDP Register 7: Background color (negro)
                LD      A,$01           ; Negro
                LD      B,7
                CALL    WRITE_VDP_REG

                ; Limpiar VRAM
                CALL    CLEAR_VRAM
                RET

; ============================================================================
; ESCRIBIR REGISTRO VDP
; A = valor, B = registro
; ============================================================================
WRITE_VDP_REG:
                ; TMS9918: primero valor, luego registro|$80
                OUT     (VDP_CTRL),A
                LD      A,B
                OR      $80
                OUT     (VDP_CTRL),A
                RET

; ============================================================================
; ESTABLECER DIRECCIÃƒâ€œN VRAM PARA ESCRITURA
; HL = direcciÃƒÂ³n VRAM
; ============================================================================
SET_VRAM_WRITE:
                LD      A,L
                OUT     (VDP_CTRL),A
                LD      A,H
                OR      $40             ; Bit 6 = write mode
                OUT     (VDP_CTRL),A
                RET

; ============================================================================
; ESTABLECER DIRECCIÃƒâ€œN VRAM PARA LECTURA
; HL = direcciÃƒÂ³n VRAM
; ============================================================================
SET_VRAM_READ:
                LD      A,L
                OUT     (VDP_CTRL),A
                LD      A,H
                AND     $3F             ; Bits 6-7 = 0 para lectura
                OUT     (VDP_CTRL),A
                RET

; ============================================================================
; LIMPIAR VRAM (16KB con ceros)
; ============================================================================
CLEAR_VRAM:
                LD      HL,$0000
                CALL    SET_VRAM_WRITE
                LD      BC,$4000        ; 16KB
CLEAR_LOOP:
                XOR     A
                OUT     (VDP_DATA),A
                DEC     BC
                LD      A,B
                OR      C
                JP      NZ,CLEAR_LOOP
                RET

; ============================================================================
; CARGAR PATRONES DE TILES EN LOS 3 BANCOS
; ============================================================================
LOAD_PATTERNS:
                ; Cargar patrones en banco 0
                LD      HL,VRAM_PATTERNS0
                CALL    SET_VRAM_WRITE
                LD      HL,TILE_PATTERNS
                LD      BC,TOTAL_TILES*8 ; N tiles * 8 bytes
                CALL    COPY_TO_VRAM

                ; Cargar patrones en banco 1
                LD      HL,VRAM_PATTERNS1
                CALL    SET_VRAM_WRITE
                LD      HL,TILE_PATTERNS
                LD      BC,TOTAL_TILES*8
                CALL    COPY_TO_VRAM

                ; Cargar patrones en banco 2
                LD      HL,VRAM_PATTERNS2
                CALL    SET_VRAM_WRITE
                LD      HL,TILE_PATTERNS
                LD      BC,TOTAL_TILES*8
                CALL    COPY_TO_VRAM

                ; Cargar colores en banco 0
                LD      HL,VRAM_COLORS0
                CALL    SET_VRAM_WRITE
                LD      HL,TILE_COLORS
                LD      BC,TOTAL_TILES*8
                CALL    COPY_TO_VRAM

                ; Cargar colores en banco 1
                LD      HL,VRAM_COLORS1
                CALL    SET_VRAM_WRITE
                LD      HL,TILE_COLORS
                LD      BC,TOTAL_TILES*8
                CALL    COPY_TO_VRAM

                ; Cargar colores en banco 2
                LD      HL,VRAM_COLORS2
                CALL    SET_VRAM_WRITE
                LD      HL,TILE_COLORS
                LD      BC,TOTAL_TILES*8
                CALL    COPY_TO_VRAM

                RET

; ============================================================================
; COPIAR DATOS A VRAM
; HL = origen RAM, BC = bytes
; ============================================================================
COPY_TO_VRAM:
                LD      A,(HL)
                OUT     (VDP_DATA),A
                INC     HL
                DEC     BC
                LD      A,B
                OR      C
                JP      NZ,COPY_TO_VRAM
                RET

; ============================================================================
; CARGAR PATRONES DE SPRITES
; ============================================================================
LOAD_SPRITES:
                LD      HL,VRAM_SPRITES_PAT
                CALL    SET_VRAM_WRITE
                LD      HL,SPRITE_PATTERNS
                LD      BC,SPRITE_PATTERNS_END-SPRITE_PATTERNS
                CALL    COPY_TO_VRAM
                RET

; ============================================================================
; ============================================================================
; COPIAR MAPA BASE ROM -> RAM
; ============================================================================
COPY_LEVEL_TO_RAM:
                LD      A,(CURRENT_SCREEN)
                CP      0
                JP      Z,COPY_LEVEL_SCREEN0
                CP      1
                JP      Z,COPY_LEVEL_SCREEN1
                LD      HL,LEVEL_MAP_2
                JP      COPY_LEVEL_SRC_READY
COPY_LEVEL_SCREEN0:
                LD      HL,LEVEL_MAP
                JP      COPY_LEVEL_SRC_READY
COPY_LEVEL_SCREEN1:
                LD      HL,LEVEL_MAP_0
COPY_LEVEL_SRC_READY:
                LD      DE,LEVEL_MAP_RAM
                LD      BC,LEVEL_MAP_SIZE
                LDIR
                RET
; INICIALIZAR VARIABLES DEL JUEGO
; ============================================================================
INIT_GAME:
                ; Empezar partida en la pantalla inicial original
                XOR     A
                LD      (CURRENT_SCREEN),A

                ; Copiar mapa base ROM -> RAM para colisiones y recogida de gemas
                CALL    COPY_LEVEL_TO_RAM
                ; Posiciones iniciales de jugador y patos segun pantalla actual
                CALL    SET_ENTITIES_FOR_SCREEN

                ; Gemas y estado
                XOR     A
                LD      (GEMS_COUNT),A
                LD      (GAME_STATE),A
                LD      (FRAME_COUNT),A
                LD      (GEM_SFX_TIMER),A
                LD      (GO_SFX_ACTIVE),A
                LD      (GO_SFX_STEP),A
                LD      (GO_SFX_TIMER),A
                CALL    STOP_GEM_PLINK

                RET

; ============================================================================
; POSICIONES DE JUGADOR Y PATOS SEGUN PANTALLA
; ============================================================================
SET_ENTITIES_FOR_SCREEN:
                XOR     A
                LD      (JUMP_ACTIVE),A
                LD      (JUMP_INDEX),A
                LD      (JUMP_REPEAT),A
                LD      (JUMP_DELAY),A
                LD      A,(CURRENT_SCREEN)
                CP      0
                JP      Z,SET_ENTITIES_SCREEN0
                CP      1
                JP      Z,SET_ENTITIES_SCREEN1

                ; ---------------- PANTALLA 3 ----------------
                LD      A,32
                LD      (PLAYER_X),A
                LD      A,152
                LD      (PLAYER_Y),A
                XOR     A
                LD      (PLAYER_VY),A
                LD      A,1
                LD      (PLAYER_ONGROUND),A
                XOR     A
                LD      (PLAYER_DIR),A
                LD      (PLAYER_FRAME),A

                ; Pato 1: patrulla en plataforma media
                LD      A,96
                LD      (GHOST1_X),A
                LD      A,112
                LD      (GHOST1_Y),A
                LD      A,1
                LD      (GHOST1_DIR),A
                LD      A,80
                LD      (GHOST1_MIN),A
                LD      A,176
                LD      (GHOST1_MAX),A

                ; Pato 2: patrulla superior derecha
                LD      A,220
                LD      (GHOST2_X),A
                LD      A,32
                LD      (GHOST2_Y),A
                XOR     A
                LD      (GHOST2_DIR),A
                LD      A,208
                LD      (GHOST2_MIN),A
                LD      A,232
                LD      (GHOST2_MAX),A
                RET

SET_ENTITIES_SCREEN0:
                ; ---------------- PANTALLA 1 (INICIAL ORIGINAL) ----------------
                LD      A,120
                LD      (PLAYER_X),A
                LD      A,152
                LD      (PLAYER_Y),A
                XOR     A
                LD      (PLAYER_VY),A
                LD      A,1
                LD      (PLAYER_ONGROUND),A
                XOR     A
                LD      (PLAYER_DIR),A
                LD      (PLAYER_FRAME),A

                ; Pato 1
                LD      A,40
                LD      (GHOST1_X),A
                LD      A,144
                LD      (GHOST1_Y),A
                LD      A,1
                LD      (GHOST1_DIR),A
                LD      A,24
                LD      (GHOST1_MIN),A
                LD      A,88
                LD      (GHOST1_MAX),A

                ; Pato 2
                LD      A,140
                LD      (GHOST2_X),A
                LD      A,56
                LD      (GHOST2_Y),A
                XOR     A
                LD      (GHOST2_DIR),A
                LD      A,80
                LD      (GHOST2_MIN),A
                LD      A,160
                LD      (GHOST2_MAX),A
                RET

SET_ENTITIES_SCREEN1:
                ; ---------------- PANTALLA 2 (NUEVA) ----------------
                LD      A,120
                LD      (PLAYER_X),A
                LD      A,152
                LD      (PLAYER_Y),A
                XOR     A
                LD      (PLAYER_VY),A
                LD      A,1
                LD      (PLAYER_ONGROUND),A
                XOR     A
                LD      (PLAYER_DIR),A
                LD      (PLAYER_FRAME),A

                ; Pato 1: plataforma alta izquierda
                LD      A,40
                LD      (GHOST1_X),A
                LD      A,56
                LD      (GHOST1_Y),A
                LD      A,1
                LD      (GHOST1_DIR),A
                LD      A,24
                LD      (GHOST1_MIN),A
                LD      A,88
                LD      (GHOST1_MAX),A

                ; Pato 2: plataforma media derecha
                LD      A,200
                LD      (GHOST2_X),A
                LD      A,112
                LD      (GHOST2_Y),A
                XOR     A
                LD      (GHOST2_DIR),A
                LD      A,184
                LD      (GHOST2_MIN),A
                LD      A,232
                LD      (GHOST2_MAX),A
                RET

; ============================================================================
; DIBUJAR NIVEL EN PANTALLA
; ============================================================================
DRAW_LEVEL:
                LD      HL,VRAM_NAMES
                CALL    SET_VRAM_WRITE

                LD      HL,LEVEL_MAP_RAM
                LD      B,24            ; 24 filas
DRAW_ROW:
                PUSH    BC
                LD      B,32            ; 32 columnas
DRAW_COL:
                LD      A,(HL)
                CP      TILE_PLATFORM
                JP      Z,DRAW_SOLID_BRICK
                CP      TILE_WALL
                JP      Z,DRAW_SOLID_BRICK
                JP      DRAW_TILE_READY

DRAW_SOLID_BRICK:
                BIT     0,B
                JP      Z,DRAW_BRICK_LEFT
                LD      A,TILE_BRICK_R_VIS
                JP      DRAW_TILE_READY
DRAW_BRICK_LEFT:
                LD      A,TILE_BRICK_L_VIS
DRAW_TILE_READY:
                OUT     (VDP_DATA),A
                INC     HL
                PUSH    HL
                LD      HL,8            ; PequeÃƒÂ±a pausa
DELAY_DRAW:
                DEC     HL
                LD      A,H
                OR      L
                JP      NZ,DELAY_DRAW
                POP     HL
                DJNZ    DRAW_COL
                POP     BC
                DJNZ    DRAW_ROW
                RET

; ============================================================================
; LEER ENTRADA DEL TECLADO
; ============================================================================
READ_INPUT:
                ; Leer fila 8 del teclado (cursores y SPACE)
                LD      A,8
                CALL    SNSMAT
                LD      B,A             ; Guardar estado
                XOR     A
                LD      (PLAYER_FRAME),A ; 0=idle por defecto en este frame

                ; SPACE (saltar) - Bit 0
                BIT     0,B
                JP      NZ,NO_JUMP
                ; Intentar saltar
                LD      A,(PLAYER_ONGROUND)
                OR      A
                JP      Z,NO_JUMP       ; No puede saltar en aire
                LD      A,1
                LD      (JUMP_ACTIVE),A
                XOR     A
                LD      (JUMP_INDEX),A
                LD      (JUMP_REPEAT),A
                LD      (JUMP_DELAY),A
                LD      A,JUMP_FORCE
                LD      (PLAYER_VY),A
                XOR     A
                LD      (PLAYER_ONGROUND),A
NO_JUMP:
                ; Cursor IZQUIERDA - Bit 4
                BIT     4,B
                JP      NZ,NO_LEFT
                LD      A,(PLAYER_X)
                CP      8
                JP      C,NO_LEFT       ; LÃƒÂ­mite izquierdo
                ; Comprobar colisiÃƒÂ³n izquierda
                CALL    CHECK_LEFT_WALL
                OR      A
                JP      NZ,NO_LEFT
                LD      A,(PLAYER_X)
                SUB     PLAYER_SPEED
                LD      (PLAYER_X),A
                XOR     A
                LD      (PLAYER_DIR),A
                LD      A,1
                LD      (PLAYER_FRAME),A ; 1=moviendose
NO_LEFT:
                ; Cursor DERECHA - Bit 7
                BIT     7,B
                JP      NZ,NO_RIGHT
                LD      A,(PLAYER_X)
                CP      240
                JP      NC,NO_RIGHT     ; LÃƒÂ­mite derecho
                ; Comprobar colisiÃƒÂ³n derecha
                CALL    CHECK_RIGHT_WALL
                OR      A
                JP      NZ,NO_RIGHT
                LD      A,(PLAYER_X)
                ADD     A,PLAYER_SPEED
                LD      (PLAYER_X),A
                LD      A,1
                LD      (PLAYER_DIR),A
                LD      (PLAYER_FRAME),A ; 1=moviendose
NO_RIGHT:
                RET

; ============================================================================
; APLICAR FÃƒÂSICA (GRAVEDAD Y MOVIMIENTO VERTICAL)
; ============================================================================
APPLY_PHYSICS:
                LD      A,(JUMP_ACTIVE)
                OR      A
                JP      Z,AP_FREEFALL
                CALL    APPLY_JUMP_HORIZONTAL_DRIFT
                CALL    APPLY_JUMP_PROFILE
                RET

APPLY_JUMP_PROFILE:
                ; Salto clasico 8-bit: delta Y por frame tomado de tabla.
                LD      A,(JUMP_INDEX)
                CP      JUMP_PROFILE_LEN
                JP      C,AP_JUMP_LOAD
                XOR     A
                LD      (JUMP_ACTIVE),A
                LD      (JUMP_INDEX),A
                LD      (PLAYER_VY),A
                RET

AP_JUMP_LOAD:
                LD      E,A
                LD      D,0
                LD      HL,JUMP_PROFILE
                ADD     HL,DE
                LD      A,(HL)          ; Delta vertical de este frame
                LD      (PLAYER_VY),A
                LD      B,A

                LD      A,(JUMP_INDEX)
                INC     A
                LD      (JUMP_INDEX),A

                LD      A,B
                OR      A
                JP      Z,AP_JUMP_KEEP_AIR
                BIT     7,A
                JP      NZ,AP_JUMP_UP

                LD      C,A             ; C = pixels a bajar este frame
AP_JUMP_DOWN_LOOP:
                CALL    STEP_PLAYER_DOWN_ONE
                OR      A
                JP      NZ,AP_JUMP_LANDED
                DEC     C
                JP      NZ,AP_JUMP_DOWN_LOOP
                JP      AP_JUMP_KEEP_AIR

AP_JUMP_UP:
                NEG                     ; A = pixels a subir este frame
                LD      C,A
AP_JUMP_UP_LOOP:
                CALL    STEP_PLAYER_UP_ONE
                OR      A
                JP      NZ,AP_JUMP_HIT_CEILING
                DEC     C
                JP      NZ,AP_JUMP_UP_LOOP
                JP      AP_JUMP_KEEP_AIR

AP_JUMP_KEEP_AIR:
                XOR     A
                LD      (PLAYER_ONGROUND),A
                RET

AP_JUMP_HIT_CEILING:
                XOR     A
                LD      (PLAYER_VY),A
                LD      (JUMP_ACTIVE),A
                LD      (JUMP_INDEX),A
                LD      (JUMP_REPEAT),A
                LD      (JUMP_DELAY),A
                LD      (PLAYER_ONGROUND),A
                RET

AP_JUMP_LANDED:
                LD      A,1
                LD      (PLAYER_ONGROUND),A
                XOR     A
                LD      (PLAYER_VY),A
                LD      (JUMP_ACTIVE),A
                LD      (JUMP_INDEX),A
                LD      (JUMP_REPEAT),A
                LD      (JUMP_DELAY),A
                RET

AP_FREEFALL:
                ; Si esta en suelo, no forzar caida
                LD      A,(PLAYER_ONGROUND)
                OR      A
                JP      Z,AP_FREEFALL_INAIR
                CALL    CHECK_FLOOR
                OR      A
                JP      Z,AP_FREEFALL_INAIR
                XOR     A
                LD      (PLAYER_VY),A
                RET

AP_FREEFALL_INAIR:
                LD      A,(PLAYER_VY)
                ADD     A,GRAVITY
                CP      MAX_FALL+1
                JP      C,AP_STORE_FREEFALL
                LD      A,MAX_FALL
AP_STORE_FREEFALL:
                LD      (PLAYER_VY),A
                LD      C,A
AP_FALL_LOOP:
                CALL    STEP_PLAYER_DOWN_ONE
                OR      A
                JP      NZ,AP_FALL_LANDED
                DEC     C
                JP      NZ,AP_FALL_LOOP
                XOR     A
                LD      (PLAYER_ONGROUND),A
                RET

AP_FALL_LANDED:
                LD      A,1
                LD      (PLAYER_ONGROUND),A
                XOR     A
                LD      (PLAYER_VY),A
                RET

; --------------------------------------------------------------------------
; Proyeccion horizontal automatica durante salto (estilo arco).
; Solo aplica si izquierda/derecha estan pulsadas en este frame.
; --------------------------------------------------------------------------
APPLY_JUMP_HORIZONTAL_DRIFT:
                LD      A,8
                CALL    SNSMAT
                LD      B,A
                BIT     4,B             ; Cursor izquierda (0=pulsado)
                JP      Z,AP_JUMP_DRIFT_LEFT
                BIT     7,B             ; Cursor derecha (0=pulsado)
                JP      Z,AP_JUMP_DRIFT_RIGHT
                RET

AP_JUMP_DRIFT_RIGHT:
                LD      A,(PLAYER_X)
                CP      240
                RET     NC
                CALL    CHECK_RIGHT_WALL
                OR      A
                RET     NZ
                LD      A,(PLAYER_X)
                ADD     A,PLAYER_SPEED
                LD      (PLAYER_X),A
                RET

AP_JUMP_DRIFT_LEFT:
                LD      A,(PLAYER_X)
                CP      8
                RET     C
                CALL    CHECK_LEFT_WALL
                OR      A
                RET     NZ
                LD      A,(PLAYER_X)
                SUB     PLAYER_SPEED
                LD      (PLAYER_X),A
                RET

; --------------------------------------------------------------------------
; Mover jugador 1 pixel hacia abajo.
; Retorna A=1 si golpea suelo, A=0 si avanza.
; --------------------------------------------------------------------------
STEP_PLAYER_DOWN_ONE:
                LD      A,(PLAYER_Y)
                CP      192             ; Si sale por abajo, reaparece arriba
                JP      C,STEP_DOWN_NORMAL
                LD      A,24            ; Debajo del HUD (fila 3)
                LD      (PLAYER_Y),A
                XOR     A
                RET
STEP_DOWN_NORMAL:
                INC     A
                LD      (PLAYER_Y),A
                CALL    CHECK_FLOOR
                OR      A
                JP      Z,STEP_DOWN_OK
                ; Alinear a la parte superior del tile solido tocado (multiplo de 8)
                LD      A,(PLAYER_Y)
                ADD     A,16
                AND     $F8
                SUB     16
                LD      (PLAYER_Y),A
                LD      A,1
                RET

STEP_DOWN_OK:
                XOR     A
                RET

; --------------------------------------------------------------------------
; Mover jugador 1 pixel hacia arriba.
; Sin colision de techo: los solidos solo bloquean al descender.
; Retorna A=0 siempre.
; --------------------------------------------------------------------------
STEP_PLAYER_UP_ONE:
                LD      A,(PLAYER_Y)
                OR      A               ; Evitar wrap a 255 cuando Y=0
                JP      Z,STEP_UP_OK
                DEC     A
                LD      (PLAYER_Y),A

STEP_UP_OK:
                XOR     A
                RET
; ============================================================================
; COMPROBAR SUELO (ColisiÃƒÂ³n abajo)
; Retorna A=1 si hay suelo, A=0 si no
; ============================================================================
CHECK_FLOOR:
                LD      A,(PLAYER_X)
                ADD     A,4             ; Centro del sprite
                SRL     A
                SRL     A
                SRL     A               ; Dividir por 8 (tile X)
                LD      D,A

                LD      A,(PLAYER_Y)
                ADD     A,16            ; Parte inferior del sprite
                SRL     A
                SRL     A
                SRL     A               ; Dividir por 8 (tile Y)
                LD      E,A

                CALL    GET_TILE_AT_DE
                CP      TILE_PLATFORM
                JP      Z,FLOOR_SOLID
                CP      TILE_WALL
                JP      Z,FLOOR_SOLID
                XOR     A               ; No hay suelo
                RET
FLOOR_SOLID:
                LD      A,1
                RET

; ============================================================================
; COMPROBAR TECHO (ColisiÃƒÂ³n arriba)
; ============================================================================
CHECK_CEILING:
                LD      A,(PLAYER_X)
                ADD     A,4
                SRL     A
                SRL     A
                SRL     A
                LD      D,A

                LD      A,(PLAYER_Y)
                SRL     A
                SRL     A
                SRL     A
                LD      E,A

                CALL    GET_TILE_AT_DE
                CP      TILE_PLATFORM
                JP      Z,CEIL_SOLID
                CP      TILE_WALL
                JP      Z,CEIL_SOLID
                XOR     A
                RET
CEIL_SOLID:
                LD      A,1
                RET

; ============================================================================
; COMPROBAR PARED IZQUIERDA
; ============================================================================
CHECK_LEFT_WALL:
                LD      A,(PLAYER_X)
                SUB     2
                SRL     A
                SRL     A
                SRL     A
                LD      D,A

                LD      A,(PLAYER_Y)
                ADD     A,2             ; Punto superior
                SRL     A
                SRL     A
                SRL     A
                LD      E,A

                CALL    GET_TILE_AT_DE
                CP      TILE_WALL
                JP      Z,LEFT_BLOCKED
                CP      TILE_PLATFORM
                JP      Z,LEFT_BLOCKED

                LD      A,(PLAYER_Y)
                ADD     A,13            ; Punto inferior
                SRL     A
                SRL     A
                SRL     A
                LD      E,A

                CALL    GET_TILE_AT_DE
                CP      TILE_WALL
                JP      Z,LEFT_BLOCKED
                CP      TILE_PLATFORM
                JP      Z,LEFT_BLOCKED
                XOR     A
                RET
LEFT_BLOCKED:
                LD      A,1
                RET

; ============================================================================
; COMPROBAR PARED DERECHA
; ============================================================================
CHECK_RIGHT_WALL:
                LD      A,(PLAYER_X)
                ADD     A,14
                SRL     A
                SRL     A
                SRL     A
                LD      D,A

                LD      A,(PLAYER_Y)
                ADD     A,2             ; Punto superior
                SRL     A
                SRL     A
                SRL     A
                LD      E,A

                CALL    GET_TILE_AT_DE
                CP      TILE_WALL
                JP      Z,RIGHT_BLOCKED
                CP      TILE_PLATFORM
                JP      Z,RIGHT_BLOCKED

                LD      A,(PLAYER_Y)
                ADD     A,13            ; Punto inferior
                SRL     A
                SRL     A
                SRL     A
                LD      E,A

                CALL    GET_TILE_AT_DE
                CP      TILE_WALL
                JP      Z,RIGHT_BLOCKED
                CP      TILE_PLATFORM
                JP      Z,RIGHT_BLOCKED
                XOR     A
                RET
RIGHT_BLOCKED:
                LD      A,1
                RET

; ============================================================================
; OBTENER TILE EN POSICIÃƒâ€œN D=X, E=Y (coordenadas de tile)
; Retorna valor del tile en A
; ============================================================================
GET_TILE_AT_DE:
                PUSH    HL
                PUSH    BC

                ; Calcular offset: Y * 32 + X
                LD      A,E
                LD      L,A
                LD      H,0
                ; HL = Y
                ADD     HL,HL           ; *2
                ADD     HL,HL           ; *4
                ADD     HL,HL           ; *8
                ADD     HL,HL           ; *16
                ADD     HL,HL           ; *32
                LD      A,D
                LD      C,A
                LD      B,0
                ADD     HL,BC           ; HL = Y*32 + X

                ; AÃƒÂ±adir base del mapa
                LD      BC,LEVEL_MAP_RAM
                ADD     HL,BC

                LD      A,(HL)

                POP     BC
                POP     HL
                RET

; ============================================================================
; MOVER FANTASMAS (PATRULLA)
; ============================================================================
MOVE_GHOSTS:
                ; Solo mover cada 2 frames para ir mÃƒÂ¡s lento
                LD      A,(FRAME_COUNT)
                AND     1
                JP      NZ,GHOSTS_DONE

                ; Fantasma 1
                LD      A,(GHOST1_DIR)
                OR      A
                JP      Z,GHOST1_LEFT

GHOST1_RIGHT:
                LD      A,(GHOST1_X)
                ADD     A,1
                LD      (GHOST1_X),A
                LD      B,A
                LD      A,(GHOST1_MAX)
                CP      B
                JP      NC,GHOST1_DONE
                XOR     A
                LD      (GHOST1_DIR),A
                JP      GHOST1_DONE

GHOST1_LEFT:
                LD      A,(GHOST1_X)
                SUB     1
                LD      (GHOST1_X),A
                LD      B,A
                LD      A,(GHOST1_MIN)
                CP      B
                JP      C,GHOST1_DONE
                LD      A,1
                LD      (GHOST1_DIR),A

GHOST1_DONE:
                ; Fantasma 2
                LD      A,(GHOST2_DIR)
                OR      A
                JP      Z,GHOST2_LEFT

GHOST2_RIGHT:
                LD      A,(GHOST2_X)
                ADD     A,1
                LD      (GHOST2_X),A
                LD      B,A
                LD      A,(GHOST2_MAX)
                CP      B
                JP      NC,GHOSTS_DONE
                XOR     A
                LD      (GHOST2_DIR),A
                JP      GHOSTS_DONE

GHOST2_LEFT:
                LD      A,(GHOST2_X)
                SUB     1
                LD      (GHOST2_X),A
                LD      B,A
                LD      A,(GHOST2_MIN)
                CP      B
                JP      C,GHOSTS_DONE
                LD      A,1
                LD      (GHOST2_DIR),A

GHOSTS_DONE:
                RET

; ============================================================================
; COMPROBAR COLISIONES (GEMAS Y FANTASMAS)
; ============================================================================
CHECK_COLLISIONS:
                ; Comprobar gema usando caja del jugador (4 puntos interiores)
                CALL    CHECK_GEM_COLLISION_BOX

NO_GEM_PICKUP:
                ; Comprobar colision con fantasma 1
                CALL    CHECK_GHOST1_HIT
                OR      A
                JP      NZ,PLAYER_DIES

                ; Comprobar colision con fantasma 2
                CALL    CHECK_GHOST2_HIT
                OR      A
                JP      NZ,PLAYER_DIES

                RET

PLAYER_DIES:
                CALL    STOP_GEM_PLINK
                CALL    START_GAMEOVER_SFX
                LD      A,1
                LD      (GAME_STATE),A
                RET

; ============================================================================
; COMPROBAR GEMAS EN CAJA DEL JUGADOR (4 PUNTOS)
; Retorna A=1 si recoge gema, A=0 si no.
; ============================================================================
CHECK_GEM_COLLISION_BOX:
                ; Punto 1: superior izquierda interior
                LD      A,(PLAYER_X)
                ADD     A,3
                SRL     A
                SRL     A
                SRL     A
                LD      D,A
                LD      A,(PLAYER_Y)
                ADD     A,3
                SRL     A
                SRL     A
                SRL     A
                LD      E,A
                CALL    TRY_PICK_GEM_AT_DE
                OR      A
                RET     NZ

                ; Punto 2: superior derecha interior
                LD      A,(PLAYER_X)
                ADD     A,12
                SRL     A
                SRL     A
                SRL     A
                LD      D,A
                LD      A,(PLAYER_Y)
                ADD     A,3
                SRL     A
                SRL     A
                SRL     A
                LD      E,A
                CALL    TRY_PICK_GEM_AT_DE
                OR      A
                RET     NZ

                ; Punto 3: inferior izquierda interior
                LD      A,(PLAYER_X)
                ADD     A,3
                SRL     A
                SRL     A
                SRL     A
                LD      D,A
                LD      A,(PLAYER_Y)
                ADD     A,12
                SRL     A
                SRL     A
                SRL     A
                LD      E,A
                CALL    TRY_PICK_GEM_AT_DE
                OR      A
                RET     NZ

                ; Punto 4: inferior derecha interior
                LD      A,(PLAYER_X)
                ADD     A,12
                SRL     A
                SRL     A
                SRL     A
                LD      D,A
                LD      A,(PLAYER_Y)
                ADD     A,12
                SRL     A
                SRL     A
                SRL     A
                LD      E,A
                CALL    TRY_PICK_GEM_AT_DE
                RET

; ============================================================================
; Intentar recoger gema en tile D,E.
; Retorna A=1 si recoge, A=0 si no.
; ============================================================================
TRY_PICK_GEM_AT_DE:
                CALL    GET_TILE_AT_DE
                CP      TILE_GEM
                JP      Z,TRY_PICK_DO
                XOR     A
                RET

TRY_PICK_DO:
                PUSH    DE
                ; Reemplazar gema con vacio en el mapa RAM
                LD      A,E
                LD      L,A
                LD      H,0
                ADD     HL,HL
                ADD     HL,HL
                ADD     HL,HL
                ADD     HL,HL
                ADD     HL,HL
                LD      A,D
                LD      C,A
                LD      B,0
                ADD     HL,BC
                LD      BC,LEVEL_MAP_RAM
                ADD     HL,BC
                LD      (HL),TILE_EMPTY

                ; Actualizar en VRAM
                POP     DE
                CALL    CLEAR_GEM_TILE

                ; Incrementar contador
                LD      A,(GEMS_COUNT)
                INC     A
                LD      (GEMS_COUNT),A
                CALL    PLAY_GEM_PLINK
                CALL    CHECK_SCREEN_PROGRESS
                LD      A,1
                RET

; ============================================================================
; CAMBIO DE PANTALLA AL CUMPLIR OBJETIVO DE GEMAS
; ============================================================================
CHECK_SCREEN_PROGRESS:
                LD      A,(CURRENT_SCREEN)
                CP      0
                JP      Z,CSP_FROM_SCREEN0
                CP      1
                JP      Z,CSP_FROM_SCREEN1
                RET

CSP_FROM_SCREEN0:
                LD      A,(GEMS_COUNT)
                CP      GEMS_TO_SCREEN2
                RET     C

                LD      A,1
                LD      (CURRENT_SCREEN),A
                CALL    COPY_LEVEL_TO_RAM
                CALL    SET_ENTITIES_FOR_SCREEN
                CALL    DRAW_LEVEL
                CALL    DRAW_HUD_PANEL
                CALL    DRAW_SCORE
                RET

CSP_FROM_SCREEN1:
                LD      A,(GEMS_COUNT)
                CP      GEMS_TO_SCREEN3
                RET     C

                LD      A,2
                LD      (CURRENT_SCREEN),A
                CALL    COPY_LEVEL_TO_RAM
                CALL    SET_ENTITIES_FOR_SCREEN
                CALL    DRAW_LEVEL
                CALL    DRAW_HUD_PANEL
                CALL    DRAW_SCORE
                RET

; ============================================================================
; BORRAR TILE DE GEMA EN VRAM
; D=TileX, E=TileY
; ============================================================================
CLEAR_GEM_TILE:
                ; Calcular direcciÃƒÂ³n VRAM
                LD      A,E
                LD      L,A
                LD      H,0
                ADD     HL,HL
                ADD     HL,HL
                ADD     HL,HL
                ADD     HL,HL
                ADD     HL,HL           ; *32
                LD      A,D
                LD      C,A
                LD      B,0
                ADD     HL,BC
                LD      BC,VRAM_NAMES
                ADD     HL,BC

                CALL    SET_VRAM_WRITE
                XOR     A               ; Tile vacÃƒÂ­o
                OUT     (VDP_DATA),A
                RET

; ============================================================================
; COMPROBAR HIT CON FANTASMA 1
; Retorna A=1 si colisiÃƒÂ³n
; ============================================================================
CHECK_GHOST1_HIT:
                LD      A,(PLAYER_X)
                LD      B,A
                LD      A,(GHOST1_X)

                ; |PX - GX| < 12?
                SUB     B
                JP      NC,G1_POS
                NEG
G1_POS:
                CP      12
                JP      NC,G1_NO_HIT

                LD      A,(PLAYER_Y)
                LD      B,A
                LD      A,(GHOST1_Y)
                SUB     B
                JP      NC,G1Y_POS
                NEG
G1Y_POS:
                CP      12
                JP      NC,G1_NO_HIT

                LD      A,1
                RET
G1_NO_HIT:
                XOR     A
                RET

; ============================================================================
; COMPROBAR HIT CON FANTASMA 2
; ============================================================================
CHECK_GHOST2_HIT:
                LD      A,(PLAYER_X)
                LD      B,A
                LD      A,(GHOST2_X)

                SUB     B
                JP      NC,G2_POS
                NEG
G2_POS:
                CP      12
                JP      NC,G2_NO_HIT

                LD      A,(PLAYER_Y)
                LD      B,A
                LD      A,(GHOST2_Y)
                SUB     B
                JP      NC,G2Y_POS
                NEG
G2Y_POS:
                CP      12
                JP      NC,G2_NO_HIT

                LD      A,1
                RET
G2_NO_HIT:
                XOR     A
                RET

; ============================================================================
; ACTUALIZAR SPRITES EN VRAM
; ============================================================================
UPDATE_SPRITES:
                LD      HL,VRAM_SPRITES_ATR
                CALL    SET_VRAM_WRITE

                ; Heroe: idle si no se movio este frame
                LD      A,(PLAYER_FRAME)
                OR      A
                JP      Z,HERO_USE_IDLE

                ; Animacion heroe en carrera (3 frames): 0,1,2,0...
                LD      A,(FRAME_COUNT)
                SRL     A
                SRL     A
                AND     3
                CP      3
                JP      NZ,HERO_FRAME_OK
                XOR     A
HERO_FRAME_OK:
                LD      B,A             ; Frame index (0..2)

                ; Base de patrones segun direccion:
                ; izquierda=0, derecha(espejo)=40
                LD      A,(PLAYER_DIR)
                OR      A
                JP      Z,HERO_LEFT_BASE
                LD      A,40
                JP      HERO_BASE_READY
HERO_LEFT_BASE:
                XOR     A
HERO_BASE_READY:
                LD      C,A

                ; D = capa1, E = capa2
                LD      A,B
                ADD     A,A
                ADD     A,A
                ADD     A,A             ; frame * 8
                ADD     A,C
                LD      D,A
                ADD     A,4
                LD      E,A
                JP      HERO_PATTERNS_READY

HERO_USE_IDLE:
                LD      A,(PLAYER_DIR)
                OR      A
                JP      Z,HERO_IDLE_LEFT
                LD      D,HERO_IDLE_MIRROR_PAT1
                LD      E,HERO_IDLE_MIRROR_PAT2
                JP      HERO_PATTERNS_READY
HERO_IDLE_LEFT:
                LD      D,HERO_IDLE_PAT1
                LD      E,HERO_IDLE_PAT2

HERO_PATTERNS_READY:

                ; --- SPRITE 0: Heroe capa 1 ---
                LD      A,(PLAYER_Y)
                OUT     (VDP_DATA),A
                LD      A,(PLAYER_X)
                OUT     (VDP_DATA),A
                LD      A,D
                OUT     (VDP_DATA),A
                LD      A,COLOR_WHITE
                OUT     (VDP_DATA),A

                ; --- SPRITE 1: Heroe capa 2 ---
                LD      A,(PLAYER_Y)
                OUT     (VDP_DATA),A
                LD      A,(PLAYER_X)
                OUT     (VDP_DATA),A
                LD      A,E
                OUT     (VDP_DATA),A
                LD      A,COLOR_RED
                OUT     (VDP_DATA),A

                ; Animacion fantasmas (2 frames): offset 0/8
                LD      A,(FRAME_COUNT)
                AND     8
                JP      Z,GHOST_ANIM_OFFSET0
                LD      H,8
                JP      GHOST_ANIM_OFFSET_READY
GHOST_ANIM_OFFSET0:
                LD      H,0
GHOST_ANIM_OFFSET_READY:

                ; Seleccionar base de patrones del fantasma 1 por direccion
                ; derecha: base 24, izquierda(mirror): base 64
                LD      A,(GHOST1_DIR)
                OR      A
                JP      Z,GHOST1_LEFT_BASE
                LD      A,24
                JP      GHOST1_BASE_READY
GHOST1_LEFT_BASE:
                LD      A,64
GHOST1_BASE_READY:
                ADD     A,H
                LD      B,A
                ADD     A,4
                LD      C,A

                ; --- SPRITE 2: Fantasma 1 capa 1 ---
                LD      A,(GHOST1_Y)
                OUT     (VDP_DATA),A
                LD      A,(GHOST1_X)
                OUT     (VDP_DATA),A
                LD      A,B
                OUT     (VDP_DATA),A
                LD      A,COLOR_WHITE
                OUT     (VDP_DATA),A

                ; --- SPRITE 3: Fantasma 1 capa 2 ---
                LD      A,(GHOST1_Y)
                OUT     (VDP_DATA),A
                LD      A,(GHOST1_X)
                OUT     (VDP_DATA),A
                LD      A,C
                OUT     (VDP_DATA),A
                LD      A,COLOR_CYAN
                OUT     (VDP_DATA),A

                ; Seleccionar base de patrones del fantasma 2 por direccion
                LD      A,(GHOST2_DIR)
                OR      A
                JP      Z,GHOST2_LEFT_BASE
                LD      A,24
                JP      GHOST2_BASE_READY
GHOST2_LEFT_BASE:
                LD      A,64
GHOST2_BASE_READY:
                ADD     A,H
                LD      B,A
                ADD     A,4
                LD      C,A

                ; --- SPRITE 4: Fantasma 2 capa 1 ---
                LD      A,(GHOST2_Y)
                OUT     (VDP_DATA),A
                LD      A,(GHOST2_X)
                OUT     (VDP_DATA),A
                LD      A,B
                OUT     (VDP_DATA),A
                LD      A,COLOR_WHITE
                OUT     (VDP_DATA),A

                ; --- SPRITE 5: Fantasma 2 capa 2 ---
                LD      A,(GHOST2_Y)
                OUT     (VDP_DATA),A
                LD      A,(GHOST2_X)
                OUT     (VDP_DATA),A
                LD      A,C
                OUT     (VDP_DATA),A
                LD      A,COLOR_CYAN
                OUT     (VDP_DATA),A

                ; --- Terminar lista de sprites ---
                LD      A,$D0           ; Fin de sprites
                OUT     (VDP_DATA),A

                RET
; ============================================================================
; DIBUJAR MARCADOR (GEMAS)
; ============================================================================
; ============================================================================
; DIBUJAR PANEL HUD SUPERIOR
; ============================================================================
DRAW_HUD_PANEL:
                ; Fila 0: borde superior
                LD      HL,VRAM_NAMES
                CALL    SET_VRAM_WRITE
                LD      A,TILE_HUD_TL
                OUT     (VDP_DATA),A
                LD      B,30
HUD_TOP_LOOP:
                LD      A,TILE_HUD_H
                OUT     (VDP_DATA),A
                DJNZ    HUD_TOP_LOOP
                LD      A,TILE_HUD_TR
                OUT     (VDP_DATA),A

                ; Fila 1: laterales
                LD      HL,VRAM_NAMES+32
                CALL    SET_VRAM_WRITE
                LD      A,TILE_HUD_VL
                OUT     (VDP_DATA),A
                LD      B,30
HUD_MID_LOOP:
                LD      A,TILE_EMPTY
                OUT     (VDP_DATA),A
                DJNZ    HUD_MID_LOOP
                LD      A,TILE_HUD_VR
                OUT     (VDP_DATA),A

                ; Fila 2: borde inferior
                LD      HL,VRAM_NAMES+64
                CALL    SET_VRAM_WRITE
                LD      A,TILE_HUD_BL
                OUT     (VDP_DATA),A
                LD      B,30
HUD_BOTTOM_LOOP:
                LD      A,TILE_HUD_H
                OUT     (VDP_DATA),A
                DJNZ    HUD_BOTTOM_LOOP
                LD      A,TILE_HUD_BR
                OUT     (VDP_DATA),A
                RET

; ============================================================================
; DIBUJAR MARCADOR HUD (SCORE::000000)
; ============================================================================
DRAW_SCORE:
                ; Posicion del texto: fila 1, columna 2
                LD      HL,VRAM_NAMES+34
                CALL    SET_VRAM_WRITE

                ; "SCORE: "
                LD      A,19            ; S
                OUT     (VDP_DATA),A
                LD      A,TILE_CHAR_C   ; C
                OUT     (VDP_DATA),A
                LD      A,22            ; O
                OUT     (VDP_DATA),A
                LD      A,24            ; R
                OUT     (VDP_DATA),A
                LD      A,17            ; E
                OUT     (VDP_DATA),A
                LD      A,20            ; :
                OUT     (VDP_DATA),A
                LD      A,TILE_EMPTY     ; espacio
                OUT     (VDP_DATA),A

                ; Cuatro ceros fijos (0000xx)
                XOR     A               ; digito 0
                CALL    DIGIT_TO_TILE
                OUT     (VDP_DATA),A
                OUT     (VDP_DATA),A
                OUT     (VDP_DATA),A
                OUT     (VDP_DATA),A

                ; Ultimos dos digitos = gemas (00..99)
                LD      A,(GEMS_COUNT)
                LD      C,0
HUD_TENS_LOOP:
                CP      10
                JP      C,HUD_TENS_DONE
                SUB     10
                INC     C
                JP      HUD_TENS_LOOP
HUD_TENS_DONE:
                PUSH    AF              ; unidades
                LD      A,C             ; decenas
                CALL    DIGIT_TO_TILE
                OUT     (VDP_DATA),A
                POP     AF
                CALL    DIGIT_TO_TILE
                OUT     (VDP_DATA),A

                ; A la derecha: "LEVEL 01" (nivel actual)
                LD      HL,VRAM_NAMES+52 ; fila 1, columna 20
                CALL    SET_VRAM_WRITE
                LD      A,TILE_CHAR_L    ; L
                OUT     (VDP_DATA),A
                LD      A,17             ; E
                OUT     (VDP_DATA),A
                LD      A,23             ; V
                OUT     (VDP_DATA),A
                LD      A,17             ; E
                OUT     (VDP_DATA),A
                LD      A,TILE_CHAR_L    ; L
                OUT     (VDP_DATA),A
                LD      A,TILE_EMPTY     ; espacio
                OUT     (VDP_DATA),A

                LD      A,(CURRENT_SCREEN)
                INC     A                ; mostrar desde 1
                LD      C,0
LEVEL_TENS_LOOP:
                CP      10
                JP      C,LEVEL_TENS_DONE
                SUB     10
                INC     C
                JP      LEVEL_TENS_LOOP
LEVEL_TENS_DONE:
                PUSH    AF
                LD      A,C
                CALL    DIGIT_TO_TILE
                OUT     (VDP_DATA),A
                POP     AF
                CALL    DIGIT_TO_TILE
                OUT     (VDP_DATA),A
                RET

; ============================================================================
; DIBUJAR MENSAJE GAME OVER
; ============================================================================
DRAW_GAME_OVER:
                ; PosiciÃƒÂ³n central: fila 12, columna 11
                LD      HL,VRAM_NAMES+(12*32)+11
                CALL    SET_VRAM_WRITE

                ; "GAME OVER" usando tiles
                LD      HL,GAMEOVER_TEXT
                LD      B,9
DRAW_GO_LOOP:
                LD      A,(HL)
                OUT     (VDP_DATA),A
                INC     HL
                PUSH    HL
                LD      HL,4
DELAY_GO:
                DEC     HL
                LD      A,H
                OR      L
                JP      NZ,DELAY_GO
                POP     HL
                DJNZ    DRAW_GO_LOOP
                RET

GAMEOVER_TEXT:
                DB      16,31,18,17,0,22,23,17,24    ; G A M E _ O V E R

; ============================================================================
; DATOS: PATRONES DE TILES (8x8 pÃƒÂ­xeles)
; ============================================================================
; ============================================================================
; CONVERTIR DIGITO DECIMAL (0..9) A INDICE DE TILE
; Entrada: A=digito
; Salida:  A=tile
; ============================================================================
DIGIT_TO_TILE:
                PUSH    HL
                PUSH    DE
                LD      HL,DIGIT_TILE_TABLE
                LD      E,A
                LD      D,0
                ADD     HL,DE
                LD      A,(HL)
                POP     DE
                POP     HL
                RET

DIGIT_TILE_TABLE:
                DB      21,25,26,27,28,29,30,4,5,6   ; 0..9

; Perfil de salto preprogramado (aprox. sinusoidal)
; Delta vertical por frame (estilo clasico 8-bit).
JUMP_PROFILE:
                DB      -6,-5,-5,-4,-4,-3,-3,-2,-2,-1,-1,0,1,1,2,2,3,3,4,4,5

TILE_PATTERNS:
                ; Tile 0: VacÃƒÂ­o
                DB      $00,$00,$00,$00,$00,$00,$00,$00

                ; Tile 1: Plataforma (ladrillo)
                DB      $FF,$81,$81,$81,$FF,$18,$18,$FF

                ; Tile 2: Gema
                DB      $18,$3C,$7E,$FF,$FF,$7E,$3C,$18

                ; Tile 3: Pared
                DB      $FF,$C3,$C3,$C3,$C3,$C3,$C3,$FF

                ; Tile 4: '7'
                DB      $FE,$02,$04,$08,$10,$20,$20,$20
                ; Tile 5: '8'
                DB      $7C,$82,$82,$7C,$82,$82,$82,$7C
                ; Tile 6: '9'
                DB      $7C,$82,$82,$7E,$02,$02,$82,$7C
                ; Tile 7: Ladrillo azul (mitad izquierda)
                DB      $6D,$BB,$80,$80,$00,$80,$7A,$00
                ; Tile 8: Ladrillo azul (mitad derecha)
                DB      $AA,$D5,$0A,$15,$01,$00,$B6,$00
                ; Tile 9: HUD esquina superior izquierda (MARCO_ROJO_PART_0_0)
                DB      15,21,63,117,10,15,10,15
                ; Tile 10: HUD borde superior (MARCO_ROJO_PART_0_1)
                DB      255,85,255,85,0,0,0,0
                ; Tile 11: HUD esquina superior derecha (MARCO_ROJO_PART_0_2)
                DB      240,168,252,174,160,240,160,240
                ; Tile 12: HUD borde vertical izquierdo (MARCO_ROJO_PART_1_0)
                DB      10,15,10,15,10,15,10,15
                ; Tile 13: HUD borde vertical derecho (MARCO_ROJO_PART_1_2)
                DB      160,240,160,240,160,240,160,240
                ; Tile 14: 'C'
                DB      $3C,$42,$80,$80,$80,$80,$42,$3C
                ; Tile 15: 'L'
                DB      $80,$80,$80,$80,$80,$80,$80,$FF

                ; Tile 16: 'G'
                DB      $3C,$42,$80,$8E,$82,$82,$42,$3C
                ; Tile 17: 'E'
                DB      $FE,$80,$80,$FC,$80,$80,$80,$FE
                ; Tile 18: 'M'
                DB      $82,$C6,$AA,$92,$82,$82,$82,$82
                ; Tile 19: 'S'
                DB      $7C,$82,$80,$7C,$02,$02,$82,$7C
                ; Tile 20: ':'
                DB      $00,$18,$18,$00,$00,$18,$18,$00
                ; Tile 21: '0'
                DB      $7C,$82,$86,$8A,$92,$A2,$C2,$7C
                ; Tile 22: 'O'
                DB      $7C,$82,$82,$82,$82,$82,$82,$7C
                ; Tile 23: 'V'
                DB      $82,$82,$82,$82,$44,$28,$10,$00
                ; Tile 24: 'R'
                DB      $FC,$82,$82,$FC,$88,$84,$82,$82
                ; Tiles 25-30: DÃƒÂ­gitos '1'-'6'
                DB      $10,$30,$10,$10,$10,$10,$10,$38    ; '1'
                DB      $7C,$82,$02,$1C,$60,$80,$80,$FE    ; '2'
                DB      $7C,$82,$02,$3C,$02,$02,$82,$7C    ; '3'
                DB      $04,$0C,$14,$24,$FE,$04,$04,$04    ; '4'
                DB      $FE,$80,$80,$FC,$02,$02,$82,$7C    ; '5'
                DB      $7C,$82,$80,$FC,$82,$82,$82,$7C    ; '6'
                ; Tile 31: 'A'
                DB      $18,$24,$42,$42,$7E,$42,$42,$42
                ; Tile 32: HUD esquina inferior izquierda
                DB      15,21,63,117,0,0,0,0
                ; Tile 33: HUD esquina inferior derecha
                DB      240,168,252,174,0,0,0,0

; ============================================================================
; DATOS: COLORES DE TILES (Screen 2: 8 bytes por tile)
; ============================================================================
TILE_COLORS:
                ; Tile 0: VacÃƒÂ­o (negro sobre negro)
                DB      $11,$11,$11,$11,$11,$11,$11,$11

                ; Tile 1: Plataforma (verde sobre negro)
                DB      $31,$31,$31,$31,$31,$31,$31,$31

                ; Tile 2: Gema (amarillo sobre negro)
                DB      $A1,$A1,$A1,$A1,$A1,$A1,$A1,$A1

                ; Tile 3: Pared (azul sobre negro)
                DB      $51,$51,$51,$51,$51,$51,$51,$51

                ; Tiles 4-6: Blanco sobre negro (digitos 7-9)
                DS      8*3,$F1
                ; Tile 7: Ladrillo azul (mitad izquierda), atributos por linea
                DB      $41,$51,$41,$51,$41,$41,$41,$41
                ; Tile 8: Ladrillo azul (mitad derecha), atributos por linea
                DB      $41,$41,$41,$41,$41,$41,$51,$41
                ; Tile 9: HUD esquina izquierda (rojo sobre negro)
                DB      $81,$81,$81,$81,$81,$81,$81,$81
                ; Tile 10: HUD borde horizontal
                DB      $81,$81,$81,$81,$81,$81,$81,$81
                ; Tile 11: HUD esquina derecha
                DB      $81,$81,$81,$81,$81,$81,$81,$81
                ; Tile 12: HUD borde vertical izquierdo
                DB      $81,$81,$81,$81,$81,$81,$81,$81
                ; Tile 13: HUD borde vertical derecho
                DB      $81,$81,$81,$81,$81,$81,$81,$81
                ; Tile 14: 'C' (blanco sobre negro)
                DB      $F1,$F1,$F1,$F1,$F1,$F1,$F1,$F1
                ; Tile 15: 'L' (blanco sobre negro)
                DB      $F1,$F1,$F1,$F1,$F1,$F1,$F1,$F1

                ; Tiles 16-31: Blanco sobre negro (texto)
                DS      8*16,$F1
                ; Tile 32: HUD esquina inferior izquierda (rojo sobre negro)
                DB      $81,$81,$81,$81,$81,$81,$81,$81
                ; Tile 33: HUD esquina inferior derecha (rojo sobre negro)
                DB      $81,$81,$81,$81,$81,$81,$81,$81

; ============================================================================
; DATOS: PATRONES DE SPRITES 16x16 (32 bytes por sprite)
; ============================================================================
SPRITE_PATTERNS:
                ; --- HERO RUNNING FRAME 0 CAPA 1 (patron 0) ---
                DB      0,15,11,27,31,15,1,0,41,0,0,0,0,0,0,2
                DB      0,0,0,64,192,128,128,0,0,0,0,128,0,128,0,128

                ; --- HERO RUNNING FRAME 0 CAPA 2 (patron 4) ---
                DB      31,0,0,0,0,0,0,3,22,3,7,3,0,0,0,1
                DB      224,225,149,10,0,0,0,192,64,224,240,96,128,0,128,0

                ; --- HERO RUNNING FRAME 1 CAPA 1 (patron 8) ---
                DB      0,0,15,11,27,31,15,1,0,41,0,0,10,0,8,16
                DB      0,0,0,0,64,192,128,128,0,0,0,0,40,4,0,0

                ; --- HERO RUNNING FRAME 1 CAPA 2 (patron 12) ---
                DB      7,31,0,0,0,0,0,0,3,22,3,7,5,8,0,40
                DB      192,224,234,149,1,0,0,0,192,64,224,240,212,0,4,0

                ; --- HERO RUNNING FRAME 2 CAPA 1 (patron 16) ---
                DB      0,15,11,27,31,15,1,0,41,0,0,0,2,0,2,4
                DB      0,0,0,64,192,128,128,0,0,0,0,0,0,0,0,0

                ; --- HERO RUNNING FRAME 2 CAPA 2 (patron 20) ---
                DB      31,0,0,0,0,0,0,3,22,3,7,5,0,2,0,10
                DB      224,234,149,0,0,0,0,192,96,240,248,216,0,0,0,0

                ; --- FANTASMA "anec" FRAME 0 CAPA 1 (patron 24) ---
                DB      0,0,1,1,3,2,3,1,0,0,0,9,14,7,4,10
                DB      0,192,176,208,88,220,247,224,64,0,224,248,248,240,8,20

                ; --- FANTASMA "anec" FRAME 0 CAPA 2 (patron 28) ---
                DB      0,0,0,0,0,1,0,64,96,48,25,22,17,8,0,4
                DB      0,0,0,32,160,32,0,0,0,224,24,4,4,8,0,8

                ; --- FANTASMA "anec" FRAME 1 CAPA 1 (patron 32) ---
                DB      0,0,1,1,3,2,3,1,0,32,16,9,14,3,0,0
                DB      0,192,176,208,88,220,247,224,64,0,224,120,248,240,64,160

                ; --- FANTASMA "anec" FRAME 1 CAPA 2 (patron 36) ---
                DB      0,0,0,0,0,1,0,0,224,208,41,22,1,4,0,0
                DB      0,0,0,32,160,32,0,0,0,224,24,132,4,8,0,64

                ; --- HERO RUNNING MIRROR FRAME 0 CAPA 1 (patron 40) ---
                DB      0,0,0,2,3,1,1,0,0,0,0,1,0,1,0,1
                DB      0,240,208,216,248,240,128,0,148,0,0,0,0,0,0,64

                ; --- HERO RUNNING MIRROR FRAME 0 CAPA 2 (patron 44) ---
                DB      7,135,169,80,0,0,0,3,2,7,15,6,1,0,1,0
                DB      248,0,0,0,0,0,0,192,104,192,224,192,0,0,0,128

                ; --- HERO RUNNING MIRROR FRAME 1 CAPA 1 (patron 48) ---
                DB      0,0,0,0,2,3,1,1,0,0,0,0,20,32,0,0
                DB      0,0,240,208,216,248,240,128,0,148,0,0,80,0,16,8

                ; --- HERO RUNNING MIRROR FRAME 1 CAPA 2 (patron 52) ---
                DB      3,7,87,169,128,0,0,0,3,2,7,15,43,0,32,0
                DB      224,248,0,0,0,0,0,0,192,104,192,224,160,16,0,20

                ; --- HERO RUNNING MIRROR FRAME 2 CAPA 1 (patron 56) ---
                DB      0,0,0,2,3,1,1,0,0,0,0,0,0,0,0,0
                DB      0,240,208,216,248,240,128,0,148,0,0,0,64,0,64,32

                ; --- HERO RUNNING MIRROR FRAME 2 CAPA 2 (patron 60) ---
                DB      7,87,169,0,0,0,0,3,6,15,31,27,0,0,0,0
                DB      248,0,0,0,0,0,0,192,104,192,224,160,0,64,0,80

                ; --- FANTASMA "anec" MIRROR FRAME 0 CAPA 1 (patron 64) ---
                DB      0,3,13,11,26,59,239,7,2,0,7,31,31,15,16,40
                DB      0,0,128,128,192,64,192,128,0,0,0,144,112,224,32,80

                ; --- FANTASMA "anec" MIRROR FRAME 0 CAPA 2 (patron 68) ---
                DB      0,0,0,4,5,4,0,0,0,7,24,32,32,16,0,16
                DB      0,0,0,0,0,128,0,2,6,12,152,104,136,16,0,32

                ; --- FANTASMA "anec" MIRROR FRAME 1 CAPA 1 (patron 72) ---
                DB      0,3,13,11,26,59,239,7,2,0,7,30,31,15,2,5
                DB      0,0,128,128,192,64,192,128,0,4,8,144,112,192,0,0

                ; --- FANTASMA "anec" MIRROR FRAME 1 CAPA 2 (patron 76) ---
                DB      0,0,0,4,5,4,0,0,0,7,24,33,32,16,0,2
                DB      0,0,0,0,0,128,0,0,7,11,148,104,128,32,0,0

                ; --- HERO IDLE CAPA 1 (patron 80, mirando izquierda) ---
                DB      0,15,11,27,31,15,1,0,1,0,1,0,0,0,0,2
                DB      0,0,0,64,192,128,128,0,0,0,0,128,0,128,0,128

                ; --- HERO IDLE CAPA 2 (patron 84, mirando izquierda) ---
                DB      31,0,0,0,0,0,0,3,2,6,4,7,6,0,0,1
                DB      224,224,144,8,16,8,16,208,64,224,224,96,160,0,128,0

                ; --- HERO IDLE MIRROR CAPA 1 (patron 88, mirando derecha) ---
                DB      0,0,0,2,3,1,1,0,0,0,0,1,0,1,0,1
                DB      0,240,208,216,248,240,128,0,128,0,128,0,0,0,0,64

                ; --- HERO IDLE MIRROR CAPA 2 (patron 92, mirando derecha) ---
                DB      7,7,9,16,8,16,8,11,2,7,7,6,5,0,1,0
                DB      248,0,0,0,0,0,0,192,64,96,32,224,96,0,0,128

SPRITE_PATTERNS_END:

; ============================================================================
; DATOS: MAPA DEL NIVEL (32x24 tiles)
; 0=vacÃƒÂ­o, 1=plataforma, 2=gema, 3=pared
; ============================================================================
LEVEL_MAP_0:
                ; Fila 0 (pantalla 1 nueva)
                DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0

                ; Fila 1 (pantalla 1 nueva)
                DB      3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 2 (pantalla 1 nueva)
                DB      3,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,3

                ; Fila 3 (pantalla 1 nueva)
                DB      3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 4 (pantalla 1 nueva)
                DB      3,0,1,1,1,1,1,1,1,0,0,0,1,1,1,1
                DB      1,1,0,0,1,1,1,1,1,1,1,1,1,0,0,3

                ; Fila 5 (pantalla 1 nueva)
                DB      3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 6 (pantalla 1 nueva)
                DB      3,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0
                DB      2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 7 (pantalla 1 nueva)
                DB      3,0,1,1,1,1,0,0,0,0,1,1,1,1,1,1
                DB      1,1,1,1,1,1,1,1,0,0,1,1,1,1,0,3

                ; Fila 8 (pantalla 1 nueva)
                DB      3,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3

                ; Fila 9 (pantalla 1 nueva)
                DB      3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
                DB      2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 10 (pantalla 1 nueva)
                DB      3,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1
                DB      1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 11 (pantalla 1 nueva)
                DB      3,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0
                DB      1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,3

                ; Fila 12 (pantalla 1 nueva)
                DB      3,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,3

                ; Fila 13 (pantalla 1 nueva)
                DB      3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 14 (pantalla 1 nueva)
                DB      3,0,1,1,1,1,0,0,0,0,1,1,1,1,1,1
                DB      1,1,1,1,1,1,1,1,0,0,1,1,1,1,0,3

                ; Fila 15 (pantalla 1 nueva)
                DB      3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 16 (pantalla 1 nueva)
                DB      3,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,3

                ; Fila 17 (pantalla 1 nueva)
                DB      3,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1
                DB      1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 18 (pantalla 1 nueva)
                DB      3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
                DB      2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 19 (pantalla 1 nueva)
                DB      3,0,1,1,1,1,1,1,1,0,0,0,1,1,1,1
                DB      1,1,1,1,0,0,0,0,1,1,1,1,1,1,0,3

                ; Fila 20 (pantalla 1 nueva)
                DB      3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 21 (pantalla 1 nueva)
                DB      3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 22 (pantalla 1 nueva)
                DB      3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 23 (pantalla 1 nueva)
                DB      1,1,0,0,1,1,1,1,1,0,0,1,1,1,1,1
                DB      1,1,0,0,1,1,1,1,1,0,0,1,1,1,1,1

; ============================================================================
; SEGUNDA PANTALLA
; ============================================================================
LEVEL_MAP:
                ; Fila 0 (marcador)
                DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0

                ; Fila 1
                DB      3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 2
                DB      3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 3
                DB      3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 4 - Plataforma superior izquierda
                DB      3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 5
                DB      3,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,3

                ; Fila 6 - Plataformas con gemas
                DB      3,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,3

                ; Fila 7
                DB      3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 8
                DB      3,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0
                DB      0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 9 - Plataforma central superior
                DB      3,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1
                DB      1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,3

                ; Fila 10
                DB      3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 11
                DB      3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 12
                DB      3,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,3

                ; Fila 13 - Plataforma central
                DB      3,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,3

                ; Fila 14
                DB      3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 15
                DB      3,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0
                DB      0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 16 - Plataforma centro-inferior
                DB      3,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1
                DB      1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 17
                DB      3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 18
                DB      3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 19
                DB      3,0,0,2,0,0,0,0,0,0,0,0,0,0,2,0
                DB      0,2,0,0,0,0,0,0,0,0,0,0,2,0,0,3

                ; Fila 20 - Plataforma baja (con hueco central para pasar saltando)
                DB      3,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0
                DB      0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,3

                ; Fila 21
                DB      3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 22
                DB      3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 23 - Suelo
                DB      1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1
                DB      1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1

; ============================================================================
; TERCERA PANTALLA (ESTRUCTURA DISTINTA DE LADRILLOS)
; ============================================================================
LEVEL_MAP_2:
                ; Fila 0 (pantalla 2)
                DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0

                ; Fila 1 (pantalla 2)
                DB      3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 2 (pantalla 2)
                DB      3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 3 (pantalla 2)
                DB      3,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,3

                ; Fila 4 (pantalla 2)
                DB      3,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0
                DB      0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,3

                ; Fila 5 (pantalla 2)
                DB      3,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3
                DB      0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,3

                ; Fila 6 (pantalla 2)
                DB      3,0,1,1,1,1,1,1,0,0,0,0,1,1,1,1
                DB      1,1,1,0,0,0,0,0,1,1,1,1,1,1,0,3

                ; Fila 7 (pantalla 2)
                DB      3,0,0,0,0,0,0,2,0,0,0,0,0,0,0,3
                DB      0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 8 (pantalla 2)
                DB      3,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0
                DB      0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,3

                ; Fila 9 (pantalla 2)
                DB      3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,3

                ; Fila 10 (pantalla 2)
                DB      3,0,0,1,1,1,1,1,1,1,0,0,0,0,1,1
                DB      1,1,1,1,1,0,0,3,1,1,1,1,1,0,0,3

                ; Fila 11 (pantalla 2)
                DB      3,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,3,2,0,0,0,0,0,0,3

                ; Fila 12 (pantalla 2)
                DB      3,0,0,0,0,0,0,0,1,1,1,1,1,0,1,1
                DB      1,0,1,1,1,1,1,0,0,0,0,0,0,0,0,3

                ; Fila 13 (pantalla 2)
                DB      3,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 14 (pantalla 2)
                DB      3,0,1,1,1,1,1,0,0,3,1,1,1,1,1,0
                DB      0,0,1,1,1,1,1,0,0,0,1,1,1,1,0,3

                ; Fila 15 (pantalla 2)
                DB      3,0,0,0,0,0,0,0,0,3,0,2,0,0,0,0
                DB      0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 16 (pantalla 2)
                DB      3,0,0,0,0,1,1,1,1,1,1,1,0,0,0,1
                DB      1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,3

                ; Fila 17 (pantalla 2)
                DB      3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 18 (pantalla 2)
                DB      3,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1
                DB      0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,3

                ; Fila 19 (pantalla 2)
                DB      3,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0
                DB      0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,3

                ; Fila 20 (pantalla 2)
                DB      3,0,1,1,1,1,0,0,1,1,1,1,1,0,0,1
                DB      1,1,1,1,0,0,1,1,1,1,1,1,1,0,0,3

                ; Fila 21 (pantalla 2)
                DB      3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 22 (pantalla 2)
                DB      3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
                DB      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3

                ; Fila 23 (pantalla 2)
                DB      1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
                DB      1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1

; ============================================================================
; PADDING PARA COMPLETAR 16KB
; ============================================================================
                DS      $8000-$,$FF

; ============================================================================
; FIN DEL PROGRAMA
; ============================================================================
