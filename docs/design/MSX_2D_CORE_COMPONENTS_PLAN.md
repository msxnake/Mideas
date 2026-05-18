# Plan de componentes 2D MSX Screen 2 para Mideas

## Objetivo

Convertir Mideas en una herramienta capaz de montar juegos 2D reales para MSX1
Screen 2 con sprites hardware, tiles, colisiones, entidades, GameFlow y ASM
exportable. El objetivo no es solo tener componentes en el editor, sino que cada
componente importante tenga paridad entre:

- Definicion editable en Mideas.
- Preview jugable en `ScreenPlayModal` / `GameFlowPreviewModal`.
- Generacion ASM en `utils/msxGenerator`.
- Plantillas de entidad listas para usar.

Generos objetivo:

- Laberinto tipo Pac-Man.
- Plataformas precisas tipo Celeste, Mario o Sonic.
- Shooter vertical tipo Galaga.
- Aventura/exploracion tipo Metroid.

## Estado observado

Mideas ya tiene una base avanzada. Hay editores para sprites, tiles, tile banks,
screen maps, world maps, HUD, GameFlow, state machines, componentes y plantillas
de entidad. Tambien existen generadores ASM separados para sprites, pantallas,
entidades, componentes, state machines, sonido, HUD, scroll y recursos.

Componentes definidos por defecto en `data/defaults.ts`:

- `comp_pos`: posicion 2D.
- `comp_render`: sprite/render visible.
- `comp_animation`: animacion de sprite.
- `comp_player_input`: input de jugador.
- `comp_cursors`: movimiento por cursores.
- `comp_collision`: colision entidad contra entidad.
- `comp_wall_collision`: colision contra tiles/paredes.
- `comp_health`: vida.
- `comp_damage`: dano.
- `comp_lifetime`: autodestruccion por tiempo.
- `comp_gravity`: gravedad.
- `comp_jump`: salto.
- `comp_wall_jump`: salto de pared.
- `comp_wall_grab`: agarre de pared.
- `comp_air_control`: control aereo.
- `comp_deadly_tiles`: tiles mortales.
- `comp_tile_collector`: recogida de tiles tipo Pac-Man.
- `comp_collectible`: objeto recogible como entidad.
- `comp_inventory`: inventario/contador.
- `comp_carry`: cargar objetos.
- `comp_box`: caja transportable.
- `comp_child_link`: entidad hija pegada a otra.
- `comp_physics`: velocidad/friccion/masa.
- `comp_ai_behavior`: comportamiento AI basico.
- `comp_patrol`: rutas de patrulla.
- `comp_aiming`: apuntado.
- `comp_shoot`: disparo con trigger configurable (`fire`, `action2`, `up`) y cooldown.
- `comp_spawner`: generador de entidades.
- `comp_bounce`: rebote.
- `comp_statemachine`: maquina de estados.
- `comp_retractable_gate`: puerta/compuerta retractil.
- `comp_rotate`: rotacion/facing.
- `comp_pacMovement`: movimiento Pac-Man.
- `comp_PacmanMovementV2`: movimiento Pac-Man V2.
- `comp_PacmanRotationV2`: rotacion Pac-Man V2.

Plantillas de entidad existentes:

- `tpl_player`: jugador general con salto, gravedad, colision, input, state machine y recogida de tiles.
- `tpl_enemy_basic`: enemigo basico con AI, salud, gravedad, animacion, colision y dano.
- `tpl_item_key`: item recogible.
- `tpl_enemy_spawner`: generador de enemigos.
- `tpl_player_ship`: nave de jugador.
- `tpl_player_bullet`: proyectil.
- `tpl_collector_player`: jugador tipo recolector/Pac-Man.
- `tpl_pacman_player`: jugador Pac-Man.
- `tpl_PacmanPlayerV2`: jugador Pac-Man V2.
- `tpl_box`: caja fisica/transportable.

Componentes reconocidos por el generador ASM actual:

- Position, Sprite, Movement, Collision, Input, Behavior, Health, Animation.
- Jump, Gravity, DeadlyTiles, WallJump, AirControl.
- StateMachine, Cursors, Carry, Collectible, Patrol, RetractableGate.
- El runtime tambien tiene rutinas para Shoot, Damage, WallCollision, SecretZones, AutoDestroy, TileInteraction y WallGrab.

