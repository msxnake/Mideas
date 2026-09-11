// Directed OpenMSX regression of the REAL generated load/SAT/colour routines.
// Movement is not under test: cases set pool/light inputs explicitly. External
// room-dark predicate is controlled; light geometry and VDP copier are real.
// Builds pre/post resident test cartridges; full-game probes cover Konami.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
const root = process.cwd();
const out = path.resolve('work/enemy-cache-directed');
fs.mkdirSync(out, { recursive: true });
const modulePath = 'utils/msxGenerator/generators/msx2/msx2BitmapEnemyGenerator.ts';
const reference = 'cb308f04ad9ead3595f068be01ee28251e34afd1';
const old = execFileSync('git', ['show', `${reference}:${modulePath}`], { encoding: 'utf8' });
const full = fs.readFileSync('work/enemy-cache-game-v6/post.asm', 'utf8');
function routine(text, label) {
  const start = text.indexOf(`\n${label}:`);
  if (start < 0) throw new Error(`missing ${label}`);
  const tail = text.slice(start + 1);
  const end = tail.slice(label.length + 1).search(/^\w[^\s:]*:/m);
  return end < 0 ? tail : tail.slice(0, label.length + 1 + end);
}
const copier = routine(full, 'copy_to_vram_ext');
const vdp = routine(full, 'vdp_write_register');
// Every source offset (including 255) owns a distinctive, valid colour block.
const colors = Array.from({ length: 4096 }, (_, i) => 1 + ((Math.floor(i / 16) + i % 16) % 15));
function record(x, color) {
  const r = Array(23).fill(0);
  r[0] = x; r[1] = 40; r[2] = 1; r[9] = color;
  r[10] = 2; r[11] = 8; r[12] = 11; r[20] = 1; r[21] = 1;
  return r;
}
const data = { maxSlots: 2, maxFrames: 2, slimeEnabled: true, gearEnabled: false,
  darkEyesEnabled: true, roomTables: [
    [2, ...record(40, 0), ...record(80, 8)],
    [0, ...Array(46).fill(0)],
    [1, ...record(100, 16), ...Array(23).fill(0)],
  ], patternBytes: Array(256).fill(0xAA), colorBytes: colors,
};
const opts = { ramBase: 0xD000, satBase: 0xF608, colorBase: 0xF420,
  patternGroupBase: 8, gameYOffset: 20, playerHitbox: { x: 0, y: 0, w: 16, h: 16 },
  damageInvulnFrames: 60, darkEyes: { halfWidths: [Array(8).fill(24)],
    stagedHalo: false, torchGated: true, lantern: { halfWidth: 16, halfHeight: 16 } },
};
const globals = { current_screen_index: 0xC100, test_dark: 0xC101,
  bitmap_light_active: 0xC102, bitmap_light_on: 0xC103,
  bitmap_light_x: 0xC104, bitmap_light_y: 0xC105,
  bitmap_bl_on: 0xC106, bitmap_bl_x: 0xC107, bitmap_bl_y: 0xC108 };
