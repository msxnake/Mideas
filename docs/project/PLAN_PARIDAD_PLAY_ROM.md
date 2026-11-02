# Plan: paridad modo Play ↔ ROM MSX1

**Origen:** revisión Gauntlet del exportador Sketch IA (rondas 1-3, noviembre 2026).
Al documentar el comportamiento real para la IA aparecieron diferencias entre
el modo Play del navegador y el ROM generado, contra la regla de `CLAUDE.md`:
*el modo Play debe ser idéntico al ROM en gráficos, jugabilidad y estados*.

**Referencias:**
- Play real: `components/modals/GameFlowPreviewModal.tsx` (GFP). `ScreenPlayModal.tsx`
  y `src/engines/` eran código muerto y se eliminaron.
- ROM: `utils/msxGenerator/generators/` (`stateMachineGenerator.ts` = SM,
  `componentsGenerator.ts` = CG, `interruptGenerator.ts` = IG, `entitiesGenerator.ts` = EG).
- Inventario vivo de diferencias para la IA: `utils/gameSketch/knowledge.ts`
  (`ENGINE_RULES.playVsRom`, marcas "ROM only" / "NOT implemented").

---

## 1. Inventario de diferencias (verificado)

### A. Máquinas de estados: existen en el ROM, no en Play

| Elemento | Play (GFP) | ROM |
|---|---|---|
| Condición `XOR` | sin `case` → siempre falso (GFP:2394) | SM `CONDITION_IDS` 15 |
| Condición `CAN_MOVE_DIRECTION` | sin `case` → falso | SM:7196, helpers SM:6191-6210 |
| Condición `PATH_CLEAR` | sin `case` → falso | SM:7229, SM:6218 |
| Condición `KEY_AND_MOVEMENT` | sin `case` → falso | SM `CONDITION_IDS` 13 |
| Acción `MOVE_BY` | sin `case` → no-op (GFP:3687) | SM:6866 |
| Acción `RND` | no-op | SM:7084 |
| Acciones `DISABLE_INPUT` / `ENABLE_INPUT` | no-op | SM:6146 |
| Acción `CHANGE_WORLD_SCREEN` | no-op | alias de `EXIT_CURRENT_WORLD` (SM:95-96) |

`pacman_reply(35).json` usa `CAN_MOVE_DIRECTION`: en Play esa regla nunca dispara.

### B. Misma acción, distinta semántica

| Elemento | Play | ROM |
|---|---|---|
| `TOGGLE_ANIMATION` | lee `mode` (start/stop/toggle) GFP:3076 | lee `playing` 0/1 SM:6901-6903 |
| `DIVIDE_VARIABLES` | división decimal (GFP:2812) | entero 8 bits |
| Botón 2 (`action2`) | tecla **M** por defecto (`stateMachineInputs.ts:185`) | **N** o CTRL según nodo Controls (IG:840-870, `INPUT_BTN_GRAB`) |
| Agarre a pared | tecla N literal (GFP:8342) | `INPUT_BTN_GRAB` (N/CTRL) |

### C. Colisión y física

| Elemento | Play | ROM |
|---|---|---|
| Clase de colisión "item" / "enemy" | por **componentes**: Collectible → item, AIBehavior/Damage → enemy (GFP:8944-8963) | por **capa**: `COLLISION_LAYER_ITEM` / `COLLISION_LAYER_ENEMY` (CG:6000-6018) |
| Sondas de suelo/pared | 2 puntos a 1/3 y 2/3 del lado (GFP:6929-6962, 7605) | sondas adaptativas con *inset* (CG:12020-12034, 12178-12327) |
| Precedencia de hitbox para tiles | valores del componente Collision ganan a `sprite.hitbox` (GFP:6906-6919) | por verificar |

### D. Componentes (confirmado por `scripts/check_play_rom_parity.mjs`)

Fuente ROM: `STANDARD_COMPONENT_IDS` de `utils/msxGenerator/utils/componentAnalyzer.ts`
más los ids que comprueba `entitiesGenerator.ts`. Fuente Play: ids `comp_*` en GFP.

