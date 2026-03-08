"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildExecutionPlan = buildExecutionPlan;
const mainlinePlanBuilder_1 = require("./mainlinePlanBuilder");
const taskPlanBuilder_1 = require("./taskPlanBuilder");
function buildExecutionPlan(analysis, config) {
    const mode = config.executionMode ?? 'gameLoopHalt';
    if (mode === 'gameLoopHalt') {
        return {
            mode,
            tasks: [],
            mainline: (0, mainlinePlanBuilder_1.buildMainlineWork)(analysis, config, []),
            diagnostics: {
                warnings: [],
                errors: [],
                estimatedIrqCycles: 0,
                estimatedMainlineHotspots: ['entities', 'stateMachines', 'hud'],
            },
        };
    }
    const tasks = (0, taskPlanBuilder_1.buildInterruptTasks)(analysis, config);
    return {
        mode,
        tasks,
        mainline: (0, mainlinePlanBuilder_1.buildMainlineWork)(analysis, config, tasks),
        diagnostics: {
            warnings: [],
            errors: [],
            estimatedIrqCycles: tasks.reduce((sum, task) => sum + (task.estimatedCycles ?? 0), 0),
            estimatedMainlineHotspots: ['entities', 'stateMachines', 'hud'],
        },
    };
}
