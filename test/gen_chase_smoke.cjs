const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const generator=require(path.join(ROOT,'test','ts_build_chase','utils','msxGenerator','index.js'));
const raw=JSON.parse(fs.readFileSync(path.join(ROOT,'server','temp','loderunner_jumper_project.json'),'utf8'));
const assets=raw.assets;const byType=t=>assets.filter(a=>a&&a.type===t);
let patched=0;
for(const s of byType('msx2screen')){for(const e of (s.data?.layers?.entities||[])){
  if(e.kind!=='enemy'&&e.kind!=='hazard')continue;
  if((e.params?.movement||e.components?.msx2_movement?.mode)==='patrolX')continue;
  e.components=e.components||{};e.components.msx2_movement={...(e.components.msx2_movement||{}),mode:'chaseHorizontal',direction:1};
  e.params={...(e.params||{}),movement:'chaseHorizontal'};patched++;
}}
if(!patched)throw new Error('no enemy patched');
const summary={projectInfo:{name:'chase_smoke',targetMSX:'MSX2'},screenMode:raw.screenMode,currentScreenMode:raw.currentScreenMode,targetGraphicsBackend:raw.targetGraphicsBackend,assets:{sprites:byType('sprite'),msx2Sprites:byType('msx2sprite'),msx2Bitmaps:byType('msx2bitmap'),msx2Screens:byType('msx2screen'),tiles:byType('tile'),tileBanks:byType('tilebank'),screens:byType('screenmap'),entities:byType('entity'),components:byType('componentdefinition'),templates:byType('entitytemplate'),fonts:byType('font'),stateMachines:byType('statemachine'),worldmaps:byType('worldmap'),bosses:byType('boss'),globalVariables:byType('globalvariable'),tracks:byType('music').map(a=>a.data||a),menus:byType('menu')},execution:{mainGameFlow:byType('gameflow')[0]?.data}};
const asm=generator.generateModularASMFromSummary(summary,{generateUnified:true,romMode:'megarom',targetFormat:'konami'})['unitedFiles.asm']||'';
for(const n of ['msx2_enemy_chase_h_shared:','.enemy_slot_0_chase_h','jp msx2_enemy_chase_h_shared','ld a, (msx2_player_sprite_x)']){if(!asm.includes(n))throw new Error('missing '+n);}
const mi=asm.indexOf('msx2_screen_enemy_mode:');const mb=asm.slice(mi,asm.indexOf('\n',asm.indexOf('DB',mi)));if(!/#08/.test(mb))throw new Error('mode 8 missing: '+mb);
const h0=asm.indexOf('msx2_enemy_chase_h_shared:');const h1=asm.indexOf('\nmsx2_',h0+10);const body=asm.slice(h0,h1);
const pu=(body.match(/\bpush (bc|af)\b/g)||[]).length,po=(body.match(/\bpop (bc|af)\b/g)||[]).length;
if(pu!==po)throw new Error('push/pop imbalance '+pu+'/'+po);
fs.writeFileSync(path.join(ROOT,'test','chase_smoke.asm'),asm);
console.log('chase smoke OK: patched='+patched+' push=pop='+pu+' chars='+asm.length);
