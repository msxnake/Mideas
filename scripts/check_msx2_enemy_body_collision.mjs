// Compile the real interpreter and terrain probe, then exercise body extents in OpenMSX.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'mideas_enemy_body_'));
const bundle = path.join(out, 'helpers.mjs');
await build({ stdin: { resolveDir: root, loader: 'ts', contents: `
export { buildEnemyBehaviorRuntimeAsm, buildEnemyBehaviorProgramAsm } from './utils/msxGenerator/generators/msx2/msx2EnemyBehaviorRuntime';
export { generateModularASM } from './utils/msxGenerator';
export { getEnemySpriteBodyBounds, buildEnemyBodyWalkerAsm } from './utils/msxGenerator/generators/msx2/msx2EnemyBodyCollision';
` }, bundle: true, platform: 'node', format: 'esm', outfile: bundle, logLevel: 'silent' });
const impl = await import(pathToFileURL(bundle).href);
assert.deepEqual(impl.getEnemySpriteBodyBounds({width:16,height:32},[{x:0,y:0},{x:0,y:16}]).bytes,[0,0,15,31]);
assert.deepEqual(impl.getEnemySpriteBodyBounds({width:16,height:16},[{x:0,y:0},{x:16,y:16}]).bytes,[0,0,31,31]);
assert.deepEqual(impl.getEnemySpriteBodyBounds({width:16,height:16},[{x:-8,y:-8},{x:16,y:16}]).bytes,[248,248,39,39]);
assert.throws(()=>impl.getEnemySpriteBodyBounds({width:272,height:16},[]),/fit inside/);
const p = JSON.parse(fs.readFileSync(path.join(root, 'test/msx2-screen5-fg/fg_fastcopy_fixture.json')));
const room = p.assets.find(a => a.type === 'msx2bitmaproom');
room.data.collisionShape = Array.from({ length: 12 }, () => Array(16).fill(0));
room.data.collisionShape[0][0] = 3;
room.data.collision[0][0] = 16;
room.data.collision[0][1] = 32; // include the real one-way floor helper
const old = console.log; console.log = () => {};
let full;
try { full = impl.generateModularASM('body_helpers', p.assets, { generateUnified: true, romMode: 'megarom', targetFormat: 'konami', screenMode: p.screenMode })['unitedFiles.asm']; }
finally { console.log = old; }
const probeStart = full.indexOf('bitmap_probe_solid:');
const probeEnd = full.indexOf('bitmap_probe_deadly:', probeStart);
assert(probeStart >= 0 && probeEnd > probeStart);
const terrain = full.slice(probeStart, probeEnd);
// Compile the standalone WalkerGravity bridge too (no authored interpreter).
const walkerGame = structuredClone(p);
const walkerRoom = walkerGame.assets.find(a => a.type === 'msx2bitmaproom');
const art = { id:'body_walker_sprite', name:'Body walker', target:'MSX2', vdpMode:'SCREEN5',
  size:{width:16,height:32}, superSpriteLayout:'stackVertical', backgroundColor:'rgba(0,0,0,0)',
  palette:walkerRoom.data.palette,
  frames:[{id:'one',data:Array.from({length:32},()=>Array(16).fill('#FFFFFF'))}],
  currentFrameIndex:0, hardware:{color:15}, facingDirection:'right', animationSpeedMs:160 };
walkerGame.assets.push({id:art.id,name:art.name,type:'msx2sprite',data:art});
walkerRoom.data.entities=[{id:'body_walker',kind:'enemy',position:{x:2,y:8},spriteAssetId:art.id,
  components:{msx2_hardware_sprite:{msx2SpriteAssetId:art.id},msx2_movement:{mode:'walkerGravity',minX:0,maxX:240,boundsUnit:'px'}},params:{}}];
