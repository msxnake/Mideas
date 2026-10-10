#!/usr/bin/env node
// Builds the derived fixtures of the TERRAIN BODY / ANIM_CLIP probe (pursuer_tall_probe.tcl) out of the alert lab, with a script, so the
// geometry is data the probe can read back from the ROM and nothing is hand-edited.
//
//   node test/msx2-pursuer/make_pursuer_tall_lab.mjs --case ledge|ledgeleft|wall|ceiling|clip --out file.json [--lab pursuer_lab.json] [--delay <s>] [--guard <px>]
//
// Every case starts from make_pursuer_alert_lab.mjs (start room A, alert zone in A only, WorldLink boot, the real soldier asset) and then
// replaces ROOM A's collision grid, its player spawn and, where the case needs it, the soldier's behaviour / sprite. The lab itself is
// read-only (refused when --out equals the lab). A 12x16 grid of 16 px cells, floor = row 11 = y 176, solid byte #10.
//
//   ledge  the soldier appears on a LEDGE (row 10, cols 0-3: ground at y 160, spawn y 128) and walks east with a program that never
//          turns at ledges (WALL_AHEAD -> turn, else walk). It must step off, fall 16 px and stand on the floor with y+32 = 176.
//          Walking east the LEFT foot (x+3) is the last one over the ledge: it starts falling at x = 61.
//   ledgeleft  the mirror image (row 10, cols 10-15: ground from x = 160, spawn x 176, y 128): the soldier walks east to the wall, turns
//          and walks WEST off the ledge. Walking west the RIGHT foot (x+11) is the last one over the ledge: it starts falling at x = 148.
//          The case that tells a 9 px wide body from one that only has its left foot (x+3 -> 156) or the whole sprite (x -> 145).
//   wall   a ONE-CELL block on the floor (row 10, col 8: y 160-175). A 16x16 probe at mid height (y+8 = 152 for the soldier at y 144)
//          never sees it; the tall WALL_AHEAD (rows y+3 / y+17 / y+31) does, so the soldier turns before touching it.
//   ceiling a full-width slab on row 8 (y 128-143) over a 32 px corridor (rows 9-10): the soldier at y 144 has only 3 px between the slab and
//          the top row of its hitbox (y+3 = 147). It jumps every ~20 ticks: the head row y+2 must stop it at y 141 exactly, never inside the slab.
//   clip   the soldier STANDS (no movement) and plays a loop of ANIM_CLIP states over a 4-frame sprite: held frames and cycles, the
//          zero argument 0|0<<4 (frame 0 held), and a cycle longer than the sprite (the end must be capped at frame 3). The program is
//          written to <out>.clips.json for the probe: [{ state, first, n, minFrame, maxFrame, cycles }].
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { makeHumanoidSpriteAsset, SOLDIER_COLORS, LAB_PLAYER_COLORS, SOLDIER_SPRITE_ID, SOLDIER_BEHAVIOR_ID } from './pursuer_common.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const value = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const known = new Set(['--case', '--out', '--lab', '--delay', '--guard']);
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('-')) {
    if (!known.has(args[i])) { console.error(`make_pursuer_tall_lab: unknown argument ${args[i]}`); process.exit(2); }
    i++;
  } else { console.error(`make_pursuer_tall_lab: unexpected argument ${args[i]}`); process.exit(2); }
}
const kase = value('--case', '');
if (!['ledge', 'ledgeleft', 'wall', 'ceiling', 'clip'].includes(kase)) { console.error('usage: make_pursuer_tall_lab.mjs --case ledge|ledgeleft|wall|ceiling|clip --out file.json [--lab pursuer_lab.json] [--delay s] [--guard px]'); process.exit(2); }
const outPath = value('--out', '') && path.resolve(value('--out', ''));
if (!outPath) { console.error('make_pursuer_tall_lab: --out is required'); process.exit(2); }
const labPath = path.resolve(value('--lab', path.join(here, 'pursuer_lab.json')));
if (labPath === outPath) { console.error('refusing: --out is the input lab (the lab is read-only)'); process.exit(2); }
const delay = value('--delay', '1');
const guard = value('--guard', '32');

