#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

// Load the generator
const generatorPath = path.join(__dirname, 'tsbuild_skill/utils/msxGenerator/index.js');
const { generateModularASM } = require(generatorPath);

// Load the project JSON
const jsonPath = 'C:/Users/salam/Downloads/patoantic247.json';
const projectData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const projectName = projectData.currentProjectName || 'patoantic247';

// Merge entityTemplates and componentDefinitions into the assets array
// (the generator expects them as typed assets in the array)
const entityTemplateAssets = (projectData.entityTemplates || []).map(t => ({
  id: t.id,
  name: t.name,
  type: 'entitytemplate',
  data: t
}));

const componentDefAssets = (projectData.componentDefinitions || []).map(c => ({
  id: c.id,
  name: c.name,
  type: 'componentdefinition',
  data: c
}));

const assets = [
  ...projectData.assets,
  ...entityTemplateAssets,
  ...componentDefAssets
];

console.log('Project name:', projectName);
console.log('Assets count:', assets.length, '(base:', projectData.assets.length, '+ templates:', entityTemplateAssets.length, '+ compdefs:', componentDefAssets.length + ')');

// Generate with megarom config
const config = {
  generateUnified: true,
  romMode: 'megarom',
  targetFormat: 'konami',
  autoMegaROM: false,
  interruptDrivenComponents: true,
  hardwareMode: 'hybrid',
  optimizeLevel: 'safe',
};

const files = generateModularASM(projectName, assets, config);

// Write the unified file
const outPath = path.join(__dirname, 'patoantic247_megarom.asm');
if (files['unitedFiles.asm']) {
  let asmCode = files['unitedFiles.asm'];

  // Inject COPY_SPRITE_SRC_TO_VRAM if referenced but not defined
  // (The server pipeline normally injects this; we provide a simple passthrough to FAST_LDIRVM)
  if (/call COPY_SPRITE_SRC_TO_VRAM/i.test(asmCode) && !/^COPY_SPRITE_SRC_TO_VRAM:/im.test(asmCode)) {
    const helper = `
; ==================================================================
; COPY_SPRITE_SRC_TO_VRAM stub (no ZX0 compression - raw copy only)
; Input: HL=source (ROM), DE=VRAM destination, BC=byte count
; ==================================================================
COPY_SPRITE_SRC_TO_VRAM:
    jp FAST_LDIRVM

`;
    // Insert before the last 'ret' near the end of the file (find END or last bank boundary)
    // Simplest: append before the very last line
    const insertPos = asmCode.lastIndexOf('\n    ret\n\n');
    if (insertPos !== -1) {
      asmCode = asmCode.slice(0, insertPos) + '\n' + helper + asmCode.slice(insertPos);
    } else {
      asmCode += helper;
    }
    console.log('Injected COPY_SPRITE_SRC_TO_VRAM stub');
  }

  fs.writeFileSync(outPath, asmCode, 'utf8');
  console.log('Written:', outPath, '(' + asmCode.length + ' chars, ~' + Math.ceil(asmCode.length / 1024) + ' KB)');
} else {
  console.error('ERROR: unitedFiles.asm not generated!');
  process.exit(1);
}
