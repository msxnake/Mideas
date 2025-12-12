


; ============================================
; MANIC MINER MSX1 - PANTALLA 1
; Clon de la pantalla "Central Cavern"
; Compilador: Glass.jar
; ============================================

    org 4000h
    
; ============================================
; CABECERA ROM MSX
; ============================================
    db "AB"             ; ID ROM
    dw START            ; Inicio
    dw 0,0,0,0,0,0      ; Reservado
    
; ============================================
; CONSTANTES BIOS
; ============================================
CHGMOD:     equ 005Fh   ; Cambiar modo de pantalla
LDIRVM:     equ 005Ch   ; Copiar RAM a VRAM
WRTVRM:     equ 004Dh   ; Escribir byte a VRAM
RDVRM:      equ 004Ah   ; Leer byte de VRAM
FILVRM:     equ 0056h   ; Rellenar VRAM
GTSTCK:     equ 00D5h   ; Leer joystick
GTTRIG:     equ 00D8h   ; Leer trigger
ENASPR:     equ 0069h   ; Habilitar sprites
PUTSPR:     equ 006Ch   ; Poner sprite en VRAM

; ============================================
; DIRECCIONES VRAM SCREEN 2
; ============================================
PATTERN_TABLE:   equ 0000h  ; Tabla de patrones
COLOR_TABLE:     equ 2000h  ; Tabla de colores
NAME_TABLE:      equ 1800h  ; Tabla de nombres
SPRITE_PATTERNS: equ 3800h  ; Patrones de sprites
SPRITE_ATTRIB:   equ 1B00h  ; Atributos de sprites

; ============================================
; CONSTANTES DEL JUEGO
; ============================================
SCREEN_WIDTH:    equ 32
SCREEN_HEIGHT:   equ 24
TILE_SIZE:       equ 8
SPRITE_SIZE:     equ 16
GRAVITY:         equ 2
JUMP_STRENGTH:   equ -12
PLAYER_SPEED:    equ 3

; Estados del jugador
PLAYER_GROUNDED: equ 0
PLAYER_JUMPING:  equ 1
PLAYER_FALLING:  equ 2

; Tiles
TILE_EMPTY:      equ 0
TILE_BRICK:      equ 1
TILE_PLATFORM:   equ 2
TILE_LADDER:     equ 3
TILE_EARTH:      equ 4
TILE_DIAMOND:    equ 5
TILE_SPIKES:     equ 6
TILE_DOOR:       equ 7
TILE_CONVEYOR_L: equ 8    ; Cinta transportadora izquierda
TILE_CONVEYOR_R: equ 9    ; Cinta transportadora derecha

; ============================================
; VARIABLES DEL SISTEMA
; ============================================
    org 0C000h

player_x:        db 100        ; Posición X (píxeles)
player_y:        db 152        ; Posición Y (píxeles)
player_vx:       db 0          ; Velocidad X
player_vy:       db 0          ; Velocidad Y
player_state:    db 0          ; Estado del jugador
player_dir:      db 1          ; Dirección: 0=izq, 1=der
player_anim:     db 0          ; Animación actual
player_frame:    db 0          ; Frame de animación
player_airborne: db 0          ; En el aire?

diamonds:        db 0          ; Diamantes recolectados
diamonds_total:  db 5          ; Diamantes en el nivel
lives:           db 3          ; Vidas
score:           dw 0          ; Puntuación

joy_state:       db 0          ; Estado del joystick
trig_state:      db 0          ; Estado del trigger
frame_counter:   db 0          ; Contador de frames

level_data:      dw 0          ; Puntero a datos del nivel

; Buffer temporal para cálculos
temp1:           db 0
temp2:           db 0
temp3:           db 0
temp4:           db 0

; ============================================
; PROGRAMA PRINCIPAL
; ============================================
	org 4010h
START:
    di
    ld sp, 0F380h
    ei
    
    ; Inicializar SCREEN 2
    call INIT_SCREEN2
    
    ; Cargar gráficos
    call LOAD_TILES
    call LOAD_COLORS
    call LOAD_SPRITES
    
    ; Inicializar juego
    call INIT_GAME
    
    ; Bucle principal
