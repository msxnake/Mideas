import fs from 'node:fs';
import path from 'node:path';

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const inputPath = path.resolve(args.get('--input') || '');
const outputPath = path.resolve(args.get('--output') || '');
const projectName = args.get('--project-name') || path.basename(outputPath, path.extname(outputPath));
if (!inputPath || !outputPath || inputPath === outputPath) {
  throw new Error('Use --input <project.json> --output <new-project.json>; output must be different.');
}

const project = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const huds = (project.assets || []).filter((asset) => asset.type === 'msx2hud');
if (!huds.length) throw new Error('The project has no msx2hud assets.');

const removedLayers = [];
for (const hud of huds) {
  const layers = Array.isArray(hud.data?.layers) ? hud.data.layers : [];
  const keyCounters = layers.filter((layer) => layer.name === 'Key Count');
  const keyStatuses = layers.filter((layer) => layer.name === 'Key Status');
  const existingCombinedKey = layers.find((layer) => layer.name === 'Key Counter');
  if ((!existingCombinedKey && (keyCounters.length !== 1 || keyStatuses.length !== 1))
      || (existingCombinedKey && (keyCounters.length || keyStatuses.length))) {
    throw new Error(`Expected either Key Counter or the Key Count/Key Status pair in HUD ${hud.id}.`);
  }

  const keyCounter = existingCombinedKey || keyCounters[0];
  const keyStatus = keyStatuses[0];
  Object.assign(keyCounter.element, {
    kind: 'iconCounter',
    x: 88,
    y: 2,
    width: 48,
    height: 16,
    atlasEntryId: keyStatus?.element.atlasEntryId || keyCounter.element.atlasEntryId,
    align: { h: 'left', v: 'middle' },
    format: { digits: 2, base: 'dec', zeroPad: false, prefix: 'x' },
  });
  keyCounter.name = 'Key Counter';

  hud.data.layers = keyStatus ? layers.filter((layer) => layer !== keyStatus) : layers;
  if (keyStatus) removedLayers.push({ hudId: hud.id, layerId: keyStatus.id });

  const byName = new Map(hud.data.layers.map((layer) => [layer.name, layer]));
  const gemCounter = byName.get('Gem Counter');
  const nutCounter = byName.get('Nut Counter');
  if (![gemCounter, nutCounter].every(Boolean)) {
    throw new Error(`HUD ${hud.id} is missing Gem Counter or Nut Counter.`);
  }

  Object.assign(gemCounter.element, {
    kind: 'iconCounter',
    x: 142,
    y: 2,
    width: 48,
    height: 16,
    binding: 'collectibles',
  });
  nutCounter.element.x = 196;
  nutCounter.element.width = 56;
  hud.data.notes = `${hud.data.notes || ''} Llave unificada en un iconCounter para conservar icono y cantidad usando una sola rutina dinamica.`.trim();
}

project.currentProjectName = projectName;
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(project)}\n`, 'utf8');

console.log(JSON.stringify({
  inputPath,
  outputPath,
  projectName,
  hudIds: huds.map((hud) => hud.id),
  removedLayers,
  outputBytes: fs.statSync(outputPath).size,
}, null, 2));
