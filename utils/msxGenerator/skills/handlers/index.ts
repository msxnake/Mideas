import { SkillDef } from '../types';
import type { SkillParameterDef } from '../types';

// ── core (always present) ──

export const firstJumpParameters: SkillParameterDef[] = [
  {
    key: 'enabled',
    label: 'Jump enabled',
    type: 'boolean',
    default: true,
    help: 'Master switch for the first jump. When disabled, the player cannot leave the ground.',
  },
  {
    key: 'jumpPower',
    label: 'Jump power',
    type: 'number',
    default: 1024,
    min: 256,
    max: 2048,
    step: 1,
    help: 'Initial vertical impulse in 8.8 fixed point. 1024 = ~4 px/frame (~ -1 px per msx2_jump unit).',
  },
  {
    key: 'requireKeyRelease',
    label: 'Require key release between jumps',
    type: 'boolean',
    default: true,
    help: 'Player must release the jump key before triggering another jump. Prevents accidental hold-to-fly when chained with double_jump.',
  },
  {
    key: 'coyoteTime',
    label: 'Coyote time (frames)',
    type: 'number',
    default: 0,
    min: 0,
    max: 16,
    step: 1,
    help: 'Frames after leaving a platform during which the player can still jump. 0 = disabled. Typical: 4-8 frames (~67-133 ms at 60 Hz).',
  },
  {
    key: 'jumpBuffer',
    label: 'Jump buffer (frames)',
    type: 'number',
    default: 0,
    min: 0,
    max: 16,
    step: 1,
    help: 'Frames before landing during which a jump press is remembered and executed on touchdown. 0 = disabled. Typical: 4-8 frames.',
  },
];

export const jump: SkillDef = {
  id: 'jump',
  label: 'Jump',
  required: true,
  cycles: 80,
  controlIcon: 'jump',
  addsStates: ['jumping'],
  transitions: [
    { from: ['grounded', 'running'], to: 'jumping', condition: 'jump_key_pressed AND grounded' },
    { from: ['jumping'], to: 'falling', condition: 'gravity_vel > 0' },
  ],
  parameters: firstJumpParameters,
};

export const gravity: SkillDef = {
  id: 'gravity',
  label: 'Gravity 8.8 fixed point',
  required: true,
  cycles: 160,
  addsStates: ['falling'],
  transitions: [
    { from: ['jumping', 'falling'], to: 'grounded', condition: 'feet_collision AND gravity_vel >= 0' },
    { from: ['grounded', 'running'], to: 'falling', condition: 'NOT feet_collision' },
  ],
};

export const airResistance: SkillDef = {
  id: 'air_resistance',
  label: 'Air resistance / terminal velocity',
  required: true,
  cycles: 80,
  addsStates: [],
  transitions: [],
};

export const itemCollection: SkillDef = {
  id: 'item_collection',
  label: 'Auto-collect items on overlap',
  required: true,
  cycles: 80,
  addsStates: [],
  transitions: [],
};

// ── optional skills ──
// TODO (hacer proximamente): the optional skills marked
// supportedBackends: ['msx2-screen4-pattern'] below do NOT yet have a SCREEN 5
// bitmap-room (msx2-screen4-bitmap-room) generator, so the Player Config hides
// them in Screen 5 projects. When a bitmap-room generator is implemented for
// any of them, add 'msx2-screen4-bitmap-room' to its supportedBackends so it
// becomes selectable in Screen 5.


export const doubleJumpParameters: SkillParameterDef[] = [
  {
    key: 'maxJumps',
    label: 'Max jumps in air',
    type: 'number',
    default: 2,
    min: 1,
    max: 4,
    step: 1,
    help: 'Total jumps allowed before landing (1 = single jump, 2 = classic double jump, etc.).',
  },
  {
    key: 'requireKeyRelease',
    label: 'Require key release between jumps',
    type: 'boolean',
    default: true,
    help: 'Player must release the jump key before triggering the second jump. Prevents accidental hold-to-fly.',
  },
];

export const doubleJump: SkillDef = {
  id: 'double_jump',
  label: 'Second jump in mid-air',
  required: false,
  cycles: 120,
  controlIcon: 'jump',
  addsStates: ['double_jumping'],
  transitions: [
    { from: ['jumping', 'falling'], to: 'double_jumping', condition: 'jump_key_pressed AND jump_count < 2' },
    { from: ['double_jumping'], to: 'falling', condition: 'gravity_vel > 0' },
  ],
  supportedBackends: ['msx2-screen4-pattern', 'msx2-screen4-bitmap-room'],
  parameters: doubleJumpParameters,
};

export const slashParameters: SkillParameterDef[] = [
  { key: 'slashDuration', label: 'Slash active duration (frames)', type: 'number', default: 10, min: 1, max: 60, step: 1, help: 'How many frames the slash hitbox stays active.' },
  { key: 'slashCooldown', label: 'Slash cooldown (frames)', type: 'number', default: 30, min: 0, max: 120, step: 1, help: 'Frames before the next slash.' },
  { key: 'slashDamage', label: 'Damage per slash hit', type: 'number', default: 1, min: 0, max: 5, step: 1, help: 'Damage dealt to an enemy on hit.' },
  { key: 'requireKeyRelease', label: 'Require key release between slashes', type: 'boolean', default: true, help: 'Player must release the slash key before slashing again.' },
];

export const slash: SkillDef = {
  id: 'slash',
  label: 'Melee slash in facing direction',
  required: false,
  supportedBackends: ['msx2-screen4-pattern', 'msx2-screen4-bitmap-room'],
  cycles: 200,
  controlIcon: 'attack',
  addsStates: ['slashing'],
  transitions: [
    { from: ['grounded', 'running', 'jumping', 'falling'], to: 'slashing', condition: 'attack_key_pressed AND slash_cooldown = 0' },
    { from: ['slashing'], to: 'grounded', condition: 'slash_timer_expired AND grounded' },
    { from: ['slashing'], to: 'falling', condition: 'slash_timer_expired AND NOT grounded' },
  ],
  parameters: slashParameters,
};