MAIN_LOOP:
    ; Esperar VSYNC
    halt
    
    ; Leer controles
    call READ_INPUT
    
    ; Actualizar jugador
    call UPDATE_PLAYER
    
    ; Actualizar animaciones
    call UPDATE_ANIMATIONS
    
    ; Comprobar colisiones
    call CHECK_COLLISIONS
    
    ; Actualizar pantalla
    call UPDATE_DISPLAY
    
    ; Comprobar fin de nivel
    call CHECK_LEVEL_COMPLETE
    
    jp MAIN_LOOP

; ============================================
; INICIALIZAR SCREEN 2
; ============================================
INIT_SCREEN2:
    ; Cambiar a SCREEN 2
    ld a, 2
    call CHGMOD
    
    ; Habilitar sprites 16x16
    ld a, 2
    call ENASPR
    
    ; Limpiar tablas de nombres
    ld hl, NAME_TABLE
    ld bc, 32*24
    ld a, TILE_EMPTY
    call FILVRM
    
    ret

; ============================================
; CARGAR TILES EN VRAM
; ============================================
LOAD_TILES:
    ; Cargar patrones de tiles
    ld hl, TILE_PATTERNS
    ld de, PATTERN_TABLE
    ld bc, 256 * 8      ; 32 tiles * 8 bytes cada uno
    call LDIRVM
    ret

; ============================================
; CARGAR COLORES DE TILES
; ============================================
LOAD_COLORS:
    ; Cargar colores de tiles
    ld hl, TILE_COLORS
    ld de, COLOR_TABLE
    ld bc, 256 * 8      ; 32 tiles * 8 bytes cada uno
    call LDIRVM
    ret

; ============================================
; CARGAR SPRITES
; ============================================
LOAD_SPRITES:
    ; Cargar patrones de sprites
    ld hl, SPRITE_DATA
    ld de, SPRITE_PATTERNS
    ld bc, 8 * 32       ; 8 sprites * 32 bytes cada uno
    call LDIRVM
    ret

; ============================================
; INICIALIZAR JUEGO
; ============================================
INIT_GAME:
    ; Posición inicial del jugador
    ld a, 32
    ld (player_x), a
    ld a, 152
    ld (player_y), a
    
    ; Estado inicial
    xor a
    ld (player_vx), a
    ld (player_vy), a
    ld (player_state), a
    ld a, 1
    ld (player_dir), a
    
    ; Reset contadores
    xor a
    ld (diamonds), a
    ld (score), a
    ld (score+1), a
    
    ; Vidas
    ld a, 3
    ld (lives), a
    
    ; Dibujar nivel
    call DRAW_LEVEL1
    
    ; Actualizar HUD
    call UPDATE_HUD
    
    ret

; ============================================
; DIBUJAR NIVEL 1 (CENTRAL CAVERN)
; ============================================
DRAW_LEVEL1:
    ld hl, LEVEL1_MAP
    ld de, NAME_TABLE
    ld b, SCREEN_HEIGHT
    
DRAW_ROW:
    push bc
    ld b, SCREEN_WIDTH
    
DRAW_COLUMN:
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
    djnz DRAW_COLUMN
    
    pop bc
    djnz DRAW_ROW
    
    ret

; ============================================
; LEER INPUT
; ============================================
READ_INPUT:
    ; Leer joystick 1
    ld a, 0
    call GTSTCK
    ld (joy_state), a
    
    ; Leer trigger 1
    ld a, 0
    call GTTRIG
    ld (trig_state), a
    
    ret

; ============================================
; ACTUALIZAR JUGADOR
; ============================================
UPDATE_PLAYER:
    ; Procesar movimiento horizontal
    call PROCESS_HORIZONTAL_MOVEMENT
    
    ; Procesar salto
    call PROCESS_JUMP
    
    ; Aplicar gravedad
    call APPLY_GRAVITY
    
    ; Aplicar velocidad vertical
    call APPLY_VERTICAL_MOVEMENT
    
    ; Comprobar colisiones con el suelo
    call CHECK_GROUND_COLLISION
    
    ; Comprobar colisiones laterales
    call CHECK_WALL_COLLISION
    
    ret

