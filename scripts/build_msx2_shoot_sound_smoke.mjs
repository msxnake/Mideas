#!/usr/bin/env node
/**
 * SCREEN 5 bitmap SHOOT skill: AUTHORED SHOT SOUND smoke fixture.
 *
 * The built-in pew needs no fixture — every project with the skill gets it. What
 * does need one is the other branch: a Sound Editor asset chosen as the shot
 * sound, which is compiled into a step stream and played by a sequencer ticked
 * once per frame.
 *
 * Takes the lighting fixture (its player already has `shoot`), gives it a
 * three-step laser asset and points `soundAssetIds.onShoot` at it.
 *
 * Usage: node scripts/build_msx2_shoot_sound_smoke.mjs
 * Then:  python -B scripts/build_mideas_unified_rom.py --json test/msx2-shoot/fixture_shot_sound.json --rom-mode megarom
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const BASE_JSON = resolve(ROOT, 'test/msx2-lighting/mina_mushrooms.json');
const OUT_DIR = resolve(ROOT, 'test/msx2-shoot');
const OUT_JSON = resolve(OUT_DIR, 'fixture_shot_sound.json');

const SOUND_ID = 'sfx_shot_laser';

/** One step of a PSG asset, with only the fields the compiler reads. */
const step = (tonePeriod, volume, durationMs, extra = {}) => ({
  tonePeriod,
  volume,
  durationMs,
  toneEnabled: true,
  noiseEnabled: false,
  useEnvelope: false,
  envelopeShape: 0,
  ...extra,
});

const project = JSON.parse(readFileSync(BASE_JSON, 'utf8'));
project.name = 'Shoot Sound Smoke';
project.currentProjectName = project.name;

// A descending three-step zap: distinct periods so the compiled records cannot
// all be the same bytes, which is what makes the stream worth checking.
project.assets.push({
  id: SOUND_ID,
  name: 'Laser shot',
  type: 'sound',
  data: {
    id: SOUND_ID,
    name: 'Laser shot',
    tempoBPM: 120,
    noisePeriod: 0,
    envelopePeriod: 0,
    envelopeShape: 0,
    masterVolume: 1,
    channels: [
      { id: 'A', steps: [], loop: false },
      { id: 'B', steps: [], loop: false },
      {
        id: 'C',
        loop: false,
        steps: [step(0x40, 14, 40), step(0x80, 10, 40), step(0x140, 6, 60)],
      },
    ],
  },
});

const playerAsset = project.assets.find(asset => asset.type === 'msx2player');
if (!playerAsset) throw new Error('base fixture has no msx2player asset');
// The player asset is WRAPPED: the definition lives in data.player.
const player = playerAsset.data?.player || playerAsset.data;
const skills = Array.isArray(player.activeSkills) ? player.activeSkills : [];
if (!skills.includes('shoot')) throw new Error('base fixture player does not have the shoot skill');
player.soundAssetIds = { ...(player.soundAssetIds || {}), onShoot: SOUND_ID };
player.skillParameters = {
  ...(player.skillParameters || {}),
  shoot: { ...((player.skillParameters || {}).shoot || {}), shootSound: true },
};

// No music. The runtime reserves PSG channel C for effects "by convention",
// which only holds for tracks authored that way: the base fixture's song writes
// channel C's volume every frame, and a probe reading the chip could then not
// tell the shot from the music.
project.assets = project.assets.filter(asset => asset.type !== 'track');

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_JSON, JSON.stringify(project, null, 2));
console.log(`Wrote ${OUT_JSON}`);
console.log(`  player "${playerAsset.name}" fires with the authored sound "${SOUND_ID}" (3 steps on channel C)`);

// The same project with no asset chosen, i.e. the other branch: the built-in
// pew, which is written straight to the chip and owns no RAM at all.
const builtIn = JSON.parse(JSON.stringify(project));
builtIn.name = 'Shoot Sound Builtin Smoke';
builtIn.currentProjectName = builtIn.name;
builtIn.assets = builtIn.assets.filter(asset => asset.id !== SOUND_ID);
const builtInPlayerAsset = builtIn.assets.find(asset => asset.type === 'msx2player');
const builtInPlayer = builtInPlayerAsset.data?.player || builtInPlayerAsset.data;
delete builtInPlayer.soundAssetIds.onShoot;
const BUILTIN_JSON = resolve(OUT_DIR, 'fixture_shot_sound_builtin.json');
writeFileSync(BUILTIN_JSON, JSON.stringify(builtIn, null, 2));
console.log(`Wrote ${BUILTIN_JSON}`);
console.log('  same player with no asset chosen: the built-in pew');
