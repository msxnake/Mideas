import {
    AnimatedEntity,
    ComponentDefinition,
    ScreenMap,
    EntityTemplate,
    ProjectAsset,
    Tile
} from '../../../types';
import { generateBehaviorMapData } from '../../../components/utils/screenUtils';

type GameEngine = {
    id: string;
    name: string;
    execute: (entities: AnimatedEntity[], componentDefinitions: ComponentDefinition[], screenMap?: ScreenMap, entityTemplates?: EntityTemplate[], allAssets?: ProjectAsset[], pendingSpawns?: React.MutableRefObject<any[]>) => void;
};

export const wallCollisionEngine: GameEngine = {
    id: 'wallCollision',
    name: 'Wall Collision Engine',
    execute: (entities: AnimatedEntity[], componentDefinitions: ComponentDefinition[], screenMap?: ScreenMap, entityTemplates?: EntityTemplate[], allAssets?: ProjectAsset[]) => {
        // ALWAYS log when engine is called (to verify it's running)
        if (!wallCollisionEngine._executionLogged) {
            console.log('🚧 wallCollisionEngine.execute() called!');
            console.log('  - entities:', entities.length);
            console.log('  - screenMap:', !!screenMap);
            console.log('  - collision layer:', !!screenMap?.layers?.collision);
            console.log('  - allAssets:', !!allAssets, allAssets?.length);
            wallCollisionEngine._executionLogged = true;
        }

        if (!screenMap || !screenMap.layers?.collision || !allAssets) {
            console.warn('⚠️ wallCollisionEngine: Missing required data', {
                hasScreenMap: !!screenMap,
                hasCollisionLayer: !!screenMap?.layers?.collision,
                hasAllAssets: !!allAssets
            });
            return;
        }

        // Extract tileset from allAssets using type guard
        const tileset: Tile[] = [];
        allAssets.forEach(asset => {
            if (asset.type === 'tile' && asset.data && 'width' in asset.data && 'height' in asset.data) {
                tileset.push(asset.data as Tile);
            }
        });
        if (tileset.length === 0) {
            console.warn('⚠️ wallCollisionEngine: No tiles found in allAssets');
            return;
        }

        // Convert collision layer to behavior map (numeric values with tile properties)
        const behaviorMapData = generateBehaviorMapData(screenMap, tileset);

        const mapW = screenMap.activeAreaWidth ?? screenMap.width;
        const mapH = screenMap.activeAreaHeight ?? screenMap.height;
        const EPS = 1e-6;

        // Debug: Log behavior map info (only once)
        if (!wallCollisionEngine._debugLogged) {
            console.log('🔍 Wall Collision Engine Debug:');
            console.log('  - Map size:', mapW, 'x', mapH);
            console.log('  - Behavior map length:', behaviorMapData.length);
            console.log('  - Tileset size:', tileset.length);
            console.log('  - Sample behavior values:', behaviorMapData.slice(0, 20));
            const solidCount = behaviorMapData.filter(v => {
                const familyId = (v >> 4) & 0x0F;
                return familyId >= 1;
            }).length;
            console.log('  - Solid tiles count:', solidCount);
            wallCollisionEngine._debugLogged = true;
        }

        // Helper function to get tile value from behavior map
        const getTileValue = (tx: number, ty: number): number => {
            if (tx < 0 || ty < 0 || tx >= mapW || ty >= mapH) return 0;
            return behaviorMapData[ty * mapW + tx] || 0;
        };

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
                        // Get tile mapId (byte with properties)
                        const tileValue = getTileValue(tx, ty);

                        // Debug: log first few tile checks
                        if (!entity._tileCheckLogged && (tx === 1 || tx === 2) && ty <= 2) {
                            console.log(`  Checking tile (${tx},${ty}): value=${tileValue}, familyId=${(tileValue >> 4) & 0x0F}`);
                            if (tx === 2 && ty === 2) entity._tileCheckLogged = true;
                        }

                        if (tileValue === 0) continue;

                        // Check solid bit using mask 0x10 (binary: 00010000)
                        // familyId = (mapId >> 4) & 0x0F; if familyId >= 1, it's solid
                        const familyId = (tileValue >> 4) & 0x0F;
                        const isSolid = familyId >= 1;
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
                        // Get tile mapId (byte with properties)
                        const tileValue = getTileValue(tx, ty);
                        if (tileValue === 0) continue;

                        // Check solid bit using mask 0x10 (binary: 00010000)
                        // familyId = (mapId >> 4) & 0x0F; if familyId >= 1, it's solid
                        const familyId = (tileValue >> 4) & 0x0F;
                        const isSolid = familyId >= 1;
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