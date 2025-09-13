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

export const wallCollisionEngine: GameEngine = {
    id: 'wallCollision',
    name: 'Wall Collision Engine',
    execute: (entities: AnimatedEntity[], componentDefinitions: ComponentDefinition[], screenMap?: ScreenMap) => {
        if (!screenMap || !screenMap.layers?.collision) return;

        const tileLayer = screenMap.layers.collision;
        const mapW = screenMap.width || (tileLayer[0] ? tileLayer[0].length : 0);
        const mapH = screenMap.height || tileLayer.length;
        const EPS = 1e-6;

        entities.forEach(entity => {
            const wallCollisionComp = entity.template.components.find(c => c.definitionId === 'comp_wall_collision');
            if (!wallCollisionComp) return;

            const props = { ...wallCollisionComp.defaultValues, ...(entity.instance?.componentOverrides?.['comp_wall_collision'] || {}) };
            const hitboxWidth = Number(props.hitboxWidth) || 16;
            const hitboxHeight = Number(props.hitboxHeight) || 16;
            const offsetX = Number(props.offsetX) || 0;
            const offsetY = Number(props.offsetY) || 0;
            const tileSize = Number(props.tileSize) || 8;
            const stopOnCollision = props.stopOnCollision !== 'false' && props.stopOnCollision !== false;

            // unify velocity properties (prefer vx/vy, fallback a velocityX/velocityY)
            let vx = typeof entity.vx === 'number' ? entity.vx : (typeof entity.velocityX === 'number' ? entity.velocityX : 0);
            let vy = typeof entity.vy === 'number' ? entity.vy : (typeof entity.velocityY === 'number' ? entity.velocityY : 0);

            // helper to zero both forms of velocity
            const zeroVelX = () => { entity.vx = 0; entity.velocityX = 0; vx = 0; };
            const zeroVelY = () => { entity.vy = 0; entity.velocityY = 0; vy = 0; };

            // compute bounds
            let left = entity.x + offsetX;
            let top = entity.y + offsetY;
            let right = left + hitboxWidth;
            let bottom = top + hitboxHeight;

            let collidedThisFrame = false;
            let collisionTilePos = null;

            // --- Horizontal pass (resolve X) ---
            if (Math.abs(vx) > EPS) {
                const dirX = vx > 0 ? 1 : -1;
                const startTileY = Math.floor(top / tileSize);
                const endTileY = Math.floor((bottom - EPS) / tileSize);
                const startTileX = Math.floor(left / tileSize);
                const endTileX = Math.floor((right - EPS) / tileSize);

                let stopHorizontal = false;
                for (let ty = startTileY; ty <= endTileY && !stopHorizontal; ty++) {
                    for (let tx = startTileX; tx <= endTileX && !stopHorizontal; tx++) {
                        if (tx < 0 || ty < 0 || tx >= mapW || ty >= mapH) continue;
                        // Obtener el valor del byte de propiedades directamente
                        const tileValue = tileLayer[ty]?.[tx];
                        if (typeof tileValue !== 'number') continue;

                        // Verificar el bit solid usando máscara 0x10 (binario: 00010000)
                        const SOLID_BIT_MASK = 0x10;
                        const isSolid = (tileValue & SOLID_BIT_MASK) !== 0;
                        if (!isSolid) continue;

                        const tileLeft = tx * tileSize;
                        const tileRight = tileLeft + tileSize;

                        if (dirX > 0) {
                            const overlap = right - tileLeft;
                            if (overlap > EPS) {
                                // push entity left by overlap
                                entity.x -= overlap;
                                // update bounds after push
                                left = entity.x + offsetX;
                                right = left + hitboxWidth;
                                collidedThisFrame = true;
                                collisionTilePos = { tx, ty };
                                if (stopOnCollision) zeroVelX();
                                stopHorizontal = true;
                                break;
                            }
                        } else {
                            const overlap = tileRight - left;
                            if (overlap > EPS) {
                                // push entity right by overlap
                                entity.x += overlap;
                                left = entity.x + offsetX;
                                right = left + hitboxWidth;
                                collidedThisFrame = true;
                                collisionTilePos = { tx, ty };
                                if (stopOnCollision) zeroVelX();
                                stopHorizontal = true;
                                break;
                            }
                        }
                    }
                }
            }

            // --- Vertical pass (resolve Y) ---
            // recompute bounds before vertical pass (x might have changed)
            left = entity.x + offsetX;
            top = entity.y + offsetY;
            right = left + hitboxWidth;
            bottom = top + hitboxHeight;

            if (Math.abs(vy) > EPS) {
                const dirY = vy > 0 ? 1 : -1;
                const startTileX = Math.floor(left / tileSize);
                const endTileX = Math.floor((right - EPS) / tileSize);
                const startTileY = Math.floor(top / tileSize);
                const endTileY = Math.floor((bottom - EPS) / tileSize);

                let stopVertical = false;
                for (let tx = startTileX; tx <= endTileX && !stopVertical; tx++) {
                    for (let ty = startTileY; ty <= endTileY && !stopVertical; ty++) {
                        if (tx < 0 || ty < 0 || tx >= mapW || ty >= mapH) continue;
                        // Obtener el valor del byte de propiedades directamente
                        const tileValue = tileLayer[ty]?.[tx];
                        if (typeof tileValue !== 'number') continue;

                        // Verificar el bit solid usando máscara 0x10 (binario: 00010000)
                        const SOLID_BIT_MASK = 0x10;
                        const isSolid = (tileValue & SOLID_BIT_MASK) !== 0;
                        if (!isSolid) continue;

                        const tileTop = ty * tileSize;
                        const tileBottom = tileTop + tileSize;

                        if (dirY > 0) {
                            const overlap = bottom - tileTop;
                            if (overlap > EPS) {
                                // push entity up
                                entity.y -= overlap;
                                top = entity.y + offsetY;
                                bottom = top + hitboxHeight;
                                collidedThisFrame = true;
                                collisionTilePos = collisionTilePos || { tx, ty };
                                if (stopOnCollision) zeroVelY();
                                stopVertical = true;
                                break;
                            }
                        } else {
                            const overlap = tileBottom - top;
                            if (overlap > EPS) {
                                // push entity down
                                entity.y += overlap;
                                top = entity.y + offsetY;
                                bottom = top + hitboxHeight;
                                collidedThisFrame = true;
                                collisionTilePos = collisionTilePos || { tx, ty };
                                if (stopOnCollision) zeroVelY();
                                stopVertical = true;
                                break;
                            }
                        }
                    }
                }
            }

            // log once per frame (existing mechanism)
            if (collidedThisFrame && !entity.wallCollisionLogged) {
                const pos = collisionTilePos ? ` at tile (${collisionTilePos.tx}, ${collisionTilePos.ty})` : '';
                console.log(`🚧 ${entity.template.name} collided with wall${pos}`);
                entity.wallCollisionLogged = true;
                setTimeout(() => { if (entity) entity.wallCollisionLogged = false; }, 100);
            }
        });
    }
};