/**
 * Shared MSX2 Box2 (Sokoban push block) simulation logic.
 * Used by Play preview and mirrored by msx2Box2ComponentGenerator ASM.
 */

export const MSX2_BOX2_GRID_UNIT = 16;
export const MSX2_BOX2_BLOCK_PX = 16;
export const MSX2_MAX_BOX2_CHAIN = 3;
export const MSX2_BOX2_ALIGN_TOLERANCE_PX = 4;

export const MSX2_BOX2_AXIS_HORIZONTAL = 0;
export const MSX2_BOX2_AXIS_VERTICAL = 1;
export const MSX2_BOX2_AXIS_BOTH = 2;

export type Msx2Box2Axis = 'horizontal' | 'vertical' | 'both';

export type Msx2Box2StateKind = 'idle' | 'sliding' | 'falling';

export interface Msx2Box2SlotConfig {
  id: string;
  x: number;
  y: number;
  pushAxis: number;
  slideSpeed: number;
  gravity: boolean;
  requiresAlignment: boolean;
  charBase: number;
}

export interface Msx2Box2SlotRuntime {
  config: Msx2Box2SlotConfig;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  state: Msx2Box2StateKind;
}

export interface Msx2Box2CollisionProbe {
  solidAt: (x: number, y: number) => boolean;
}

export function normalizeBox2Axis(value: unknown): number {
  const token = String(value || 'horizontal').replace(/[\s_-]+/g, '').toLowerCase();
  if (token === 'vertical' || token === 'y') return MSX2_BOX2_AXIS_VERTICAL;
  if (token === 'both' || token === 'all' || token === 'xy') return MSX2_BOX2_AXIS_BOTH;
  return MSX2_BOX2_AXIS_HORIZONTAL;
}

export function normalizeBox2Gravity(value: unknown, defaultValue = true): boolean {
  if (value === false || value === 'false' || value === 0 || value === '0') return false;
  if (value === true || value === 'true' || value === 1 || value === '1') return true;
  return defaultValue;
}

export function snapBox2Pixel(value: number, gridUnit = MSX2_BOX2_GRID_UNIT): number {
  return Math.floor(value / gridUnit) * gridUnit;
}

export function boxesOverlap(ax: number, ay: number, bx: number, by: number, size = MSX2_BOX2_BLOCK_PX): boolean {
  return ax < bx + size && ax + size > bx && ay < by + size && ay + size > by;
}

export function findBox2AtPixel(
  boxes: Msx2Box2SlotRuntime[],
  px: number,
  py: number
): Msx2Box2SlotRuntime | undefined {
  return boxes.find(box => boxesOverlap(box.x, box.y, px, py));
}

export function playerAlignedForBox2Push(
  playerX: number,
  playerY: number,
  box: Msx2Box2SlotRuntime,
  dx: number,
  dy: number,
  requiresAlignment: boolean
): boolean {
  if (!requiresAlignment) return true;
  const playerCenterY = playerY + 8;
  const boxCenterY = box.y + 8;
  const playerCenterX = playerX + 8;
  const boxCenterX = box.x + 8;
  if (dx !== 0) {
    return Math.abs(playerY - box.y) <= MSX2_BOX2_ALIGN_TOLERANCE_PX;
  }
  if (dy !== 0) {
    return Math.abs(playerCenterX - boxCenterX) <= MSX2_BOX2_ALIGN_TOLERANCE_PX;
  }
  return true;
}

export function axisAllowsBox2Push(pushAxis: number, dx: number, dy: number): boolean {
  if (dx !== 0) {
    return pushAxis === MSX2_BOX2_AXIS_HORIZONTAL || pushAxis === MSX2_BOX2_AXIS_BOTH;
  }
  if (dy !== 0) {
    return pushAxis === MSX2_BOX2_AXIS_VERTICAL || pushAxis === MSX2_BOX2_AXIS_BOTH;
  }
  return false;
}

export function box2HasSupport(
  box: Msx2Box2SlotRuntime,
  boxes: Msx2Box2SlotRuntime[],
  collision: Msx2Box2CollisionProbe
): boolean {
  const floorY = box.y + MSX2_BOX2_BLOCK_PX;
  if (collision.solidAt(box.x, floorY) || collision.solidAt(box.x + MSX2_BOX2_BLOCK_PX - 1, floorY)) {
    return true;
  }
  const below = boxes.find(other =>
    other !== box && boxesOverlap(other.x, other.y, box.x, floorY)
  );
  return Boolean(below);
}

