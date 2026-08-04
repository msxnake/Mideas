import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');
const physics = read('utils', 'msx2PlatformPhysics.ts');
const shoot = read('utils', 'msxGenerator', 'generators', 'msx2', 'msx2BitmapShootGenerator.ts');
const shaft = read('utils', 'msxGenerator', 'generators', 'msx2', 'msx2BitmapShaftGenerator.ts');
const screen5 = read('utils', 'msxGenerator', 'generators', 'msx2', 'msx2Screen5BitmapRoomGenerator.ts');
const smoke = read('scripts', 'build_msx2_screen5_bitmap_room_smoke.py');
const shootConfigStart = physics.indexOf('export function getMsx2ShootConfigFromPlayerEntity');
const shootConfigEnd = physics.indexOf('export function getMsx2SlashConfigFromPlayerEntity', shootConfigStart);
const shootConfigResolver = shootConfigStart >= 0 && shootConfigEnd > shootConfigStart
  ? physics.slice(shootConfigStart, shootConfigEnd)
  : '';

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
    return;
  }
  console.log(`OK: ${message}`);
}

assert(
  physics.includes('primaryKeyboard?: Msx2BitmapKeyboardBinding;')
    && physics.includes('secondaryKeyboard?: Msx2BitmapKeyboardBinding;'),
  'Shoot config carries its resolved SCREEN 5 keyboard bindings',
);
assert(
  shootConfigResolver.includes('primaryKeyboard: resolveMsx2BitmapKeyboardBinding(player, binding.primary)')
    && shootConfigResolver.includes('secondaryKeyboard: resolveMsx2BitmapKeyboardBinding(player, binding.secondary)'),
  'Shoot resolves primary and secondary controls from Player Config',
);
assert(
  shoot.includes('const primaryKey = config.primaryKeyboard')
    && shoot.includes('buildBitmapShootKeyCheck(primaryKey)')
    && !shoot.includes('SHOOT_KEY_ROW')
    && !shoot.includes('SHOOT_KEY_MASK'),
  'Shoot input routine uses the configured key instead of a hard-coded B key',
);

const expectedSatOrder = '${enemySystem.satCallAsm}${bossSystem.satCallAsm}${platformSystem.satCallAsm}'
  + '${carryAndThrowSystem.satCallAsm}${destroyTileSatCall}${turretSystem.satCallAsm}'
  + '${shaftSystem.satCallAsm}${shootBulletSatCall}';
assert(
  screen5.includes(expectedSatOrder),
  'SAT writers run in allocation order: platform, carry, debris, turret, shaft, Shoot',
);

const shaftSatStart = shaft.indexOf('bitmap_shaft_sat:');
const shaftSatEnd = shaft.indexOf('bitmap_shaft_upload_sprites:', shaftSatStart);
const shaftSat = shaftSatStart >= 0 && shaftSatEnd > shaftSatStart
  ? shaft.slice(shaftSatStart, shaftSatEnd)
  : '';
assert(
  shaftSat.includes('${satSlotBlocks}')
    && shaftSat.indexOf('ld a, #D8') > shaftSat.indexOf('${satSlotBlocks}')
    && shaftSat.indexOf('ld a, #D8') < shaftSat.lastIndexOf('pop de'),
  'Shaft terminates the SAT immediately after its fixed slots',
);
assert(
  smoke.includes('"attack": "n"')
    && smoke.includes('configured shoot input (N)')
    && smoke.includes('and #08'),
  'Compiled all-skills smoke verifies that Player attack=N reaches Shoot ASM',
);

if (process.exitCode) process.exit(process.exitCode);
console.log('All SCREEN 5 Shoot/SAT contract checks passed.');
