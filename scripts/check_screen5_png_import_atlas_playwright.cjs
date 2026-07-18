const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const DEFAULT_SOURCE = 'C:\\Users\\salam\\Downloads\\plantas_tiles.png';
const sourcePng = process.env.MIDEAS_SCREEN5_PNG_IMPORT_SOURCE || DEFAULT_SOURCE;

function createDefaultScreen5PaletteSlots() {
  const base = [
    'rgba(0,0,0,0)',
    '#000000',
    '#3EB847',
    '#74D07D',
    '#2F2FC1',
    '#5858FC',
    '#B63125',
    '#68D2DA',
    '#FC584A',
    '#FF8E81',
    '#C0BF3B',
    '#E7E474',
    '#309337',
    '#B640C8',
    '#999999',
    '#FFFFFF',
  ];
  const levels = [0x00, 0x24, 0x49, 0x6D, 0x92, 0xB6, 0xDB, 0xFF];
  const closest = value => levels.reduce((best, level, index) => (
    Math.abs(level - value) < Math.abs(levels[best] - value) ? index : best
  ), 0);
  const hex2 = value => value.toString(16).padStart(2, '0').toUpperCase();
  return base.map((hex, slotIndex) => {
    if (slotIndex === 0) return { slotIndex, masterIndex: -1, hex };
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const ri = closest(r);
    const gi = closest(g);
    const bi = closest(b);
    return {
      slotIndex,
      masterIndex: (ri << 6) | (gi << 3) | bi,
      hex: `#${hex2(levels[ri])}${hex2(levels[gi])}${hex2(levels[bi])}`,
    };
  });
}

function makeSolidTilePixels(slot) {
  return Array.from({ length: 16 }, (_row, y) =>
    Array.from({ length: 16 }, (_col, x) => ((x + y) % 5 === 0 ? 0 : slot))
  );
}

function createMismatchedScreen5PaletteSlots() {
  const slots = createDefaultScreen5PaletteSlots();
  return slots.map(slot => {
    if (slot.slotIndex === 3) return { ...slot, masterIndex: 73, hex: '#246D24' };
    if (slot.slotIndex === 6) return { ...slot, masterIndex: 292, hex: '#929224' };
    if (slot.slotIndex === 10) return { ...slot, masterIndex: 438, hex: '#DBDB92' };
    return slot;
  });
}

function makeLibraryFixtures() {
  const palette = createDefaultScreen5PaletteSlots();
  const bitmapPalette = createMismatchedScreen5PaletteSlots();
  const colorClashTile = {
    id: 'screen4_library_tile',
    name: 'Library Color Clash Test',
    width: 16,
    height: 16,
    pixels: makeSolidTilePixels(2),
    behaviorKind: 'background',
  };
  const bitmapPixels = makeSolidTilePixels(3);
  const bitmapTile = {
    id: 'screen5_bitmap_library_tile',
    name: 'plantitas1',
    mode: 'SCREEN5_BITMAP',
    width: 16,
    height: 16,
    sourceType: 'png-import',
    paletteId: 'test_palette',
    pixelData: bitmapPixels.flat(),
    createdAt: '2026-06-26T00:00:00.000Z',
    updatedAt: '2026-06-26T00:00:00.000Z',
  };
  return {
    colorClashEntries: [{
      id: 'entry_screen4_library_tile',
      name: 'Library Color Clash Test',
      savedAt: 1770000000000,
      tile: colorClashTile,
      palette,
    }],
    bitmapEntries: [{
      id: 'entry_screen5_bitmap_library_tile',
      name: 'plantitas1',
      savedAt: 1770000000001,
      tile: bitmapTile,
      palette: bitmapPalette,
    }],
  };
}

