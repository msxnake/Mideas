#!/usr/bin/env node
/**
 * Contract for the PATH FOLLOW behaviour asset: the model, the baker and the
 * joins nobody else checks.
 *
 * The runtime guards (check_msx2_enemy_behavior_runtime.mjs) already assemble
 * the walker with Glass. What they cannot see is whether the BYTES the walker
 * reads mean what the editor showed the author. That is this file's job, and
 * every check below is about a way those two could disagree in silence.
 */
import { mkdtempSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { build } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const workDir = mkdtempSync(join(tmpdir(), 'mideas-path-follow-'));

const bundle = async (entry, name) => {
  const out = join(workDir, name);
  await build({
    entryPoints: [join(repoRoot, entry)],
    bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'silent',
  });
  return import(pathToFileURL(out).href);
};

const pathMod = await bundle('utils/msx2PathFollow.ts', 'path.mjs');
const behaviourMod = await bundle('utils/msx2EnemyBehavior.ts', 'behaviour.mjs');
const onionMod = await bundle('utils/msx2OnionRoom.ts', 'onion.mjs');
// The editor's own palette, bundled with React inlined so the checks below see
// the LIST THAT SHIPS instead of a copy of it that can drift.
const editorMod = await bundle('components/editors/Msx2PathFollowEditor.tsx', 'editor.mjs');
const {
  MSX2_PATH_NODE_BYTES, MSX2_PATH_NODE_NONE, MSX2_PATH_GRID_COLS, MSX2_PATH_MAX_NODES,
  MSX2_PATH_POLICY, MSX2_PATH_BRANCH_POLICIES,
  bakePathFollow, pathFollowRomBytes, pathNodeLabels, paletteEntryFor,
} = pathMod;
const { onionCollisionCells, onionTileUrls } = onionMod;
const { ACTIONS } = editorMod;
const { MSX2_ENEMY_ACT, MSX2_ENEMY_ACT_INFO } = behaviourMod;

let failed = 0;
const check = (label, condition) => {
  console.log(`${condition ? 'OK  ' : 'FAIL'}: ${label}`);
  if (!condition) failed++;
};

/** Jordi's own example: right, fall, random fork, jump / descend. */
const example = {
  nodes: [
    { id: 'n1', cellX: 2, cellY: 6, action: 'SET_DIR', arg: 1, next: 'n2' },
    { id: 'n2', cellX: 6, cellY: 6, action: 'FALL', next: 'n3' },
    { id: 'n3', cellX: 9, cellY: 6, action: 'IDLE', next: 'n4a', nextAlt: 'n4b', policy: 'random' },
    { id: 'n4a', cellX: 12, cellY: 4, action: 'JUMP', arg: 4 },
    { id: 'n4b', cellX: 12, cellY: 9, action: 'DESCEND' },
  ],
};
const baked = bakePathFollow(example);

// ---- the record the walker indexes ------------------------------------------
check('A route is one count byte plus a fixed record per node',
  baked.bytes.length === 1 + example.nodes.length * MSX2_PATH_NODE_BYTES
  && baked.bytes[0] === example.nodes.length);
check('The editor budget agrees with the baker, byte for byte',
  pathFollowRomBytes(example) === baked.bytes.length);
// THE BUG THIS GUARDS: the walker addresses node N at base + N*5. A variable
// record would need an offset table, and a record that quietly grew would send
// every index past the first into the middle of another node.
check('Every record is the same size, which is what makes index * 5 legal',
  (baked.bytes.length - 1) % MSX2_PATH_NODE_BYTES === 0);

const record = (index) => baked.bytes.slice(1 + index * MSX2_PATH_NODE_BYTES, 1 + (index + 1) * MSX2_PATH_NODE_BYTES);
const [cell0, action0, arg0, next0, alt0] = record(0);

check('The cell byte is row * 16 + column, the same index the runtime probe builds',
  cell0 === example.nodes[0].cellY * MSX2_PATH_GRID_COLS + example.nodes[0].cellX);
check('The action opcode survives the trip and is the one the author picked',
  (action0 & 0x1f) === MSX2_ENEMY_ACT.SET_DIR && arg0 === 1);
check('Exits are node INDICES, and a missing exit is #FF rather than 0',
  next0 === 1 && alt0 === MSX2_PATH_NODE_NONE
  && record(3)[3] === MSX2_PATH_NODE_NONE);

// ---- the policy rides in the spare bits, and only where it can act ----------
const [, action2] = record(2);
check('The branch policy rides in the top three bits of the action byte, costing no byte',
  (action2 >> 5) === MSX2_PATH_POLICY.random && (action2 & 0x1f) === MSX2_ENEMY_ACT.IDLE);
check('An opcode never collides with the policy bits: 18 actions need five',
  Object.keys(MSX2_ENEMY_ACT).length <= 0x1f
  && Math.max(...MSX2_PATH_BRANCH_POLICIES.map(name => MSX2_PATH_POLICY[name])) <= 0x07);
// THE BUG THIS GUARDS: a policy on a node with one exit is a choice the runtime
// cannot make. Storing it would show the author a control that does nothing.
const singleExit = bakePathFollow({
  nodes: [{ id: 'a', cellX: 0, cellY: 0, action: 'WALK', policy: 'random' }],
});
check('A node with one exit stores no policy, whatever the editor left on it',
  (singleExit.bytes[2] >> 5) === 0 && singleExit.warnings.length > 0);

// ---- the option that does nothing yet, and says so -------------------------
const flagged = bakePathFollow({
  nodes: [
    { id: 'a', cellX: 0, cellY: 0, action: 'WALK', next: 'b', nextAlt: 'c', policy: 'flag' },
    { id: 'b', cellX: 1, cellY: 0, action: 'WALK' },
    { id: 'c', cellX: 2, cellY: 0, action: 'WALK' },
  ],
});
check('THE BUG THIS GUARDS: the flag policy warns instead of silently walking one exit',
  flagged.warnings.some(text => /flag/i.test(text) && /first exit/i.test(text)));

// ---- labels are derived, so editing cannot break an edge -------------------
const labels = pathNodeLabels(example);
check('The visible number is the position along the route, not stored data',
  labels.get('n1') === '1');
// THE BUG THIS GUARDS: the brief asked for "numbers repeated on different
// paths". Two exits of one fork share an ordinal and differ by suffix; if that
// ever became an identity, inserting a node would rewire the route.
check('A fork gives both exits the same ordinal with different suffixes',
  labels.get('n4a')?.replace(/\D/g, '') === labels.get('n4b')?.replace(/\D/g, '')
  && labels.get('n4a') !== labels.get('n4b'));

// ---- a broken route must be inert, not wrong -------------------------------
const dangling = bakePathFollow({
  nodes: [{ id: 'a', cellX: 0, cellY: 0, action: 'WALK', next: 'ghost' }],
});
check('An exit pointing at a node that is not in the route is an ERROR, not a wild index',
  dangling.errors.length > 0 && dangling.bytes[4] === MSX2_PATH_NODE_NONE);
check('An empty route is refused rather than baked into an empty table',
  bakePathFollow({ nodes: [] }).errors.length > 0);
const tooMany = bakePathFollow({
  nodes: Array.from({ length: MSX2_PATH_MAX_NODES + 3 }, (_unused, index) => ({
    id: `n${index}`, cellX: index % 16, cellY: 0, action: 'WALK',
  })),
});
check('Past the node ceiling the route errors instead of emitting indices it cannot address',
  tooMany.errors.length > 0 && tooMany.bytes[0] === MSX2_PATH_MAX_NODES);

// ---- the reachability warning ----------------------------------------------
// THE BUG THIS GUARDS: the warning here used to be "no node ends the route and
// none loops back to the start", which fired on any circuit that closed on a
// node other than the first — an ordinary loop — and could never fire on the
// case it named, because a finite graph where nothing terminates always cycles.
// The first honest loop fixture tripped it.
const circuit = bakePathFollow({
  nodes: [
    { id: 'entry', cellX: 14, cellY: 8, action: 'SET_DIR', arg: 0, next: 'top' },
    { id: 'top', cellX: 7, cellY: 8, action: 'SET_DIR', arg: 1, next: 'fork' },
    { id: 'fork', cellX: 9, cellY: 8, action: 'IDLE', next: 'a', nextAlt: 'b', policy: 'random' },
    { id: 'a', cellX: 12, cellY: 8, action: 'SET_DIR', arg: 0, next: 'top' },
    { id: 'b', cellX: 10, cellY: 8, action: 'SET_DIR', arg: 0, next: 'top' },
  ],
});
check('A circuit that closes on a node other than the first is a route, not a warning',
  circuit.errors.length === 0 && circuit.warnings.length === 0);
const orphaned = bakePathFollow({
  nodes: [
    { id: 'a', cellX: 1, cellY: 0, action: 'WALK' },
    { id: 'lost', cellX: 2, cellY: 0, action: 'JUMP', arg: 4 },
  ],
});
check('A node nothing wires to is called out by name instead of silently never firing',
  orphaned.warnings.some(warning => warning.includes('"lost"')));

// ---- the Onion finds the room's collision, whatever type the room is -------
// THE BUG THIS GUARDS, reported from a screenshot: the overlay read
// `data.layers.collision` and nothing else. That is the SCREEN 4 TILE SCREEN
// shape. A SCREEN 5 BITMAP ROOM — the type the picker mostly lists — keeps its
// grid at `data.collision`, top level. Against a bitmap room the Onion drew no
// walls and, far worse, approved every node: the "buried in a wall" check has
// nothing to test when the grid is undefined. A validator that always passes is
// the failure mode this whole feature keeps rediscovering.
const floorRow = (rows, row) => Array.from({ length: 12 }, (_unused, r) =>
  Array.from({ length: 16 }, () => (r === row ? 1 : 0))).slice(0, rows).concat([]);
const bitmapRoom = { collision: floorRow(12, 11) };
const tileScreen = { layers: { collision: floorRow(12, 11) } };
const legacy = { collisionMap: floorRow(12, 11) };
for (const [label, data] of [['bitmap room', bitmapRoom], ['tile screen', tileScreen], ['legacy project', legacy]]) {
  const cells = onionCollisionCells(data);
  check(`The Onion reads the collision grid of a ${label}`,
    Array.isArray(cells) && cells.length === 192
    && cells.filter(Boolean).length === 16
    && cells.slice(11 * 16, 12 * 16).every(Boolean));
}
check('A screen with no grid at all reports NOTHING, so the caller can say so instead of drawing an empty room',
  onionCollisionCells({ name: 'sin nada' }) === undefined && onionCollisionCells(undefined) === undefined);

// ---- the room's art lands on the right cells --------------------------------
// A sheet with TWO entries side by side, each a solid different slot. If the
// entry's sx offset were ignored both cells would come back identical, and the
// room would look like bad art rather than like a bug. The painter is injected
// precisely so this rect arithmetic is testable without a browser.
const sheet = Array.from({ length: 16 }, () =>
  Array.from({ length: 32 }, (_unused, x) => (x < 16 ? 1 : 2)));
const paints = [];
const probePainter = (pixels, width, height) => {
  paints.push({ width, height, slots: [...new Set(pixels.flat())].sort() });
  return `img${paints.length}`;
};
const room = {
  palette: [{ slotIndex: 1, hex: '#ff0000' }, { slotIndex: 2, hex: '#00ff00' }],
  atlas: {
    width: 32, height: 16, pixels: sheet,
    entries: [{ id: 'a', sx: 0, sy: 0, w: 16, h: 16 }, { id: 'b', sx: 16, sy: 0, w: 16, h: 16 }],
  },
  // cell 0 empty, cell 1 -> entry 0 (ref 1), cell 2 -> entry 1 (ref 2)
  tileGrid: Array.from({ length: 12 }, (_unused, row) =>
    Array.from({ length: 16 }, (_unused2, col) =>
      (row === 0 && col === 1 ? 1 : row === 0 && col === 2 ? 2 : 0))),
};
const art = onionTileUrls(room, probePainter);
check('The room art comes back one entry per cell, empty cells included',
  Array.isArray(art) && art.length === 192 && art[0] === undefined && !!art[1] && !!art[2]);
// THE BUG THIS GUARDS: tileGrid stores "entry index + 1, 0 = empty". Reading it
// as a plain index shifts the whole room by one tile.
check('A cell reference is the entry index PLUS ONE, so cell 1 draws entry 0',
  paints[0]?.slots.join() === '1' && paints[1]?.slots.join() === '2');
check('THE BUG THIS GUARDS: an entry is cut at its own sx/sy, not from the sheet origin',
  paints.length === 2 && paints[0].slots.join() !== paints[1].slots.join());
check('192 cells cost one paint per DISTINCT tile, not one per cell',
  paints.length === 2);
check('A screen with no atlas reports no art rather than 192 blanks',
  onionTileUrls({ collision: [] }, probePainter) === undefined);

// ---- which palette the preview is drawn with -------------------------------
// THE BUG THIS GUARDS: the preview drew with `room.palette`, the room's own
// copy. A room belongs to a world, and the world's shared palette asset is what
// the GENERATOR bakes into the ROM, so rooms keep a stale private palette long
// after the world moved on and the preview shows colours the game never
// displays. utils/msx2WorldPalette.ts exists because atlas previews already
// made this mistake once; this preview repeated it.
const colourPaints = [];
const colourPainter = (pixels, width, height, palette) => {
  colourPaints.push(palette[1]);
  return 'img';
};
const roomWithOwnPalette = {
  ...room,
  palette: [{ slotIndex: 1, hex: '#111111' }, { slotIndex: 2, hex: '#222222' }],
};
colourPaints.length = 0;
onionTileUrls(roomWithOwnPalette, colourPainter);
check('With no override the room\'s own palette is used',
  colourPaints[0] === '#111111');
colourPaints.length = 0;
onionTileUrls(roomWithOwnPalette, colourPainter, [{ slotIndex: 1, hex: '#abcdef' }]);
check('THE BUG THIS GUARDS: a supplied palette WINS over the copy stored on the room',
  colourPaints[0] === '#abcdef');
colourPaints.length = 0;
onionTileUrls(roomWithOwnPalette, colourPainter, []);
check('An EMPTY override is not an override: it falls back instead of painting everything black',
  colourPaints[0] === '#111111');

// ---- the palette entry a node came from ------------------------------------
// THE BUG THIS GUARDS, reported from the editor: the icon lookup was
// `find(item => item.action === node.action)`. "Go right" is SET_DIR 1 and
// "go left" is SET_DIR 0 — one opcode, two entries — so every left node drew
// the right arrow and its tooltip said "Go right". The BYTE was correct, which
// is what made it nasty: the author goes looking for a bug that is not there.
const palette = [
  { action: 'SET_DIR', arg: 1, title: 'Go right' },
  { action: 'SET_DIR', arg: 0, title: 'Go left' },
  { action: 'WALK', title: 'Walk on' },
  { action: 'JUMP', arg: 4, title: 'Jump' },
];
check('THE BUG THIS GUARDS: a left node resolves to "go left", not to the first SET_DIR in the palette',
  paletteEntryFor(palette, { action: 'SET_DIR', arg: 0 })?.title === 'Go left'
  && paletteEntryFor(palette, { action: 'SET_DIR', arg: 1 })?.title === 'Go right');
// When ONE entry owns an opcode the argument is a value the author tunes, not an
// identity: a jump with a hand-edited height is still a jump.
check('An argument only decides when two entries share an opcode',
  paletteEntryFor(palette, { action: 'JUMP', arg: 9 })?.title === 'Jump'
  && paletteEntryFor(palette, { action: 'WALK' })?.title === 'Walk on');
// THE SECOND BUG THIS GUARDS: the inspector had its own matching rule, and in it
// `selected.arg ?? choice.arg` made a SET_DIR node with no argument compare equal
// to BOTH direction buttons, lighting up the two at once.
check('An ambiguous node with no argument picks exactly ONE entry, never both',
  palette.filter(entry => paletteEntryFor(palette, { action: 'SET_DIR' }) === entry).length === 1);
check('A node whose action is not in the palette resolves to nothing rather than to entry zero',
  paletteEntryFor(palette, { action: 'CHASE' }) === undefined
  && paletteEntryFor(palette, null) === undefined);

// ---- what the node palette offers ------------------------------------------
check('Every action the palette offers is an opcode the runtime actually has',
  ACTIONS.every(entry => MSX2_ENEMY_ACT[entry.action] !== undefined));
// THE BUG THIS GUARDS: SET_ANIM is the obvious thing to add — Jordi asked for
// jump/climb animations in the original brief — and it does not work as a NODE.
// The enemy loop's own ticker (.enemy_anim in msx2BitmapEnemyGenerator) advances
// animFrame every animDelay frames on every slot, right after the scripted step,
// so a one-shot node holds the frame for a few frames and loses it. Rule mode
// re-asserts it every tick, which is why it works there. Offering it here would
// be a control that visibly does nothing, so this check exists to make the next
// person who adds it read WHY first.
check('SET_ANIM stays out of the palette: the animation ticker overwrites it a few frames later',
  !ACTIONS.some(entry => entry.action === 'SET_ANIM'));
// Every entry the author can reach must bake into a record the walker can run.
const everyAction = bakePathFollow({
  nodes: ACTIONS.map((entry, index) => ({
    id: `a${index}`, cellX: index % 16, cellY: Math.floor(index / 16),
    action: entry.action, arg: entry.arg,
  })),
});
check('Every palette entry bakes without an error, so no button produces a dead node',
  everyAction.errors.length === 0
  && everyAction.bytes.length === 1 + ACTIONS.length * MSX2_PATH_NODE_BYTES);
// THE BUG THIS GUARDS: the argument slider must not appear where two entries
// share an opcode — there the argument IS the identity, and dragging it would
// turn "go left" into "go right" behind the author's back. This is the same
// rule paletteEntryFor uses, restated as a property of the shipped list.
const ambiguous = [...new Set(ACTIONS.map(entry => entry.action))]
  .filter(action => ACTIONS.filter(entry => entry.action === action).length > 1);
check('The only opcode with two palette entries is SET_DIR, told apart by its argument',
  ambiguous.length === 1 && ambiguous[0] === 'SET_DIR'
  && ACTIONS.filter(entry => entry.action === 'SET_DIR').map(entry => entry.arg).sort().join() === '0,1');
// A seeded argument outside the runtime's own range would be clamped by the
// baker, and the author would trust the number the editor showed.
check('Every seeded argument sits inside the range the runtime declares for that opcode',
  ACTIONS.every(entry => {
    const spec = MSX2_ENEMY_ACT_INFO[entry.action]?.arg;
    if (entry.arg === undefined || !spec) return true;
    return entry.arg >= spec.min && entry.arg <= spec.max;
  }));

// ---- cells stay inside the room -------------------------------------------
const outside = bakePathFollow({
  nodes: [{ id: 'a', cellX: 99, cellY: 99, action: 'WALK' }],
});
check('A cell outside the 16x12 grid is clamped, never emitted as a byte past the map',
  outside.bytes[1] < MSX2_PATH_GRID_COLS * 12);

if (failed > 0) {
  console.error(`\n${failed} path-follow contract check(s) failed.`);
  process.exit(1);
}
console.log('\nAll path-follow contract checks passed.');
