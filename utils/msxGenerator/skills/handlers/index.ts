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
  parameters: doubleJumpParameters,
};

export const slash: SkillDef = {
  id: 'slash',
  label: 'Melee slash in facing direction',
  required: false,
  cycles: 200,
  controlIcon: 'attack',
  addsStates: ['slashing'],
  transitions: [
    { from: ['grounded', 'running', 'jumping', 'falling'], to: 'slashing', condition: 'attack_key_pressed AND slash_cooldown = 0' },
    { from: ['slashing'], to: 'grounded', condition: 'slash_timer_expired AND grounded' },
    { from: ['slashing'], to: 'falling', condition: 'slash_timer_expired AND NOT grounded' },
  ],
};

export const pushBox: SkillDef = {
  id: 'pushBox',
  label: 'Push boxes on contact',
  required: false,
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
  cycles: 60,
  controlIcon: 'attack',
  addsStates: [],
  transitions: [],
};

export const block: SkillDef = {
  id: 'block',
  label: 'Reduce damage while held',
  required: false,
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
  cycles: 300,
  addsStates: [],
  transitions: [],
};

export const pickUp: SkillDef = {
  id: 'pick_up',
  label: 'Pick up carried objects',
  required: false,
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
  cycles: 250,
  controlIcon: 'attack',
  addsStates: [],
  transitions: [],
};

export const reverse: SkillDef = {
  id: 'reverse',
  label: 'Reverse movement direction',
  required: false,
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

export const shoot: SkillDef = {
  id: 'shoot',
  label: 'Fire bullet in facing direction',
  required: false,
  cycles: 200,
  controlIcon: 'attack',
  addsStates: ['shooting'],
  transitions: [
    { from: ['grounded', 'running', 'jumping', 'falling'], to: 'shooting', condition: 'shoot_key_pressed AND shoot_cooldown = 0' },
    { from: ['shooting'], to: 'grounded', condition: 'shoot_done AND grounded' },
    { from: ['shooting'], to: 'falling', condition: 'shoot_done AND NOT grounded' },
  ],
};

export const wallBreak: SkillDef = {
  id: 'wall_break',
  label: 'Destroy breakable tiles on contact',
  required: false,
  cycles: 150,
  controlIcon: 'attack',
  addsStates: [],
  transitions: [],
};

export const grab: SkillDef = {
  id: 'grab',
  label: 'Wall grab and wall jump',
  required: false,
  cycles: 180,
  controlIcon: 'jump',
  addsStates: ['grabbing'],
  transitions: [
    { from: ['jumping', 'falling'], to: 'grabbing', condition: 'wall_next_to_player AND grab_key_held' },
    { from: ['grabbing'], to: 'jumping', condition: 'jump_key_pressed' },
    { from: ['grabbing'], to: 'falling', condition: 'NOT wall_next_to_player OR NOT grab_key_held' },
  ],
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
  controlIcon: 'jump',
  addsStates: ['dashing'],
  transitions: [
    { from: ['grounded', 'running', 'jumping', 'falling'], to: 'dashing', condition: 'dash_key_pressed AND dash_cooldown = 0' },
    { from: ['dashing'], to: 'grounded', condition: 'dash_timer_expired AND grounded' },
    { from: ['dashing'], to: 'falling', condition: 'dash_timer_expired AND NOT grounded' },
  ],
  parameters: dashParameters,
};
