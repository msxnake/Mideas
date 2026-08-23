#!/usr/bin/env node
/**
 * Shape presets in the Boss Path editor, driven through the real UI.
 *
 * The geometry is already pinned by check_msx2_boss_path_shapes.mjs. What only
 * the UI can prove is the wiring around it: that the panel offers the shapes,
 * that the preview draws BEFORE anything is replaced, that generating actually
 * rewrites the node list, and — the one that would hurt — that a route carrying
 * node scripts is not thrown away without asking.
 *
 * Runs against a dev server (MIDEAS_UI_URL, default :5199).
 */
const { chromium } = require('playwright');
const { readFileSync, mkdirSync } = require('node:fs');
const { join, resolve } = require('node:path');

const repoRoot = resolve(__dirname, '..');
const URL = process.env.MIDEAS_UI_URL || 'http://localhost:5199/';
const HEADLESS = process.env.MIDEAS_UI_HEADED !== '1';
const FIXTURE = join(repoRoot, 'test', 'msx2-boss', 'fixture_boss_dark_room.json');
const OUT_DIR = join(repoRoot, 'test', 'msx2-boss', 'out');

const PATH_NAME = 'Circle Patrol';

/** The fixture has no path asset, so one is added exactly as the editor stores it. */
function withBossPath(project) {
  const copy = JSON.parse(JSON.stringify(project));
  copy.name = 'Boss Path Shapes Demo';
  copy.currentProjectName = copy.name;
  copy.assets.push({
    id: 'bosspath_demo',
    name: PATH_NAME,
    type: 'msx2bosspath',
    data: {
      id: 'bosspath_demo',
      name: PATH_NAME,
      nodes: [
        { id: 'node_1', x: 64, y: 32, actions: [] },
        { id: 'node_2', x: 160, y: 32, actions: [] },
      ],
      speedPxPerTick: 2,
      loopMode: 'loop',
      firing: 'auto',
    },
  });
  return copy;
}

(async () => {
  mkdirSync(OUT_DIR, { recursive: true });
  const projectJson = JSON.stringify(withBossPath(JSON.parse(readFileSync(FIXTURE, 'utf8'))));

  const browser = await chromium.launch({ headless: HEADLESS });
  const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
  const failures = [];
  const ok = (name, passed) => {
    console.log(`${passed ? 'OK  ' : 'FAIL'}: ${name}`);
    if (!passed) failures.push(name);
  };

  // Replacing a route is destructive, so the editor may ask. Accept and record.
  const dialogs = [];
  page.on('dialog', dialog => { dialogs.push(dialog.message()); dialog.accept(); });

  /** How many nodes the Nodes list is showing, i.e. what the route really holds. */
  const nodeCount = async () => {
    let count = 0;
    while (await page.getByRole('button', { name: String(count + 1), exact: true }).count()) count++;
    return count;
  };

  try {
    await page.addInitScript(project => {
      localStorage.setItem('mideas_recent_projects', JSON.stringify([
        { name: 'Boss Path Shapes Demo', path: 'fixture_boss_path_shapes.json', lastOpened: Date.now() },
      ]));
      localStorage.setItem('mideas_recent_projects_data', JSON.stringify({
        'fixture_boss_path_shapes.json': project,
      }));
    }, projectJson);

    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.getByRole('button', { name: 'File', exact: true }).click();
    await page.getByText('Open Recent').click();
    await page.getByText('Boss Path Shapes Demo', { exact: true }).click();
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Expand All' }).click();
    await page.waitForTimeout(500);
    const pathItem = page.getByText(PATH_NAME, { exact: true }).first();
    await pathItem.scrollIntoViewIfNeeded();
    await pathItem.click();
    await page.waitForTimeout(1500);

    const shapeSelect = page.locator('select:has(option:text-is("Star"))');

    ok('The editor offers a Shape panel', await shapeSelect.isVisible());
    ok('Round, cornered and open shapes are all on the menu',
      (await shapeSelect.locator('option').allTextContents()).join('|')
        === 'Circle|Ellipse|Rectangle|Polygon|Star|Zigzag|Figure 8 (∞)');
    ok('The shape is previewed over the route before it replaces anything',
      await page.getByText(/green trail is the shape waiting/).isVisible()
      && await nodeCount() === 2);

    // ---- generating rewrites the route --------------------------------------
    await shapeSelect.selectOption('star');
    await page.waitForTimeout(300);
    ok('Each shape asks only for the fields it uses: a star has points and an inner radius',
      await page.locator('label:text-is("Points")').isVisible()
      && await page.locator('label:text-is("Inner radius (%)")').isVisible());

    await page.locator('label:text-is("Points") + input').fill('5');
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /Generate route/ }).click();
    await page.waitForTimeout(600);
    ok('Generating a 5-point star leaves 10 nodes on the route', await nodeCount() === 10);
    ok('An unscripted route is replaced without nagging', dialogs.length === 0);

    // ---- the generated nodes are ordinary, editable nodes -------------------
    // The segment dropdown is on screen for every node, so only its VALUE says
    // anything: asking whether it exists would pass on a broken generator too.
    const segmentSelect = page.locator('select:has(option:text-is("Smooth curve"))');
    await page.getByRole('button', { name: '3', exact: true }).click();
    await page.waitForTimeout(300);
    ok('A generated node is editable like any other, and a star keeps its straight sides',
      await page.locator('label:text-is("x") + input').isVisible()
      && await segmentSelect.inputValue() === 'linear');

    await shapeSelect.selectOption('circle');
    await page.locator('label:text-is("Nodes") + input').fill('12');
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /Generate route/ }).click();
    await page.waitForTimeout(600);
    await page.getByRole('button', { name: '3', exact: true }).click();
    await page.waitForTimeout(300);
    ok('A circle arrives as 12 nodes joined by smooth curves',
      await nodeCount() === 12 && await segmentSelect.inputValue() === 'spline');

    // ---- a route with scripts is not thrown away silently -------------------
    await page.getByRole('button', { name: '+ Wait' }).click();
    await page.waitForTimeout(300);
    await shapeSelect.selectOption('rectangle');
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /Generate route/ }).click();
    await page.waitForTimeout(600);
    ok('Replacing a route that carries scripts asks first',
      dialogs.length === 1 && /script/i.test(dialogs[0]));
    ok('A rectangle leaves the four corners', await nodeCount() === 4);

    await page.screenshot({ path: join(OUT_DIR, 'boss_path_shapes.png'), fullPage: false });
    console.log(`\nScreenshot: ${join(OUT_DIR, 'boss_path_shapes.png')}`);
  } finally {
    await browser.close();
  }

  console.log(`\n${failures.length ? `${failures.length} check(s) failed` : 'all checks passed'}`);
  process.exit(failures.length ? 1 : 0);
})();