; ============================================
; PROCESAR MOVIMIENTO HORIZONTAL
; ============================================
PROCESS_HORIZONTAL_MOVEMENT:
    ld a, (joy_state)
    
    ; Izquierda (7,6,5)
    cp 7
    jr z, .MOVE_LEFT
    cp 6
    jr z, .MOVE_LEFT
    cp 5
    jr z, .MOVE_LEFT
    
    ; Derecha (1,2,3)
    cp 1
    jr z, .MOVE_RIGHT
    cp 2
    jr z, .MOVE_RIGHT
    cp 3
    jr z, .MOVE_RIGHT
    
    ; Sin movimiento
    xor a
    ld (player_vx), a
    ret
    
.MOVE_LEFT:
    ld a, -PLAYER_SPEED
    ld (player_vx), a
    xor a
    ld (player_dir), a
    ret
    
.MOVE_RIGHT:
    ld a, PLAYER_SPEED
    ld (player_vx), a
    ld a, 1
    ld (player_dir), a
    ret

; ============================================
; PROCESAR SALTO
; ============================================
PROCESS_JUMP:
    ld a, (trig_state)
    or a
    ret z
    
    ; Solo saltar si está en el suelo
    ld a, (player_state)
    cp PLAYER_GROUNDED
    ret nz
    
    ; Aplicar fuerza de salto
    ld a, JUMP_STRENGTH
    ld (player_vy), a
    ld a, PLAYER_JUMPING
    ld (player_state), a
    
    ret

; ============================================
; APLICAR GRAVEDAD
; ============================================
APPLY_GRAVITY:
    ; Solo aplicar gravedad si no está en el suelo
    ld a, (player_state)
    cp PLAYER_GROUNDED
    ret z
    
    ; Aplicar gravedad
    ld a, (player_vy)
    add a, GRAVITY
    ld (player_vy), a
    
    ; Limitar velocidad de caída máxima
    cp 8
    jr c, .DONE
    ld a, 8
    ld (player_vy), a
    
.DONE:
    ret

; ============================================
; APLICAR MOVIMIENTO VERTICAL
; ============================================
APPLY_VERTICAL_MOVEMENT:
    ld a, (player_vy)
    or a
    ret z
    
    ld b, a
    ld a, (player_y)
    add a, b
    ld (player_y), a
    
    ; Actualizar estado
    ld a, (player_vy)
    bit 7, a           ; Comprobar si es negativo (saltando)
    jr nz, .JUMPING
    
    ; Está cayendo
    ld a, PLAYER_FALLING
    ld (player_state), a
    ret
    
.JUMPING:
    ld a, PLAYER_JUMPING
    ld (player_state), a
    ret

; ============================================
; COMPROBAR COLISIÓN CON EL SUELO
; ============================================
CHECK_GROUND_COLLISION:
    ; Obtener posición de los pies
    ld a, (player_y)
    add a, SPRITE_SIZE - 1
    ld b, a            ; B = Y de los pies
    
    ; Obtener posición X del centro
    ld a, (player_x)
    add a, SPRITE_SIZE / 2
    ld c, a            ; C = X del centro
    
    ; Convertir a coordenadas de tile
    call PIXEL_TO_TILE
    ld (temp1), hl     ; Guardar tile bajo los pies
    
    ; Comprobar si es un tile sólido
    call IS_SOLID_TILE
    jr c, .ON_GROUND
    
    ; Comprobar tile a la izquierda
    ld hl, (temp1)
    dec l
    call IS_SOLID_TILE
    jr c, .ON_GROUND
    
    ; Comprobar tile a la derecha
    ld hl, (temp1)
    inc l
    call IS_SOLID_TILE
    jr c, .ON_GROUND
    
    ; No está en el suelo
    ret
    
.ON_GROUND:
    ; Alinear al suelo
    ld a, (player_y)
    and 0F8h           ; Alinear a múltiplo de 8
    ld (player_y), a
    
    ; Resetear velocidad vertical
    xor a
    ld (player_vy), a
    
    ; Cambiar estado
    ld a, PLAYER_GROUNDED
    ld (player_state), a
    
    ret

