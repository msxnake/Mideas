; ===========================================================
; MSX SCREEN 2 DEMO - GAME SCREEN
; Assembler: Compatible con Pasmo / Glass / AsMSX
; ===========================================================

; --- BIOS CALLS ---
CHGMOD  EQU $005F ; Cambiar modo de pantalla (A = Modo)
LDIRVM  EQU $005C ; Copiar bloque RAM -> VRAM (BC=Len, DE=VRAM Dest, HL=RAM Src)
FILVRM  EQU $0056 ; Llenar VRAM con valor (BC=Len, HL=Start, A=Byte)
DISSCR  EQU $0041 ; Desactivar pantalla (evita parpadeo al dibujar)
ENASCR  EQU $0044 ; Activar pantalla

; --- VRAM MAP PARA SCREEN 2 ---
; En Screen 2, la pantalla se divide en 3 tercios (Top, Mid, Bot)
; PGT = Pattern Generator Table (Los dibujos de los tiles)
; PNT = Pattern Name Table (El mapa de la pantalla)
; CT  = Color Table (Los colores de los tiles)

PGT_BASE    EQU $0000   ; Dirección base de patrones
CT_BASE     EQU $02000  ; Dirección base de colores
PNT_BASE    EQU $01800  ; Dirección base del mapa (nombres)

; --- HEADER PARA ROM (CARTUCHO) ---
    ORG $4000       ; Las ROMs estándar suelen empezar en $4000 (Página 1)
    DB  "AB"        ; Firma de ROM obligatoria ('A'=$41, 'B'=$42)
    DW  START       ; Puntero a la rutina de INICIO (INIT)
    DW  0           ; Puntero a STATEMENT (Extensiones de BASIC)
    DW  0           ; Puntero a DEVICE (Drivers de dispositivos)
    DW  0           ; Puntero a TEXT (No usado)
    DW  0, 0, 0     ; Espacio reservado

START:
    ; 1. Inicializar Screen 2
    LD  A, 2
    CALL CHGMOD     ; BIOS: Cambiar a Screen 2

    CALL DISSCR     ; Apagar pantalla para dibujar rápido

    ; 2. Cargar Patrones (Tiles)
    ; Screen 2 tiene 3 bancos de 256 caracteres.
    ; Para simplificar, copiaremos nuestros tiles a los 3 bancos
    ; para que el tile '1' se vea igual en la parte superior e inferior.

    ; -- Banco 0 (Arriba) --
    LD  HL, TILES_DATA  ; Origen (RAM)
    LD  DE, PGT_BASE    ; Destino (VRAM $0000)
    LD  BC, TILES_LEN   ; Longitud
    CALL LDIRVM

    ; -- Banco 1 (Medio) --
    LD  HL, TILES_DATA
    LD  DE, PGT_BASE + $0800
    LD  BC, TILES_LEN
    CALL LDIRVM

    ; -- Banco 2 (Abajo) --
    LD  HL, TILES_DATA
    LD  DE, PGT_BASE + $1000
    LD  BC, TILES_LEN
    CALL LDIRVM

    ; 3. Definir Colores
    ; En Screen 2, cada fila de 8 pixels tiene su propio byte de color.
    ; Copiamos la tabla de colores igual que hicimos con los patrones.

    ; -- Banco 0 --
    LD  HL, COLOR_DATA
    LD  DE, CT_BASE
    LD  BC, TILES_LEN
    CALL LDIRVM

    ; -- Banco 1 --
    LD  HL, COLOR_DATA
    LD  DE, CT_BASE + $0800
    LD  BC, TILES_LEN
    CALL LDIRVM

    ; -- Banco 2 --
    LD  HL, COLOR_DATA
    LD  DE, CT_BASE + $1000
    LD  BC, TILES_LEN
    CALL LDIRVM

    ; 4. Dibujar el Mapa (Level Design)
    ; Primero limpiamos la pantalla con el Tile 0 (Espacio vacío)
    LD  HL, PNT_BASE    ; Inicio de la tabla de nombres
    LD  BC, 768         ; 32 columnas * 24 filas = 768 bytes
    LD  A, 0            ; Tile 0
    CALL FILVRM

    ; Dibujar Suelo (Tile 1) en las ultimas 2 filas
    LD  HL, PNT_BASE + (32 * 22) ; Fila 22
    LD  BC, 64          ; 2 filas de ancho (32*2)
    LD  A, 1            ; Tile 1 (Ladrillo)
    CALL FILVRM

    ; Dibujar una Plataforma
    LD  HL, PNT_BASE + (32 * 15) + 10 ; Fila 15, Columna 10
    LD  BC, 6           ; 6 bloques de ancho
    LD  A, 1            ; Tile 1
    CALL FILVRM

    ; Dibujar Escalera (Tile 3)
    LD  HL, PNT_BASE + (32 * 16) + 14 ; Debajo de la plataforma
    LD  DE, 32          ; Salto de linea para dibujar vertical
    LD  B, 6            ; Altura de 6 bloques
