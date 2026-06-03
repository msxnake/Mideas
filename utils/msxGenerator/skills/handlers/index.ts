import { SkillDef } from '../types';

// ── core (always present) ──

export const jump: SkillDef = {
  id: 'jump',
  label: 'Base jump',
  required: true,
  cycles: 80,
  controlIcon: 'jump',
  addsStates: ['jumping'],
  transitions: [
    { from: ['grounded', 'running'], to: 'jumping', condition: 'jump_key_pressed AND grounded' },
    { from: ['jumping'], to: 'falling', condition: 'gravity_vel > 0' },
  ],
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
