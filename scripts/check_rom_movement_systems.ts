#!/usr/bin/env node
// Z80 differential test: Mirror, WallJump and Dash ROM routines vs the pure TS mirrors used by
// Mideas Play mode (utils/romMoveTest.ts). Extracts the real routines from
// utils/msxGenerator/generators/componentsGenerator.ts, assembles them with server/glass.jar and
// runs them on the Cowbell Z80 with random inputs.
//
// Run: npx tsx scripts/check_rom_movement_systems.ts   (npm run test:rom-movement-systems)
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import vm from 'node:vm';
import { romDashFrontTile, romDashStep, romMirrorStep, romWallJumpStep, type RomDashConfig, type RomWallJumpConfig } from '../utils/romMoveTest';

const root = new URL('..', import.meta.url).pathname;
const read = (p: string) => readFileSync(join(root, p), 'utf8');
const slice = (text: string, start: string, end: string) => {
  const a = text.indexOf(start);
  const b = text.indexOf(end, a);
  assert.ok(a >= 0 && b > a, `markers not found: ${start} .. ${end}`);
  return text.slice(a, b);
};
const compGen = read('utils/msxGenerator/generators/componentsGenerator.ts');
const mirror = slice(compGen, 'update_mirror_component:\n    ld a, (active_entity_count)', '`, {\n        id: \'runtime.components.mirror\'');
const wallJump = slice(compGen, 'walljump_process_entity_c:\n', '; ------------------------------------------------------------------\n; walljump_restore_animation_if_done_c');
const wallJumpHelpers = slice(compGen, 'walljump_clear_active_state_c:\n', '.walljump_input_right_true:\n') + '.walljump_input_right_true:\n    ld a, 1\n    ret\n';
const dash = slice(compGen, 'player_fast_dash_process_c:\n', '; Register Contract:\n; input: player_dash_tile_x/y = front dash probe tile');

