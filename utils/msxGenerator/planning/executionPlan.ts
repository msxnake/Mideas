import type { ProjectAnalysis } from '../../asmTemplateGenerator';
import type { MSXModularConfig } from '../index';
import type { ExecutionPlan } from '../types/executionTypes';
import { buildMainlineWork } from './mainlinePlanBuilder';
import { buildInterruptTasks } from './taskPlanBuilder';

export function buildExecutionPlan(
  analysis: ProjectAnalysis,
  config: MSXModularConfig
): ExecutionPlan {
  const mode = config.executionMode ?? 'gameLoopHalt';

  if (mode === 'gameLoopHalt') {
    return {
      mode,
      tasks: [],
      mainline: buildMainlineWork(analysis, config, []),
      diagnostics: {
        warnings: [],
        errors: [],
        estimatedIrqCycles: 0,
        estimatedMainlineHotspots: ['entities', 'stateMachines', 'hud'],
      },
    };
  }

  const tasks = buildInterruptTasks(analysis, config);
  return {
    mode,
    tasks,
    mainline: buildMainlineWork(analysis, config, tasks),
    diagnostics: {
      warnings: [],
      errors: [],
      estimatedIrqCycles: tasks.reduce((sum, task) => sum + (task.estimatedCycles ?? 0), 0),
      estimatedMainlineHotspots: ['entities', 'stateMachines', 'hud'],
    },
  };
}
