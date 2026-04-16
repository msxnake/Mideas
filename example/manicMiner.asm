; ==============================================================================
; MINI MANIC MINER MSX1 - Glass Z80 Assembler (CORREGIDO)
; ==============================================================================
; Controles: Cursores Izq/Der, Espacio para saltar
; Objetivo: Recoger las gemas, evitar los fantasmas
; ==============================================================================

    org 0x4000

    ; --- Cabecera ROM MSX 16KB ---
    db "AB"               ; Firma
    dw Inicio             ; Punto de entrada
    dw 0, 0, 0, 0, 0     ; Relleno

; --- Constantes ---
SCREEN2_NT   equ 0x1800  ; Name Table
SCREEN2_CT   equ 0x2000  ; Color Table
SCREEN2_PT   equ 0x0000  ; Pattern Table
SCREEN2_SAT  equ 0x1B00  ; Sprite Attribute Table
SCREEN2_SGT  equ 0x3800  ; Sprite Pattern Table

VDP_PORT0    equ 0x98    ; Puerto VRAM Data
VDP_PORT1    equ 0x99    ; Puerto VRAM Regs/Status

PPI_PORT_A   equ 0xA9    ; Teclado

TILE_VACIO   equ 0
TILE_PARED   equ 11
TILE_GEMA    equ 12

; ==============================================================================
; INICIO DEL PROGRAMA
; ==============================================================================
Inicio:
    di                  ; Deshabilitar interrupciones
    
    call InitScreen2
    call CargarTiles
    call CargarSprites
    call InitMapa
    call InitVariables
    
BuclePrincipal:
    call EsperarVBlank
    call LeerTeclado
    call MoverJugador
    call MoverEnemigos
    call CheckColisiones
    call ActualizarScoreVRAM
    call ActualizarSpritesVRAM
    jr BuclePrincipal

; ==============================================================================
; INICIALIZACIÓN Y GRÁFICOS
; ==============================================================================
InitScreen2:
    ld hl, VDPRegs
    ld b, 8
    ld c, 0
InitVDP_Loop:
    ld a, (hl)
    out (VDP_PORT1), a
    ld a, c
    out (VDP_PORT1), a
    inc hl
    inc c
    djnz InitVDP_Loop
    
    ; Limpiar VRAM
    ld hl, 0x0000
    call SetVDPWrite
    ld bc, 0x4000
CleanVRAM_Loop:
    xor a
    out (VDP_PORT0), a
    dec bc
    ld a, b
    or c
    jr nz, CleanVRAM_Loop
    ret

VDPRegs:
    db 0x02, 0x62, 0x06, 0x80, 0x00, 0x36, 0x07, 0x01

CargarTiles:
    ld hl, TileData
    ld de, SCREEN2_PT
    call SetVDPWrite
    ld bc, 8*16
    call CopiarVRAM
    call CopiarVRAM
    call CopiarVRAM
    
    ld hl, ColorData
    ld de, SCREEN2_CT
    call SetVDPWrite
    ld bc, 8*16
    call CopiarVRAM
    call CopiarVRAM
    call CopiarVRAM
    ret

CopiarVRAM:
    push bc
Copiar_Loop:
    ld a, (hl)
    out (VDP_PORT0), a
    inc hl
    dec bc
    ld a, b
    or c
    jr nz, Copiar_Loop
    pop bc
    ret

CargarSprites:
    ld hl, SpriteData
    ld de, SCREEN2_SGT
    call SetVDPWrite
    ld bc, 32*3
Spr_Loop:
    ld a, (hl)
    out (VDP_PORT0), a
    inc hl
    dec bc
    ld a, b
    or c
    jr nz, Spr_Loop
    ret

InitMapa:
    ld hl, MapaLogico
    ld de, SCREEN2_NT
    call SetVDPWrite
    ld bc, 768
Map_Loop:
    ld a, (hl)
    out (VDP_PORT0), a
    inc hl
    dec bc
    ld a, b
    or c
    jr nz, Map_Loop
    ret

