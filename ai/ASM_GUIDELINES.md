# ASM Guidelines

## Regla Principal
Todo ASM generado debe documentarse.

Una rutina sin cabecera no se considera válida.

## Cabecera Obligatoria

Toda rutina debe empezar con este bloque:

```asm
; ------------------------------------------------------------
; FUNCTION: NombreRutina
; ------------------------------------------------------------
; PURPOSE:
;   Explicar qué hace la rutina.
;
; INPUT:
;   A  = valor de entrada
;   HL = puntero a datos
;
; OUTPUT:
;   A  = resultado
;
; DESTROYS:
;   AF, BC
;
; PRESERVES:
;   DE, HL, IX, IY
;
; CALLS:
;   OtraRutina
;
; SIDE EFFECTS:
;   Modifica RAM, VRAM, flags o variables globales.
;
; NOTES:
;   Restricciones, alineación a tiles, timing, VBlank, etc.
; ------------------------------------------------------------
```

## Preservación de Registros

Nunca asumir que un registro puede destruirse.

Documentar siempre:
- INPUT
- OUTPUT
- DESTROYS
- PRESERVES

## Registros Sensibles

Especial atención a:
- AF
- BC
- DE
- HL
- IX
- IY
- AF'
- BC'
- DE'
- HL'

## PUSH / POP

Toda rutina debe mantener equilibrio entre PUSH y POP.

Revisar:
- Rutas normales
- Salidas anticipadas
- RET condicionales
- CALLs internas
- Interrupciones

## Primera Hipótesis ante Bugs

Ante un bug difícil de encontrar, asumir primero:

"Algún registro no está siendo preservado correctamente."

## Convención de Función

Cada función exportada por un componente debe declarar su contrato:

- INPUT
- OUTPUT
- DESTROYS
- PRESERVES

Una función no documentada no debe utilizarse desde otro componente.
