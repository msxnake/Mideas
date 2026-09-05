#!/usr/bin/env node
/**
 * Builds a project whose enemy runs a PATH FOLLOW route, for a real ROM.
 *
 * Deliberately a sibling of test/msx2-behavior/make_visual_case.mjs rather than
 * a flag on it: that one turns a preset RULE TABLE into a project, and every
 * line of it assumes states and rules. A route has neither.
 *
 * The route is Jordi's own example, laid out along the floor of Area51-test so
 * the nodes sit on cells the body can actually reach. The first node is placed
 * AHEAD of the spawn on purpose: Enemy_test starts at x=209 (cell 13) facing
 * right, and a first node behind it is one the body walks away from — the route
 * then never fires and the engine looks broken when the fixture is.
 *
 *   1  go right      2  turn around     3  fork (policy)      4a/4b  jump / wait
 *
 * The fork policy comes from the command line, because "which exit did it take"
 * is the one thing a probe can measure and a reader cannot guess.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { build } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
const SOURCE = join(repoRoot, 'server', 'temp', 'behaviour_visual', 'case_walker.json');
const ROOM_NAME = 'Area51-test';
const ENEMY_ENTITY = 'Enemy_test';

const policy = process.argv[2] || 'fixed';
/**
 * `--loop` swaps the route for a short circuit that returns to the fork.
 *
 * The straight route branches ONCE per boot, and one branch is one sample: it
 * shows the mechanism fires and says nothing about which exits it can take. A
 * distribution needs repeats, and repeats are cheaper as laps inside one run
 * than as reboots. The circuit is deliberately small — the sample rate is the
 * speed the body walks, not the frame rate.
 */
const looping = process.argv.includes('--loop');
const outFile = process.argv.find(arg => arg.endsWith('.json'))
  || join(repoRoot, 'server', 'temp', 'behaviour_visual', `case_path_${policy}${looping ? '_loop' : ''}.json`);

const bundleDir = mkdtempSync(join(tmpdir(), 'mideas-path-case-'));
const pathBundle = join(bundleDir, 'path.mjs');
await build({
  entryPoints: [join(repoRoot, 'utils', 'msx2PathFollow.ts')],
  bundle: true, format: 'esm', platform: 'node', outfile: pathBundle, logLevel: 'silent',
});
const { bakePathFollow, pathFollowRomBytes, pathNodeLabels } = await import(pathToFileURL(pathBundle).href);

// Row 8 is the platform Enemy_test stands on in this room (its y is 128, and
// 128 >> 4 = 8). Every node sits on it, so the body reaches them by walking.
const ROW = 8;
const straightProgram = {
  startNodeId: 'n1',
  nodes: [
    { id: 'n1', cellX: 14, cellY: ROW, action: 'SET_DIR', arg: 0, next: 'n2' },   // go left
    { id: 'n2', cellX: 4,  cellY: ROW, action: 'SET_DIR', arg: 1, next: 'n3' },   // and back right
    { id: 'n3', cellX: 9,  cellY: ROW, action: 'IDLE', next: 'n4a', nextAlt: 'n4b', policy },
    { id: 'n4a', cellX: 13, cellY: ROW, action: 'JUMP', arg: 4 },
    { id: 'n4b', cellX: 6,  cellY: ROW, action: 'SET_DIR', arg: 0 },
  ],
};

/**
 * The circuit. Node 2 (index 2) is the fork and the only branching node in it,
 * which is what lets a probe count fork decisions by counting one label.
 *
 * The two exits sit on DIFFERENT cells on purpose: an exit the body reaches at
 * the same place as the other one is indistinguishable from outside, and a
 * measurement that cannot tell its two outcomes apart measures nothing. Every
 * node sits on its own cell too — two nodes stacked on one cell would let the
 * second fire on the pass meant for the first.
 *
 * The entry node keeps the straight route's cell 14 for the same reason it has
 * it there: the body spawns at cell 13 heading right, and an entry node behind
 * it is one it walks away from.
 *
 *   n1@14 turn left -> n2@7 turn right -> FORK@9 -> a:12 / b:10 -> back to n2
 */
const loopProgram = {
  startNodeId: 'n1',
  nodes: [
    { id: 'n1', cellX: 14, cellY: ROW, action: 'SET_DIR', arg: 0, next: 'n2' },
    { id: 'n2', cellX: 7,  cellY: ROW, action: 'SET_DIR', arg: 1, next: 'nf' },
    { id: 'nf', cellX: 9,  cellY: ROW, action: 'IDLE', next: 'na', nextAlt: 'nb', policy },
    { id: 'na', cellX: 12, cellY: ROW, action: 'SET_DIR', arg: 0, next: 'n2' },
    { id: 'nb', cellX: 10, cellY: ROW, action: 'SET_DIR', arg: 0, next: 'n2' },
  ],
};

const program = looping ? loopProgram : straightProgram;
/** Index of the branching node, for the probe that counts its decisions. */
const forkIndex = program.nodes.findIndex(node => node.nextAlt);

const baked = bakePathFollow(program);
if (baked.errors.length) throw new Error(`the route does not bake: ${baked.errors.join('; ')}`);

const project = JSON.parse(readFileSync(SOURCE, 'utf8'));
const assets = project.assets || [];
const behaviorAsset = assets.find(asset => asset.type === 'msx2enemybehavior');
if (!behaviorAsset) throw new Error('the project has no msx2enemybehavior asset');

behaviorAsset.name = `Path test — ${policy}`;
behaviorAsset.data = {
  ...behaviorAsset.data,
  kind: 'path_follow',
  path: program,
  // A route is kinematic; the generator forces this too, but an asset that says
  // one thing while the generator does another is a trap for the next reader.
  gravity: false,
};

const room = assets.find(asset => asset.name === ROOM_NAME);
if (!room) throw new Error(`room "${ROOM_NAME}" not found`);
const entity = (room.data.entities || []).find(item => item.name === ENEMY_ENTITY);
if (!entity) throw new Error(`entity "${ENEMY_ENTITY}" not found in ${ROOM_NAME}`);

entity.params = { ...entity.params, engine: 'scripted', movement: 'scripted', behaviorAssetId: behaviorAsset.id };
entity.components.msx2_movement = {
  ...entity.components.msx2_movement,
  // The circuit runs at 4 px per tick so a run yields tens of laps instead of a
  // handful. It stays well under 16: a body that moves a whole cell per tick can
  // step OVER a node's cell without ever standing in it, and the route would
  // look broken when the fixture was.
  mode: 'scripted', speed: looping ? 4 : 1, direction: -1,
  minX: 16, maxX: 232, minY: 16, maxY: 176, boundsUnit: 'px',
};
entity.components.msx2_ai = { ...entity.components.msx2_ai, behaviorAssetId: behaviorAsset.id };

project.name = `test600_path_${policy}`;
writeFileSync(outFile, JSON.stringify(project));

const labels = pathNodeLabels(program);
console.log(`path/${policy}${looping ? ' loop' : ''}: ${program.nodes.length} nodes, ${baked.bytes.length} bytes (${pathFollowRomBytes(program)} budgeted)`);
console.log(`  forkIndex=${forkIndex}  (the probe counts decisions by this node index)`);
console.log(`  labels: ${program.nodes.map(node => `${labels.get(node.id)}@${node.cellX},${node.cellY}`).join('  ')}`);
for (const warning of baked.warnings) console.log(`  warn: ${warning}`);
