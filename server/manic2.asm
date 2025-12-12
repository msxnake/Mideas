
; =============================================================================
; MANIC MINER CLON - PANTALLA 1 - PARA COMPILADOR GLASS
; =============================================================================
;
; PARA COMPILAR:
; java -jar glass.jar -I . -o manic.bin manic.asm
;
; PARA EJECUTAR EN MSX (desde MSX-DOS):
; bload"manic.bin",r
;
; =============================================================================

; --- Constantes de la BIOS y VDP -------------------------------------------
CHPUT       equ $00A2        ; Escribe un carácter en la pantalla
INITXT      equ $006C        ; Inicializa modo SCREEN 0
INIT32      equ $006C        ; Inicializa modo SCREEN 2
WRTVDP      equ $0047        ; Escribe un byte en un registro del VDP
SNSMAT      equ $0142        ; Lee el estado del teclado
FREKV       equ $0096        ; Frecuencia del VDP (50/60 Hz)

; --- Direcciones de VRAM (definidas por los registros del VDP) -------------
PATTERN_TABLE    equ $0000   ; Tabla de patrones de tiles (8x8)
COLOR_TABLE      equ $0800   ; Tabla de colores de tiles
NAME_TABLE       equ $0900   ; Tabla de nombres (el mapa de pantalla)
SPRITE_ATTR_TABLE equ $1B00 ; Tabla de atributos de sprites
SPRITE_PATT_TABLE equ $3800  ; Tabla de patrones de sprites (16x16)

; --- Variables en RAM -------------------------------------------------------
        
	org #4000       ; Dirección de carga estándar para programas en RAM
	    db "AB"         ; ID ROM
    dw INICIO         ; Dirección inicio
    dw 0,0,0,0,0,0  ; Reservado


; Variables del juego
jugador_x:      ds 1  ; Posición X del jugador (0-255)
jugador_y:      ds 1  ; Posición Y del jugador (0-191)
velocidad_y:    ds 1  ; Velocidad vertical del jugador (para gravedad/salto)
en_el_suelo:    ds 1  ; Flag (0=no, 1=sí)

; Estructura de atributos del sprite 0 (Willy)
sprite_willy_y: ds 1
sprite_willy_x: ds 1
sprite_willy_patron: ds 1
sprite_willy_color: ds 1

; --- Programa Principal ------------------------------------------------------
INICIO:
        ; Desactivar la pantalla para cargar datos sin parpadeos
        ld a, %00000000          ; Registro 1: Desactivar pantalla y sprites
        ld c, 1
        call WRTVDP

        ; Configurar los registros del VDP para el SCREEN 2
        ; R0: Mode 2, M5=1
        ld a, %00000010 | %10000000 ; Bit 7 y 6 para indicar el registro 0
        ld c, 0
        call WRTVDP

        ; R1: Activar pantalla, sprites, modo 16x16
        ld a, %11000010 | %10000001 ; Bit 7 y 6 para el registro 1
        ld c, 1
        call WRTVDP

        ; R2: Pattern Table en $0000
        ld a, %00000000 | %10000010
        ld c, 2
        call WRTVDP

        ; R3: Color Table en $0800
        ld a, %00000011 | %10000011
        ld c, 3
        call WRTVDP

        ; R4: Name Table en $0900
        ld a, %00000010 | %10000100
        ld c, 4
        call WRTVDP

        ; R5: Sprite Attribute Table en $1B00
        ld a, %00110110 | %10000101
        ld c, 5
        call WRTVDP

        ; R6: Sprite Pattern Table en $3800
        ld a, %00000111 | %10000110
        ld c, 6
        call WRTVDP

        ; R7: Color de borde (negro) y color de texto (blanco)
        ld a, %00010001 | %10000111
        ld c, 7
        call WRTVDP

        ; Cargar todos los datos en VRAM
        call CARGA_TILES
        call CARGA_MAPA
        call CARGA_SPRITES
        call INICIA_JUGADOR

        ; Activar la pantalla
        ld a, %11000010 | %10000001
        ld c, 1
        call WRTVDP

; --- Bucle Principal del Juego ---------------------------------------------
BUCLE_PRINCIPAL:
        halt                    ; Esperar a la interrupción del VDP (VBlank, 50/60 Hz)

        call LEE_TECLADO        ; Leer entrada del jugador
        call ACTUALIZA_JUGADOR  ; Aplicar física y movimiento
        call PINTA_SPRITES      ; Actualizar la posición de los sprites en VRAM
        ; call COMPRUEBA_COLISIONES ; Aquí irían otras colisiones (objetos, enemigos)

        jp BUCLE_PRINCIPAL

; =============================================================================
; RUTINAS
; =============================================================================

