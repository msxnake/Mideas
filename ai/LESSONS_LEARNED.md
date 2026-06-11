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
para decidir si `dash` o `air_dash` pueden arrancar. Ademas, cuando
`air_dash` empieza con el mismo boton que `dash`, activar tambien
`msx2_dash_lock` para que una pulsacion mantenida no encadene ambas skills.

Leccion:
Para gates de skills sensibles al orden del frame, no confiar en flags
cacheados si se actualizan mas tarde en el loop. Usar estado recien calculado
o un probe directo. Si dos skills comparten boton por contexto, revisar locks
cruzados: una pulsacion no debe disparar dos mecanicas consecutivas.
