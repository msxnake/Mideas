#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const tempRoot = join(repoRoot, 'server', 'temp');
mkdirSync(tempRoot, { recursive: true });
const outDir = mkdtempSync(join(tempRoot, 'msx2_budget_feedback_helper_'));
writeFileSync(join(outDir, 'package.json'), '{"type":"module"}\n', 'utf8');

const tscBin = process.platform === 'win32'
  ? join(repoRoot, 'node_modules', '.bin', 'tsc.cmd')
  : join(repoRoot, 'node_modules', '.bin', 'tsc');

execSync(
  `"${tscBin}" --pretty false --module ES2020 --target ES2020 --outDir "${outDir}" --moduleResolution node --skipLibCheck utils/msx2BudgetFeedback.ts`,
  {
    cwd: repoRoot,
    stdio: 'pipe',
  }
);

const nestedHelperModulePath = join(outDir, 'utils', 'msx2BudgetFeedback.js');
const flatHelperModulePath = join(outDir, 'msx2BudgetFeedback.js');
const helperModulePath = existsSync(nestedHelperModulePath) ? nestedHelperModulePath : flatHelperModulePath;
const {
  buildMsx2BudgetFeedbackFromAsm,
  summarizeMsx2BudgetPressure,
} = await import(pathToFileURL(helperModulePath).href);

const serverSource = readFileSync(join(repoRoot, 'server', 'server.js'), 'utf8');
const serverFeedbackStart = serverSource.indexOf('function extractMideasArtifactCommentBlock');
const serverFeedbackEnd = serverSource.indexOf('function isResourceTableRamZx0Candidate');
if (serverFeedbackStart < 0 || serverFeedbackEnd < serverFeedbackStart) {
  throw new Error('Could not locate server MSX2 budget feedback helper block');
}
const serverContext = {};
vm.runInNewContext(
  `${serverSource.slice(serverFeedbackStart, serverFeedbackEnd)}
this.buildMsx2IdeBudgetFeedbackFromAsm = buildMsx2IdeBudgetFeedbackFromAsm;
this.buildMsx2BudgetResolutionFailureContext = buildMsx2BudgetResolutionFailureContext;`,
  serverContext
);
const buildServerMsx2BudgetFeedbackFromAsm = serverContext.buildMsx2IdeBudgetFeedbackFromAsm;
if (typeof buildServerMsx2BudgetFeedbackFromAsm !== 'function') {
  throw new Error('Server MSX2 budget feedback helper was not evaluable');
}
const buildServerMsx2BudgetResolutionFailureContext = serverContext.buildMsx2BudgetResolutionFailureContext;
if (typeof buildServerMsx2BudgetResolutionFailureContext !== 'function') {
  throw new Error('Server MSX2 budget resolution failure helper was not evaluable');
}

const serverResidentFailureStart = serverSource.indexOf('function getNegativeDsOverflowBytes');
const serverResidentFailureEnd = serverSource.indexOf('function parsePlain48kPage0Diagnostics');
if (serverResidentFailureStart < 0 || serverResidentFailureEnd < serverResidentFailureStart) {
  throw new Error('Could not locate server MSX2 resident overflow helper block');
}
const serverResidentFailureContext = {};
vm.runInNewContext(
  `${serverSource.slice(serverResidentFailureStart, serverResidentFailureEnd)}
this.buildMsx2ResidentOverflowFailure = buildMsx2ResidentOverflowFailure;`,
  serverResidentFailureContext
);
const buildServerMsx2ResidentOverflowFailure = serverResidentFailureContext.buildMsx2ResidentOverflowFailure;
if (typeof buildServerMsx2ResidentOverflowFailure !== 'function') {
  throw new Error('Server MSX2 resident overflow helper was not evaluable');
}

const artifactBlock = (fileName, payload) => {
  const body = JSON.stringify(payload, null, 2)
    .split('\n')
    .map((line) => `; ${line}`)
    .join('\n');
  return `; [[[MIDEAS_ARTIFACT:${fileName}:BEGIN]]]\n${body}\n; [[[MIDEAS_ARTIFACT:${fileName}:END]]]`;
};

const worldBankManifest = {
  scope: 'msx2_screen4_world_bank_manifest',
  mapper: 'konami',
  bankSizeBytes: 8192,
  dataWindowAddress: '#A000',
  estimatedPhysicalBanks: [
    {
      bankIndex: 0,
      windowAddress: '#A000',
      bankSizeBytes: 8192,
      warningThresholdBytes: 7372,
      usedBytes: 7600,
      freeBytes: 592,
      usedPercent: 92.77,
      warning: true,
      overBudgetBytes: 0,
      status: 'warning',
      packages: [
        { id: 'world.screen.forest_00', usedBytes: 3600, recommendedBankClass: 'world.screen' },
        { id: 'world.graphics.sprites', usedBytes: 1800, recommendedBankClass: 'world.graphics.sprite' },
      ],
    },
  ],
  worlds: [
    {
      worldId: 'world_forest',
      estimatedBytes: 5400,
      estimated8kBanks: 1,
      packages: [
        {
          packageId: 'world.screen.forest_00',
          logicalSection: 'world screens',
          physicalBankIndex: 0,
          windowAddress: '#A000',
          storedBytes: 3600,
          rawBytes: 3600,
          decision: 'ROM_RAW',
        },
        {
          packageId: 'world.graphics.sprites',
          logicalSection: 'world graphics',
          physicalBankIndex: 0,
          windowAddress: '#A000',
          storedBytes: 1800,
          rawBytes: 1800,
          decision: 'ROM_RAW_TO_VRAM',
        },
      ],
    },
  ],
};