; --- Escribe un bloque de datos en la VRAM -----------------------------------
; Entrada: HL = Origen de los datos en RAM
;          DE = Destino en la VRAM
;          BC = Número de bytes a escribir
ESCRIBE_VRAM:
        ld a, e
        out ($99), a           ; Enviar la parte baja de la dirección a VRAM
        ld a, d
        or $40                 ; Bit 6 = 1 para modo escritura
        out ($99), a           ; Enviar la parte alta de la dirección

        .loop:
        ld a, (hl)             ; Leer byte de RAM
        out ($98), a           ; Escribir byte en VRAM
        inc hl
        dec bc
        ld a, b
        or c
        jr nz, .loop
        ret

; --- Carga los patrones y colores de los tiles -------------------------------
CARGA_TILES:
        ld hl, TILE_PATRONES
        ld de, PATTERN_TABLE
        ld bc, NUM_TILES * 8   ; 8 bytes por patrón
        call ESCRIBE_VRAM

        ld hl, TILE_COLORES
        ld de, COLOR_TABLE
        ld bc, NUM_TILES       ; 1 byte por color
        call ESCRIBE_VRAM
        ret

; --- Carga el mapa de la pantalla -------------------------------------------
CARGA_MAPA:
        ld hl, MAPA_PANTALLA_1
        ld de, NAME_TABLE
        ld bc, 32 * 24         ; 32x24 tiles
        call ESCRIBE_VRAM
        ret

; --- Carga los patrones de los sprites --------------------------------------
CARGA_SPRITES:
        ld hl, SPRITE_WILLY_PATRON
        ld de, SPRITE_PATT_TABLE
        ld bc, 32              ; 32 bytes para un sprite de 16x16
        call ESCRIBE_VRAM
        ret

; --- Inicializa la posición y estado del jugador -----------------------------
INICIA_JUGADOR:
        ld a, 120              ; Posición X inicial
        ld (jugador_x), a
        ld a, 150              ; Posición Y inicial
        ld (jugador_y), a
        ld a, 0                ; Velocidad Y inicial
        ld (velocidad_y), a
        ld a, 0                ; No está en el suelo (caerá al inicio)
        ld (en_el_suelo), a
        ret

; --- Lee el teclado y actualiza flags de movimiento -------------------------
LEE_TECLADO:
        ; Fila 8 del teclado: Cursor (izq, der, arriba, abajo, espacio)
        ld a, 8
        call SNSMAT            ; A = estado de la fila
        ld c, a                ; Guardamos el estado en C

        ; Comprobar tecla Derecha (bit 0)
        bit 0, c
        jr nz, .no_derecha
        ; Si está pulsada, mover a la derecha
        ld a, (jugador_x)
        inc a
        cp 255-16              ; Límite derecho de la pantalla
        jr nz, .guarda_x
        ld a, 255-16
        .guarda_x:
        ld (jugador_x), a
        .no_derecha:

        ; Comprobar tecla Izquierda (bit 1)
        bit 1, c
        jr nz, .no_izquierda
        ; Si está pulsada, mover a la izquierda
        ld a, (jugador_x)
        dec a
        cp 0                   ; Límite izquierdo
        jr nc, .guarda_x2
        ld a, 0
        .guarda_x2:
        ld (jugador_x), a
        .no_izquierda:

        ; Comprobar tecla Arriba (bit 3) para saltar
        bit 3, c
        jr nz, .no_salto
        ld a, (en_el_suelo)
        cp 1
        jr nz, .no_salto       ; Solo puede saltar si está en el suelo
        ld a, -8               ; Velocidad de salto inicial
        ld (velocidad_y), a
        .no_salto:
        ret

; --- Actualiza la lógica del jugador (gravedad, colisión con suelo) ---------
ACTUALIZA_JUGADOR:
        ; 1. Aplicar gravedad
        ld a, (velocidad_y)
        cp 0
        jr z, .comprueba_suelo  ; Si velocidad Y es 0, no hace falta sumar
        inc a                  ; Aceleración de la gravedad
        ld (velocidad_y), a

        ld a, (jugador_y)
        add a, (velocidad_y)   ; Sumar velocidad a la posición Y
        ld (jugador_y), a

        ; 2. Comprobar si hemos tocado el suelo o una plataforma
        .comprueba_suelo:
        ; Obtenemos el tile que está justo debajo de los pies del sprite
        ld a, (jugador_y)
        add a, 16              ; Añadimos la altura del sprite
        ld b, a                ; B = Y en píxeles del pie del sprite
        srl b                  ; Dividimos Y/8 para obtener la fila del tile
        srl b
        srl b

        ld a, (jugador_x)
        add a, 8               ; Usamos el centro del sprite para la comprobación
        ld c, a                ; C = X en píxeles del centro del sprite
        srl c                  ; Dividimos X/8 para obtener la columna del tile
        srl c
        srl c

        ; Ahora BC = (fila, columna) del tile a comprobar
        ; Calculamos la dirección de ese tile en el mapa
        ld h, 0
        ld l, MAPA_PANTALLA_1 & $FF
        ld a, b                ; Fila
        ld d, a                ; D = fila
        ld e, c                ; E = columna
        ; Calculamos offset = fila * 32 + columna
        ld a, d
        add a, a               ; *2
        add a, a               ; *4
        add a, a               ; *8
        add a, a               ; *16
        add a, a               ; *32
        add a, e                ; + columna
        ld e, a                ; DE = offset
        ld d, 0
        add hl, de              ; HL = dirección del tile en el mapa

        ld a, (hl)             ; A = número de tile
        cp TILE_SUELO          ; ¿Es un tile de suelo?
        jr nz, .no_es_suelo

        ; Si es suelo, hemos aterrizado
        ld a, 0
        ld (velocidad_y), a
        ld a, 1
        ld (en_el_suelo), a

        ; Ajustar la Y del jugador para que quede justo encima del tile
        ld a, b                ; Recuperar la fila del tile
        add a, a               ; *8
        add a, a
        add a, a
        sub 16                 ; Restar la altura del sprite
        ld (jugador_y), a
        jr .fin_actualizacion

        .no_es_suelo:
        ld a, 0
        ld (en_el_suelo), a    ; Ya no está en el suelo

        .fin_actualizacion:
        ret

