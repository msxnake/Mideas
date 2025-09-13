  wallCollision: {
        id: 'wallCollision',
        name: 'Wall Collision Engine',
        execute: (entities: AnimatedEntity[], componentDefinitions: ComponentDefinition[], screenMap?: ScreenMap) => {
            // Tile collision detection (walls, obstacles)
            if (!screenMap || !screenMap.layers?.collision) return;

            entities.forEach(entity => {
                const wallCollisionComp = entity.template.components.find(c => c.definitionId === 'comp_wall_collision');
                if (!wallCollisionComp) return;

                const props = { ...wallCollisionComp.defaultValues, ...(entity.instance.componentOverrides?.['comp_wall_collision'] || {}) };
                const hitboxWidth = Number(props.hitboxWidth) || 16;
                const hitboxHeight = Number(props.hitboxHeight) || 16;
                const offsetX = Number(props.offsetX) || 0;
                const offsetY = Number(props.offsetY) || 0;
                const tileSize = Number(props.tileSize) || 8;
                const stopOnCollision = props.stopOnCollision !== 'false' && props.stopOnCollision !== false;

                // Calculate entity bounds
                const entityLeft = entity.x + offsetX;
                const entityTop = entity.y + offsetY;
                const entityRight = entityLeft + hitboxWidth;
                const entityBottom = entityTop + hitboxHeight;

                // Convert to tile coordinates
                const leftTile = Math.floor(entityLeft / tileSize);
                const topTile = Math.floor(entityTop / tileSize);
                const rightTile = Math.floor(entityRight / tileSize);
                const bottomTile = Math.floor(entityBottom / tileSize);

                // Check collision tiles in the entity's area
                for (let tileY = topTile; tileY <= bottomTile; tileY++) {
                    for (let tileX = leftTile; tileX <= rightTile; tileX++) {
                        // Bounds check
                        if (tileX < 0 || tileY < 0 || 
                            tileX >= (screenMap.width || 0) || 
                            tileY >= (screenMap.height || 0)) {
                            continue;
                        }

                        // Check if there's a solid tile at this position
                        const tileOnLayer = screenMap.layers.collision[tileY]?.[tileX];
                        if (tileOnLayer && tileOnLayer.tileId) {
                            // Solid tile found - push entity back
                            const tileLeft = tileX * tileSize;
                            const tileTop = tileY * tileSize;
                            const tileRight = tileLeft + tileSize;
                            const tileBottom = tileTop + tileSize;

                            // Calculate overlap
                            const overlapLeft = entityRight - tileLeft;
                            const overlapRight = tileRight - entityLeft;
                            const overlapTop = entityBottom - tileTop;
                            const overlapBottom = tileBottom - entityTop;

                            // Find smallest overlap to determine push direction
                            const minOverlapX = Math.min(overlapLeft, overlapRight);
                            const minOverlapY = Math.min(overlapTop, overlapBottom);

                            if (minOverlapX < minOverlapY) {
                                // Horizontal collision - push horizontally
                                if (overlapLeft < overlapRight) {
                                    entity.x = tileLeft - hitboxWidth - offsetX; // Push left
                                } else {
                                    entity.x = tileRight - offsetX; // Push right
                                }
                            } else {
                                // Vertical collision - push vertically
                                if (overlapTop < overlapBottom) {
                                    entity.y = tileTop - hitboxHeight - offsetY; // Push up
                                } else {
                                    entity.y = tileBottom - offsetY; // Push down
                                }
                            }

                            // Stop velocity if enabled and entity has movement component
                            if (stopOnCollision) {
                                const movementComp = entity.template.components.find(c => c.definitionId === 'comp_movement');
                                if (movementComp) {
                                    entity.velocityX = 0;
                                    entity.velocityY = 0;
                                }
                            }

                            // Only log wall collision once per entity per frame
                            if (!entity.wallCollisionLogged) {
                                console.log(`🚧 ${entity.template.name} collided with wall at tile (${tileX}, ${tileY})`);
                                entity.wallCollisionLogged = true;
                                // Reset flag after a short delay to allow new collision detection
                                setTimeout(() => {
                                    if (entity) entity.wallCollisionLogged = false;
                                }, 100);
                            }
                        }
                    }
                }
            });
        }
    },