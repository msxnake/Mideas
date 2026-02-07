; =============================================================================
; MSX SCREEN 2 SCROLL DEMO - VERSION COMPLETA PARA GLASS
; Proyecto: Scroll basado en tiles para Screen 2 (3 bancos)
; Autor: Basado en rutinas de Santi Ontañón
; =============================================================================
output "game.rom"

; -----------------------------------------------------------------------------
; CONSTANTES BIOS Y SISTEMA
; -----------------------------------------------------------------------------
CHGMOD: equ 0x005F ; BIOS: Cambiar modo de video (A = modo)
WRTVDP: equ 0x0047 ; BIOS: Escribir en registro VDP (C = reg, B = dato)
LDIRVM: equ 0x005C ; BIOS: Copiar RAM a VRAM (HL=Src, DE=Dest, BC=Len)
GTSTCK: equ 0x00D5 ; BIOS: Leer Joystick/Cursores (A=0 para cursores)
DISSBR: equ 0x0041 ; BIOS: Desactivar interrupciones
ENASBR: equ 0x0044 ; BIOS: Activar interrupciones
; Direcciones VRAM en SCREEN 2
NAMTR2: equ 0x1800 ; Tabla de Nombres (Tilemap) - 768 bytes
PGTTR2: equ 0x0000 ; Tabla de Patrones (Generador) - Base
COLTR2: equ 0x2000 ; Tabla de Colores - Base
; -----------------------------------------------------------------------------
; VARIABLES EN RAM (0xC000 - Inicio de RAM en MSX 16K/64K)
; -----------------------------------------------------------------------------
org 0xC000
camera_x: db 0 ; Posicion X actual de la camara (0-32)
camera_y: db 0 ; Posicion Y actual de la camara (0-40)
prev_x: db 0 ; Buffer X para detectar cambios
prev_y: db 0 ; Buffer Y para detectar cambios
; -----------------------------------------------------------------------------
; CABECERA ROM MSX (Bloque de 16KB standard)
; -----------------------------------------------------------------------------
org 0x4000
db "AB" ; ID de ROM valida
dw start ; Direccion de arranque
dw 0, 0, 0, 0, 0, 0 ; Reservado para INIT, STATEMENT, DEVICE, etc.
; -----------------------------------------------------------------------------
; RUTINA DE INICIO
; -----------------------------------------------------------------------------
start:
call DISSBR ; Desactivar interrupciones para configurar VDP
; Configurar SCREEN 2
ld a, 2                 ; Modo 2
call CHGMOD             

; Configurar registros VDP para habilitar los 3 BANCOS de memoria
; Esto es critico: si no se hace, solo se ve el tercio superior correctamente

; Registro 4: Generador de Patrones (Pattern Generator Table)
ld b, 0x03              ; Mascara para base 0x0000
ld c, 4                 ; Registro 4
call WRTVDP

; Registro 3: Tabla de Colores (Color Table)
ld b, 0xFF              ; Mascara para base 0x2000
ld c, 3                 ; Registro 3
call WRTVDP

call init_graphics      ; Subrutina: Cargar tiles y colores a VRAM
call draw_full_map      ; Subrutina: Dibujar el mapa inicial

; -----------------------------------------------------------------------------
; BUCLE PRINCIPAL (Game Loop)
; -----------------------------------------------------------------------------
main_loop:
halt ; Esperar al V-Blank (1/50 o 1/60 seg) para sincronizar
call read_input         ; Leer estado de los cursores

; Logica de optimizacion:
; Solo llamamos a la rutina de dibujo si las coordenadas han cambiado.

ld a, (camera_x)        ; Cargar X actual
ld hl, prev_x           ; Apuntar a X previa
cp (hl)                 ; Comparar
jr nz, update_view      ; Si son diferentes, actualizar vista

ld a, (camera_y)        ; Cargar Y actual
ld hl, prev_y           ; Apuntar a Y previa
cp (hl)                 ; Comparar
jr z, main_loop         ; Si Y tambien es igual, repetir bucle sin dibujar

