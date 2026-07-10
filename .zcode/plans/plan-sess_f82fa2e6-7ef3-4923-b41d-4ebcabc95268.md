# Game Over via Game Flow en Screen 5 bitmap (fase 1)

## Resumen del diseño

Hago que el backend Screen 5 bitmap **participe del Game Flow** para que, cuando `Lives = 0`, el gameplay loop señalice salida y el grafo siga su conexión definida (normalmente a un nodo `End` de tipo GameOver). El nodo End dibuja "GAME OVER" en bitmap y espera una tecla.

### Hallazgos arquitectónicos que determinan el diseño

1. **Hay 3 implementaciones de Game Flow independientes** (Screen 2 runtime-dispatcher, Screen 4 compile-time-inlined, Screen 5 bitmap = none). Ninguna comparte código.
2. **Screen 4 es el patrón a replicar**: `buildMsx2GameFlowProgram` resuelve el grafo a saltos estáticos en tiempo de compilación (`jumpToNodeOrMain`, `defaultTargetNodeId`). Su WorldLink carga pantalla + `jp .main_loop` (sin puerta de salida).
3. **El bitmap ya consume el grafo `purpose:'screen4-bitmap-runtime'`** (`resolveBitmapIntroScenes`), pero solo el prefijo de intro (presentation+transition) y se detiene en el primer WorldLink.
4. **El bitmap `main_loop` es un `jp .main_loop` incondicional sin puerta de salida**. No hay estado terminal ni `gameflow_exit_requested`.
5. **El bitmap tiene font A-Z** (`DEFAULT_HUD_PATTERNS`, línea 1034) y el patrón HMMM-blit probado (diálogo/counter) para dibujar texto.
6. **1 byte RAM libre en #C1F8** para un flag de game-over.

### Estrategia: dispatcher compile-time (como Screen 4), no runtime

Replico el patrón compile-time de Screen 4 (NO el runtime dispatcher de Screen 2). En tiempo de compilación, el generador recorre el grafo `purpose:'screen4-bitmap-runtime'` desde el nodo tras el WorldLink y emite una cadena de etiquetas con saltos estáticos. Así no necesito RAM/ROM para tablas de nodos en runtime.

---

## 1. Variable de runtime: `bitmap_game_over_flag EQU #C1F8`