InitVariables:
    ld a, 40
    ld (PlayerX), a
    ld a, 136            ; Alineado sobre la plataforma inferior
    ld (PlayerY), a
    xor a
    ld (PlayerVY), a
    ld (PlayerOnFloor), a
    ld (Score), a
    ld (Score+1), a
    
    ld a, 100
    ld (Enemigo1X), a
    ld a, 136            ; En la plataforma inferior
    ld (Enemigo1Y), a
    ld a, 1
    ld (Enemigo1VX), a
    
    ld a, 180
    ld (Enemigo2X), a
    ld a, 88             ; En la plataforma del medio (Fila 13 * 8 - 16)
    ld (Enemigo2Y), a
    ld a, -1
    ld (Enemigo2VX), a
    ret

; ==============================================================================
; LÓGICA DEL JUEGO
; ==============================================================================
EsperarVBlank:
    in a, (VDP_PORT1)
    rlca
    jr c, EsperarVBlank
EspVBlank2:
    in a, (VDP_PORT1)
    rlca
    jr nc, EspVBlank2
    ret

LeerTeclado:
    ld a, 8
    out (PPI_PORT_A+1), a
    in a, (PPI_PORT_A)
    ld (InputState), a
    ret

MoverJugador:
    ; Gravedad
    ld a, (PlayerVY)
    inc a
    cp 5
    jr nz, NoMaxVY
    ld a, 4
NoMaxVY:
    ld (PlayerVY), a
    
    ; Aplicar Velocidad Vertical
    ld b, a
    ld a, (PlayerY)
    add a, b
    ld (PlayerY), a
    
    ; Comprobar Suelo (Tile debajo a la izquierda y derecha, a los PIES del sprite Y+16)
    ld a, (PlayerY)
    add a, 16
    ld d, a
    ld a, (PlayerX)
    add a, 3
    ld e, a
    call GetTile
    cp TILE_PARED
    jr z, TocarSuelo
    
    ld a, (PlayerY)
    add a, 16
    ld d, a
    ld a, (PlayerX)
    add a, 12
    ld e, a
    call GetTile
    cp TILE_PARED
    jr nz, NoTocaSuelo

TocarSuelo:
    ; Alinear Y hacia arriba para que no penetre el tile
    ld a, d              ; D contiene la Y del pie (PlayerY + 16)
    and 0xF8             ; Redondear al tile actual
    sub 16               ; Restar la altura del sprite
    ld (PlayerY), a
    xor a
    ld (PlayerVY), a
    ld a, 1
    ld (PlayerOnFloor), a
    jr MoverHoriz

NoTocaSuelo:
    xor a
    ld (PlayerOnFloor), a

MoverHoriz:
    ld a, (InputState)
    bit 4, a
    jr nz, NoIzq
    ld a, (PlayerX)
    cp 0
    jr z, NoIzq
    sub 2
    ld (PlayerX), a
NoIzq:
    ld a, (InputState)
    bit 1, a
    jr nz, NoDer
    ld a, (PlayerX)
    cp 240
    jr z, NoDer
    add a, 2
    ld (PlayerX), a
NoDer:
    ld a, (InputState)
    bit 0, a
    jr nz, NoSalto
    ld a, (PlayerOnFloor)
    cp 1
    jr nz, NoSalto
    ld a, -6
    ld (PlayerVY), a
NoSalto:
    
    ; Colisión Horizontal con Paredes (En el centro del sprite Y+8)
    ld a, (PlayerX)
    add a, 2
    ld e, a
    ld a, (PlayerY)
    add a, 8
    ld d, a
    call GetTile
    cp TILE_PARED
    jr nz, CheckDer
    ld a, (PlayerX)
    add a, 2
    and 0xF8
    ld (PlayerX), a
