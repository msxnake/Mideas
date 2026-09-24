#!/usr/bin/env node
/**
 * SCREEN 5 bitmap boss: SPIDER THREAD smoke fixture (Jordi 2026-09-22).
 *
 * Takes the boss-definition smoke project and hangs its boss from a spider
 * thread: the boss lowers itself 96px straight down from where it was placed,
 * then walks its patrol; the thread (1px, colour 8 red) is decorative and
 * ROM-only. This is the fixture for the OpenMSX probe that measures the
 * thread column in VRAM while the boss descends.
 *
 * Usage: node scripts/build_msx2_boss_thread_smoke.mjs
 * Then:  python scripts/build_mideas_unified_rom.py --json test/msx2-boss/fixture_boss_thread.json --rom-mode megarom
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const BASE_JSON = resolve(ROOT, 'test/msx2-boss/fixture_boss_def.json');
const OUT_JSON = resolve(ROOT, 'test/msx2-boss/fixture_boss_thread.json');

const THREAD_LENGTH = 96;
const THREAD_COLOR = 8; // red in the smoke palette

const project = JSON.parse(readFileSync(BASE_JSON, 'utf8'));
const assets = project.assets || (project.assets = []);

const bossAsset = assets.find(asset => asset.type === 'msx2boss');
if (!bossAsset) throw new Error('No msx2boss asset in the base project');

// Idempotent: the thread params land in the DEFINITION, so every placement of
// this boss hangs from its thread (they are not definition-owned overrides).
bossAsset.data.params.bossThreadLength = THREAD_LENGTH;
bossAsset.data.params.bossThreadColor = THREAD_COLOR;

// The boss must hang VERTICALLY: give the placed entity a Y patrol so the
// descent is visible against the room and the depth trigger can fire later.
for (const asset of assets) {
  const rooms = asset?.data?.rooms;
  if (!Array.isArray(rooms)) continue;
  for (const room of rooms) {
    for (const entity of room.entities || []) {
      if (entity?.id !== 'boss_smoke_1') continue;
      entity.components = entity.components || {};
      entity.components.msx2_movement = {
        mode: 'patrolY',
        direction: 1,
        boundsUnit: 'px',
        speed: 1,
        minY: 0,
        maxY: 96,
      };
    }
  }
}

writeFileSync(OUT_JSON, JSON.stringify(project, null, 2) + '\n');
console.log(`Thread fixture written: ${OUT_JSON}`);
console.log(`Build with: python scripts/build_mideas_unified_rom.py --json ${OUT_JSON} --rom-mode megarom`);
