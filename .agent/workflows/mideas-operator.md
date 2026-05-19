---
description: Operar Mideas para crear/editar tiles, screens, worlds y gameflows con validacion
---

Este workflow usa el agente `docs/agents/mideas-operator.md` para trabajar en Mideas de forma reproducible.

### Finalidad

Crear un agente autonomo, fiel y util para Mideas:

- Autonomo: avanza por UI, JSON, generacion, compilacion y validacion sin pedir supervision paso a paso.
- Fiel: documenta lo que realmente ocurre, incluidos errores, workarounds, capturas, archivos generados y limites encontrados.
- Util: entrega artefactos verificables, no solo explicaciones, y convierte cada fallo en una leccion operativa.
- Tester: prueba funciones nuevas de Mideas como usuario real, con veredicto, reproduccion y evidencia.
- Browser-first: los pasos visibles de authoring se hacen en Mideas dentro del navegador cuando el usuario quiere ver el proceso.

### Pasos

1. Leer contexto minimo:
   - `README.md`
   - `CLAUDE.md`
   - `docs/agents/mideas-operator.md`
   - `docs/GAMEFLOW_API_REFERENCE.md` si hay GameFlow
   - `types.ts` y `handlers/useAssetHandlers.tsx` si hay edicion directa de JSON

2. Decidir modo de trabajo:
   - Navegador/UI si hay que crear, editar, testear o ensenar interaccion visual en Mideas.
   - JSON si hay que crear muchos assets o conexiones.
   - Codigo si la UI o el exportador no soportan lo pedido.
   - Si se usa JSON/codigo por necesidad, volver al navegador para inspeccion/captura visible.

3. Crear o cargar proyecto:
   - UI: `File -> New Project` o `File -> Load Project`.
   - Si no se da ruta, buscar proyectos en `C:\Users\salam\Downloads`.

4. Crear assets base:
   - `New Asset -> Tile`
   - `New Asset -> Tile Banks`
   - `New Asset -> Playable Screen`
   - `New Asset -> World Map`
   - `New Asset -> Game Flow`

5. Editar assets:
   - Tile: usar `#pixel-grid-interactive`, herramientas Pencil/Flood Fill/Dither, propiedades logicas y `lineAttributes` para SCREEN 2.
   - Screen: seleccionar capa `background`, `collision`, `effects` o `entities`; pintar tiles; asignar `tileBankAssetId`; ajustar Active Area/HUD si procede.
   - World: usar `Add Screen`, conectar puertos `north/south/east/west`, marcar `Set Start`.
   - GameFlow: asegurar `Main`, conectar `Start -> Transition -> WorldLink`; insertar `Transition` entre nodos visuales; ejecutar `Preview` antes de `Play Game`.

6. Validar:
   - Revisar referencias y errores visibles.
   - Ejecutar `npm run build` para cambios de repo.
   - Usar `Preview`/`Play Game` para GameFlow.
   - Exportar Game Structure o Z80 si la tarea pide runtime.
   - Compilar con Glass/OpenMSX solo cuando la peticion lo exija o el cambio afecte runtime MSX.
   - Si se genera una `.rom`, capturar PNG en OpenMSX y ensenarlo en la respuesta final. Si la captura falla, reportar comando/error exacto.
   - Si la tarea es testear una funcion nueva, dar veredicto `pass`, `fail` o `partial` con pasos de reproduccion, archivos y evidencia.

7. Cierre:
   - Reportar archivos cambiados, validacion realizada y cualquier limitacion pendiente.
   - No commitear ni hacer push salvo peticion explicita.

### Lecciones aprendidas

- El navegador integrado puede operar Mideas, pero no es fiable para subir JSON por `File -> Load Project` mediante selector de archivos. Si el usuario quiere ver el proceso, operar lo visible en UI; si hace falta una estructura grande, generar el JSON determinista y documentar la limitacion.
- `msx2screen` sirve para authoring visual SCREEN 5, pero el GameFlow `WorldLink` actual espera assets `screenmap` para emitir variables runtime como `current_screen_engine`. Para compilar un flujo con mundo, crear tambien un `screenmap` runtime o corregir el generador para soportar mundos MSX2 nativos.
- Un `screenmap` con `screenEngine: "player"` necesita datos de jugador coherentes. Para una pantalla placeholder compilable, usar `screenKind: "tutorial"` y `screenEngine: "fakePlayer"` o anadir una entidad Player real.
- Si la ROM final solo compila tras parchear ASM generado con stubs, reportarlo como workaround. Guardar el JSON fuente, el ASM parcheado y las etiquetas stub para poder corregir el generador despues.
- Toda ROM entregada debe ir acompanada de captura PNG de OpenMSX cuando sea tecnicamente posible.