const A = {
  activeCount: 0xc000, activeList: 0xc001, inBtnCurr: 0xc010, inBtnPrev: 0xc011, inState: 0xc012,
  dashTimer: 0xc013, dashCooldown: 0xc014, dashDir: 0xc015, dashTileX: 0xc016, dashTileY: 0xc017,
  bossCooldown: 0xc018, animStart: 0xc019, vramAddr: 0xc01a, vramCount: 0xc01c, result: 0xc01d,
  mirrorFlags: 0xc100, velX: 0xc120, velY: 0xc140, facing: 0xc160, xPos: 0xc180, yPos: 0xc1a0,
  onGround: 0xc1c0, onLadder: 0xc1e0, wallFlags: 0xc200, wjLock: 0xc220, wjLockedVx: 0xc240,
  wjEnabled: 0xc260, wjPush: 0xc280, wjSlide: 0xc2a0, wjLockFrames: 0xc2c0, wjAway: 0xc2e0,
  platformId: 0xc300, inputDisabled: 0xc320, dashEnabled: 0xc340,
  dashSpeed: 0xc360, dashDuration: 0xc380, dashCooldownCfg: 0xc3a0, dashMaxAir: 0xc3c0, dashFlags: 0xc3e0,
  wallGrabActive: 0xc480, dashVx: 0xc4a0, dashVy: 0xc4a1, dashAirUsed: 0xc4a2,
  gravityVel: 0xc400, wjImpulse: 0xc440, behaviorMap: 0xc500, layout: 0xc800,
};
const h = (n: number) => `#${n.toString(16).toUpperCase()}`;
const asm = `
active_entity_count EQU ${h(A.activeCount)}
active_entity_list EQU ${h(A.activeList)}
input_btn_curr EQU ${h(A.inBtnCurr)}
input_btn_prev EQU ${h(A.inBtnPrev)}
input_state EQU ${h(A.inState)}
player_dash_timer EQU ${h(A.dashTimer)}
player_dash_cooldown EQU ${h(A.dashCooldown)}
player_dash_dir EQU ${h(A.dashDir)}
player_dash_tile_x EQU ${h(A.dashTileX)}
player_dash_tile_y EQU ${h(A.dashTileY)}
boss_hit_cooldown EQU ${h(A.bossCooldown)}
t_anim_start EQU ${h(A.animStart)}
t_vram_addr EQU ${h(A.vramAddr)}
t_vram_count EQU ${h(A.vramCount)}
t_result EQU ${h(A.result)}
entity_mirror_flags EQU ${h(A.mirrorFlags)}
entity_vel_x EQU ${h(A.velX)}
entity_vel_y EQU ${h(A.velY)}
entity_facing_dir EQU ${h(A.facing)}
entity_x_pos EQU ${h(A.xPos)}
entity_y_pos EQU ${h(A.yPos)}
entity_on_ground EQU ${h(A.onGround)}
entity_on_ladder EQU ${h(A.onLadder)}
entity_wall_collision_flags EQU ${h(A.wallFlags)}
entity_walljump_lock EQU ${h(A.wjLock)}
entity_walljump_locked_vx EQU ${h(A.wjLockedVx)}
entity_walljump_cfg_enabled EQU ${h(A.wjEnabled)}
entity_walljump_cfg_horizontal_push EQU ${h(A.wjPush)}
entity_walljump_cfg_slide_fall_speed EQU ${h(A.wjSlide)}
entity_walljump_cfg_lock_frames EQU ${h(A.wjLockFrames)}
entity_walljump_cfg_require_away EQU ${h(A.wjAway)}
entity_platform_id EQU ${h(A.platformId)}
entity_input_disabled EQU ${h(A.inputDisabled)}
entity_dash_cfg_enabled EQU ${h(A.dashEnabled)}
entity_dash_cfg_speed EQU ${h(A.dashSpeed)}
entity_dash_cfg_duration EQU ${h(A.dashDuration)}
entity_dash_cfg_cooldown EQU ${h(A.dashCooldownCfg)}
entity_dash_cfg_max_air EQU ${h(A.dashMaxAir)}
entity_dash_cfg_flags EQU ${h(A.dashFlags)}
entity_wallgrab_active EQU ${h(A.wallGrabActive)}
player_dash_vx EQU ${h(A.dashVx)}
player_dash_vy EQU ${h(A.dashVy)}
player_dash_air_used EQU ${h(A.dashAirUsed)}
entity_gravity_vel EQU ${h(A.gravityVel)}
entity_walljump_cfg_vertical_impulse EQU ${h(A.wjImpulse)}
runtime_behavior_map EQU ${h(A.behaviorMap)}
runtime_screen_layout EQU ${h(A.layout)}
NAMETBL EQU #1800
TILE_BREAKABLE EQU #01
INPUT_BTN_FIRE EQU #01
INPUT_BTN_GRAB EQU #02
STICK_UP EQU 1
STICK_UPRIGHT EQU 2
STICK_RIGHT EQU 3
STICK_DOWNRIGHT EQU 4
STICK_DOWN EQU 5
STICK_DOWNLEFT EQU 6
STICK_LEFT EQU 7
STICK_UPLEFT EQU 8
    ORG #4000
    call update_mirror_component
    ret
    DS #4010 - $
    ld a, (t_result)
    ld c, a
    call walljump_process_entity_c
    ret
    DS #4020 - $
    ld a, (t_result)
    ld c, a
    call player_fast_dash_process_c
    ld (t_result), a
    ret

; Test stand-ins for routines outside the units under test
walljump_restore_animation_if_done_c:
    ret
walljump_start_jump_animation_c:
    ld a, 1
    ld (t_anim_start), a
    ret
player_dash_hit_boss_weakpoint:
    ret
FAST_WRTVRM:
    ld (t_vram_addr), hl
    ld hl, t_vram_count
    inc (hl)
    ret

${mirror}
${wallJump}
${wallJumpHelpers}
${dash}
`;

const dir = mkdtempSync(join(tmpdir(), 'rom-moves-'));
writeFileSync(join(dir, 'test.asm'), asm);
try {
  execFileSync('java', ['-jar', join(root, 'server/glass.jar'), join(dir, 'test.asm'), join(dir, 'test.bin')], { stdio: 'pipe' });
} catch (err: any) {
  console.error(String(err.stdout || ''), String(err.stderr || ''));
  throw err;
}
const bin = readFileSync(join(dir, 'test.bin'));

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

let seed = 4242;
const rnd = (n: number) => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return (seed >>> 12) % n; };
const s8 = (b: number) => (b >= 0x80 ? b - 0x100 : b);
const w16 = (addr: number) => memory[addr] | (memory[addr + 1] << 8);

// ---------------- Mirror ----------------
let mirrorCases = 0;
for (let k = 0; k < 2000; k++) {
  const e = rnd(32);
  const flags = rnd(4);
  const vx = rnd(4) === 0 ? 0 : rnd(256);
  const facing = rnd(3);
  memory[A.activeCount] = 1; memory[A.activeList] = e;
  memory[A.mirrorFlags + e] = flags; memory[A.velX + e] = vx; memory[A.facing + e] = facing;
  cpu.runRoutine(0x4000, 0xbff0);
  const play = romMirrorStep(flags, s8(vx), facing);
  assert.equal(memory[A.velX + e], play.velX & 0xff, `mirror vx ${JSON.stringify({ flags, vx, facing })}`);
  assert.equal(memory[A.facing + e], play.facing, `mirror facing ${JSON.stringify({ flags, vx, facing })}`);
  mirrorCases++;
}

// ---------------- WallJump ----------------
let wallJumpCases = 0;
let wallJumps = 0;
for (let k = 0; k < 6000; k++) {
  const e = rnd(32);
  const cfg: RomWallJumpConfig = {
    enabled: rnd(8) !== 0,
    horizontalPush: 1 + rnd(12),
    verticalImpulseWord: (0x10000 - (1 + rnd(2048))) & 0xffff,
    slideFallSpeed: rnd(5),
    lockFrames: rnd(30),
    requireAway: rnd(3) === 0,
  };
  const st = {
    x: rnd(256), velX: rnd(256), velY: rnd(256), gravityVel: rnd(65536),
    onGround: rnd(5) === 0, onLadder: rnd(8) === 0,
    wallFlags: [0, 0x04, 0x08, 0x0c, 0x02, 0x06, 0x04, 0x08][rnd(8)],
    lock: rnd(20), lockedVx: rnd(3) === 0 ? 0 : rnd(256), facing: rnd(3),
  };
  const curr = rnd(4);
  const prev = rnd(4);
  const stick = rnd(9);
  memory[A.result] = e;
  memory[A.wjEnabled + e] = cfg.enabled ? 1 : 0; memory[A.wjPush + e] = cfg.horizontalPush;
  memory[A.wjImpulse + e * 2] = cfg.verticalImpulseWord & 0xff; memory[A.wjImpulse + e * 2 + 1] = cfg.verticalImpulseWord >> 8;
  memory[A.wjSlide + e] = cfg.slideFallSpeed; memory[A.wjLockFrames + e] = cfg.lockFrames; memory[A.wjAway + e] = cfg.requireAway ? 1 : 0;
  memory[A.xPos + e] = st.x; memory[A.velX + e] = st.velX; memory[A.velY + e] = st.velY;
  memory[A.gravityVel + e * 2] = st.gravityVel & 0xff; memory[A.gravityVel + e * 2 + 1] = st.gravityVel >> 8;
  memory[A.onGround + e] = st.onGround ? 1 : 0; memory[A.onLadder + e] = st.onLadder ? 1 : 0;
  memory[A.wallFlags + e] = st.wallFlags; memory[A.wjLock + e] = st.lock; memory[A.wjLockedVx + e] = st.lockedVx;
  memory[A.facing + e] = st.facing; memory[A.platformId + e] = 7; memory[A.animStart] = 0;
  memory[A.inBtnCurr] = curr; memory[A.inBtnPrev] = prev; memory[A.inState] = stick;
  cpu.runRoutine(0x4010, 0xbff0);
  const fireEdge = (curr & 1) !== 0 && (prev & 1) === 0;
  const play = romWallJumpStep(cfg, { ...st, velX: s8(st.velX), velY: s8(st.velY), lockedVx: s8(st.lockedVx) }, fireEdge, stick);
  const z80 = {
    x: memory[A.xPos + e], velX: memory[A.velX + e], velY: memory[A.velY + e], gravityVel: w16(A.gravityVel + e * 2),
    onGround: (memory[A.onGround + e] & 1) !== 0, lock: memory[A.wjLock + e], lockedVx: memory[A.wjLockedVx + e],
    facing: memory[A.facing + e], jumped: memory[A.animStart] === 1, platform: memory[A.platformId + e],
  };
  const ts = {
    x: play.state.x, velX: play.state.velX & 0xff, velY: play.state.velY & 0xff, gravityVel: play.state.gravityVel,
    onGround: play.state.onGround, lock: play.state.lock, lockedVx: play.state.lockedVx & 0xff,
    facing: play.state.facing, jumped: play.jumped, platform: play.jumped ? 255 : 7,
  };
  assert.deepEqual(z80, ts, `walljump mismatch ${JSON.stringify({ cfg, st, curr, prev, stick })}`);
  wallJumpCases++;
  if (play.jumped) wallJumps++;
}

