/**
 * Pac-Man Movement System for JavaScript Preview
 * 
 * Implements the same logic as the ASM version but in JavaScript
 * for the PC preview system. Provides pixel-perfect movement,
 * 8-pixel collision checking, and direction intention system.
 */

// Direction constants
const DIRECTION = {
    NONE: 0,
    LEFT: 1,
    RIGHT: 2,
    UP: 3,
    DOWN: 4
};

// Direction names (for debugging and component values)
const DIRECTION_NAMES = ['NONE', 'LEFT', 'RIGHT', 'UP', 'DOWN'];

// Velocity mapping for each direction
const DIRECTION_VELOCITIES = {
    [DIRECTION.NONE]: { vx: 0, vy: 0 },
    [DIRECTION.LEFT]: { vx: -1, vy: 0 },
    [DIRECTION.RIGHT]: { vx: 1, vy: 0 },
    [DIRECTION.UP]: { vx: 0, vy: -1 },
    [DIRECTION.DOWN]: { vx: 0, vy: 1 }
};

// Opposite direction mapping
const OPPOSITE_DIRECTION = {
    [DIRECTION.NONE]: DIRECTION.NONE,
    [DIRECTION.LEFT]: DIRECTION.RIGHT,
    [DIRECTION.RIGHT]: DIRECTION.LEFT,
    [DIRECTION.UP]: DIRECTION.DOWN,
    [DIRECTION.DOWN]: DIRECTION.UP
};

/**
 * Pac-Man Movement System class
 * Processes all entities with pacMovement components
 */
export class PacManMovementSystem {
    constructor() {
        this.keyState = {
            left: false,
            right: false,
            up: false,
            down: false
        };
        this.bindKeyboardEvents();
    }

    /**
     * Bind keyboard events for input handling
     */
    bindKeyboardEvents() {
        document.addEventListener('keydown', (event) => {
            switch(event.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.keyState.left = true;
                    event.preventDefault();
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.keyState.right = true;
                    event.preventDefault();
                    break;
                case 'ArrowUp':
                case 'KeyW':
                    this.keyState.up = true;
                    event.preventDefault();
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.keyState.down = true;
                    event.preventDefault();
                    break;
            }
        });

        document.addEventListener('keyup', (event) => {
            switch(event.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.keyState.left = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.keyState.right = false;
                    break;
                case 'ArrowUp':
                case 'KeyW':
                    this.keyState.up = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.keyState.down = false;
                    break;
            }
        });
    }

    /**
     * Get current input direction based on key state
     * @returns {number} Direction constant
     */
    getCurrentInputDirection() {
        if (this.keyState.left) return DIRECTION.LEFT;
        if (this.keyState.right) return DIRECTION.RIGHT;
        if (this.keyState.up) return DIRECTION.UP;
        if (this.keyState.down) return DIRECTION.DOWN;
        return DIRECTION.NONE;
    }

    /**
     * Check if entity can move in specified direction
     * @param {Object} entity - Entity with position and collision info
     * @param {number} direction - Direction to check
     * @param {Array} collisionTiles - Collision layer data
     * @param {number} mapWidth - Map width in tiles
     * @param {number} mapHeight - Map height in tiles
     * @returns {boolean} True if movement is possible
     */
    canMoveInDirection(entity, direction, collisionTiles, mapWidth, mapHeight) {
        const tileSize = 8; // MSX tile size
        let checkX = entity.x;
        let checkY = entity.y;

        // Calculate position to check based on direction
        switch (direction) {
            case DIRECTION.LEFT:
                checkX -= tileSize;
                break;
            case DIRECTION.RIGHT:
                checkX += 16; // Entity width
                break;
            case DIRECTION.UP:
                checkY -= tileSize;
                break;
            case DIRECTION.DOWN:
                checkY += 16; // Entity height
                break;
            default:
                return true; // No direction, no collision
        }

        // Convert pixel coordinates to tile coordinates
        const tileX = Math.floor(checkX / tileSize);
        const tileY = Math.floor(checkY / tileSize);

        // Check bounds
        if (tileX < 0 || tileX >= mapWidth || tileY < 0 || tileY >= mapHeight) {
            return false; // Out of bounds
        }

        // Check collision tile
        if (collisionTiles && collisionTiles[tileY] && collisionTiles[tileY][tileX]) {
            const tile = collisionTiles[tileY][tileX];
            if (tile && tile.tileId) {
                // Simple collision check - you may need more complex logic here
                // For now, assume any tile with tileId is solid
                return false;
            }
        }

        return true; // No collision
    }

    /**
     * Check if two directions are opposite
     * @param {number} dir1 - First direction
     * @param {number} dir2 - Second direction
     * @returns {boolean} True if directions are opposite
     */
    areDirectionsOpposite(dir1, dir2) {
        return OPPOSITE_DIRECTION[dir1] === dir2;
    }

    /**
     * Update Pac-Man movement for a single entity
     * @param {Object} entity - Entity to update
     * @param {Object} pacMovement - PacMovement component data
     * @param {Array} collisionTiles - Collision layer data
     * @param {number} mapWidth - Map width in tiles
     * @param {number} mapHeight - Map height in tiles
     * @param {number} deltaTime - Time since last update
     */
    updatePacManEntity(entity, pacMovement, collisionTiles, mapWidth, mapHeight, deltaTime) {
        if (!pacMovement.isEnabled) return;

        // Convert direction strings to numbers if needed
        let currentDir = typeof pacMovement.currentDirection === 'string' 
            ? DIRECTION_NAMES.indexOf(pacMovement.currentDirection) 
            : pacMovement.currentDirection || DIRECTION.NONE;
        
        let desiredDir = typeof pacMovement.desiredDirection === 'string'
            ? DIRECTION_NAMES.indexOf(pacMovement.desiredDirection)
            : pacMovement.desiredDirection || DIRECTION.NONE;

        // Get player input for desired direction
        const inputDir = this.getCurrentInputDirection();
        if (inputDir !== DIRECTION.NONE) {
            desiredDir = inputDir;
            pacMovement.desiredDirection = DIRECTION_NAMES[inputDir];
        }

        // Check if we're at a tile boundary (for direction changes)
        const atTileBoundaryX = (entity.x % 8) === 0;
        const atTileBoundaryY = (entity.y % 8) === 0;
        const atTileBoundary = atTileBoundaryX && atTileBoundaryY;

        // Direction change logic
        if (atTileBoundary && desiredDir !== DIRECTION.NONE && desiredDir !== currentDir) {
            if (this.areDirectionsOpposite(currentDir, desiredDir)) {
                // Allow immediate reverse direction
                currentDir = desiredDir;
                pacMovement.currentDirection = DIRECTION_NAMES[currentDir];
                desiredDir = DIRECTION.NONE;
                pacMovement.desiredDirection = 'NONE';
            } else if (this.canMoveInDirection(entity, desiredDir, collisionTiles, mapWidth, mapHeight)) {
                // Change to perpendicular direction if path is clear
                currentDir = desiredDir;
                pacMovement.currentDirection = DIRECTION_NAMES[currentDir];
                desiredDir = DIRECTION.NONE;
                pacMovement.desiredDirection = 'NONE';
            }
            // If can't turn, keep desired direction for next opportunity
        }

        // Movement logic
        if (currentDir !== DIRECTION.NONE) {
            // Check collision in current direction
            if (this.canMoveInDirection(entity, currentDir, collisionTiles, mapWidth, mapHeight)) {
                // Apply movement
                const velocity = DIRECTION_VELOCITIES[currentDir];
                const speed = pacMovement.speed || 1;
                
                entity.x += velocity.vx * speed;
                entity.y += velocity.vy * speed;

                // Update velocities for physics integration
                entity.vx = velocity.vx * speed;
                entity.vy = velocity.vy * speed;

                // Update pixel counter
                pacMovement.pixelCounter = (pacMovement.pixelCounter + speed) % 8;

                // Update component velocities
                pacMovement.velocityX = velocity.vx * speed;
                pacMovement.velocityY = velocity.vy * speed;
            } else {
                // Hit wall, stop movement if no input or input can't be satisfied
                if (pacMovement.stopOnWall && desiredDir === DIRECTION.NONE) {
                    currentDir = DIRECTION.NONE;
                    pacMovement.currentDirection = 'NONE';
                    entity.vx = 0;
                    entity.vy = 0;
                    pacMovement.velocityX = 0;
                    pacMovement.velocityY = 0;
                }
            }
        } else {
            // No current movement
            entity.vx = 0;
            entity.vy = 0;
            pacMovement.velocityX = 0;
            pacMovement.velocityY = 0;
        }

        // Update rotation/facing direction
        this.updateEntityRotation(entity, currentDir);
    }

    /**
     * Update entity rotation based on movement direction
     * @param {Object} entity - Entity to update
     * @param {number} direction - Current movement direction
     */
    updateEntityRotation(entity, direction) {
        // Update rotation component if it exists
        if (entity.componentOverrides && entity.componentOverrides.comp_rotate) {
            const rotate = entity.componentOverrides.comp_rotate;
            switch (direction) {
                case DIRECTION.RIGHT:
                    rotate.rotation = 0;
                    rotate.facingDirection = 0;
                    break;
                case DIRECTION.UP:
                    rotate.rotation = 90;
                    rotate.facingDirection = 1;
                    break;
                case DIRECTION.LEFT:
                    rotate.rotation = 180;
                    rotate.facingDirection = 2;
                    break;
                case DIRECTION.DOWN:
                    rotate.rotation = 270;
                    rotate.facingDirection = 3;
                    break;
            }
        }
    }

    /**
     * Process all entities with pacMovement components
     * @param {Array} entities - Array of entity objects
     * @param {Array} collisionTiles - Collision layer data
     * @param {number} mapWidth - Map width in tiles
     * @param {number} mapHeight - Map height in tiles
     * @param {number} deltaTime - Time since last update
     */
    processEntities(entities, collisionTiles, mapWidth, mapHeight, deltaTime = 16.67) {
        entities.forEach(entity => {
            // Check if entity has pacMovement component
            const pacMovement = entity.componentOverrides?.comp_pacMovement 
                || entity.template?.components?.find(c => c.definitionId === 'comp_pacMovement')?.defaultValues;

            if (pacMovement) {
                this.updatePacManEntity(entity, pacMovement, collisionTiles, mapWidth, mapHeight, deltaTime);
            }
        });
    }
}

/**
 * Singleton instance for global use
 */
export const pacManMovementSystem = new PacManMovementSystem();

/**
 * Utility function to integrate with existing preview system
 * Call this in your animation loop to update Pac-Man entities
 * 
 * @param {Array} entities - Array of animated entities
 * @param {ScreenMap} screenMap - Screen map with collision data
 * @param {number} deltaTime - Time since last frame
 */
export function updatePacManMovement(entities, screenMap, deltaTime = 16.67) {
    if (!entities || !screenMap) return;

    const collisionTiles = screenMap.layers.collision;
    const mapWidth = screenMap.width;
    const mapHeight = screenMap.height;

    pacManMovementSystem.processEntities(entities, collisionTiles, mapWidth, mapHeight, deltaTime);
}

/**
 * Enhanced entity update function that can be used in ScreenPreviewModal
 * Returns updated entity state for Pac-Man entities
 * 
 * @param {Object} entity - Entity to update
 * @param {ScreenMap} screenMap - Screen map data
 * @param {number} deltaTime - Time delta
 * @returns {Object} Updated entity
 */
export function updatePacManEntity(entity, screenMap, deltaTime = 16.67) {
    const pacMovement = entity.componentOverrides?.comp_pacMovement;
    
    if (!pacMovement) return entity;

    const collisionTiles = screenMap.layers.collision;
    const mapWidth = screenMap.width;
    const mapHeight = screenMap.height;

    pacManMovementSystem.updatePacManEntity(
        entity, 
        pacMovement, 
        collisionTiles, 
        mapWidth, 
        mapHeight, 
        deltaTime
    );

    return entity;
}