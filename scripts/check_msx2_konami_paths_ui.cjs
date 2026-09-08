const { chromium } = require('playwright');
const { readFileSync, mkdirSync } = require('node:fs');
const assert = require('node:assert/strict');

(async () => {
  const project = JSON.parse(readFileSync('test/msx2-boss/fixture_boss_dark_room.json', 'utf8'));
  project.assets.push({ id: 'konami_sine', name: 'Konami sine speed test', type: 'msx2bosspath', data: {
    id: 'konami_sine', name: 'Konami sine speed test', bakeMode: 'fixed', speedPxPerTick: 2, loopMode: 'loop', firing: 'auto',
    nodes: [{ id: 'a', x: 32, y: 70, actions: [], segment: { mode: 'sine', amplitude: 24, frequency: 1, speedStart: 1, speedEnd: 8 } },
      { id: 'b', x: 208, y: 70, actions: [] }],
  } });
  const room = project.assets.find(a => a.type === 'msx2bitmaproom');
  room.data.entities = [{ id: 'enemy_test', name: 'Konami Test Enemy', kind: 'enemy', position: { x: 4, y: 4 },
    components: { msx2_movement: { mode: 'patrolX', minX: 0, maxX: 200, boundsUnit: 'px' } }, params: { movement: 'patrolX' } }];
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.addInitScript(project => {
      localStorage.setItem('mideas_recent_projects', JSON.stringify([{ name: 'Konami UI Test', path: 'konami_ui.json', lastOpened: Date.now() }]));
      localStorage.setItem('mideas_recent_projects_data', JSON.stringify({ 'konami_ui.json': JSON.stringify(project) }));
    }, project);
    await page.goto(process.env.MIDEAS_UI_URL || 'http://127.0.0.1:5199/', { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.getByRole('button', { name: 'File', exact: true }).click();
    await page.getByText('Open Recent', { exact: true }).click();
    await page.getByText('Konami UI Test', { exact: true }).click();
    await page.getByRole('button', { name: 'Expand All' }).click();
    await page.getByText('Konami sine speed test', { exact: true }).first().click();
    const start = page.getByText('Start spacing (px/frame)', { exact: true }).locator('input');
    await start.fill('2');
    await page.getByRole('button', { name: 'Play path (60 Hz)', exact: true }).click();
    await page.waitForTimeout(250);
    assert(Number(await page.getByRole('slider', { name: 'Preview frame' }).inputValue()) > 0);
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.getByRole('button', { name: 'Edit frame positions', exact: true }).click();
    const dot = page.locator('[title^="Frame 5:"]');
    const before = await dot.getAttribute('title');
    const box = await dot.boundingBox();
    await page.mouse.move(box.x + 2, box.y + 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 18, box.y + 12, { steps: 4 });
    await page.mouse.up();
    assert.notEqual(await dot.getAttribute('title'), before, 'dragging must persist a different frame position');
    mkdirSync('server/temp/konami-check', { recursive: true });
    await page.screenshot({ path: 'server/temp/konami-check/editor.png' });
    await page.getByRole('button', { name: 'Expand All' }).click();
    await page.getByText(room.name, { exact: true }).first().click();
    await page.getByRole('button', { name: 'E · Konami Test Enemy', exact: true }).click();
    const selector = page.locator('select:has(option:text-is("Sin tabla (usar movimiento inferior)"))');
    await selector.scrollIntoViewIfNeeded();
    await selector.selectOption('konami_sine');
    assert.equal(await selector.inputValue(), 'konami_sine');
    await page.screenshot({ path: 'server/temp/konami-check/enemy-selector.png' });
    assert.deepEqual(errors, []);
    console.log('OK Konami editor: spacing, timed preview, frame dragging and enemy asset selector');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
