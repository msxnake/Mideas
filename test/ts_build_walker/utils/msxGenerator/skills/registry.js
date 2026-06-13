"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSkill = registerSkill;
exports.getSkill = getSkill;
exports.getAllSkills = getAllSkills;
exports.getCoreSkills = getCoreSkills;
exports.getOptionalSkills = getOptionalSkills;
exports.hasSkill = hasSkill;
exports.clearRegistry = clearRegistry;
exports.buildStateMachine = buildStateMachine;
exports.getTotalCycles = getTotalCycles;
const registry = new Map();
function registerSkill(skill) {
    if (registry.has(skill.id)) {
        throw new Error(`Skill "${skill.id}" is already registered.`);
    }
    registry.set(skill.id, skill);
}
function getSkill(id) {
    return registry.get(id);
}
function getAllSkills() {
    return Array.from(registry.values());
}
function getCoreSkills() {
    return getAllSkills().filter(s => s.required);
}
function getOptionalSkills() {
    return getAllSkills().filter(s => !s.required);
}
function hasSkill(id) {
    return registry.has(id);
}
function clearRegistry() {
    registry.clear();
}
function buildStateMachine(activeSkillIds) {
    const states = new Set();
    const transitions = [];
    let totalCycles = 0;
    for (const skill of getCoreSkills()) {
        for (const s of skill.addsStates)
            states.add(s);
        transitions.push(...skill.transitions);
        totalCycles += skill.cycles;
    }
    for (const id of activeSkillIds) {
        const skill = registry.get(id);
        if (!skill || skill.required)
            continue;
        for (const s of skill.addsStates)
            states.add(s);
        transitions.push(...skill.transitions);
        totalCycles += skill.cycles;
    }
    return {
        states: Array.from(states),
        transitions,
        totalCycles,
    };
}
function getTotalCycles(activeSkillIds) {
    let total = 0;
    for (const skill of getCoreSkills())
        total += skill.cycles;
    for (const id of activeSkillIds) {
        const skill = registry.get(id);
        if (skill && !skill.required)
            total += skill.cycles;
    }
    return total;
}
