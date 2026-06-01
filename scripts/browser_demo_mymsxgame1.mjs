#!/usr/bin/env node
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const outDir = join(process.cwd(), 'screenshots', 'demo_mymsxgame1_browser');
mkdirSync(outDir, { recursive: true });

const baseUrl = 'http://localhost:3000/?loadProjectUrl=/autoload/MyMSXGame1_3_13.json&projectName=MyMSXGame1(3)13';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

try {
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: join(outDir, '01_loaded.png'), fullPage: true });

  const screenLink = page.getByText('screen_platform_mymsxgame', { exact: false }).first();
  if (await screenLink.count()) {
    await screenLink.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(outDir, '02_screen_editor.png'), fullPage: true });
  }

  const entitiesBtn = page.getByRole('button', { name: /^Entities$/i }).first();
  if (await entitiesBtn.count()) {
    await entitiesBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: join(outDir, '03_entities_mode.png'), fullPage: true });
  }

  const pushBoxEntity = page.getByText('MSX2 Push Box Crate 2', { exact: false }).first();
  if (await pushBoxEntity.count()) {
    await pushBoxEntity.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: join(outDir, '04_push_box_selected.png'), fullPage: true });
  }

  const spikeEntity = page.getByText('MSX2 Pinchos 3', { exact: false }).first();
  if (await spikeEntity.count()) {
    await spikeEntity.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: join(outDir, '05_spike_selected.png'), fullPage: true });
  }

  const gameFlowLink = page.getByText('Main MSX2', { exact: false }).first();
  if (await gameFlowLink.count()) {
    await gameFlowLink.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(outDir, '06_gameflow.png'), fullPage: true });
  }

  const status = await page.locator('text=/MyMSXGame1|screen_platform|Error loading/i').first().textContent().catch(() => '');
  console.log(JSON.stringify({ ok: true, outDir, status: status?.slice(0, 120) }));
} catch (error) {
  await page.screenshot({ path: join(outDir, 'error.png'), fullPage: true }).catch(() => {});
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
}