; ============================================
; COMPROBAR COLISIÓN CON PAREDES
; ============================================
CHECK_WALL_COLLISION:
    ; Solo comprobar si se está moviendo
    ld a, (player_vx)
    or a
    ret z
    
    ; Comprobar dirección
    bit 7, a
    jr nz, .CHECK_LEFT
    
    ; Comprobar colisión derecha
    ld a, (player_x)
    add a, SPRITE_SIZE - 1
    ld c, a
    ld a, (player_y)
    add a, 8
    ld b, a
    call PIXEL_TO_TILE
    call IS_SOLID_TILE
    ret nc
    
    ; Detener movimiento
    xor a
    ld (player_vx), a
    ret
    
.CHECK_LEFT:
    ; Comprobar colisión izquierda
    ld a, (player_x)
    ld c, a
    ld a, (player_y)
    add a, 8
    ld b, a
    call PIXEL_TO_TILE
    call IS_SOLID_TILE
    ret nc
    
    ; Detener movimiento
    xor a
    ld (player_vx), a
    ret

; ============================================
; COMPROBAR COLISIONES GENERALES
; ============================================
CHECK_COLLISIONS:
    ; Comprobar diamantes
    call CHECK_DIAMOND_COLLISION
    
    ; Comprobar pinchos
    call CHECK_SPIKES_COLLISION
    
    ; Comprobar puerta
    call CHECK_DOOR_COLLISION
    
    ; Comprobar cintas transportadoras
    call CHECK_CONVEYOR_COLLISION
    
    ret

; ============================================
; COMPROBAR COLISIÓN CON DIAMANTES
; ============================================
CHECK_DIAMOND_COLLISION:
    ; Obtener tile en la posición del jugador
    ld a, (player_x)
    add a, 8
    ld c, a
    ld a, (player_y)
    add a, 8
    ld b, a
    call PIXEL_TO_TILE
    
    ; Leer tile de VRAM
    ex de, hl
    call RDVRM
    ex de, hl
    
    ; Es un diamante?
    cp TILE_DIAMOND
    ret nz
    
    ; Eliminar diamante
    push hl
    ex de, hl
    ld a, TILE_EMPTY
    call WRTVRM
    pop hl
    
    ; Incrementar contador
    ld a, (diamonds)
    inc a
    ld (diamonds), a
    
    ; Actualizar puntuación
    ld hl, (score)
    ld de, 100
    add hl, de
    ld (score), hl
    
    ; Actualizar HUD
    call UPDATE_HUD
    
    ; Efecto de sonido (aquí se implementaría)
    
    ret

; ============================================
; COMPROBAR COLISIÓN CON PINCHOS
; ============================================
CHECK_SPIKES_COLLISION:
    ; Obtener tile bajo los pies
    ld a, (player_y)
    add a, SPRITE_SIZE - 2
    ld b, a
    ld a, (player_x)
    add a, 8
    ld c, a
    call PIXEL_TO_TILE
    
    ; Leer tile de VRAM
    ex de, hl
    call RDVRM
    ex de, hl
    
    ; Son pinchos?
    cp TILE_SPIKES
    ret nz
    
    ; Perder vida
    ld a, (lives)
    dec a
    ld (lives), a
    jr z, .GAME_OVER
    
    ; Reposicionar jugador
    call INIT_GAME
    ret
    
.GAME_OVER:
    ; Aquí iría la pantalla de Game Over
    jp START

; ============================================
; COMPROBAR COLISIÓN CON PUERTA
; ============================================
CHECK_DOOR_COLLISION:
    ; Solo si tiene todos los diamantes
    ld a, (diamonds)
    ld b, a
    ld a, (diamonds_total)
    cp b
    ret nz
    
    ; Comprobar si está en la puerta
    ld a, (player_x)
    add a, 8
    ld c, a
    ld a, (player_y)
    add a, 8
    ld b, a
    call PIXEL_TO_TILE
    
    ; Leer tile de VRAM
    ex de, hl
    call RDVRM
    ex de, hl
    
    ; Es la puerta?
    cp TILE_DOOR
    ret nz
    
    ; Nivel completado!
    ; Aquí se cargaría el siguiente nivel
    ; Por ahora, reiniciar
    call INIT_GAME
    
    ret

