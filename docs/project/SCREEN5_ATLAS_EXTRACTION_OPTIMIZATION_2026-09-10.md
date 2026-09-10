# SCREEN 5: extracción de atlas sin copias completas

Primera optimización conservadora del análisis de cuellos de botella MSX2.

`extractAtlasEntryPixels` normalizaba el atlas completo para extraer cada entrada.
Ahora normaliza exclusivamente el rectángulo solicitado. Conserva el recorte,
los ceros para píxeles ausentes, la conversión a índices de cuatro bits y matrices
de salida independientes. No introduce cachés ni modifica los datos del proyecto.
El coste por extracción pasa de área del atlas más área del tile a área del tile.
Las dos pasadas de empaquetado siguen funcionando con el mismo orden y resultado.

No se modifican instrucciones ASM, contratos de registros, flags, pila, VDP,
bancos ni temporización del runtime. Tampoco cambia el formato JSON.

## Validación

- `npm run test:msx2-atlas-extraction`: 600 casos deterministas comparados con
  el módulo anterior del commit `79537efd7866382b95a72ba242f92ba0a04b47d5`.
  Incluye bordes, tamaños nulos, filas incompletas, valores de color no válidos,
  límites de 16x16, inmutabilidad, independencia de la salida y nuevas ediciones.
- Un contador de acceso confirma 256 lecturas para un tile 16x16.
- Todos los archivos generados son idénticos en seis fixtures: bitmap intro,
  boss_def, shoot_verify, slime_mix, scripted_enemy y test501_bats.
- Glass compiló las MegaROM de shoot_verify antes/después; los binarios son
  idénticos.
- OpenMSX, Philips NMS 8250, mapper Konami, velocidad normal: dos ejecuciones
  de 15 segundos con la misma secuencia después del arranque (derecha, disparo
  N, izquierda y salto SPACE). Las seis capturas coinciden píxel a píxel y los
  logs de X/Y, sala, animación, balas, PC/SP y arranques son idénticos. Se observa
  una bala activa al disparar y un único arranque por ejecución. Esta prueba
  cubre la fixture de disparos; no sustituye recorrer todos los juegos.
- `node scripts/check_msx2_dark_atlas_prefix.mjs`: tres comprobaciones correctas.
- `npm run build`: correcto, con aviso de tamaño de chunks.

Ensayo aislado local: 208 extracciones 16x16 desde un atlas 256x352, una ronda
de calentamiento y seis muestras alternando el orden. Mediana anterior 739,50 ms;
nueva 2,95 ms. No representa el tiempo total de exportación ni los FPS del juego.

## Siguientes candidatos

Tratar por separado las copias de capas durante rellenos y el ritmo de commits
al pintar, con pruebas de undo/redo y guardar/reabrir. Las optimizaciones de
colores SAT, input, colisiones y VRAM requieren pruebas específicas de runtime
en OpenMSX antes de aceptarlas. Esta primera entrega solo cubre la extracción.
