; =============================================================================
; MANIC MINER MSX - 16KB ROM DEMO (Screen 2)
; Compilable con Glass.jar
; =============================================================================

    ; Directivas de Glass para generar una ROM de 16KB en la página 1 ($4000)
  
    org $4000

; --- CABECERA ROM MSX ---
ROM_HEADER:
    db "AB"                 ; Firma de la ROM
    dw START                ; Dirección de inicio del código
    dw 0, 0, 0, 0, 0, 0     ; Reservado

; --- CONSTANTES DEL SISTEMA (BIOS) ---
CHGMOD:     equ $005F       ; Cambiar modo de pantalla
LDIRVM:     equ $005C       ; Copiar bloque de RAM a VRAM
CHGCLR:     equ $0062       ; Cambiar colores
DISSBR:     equ $0041       ; Desactivar sprite0 de la BIOS
ENASLT:     equ $0024       ; Habilitar slot (BIOS)
GTSTCK:     equ $00D5       ; Leer joystick/cursores (A=0 cursores)
GTTRIG:     equ $00D7       ; Leer botones/espacio (A=0 barra espaciadora)

; --- MAPA DE VRAM EN SCREEN 2 ---
VRAM_NMT:   equ $1800       ; Name Table (Mapa de baldosas)
VRAM_PGT:   equ $0000       ; Pattern Generator Table (Patrones de tiles)
VRAM_CT:    equ $2000       ; Color Table (Colores de tiles)
VRAM_SAT:   equ $1B00       ; Sprite Attribute Table
VRAM_SPT:   equ $3800       ; Sprite Pattern Table

; --- VARIABLES EN RAM (Página 3) ---
    org $C000

player_x:       db 0
player_y:       db 0
player_frame:   db 0
player_anim:    db 0
is_jumping:     db 0
jump_timer:     db 0
score:          db 0
gems_left:      db 0

enemy_x:        db 0
enemy_dir:      db 0  ; 0=Izquierda, 1=Derecha

; Regresar al origen de la ROM para continuar escribiendo código
    org $4010

START:
    ; 1. Inicializar Stack Pointer y Slots para la ROM
    di
    ld sp, $F380
    
    ; Configurar slot de la ROM en página 1
    call $138           ; RSLREG: leer slot actual
    and %00001100       ; Aislar página 1
    and a
    
    ; 2. Inicializar Modo Gráfico: SCREEN 2
    ld a, 2
    call CHGMOD
    
    ; Configurar registros del VDP para Screen 2 estándar
    ; Reg 0: M3=0, YAE=0, etc.
    ld a, %00000010
    out ($99), a
    ld a, $80
    out ($99), a
    ; Reg 1: BL=1, IE=0, M1=0, M2=0, SI=1 (Sprites 16x16), MAG=0
    ld a, %11100010
    out ($99), a
    ld a, $81
    out ($99), a

    ; Colores: Texto Blanco (15), Fondo Negro (1), Borde Negro (1)
    ld a, 15
    ld ($F3E9), a       ; FORCLR
    ld a, 1
    ld ($F3EA), a       ; BAKCLR
    ld ($F3EB), a       ; BDRCLR
    call CHGCLR

    ; 3. Cargar Gráficos en la VRAM
    call INIT_GRAPHICS

    ; 4. Inicializar Variables de Juego
    ld a, 16
    ld (player_x), a
    ld a, 152
    ld (player_y), a
    ld a, 4
    ld (gems_left), a
    ld a, 120
    ld (enemy_x), a
    ld a, 0
    ld (enemy_dir), a

    ; Pintar el escenario en la Name Table
    call DRAW_STAGE

; --- BUCLE PRINCIPAL ---
GAME_LOOP:
    ; Sincronización con el barrido vertical
HALT_LOOP:
    in a, ($99)
    rlca
    jr nc, HALT_LOOP

    ; Ejecutar lógicas
    call UPDATE_PLAYER
    call UPDATE_ENEMY
    call REFRESH_SPRITES

    jr GAME_LOOP

