# Funcionalidades Faltantes en Generadores ASM MSX

## Análisis de GameFlowPreviewModal.tsx vs Generadores ASM MSX

Este documento lista todas las funcionalidades implementadas en GameFlowPreviewModal (modo Play) que **AÚN NO están disponibles** en los generadores ASM MSX, organizadas por prioridad y categoría.

---

## 🔴 PRIORIDAD ALTA - Funcionalidad Core

### 1. Sistema de Componentes (ECS)

#### 1.1. `comp_health` - Sistema de Salud/Vidas
**GameFlowPreviewModal** (líneas 2152-2186):
- `current`: Vidas/salud actuales
- `max`: Máximo de vidas
- Acciones: `DECREASE_LIVES`, `INCREASE_LIVES`
- Detección automática de muerte (current <= 0)

**Estado ASM**: ❌ No implementado
- No hay generación de variables de salud
- No hay rutinas de daño/curación
- No hay detección de muerte

#### 1.2. `comp_gravity` - Sistema de Gravedad
**GameFlowPreviewModal** (líneas 5212-5230):
- `gravityAcceleration`: Aceleración por gravedad (default: 0.5)
- `maxFallSpeed`: Velocidad máxima de caída (default: 5)
- Aplicación automática por frame cuando `!isOnGround`

**Estado ASM**: ⚠️ Parcialmente implementado
- Existe en componentsGenerator.ts pero falta:
  - Aplicación automática de gravedad en game loop
  - Detección de `isOnGround`
  - Limitación de velocidad de caída

#### 1.3. `comp_jump` - Sistema de Salto
**GameFlowPreviewModal** (líneas 4966-5030):
- `jumpVelocity`: Velocidad inicial del salto (default: -8)
- `jumpSprite`: Sprite durante el salto
- `requireKeyRelease`: Requiere soltar tecla para saltar de nuevo
- `isJumping`: Flag de estado
- Reversión automática de sprite al aterrizar

**Estado ASM**: ❌ No implementado
- No hay rutina de salto
- No hay cambio de sprite durante salto
- No hay detección de key release

#### 1.4. `comp_shoot` - Sistema de Disparo/Proyectiles
**GameFlowPreviewModal** (líneas 3478-3680, 5154-5200):
- `spriteAssetId`: Sprite del proyectil
- `fireKey`: Tecla de disparo (default: 'KeyX')
- `cooldownMs`/`fireRateMs`: Cooldown entre disparos (default: 250ms)
- `range`/`maxRange`: Alcance máximo (default: 128px)
- `damage`: Daño del proyectil (default: 1)
- `expireOnHit`: Destruir al impactar (default: true)
- `playAnimation`: Animar proyectil (default: true)
- `hasAmmo`: Control de munición
- `explosionSprite`: Sprite de explosión (Render2)
- Direccionamiento automático según facing direction
- Sistema de mirroring para proyectiles
- Detección de colisiones proyectil-entidad
- Variable global `Ammo` para munición

**Estado ASM**: ❌ No implementado
- No hay rutinas de shooting
- No hay gestión de proyectiles
- No hay sistema de cooldown
- No hay detección de colisiones proyectil-enemigo

#### 1.5. `comp_collision` - Sistema de Colisiones
**GameFlowPreviewModal** (líneas 4162-4284, 4286-4430):
- `offsetX`/`offsetY`: Offset del hitbox
- `width`/`height`: Tamaño del hitbox
- `collisionLayer`: Bitmask de capa (1, 2, 4, 8, etc.)
- `collidesWith`: Bitmask de capas con las que colisiona
- Colisión con tiles sólidos (4 puntos de detección)
- Colisión con tiles mortales (`causesDamage`)
- Colisión entity-to-entity con separación de ejes
- Platform riding (detectar cuando está sobre otra entidad)
- Eventos: `collision_wall`, `collision_enemy`, etc.
- Grace frames para platforms

**Estado ASM**: ⚠️ Parcialmente implementado
- Existe estructura básica pero falta:
  - Colisión con tiles mortales
  - Platform riding completo
  - Eventos de colisión
  - Grace frames

#### 1.6. `comp_damage` - Sistema de Daño
**GameFlowPreviewModal** (líneas 5517-5520):
- Marca entidades como dañinas
- Se usa para detectar colisiones con enemigos
- Aplica daño a entidades con `comp_health`
- Invincibility frames (línea 101: `lastDamageTime`)