; ============================================
; COMPROBAR CINTAS TRANSPORTADORAS
; ============================================
CHECK_CONVEYOR_COLLISION:
    ; Obtener tile bajo los pies
    ld a, (player_y)
    add a, SPRITE_SIZE - 1
    ld b, a
    ld a, (player_x)
    add a, 8
    ld c, a
    call PIXEL_TO_TILE
    
    ; Leer tile de VRAM
    ex de, hl
    call RDVRM
    ex de, hl
    
    ; Cinta izquierda?
    cp TILE_CONVEYOR_L
    jr z, .CONVEYOR_LEFT
    
    ; Cinta derecha?
    cp TILE_CONVEYOR_R
    jr z, .CONVEYOR_RIGHT
    
    ret
    
.CONVEYOR_LEFT:
    ld a, (player_x)
    dec a
    dec a
    ld (player_x), a
    ret
    
.CONVEYOR_RIGHT:
    ld a, (player_x)
    inc a
    inc a
    ld (player_x), a
    ret

; ============================================
; ACTUALIZAR ANIMACIONES
; ============================================
UPDATE_ANIMATIONS:
    ; Incrementar contador de frames
    ld a, (frame_counter)
    inc a
    and 7              ; Animación cada 8 frames
    ld (frame_counter), a
    ret nz
    
    ; Alternar frame de animación del jugador
    ld a, (player_anim)
    xor 1
    ld (player_anim), a
    
    ret

; ============================================
; ACTUALIZAR PANTALLA
; ============================================
UPDATE_DISPLAY:
    ; Actualizar posición del sprite del jugador
    call UPDATE_PLAYER_SPRITE
    
    ; Aplicar movimiento horizontal
    ld a, (player_vx)
    ld b, a
    ld a, (player_x)
    add a, b
    ld (player_x), a
    
    ; Limitar posición horizontal
    ld a, (player_x)
    cp 8
    jr nc, .CHECK_RIGHT
    ld a, 8
    ld (player_x), a
    jr .DONE_X
    
.CHECK_RIGHT:
    cp 240
    jr c, .DONE_X
    ld a, 239
    ld (player_x), a
    
.DONE_X:
    ret

; ============================================
; ACTUALIZAR SPRITE DEL JUGADOR
; ============================================
UPDATE_PLAYER_SPRITE:
    ; Calcular patrón según dirección y animación
    ld a, (player_dir)
    or a
    jr nz, .FACING_RIGHT
    
    ; Mirando izquierda
    ld a, (player_anim)
    add a, 2            ; Patrones 2 y 3 para izquierda
    jr .SET_PATTERN
    
.FACING_RIGHT:
    ; Mirando derecha
    ld a, (player_anim) ; Patrones 0 y 1 para derecha
    
.SET_PATTERN:
    ld (temp1), a       ; Guardar patrón
    
    ; Actualizar sprite 0
    ld hl, SPRITE_ATTRIB
    ld de, 4            ; 4 bytes por sprite
    
    ; Y-coordinate
    ld a, (player_y)
    dec a               ; Ajuste para sprites
    call WRTVRM
    inc hl
    
    ; X-coordinate
    ld a, (player_x)
    dec a               ; Ajuste para sprites
    call WRTVRM
    inc hl
    
    ; Pattern number
    ld a, (temp1)
    call WRTVRM
    inc hl
    
    ; Color (blanco)
    ld a, 15
    call WRTVRM
    
    ret

; ============================================
; ACTUALIZAR HUD
; ============================================
UPDATE_HUD:
    ; Dibujar marco del HUD
    ld hl, NAME_TABLE
    ld b, 32
    ld a, TILE_BRICK
    