// ---------------- Dash (multi-frame sequences) ----------------
let dashFrames = 0;
let dashActive = 0;
let tilesBroken = 0;
let diagonalDashes = 0;
let blockedByCooldownOrAir = 0;
for (let run = 0; run < 300; run++) {
  const e = rnd(32);
  const map = new Uint8Array(32 * 24);
  for (let i = 0; i < map.length; i++) map[i] = rnd(3) === 0 ? 1 : 0;
  memory.set(map, A.behaviorMap);
  memory.fill(0x55, A.layout, A.layout + 768);
  const playMap = Uint8Array.from(map);
  let st = { timer: 0, cooldown: 0, dir: 0, vx: 0, vy: 0, airUsed: 0 };
  memory[A.dashTimer] = 0; memory[A.dashCooldown] = 0; memory[A.dashDir] = 0; memory[A.bossCooldown] = 0;
  memory[A.dashVx] = 0; memory[A.dashVy] = 0; memory[A.dashAirUsed] = 0;
  const cfg: RomDashConfig = rnd(6) === 0
    ? { enabled: false, speed: 0, duration: 0, cooldown: 0, maxAir: 0, flags: 0 }
    : { enabled: true, speed: 1 + rnd(12), duration: 1 + rnd(14), cooldown: rnd(4) === 0 ? 0 : rnd(20), maxAir: rnd(4), flags: rnd(8) };
  const enabled = cfg.enabled;
  memory[A.dashEnabled + e] = enabled ? 1 : 0; memory[A.dashSpeed + e] = cfg.speed; memory[A.dashDuration + e] = cfg.duration;
  memory[A.dashCooldownCfg + e] = cfg.cooldown; memory[A.dashMaxAir + e] = cfg.maxAir; memory[A.dashFlags + e] = cfg.flags;
  let prev = 0;
  for (let f = 0; f < 40; f++) {
    const curr = rnd(3) === 0 ? 2 : 0;
    const stick = rnd(9);
    const facing = rnd(5);
    const inputDisabled = rnd(15) === 0;
    const onGround = rnd(3) === 0;
    const wallGrab = rnd(6) === 0;
    const x = rnd(256);
    const y = rnd(200);
    memory[A.result] = e; memory[A.inBtnCurr] = curr; memory[A.inBtnPrev] = prev; memory[A.inState] = stick;
    memory[A.facing + e] = facing; memory[A.inputDisabled + e] = inputDisabled ? 1 : 0;
    memory[A.onGround + e] = onGround ? 1 : 0; memory[A.wallGrabActive + e] = wallGrab ? 1 : 0;
    memory[A.xPos + e] = x; memory[A.yPos + e] = y; memory[A.velX + e] = 0x33; memory[A.velY + e] = 0x44;
    memory[A.vramCount] = 0;
    cpu.runRoutine(0x4020, 0xbff0);
    const play = romDashStep(st, cfg, inputDisabled, (curr & 2) !== 0 && (prev & 2) === 0, stick, facing, onGround, wallGrab);
    st = play.state;
    const ctxInfo = JSON.stringify({ run, f, cfg, inputDisabled, onGround, wallGrab, curr, prev, stick, facing, x, y });
    assert.equal(memory[A.result], play.active ? 1 : 0, `dash active ${ctxInfo}`);
    assert.deepEqual([memory[A.dashTimer], memory[A.dashCooldown], memory[A.dashAirUsed]], [st.timer, st.cooldown, st.airUsed], `dash timers ${ctxInfo}`);
    if (play.active) {
      assert.equal(memory[A.dashDir], st.dir, `dash dir ${ctxInfo}`);
      assert.deepEqual([memory[A.velX + e], memory[A.velY + e]], [play.vx & 0xff, play.vy & 0xff], `dash velocity ${ctxInfo}`);
      const cell = romDashFrontTile(x, y, st.dir);
      let broke = false;
      if (cell) {
        const i = cell[1] * 32 + cell[0];
        if (playMap[i] & 1) { playMap[i] = 0; broke = true; tilesBroken++; }
      }
      assert.equal(memory[A.vramCount], broke ? 1 : 0, `dash broken tile ${ctxInfo}`);
      if (broke && cell) {
        assert.equal(memory[A.vramAddr] | (memory[A.vramAddr + 1] << 8), 0x1800 + cell[1] * 32 + cell[0], `dash VRAM address ${ctxInfo}`);
        assert.equal(memory[A.layout + cell[1] * 32 + cell[0]], 0, `dash layout cleared ${ctxInfo}`);
      }
      dashActive++;
      if (play.vx !== 0 && play.vy !== 0) diagonalDashes++;
    } else {
      if (enabled && !inputDisabled && (curr & 2) && !(prev & 2)) blockedByCooldownOrAir++;
      assert.deepEqual([memory[A.velX + e], memory[A.velY + e]], [0x33, 0x44], `dash idle must not touch velocity ${ctxInfo}`);
    }
    assert.deepEqual(Array.from(memory.slice(A.behaviorMap, A.behaviorMap + 768)), Array.from(playMap), `dash behavior map ${ctxInfo}`);
    prev = curr;
    dashFrames++;
  }
}

assert.ok(wallJumps > 100, `the random walljump cases should include real jumps (${wallJumps})`);
assert.ok(dashActive > 300 && diagonalDashes > 20 && blockedByCooldownOrAir > 20 && tilesBroken > 20, `the dash runs should dash and break tiles (${dashActive}, ${tilesBroken})`);
console.log(`OK ROM == Play: Mirror ${mirrorCases} cases + WallJump ${wallJumpCases} cases (${wallJumps} jumps) + Dash ${dashFrames} frames (${dashActive} dashing, ${diagonalDashes} diagonal, ${blockedByCooldownOrAir} presses blocked by cooldown/air limit, ${tilesBroken} tiles broken), Z80 assembled by glass.jar`);
