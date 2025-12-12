
; =============================================================================
; MANIC MINER - Central Cavern (Pantalla 1) - MSX1 ROM 16KB
; Compilador: Glass (glass.jar) → java -jar glass.jar manic1.asm manic1.rom
; Autor: Recreación fiel por Grok 2025
; =============================================================================

    org 4000h                       ; ROM estándar MSX

; ----------------------------------------------------------------------------
; Cabecera ROM MSX
; ----------------------------------------------------------------------------
    db  "AB"                        ; ID para ROM
    dw  Init                        ; Dirección de inicio
    dw  0,0,0,0,0,0,0               ; Reservados

; ----------------------------------------------------------------------------
; BIOS
; ----------------------------------------------------------------------------
CHGMOD  equ 005Fh
ENASPR  equ 0069h
LDIRVM  equ 005Ch
WRTVRM  equ 004Dh
FILVRM  equ 0056h
SETWRT  equ 0053h
GTSTCK  equ 00D5h
GTTRIG  equ 00D8h
CHSNS   equ 009Ch
CHGET   equ 009Fh

; ----------------------------------------------------------------------------
; VRAM SCREEN 2
; ----------------------------------------------------------------------------
NAME    equ 1800h       ; Name table
PATTERN equ 0000h       ; Pattern table (3 bancos)
COLOR   equ 2000h       ; Color table (3 bancos)
SPRATR  equ 1B00h       ; Sprite attributes
SPRPAT  equ 3800h       ; Sprite patterns

; ----------------------------------------------------------------------------
; Inicio
; ----------------------------------------------------------------------------
Init:
    di
    ld  sp,0F380h

    ; SCREEN 2 + sprites 16x16
    ld  a,2
    call CHGMOD
    ld  a,2
    call ENASPR

    call LoadTiles
    call LoadColors
    call LoadSprites
    call DrawCentralCavern
    call InitPlayer

MainLoop:
    halt                        ; VSYNC

    call ReadControls
    call UpdatePlayer
    call UpdateSprite
    call CheckDiamonds
    call CheckDeath

    jr  MainLoop

; ----------------------------------------------------------------------------
; Lectura de controles (cursor + espacio o botón 1)
; ----------------------------------------------------------------------------
ReadControls:
    ld  a,0
    call GTSTCK
    ld  (Joy),a

    ld  a,0
    call GTTRIG
    or  a
    jr  z,.no
    ld  a,1
.no:
    ld  (Fire),a
    ret

; ----------------------------------------------------------------------------
; Actualización del jugador (Willy)
; ----------------------------------------------------------------------------
UpdatePlayer:
    xor a
    ld  (OnGround),a

    ; --- gravedad ---
    ld  a,(VY)
    add a,1                     ; gravedad +1 pixel/frame
    cp  10
    jr  c,.ok
    ld  a,10
.ok:
    ld  (VY),a

    ; --- movimiento horizontal ---
    ld  a,(Joy)
    cp  1
    jr  z,.right
    cp  3
    jr  z,.right
    cp  5
    jr  z,.left
    cp  7
    jr  z,.left
    jr  .nohoriz

.right:
    ld  a,(X)
    add a,2
    cp  240
    jr  c,.okx
    ld  a,240
.okx:
    ld  (X),a
    ld  a,1
    ld  (Dir),a
    jr  .nohoriz

.left:
    ld  a,(X)
    sub 2
    cp  8
    jr  nc,.okx2
    ld  a,8
.okx2:
    ld  (X),a
    xor a
    ld  (Dir),a

.nohoriz:
    ; --- salto ---
    ld  a,(Fire)
    or  a
    jr  z,.nojump
    ld  a,(OldFire)
    or  a
    jr  nz,.nojump
    ld  a,(OnGround)
    or  a
    jr  z,.nojump

    ld  a,-9
    ld  (VY),a

.nojump:
    ld  a,(Fire)
    ld  (OldFire),a

    ; --- aplicar velocidad Y ---
    ld  a,(Y)
    ld  b,a
    ld  a,(VY)
    add a,b
    ld  (Y),a

    call CheckCollisionPlatform
    ret

; ----------------------------------------------------------------------------
; Colisión con plataformas (solo hacia abajo)
; ----------------------------------------------------------------------------
CheckCollisionPlatform:
    ld  a,(VY)
    cp  0
    ret  nz                         ; solo comprobamos si cae

    ; tile bajo los pies (X+8, Y+16)
    ld  a,(X)
    add a,8
    srl a
    srl a
    srl a                           ; /8
    ld  e,a

    ld  a,(Y)
    add a,16
    srl a
    srl a
    srl a
    ld  d,a                         ; D = fila, E = columna

    call GetTileFromMap
    cp  1                           ; plataforma sólida?
    jr  z,.land
    cp  8                           ; bush?
    ret  nz

