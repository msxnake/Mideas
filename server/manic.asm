
; ============================================
; MANIC MINER CLONE - MSX
; Compilador: Glass.jar
; Para compilar: java -jar glass.jar manic.asm manic.rom
; ============================================

    org 4000h

; ============================================
; CABECERA ROM MSX
; ============================================
    db "AB"         ; ID ROM
    dw Main         ; Dirección inicio
    dw 0,0,0,0,0,0  ; Reservado

; ============================================
; CONSTANTES BIOS
; ============================================
CHGMOD  equ 005Fh
LDIRVM  equ 005Ch
WRTVRM  equ 004Dh
RDVRM   equ 004Ah
FILVRM  equ 0056h
GTSTCK  equ 00D5h
GTTRIG  equ 00D8h
ENASPR  equ 0069h
INIT32  equ 006Fh

; ============================================
; DIRECCIONES VRAM SCREEN 2
; ============================================
VRAM_PAT0   equ 0000h   ; Patrones banco 0
VRAM_PAT1   equ 0800h   ; Patrones banco 1
VRAM_PAT2   equ 1000h   ; Patrones banco 2
VRAM_NAM    equ 1800h   ; Tabla de nombres
VRAM_COL0   equ 2000h   ; Colores banco 0
VRAM_COL1   equ 2800h   ; Colores banco 1
VRAM_COL2   equ 3000h   ; Colores banco 2
VRAM_SPR_PAT equ 3800h  ; Patrones sprites
VRAM_SPR_ATR equ 1B00h  ; Atributos sprites

; ============================================
; CONSTANTES JUEGO
; ============================================
PLAYER_SPRITE   equ 0
GRAVITY         equ 2
JUMP_FORCE      equ -8
MAX_DIAMONDS    equ 5
SCREEN_WIDTH    equ 32
SCREEN_HEIGHT   equ 24

; ============================================
; PROGRAMA PRINCIPAL
; ============================================
Main:
    di
    ld sp, 0F380h
    ei

    ; Inicializar SCREEN 2
    call InitScreen2

    ; Cargar tiles personalizados
    call LoadTiles

    ; Cargar colores tiles
    call LoadColors

    ; Cargar sprites
    call LoadSprites

    ; Inicializar variables juego
    call InitGame

    ; Dibujar nivel 1
    call DrawLevel

MainLoop:
    ; Esperar VSYNC
    halt

    ; Leer controles
    call ReadInput

    ; Actualizar física jugador
    call UpdatePlayer

    ; Comprobar colisiones
    call CheckCollisions

    ; Actualizar sprites
    call UpdateSprites

    ; Comprobar fin nivel
    call CheckLevelComplete

    jp MainLoop

; ============================================
; INICIALIZAR SCREEN 2
; ============================================
InitScreen2:
    ld a, 2
    call CHGMOD

    ; Habilitar sprites 16x16
    ld a, 2
    call ENASPR

    ret

; ============================================
; CARGAR TILES EN VRAM
; ============================================
LoadTiles:
    ; Banco 0
    ld hl, TilePatterns
    ld de, VRAM_PAT0
    ld bc, 256*8        ; 32 tiles * 8 bytes
    call LDIRVM

    ; Banco 1
    ld hl, TilePatterns
    ld de, VRAM_PAT1
    ld bc, 256*8
    call LDIRVM

    ; Banco 2
    ld hl, TilePatterns
    ld de, VRAM_PAT2
    ld bc, 256*8
    call LDIRVM

    ret

; ============================================
; CARGAR COLORES TILES
; ============================================
LoadColors:
    ; Banco 0
    ld hl, TileColors
    ld de, VRAM_COL0
    ld bc, 256*8
    call LDIRVM

    ; Banco 1
    ld hl, TileColors
    ld de, VRAM_COL1
    ld bc, 256*8
    call LDIRVM

    ; Banco 2
    ld hl, TileColors
    ld de, VRAM_COL2
    ld bc, 256*8
    call LDIRVM

    ret

; ============================================
; CARGAR SPRITES
; ============================================
LoadSprites:
    ld hl, SpritePatterns
    ld de, VRAM_SPR_PAT
    ld bc, 32*4         ; 4 sprites * 32 bytes
    call LDIRVM
    ret

; ============================================
; INICIALIZAR JUEGO
; ============================================
InitGame:
    ; Posición inicial jugador
    ld a, 32
    ld (PlayerX), a
    ld a, 152
    ld (PlayerY), a

    ; Reset velocidades
    xor a
    ld (PlayerVX), a
    ld (PlayerVY), a
    ld (PlayerJumping), a

    ; Reset diamantes
    ld a, MAX_DIAMONDS
    ld (DiamondsLeft), a

    ; Vidas
    ld a, 3
    ld (Lives), a

    ; Reset dirección
    ld a, 1
    ld (PlayerDir), a

    ret

