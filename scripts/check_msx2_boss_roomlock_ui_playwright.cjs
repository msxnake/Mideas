/**
 * Room Lock entry sequence, driven through the real UI.
 *
 * The sequence is an ordered list, so the thing worth proving is that the order
 * the author builds is the order that survives: add steps, reorder them, and
 * read the rendered rows back.
 *
 * Runs against its own dev server (MIDEAS_UI_URL, default :5199) so it never
 * touches another session's localStorage.
 */
const { chromium } = require('playwright');

const URL = process.env.MIDEAS_UI_URL || 'http://localhost:5199/';
const HEADLESS = process.env.MIDEAS_UI_HEADED !== '1';

/** Step rows render their kind in a readonly input; read them top to bottom. */
async function readSequence(page) {
  return page.$$eval(
    'input[readonly]',
    nodes => nodes
      .map(node => node.value)
      .filter(value => ['Close the chain', 'Boss speaks', 'Wait'].includes(value)),
  );
}

(async () => {
  const browser = await chromium.launch({ headless: HEADLESS });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const failures = [];
  const ok = (name, passed) => {
    console.log(`${passed ? 'OK' : 'FAIL'}: ${name}`);
    if (!passed) failures.push(name);
  };

  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });

    // Fresh MSX2 project, SCREEN 5 bitmap (the mode bosses live in).
    await page.getByRole('button', { name: 'File' }).click();
    await page.getByText('New Project', { exact: true }).click();
    await page.getByText('MSX2 (SCREEN 4 tile / SCREEN 5 bitmap)').click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForTimeout(600);
    await page.getByText(/Platform Bitmap/).first().click();
    await page.getByRole('button', { name: 'Create MSX2 Project' }).first().click();
    await page.waitForTimeout(600);
    // A confirmation modal repeats the same button label; take the one on top.
    await page.getByRole('button', { name: 'Create MSX2 Project' }).last().click();
    await page.waitForTimeout(2500);

    // New Asset -> Boss.
    await page.getByRole('button', { name: /New Asset/i }).first().click();
    await page.waitForTimeout(400);
    await page.getByText(/Boss/i).first().click();
    await page.waitForTimeout(1200);

    await page.getByRole('button', { name: 'Room Lock', exact: true }).click();
    await page.waitForTimeout(400);

    ok('Room Lock panel shows the entry sequence editor',
      await page.getByText('Entry sequence').isVisible());

    ok('An empty sequence explains the default (chain seals on load)',
      await page.getByText(/the chain seals the moment the room loads/i).isVisible());

    // Build: close chain, then dialogue-less wait, in a deliberate order.
    await page.getByRole('button', { name: '+ Close chain' }).click();
    await page.waitForTimeout(250);
    await page.getByRole('button', { name: '+ Wait' }).click();
    await page.waitForTimeout(250);

    const built = await readSequence(page);
    ok(`Steps appear in the order they were added (got ${JSON.stringify(built)})`,
      built.length === 2 && built[0] === 'Close the chain' && built[1] === 'Wait');

    // Reorder: push the wait above the close.
    await page.getByTitle('Move earlier').nth(1).click();
    await page.waitForTimeout(250);
    const reordered = await readSequence(page);
    ok(`Move earlier reorders the sequence (got ${JSON.stringify(reordered)})`,
      reordered.length === 2 && reordered[0] === 'Wait' && reordered[1] === 'Close the chain');

    // The animated close exposes its pacing.
    ok('Animated close exposes cells-per-frame pacing',
      await page.getByText(/perimeter cells appear .* at a time/i).isVisible());

    // Turning animation off swaps the explanation.
    await page.getByRole('checkbox').first().uncheck();
    await page.waitForTimeout(250);
    ok('Unticking Animate switches to the instant explanation',
      await page.getByText(/whole chain appears at once/i).isVisible());

    await page.screenshot({ path: 'test/msx2-boss/roomlock_sequence_ui.png', fullPage: false });
    console.log('screenshot: test/msx2-boss/roomlock_sequence_ui.png');

    // Removing every step returns to the documented default.
    const removeButtons = page.getByRole('button', { name: '✕' });
    const count = await removeButtons.count();
    for (let i = 0; i < count; i++) await removeButtons.first().click();
    await page.waitForTimeout(300);
    ok('Removing all steps restores the empty-sequence explanation',
      await page.getByText(/the chain seals the moment the room loads/i).isVisible());

  } catch (error) {
    console.log(`FAIL: threw before finishing -> ${error.message.split('\n')[0]}`);
    failures.push('exception');
    await page.screenshot({ path: 'test/msx2-boss/roomlock_sequence_ui_error.png' }).catch(() => {});
  } finally {
    await browser.close();
  }

  if (failures.length) {
    throw new Error(`Room Lock UI checks failed: ${failures.length}`);
  }
  console.log('Room Lock UI checks passed.');
})();
