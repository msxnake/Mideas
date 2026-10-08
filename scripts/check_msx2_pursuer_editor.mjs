#!/usr/bin/env node
/**
 * Contract of the pursuer EDITOR helpers (utils/msx2PursuerEditor.ts), no browser and no emulator needed:
 *   a. applyAlertZonePatch keeps every other key of the room runtime, and fills the defaults when there is no alert zone yet;
 *   b. it normalizes like the model: delay 0 -> 0.5, 99 -> 30, guard 999 -> 255, guard -5 -> 0, and 2.5 s stays 2.5 s;
 *   c. turning the alert zone or the soldier off writes enabled:false and keeps the rest of the object;
 *   d. neither helper mutates its arguments (the inputs are deep-frozen and compared before and after).
 *
 *   node scripts/check_msx2_pursuer_editor.mjs [--root <dir with utils/msx2PursuerEditor.ts and utils/msx2Pursuer.ts>]
 *
 * The TypeScript is compiled with the repo's own tsc into a temp dir (removed before every exit) and required, the same way
 * scripts/check_msx2_pursuer_contract.mjs does it. --root lets the sabotage runs point at a copy in Temp.
 * Prints one "OK  : ..." or "FAIL: ..." line per check. Exit code 1 when any check fails.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const val = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const SRC = path.resolve(val('--root') || ROOT);

const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mideas_pursuer_editor_'));
// outDir is always created by mkdtemp in this script, so only it is removed, before every process.exit.
const cleanup = () => fs.rmSync(outDir, { recursive: true, force: true });
try {
  execFileSync(process.execPath, [
    path.join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc'),
    '--pretty', 'false', '--module', 'commonjs', '--target', 'ES2020', '--moduleResolution', 'node', '--skipLibCheck',
    '--rootDir', SRC, '--outDir', outDir, path.join(SRC, 'utils', 'msx2PursuerEditor.ts'),
  ], { cwd: ROOT, stdio: 'pipe', maxBuffer: 1 << 26 });
} catch (error) {
  console.log(`FAIL: tsc could not compile utils/msx2PursuerEditor.ts\n${error.stdout || error.message}`);
  cleanup();
  process.exit(1);
}
fs.writeFileSync(path.join(outDir, 'package.json'), '{"type":"commonjs"}');
const req = createRequire(import.meta.url);
let editor;
try {
  editor = req(path.join(outDir, 'utils', 'msx2PursuerEditor.js'));
} catch (error) {
  console.log(`FAIL: the compiled helpers could not be loaded\n${error.stack || error.message}`);
  cleanup();
  process.exit(1);
}

let passed = 0;
let total = 0;
const check = (name, fn) => {
  total++;
  let ok = false;
  let detail = '';
  try {
    const result = fn();
    ok = result === true;
    if (!ok) detail = typeof result === 'string' ? result : 'condition is false';
  } catch (error) {
    detail = `threw ${error && error.message ? error.message : error}`;
  }
  if (ok) passed++;
  console.log(`${ok ? 'OK  ' : 'FAIL'}: ${name}${ok ? '' : `  (${detail})`}`);
};

const deepFreeze = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---- a. other runtime keys survive --------------------------------------------------------------------------------------------
check('a. applyAlertZonePatch keeps every other runtime key', () => {
  const runtime = {
    screenKind: 'playable',
    lighting: 'lamp',
    hudAssetId: 'hud_1',
    hudWidgets: [{ id: 'score' }],
    shooter: { speed: 3 },
    alertZone: { enabled: false, spawnDelaySec: 2, guardPx: 16 },
  };
  const out = editor.applyAlertZonePatch(runtime, { enabled: true });
  const keys = Object.keys(out).sort().join(',');
  if (keys !== 'alertZone,hudAssetId,hudWidgets,lighting,screenKind,shooter') return `keys were ${keys}`;
  if (out.screenKind !== 'playable' || out.lighting !== 'lamp' || out.hudAssetId !== 'hud_1') return 'a scalar key changed';
  if (!same(out.hudWidgets, runtime.hudWidgets) || !same(out.shooter, runtime.shooter)) return 'an object key changed';
  if (out.alertZone.enabled !== true || out.alertZone.spawnDelaySec !== 2 || out.alertZone.guardPx !== 16) return `alertZone ${JSON.stringify(out.alertZone)}`;
  return true;
});
check('a. a runtime without alertZone gets the defaults (disabled, 4 s, 32 px), other keys kept', () => {
  const out = editor.applyAlertZonePatch({ lighting: 'off' }, {});
  return out.lighting === 'off' && out.alertZone.enabled === false && out.alertZone.spawnDelaySec === 4 && out.alertZone.guardPx === 32
    ? true : JSON.stringify(out);
});
check('a. null and undefined runtime count as an empty object', () => {
  const fromNull = editor.applyAlertZonePatch(null, { enabled: true });
  const fromUndefined = editor.applyAlertZonePatch(undefined, { enabled: true });
  return fromNull.alertZone.enabled === true && fromUndefined.alertZone.enabled === true && Object.keys(fromNull).join() === 'alertZone'
    ? true : JSON.stringify([fromNull, fromUndefined]);
});

// ---- b. normalization ---------------------------------------------------------------------------------------------------------
check('b. spawnDelaySec 0 becomes 0.5', () => editor.applyAlertZonePatch({}, { spawnDelaySec: 0 }).alertZone.spawnDelaySec === 0.5);
check('b. spawnDelaySec 99 becomes 30', () => editor.applyAlertZonePatch({}, { spawnDelaySec: 99 }).alertZone.spawnDelaySec === 30);
check('b. guardPx 999 becomes 255', () => editor.applyAlertZonePatch({}, { guardPx: 999 }).alertZone.guardPx === 255);
check('b. guardPx -5 becomes 0', () => editor.applyAlertZonePatch({}, { guardPx: -5 }).alertZone.guardPx === 0);
check('b. spawnDelaySec 2.5 is kept (the field steps by 0.5)', () => editor.applyAlertZonePatch({}, { spawnDelaySec: 2.5 }).alertZone.spawnDelaySec === 2.5);
check('b. a patch with undefined values keeps the current ones', () => {
  const out = editor.applyAlertZonePatch({ alertZone: { enabled: true, spawnDelaySec: 6, guardPx: 40 } }, { enabled: undefined, guardPx: 10 });
  return out.alertZone.enabled === true && out.alertZone.spawnDelaySec === 6 && out.alertZone.guardPx === 10 ? true : JSON.stringify(out.alertZone);
});

// ---- c. turning things off ----------------------------------------------------------------------------------------------------
check('c. turning the alert zone off writes enabled:false and keeps delay and guard', () => {
  const out = editor.applyAlertZonePatch({ alertZone: { enabled: true, spawnDelaySec: 6, guardPx: 40 } }, { enabled: false });
  return out.alertZone.enabled === false && out.alertZone.spawnDelaySec === 6 && out.alertZone.guardPx === 40
    ? true : JSON.stringify(out.alertZone);
});
check('c. turning the soldier off writes pursuer.enabled:false and keeps the other pursuer keys', () => {
  const out = editor.applyPursuerPatch({ name: 'Boina Verde', render: { spriteId: 'sp' }, pursuer: { enabled: true, speed: 2 } }, { enabled: false });
  return out.pursuer.enabled === false && out.pursuer.speed === 2 && out.name === 'Boina Verde' && same(out.render, { spriteId: 'sp' })
    ? true : JSON.stringify(out);
});
check('c. turning the soldier on creates the pursuer object on enemy data without one', () => {
  const out = editor.applyPursuerPatch({ name: 'Bat' }, { enabled: true });
  return out.pursuer.enabled === true && out.name === 'Bat' ? true : JSON.stringify(out);
});
check('c. applyPursuerPatch on undefined data returns a pursuer object', () => {
  const out = editor.applyPursuerPatch(undefined, { enabled: true });
  return same(out, { pursuer: { enabled: true } }) ? true : JSON.stringify(out);
});

// ---- d. no mutation -----------------------------------------------------------------------------------------------------------
check('d. applyAlertZonePatch does not mutate its runtime or patch (deep-frozen inputs)', () => {
  const runtime = deepFreeze({ lighting: 'lamp', alertZone: { enabled: false, spawnDelaySec: 2, guardPx: 16 } });
  const patch = deepFreeze({ enabled: true, spawnDelaySec: 99 });
  const before = JSON.stringify([runtime, patch]);
  const out = editor.applyAlertZonePatch(runtime, patch);
  return JSON.stringify([runtime, patch]) === before && out !== runtime && out.alertZone !== runtime.alertZone
    ? true : 'an argument changed or the result aliases the input';
});
check('d. applyPursuerPatch does not mutate its enemy data (deep-frozen input)', () => {
  const data = deepFreeze({ name: 'Boina', pursuer: { enabled: true, speed: 2 } });
  const before = JSON.stringify(data);
  const out = editor.applyPursuerPatch(data, { enabled: false });
  return JSON.stringify(data) === before && out !== data && out.pursuer !== data.pursuer && data.pursuer.enabled === true
    ? true : 'the input enemy data changed';
});

console.log(`${passed}/${total} checks OK`);
cleanup();
process.exit(passed === total ? 0 : 1);
