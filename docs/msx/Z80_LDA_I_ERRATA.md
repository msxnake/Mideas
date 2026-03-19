# Z80 `ld a, i` / `ld a, r` Errata — Interrupt Flag Race Condition

## Descripción del Bug

El Z80 tiene un bug de hardware documentado (errata) en las instrucciones `ld a, i` y `ld a, r`. Estas instrucciones copian el estado de IFF2 (Interrupt Flip-Flop 2) al flag P/V del registro F.

**El problema**: Si una interrupción ocurre entre la ejecución de `ld a, i` y el siguiente `push af` (o cualquier instrucción que lea los flags), el flag P/V se pone a 0 independientemente del estado real de IFF2.

## Patrón Vulnerable

```asm
; PELIGROSO - NO USAR
ld a, i          ; Copia IFF2 a P/V
push af          ; ← Si IRQ cae aquí, P/V = 0 (incorrecto)
di               ; Deshabilita interrupciones
; ... operaciones con VRAM ...
pop af           ; Recupera flags (P/V puede ser incorrecto)
ret po           ; Si P/V=0 → NO ejecuta ei → interrupciones quedan OFF
ei               ; Solo se ejecuta si P/V=1
ret
```

## Consecuencia en MSX

1. `ld a, i` lee IFF2=1 (interrupciones habilitadas), P/V debería ser 1
2. Una interrupción del VDP (cada ~16.7ms en PAL, ~13.3ms en NTSC) cae entre `ld a, i` y `push af`
3. P/V se corrompe a 0
4. `ret po` (return if P/V=0) salta el `ei`
5. Las interrupciones quedan **permanentemente deshabilitadas**
6. El siguiente `halt` en el game loop congela el sistema (espera una interrupción que nunca llega)

## Síntomas

- El juego se congela después de unos segundos de ejecución (aleatorio, depende del timing de IRQ)
- Más probable cuando hay accesos frecuentes a VRAM (más llamadas a funciones afectadas)
- El freeze es permanente — requiere reset

## Archivos Afectados en Mideas (Corregidos 2026-03-18)

### `utils/msxGenerator/generators/directHardwareGenerator.ts`
- **FAST_LDIRVM**: Transferencia de bloque CPU→VRAM
- **FAST_LDIRVM_256**: Transferencia de 256 bytes CPU→VRAM
- **FAST_WRTVRM**: Escritura de un byte a VRAM

### `utils/msxGenerator/generators/animatedTilesGenerator.ts`
- **update_animated_tiles_vram**: Actualización de tiles animados en VRAM

## Solución Aplicada

Reemplazar el patrón `ld a, i` / `ret po` con `di` / `ei` incondicional:

```asm
; CORRECTO - Solución segura
di               ; Deshabilita interrupciones incondicionalmente
; ... operaciones con VRAM ...
ei               ; Rehabilita interrupciones incondicionalmente
ret
```

**Justificación**: Todas las funciones afectadas se llaman desde el game loop principal, donde las interrupciones siempre están habilitadas. No hay caso en el que se llamen con interrupciones deshabilitadas, por lo tanto `di`/`ei` incondicional es seguro y correcto.

## Referencias

- Zilog Z80 CPU User Manual — Errata conocida
- [Z80 ld a,i bug](http://www.z80.info/z80undoc.htm) — Documentación de la comunidad
- MSX Assembly Page — Reportes similares en contexto MSX

## Regla para Generadores ASM

> **NUNCA usar `ld a, i` + `ret po`/`jp po` para preservar/restaurar el estado de interrupciones.**
> Usar `di` / `ei` incondicional cuando el contexto de llamada garantiza que las interrupciones están habilitadas (game loop, main thread).
> Si se necesita preservar el estado de interrupciones en un contexto desconocido, usar un flag en RAM en lugar de `ld a, i`.
