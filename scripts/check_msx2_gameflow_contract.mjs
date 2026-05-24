import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const checks = [];
const addCheck = (name, ok, detail = '') => checks.push({ name, ok, detail });

const types = read('types.ts');
const projectTarget = read('utils/projectTarget.ts');
const assetHandlers = read('handlers/useAssetHandlers.tsx');
const toolbar = read('components/layout/Toolbar.tsx');
const explorer = read('components/tools/FileExplorerPanel.tsx');
const appUi = read('components/AppUI.tsx');
const editor = read('components/editors/Msx2GameFlowEditor.tsx');
const gameFlowEditor = read('components/editors/GameFlowEditor.tsx');
const summaryExtractor = read('utils/summaryExtractor.ts');
const asmTemplate = read('utils/asmTemplateGenerator.ts');
const generatorIndex = read('utils/msxGenerator/index.ts');
const screen5PresentationGenerator = read('utils/msxGenerator/generators/msx2/msx2Screen5PresentationGenerator.ts');
const gameflowCase = assetHandlers.match(/case 'gameflow':[\s\S]*?break;/)?.[0] || '';
const msx2GameflowCase = assetHandlers.match(/case 'msx2gameflow':[\s\S]*?break;/)?.[0] || '';

addCheck('types declare Msx2GameFlowGraph', /interface\s+Msx2GameFlowGraph/.test(types));
addCheck('types declare Msx2GameFlowNode union', /type\s+Msx2GameFlowNode\s*=/.test(types));
addCheck('EditorType includes Msx2GameFlow', /Msx2GameFlow\s*=\s*"Msx2GameFlow"/.test(types));
addCheck('ProjectAsset type includes msx2gameflow', /type:\s*[^;]*'msx2gameflow'/.test(types));
addCheck('ProjectAsset data includes Msx2GameFlowGraph', /data\?:[^;]*Msx2GameFlowGraph/.test(types));
addCheck('MSX2 target gates msx2gameflow', /MSX2_ONLY_ASSET_TYPES[\s\S]*'msx2gameflow'/.test(projectTarget));
addCheck('asset handler creates msx2gameflow', /case\s+'msx2gameflow'/.test(assetHandlers));
addCheck('asset handler opens Msx2GameFlow editor', /newEditorType\s*=\s*EditorType\.Msx2GameFlow/.test(assetHandlers));
addCheck('MSX1 gameflow handler does not open MSX2 editor', !gameflowCase.includes('Msx2GameFlow'));
addCheck('MSX1 gameflow handler does not create MSX2 target data', !gameflowCase.includes("target: 'MSX2'"));
addCheck('MSX1 gameflow handler still opens MSX1 editor', gameflowCase.includes('EditorType.GameFlow'));
addCheck('MSX2 gameflow handler does not use MSX1 GameFlowGraph cast', !/\bas\s+GameFlowGraph\b/.test(msx2GameflowCase));
addCheck('MSX2 gameflow handler opens only MSX2 editor', msx2GameflowCase.includes('EditorType.Msx2GameFlow') && !msx2GameflowCase.includes('EditorType.GameFlow'));
addCheck('MSX2 gameflow default includes SCREEN 5 node', msx2GameflowCase.includes("type: 'Screen5Presentation'"));
addCheck('MSX2 gameflow default includes End node', msx2GameflowCase.includes("type: 'End'"));
addCheck('MSX2 gameflow default creates two connections', (msx2GameflowCase.match(/from:\s*\{\s*nodeId:/g) || []).length >= 2);
addCheck('toolbar exposes MSX2 Game Flow', /MSX2 Game Flow/.test(toolbar) && /onNewAsset\('msx2gameflow'\)/.test(toolbar));
addCheck('explorer has MSX2 Game Flows folder', /msx2gameflow:\s*"MSX2 Game Flows"/.test(explorer));
addCheck('explorer maps msx2gameflow editor', /msx2gameflow:\s*EditorType\.Msx2GameFlow/.test(explorer));
addCheck('AppUI routes Msx2GameFlow editor', /EditorType\.Msx2GameFlow/.test(appUi) && /Msx2GameFlowEditor/.test(appUi));
addCheck('editor only picks msx2presentation', /assetTypeToPick="msx2presentation"/.test(editor));
addCheck(
  'MSX2 GameFlow validates selected presentation id by asset type before storing',
  /allAssets\.find\(asset => asset\.id === presentationAssetId && asset\.type === 'msx2presentation'\)/.test(editor)
);
addCheck('MSX2 GameFlow editor never references MSX1 presentationscreen assets', !editor.includes('presentationscreen'));
addCheck(
  'MSX2 GameFlow editor does not pass mixed presentation picker array',
  !/assetTypeToPick=\{\[['"]presentationscreen['"],\s*['"]msx2presentation['"]\]\}/.test(editor)
);
addCheck(
  'MSX1 GameFlow presentation picker remains MSX1-only',
  gameFlowEditor.includes("assetType: 'presentationscreen'") && !gameFlowEditor.includes("['presentationscreen', 'msx2presentation']")
);
addCheck(
  'MSX1 GameFlowNodeType not extended with MSX2-only node',
  /export type GameFlowNodeType = '[^;]+';/.test(types) && !/export type GameFlowNodeType = [^;]*Screen5Presentation/.test(types)
);
addCheck(
  'MSX1 GameFlowNodeType remains exact legacy contract',
  types.includes("export type GameFlowNodeType = 'Start' | 'SubMenu' | 'Controls' | 'WorldLink' | 'End' | 'Text' | 'TextScroll' | 'TextScrollColor' | 'TextScroll2' | 'Restart' | 'Waypoint' | 'Transition' | 'Group' | 'IfThenElse' | 'Music' | 'Globals' | 'PresentationScreen';")
);
addCheck(
  'MSX2 GameFlowNodeType is minimal and separate',
  types.includes("export type Msx2GameFlowNodeType = 'Start' | 'Screen5Presentation' | 'Transition' | 'End';")
);
addCheck(
  'MSX1 GameFlowNode union does not include MSX2 nodes',
  !/export type GameFlowNode[\s\S]*Msx2GameFlow/.test(types.split('// --- MSX2 Game Flow Types ---')[0])
);
addCheck(
  'MSX2 GameFlowNode union does not include MSX1 nodes',
  !/export type Msx2GameFlowNode[\s\S]*(SubMenu|WorldLink|TextScroll|PresentationScreen)/.test(types.split('// --- End Game Flow Types ---')[0].split('// --- MSX2 Game Flow Types ---')[1] || '')
);
const findMainGameFlowBlock = summaryExtractor.match(/function findMainGameFlow[\s\S]*?function extractUsedWorldMaps/)?.[0] || '';
addCheck('summary extractor still selects only MSX1 gameflow for mainGameFlow', /asset\.type === 'gameflow'/.test(findMainGameFlowBlock) && !findMainGameFlowBlock.includes("asset.type === 'msx2gameflow'"));
addCheck('summary extractor carries MSX2 gameflows separately', summaryExtractor.includes('msx2GameFlows: any[]') && summaryExtractor.includes('extractMsx2GameFlows(assets, usedAssets)') && summaryExtractor.includes("asset.type === 'msx2gameflow'"));
addCheck('legacy ASM analysis still selects only MSX1 gameflow for gameFlow', /const gameFlowAsset = assets\.find\(a => a\.type === 'gameflow'\)/.test(asmTemplate));
addCheck('ASM analysis carries MSX2 gameflow assets separately', asmTemplate.includes('msx2GameFlows') && asmTemplate.includes("a.type === 'msx2gameflow'"));
addCheck('summary conversion carries MSX2 gameflow separately', generatorIndex.includes('msx2GameFlows') && generatorIndex.includes('summaryAssets.msx2GameFlows'));
addCheck('SCREEN 5 generator resolves MSX2 gameflow presentation node', screen5PresentationGenerator.includes('resolveMsx2GameFlowPresentationNode') && screen5PresentationGenerator.includes("node.type === 'Screen5Presentation'"));
addCheck('SCREEN 5 generator selects presentation by msx2gameflow asset id', screen5PresentationGenerator.includes('requestedPresentationAssetId') && screen5PresentationGenerator.includes('presentationAssetId'));
addCheck('SCREEN 5 generator emits MSX2 gameflow markers', screen5PresentationGenerator.includes('MSX2_GAMEFLOW_PRESENT') && screen5PresentationGenerator.includes('MSX2_GAMEFLOW_SCREEN5_NODE'));

const failed = checks.filter(check => !check.ok);
for (const check of checks) {
  console.log(`${check.ok ? 'ok' : 'FAIL'} - ${check.name}${check.detail ? `: ${check.detail}` : ''}`);
}

if (failed.length > 0) {
  console.error(`\n${failed.length} MSX2 GameFlow contract check(s) failed.`);
  process.exit(1);
}

console.log('\nMSX2 GameFlow contract checks passed.');