update_view:
; Guardar las nuevas coordenadas como "previas" para el siguiente frame
ld a, (camera_x)
ld (prev_x), a
ld a, (camera_y)
ld (prev_y), a
call draw_full_map      ; Transferir la ventana del mapa a la VRAM
jr main_loop            ; Volver al inicio

; -----------------------------------------------------------------------------
; RUTINAS DE ENTRADA (Input)
; -----------------------------------------------------------------------------
read_input:
ld a, 0 ; A=0 selecciona leer cursores (teclado)
call GTSTCK ; Retorna direccion en A (0=Nada, 1=Arriba, etc)
cp 1                    ; ¿Es Arriba?
jr z, move_up
cp 3                    ; ¿Es Derecha?
jr z, move_right
cp 5                    ; ¿Es Abajo?
jr z, move_down
cp 7                    ; ¿Es Izquierda?
jr z, move_left
ret                     ; Si es otro valor, salir

move_up:
ld a, (camera_y) ; Cargar Y
or a ; Comprobar si es 0
ret z ; Si es 0, no hacer nada (limite superior)
dec a ; Decrementar Y
ld (camera_y), a ; Guardar
ret
move_down:
ld a, (camera_y) ; Cargar Y
cp 40 ; Comprobar limite (64 altura mapa - 24 altura pantalla)
ret z ; Si llego al limite, salir
inc a ; Incrementar Y
ld (camera_y), a ; Guardar
ret
move_left:
ld a, (camera_x) ; Cargar X
or a ; Comprobar si es 0
ret z ; Limite izquierdo
dec a ; Decrementar X
ld (camera_x), a ; Guardar
ret
move_right:
ld a, (camera_x) ; Cargar X
cp 32 ; Comprobar limite (64 ancho mapa - 32 ancho pantalla)
ret z ; Limite derecho
inc a ; Incrementar X
ld (camera_x), a ; Guardar
ret
; -----------------------------------------------------------------------------
; INICIALIZACION DE GRAFICOS
; -----------------------------------------------------------------------------
init_graphics:
; Screen 2 divide la pantalla en 3 tercios (bancos).
; Debemos copiar los patrones graficos a las 3 zonas para que se vean igual.
; --- Cargar Patrones ---
ld b, 3                 ; Vamos a iterar 3 veces
ld de, PGTTR2           ; Destino inicial: 0x0000 (Banco 1)

pgt_loop:
push bc ; Guardar contador bucle
push de ; Guardar destino actual
ld hl, tile_patterns ; Origen de datos
ld bc, 32 ; Longitud: 4 tiles * 8 bytes cada uno
call LDIRVM ; Copiar a VRAM
pop de ; Recuperar destino
ld hl, 0x0800           ; Offset de 2KB (tamaño de un banco de patrones)
add hl, de              ; Calcular direccion del siguiente banco
ex de, hl               ; Poner nuevo destino en DE

pop bc                  ; Recuperar contador
djnz pgt_loop           ; Repetir hasta que B=0

; --- Cargar Colores ---
ld b, 3                 ; Reiniciar contador para colores
ld de, COLTR2           ; Destino inicial: 0x2000 (Banco 1 colores)

col_loop:
push bc
push de
ld hl, tile_colors ; Origen de colores
ld bc, 32 ; Longitud: 4 tiles * 8 bytes
call LDIRVM
pop de
ld hl, 0x0800           ; Offset de 2KB
add hl, de
ex de, hl

pop bc
djnz col_loop
ret

; -----------------------------------------------------------------------------
; RENDERIZADO DEL MAPA (Scroll por Software)
; -----------------------------------------------------------------------------
draw_full_map:
ld hl, virtual_map ; Puntero base al mapa en ROM
; 1. Calcular desplazamiento vertical en el mapa (Y * 64)
ld a, (camera_y)
or a
jr z, skip_y_calc       ; Si Y=0, saltar calculo

ld b, a                 ; Usar Y como contador
ld de, 64               ; Ancho del mapa virtual