| Grupo | Componentes |
|---|---|
| Declarados en el editor, sin implementar en ninguno (→ **ocultar**) | Spawner, Inventory, Aiming, Rotate, Pac-Man Movement v1/v2, Pac-Man Rotation V2, Bounce, boss_crush_movement, boss_neck_chain |
| Solo ROM (→ portar a Play) | Behavior, Dash, Mirror, Physics (el ROM lo trata como Movement), Position, WallCollision, WallJump |
| Solo Play | Child Link |

---|---|
| Declarados, sin implementar en ninguno de los dos | Spawner, Inventory, Aiming, Rotate, Pac-Man Movement (v1/v2), Pac-Man Rotation V2, Physics, Position (`comp_pos`), Bounce, boss_crush_movement, boss_neck_chain |
| Solo ROM (Play no los simula) | WallCollision, Dash, WallJump, Mirror |
| Solo Play (por confirmar en ROM) | Deadly Tiles, Gravity (confirmar: probablemente sí en ROM por nombre), Child Link |

---

## 2. Decisiones (tomadas)

| # | Decisión |
|---|---|
| 1 | **El ROM es la fuente de verdad**: cuando difieran, Play se ajusta al ROM. |
| 2 | Los componentes que no implementa ninguno de los dos se **ocultan** del editor. |
| 3 | Botón 2 = **N o CTRL** según el nodo Controls (como el ROM). |
| 4 | Verificación diferencial con OpenMSX: pendiente de decidir antes de la Fase 3. |

### Planteamiento original de las decisiones

1. **Fuente de verdad.** Recomendado: **el ROM**. Es el producto final, y Play
   ya copia la física Z80 en punto fijo 8.8. Regla: cuando difieran, Play se
   ajusta al ROM salvo bug evidente del ROM.
2. **Componentes que nadie implementa** (Spawner, Inventory, Aiming, Rotate,
   Pac-Man, Physics, Position…): implementar en ambos, ocultarlos del editor o
   marcarlos como "experimental".
3. **Tecla del botón 2:** N/CTRL según el nodo Controls (como el ROM) o M.
4. **Verificación:** solo tests de contrato, o además pruebas diferenciales con
   OpenMSX (mismo proyecto en Play y ROM, comparando posiciones y estados por frame).

---

## 3. Fases (con la recomendación de la sección 2)

### Fase 0: red de seguridad (antes de tocar comportamiento) — HECHA
- Script `scripts/check_play_rom_parity.mjs`: extrae los `case` de condiciones y
  acciones de GFP y los compara con `CONDITION_IDS` / `ACTION_IDS` del ROM y con
  los tipos de `statemachine.types.ts`. Falla si aparece una diferencia nueva
  no listada en una *allowlist* (que se irá vaciando fase a fase).
- Confirmar la matriz D leyendo cómo el ROM detecta cada componente (id o nombre).
- Añadir `npm run test:play-rom-parity`.
- **Hecho cuando:** el script reproduce exactamente las tablas A y D. ✔
  (`npm run test:play-rom-parity`; la lista `KNOWN` debe ir vaciándose.)

### Fase 1: máquinas de estados (bajo riesgo, alto impacto) — HECHA

**Hecho (Play copia al ROM):** `XOR` (paridad impar), `MOVE_BY`, `RND` (0..255),
`DISABLE_INPUT`/`ENABLE_INPUT` (teclas, cursores, salto y dash por entidad; ENABLE
restaura *animateOnlyWhenMoving*), `CHANGE_WORLD_SCREEN` (= `EXIT_CURRENT_WORLD`),
`TOGGLE_ANIMATION` (`playing` 0 = pausa, otro = play; "toggle" = play) y
`DIVIDE_VARIABLES` entera. La lista `KNOWN` de acciones quedó vacía.

**Bug del ROM corregido:** `check_collision_box` ya no es un stub: recorre todas las
celdas 8x8 de la hitbox Collision (16x16 si no hay) y bloquea con familia ≠ 0 y ≠ #20,
como WallCollision. Play usa la misma lógica (`utils/romMoveTest.ts`) con su
`checkCollisionAt`. Verificado con `npm run test:rom-move-test`: la rutina Z80 real,
ensamblada con glass.jar y ejecutada en el Z80 de Cowbell, coincide con Play en 4800
casos aleatorios (y una mutación de la regla se detecta). ROM de prueba +135 bytes.
Pendiente: probar en OpenMSX un proyecto que use estas condiciones.

