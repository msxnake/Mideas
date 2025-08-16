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
    description: "Defines the physical shape and interaction rules for an entity."
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
      { definitionId: "comp_collision", defaultValues: { hitboxWidth: 14, hitboxHeight: 15, offsetX: 1, offsetY: 1, collisionLayer: 1, collidesWith: 2 }} // Example player collision
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
];
