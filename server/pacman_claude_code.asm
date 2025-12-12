; ============================================================
; PACMAN MINI - MSX ROM GAME
; Compilador: Glass.jar
; Uso: java -jar glass.jar pacman.asm pacman.rom
; Screen 2 con 3 bancos - Interrupt driven 60Hz
; ============================================================

; === CONSTANTES DEL SISTEMA MSX ===
CHGMOD      equ 0x005F      ; Cambiar modo de pantalla
LDIRVM      equ 0x005C      ; Cargar bloque a VRAM
WRTVRM      equ 0x004D      ; Escribir byte a VRAM
RDVRM       equ 0x004A      ; Leer byte de VRAM
SETWRT      equ 0x0053      ; Configurar escritura VRAM
SNSMAT      equ 0x0141      ; Leer matriz de teclado
ENASLT      equ 0x0024      ; Habilitar slot
RSLREG      equ 0x0138      ; Leer registro de slot

; === PUERTOS VDP ===
VDPDATA     equ 0x98
VDPCTRL     equ 0x99

; === DIRECCIONES VRAM SCREEN 2 ===
PGTBL       equ 0x0000      ; Pattern Generator (3 bancos)
NAMTBL      equ 0x1800      ; Name Table
CLRTBL      equ 0x2000      ; Color Table (3 bancos)
SPRATR      equ 0x1B00      ; Sprite Attribute Table
SPRTBL      equ 0x3800      ; Sprite Pattern Table

; === HOOKS DEL SISTEMA ===
H_TIMI      equ 0xFD9F      ; Hook de interrupción timer

; === CONSTANTES DEL JUEGO ===
TILE_EMPTY  equ 0
TILE_WALL   equ 1
TILE_DOT    equ 2
TILE_POWER  equ 3
TILE_DOOR   equ 4

MAP_WIDTH   equ 32
MAP_HEIGHT  equ 24

SPEED       equ 2           ; Velocidad del jugador

; ============================================================
; CABECERA ROM MSX (16KB)
; ============================================================
            org 0x4000

            db "AB"             ; Identificador ROM
            dw Main             ; Dirección de inicio
            dw 0x0000           ; STATEMENT handler
            dw 0x0000           ; DEVICE handler
            dw 0x0000           ; TEXT handler
            ds 6, 0x00          ; Reservado

; ============================================================
; PUNTO DE ENTRADA PRINCIPAL
; ============================================================
Main:
            di                  ; Deshabilitar interrupciones
            ld sp, 0xF380       ; Inicializar stack

            ; === Configurar Screen 2 ===
            ld a, 2
            call CHGMOD

            ; === Configurar VDP: Sprites 16x16 ===
            ld a, 0xE2          ; Reg 1: Sprites 16x16, sin magnificar
            out (VDPCTRL), a
            ld a, 0x81
            out (VDPCTRL), a

            ; === Cargar gráficos ===
            call LoadAllPatterns    ; Patrones en 3 bancos
            call LoadAllColors      ; Colores en 3 bancos
            call DrawMaze           ; Dibujar laberinto
            call LoadSpritePatterns ; Cargar sprites
            call InitPlayer         ; Inicializar jugador

            ; === Instalar hook de interrupción ===
            call InstallInterrupt

            ei                  ; Habilitar interrupciones

; ============================================================
; BUCLE PRINCIPAL DEL JUEGO (60Hz)
; ============================================================
GameLoop:
            halt                ; Sincronizar con VBlank (60Hz)

            call ReadKeyboard   ; Leer teclas cursor
            call ProcessInput   ; Procesar movimiento
            call CheckTilePickup; Recoger puntos
            call UpdateSprite   ; Actualizar sprite en VRAM

            jr GameLoop         ; Repetir infinitamente

; ============================================================
; INSTALAR HOOK DE INTERRUPCIÓN
; ============================================================
InstallInterrupt:
            di
            ; Guardar hook original
            ld hl, H_TIMI
            ld de, OldHook
            ld bc, 5
            ldir

            ; Instalar nuevo hook
            ld a, 0xC3          ; JP instruction
            ld (H_TIMI), a
            ld hl, TimerInterrupt
            ld (H_TIMI + 1), hl
            ei
            ret