; --- LÓGICA DEL JUGADOR ---
UPDATE_PLAYER:
    ; Leer Cursores (A=0)
    ld a, 0
    call GTSTCK
    
    ; Comprobar Izquierda (A=7)
    cp 7
    jr z, MOVE_LEFT
    ; Comprobar Derecha (A=3)
    cp 3
    jr z, MOVE_RIGHT
    jr CHECK_JUMP

MOVE_LEFT:
    ld a, (player_x)
    cp 8
    jr z, CHECK_JUMP    ; Límite izquierdo
    dec a
    ld (player_x), a
    
    ; Animación caminando izquierda (frames 2 y 3)
    ld a, (player_anim)
    inc a
    and 7
    ld (player_anim), a
    srl a
    srl a
    add a, 2
    ld (player_frame), a
    jr CHECK_JUMP

MOVE_RIGHT:
    ld a, (player_x)
    cp 232
    jr z, CHECK_JUMP    ; Límite derecho
    inc a
    ld (player_x), a
    
    ; Animación caminando derecha (frames 0 y 1)
    ld a, (player_anim)
    inc a
    and 7
    ld (player_anim), a
    srl a
    srl a
    ld (player_frame), a

CHECK_JUMP:
    ; Si ya está saltando, procesar salto
    ld a, (is_jumping)
    and a
    jr nz, DO_JUMP

    ; Leer barra espaciadora (A=0)
    ld a, 0
    call GTTRIG
    cp $FF
    jr nz, FALL_CHECK   ; Si no salta, comprobar gravedad

    ; Iniciar salto
    ld a, 1
    ld (is_jumping), a
    ld a, 8             ; Duración del ascenso
    ld (jump_timer), a
    jr FALL_CHECK

DO_JUMP:
    ld a, (jump_timer)
    and a
    jr z, JUMP_DOWN
    
    ; Ascendiendo
    dec a
    ld (jump_timer), a
    ld a, (player_y)
    sub 3
    ld (player_y), a
    ret

JUMP_DOWN:
    ; Descendiendo del salto
    ld a, (player_y)
    cp 152             ; Suelo de la pantalla
    jr z, JUMP_END
    add a, 3
    ld (player_y), a
    ret

JUMP_END:
    ld a, 0
    ld (is_jumping), a
    ret

FALL_CHECK:
    ; Gravedad básica si no está en el suelo y no salta
    ld a, (is_jumping)
    and a
    ret nz
    ld a, (player_y)
    cp 152
    ret z
    inc a
    inc a
    ld (player_y), a
    ret

; --- LÓGICA DEL ENEMIGO ---
UPDATE_ENEMY:
    ld a, (enemy_dir)
    and a
    jr nz, ENEMY_RIGHT

ENEMY_LEFT:
    ld a, (enemy_x)
    dec a
    ld (enemy_x), a
    cp 60
    ret nz
    ld a, 1
    ld (enemy_dir), a   ; Cambiar de dirección a la derecha
    ret

ENEMY_RIGHT:
    ld a, (enemy_x)
    inc a
    ld (enemy_x), a
    cp 180
    ret nz
    ld a, 0
    ld (enemy_dir), a   ; Cambiar de dirección a la izquierda
    ret

; --- VOLCADO DE SPRITES A VRAM ---
REFRESH_SPRITES:
    ; Búfer temporal en RAM para la SAT ($1B00)
    ; Sprite 0: Miner Willy
    ld a, (player_y)
    dec a               ; Ajuste visual Y
    ld ($C100), a       ; Y
    ld a, (player_x)
    ld ($C101), a       ; X
    ld a, (player_frame)
    sla a
    sla a               ; Cada sprite 16x16 usa 4 patrones de 8x8
    ld ($C102), a       ; Patrón
    ld a, 13            ; Color Magenta
    ld ($C103), a

    ; Sprite 1: Enemigo de la mina
    ld a, 152           ; Altura fija en el suelo
    ld ($C104), a
    ld a, (enemy_x)
    ld ($C105), a
    ld a, 16            ; Patrón del enemigo (index 16)
    ld ($C106), a
    ld a, 8             ; Color Rojo/Cian
    ld ($C107), a

    ; Fin de la tabla de sprites (Y=208)
    ld a, 208
    ld ($C108), a

    ; Enviar los 9 bytes a la SAT en VRAM
    ld hl, $C100
    ld de, VRAM_SAT
    ld bc, 9
    call LDIRVM
    ret