export const pushBox: SkillDef = {
  id: 'pushBox',
  label: 'Push boxes on contact',
  required: false,
  supportedBackends: ['msx2-screen4-pattern'],
  cycles: 120,
  addsStates: ['pushing'],
  transitions: [
    { from: ['grounded', 'running'], to: 'pushing', condition: 'box_ahead AND move_key_toward_box' },
    { from: ['pushing'], to: 'grounded', condition: 'NOT box_ahead' },
    { from: ['pushing'], to: 'running', condition: 'NOT box_ahead' },
  ],
};

export const hitAttack: SkillDef = {
  id: 'hit_attack',
  label: 'Contact damage on collision',
  required: false,
  supportedBackends: ['msx2-screen4-pattern'],
  cycles: 60,
  controlIcon: 'attack',
  addsStates: [],
  transitions: [],
};

export const block: SkillDef = {
  id: 'block',
  label: 'Reduce damage while held',
  required: false,
  supportedBackends: ['msx2-screen4-pattern'],
  cycles: 60,
  controlIcon: 'attack',
  addsStates: ['blocking'],
  transitions: [
    { from: ['grounded', 'running'], to: 'blocking', condition: 'block_key_held' },
    { from: ['blocking'], to: 'grounded', condition: 'NOT block_key_held' },
  ],
};

export const teleport: SkillDef = {
  id: 'teleport',
  label: 'Teleport via portal',
  required: false,
  supportedBackends: ['msx2-screen4-pattern'],
  cycles: 300,
  addsStates: [],
  transitions: [],
};

export const pickUp: SkillDef = {
  id: 'pick_up',
  label: 'Pick up carried objects',
  required: false,
  supportedBackends: ['msx2-screen4-pattern'],
  cycles: 100,
  controlIcon: 'attack',
  addsStates: ['carrying'],
  transitions: [
    { from: ['grounded', 'running'], to: 'carrying', condition: 'pick_key_pressed AND pickup_nearby' },
    { from: ['carrying'], to: 'grounded', condition: 'drop_key_pressed OR NOT carrying' },
    { from: ['carrying'], to: 'running', condition: 'move_key_pressed AND carrying' },
  ],
};

export const magicBall: SkillDef = {
  id: 'magic_ball',
  label: 'Fire magic projectile',
  required: false,
  supportedBackends: ['msx2-screen4-pattern'],
  cycles: 250,
  controlIcon: 'attack',
  addsStates: [],
  transitions: [],
};

export const reverse: SkillDef = {
  id: 'reverse',
  label: 'Reverse movement direction',
  required: false,
  supportedBackends: ['msx2-screen4-pattern'],
  cycles: 80,
  addsStates: ['reversed'],
  transitions: [
    { from: ['grounded', 'running', 'jumping', 'falling'], to: 'reversed', condition: 'reverse_key_pressed' },
    { from: ['reversed'], to: 'falling', condition: 'gravity_dir = normal' },
  ],
};

export const swim: SkillDef = {
  id: 'swim',
  label: 'Buoyant movement in water',
  required: false,
  supportedBackends: ['msx2-screen4-pattern'],
  cycles: 180,
  controlIcon: 'jump',
  addsStates: ['swimming', 'sinking'],
  transitions: [
    { from: ['grounded', 'running', 'jumping', 'falling'], to: 'swimming', condition: 'zone = water AND swim_key_held' },
    { from: ['swimming'], to: 'sinking', condition: 'NOT swim_key_held' },
    { from: ['sinking'], to: 'swimming', condition: 'swim_key_held' },
    { from: ['swimming', 'sinking'], to: 'grounded', condition: 'zone != water AND feet_collision' },
  ],
};

export const shootParameters: SkillParameterDef[] = [
  {
    key: 'bulletSpeed',
    label: 'Bullet speed (px/frame)',
    type: 'number',
    default: 4,
    min: 1,
    max: 16,
    step: 1,
    help: 'Horizontal velocity of the bullet in pixels per frame. Typical: 3-8.',
  },
  {
    key: 'maxBullets',
    label: 'Max bullets on screen',
    type: 'number',
    default: 3,
    min: 1,
    max: 8,
    step: 1,
    help: 'Maximum simultaneous bullets allowed on screen at once. When this limit is reached, firing is blocked until one expires.',
  },
  {
    key: 'shootCooldown',
    label: 'Cooldown between shots (frames)',
    type: 'number',
    default: 10,
    min: 0,
    max: 120,
    step: 1,
    help: 'Frames to wait after firing before the next bullet can be spawned. 0 = only limited by key release.',
  },
  {
    key: 'requireKeyRelease',
    label: 'Require key release between shots',
    type: 'boolean',
    default: true,
    help: 'Player must release the fire key before firing again (one bullet per press).',
  },
  {
    key: 'bulletDamage',
    label: 'Damage per bullet hit',
    type: 'number',
    default: 1,
    min: 0,
    max: 10,
    step: 1,
    help: 'Damage dealt to an enemy on impact. 0 = harmless bullet.',
  },
];

export const shoot: SkillDef = {
  id: 'shoot',
  label: 'Fire bullet in facing direction',
  required: false,
  supportedBackends: ['msx2-screen4-pattern', 'msx2-screen4-bitmap-room'],
  cycles: 200,
  controlIcon: 'attack',
  addsStates: ['shooting'],
  transitions: [
    { from: ['grounded', 'running', 'jumping', 'falling'], to: 'shooting', condition: 'shoot_key_pressed AND shoot_cooldown = 0' },
    { from: ['shooting'], to: 'grounded', condition: 'shoot_done AND grounded' },
    { from: ['shooting'], to: 'falling', condition: 'shoot_done AND NOT grounded' },
  ],
  parameters: shootParameters,
};

