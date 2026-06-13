// Phase 1 smoke: a playable hardware-sprite player inside a SCREEN 4 bitmap
// room. Patches the bitmap-room fixture with a solid border + interior wall and
// a player spawn, generates the ROM ASM, and asserts the new movement/collision
// runtime is emitted. Then the caller compiles it with glass.jar.
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const generator = require(path.join(ROOT, 'test', 'ts_build_bmp', 'utils', 'msxGenerator', 'index.js'));

const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'test', 'msx2-screen4', 'out', 'msx2_bitmap_room_smoke.json'), 'utf8'));
const assets = raw.assets;
const roomAsset = assets.find(a => a.type === 'msx2bitmaproom');
if (!roomAsset) throw new Error('no msx2bitmaproom asset in fixture');
const room = roomAsset.data;

// 16x12 collision grid (16x16 px cells): solid border ring + one interior wall.
const COLS = 16, ROWS = 12;
const collision = Array.from({ length: ROWS }, (_r, y) =>
  Array.from({ length: COLS }, (_c, x) => (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1) ? 1 : 0)
);
for (let y = 3; y <= 8; y++) collision[y][8] = 1; // vertical interior wall at col 8
room.collision = collision;
room.playerEntries = [{ id: 'spawn0', x: 3, y: 5, facing: 'right' }]; // open cell left of the wall

const files = generator.generateModularASM('bitmap_room_player', assets, {
  generateUnified: true,
  romMode: 'simple32k',
  targetFormat: 'konami',
  screenMode: raw.currentScreenMode || 'SCREEN 4 (Graphics II)',
  targetGraphicsBackend: 'msx2-screen4-bitmap-room',
});
const asm = files['unitedFiles.asm'] || files['main.asm'] || '';
if (!asm) throw new Error('no unified ASM. files=' + Object.keys(files).join(','));

const outPath = path.join(ROOT, 'test', 'bitmap_room_player.asm');
fs.writeFileSync(outPath, asm);

const required = [
  'player_y   EQU #C000',
  'update_player_movement:',
  'call update_player_movement',
  'bitmap_try_move_x:',
  'bitmap_try_move_y:',
  'bitmap_probe_solid:',
  'bitmap_update_sprite_sat:',
  'call bitmap_update_sprite_sat',
  'bitmap_room_collision_map:',
  'bitmap_stick_dx:',
  'ld (player_x), a',
];
const missing = required.filter(n => !asm.includes(n));
if (missing.length) throw new Error('Missing in ASM:\n  ' + missing.join('\n  '));

// Collision table must carry the border (#01) we authored.
const cIdx = asm.indexOf('bitmap_room_collision_map:');
const cBlock = asm.slice(cIdx, asm.indexOf('\n', asm.indexOf('DB', cIdx)) + 1);
if (!/#01/.test(cBlock)) throw new Error('collision table missing solid cells: ' + cBlock);

// Spawn must be tile (3,5) -> pixels (48, 80).
if (!asm.includes('ld a, 80\n    ld (player_y)') || !asm.includes('ld a, 48\n    ld (player_x)')) {
  throw new Error('player spawn pixels (48,80) not emitted');
}

console.log(`bitmap_room_player ASM OK: chars=${asm.length}`);
console.log('wrote ' + outPath);