const word = n => `#${n.toString(16)}`;
for (const target of ['pre', 'post']) {
  const bundle = path.join(out, `${target}.mjs`);
  await build({ entryPoints: [modulePath], bundle: true, format: 'esm', platform: 'node', outfile: bundle,
    plugins: target === 'pre' ? [{ name: 'baseline', setup(p) {
      p.onLoad({ filter: /msx2BitmapEnemyGenerator\.ts$/ }, () => ({ contents: old, loader: 'ts', resolveDir: path.dirname(path.resolve(modulePath)) }));
    } }] : [] });
  const mod = await import(pathToFileURL(bundle).href);
  const generated = mod.buildBitmapEnemySystemAsm(data, opts);
  const labels = ['bitmap_load_enemies', 'bitmap_enemy_patterns_offset', 'bitmap_enemy_colors_offset',
    'bitmap_enemy_light_reaches', 'bitmap_enemy_light_half_widths', 'bitmap_update_enemy_sat', 'bitmap_update_enemy_colors'];
  const selected = labels.map(l => routine('\n' + generated.routinesAsm, l)).join('\n');
  const cases = [];
  let code = '';
  let count = 0, pool = [Array(27).fill(0), Array(27).fill(0)];
  let light = { dark: 0, active: 0, on: 1, x: 48, y: 68, bl: 0, bx: 48, by: 68 };
  let keys = [0, 0], valid = [0, 0], expectedVram = [Array(16).fill(0), Array(16).fill(0)], copies = 0;
  const emitByte = (label, value) => `    ld a, ${value}\n    ld (${label}), a\n`;
  function expectedOffset(s) {
    const p = pool[s];
    const flipped = p[26] === 1 || p[26] === 2;
    const lit = !light.dark || (light.active && light.on && Math.abs(p[0] + 8 - light.x) < 24 && Math.abs(p[1] + 28 - light.y) < 32)
      || (light.bl && Math.abs(p[0] + 8 - light.bx) < 16 && Math.abs(p[1] + 28 - light.by) < 16);
    return (p[12] + p[9] + (flipped ? p[10] : 0) + (lit ? 0 : p[10] * 2)) & 255;
  }
  function step(name, { room, fields = [], lighting = {}, update = true, poison = false } = {}) {
    if (room !== undefined) {
      code += emitByte('current_screen_index', room) + '    call bitmap_load_enemies\n';
      count = data.roomTables[room][0]; valid = [0, 0];
      for (let s = 0; s < count; s++) {
        const r = data.roomTables[room].slice(1 + 23*s, 24 + 23*s);
        pool[s] = Array(27).fill(0); pool[s].splice(0, 8, ...r.slice(0, 8));
        pool[s][9] = 0; pool[s][10] = r[10]; pool[s][12] = r[9]; pool[s][13] = r[12];
        expectedVram[s] = colors.slice(r[9]*16, r[9]*16+16); copies++;
      }
    }
    Object.assign(light, lighting);
    for (const [k, label] of Object.entries({ dark:'test_dark', active:'bitmap_light_active', on:'bitmap_light_on', x:'bitmap_light_x', y:'bitmap_light_y', bl:'bitmap_bl_on', bx:'bitmap_bl_x', by:'bitmap_bl_y' })) code += emitByte(label, light[k]);
    for (const [s, off, value] of fields) { pool[s][off] = value; code += emitByte(`bitmap_enemy_pool + ${27*s+off}`, value); }
    if (poison && target === 'post') {
      code += emitByte('bitmap_enemy_color_keys', 255) + emitByte('bitmap_enemy_color_valid', 0);
      keys[0] = 255; valid[0] = 0;
    }
    if (update) {
      code += '    ld bc, #1234\n    ld hl, #5678\n    call bitmap_update_enemy_colors\n';
      for (let s = 0; s < count; s++) {
        const k = expectedOffset(s);
        if (target === 'pre' || !valid[s] || keys[s] !== k) copies++;
        keys[s] = k; valid[s] = 1; expectedVram[s] = colors.slice(k*16, k*16+16);
      }
    } else code += '    ld bc, #1234\n    ld hl, #5678\n';
    code += '    call bitmap_update_enemy_sat\n';
    const sat = pool.flatMap((p, s) => s >= count || p[13] === 255 ? [212,0,0,0] :
      [p[1]+20, p[0], (8+s*8)*4 + p[9]*16 + (p[2]&128 ? 4:0) + ([1,2].includes(p[26]) ? 8:0), 0]);
    sat.push(216,0,0,0);
    cases.push({ name, count, copies, vram: structuredClone(expectedVram), sat, valid: [...valid], keys: [...keys], checkKeys: update });
    code += `    ld a, ${cases.length-1}\n    call checkpoint\n`;
  }
  step('room A initial load', { room: 0, update: false });
  step('first cache fill'); step('unchanged frame');
  step('animation frame 1', { fields: [[0,9,1],[1,9,1]] });
  step('dark room eyes', { lighting: { dark: 1 } }); step('unchanged dark');
  step('halo reaches slot0', { lighting: { active:1 } });
  step('torch extinguished', { lighting: { on:0 } });
  step('bullet lantern reaches slot0', { lighting: { bl:1 } });
  step('slime rising', { fields:[[0,26,1],[1,26,1]] });
  step('slime ceiling same colors', { fields:[[0,26,2],[1,26,2]] });
  step('slime falling', { fields:[[0,26,3],[1,26,3]] });
  step('room B empty', { room:1 });
  step('room C reuses slot0', { room:2 });
  step('room A restored', { room:0, lighting:{dark:0,active:0,bl:0} });
  step('offset255 invalid key255', { fields:[[0,12,255],[0,9,0]], poison:true });
  step('offset255 cached');
  step('offset wraps to zero', { fields:[[0,9,1]] });
  step('killed slot hidden SAT', { fields:[[0,13,255]] });
  const asm = `org #4000\ndb #41,#42\ndw init,0,0,0,0,0,0\ninit:\n    di\n    ld sp, #F000\n    ld a, 5\n    call #005F\n    di\n    ld ix, #1357\n    ld iy, #2468\n${code}\nfinished:\n    jp finished\ncheckpoint:\n    ret\nVDP_CTRL_PORT EQU #99\nVDP_DATA_PORT EQU #98\n${Object.entries(globals).map(([k,v])=>`${k} EQU ${word(v)}`).join('\n')}\n${generated.equates}\nbitmap_light_room_is_dark:\n    ld a, (test_dark)\n    or a\n    ret\n${selected}\n${copier}\n${vdp}\n${generated.dataAsm}\nds #C000-$,#FF\n`;
  const base = path.join(out,target);
  fs.writeFileSync(base+'.asm', asm.replace(/^(org|db|dw|ds) /gm, '    $1 '));
  execFileSync('java', ['-jar','server/glass.jar',base+'.asm',base+'.rom',base+'.sym']);
  const sym = fs.readFileSync(base+'.sym','utf8');
  const addr = label => { const m = sym.match(new RegExp(`^${label}: equ ([0-9A-F]+)H`,'m')); if(!m)throw Error(label); return parseInt(m[1],16); };
  const tclPath = s => s.replaceAll('\\','/');
  const tcl = `set f [open "${tclPath(base)}.txt" w]\nset throttle off\nset failures 0\nset hits 0\nset copies 0\nset boots 0\nproc check {yes msg} { if {!$yes} { incr ::failures; puts $::f "FAIL $msg" } }\n` +
    `debug set_bp ${addr('init')} {} { incr ::boots; debug cont }\n` +
    `debug set_bp ${addr('copy_to_vram_ext')} {} { if {[reg DE] >= 62496 && [reg DE] < 62528} { incr ::copies }; debug cont }\n` +
    `proc verify {} {\n set id [reg A]\n incr ::hits\n check [expr {[reg BC] == 4660 && [reg HL] == 22136 && [reg IX] == 4951 && [reg IY] == 9320}] "register contract at $id"\n check [expr {[debug read {VDP regs} 14] == 0}] "R14 at $id"\n switch -- $id {\n` +
    cases.map((c,i)=>`${i} {\n puts $::f "CASE ${i}: ${c.name}"\n check [expr {$::copies == ${c.copies}}] "copies $::copies expected ${c.copies}"\n` +
      `check [expr {[debug read memory ${addr('bitmap_enemy_count')}] == ${c.count}}] "count"\n` +
      c.sat.map((v,k)=>`check [expr {[debug read VRAM ${0xF608+k}] == ${v}}] "SAT byte ${k}"`).join('\n')+'\n'+
      c.vram.flatMap((arr,s)=>arr.map((v,k)=>`check [expr {[debug read VRAM ${0xF420+s*16+k}] == ${v}}] "color ${s}/${k}"`)).join('\n')+'\n'+
      (target==='post' ? c.valid.map((v,s)=>`check [expr {[debug read memory ${addr('bitmap_enemy_color_valid')+s}] == ${v}}] "valid ${s}"`).join('\n')+'\n'+
      (c.checkKeys ? c.keys.slice(0,c.count).map((v,s)=>`check [expr {[debug read memory ${addr('bitmap_enemy_color_keys')+s}] == ${v}}] "key ${s}"`).join('\n'):'') : '')+'\n}').join('\n') +
    '\n default {error "unknown case $id"}\n }\n}\n' +
    `debug set_bp ${addr('checkpoint')} {} { if {[catch {verify} e]} { incr ::failures; puts $::f "ERROR $e" }; debug cont }\n` +
    `debug set_bp ${addr('finished')} {} { check [expr {$::hits == ${cases.length} && $::boots == 1}] "hits/boots"; puts $::f "hits=$::hits boots=$::boots failures=$::failures copies=$::copies"; puts $::f [expr {$::failures == 0 ? "VERDICT: PASS" : "VERDICT: FAIL"}]; puts $::f "RUN-COMPLETE"; close $::f; exit }\n` +
    'after time 20 { puts $::f "VERDICT: FAIL timeout"; close $::f; exit }\n';
  fs.writeFileSync(base+'.tcl',tcl);
  fs.writeFileSync(base+'.json',JSON.stringify({reference,target,cases,files:['asm','rom','sym'].map(ext=>({ext,sha256:createHash('sha256').update(fs.readFileSync(base+'.'+ext)).digest('hex')}))},null,2));
  console.log(`${target}: ${cases.length} directed cases, ${fs.statSync(base+'.rom').size} bytes`);
}
