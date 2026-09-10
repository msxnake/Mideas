# Estudio de rendimiento SCREEN 5: React, Workers y Rust/WASM

Fecha: 2026-09-05. Objetivo: reducir bloqueos al editar sin cambiar funcionalidades, formatos ni la composición de 192 líneas compartida con SCREEN 2/4 y WorldView.

## Decisión recomendada

**Primero reducir el trabajo de historial y rasterización en JavaScript. Reservar Workers para trabajos en lote y valorar Rust después.** El prototipo Rust funciona, pero sustituir únicamente el compositor no resolvería los mayores costes observados.

Orden propuesto:

1. Evitar serializar todos los assets para detectar un cambio de un solo asset.
2. Sustituir la reconstrucción del fondo con miles de `fillRect` por un buffer `ImageData`, conservando la caché actual.
3. Medir el editor completo con un proyecto real y revisar actualizaciones redundantes durante un trazo.
4. Usar un Worker persistente para composiciones y miniaturas en lote si siguen bloqueando la interfaz.
5. Adoptar Rust/WASM solo para un núcleo que siga siendo costoso después de lo anterior y cuyo beneficio extremo a extremo quede demostrado.

Este estudio añade bancos de pruebas y un prototipo aislado. **No integra Rust ni cambia el historial o el renderizador de producción.** Se conserva la optimización de caché realizada en el trabajo anterior.

## Qué se ha medido

Entorno: Windows, AMD Ryzen 7 8745HS, Chromium 131.0.6778.33 de Playwright, React con build de producción habilitada para profiling. Rust 1.92.0, `wasm32-unknown-unknown`, optimización 3, panic abort y símbolos eliminados.

Se monta el componente real `Msx2BitmapScreenEditor` en un contenedor de prueba. Se usa el hook real `useHistoryHandlers` cuando la variante incluye historial. Se comparan el código previo a la caché, commit `1f7c3cacb84eb70f5ac4ad8a5bc6d4fe24cebdac`, y el código de trabajo actual.

Casos sintéticos:

| Salas | Entradas de atlas por sala | Assets serializados, aproximadamente |
|---:|---:|---:|
| 1 | 32 | 0,098 MB |
| 20 | 128 | 2,08 MB |
| 80 | 256 | 9,00 MB |

Cada sala contiene un atlas de 256×128 y una composición de 192 comandos de copia que cubren 256×192. Las 256 entradas del caso grande reutilizan regiones del atlas: sirven para ejercer presión sobre la interfaz. Los assets de salas distintas son objetos independientes. No se altera ningún proyecto del usuario.

Por combinación: 5 actualizaciones de calentamiento y 30 muestras de cambios de metadatos y de composición. Se esperan dos `requestAnimationFrame` entre muestras. Se registran:

- Tiempo síncrono de `flushSync`: trabajo de actualización, commit y efectos que React ejecuta dentro de esa llamada. **No es latencia hasta presentación en pantalla ni FPS.**
- `Profiler.actualDuration`: renderizado del subárbol del editor. Incluye cálculos que se hacen dentro de sus hooks; no equivale a coste exclusivo de reconciliación React.
- Comparación JSON del historial aislada, fuera del componente.
- Composición pura con el código actual, JavaScript plano, Rust/WASM y Worker JavaScript.
- Rasterización aislada con `fillRect` y con `ImageData`, 5 calentamientos y 60 muestras.

Mediana = p50; p95 = percentil 95. Tiempos en milisegundos.

## 1. El historial escala con todo el proyecto

Ruta comprobada en el código:

`AppUI.handleUpdateBitmapRoom` → `useAssetHandlers.handleUpdateAsset` → `setAssetsWithHistory` → `pushToHistory`.

En `handlers/useHistoryHandlers.tsx:38` se ejecuta:

```ts
JSON.stringify(before) === JSON.stringify(after)
```

Para `ASSETS_UPDATE`, ambos valores son las listas completas de assets. El historial guarda referencias a los estados antes/después; el problema medido aquí es la serialización para decidir si hubo cambios, no una copia profunda explícita de todos los estados guardados.

Resultados del editor con la caché actual:

| Salas | Metadatos sin historial p50 | Metadatos con historial p50 / p95 | Cambio de composición con historial p50 / p95 |
|---:|---:|---:|---:|
| 1 | 4,6 | 6,1 / 7,2 | 29,1 / 45,3 |
| 20 | 5,0 | 21,1 / 23,6 | 65,9 / 81,5 |
| 80 | 5,9 | 73,4 / 121,8 | 148,7 / 168,7 |

La comparación JSON aislada tiene medianas de 2,0 / 24,3 / 106,7 ms para 1 / 20 / 80 salas. Son ensayos distintos: **no se deben sumar ni restar estos números a los del componente** para obtener un desglose exacto; influyen calentamiento, asignaciones y GC.

Recomendación: estudiar una comparación por assets afectados, aprovechando las referencias inmutables de los demás. Primero una salida rápida cuando `before === after`; después evitar recorrer los datos de assets que mantienen su referencia. Una comparación profunda de los assets realmente cambiados puede conservar la detección de operaciones sin efecto.

