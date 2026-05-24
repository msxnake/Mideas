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
const globalVariablesUtils = read('utils/globalVariablesUtils.ts');
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
addCheck('MSX2 gameflow default includes terminal fade transition', msx2GameflowCase.includes("type: 'Transition'") && msx2GameflowCase.includes("effect: 'fade_to_black'") && msx2GameflowCase.includes('durationFrames: 30'));
addCheck('MSX2 gameflow default includes End node', msx2GameflowCase.includes("type: 'End'"));
addCheck('MSX2 gameflow default creates presentation-transition-end connections', (msx2GameflowCase.match(/from:\s*\{\s*nodeId:/g) || []).length >= 3 && msx2GameflowCase.includes('msx2_gfc_screen5_transition') && msx2GameflowCase.includes('msx2_gfc_transition_end'));
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
addCheck('MSX2 GameFlow editor exposes explicit outgoing connection controls', editor.includes('connectSelectedNodeTo') && editor.includes('Clear Connection') && editor.includes('Next node'));
addCheck('MSX2 GameFlow editor exposes SCREEN 5 runtime wait controls', editor.includes('updateSelectedPresentationRuntime') && editor.includes('GameFlow runtime override') && editor.includes('Wait for key') && editor.includes('Wait frames') && editor.includes('waitForKey') && editor.includes('waitFrames') && editor.includes('disabled={selectedPresentationNode.waitForKey !== false}'));
addCheck('MSX2 GameFlow editor exposes transition duration controls', editor.includes('updateSelectedTransitionDuration') && editor.includes('Duration frames') && editor.includes('durationFrames') && editor.includes('Math.max(0, Math.min(255'));
addCheck('MSX2 GameFlow editor exposes low-risk control nodes', editor.includes("addNode('Waypoint')") && editor.includes("addNode('Restart')") && editor.includes("addNode('Globals')") && editor.includes("addNode('Text')") && editor.includes("addNode('IfThenElse')") && editor.includes("sourceId === 'then'") && editor.includes("sourceId === 'else'") && editor.includes('getNextExportNode') && editor.includes('nodes do not have outgoing connections'));
addCheck('MSX2 GameFlow intro template includes terminal transition', editor.includes('applyIntroTemplate') && editor.includes("type: 'Transition'") && editor.includes("effect: 'fade_to_black'") && editor.includes('durationFrames: 30'));
addCheck('MSX2 GameFlow editor validates exportable SCREEN 5 flow shape', editor.includes('flowIssues') && editor.includes('Flow status') && editor.includes('Export path:') && editor.includes('flowPath.map((item, index)') && editor.includes("presentationNode?.type !== 'Screen5Presentation'") && editor.includes('Start should reach a SCREEN 5 Presentation node through optional Waypoint/Globals nodes') && editor.includes('Missing SCREEN 5 Presentation node') && editor.includes('SCREEN 5 node has no valid presentation asset') && editor.includes('SCREEN 5 node should continue to Text, Transition, Restart, or End') && editor.includes('SCREEN 5 node can only continue to Text, IfThenElse, Transition, Restart, or End') && editor.includes('Text node must include a message') && editor.includes('Text node should continue to Transition, Restart, or End') && editor.includes('IfThenElse must select a global variable') && editor.includes('IfThenElse must have THEN and ELSE branches') && editor.includes('branch can only continue to Text, Transition, Restart, or End') && editor.includes("afterTransition?.type !== 'End'") && editor.includes("afterTransition?.type !== 'Restart'") && editor.includes('Terminal Transition should continue to Restart or End') && editor.includes('Export path contains a cycle') && editor.includes('flowHasAnyCycle') && editor.includes('Flow contains a cycle') && editor.includes('Flow contains a connection to a missing node') && editor.includes('Orphaned node') && editor.includes('nodes do not support outgoing connections') && editor.includes('has more than one outgoing connection'));
addCheck('MSX2 GameFlow preview does not hide broken presentation references with fallback assets', editor.includes('return selectedAssetId ? selectedAsset : presentationAssets[0]') && editor.includes("clearRect(0, 0, canvas.width, canvas.height)"));
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
  'MSX2 GameFlowNodeType is separate and includes SCREEN 5 control nodes',
  types.includes("export type Msx2GameFlowNodeType = 'Start' | 'Globals' | 'Screen5Presentation' | 'Text' | 'Waypoint' | 'IfThenElse' | 'Transition' | 'Restart' | 'End';")
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
addCheck('global variable usage scanner includes MSX2 gameflow Globals nodes', globalVariablesUtils.includes("a.type === 'gameflow' || a.type === 'msx2gameflow'") && globalVariablesUtils.includes('varAssignment.variableName || varAssignment.name'));
addCheck('summary conversion carries MSX2 gameflow separately', generatorIndex.includes('msx2GameFlows') && generatorIndex.includes('summaryAssets.msx2GameFlows'));
addCheck('SCREEN 5 generator resolves MSX2 gameflow presentation node', screen5PresentationGenerator.includes('resolveMsx2GameFlowPresentationNode') && screen5PresentationGenerator.includes('getNextExportNode') && screen5PresentationGenerator.includes("nextNode?.type === 'Screen5Presentation'"));
addCheck('SCREEN 5 generator selects presentation by msx2gameflow asset id', screen5PresentationGenerator.includes('requestedPresentationAssetId') && screen5PresentationGenerator.includes('presentationAssetId'));
addCheck('SCREEN 5 generator fails on missing msx2gameflow presentation asset', screen5PresentationGenerator.includes('references missing msx2presentation asset') && screen5PresentationGenerator.includes('throw new Error'));
addCheck('SCREEN 5 generator rejects invalid MSX2 gameflow shape', screen5PresentationGenerator.includes('must reach Screen5Presentation from Start through optional Waypoint nodes') && screen5PresentationGenerator.includes('must continue to End, Restart, or terminal Transition') && screen5PresentationGenerator.includes('must select a global variable') && screen5PresentationGenerator.includes('nodeAfterTransition') && screen5PresentationGenerator.includes('must continue to End or Restart'));
addCheck('SCREEN 5 generator emits MSX2 gameflow markers', screen5PresentationGenerator.includes('MSX2_GAMEFLOW_PRESENT') && screen5PresentationGenerator.includes('MSX2_GAMEFLOW_SCREEN5_NODE'));
addCheck('SCREEN 5 generator emits terminal MSX2 transition runtime', screen5PresentationGenerator.includes('resolveNextExportStep') && screen5PresentationGenerator.includes('MSX2_GAMEFLOW_NEXT_TRANSITION') && screen5PresentationGenerator.includes('MSX2_GAMEFLOW_TERMINAL_ACTION') && screen5PresentationGenerator.includes('msx2_gameflow_run_transition') && screen5PresentationGenerator.includes('load_screen5_black_palette') && screen5PresentationGenerator.includes('clear_screen5_visible_vram') && screen5PresentationGenerator.includes('jp init_rom'));
addCheck('SCREEN 5 generator emits MSX2 Globals runtime writes', screen5PresentationGenerator.includes('Msx2GameFlowGlobalsNode') && screen5PresentationGenerator.includes('MSX2_GAMEFLOW_INITIAL_GLOBALS') && screen5PresentationGenerator.includes('MSX2_GAMEFLOW_AFTER_PRESENTATION_GLOBALS') && screen5PresentationGenerator.includes('MSX2_GAMEFLOW_AFTER_TRANSITION_GLOBALS') && screen5PresentationGenerator.includes('msx2_gameflow_apply_initial_globals') && screen5PresentationGenerator.includes('global_var_') && screen5PresentationGenerator.includes('EQU #'));
addCheck('SCREEN 5 generator emits MSX2 Text runtime', screen5PresentationGenerator.includes('Msx2GameFlowTextNode') && screen5PresentationGenerator.includes('MSX2_GAMEFLOW_TEXT') && screen5PresentationGenerator.includes('MSX2_GAMEFLOW_TEXT_NODE') && screen5PresentationGenerator.includes('renderScreen5TextBlock') && screen5PresentationGenerator.includes('screen5TextBlockCall') && screen5PresentationGenerator.includes('(y + row) * BYTES_PER_LINE') && screen5PresentationGenerator.includes('call LDIRVM'));
addCheck('SCREEN 5 generator emits MSX2 IfThenElse runtime branches', screen5PresentationGenerator.includes('Msx2GameFlowIfThenElseNode') && screen5PresentationGenerator.includes('MSX2_GAMEFLOW_IFTHENELSE') && screen5PresentationGenerator.includes('msx2_gameflow_compare_hl_de') && screen5PresentationGenerator.includes('msx2_gameflow_branch_then') && screen5PresentationGenerator.includes('msx2_gameflow_branch_else') && screen5PresentationGenerator.includes("'then'") && screen5PresentationGenerator.includes("'else'"));

const failed = checks.filter(check => !check.ok);
for (const check of checks) {
  console.log(`${check.ok ? 'ok' : 'FAIL'} - ${check.name}${check.detail ? `: ${check.detail}` : ''}`);
}

if (failed.length > 0) {
  console.error(`\n${failed.length} MSX2 GameFlow contract check(s) failed.`);
  process.exit(1);
}

console.log('\nMSX2 GameFlow contract checks passed.');