CheckDer:
    ld a, (PlayerX)
    add a, 13
    ld e, a
    ld a, (PlayerY)
    add a, 8
    ld d, a
    call GetTile
    cp TILE_PARED
    jr nz, EndMove
    ld a, (PlayerX)
    add a, 13
    and 0xF8
    dec a
    ld (PlayerX), a
EndMove:
    ret

MoverEnemigos:
    ld hl, Enemigo1X
    call MoverFantasma
    ld hl, Enemigo2X
    call MoverFantasma
    ret

MoverFantasma:
    ld a, (hl)
    ld e, a
    inc hl
    ld a, (hl)
    ld d, a
    inc hl
    ld a, (hl)
    ld b, a
    
    ld a, e
    add a, b
    ld e, a
    ld (EnemigoX_Temp), a
    
    push hl
    ld a, b
    cp 1
    jr z, CheckE_Der
CheckE_Izq:
    ld a, e
    add a, 2
    ld e, a
    jr DoCheckE
CheckE_Der:
    ld a, e
    add a, 13
    ld e, a
DoCheckE:
    ld a, d
    add a, 8
    ld d, a
    call GetTile
    pop hl
    cp TILE_PARED
    jr nz, GuardarEnemigo
    ld a, b
    neg
    ld (hl), a
    ld a, e
    sub b
    ld e, a
GuardarEnemigo:
    dec hl
    ld a, e
    ld (hl), a
    ret

CheckColisiones:
    ; Recoger Gema (Centro del sprite)
    ld a, (PlayerX)
    add a, 8
    ld e, a
    ld a, (PlayerY)
    add a, 8
    ld d, a
    call GetTile
    cp TILE_GEMA
    jr nz, CheckEnemigos
    
    call BorrarGemaMapa
    ; Sumar 10 puntos en BCD
    ld a, (Score)
    add a, 0x10
    daa
    ld (Score), a
    ld a, (Score+1)
    adc a, 0
    daa
    ld (Score+1), a
    
CheckEnemigos:
    call CheckEnemigo1
    call CheckEnemigo2
    ret

CheckEnemigo1:
    ld a, (Enemigo1X)
    call CheckEnemigoGenerico
    ret
CheckEnemigo2:
    ld a, (Enemigo2X)
    call CheckEnemigoGenerico
    ret

CheckEnemigoGenerico:
    ld b, a
    ld a, (PlayerX)
    sub b
    jr nc, NoAbs1
    neg
NoAbs1:
    cp 12
    ret nc
    
    push bc
    call GetEnemigoYTemp
    pop bc
    ld c, a
    ld a, (PlayerY)
    sub c
    jr nc, NoAbs2
    neg
NoAbs2:
    cp 12
    ret nc
    
    ; ¡MUERTE! Reiniciar posición
    ld a, 40
    ld (PlayerX), a
    ld a, 136
    ld (PlayerY), a
    xor a
    ld (PlayerVY), a
    ret

GetEnemigoYTemp:
    cp Enemigo1X
    jr nz, EsEnemigo2
    ld a, (Enemigo1Y)
    ret
EsEnemigo2:
    ld a, (Enemigo2Y)
    ret

BorrarGemaMapa:
    ; D=Y, E=X
    ld a, d
    and 0xF8
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl           ; HL = (Y / 8) * 32
    ld a, e
    rrca
    rrca
    rrca
    and 0x1F
    add a, l
    ld l, a
    ld h, 0
    
    push hl               ; Guardar offset
    
    ld bc, MapaLogico
    add hl, bc
    ld (hl), TILE_VACIO   ; Borrar de RAM
    
    pop hl                ; Recuperar offset
    ld bc, SCREEN2_NT
    add hl, bc
    call SetVDPWrite      ; Borrar de VRAM
    xor a
    out (VDP_PORT0), a
    ret

GetTile:
    ; Entrada: D=Y, E=X. Salida: A=TileID
    push hl
    push bc
    ld a, d
    and 0xF8
    ld l, a
    ld h, 0
    add hl, hl
    add hl, hl           ; HL = (Y / 8) * 32
    ld a, e
    rrca
    rrca
    rrca
    and 0x1F
    add a, l
    ld l, a
    ld bc, MapaLogico
    add hl, bc
    ld a, (hl)
    pop bc
    pop hl
    ret

