#!/usr/bin/env node
/**
 * Contract for the scripted-enemy Z80 interpreter
 * (utils/msxGenerator/generators/msx2/msx2EnemyBehaviorRuntime.ts).
 *
 * The heavy check here is the last one: the emitted routines are ASSEMBLED WITH
 * GLASS, the same compiler the ROM build uses. Reading Z80 and believing it is
 * how this project has shipped `ld hl,de`-class mistakes before; an assembler
 * either accepts the bytes or it does not.
 *
 * The rest guard the joins that an assembler cannot see:
 *   - the jump tables are indexed by opcode, so their ORDER must match the
 *     opcode constants in utils/msx2EnemyBehavior.ts. A table one entry out of
 *     step makes "turn" mean "jump" and is invisible until it runs;
 *   - a `dw` pointing at a label that does not exist assembles to zero in some
 *     configurations and jumps into the BIOS at runtime;
 *   - the interpreter promises to preserve BC (the update loop's slot counter)
 *     and IX. A path that returns without restoring the stack corrupts the
 *     whole enemy loop, not just one enemy.
 */
import { mkdtempSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const workDir = mkdtempSync(join(tmpdir(), 'mideas-enemy-runtime-'));
const out = join(workDir, 'runtime.mjs');
await build({
  entryPoints: [join(repoRoot, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2EnemyBehaviorRuntime.ts')],
  bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'silent',
});
const {
  buildEnemyBehaviorRuntimeAsm,
  buildEnemyBehaviorProgramAsm,
  MSX2_ENEMY_MOVEMENT_SCRIPTED,
  MSX2_ENEMY_SCRIPT_COND_COUNT,
  MSX2_ENEMY_SCRIPT_ACT_COUNT,
  MSX2_ENEMY_SCRIPT_POOL_BYTES,
} = await import(pathToFileURL(out).href);

const bakerOut = join(workDir, 'baker.mjs');
await build({
  entryPoints: [join(repoRoot, 'utils', 'msx2EnemyBehavior.ts')],
  bundle: true, format: 'esm', platform: 'node', outfile: bakerOut, logLevel: 'silent',
});
const { MSX2_ENEMY_COND, MSX2_ENEMY_ACT, bakeEnemyBehavior, createMsx2EnemyBehavior } =
  await import(pathToFileURL(bakerOut).href);

const pathOut = join(workDir, 'path.mjs');
await build({
  entryPoints: [join(repoRoot, 'utils', 'msx2PathFollow.ts')],
  bundle: true, format: 'esm', platform: 'node', outfile: pathOut, logLevel: 'silent',
});
const { bakePathFollow, pathNodeLabels } = await import(pathToFileURL(pathOut).href);

let failed = 0;
const check = (label, condition) => {
  console.log(`${condition ? 'OK  ' : 'FAIL'}: ${label}`);
  if (!condition) failed++;
};

const runtime = buildEnemyBehaviorRuntimeAsm({
  ramBase: 0xc300,
  poolProgramOffset: 24,
  poolStateOffset: 25,
  poolTimerOffset: 26,
  poolVelocityOffset: 27,
  // ENEMY_AHEAD walks the pool, so it needs both the stride and a ceiling on
  // the slot count. 30 = 24 base + the 6 the scripted engine adds.
  poolStride: 30,
  maxSlots: 4,
});
/** Same engine with automatic gravity armed, which is the normal case for a
 *  project: every authored behaviour falls unless it opts out. */
const gravityRuntime = buildEnemyBehaviorRuntimeAsm({
  ramBase: 0xc300,
  poolProgramOffset: 24,
  poolStateOffset: 25,
  poolTimerOffset: 26,
  poolVelocityOffset: 27,
  poolStride: 30,
  maxSlots: 4,
  programsUseGravity: true,
});
const gravityCode = gravityRuntime.routinesAsm.replace(/;[^\n]*/g, '').replace(/[ \t]+$/gm, '');

/** Same engine with the PATH FOLLOW walker armed. */
const pathRuntime = buildEnemyBehaviorRuntimeAsm({
  ramBase: 0xc300,
  poolProgramOffset: 24,
  poolStateOffset: 25,
  poolTimerOffset: 26,
  poolVelocityOffset: 27,
  poolStride: 32,
  maxSlots: 4,
  programsUsePath: true,
});
const pathCode = pathRuntime.routinesAsm.replace(/;[^\n]*/g, '').replace(/[ \t]+$/gm, '');
const asm = runtime.routinesAsm;
/** Structural matches run against the instructions alone: a trailing comment is
 *  not a difference, and making the checks depend on one makes them brittle. */
const code = asm.replace(/;[^\n]*/g, '').replace(/[ \t]+$/gm, '');

// ---- opcode tables line up with the baker's constants -----------------------
const tableTargets = (tableLabel) => {
  const body = asm.slice(asm.indexOf(`${tableLabel}:`));
  const lines = body.split('\n').slice(1);
  const targets = [];
  for (const line of lines) {
    const match = line.match(/^\s*dw\s+([A-Za-z_][A-Za-z0-9_]*)/);
    if (!match) break;
    targets.push(match[1]);
  }
  return targets;
};
const condTargets = tableTargets('bitmap_enemy_script_cond_table');
const actTargets = tableTargets('bitmap_enemy_script_act_table');

check('The condition table has one entry per condition opcode',
  condTargets.length === MSX2_ENEMY_SCRIPT_COND_COUNT
  && condTargets.length === Object.keys(MSX2_ENEMY_COND).length);
check('The action table has one entry per action opcode',
  actTargets.length === MSX2_ENEMY_SCRIPT_ACT_COUNT
  && actTargets.length === Object.keys(MSX2_ENEMY_ACT).length);

const snake = (name) => name.toLowerCase();
const condNames = Object.entries(MSX2_ENEMY_COND).sort((a, b) => a[1] - b[1]);
const actNames = Object.entries(MSX2_ENEMY_ACT).sort((a, b) => a[1] - b[1]);
// TIMER_ELAPSED shortens to _timer in ASM; everything else is a literal match.
const condAlias = { TIMER_ELAPSED: 'timer' };
check('THE BUG THIS GUARDS: condition table order matches the opcode numbers, so no condition means another one',
  condNames.every(([name, opcode]) =>
    condTargets[opcode] === `bitmap_enemy_script_cond_${condAlias[name] || snake(name)}`));
check('THE BUG THIS GUARDS: action table order matches the opcode numbers',
  actNames.every(([name, opcode]) => actTargets[opcode] === `bitmap_enemy_script_act_${snake(name)}`));

// ---- no table entry points at a label that was never emitted ---------------
const definedLabels = new Set(
  [...asm.matchAll(/^([A-Za-z_][A-Za-z0-9_]*):/gm)].map(m => m[1]));
check('THE BUG THIS GUARDS: every jump-table entry points at a label that exists',
  [...condTargets, ...actTargets].every(target => definedLabels.has(target)));

// ---- the word-index trap this codebase keeps paying for --------------------
const doubling = [...code.matchAll(/add hl, hl/g)].length;
check('Every word table read doubles its index before adding the base',
  doubling >= 3 && /ld de, bitmap_enemy_script_ptr_table/.test(code)
  && /ld de, bitmap_enemy_script_cond_table/.test(code)
  && /ld de, bitmap_enemy_script_act_table/.test(code));

// ---- the register contract --------------------------------------------------
const stepBody = code.slice(code.indexOf('bitmap_enemy_script_step:'), code.indexOf('bitmap_enemy_script_origin:'));
check('THE BUG THIS GUARDS: the slot counter in BC is pushed once on entry and popped on the single exit',
  (stepBody.match(/^\s*push bc$/gm) || []).length === 1
  && (stepBody.match(/^\s*pop bc$/gm) || []).length === 1
  && /bitmap_enemy_script_done:[\s\S]*?\n\s*pop bc\s*\n\s*ret/.test(code)
  // The per-tick housekeeping sits between _done: and the pop now. Anything it
  // pushed and forgot would be popped into BC and returned to the update loop
  // as a slot counter, so the exit path must leave the stack exactly as it was.
  && !/bitmap_enemy_script_done:[\s\S]*?push[\s\S]*?pop bc\s*\n\s*ret/.test(code));
check('Nothing in the interpreter writes IX, which the update loop owns',
  !/^\s*(ld ix|pop ix|add ix)/m.test(code));
check('The probe helpers save DE across bitmap_probe_solid, which clobbers it',
  /push de\s*\n\s*call bitmap_enemy_script_probe_head\s*\n\s*pop de/.test(code)
  && /push de\s*\n\s*call bitmap_enemy_script_probe_below\s*\n\s*pop de/.test(code));

// ---- the room-edge traps ----------------------------------------------------
check('THE BUG THIS GUARDS: a left-facing enemy at x=0 hits the edge guard instead of wrapping to column 15',
  /ld a, d\s*\n\s*or a\s*\n\s*jp z, bitmap_enemy_script_edge/.test(code));
check('THE BUG THIS GUARDS: probing above the room lid is answered deliberately, not by Y underflowing past 192',
  /sub b\s*\n\s*jp c, bitmap_enemy_script_edge/.test(code));
check('Walking off the right of the room is an edge, not a carry into column 0',
  /add a, 16\s*\n\s*jp c, bitmap_enemy_script_edge/.test(code));

// ---- the mode number --------------------------------------------------------
check('The scripted mode takes the next free number after FlyBounce8 (13)',
  MSX2_ENEMY_MOVEMENT_SCRIPTED === 14);
// Not a frozen number: the point is that every byte the engine charges to EVERY
// slot is one somebody chose. Bump this deliberately when the engine grows, and
// say what the new byte is for.
//   4 = program, state, timer, velocity
//   6 = ... + shield clock, hit stamp
check('The engine charges exactly the six pool bytes it uses per slot', MSX2_ENEMY_SCRIPT_POOL_BYTES === 6);
// The shield and the hit stamp both count DOWN, so a zeroed slot is already a
// valid "no guard, not hit" state and nothing has to initialise them. That only
// holds if neither is ever decremented past zero, which is what this asserts.
check('THE BUG THIS GUARDS: neither countdown wraps past zero, which is what makes a zeroed slot valid',
  /or a\s*\n\s*jp z, \.keep_hit\s*\n\s*dec \(ix\+\d+\)/.test(code)
  && /or a\s*\n\s*jp z, \.housekeeping_done\s*\n\s*dec \(ix\+\d+\)/.test(code));
check('THE BUG THIS GUARDS: the per-tick countdowns live on the single exit, not in _tick, which a state change skips',
  /bitmap_enemy_script_done:[\s\S]*?dec \(ix\+\d+\)[\s\S]*?dec \(ix\+\d+\)[\s\S]*?pop bc\s*\n\s*ret/.test(code)
  && !/bitmap_enemy_script_tick:[\s\S]*?dec \(ix[\s\S]*?bitmap_enemy_script_done:/.test(code));

// ---- the layers of one enemy must agree -------------------------------------
// THE BUG THIS GUARDS, measured on hardware: a placed enemy owns one pool slot
// per colour layer and the interpreter runs on each. While RANDOM advanced the
// seed on every call, the two layers of the SAME enemy read different numbers,
// made different decisions, and separated — one dropped through a platform, the
// other stayed, 86px apart within four seconds. The bat runtime hit this first
// and fixed it the same way; this keeps the scripted engine from re-learning it.
check('THE BUG THIS GUARDS: RANDOM only READS the seed, so every layer of an enemy reads the same number',
  /bitmap_enemy_script_cond_random:\s*\n\s*ld a, \(bitmap_enemy_script_seed\)\s*\n\s*ld hl, bitmap_enemy_script_arg/.test(code)
  && !/bitmap_enemy_script_cond_random:[\s\S]{0,200}?ld \(bitmap_enemy_script_seed\), a/.test(code));
check('The seed advances once per FRAME, gated on being the first slot of the sweep',
  /ld a, \(bitmap_enemy_count\)\s*\n\s*cp b\s*\n\s*jp nz, \.escript_seed_done[\s\S]*?ld \(bitmap_enemy_script_seed\), a/.test(code));

// THE BUG THIS GUARDS: the step used to be `rlca / xor #1D`, which LOOKS like an
// LFSR and behaves like a metronome. Every regex I could write about its spelling
// passed on it, so this check does the only thing that would have failed: it RUNS
// the emitted instructions over all 256 seeds and measures the orbits. The old
// step gives 36 orbits whose longest is 8, plus two fixed points; from a zeroed
// RAM byte it loops 00 1D 27 53 BB 6A C9 8E for ever, and a branch reached on a
// frame-periodic schedule locks onto one phase and stops varying.
const seedBlock = (code.match(/jp nz, \.escript_seed_done\n([\s\S]*?)\.escript_seed_done:/) || [])[1];
const stepSeed = (() => {
  if (!seedBlock) return null;
  const lines = seedBlock.split('\n').map(line => line.replace(/;.*$/, '').trim()).filter(Boolean);
  const labels = new Map();
  lines.forEach((line, index) => { if (line.endsWith(':')) labels.set(line.slice(0, -1), index); });
  const at = name => {
    if (!labels.has(name)) throw new Error(`jump to a label the block does not define: ${name}`);
    return labels.get(name);
  };
  return seed => {
    let a = seed, carry = 0, zero = 0, pc = 0, guard = 0;
    while (pc < lines.length) {
      if (++guard > 200) throw new Error('the seed step does not terminate');
      const line = lines[pc++];
      let m;
      if (line.endsWith(':')) continue;
      if (line === 'ld a, (bitmap_enemy_script_seed)') { a = seed; continue; }
      if (line === 'ld (bitmap_enemy_script_seed), a') return a;
      if (line === 'or a') { carry = 0; zero = a === 0 ? 1 : 0; continue; }
      if (line === 'add a, a') { carry = a >> 7; a = (a << 1) & 0xff; zero = a === 0 ? 1 : 0; continue; }
      if (line === 'rlca') { carry = a >> 7; a = ((a << 1) | (a >> 7)) & 0xff; continue; }
      if (line === 'rrca') { carry = a & 1; a = ((a >> 1) | (a << 7)) & 0xff; continue; }
      if ((m = line.match(/^xor #([0-9A-F]{2})$/))) { a ^= parseInt(m[1], 16); carry = 0; zero = a === 0 ? 1 : 0; continue; }
      if ((m = line.match(/^ld a, #([0-9A-F]{2})$/))) { a = parseInt(m[1], 16); continue; }
      if ((m = line.match(/^jp (nz|z|nc|c), (\S+)$/))) {
        const take = { nz: !zero, z: zero, nc: !carry, c: carry }[m[1]];
        if (take) pc = at(m[2]);
        continue;
      }
      if ((m = line.match(/^jp (\S+)$/))) { pc = at(m[1]); continue; }
      // An instruction this model does not know must FAIL the guard, never pass
      // it: a silent skip is how a check starts agreeing with everything.
      throw new Error(`unmodelled instruction in the seed step: ${line}`);
    }
    throw new Error('the seed step never stores a value');
  };
})();
let longestOrbit = 0;
let orbitError = '';
try {
  const seen = new Set();
  for (let start = 0; start < 256; start++) {
    if (seen.has(start)) continue;
    const order = new Map();
    let value = start;
    while (!order.has(value)) { order.set(value, order.size); value = stepSeed(value); }
    const length = order.size - order.get(value);
    for (const v of order.keys()) seen.add(v);
    longestOrbit = Math.max(longestOrbit, length);
  }
} catch (error) { orbitError = error.message; }
check(`THE BUG THIS GUARDS: the seed step is a maximal LFSR, not a short cycle dressed as one (longest orbit ${longestOrbit}${orbitError ? `, ${orbitError}` : ''})`,
  !orbitError && longestOrbit === 255);
// And the dead value has a way back, or a maximal LFSR is strictly worse than
// the short cycle it replaced: 0 shifts to 0 for ever, and RAM boots to 0.
check('THE BUG THIS GUARDS: a zero seed re-enters the cycle instead of locking there',
  !!stepSeed && stepSeed(0) !== 0);
// THE BUG THIS GUARDS, measured on hardware before the leader/follower change:
// ENEMY_AHEAD skipped only its own slot ADDRESS, so the second layer of a body
// saw the first one a pixel ahead — the leader had already moved that frame —
// and turned away from it. The two layers fled each other from the first frames
// and settled 20px apart. Address equality is never the right identity for a
// body that owns several slots; the logical origin is.
check('THE BUG THIS GUARDS: ENEMY_AHEAD skips every slot of MY OWN body, not just my own slot',
  /bitmap_enemy_script_cond_enemy_ahead:[\s\S]*?call bitmap_enemy_script_origin[\s\S]*?\.ea_slot:[\s\S]*?cp d\s*\n\s*jp nz, \.ea_test[\s\S]*?cp e\s*\n\s*jp z, \.ea_next/.test(code)
  && !/bitmap_enemy_script_cond_enemy_ahead:[\s\S]{0,400}?push ix\s*\n\s*pop de/.test(code));
check('ENEMY_AHEAD keeps its slot counter across the origin arithmetic',
  /\.ea_slot:\s*\n\s*push hl\s*\n\s*push bc[\s\S]*?pop bc\s*\n\s*pop hl/.test(code));

// ---- one-way platforms ------------------------------------------------------
// THE BUG THIS GUARDS: the landing band and the DROP_THROUGH nudge are the same
// number by necessity. Nudge less than the band and the enemy lands straight
// back on the platform it just chose to leave — which reads as "the random never
// fires", not as an off-by-one, and would be hunted in the wrong file.
check('THE BUG THIS GUARDS: DROP_THROUGH steps exactly the landing band, so it cannot re-land on the platform it left',
  /bitmap_enemy_script_act_drop_through:[\s\S]*?add a, 4\s*\n\s*ld \(ix\+1\), a/.test(code));
check('DROP_THROUGH refuses to move when there is no one-way platform underfoot',
  /bitmap_enemy_script_act_drop_through:[\s\S]*?bit 5, a\s*\n\s*jp z, bitmap_enemy_script_apply/.test(code));
check('ON_PLATFORM_TILE reads the cell under the feet rather than assuming',
  /bitmap_enemy_script_cond_on_platform_tile:[\s\S]*?add a, 16[\s\S]*?call bitmap_probe_solid\s*\n\s*bit 5, a/.test(code));
// Default OFF: a project with no Platform cell must keep asking the old question,
// or every existing ROM moves for a feature it never uses.
// THE BUG THIS GUARDS, found on hardware: one helper answered both "does this
// block me" (walls) and "can I stand there" (ledges). With one-way platforms
// those diverge — a platform says it does not block — so the ledge test read
// solid ground as a hole and the enemy turned on the spot for ever, 428 times in
// seven seconds, with every rule below it never reached.
check('THE BUG THIS GUARDS: the ledge test asks the floor question, not the wall question',
  /bitmap_enemy_script_cond_no_floor_ahead:\s*\n\s*ld c, 16\s*\n\s*call bitmap_enemy_script_probe_floor_ahead/.test(code)
  && /bitmap_enemy_script_cond_floor_ahead:\s*\n\s*ld c, 16\s*\n\s*call bitmap_enemy_script_probe_floor_ahead/.test(code));
check('The wall tests keep asking the blocking question',
  /bitmap_enemy_script_cond_wall_ahead:[\s\S]*?call bitmap_enemy_script_probe_ahead\b/.test(code)
  && /bitmap_enemy_script_cond_no_wall_ahead:[\s\S]*?call bitmap_enemy_script_probe_ahead\b/.test(code));
check('Without a floor probe the ground test still goes to bitmap_probe_solid',
  /bitmap_enemy_script_probe_below:[\s\S]*?jp bitmap_probe_solid/.test(code));
// ---- FIRE and the enemy bullet pool ----------------------------------------
// FIRE shipped once as a reserved no-op: it baked, the enemy played its firing
// state, and nothing came out of the ROM. These guard that it can never go back
// to being quietly inert.
const bulletOptions = {
  ramBase: 0xc320, slotCount: 2, speedPx: 3,
  playerHurtLabel: 'bitmap_boss_hurt_player', damageHearts: 1,
};
const baseOptions = {
  ramBase: 0xc300,
  poolProgramOffset: 24, poolStateOffset: 25, poolTimerOffset: 26, poolVelocityOffset: 27,
  poolStride: 30, maxSlots: 4,
};

const withFloor = buildEnemyBehaviorRuntimeAsm({ ...baseOptions, floorProbeLabel: 'bitmap_probe_floor' });
check('With one-way platforms the ground test routes through the shared floor probe',
  /bitmap_enemy_script_probe_below:[\s\S]*?jp bitmap_probe_floor/
    .test(withFloor.routinesAsm.replace(/;[^\n]*/g, '')));

let threw = false;
try {
  buildEnemyBehaviorRuntimeAsm({ ...baseOptions, programsUseFire: true });
} catch { threw = true; }
check('THE BUG THIS GUARDS: a program that fires without a pool breaks the build instead of shipping a silent no-op',
  threw);
check('A pool with no program that fires is not emitted at all',
  !/bitmap_enemy_bullet_pool/.test(asm) && runtime.bulletRamBytes === 0);

const armed = buildEnemyBehaviorRuntimeAsm({ ...baseOptions, programsUseFire: true, enemyBullets: bulletOptions });
const armedCode = armed.routinesAsm.replace(/;[^\n]*/g, '').replace(/[ \t]+$/gm, '');
check('With a pool, FIRE really calls the spawn routine',
  /bitmap_enemy_script_act_fire:\s*\n\s*call bitmap_enemy_bullet_spawn/.test(armedCode));
check('Enemy bullets respect the shared player invulnerability window',
  /ld a, \(player_invuln\)[\s\S]*?jp nz, \.ebul_next/.test(armedCode));
check('The pool reports the RAM it uses so the caller can reserve it',
  armed.bulletRamBytes === 8 && /bitmap_enemy_bullet_pool\s+EQU #C320/.test(armed.equates));
check('THE BUG THIS GUARDS: the slot counter survives the probe, which takes its arguments in the same register pair',
  /push bc\s*\n\s*ld b, \(ix\+1\)\s*\n\s*ld c, \(ix\+2\)\s*\n\s*call bitmap_probe_solid\s*\n\s*pop bc/.test(armedCode));
check('A full pool drops the shot instead of recycling a bullet already in flight',
  /djnz \.ebul_spawn_find\s*\n\s*pop bc\s*\n\s*ret/.test(armedCode));
// THE BUG THIS GUARDS, and it cost a failed ROM build to find: the generated
// modules all land in ONE flat symbol table, so a "local" label is only local by
// convention. A plain `.spawn_left` collided head-on with the player's
// bitmap_try_spawn_bullet and Glass refused the whole ROM. This harness
// assembles the runtime ALONE, so it could never have seen the collision — which
// is exactly why the guard has to be a naming rule and not another assembly.
const bulletSection = armedCode.slice(armedCode.indexOf('bitmap_enemy_bullet_spawn:'));
const bulletLocals = [...bulletSection.matchAll(/^(\.[A-Za-z0-9_]+):/gm)].map(m => m[1]);
check('THE BUG THIS GUARDS: every local label in the bullet code is prefixed, so it cannot collide with another generator',
  bulletLocals.length >= 8 && bulletLocals.every(label => label.startsWith('.ebul_')));

// ---- automatic gravity ------------------------------------------------------
// THE BUG THIS GUARDS: before this existed, an enemy whose rules never touched
// the vertical axis simply hovered over the hole it had walked into, and every
// authored behaviour needed a FALL rule that authors kept forgetting.
check('Default OFF: no gravity hook and no table read without an authored faller',
  !code.includes('bitmap_enemy_script_gravity_table')
  && !code.includes('bitmap_enemy_script_vmoved'));
check('Gravity runs on the single exit, so it applies whichever rule fired',
  /bitmap_enemy_script_done:[\s\S]{0,400}?call bitmap_enemy_script_integrate_vy/.test(gravityCode));
// THE BUG THIS GUARDS: integrating twice in one tick doubles the fall speed and
// makes JUMP look like it barely leaves the ground.
check('An action that already moved the body vertically suppresses gravity for that tick',
  /ld a, \(bitmap_enemy_script_vmoved\)\s*\n\s*or a\s*\n\s*jp nz, \.gravity_done/.test(gravityCode)
  && /bitmap_enemy_script_act_fall:\s*\n\s*ld a, 1\s*\n\s*ld \(bitmap_enemy_script_vmoved\), a/.test(gravityCode)
  && /bitmap_enemy_script_act_rise:\s*\n\s*ld a, 1/.test(gravityCode)
  && /bitmap_enemy_script_act_descend:\s*\n\s*ld a, 1/.test(gravityCode));
check('The flag is cleared at the top of every step, not left over from the last slot',
  /bitmap_enemy_script_step:\s*\n\s*push bc\s*\n\s*xor a\s*\n\s*ld \(bitmap_enemy_script_vmoved\), a/.test(gravityCode));
// THE BUG THIS GUARDS: the boss word tables cost a day when (room*2+slot) was
// used as a byte offset. This one is a db table, so the index must NOT be
// doubled — the mirror-image mistake, and just as silent.
check('The gravity table is indexed as bytes, not doubled like the word tables',
  /ld a, \(ix\+24\)\s*\n\s*ld l, a\s*\n\s*ld h, 0\s*\n\s*ld de, bitmap_enemy_script_gravity_table\s*\n\s*add hl, de/.test(gravityCode));
check('One integrator, called by both FALL and gravity, so they cannot drift apart',
  (gravityCode.match(/bitmap_enemy_script_integrate_vy:/g) || []).length === 1
  && (gravityCode.match(/call bitmap_enemy_script_integrate_vy/g) || []).length === 2);
check('A program can opt out: gravity 0 in the table skips the integrator',
  /ld de, bitmap_enemy_script_gravity_table[\s\S]{0,80}?or a\s*\n\s*jp z, \.gravity_done/.test(gravityCode));

const gravityPrograms = buildEnemyBehaviorProgramAsm([
  { id: 'walker', name: 'Walker', bytes: [1, 3, 0, 1, 0, 0, 0, 0, 0xff] },
  { id: 'floater', name: 'Floater', bytes: [1, 3, 0, 1, 0, 0, 0, 0, 0xff], gravity: false },
]);
check('The gravity table carries one byte per program, fallback included',
  /bitmap_enemy_script_gravity_table:\s*\n\s*db #01[\s\S]*?db #01[\s\S]*?db #00/.test(gravityPrograms.asm));
check('A project whose behaviours all fly emits no gravity table at all',
  !buildEnemyBehaviorProgramAsm([
    { id: 'floater', name: 'Floater', bytes: [1, 3, 0, 1, 0, 0, 0, 0, 0xff], gravity: false },
  ]).asm.includes('bitmap_enemy_script_gravity_table'));

// ---- PATH FOLLOW ------------------------------------------------------------
check('Default OFF: no path walker without an authored route',
  !code.includes('bitmap_enemy_script_path_step')
  && !code.includes('bitmap_enemy_script_kind_table'));
// THE BUG THIS GUARDS: the walker is entered by JP from inside the step, AFTER
// its push bc. A RET anywhere in it would return with that bc still stacked and
// unbalance the caller's loop counter — the same class of bug as the probe that
// ate the slot counter.
check('THE BUG THIS GUARDS: the path walker never RETs; every exit goes through _done',
  /bitmap_enemy_script_path_step:[\s\S]*?bitmap_enemy_script_step:/.test(pathCode)
  && !/bitmap_enemy_script_path_step:[\s\S]*?\n\s{4}ret\s*\n[\s\S]*?bitmap_enemy_script_step:/.test(pathCode));
check('A route walks the body before deciding anything',
  /bitmap_enemy_script_path_step:\s*\n\s*call bitmap_enemy_script_walk_body/.test(pathCode));
// THE BUG THIS GUARDS: one BYTE per program, indexed undoubled. The boss word
// tables cost a day by doubling; this is the same mistake mirrored.
check('The kind table is indexed as bytes, not doubled',
  /ld de, bitmap_enemy_script_kind_table\s*\n\s*add hl, de\s*\n\s*ld a, \(hl\)/.test(pathCode));
check('Walking is a callable body, so the route and the WALK action share one copy',
  (pathCode.match(/bitmap_enemy_script_walk_body:/g) || []).length === 1
  && /bitmap_enemy_script_act_walk:\s*\n\s*call bitmap_enemy_script_walk_body/.test(pathCode));
// THE BUG THIS GUARDS, and it crashed a real MSX inside one second: turning the
// WALK action into a callable body meant replacing its exits with RET. A search
// for "jp bitmap_enemy_script_apply" converted the UNCONDITIONAL ones and left
// `jp nc,` / `jp z,` / `jp c,` untouched — so three paths still left through
// _apply with the CALL's return address stranded on the stack. It grew every
// tick until the RAM was gone; the probe read #FF from the whole enemy pool.
// A callable routine must not contain a single jump out of it, conditional or not.
{
  const bodyStart = pathCode.indexOf('bitmap_enemy_script_walk_body:');
  const bodyEnd = pathCode.indexOf('bitmap_enemy_script_act_turn:');
  const body = bodyStart >= 0 && bodyEnd > bodyStart ? pathCode.slice(bodyStart, bodyEnd) : '';
  check('THE BUG THIS GUARDS: the callable walk body leaves only by RET, conditional exits included',
    body.length > 0 && !/\bjp\b[^\n]*bitmap_enemy_script_(apply|tick|done)/.test(body));
}
check('Node addressing multiplies by 5 without a multiply instruction',
  /add hl, hl\s*\n\s*add hl, hl\s*\n\s*add hl, de/.test(pathCode));
check('The alternate policy keeps one bit PER NODE, not one flag per body',
  /\.pth_alternate:[\s\S]{0,200}?and #07/.test(pathCode));

const pathBaked = bakePathFollow({
  nodes: [
    { id: 'a', cellX: 2, cellY: 6, action: 'SET_DIR', arg: 1, next: 'b' },
    { id: 'b', cellX: 9, cellY: 6, action: 'FALL', next: 'c', nextAlt: 'd', policy: 'random' },
    { id: 'c', cellX: 12, cellY: 4, action: 'JUMP', arg: 4 },
    { id: 'd', cellX: 12, cellY: 9, action: 'DESCEND' },
  ],
});
check('A baked route is one count byte plus five per node',
  pathBaked.bytes.length === 1 + 4 * 5 && pathBaked.bytes[0] === 4 && !pathBaked.errors.length);
check('The branch policy rides in the spare bits of the action byte, costing nothing',
  (pathBaked.bytes[1 + 5 + 1] >> 5) === 4 && (pathBaked.bytes[1 + 5 + 1] & 0x1f) === MSX2_ENEMY_ACT.FALL);
check('A node with one exit stores no policy, whatever the author left on it',
  (pathBaked.bytes[1 + 1] >> 5) === 0);

const pathPrograms = buildEnemyBehaviorProgramAsm([
  { id: 'rules', name: 'Rules', bytes: bakeEnemyBehavior(createMsx2EnemyBehavior('walker', 'Walker')).bytes },
  { id: 'route', name: 'Route', bytes: pathBaked.bytes, kind: 'path_follow' },
]);
check('The kind table marks the route and leaves the rules alone',
  /bitmap_enemy_script_kind_table:\s*\n\s*db #00[\s\S]*?db #00[\s\S]*?db #01/.test(pathPrograms.asm));

// ---- program emission -------------------------------------------------------
const preset = bakeEnemyBehavior(createMsx2EnemyBehavior('walker', 'Walker'));
const programs = buildEnemyBehaviorProgramAsm([{ id: 'walker', name: 'Walker', bytes: preset.bytes }]);
check('THE BUG THIS GUARDS: index 0 is the standing fallback, so a missing asset is not a wild pointer',
  programs.indexById.walker === 1
  && /bitmap_enemy_script_ptr_table:\s*\n\s*dw bitmap_enemy_script_program_0/.test(programs.asm));
check('Every pointer-table entry has a program body behind it',
  [...programs.asm.matchAll(/dw (bitmap_enemy_script_program_\d+)/g)]
    .every(m => programs.asm.includes(`${m[1]}:`)));

// ---- THE check that reading the code cannot replace: Glass assembles it -----
const glass = join(repoRoot, 'server', 'glass.jar');
if (!existsSync(glass)) {
  check('glass.jar is available to assemble the interpreter', false);
} else {
  // BOTH variants get assembled. Checking only the unarmed one would have left
  // the whole bullet pool — the newest and least-read code here — never seen by
  // an assembler, which is the same gap that let a reserved FIRE ship.
  const variants = [
    { label: 'interpreter', build: runtime, body: asm },
    { label: 'interpreter with the enemy bullet pool', build: armed, body: armed.routinesAsm },
    { label: 'interpreter with automatic gravity', build: gravityRuntime, body: gravityRuntime.routinesAsm },
    // The path variant carries its OWN program blob: the walker reads
    // bitmap_enemy_script_kind_table, which only exists when a route is baked.
    // Assembling it against the rules-only blob would fail on a missing symbol
    // and tell us nothing about the walker itself.
    { label: 'interpreter with the path walker', build: pathRuntime, body: pathRuntime.routinesAsm, programs: pathPrograms.asm },
  ];
  for (const variant of variants) {
    const source = join(workDir, `runtime_probe_${variant.label.replace(/\W+/g, '_')}.asm`);
    // Minimal harness: the interpreter plus stubs for everything it calls into,
    // so a failure can only come from the emitted code itself.
    writeFileSync(source, [
      '    org #4000',
      'player_y   EQU #C000',
      'player_x   EQU #C001',
      'player_invuln EQU #C002',
      // Owned by msx2BitmapEnemyGenerator, which is not in this harness. Stubbed
      // at plausible addresses: ENEMY_AHEAD only needs them to resolve.
      'bitmap_enemy_count EQU #C003',
      'bitmap_enemy_pool  EQU #C010',
      variant.build.equates,
      '    jp bitmap_enemy_script_step',
      'bitmap_probe_solid:',
      '    xor a',
      '    ret',
      // Lives in the boss generator, which is not in this harness either.
      'bitmap_boss_hurt_player:',
      '    ret',
      variant.body,
      variant.programs || programs.asm,
      '    db 0',
    ].join('\n'), 'latin1');
    let assembled = true;
    let detail = '';
    try {
      execFileSync('java', ['-jar', glass, source, join(workDir, `${variant.label.replace(/\W+/g, '_')}.rom`)], {
        cwd: workDir, stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000,
      });
    } catch (error) {
      assembled = false;
      detail = String(error.stdout || '') + String(error.stderr || '');
    }
    check(`THE BUG THIS GUARDS: Glass assembles the ${variant.label}, so no invalid Z80 reaches a ROM build`, assembled);
    if (!assembled) console.log(detail.split('\n').filter(Boolean).slice(0, 12).map(l => `      ${l}`).join('\n'));
  }
}

console.log(failed
  ? `\n${failed} enemy-behaviour runtime check(s) failed.`
  : '\nAll enemy-behaviour runtime checks passed.');
process.exit(failed ? 1 : 0);