DRAW_TOP:
    push af
    push hl
    call WRTVRM
    pop hl
    pop af
    inc hl
    djnz DRAW_TOP
    
    ; Mostrar vidas
    ld hl, NAME_TABLE + 2
    ld a, 'L'
    sub 32  ; Convertir ASCII a código de tile
    call WRTVRM
    inc hl
    ld a, 'I'
    sub 32
    call WRTVRM
    inc hl
    ld a, 'V'
    sub 32
    call WRTVRM
    inc hl
    ld a, 'E'
    sub 32
    call WRTVRM
    inc hl
    ld a, 'S'
    sub 32
    call WRTVRM
    inc hl
    ld a, ':'
    sub 32
    call WRTVRM
    inc hl
    
    ld a, (lives)
    add a, '0'
    sub 32
    call WRTVRM
    
    ; Mostrar diamantes
    ld hl, NAME_TABLE + 20
    ld a, 'D'
    sub 32
    call WRTVRM
    inc hl
    ld a, 'I'
    sub 32
    call WRTVRM
    inc hl
    ld a, 'A'
    sub 32
    call WRTVRM
    inc hl
    ld a, 'M'
    sub 32
    call WRTVRM
    inc hl
    ld a, ':'
    sub 32
    call WRTVRM
    inc hl
    
    ld a, (diamonds)
    add a, '0'
    sub 32
    call WRTVRM
    inc hl
    ld a, '/'
    sub 32
    call WRTVRM
    inc hl
    ld a, (diamonds_total)
    add a, '0'
    sub 32
    call WRTVRM
    
    ret

; ============================================
; COMPROBAR SI EL NIVEL ESTÁ COMPLETO
; ============================================
CHECK_LEVEL_COMPLETE:
    ; Este chequeo se hace en CHECK_DOOR_COLLISION
    ret

; ============================================
; FUNCIONES AUXILIARES
; ============================================

; Convertir coordenadas de píxel a coordenadas de tile
; Entrada: B = Y, C = X
; Salida: HL = dirección en tabla de nombres
PIXEL_TO_TILE:
    ; Calcular fila: Y / 8
    ld a, b
    srl a
    srl a
    srl a           ; Dividir por 8
    and 31          ; Máximo 31
    
    ; Multiplicar por 32
    ld h, 0
    ld l, a
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl      ; HL = fila * 32
    
    ; Calcular columna: X / 8
    ld a, c
    srl a
    srl a
    srl a           ; Dividir por 8
    and 31          ; Máximo 31
    
    ; Añadir columna
    add a, l
    ld l, a
    
    ; Añadir dirección base de la tabla de nombres
    ld bc, NAME_TABLE
    add hl, bc
    
    ret

; Comprobar si un tile es sólido
; Entrada: HL = dirección del tile
; Salida: C = 1 si es sólido, C = 0 si no
IS_SOLID_TILE:
    push hl
    
    ; Leer tile de VRAM
    ex de, hl
    call RDVRM
    ex de, hl
    
    ; Comprobar tiles sólidos
    cp TILE_BRICK
    jr z, .SOLID
    cp TILE_PLATFORM
    jr z, .SOLID
    cp TILE_EARTH
    jr z, .SOLID
    cp TILE_SPIKES
    jr z, .SOLID
    cp TILE_DOOR
    jr z, .SOLID
    
    ; No es sólido
    pop hl
    or a            ; Limpiar carry
    ret
    
.SOLID:
    pop hl
    scf             ; Set carry
    ret

; ============================================
; DATOS DEL NIVEL 1 - CENTRAL CAVERN
; ============================================
LEVEL1_MAP:
    ; Fila 0 (borde superior)
    db 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
    ; Fila 1
    db 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    ; Fila 2
    db 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    ; Fila 3 (diamantes superiores)
    db 1,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,0,0,0,7,0,0,1
    ; Fila 4 (plataformas)
    db 1,0,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,2,0,0,0,2,2,2,0,1
    ; Fila 5
    db 1,0,0,0,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    ; Fila 6 (plataformas)
    db 1,0,0,0,0,0,0,0,0,0,2,2,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    ; Fila 7
    db 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    ; Fila 8 (diamante medio)
    db 1,0,0,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    ; Fila 9 (plataformas)
    db 1,0,0,0,0,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    ; Fila 10
    db 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,0,1
    ; Fila 11 (plataformas largas)
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
    ; Fila 18 (plataformas inferiores)
    db 1,0,0,0,0,0,0,2,2,2,2,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0,0,1
    ; Fila 19
    db 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    ; Fila 20 (suelo con pinchos)
    db 1,0,0,0,0,0,0,0,0,0,0,0,0,0,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
    ; Fila 21 (suelo principal)
    db 1,2,2,2,2,2,2,2,2,2,2,2,2,2,4,4,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1
    ; Fila 22 (tierra)
    db 1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1
    ; Fila 23 (borde inferior)
    db 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1

