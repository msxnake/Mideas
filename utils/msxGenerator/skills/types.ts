import type { GraphicsBackend } from '../graphicsBackend';

export type PlayerState = string;

export interface StateTransition {
  from: PlayerState[];
  to: PlayerState;
  condition: string;
}

export type SkillControlIcon = 'left' | 'right' | 'up' | 'down' | 'jump' | 'attack';
export type SkillActivationTrigger = 'input' | 'collision' | 'collision-input';

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
  /** Which control icon(s) an input skill responds to. `['down', 'jump']` = Down + A by default. */
  controlIcon?: SkillControlIcon | SkillControlIcon[];
  /**
   * How the skill is activated. Defaults to `input` when `controlIcon` is
   * present. `collision` runs automatically on overlap. `collision-input`
   * requires both overlap and the configured keyboard/joystick control.
   */
  activationTrigger?: SkillActivationTrigger;
  /** How multiple control icons combine in UI declarations. Default: 'and'. */
  controlOperator?: 'and' | 'or';
  /**
   * Declarative parameter schema surfaced in the Player Config "Abilities & Items"
   * dialog. Optional skills with parameters (e.g. double_jump) are read by the
   * MSX2 ASM generator when listed in `activeSkills`.
   */
  parameters?: SkillParameterDef[];
  /**
   * Graphics backends that actually emit ASM for this skill. When omitted or
   * empty the skill is considered universal (shown for every backend) — this is
   * the backward-compatible default for core skills and skills whose backend
   * support is not yet mapped.
   *
   * Single source of truth: the Player Config UI filters the skill list by
   * comparing the resolved project backend against this field, so adding a new
   * backend implementation only requires updating the skill definition here —
   * no separate UI allow-list to maintain.
   */
  supportedBackends?: GraphicsBackend[];
}

export interface PlayerStateMachine {
  states: PlayerState[];
  transitions: StateTransition[];
  totalCycles: number;
}
