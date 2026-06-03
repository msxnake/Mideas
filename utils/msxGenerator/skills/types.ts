export type PlayerState = string;

export interface StateTransition {
  from: PlayerState[];
  to: PlayerState;
  condition: string;
}

export type SkillControlIcon = 'left' | 'right' | 'up' | 'down' | 'jump' | 'attack';

export interface SkillDef {
  id: string;
  label: string;
  required: boolean;
  cycles: number;
  addsStates: PlayerState[];
  transitions: StateTransition[];
  /** Which control icon this skill responds to (undefined = automatic/no input needed). */
  controlIcon?: SkillControlIcon;
}

export interface PlayerStateMachine {
  states: PlayerState[];
  transitions: StateTransition[];
  totalCycles: number;
}
