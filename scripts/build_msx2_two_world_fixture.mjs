#!/usr/bin/env node
/**
 * Build the two-world fixture the per-world resource checks run on.
 *
 * WHY THIS EXISTS: the per-world atlas smoke used to read a hand-made project
 * that lived under test/**\/out/, which .gitignore excludes. The check ran fine
 * here and could not run at all on a clean clone -- and it is in
 * smoke:msx2-static. This derives the fixture from a COMMITTED base instead, so
 * anyone can reproduce it.
 *
 * What it does: takes a single-world bitmap-room project and gives it a second
 * world by cloning the worldmap under a new id and chaining a second WorldLink
 * after the first. The two worlds hold the same rooms, which is enough for every
 * structural property under test (one atlas per world, one upload body per
 * world, all loading at the same VRAM rows, the region sized by the biggest
 * world rather than the sum).
 *
 * It does NOT try to make the two worlds look different. A fixture where each
 * world has its own art would show a bigger saving, but nothing here asserts a
 * saving that this fixture cannot produce.
 *
 * Usage: node scripts/build_msx2_two_world_fixture.mjs [--out <path>]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const BASE = join(ROOT, 'test', 'msx2-boss', 'fixture_boss_anim_cells.json');
const outArg = process.argv.indexOf('--out');
const OUT = outArg > 0 ? resolve(process.argv[outArg + 1]) : join(ROOT, 'test', 'msx2-boss', 'out', 'two_worlds.json');

const project = JSON.parse(readFileSync(BASE, 'utf8'));
const assets = project.assets || [];

const flow = assets.find(asset => String(asset.type || '').toLowerCase().includes('gameflow'));
if (!flow) throw new Error(`${BASE} has no GameFlow asset`);
const nodes = flow.data?.nodes || [];
const connections = flow.data?.connections || [];
const firstLink = nodes.find(node => node.type === 'WorldLink');
if (!firstLink) throw new Error(`${BASE} has no WorldLink node`);

const worldIdOf = node => node.worldAssetId || node.data?.worldAssetId || node.data?.worldMapId;
const sourceWorldId = worldIdOf(firstLink);
const sourceWorld = assets.find(asset => asset.id === sourceWorldId)
  || (project.worldmaps || []).find(world => world.id === sourceWorldId);
if (!sourceWorld) throw new Error(`WorldLink points at "${sourceWorldId}", which does not exist`);

// A second world: the same rooms under a new id. The generator compiles a world
// per WorldLink, so this really is two worlds as far as everything under test is
// concerned -- two atlases, two upload bodies, one shared row range.
const clonedWorldId = `${sourceWorldId}_w2`;
const clonedWorld = JSON.parse(JSON.stringify(sourceWorld));
clonedWorld.id = clonedWorldId;
clonedWorld.name = `${sourceWorld.name || 'World'} (second)`;
// The identity the generator matches on is the one INSIDE data: the project
// summary hands it the unwrapped worldmap, so renaming only the asset wrapper
// leaves the WorldLink pointing at a world that "does not exist".
if (clonedWorld.data && typeof clonedWorld.data === 'object') {
  clonedWorld.data.id = clonedWorldId;
  if (clonedWorld.data.name) clonedWorld.data.name = clonedWorld.name;
}
if (assets.some(asset => asset.id === sourceWorldId)) assets.push(clonedWorld);
else (project.worldmaps = project.worldmaps || []).push(clonedWorld);

// Chain it after the first WorldLink, taking over that link's outgoing edge.
const secondLinkId = `${firstLink.id}_w2`;
const secondLink = JSON.parse(JSON.stringify(firstLink));
secondLink.id = secondLinkId;
if (secondLink.worldAssetId !== undefined) secondLink.worldAssetId = clonedWorldId;
if (secondLink.data) {
  if (secondLink.data.worldAssetId !== undefined) secondLink.data.worldAssetId = clonedWorldId;
  if (secondLink.data.worldMapId !== undefined) secondLink.data.worldMapId = clonedWorldId;
}
secondLink.position = { x: (firstLink.position?.x || 0) + 240, y: firstLink.position?.y || 0 };
nodes.push(secondLink);

const outgoing = connections.find(item => item?.from?.nodeId === firstLink.id && !item?.from?.sourceId);
if (outgoing) {
  connections.push({ ...JSON.parse(JSON.stringify(outgoing)), from: { nodeId: secondLinkId } });
  outgoing.to = { nodeId: secondLinkId };
} else {
  connections.push({ from: { nodeId: firstLink.id }, to: { nodeId: secondLinkId } });
}
flow.data.nodes = nodes;
flow.data.connections = connections;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(project));
console.log(`base:   ${BASE}`);
console.log(`world 0: "${sourceWorld.name || sourceWorldId}"`);
console.log(`world 1: "${clonedWorld.name}" (clone, reached through ${secondLinkId})`);
console.log(`wrote:  ${OUT}`);
