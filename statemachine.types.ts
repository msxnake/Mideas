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
  fromStateId: string;
  toStateId: string;
}

export interface StateMachine {
  id: string;
  name: string;
  states: StateMachineState[];
  events: StateMachineEvent[];
  initialStateId: string | null;
}
