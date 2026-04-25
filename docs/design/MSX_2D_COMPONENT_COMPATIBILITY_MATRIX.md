# Matriz de compatibilidad de componentes 2D MSX

Fecha: 2026-04-25

## Objetivo

Esta matriz fija el estado real de los componentes 2D necesarios para crear
juegos MSX1 Screen 2 en Mideas. El criterio no es solo que el componente exista
en el editor, sino que tenga contrato util en estas capas:

- Definicion: existe en `data/defaults.ts`.
- Preview: aparece usado por motores/runtime de preview en `src`.
- ASM map: el analizador lo convierte a un componente estandar para generar ROM.
- ASM init/runtime: hay inicializacion o sistema especifico en el generador.
- Plantilla: hay al menos una entidad por defecto que lo usa.

## Resumen

- Componentes definidos: 36.
- Plantillas definidas: 15.
- Componentes mapeados por ASM: 26.
- Componentes con runtime ASM especifico detectado: nucleo principal, combate
  basico, movimiento de plataformas, cursores, tile interaction y collision.
- Mayor brecha: varias piezas existen como definicion/plantilla, pero no tienen
  runtime ASM directo o estan duplicadas conceptualmente.

## Matriz

| Componente | Grupo | Definicion | Preview | ASM map | ASM runtime | Plantillas | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `comp_pos` | Core | Si | Generico | Si | Generico | Si | Base usable |
| `comp_render` | Core | Si | Generico | Si | Generico | Si | Base usable |
| `comp_animation` | Core | Si | Parcial | Si | Si | Si | Usable, falta test ROM por genero |
| `comp_player_input` | Core | Si | Generico | Si | Si | Si | Usable |
| `comp_cursors` | Movimiento | Si | Parcial | Si | Si | Si | Usable para top-down/shooter |
| `comp_collision` | Core | Si | Si | Si | Si | Si | Usable |
| `comp_wall_collision` | Tiles | Si | Si | Si | Si | Si | Prioridad alta, validar paridad ROM |
| `comp_health` | Core | Si | Si | Si | Si | Si | Usable |
| `comp_damage` | Combate | Si | Si | Si | Si | Si | Parcial, cerrar Damage -> Health en ROM |
| `comp_lifetime` | Combate | Si | No directo | Si | Si | No | Parcial, falta plantilla/proyectil |
| `comp_gravity` | Plataformas | Si | Parcial | Si | Si | Si | Usable, validar con WallCollision |
| `comp_jump` | Plataformas | Si | Parcial | Si | Si | Si | Usable, faltan detalles avanzados |
| `comp_wall_jump` | Plataformas | Si | No directo | Si | Si | Si | Plantilla canonica creada, falta ROM visual |
| `comp_wall_grab` | Plataformas | Si | No directo | Si | Si | Si | Plantilla canonica creada, falta ROM visual |
| `comp_air_control` | Plataformas | Si | No directo | Si | Si | Si | Plantilla canonica creada, falta ROM visual |
| `comp_deadly_tiles` | Tiles | Si | Parcial | Si | Si | Si | Usable, validar ROM |
| `comp_tile_collector` | Tiles | Si | Parcial | Si | Si | Si | Prioridad alta para Pac-Man |
| `comp_collectible` | Objetos | Si | Si | Si | Si | Si | Usable |
| `comp_inventory` | Objetos | Si | Parcial | No | No | Si | Editor/preview, ASM pendiente |
| `comp_carry` | Objetos | Si | Parcial | Si | Si | Si | Parcial |
| `comp_box` | Objetos | Si | Parcial | No | No | Si | Editor/preview, ASM pendiente |
| `comp_child_link` | Objetos | Si | No directo | No | No | No | Diseno/editor |
| `comp_physics` | Movimiento | Si | Parcial | Si | Generico | Si | Mapeado como Movement |
| `comp_behavior` | AI | Si | Parcial | Si | Si | Si | Legacy/generico |
| `comp_ai_behavior` | AI | Si | Parcial | Si | Si | Si | Basico |
| `comp_patrol` | AI | Si | Parcial | Si | Si | No | Parcial, falta plantilla |
| `comp_aiming` | Combate | Si | Parcial | No | No | Si | ASM pendiente |
| `comp_shoot` | Combate | Si | Parcial | Si | Si | Si | Plantilla y contrato ASM validados, falta ROM visual |
| `comp_spawner` | AI | Si | Parcial | No | No | Si | ASM pendiente |
| `comp_bounce` | Movimiento | Si | No directo | No | No | No | Diseno/editor |
| `comp_statemachine` | Core | Si | Parcial | Si | Si | Si | Usable, revisar duplicidad con GameFlow |
| `comp_retractable_gate` | Tiles | Si | Parcial | Si | Si | No | Parcial, falta plantilla/test |
| `comp_rotate` | Render | Si | Parcial | No | No | Si | Preview/editor |
| `comp_pacMovement` | Pac-Man | Si | Si | No | No | Si | Duplicado, consolidar |
| `comp_PacmanMovementV2` | Pac-Man | Si | Si | No | No | Si | Duplicado, consolidar |
| `comp_PacmanRotationV2` | Pac-Man | Si | Si | No | No | Si | Duplicado, consolidar |