; --- TRANSFERENCIA DE RECURSOS GRÁFICOS ---
INIT_GRAPHICS:
    ; 1. Cargar Patrones de Tiles en los 3 bancos de Screen 2 (3 * 2KB = 6KB)
    ld b, 3
    ld de, VRAM_PGT
INIT_TILE_PAT:
    push bc
    push de
    ld hl, TILE_PATTERNS
    ld bc, 40           ; 5 tiles * 8 bytes
    call LDIRVM
    pop de
    ld hl, $0800        ; Saltar al siguiente banco de 2KB
    add hl, de
    ex de, hl
    pop bc
    djnz INIT_TILE_PAT

    ; 2. Cargar Colores de Tiles en los 3 bancos (3 * 2KB = 6KB)
    ld b, 3
    ld de, VRAM_CT
INIT_TILE_COL:
    push bc
    push de
    ld hl, TILE_COLORS
    ld bc, 40
    call LDIRVM
    pop de
    ld hl, $0800
    add hl, de
    ex de, hl
    pop bc
    djnz INIT_TILE_COL

    ; 3. Cargar Patrones de Sprites en la Sprite Pattern Table
    ld hl, SPRITE_PATTERNS
    ld de, VRAM_SPT
    ld bc, 96           ; 3 frames * 32 bytes
    call LDIRVM
    ret

; --- DIBUJAR PANTALLA (Name Table) ---
DRAW_STAGE:
    ; Llenar la pantalla entera con azulejos vacíos (Tile 0)
    ld hl, VRAM_NMT
    ld bc, 768
    ld a, 0
FILL_EMPTY:
    push hl
    push bc
    ld d, a
    ld bc, 1
    call LDIRVM
    ld a, d
    pop bc
    pop hl
    inc hl
    dec bc
    ld a, b
    or c
    jr nz, FILL_EMPTY

    ; Pintar Suelo (Línea 21 de caracteres)
    ld hl, VRAM_NMT + (21 * 32)
    ld bc, 32
    ld a, 1             ; Tile 1 = Suelo
DRAW_FLOOR:
    push hl
    push bc
    ld d, a
    ld bc, 1
    call LDIRVM
    ld a, d
    pop bc
    pop hl
    inc hl
    dec bc
    ld a, b
    or c
    jr nz, DRAW_FLOOR

    ; Pintar elementos interactivos desde la tabla de datos
    ld hl, STAGE_ELEMENTS_DATA

STAGE_LOOP:
    ld a, (hl)
    cp $FF              ; ¿Es el fin de la tabla?
    ret z
    
    push hl
    
    ; Leer e identificar datos: DE = Dirección VRAM calculada
    ld b, a             ; B = Fila Y (0-23)
    inc hl
    ld c, (hl)          ; C = Columna X (0-31)
    inc hl
    ld a, (hl)          ; A = ID del Tile
    ld d, a             ; Guardar ID de tile temporalmente en D
    
    ; Calcular posición VRAM: VRAM_NMT + (Fila * 32) + Columna
    ld hl, 0
    ld a, b
    and a
    jr z, ADD_COL       ; Si la fila es 0, saltar multiplicación

MULT_32:
    ld de, 32
    add hl, de
    djnz MULT_32

ADD_COL:
    ld b, 0
    add hl, bc
    ld bc, VRAM_NMT
    add hl, bc          ; HL tiene ahora la dirección exacta de destino en VRAM
    ex de, hl           ; DE = Destino VRAM
    
    ; Hacer el volcado seguro a VRAM (1 byte)
    ; D contiene el Tile ID que pasamos a través de la memoria
    ld hl, $C200        ; Usamos una dirección segura temporal en RAM para pasar el byte
    ld (hl), d
    ld bc, 1
    call LDIRVM
    
    pop hl
    inc hl
    inc hl
    inc hl              ; Apuntar al siguiente elemento de 3 bytes
    jr STAGE_LOOP


