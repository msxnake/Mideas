#!/usr/bin/env node
/**
 * Builds the two fixtures of the PLAYER_IN_SIGHT "left ray never ends" probe.
 *
 *   node test/msx2-pursuer/make_sight_left_hang.mjs [outDir]
 *
 *   sight_left_hang.json        guard at x=104 (104 mod 16 = 8)   -> hangs before the fix
 *   sight_left_hang_ctrl.json   guard at x=96  ( 96 mod 16 = 0)   -> never hangs (control)
 *   sight_left_hang_wall.json   guard at x=104 + a solid cell on the ray row (column 2)
 *                               -> must stay BLIND (no shot) before and after the fix:
 *                                  the carry exit may only fire when the ray is free
 *   sight_left_hang_wall15.json guard at x=104 + a solid cell on the ray row ONLY in
 *                               column 15 (x 240..255)
 *                               -> the case whose answer CHANGED with the fix. The
 *                                  wrapped ray (8 - 16 = 248) used to land in that
 *                                  column and answer FALSE, so the guard was blind
 *                                  (0 shots, no hang); with the borrow exit the ray
 *                                  stops at column 0 and answers TRUE (>= 10 shots).
 *                                  It is the only fixture that tells the old
 *                                  behaviour from the new one by its shot count
 *                                  alone, with a main loop that is alive on both.
 *
 * THE BUG THEY PROVE
 *   bitmap_enemy_script_cond_player_in_sight walks a left-facing ray in 16 px
 *   steps from the guard's X. A step is `sub 16` on an 8-bit X. When the guard's
 *   X is NOT a multiple of 16 the ray lands on 8 (say) and the next `sub 16`
 *   underflows to 248: the ray teleports to the right-hand side and walks the
 *   whole room again, for ever, as long as no solid cell stops it AND the player
 *   stays left of that residue (player_x < x mod 16), because only then can
 *   `player_x >= b` never become true. A guard whose X is a multiple of 16
 *   reaches b = 0 and answers TRUE long before the underflow, so the control
 *   cannot hang.
 *
 * WHAT MAKES THEM AUTHORED, NOT HAND-PATCHED
 *   Everything is in the project JSON that the real export path reads:
 *   - the ray row (y_origin + 8 = row 10) has NO solid cell in its 16 columns,
 *     and the floor is row 11, so the guard stands on row 10 and the ray row is
 *     fully free (condition (a));
 *   - the guard is placed at a fractional tile (6.5 -> 104 px; the generator
 *     multiplies the tile by 16 and does not round it) and told to face LEFT by
 *     the behaviour itself (SET_DIR 0), not by poking its RAM (condition (b));
 *   - the player spawns at x=2, on the guard's row (condition (c): 2 < 104 mod 16).
 *   The behaviour is the shipped "sentry shoots when it sees you" pattern with
 *   a one-tick aiming state in front: PLAYER_IN_SIGHT -> FIRE -> reload.
 *
 * It starts from test/msx2-behavior/demo_sentry_sightshooter.json (a fixture that
 * already compiles and already uses PLAYER_IN_SIGHT) and strips everything the
 * probe does not need: the second room, the carryable, the extra enemy and every
 * player skill, so that nothing but the sight test can explain a stall.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
const SOURCE = join(repoRoot, 'test', 'msx2-behavior', 'demo_sentry_sightshooter.json');
const outDir = resolve(process.argv[2] || here);

const ROOM_ID = 'bitmap_room_smoke';
const BEHAVIOR_ID = 'behaviour_walker_jumper';
const FLOOR_ROW = 11;          // solid; the guard stands on row 10
const GUARD_ROW = 10;
const SOLID = 16;              // value the demo room uses for a solid cell
const PLAYER_X = 2;            // < 104 mod 16 (= 8): the hang condition (c)

function rule(id, condition, action, extra = {}) {
  return { id, condition, action, ...extra };
}

/** Aim once, then watch; on sight fire and reload. SET_DIR 0 = face left. */
function sentryFacingLeft() {
  return {
    initialState: 0,
    speedPxPerTick: 1,
    logicIntervalFrames: 1,
    states: [
      {
        id: 'state_aim',
        name: 'Aim left',
        rules: [rule('r_aim', 'ALWAYS', 'SET_DIR', { actionArg: 0, nextState: 1 })],
      },
      {
        id: 'state_watch',
        name: 'Watch',
        rules: [
          rule('r_fire', 'PLAYER_IN_SIGHT', 'FIRE', { actionArg: 0, nextState: 2 }),
          rule('r_stay', 'ALWAYS', 'IDLE'),
        ],
      },
      {
        id: 'state_reload',
        name: 'Reload',
        rules: [
          rule('r_reload', 'TIMER_ELAPSED', 'IDLE', { conditionArg: 30, nextState: 1 }),
          rule('r_wait', 'ALWAYS', 'IDLE'),
        ],
      },
    ],
  };
}

