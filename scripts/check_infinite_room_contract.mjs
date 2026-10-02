// Contract check for the SCREEN 5 "Infinite Room" feature.
//
// It GENERATES the ROM source from the tracked smoke fixture and checks behaviour of the
// generator, not just that strings exist:
//   - ON: the rail hook sits inside start_room_transition BEFORE `cp #FF`, the commit path
//     skips the carry reload on a self-wrap, the load hook runs after the carry load on both
//     the boot and commit paths, the update runs in the main loop, the boot pre-clear runs
//     before the start room is loaded, the zone table encodes the authored rectangle.
//   - Variations: target slot mask, initial loop level, no carry skill, two zones.
//   - OFF (no infiniteRoom on any room): not one trace of the feature, and the original
//     transition / carry-load text is intact (opt-in, zero cost).
//   - The new RAM does not overlap any other EQU and the new code/tables assemble with glass.
//
// Fixture: test/msx2-infinite-room/infinite_fixture.json
//   (made by: python scripts/build_msx2_screen5_bitmap_room_smoke.py --include-infinite-room ...)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import * as esbuild from 'esbuild';

const root = process.cwd();
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');

async function loadGenerator() {
  const bundle = await esbuild.build({
    entryPoints: [path.join(root, 'utils/msxGenerator/index.ts')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    write: false,
    external: ['react', 'react-dom', '@xyflow/react', 'jszip', 'axios', 'lucide-react', 'twgl.js'],
  });
  const encoded = Buffer.from(bundle.outputFiles[0].text).toString('base64');
  return import(`data:text/javascript;base64,${encoded}`);
}

const fixture = JSON.parse(read('test/msx2-infinite-room/infinite_fixture.json'));

function generate(mutate) {
  const raw = structuredClone(fixture);
  mutate?.(raw.assets);
  const warnings = [];
  const realLog = console.log;
  const realWarn = console.warn;
  console.log = () => {};
  console.warn = (...args) => { warnings.push(args.join(' ')); };
  try {
    const files = generator.generateModularASM(raw.name, raw.assets, {
      generateUnified: true,
      romMode: 'simple32k',
      targetFormat: 'konami',
      screenMode: raw.screenMode,
      targetGraphicsBackend: raw.targetGraphicsBackend,
    });
    return { asm: (files['unitedFiles.asm'] || files['main.asm']).replace(/\r\n/g, '\n'), warnings };
  } finally {
    console.log = realLog;
    console.warn = realWarn;
  }
}

const roomOf = assets => assets.find(asset => asset.id === 'bitmap_room_smoke').data;
const playerOf = assets => assets.find(asset => asset.type === 'msx2player').data;
const zoneOf = assets => roomOf(assets).entities.find(entity => entity.id === 'zone');

const bytesOf = (asm, label) => {
  const match = asm.match(new RegExp(`^${label}:\\n((?:\\s+DB [^\\n]+\\n)+)`, 'm'));
  if (!match) return null;
  return [...match[1].matchAll(/#([0-9A-F]{2})/g)].map(item => parseInt(item[1], 16));
};
const equ = (asm, name) => {
  const match = asm.match(new RegExp(`^${name}\\s+EQU\\s+#([0-9A-F]+)`, 'm'));
  return match ? parseInt(match[1], 16) : null;
};
const between = (asm, from, to) => {
  const start = asm.indexOf(from);
  if (start < 0) return '';
  const end = asm.indexOf(to, start);
  return end < 0 ? '' : asm.slice(start, end);
};

const generator = await loadGenerator();

// Rail hook with and without the shaft system (module-level: a full shaft project is not needed).
async function loadInfiniteModule() {
  const bundle = await esbuild.build({
    entryPoints: [path.join(root, 'utils/msxGenerator/generators/msx2/msx2BitmapInfiniteRoomGenerator.ts')],
    bundle: true, platform: 'node', format: 'esm', write: false,
  });
  return import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
}
const infiniteModule = await loadInfiniteModule();
const hookFor = shaftOverride => {
  const data = { entries: [{ roomIndex: 0, initialLoopActive: true, zone: null }], zoneLogic: false };
  return infiniteModule.buildBitmapInfiniteRoomSystemAsm(2, data, { ramBase: 0xD000, carrySlots: 0, bankedRle: false, shaftOverride }).railHookAsm;
};
const hookWithShaft = hookFor(true);
const hookWithoutShaft = hookFor(false);
const on = generate();
const asm = on.asm;
const off = generate(assets => { delete roomOf(assets).infiniteRoom; });

const transition = between(asm, 'start_room_transition:\n', '.no_rail:');
const commitCarry = between(asm, 'ld a, (bitmap_inf_self_wrap)   ; Infinite Room self-wrap', 'call bitmap_inf_load_room');
const zoneRec = bytesOf(asm, 'bitmap_inf_zone_table') || [];
const roomTable = bytesOf(asm, 'bitmap_inf_room_table') || [];

// RAM: no other symbol may sit inside the bytes the feature owns.
const infActive = equ(asm, 'bitmap_inf_active');
const infSave = equ(asm, 'bitmap_inf_save');
const infZone = equ(asm, 'bitmap_inf_zone');
const anchors = roomTable.filter(value => value !== 0xff).length;
const ownedStart = infActive;
const ownedEnd = infSave + anchors * 5 - 1;
const foreign = [...asm.matchAll(/^([A-Za-z_][A-Za-z0-9_]*)\s+EQU\s+#([0-9A-F]+)/gm)]
  .filter(item => !item[1].startsWith('bitmap_inf_'))
  .filter(item => { const addr = parseInt(item[2], 16); return addr >= ownedStart && addr <= ownedEnd; })
  .map(item => item[1]);

function assembleOk(source) {
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mideas_inf_'));
  try {
    const asmPath = path.join(workDir, 'inf.asm');
    fs.writeFileSync(asmPath, source);
    execFileSync('java', ['-jar', path.join(root, 'server', 'glass.jar'), '-I', path.join(root, 'server'), asmPath, path.join(workDir, 'inf.rom')], { cwd: root, stdio: 'pipe' });
    return true;
  } catch (error) {
    console.error(String(error.stderr || error.stdout || error.message).slice(0, 600));
    return false;
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

// --- variations ---
const targetRock = generate(assets => { zoneOf(assets).params.triggerZone.targetEntityId = 'carry_rock'; });
const targetAny = generate(assets => { zoneOf(assets).params.triggerZone.targetEntityId = ''; });
const initialOff = generate(assets => { roomOf(assets).infiniteRoom.initialLoopActive = false; });
const noCarry = generate(assets => { playerOf(assets).activeSkills = playerOf(assets).activeSkills.filter(id => id !== 'carry_and_throw'); });
const twoZones = generate(assets => {
  const second = structuredClone(zoneOf(assets));
  second.id = 'zone2';
  second.position = { x: 1, y: 1 };
  roomOf(assets).entities.push(second);
});
const noZone = generate(assets => { roomOf(assets).entities = roomOf(assets).entities.filter(entity => entity.id !== 'zone'); });
const zoneRecOf = result => bytesOf(result.asm, 'bitmap_inf_zone_table') || [];

const checks = [
  ['rail hook is inside start_room_transition, before cp #FF',
    transition.includes('ld a, (bitmap_inf_active)') && transition.indexOf('ld a, (current_screen_index)\n.inf_keep_rail:') > transition.indexOf('ld a, (bitmap_inf_active)')
    && transition.indexOf('.inf_keep_rail:\n    cp #FF') > 0],
  ['hook latches the self-wrap and keeps the direction register C',
    transition.includes('ld (bitmap_inf_self_wrap), a') && !/\n\s+ld c,/.test(between(transition, 'Infinite Room: while', '.inf_keep_rail:'))],
  ['shaft wins: with a shaft system the hook yields while bitmap_shaft_forced_room != #FF, BEFORE latching the self-wrap',
    hookWithShaft.includes('ld a, (bitmap_shaft_forced_room)') && hookWithShaft.indexOf('jp nz, .inf_keep_rail') > 0
    && hookWithShaft.indexOf('jp nz, .inf_keep_rail') < hookWithShaft.indexOf('ld (bitmap_inf_self_wrap), a')],
  ['no shaft system: the hook does not mention the shaft at all (unchanged ROMs)', !hookWithoutShaft.includes('shaft')],
  ['the generator splices the hook BEFORE the shaft override (which consumes the request)',
    read('utils/msxGenerator/generators/msx2/msx2Screen5BitmapRoomGenerator.ts').includes("${options.infiniteRailHookAsm || ''}${shaftTransitionOverrideAsm}    cp #FF")],
  ['commit path skips the carry reload on a self-wrap', /or a\n\s+call z, bitmap_load_carry_objects\n\s+call bitmap_inf_load_room/.test(commitCarry + 'call bitmap_inf_load_room')],
  ['boot path runs the infinite load right after the carry load',
    /call bitmap_load_carry_objects\n\s+call bitmap_inf_load_room\n\s+; Place the player at the room spawn point/.test(asm)],
  ['per-frame zone update is in the main loop after the carry update',
    /call update_bitmap_carry_and_throw\n\s+call bitmap_inf_update/.test(asm)],
  ['boot clears the save records BEFORE the start room is loaded',
    asm.indexOf('Infinite Room: clear the self-wrap latch') > 0
    && asm.indexOf('Infinite Room: clear the self-wrap latch') < asm.indexOf('Render the start room from the shared tileset')],
  ['room table: room 0 is anchor 0, room 1 is not infinite (#FF)', roomTable[0] === 0 && roomTable[1] === 0xff],
  ['zone record encodes the authored rectangle (x 160..208, y 160..192) for slot 0, has-zone + initial-on',
    JSON.stringify(zoneRec.slice(0, 6)) === JSON.stringify([160, 160, 208, 192, 1, 3])],
  ['target "carry_rock" resolves to slot mask 2', zoneRecOf(targetRock)[4] === 2],
  ['no target means any carryable (mask 3)', zoneRecOf(targetAny)[4] === 3],
  ['initialLoopActive=false clears the initial bit (flags 2)', zoneRecOf(initialOff)[5] === 2],
  ['without carry_and_throw the zone is dropped (constant loop) and a warning is printed',
    zoneRecOf(noCarry)[5] === 1 && !noCarry.asm.includes('bitmap_inf_update:') && noCarry.warnings.some(text => text.includes('carry_and_throw'))],
  ['a room with no zone still loops with a constant level and no zone logic',
    zoneRecOf(noZone)[5] === 1 && !noZone.asm.includes('bitmap_inf_update:') && noZone.asm.includes('bitmap_inf_load_room:')],
  ['two zones: the first is used and a warning is printed', JSON.stringify(zoneRecOf(twoZones).slice(0, 4)) === JSON.stringify([160, 160, 208, 192]) && twoZones.warnings.some(text => text.includes('only the first'))],
  ['the two sfx are distinct fire-and-forget tables (R4 #0F vs #C0) and never reference gem code',
    asm.includes('bitmap_sfx_loop_off_data:\n    db 7,#3B,4,#0F') && asm.includes('bitmap_sfx_loop_on_data:\n    db 7,#3B,4,#C0')
    && !between(asm, 'bitmap_sfx_loop_off:', 'bitmap_inf_load_room:').includes('bitmap_sfx_gem')],
  ['every new routine has a FUNCTION header with DESTROYS and PRESERVES',
    ['bitmap_inf_load_room', 'bitmap_inf_eval', 'bitmap_inf_restore_carry', 'bitmap_inf_update', 'bitmap_sfx_loop_off', 'bitmap_sfx_loop_on']
      .every(name => { const header = between(asm, `; FUNCTION: ${name}\n`, `\n${name}:`); return header.includes('DESTROYS') && header.includes('PRESERVES'); })],
  ['no ld a,i / ld a,r in the new code', !/ld a, [ir]\b/.test(between(asm, 'bitmap_sfx_loop_off:', 'bitmap_inf_zone_table:'))],
  ['new RAM is inside the chain window and overlaps no other symbol', infActive >= 0xD000 && ownedEnd < 0xF000 && foreign.length === 0 && infZone === infActive + 4],
  ['OFF: the feature leaves no trace in the ASM', !/bitmap_inf_|bitmap_sfx_loop|Infinite Room/.test(off.asm)],
  ['OFF: start_room_transition and carry load keep their original text',
    off.asm.includes('    ld a, (hl)\n    cp #FF\n    jp z, .no_rail') && /\n    call bitmap_load_carry_objects\n/.test(off.asm) && !off.asm.includes('call z, bitmap_load_carry_objects')],
  ['ON generation assembles with glass', assembleOk(asm)],
  ['entity catalog + bitmapPlatform profile expose the trigger zone',
    read('components/msx2_screen4_editor/msx2EntityCatalog.ts').includes("id: 'trigger_zone'")
    && read('components/msx2_screen4_editor/msx2EntityCatalog.ts').includes("id: 'msx2_trigger_zone'")
    && ['trigger_zone', 'triggerZone', 'msx2_trigger_zone'].every(id => between(read('utils/msx2ProjectProfiles.ts'), '  bitmapPlatform: {', '  shooterHorizontal: {').includes(`'${id}'`))],
  ['room type + editor expose the infinite room flag',
    read('types.ts').includes('infiniteRoom?:') && read('components/editors/Msx2BitmapScreenEditor.tsx').includes('Bucle activo al entrar')
    && read('components/editors/Msx2BitmapScreenEditor.tsx').includes("ctx.fillText('Z'")],
];

let failures = 0;
for (const [label, ok] of checks) {
  if (ok) console.log(`OK: ${label}`);
  else { console.error(`FAIL: ${label}`); failures += 1; }
}
if (failures) process.exit(1);
console.log(`All ${checks.length} infinite-room contract checks passed.`);