export const wallBreak: SkillDef = {
  id: 'wall_break',
  label: 'Destroy breakable tiles on contact',
  required: false,
  supportedBackends: ['msx2-screen4-pattern', 'msx2-screen4-bitmap-room'],
  cycles: 150,
  controlIcon: 'attack',
  addsStates: [],
  transitions: [],
};

export const grabParameters: SkillParameterDef[] = [
  { key: 'slideSpeed', label: 'Wall slide speed (px/frame)', type: 'number', default: 1, min: 0, max: 4, step: 1, help: 'Max fall speed while clinging to a wall. 0 = frozen on wall.' },
];

export const grab: SkillDef = {
  id: 'grab',
  label: 'Wall grab and wall jump',
  required: false,
  supportedBackends: ['msx2-screen4-pattern', 'msx2-screen4-bitmap-room'],
  cycles: 180,
  controlIcon: 'jump',
  addsStates: ['grabbing'],
  transitions: [
    { from: ['jumping', 'falling'], to: 'grabbing', condition: 'wall_next_to_player AND grab_key_held' },
    { from: ['grabbing'], to: 'jumping', condition: 'jump_key_pressed' },
    { from: ['grabbing'], to: 'falling', condition: 'NOT wall_next_to_player OR NOT grab_key_held' },
  ],
  parameters: grabParameters,
};

export const dashParameters: SkillParameterDef[] = [
  {
    key: 'dashSpeed',
    label: 'Dash speed (px/frame)',
    type: 'number',
    default: 8,
    min: 2,
    max: 24,
    step: 1,
    help: 'Horizontal speed during dash in pixels per frame. Typical: 8-16.',
  },
  {
    key: 'dashDuration',
    label: 'Dash duration (frames)',
    type: 'number',
    default: 8,
    min: 3,
    max: 30,
    step: 1,
    help: 'How many frames the dash lasts. Typical: 6-12 frames.',
  },
  {
    key: 'dashCooldown',
    label: 'Dash cooldown (frames)',
    type: 'number',
    default: 30,
    min: 10,
    max: 120,
    step: 1,
    help: 'Frames before dash can be used again. Typical: 20-60.',
  },
  {
    key: 'requireKeyRelease',
    label: 'Require key release between dashes',
    type: 'boolean',
    default: true,
    help: 'Player must release the dash key before triggering another dash.',
  },
  {
    key: 'directional',
    label: 'Directional (face movement direction)',
    type: 'boolean',
    default: true,
    help: 'If true, dash follows facing direction. If false, dash goes toward movement input.',
  },
  {
    key: 'invulnerable',
    label: 'Invulnerable during dash',
    type: 'boolean',
    default: true,
    help: 'Player takes no damage during dash animation.',
  },
];

export const dash: SkillDef = {
  id: 'dash',
  label: 'Quick dash movement',
  required: false,
  cycles: 140,
  // Default binding is 'attack': sharing the jump button made every jump
  // also trigger a dash (and the dash gate swallows directional input).
  // Projects can still rebind via player.skillBindings.dash.
  controlIcon: 'attack',
  addsStates: ['dashing'],
  transitions: [
    { from: ['grounded', 'running'], to: 'dashing', condition: 'dash_key_pressed AND dash_cooldown = 0 AND grounded' },
    { from: ['dashing'], to: 'grounded', condition: 'dash_timer_expired AND grounded' },
    { from: ['dashing'], to: 'falling', condition: 'dash_timer_expired AND NOT grounded' },
  ],
  supportedBackends: ['msx2-screen4-pattern', 'msx2-screen4-bitmap-room'],
  parameters: dashParameters,
};

// ── additional optional skills ──

export const wallJumpParameters: SkillParameterDef[] = [
  {
    key: 'wallJumpVertical',
    label: 'Vertical push (px/frame)',
    type: 'number',
    default: 4,
    min: 1,
    max: 8,
    step: 1,
    help: 'Upward force of the wall jump kick in pixels per frame. When set, it overrides the legacy 8.8 Wall jump power below.',
  },
  {
    key: 'wallJumpPower',
    label: 'Wall jump power',
    type: 'number',
    default: 1024,
    min: 256,
    max: 2048,
    step: 1,
    help: 'Legacy vertical impulse in 8.8 fixed point (256-2048). Ignored when Vertical push is set.',
  },
  {
    key: 'wallJumpHorizontal',
    label: 'Horizontal push (px/frame)',
    type: 'number',
    default: 4,
    min: 1,
    max: 12,
    step: 1,
    help: 'Horizontal velocity away from wall after wall jump.',
  },
  {
    key: 'wallSlideSpeed',
    label: 'Wall slide speed (px/frame)',
    type: 'number',
    default: 1,
    min: 0,
    max: 4,
    step: 1,
    help: 'Max fall speed while clinging to wall. 0 = instant drop.',
  },
  {
    key: 'requireKeyRelease',
    label: 'Require key release between wall jumps',
    type: 'boolean',
    default: true,
    help: 'Player must release jump key before triggering another wall jump.',
  },
];

export const wallJump: SkillDef = {
  id: 'wall_jump',
  label: 'Wall jump',
  required: false,
  cycles: 100,
  controlIcon: 'jump',
  addsStates: ['wall_sliding', 'wall_jumping'],
  transitions: [
    { from: ['falling'], to: 'wall_sliding', condition: 'wall_contact AND (left_held OR right_held)' },
    { from: ['wall_sliding'], to: 'wall_jumping', condition: 'jump_key_pressed' },
    { from: ['wall_jumping'], to: 'falling', condition: 'gravity_vel > 0' },
    { from: ['wall_sliding'], to: 'falling', condition: 'NOT wall_contact OR (NOT left_held AND NOT right_held)' },
  ],
  supportedBackends: ['msx2-screen4-pattern', 'msx2-screen4-bitmap-room'],
  parameters: wallJumpParameters,
};

