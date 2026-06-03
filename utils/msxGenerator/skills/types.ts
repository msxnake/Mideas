export type PlayerState = string;

export interface StateTransition {
  from: PlayerState[];
  to: PlayerState;
  condition: string;
}

export interface SkillDef {
  id: string;
  label: string;
  required: boolean;
  cycles: number;
  addsStates: PlayerState[];
  transitions: StateTransition[];
}

export interface PlayerStateMachine {
  states: PlayerState[];
  transitions: StateTransition[];
  totalCycles: number;
}
