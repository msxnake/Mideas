import { Msx2BossPath, Msx2BossPathAction, Msx2BossPathNode, Msx2BossPathSegment } from '../types';

/**
 * Bakes a boss path into the byte stream the Z80 interpreter walks.
 *
 * The whole point is that the MSX does no maths: the curve is evaluated here,
 * resampled to constant speed, and quantised into per-tick deltas that already
 * respect the consumer's limits. A path the editor lets you draw can therefore
 * never be illegal on hardware — at worst it takes longer to walk.
 *
 * Stream format (one byte per body update, plus escaped actions):
 *
 *   #00..#EF  movement step: high nibble = dx + 8, low nibble = dy + 8
 *   #F1 n     wait n ticks          #F2 s    fire shoot pattern s (0 = one aimed bullet)
 *   #F3 px    set speed             #F4 n    set animation frame
 *   #FF       end of path (the runtime applies the loop mode)
 *
 * A movement step can never reach #F0 because dx + 8 tops out at 10, which is
 * what leaves the whole #F0..#FF range free for opcodes.
 */

export const PATH_OP_WAIT = 0xf1;
export const PATH_OP_FIRE = 0xf2;
export const PATH_OP_SET_SPEED = 0xf3;
export const PATH_OP_SET_ANIM = 0xf4;
export const PATH_OP_END = 0xff;

/** Every opcode is followed by exactly one argument byte, which keeps walkers trivial. */
export const PATH_OP_ARG_BYTES = 1;

/** Limits of whoever walks the path: a bitmap boss body is far more constrained than a sprite. */
export interface BossPathBakeLimits {
  /** Largest delta per axis per tick. Bitmap boss body: 2 (4px restore strips). */
  maxDelta: number;
  /** Force even X deltas: the boss body is HMMM-blitted and wants even X. */
  evenX: boolean;
}

export const BITMAP_BOSS_PATH_LIMITS: BossPathBakeLimits = { maxDelta: 2, evenX: true };

export interface BossPathBakeResult {
  bytes: number[];
  /** Steps of movement only, i.e. how many body updates one lap takes. */
  moveSteps: number;
  /** Path bounding box relative to the first node, for out-of-room warnings. */
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  /**
   * Byte offset into `bytes` where each authored node's own script begins, i.e.
   * the point the stream has reached once the boss stands on that node. Used to
   * rotate a looping route so two bosses can share it starting at different
   * nodes instead of flying in formation.
   */
  nodeOffsets: number[];
  warnings: string[];
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

/**
 * Samples one segment. Every curve kind lives here and nothing downstream
 * changes: the resampler and the quantiser only ever see a dense point list.
 *
 * `sine` rides the straight line and adds `amplitude * sin(2π f t)` along the
 * segment's normal, so the wave follows whatever direction the author drew —
 * a vertical segment waves left/right, a diagonal one waves diagonally.
 */
function sampleSegment(
  from: { x: number; y: number },
  to: { x: number; y: number },
  segment: Msx2BossPathSegment | undefined,
  /** Neighbours, for curves that need to know where the route came from and goes next. */
  prev?: { x: number; y: number },
  next?: { x: number; y: number },
): Array<{ x: number; y: number }> {
  const spanX = to.x - from.x;
  const spanY = to.y - from.y;
  const length = Math.hypot(spanX, spanY);
  const mode = segment?.mode || 'linear';

  // Catmull-Rom: a smooth curve that passes THROUGH the nodes, so the author
  // never has to place a control point. The tangent at each end is half the
  // vector between its neighbours; a missing neighbour falls back to the
  // segment itself, which makes the ends behave like a straight line.
  if (mode === 'spline') {
    const p0 = prev || from;
    const p3 = next || to;
    const steps = Math.max(64, Math.min(4096, Math.ceil(length * 6)));
    const out: Array<{ x: number; y: number }> = [];
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      const blend = (a: number, b: number, c: number, d: number) => 0.5 * (
        2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3
      );
      out.push({ x: blend(p0.x, from.x, to.x, p3.x), y: blend(p0.y, from.y, to.y, p3.y) });
    }
    return out;
  }

