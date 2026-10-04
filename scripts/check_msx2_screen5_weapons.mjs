#!/usr/bin/env node
/**
 * Contract for SCREEN 5 bitmap-room PLAYER WEAPONS (melee swing, inventory,
 * weapon pickups, equippedWeapon HUD icon).
 *
 * Functional part: bundles utils/msx2PlayerWeapons.ts + msx2BitmapWeaponGenerator.ts
 * with esbuild and checks the resolved config and the emitted ASM.
 * Wiring part: text checks on the room generator (SAT order, shoot gate,
 * pickup class, HUD binding) so a refactor cannot silently drop them.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
    return;
  }
  console.log(`OK: ${message}`);
}

// ---------------------------------------------------------------- functional
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'msx2_weapons_'));
const entry = path.join(outDir, 'entry.ts');
fs.writeFileSync(entry, `
export { getMsx2WeaponRuntimeConfig } from ${JSON.stringify(path.join(root, 'utils', 'msx2PlayerWeapons.ts'))};
export { buildBitmapWeaponSystem, BITMAP_WEAPON_RAM_BYTES } from ${JSON.stringify(path.join(root, 'utils', 'msxGenerator', 'generators', 'msx2', 'msx2BitmapWeaponGenerator.ts'))};
`);
const bundle = path.join(outDir, 'bundle.mjs');
const esbuild = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'esbuild.cmd' : 'esbuild');
execFileSync(esbuild, [entry, '--bundle', '--format=esm', '--platform=node', `--outfile=${bundle}`, '--log-level=error'], { cwd: root, shell: process.platform === 'win32' });
const mod = await import(pathToFileURL(bundle).href);

const player = {
  inputMapping: { attack: 'n', jump: 'spc' },
  equippedWeaponId: 'knife',
  weaponSwitchKey: 'm',
  weapons: [
    { id: 'sling', name: 'Sling', type: 'projectile', availability: 'owned', button: 'b', damage: 1, cooldownFrames: 10, activeFrames: { start: 0, end: 1 }, hitboxSource: 'none' },
    { id: 'knife', name: 'Knife', type: 'melee', availability: 'owned', button: 'b', damage: 1, cooldownFrames: 12, activeFrames: { start: 0, end: 1 }, hitboxSource: 'attackByFacing',
      attackVisual: { frames: [0, 1, 2, 3, 4, 5], frameDelay: 3, offsetByFacing: { right: { x: 12, y: 8 }, left: { x: -12, y: 8 } }, hitboxByFacing: {}, affectsEnemies: true, affectsWalls: false, breaksDestructibleTiles: false } },
    { id: 'mace', name: 'Mace', type: 'melee', availability: 'pickup', button: 'b', damage: 1, cooldownFrames: 20, activeFrames: { start: 0, end: 1 }, hitboxSource: 'attackByFacing' },
  ],
};
const config = mod.getMsx2WeaponRuntimeConfig(player);
assert(config.enabled, 'a melee weapon enables the weapon runtime');
assert(config.initialOwnedMask === 0b011, 'owned-at-start weapons form the boot inventory mask');
assert(config.initialEquippedIndex === 1, 'equippedWeaponId selects the boot weapon');
assert(config.weapons[1].frames.length === 4, 'swing frames are clamped to 4');
assert(config.weapons[2].frames.length === 2, 'a melee weapon without frames gets a 2-frame swing');
assert(config.switchKey && config.switchKey.row === 4 && config.switchKey.mask === 0x04, 'switch key M = keyboard row 4, mask #04');
assert(config.attackKey && config.attackKey.row === 4 && config.attackKey.mask === 0x08, 'attack key follows the player B binding (N)');
assert(!mod.getMsx2WeaponRuntimeConfig({ weapons: [player.weapons[0]] }).enabled, 'projectile-only players emit no weapon runtime (byte-identical ROMs)');

const layer = (dx, dy) => ({ pattern: Array(32).fill(0xAA), colors: Array(16).fill(15), dx, dy });
const graphics = config.weapons.map(weapon => ({
  frames: weapon.isMelee ? weapon.frames.map(() => ({ left: [layer(-12, 8)], right: [layer(12, 8)] })) : [],
}));
const opts = {
  slotCount: 1, satAddress: 0xF64C, colorAddress: 0xF530, patternGroupBase: 49, patternBase: 0xF800,
  gameYOffset: 20, playAreaHeight: 192, writesTerminator: false, hitTargetLabel: 'bitmap_bullet_targets', megaRom: true,
};
const system = mod.buildBitmapWeaponSystem(config, graphics, 0xD38D, opts);
const asm = system.routinesAsm;
assert(system.ramBytes === mod.BITMAP_WEAPON_RAM_BYTES, 'RAM block size is the documented constant');
assert(system.equates.includes('bitmap_weapon_owned        EQU #D38D'), 'RAM block starts at the chain base');
assert(asm.includes('bitmap_weapon_grant:') && asm.includes('bitmap_weapon_cycle:'), 'inventory routines: grant (pickup) and cycle (switch key)');
assert(asm.includes('call bitmap_bullet_targets'), 'the hit frame reuses the player-bullet target routine');
assert(asm.includes('ld de, #F64C'), 'SAT writer targets the allocated weapon slots');
assert(!/ld a, #D8/.test(asm.split('bitmap_weapon_sat:')[1].split('bitmap_weapon_upload:')[0]), 'no terminator when the player bullets follow');
assert(asm.includes('ld a, bitmap_weapon_gfx_DATA_BANK') && system.bankedBlocks.length === 1, 'MegaROM: swing graphics live in a data bank');
assert(asm.includes('ld a, (bitmap_composition_state)'), 'upload waits for room composition to finish');
const lockReleases = (asm.match(/ld \(bitmap_weapon_lock\), a/g) || []).length;
assert(lockReleases >= 2, 'attack lock has both arm and release paths (requireKeyRelease)');
assert(!asm.includes('`'), 'no backticks leak into generated ASM');
const plain = mod.buildBitmapWeaponSystem(config, graphics, 0xD38D, { ...opts, megaRom: false, writesTerminator: true });
assert(plain.dataAsm.includes('bitmap_weapon_gfx:') && plain.bankedBlocks.length === 0, 'plain ROM: swing graphics are resident');
assert(/ld a, #D8/.test(plain.routinesAsm.split('bitmap_weapon_sat:')[1].split('bitmap_weapon_upload:')[0]), 'last SAT writer appends the #D8 terminator');
const disabled = mod.buildBitmapWeaponSystem(mod.getMsx2WeaponRuntimeConfig({}), [], 0xD38D, opts);
assert(!disabled.enabled && disabled.routinesAsm === '' && disabled.ramBytes === 0, 'no weapons: nothing emitted');

// ---------------------------------------------------------------- wiring
const room = read('utils', 'msxGenerator', 'generators', 'msx2', 'msx2Screen5BitmapRoomGenerator.ts');
const shoot = read('utils', 'msxGenerator', 'generators', 'msx2', 'msx2BitmapShootGenerator.ts');
const enemy = read('utils', 'msxGenerator', 'generators', 'msx2', 'msx2BitmapEnemyGenerator.ts');
assert(room.includes('${enemySystem.bulletSatCallAsm}${weaponSystem.satCallAsm}${shootBulletSatCall}'), 'weapon SAT writer runs right before the player bullets');
assert(room.includes('${dashGate}${weaponSystem.updateCallAsm}${shootGate}'), 'weapon logic runs before the shoot gate');
assert(room.includes("blockedByLabel: weaponConfig.enabled ? 'bitmap_weapon_blocks_shoot' : undefined"), 'a melee weapon blocks the shot');
assert(shoot.includes('${lockGate}${weaponGate}${ammoGate}'), 'shoot honours the weapon gate');
assert(room.includes("atlasParamKey: 'weaponAtlasEntryId', pickupClass: BITMAP_PICKUP_CLASS_WEAPON"), 'weapon pickups ride the gem/nut pickup engine');
assert(room.includes('call bitmap_weapon_grant'), 'a weapon pickup grants + equips the weapon');
assert(room.includes("element.binding === 'equippedWeapon' && weaponHudIndexLabel"), 'equippedWeapon HUD binding reads the weapon HUD index');
assert(room.includes('This widget\'s tile rides in another widget\'s VRAM band'), 'band-sharing HUD widgets never fall through into their update at boot (R#15)');
assert(enemy.includes('satPadSlots'), 'enemy SAT writer parks the reserved boss-bullet slots before terminating');

if (process.exitCode) process.exit(process.exitCode);
