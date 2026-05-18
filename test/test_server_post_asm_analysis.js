/**
 * Regression checks for the server-side post-ASM analysis endpoint.
 */

import fs from 'fs';
import { createRequire } from 'module';

console.log('Server post-ASM analysis regression test\n');

const serverSource = fs.readFileSync('server/server.js', 'utf8');
const modalSource = fs.readFileSync('components/modals/CodeExportModal.tsx', 'utf8');
const backendMatrixSource = fs.readFileSync('scripts/run_post_asm_backend_route_matrix.cjs', 'utf8');
const downloadsMatrixSource = fs.readFileSync('scripts/run_post_asm_deadblocks_matrix.ps1', 'utf8');
const require = createRequire(import.meta.url);
const { __postAsmAnalysisForTests } = require('../server/server.js');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

try {
  const {
    POST_ASM_ANALYSIS_RULES,
    normalizePostAsmRuleIds,
    normalizePostAsmPasses,
    buildPostAsmAnalysisSummary,
    comparePostAsmInvariants,
    analyzePostAsmCode,
    optimizePostAsmCode,
  } = __postAsmAnalysisForTests;

  assert(
    serverSource.includes("app.post('/analyze-post-asm'"),
    'Server must expose a dedicated post-ASM analysis endpoint'
  );
  assert(
    serverSource.includes("app.post('/optimize-post-asm'"),
    'Server must expose a separate post-ASM optimization endpoint'
  );
  assert(
    serverSource.includes('optimizedAsmDownloadUrl') && serverSource.includes('optimizedRomDownloadUrl'),
    'Optimization endpoint must return separate optimized ASM/ROM download URLs'
  );
  assert(
    serverSource.includes('Post-ASM analysis completed; no patches were applied'),
    'Endpoint response must make analysis-only behavior explicit'
  );
  assert(
    serverSource.includes("'--report-json'") && serverSource.includes("'--report-md'"),
    'Endpoint helper must request machine-readable and markdown reports'
  );
  assert(
    modalSource.includes("fetch(buildBackendUrl('/analyze-post-asm')"),
    'Code export modal must call the post-ASM analysis endpoint'
  );
  assert(
    modalSource.includes('Analyze unused ASM') && modalSource.includes('Post-ASM Analysis'),
    'Code export modal must expose the analysis action and result panel'
  );
  assert(
    modalSource.includes("fetch(buildBackendUrl('/optimize-post-asm')") &&
      modalSource.includes('Apply unused ASM (validated)') &&
      modalSource.includes('Post-ASM Optimized Artifact'),
    'Code export modal must expose optimization as a separate validated artifact flow'
  );
  assert(
    modalSource.includes('Invariants:') && modalSource.includes('invariantCheck?.errors'),
    'Code export modal must surface backend invariant validation'
  );
  assert(
    modalSource.includes('postAsmOptimizationResult.optimizedAsmDownloadUrl') &&
      modalSource.includes('postAsmOptimizationResult.optimizedRomDownloadUrl') &&
      modalSource.includes('buildBackendUrl(postAsmOptimizationResult.optimizedAsmDownloadUrl'),
    'Code export modal must download optimized ASM/ROM as separate artifacts'
  );
  const optimizeHandlerStart = modalSource.indexOf('const handleOptimizePostAsm');
  const optimizeHandlerEnd = modalSource.indexOf('const handleCompileCode', optimizeHandlerStart);
  const optimizeHandlerSource = modalSource.slice(optimizeHandlerStart, optimizeHandlerEnd);
  assert(optimizeHandlerStart >= 0 && optimizeHandlerEnd > optimizeHandlerStart, 'Test must find the optimization handler');
  assert(
    !optimizeHandlerSource.includes('setGeneratedCode(') &&
      !optimizeHandlerSource.includes('setGeneratedFiles(') &&
      !optimizeHandlerSource.includes('setActiveFileIndex('),
    'Optimization handler must not replace the active ASM textarea or file tabs'
  );
  assert(
    modalSource.includes("rules: ['dead-blocks', 'unused-runtime-labels', 'inactive-feature-runtime', 'unused-screen-loaders', 'unused-boss-attack-runtime', 'unused-component-runtime', 'state-machine-dispatch-handlers']"),
    'UI analysis must include conservative dead-code, inactive-feature, component, state-machine dispatch, and screen-loader rules'
  );
  assert(
    modalSource.includes("rules: ['dead-blocks', 'unused-screen-loaders', 'inactive-feature-runtime', 'unused-boss-attack-runtime', 'unused-component-runtime', 'state-machine-dispatch-handlers']"),
    'UI optimization must request only patch-enabled post-ASM rules'
  );
  assert(
    backendMatrixSource.includes('dead-blocks,unused-screen-loaders,inactive-feature-runtime,unused-boss-attack-runtime,unused-component-runtime,state-machine-dispatch-handlers'),
    'Backend route matrix defaults must include every patch-enabled post-ASM rule'
  );
  assert(
    downloadsMatrixSource.includes('dead-blocks,unused-screen-loaders,inactive-feature-runtime,unused-boss-attack-runtime,unused-component-runtime,state-machine-dispatch-handlers'),
    'Downloads smoke matrix defaults must include every patch-enabled post-ASM rule'
  );

  assert(
    JSON.stringify(normalizePostAsmRuleIds(undefined)) === JSON.stringify(POST_ASM_ANALYSIS_RULES),
    'Default analysis rules must stay focused on dead-code signals'
  );
  assert(
    JSON.stringify(normalizePostAsmRuleIds('dead-blocks,dead-blocks')) === JSON.stringify(['dead-blocks']),
    'Rule normalization must deduplicate repeated ids'
  );
  assert(
    JSON.stringify(normalizePostAsmRuleIds('unused-screen-loaders')) === JSON.stringify(['unused-screen-loaders']),
    'Server rule normalization must accept conservative report-only loader rules'
  );
  assert(
    JSON.stringify(normalizePostAsmRuleIds('unused-boss-attack-runtime')) === JSON.stringify(['unused-boss-attack-runtime']),
    'Server rule normalization must accept validated boss attack pruning rules'
  );
  assert(
    JSON.stringify(normalizePostAsmRuleIds('unused-component-runtime')) === JSON.stringify(['unused-component-runtime']),
    'Server rule normalization must accept conservative component runtime analysis'
  );
  assert(
    JSON.stringify(normalizePostAsmRuleIds('state-machine-dispatch-handlers')) === JSON.stringify(['state-machine-dispatch-handlers']),
    'Server rule normalization must accept conservative state-machine dispatch diagnostics'
  );

  let unknownRuleRejected = false;
  try {
    normalizePostAsmRuleIds('dead-blocks,unsafe-delete-everything');
  } catch (_) {
    unknownRuleRejected = true;
  }
  assert(unknownRuleRejected, 'Unknown post-ASM rules must be rejected');
  assert(normalizePostAsmPasses(0) === 1, 'Post-ASM passes must have a safe lower bound');
  assert(normalizePostAsmPasses(99) === 7, 'Post-ASM passes must have a conservative upper bound');

  const reportSummary = buildPostAsmAnalysisSummary(
    {
      findings: [{ rule_id: 'dead-blocks' }],
      blocks: [{ id: 'live' }, { id: 'dead' }],
      applied_patches: 0,
      metrics: {
        original_line_count: 20,
        output_line_count: 20,
        block_inventory: {
          dead_block_candidates: 1,
          dead_candidate_lines: 4,
          dead_candidate_source_bytes: 96,
        },
        selected_rules: ['dead-blocks', 'inactive-feature-runtime'],
        by_rule: {
          'unused-runtime-labels': { findings: 2 },
          'inactive-feature-runtime': { findings: 1 },
          'unused-screen-loaders': { findings: 4 },
          'unused-boss-attack-runtime': { findings: 5 },
          'unused-component-runtime': { findings: 3 },
          'state-machine-dispatch-handlers': { findings: 6 },
        },
      },
    },
    ['dead-blocks', 'unused-runtime-labels', 'inactive-feature-runtime']
  );
  assert(reportSummary.mode === 'analysis-only', 'Summary must identify analysis-only mode');
  assert(reportSummary.deadBlockCandidates === 1, 'Summary must expose dead-block candidate count');
  assert(reportSummary.inactiveFeatureRuntime === 1, 'Summary must expose inactive-feature runtime count');
  assert(reportSummary.unusedScreenLoaders === 4, 'Summary must expose unused screen-loader count');
  assert(reportSummary.unusedBossAttackRuntime === 5, 'Summary must expose unused boss attack runtime count');
  assert(reportSummary.unusedComponentRuntime === 3, 'Summary must expose unused component runtime count');
  assert(reportSummary.stateMachineDispatchHandlers === 6, 'Summary must expose state-machine dispatch handler count');
  assert(reportSummary.appliedPatches === 0, 'Analysis summary must not report applied patches');
  assert(
    JSON.stringify(reportSummary.selectedRules) === JSON.stringify(['dead-blocks', 'inactive-feature-runtime']),
    'Summary must expose selected post-ASM rules from report metrics'
  );

  const asm = `
boot_entry:
    call live_label
    ret

; @mideas:block id=live_block kind=component owner=test roots=boot
live_label:
    ret
; @mideas:endblock id=live_block

; @mideas:block id=dead_block kind=component owner=test
init_auto_destroy_system:
    ret
; @mideas:endblock id=dead_block
`.trim();

  const result = await analyzePostAsmCode(asm, { projectName: 'post asm endpoint test' });
  assert(result.summary.appliedPatches === 0, 'Server analysis helper must not apply patches');
  assert(result.summary.selectedRules.includes('dead-blocks'), 'Server analysis summary must expose selected rules');
  assert(result.summary.deadBlockCandidates === 1, 'Server analysis helper must report the dead block');
  assert(
    result.report.findings.some((finding) => finding.rule_id === 'dead-blocks' && finding.routine === 'dead_block'),
    'Server analysis helper must return dead-block findings in the JSON report'
  );

  const invariantPass = comparePostAsmInvariants(asm, asm, result.report);
  assert(invariantPass.ok, 'Invariant check must pass when ASM is unchanged');
  const invariantFail = comparePostAsmInvariants(asm, asm.replace('live_label:', '; live_label:'), result.report);
  assert(!invariantFail.ok, 'Invariant check must fail when a live annotated label disappears');
  assert(
    invariantFail.errors.some((error) => error.id === 'required-labels'),
    'Invariant failure must identify missing required labels'
  );
  const removedLabelReport = {
    ...result.report,
    metrics: {
      ...(result.report.metrics || {}),
      optimization_summary: {
        ...((result.report.metrics || {}).optimization_summary || {}),
        removed_labels: ['live_label'],
      },
    },
  };
  const invariantAllowedRemoval = comparePostAsmInvariants(
    asm,
    asm.replace('live_label:', '; live_label:'),
    removedLabelReport
  );
  assert(
    invariantAllowedRemoval.ok,
    'Invariant check must allow labels explicitly removed by the optimizer report'
  );

  const resourceAsm = `
resource_table:
    dw tile_data
    db 1
resource_bank_table:
    db 2
resource_address_table:
    dw tile_data
resource_size_table:
    dw 3
next_label:
    ret
tile_data:
    db 1, 2, 3
`.trim();
  const resourceInvariantPass = comparePostAsmInvariants(resourceAsm, resourceAsm, { blocks: [], block_analysis: [] });
  assert(resourceInvariantPass.ok, 'Resource metadata invariant must pass when ASM is unchanged');
  assert(
    resourceInvariantPass.resourceMetadata?.original?.labels?.resource_table?.checksum,
    'Invariant result must expose resource table metadata checksums'
  );
  const resourceInvariantFail = comparePostAsmInvariants(
    resourceAsm,
    resourceAsm.replace('    db 2', '    db 3'),
    { blocks: [], block_analysis: [] }
  );
  assert(!resourceInvariantFail.ok, 'Resource metadata invariant must fail when table bytes change');
  assert(
    resourceInvariantFail.errors.some((error) => error.id === 'resource-metadata'),
    'Resource metadata invariant failure must identify changed table fingerprints'
  );

  const optimized = await optimizePostAsmCode(asm, {
    projectName: 'post asm optimize endpoint test',
    passes: 3,
    validateGlass: false,
  });
  assert(optimized.summary.mode === 'apply-unvalidated', 'Optimization helper summary must identify apply mode when Glass is skipped');
  assert(optimized.summary.appliedPatches === 1, 'Optimization helper must apply the dead-block patch');
  assert(optimized.invariantCheck?.ok, 'Optimization helper must include a passing invariant check');
  assert(
    !optimized.optimizedCode.includes('init_auto_destroy_system:'),
    'Optimized ASM must remove dead candidate labels even when their names look critical'
  );
  assert(optimized.optimizedCode.includes('live_label:'), 'Optimized ASM must preserve live blocks');

  const screenLoaderAsm = `
; [[[MIDEAS_ARTIFACT:project_usage.json:BEGIN]]]
; {
;   "scenes": [{"id": "screenmap_1234567890123", "name": "Dead Screen", "index": 0, "resourceCount": 1}],
;   "gameFlowReachability": {"scenes": [{"id": "screenmap_1234567890123", "reachable": false, "reason": "not reached from GameFlow start graph"}]}
; }
; [[[MIDEAS_ARTIFACT:project_usage.json:END]]]

boot_entry:
    ret

load_screen_dead_screen_234567890123_far:
    call load_screen_dead_screen_234567890123
    ret

; @mideas:block id=runtime.screens.load_screen_dead_screen_234567890123.loader kind=routine owner=screens roots=load_screen_dead_screen_234567890123
load_screen_dead_screen_234567890123:
    ret
; @mideas:endblock id=runtime.screens.load_screen_dead_screen_234567890123.loader
`.trim();
  const screenLoaderOptimized = await optimizePostAsmCode(screenLoaderAsm, {
    projectName: 'post asm screen loader optimize endpoint test',
    rules: ['unused-screen-loaders'],
    passes: 3,
    validateGlass: false,
  });
  assert(screenLoaderOptimized.summary.appliedPatches === 2, 'Optimization helper must apply unreachable screen-loader patches');
  assert(
    !screenLoaderOptimized.optimizedCode.includes('load_screen_dead_screen_234567890123'),
    'Optimized ASM must remove unreachable screen loader wrapper and body'
  );

  const inactiveAudioAsm = `
; [[[MIDEAS_ARTIFACT:project_usage.json:BEGIN]]]
; {
;   "features": {"sounds": false},
;   "counts": {"sounds": 0, "tracks": 0}
; }
; [[[MIDEAS_ARTIFACT:project_usage.json:END]]]

boot_entry:
    ret

task_audio_tick_far:
    ret

show_menu_main:
    ret
`.trim();
  const inactiveAudioOptimized = await optimizePostAsmCode(inactiveAudioAsm, {
    projectName: 'post asm inactive audio optimize endpoint test',
    rules: ['inactive-feature-runtime'],
    passes: 3,
    validateGlass: false,
  });
  assert(inactiveAudioOptimized.summary.appliedPatches === 1, 'Optimization helper must apply safe inactive-audio patches');
  assert(
    !inactiveAudioOptimized.optimizedCode.includes('task_audio_tick_far:'),
    'Optimized ASM must remove inactive audio labels without external references'
  );
  assert(
    inactiveAudioOptimized.optimizedCode.includes('show_menu_main:'),
    'Optimized ASM must keep inactive non-audio families report-only'
  );
  assert(
    inactiveAudioOptimized.summary.removedLines > 0 && inactiveAudioOptimized.summary.removedSourceBytes > 0,
    'Optimization summary must expose total removed lines and source bytes'
  );

  const unusedComponentAsm = `
; [[[MIDEAS_ARTIFACT:project_usage.json:BEGIN]]]
; {
;   "features": {"components": true},
;   "counts": {"components": 1},
;   "componentRuntime": {
;     "usedComponents": ["Position"],
;     "componentCounts": {"Input": 0, "Position": 1}
;   }
; }
; [[[MIDEAS_ARTIFACT:project_usage.json:END]]]

boot_entry:
    ret

update_input_component:
    ld a, 1
    ret

update_position_component:
    ret
`.trim();
  const unusedComponentOptimized = await optimizePostAsmCode(unusedComponentAsm, {
    projectName: 'post asm component runtime apply test',
    rules: ['unused-component-runtime'],
    passes: 3,
    validateGlass: false,
  });
  assert(unusedComponentOptimized.summary.appliedPatches === 1, 'Optimization helper must apply unused component runtime patches');
  assert(
    !unusedComponentOptimized.optimizedCode.includes('update_input_component:'),
    'Optimized ASM must remove unused component runtime labels without external references'
  );
  assert(
    unusedComponentOptimized.optimizedCode.includes('update_position_component:'),
    'Optimized ASM must preserve used component runtime labels'
  );
  assert(
    unusedComponentOptimized.summary.ruleMetrics?.['unused-component-runtime']?.removedLines > 0,
    'Summary must expose per-rule removal metrics for unused component runtime'
  );

  const unusedBossAttackAsm = `
; [[[MIDEAS_ARTIFACT:project_usage.json:BEGIN]]]
; {
;   "features": {"bosses": true},
;   "counts": {"bosses": 1, "bossInstances": 1},
;   "bossAttackRuntime": {"usedTypes": ["Laser"]}
; }
; [[[MIDEAS_ARTIFACT:project_usage.json:END]]]

boot_entry:
    ret

update_boss_projectile_runtime_far:
    ret

draw_boss_projectile_attack_far:
    ret

draw_boss_laser_attack_far:
    ret
`.trim();
  const unusedBossAttackOptimized = await optimizePostAsmCode(unusedBossAttackAsm, {
    projectName: 'post asm boss attack runtime apply test',
    rules: ['unused-boss-attack-runtime'],
    passes: 3,
    validateGlass: false,
  });
  assert(unusedBossAttackOptimized.summary.appliedPatches === 2, 'Optimization helper must apply unused boss attack runtime patches');
  assert(
    !unusedBossAttackOptimized.optimizedCode.includes('update_boss_projectile_runtime_far:') &&
      !unusedBossAttackOptimized.optimizedCode.includes('draw_boss_projectile_attack_far:'),
    'Optimized ASM must remove unused boss attack runtime labels without external references'
  );
  assert(
    unusedBossAttackOptimized.optimizedCode.includes('draw_boss_laser_attack_far:'),
    'Optimized ASM must preserve boss attack runtime labels whose type is used'
  );

  const stateMachineDispatchAsm = `
; [[[MIDEAS_ARTIFACT:project_usage.json:BEGIN]]]
; {
;   "stateMachineRuntime": {
;     "usedActionIds": [3],
;     "usedConditionIds": []
;   }
; }
; [[[MIDEAS_ARTIFACT:project_usage.json:END]]]

SM_ActionTable:
    DW Action_SetVelocity ; 3

SM_ConditionTable:
    DW Condition_KeyPressed ; 4

Action_SetVelocity:
    ret

Condition_KeyPressed:
    ret
`.trim();
  const stateMachineDispatchOptimized = await optimizePostAsmCode(stateMachineDispatchAsm, {
    projectName: 'post asm state machine dispatch apply test',
    rules: ['state-machine-dispatch-handlers'],
    passes: 3,
    validateGlass: false,
  });
  assert(stateMachineDispatchOptimized.summary.appliedPatches === 2, 'Optimization helper must patch unused state-machine dispatch entry and handler');
  assert(
    stateMachineDispatchOptimized.optimizedCode.includes('DW 0 ; 4 unused Condition_KeyPressed'),
    'Optimized ASM must null unused state-machine dispatch table entries'
  );
  assert(
    !stateMachineDispatchOptimized.optimizedCode.includes('Condition_KeyPressed:'),
    'Optimized ASM must remove unused state-machine dispatch handlers'
  );
  assert(
    stateMachineDispatchOptimized.optimizedCode.includes('Action_SetVelocity:'),
    'Optimized ASM must preserve used state-machine dispatch handlers'
  );

  console.log('OK: post-ASM endpoint is analysis-only by default.');
  console.log('OK: post-ASM rule normalization rejects unsafe unknown rules.');
  console.log('OK: server helper returns dead-block report data.');
  console.log('OK: server invariant check protects live annotated labels.');
  console.log('OK: server invariant check protects resource table metadata.');
  console.log('OK: server optimization helper writes a separate optimized ASM artifact.');
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exit(1);
}
