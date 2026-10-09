// Builds directed cartridges from the real SCREEN 5 loader/SAT/colour routines.
// node scripts/check_msx2_sprite_pattern_compaction.mjs [--project path/to/project.json]
// Optional real soldier artwork; default is a reproducible multicolour 16x32 walk.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'mideas_pattern_compaction_'));
const bundle = path.join(output, 'helpers.mjs');
await build({ stdin: { resolveDir: root, loader: 'ts', contents: `
export { buildBitmapEnemySystemAsm } from './utils/msxGenerator/generators/msx2/msx2BitmapEnemyGenerator';
export { compactBitmapEnemyPatterns } from './utils/msxGenerator/generators/msx2/msx2BitmapEnemyPatternCompaction';
export { compactMsx2SpritePatterns } from './utils/msxGenerator/generators/msx2/msx2SpritePatternCompaction';
export { buildHardwareSpriteLayersForFrame } from './utils/msxGenerator/generators/msx2/msx2Screen4Generator';
export { generateModularASM } from './utils/msxGenerator';
export { DEFAULT_SCREEN5_CUSTOM_PALETTE } from './constants';
` }, bundle: true, platform: 'node', format: 'esm', outfile: bundle, logLevel: 'silent' });
const impl = await import(pathToFileURL(bundle).href);
const palette = impl.DEFAULT_SCREEN5_CUSTOM_PALETTE;
const frame = Array.from({ length: 32 }, () => Array(16).fill(palette[0].hex));
for (let y = 1; y < 31; y++) for (let x = 2; x < 14; x++) frame[y][x] = palette[[1,4,5][x % 3]].hex;
const frame2 = structuredClone(frame);
for (let y = 24; y < 30; y++) frame2[y][2] = palette[0].hex;
let sprite = { id: 'compact_walk', name: 'Repeated head', target: 'MSX2', vdpMode: 'SCREEN5',
  size: { width: 16, height: 32 }, palette, backgroundColor: palette[0].hex,
  frames: [{ id: 'one', data: frame }, { id: 'two', data: frame2 }], currentFrameIndex: 0,
  facingDirection: 'right', hardware: { color: 4, useOrColor: true }, animationSpeedMs: 160 };
const projectArg = process.argv.indexOf('--project');
if (projectArg >= 0) {
  const project = JSON.parse(fs.readFileSync(process.argv[projectArg + 1], 'utf8'));
  sprite = project.assets.find(a => a.id === 'msx2sprite_soldado_boina_verde_w1_20261008')?.data;
  assert(sprite, 'real green beret walking sprite exists');
}
const layers = [0,1].map(index => impl.buildHardwareSpriteLayersForFrame(sprite, 4, index));
assert.equal(layers[0].length, 4, 'four actual colour planes in the 16x32 fixture');
assert.deepEqual(layers[0].filter(l => l.yOffset === 0), layers[1].filter(l => l.yOffset === 0), 'head is unchanged');
const raw = layers.flatMap(f => f.flatMap(l => l.pattern));
const compactRaw = impl.compactMsx2SpritePatterns(raw);
assert(compactRaw.patterns.length < raw.length);
assert.throws(() => impl.compactMsx2SpritePatterns([0]), /complete/);
const almost = [...layers[0][0].pattern]; almost[31] ^= 1;
assert.equal(impl.compactMsx2SpritePatterns([...layers[0][0].pattern, ...almost]).groups[1], 1, 'one changed bit must remain a different pattern');
assert.equal(impl.compactMsx2SpritePatterns([...layers[0][0].pattern, ...layers[0][0].pattern]).groups[1], 0);
const repeatedRecord = new Array(22).fill(0);
repeatedRecord[10] = 2; repeatedRecord[11] = 8;
const emptyFirst = impl.compactBitmapEnemyPatterns({ maxSlots:1, maxFrames:2, slimeEnabled:false, gearEnabled:false,
  patternBytes:new Array(128).fill(0xAA), colorBytes:new Array(32).fill(4),
  roomTables:[[0,...new Array(22).fill(0)],[1,...repeatedRecord]], patternGroupCount:4 });
