#!/usr/bin/env node
// Generates the ASM of a Mideas project with the REAL generator (compiled beforehand with tsc into --gen) and assembles it with
// server/glass.jar. Also assembles an existing .asm (used by the sabotage runs, which edit the ASM text).
//
//   tsc --module commonjs --target ES2020 --moduleResolution node --skipLibCheck --noEmitOnError false --outDir <gen> utils/msxGenerator/index.ts
//   echo '{"type":"commonjs"}' > <gen>/package.json
//   node --max-old-space-size=8192 test/msx2-pursuer/build_pursuer_rom.mjs --project p.json --gen <gen> --out <prefix> [--cfg ui|measure] [--repo <root>]
//   node test/msx2-pursuer/build_pursuer_rom.mjs --asm edited.asm --out <prefix> [--repo <root>]        (assemble only)
//
// --cfg ui      what the export dialog sends for a bitmap-room project (CodeExportModal.generateMapperReadyBundle): entity templates,
//               component definitions and the presentation screen are added as assets; romMode megarom, autoMegaROM false, backend screen5.
// --cfg measure what scripts/measure_bitmap_rom_budget.mjs sends (autoMegaROM true, raw assets only).
// --repo        repository root whose server/glass.jar assembles the ASM (default: the repo this script lives in; a worktree passes its own).
// Writes <prefix>.asm/.rom/.sym/.gen.log/.glass.log. Free resident bytes = #C000 - bitmap_resident_end.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const args = process.argv.slice(2);
const val = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const project = val('--project'), genDir = val('--gen'), outPrefix = val('--out'), asmIn = val('--asm');
const repo = val('--repo') || path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..');
const cfgMode = val('--cfg') || 'ui';
if (!outPrefix || (!asmIn && (!project || !genDir))) {
  console.error('usage: build_pursuer_rom.mjs --project p.json --gen <tsc out dir> --out <prefix> [--cfg ui|measure] [--repo root]\n   or: build_pursuer_rom.mjs --asm in.asm --out <prefix> [--repo root]');
  process.exit(2);
}
const rl = console.log;
let asmPath = asmIn;
if (!asmIn) {
  const raw = JSON.parse(fs.readFileSync(project, 'utf8'));
  const generator = createRequire(import.meta.url)(path.join(genDir, 'utils', 'msxGenerator', 'index.js'));
  const assets = [...raw.assets];
  if (cfgMode === 'ui') {
    // Same as CodeExportModal.getEnhancedAssets()
    if (Array.isArray(raw.entityTemplates)) for (const t of raw.entityTemplates) assets.push({ id: t.id, type: 'entitytemplate', name: t.name || t.id, data: t });
    if (Array.isArray(raw.componentDefinitions)) for (const c of raw.componentDefinitions) if (!assets.find(a => a.id === c.id && a.type === 'componentdefinition')) assets.push({ id: c.id, type: 'componentdefinition', name: c.name || c.id, data: c });
    const ps = raw.presentationScreen;
    if (ps && typeof ps === 'object' && Object.keys(ps).length) assets.push({ id: 'system_presentation_screen', type: 'presentationscreen', name: ps.name || 'Presentation Screen', data: ps });
  }
  const hasRoom = assets.some(a => a.type === 'msx2bitmaproom');
  const config = cfgMode === 'ui'
    ? { generateUnified: true, romMode: 'megarom', targetFormat: 'konami', autoMegaROM: false, screenMode: hasRoom ? 'SCREEN 4 (Graphics II)' : (raw.currentScreenMode || 'SCREEN 4 (Graphics II)'), targetGraphicsBackend: hasRoom ? 'screen5' : undefined }
    : { generateUnified: true, romMode: 'megarom', targetFormat: 'konami', autoMegaROM: true, screenMode: raw.screenMode || raw.currentScreenMode || 'SCREEN 4 (Graphics II)', targetGraphicsBackend: raw.targetGraphicsBackend || undefined };
  const logLines = [];
  const rw = console.warn, re = console.error;
  console.log = (...a) => logLines.push('LOG ' + a.join(' '));
  console.warn = (...a) => logLines.push('WARN ' + a.join(' '));
  console.error = (...a) => logLines.push('ERR ' + a.join(' '));
  let files;
  const t0 = Date.now();
  try { files = generator.generateModularASM(raw.name || raw.currentProjectName || 'proj', assets, config); }
  catch (e) { console.log = rl; console.warn = rw; console.error = re; fs.writeFileSync(outPrefix + '.gen.log', logLines.join('\n')); rl('GENERATOR THREW: ' + (e && e.message || e)); process.exit(1); }
  finally { console.log = rl; console.warn = rw; console.error = re; }
  const asm = files['unitedFiles.asm'] || files['main.asm'];
  if (!asm) throw new Error('no unified asm: ' + Object.keys(files).join(','));
  fs.writeFileSync(outPrefix + '.gen.log', logLines.join('\n'));
  fs.writeFileSync(outPrefix + '.asm', asm);
  asmPath = outPrefix + '.asm';
  rl(`generated ${asm.length} chars of ASM in ${Date.now() - t0} ms, cfg=${cfgMode}, backend=${config.targetGraphicsBackend}, log lines=${logLines.length}`);
}
try {
  const out = execFileSync('java', ['-jar', path.join(repo, 'server', 'glass.jar'), '-I', path.join(repo, 'server'), asmPath, outPrefix + '.rom', outPrefix + '.sym'], { cwd: repo, stdio: 'pipe', maxBuffer: 1 << 28 });
  fs.writeFileSync(outPrefix + '.glass.log', out.toString());
} catch (e) {
  const msg = `${e.stdout || ''}${e.stderr || ''}`.trim().split('\n').slice(0, 10).join('\n');
  fs.writeFileSync(outPrefix + '.glass.log', msg);
  rl('GLASS FAILED:\n' + msg); process.exit(1);
}
rl(`glass OK -> ${outPrefix}.rom (${fs.statSync(outPrefix + '.rom').size} bytes)`);
