
; ============================================================
; PACMAN MINI GAME - MSX SCREEN 2
; Compilar: java -jar glass.jar pacman.asm pacman.rom
; ============================================================

; ============================================================
; CONSTANTES DEL SISTEMA MSX
; ============================================================

; Puertos VDP
VDPDATA:        equ 0x98
VDPSTAT:        equ 0x99

; Puertos Teclado/PPI
PPI_C:          equ 0xAA
PPI_B:          equ 0xA9

; Direcciones VRAM para SCREEN 2
PATTBL:         equ 0x0000
NAMTBL:         equ 0x1800
COLTBL:         equ 0x2000
SPRATR:         equ 0x1B00
SPRTBL:         equ 0x3800

; Hook del sistema
HTIMI:          equ 0xFD9F

; Colores VDP
BLACK:          equ 1
BLUE:           equ 4
DBLUE:          equ 5
YELLOW:         equ 10
WHITE:          equ 15

; Constantes del juego
MAZE_WIDTH:     equ 32
MAZE_HEIGHT:    equ 24
SPEED:          equ 2

; ============================================================
; VARIABLES EN RAM - RESERVA DE ESPACIO
; ============================================================
RAMBASE:        equ 0xE000

; ============================================================
; CABECERA ROM MSX (16KB)
; ============================================================
                org 0x4000

; Cabecera ROM
                db  "AB"
                dw  Main
                dw  0x0000
                dw  0x0000
                dw  0x0000
                dw  0x0000
                dw  0x0000
                dw  0x0000

; ============================================================
; PUNTO DE ENTRADA PRINCIPAL
; ============================================================
Main:
                di
                ld   sp, 0xF380

                ; Inicializar variables en RAM
                call InitVariables

                ; Inicializar SCREEN 2
                call InitScreen2

                ; Cargar gráficos
                call LoadPatterns
                call LoadColors
                call DrawMaze
                call LoadSprites

                ; Instalar hook de interrupción
                call InstallHook

                ; Activar pantalla
                ld   a, 0xE2
                ld   b, 1
                call WriteVDPReg

                ei

; Bucle principal
GameLoop:
                halt
                jr   GameLoop

; ============================================================
; INICIALIZAR VARIABLES EN RAM
; ============================================================
InitVariables:
                ; PlayerX = 120
                ld   a, 120
                ld   (RAMBASE), a

                ; PlayerY = 136
                ld   a, 136
                ld   (RAMBASE+1), a

                ; PlayerDir = 0
                xor  a
                ld   (RAMBASE+2), a

                ; NextDir = 0
                ld   (RAMBASE+3), a

                ; FrameCount = 0
                ld   (RAMBASE+9), a

                ; AnimFrame = 0
                ld   (RAMBASE+10), a

                ret

; ============================================================
; INICIALIZAR SCREEN 2
; ============================================================
InitScreen2:
                ; Registro 0: Modo gráfico 2
                ld   a, 0x02
                ld   b, 0
                call WriteVDPReg

                ; Registro 1: 16K, display OFF, INT ON, sprites 16x16
                ld   a, 0x62
                ld   b, 1
                call WriteVDPReg

                ; Registro 2: Name Table en 0x1800
                ld   a, 0x06
                ld   b, 2
                call WriteVDPReg

                ; Registro 3: Color Table (SCREEN 2: 0xFF)
                ld   a, 0xFF
                ld   b, 3
                call WriteVDPReg

                ; Registro 4: Pattern Table (SCREEN 2: 0x03)
                ld   a, 0x03
                ld   b, 4
                call WriteVDPReg

                ; Registro 5: Sprite Attribute Table
                ld   a, 0x36
                ld   b, 5
                call WriteVDPReg

                ; Registro 6: Sprite Pattern Table
                ld   a, 0x07
                ld   b, 6
                call WriteVDPReg

                ; Registro 7: Color de fondo
                ld   a, BLACK
                ld   b, 7
                call WriteVDPReg

                ; Limpiar VRAM
                call ClearVRAM

                ret

; ============================================================
; ESCRIBIR REGISTRO VDP
; A = valor, B = número de registro
; ============================================================
WriteVDPReg:
                push af
                di
                out  (VDPSTAT), a
                ld   a, b
                or   0x80
                out  (VDPSTAT), a
                ei
                pop  af
                ret

