# SCREEN 5: trazos rápidos sin huecos

Se reproduce el fallo anterior con `SCREEN5_STROKE_BASELINE=1 node scripts/check_screen5_drag_painting.mjs`: falla la comprobación de la primera fila. El código anterior solo pinta las posiciones recibidas y cada actualización parte del último render.

La corrección interpola celdas entre muestras y acumula un estado lógico del trazo actualizado inmediatamente. Cada evento publica un único patch acumulativo; no se publica un cambio por cada celda interpolada. Esto evita que varios eventos recibidos antes del siguiente render sobrescriban sus cambios. La posición final de mouseup también se procesa; al salir del lienzo se completa el segmento hasta el borde. Soltar fuera, perder foco o usar el atajo de historial termina el trazo. Los movimientos dentro de la misma celda no vuelven a escribir datos.

Se conserva el comportamiento de pincel normal, borrador, mezcla aleatoria estable y autotiles con resolución de vecinos. Stamps/metatiles y relleno conservan sus rutas de clic. No se cambian dimensiones ni el contrato de composición a 192 líneas. No se introduce Rust ni procesamiento asíncrono.

Para reducir el bloqueo, la caché del fondo usa `ImageData` y una tabla RGBA preparada por paleta. El historial compara los assets cuyo objeto cambia, conservando la igualdad JSON de clones con contenido idéntico. No se desactiva undo/redo ni se agrupa todo el trazo en una sola acción: cada muestra que produce un cambio genera una acción con todas sus celdas intermedias.

## Validación

- `node scripts/check_screen5_drag_painting.mjs`: 80 salas; cuatro eventos en una sola tarea JS conservan 42 celdas y sus flags, comportamiento y forma de colisión. Incluye undo/redo, diagonal, permanencia en una celda, repaint sin efecto, borrado, locks, Select, relleno, mix, terreno y fin de trazo. Incluye entrada nativa a zoom 2/3 con CPU throttling 4×.
- `node scripts/check_screen5_editor_rendering.mjs`: 16 comparaciones visuales byte/píxel idénticas al editor base.
- `node scripts/check_screen5_type_regressions.mjs`: sin diagnósticos nuevos; 21 diagnósticos anteriores y 21 actuales en los entry points y dependencias. El `tsc` general agotó su heap de 4 GB; el chequeo focalizado se compara contra las fuentes previas en memoria, sin modificar archivos.
- `node scripts/check_msx2_entity_editor_contract.mjs`: correcto.
- `npm run build`: correcto, con el aviso existente de chunks grandes.

## Medición orientativa

Banco del estudio anterior, componente real + hook de historial, 30 muestras tras 5 calentamientos. Caso de 80 salas y 256 entradas de atlas por sala:

| Operación con historial | Antes p50 / p95 | Después p50 / p95 |
|---|---:|---:|
| Cambio de metadatos | 73,4 / 121,8 ms | 7,0 / 9,0 ms |
| Cambio de composición | 148,7 / 168,7 ms | 8,8 / 12,2 ms |

Son tiempos síncronos de actualización en un harness headless, no latencia input→pantalla ni FPS de la aplicación completa. Los datos sintéticos, JIT/GC y otras cargas del equipo introducen variación. El caso grande se midió después de terminar el build; los casos pequeños de esa ejecución pudieron coincidir con él. El tiempo `burstDispatchMs` del test funcional mide solo envío de eventos y no se usa como rendimiento de renderizado.

Datos originales: `test/perf-screen5/results.json`. Datos posteriores: `test/perf-screen5/after-drag/results.json`. Prueba de recorrido: `test/perf-screen5/drag-result.json`.

Para repetir las medidas posteriores sin sobrescribir el estudio:

```powershell
$env:PERF_OUTPUT_DIR='test/perf-screen5/after-drag'
$env:PERF_CURRENT_ONLY='1'
node scripts/perf_screen5_study.mjs
Remove-Item Env:PERF_OUTPUT_DIR, Env:PERF_CURRENT_ONLY
```

La interpolación reconstruye segmentos rectos entre posiciones entregadas por el navegador. No puede recuperar curvas intermedias que el navegador no haya comunicado. Falta contrastar la sensación de edición con el proyecto concreto del usuario.