; ============================================================
; RUTINA DE INTERRUPCIÓN DEL TIMER
; ============================================================
TimerInterrupt:
            push af
            push bc
            push de
            push hl

            ; Incrementar contador de frames
            ld hl, (FrameCounter)
            inc hl
            ld (FrameCounter), hl

            ; Animación del sprite (cada 8 frames)
            ld a, l
            and 0x08
            ld (AnimFrame), a

            pop hl
            pop de
            pop bc
            pop af

            ; Saltar al hook original
            jp OldHook

; ============================================================
; LEER TECLADO (CURSORES)
; ============================================================
ReadKeyboard:
            ; Fila 8: RIGHT LEFT DOWN UP SPACE...
            ld a, 8
            call SNSMAT
            cpl                 ; Invertir (1 = presionado)
            ld (KeyboardState), a
            ret

; ============================================================
; PROCESAR INPUT Y MOVER JUGADOR
; ============================================================
ProcessInput:
            ld a, (KeyboardState)
            ld b, a

            ; === DERECHA (bit 7) ===
            bit 7, b
            jr z, .CheckLeft
            ld a, (PlayerX)
            add a, SPEED
            cp 240              ; Límite derecho pantalla
            jr nc, .CheckLeft
            ld c, a
            ld a, (PlayerY)
            ld d, a
            ld a, c
            add a, 12           ; Borde derecho del sprite
            call GetTileAtPixel
            cp TILE_WALL
            jr z, .CheckLeft
            cp TILE_DOOR
            jr z, .CheckLeft
            ld a, c
            ld (PlayerX), a
            ld a, 0             ; Dirección: derecha
            ld (PlayerDir), a
            ret

.CheckLeft:
            ; === IZQUIERDA (bit 4) ===
            bit 4, b
            jr z, .CheckUp
            ld a, (PlayerX)
            sub SPEED
            cp 4                ; Límite izquierdo
            jr c, .CheckUp
            ld c, a
            ld a, (PlayerY)
            ld d, a
            ld a, c
            call GetTileAtPixel
            cp TILE_WALL
            jr z, .CheckUp
            cp TILE_DOOR
            jr z, .CheckUp
            ld a, c
            ld (PlayerX), a
            ld a, 1             ; Dirección: izquierda
            ld (PlayerDir), a
            ret

.CheckUp:
            ; === ARRIBA (bit 5) ===
            bit 5, b
            jr z, .CheckDown
            ld a, (PlayerY)
            sub SPEED
            cp 4                ; Límite superior
            jr c, .CheckDown
            ld d, a
            ld a, (PlayerX)
            ld c, a
            ld a, d
            call GetTileAtPixel
            cp TILE_WALL
            jr z, .CheckDown
            cp TILE_DOOR
            jr z, .CheckDown
            ld a, d
            ld (PlayerY), a
            ld a, 2             ; Dirección: arriba
            ld (PlayerDir), a
            ret

.CheckDown:
            ; === ABAJO (bit 6) ===
            bit 6, b
            ret z
            ld a, (PlayerY)
            add a, SPEED
            cp 176              ; Límite inferior
            ret nc
            ld d, a
            ld a, (PlayerX)
            ld c, a
            ld a, d
            add a, 12           ; Borde inferior sprite
            call GetTileAtPixel
            cp TILE_WALL
            ret z
            cp TILE_DOOR
            ret z
            ld a, d
            ld (PlayerY), a
            ld a, 3             ; Dirección: abajo
            ld (PlayerDir), a
            ret

