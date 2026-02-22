const fs = require('fs');
const path = require('path');

const generator = require(process.argv[2]);
const jsonPath = process.argv[3];
const asmPath = process.argv[4];
const projectNameArg = process.argv[5] || '';
const targetFormat = process.argv[6] || 'konami';
const romMode = process.argv[7] || 'megarom';
const autoMegaROMArg = process.argv[8];
const autoMegaROM = autoMegaROMArg === 'true';

const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const projectName = projectNameArg || raw.name || path.basename(jsonPath, path.extname(jsonPath));
const assets = Array.isArray(raw.assets) ? [...raw.assets] : [];
const knownIds = new Set(assets.map(a => a && a.id).filter(Boolean));

if (Array.isArray(raw.componentDefinitions)) {
  for (const comp of raw.componentDefinitions) {
    if (!comp || !comp.id || knownIds.has(comp.id)) continue;
    assets.push({ id: comp.id, name: comp.name || comp.id, type: 'componentdefinition', data: comp });
    knownIds.add(comp.id);
  }
}

if (Array.isArray(raw.entityTemplates)) {
  for (const tpl of raw.entityTemplates) {
    if (!tpl || !tpl.id || knownIds.has(tpl.id)) continue;
    assets.push({ id: tpl.id, name: tpl.name || tpl.id, type: 'entitytemplate', data: tpl });
    knownIds.add(tpl.id);
  }
}

const files = generator.generateModularASM(projectName, assets, {
  generateUnified: true,
  targetFormat,
  romMode,
  autoMegaROM
});

const asm = files['unitedFiles.asm'] || files['main.asm'];
if (!asm) {
  throw new Error('Generator did not return unitedFiles.asm/main.asm');
}

fs.writeFileSync(asmPath, asm, 'utf8');
console.log(`ASM generated: ${asmPath}`);
console.log(`Project: ${projectName}`);
console.log(`Mapper: ${targetFormat}`);
console.log(`ROM mode: ${romMode}`);
console.log(`AutoMegaROM: ${autoMegaROM}`);
console.log(`Assets: ${assets.length}`);
