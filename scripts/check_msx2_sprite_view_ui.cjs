// Isolated browser acceptance test; never touches the user's project/session.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { readFileSync, mkdirSync } = require('node:fs');
const { resolve, join } = require('node:path');

(async () => {
  const root = resolve(__dirname, '..');
  const project = JSON.parse(readFileSync(process.env.MIDEAS_SPRITE_VIEW_FIXTURE || join(root, 'test/msx2-shoot/fixture_shot_sound.json'), 'utf8'));
  project.name = project.currentProjectName = 'Sprite View acceptance';
  // Persisted bitmap projects can still say SCREEN 4 while running SCREEN 5.
  // Preserve the fixture's legacy mode to guard toolbar visibility in that case.
  project.currentScreenMode = process.env.MIDEAS_SPRITE_VIEW_MODE || project.currentScreenMode;
  const originalWorld = project.assets.find(asset => asset.type === 'worldmap');
  const extraWorld = structuredClone(originalWorld);
  extraWorld.id = extraWorld.data.id = 'sprite_view_extra_world';
  extraWorld.name = extraWorld.data.name = 'Sprite View second world';
  extraWorld.data.nodes = extraWorld.data.nodes.slice(0, 1);
  extraWorld.data.startScreenNodeId = extraWorld.data.nodes[0].id;
  project.assets.push(extraWorld);
  const out = process.env.MIDEAS_SPRITE_VIEW_OUT || join(root, 'work/sprite-view');
  mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1080 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.addInitScript(json => {
      localStorage.setItem('mideas_recent_projects', JSON.stringify([
        { name: 'Sprite View acceptance', path: 'sprite-view-fixture.json', lastOpened: Date.now() },
      ]));
      localStorage.setItem('mideas_recent_projects_data', JSON.stringify({ 'sprite-view-fixture.json': json }));
    }, JSON.stringify(project));
    await page.goto(process.env.MIDEAS_UI_URL || 'http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.getByRole('button', { name: 'File', exact: true }).click();
    await page.getByText('Open Recent', { exact: true }).click();
    await page.getByText('Sprite View acceptance', { exact: true }).click();
    await page.getByRole('button', { name: 'Sprite View', exact: true }).click({ timeout: 60000 });
    const panel = page.getByRole('region', { name: 'Sprite View', exact: true });
    await panel.getByRole('tab', { name: 'World general sprites' }).waitFor({ timeout: 60000 });
    await panel.getByRole('button', { name: /^Pattern group 0:/ }).waitFor();
    assert.equal(await panel.getByRole('button', { name: /^Pattern group / }).count(), 64);
    await panel.getByLabel('Sprite View world').selectOption(extraWorld.id);
    await panel.getByText(/This world is outside the active Game Flow/).waitFor();
    await panel.getByLabel('Sprite View world').selectOption(originalWorld.id);
    assert.match(await panel.locator('footer').innerText(), /Occupied: \d+ B.*Free: \d+ B.*Total: 2048 B/);
    await panel.getByRole('button', { name: /^Pattern group 0:/ }).click();
    assert.match(await panel.getByRole('complementary', { name: 'Pattern details' }).innerText(), /VRAM: #F800–#F81F/);
    await panel.getByRole('checkbox', { name: 'Show layer colors' }).check();
    await page.screenshot({ path: join(out, 'sprite-view-world.png'), fullPage: true });
    const screenOptions = await panel.getByLabel('Sprite View screen').locator('option').evaluateAll(options => options.map(option => option.value).filter(Boolean));
    assert.equal(screenOptions.length, 2, 'Screen choices are filtered by the selected world');
    await panel.getByLabel('Sprite View screen').selectOption(screenOptions[0]);
    assert.equal(await panel.getByRole('tab', { name: 'Screen sprites', exact: true }).getAttribute('aria-selected'), 'true');
    assert.match(await panel.locator('footer').innerText(), /selected screen \+ world/);
    await panel.getByRole('button', { name: /^Pattern group 48:/ }).click();
    await page.screenshot({ path: join(out, 'sprite-view-screen.png'), fullPage: true });
    await panel.getByLabel('Sprite View world').selectOption(extraWorld.id);
    assert.equal(await panel.getByLabel('Sprite View screen').locator('option').count(), 2, 'General plus one screen in another world');
    assert.equal(await panel.getByLabel('Sprite View screen').inputValue(), screenOptions[0], 'Changing worlds resets the screen');
    await panel.getByLabel('Sprite View world').selectOption(originalWorld.id);
    await panel.getByRole('tab', { name: 'All sprite assets' }).click();
    assert.ok(await panel.getByRole('button', { name: /^Asset pattern / }).count() > 0);
    const sprite = project.assets.find(asset => asset.type === 'msx2sprite');
    await panel.getByLabel('Sprite View asset filter').selectOption(sprite.id);
    assert.ok(await panel.getByRole('button', { name: /^Asset pattern / }).count() > 0);
    await panel.getByRole('button', { name: /^Asset pattern 0:/ }).click();
    await page.screenshot({ path: join(out, 'sprite-view-assets.png'), fullPage: true });
    await panel.getByRole('button', { name: 'Open sprite asset' }).click();
    await panel.waitFor({ state: 'hidden' });
    assert.deepEqual(errors, [], 'No browser exceptions');
    console.log('PASS Sprite View UI: toolbar, world/screen selection, filtered screens, combined usage, grid, details, colors, catalogue and navigation.');
    console.log(`Screenshots: ${out}`);
  } catch (error) {
    await page.screenshot({ path: join(out, 'sprite-view-failure.png'), fullPage: true }).catch(() => {});
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