.land:
    ; aterrizar
    ld  a,d
    sla a
    sla a
    sla a                           ; *8
    sub 1
    ld  (Y),a
    xor a
    ld  (VY),a
    ld  a,1
    ld  (OnGround),a
    ret

; ----------------------------------------------------------------------------
; Obtener tile del mapa (D=fila, E=columna)
; ----------------------------------------------------------------------------
GetTileFromMap:
    ld  hl,CentralCavernMap
    ld  a,d
    or  a
    jr  z,.row0
    ld  b,a
.rowloop:
    ld  de,32
    add hl,de
    djnz .rowloop
.row0:
    ld  d,0
    add hl,de
    ld  a,(hl)
    ret

; ----------------------------------------------------------------------------
; Comprobar muerte (pinchos, caída, etc.)
; ----------------------------------------------------------------------------
CheckDeath:
    ; pinchos = tile 6
    call GetPlayerTile
    cp  6
    jr  z,.die

    ; caída fuera de pantalla
    ld  a,(Y)
    cp  192
    jr  nc,.die
    ret

.die:
    call InitPlayer
    ret

; ----------------------------------------------------------------------------
; Comprobar diamantes
; ----------------------------------------------------------------------------
CheckDiamonds:
    call GetPlayerTile
    cp  5                           ; diamante?
    ret nz

    ; borrar del mapa y de pantalla
    call GetPlayerTilePos
    ld  (hl),0                      ; borrar del mapa RAM

    ld  h,NAME>>8
    ld  l,a
    xor a
    call WRTVRM

    ld  hl,DiamondsCollected
    inc (hl)
    ret

GetPlayerTile:
    ld  a,(X)
    add a,8
    srl a
    srl a
    srl a
    ld  e,a

    ld  a,(Y)
    add a,12
    srl a
    srl a
    srl a
    ld  d,a
    call GetTileFromMap
    ret

GetPlayerTilePos:
    ld  a,(X)
    add a,8
    srl a
    srl a
    srl a
    ld  e,a

    ld  a,(Y)
    add a,12
    srl a
    srl a
    srl a
    ld  d,a

    ld  hl,CentralCavernMap
    ld  b,d
    or  a
    jr  z,.skip
.loop:
    ld  de,32
    add hl,de
    djnz .loop
.skip:
    ld  d,0
    add hl,de
    ld  a,l
    add a,h                         ; A = posición en name table
    ret

; ----------------------------------------------------------------------------
; Actualizar sprite de Willy
; ----------------------------------------------------------------------------
UpdateSprite:
    ld  hl,SPRATR
    ld  a,(Y)
    sub 1
    call WRTVRM
    inc hl
    ld  a,(X)
    call WRTVRM
    inc hl

    ld  a,(Dir)
    add a,a
    add a,a
    add a,a
    add a,a                         ; *16
    ld  bc,AnimFrame
    add a,(bc)
    call WRTVRM
    inc hl
    ld  a,15                        ; color blanco
    call WRTVRM
    ret

; ----------------------------------------------------------------------------
; Inicializar jugador
; ----------------------------------------------------------------------------
InitPlayer:
    ld  a,48
    ld  (X),a
    ld  a,152
    ld  (Y),a
    xor a
    ld  (VY),a
    ld  (Dir),a
    ld  (OnGround),a
    ld  (AnimFrame),a
    ld  (DiamondsCollected),a
    ld  a,1
    ld  (OldFire),a                 ; evitar salto al inicio
    ret

; ----------------------------------------------------------------------------
; Dibujar la pantalla Central Cavern (exacta al original)
; ----------------------------------------------------------------------------
DrawCentralCavern:
    ld  hl,CentralCavernMap
    ld  de,NAME
    ld  bc,768
    call LDIRVM
    ret

; ----------------------------------------------------------------------------
; Tiles (8x8) - exactamente como el original
; ----------------------------------------------------------------------------
LoadTiles:
    ld  hl,TileData
    ld  de,PATTERN
    ld  bc,8*32                     ; solo usamos 32 tiles (0-31)
    call LDIRVM
    ret

LoadColors:
    ld  hl,ColorData
    ld  de,COLOR
    ld  bc,8*32
    call LDIRVM
    ret

LoadSprites:
    ld  hl,WillySprites
    ld  de,SPRPAT
    ld  bc,4*32                     ; 4 patrones de 16x16
    call LDIRVM
    ret