; ============================================================
; OBTENER TILE EN POSICIÓN PIXEL
; Entrada: A = Y pixel, C = X pixel
; Salida: A = número de tile
; ============================================================
GetTileAtPixel:
            ; Convertir Y pixel a tile (Y / 8)
            srl a
            srl a
            srl a
            ld e, a             ; E = tile Y

            ; Convertir X pixel a tile (X / 8)
            ld a, c
            srl a
            srl a
            srl a
            ld d, a             ; D = tile X

            ; Calcular offset: Y * 32 + X
            ld a, e
            ld h, 0
            ld l, a
            add hl, hl          ; *2
            add hl, hl          ; *4
            add hl, hl          ; *8
            add hl, hl          ; *16
            add hl, hl          ; *32
            ld e, d
            ld d, 0
            add hl, de          ; + X

            ; Obtener tile del mapa
            ld de, MazeData
            add hl, de
            ld a, (hl)
            ret

; ============================================================
; RECOGER PUNTOS/DOTS
; ============================================================
CheckTilePickup:
            ld a, (PlayerY)
            add a, 6            ; Centro del sprite
            ld e, a
            ld a, (PlayerX)
            add a, 6
            ld c, a
            ld a, e
            call GetTileAtPixel

            cp TILE_DOT
            jr z, .PickupDot
            cp TILE_POWER
            jr z, .PickupPower
            ret

.PickupDot:
            ; Borrar punto del mapa
            call RemoveTile
            ; Incrementar puntuación
            ld hl, (Score)
            ld de, 10
            add hl, de
            ld (Score), hl
            ret

.PickupPower:
            call RemoveTile
            ld hl, (Score)
            ld de, 50
            add hl, de
            ld (Score), hl
            ret

; ============================================================
; BORRAR TILE DEL MAPA Y VRAM
; ============================================================
RemoveTile:
            ; Calcular posición en mapa
            ld a, (PlayerY)
            add a, 6
            srl a
            srl a
            srl a
            ld e, a
            ld a, (PlayerX)
            add a, 6
            srl a
            srl a
            srl a
            ld d, a

            ; Offset en mapa
            ld a, e
            ld h, 0
            ld l, a
            add hl, hl
            add hl, hl
            add hl, hl
            add hl, hl
            add hl, hl
            ld a, d
            ld e, a
            ld d, 0
            add hl, de

            ; Poner TILE_EMPTY en mapa RAM
            ld de, MazeData
            add hl, de
            ld (hl), TILE_EMPTY

            ; Calcular dirección VRAM Name Table
            ld a, (PlayerY)
            add a, 6
            srl a
            srl a
            srl a
            ld e, a
            ld a, (PlayerX)
            add a, 6
            srl a
            srl a
            srl a
            ld d, a

            ld a, e
            ld h, 0
            ld l, a
            add hl, hl
            add hl, hl
            add hl, hl
            add hl, hl
            add hl, hl
            ld a, d
            ld e, a
            ld d, 0
            add hl, de
            ld de, NAMTBL
            add hl, de

            ; Escribir tile vacío en VRAM
            ld a, TILE_EMPTY
            call WRTVRM
            ret

; ============================================================
; ACTUALIZAR SPRITE EN VRAM
; ============================================================
UpdateSprite:
            ld hl, SPRATR
            call SETWRT

            ; Y (ajustado para offset VDP)
            ld a, (PlayerY)
            dec a
            out (VDPDATA), a
            nop
            nop

            ; X
            ld a, (PlayerX)
            out (VDPDATA), a
            nop
            nop

            ; Patrón (según dirección y animación)
            ld a, (PlayerDir)
            sla a
            sla a               ; *4 (cada sprite = 4 patrones)
            ld b, a
            ld a, (AnimFrame)
            and 0x08
            jr z, .NoAnim
            ld a, 16            ; Frame alternativo
.NoAnim:
            add a, b
            out (VDPDATA), a
            nop
            nop

            ; Color (amarillo)
            ld a, 11            ; Amarillo brillante
            out (VDPDATA), a

            ret

; ============================================================
; INICIALIZAR JUGADOR
; ============================================================
InitPlayer:
            ld a, 120           ; X inicial (centro)
            ld (PlayerX), a
            ld a, 136           ; Y inicial (abajo del centro)
            ld (PlayerY), a
            ld a, 0
            ld (PlayerDir), a
            ld hl, 0
            ld (Score), hl
            ld (FrameCounter), hl
            ret

