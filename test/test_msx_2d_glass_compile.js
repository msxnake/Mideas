/**
 * Compile the canonical MSX 2D minimal ASM fixtures with glass.jar.
 *
 * This test intentionally checks stderr/stdout text as well as output files:
 * some Glass failures can surface as Java exceptions without a reliable wrapper
 * exit code in local environments.
 */

import fs from 'fs';
import path from 'path';
import { execFileSync, spawnSync } from 'child_process';

const root = process.cwd();
const asmOutDir = path.join(root, 'server', 'temp', 'msx2d_minimal');

execFileSync(process.execPath, ['test/test_msx_2d_minimal_generation.js'], {
  cwd: root,
  stdio: 'pipe',
});

const asmFiles = fs.readdirSync(asmOutDir)
  .filter(file => file.endsWith('.asm'))
  .sort();

const failures = [];

function padRomTo8k(filePath) {
  const size = fs.statSync(filePath).size;
  const remainder = size % 8192;
  if (remainder === 0) return size;

  const padding = Buffer.alloc(8192 - remainder, 0xFF);
  fs.appendFileSync(filePath, padding);
  return size + padding.length;
}

for (const asmFile of asmFiles) {
  const source = path.join(asmOutDir, asmFile);
  const output = source.replace(/\.asm$/i, '.rom');

  fs.rmSync(output, { force: true });

  const result = spawnSync('python', [
    'scripts/compile_glass.py',
    '--source', source,
    '--output', output,
    '--project-root', '.',
  ], {
    cwd: root,
    encoding: 'utf8',
  });

  const combinedOutput = `${result.stdout || ''}\n${result.stderr || ''}`;
  const hasException = /Exception in thread|ArgumentException|Undefined symbol/i.test(combinedOutput);
  const hasRom = fs.existsSync(output) && fs.statSync(output).size > 0;

  if (result.status !== 0 || hasException || !hasRom) {
    failures.push(`${asmFile}: glass failed or did not produce ROM\n${combinedOutput.trim()}`);
    continue;
  }

  const paddedSize = padRomTo8k(output);
  if (paddedSize % 8192 !== 0) {
    failures.push(`${asmFile}: ROM is not 8KB aligned after padding (${paddedSize} bytes)`);
  }
}

if (failures.length > 0) {
  console.error('MSX 2D Glass compile failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`MSX 2D Glass compile passed (${asmFiles.length} ROMs)`);
