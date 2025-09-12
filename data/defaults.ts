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
    id: "comp_render", name: "Renderable", 
    properties: [
      { name: "spriteAssetId", type: "sprite_ref", defaultValue: "", description: "ID of the sprite asset to render" },
      { name: "isVisible", type: "boolean", defaultValue: "true", description: "Whether the entity is currently visible" },
      { name: "layer", type: "byte", defaultValue: "1", description: "Render layer (0=bg, 1=main, 2=fg)"}
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
    id: "comp_jump", name: "Jump",
    description: "Manages jumping behavior for an entity.",
    properties: [
      { name: "jumpPower", type: "word", defaultValue: "256", description: "Initial upward velocity or force." },
      { name: "maxJumps", type: "byte", defaultValue: "1", description: "Number of jumps allowed before landing." },
      { name: "currentJumpCount", type: "byte", defaultValue: "0", description: "Current jump count." },
      { name: "isJumping", type: "boolean", defaultValue: "false", description: "Is the entity currently jumping?" },
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
      { name: "collidesWith", type: "byte", defaultValue: "255", description: "Bitmask defining which layers this entity can collide with." }
    ],
    description: "Defines the physical shape and interaction rules for entity-to-entity collisions."
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
      { name: "waypointPause", type: 'word', defaultValue: '0', description: "Pause duration in ticks at each waypoint." }
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
    description: "Marks an entity as player-controllable with cursor/arrow keys.",
    properties: [
      { name: "isEnabled", type: 'boolean', defaultValue: 'true', description: "Whether cursor control is active." },
      { name: "speed", type: 'byte', defaultValue: '2', description: "Movement speed in pixels per frame." }
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
      { name: "isEnabled", type: 'boolean', defaultValue: 'true', description: "Whether tile collection is active." }
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
    id: "tpl_player", name: "Player", icon: "👤", 
    components: [ 
      { definitionId: "comp_pos", defaultValues: {x: 32, y: 100}}, 
      { definitionId: "comp_render", defaultValues: { spriteAssetId: "placeholder_sprite_player", isVisible: true, layer: 1 } }, 
      { definitionId: "comp_behavior", defaultValues: { scriptAssetId: "placeholder_behavior_player_control"} },
      { definitionId: "comp_health", defaultValues: { current: 3, max: 3 } },
      { definitionId: "comp_jump", defaultValues: { jumpPower: "384", maxJumps: "2" } }, 
      { definitionId: "comp_gravity", defaultValues: { strength: "80" } },
      { definitionId: "comp_animation", defaultValues: { currentAnimationName: "player_idle", animationSpeed: "8" } },
      { definitionId: "comp_collision", defaultValues: { hitboxWidth: 14, hitboxHeight: 15, offsetX: 1, offsetY: 1, collisionLayer: 1, collidesWith: 2 }}, // Example player collision
      { definitionId: "comp_player_input", defaultValues: { controllerId: 0, inputEnabled: true }},
      { definitionId: "comp_statemachine", defaultValues: { stateMachineAssetId: "", isEnabled: true }},
      { definitionId: "comp_cursors", defaultValues: { isEnabled: true, speed: 2 }}
    ],
    description: "The main player character."
  },
  { 
    id: "tpl_enemy_basic", name: "Basic Enemy", icon: "👻", 
    components: [ 
      { definitionId: "comp_pos", defaultValues: {x: 100, y: 100}}, 
      { definitionId: "comp_render", defaultValues: { spriteAssetId: "placeholder_sprite_enemy", isVisible: true, layer: 1 } }, 
      { definitionId: "comp_ai_behavior", defaultValues: { scriptAssetId: "placeholder_behavior_patrol", patrolRangeX: 32, aggroRadius: 64 } },
      { definitionId: "comp_health", defaultValues: { current: 1, max: 1 } },
      { definitionId: "comp_gravity", defaultValues: {} }, 
      { definitionId: "comp_animation", defaultValues: { currentAnimationName: "enemy_walk", animationSpeed: "10" } },
      { definitionId: "comp_collision", defaultValues: { collisionLayer: 2, collidesWith: 1 }}, // Example enemy collision
      { definitionId: "comp_damage", defaultValues: { damageAmount: 1, damageType: "contact"}}
    ],
    description: "A simple enemy that patrols and deals contact damage."
  },
  { 
    id: "tpl_item_key", name: "Key Item", icon: "🔑", 
    components: [ 
      { definitionId: "comp_pos", defaultValues: {x: 50,y: 50}}, 
      { definitionId: "comp_render", defaultValues: { spriteAssetId: "placeholder_sprite_key", isVisible: true, layer: 0 } },
      { definitionId: "comp_animation", defaultValues: { currentAnimationName: "key_shine", loops: true, animationSpeed: "15" } },
      { definitionId: "comp_collectible", defaultValues: { itemType: "key", itemValue: 1, autoCollectRadius: 12, collectionSoundRef: "sfx_collect_key" }}
    ],
    description: "A key item to be collected."
  },
  { 
    id: "tpl_enemy_spawner", name: "Enemy Spawner", icon: "⚡", 
    components: [ 
      { definitionId: "comp_pos", defaultValues: {x: 128, y: 64}}, 
      { definitionId: "comp_render", defaultValues: { spriteAssetId: "placeholder_sprite_spawner", isVisible: false, layer: 0 } },
      { definitionId: "comp_spawner", defaultValues: { 
        spawnRate: 2000, 
        maxEntities: 3, 
        spawnZoneX: 0, 
        spawnZoneY: 0, 
        spawnZoneWidth: 0, 
        spawnZoneHeight: 0,
        entityTemplateId: "tpl_enemy_basic",
        isActive: true,
        spawnOnStart: false
      }}
    ],
    description: "Spawns enemies randomly across the screen."
  },
  {
    id: "tpl_player_ship", name: "Player Ship", icon: "🚀",
    components: [
      { definitionId: "comp_pos", defaultValues: {x: 120, y: 150}}, 
      { definitionId: "comp_render", defaultValues: { spriteAssetId: "placeholder_sprite_player_ship", isVisible: true, layer: 1 }},
      { definitionId: "comp_physics", defaultValues: { velocityX: 0, velocityY: 0, friction: 50, mass: 1 }},
      { definitionId: "comp_health", defaultValues: { current: 3, max: 3 }},
      { definitionId: "comp_collision", defaultValues: { hitboxWidth: 12, hitboxHeight: 14, offsetX: 2, offsetY: 1, collisionLayer: 1, collidesWith: 6 }}, // Collides with enemies (2) and enemy bullets (4)
      { definitionId: "comp_player_input", defaultValues: { controllerId: 0, inputEnabled: true }},
      { definitionId: "comp_cursors", defaultValues: { isEnabled: true, speed: 3 }},
      { definitionId: "comp_aiming", defaultValues: { targetEntityTemplateId: "tpl_enemy_basic", aimingRange: 200, rotationSpeed: 0, fieldOfView: 255 }},
      { definitionId: "comp_damage", defaultValues: { damageAmount: 1, damageType: "laser", knockbackForce: 2 }}
    ],
    description: "A fast-moving player spaceship with shooting capabilities. Create your own ship sprite and assign it to this entity."
  },
  {
    id: "tpl_player_bullet", name: "Player Bullet", icon: "•",
    components: [
      { definitionId: "comp_pos", defaultValues: {x: 0, y: 0}},
      { definitionId: "comp_render", defaultValues: { spriteAssetId: "placeholder_sprite_bullet", isVisible: true, layer: 1 }},
      { definitionId: "comp_physics", defaultValues: { velocityX: 0, velocityY: -4, friction: 0, mass: 0 }},
      { definitionId: "comp_damage", defaultValues: { damageAmount: 1, damageType: "laser", knockbackForce: 1 }},
      { definitionId: "comp_collision", defaultValues: { hitboxWidth: 4, hitboxHeight: 6, offsetX: 2, offsetY: 1, collisionLayer: 4, collidesWith: 2 }} // Bullet layer, collides with enemies
    ],
    description: "A fast-moving laser projectile fired by the player ship. Create your own bullet sprite and assign it to this entity."
  },
  {
    id: "tpl_collector_player", name: "Collector Player", icon: "🔵",
    components: [
      { definitionId: "comp_pos", defaultValues: {x: 32, y: 32}}, 
      { definitionId: "comp_render", defaultValues: { spriteAssetId: "placeholder_sprite_collector", isVisible: true, layer: 1 }},
      { definitionId: "comp_physics", defaultValues: { velocityX: 0, velocityY: 0, friction: 0, mass: 1 }},
      { definitionId: "comp_health", defaultValues: { current: 3, max: 3 }},
      { definitionId: "comp_collision", defaultValues: { hitboxWidth: 12, hitboxHeight: 12, offsetX: 2, offsetY: 2, collisionLayer: 1, collidesWith: 2 }},
      { definitionId: "comp_wall_collision", defaultValues: { hitboxWidth: 12, hitboxHeight: 12, offsetX: 2, offsetY: 2, tileSize: 8, stopOnCollision: true }},
      { definitionId: "comp_player_input", defaultValues: { controllerId: 0, inputEnabled: true }},
      { definitionId: "comp_cursors", defaultValues: { isEnabled: true, speed: 2 }},
      { definitionId: "comp_tile_collector", defaultValues: { collectionRadius: 8, collectibleTileIds: "dot,powerup,fruit", replacementTileId: "empty", isEnabled: true }},
      { definitionId: "comp_inventory", defaultValues: { maxItems: 255, currentItemCount: 0, showCountOnScreen: true, countDisplayX: 1, countDisplayY: 1, scorePerItem: 10, totalScore: 0 }}
    ],
    description: "A Pac-Man style player that collects items by walking over tiles. Perfect for maze-based collection games."
  },
  {
    id: "tpl_pacman_player", name: "Pac-Man Player", icon: "🟡",
    components: [
      { definitionId: "comp_pos", defaultValues: {x: 32, y: 32}}, 
      { definitionId: "comp_render", defaultValues: { spriteAssetId: "placeholder_sprite_pacman", isVisible: true, layer: 1 }},
      { definitionId: "comp_health", defaultValues: { current: 3, max: 3 }},
      { definitionId: "comp_wall_collision", defaultValues: { hitboxWidth: 16, hitboxHeight: 16, offsetX: 0, offsetY: 0, tileSize: 8, stopOnCollision: true }},
      { definitionId: "comp_player_input", defaultValues: { controllerId: 0, inputEnabled: true }},
      { definitionId: "comp_pacMovement", defaultValues: { 
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
      }},
      { definitionId: "comp_rotate", defaultValues: { rotation: 0, facingDirection: 0 }},
      { definitionId: "comp_animation", defaultValues: { currentAnimationName: "pacman_idle", animationSpeed: "6", loops: true, isPlaying: true }}
    ],
    description: "Advanced Pac-Man player with pixel-perfect movement, 8-pixel collision checks, direction intention system, and 60fps smooth movement. Sprite size should be 16x16 pixels."
  },
  {
    id: "tpl_PacmanPlayerV2", name: "PacmanPlayerV2", icon: "🟡",
    components: [
      { definitionId: "comp_pos", defaultValues: {x: 32, y: 32}}, 
      { definitionId: "comp_render", defaultValues: { spriteAssetId: "pacman_sprite_16x16", isVisible: true, layer: 1 }},
      { definitionId: "comp_health", defaultValues: { current: 3, max: 3 }},
      { definitionId: "comp_wall_collision", defaultValues: { hitboxWidth: 16, hitboxHeight: 16, offsetX: 0, offsetY: 0, tileSize: 8, stopOnCollision: true }},
      { definitionId: "comp_player_input", defaultValues: { controllerId: 0, inputEnabled: true }},
      { definitionId: "comp_PacmanMovementV2", defaultValues: { 
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
      }},
      { definitionId: "comp_PacmanRotationV2", defaultValues: { rotation: 0, facingDirection: 0, autoRotate: true }},
      { definitionId: "comp_animation", defaultValues: { currentAnimationName: "pacman_idle", animationSpeed: "6", loops: true, isPlaying: true }}
    ],
    description: "Advanced Pac-Man player with pixel-perfect movement, 8-pixel collision checks, direction intention system, and 60fps smooth movement. Optimized for MSX Screen 2 mode with 16x16 sprites."
  },
];
