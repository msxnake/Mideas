# Paper: Dead-Code Elimination para ASM generado por Mideas

## Objetivo

Reducir el tamano del ASM y de la ROM final eliminando codigo, tablas y datos que
el proyecto no usa realmente. La regla base es:

> Lo que no se usa no se mete en el ASM, salvo que quitarlo pueda romper
> compatibilidad, arranque, validacion o comportamiento runtime.

El enfoque debe ser incremental y conservador. Mideas ya hace filtrado en varios
generadores y ya existe `scripts/post_asm_optimize.py`; este roadmap define como
convertir esa idea en una canalizacion completa de eliminacion estructural.

## Principios de diseno

- El ASM final es la fuente de verdad para la ultima pasada. Los generadores
  pueden equivocarse por exceso, pero el postprocesador debe ver lo que Glass va
  a compilar.
- Cada eliminacion debe ser explicable. El reporte debe decir que bloque se
  quito, por que raiz no era alcanzable, cuantos bytes/lineas ahorro y que regla
  lo autorizo.
- La primera version debe ser opt-in y reversible: modo analisis, modo aplicar,
  ASM optimizado separado (`*.optimized.asm`) y comparacion con el ASM original.
- No se eliminan bloques con referencias indirectas dudosas sin anotacion
  explicita del generador.
- Las pasadas deben repetirse hasta punto fijo: quitar una rutina puede dejar
  otras rutinas y tablas sin referencias en la siguiente vuelta.
- La validacion manda sobre el ahorro. Si Glass, OpenMSX smoke o invariantes de
  simbolos fallan, se conserva el bloque.

## Estado actual que conviene aprovechar

- Varios generadores ya tienen filtrado local de features, componentes,
  templates, handlers y runtime opcional.
- `utils/msxGenerator/generators/unifiedGenerator.ts` ya emite artefactos como
  `project_usage.json`, `unused_report.txt` y `segment_budget.json` en flujos
  MegaROM.
- `scripts/build_mideas_unified_rom.py` ya integra `--post-asm-opt`,
  `--post-asm-check-only`, `--post-asm-rules` y salida `*.optimized.asm`.
- `scripts/post_asm_optimize.py` ya parsea lineas ASM, rutinas, labels y genera
  reportes Markdown/JSON.
- El optimizador ya tiene inventario de bloques `@mideas:block`, grafo directo
  de referencias por label, regla `dead-blocks` para bloques anotados y regla
  `unused-runtime-labels` para listar rutinas runtime no anotadas sin
  referencias externas. Esta ultima es solo de informe: no borra ASM, y filtra
  infraestructura compartida como mapper, page0, resource loader, ZX0,
  trampolines far-call e interrupciones.

Eso permite evolucionar sin empezar de cero: primero enriquecer metadata del ASM,
despues ampliar las reglas, y finalmente activar eliminacion por grafo.

## Arquitectura propuesta

### 1. No emitir lo que el proyecto no usa

Antes del ASM final, los generadores deben recibir un `ProjectUsageModel`
centralizado. Ese modelo debe responder preguntas simples:

- Que assets son alcanzables desde el GameFlow inicial.
- Que mundos, pantallas, menus, bosses, dialogos, musicas y SFX se usan.
- Que componentes aparecen en entidades realmente instanciadas.
- Que sistemas runtime necesita cada pantalla.
- Que handlers de state machine, condiciones y acciones estan referenciados.
- Que loaders y helpers de mapper hacen falta para el modo ROM elegido.

Cada generador debe consultar ese modelo antes de emitir bloques opcionales.
Ejemplos:

- No emitir runtime de boss si el proyecto no tiene bosses alcanzables.
- No emitir tipos de ataque de boss que ningun boss use.
- No emitir `fakePlayer` y `player` a la vez si ninguna pantalla requiere uno de
  ellos.
- No emitir music player, SFX player, dialogo, scroll, proyectiles o colisiones
  especiales si no hay assets o componentes que los disparen.
- No emitir templates, componentes, sprites, tile blocks o pantallas no
  alcanzables desde el flujo real del juego.

Esta fase reduce ruido temprano y mejora la calidad del ASM que llega al
postprocesador.

### 2. Anotar el ASM generado con bloques eliminables

El postprocesador no debe depender solo de heuristicas de labels. Los
generadores deberian emitir marcadores estables:

```asm
; @mideas:block id=runtime.boss.attack.radial kind=routine owner=bosses preserve=false
boss_attack_radial_update:
    ...
; @mideas:endblock id=runtime.boss.attack.radial
```

Campos sugeridos:

- `id`: identificador estable del bloque.
- `kind`: `routine`, `data`, `table`, `vars`, `mapper`, `interrupt`, `asset`.
- `owner`: generador o subsistema.
- `deps`: lista opcional de labels/bloques requeridos.
- `roots`: condiciones que lo hacen raiz (`boot`, `interrupt`, `export`,
  `resource_table`, `user_code`, `mapper_fixed_bank`).
- `preserve`: `true` cuando nunca debe borrarse automaticamente.
- `bank`: zona o banco cuando aplique.

Con esta metadata, la eliminacion puede ser mucho mas agresiva sin adivinar.

### 3. Construir un grafo de alcance del ASM final

El optimizador debe parsear el ASM y construir un grafo:

- Nodos: rutinas, bloques de datos, tablas, variables, trampolines, bloques de
  recursos, labels publicos.
- Aristas directas: `call`, `jp`, `jr`, `djnz`, `rst`, `ld hl,label`,
  `ld de,label`, `dw label`, `db low label`, `db high label`, expresiones con
  labels y tablas de punteros.
- Aristas por anotacion: `deps=...`.
- Raices: entrypoint de ROM, interrupciones, callbacks BIOS, mapper runtime,
  tablas de recursos, tablas de gameflow, labels exportados, labels usados por
  codigo escrito por el usuario, rutinas invocadas desde scripts o validadores.

Todo nodo no alcanzable desde una raiz pasa a ser candidato, no borrado directo.

### 4. Pasadas hasta punto fijo

La optimizacion debe correr en varias pasadas:

1. Parsear ASM y metadata.
2. Calcular raices y alcance.
3. Marcar candidatos no alcanzables.
4. Aplicar solo eliminaciones seguras.
5. Reparsear el ASM resultante.
6. Repetir hasta que no haya mas cambios o se alcance un limite configurable.

Esto es importante porque la primera eliminacion puede dejar tablas, labels o
helpers sin uso para una segunda pasada.

### 5. Borrado in situ del ASM final

La salida optimizada debe conservar el orden y la estructura del ASM original,
pero borrar bloques completos:

- Rutinas enteras entre label global y siguiente bloque.
- Bloques delimitados por `@mideas:block`.
- Tablas completas cuando ninguna rutina alcanzable las referencia.
- Datos de assets no alcanzables cuando no forman parte de tablas preservadas.

No conviene borrar instrucciones sueltas en la primera etapa salvo reglas muy
concretas ya validadas. El mayor ahorro vendra de quitar bloques completos.

## Bloques que nunca se deben borrar sin permiso explicito

