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
  /** Which control icon(s) this skill responds to. `['down', 'jump']` = Down + A. undefined = automatic. */
  controlIcon?: SkillControlIcon | SkillControlIcon[];
}

export interface PlayerStateMachine {
  states: PlayerState[];
  transitions: StateTransition[];
  totalCycles: number;
}
