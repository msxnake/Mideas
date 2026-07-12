import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');
const handler = read('utils', 'msxGenerator', 'skills', 'handlers', 'index.ts');
const physics = read('utils', 'msx2PlatformPhysics.ts');
const generator = read('utils', 'msxGenerator', 'generators', 'msx2', 'msx2BitmapCarryAndThrowGenerator.ts');
const screen5 = read('utils', 'msxGenerator', 'generators', 'msx2', 'msx2Screen5BitmapRoomGenerator.ts');
const enemy = read('utils', 'msxGenerator', 'generators', 'msx2', 'msx2BitmapEnemyGenerator.ts');
const types = read('types.ts');
const hud = read('components', 'editors', 'Msx2HudEditor.tsx');

const checks = [
  ['carry_and_throw targets SCREEN 5', handler.includes("id: 'carry_and_throw'") && handler.includes("'msx2-screen4-bitmap-room'")],
  ['parabolic parameters are exposed', handler.includes("key: 'throwVertical'") && handler.includes("key: 'throwGravity'") && handler.includes("key: 'pickupRadius'")],
  ['physics resolver reads carry_and_throw', physics.includes('Msx2CarryAndThrowConfig') && physics.includes('getMsx2CarryAndThrowConfigFromPlayerEntity')],
  ['SCREEN 5 runtime has pickup and throw phases', generator.includes('bitmap_carry_pickup_probe') && generator.includes('bitmap_carry_step') && generator.includes('update_bitmap_carry_and_throw')],
  ['SCREEN 5 runtime emits a HUD held-state byte', generator.includes('bitmap_carry_held') && screen5.includes("element.binding === 'carriedObject'" )],
  ['thrown objects can kill and hide enemies', generator.includes('bitmap_carry_check_enemy_collision') && generator.includes('ld (iy+13), #FF') && enemy.includes('killed enemy stays in the pool but is invisible')],
  ['HUD editor exposes carriedObject binding', types.includes("| 'carriedObject'") && hud.includes("'carriedObject'")],
  ['SCREEN 5 wires carry runtime, SAT and room reload', screen5.includes('carryAndThrowSystem.updateCallAsm') && screen5.includes('carryAndThrowSystem.satCallAsm') && screen5.includes('carryAndThrowSystem.loadCallAsm')],
];

let failures = 0;
for (const [label, ok] of checks) {
  if (ok) console.log(`OK: ${label}`);
  else { console.error(`FAIL: ${label}`); failures += 1; }
}
if (failures) process.exit(1);
console.log(`All ${checks.length} SCREEN 5 carry-and-throw contract checks passed.`);