assert(emptyFirst.compactPatterns);
assert.equal(emptyFirst.compactPatterns.packs[emptyFirst.compactPatterns.roomPacks[0]].patternGroups,0);
assert.equal(emptyFirst.compactPatterns.packs[emptyFirst.compactPatterns.roomPacks[1]].patternGroups,1,
  'an empty all-zero map cannot suppress the upload of a later all-identical sprite');

// Obtain the real VDP copier and MegaROM wrappers from a complete generator run.
const fixture = JSON.parse(fs.readFileSync(path.join(root, 'test/msx2-screen5-fg/fg_fastcopy_fixture.json'), 'utf8'));
let full;
const logs = { log: console.log, warn: console.warn };
try {
  console.log = console.warn = () => {};
  const files = impl.generateModularASM('pattern_compaction_helpers', fixture.assets, { generateUnified: true, romMode: 'megarom', targetFormat: 'konami', screenMode: fixture.screenMode });
  full = files['unitedFiles.asm'] || files['unifiedFiles.asm'];
} finally { Object.assign(console, logs); }
function routine(text, label) {
  const start = text.indexOf(`\n${label}:`);
  assert(start >= 0, `routine ${label} exists`);
  const tail = text.slice(start + 1);
  const end = tail.slice(label.length + 1).search(/^\w[^\s:]*:/m);
  return end < 0 ? tail : tail.slice(0, label.length + 1 + end);
}
const helpers = ['copy_to_vram_ext', 'vdp_write_register'].map(l => routine(full,l)).join('\n');
const bankHelpers = ['bitmap_copy_banked_to_ram','bitmap_copy_banked_to_vram','bitmap_room_select_data_bank_a',
  'bitmap_room_restore_resident_banks','mapper_set_bank_p2','mapper_set_bank_p3',
  'map_page2_to_cart_primary','get_cart_slot_value'].map(l => routine(full,l)).join('\n');