; ==============================================================================
; ACTUALIZACIÓN VRAM (Sprites y Puntuación)
; ==============================================================================
ActualizarSpritesVRAM:
    ld hl, SCREEN2_SAT
    call SetVDPWrite
    
    ; Sprite 0: Jugador Color 1 (Fondo, Color 9 - Rojo)
    ld a, (PlayerY)
    out (VDP_PORT0), a
    ld a, (PlayerX)
    out (VDP_PORT0), a
    xor a
    out (VDP_PORT0), a
    ld a, 9
    out (VDP_PORT0), a
    
    ; Sprite 1: Jugador Color 2 (Contorno, Color 15 - Blanco)
    ld a, (PlayerY)
    out (VDP_PORT0), a
    ld a, (PlayerX)
    out (VDP_PORT0), a
    ld a, 1
    out (VDP_PORT0), a
    ld a, 15
    out (VDP_PORT0), a
    
    ; Sprite 2: Fantasma 1
    ld a, (Enemigo1Y)
    out (VDP_PORT0), a
    ld a, (Enemigo1X)
    out (VDP_PORT0), a
    ld a, 2
    out (VDP_PORT0), a
    ld a, 5
    out (VDP_PORT0), a
    
    ; Sprite 3: Fantasma 2
    ld a, (Enemigo2Y)
    out (VDP_PORT0), a
    ld a, (Enemigo2X)
    out (VDP_PORT0), a
    ld a, 2
    out (VDP_PORT0), a
    ld a, 6
    out (VDP_PORT0), a
    
    ; Rellenar resto de SAT vacío (8 sprites max)
    ld b, 4*4
CleanSAT_Loop:
    xor a
    out (VDP_PORT0), a
    djnz CleanSAT_Loop
    ret

ActualizarScoreVRAM:
    ld hl, (Score)
    ld de, SCREEN2_NT + 7
    call SetVDPWrite
    
    ld a, h
    call EscribirByteScore
    ld a, l
    call EscribirByteScore
    ret

EscribirByteScore:
    push af
    rrca
    rrca
    rrca
    rrca
    and 0x0F
    inc a
    out (VDP_PORT0), a
    pop af
    and 0x0F
    inc a
    out (VDP_PORT0), a
    ret

; ==============================================================================
; UTILIDADES VRAM
; ==============================================================================
SetVDPWrite:
    ld a, l
    out (VDP_PORT1), a
    ld a, h
    or 0x40
    out (VDP_PORT1), a
    ret

; ==============================================================================
; DATOS DEL JUEGO
; ==============================================================================
TileData:
    db 0,0,0,0,0,0,0,0
    db 0x7C,0xC6,0xCE,0xD6,0xE6,0xC6,0x7C,0x00 ; 0
    db 0x18,0x38,0x18,0x18,0x18,0x18,0x7E,0x00 ; 1
    db 0x7C,0xC6,0x06,0x1C,0x30,0x60,0xFE,0x00 ; 2
    db 0x7C,0xC6,0x06,0x3C,0x06,0xC6,0x7C,0x00 ; 3
    db 0x1C,0x3C,0x6C,0xCC,0xFE,0x0C,0x1E,0x00 ; 4
    db 0xFE,0xC0,0xFC,0x06,0x06,0xC6,0x7C,0x00 ; 5
    db 0x38,0x60,0xC0,0xFC,0xC6,0xC6,0x7C,0x00 ; 6
    db 0xFE,0xC6,0x0C,0x18,0x30,0x30,0x30,0x00 ; 7
    db 0x7C,0xC6,0xC6,0x7C,0xC6,0xC6,0x7C,0x00 ; 8
    db 0x7C,0xC6,0xC6,0x7E,0x06,0x0C,0x78,0x00 ; 9
    db 0xFF,0x80,0x80,0x80,0xFF,0x01,0x01,0x01 ; PARED
    db 0x18,0x3C,0x7E,0xFF,0xFF,0x7E,0x3C,0x18 ; GEMA