**Estado ASM**: ❌ No implementado
- No hay sistema de daño
- No hay invincibility frames
- No hay detección de colisión con enemigos dañinos

#### 1.7. `comp_cursors` - Input de Movimiento
**GameFlowPreviewModal** (líneas 4909-4964):
- `speed`: Velocidad de movimiento (default: 2)
- Control con flechas o WASD
- Actualización de facing direction
- Mirroring automático según dirección

**Estado ASM**: ⚠️ Parcialmente implementado
- Existe lectura de joystick pero falta:
  - Actualización de facing direction
  - Mirroring automático

#### 1.8. `comp_box` - Sistema de Cajas Transportables
**GameFlowPreviewModal** (líneas 5036-5152):
- Detección de cajas cercanas
- Pick up con tecla Z o Down+Fire
- Carry box (sigue al jugador, offset Y)
- Drop box (restaura física)
- Persistencia por pantalla (`ownerScreenId`)
- Snapshot de sprite al cargar/soltar

**Estado ASM**: ❌ No implementado

#### 1.9. `comp_lifetime` - Sistema de Tiempo de Vida
**GameFlowPreviewModal** (líneas 136-137, 190-197):
- `lifetimeMs`: Tiempo de vida en milisegundos
- `expiresAt`: Timestamp de expiración
- Destrucción automática al expirar

**Estado ASM**: ❌ No implementado

#### 1.10. `comp_child_link` - Sistema Parent-Child
**GameFlowPreviewModal** (líneas 57-188, 293-334):
- `parentTemplateId`: Template del padre
- `parentInstanceId`: Instancia específica del padre
- `parentInstanceName`: Nombre de la instancia padre
- `offsetX`/`offsetY`: Offset relativo
- `inheritVelocity`: Heredar velocidad del padre
- `inheritFacing`: Heredar dirección del padre
- `followParentGlobal`: Seguir en coordenadas globales (multi-screen)
- `detachOnParentLost`: Destruir al perder padre
- `mirrorParent`: Espejar con el padre
- Actualización automática de posición en `updateChildLinkPosition()`

**Estado ASM**: ❌ No implementado

---

## 🟡 PRIORIDAD MEDIA - State Machine & Actions

### 2. Acciones de State Machine

#### 2.1. Acciones de Movimiento
**Implementadas en GameFlowPreviewModal**:
- ✅ `SET_VELOCITY` (líneas 1278-1281): Establecer vx, vy
- ✅ `APPLY_FORCE` (líneas 1283-1289): Aplicar impulso
- ✅ `SET_POSITION` (líneas 1465-1469): Teletransporte

**Estado ASM**: ⚠️ `SET_VELOCITY` parcialmente, resto ❌

#### 2.2. Acciones de Sprite/Animación
**Implementadas en GameFlowPreviewModal**:
- ✅ `CHANGE_SPRITE` (líneas 1291-1361): Cambiar sprite completo
- ✅ `PLAY_ANIMATION` (líneas 1363-1432): Reproducir animación con loop
- ✅ `SET_ANIMATION_SPEED` (líneas 1811-1817): Cambiar velocidad animación

**Estado ASM**: ❌ No implementadas

#### 2.3. Acciones de Entidad
**Implementadas en GameFlowPreviewModal**:
- ✅ `SPAWN_ENTITY` (líneas 1629-1790): Spawn con offset, facing, delay, lifetime
- ✅ `DESTROY_ENTITY` (líneas 1436-1462): Destruir self u other
- ✅ `CHANGE_STATE` (implícita en state machine): Cambio de estado

**Estado ASM**: ❌ No implementadas

#### 2.4. Acciones de Variables
**Implementadas en GameFlowPreviewModal**:
- ✅ `SET_VARIABLE` (líneas 1471-1517): Establecer valor
- ✅ `INCREMENT_VARIABLE` (líneas 1484-1517): Incrementar
- ✅ `DECREMENT_VARIABLE` (líneas 1520-1553): Decrementar

**Estado ASM**: ❌ No implementadas

#### 2.5. Acciones de Componentes
**Implementadas en GameFlowPreviewModal**:
- ✅ `SET_COMPONENT_PROPERTY` (líneas 1603-1626): Modificar propiedades de componentes en runtime
- ✅ `DECREASE_LIVES` (líneas 2152-2168): Reducir vidas
- ✅ `INCREASE_LIVES` (líneas 2170-2186): Aumentar vidas