; ============================================================
; ESTABLECER DIRECCIÓN VRAM PARA ESCRITURA
; HL = dirección VRAM
; ============================================================
SetVRAMWrite:
                di
                ld   a, l
                out  (VDPSTAT), a
                ld   a, h
                or   0x40
                out  (VDPSTAT), a
                ei
                ret

; ============================================================
; LIMPIAR VRAM (16KB)
; ============================================================
ClearVRAM:
                ld   hl, 0x0000
                call SetVRAMWrite

                ld   bc, 0x4000
                xor  a
ClearLoop:
                out  (VDPDATA), a
                dec  bc
                ld   a, b
                or   c
                jr   nz, ClearLoop
                ret

; ============================================================
; CARGAR PATRONES (3 BANCOS)
; ============================================================
LoadPatterns:
                ; Banco 0
                ld   hl, PATTBL
                call SetVRAMWrite
                ld   hl, PatternData
                ld   bc, 2048
                call LoadDataBlock

                ; Banco 1
                ld   hl, PATTBL + 2048
                call SetVRAMWrite
                ld   hl, PatternData
                ld   bc, 2048
                call LoadDataBlock

                ; Banco 2
                ld   hl, PATTBL + 4096
                call SetVRAMWrite
                ld   hl, PatternData
                ld   bc, 2048
                call LoadDataBlock

                ret

; ============================================================
; CARGAR COLORES (3 BANCOS)
; ============================================================
LoadColors:
                ; Banco 0
                ld   hl, COLTBL
                call SetVRAMWrite
                ld   hl, ColorData
                ld   bc, 2048
                call LoadDataBlock

                ; Banco 1
                ld   hl, COLTBL + 2048
                call SetVRAMWrite
                ld   hl, ColorData
                ld   bc, 2048
                call LoadDataBlock

                ; Banco 2
                ld   hl, COLTBL + 4096
                call SetVRAMWrite
                ld   hl, ColorData
                ld   bc, 2048
                call LoadDataBlock

                ret

; ============================================================
; CARGAR BLOQUE DE DATOS A VRAM
; HL = origen, BC = tamaño
; ============================================================
LoadDataBlock:
                ld   a, (hl)
                out  (VDPDATA), a
                inc  hl
                dec  bc
                ld   a, b
                or   c
                jr   nz, LoadDataBlock
                ret

; ============================================================
; DIBUJAR LABERINTO EN NAME TABLE
; ============================================================
DrawMaze:
                ld   hl, NAMTBL
                call SetVRAMWrite

                ld   hl, MazeMap
                ld   bc, MAZE_WIDTH * MAZE_HEIGHT
DrawMazeLoop:
                ld   a, (hl)
                out  (VDPDATA), a
                inc  hl
                dec  bc
                ld   a, b
                or   c
                jr   nz, DrawMazeLoop
                ret

; ============================================================
; CARGAR SPRITES
; ============================================================
LoadSprites:
                ld   hl, SPRTBL
                call SetVRAMWrite

                ld   hl, SpriteData
                ld   bc, 128
                call LoadDataBlock

                ; Terminar lista de sprites
                ld   hl, SPRATR + 4
                call SetVRAMWrite
                ld   a, 0xD0
                out  (VDPDATA), a

                ret

; ============================================================
; INSTALAR HOOK DE INTERRUPCIÓN
; ============================================================
InstallHook:
                di

                ; Guardar hook original (5 bytes)
                ld   hl, HTIMI
                ld   de, RAMBASE+4
                ld   bc, 5
                ldir

                ; Instalar nuevo hook
                ld   a, 0xC3
                ld   (HTIMI), a
                ld   hl, InterruptHandler
                ld   (HTIMI + 1), hl

                ei
                ret

; ============================================================
; MANEJADOR DE INTERRUPCIÓN (60 Hz)
; ============================================================
InterruptHandler:
                push af
                push bc
                push de
                push hl

                ; Incrementar contador de frames
                ld   hl, RAMBASE+9
                inc  (hl)

                ; Leer teclado y procesar
                call ReadKeyboard
                call ProcessMovement
                call UpdateSprite

                pop  hl
                pop  de
                pop  bc
                pop  af

                ; Saltar al hook original
                jp   RAMBASE+4

