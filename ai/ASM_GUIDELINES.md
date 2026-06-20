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

## Estado Global del VDP (no solo registros de CPU)

La regla de preservación NO se limita a los registros de CPU. Una rutina también puede dejar
"clobbeado" el estado global del VDP que otra rutina asume:

- **R#15** (status register select): `bitmap_wait_vblank` asume R#15=0 para leer S#0 bit7
  (vblank). Cualquier `read_vdp_status_2` lo deja en 2.
- **R#17** (indirect register pointer): el command engine lo mueve.
- **Registros de mapper** (bancos Konami #6000/#8000/#A000).

Regla: si una rutina cambia R#15/R#17/banks, debe restaurarlos antes de salir o documentarlo
en su cabecera para que el caller lo restaure. Un caller no debe asumir estado VDP estable a
través de un `call` igual que no asume registros estables.

### Tabla de clobbers — helpers VDP del runtime bitmap (`msx2Screen4BitmapRoomGenerator.ts`)

| Rutina                          | Destruye            | Notas |
|---------------------------------|---------------------|-------|
| `vdp_write_register`            | AF                  | A=reg, E=valor; preserva BC/DE/HL |
| `vdp_reinit_cmd_pointer`        | AF, **E**           | `ld e,#20` — clobbea E |
| `vdp_wait_cmd_ready`            | AF                  | deja R#15=2 (lee S#2) |
| `replay_room_commands`          | AF, BC, **DE**, HL  | hereda clobber de E; deja R#15=2 |
| `load_room`                     | AF, BC, DE, HL      | restaura R#15=0 al final |
| `copy_to_vram_ext`              | AF, BC, DE, HL      | |
| `decompress_bitmap_rle_to_vram` | AF, BC, DE, HL      | |

## Primera Hipótesis ante Bugs

Ante un bug difícil de encontrar, asumir primero:

"Algún registro de CPU o estado global del VDP (R#15/R#17/banks) no está siendo preservado
correctamente a través de un `call`."

Casos reales registrados en `LESSONS_LEARNED.md` (2026-06-20): DE clobbeado por
`replay_room_commands` (colisión basura) y R#15 sin restaurar (lag tras transición).

## Convención de Función

Cada función exportada por un componente debe declarar su contrato:

- INPUT
- OUTPUT
- DESTROYS
- PRESERVES

Una función no documentada no debe utilizarse desde otro componente.
