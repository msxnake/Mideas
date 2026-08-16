#!/usr/bin/env node
/**
 * Runtime repaints in a DARK SCREEN 5 bitmap room, checked against the REAL
 * generators.
 *
 * Every overlay a room paints after its composition — a pickup metatile, the
 * background restored under a collected one, a door swinging open, a spring
 * being triggered, the erosion band of a crumbling floor, a chipped tile —
 * comes from a 15-byte command template authored against the LIT atlas. A dark
 * room, however, is composed from the pre-dimmed TWIN of that atlas, so those
 * blits used to leave brightly lit patches floating in the darkness: collecting
 * a nut with the lamp out restored a 16x16 square of daylight.
 *
 * The fix hangs one call off the tail of every launch routine
 * (bitmap_light_dim_cmd_block), which dims the rectangle that was just painted
 * and then cuts the light sources back out of it. These checks pin both halves:
 * the call is emitted for a dark project, and NOTHING of it is emitted for a lit
 * one (the label does not even exist there, so a stray call would not assemble).
 *
 * Measured in OpenMSX on test/msx2-lighting/nuts_torchoff.json (dark room, torch
 * out) at the cell of a collected nut: #11 (lit backdrop) before, #99 (the same
 * dimmed backdrop as the rest of the room) after.
 */
