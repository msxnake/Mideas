import { 
    AnimatedEntity, 
    ComponentDefinition, 
    ScreenMap
} from '../../../types';

type GameEngine = {
    id: string;
    name: string;
    execute: (entities: AnimatedEntity[], componentDefinitions: ComponentDefinition[], screenMap?: ScreenMap) => void;
};

export const entityCollisionEngine: GameEngine = {
    id: 'collision',
    name: 'Collision Detection Engine',
    execute: (entities: AnimatedEntity[], componentDefinitions: ComponentDefinition[], screenMap?: ScreenMap) => {
        // Simple collision detection between entities
        for (let i = 0; i < entities.length; i++) {
            for (let j = i + 1; j < entities.length; j++) {
                const entityA = entities[i];
                const entityB = entities[j];
                
                const collisionA = entityA.template.components.find(c => c.definitionId === 'comp_collision');
                const collisionB = entityB.template.components.find(c => c.definitionId === 'comp_collision');
                
                if (!collisionA || !collisionB) continue;
                
                const propsA = { ...collisionA.defaultValues, ...(entityA.instance.componentOverrides?.['comp_collision'] || {}) };
                const propsB = { ...collisionB.defaultValues, ...(entityB.instance.componentOverrides?.['comp_collision'] || {}) };
                
                const layerA = Number(propsA.collisionLayer) || 1;
                const layerB = Number(propsB.collisionLayer) || 1;
                const collidesWithA = Number(propsA.collidesWith) || 255;
                const collidesWithB = Number(propsB.collidesWith) || 255;
                
                // Check if layers should collide
                if (!((collidesWithA & layerB) || (collidesWithB & layerA))) continue;
                
                // Simple AABB collision detection
                const widthA = Number(propsA.hitboxWidth) || 16;
                const heightA = Number(propsA.hitboxHeight) || 16;
                const offsetXA = Number(propsA.offsetX) || 0;
                const offsetYA = Number(propsA.offsetY) || 0;
                
                const widthB = Number(propsB.hitboxWidth) || 16;
                const heightB = Number(propsB.hitboxHeight) || 16;
                const offsetXB = Number(propsB.offsetX) || 0;
                const offsetYB = Number(propsB.offsetY) || 0;
                
                const x1 = entityA.x + offsetXA;
                const y1 = entityA.y + offsetYA;
                const x2 = entityB.x + offsetXB;
                const y2 = entityB.y + offsetYB;
                
                if (x1 < x2 + widthB && x1 + widthA > x2 &&
                    y1 < y2 + heightB && y1 + heightA > y2) {

                    // Collision detected! Check if it's a collectible or damage collision
                    const collectibleA = entityA.template.components.find(c => c.definitionId === 'comp_collectible');
                    const collectibleB = entityB.template.components.find(c => c.definitionId === 'comp_collectible');

                    // COLLECTIBLE COLLISION: Handle item collection
                    if (collectibleA && !collectibleB) {
                        // Entity B collects entity A
                        const collectibleProps = { ...collectibleA.defaultValues, ...(entityA.instance.componentOverrides?.['comp_collectible'] || {}) };
                        const itemType = collectibleProps.itemType || 'coin';
                        const itemValue = Number(collectibleProps.itemValue) || 1;

                        console.log(`✨ ${entityB.template.name} collected ${itemType} (${entityA.template.name}) worth ${itemValue}!`);
                        entityA.markedForDestruction = true;

                        // TODO: Add item to inventory, update score, etc.
                        // This could trigger a custom event or update game state

                    } else if (collectibleB && !collectibleA) {
                        // Entity A collects entity B
                        const collectibleProps = { ...collectibleB.defaultValues, ...(entityB.instance.componentOverrides?.['comp_collectible'] || {}) };
                        const itemType = collectibleProps.itemType || 'coin';
                        const itemValue = Number(collectibleProps.itemValue) || 1;

                        console.log(`✨ ${entityA.template.name} collected ${itemType} (${entityB.template.name}) worth ${itemValue}!`);
                        entityB.markedForDestruction = true;

                    } else if (!collectibleA && !collectibleB) {
                        // DAMAGE COLLISION: Neither is a collectible, handle combat
                        const damageA = entityA.template.components.find(c => c.definitionId === 'comp_damage');
                        const damageB = entityB.template.components.find(c => c.definitionId === 'comp_damage');
                        const healthA = entityA.template.components.find(c => c.definitionId === 'comp_health');
                        const healthB = entityB.template.components.find(c => c.definitionId === 'comp_health');

                        // Apply damage from A to B
                        if (damageA && healthB) {
                            const damageProps = { ...damageA.defaultValues, ...(entityA.instance.componentOverrides?.['comp_damage'] || {}) };
                            const damageAmount = Number(damageProps.damageAmount) || 1;

                            if (!entityB.healthData) {
                                const healthProps = { ...healthB.defaultValues, ...(entityB.instance.componentOverrides?.['comp_health'] || {}) };
                                entityB.healthData = {
                                    current: Number(healthProps.current),
                                    max: Number(healthProps.max)
                                };
                            }

                            entityB.healthData.current -= damageAmount;
                            console.log(`💥 ${entityB.template.name} hit by ${entityA.template.name} for ${damageAmount} damage! Health: ${entityB.healthData.current}/${entityB.healthData.max}`);

                            if (entityB.healthData.current <= 0) {
                                console.log(`💀 ${entityB.template.name} destroyed!`);
                                entityB.markedForDestruction = true;
                            }

                            // Destroy bullet on impact
                            if (entityA.template.id === 'tpl_player_bullet') {
                                entityA.markedForDestruction = true;
                            }
                        }

                        // Apply damage from B to A (if both have damage components)
                        if (damageB && healthA && !entityA.markedForDestruction) {
                            const damageProps = { ...damageB.defaultValues, ...(entityB.instance.componentOverrides?.['comp_damage'] || {}) };
                            const damageAmount = Number(damageProps.damageAmount) || 1;

                            if (!entityA.healthData) {
                                const healthProps = { ...healthA.defaultValues, ...(entityA.instance.componentOverrides?.['comp_health'] || {}) };
                                entityA.healthData = {
                                    current: Number(healthProps.current),
                                    max: Number(healthProps.max)
                                };
                            }

                            entityA.healthData.current -= damageAmount;
                            console.log(`💥 ${entityA.template.name} hit by ${entityB.template.name} for ${damageAmount} damage! Health: ${entityA.healthData.current}/${entityA.healthData.max}`);

                            if (entityA.healthData.current <= 0) {
                                console.log(`💀 ${entityA.template.name} destroyed!`);
                                entityA.markedForDestruction = true;
                            }
                        }
                    }
                    // If both are collectibles, do nothing (collectibles don't interact with each other)
                }
            }
        }
    }
};