**Estado ASM**: ❌ No implementadas

#### 2.6. Acciones de Tiempo
**Implementadas en GameFlowPreviewModal**:
- ✅ `WAIT` (líneas 1804-1809): Pausar state machine por duración
  - Usa `waitUntilTime` para bloquear transiciones

**Estado ASM**: ❌ No implementado

#### 2.7. Acciones de Audio
**Implementadas en GameFlowPreviewModal**:
- ✅ `PLAY_SOUND` (líneas 1857-1934): Reproducir SFX
- ✅ `PLAY_MUSIC` (líneas 2017-2107): Reproducir música con loop
- ✅ `STOP_MUSIC` (líneas 2109-2116): Detener música

**Estado ASM**: ❌ No implementadas (aunque MSX tiene PSG)

#### 2.8. Acciones de Tiles
**Implementadas en GameFlowPreviewModal**:
- ✅ `CHANGE_TILE` (líneas 2227-2280): Cambiar tile en runtime
  - Modifica `runtimeCollisionLayer`
  - Soporta tiles sólidos y mortales

**Estado ASM**: ❌ No implementado

---

## 🟡 PRIORIDAD MEDIA - Física y Movimiento

### 3. Sistema de Física Avanzado

#### 3.1. Detección de Suelo (Ground Detection)
**GameFlowPreviewModal** (líneas 4767-4800):
- Detección con 2 puntos (left/right foot)
- `isOnGround` flag
- Platform grace frames (coyote time)
- Soporte para `topSolidOnly` tiles

**Estado ASM**: ❌ No implementado

#### 3.2. Platform Riding
**GameFlowPreviewModal** (líneas 4391-4430, 5304-5307, 5754-5762):
- Detección de estar encima de otra entidad
- `platformUnderneath` reference
- Herencia de velocidad del platform
- Grace frames al descender
- Soporte multi-screen (global coordinates)

**Estado ASM**: ❌ No implementado

#### 3.3. Colisión con Tiles - 4 Puntos
**GameFlowPreviewModal** (líneas 4195-4253):
- Detección horizontal: 2 puntos verticales (centro alto/bajo)
- Detección vertical: 2 puntos horizontales (centro izq/der)
- Corrección de posición al colisionar
- Reset de velocidad al colisionar
- Eventos de colisión por dirección (up/down/left/right)

**Estado ASM**: ⚠️ Parcialmente implementado (básico)

#### 3.4. Tiles Mortales (Deadly Tiles)
**GameFlowPreviewModal** (líneas 3389-3396, 4269-4283):
- Propiedad `causesDamage` en tiles
- Flag `hasDangerousTileCollision` en entidad
- Condición `HAS_DEADLY_TILE_COLLISION` para state machine
- No aplica daño automático (controlado por state machine)

**Estado ASM**: ❌ No implementado

#### 3.5. Secret Passages (Tiles de Fondo sin Colisión)
**GameFlowPreviewModal** (líneas 4845-4880):
- Detección de tiles de fondo sin colisión
- Revelación gradual (reveal radius)
- Tracking de tiles revelados

**Estado ASM**: ❌ No implementado

---

## 🟢 PRIORIDAD BAJA - Features Especiales

### 4. Sistema Multi-Screen

#### 4.1. Coordenadas Globales
**GameFlowPreviewModal** (líneas 103-106):
- `globalX`/`globalY`: Coordenadas en mundo
- `originScreenId`: Pantalla de origen
- Conversión local ↔ global

**Estado ASM**: ❌ No implementado

#### 4.2. Transiciones de Pantalla
**GameFlowPreviewModal** (líneas 5289-5425):
- Detección de salida por bordes (north/south/east/west)
- Carga de nueva pantalla conectada
- Transformación de coordenadas locales a globales
- Herencia de velocidad en transición
- Detección usando platform velocity cuando riding

**Estado ASM**: ❌ No implementado

#### 4.3. Persistencia de Entidades
**GameFlowPreviewModal** (líneas 5426-5453):
- `ownerScreenId`: Pantalla dueña de la entidad
- Despawn al salir de pantalla
- Mantenimiento de cajas en su pantalla original

**Estado ASM**: ❌ No implementado

---

### 5. Sistema de Proyectiles Avanzado

