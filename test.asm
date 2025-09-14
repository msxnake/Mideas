    org $4000

; --- Cabecera Konami 16 bytes ---
Header:
    db "AB"
    dw Start
    dw 0,0,0,0,0

; --- Constantes BIOS ---
CHGMOD     equ $005F
WRTVDP     equ $0047
LDIRVM_BIOS equ $005C

; --- Direcciones VRAM ---
SPRITE_ATTR equ $1B00
SPRITE_PAT  equ $3800

; --- Código ---
Start:
    ; Poner SCREEN 2
    ld  a,2
    call CHGMOD

    ; Configurar sprites 16x16 (registro 1 del VDP)
    ld  c,1
    ld  b,%01100010     ; display ON, mode2 ON, sprites 16x16 ON
    call WRTVDP

    ; Cargar patrón del sprite
    ld  hl,SpritePattern
    ld  de,SPRITE_PAT
    ld  bc,32
    call LDIRVM

    ; Cargar atributos (Y=88, X=120, patrón 0, color 2)
    ld  hl,SpriteAttr
    ld  de,SPRITE_ATTR
    ld  bc,4
    call LDIRVM

Loop:
    jr Loop

; --- Datos ---
SpriteAttr:
    db 88,120,0,2

; Sprite cuadrado 16x16 (4 patrones 8x8 = 32 bytes)
SpritePattern:
    db %11111111,%11111111,%11111111,%11111111
    db %11111111,%11111111,%11111111,%11111111
    db %11111111,%11111111,%11111111,%11111111
    db %11111111,%11111111,%11111111,%11111111
    db %11111111,%11111111,%11111111,%11111111
    db %11111111,%11111111,%11111111,%11111111
    db %11111111,%11111111,%11111111,%11111111
    db %11111111,%11111111,%11111111,%11111111

; --- LDIRVM wrapper ---
LDIRVM:
    push af
    push bc
    push de
    push hl
    call LDIRVM_BIOS
    pop hl
    pop de
    pop bc
    pop af
    ret
