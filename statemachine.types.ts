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

export type StateMachineEventName =
  // Player Actions
  | 'walk'
  | 'run'
  | 'jump'
  | 'attack'
  | 'shoot'
  | 'fall'
  // General purpose
  | 'right'
  | 'left'
  | 'up'
  | 'down'
  | 'Spc'
  | 'Enter'
  | 'Tab'
  | 'Shift'
  | 'Ctrl'
  | 'Alt'
  // System Events
  | 'collision_wall'
  | 'collision_floor'
  | 'collision_enemy'
  | 'collision_item'
  | 'timer_expired'
  | 'animation_finished'
  // Movement Validation Events
  | 'can_move_up'
  | 'can_move_down'
  | 'can_move_left'
  | 'can_move_right'
  | 'collision_ahead'
  | 'path_blocked'
  // Game Specific
  | 'dialogue_finished'
  | 'item_collected'
  | 'enemy_defeated'
  | 'level_complete'
  | 'game_over'
  | 'player_detected'
  | 'patrol_point_reached';

export interface StateMachineState {
  id: string;
  name: StateMachineStateName;
  position?: { x: number; y: number };
  properties?: { [key: string]: any };
}

export type StateMachineInputType = 'key' | 'system_action' | 'collision';

export interface StateMachineEvent {
  id: string;
  name: StateMachineEventName;
  type: StateMachineInputType;
}

export interface TransitionGuard {
  variableName: string;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=';
  compareValue: string | number;
}

export interface StateMachineTransition {
  id: string;
  fromStateId: string;
  toStateId: string;
  conditions?: Condition;     // Condition to evaluate for this transition
  actions?: Action[];         // Actions to execute when transitioning
  guard?: TransitionGuard;    // Additional guard for variable comparisons
}

export interface StateMachine {
  id: string;
  name: string;
  states: StateMachineState[];
  events: StateMachineEvent[];           // DEPRECATED: Not currently used, transitions use Conditions instead
  transitions: StateMachineTransition[];
  initialStateId: string | null;
}

export const ConditionTypes = {
  // Logical operators
  AND: 'AND',
  OR: 'OR',
  XOR: 'XOR',
  NOT: 'NOT',

  // Input conditions (events)
  KEY_PRESSED: 'KEY_PRESSED',
  KEY_RELEASED: 'KEY_RELEASED',

  // Time conditions (events)
  TIME_OUT: 'TIME_OUT',

  // Movement/Collision conditions (events)
  CAN_MOVE_DIRECTION: 'CAN_MOVE_DIRECTION',
  HAS_COLLISION: 'HAS_COLLISION',
  PATH_CLEAR: 'PATH_CLEAR',
  ON_WALL_COLLISION: 'ON_WALL_COLLISION',
  HAS_DEADLY_TILE_COLLISION: 'HAS_DEADLY_TILE_COLLISION',

  // Animation conditions (events)
  ANIMATION_COMPLETE: 'ANIMATION_COMPLETE',

  // Composite conditions
  KEY_AND_MOVEMENT: 'KEY_AND_MOVEMENT'
} as const;

// Note: VARIABLE_EQUALS and VARIABLE_GREATER have been removed
// Use TransitionGuard for variable comparisons instead of Condition

export type ConditionType = typeof ConditionTypes[keyof typeof ConditionTypes];

export interface Condition {
  type: ConditionType;
  params?: { [key: string]: any };
  conditions?: Condition[]; // For AND, OR, NOT
}

export const ActionTypes = {
  // Movement and Physics
  SET_POSITION: 'SET_POSITION',
  MOVE_BY: 'MOVE_BY',
  SET_VELOCITY: 'SET_VELOCITY',
  APPLY_FORCE: 'APPLY_FORCE',

  // Appearance
  CHANGE_SPRITE: 'CHANGE_SPRITE',
  PLAY_ANIMATION: 'PLAY_ANIMATION',

  // Sound
  PLAY_SOUND: 'PLAY_SOUND',
  PLAY_MUSIC: 'PLAY_MUSIC',
  MUTE_MUSIC: 'MUTE_MUSIC',
  STOP_MUSIC: 'STOP_MUSIC',

  // Game Logic
  SET_VARIABLE: 'SET_VARIABLE',
  INCREMENT_VARIABLE: 'INCREMENT_VARIABLE',
  DECREMENT_VARIABLE: 'DECREMENT_VARIABLE',
  SET_COMPONENT_PROPERTY: 'SET_COMPONENT_PROPERTY',
  WAIT: 'WAIT',
  GOTO_STATE: 'GOTO_STATE',
  DESTROY_ENTITY: 'DESTROY_ENTITY',
  SPAWN_ENTITY: 'SPAWN_ENTITY',

  // Game Flow
  CHANGE_GAME_FLOW_NODE: 'CHANGE_GAME_FLOW_NODE',
  DECREASE_LIVES: 'DECREASE_LIVES',
  INCREASE_LIVES: 'INCREASE_LIVES',
  RESPAWN_PLAYER: 'RESPAWN_PLAYER',

  // Tile Manipulation
  BREAK_TILE: 'BREAK_TILE',
  REPLACE_TILE: 'REPLACE_TILE',

} as const;

export type ActionType = typeof ActionTypes[keyof typeof ActionTypes];

export interface Action {
  type: ActionType;
  params: { [key: string]: any };
}

/**
 * Parameters for BREAK_TILE and REPLACE_TILE actions
 */
export interface TileActionParams {
  /** Direction relative to the player where the tile is located */
  direction: 'up' | 'down' | 'left' | 'right';
  /** ID of the replacement tile (only for REPLACE_TILE action) */
  replacementTileId?: string;
}