; ============================================================
; LEER TECLADO (FLECHAS)
; ============================================================
ReadKeyboard:
                ; Seleccionar fila 8 del teclado
                ld   a, 8
                di
                in   a, (PPI_C)
                and  0xF0
                or   8
                out  (PPI_C), a
                ei
                in   a, (PPI_B)
                ld   b, a

                ; Verificar Derecha (bit 7)
                bit  7, b
                jr   nz, ChkLeft
                ld   a, 1
                ld   (RAMBASE+3), a
                ret

ChkLeft:
                ; Verificar Izquierda (bit 4)
                bit  4, b
                jr   nz, ChkUp
                ld   a, 2
                ld   (RAMBASE+3), a
                ret

ChkUp:
                ; Verificar Arriba (bit 5)
                bit  5, b
                jr   nz, ChkDown
                ld   a, 3
                ld   (RAMBASE+3), a
                ret

ChkDown:
                ; Verificar Abajo (bit 6)
                bit  6, b
                ret  nz
                ld   a, 4
                ld   (RAMBASE+3), a
                ret

; ============================================================
; PROCESAR MOVIMIENTO
; ============================================================
ProcessMovement:
                ; Intentar nueva dirección
                ld   a, (RAMBASE+3)
                or   a
                jr   z, ContMove

                ; Guardar nueva dirección deseada
                ld   c, a

                ; Obtener posición actual
                ld   a, (RAMBASE)
                ld   d, a
                ld   a, (RAMBASE+1)
                ld   e, a

                ; Calcular nueva posición
                ld   a, c
                call CalcNewPos

                ; Verificar colisión
                call CheckCollision
                jr   c, ContMove

                ; Cambiar dirección
                ld   a, (RAMBASE+3)
                ld   (RAMBASE+2), a

ContMove:
                ; Mover en dirección actual
                ld   a, (RAMBASE+2)
                or   a
                ret  z

                ld   c, a
                ld   a, (RAMBASE)
                ld   d, a
                ld   a, (RAMBASE+1)
                ld   e, a

                ld   a, c
                call CalcNewPos

                call CheckCollision
                ret  c

                ; Actualizar posición
                ld   a, d
                ld   (RAMBASE), a
                ld   a, e
                ld   (RAMBASE+1), a
                ret

; ============================================================
; CALCULAR NUEVA POSICIÓN
; A=dir, D=X, E=Y -> D=newX, E=newY
; ============================================================
CalcNewPos:
                cp   1
                jr   nz, NotRight
                ld   a, d
                add  a, SPEED
                ld   d, a
                ret
NotRight:
                cp   2
                jr   nz, NotLeft
                ld   a, d
                sub  SPEED
                ld   d, a
                ret
NotLeft:
                cp   3
                jr   nz, NotUp
                ld   a, e
                sub  SPEED
                ld   e, a
                ret
NotUp:
                cp   4
                ret  nz
                ld   a, e
                add  a, SPEED
                ld   e, a
                ret

; ============================================================
; VERIFICAR COLISIÓN
; D=X, E=Y -> Carry=colisión
; ============================================================
CheckCollision:
                ; Guardar posición
                ld   a, d
                ld   (RAMBASE+11), a
                ld   a, e
                ld   (RAMBASE+12), a

                ; Límite izquierdo
                ld   a, d
                cp   8
                jr   c, CollisionYes

                ; Límite derecho
                cp   240
                jr   nc, CollisionYes

                ; Límite superior
                ld   a, e
                cp   8
                jr   c, CollisionYes

                ; Límite inferior
                cp   176
                jr   nc, CollisionYes

                ; Esquina superior izquierda
                ld   a, (RAMBASE+11)
                add  a, 2
                ld   d, a
                ld   a, (RAMBASE+12)
                add  a, 2
                ld   e, a
                call CheckTile
                jr   c, CollisionYes

                ; Esquina superior derecha
                ld   a, (RAMBASE+11)
                add  a, 13
                ld   d, a
                ld   a, (RAMBASE+12)
                add  a, 2
                ld   e, a
                call CheckTile
                jr   c, CollisionYes

                ; Esquina inferior izquierda
                ld   a, (RAMBASE+11)
                add  a, 2
                ld   d, a
                ld   a, (RAMBASE+12)
                add  a, 13
                ld   e, a
                call CheckTile
                jr   c, CollisionYes

                ; Esquina inferior derecha
                ld   a, (RAMBASE+11)
                add  a, 13
                ld   d, a
                ld   a, (RAMBASE+12)
                add  a, 13
                ld   e, a
                call CheckTile
                ret

