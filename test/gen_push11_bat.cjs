// Generate the push11.json ROM ASM (SCREEN 4, Bat = flyerSine) using the
// freshly rebuilt generator and assert the FlyerSine handler now probes the
// foreground collision map and reverses direction.
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const generator = require(path.join(ROOT, 'test', 'ts_build_bat', 'utils', 'msxGenerator', 'index.js'));

const PROJECT = process.env.PUSH11 || 'C:/Users/salam/Downloads/push11.json';
const raw = JSON.parse(fs.readFileSync(PROJECT, 'utf8'));
const assets = Array.isArray(raw.assets) ? raw.assets : [];

const files = generator.generateModularASM('push11_bat', assets, {
  generateUnified: true,
  romMode: 'megarom',
  targetFormat: 'konami',
  screenMode: raw.currentScreenMode || 'SCREEN 4 (Graphics II)',
  targetGraphicsBackend: 'msx2-screen4-pattern',
});

const asm = files['unitedFiles.asm'] || files['main.asm'] || '';
if (!asm) throw new Error('No unified ASM produced. files=' + Object.keys(files).join(','));

const outPath = path.join(ROOT, 'test', 'push11_bat.asm');
fs.writeFileSync(outPath, asm);

// --- assertions -----------------------------------------------------------
const required = [
  'msx2_enemy_flyer_sine_shared:',
  'jp msx2_enemy_flyer_sine_shared',
  '.flyer_sine_shared_wall_turn:',
  '.flyer_sine_shared_floor_turn:',
  'foreground wall probe at (candidateX+15',   // right branch
  'foreground floor probe at (x+8, candidateY+15', // down branch
  'foreground ceiling probe at (x+8, candidateY)', // up branch
];
const missing = required.filter(n => !asm.includes(n));
if (missing.length) throw new Error('Missing in ASM:\n  ' + missing.join('\n  '));

// The flyer handler must actually CALL the collision probe (the fix).
const h0 = asm.indexOf('msx2_enemy_flyer_sine_shared:');
const h1 = asm.indexOf('msx2_enemy_jumper_shared:', h0);
if (h0 < 0 || h1 < 0) throw new Error('flyer handler bounds not found');
const body = asm.slice(h0, h1);
const probeCalls = (body.match(/call msx2_collision_at_pixel/g) || []).length;
if (probeCalls < 4) throw new Error(`expected >=4 collision probes in flyer handler, got ${probeCalls}`);

// PUSH/POP balance inside the flyer handler.
const pushes = (body.match(/\bpush (bc|af)\b/g) || []).length;
const pops = (body.match(/\bpop (bc|af)\b/g) || []).length;
if (pushes !== pops) throw new Error(`PUSH/POP imbalance in flyer handler: ${pushes} push vs ${pops} pop`);

// The bat enemy slot must carry mode byte 5 (FLYER_SINE) somewhere.
if (!/#05/.test(asm.slice(asm.indexOf('msx2_screen_enemy_mode'), asm.indexOf('msx2_screen_enemy_mode') + 400))) {
  console.warn('WARN: mode #05 not found near msx2_screen_enemy_mode table (check screen index)');
}

console.log(`push11 bat ASM OK: probes=${probeCalls}, push=pop=${pushes}, chars=${asm.length}`);
console.log('wrote ' + outPath);