; ============================================================
; CARGAR PATRONES EN LOS 3 BANCOS DE VRAM
; ============================================================
LoadAllPatterns:
            ; Banco 0: 0x0000-0x07FF
            ld hl, PatternData
            ld de, PGTBL
            ld bc, 256 * 8
            call LDIRVM

            ; Banco 1: 0x0800-0x0FFF
            ld hl, PatternData
            ld de, PGTBL + 0x0800
            ld bc, 256 * 8
            call LDIRVM

            ; Banco 2: 0x1000-0x17FF
            ld hl, PatternData
            ld de, PGTBL + 0x1000
            ld bc, 256 * 8
            call LDIRVM

            ret

; ============================================================
; CARGAR COLORES EN LOS 3 BANCOS DE VRAM
; ============================================================
LoadAllColors:
            ; Banco 0: 0x2000-0x27FF
            ld hl, ColorData
            ld de, CLRTBL
            ld bc, 256 * 8
            call LDIRVM

            ; Banco 1: 0x2800-0x2FFF
            ld hl, ColorData
            ld de, CLRTBL + 0x0800
            ld bc, 256 * 8
            call LDIRVM

            ; Banco 2: 0x3000-0x37FF
            ld hl, ColorData
            ld de, CLRTBL + 0x1000
            ld bc, 256 * 8
            call LDIRVM

            ret

; ============================================================
; DIBUJAR LABERINTO EN NAME TABLE
; ============================================================
DrawMaze:
            ld hl, NAMTBL
            call SETWRT

            ld hl, MazeData
            ld bc, MAP_WIDTH * MAP_HEIGHT

.DrawLoop:
            ld a, (hl)
            out (VDPDATA), a
            inc hl
            dec bc
            ld a, b
            or c
            jr nz, .DrawLoop

            ret

; ============================================================
; CARGAR PATRONES DE SPRITES
; ============================================================
LoadSpritePatterns:
            ld hl, SpritePatterns
            ld de, SPRTBL
            ld bc, 32 * 8       ; 8 sprites de 16x16
            call LDIRVM

            ; Terminar lista de sprites con Y=208
            ld hl, SPRATR + 4
            ld a, 208
            call WRTVRM

            ret

; ============================================================
; DATOS DE PATRONES (TILES)
; ============================================================
PatternData:
            ; Tile 0: Vacío/Camino (fondo negro)
            db 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00

            ; Tile 1: Pared sólida (bloque azul estilo Pacman)
            db 0xFF, 0x81, 0xBD, 0xA5, 0xA5, 0xBD, 0x81, 0xFF

            ; Tile 2: Punto pequeño (dot)
            db 0x00, 0x00, 0x00, 0x18, 0x18, 0x00, 0x00, 0x00

            ; Tile 3: Power Pellet (grande, parpadeante)
            db 0x00, 0x3C, 0x7E, 0x7E, 0x7E, 0x7E, 0x3C, 0x00

            ; Tile 4: Puerta de fantasmas
            db 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00

            ; Tile 5: Esquina superior izquierda doble
            db 0xFF, 0xC0, 0xDF, 0xD8, 0xDB, 0xDB, 0xDB, 0xDB

            ; Tile 6: Esquina superior derecha doble
            db 0xFF, 0x03, 0xFB, 0x1B, 0xDB, 0xDB, 0xDB, 0xDB

            ; Tile 7: Esquina inferior izquierda doble
            db 0xDB, 0xDB, 0xDB, 0xDB, 0xD8, 0xDF, 0xC0, 0xFF

            ; Tile 8: Esquina inferior derecha doble
            db 0xDB, 0xDB, 0xDB, 0xDB, 0x1B, 0xFB, 0x03, 0xFF

            ; Tile 9: Borde horizontal doble superior
            db 0xFF, 0x00, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00

            ; Tile 10: Borde horizontal doble inferior
            db 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0x00, 0xFF

            ; Tile 11: Borde vertical doble izquierdo
            db 0xDB, 0xDB, 0xDB, 0xDB, 0xDB, 0xDB, 0xDB, 0xDB

            ; Tile 12: Borde vertical doble derecho
            db 0xDB, 0xDB, 0xDB, 0xDB, 0xDB, 0xDB, 0xDB, 0xDB

            ; Tile 13: T hacia arriba
            db 0xDB, 0xDB, 0xDB, 0xDB, 0xD8, 0xDF, 0x00, 0xFF

            ; Tile 14: T hacia abajo
            db 0xFF, 0x00, 0xDF, 0xD8, 0xDB, 0xDB, 0xDB, 0xDB

            ; Tile 15: T hacia izquierda
            db 0xDB, 0xDB, 0x1B, 0xFB, 0x1B, 0xDB, 0xDB, 0xDB

            ; Tile 16: T hacia derecha
            db 0xDB, 0xDB, 0xD8, 0xDF, 0xD8, 0xDB, 0xDB, 0xDB

            ; Rellenar resto hasta 256 tiles
            ds (256 - 17) * 8, 0x00