CollisionYes:
                scf
                ret

; ============================================================
; VERIFICAR TILE EN POSICIÓN
; D=X, E=Y (píxeles) -> Carry=pared
; ============================================================
CheckTile:
                ; X / 8
                ld   a, d
                srl  a
                srl  a
                srl  a
                ld   l, a

                ; Y / 8
                ld   a, e
                srl  a
                srl  a
                srl  a
                ld   h, a

                ; Calcular offset = Y*32 + X
                push de
                ld   d, 0
                ld   e, l

                ld   a, h
                ld   h, 0
                ld   l, a
                add  hl, hl
                add  hl, hl
                add  hl, hl
                add  hl, hl
                add  hl, hl
                add  hl, de

                ld   de, MazeMap
                add  hl, de

                ld   a, (hl)
                pop  de

                ; Tiles 1-15 son paredes
                cp   16
                jr   nc, TileOK
                cp   1
                jr   c, TileOK
                scf
                ret

TileOK:
                or   a
                ret

; ============================================================
; ACTUALIZAR SPRITE EN PANTALLA
; ============================================================
UpdateSprite:
                ld   hl, SPRATR
                call SetVRAMWrite

                ; Y (ajuste VDP: Y-1)
                ld   a, (RAMBASE+1)
                dec  a
                out  (VDPDATA), a

                ; X
                ld   a, (RAMBASE)
                out  (VDPDATA), a

                ; Patrón (animación)
                ld   a, (RAMBASE+9)
                and  0x08
                srl  a
                srl  a
                out  (VDPDATA), a

                ; Color amarillo
                ld   a, YELLOW
                out  (VDPDATA), a

                ret

; ============================================================
; DATOS DE PATRONES (256 tiles x 8 bytes = 2048 bytes)
; ============================================================
PatternData:
                ; Tile 0: Vacío (pasillo)
                db   0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00

                ; Tile 1: Bloque sólido
                db   0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF

                ; Tile 2: Esquina sup-izq redondeada
                db   0x00, 0x1F, 0x3F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F

                ; Tile 3: Esquina sup-der redondeada
                db   0x00, 0xF8, 0xFC, 0xFE, 0xFE, 0xFE, 0xFE, 0xFE

                ; Tile 4: Esquina inf-izq redondeada
                db   0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x3F, 0x1F, 0x00

                ; Tile 5: Esquina inf-der redondeada
                db   0xFE, 0xFE, 0xFE, 0xFE, 0xFE, 0xFC, 0xF8, 0x00

                ; Tile 6: Borde horizontal
                db   0x00, 0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x00

                ; Tile 7: Borde horizontal bajo
                db   0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x00

                ; Tile 8: Borde vertical izq
                db   0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F, 0x7F

                ; Tile 9: Borde vertical der
                db   0xFE, 0xFE, 0xFE, 0xFE, 0xFE, 0xFE, 0xFE, 0xFE

                ; Tile 10: Pellet pequeño
                db   0x00, 0x00, 0x00, 0x18, 0x18, 0x00, 0x00, 0x00

                ; Tile 11: Power pellet
                db   0x00, 0x3C, 0x7E, 0x7E, 0x7E, 0x7E, 0x3C, 0x00

                ; Tile 12: T arriba
                db   0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00

                ; Tile 13: T abajo
                db   0x00, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF

                ; Tile 14: Puerta fantasmas
                db   0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00

                ; Tile 15: Decorativo
                db   0xFF, 0x81, 0xBD, 0xA5, 0xA5, 0xBD, 0x81, 0xFF

                ; Tile 16: Pasillo con pellet
                db   0x00, 0x00, 0x00, 0x18, 0x18, 0x00, 0x00, 0x00

                ; Tiles 17-255: Vacíos (relleno hasta 2048 bytes)
PatternFill:
                ds   2048 - (PatternFill - PatternData), 0x00