// Exercise the integration: allocations and bank packing must use the reduced
// count, not just the standalone runtime builder tested below.
const game = structuredClone(fixture);
game.assets.push({ id:sprite.id, name:sprite.name, type:'msx2sprite', data:sprite });
for(const asset of game.assets.filter(a => a.type === 'msx2bitmaproom')) {
  for(const entity of asset.data.entities.filter(e => e.kind === 'enemy')) {
    entity.components.msx2_hardware_sprite.msx2SpriteAssetId = sprite.id;
  }
}
try {
  console.log = console.warn = () => {};
  const files = impl.generateModularASM('pattern_compaction_game', game.assets, { generateUnified:true,
    romMode:'megarom', targetFormat:'konami', screenMode:game.screenMode });
  const asm = files['unitedFiles.asm'] || files['unifiedFiles.asm'];
  const allocation = asm.match(/Shared enemy planes: VRAM (\d+) -> (\d+) groups/);
  assert(allocation && Number(allocation[1]) === 16 && Number(allocation[2]) < 16,
    'the complete exporter reserves fewer enemy VRAM groups');
  assert.match(asm, /bitmap_enemy_pattern_map EQU/);
  fs.writeFileSync(path.join(output,'game.asm'),asm);
  execFileSync('java',['-jar',path.join(root,'server/glass.jar'),path.join(output,'game.asm'),
    path.join(output,'game.rom'),path.join(output,'game.sym')],{stdio:'pipe'});
} finally { Object.assign(console,logs); }
const reverse = byte => parseInt(byte.toString(2).padStart(8,'0').split('').reverse().join(''),2);
const mirror = pattern => [...pattern.slice(16).map(reverse), ...pattern.slice(0,16).map(reverse)];
const flip = pattern => [...pattern.slice(0,16).reverse(), ...pattern.slice(16).reverse()];
const hex = n => `#${n.toString(16).toUpperCase()}`;
const db = bytes => Array.from({length: Math.ceil(bytes.length/16)},(_,i) => `    DB ${bytes.slice(i*16,i*16+16).map(hex).join(',')}`).join('\n');
const manifest = [];
for (const slime of [false, true]) {
  const variantCount = slime ? 4 : 2;
  const patternBytes = [], colorBytes = [];
  const records = layers[0].map((layer,slot) => {
    const record = new Array(slime ? 23 : 22).fill(0);
    Object.assign(record, { 0: 96+layer.xOffset, 1: 64+layer.yOffset, 2: 1, 8: patternBytes.length/32,
      9: colorBytes.length/16, 10: 2, 11: 8, 12: slime && slot < 2 ? 11 : 0, 20:1, 21:1 });
    const frames = layers.map(f => f[slot]);
    frames.forEach(f => { patternBytes.push(...f.pattern, ...mirror(f.pattern)); if(slime) patternBytes.push(...flip(f.pattern), ...mirror(flip(f.pattern))); });
    colorBytes.push(...frames.flatMap(f => f.colors));
    if(slime) colorBytes.push(...frames.flatMap(f => [...f.colors].reverse()));
    return record;
  });
  const roomA = [4, ...records.flat()];
  const roomC = [2, ...(slime ? [records[1], records[0]] : records.slice(2)).flat(), ...new Array(records[0].length*2).fill(0)];
  const variantCounts = slime ? [4,4,2,2] : [2,2,2,2];
  let allocated = 0;
  const offsets = variantCounts.map(v => { const result = allocated; allocated += 2*v; return result; });
  const data = { maxSlots:4, maxFrames:2, slimeEnabled:slime, gearEnabled:false, patternBytes, colorBytes,
    patternGroupCount:allocated, patternGroupOffsets:offsets, patternVariantCounts:variantCounts,
    roomTables:[roomA,[0,...new Array(records[0].length*4).fill(0)],roomC,roomA] };
  const compact = impl.compactBitmapEnemyPatterns(data);
  assert(compact.compactPatterns, 'repeated planes select the optimized runtime');
  assert.equal(compact.compactPatterns.roomPacks[0], compact.compactPatterns.roomPacks[3], 'identical room packs share ROM');
  assert.equal(compact.colorBytes, data.colorBytes, 'pattern compaction never changes colour storage');
  assert.deepEqual(compact.roomTables, data.roomTables, 'geometry and hardware-slot counts remain identical');
  assert.equal(impl.compactBitmapEnemyPatterns(compact), compact, 'idempotent');
  const distinct = { ...data, roomTables:[roomA], patternBytes:patternBytes.map((_,i) => (Math.floor(i/32)+i%32) & 255) };
  assert.equal(impl.compactBitmapEnemyPatterns(distinct), distinct, 'no VRAM saving preserves legacy path');
  // Every active frame/facing map must reconstruct the original bits exactly.
  for (const [room, table] of data.roomTables.entries()) {
    const pack = compact.compactPatterns.packs[compact.compactPatterns.roomPacks[room]];
    for(let slot=0;slot<table[0];slot++) for(let f=0;f<2;f++) for(let v=0;v<variantCounts[slot];v++) {
      const sourceGroup = table[1+slot*records[0].length+8]+f*variantCount+v;
      const group = pack.bytes[compact.compactPatterns.slotMapOffsets[slot]+f*variantCounts[slot]+v];
      assert.deepEqual(pack.bytes.slice(compact.compactPatterns.mapBytes+group*32,compact.compactPatterns.mapBytes+(group+1)*32), patternBytes.slice(sourceGroup*32,(sourceGroup+1)*32));
    }
  }
  for(const banked of [false,true]) for(const optimized of [false,true]) {
    const current = optimized ? compact : data;
    const opts = { ramBase:0xD000, satBase:0xF600, colorBase:0xF400, patternGroupBase:8,
      gameYOffset:20, playerHitbox:{x:0,y:0,w:16,h:16}, damageInvulnFrames:60,
      bankedSpriteData:banked, patternGroupOffsets:offsets, patternVariantCounts:variantCounts };
    const generated = impl.buildBitmapEnemySystemAsm(current,opts);
    const selectedLabels = ['bitmap_load_enemies', optimized ? 'bitmap_load_enemy_patterns' : 'bitmap_enemy_patterns_offset',
      'bitmap_enemy_colors_offset','bitmap_update_enemy_sat','bitmap_update_enemy_colors'];
    const selected = selectedLabels.map(l => routine('\n'+generated.routinesAsm,l)).join('\n');
    let code = '', room = 0;
    const cases = [];
    const write = (label,value) => `    LD A, ${value}\n    LD (${label}), A\n`;
    function step(name, loadRoom, f=0, facing=0, phase=0, killed=false) {
      if(loadRoom !== undefined) {
        room = loadRoom;
        code += write('current_screen_index',room)+'    CALL bitmap_load_enemies\n';
      }
      const table = data.roomTables[room], sat = [], patterns = [], colors = [];
      const pack = current.compactPatterns?.packs[current.compactPatterns.roomPacks[room]];
      for(let slot=0;slot<4;slot++) {
        const rec = table.slice(1+slot*records[0].length,1+(slot+1)*records[0].length);
        code += write(`bitmap_enemy_pool+${slot*(slime?27:24)+9}`,f)+write(`bitmap_enemy_pool+${slot*(slime?27:24)+2}`,facing ? 255 : 1);
        if(slime) code += write(`bitmap_enemy_pool+${slot*27+26}`,phase);
        if(killed && slot === 0) code += write('bitmap_enemy_pool+13',255);
        const hidden = slot >= table[0] || (killed && slot === 0);
        const ceiling = slime && variantCounts[slot] === 4 && [1,2].includes(phase);
        const variant = facing + (ceiling ? 2 : 0);
        const virtual = f*variantCounts[slot]+variant;
        const group = pack ? pack.bytes[current.compactPatterns.slotMapOffsets[slot]+virtual] : offsets[slot]+virtual;
        sat.push(...(hidden ? [212,0,0,0] : [rec[1]+20,rec[0],(8+group)*4,0]));
        if(slot<table[0]) {
          const source = (rec[8]+f*variantCount+variant)*32;
          if(!hidden) patterns.push({address:0xF800+(8+group)*32,bytes:patternBytes.slice(source,source+32)});
          const color = (rec[9]+f+(ceiling?2:0))*16;
          colors.push({address:0xF400+slot*16,bytes:colorBytes.slice(color,color+16)});
        }
      }
      sat.push(216,0,0,0);
      code += '    LD BC,#1234\n    LD HL,#5678\n    CALL bitmap_update_enemy_colors\n    CALL wait_vblank\n    CALL bitmap_update_enemy_sat\n';
      cases.push({name,sat,patterns,colors,count:table[0]});
      code += `    LD A,${cases.length-1}\n    CALL checkpoint\n`;
    }
    step('initial walk frame',0); step('walk frame 1',undefined,1); step('walk mirrored',undefined,1,1);
    if(slime) { step('ceiling right',undefined,0,0,1);step('ceiling left animated',undefined,1,1,2);step('falling unflipped',undefined,1,0,3); }
    step('empty room',1); step('reuse slots with different art',2,1,1); step('return soldier',0,1);
    step('dead enemy hidden',undefined,1,1,0,true);step('identical room pack',3,0,1);
    const name = `${slime?'mixed-ceiling':'walk'}-${banked?'banked':'resident'}-${optimized?'compact':'legacy'}`;
    const base = path.join(output,name);
    const globals = 'current_screen_index EQU #C100\nVDP_CTRL_PORT EQU #99\nVDP_DATA_PORT EQU #98\n';
    const init = `    ORG #4000\n    DB #41,#42\n    DW init,0,0,0,0,0,0\ninit:\n    DI\n    LD SP,#F000\n    LD A,5\n    CALL #005F\n    DI\n${banked ? '    CALL map_page2_to_cart_primary\n    DI\n' : ''}    LD IX,#1357\n    LD IY,#2468\n${code}finished:\n    JP finished\ncheckpoint:\n    RET\n`;
    // Publish SAT at the start of VBlank, as the game does. Colour uploads above
    // deliberately happen first so the test does not rely on their duration.
    const waitVblank = `wait_vblank:\n    LD E,2\n    LD A,15\n    CALL vdp_write_register\n.active:\n    IN A,(#99)\n    AND #40\n    JP NZ,.active\n.blank:\n    IN A,(#99)\n    AND #40\n    JP Z,.blank\n    LD E,0\n    LD A,15\n    CALL vdp_write_register\n    RET\n`;
    let asm = init+globals+generated.equates+helpers+waitVblank;
    if(banked) {
      asm += 'RSLREG EQU #0138\nENASLT EQU #0024\n'+bankHelpers+'\n    DS #6000-$,#FF\n    ORG #6000\n'+generated.dataAsm+'\n    DS #8000-$,#FF\n    ORG #8000\n'+selected+'\n    DS #A000-$,#FF\n    ORG #A000\n    DS #C000-$,#FF\n';
      for(const [index,block] of generated.bankedBlocks.entries()) asm += `${block.label}_DATA_BANK EQU ${index+4}\n    ORG #8000\n${block.label}:\n${db(block.bytes)}\n    DS #A000-$,#FF\n`;
    } else asm += selected+generated.dataAsm+'\n    DS #C000-$,#FF\n';
    fs.writeFileSync(base+'.asm',asm);
    execFileSync('java',['-jar',path.join(root,'server/glass.jar'),base+'.asm',base+'.rom',base+'.sym'],{stdio:'pipe'});
    if(banked) {
      const rom = fs.readFileSync(base+'.rom');
      const padded = Buffer.alloc(2 ** Math.ceil(Math.log2(rom.length)), 0xff);
      rom.copy(padded); fs.writeFileSync(base+'.rom',padded);
    }
    const symbols = fs.readFileSync(base+'.sym','utf8');
    const address = label => parseInt(symbols.match(new RegExp(`^${label}: equ ([0-9A-F]+)H`,'m'))?.[1] || assert.fail(label),16);
    let tcl = `set f [open "${base.replaceAll('\\','/')}.log" w]\nset throttle off\nset failures 0\nset hits 0\nproc check {yes msg} {if {!$yes} {incr ::failures; puts $::f "FAIL $msg"}}\n`;
    tcl += `proc verify {} {\nset id [reg A]\nincr ::hits\ncheck [expr {[reg BC]==4660 && [reg HL]==22136 && [reg IX]==4951 && [reg IY]==9320}] "registers $id"\ncheck [expr {[debug read {VDP regs} 14]==0}] "R14 $id"\nswitch -- $id {\n`;
    cases.forEach((c,i)=>{
      tcl += `${i} {puts $::f "CASE ${i}: ${c.name}"\ncheck [expr {[debug read memory ${address('bitmap_enemy_count')}] == ${c.count}}] "count"\n`;
      const bytes = [{address:0xF600,bytes:c.sat},...c.patterns,...c.colors];
      bytes.forEach(block=>block.bytes.forEach((v,k)=>{tcl+=`check [expr {[debug read VRAM ${block.address+k}]==${v}}] "VRAM ${block.address+k} expected ${v}"\n`;}));
      tcl += '}\n';
    });
    tcl += `}\ndebug cont\n}\ndebug set_bp ${address('checkpoint')} {} {verify}\ndebug set_bp ${address('finished')} {} {puts $::f "VERDICT: [expr {$::failures==0 && $::hits==${cases.length} ? \"PASS\" : \"FAIL\"}] hits=$::hits failures=$::failures";close $::f;exit}\nafter time 15 {puts $::f "TIMEOUT";close $::f;exit}\n`;
    fs.writeFileSync(base+'.tcl',tcl);
    manifest.push({name,rom:base+'.rom',tcl:base+'.tcl',log:base+'.log',mapper:banked?'Konami':'Normal',cases:cases.length});
  }
  console.log(JSON.stringify({sprite:sprite.name,slime,patternsRaw:patternBytes.length/32,VRAMbefore:data.patternGroupCount,
    VRAMafter:compact.patternGroupCount,patternROMbefore:patternBytes.length,
    patternROMafter:compact.compactPatterns.packs.length*compact.compactPatterns.mapBytes+compact.compactPatterns.patternPools.reduce((s,p)=>s+p.length,0),mapRAM:compact.compactPatterns.mapBytes}));
}
fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2));
console.log(`PASS: exact reconstruction, colours, bit differences, legacy fallback; 8 cartridges compiled.\nMANIFEST=${path.join(output,'manifest.json')}`);