- Header, entrypoint, boot path e inicializacion de VDP/BIOS.
- ISR, hooks y cualquier rutina instalada en vectores.
- Mapper runtime y trampolines de banco fijo.
- Rutinas de copia/descompresion compartidas por resource loader.
- Variables RAM aunque parezcan no referenciadas, hasta tener metadata de uso.
- Labels referenciados por `EQU`, calculos de banco, `ORG`, `DS`, macros o
  expresiones que Glass resuelve.
- Codigo de usuario importado desde assets `code` o `behavior`, salvo que tenga
  anotaciones de entrada/salida.
- Jump tables o dispatch tables sin formato conocido.

## Roadmap por fases

### Fase 0: Baseline y metricas

- Documentar el tamano actual de ASM/ROM por proyecto de referencia.
- Guardar reportes de `post_asm_optimize.py` para simple32k, konami, ascii8 y
  ascii16.
- Definir metricas minimas:
  - lineas ASM antes/despues;
  - bytes ROM antes/despues;
  - numero de bloques eliminados;
  - numero de candidatos conservados por riesgo;
  - resultado Glass;
  - resultado OpenMSX smoke.

Aceptacion:

- Hay un reporte reproducible por proyecto y modo ROM.
- El pipeline puede correr en modo analisis sin modificar el ASM.

### Fase 1: Manifiesto unico de uso del proyecto

- Crear o consolidar `ProjectUsageModel` a partir de assets, GameFlow, WorldMap,
  pantallas, entidades, componentes, state machines, bosses, audio y menus.
- Emitir `project_usage.json` tambien para flujos no MegaROM.
- Hacer que cada generador reciba el mismo modelo en lugar de recalcular uso
  localmente.

Aceptacion:

- El mismo proyecto produce el mismo manifiesto independientemente del modo ROM.
- El manifiesto explica por que cada subsistema esta marcado como usado.

### Fase 2: Anotaciones de bloques generados

- Anadir `@mideas:block` / `@mideas:endblock` alrededor de runtime opcional y
  tablas grandes.
- Marcar raices conocidas con `preserve=true`.
- Marcar dependencias explicitas en bloques con dispatch indirecto.

Aceptacion:

- El optimizador puede listar bloques por `id`, `kind`, `owner` y rango de
  lineas.
- Los bloques criticos aparecen como preservados en el reporte.

### Fase 3: Eliminacion conservadora por grafo

- Ampliar `scripts/post_asm_optimize.py` con grafo de labels y bloques.
- Implementar `--rules dead-blocks`.
- Implementar `--rules unused-runtime-labels` como cola de trabajo: detecta
  labels globales con instrucciones, sin bloque `@mideas:block`, sin referencia
  externa probada y clasificados como `runtime_code`.
- En modo analisis, reportar candidatos no alcanzables y motivo.
- En modo aplicar, borrar solo bloques anotados con `preserve=false` y sin
  referencias alcanzables.

Aceptacion:

- El ASM optimizado compila con Glass.
- El reporte JSON contiene raices, candidatos, eliminados y conservados.
- No se borra ningun bloque sin anotacion o regla de seguridad.
- Las rutinas no anotadas solo se reportan; antes de borrarlas hay que
  convertirlas en bloques anotados o elevar la regla con validacion especifica.
- Incremento validado en `joc_tales_9`: la cola `unused-runtime-labels` bajo de
  39 a 28 candidatos tras anotar stubs/helpers de componentes, y `dead-blocks`
  pudo borrar 3 bloques anotados (`runtime.components.input_trigger_level`,
  `runtime.components.auto_destroy_stub`,
  `runtime.components.legacy_tile_collision`) en 3 pasadas con Glass y
  validacion MegaROM correctas.
- Segundo incremento validado en `joc_tales_9`: se filtraron tablas
  `SM_*Table` como datos, se anotaron bloques de SFX y `show_sprite`, y la cola
  `unused-runtime-labels` bajo a 21 candidatos. La regla `dead-blocks` borro 4
  bloques en 4 pasadas, sumando `runtime.sprites.show_sprite_legacy`, con Glass
  y validacion MegaROM correctas. Los bloques SFX quedaron conservados por
  referencias externas probadas, no por lista blanca.
- Tercer incremento validado en `joc_tales_9`: se anotaron helpers de gameflow,
  el stub `load_screen`, helpers de mundo actual y stubs de HUD vacio. La cola
  `unused-runtime-labels` bajo a 13 candidatos y `dead-blocks` borro 9 bloques
  en 5 pasadas con Glass y validacion MegaROM correctas.
- Cuarto incremento validado en `joc_tales_9`: se anotaron stubs de componentes
  restantes, `music_reset_channel_state` no-op y el fallback `reload_font_system`.
  La cola `unused-runtime-labels` bajo a 0 y `dead-blocks` borro 20 bloques en 7
  pasadas con Glass y validacion MegaROM correctas (`maxCodeUsed=6813`).
- Validacion ampliada en muestras MegaROM de `Downloads`: la cola
  `unused-runtime-labels` queda a 0 en `joc_tales_9`, `joc64`, `joc51` y
  `patoantic249`; `dead-blocks` aplica solo bloques anotados, recompila con
  Glass, conserva MegaROM Konami valida y pasa smoke OpenMSX automatizado.

| Proyecto | `unused-runtime-labels` | `dead-blocks` aplicados | Validacion | Smoke | Notas |
| --- | ---: | ---: | --- | --- | --- |
| `joc_tales_9.json` | 0 | 20 | Glass + MegaROM Konami OK | OK, `playerX=216->78` | `maxCodeUsed=6813` |
| `joc64.json` | 0 | 17 | Glass + MegaROM Konami OK | OK, `playerX=16->122` | `maxCodeUsed=7701`; avisos tilebank preexistentes |
| `joc51.json` | 0 | 16 | Glass + MegaROM Konami OK | OK, `playerX=16->134` | `maxCodeUsed=7821`; avisos tilebank preexistentes |
| `patoantic249.json` | 0 | 20 | Glass + MegaROM Konami OK | OK, `playerX=8->64` | `maxCodeUsed=8079` |

Comando recomendado para repetir la matriz critica:

```powershell
scripts\run_post_asm_deadblocks_matrix.ps1
```

Equivalente expandido:

```powershell
python scripts\run_mideas_regression_matrix.py `
  --json $env:USERPROFILE\Downloads\joc_tales_9.json `
  --json $env:USERPROFILE\Downloads\joc64.json `
  --json $env:USERPROFILE\Downloads\joc51.json `
  --json $env:USERPROFILE\Downloads\patoantic249.json `
  --modes megarom `
  --target-formats konami `
  --post-asm-opt `
  --post-asm-rules dead-blocks,unused-screen-loaders,inactive-feature-runtime,unused-boss-attack-runtime `
  --post-asm-passes 7 `
  --openmsx-timeout 45 `
  --keep-going
