"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionTypes = exports.ConditionTypes = void 0;
exports.ConditionTypes = {
    // Logical operators
    AND: 'AND',
    OR: 'OR',
    XOR: 'XOR',
    NOT: 'NOT',
    // Input conditions
    KEY_PRESSED: 'KEY_PRESSED',
    KEY_RELEASED: 'KEY_RELEASED',
    // Game state conditions
    VARIABLE_EQUALS: 'VARIABLE_EQUALS',
    VARIABLE_GREATER: 'VARIABLE_GREATER',
    // Movement/Collision conditions
    CAN_MOVE_DIRECTION: 'CAN_MOVE_DIRECTION',
    HAS_COLLISION: 'HAS_COLLISION',
    PATH_CLEAR: 'PATH_CLEAR',
    // Composite conditions
    KEY_AND_MOVEMENT: 'KEY_AND_MOVEMENT'
};
exports.ActionTypes = {
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
    // Game Logic
    SET_VARIABLE: 'SET_VARIABLE',
    INCREMENT_VARIABLE: 'INCREMENT_VARIABLE',
    DECREMENT_VARIABLE: 'DECREMENT_VARIABLE',
    WAIT: 'WAIT',
    GOTO_STATE: 'GOTO_STATE',
    DESTROY_ENTITY: 'DESTROY_ENTITY',
    SPAWN_ENTITY: 'SPAWN_ENTITY',
};
