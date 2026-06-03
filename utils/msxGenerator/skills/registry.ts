import { SkillDef, PlayerStateMachine, StateTransition } from './types';

const registry = new Map<string, SkillDef>();

export function registerSkill(skill: SkillDef): void {
  if (registry.has(skill.id)) {
    throw new Error(`Skill "${skill.id}" is already registered.`);
  }
  registry.set(skill.id, skill);
}

export function getSkill(id: string): SkillDef | undefined {
  return registry.get(id);
}

export function getAllSkills(): SkillDef[] {
  return Array.from(registry.values());
}

export function getCoreSkills(): SkillDef[] {
  return getAllSkills().filter(s => s.required);
}

export function getOptionalSkills(): SkillDef[] {
  return getAllSkills().filter(s => !s.required);
}

export function hasSkill(id: string): boolean {
  return registry.has(id);
}

export function clearRegistry(): void {
  registry.clear();
}

export function buildStateMachine(activeSkillIds: string[]): PlayerStateMachine {
  const states = new Set<string>();
  const transitions: StateTransition[] = [];
  let totalCycles = 0;

  for (const skill of getCoreSkills()) {
    for (const s of skill.addsStates) states.add(s);
    transitions.push(...skill.transitions);
    totalCycles += skill.cycles;
  }

  for (const id of activeSkillIds) {
    const skill = registry.get(id);
    if (!skill || skill.required) continue;
    for (const s of skill.addsStates) states.add(s);
    transitions.push(...skill.transitions);
    totalCycles += skill.cycles;
  }

  return {
    states: Array.from(states),
    transitions,
    totalCycles,
  };
}

export function getTotalCycles(activeSkillIds: string[]): number {
  let total = 0;
  for (const skill of getCoreSkills()) total += skill.cycles;
  for (const id of activeSkillIds) {
    const skill = registry.get(id);
    if (skill && !skill.required) total += skill.cycles;
  }
  return total;
}
