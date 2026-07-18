import fs from 'node:fs';
import { buildHardwareSpriteLayersForFrame } from './utils/msxGenerator/generators/msx2/msx2Screen4Generator';

const project = JSON.parse(fs.readFileSync('C:/Users/salam/Downloads/test134.json', 'utf8'));
const asset = project.assets.find((item: any) => item.id === 'msx2sprite_lib_import_1782034709918');
for (let frame = 0; frame < asset.data.frames.length; frame++) {
  const layers = buildHardwareSpriteLayersForFrame(asset.data, 10, frame);
  console.log(JSON.stringify({
    frame,
    layerCount: layers.length,
    layers: layers.map((layer, index) => ({
      index,
      colors: layer.colors.map((value: number) => value.toString(16).padStart(2, '0')),
      nonzeroPatternBytes: layer.pattern.filter((value: number) => value !== 0).length,
    })),
  }, null, 2));
}