  const amplitude = mode === 'sine' ? Math.max(0, Math.floor(Number(segment?.amplitude) || 0)) : 0;
  const frequency = mode === 'sine' ? Math.max(0.25, Number(segment?.frequency) || 1) : 0;

  // A wave is longer than its chord, and a dense sine needs finer sampling to
  // measure that length honestly. Scale with both.
  const arcGuess = length + (amplitude * frequency * 4);
  const steps = Math.max(64, Math.min(4096, Math.ceil(arcGuess * 4)));

  // Unit normal of the segment; a zero-length segment has no direction to wave
  // along, so it degenerates to a point.
  const normalX = length > 0 ? -spanY / length : 0;
  const normalY = length > 0 ? spanX / length : 0;

  const out: Array<{ x: number; y: number }> = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const wave = amplitude ? Math.sin(2 * Math.PI * frequency * t) * amplitude : 0;
    out.push({
      x: from.x + spanX * t + normalX * wave,
      y: from.y + spanY * t + normalY * wave,
    });
  }
  return out;
}

/** Compiles one node's action list into stream bytes. */
function bakeActions(
  actions: Msx2BossPathAction[] | undefined,
  limits: BossPathBakeLimits,
  warnings: string[],
  resolveShootIndex: (id: string | undefined) => number,
): number[] {
  const out: number[] = [];
  for (const action of actions || []) {
    switch (action?.action) {
      case 'wait': {
        // 255 is the largest single wait; longer pauses just chain opcodes.
        let frames = Math.max(1, Math.floor(Number(action.frames) || 0));
        while (frames > 0) {
          const chunk = Math.min(255, frames);
          out.push(PATH_OP_WAIT, chunk);
          frames -= chunk;
        }
        break;
      }
      case 'fire':
        // The argument names a shoot definition; 0 keeps the plain aimed bullet,
        // so a path authored before the shoot assets existed still works.
        out.push(PATH_OP_FIRE, resolveShootIndex(action.shootId) & 0xff);
        break;
      case 'setSpeed':
        out.push(PATH_OP_SET_SPEED, clamp(Math.floor(Number(action.speed) || 1), 1, limits.maxDelta));
        break;
      case 'setAnimFrame':
        out.push(PATH_OP_SET_ANIM, clamp(Math.floor(Number(action.frame) || 0), 0, 3));
        break;
      default:
        warnings.push(`unknown path action "${String((action as any)?.action)}"; skipped`);
    }
  }
  return out;
}

/**
 * Walks the sampled curve emitting one movement byte per body update.
 *
 * Two things make this behave: the walk advances by arc length (so the boss
 * keeps a constant speed instead of racing down the straight bits), and the
 * fractional remainder of every step is carried over (so rounding to whole
 * pixels never lets the path drift away from the authored line).
 */