export const airDashParameters: SkillParameterDef[] = [
  {
    key: 'airDashSpeed',
    label: 'Air dash speed (px/frame)',
    type: 'number',
    default: 6,
    min: 2,
    max: 16,
    step: 1,
    help: 'Horizontal speed during air dash.',
  },
  {
    key: 'airDashDuration',
    label: 'Air dash duration (frames)',
    type: 'number',
    default: 6,
    min: 2,
    max: 20,
    step: 1,
    help: 'How many frames the air dash lasts.',
  },
  {
    key: 'airDashCooldown',
    label: 'Air dash cooldown (frames)',
    type: 'number',
    default: 20,
    min: 5,
    max: 60,
    step: 1,
    help: 'Frames before air dash can be used again.',
  },
  {
    key: 'requireKeyRelease',
    label: 'Require key release between air dashes',
    type: 'boolean',
    default: true,
    help: 'Player must release the air dash key before triggering another air dash.',
  },
  {
    key: 'invulnerable',
    label: 'Invulnerable during air dash',
    type: 'boolean',
    default: true,
    help: 'Player takes no damage during the air dash burst.',
  },
  {
    key: 'allowDoubleJumpCancel',
    label: 'Cancel double jump into air dash',
    type: 'boolean',
    default: false,
    help: 'If true, air dash can be triggered after a double jump (uses double jump).',
  },
];

export const airDash: SkillDef = {
  id: 'air_dash',
  label: 'Air dash',
  required: false,
  cycles: 100,
  controlIcon: 'attack',
  addsStates: ['air_dashing'],
  transitions: [
    { from: ['jumping', 'falling', 'double_jumping'], to: 'air_dashing', condition: 'dash_key_pressed AND air_dash_cooldown = 0 AND NOT grounded' },
    { from: ['air_dashing'], to: 'falling', condition: 'air_dash_timer_expired' },
  ],
  supportedBackends: ['msx2-screen4-pattern', 'msx2-screen4-bitmap-room'],
  parameters: airDashParameters,
};

export const chargeAttackParameters: SkillParameterDef[] = [
  {
    key: 'minChargeFrames',
    label: 'Min charge time (frames)',
    type: 'number',
    default: 20,
    min: 5,
    max: 60,
    step: 1,
    help: 'Minimum frames to hold before attack releases.',
  },
  {
    key: 'maxChargeFrames',
    label: 'Max charge time (frames)',
    type: 'number',
    default: 60,
    min: 20,
    max: 120,
    step: 1,
    help: 'Frames to hold for maximum charge.',
  },
  {
    key: 'chargeMultiplier',
    label: 'Max charge damage multiplier',
    type: 'number',
    default: 3,
    min: 1,
    max: 8,
    step: 1,
    help: 'Damage multiplier at full charge (1 = no bonus).',
  },
  {
    key: 'releaseOnJump',
    label: 'Release charge on jump',
    type: 'boolean',
    default: false,
    help: 'If true, releasing jump key fires the charged attack.',
  },
];

export const chargeAttack: SkillDef = {
  id: 'charge_attack',
  label: 'Charge attack',
  required: false,
  supportedBackends: ['msx2-screen4-pattern'],
  cycles: 250,
  controlIcon: 'attack',
  addsStates: ['charging', 'charged_attack'],
  transitions: [
    { from: ['grounded', 'running'], to: 'charging', condition: 'attack_key_held AND charge_cooldown = 0' },
    { from: ['charging'], to: 'charged_attack', condition: 'attack_key_released AND charge_level >= min' },
    { from: ['charged_attack'], to: 'grounded', condition: 'charged_attack_done AND grounded' },
    { from: ['charging'], to: 'grounded', condition: 'attack_key_released AND charge_level < min' },
  ],
  parameters: chargeAttackParameters,
};

export const glideParameters: SkillParameterDef[] = [
  {
    key: 'glideSpeed',
    label: 'Glide fall speed (px/frame)',
    type: 'number',
    default: 1,
    min: 0,
    max: 4,
    step: 1,
    help: 'Max vertical speed while gliding. 0 = float in place.',
  },
  {
    key: 'glideHorizontalSpeed',
    label: 'Horizontal control (px/frame)',
    type: 'number',
    default: 2,
    min: 0,
    max: 6,
    step: 1,
    help: 'Horizontal movement allowed while gliding.',
  },
  {
    key: 'glideBoostCost',
    label: 'Stamina cost per boost',
    type: 'number',
    default: 5,
    min: 0,
    max: 20,
    step: 1,
    help: 'Stamina consumed per boost. 0 = infinite glide.',
  },
];

export const glide: SkillDef = {
  id: 'glide',
  label: 'Glide',
  required: false,
  cycles: 60,
  controlIcon: 'jump',
  addsStates: ['gliding'],
  transitions: [
    { from: ['falling'], to: 'gliding', condition: 'jump_key_held AND glide_cooldown = 0 AND NOT grounded' },
    { from: ['gliding'], to: 'falling', condition: 'NOT jump_key_held OR stamina = 0' },
  ],
  supportedBackends: ['msx2-screen4-pattern', 'msx2-screen4-bitmap-room'],
  parameters: glideParameters,
};

export const spinAttackParameters: SkillParameterDef[] = [
  {
    key: 'spinDuration',
    label: 'Spin duration (frames)',
    type: 'number',
    default: 30,
    min: 10,
    max: 60,
    step: 1,
    help: 'How long the spin attack lasts.',
  },
  {
    key: 'spinDamage',
    label: 'Damage per hit',
    type: 'number',
    default: 1,
    min: 1,
    max: 5,
    step: 1,
    help: 'Damage dealt to enemies per spin hit.',
  },
  {
    key: 'spinCooldown',
    label: 'Spin cooldown (frames)',
    type: 'number',
    default: 40,
    min: 10,
    max: 120,
    step: 1,
    help: 'Frames before spin can be used again.',
  },
  {
    key: 'spinKnockback',
    label: 'Knockback force',
    type: 'number',
    default: 4,
    min: 0,
    max: 8,
    step: 1,
    help: 'How far enemies are pushed away.',
  },
];

