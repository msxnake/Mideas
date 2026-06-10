export type PlayerState = string;

export interface StateTransition {
  from: PlayerState[];
  to: PlayerState;
  condition: string;
}

export type SkillControlIcon = 'left' | 'right' | 'up' | 'down' | 'jump' | 'attack';

export type SkillParameterType = 'number' | 'boolean';

export interface SkillParameterDef {
  /** Stable key persisted in Msx2PlayerDefinition.skillParameters[skillId][key]. */
  key: string;
  /** Human label shown in the skill parameters dialog. */
  label: string;
  type: SkillParameterType;
  /** Default value applied by the normalizer when missing. */
  default: number | boolean;
  /** Numeric bounds (number type only). */
  min?: number;
  max?: number;
  /** Step for numeric input. */
  step?: number;
  /** Optional helper text shown under the input. */
  help?: string;
}

export interface SkillDef {
  id: string;
  label: string;
  required: boolean;
  cycles: number;
  addsStates: PlayerState[];
  transitions: StateTransition[];
  /** Which control icon(s) this skill responds to. `['down', 'jump']` = Down + A. undefined = automatic. */
  controlIcon?: SkillControlIcon | SkillControlIcon[];
  /**
   * Declarative parameter schema surfaced in the Player Config "Abilities & Items"
   * dialog. Optional skills with parameters (e.g. double_jump) are read by the
   * MSX2 ASM generator when listed in `activeSkills`.
   */
  parameters?: SkillParameterDef[];
}

export interface PlayerStateMachine {
  states: PlayerState[];
  transitions: StateTransition[];
  totalCycles: number;
}
