#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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

const artifactBlock = (fileName, payload) => {
  const body = JSON.stringify(payload, null, 2)
    .split('\n')
    .map((line) => `; ${line}`)
    .join('\n');
  return `; [[[MIDEAS_ARTIFACT:${fileName}:BEGIN]]]\n${body}\n; [[[MIDEAS_ARTIFACT:${fileName}:END]]]`;
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
  }),
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
if ((feedback.largestAssets || [])[0]?.id !== 'world.screen.forest_00') {
  throw new Error(`Largest asset was not sorted first: ${JSON.stringify(feedback.largestAssets)}`);
}
if ((feedback.suggestedFixes || []).length < 2) {
  throw new Error(`Expected recommendation and recovery plan fixes: ${JSON.stringify(feedback.suggestedFixes)}`);
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

writeFileSync(join(outDir, 'result.json'), JSON.stringify({ feedback, pressure }, null, 2) + '\n', 'utf8');
console.log('MSX2 budget feedback helper checks passed.');
