
; ============================================================
; PACMAN MINI GAME - MSX SCREEN 2 (CORREGIDO)
; Compilador: Glass.jar
; ============================================================

    org 0x4000              ; Inicio de la ROM

; ============================================================
; CABECERA ROM MSX STANDARD
; ============================================================
    db  "AB"                ; Firma ROM
    dw  Start               ; Dirección de inicio
    dw  0,0,0,0,0,0         ; Reservado

; ============================================================
; DEFINICION DE VARIABLES EN RAM (CORRECCION CRITICA)
; ============================================================
RAM_AREA    equ 0xE000      ; Zona segura de RAM

; Definimos las direcciones de memoria para nuestras variables
PlayerX:    equ RAM_AREA + 0
PlayerY:    equ RAM_AREA + 1
PlayerDir:  equ RAM_AREA + 2  ; 0=Stop, 1=Up, 2=Down, 3=Left, 4=Right
NextDir:    equ RAM_AREA + 3  ; Buffer de entrada
AnimFrame:  equ RAM_AREA + 4
TickCount:  equ RAM_AREA + 5
OldHook:    equ RAM_AREA + 10 ; 5 bytes para guardar el salto original

; ============================================================
; CONSTANTES Y PUERTOS
; ============================================================
VDP_DATA    equ 0x98
VDP_CMD     equ 0x99
PPI_A       equ 0xA8
PPI_B       equ 0xA9        ; Teclado filas
PPI_C       equ 0xAA        ; Teclado columnas

HTIMI       equ 0xFD9F      ; Hook interrupción timer

; Direcciones VRAM Screen 2
CHRTBL      equ 0x0000      ; Pattern Generator (3 bancos)
NAMTBL      equ 0x1800      ; Pattern Layout
CLRTBL      equ 0x2000      ; Color Table (3 bancos)
SPRATT      equ 0x1B00      ; Sprite Attributes
SPRPAT      equ 0x3800      ; Sprite Patterns

; Colores
TRANS       equ 0
BLACK       equ 1
MED_GREEN   equ 2
LGT_GREEN   equ 3
DRK_BLUE    equ 4
LGT_BLUE    equ 5
DRK_RED     equ 6
CYAN        equ 7
MED_RED     equ 8
LGT_RED     equ 9
DRK_YELLOW  equ 10
LGT_YELLOW  equ 11
DRK_GREEN   equ 12
MAGENTA     equ 13
GRAY        equ 14
WHITE       equ 15

; ============================================================
; INICIO DEL PROGRAMA
; ============================================================
Start:
    di
    im   1
    ld   sp, 0xF380         ; Inicializar pila

    ; 1. Inicializar VDP a Screen 2
    call InitVDP

    ; 2. Limpiar VRAM
    call ClearVRAM

    ; 3. Cargar Gráficos (Patrones y Colores)
    ; En Screen 2, hay 3 bancos de caracteres (0-255) para las 3 zonas de pantalla
    ; Copiaremos los mismos datos a los 3 bancos para simplificar
    call LoadGraphics

    ; 4. Dibujar Laberinto
    call DrawMap

    ; 5. Cargar Sprites
    call LoadSprites

    ; 6. Inicializar Variables Juego
    ld   a, 112             ; Centro X aprox (en pixeles)
    ld   (PlayerX), a
    ld   a, 104             ; Centro Y aprox
    ld   (PlayerY), a
    xor  a
    ld   (PlayerDir), a
    ld   (NextDir), a
    ld   (AnimFrame), a
    ld   (TickCount), a

    ; 7. Instalar Hook de Interrupción
    call InstallHook

    ; Encender pantalla (Screen 2, Sprites 16x16, Screen ON)
    ld   a, 0xE2
    out  (VDP_CMD), a
    ld   a, 0x81            ; Registro 1
    out  (VDP_CMD), a

    ei