const asm = [
  '; synthetic MSX2 SCREEN 4 ASM',
  artifactBlock('project_slice.json', {
    scope: 'msx2_screen4_project_slice',
    projectName: 'budget_helper_fixture',
    backend: 'msx2-screen4-pattern',
    screenMode: 'SCREEN 4 (Graphics II)',
    romMode: 'megarom',
    mapper: 'konami',
    worldPackageSummary: [
      { worldId: 'world_forest', estimatedBytes: 4096 },
    ],
    worldBankManifest,
    includedRuntimeModules: [
      'runtime.msx2.boot',
      'runtime.msx2.mapper.konami8k',
    ],
    includedRuntimeModuleDetails: [
      {
        id: 'runtime.msx2.boot',
        placement: 'resident',
        reason: 'Required by every native MSX2 SCREEN 4 build',
      },
      {
        id: 'runtime.msx2.mapper.konami8k',
        placement: 'resident',
        reason: 'Enabled by Konami MegaROM data-bank mode',
      },
    ],
    excludedRuntimeModules: [
      {
        id: 'runtime.msx2.world_special_code',
        placement: 'world_specific',
        reason: 'No world-specific behavior is referenced',
      },
      {
        id: 'runtime.msx2.optional_far_code',
        placement: 'far_code',
        reason: 'No optional far-code runtime is referenced',
      },
    ],
  }),
  artifactBlock('msx2_world_bank_manifest.json', worldBankManifest),
  artifactBlock('logical_bank_budget.json', {
    bankSizeBytes: 8192,
    totalPayloadBytes: 7600,
    estimatedPackedBankCount: 1,
    warningThresholdBytes: 7372,
    warningPackedBanks: [
      { bankId: 'bank0', usedBytes: 7600 },
    ],
    packages: [
      { id: 'core.runtime', usedBytes: 1200, recommendedBankClass: 'core.runtime' },
      { id: 'world.screen.forest_00', usedBytes: 3600, recommendedBankClass: 'world.screen', warning: true },
      { id: 'world.graphics.sprites', usedBytes: 1800, recommendedBankClass: 'world.graphics.sprite' },
    ],
    bankClassSummary: [
      { id: 'core.runtime', usedBytes: 1200 },
      { id: 'world.screen', usedBytes: 3600 },
      { id: 'world.graphics.sprite', usedBytes: 1800 },
    ],
    overBudgetPackages: [],
    recoveryRecommendations: [
      {
        severity: 'info',
        target: 'world.graphics',
        reason: 'Recorded for parity with server response',
        action: 'No action needed',
      },
      {
        severity: 'warning',
        target: 'world.screen',
        reason: 'Bank is above warning threshold',
        action: 'Split the screen data into another world bank',
      },
    ],
    recoveryPlan: [
      {
        id: 'compress_world_screen',
        status: 'recommended',
        trigger: 'world.screen is near 8KB bank limit',
        action: 'Try ZX0 on screen maps',
        appliesTo: ['world.screen'],
      },
    ],
  }),
  artifactBlock('ram_budget.json', {
    start: '#C000',
    limit: '#F300',
    usedBytes: 1056,
    freeBytes: 12000,
    status: 'ok',
    sections: [
      { id: 'entities', bytes: 512 },
    ],
    recommendations: [],
  }),
].join('\n');

const feedback = buildMsx2BudgetFeedbackFromAsm(asm);
if (!feedback) {
  throw new Error('Expected MSX2 budget feedback from synthetic ASM');
}
if (feedback.status !== 'warning') {
  throw new Error(`Expected warning status, got ${feedback.status}`);
}
if (feedback.rom.payloadBytes !== 7600 || feedback.ram.freeBytes !== 12000) {
  throw new Error(`Unexpected ROM/RAM summary: ${JSON.stringify(feedback)}`);
}
if (feedback.rom.usedPercentOfSingleBank !== 92.77) {
  throw new Error(`Unexpected single-bank percentage: ${JSON.stringify(feedback.rom)}`);
}
if ((feedback.largestAssets || [])[0]?.id !== 'world.screen.forest_00') {
  throw new Error(`Largest asset was not sorted first: ${JSON.stringify(feedback.largestAssets)}`);
}
if ((feedback.suggestedFixes || []).length < 3) {
  throw new Error(`Expected recommendation and recovery plan fixes: ${JSON.stringify(feedback.suggestedFixes)}`);
}
if ((feedback.suggestedFixes || [])[0]?.severity !== 'info') {
  throw new Error(`Expected informational recovery recommendation to stay visible: ${JSON.stringify(feedback.suggestedFixes)}`);
}
if (feedback.runtimeModules?.includedCount !== 2 || feedback.runtimeModules?.residentCount !== 2) {
  throw new Error(`Expected runtime module placement summary: ${JSON.stringify(feedback.runtimeModules)}`);
}
if ((feedback.runtimeModules?.excluded || [])[0]?.placement !== 'world_specific') {
  throw new Error(`Expected excluded runtime module placement to stay visible: ${JSON.stringify(feedback.runtimeModules)}`);
}
if (
  feedback.worldBankManifest?.worldCount !== 1
  || feedback.worldBankManifest?.estimatedPhysicalBankCount !== 1
  || feedback.worldBankManifest?.packageCount !== 2
  || feedback.worldBankManifest?.warningBankCount !== 1
  || feedback.worldBankManifest?.overBudgetBankCount !== 0
) {
  throw new Error(`Expected world bank manifest summary: ${JSON.stringify(feedback.worldBankManifest)}`);
}
if (feedback.worldBankManifest?.dataWindowAddress !== '#A000') {
  throw new Error(`Expected world bank manifest data window to stay visible: ${JSON.stringify(feedback.worldBankManifest)}`);
}