function bakeMovement(
  samples: Array<{ x: number; y: number }>,
  origin: { x: number; y: number },
  speed: number,
  limits: BossPathBakeLimits,
): { bytes: number[]; steps: number; end: { x: number; y: number } } {
  const bytes: number[] = [];
  let steps = 0;
  // Where the runtime actually is (integers) vs where the curve wants it to be.
  let posX = origin.x;
  let posY = origin.y;
  let travelled = 0;
  let prev = { x: origin.x, y: origin.y };
  let target = 0;

  for (const sample of samples) {
    travelled += Math.hypot(sample.x - prev.x, sample.y - prev.y);
    prev = sample;
    while (travelled >= target + speed) {
      target += speed;
      // Emit as many capped steps as it takes to reach this sample.
      let dx = Math.round(sample.x - posX);
      let dy = Math.round(sample.y - posY);
      dx = clamp(dx, -limits.maxDelta, limits.maxDelta);
      dy = clamp(dy, -limits.maxDelta, limits.maxDelta);
      if (limits.evenX && dx % 2 !== 0) dx = dx > 0 ? dx - 1 : dx + 1;
      if (dx === 0 && dy === 0) continue;
      posX += dx;
      posY += dy;
      bytes.push((((dx + 8) & 0x0f) << 4) | ((dy + 8) & 0x0f));
      steps++;
    }
  }

  // Close the gap left by the caps so the node is actually reached.
  let guard = 0;
  while ((Math.round(samples[samples.length - 1]?.x ?? posX) !== posX
    || Math.round(samples[samples.length - 1]?.y ?? posY) !== posY) && guard++ < 512) {
    const last = samples[samples.length - 1];
    let dx = clamp(Math.round(last.x) - posX, -limits.maxDelta, limits.maxDelta);
    let dy = clamp(Math.round(last.y) - posY, -limits.maxDelta, limits.maxDelta);
    if (limits.evenX && dx % 2 !== 0) dx = dx > 0 ? dx - 1 : dx + 1;
    if (dx === 0 && dy === 0) break;
    posX += dx;
    posY += dy;
    bytes.push((((dx + 8) & 0x0f) << 4) | ((dy + 8) & 0x0f));
    steps++;
  }

  return { bytes, steps, end: { x: posX, y: posY } };
}

/**
 * Bakes a whole path. Positions are relative to the first node, so the same
 * path asset can be reused wherever the boss (or later, an enemy wave) spawns.
 */
export function bakeBossPath(
  path: Msx2BossPath,
  limits: BossPathBakeLimits = BITMAP_BOSS_PATH_LIMITS,
  /** Shoot asset id -> 1-based runtime index. The editor has none, so it bakes 0s. */
  resolveShootIndex: (id: string | undefined) => number = () => 0,
): BossPathBakeResult {
  const warnings: string[] = [];
  const nodes = (path?.nodes || []).filter(node => node && Number.isFinite(node.x) && Number.isFinite(node.y));
  if (nodes.length < 1) {
    return { bytes: [PATH_OP_END], moveSteps: 0, bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 }, nodeOffsets: [0], warnings };
  }

  const speed = clamp(Math.floor(Number(path.speedPxPerTick) || limits.maxDelta), 1, limits.maxDelta);
  // With even-only X deltas an odd X target can never be reached exactly, and a
  // looping path would drift a pixel per lap. Snapping the authored nodes keeps
  // every lap identical — and the body's X is even anyway.
  const snapX = (value: number) => limits.evenX ? Math.round(value / 2) * 2 : Math.round(value);
  const snapped = nodes.map(node => ({ ...node, x: snapX(node.x), y: Math.round(node.y) }));
  const origin = { x: snapped[0].x, y: snapped[0].y };
  const bytes: number[] = [];
  let moveSteps = 0;
  let cursor = { x: 0, y: 0 };
  const bounds = { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  const track = (point: { x: number; y: number }) => {
    bounds.minX = Math.min(bounds.minX, point.x);
    bounds.minY = Math.min(bounds.minY, point.y);
    bounds.maxX = Math.max(bounds.maxX, point.x);
    bounds.maxY = Math.max(bounds.maxY, point.y);
  };

  // Where each node's own script starts. Node 0 opens the stream.
  const nodeOffsets: number[] = [0];

  // The first node's script runs before any movement.
  bytes.push(...bakeActions(snapped[0].actions, limits, warnings, resolveShootIndex));

  // A loop MUST come back to the first node. Skipping the closing leg (as a
  // two-node path would tempt you to) makes the stream a relative shape that
  // replays from wherever it ended, so the boss marches off the screen instead
  // of going back and forth.
  const ordered = path.loopMode === 'loop' && snapped.length > 1 ? [...snapped, snapped[0]] : snapped;
  for (let i = 1; i < ordered.length; i++) {
    const from = { x: ordered[i - 1].x - origin.x, y: ordered[i - 1].y - origin.y };
    const to = { x: ordered[i].x - origin.x, y: ordered[i].y - origin.y };
    // The segment config lives on the node it leaves from.
    const segment = ordered[i - 1].segment;
    // Neighbours for the spline, wrapped when the route is a closed loop.
    const wrap = (index: number) => {
      if (index >= 0 && index < ordered.length) return ordered[index];
      if (path.loopMode !== 'loop') return undefined;
      const count = ordered.length - 1;   // the last entry repeats the first
      return count > 0 ? ordered[((index % count) + count) % count] : undefined;
    };
    const prevNode = wrap(i - 2);
    const nextNode = wrap(i + 1);
    const samples = sampleSegment(
      from, to, segment,
      prevNode && { x: prevNode.x - origin.x, y: prevNode.y - origin.y },
      nextNode && { x: nextNode.x - origin.x, y: nextNode.y - origin.y },
    );
    if (segment?.mode === 'sine') {
      const length = Math.hypot(to.x - from.x, to.y - from.y);
      const amplitude = Math.max(0, Math.floor(Number(segment.amplitude) || 0));
      if (!amplitude) {
        warnings.push(`node ${i} waves with amplitude 0, so it travels straight`);
      } else if (length < amplitude) {
        warnings.push(`node ${i}: the wave is taller (${amplitude}px) than the segment is long (${Math.round(length)}px), so the boss mostly swings in place`);
      }
    }
    const moved = bakeMovement(samples, cursor, speed, limits);
    bytes.push(...moved.bytes);
    moveSteps += moved.steps;
    cursor = moved.end;
    track(cursor);
    // The closing leg back to node 0 must not replay node 0's script.
    if (i < nodes.length) {
      nodeOffsets.push(bytes.length);
      bytes.push(...bakeActions(ordered[i].actions, limits, warnings, resolveShootIndex));
    }
  }

  if (path.loopMode === 'pingpong') {
    warnings.push('pingpong paths are not baked yet; using loop instead');
  }
  bytes.push(PATH_OP_END);
  return { bytes, moveSteps, bounds, nodeOffsets, warnings };
}

