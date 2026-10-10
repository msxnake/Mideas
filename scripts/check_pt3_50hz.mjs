import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const outfile = resolve('server/temp/pt3-tests/check_pt3_50hz.mjs');
await mkdir(resolve('server/temp/pt3-tests'), { recursive: true });
await build({ entryPoints: ['test/pt3/check_pt3_50hz.ts'], outfile, bundle: true, platform: 'node', format: 'esm',
  resolveExtensions: ['.tsx', '.ts', '.js'], logLevel: 'silent' });
await import(pathToFileURL(outfile).href);