// 1. the alert lab, start room A, alert zone in A.
const tmp = path.join(os.tmpdir(), `mideas_tall_base_${process.pid}.json`);
execFileSync(process.execPath, [path.join(here, 'make_pursuer_alert_lab.mjs'), '--lab', labPath, '--start-room', 'A', '--alert-rooms', 'A', '--delay', delay, '--guard', guard, '--out', tmp], { stdio: 'pipe' });
const project = JSON.parse(fs.readFileSync(tmp, 'utf8'));
fs.rmSync(tmp, { force: true });
const asset = id => project.assets.find(a => a.id === id);
const roomA = asset('pursuer_lab_a');
if (!roomA) throw new Error('the alert lab has no room pursuer_lab_a');

// 2. room A: collision (and the matching tile grid), spawn, no entities.
const ROWS = 12, COLS = 16;
function grid(rows) {
  if (rows.length !== ROWS || rows.some(r => r.length !== COLS)) throw new Error('a room needs 12 rows of 16 cells');
  return rows.map(r => [...r].map(ch => (ch === '#' ? 0x10 : 0)));
}
const border = ['################', ...Array(9).fill('#..............#'), '#..............#', '################'];
const withRow10 = text => { const rows = border.slice(); rows[10] = text; return rows; };
const layouts = {
  ledge: withRow10('####...........#'),          // ground at y 160 for x 0-63, the floor (y 176) beyond
  ledgeleft: withRow10('#.........######'),      // ground at y 160 for x 160-255, the floor (y 176) west of it
  wall: withRow10('#.......#......#'),            // one-cell block at col 8 (x 128-143, y 160-175)
  ceiling: border.map((row, index) => (index === 8 ? '################' : row)),
  clip: border,
};
const rows = layouts[kase];
roomA.data.collision = grid(rows);
roomA.data.tileGrid = roomA.data.collision.map(r => r.map(v => (v ? 1 : 0)));
roomA.data.entities = [];
const onLedge = kase === 'ledge' || kase === 'ledgeleft';
const spawnY = onLedge ? 128 : 144;               // standing on the ledge / on the floor
const spawnX = kase === 'ledgeleft' ? 176 : 32;
roomA.data.playerEntries = [{ id: 'spawn0', x: spawnX, y: spawnY, facing: 'right', playerId: 'pursuer_lab_player' }];
roomA.data.notes = `tall-body probe fixture "${kase}" (derived by make_pursuer_tall_lab.mjs from the alert lab)`;

