# SCREEN 5: reutilización de patrones de enemigos

El exportador comparte los patrones idénticos de 16×16 de los enemigos, incluso
entre partes de un supersprite, frames, sentidos de marcha y capas de color.
La comparación usa los 32 bytes completos del patrón. Los colores por línea,
incluido CC/OR, siguen siendo independientes de cada slot y frame.
Una diferencia de un bit impide compartir ese patrón.

## Asignación y carga

`compactBitmapEnemyPatterns` prepara una tabla por sala: slot/frame/variante →
grupo físico. Los patrones únicos forman un pool contiguo. Las salas que usan
un subconjunto del mismo arte comparten el pool de ROM; sus tablas conservan
sus propias referencias. Se reserva en VRAM el mayor pool necesario.

La carga de sala copia la tabla a RAM y sube el pool una sola vez. Las salas
vacías no realizan una copia de patrones de longitud cero. La publicación SAT
lee la tabla de RAM, sin cambiar bancos. En MegaROM, los copiadores residentes
restauran P2/P3 antes de volver al código de enemigos de P2.

La optimización se activa si reduce la reserva de VRAM y el tamaño de los pools
y tablas gráficos no supera el banco de patrones original. Los proyectos que
no cumplen ambas condiciones conservan el camino anterior. La comparación de
datos gráficos no incluye el código ni las tablas de punteros residentes:
no garantiza una reducción del tamaño final de la ROM.

La tabla añade `sum(maxFrames × variantesPorSlot)` bytes de RAM (16 en la
prueba normal, 24 en la prueba mixta de techo). La rutina SAT usa unas pocas
instrucciones más por pieza. El camino compacto también espacia las escrituras
al VDP: una sonda fuera de VBlank detectó pérdidas de bytes consecutivos al
ocultar sprites en el camino antiguo; las escrituras compactas se verificaron
también en ese contexto. La batería reproducible publica al comienzo de VBlank.

Contratos: carga destruye AF/BC/DE/HL y conserva IX/IY; SAT y colores conservan
BC/HL/IX/IY, destruyen AF/DE y restauran R14=0. La caché de colores sigue
invalidándose al entrar en una sala. El stride del pool no cambia.

## Evidencia con el soldado de test744

Sprite `msx2sprite_soldado_boina_verde_w1_20261008`, dos frames walk de 16×32.
Las dos capas superiores son idénticas en ambos frames. La conversión produce
cuatro capas de hardware por frame; los ocho patrones sin giros tienen seis
patrones únicos.

| Prueba dirigida | Antes | Después |
|---|---:|---:|
| Grupos de VRAM, derecha/izquierda | 16 | 12 |
| Datos de patrones + mapas de las salas de prueba | 512 B | 432 B |
| Grupos de VRAM, variantes mixtas de techo | 24 | 16 |
| Datos de patrones + mapas, prueba de techo | 1024 B | 584 B |

Son cifras de las fixtures dirigidas con ese sprite, no del proyecto completo.
No se modifica el JSON del usuario. La segunda versión, «alternativa agente»,
tiene más capas de color. La corrección posterior de
[asignación de slots](SCREEN5_ENEMY_SLOT_ALLOCATION_2026-10-09.md) elimina el
límite artificial de cuatro y permite compilar el proyecto completo.
Reutilizar patrones no reduce los sprites simultáneos de SAT ni
el límite por línea. El jugador, las armas, los jefes y las balas conservan sus
asignadores actuales. La política de gráficos residentes por mundo queda fuera
de este cambio.

## Validación reproducible

```powershell
./test/msx2-sprite-pattern-compaction/run_validation.ps1
./test/msx2-sprite-pattern-compaction/run_validation.ps1 -Project C:/Users/salam/Downloads/test744.json
node scripts/check_msx2_enemy_color_cache.mjs
node scripts/check_msx2_sprite_part_offsets.mjs
node scripts/check_bitmap_ram_aliasing.mjs
```

El primer comando usa un supersprite multicolor sintético; el segundo extrae
el soldado del proyecto. Compilan ocho cartuchos con Glass y ejecutan 76 casos
en OpenMSX Philips NMS 8250: originales/compactos, normal/MegaROM, animación,
giros horizontales, techo, caída, sala vacía, reutilización de slots, retorno,
enemigo muerto y salas con el mismo pool. Se verifican todos los bytes del
patrón referenciado por SAT, colores, geometría, terminador y registros.
También se compila un juego completo con el exportador, comprobando que su
asignación de VRAM usa el número compacto. Las salidas se guardan en una carpeta
temporal cuyo manifiesto aparece al terminar. No se ha probado en MSX físico.

La prueba histórica de caché de colores desactiva explícitamente la compacción
en ambos generadores para aislar su contrato original. Normaliza únicamente
el crecimiento esperado de caché en el mapa JSON de RAM y reconoce equates con
comentarios. Sus controles negativos de invalidación, comparación y validez
continúan detectándose.