; ============================================================
; DATOS DE COLORES
; ============================================================
ColorData:
            ; Tile 0: Negro sobre negro
            db 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11

            ; Tile 1: Azul brillante sobre azul oscuro (pared Pacman clásico)
            db 0x54, 0x54, 0x54, 0x54, 0x54, 0x54, 0x54, 0x54

            ; Tile 2: Blanco sobre negro (dots)
            db 0xF1, 0xF1, 0xF1, 0xF1, 0xF1, 0xF1, 0xF1, 0xF1

            ; Tile 3: Amarillo sobre negro (power pellet)
            db 0xB1, 0xB1, 0xB1, 0xB1, 0xB1, 0xB1, 0xB1, 0xB1

            ; Tile 4: Magenta sobre negro (puerta)
            db 0xD1, 0xD1, 0xD1, 0xD1, 0xD1, 0xD1, 0xD1, 0xD1

            ; Tiles 5-16: Azul (bordes estilo Pacman)
            db 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51
            db 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51
            db 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51
            db 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51
            db 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51
            db 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51
            db 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51
            db 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51
            db 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51
            db 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51
            db 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51
            db 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51, 0x51

            ; Rellenar resto
            ds (256 - 17) * 8, 0x11

; ============================================================
; PATRONES DE SPRITE (PACMAN 16x16)
; ============================================================
SpritePatterns:
            ; Sprite 0-3: Pacman derecha (boca abierta)
            db 0x07, 0x1F, 0x3F, 0x7F, 0xFF, 0xFE, 0xFC, 0xF8
            db 0xF8, 0xFC, 0xFE, 0xFF, 0x7F, 0x3F, 0x1F, 0x07
            db 0xC0, 0xF0, 0xF8, 0xFC, 0xFE, 0x3E, 0x0E, 0x06
            db 0x06, 0x0E, 0x3E, 0xFE, 0xFC, 0xF8, 0xF0, 0xC0

            ; Sprite 4-7: Pacman izquierda (boca abierta)
            db 0x03, 0x0F, 0x1F, 0x3F, 0x7F, 0x7C, 0x70, 0x60
            db 0x60, 0x70, 0x7C, 0x7F, 0x3F, 0x1F, 0x0F, 0x03
            db 0xE0, 0xF8, 0xFC, 0xFE, 0xFF, 0x7F, 0x3F, 0x1F
            db 0x1F, 0x3F, 0x7F, 0xFF, 0xFE, 0xFC, 0xF8, 0xE0

            ; Sprite 8-11: Pacman arriba
            db 0x1C, 0x3C, 0x7C, 0x7E, 0xFC, 0xFE, 0xFE, 0xFF
            db 0xFF, 0xFE, 0xFE, 0xFC, 0x7E, 0x7C, 0x3C, 0x1C
            db 0x38, 0x3C, 0x3E, 0x7E, 0x3F, 0x7F, 0x7F, 0xFF
            db 0xFF, 0x7F, 0x7F, 0x3F, 0x7E, 0x3E, 0x3C, 0x38

            ; Sprite 12-15: Pacman abajo
            db 0x1C, 0x3C, 0x7C, 0x7E, 0xFE, 0xFE, 0xFE, 0xFF
            db 0xFF, 0xFC, 0xFC, 0xFE, 0x7C, 0x78, 0x38, 0x18
            db 0x38, 0x3C, 0x3E, 0x7E, 0x7F, 0x7F, 0x7F, 0xFF
            db 0xFF, 0x3F, 0x3F, 0x7F, 0x3E, 0x1E, 0x1C, 0x18

            ; Sprite 16-19: Pacman cerrado (universal)
            db 0x07, 0x1F, 0x3F, 0x7F, 0xFF, 0xFF, 0xFF, 0xFF
            db 0xFF, 0xFF, 0xFF, 0xFF, 0x7F, 0x3F, 0x1F, 0x07
            db 0xE0, 0xF8, 0xFC, 0xFE, 0xFF, 0xFF, 0xFF, 0xFF
            db 0xFF, 0xFF, 0xFF, 0xFF, 0xFE, 0xFC, 0xF8, 0xE0

            ; Espacio para más sprites
            ds 32 * 3, 0x00

