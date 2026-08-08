import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const server = fs.readFileSync(path.join(root, 'server', 'server.js'), 'utf8');
const require = createRequire(import.meta.url);
const { __zx0PolicyForTests } = require(path.join(root, 'server', 'server.js'));
const soundGenerator = fs.readFileSync(
  path.join(root, 'utils', 'msxGenerator', 'generators', 'soundGenerator.ts'),
  'utf8',
);

const checks = [
  [
    'ZX0 does not select external PT3 SOUND_DATA/MUSIC_TRACK blocks',
    !__zx0PolicyForTests.isResourceTableRamZx0Candidate({ type: 'MUSIC_TRACK' }) &&
      !__zx0PolicyForTests.isResourceTableRamZx0Candidate({ type: 'SOUND_DATA' }) &&
      /if \(type === 'MUSIC_TRACK' \|\| type === 'SOUND_DATA'\) \{\s*return false;/s.test(server),
  ],
  [
    'PT3 MegaROM data emits bank 0 labels',
    /const blockLabel = `pt3_track_\$\{trackIndex\}_bank_\$\{blockIndex\}`/.test(soundGenerator),
  ],
  [
    'PT3 MegaROM data emits bank 1 labels',
    /const blockCount = targetFormat === 'ascii16' \? 1 : 2/.test(soundGenerator),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([name]) => name);
if (failed.length > 0) {
  console.error(failed.map((name) => `FAIL: ${name}`).join('\n'));
  process.exit(1);
}

console.log(`External PT3 MegaROM contract OK (${checks.length} checks)`);
