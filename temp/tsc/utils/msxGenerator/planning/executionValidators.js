import { analyzeComponentUsage } from '../utils/componentAnalyzer';
const IRQ_FORBIDDEN_RESPONSIBILITIES = new Set([
    'sprites',
    'hud',
    'entities',
    'stateMachines',
]);
export function validateExecutionPlan(plan, _analysis) {
    const errors = [...plan.diagnostics.errors];
    const warnings = [...plan.diagnostics.warnings];
    // Validate deadly tiles require Health component
    const hasDeadlyTiles = _analysis.tiles?.some((t) => t.logicalProperties?.causesDamage === true);
    if (hasDeadlyTiles) {
        const componentUsage = analyzeComponentUsage(_analysis);
        if (!componentUsage.usedComponents.has('Health')) {
            errors.push('Tiles with "Deadly" (causesDamage) exist but no entity has the Health component. ' +
                'Add the Health component to the hero/player entity so deadly tiles can cause damage.');
        }
    }
    const seenSlots = new Map();
    for (const task of plan.tasks) {
        const existing = seenSlots.get(task.slot);
        if (existing) {
            errors.push(`IRQ slot duplicated: ${task.slot} (${existing}, ${task.id})`);
        }
        else {
            seenSlots.set(task.slot, task.id);
        }
        if (IRQ_FORBIDDEN_RESPONSIBILITIES.has(task.responsibility)) {
            errors.push(`Responsibility not allowed in IRQ for v1: ${task.responsibility}`);
        }
    }
    const audioInIrq = plan.tasks.some((task) => task.responsibility === 'audio');
    const audioInMainline = plan.mainline.some((item) => item.responsibility === 'audio');
    if (audioInIrq && audioInMainline) {
        errors.push('Audio responsibility duplicated between IRQ and mainline');
    }
    if (plan.mode === 'interruptTaskManager' && plan.tasks.length === 0) {
        warnings.push('interruptTaskManager selected without active IRQ tasks');
    }
    return {
        ...plan,
        diagnostics: {
            ...plan.diagnostics,
            warnings,
            errors,
        },
    };
}
