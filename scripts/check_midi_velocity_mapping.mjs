/**
 * Contract: MIDI velocity -> AY volume mapping.
 *
 * The AY volume register is 4 bits and its low half is barely audible, so a
 * light touch mapped straight onto 1..15 writes a value nobody hears. The
 * mapping therefore takes a floor, and spreads the sensitivity curve across
 * floor..15 instead of clamping it -- clamping would flatten every soft note
 * onto the same value and throw the dynamics away.
 *
 * Run: node scripts/check_midi_velocity_mapping.mjs
 */
import { buildSync } from 'esbuild';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'server', 'temp', '_midi_velocity');
mkdirSync(OUT_DIR, { recursive: true });
const OUT_FILE = join(OUT_DIR, 'midiVelocity.cjs');

buildSync({
  entryPoints: [join(ROOT, 'components', 'utils', 'midiVelocity.ts')],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  outfile: OUT_FILE,
  logLevel: 'silent',
});

const require = createRequire(import.meta.url);
const { midiVelocityToTrackerVolume } = require(OUT_FILE);

let failures = 0;
const check = (condition, label) => {
  if (condition) {
    console.log(`PASS  ${label}`);
  } else {
    console.error(`FAIL  ${label}`);
    failures++;
  }
};

const ALL_VELOCITIES = Array.from({ length: 127 }, (_, i) => i + 1);

// --- The floor is respected, however soft the touch -------------------------
{
  const floor = 12;
  const below = ALL_VELOCITIES.filter(v => midiVelocityToTrackerVolume(v, 1.5, floor) < floor);
  check(below.length === 0, 'with a floor of 12 no velocity ever maps below 12');
  check(
    midiVelocityToTrackerVolume(1, 1.5, floor) === floor,
    'the softest possible velocity lands exactly on the floor',
  );
}

// --- Full force still reaches the top --------------------------------------
{
  for (const floor of [1, 5, 12, 14]) {
    check(
      midiVelocityToTrackerVolume(127, 1.5, floor) === 15,
      `full velocity still reaches 15 with a floor of ${floor}`,
    );
  }
}

// --- Dynamics survive: the curve is spread, not clamped --------------------
{
  const floor = 12;
  const soft = midiVelocityToTrackerVolume(20, 1.5, floor);
  const mid = midiVelocityToTrackerVolume(64, 1.5, floor);
  const hard = midiVelocityToTrackerVolume(120, 1.5, floor);
  check(soft < hard, 'a soft touch is still quieter than a hard one above the floor');
  check(soft <= mid && mid <= hard, 'the mapping stays monotonic across the reduced range');
  const distinct = new Set(ALL_VELOCITIES.map(v => midiVelocityToTrackerVolume(v, 1.5, floor)));
  check(distinct.size > 1, 'a floor of 12 does not collapse every velocity onto one value');

  // The two checks that actually separate spreading from clamping. Clamping the
  // old curve at 12 also keeps the floor, stays monotonic and yields more than
  // one distinct value, so everything above passes for it too -- but it parks 96
  // of the 127 velocities on the floor and puts a medium touch right on it.
  check(mid > floor, 'a medium touch sits above the floor rather than on it');
  const onFloor = ALL_VELOCITIES.filter(v => midiVelocityToTrackerVolume(v, 1.5, floor) === floor).length;
  check(
    onFloor < ALL_VELOCITIES.length / 4,
    `the floor is not a dead zone: only ${onFloor}/127 velocities land on it`,
  );
}

// --- Monotonic for every sensitivity and floor -----------------------------
{
  let monotonic = true;
  for (const sensitivity of [0.5, 1, 1.5, 2, 3]) {
    for (const floor of [1, 4, 8, 12, 15]) {
      let previous = 0;
      for (const v of ALL_VELOCITIES) {
        const value = midiVelocityToTrackerVolume(v, sensitivity, floor);
        if (value < previous) monotonic = false;
        previous = value;
      }
    }
  }
  check(monotonic, 'volume never decreases as velocity rises, for any sensitivity/floor pair');
}

// --- Range is always legal --------------------------------------------------
{
  let inRange = true;
  for (const sensitivity of [0.5, 1.5, 3]) {
    for (const floor of [1, 12, 15, 0, 99]) {   // 0 and 99 are out-of-range inputs
      for (const v of [-5, 0, 1, 64, 127, 999]) {
        const value = midiVelocityToTrackerVolume(v, sensitivity, floor);
        if (!Number.isInteger(value) || value < 1 || value > 15) inRange = false;
      }
    }
  }
  check(inRange, 'the result is always an integer in 1..15, even for out-of-range inputs');
}

// --- No floor keeps the original mapping untouched -------------------------
{
  const original = (velocity, sensitivity) => {
    const normalized = Math.max(1, Math.min(127, velocity)) / 127;
    return Math.max(1, Math.min(15, Math.round(15 * Math.pow(normalized, 1 / sensitivity))));
  };
  let identical = true;
  for (const sensitivity of [0.5, 1, 1.5, 2, 3]) {
    for (const v of ALL_VELOCITIES) {
      if (midiVelocityToTrackerVolume(v, sensitivity, 1) !== original(v, sensitivity)) identical = false;
      if (midiVelocityToTrackerVolume(v, sensitivity) !== original(v, sensitivity)) identical = false;
    }
  }
  check(identical, 'with no floor (or floor 1) the mapping is exactly what it was before');
}

// --- A floor of 15 is a flat, fixed volume ---------------------------------
{
  const values = new Set(ALL_VELOCITIES.map(v => midiVelocityToTrackerVolume(v, 1.5, 15)));
  check(values.size === 1 && values.has(15), 'a floor of 15 pins every note to full volume');
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log('\nMIDI velocity mapping contract passed.');
