#!/usr/bin/env node
// Exercise the real editor in an isolated browser, without changing a user's project.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('../', import.meta.url));
const bundle = await build({
  stdin: { resolveDir: repo, loader: 'tsx', contents: `
    import React, { useState } from 'react';
    import { createRoot } from 'react-dom/client';
    import { Msx2EnemyBehaviorEditor } from './components/editors/Msx2EnemyBehaviorEditor';
    import { createMsx2EnemyBehavior } from './utils/msx2EnemyBehavior';
    const assets = [{ id: 'room', name: 'Test room', type: 'msx2bitmaproom', data: {
      collision: [[0]], tileGrid: [[1]],
      atlas: { entries: [{ sx: 0, sy: 0, w: 16, h: 16 }], pixels: [[1]] },
      palette: [{ slotIndex: 1, hex: '#ffffff' }],
    } }];
    window.paintCount = 0;
    const encode = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(...args) {
      window.paintCount++; return encode.apply(this, args);
    };
    function Harness() {
      const [behavior, update] = useState(() => {
        const value = createMsx2EnemyBehavior('test', 'Test', 'floater');
        value.path = { screenId: 'room', nodes: [] };
        if (location.search.includes('unknown')) {
          value.states[0].rules[0].condition = 'UNKNOWN_CONDITION';
          value.states[0].rules[0].action = 'UNKNOWN_ACTION';
        }
        return value;
      });
      window.currentBehavior = behavior;
      return <Msx2EnemyBehaviorEditor behavior={behavior} onUpdate={update} allAssets={assets} />;
    }
    createRoot(document.getElementById('root')).render(<Harness />);
  ` },
  bundle: true, write: false, format: 'iife', platform: 'browser', logLevel: 'silent',
});
const server = createServer((req, res) => {
  if (req.url === '/app.js') {
    res.setHeader('Content-Type', 'text/javascript');
    res.end(bundle.outputFiles[0].text);
  } else {
    res.setHeader('Content-Type', 'text/html');
    res.end('<!doctype html><html><body><div id="root"></div><script src="/app.js"></script></body></html>');
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('dialog', dialog => dialog.accept());
  const url = `http://127.0.0.1:${server.address().port}`;
  await page.goto(url);
  const gravity = page.getByRole('checkbox', { name: /Falls with gravity/ });
  await gravity.waitFor();
  assert.equal(await gravity.isChecked(), false);
  assert.equal(await page.evaluate(() => window.paintCount), 0, 'Rules must not paint the hidden Path preview');
  await page.locator('select').filter({ has: page.locator('option[value="walker"]') }).selectOption('walker');
  await page.getByRole('button', { name: 'Replace', exact: true }).click();
  await page.waitForFunction(() => window.currentBehavior.gravity === true);
  assert.equal(await gravity.isChecked(), true, 'Walker must restore gravity after Floater');
  console.log('OK: Floater -> Walker restores gravity; Rules skips hidden preview painting');

  await page.getByRole('button', { name: 'Path', exact: true }).click();
  await page.waitForFunction(() => window.paintCount > 0);
  console.log('OK: opening Path still paints the room preview');

  await page.goto(`${url}/?unknown`);
  await page.getByRole('heading', { name: 'Errors', exact: true }).waitFor();
  await page.locator('select').filter({ has: page.locator('option[value="UNKNOWN_CONDITION"]') }).selectOption('AT_MIN_Y');
  await page.locator('select').filter({ has: page.locator('option[value="UNKNOWN_ACTION"]') }).selectOption('DESCEND');
  await page.getByRole('heading', { name: 'Errors', exact: true }).waitFor({ state: 'detached' });
  assert.deepEqual(errors, [], 'The editor must remain usable with unknown opcodes');
  console.log('OK: unknown conditions/actions show diagnostics and can be repaired in the editor');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
