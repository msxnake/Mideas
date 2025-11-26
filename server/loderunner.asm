; ============================================
; LODE RUNNER DEMO - VERSION 4
; MSX - Glass.jar
; Con enemigo que se mueve
; ============================================

    org $4000
    
    ; Cabecera ROM
    db "AB"
    dw Main
    dw 0,0,0,0,0,0

; --- Constantes ---
VDP_DATA    equ $98
VDP_CTRL    equ $99
PPI_C       equ $AA
PPI_B       equ $A9

NAMTBL      equ $1800
CHRTBL      equ $0000
CLRTBL      equ $2000
SPRATR      equ $1B00
SPRPAT      equ $3800

; --- Variables en RAM ---
PLAYER_X    equ $E000
PLAYER_Y    equ $E001
ENEMY_X     equ $E002
ENEMY_Y     equ $E003
ENEMY_DIR   equ $E004
KEYS        equ $E005
FRAME       equ $E006
ON_LADDER   equ $E007
ON_BAR      equ $E008

; ============================================
; INICIO
; ============================================
Main:
    di
    ld sp, $F380
    
    ; Inicializar variables
    ld a, 80
    ld (PLAYER_X), a
    ld a, 160
    ld (PLAYER_Y), a
    
    ld a, 200
    ld (ENEMY_X), a
    ld a, 160
    ld (ENEMY_Y), a
    ld a, 1
    ld (ENEMY_DIR), a
    
    xor a
    ld (FRAME), a
    ld (ON_LADDER), a
    ld (ON_BAR), a
    
    ; Configurar pantalla
    call SetScreen2
    call LoadPatterns
    call LoadColors
    call LoadSprites
    call DrawLevel
    
    ei

; ============================================
; BUCLE PRINCIPAL
; ============================================
GameLoop:
    halt
    
    call ReadKeys
    call UpdatePlayer
    call UpdateEnemy
    call DrawSprites
    
    ; Contador de frames
    ld a, (FRAME)
    inc a
    ld (FRAME), a
    
    jp GameLoop

; ============================================
; CONFIGURAR SCREEN 2
; ============================================
SetScreen2:
    ; VDP Register 0: Mode
    ld a, $02
    ld b, 0
    call WriteVDP
    
    ; VDP Register 1: Mode + 16x16 sprites + screen on
    ld a, $E2
    ld b, 1
    call WriteVDP
    
    ; VDP Register 2: Name table = $1800
    ld a, $06
    ld b, 2
    call WriteVDP
    
    ; VDP Register 3: Color table = $2000
    ld a, $FF
    ld b, 3
    call WriteVDP
    
    ; VDP Register 4: Pattern table = $0000
    ld a, $03
    ld b, 4
    call WriteVDP
    
    ; VDP Register 5: Sprite attribute = $1B00
    ld a, $36
    ld b, 5
    call WriteVDP
    
    ; VDP Register 6: Sprite pattern = $3800
    ld a, $07
    ld b, 6
    call WriteVDP
    
    ; VDP Register 7: Border color
    ld a, $01
    ld b, 7
    call WriteVDP
    
    ret

WriteVDP:
    di
    out (VDP_CTRL), a
    ld a, b
    or $80
    out (VDP_CTRL), a
    ei
    ret

; ============================================
; CARGAR PATRONES
; ============================================
LoadPatterns:
    ; Cargar en los 3 bancos
    ld hl, CHRTBL
    call LoadPatternBank
    ld hl, CHRTBL + $800
    call LoadPatternBank
    ld hl, CHRTBL + $1000
    call LoadPatternBank
    ret

LoadPatternBank:
    push hl
    
    ; Tile 0 - Vacio
    ld de, TileEmpty
    ld bc, 8
    call WriteVRAM
    
    pop hl
    ld bc, 8
    add hl, bc
    push hl
    
    ; Tile 1 - Ladrillo
    ld de, TileBrick
    ld bc, 8
    call WriteVRAM
    
    pop hl
    ld bc, 8
    add hl, bc
    push hl
    
    ; Tile 2 - Escalera
    ld de, TileLadder
    ld bc, 8
    call WriteVRAM
    
    pop hl
    ld bc, 8
    add hl, bc
    push hl
    
    ; Tile 3 - Barra
    ld de, TileBar
    ld bc, 8
    call WriteVRAM
    
    pop hl
    ld bc, 8
    add hl, bc
    push hl
    
    ; Tile 4 - Oro
    ld de, TileGold
    ld bc, 8
    call WriteVRAM
    
    pop hl
    ld bc, 8
    add hl, bc
    
    ; Tile 5 - Suelo
    ld de, TileSolid
    ld bc, 8
    call WriteVRAM
    
    ret

