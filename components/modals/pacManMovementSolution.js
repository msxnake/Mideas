/**
 * ENHANCED PAC-MAN MOVEMENT SYSTEM
 * Solves the "stuck when turning into walls" problem described in the solution document
 * 
 * This system implements:
 * 1. Grid-aligned movement validation
 * 2. Direction intention queueing
 * 3. Proper collision checking from aligned positions
 * 4. Integration with existing wall collision system
 */

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Checks if an entity is aligned to the grid for making turns
 * @param {Object} entity - The entity to check
 * @param {string} direction - The direction to turn ('up', 'down', 'left', 'right')
 * @param {number} tileSize - Size of each tile (default 16)
 * @param {number} tolerance - Alignment tolerance in pixels (default 2)
 * @returns {boolean} - True if entity is aligned enough to make the turn
 */
function isAlignedToGridForTurning(entity, direction, tileSize = 16, tolerance = 2) {
    const remainderX = entity.x % tileSize;
    const remainderY = entity.y % tileSize;

    if (direction === 'up' || direction === 'down') {
        // For vertical turns, must be aligned in X
        return Math.abs(remainderX) < tolerance || 
               Math.abs(remainderX - tileSize) < tolerance;
    }
    
    if (direction === 'left' || direction === 'right') {
        // For horizontal turns, must be aligned in Y
        return Math.abs(remainderY) < tolerance || 
               Math.abs(remainderY - tileSize) < tolerance;
    }
    
    return false;
}

/**
 * Enhanced CanMoveDirection that checks from aligned grid positions
 * This prevents entities from getting stuck when trying to turn into walls
 * @param {Object} entity - The entity to check
 * @param {string} direction - Direction to check ('up', 'down', 'left', 'right')
 * @param {number} tileSize - Size of each tile
 * @param {Array} collisionLayer - 2D array representing collision tiles
 * @param {number} mapWidth - Width of the map in tiles
 * @param {number} mapHeight - Height of the map in tiles
 * @returns {boolean} - True if the entity can move in that direction
 */
function canMoveDirectionFromAlignedPosition(entity, direction, tileSize, collisionLayer, mapWidth, mapHeight) {
    // Get entity hitbox properties
    const hitboxWidth = entity.hitboxWidth || 16;
    const hitboxHeight = entity.hitboxHeight || 16;
    const offsetX = entity.offsetX || 0;
    const offsetY = entity.offsetY || 0;

    let testX = entity.x;
    let testY = entity.y;

    // Calculate aligned test position based on direction
    switch (direction) {
        case 'up':
            // Align Y upward and center X
            testY = Math.floor(entity.y / tileSize) * tileSize;
            testX = Math.round(entity.x / tileSize) * tileSize + (tileSize / 2) - (hitboxWidth / 2);
            testY -= 1; // Test 1 pixel up to avoid initial collision
            break;
            
        case 'down':
            // Align Y downward and center X
            testY = Math.floor(entity.y / tileSize) * tileSize;
            testX = Math.round(entity.x / tileSize) * tileSize + (tileSize / 2) - (hitboxWidth / 2);
            testY += 1; // Test 1 pixel down
            break;
            
        case 'left':
            // Align X leftward and center Y
            testX = Math.floor(entity.x / tileSize) * tileSize;
            testY = Math.round(entity.y / tileSize) * tileSize + (tileSize / 2) - (hitboxHeight / 2);
            testX -= 1; // Test 1 pixel left
            break;
            
        case 'right':
            // Align X rightward and center Y
            testX = Math.floor(entity.x / tileSize) * tileSize;
            testY = Math.round(entity.y / tileSize) * tileSize + (tileSize / 2) - (hitboxHeight / 2);
            testX += 1; // Test 1 pixel right
            break;
            
        default:
            return false;
    }

    // Calculate test hitbox bounds
    const left = testX + offsetX;
    const top = testY + offsetY;
    const right = left + hitboxWidth;
    const bottom = top + hitboxHeight;

    // Convert to tile coordinates
    const startTileX = Math.floor(left / tileSize);
    const endTileX = Math.floor((right - 1e-6) / tileSize);
    const startTileY = Math.floor(top / tileSize);
    const endTileY = Math.floor((bottom - 1e-6) / tileSize);

    // Check collision in the test area
    for (let ty = startTileY; ty <= endTileY; ty++) {
        for (let tx = startTileX; tx <= endTileX; tx++) {
            // Bounds check
            if (tx < 0 || ty < 0 || tx >= mapWidth || ty >= mapHeight) {
                continue;
            }
            
            // Check if there's a solid tile
            const tile = collisionLayer[ty]?.[tx];
            if (tile && tile.tileId) {
                return false; // Wall found, cannot move
            }
        }
    }

    return true; // Path is clear
}

// ============================================================================
// ENHANCED PAC-MAN MOVEMENT SYSTEM
// ============================================================================

/**
 * Enhanced Pac-Man Movement System with direction queueing and grid alignment
 * This replaces the basic movement logic to prevent getting stuck in walls
 */
const enhancedPacManMovement = {
    id: 'enhancedPacManMovement',
    name: 'Enhanced Pac-Man Movement System',
    execute: (entities, componentDefinitions, screenMap) => {
        if (!screenMap || !screenMap.layers?.collision) return;

        entities.forEach(entity => {
            // Find Pac-Man movement component
            const pacMovementComp = entity.template.components.find(c => c.definitionId === 'comp_pacMovement');
            if (!pacMovementComp) return;

            // Get component properties with overrides
            const props = { 
                ...pacMovementComp.defaultValues, 
                ...(entity.instance.componentOverrides?.['comp_pacMovement'] || {}) 
            };

            if (!props.isEnabled) return;

            // Get wall collision component for hitbox info
            const wallCollisionComp = entity.template.components.find(c => c.definitionId === 'comp_wall_collision');
            if (!wallCollisionComp) return;

            const wallProps = { 
                ...wallCollisionComp.defaultValues, 
                ...(entity.instance.componentOverrides?.['comp_wall_collision'] || {}) 
            };

            const tileSize = Number(wallProps.tileSize) || 16;
            const speed = Number(props.speed) || 2;

            // Set entity hitbox properties for collision checking
            entity.hitboxWidth = Number(wallProps.hitboxWidth) || 16;
            entity.hitboxHeight = Number(wallProps.hitboxHeight) || 16;
            entity.offsetX = Number(wallProps.offsetX) || 0;
            entity.offsetY = Number(wallProps.offsetY) || 0;

            // Check for input (you'll need to integrate with your input system)
            const inputState = getInputState(entity); // This function needs to be implemented
            
            // Process direction input with queueing
            let newDesiredDirection = props.desiredDirection;
            
            if (inputState.up && !inputState.prevUp) {
                newDesiredDirection = 'up';
            } else if (inputState.down && !inputState.prevDown) {
                newDesiredDirection = 'down';
            } else if (inputState.left && !inputState.prevLeft) {
                newDesiredDirection = 'left';
            } else if (inputState.right && !inputState.prevRight) {
                newDesiredDirection = 'right';
            }

            // Try to change direction if we have a queued direction
            if (newDesiredDirection !== 'NONE' && newDesiredDirection !== props.currentDirection) {
                const isAligned = isAlignedToGridForTurning(entity, newDesiredDirection, tileSize);
                const canMove = canMoveDirectionFromAlignedPosition(
                    entity, 
                    newDesiredDirection, 
                    tileSize, 
                    screenMap.layers.collision, 
                    screenMap.width, 
                    screenMap.height
                );

                if (isAligned && canMove) {
                    // Change direction immediately
                    props.currentDirection = newDesiredDirection;
                    props.desiredDirection = 'NONE';
                    
                    // Snap to aligned position for clean turning
                    if (newDesiredDirection === 'up' || newDesiredDirection === 'down') {
                        // Align X for vertical movement
                        entity.x = Math.round(entity.x / tileSize) * tileSize + (tileSize / 2) - (entity.hitboxWidth / 2);
                    } else {
                        // Align Y for horizontal movement
                        entity.y = Math.round(entity.y / tileSize) * tileSize + (tileSize / 2) - (entity.hitboxHeight / 2);
                    }
                } else {
                    // Queue the direction for later
                    props.desiredDirection = newDesiredDirection;
                }
            }

            // Move in current direction if possible
            if (props.currentDirection !== 'NONE') {
                const canContinue = canMoveDirectionFromAlignedPosition(
                    entity, 
                    props.currentDirection, 
                    tileSize, 
                    screenMap.layers.collision, 
                    screenMap.width, 
                    screenMap.height
                );

                if (canContinue) {
                    // Apply movement
                    switch (props.currentDirection) {
                        case 'up':
                            entity.y -= speed;
                            break;
                        case 'down':
                            entity.y += speed;
                            break;
                        case 'left':
                            entity.x -= speed;
                            break;
                        case 'right':
                            entity.x += speed;
                            break;
                    }

                    // Update rotation based on direction
                    const rotateComp = entity.template.components.find(c => c.definitionId === 'comp_rotate');
                    if (rotateComp) {
                        const rotateProps = { 
                            ...rotateComp.defaultValues, 
                            ...(entity.instance.componentOverrides?.['comp_rotate'] || {}) 
                        };

                        switch (props.currentDirection) {
                            case 'right':
                                rotateProps.rotation = 0;
                                rotateProps.facingDirection = 0;
                                break;
                            case 'up':
                                rotateProps.rotation = 90;
                                rotateProps.facingDirection = 1;
                                break;
                            case 'left':
                                rotateProps.rotation = 180;
                                rotateProps.facingDirection = 2;
                                break;
                            case 'down':
                                rotateProps.rotation = 270;
                                rotateProps.facingDirection = 3;
                                break;
                        }
                    }
                } else {
                    // Can't continue in current direction, stop
                    props.currentDirection = 'NONE';
                }
            }

            // Update component overrides with new values
            if (!entity.instance.componentOverrides) {
                entity.instance.componentOverrides = {};
            }
            if (!entity.instance.componentOverrides['comp_pacMovement']) {
                entity.instance.componentOverrides['comp_pacMovement'] = {};
            }
            
            entity.instance.componentOverrides['comp_pacMovement'].currentDirection = props.currentDirection;
            entity.instance.componentOverrides['comp_pacMovement'].desiredDirection = props.desiredDirection;
        });
    }
};

// ============================================================================
// INPUT SYSTEM INTEGRATION (PLACEHOLDER)
// ============================================================================

/**
 * Get input state for an entity
 * This is a placeholder - you'll need to integrate with your actual input system
 * @param {Object} entity - The entity to get input for
 * @returns {Object} Input state with current and previous states
 */
function getInputState(entity) {
    // PLACEHOLDER - Replace this with your actual input reading logic
    // This should read from your keyboard/joystick input system
    
    return {
        up: false,      // Current frame up pressed
        down: false,    // Current frame down pressed
        left: false,    // Current frame left pressed
        right: false,   // Current frame right pressed
        prevUp: false,      // Previous frame up pressed
        prevDown: false,    // Previous frame down pressed
        prevLeft: false,    // Previous frame left pressed
        prevRight: false,   // Previous frame right pressed
    };
}

// ============================================================================
// INTEGRATION EXAMPLE
// ============================================================================

/**
 * Example of how to integrate this system with your existing ECS
 * Add this to your systems update cycle BEFORE the wall collision system
 */

export { 
    enhancedPacManMovement, 
    canMoveDirectionFromAlignedPosition, 
    isAlignedToGridForTurning 
};

/**
 * INTEGRATION INSTRUCTIONS:
 * 
 * 1. Replace your existing Pac-Man movement logic with enhancedPacManMovement
 * 2. Implement the getInputState function to read actual input
 * 3. Run this system BEFORE the wall collision system in your update cycle
 * 4. The wall collision system can remain unchanged - it will work as a safety net
 * 
 * BENEFITS:
 * - Entities no longer get stuck when trying to turn into walls
 * - Smooth, authentic Pac-Man style movement
 * - Direction queueing for responsive controls
 * - Grid-aligned turning for consistent behavior
 * - Backwards compatible with existing collision system
 */