; ============================================
; DIBUJAR NIVEL
; ============================================
DrawLevel:
    ld hl, Level1Data
    ld de, VRAM_NAM
    ld b, SCREEN_HEIGHT

.DrawRow:
    push bc
    ld b, SCREEN_WIDTH

.DrawTile:
    push bc
    push de

    ld a, (hl)
    push hl
    ex de, hl
    call WRTVRM

    pop hl
    pop de
    pop bc

    inc hl
    inc de
    djnz .DrawTile

    pop bc
    djnz .DrawRow

    ret

; ============================================
; LEER INPUT
; ============================================
ReadInput:
    ; Leer joystick/cursores
    ld a, 0
    call GTSTCK
    ld (JoystickDir), a

    ; Leer botón disparo (salto)
    ld a, 0
    call GTTRIG
    ld (TriggerState), a

    ret

; ============================================
; ACTUALIZAR JUGADOR
; ============================================
UpdatePlayer:
    ; Movimiento horizontal
    ld a, (JoystickDir)

    ; Izquierda (7 o 6 o 5)
    cp 7
    jr z, .MoveLeft
    cp 6
    jr z, .MoveLeft
    cp 5
    jr z, .MoveLeft

    ; Derecha (1 o 2 o 3)
    cp 1
    jr z, .MoveRight
    cp 2
    jr z, .MoveRight
    cp 3
    jr z, .MoveRight

    jr .NoHorizontal

.MoveLeft:
    ld a, (PlayerX)
    sub 2
    cp 8
    jr c, .NoHorizontal
    ld (PlayerX), a
    xor a
    ld (PlayerDir), a
    jr .NoHorizontal

.MoveRight:
    ld a, (PlayerX)
    add a, 2
    cp 240
    jr nc, .NoHorizontal
    ld (PlayerX), a
    ld a, 1
    ld (PlayerDir), a

.NoHorizontal:
    ; Comprobar salto
    ld a, (TriggerState)
    or a
    jr z, .NoJump

    ld a, (PlayerJumping)
    or a
    jr nz, .NoJump

    ; Iniciar salto
    ld a, 1
    ld (PlayerJumping), a
    ld a, JUMP_FORCE
    ld (PlayerVY), a

.NoJump:
    ; Aplicar gravedad
    ld a, (PlayerVY)
    add a, GRAVITY
    cp 8
    jr c, .NoMaxVel
    ld a, 8
.NoMaxVel:
    ld (PlayerVY), a

    ; Mover en Y
    ld b, a
    ld a, (PlayerY)
    add a, b
    ld (PlayerY), a

    ; Comprobar suelo
    call CheckFloor

    ret

; ============================================
; COMPROBAR SUELO
; ============================================
CheckFloor:
    ; Obtener tile bajo el jugador
    ld a, (PlayerY)
    add a, 16           ; Bajo los pies
    rrca
    rrca
    rrca
    and 1Fh             ; Dividir por 8
    ld d, a             ; D = fila

    ld a, (PlayerX)
    add a, 8            ; Centro del sprite
    rrca
    rrca
    rrca
    and 1Fh             ; Dividir por 8
    ld e, a             ; E = columna

    ; Calcular dirección en mapa
    ld a, d
    ld h, 0
    ld l, a
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl          ; * 32
    ld d, 0
    add hl, de
    ld de, Level1Data
    add hl, de

    ; Leer tile
    ld a, (hl)

    ; Es plataforma? (tiles 2, 3, 4)
    cp 2
    jr z, .OnFloor
    cp 3
    jr z, .OnFloor
    cp 4
    jr z, .OnFloor
    ret

.OnFloor:
    ; Alinear a la plataforma
    ld a, (PlayerY)
    and 0F8h            ; Alinear a 8 pixels
    ld (PlayerY), a

    ; Parar caída
    xor a
    ld (PlayerVY), a
    ld (PlayerJumping), a

    ret

; ============================================
; COMPROBAR COLISIONES
; ============================================
CheckCollisions:
    ; Obtener tile actual del jugador
    ld a, (PlayerY)
    add a, 8
    rrca
    rrca
    rrca
    and 1Fh
    ld d, a

    ld a, (PlayerX)
    add a, 8
    rrca
    rrca
    rrca
    and 1Fh
    ld e, a

    ; Calcular dirección
    ld a, d
    ld h, 0
    ld l, a
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld d, 0
    add hl, de
    ld de, Level1Data
    add hl, de

    ld a, (hl)

    ; Diamante? (tile 5)
    cp 5
    jr z, .GotDiamond

    ; Pinchos? (tile 6)
    cp 6
    jr z, .HitSpikes

    ; Salida? (tile 7)
    cp 7
    jr z, .CheckExit

    ret

