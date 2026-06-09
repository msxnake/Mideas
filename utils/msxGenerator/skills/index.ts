import { registerSkill } from './registry';
import {
  jump, gravity, airResistance, itemCollection,
  doubleJump, slash, pushBox, hitAttack, block, teleport, pickUp,
  magicBall, reverse, swim, shoot, wallBreak, grab, dash,
  wallJump, groundPound, airDash, chargeAttack, glide, spinAttack,
  parry, crouch, climb, highJump,
} from './handlers/index';

for (const skill of [
  jump, gravity, airResistance, itemCollection,
  doubleJump, slash, pushBox, hitAttack, block, teleport, pickUp,
  magicBall, reverse, swim, shoot, wallBreak, grab, dash,
  wallJump, groundPound, airDash, chargeAttack, glide, spinAttack,
  parry, crouch, climb, highJump,
]) {
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
  magicBall, reverse, swim, shoot, wallBreak, grab, dash,
  wallJump, groundPound, airDash, chargeAttack, glide, spinAttack,
  parry, crouch, climb, highJump,
} from './handlers/index';
