import fs from 'node:fs';

const [projectPath, manifestPath] = process.argv.slice(2);
if (!projectPath || !manifestPath) {
  throw new Error('Usage: node update_test556_laser_assets.mjs <test556.json> <laser-pixels.json>');
}

const project = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const assets = Array.isArray(project.assets) ? project.assets : [];
const findAsset = id => assets.find(asset => asset.id === id);
const now = new Date().toISOString();

const sourceIds = {
  horizontal: 'bitmap_tile_screen5_area51_omega_laser_horizontal_20260818',
  vertical: 'bitmap_tile_screen5_area51_omega_laser_vertical_20260818',
};
const atlasIds = {
  horizontal: 'atlas_area51_omega_laser_horizontal',
  vertical: 'atlas_area51_omega_laser_vertical',
};

for (const axis of ['horizontal', 'vertical']) {
  const source = findAsset(sourceIds[axis]);
  if (!source?.data) throw new Error(`Missing source asset: ${sourceIds[axis]}`);
  const pixelData = manifest[axis]?.pixelData;
  if (!Array.isArray(pixelData) || pixelData.length !== 256) {
    throw new Error(`${axis} pixelData must contain exactly 256 values`);
  }
  source.data.width = 16;
  source.data.height = 16;
  source.data.mode = 'SCREEN5_BITMAP';
  source.data.sourceType = 'imagegen-quantized-seamless';
  source.data.pixelData = pixelData;
  source.data.updatedAt = now;
  source.data.notes = `Continuous 16x16 ${axis} laser center segment. ${axis === 'horizontal' ? 'Left/right edge columns match for seamless E/W repetition.' : 'Top/bottom edge rows match for seamless N/S repetition.'}`;
}

const room = findAsset('bitmap_room_area51_defense_omega_20260818')?.data;
if (!room?.atlas?.entries || !Array.isArray(room.atlas.pixels)) {
  throw new Error('Area51 bitmap room atlas is missing or malformed');
}
if (room.atlas.width !== 256 || room.atlas.pixels.some(row => !Array.isArray(row) || row.length !== 256)) {
  throw new Error('Expected a 256-wide row-major room atlas');
}

for (const axis of ['horizontal', 'vertical']) {
  const entry = room.atlas.entries.find(candidate => candidate.id === atlasIds[axis]);
  if (!entry || entry.w !== 16 || entry.h !== 16) throw new Error(`Missing 16x16 atlas entry: ${atlasIds[axis]}`);
  const pixelData = manifest[axis].pixelData;
  for (let y = 0; y < 16; y += 1) {
    for (let x = 0; x < 16; x += 1) {
      room.atlas.pixels[entry.sy + y][entry.sx + x] = pixelData[y * 16 + x];
    }
  }
  entry.sourceAssetId = sourceIds[axis];
}

const tempPath = `${projectPath}.laser-assets.tmp`;
fs.writeFileSync(tempPath, `${JSON.stringify(project, null, 2)}\n`, 'utf8');
fs.renameSync(tempPath, projectPath);

console.log(JSON.stringify({
  projectPath,
  updatedSources: Object.values(sourceIds),
  updatedAtlasEntries: Object.values(atlasIds),
  horizontalEdgesMatch: manifest.horizontal.pixelData.every((value, index, data) => index % 16 !== 15 || value === data[index - 15]),
  verticalEdgesMatch: manifest.vertical.pixelData.every((value, index, data) => index < 240 || value === data[index - 240]),
}));