y_offset_loop:
add hl, de ; Sumar una fila completa
djnz y_offset_loop ; Repetir Y veces
skip_y_calc:
; 2. Calcular desplazamiento horizontal (X)
ld a, (camera_x)
ld e, a
ld d, 0
add hl, de              ; HL apunta ahora al tile superior-izquierdo visible

; 3. Copiar ventana a la VRAM
ld de, NAMTR2           ; Destino: Inicio de la Name Table (0x1800)
ld b, 24                ; Altura de la pantalla: 24 filas

line_render_loop:
push bc ; Guardar contador de filas
push hl ; Guardar puntero mapa (inicio de esta fila)
push de ; Guardar puntero VRAM (inicio de esta fila)
ld bc, 32               ; Ancho de pantalla: 32 columnas
call LDIRVM             ; Copiar linea: ROM(HL) -> VRAM(DE)

pop de                  ; Recuperar puntero VRAM
pop hl                  ; Recuperar puntero Mapa
pop bc                  ; Recuperar contador filas

; Avanzar punteros para la siguiente fila

; Mapa: saltar 64 tiles (ancho total del mapa)
ld a, 64
add hl, a               ; HL baja una linea en el mapa virtual

; VRAM: saltar 32 tiles (ancho de pantalla)
ex de, hl               ; Intercambiar DE/HL para operar con DE (ahora en HL)
ld a, 32
add hl, a               ; Sumar 32
ex de, hl               ; Devolver a DE

djnz line_render_loop   ; Repetir para las 24 filas
ret

; -----------------------------------------------------------------------------
; DATOS: PATRONES (8x8 pixels)
; -----------------------------------------------------------------------------
tile_patterns:
; Tile 0: Espacio vacio (Todo 0)
db 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
; Tile 1: Bloque solido (Patron tipo ladrillo)
db 0xFF, 0x81, 0xBD, 0xA5, 0xA5, 0xBD, 0x81, 0xFF
; Tile 2: Nave (Flecha estilo Transball)
db 0x18, 0x3C, 0x7E, 0xDB, 0xFF, 0x24, 0x5A, 0xA5
; Tile 3: Item (Punto pequeño)
db 0x00, 0x00, 0x3C, 0x7E, 0x7E, 0x3C, 0x00, 0x00
; -----------------------------------------------------------------------------
; DATOS: COLORES (1 byte por linea de 8 pixels)
; Formato: Nibble alto (Foreground) / Nibble bajo (Background)
; -----------------------------------------------------------------------------
tile_colors:
; Tile 0: Negro sobre negro
db 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01
; Tile 1: Cyan (7) sobre Azul oscuro (4)
db 0x74, 0x74, 0x74, 0x74, 0x74, 0x74, 0x74, 0x74
; Tile 2: Blanco (F) sobre Negro (1)
db 0xF1, 0xF1, 0xF1, 0xF1, 0xF1, 0xF1, 0xF1, 0xF1
; Tile 3: Rojo (8) sobre Negro (1)
db 0x81, 0x81, 0x81, 0x81, 0x81, 0x81, 0x81, 0x81
; -----------------------------------------------------------------------------
; MAPA VIRTUAL (64x64 tiles)
; Usamos la directiva 'repeat' de Glass para generar el mapa
; -----------------------------------------------------------------------------
virtual_map:
; --- Borde Superior ---
repeat 64
db 1 ; Muros
endr
; --- Cuerpo del mapa (62 filas) ---
repeat 62
   db 1                ; Muro izquierdo
   db 0, 0, 0, 0, 2, 3 ; Espacio, Nave, Item
   repeat 56
       db 0            ; Relleno de aire
   endr
   db 1                ; Muro derecho
endr

; --- Borde Inferior ---
repeat 64
   db 1                ; Muros
endr

; -----------------------------------------------------------------------------
; RELLENO DE ROM
; Asegura que el archivo final tenga exactamente 16KB (0x8000 - 0x4000 = 0x4000)
; -----------------------------------------------------------------------------
ds 0x8000 - $, 0