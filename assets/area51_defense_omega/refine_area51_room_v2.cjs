const fs = require('fs');

const sourcePath = 'C:/Users/salam/Downloads/test534-area51-omega.json';
const outputPath = 'C:/Users/salam/Downloads/test534-area51-omega-v2.json';
const project = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

const roomAsset = project.assets.find(
  (asset) => asset.type === 'msx2bitmaproom' && asset.name === 'Area51 - Camara Defensa Omega',
);
if (!roomAsset) throw new Error('Area51 room not found.');

// Fill the playable area with the dark wall-panel tile, then overlay the hazards.
// The resulting layout keeps a readable safe lane while making the laser/rocket
// defence system much closer to the approved sketch.
const tileGrid = [
  [8, 7, 7,15, 7, 7, 7, 7, 7, 7, 7, 7,15, 7, 7, 8],
  [8, 2, 1, 1, 3, 1, 2,13,13, 2, 1, 3, 1, 1, 2, 8],
  [8,11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,11, 8],
  [8, 1, 9, 9, 9, 1,10, 1, 1,10, 1, 9, 9, 9, 1, 8],
  [8, 1, 1, 1, 1, 1,10, 1, 1,10, 1, 1, 1, 1, 1, 8],
  [8,11, 9, 9, 9, 1,10, 1, 1,10, 1, 9, 9, 9,11, 8],
  [8, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 8],
  [8, 1, 9, 9, 9, 1,10, 1, 1,10, 1, 9, 9, 9, 1, 8],
  [8,12, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 1,12, 8],
  [8, 2, 1, 1, 3, 1, 2, 1, 1, 2, 1, 3, 1, 1, 2, 8],
  [8, 6, 6, 5, 5, 6, 6, 5, 5, 6, 6, 5, 5, 6, 6, 8],
  [8, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 8],
];

const atlasEntries = roomAsset.data.atlas.entries;
if (!Array.isArray(atlasEntries) || atlasEntries.length !== 16) {
  throw new Error(`Expected 16 atlas entries, found ${atlasEntries?.length ?? 0}.`);
}

const deadlyNames = new Set([
  'laser_horizontal',
  'laser_vertical',
  'rocket_launcher',
  'turret_base',
]);
for (const entry of atlasEntries) {
  if (deadlyNames.has(entry.name)) entry.collisionFlags = 0x40;
}

const commands = [];
const collision = [];
const behavior = [];
for (let y = 0; y < tileGrid.length; y += 1) {
  const collisionRow = [];
  const behaviorRow = [];
  for (let x = 0; x < tileGrid[y].length; x += 1) {
    const tileIndex = tileGrid[y][x] - 1;
    const entry = atlasEntries[tileIndex];
    if (!entry) throw new Error(`Missing atlas entry for tile ${tileGrid[y][x]}.`);
    commands.push({
      id: `area51_omega_v2_tile_${x}_${y}`,
      op: 'copy',
      atlasEntryId: entry.id,
      dx: x * 16,
      dy: y * 16,
      w: 16,
      h: 16,
    });
    collisionRow.push(Number(entry.collisionFlags) || 0);
    behaviorRow.push(Number(entry.behaviorCode) || 0);
  }
  collision.push(collisionRow);
  behavior.push(behaviorRow);
}

roomAsset.data.tileGrid = tileGrid;
roomAsset.data.composition = {
  ...roomAsset.data.composition,
  source: 'tile-grid',
  commands,
};
roomAsset.data.collision = collision;
roomAsset.data.behavior = behavior;
roomAsset.data.notes = [
  roomAsset.data.notes,
  'V2: denser laser corridors, four rocket launch points, central safe lane, deadly hazard flags.',
].filter(Boolean).join('\n');

project.currentProjectName = 'test534-area51-omega-v2';
project.selectedAssetId = roomAsset.id;
fs.writeFileSync(outputPath, JSON.stringify(project));
console.log(outputPath);