## Brecha principal

Hay tres niveles mezclados:

- Componentes totalmente utiles: definidos, editables, usados en preview y con ASM razonable.
- Componentes parcialmente utiles: existen en defaults/preview, pero el ASM no esta completo o no se activa desde el analizador.
- Componentes de diseno: existen como idea o definicion, pero aun necesitan runtime ASM, exportacion de datos y plantillas.

La prioridad debe ser cerrar esa brecha antes de crear muchos componentes nuevos.
Un componente en Mideas debe tener contrato claro: datos, preview, ASM, coste de
RAM/CPU y restricciones MSX.

## Conjunto imprescindible propuesto

### Nucleo comun

Estos componentes deben funcionar en cualquier genero:

- `Position`: x/y en pixels, mas opcion futura de posicion global para world maps.
- `Renderable`: sprite hardware, visibilidad, capa logica y sprite activo.
- `Animation`: animaciones por nombre, velocidad, loop, one-shot y cambio por estado.
- `Velocity`: unificar `comp_physics`, `comp_movement` y velocidades internas.
- `Collider`: hitbox entidad-entidad, layer y collidesWith.
- `TileCollider`: colision contra collision layer Screen 2.
- `Health`: vida, maximo, invulnerabilidad temporal y muerte.
- `Damage`: dano por contacto/proyectil/tile.
- `Lifetime`: destruir entidad tras N frames o al salir de pantalla.
- `StateMachine`: estados, transiciones, acciones y condiciones.
- `AudioEmitter`: SFX por evento, compatible con el motor PSG.

### Movimiento

- `TopDownInput`: movimiento libre 4/8 direcciones para aventuras y shooters.
- `GridMovement`: movimiento alineado a tile con buffer de direccion para Pac-Man.
- `PlatformMotor`: input horizontal, aceleracion, friccion y velocidad maxima.
- `Gravity`: aceleracion vertical y velocidad terminal.
- `Jump`: salto, doble salto, coyote time y key release.
- `AirControl`: control horizontal en aire.
- `WallGrab`: agarre/deslizamiento en pared.
- `WallJump`: salto de pared.
- `Ladder`: escaleras para plataformas y Metroid.
- `MovingPlatform`: plataformas moviles que arrastran al jugador.

### Tiles e interacciones Screen 2

- `TileBehavior`: tabla de comportamiento por tile: solid, deadly, ladder, collectible, door, slope, water, conveyor.
- `TileCollector`: recoger tiles y reemplazarlos por otro tile.
- `DeadlyTiles`: muerte/dano por tile.
- `BreakableTile`: tile destruible por disparo, golpe o variable.
- `Switch`: activa variable global o evento.
- `Gate/Door`: puerta que cambia tiles o cambia de pantalla.
- `Warp`: teletransporte o cambio de screen/world node.
- `Checkpoint`: punto de respawn.

### Combate y objetos

- `Shoot`: disparo con cooldown, direccion, sprite de proyectil y dano.
- `Projectile`: velocidad, rango, owner, expireOnHit, explosion.
- `MeleeHitbox`: golpe temporal tipo slash.
- `Pickup`: item como entidad.
- `Inventory`: llaves, armas, powerups, contador.
- `PowerUp`: modifica componentes o variables durante tiempo limitado.
- `Carryable`: caja/objeto transportable.

### AI

- `Patrol`: horizontal, vertical, caja o waypoints.
- `Chase`: perseguir entidad objetivo.
- `Flee`: huir del objetivo.
- `Formation`: formaciones tipo Galaga.
- `Spawner`: crea entidades con limite y frecuencia.
- `BossPattern`: patron por fases para jefes.

### Camara y mundo

- `CameraFollow`: seguimiento de jugador con limites.
- `ScreenTransition`: transicion por borde/puerta.
- `ScrollZone`: zonas que activan scroll o cambio de pantalla.
- `WorldPosition`: coordenadas globales para world maps.
- `Respawn`: reiniciar entidad tras muerte o cambio de pantalla.

## Presets por genero

### Pac-Man