DRAW_LADDER:
    LD  A, 3            ; Tile 3 (Escalera)
    PUSH HL
    PUSH DE
    PUSH BC
    LD  BC, 1           ; Escribir 1 byte
    CALL FILVRM         ; Escribir escalera
    POP BC
    POP DE
    POP HL
    ADD HL, DE          ; Bajar una linea
    DJNZ DRAW_LADDER

    ; Dibujar Jugador (Tile 2)
    LD  HL, PNT_BASE + (32 * 14) + 12 ; Encima de la plataforma
    LD  A, 2            ; Tile 2 (Personaje)
    CALL WRTVRM_SINGLE

    ; Dibujar un Diamante (Tile 4)
    LD  HL, PNT_BASE + (32 * 20) + 20
    LD  A, 4            ; Tile 4
    CALL WRTVRM_SINGLE

    ; 5. Encender Pantalla y bucle infinito
    CALL ENASCR

LOOP:
    JP LOOP             ; Bucle infinito (Resetear MSX para salir)


; --- Rutina Auxiliar para escribir 1 byte (wrapper de BIOS) ---
WRTVRM_SINGLE:
    ; Input: HL = Address, A = Value
    PUSH BC
    LD BC, 1
    CALL FILVRM
    POP BC
    RET

; ===========================================================
; DATOS GRÁFICOS (TILES Y COLORES)
; ===========================================================

TILES_DATA:
    ; Tile 0: Vacio
    DB $00,$00,$00,$00,$00,$00,$00,$00

    ; Tile 1: Ladrillo (Bloque sólido con textura)
    DB $FF,$80,$80,$FF,$08,$08,$08,$FF

    ; Tile 2: Jugador (Carita simple)
    DB $3C,$42,$A5,$81,$A5,$99,$42,$3C

    ; Tile 3: Escalera
    DB $42,$42,$7E,$42,$7E,$42,$42,$00

    ; Tile 4: Diamante
    DB $18,$3C,$7E,$FF,$7E,$3C,$18,$00
TILES_LEN EQU $ - TILES_DATA



COLOR_DATA:
    ; Formato byte de color Screen 2: Foreground (4 bits) | Background (4 bits)
    ; Colores MSX: 1=Negro, 4=Azul, 8=Rojo, 15=Blanco, 10=Amarillo, etc.

    ; Tile 0: Negro sobre Negro
    DB $00,$00,$00,$00,$00,$00,$00,$00

    ; Tile 1: Ladrillo (Rojo medio $80 sobre Negro $01? No, usaremos $60 Rojo oscuro)
    ; Foreground=6 (Rojo Oscuro), Background=1 (Negro) -> $61
    DB $61,$61,$61,$61,$61,$61,$61,$61

    ; Tile 2: Jugador (Blanco sobre Negro) -> $F1
    DB $F1,$F1,$F1,$F1,$F1,$F1,$F1,$F1

    ; Tile 3: Escalera (Cyan sobre Negro) -> $51
    DB $51,$51,$51,$51,$51,$51,$51,$51

    ; Tile 4: Diamante (Amarillo sobre Negro) -> $A1
    DB $A1,$A1,$A1,$A1,$A1,$A1,$A1,$A1

END_CODE: