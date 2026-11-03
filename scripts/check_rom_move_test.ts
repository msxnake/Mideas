// Differential test: ROM Z80 move test vs Mideas Play mode (docs/project/PLAN_PARIDAD_PLAY_ROM.md).
//
// Extracts SM_TestMoveDirection (stateMachineGenerator.ts) and check_collision_box +
// ccb_add_signed_offset (componentsGenerator.ts) verbatim from the generators, assembles them
// with server/glass.jar next to a test get_behavior_tile, runs the code on the Cowbell Z80
// (public/vendor/cowbell) and compares thousands of random cases with romCanMoveDirection
// (utils/romMoveTest.ts), which is what Play mode uses for CAN_MOVE_DIRECTION / PATH_CLEAR /
// KEY_AND_MOVEMENT.
//
// Run: npx tsx scripts/check_rom_move_test.ts   (needs java)
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import vm from 'node:vm';
import { romAdaptiveProbes, romBehaviorStep, romCanMoveDirection, romCollisionFlagsFromLayer } from '../utils/romMoveTest';

const root = new URL('..', import.meta.url).pathname;
const read = (p: string) => readFileSync(join(root, p), 'utf8');

const slice = (text: string, start: string, end: string) => {
  const a = text.indexOf(start);
  const b = text.indexOf(end, a);
  assert.ok(a >= 0 && b > a, `markers not found: ${start} .. ${end}`);
  return text.slice(a, b);
};
const smGen = read('utils/msxGenerator/generators/stateMachineGenerator.ts');
const compGen = read('utils/msxGenerator/generators/componentsGenerator.ts');
const testMove = slice(smGen, 'SM_TestMoveDirection:', 'Condition_KeyPressed:');
const ccbStart = compGen.indexOf('check_collision_box:\n    ld c, b');
assert.ok(ccbStart > 0, 'real check_collision_box not found (stub still in place?)');
const ccbEnd = compGen.indexOf('.ccbo_done:\n    ret', ccbStart) + '.ccbo_done:\n    ret'.length;
const collisionBox = compGen.slice(ccbStart, ccbEnd);
// WallCollision probe builder (first definition) + its signed-offset helper
const hitboxCache = slice(compGen, 'wall_build_hitbox_cache:', 'wall_add_signed_offset_clamped:');
const signedOffset = slice(compGen, 'wall_add_signed_offset_clamped:', '; wall_sub_signed_offset_clamped');
// Behavior runner (update_behavior_component .. behavior_next_entity's ret)
const behaviorStart = compGen.indexOf('update_behavior_component:\n    ld a, (active_entity_count)');
assert.ok(behaviorStart > 0, 'update_behavior_component not found');
const behaviorEnd = compGen.indexOf('`', behaviorStart);
const behaviorBlock = compGen.slice(behaviorStart, behaviorEnd);
const flagsFromLayer = slice(compGen, 'coll_flags_from_layer:', '.cffl_done:') + '.cffl_done:\n    ld a, c\n    ret\n';
assert.ok(compGen.includes('.cffl_done:\n    ld a, c\n    ret'), 'coll_flags_from_layer epilogue changed: update this test');

const RAM = { w: 0xc000, h: 0xc020, ox: 0xc040, oy: 0xc060, x: 0xc080, y: 0xc0a0, ent: 0xc100, dir: 0xc101, res: 0xc102, map: 0xc200 };
const asm = `
entity_collision_hitbox_w EQU #${RAM.w.toString(16)}
entity_collision_hitbox_h EQU #${RAM.h.toString(16)}
entity_collision_offset_x EQU #${RAM.ox.toString(16)}
entity_collision_offset_y EQU #${RAM.oy.toString(16)}
entity_x_pos EQU #${RAM.x.toString(16)}
entity_y_pos EQU #${RAM.y.toString(16)}
t_entity EQU #${RAM.ent.toString(16)}
t_dir EQU #${RAM.dir.toString(16)}
t_result EQU #${RAM.res.toString(16)}
t_map EQU #${RAM.map.toString(16)}
COLLISION_LAYER_ENEMY EQU #02
COLLISION_LAYER_ITEM EQU #10
COLLISION_EVENT_ENTITY EQU #01
COLLISION_EVENT_ENEMY EQU #02
COLLISION_EVENT_ITEM EQU #04
t_layer EQU #C103
active_entity_count EQU #C120
active_entity_list EQU #C121
hero_entity_id EQU #C130
entity_comp_masks EQU #C300
entity_behavior_cfg_type EQU #C320
entity_behavior_cfg_speed EQU #C340
entity_behavior_cfg_stop EQU #C360
entity_behavior_cfg_range EQU #C380
entity_behavior_cfg_dir EQU #C3A0
entity_facing_dir EQU #C3C0
entity_vel_x EQU #C3E0
entity_wall_collision_flags EQU #C400
COMP_MASK_BEHAVIOR EQU #20
BEHAVIOR_TYPE_NONE EQU 0
BEHAVIOR_TYPE_FOLLOW_PLAYER_X EQU 1
BEHAVIOR_TYPE_FLEE_PLAYER_X EQU 2
BEHAVIOR_TYPE_FACE_PLAYER_X EQU 3
BEHAVIOR_TYPE_WALK_X_WALL_TURN EQU 4
wall_temp_x EQU #C110
wall_temp_y EQU #C111
wall_hit_w EQU #C112
wall_hit_h EQU #C113
wall_hit_left EQU #C114
wall_hit_top EQU #C115
wall_hit_right EQU #C116
wall_hit_bottom EQU #C117
wall_probe_left EQU #C118
wall_probe_right EQU #C119
wall_probe_top EQU #C11A
wall_probe_bottom EQU #C11B
    ORG #4000
test_entry:
    ld a, (t_entity)
    ld b, a
    ld a, (t_dir)
    call SM_TestMoveDirection
    ld (t_result), a
    ret
    DS #4010 - $          ; second entry point at #4010
flags_entry:
    ld a, (t_layer)
    call coll_flags_from_layer
    ld (t_result), a
    ret
    DS #4020 - $          ; third entry point at #4020
probes_entry:
    ld a, (t_entity)
    ld e, a
    ld d, 0
    call wall_build_hitbox_cache
    ret
    DS #4030 - $          ; fourth entry point at #4030
behavior_entry:
    call update_behavior_component
    ret

; Test stand-in for the ROM reader: behaviour byte of (B=row, C=col), out of 32x24 = passable.
get_behavior_tile:
    ld a, b
    cp 24
    jr nc, .gbt_oob
    ld a, c
    cp 32
    jr nc, .gbt_oob
    push hl
    push de
    ld l, b
    ld h, 0
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    add hl, hl
    ld e, c
    ld d, 0
    add hl, de
    ld de, t_map
    add hl, de
    ld a, (hl)
    pop de
    pop hl
    ret
.gbt_oob:
    xor a
    ret

${testMove}
${collisionBox}
${flagsFromLayer}
${hitboxCache}
${signedOffset}
${behaviorBlock}
`;

const dir = mkdtempSync(join(tmpdir(), 'rom-move-'));
writeFileSync(join(dir, 'test.asm'), asm);
execFileSync('java', ['-jar', join(root, 'server/glass.jar'), join(dir, 'test.asm'), join(dir, 'test.bin')], { stdio: 'pipe' });
const bin = readFileSync(join(dir, 'test.bin'));

// Cowbell Z80 (same vendor build the PT3 renderer uses)
const ctx: any = { console, Math, Uint8Array, Float32Array, Array, Object, Error };
ctx.window = ctx; ctx.self = ctx; ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ['cowbell.min.js', 'zx.min.js']) vm.runInContext(read(`public/vendor/cowbell/${f}`), ctx);
const memory = new Uint8Array(65536);
memory.set(bin, 0x4000);
const cpu = ctx.Cowbell.Common.buildZ80({})({
  memory: { read: (a: number) => memory[a], write: (a: number, v: number) => { memory[a] = v; } },
  ioBus: { read: () => 0xff, write: () => {} },
});

// Deterministic PRNG
let seed = 12345;
const rnd = (n: number) => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };
const FAMILIES = [0x00, 0x00, 0x00, 0x10, 0x20, 0x30, 0x10, 0x00, 0xf0, 0x21];

let cases = 0;
let blocked = 0;
for (let map = 0; map < 40; map++) {
  const tiles = new Uint8Array(32 * 24);
  for (let i = 0; i < tiles.length; i++) tiles[i] = rnd(4) === 0 ? FAMILIES[rnd(FAMILIES.length)] : 0;
  memory.set(tiles, RAM.map);
  for (let k = 0; k < 120; k++) {
    const e = rnd(32);
    const hitbox = { width: rnd(5) === 0 ? 0 : rnd(25), height: rnd(5) === 0 ? 0 : rnd(25), offsetX: rnd(17) - 8, offsetY: rnd(17) - 8 };
    const x = rnd(256);
    const y = rnd(256);
    const d = [0, 1, 3, 5, 7, 2, 9][rnd(7)];
    memory[RAM.w + e] = hitbox.width;
    memory[RAM.h + e] = hitbox.height;
    memory[RAM.ox + e] = hitbox.offsetX & 0xff;
    memory[RAM.oy + e] = hitbox.offsetY & 0xff;
    memory[RAM.x + e] = x;
    memory[RAM.y + e] = y;
    memory[RAM.ent] = e;
    memory[RAM.dir] = d;
    memory[RAM.res] = 0xaa;
    cpu.runRoutine(0x4000, 0xbff0);
    const z80 = memory[RAM.res];
    const play = romCanMoveDirection(x, y, d, hitbox, (col, row) => {
      const fam = tiles[row * 32 + col] & 0xf0;
      return fam !== 0 && fam !== 0x20;
    }) ? 1 : 0;
    assert.equal(z80, play, `mismatch: entity=${e} x=${x} y=${y} dir=${d} hitbox=${JSON.stringify(hitbox)} z80=${z80} play=${play}`);
    cases++;
    if (play === 0) blocked++;
  }
}
// coll_flags_from_layer: all 256 layers
for (let layer = 0; layer < 256; layer++) {
  memory[0xc103] = layer;
  memory[RAM.res] = 0xaa;
  cpu.runRoutine(0x4010, 0xbff0);
  assert.equal(memory[RAM.res], romCollisionFlagsFromLayer(layer), `coll_flags_from_layer mismatch for layer ${layer}`);
}
// wall_build_hitbox_cache adaptive probes vs romAdaptiveProbes (Play floor/wall probes)
let probeCases = 0;
for (let w = 1; w <= 40; w++) {
  for (let h = 1; h <= 40; h += 3) {
    const e = (w + h) % 32;
    const x = (w * 37) % 200;
    const y = (h * 53) % 160;
    memory[RAM.w + e] = w; memory[RAM.h + e] = h; memory[RAM.ox + e] = 0; memory[RAM.oy + e] = 0;
    memory[RAM.ent] = e; memory[0xc110] = x; memory[0xc111] = y;
    cpu.runRoutine(0x4020, 0xbff0);
    const [pl, pr] = romAdaptiveProbes(x, w);
    const [pt, pb] = romAdaptiveProbes(y, h);
    assert.deepEqual([memory[0xc118], memory[0xc119], memory[0xc11a], memory[0xc11b]], [pl, pr, pt, pb], `probe mismatch w=${w} h=${h} x=${x} y=${y}`);
    probeCases++;
  }
}
// update_behavior_component vs romBehaviorStep
let behaviorCases = 0;
for (let k = 0; k < 3000; k++) {
  const e = rnd(32);
  let hero: number | null = rnd(6) === 0 ? null : rnd(32);
  if (hero === e) hero = null;
  const cfg = { type: rnd(6), speed: rnd(17), stopDistance: rnd(20), range: rnd(4) === 0 ? 0 : rnd(120), direction: 1 + rnd(2) };
  const x = rnd(256);
  const heroX = rnd(4) === 0 ? x : rnd(256);
  const facing = rnd(3);
  const wallFlags = [0, 0x04, 0x08, 0x0c, 0x03][rnd(5)];
  memory[0xc120] = 1; memory[0xc121] = e;
  memory[0xc130] = hero === null ? 0xff : hero;
  memory[0xc300 + e] = 0x20;
  memory[0xc320 + e] = cfg.type; memory[0xc340 + e] = cfg.speed; memory[0xc360 + e] = cfg.stopDistance;
  memory[0xc380 + e] = cfg.range; memory[0xc3a0 + e] = cfg.direction;
  memory[0xc3c0 + e] = facing; memory[0xc3e0 + e] = 0x55; memory[0xc400 + e] = wallFlags;
  memory[RAM.x + e] = x;
  if (hero !== null) memory[RAM.x + hero] = heroX;
  cpu.runRoutine(0x4030, 0xbff0);
  const play = romBehaviorStep(cfg, { x, heroX: hero === null ? null : heroX, facing, wallFlags });
  const z80Vx = memory[0xc3e0 + e];
  const expectedVx = play.vx === undefined ? 0x55 : play.vx & 0xff;
  assert.equal(z80Vx, expectedVx, `behavior vx mismatch ${JSON.stringify({ cfg, x, hero, heroX, facing, wallFlags })}`);
  assert.equal(memory[0xc3c0 + e], play.facing, `behavior facing mismatch ${JSON.stringify({ cfg, x, hero, heroX, facing, wallFlags })}`);
  behaviorCases++;
}
assert.ok(blocked > cases / 10 && blocked < cases * 0.9, `test map should block a fair share of moves (${blocked}/${cases})`);
console.log(`OK ROM == Play: move test ${cases} random cases (${blocked} blocked) + coll_flags_from_layer 256 layers + ${probeCases} WallCollision probe boxes + ${behaviorCases} Behavior steps, Z80 assembled by glass.jar`);
