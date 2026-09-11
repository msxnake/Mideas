// Run the structural gate first: it bundles the current/pinned generators.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
const out = path.resolve('work/enemy-cache-game-v6');
fs.mkdirSync(out, { recursive:true });
const raw = JSON.parse(fs.readFileSync('test/msx2-behavior/fixture_scripted_enemy.json','utf8'));
for (const [target,bundle] of [['pre','before'],['post','after']]) {
  const mod = await import(pathToFileURL(path.resolve(`work/enemy-color-cache-check/${bundle}.mjs`)).href);
  const save = { log:console.log, warn:console.warn, error:console.error };
  let files;
  try {
    console.log = console.warn = console.error = () => {};
    files = mod.generateModularASM(raw.name || 'cache-game', structuredClone(raw.assets), {
      generateUnified:true,romMode:'megarom',targetFormat:'konami',screenMode:raw.screenMode || 'SCREEN 4 (Graphics II)',
    });
  } finally { Object.assign(console,save); }
  const unified = files['unitedFiles.asm'];
  if (!unified) throw Error('unitedFiles.asm missing');
  const base = path.join(out,target);
  fs.writeFileSync(base+'.asm',unified);
  execFileSync('java',['-jar','server/glass.jar',base+'.asm',base+'.rom',base+'.sym']);
  console.log(`${target} compiled: ${fs.statSync(base+'.rom').size} bytes`);
}
