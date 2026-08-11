#!/usr/bin/env node
// Bundles and runs the TypeScript generator, which needs the factory PT3
// instrument kit from utils/audio. Same wrapper pattern as scripts/check_pt3_*.
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = join(repoRoot, 'server', 'temp', 'pt3-tests');
const outputFile = join(outputDir, 'create_msx2_ghost_riders_demo.mjs');
await mkdir(outputDir, { recursive: true });
await build({
  entryPoints: [join(repoRoot, 'scripts', 'create_msx2_ghost_riders_demo.ts')],
  outfile: outputFile,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  logLevel: 'silent',
});
await import(`${pathToFileURL(outputFile).href}?v=${Date.now()}`);