; ============================================================
; DATOS DE COLORES (256 tiles x 8 bytes = 2048 bytes)
; ============================================================
ColorData:
                ; Color 0: Negro/Negro (pasillo)
                db   0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11

                ; Color 1-9: Azul claro/Azul oscuro (paredes)
                db   0x54, 0x54, 0x54, 0x54, 0x54, 0x54, 0x54, 0x54
                db   0x54, 0x54, 0x54, 0x54, 0x54, 0x54, 0x54, 0x54
                db   0x54, 0x54, 0x54, 0x54, 0x54, 0x54, 0x54, 0x54
                db   0x54, 0x54, 0x54, 0x54, 0x54, 0x54, 0x54, 0x54
                db   0x54, 0x54, 0x54, 0x54, 0x54, 0x54, 0x54, 0x54
                db   0x54, 0x54, 0x54, 0x54, 0x54, 0x54, 0x54, 0x54
                db   0x54, 0x54, 0x54, 0x54, 0x54, 0x54, 0x54, 0x54
                db   0x54, 0x54, 0x54, 0x54, 0x54, 0x54, 0x54, 0x54
                db   0x54, 0x54, 0x54, 0x54, 0x54, 0x54, 0x54, 0x54

                ; Color 10-11: Amarillo/Negro (pellets)
                db   0xA1, 0xA1, 0xA1, 0xA1, 0xA1, 0xA1, 0xA1, 0xA1
                db   0xA1, 0xA1, 0xA1, 0xA1, 0xA1, 0xA1, 0xA1, 0xA1

                ; Color 12-13: Azul (conexiones)
                db   0x54, 0x54, 0x54, 0x54, 0x54, 0x54, 0x54, 0x54
                db   0x54, 0x54, 0x54, 0x54, 0x54, 0x54, 0x54, 0x54

                ; Color 14: Rosa/Negro (puerta)
                db   0xD1, 0xD1, 0xD1, 0xD1, 0xD1, 0xD1, 0xD1, 0xD1

                ; Color 15: Azul (decorativo)
                db   0x54, 0x54, 0x54, 0x54, 0x54, 0x54, 0x54, 0x54

                ; Color 16: Amarillo/Negro (pasillo+pellet)
                db   0xA1, 0xA1, 0xA1, 0xA1, 0xA1, 0xA1, 0xA1, 0xA1

                ; Relleno hasta 2048 bytes
ColorFill:
                ds   2048 - (ColorFill - ColorData), 0x11

; ============================================================
; DATOS DE SPRITES (4 frames x 32 bytes = 128 bytes)
; ============================================================
SpriteData:
                ; Frame 0: Pacman derecha boca abierta
                db   0x03, 0x0F, 0x1F, 0x3F, 0x7F, 0x7F, 0xFF, 0xFF
                db   0xFF, 0xFF, 0x7F, 0x7F, 0x3F, 0x1F, 0x0F, 0x03
                db   0xC0, 0xF0, 0xF8, 0x7C, 0x3E, 0x1E, 0x0E, 0x0E
                db   0x0E, 0x0E, 0x1E, 0x3E, 0x7C, 0xF8, 0xF0, 0xC0

                ; Frame 1: Pacman cerrado
                db   0x03, 0x0F, 0x1F, 0x3F, 0x7F, 0x7F, 0xFF, 0xFF
                db   0xFF, 0xFF, 0x7F, 0x7F, 0x3F, 0x1F, 0x0F, 0x03
                db   0xC0, 0xF0, 0xF8, 0xFC, 0xFE, 0xFE, 0xFF, 0xFF
                db   0xFF, 0xFF, 0xFE, 0xFE, 0xFC, 0xF8, 0xF0, 0xC0

                ; Frame 2: Pacman izquierda
                db   0x03, 0x0F, 0x1F, 0x3E, 0x7C, 0x78, 0x70, 0x70
                db   0x70, 0x70, 0x78, 0x7C, 0x3E, 0x1F, 0x0F, 0x03
                db   0xC0, 0xF0, 0xF8, 0xFC, 0xFE, 0xFE, 0xFF, 0xFF
                db   0xFF, 0xFF, 0xFE, 0xFE, 0xFC, 0xF8, 0xF0, 0xC0

                ; Frame 3: Pacman arriba/abajo
                db   0x03, 0x0F, 0x1C, 0x38, 0x70, 0x70, 0xE0, 0xE0
                db   0xE0, 0xE0, 0x70, 0x70, 0x38, 0x1C, 0x0F, 0x03
                db   0xC0, 0xF0, 0x38, 0x1C, 0x0E, 0x0E, 0x07, 0x07
                db   0x07, 0x07, 0x0E, 0x0E, 0x1C, 0x38, 0xF0, 0xC0

