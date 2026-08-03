#!/usr/bin/env node
/**
 * Builds the fixture for the MIXED route: a SCREEN 5 presentation intro that
 * hands off to a SCREEN 4 tile runtime in the same ROM.
 *
 * That route had no fixture, so `generateMixedScreen5ToScreen4UnitedFiles()` —
 * the one place in the generator that rewrites already-generated ASM with
 * regexes — was the only path not covered by the byte-identical harness.
 *
 * Composition:
 *   - the SCREEN 4 raster-bricks project (tile screen + `screen4-runtime` flow)
 *   - the presentation asset from the SCREEN 5 fixture
 *   - a second flow named "Main MSX2" so it wins backend resolution, holding
 *     Start -> Screen5Presentation -> End
 *
 * The intro must reach End directly: `resolvePresentationChain()` only accepts a
 * Transition after a scene when ANOTHER Screen5Presentation follows it, so
 * `Screen5Presentation -> Transition -> End` is not a chain and would silently
 * fall through to the plain presentation backend.
 *
 * Regenerate with: node scripts/create_msx2_mixed_screen5_screen4_fixture.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (...parts) => JSON.parse(readFileSync(join(root, ...parts), 'utf8'));

const screen4Project = readJson('test', 'msx2-screen4', 'raster-bricks', 'msx2-raster-bricks-project.json');
const presentationProject = readJson('test', 'msx2-screen5-presentation', 'presentation_screen5_project.json');

const presentationAsset = presentationProject.assets.find(asset => asset.type === 'msx2presentation');
if (!presentationAsset) throw new Error('No msx2presentation asset in the SCREEN 5 fixture.');

const screen4Flow = screen4Project.assets.find(asset => asset.type === 'msx2gameflow');
if (!screen4Flow) throw new Error('No msx2gameflow asset in the raster-bricks fixture.');

// Fixed ids and positions: the fixture must be byte-stable across regenerations
// or the harness baseline would drift for reasons that have nothing to do with
// the generator.
const introFlow = {
  id: 'gf_mixed_screen5_intro',
  name: 'Main MSX2',
  target: 'MSX2',
  purpose: 'screen5',
  startNodeId: 'mixed_start',
  panOffset: { x: 0, y: 0 },
  zoomLevel: 1,
  nodes: [
    { id: 'mixed_start', type: 'Start', position: { x: 60, y: 90 } },
    {
      id: 'mixed_presentation',
      type: 'Screen5Presentation',
      position: { x: 290, y: 90 },
      presentationAssetId: presentationAsset.id,
      waitForKey: true,
      waitFrames: 0,
    },
    { id: 'mixed_end', type: 'End', position: { x: 520, y: 90 } },
  ],
  connections: [
    { id: 'mixed_c1', from: { nodeId: 'mixed_start' }, to: { nodeId: 'mixed_presentation' } },
    { id: 'mixed_c2', from: { nodeId: 'mixed_presentation' }, to: { nodeId: 'mixed_end' } },
  ],
};

// The SCREEN 4 flow must NOT be called "Main MSX2": backend resolution picks
// that name first, and the mixed route is entered from the SCREEN 5 side.
const screen4RuntimeFlow = {
  ...screen4Flow,
  name: 'SCREEN 4 Runtime',
  data: { ...screen4Flow.data, name: 'SCREEN 4 Runtime', purpose: 'screen4' },
};

const fixture = {
  ...screen4Project,
  name: 'msx2_mixed_screen5_screen4',
  // The presentation intro runs first, so the project opens in SCREEN 5.
  screenMode: 'SCREEN 5 (Graphics III)',
  currentScreenMode: 'SCREEN 5 (Graphics III)',
  targetGraphicsBackend: 'screen5',
  assets: [
    ...screen4Project.assets.filter(asset => asset.type !== 'msx2gameflow'),
    screen4RuntimeFlow,
    { id: presentationAsset.id, name: presentationAsset.name, type: 'msx2presentation', data: presentationAsset.data },
    { id: introFlow.id, name: introFlow.name, type: 'msx2gameflow', data: introFlow },
  ],
};

const outDir = join(root, 'test', 'msx2-mixed');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'mixed_screen5_screen4_project.json');
writeFileSync(outPath, `${JSON.stringify(fixture, null, 2)}\n`);
console.log(`Wrote ${outPath}`);
console.log(`  assets: ${fixture.assets.map(asset => asset.type).join(', ')}`);