; ============================================================
; BUCLE PRINCIPAL
; ============================================================
MainLoop:
    halt                    ; Espera a la interrupción (VSync 60Hz/50Hz)
    
    ; La lógica real sucede en la interrupción para suavidad,
    ; pero podemos hacer tareas de fondo aquí si fuera necesario.
    jr   MainLoop

; ============================================================
; RUTINA DE INTERRUPCIÓN (HOOK)
; ============================================================
IntHandler:
    push af
    push bc
    push de
    push hl
    push ix
    push iy

    ; --- LOGICA DEL JUEGO (60 veces por segundo) ---
    
    ; 1. Leer Controles
    call ReadInput

    ; 2. Mover Personaje
    call MovePlayer

    ; 3. Actualizar Sprites en VDP
    call UpdateSprites

    pop  iy
    pop  ix
    pop  hl
    pop  de
    pop  bc
    pop  af
    
    ; Llamar al hook original (BIOS) para que lea teclado, etc.
    jp   OldHook

; ============================================================
; INSTALAR HOOK
; ============================================================
InstallHook:
    di
    ld   hl, HTIMI
    ld   de, OldHook
    ld   bc, 5
    ldir                    ; Guardar hook viejo en RAM

    ld   a, 0xC3            ; Opcode JP
    ld   (HTIMI), a
    ld   hl, IntHandler
    ld   (HTIMI+1), hl
    ret

; ============================================================
; INICIALIZAR VDP (SCREEN 2)
; ============================================================
InitVDP:
    ld   hl, VDP_Regs
    ld   b, 8               ; 8 registros
    ld   c, 0               ; Empieza en registro 0
InitVDP_Loop:
    ld   a, (hl)
    out  (VDP_CMD), a       ; Dato
    ld   a, c
    or   0x80               ; Flag de registro
    out  (VDP_CMD), a
    inc  hl
    inc  c
    djnz InitVDP_Loop
    ret

VDP_Regs:
    db  0x02    ; R0 - M3=0, M4=0, M5=0 (Screen 2 bit)
    db  0x62    ; R1 - Screen Enable, Int Enable, Sprites 16x16 (bit 1), Mag 0
    db  0x06    ; R2 - Name Table 0x1800
    db  0xFF    ; R3 - Color Table base (Screen 2: bit 7-0 a 1)
    db  0x03    ; R4 - Pattern Table base (Screen 2: bit 2 a 1)
    db  0x36    ; R5 - Sprite Attr 0x1B00
    db  0x07    ; R6 - Sprite Pattern 0x3800
    db  0x01    ; R7 - Color fondo (Negro)

; ============================================================
; CARGAR GRAFICOS
; ============================================================
LoadGraphics:
    ; -- PATRONES (Tiles) --
    ; Copiar a Banco 1 (0x0000)
    ld   hl, 0x0000
    call SetVRAMWrite
    ld   hl, TilePatterns
    ld   bc, 256*8          ; Copiar todos
    call VRAM_Out
    
    ; Copiar a Banco 2 (0x0800)
    ld   hl, 0x0800
    call SetVRAMWrite
    ld   hl, TilePatterns
    ld   bc, 256*8
    call VRAM_Out

    ; Copiar a Banco 3 (0x1000)
    ld   hl, 0x1000
    call SetVRAMWrite
    ld   hl, TilePatterns
    ld   bc, 256*8
    call VRAM_Out

    ; -- COLORES --
    ; Copiar a Banco 1 (0x2000)
    ld   hl, 0x2000
    call SetVRAMWrite
    ld   hl, TileColors
    ld   bc, 256*8
    call VRAM_Out

    ; Copiar a Banco 2 (0x2800)
    ld   hl, 0x2800
    call SetVRAMWrite
    ld   hl, TileColors
    ld   bc, 256*8
    call VRAM_Out

    ; Copiar a Banco 3 (0x3000)
    ld   hl, 0x3000
    call SetVRAMWrite
    ld   hl, TileColors
    ld   bc, 256*8
    call VRAM_Out
    ret