ColorData:
    db 0,0,0,0,0,0,0,0
    db 15,15,15,15,15,15,15,15
    db 15,15,15,15,15,15,15,15
    db 15,15,15,15,15,15,15,15
    db 15,15,15,15,15,15,15,15
    db 15,15,15,15,15,15,15,15
    db 15,15,15,15,15,15,15,15
    db 15,15,15,15,15,15,15,15
    db 15,15,15,15,15,15,15,15
    db 15,15,15,15,15,15,15,15
    db 15,15,15,15,15,15,15,15
    db 9,9,9,9,9,9,9,9
    db 5,5,5,5,5,5,5,5

SpriteData:
    ; Sprite 0: Jugador Color 1 (Interior Rojo)
    db 0x00,0x3C,0x7E,0x7E,0x7E,0x7E,0x3C,0x00 
    db 0x00,0x3C,0x7E,0x7E,0x7E,0x7E,0x3C,0x00 
    db 0x00,0x3C,0x7E,0x7E,0x7E,0x7E,0x3C,0x00 
    db 0x00,0x3C,0x7E,0x7E,0x7E,0x7E,0x3C,0x00 
    
    ; Sprite 1: Jugador Color 2 (Contorno Blanco)
    db 0xFF,0xC3,0x81,0x81,0x81,0x81,0xC3,0xFF 
    db 0xFF,0xC3,0x81,0x81,0x81,0x81,0xC3,0xFF 
    db 0xFF,0xC3,0x81,0x81,0x81,0x81,0xC3,0xFF 
    db 0xFF,0xC3,0x81,0x81,0x81,0x81,0xC3,0xFF 
    
    ; Sprite 2: Fantasma
    db 0x3C,0x7E,0xFF,0xFF,0xFF,0xFF,0xFF,0x00 
    db 0x3C,0x7E,0xFF,0xFF,0xFF,0xFF,0xFF,0x00 
    db 0x00,0x00,0xFF,0xFF,0xFF,0xE7,0xDB,0x00 
    db 0x00,0x00,0xFF,0xFF,0xFF,0xE7,0xDB,0x00 

MapaLogico:
    db 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ; 0
    db 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ; 1
    db 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ; 2
    db 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ; 3
    db 0,0,0,0,0,0,0,0,0,11,11,11,11,11,11,11,11,11,11,0,0,0,0,0,0,0,0,0,0,0,0,0 ; 4
    db 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ; 5
    db 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,12,12,0,0,0,0,0,0 ; 6
    db 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,11,11,11,11,0,0,0,0,0,0 ; 7
    db 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ; 8
    db 0,0,0,0,12,12,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ; 9
    db 0,0,0,11,11,11,11,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ; 10
    db 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ; 11
    db 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,12,12,0,0,0,0,0,0,0,0,0 ; 12
    db 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,11,11,11,11,0,0,0,0,0,0,0,0,0 ; 13
    db 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ; 14
    db 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ; 15
    db 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ; 16
    db 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ; 17
    db 0,0,12,12,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,12,12,0,0,0 ; 18
    db 0,0,11,11,11,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,11,11,11,0,0,0 ; 19
    db 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ; 20
    db 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0 ; 21
    db 11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11 ; 22
    db 11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11 ; 23

; --- Variables en RAM ---
    org 0xC000
PlayerX:       ds 1
PlayerY:       ds 1
PlayerVY:      ds 1
PlayerOnFloor: ds 1
Score:         ds 2     ; 16-bit BCD
InputState:    ds 1
Enemigo1X:     ds 1
Enemigo1Y:     ds 1
Enemigo1VX:    ds 1
Enemigo2X:     ds 1
Enemigo2Y:     ds 1
Enemigo2VX:    ds 1
EnemigoX_Temp: ds 1