export const spinAttack: SkillDef = {
  id: 'spin_attack',
  label: 'Spin attack',
  required: false,
  supportedBackends: ['msx2-screen4-pattern', 'msx2-screen4-bitmap-room'],
  cycles: 200,
  controlIcon: 'attack',
  addsStates: ['spinning'],
  transitions: [
    { from: ['grounded', 'running', 'jumping', 'falling'], to: 'spinning', condition: 'attack_key_pressed AND spin_cooldown = 0' },
    { from: ['spinning'], to: 'grounded', condition: 'spin_timer_expired AND grounded' },
    { from: ['spinning'], to: 'falling', condition: 'spin_timer_expired AND NOT grounded' },
  ],
  parameters: spinAttackParameters,
};

export const parryParameters: SkillParameterDef[] = [
  {
    key: 'parryWindow',
    label: 'Parry window (frames)',
    type: 'number',
    default: 8,
    min: 2,
    max: 20,
    step: 1,
    help: 'Frames during which a perfect block registers. Typical: 4-12.',
  },
  {
    key: 'parryStun',
    label: 'Enemy stun duration (frames)',
    type: 'number',
    default: 30,
    min: 10,
    max: 60,
    step: 1,
    help: 'How long enemies are stunned after being parried.',
  },
  {
    key: 'parryCooldown',
    label: 'Parry cooldown (frames)',
    type: 'number',
    default: 20,
    min: 5,
    max: 60,
    step: 1,
    help: 'Frames before parry can be used again.',
  },
  {
    key: 'parryKnockback',
    label: 'Knockback force',
    type: 'number',
    default: 6,
    min: 0,
    max: 12,
    step: 1,
    help: 'How far enemies are pushed after parry.',
  },
];

export const parry: SkillDef = {
  id: 'parry',
  label: 'Parry',
  required: false,
  supportedBackends: ['msx2-screen4-pattern'],
  cycles: 80,
  controlIcon: 'attack',
  addsStates: ['parrying'],
  transitions: [
    { from: ['grounded', 'running'], to: 'parrying', condition: 'attack_key_pressed AND parry_cooldown = 0' },
    { from: ['parrying'], to: 'grounded', condition: 'parry_window_expired OR parry_success' },
    { from: ['parrying'], to: 'blocking', condition: 'parry_miss AND block_key_held' },
  ],
  parameters: parryParameters,
};

export const crouchParameters: SkillParameterDef[] = [
  {
    key: 'crouchSpeed',
    label: 'Crouch move speed (px/frame)',
    type: 'number',
    default: 1,
    min: 0,
    max: 4,
    step: 1,
    help: 'Horizontal movement speed while crouching. 0 = immobile.',
  },
  {
    key: 'crouchHitboxHeight',
    label: 'Crouch hitbox height (pixels)',
    type: 'number',
    default: 8,
    min: 4,
    max: 12,
    step: 1,
    help: 'Height of player hitbox when crouching.',
  },
  {
    key: 'slideDistance',
    label: 'Slide distance on release (px)',
    type: 'number',
    default: 0,
    min: 0,
    max: 16,
    step: 1,
    help: 'Momentum slide when releasing crouch. 0 = no slide.',
  },
];

export const crouch: SkillDef = {
  id: 'crouch',
  label: 'Crouch',
  required: false,
  supportedBackends: ['msx2-screen4-pattern'],
  cycles: 40,
  controlIcon: 'down',
  addsStates: ['crouching', 'sliding'],
  transitions: [
    { from: ['grounded', 'running'], to: 'crouching', condition: 'down_key_held' },
    { from: ['crouching'], to: 'grounded', condition: 'NOT down_key_held' },
    { from: ['crouching'], to: 'sliding', condition: 'left_or_right_held AND slide_distance > 0' },
    { from: ['sliding'], to: 'grounded', condition: 'slide_timer_expired' },
  ],
  parameters: crouchParameters,
};

export const climbParameters: SkillParameterDef[] = [
  {
    key: 'climbSpeed',
    label: 'Climb speed (px/frame)',
    type: 'number',
    default: 2,
    min: 1,
    max: 6,
    step: 1,
    help: 'Vertical speed while climbing.',
  },
  {
    key: 'ladderDetectionRange',
    label: 'Ladder detection (pixels)',
    type: 'number',
    default: 8,
    min: 4,
    max: 16,
    step: 1,
    help: 'How far player can reach to grab a ladder.',
  },
  {
    key: 'dismountJumpBoost',
    label: 'Jump boost on dismount',
    type: 'number',
    default: 0,
    min: 0,
    max: 8,
    step: 1,
    help: 'Additional jump velocity when jumping off ladder.',
  },
];

export const climb: SkillDef = {
  id: 'climb',
  label: 'Climb ladders',
  required: false,
  supportedBackends: ['msx2-screen4-pattern'],
  cycles: 80,
  controlIcon: 'up',
  addsStates: ['climbing', 'on_ladder'],
  transitions: [
    { from: ['grounded'], to: 'on_ladder', condition: 'up_key_pressed AND ladder_nearby' },
    { from: ['on_ladder'], to: 'climbing', condition: 'up_key_held OR down_key_held' },
    { from: ['climbing'], to: 'on_ladder', condition: 'NOT up_key_held AND NOT down_key_held' },
    { from: ['on_ladder'], to: 'jumping', condition: 'jump_key_pressed' },
    { from: ['on_ladder'], to: 'grounded', condition: 'feet_collision AND grounded' },
    { from: ['climbing'], to: 'grounded', condition: 'feet_collision AND grounded' },
  ],
  parameters: climbParameters,
};

