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
const smoke = read('scripts', 'build_msx2_screen5_bitmap_room_smoke.py');
const types = read('types.ts');
const hud = read('components', 'editors', 'Msx2HudEditor.tsx');
const afterEnascr = screen5.slice(screen5.indexOf('call ENASCR'), screen5.indexOf('call ENASCR') + 700);

const checks = [
  ['carry_and_throw targets SCREEN 5', handler.includes("id: 'carry_and_throw'") && handler.includes("'msx2-screen4-bitmap-room'")],
  ['parabolic parameters are exposed', handler.includes("key: 'throwVertical'") && handler.includes("key: 'throwGravity'") && handler.includes("key: 'pickupRadius'")],
  ['physics resolver reads carry_and_throw', physics.includes('Msx2CarryAndThrowConfig') && physics.includes('getMsx2CarryAndThrowConfigFromPlayerEntity')],
  ['SCREEN 5 runtime has pickup and throw phases', generator.includes('bitmap_carry_pickup_probe') && generator.includes('bitmap_carry_step') && generator.includes('update_bitmap_carry_and_throw')],
  ['SCREEN 5 runtime emits a HUD held-state byte', generator.includes('bitmap_carry_held') && screen5.includes("element.binding === 'carriedObject'" )],
  ['thrown objects can kill and hide enemies', generator.includes('bitmap_carry_check_enemy_collision') && generator.includes('ld (iy+13), #FF') && enemy.includes('killed enemy stays in the pool but is invisible')],
  ['throw keeps the carried launch origin', generator.includes('jp z, .carry_follow_player') && generator.includes('.carry_throw:') && generator.includes('ld (hl), 3')],
  ['SCREEN 5 explicitly restores display state', screen5.includes('call DISSCR') && screen5.includes('call ENASCR') && screen5.includes('DISSCR  EQU #0041')],
  ['SCREEN 5 reasserts DI after BIOS CHGMOD', screen5.includes('call CHGMOD\n    ; CHGMOD is a BIOS routine') && screen5.includes('Reassert the init_rom DI contract immediately.\n    di')],
  ['SCREEN 5 reasserts DI after BIOS ENASCR', screen5.includes('call ENASCR\n    ; ENASCR is another BIOS boundary') && screen5.includes('polling-only interrupt contract.\n    di')],
  ['SCREEN 5 restores 16x16 sprites after BIOS ENASCR', afterEnascr.includes('ld a, #01\n    ld e, #62\n    call vdp_write_register')],
  ['carryables support multicolour bitmap patches', generator.includes('bitmap_draw_carry_objects') && generator.includes('bitmap_carry_cmd_buffer') && generator.includes('0x98') && screen5.includes('carryAndThrowSystem.bitmapDrawCallAsm')],
  ['smoke project exercises bitmap carryables', smoke.includes('carryableRenderMode') && smoke.includes('carryableBitmapAtlasEntryId') && smoke.includes('carryable_multicolor')],
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
