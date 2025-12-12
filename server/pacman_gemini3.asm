; ==============================================================================
; MINI PACMAN MSX - SCREEN 2 - ROM 16KB
; Compilador: Glass (java -jar glass.jar pacman.asm pacman.rom)
; ==============================================================================

    org 4000h               ; Inicio estándar de cartucho ROM MSX

    ; --------------------------------------------------------------------------
    ; CABECERA ROM MSX
    ; --------------------------------------------------------------------------
    db "AB"                 ; Firma ROM
    dw INIT                 ; Dirección de inicio
    dw 0,0,0,0              ; Reservado

    ; --------------------------------------------------------------------------
    ; CONSTANTES Y BIOS
    ; --------------------------------------------------------------------------
    ; Direcciones BIOS
    ENASLT: equ 0024h       ; Habilitar slot
    LDIRVM: equ 005Ch       ; Block transfer RAM -> VRAM
    CHGMOD: equ 005Fh       ; Cambiar modo de pantalla
    WRTVDP: equ 0047h       ; Escribir en registro VDP
    DISSCR: equ 0041h       ; Desactivar pantalla
    ENASCR: equ 0044h       ; Activar pantalla
    GTSTCK: equ 00D5h       ; Leer joystick/cursores
    CALSLT: equ 001Ch       ; Llamada inter-slot

    ; Hooks y Variables del Sistema
    H_TIMI: equ 0FD9Fh      ; Hook de interrupción de timer (60Hz/50Hz)
    FORCLR: equ 0F3E9h      ; Color de primer plano
    BAKCLR: equ 0F3EAh      ; Color de fondo
    BDRCLR: equ 0F3EBh      ; Color de borde

    ; Direcciones VRAM (Screen 2)
    PATT_TBL: equ 0000h     ; Tabla de patrones (Tiles)
    COLOR_TBL: equ 2000h    ; Tabla de colores
    NAME_TBL: equ 1800h     ; Tabla de nombres (Mapa)
    SPR_ATTR: equ 1B00h     ; Atributos de Sprites
    SPR_PATT: equ 3800h     ; Patrones de Sprites

    ; Variables en RAM (Usamos area de usuario a partir de C000 o similar)
    ; Para simplificar en ROM, usaremos un área segura de la RAM del sistema
    ; o definiremos variables relativas si fuera una aplicación RAM.
    ; Aquí usaremos direcciones fijas en RAM alta libre.
    VAR_PX:     equ 0E000h  ; Posición X del jugador
    VAR_PY:     equ 0E001h  ; Posición Y del jugador
    VAR_FRAME:  equ 0E002h  ; Contador para animación

; ==============================================================================
; PROGRAMA PRINCIPAL
; ==============================================================================
INIT:
    di                      ; Deshabilitar interrupciones durante setup
    im 1                    ; Modo de interrupción Z80
    ld sp, 0F380h           ; Inicializar Stack pointer (seguridad)

    ; 1. Configurar Pantalla (Screen 2)
    ld a, 15                ; Color blanco
    ld (FORCLR), a
    ld a, 1                 ; Fondo negro
    ld (BAKCLR), a
    ld (BDRCLR), a
    
    call DISSCR             ; Apagar pantalla para dibujar rápido

    ; Configurar registros VDP manualmente para asegurar Screen 2 con Sprites 16x16
    ; R0: M4=0, M3=0
    ld b, 00000010b
    ld c, 0
    call WRTVDP
    ; R1: Pantalla activa, Int activa, Sprites 16x16 (bit 1=1), Mag=0
    ld b, 11100010b         ; Bit 6=1 (Screen), Bit 5=1 (Int), Bit 1=1 (16x16)
    ld c, 1
    call WRTVDP
    ; R2: Name Table 1800h (06h * 400h)
    ld b, 06h
    ld c, 2
    call WRTVDP
    ; R3: Color Table 2000h (FF = mascara, 80h = base) -> Standard MSX1 Sc2 layout
    ld b, 80h               ; Base en 2000h
    ld c, 3
    call WRTVDP         
    ; R4: Pattern Gen 0000h
    ld b, 00h
    ld c, 4
    call WRTVDP
    ; R5: Sprite Attr 1B00h (36h * 80h)
    ld b, 36h
    ld c, 5
    call WRTVDP
    ; R6: Sprite Pattern 3800h (07h * 800h)
    ld b, 07h
    ld c, 6
    call WRTVDP

    ; 2. Cargar Gráficos (Tiles)
    ; Copiar patrones de tiles a los 3 bancos (0000, 0800, 1000)
    ld hl, TILE_DATA
    ld de, PATT_TBL         ; Banco 1
    ld bc, 16               ; 2 tiles * 8 bytes
    call LDIRVM
    ld hl, TILE_DATA
    ld de, PATT_TBL + 0800h ; Banco 2
    ld bc, 16
    call LDIRVM
    ld hl, TILE_DATA
    ld de, PATT_TBL + 1000h ; Banco 3
    ld bc, 16
    call LDIRVM

    ; 3. Cargar Colores de Tiles
    ; Copiar colores a los 3 bancos
    ld hl, COLOR_DATA
    ld de, COLOR_TBL
    ld bc, 16
    call LDIRVM
    ld hl, COLOR_DATA
    ld de, COLOR_TBL + 0800h
    ld bc, 16
    call LDIRVM
    ld hl, COLOR_DATA
    ld de, COLOR_TBL + 1000h
    ld bc, 16
    call LDIRVM

    ; 4. Cargar Sprites (Pacman)
    ld hl, SPRITE_DATA
    ld de, SPR_PATT
    ld bc, 32               ; 32 bytes para 16x16
    call LDIRVM

    ; 5. Dibujar Mapa (Laberinto)
    call DRAW_MAP

    ; 6. Inicializar Variables de Juego
    ld a, 16                ; X inicial (pixel)
    ld (VAR_PX), a
    ld a, 16                ; Y inicial (pixel)
    ld (VAR_PY), a
    xor a
    ld (VAR_FRAME), a

    ; 7. Instalar Hook en H.TIMI
    ; Redirigimos la interrupción a nuestra rutina GAME_LOOP
    ld hl, H_TIMI
    ld a, 0C3h              ; Opcode JP
    ld (hl), a
    inc hl
    ld de, GAME_INTERRUPT
    ld (hl), e
    inc hl
    ld (hl), d

    call ENASCR             ; Encender pantalla
    ei                      ; Habilitar interrupciones

    ; 8. Bucle Infinito (Idle)
    ; Todo el trabajo lo hace la interrupción
