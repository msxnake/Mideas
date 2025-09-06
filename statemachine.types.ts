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

export interface StateMachineTransition {
  id:string;
  fromStateId: string;
  toStateId: string;
  eventId: string;
}

export interface StateMachine {
  id: string;
  name: string;
  states: StateMachineState[];
  events: StateMachineEvent[];
  transitions: StateMachineTransition[];
  initialStateId: string | null;
}