; ============================================================
; MAPA DEL LABERINTO (32x24 tiles) - ESTILO PACMAN
; ============================================================
MazeData:
            ; Fila 0: Borde superior
            db 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
            ; Fila 1
            db 1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1
            ; Fila 2
            db 1,2,1,1,1,1,2,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,2,1,1,1,1,2,1
            ; Fila 3
            db 1,3,1,1,1,1,2,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,2,1,1,1,1,3,1
            ; Fila 4
            db 1,2,1,1,1,1,2,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,2,1,1,1,1,2,1
            ; Fila 5
            db 1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1
            ; Fila 6
            db 1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1
            ; Fila 7
            db 1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1
            ; Fila 8
            db 1,2,2,2,2,2,2,1,1,2,2,2,2,2,2,1,1,2,2,2,2,2,2,1,1,2,2,2,2,2,2,1
            ; Fila 9
            db 1,1,1,1,1,1,2,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,2,1,1,1,1,1,1
            ; Fila 10
            db 0,0,0,0,0,1,2,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,2,1,0,0,0,0,0
            ; Fila 11
            db 0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0
            ; Fila 12: Casa de fantasmas
            db 1,1,1,1,1,1,2,1,1,0,1,1,1,4,4,4,4,1,1,1,0,1,1,2,1,1,1,1,1,1,1,1
            ; Fila 13
            db 0,0,0,0,0,0,2,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,0,0,0,0,0
            ; Fila 14
            db 1,1,1,1,1,1,2,1,1,0,1,0,0,0,0,0,0,0,0,1,0,1,1,2,1,1,1,1,1,1,1,1
            ; Fila 15
            db 0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0,0,0
            ; Fila 16
            db 0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0,0,0
            ; Fila 17
            db 1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1,1,1
            ; Fila 18
            db 1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1
            ; Fila 19
            db 1,2,1,1,1,1,2,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,2,1,1,1,1,2,1
            ; Fila 20
            db 1,3,2,2,1,1,2,2,2,2,2,2,2,2,2,0,0,2,2,2,2,2,2,2,2,2,1,1,2,2,3,1
            ; Fila 21
            db 1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1
            ; Fila 22
            db 1,2,2,2,2,2,2,1,1,2,2,2,2,2,2,1,1,2,2,2,2,2,2,1,1,2,2,2,2,2,2,1
            ; Fila 23: Borde inferior
            db 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1

; ============================================================
; VARIABLES EN RAM
; ============================================================
            org 0xC000

PlayerX:        ds 1        ; Posición X del jugador
PlayerY:        ds 1        ; Posición Y del jugador
PlayerDir:      ds 1        ; Dirección (0=der, 1=izq, 2=arr, 3=aba)
KeyboardState:  ds 1        ; Estado del teclado
AnimFrame:      ds 1        ; Frame de animación
FrameCounter:   ds 2        ; Contador de frames
Score:          ds 2        ; Puntuación
OldHook:        ds 5        ; Hook original guardado

; ============================================================
; PADDING PARA COMPLETAR 16KB ROM
; ============================================================
            org 0x7FFF
            db 0x00

            end