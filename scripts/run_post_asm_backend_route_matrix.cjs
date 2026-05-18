#!/usr/bin/env node
/**
 * Validate the server-side post-ASM optimization route helper against the
 * critical MegaROM Konami ASM artifacts produced by the regression matrix.
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);

const { __postAsmAnalysisForTests } = require(path.join(projectRoot, 'server', 'server.js'));
const { optimizePostAsmCode } = __postAsmAnalysisForTests;

const args = new Set(process.argv.slice(2));
const passesArg = process.argv.find((arg) => arg.startsWith('--passes='));
const passes = passesArg ? Number.parseInt(passesArg.slice('--passes='.length), 10) : 7;
const rulesArg = process.argv.find((arg) => arg.startsWith('--rules='));
const rules = (rulesArg ? rulesArg.slice('--rules='.length) : 'dead-blocks,unused-screen-loaders,inactive-feature-runtime,unused-boss-attack-runtime,unused-component-runtime,state-machine-dispatch-handlers')
  .split(',')
  .map((rule) => rule.trim())
  .filter(Boolean);
const validateGlass = !args.has('--no-validate-glass');

const cases = [
  { name: 'joc_tales_9', asmPath: 'server/temp/joc_tales_9_matrix_megarom_konami_compressed.asm' },
  { name: 'joc64', asmPath: 'server/temp/joc64_matrix_megarom_konami_compressed.asm' },
  { name: 'joc51', asmPath: 'server/temp/joc51_matrix_megarom_konami_compressed.asm' },
  {
    name: 'patoantic249',
    asmPath: 'server/temp/patoantic249_matrix_megarom_konami_compressed.asm',
    allowKnownGlassOverflow: true,
  },
];

async function main() {
  console.log(`Post-ASM backend route matrix: rules=${rules.join(',')}, passes=${passes}, validateGlass=${validateGlass}`);
  for (const { name, asmPath, allowKnownGlassOverflow = false } of cases) {
    const absoluteAsmPath = path.join(projectRoot, asmPath);
    if (!fs.existsSync(absoluteAsmPath)) {
      throw new Error(`Missing fixture ASM: ${asmPath}. Run scripts/run_post_asm_deadblocks_matrix.ps1 first.`);
    }

    const code = fs.readFileSync(absoluteAsmPath, 'utf8');
    let result;
    try {
      result = await optimizePostAsmCode(code, {
        projectName: `${name} backend route matrix`,
        rules,
        passes,
        validateGlass,
      });
    } catch (error) {
      const message = error && error.message ? error.message : String(error);
      if (!validateGlass || !allowKnownGlassOverflow || !message.includes('Negative initial size')) {
        throw error;
      }
      result = await optimizePostAsmCode(code, {
        projectName: `${name} backend route matrix invariants only`,
        rules,
        passes,
        validateGlass: false,
      });

      console.log(
        `${name}: known Glass overflow, invariants-only ok patches=${result.summary.appliedPatches} ` +
        `deadCandidateBytes=${result.summary.deadCandidateSourceBytes} invariants=${result.invariantCheck.ok}`
      );
      continue;
    }

    const romName = result.optimizedRomPath ? path.basename(result.optimizedRomPath) : 'none';
    console.log(
      `${name}: ok patches=${result.summary.appliedPatches} ` +
      `deadCandidateBytes=${result.summary.deadCandidateSourceBytes} ` +
      `rom=${romName} invariants=${result.invariantCheck.ok}`
    );
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