IDLE:
    halt
    jp IDLE

; ==============================================================================
; RUTINA DE INTERRUPCIÓN (HOOK H.TIMI) - 60Hz Lógica
; ==============================================================================
GAME_INTERRUPT:
    push af
    push bc
    push de
    push hl
    push ix
    push iy

    ; --- 1. Leer Controles ---
    xor a                   ; Joystick 0 (Cursores)
    call GTSTCK
    ; A contiene la dirección (0=nada, 1=Arriba, 3=Der, 5=Abajo, 7=Izq)
    
    ld b, a                 ; Guardar dirección en B
    
    ld a, (VAR_PX)
    ld d, a                 ; D = X actual
    ld a, (VAR_PY)
    ld e, a                 ; E = Y actual

    ; --- 2. Lógica de Movimiento + Colisión ---
    
    ld a, b                 ; Recuperar dirección

    cp 3                    ; Derecha?
    jp z, MOVE_RIGHT
    cp 7                    ; Izquierda?
    jp z, MOVE_LEFT
    cp 1                    ; Arriba?
    jp z, MOVE_UP
    cp 5                    ; Abajo?
    jp z, MOVE_DOWN
    jp UPDATE_SPRITE        ; Sin movimiento

MOVE_RIGHT:
    inc d
    call CHECK_COLLISION    ; Verifica si D,E es válido
    jp c, UPDATE_SPRITE     ; Si hay colisión (Carry set), no actualizar
    ld a, d
    ld (VAR_PX), a
    jp UPDATE_SPRITE

MOVE_LEFT:
    dec d
    call CHECK_COLLISION
    jp c, UPDATE_SPRITE
    ld a, d
    ld (VAR_PX), a
    jp UPDATE_SPRITE

MOVE_UP:
    dec e
    call CHECK_COLLISION
    jp c, UPDATE_SPRITE
    ld a, e
    ld (VAR_PY), a
    jp UPDATE_SPRITE

MOVE_DOWN:
    inc e
    call CHECK_COLLISION
    jp c, UPDATE_SPRITE
    ld a, e
    ld (VAR_PY), a
    jp UPDATE_SPRITE

    ; --- 3. Actualizar Sprite en VRAM ---
UPDATE_SPRITE:
    ; Sprite Attribute Table: Y, X, Pattern, Color
    
    ; Calcular dirección en RAM para enviar a VDP (o enviar directo byte a byte)
    ; Enviamos directo:
    
    ; Byte 0: Y
    ld a, (VAR_PY)
    dec a                   ; Ajuste MSX (Y-1)
    ld b, a                 ; Valor a escribir
    ld hl, SPR_ATTR         ; Dirección destino
    call WRITE_VRAM_BYTE

    ; Byte 1: X
    ld a, (VAR_PX)
    ld b, a
    ld hl, SPR_ATTR + 1
    call WRITE_VRAM_BYTE

    ; Byte 2: Pattern Index (0 para el primer sprite 16x16)
    ld b, 0
    ld hl, SPR_ATTR + 2
    call WRITE_VRAM_BYTE

    ; Byte 3: Color (Amarillo = 10, Bit 7=0)
    ld b, 10                ; Amarillo oscuro
    ld hl, SPR_ATTR + 3
    call WRITE_VRAM_BYTE

    ; --- Fin de interrupción ---
    pop iy
    pop ix
    pop hl
    pop de
    pop bc
    pop af
    ret                     ; Retorno del hook

