export type StateMachineStateName =
  | 'Idle'
  | 'Walking'
  | 'Running'
  | 'Jumping'
  | 'Swimming'
  | 'Patrolling'
  | 'Attacking'
  | 'Shooting'
  | 'Falling'
  | 'Hurt'
  | 'Take';

export type StateMachineEventName =
  | 'walk'
  | 'run'
  | 'jump'
  | 'attack'
  | 'shoot'
  | 'fall';

export interface StateMachineState {
  id: string;
  name: StateMachineStateName;
  position?: { x: number; y: number };
}

export interface StateMachineEvent {
  id: string;
  name: StateMachineEventName;
}

export interface StateMachineTransition {
  id: string;
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