#### 5.1. Gestión de Proyectiles
**GameFlowPreviewModal** (líneas 116-127, 4641-4691):
- `isProjectile`: Flag de proyectil
- `projectileOwnerId`: Evitar auto-colisión
- `projectileStartX`/`projectileStartY`: Punto de origen
- `projectileMaxRange`: Rango máximo
- `projectileDamage`: Daño
- `projectileExpireOnHit`: Destruir al impactar
- Detección de alcance máximo
- Colisión con tiles
- Colisión con entidades (entity-to-entity)

**Estado ASM**: ❌ No implementado

#### 5.2. Sistema de Explosión (Render2)
**GameFlowPreviewModal** (líneas 128-132, 3644-3648, 3686-3696):
- `isExploding`: Flag de explosión activa
- `explosionSprite`: Sprite de explosión
- `explosionFrameImages`/`explosionMirroredFrameImages`: Frames precargados
- Swap automático de sprite al explotar
- Re-evaluación de mirroring para explosión

**Estado ASM**: ❌ No implementado

#### 5.3. Direccionamiento de Proyectiles
**GameFlowPreviewModal** (líneas 3502-3564):
- Detección de dirección según facing
- Offset inverso cuando mirrored
- Soporte para disparo en 8 direcciones (con input)
- Velocidad normalizada para diagonales
- `desiredFacingDirection` para mirroring correcto

**Estado ASM**: ❌ No implementado

---

### 6. Sistema de Variables Globales

#### 6.1. Variables de Juego
**GameFlowPreviewModal** (líneas 1471-1553, 5168-5198):
- Sistema de variables globales (`gameGlobalVariables`)
- Tipos soportados: number, string, boolean
- Acciones: SET, INCREMENT, DECREMENT
- Variable especial `Ammo` para munición

**Estado ASM**: ⚠️ Parcialmente implementado
- Existe generación de variables pero falta:
  - Runtime modification
  - Type coercion
  - Integration con actions

---

### 7. Condiciones de State Machine

#### 7.1. Condiciones Implementadas en GameFlowPreviewModal
**Líneas 1031-1200**:
- ✅ `KEY_PRESSED`: Tecla presionada
- ✅ `KEY_RELEASED`: Tecla soltada
- ✅ `COLLISION_WITH`: Colisión con entidad específica
- ✅ `VARIABLE_EQUALS`: Variable == valor
- ✅ `VARIABLE_GREATER_THAN`: Variable > valor
- ✅ `VARIABLE_LESS_THAN`: Variable < valor
- ✅ `IS_ON_GROUND`: Está en el suelo
- ✅ `IS_IN_AIR`: Está en el aire
- ✅ `HEALTH_EQUALS`: Salud == valor
- ✅ `HEALTH_LESS_THAN`: Salud < valor
- ✅ `ANIMATION_COMPLETE`: Animación terminada
- ✅ `HAS_DEADLY_TILE_COLLISION`: Tocando tile mortal
- ✅ `TIMER_EXPIRED`: Timer expirado (para WAIT)

**Estado ASM**: ❌ Mayoría no implementadas

---

### 8. Sistema de Eventos

#### 8.1. Eventos de Colisión
**GameFlowPreviewModal** (líneas 4169-4172, 5507-5600):
- `collision_wall`: Colisión con pared (up/down/left/right)
- `collision_enemy`: Colisión con enemigo
- `collision_platform`: Colisión con plataforma
- Sistema de event queue
- Trigger y check de eventos

**Estado ASM**: ❌ No implementado

---

### 9. Comportamientos Especiales

#### 9.1. Mirroring Dinámico
**GameFlowPreviewModal** (líneas 3665-3675, 3604-3610):
- `computeMirrorForSprite()`: Decide si espejar según facing
- `isFacingMirrored`: Flag de estado de espejo
- `desiredFacingDirection`: Dirección deseada en mundo
- Aplicación a sprites, proyectiles y explosiones

**Estado ASM**: ⚠️ Parcialmente (solo generación estática)

#### 9.2. Animación con Loop Control
**GameFlowPreviewModal** (líneas 1363-1432):
- `animationHasCompleted`: Flag de animación completa
- Loop vs one-shot animations
- Pausar en último frame si no loop
- Reset a frame 0 al cambiar animación

**Estado ASM**: ❌ No implementado

