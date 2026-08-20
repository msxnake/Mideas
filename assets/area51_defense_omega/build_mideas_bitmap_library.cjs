const fs = require('fs');
const path = require('path');

const sourcePath = 'C:/Users/salam/Downloads/test534-area51-omega.json';
const outputPath = path.join(__dirname, 'area51-defense-omega-bitmap-library.json');
const project = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

const paletteAsset = project.assets.find(
  (asset) => asset.type === 'palette' && asset.name === 'Area51 Defense Omega Palette',
);
if (!paletteAsset) throw new Error('Area51 palette asset not found.');

const entries = project.assets
  .filter((asset) => asset.type === 'msx2bitmaptile' && asset.name.startsWith('A51 Omega - '))
  .map((asset, index) => ({
    id: `area51_omega_library_${String(index + 1).padStart(2, '0')}`,
    name: asset.name,
    savedAt: Date.UTC(2026, 7, 18, 17, 0, index),
    tile: {
      ...asset.data,
      id: `area51_omega_library_${String(index + 1).padStart(2, '0')}`,
      name: asset.name,
      paletteId: 'area51_omega_library_palette',
    },
    palette: paletteAsset.data.slots,
  }));

if (entries.length !== 16) {
  throw new Error(`Expected 16 Area51 bitmap tiles, found ${entries.length}.`);
}

fs.writeFileSync(outputPath, `${JSON.stringify({ version: 1, entries }, null, 2)}\n`);
console.log(outputPath);