async function importFirstVisibleLibraryTile(page) {
  await page.getByRole('button', { name: 'Import', exact: true }).first().click();
  await page.waitForTimeout(400);
  const reconcileButton = page.getByRole('button', { name: 'Importar a la pantalla' });
  const reconciled = await reconcileButton.count() > 0;
  if (reconciled) {
    await reconcileButton.click();
    await page.waitForTimeout(500);
  }
  return reconciled;
}

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
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      localStorage.removeItem('msxIdeMsx2BitmapTileLibrary_v1');
      localStorage.removeItem('msxIdeMsx2BitmapStampLibrary_v1');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: 'File' }).click();
    await page.getByText('New Project', { exact: true }).click();
    await page.getByText('MSX2 (SCREEN 4 tile / SCREEN 5 bitmap)').click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByText('Action bitmap').click();
    await page.locator('button').filter({ hasText: 'Create MSX2 Project' }).nth(0).click();
    await page.waitForTimeout(200);
    await page.locator('button').filter({ hasText: 'Create MSX2 Project' }).last().click();
    await page.waitForTimeout(1000);

    await page.evaluate(fixtures => {
      localStorage.setItem('msxIdeMsx2TileLibrary_v1', JSON.stringify(fixtures.colorClashEntries));
      localStorage.setItem('msxIdeMsx2BitmapTileLibrary_v1', JSON.stringify(fixtures.bitmapEntries));
    }, makeLibraryFixtures());

    await page.getByRole('button', { name: 'Importar tile' }).click();
    await page.waitForTimeout(500);
    await importFirstVisibleLibraryTile(page);
    let body = await page.locator('body').innerText();
    let atlasBudget = body.match(/Atlas tiles\s+(\d+) \/ 256/);
    if (!atlasBudget || Number(atlasBudget[1]) < 1) {
      throw new Error(`Color-clash library tile did not reach SCREEN 5 atlas. Atlas budget: ${atlasBudget?.[0] || '<missing>'}`);
    }

    await page.getByRole('button', { name: /Carpeta: Bitmap SCREEN 5/ }).click();
    await page.waitForTimeout(300);
    const usedReconcile = await importFirstVisibleLibraryTile(page);
    if (!usedReconcile) {
      throw new Error('Bitmap SCREEN 5 library import did not open palette reconciliation; recurrent test must cover that branch.');
    }
    body = await page.locator('body').innerText();
    atlasBudget = body.match(/Atlas tiles\s+(\d+) \/ 256/);
    const propsAtlasAfterBitmap = body.match(/Atlas: 256x\d+ px \/ (\d+) entries/);
    if (!atlasBudget || Number(atlasBudget[1]) < 2) {
      throw new Error(`Bitmap SCREEN 5 library tile did not reach atlas. Atlas budget: ${atlasBudget?.[0] || '<missing>'}`);
    }
    if (!propsAtlasAfterBitmap || Number(propsAtlasAfterBitmap[1]) < 2) {
      throw new Error(`Room properties do not show both library atlas entries. Atlas props: ${propsAtlasAfterBitmap?.[0] || '<missing>'}`);
    }
    await page.getByRole('button', { name: 'Cerrar' }).last().click();
    await page.waitForTimeout(300);
    const visiblePlantAtlasTile = await page.locator('button[title^="plantitas1"]').count();
    if (visiblePlantAtlasTile === 0) {
      throw new Error('Imported bitmap tile plantitas1 reached the atlas counter but is hidden by the atlas category filter.');
    }

    await page.getByRole('button', { name: 'Importar tile' }).click();
    await page.waitForTimeout(500);
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

    const sourceCanvasIndex = await page.locator('canvas').evaluateAll(canvases => {
      const exact = canvases.findIndex(canvas => canvas.width === 1254 && canvas.height === 1254);
      if (exact >= 0) return exact;
      return canvases.reduce((best, canvas, index) => (
        canvas.width * canvas.height > canvases[best].width * canvases[best].height ? index : best
      ), 0);
    });
    const sourceCanvas = page.locator('canvas').nth(sourceCanvasIndex);
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

    body = await page.locator('body').innerText();
    atlasBudget = body.match(/Atlas tiles\s+(\d+) \/ 256/);
    const propsAtlas = body.match(/Atlas: 256x\d+ px \/ (\d+) entries/);
    const libraryCount = body.match(/Carpeta: Bitmap SCREEN 5 \((\d+)\)/);
    const status = body.match(/Importados .*atlas SCREEN 5.*/)?.[0] || '';

    if (!atlasBudget || Number(atlasBudget[1]) < 3) {
      throw new Error(`Tile Atlas did not receive the PNG tile. Atlas budget: ${atlasBudget?.[0] || '<missing>'}`);
    }
    if (!propsAtlas || Number(propsAtlas[1]) < 3) {
      throw new Error(`Room properties do not show atlas entries. Atlas props: ${propsAtlas?.[0] || '<missing>'}`);
    }
    if (!libraryCount || Number(libraryCount[1]) < 2) {
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