; ==============================================================================
; RUTINAS AUXILIARES
; ==============================================================================

; --- CHECK_COLLISION ---
; Entrada: D = Nuevo X, E = Nuevo Y
; Salida: Carry Flag = 1 si hay colisión, 0 si libre
; Lógica: Pacman es 16x16. Verificamos las 4 esquinas.
; El mapa está en RAM_MAP. Tile 1 = Pared.
CHECK_COLLISION:
    push hl
    push bc
    push de ; Guardar coords originales

    ; Verificar Esquina Superior Izquierda (X, Y)
    ld b, d                 ; X
    ld c, e                 ; Y
    call GET_TILE_AT_PIXEL
    cp 1                    ; Es pared?
    jp z, COLLISION_FOUND

    ; Verificar Esquina Superior Derecha (X+15, Y)
    ld a, d
    add a, 15
    ld b, a
    ld c, e
    call GET_TILE_AT_PIXEL
    cp 1
    jp z, COLLISION_FOUND

    ; Verificar Esquina Inferior Izquierda (X, Y+15)
    ld b, d
    ld a, e
    add a, 15
    ld c, a
    call GET_TILE_AT_PIXEL
    cp 1
    jp z, COLLISION_FOUND

    ; Verificar Esquina Inferior Derecha (X+15, Y+15)
    ld a, d
    add a, 15
    ld b, a
    ld a, e
    add a, 15
    ld c, a
    call GET_TILE_AT_PIXEL
    cp 1
    jp z, COLLISION_FOUND

    ; No hay colisión
    pop de
    pop bc
    pop hl
    or a                    ; Clear Carry
    ret

COLLISION_FOUND:
    pop de
    pop bc
    pop hl
    scf                     ; Set Carry
    ret

; --- GET_TILE_AT_PIXEL ---
; Entrada: B = X pixel, C = Y pixel
; Salida: A = ID del tile en el mapa
GET_TILE_AT_PIXEL:
    ; Columna = X / 8
    ld a, b
    srl a
    srl a
    srl a
    ld b, a                 ; B = Columna (0-31)

    ; Fila = Y / 8
    ld a, c
    srl a
    srl a
    srl a                   ; A = Fila (0-23)
    
    ; Dirección = RAM_MAP + (Fila * 32) + Columna
    ; Cálculo HL = RAM_MAP + (A * 32) + B
    ld hl, RAM_MAP
    ld d, 0
    ld e, a                 ; E = Fila
    
    ; Multiplicar E * 32 es shift left 5 veces
    sla e
    rl d
    sla e
    rl d
    sla e
    rl d
    sla e
    rl d
    sla e
    rl d                    ; DE = Fila * 32
    
    add hl, de
    ld e, b                 ; E = Columna
    ld d, 0
    add hl, de              ; HL = Dirección final en mapa
    
    ld a, (hl)              ; Leer tile
    ret

; --- WRITE_VRAM_BYTE ---
; Escribe el valor B en la dirección VRAM HL
; Método rápido usando puertos
WRITE_VRAM_BYTE:
    push af
    ld a, l
    out (99h), a            ; Dirección baja
    ld a, h
    or 40h                  ; Bit 6 set para escritura
    out (99h), a            ; Dirección alta
    ld a, b
    out (98h), a            ; Dato
    pop af
    ret

; --- DRAW_MAP ---
; Dibuja el mapa en VRAM y lo guarda en RAM para colisiones
DRAW_MAP:
    ld hl, MAP_DESIGN       ; Puntero al diseño comprimido o raw
    ld de, RAM_MAP          ; Puntero a la copia en RAM
    ld ix, NAME_TBL         ; Puntero a VRAM inicio

    ; Dibujamos 24 filas de 32 columnas
    ld b, 24                ; Filas
ROW_LOOP:
    push bc
    ld b, 32                ; Columnas