```

### Fase 4: Pasadas de punto fijo

- Implementar `--passes N` y default conservador (`N=3`).
- Parar antes si una pasada no cambia nada.
- Reportar ahorro por pasada.

Aceptacion:

- La segunda/tercera pasada puede eliminar dependencias residuales.
- El resultado es determinista: mismo input, mismo ASM optimizado y mismo
  reporte.
- Incremento validado: el reporte Markdown/JSON incluye `optimization_passes`
  con lineas/bytes fuente retirados por pasada, conteo de patchables y lineas
  antes/despues. En `joc_tales_9`, `dead-blocks` alcanza punto fijo en la
  segunda pasada: 20 bloques, 260 lineas y 7431 bytes fuente retirados en la
  primera; 0 patchables en la segunda.

### Fase 5: Integracion en build

- Activar `--post-asm-check-only` por defecto en builds de diagnostico.
- Exponer toggle en UI: `Analizar ASM no usado` y `Aplicar eliminacion ASM`.
- Mantener `*.asm` original y `*.optimized.asm` separado.
- Compilar el optimizado solo si la validacion previa pasa.

Aceptacion:

- El usuario puede comparar ASM original vs optimizado.
- Si falla la optimizacion, el build cae al ASM original con warning claro.
- Incremento validado: `build_mideas_unified_rom.py` resume el reporte
  post-ASM en la salida final del build. Para `joc_tales_9` con
  `dead-blocks`, la salida muestra `Post-ASM savings: passes=2, removed=260
  lines / 7431 bytes` y detalle compacto de cada pasada, junto a Glass y
  validacion MegaROM correctas.
- Incremento validado: `server/server.js` expone `POST /analyze-post-asm`
  como modo diagnostico puro. El endpoint acepta ASM final, ejecuta
  `post_asm_optimize.py` sin `--apply`, limita por defecto el analisis a
  `dead-blocks,unused-runtime-labels`, y devuelve resumen + reporte JSON/MD
  para que la UI pueda mostrar candidatos sin cambiar el ASM generado.
- Incremento validado: `components/modals/CodeExportModal.tsx` conecta la UI
  del exportador al endpoint diagnostico con el boton `Analyze unused ASM`,
  muestra resumen de candidatos y permite descargar los reportes Markdown/JSON.
  La UI no invoca `--apply` ni sustituye el ASM generado.
- Incremento validado: `server/server.js` expone `POST /optimize-post-asm`
  como ruta separada de aplicacion. La regla aplicada queda fijada a
  `dead-blocks`, las pasadas se limitan a 1..7, el resultado se escribe como
  `*.optimized.asm`, y por defecto se valida con `glass.jar` antes de devolver
  artefactos descargables.
- Incremento validado: `components/modals/CodeExportModal.tsx` expone
  `Apply unused ASM (validated)` como flujo independiente. Descarga el ASM/ROM
  optimizado generado por backend, pero no sustituye el textarea, los tabs ni el
  build activo.
- Incremento validado: la ruta `POST /optimize-post-asm` compara invariantes
  antes de aceptar el artefacto optimizado: config ROM/mapper, entry target,
  labels criticos, labels de bloques anotados no candidatos y labels de tablas
  de recursos. La UI muestra si las invariantes pasaron o el motivo de bloqueo.
- Incremento validado: el comparador de invariantes calcula fingerprints de
  tablas de recursos (`resource_table`, ids, bancos, direcciones y tamanos)
  mediante checksum + conteo de lineas/datos. Si el ASM optimizado conserva el
  label pero cambia el contenido de la tabla, la ruta validada se bloquea con
  `resource-metadata`.

### Fase 6: Validacion funcional automatica

- Compilar original y optimizado.
- Comparar invariantes de simbolos criticos.
- Ejecutar smoke OpenMSX por modo ROM cuando este configurado.
- Registrar screenshots y logs solo para builds de regression, no para cada
  export rapido.

Aceptacion:

- Ninguna optimizacion se considera estable sin Glass + smoke en muestras
  representativas.
- El reporte indica si el ahorro fue aceptado o descartado por validacion.
- Incremento validado: `run_mideas_regression_matrix.py` acepta
  `--post-asm-opt`, `--post-asm-check-only`, `--post-asm-rules` y
  `--post-asm-passes`, y el resumen compacto conserva `Post-ASM report`,
  `Post-ASM savings` y `Post-ASM passes`. La matriz MegaROM Konami con
  `dead-blocks` aplicado y smoke OpenMSX pasa en las cuatro muestras de
  `Downloads`.
- Incremento validado: `scripts/run_post_asm_deadblocks_matrix.ps1` fija el
  comando critico de regresion para Windows/PowerShell, con rutas a `Downloads`,
  7 pasadas, `dead-blocks`, MegaROM Konami y smoke OpenMSX.
- Incremento validado: `scripts/run_post_asm_backend_route_matrix.cjs` ejecuta
  el mismo helper de backend usado por `POST /optimize-post-asm` contra los ASM
  MegaROM Konami criticos. En la matriz actual con Glass activado pasan
  `joc_tales_9`, `joc64`, `joc51` y `patoantic249`, todos con ROM optimizada e
  invariantes correctas.
- Incremento validado: el test de contrato del modal confirma que la
  optimizacion post-ASM devuelve URLs separadas para ASM/ROM optimizados y que
  el handler de UI no reemplaza `generatedCode`, `generatedFiles` ni el tab
  activo. El ASM original sigue siendo la fuente visible hasta que el usuario
  descarga el artefacto optimizado.
- Incremento validado: nueva regla `unused-screen-loaders` en modo report-only.
  Detecta rutinas `load_screen_*` sin referencias externas probadas y no emite
  parches; queda como senal para cruzar despues con gameflow y metadatos de
  recursos antes de borrar loaders. En la matriz critica actual reporta 0
  loaders en `joc_tales_9`, 1 en `joc64`, 1 en `joc51` y 1 en `patoantic249`.
- Incremento validado: `unused-screen-loaders` carga automaticamente
  `project_usage.json` y `load_plan.json` desde el directorio `_generated`
  vecino al ASM. El reporte enlaza cada trampoline `load_screen_*_far` sin
  referencias con la escena detectada, conteo de recursos y el bloque loader
  anotado relacionado. Sigue siendo report-only.
- Incremento validado: `project_usage.json` ahora incluye
  `gameFlowReachability`, con pantallas y mundos alcanzables desde el grafo
  GameFlow/WorldMap. En `joc64`, `pan1` queda marcada como alcanzable y
  `New Dialog Screen` como inalcanzable.
- Incremento validado: `unused-screen-loaders` ya puede aplicar parches solo
  cuando `gameFlowReachability` marca la escena como inalcanzable. Borra el
  trampoline `_far` y el bloque loader anotado relacionado si no quedan otras
  referencias. El optimizador tambien lee `project_usage.json`/`load_plan.json`
  embebidos en el ASM, por lo que `POST /optimize-post-asm` puede aplicar la
  regla desde la UI. En `joc64` con
  `--post-asm-rules dead-blocks,unused-screen-loaders --post-asm-passes 7`
  se aplicaron 19 parches y se retiraron 371 lineas / 11809 bytes de fuente ASM
  con Glass e invariantes correctas.
- Incremento validado: `project_usage.json` expone ahora features/counts para
  `bosses`, `bossInstances`, `dialogues`, `worldmaps` y
  `presentationScreens`. Esto deja de depender solo de heuristicas por nombre
  para saber si una familia de runtime deberia existir en el ASM final.
- Incremento validado: nueva regla `inactive-feature-runtime` en modo
  report-only. Cruza `project_usage.features/counts` con labels de audio,
  menus, bosses, dialogos y state machines. En `joc64` detecta 31 rutinas de
  audio presentes aunque `sounds=0` y `tracks=0`; no emite parches y queda como
  cola de trabajo para anotar/generar invariantes antes de borrar. El analisis
  de UI incluye esta regla, mientras que `POST /optimize-post-asm` sigue
  limitado a `dead-blocks` y `unused-screen-loaders`.
- Incremento validado: el reporte `inactive-feature-runtime` incluye ahora el
  conteo y muestra de referencias externas por rutina. Si existen callers, el
  reporte deja claro que el borrado sigue bloqueado; si no existen, marca la
  rutina como candidata para una regla patchable futura cuando haya ownership e
  invariantes.
- Incremento validado: `inactive-feature-runtime` ya puede aplicar parches para
  audio inactivo (`sounds=0`, `tracks=0`) solo en labels sin referencias
  externas. El borrado queda bloqueado si la ventana contiene marcadores
  `BANK_* EQU`/`FAR_BANK_* EQU`, para no romper trampolines de otros bancos. En
  `joc64`, la regla sola aplica 4 parches en 2 pasadas y retira 36 lineas / 640
  bytes de fuente ASM con Glass correcto.
- Incremento validado: `dead-blocks,unused-screen-loaders,inactive-feature-runtime`
  conviven en `joc64`; el solapamiento entre un dead-block de audio y una rutina
  inactive-feature contenida se deduplica antes de aplicar. Resultado combinado:
  22 parches, 405 lineas / 12414 bytes de fuente ASM retirados, Glass correcto.
  La UI/backend de apply sigue sin activar `inactive-feature-runtime` por defecto;
  queda disponible por CLI cuando se pida explicitamente.
- Incremento validado: `inactive-feature-runtime` esta activado tambien en
  `POST /optimize-post-asm` y en el boton `Apply unused ASM (validated)`. La
  regla conserva su alcance limitado: solo audio inactivo sin referencias
  externas puede generar parches; menus, dialogos, bosses y state machines
  siguen report-only. La matriz backend por defecto
  `dead-blocks,unused-screen-loaders,inactive-feature-runtime` pasa con Glass e
  invariantes en `joc_tales_9` (23 parches), `joc64` (20), `joc51` (19) y
  `patoantic249` (20).
- Incremento validado: `sound.asm` y los wrappers residentes de audio emiten
  ownership explicito para `runtime.sound.init`, `runtime.sound.tick` y
  `runtime.sound.resident_wrappers`. `inactive-feature-runtime` ya no borra
  rutinas individuales que vivan dentro de un bloque anotado; esas ventanas
  quedan report-only y se delegan a `dead-blocks`, que solo borra el grupo
  completo cuando no hay referencias externas. Se valido con `joc64.json`:
  los marcadores aparecen en el ASM final, `inactive-feature-runtime` solo no
  desequilibra `@mideas:block`/`@mideas:endblock`, y la combinacion
  `dead-blocks,unused-screen-loaders,inactive-feature-runtime` compila con
  Glass.
- Incremento validado: `inactive-feature-runtime` emite candidatos report-only
  de grupo logico para audio (`runtime.sound.group.*`). Cada grupo relaciona
  wrapper residente, wrapper far-call y runtime real, y reporta si existen
  referencias externas fuera del grupo. No aplica aun multi-borrado atomico:
  el patcher actual solo soporta una ventana contigua, asi que estos grupos
  sirven como evidencia para la siguiente fase sin romper los parches actuales.
- Incremento validado: el patcher ya soporta `group_id` atomico en `Patch`.
  Si una ventana de un grupo queda cubierta por otro parche, el grupo completo
  se salta en vez de aplicar un subconjunto. Esto prepara el multi-borrado de
  familias sin cambiar las reglas actuales.
- Incremento validado: el runtime no-musica emite
  `runtime.sound.music_noop_runtime` envolviendo los stubs `music_*`. No se
  marca como root: permanece referenciado mientras existan wrappers far-call o
  residentes, y solo podra caer como bloque completo en una pasada posterior.
  La validacion aislada de `joc64` compila con Glass correcto.
- Incremento validado: los wrappers residentes de audio se separaron en bloques
  individuales (`runtime.sound.resident.*`) en vez de un unico bloque comun.
  Esto permite que `dead-blocks` borre un wrapper completo si queda sin
  referencias, sin tocar los demas. La mini-matriz fresca regenerada desde
  `Downloads` pasa con Glass: `joc_tales_9` 22 parches, `joc64` 21,
  `joc51` 20 y `patoantic249` 23.
- Incremento validado: los trampolines far-call de audio emiten ownership
  selectivo (`runtime.far_trampoline.*_far`, `preserve=true`). No se anotan los
  trampolines de pantallas para no ocultarlos a `unused-screen-loaders`. Con esa
  ventana exacta, `inactive-feature-runtime` ya aplica un grupo atomico
  multi-ventana para `runtime.sound.group.music_execute_command`: elimina
  wrapper far-call, wrapper residente y rutina runtime, o nada si alguna ventana
  queda bloqueada por solape/EQU. Mini-matriz fresca desde `Downloads`, con
  Glass correcto: `joc_tales_9` 23 parches, `joc64` 22, `joc51` 21 y
  `patoantic249` 23.
- Incremento validado: el generador deja de emitir llamadas de audio de frame
  cuando el proyecto no tiene `sounds` ni `tracks`: no registra task de audio,
  no inicializa PSG por boot, no llama `sfx_update` en el loop, y
  `ensure_music_for_world_id` queda como stub si no hay pistas. Con esos callers
  fuera del ASM, `inactive-feature-runtime` puede aplicar grupos atomicos de
  audio completos (`init`, `tick`, `sfx_update`, `music_play_track`,
  `music_execute_command`) y las pasadas posteriores eliminan el resto de stubs
  no-musica que quedan sin referencias. Mini-matriz fresca desde `Downloads`,
  con Glass correcto: `joc_tales_9` 45 parches, 805 lineas / 21018 bytes;
  `joc64` 44 parches, 916 lineas / 25396 bytes; `joc51` 43 parches, 912 lineas /
  25229 bytes; `patoantic249` se mantiene en 23 parches porque conserva audio
  activo.
- Incremento validado: el patron atomico de grupos de audio queda cubierto
  tambien para `runtime.sound.group.music_stop`, no solo para
  `music_execute_command`. La prueba fuerza un label vecino dentro del bloque
  `runtime.sound.music_noop_runtime` a seguir vivo y confirma que el patcher
  borra solo las ventanas del grupo (`call_music_stop_resident`,
  `music_stop_far`, `music_stop`) sin desequilibrar el bloque anotado.
- Incremento validado: el mismo patron queda cubierto para
  `runtime.sound.group.sfx_update`. La prueba mantiene un label vecino
  (`psg_idle`) dentro de un bloque runtime anotado y confirma que solo se
  retiran las tres ventanas del grupo (`call_sfx_update_resident`,
  `sfx_update_far`, `sfx_update`), preservando el resto del bloque.
- Incremento validado: el reporte JSON del optimizador publica ahora
  `removed_labels` por pasada y en el resumen global. La ruta backend
  `POST /optimize-post-asm` usa esa lista como contrato de bajas autorizadas,
  evitando falsos fallos de invariantes cuando las pasadas 2..N eliminan labels
  de audio inactivo cuyos indices ya no coinciden con el ASM original. La matriz
  backend vuelve a pasar con Glass e invariantes para `joc_tales_9`, `joc64`,
  `joc51` y `patoantic249`.
- Incremento validado: `runtime.sound.group.music_update` tiene ahora cobertura
  para los dos estados importantes. Sin callers externos, el patcher retira
  atomicamente `call_music_update_resident`, `music_update_far` y
  `music_update`, preservando labels vecinos del bloque runtime. Con un caller
  externo a `call_music_update_resident`, no se emite ningun parche de grupo.
- Incremento validado: las familias no-audio siguen cerradas en report-only.
  La prueba de `inactive-feature-runtime` cubre ahora `dialogues=0` con
  `show_dialogue_box`; incluso con `allow_patches=True`, menus, dialogos y
  bosses se reportan pero no generan parches. Solo audio inactivo permanece en
  el conjunto patchable.
- Incremento validado: el reporte de `inactive-feature-runtime` distingue
  explicitamente entre `analysis-only` y bloqueo por politica. Audio inactivo
  informa que solo puede parchearse en modo apply; menus, dialogos y bosses
  informan que la familia sigue en report-only y que el unico conjunto patchable
  actual es `sounds`.
- Incremento validado: el runtime de dialogos generado por
  `componentsGenerator.ts` queda envuelto en
  `@mideas:block id=runtime.dialogue.system owner=dialogues preserve=true`, tanto
  para stubs sin dialogos como para la implementacion completa. Esto da
  ownership al analizador sin habilitar borrado por `dead-blocks` ni por
  `inactive-feature-runtime` todavia.
- Incremento validado: `test_megarom_packing_manifest_json.py` genera ahora un
  fixture temporal con `AutoControlScript` activo y verifica que el ASM final
  contiene el bloque `runtime.dialogue.system`. Asi se cubre el ownership de
  dialogos solo en un proyecto que realmente emite ese runtime, sin meter stubs
  extra en proyectos sin scripts.
- Incremento validado: los stubs de compatibilidad de menus sin `SubMenu`
  (`init_menus`, `show_main_menu`, `update_menu_state`) quedan agrupados como
  `runtime.menus.compat_stubs preserve=true`. `inactive-feature-runtime` tambien
  reconoce `init_menus` y `show_main_menu`, pero la familia `menus` sigue
  estrictamente report-only. En MegaROM, `menus.asm` sigue sin entrar en el ASM
  final si no hay `SubMenu`.
- Incremento validado: el reporte de `inactive-feature-runtime` incluye ahora
  contexto de ownership por label: bloque anotado, owner y `preserve`, o
  `unannotated` cuando falta marcador. Esto convierte el modo report-only de
  menus/dialogos/bosses en una lista accionable para saber que rutinas aun
  necesitan ownership antes de permitir cualquier borrado.
- Incremento validado: `metrics.inactive_feature_runtime` agrega el mismo
  estado en JSON y Markdown por familia: findings, patchable/report-only,
  annotated/unannotated, preserved y owners. Esto permite auditar rapidamente
  cuanto falta de ownership en `menus`, `dialogues` o `bosses` sin parsear texto
  libre de findings.
- Incremento validado en matriz backend real: `joc_tales_9`, `joc64`, `joc51`
  y `patoantic249` siguen pasando con
  `dead-blocks,unused-screen-loaders,inactive-feature-runtime`, Glass e
  invariantes. En `joc64`, la nueva metrica reporta `sounds=31`, todos
  anotados, `unannotated=0`, con owners `sound` y `far-call`.
- Incremento validado tras regenerar desde `Downloads`: el falso positivo de
  audio sin ownership en `joc_tales_9` venia de un ASM fixture antiguo usado por
  la matriz backend. La generacion fresca MegaROM Konami con OpenMSX OK reporta
  `sounds=31`, `annotated=31`, `unannotated=0`, owners `sound` y `far-call`.
  Reejecutada la matriz backend sobre ese ASM fresco, `joc_tales_9` pasa con 45
  parches, Glass e invariantes correctas.
- Incremento de estabilidad MegaROM: `show_presentation_screen_image` y
  `show_presentation_screen` pertenecen a `screens_code`, no al modulo
  `screen_loaders` despues del split de loaders. Se corrigio la lista de
  entrypoints far-call para generar `show_presentation_screen_image_far` en el
  banco real de presentacion. `patoantic249` fresco vuelve a compilar y pasar
  OpenMSX con
  `dead-blocks,unused-screen-loaders,inactive-feature-runtime`: 23 parches, 439
  lineas / 13836 bytes retirados, `playerX=8->64`.
- Incremento de ownership para `bosses`: los trampolines far-call de boss
  (`init_boss_system`, `init_screen_boss_from_current_screen`,
  `update_boss_system`, `draw_boss_attack`) y los wrappers residentes de boss
  quedan anotados. En `patoantic249` fresco, `inactive-feature-runtime` reporta
  `bosses=43`, `annotated=43`, `unannotated=0`, owners `bosses` y `far-call`;
  la familia sigue report-only y el smoke OpenMSX se mantiene OK.
- Incremento de callers condicionales para `bosses`: el generador ya no emite
  `init_boss_system`, `update_boss_system` ni
  `init_screen_boss_from_current_screen` cuando el proyecto/pantalla no tiene
  bosses. En `patoantic249` fresco sigue pasando MegaROM Konami con OpenMSX OK
  (`playerX=8->64`), 23 parches, 439 lineas / 13777 bytes retirados y
  `maxCodeUsed=7718`. Esto reduce referencias artificiales antes de plantear
  una regla patchable de boss.
- Incremento de precision para `menus`: `project_usage.features.menus` ya
  cuenta nodos `SubMenu` de GameFlow, no solo `analysis.hasMenus`. Esto evita
  clasificar como inactivo un submenu vivo. En `patoantic249`, `menus` pasa a
  `true` con `counts.menus=1`; `inactive-feature-runtime` deja de reportarlo y
  el bloque legacy `runtime.menus.*` queda como candidato normal de
  `dead-blocks` si no tiene referencias externas. La validacion fresca mantiene
  23 parches, Glass/OpenMSX OK y `playerX=8->64`.
- Matriz fresca posterior a la correccion de `menus`: `joc_tales_9`, `joc64`,
  `joc51` y `patoantic249` pasan MegaROM Konami desde `Downloads` con
  `dead-blocks,unused-screen-loaders,inactive-feature-runtime`, Glass,
  invariantes y smoke OpenMSX. Resultado: 45, 44, 43 y 23 parches
  respectivamente; la ruta backend validada pasa sobre esos ASM frescos.
- Incremento patchable para `bosses`: `inactive-feature-runtime` tiene ahora un
  grupo atomico `runtime.boss.group.all` que exige todas las ventanas esperadas
  antes de borrar nada. Si `project_usage` marca `bosses=0` y
  `bossInstances=0`, y no hay referencias externas al grupo, elimina juntos
  trampolines far-call, wrappers residentes y bloques runtime de boss. En
  `patoantic249` fresco se activan 7 ventanas atomicas adicionales; el resultado
  pasa a 30 parches y 1437 lineas / 37106 bytes retirados, con Glass/OpenMSX OK
  (`playerX=8->64`). En `joc_tales_9`, `joc64` y `joc51` la feature de bosses
  esta activa, asi que el grupo no se dispara y la matriz sigue pasando.
- Incremento de emision minima para `bosses`: cuando no hay bosses ni
  instancias de boss, `bosses.asm` ya no emite el runtime completo calculado
  con un feature-set vacio. Solo conserva stubs publicos de compatibilidad
  (`init_boss_system`, `update_boss_system` e
  `init_screen_boss_from_current_screen`) para no romper llamadas legacy. La
  regla `inactive-feature-runtime` anade ademas el grupo atomico
  `runtime.boss.group.stubs`, que borra esos stubs junto con trampolines y
  wrappers si quedan sin referencias externas. En `patoantic249`, el ASM que
  llega al postprocesador baja de unas 50911 a 50026 lineas antes de aplicar
  parches, y el resultado final queda en 49471 lineas tras 28 parches y 555
  lineas / 17131 bytes retirados. La matriz fresca desde `Downloads` pasa con
  Glass/OpenMSX en `joc_tales_9`, `joc64`, `joc51` y `patoantic249`; la ruta
  backend validada tambien pasa con 45, 44, 43 y 28 parches respectivamente.
- Incremento report-only por tipo de ataque de boss: `project_usage.json`
  incluye ahora `bossAttackRuntime.usedTypes`, `unusedTypes`, `typeCounts` y
  `referencedAttacks`, calculados solo sobre bosses alcanzables por
  `bossInstances`. La nueva regla `unused-boss-attack-runtime` cruza ese
  manifiesto con labels de runtime/wrappers/trampolines de cada tipo de ataque
  y reporta grupos candidatos sin emitir parches. En la matriz fresca,
  `joc64` usa `Projectile` y reporta 9 grupos de ataque no usados;
  `joc_tales_9` y `joc51` tienen boss runtime sin ataques referenciados y
  reportan 10 grupos; `patoantic249` no reporta grupos porque la familia
  `bosses` esta inactiva y ya la cubre `inactive-feature-runtime`. La matriz
  con `dead-blocks,unused-screen-loaders,inactive-feature-runtime,unused-boss-attack-runtime`
  pasa con Glass/OpenMSX: 45, 44, 43 y 28 parches respectivamente, sin cambios
  de apply por esta nueva regla report-only.
- Primer incremento patchable por tipo de ataque de boss: el grupo
  `runtime.boss.attack.meteor` puede emitir parches atomicos cuando todos los
  labels existentes son ventanas de rutina independientes y no hay referencias
  externas fuera del grupo. Esto evita borrar destinos si un trampoline sigue
  vivo dentro de una ventana que el parser no puede separar. En la matriz
  fresca, solo se retira `call_draw_boss_meteor_attack_resident` en
  `joc_tales_9` y `joc51`; `joc64` queda report-only porque conserva una
  referencia externa hacia el runtime de meteor; `patoantic249` no entra porque
  no tiene bosses. La matriz MegaROM Konami con OpenMSX pasa: 46, 44, 44 y 28
  parches, con ahorros de +2 lineas / +60 bytes en los dos proyectos donde el
  wrapper queda huerfano.
- Incremento de ownership de wrappers residentes de boss: el bloque comun
  `runtime.boss.resident_wrappers` se dividio en bloques individuales
  `runtime.boss.resident.* preserve=true`, uno por wrapper. Esto mantiene
  `dead-blocks` conservador, pero permite que los grupos atomicos de
  `inactive-feature-runtime` y `unused-boss-attack-runtime` retiren ventanas
  exactas sin tocar wrappers vecinos. La matriz fresca con la regla de ataque
  activa pasa en `joc_tales_9`, `joc64`, `joc51` y `patoantic249`; resultados:
  46, 44, 44 y 39 parches. El salto de `patoantic249` de 28 a 39 parches viene
  de poder retirar wrappers residentes de boss como ventanas separadas dentro
  del grupo inactivo. La ruta backend validada por defecto tambien pasa y ya
  aplica 39 parches en `patoantic249`.
- Incremento patchable para `runtime.boss.attack.bomb`: se habilita el mismo
  patron atomico conservador usado por `meteor`. Solo se retiran ventanas de
  `bomb` cuando no hay referencias externas al grupo y cada label existente es
  una rutina separable; si el runtime sigue referenciado, queda report-only. La
  cobertura unitaria confirma el borrado conjunto de wrappers `meteor` y `bomb`
  y el test de pruning de boss se actualizo para validar la ubicacion actual de
  la logica en `renderBossDataSections`.
- Incremento patchable para ataques simples restantes: el mismo patron atomico
  queda habilitado para `boomerang`, `rock`, `laser`, `sine_wave` y
  `homing_missile`. La cobertura unitaria valida que todas las ventanas
  residentes simples se retiran juntas solo cuando no hay referencias externas,
  dejando los ataques con runtime/helper compartido mas amplio para incrementos
  posteriores.
- Incremento backend/UI: `unused-boss-attack-runtime` queda habilitado en
  `POST /optimize-post-asm` y en el boton `Apply unused ASM (validated)`, bajo
  la misma validacion Glass/invariantes que las otras reglas patchables. La
  matriz backend con
  `dead-blocks,unused-screen-loaders,inactive-feature-runtime,unused-boss-attack-runtime`
  pasa con Glass e invariantes: `joc_tales_9` 52 parches, `joc64` 44,
  `joc51` 50 y `patoantic249` 39.
- Incremento de diagnostico para ataques complejos: cuando
  `unused-boss-attack-runtime` corre en modo apply y detecta un grupo sin
  referencias externas pero no validado como patchable, el reporte indica
  explicitamente que sigue report-only por no estar en el conjunto patchable.
  La cobertura unitaria fija `Projectile` en este estado para evitar activar
  runtimes con helpers compartidos sin una regla atomica completa.
- Incremento de cobertura report-only para `SlamRocks` y `FallingBlocks`: el
  reporte ahora agrupa tambien sus helpers internos (`draw_lanes`, RNG, clamp,
  lane/tile helpers, etc.) sin convertirlos en patchables. Esto deja visible el
  tamano real del runtime complejo antes de disenar una regla atomica segura.
- Incremento de cobertura report-only para `Projectile`: el helper
  `boss_projectile_select_velocity` queda asociado al grupo complejo, de modo
  que el reporte muestra tambien la logica de seleccion de velocidad sin abrir
  todavia una politica patchable para este runtime.
- Incremento de alineacion de codegen para `Projectile`: los stubs emitidos
  cuando el runtime de proyectil no se usa conservan tambien
  `boss_projectile_select_velocity: ret`, manteniendo el contrato de labels del
  reporte y evitando que el helper quede como rutina viva accidental.
- Incremento de dispatcher de boss: cuando solo queda un tipo de ataque
  referenciado, `draw_boss_attack` salta directamente a su renderer
  (`Meteor`, `Bomb`, `SlamRocks`, etc.), no solo a `Projectile`. Esto elimina
  ramas muertas del dispatcher y evita referencias artificiales a runtimes no
  usados.
- Validacion de matriz tras la simplificacion del dispatcher: la ruta backend
  por defecto con
  `dead-blocks,unused-screen-loaders,inactive-feature-runtime,unused-boss-attack-runtime`
  sigue pasando con Glass e invariantes en `joc_tales_9`, `joc64`, `joc51` y
  `patoantic249`; resultados: 52, 44, 50 y 39 parches.
- Incremento patchable para `Projectile`: el grupo atomico incluye los
  trampolines far/resident, `update_boss_projectile_runtime`,
  `draw_boss_projectile_attack`, `boss_projectile_select_velocity` y los
  helpers show/hide. El borrado solo se activa si no quedan referencias
  externas al grupo; la cobertura unitaria valida tanto el borrado completo
  como el bloqueo cuando un caller externo sigue apuntando a
  `draw_boss_projectile_attack`.
- Incremento patchable para `SlamRocks` y `FallingBlocks`: ambos grupos
  complejos pasan al mismo patron atomico conservador. Se incluyen sus rutinas
  draw/update y helpers internos de RNG, clamp, lanes y escritura de tiles; el
  borrado queda bloqueado si cualquier caller externo sigue apuntando al grupo.
- Validacion tras activar los ataques complejos: la matriz con
  `dead-blocks,unused-screen-loaders,inactive-feature-runtime,unused-boss-attack-runtime`
  pasa con Glass, invariantes y smoke de OpenMSX en `joc_tales_9`, `joc64` y
  `joc51`. `patoantic249` no se usa como bloqueo en este incremento porque su
  ASM base falla Glass con `Negative initial size` incluso sin post-ASM.
- Incremento de diagnostico ECS: `project_usage.json` incluye ahora
  `componentRuntime` con componentes usados por entidades activas, componentes
  ausentes y conteos por tipo. La nueva regla `unused-component-runtime` cruza
  esos datos con rutinas `update_*_component`, reportando llamadas externas que
  bloquean el borrado o candidatos sin referencias. Se mantiene report-only
  hasta disenar grupos atomicos por componente.
- Incremento patchable ECS inicial: `unused-component-runtime` ya aplica
  parches atomicos para rutinas `update_*_component` ausentes y sin referencias
  externas. En `joc_tales_9` retira 9 ventanas adicionales (+30 lineas /
  +1170 bytes sobre el reporte de regla), con Glass e OpenMSX smoke pasando.
- Incremento de helpers ECS exclusivos: los grupos `unused-component-runtime`
  incluyen tambien helpers `init_*_system` de componentes claramente propios
  (`AutoDestroy`, `Damage`, `Shoot`, `InWater`, etc.). El borrado atomico queda
  bloqueado si el init o el update mantiene referencias externas, evitando
  cortar inicializadores que aun esten conectados desde `init_components`. En
  `joc_tales_9` sube a 15 ventanas ECS patchable (+47 lineas / +1542 bytes en
  la regla) y la matriz con Glass/OpenMSX smoke sigue pasando.
- Incremento de bloqueo por helpers ECS: `WallJump` incluye ahora sus helpers
  globales (`walljump_process_entity_c`, `walljump_input_is_left/right`) dentro
  del grupo atomico. Si un fastpath externo sigue llamando al helper, el grupo
  completo queda report-only aunque `init_walljump_system` y
  `update_walljump_component` parezcan libres. Esta version conservadora deja
  `joc_tales_9` en 58 parches totales y 873 lineas / 24032 bytes retirados.
- Incremento de cobertura `WallGrab`: el grupo ECS incluye tambien
  `refresh_player_wallgrab_fastpath` y `wallgrab_process_entity_c`. En
  `joc_tales_9` el reporte detecta ahora tres referencias externas
  (`update_player_fastpath` y `gameflow_world_game_loop`) y mantiene el grupo
  bloqueado, sin cambiar los 58 parches totales ni el ahorro validado por
  Glass/OpenMSX.
- Correccion de alias ECS `TileInteraction`: el diagnostico ya no trata
  `update_slash_component` como componente `Slash` independiente. El tipo
  runtime pasa a ser `TileInteraction`, cubriendo `init_tile_interaction_system`,
  `update_slash_component` y `refresh_player_tile_interaction_fastpath`. En
  `joc_tales_9` desaparece un falso positivo report-only (120 findings), con
  los mismos 58 parches y OpenMSX smoke correcto.
- Cobertura de helper `AutoControlScript`: el grupo ECS incluye tambien
  `update_auto_event_string_component`, la variante hermana de
  `update_auto_control_script_component`. Si algun caller externo conserva esa
  ruta, bloqueara el grupo completo. En `joc_tales_9` el grupo queda con tres
  ventanas atomicas, pero el resultado final mantiene 58 parches y
  Glass/OpenMSX smoke correcto porque `dead-blocks` ya retiraba el bloque
  completo.
- Cobertura de init `Cursors`: el grupo ECS incluye tambien
  `init_cursors_system`, ademas de `update_cursors_component`. Esto evita que
  un proyecto sin `Cursors` pueda retirar solo el update mientras conserva un
  init llamado externamente. En `joc_tales_9` no cambia el resultado porque
  `Cursors` esta activo, y la matriz con Glass/OpenMSX sigue pasando.
- Cobertura de helpers `Damage`: el grupo ECS incluye tambien
  `apply_damage_to_entity` y `check_entity_invincible`, que el generador declara
  como raices del bloque `runtime.components.damage`. Si otra rutina conserva
  llamadas a esos helpers, el grupo completo queda bloqueado. En
  `joc_tales_9` no cambia el ahorro porque `Damage` esta stubbeado, pero queda
  cubierto por prueba unitaria y la matriz sigue pasando.
- Cobertura de helpers `Health`: el grupo ECS incluye tambien
  `decrease_entity_lives` e `increase_entity_lives`, raices del bloque
  `runtime.components.health` usadas por acciones de state machine y otros
  sistemas. Si un proyecto no usa `Health` pero aun conserva llamadas a esos
  helpers, el grupo queda bloqueado. En `joc_tales_9` no cambia el reporte
  porque `Health` esta activo, y Glass/OpenMSX siguen pasando.
- Validacion ECS en matriz backend/Downloads: el runner
  `scripts/run_post_asm_backend_route_matrix.cjs` usa por defecto
  `unused-component-runtime` junto con las reglas patchables anteriores. Con
  Glass activo pasan `joc_tales_9` (58 parches), `joc64` (49) y `joc51` (54);
  `patoantic249` queda marcado como overflow Glass conocido por su ASM base y
  se valida en modo invariantes-only. La matriz desde `Downloads` confirma
  OpenMSX smoke en `joc_tales_9`, `joc64` y `joc51`; `patoantic249` sigue
  bloqueado por `Negative initial size`, sin candidatos ECS adicionales.
- Diagnostico de dialogos indirectos: `inactive-feature-runtime` agrupa ahora
  el runtime de caja de dialogo (`dialogue_open_box`,
  `dialogue_start_line`, `dialogue_close_box`, etc.) como
  `runtime.dialogue.group.box`. El grupo queda explicitamente report-only y no
  emite parches aunque no tenga referencias externas; esto documenta el
  candidato sin asumir seguridad sobre callbacks o pantallas de dialogo. La
  prueba unitaria cubre que el grupo no sea patchable, y la matriz backend
  mantiene 58/49/54 parches en `joc_tales_9`/`joc64`/`joc51`.
- Diagnostico de menus indirectos: `inactive-feature-runtime` agrupa ahora
  `init_menus`, `update_menu_state`, `show_main_menu`, `show_menu_main` y
  helpers de input/seleccion como `runtime.menu.group.core`. Igual que
  dialogos, el grupo se queda report-only aunque no tenga referencias externas.
  La unidad cubre la politica y la matriz backend sin Glass conserva
  invariantes y los mismos parches aplicados.
- Diagnostico de ejecutor state-machine: `inactive-feature-runtime` agrupa
  `init_statemachine_system`, `update_statemachine_system`,
  `execute_all_state_machines` y sus wrappers far/resident como
  `runtime.state_machine.group.executor`. El grupo queda report-only para no
  asumir seguridad sobre callbacks/acciones indirectas. La unidad cubre la
  politica y la matriz backend sin Glass conserva invariantes.
- Diagnostico de handlers state-machine por dispatch: la regla
  `state-machine-dispatch-handlers` reporta `Action_*` y `Condition_*`
  alcanzados desde `SM_ActionTable`/`SM_ConditionTable` via `DW`. Es
  analysis-only y no participa en apply, para dejar claro que estos handlers
  son data-driven por ids de acciones/condiciones. En `joc_tales_9` detecta 6
  handlers table-dispatched; la matriz backend sin Glass conserva los mismos
  parches e invariantes.
- Metadata de ids state-machine usados: `project_usage.json` exporta ahora
  `stateMachineRuntime` con `usedActionIds`, `usedConditionIds`, tipos,
  contadores y tipos desconocidos. La regla `state-machine-dispatch-handlers`
  cruza esos ids con los comentarios numericos de `SM_ActionTable` y
  `SM_ConditionTable`, marcando un handler como listado/no listado por
  metadata sin generar parches. Esto deja preparado el siguiente paso seguro:
  validar la equivalencia asset-id/tabla antes de considerar cualquier borrado.
- Validacion inicial de ids state-machine en `Downloads`: la matriz
  check-only sobre `joc_tales_9`, `joc64`, `joc51` y `patoantic249` produjo
  metadata disponible para todos los informes (`metadataUnavailable=0`). Los
  conteos fueron `joc_tales_9` 6 handlers (2 listados por metadata),
  `joc64` 13 (10 listados), `joc51` 13 (10 listados) y `patoantic249` 18
  (16 listados). `patoantic249` mantiene el fallo Glass conocido
  `Negative initial size`. OpenMSX smoke paso en `joc51`
  (`playerX=16->132`), `joc_tales_9` (`216->80`) y `joc64` (`16->134`).
- Incremento patchable de handlers state-machine: la regla
  `state-machine-dispatch-handlers` ya puede aplicar borrado si
  `project_usage.stateMachineRuntime` esta presente, todos los ids de tabla del
  handler estan ausentes de `usedActionIds`/`usedConditionIds`, no hay
  referencias externas directas y la ventana no cruza marcadores de banco. El
  parche anula tambien cada entrada de dispatch con `DW 0` en el mismo grupo
  atomico antes de retirar el cuerpo del handler, evitando dejar tablas que
  apunten a labels borrados.
- Integracion de matrices para state-machine patchable: el runner backend y la
  matriz `Downloads` usan por defecto
  `dead-blocks,unused-screen-loaders,inactive-feature-runtime,unused-boss-attack-runtime,unused-component-runtime,state-machine-dispatch-handlers`,
  alineados con el boton `Apply unused ASM (validated)` y cubiertos por la
  prueba de endpoint/UI para evitar que el roadmap y los scripts vuelvan a
  desincronizarse.
- Validacion backend tras activar state-machine en defaults: con Glass activo,
  `joc_tales_9`, `joc64` y `joc51` compilan con 122, 104 y 109 parches
  aplicados respectivamente e invariantes correctas. `patoantic249` mantiene el
  overflow Glass conocido y valida en modo invariantes-only con 95 parches.
- Correccion de defaults del CLI post-ASM: `scripts/post_asm_optimize.py
  --apply` sin `--rules` ya no queda en modo report-only accidental. En modo
  analisis sigue usando todas las reglas, pero en modo apply usa el mismo
  conjunto validado que UI/backend para que builds directos y runners tengan
  comportamiento consistente.
- Trazabilidad de reglas efectivas: los reportes JSON/Markdown incluyen ahora
  `selected_rules`, y el resumen de `build_mideas_unified_rom.py` imprime el
  conjunto real usado. Esto permite auditar si un build aplico los defaults
  patchables o una seleccion manual sin reconstruir el comando original.
- Trazabilidad en backend/UI: `POST /analyze-post-asm` y
  `POST /optimize-post-asm` propagan `selectedRules` desde el reporte real y
  el modal de exportacion lo muestra junto a los resultados. Asi el usuario ve
  en la UI si esta aplicando los defaults patchables o una lista manual.

## Primer conjunto de reglas candidatas

Prioridad alta:

- Runtime de boss no usado.
- Tipos de ataque de boss no usados.
- Sistemas ECS no llamados por ningun componente instanciado.
- Handlers de state machine no referenciados.
- Ramas de menu/dialogo/audio cuando no hay assets de ese tipo.
- Rutinas de fake player/player mutuamente exclusivas por pantalla.

Prioridad media:

- Variantes de colision no usadas.
- Rutinas de proyectiles si no hay componentes o bosses con proyectiles.
- Loaders de recursos no requeridos por el formato ROM.
- Tablas de sprites/tilebanks no alcanzables desde pantallas usadas.
- Helpers de debug o diagnostico no llamados en build release.

Prioridad baja:

- Microoptimizaciones de instrucciones sueltas.
- Limpieza de labels locales huerfanos.
- Fusion de tablas pequenas duplicadas.

## Riesgos principales

- Referencias indirectas: dispatch por tablas, `DW label`, calculos `low/high`,
  macros y rutinas llamadas desde codigo de usuario.
- Mapper y bancos: una rutina puede parecer no usada en banco local pero ser
  entrada de far-call o trampoline.
- Datos comprimidos: las direcciones y tamanos pueden depender de layout final.
- Glass puede aceptar expresiones que el parser propio no entiende aun.
- El ahorro de lineas no siempre equivale a ahorro ROM si hay padding de banco.

Mitigacion:

- Preservar por defecto lo no entendido.
- Requerir anotaciones para borrado agresivo.
- Validar con Glass despues de cada aplicacion.
- Reportar candidatos conservados para que el siguiente trabajo sea anotar o
  modelar la referencia, no forzar borrados.

## Definicion de terminado

La optimizacion se puede considerar lista para uso diario cuando:

- Puede ejecutarse en modo analisis en cualquier export sin romper el flujo.
- Puede aplicar borrado en proyectos de referencia y compilar ROMs validas.
- Produce reportes accionables y deterministas.
- Tiene una lista clara de bloques preservados y candidatos conservados.
- El usuario puede desactivar la optimizacion y recuperar el ASM original.
- El pipeline demuestra ahorro real en proyectos grandes sin regresiones en
  OpenMSX.

## Siguiente paso recomendado

El siguiente incremento util es probar un proyecto adicional con mas handlers o
con mas variedad de condiciones antes de plantear una regla separada de handlers
state-machine patchable. Mientras tanto el cruce debe seguir siendo
analysis-only. El overflow de `patoantic249` se debe tratar como trabajo aparte
de packing/tamano, no como regresion de `unused-component-runtime`.
