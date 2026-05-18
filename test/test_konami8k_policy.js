/**
 * Validate the Konami 8K MegaROM policy from paper_mideas_konami8k.pdf.
 */

import fs from 'fs';

const mapperWindowUtils = fs.readFileSync('utils/msxGenerator/generators/mapperWindowUtils.ts', 'utf8');
const mapperGenerator = fs.readFileSync('utils/msxGenerator/generators/mapperGenerator.ts', 'utf8');
const unifiedGenerator = fs.readFileSync('utils/msxGenerator/generators/unifiedGenerator.ts', 'utf8');
const resourceArtifacts = fs.readFileSync('utils/msxGenerator/utils/megaromResourceArtifacts.ts', 'utf8');
const componentsGenerator = fs.readFileSync('utils/msxGenerator/generators/componentsGenerator.ts', 'utf8');
const stateMachineGenerator = fs.readFileSync('utils/msxGenerator/generators/stateMachineGenerator.ts', 'utf8');
const builder = fs.readFileSync('scripts/build_mideas_unified_rom.py', 'utf8');

const failures = [];

function expectContains(haystack, needle, description) {
  if (!haystack.includes(needle)) {
    failures.push(`Missing ${description}`);
  }
}

expectContains(mapperWindowUtils, "windowBaseExpr: '#A000'", 'Konami data window base #A000');
expectContains(mapperWindowUtils, "dataWindowPage: 'p3'", 'Konami data window page p3');

expectContains(mapperGenerator, 'call mapper_set_bank_p1', 'boot mapper init for 6000h bank 1');
expectContains(mapperGenerator, 'call mapper_set_bank_p2', 'boot mapper init for 8000h bank 2');
expectContains(mapperGenerator, 'call mapper_set_bank_p3', 'boot mapper init for A000h bank 3');

expectContains(unifiedGenerator, 'Loading routines switch P3/A000h to the target bank', 'A000 dynamic data-window policy');
expectContains(unifiedGenerator, 'function getFarCodeSlots', 'mapper-aware far-code slot policy');
expectContains(unifiedGenerator, 'return [{ orgAddress: 0x6000, endAddress: 0x8000, windowPage: 1 }];', 'Konami far code constrained away from A000 data window');
expectContains(unifiedGenerator, 'Data HL address uses (label & #1FFF) | #A000', 'A000 window-relative address formula');

expectContains(builder, 'validate_konami8k_megarom', 'Konami8K builder validation');
expectContains(builder, 'ROM size must be a multiple of 8192 bytes', '8KB ROM-size validation');
expectContains(builder, 'missing AB cartridge header', 'AB header validation');
expectContains(builder, 'banked data must use P3/A000h', 'P3 data-window validation');
expectContains(builder, 'resource_table addresses must be in A000h-BFFFh', 'resource table A000-BFFF validation');
expectContains(builder, 'far code must not execute from the A000h data window', 'far code A000 window validation');
expectContains(resourceArtifacts, "fileName: 'packing_manifest.json'", 'JSON packing manifest artifact');
expectContains(resourceArtifacts, "fileName: 'banks.json'", 'banks JSON pipeline artifact');
expectContains(resourceArtifacts, 'dataWindowPage: mapperWindow.dataWindowPage', 'manifest mapper data window metadata');
expectContains(resourceArtifacts, 'windowAddress', 'manifest resource window addresses');
expectContains(componentsGenerator, 'applyMapperDataWindowPage', 'component runtime data-window page remap');
expectContains(stateMachineGenerator, 'applyMapperDataWindowPage', 'state-machine runtime data-window page remap');
expectContains(componentsGenerator, "replace(/mapper_set_bank_p2/g, 'mapper_set_bank_p3')", 'component Konami P3 mutable-map access');
expectContains(stateMachineGenerator, "replace(/mapper_set_bank_p2/g, 'mapper_set_bank_p3')", 'state-machine Konami P3 mutable-map access');

if (failures.length > 0) {
  console.error('Konami 8K policy validation failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Konami 8K policy validation passed');
