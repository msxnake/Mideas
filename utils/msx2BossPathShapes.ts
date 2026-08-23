import { Msx2BossPathNode } from '../types';

/**
 * Shape presets for the boss path editor.
 *
 * A shape is emitted as ORDINARY NODES, not as a new curve kind: the baker, the
 * byte stream and the Z80 walker never learn that "circle" exists. That keeps
 * the feature free on hardware — a generated circle costs exactly what the same
 * route drawn by hand costs — and leaves every node draggable afterwards, which
 * is the whole point of a preset: a starting point, not a locked object.
 *
 * Round shapes come out with `spline` segments, so a dozen nodes already read as
 * a circle on screen. Cornered ones stay straight, because a smoothed pentagon
 * is not a pentagon.
 */

export type BossPathShapeKind =
  | 'circle'
  | 'ellipse'
  | 'rectangle'
  | 'polygon'
  | 'star'
  | 'zigzag'
  | 'figure8';

export interface BossPathShapeOptions {
  kind: BossPathShapeKind;
  centerX: number;
  centerY: number;
  /** Half width. A circle uses this for both axes. */
  radiusX: number;
  /** Half height. Zigzag reads it as the amplitude. */
  radiusY: number;
  /** Turns the whole shape about its centre, so an ellipse can lie diagonally. */
  rotationDeg: number;
  /** Nodes around a curve, sides of a polygon, or spikes of a star. */
  count: number;
  /** Star only: inner radius as a percentage of the outer one. */
  innerPercent?: number;
  /** Zigzag only: which way the run travels. */
  axis?: 'horizontal' | 'vertical';
  /** false walks the same shape the other way round, keeping node 1 in place. */
  clockwise?: boolean;
  /** Authoring area. Nodes outside it are pulled in, and the caller is told. */
  bounds?: { width: number; height: number };
}

export interface BossPathShapeResult {
  nodes: Msx2BossPathNode[];
  /** A closed shape is only that shape if it loops, so the caller forces loopMode. */
  closed: boolean;
  warnings: string[];
}

export const DEFAULT_BOSS_PATH_SHAPE: BossPathShapeOptions = {
  kind: 'circle',
  centerX: 128,
  centerY: 96,
  radiusX: 56,
  radiusY: 40,
  rotationDeg: 0,
  count: 12,
  innerPercent: 45,
  axis: 'horizontal',
  clockwise: true,
};

const TAU = Math.PI * 2;
/** A vertex at 12 o'clock is what makes a triangle, a pentagon or a star look upright. */
const TOP = -Math.PI / 2;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** Clamps a count and says so, so the UI never looks like it ignored the field. */
function clampCount(value: number, min: number, max: number, name: string, notes: string[]): number {
  const wanted = Math.round(Number(value) || 0);
  const got = clamp(wanted, min, max);
  if (got !== wanted) notes.push(`${name} clamped to ${got} (allowed ${min}–${max})`);
  return got;
}

interface ShapeOutline {
  points: Array<{ x: number; y: number }>;
  closed: boolean;
  /** Whether the nodes should be joined by smooth curves instead of straight lines. */
  smooth: boolean;
  notes: string[];
}

