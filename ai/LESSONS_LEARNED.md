# Lessons Learned

## Plantilla

Fecha:

Problema:

Causa:

Solucion:

Leccion Aprendida:

---

## Bug Resuelto: HMMM/HMMV usan coords de pixel, no de byte (mitad de pantalla)

Fecha: 2026-06-24

Problema:
Al migrar el command engine del bitmap room de LMMM/LMMV a HMMM/HMMV para
acelerar las transiciones de pantalla, solo se renderizaba la mitad izquierda
de la sala al cambiar de pantalla.

Causa:
Asumí (basandome en el comentario del codigo Y en `MSX2_BITMAP_MULTICOLOR_STUDY.md:140`)
que los comandos H (HMMM/HMMV) del V9938 operan en coordenadas de BYTE (2px/byte
en SCREEN 5). Dividí SX/DX/NX entre 2 en `buildVdpCommandBlock`. Eso halveó todo:
NX=8 (media tile), DX=C*8 (tiles apilados en la izquierda).

En realidad HMMM/HMMV usan el MISMO espacio de coordenadas en PIXELS que
LMMM/LMMV. La unica restriccion es que las X sean PARES (byte-aligned), lo cual
ya se cumple porque todas nuestras coords son multiplos de 16 o 2.

El comentario original del codigo ("0xD0/0xC0 doubled every X coordinate") y la
linea 140 del doc del proyecto estaban AMBOS equivocados. El primer analisis del
agente explore (Opt #1: "just swap the constants, HMMM uses pixels") era CORRECTO
desde el principio.

Solucion:
Quitar el `/2` en `buildVdpCommandBlock`. Pasar coords de pixel directamente a
HMMM/HMMV (commit `908cef24`). Las X ya son pares.

Leccion:
**HMMM/HMMV usan coordenadas de pixel, no de byte, en SCREEN 5/6/7/8.** Son
~10x mas rapidos que LMMM/LMMV porque saltan la operacion logica per-pixel, NO
porque cambien el sistema de coords. La restriccion es X par (byte-aligned).

Variante de proceso: cuando un comentario o doc interno contradice el datasheet
oficial del V9938, Y hay un bug visual empirico, **el bug empirico gana**. No
confiar ciegamente en docs internos que pueden haber sido escritos tras un bug
distinto y mal diagnosticado. El comentario original atribuia a HMMM un
"doubling" que probablemente venia de otro fallo; se descarto HMMM por la razon
equivocada y el proyecto se quedo con el LMMM lento durante meses.

Sintoma delator: "solo se ve la mitad izquierda" = coords/widths divididas entre
2 por error. Siempre que se vea half-screen en V9938 commands, revisar si se
esta dividiendo X entre 2 sin razon.

---



Fecha:

Problema:

Causa:

Solucion:

Leccion Aprendida:

---

## Bug Resuelto: MegaROM SCREEN 5 bitmap escribe banco en RAM si page 2 no es cartucho

Fecha: 2026-06-20

Problema:
SCREEN 5 bitmap-room en simple32k renderizaba bien, pero en MegaROM Konami
terminaba blanco. El probe de OpenMSX mostraba que tras `ld (#8000),4`, la CPU
leia `#04` desde `#8000`.

Causa:
La rutina habia copiado los setters de banco Konami de SCREEN 4, pero no la
rutina previa que mapea `#8000-#BFFF` al mismo slot del cartucho que `#4000`.
Sin esa seleccion de slot, `ld (#8000),A` escribia RAM en vez del registro del
mapper, y el decoder RLE leia basura/blancos desde RAM.

Solucion:
Antes de inicializar los bancos Konami, llamar a una rutina tipo
`map_page2_to_cart_primary` que usa `RSLREG`, resuelve slot expandido desde
`#FCC1`, y llama a `ENASLT` con `H=#80`. Despues ya son validos
`mapper_set_bank_p1/p2/p3`.

Leccion:
Al portar rutinas MegaROM entre backends, copiar el ciclo completo:
seleccion de slot del cartucho + inicializacion de bancos + setters. Si un
probe tras `ld (#8000),A` lee el mismo valor escrito, no hay mapper activo en
esa pagina; es RAM visible.

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

---

## Bug Resuelto: boton declarativo creaba estados no linkados

Fecha: 2026-06-07

Problema:
El boton de Player Config para crear `Player_sm` generaba estados para animaciones como Attack o Fall aunque el usuario no las habia linkado en la columna State.

Causa:
La rutina de UI tomaba todas las filas de animacion como fuente de estados, mezclando "animacion existente" con "estado explicitamente linkado".

Solucion:
Crear/actualizar `Player_sm` solo desde filas con `stateMachineState` ya definido y no modificar los links de animacion de forma automatica.

Leccion:
En herramientas declarativas, una accion de sincronizacion debe respetar solo enlaces explicitos. No inferir ni crear relaciones nuevas desde datos presentes pero no linkados por el usuario.

---

## Bug Resuelto: asset global compartido entre multiples Players

Fecha: 2026-06-07

Problema:
El boton de Player Config para crear `Player_sm` podia pisar o mezclar la state machine si el proyecto tenia dos o mas assets de Player.

Causa:
La rutina usaba un nombre/id global fijo para una accion ejecutada desde un asset concreto, sin respetar primero `stateMachineAssetId` ni aislar por owner.

Solucion:
Priorizar la state machine ya linkada al Player. Si no existe link, crear un asset provisional con el nombre del asset Player activo mas `_sm` (por ejemplo `aphorita_sm`) y anadir sufijo numerico solo si hay colision.

Leccion:
Cuando un editor crea assets auxiliares, debe actualizar primero el link explicito existente. Para nuevas creaciones, derivar el nombre del asset owner visible y enlazar el asset creado sin modificar el owner.

---

## Bug Resuelto: edicion interna renombraba asset Player

Fecha: 2026-06-07

Problema:
Al modificar enlaces de State en Graphics & Render, el asset visible de Player Config se renombraba a `Player_Main`.

Causa:
Las ediciones internas del Player Config guardaban un documento normalizado completo. El handler de assets copia `player.identity.name` al nombre visible del asset, y el normalizador podia restaurar el default `Player_Main`.

Solucion:
Al guardar ediciones internas del Player Config, preservar `activeAsset.name` dentro del documento generado antes de llamar a `handleUpdateAsset`.

Leccion:
Los nombres visibles de assets deben cambiar solo por acciones explicitas de rename. Los normalizadores de datos internos no deben sobreescribir identidad visible durante ediciones parciales.

---

## Bug Resuelto: UI mostraba ids de estado como nombres

Fecha: 2026-06-07

Problema:
La columna State mostraba ids internos en mayusculas como `ATTACK`, mientras el selector podia mostrar nombres humanos como `Attacking`, causando confusion.

Causa:
La tabla renderizaba directamente `animation.stateMachineState`, que es el id estable del estado, no su etiqueta visible.

Solucion:
Resolver la etiqueta visible desde el State Machine enlazado o, si no existe, desde un mapeo amigable de ids conocidos (`ATTACK` -> `Attacking`).

Leccion:
En UI declarativa, distinguir siempre entre id interno estable y nombre visible. Mostrar ids tecnicos solo como tooltip/debug, no como etiqueta principal.

---

## Bug Resuelto: cambio en ASM runtime MSX sin smoke automatizable congela el player

Fecha: 2026-06-08

Problema:
Un commit (a6f2a38c, después revertado en c82503da) que conectaba los parámetros
de la skill core `jump` (`enabled`, `jumpPower`, `requireKeyRelease`, mas los
nuevos `coyoteTime` y `jumpBuffer`) al ASM runtime del salto en MSX2 congeló al
player en un proyecto de prueba (`downloads/push_example21.json`) sin que el
usuario hubiera tocado nada: la ROM arrancaba, el player se renderizaba, pero
no respondía a las teclas (ni movimiento ni salto).

Causa:
Dos fallos compuestos:

1. **R1-A incompleto**: el plan era que proyectos legacy sin `skillParameters.jump`
   poblada en el JSON cayesen al fallback de `movement.*` / `components['msx2_jump']`
   con ASM bit-identical al pre-cambio. La mitad del fallback estaba bien
   (campos nuevos como `coyoteTime`/`jumpBuffer` se leían de `movement.*` legacy,
   que ya estaba en el JSON aunque el ASM no los usaba antes), pero la otra
   mitad NO: el generador `getMsx2PlatformPhysicsFromPlayerEntity` empezó a
   propagar `coyoteTime=4` y `jumpBuffer=4` desde `movement.*` legacy, y el
   generador ASM emitió bloques nuevos (EQU #C005, #C007, decremento por
   frame, lógica de coyote/buffer en `jumpInputBlock`/`.platform_land`/`.platform_check_grounded`)
   para un proyecto que ya tenía esos campos en el JSON. La ASM dejó de ser
   bit-identical, y se introdujeron rutas de código no probadas en runtime.

2. **Bug lógico probable en la ASM nueva**: aún revisando con cuidado el flujo
   del salto, la nueva lógica de coyote/buffer (`.platform_coyote_blocked`,
   `.platform_land_settle`, decremento de timers en `.platform_after_jump_input`)
   no se pudo verificar end-to-end sin OpenMSX Debug, porque no hay forma
   automatizada desde la sesión de la IA de:
     - Construir un `ProjectAnalysis` mínimo que active el path
       `usesMsx2PlatformVerticalPhysics`.
     - Invocar el generador ASM con ese analysis y obtener el ASM.
     - Compilar el ASM con `glass.jar` vía `/compile` (el endpoint recibe ASM,
       no JSON; la conversión JSON→ASM vive en la IDE cliente, no en el
       servidor).
     - Cargar la ROM en OpenMSX con breakpoints/watchpoints.

   El smoke test que pasó (`test:msx2-skill-params-contract`, 18/18) validaba
   la presencia de strings/funciones en el código TypeScript, no el resultado
   runtime. Es un test estructural, no funcional.

Solucion:
1. Revert inmediato con `git revert a6f2a38c --no-edit` (commit c82503da).
   El proyecto vuelve a compilar y funcionar como antes.
2. Decisión de no reintentar el commit de coyote/buffer en ASM hasta tener un
   mecanismo de smoke que la IA pueda ejecutar offline.

Leccion:
**No modificar runtime ASM MSX sin smoke automatizable end-to-end.** El flujo
"compilar ROM con un JSON real, cargar en OpenMSX Debug, probar mecánicas"
vive en la IDE y no es invocable desde la sesión de la IA. Un test que solo
valida strings/funciones en TypeScript (como `check_skill_params_contract.cjs`)
es estructural, no funcional: confirma que el código ESTA, pero no que el
código CORRE bien.

Variantes de esta lección:
- Para cambios en runtime ASM, el smoke debe hacerlo el humano en la IDE.
  El commit debe declarar explícitamente que el smoke OpenMSX está pendiente
  y ser revertido si el humano reporta regresiones.
- Para coyote/jumpBuffer y otras mecánicas de física opcionales, considerar
  implementarlas en el Player JS (modo Play del navegador) en vez de en el
  ROM. La IA sí puede validar el Player JS con tests estándar.
- Antes de tocar ASM, construir primero un test que invoque el generador
  con un `ProjectAnalysis` sintético y compare snapshots de la ASM
  (golden files). Si la ASM cambia, el diff obliga a justificar cada línea.
  Esto es verificable offline.

---

## Bug Resuelto: EQU nueva pisa byte alto de puntero 16-bit y corrompe runtime

Fecha: 2026-06-08

Problema:
Para añadir las variables `msx2_player_coyote_timer` y
`msx2_player_jump_buffer_timer` en el bloque de EQUs del player MSX2
(`msx2Screen4Generator.ts`), elegí las direcciones `#C005` y `#C007`
porque "parecían huecos" entre EQUs de 1 byte. El player se congeló:
la ROM arrancaba pero no respondía a input.

Causa:
`#C005` es el byte alto del puntero 16-bit little-endian
`msx2_current_collision_ptr EQU #C004` (ocupa #C004-#C005). `#C007` es
el byte alto de `msx2_current_effects_ptr EQU #C006` (ocupa #C006-#C007).
Mi verificación inicial buscaba EQUs de 1 byte en esas direcciones
(`Select-String -Pattern "#C005|#C007|#C009"`) y no encontró nada, pero
ESAS DIRECCIONES SÍ ESTÁN OCUPADAS como parte de punteros 16-bit.

Cuando se ejecuta `msx2_restart_game`, mi inicialización
`xor a; ld (msx2_player_coyote_timer), a; ld (msx2_player_jump_buffer_timer), a`
escribe 0 en #C005 y #C007, **sobrescribiendo los bytes altos de los
punteros** y dejándolos con valores como `#C004-#C000` (collision_ptr apunta
a #C000 en vez de a la dirección real) y `#C006-#C000` (effects_ptr igual).
El runtime no puede calcular colisiones, las rutinas de input leen
estados rotos y el player deja de responder a las teclas.

Múltiples lugares escriben 16-bit a estos punteros en cada frame de juego
(grep `ld \(msx2_current_collision_ptr\), hl` y
`ld \(msx2_current_effects_ptr\), hl` confirmó 6 sitios).

Solucion:
Mover las EQUs nuevas a direcciones que sean realmente de 1 byte y no
parte de ningún puntero 16-bit. Usé `#C047` y `#C048`, que están
después de `MSX2_CONTROLS_RAM_BASE` (que termina en #C046) y antes de
las EQUs dinámicas de runtime. Verifiqué con:

```bash
Select-String -Path utils/msxGenerator/generators/msx2/msx2Screen4Generator.ts \
  -Pattern "EQU.*#C04[7-9A-F]"
# (sin resultados: ningún EQU en ese rango)
```

Adicionalmente, añadí un check de regresión en
`scripts/check_skill_params_contract.cjs` que verifica que las nuevas
EQUs NO caen en direcciones que ya tienen un EQU de 1 byte
(`#C047` y `#C048` deben ser únicas) y NO están en el rango
`#C004-#C045` que contiene los punteros 16-bit y las variables del player.

Leccion:
**Cuando añadas una nueva EQU de RAM en `msx2Screen4Generator.ts`, verifica
que la dirección NO sea parte de un puntero 16-bit little-endian.** Una
verificación con `Select-String` por EQUs de 1 byte en esa dirección NO
es suficiente: el byte puede estar libre como EQU de 1 byte pero
ocupado como byte alto/bajo de un puntero de 2 bytes adyacente.

Reglas concretas para elegir direcciones RAM nuevas en este archivo:
1. Listar TODAS las EQUs (`Select-String -Pattern "EQU #C0"`) y ordenarlas.
2. Para cada hueco entre EQUs adyacentes, comprobar si las dos EQUs
   implicadas son la parte baja y alta de un mismo puntero 16-bit
   (mismo prefijo, direcciones consecutivas como #C004-#C005,
   #C006-#C007, #C008-#C009, #C01A-#C01B, #C023-#C024, etc.).
3. Si el hueco está entre dos punteros 16-bit consecutivos, está
   Ocupado. Si está entre dos variables de 1 byte, está Libre.
4. Como red de seguridad, AÑADIR un test automatizado en
   `check_skill_params_contract.cjs` que:
     a) Verifique que cada nueva EQU tiene un check único
        (`msx2_player_coyote_timer EQU #C047` no debe chocar con
        `msx2_*_something_else EQU #C047`).
     b) Verifique que la dirección no cae en ningún rango conocido
        de punteros 16-bit del archivo.

Síntomas típicos de este bug en runtime: ROM arranca, player visible,
no responde a input (ni movimiento, ni salto, ni disparo). A veces el
HUD se actualiza pero la física está congelada. El OpenMSX Debug
mostraría el `msx2_current_collision_ptr` o `msx2_current_effects_ptr`
apuntando a una dirección absurda (#C000, #C001, etc.) en vez de a la
zona de colisiones del runtime.

---

## Bug Resuelto: base RAM definida como const TS invisible para grep de EQUs

Fecha: 2026-06-10

Problema:
push_example22 (pushBox + coyoteTime=8) iba a tirones y las cajas se corrompian:
el coyote timer en #C047 ERA msx2_box2_count. Al armar el coyote en el aire
aparecian 8 cajas fantasma y el decremento por frame borraba las reales.

Causa:
La verificacion de la leccion 2026-06-08 busco "EQU #C047" en el fuente, pero
la base del runtime box2 es una constante TypeScript (MSX2_BOX2_RAM_BASE =
0xC047) que nunca aparece como literal EQU: las direcciones se generan con
formatHexWord en runtime.

Solucion:
Centralizar el layout en msx2SkillRamLayout.ts: timers (2) -> dash (4) ->
teleport (8) -> glide (2), con base dependiente de pushBox (#C049 o
#C047+48=#C077) y assert en generacion contra el limite #C087
(msx2_effects_runtime_buffers). Prohibido hardcodear EQUs de esa zona;
check automatizado en check_skill_params_contract.cjs.

Leccion:
Para validar una direccion RAM nueva no basta grepear EQUs literales: hay que
revisar las constantes TS que generan EQUs dinamicos (formatHexWord/template).
Toda region RAM compartida debe tener UN modulo de layout como fuente unica.

---

## Bug Resuelto: skills MSX2 confiaban en registros/flags a traves de calls

Fecha: 2026-06-10

Problema:
Dash: player invisible durante el dash y aparecia desplazado de golpe.
Teleport: fallaba siempre que el destino estaba a la derecha o abajo.

Causa:
1) Dash guardaba la X destino en E y llamaba msx2_collision_at_pixel, que
   documenta "Clobbers AF/DE/HL": E volvia con el indice de celda del mapa
   y se escribia como nueva X del player.
2) msx2_teleport_abs_tiles hacia "or a" antes de "jp nc": el or a borra el
   carry del SUB del caller, la rama de negacion era codigo muerto y todo
   delta negativo se leia como ~30 tiles -> rechazado por maxDistance.

Solucion:
1) push de / pop de alrededor de cada probe de colision del dash.
2) Branch directo sobre el carry del SUB (call preserva flags) documentando
   el carry como INPUT del contrato. Anadido check de colision en destino.

Leccion:
Confirma la regla del charter: primera hipotesis, registros no preservados.
Variante nueva: los FLAGS tambien son estado fragil; cualquier instruccion
logica (or a) los destruye. Si una rutina depende de flags del caller,
documentarlo como INPUT explicito o recalcular dentro.

---

## Bug Resuelto: fragmento ASM generado referenciaba labels de otro scope

Fecha: 2026-06-10

Problema:
Dash + pushBox no compilaba: el hook buildMsx2Box2PlayerHookAsm emite
"jp c, .right_blocked", label local que solo existe dentro de
move_hardware_sprite_right, no en msx2_step_dash_movement.

Causa:
Reutilizar un fragmento ASM generado fuera de la rutina para la que se
diseno. Glass scopa labels locales (.x) a la label global anterior.

Solucion:
Eliminar los hooks del dash: las cajas siguen siendo solidas via el override
de msx2_collision_at_pixel, asi que el dash se detiene en ellas sin hook.

Leccion:
Un builder de fragmentos ASM con labels locales debe declarar en que rutina
es valido insertarlo. Antes de reutilizarlo, verificar que todas las labels
que referencia existen en el scope de insercion.

---

## Bug Resuelto: backticks en comentarios ASM dentro de template literals TS

Fecha: 2026-06-10

Problema:
esbuild se quejaba de sintaxis invalida en msx2WallJumpGenerator.ts. La linea
`;   \`move_hardware_sprite_left/right\`. To "lock vx" during the` tenia
backticks que esbuild interpretaba como cierre del template literal TS.

Causa:
Los comentarios ASM usan backticks (\`) para enfatizar nombres de funciones,
pero el codigo TypeScript que genera el ASM usa template literals (`` ` ``) y
los backticks anidados rompen el parseo. Glass no se ve afectado porque lee el
ASM ya generado, pero el toolchain TS/esbuild falla al compilar.

Solucion:
Reemplazar los backticks de los comentarios ASM por comillas simples (').

Leccion:
En generadores ASM dentro de template literals TS, evitar backticks en
cualquier string interior. Usar comillas simples o dobles para enfatizar
nombres en comentarios.

---

## Bug Resuelto: glideEnabled faltaba en Msx2SkillRamOptions

Fecha: 2026-06-10

Problema:
La funcion resolveMsx2SkillExtensionRamBase no tenia la opcion glideEnabled,
por lo que glide no se incluy en la cadena de calculo de direcciones RAM.
Esto causaba que:
- glide calculaba su base incluyendo wall_jump (4 bytes que debian ir DESPUES)
- wall_jump calculaba su base SIN incluir glide (2 bytes que debian ir ANTES)

Causa:
Al anadir wall_jump a Msx2SkillRamOptions se omitio glideEnabled, rompiendo
el orden de la cadena: timers -> dash -> teleport -> glide -> wall_jump.

Solucion:
Anadir glideEnabled: boolean a Msx2SkillRamOptions, MSX2_GLIDE_RAM_BYTES al
import, y if (options.glideEnabled) en el orden correcto de la cadena.
Actualizar buildMsx2SkillRamOptions a 5 parametros y todos sus call sites.

Leccion:
Toda skill anadida a la cadena de RAM debe incluirse en Msx2SkillRamOptions Y
en resolveMsx2SkillExtensionRamBase en el orden correcto. No asumir que solo
la skill nueva necesita cambios: verificar que skills intermedias (como glide)
sigan en la cadena.

---

## Bug Resuelto: init clear de wall_slide_side usaba 0 en vez de 0xFF

Fecha: 2026-06-10

Problema:
buildMsx2WallJumpInitClearAsm hacia `xor a; ld (msx2_wall_slide_side), a`,
dejando wall_slide_side=0 al iniciar. Pero 0 es el valor "wall left in
contact", no "no wall". Al empezar la partida, el runtime detectaba
incorrectamente que el player estaba tocando una pared izquierda.

Causa:
La funcion de init usaba `xor a` (generico para cero) sin considerar que
wall_slide_side usa 0xFF como centinela de "no wall in contact".

Solucion:
Cambiar el init a `ld a, MSX2_WALL_SLIDE_NONE; ld (msx2_wall_slide_side), a`
seguido de `xor a` para los demas campos.

Leccion:
Para variables de estado con centinela (valores especiales que significan
"inactivo"), el init clear debe usar el centinela, no cero generico.

---

## Bug Resuelto: key_lock de skill sin rutina de release

Fecha: 2026-06-11

Problema:
Wall_jump solo funcionaba UNA vez por vida. El smoke OpenMSX mostro
keylock=1 permanente tras el primer kick.

Causa:
msx2_try_wall_jump_kick ponia msx2_wall_jump_key_lock=1 (requireKeyRelease)
pero ninguna rutina lo limpiaba al soltar la tecla. El dash tiene
msx2_dash_release_lock; wall_jump no tenia equivalente.

Solucion:
Anadir msx2_wall_jump_release_lock (mismo patron que dash) y llamarla en el
input gate antes de try_kick.

Leccion:
Todo flag de tipo lock necesita su par set/clear verificado: si una skill
usa requireKeyRelease, debe existir y llamarse cada frame una rutina de
release. Al copiar el patron de una skill existente, copiar el ciclo de
vida COMPLETO de cada variable, no solo el arm.

---

## Tecnica: smoke determinista inyectando paredes en la cache de colision

Fecha: 2026-06-11

Problema:
Verificar wall_jump en mapas pushbox era no determinista: todas las
"paredes" eran cajas empujables que se alejaban al acercarse, y habia
transiciones de pantalla.

Solucion:
Desde el script TCL de openMSX: leer msx2_current_collision_ptr (#C004/05),
escribir #01 (solid) en celdas (fila*16+col) para crear una pared estatica,
y reubicar cajas escribiendo msx2_box2_runtime_x + limpiando su celda.
Luego keymatrixdown/up + lecturas de RAM dan un escenario reproducible.

Leccion:
Para smokes de mecanicas dependientes del mapa, inyectar el terreno por
debug en la cache RAM es mas fiable que depender del layout del fixture.

---

## Bug Resuelto: ld bc,#nnnn con bytes invertidos escribe al registro VDP equivocado

Fecha: 2026-06-11

Problema:
Al activar el skill power_stomp (con screenShake), la ROM compilaba pero el
juego se colgaba en el GameFlow ANTES del main loop: player invisible,
congelado, flags=0, sin responder a teclas. PC atascado en BIOS (#19A6).

Causa:
La init-clear del screen shake reseteaba R#18 (display adjust) con
`ld bc, #1200` creyendo que cargaba B=#00 (valor), C=#12 (registro 18).
Pero `ld bc, #1200` carga B=#12, C=#00. WRTVDP (BIOS) toma valor en B,
registro en C -> escribia #12 al registro R#0, cambiando el modo de pantalla
y habilitando la interrupcion de linea (IE1). El VDP quedaba en un estado
roto durante el init y el arranque nunca alcanzaba el main loop.

Solucion:
`ld bc, #0012` (B=#00 valor, C=#12 registro 18). Verificado en OpenMSX:
arranque correcto, stomp + shake (R#18 oscila #20->#10->#00 y centra).

Leccion:
En `ld bc, #nnnn` el byte ALTO va a B y el byte BAJO a C. Para WRTVDP
(valor en B, registro en C) la constante combinada es
`#(valor)(registro)` -> registro 18 con valor 0 = `#0012`, NO `#1200`.
Sintoma de un WRTVDP a registro equivocado: el VDP/modo se rompe en el
init y el juego se cuelga antes del primer frame jugable. Preferir
`ld b,valor / ld c,registro` separados cuando haya duda del orden.

Variante de proceso: cuando un agente escribe ASM, revisar a mano TODA
constante combinada `ld rr,#nnnn` usada con BIOS que dependa del orden de
bytes (WRTVDP, WRTPSG, etc.). El smoke OpenMSX por PC/breakpoints localiza
estos cuelgues de init en minutos (input_gate_hits=0 + PC en BIOS).

---

## Bug Resuelto: gate de skill basado en flag stale

Fecha: 2026-06-11

Problema:
Al separar `dash` (suelo) y `air_dash` (aire), el primer intento uso
`msx2_player_flags` bit 0 para decidir grounded/airborne. En OpenMSX,
tras boot el player estaba visualmente apoyado, pero el flag aun podia estar
a 0 antes de que la fisica vertical lo refrescara. Resultado: `air_dash`
se podia activar en suelo.

Causa:
El gate de input corria antes de la pasada vertical que recalcula el flag de
suelo. El estado RAM era valido como cache de fisica, pero no como fuente
autoritaria para una decision de input en ese punto del frame.

Solucion:
Usar un probe fisico directo bajo los pies con `msx2_collision_at_pixel`
para decidir si `dash`, `air_dash` o el salto normal pueden arrancar. En el
salto normal, aceptar tambien el flag grounded cacheado cuando ya esta
asentado, porque depender solo del probe previo a la fisica vertical puede
bloquear el salto en reposo. Ademas, cuando
`air_dash` empieza con el mismo boton que `dash`, activar tambien
`msx2_dash_lock` para que una pulsacion mantenida no encadene ambas skills.

Leccion:
Para gates de skills sensibles al orden del frame, no confiar en flags
cacheados si se actualizan mas tarde en el loop. Usar estado recien calculado
o un probe directo. Si dos skills comparten boton por contexto, revisar locks
cruzados: una pulsacion no debe disparar dos mecanicas consecutivas.

## 2026-06-11 - MSX2: salto en reposo puede fallar por probes de pie estrechos

Causa:
El salto y el refresco de grounded dependian de dos probes bajo los pies con
inset lateral. En algunas posiciones iniciales o alineaciones contra tiles,
ambos probes podian caer justo fuera del solido aunque el sprite pareciera
estar apoyado. Al moverse horizontalmente, la X cambiaba y el probe volvia a
tocar suelo, por eso el salto funcionaba en movimiento.

Solucion:
Mantener los probes izquierdo/derecho y anadir un probe central bajo el cuerpo
para el gate de salto, la caida y el chequeo grounded sin velocidad vertical.

Leccion:
Para grounded en plataforma, dos muestras estrechas pueden crear falsos
negativos en reposo. Usar al menos izquierda/centro/derecha cuando el resultado
alimenta input critico como salto.

## 2026-06-11 - MSX2: air_dash puede robar el input de salto en suelo

Causa:
`air_dash` se ejecuta antes del salto normal. Su gate de "solo en aire" usaba
solo probes directos bajo los pies; si esos probes fallaban en reposo, arrancaba
air dash estando en suelo y el frame activo saltaba la fisica vertical donde se
aplica el impulso de salto.

Solucion:
En `msx2_air_dash_player_grounded`, aceptar primero `msx2_player_flags` bit 0
cuando ya esta marcado como grounded, y usar probes izquierda/centro/derecha
solo como respaldo si el flag esta limpio o desfasado.

Leccion:
Las skills que corren antes del salto no deben consumir el boton si hay una
evidencia fuerte de grounded cacheado. Si una skill contextual se evalua antes
que la mecanica base, sus falsos positivos son mas peligrosos que sus falsos
negativos.

---

## Bug Resuelto: bloque activo de skill envenena el fallthrough idle del input

Fecha: 2026-06-12

Problema:
Con air_dash activado, el salto normal moria por completo estando el player
quieto (flags=0 permanente, sin gravedad). Dos commits previos de "fix jump
gate" parchearon el sintoma (probes de pies en el salto) sin ver la causa.

Causa:
El bloque ".air_dash_active_input" se inserto en el FALLTHROUGH del dispatch
GTSTCK de update_hardware_sprite_input. Sin direccion pulsada, el flujo caia
dentro del bloque, cuyo final es "jp upload_hardware_sprite_attrs" (salta la
fisica vertical a proposito durante el burst). Resultado: la fisica vertical
no corria NUNCA en idle. El ground dash en esa misma posicion era benigno
por casualidad: su bloque termina en "jp update_hardware_sprite_vertical".

Solucion:
Mover el bloque activo del air dash DETRAS del "jp update_hardware_sprite_vertical"
final (alcanzable solo via los jp del gate), dentro del mismo scope de labels.

Leccion:
Todo bloque con label local insertado en el camino de fallthrough de una
rutina DEBE ser transparente para ese camino (terminar saltando a donde el
fallthrough iba). Si el bloque desvia el flujo (como un burst que salta la
fisica), colocarlo fuera del camino, tras el salto final. Sintoma tipico:
mecanicas que funcionan en movimiento pero mueren en idle.

---

## Bug Resuelto: overflow residente por rutinas de enemigo unrolled

Fecha: 2026-06-12

Problema:
El generador MSX2 SCREEN 4 podia fallar con `Resident SCREEN 4 code/data crossed #C000`
tras anadir comportamientos complejos de enemigo.

Causa:
`FlyerSine` emitia la logica completa duplicada por cada slot de enemigo. En
proyectos con varios comportamientos, el residente crecia mas rapido que el
espacio fijo disponible y el diagnostico podia senalar tablas frias pequenas,
aunque el peso real venia de codigo repetido.

Solucion:
Convertir `FlyerSine` a una rutina compartida llamada desde cada slot, y usar
un helper documentado para calcular `screen*slots+slot` preservando `BC`.
Aplicar el mismo helper a `Jumper` para evitar clobber accidental del registro
`B` que transporta el slot.

Leccion:
En SCREEN 4 MegaROM, los comportamientos complejos de enemigos no deben
duplicarse por slot. Usar stubs por slot + handler compartido. Si aparece un
overflow residente, medir primero codigo unrolled antes de mover tablas a bancos
frios o aumentar RAM; mover datos que el runtime lee por frame sin cachearlos
puede crear bugs de banco.

---

## Bug Resuelto: enemigo MSX2 con sprite multi-frame congelado en frame 0

Fecha: 2026-06-13

Problema:
Un enemigo colocado desde la libreria en `push10.json` se movia, pero no
animaba su sprite en ASM MSX2.

Causa:
El runtime de SCREEN 4 usaba un unico sprite hardware compartido para
enemigos/hazards, pero el generador solo emitia `msx2_hw_enemy_sprite_pattern`
del frame 0 y escribia siempre el mismo indice SAT. Los frames reales del
Sprite Editor MSX2 nunca llegaban a VRAM ni al SAT.

Solucion:
Emitir todos los frames del sprite enemigo compartido (y sus mirror frames si
aplica), anadir 2 bytes RAM de contador/frame global, y hacer que el SAT use
`msx2_enemy_anim_frame`. El puente de Enemy Library ahora puede snapshotear
`msx2_animation.frameList/frameDelay` desde roles declarativos.

Leccion:
Si un asset visual se anima en el editor pero no en ROM, verificar primero si
el generador esta empaquetando todos los frames y si el SAT cambia de grupo de
patron. En sprites hardware 16x16 MSX2, animar significa cambiar indices de
patron en saltos de 4; no basta con que el JSON tenga `animations`.

---

## Bug Resuelto (diagnostico): entidades colocadas no estan en screen.data.entities sino en screen.data.layers.entities

Fecha: 2026-06-14

Problema:
Diagnosticando por que el Bat de `push13.json` no soltaba la bomba, inspeccione
el JSON y conclui erroneamente que "el enemigo no estaba colocado en la pantalla"
(0 entidades). El usuario corrigio: el Bat SI estaba colocado y se veia en
OpenMSX volando.

Causa:
Al inspeccionar una pantalla MSX2 SCREEN 4 busque las entidades en
`screen.data.entities` y `screen.data.entityInstances`, claves que NO existen.
Las entidades colocadas (player/enemy/collectible/etc.) viven en
`screen.data.layers.entities`. `layers` agrupa varias capas:
`['collision', 'effects', 'behavior', 'entities']`. Mi script solo miro el nivel
`data.*` y dio 0 entidades, llevandome a un diagnostico falso.

Solucion:
Releer el JSON recursivamente buscando la entidad real (`kind:'enemy'`,
`flyerSine`) la localizo en `assets[N].data.layers.entities[i]`. Con la entidad
ya encontrada, el diagnostico correcto fue otro (snapshot stale: la entidad
colocada carecia de `msx2_ai.dropBombOnPlayerX` porque se coloco ANTES de marcar
el check en el Enemy Config).

Leccion:
Para inspeccionar entidades colocadas en una pantalla MSX2 SCREEN 4, mirar
SIEMPRE en `screen.data.layers.entities` (no en `data.entities`). `data.layers`
contiene las capas collision/effects/behavior/entities. Antes de afirmar "no hay
X en el JSON", hacer una busqueda RECURSIVA por una propiedad caracteristica del
objeto buscado (p. ej. `flyerSine`, `kind:'enemy'`) en vez de asumir la ruta de
la clave. Un grep negativo sobre una ruta concreta no prueba ausencia: prueba que
no esta en ESA ruta.

---

## Tecnica/Trampa: smoke OpenMSX de ROMs Konami DEBE usar -romtype konami

Fecha: 2026-06-14

Problema:
Depurando por que el player no podia empujar cajas al activar la bala del bat,
arranque OpenMSX con `-cart rom` SIN `-romtype konami`. El cache de colision en
RAM (#C2F0) aparecia lleno de CODIGO/basura en vez del mapa (`00 00 00 01...`),
el player caia 16px de mas y las cajas reposaban una fila distinta. Conclui
(erroneamente) que la copia de bancos megarom estaba rota y corrompia la
colision. Casi persigo un bug inexistente.

Causa:
El generador emite ROMs MegaROM Konami4 cuyo cambio de banco es `ld (#8000), a`.
Sin `-romtype konami`, OpenMSX auto-detecta MAL el mapper, asi que `ld (#8000),a`
no pagina el banco de datos esperado y el `ldir` de screen-load copia bytes del
banco equivocado (codigo) al cache de colision. El ROM en disco era correcto
(offset 0x8E10 = `00 00 00 01...`); solo el runtime con mapper mal detectado
producia basura. Al anadir `-romtype konami`, el cache salia correcto en ambos
ROMs y el bug real (independiente) se reproducia limpiamente.

Leccion:
Todo smoke/debug OpenMSX de un ROM generado (MegaROM Konami) DEBE pasar
`-romtype konami` (`openmsx -machine C-BIOS_MSX2+ -cart rom -romtype konami ...`).
Sin el, el bank switching `ld (#8000),a` no funciona y veras corrupciones
FALSAS (caches con codigo, saltos de fila en colision, fisica desplazada) que NO
son bugs del juego sino del mapper mal detectado. Sintoma delator: un cache de
RAM que deberia tener datos limpios (`00 00 00 01`) contiene secuencias que
parecen opcodes (`21 xx C6 11 08 00 19 7E` = ld hl/ld de/add hl,de/ld a,(hl)).
Antes de culpar a la copia de bancos, verificar: (1) el ROM en disco en el offset
fisico del label tiene el dato correcto, y (2) el smoke usa el romtype correcto.

---

## Bug Resuelto: framebuffer SCREEN 5 cortado por leer datos ROM desde #8000

Fecha: 2026-06-17

Problema:
El backend `msx2-screen4-bitmap-room` arrancaba en SCREEN 5 y escribia la parte
superior del framebuffer, pero desde la linea ~128 la pantalla quedaba blanca.
Parecia una pared de escritura VRAM en #4000.

Causa:
La escritura extendida a VRAM #4000 funcionaba. El fallo real era la fuente:
el framebuffer crudo de 24576 bytes colocaba la segunda mitad del dato en
direccion Z80 #8000+, y el ROM simple del smoke no garantizaba tener esa mitad
del cartucho mapeada como lectura de ROM. La rutina leia #FF y escribia blanco
en la zona inferior, aunque el archivo ROM en disco contuviera los bytes reales.

Solucion:
Emitir el framebuffer como RLE residente y descomprimirlo a VRAM por chunks de
16KB, rearmando R#14 por chunk. El dato comprimido del smoke queda en la ventana
ROM accesible y ya no depende de leer la segunda pagina en #8000.

Leccion:
Si una escritura a VRAM alta parece fallar, aislar primero destino y fuente:
probar un micro-ROM que escriba un patron constante en VRAM #4000 y otro que lea
la fuente desde #8000. Un watchpoint de lectura en #8000 no prueba que el dato sea
correcto; puede estar leyendo #FF por mapeo. Para recursos grandes en ROM simple,
usar compresion/staging accesible o un mapper real inicializado, no asumir que
todo el archivo lineal esta visible en el espacio Z80.

---

## Bug Resuelto: paneles laterales no scrollean por cadena flex sin min-h-0

Fecha: 2026-06-18

Problema:
En el editor SCREEN 5 (Msx2BitmapScreenEditor) los paneles laterales (asides) tenian
`overflow-y-auto` pero al crecer su contenido (mas miniventanas) las de abajo quedaban
ocultas y no aparecia scroll: crecia todo el editor.

Causa:
El componente `Panel` (components/common/Panel.tsx) envuelve a los hijos en un body por
defecto `p-2 flex-grow overflow-auto` (bloque, NO flex-col). Ademas el div EXTERNO del
Panel tenia `flex-grow` pero `min-height:auto` (default de flex), por lo que un flex item
crece con su contenido en vez de acotarse a la altura disponible. Sin un eslabon acotado,
los asides nunca recibian una altura tope y su `overflow-y-auto` no se activaba.

Solucion:
Acotar la cadena de alturas de arriba abajo con `min-h-0` y un body flex-col:
- Pasar al `Panel` `className="... flex-grow flex flex-col min-h-0"` Y
  `bodyClassName="flex-grow flex flex-col min-h-0 overflow-hidden"`.
- La fila de columnas: `flex flex-grow min-h-0 overflow-hidden`; cada aside con
  `overflow-y-auto`. El root del area de editores debe colgar de un contenedor acotado
  (h-screen / min-h-0 en cada nivel intermedio).

Leccion:
Para que un `overflow-y-auto` scrollee, TODA la cadena de ancestros flex hasta el viewport
debe estar acotada: cada flex item que a su vez es contenedor flex necesita `min-h-0`
(porque `min-height:auto` impide encogerse). El `Panel` por defecto NO crea una columna
flex acotada: hay que pasarle `bodyClassName` flex-col + `min-h-0`. Sintoma: contenido que
crece y "empuja" en vez de scrollear.

Variante (mismo dia): mapear clic de canvas a celda SIEMPRE por el tamano renderizado real
(`rect.width/height`), NUNCA dividiendo por `zoom`. Un `<canvas>` sin tamano CSS explicito
dentro de un flex con `align-items: stretch` se deforma; dar al canvas width/height CSS
explicitos (= bitmap*zoom) + `flex:'0 0 auto'` + `alignSelf:'flex-start'`.

---

## Bug Resuelto: player SCREEN 5 bitmap sin paridad de runtime

Fecha: 2026-06-19

Problema:
El player colocado en el editor beta SCREEN 5 bitmap se veia, pero no animaba y
el backend no respetaba el contrato esperado de player tipo SCREEN 4.

Causa:
El backend `msx2-screen4-bitmap-room` era fase 1: empaquetaba solo el frame 0 del
sprite, mantenia `player_pat` fijo, no generaba patrones mirror, y usaba movimiento
libre arriba/abajo en vez de fisica de plataforma contra la tabla foreground 16x12.

Solucion:
Resolver el `msx2player` enlazado desde `playerEntries`, empaquetar frames y mirror
del `msx2sprite`, actualizar `player_pat` por frame/facing, y usar movimiento de
plataforma basico con gravedad, salto y probes contra la tabla de colision de 192 bytes.

Leccion:
Un backend grafico nuevo no hereda automaticamente el contrato del player de SCREEN 4.
Cada backend jugable debe portar explicitamente: fuente real del sprite, frames, mirror,
RAM de estado, fisica, input y colision foreground. Un smoke debe probar RAM/SAT/patron,
no solo que el sprite aparece en una captura.

---

## Bug Resuelto: DE clobbeado a traves de un call (load_room colision basura)

Fecha: 2026-06-20

Problema:
World engine SCREEN 5: al entrar en una room el player quedaba amurallado, sin gravedad,
solo animaba ("paredes alrededor").

Causa:
`load_room` guardaba el indice de room en DE entre los lookups de tablas, pero
`replay_room_commands` clobbea DE (via `vdp_reinit_cmd_pointer` que hace `ld e,#20`). El
lookup del puntero de colision uso DE basura -> dereferencio puntero basura -> LDIR de
colision basura a RAM -> toda celda parecia solida.

Solucion:
Re-derivar el indice desde `current_screen_index` (RAM) despues del call, sin confiar en DE.
Corregido tambien el comentario PRESERVES de `replay_room_commands` (clobbea DE).

Leccion:
Confirma la primera hipotesis del charter: un caller nunca debe asumir que un registro
sobrevive a un `call` sin leer su DESTROYS. Si el comentario PRESERVES miente, corregir
codigo Y comentario. Ver tabla de clobbers de helpers VDP en `ai/ASM_GUIDELINES.md`.

---

## Bug Resuelto: estado global del VDP (R#15) no restaurado tras un call -> lag

Fecha: 2026-06-20

Problema:
World engine SCREEN 5: tras una transicion de pantalla el juego iba lentisimo, como si
"pintara la pantalla constantemente". El start room iba bien.

Causa:
`load_room` usa el command engine; `read_vdp_status_2` deja R#15=2 (status select = S#2).
`init` reseteaba R#15=0 tras el primer load_room, pero `try_room_transition` no. Tras la
transicion, `bitmap_wait_vblank` (asume R#15=0, lee S#0 bit7) leia S#2, no veia el flag de
vblank y agotaba el contador de fallback (#4000) cada frame -> lag.

Solucion:
`load_room` restaura R#15=0 antes de retornar (cubre init y transiciones). Verificado en
OpenMSX: travesia pant1<->pant2<->pant3 a velocidad normal.

Leccion:
La regla de "registros no preservados" incluye el ESTADO GLOBAL del VDP, no solo registros
de CPU. Si una rutina cambia R#15 (status select), R#17 (indirect pointer) o bancos de
mapper, debe restaurarlo o documentarlo en su cabecera. Ver `ai/ASM_GUIDELINES.md`.

---

## Diagnostico: la fisica del Player vive anidada en data.player.movement

Fecha: 2026-06-20

Problema:
Al cablear el salto del SCREEN 5 bitmap al Player Config, un grep de `data.movement` del
asset `msx2player` daba `None` y un test inyectando `data.movement.jumpPower=8` no surtia
efecto: el generador siempre veia `jumpPower=5`. Parecia que el build "reseteaba" el player.

Causa:
El asset `msx2player` guarda la config en `data.player.movement` (detallado) y
`data.compact.movement`, NO en `data.movement`. `parseMsx2PlayerImport` aplana `doc.player`
(o `doc.compact`), asi que la inyeccion al nivel raiz se ignoraba y se leia el valor real
(default 5) de la ruta anidada.

Leccion:
La fuente real de fisica del Player es `data.player.movement` / `data.compact.movement`
(no `data.movement`). Variante de la leccion 2026-06-14 (entidades en `layers.entities`):
antes de concluir "no hay config", buscar en la ruta anidada correcta; un grep negativo a
nivel raiz no prueba ausencia. `getMsx2PlatformPhysicsFromPlayerEntity` devuelve 8.8
(`jumpImpulse88`/`terminalVelocity88`); el backend bitmap usa px enteros (redondear /256).

---

## Tecnica: capture_openmsx_action.py necesita boot-wait-ms >= 6000 para timing fino

Fecha: 2026-06-25

Problema:
Verificando coyote_time/jump_buffer en SCREEN 5 bitmap, los tests con
`capture_openmsx_action.py --boot-wait-ms 4000` y secuencias cortas (WAIT/SPACE de
80-250ms + capture 0-60ms) daban probes del estado POKEADO intacto (ningun frame
procesaba tras el poke). P. ej. poke coyote=4, WAIT:200, capture 0 -> probe leia
coyote=04 (sin decrementar) y player_y=50 (sin moverse). Con WAIT:500 si procesaba.

Causa:
`after time X` es tiempo de EMULACION. OpenMSX tarda en arrancar (cargar ROM,
init VDP, etc.), asi que con boot-wait-ms 4000 los primeros `after time` cortos
(<500ms) se leen antes de que la emulacion haya procesado bastantes frames tras
el poke. El umbral empirico esta entre 4000 y 6000.

Solucion:
Para smokes de mecanicas con timing fino (frames concretos tras un poke), usar
`--boot-wait-ms 6000` (o mas). Con boot 6000, WAIT:200+capture 0 ya procesa
~12 frames (player se mueve, timers decrementan). Para mecanicas de ventana
corta (coyote/jump_buffer de 4-8 frames), ampliar la ventana del parametro a
60 frames en el JSON de test y usar boot 6000 + secuencia ~250ms.

Leccion:
El capturador OpenMSX necesita margen de arranque. Sintoma delator: probe lee
exactamente el valor pokeado (sin un solo frame de processing) -> boot-wait-ms
muy bajo para la duracion del test. No es un bug del juego ni del generador; es
del harness de smoke. Verificado con coyote_time + jump_buffer SCREEN 5 bitmap.

---
