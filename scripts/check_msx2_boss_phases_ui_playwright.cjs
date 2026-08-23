#!/usr/bin/env node
/**
 * Attack Phases panel, driven through the real UI.
 *
 * The complaint this guards against: the phase table used to show the same
 * seven cramped columns to every boss, so a boss that only fires a LASER was
 * offered a bullet cadence and a bullet speed — two fields that genuinely do
 * nothing for it — and nothing that would make it angrier.
 *
 * Two projects are seeded from the same fixture: the boss as authored (sprite
 * bullets, no laser) and a laser-only variant. The panel must offer each of
 * them only what it can actually fire, and must say which HP band every phase
 * really covers.
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

/**
 * The Boss Editor authors a FLAT definition (`asset.data`), while this fixture
 * carries the generator's entity shape (`asset.data.params`). The generator
 * accepts both; the editor only reads the flat one, so the copies used here are
 * flattened exactly as a boss authored in the editor would be stored.
 */
function flattenBoss(project) {
  const copy = JSON.parse(JSON.stringify(project));
  const boss = copy.assets.find(asset => asset.type === 'msx2boss');
  if (!boss) throw new Error('fixture has no msx2boss asset');
  if (boss.data.params) boss.data = { id: boss.id, name: boss.name, ...boss.data.params };
  // The fixture boss has 3 hit points, so its three phases already sit on every
  // absolute threshold there is and a fourth one could only be a duplicate.
  // A real boss has room to escalate; give it some so the checks below mean
  // something.
  boss.data.bossHp = 30;
  return copy;
}

/** The same project with the bullets taken away and a 16x16 laser tile given. */
function laserOnlyVariant(project) {
  const copy = flattenBoss(project);
  const boss = copy.assets.find(asset => asset.type === 'msx2boss');
  const params = boss.data;
  delete params.bossProjectileKind;
  delete params.bossShootInterval;
  delete params.bossProjectileTileId;
  delete params.bossProjectileSpriteId;
  const room = copy.assets.find(asset => asset.type === 'msx2bitmaproom');
  if (!room) throw new Error('fixture has no bitmap room');
  // The fixture room carries no atlas, so the beam segment is injected here.
  // Only the rectangle matters to the phase panel: it asks the same question
  // the generator does — "is there a 16x16 tile this laser can repeat?".
  const atlas = room.data.atlas || (room.data.atlas = { entries: [], pixels: [] });
  atlas.entries = atlas.entries || [];
  let tile = atlas.entries.find(entry => entry.w === 16 && entry.h === 16);
  if (!tile) {
    tile = { id: 'laser_segment_16', name: 'Laser segment', sx: 0, sy: 0, w: 16, h: 16 };
    atlas.entries.push(tile);
  }
  params.bossLaserTileId = tile.id;
  params.bossLaserDirectionMask = 0x05;
  params.bossLaserInterval = 90;
  copy.name = 'Laser Only Boss Demo';
  copy.currentProjectName = copy.name;
  return copy;
}

