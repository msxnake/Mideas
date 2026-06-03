export {
  registerSkill, getSkill, getAllSkills, getCoreSkills, getOptionalSkills,
  hasSkill, clearRegistry, buildStateMachine, getTotalCycles,
} from './registry';
export type { SkillDef, StateTransition, PlayerStateMachine, PlayerState } from './types';
export {
  jump, gravity, airResistance, itemCollection,
  doubleJump, slash, pushBox, hitAttack, block, teleport, pickUp,
  magicBall, reverse, swim, shoot, wallBreak,
} from './handlers/index';