console.log=()=>{};
let walkerAsm;
try { walkerAsm=impl.generateModularASM('body_walker',walkerGame.assets,{generateUnified:true,romMode:'megarom',targetFormat:'konami',screenMode:p.screenMode})['unitedFiles.asm']; }
finally {console.log=old;}
assert.match(walkerAsm,/Complete-body scratch shared by legacy walkers/);
assert.match(walkerAsm,/bitmap_enemy_sprite_body_bounds:[\s\S]*?#00,#00,#0F,#1F/);
const walkerPath=path.join(out,'walker-game');
fs.writeFileSync(walkerPath+'.asm',walkerAsm);
execFileSync('java',['-jar',path.join(root,'server/glass.jar'),'-I',path.join(root,'server'),walkerPath+'.asm',walkerPath+'.rom'],{stdio:'pipe'});
const vm = impl.buildEnemyBehaviorRuntimeAsm({ ramBase: 0xC100, bodyBoundsLabel: 'body_descriptors',
  poolProgramOffset: 24, poolStateOffset: 25, poolTimerOffset: 26, poolVelocityOffset: 27,
  poolStride: 30, maxSlots: 1, programsUseGravity: false, floorProbeLabel: 'bitmap_probe_floor' });
assert.equal(vm.ramBytes, 13, 'four geometry bytes follow the existing shared scratch');
const programs = impl.buildEnemyBehaviorProgramAsm([
  { id: 'walk', name: 'unconditional walk', gravity: false, bytes: [1,3,0,1,0,0,1,0,255] },
  { id: 'drop', name: 'drop through platform', gravity: false, bytes: [1,3,0,1,0,0,16,0,255] },
]).asm;
const descriptors = [[0,0,15,15],[0,0,15,31],[0,0,31,31],[0,0,31,15],[248,248,31,31],[0,0,15,47],[0,0,255,15]];
const base = path.join(out, 'body');
const asm = ` ORG #4000
 DB #41,#42
 DW init,0,0,0,0,0,0
init:
 DI
 LD SP,#F000
ready:
 JP ready
checkpoint:
 JP checkpoint
loaded:
 JP loaded
bitmap_enemy_pool EQU #C000
bitmap_enemy_count EQU #C080
player_x EQU #C200
player_y EQU #C201
bitmap_room_collision_map EQU #C400
bitmap_room_behavior_map EQU #C500
${vm.equates}
${vm.routinesAsm}
body_walker_test:
${impl.buildEnemyBodyWalkerAsm()}
.enemy_anim:
 RET
${programs}
${terrain}
bitmap_probe_behavior:
 XOR A
 RET
body_descriptors:
 DB ${descriptors.flat().join(',')}
 DS #C000-$,#FF
`;
fs.writeFileSync(base+'.asm', asm);
execFileSync('java', ['-jar', path.join(root,'server/glass.jar'), base+'.asm', base+'.rom', base+'.sym'], { stdio: 'pipe' });
const symbols = fs.readFileSync(base+'.sym', 'utf8');
const address = label => { const m = symbols.match(new RegExp('^'+label+': equ ([0-9A-F]+)H', 'm')); assert(m,label); return parseInt(m[1],16); };
const solid = (col,row,mask=0) => [col+16*row, mask ? 17 : 16, mask << 4];
const cases = [];
const add = (name, shape, x, y, target, cells, expected, extra={}) => cases.push({name,shape,x,y,target,cells,expected,...extra});
add('32px feet stop at floor 176',1,32,144,'probe_below',[solid(2,11)],{blocked:true});
add('16px body remains supported at its own height',0,32,160,'probe_below',[solid(2,11)],{blocked:true});
add('32px body stays clear above ground',1,32,128,'probe_below',[solid(2,11)],{blocked:false});
add('48px body feet',5,32,128,'probe_below',[solid(2,11)],{blocked:true});
add('lower half wall blocks tall body',1,176,128,'probe_ahead',[solid(12,9,3)],{blocked:true});
add('same obstacle stays clear for short body',0,176,128,'probe_ahead',[solid(12,9,3)],{blocked:false});
add('left wall covers lower body',1,16,128,'probe_ahead',[solid(0,9,3)],{blocked:true},{dx:255});
add('unaligned side scans every quadrant',1,176,129,'probe_ahead',[solid(12,8,4)],{blocked:true});
add('wide body stands on support away from centre',2,80,128,'probe_below',[solid(5,10,1)],{blocked:true});
add('wide head catches far-right ceiling quadrant',2,80,96,'probe_head',[solid(6,5,8)],{blocked:true});
add('shaped hole stays clear',1,176,128,'probe_ahead',[solid(12,7,3)],{blocked:false});
add('right room edge, wide body',2,224,80,'probe_ahead',[],{blocked:true});
add('left room edge',1,0,80,'probe_ahead',[],{blocked:true},{dx:255});
add('room ceiling',1,40,0,'probe_head',[],{blocked:true});
add('negative part offsets remain inside room',4,8,8,'probe_head',[],{blocked:true});
add('negative offset underflow does not wrap',4,7,8,'probe_below',[],{blocked:true});
add('256px body right edge does not wrap',6,0,80,'probe_ahead',[],{blocked:true});
add('unconditional WALK cannot cross lower wall',1,176,128,'step',[solid(12,9,3)],{x:176,y:128},{vm:true});
add('fast WALK checks every pixel',1,170,128,'step',[solid(12,9,3)],{x:176,y:128},{vm:true,speed:12});
add('wide WALK stops at full width',2,160,128,'step',[solid(12,9,3)],{x:160,y:128},{vm:true});
add('fall integrates real height',1,32,144,'integrate_vy',[solid(2,11)],{x:32,y:144,vy:0},{vy:252});
add('short fall keeps original geometry',0,32,160,'integrate_vy',[solid(2,11)],{x:32,y:160,vy:0},{vy:252});
add('jump hits full-width ceiling',2,80,96,'integrate_vy',[solid(6,5,8)],{x:80,y:96,vy:0},{vy:4});
add('backwards probe respects lower wall',1,16,128,'back',[solid(0,9,3)],{blocked:true});
add('zero-facing backwards probe',1,16,128,'back',[solid(0,9,3)],{blocked:true},{dx:0});
add('WalkerGravity tall body stays on floor',1,32,144,'walker',[solid(2,11)],{x:33,y:144});
add('WalkerGravity short body stays on floor',0,32,160,'walker',[solid(2,11)],{x:33,y:160});
add('WalkerGravity reverses at lower wall',1,176,128,'walker',[solid(11,10),solid(12,9,3)],{x:176,y:128});
add('32px feet land on one-way platform',1,32,128,'probe_below',[[162,32,0]],{blocked:true});
add('below landing band falls through platform',1,32,132,'probe_below',[[162,32,0]],{blocked:false});
add('one-way platform does not block a side',1,16,144,'probe_ahead',[[162,32,0]],{blocked:false});
add('DROP_THROUGH uses the complete body feet',1,32,128,'step',[[162,32,0]],{x:32,y:132},{program:2});
const targets = cases.map(c => address(c.target==='walker' ? 'body_walker_test' : c.target==='back' ? 'bitmap_enemy_body_probe_back' : 'bitmap_enemy_script_'+c.target));
let tcl = `set f [open "${base.replaceAll('\\','/')}.log" w]
set throttle off
set failures 0
set index -1
proc check {ok message} {if {!$ok} {incr ::failures; puts $::f "FAIL $message"}}
proc invoke {target returnTo} {
 reg PC $target
 reg SP 61440
 debug write memory 61440 [expr {$returnTo & 255}]
 debug write memory 61441 [expr {$returnTo >> 8}]
}
proc next_case {} {
 incr ::index
 switch -- $::index {
`;
cases.forEach((c,i)=>{
  const slot = Array(30).fill(0);
  Object.assign(slot,{0:c.x,1:c.y,2:c.dx??1,4:0,5:240,10:1,12:c.shape,13:14,21:c.speed??1,24:c.program??1,27:c.vy??0});
  tcl += `${i} {puts $::f "CASE ${i}: ${c.name}"\n`;
  tcl += `for {set k 0} {$k<192} {incr k} {debug write memory [expr {50176+$k}] 0; debug write memory [expr {50432+$k}] 0}\n`;
  slot.forEach((v,k)=>tcl+=`debug write memory ${0xC000+k} ${v}\n`);
  for(const [cell,value,mask] of c.cells) tcl+=`debug write memory ${0xC400+cell} ${value}\ndebug write memory ${0xC500+cell} ${mask}\n`;
  tcl += `invoke ${address('bitmap_enemy_body_load')} ${address('loaded')}\n}\n`;
});
tcl += `default {puts $::f "VERDICT: [expr {$::failures==0 ? \"PASS\" : \"FAIL\"}] cases=${cases.length} failures=$::failures"; close $::f; exit}
}
debug cont
}
debug set_bp ${address('ready')} {} {next_case}
debug set_bp ${address('loaded')} {} {
 reg IX 49152
 reg IY 9320
 reg BC 4660
 reg DE 22136
 reg HL 39612
 set targets {${targets.join(' ')}}
 invoke [lindex $targets $::index] ${address('checkpoint')}
 debug cont
}
debug set_bp ${address('checkpoint')} {} {
check [expr {[reg IX]==49152 && [reg IY]==9320 && [reg BC]==4660 && [reg SP]==61442}] "register/stack contract $::index"
switch -- $::index {
`;
cases.forEach((c,i)=>{
 tcl+=`${i} {\n`;
 if ('blocked' in c.expected) {
   tcl+=`check [expr {([reg F]&64)==${c.expected.blocked?0:64}}] "probe flags ${i}"\ncheck [expr {[reg DE]==22136 && [reg HL]==39612}] "probe preserved DE/HL ${i}"\n`;
 } else {
   for(const [key,ofs] of [['x',0],['y',1],['vy',27]]) if(key in c.expected) tcl+=`check [expr {[debug read memory ${0xC000+ofs}]==${c.expected[key]}}] "${key} ${i}"\n`;
 }
 tcl+='}\n';
});
tcl += `}
next_case
}
after time 15 {puts $::f TIMEOUT;close $::f;exit}
`;
// The descriptor loader needs IX before the first case as well.
tcl = tcl.replace('proc next_case {} {','proc next_case {} {\n reg IX 49152');
fs.writeFileSync(base+'.tcl', tcl);
const manifest = [{rom:base+'.rom',tcl:base+'.tcl',log:base+'.log',mapper:'Normal',cases:cases.length}];
fs.writeFileSync(path.join(out,'manifest.json'), JSON.stringify(manifest));
console.log(`Compiled ${cases.length} full-body cases using the real Z80 interpreter and shape-aware terrain probe.`);
console.log('MANIFEST='+path.join(out,'manifest.json'));
