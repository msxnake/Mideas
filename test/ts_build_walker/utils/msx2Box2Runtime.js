"use strict";
/**
 * Shared MSX2 Box2 (Sokoban push block) simulation logic.
 * Used by Play preview and mirrored by msx2Box2ComponentGenerator ASM.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MSX2_BOX2_AXIS_BOTH = exports.MSX2_BOX2_AXIS_VERTICAL = exports.MSX2_BOX2_AXIS_HORIZONTAL = exports.MSX2_BOX2_ALIGN_TOLERANCE_PX = exports.MSX2_MAX_BOX2_CHAIN = exports.MSX2_BOX2_BLOCK_PX = exports.MSX2_BOX2_GRID_UNIT = void 0;
exports.normalizeBox2Axis = normalizeBox2Axis;
exports.normalizeBox2Gravity = normalizeBox2Gravity;
exports.snapBox2Pixel = snapBox2Pixel;
exports.boxesOverlap = boxesOverlap;
exports.findBox2AtPixel = findBox2AtPixel;
exports.playerAlignedForBox2Push = playerAlignedForBox2Push;
exports.axisAllowsBox2Push = axisAllowsBox2Push;
exports.box2HasSupport = box2HasSupport;
exports.canBox2MoveTo = canBox2MoveTo;
exports.canBox2PushChain = canBox2PushChain;
exports.startBox2Slide = startBox2Slide;
exports.stepBox2Slide = stepBox2Slide;
exports.tryBox2GravityFall = tryBox2GravityFall;
exports.stepBox2GravityFall = stepBox2GravityFall;
exports.tryBox2PushFromPlayer = tryBox2PushFromPlayer;
exports.createBox2Runtime = createBox2Runtime;
exports.updateBox2Simulation = updateBox2Simulation;
exports.MSX2_BOX2_GRID_UNIT = 16;
exports.MSX2_BOX2_BLOCK_PX = 16;
exports.MSX2_MAX_BOX2_CHAIN = 3;
exports.MSX2_BOX2_ALIGN_TOLERANCE_PX = 4;
exports.MSX2_BOX2_AXIS_HORIZONTAL = 0;
exports.MSX2_BOX2_AXIS_VERTICAL = 1;
exports.MSX2_BOX2_AXIS_BOTH = 2;
function normalizeBox2Axis(value) {
    const token = String(value || 'horizontal').replace(/[\s_-]+/g, '').toLowerCase();
    if (token === 'vertical' || token === 'y')
        return exports.MSX2_BOX2_AXIS_VERTICAL;
    if (token === 'both' || token === 'all' || token === 'xy')
        return exports.MSX2_BOX2_AXIS_BOTH;
    return exports.MSX2_BOX2_AXIS_HORIZONTAL;
}
function normalizeBox2Gravity(value, defaultValue = true) {
    if (value === false || value === 'false' || value === 0 || value === '0')
        return false;
    if (value === true || value === 'true' || value === 1 || value === '1')
        return true;
    return defaultValue;
}
function snapBox2Pixel(value, gridUnit = exports.MSX2_BOX2_GRID_UNIT) {
    return Math.floor(value / gridUnit) * gridUnit;
}
function boxesOverlap(ax, ay, bx, by, size = exports.MSX2_BOX2_BLOCK_PX) {
    return ax < bx + size && ax + size > bx && ay < by + size && ay + size > by;
}
function findBox2AtPixel(boxes, px, py) {
    return boxes.find(box => boxesOverlap(box.x, box.y, px, py));
}
function playerAlignedForBox2Push(playerX, playerY, box, dx, dy, requiresAlignment) {
    if (!requiresAlignment)
        return true;
    const playerCenterY = playerY + 8;
    const boxCenterY = box.y + 8;
    const playerCenterX = playerX + 8;
    const boxCenterX = box.x + 8;
    if (dx !== 0) {
        return Math.abs(playerY - box.y) <= exports.MSX2_BOX2_ALIGN_TOLERANCE_PX;
    }
    if (dy !== 0) {
        return Math.abs(playerCenterX - boxCenterX) <= exports.MSX2_BOX2_ALIGN_TOLERANCE_PX;
    }
    return true;
}
function axisAllowsBox2Push(pushAxis, dx, dy) {
    if (dx !== 0) {
        return pushAxis === exports.MSX2_BOX2_AXIS_HORIZONTAL || pushAxis === exports.MSX2_BOX2_AXIS_BOTH;
    }
    if (dy !== 0) {
        return pushAxis === exports.MSX2_BOX2_AXIS_VERTICAL || pushAxis === exports.MSX2_BOX2_AXIS_BOTH;
    }
    return false;
}
function box2HasSupport(box, boxes, collision) {
    const floorY = box.y + exports.MSX2_BOX2_BLOCK_PX;
    if (collision.solidAt(box.x, floorY) || collision.solidAt(box.x + exports.MSX2_BOX2_BLOCK_PX - 1, floorY)) {
        return true;
    }
    const below = boxes.find(other => other !== box && boxesOverlap(other.x, other.y, box.x, floorY));
    return Boolean(below);
}
function canBox2MoveTo(x, y, boxes, ignore, collision) {
    if (x < 0 || y < 0 || x > 240 || y > 176)
        return false;
    if (collision.solidAt(x, y)
        || collision.solidAt(x + exports.MSX2_BOX2_BLOCK_PX - 1, y)
        || collision.solidAt(x, y + exports.MSX2_BOX2_BLOCK_PX - 1)
        || collision.solidAt(x + exports.MSX2_BOX2_BLOCK_PX - 1, y + exports.MSX2_BOX2_BLOCK_PX - 1)) {
        return false;
    }
    const blocked = boxes.some(other => other !== ignore && boxesOverlap(other.x, other.y, x, y));
    return !blocked;
}
function canBox2PushChain(startBox, dx, dy, boxes, collision, depth = 0) {
    if (depth >= exports.MSX2_MAX_BOX2_CHAIN)
        return false;
    const destX = startBox.x + dx;
    const destY = startBox.y + dy;
    const occupant = boxes.find(other => other !== startBox && boxesOverlap(other.x, other.y, destX, destY));
    if (!occupant) {
        return canBox2MoveTo(destX, destY, boxes, startBox, collision);
    }
    return canBox2PushChain(occupant, dx, dy, boxes, collision, depth + 1);
}
function startBox2Slide(box, dx, dy) {
    box.targetX = box.x + dx;
    box.targetY = box.y + dy;
    box.state = 'sliding';
}
function stepBox2Slide(box) {
    if (box.state !== 'sliding')
        return false;
    const speed = box.config.slideSpeed;
    let done = true;
    if (box.x < box.targetX) {
        box.x = Math.min(box.x + speed, box.targetX);
        done = false;
    }
    else if (box.x > box.targetX) {
        box.x = Math.max(box.x - speed, box.targetX);
        done = false;
    }
    if (box.y < box.targetY) {
        box.y = Math.min(box.y + speed, box.targetY);
        done = false;
    }
    else if (box.y > box.targetY) {
        box.y = Math.max(box.y - speed, box.targetY);
        done = false;
    }
    if (done) {
        box.x = snapBox2Pixel(box.x);
        box.y = snapBox2Pixel(box.y);
        box.state = 'idle';
    }
    return done;
}
function tryBox2GravityFall(boxes, collision) {
    const candidate = boxes.find(box => box.state === 'idle'
        && box.config.gravity
        && !box2HasSupport(box, boxes, collision));
    if (!candidate)
        return false;
    candidate.state = 'falling';
    return true;
}
function stepBox2GravityFall(box, boxes, collision) {
    if (box.state !== 'falling')
        return;
    if (box2HasSupport(box, boxes, collision)) {
        box.y = snapBox2Pixel(box.y);
        box.state = 'idle';
        return;
    }
    box.y = Math.min(box.y + box.config.slideSpeed, 176);
    if (box.y >= 176) {
        box.y = snapBox2Pixel(box.y);
        box.state = 'idle';
    }
}
function tryBox2PushFromPlayer(boxes, playerX, playerY, dx, dy, collision) {
    if (boxes.some(box => box.state !== 'idle'))
        return false;
    const probeX = playerX + (dx > 0 ? exports.MSX2_BOX2_BLOCK_PX : dx < 0 ? -1 : 0);
    const probeY = playerY + 8 + (dy > 0 ? exports.MSX2_BOX2_BLOCK_PX : dy < 0 ? -1 : 0);
    const box = findBox2AtPixel(boxes, probeX, probeY);
    if (!box)
        return false;
    if (!axisAllowsBox2Push(box.config.pushAxis, dx, dy))
        return false;
    if (!playerAlignedForBox2Push(playerX, playerY, box, dx, dy, box.config.requiresAlignment))
        return false;
    if (!canBox2PushChain(box, dx, dy, boxes, collision))
        return true;
    startBox2Slide(box, dx, dy);
    return false;
}
function createBox2Runtime(configs) {
    return configs.map(config => ({
        config,
        x: snapBox2Pixel(config.x),
        y: snapBox2Pixel(config.y),
        targetX: snapBox2Pixel(config.x),
        targetY: snapBox2Pixel(config.y),
        state: 'idle',
    }));
}
function updateBox2Simulation(boxes, collision) {
    const sliding = boxes.find(box => box.state === 'sliding');
    if (sliding) {
        const finished = stepBox2Slide(sliding);
        if (finished && sliding.config.gravity && !box2HasSupport(sliding, boxes, collision)) {
            sliding.state = 'falling';
        }
        return;
    }
    const falling = boxes.find(box => box.state === 'falling');
    if (falling) {
        stepBox2GravityFall(falling, boxes, collision);
        return;
    }
    tryBox2GravityFall(boxes, collision);
}
