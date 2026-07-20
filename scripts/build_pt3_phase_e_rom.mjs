#!/usr/bin/env node
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = join(repoRoot, 'server', 'temp', 'pt3-tests');
const outputFile = join(outputDir, 'build_pt3_phase_e_rom.mjs');
await mkdir(outputDir, { recursive: true });
await build({
  entryPoints: [join(repoRoot, 'test', 'pt3', 'build_pt3_phase_e_rom.ts')],
  outfile: outputFile,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  logLevel: 'silent',
});
await import(`${pathToFileURL(outputFile).href}?v=${Date.now()}`);