Componentes base:

- Position, Renderable, Animation, Health.
- PlayerInput, GridMovement, WallCollision.
- TileCollector, Inventory, StateMachine.
- GhostAI: Scatter, Chase, Frightened, ReturnHome.
- Door/Gate para casa de fantasmas.

Prioridad concreta:

- Consolidar `comp_pacMovement` y `comp_PacmanMovementV2` en un solo `GridMovement`.
- Anadir `GhostAI` como preset de StateMachine o componente especializado.
- Asegurar que TileCollector tiene ASM y no solo preview.

### Celeste / Mario / Sonic

Componentes base:

- Position, Renderable, Animation.
- PlayerInput, PlatformMotor, Gravity, Jump.
- WallCollision, AirControl, WallGrab, WallJump.
- Health, Damage, DeadlyTiles, Checkpoint.
- MovingPlatform, Ladder, Conveyor, BreakableTile.

Prioridad concreta:

- Unificar ground detection entre preview y ASM.
- Completar coyote time, jump buffering y key release.
- Definir comportamiento de pendientes/slope solo si hay presupuesto tecnico en Screen 2.

### Galaga

Componentes base:

- Position, Renderable, Animation.
- TopDownInput o HorizontalInput.
- Shoot, Projectile, Damage, Health.
- Formation, Spawner, Patrol, BossPattern.
- Lifetime, ScreenBoundsDestroy.

Prioridad concreta:

- Separar `Shoot` y `Projectile`.
- Implementar pool de proyectiles en ASM.
- Anadir `Formation` para patrones de enemigos sin gastar demasiada CPU.

### Metroid

Componentes base:

- Position, Renderable, Animation.
- PlatformMotor, Gravity, Jump, WallCollision.
- Shoot, Projectile, Health, Damage.
- Inventory, AbilityUnlock, Door/Gate, Checkpoint.
- CameraFollow, ScreenTransition, WorldPosition.

Prioridad concreta:

- Crear sistema de puertas y transiciones conectado a WorldMap.
- Powerups que activan habilidades: doble salto, disparo, llave, acceso a zonas.
- Persistencia de puertas/items recogidos por variable global.

## Fases de implementacion

### Fase 1: Auditoria y normalizacion

- Mantener inventario unico de componentes: ID, nombre, propiedades, preview, ASM, plantillas.
- Evitar duplicados: `comp_pacMovement` y `comp_PacmanMovementV2` deben converger.
- Decidir nombres canonicos: por ejemplo `TileCollider` frente a `WallCollision`.
- Documentar por componente: RAM, CPU, orden de ejecucion y dependencias.

Resultado esperado:

- Tabla de compatibilidad: Editor / Preview / ASM / Plantilla.
- Lista cerrada de componentes core.

### Fase 2: Paridad Preview-ASM del nucleo

- Position, Renderable, Animation.
- Input, Cursors/TopDownInput.
- Gravity, Jump, AirControl, WallCollision.
- Collision, Health, Damage, DeadlyTiles.
- Lifetime/AutoDestroy.

Resultado esperado:

- Un jugador de plataformas puede saltar, caer, chocar, morir y animarse igual en preview y ROM.
- Un jugador top-down puede moverse y chocar con tiles igual en preview y ROM.

### Fase 3: Tiles interactivos Screen 2

- TileBehavior como fuente unica de verdad para collision/effects.
- TileCollector con reemplazo de tile en VRAM y actualizacion de mapa runtime.
- BreakableTile, Switch, Gate/Door, Warp.
- Superficies interactivas por char dentro de objetos compuestos: una caja 2x2
  puede seguir siendo caja/carryable y, a la vez, tener los dos chars superiores
  marcados como `interact:bounce`. El rebote pertenece a la superficie superior,
  no al tipo entero de objeto.
- Contrato de bounce para cajas 2x2: los 4 chars pueden ser solidos; solo los 2
  chars superiores disparan rebote; solo debe activarse si el jugador esta
  cayendo y la colision entra desde arriba. Laterales y contacto desde abajo no
  deben rebotar.
- Persistencia por variables globales.

Resultado esperado:

- Pac-Man puede comer puntos en ROM.
- Metroid puede abrir puertas y recordar estado.
- Plataformas pueden tener pinchos, llaves, bloques rompibles y cajas con
  superficie saltadora.

### Fase 4: Combate y proyectiles

- Shoot con cooldown y direccion.
- Projectile con pool fijo, rango, colision y explosion.
- Damage contra Health.
- Lifetime para proyectiles y efectos.

Resultado esperado:

- Galaga puede disparar y destruir enemigos.
- Metroid puede disparar puertas/enemigos.

### Fase 5: AI y patrones

- Patrol robusto en ASM.
- Chase/Flee basico.
- GhostAI para Pac-Man.
- Formation para Galaga.
- BossPattern por fases.

Resultado esperado:

- Enemigos utiles sin escribir ASM manual.
- Presets para fantasmas, patrullas de plataformas y oleadas shooter.

### Fase 6: Camara, mundo y plantillas

- CameraFollow y ScreenTransition.
- WorldPosition para entidades multi-screen.
- Checkpoint/Respawn.
- Presets completos por genero.

Resultado esperado:

- Juegos tipo Metroid y plataformas multi-pantalla exportables.

## Orden tecnico recomendado

1. Crear tabla de compatibilidad de componentes existentes.
2. Normalizar nombres y retirar duplicados conceptuales.
3. Completar el nucleo: Input, movimiento, colision, salud, dano, animacion.
4. Completar tiles interactivos.
5. Completar disparos/proyectiles.
6. Crear AI/patrones.
7. Crear presets por genero y ejemplos minimos.

## Primer paquete de trabajo sugerido

El primer paquete deberia centrarse en juegos de plataformas y top-down, porque
son la base de casi todos los generos citados.

Componentes a cerrar primero:

- `comp_wall_collision`: contrato unico de colision contra tiles.
- `comp_gravity`: paridad preview/ASM.
- `comp_jump`: salto, doble salto, key release.
- `comp_cursors`: input horizontal/vertical con restricciones.
- `comp_health` + `comp_damage`: dano real y muerte.
- `comp_deadly_tiles`: dano por tiles.
- `comp_animation`: cambiar animacion por movimiento/estado.
- `comp_lifetime`: autodestruir proyectiles/efectos.

Plantillas a validar:

- `PlatformPlayer`.
- `TopDownPlayer`.
- `PacmanPlayer`.
- `ShooterPlayer`.
- `BasicEnemy`.
- `Projectile`.
- `Collectible`.
- `MovingPlatform`.

## Criterio de terminado

Un componente se considera terminado cuando:

- Se puede crear y configurar desde Mideas.
- Funciona en preview.
- Se exporta a ASM.
- Compila con `glass.jar`.
- La ROM arranca en OpenMSX.
- Hay un ejemplo minimo que lo usa.
- Tiene documentado coste y limitaciones MSX.

## Progreso inicial

Primera pasada aplicada:

- `comp_wall_collision` se integra con la mascara de colision usada por el runtime ASM.
- `comp_lifetime` se detecta como `AutoDestroy` y se inicializa por entidad en frames de 50 Hz.
- `comp_health` inicializa `current/max` por entidad y su sistema usa la mascara real `COMP_MASK_HEALTH`.
- `comp_damage` se detecta y copia `damageAmount` a `entity_damage_amount`.
- `comp_collectible` usa una bandera RAM por entidad para que el sistema de recogida no desactive entidades no recogibles.
- `comp_shoot` se detecta, inicializa velocidad/sprite de proyectil y corrige la pila/indices del spawn ASM basico.
- El arranque sin GameFlow vuelve a ser compilable: usa `init_entities` y un `main_loop` minimo con `update_all_entities`.
- Los helpers compartidos de sprites y ladder ya no dependen de que existan componentes opcionales.
- Smoke test ASM con `WallCollision`, `Health`, `Shoot`, `Damage`, `Lifetime` y `Collectible` compila con `glass.jar`.

Pendiente inmediato:

- Validar `comp_shoot` en OpenMSX y revisar asignacion de hardware sprites para proyectiles dinamicos.
- Completar dano de contacto `Damage -> Health` con capas de colision.
- Anadir ejemplos minimos por genero para probar paridad Preview-ROM.