.GotDiamond:
    ; Borrar diamante del mapa
    ld (hl), 0

    ; Borrar de pantalla
    push hl

    ; Calcular pos VRAM
    pop de
    push de
    ld hl, Level1Data
    ex de, hl
    or a
    sbc hl, de
    ld de, VRAM_NAM
    add hl, de
    xor a
    call WRTVRM

    pop hl

    ; Decrementar contador
    ld a, (DiamondsLeft)
    dec a
    ld (DiamondsLeft), a

    ret

.HitSpikes:
    ; Perder vida
    ld a, (Lives)
    dec a
    ld (Lives), a
    jr z, .GameOver

    ; Reiniciar posición
    call InitGame
    ret

.GameOver:
    ; Aquí iría la pantalla de game over
    jp Main

.CheckExit:
    ret

; ============================================
; COMPROBAR NIVEL COMPLETO
; ============================================
CheckLevelComplete:
    ld a, (DiamondsLeft)
    or a
    ret nz

    ; Nivel completado - aquí cargarías el siguiente
    ; Por ahora, reiniciar
    call InitGame
    call DrawLevel

    ret

; ============================================
; ACTUALIZAR SPRITES
; ============================================
UpdateSprites:
    ; Sprite del jugador
    ld hl, VRAM_SPR_ATR

    ; Y
    ld a, (PlayerY)
    push hl
    call WRTVRM
    pop hl
    inc hl

    ; X
    ld a, (PlayerX)
    push hl
    call WRTVRM
    pop hl
    inc hl

    ; Patrón (según dirección)
    ld a, (PlayerDir)
    or a
    jr z, .FaceLeft
    xor a               ; Patrón 0 = derecha
    jr .SetPattern
.FaceLeft:
    ld a, 4             ; Patrón 4 = izquierda
.SetPattern:
    push hl
    call WRTVRM
    pop hl
    inc hl

    ; Color
    ld a, 15            ; Blanco
    push hl
    call WRTVRM
    pop hl

    ret

; ============================================
; DATOS DEL NIVEL 1 (32x24 = 768 bytes)
; ============================================
; Tiles: 0=vacío, 1=ladrillo, 2=plataforma, 3=escalera
;        4=tierra, 5=diamante, 6=pinchos, 7=salida

Level1Data:
    ; Fila 0 - Borde superior
    db 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
    ; Fila 1
    db 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    ; Fila 2
    db 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    ; Fila 3
    db 1,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,0,0,0,7,0,0,1
    ; Fila 4 - Plataformas superiores
    db 1,0,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,2,0,0,0,2,2,2,0,1
    ; Fila 5
    db 1,0,0,0,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    ; Fila 6
    db 1,0,0,0,0,0,0,0,0,0,2,2,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    ; Fila 7
    db 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    ; Fila 8
    db 1,0,0,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    ; Fila 9
    db 1,0,0,0,0,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    ; Fila 10
    db 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,0,1
    ; Fila 11
    db 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,2,2,0,0,0,0,0,0,1
    ; Fila 12
    db 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    ; Fila 13
    db 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    ; Fila 14
    db 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    ; Fila 15
    db 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    ; Fila 16
    db 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    ; Fila 17
    db 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    ; Fila 18 - Plataformas intermedias
    db 1,0,0,0,0,0,0,2,2,2,2,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0,0,1
    ; Fila 19
    db 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    ; Fila 20 - Jugador empieza aquí
    db 1,0,0,0,0,0,0,0,0,0,0,0,0,0,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    ; Fila 21 - Suelo con pinchos
    db 1,2,2,2,2,2,2,2,2,2,2,2,2,2,4,4,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1
    ; Fila 22 - Tierra
    db 1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1
    ; Fila 23 - Borde inferior
    db 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1

; ============================================
; PATRONES DE TILES (32 tiles × 8 bytes)
; ============================================
TilePatterns:
; Tile 0 - Vacío
    db 00000000b
    db 00000000b
    db 00000000b
    db 00000000b
    db 00000000b
    db 00000000b
    db 00000000b
    db 00000000b

; Tile 1 - Ladrillo
    db 11111111b
    db 10000100b
    db 10000100b
    db 11111111b
    db 00100001b
    db 00100001b
    db 11111111b
    db 00000000b

; Tile 2 - Plataforma
    db 11111111b
    db 11111111b
    db 11000011b
    db 11000011b
    db 11000011b
    db 11000011b
    db 00000000b
    db 00000000b

; Tile 3 - Escalera
    db 01000010b
    db 01111110b
    db 01000010b
    db 01000010b
    db 01111110b
    db 01000010b
    db 01000010b
    db 01111110b

; Tile 4 - Tierra
    db 11101110b
    db 01110111b
    db 10111011b
    db 11011101b
    db 10111011b
    db 01110111b
    db 11101110b
    db 11011101b

