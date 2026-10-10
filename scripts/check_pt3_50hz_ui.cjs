const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const out = resolve('server/temp/pt3-50hz');
  const project = readFileSync(resolve(out, 'ui-project.json'), 'utf8');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.addInitScript(json => {
      localStorage.setItem('mideas_recent_projects', JSON.stringify([
        { name: 'PT3 50 Hz UI', path: 'pt3-rate-ui.json', lastOpened: Date.now() },
      ]));
      localStorage.setItem('mideas_recent_projects_data', JSON.stringify({ 'pt3-rate-ui.json': json }));
    }, project);
    await page.goto(process.env.MIDEAS_UI_URL || 'http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'File', exact: true }).click();
    await page.getByText('Open Recent').click();
    await page.getByText('PT3 50 Hz UI', { exact: true }).click();
    await page.getByRole('button', { name: 'Expand All' }).click();
    await page.getByText('PT3 Rate', { exact: true }).first().click();
    const checkbox = page.getByRole('checkbox', { name: '50 Hz', exact: true });
    await checkbox.waitFor();
    assert.equal(await checkbox.isChecked(), false);
    await checkbox.check();
    assert.equal(await checkbox.isChecked(), true);
    const exportSong = async filename => {
      const download = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Export Music', exact: true }).click();
      const downloaded = await download;
      const path = resolve(out, filename);
      await downloaded.saveAs(path);
      return JSON.parse(readFileSync(path, 'utf8')).track;
    };
    assert.equal((await exportSong('ui-50hz.json')).pt3Force50Hz, true);
    await page.getByRole('button', { name: 'Play Song', exact: true }).click();
    await page.getByRole('button', { name: 'Stop', exact: true }).waitFor();
    await checkbox.uncheck();
    assert.equal((await exportSong('ui-default.json')).pt3Force50Hz, false);
    await checkbox.check();
    await page.getByRole('button', { name: 'Stop', exact: true }).click();
    await page.screenshot({ path: resolve(out, 'ui.png') });
    assert.deepEqual(errors, [], 'No browser exceptions while switching playback rate');
    console.log('PASS: checkbox, saved true/false option, live playback switching and browser exceptions.');
  } catch (error) {
    await page.screenshot({ path: resolve(out, 'ui-error.png') });
    throw error;
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