COL_LOOP:
    ld a, (hl)              ; Leer tile del diseño
    
    ; Guardar en RAM BUFFER para colisiones
    ld (de), a
    inc de

    ; Guardar en VRAM (necesitamos setup de dirección para cada byte o usar LDIRVM por bloques)
    ; Para velocidad en init, usamos una función helper simple
    push af
    push hl
    push de
    push bc
        
        ; Calcular dirección VRAM en IX
        push ix
        pop hl              ; HL = dir VRAM actual
        ld a, (esp_guardado_a) ; Hack para recuperar A sin sacar de pila real? Mejor pasarlo en reg.
        ; Simplificación: usar LDIRVM es lento byte a byte.
        ; Mejor: Escribimos todo el buffer RAM a VRAM al final.
    pop bc
    pop de
    pop hl
    pop af
    
    inc hl
    djnz COL_LOOP
    pop bc
    djnz ROW_LOOP

    ; Volcar todo RAM_MAP a VRAM
    ld hl, RAM_MAP
    ld de, NAME_TBL
    ld bc, 768              ; 32x24 bytes
    call LDIRVM
    ret

; ==============================================================================
; DATOS GRÁFICOS
; ==============================================================================

; --- Tiles (8x8) ---
; Tile 0: Vacío, Tile 1: Muro (Ladrillo azul)
TILE_DATA:
    ; Tile 0 (Vacío / Negro)
    db 00h, 00h, 00h, 00h, 00h, 00h, 00h, 00h
    ; Tile 1 (Muro - Doble línea)
    db 0FFh, 81h, 81h, 81h, 81h, 81h, 81h, 0FFh

COLOR_DATA:
    ; Color Tile 0
    db 0F0h, 0F0h, 0F0h, 0F0h, 0F0h, 0F0h, 0F0h, 0F0h ; Blanco sobre transp
    ; Color Tile 1 (Azul medio 05 sobre azul oscuro 04)
    db 54h, 54h, 54h, 54h, 54h, 54h, 54h, 54h

; --- Sprite (16x16) ---
; Pacman (Redondo)
SPRITE_DATA:
    ; Izquierda-Arriba (8x8)
    db 00h, 07h, 1Fh, 3Fh, 7Fh, 7Fh, 7Fh, 7Fh
    ; Izquierda-Abajo
    db 7Fh, 7Fh, 7Fh, 7Fh, 3Fh, 1Fh, 07h, 00h
    ; Derecha-Arriba
    db 00h, 0E0h, 0F8h, 0FCh, 0FEh, 0FEh, 0FEh, 0FEh
    ; Derecha-Abajo
    db 0FEh, 0FEh, 0FEh, 0FCh, 0F8h, 0E0h, 00h, 00h

; --- Mapa del Nivel (32x24) ---
; 1 = Muro, 0 = Pasillo. Pasillos de 2 de ancho.
MAP_DESIGN:
    ; Fila 0
    db 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
    ; Fila 1
    db 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    ; Fila 2
    db 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    ; Fila 3
    db 1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,1,1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,1
    ; Fila 4
    db 1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,1,1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,1
    ; Fila 5
    db 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    ; Fila 6
    db 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    ; Fila 7
    db 1,0,0,1,1,1,1,0,0,1,1,0,0,1,1,1,1,1,1,0,0,1,1,0,0,1,1,1,1,0,0,1
    ; Fila 8
    db 1,0,0,1,1,1,1,0,0,1,1,0,0,1,1,1,1,1,1,0,0,1,1,0,0,1,1,1,1,0,0,1
    ; Fila 9
    db 1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1
    ; Fila 10
    db 1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1
    ; Fila 11
    db 1,1,1,1,1,1,1,0,0,1,1,1,1,0,0,1,1,0,0,1,1,1,1,0,0,1,1,1,1,1,1,1
    ; Fila 12
    db 1,1,1,1,1,1,1,0,0,1,1,1,1,0,0,0,0,0,0,1,1,1,1,0,0,1,1,1,1,1,1,1
    ; Fila 13
    db 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    ; Fila 14
    db 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    ; Fila 15
    db 1,0,0,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,0,0,1
    ; Fila 16
    db 1,0,0,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,0,0,1
    ; Fila 17
    db 1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1
    ; Fila 18
    db 1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1
    ; Fila 19
    db 1,0,0,1,0,0,0,0,0,1,1,1,1,0,0,1,1,0,0,1,1,1,1,0,0,0,0,0,1,0,0,1
    ; Fila 20
    db 1,0,0,1,0,0,0,0,0,1,1,1,1,0,0,1,1,0,0,1,1,1,1,0,0,0,0,0,1,0,0,1
    ; Fila 21
    db 1,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,1
    ; Fila 22
    db 1,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,1
    ; Fila 23
    db 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1

    ; Área de RAM para el Mapa (buffer de colisiones)
    ; Se ubica después del código en la ROM, pero se usa para definir su ubicación en RAM
RAM_MAP: equ 0C000h     ; Usamos RAM usuario 48K-64K o 32K alta