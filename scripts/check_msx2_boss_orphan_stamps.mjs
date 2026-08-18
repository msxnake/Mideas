#!/usr/bin/env node
/**
 * Which boss bodies reach the shared atlas, run against the REAL collector.
 *
 * The shared atlas is resident VRAM: whatever lands in it is paid for as long
 * as the ROM runs. `collectBossBitmapStamps` used to sweep every `msx2boss`
 * asset in the project, so a definition left over in the library — the normal
 * state of a project once the global entity library is in use — kept its body
 * and death frames in VRAM even though no room ever drew them.
 *
 * The sweep also hid a second problem. The body and the death frames are
 * definition-owned (BOSS_DEFINITION_OWNED_PARAMS), so at runtime a placed boss
 * draws the DEFINITION's stamp and ignores the stale copy the encounter took
 * the day it was placed. Reading the encounter's copy here put the wrong
 * picture in the atlas; the sweep papered over it by uploading both.
 *
 * These checks import the real function and drive it with the real fixture, so
 * they fail if either behaviour regresses.
 */
import { readFileSync, mkdtempSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { build } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const FIXTURE = join(repoRoot, 'test', 'msx2-boss', 'fixture_stampbody.json');

/** The body `bossdef_demon` points at, and a stamp no boss in the fixture uses. */
const DEFINITION_BODY = 'tileset_sabana1_1782578940127';
const UNUSED_STAMP = 'spikes2_1783800231556';
const STALE_STAMP = 'plantitas1_1782492824273';

const out = join(mkdtempSync(join(tmpdir(), 'mideas-boss-stamps-')), 'room.mjs');
await build({
  entryPoints: [join(repoRoot, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2Screen5BitmapRoomGenerator.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: out,
  logLevel: 'silent',
});
const { collectBossBitmapStamps } = await import(pathToFileURL(out).href);

const baseAssets = JSON.parse(readFileSync(FIXTURE, 'utf8')).assets;
const clone = () => JSON.parse(JSON.stringify(baseAssets));
// Since FASE 3 a body stamp enters the atlas as its 16x16 cells, keyed
// `<stampId>#c<n>`, while death frames stay whole. Both are folded back to the
// stamp id here: what these checks are about is WHICH stamps reach VRAM at all.
const collect = assets => collectBossBitmapStamps({ assets }).items
  .map(entry => String(entry.id).split('#c')[0]);

/** The single placed boss in the fixture, wherever the room keeps its entities. */
const findPlacedBoss = assets => {
  for (const asset of assets) {
    for (const list of [asset?.data?.entities, asset?.data?.layers?.entities]) {
      for (const entity of list || []) {
        if (entity?.kind === 'boss') return { asset, entity };
      }
    }
  }
  throw new Error('fixture no longer has a placed boss; the checks below prove nothing');
};

const bossDefinition = assets =>
  assets.find(asset => String(asset?.type || '').toLowerCase() === 'msx2boss');

// --- The fixture has to be meaningful, or every check below passes vacuously.
const sanity = collect(clone());
if (!sanity.includes(DEFINITION_BODY)) {
  throw new Error(`fixture does not yield the definition body ${DEFINITION_BODY}; got ${JSON.stringify(sanity)}`);
}

const checks = [];

// 1. The placed boss still gets its picture. This is what the fix must not break.
checks.push(['A placed boss keeps the body its definition names', sanity.includes(DEFINITION_BODY)]);

// 2. THE LEAK: a definition nobody placed must not reach the atlas.
{
  const assets = clone();
  const orphan = JSON.parse(JSON.stringify(bossDefinition(assets)));
  orphan.id = 'bossdef_orphan_never_placed';
  orphan.name = 'Orphan left in the library';
  const params = orphan.data?.params || orphan.data?.boss?.params || orphan.data;
  params.bossStampAssetId = UNUSED_STAMP;
  assets.push(orphan);
  const ids = collect(assets);
  checks.push(['An unplaced definition costs no atlas space', !ids.includes(UNUSED_STAMP)]);
  checks.push(['Adding an unplaced definition changes nothing else',
    JSON.stringify(ids) === JSON.stringify(sanity)]);
}

// 3. A stale encounter snapshot must lose to the definition, exactly as at runtime.
{
  const assets = clone();
  findPlacedBoss(assets).entity.params.bossStampAssetId = STALE_STAMP;
  const ids = collect(assets);
  checks.push(['A stale encounter body is not uploaded', !ids.includes(STALE_STAMP)]);
  checks.push(['The definition body is uploaded instead', ids.includes(DEFINITION_BODY)]);
}

// 4. Entities under `data.layers.entities` must be seen even when `data.entities`
//    exists and is empty — an empty array is truthy, so `a || b` would skip them.
{
  const assets = clone();
  const { asset, entity } = findPlacedBoss(assets);
  asset.data.entities = [];
  asset.data.layers = asset.data.layers || {};
  asset.data.layers.entities = [entity];
  checks.push(['A boss under data.layers.entities is found', collect(assets).includes(DEFINITION_BODY)]);
}

// 5. Death frames follow the same rule: definition-owned, placed-only.
{
  const assets = clone();
  const params = bossDefinition(assets).data.params;
  params.bossDeathExplosionStampIds = [UNUSED_STAMP];
  checks.push(['A placed boss uploads its definition death frames',
    collect(assets).includes(UNUSED_STAMP)]);

  const orphaned = clone();
  const orphan = JSON.parse(JSON.stringify(bossDefinition(orphaned)));
  orphan.id = 'bossdef_orphan_with_death_fx';
  (orphan.data?.params || orphan.data).bossDeathExplosionStampIds = [UNUSED_STAMP];
  orphaned.push(orphan);
  checks.push(['An unplaced definition uploads no death frames either',
    !collect(orphaned).includes(UNUSED_STAMP)]);
}

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'OK  ' : 'FAIL'}: ${label}`);
  if (!ok) failed += 1;
}
console.log('');
if (failed) {
  console.error(`MSX2 boss atlas-collection checks FAILED (${failed}/${checks.length}).`);
  process.exit(1);
}
console.log(`MSX2 boss atlas-collection checks passed (${checks.length}).`);