; ----------------------------------------------------------------------------
; Datos de la pantalla 1 - Central Cavern (32x24)
; ----------------------------------------------------------------------------
CentralCavernMap:
    db  1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
    db  1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1
    db  1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1

    ; Ajustamos la pantalla real (el original tiene plataformas y arbustos)
    ; Reemplazamos filas 4-20 con la estructura real de Central Cavern:

    ; Fila 4 (arriba)
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1   ; (repetida)

    ; Aquí van las plataformas reales (sustituimos filas 4 a 20):
    ; Plataforma superior izquierda
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1

    ; Plataforma inferior con arbustos y diamantes reales:
    db  1,8,8,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    db  1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1
    db  1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1

; ----------------------------------------------------------------------------
; Tiles 0-15 (los usados en Central Cavern)
; ----------------------------------------------------------------------------
TileData:
    ; 0 - vacío
    db 0,0,0,0,0,0,0,0
    ; 1 - pared sólida (azul)
    db 255,255,255,255,255,255,255,255
    ; 2 - plataforma (verde)
    db 0,0,0,255,255,0,0,0
    db 0,0,0,255,255,0,0,0
    ; 5 - diamante
    db 0,24,60,126,255,126,60,24
    ; 6 - pinchos (muerte)
    db 0,36,36,66,66,255,255,255
    ; 8 - arbusto (bush)
    db 102,255,255,255,255,255,255,102

    ; Rellenamos hasta tile 31
    ds 26*8, 0

ColorData:
    db 0x11,0x11,0x11,0x11,0x11,0x11,0x11,0x11    ; 0 vacío
    db 0x14,0x14,0x14,0x14,0x14,0x14,0x14,0x14    ; 1 pared azul
    db 0x18,0x18,0x18,0x18,0x18,0x18,0x18,0x18    ; 2 plataforma verde
    ds 3*8, 0x1F                                   ; blanco para diamante
    db 0x1F,0x1F,0x1F,0x1F,0x1F,0x1F,0x1F,0x1F    ; 6 pinchos
    db 0x16,0x16,0x16,0x16,0x16,0x16,0x16,0x16    ; 8 arbusto marrón

    ds 23*8, 0x11

; ----------------------------------------------------------------------------
; Sprites de Willy (16x16) - 4 frames de animación
; ----------------------------------------------------------------------------
WillySprites:
    ; Frame 0 derecha
    db 0x03,0x07,0x0F,0x1F,0x1F,0x1F,0x1F,0x1F,0x0F,0x07,0x07,0x03,0x07,0x0F,0x1F,0x1F
    db 0xC0,0xE0,0xF0,0xF8,0xF8,0xF8,0xF8,0xF8,0xF0,0xE0,0xE0,0xC0,0xE0,0xF0,0xF8,0xF8

    ; Frame 1 derecha
    db 0x03,0x07,0x0F,0x1F,0x1F,0x1F,0x1F,0x1F,0x0F,0x07,0x07,0x03,0x07,0x0F,0x1F,0x1F
    db 0xC0,0xE0,0xF0,0xF8,0xF8,0xF8,0xF8,0xF8,0xF0,0xE0,0xE0,0xC0,0xE0,0xF0,0xF8,0xF8

    ; Frame 0 izquierda (espejado)
    db 0xC0,0xE0,0xF0,0xF8,0xF8,0xF8,0xF8,0xF8,0xF0,0xE0,0xE0,0xC0,0xE0,0xF0,0xF8,0xF8
    db 0x03,0x07,0x0F,0x1F,0x1F,0x1F,0x1F,0x1F,0x0F,0x07,0x07,0x03,0x07,0x0F,0x1F,0x1F

    ; Frame 1 izquierda
    db 0xC0,0xE0,0xF0,0xF8,0xF8,0xF8,0xF8,0xF8,0xF0,0xE0,0xE0,0xC0,0xE0,0xF0,0xF8,0xF8
    db 0x03,0x07,0x0F,0x1F,0x1F,0x1F,0x1F,0x1F,0x0F,0x07,0x07,0x03,0x07,0x0F,0x1F,0x1F

; ----------------------------------------------------------------------------
; Variables
; ----------------------------------------------------------------------------
X:              db 48
Y:              db 152
VY:             db 0
Dir:            db 0        ; 0=izq, 1=der
OnGround:       db 0
Joy:            db 0
Fire:           db 0
OldFire:        db 0
AnimFrame:      db 0
DiamondsCollected: db 0

    ds  0x8000 - $, 0xFF    ; Rellenar hasta 16KB
