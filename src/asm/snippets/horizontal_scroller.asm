;- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- -
; HORIZONTAL SCROLLER
; Eduardo A. Robsy Petrus [25/04/2005]
; (c) Karoshi Corporation, 2005
;- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- -
; - Core routine size: 86 bytes.
; - Full frame rate (50/60 Hz)
; - Supports any 8x8 type set
;- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- -
; PROs: Fast and compact.
; CONs: Only 8x8 fonts supported.
;- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- -

;- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- -
; asMSX DIRECTIVES
;- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- -
.bios
.page 2
.rom
.start INIT

;- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- -
; CONSTANTS
;- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- -
FORCLR equ #F3E9

;- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- -
; PROGRAM CODE
;- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- -
INIT:
; Color 15,0,0
ld hl,FORCLR
ld [hl],15
inc hl
xor a
ld [hl],a
inc hl
ld [hl],a
; Screen 2
call INIGRP
call DISSCR
; Set color
ld hl,#2000+23*32*8
ld bc,32*8
ld a,#F0
call FILVRM
call ENASCR

; Vacia el buffer (256 bytes)
ld hl,BUFFER
xor a
ld b,a
@@CLEAR:
ld [hl],a
inc hl
djnz @@CLEAR

@@RESTART:
ld hl,TEXT ; comienzo del texto del scroll
@@SCROLLER:
ld de,BUFFER+32*8 ; guarda la dirección de la columna "32"
ld a,[hl] ; carga el siguiente caracter a imprimir
inc hl
cp 27 ; es el codigo ASCII 27
jr z,@@RESTART ; si es cierto, reinicia el scroll
push hl ; si no lo es...
ld l,a
ld h,0
add hl,hl
add hl,hl
add hl,hl
ld bc,FONT-32*8
add hl,bc ; ...calcula la posicion en la fuente de los datos del caracter...
ld bc,8
ldir ; ...y los vuelca a la columna virtual que queda fuera de pantalla (la 32)

ld b,8 ; repetiremos el scroll 8 veces hasta que un caracter haya sido desplazado fuera de pantalla
@@SCROLL:
push bc

halt ; sincroniza con el vblank
@@WAIT:
ld hl,32*23*8
call SETWRT ; prepara para escritura el VDP al inicio de la ultima fila de caracteres

ld hl,BUFFER
push hl
ld c,#98
ld b,0
otir ; vuelca del buffer a la VRAM 256 bytes
pop de ; DE=BUFFER
ld hl,BUFFER-8
ld bc,256+8 ; repetimos tantas veces como bytes tenemos en el buffer
@@SHIFT:
ld a,[de] ; cargamos un byte de un caracter
sla a ; lo desplazamos a la izquierda a traves del carry
ld [de],a ; y lo volvemos a dejar en su sitio
ld a,0 ; ¡importante!, A debe ser 0 pero no podemos modificar el contenido del carry
rla ; rotamos a la izquierda A a traves del carry, introducimos el bit que desplazamos anteriormente
or [hl] ; lo mezclamos con el byte que esta a su "izquierda"
ld [hl],a ; y lo dejamos tambien en su sitio
inc hl ; nos posicionamos en los siguientes caracteres
inc de
dec bc
ld a,b
or c ; hemos acabado
jr nz,@@SHIFT ; si no repetimos

pop bc
djnz @@SCROLL ; repetimos hasta sacar un caracter fuera de pantalla

pop hl
jr @@SCROLLER

;- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- -
; SCROLLER TEXT
; Use ASCII code 27 (ESC) to define end
;- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- -
TEXT:
db "Esto es un scroll fantastico. "
db "Se mueve sin problemas y a toda velocidad. "
db "Ademas, el codigo es muy compacto. "
db "Puedes usar cualquier tipo de 8x8. "
db 27

FONT:
.INCBIN "FONT.CHR" ; 2KB 8x8 font (256 characters)

BUFFER:
.DS 256,0