; =============================================================================
; SECCIÓN DE DATOS (ARTE GRÁFICO Y MAPA)
; =============================================================================

; --- TABLA DE ELEMENTOS DE LA PANTALLA ---
; Formato: db FILA, COLUMNA, TILE_ID
STAGE_ELEMENTS_DATA:
    ; Plataforma elevada (12 bloques de Tile 1)
    db 14, 5, 1
    db 14, 6, 1
    db 14, 7, 1
    db 14, 8, 1
    db 14, 9, 1
    db 14, 10, 1
    db 14, 11, 1
    db 14, 12, 1
    db 14, 13, 1
    db 14, 14, 1
    db 14, 15, 1
    db 14, 16, 1

    ; Escalera conectando suelo con plataforma (Tile 2)
    db 15, 10, 2
    db 16, 10, 2
    db 17, 10, 2
    db 18, 10, 2
    db 19, 10, 2
    db 20, 10, 2

    ; Gemas a recolectar (Tile 3)
    db 13, 7, 3
    db 13, 14, 3
    db 20, 25, 3

    ; Cuerda colgante decorativa (Tile 4)
    db 2, 20, 4
    db 3, 20, 4
    db 4, 20, 4
    db 5, 20, 4

    db $FF              ; Marcador de Fin de Tabla

; --- PATRONES DE TILES (8 bytes por Tile) ---
TILE_PATTERNS:
    ; Tile 0: Vacío / Fondo
    db $00, $00, $00, $00, $00, $00, $00, $00
    ; Tile 1: Ladrillo Macizo
    db $FF, $81, $95, $95, $FF, $49, $49, $FF
    ; Tile 2: Escalera
    db $81, $FF, $81, $81, $FF, $81, $81, $FF
    ; Tile 3: Gema
    db $18, $3C, $7E, $FF, $FF, $7E, $3C, $18
    ; Tile 4: Cuerda
    db $10, $10, $18, $08, $08, $18, $10, $10

; --- COLORES DE TILES (8 bytes por Tile) ---
TILE_COLORS:
    ; Tile 0: Negro/Negro
    db $11, $11, $11, $11, $11, $11, $11, $11
    ; Tile 1: Gris/Azul
    db $D4, $D4, $D4, $D4, $44, $44, $44, $44
    ; Tile 2: Amarillo/Transparente
    db $A1, $A1, $A1, $A1, $A1, $A1, $A1, $A1
    ; Tile 3: Cian Brillante
    db $71, $71, $71, $71, $71, $71, $71, $71
    ; Tile 4: Marrón Madera
    db $61, $61, $61, $61, $61, $61, $61, $61

; --- PATRONES DE SPRITES (32 bytes por Frame) ---
SPRITE_PATTERNS:
    ; --- MINER WILLY: FRAME 1 (Derecha) ---
    db $07, $0F, $1F, $0E, $0C, $0D, $0F, $07, $03, $03, $07, $0E, $1C, $18, $1C, $0E
    db $E0, $F0, $F8, $70, $30, $B0, $F0, $E0, $C0, $C0, $E0, $70, $38, $18, $38, $70

    ; --- MINER WILLY: FRAME 2 (Izquierda) ---
    db $E0, $F0, $F8, $70, $30, $B0, $F0, $E0, $C0, $C0, $E0, $70, $38, $18, $38, $70
    db $07, $0F, $1F, $0E, $0C, $0D, $0F, $07, $03, $03, $07, $0E, $1C, $18, $1C, $0E

    ; --- ENEMIGO (Monstruo de la Mina) ---
    db $3F, $7F, $FF, $DB, $FF, $FF, $BD, $99, $C3, $66, $3C, $18, $3C, $66, $C3, $C3
    db $FC, $FE, $FF, $DB, $FF, $FF, $BD, $99, $C3, $66, $3C, $18, $3C, $66, $C3, $C3

; --- RELLENO CRÍTICO PARA ROM DE 16KB ---
    org $7FFF
    db 0