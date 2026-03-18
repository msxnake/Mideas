import fs from 'fs';
import assert from 'assert';

const source = fs.readFileSync('utils/msxGenerator/generators/gameFlowGenerator.ts', 'utf8');

assert(
  source.includes('const worldHasHudCarrier = nodes.some'),
  'Expected world HUD carrier detection in getHudRuntimeScreenIndexes()'
);

assert(
  source.includes('if (!worldHasHudCarrier) {'),
  'Expected worlds without HUD carrier to be skipped'
);

assert(
  source.includes('runtimeIndexes.add(idx);'),
  'Expected all nodes of HUD-enabled worlds to be added to HUD runtime indexes'
);

console.log('HUD runtime screen selection covers every node in HUD-enabled worlds.');