// 3. the soldier's behaviour
const behavior = asset(SOLDIER_BEHAVIOR_ID);
const rule = (id, condition, action, extra = {}) => ({ id, condition, action, ...extra });
if (onLedge) {
  // The lab soldier turns at ledges (NO_FLOOR_AHEAD); this one only turns at walls, so it walks off the edge.
  behavior.data.states = [{ id: 'state_walk', name: 'Walk off ledges', rules: [rule('r_wall', 'WALL_AHEAD', 'TURN_AND_WALK'), rule('r_walk', 'ALWAYS', 'WALK')] }];
}
if (kase === 'ceiling') {
  // Jump (7 px/tick, more than the 3 px of headroom) every 20 ticks on the ground; back to the ground state when it lands.
  behavior.data.states = [
    { id: 'state_ground', name: 'Ground', rules: [rule('r_jump', 'TIMER_ELAPSED', 'JUMP', { conditionArg: 20, actionArg: 7, nextState: 1 }), rule('r_wait', 'ALWAYS', 'IDLE')] },
    { id: 'state_air', name: 'Air', rules: [rule('r_land', 'ON_GROUND', 'IDLE', { nextState: 0 }), rule('r_fly', 'ALWAYS', 'IDLE')] },
  ];
}
let clipsOut = null;
if (kase === 'clip') {
  // 7 states in a loop, 40 ticks each. A state's rules: [TIMER_ELAPSED -> ANIM_CLIP(next state's clip) + switch, ALWAYS -> ANIM_CLIP(own clip)].
  // Setting the NEXT clip in the transition tick is what makes "the SAT never shows a frame outside the clip" testable: the tick that
  // changes state also changes the clip, so every sample's (state, frame) pair must agree.
  const clips = [
    { name: 'held 2', first: 2, n: 1 },        // arg 0x12
    { name: 'cycle 1-2', first: 1, n: 2 },     // 0x21
    { name: 'held 0 (n=0, arg 0x00)', first: 0, n: 0 },  // 0x00: the zero argument, which must NOT mean "no clip"
    { name: 'cycle 1-3', first: 1, n: 3 },     // 0x31
    { name: 'cycle 0-3 (whole sprite)', first: 0, n: 4 }, // 0x40
    { name: 'held 3', first: 3, n: 1 },        // 0x13
    { name: 'cycle 2-3 (n longer than the sprite)', first: 2, n: 3 }, // 0x32: end capped at frame 3
  ];
  const arg = c => c.first | (c.n << 4);
  const TICKS = 40;
  behavior.data.states = clips.map((clip, k) => ({
    id: `state_clip_${k}`,
    name: `Clip ${k}: ${clip.name}`,
    rules: [
      rule(`r_${k}_next`, 'TIMER_ELAPSED', 'ANIM_CLIP', { conditionArg: TICKS, actionArg: arg(clips[(k + 1) % clips.length]), nextState: (k + 1) % clips.length }),
      rule(`r_${k}_hold`, 'ALWAYS', 'ANIM_CLIP', { actionArg: arg(clip) }),
    ],
  }));
  behavior.data.initialState = 0;
  const FRAMES = 4;
  clipsOut = clips.map((clip, state) => {
    const effectiveN = Math.max(clip.n, 1);
    const maxFrame = Math.min(clip.first + effectiveN, FRAMES) - 1;
    return { state, name: clip.name, arg: arg(clip), first: clip.first, n: clip.n, minFrame: clip.first, maxFrame, cycles: clip.n >= 2 && maxFrame > clip.first };
  });

  // A 4-frame sprite: the soldier's two walking frames, then two more in another palette so the frames can be told apart on screen.
  const sprite = asset(SOLDIER_SPRITE_ID);
  const extra = makeHumanoidSpriteAsset('tmp_extra', 'extra', LAB_PLAYER_COLORS).data.frames;
  sprite.data.frames = [...sprite.data.frames, ...extra.map((f, i) => ({ ...f, id: `frame_${SOLDIER_SPRITE_ID}_${i + 2}` }))];
  // The enemy asset must LIST the four frames (a role with <= 1 frames falls back to the first two of the sprite), and animate fast
  // enough that a 40-tick state sees every frame of its cycle.
  const enemy = asset('msx2enemy_pursuer_boina_verde');
  enemy.data.render.animations.walk = { frames: [0, 1, 2, 3], speed: 5, loop: true };
  enemy.data.render.roles[0].frames = [0, 1, 2, 3];
  enemy.data.render.roles[0].speed = 5;
}

project.name = `Pursuer tall-body fixture (${kase})`;
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(project, null, 1)}\n`);
if (clipsOut) fs.writeFileSync(`${outPath}.clips.json`, `${JSON.stringify(clipsOut, null, 1)}\n`);
console.log(`wrote ${outPath} (case ${kase}, spawn ${spawnX},${spawnY}, delay ${delay}s, guard ${guard}px${clipsOut ? `, ${clipsOut.length} clips -> ${outPath}.clips.json` : ''})`);