import { readFileSync, mkdtempSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { build } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const FIXTURE = join(repoRoot, 'test', 'msx2-lighting', 'nuts.json');
const msx2Dir = join(repoRoot, 'utils', 'msxGenerator', 'generators', 'msx2');

const bundle = async (entry) => {
  const out = join(mkdtempSync(join(tmpdir(), 'mideas-darkrepaint-')), 'mod.mjs');
  await build({ entryPoints: [entry], bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'silent' });
  return import(pathToFileURL(out).href);
};

const roomGen = await bundle(join(msx2Dir, 'msx2Screen5BitmapRoomGenerator.ts'));
const crumbleGen = await bundle(join(msx2Dir, 'msx2BitmapCrumbleGenerator.ts'));
const swayGen = await bundle(join(msx2Dir, 'msx2BitmapSwayGenerator.ts'));
const destroyGen = await bundle(join(msx2Dir, 'msx2BitmapDestroyTileGenerator.ts'));
const lightGen = await bundle(join(msx2Dir, 'msx2BitmapLightingGenerator.ts'));

// Spelled out rather than taken from the generator: an empty exported constant
// would make every `includes(DIM_CALL)` below trivially true, and the whole file
// would go green while the ROM went back to painting daylight in the dark.
const DIM_CALL = 'call bitmap_light_dim_cmd_block';
const clone = value => JSON.parse(JSON.stringify(value));

const buildAsm = project => {
  const assets = project.assets;
  const pick = type => assets.filter(asset => asset.type === type).map(asset => asset.data);
  const analysis = {
    msx2BitmapRooms: pick('msx2bitmaproom'),
    worldmaps: pick('worldmap'),
    msx2GameFlows: pick('msx2gameflow'),
    tiles: [], tracks: [], assets,
  };
  return roomGen.generateMsx2Screen5BitmapRoomFiles('dark_repaint_check', analysis, {
    screenMode: 'SCREEN 4 (Graphics II)', romMode: 'megarom', targetFormat: 'konami',
  })['unitedFiles.asm'];
};

/** The lines of `label:` up to the next global label, i.e. one routine body. */
const routineBody = (asm, label) => {
  const start = asm.search(new RegExp(`^${label}:\\s*$`, 'm'));
  if (start < 0) return '';
  const lines = asm.slice(start).split(/\r?\n/).slice(1);
  const end = lines.findIndex(line => /^[A-Za-z_][A-Za-z0-9_]*:/.test(line));
  return lines.slice(0, end < 0 ? lines.length : end).join('\n');
};

const project = JSON.parse(readFileSync(FIXTURE, 'utf8'));
const rooms = project.assets.filter(asset => asset.type === 'msx2bitmaproom');
const checks = [];

// ---- the fixture has to be able to fail -------------------------------------
checks.push([
  'The exported tail call is the instruction these checks look for',
  lightGen.BITMAP_LIGHT_DIM_CMD_CALL.includes(DIM_CALL),
]);
checks.push([
  'Fixture is meaningful: a dark (lamp) room with collectible pickups in it',
  rooms.some(room => room.data?.runtime?.lighting === 'lamp')
  && rooms.some(room => (room.data.entities || []).some(entity => entity.kind === 'collectible')),
]);

// ---- dark project ------------------------------------------------------------
const darkAsm = buildAsm(project);

checks.push([
  'Dark project: the shared dimmer is emitted',
  /^bitmap_light_dim_cmd_block:\s*$/m.test(darkAsm) && /^bitmap_light_dim_repaint:\s*$/m.test(darkAsm),
]);
checks.push([
  'The pickup launch routine ends by dimming what it just painted',
  routineBody(darkAsm, 'bitmap_gem_launch_cmd').includes(DIM_CALL),
]);
// Room entry paints its overlays BEFORE the halo exists, and boot RAM is cold:
// relighting there would cut a hole against a stale/garbage halo centre.
const dimBody = routineBody(darkAsm, 'bitmap_light_dim_repaint');
checks.push([
  'The dimmer gives light back only in a live room (room_is_dark + composition_state + light_active gates)',
  dimBody.includes('call bitmap_light_room_is_dark')
  && dimBody.includes('ld a, (bitmap_composition_state)')
  && dimBody.includes('ld a, (bitmap_light_active)'),
]);
// The overlay draw chain runs before the general init, so those two gates must
// already be sane by then (same reason the boss/heal flags are hoisted there).
const bootPrologue = darkAsm.slice(0, darkAsm.indexOf('call bitmap_apply_gems_visible'));
checks.push([
  'Boot clears the dimmer gates before the first overlay is drawn',
  bootPrologue.includes('ld (bitmap_light_active), a')
  && bootPrologue.includes('ld (bitmap_composition_state), a'),
]);

// A dialogue/perception close replays the room program on the VISIBLE page,
// which repaints the whole game band dark and takes the halo with it. That chain
// has to drop bitmap_light_active so the next frame paints the halo again, while
// the boot chain (which is followed by a paint of its own) must NOT.
// The fixture has no close-repaint of its own, so give it one: a talking NPC is
// what brings the dialogue box — and bitmap_dlg_close_box, the live consumer of
// that chain — into the build.
const dialogueProject = clone(project);
dialogueProject.assets.push({
  id: 'dlg_dark_repaint_check',
  type: 'msx2dialogue',
  data: { name: 'check', lines: ['HOLA'] },
});
const npcRoom = dialogueProject.assets.filter(asset => asset.type === 'msx2bitmaproom')[0];
npcRoom.data.entities = [
  ...(npcRoom.data.entities || []),
  { kind: 'npc', position: { x: 4, y: 6 }, params: { runtime: 'MSX2', npcDialogue: { dialogueAssetId: 'dlg_dark_repaint_check' } } },
];
const dialogueAsm = buildAsm(dialogueProject);
const CLEAR_ACTIVE = 'ld (bitmap_light_active), a    ; the recompose wiped the halo: repaint it next frame';
checks.push([
  'Fixture is meaningful: the NPC really compiled the dialogue box in',
  /^bitmap_dlg_close_box:\s*$/m.test(dialogueAsm),
]);
checks.push([
  'A close-repaint asks for the halo back',
  routineBody(dialogueAsm, 'bitmap_dlg_close_box').includes(CLEAR_ACTIVE),
]);
checks.push([
  'The boot chain does NOT (bitmap_light_paint_visible right below already paints it)',
  !darkAsm.slice(0, darkAsm.indexOf('call bitmap_apply_gems_visible')).includes(CLEAR_ACTIVE),
]);

// ---- lit project: not one byte of this may exist ------------------------------
const litProject = clone(project);
for (const room of litProject.assets.filter(asset => asset.type === 'msx2bitmaproom')) {
  if (room.data.runtime) delete room.data.runtime.lighting;
}
const litAsm = buildAsm(litProject);
checks.push([
  'Lit-only project: no dimmer symbol and no call to it (a stray call would not even assemble)',
  !litAsm.includes('bitmap_light_dim_cmd_block') && !litAsm.includes('bitmap_light_dim_repaint'),
]);
checks.push([
  'Lit-only control: the same pickup launch routine is still emitted, just without the dimming',
  routineBody(litAsm, 'bitmap_gem_launch_cmd').includes('out (#9B), a'),
]);

// ---- the satellite systems carry the same tail --------------------------------
// Crumbling floor, swaying grass and destroy_tile live in their own generators and
// each launches from the same #C2C0 scratch, so each needs the tail of its own.
const crumbleAsm = opts => crumbleGen.buildBitmapCrumbleSystemAsm({
  ramBase: 0xd100,
  hitbox: { x: 0, y: 0, w: 16, h: 32 },
  gameYOffset: 20,
  roomCells: [[{ cell: 20, speed: 1 }]],
  bgColorBytes: [0x11],
  debrisPatternNumber: 0,
  debrisSatBase: 0xf000,
  debrisColorBase: 0xf400,
  ...opts,
}).routinesAsm;
const swayAsm = opts => swayGen.buildBitmapSwaySystemAsm({
  ramBase: 0xd100,
  hitbox: { x: 0, y: 0, w: 16, h: 32 },
  gameYOffset: 20,
  roomCells: [[{ cell: 20, set: 0 }]],
  sets: [{ frames: [{ sx: 0, sy: 512 }, { sx: 16, sy: 512 }, { sx: 32, sy: 512 }], holdFrames: 8 }],
  ...opts,
}).routinesAsm;
const destroyAsm = opts => destroyGen.buildBitmapDestroyTileRuntimeAsm(
  { enabled: true, digKey: 0, hitsPerTile: 2, reach: 4 },
  {
    ramBase: 0xc2d0,
    hitbox: { x: 0, y: 0, w: 16, h: 32 },
    debrisPatternNumber: 0,
    debrisSatBase: 0xf000,
    debrisColorBase: 0xf400,
    gameYOffset: 20,
    destructibleMasks: [Array(24).fill(0xff)],
    bgColorBytes: [0x11],
    ...opts,
  },
);
for (const [name, make] of [['crumbling floor', crumbleAsm], ['swaying grass', swayAsm], ['destroy_tile', destroyAsm]]) {
  const dark = make({ dimRepaintCallAsm: lightGen.BITMAP_LIGHT_DIM_CMD_CALL });
  const lit = make({});
  checks.push([`Dark room: the ${name} repaint is dimmed too`, dark.includes(DIM_CALL)]);
  checks.push([`Lit room: the ${name} repaint is left alone`, !lit.includes(DIM_CALL) && lit.length > 0]);
}

// ---- report -------------------------------------------------------------------
let failed = 0;
for (const [label, ok] of checks) {
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
}
console.log(`\n${checks.length - failed}/${checks.length} checks passed`);
process.exit(failed ? 1 : 0);
