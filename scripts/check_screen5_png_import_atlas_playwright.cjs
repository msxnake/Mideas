const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const DEFAULT_SOURCE = 'C:\\Users\\salam\\Downloads\\plantas_tiles.png';
const sourcePng = process.env.MIDEAS_SCREEN5_PNG_IMPORT_SOURCE || DEFAULT_SOURCE;

async function main() {
  if (!fs.existsSync(sourcePng)) {
    throw new Error(`PNG source not found: ${sourcePng}`);
  }

  const { createServer } = await import('vite');
  const react = (await import('@vitejs/plugin-react')).default;
  const server = await createServer({
    configFile: false,
    root: process.cwd(),
    plugins: [react()],
    resolve: {
      alias: { '@': process.cwd() },
      extensions: ['.mjs', '.mts', '.ts', '.tsx', '.js', '.jsx', '.json'],
    },
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || ''),
      'process.env.API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || ''),
    },
    server: { host: '127.0.0.1', port: 0, strictPort: false, open: false },
    logLevel: 'error',
  });

  await server.listen();
  const address = server.httpServer.address();
  const port = typeof address === 'object' && address ? address.port : 5173;
  const url = `http://127.0.0.1:${port}`;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.removeItem('msxIdeMsx2BitmapTileLibrary_v1');
      localStorage.removeItem('msxIdeMsx2BitmapStampLibrary_v1');
    });
    await page.reload({ waitUntil: 'networkidle' });

    await page.getByRole('button', { name: 'File' }).click();
    await page.getByText('New Project', { exact: true }).click();
    await page.getByText('MSX2 (Graphics II / Bitmap)').click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByText('Action bitmap').click();
    await page.locator('button').filter({ hasText: 'Create MSX2 Project' }).nth(0).click();
    await page.waitForTimeout(200);
    await page.locator('button').filter({ hasText: 'Create MSX2 Project' }).last().click();
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: 'Importar tile' }).click();
    await page.getByRole('button', { name: 'Importar PNG' }).click();
    await page.waitForTimeout(500);

    const screen5Button = page.getByRole('button', { name: 'SCREEN 5 bitmap', exact: true });
    const screen5Class = await screen5Button.evaluate(button => button.className);
    if (!screen5Class.includes('bg-msx-highlight')) {
      throw new Error('PNG import modal did not default to SCREEN 5 bitmap mode.');
    }

    await page.locator('input[type="file"]').last().setInputFiles(sourcePng);
    await page.waitForTimeout(1500);

    await page.locator('button[title^="Dibuja"]').click();
    await page.waitForTimeout(300);

    const sourceCanvas = page.locator('canvas').nth(2);
    const box = await sourceCanvas.boundingBox();
    if (!box) throw new Error('Source PNG canvas was not visible.');

    const canvasSize = await sourceCanvas.evaluate(canvas => ({ width: canvas.width, height: canvas.height }));
    // This coordinate hits a non-empty 16x16 plant tile in plantas_tiles.png.
    const tileX = canvasSize.width === 1254 ? 1168 : 0;
    const tileY = canvasSize.height === 1254 ? 944 : 0;
    const sx = box.x + (tileX / canvasSize.width) * box.width;
    const sy = box.y + (tileY / canvasSize.height) * box.height;
    const drag = Math.max(4, (16 / canvasSize.width) * box.width + 0.5);

    await page.mouse.move(sx + 0.5, sy + 0.5);
    await page.mouse.down();
    await page.mouse.move(sx + drag, sy + drag, { steps: 4 });
    await page.mouse.up();
    await page.waitForTimeout(300);

    const cropLabel = (await page.locator('body').innerText()).match(/\d+x\d+px \([^)]*tiles\)/)?.[0] || '';
    if (!cropLabel.includes('1x1 tiles')) {
      throw new Error(`Expected one selected tile, got crop label: ${cropLabel || '<missing>'}`);
    }

    await page.getByRole('button', { name: 'Aplicar' }).click();
    await page.waitForTimeout(800);
    await page.getByRole('button', { name: 'Auto' }).click();
    await page.waitForTimeout(800);

    const addButton = page.locator('button').filter({ hasText: 'biblioteca' }).last();
    const addText = await addButton.innerText();
    if (!addText.includes('(1)')) {
      throw new Error(`Expected Add button to contain one tile, got: ${addText}`);
    }
    if (!(await addButton.isEnabled())) {
      throw new Error('Add to library button is disabled after selecting one tile.');
    }
    await addButton.click();
    await page.waitForTimeout(1200);

    const body = await page.locator('body').innerText();
    const atlasBudget = body.match(/Atlas tiles\s+(\d+) \/ 256/);
    const propsAtlas = body.match(/Atlas: 256x\d+ px \/ (\d+) entries/);
    const libraryCount = body.match(/Carpeta: Bitmap SCREEN 5 \((\d+)\)/);
    const status = body.match(/Importados .*atlas SCREEN 5.*/)?.[0] || '';

    if (!atlasBudget || Number(atlasBudget[1]) < 1) {
      throw new Error(`Tile Atlas did not receive the PNG tile. Atlas budget: ${atlasBudget?.[0] || '<missing>'}`);
    }
    if (!propsAtlas || Number(propsAtlas[1]) < 1) {
      throw new Error(`Room properties do not show atlas entries. Atlas props: ${propsAtlas?.[0] || '<missing>'}`);
    }
    if (!libraryCount || Number(libraryCount[1]) < 1) {
      throw new Error(`Bitmap SCREEN 5 library was not updated. Library: ${libraryCount?.[0] || '<missing>'}`);
    }
    if (!status.includes('atlas SCREEN 5')) {
      throw new Error(`Missing SCREEN 5 atlas import status. Status: ${status || '<missing>'}`);
    }
    if (errors.length > 0) {
      throw new Error(`Browser errors during test:\n${errors.join('\n')}`);
    }

    const screenshotPath = path.join(process.cwd(), 'test', 'screen5_png_import_atlas_after.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`SCREEN 5 PNG import atlas test passed. Screenshot: ${screenshotPath}`);
  } finally {
    await browser.close();
    await server.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
