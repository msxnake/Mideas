// Generate push11.json with the Bat's "drop bomb when aligned with player X"
// flag enabled and assert the runtime gate + per-screen flag table are emitted.
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const generator = require(path.join(ROOT, 'test', 'ts_build_bat', 'utils', 'msxGenerator', 'index.js'));

const PROJECT = process.env.PUSH11 || 'C:/Users/salam/Downloads/push11.json';
const raw = JSON.parse(fs.readFileSync(PROJECT, 'utf8'));
const assets = Array.isArray(raw.assets) ? raw.assets : [];

// Enable the opt-in feature on the Bat (simulates the new UI checkbox flowing
// through buildMsx2EnemyEntityFromAsset -> msx2_ai.dropBombOnPlayerX).
let patched = 0;
for (const screen of assets.filter(a => a.type === 'msx2screen')) {
  for (const entity of (screen.data?.layers?.entities || [])) {
    if (entity.kind !== 'enemy' && entity.kind !== 'hazard') continue;
    entity.components = entity.components || {};
    entity.components.msx2_ai = { ...(entity.components.msx2_ai || {}), dropBombOnPlayerX: true };
    entity.params = { ...(entity.params || {}), enemyDropBombOnPlayerX: true };
    patched += 1;
  }
}
if (patched === 0) throw new Error('No enemy patched with dropBombOnPlayerX');

const files = generator.generateModularASM('push11_batbomb', assets, {
  generateUnified: true,
  romMode: 'megarom',
  targetFormat: 'konami',
  screenMode: raw.currentScreenMode || 'SCREEN 4 (Graphics II)',
  targetGraphicsBackend: 'msx2-screen4-pattern',
});
const asm = files['unitedFiles.asm'] || files['main.asm'] || '';
if (!asm) throw new Error('No unified ASM produced. files=' + Object.keys(files).join(','));

const outPath = path.join(ROOT, 'test', 'push11_batbomb.asm');
fs.writeFileSync(outPath, asm);

const required = [
  'msx2_screen_enemy_drop_bomb:',              // per-screen flag table
  'call update_msx2_enemy_bullet',             // pool now driven each frame
  'ld hl, msx2_screen_enemy_drop_bomb',        // runtime gate reads the flag
  '.enemy_bomb_aligned_pos_0',                 // X-alignment gate label (slot 0)
  'ld a, (msx2_player_sprite_x)',
];
const missing = required.filter(n => !asm.includes(n));
if (missing.length) throw new Error('Missing in ASM:\n  ' + missing.join('\n  '));

// The drop_bomb table must carry at least one active (#01) slot.
const tIdx = asm.indexOf('msx2_screen_enemy_drop_bomb:');
const tBlock = asm.slice(tIdx, asm.indexOf('\n', asm.indexOf('DB', tIdx)) + 1);
if (!/#01/.test(tBlock)) throw new Error('drop_bomb table has no active slot: ' + tBlock);

console.log(`push11 batbomb ASM OK: patched=${patched}, chars=${asm.length}`);
console.log('wrote ' + outPath);