; ============================================
; PATRONES DE TILES (8 bytes por tile)
; ============================================
TILE_PATTERNS:
; Tile 0: Vacío
    db 00000000b
    db 00000000b
    db 00000000b
    db 00000000b
    db 00000000b
    db 00000000b
    db 00000000b
    db 00000000b

; Tile 1: Ladrillo
    db 11111111b
    db 10000100b
    db 10000100b
    db 11111111b
    db 00100001b
    db 00100001b
    db 11111111b
    db 00000000b

; Tile 2: Plataforma
    db 11111111b
    db 11111111b
    db 11000011b
    db 11000011b
    db 11000011b
    db 11000011b
    db 00000000b
    db 00000000b

; Tile 3: Escalera
    db 00100010b
    db 00111110b
    db 00100010b
    db 00100010b
    db 00111110b
    db 00100010b
    db 00100010b
    db 00111110b

; Tile 4: Tierra
    db 10101010b
    db 01010101b
    db 10101010b
    db 01010101b
    db 10101010b
    db 01010101b
    db 10101010b
    db 01010101b

; Tile 5: Diamante
    db 00011000b
    db 00111100b
    db 01111110b
    db 11111111b
    db 11111111b
    db 01111110b
    db 00111100b
    db 00011000b

; Tile 6: Pinchos
    db 00000000b
    db 00100100b
    db 01100110b
    db 01100110b
    db 11100111b
    db 11100111b
    db 11100111b
    db 11111111b

; Tile 7: Puerta
    db 01111110b
    db 01000010b
    db 01011010b
    db 01011010b
    db 01011010b
    db 01001010b
    db 01000010b
    db 01111110b

; Tile 8: Cinta transportadora izquierda
    db 00011000b
    db 00011000b
    db 00111100b
    db 00111100b
    db 01111110b
    db 01111110b
    db 11111111b
    db 11111111b

; Tile 9: Cinta transportadora derecha
    db 00011000b
    db 00011000b
    db 00111100b
    db 00111100b
    db 01111110b
    db 01111110b
    db 11111111b
    db 11111111b

; Tiles 10-31 (reservados)
    db 0,0,0,0,0,0,0,0
    db 0,0,0,0,0,0,0,0
    db 0,0,0,0,0,0,0,0
    db 0,0,0,0,0,0,0,0
    db 0,0,0,0,0,0,0,0
    db 0,0,0,0,0,0,0,0
    db 0,0,0,0,0,0,0,0
    db 0,0,0,0,0,0,0,0
    db 0,0,0,0,0,0,0,0
    db 0,0,0,0,0,0,0,0
    db 0,0,0,0,0,0,0,0
    db 0,0,0,0,0,0,0,0
    db 0,0,0,0,0,0,0,0
    db 0,0,0,0,0,0,0,0
    db 0,0,0,0,0,0,0,0
    db 0,0,0,0,0,0,0,0
    db 0,0,0,0,0,0,0,0
    db 0,0,0,0,0,0,0,0
    db 0,0,0,0,0,0,0,0
    db 0,0,0,0,0,0,0,0
    db 0,0,0,0,0,0,0,0
    db 0,0,0,0,0,0,0,0

; ============================================
; COLORES DE TILES
; ============================================
TILE_COLORS:
; Tile 0: Vacío (transparente)
    db 0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h
; Tile 1: Ladrillo (rojo/marrón)
    db 086h,086h,086h,086h,086h,086h,086h,086h
; Tile 2: Plataforma (verde)
    db 031h,031h,031h,031h,031h,031h,031h,031h
; Tile 3: Escalera (marrón)
    db 061h,061h,061h,061h,061h,061h,061h,061h
; Tile 4: Tierra (marrón oscuro)
    db 0C6h,0C6h,0C6h,0C6h,0C6h,0C6h,0C6h,0C6h
; Tile 5: Diamante (cyan brillante)
    db 071h,071h,071h,0F1h,0F1h,071h,071h,071h
; Tile 6: Pinchos (rojo/blanco)
    db 0F1h,0F8h,0F8h,0F8h,0F8h,0F8h,0F8h,0F8h