; ============================================================
; MAPA DEL LABERINTO (32x24 = 768 bytes)
; ============================================================
MazeMap:
                ; Fila 0
                db  2,6,6,6,6,6,6,6,6,6,6,6,6,6,6,3,2,6,6,6,6,6,6,6,6,6,6,6,6,6,6,3
                ; Fila 1
                db  8,16,16,16,16,16,16,16,16,16,16,16,16,16,16,9,8,16,16,16,16,16,16,16,16,16,16,16,16,16,16,9
                ; Fila 2
                db  8,16,2,6,3,16,2,6,6,6,3,16,2,6,3,9,8,2,6,3,16,2,6,6,6,3,16,2,6,3,16,9
                ; Fila 3
                db  8,11,8,0,9,16,8,0,0,0,9,16,8,0,9,9,8,8,0,9,16,8,0,0,0,9,16,8,0,9,11,9
                ; Fila 4
                db  8,16,4,7,5,16,4,7,7,7,5,16,4,7,5,9,8,4,7,5,16,4,7,7,7,5,16,4,7,5,16,9
                ; Fila 5
                db  8,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,9
                ; Fila 6
                db  8,16,2,6,3,16,2,3,16,2,6,6,6,6,3,9,8,2,6,6,6,6,3,16,2,3,16,2,6,3,16,9
                ; Fila 7
                db  8,16,4,7,5,16,8,9,16,4,7,7,3,2,5,9,8,4,2,7,7,7,5,16,8,9,16,4,7,5,16,9
                ; Fila 8
                db  8,16,16,16,16,16,8,9,16,16,16,16,8,9,16,16,16,16,8,9,16,16,16,16,8,9,16,16,16,16,16,9
                ; Fila 9
                db  4,6,6,6,3,16,8,4,6,6,3,0,8,9,2,6,6,3,8,9,0,2,6,6,5,9,16,2,6,6,6,5
                ; Fila 10
                db  0,0,0,0,8,16,8,2,7,7,5,0,4,5,4,7,7,5,4,5,0,4,7,7,3,9,16,9,0,0,0,0
                ; Fila 11
                db  6,6,6,6,5,16,8,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,9,16,4,6,6,6,6
                ; Fila 12
                db  0,0,0,0,0,16,4,5,0,2,6,6,14,14,14,14,14,14,6,6,3,0,0,0,4,5,16,0,0,0,0,0
                ; Fila 13
                db  6,6,6,6,3,16,0,0,0,8,0,0,0,0,0,0,0,0,0,0,9,0,0,0,0,0,16,2,6,6,6,6
                ; Fila 14
                db  0,0,0,0,8,16,2,3,0,8,0,0,0,0,0,0,0,0,0,0,9,0,2,3,0,0,16,9,0,0,0,0
                ; Fila 15
                db  6,6,6,6,5,16,8,9,0,4,6,6,6,6,6,6,6,6,6,6,5,0,8,9,0,0,16,4,6,6,6,6
                ; Fila 16
                db  0,0,0,0,0,16,8,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,9,16,0,16,0,0,0,0,0
                ; Fila 17
                db  2,6,6,6,3,16,4,5,0,2,6,6,3,16,2,6,6,3,16,2,6,6,3,4,5,16,16,2,6,6,6,3
                ; Fila 18
                db  8,16,16,16,16,16,16,16,16,8,0,0,9,16,8,0,0,9,16,8,0,0,16,16,16,16,16,16,16,16,16,9
                ; Fila 19
                db  8,16,2,6,3,16,2,6,6,5,16,16,9,16,4,6,6,5,16,8,16,16,2,6,6,3,16,2,6,3,16,9
                ; Fila 20
                db  8,16,4,3,9,16,4,7,7,7,7,16,9,16,16,16,16,16,16,9,16,2,7,7,7,5,16,8,2,5,16,9
                ; Fila 21
                db  8,11,16,8,4,16,16,16,16,16,16,16,4,6,6,6,6,6,6,5,16,16,16,16,16,16,16,5,9,16,11,9
                ; Fila 22
                db  8,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,9
                ; Fila 23
                db  4,7,7,7,7,7,7,7,7,7,7,7,7,7,7,5,4,7,7,7,7,7,7,7,7,7,7,7,7,7,7,5

; ============================================================
; PADDING PARA ROM 16KB
; ============================================================
ROMEnd:
                ds   0x8000 - $, 0xFF

; ============================================================
; FIN
; ============================================================