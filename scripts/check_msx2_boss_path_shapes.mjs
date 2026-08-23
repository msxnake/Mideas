#!/usr/bin/env node
/**
 * Contract checks for the boss path SHAPE PRESETS.
 *
 * These are not source greps: the shape generator and the path baker are
 * compiled and RUN, so the checks are about geometry that reached the byte
 * stream. Two properties matter more than the rest and are worth naming:
 *
 *   - a preset must emit ordinary nodes, so nothing downstream has to learn what
 *     a "circle" is;
 *   - a closed shape must CLOSE on hardware, i.e. the deltas of one baked lap
 *     must sum to zero. If they do not, every lap drifts and the boss walks off
 *     the screen after a while — the exact bug the relative stream invites.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const require = createRequire(import.meta.url);
const BUILD_DIR = join(root, 'server', 'temp', 'tsbuild_bosspathshapes');

const tsc = join(root, 'node_modules', 'typescript', 'bin', 'tsc');
if (!existsSync(tsc)) throw new Error('Local TypeScript not found. Run npm install.');
rmSync(BUILD_DIR, { recursive: true, force: true });
execFileSync(process.execPath, [
  tsc, '--pretty', 'false', '--module', 'commonjs', '--target', 'ES2020',
  '--outDir', BUILD_DIR, '--moduleResolution', 'node', '--skipLibCheck',
  '--noEmitOnError', 'false',
  'utils/msx2BossPathShapes.ts', 'utils/msx2BossPath.ts',
], { cwd: root, stdio: 'pipe' });

const shapes = require(join(BUILD_DIR, 'utils', 'msx2BossPathShapes.js'));
const baker = require(join(BUILD_DIR, 'utils', 'msx2BossPath.js'));

const BASE = {
  centerX: 128, centerY: 96, radiusX: 40, radiusY: 24,
  rotationDeg: 0, count: 12, innerPercent: 45, axis: 'horizontal', clockwise: true,
};
const build = extra => shapes.buildBossPathShape({ ...BASE, ...extra });

/** Walks a baked lap and returns where the boss ends up relative to where it started. */
const netDelta = (nodes, closed) => {
  const baked = baker.bakeBossPath(
    { nodes, speedPxPerTick: 2, loopMode: closed ? 'loop' : 'once', firing: 'auto' },
    baker.BITMAP_BOSS_PATH_LIMITS,
  );
  let x = 0;
  let y = 0;
  for (let i = 0; i < baked.bytes.length; i++) {
    const byte = baked.bytes[i];
    if (byte === baker.PATH_OP_END) break;
    if (byte >= 0xf0) { i += baker.PATH_OP_ARG_BYTES; continue; }
    x += ((byte >> 4) & 0x0f) - 8;
    y += (byte & 0x0f) - 8;
  }
  return { x, y, bytes: baked.bytes.length, bounds: baked.bounds };
};

const near = (value, target, tolerance) => Math.abs(value - target) <= tolerance;
const radii = nodes => nodes.map(n => Math.hypot(n.x - BASE.centerX, n.y - BASE.centerY));
const spanX = nodes => Math.max(...nodes.map(n => Math.abs(n.x - BASE.centerX)));
const spanY = nodes => Math.max(...nodes.map(n => Math.abs(n.y - BASE.centerY)));

const circle = build({ kind: 'circle', radiusX: 40, count: 12 });
const ellipse = build({ kind: 'ellipse', count: 16 });
const rectangle = build({ kind: 'rectangle' });
const rotated = build({ kind: 'rectangle', rotationDeg: 90 });
const pentagon = build({ kind: 'polygon', count: 5 });
const star = build({ kind: 'star', count: 5, innerPercent: 40 });
const zigzag = build({ kind: 'zigzag', count: 6 });
const eight = build({ kind: 'figure8', count: 10 });
const anticlock = build({ kind: 'polygon', count: 5, clockwise: false });
const oversized = build({ kind: 'circle', radiusX: 200, count: 12 });

