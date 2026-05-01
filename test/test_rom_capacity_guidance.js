/**
 * Regression checks for ROM-capacity guidance.
 *
 * A simple32k overflow can suggest Plain 48KB only as a candidate, because the
 * regenerated plain48k ASM may have a different layout and final size.
 */

import fs from 'fs';
import { createRequire } from 'module';

console.log('ROM capacity guidance regression test\n');

const serverSource = fs.readFileSync('server/server.js', 'utf8');
const modalSource = fs.readFileSync('components/modals/CodeExportModal.tsx', 'utf8');
const require = createRequire(import.meta.url);
const { __romCapacityForTests } = require('../server/server.js');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

try {
  const {
    SIMPLE_ROM_LIMIT_BYTES,
    PLAIN48_ROM_LIMIT_BYTES,
    buildRomCapacitySuggestion,
    buildRomCapacityDetails,
    parsePlain48kPage0Diagnostics,
    formatPlain48kPage0Diagnostic,
    getNegativeDsOverflowBytes,
    isGlassRomCapacityError,
  } = __romCapacityForTests;

  assert(SIMPLE_ROM_LIMIT_BYTES === 32768, 'Simple ROM limit must stay at 32KB');
  assert(PLAIN48_ROM_LIMIT_BYTES === 49152, 'Plain ROM limit must stay at 48KB');

  const simpleOverflowCandidate = buildRomCapacitySuggestion('simple32k', 'konami', false, true);
  assert(simpleOverflowCandidate.romMode === 'plain48k', '32KB overflow within 48KB should suggest plain48k');
  assert(simpleOverflowCandidate.validationStatus === 'candidate', 'plain48k suggestion must be candidate-only');
  assert(simpleOverflowCandidate.label === 'Validate Plain 48KB ROM', 'plain48k label must describe validation');
  assert(simpleOverflowCandidate.autoMegaROM === false, 'plain48k candidate must not enable MegaROM automatically');
  assert(simpleOverflowCandidate.mapperActive === false, 'plain48k candidate must display mapper as inactive');

  const simpleOverflowTooLarge = buildRomCapacitySuggestion('simple32k', 'konami', false, false);
  assert(simpleOverflowTooLarge.romMode === 'megarom', '32KB overflow beyond 48KB should suggest MegaROM');
  assert(simpleOverflowTooLarge.validationStatus === 'required', 'MegaROM suggestion should be marked required');
  assert(simpleOverflowTooLarge.autoMegaROM === true, 'MegaROM suggestion must enable autoMegaROM');
  assert(simpleOverflowTooLarge.mapperActive === true, 'MegaROM suggestion must display mapper as active');

  const plainOverflow = buildRomCapacitySuggestion('plain48k', 'konami', false, false);
  assert(plainOverflow.romMode === 'megarom', 'plain48k overflow must go to MegaROM');
  assert(plainOverflow.reason.includes('48KB'), 'plain48k overflow reason must mention 48KB');

  assert(buildRomCapacitySuggestion('megarom', 'konami', true, false) === null, 'MegaROM failure must not suggest another ROM mode');
  assert(
    buildRomCapacityDetails('megarom', false, 1959).includes('MegaROM build failed'),
    'MegaROM capacity details must report MegaROM failure'
  );

  const plain48kPage0Info = parsePlain48kPage0Diagnostics(`
; ROM Mode: plain48k
; Linear48K Page0 Data: Yes
; Budget: 16384 bytes
; Used: 6144 bytes
; Remaining: 10240 bytes
; Selected groups:
; - Screen data: 4096 bytes [page0-safe] direct indexed loader
; - Font data: 2048 bytes [page0-safe] copied through safe helper
; Skipped groups:
; - Boss runtime: 3072 bytes [code] calls from main window
; - Entity tables: 1024 bytes [mutable] RAM-owned
`);
  assert(plain48kPage0Info !== null, 'plain48k page0 diagnostics must be parsed from generated ASM');
  assert(plain48kPage0Info.linearPage0Data === 'Yes', 'page0 linear-data marker must be preserved');
  assert(plain48kPage0Info.budgetBytes === 16384, 'page0 budget must be parsed');
  assert(plain48kPage0Info.usedBytes === 6144, 'page0 used bytes must be parsed');
  assert(plain48kPage0Info.remainingBytes === 10240, 'page0 remaining bytes must be parsed');
  assert(plain48kPage0Info.selectedGroups.length === 2, 'selected page0 groups must be listed');
  assert(plain48kPage0Info.skippedGroups.length === 2, 'skipped page0 groups must be listed');
  assert(plain48kPage0Info.skippedGroups[0].label === 'Boss runtime', 'skipped page0 group labels must be parsed');

  const page0Diagnostic = formatPlain48kPage0Diagnostic(plain48kPage0Info, 1959);
  assert(page0Diagnostic.includes('restricted page-0 packing'), 'page0 diagnostic must explain page0 restrictions');
  assert(page0Diagnostic.includes('#0000-#3FFF'), 'page0 diagnostic must mention the low page target');
  assert(page0Diagnostic.includes('Main #4000-#BFFF overflow'), 'page0 diagnostic must mention the main ROM window overflow');
  assert(page0Diagnostic.includes('Boss runtime'), 'page0 diagnostic must list skipped groups');
  assert(
    buildRomCapacityDetails('plain48k', false, 1959, plain48kPage0Info).includes('restricted page-0 packing'),
    'plain48k capacity details must include page0 diagnostics when available'
  );

  assert(getNegativeDsOverflowBytes('Negative initial size: -1959') === 1959, 'Negative DS overflow must be parsed as positive bytes');
  assert(isGlassRomCapacityError('Exception: Negative initial size: -1959'), 'Negative initial size must be treated as capacity error');

  assert(serverSource.includes("validationStatus: 'candidate'"), 'Plain 48KB suggestion must be marked as candidate');
  assert(serverSource.includes("label: 'Validate Plain 48KB ROM'"), 'Plain 48KB action must use validation wording');
  assert(
    serverSource.includes('Plain 48KB is only a candidate') ||
      serverSource.includes('Plain 48KB is a candidate only'),
    'Server response must not imply Plain 48KB is guaranteed'
  );
  assert(
    serverSource.includes('must regenerate and compile') ||
      serverSource.includes('must be compiled before OpenMSX'),
    'Server response must state that 48KB needs a checked rebuild before OpenMSX'
  );

  assert(
    modalSource.includes("suggested.validationStatus === 'candidate'") ||
      modalSource.includes("suggestedRomConfig?.validationStatus === 'candidate'"),
    'UI must render candidate-specific guidance'
  );
  assert(
    modalSource.includes('Plain 48KB is not guaranteed here'),
    'UI must explicitly say Plain 48KB is not guaranteed'
  );
  assert(
    modalSource.includes("suggested.mapperActive === false ? 'none'") ||
      modalSource.includes("suggestedRomConfig.mapperActive === false ? 'none'"),
    'UI must display mapper=none for non-mapped suggested builds'
  );
  assert(
    modalSource.includes('the valid path is MegaROM'),
    'UI must explain the fallback after a failed checked 48KB build'
  );
  assert(
    modalSource.includes('Build blocked, run skipped'),
    'Build & Run must not report completion when ROM mode blocks the build'
  );
  assert(
    modalSource.includes('build failed or ROM mode was blocked before a valid ROM was produced'),
    'Build & Run skipped summary must explain that no valid ROM was produced'
  );
  assert(
    modalSource.includes('Plain48K page 0 packing'),
    'UI must show page0 packing details for failed plain48k builds'
  );
  assert(
    modalSource.includes('Page 0 is restricted to data groups with safe access routines'),
    'UI must explain why page0 cannot hold arbitrary code/data'
  );
  assert(
    modalSource.includes('#4000-#BFFF'),
    'UI must name the constrained main ROM window'
  );
  assert(
    modalSource.includes('selectedGroups') && modalSource.includes('skippedGroups'),
    'UI must list selected and skipped page0 groups'
  );
  assert(
    modalSource.includes('plain48kPage0Info: result.plain48kPage0Info'),
    'UI error adapter must preserve backend page0 diagnostics'
  );
  assert(
    modalSource.includes('negativeDsOverflowBytes: result.negativeDsOverflowBytes'),
    'UI error adapter must preserve overflow byte diagnostics'
  );

  console.log('OK: Plain 48KB overflow guidance is candidate-only.');
  console.log('OK: Plain 48KB page0 packing diagnostics are visible.');
  console.log('OK: UI explains that 48KB must be regenerated and checked before OpenMSX.');
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exit(1);
}