; --- Actualiza los atributos de los sprites en la VRAM ----------------------
PINTA_SPRITES:
        ; Copiamos las coordenadas de nuestro jugador a la estructura de atributos
        ld a, (jugador_y)
        ld (sprite_willy_y), a
        ld a, (jugador_x)
        ld (sprite_willy_x), a

        ; Escribimos los 4 atributos del sprite 0 en la VRAM
        ld hl, sprite_willy_y
        ld de, SPRITE_ATTR_TABLE
        ld bc, 4
        call ESCRIBE_VRAM
        ret

; =============================================================================
; DATOS
; =============================================================================

; --- Definición de Tiles ----------------------------------------------------
TILE_VACIO      equ 0
TILE_SUELO      equ 1
TILE_PARED      equ 2
TILE_OBJETO     equ 3
NUM_TILES       equ 4

; Patrones (diseño de 8x8 píxeles)
TILE_PATRONES:
        db %00000000, %00000000, %00000000, %00000000, %00000000, %00000000, %00000000, %00000000 ; 0: Vacío
        db %11111111, %10000001, %10100101, %10011001, %10100101, %10000001, %10111101, %11111111 ; 1: Ladrillo (suelo)
        db %11111111, %10000001, %10111101, %10100101, %10100101, %10111101, %10000001, %11111111 ; 2: Ladrillo (pared)
        db %00011000, %00111100, %01111110, %01111110, %01111110, %00111100, %00011000, %00000000 ; 3: Objeto (gema)

; Colores (formato: INK1 INK2 BACKGROUND)
TILE_COLORES:
        db %00010000 ; 0: Negro sobre negro (invisible)
        db %11110100 ; 1: Blanco/Azul sobre Negro
        db %11010100 ; 2: Verde/Azul sobre Negro
        db %11101100 ; 3: Blanco/Rojo sobre Negro

; --- Mapa de la Pantalla 1 (32x24 tiles) ------------------------------------
MAPA_PANTALLA_1:
        db TILE_PARED,TILE_PARED,TILE_PARED,TILE_PARED,TILE_PARED,TILE_PARED,TILE_PARED,TILE_PARED,TILE_PARED,TILE_PARED,TILE_PARED,TILE_PARED,TILE_PARED,TILE_PARED,TILE_PARED,TILE_PARED,TILE_PARED,TILE_PARED,TILE_PARED,TILE_PARED,TILE_PARED,TILE_PARED,TILE_PARED,TILE_PARED,TILE_PARED,TILE_PARED,TILE_PARED,TILE_PARED,TILE_PARED,TILE_PARED,TILE_PARED,TILE_PARED
        db TILE_PARED,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_PARED
        db TILE_PARED,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_PARED
        db TILE_PARED,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_PARED
        db TILE_PARED,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_PARED
        db TILE_PARED,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_PARED
        db TILE_PARED,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_PARED
        db TILE_PARED,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_PARED
        db TILE_PARED,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_PARED
        db TILE_PARED,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_PARED
        db TILE_PARED,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_PARED
        db TILE_PARED,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_PARED
        db TILE_PARED,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_PARED
        db TILE_PARED,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_PARED
        db TILE_PARED,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_PARED
        db TILE_PARED,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_PARED
        db TILE_PARED,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_PARED
        db TILE_PARED,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_PARED
        db TILE_PARED,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_PARED
        db TILE_PARED,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_PARED
        db TILE_PARED,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_VACIO,TILE_PARED
        db TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO
        db TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO,TILE_SUELO

; --- Definición del Sprite del Jugador (Willy) -----------------------------
; Sprite de 16x16 píxeles (32 bytes)
SPRITE_WILLY_PATRON:
        db %00011000, %00111100, %01111110, %01111110, %01111110, %01111110, %00111100, %00011000
        db %00011000, %00111100, %01111110, %01111110, %01111110, %01111110, %00111100, %00011000
        db %00011000, %00111100, %01111110, %01111110, %01111110, %01111110, %00111100, %00011000
        db %00011000, %00111100, %01111110, %01111110, %01111110, %01111110, %00111100, %00011000

FIN:
