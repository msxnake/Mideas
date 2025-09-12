/**
 * Pac-Man Preview Integration Example
 * 
 * This file shows how to integrate the Pac-Man movement system
 * with the existing ScreenPreviewModal for live preview functionality.
 * 
 * Instructions for integration:
 * 1. Import this in your ScreenPreviewModal.tsx
 * 2. Call setupPacManIntegration() in the useEffect where animation starts
 * 3. Use updateEntitiesWithPacMan() in your animation loop
 */

import { pacManMovementSystem, updatePacManEntity } from '../systems/pacmanMovementSystem.js';

/**
 * Enhanced entity updater that handles Pac-Man movement
 * This replaces the basic patrol logic in ScreenPreviewModal
 * 
 * @param {Array} entities - Array of AnimatedEntity objects
 * @param {ScreenMap} screenMap - Screen map data
 * @param {number} deltaTime - Time since last frame
 * @returns {Array} Updated entities
 */
export function updateEntitiesWithPacMan(entities, screenMap, deltaTime) {
    return entities.map(entity => {
        // Check if entity has Pac-Man movement component
        const pacMovement = entity.instance.componentOverrides?.comp_pacMovement
            || entity.template.components.find(c => c.definitionId === 'comp_pacMovement')?.defaultValues;

        if (pacMovement) {
            // Handle Pac-Man movement
            const updatedEntity = updatePacManEntity(entity, screenMap, deltaTime);
            
            // Update sprite animation based on movement
            updatePacManAnimation(updatedEntity, deltaTime);
            
            return updatedEntity;
        } else {
            // Handle other entity types (patrol, etc.) as before
            return updateRegularEntity(entity, deltaTime);
        }
    });
}

/**
 * Update Pac-Man animation based on movement state
 * @param {Object} entity - Entity to update
 * @param {number} deltaTime - Time delta
 */
function updatePacManAnimation(entity, deltaTime) {
    const now = performance.now();
    const PACMAN_ANIMATION_SPEED = 150; // ms per frame
    
    // Update animation frame
    if (now - entity.lastFrameUpdateTime > PACMAN_ANIMATION_SPEED) {
        entity.currentFrame = (entity.currentFrame + 1) % entity.frameImages.length;
        entity.lastFrameUpdateTime = now;
    }
    
    // Select correct sprite direction based on movement
    const pacMovement = entity.instance.componentOverrides?.comp_pacMovement;
    if (pacMovement && pacMovement.currentDirection !== 'NONE') {
        // Use mirrored frames for left movement if available
        if (pacMovement.currentDirection === 'LEFT' && entity.mirroredFrameImages) {
            entity.currentFrameImage = entity.mirroredFrameImages[entity.currentFrame];
        } else {
            entity.currentFrameImage = entity.frameImages[entity.currentFrame];
        }
    } else {
        // Idle animation
        entity.currentFrameImage = entity.frameImages[0];
    }
}

/**
 * Handle regular (non-Pac-Man) entity movement
 * This preserves the existing patrol behavior
 * @param {Object} entity - Entity to update
 * @param {number} deltaTime - Time delta
 */
function updateRegularEntity(entity, deltaTime) {
    let { x, y, vx, vy, currentFrame, lastFrameUpdateTime } = entity;

    // Basic movement (patrol logic)
    x += vx;
    y += vy;

    const patrolComp = entity.instance.componentOverrides?.comp_patrol;
    let startPixelX = entity.instance.position.x * 8; // TILE_SIZE
    let startPixelY = entity.instance.position.y * 8;
    let endPixelX = startPixelX;
    let endPixelY = startPixelY;

    if (patrolComp && patrolComp.waypoint1_x !== undefined && patrolComp.waypoint1_y !== undefined) {
        startPixelX = patrolComp.waypoint1_x;
        startPixelY = patrolComp.waypoint1_y;
        endPixelX = patrolComp.waypoint2_x ?? startPixelX;
        endPixelY = patrolComp.waypoint2_y ?? startPixelY;
    }

    // Bounce at waypoints
    if (vx > 0 && x >= Math.max(startPixelX, endPixelX)) { vx = -vx; x = Math.max(startPixelX, endPixelX); }
    if (vx < 0 && x <= Math.min(startPixelX, endPixelX)) { vx = -vx; x = Math.min(startPixelX, endPixelX); }
    if (vy > 0 && y >= Math.max(startPixelY, endPixelY)) { vy = -vy; y = Math.max(startPixelY, endPixelY); }
    if (vy < 0 && y <= Math.min(startPixelY, endPixelY)) { vy = -vy; y = Math.min(startPixelY, endPixelY); }

    // Update animation frame
    const now = performance.now();
    const ANIMATION_SPEED_MS = 200;
    if (now - lastFrameUpdateTime > ANIMATION_SPEED_MS) {
        currentFrame = (currentFrame + 1) % entity.frameImages.length;
        lastFrameUpdateTime = now;
    }

    return { ...entity, x, y, vx, vy, currentFrame, lastFrameUpdateTime };
}

