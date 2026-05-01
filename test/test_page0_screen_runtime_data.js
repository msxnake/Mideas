/**
 * Regression checks for plain48k page-0 screen runtime data packing.
 */

import fs from 'fs';

console.log('Page0 screen runtime data regression test\n');

const page0Source = fs.readFileSync('utils/msxGenerator/generators/page0Generator.ts', 'utf8');
const screensSource = fs.readFileSync('utils/msxGenerator/generators/screensGenerator.ts', 'utf8');
const unifiedSource = fs.readFileSync('utils/msxGenerator/generators/unifiedGenerator.ts', 'utf8');
const mainSource = fs.readFileSync('utils/msxGenerator/generators/mainGenerator.ts', 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

try {
  assert(
    page0Source.includes("`screenRuntime:${number}`"),
    'page0 groups must include per-screen runtime data ids'
  );
  assert(
    page0Source.includes('Screen Runtime Data') &&
      page0Source.includes('Auto-packed into page 0; copied to RAM during screen load.'),
    'page0 planner must describe screen runtime data packing'
  );
  assert(
    page0Source.includes('SCREEN_RUNTIME_DATA_ROM_DATA_GROUP: page0'),
    'page0 ASM must mark screen runtime data groups'
  );
  assert(
    screensSource.includes('screenRuntimeDataUsesPage0Group'),
    'screens generator must consult the page0 screen-runtime selection'
  );
  assert(
    screensSource.includes('call page0_copy_to_ram'),
    'screen loaders must copy page0 screen runtime data through the RAM-safe helper'
  );
  assert(
    screensSource.includes('emitted in page0.asm'),
    'screens generator must omit moved labels from the main #4000-#BFFF window'
  );
  assert(
    unifiedSource.includes('page0_copy_to_ram:') && mainSource.includes('page0_copy_to_ram:'),
    'both unified and modular plain48k scaffolds must define page0_copy_to_ram'
  );

  console.log('OK: plain48k can pack selected screen runtime data into page 0.');
  console.log('OK: screen loaders use page0_copy_to_ram instead of direct LDIR for moved data.');
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exit(1);
}
