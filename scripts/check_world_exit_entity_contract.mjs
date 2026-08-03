import fs from 'node:fs';
import path from 'node:path';
import * as esbuild from 'esbuild';

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

async function loadGenerator() {
  const bundle = await esbuild.build({
    entryPoints: [path.join(root, 'utils/msxGenerator/index.ts')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    write: false,
    external: ['react', 'react-dom', '@xyflow/react', 'jszip', 'axios', 'lucide-react', 'twgl.js'],
  });
  const encoded = Buffer.from(bundle.outputFiles[0].text).toString('base64');
  return import(`data:text/javascript;base64,${encoded}`);
}

const emptyLayer = () => Array.from(
  { length: 24 },
  () => Array.from({ length: 32 }, () => ({ tileId: null })),
);

function buildAssets() {
  const playerTemplate = {
    id: 'tpl_contract_player',
    name: 'Contract Player',
    isPlayer: true,
    components: [
      { definitionId: 'comp_pos', defaultValues: { x: 8, y: 8 } },
      { definitionId: 'comp_collision', defaultValues: { hitboxWidth: 16, hitboxHeight: 16, collisionLayer: 1, collidesWith: 0 } },
      { definitionId: 'comp_player_input', defaultValues: { controllerId: 0, inputEnabled: true } },
      { definitionId: 'comp_jump', defaultValues: { jumpPower: 384, maxJumps: 1, trigger: 'fire' } },
    ],
  };
  const exitTemplate = {
    id: 'tpl_world_exit',
    name: 'World Exit Door',
    components: [
      { definitionId: 'comp_pos', defaultValues: { x: 8, y: 8 } },
      { definitionId: 'comp_collision', defaultValues: { hitboxWidth: 16, hitboxHeight: 16, collisionLayer: 64, collidesWith: 0, isTrigger: true } },
      { definitionId: 'comp_world_exit', defaultValues: { enabled: true } },
    ],
  };
  const screen = {
    id: 'screen_world_exit_contract',
    name: 'World Exit Contract Screen',
    width: 32,
    height: 24,
    layers: {
      background: emptyLayer(),
      collision: emptyLayer(),
      effects: emptyLayer(),
      entities: [
        { id: 'entity_contract_player', name: 'Player', entityTemplateId: playerTemplate.id, position: { x: 8, y: 8 }, componentOverrides: {} },
        { id: 'entity_contract_exit', name: 'Exit', entityTemplateId: exitTemplate.id, position: { x: 8, y: 8 }, componentOverrides: {} },
      ],
    },
    effectZones: [],
    activeAreaX: 0,
    activeAreaY: 0,
    activeAreaWidth: 32,
    activeAreaHeight: 24,
  };
  const world = {
    id: 'world_world_exit_contract',
    name: 'World Exit Contract World',
    nodes: [{ id: 'world_node_contract', screenAssetId: screen.id, name: screen.name, position: { x: 0, y: 0 } }],
    connections: [],
    startScreenNodeId: 'world_node_contract',
  };
  const gameFlow = {
    id: 'gameflow_world_exit_contract',
    name: 'World Exit Contract Flow',
    startNodeId: 'flow_start',
    nodes: [
      { id: 'flow_start', type: 'Start', position: { x: 0, y: 0 } },
      { id: 'flow_world', type: 'WorldLink', worldAssetId: world.id, position: { x: 160, y: 0 } },
      { id: 'flow_end', type: 'End', message: 'DONE', waitForKey: false, position: { x: 320, y: 0 } },
    ],
    connections: [
      { id: 'flow_start_world', from: { nodeId: 'flow_start', sourceId: 'out' }, to: { nodeId: 'flow_world' } },
      { id: 'flow_world_end', from: { nodeId: 'flow_world', sourceId: 'out' }, to: { nodeId: 'flow_end' } },
    ],
  };

  return [
    { id: playerTemplate.id, name: playerTemplate.name, type: 'entitytemplate', data: playerTemplate },
    { id: exitTemplate.id, name: exitTemplate.name, type: 'entitytemplate', data: exitTemplate },
    { id: screen.id, name: screen.name, type: 'screenmap', data: screen },
    { id: world.id, name: world.name, type: 'worldmap', data: world },
    { id: gameFlow.id, name: gameFlow.name, type: 'gameflow', data: gameFlow },
  ];
}

const generator = await loadGenerator();
const originalLog = console.log;
let files;
try {
  console.log = () => {};
  files = generator.generateModularASM('World_Exit_Contract', buildAssets(), {
    generateUnified: true,
    screenMode: 'SCREEN 2 (Graphics I)',
    targetGraphicsBackend: 'screen2-tilebank',
    romMode: 'simple32k',
    targetFormat: 'konami',
    executionMode: 'gameLoopHalt',
    interruptDrivenComponents: false,
  });
} finally {
  console.log = originalLog;
}

const entities = files['entities.asm'] || '';
const components = files['components.asm'] || '';
const componentRuntime = `${components}\n${files['interrupt.asm'] || ''}`;
const variables = files['variables.asm'] || '';
const unified = files['unitedFiles.asm'] || '';
const preview = read('components/modals/GameFlowPreviewModal.tsx');
const defaults = read('data/defaults.ts');
const projectLoader = read('handlers/useProjectHandlers.tsx');

const checks = [
  ['default World Exit component', defaults.includes('id: "comp_world_exit"')],
  ['default World Exit Door template', defaults.includes('id: "tpl_world_exit"')],
  ['legacy project template migration', projectLoader.includes("template.id === 'tpl_world_exit'")],
  ['Preview requests GameFlow exit on overlap', preview.includes('if (isWorldExitPair)') && preview.includes('gameFlowExitRequestedRef.current = true')],
  ['entity RAM flags emitted', variables.includes('entity_world_exit') && variables.includes('coll_world_exit_pair')],
  ['player and exit markers initialized', entities.includes('ld (hl), 1                 ; Player/hero marker from template') && entities.includes('ld (hl), 1                 ; Exit active WorldLink on Player overlap')],
  ['collision masks bypassed for special pair', componentRuntime.includes('.world_exit_pair:') && componentRuntime.includes('jp .layer_masks_ok')],
  ['collision requests WorldLink exit', componentRuntime.includes('ld (gameflow_exit_requested), a')],
  ['unified ASM generated', unified.includes('entity_world_exit') && unified.includes('gameflow_exit_requested')],
];

const failures = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) {
  console.log(`${ok ? 'ok' : 'FAIL'} - ${name}`);
}
if (failures.length > 0) {
  console.error(`generated files: ${Object.keys(files).join(', ')}`);
  process.exit(1);
}

const outputPath = path.join(root, 'server/temp/world_exit_contract.asm');
fs.writeFileSync(outputPath, unified, 'utf8');
console.log(`generated - ${outputPath}`);
