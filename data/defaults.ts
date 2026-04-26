import { ComponentDefinition, EntityTemplate } from '../types';

export const DEFAULT_MAP_ASM_CONTENT = `
 include "asm/init.asm"
`;

export const DEFAULT_CONSTANTS_ASM_CONTENT = ``;

export const DEFAULT_COMPONENT_DEFINITIONS: ComponentDefinition[] = [
  {
    id: "comp_pos", name: "Position",
    properties: [
      { name: "x", type: "byte", defaultValue: "0", description: "Horizontal position (pixel units or grid units depending on context)" },
      { name: "y", type: "byte", defaultValue: "0", description: "Vertical position" }
    ],
    description: "Defines an entity's 2D coordinates."
  },
  {
    id: "comp_carry", name: "Carry",
    description: "Configures how the entity carries objects (e.g., vertical offset above head).",
    properties: [
      { name: "offset", type: "byte", defaultValue: "0", description: "Vertical pixels between hero head and carried object (0 = pegado)." },
      { name: "carrySpriteAssetId", type: "sprite_ref", defaultValue: "", description: "Optional sprite to display while the entity is carrying another object." }
    ],
  },
  {
    id: "comp_box", name: "Box",
    description: "Marks this entity as a carriable box that can be picked up and moved.",
    properties: [
      { name: "isCarriable", type: "boolean", defaultValue: "true", description: "Whether this box can be picked up by entities with comp_carry." }
    ],
  },
  {
    id: "comp_child_link", name: "Child Link",
    description: "Attaches this entity to a parent entity so it follows its position (e.g., satellite \"options\").",
    properties: [
      { name: "parentTemplateId", type: "entity_template_ref", defaultValue: "", description: "Template ID of the entity to follow (e.g., tpl_player)." },
      { name: "parentInstanceId", type: "string", defaultValue: "", description: "Specific instance ID to follow (optional, overrides template search)." },
      { name: "parentInstanceName", type: "string", defaultValue: "", description: "Optional instance name to match when multiple parents share template." },
      { name: "offsetX", type: "word", defaultValue: "0", description: "Horizontal pixel offset relative to the parent origin." },
      { name: "offsetY", type: "word", defaultValue: "0", description: "Vertical pixel offset relative to the parent origin." },
      { name: "inheritVelocity", type: "boolean", defaultValue: "true", description: "If true, copy the parent's velocity values each frame." },
      { name: "inheritFacing", type: "boolean", defaultValue: "true", description: "If true, mirror this sprite based on the parent's facing direction." },
      { name: "followParentGlobal", type: "boolean", defaultValue: "true", description: "Keep global coordinates in sync for multi-screen movement." },
      { name: "detachOnParentLost", type: "boolean", defaultValue: "false", description: "Automatically clear the link if the target parent is missing." },
      { name: "mirrorParent", type: "boolean", defaultValue: "false", description: "If true, mirror this child when the parent flips horizontally (also inverts offsetX)." }
    ],
  },
  {
    id: "comp_render", name: "Renderable",
    properties: [
      { name: "spriteAssetId", type: "sprite_ref", defaultValue: "", description: "ID of the sprite asset to render" },
      { name: "isVisible", type: "boolean", defaultValue: "true", description: "Whether the entity is currently visible" },
      { name: "layer", type: "byte", defaultValue: "1", description: "Render layer (0=bg, 1=main, 2=fg)" }
    ],
    description: "Allows an entity to be drawn on screen using a sprite."
  },
  {
    id: "comp_behavior", name: "Behavior",
    properties: [
      { name: "scriptAssetId", type: "behavior_script_ref", defaultValue: "", description: "ID of the behavior script to run" }
    ],
    description: "Attaches a behavior script to an entity."
  },
  {
    id: "comp_health", name: "Health",
    properties: [
      { name: "current", type: "byte", defaultValue: "1" },
      { name: "max", type: "byte", defaultValue: "1" }
    ],
    description: "Manages health points for an entity."
  },
  {
    id: "comp_lifetime", name: "Lifetime",
    description: "Auto-destruye la entidad tras un tiempo determinado desde su creación.",
    properties: [
      { name: "lifetimeMs", type: "word", defaultValue: "1000", description: "Tiempo de vida en milisegundos. Si es 0 o vacío, no expira." }
    ],
  },
  {
    id: "comp_jump", name: "Jump",
    description: "Manages jumping behavior for an entity.",
    properties: [
      { name: "jumpPower", type: "word", defaultValue: "256", description: "Initial upward velocity or force." },
      { name: "jumpSprite", type: "sprite_ref", defaultValue: "", description: "Sprite to use while jumping." },
      { name: "maxJumps", type: "byte", defaultValue: "1", description: "Number of jumps allowed before landing." },
      { name: "currentJumpCount", type: "byte", defaultValue: "0", description: "Current jump count." },
      { name: "isJumping", type: "boolean", defaultValue: "false", description: "Is the entity currently jumping?" },
      { name: "requireKeyRelease", type: "boolean", defaultValue: "true", description: "If true, jump key must be released before jumping again." },
    ],
  },
  {
    id: "comp_gravity", name: "Gravity",
    description: "Applies gravitational force to an entity.",
    properties: [
      { name: "strength", type: "word", defaultValue: "64", description: "Acceleration due to gravity." },
      { name: "terminalVelocity", type: "word", defaultValue: "1024", description: "Maximum falling speed." },
    ],
  },
  {
    id: "comp_animation", name: "Animation",
    description: "Manages sprite animation sequences for an entity.",
    properties: [
      { name: "currentAnimationName", type: "string", defaultValue: "idle", description: "Name of the current animation (e.g., 'idle', 'walk')." },
      { name: "currentFrameIndex", type: "byte", defaultValue: "0", description: "Current frame in the animation." },
      { name: "animationSpeed", type: "byte", defaultValue: "6", description: "Ticks/frames per animation update." },
      { name: "loops", type: "boolean", defaultValue: "true", description: "Does the animation loop?" },
      { name: "isPlaying", type: "boolean", defaultValue: "true", description: "Is the animation currently playing?" },
      { name: "animateOnlyWhenMoving", type: "boolean", defaultValue: "false", description: "Only animate when entity has non-zero velocity (vx or vy)." },
    ],
  },
  {
    id: "comp_collision", name: "Collision",
    properties: [
      { name: "hitboxWidth", type: "byte", defaultValue: "16", description: "Width of the collision bounding box." },
      { name: "hitboxHeight", type: "byte", defaultValue: "16", description: "Height of the collision bounding box." },
      { name: "offsetX", type: "byte", defaultValue: "0", description: "Horizontal offset of the hitbox from the entity's origin." },
      { name: "offsetY", type: "byte", defaultValue: "0", description: "Vertical offset of the hitbox from the entity's origin." },
      { name: "collisionLayer", type: "byte", defaultValue: "1", description: "Bitmask defining the entity's collision group (e.g., 1=player, 2=enemy)." },
      { name: "collidesWith", type: "byte", defaultValue: "255", description: "Bitmask defining which layers this entity can collide with." },
      { name: "isStatic", type: "boolean", defaultValue: "false", description: "If true, this entity is immovable and won't be pushed by collisions. Other entities will be pushed away when colliding with static entities." },
      { name: "isTrigger", type: "boolean", defaultValue: "false", description: "If true, collision is detected for events but entities pass through each other (no physical pushback). Use for collectibles, checkpoints, damage zones. If false, entities push/separate on collision (solid collision)." }
    ],
    description: "Defines the physical shape and interaction rules for entity-to-entity collisions. Supports both solid (pushback) and trigger (overlap-only) collision modes."
  },
  {
    id: "comp_wall_collision", name: "Wall Collision",
    properties: [
      { name: "hitboxWidth", type: "byte", defaultValue: "16", description: "Width of the collision bounding box for wall detection." },
      { name: "hitboxHeight", type: "byte", defaultValue: "16", description: "Height of the collision bounding box for wall detection." },
      { name: "offsetX", type: "byte", defaultValue: "0", description: "Horizontal offset of the hitbox from the entity's origin." },
      { name: "offsetY", type: "byte", defaultValue: "0", description: "Vertical offset of the hitbox from the entity's origin." },
      { name: "tileSize", type: "byte", defaultValue: "8", description: "Size of tiles in the collision layer (usually 8x8 for MSX)." },
      { name: "stopOnCollision", type: "boolean", defaultValue: "true", description: "Whether to stop entity movement when hitting a wall." }
    ],
    description: "Defines collision detection with solid tiles in the collision layer (walls, obstacles)."
  },
  {
    id: "comp_wall_jump", name: "Wall Jump",
    description: "Permite deslizarse por paredes y saltar/rebotar desde ellas con impulso horizontal y vertical configurables.",
    properties: [
      { name: "horizontalPush", type: "byte", defaultValue: "7", description: "Velocidad horizontal aplicada al saltar desde la pared." },
      { name: "verticalImpulse", type: "word", defaultValue: "1280", description: "Impulso vertical 8.8 aplicado al wall jump (1280 = #0500 de magnitud)." },
      { name: "animationSpriteAssetId", type: "sprite_ref", defaultValue: "", description: "Animacion/sprite one-shot que se reproduce al saltar desde una pared. Al terminar, vuelve al sprite base mirando en direccion contraria al muro." },
      { name: "slideFallSpeed", type: "byte", defaultValue: "2", description: "Velocidad maxima de caida mientras se desliza por la pared. 0 desactiva el slide." },
      { name: "lockFrames", type: "byte", defaultValue: "16", description: "Frames minimos durante los que se mantiene el impulso horizontal del wall jump. Si la entidad sigue ascendiendo, el impulso se conserva hasta la cima del salto." },
      { name: "requirePressAwayFromWall", type: "boolean", defaultValue: "false", description: "Si es true, exige pulsar la direccion contraria a la pared para saltar." },
      { name: "isEnabled", type: "boolean", defaultValue: "true", description: "Activa o desactiva el wall jump para esta entidad." }
    ],
  },
  {
    id: "comp_wall_grab", name: "Wall Grab",
    description: "Permite agarrarse a una pared mientras se mantiene Boton 2/N. Ideal para un control tipo Celeste.",
    properties: [
      { name: "grabFallSpeed", type: "byte", defaultValue: "0", description: "Velocidad vertical mientras se agarra a la pared. 0 = quedarse quieto, 1+ = deslizarse lentamente." },
      { name: "climbSpeed", type: "byte", defaultValue: "1", description: "Pixeles por frame al trepar o bajar mientras se mantiene Boton 2/N y se pulsa arriba o abajo." },
      { name: "climbStamina", type: "byte", defaultValue: "64", description: "Pixeles verticales maximos que puede desplazarse durante un agarre antes de agotarse." },
      { name: "grabSpriteAssetId", type: "sprite_ref", defaultValue: "", description: "Sprite que se muestra mientras se esta agarrado a la pared. Si esta vacio, no cambia el sprite." },
      { name: "isEnabled", type: "boolean", defaultValue: "true", description: "Activa o desactiva el wall grab para esta entidad." }
    ],
  },
  {
    id: "comp_air_control", name: "Air Control",
    description: "Controla si la entidad puede cambiar su movimiento horizontal mientras esta en el aire.",
    properties: [
      { name: "airControlMode", type: "string", defaultValue: "locked", description: "Modo de control aereo: full o locked. locked conserva la velocidad horizontal hasta tocar suelo o escalera." },
      { name: "isEnabled", type: "boolean", defaultValue: "true", description: "Activa o desactiva esta regla de control aereo." }
    ],
  },
  {
    id: "comp_physics", name: "Physics",
    properties: [
      { name: "velocityX", type: "word", defaultValue: "0", description: "Horizontal speed (fixed-point 8.8 or integer)." },
      { name: "velocityY", type: "word", defaultValue: "0", description: "Vertical speed (fixed-point 8.8 or integer)." },
      { name: "friction", type: "byte", defaultValue: "10", description: "Damping factor for velocity (0-255, where 255 is no friction)." },
      { name: "mass", type: "byte", defaultValue: "1", description: "Mass of the entity, affecting knockback etc." }
    ],
    description: "Governs basic physical properties like velocity. Works with Gravity and Jump."
  },
  {
    id: "comp_player_input", name: "PlayerInput",
    properties: [
      { name: "controllerId", type: "byte", defaultValue: "0", description: "Controller ID (0 for player 1, 1 for player 2, etc.)." },
      { name: "inputEnabled", type: "boolean", defaultValue: "true", description: "Is input processing active for this entity." }
    ],
    description: "A marker component indicating the entity responds to player controls."
  },
  {
    id: "comp_ai_behavior", name: "AIBehavior",
    properties: [
      { name: "aiState", type: "string", defaultValue: "idle", description: "Current AI state (e.g., 'idle', 'patrol', 'chase')." },
      { name: "stateTimer", type: "word", defaultValue: "0", description: "Timer for current AI state duration or cooldown." },
      { name: "targetEntityTemplateId", type: "entity_template_ref", defaultValue: "", description: "ID of the entity template this AI is targeting (e.g., 'tpl_player')." },
      { name: "patrolRangeX", type: "word", defaultValue: "64", description: "Horizontal patrol range." },
      { name: "aggroRadius", type: "word", defaultValue: "80", description: "Radius to detect and target entities." }
    ],
    description: "Manages autonomous behavior for non-player entities."
  },
  {
    id: "comp_damage", name: "Damage",
    properties: [
      { name: "damageAmount", type: "byte", defaultValue: "1", description: "Amount of damage dealt." },
      { name: "damageType", type: "string", defaultValue: "contact", description: "Type of damage (e.g., 'contact', 'bullet', 'explosion')." },
      { name: "knockbackForce", type: "byte", defaultValue: "5", description: "Force applied on hit." }
    ],
    description: "Defines how much damage an entity inflicts upon collision or attack."
  },
  {
    id: "comp_deadly_tiles", name: "Deadly Tiles",
    properties: [],
    description: "Marker component. Enables per-entity detection of deadly behavior-map tiles and updates the runtime flag used by the state machine."
  },
  {
    id: "comp_collectible", name: "Collectible",
    properties: [
      { name: "itemType", type: "string", defaultValue: "coin", description: "Type of collectible (e.g., 'coin', 'key', 'powerup_health')." },
      { name: "itemValue", type: "word", defaultValue: "1", description: "Value associated with the item (e.g., score, health restored)." },
      { name: "autoCollectRadius", type: "byte", defaultValue: "8", description: "Radius within which the item is automatically collected." },
      { name: "collectionSoundRef", type: "sound_ref", defaultValue: "", description: "Sound to play on collection." }
    ],
    description: "Marks an entity as an item that can be picked up."
  },
  {
    id: "comp_patrol", name: "Patrol",
    description: "Defines a patrol route for an entity. Works with a Behavior script to update entity velocity.",
    properties: [
      { name: "patrolType", type: 'string', defaultValue: 'Horizontal', description: "Type of patrol: Horizontal, Vertical, Box, BackAndForth." },
      { name: "waypoint1_x", type: 'word', defaultValue: '0', description: "Start X coordinate or min corner of box." },
      { name: "waypoint1_y", type: 'word', defaultValue: '0', description: "Start Y coordinate or min corner of box." },
      { name: "waypoint2_x", type: 'word', defaultValue: '64', description: "End X coordinate or max corner of box." },
      { name: "waypoint2_y", type: 'word', defaultValue: '0', description: "End Y coordinate or max corner of box." },
      { name: "patrolSpeed", type: 'word', defaultValue: '50', description: "Movement speed during patrol." },
      { name: "waypointPause", type: 'word', defaultValue: '0', description: "Pause duration in ticks at each waypoint." },
      { name: "multiScreen", type: 'boolean', defaultValue: 'false', description: "Enable multi-screen patrol (entity moves across multiple screens)." },
      { name: "originScreenId", type: 'string', defaultValue: '', description: "Screen ID where the entity was created (auto-assigned, used for global coordinates)." }
    ],
  },
  {
    id: "comp_aiming", name: "Aiming",
    description: "Allows an entity to aim at a target. Used by turrets or enemies that shoot.",
    properties: [
      { name: "targetEntityTemplateId", type: 'entity_template_ref', defaultValue: 'tpl_player', description: "The type of entity to aim at." },
      { name: "aimingRange", type: 'word', defaultValue: '128', description: "Maximum distance to acquire a target." },
      { name: "rotationSpeed", type: 'word', defaultValue: '5', description: "How fast the entity rotates to face the target (0 for instant)." },
      { name: "fieldOfView", type: 'byte', defaultValue: '128', description: "The vision cone angle (0-255, mapping to 0-360 degrees)." },
      { name: "predictsTargetMovement", type: 'boolean', defaultValue: 'false', description: "Whether to aim ahead of a moving target." },
      { name: "predictionFactor", type: 'byte', defaultValue: '10', description: "Multiplier for leading the target." }
    ],
  },
  {
    id: "comp_shoot", name: "Shoot",
    description: "Configures a basic projectile shot for an entity (e.g., player/boss/enemy).",
    properties: [
      { name: "hasAmmo", type: 'boolean', defaultValue: 'true', description: "If false, shooting is disabled (HasAmmo). Manageable from State Machine." },
      { name: "spriteAssetId", type: 'sprite_ref', defaultValue: '', description: "Projectile sprite asset to render (Render)." },
      { name: "render2", type: 'sprite_ref', defaultValue: '', description: "Explosion sprite asset to render on impact (Render2). Non-looping animation recommended." },
      { name: "offsetX", type: 'word', defaultValue: '0', description: "Horizontal offset from shooter center (Offset X)." },
      { name: "offsetY", type: 'word', defaultValue: '0', description: "Vertical offset from shooter center (Offset Y)." },
      { name: "speed", type: 'word', defaultValue: '3', description: "Projectile speed magnitude in px/frame. Used for 4-dir aiming or when velocityX is positive." },
      { name: "aimMode", type: 'string', defaultValue: 'facing', description: "Aiming mode: 'facing' (left/right based on mirror) or '4dir' (aim with Arrow keys)." },
      { name: "allowDiagonals", type: 'boolean', defaultValue: 'false', description: "If true and two direction keys are held, shoot diagonally." },
      { name: "velocityX", type: 'word', defaultValue: '0', description: "Projectile speed on X (px/frame)." },
      { name: "velocityY", type: 'word', defaultValue: '0', description: "Projectile speed on Y (px/frame)." },
      { name: "range", type: 'word', defaultValue: '128', description: "Max travel distance in pixels (distancia de alcance)." },
      { name: "damage", type: 'word', defaultValue: '1', description: "Damage applied on hit (daño)." },
      { name: "cooldownMs", type: 'word', defaultValue: '250', description: "Time between shots in ms (fire rate)." },
      { name: "fireKey", type: 'string', defaultValue: 'KeyX', description: "Keyboard code to fire (e.code), defaults to KeyX." },
      { name: "expireOnHit", type: 'boolean', defaultValue: 'true', description: "If true, projectile despawns on first hit." },
      { name: "anchor", type: 'string', defaultValue: 'center', description: "Spawn anchor relative to shooter (Parent/anchor). Currently informational." }
    ],
  },
  {
    id: "comp_bounce", name: "Bounce",
    description: "Makes an entity bounce off surfaces upon collision.",
    properties: [
      { name: "bounciness", type: 'byte', defaultValue: '200', description: "Elasticity of the bounce (0-255, where 255 is a near-perfect bounce)." },
      { name: "bounceOnLayers", type: 'byte', defaultValue: '255', description: "Bitmask of collision layers this entity will bounce off." },
      { name: "minVelocityToBounce", type: 'word', defaultValue: '25', description: "Minimum velocity required to trigger a bounce." },
      { name: "maxBounces", type: 'byte', defaultValue: '255', description: "Maximum number of bounces before stopping (255 for infinite)." },
      { name: "bounceSoundId", type: 'sound_ref', defaultValue: '', description: "ID of the sound asset to play on bounce." }
    ],
  },
  {
    id: "comp_statemachine", name: "StateMachine",
    description: "Connects an entity to a state machine for behavior control.",
    properties: [
      { name: "stateMachineAssetId", type: 'statemachine_ref', defaultValue: '', description: "ID of the state machine asset to use." },
      { name: "currentStateId", type: 'string', defaultValue: 'Idle', description: "ID of the current active state. Auto-selected from available states." },
      { name: "isEnabled", type: 'boolean', defaultValue: 'true', description: "Whether the state machine is currently active." }
    ],
  },
  {
    id: "comp_cursors", name: "Cursors",
    description: "Marks an entity as player-controllable with cursor/arrow keys with configurable allowed directions.",
    properties: [
      { name: "isEnabled", type: 'boolean', defaultValue: 'true', description: "Whether cursor control is active." },
      { name: "speed", type: 'byte', defaultValue: '2', description: "Movement speed in pixels per frame." },
      { name: "allowUp", type: 'boolean', defaultValue: 'true', description: "Allow movement in UP direction." },
      { name: "allowDown", type: 'boolean', defaultValue: 'true', description: "Allow movement in DOWN direction." },
      { name: "allowLeft", type: 'boolean', defaultValue: 'true', description: "Allow movement in LEFT direction." },
      { name: "allowRight", type: 'boolean', defaultValue: 'true', description: "Allow movement in RIGHT direction." }
    ],
  },
  {
    id: "comp_spawner", name: "Spawner",
    description: "Spawns entities at random positions within a defined zone at regular intervals.",
    properties: [
      { name: "spawnRate", type: 'word', defaultValue: '3000', description: "Milliseconds between spawns." },
      { name: "maxEntities", type: 'byte', defaultValue: '5', description: "Maximum entities to spawn simultaneously." },
      { name: "spawnZoneX", type: 'word', defaultValue: '0', description: "Spawn zone X coordinate in pixels (0 = random across screen)." },
      { name: "spawnZoneY", type: 'word', defaultValue: '0', description: "Spawn zone Y coordinate in pixels (0 = random across screen)." },
      { name: "spawnZoneWidth", type: 'word', defaultValue: '0', description: "Spawn zone width in pixels (0 = full screen width)." },
      { name: "spawnZoneHeight", type: 'word', defaultValue: '0', description: "Spawn zone height in pixels (0 = full screen height)." },
      { name: "entityTemplateId", type: 'entity_template_ref', defaultValue: 'tpl_enemy_basic', description: "Template ID of entity to spawn." },
      { name: "isActive", type: 'boolean', defaultValue: 'true', description: "Whether spawning is currently active." },
      { name: "spawnOnStart", type: 'boolean', defaultValue: 'false', description: "Spawn an entity immediately when the game starts." }
    ],
  },
  {
    id: "comp_tile_collector", name: "Tile Collector",
    description: "Allows an entity to collect items by walking over specific tiles (Pac-Man style).",
    properties: [
      { name: "collectionRadius", type: 'byte', defaultValue: '4', description: "Pixel radius for tile collection detection." },
      { name: "collectibleTileIds", type: 'string', defaultValue: 'dot,powerup,fruit', description: "Comma-separated list of tile IDs that can be collected." },
      { name: "replacementTileId", type: 'string', defaultValue: 'empty', description: "Tile ID to replace collected tiles with (usually empty/floor)." },
      { name: "collectionSoundId", type: 'sound_ref', defaultValue: '', description: "Sound to play when collecting items." },
      { name: "targetVariable", type: 'string', defaultValue: '', description: "Optional global variable name to increment when an item is collected (e.g. Score)." },
      { name: "incrementAmount", type: 'word', defaultValue: '0', description: "How much to add to targetVariable on collection. 0 = disabled." },
      { name: "flagVariable", type: 'string', defaultValue: '', description: "Optional second global variable to set when an item is collected (e.g. GemsModified)." },
      { name: "flagValue", type: 'word', defaultValue: '1', description: "Value assigned to flagVariable on collection. Use 1 for a pickup flag and clear it later from StateMachine." },
      { name: "bonusTileId", type: 'tile_ref', defaultValue: '', description: "Optional special tile with its own pickup behavior (kept separate from normal collectibles)." },
      { name: "bonusReplacementTileId", type: 'tile_ref', defaultValue: '', description: "Tile to place after picking up the bonus tile during the current visit. Leave empty to remove it." },
      { name: "bonusSoundId", type: 'sound_ref', defaultValue: '', description: "Optional sound for the bonus tile pickup." },
      { name: "bonusIsPersistent", type: 'boolean', defaultValue: 'false', description: "If false, the bonus tile reappears when the screen is reloaded." },
      { name: "bonusEntityEffect", type: 'string', defaultValue: 'none', description: "Optional entity effect for the bonus tile (for now: none or grant_extra_jump)." },
      { name: "bonusEffectAmount", type: 'word', defaultValue: '1', description: "Amount used by bonusEntityEffect (for example, extra jumps granted)." },
      { name: "bonusSlashStrength", type: 'byte', defaultValue: '8', description: "Horizontal strength of the bonus slash impulse (used by grant_extra_jump slash behavior)." },
      { name: "bonusRespawnSeconds", type: 'byte', defaultValue: '0', description: "0 = disabled. 1-255 = seconds until the bonus tile respawns after collection." },
      { name: "isEnabled", type: 'boolean', defaultValue: 'true', description: "Whether tile collection is active." }
    ],
  },
  {
    id: "comp_retractable_gate", name: "Retractable Gate",
    description: "Animates a door/gate by retracting its chars over time when a global trigger condition becomes true.",
    properties: [
      { name: "screenX", type: "byte", defaultValue: "0", description: "Gate area X coordinate in chars (0..31)." },
      { name: "screenY", type: "byte", defaultValue: "0", description: "Gate area Y coordinate in chars (0..23)." },
      { name: "width", type: "byte", defaultValue: "1", description: "Gate width in chars." },
      { name: "height", type: "byte", defaultValue: "2", description: "Gate height in chars." },
      { name: "direction", type: "string", defaultValue: "up", description: "Retract direction: up, down, left or right." },
      { name: "fillTileId", type: "tile_ref", defaultValue: "", description: "Tile used to fill the exposed edge. Empty removes chars." },
      { name: "triggerVariable", type: "string", defaultValue: "", description: "Global variable name or asmName that triggers the opening." },
      { name: "triggerOperator", type: "string", defaultValue: "==", description: "Comparison operator: ==, !=, >, <, >=, <=." },
      { name: "triggerValue", type: "word", defaultValue: "1", description: "Value compared against the trigger variable." },
      { name: "durationMs", type: "word", defaultValue: "2000", description: "Total opening duration in milliseconds." },
      { name: "isEnabled", type: "boolean", defaultValue: "true", description: "Whether the gate runtime is active." }
    ],
  },
  {
    id: "comp_inventory", name: "Inventory",
    description: "Stores collected items and manages inventory state.",
    properties: [
      { name: "maxItems", type: 'word', defaultValue: '255', description: "Maximum number of items that can be stored." },
      { name: "currentItemCount", type: 'word', defaultValue: '0', description: "Current number of items in inventory." },
      { name: "showCountOnScreen", type: 'boolean', defaultValue: 'true', description: "Display item count on screen." },
      { name: "countDisplayX", type: 'byte', defaultValue: '1', description: "Screen X position for count display (in character columns)." },
      { name: "countDisplayY", type: 'byte', defaultValue: '1', description: "Screen Y position for count display (in character rows)." },
      { name: "scorePerItem", type: 'word', defaultValue: '10', description: "Score points awarded per collected item." },
      { name: "totalScore", type: 'word', defaultValue: '0', description: "Total accumulated score." }
    ],
  },
  {
    id: "comp_rotate", name: "Rotate",
    description: "Allows an entity sprite to be rotated based on facing direction.",
    properties: [
      { name: "rotation", type: 'byte', defaultValue: '0', description: "Current rotation angle in degrees (0=right, 90=up, 180=left, 270=down)." },
      { name: "facingDirection", type: 'byte', defaultValue: '0', description: "Current facing direction (0=right, 1=up, 2=left, 3=down)." }
    ],
  },
  {
    id: "comp_pacMovement", name: "Pac-Man Movement",
    description: "Implements advanced Pac-Man style movement with direction intention, tile-based collision checks every 8 pixels, and pixel-perfect movement at 60fps.",
    properties: [
      { name: "speed", type: 'byte', defaultValue: '1', description: "Movement speed in pixels per frame (at 60fps)." },
      { name: "currentDirection", type: 'string', defaultValue: 'NONE', description: "Current movement direction (NONE, LEFT, RIGHT, UP, DOWN)." },
      { name: "desiredDirection", type: 'string', defaultValue: 'NONE', description: "Desired movement direction for next valid turn." },
      { name: "pixelCounter", type: 'byte', defaultValue: '0', description: "Counter for position relative to 8x8 character grid (0-7)." },
      { name: "velocityX", type: 'byte', defaultValue: '0', description: "Current horizontal velocity (-speed to +speed)." },
      { name: "velocityY", type: 'byte', defaultValue: '0', description: "Current vertical velocity (-speed to +speed)." },
      { name: "canTurnOnPixel", type: 'boolean', defaultValue: 'true', description: "Whether direction changes are allowed on current pixel." },
      { name: "stopOnWall", type: 'boolean', defaultValue: 'true', description: "Stop movement when hitting wall if no input." },
      { name: "allowReverse", type: 'boolean', defaultValue: 'true', description: "Allow immediate reverse direction without collision check." },
      { name: "tileSize", type: 'byte', defaultValue: '8', description: "Size of tiles for collision checking (8x8 for MSX)." },
      { name: "isEnabled", type: 'boolean', defaultValue: 'true', description: "Whether Pac-Man movement is active." }
    ],
  },
  {
    id: "comp_PacmanMovementV2", name: "PacmanMovementV2",
    description: "Advanced Pac-Man movement system with pixel-perfect collision detection every 8 pixels, direction intention system, and 60fps smooth movement for MSX games.",
    properties: [
      { name: "speed", type: 'byte', defaultValue: '1', description: "Movement speed in pixels per frame at 60fps" },
      { name: "currentDirection", type: 'string', defaultValue: 'NONE', description: "Current movement direction: NONE, LEFT, RIGHT, UP, DOWN" },
      { name: "desiredDirection", type: 'string', defaultValue: 'NONE', description: "Player's desired direction for next turn opportunity" },
      { name: "pixelCounter", type: 'byte', defaultValue: '0', description: "Position counter relative to 8x8 character grid (0-7)" },
      { name: "velocityX", type: 'byte', defaultValue: '0', description: "Current horizontal velocity (-speed to +speed)" },
      { name: "velocityY", type: 'byte', defaultValue: '0', description: "Current vertical velocity (-speed to +speed)" },
      { name: "canTurnOnPixel", type: 'boolean', defaultValue: 'true', description: "Whether direction changes are allowed on current pixel" },
      { name: "stopOnWall", type: 'boolean', defaultValue: 'true', description: "Stop movement when hitting wall if no input pressed" },
      { name: "allowReverse", type: 'boolean', defaultValue: 'true', description: "Allow immediate reverse direction without collision check" },
      { name: "tileSize", type: 'byte', defaultValue: '8', description: "Size of tiles for collision checking (8x8 for MSX)" },
      { name: "isEnabled", type: 'boolean', defaultValue: 'true', description: "Whether Pac-Man movement system is active" }
    ],
  },
  {
    id: "comp_PacmanRotationV2", name: "PacmanRotationV2",
    description: "Automatic sprite rotation based on Pac-Man movement direction with MSX-compatible angles.",
    properties: [
      { name: "rotation", type: 'byte', defaultValue: '0', description: "Current rotation angle: 0=right, 90=up, 180=left, 270=down" },
      { name: "facingDirection", type: 'byte', defaultValue: '0', description: "Current facing direction: 0=right, 1=up, 2=left, 3=down" },
      { name: "autoRotate", type: 'boolean', defaultValue: 'true', description: "Automatically rotate sprite based on movement direction" }
    ],
  }
];

