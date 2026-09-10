import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import { chromium } from 'playwright';

// Compare real Canvas output with the editor before this optimization.
// SCREEN5_BASE_REF can override the pinned baseline for future intentional changes.
const editorPath = 'components/editors/Msx2BitmapScreenEditor.tsx';
const baseline = execFileSync('git', ['show', `${process.env.SCREEN5_BASE_REF || '1f7c3cacb84eb70f5ac4ad8a5bc6d4fe24cebdac'}:${editorPath}`], { encoding: 'utf8' });
const project = JSON.parse(readFileSync('test/msx2-boss/fixture_boss_dark_room.json', 'utf8'));
const initialRoom = project.assets.find(asset => asset.type === 'msx2bitmaproom').data;
// The boss fixture is intentionally blank; add a patterned atlas and overlapping
// commands so stale cache entries and changed copy/fill ordering are visible.
initialRoom.atlas = {
  width: 256, height: 128,
  pixels: Array.from({ length: 128 }, (_, y) => Array.from({ length: 256 }, (_, x) => (x + y) % 16)),
  entries: [{ id: 'test-tile', name: 'Test tile', sx: 0, sy: 0, w: 16, h: 16 }],
};
initialRoom.composition = { source: 'authored', commands: [
  { op: 'fill', x: 0, y: 0, w: 256, h: 192, color: 4 },
  { op: 'copy', atlasEntryId: 'test-tile', dx: 32, dy: 32, w: 16, h: 16 },
  { op: 'copy', atlasEntryId: 'test-tile', dx: 64, dy: 176, w: 16, h: 16 },
] };
initialRoom.collision = Array.from({ length: 12 }, (_, y) => Array.from({ length: 16 }, (_, x) => x === y ? 1 : 0));
initialRoom.collisionShape = Array.from({ length: 12 }, () => Array(16).fill(3));

async function bundle(old) {
  const result = await build({
    stdin: { contents: `
      import React from 'react';
      import { createRoot } from 'react-dom/client';
      import { Msx2BitmapScreenEditor } from './${editorPath}';
      const assets = ${JSON.stringify(project.assets)};
      function Harness() {
        const [room, setRoom] = React.useState(${JSON.stringify(initialRoom)});
        const update = React.useCallback(patch => setRoom(current => ({...current, ...patch})), []);
        window.patchRoom = update;
        window.room = room;
        return <Msx2BitmapScreenEditor room={room} allAssets={assets} onUpdate={update} />;
      }
      createRoot(document.getElementById('root')).render(<Harness />);
    `, resolveDir: process.cwd(), loader: 'tsx' },
    bundle: true, write: false, format: 'iife', platform: 'browser',
    define: { 'process.env.NODE_ENV': '"production"' },
    loader: { '.png': 'dataurl' }, logLevel: 'silent',
    plugins: old ? [{ name: 'baseline', setup(b) {
      b.onLoad({ filter: /Msx2BitmapScreenEditor\.tsx$/ }, () => ({ contents: baseline, loader: 'tsx', resolveDir: resolve('components/editors') }));
    } }] : [],
  });
  return result.outputFiles[0].text;
}

const browser = await chromium.launch({ headless: true });
try {
  const results = [];
  for (const old of [true, false]) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('http://screen5.test/', route => route.fulfill({ contentType: 'text/html', body: '<div id="root"></div>' }));
    await page.goto('http://screen5.test/');
    await page.evaluate(() => {
      window.fillCalls = 0;
      const fill = CanvasRenderingContext2D.prototype.fillRect;
      CanvasRenderingContext2D.prototype.fillRect = function (...args) { window.fillCalls++; return fill.apply(this, args); };
    });
    await page.addScriptTag({ content: await bundle(old) });
    await page.waitForFunction(() => window.patchRoom && document.querySelector('canvas[width="512"]'));
    const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const snapshot = () => page.evaluate(() => {
      const canvas = [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height)[0];
      return canvas.toDataURL();
    });
    const shots = [];
    await settle();
    shots.push(await snapshot());
    await page.evaluate(() => { window.fillCalls = 0; window.patchRoom({ name: 'Metadata edit' }); });
    await settle();
    const metadataFills = await page.evaluate(() => window.fillCalls);
    shots.push(await snapshot());
    await page.getByRole('button', { name: 'Select', exact: true }).click();
    await settle();
    await page.evaluate(() => { window.fillCalls = 0; });
    await page.locator('canvas[width="512"]').click({ position: { x: 72, y: 72 } });
    await settle();
    const selectionFills = await page.evaluate(() => window.fillCalls);
    shots.push(await snapshot());
    for (const name of ['Pincel', 'Borrador']) {
      await page.getByRole('button', { name, exact: true }).click();
      await page.locator('canvas[width="512"]').click({ position: { x: 104, y: 104 } });
      await settle();
      shots.push(await snapshot());
    }
    await page.evaluate(() => {
      const palette = window.room.palette.map(slot => ({ ...slot }));
      palette[2] = { ...palette[2], masterIndex: 511, hex: '#FFFFFF' };
      window.patchRoom({ palette });
    });
    await settle();
    shots.push(await snapshot());
    await page.evaluate(() => {
      const atlas = window.room.atlas;
      window.patchRoom({ atlas: { ...atlas, pixels: atlas.pixels.map(row => row.map(() => 2)) } });
    });
    await settle();
    shots.push(await snapshot());
    // Repaint only the overlays on top of the cached background.
    for (let layer = 0; layer < 4; layer++) {
      await page.getByTitle('Toggle visibility', { exact: true }).nth(layer).click();
      await settle();
      shots.push(await snapshot());
      await page.getByTitle('Toggle visibility', { exact: true }).nth(layer).click();
      await settle();
    }
    await page.getByTitle('Zoom in', { exact: true }).click();
    await settle();
    shots.push(await snapshot());
    await page.getByTitle('Zoom out', { exact: true }).click();
    await settle();
    for (const patch of [
      { backgroundColor: 3 },
      { height: 212 },
      { composition: { source: 'authored', commands: [
        { op: 'fill', x: 0, y: 0, w: 256, h: 212, color: 2 },
        { op: 'lineH', x: 4, y: 100, length: 100, color: 5 },
        { op: 'lineV', x: 80, y: 4, length: 180, color: 6 },
      ] } },
    ]) {
      await page.evaluate(patch => window.patchRoom(patch), patch);
      await settle();
      shots.push(await snapshot());
    }
    await page.getByTitle('Toggle grid', { exact: true }).click();
    await settle();
    shots.push(await snapshot());
    assert.deepEqual(errors, [], 'No browser exceptions');
    results.push({ shots, metadataFills, selectionFills });
    await page.close();
  }
  assert.deepEqual(results[1].shots, results[0].shots, 'Pixel-identical output, including the existing 192-line composition / 212-line canvas');
  assert.ok(results[1].metadataFills < results[0].metadataFills / 10, 'Metadata edits reuse the visual background');
  assert.ok(results[1].selectionFills < results[0].selectionFills / 10, 'Cell selection reuses the visual background');
  console.log(`PASS: ${results[1].shots.length} Canvas comparisons; metadata edit fillRect calls ${results[0].metadataFills} -> ${results[1].metadataFills}; selection ${results[0].selectionFills} -> ${results[1].selectionFills}`);
} finally {
  await browser.close();
}
