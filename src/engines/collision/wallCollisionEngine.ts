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
        if (!screenMap || !screenMap.layers?.collision || !allAssets) {
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
            return;
        }

        // Convert collision layer to behavior map (numeric values with tile properties)
        const behaviorMapData = generateBehaviorMapData(screenMap, tileset);

        const mapW = screenMap.activeAreaWidth ?? screenMap.width;
        const mapH = screenMap.activeAreaHeight ?? screenMap.height;
        const EPS = 1e-6;

        // Helper function to get tile value from behavior map
        const getTileValue = (tx: number, ty: number, allowEdgeExit: boolean = false): number => {
            // Allow entities to exit through screen edges
            if (allowEdgeExit && (tx < 0 || tx >= mapW)) {
                return 0; // No collision at horizontal screen edges
            }
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

            // Initialize collision flags if they don't exist (first frame)
            if (entity.isGrounded === undefined) entity.isGrounded = false;
            if (entity.isTouchingCeiling === undefined) entity.isTouchingCeiling = false;
            if (entity.isTouchingWallLeft === undefined) entity.isTouchingWallLeft = false;
            if (entity.isTouchingWallRight === undefined) entity.isTouchingWallRight = false;

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

                // Only check the leading edge tile based on movement direction
                const checkTileX = dirX > 0
                    ? Math.floor((right - EPS) / tileSize)  // Moving right: check right edge
                    : Math.floor(left / tileSize);           // Moving left: check left edge

                // ALLOW EDGE EXIT: Skip entire horizontal collision check if near screen edge
                const SCREEN_WIDTH_PX = mapW * tileSize;
                const EDGE_THRESHOLD = hitboxWidth;
                const isNearLeftEdge = left < EDGE_THRESHOLD;
                const isNearRightEdge = right > SCREEN_WIDTH_PX - EDGE_THRESHOLD;
                const allowEdgeExit = (dirX < 0 && isNearLeftEdge) || (dirX > 0 && isNearRightEdge);

                if (!allowEdgeExit) {
                    // Only do collision check if NOT allowing edge exit
                    let stopHorizontal = false;
                    for (let ty = startTileY; ty <= endTileY && !stopHorizontal; ty++) {
                        const tx = checkTileX;
                        const tileValue = getTileValue(tx, ty);

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
                            entity.isTouchingWallRight = true; // Touching wall on the right
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
                            entity.isTouchingWallLeft = true; // Touching wall on the left
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
                                // push entity up (touching ground)
                                entity.y -= overlap;
                                top = entity.y + offsetY;
                                bottom = top + hitboxHeight;
                                collidedThisFrame = true;
                                collisionTilePos = collisionTilePos || { tx, ty };
                                entity.isGrounded = true; // Entity is on the ground
                                if (stopOnCollision) zeroVelY();
                                stopVertical = true;
                                break;
                            }
                        } else {
                            const overlap = tileBottom - top;
                            if (overlap > EPS) {
                                // push entity down (touching ceiling)
                                entity.y += overlap;
                                top = entity.y + offsetY;
                                bottom = top + hitboxHeight;
                                collidedThisFrame = true;
                                collisionTilePos = collisionTilePos || { tx, ty };
                                entity.isTouchingCeiling = true; // Entity hit ceiling
                                if (stopOnCollision) zeroVelY();
                                stopVertical = true;
                                break;
                            }
                        }
                    }
                }
            }

            // After collision resolution, check if entity is STILL touching ground (even if stationary)
            // This prevents gravity from being applied on next frame if entity is resting on ground
            left = entity.x + offsetX;
            top = entity.y + offsetY;
            right = left + hitboxWidth;
            bottom = top + hitboxHeight;

            // Check tiles directly below entity
            const tileYBelow = Math.floor(bottom / tileSize);
            const startTileXBelow = Math.floor(left / tileSize);
            const endTileXBelow = Math.floor((right - EPS) / tileSize);

            let touchingGroundNow = false;
            for (let tx = startTileXBelow; tx <= endTileXBelow; tx++) {
                const tileValue = getTileValue(tx, tileYBelow);
                if (tileValue !== 0) {
                    const familyId = (tileValue >> 4) & 0x0F;
                    if (familyId >= 1) { // solid tile
                        const tileTop = tileYBelow * tileSize;
                        // Check if entity bottom is very close to tile top (within 1 pixel tolerance)
                        if (Math.abs(bottom - tileTop) <= 1) {
                            touchingGroundNow = true;
                            break;
                        }
                    }
                }
            }

            // Update isGrounded flag based on current state
            if (touchingGroundNow) {
                entity.isGrounded = true;
            } else if (!touchingGroundNow && vy >= 0) {
                // Only clear grounded flag if entity is falling or stationary AND not touching ground
                entity.isGrounded = false;
            }
        });
    }
};