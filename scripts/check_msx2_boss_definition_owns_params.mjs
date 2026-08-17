#!/usr/bin/env node
/**
 * A boss definition OWNS the boss; the encounter only places it.
 *
 * Placing a boss from the library used to copy every definition field into the
 * placed entity's params, and `resolveBossParams` let any non-empty encounter
 * value win. That snapshot then outranked the definition forever: raising "Hit
 * points" in the Boss Editor changed nothing in a room that already had the
 * boss on it, and the ROM kept the HP the boss had the day it was dropped on
 * the map. Real case: a boss showing 2 HP in the editor shipped with 8.
 *
 * The generator is transpiled and invoked here, not restated: break the
 * BOSS_DEFINITION_OWNED_PARAMS filter in resolveBossParams and these go red.
 */
import { readFileSync, mkdtempSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { build } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

const out = join(mkdtempSync(join(tmpdir(), 'mideas-boss-owns-')), 'bossgen.mjs');
await build({
  entryPoints: [join(repoRoot, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2BitmapBossGenerator.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: out,
  logLevel: 'silent',
});
const { resolveBossParams } = await import(pathToFileURL(out).href);

// autocrlf=true checks the sources out with CRLF; normalise before matching.
const readSrc = (...parts) => readFileSync(join(repoRoot, ...parts), 'utf8').replace(/\r\n/g, '\n');
const catalog = readSrc('components', 'msx2_screen4_editor', 'msx2EntityCatalog.ts');

// ---- fixture ---------------------------------------------------------------
// The definition as it stands TODAY, and an encounter still carrying the stale
// snapshot taken when the boss was placed (higher HP, faster, older body).
const DEF_ID = 'msx2boss_fixture';
const definition = {
  id: DEF_ID,
  name: 'Tuneladora',
  params: {
    bossHp: 2,
    bossSpeed: 1,
    bossStampAssetId: 'stamp_new',
    bossProjectileSpeed: 4,
    bossProjectilePattern: 'fallingRocks',
    damageZones: [{ id: 'z', type: 'weak_point', x: 0, y: 0, w: 8, h: 8, damageMultiplier: 1 }],
  },
};
const definitions = new Map([[DEF_ID, definition]]);

const encounterWithStaleSnapshot = {
  params: {
    bossId: DEF_ID,
    runtime: 'MSX2',
    engine: 'bitmapBoss',
    bossHp: 8,                    // stale: the definition said 8 back then
    bossSpeed: 2,
    bossStampAssetId: 'stamp_old',
    bossProjectileSpeed: 3,
    damageZones: [],
  },
};

const checks = [];
const check = (label, ok) => checks.push([label, ok]);

// ---- the bug this file exists for -----------------------------------------
const resolved = resolveBossParams(encounterWithStaleSnapshot, definitions);
check('Stale snapshot HP loses to the definition', resolved.bossHp === 2);
check('Stale snapshot speed loses to the definition', resolved.bossSpeed === 1);
check('Stale snapshot body loses to the definition', resolved.bossStampAssetId === 'stamp_new');
check('Stale snapshot projectile speed loses to the definition', resolved.bossProjectileSpeed === 4);
check('Definition-only fields still arrive', resolved.bossProjectilePattern === 'fallingRocks');
check('Damage zones come from the definition', Array.isArray(resolved.damageZones) && resolved.damageZones.length === 1);

// ---- per-encounter overrides that MUST keep working ------------------------
const withOverride = resolveBossParams(
  { params: { bossId: DEF_ID, bossHp: 8, hpOverride: 40 } },
  definitions,
);
check('hpOverride still makes one copy of a boss tougher', withOverride.bossHp === 40);

const withReward = resolveBossParams(
  { params: { bossId: DEF_ID, onDefeated: [{ action: 'openDoor' }] } },
  definitions,
);
check('onDefeated stays a per-encounter reward',
  Array.isArray(withReward.onDefeated) && withReward.onDefeated.length === 1);

// ---- inline authoring (no definition) is untouched -------------------------
const inline = resolveBossParams({ params: { bossHp: 12, bossSpeed: 2 } }, definitions);
check('A boss with no bossId keeps its own inline params',
  inline.bossHp === 12 && inline.bossSpeed === 2);

const dangling = resolveBossParams({ params: { bossId: 'does_not_exist', bossHp: 12 } }, definitions);
check('A dangling bossId falls back to the entity instead of blanking the boss',
  dangling.bossHp === 12);

// ---- the other half: placement must stop writing the snapshot --------------
const placement = catalog.slice(catalog.indexOf('export function buildMsx2BossEntityFromAsset'));
const placementParams = placement.slice(placement.indexOf('params: {'), placement.indexOf('bossId: asset.id'));
check('Placing a boss no longer snapshots its HP', !placementParams.includes('bossHp:'));
check('Placing a boss no longer snapshots speed or body',
  !placementParams.includes('bossSpeed:') && !placementParams.includes('bossStampAssetId:'));
check('Placing a boss no longer snapshots damage zones or phases',
  !placementParams.includes('damageZones:') && !placementParams.includes('bossPhases:'));
check('Placed boss still references the definition', placement.includes('bossId: asset.id'));

// ---- report ----------------------------------------------------------------
let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'OK  ' : 'FAIL'}: ${label}`);
  if (!ok) failed += 1;
}
if (failed > 0) {
  console.error(`\n${failed} boss definition-ownership check(s) failed.`);
  process.exit(1);
}
console.log('\nMSX2 boss definition-ownership checks passed.');
