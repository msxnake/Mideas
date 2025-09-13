// Collision Engines
export { wallCollisionEngine } from './collision/wallCollisionEngine';
export { entityCollisionEngine } from './collision/entityCollisionEngine';

// Pacman Engines
export { pacMovementEngine } from './pacman/pacMovementEngine';
export { pacmanMovementV2Engine } from './pacman/pacmanMovementV2Engine';

// Engine Registry Type
import React from 'react';
import { 
    AnimatedEntity, 
    ComponentDefinition, 
    ScreenMap, 
    EntityTemplate, 
    ProjectAsset
} from '../../types';

export type GameEngine = {
    id: string;
    name: string;
    execute: (entities: AnimatedEntity[], componentDefinitions: ComponentDefinition[], screenMap?: ScreenMap, entityTemplates?: EntityTemplate[], allAssets?: ProjectAsset[], pendingSpawns?: React.MutableRefObject<any[]>) => void;
};

export type EngineRegistry = {
    [engineId: string]: GameEngine;
};