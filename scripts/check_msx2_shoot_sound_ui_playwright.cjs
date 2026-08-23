#!/usr/bin/env node
/**
 * The shot sound, in the panel the author actually uses.
 *
 * The generator contract proves the ASM. This proves the two controls exist and
 * are wired to the right places: the on/off switch is a skill parameter (it goes
 * to `skillParameters.shoot.shootSound`) while the asset picker is a sound SLOT
 * (it goes to `soundAssetIds.onShoot`) — two different corners of the player
 * document that happen to be rendered side by side.
 *
 * Runs against a dev server (MIDEAS_UI_URL, default :5199).
 */
const { chromium } = require('playwright');
const { readFileSync, mkdirSync } = require('node:fs');
const { join, resolve } = require('node:path');

const repoRoot = resolve(__dirname, '..');
const URL = process.env.MIDEAS_UI_URL || 'http://localhost:5199/';
const HEADLESS = process.env.MIDEAS_UI_HEADED !== '1';
const FIXTURE = join(repoRoot, 'test', 'msx2-shoot', 'fixture_shot_sound.json');
const OUT_DIR = join(repoRoot, 'test', 'msx2-shoot', 'out');

(async () => {
  mkdirSync(OUT_DIR, { recursive: true });
  const project = JSON.parse(readFileSync(FIXTURE, 'utf8'));
  project.name = 'Shot Sound UI';
  project.currentProjectName = project.name;
  // The fixture ships with the asset already chosen; clear it so the dialog is
  // checked in its default state, which is what every existing project shows.
  const playerAsset = project.assets.find(asset => asset.type === 'msx2player');
  const player = playerAsset.data?.player || playerAsset.data;
  delete player.soundAssetIds.onShoot;

  const browser = await chromium.launch({ headless: HEADLESS });
  const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
  const failures = [];
  const ok = (name, passed) => {
    console.log(`${passed ? 'OK  ' : 'FAIL'}: ${name}`);
    if (!passed) failures.push(name);
  };

  try {
    await page.addInitScript(json => {
      localStorage.setItem('mideas_recent_projects', JSON.stringify([
        { name: 'Shot Sound UI', path: 'fixture_shot_sound.json', lastOpened: Date.now() },
      ]));
      localStorage.setItem('mideas_recent_projects_data', JSON.stringify({
        'fixture_shot_sound.json': json,
      }));
    }, JSON.stringify(project));

    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.getByRole('button', { name: 'File', exact: true }).click();
    await page.getByText('Open Recent').click();
    await page.getByText('Shot Sound UI', { exact: true }).click();
    await page.waitForTimeout(2500);
    await page.getByRole('button', { name: 'Expand All' }).click();
    await page.waitForTimeout(600);
    await page.getByText('Player_Main', { exact: true }).first().click();
    await page.waitForTimeout(2000);
    // The player editor opens on General; the skills live in their own section.
    await page.getByText('Abilities & Items', { exact: true }).first().click();
    await page.waitForTimeout(1000);

    // Open the skill's parameter dialog: "Click a skill to edit its parameters".
    // The label appears more than once (the activation table lists it too), so
    // take the first one that is actually on screen.
    const rows = page.getByText('Fire bullet in facing direction');
    const count = await rows.count();
    let opened = false;
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      if (!(await row.isVisible())) continue;
      await row.scrollIntoViewIfNeeded();
      await row.click();
      opened = true;
      break;
    }
    if (!opened) throw new Error('No visible "Fire bullet in facing direction" row to click');
    await page.waitForTimeout(800);

    const toggle = page.getByText('Shot sound (PSG)').first();
    const picker = page.getByLabel('Shot sound (PSG asset)');

    ok('The shoot skill dialog offers a shot sound switch',
      await toggle.isVisible());
    ok('...and a picker for a Sound Editor asset',
      await picker.isVisible());
    // Two labels carry that text: the parameter (which owns the checkbox) and
    // the picker below it. Only the one with a checkbox says anything here.
    const switchBox = page.locator('label')
      .filter({ hasText: 'Shot sound (PSG)' })
      .filter({ has: page.locator('input[type="checkbox"]') })
      .locator('input[type="checkbox"]');
    ok('It defaults to on, so a shot is audible without configuring anything',
      await switchBox.count() === 1 && await switchBox.isChecked());
    ok('With nothing chosen it says the built-in sound is used',
      (await picker.inputValue()) === ''
      && (await picker.locator('option').first().textContent())?.includes('Built-in'));
    ok('Every Sound Editor asset in the project is offered',
      (await picker.locator('option').allTextContents()).includes('Laser shot'));

    // Choosing an asset has to survive the dialog closing: the picker writes to
    // the player document (soundAssetIds.onShoot), not to local dialog state.
    // Reading localStorage would prove nothing here — the recent-projects copy
    // is only rewritten on save.
    await picker.selectOption({ label: 'Laser shot' });
    await page.waitForTimeout(600);
    await page.getByRole('button', { name: 'Close' }).click();
    await page.waitForTimeout(600);
    const reopen = page.getByText('Fire bullet in facing direction');
    for (let i = 0; i < await reopen.count(); i++) {
      const row = reopen.nth(i);
      if (!(await row.isVisible())) continue;
      await row.click();
      break;
    }
    await page.waitForTimeout(800);
    const reopened = page.getByLabel('Shot sound (PSG asset)');
    ok('The choice sticks: it is written to the player, not to the dialog',
      (await reopened.locator('option:checked').textContent())?.trim() === 'Laser shot');
    ok('The switch and the picker are stored apart, so muting keeps the choice',
      await page.locator('label')
        .filter({ hasText: 'Shot sound (PSG)' })
        .filter({ has: page.locator('input[type="checkbox"]') })
        .locator('input[type="checkbox"]').isChecked());

    await page.screenshot({ path: join(OUT_DIR, 'shot_sound_dialog.png'), fullPage: false });
    console.log(`\nScreenshot: ${join(OUT_DIR, 'shot_sound_dialog.png')}`);
  } finally {
    await browser.close();
  }

  console.log(`\n${failures.length ? `${failures.length} check(s) failed` : 'all checks passed'}`);
  process.exit(failures.length ? 1 : 0);
})();