export const highJumpParameters: SkillParameterDef[] = [
  {
    key: 'highJumpPower',
    label: 'High jump power',
    type: 'number',
    default: 1536,
    min: 512,
    max: 3072,
    step: 1,
    help: 'Vertical impulse for high jump in 8.8 fixed point. 1536 = ~6 px/frame.',
  },
  {
    key: 'highJumpRequired',
    label: 'Hold time for high jump (frames)',
    type: 'number',
    default: 10,
    min: 5,
    max: 30,
    step: 1,
    help: 'Frames jump key must be held to trigger high jump.',
  },
  {
    key: 'highJumpKnockback',
    label: 'Horizontal knockback on high jump',
    type: 'number',
    default: 2,
    min: 0,
    max: 6,
    step: 1,
    help: 'Horizontal velocity added during high jump.',
  },
];

export const highJump: SkillDef = {
  id: 'high_jump',
  label: 'High jump',
  required: false,
  supportedBackends: ['msx2-screen4-pattern', 'msx2-screen4-bitmap-room'],
  cycles: 100,
  controlIcon: 'jump',
  addsStates: ['high_jumping'],
  transitions: [
    { from: ['grounded', 'running'], to: 'high_jumping', condition: 'jump_key_pressed AND jump_hold_frames >= required' },
    { from: ['jumping'], to: 'high_jumping', condition: 'jump_key_held AND jump_hold_frames >= required AND NOT grounded' },
    { from: ['high_jumping'], to: 'falling', condition: 'gravity_vel > 0' },
  ],
  parameters: highJumpParameters,
};

export const collectorGemsParameters: SkillParameterDef[] = [
  {
    key: 'gemValue',
    label: 'Points per gem',
    type: 'number',
    default: 100,
    min: 1,
    max: 1000,
    step: 10,
    help: 'Score points awarded for each gem collected.',
  },
  {
    key: 'gemRespawn',
    label: 'Respawn time (frames)',
    type: 'number',
    default: 0,
    min: 0,
    max: 3600,
    step: 60,
    help: 'Frames before gem respawns. 0 = no respawn.',
  },
  {
    key: 'gemType',
    label: 'Gem type',
    type: 'number',
    default: 0,
    min: 0,
    max: 3,
    step: 1,
    help: '0=All, 1=Red, 2=Blue, 3=Green gems.',
  },
  {
    key: 'collectSound',
    label: 'Play collect sound',
    type: 'boolean',
    default: true,
    help: 'Play sound effect when gem is collected.',
  },
];

export const collectorGems: SkillDef = {
  id: 'collector_gems',
  label: 'Collector Gems',
  required: false,
  cycles: 60,
  controlIcon: 'attack',
  addsStates: [],
  transitions: [],
  supportedBackends: ['msx2-screen4-pattern'],
  parameters: collectorGemsParameters,
};

export const collectorItemsParameters: SkillParameterDef[] = [
  {
    key: 'itemTypes',
    label: 'Item types collected',
    type: 'number',
    default: 7,
    min: 1,
    max: 31,
    step: 1,
    help: 'Bitmask: 1=Coins, 2=Keys, 4=Potions, 8=Gems, 16=Scrolls.',
  },
  {
    key: 'coinValue',
    label: 'Coin value',
    type: 'number',
    default: 10,
    min: 1,
    max: 100,
    step: 1,
    help: 'Points per coin collected.',
  },
  {
    key: 'maxCoins',
    label: 'Max coins stored',
    type: 'number',
    default: 99,
    min: 1,
    max: 999,
    step: 1,
    help: 'Maximum coins that can be stored.',
  },
  {
    key: 'keyRequired',
    label: 'Key opens doors',
    type: 'boolean',
    default: true,
    help: 'Collected keys are used to open locked doors.',
  },
];

export const collectorItems: SkillDef = {
  id: 'collector_items',
  label: 'Collector Items',
  required: false,
  supportedBackends: ['msx2-screen4-pattern'],
  cycles: 80,
  controlIcon: 'attack',
  addsStates: [],
  transitions: [],
  parameters: collectorItemsParameters,
};

export const pushWallParameters: SkillParameterDef[] = [
  {
    key: 'pushSpeed',
    label: 'Push speed (px/frame)',
    type: 'number',
    default: 1,
    min: 1,
    max: 4,
    step: 1,
    help: 'How fast the wall moves when pushed.',
  },
  {
    key: 'pushResistance',
    label: 'Push resistance (frames)',
    type: 'number',
    default: 5,
    min: 1,
    max: 20,
    step: 1,
    help: 'Frames required to start pushing the wall.',
  },
  {
    key: 'maxPushDistance',
    label: 'Max push distance (tiles)',
    type: 'number',
    default: 3,
    min: 1,
    max: 8,
    step: 1,
    help: 'Maximum tiles the wall can be pushed.',
  },
  {
    key: 'wallType',
    label: 'Wall type',
    type: 'number',
    default: 0,
    min: 0,
    max: 2,
    step: 1,
    help: '0=All pushable walls, 1=Crates only, 2=Boulders only.',
  },
];

export const pushWall: SkillDef = {
  id: 'push_wall',
  label: 'Push Wall',
  required: false,
  supportedBackends: ['msx2-screen4-pattern'],
  cycles: 120,
  controlIcon: 'right',
  addsStates: ['pushing'],
  transitions: [
    { from: ['grounded', 'running'], to: 'pushing', condition: 'move_key_toward_pushable AND pushable_ahead' },
    { from: ['pushing'], to: 'grounded', condition: 'NOT pushable_ahead OR push_distance >= max' },
    { from: ['pushing'], to: 'running', condition: 'NOT move_key_toward_pushable' },
  ],
  parameters: pushWallParameters,
};