## Plantillas actuales

| Plantilla | Uso principal | Estado |
| --- | --- | --- |
| `tpl_player` | Plataforma/general | Buena base, demasiado cargada para ejemplo minimo |
| `tpl_enemy_basic` | Enemigo basico | Base util, falta preset Patrol claro |
| `tpl_item_key` | Coleccionable | Util |
| `tpl_enemy_spawner` | Spawner | Editor/preview, ASM pendiente |
| `tpl_player_ship` | Shooter | Base util, falta `comp_shoot` integrado |
| `tpl_player_bullet` | Proyectil | Base util, falta `comp_lifetime` y pool validado |
| `tpl_msx_platform_player` | Plataforma MSX canonica | Nueva base para Mario/Celeste/Metroid |
| `tpl_msx_topdown_player` | Top-down/Pac-Man canonico | Nueva base sin duplicados Pac-Man legacy |
| `tpl_msx_shooter_player` | Shooter MSX canonico | Nueva base con `comp_shoot` integrado |
| `tpl_msx_projectile` | Proyectil canonico | Nueva base con `Damage`, `Collision` y `Lifetime` |
| `tpl_msx_basic_patrol_enemy` | Enemigo patrulla canonico | Nueva base con `Patrol`, `Damage`, `Health` y `WallCollision` |
| `tpl_collector_player` | Top-down/Pac-Man simple | Buena base |
| `tpl_pacman_player` | Pac-Man legacy | Duplicado con V2 |
| `tpl_PacmanPlayerV2` | Pac-Man V2 | Duplicado con legacy |
| `tpl_box` | Caja fisica | Parcial |

## Brechas criticas

1. `comp_pacMovement`, `comp_PacmanMovementV2` y `comp_PacmanRotationV2` son
   funcionalidades solapadas. Deben converger en un contrato canonico tipo
   `GridMovement` + `Facing`.
2. `comp_shoot` tiene soporte ASM, pero no esta integrado en una plantilla
   canonica de jugador/proyectil ni validado como loop completo de ROM.
3. `comp_damage` y `comp_health` existen en preview y ASM, pero hay que cerrar
   pruebas de contacto/proyectil con capas de colision.
4. `comp_inventory`, `comp_aiming`, `comp_spawner`, `comp_box` y
   `comp_child_link` no deben venderse como componentes ROM completos hasta que
   tengan runtime ASM o se marquen explicitamente como editor/preview.
5. El generador MegaROM sigue en reparacion para proyectos grandes con recursos
   bancados; no debe bloquear la matriz de componentes, pero si los tests ROM
   de aceptacion.

## Proximo paquete de implementacion

El siguiente paquete debe cerrar el nucleo jugable minimo para cuatro generos:

1. Plataforma: `WallCollision`, `Gravity`, `Jump`, `AirControl`, `WallGrab`,
   `WallJump`, `DeadlyTiles`, `Health`, `Damage`.
2. Pac-Man/top-down: `Cursors` o `GridMovement`, `WallCollision`,
   `TileCollector`, `Inventory`, `StateMachine`.
3. Shooter: `Cursors`, `Shoot`, `Projectile`, `Damage`, `Health`, `Lifetime`.
4. Metroid: plataforma + `Shoot`, `Gate/Door`, `Inventory`, `Checkpoint`.

Orden recomendado de trabajo:

1. Generar proyectos minimos por genero usando las plantillas canonicas.
2. Validar una ROM minima por genero con `glass.jar` y OpenMSX.
3. Consolidar Pac-Man en un solo componente canonico.
4. Completar runtime ASM de componentes que siguen como editor/preview:
   `Inventory`, `Aiming`, `Spawner`, `Box` y `ChildLink`.

## Tests de contrato anadidos

- `test/test_msx_2d_templates.js`: valida que las plantillas canonicas existen y
  que todos sus `definitionId` apuntan a componentes definidos.
- `test/test_msx_2d_rom_contract.js`: valida que las plantillas canonicas usan
  componentes conocidos por `componentAnalyzer` y con runtime/simbolo esperado
  en el generador ASM.
- `test/test_msx_2d_minimal_generation.js`: genera proyectos minimos para las
  cinco plantillas canonicas y valida que el ASM unificado contiene los
  sistemas esperados sin llamadas invalidas a `SM_Update` cuando no hay assets
  de maquina de estados.
- `test/test_msx_2d_glass_compile.js`: recompila esas cinco salidas minimas con
  `glass.jar`, aplica padding `0xFF` a multiplo de 8KB y falla si aparece una
  excepcion de Glass o no se produce ROM.

Validacion actual: las cinco salidas minimas (`platform`, `topdown`, `shooter`,
`projectile`, `patrol_enemy`) ensamblan con `glass.jar` en modo `simple32k` y
quedan alineadas para MSX/OpenMSX.

## Criterio de terminado por componente

Un componente pasa a estable cuando cumple:

- Editable desde Mideas.
- Preview reproducible.
- ASM generado sin errores.
- ROM arranca en OpenMSX.
- Tiene plantilla minima.
- Tiene prueba o proyecto ejemplo.
- Documenta coste/limitacion MSX.
