export type EngineExecutionMode = 'interruptTaskManager' | 'gameLoopHalt';

export type ExecutionResponsibility =
  | 'audio'
  | 'timer'
  | 'input'
  | 'animation'
  | 'sprites'
  | 'entities'
  | 'stateMachines'
  | 'hud'
  | 'screenFlow'
  | 'sfx'
  | 'custom';

export interface TaskDefinition {
  id: string;
  responsibility: ExecutionResponsibility;
  routineLabel: string;
  slot: number;
  period: number;
  enabledAtBoot: boolean;
  irqSafe: boolean;
  estimatedCycles?: number;
  notes?: string[];
}

export interface MainlineWorkItem {
  id: string;
  responsibility: ExecutionResponsibility;
  routineLabel: string;
  phase: 'postHalt' | 'preUpdate' | 'postUpdate' | 'render';
  estimatedCycles?: number;
  notes?: string[];
}

export interface ExecutionDiagnostics {
  warnings: string[];
  errors: string[];
  estimatedIrqCycles: number;
  estimatedMainlineHotspots: string[];
}

export interface ExecutionPlan {
  mode: EngineExecutionMode;
  tasks: TaskDefinition[];
  mainline: MainlineWorkItem[];
  diagnostics: ExecutionDiagnostics;
}