**(Histórico) Bloqueado — bug del ROM:** `CAN_MOVE_DIRECTION`, `PATH_CLEAR` y
`KEY_AND_MOVEMENT` dependen de `SM_TestMoveDirection` → `check_collision_box`,
que en el ROM es un stub *deprecated* que siempre devuelve "libre"
(`componentsGenerator.ts`, `check_collision_box`). Hoy: Play = siempre falso,
ROM = siempre verdadero. Copiar el stub no tiene sentido: hay que implementar la
prueba real de tiles **en el ROM** (mapa de comportamiento, como WallCollision)
y la misma en Play. Requiere tocar Z80 y verificar en OpenMSX (decisión 4).

Plan original de la fase:
- Implementar en GFP, copiando la semántica del ASM del ROM:
  `XOR`, `CAN_MOVE_DIRECTION`, `PATH_CLEAR`, `KEY_AND_MOVEMENT`, `MOVE_BY`,
  `RND`, `DISABLE_INPUT`, `ENABLE_INPUT`, `CHANGE_WORLD_SCREEN` (→ exit world).
- Unificar `TOGGLE_ANIMATION`: el editor escribe `mode` y `playing` coherentes;
  Play y ROM leen lo mismo.
- `DIVIDE_VARIABLES`: truncar a entero en Play.
- **Hecho cuando:** la allowlist de la Fase 0 queda vacía para condiciones y
  acciones; `pacman_reply(35)` reacciona a `CAN_MOVE_DIRECTION` en Play.

### Fase 2: entrada — HECHA

`getStateMachineBrowserInputAliases` acepta la tecla del botón 2 MSX1; el modo Play pasa
el ajuste del nodo Controls (N por defecto o CTRL). `action2` y el agarre a pared usan
esa tecla, como `INPUT_BTN_GRAB` en el ROM. Un asset `msx2player` sigue mandando con su
propio mapping.

Plan original de la fase:
- Botón 2 en Play = tecla del nodo Controls (N o CTRL), como el ROM; mantener M
  solo si hay un `msx2player` con otro mapping.
- Agarre a pared con el mismo botón lógico en ambos.
- **Hecho cuando:** misma tecla en Play, ROM, editor y nodo Controls.

### Fase 3: colisión y física (riesgo medio, requiere OpenMSX)
- Clasificación item/enemy: decidir componentes o capas y aplicarlo en ambos
  (recomendado: capas, como el ROM, con migración que asigne capa a las
  plantillas con Collectible/AIBehavior/Damage).
- Sondas de tiles: Play replica el *inset* adaptativo del ROM.
- Precedencia de hitbox: igual en ambos.
- **Verificación:** prueba diferencial en OpenMSX (agente `openmsx-automation`)
  con `mini_game75` y un caso de borde de plataforma: posición del jugador por
  frame en Play y en ROM.

### Fase 4: componentes
- Ocultar del editor los componentes que no implementa nadie (tabla D), sin
  romper proyectos que ya los usen (se conservan en el JSON, con aviso).
- Portar a Play los "solo ROM" (Behavior, Dash, Mirror, Physics/Movement,
  WallCollision, WallJump) y decidir Child Link (llevarlo al ROM o al revés).

### Fase 5: cierre
- Vaciar la allowlist; `ENGINE_RULES.playVsRom` del Sketch IA queda vacío o
  se elimina; quitar las marcas "ROM only" de `knowledge.ts` / `rulesToText.ts`.
- Actualizar `docs/project/AI_GAME_SKETCH.md` y este plan.

---

## 4. Riesgos
- **Proyectos existentes cambian de comportamiento en Play** (reglas que antes
  nunca disparaban empezarán a disparar). Mitigación: nota de versión y probar
  los `Examples/`.
- **GFP tiene ~10 000 líneas.** Cambios pequeños y aislados por fase, con tests.
- **Sin OpenMSX en el entorno cloud** las Fases 3-4 se verifican en local.

## 5. Estimación orientativa
| Fase | Tamaño |
|---|---|
| 0 | pequeño (1 sesión) |
| 1 | medio (1-2 sesiones) |
| 2 | pequeño |
| 3 | grande (requiere OpenMSX) |
| 4 | depende de la decisión 2 |
| 5 | pequeño |