; Tile 5 - Diamante
    db 00011000b
    db 00111100b
    db 01111110b
    db 11111111b
    db 11111111b
    db 01111110b
    db 00111100b
    db 00011000b

; Tile 6 - Pinchos
    db 00000000b
    db 00100100b
    db 00100100b
    db 01100110b
    db 01100110b
    db 11101110b
    db 11101110b
    db 11111111b

; Tile 7 - Salida/Puerta
    db 01111110b
    db 01000010b
    db 01011010b
    db 01011010b
    db 01011010b
    db 01001010b
    db 01000010b
    db 01111110b

; Tiles 8-31 - Reservados (relleno)
    ds 24*8, 0

; Completar hasta 256 tiles para llenar el banco
    ds 224*8, 0

; ============================================
; COLORES DE TILES (256 tiles × 8 bytes)
; ============================================
TileColors:
; Tile 0 - Vacío (negro sobre negro)
    db 011h, 011h, 011h, 011h, 011h, 011h, 011h, 011h

; Tile 1 - Ladrillo (rojo sobre marrón oscuro)
    db 086h, 086h, 086h, 086h, 086h, 086h, 086h, 086h

; Tile 2 - Plataforma (verde sobre negro)
    db 031h, 031h, 031h, 031h, 031h, 031h, 031h, 031h

; Tile 3 - Escalera (marrón sobre negro)
    db 061h, 061h, 061h, 061h, 061h, 061h, 061h, 061h

; Tile 4 - Tierra (marrón)
    db 0C6h, 0C6h, 0C6h, 0C6h, 0C6h, 0C6h, 0C6h, 0C6h

; Tile 5 - Diamante (cyan brillante)
    db 071h, 071h, 071h, 0F1h, 0F1h, 071h, 071h, 071h

; Tile 6 - Pinchos (blanco sobre rojo)
    db 0F1h, 0F8h, 0F8h, 0F8h, 0F8h, 0F8h, 0F8h, 0F8h

; Tile 7 - Puerta (amarillo)
    db 0A1h, 0A1h, 0A1h, 0A1h, 0A1h, 0A1h, 0A1h, 0A1h

; Tiles 8-31 - Reservados
    ds 24*8, 011h

; Completar hasta 256 tiles
    ds 224*8, 011h

; ============================================
; PATRONES DE SPRITES (16x16, 32 bytes cada uno)
; ============================================
SpritePatterns:
; Sprite 0 - Minero derecha (parte superior izquierda)
    db 00000011b    ; 0
    db 00001111b    ; 1
    db 00011111b    ; 2
    db 00111111b    ; 3
    db 00111111b    ; 4
    db 00111110b    ; 5
    db 00011100b    ; 6
    db 00111110b    ; 7
    db 00111110b    ; 8
    db 00011100b    ; 9
    db 00011100b    ; 10
    db 00001000b    ; 11
    db 00011100b    ; 12
    db 00100010b    ; 13
    db 01000001b    ; 14
    db 01000001b    ; 15

; Sprite 0 - Minero derecha (parte superior derecha)
    db 11000000b
    db 11110000b
    db 11111000b
    db 11111100b
    db 11111100b
    db 01111100b
    db 00111000b
    db 01111100b
    db 01111100b
    db 00111000b
    db 00111000b
    db 00010000b
    db 00111000b
    db 01000100b
    db 10000010b
    db 10000010b

; Sprite 1 - Minero izquierda (parte superior izquierda - espejado)
    db 11000000b
    db 11110000b
    db 11111000b
    db 11111100b
    db 11111100b
    db 01111100b
    db 00111000b
    db 01111100b
    db 01111100b
    db 00111000b
    db 00111000b
    db 00010000b
    db 00111000b
    db 01000100b
    db 10000010b
    db 10000010b

; Sprite 1 - Minero izquierda (parte superior derecha - espejado)
    db 00000011b
    db 00001111b
    db 00011111b
    db 00111111b
    db 00111111b
    db 00111110b
    db 00011100b
    db 00111110b
    db 00111110b
    db 00011100b
    db 00011100b
    db 00001000b
    db 00011100b
    db 00100010b
    db 01000001b
    db 01000001b

; ============================================
; VARIABLES
; ============================================
PlayerX:        db 0
PlayerY:        db 0
PlayerVX:       db 0
PlayerVY:       db 0
PlayerDir:      db 1    ; 0=izquierda, 1=derecha
PlayerJumping:  db 0
DiamondsLeft:   db 0
Lives:          db 3
JoystickDir:    db 0
TriggerState:   db 0

; ============================================
; FIN DEL PROGRAMA
; ============================================

    ds 8000h - $, 0FFh  ; Rellenar hasta 16KB ROM
