import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'builds', 'msx2_screen4_snake_demo.json');
const outPath = path.join(root, 'json', 'snake_supervisor_msx2.json');

if (!fs.existsSync(sourcePath)) {
  throw new Error(`Missing Snake template: ${sourcePath}`);
}

const project = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

project.name = 'snake_supervisor_msx2';
project.currentProjectName = 'snake_supervisor_msx2';
project.selectedAssetId = 'screen_snake';
project.currentEditor = 'Msx2Screen';
project.mainMenuConfig = {
  title: 'SNAKE SUPERVISOR',
  subtitle: 'SCREEN 4 snakeChar runtime',
  isEnabled: false,
  options: ['START'],
  selectedOptionIndex: 0,
  keyMapping: {
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight',
    fire1: ' ',
    fire2: 'm',
  },
};

for (const asset of project.assets || []) {
  if (asset.type === 'msx2screen' && asset.data?.id === 'screen_snake') {
    asset.name = 'Snake Supervisor Arena';
    asset.data.name = 'Snake Supervisor Arena';
    const width = Number(asset.data.widthTiles || 16);
    const height = Number(asset.data.heightTiles || 12);
    const wallTileIndex = Math.max(0, asset.data.tiles?.findIndex(tile => /wall/i.test(`${tile?.id || ''} ${tile?.name || ''}`)) ?? 3);
    asset.data.map = Array.from({ length: height }, (_row, y) =>
      Array.from({ length: width }, (_col, x) => {
        if (x === 0 || y === 0 || x === width - 1 || y === height - 1) return wallTileIndex;
        return Number(asset.data.map?.[y]?.[x] || 0);
      })
    );
    const collision = Array.from({ length: height }, (_row, y) =>
      Array.from({ length: width }, (_col, x) => (x === 0 || y === 0 || x === width - 1 || y === height - 1 ? 1 : 0))
    );
    asset.data.collisionMap = collision;
    asset.data.layers = {
      ...asset.data.layers,
      collision,
    };
    asset.data.runtime = {
      ...asset.data.runtime,
      screenKind: 'playable',
      screenEngine: 'snakeChar',
      movementMode: 'snakeChar',
      requiredCollectibles: 0,
      initialAir: 0,
      hideHud: true,
    };
    asset.data.notes = 'Grid Snake for MSX2 SCREEN 4: cursor keys steer the snake, food grows the body, walls and self-collision end the run.';
  }

  if (asset.type === 'worldmap' && asset.data?.id === 'world_snake') {
    asset.name = 'Snake Supervisor World';
    asset.data.name = 'Snake Supervisor World';
  }

  if (asset.type === 'gameflow' && asset.data?.id === 'gameflow_snake') {
    asset.name = 'Snake Supervisor Main';
    asset.data.name = 'Snake Supervisor Main';
  }
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(project, null, 2)}\n`, 'utf8');

console.log(outPath);