/**
 * Rotate a baked LOOPING stream so it starts on `startNode` instead of node 0.
 *
 * The stream is a closed ring — the last leg returns to node 0 — so cutting it
 * at a node's script and stitching the head back on the tail yields the same
 * lap entered at a different point. Everything stays relative, so the boss
 * still departs from wherever it was placed; what changes is its PHASE. That is
 * what lets two bosses share one route without flying in formation.
 *
 * Returns the stream unchanged when there is nothing to rotate.
 */
export function rotateBakedPath(baked: BossPathBakeResult, startNode: number): number[] {
  const offsets = baked.nodeOffsets || [];
  const index = Math.floor(Number(startNode) || 0);
  if (index <= 0 || index >= offsets.length) return baked.bytes;
  const cut = offsets[index];
  if (!Number.isFinite(cut) || cut <= 0 || cut >= baked.bytes.length) return baked.bytes;
  // The terminating opcode must stay terminating, so it is peeled off first and
  // pushed back after the two halves are swapped.
  const body = baked.bytes[baked.bytes.length - 1] === PATH_OP_END
    ? baked.bytes.slice(0, -1)
    : baked.bytes.slice();
  if (cut >= body.length) return baked.bytes;
  return [...body.slice(cut), ...body.slice(0, cut), PATH_OP_END];
}

/** A blank path with the defaults the runtime expects. */
export function createMsx2BossPath(id: string, name: string): Msx2BossPath {
  return {
    id,
    name,
    nodes: [
      { id: 'node_1', x: 64, y: 32, actions: [] },
      { id: 'node_2', x: 160, y: 32, actions: [] },
    ],
    speedPxPerTick: 2,
    loopMode: 'loop',
    firing: 'auto',
  };
}