export const DEFAULT_ENTITY_TEMPLATES: EntityTemplate[] = [
  {
    id: "tpl_player", name: "Player", icon: "👤", isPlayer: true,
    components: [
      { definitionId: "comp_pos", defaultValues: { x: 32, y: 100 } },
      { definitionId: "comp_render", defaultValues: { spriteAssetId: "placeholder_sprite_player", isVisible: true, layer: 1 } },
      { definitionId: "comp_behavior", defaultValues: { scriptAssetId: "placeholder_behavior_player_control" } },
      { definitionId: "comp_health", defaultValues: { current: 3, max: 3 } },
      { definitionId: "comp_deadly_tiles", defaultValues: {} },
      { definitionId: "comp_tile_collector", defaultValues: { collectionRadius: 8, collectibleTileIds: "dot,powerup,fruit", replacementTileId: "empty", targetVariable: "", incrementAmount: 0, flagVariable: "", flagValue: 1, bonusTileId: "", bonusReplacementTileId: "", bonusSoundId: "", bonusIsPersistent: false, bonusEntityEffect: "none", bonusEffectAmount: 1, bonusSlashStrength: 8, bonusRespawnSeconds: 0, isEnabled: true } },
      { definitionId: "comp_jump", defaultValues: { jumpPower: "384", maxJumps: "2" } },
      { definitionId: "comp_gravity", defaultValues: { strength: "80" } },
      { definitionId: "comp_animation", defaultValues: { currentAnimationName: "player_idle", animationSpeed: "8", animateOnlyWhenMoving: true } },
      { definitionId: "comp_collision", defaultValues: { hitboxWidth: 14, hitboxHeight: 15, offsetX: 1, offsetY: 1, collisionLayer: 1, collidesWith: 10 } }, // Player collision: layer 1, collides with 2 (enemies) + 8 (platforms) = 10
      { definitionId: "comp_carry", defaultValues: { offset: 0 } },
      { definitionId: "comp_player_input", defaultValues: { controllerId: 0, inputEnabled: true } },
      { definitionId: "comp_statemachine", defaultValues: { stateMachineAssetId: "", isEnabled: true } },
      { definitionId: "comp_cursors", defaultValues: { isEnabled: true, speed: 2 } }
    ],
    description: "The main player character."
  },
  {
    id: "tpl_enemy_basic", name: "Basic Enemy", icon: "👻",
    components: [
      { definitionId: "comp_pos", defaultValues: { x: 100, y: 100 } },
      { definitionId: "comp_render", defaultValues: { spriteAssetId: "placeholder_sprite_enemy", isVisible: true, layer: 1 } },
      { definitionId: "comp_ai_behavior", defaultValues: { scriptAssetId: "placeholder_behavior_patrol", patrolRangeX: 32, aggroRadius: 64 } },
      { definitionId: "comp_health", defaultValues: { current: 1, max: 1 } },
      { definitionId: "comp_gravity", defaultValues: {} },
      { definitionId: "comp_animation", defaultValues: { currentAnimationName: "enemy_walk", animationSpeed: "10" } },
      { definitionId: "comp_collision", defaultValues: { collisionLayer: 2, collidesWith: 1 } }, // Example enemy collision
      { definitionId: "comp_damage", defaultValues: { damageAmount: 1, damageType: "contact" } }
    ],
    description: "A simple enemy that patrols and deals contact damage."
  },
  {
    id: "tpl_item_key", name: "Key Item", icon: "🔑",
    components: [
      { definitionId: "comp_pos", defaultValues: { x: 50, y: 50 } },
      { definitionId: "comp_render", defaultValues: { spriteAssetId: "placeholder_sprite_key", isVisible: true, layer: 0 } },
      { definitionId: "comp_animation", defaultValues: { currentAnimationName: "key_shine", loops: true, animationSpeed: "15" } },
      { definitionId: "comp_collectible", defaultValues: { itemType: "key", itemValue: 1, autoCollectRadius: 12, collectionSoundRef: "sfx_collect_key" } }
    ],
    description: "A key item to be collected."
  },
  {
    id: "tpl_enemy_spawner", name: "Enemy Spawner", icon: "⚡",
    components: [
      { definitionId: "comp_pos", defaultValues: { x: 128, y: 64 } },
      { definitionId: "comp_render", defaultValues: { spriteAssetId: "placeholder_sprite_spawner", isVisible: false, layer: 0 } },
      {
        definitionId: "comp_spawner", defaultValues: {
          spawnRate: 2000,
          maxEntities: 3,
          spawnZoneX: 0,
          spawnZoneY: 0,
          spawnZoneWidth: 0,
          spawnZoneHeight: 0,
          entityTemplateId: "tpl_enemy_basic",
          isActive: true,
          spawnOnStart: false
        }
      }
    ],
    description: "Spawns enemies randomly across the screen."
  },
  {
    id: "tpl_player_ship", name: "Player Ship", icon: "🚀", isPlayer: true,
    components: [
      { definitionId: "comp_pos", defaultValues: { x: 120, y: 150 } },
      { definitionId: "comp_render", defaultValues: { spriteAssetId: "placeholder_sprite_player_ship", isVisible: true, layer: 1 } },
      { definitionId: "comp_physics", defaultValues: { velocityX: 0, velocityY: 0, friction: 50, mass: 1 } },
      { definitionId: "comp_health", defaultValues: { current: 3, max: 3 } },
      { definitionId: "comp_collision", defaultValues: { hitboxWidth: 12, hitboxHeight: 14, offsetX: 2, offsetY: 1, collisionLayer: 1, collidesWith: 6 } }, // Collides with enemies (2) and enemy bullets (4)
      { definitionId: "comp_player_input", defaultValues: { controllerId: 0, inputEnabled: true } },
      { definitionId: "comp_cursors", defaultValues: { isEnabled: true, speed: 3 } },
      { definitionId: "comp_aiming", defaultValues: { targetEntityTemplateId: "tpl_enemy_basic", aimingRange: 200, rotationSpeed: 0, fieldOfView: 255 } },
      { definitionId: "comp_damage", defaultValues: { damageAmount: 1, damageType: "laser", knockbackForce: 2 } }
    ],
    description: "A fast-moving player spaceship with shooting capabilities. Create your own ship sprite and assign it to this entity."
  },
  {
    id: "tpl_player_bullet", name: "Player Bullet", icon: "•",
    components: [
      { definitionId: "comp_pos", defaultValues: { x: 0, y: 0 } },
      { definitionId: "comp_render", defaultValues: { spriteAssetId: "placeholder_sprite_bullet", isVisible: true, layer: 1 } },
      { definitionId: "comp_physics", defaultValues: { velocityX: 0, velocityY: -4, friction: 0, mass: 0 } },
      { definitionId: "comp_damage", defaultValues: { damageAmount: 1, damageType: "laser", knockbackForce: 1 } },
      { definitionId: "comp_collision", defaultValues: { hitboxWidth: 4, hitboxHeight: 6, offsetX: 2, offsetY: 1, collisionLayer: 4, collidesWith: 2 } } // Bullet layer, collides with enemies
    ],
    description: "A fast-moving laser projectile fired by the player ship. Create your own bullet sprite and assign it to this entity."
  },
  {
    id: "tpl_msx_platform_player", name: "MSX Platform Player", icon: "P", isPlayer: true,
    components: [
      { definitionId: "comp_pos", defaultValues: { x: 32, y: 120 } },
      { definitionId: "comp_render", defaultValues: { spriteAssetId: "placeholder_sprite_player", isVisible: true, layer: 1 } },
      { definitionId: "comp_physics", defaultValues: { velocityX: 0, velocityY: 0, friction: 32, mass: 1 } },
      { definitionId: "comp_health", defaultValues: { current: 3, max: 3 } },
      { definitionId: "comp_collision", defaultValues: { hitboxWidth: 12, hitboxHeight: 15, offsetX: 2, offsetY: 1, collisionLayer: 1, collidesWith: 14 } },
      { definitionId: "comp_wall_collision", defaultValues: { hitboxWidth: 12, hitboxHeight: 15, offsetX: 2, offsetY: 1, tileSize: 8, stopOnCollision: true } },
      { definitionId: "comp_player_input", defaultValues: { controllerId: 0, inputEnabled: true } },
      { definitionId: "comp_cursors", defaultValues: { isEnabled: true, speed: 2, allowUp: false, allowDown: false, allowLeft: true, allowRight: true } },
      { definitionId: "comp_gravity", defaultValues: { strength: "80", terminalVelocity: "1024" } },
      { definitionId: "comp_jump", defaultValues: { jumpPower: "384", maxJumps: "1", requireKeyRelease: true } },
      { definitionId: "comp_air_control", defaultValues: { airControlMode: "full", isEnabled: true } },
      { definitionId: "comp_wall_grab", defaultValues: { grabFallSpeed: "1", climbSpeed: "1", climbStamina: "64", isEnabled: true } },
      { definitionId: "comp_wall_jump", defaultValues: { horizontalPush: "7", verticalImpulse: "1280", animationSpriteAssetId: "", slideFallSpeed: "2", lockFrames: "16", requirePressAwayFromWall: false, isEnabled: true } },
      { definitionId: "comp_deadly_tiles", defaultValues: {} },
      { definitionId: "comp_animation", defaultValues: { currentAnimationName: "player_idle", animationSpeed: "8", animateOnlyWhenMoving: true } },
      { definitionId: "comp_statemachine", defaultValues: { stateMachineAssetId: "", currentStateId: "Idle", isEnabled: true } }
    ],
    description: "Minimal MSX Screen 2 platformer player for Mario, Celeste and Metroid-style tests. Uses core movement, tile collision, health and animation components."
  },
  {
    id: "tpl_msx_topdown_player", name: "MSX Top-Down Player", icon: "T", isPlayer: true,
    components: [
      { definitionId: "comp_pos", defaultValues: { x: 32, y: 32 } },
      { definitionId: "comp_render", defaultValues: { spriteAssetId: "placeholder_sprite_collector", isVisible: true, layer: 1 } },
      { definitionId: "comp_physics", defaultValues: { velocityX: 0, velocityY: 0, friction: 0, mass: 1 } },
      { definitionId: "comp_health", defaultValues: { current: 3, max: 3 } },
      { definitionId: "comp_collision", defaultValues: { hitboxWidth: 12, hitboxHeight: 12, offsetX: 2, offsetY: 2, collisionLayer: 1, collidesWith: 2 } },
      { definitionId: "comp_wall_collision", defaultValues: { hitboxWidth: 12, hitboxHeight: 12, offsetX: 2, offsetY: 2, tileSize: 8, stopOnCollision: true } },
      { definitionId: "comp_player_input", defaultValues: { controllerId: 0, inputEnabled: true } },
      { definitionId: "comp_cursors", defaultValues: { isEnabled: true, speed: 2, allowUp: true, allowDown: true, allowLeft: true, allowRight: true } },
      { definitionId: "comp_tile_collector", defaultValues: { collectionRadius: 8, collectibleTileIds: "dot,powerup,fruit", replacementTileId: "empty", targetVariable: "", incrementAmount: 0, flagVariable: "", flagValue: 1, bonusTileId: "", bonusReplacementTileId: "", bonusSoundId: "", bonusIsPersistent: false, bonusEntityEffect: "none", bonusEffectAmount: 1, bonusSlashStrength: 8, bonusRespawnSeconds: 0, isEnabled: true } },
      { definitionId: "comp_animation", defaultValues: { currentAnimationName: "topdown_idle", animationSpeed: "8", animateOnlyWhenMoving: true } },
      { definitionId: "comp_statemachine", defaultValues: { stateMachineAssetId: "", currentStateId: "Idle", isEnabled: true } }
    ],
    description: "Minimal top-down Screen 2 player for Pac-Man, maze and adventure tests. Avoids legacy Pac-Man movement duplicates and uses Cursors plus WallCollision."
  },
  {
    id: "tpl_msx_shooter_player", name: "MSX Shooter Player", icon: "S", isPlayer: true,
    components: [
      { definitionId: "comp_pos", defaultValues: { x: 120, y: 150 } },
      { definitionId: "comp_render", defaultValues: { spriteAssetId: "placeholder_sprite_player_ship", isVisible: true, layer: 1 } },
      { definitionId: "comp_physics", defaultValues: { velocityX: 0, velocityY: 0, friction: 32, mass: 1 } },
      { definitionId: "comp_health", defaultValues: { current: 3, max: 3 } },
      { definitionId: "comp_collision", defaultValues: { hitboxWidth: 12, hitboxHeight: 14, offsetX: 2, offsetY: 1, collisionLayer: 1, collidesWith: 6 } },
      { definitionId: "comp_player_input", defaultValues: { controllerId: 0, inputEnabled: true } },
      { definitionId: "comp_cursors", defaultValues: { isEnabled: true, speed: 3, allowUp: true, allowDown: true, allowLeft: true, allowRight: true } },
      { definitionId: "comp_shoot", defaultValues: { hasAmmo: true, spriteAssetId: "placeholder_sprite_bullet", render2: "", offsetX: 0, offsetY: -8, speed: "4", aimMode: "4dir", allowDiagonals: false, velocityX: "0", velocityY: "-4", range: "128", damage: "1", cooldownMs: "250", fireKey: "Space", expireOnHit: true, anchor: "center" } },
      { definitionId: "comp_animation", defaultValues: { currentAnimationName: "ship_idle", animationSpeed: "8", animateOnlyWhenMoving: false } },
      { definitionId: "comp_statemachine", defaultValues: { stateMachineAssetId: "", currentStateId: "Idle", isEnabled: true } }
    ],
    description: "Minimal Galaga-style player with cursor movement and the ROM-facing Shoot component."
  },
  {
    id: "tpl_msx_projectile", name: "MSX Projectile", icon: "*",
    components: [
      { definitionId: "comp_pos", defaultValues: { x: 0, y: 0 } },
      { definitionId: "comp_render", defaultValues: { spriteAssetId: "placeholder_sprite_bullet", isVisible: true, layer: 1 } },
      { definitionId: "comp_physics", defaultValues: { velocityX: 0, velocityY: -4, friction: 0, mass: 0 } },
      { definitionId: "comp_damage", defaultValues: { damageAmount: 1, damageType: "projectile", knockbackForce: 1 } },
      { definitionId: "comp_collision", defaultValues: { hitboxWidth: 4, hitboxHeight: 6, offsetX: 2, offsetY: 1, collisionLayer: 4, collidesWith: 2 } },
      { definitionId: "comp_lifetime", defaultValues: { lifetimeMs: "1500" } }
    ],
    description: "Reusable projectile template for shooter and Metroid-style tests. Includes Damage, Collision and Lifetime for ROM validation."
  },
  {
    id: "tpl_msx_basic_patrol_enemy", name: "MSX Basic Patrol Enemy", icon: "E",
    components: [
      { definitionId: "comp_pos", defaultValues: { x: 96, y: 120 } },
      { definitionId: "comp_render", defaultValues: { spriteAssetId: "placeholder_sprite_enemy", isVisible: true, layer: 1 } },
      { definitionId: "comp_physics", defaultValues: { velocityX: 0, velocityY: 0, friction: 0, mass: 1 } },
      { definitionId: "comp_health", defaultValues: { current: 1, max: 1 } },
      { definitionId: "comp_collision", defaultValues: { hitboxWidth: 12, hitboxHeight: 14, offsetX: 2, offsetY: 1, collisionLayer: 2, collidesWith: 5 } },
      { definitionId: "comp_wall_collision", defaultValues: { hitboxWidth: 12, hitboxHeight: 14, offsetX: 2, offsetY: 1, tileSize: 8, stopOnCollision: true } },
      { definitionId: "comp_patrol", defaultValues: { patrolType: "Horizontal", waypoint1_x: "64", waypoint1_y: "120", waypoint2_x: "160", waypoint2_y: "120", patrolSpeed: "50", waypointPause: "0", multiScreen: false, originScreenId: "" } },
      { definitionId: "comp_damage", defaultValues: { damageAmount: 1, damageType: "contact", knockbackForce: 2 } },
      { definitionId: "comp_animation", defaultValues: { currentAnimationName: "enemy_walk", animationSpeed: "10", animateOnlyWhenMoving: true } }
    ],
    description: "Minimal enemy for platformer, Metroid and shooter collision tests. Uses Patrol, Damage, Health and WallCollision."
  },
  {
    id: "tpl_collector_player", name: "Collector Player", icon: "🔵", isPlayer: true,
    components: [
      { definitionId: "comp_pos", defaultValues: { x: 32, y: 32 } },
      { definitionId: "comp_render", defaultValues: { spriteAssetId: "placeholder_sprite_collector", isVisible: true, layer: 1 } },
      { definitionId: "comp_physics", defaultValues: { velocityX: 0, velocityY: 0, friction: 0, mass: 1 } },
      { definitionId: "comp_health", defaultValues: { current: 3, max: 3 } },
      { definitionId: "comp_collision", defaultValues: { hitboxWidth: 12, hitboxHeight: 12, offsetX: 2, offsetY: 2, collisionLayer: 1, collidesWith: 2 } },
      { definitionId: "comp_wall_collision", defaultValues: { hitboxWidth: 12, hitboxHeight: 12, offsetX: 2, offsetY: 2, tileSize: 8, stopOnCollision: true } },
      { definitionId: "comp_player_input", defaultValues: { controllerId: 0, inputEnabled: true } },
      { definitionId: "comp_cursors", defaultValues: { isEnabled: true, speed: 2 } },
      { definitionId: "comp_tile_collector", defaultValues: { collectionRadius: 8, collectibleTileIds: "dot,powerup,fruit", replacementTileId: "empty", targetVariable: "", incrementAmount: 0, flagVariable: "", flagValue: 1, bonusTileId: "", bonusReplacementTileId: "", bonusSoundId: "", bonusIsPersistent: false, bonusEntityEffect: "none", bonusEffectAmount: 1, bonusSlashStrength: 8, bonusRespawnSeconds: 0, isEnabled: true } },
      { definitionId: "comp_inventory", defaultValues: { maxItems: 255, currentItemCount: 0, showCountOnScreen: true, countDisplayX: 1, countDisplayY: 1, scorePerItem: 10, totalScore: 0 } }
    ],
    description: "A Pac-Man style player that collects items by walking over tiles. Perfect for maze-based collection games."
  },
  {
    id: "tpl_pacman_player", name: "Pac-Man Player", icon: "🟡", isPlayer: true,
    components: [
      { definitionId: "comp_pos", defaultValues: { x: 32, y: 32 } },
      { definitionId: "comp_render", defaultValues: { spriteAssetId: "placeholder_sprite_pacman", isVisible: true, layer: 1 } },
      { definitionId: "comp_health", defaultValues: { current: 3, max: 3 } },
      { definitionId: "comp_wall_collision", defaultValues: { hitboxWidth: 16, hitboxHeight: 16, offsetX: 0, offsetY: 0, tileSize: 8, stopOnCollision: true } },
      { definitionId: "comp_player_input", defaultValues: { controllerId: 0, inputEnabled: true } },
      {
        definitionId: "comp_pacMovement", defaultValues: {
          speed: 1,
          currentDirection: "NONE",
          desiredDirection: "NONE",
          pixelCounter: 0,
          velocityX: 0,
          velocityY: 0,
          canTurnOnPixel: true,
          stopOnWall: true,
          allowReverse: true,
          tileSize: 8,
          isEnabled: true
        }
      },
      { definitionId: "comp_rotate", defaultValues: { rotation: 0, facingDirection: 0 } },
      { definitionId: "comp_animation", defaultValues: { currentAnimationName: "pacman_idle", animationSpeed: "6", loops: true, isPlaying: true } }
    ],
    description: "Advanced Pac-Man player with pixel-perfect movement, 8-pixel collision checks, direction intention system, and 60fps smooth movement. Sprite size should be 16x16 pixels."
  },
  {
    id: "tpl_PacmanPlayerV2", name: "PacmanPlayerV2", icon: "🟡", isPlayer: true,
    components: [
      { definitionId: "comp_pos", defaultValues: { x: 32, y: 32 } },
      { definitionId: "comp_render", defaultValues: { spriteAssetId: "pacman_sprite_16x16", isVisible: true, layer: 1 } },
      { definitionId: "comp_health", defaultValues: { current: 3, max: 3 } },
      { definitionId: "comp_wall_collision", defaultValues: { hitboxWidth: 16, hitboxHeight: 16, offsetX: 0, offsetY: 0, tileSize: 8, stopOnCollision: true } },
      { definitionId: "comp_player_input", defaultValues: { controllerId: 0, inputEnabled: true } },
      {
        definitionId: "comp_PacmanMovementV2", defaultValues: {
          speed: 1,
          currentDirection: "NONE",
          desiredDirection: "NONE",
          pixelCounter: 0,
          velocityX: 0,
          velocityY: 0,
          canTurnOnPixel: true,
          stopOnWall: true,
          allowReverse: true,
          tileSize: 8,
          isEnabled: true
        }
      },
      { definitionId: "comp_PacmanRotationV2", defaultValues: { rotation: 0, facingDirection: 0, autoRotate: true } },
      { definitionId: "comp_animation", defaultValues: { currentAnimationName: "pacman_idle", animationSpeed: "6", loops: true, isPlaying: true } }
    ],
    description: "Advanced Pac-Man player with pixel-perfect movement, 8-pixel collision checks, direction intention system, and 60fps smooth movement. Optimized for MSX Screen 2 mode with 16x16 sprites."
  },
  {
    id: "tpl_box", name: "Box", icon: "📦",
    components: [
      { definitionId: "comp_pos", defaultValues: { x: 64, y: 64 } },
      { definitionId: "comp_render", defaultValues: { spriteAssetId: "placeholder_sprite_box", isVisible: true, layer: 1 } },
      { definitionId: "comp_box", defaultValues: { isCarriable: true } },
      {
        definitionId: "comp_collision", defaultValues: {
          hitboxWidth: 16,
          hitboxHeight: 16,
          offsetX: 0,
          offsetY: 0,
          collisionLayer: 8,  // Layer 8 = platform/wall (bit 3: 0000 1000) - entities can stand on top
          collidesWith: 255   // Collides with all layers
        }
      },
      { definitionId: "comp_gravity", defaultValues: { strength: "80", terminalVelocity: "2" } }
    ],
    description: "A movable box that acts as a solid platform. Can be picked up and carried with action key (Z)."
  },
];
