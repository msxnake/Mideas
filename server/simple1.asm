; MSX ROM 16KB (cabecera "AB")
; SCREEN 2 + colores (FOR=15, BAK=1, BDR=1)
; Sprite cuadrado 16x16 en el centro
; Bucle infinito
;
; Ensamblable con Glass.jar -> genera .rom (16KB si rellenas hasta 8000h)

            org     4000h

; -------------------------
; Cabecera ROM MSX
; -------------------------
            db      "AB"        ; ID
            dw      init        ; INIT
            dw      0           ; STATEMENT (no usado)
            dw      0           ; DEVICE (no usado)
            ds      8,0         ; Reservado hasta 16 bytes de cabecera

; -------------------------
; BIOS calls (MSX)
; -------------------------
CHGMOD      equ     005Fh
CHGCLR      equ     0062h
CLRSPR      equ     0069h
WRTVDP      equ     0047h
LDIRVM      equ     005Ch

; -------------------------
; System variables (MSX)
; -------------------------
RG1SAV      equ     0F3E0h
FORCLR      equ     0F3E9h
BAKCLR      equ     0F3EAh
BDRCLR      equ     0F3EBh

; -------------------------
; VRAM addresses (SCREEN 2 defaults)
; -------------------------
SPR_PAT_BASE   equ  03800h   ; Sprite pattern generator
SPR_ATTR_BASE  equ  01B00h   ; Sprite attribute table

; Centro aprox para sprite 16x16 en 256x192
SPR_X       equ     120
SPR_Y       equ     88

; -------------------------
; INIT (llamado por BIOS al arrancar)
; -------------------------
init:
            di
            ld      sp,0F380h       ; stack seguro en RAM (típico MSX)

            ; SCREEN 2
            ld      a,2
            call    CHGMOD

          
            ld      a,1
            ld      (BDRCLR),a
            call    CHGCLR

          
            ; Limpia sprites
           ;call    CLRSPR

            ; Limpiar patterns para fondo negro
            ; En SCREEN 2, llenar pattern table con 0x00
            ld      hl,0000h            ; VRAM destino (pattern name table)
            ld      bc,0300h            ; 768 bytes (256x3 banks)
            ld      a,0
            call    fill_vram

            ; Llenar color table con negro (0x11 = negro/negro)
            ld      hl,2000h            ; Color table en SCREEN 2
            ld      bc,8         ; 6144 bytes (256x3 banks x 8)
            ld      a,11h               ; Negro foreground + Negro background
            call    fill_vram

            ; Forzar sprites 16x16 (R1 bit1=1) y magnificación OFF (bit0=0)
            ld      a,(RG1SAV)
            or      00000010b
            and     11111110b
            ld      (RG1SAV),a
            ld      b,1
            call    WRTVDP

            ; Cargar patrón del sprite (32 bytes) en patrón 0
            ld      hl,SpritePat
            ld      de,SPR_PAT_BASE
            ld      bc,32
            call    LDIRVM

            ; Atributos: sprite 0 + fin de lista
            ld      hl,SpriteAttr
            ld      de,SPR_ATTR_BASE
            ld      bc,8
            call    LDIRVM

; Bucle infinito
main_loop:
            jr      main_loop

; -------------------------
; fill_vram - Llenar región VRAM con un byte
; -------------------------
; Inputs:
;   HL = dirección VRAM destino
;   BC = cantidad de bytes
;   A = byte a escribir
; -------------------------
fill_vram:
            push    af
            push    bc
            push    de
            push    hl

            ld      d,a                 ; Guardar byte en D
            ld      a,l                 ; Set VRAM address (low byte)
            out     (099h),a            ; Puerto de dirección VDP
            ld      a,h                 ; VRAM address (high byte)
            or      01000000b           ; Set write bit
            out     (099h),a            ; Puerto de dirección VDP

.loop:
            ld      a,d                 ; Recuperar byte
            out     (098h),a            ; Escribir a VRAM (puerto de datos)
            dec     bc
            ld      a,b
            or      c
            jr      nz,.loop

            pop     hl
            pop     de
            pop     bc
            pop     af
            ret

; -------------------------
; Data
; -------------------------
; Sprite 16x16 lleno (cuadrado): 32 bytes a FFh
SpritePat:
            db 0FFh,0FFh,0FFh,0FFh,0FFh,0FFh,0FFh,0FFh
            db 0FFh,0FFh,0FFh,0FFh,0FFh,0FFh,0FFh,0FFh
            db 0FFh,0FFh,0FFh,0FFh,0FFh,0FFh,0FFh,0FFh
            db 0FFh,0FFh,0FFh,0FFh,0FFh,0FFh,0FFh,0FFh

; Atributos del sprite:
;   Byte0 Y, Byte1 X, Byte2 patrón (0), Byte3 color (15)
;   Siguiente entrada con Y=0D0h marca fin
SpriteAttr:
            db  SPR_Y, SPR_X, 0, 15
            db  0D0h,  0,     0, 0

; -------------------------
; Relleno a 16KB (4000h-7FFFh)
; -------------------------
            ds      8000h - $, 0

            end