; ============================================
; CARGAR COLORES
; ============================================
LoadColors:
    ld hl, CLRTBL
    call LoadColorBank
    ld hl, CLRTBL + $800
    call LoadColorBank
    ld hl, CLRTBL + $1000
    call LoadColorBank
    ret

LoadColorBank:
    push hl
    
    ; Color tile 0 - Negro
    ld a, $11
    ld bc, 8
    call FillVRAM
    
    pop hl
    ld bc, 8
    add hl, bc
    push hl
    
    ; Color tile 1 - Ladrillo (rojo)
    ld a, $91
    ld bc, 8
    call FillVRAM
    
    pop hl
    ld bc, 8
    add hl, bc
    push hl
    
    ; Color tile 2 - Escalera (cyan)
    ld a, $71
    ld bc, 8
    call FillVRAM
    
    pop hl
    ld bc, 8
    add hl, bc
    push hl
    
    ; Color tile 3 - Barra (gris)
    ld a, $E1
    ld bc, 8
    call FillVRAM
    
    pop hl
    ld bc, 8
    add hl, bc
    push hl
    
    ; Color tile 4 - Oro (amarillo)
    ld a, $A1
    ld bc, 8
    call FillVRAM
    
    pop hl
    ld bc, 8
    add hl, bc
    
    ; Color tile 5 - Suelo (verde)
    ld a, $C1
    ld bc, 8
    call FillVRAM
    
    ret

; ============================================
; CARGAR SPRITES
; ============================================
LoadSprites:
    ld hl, SPRPAT
    ld de, SpritePlayer
    ld bc, 32
    call WriteVRAM
    
    ld hl, SPRPAT + 32
    ld de, SpriteEnemy
    ld bc, 32
    call WriteVRAM
    
    ret

; ============================================
; DIBUJAR NIVEL
; ============================================
DrawLevel:
    ld hl, NAMTBL
    ld de, LevelMap
    ld bc, 768
    call WriteVRAM
    ret

; ============================================
; ESCRIBIR EN VRAM
; HL=direccion VRAM, DE=datos, BC=longitud
; ============================================
WriteVRAM:
    di
    ld a, l
    out (VDP_CTRL), a
    ld a, h
    or $40
    out (VDP_CTRL), a
    
WriteVRAMLoop:
    ld a, (de)
    out (VDP_DATA), a
    inc de
    dec bc
    ld a, b
    or c
    jr nz, WriteVRAMLoop
    
    ei
    ret

; ============================================
; LLENAR VRAM
; HL=direccion, A=valor, BC=longitud
; ============================================
FillVRAM:
    di
    push af
    ld a, l
    out (VDP_CTRL), a
    ld a, h
    or $40
    out (VDP_CTRL), a
    pop af
    
FillVRAMLoop:
    out (VDP_DATA), a
    dec bc
    ld a, b
    or c
    jr nz, FillVRAMLoop
    
    ei
    ret

; ============================================
; LEER TECLADO
; ============================================
ReadKeys:
    di
    
    xor a
    ld (KEYS), a
    
    ; Fila 8 - Cursores
    in a, (PPI_C)
    and $F0
    or 8
    out (PPI_C), a
    
    ex (sp), hl
    ex (sp), hl
    ex (sp), hl
    ex (sp), hl
    
    in a, (PPI_B)
    cpl
    ld (KEYS), a
    
    ei
    ret

; ============================================
; OBTENER TILE EN MAPA
; B=fila, C=columna -> A=tile
; ============================================
GetTile:
    ; offset = fila * 32 + columna
    ld h, 0
    ld l, b
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld e, c
    ld d, 0
    add hl, de
    ld de, LevelMap
    add hl, de
    ld a, (hl)
    ret

; ============================================
; VERIFICAR TILE ACTUAL DEL JUGADOR
; ============================================
CheckPlayerTile:
    xor a
    ld (ON_LADDER), a
    ld (ON_BAR), a
    
    ; Centro del jugador
    ld a, (PLAYER_X)
    add a, 8
    srl a
    srl a
    srl a
    ld c, a
    
    ld a, (PLAYER_Y)
    add a, 8
    srl a
    srl a
    srl a
    ld b, a
    
    call GetTile
    
    cp 2
    jr nz, NotLadder
    ld a, 1
    ld (ON_LADDER), a
    ret