No sustituir sin más la comparación por `before !== after`: muchos productores pueden crear objetos nuevos con el mismo contenido. Validar adición, borrado, reordenación, sincronización de atlas, cambios sin efecto y todos los caminos undo/redo. Mantener la política actual del historial en esta primera optimización; agrupar un trazo en una sola acción es una decisión funcional separada.

## 2. La caché ayuda; reconstruirla sigue siendo caro

En una actualización de metadatos sin historial, la versión anterior tarda aproximadamente 27–28 ms de mediana frente a 4,6–5,9 ms con la caché actual. La mejora anterior es real en este banco.

Al modificar la composición hay que regenerar el fondo. La caché actual sigue rellenándolo píxel a píxel, dentro de `useMemo`. Por eso el Profiler puede mostrar unos 25 ms de renderizado aunque gran parte del trabajo sea Canvas dentro del hook. En el caso grande con historial, la mejora de caché **no reduce claramente el tiempo de pintar**: 146,7 ms antes y 148,7 ms después en estas medianas. No hay que extrapolar la mejora de selección a todos los usos.

Prototipo aislado de reconstrucción del fondo:

| Alto del canvas | `fillRect` p50 / p95 | `ImageData` p50 / p95 |
|---:|---:|---:|
| 192 | 19,3 / 23,0 | 0,3 / 0,4 |
| 212 | 21,3 / 24,0 | 0,3 / 0,4 |

La salida RGBA coincide byte a byte en ambos casos. La prueba usa 16 colores opacos válidos y reemplaza el slot 0 por un color de fondo. El canvas de 212 mantiene la composición a 192 y rellena el resto con el backdrop: **no amplía el área de juego**.

Es la oportunidad de renderizado más prometedora. No es todavía una medición de esa sustitución integrada en el editor ni una validación de todas las paletas posibles. Antes de integrarla: validar normalización de colores, slot 0, paleta de mundo, zoom, capas, contornos, HUD y undo/redo. Mantener `drawImage` sin suavizado para escalar el fondo y dibujar encima las capas actuales.

## 3. Rust/WASM: ventaja real, pero localizada

Se ha compilado y ejecutado en Chromium `scripts/perf/screen5_kernel.rs`. Implementa un núcleo experimental de copia/relleno de índices de color. La comparación medida usa una composición sintética de 192 copias válidas y comprueba sus 49.152 píxeles contra `renderComposition` del editor.

| Implementación | Una composición p50 / p95 | Lote de 64 p50 / p95 |
|---|---:|---:|
| Compositor original, matrices y objetos | 1,7 / 2,5 | 107,7 / 173,6 |
| JavaScript con buffers planos | 0,2 / 0,3 | 20,3 / 21,9 |
| Rust/WASM, incluyendo copia de entrada/salida | 0,1 / 0,1 | 6,8 / 8,9 |
| Worker JS con entradas residentes, ida/vuelta incluida | 0,7 / 0,9 | 20,8 / 22,7 |

El lote repite la misma composición 64 veces; **no es una ejecución real de WorldView con 64 salas distintas**. El Worker devuelve solo el último buffer del lote, no 64 imágenes. Esto mide computación sostenida e intercambio mínimo, y es optimista para una galería completa.

Otros límites importantes:

- La preparación de comandos planos, resolución de IDs y conversión de matrices a buffers queda fuera del tiempo de los núcleos planos. Rust incluye copiar esos buffers ya preparados a WASM y copiar la salida a JS. Se deben mantener preparados o incluir su coste en una integración real.
- El Worker recibe atlas/comandos una vez y los conserva. El lote no incluye enviar atlas distintos ni producir miniaturas, PNG o `ImageBitmap`.
- Los tiempos submilisegundo tienen resolución limitada. La diferencia de una décima no justifica por sí sola una migración.
- No se mide Rust dentro de un Worker. Combinar ambos es una propuesta arquitectónica, no un resultado de este ensayo.
- El prototipo Rust asume buffers y comandos válidos del banco. No tiene una API segura para cargar proyectos arbitrarios ni validación exhaustiva de comandos, recortes y datos heredados. No está listo para producción.

El WASM con símbolos eliminados ocupa 16.292 bytes. Instanciarlo desde bytes ya en memoria costó 11,4 ms en la muestra de arranque; el Worker JS tardó 2,6 ms. Son muestras únicas y no incluyen descarga. No crear una instancia nueva en cada clic.

**Conclusión:** para una pantalla aislada, JavaScript plano ya elimina la mayoría del coste del compositor. Rust empieza a ser interesante para lotes frecuentes, pero no evita el JSON del historial ni las llamadas Canvas. La representación de datos importa antes que el lenguaje.

## 4. Otros puntos del código a vigilar

Hallazgos estáticos, sin atribuirles tiempos no medidos:

- `components/AppUI.tsx:406`: al cambiar un atlas compartido, clona píxeles/entradas para cada sala del mundo, remapea el tile grid y puede reconstruir comandos. Su alcance es funcionalmente necesario; conviene distinguir cambios de píxeles, metadatos y orden de entradas antes de optimizar. No eliminar la sincronización entre salas.
- `components/editors/WorldViewEditor.tsx:321`: para bitmap genera Canvas y `toDataURL`. Ya existe `React.memo` y `useMemo` en `ScreenCanvas`; comprobar invalidaciones reales antes de añadir otra caché. Worker/OffscreenCanvas es candidato para lotes, no una necesidad demostrada aquí.
- `components/editors/Msx2BitmapScreenEditor.tsx`: paneles, miniaturas y selección viven en un componente grande; estabilizar props y dividir zonas puede ayudar. Las medidas de metadatos actuales muestran aproximadamente 1–2 ms de `actualDuration`, así que reescribir la interfaz entera no es la primera prioridad.
- `handlers/useProjectHandlers.tsx:739`: el guardado serializa el proyecto con indentación. Investigar las pausas de guardado/autoguardado en una traza del proyecto real. No se han medido aquí.
- `components/utils/msx2Screen5PresentationUtils.ts`: conversión de imágenes/paletas y empaquetado son candidatos aislables para worker/WASM. No se ha medido su peso ni se promete una aceleración.

## Plan de ejecución y criterios de aceptación

| Orden | Trabajo | Beneficio esperado a partir de la evidencia | Riesgo principal |
|---|---|---|---|
| P0 | Comparación de historial limitada a cambios | Evitar coste proporcional a todo el proyecto en cada edición | Perder undo/redo o registrar cambios sin efecto |
| P0 | Fondo con ImageData + caché existente | Reducir el coste de reconstrucción al pintar | Diferencias de color/transparencia |
| P1 | Traza de un proyecto real con editor completo | Confirmar dónde queda el bloqueo, incluyendo AppUI e historial | Confundir benchmark aislado con experiencia real |
| P1 | Buffers planos e invalidación por datos visuales | Reducir asignaciones y preparación de composiciones | Invalidar mal atlas/paleta o cambiar formato guardado |
| P2 | Worker persistente para miniaturas/importaciones | Liberar el hilo de interfaz durante lotes | Resultados antiguos, orden asíncrono y copias de datos |
| P3 | Núcleo Rust opcional, cargado una vez | Acelerar lotes que sigan siendo caros | Complejidad de compilación, validación y mantenimiento |

Objetivos propuestos, todavía no resultados: actualización local p95 por debajo de 16,7 ms en el equipo de referencia; ausencia de tareas del hilo principal de más de 50 ms durante trazos normales; una modificación local no debe serializar todos los atlas. Medir también latencia input→presentación y número de commits, sin inferirlos del tiempo de `flushSync`.

Para trabajadores asíncronos: enviar `roomId` y revisión; descartar respuestas de revisiones antiguas; no transferir un `ArrayBuffer` que el estado React siga utilizando; mantener un camino síncrono de respaldo; gestionar cierre y cancelación de trabajos. Conservar el JSON público, IDs y las 192 líneas de compatibilidad.

Antes de aceptar cambios: comparaciones de píxeles, trazo rápido, borrador, relleno, autotile, metatile, paletas de mundo, colisiones, foreground, entidades, cambio de sala, undo/redo, guardar/reabrir y pruebas SCREEN 2/4/WorldView. Si se altera un generador o datos exportados, añadir validación de ROM; este estudio no los cambia.

## Reproducir y revisar

Desde la raíz del repositorio:

```powershell
rustup target add wasm32-unknown-unknown
node scripts/perf_screen5_study.mjs
node scripts/perf_screen5_raster.mjs
node scripts/check_screen5_editor_rendering.mjs
```

Para repetir solo el núcleo conservando las medidas de editor existentes:

```powershell
$env:PERF_KERNEL_ONLY='1'
node scripts/perf_screen5_study.mjs
Remove-Item Env:PERF_KERNEL_ONLY
```

Resultados: `test/perf-screen5/results.json` y `test/perf-screen5/raster.json`. El benchmark regenera el WASM local. La prueba anterior de regresión compara 16 estados del editor con el código base; no valida la integración de los nuevos prototipos, que siguen aislados.

Limitaciones generales: ensayo en un único equipo y navegador headless, sin CSS de la aplicación completa, sin autosave activo ni grafo real de WorldView; secuencia fija de variantes, sin aleatorización y con variabilidad de GC/JIT. Los datos sintéticos no representan todos los proyectos. Las cifras sirven para priorizar y diseñar la siguiente prueba, no como promesa de FPS ni porcentaje de aceleración global.

## Referencias técnicas

- React documenta el alcance de `actualDuration` y el uso de builds de profiling en [Profiler](https://react.dev/reference/react/Profiler).
- Los workers ejecutan trabajo fuera del contexto de ventana y necesitan intercambio de mensajes: [Using Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers).
- Transferir un buffer cambia su propiedad y puede dejarlo inutilizable en el emisor: [Transferable objects](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects).
- Canvas puede renderizarse en un worker con [OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas).
- WASM no accede directamente a objetos JS; importa el diseño de buffers y copias: [Rust/WASM JavaScript interoperation](https://rustwasm.github.io/book/reference/js-ffi.html).
