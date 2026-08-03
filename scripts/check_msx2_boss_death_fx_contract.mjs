#!/usr/bin/env node
/**
 * Contract checks for the SCREEN 5 bitmap boss death presentation.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const read = (...parts) => readFileSync(join(root, ...parts), 'utf8');

const types = read('types.ts');
const editor = read('components', 'editors', 'Msx2BossEditor.tsx');
const catalog = read('components', 'msx2_screen4_editor', 'msx2EntityCatalog.ts');
const bossGen = read('utils', 'msxGenerator', 'generators', 'msx2', 'msx2BitmapBossGenerator.ts');
const roomGen = read('utils', 'msxGenerator', 'generators', 'msx2', 'msx2Screen5BitmapRoomGenerator.ts');

const checks = [
  ['Definition stores stamp list and timing controls',
    types.includes('bossDeathExplosionStampIds?: string[]') &&
    types.includes('bossDeathExplosionCount?: number') &&
    types.includes('bossDeathExplosionInterval?: number') &&
    types.includes('bossDeathExplosionHoldFrames?: number')],
  ['New bosses and placed encounters receive safe defaults',
    catalog.includes('bossDeathExplosionStampIds: []') &&
    catalog.includes('bossDeathExplosionCount: 8') &&
    catalog.includes('bossDeathExplosionInterval: 6') &&
    catalog.includes('bossDeathExplosionHoldFrames: 12')],
  ['Boss editor exposes the Death FX section and multiple bitmap-stamp picker',
    editor.includes("'Death FX'") &&
    editor.includes('Boss Death — Bitmap Explosions') &&
    editor.includes('selectedIds.includes(stamp.id)')],
  ['UI documents transparent colour and delayed defeat actions',
    editor.includes('Colour 0 is') &&
    editor.includes('Defeat actions') &&
    editor.includes('barrier removal run only after')],
  ['Body and explosion stamps are injected into the shared atlas',
    roomGen.includes('function collectBossBitmapStamps') &&
    roomGen.includes('params.bossDeathExplosionStampIds') &&
    roomGen.includes('const bossBitmapStamps = collectBossBitmapStamps')],
  ['Generator emits a compact per-room death-FX table',
    bossGen.includes('deathFxTables: number[][]') &&
    bossGen.includes('function buildDeathFxTable') &&
    bossGen.includes('bitmap_boss_death_fx_ptr_table')],
  ['Death state freezes normal boss logic and rejects further bullet hits',
    bossGen.includes('boss_active     EQU ${asmWord(ram + 0)}   ; 0 none, 1 alive, 2 death FX') &&
    /cp 2\s+[\s\S]{0,60}?jp z, bitmap_boss_death_update/.test(bossGen) &&
    /bitmap_boss_bullet_hit:[\s\S]{0,80}?cp 1[\s\S]{0,80}?ret nz/.test(bossGen)],
  ['Explosion drawing uses LMMM/TIMP so colour 0 remains transparent',
    bossGen.includes('bitmap_boss_death_draw:') &&
    bossGen.includes('ld a, #98') &&
    bossGen.includes('LMMM + TIMP')],
  ['Progress actions and room unlock happen only at finalization',
    bossGen.includes('bitmap_boss_finalize_death:') &&
    bossGen.indexOf('bitmap_boss_finalize_death:') <
      bossGen.indexOf('call bitmap_boss_run_defeat_actions')],
  ['Sprite and bitmap boss projectiles are retired before death FX',
    bossGen.includes('call bitmap_boss_sbul_sat') &&
    bossGen.includes('.kill_bitmap_projectile_done') &&
    bossGen.includes('call bitmap_boss_proj_restore')],
  ['Death-FX RAM is opt-in and chained after intro RAM',
    bossGen.includes('const hasDeathFx =') &&
    bossGen.includes('const deathRamBase = introRamBase +') &&
    bossGen.includes('(hasDeathFx ? DEATH_RAM_BYTES : 0)')],
];

let failed = false;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'OK' : 'FAIL'}: ${label}`);
  if (!ok) failed = true;
}
if (failed) process.exit(1);
console.log('MSX2 boss bitmap death-FX checks passed.');