export const pushDoorParameters: SkillParameterDef[] = [
  {
    key: 'doorType',
    label: 'Door type',
    type: 'number',
    default: 0,
    min: 0,
    max: 3,
    step: 1,
    help: '0=All doors, 1=Wooden, 2=Iron, 3=Locked.',
  },
  {
    key: 'openSpeed',
    label: 'Open speed (frames)',
    type: 'number',
    default: 20,
    min: 5,
    max: 60,
    step: 1,
    help: 'Frames to fully open the door.',
  },
  {
    key: 'requiresKey',
    label: 'Requires key to open',
    type: 'boolean',
    default: false,
    help: 'If true, player must have a key to open locked doors.',
  },
  {
    key: 'keyConsumed',
    label: 'Key is consumed on use',
    type: 'boolean',
    default: true,
    help: 'If true, key is used up when opening door.',
  },
];

export const pushDoor: SkillDef = {
  id: 'push_door',
  label: 'Push Door',
  required: false,
  supportedBackends: ['msx2-screen4-pattern'],
  cycles: 100,
  controlIcon: 'up',
  addsStates: ['opening_door'],
  transitions: [
    { from: ['grounded', 'running'], to: 'opening_door', condition: 'up_key_toward_door AND door_ahead' },
    { from: ['opening_door'], to: 'grounded', condition: 'door_open_complete' },
    { from: ['opening_door'], to: 'grounded', condition: 'door_locked AND NOT has_key' },
  ],
  parameters: pushDoorParameters,
};

export const carryObjectParameters: SkillParameterDef[] = [
  {
    key: 'carrySpeed',
    label: 'Carry speed (px/frame)',
    type: 'number',
    default: 1,
    min: 0,
    max: 4,
    step: 1,
    help: 'Movement speed while carrying. 0 = immobile while carrying.',
  },
  {
    key: 'throwPower',
    label: 'Throw power (px/frame)',
    type: 'number',
    default: 8,
    min: 2,
    max: 16,
    step: 1,
    help: 'Horizontal velocity when throwing the object.',
  },
  {
    key: 'throwVertical',
    label: 'Throw vertical (px/frame)',
    type: 'number',
    default: 4,
    min: 0,
    max: 12,
    step: 1,
    help: 'Vertical velocity when throwing upward.',
  },
  {
    key: 'throwCooldown',
    label: 'Throw cooldown (frames)',
    type: 'number',
    default: 20,
    min: 5,
    max: 60,
    step: 1,
    help: 'Frames before you can pick up another object.',
  },
  {
    key: 'objectTypes',
    label: 'Object types',
    type: 'number',
    default: 1,
    min: 1,
    max: 15,
    step: 1,
    help: 'Bitmask: 1=Crates, 2=Boulders, 4=Barrels, 8=Power-ups.',
  },
];

export const carryObject: SkillDef = {
  id: 'carry_object',
  label: 'Carry Object',
  required: false,
  cycles: 80,
  controlIcon: 'attack',
  addsStates: ['carrying', 'throwing'],
  transitions: [
    { from: ['grounded', 'running'], to: 'carrying', condition: 'pick_key_pressed AND object_nearby' },
    { from: ['carrying'], to: 'throwing', condition: 'attack_key_pressed' },
    { from: ['carrying'], to: 'grounded', condition: 'drop_key_pressed' },
    { from: ['throwing'], to: 'grounded', condition: 'throw_complete AND grounded' },
    { from: ['throwing'], to: 'falling', condition: 'throw_complete AND NOT grounded' },
  ],
  supportedBackends: ['msx2-screen4-pattern'],
  parameters: carryObjectParameters,
};

export const teleportABParameters: SkillParameterDef[] = [
  {
    key: 'teleportCooldown',
    label: 'Teleport cooldown (frames)',
    type: 'number',
    default: 60,
    min: 10,
    max: 180,
    step: 5,
    help: 'Frames before teleport can be used again.',
  },
  {
    key: 'teleportDelay',
    label: 'Teleport delay (frames)',
    type: 'number',
    default: 15,
    min: 5,
    max: 60,
    step: 1,
    help: 'Frames of invulnerability during teleport.',
  },
  {
    key: 'savePointA',
    label: 'Save point A on trigger',
    type: 'boolean',
    default: true,
    help: 'Save current position as Point A when pressing the button.',
  },
  {
    key: 'useHorizontal',
    label: 'Allow horizontal teleport',
    type: 'boolean',
    default: true,
    help: 'If true, can teleport to a point on the same level.',
  },
  {
    key: 'useVertical',
    label: 'Allow vertical teleport',
    type: 'boolean',
    default: true,
    help: 'If true, can teleport to a point on a different vertical level.',
  },
  {
    key: 'maxDistance',
    label: 'Max distance (tiles)',
    type: 'number',
    default: 10,
    min: 1,
    max: 50,
    step: 1,
    help: 'Maximum distance between points A and B in tiles.',
  },
];

export const teleportAB: SkillDef = {
  id: 'teleport_a_b',
  label: 'Teleport A-B',
  required: false,
  cycles: 200,
  controlIcon: 'attack',
  addsStates: ['teleporting'],
  transitions: [
    { from: ['grounded', 'running', 'jumping', 'falling'], to: 'teleporting', condition: 'teleport_key_pressed AND teleport_cooldown = 0' },
    { from: ['teleporting'], to: 'grounded', condition: 'teleport_complete AND grounded' },
    { from: ['teleporting'], to: 'falling', condition: 'teleport_complete AND NOT grounded' },
  ],
  supportedBackends: ['msx2-screen4-pattern', 'msx2-screen4-bitmap-room'],
  parameters: teleportABParameters,
};

