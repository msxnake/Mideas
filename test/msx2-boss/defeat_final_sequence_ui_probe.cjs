/**
 * Ad-hoc UI probe for the Defeat Actions "Final sequence" rework.
 * Mirrors the roomlock UI check flow: fresh MSX2 project, Boss asset,
 * then add/reorder/remove defeat steps and read the rows back.
 */
const { chromium } = require('playwright');

const URL = process.env.MIDEAS_UI_URL || 'http://localhost:5199/';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const failures = [];
  const ok = (name, passed) => {
    console.log(`${passed ? 'OK' : 'FAIL'}: ${name}`);
    if (!passed) failures.push(name);
  };
  const readSteps = () => page.$$eval('input[readonly]', nodes =>
    nodes.map(n => n.value).filter(v => [
      'Set flag', 'Give key', 'Open door', 'Message', 'Boss speaks', 'Wait', 'Change screen',
    ].includes(v)));

  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.getByRole('button', { name: 'File' }).click();
    await page.getByText('New Project', { exact: true }).click();
    await page.getByText('MSX2 (SCREEN 4 tile / SCREEN 5 bitmap)').click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForTimeout(600);
    await page.getByText(/Platform Bitmap/).first().click();
    await page.getByRole('button', { name: 'Create MSX2 Project' }).first().click();
    await page.waitForTimeout(600);
    await page.getByRole('button', { name: 'Create MSX2 Project' }).last().click();
    await page.waitForTimeout(2500);

    await page.getByRole('button', { name: /New Asset/i }).first().click();
    await page.waitForTimeout(400);
    await page.getByText(/Boss/i).first().click();
    await page.waitForTimeout(1200);

    await page.getByRole('button', { name: 'Defeat Actions', exact: true }).click();
    await page.waitForTimeout(400);

    ok('Panel shows the Final sequence header',
      await page.getByText('Final sequence').isVisible());
    ok('Empty state explains the ending staging',
      await page.getByText(/stage the ending/i).isVisible());
    ok('+ Dialogue button exists (disabled without dialogue assets)',
      await page.getByRole('button', { name: '+ Dialogue' }).isVisible()
      && await page.getByRole('button', { name: '+ Dialogue' }).isDisabled());

    await page.getByRole('button', { name: '+ Set flag' }).click();
    await page.waitForTimeout(250);
    await page.getByRole('button', { name: '+ Wait' }).click();
    await page.waitForTimeout(250);
    await page.getByRole('button', { name: '+ Give key' }).click();
    await page.waitForTimeout(250);

    let steps = await readSteps();
    ok(`Steps appear in add order (got ${JSON.stringify(steps)})`,
      steps.length === 3 && steps[0] === 'Set flag' && steps[1] === 'Wait' && steps[2] === 'Give key');

    ok('Wait step shows its frames hint',
      await page.getByText(/About \d+\.\d+s at 60Hz/i).isVisible());

    await page.getByTitle('Move later').first().click();
    await page.waitForTimeout(250);
    steps = await readSteps();
    ok(`Move later reorders (got ${JSON.stringify(steps)})`,
      steps[0] === 'Wait' && steps[1] === 'Set flag' && steps[2] === 'Give key');

    const rows = page.locator('input[readonly]');
    ok('Rows are numbered from 1', (await page.getByText(/^1\.$/).count()) >= 1);

    await page.screenshot({ path: 'test/msx2-boss/defeat_final_sequence_ui.png', fullPage: false });
    console.log('screenshot: test/msx2-boss/defeat_final_sequence_ui.png');

    const remove = page.getByRole('button', { name: '✕' });
    const count = await remove.count();
    for (let i = 0; i < count; i++) await remove.first().click();
    await page.waitForTimeout(300);
    ok('Removing all steps restores the empty state',
      await page.getByText(/stage the ending/i).isVisible());
  } catch (error) {
    console.log(`FAIL: threw -> ${error.message.split('\n')[0]}`);
    failures.push('exception');
    await page.screenshot({ path: 'test/msx2-boss/defeat_final_sequence_ui_error.png' }).catch(() => {});
  } finally {
    await browser.close();
  }
  if (failures.length) { process.exitCode = 1; console.log(`failures: ${failures.length}`); }
  else console.log('Defeat final-sequence UI probe passed.');
})();