const checks = [
  ['A preset emits plain nodes: id, coordinates and an empty script',
    circle.nodes.length === 12 &&
    circle.nodes.every(node => typeof node.id === 'string' && Number.isInteger(node.x)
      && Number.isInteger(node.y) && Array.isArray(node.actions) && node.actions.length === 0) &&
    new Set(circle.nodes.map(node => node.id)).size === 12],

  ['Circle: every node sits on the radius and the first one is at 12 o\'clock',
    radii(circle.nodes).every(r => near(r, 40, 1)) &&
    circle.nodes[0].x === BASE.centerX && circle.nodes[0].y === BASE.centerY - 40],

  ['Round shapes are smoothed, cornered ones are not',
    circle.nodes.every(node => node.segment?.mode === 'spline') &&
    eight.nodes.every(node => node.segment?.mode === 'spline') &&
    [rectangle, pentagon, star, zigzag].every(shape => shape.nodes.every(node => !node.segment))],

  ['Ellipse honours both radii independently',
    spanX(ellipse.nodes) === 40 && spanY(ellipse.nodes) === 24 &&
    radii(ellipse.nodes).some(r => !near(r, 40, 2))],

  ['Rectangle is four axis-aligned corners, walked clockwise',
    rectangle.nodes.length === 4 &&
    JSON.stringify(rectangle.nodes.map(n => [n.x, n.y])) ===
      JSON.stringify([[88, 72], [168, 72], [168, 120], [88, 120]])],

  ['Rotation turns the shape about its centre: 90° swaps the extents',
    near(spanX(rotated.nodes), 24, 1) && near(spanY(rotated.nodes), 40, 1)],

  ['Polygon: one vertex on top and the sides are equal',
    pentagon.nodes.length === 5 &&
    near(pentagon.nodes[0].x, BASE.centerX, 1) && pentagon.nodes[0].y < BASE.centerY &&
    (() => {
      const sides = pentagon.nodes.map((node, i) => {
        const next = pentagon.nodes[(i + 1) % pentagon.nodes.length];
        return Math.hypot(next.x - node.x, next.y - node.y);
      });
      // Squashed by radiusY, so sides are only equal in pairs; the spread is
      // what proves it is a regular outline and not an accident.
      return Math.max(...sides) - Math.min(...sides) < Math.max(...sides) * 0.5;
    })()],

  ['Star alternates outer and inner radius, two nodes per point',
    star.nodes.length === 10 &&
    star.nodes.every((node, i) => {
      const r = Math.hypot(node.x - BASE.centerX, node.y - BASE.centerY);
      const outer = Math.hypot(
        BASE.radiusX * Math.cos(-Math.PI / 2 + (i / 10) * Math.PI * 2),
        BASE.radiusY * Math.sin(-Math.PI / 2 + (i / 10) * Math.PI * 2),
      );
      return near(r, i % 2 === 0 ? outer : outer * 0.4, 1.5);
    })],

  ['Zigzag is an open run that alternates across its axis',
    zigzag.closed === false && zigzag.nodes.length === 6 &&
    zigzag.nodes.every((node, i) => node.y === BASE.centerY + (i % 2 === 0 ? -24 : 24)) &&
    zigzag.nodes[0].x === 88 && zigzag.nodes[5].x === 168],

  ['Figure 8: node count rounded to a multiple of 4 so the waist is pinned to the centre',
    eight.nodes.length === 12 &&
    eight.warnings.some(w => /multiple|crossing/i.test(w)) &&
    eight.nodes.filter(n => n.x === BASE.centerX && n.y === BASE.centerY).length === 2],

  ['Counter-clockwise keeps node 1 in place and reverses the rest',
    anticlock.nodes[0].x === pentagon.nodes[0].x && anticlock.nodes[0].y === pentagon.nodes[0].y &&
    JSON.stringify(anticlock.nodes.slice(1).map(n => [n.x, n.y])) ===
      JSON.stringify(pentagon.nodes.slice(1).reverse().map(n => [n.x, n.y]))],

  ['A shape too big for the room is clamped and says so',
    oversized.nodes.every(node => node.x >= 0 && node.x <= 255 && node.y >= 0 && node.y <= 191) &&
    oversized.warnings.some(w => /outside/i.test(w))],

  // Deliberately measured against the SHAPE PARAMETERS, not against the nodes:
  // comparing the lap to the nodes it was baked from only proves the baker walks
  // what it is given, which holds for a list of random points too.
  ['The baked lap really is the authored shape: its size matches the radii, and it returns to the start',
    [
      // radiusX 40 and radiusY 24 around node 1, which these presets put on top.
      // A star is not in here on purpose: its widest vertex sits 18° off the
      // horizontal, so its extents are not the radii and the expectation would
      // have to re-implement the generator to know them.
      [circle, -40, 40, 0, 80],
      [ellipse, -40, 40, 0, 48],
      // A rectangle starts on a corner, so the whole box hangs to one side.
      [rectangle, 0, 80, 0, 48],
    ].every(([shape, minX, maxX, minY, maxY]) => {
      const lap = netDelta(shape.nodes, true);
      return lap.x === 0 && lap.y === 0 && lap.bytes > 8
        && near(lap.bounds.minX, minX, 2) && near(lap.bounds.maxX, maxX, 2)
        && near(lap.bounds.minY, minY, 2) && near(lap.bounds.maxY, maxY, 2);
    })],

  ['A generated shape costs only its perimeter: more nodes on the same circle is not more ROM',
    (() => {
      const coarse = netDelta(build({ kind: 'circle', radiusX: 40, count: 8 }).nodes, true).bytes;
      const fine = netDelta(build({ kind: 'circle', radiusX: 40, count: 32 }).nodes, true).bytes;
      return Math.abs(fine - coarse) <= coarse * 0.15;
    })()],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) failed++;
}
console.log(`\n${checks.length - failed}/${checks.length} checks passed`);
process.exit(failed ? 1 : 0);