NotLadder:
    cp 3
    ret nz
    ld a, 1
    ld (ON_BAR), a
    ret

; ============================================
; VERIFICAR SUELO
; Retorna A=1 si hay suelo
; ============================================
CheckFloor:
    ld a, (PLAYER_X)
    add a, 8
    srl a
    srl a
    srl a
    ld c, a
    
    ld a, (PLAYER_Y)
    add a, 17
    srl a
    srl a
    srl a
    ld b, a
    
    ; Limite pantalla
    ld a, b
    cp 24
    jr c, FloorOK
    ld a, 1
    ret
FloorOK:
    call GetTile
    
    ; Suelo solido
    cp 5
    jr z, HasFloor
    cp 1
    jr z, HasFloor
    cp 2
    jr z, HasFloor
    
    xor a
    ret
HasFloor:
    ld a, 1
    ret

; ============================================
; VERIFICAR COLISION
; B=fila, C=columna -> A=1 si bloqueado
; ============================================
CheckCollision:
    call GetTile
    cp 1
    jr z, Blocked
    cp 5
    jr z, Blocked
    xor a
    ret
Blocked:
    ld a, 1
    ret

; ============================================
; ACTUALIZAR JUGADOR
; ============================================
UpdatePlayer:
    call CheckPlayerTile
    
    ; Gravedad
    ld a, (ON_LADDER)
    or a
    jr nz, SkipGravity
    ld a, (ON_BAR)
    or a
    jr nz, SkipGravity
    
    call CheckFloor
    or a
    jr nz, SkipGravity
    
    ; Caer
    ld a, (PLAYER_Y)
    add a, 2
    cp 176
    jr nc, SkipGravity
    ld (PLAYER_Y), a

SkipGravity:
    ; Leer teclas
    ld a, (KEYS)
    ld b, a
    
    ; Derecha - bit 7
    bit 7, b
    jr z, CheckLeft
    
    ; Verificar colision derecha
    ld a, (PLAYER_X)
    add a, 18
    srl a
    srl a
    srl a
    ld c, a
    ld a, (PLAYER_Y)
    add a, 8
    srl a
    srl a
    srl a
    ld b, a
    call CheckCollision
    or a
    jr nz, CheckLeft
    
    ld a, (PLAYER_X)
    add a, 2
    cp 240
    jr nc, CheckLeft
    ld (PLAYER_X), a

CheckLeft:
    ld a, (KEYS)
    bit 4, a
    jr z, CheckUp
    
    ; Verificar colision izquierda
    ld a, (PLAYER_X)
    sub 2
    jr c, CheckUp
    srl a
    srl a
    srl a
    ld c, a
    ld a, (PLAYER_Y)
    add a, 8
    srl a
    srl a
    srl a
    ld b, a
    call CheckCollision
    or a
    jr nz, CheckUp
    
    ld a, (PLAYER_X)
    sub 2
    ld (PLAYER_X), a

CheckUp:
    ld a, (KEYS)
    bit 5, a
    jr z, CheckDown
    
    ld a, (ON_LADDER)
    or a
    jr z, CheckDown
    
    ld a, (PLAYER_Y)
    sub 2
    jr c, CheckDown
    ld (PLAYER_Y), a

CheckDown:
    ld a, (KEYS)
    bit 6, a
    jr z, InputDone
    
    ld a, (ON_LADDER)
    or a
    jr z, InputDone
    
    ld a, (PLAYER_Y)
    add a, 2
    cp 176
    jr nc, InputDone
    ld (PLAYER_Y), a

InputDone:
    ret

; ============================================
; ACTUALIZAR ENEMIGO
; ============================================
UpdateEnemy:
    ; Mover cada 2 frames
    ld a, (FRAME)
    and 1
    ret nz
    
    ld a, (ENEMY_DIR)
    or a
    jr z, EnemyLeft

EnemyRight:
    ld a, (ENEMY_X)
    add a, 1
    cp 220
    jr c, EnemyNoFlip1
    ; Cambiar direccion
    xor a
    ld (ENEMY_DIR), a
    ld a, 220
EnemyNoFlip1:
    ld (ENEMY_X), a
    ret

EnemyLeft:
    ld a, (ENEMY_X)
    sub 1
    cp 20
    jr nc, EnemyNoFlip2
    ; Cambiar direccion
    ld a, 1
    ld (ENEMY_DIR), a
    ld a, 20
EnemyNoFlip2:
    ld (ENEMY_X), a
    ret