; Tile 7: Puerta (amarillo)
    db 0A1h,0A1h,0A1h,0A1h,0A1h,0A1h,0A1h,0A1h
; Tile 8: Cinta (azul)
    db 041h,041h,041h,041h,041h,041h,041h,041h
; Tile 9: Cinta (azul)
    db 041h,041h,041h,041h,041h,041h,041h,041h

; Tiles 10-31 (reservados)
    db 0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h
    db 0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h
    db 0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h
    db 0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h
    db 0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h
    db 0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h
    db 0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h
    db 0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h
    db 0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h
    db 0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h
    db 0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h
    db 0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h
    db 0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h
    db 0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h
    db 0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h
    db 0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h
    db 0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h
    db 0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h
    db 0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h
    db 0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h
    db 0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h
    db 0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h,0F1h

; ============================================
; SPRITES DEL JUGADOR (16x16, 32 bytes cada uno)
; ============================================
SPRITE_DATA:
; Sprite 0: Jugador derecha frame 1
    ; Parte superior izquierda
    db 00000000b
    db 00000000b
    db 00000000b
    db 01100000b
    db 00000000b
    db 11110000b
    db 00000001b
    db 11111000b
    db 00000001b
    db 11111000b
    db 00000001b
    db 11110000b
    db 00000000b
    db 11100000b
    db 00000001b
    db 11110000b
    ; Parte superior derecha
    db 00000000b
    db 00000000b
    db 00000110b
    db 00000000b
    db 00001111b
    db 00000000b
    db 00011111b
    db 10000000b
    db 00011111b
    db 10000000b
    db 00001111b
    db 10000000b
    db 00000111b
    db 00000000b
    db 00001111b
    db 10000000b

; Sprite 1: Jugador derecha frame 2
    ; Parte superior izquierda
    db 00000000b
    db 01100000b
    db 00000000b
    db 11110000b
    db 00000001b
    db 11111000b
    db 00000001b
    db 11111000b
    db 00000001b
    db 11110000b
    db 00000000b
    db 11100000b
    db 00000001b
    db 11110000b
    db 00000001b
    db 11110000b
    ; Parte superior derecha
    db 00000110b
    db 00000000b
    db 00001111b
    db 00000000b
    db 00011111b
    db 10000000b
    db 00011111b
    db 10000000b
    db 00001111b
    db 10000000b
    db 00000111b
    db 00000000b
    db 00001111b
    db 10000000b
    db 00001111b
    db 10000000b

; Sprite 2: Jugador izquierda frame 1
    ; Parte superior izquierda
    db 00000000b
    db 00000000b
    db 00000000b
    db 00000110b
    db 00000000b
    db 00001111b
    db 00000000b
    db 00011111b
    db 00000000b
    db 00011111b
    db 00000000b
    db 00001111b
    db 00000000b
    db 00000111b
    db 00000000b
    db 00001111b
    ; Parte superior derecha
    db 00000000b
    db 00000000b
    db 01100000b
    db 00000000b
    db 11110000b
    db 00000000b
    db 11111000b
    db 00000000b
    db 11111000b
    db 00000000b
    db 11111000b
    db 00000000b
    db 01110000b
    db 00000000b
    db 11111000b
    db 00000000b

; Sprite 3: Jugador izquierda frame 2
    ; Parte superior izquierda
    db 00000000b
    db 00000110b
    db 00000000b
    db 00001111b
    db 00000000b
    db 00011111b
    db 00000000b
    db 00011111b
    db 00000000b
    db 00001111b
    db 00000000b
    db 00000111b
    db 00000000b
    db 00001111b
    db 00000000b
    db 00001111b
    ; Parte superior derecha
    db 01100000b
    db 00000000b
    db 11110000b
    db 00000000b
    db 11111000b
    db 00000000b
    db 11111000b
    db 00000000b
    db 11111000b
    db 00000000b
    db 01110000b
    db 00000000b
    db 11111000b
    db 00000000b
    db 11111000b
    db 00000000b

; Sprite 4-7: Reservados (rellenar con ceros)
    db 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
    db 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
    db 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
    db 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
    db 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
    db 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
    db 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
    db 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0

; ============================================
; FIN DEL PROGRAMA
; ============================================