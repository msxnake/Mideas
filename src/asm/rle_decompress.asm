;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
;; RUTINA DE DESCOMPRESIÓN SuperRLE (LITERAL + RLE + PATRONES LZ)
;;
;; Parámetros de Entrada:
;;   - HL: Puntero a la dirección de origen (datos comprimidos).
;;   - DE: Puntero a la dirección de destino (donde se descomprimen los datos).
;;
;; Formato de Compresión:
;;   - Byte de control N:
;;     - N de 1-126: Copia Literal. Copia los siguientes N bytes.
;;     - N = 127: Escape para Copia de Patrón. Los 2 bytes siguientes son
;;                  [CONTEO, DESPLAZAMIENTO]. Copia CONTEO bytes desde la
;;                  dirección (DESTINO_ACTUAL - DESPLAZAMIENTO).
;;     - N de 128-255: Repetición RLE. Repite el siguiente byte (256-N) veces.
;;     - N = 0: Fin de los datos.
;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

DecompressSuperRLE:
.loop
    LD A, (HL)          ; Cargar el byte de control
    INC HL
    OR A                ; ¿Es cero?
    RET Z               ; Sí, fin de los datos, retornar.

    CP 127              ; ¿Es el código de escape para patrón (127)?
    JR Z, .is_pattern   ; Sí, saltar a la lógica de patrones.

    BIT 7, A            ; ¿Está activado el bit 7 (N >= 128)?
    JR NZ, .is_repeat   ; Sí, es una repetición RLE.

.is_literal             ; Rango 1-126 (0x01 - 0x7E)
    LD C, A             ; C = número de bytes a copiar
    LD B, 0             ; BC = número de bytes a copiar
    LDIR                ; Copia BC bytes de (HL) a (DE)
    JR .loop

.is_repeat              ; Rango 128-255 (0x80 - 0xFF)
    LD B, A             ; Guardar valor de control en B
    XOR A               ; A = 0
    SUB B               ; A = 256 - B (número de repeticiones)
    LD B, A             ; B = contador de repeticiones
    LD A, (HL)          ; A = valor a repetir (leído después del byte de control)
    INC HL
.repeat_byte_loop
    LD (DE), A
    INC DE
    DJNZ .repeat_byte_loop
    JR .loop

.is_pattern             ; Control fue 127 (0x7F)
    LD C, (HL)          ; C = CONTEO de bytes a copiar del patrón
    INC HL
    LD A, (HL)          ; A = DESPLAZAMIENTO hacia atrás (offset)
    INC HL

    PUSH HL             ; Guardar puntero de datos comprimidos (origen)
    PUSH BC             ; Guardar contador (C en BC)

    LD H, D             ; HL = DE (puntero de destino actual)
    LD L, E

    LD B, 0             ; BC = desplazamiento (B=0, C=offset_val_A)
    LD C, A

    SBC HL, BC          ; HL = DE - Desplazamiento. HL es ahora el ORIGEN de la copia del patrón.
                        ; El buffer de destino (DE) se usa como fuente para el patrón.

    POP BC              ; Recuperar contador en BC (B=0, C=conteo_original)

    ; Ahora:
    ; HL = origen de la copia (en el buffer de destino ya descomprimido)
    ; DE = destino de la copia (donde se escribirán los bytes del patrón)
    ; BC = contador de bytes a copiar
    LDIR                ; Copia el patrón

    POP HL              ; Restaurar el puntero de datos comprimidos
    JR .loop
