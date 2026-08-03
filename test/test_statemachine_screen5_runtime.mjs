/**
 * End-to-end regression: linked Player Controls -> SCREEN 5 State Machine ASM.
 *
 * Uses the real bitmap-room fixture whose Player Config enables only Left,
 * Right, Button A, Button B and F2/Pause. Adds an F2 transition in memory,
 * generates united ASM and compiles it with Glass.
 */

import * as esbuild from 'esbuild';
import { execFileSync } from 'child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const fixturePath = resolve(repoRoot, 'test/msx2-destroy/fixture_base.json');
const outDir = resolve(repoRoot, 'server/temp/statemachine-player-controls');
const asmPath = resolve(outDir, 'statemachine_player_controls.asm');
const romPath = resolve(outDir, 'statemachine_player_controls.rom');
const glassPath = resolve(repoRoot, 'server/glass.jar');

const project = JSON.parse(readFileSync(fixturePath, 'utf8'));
const assets = structuredClone(project.assets);
const stateMachineAsset = assets.find(asset => asset.type === 'statemachine' && asset.id === 'player_main_sm');
if (!stateMachineAsset) throw new Error('Fixture State Machine player_main_sm not found');
const playerAsset = assets.find(asset => asset.type === 'msx2player');
if (!playerAsset?.data?.player) throw new Error('Fixture MSX2 Player not found');
const walkingSprite = assets.find(asset => asset.type === 'msx2sprite' && asset.name === 'player1 2 2');
if (!walkingSprite) throw new Error('Fixture walking sprite not found');

// Graphics & Render owns the state -> render mapping. The State Machine only
// changes state according to its transition conditions.
playerAsset.data.player.animations = {
  walk: {
    role: 'walk',
    spriteAssetId: walkingSprite.id,
    stateMachineState: 'WALK',
    frames: [0, 1, 2],
    speed: 8,
  },
};
playerAsset.data.player.animationOrder = ['walk'];
playerAsset.data.player.render.stateSprites = {};

stateMachineAsset.data.states = [
  {
    id: 'IDLE',
    name: 'Idle',
    properties: {},
  },
  {
    id: 'WALK',
    name: 'Walking',
    properties: {},
  },
  { id: 'MAP', name: 'Map', properties: {} },
];
stateMachineAsset.data.transitions = [
  {
    id: 'idle_to_walk_right',
    fromStateId: 'IDLE',
    toStateId: 'WALK',
    conditions: { type: 'KEY_PRESSED', params: { key: 'right' } },
    actions: [],
  },
  {
    id: 'walk_to_idle_right_release',
    fromStateId: 'WALK',
    toStateId: 'IDLE',
    conditions: { type: 'KEY_RELEASED', params: { key: 'right' } },
    actions: [],
  },
  {
    id: 'idle_to_map_f2',
    fromStateId: 'IDLE',
    toStateId: 'MAP',
    conditions: { type: 'KEY_PRESSED', params: { key: 'f2' } },
    actions: [],
  },
  {
    id: 'map_to_idle_f2_release',
    fromStateId: 'MAP',
    toStateId: 'IDLE',
    conditions: { type: 'KEY_RELEASED', params: { key: 'f2' } },
    actions: [],
  },
];

mkdirSync(outDir, { recursive: true });
const bundle = await esbuild.build({
  entryPoints: [resolve(repoRoot, 'utils/msxGenerator/index.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
  external: ['react', 'react-dom', '@xyflow/react', 'jszip', 'axios', 'lucide-react', 'twgl.js'],
});
const generator = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const files = generator.generateModularASM('StateMachine_Player_Controls', assets, {
  generateUnified: true,
  romMode: 'megarom',
  targetFormat: 'konami',
  screenMode: 'SCREEN 4 (Graphics II)',
  targetGraphicsBackend: 'msx2-screen4-bitmap-room',
});
const asm = files['unitedFiles.asm'];
if (!asm) throw new Error('Generator did not emit unitedFiles.asm');
if (!asm.includes('bitmap_update_player_state_machine:')) throw new Error('SCREEN 5 State Machine runtime missing');
if (!asm.includes('F2, matrix row 6, mask #40')) throw new Error('F2 Player control was not emitted');
if (!asm.includes('call bitmap_update_player_state_machine')) throw new Error('State Machine runtime is not called by the bitmap loop');
if (!asm.includes('bitmap_sm_state EQU')) throw new Error('State Machine RAM state was not allocated');
if (!/bitmap_update_player_state_machine:\s+ld a, \(bitmap_sm_state\)/.test(asm)) {
  throw new Error('State Machine animation dispatch does not load bitmap_sm_state');
}
if (!asm.includes('1=WALK(base 2,3f)')) {
  throw new Error('Walking Graphics & Render state link was not packed as animation clip 1');
}
if (!/\.bitmap_sm_anim_1:\s+ld a, 1\s+jp \.bitmap_sm_anim_store/.test(asm)) {
  throw new Error('Walking state does not select its Graphics & Render clip');
}

writeFileSync(asmPath, asm);
execFileSync('java', ['-jar', glassPath, asmPath, romPath], { stdio: 'inherit' });

console.log(JSON.stringify({ asm: asmPath, rom: romPath }, null, 2));