const pressure = summarizeMsx2BudgetPressure(feedback);
if (pressure.residentCoreBytes !== 1200) {
  throw new Error(`Resident core pressure mismatch: ${JSON.stringify(pressure)}`);
}
if (pressure.worldContentBytes !== 5400) {
  throw new Error(`World content pressure mismatch: ${JSON.stringify(pressure)}`);
}

const noFeedback = buildMsx2BudgetFeedbackFromAsm('; no artifacts');
if (noFeedback !== null) {
  throw new Error('Expected null feedback for ASM without artifacts');
}
const serverFeedback = buildServerMsx2BudgetFeedbackFromAsm(asm);
if (JSON.stringify(feedback) !== JSON.stringify(serverFeedback)) {
  throw new Error(`Frontend/server MSX2 budget feedback mismatch:\nfrontend=${JSON.stringify(feedback, null, 2)}\nserver=${JSON.stringify(serverFeedback, null, 2)}`);
}
if (buildServerMsx2BudgetFeedbackFromAsm('; no artifacts') !== null) {
  throw new Error('Expected null server feedback for ASM without artifacts');
}
const serverResolutionContext = buildServerMsx2BudgetResolutionFailureContext({
  ...feedback,
  status: 'error',
  worldBankManifest: {
    ...feedback.worldBankManifest,
    overBudgetBankCount: 1,
  },
  largestAssets: [
    { id: 'world.screen.large', usedBytes: 9000, overBudgetBytes: 808 },
  ],
});
if (serverResolutionContext?.failedGateId !== 'bank_allocation_dry_run') {
  throw new Error(`Expected server resolution context to point at bank allocation: ${JSON.stringify(serverResolutionContext)}`);
}
if (serverResolutionContext.worldBankManifest?.overBudgetBankCount !== 1) {
  throw new Error(`Expected server resolution context to preserve world bank pressure: ${JSON.stringify(serverResolutionContext)}`);
}

const residentOverflowAsm = [
  '; Mideas MSX2 SCREEN 4 tile backend',
  '    org #4000',
  '; MSX2 SCREEN 4 cold data bank.',
  '    ds #C000 - $, #FF',
].join('\n');
const residentFailure = buildServerMsx2ResidentOverflowFailure(
  residentOverflowAsm,
  'Exception in thread "main" java.lang.IllegalArgumentException: Negative initial size: -213',
  'server/temp/synthetic_msx2.asm'
);
if (!residentFailure) {
  throw new Error('Expected server MSX2 resident overflow failure for synthetic Glass error');
}
if (residentFailure.scope !== 'msx2_screen4_megarom_compile_failure') {
  throw new Error(`Unexpected resident failure scope: ${JSON.stringify(residentFailure)}`);
}
if (residentFailure.overflowBytes !== 213) {
  throw new Error(`Unexpected resident overflow bytes: ${JSON.stringify(residentFailure)}`);
}
if ((residentFailure.pipelineGates || [])[0]?.status !== 'failed') {
  throw new Error(`Expected failed glass_compile gate: ${JSON.stringify(residentFailure.pipelineGates)}`);
}
if (!residentFailure.planB?.primary?.includes('Move cold read-only tables')) {
  throw new Error(`Expected Plan B guidance in resident failure: ${JSON.stringify(residentFailure.planB)}`);
}
if (buildServerMsx2ResidentOverflowFailure('; plain asm', 'Negative initial size: -12', 'plain.asm') !== null) {
  throw new Error('Expected null resident failure for non-MSX2 source');
}
if (buildServerMsx2ResidentOverflowFailure(residentOverflowAsm, 'all good', 'server/temp/synthetic_msx2.asm') !== null) {
  throw new Error('Expected null resident failure without Glass negative DS error');
}

writeFileSync(join(outDir, 'result.json'), JSON.stringify({ feedback, pressure, residentFailure }, null, 2) + '\n', 'utf8');
console.log('MSX2 budget feedback helper checks passed.');