VRAM_Out:
    ld   a, (hl)
    out  (VDP_DATA), a
    inc  hl
    dec  bc
    ld   a, b
    or   c
    jr   nz, VRAM_Out
    ret

; ============================================================
; CARGAR SPRITES
; ============================================================
LoadSprites:
    ld   hl, SPRPAT
    call SetVRAMWrite
    ld   hl, SpriteData
    ld   bc, 32*4           ; 4 patrones de 32 bytes (16x16)
    call VRAM_Out
    ret

; ============================================================
; DIBUJAR MAPA
; ============================================================
DrawMap:
    ld   hl, NAMTBL
    call SetVRAMWrite
    ld   de, MapData
    ld   bc, 32*24          ; 768 bytes
DrawLoop:
    ld   a, (de)
    out  (VDP_DATA), a
    inc  de
    dec  bc
    ld   a, b
    or   c
    jr   nz, DrawLoop
    ret

; ============================================================
; LEER TECLADO (Puerto Hardware Directo)
; ============================================================
ReadInput:
    ; Fila 8: Cursores
    ld   a, 8
    call GetRow
    ld   d, a               ; Guardar estado fila 8

    ; Comprobar bit 5 (Arriba)
    bit  5, d
    jr   nz, .chkDown
    ld   a, 1
    ld   (NextDir), a
    ret
.chkDown:
    ; Comprobar bit 6 (Abajo)
    bit  6, d
    jr   nz, .chkLeft
    ld   a, 2
    ld   (NextDir), a
    ret
.chkLeft:
    ; Comprobar bit 4 (Izquierda)
    bit  4, d
    jr   nz, .chkRight
    ld   a, 3
    ld   (NextDir), a
    ret
.chkRight:
    ; Comprobar bit 7 (Derecha)
    bit  7, d
    jr   nz, .endInp
    ld   a, 4
    ld   (NextDir), a
.endInp:
    ret

GetRow:
    out  (PPI_C), a         ; Seleccionar fila
    in   a, (PPI_B)         ; Leer columnas
    ret

; ============================================================
; MOVER JUGADOR
; ============================================================
MovePlayer:
    ; Animación (contador simple)
    ld   hl, TickCount
    inc  (hl)
    
    ; Intentar cambiar dirección si es posible
    ld   a, (NextDir)
    or   a
    jr   z, .continueMove
    
    ; Verificar si podemos girar a NextDir
    push af
    call CheckCollision ; Verifica si A (dir) es válida desde X,Y actual
    pop  af
    jr   c, .continueMove ; Si hay colisión, ignorar cambio
    
    ; Si no hay colisión, aplicar nueva dirección
    ld   (PlayerDir), a
    
.continueMove:
    ld   a, (PlayerDir)
    or   a
    ret  z              ; Si es 0, no mover

    call CheckCollision ; Verifica si PlayerDir actual choca
    ret  c              ; Si choca, stop
    
    ; Mover
    ld   hl, PlayerY
    ld   a, (PlayerDir)
    cp   1 ; Up
    jr   nz, .tryDown
    dec  (hl)
    ret
.tryDown:
    cp   2 ; Down
    jr   nz, .tryLeft
    inc  (hl)
    ret
.tryLeft:
    ld   hl, PlayerX
    cp   3 ; Left
    jr   nz, .tryRight
    dec  (hl)
    ret
.tryRight:
    ld   hl, PlayerX
    inc  (hl)
    ret

; ============================================================
; DETECCION DE COLISIONES
; Entrada: A = Dirección a probar
; Salida: Carry Flag = 1 si hay colisión, 0 si libre
; ============================================================
CheckCollision:
    ld   d, a           ; Guardar dirección
    ld   a, (PlayerX)
    ld   b, a
    ld   a, (PlayerY)
    ld   c, a
    
    ; Simular movimiento
    ld   a, d
    cp   1
    jr   nz, .c2
    dec  c              ; Y-1
    jr   .chk
.c2:
    cp   2
    jr   nz, .c3
    inc  c              ; Y+1
    jr   .chk