export const carryAndThrowParameters: SkillParameterDef[] = [
  {
    key: 'liftStrength',
    label: 'Lift strength',
    type: 'number',
    default: 1024,
    min: 256,
    max: 2048,
    step: 128,
    help: 'Force required to lift heavy objects in 8.8 fixed point.',
  },
  {
    key: 'throwDistance',
    label: 'Throw distance (tiles)',
    type: 'number',
    default: 5,
    min: 1,
    max: 20,
    step: 1,
    help: 'How far the object travels when thrown.',
  },
  {
    key: 'throwTrajectory',
    label: 'Throw trajectory',
    type: 'number',
    default: 0,
    min: 0,
    max: 1,
    step: 1,
    help: '0=Linear, 1=Parabolic arc.',
  },
  {
    key: 'throwSpeed',
    label: 'Throw speed (px/frame)',
    type: 'number',
    default: 12,
    min: 4,
    max: 24,
    step: 1,
    help: 'Horizontal velocity of thrown object.',
  },
  {
    key: 'objectCollision',
    label: 'Object has collision',
    type: 'boolean',
    default: true,
    help: 'If true, thrown object collides with walls and platforms.',
  },
  {
    key: 'enemyCollision',
    label: 'Object damages enemies',
    type: 'boolean',
    default: true,
    help: 'If true, thrown object damages enemies on contact.',
  },
  {
    key: 'dropOnGround',
    label: 'Drop on ground contact',
    type: 'boolean',
    default: true,
    help: 'If true, object drops when hitting ground instead of stopping.',
  },
  {
    key: 'throwCooldown',
    label: 'Throw cooldown (frames)',
    type: 'number',
    default: 30,
    min: 10,
    max: 120,
    step: 5,
    help: 'Frames before you can throw another object.',
  },
];

export const carryAndThrow: SkillDef = {
  id: 'carry_and_throw',
  label: 'Carry & Throw Through',
  required: false,
  supportedBackends: ['msx2-screen4-pattern'],
  cycles: 100,
  controlIcon: 'attack',
  addsStates: ['lifting', 'carrying_throw', 'throwing'],
  transitions: [
    { from: ['grounded', 'running'], to: 'lifting', condition: 'pick_key_pressed AND heavy_object_nearby' },
    { from: ['lifting'], to: 'carrying_throw', condition: 'lift_complete' },
    { from: ['carrying_throw'], to: 'throwing', condition: 'attack_key_pressed' },
    { from: ['carrying_throw'], to: 'grounded', condition: 'drop_key_pressed' },
    { from: ['throwing'], to: 'grounded', condition: 'throw_complete AND grounded' },
    { from: ['throwing'], to: 'falling', condition: 'throw_complete AND NOT grounded' },
  ],
  parameters: carryAndThrowParameters,
};

export const powerStompParameters: SkillParameterDef[] = [
  {
    key: 'stompSpeed',
    label: 'Stomp speed (px/frame)',
    type: 'number',
    default: 16,
    min: 4,
    max: 32,
    step: 1,
    help: 'Fall speed when stomping.',
  },
  {
    key: 'stompDamage',
    label: 'Stomp damage',
    type: 'number',
    default: 2,
    min: 0,
    max: 10,
    step: 1,
    help: 'Damage dealt to enemies on impact. 0 = no damage.',
  },
  {
    key: 'breakTiles',
    label: 'Break tiles on impact',
    type: 'boolean',
    default: true,
    help: 'If true, certain tiles break when stomped.',
  },
  {
    key: 'breakableTiles',
    label: 'Breakable tile types',
    type: 'number',
    default: 7,
    min: 1,
    max: 255,
    step: 1,
    help: 'Bitmask of tile IDs that can be broken (1=brittle, 2=wood, 4=glass).',
  },
  {
    key: 'impactRadius',
    label: 'Impact radius (tiles)',
    type: 'number',
    default: 1,
    min: 1,
    max: 4,
    step: 1,
    help: 'Radius of stomp impact in tiles.',
  },
  {
    key: 'stompCooldown',
    label: 'Stomp cooldown (frames)',
    type: 'number',
    default: 30,
    min: 10,
    max: 120,
    step: 5,
    help: 'Frames before stomp can be used again.',
  },
  {
    key: 'chargeRequired',
    label: 'Requires charge in air',
    type: 'boolean',
    default: false,
    help: 'If true, must hold down in air before stomp activates.',
  },
  {
    key: 'ricochetOnMiss',
    label: 'Ricochet if no enemy hit',
    type: 'boolean',
    default: false,
    help: 'If true, player bounces off ground if no enemy was hit.',
  },
  {
    key: 'screenShake',
    label: 'Screen shake on impact (VDP)',
    type: 'boolean',
    default: true,
    help: 'Shake the whole SCREEN 4 display (V9938 R#18) when the stomp hits the ground.',
  },
];

export const powerStomp: SkillDef = {
  id: 'power_stomp',
  label: 'Power Stomp',
  required: false,
  cycles: 120,
  controlIcon: ['down', 'attack'],
  addsStates: ['stomp_charging', 'stomp_falling', 'stomp_impact'],
  transitions: [
    { from: ['jumping', 'falling'], to: 'stomp_charging', condition: 'down_key_held AND stomp_cooldown = 0 AND NOT grounded' },
    { from: ['stomp_charging'], to: 'stomp_falling', condition: 'down_key_released OR charge_complete' },
    { from: ['stomp_falling'], to: 'stomp_impact', condition: 'feet_collision' },
    { from: ['stomp_impact'], to: 'grounded', condition: 'impact_complete AND grounded' },
    { from: ['stomp_impact'], to: 'falling', condition: 'impact_complete AND NOT grounded AND ricochet_on_miss' },
  ],
  supportedBackends: ['msx2-screen4-pattern', 'msx2-screen4-bitmap-room'],
  parameters: powerStompParameters,
};