function build({ name, guardTileX, wallCol }) {
  const project = JSON.parse(readFileSync(SOURCE, 'utf8'));
  project.name = name;

  // One room, one world node, no second room to fall into.
  const keep = new Set([
    ROOM_ID, 'bitmap_room_world', 'smoke_hud_font', 'smoke_player_sprite', 'smoke_player', BEHAVIOR_ID,
  ]);
  project.assets = project.assets.filter(asset => keep.has(asset.id));

  const world = project.assets.find(asset => asset.id === 'bitmap_room_world');
  world.data.nodes = world.data.nodes.filter(node => node.screenAssetId === ROOM_ID);
  world.data.connections = [];
  world.data.startScreenNodeId = world.data.nodes[0].id;

  // No skills: nothing but the sight test may explain a stall.
  const player = project.assets.find(asset => asset.id === 'smoke_player');
  player.data.activeSkills = [];
  player.data.skillParameters = {};

  const behavior = project.assets.find(asset => asset.id === BEHAVIOR_ID);
  behavior.name = 'Sentry facing left (sight-left probe)';
  behavior.data.name = behavior.name;
  Object.assign(behavior.data, sentryFacingLeft());

  const room = project.assets.find(asset => asset.id === ROOM_ID);
  const data = room.data;
  // Collision: a floor on row 11 and NOTHING else. Row 10 (the ray row) is free.
  data.collision = data.collision.map((row, y) => row.map((_, x) => (
    y === FLOOR_ROW || (wallCol !== undefined && y === GUARD_ROW && x === wallCol) ? SOLID : 0
  )));
  data.behavior = data.behavior.map(row => row.map(() => 0));
  data.effects = data.effects.map(row => row.map(() => 0));
  data.playerEntries = [{ id: 'spawn0', x: PLAYER_X, y: 128, facing: 'right', playerId: 'smoke_player' }];
  data.entities = [
    {
      kind: 'enemy',
      position: { x: guardTileX, y: GUARD_ROW },
      components: {
        msx2_hardware_sprite: { msx2SpriteAssetId: 'smoke_player_sprite' },
        msx2_movement: { mode: 'scripted', minX: 0, maxX: 240, boundsUnit: 'px', direction: -1, speed: 1 },
        msx2_ai: { behaviorAssetId: BEHAVIOR_ID, logicUpdateIntervalFrames: 1 },
      },
      params: { movement: 'scripted', behaviorAssetId: BEHAVIOR_ID },
    },
  ];
  data.notes = `PLAYER_IN_SIGHT left-ray probe: guard at x=${guardTileX * 16}, player at x=${PLAYER_X}, `
    + (wallCol === undefined ? 'free ray row.' : `solid cell at column ${wallCol} of the ray row.`);
  return project;
}

mkdirSync(outDir, { recursive: true });
const cases = [
  { file: 'sight_left_hang.json', name: 'Sight left hang (guard x=104)', guardTileX: 6.5 },
  { file: 'sight_left_hang_ctrl.json', name: 'Sight left hang control (guard x=96)', guardTileX: 6 },
  // Column 2 (x 32..47): the player at x=2 spans columns 0-1, so it does not stand inside the wall.
  { file: 'sight_left_hang_wall.json', name: 'Sight left hang wall (guard x=104, wall col 2)', guardTileX: 6.5, wallCol: 2 },
  // Column 15 (x 240..255): the only cell the wrapped ray (8 - 16 = 248) can land on. Nothing else on the row is solid.
  { file: 'sight_left_hang_wall15.json', name: 'Sight left hang wall15 (guard x=104, wall col 15 only)', guardTileX: 6.5, wallCol: 15 },
];
for (const item of cases) {
  const project = build(item);
  writeFileSync(join(outDir, item.file), `${JSON.stringify(project)}\n`);
  console.log(`${item.file}: guard at ${item.guardTileX * 16} px (x mod 16 = ${(item.guardTileX * 16) % 16}), player x=${PLAYER_X}${item.wallCol === undefined ? '' : `, wall at column ${item.wallCol}`}`);
}
