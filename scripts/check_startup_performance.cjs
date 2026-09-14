const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { readFileSync, statSync } = require('node:fs');
const { resolve } = require('node:path');

// Run after vite build, against a preview server; deliberately block the Internet.
(async () => {
  const build = resolve(process.env.MIDEAS_BUILD_DIR || 'work/startup-performance-build');
  const manifest = JSON.parse(readFileSync(resolve(build, '.vite/manifest.json'), 'utf8'));
  const startup = new Set();
  function visit(key) {
    if (startup.has(key)) return;
    startup.add(key);
    for (const dependency of manifest[key].imports || []) visit(dependency);
  }
  visit('index.html');
  const startupBytes = [...startup].reduce((sum, key) => sum + statSync(resolve(build, manifest[key].file)).size, 0);
  assert(startupBytes < 1500000, `Startup JavaScript exceeded 1.5 MB: ${startupBytes}`);
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    const requests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => requests.push(request.url()));
    await page.route('https://**/*', route => route.abort());
    await page.goto(process.env.MIDEAS_UI_URL || 'http://127.0.0.1:5198/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'File', exact: true }).waitFor();
    assert(!requests.some(url => /(?:TileEditor|CodeExportModal|TrackerComposer)-/.test(url)), 'Tools loaded before use');
    const entry = manifest['utils/msxGenerator/index.ts'];
    assert(entry, 'Generator chunk missing from manifest');
    assert(!requests.some(url => url.endsWith(entry.file)), 'Generator loaded at startup');
    assert.equal(await page.locator('#root > div').first().evaluate(el => getComputedStyle(el).display), 'flex');
    await page.getByRole('button', { name: 'File', exact: true }).click();
    await page.getByText('New Project', { exact: true }).click();
    await page.locator('#projectNameInput').fill('Startup Performance Test');
    await page.getByRole('button', { name: 'Create Project', exact: true }).click();
    await page.getByRole('button', { name: 'Create New', exact: true }).click();
    await page.getByRole('button', { name: 'New Asset', exact: true }).click();
    await page.getByText('MSX1 Tile', { exact: true }).click();
    await page.waitForFunction(() => performance.getEntriesByType('resource').some(r => /TileEditor-.*\.js/.test(r.name)));
    await page.getByText('Cargando herramienta…', { exact: true }).waitFor({ state: 'hidden' });
    assert(!requests.some(url => url.endsWith(entry.file)), 'Creating a tile loaded the ROM generator');
    await page.screenshot({ path: resolve(build, 'tile-editor.png') });
    await page.getByRole('button', { name: 'File', exact: true }).click();
    await page.getByText('Export Z80 Code', { exact: true }).click();
    await page.getByRole('button', { name: 'Close', exact: true }).waitFor();
    assert(requests.some(url => /CodeExportModal-/.test(url)), 'Export did not load on demand');
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ startupBytes, passed: ['offline startup CSS', 'deferred editors and generator', 'new project', 'tile editor', 'export dialog', 'no browser exceptions'] }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
