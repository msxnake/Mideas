import { clearRegistry, registerSkill } from './registry';
import {
  jump, gravity, airResistance, itemCollection,
  doubleJump, slash, pushBox, hitAttack, block, teleport, pickUp,
  magicBall, reverse, swim, shoot, wallBreak, grab, dash,
  wallJump, airDash, chargeAttack, glide, spinAttack,
  parry, crouch, climb, highJump, collectorGems, collectorItems,
  pushWall, pushDoor, carryObject, teleportAB, carryAndThrow,
  powerStomp, iceSlide, perception, destroyTile, torch,
} from './handlers/index';

// Registering is this module's side effect, so a SECOND evaluation (Vite's hot
// reload) must start from a clean registry. Without this the HMR update dies on
// "Skill ... is already registered" and the app keeps serving the previous skill
// list — which looks exactly like a newly added skill not showing up in the
// Player Config. Duplicates inside the list below still throw, as they should.
clearRegistry();

for (const skill of [
  jump, gravity, airResistance, itemCollection,
  doubleJump, slash, pushBox, hitAttack, block, teleport, pickUp,
  magicBall, reverse, swim, shoot, wallBreak, grab, dash,
  wallJump, airDash, chargeAttack, glide, spinAttack,
  parry, crouch, climb, highJump, collectorGems, collectorItems,
  pushWall, pushDoor, carryObject, teleportAB, carryAndThrow,
  powerStomp, iceSlide, perception, destroyTile, torch,
]) {
  registerSkill(skill);
}

export {
  registerSkill, getSkill, getAllSkills, getCoreSkills, getOptionalSkills,
  getSkillsForBackend, hasSkill, clearRegistry, buildStateMachine, getTotalCycles,
} from './registry';
export type { SkillDef, StateTransition, PlayerStateMachine, PlayerState, SkillControlIcon } from './types';
export {
  jump, gravity, airResistance, itemCollection,
  doubleJump, slash, pushBox, hitAttack, block, teleport, pickUp,
  magicBall, reverse, swim, shoot, wallBreak, grab, dash,
  wallJump, airDash, chargeAttack, glide, spinAttack,
  parry, crouch, climb, highJump, collectorGems, collectorItems,
  pushWall, pushDoor, carryObject, teleportAB, carryAndThrow,
  powerStomp, iceSlide, perception, destroyTile, torch,
} from './handlers/index';
