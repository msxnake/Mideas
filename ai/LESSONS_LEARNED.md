# Lessons Learned

## Plantilla

Fecha:

Problema:

Causa:

Solucion:

Leccion Aprendida:

---

## Criterio de Registro

Registrar solo lecciones esenciales de bugs resueltos.
La prioridad es identificar tipos de fallo que puedan repetirse y dejar una prevencion clara.
Evitar detalles accidentales que no ayuden a prevenir futuros bugs.

---

## Ejemplo 1

Fecha: 2026-06-04

Problema:
Bug aleatorio en movimiento.

Causa:
Registro HL destruido.

Solucion:
Preservar HL.

Leccion:
Revisar siempre DESTROYS/PRESERVES.

---

## Ejemplo 2

Fecha: 2026-06-04

Problema:
La ROM compila, pero el comportamiento en pantalla es erratico.

Causa probable:
Una rutina ASM modifico un registro usado por otra rutina sin documentarlo.

Solucion:
Anadir cabecera ASM obligatoria y revisar PUSH/POP.

Leccion:
Los bugs mas dificiles en ASM suelen venir de registros no preservados.

---

## Bug Resuelto: etiqueta de rutina absorbida por EQU

Fecha: 2026-06-04

Problema:
ROM MSX2 compila y muestra la pantalla correcta, pero al primer ciclo de gameplay vuelve a inicializarse y alterna con pantalla azul.

Causa:
Una etiqueta callable de ASM quedaba inmediatamente antes de un bloque de constantes EQU. Glass resolvio la etiqueta como 0H y un JP generado salto a #0000, reiniciando la ROM.

Solucion:
Separar la etiqueta callable del bloque EQU con una instruccion real y verificar en el .sym que las rutinas callable no resuelven a 0H. Tambien sustituir direcciones BIOS/VDP magicas por constantes nominales.

Leccion:
En generadores ASM, nunca dejar una etiqueta de rutina pegada a constantes EQU. Tras cambios de game loop, revisar .sym para etiquetas callable en 0H y asumir salto/reset por corrupcion de simbolos antes de buscar timers.

---

## Bug Resuelto: facing visual mezclado con delta de movimiento

Fecha: 2026-06-05

Problema:
Player MSX2 con animaciones por rol podia perder mirror al volver a idle despues de girarse.

Causa:
El runtime usaba msx2_player_sprite_dx tanto como delta/input transitorio como orientacion visual. El state machine escribia 0 al estar idle, borrando el facing. Ademas los patrones de hardware sprite 16x16 deben indexarse en SAT de 4 en 4.

Solucion:
Separar la orientacion visual en msx2_player_facing_dx y usarla para mirror de idle/walk. Generar variantes mirror por rol cuando usesFlipX esta activo. Mantener aritmetica SAT de patrones 16x16 con offset *4.

Leccion:
No reutilizar variables de movimiento transitorio como estado visual persistente. Para sprites hardware MSX2, validar siempre que los indices SAT apuntan a patrones 16x16 completos: grupo N => pattern index N*4.

---

## Bug Resuelto: configuracion oculta seguia controlando animacion

Fecha: 2026-06-05

Problema:
Player Config ya solo debia asignar el Render MSX2, pero la animacion seguia saliendo mal.

Causa:
El editor oculto/retirado ya no mostraba frames y velocidad, pero el runtime/generador seguia usando los frames/speed antiguos guardados dentro del Player en vez de derivarlos del MSX2 Sprite Render asignado.

Solucion:
Al asignar Render, sincronizar frames/speed/playback desde el MSX2 Sprite. En el generador MSX2, ignorar la secuencia vieja del Player y construir los mapas de frame desde los frames reales del Render.

Leccion:
Si una UI deja de ser fuente de verdad para un dato, el generador tambien debe dejar de consumir ese dato antiguo. Ocultar controles sin cambiar la fuente de datos deja bugs persistentes en proyectos ya guardados.

---

## Bug Resuelto: roles MSX2 con sprites distintos por animacion

Fecha: 2026-06-05

Problema:
Idle/walk mostraban graficos incorrectos cuando cada rol apuntaba a un asset MSX2 Sprite distinto (p. ej. `hero_idle` vs `hero_walk`).

Causa:
`playerRuntime_v2/dataGen` emitia patrones solo del sprite principal (`render.spriteAssetId`), pero cada rol anima frames de su propio asset. Walk leia indices sobre patrones de idle en VRAM.

Solucion:
Con roles activos, generar patrones por rol desde `role.sprite`, frame maps con indice unico dentro del blob del rol, y `basePatternIndex` separado para walk. Resolver frames y velocidad desde el MSX2 Sprite (`frames[]`, `animationSpeedMs`), no desde `animations.*.frames/speed` obsoletos del Player. Importar el Player con `parseMsx2PlayerImport` para no perder `animations` en exports `schema.player`.

Leccion:
Un rol no es solo una secuencia de indices sobre un mismo asset: si el Player asigna otro MSX2 Sprite al rol, el generador debe empaquetar y direccionar patrones por asset, no por el render principal unico. La fuente de verdad de la animacion es el MSX2 Sprite enlazado; el Player solo elige que asset usa cada rol.

---

## Bug Resuelto: sincronizacion React no idempotente

Fecha: 2026-06-06

Problema:
Al abrir Player Config, React avisaba `Maximum update depth exceeded`.

Causa:
Un `useEffect` sincronizaba animaciones del Player desde sprites enlazados y llamaba `onUpdate` repetidamente cuando React recreaba dependencias de objeto entre renders.

Solucion:
Guardar una firma de la sincronizacion aplicada y no reemitir el mismo `onUpdate` si el parche ya fue enviado.

Leccion:
Toda sincronizacion `useEffect -> onUpdate/setState` debe ser idempotente. Si depende de objetos normalizados o derivados, comparar una firma estable antes de escribir estado.

---

## Bug Resuelto: salto MSX2 con probes fijos de 16x16

Fecha: 2026-06-06

Problema:
Durante el salto de plataforma MSX2, el player podia filtrarse parcialmente en tiles solidos.

Causa:
La fisica vertical MSX2 movia pixel a pixel, pero las colisiones seguian usando probes fijos de sprite 16x16 (`x`, `x+15`, `y+16`) en vez de la hitbox real definida por Player Config. Con hitboxes desplazadas o mas altas que 16 px, los probes podian quedar fuera del cuerpo efectivo.

Solucion:
Generar probes verticales desde `hitboxes.body`, con inset interno y snap al borde de celda SCREEN 4 al aterrizar o golpear techo. Mantener `msx2_collision_at_pixel` como rutina compartida y respetar su contrato de registros.

Leccion:
En MSX2, no asumir 16x16 para fisica de plataforma si el Player Config ya define hitbox. El movimiento pixel a pixel evita tunelado por velocidad, pero no corrige probes mal colocados.
