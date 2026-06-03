import { registerSkill } from './registry';
import {
  jump, gravity, airResistance, itemCollection,
  doubleJump, slash, pushBox, hitAttack, block, teleport, pickUp,
  magicBall, reverse, swim, shoot, wallBreak, grab,
} from './handlers/index';

// Register all skills on module init.
const skills = [
  jump, gravity, airResistance, itemCollection,
  doubleJump, slash, pushBox, hitAttack, block, teleport, pickUp,
  magicBall, reverse, swim, shoot, wallBreak, grab,
];
for (const skill of skills) {
  registerSkill(skill);
}

export {
  registerSkill, getSkill, getAllSkills, getCoreSkills, getOptionalSkills,
  hasSkill, clearRegistry, buildStateMachine, getTotalCycles,
} from './registry';
export type { SkillDef, StateTransition, PlayerStateMachine, PlayerState, SkillControlIcon } from './types';
export {
  jump, gravity, airResistance, itemCollection,
  doubleJump, slash, pushBox, hitAttack, block, teleport, pickUp,
  magicBall, reverse, swim, shoot, wallBreak, grab,
} from './handlers/index';

// Register all skills on module init.
// This runs once when the skills module is first imported.
const skills = [
  jump, gravity, airResistance, itemCollection,
  doubleJump, slash, pushBox, hitAttack, block, teleport, pickUp,
  magicBall, reverse, swim, shoot, wallBreak,
];
for (const skill of skills) {
  registerSkill(skill);
}

export {
  registerSkill, getSkill, getAllSkills, getCoreSkills, getOptionalSkills,
  hasSkill, clearRegistry, buildStateMachine, getTotalCycles,
} from './registry';
export type { SkillDef, StateTransition, PlayerStateMachine, PlayerState, SkillControlIcon } from './types';
export {
  jump, gravity, airResistance, itemCollection,
  doubleJump, slash, pushBox, hitAttack, block, teleport, pickUp,
  magicBall, reverse, swim, shoot, wallBreak,
} from './handlers/index';