Único byte RAM libre garantizado (gap entre `player_vx` #C1F7 y `blink_phase` #C1F9). 0 = jugando; nonzero = game over solicitado (el gameplay loop debe salir).

- Inicializado a 0 en `init_rom` (junto al spawn del player) y al entrar al gameplay loop.
- Lo escribe el deadly system cuando `player_lives` llega a 0 (y también el enemy touch, para consistencia).
- Lo lee el `main_loop` como puerta de salida del WorldLink.

---

## 2. Deadly system: añadir check de `player_lives == 0`

En `buildBitmapDeadlySystemAsm` (`msx2Screen5BitmapRoomGenerator.ts:3937`), la rama `.deadly_dead` (líneas 4002-4005 y 4018-4021) hace `dec (player_lives)` sin comprobar 0. La extiendo:

```asm
.deadly_dead:
    ld hl, player_lives
    dec (hl)
    ld a, (hl)
    or a
    jp z, .deadly_game_over        ; lives 0 -> game over (sale del WorldLink)
    jp .deadly_respawn             ; todavía hay vidas -> respawn con health full
.deadly_game_over:
    ld a, 1
    ld (bitmap_game_over_flag), a
    jp .deadly_respawn             ; respawn visual mientras el loop detecta el flag
```

Esto resuelve el bug actual (lives decrementa infinitamente sin check) Y conecta con el game flow.

## 3. Enemy touch: mismo cableado a game-over

`bitmap_check_enemy_touch` (`msx2BitmapEnemyGenerator.ts:521-535`) solo baja health y arma i-frames; a health==0 no hace nada. Lo hago consistente con el deadly system: cuando el daño lleva health a 0, decrementar `player_lives` y, si llega a 0, activar `bitmap_game_over_flag`; si no, respawn (reset health + reposición). Reutilizo la misma lógica que el deadly (extraída a un helper compartido o replicada inline con los mismos offsets de spawn).

---

## 4. Puerta de salida del `main_loop`

El `main_loop` (línea 11679) hoy es `jp .main_loop` incondicional. Añado una puerta de salida al inicio:

```asm
.main_loop:
    ld a, (bitmap_game_over_flag)
    or a
    ret nz                         ; WorldLink exit -> vuelve al dispatcher del game flow
    call bitmap_wait_vblank
    ... (resto del loop)
    jp .main_loop
```

El `ret` sale del WorldLink y devuelve el control al dispatcher compile-time del game flow, que salta al nodo conectado (End:GameOver). Esto hace que "el comportamiento lo defina el gameflow".

> El `ret` requiere que el dispatcher invoque el gameplay loop con `call` (no `jp`), de modo que la pila tenga la dirección de retorno. Esto encaja con el patrón compile-time: el WorldLink emite `call bitmap_enter_game_loop` donde esa rutina es el antiguo `main_loop` body.

---

## 5. Dispatcher compile-time del Game Flow en bitmap (clon de Screen 4)

Nueva función `buildBitmapGameFlowProgram(analysis, ...)` en `msx2Screen5BitmapRoomGenerator.ts`, basada en `buildMsx2GameFlowProgram` de Screen 4 (línea 11838) pero adaptada al bitmap:

- Lee el grafo `purpose:'screen4-bitmap-runtime'` (reuso `resolveBitmapIntroScenes` para el prefijo intro, ya funciona).
- Recorre nodos desde Start emitiendo etiquetas `bitmap_gf_node_<i>` con saltos estáticos (`jumpToNodeOrMain`, `defaultTargetNodeId` — reuso las helpers genéricas de Screen 4, ya son backend-agnostic).
- **Tipos de nodo soportados en esta fase:**
  - `Start`, `Waypoint`, `Globals` → passthrough al siguiente nodo.
  - `Screen5Presentation` + `Transition` → el intro actual (ya implementado en `run_bitmap_intro`).
  - `WorldLink` → carga la room inicial (`call load_room` + spawn + `call bitmap_enter_game_loop`). El nodo al que lleva su conexión por defecto es el destino tras el exit (típicamente End).
  - `End` → dibuja GAME OVER/VICTORY (ver sección 6) + espera tecla + `jp .main_loop` (loop final, o `jp init_rom` si es Victory/Restart según conexión).
  - `Restart` → `jp init_rom`.
  - Otros tipos (SubMenu, Text, Controls, etc.) → en esta fase, warn y passthrough al default (no soportados todavía).
- El WorldLink **envuelve** el gameplay en `call bitmap_enter_game_loop` (la rutina que contiene el antiguo `main_loop` body + la puerta de salida). Al retornar (flag game-over activo), salta al nodo conectado.

### Reestructuración de `init_rom` y `main_loop`
- Extraigo el body del `main_loop` actual a una rutina `bitmap_enter_game_loop:` que termina con `jp bitmap_enter_game_loop` (loop interno) y sale vía `ret` cuando `bitmap_game_over_flag != 0`.
- `init_rom` ejecuta el intro, luego salta al dispatcher del game flow (que comienza en el nodo Start). El dispatcher invoca `bitmap_enter_game_loop` al llegar al WorldLink.
- Cuando NO hay grafo game flow (proyecto bitmap standalone sin nodos), el comportamiento es idéntico al actual: `init_rom` carga la room inicial y entra directamente a `bitmap_enter_game_loop` (sin dispatcher). Byte-compatible.

---

## 6. Nodo End: dibujar "GAME OVER" en bitmap

Nueva rutina `draw_bitmap_end_screen` que dibuja el texto del nodo End (p.ej. "GAME OVER" o "VICTORY") en la capa bitmap:

- **Font**: reuso `DEFAULT_HUD_PATTERNS` (A-Z, línea 1034) + `normalizeScreen5HudFontGlyph` (línea 1145).
- **Build-time**: bakeo los glyphs del mensaje en un strip offscreen (como hace el dialogue blob / counter strip). Reservo un slot VRAM offscreen (región libre entre atlas y dialogue blob).
- **Runtime**: para cada letra, un HMMM blit de 8×8 al centro de la página visible (centrado: X=(256-ancho)/2). Reuso el patrón de `bitmap_dlg_emit_char` (línea 8159) / `buildGemAtlasCopyCommand`.
- Tras dibujar, espera a que el jugador pulse una tecla (polling PPI row 8, como `bitmap_intro_wait_space` línea 491).
- El tipo de End (Victory/GameOver) viene del nodo (`endType`), y el mensaje del campo `message` del nodo.

---

## 7. Integración y wiring

- `resolveBitmapIntroScenes` se extiende para devolver también el grafo completo (no solo el prefijo intro), o añado un `resolveBitmapGameFlow` paralelo que recorra más allá del WorldLink.
- `generateUnitedFiles` (línea 10769): si hay grafo game flow, emite el dispatcher compile-time antes de `.main_loop`/`bitmap_enter_game_loop`; si no, comportamiento actual.
- El EQU `bitmap_game_over_flag EQU #C1F8` se añade al bloque de equates.
- Reset de `bitmap_game_over_flag` en `init_rom`, spawn, y transiciones de room (igual que `player_vx`).

---

## 8. Verificación

- **Sin grafo game flow**: el bitmap standalone compila y funciona idéntico al actual (byte-compatible en el main loop; el flag se emite pero siempre es 0 y nunca se comprueba si no hay deadly/enemy que lo active — aunque deadly siempre está, así que se comprueba; en proyectos sin grafo, lives=0 activa el flag, el loop sale con `ret`, y al no haber dispatcher... eso sería un bug). **Aclaración**: cuando no hay grafo, el WorldLink implícito no envuelve en `call`, así que necesito que el flag game-over, en modo standalone, haga un reinicio (respawn completo) en vez de `ret`. Decido esto en función de si hay grafo: con grafo → `ret` al dispatcher; sin grafo → reinicio soft (`jp init_rom`) tras un GAME OVER simple. Lo determino en tiempo de compilación según exista el grafo.
- **Con grafo game flow (nuevo smoke test)**: un proyecto con Start → WorldLink → End:GameOver. Verifico que al perder todas las vidas, el juego sale del loop, dibuja "GAME OVER" y espera tecla.
- TypeScript: compila (el generador es TS).
- Smoke test: nuevo `test/msx2-bitmap-gameflow/` con un proyecto que tenga grafo + deadly tiles/enemigos para agotar vidas.

---

## Archivos a editar

| Archivo | Cambio |
|---|---|
| `utils/msxGenerator/generators/msx2/msx2Screen5BitmapRoomGenerator.ts` | `bitmap_game_over_flag` EQU; check lives==0 en deadly system; reestructurar `main_loop`→`bitmap_enter_game_loop` con puerta salida; dispatcher compile-time `buildBitmapGameFlowProgram`; rutina `draw_bitmap_end_screen` (texto bitmap GAME OVER); wiring en `generateUnitedFiles` |
| `utils/msxGenerator/generators/msx2/msx2BitmapEnemyGenerator.ts` | Enemy touch: decrementar lives + game-over flag a health==0 (consistencia con deadly) |
| `test/msx2-bitmap-gameflow/` (nuevo) | smoke test con grafo Start→WorldLink→End:GameOver |

## Fuera de alcance (fases futuras)
- Nodos SubMenu/Controls/Text/TextScroll/IfThenElse/Music en bitmap (en esta fase: passthrough/warn).
- Pantallas de menú/título interactivas en bitmap.
- Soporte de múltiples WorldLink/niveles en bitmap.

El comportamiento del Game Over queda **definido por el gameflow** (la conexión del WorldLink decide a qué nodo ir), cumpliendo tu requisito.