(async () => {
  mkdirSync(OUT_DIR, { recursive: true });
  const project = JSON.parse(readFileSync(FIXTURE, 'utf8'));
  const bulletsJson = JSON.stringify(flattenBoss(project));
  const laserJson = JSON.stringify(laserOnlyVariant(project));

  const browser = await chromium.launch({ headless: HEADLESS });
  const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
  const failures = [];
  const ok = (name, passed) => {
    console.log(`${passed ? 'OK  ' : 'FAIL'}: ${name}`);
    if (!passed) failures.push(name);
  };

  const openBossPhases = async (label) => {
    await page.getByRole('button', { name: 'File', exact: true }).click();
    await page.getByText('Open Recent').click();
    await page.getByText(label, { exact: true }).click();
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Expand All' }).click();
    await page.waitForTimeout(500);
    const bossItem = page.getByText('Demon Guardian', { exact: true }).first();
    await bossItem.scrollIntoViewIfNeeded();
    await bossItem.click();
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'Attack Phases' }).click();
    await page.waitForTimeout(500);
  };

  try {
    await page.addInitScript(([bullets, laser]) => {
      localStorage.setItem('mideas_recent_projects', JSON.stringify([
        { name: 'Bullet Boss Demo', path: 'fixture_boss_phases.json', lastOpened: Date.now() },
        { name: 'Laser Only Boss Demo', path: 'fixture_boss_phases_laser.json', lastOpened: Date.now() - 1000 },
      ]));
      localStorage.setItem('mideas_recent_projects_data', JSON.stringify({
        'fixture_boss_phases.json': bullets,
        'fixture_boss_phases_laser.json': laser,
      }));
    }, [bulletsJson, laserJson]);

    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });

    // ---- 1. the boss as authored: sprite bullets, no laser -------------------
    await openBossPhases('Bullet Boss Demo');

    ok('The panel says what this boss fires',
      await page.getByText(/This boss fires:/).first().isVisible());
    ok('A bullet boss gets the bullet cadence',
      await page.getByText('Frames between shots').first().isVisible());
    ok('A bullet boss is offered a shot pattern, i.e. how MANY bullets go out',
      await page.getByText(/Shot pattern/).first().isVisible());
    ok('A bullet boss with no laser is NOT offered a laser cadence',
      (await page.getByText('Frames between laser waves').count()) === 0);
    ok('Every phase shows the HP band it really covers',
      (await page.getByText(/HP \d+ down to \d+ — phase \d+ of the fight/).count()) >= 3);
    ok('The escalation knobs every boss has are there',
      await page.getByText('Movement speed').first().isVisible()
      && await page.getByText('Body update every (frames)').first().isVisible());

    await page.screenshot({ path: join(OUT_DIR, 'attack_phases_bullets.png'), fullPage: false });

    // A new phase must not land on a threshold an existing one already owns.
    const before = await page.getByText(/HP \d+ down to \d+ — phase \d+ of the fight/).count();
    await page.getByRole('button', { name: '+ Add phase' }).click();
    await page.waitForTimeout(400);
    ok('Adding a phase creates a reachable one, not a dead duplicate',
      (await page.getByText(/HP \d+ down to \d+ — phase \d+ of the fight/).count()) === before + 1
      && (await page.getByText('never: an earlier phase already covers this HP').count()) === 0);

    // ---- 2. the same boss with only a laser ---------------------------------
    await openBossPhases('Laser Only Boss Demo');

    ok('A laser-only boss is told so',
      await page.getByText(/This boss fires:\s*laser only/).first().isVisible()
      || (await page.getByText('laser only').count()) > 0);
    ok('A laser-only boss gets the laser cadence per phase',
      await page.getByText('Frames between laser waves').first().isVisible());
    ok('A laser-only boss is NOT shown a bullet cadence it cannot use',
      (await page.getByText('Frames between shots').count()) === 0
      && (await page.getByText('Bullet speed (px/frame)').count()) === 0
      && (await page.getByText(/Shot pattern/).count()) === 0);
    ok('A laser-only boss keeps the route and movement knobs',
      await page.getByText('Movement speed').first().isVisible()
      && await page.getByText('Path').first().isVisible());

    await page.screenshot({ path: join(OUT_DIR, 'attack_phases_laser_only.png'), fullPage: false });
  } catch (error) {
    console.error(error);
    failures.push(`exception: ${error.message}`);
    await page.screenshot({ path: join(OUT_DIR, 'attack_phases_failure.png'), fullPage: false }).catch(() => {});
  } finally {
    await browser.close();
  }

  if (failures.length) {
    console.error(`\n${failures.length} Attack Phases UI check(s) failed.`);
    process.exit(1);
  }
  console.log('\nAttack Phases UI checks passed.');
})();