; ============================================
; DIBUJAR SPRITES
; ============================================
DrawSprites:
    di
    
    ld a, SPRATR & $FF
    out (VDP_CTRL), a
    ld a, ((SPRATR >> 8) & $3F) | $40
    out (VDP_CTRL), a
    
    ; Sprite 0 - Jugador
    ld a, (PLAYER_Y)
    dec a
    out (VDP_DATA), a
    ld a, (PLAYER_X)
    out (VDP_DATA), a
    xor a
    out (VDP_DATA), a
    ld a, 15
    out (VDP_DATA), a
    
    ; Sprite 1 - Enemigo
    ld a, (ENEMY_Y)
    dec a
    out (VDP_DATA), a
    ld a, (ENEMY_X)
    out (VDP_DATA), a
    ld a, 4
    out (VDP_DATA), a
    ld a, 8
    out (VDP_DATA), a
    
    ; Fin sprites
    ld a, $D0
    out (VDP_DATA), a
    
    ei
    ret

; ============================================
; DATOS - TILES
; ============================================
TileEmpty:
    db $00,$00,$00,$00,$00,$00,$00,$00

TileBrick:
    db $FF,$81,$81,$FF,$FF,$18,$18,$FF

TileLadder:
    db $66,$66,$FF,$66,$66,$FF,$66,$66

TileBar:
    db $00,$00,$00,$FF,$FF,$00,$00,$00

TileGold:
    db $00,$3C,$7E,$7E,$7E,$7E,$3C,$00

TileSolid:
    db $FF,$FF,$FF,$FF,$FF,$FF,$FF,$FF

; ============================================
; DATOS - SPRITES
; ============================================
SpritePlayer:
    db $3C,$7E,$DB,$FF,$3C,$18,$7E,$DB
    db $DB,$7E,$3C,$24,$66,$C3,$81,$00
    db $00,$00,$00,$00,$00,$00,$00,$00
    db $00,$00,$00,$00,$00,$00,$00,$00

SpriteEnemy:
    db $3C,$7E,$FF,$DB,$FF,$3C,$18,$3C
    db $7E,$FF,$DB,$24,$66,$E7,$C3,$00
    db $00,$00,$00,$00,$00,$00,$00,$00
    db $00,$00,$00,$00,$00,$00,$00,$00

; ============================================
; MAPA DEL NIVEL (32x24)
; ============================================
LevelMap:
    ; Fila 0
    db 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
    ; Fila 1
    db 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
    ; Fila 2
    db 0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0
    ; Fila 3
    db 0,0,0,1,1,1,1,1,1,1,2,0,0,0,0,0,0,0,0,0,2,1,1,1,1,1,1,1,0,0,0,0
    ; Fila 4
    db 0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0
    ; Fila 5
    db 0,0,0,0,0,0,0,0,0,0,2,0,0,0,4,4,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0
    ; Fila 6
    db 0,0,1,1,1,2,0,0,0,0,2,1,1,1,1,1,1,1,1,1,2,0,0,0,0,2,1,1,1,0,0,0
    ; Fila 7
    db 0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0
    ; Fila 8
    db 0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0
    ; Fila 9
    db 0,0,0,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0
    ; Fila 10
    db 0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0
    ; Fila 11
    db 0,4,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,4,0,0,0
    ; Fila 12
    db 0,1,1,1,1,1,1,2,0,0,0,2,0,0,0,0,0,0,2,0,0,0,2,1,1,1,1,1,1,1,0,0
    ; Fila 13
    db 0,0,0,0,0,0,0,2,0,0,0,2,0,0,4,4,0,0,2,0,0,0,2,0,0,0,0,0,0,0,0,0
    ; Fila 14
    db 0,0,0,0,0,0,0,2,0,0,0,2,1,1,1,1,1,1,2,0,0,0,2,0,0,0,0,0,0,0,0,0
    ; Fila 15
    db 0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0
    ; Fila 16
    db 0,0,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0
    ; Fila 17
    db 0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
    ; Fila 18
    db 0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
    ; Fila 19
    db 0,4,0,0,0,0,0,0,0,0,0,0,0,2,0,0,2,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0
    ; Fila 20
    db 0,1,1,1,1,2,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,2,1,1,1,1,1,0,0
    ; Fila 21
    db 0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0
    ; Fila 22
    db 0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0
    ; Fila 23
    db 5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5

; ============================================
; RELLENO ROM 16KB
; ============================================
    ds $8000 - $, $FF

    end