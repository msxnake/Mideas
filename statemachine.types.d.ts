export type StateMachineStateName = 'Idle' | 'Walking' | 'Running' | 'Jumping' | 'Falling' | 'Landing' | 'Crouching' | 'Climbing' | 'Swimming' | 'Sliding' | 'Dashing' | 'Gliding' | 'Attacking' | 'Charging Attack' | 'Throwing' | 'Shooting' | 'Defending' | 'Countering' | 'Taking Damage' | 'Hurt' | 'Invulnerable' | 'Dead' | 'Spawning' | 'Interacting' | 'In Dialogue' | 'Using Item' | 'Morphing' | 'Teleporting' | 'Paused' | 'In Cutscene' | 'Menu Navigation' | 'Saving' | 'Loading' | 'Frozen' | 'On Fire' | 'Poisoned' | 'Stunned' | 'Inverted Movement' | 'Invisible' | 'Slowed' | 'Speed Up' | 'Casting Spell' | 'Flying' | 'Shielded' | 'Time Stopped' | 'Patrolling' | 'Chasing' | 'Searching' | 'Alerted' | 'Sleeping' | 'Fleeing' | 'Guarding' | 'Inactive' | 'Take' | 'Quieto' | 'Caminando' | 'Corriendo' | 'Saltando' | 'Cayendo' | 'Aterrizando' | 'Agachado' | 'Escalando' | 'Nadando' | 'Deslizándose' | 'Impulso rápido' | 'Planeando' | 'Ejecutando un ataque' | 'Cargando un ataque especial' | 'Lanzando un objeto' | 'Disparando' | 'Defendiendo' | 'Contrarrestando un ataque' | 'Recibiendo daño' | 'Herido' | 'Temporalmente invulnerable' | 'Muerto' | 'Reapareciendo' | 'Interactuando' | 'En diálogo' | 'Usando un objeto' | 'Cambiando de forma' | 'Desplazamiento instantáneo' | 'En pausa' | 'En cinemática' | 'Navegando por el menú' | 'Guardando progreso' | 'Cargando nivel' | 'Congelado' | 'En llamas' | 'Envenenado' | 'Aturdido' | 'Movimiento invertido' | 'No visible para enemigos' | 'Movimiento reducido' | 'Velocidad aumentada' | 'Lanzando hechizo' | 'Volando' | 'Protegido por escudo' | 'Tiempo detenido' | 'Persiguiendo' | 'Buscando' | 'En alerta' | 'Dormido' | 'Huyendo' | 'Protegiendo una zona' | 'Inactivo';
export type StateMachineEventName = 'walk' | 'run' | 'jump' | 'attack' | 'shoot' | 'fall' | 'right' | 'left' | 'up' | 'down' | 'Spc' | 'Enter' | 'Tab' | 'Shift' | 'Ctrl' | 'Alt' | 'collision_wall' | 'collision_floor' | 'collision_enemy' | 'collision_item' | 'timer_expired' | 'animation_finished' | 'can_move_up' | 'can_move_down' | 'can_move_left' | 'can_move_right' | 'collision_ahead' | 'path_blocked' | 'dialogue_finished' | 'item_collected' | 'enemy_defeated' | 'level_complete' | 'game_over' | 'player_detected' | 'patrol_point_reached';
export interface StateMachineState {
    id: string;
    name: StateMachineStateName;
    position?: {
        x: number;
        y: number;
    };
    properties?: {
        [key: string]: any;
    };
}
export type StateMachineInputType = 'key' | 'system_action' | 'collision';
export interface StateMachineEvent {
    id: string;
    name: StateMachineEventName;
    type: StateMachineInputType;
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
export declare const ConditionTypes: {
    readonly AND: "AND";
    readonly OR: "OR";
    readonly XOR: "XOR";
    readonly NOT: "NOT";
    readonly KEY_PRESSED: "KEY_PRESSED";
    readonly KEY_RELEASED: "KEY_RELEASED";
    readonly VARIABLE_EQUALS: "VARIABLE_EQUALS";
    readonly VARIABLE_GREATER: "VARIABLE_GREATER";
    readonly CAN_MOVE_DIRECTION: "CAN_MOVE_DIRECTION";
    readonly HAS_COLLISION: "HAS_COLLISION";
    readonly PATH_CLEAR: "PATH_CLEAR";
    readonly KEY_AND_MOVEMENT: "KEY_AND_MOVEMENT";
};
export type ConditionType = typeof ConditionTypes[keyof typeof ConditionTypes];
export interface Condition {
    type: ConditionType;
    params?: {
        [key: string]: any;
    };
    conditions?: Condition[];
}
export declare const ActionTypes: {
    readonly SET_POSITION: "SET_POSITION";
    readonly MOVE_BY: "MOVE_BY";
    readonly SET_VELOCITY: "SET_VELOCITY";
    readonly APPLY_FORCE: "APPLY_FORCE";
    readonly CHANGE_SPRITE: "CHANGE_SPRITE";
    readonly PLAY_ANIMATION: "PLAY_ANIMATION";
    readonly PLAY_SOUND: "PLAY_SOUND";
    readonly SET_VARIABLE: "SET_VARIABLE";
    readonly INCREMENT_VARIABLE: "INCREMENT_VARIABLE";
    readonly DECREMENT_VARIABLE: "DECREMENT_VARIABLE";
    readonly WAIT: "WAIT";
    readonly GOTO_STATE: "GOTO_STATE";
    readonly DESTROY_ENTITY: "DESTROY_ENTITY";
    readonly SPAWN_ENTITY: "SPAWN_ENTITY";
};
export type ActionType = typeof ActionTypes[keyof typeof ActionTypes];
export interface Action {
    type: ActionType;
    params: {
        [key: string]: any;
    };
}