/**
 * Setup function to initialize Pac-Man integration
 * Call this when the preview modal opens
 */
export function setupPacManIntegration() {
    // The PacManMovementSystem automatically binds keyboard events
    // No additional setup needed, but you can customize key bindings here if needed
    console.log('Pac-Man movement system initialized for preview');
}

/**
 * Enhanced rendering function that handles Pac-Man sprite rotation
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} entity - Entity to render
 */
export function renderPacManEntity(ctx, entity) {
    const pacMovement = entity.instance.componentOverrides?.comp_pacMovement;
    
    if (!pacMovement) {
        // Regular rendering
        if (entity.currentFrameImage) {
            ctx.drawImage(entity.currentFrameImage, entity.x, entity.y);
        }
        return;
    }

    // Pac-Man specific rendering with rotation
    const image = entity.currentFrameImage || entity.frameImages[entity.currentFrame];
    if (!image) return;

    const centerX = entity.x + entity.sprite.size.width / 2;
    const centerY = entity.y + entity.sprite.size.height / 2;

    ctx.save();
    ctx.translate(centerX, centerY);

    // Rotate based on movement direction
    switch (pacMovement.currentDirection) {
        case 'RIGHT':
            // No rotation needed
            break;
        case 'LEFT':
            ctx.rotate(Math.PI);
            break;
        case 'UP':
            ctx.rotate(-Math.PI / 2);
            break;
        case 'DOWN':
            ctx.rotate(Math.PI / 2);
            break;
    }

    ctx.drawImage(
        image,
        -entity.sprite.size.width / 2,
        -entity.sprite.size.height / 2
    );

    ctx.restore();
}

/**
 * Example of how to modify the ScreenPreviewModal animation loop
 * 
 * Replace the existing animation loop with this enhanced version:
 */
export function createEnhancedAnimationLoop(canvas, screenMap, tileset, currentScreenMode, entitiesRef) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.imageSmoothingEnabled = false;
    let lastTimestamp = 0;

    const animate = (timestamp) => {
        if (lastTimestamp === 0) {
            lastTimestamp = timestamp;
        }
        const deltaTime = timestamp - lastTimestamp;
        lastTimestamp = timestamp;

        // Clear and draw background
        ctx.clearRect(0, 0, 256, 192);
        // renderScreenToCanvas(canvas, screenMap, tileset, currentScreenMode, 8);

        // Update entities with enhanced Pac-Man support
        const updatedEntities = updateEntitiesWithPacMan(
            entitiesRef.current, 
            screenMap, 
            deltaTime
        );

        // Render entities
        updatedEntities.forEach(entity => {
            renderPacManEntity(ctx, entity);
        });

        entitiesRef.current = updatedEntities;
        return requestAnimationFrame(animate);
    };

    return animate;
}

/**
 * Keyboard controls help text for Pac-Man entities
 */
export const PACMAN_CONTROLS_HELP = `
Pac-Man Controls:
• Arrow Keys or WASD: Move in desired direction
• Movement changes at tile boundaries (8x8 pixels)
• Reverse direction (opposite) changes immediately
• Perpendicular direction changes only when path is clear
• No input stops movement when hitting a wall
`;

/**
 * Component properties validator for Pac-Man entities
 * Helps ensure proper component setup
 */
export function validatePacManEntity(entity) {
    const pacMovement = entity.componentOverrides?.comp_pacMovement
        || entity.template.components.find(c => c.definitionId === 'comp_pacMovement')?.defaultValues;

    if (!pacMovement) return { valid: false, error: 'No pacMovement component found' };

    const warnings = [];
    
    if (!pacMovement.speed || pacMovement.speed < 1) {
        warnings.push('Speed should be at least 1 pixel per frame');
    }
    
    if (pacMovement.tileSize !== 8) {
        warnings.push('TileSize should be 8 for MSX compatibility');
    }

    // Check if entity has position component
    const hasPosition = entity.instance.position || 
        entity.template.components.find(c => c.definitionId === 'comp_pos');
    
    if (!hasPosition) {
        return { valid: false, error: 'Pac-Man entity requires position component' };
    }

    return { 
        valid: true, 
        warnings: warnings.length > 0 ? warnings : null 
    };
}

export default {
    updateEntitiesWithPacMan,
    setupPacManIntegration,
    renderPacManEntity,
    createEnhancedAnimationLoop,
    validatePacManEntity,
    PACMAN_CONTROLS_HELP
};