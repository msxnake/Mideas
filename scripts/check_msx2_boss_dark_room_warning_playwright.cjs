#!/usr/bin/env node
/**
 * Fase 0 of the VRAM study, driven through the real UI.
 *
 * A dark room hands palette slots 8..15 to the dimmed twins of 0..7 and keeps
 * slot 0 as the backdrop, so the art may only paint with 7 colours. That is a
 * hard ceiling on how good a boss can look, and darkness is a per-room flag, so
 * the editor warns about it and offers to flip the room in one click.
 * See docs/msx/MSX2_VRAM_BUDGET_BOSS_STUDY.md §6 and §11 (Fase 0).
 *
 * What this proves, in order: the warning appears for a dark room that has a
 * boss, the button actually lights the room, and the warning is gone
 * afterwards. It also writes before/after PNGs so the change can be eyeballed.
 *
 * Runs against its own dev server (MIDEAS_UI_URL, default :5199) so it never
 * touches another session's localStorage.
 */
const { chromium } = require('playwright');
const { readFileSync, mkdirSync } = require('node:fs');
const { join, resolve } = require('node:path');

const repoRoot = resolve(__dirname, '..');
const URL = process.env.MIDEAS_UI_URL || 'http://localhost:5199/';
const HEADLESS = process.env.MIDEAS_UI_HEADED !== '1';
const FIXTURE = join(repoRoot, 'test', 'msx2-boss', 'fixture_boss_dark_room.json');
const OUT_DIR = join(repoRoot, 'test', 'msx2-boss', 'out');

const WARNING = 'Esta sala tiene un Boss y está a oscuras';
const FLIP_BUTTON = 'Pasar esta sala a iluminada';

(async () => {
  mkdirSync(OUT_DIR, { recursive: true });
  const projectJson = readFileSync(FIXTURE, 'utf8');

  const browser = await chromium.launch({ headless: HEADLESS });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const failures = [];
  const ok = (name, passed) => {
    console.log(`${passed ? 'OK  ' : 'FAIL'}: ${name}`);
    if (!passed) failures.push(name);
  };

  try {
    // Seed the recent-projects cache before the app boots, so the fixture can be
    // opened from the menu instead of through a native file dialog.
    await page.addInitScript(([path, data]) => {
      localStorage.setItem('mideas_recent_projects', JSON.stringify([
        { name: 'Fase0 Boss Dark Demo', path, lastOpened: Date.now() },
      ]));
      localStorage.setItem('mideas_recent_projects_data', JSON.stringify({ [path]: data }));
    }, ['fixture_boss_dark_room.json', projectJson]);

    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });

    await page.getByRole('button', { name: 'File' }).click();
    await page.getByText('Open Recent').click();
    await page.getByText('Fase0 Boss Dark Demo', { exact: true }).click();
    await page.waitForTimeout(2000);

    // The asset tree opens collapsed, so the room is not clickable yet.
    await page.getByRole('button', { name: 'Expand All' }).click();
    await page.waitForTimeout(500);

    // Open the room. Its Lighting panel is what carries the warning.
    const roomItem = page.getByText('pan2', { exact: true }).first();
    await roomItem.scrollIntoViewIfNeeded();
    await roomItem.click();
    await page.waitForTimeout(2500);

    const warning = page.getByText(WARNING, { exact: true });
    await warning.waitFor({ state: 'visible', timeout: 30000 });
    ok('A dark room holding a boss shows the palette warning', await warning.isVisible());

    ok('The warning states the real budget (7 pintables, not 15)',
      await page.getByText(/7 colores pintables/).isVisible());
    ok('The warning offers the one-click fix',
      await page.getByRole('button', { name: FLIP_BUTTON }).isVisible());

    const panel = page.locator('div', { hasText: WARNING }).last();
    await panel.scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(OUT_DIR, 'fase0_boss_dark_warning.png'), fullPage: false });

    // The fix must actually light the room, not just hide its own warning.
    await page.getByRole('button', { name: FLIP_BUTTON }).click();
    await page.waitForTimeout(800);

    ok('Clicking the fix lights the room (status bar confirms)',
      await page.getByText('SCREEN 5: sala iluminada normal.').isVisible());
    ok('The warning is gone once the room is lit',
      (await page.getByText(WARNING, { exact: true }).count()) === 0);

    const stillDark = await page.evaluate(() => {
      const cb = [...document.querySelectorAll('input[type=checkbox]')]
        .find(c => /Sala oscura/.test(c.parentElement?.textContent || ''));
      return cb ? cb.checked : null;
    });
    ok('The "Sala oscura" checkbox really cleared', stillDark === false);

    await page.screenshot({ path: join(OUT_DIR, 'fase0_boss_lit_after.png'), fullPage: false });
  } catch (error) {
    console.error('\nUI drive failed:', error.message);
    try {
      await page.screenshot({ path: join(OUT_DIR, 'fase0_boss_failure.png') });
      console.error(`Screenshot of the failure: ${join(OUT_DIR, 'fase0_boss_failure.png')}`);
    } catch { /* the page may already be gone */ }
    failures.push('drive');
  } finally {
    await browser.close();
  }

  console.log('');
  if (failures.length) {
    console.error(`MSX2 boss dark-room warning checks FAILED (${failures.length}).`);
    process.exit(1);
  }
  console.log(`Screenshots in ${OUT_DIR}`);
  console.log('MSX2 boss dark-room warning checks passed.');
})();
