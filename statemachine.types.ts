export const ActionTypes = {
  // Movimiento
  SET_POSITION: 'SET_POSITION',
  MOVE_BY: 'MOVE_BY',
  SET_VELOCITY: 'SET_VELOCITY',
  APPLY_FORCE: 'APPLY_FORCE',
  
  // Sprite
  CHANGE_SPRITE: 'CHANGE_SPRITE',
  PLAY_ANIMATION: 'PLAY_ANIMATION',
  
  // Game State
  INCREASE_SCORE: 'INCREASE_SCORE',
  SPAWN_ENTITY: 'SPAWN_ENTITY',
  DESTROY_ENTITY: 'DESTROY_ENTITY',
  
  // Audio
  PLAY_SOUND: 'PLAY_SOUND',
  
  // Variables
  SET_VARIABLE: 'SET_VARIABLE',
  INCREMENT_VARIABLE: 'INCREMENT_VARIABLE'
} as const;

export type ActionType = typeof ActionTypes[keyof typeof ActionTypes];

export interface Action {
  type: ActionType;
  params: { [key: string]: any };
}

export const ConditionTypes = {
  // Input
  KEY_PRESSED: 'KEY_PRESSED',
  KEY_RELEASED: 'KEY_RELEASED',
  
  // Collision
  COLLISION_WITH_TAG: 'COLLISION_WITH_TAG',
  COLLISION_WITH_TILE: 'COLLISION_WITH_TILE',
  
  // Position
  POSITION_REACHED: 'POSITION_REACHED',
  IN_AREA: 'IN_AREA',
  
  // Variables
  VARIABLE_EQUALS: 'VARIABLE_EQUALS',
  VARIABLE_GREATER: 'VARIABLE_GREATER',
  
  // Time
  TIMER_EXPIRED: 'TIMER_EXPIRED',
  
  // Composite
  AND: 'AND',
  OR: 'OR',
  NOT: 'NOT'
} as const;

export type ConditionType = typeof ConditionTypes[keyof typeof ConditionTypes];

export interface Condition {
  type: ConditionType;
  params?: { [key: string]: any };
  // For composite conditions
  conditions?: Condition[];
}

/**
 * A type representing the possible names for a state in the state machine.
 * Includes common states for player characters, enemies, and system events.
 */
export type StateMachineStateName =
  // English
  | 'Idle' | 'Walking' | 'Running' | 'Jumping' | 'Falling' | 'Landing' | 'Crouching' | 'Climbing' | 'Swimming' | 'Sliding' | 'Dashing' | 'Gliding'
  | 'Attacking' | 'Charging Attack' | 'Throwing' | 'Shooting' | 'Defending' | 'Countering' | 'Taking Damage' | 'Hurt' | 'Invulnerable' | 'Dead' | 'Spawning'
  | 'Interacting' | 'In Dialogue' | 'Using Item' | 'Morphing' | 'Teleporting' | 'Paused' | 'In Cutscene' | 'Menu Navigation' | 'Saving' | 'Loading'
  | 'Frozen' | 'On Fire' | 'Poisoned' | 'Stunned' | 'Inverted Movement' | 'Invisible' | 'Slowed' | 'Speed Up'
  | 'Casting Spell' | 'Flying' | 'Shielded' | 'Time Stopped'
  | 'Patrolling' | 'Chasing' | 'Searching' | 'Alerted' | 'Sleeping' | 'Fleeing' | 'Guarding' | 'Inactive' | 'Take'
  // Spanish
  | 'Quieto' | 'Caminando' | 'Corriendo' | 'Saltando' | 'Cayendo' | 'Aterrizando' | 'Agachado' | 'Escalando' | 'Nadando' | 'Deslizándose' | 'Impulso rápido' | 'Planeando'
  | 'Ejecutando un ataque' | 'Cargando un ataque especial' | 'Lanzando un objeto' | 'Disparando' | 'Defendiendo' | 'Contrarrestando un ataque' | 'Recibiendo daño' | 'Herido' | 'Temporalmente invulnerable' | 'Muerto' | 'Reapareciendo'
  | 'Interactuando' | 'En diálogo' | 'Usando un objeto' | 'Cambiando de forma' | 'Desplazamiento instantáneo' | 'En pausa' | 'En cinemática' | 'Navegando por el menú' | 'Guardando progreso' | 'Cargando nivel'
  | 'Congelado' | 'En llamas' | 'Envenenado' | 'Aturdido' | 'Movimiento invertido' | 'No visible para enemigos' | 'Movimiento reducido' | 'Velocidad aumentada'
  | 'Lanzando hechizo' | 'Volando' | 'Protegido por escudo' | 'Tiempo detenido'
  | 'Persiguiendo' | 'Buscando' | 'En alerta' | 'Dormido' | 'Huyendo' | 'Protegiendo una zona' | 'Inactivo';

/**
 * Represents a single state in a state machine.
 */
export interface StateMachineState {
  /** A unique identifier for the state. */
  id: string;
  /** The name of the state. */
  name: StateMachineStateName;
  /** The position of the state node in the editor UI. */
  position?: { x: number; y: number };
  /** A key-value map of custom properties for the state. */
  properties?: { [key: string]: any };
  /** Actions to execute when entering this state. */
  onEnter?: Action[];
  /** Actions to execute when exiting this state. */
  onExit?: Action[];
}

/**
 * Represents a transition between two states, triggered by an event.
 */
export interface StateMachineTransition {
  /** A unique identifier for the transition. */
  id:string;
  /** The ID of the state where the transition originates. */
  fromStateId: string;
  /** The ID of the state where the transition leads. */
  toStateId: string;
  /** The conditions that must be met for this transition to occur. */
  conditions: Condition;
  /** The actions to execute when this transition occurs. */
  actions?: Action[];
}

export type StateMachineEventName = 
  | 'walk' | 'run' | 'jump' | 'attack' | 'shoot' | 'fall' | 'right' | 'left' | 'up' | 'down' | 'Spc' | 'Enter' | 'Tab' | 'Shift' | 'Ctrl' | 'Alt'
  | 'collision_wall' | 'collision_floor' | 'collision_enemy' | 'collision_item' | 'timer_expired' | 'animation_finished'
  | 'dialogue_finished' | 'item_collected' | 'enemy_defeated' | 'level_complete' | 'game_over' | 'player_detected' | 'patrol_point_reached';

export type StateMachineInputType = 'key' | 'system_action' | 'collision';

export interface StateMachineEvent {
  id: string;
  name: StateMachineEventName;
  type: StateMachineInputType;
}

/**
 * Represents a complete state machine, including its states, events, and transitions.
 */
export interface StateMachine {
  /** A unique identifier for the state machine asset. */
  id: string;
  /** The name of the state machine asset. */
  name: string;
  /** An array of all states in the machine. */
  states: StateMachineState[];
  /** An array of all events that can trigger transitions. */
  events: StateMachineEvent[];
  /** An array of all transitions between states. */
  transitions: StateMachineTransition[];
  /** The ID of the initial state when the machine is activated. */
  initialStateId: string | null;
}