#### 9.3. Carry Sprite Backup
**GameFlowPreviewModal** (líneas 72-78, 696-702):
- Snapshot de sprite al cambiar
- Restauración al soltar caja
- Mantiene frame actual

**Estado ASM**: ❌ No implementado

---

### 10. Runtime Tile Modification

#### 10.1. Runtime Collision Layer
**GameFlowPreviewModal** (líneas 955-977, 2227-2280):
- `runtimeCollisionLayerRef`: Copia modificable del collision layer
- `modifyTileInLayer()`: Modificar tiles en runtime
- Acción `CHANGE_TILE`: Cambiar tile en coordenadas específicas
- Soporte para tiles sólidos y mortales
- Persistencia durante el gameplay

**Estado ASM**: ❌ No implementado

---

## 📊 Resumen por Categoría

| Categoría | Total Features | Implementado ASM | Parcial ASM | Faltante ASM |
|-----------|---------------|------------------|-------------|--------------|
| **Componentes ECS** | 10 | 0 | 4 | 6 |
| **State Machine Actions** | 18 | 0 | 1 | 17 |
| **Física y Movimiento** | 5 | 0 | 2 | 3 |
| **Sistema Multi-Screen** | 3 | 0 | 0 | 3 |
| **Proyectiles** | 3 | 0 | 0 | 3 |
| **Variables Globales** | 1 | 0 | 1 | 0 |
| **Condiciones** | 13 | 0 | 2 | 11 |
| **Eventos** | 1 | 0 | 0 | 1 |
| **Comportamientos** | 3 | 0 | 1 | 2 |
| **Runtime Modification** | 1 | 0 | 0 | 1 |
| **TOTAL** | **58** | **0** | **11** | **47** |

---

## 🎯 Roadmap Sugerido de Implementación

### Fase 1: Fundamentos (4-6 semanas)
1. ✅ **Sprite Mirroring** (COMPLETO)
2. **comp_gravity** completo con isOnGround
3. **comp_jump** con cambio de sprite
4. **comp_health** con DECREASE_LIVES/INCREASE_LIVES
5. **Colisión con tiles mortales**
6. **Condiciones básicas** (KEY_PRESSED, IS_ON_GROUND, HEALTH_LESS_THAN)

### Fase 2: Gameplay Core (4-6 semanas)
7. **comp_shoot** sistema completo
8. **Proyectiles** con colisiones
9. **comp_damage** con invincibility frames
10. **SET_VELOCITY, APPLY_FORCE, SET_POSITION**
11. **SPAWN_ENTITY, DESTROY_ENTITY**
12. **Platform riding básico**

### Fase 3: Features Avanzadas (4-6 semanas)
13. **Variables globales** runtime modification
14. **CHANGE_SPRITE, PLAY_ANIMATION**
15. **comp_box** (carry/drop system)
16. **Runtime tile modification** (CHANGE_TILE)
17. **comp_lifetime**
18. **WAIT action** con timer

### Fase 4: Multi-Screen y Polish (3-4 semanas)
19. **Sistema multi-screen** completo
20. **comp_child_link** (parent-child)
21. **Sistema de eventos**
22. **Explosiones** (Render2)
23. **Secret passages**
24. **Audio** (PLAY_SOUND, PLAY_MUSIC)

---

## 📝 Notas de Implementación

### Consideraciones MSX Hardware
- **Sprites**: MSX1 tiene 32 sprites hardware (4 por línea)
- **VRAM**: 16KB total, cuidado con sprite patterns
- **CPU**: Z80 @ 3.58 MHz, optimizar loops críticos
- **Interrupts**: Usar V-Blank para sincronización
- **PSG**: 3 canales para audio

### Arquitectura Recomendada
- **Interrupt-driven**: Usar sistema de interrupciones Konami
- **Component masks**: Bitfields para filtrado eficiente
- **State machine**: Jump table para transiciones
- **Collision**: Spatial hashing para entity-to-entity
- **Projectile pool**: Pre-allocar slots de proyectiles

### Testing
- Cada feature debe tener **paridad exacta** con GameFlowPreviewModal
- Usar proyectos de test (mini_game73.json, etc.)
- OpenMSX automation para capturas comparativas
- Glass.jar compilation validation

---

**Última actualización**: 2025-12-17
**Autor**: Claude Code Analysis
**Base**: GameFlowPreviewModal.tsx (líneas 1-6600+)