/** The bare outline: centred, unrotated, still in floating point. */
function shapeOutline(options: BossPathShapeOptions): ShapeOutline {
  const cx = Math.round(Number(options.centerX) || 0);
  const cy = Math.round(Number(options.centerY) || 0);
  const rx = Math.max(1, Math.round(Number(options.radiusX) || 0));
  // A circle is an ellipse that ignores the second radius. Ignoring it beats
  // hiding the field and silently rewriting whatever the author had typed there.
  const ry = options.kind === 'circle' ? rx : Math.max(1, Math.round(Number(options.radiusY) || 0));
  const notes: string[] = [];
  const points: Array<{ x: number; y: number }> = [];

  switch (options.kind) {
    case 'circle':
    case 'ellipse': {
      const count = clampCount(options.count, 3, 64, 'Nodes', notes);
      for (let i = 0; i < count; i++) {
        const t = TOP + (i / count) * TAU;
        points.push({ x: cx + rx * Math.cos(t), y: cy + ry * Math.sin(t) });
      }
      return { points, closed: true, smooth: true, notes };
    }

    case 'rectangle':
      // Axis-aligned corners. Four points sampled off an ellipse would give a
      // diamond instead, which is what `polygon` with 4 sides is for.
      points.push(
        { x: cx - rx, y: cy - ry },
        { x: cx + rx, y: cy - ry },
        { x: cx + rx, y: cy + ry },
        { x: cx - rx, y: cy + ry },
      );
      return { points, closed: true, smooth: false, notes };

    case 'polygon': {
      const sides = clampCount(options.count, 3, 12, 'Sides', notes);
      for (let i = 0; i < sides; i++) {
        const t = TOP + (i / sides) * TAU;
        points.push({ x: cx + rx * Math.cos(t), y: cy + ry * Math.sin(t) });
      }
      return { points, closed: true, smooth: false, notes };
    }

    case 'star': {
      const spikes = clampCount(options.count, 3, 12, 'Points', notes);
      const inner = clamp(Number(options.innerPercent ?? 45), 10, 90) / 100;
      for (let i = 0; i < spikes * 2; i++) {
        const t = TOP + (i / (spikes * 2)) * TAU;
        const scale = i % 2 === 0 ? 1 : inner;
        points.push({ x: cx + rx * scale * Math.cos(t), y: cy + ry * scale * Math.sin(t) });
      }
      return { points, closed: true, smooth: false, notes };
    }

    case 'zigzag': {
      const count = clampCount(options.count, 2, 32, 'Nodes', notes);
      const vertical = options.axis === 'vertical';
      for (let i = 0; i < count; i++) {
        const along = count > 1 ? (i / (count - 1)) * 2 - 1 : 0;   // -1 .. 1
        const across = i % 2 === 0 ? -1 : 1;
        points.push(vertical
          ? { x: cx + rx * across, y: cy + ry * along }
          : { x: cx + rx * along, y: cy + ry * across });
      }
      // Left open on purpose: a zigzag is a patrol run, and closing it would add
      // a long straight return leg nobody drew.
      return { points, closed: false, smooth: false, notes };
    }

    case 'figure8': {
      // Gerono's lemniscate: x sweeps the width once while y sweeps the height
      // twice, which is exactly the crossing an ∞ needs. A multiple of four puts
      // a node on each crossing, so the waist stays pinned to the centre instead
      // of wobbling around it.
      const asked = clampCount(options.count, 8, 64, 'Nodes', notes);
      const count = clamp(Math.round(asked / 4) * 4, 8, 64);
      if (count !== asked) notes.push(`Nodes rounded to ${count} so one lands on each crossing`);
      for (let i = 0; i < count; i++) {
        const t = (i / count) * TAU;
        points.push({ x: cx + rx * Math.cos(t), y: cy + ry * Math.sin(2 * t) });
      }
      return { points, closed: true, smooth: true, notes };
    }

    default:
      return { points, closed: false, smooth: false, notes: [`unknown shape "${String((options as BossPathShapeOptions).kind)}"`] };
  }
}

/**
 * Turns shape parameters into path nodes, ready to drop into a Msx2BossPath.
 *
 * Everything that can go wrong here is geometric, so it comes back as a warning
 * instead of an exception: the author is dragging number fields around and wants
 * to see the bad shape, not an error.
 */
export function buildBossPathShape(options: BossPathShapeOptions): BossPathShapeResult {
  const bounds = options.bounds || { width: 256, height: 192 };
  const { points, closed, smooth, notes } = shapeOutline(options);
  const warnings = [...notes];

  const angle = ((Number(options.rotationDeg) || 0) * Math.PI) / 180;
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  const cx = Math.round(Number(options.centerX) || 0);
  const cy = Math.round(Number(options.centerY) || 0);

  // Reversing the TAIL rather than the whole list keeps node 1 where the author
  // sees it and only flips which way round the boss walks the shape.
  const ordered = options.clockwise === false && points.length > 1
    ? [points[0], ...points.slice(1).reverse()]
    : points;

  let clamped = 0;
  const nodes: Msx2BossPathNode[] = ordered.map((point, index) => {
    const dx = point.x - cx;
    const dy = point.y - cy;
    const rawX = Math.round(cx + dx * cos - dy * sin);
    const rawY = Math.round(cy + dx * sin + dy * cos);
    const x = clamp(rawX, 0, bounds.width - 1);
    const y = clamp(rawY, 0, bounds.height - 1);
    if (x !== rawX || y !== rawY) clamped++;
    const node: Msx2BossPathNode = { id: `node_${index + 1}`, x, y, actions: [] };
    if (smooth) node.segment = { mode: 'spline' };
    return node;
  });

  if (clamped) {
    warnings.push(
      `${clamped} of ${nodes.length} nodes fall outside the ${bounds.width}×${bounds.height} area and were pulled to the edge, so the shape is flattened there`,
    );
  }
  if (Math.max(options.radiusX, options.radiusY) < 4) {
    warnings.push('a radius under 4px barely moves the boss: the baked route is a couple of steps long');
  }

  return { nodes, closed, warnings };
}