export function canBox2MoveTo(
  x: number,
  y: number,
  boxes: Msx2Box2SlotRuntime[],
  ignore: Msx2Box2SlotRuntime | undefined,
  collision: Msx2Box2CollisionProbe
): boolean {
  if (x < 0 || y < 0 || x > 240 || y > 176) return false;
  if (
    collision.solidAt(x, y)
    || collision.solidAt(x + MSX2_BOX2_BLOCK_PX - 1, y)
    || collision.solidAt(x, y + MSX2_BOX2_BLOCK_PX - 1)
    || collision.solidAt(x + MSX2_BOX2_BLOCK_PX - 1, y + MSX2_BOX2_BLOCK_PX - 1)
  ) {
    return false;
  }
  const blocked = boxes.some(other =>
    other !== ignore && boxesOverlap(other.x, other.y, x, y)
  );
  return !blocked;
}

export function canBox2PushChain(
  startBox: Msx2Box2SlotRuntime,
  dx: number,
  dy: number,
  boxes: Msx2Box2SlotRuntime[],
  collision: Msx2Box2CollisionProbe,
  depth = 0
): boolean {
  if (depth >= MSX2_MAX_BOX2_CHAIN) return false;
  const destX = startBox.x + dx;
  const destY = startBox.y + dy;
  const occupant = boxes.find(other =>
    other !== startBox && boxesOverlap(other.x, other.y, destX, destY)
  );
  if (!occupant) {
    return canBox2MoveTo(destX, destY, boxes, startBox, collision);
  }
  return canBox2PushChain(occupant, dx, dy, boxes, collision, depth + 1);
}

export function startBox2Slide(box: Msx2Box2SlotRuntime, dx: number, dy: number): void {
  box.targetX = box.x + dx;
  box.targetY = box.y + dy;
  box.state = 'sliding';
}

export function stepBox2Slide(box: Msx2Box2SlotRuntime): boolean {
  if (box.state !== 'sliding') return false;
  const speed = box.config.slideSpeed;
  let done = true;
  if (box.x < box.targetX) {
    box.x = Math.min(box.x + speed, box.targetX);
    done = false;
  } else if (box.x > box.targetX) {
    box.x = Math.max(box.x - speed, box.targetX);
    done = false;
  }
  if (box.y < box.targetY) {
    box.y = Math.min(box.y + speed, box.targetY);
    done = false;
  } else if (box.y > box.targetY) {
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

export function tryBox2GravityFall(
  boxes: Msx2Box2SlotRuntime[],
  collision: Msx2Box2CollisionProbe
): boolean {
  const candidate = boxes.find(box =>
    box.state === 'idle'
    && box.config.gravity
    && !box2HasSupport(box, boxes, collision)
  );
  if (!candidate) return false;
  candidate.state = 'falling';
  return true;
}

export function stepBox2GravityFall(
  box: Msx2Box2SlotRuntime,
  boxes: Msx2Box2SlotRuntime[],
  collision: Msx2Box2CollisionProbe
): void {
  if (box.state !== 'falling') return;
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

export function tryBox2PushFromPlayer(
  boxes: Msx2Box2SlotRuntime[],
  playerX: number,
  playerY: number,
  dx: number,
  dy: number,
  collision: Msx2Box2CollisionProbe
): boolean {
  if (boxes.some(box => box.state !== 'idle')) return false;
  const probeX = playerX + (dx !== 0 ? (dx > 0 ? MSX2_BOX2_BLOCK_PX : -MSX2_BOX2_BLOCK_PX) : 0);
  const probeY = playerY + 8 + (dy !== 0 ? (dy > 0 ? MSX2_BOX2_BLOCK_PX : -MSX2_BOX2_BLOCK_PX) : 0);
  const box = findBox2AtPixel(boxes, probeX, probeY);
  if (!box) return false;
  if (!axisAllowsBox2Push(box.config.pushAxis, dx, dy)) return false;
  if (!playerAlignedForBox2Push(playerX, playerY, box, dx, dy, box.config.requiresAlignment)) return false;
  if (!canBox2PushChain(box, dx, dy, boxes, collision)) return true;
  startBox2Slide(box, dx, dy);
  return false;
}

export function createBox2Runtime(configs: Msx2Box2SlotConfig[]): Msx2Box2SlotRuntime[] {
  return configs.map(config => ({
    config,
    x: snapBox2Pixel(config.x),
    y: snapBox2Pixel(config.y),
    targetX: snapBox2Pixel(config.x),
    targetY: snapBox2Pixel(config.y),
    state: 'idle' as Msx2Box2StateKind,
  }));
}

export function updateBox2Simulation(
  boxes: Msx2Box2SlotRuntime[],
  collision: Msx2Box2CollisionProbe
): void {
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