.c3:
    cp   3
    jr   nz, .c4
    dec  b              ; X-1
    jr   .chk
.c4:
    inc  b              ; X+1

.chk:
    ; Verificar límites de pantalla
    ld   a, b
    cp   248            ; Ancho max - 8
    jr   nc, .collision
    cp   1              ; Min
    jr   c, .collision
    
    ld   a, c
    cp   184            ; Alto max - 8
    jr   nc, .collision
    cp   1
    jr   c, .collision

    ; Verificar Tiles (Mapa)
    ; Convertir Pixel X,Y a Tile X,Y
    ; Offset central del sprite para mayor precisión (8,8)
    ld   a, b
    add  a, 8
    srl  a
    srl  a
    srl  a              ; X / 8
    ld   e, a           ; E = Tile X
    
    ld   a, c
    add  a, 8
    srl  a
    srl  a
    srl  a              ; Y / 8
    ld   d, a           ; D = Tile Y
    
    ; Calcular dirección en mapa: Base + Y*32 + X
    push hl
    ld   hl, MapData
    push de
    
    ; Y * 32
    ld   a, d
    ld   d, 0
    ld   e, a
    add  hl, de
    add  hl, de
    add  hl, de
    add  hl, de
    add  hl, de         ; x32
    
    pop  de             ; Recuperar X
    ld   d, 0
    add  hl, de         ; + X
    
    ld   a, (hl)        ; Leer Tile ID
    pop  hl
    
    ; IDs > 2 son paredes (ajustar según tus tiles)
    cp   2
    jr   nc, .collision ; Si es >= 2, es pared
    
    or   a              ; Clear Carry (No colisión)
    ret

.collision:
    scf                 ; Set Carry (Colisión)
    ret

; ============================================================
; ACTUALIZAR SPRITES
; ============================================================
UpdateSprites:
    ld   hl, SPRATT
    call SetVRAMWrite
    
    ; Sprite 0 Atributos
    ld   a, (PlayerY)
    dec  a              ; Ajuste VDP
    out  (VDP_DATA), a  ; Y
    
    ld   a, (PlayerX)
    out  (VDP_DATA), a  ; X
    
    ; Calcular frame animación (boca abierta/cerrada)
    ld   a, (TickCount)
    and  0x08           ; Velocidad anim
    srl  a
    srl  a              ; 0 o 2
    
    ; Sumar dirección offset (0, 4, 8, 12 para D, U, L, R)
    ld   b, a           ; B = Frame base
    ld   a, (PlayerDir) 
    ; Mapeo simple de dir a patrón
    ; Dir 1(U)->8, 2(D)->12, 3(L)->4, 4(R)->0
    ; Usamos patrón 0 por defecto
    ld   c, 0
    cp   3
    jr   nz, .u2
    ld   c, 8           ; Izq
    jr   .setPat
.u2:
    cp   4
    jr   nz, .u3
    ld   c, 0           ; Der
    jr   .setPat
.u3:
    cp   1
    jr   nz, .u4
    ld   c, 16          ; Arriba (usamos otro set si hay espacio, o rotamos)
    jr   .setPat        ; Simplificado: usa Der
.u4:
    ; Abajo...
    
.setPat:
    ld   a, c
    add  a, b           ; Base + Anim
    out  (VDP_DATA), a  ; Pattern Num
    
    ld   a, LGT_YELLOW
    out  (VDP_DATA), a  ; Color
    
    ; Terminar tabla sprites
    ld   a, 0xD0
    out  (VDP_DATA), a  ; Y=208 (Fin)
    ret

; ============================================================
; HELPERS VRAM
; ============================================================
SetVRAMWrite:
    ld   a, l
    out  (VDP_CMD), a
    ld   a, h
    or   0x40
    out  (VDP_CMD), a
    ret

ClearVRAM:
    ld   hl, 0
    call SetVRAMWrite
    ld   bc, 0x4000
    xor  a
.clLoop:
    out  (VDP_DATA), a
    dec  bc
    ld   a, b
    or   c
    jr   nz, .clLoop
    ret

