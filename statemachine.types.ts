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
 * A type representing the possible names for an event in the state machine.
 * Includes player actions, system events, and game-specific events.
 */
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
  // Game Specific
  | 'dialogue_finished'
  | 'item_collected'
  | 'enemy_defeated'
  | 'level_complete'
  | 'game_over'
  | 'player_detected'
  | 'patrol_point_reached';

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
}

/**
 * The type of input that can trigger a state machine event.
 */
export type StateMachineInputType = 'key' | 'system_action' | 'collision';

/**
 * Represents an event that can trigger a transition between states.
 */
export interface StateMachineEvent {
  /** A unique identifier for the event. */
  id: string;
  /** The name of the event. */
  name: StateMachineEventName;
  /** The type of input that triggers the event. */
  type: StateMachineInputType;
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
  /** The ID of the event that triggers this transition. */
  eventId: string;
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
  /** An array of all possible events in the machine. */
  events: StateMachineEvent[];
  /** An array of all transitions between states. */
  transitions: StateMachineTransition[];
  /** The ID of the initial state when the machine is activated. */
  initialStateId: string | null;
}