; ============================================================
; DATOS GRAFICOS (Diseño Pacman)
; ============================================================

TilePatterns:
    ; Tile 0: Vacío (Negro)
    db 0,0,0,0,0,0,0,0
    ; Tile 1: Punto (Pellet)
    db 0,0,0,24,24,0,0,0
    ; Tile 2: Pared Doble Línea Horizontal
    db 0,0,255,0,0,255,0,0
    ; Tile 3: Pared Doble Línea Vertical
    db 36,36,36,36,36,36,36,36
    ; Tile 4: Esquina Sup Izq
    db 0,0,63,32,32,35,36,36
    ; Rellenar resto con basura o ceros para evitar fallos
    ds (256-5)*8, 0

TileColors:
    ; Tile 0: Negro
    db 0xF0,0xF0,0xF0,0xF0,0xF0,0xF0,0xF0,0xF0 ; (Color F y 0)
    ; Tile 1: Amarillo sobre Negro
    db 0xB1,0xB1,0xB1,0xB1,0xB1,0xB1,0xB1,0xB1
    ; Tile 2: Azul sobre Negro (Pared)
    db 0x51,0x51,0x51,0x51,0x51,0x51,0x51,0x51
    ; Tile 3: Azul sobre Negro
    db 0x51,0x51,0x51,0x51,0x51,0x51,0x51,0x51
    ; Tile 4: Azul
    db 0x51,0x51,0x51,0x51,0x51,0x51,0x51,0x51
    ds (256-5)*8, 0x11

SpriteData:
    ; Pacman Derecha (Boca Abierta) - 32 bytes para 16x16
    ; Lado Izq
    db 0,7,31,63,63,127,127,255,255,127,127,63,63,31,7,0
    ; Lado Der
    db 0,224,248,252,254,240,224,192,192,224,240,254,252,248,224,0
    
    ; Pacman Cerrado (Bola)
    db 0,7,31,63,127,127,255,255,255,255,127,127,63,31,7,0
    db 0,224,248,252,254,254,255,255,255,255,254,254,252,248,224,0
    
    ; Pacman Izquierda
    db 0,0,7,15,31,31,63,63,63,63,31,31,15,7,0,0
    db 0,224,248,252,252,254,254,255,255,254,254,252,252,248,224,0
    
    ; Relleno para llegar a 4 sprites
    ds 32, 0

; ============================================================
; MAPA (32x24 tiles)
; 0=Vacio, 1=Punto, 2+=Pared
; ============================================================
MapData:
    ; Fila 1 (Borde)
    db 2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2
    ; Fila 2
    db 3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3
    ; Fila 3
    db 3,1,2,2,1,2,2,2,1,2,1,2,2,2,1,3,3,1,2,2,2,1,2,1,2,2,2,1,2,2,1,3
    ; Fila 4
    db 3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3
    ; Fila 5 (Pared central)
    db 3,1,2,2,1,2,1,2,2,2,2,2,2,1,2,2,2,2,1,2,2,2,2,2,2,1,2,1,2,2,1,3
    ; Rellenar filas intermedias con patrón simple para ahorrar espacio en código ejemplo
    ; Repetimos un patrón 14 veces
    rept 14
    db 3,1,1,2,1,1,1,1,1,1,1,1,1,1,1,3,3,1,1,1,1,1,1,1,1,1,1,1,2,1,1,3
    endm
    ; Fila 20
    db 3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3
    ; Fila 21
    db 3,1,2,2,1,2,2,2,1,2,1,2,2,2,1,3,3,1,2,2,2,1,2,1,2,2,2,1,2,2,1,3
    ; Fila 22
    db 3,1,1,2,1,1,1,1,1,2,1,1,1,1,1,3,3,1,1,1,1,1,2,1,1,1,1,1,2,1,1,3
    ; Fila 23
    db 2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2
    
; ============================================================
; PADDING ROM
; ============================================================
    ds 0x8000 - $ , 0xFF